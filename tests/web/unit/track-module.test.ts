import { describe, expect, it } from "vitest";
import { centerlineLength, sampleCenterline } from "../../../web/src/track/centerline";
import type { CenterlineDefinition, TrackPose } from "../../../web/src/track/centerline";
import { alignModuleSocket, connectorsCompatible, generateTrackModule, RAIL_PROFILE, SLEEPER, trackConnectors } from "../../../web/src/track/module";
import type { RailMesh, TrackConnector } from "../../../web/src/track/module";

const straight: CenterlineDefinition = { kind: "straight", length: 0.103 };
const arc: CenterlineDefinition = { kind: "arc", radius: 0.1, sweep: Math.PI / 2 };
const origin: TrackPose = { x: 0, y: 0, z: 0, yaw: 0 };
const xyz = (mesh: RailMesh, vertex: number): number[] => mesh.positions.slice(vertex * 3, vertex * 3 + 3);
const gap = (a: readonly number[], b: readonly number[]): number => Math.hypot(...a.map((value, index) => value - b[index]!));

describe("modular track geometry P05-T02", () => {
  it("uses the ratified inner-face gauge, not rail-center distance", () => {
    expect(RAIL_PROFILE.gauge).toBe(0.0165); expect(RAIL_PROFILE.headWidth).toBe(0.001);
    const module = generateTrackModule("straight", straight);
    // Profile edge 5 begins at right edge of head at its lower face.
    const sampleCount = module.rails[0].positions.length; expect(sampleCount).toBeGreaterThan(0);
    const leftHeadInner = Math.max(...module.rails[0].positions.filter((_, i) => i % 3 === 0 && module.rails[0].positions[i + 1]! >= 0.003 - 1e-12));
    const rightHeadInner = Math.min(...module.rails[1].positions.filter((_, i) => i % 3 === 0 && module.rails[1].positions[i + 1]! >= 0.003 - 1e-12));
    expect(rightHeadInner - leftHeadInner).toBeCloseTo(RAIL_PROFILE.gauge, 12);
  });

  for (const sweep of [-Math.PI / 2, Math.PI / 2]) it(`preserves gauge through minimum-radius arc ${sweep}`, () => {
    const definition = { kind: "arc" as const, radius: 0.1, sweep };
    const module = generateTrackModule("curve", definition, origin, { capEntrance: false, capExit: false });
    const samples = module.rails[0].positions.length / (12 * 2 * 3);
    // Inner head surfaces: left rail positive-X edge (5), right rail negative-X edge (7).
    for (let index = 0; index < samples; index++) {
      const left = xyz(module.rails[0], 5 * samples * 2 + index * 2);
      const right = xyz(module.rails[1], 7 * samples * 2 + index * 2 + 1);
      expect(gap(left, right)).toBeCloseTo(RAIL_PROFILE.gauge, 10);
    }
  });

  it("creates outward unit entrance/exit frames with stable semantic socket IDs", () => {
    const connectors = trackConnectors("curve-9", arc);
    expect(connectors.map(c => c.socketId)).toEqual(["entrance", "exit"]);
    expect(connectors[0].outward.z).toBe(-1); expect(connectors[1].outward.x).toBeCloseTo(1, 12);
    for (const connector of connectors) {
      expect(connector.pieceId).toBe("curve-9"); expect(connector.grade).toBe(0);
      expect(connector.up).toEqual({ x: 0, y: 1, z: 0 }); expect(connector.profile).toBe(RAIL_PROFILE.id);
    }
  });

  it("aligns either socket and survives arbitrary rigid transform round trips", () => {
    for (const yaw of [-Math.PI, -1.37, 0, 2.9]) for (const socketId of ["entrance", "exit"] as const) {
      const target = trackConnectors("a", straight, { x: -0.14, y: 0.02, z: 0.21, yaw })[1];
      const pose = alignModuleSocket(arc, socketId, target);
      const actual = trackConnectors("b", arc, pose)[socketId === "entrance" ? 0 : 1];
      expect(connectorsCompatible(target, actual)).toBe(true);
      expect(Math.hypot(actual.position.x - target.position.x, actual.position.z - target.position.z)).toBeLessThan(1e-12);
      expect(Math.hypot(actual.outward.x + target.outward.x, actual.outward.z + target.outward.z)).toBeLessThan(1e-12);
    }
  });

  it("does not mistake a decorative join or same-piece socket for a valid connection", () => {
    const a = trackConnectors("a", straight)[1];
    const pose = alignModuleSocket(arc, "entrance", a), b = trackConnectors("b", arc, pose)[0];
    expect(connectorsCompatible(a, b)).toBe(true);
    expect(connectorsCompatible(a, { ...b, pieceId: "a" })).toBe(false);
    expect(connectorsCompatible(a, { ...b, position: { ...b.position, x: b.position.x + 0.000201 } })).toBe(false);
    expect(connectorsCompatible(a, { ...b, outward: a.outward })).toBe(false);
    const delta = Math.PI / 700;
    expect(connectorsCompatible(a, { ...b, outward: { x: Math.sin(delta), y: 0, z: -Math.cos(delta) } })).toBe(false);
  });

  it("keeps rail section vertices coincident at straight/arc and arc/arc seams", () => {
    for (const first of [straight, arc]) {
      const second: CenterlineDefinition = { kind: "arc", radius: 0.1, sweep: -Math.PI / 2 };
      const a = generateTrackModule("a", first, origin, { capEntrance: false, capExit: false });
      const pose = alignModuleSocket(second, "entrance", a.connectors[1]);
      const b = generateTrackModule("b", second, pose, { capEntrance: false, capExit: false });
      for (const side of [0, 1] as const) {
        const aSamples = a.rails[side].positions.length / 72, bSamples = b.rails[side].positions.length / 72;
        for (let edge = 0; edge < 12; edge++) for (let corner = 0; corner < 2; corner++) {
          expect(gap(xyz(a.rails[side], edge * aSamples * 2 + (aSamples - 1) * 2 + corner), xyz(b.rails[side], edge * bSamples * 2 + corner))).toBeLessThan(1e-12);
        }
      }
    }
  });

  it("has outward winding, finite unit normals and no degenerate indexed faces", () => {
    for (const definition of [straight, arc, { ...arc, sweep: -Math.PI / 2 }]) {
      const module = generateTrackModule("check", definition);
      for (const mesh of module.rails) {
        expect(mesh.positions.length).toBe(mesh.normals.length);
        expect(mesh.positions.every(Number.isFinite)).toBe(true);
        for (let i = 0; i < mesh.indices.length; i += 3) {
          const ia = mesh.indices[i]!, ib = mesh.indices[i + 1]!, ic = mesh.indices[i + 2]!;
          const a = xyz(mesh, ia), b = xyz(mesh, ib), c = xyz(mesh, ic);
          const ab = b.map((v, j) => v - a[j]!), ac = c.map((v, j) => v - a[j]!);
          const cross = [ab[1]! * ac[2]! - ab[2]! * ac[1]!, ab[2]! * ac[0]! - ab[0]! * ac[2]!, ab[0]! * ac[1]! - ab[1]! * ac[0]!];
          const norm = mesh.normals.slice(ia * 3, ia * 3 + 3);
          expect(Math.hypot(...norm)).toBeCloseTo(1, 10);
          expect(cross.reduce((sum, value, j) => sum + value * norm[j]!, 0)).toBeGreaterThan(0);
        }
      }
    }
  });

  it("continues sleeper spacing across joins instead of restarting at each module", () => {
    const a = generateTrackModule("a", straight), pose = alignModuleSocket(arc, "entrance", a.connectors[1]);
    const b = generateTrackModule("b", arc, pose, { routeOffset: a.length });
    const distances = [...a.sleepers.map(s => s.distance), ...b.sleepers.map(s => s.distance + a.length)];
    expect(distances[0]).toBe(SLEEPER.spacing / 2);
    for (let index = 1; index < distances.length; index++) expect(distances[index]! - distances[index - 1]!).toBeCloseTo(SLEEPER.spacing, 12);
    for (const sleeper of b.sleepers) {
      const sample = sampleCenterline(arc, sleeper.distance, pose);
      expect(sleeper.position.x).toBe(sample.position.x); expect(sleeper.position.z).toBe(sample.position.z);
      expect(sleeper.position.y).toBe(sample.position.y + SLEEPER.height / 2);
    }
  });

  it("assigns a sleeper exactly on a module boundary only to the following piece", () => {
    const first: CenterlineDefinition = { kind: "straight", length: SLEEPER.spacing / 2 };
    const a = generateTrackModule("a", first), b = generateTrackModule("b", straight, { ...origin, z: a.length }, { routeOffset: a.length });
    expect(a.sleepers).toHaveLength(0); expect(b.sleepers[0]!.distance).toBe(0);
  });

  it("leaves rail endpoints open only when explicitly requested", () => {
    const closed = generateTrackModule("a", straight), open = generateTrackModule("b", straight, origin, { capEntrance: false, capExit: false });
    expect(closed.rails[0].indices.length - open.rails[0].indices.length).toBe(36);
    expect(Object.isFrozen(closed)).toBe(true); expect(Object.isFrozen(closed.rails[0].positions)).toBe(true);
  });

  it("bounds malformed metadata, geometry and allocation inputs", () => {
    for (const id of ["", "bad id", "a".repeat(129)]) expect(() => generateTrackModule(id, straight)).toThrow(RangeError);
    for (const routeOffset of [NaN, Infinity, -1, 10001]) expect(() => generateTrackModule("a", straight, origin, { routeOffset })).toThrow(RangeError);
    expect(() => generateTrackModule("a", { ...arc, radius: 0 })).toThrow(RangeError);
    const connector = trackConnectors("a", straight)[1];
    for (const malformed of [null, { ...connector, gauge: NaN }, { ...connector, outward: { x: 0, y: 0, z: 0 } }, { ...connector, profile: "unknown" }]) {
      expect(() => alignModuleSocket(arc, "entrance", malformed as TrackConnector)).toThrow(RangeError);
    }
    expect(centerlineLength(arc)).toBeGreaterThan(0);
  });
});
