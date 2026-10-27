import { centerlineLength, sampleCenterline } from "./centerline";
import type { CenterlineDefinition, TrackPose } from "./centerline";
import { connectorsCompatible, RAIL_PROFILE, trackConnectors } from "./module";
import type { TrackConnector } from "./module";

export interface GraphPiece { readonly id: string; readonly centerline: CenterlineDefinition; readonly pose: TrackPose; readonly gauge: number; readonly profile: string }
export interface SocketRef { readonly pieceId: string; readonly socketId: "entrance" | "exit" }
export interface GraphConnection { readonly id: string; readonly a: SocketRef; readonly b: SocketRef }
export interface DirectedTrackEdge { readonly id: string; readonly pieceId: string; readonly direction: 1 | -1; readonly entrance: SocketRef; readonly exit: SocketRef; readonly length: number; readonly nextEdgeId: string | null }
export interface RouteGraph {
  readonly revision: number; readonly pieces: readonly GraphPiece[]; readonly connections: readonly GraphConnection[];
  readonly edges: readonly DirectedTrackEdge[]; readonly openSockets: readonly SocketRef[];
}
export interface GraphDiagnostic { readonly code: string; readonly target: string; readonly message: string }
export type GraphBuildResult = { readonly ok: true; readonly graph: RouteGraph } | { readonly ok: false; readonly diagnostics: readonly GraphDiagnostic[] };
export const GRAPH_LIMITS = Object.freeze({ pieces: 500, connections: 500, operations: 100, distance: 1_000_000 });
const caches = new WeakMap<RouteGraph, ReadonlyMap<string, DirectedTrackEdge>>();
const idValid = (id: unknown): id is string => typeof id === "string" && /^[A-Za-z0-9._:-]{1,128}$/.test(id);
const record = (input: unknown): input is Record<string, unknown> => input !== null && typeof input === "object" && !Array.isArray(input);
const keys = (input: Record<string, unknown>, expected: readonly string[]): boolean => Object.keys(input).length === expected.length && expected.every(key => Object.hasOwn(input, key));
const socketKey = (ref: SocketRef): string => `${ref.pieceId}/${ref.socketId}`;
const edgeKey = (pieceId: string, direction: 1 | -1): string => `${pieceId}/${direction === 1 ? "forward" : "reverse"}`;
const socket = (pieceId: string, socketId: "entrance" | "exit"): SocketRef => Object.freeze({ pieceId, socketId });
const failure = (code: string, target: string, message: string): GraphBuildResult => ({ ok: false, diagnostics: Object.freeze([Object.freeze({ code, target, message })]) });

