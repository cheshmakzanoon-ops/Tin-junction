import { describe, expect, it } from "vitest";
import { MeshStandardMaterial } from "three";
import { sampleOval, RAIL_CENTER_SPACING, SCENERY_FOOTPRINT, TRACK_GAUGE } from "../../../web/src/model/index";
import { distanceFromTrack, loopLength, makeTerrain, RAIL_HEAD_WIDTH, RAIL_OFFSET, RAIL_TOP, rectangularRail, sweepProfile, terrainHeight, visualRandom } from "../../../web/src/scene/geometry";
import { createPrefabs } from "../../../web/src/scene/scenery";
import type { Palette } from "../../../web/src/scene/materials";

const track = { kind: "oval" as const, straightLength: 0.34, radius: 0.145 };

describe("rendered rail and miniature scale correspondence", () => {
  it("uses the model's gauge with rail-head width included exactly once", () => {
    expect(RAIL_OFFSET * 2 - RAIL_HEAD_WIDTH).toBeCloseTo(TRACK_GAUGE, 10);
    expect(RAIL_OFFSET * 2).toBeCloseTo(RAIL_CENTER_SPACING, 10);
  });

  it("sweeps a finite closed rail with exact height and no joint gap", () => {
    const geometry = rectangularRail(track, RAIL_OFFSET, RAIL_HEAD_WIDTH, 0.0063, RAIL_TOP);
    const positions = geometry.getAttribute("position"), normals = geometry.getAttribute("normal");
    expect(positions.count).toBe(385 * 4);
    for (let index = 0; index < positions.count; index++) {
      expect(Number.isFinite(positions.getX(index) + positions.getY(index) + positions.getZ(index))).toBe(true);
      expect(Number.isFinite(normals.getX(index) + normals.getY(index) + normals.getZ(index))).toBe(true);
      expect(positions.getY(index)).toBeGreaterThanOrEqual(0.0063 - 1e-8);
      expect(positions.getY(index)).toBeLessThanOrEqual(RAIL_TOP + 1e-8);
    }
    for (let corner = 0; corner < 4; corner++) {
      expect(positions.getX(corner)).toBeCloseTo(positions.getX(384 * 4 + corner), 7);
      expect(positions.getZ(corner)).toBeCloseTo(positions.getZ(384 * 4 + corner), 7);
    }
    geometry.dispose();
  });

  it("places rail faces at the authoritative route normal on curves as well as straights", () => {
    const segments = 64;
    const geometry = sweepProfile(track, [[RAIL_OFFSET - RAIL_HEAD_WIDTH / 2, 0.0063], [RAIL_OFFSET + RAIL_HEAD_WIDTH / 2, 0.0063], [RAIL_OFFSET + RAIL_HEAD_WIDTH / 2, RAIL_TOP], [RAIL_OFFSET - RAIL_HEAD_WIDTH / 2, RAIL_TOP]], segments);
    const positions = geometry.getAttribute("position");
    for (let index = 0; index <= segments; index++) {
      const point = sampleOval(track, loopLength(track) * index / segments);
      const dx = positions.getX(index * 4) - point.position.x;
      const dz = positions.getZ(index * 4) - point.position.z;
      expect(Math.hypot(dx, dz)).toBeCloseTo(TRACK_GAUGE / 2, 6);
      expect(dx * point.tangent.x + dz * point.tangent.z).toBeCloseTo(0, 6);
    }
    geometry.dispose();
  });

  it("rejects invalid sweep counts and non-finite profile values", () => {
    expect(() => sweepProfile(track, [[0, 0], [1, 0]], 32)).toThrow();
    expect(() => sweepProfile(track, [[0, 0], [1, 0], [1, Number.NaN]], 32)).toThrow();
    expect(() => sweepProfile(track, [[0, 0], [1, 0], [1, 1]], 0)).toThrow();
    expect(() => sweepProfile(track, [[0, 0], [1, 0], [1, 1]], 100_000)).toThrow();
  });
});

describe("presentation terrain and reproducible resource limits", () => {
  it("keeps every authored scenery mesh inside the model's validated placement footprint", () => {
    const material = new MeshStandardMaterial();
    const palette = Object.fromEntries(["bark", "pine", "pineLight", "leaf", "rock", "plaster", "roof", "roofDark", "darkWood", "glass", "trim", "green", "platform", "plasterDark", "iron", "lampGlass", "wagon"].map(name => [name, material])) as unknown as Palette;
    const prefabs = createPrefabs(palette);
    for (const [kind, parts] of Object.entries(prefabs)) for (const part of parts) {
      const positions = part.geometry.getAttribute("position");
      for (let index = 0; index < positions.count; index += 1) {
        expect(Math.hypot(positions.getX(index), positions.getZ(index))).toBeLessThanOrEqual(SCENERY_FOOTPRINT[kind as keyof typeof SCENERY_FOOTPRINT] + 1e-8);
      }
      part.geometry.dispose();
    }
    material.dispose();
  });

  it("keeps the entire rail bed level while giving surrounding landforms small relief", () => {
    for (let index = 0; index < 300; index++) {
      const point = sampleOval(track, loopLength(track) * index / 300);
      expect(distanceFromTrack(point.position.x, point.position.z, track)).toBeCloseTo(0, 10);
      expect(terrainHeight(point.position.x, point.position.z, track)).toBeCloseTo(0.0004, 10);
    }
    expect(terrainHeight(-0.21, 0.015, track)).toBeGreaterThan(0.01);
    expect(terrainHeight(-0.037, -0.081, track)).toBe(0.0004);
    expect(terrainHeight(0.205, 0.066, track)).toBe(0.0004);
  });

  it("builds bounded, finite terrain vertices entirely inside the board footprint", () => {
    const geometry = makeTerrain(track), positions = geometry.getAttribute("position");
    expect(positions.count).toBe(97 * 65);
    for (let index = 0; index < positions.count; index++) {
      expect(Math.abs(positions.getX(index))).toBeLessThan(0.401);
      expect(Math.abs(positions.getZ(index))).toBeLessThan(0.251);
      expect(positions.getY(index)).toBeGreaterThanOrEqual(0);
      expect(positions.getY(index)).toBeLessThan(0.03);
    }
    geometry.dispose();
  });

  it("reproduces decorative grain and ballast from a fixed local seed", () => {
    const a = visualRandom(81), b = visualRandom(81), c = visualRandom(82);
    const values = Array.from({ length: 64 }, () => a());
    expect(Array.from({ length: 64 }, () => b())).toEqual(values);
    expect(Array.from({ length: 64 }, () => c())).not.toEqual(values);
    expect(values.every(value => value >= 0 && value < 1)).toBe(true);
  });
});
