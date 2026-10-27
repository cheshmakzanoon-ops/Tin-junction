import { ACCELERATION, BRAKE_DECELERATION, MAX_COUNTER, MAX_SPEED, STEP_SECONDS } from "../model/types";
import { compileTurnoutRoutes } from "../track/turnout";
import type { NetworkConnection, NetworkSocketRef, TurnoutDefinition, TurnoutRoute, TurnoutRouteState, TurnoutTopology } from "../track/turnout";
import type { GraphPiece, RouteCursor } from "../track/graph";
import type { TrackPose } from "../track/centerline";
import { RoutedConsist } from "./routedConsist";
import type { OccupiedRouteInterval, RouteCommandResult, RoutedConsistSnapshot } from "./routedConsist";

export interface MotionProfile {
  readonly maxSpeed: number;
  readonly acceleration: number;
  readonly brakeDeceleration: number;
  readonly emergencyDeceleration: number;
  readonly endClearance: number;
}
export const DEFAULT_MOTION_PROFILE: MotionProfile = Object.freeze({
  maxSpeed: MAX_SPEED, acceleration: ACCELERATION, brakeDeceleration: BRAKE_DECELERATION,
  emergencyDeceleration: 0.36, endClearance: 0.001,
});
export interface RoutedMotionSnapshot {
  readonly format: "tin-junction-routed-motion";
  readonly schemaVersion: 1;
  readonly profile: MotionProfile;
  readonly consist: RoutedConsistSnapshot;
  readonly tick: number;
  readonly speed: number;
  readonly throttle: number;
  readonly signedTravel: number;
  readonly emergency: boolean;
}
export interface MotionTickResult {
  readonly tick: number;
  readonly travelled: number;
  readonly speed: number;
  readonly code: "stationary" | "moving" | "braking" | "route-end" | "safety-stop";
}
export type MotionBuildResult = { readonly ok: true; readonly motion: RoutedMotion } | { readonly ok: false; readonly code: string; readonly message: string };
const object = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === "object" && !Array.isArray(value);
const keys = (value: Record<string, unknown>, names: readonly string[]): boolean => Object.keys(value).length === names.length && names.every(name => Object.hasOwn(value, name));
const finite = (value: unknown, min: number, max: number): value is number => typeof value === "number" && Number.isFinite(value) && value >= min && value <= max;
const response = (ok: boolean, changed: boolean, code: string, message: string): RouteCommandResult => ({ ok, changed, code, message });
const invalid = (code: string, message: string): MotionBuildResult => ({ ok: false, code, message });
const DISTANCE_EPSILON = 1e-10;

function samePose(a: TrackPose, b: TrackPose): boolean { return a.x === b.x && a.y === b.y && a.z === b.z && a.yaw === b.yaw; }

/** Semantic geometry equality cannot depend on JSON property insertion order. */
function samePiece(a: GraphPiece | undefined, b: GraphPiece | undefined): boolean {
  if (!a || !b || a.id !== b.id || a.gauge !== b.gauge || a.profile !== b.profile || !samePose(a.pose, b.pose)) return false;
  return a.centerline.kind === "straight" ? b.centerline.kind === "straight" && a.centerline.length === b.centerline.length
    : b.centerline.kind === "arc" && a.centerline.radius === b.centerline.radius && a.centerline.sweep === b.centerline.sweep;
}

function sameTurnout(a: TurnoutDefinition | undefined, b: TurnoutDefinition | undefined): boolean {
  return !!a && !!b && a.id === b.id && samePose(a.pose, b.pose) && a.straightLength === b.straightLength && a.radius === b.radius && a.sweep === b.sweep;
}

const sameSocket = (a: NetworkSocketRef, b: NetworkSocketRef): boolean => a.pieceId === b.pieceId && a.socketId === b.socketId;
function sameConnection(a: NetworkConnection, b: NetworkConnection): boolean {
  return a.id === b.id && ((sameSocket(a.a, b.a) && sameSocket(a.b, b.b)) || (sameSocket(a.a, b.b) && sameSocket(a.b, b.a)));
}

