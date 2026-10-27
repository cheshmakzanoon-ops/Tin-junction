import { sampleCenterline } from "../track/centerline";
import type { TrackVector } from "../track/centerline";
import type { DirectedTrackEdge, GraphPiece, RouteCursor } from "../track/graph";
import { reverseTurnoutEdge, turnoutEdge, turnoutOwner } from "../track/turnout";
import type { TurnoutRouteState } from "../track/turnout";
import { RAIL_CENTER_SPACING } from "../model/types";
import type { OccupiedRouteInterval } from "./routedConsist";
import { CONSIST_ROUTE_LIMITS, occupiedRouteError } from "./routedConsist";
import { consistFootprint, validateConsistVehicles, VEHICLE_CATALOG, VEHICLE_CONSTRAINTS } from "./vehicleCatalog";
import type { ConsistVehicle, VehicleDefinition } from "./vehicleCatalog";

export interface PoseRouteState {
  readonly network: TurnoutRouteState;
  readonly intervals: readonly OccupiedRouteInterval[];
  readonly direction: 1 | -1;
  readonly signedTravel: number;
}
export interface RoutedAxlePose {
  readonly id: string; readonly routeCursor: RouteCursor; readonly routeDistance: number;
  readonly center: TrackVector; readonly tangent: TrackVector; readonly leftWheel: TrackVector; readonly rightWheel: TrackVector;
  readonly wheelRadius: number; readonly wheelPhase: number;
}
export interface RoutedVehiclePose {
  readonly id: string; readonly catalogId: ConsistVehicle["catalogId"];
  readonly position: TrackVector; readonly tangent: TrackVector; readonly yaw: number;
  readonly frontDistance: number; readonly rearDistance: number;
  readonly frontPivot: TrackVector; readonly rearPivot: TrackVector;
  readonly frontCouplerAttachment: TrackVector; readonly rearCouplerAttachment: TrackVector;
  readonly frontCoupler: TrackVector; readonly rearCoupler: TrackVector;
  readonly frontCouplerAngle: number; readonly rearCouplerAngle: number;
  readonly axles: readonly RoutedAxlePose[];
}
export type PoseSolveResult = { readonly ok: true; readonly poses: readonly RoutedVehiclePose[]; readonly footprint: number }
  | { readonly ok: false; readonly code: string; readonly message: string };
interface PathInterval { readonly edge: DirectedTrackEdge; readonly piece: GraphPiece; readonly from: number; readonly to: number; readonly start: number; readonly end: number }
interface PathSample { readonly position: TrackVector; readonly tangent: TrackVector; readonly right: TrackVector; readonly cursor: RouteCursor }
interface BodySolution {
  readonly position: TrackVector; readonly tangent: TrackVector; readonly yaw: number;
  readonly frontDistance: number; readonly rearDistance: number; readonly front: PathSample; readonly rear: PathSample;
  readonly frontAttachment: TrackVector; readonly rearAttachment: TrackVector;
}
const vector = (x: number, y: number, z: number): TrackVector => Object.freeze({ x, y, z });
const separation = (a: TrackVector, b: TrackVector): number => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
const piecesByNetwork = new WeakMap<TurnoutRouteState, ReadonlyMap<string, GraphPiece>>();
const metre = (micrometres: number): number => micrometres / 1_000_000;
export const POSE_JOIN_TOLERANCE = Object.freeze({ position: 1e-9, tangent: 1e-9 });

class CanonicalPath {
  readonly intervals: readonly PathInterval[];
  readonly length: number;

