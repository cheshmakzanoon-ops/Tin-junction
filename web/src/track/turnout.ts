import { centerlineLength } from "./centerline";
import type { TrackPose } from "./centerline";
import { buildRouteGraph, GRAPH_LIMITS } from "./graph";
import type { DirectedTrackEdge, GraphConnection, GraphDiagnostic, GraphPiece, RouteGraph, SocketRef } from "./graph";
import { RAIL_PROFILE } from "./module";

export type TurnoutRoute = "straight" | "diverging";
export type TurnoutSocket = "stock" | TurnoutRoute;
export interface TurnoutDefinition {
  readonly id: string;
  readonly pose: TrackPose;
  readonly straightLength: number;
  readonly radius: number;
  readonly sweep: number;
}
export interface NetworkSocketRef { readonly pieceId: string; readonly socketId: "entrance" | "exit" | TurnoutSocket }
export interface NetworkConnection { readonly id: string; readonly a: NetworkSocketRef; readonly b: NetworkSocketRef }
export interface TurnoutTopology {
  readonly revision: number;
  readonly pieces: readonly GraphPiece[];
  readonly turnouts: readonly TurnoutDefinition[];
  readonly connections: readonly NetworkConnection[];
}
export interface TurnoutSelection { readonly turnoutId: string; readonly route: TurnoutRoute }
export interface TurnoutRouteState {
  readonly topology: TurnoutTopology;
  readonly selections: readonly TurnoutSelection[];
  readonly graph: RouteGraph;
}
export type TurnoutBuildResult<T> = { readonly ok: true; readonly value: T } | { readonly ok: false; readonly diagnostics: readonly GraphDiagnostic[] };
export const TURNOUT_LIMITS = Object.freeze({ turnouts: 64, idLength: 100, maxSweep: Math.PI / 2 });

interface TopologyCache { readonly owners: ReadonlyMap<string, string>; readonly pieces: readonly GraphPiece[] }
interface StateCache { readonly edges: ReadonlyMap<string, DirectedTrackEdge>; readonly owners: ReadonlyMap<string, string> }
const topologyCaches = new WeakMap<TurnoutTopology, TopologyCache>();
const stateCaches = new WeakMap<TurnoutRouteState, StateCache>();
const record = (input: unknown): input is Record<string, unknown> => input !== null && typeof input === "object" && !Array.isArray(input);
const keys = (input: Record<string, unknown>, expected: readonly string[]): boolean => Object.keys(input).length === expected.length && expected.every(key => Object.hasOwn(input, key));
const idValid = (value: unknown): value is string => typeof value === "string" && /^[A-Za-z0-9._:-]{1,128}$/.test(value);
const ordered = <T extends { readonly id: string }>(a: T, b: T): number => a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
const routePieceId = (id: string, route: TurnoutRoute): string => `${id}:route:${route}`;
const socketKey = (ref: NetworkSocketRef): string => `${ref.pieceId}/${ref.socketId}`;
const reject = <T>(code: string, target: string, message: string): TurnoutBuildResult<T> => ({ ok: false, diagnostics: Object.freeze([Object.freeze({ code, target, message })]) });

function routePieces(turnout: TurnoutDefinition): readonly GraphPiece[] {
  return (["straight", "diverging"] as const).map(route => Object.freeze({
    id: routePieceId(turnout.id, route), pose: turnout.pose, gauge: RAIL_PROFILE.gauge, profile: RAIL_PROFILE.id,
    centerline: route === "straight" ? Object.freeze({ kind: "straight" as const, length: turnout.straightLength })
      : Object.freeze({ kind: "arc" as const, radius: turnout.radius, sweep: turnout.sweep }),
  }));
}

