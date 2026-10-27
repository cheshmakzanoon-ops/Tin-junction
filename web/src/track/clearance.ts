import { buildArcLengthTable, CENTERLINE_LIMITS } from "./centerline";
import type { TrackVector } from "./centerline";
import type { GraphPiece } from "./graph";
import { compileTurnoutRoutes, turnoutOwner } from "./turnout";
import type { NetworkSocketRef, TurnoutTopology } from "./turnout";
import { SLEEPER } from "./module";
import { BOARD } from "../model/types";

/** Catalog-supplied conservative lateral sweep, full height and minimum operating radius. */
export interface ClearanceEnvelope { readonly halfWidth: number; readonly height: number; readonly minimumRadius: number }
export interface PlacementDiagnostic { readonly code: string; readonly pieceIds: readonly string[]; readonly message: string }
export interface ClearanceResult {
  readonly ok: boolean;
  readonly diagnostics: readonly PlacementDiagnostic[];
  readonly comparedSegments: number;
  readonly sampledSegments: number;
  readonly truncated: boolean;
}
export const CLEARANCE_LIMITS = Object.freeze({
  boardWidth: BOARD.width, boardDepth: BOARD.depth, railPlaneY: 0, grade: 0,
  planeTolerance: 1e-9, minimumHalfWidth: 0.005, maximumHeight: 0.2,
  lateralMargin: 0.0001, trackBedHeight: 0.004, maxChordError: 0.00001,
  maxSegmentLength: 0.01, maxSegments: 32_768, maxComparisons: 3_000_000, maxDiagnostics: 64,
});
interface Segment { readonly a: TrackVector; readonly b: TrackVector; readonly from: number; readonly to: number }
interface Part {
  readonly piece: GraphPiece; readonly owner: string; readonly segments: readonly Segment[]; readonly length: number;
  readonly radius: number; readonly minX: number; readonly maxX: number; readonly minZ: number; readonly maxZ: number; readonly outside: boolean;
}
interface Join { readonly a: number; readonly b: number }
const record = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === "object" && !Array.isArray(value);
const ordered = (a: string, b: string): number => a < b ? -1 : a > b ? 1 : 0;
const diagnostic = (code: string, ids: readonly string[], message: string): PlacementDiagnostic => Object.freeze({ code, pieceIds: Object.freeze([...new Set(ids)].sort(ordered)), message });
const pairKey = (a: string, b: string): string => `${a}/${b}`;

export function validClearanceEnvelope(input: unknown): input is ClearanceEnvelope {
  if (!record(input) || Object.keys(input).length !== 3 || !["halfWidth", "height", "minimumRadius"].every(key => Object.hasOwn(input, key))) return false;
  const { halfWidth, height, minimumRadius } = input;
  return typeof halfWidth === "number" && typeof height === "number" && typeof minimumRadius === "number"
    && [halfWidth, height, minimumRadius].every(Number.isFinite)
    && minimumRadius >= CENTERLINE_LIMITS.minRadius && minimumRadius <= CENTERLINE_LIMITS.maxRadius
    && halfWidth >= CLEARANCE_LIMITS.minimumHalfWidth && halfWidth <= minimumRadius / 4
    && height >= CLEARANCE_LIMITS.trackBedHeight && height <= CLEARANCE_LIMITS.maximumHeight;
}

function pointSegmentDistance(p: TrackVector, a: TrackVector, b: TrackVector): number {
  const dx = b.x - a.x, dz = b.z - a.z, squared = dx * dx + dz * dz;
  const t = squared === 0 ? 0 : Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.z - a.z) * dz) / squared));
  return Math.hypot(p.x - a.x - t * dx, p.z - a.z - t * dz);
}

function segmentDistance(a: Segment, b: Segment): number {
  const rx = a.b.x - a.a.x, rz = a.b.z - a.a.z, sx = b.b.x - b.a.x, sz = b.b.z - b.a.z;
  const qx = b.a.x - a.a.x, qz = b.a.z - a.a.z, denominator = rx * sz - rz * sx;
  if (denominator !== 0) {
    const t = (qx * sz - qz * sx) / denominator, u = (qx * rz - qz * rx) / denominator;
    if (t >= 0 && t <= 1 && u >= 0 && u <= 1) return 0;
  }
  return Math.min(pointSegmentDistance(a.a, b.a, b.b), pointSegmentDistance(a.b, b.a, b.b), pointSegmentDistance(b.a, a.a, a.b), pointSegmentDistance(b.b, a.a, a.b));
}