  constructor(state: PoseRouteState, vehicles: readonly ConsistVehicle[]) {
    if (!Array.isArray(state.intervals) || state.intervals.length < 1 || state.intervals.length > CONSIST_ROUTE_LIMITS.intervals
      || (state.direction !== 1 && state.direction !== -1) || !Number.isFinite(state.signedTravel) || Math.abs(state.signedTravel) > 1e9) throw new RangeError("Invalid bounded pose route.");
    // Validates the state identity before using its derived immutable geometry.
    turnoutEdge(state.network, state.intervals[0]!.edgeId);
    const invalidPath = occupiedRouteError(state.network, state.intervals, consistFootprint(vehicles));
    if (invalidPath) throw new RangeError(invalidPath);
    let pieces = piecesByNetwork.get(state.network);
    if (!pieces) { pieces = new Map(state.network.graph.pieces.map(piece => [piece.id, piece])); piecesByNetwork.set(state.network, pieces); }
    const canonical = state.direction === 1 ? state.intervals : [...state.intervals].reverse().map(interval => {
      const edge = turnoutEdge(state.network, interval.edgeId);
      return { edgeId: reverseTurnoutEdge(state.network, edge.id).id, from: edge.length - interval.to, to: edge.length - interval.from };
    });
    const minimumRadius = Math.max(...vehicles.map(vehicle => metre(VEHICLE_CATALOG[vehicle.catalogId].minimumRadiusMicrometres)));
    const intervals: PathInterval[] = [];
    let distance = 0;
    for (const interval of canonical) {
      const edge = turnoutEdge(state.network, interval.edgeId), piece = pieces.get(edge.pieceId)!;
      if (!Number.isFinite(interval.from) || !Number.isFinite(interval.to) || interval.from < 0 || interval.to > edge.length || interval.from >= interval.to) throw new RangeError("Invalid retained pose interval.");
      const previous = intervals.at(-1);
      if (previous && (previous.edge.nextEdgeId !== edge.id || Math.abs(previous.to - previous.edge.length) > 1e-10 || interval.from !== 0)) throw new RangeError("The retained vehicle route is disconnected.");
      if (previous) {
        const end = sampleCenterline(previous.piece.centerline, previous.edge.direction === 1 ? previous.edge.length : 0, previous.piece.pose);
        const start = sampleCenterline(piece.centerline, edge.direction === 1 ? 0 : edge.length, piece.pose);
        const tangentError = Math.hypot(end.tangent.x * previous.edge.direction - start.tangent.x * edge.direction,
          end.tangent.z * previous.edge.direction - start.tangent.z * edge.direction);
        if (separation(end.position, start.position) > POSE_JOIN_TOLERANCE.position || tangentError > POSE_JOIN_TOLERANCE.tangent) throw new RangeError("Snap the occupied rail joint exactly before placing or operating this train.");
      }
      const owner = turnoutOwner(state.network, edge.id);
      if (owner && piece.id !== `${owner}:route:${state.network.selections.find(selection => selection.turnoutId === owner)!.route}`) throw new RangeError("An occupied turnout route is not latched to its selected branch.");
      if (piece.centerline.kind === "arc" && piece.centerline.radius < minimumRadius) throw new RangeError("The route radius cannot support this vehicle catalog.");
      intervals.push({ edge, piece, from: interval.from, to: interval.to, start: distance, end: distance + interval.to - interval.from });
      distance += interval.to - interval.from;
    }
    if (Math.abs(distance - consistFootprint(vehicles)) > CONSIST_ROUTE_LIMITS.lengthTolerance) throw new RangeError("The occupied footprint does not match this vehicle composition.");
    this.intervals = intervals; this.length = distance;
  }

  sample(distance: number): PathSample {
    if (!Number.isFinite(distance) || distance < 0 || distance > this.length) throw new RangeError("The rigid vehicle exceeds its retained route footprint.");
    let low = 0, high = this.intervals.length - 1;
    while (low < high) { const middle = (low + high) >>> 1; if (distance <= this.intervals[middle]!.end) high = middle; else low = middle + 1; }
    const interval = this.intervals[low]!, offset = Math.min(interval.to, Math.max(interval.from, interval.from + distance - interval.start));
    const edge = interval.edge;
    const sampled = sampleCenterline(interval.piece.centerline, edge.direction === 1 ? offset : edge.length - offset, interval.piece.pose);
    return { position: sampled.position, tangent: vector(sampled.tangent.x * edge.direction, 0, sampled.tangent.z * edge.direction),
      right: vector(sampled.right.x * edge.direction, 0, sampled.right.z * edge.direction), cursor: Object.freeze({ edgeId: edge.id, distance: offset }) };
  }
}

