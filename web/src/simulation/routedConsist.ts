import { compileTurnoutRoutes, reverseTurnoutEdge, turnoutEdge, turnoutOwner } from "../track/turnout";
import type { TurnoutRoute, TurnoutRouteState, TurnoutSelection, TurnoutTopology } from "../track/turnout";
import type { RouteCursor } from "../track/graph";

/** A swept footprint includes every vehicle, coupler and front/rear overhang. */
export interface OccupiedRouteInterval { readonly edgeId: string; readonly from: number; readonly to: number }
export interface RoutedConsistSnapshot {
  readonly format: "tin-junction-routed-consist";
  readonly schemaVersion: 1;
  readonly topologyRevision: number;
  readonly switchRevision: number;
  readonly selections: readonly TurnoutSelection[];
  readonly trainId: string;
  readonly length: number;
  readonly direction: 1 | -1;
  readonly intervals: readonly OccupiedRouteInterval[];
}
export interface RouteCommandResult { readonly ok: boolean; readonly changed: boolean; readonly code: string; readonly message: string }
export interface RouteMovementResult extends RouteCommandResult { readonly travelled: number; readonly remaining: number; readonly blocked: boolean }
export type ConsistBuildResult = { readonly ok: true; readonly consist: RoutedConsist } | { readonly ok: false; readonly code: string; readonly message: string };
export const CONSIST_ROUTE_LIMITS = Object.freeze({ minLength: 0.001, maxLength: 1, maxMovement: 1, intervals: 2048, contactTolerance: 1e-10, lengthTolerance: 1e-9 });
const record = (input: unknown): input is Record<string, unknown> => input !== null && typeof input === "object" && !Array.isArray(input);
const keys = (input: Record<string, unknown>, required: readonly string[], optional: readonly string[] = []): boolean => required.every(key => Object.hasOwn(input, key)) && Object.keys(input).every(key => required.includes(key) || optional.includes(key));
const idValid = (value: unknown): value is string => typeof value === "string" && /^[A-Za-z0-9._:-]{1,128}$/.test(value);
const counter = (value: unknown): value is number => typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
const lengthValid = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value) && value >= CONSIST_ROUTE_LIMITS.minLength && value <= CONSIST_ROUTE_LIMITS.maxLength;
const result = (ok: boolean, changed: boolean, code: string, message: string): RouteCommandResult => Object.freeze({ ok, changed, code, message });
const invalid = (code: string, message: string): ConsistBuildResult => ({ ok: false, code, message });
const freezeIntervals = (intervals: readonly OccupiedRouteInterval[]): readonly OccupiedRouteInterval[] => Object.freeze(intervals.map(item => Object.freeze({ ...item })));

function selectedRouteEdge(state: TurnoutRouteState, edgeId: string): boolean {
  const owner = turnoutOwner(state, edgeId);
  if (!owner) return true;
  const selection = state.selections.find(item => item.turnoutId === owner)!;
  return turnoutEdge(state, edgeId).pieceId === `${owner}:route:${selection.route}`;
}

function appendInterval(intervals: OccupiedRouteInterval[], item: OccupiedRouteInterval): void {
  if (item.to <= item.from) return;
  const previous = intervals.at(-1);
  if (previous?.edgeId === item.edgeId && Math.abs(previous.to - item.from) <= CONSIST_ROUTE_LIMITS.contactTolerance) intervals[intervals.length - 1] = { edgeId: item.edgeId, from: previous.from, to: item.to };
  else intervals.push({ ...item });
}

/** Bounded walk emits the actual route crossed; no modulo path or inferred outgoing branch. */
function walk(state: TurnoutRouteState, cursor: RouteCursor, distance: number) {
  let edge = turnoutEdge(state, cursor.edgeId), offset = cursor.distance, remaining = distance, travelled = 0, transitions = 0;
  if (!Number.isFinite(offset) || offset < 0 || offset > edge.length) throw new RangeError("Invalid route cursor.");
  if (!selectedRouteEdge(state, edge.id)) throw new RangeError("The occupied turnout route is not selected.");
  const intervals: OccupiedRouteInterval[] = [];
  while (remaining > 0) {
    const step = Math.min(remaining, edge.length - offset);
    appendInterval(intervals, { edgeId: edge.id, from: offset, to: offset + step });
    offset += step; travelled += step; remaining -= step;
    if (remaining === 0 || !edge.nextEdgeId || !selectedRouteEdge(state, edge.nextEdgeId)) break;
    edge = turnoutEdge(state, edge.nextEdgeId); offset = 0;
    if (++transitions > CONSIST_ROUTE_LIMITS.intervals) throw new RangeError("Route traversal exceeds its bounded interval capacity.");
  }
  return { intervals, travelled, remaining };
}