function nearSharedJoin(a: Segment, b: Segment, joins: readonly Join[], window: number): boolean {
  return joins.some(join => Math.max(Math.abs(a.from - join.a), Math.abs(a.to - join.a)) <= window
    && Math.max(Math.abs(b.from - join.b), Math.abs(b.to - join.b)) <= window);
}

/**
 * Conservative planar operating gate. Incomplete/disconnected geometry is permitted; an
 * actual train still needs a complete retained route. No grade or bridge is certified here.
 */
export function validateTrackClearance(topology: TurnoutTopology, input: unknown): ClearanceResult {
  const diagnostics: PlacementDiagnostic[] = [], seen = new Set<string>();
  let sampledSegments = 0, comparedSegments = 0, truncated = false;
  const output = (): ClearanceResult => Object.freeze({ ok: diagnostics.length === 0 && !truncated, diagnostics: Object.freeze(diagnostics), sampledSegments, comparedSegments, truncated });
  const add = (code: string, ids: readonly string[], message: string) => {
    const item = diagnostic(code, ids, message), key = `${code}/${item.pieceIds.join("/")}`;
    if (seen.has(key)) return;
    if (diagnostics.length >= CLEARANCE_LIMITS.maxDiagnostics - 1) {
      if (!truncated) diagnostics.push(diagnostic("diagnostic-limit", [], "This draft has more conflicts than can be listed at once. Resolve the listed conflicts, then validate again."));
      truncated = true; return;
    }
    seen.add(key); diagnostics.push(item);
  };
  if (!validClearanceEnvelope(input)) { add("invalid-envelope", [], "Choose a supported vehicle clearance profile before placing a train."); return output(); }
  const compiled = compileTurnoutRoutes(topology);
  if (!compiled.ok) { add("invalid-topology", [], "Validate the track pieces and connections before checking their clearance."); return output(); }
  const state = compiled.value, parts: Part[] = [];
  const lateral = Math.max(input.halfWidth, SLEEPER.length / 2) + CLEARANCE_LIMITS.lateralMargin;
  for (const piece of state.graph.pieces) {
    const owner = turnoutOwner(state, `${piece.id}/forward`) ?? piece.id;
    if (Math.abs(piece.pose.y - CLEARANCE_LIMITS.railPlaneY) > CLEARANCE_LIMITS.planeTolerance) add("unsupported-elevation", [owner], `Keep ${owner} on the board's track level. Raised track needs a supported bridge and grade kit.`);
    if (piece.centerline.kind === "arc" && piece.centerline.radius < input.minimumRadius) add("minimum-radius", [owner], `The curve on ${owner} is too tight for this train. Choose a wider curve or a compatible shorter vehicle.`);
    const table = buildArcLengthTable(piece.centerline, { maxChordError: CLEARANCE_LIMITS.maxChordError, maxTangentAngle: Math.PI / 24, maxSegmentLength: CLEARANCE_LIMITS.maxSegmentLength }, piece.pose);
    sampledSegments += table.entries.length - 1;
    if (sampledSegments > CLEARANCE_LIMITS.maxSegments) { add("sampling-limit", [owner], "This draft exceeds the bounded clearance sampling budget. Simplify its track geometry before operating."); truncated = true; return output(); }
    const radius = lateral + (piece.centerline.kind === "arc" ? CLEARANCE_LIMITS.maxChordError : 0);
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
    const segments: Segment[] = [];
    for (let index = 0; index < table.entries.length; index++) {
      const point = table.entries[index]!;
      minX = Math.min(minX, point.position.x - radius); maxX = Math.max(maxX, point.position.x + radius);
      minZ = Math.min(minZ, point.position.z - radius); maxZ = Math.max(maxZ, point.position.z + radius);
      const next = table.entries[index + 1];
      if (next) segments.push({ a: point.position, b: next.position, from: point.distance, to: next.distance });
    }
    const outside = minX < -BOARD.width / 2 - 1e-12 || maxX > BOARD.width / 2 + 1e-12 || minZ < -BOARD.depth / 2 - 1e-12 || maxZ > BOARD.depth / 2 + 1e-12;
    if (outside) add("board-clearance", [owner], `Move ${owner} inward so the track and the train's full swept width stay inside the case.`);
    parts.push({ piece, owner, length: table.length, segments, radius, minX, maxX, minZ, maxZ, outside });
    if (truncated) return output();
  }

  const byId = new Map(parts.map(part => [part.piece.id, part])), turnoutIds = new Set(topology.turnouts.map(turnout => turnout.id));
  const joins = new Map<string, Join[]>();
  const endpoints = (ref: NetworkSocketRef): { id: string; distance: number }[] => {
    if (!turnoutIds.has(ref.pieceId)) return [{ id: ref.pieceId, distance: ref.socketId === "entrance" ? 0 : byId.get(ref.pieceId)!.length }];
    const routes = ref.socketId === "stock" ? ["straight", "diverging"] : [ref.socketId];
    return routes.map(route => { const id = `${ref.pieceId}:route:${route}`; return { id, distance: ref.socketId === "stock" ? 0 : byId.get(id)!.length }; });
  };
  for (const connection of topology.connections) for (const a of endpoints(connection.a)) for (const b of endpoints(connection.b)) {
    const forward = pairKey(a.id, b.id), backward = pairKey(b.id, a.id);
    joins.set(forward, [...(joins.get(forward) ?? []), { a: a.distance, b: b.distance }]);
    joins.set(backward, [...(joins.get(backward) ?? []), { a: b.distance, b: a.distance }]);
  }

  const joinWindow = lateral * 4;
  for (let first = 0; first < parts.length; first++) for (let second = first; second < parts.length; second++) {
    const a = parts[first]!, b = parts[second]!;
    // An off-board part already fails; omit its unnecessary expensive intersection work.
    if (a.outside || b.outside || (a.owner === b.owner && a.piece.id !== b.piece.id)) continue;
    if (a.minX > b.maxX || b.minX > a.maxX || a.minZ > b.maxZ || b.minZ > a.maxZ) continue;
    const shared = joins.get(pairKey(a.piece.id, b.piece.id)) ?? [];
    const required = a.radius + b.radius;
    let overlap = false;
    for (let ai = 0; ai < a.segments.length && !overlap; ai++) {
      const segmentA = a.segments[ai]!;
      for (let bi = first === second ? ai + 1 : 0; bi < b.segments.length; bi++) {
        const segmentB = b.segments[bi]!;
        if (++comparedSegments > CLEARANCE_LIMITS.maxComparisons) { add("comparison-limit", [a.owner, b.owner], "This draft exceeds the bounded clearance comparison budget. Simplify its track geometry before operating."); truncated = true; return output(); }
        if (first === second && segmentB.from - segmentA.to <= joinWindow) continue;
        if (nearSharedJoin(segmentA, segmentB, shared, joinWindow)) continue;
        if (Math.min(segmentA.a.x, segmentA.b.x) - required > Math.max(segmentB.a.x, segmentB.b.x) || Math.min(segmentB.a.x, segmentB.b.x) - required > Math.max(segmentA.a.x, segmentA.b.x)
          || Math.min(segmentA.a.z, segmentA.b.z) - required > Math.max(segmentB.a.z, segmentB.b.z) || Math.min(segmentB.a.z, segmentB.b.z) - required > Math.max(segmentA.a.z, segmentA.b.z)) continue;
        if (segmentDistance(segmentA, segmentB) < required - 1e-12) { overlap = true; break; }
      }
    }
    if (!overlap) continue;
    const elevation = Math.abs(a.piece.pose.y - b.piece.pose.y);
    if (elevation > CLEARANCE_LIMITS.planeTolerance) {
      const sufficient = elevation >= input.height + CLEARANCE_LIMITS.trackBedHeight;
      add(sufficient ? "unsupported-overpass" : "vertical-clearance", [a.owner, b.owner], sufficient
        ? `${a.owner} crosses ${b.owner} at different levels. This planar kit has no certified bridge or grade connection; move the crossing before placing a train.`
        : `${a.owner} passes too close above or below ${b.owner} for this train. Move the crossing; this planar kit cannot create an overpass.`);
    } else add(first === second ? "self-overlap" : "track-overlap", [a.owner, b.owner], first === second
      ? `The swept track on ${a.owner} overlaps itself. Open the curve or use separate supported pieces with explicit connections.`
      : `Track clearance for ${a.owner} overlaps ${b.owner}. Move a piece farther away, or align and explicitly connect compatible ends.`);
    if (truncated) return output();
  }
  return output();
}