function sameTurnoutConnections(a: TurnoutTopology, b: TurnoutTopology, turnoutId: string): boolean {
  const attached = (topology: TurnoutTopology) => topology.connections.filter(connection => connection.a.pieceId === turnoutId || connection.b.pieceId === turnoutId);
  const before = attached(a), after = new Map(attached(b).map(connection => [connection.id, connection]));
  return before.length === after.size && before.every(connection => { const candidate = after.get(connection.id); return candidate !== undefined && sameConnection(connection, candidate); });
}

function profileFrom(input: unknown): MotionProfile | null {
  if (!object(input) || !keys(input, ["maxSpeed", "acceleration", "brakeDeceleration", "emergencyDeceleration", "endClearance"])
    || !finite(input.maxSpeed, 0.001, MAX_SPEED) || !finite(input.acceleration, 0.01, 1)
    || !finite(input.brakeDeceleration, 0.02, 1) || !finite(input.emergencyDeceleration, input.brakeDeceleration, 2)
    || !finite(input.endClearance, 0.0002, 0.02)) return null;
  // The maximum ordinary stopping horizon must fit the bounded route query.
  if (input.maxSpeed ** 2 / (2 * input.brakeDeceleration) + input.maxSpeed * STEP_SECONDS + input.endClearance > 0.99) return null;
  return Object.freeze({ maxSpeed: input.maxSpeed, acceleration: input.acceleration, brakeDeceleration: input.brakeDeceleration,
    emergencyDeceleration: input.emergencyDeceleration, endClearance: input.endClearance });
}

/** Exact integral of a bounded linear velocity ramp, split when its target is reached. */
function ramp(speed: number, target: number, acceleration: number): { speed: number; distance: number } {
  const duration = Math.min(STEP_SECONDS, Math.abs(target - speed) / acceleration);
  const next = duration < STEP_SECONDS ? target : speed + Math.sign(target - speed) * acceleration * STEP_SECONDS;
  return { speed: Math.max(0, next), distance: (speed + next) * duration / 2 + next * (STEP_SECONDS - duration) };
}

/**
 * Single-train, fixed-60-Hz scalar authority for validated route topology.
 * It owns its consist: a caller cannot bypass braking or stopped reversal.
 * This format is deliberately separate from the app's existing oval document.
 */
export class RoutedMotion {
  readonly profile: MotionProfile;
  private consist: RoutedConsist;
  private elapsedTicks = 0;
  private velocity = 0;
  private demand = 0;
  private travel = 0;
  private emergencyBrake = false;

  private constructor(consist: RoutedConsist, profile: MotionProfile) { this.consist = consist; this.profile = profile; }

  static place(topology: TurnoutTopology, placement: unknown, profile: unknown = DEFAULT_MOTION_PROFILE): MotionBuildResult {
    const checked = profileFrom(profile);
    if (!checked) return invalid("motion-profile", "Use bounded positive speed and braking parameters.");
    const placed = RoutedConsist.place(topology, placement);
    return placed.ok ? { ok: true, motion: new RoutedMotion(placed.consist, checked) } : placed;
  }

  static restore(topology: TurnoutTopology, input: unknown, options: { restoreStopped?: boolean } = {}): MotionBuildResult {
    if (!object(input) || !keys(input, ["format", "schemaVersion", "profile", "consist", "tick", "speed", "throttle", "signedTravel", "emergency"])
      || input.format !== "tin-junction-routed-motion" || input.schemaVersion !== 1 || !Number.isSafeInteger(input.tick)
      || !finite(input.tick, 0, MAX_COUNTER) || !finite(input.throttle, 0, 1) || !finite(input.signedTravel, -1e9, 1e9)
      || typeof input.emergency !== "boolean") return invalid("motion-snapshot", "Invalid motion snapshot or bounded counters.");
    const profile = profileFrom(input.profile);
    if (!profile || !finite(input.speed, 0, profile.maxSpeed) || (input.emergency && input.throttle !== 0)) return invalid("motion-snapshot", "Invalid motion speed, profile or brake state.");
    const restored = RoutedConsist.restore(topology, input.consist);
    if (!restored.ok) return restored;
    const motion = new RoutedMotion(restored.consist, profile);
    motion.elapsedTicks = input.tick; motion.travel = input.signedTravel;
    if (options.restoreStopped === false) {
      const available = restored.consist.clearanceAhead(motion.horizon);
      const braking = input.emergency ? profile.emergencyDeceleration : profile.brakeDeceleration;
      if (available.blocked && input.speed ** 2 / (2 * braking) > Math.max(0, available.distance - profile.endClearance) + DISTANCE_EPSILON)
        return invalid("unsafe-stopping-distance", "Saved motion has insufficient connected track to brake safely.");
      motion.velocity = input.speed; motion.demand = input.throttle; motion.emergencyBrake = input.emergency;
    }
    return { ok: true, motion };
  }