function bodyAt(path: CanonicalPath, frontDistance: number, definition: VehicleDefinition): BodySolution {
  const wheelbase = metre(definition.wheelbaseMicrometres), front = path.sample(frontDistance);
  let low = wheelbase, high = wheelbase * VEHICLE_CONSTRAINTS.longitudinalStretch;
  if (frontDistance - high < 0) throw new RangeError("The retained route cannot bracket this vehicle's rear pivot.");
  if (separation(front.position, path.sample(frontDistance - high).position) < wheelbase) throw new RangeError("This route cannot support the rigid wheelbase.");
  for (let iteration = 0; iteration < VEHICLE_CONSTRAINTS.rootIterations; iteration++) {
    const middle = (low + high) / 2;
    if (separation(front.position, path.sample(frontDistance - middle).position) < wheelbase) low = middle;
    else high = middle;
  }
  const rearDistance = frontDistance - (low + high) / 2, rear = path.sample(rearDistance);
  const chord = separation(front.position, rear.position);
  if (Math.abs(chord - wheelbase) > 1e-9 || Math.abs(front.position.y - rear.position.y) > 1e-9) throw new RangeError("The route cannot satisfy this planar vehicle's rigid pivots.");
  const tangent = vector((front.position.x - rear.position.x) / chord, 0, (front.position.z - rear.position.z) / chord);
  const position = vector((front.position.x + rear.position.x) / 2, (front.position.y + rear.position.y) / 2, (front.position.z + rear.position.z) / 2);
  const reach = metre(definition.bodyLengthMicrometres / 2);
  const coupler = (side: -1 | 1) => vector(position.x + tangent.x * reach * side, position.y + VEHICLE_CONSTRAINTS.couplerHeight, position.z + tangent.z * reach * side);
  return { position, tangent, yaw: Math.atan2(tangent.x, tangent.z), frontDistance, rearDistance, front, rear, frontAttachment: coupler(1), rearAttachment: coupler(-1) };
}

function trailingBody(path: CanonicalPath, previous: BodySolution, previousDefinition: VehicleDefinition, definition: VehicleDefinition): BodySolution {
  // Two fixed-length pivoting stems and one fixed-length central link. Keeping
  // the stems rigidly aligned with the body makes tight S curves impossible.
  const span = metre(2 * VEHICLE_CONSTRAINTS.couplerExtensionMicrometres + VEHICLE_CONSTRAINTS.couplerGapMicrometres);
  const nominal = metre((previousDefinition.wheelbaseMicrometres + previousDefinition.bodyLengthMicrometres + definition.bodyLengthMicrometres - definition.wheelbaseMicrometres) / 2
    + 2 * VEHICLE_CONSTRAINTS.couplerExtensionMicrometres + VEHICLE_CONSTRAINTS.couplerGapMicrometres);
  const start = previous.frontDistance - previous.rearDistance, end = nominal * VEHICLE_CONSTRAINTS.longitudinalStretch;
  const evaluate = (offset: number) => {
    const pose = bodyAt(path, previous.frontDistance - offset, definition);
    return { pose, error: separation(previous.rearAttachment, pose.frontAttachment) - span };
  };
  let lower = start, previousError = evaluate(start).error;
  let bracket: { low: number; high: number } | null = null;
  for (let step = 1; step <= VEHICLE_CONSTRAINTS.bracketSamples; step++) {
    const upper = start + (end - start) * step / VEHICLE_CONSTRAINTS.bracketSamples, error = evaluate(upper).error;
    if (previousError < 0 && error >= 0) {
      if (bracket) throw new RangeError("This route gives an ambiguous coupler placement.");
      bracket = { low: lower, high: upper };
    }
    lower = upper; previousError = error;
  }
  if (!bracket) throw new RangeError("This curve cannot support the catalog's bounded coupler reach.");
  for (let iteration = 0; iteration < VEHICLE_CONSTRAINTS.rootIterations; iteration++) {
    const middle = (bracket.low + bracket.high) / 2;
    if (evaluate(middle).error < 0) bracket.low = middle; else bracket.high = middle;
  }
  const solved = evaluate((bracket.low + bracket.high) / 2);
  if (Math.abs(solved.error) > 1e-8) throw new RangeError("The coupled bodies cannot maintain their physical gap.");
  const towardPrevious = vector((previous.rearAttachment.x - solved.pose.frontAttachment.x) / span, 0,
    (previous.rearAttachment.z - solved.pose.frontAttachment.z) / span);
  const allowed = Math.cos(VEHICLE_CONSTRAINTS.maximumCouplerAngle);
  if (towardPrevious.x * previous.tangent.x + towardPrevious.z * previous.tangent.z < allowed
    || towardPrevious.x * solved.pose.tangent.x + towardPrevious.z * solved.pose.tangent.z < allowed) throw new RangeError("This curve exceeds the catalog's supported coupler angle.");
  return solved.pose;
}

function axlePose(path: CanonicalPath, vehicle: ConsistVehicle, definition: VehicleDefinition, distance: number, index: number, signedTravel: number): RoutedAxlePose {
  const sample = path.sample(distance), radius = metre(definition.wheelRadiusMicrometres), y = sample.position.y + VEHICLE_CONSTRAINTS.railTop + radius;
  const rail = (side: -1 | 1) => vector(sample.position.x + sample.right.x * RAIL_CENTER_SPACING / 2 * side, y, sample.position.z + sample.right.z * RAIL_CENTER_SPACING / 2 * side);
  return Object.freeze({ id: `${vehicle.id}:axle:${index}`, routeCursor: sample.cursor, routeDistance: distance,
    center: vector(sample.position.x, y, sample.position.z), tangent: sample.tangent, leftWheel: rail(-1), rightWheel: rail(1), wheelRadius: radius,
    wheelPhase: (signedTravel + distance - path.length) / radius });
}