/** Validate and compile a detached candidate; no existing graph is mutated on any failure. */
export function buildRouteGraph(input: unknown): GraphBuildResult {
  if (!record(input) || !keys(input, ["revision", "pieces", "connections"]) || !Number.isSafeInteger(input.revision) || (input.revision as number) < 0) return failure("shape", "graph", "Invalid graph envelope or revision.");
  if (!Array.isArray(input.pieces) || input.pieces.length > GRAPH_LIMITS.pieces || !Array.isArray(input.connections) || input.connections.length > GRAPH_LIMITS.connections) return failure("capacity", "graph", "Piece or connection count exceeds the bounded graph capacity.");
  const pieces: GraphPiece[] = [], connections: GraphConnection[] = [], connectors = new Map<string, TrackConnector>(), seenPieces = new Set<string>();
  for (const item of input.pieces) {
    if (!record(item) || !keys(item, ["id", "centerline", "pose", "gauge", "profile"]) || !idValid(item.id)) return failure("piece-shape", "piece", "Malformed piece or unstable ID.");
    if (seenPieces.has(item.id)) return failure("duplicate-piece", item.id, "Piece IDs must be unique.");
    if (item.gauge !== RAIL_PROFILE.gauge || item.profile !== RAIL_PROFILE.id) return failure("incompatible-profile", item.id, "Unsupported gauge or rail profile.");
    if (!record(item.centerline) || !keys(item.centerline, item.centerline.kind === "straight" ? ["kind", "length"] : ["kind", "radius", "sweep"]) || !record(item.pose) || !keys(item.pose, ["x", "y", "z", "yaw"])) return failure("piece-shape", item.id, "Unexpected centerline or pose fields.");
    try {
      const definition = Object.freeze({ ...item.centerline }) as unknown as CenterlineDefinition;
      const pose = Object.freeze({ ...item.pose }) as unknown as TrackPose;
      const generated = trackConnectors(item.id, definition, pose);
      for (const connector of generated) connectors.set(socketKey(connector), connector);
      pieces.push(Object.freeze({ id: item.id, centerline: definition, pose, gauge: item.gauge, profile: item.profile }));
      seenPieces.add(item.id);
    } catch { return failure("piece-geometry", item.id, "Invalid dimensions or rigid placement."); }
  }
  const occupied = new Map<string, SocketRef>(), connectionIds = new Set<string>();
  for (const item of input.connections) {
    if (!record(item) || !keys(item, ["id", "a", "b"]) || !idValid(item.id)) return failure("connection-shape", "connection", "Malformed connection or unstable ID.");
    if (connectionIds.has(item.id)) return failure("duplicate-connection", item.id, "Connection IDs must be unique.");
    for (const endpoint of [item.a, item.b]) if (!record(endpoint) || !keys(endpoint, ["pieceId", "socketId"]) || !idValid(endpoint.pieceId) || !["entrance", "exit"].includes(endpoint.socketId as string)) return failure("socket-shape", item.id, "Malformed socket reference.");
    const a = item.a as unknown as SocketRef, b = item.b as unknown as SocketRef, ak = socketKey(a), bk = socketKey(b);
    const ca = connectors.get(ak), cb = connectors.get(bk);
    if (!ca || !cb) return failure("missing-piece", item.id, "Connection refers to an absent piece/socket.");
    if (a.pieceId === b.pieceId) return failure("self-connection", item.id, "Self connections are not supported; use explicit circuit pieces.");
    if (occupied.has(ak) || occupied.has(bk)) return failure("occupied-socket", item.id, "A socket cannot belong to more than one connection or implicit branch.");
    if (!connectorsCompatible(ca, cb)) return failure("misaligned-socket", item.id, "Socket position, outward tangent or profile exceeds connection tolerances.");
    const copyA = socket(a.pieceId, a.socketId), copyB = socket(b.pieceId, b.socketId);
    occupied.set(ak, copyB); occupied.set(bk, copyA); connectionIds.add(item.id);
    connections.push(Object.freeze({ id: item.id, a: copyA, b: copyB }));
  }
  pieces.sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  connections.sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  const edges: DirectedTrackEdge[] = [], openSockets: SocketRef[] = [];
  for (const piece of pieces) {
    for (const socketId of ["entrance", "exit"] as const) if (!occupied.has(socketKey(socket(piece.id, socketId)))) openSockets.push(socket(piece.id, socketId));
    for (const direction of [1, -1] as const) {
      const entrance = socket(piece.id, direction === 1 ? "entrance" : "exit"), exit = socket(piece.id, direction === 1 ? "exit" : "entrance"), next = occupied.get(socketKey(exit));
      edges.push(Object.freeze({ id: edgeKey(piece.id, direction), pieceId: piece.id, direction, entrance, exit, length: centerlineLength(piece.centerline), nextEdgeId: next ? edgeKey(next.pieceId, next.socketId === "entrance" ? 1 : -1) : null }));
    }
  }
  const graph: RouteGraph = Object.freeze({ revision: input.revision as number, pieces: Object.freeze(pieces), connections: Object.freeze(connections), edges: Object.freeze(edges), openSockets: Object.freeze(openSockets) });
  caches.set(graph, new Map(edges.map(edge => [edge.id, edge])));
  return { ok: true, graph };
}

export interface RouteCursor { readonly edgeId: string; readonly distance: number }
export interface TraversalResult { readonly cursor: RouteCursor; readonly travelled: number; readonly remaining: number; readonly blocked: boolean; readonly transitions: number; readonly skippedCycles: number }

/** Iterative, bounded traversal. Exact connected endpoints canonicalize to the next edge at zero. */
export function advanceRoute(graph: RouteGraph, cursor: RouteCursor, distance: number): TraversalResult {
  const cache = caches.get(graph);
  if (!cache) throw new RangeError("Use a validated route graph.");
  if (!cursor || typeof cursor.edgeId !== "string" || !Number.isFinite(cursor.distance) || !Number.isFinite(distance) || distance < 0 || distance > GRAPH_LIMITS.distance) throw new RangeError("Invalid route traversal input.");
  let edge = cache.get(cursor.edgeId), offset = cursor.distance, remaining = distance, travelled = 0, transitions = 0, skippedCycles = 0;
  if (!edge || offset < 0 || offset > edge.length) throw new RangeError("Invalid route cursor.");
  const arrivals = new Map<string, number>();
  if (offset === 0) arrivals.set(edge.id, 0);
  const result = (blocked: boolean): TraversalResult => Object.freeze({ cursor: Object.freeze({ edgeId: edge!.id, distance: offset }), travelled, remaining, blocked, transitions, skippedCycles });
  while (true) {
    const available = edge.length - offset;
    if (remaining < available) { offset += remaining; travelled += remaining; remaining = 0; return result(false); }
    remaining -= available; travelled += available; offset = edge.length;
    if (!edge.nextEdgeId) return result(remaining > 0);
    const next = cache.get(edge.nextEdgeId);
    if (!next) throw new RangeError("Validated route has an invalid next edge.");
    edge = next; offset = 0; transitions++;
    if (remaining === 0) return result(false);
    const previousArrival = arrivals.get(edge.id);
    if (previousArrival !== undefined) {
      const cycleLength = travelled - previousArrival;
      if (!Number.isFinite(cycleLength) || cycleLength <= 0) throw new RangeError("Invalid zero-length route cycle.");
      const cycles = Math.floor(remaining / cycleLength);
      if (cycles > 0) { const skipped = cycles * cycleLength; remaining -= skipped; travelled += skipped; skippedCycles += cycles; }
      arrivals.clear();
      if (remaining === 0) return result(false);
    }
    arrivals.set(edge.id, travelled);
    if (transitions > graph.edges.length * 3 + 1) throw new RangeError("Traversal exceeded its graph-derived transition bound.");
  }
}

