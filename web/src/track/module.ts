import { RAIL_HEAD_WIDTH, TRACK_GAUGE } from "../model/types";
import { buildArcLengthTable, centerlineLength, ORIGIN, sampleCenterline } from "./centerline";
import type { CenterlineDefinition, SamplingOptions, TrackPose, TrackVector } from "./centerline";

/** Original HO-like section. Dimensions are miniature metres, gauge is inner head-face gap. */
export const RAIL_PROFILE = Object.freeze({
  id: "tin-ho-profile-v1", gauge: TRACK_GAUGE, headWidth: RAIL_HEAD_WIDTH,
  footWidth: 0.0018, webWidth: 0.00045, footHeight: 0.0003, webHeight: 0.0012, headHeight: 0.0005,
});
export const SLEEPER = Object.freeze({ length: 0.029, width: 0.003, height: 0.0015, spacing: 0.007 });
export interface RailMesh { readonly positions: readonly number[]; readonly normals: readonly number[]; readonly indices: readonly number[] }
export interface SleeperPose { readonly distance: number; readonly position: TrackVector; readonly yaw: number }
export interface TrackConnector {
  readonly pieceId: string; readonly socketId: "entrance" | "exit";
  readonly position: TrackVector; readonly outward: TrackVector; readonly up: TrackVector;
  readonly gauge: number; readonly profile: string; readonly grade: number;
}
export interface TrackModule {
  readonly length: number; readonly rails: readonly [RailMesh, RailMesh];
  readonly sleepers: readonly SleeperPose[]; readonly connectors: readonly [TrackConnector, TrackConnector];
}
export interface ModuleOptions {
  readonly sampling?: SamplingOptions;
  /** Cumulative route distance at the entrance: preserves sleeper rhythm at module seams. */
  readonly routeOffset?: number;
  /** Omit end caps at connected seams; topology must explicitly supply this choice. */
  readonly capEntrance?: boolean;
  readonly capExit?: boolean;
}

function idValid(id: string): boolean { return typeof id === "string" && /^[A-Za-z0-9._:-]{1,128}$/.test(id); }
const vector = (x: number, y: number, z: number): TrackVector => Object.freeze({ x, y, z });
const negate = (a: TrackVector): TrackVector => vector(-a.x, -a.y, -a.z);
const railSpacing = RAIL_PROFILE.gauge + RAIL_PROFILE.headWidth;

export function trackConnectors(pieceId: string, definition: CenterlineDefinition, pose: TrackPose = ORIGIN): readonly [TrackConnector, TrackConnector] {
  if (!idValid(pieceId)) throw new RangeError("Invalid track piece ID.");
  const length = centerlineLength(definition), first = sampleCenterline(definition, 0, pose), last = sampleCenterline(definition, length, pose);
  const make = (socketId: "entrance" | "exit", position: TrackVector, outward: TrackVector): TrackConnector => Object.freeze({
    pieceId, socketId, position, outward, up: vector(0, 1, 0), gauge: RAIL_PROFILE.gauge, profile: RAIL_PROFILE.id, grade: 0,
  });
  return Object.freeze([make("entrance", first.position, negate(first.tangent)), make("exit", last.position, last.tangent)]);
}

/** Position/tangent tests are geometric only: occupancy and duplicate-connection ownership belong to the graph. */
export function connectorsCompatible(a: TrackConnector, b: TrackConnector): boolean {
  validateConnector(a); validateConnector(b);
  if (a.pieceId === b.pieceId || a.profile !== b.profile || a.gauge !== b.gauge || a.grade !== b.grade) return false;
  const gap = Math.hypot(a.position.x - b.position.x, a.position.y - b.position.y, a.position.z - b.position.z);
  const opposition = a.outward.x * b.outward.x + a.outward.y * b.outward.y + a.outward.z * b.outward.z;
  return gap <= 0.0002 && opposition <= -Math.cos(Math.PI / 720) && a.up.y * b.up.y === 1;
}

function validateConnector(connector: TrackConnector): void {
  if (!connector || !idValid(connector.pieceId) || !["entrance", "exit"].includes(connector.socketId)
    || connector.profile !== RAIL_PROFILE.id || connector.gauge !== RAIL_PROFILE.gauge || connector.grade !== 0) throw new RangeError("Unsupported track connector.");
  for (const item of [connector.position, connector.outward, connector.up]) {
    if (!item || ![item.x, item.y, item.z].every(Number.isFinite)) throw new RangeError("Invalid connector vector.");
  }
  if ([connector.position.x, connector.position.y, connector.position.z].some(value => Math.abs(value) > 103)
    || connector.outward.y !== 0 || Math.abs(Math.hypot(connector.outward.x, connector.outward.z) - 1) > 1e-10
    || connector.up.x !== 0 || connector.up.y !== 1 || connector.up.z !== 0) throw new RangeError("Invalid planar connector frame.");
}