function compileGraph(topology: TurnoutTopology, pieces: readonly GraphPiece[], selections: readonly TurnoutSelection[]) {
  const routes = new Map(selections.map(item => [item.turnoutId, item.route]));
  const mapSocket = (ref: NetworkSocketRef): SocketRef => {
    const selected = routes.get(ref.pieceId);
    if (!selected) return { pieceId: ref.pieceId, socketId: ref.socketId as "entrance" | "exit" };
    const route = ref.socketId === "stock" ? selected : ref.socketId as TurnoutRoute;
    return { pieceId: routePieceId(ref.pieceId, route), socketId: ref.socketId === "stock" ? "entrance" : "exit" };
  };
  const connections: GraphConnection[] = topology.connections.map(item => ({ id: item.id, a: mapSocket(item.a), b: mapSocket(item.b) }));
  return buildRouteGraph({ revision: topology.revision, pieces, connections });
}

/** A turnout has one physical stock socket and two explicit routes with a common origin/tangent. */
export function buildTurnoutTopology(input: unknown): TurnoutBuildResult<TurnoutTopology> {
  if (!record(input) || !keys(input, ["revision", "pieces", "turnouts", "connections"])) return reject("shape", "topology", "Invalid turnout topology envelope.");
  if (!Array.isArray(input.turnouts) || input.turnouts.length > TURNOUT_LIMITS.turnouts || !Array.isArray(input.pieces)
    || input.pieces.length + input.turnouts.length * 2 > GRAPH_LIMITS.pieces
    || !Array.isArray(input.connections) || input.connections.length > GRAPH_LIMITS.connections) return reject("capacity", "topology", "Turnout topology exceeds its bounded capacity.");
  const ordinary = buildRouteGraph({ revision: input.revision, pieces: input.pieces, connections: [] });
  if (!ordinary.ok) return ordinary;
  const ids = new Set(ordinary.graph.pieces.map(piece => piece.id));
  const turnouts: TurnoutDefinition[] = [], derived: GraphPiece[] = [...ordinary.graph.pieces], owners = new Map<string, string>();
  for (const value of input.turnouts) {
    if (!record(value) || !keys(value, ["id", "pose", "straightLength", "radius", "sweep"]) || !idValid(value.id) || value.id.length > TURNOUT_LIMITS.idLength
      || !record(value.pose) || !keys(value.pose, ["x", "y", "z", "yaw"])) return reject("turnout-shape", "turnout", "Malformed turnout dimensions, placement or stable ID.");
    if (ids.has(value.id)) return reject("duplicate-piece", value.id, "Track and turnout IDs must be unique.");
    if (typeof value.sweep !== "number" || !Number.isFinite(value.sweep) || Math.abs(value.sweep) > TURNOUT_LIMITS.maxSweep) return reject("turnout-geometry", value.id, "Turnout divergence must be a finite planar sweep through at most 90 degrees.");
    const turnout = Object.freeze({ id: value.id, pose: Object.freeze({ ...value.pose }) as unknown as TrackPose,
      straightLength: value.straightLength as number, radius: value.radius as number, sweep: value.sweep });
    const routes = routePieces(turnout);
    try { for (const route of routes) centerlineLength(route.centerline); }
    catch { return reject("turnout-geometry", value.id, "Turnout routes require supported positive dimensions and radius."); }
    ids.add(value.id);
    for (const route of routes) {
      if (ids.has(route.id)) return reject("route-id-conflict", value.id, "An authored piece conflicts with a stable turnout route ID.");
      ids.add(route.id); owners.set(route.id, value.id); derived.push(route);
    }
    turnouts.push(turnout);
  }
  // A later turnout ID must not alias an earlier virtual route either.
  const definitions = new Map(turnouts.map(turnout => [turnout.id, turnout]));
  const ordinaryIds = new Set(ordinary.graph.pieces.map(piece => piece.id));
  const connectionIds = new Set<string>(), occupied = new Set<string>(), connections: NetworkConnection[] = [];
  for (const value of input.connections) {
    if (!record(value) || !keys(value, ["id", "a", "b"]) || !idValid(value.id)) return reject("connection-shape", "connection", "Malformed network connection.");
    if (connectionIds.has(value.id)) return reject("duplicate-connection", value.id, "Connection IDs must be unique.");
    const endpoints: NetworkSocketRef[] = [];
    for (const endpoint of [value.a, value.b]) {
      if (!record(endpoint) || !keys(endpoint, ["pieceId", "socketId"]) || !idValid(endpoint.pieceId)) return reject("socket-shape", value.id, "Malformed network socket.");
      const allowed = definitions.has(endpoint.pieceId) ? ["stock", "straight", "diverging"] : ordinaryIds.has(endpoint.pieceId) ? ["entrance", "exit"] : [];
      if (!allowed.includes(endpoint.socketId as string)) return reject("missing-socket", value.id, "Connection refers to an absent or unsupported physical socket.");
      const endpointCopy = Object.freeze({ pieceId: endpoint.pieceId, socketId: endpoint.socketId as NetworkSocketRef["socketId"] });
      const key = socketKey(endpointCopy);
      if (occupied.has(key)) return reject("occupied-socket", value.id, "A physical socket cannot be connected twice.");
      occupied.add(key); endpoints.push(endpointCopy);
    }
    if (endpoints[0]!.pieceId === endpoints[1]!.pieceId) return reject("self-connection", value.id, "Self connections within a track piece or turnout are not supported.");
    connectionIds.add(value.id);
    connections.push(Object.freeze({ id: value.id, a: endpoints[0]!, b: endpoints[1]! }));
  }
  turnouts.sort(ordered); connections.sort(ordered);
  const topology = Object.freeze({ revision: ordinary.graph.revision, pieces: ordinary.graph.pieces, turnouts: Object.freeze(turnouts), connections: Object.freeze(connections) });
  const selections = turnouts.map(turnout => ({ turnoutId: turnout.id, route: "straight" as const }));
  const compiled = compileGraph(topology, derived, selections);
  if (!compiled.ok) return compiled;
  topologyCaches.set(topology, { pieces: Object.freeze(derived), owners });
  return { ok: true, value: topology };
}