  get tickCount(): number { return this.elapsedTicks; }
  get speed(): number { return this.velocity; }
  get throttle(): number { return this.demand; }
  get signedTravel(): number { return this.travel; }
  get direction(): 1 | -1 { return this.consist.direction; }
  get front(): RouteCursor { return this.consist.front; }
  get rear(): RouteCursor { return this.consist.rear; }
  get intervals(): readonly OccupiedRouteInterval[] { return this.consist.intervals; }
  get network(): TurnoutRouteState { return this.consist.network; }
  private get horizon(): number { return this.profile.maxSpeed ** 2 / (2 * this.profile.brakeDeceleration) + this.profile.maxSpeed * STEP_SECONDS + this.profile.endClearance + 0.000001; }

  setThrottle(value: number): RouteCommandResult {
    if (!finite(value, 0, 1)) return response(false, false, "throttle-range", "Throttle must be between zero and one.");
    if (this.emergencyBrake && this.velocity > 0 && value > 0) return response(false, false, "emergency-braking", "Wait for the emergency stop before applying power.");
    const changed = this.demand !== value;
    this.demand = value;
    if (this.velocity === 0) this.emergencyBrake = false;
    return response(true, changed, "throttle", value === 0 ? "Braking to a stop." : "Throttle set.");
  }

  stop(emergency = false): RouteCommandResult {
    if (typeof emergency !== "boolean") return response(false, false, "stop-shape", "Invalid stop command.");
    const changed = this.demand !== 0 || (emergency && !this.emergencyBrake && this.velocity > 0);
    this.demand = 0;
    // A repeated ordinary stop cannot downgrade a stronger active brake.
    this.emergencyBrake = (this.emergencyBrake || emergency) && this.velocity > 0;
    return response(true, changed, emergency ? "emergency-stop" : "stop", this.velocity > 0 ? "Braking to a stop." : "Train stopped.");
  }

  reverse(): RouteCommandResult {
    return this.consist.reverse(this.velocity === 0 && this.demand === 0);
  }

  selectTurnout(turnoutId: string, route: TurnoutRoute, expectedRevision = this.consist.switchRevision): RouteCommandResult {
    const candidate = RoutedConsist.restore(this.network.topology, this.consist.snapshot());
    if (!candidate.ok) return response(false, false, "route-state", candidate.message);
    const selected = candidate.consist.selectTurnout(turnoutId, route, expectedRevision);
    if (!selected.ok || !selected.changed) return selected;
    const available = candidate.consist.clearanceAhead(this.horizon);
    if (available.blocked && this.velocity ** 2 / (2 * this.profile.brakeDeceleration) > Math.max(0, available.distance - this.profile.endClearance) + DISTANCE_EPSILON)
      return response(false, false, "unsafe-stopping-distance", "Stop before selecting a route that is too short for safe braking.");
    this.consist = candidate.consist;
    return selected;
  }