function pathError(state: TurnoutRouteState, intervals: readonly OccupiedRouteInterval[], length: number): string | null {
  if (intervals.length < 1 || intervals.length > CONSIST_ROUTE_LIMITS.intervals) return "The consist needs a bounded, nonempty route history.";
  let measured = 0;
  const physical = new Map<string, { from: number; to: number }[]>();
  const turnoutRoutes = new Map<string, string>();
  for (let index = 0; index < intervals.length; index++) {
    const interval = intervals[index]!;
    if (!record(interval) || !keys(interval, ["edgeId", "from", "to"]) || typeof interval.edgeId !== "string") return "Malformed occupied route interval.";
    let edge;
    try { edge = turnoutEdge(state, interval.edgeId); } catch { return "An occupied route refers to an unknown edge."; }
    if (!Number.isFinite(interval.from) || !Number.isFinite(interval.to) || interval.from < 0 || interval.to > edge.length || interval.from >= interval.to) return "An occupied route interval is outside its physical edge.";
    const previous = intervals[index - 1];
    if (previous) {
      const previousEdge = turnoutEdge(state, previous.edgeId);
      if (previousEdge.nextEdgeId !== edge.id || Math.abs(previous.to - previousEdge.length) > CONSIST_ROUTE_LIMITS.contactTolerance || interval.from !== 0) return "The consist's retained route is disconnected or changed branches.";
    }
    const canonical = edge.direction === 1 ? { from: interval.from, to: interval.to } : { from: edge.length - interval.to, to: edge.length - interval.from };
    const existing = physical.get(edge.pieceId) ?? [];
    if (existing.some(item => Math.min(item.to, canonical.to) - Math.max(item.from, canonical.from) > CONSIST_ROUTE_LIMITS.contactTolerance)) return "The consist overlaps its own occupied track.";
    existing.push(canonical); physical.set(edge.pieceId, existing);
    const owner = turnoutOwner(state, edge.id);
    if (owner) {
      if (!selectedRouteEdge(state, edge.id)) return "An occupied turnout route does not match its latched selection.";
      const route = turnoutRoutes.get(owner);
      if (route && route !== edge.pieceId) return "One consist cannot occupy both protected routes of a turnout.";
      turnoutRoutes.set(owner, edge.pieceId);
    }
    measured += interval.to - interval.from;
  }
  if (Math.abs(measured - length) > CONSIST_ROUTE_LIMITS.lengthTolerance) return "The retained path does not cover the entire consist, including its overhangs.";
  // Nose and tail coinciding at a closed joint is also an invalid full-loop placement.
  const first = intervals[0]!, last = intervals.at(-1)!;
  const lastEdge = turnoutEdge(state, last.edgeId);
  if (intervals.length > 1 && ((first.edgeId === last.edgeId && Math.abs(first.from - last.to) <= CONSIST_ROUTE_LIMITS.contactTolerance)
    || (first.from <= CONSIST_ROUTE_LIMITS.contactTolerance && Math.abs(last.to - lastEdge.length) <= CONSIST_ROUTE_LIMITS.contactTolerance && lastEdge.nextEdgeId === first.edgeId))) return "The consist fills its entire circuit without front/rear clearance.";
  return null;
}

/**
 * One-train route/occupancy kernel. Traction, rigid vehicle poses and the app's schema-v1 oval
 * remain separate. A future fixed-tick controller supplies bounded movement and stopped reversal.
 */
export class RoutedConsist {
  readonly trainId: string;
  readonly length: number;
  private routeState: TurnoutRouteState;
  private occupied: readonly OccupiedRouteInterval[];
  private travelDirection: 1 | -1;
  private selectionRevision: number;