/** Geometry compiler only. Live switch commands must pass the routed consist's occupancy gate. */
export function compileTurnoutRoutes(topology: TurnoutTopology, input?: unknown): TurnoutBuildResult<TurnoutRouteState> {
  const cached = topologyCaches.get(topology);
  if (!cached) return reject("topology", "topology", "Use a validated turnout topology.");
  const values = input === undefined ? topology.turnouts.map(item => ({ turnoutId: item.id, route: "straight" })) : input;
  if (!Array.isArray(values) || values.length !== topology.turnouts.length) return reject("selection-shape", "selections", "Every turnout requires exactly one selected route.");
  const ids = new Set(topology.turnouts.map(item => item.id)), selections: TurnoutSelection[] = [];
  for (const value of values) {
    if (!record(value) || !keys(value, ["turnoutId", "route"]) || typeof value.turnoutId !== "string" || !ids.delete(value.turnoutId)
      || (value.route !== "straight" && value.route !== "diverging")) return reject("selection-shape", "selections", "Unknown, duplicated or malformed turnout selection.");
    selections.push(Object.freeze({ turnoutId: value.turnoutId, route: value.route }));
  }
  selections.sort((a, b) => a.turnoutId < b.turnoutId ? -1 : a.turnoutId > b.turnoutId ? 1 : 0);
  const graph = compileGraph(topology, cached.pieces, selections);
  if (!graph.ok) return graph;
  const state = Object.freeze({ topology, selections: Object.freeze(selections), graph: graph.graph });
  stateCaches.set(state, { edges: new Map(state.graph.edges.map(edge => [edge.id, edge])), owners: cached.owners });
  return { ok: true, value: state };
}

export function turnoutEdge(state: TurnoutRouteState, edgeId: string): DirectedTrackEdge {
  const edge = stateCaches.get(state)?.edges.get(edgeId);
  if (!edge) throw new RangeError("Unknown route edge or unvalidated turnout state.");
  return edge;
}

export function reverseTurnoutEdge(state: TurnoutRouteState, edgeId: string): DirectedTrackEdge {
  const edge = turnoutEdge(state, edgeId);
  return turnoutEdge(state, `${edge.pieceId}/${edge.direction === 1 ? "reverse" : "forward"}`);
}

export function turnoutOwner(state: TurnoutRouteState, edgeId: string): string | null {
  const edge = turnoutEdge(state, edgeId);
  return stateCaches.get(state)!.owners.get(edge.pieceId) ?? null;
}