  /** Atomic paused replacement: removed or moved occupied track is never installed. */
  replaceTopology(topology: TurnoutTopology, expectedRevision: number): RouteCommandResult {
    if (expectedRevision !== this.network.topology.revision || !Number.isSafeInteger(expectedRevision)) return response(false, false, "stale-topology", "Use the current track revision.");
    if (this.velocity !== 0 || this.demand !== 0) return response(false, false, "train-moving", "Stop the train before editing track.");
    if (!topology || !Number.isSafeInteger(topology.revision) || topology.revision <= expectedRevision) return response(false, false, "topology-revision", "Replacement track needs a newer validated revision.");
    const prior = this.consist.snapshot();
    if (!compileTurnoutRoutes(topology).ok) return response(false, false, "topology-shape", "Use a validated track topology.");
    // A turnout is one protected physical assembly, including its unselected
    // route and all attached sockets. Endpoint contact is protected as well.
    for (const id of this.consist.occupiedTurnouts()) {
      const before = this.network.topology.turnouts.find(turnout => turnout.id === id), after = topology.turnouts.find(turnout => turnout.id === id);
      if (!sameTurnout(before, after) || !sameTurnoutConnections(this.network.topology, topology, id))
        return response(false, false, "occupied-turnout-changed", "Keep the complete turnout and its connections unchanged until the entire train has cleared it.");
    }
    const selections = topology.turnouts.map(turnout => prior.selections.find(item => item.turnoutId === turnout.id) ?? { turnoutId: turnout.id, route: "straight" as const });
    const candidate = RoutedConsist.restore(topology, { ...prior, topologyRevision: topology.revision, selections });
    if (!candidate.ok) return response(false, false, "occupied-route-changed", "Keep or deliberately remove the train before changing its occupied track.");
    const occupiedIds = new Set(this.intervals.map(interval => this.network.graph.edges.find(edge => edge.id === interval.edgeId)!.pieceId));
    for (const id of occupiedIds) {
      const previous = this.network.graph.pieces.find(piece => piece.id === id), next = candidate.consist.network.graph.pieces.find(piece => piece.id === id);
      if (!samePiece(previous, next)) return response(false, false, "occupied-route-changed", "Moving occupied track would move the train; remove it first.");
    }
    this.consist = candidate.consist;
    return response(true, true, "topology-replaced", "Validated track replaced while the train stayed in place.");
  }

  /** Call only for due simulation ticks; renderer cadence and wall time never enter here. */
  step(): MotionTickResult {
    if (this.elapsedTicks >= MAX_COUNTER) throw new RangeError("Simulation tick limit reached.");
    const profile = this.profile, brake = this.emergencyBrake ? profile.emergencyDeceleration : profile.brakeDeceleration;
    const available = this.consist.clearanceAhead(this.horizon);
    const distanceToStop = available.blocked ? Math.max(0, available.distance - profile.endClearance) : Infinity;
    const demanded = this.demand * profile.maxSpeed;
    let next = ramp(this.velocity, demanded, demanded > this.velocity ? profile.acceleration : brake);
    let code: MotionTickResult["code"] = next.speed < this.velocity ? "braking" : next.distance > 0 ? "moving" : "stationary";
    // Reserve the complete continuous braking envelope after this tick. If the
    // power step cannot fit, brake now; no per-frame or endpoint teleport occurs.
    if (available.blocked && next.distance + next.speed ** 2 / (2 * brake) > distanceToStop + DISTANCE_EPSILON) {
      next = ramp(this.velocity, 0, brake); this.demand = 0; code = "route-end";
    }
    if (next.distance > distanceToStop + DISTANCE_EPSILON) {
      // Defensive boundary for an external geometry failure, never a normal
      // braking policy. Preserve a valid cursor and report the discontinuity.
      next = { speed: 0, distance: Math.max(0, distanceToStop) }; this.demand = 0; code = "safety-stop";
    }
    if (available.blocked && distanceToStop <= DISTANCE_EPSILON && next.speed === 0) { next.distance = 0; this.demand = 0; code = "route-end"; }
    const signed = next.distance * this.direction;
    if (!finite(this.travel + signed, -1e9, 1e9)) { next = { speed: 0, distance: 0 }; this.demand = 0; code = "safety-stop"; }
    const advanced = this.consist.advance(next.distance);
    if (!advanced.ok || advanced.blocked) { next.speed = 0; this.demand = 0; code = "safety-stop"; }
    this.velocity = next.speed; this.travel += advanced.travelled * this.direction; this.elapsedTicks++;
    if (this.velocity === 0) this.emergencyBrake = false;
    return { tick: this.elapsedTicks, travelled: advanced.travelled, speed: this.velocity, code };
  }

  snapshot(): RoutedMotionSnapshot {
    return { format: "tin-junction-routed-motion", schemaVersion: 1, profile: { ...this.profile }, consist: this.consist.snapshot(),
      tick: this.elapsedTicks, speed: this.velocity, throttle: this.demand, signedTravel: this.travel, emergency: this.emergencyBrake };
  }
}