/** Piece identity and travel direction remain separate from renderer orientation. */
export function sampleRouteCursor(graph: RouteGraph, cursor: RouteCursor) {
  if (!cursor || typeof cursor.edgeId !== "string") throw new RangeError("Invalid route cursor.");
  const cache = caches.get(graph), edge = cache?.get(cursor.edgeId);
  if (!edge || !Number.isFinite(cursor.distance) || cursor.distance < 0 || cursor.distance > edge.length) throw new RangeError("Invalid route cursor.");
  const piece = graph.pieces.find(item => item.id === edge.pieceId)!;
  const sample = sampleCenterline(piece.centerline, edge.direction === 1 ? cursor.distance : edge.length - cursor.distance, piece.pose);
  return Object.freeze({ ...sample, distance: cursor.distance,
    tangent: Object.freeze({ x: sample.tangent.x * edge.direction, y: 0, z: sample.tangent.z * edge.direction }),
    right: Object.freeze({ x: sample.right.x * edge.direction, y: 0, z: sample.right.z * edge.direction }), curvature: sample.curvature * edge.direction });
}

export type GraphOperation =
  | { readonly type: "add"; readonly piece: GraphPiece }
  | { readonly type: "remove"; readonly pieceId: string }
  | { readonly type: "move"; readonly pieceId: string; readonly pose: TrackPose }
  | { readonly type: "connect"; readonly connection: GraphConnection }
  | { readonly type: "disconnect"; readonly connectionId: string };
export type GraphEditResult = { readonly ok: true; readonly graph: RouteGraph } | { readonly ok: false; readonly graph: RouteGraph; readonly diagnostics: readonly GraphDiagnostic[] };

/** Atomic batches support disconnect+move+reconnect without exposing an invalid intermediate graph. */
export function editRouteGraph(graph: RouteGraph, expectedRevision: number, mode: "edit" | "operate", operations: readonly GraphOperation[]): GraphEditResult {
  if (!caches.has(graph)) throw new RangeError("Use a validated route graph.");
  const reject = (code: string, target: string, message: string): GraphEditResult => ({ ok: false, graph, diagnostics: [{ code, target, message }] });
  if (mode !== "edit") return reject("mode", "graph", "Track edits require paused edit mode.");
  if (expectedRevision !== graph.revision || !Number.isSafeInteger(graph.revision + 1)) return reject("revision", "graph", "Stale or exhausted graph revision.");
  if (!Array.isArray(operations) || operations.length < 1 || operations.length > GRAPH_LIMITS.operations) return reject("capacity", "operations", "Invalid operation count.");
  let pieces = [...graph.pieces], connections = [...graph.connections];
  for (const operation of operations) {
    if (!record(operation)) return reject("operation", "operations", "Malformed graph operation.");
    if (operation.type === "add" && keys(operation, ["type", "piece"])) {
      if (!record(operation.piece) || !idValid(operation.piece.id)) return reject("piece-shape", "add", "Malformed piece.");
      pieces.push(operation.piece as unknown as GraphPiece); // Candidate only; full validation precedes commit.
    }
    else if (operation.type === "connect" && keys(operation, ["type", "connection"])) {
      if (!record(operation.connection) || !idValid(operation.connection.id)) return reject("connection-shape", "connect", "Malformed connection.");
      connections.push(operation.connection as unknown as GraphConnection);
    }
    else if (operation.type === "remove" && keys(operation, ["type", "pieceId"])) {
      if (!pieces.some(piece => piece?.id === operation.pieceId)) return reject("missing-piece", "remove", "Cannot remove a missing piece.");
      pieces = pieces.filter(piece => piece.id !== operation.pieceId);
    } else if (operation.type === "move" && keys(operation, ["type", "pieceId", "pose"])) {
      if (!pieces.some(piece => piece?.id === operation.pieceId)) return reject("missing-piece", "move", "Cannot move a missing piece.");
      pieces = pieces.map(piece => piece.id === operation.pieceId ? { ...piece, pose: operation.pose as TrackPose } : piece);
    } else if (operation.type === "disconnect" && keys(operation, ["type", "connectionId"])) {
      if (!connections.some(connection => connection?.id === operation.connectionId)) return reject("missing-connection", "disconnect", "Cannot disconnect a missing connection.");
      connections = connections.filter(connection => connection.id !== operation.connectionId);
    } else return reject("operation", "operations", "Unsupported operation or unexpected fields.");
    if (pieces.length > GRAPH_LIMITS.pieces || connections.length > GRAPH_LIMITS.connections) return reject("capacity", "graph", "Batch exceeds graph capacity.");
  }
  const built = buildRouteGraph({ revision: graph.revision + 1, pieces, connections });
  return built.ok ? built : { ...built, graph };
}