/** Return a new rigid pose aligning one local socket exactly opposite the target. No live objects are moved. */
export function alignModuleSocket(definition: CenterlineDefinition, socketId: "entrance" | "exit", target: TrackConnector): TrackPose {
  validateConnector(target);
  if (socketId !== "entrance" && socketId !== "exit") throw new RangeError("Unknown module socket.");
  const local = trackConnectors("alignment-probe", definition)[socketId === "entrance" ? 0 : 1];
  const desiredYaw = Math.atan2(-target.outward.x, -target.outward.z);
  const localYaw = Math.atan2(local.outward.x, local.outward.z);
  const delta = desiredYaw - localYaw, yaw = Math.atan2(Math.sin(delta), Math.cos(delta));
  const c = Math.cos(yaw), s = Math.sin(yaw);
  const pose = { x: target.position.x - c * local.position.x - s * local.position.z,
    y: target.position.y - local.position.y, z: target.position.z + s * local.position.x - c * local.position.z, yaw };
  // Reuse the centerline's numeric/pose guards before returning a transform.
  sampleCenterline(definition, 0, pose);
  return Object.freeze(pose);
}

export function generateTrackModule(pieceId: string, definition: CenterlineDefinition, pose: TrackPose = ORIGIN, options: ModuleOptions = {}): TrackModule {
  const connectors = trackConnectors(pieceId, definition, pose), table = buildArcLengthTable(definition, options.sampling, pose);
  const routeOffset = options.routeOffset ?? 0;
  if (!Number.isFinite(routeOffset) || routeOffset < 0 || routeOffset > 10_000) throw new RangeError("Invalid sleeper route offset.");
  for (const cap of [options.capEntrance, options.capExit]) if (cap !== undefined && typeof cap !== "boolean") throw new RangeError("Invalid rail cap option.");
  const p = RAIL_PROFILE, bottom = SLEEPER.height, footTop = bottom + p.footHeight, webTop = footTop + p.webHeight, top = webTop + p.headHeight;
  // Counterclockwise section in right/up plane. Shared physical edges, hard face normals.
  const profile: readonly (readonly [number, number])[] = [
    [-p.footWidth / 2, bottom], [p.footWidth / 2, bottom], [p.footWidth / 2, footTop],
    [p.webWidth / 2, footTop], [p.webWidth / 2, webTop], [p.headWidth / 2, webTop],
    [p.headWidth / 2, top], [-p.headWidth / 2, top], [-p.headWidth / 2, webTop],
    [-p.webWidth / 2, webTop], [-p.webWidth / 2, footTop], [-p.footWidth / 2, footTop],
  ];
  const rails = [-1, 1].map(side => {
    const positions: number[] = [], normals: number[] = [], indices: number[] = [];
    for (let edge = 0; edge < profile.length; edge++) {
      const a = profile[edge]!, b = profile[(edge + 1) % profile.length]!, dx = b[0] - a[0], dy = b[1] - a[1], magnitude = Math.hypot(dx, dy);
      const nx = dy / magnitude, ny = -dx / magnitude, base = positions.length / 3;
      for (const sample of table.entries) for (const point of [a, b]) {
        const offset = side * railSpacing / 2 + point[0];
        positions.push(sample.position.x + sample.right.x * offset, sample.position.y + point[1], sample.position.z + sample.right.z * offset);
        normals.push(sample.right.x * nx, ny, sample.right.z * nx);
      }
      for (let segment = 0; segment < table.entries.length - 1; segment++) {
        const i = base + 2 * segment;
        indices.push(i, i + 1, i + 2, i + 1, i + 3, i + 2);
      }
    }
    // Three non-overlapping rectangles exactly tile the concave end section.
    const bands = [[p.footWidth, bottom, footTop], [p.webWidth, footTop, webTop], [p.headWidth, webTop, top]] as const;
    for (const end of [0, 1] as const) {
      if (end === 0 ? options.capEntrance === false : options.capExit === false) continue;
      const sample = end === 0 ? table.entries[0]! : table.entries.at(-1)!;
      for (const [width, low, high] of bands) {
        const base = positions.length / 3;
        for (const [x, y] of [[-width / 2, low], [width / 2, low], [width / 2, high], [-width / 2, high]]) {
          const offset = side * railSpacing / 2 + x!;
          positions.push(sample.position.x + sample.right.x * offset, sample.position.y + y!, sample.position.z + sample.right.z * offset);
          const direction = end === 0 ? -1 : 1;
          normals.push(sample.tangent.x * direction, 0, sample.tangent.z * direction);
        }
        if (end === 0) indices.push(base, base + 2, base + 1, base, base + 3, base + 2);
        else indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
      }
    }
    return Object.freeze({ positions: Object.freeze(positions), normals: Object.freeze(normals), indices: Object.freeze(indices) });
  }) as [RailMesh, RailMesh];
  const sleepers: SleeperPose[] = [];
  // Global half-spacing lattice: adjacent pieces do not restart their sleeper rhythm.
  const firstIndex = Math.ceil((routeOffset - SLEEPER.spacing / 2) / SLEEPER.spacing);
  for (let index = firstIndex; ; index++) {
    const distance = index * SLEEPER.spacing + SLEEPER.spacing / 2 - routeOffset;
    if (distance >= table.length - 1e-12) break;
    if (distance < -1e-12) continue;
    const sample = sampleCenterline(definition, Math.max(0, distance), pose);
    sleepers.push(Object.freeze({ distance: sample.distance, position: vector(sample.position.x, sample.position.y + SLEEPER.height / 2, sample.position.z), yaw: Math.atan2(sample.tangent.x, sample.tangent.z) }));
  }
  return Object.freeze({ length: table.length, rails: Object.freeze(rails), sleepers: Object.freeze(sleepers), connectors });
}