  private constructor(state: TurnoutRouteState, trainId: string, length: number, intervals: readonly OccupiedRouteInterval[], direction: 1 | -1, switchRevision: number) {
    this.routeState = state; this.trainId = trainId; this.length = length; this.occupied = freezeIntervals(intervals);
    this.travelDirection = direction; this.selectionRevision = switchRevision;
  }

  static place(topology: TurnoutTopology, input: unknown): ConsistBuildResult {
    if (!record(input) || !keys(input, ["trainId", "length", "rear"], ["selections"]) || !idValid(input.trainId) || !lengthValid(input.length)
      || !record(input.rear) || !keys(input.rear, ["edgeId", "distance"]) || typeof input.rear.edgeId !== "string" || typeof input.rear.distance !== "number") return invalid("placement-shape", "Invalid train identity, full footprint or rear cursor.");
    const compiled = compileTurnoutRoutes(topology, input.selections);
    if (!compiled.ok) return invalid("selection-shape", compiled.diagnostics[0]!.message);
    try {
      const traversed = walk(compiled.value, { edgeId: input.rear.edgeId, distance: input.rear.distance }, input.length);
      if (traversed.remaining > CONSIST_ROUTE_LIMITS.lengthTolerance) return invalid("insufficient-route", "The entire consist needs connected track before it can be placed.");
      const error = pathError(compiled.value, traversed.intervals, input.length);
      return error ? invalid("invalid-placement", error) : { ok: true, consist: new RoutedConsist(compiled.value, input.trainId, input.length, traversed.intervals, 1, 0) };
    } catch { return invalid("invalid-cursor", "The rear cursor is not on a supported route."); }
  }

  static restore(topology: TurnoutTopology, input: unknown): ConsistBuildResult {
    if (!record(input) || !keys(input, ["format", "schemaVersion", "topologyRevision", "switchRevision", "selections", "trainId", "length", "direction", "intervals"])
      || input.format !== "tin-junction-routed-consist" || input.schemaVersion !== 1 || input.topologyRevision !== topology?.revision
      || !counter(input.switchRevision) || !idValid(input.trainId) || !lengthValid(input.length) || (input.direction !== 1 && input.direction !== -1)
      || !Array.isArray(input.selections) || !Array.isArray(input.intervals) || input.intervals.length > CONSIST_ROUTE_LIMITS.intervals) return invalid("snapshot-shape", "Invalid routed-consist snapshot or topology revision.");
    const compiled = compileTurnoutRoutes(topology, input.selections);
    if (!compiled.ok) return invalid("selection-shape", compiled.diagnostics[0]!.message);
    const intervals = input.intervals as OccupiedRouteInterval[];
    const error = pathError(compiled.value, intervals, input.length);
    return error ? invalid("snapshot-path", error) : { ok: true, consist: new RoutedConsist(compiled.value, input.trainId, input.length, intervals, input.direction, input.switchRevision) };
  }

  get network(): TurnoutRouteState { return this.routeState; }
  get intervals(): readonly OccupiedRouteInterval[] { return this.occupied; }
  get direction(): 1 | -1 { return this.travelDirection; }
  get switchRevision(): number { return this.selectionRevision; }
  get front(): RouteCursor { const last = this.occupied.at(-1)!; return { edgeId: last.edgeId, distance: last.to }; }
  get rear(): RouteCursor { const first = this.occupied[0]!; return { edgeId: first.edgeId, distance: first.from }; }

  occupiedTurnouts(): readonly string[] {
    const ids = new Set<string>();
    const include = (edgeId: string | null) => { if (edgeId) { const id = turnoutOwner(this.routeState, edgeId); if (id) ids.add(id); } };
    for (const interval of this.occupied) {
      const edge = turnoutEdge(this.routeState, interval.edgeId);
      include(edge.id);
      // Closed endpoint contact remains protected until the rear is strictly clear.
      if (interval.from <= CONSIST_ROUTE_LIMITS.contactTolerance) include(reverseTurnoutEdge(this.routeState, edge.id).nextEdgeId);
      if (edge.length - interval.to <= CONSIST_ROUTE_LIMITS.contactTolerance) include(edge.nextEdgeId);
    }
    return Object.freeze([...ids].sort());
  }