/** Pure rigid placement along retained history; physical vehicle order never follows travel direction. */
export function solveRoutedPoses(state: PoseRouteState, input: unknown): PoseSolveResult {
  if (!validateConsistVehicles(input)) return { ok: false, code: "vehicle-composition", message: "Choose a supported canonical engine and carriage composition." };
  try {
    const path = new CanonicalPath(state, input), first = VEHICLE_CATALOG[input[0]!.catalogId];
    const margin = metre((first.bodyLengthMicrometres - first.wheelbaseMicrometres) / 2 + VEHICLE_CONSTRAINTS.couplerExtensionMicrometres) * VEHICLE_CONSTRAINTS.longitudinalStretch + metre(VEHICLE_CONSTRAINTS.endMarginMicrometres);
    const bodies: { readonly vehicle: ConsistVehicle; readonly definition: VehicleDefinition; readonly body: BodySolution }[] = [];
    let previous: BodySolution | null = null, previousDefinition: VehicleDefinition | null = null;
    for (const vehicle of input) {
      const definition = VEHICLE_CATALOG[vehicle.catalogId];
      const body: BodySolution = previous && previousDefinition ? trailingBody(path, previous, previousDefinition, definition) : bodyAt(path, path.length - margin, definition);
      const rearMargin = metre((definition.bodyLengthMicrometres - definition.wheelbaseMicrometres) / 2 + VEHICLE_CONSTRAINTS.couplerExtensionMicrometres) * VEHICLE_CONSTRAINTS.longitudinalStretch + metre(VEHICLE_CONSTRAINTS.endMarginMicrometres);
      if (body.rearDistance < rearMargin) throw new RangeError("The complete vehicle and overhang exceed the conservative occupied footprint.");
      bodies.push({ vehicle, definition, body });
      previous = body; previousDefinition = definition;
    }
    const extension = metre(VEHICLE_CONSTRAINTS.couplerExtensionMicrometres);
    const poses = bodies.map(({ vehicle, definition, body }, index): RoutedVehiclePose => {
      const frontNeighbour = bodies[index - 1]?.body.rearAttachment, rearNeighbour = bodies[index + 1]?.body.frontAttachment;
      const head = (attachment: TrackVector, neighbour: TrackVector | undefined, side: -1 | 1): { position: TrackVector; angle: number } => {
        const length = neighbour ? separation(attachment, neighbour) : 1;
        const direction = neighbour ? vector((neighbour.x - attachment.x) / length, 0, (neighbour.z - attachment.z) / length) : vector(body.tangent.x * side, 0, body.tangent.z * side);
        const cosine = (direction.x * body.tangent.x + direction.z * body.tangent.z) * side;
        return { position: vector(attachment.x + direction.x * extension, attachment.y, attachment.z + direction.z * extension), angle: Math.acos(Math.max(-1, Math.min(1, cosine))) };
      };
      const frontHead = head(body.frontAttachment, frontNeighbour, 1), rearHead = head(body.rearAttachment, rearNeighbour, -1);
      const distances = definition.axles === 3 ? [body.frontDistance, (body.frontDistance + body.rearDistance) / 2, body.rearDistance] : [body.frontDistance, body.rearDistance];
      return Object.freeze({ id: vehicle.id, catalogId: vehicle.catalogId, position: body.position, tangent: body.tangent, yaw: body.yaw,
        frontDistance: body.frontDistance, rearDistance: body.rearDistance, frontPivot: body.front.position, rearPivot: body.rear.position,
        frontCouplerAttachment: body.frontAttachment, rearCouplerAttachment: body.rearAttachment,
        frontCoupler: frontHead.position, rearCoupler: rearHead.position, frontCouplerAngle: frontHead.angle, rearCouplerAngle: rearHead.angle,
        axles: Object.freeze(distances.map((distance, index) => axlePose(path, vehicle, definition, distance, index, state.signedTravel))) });
    });
    return Object.freeze({ ok: true, poses: Object.freeze(poses), footprint: consistFootprint(input) });
  } catch (error) { return { ok: false, code: "unsupported-route-geometry", message: error instanceof Error ? error.message : "The retained route cannot safely place this consist." }; }
}