  selectTurnout(turnoutId: string, route: TurnoutRoute, expectedRevision = this.selectionRevision): RouteCommandResult {
    if (expectedRevision !== this.selectionRevision || !counter(expectedRevision)) return result(false, false, "stale-switch-revision", "The turnout state changed; use its current revision.");
    const selected = this.routeState.selections.find(item => item.turnoutId === turnoutId);
    if (!selected || (route !== "straight" && route !== "diverging")) return result(false, false, "invalid-switch", "Choose a known turnout and supported route.");
    if (selected.route === route) return result(true, false, "unchanged", "That route is already selected.");
    if (this.occupiedTurnouts().includes(turnoutId)) return result(false, false, "turnout-occupied", "Wait until the entire train has cleared this turnout.");
    if (!Number.isSafeInteger(this.selectionRevision + 1)) return result(false, false, "revision-limit", "The turnout revision limit was reached.");
    const next = compileTurnoutRoutes(this.routeState.topology, this.routeState.selections.map(item => item.turnoutId === turnoutId ? { turnoutId, route } : item));
    if (!next.ok) return result(false, false, "invalid-switch", next.diagnostics[0]!.message);
    const error = pathError(next.value, this.occupied, this.length);
    if (error) return result(false, false, "occupied-route-changed", error);
    this.routeState = next.value; this.selectionRevision++;
    return result(true, true, "turnout-selected", route === "straight" ? "Straight route selected." : "Diverging route selected.");
  }

  advance(distance: number): RouteMovementResult {
    if (!Number.isFinite(distance) || distance < 0 || distance > CONSIST_ROUTE_LIMITS.maxMovement) return { ...result(false, false, "movement-range", "Movement exceeds the bounded route step."), travelled: 0, remaining: 0, blocked: true };
    if (distance === 0) return { ...result(true, false, "stationary", "The train has not moved."), travelled: 0, remaining: 0, blocked: false };
    const traversed = walk(this.routeState, this.front, distance);
    const next = this.occupied.map(item => ({ ...item }));
    for (const interval of traversed.intervals) appendInterval(next, interval);
    let trim = traversed.travelled;
    while (trim > 0 && next.length > 0) {
      const first = next[0]!, span = first.to - first.from;
      if (trim < span) { next[0] = { ...first, from: first.from + trim }; trim = 0; }
      else { trim -= span; next.shift(); }
    }
    const error = pathError(this.routeState, next, this.length);
    if (error) return { ...result(false, false, "invalid-movement", error), travelled: 0, remaining: distance, blocked: true };
    if (traversed.travelled > 0) this.occupied = freezeIntervals(next);
    const blocked = traversed.remaining > 0;
    return { ...result(true, traversed.travelled > 0, blocked ? "route-end" : "advanced", blocked ? "The train stopped at the end of its connected route." : "The train followed its retained route."), travelled: traversed.travelled, remaining: traversed.remaining, blocked };
  }

  /** The scalar motion authority must explicitly certify that speed/throttle are stopped. */
  reverse(stopped: boolean): RouteCommandResult {
    if (stopped !== true) return result(false, false, "train-moving", "Stop the train before reversing.");
    const next = [...this.occupied].reverse().map(interval => {
      const edge = turnoutEdge(this.routeState, interval.edgeId);
      return { edgeId: reverseTurnoutEdge(this.routeState, edge.id).id, from: edge.length - interval.to, to: edge.length - interval.from };
    });
    const error = pathError(this.routeState, next, this.length);
    if (error) return result(false, false, "invalid-reversal", error);
    this.occupied = freezeIntervals(next); this.travelDirection = this.travelDirection === 1 ? -1 : 1;
    return result(true, true, "reversed", "Travel direction reversed on the same occupied route.");
  }

  snapshot(): RoutedConsistSnapshot {
    return { format: "tin-junction-routed-consist", schemaVersion: 1, topologyRevision: this.routeState.topology.revision,
      switchRevision: this.selectionRevision, selections: this.routeState.selections.map(item => ({ ...item })), trainId: this.trainId,
      length: this.length, direction: this.travelDirection, intervals: this.occupied.map(item => ({ ...item })) };
  }
}
