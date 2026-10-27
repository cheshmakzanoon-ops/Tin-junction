import { describe, expect, it, vi } from "vitest";
import * as THREE from "three";
import { CONSIST, createStarterLayout, vehiclePose, WHEEL_RADIUS } from "../../../web/src/model/index";
import { RAIL_TOP } from "../../../web/src/scene/geometry";
import { CHIMNEY_OUTLET, CRANK_RADIUS, crankOffset, steamOrigin } from "../../../web/src/scene/trainMechanics";
import type { Palette } from "../../../web/src/scene/materials";
import { TrainRig, wheelPrefab } from "../../../web/src/scene/train";

vi.mock("../../../web/src/scene/materials", () => ({ steamTexture: () => new THREE.Texture() }));
const track = createStarterLayout().track;
const palette = new Proxy({}, { get: (_target, key) => {
  if (!materials.has(key)) materials.set(key, new THREE.MeshStandardMaterial());
  return materials.get(key);
} }) as Palette;
const materials = new Map<PropertyKey, THREE.Material>();

describe("locomotive mechanical presentation", () => {
  it("places steam at the actual chimney transform around the complete oval", () => {
    for (const distance of [0, 0.02, 0.34, 0.5, 0.8, 1.2, -0.1]) {
      const pose = vehiclePose(track, distance, CONSIST[0]!.wheelbase);
      const expected = new THREE.Vector3(CHIMNEY_OUTLET.x, CHIMNEY_OUTLET.y, CHIMNEY_OUTLET.z)
        .applyAxisAngle(new THREE.Vector3(0, 1, 0), pose.yaw)
        .add(new THREE.Vector3(pose.position.x, 0, pose.position.z));
      for (const direction of [-1, 1] as const) {
        const actual = steamOrigin(track, distance, 0.04, direction);
        expect(actual.x).toBeCloseTo(expected.x, 12);
        expect(actual.y).toBeCloseTo(expected.y, 12);
        expect(actual.z).toBeCloseTo(expected.z, 12);
      }
    }
  });

  it("back-projects the outlet behind forward travel and ahead of reverse travel without turning the body", () => {
    const now = steamOrigin(track, 0.15, 0.04, 1);
    const forward = steamOrigin(track, 0.15, 0.04, 1, 1);
    const reverse = steamOrigin(track, 0.15, 0.04, -1, 1);
    expect(now.x - forward.x).toBeCloseTo(0.04, 10);
    expect(reverse.x - now.x).toBeCloseTo(0.04, 10);
    expect(forward.z).toBeCloseTo(now.z, 10);
    expect(reverse.z).toBeCloseTo(now.z, 10);
  });

  it("rejects invalid effect inputs instead of propagating non-finite vertices", () => {
    expect(() => steamOrigin(track, NaN, 0, 1)).toThrow();
    expect(() => steamOrigin(track, 0, -1, 1)).toThrow();
    expect(() => steamOrigin(track, 0, 0, 1, Infinity)).toThrow();
    expect(() => steamOrigin(track, 0, 0, 1, 2)).toThrow();
  });

  it("quarters the opposite crank and preserves the pin radius through reverse rotation", () => {
    for (const phase of [-20, -Math.PI, 0, Math.PI / 2, 31]) {
      const left = crankOffset(phase, -1), right = crankOffset(phase, 1);
      expect(Math.hypot(left.y, left.z)).toBeCloseTo(CRANK_RADIUS, 14);
      expect(Math.hypot(right.y, right.z)).toBeCloseTo(CRANK_RADIUS, 14);
      expect(left.y * right.y + left.z * right.z).toBeCloseTo(0, 14);
      expect(left.x).toBe(-right.x);
    }
  });

  it("has genuine open gaps between spokes, a continuous tyre and an inboard flange", () => {
    const wheel = wheelPrefab(palette);
    wheel.updateMatrixWorld(true);
    const ray = (radius: number, angle: number) => new THREE.Raycaster(
      new THREE.Vector3(0.02, radius * Math.cos(angle), radius * Math.sin(angle)),
      new THREE.Vector3(-1, 0, 0), 0, 0.04,
    ).intersectObject(wheel, true);
    expect(ray(0.0035, Math.PI / 8)).toHaveLength(0);
    expect(ray(0.0035, 0).length).toBeGreaterThan(0);
    expect(ray(0, 0).length).toBeGreaterThan(0);
    for (let i = 0; i < 16; i += 1) expect(ray(0.0054, i * Math.PI / 8).length).toBeGreaterThan(0);
    const flange = ray(WHEEL_RADIUS + 0.00025, Math.PI / 8);
    expect(flange.length).toBeGreaterThan(0);
    expect(flange.every(hit => hit.point.x < -0.0008)).toBe(true);
    expect(wheel.children.length).toBeLessThanOrEqual(3);
    wheel.traverse(object => { if (object instanceof THREE.Mesh) object.geometry.dispose(); });
  });

  it("registers actual rig steam and pins and avoids unsupported negative instance transforms", () => {
    const rig = new TrainRig(palette);
    const document = createStarterLayout();
    document.train.speed = 0.04;
    document.train.distance = 0.12;
    document.train.wheelTravel = 0;
    document.tick = 0;
    rig.update(document);
    const steam = rig.group.getObjectByName("chimney-steam") as THREE.Points;
    const point = steam.geometry.getAttribute("position");
    const expected = steamOrigin(track, document.train.distance, 0.04, 1);
    expect(point.getX(0)).toBeCloseTo(expected.x, 7);
    expect(point.getY(0)).toBeCloseTo(expected.y, 7);
    expect(point.getZ(0)).toBeCloseTo(expected.z, 7);
    const matrix = new THREE.Matrix4();
    for (const wheel of rig.group.children.filter(child => child.name === "instanced-wheel-parts") as THREE.InstancedMesh[]) {
      for (let i = 0; i < wheel.count; i += 1) {
        wheel.getMatrixAt(i, matrix);
        expect(matrix.determinant()).toBeCloseTo(1, 6);
      }
    }
    const pins = rig.group.getObjectByName("quartered-crank-pins") as THREE.InstancedMesh;
    const pose = vehiclePose(track, document.train.distance, CONSIST[0]!.wheelbase);
    const bodyInverse = new THREE.Matrix4().compose(new THREE.Vector3(pose.position.x, 0, pose.position.z),
      new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), pose.yaw), new THREE.Vector3(1, 1, 1)).invert();
    for (let i = 0; i < 6; i += 1) {
      pins.getMatrixAt(i, matrix);
      const p = new THREE.Vector3().setFromMatrixPosition(matrix).applyMatrix4(bodyInverse);
      const crank = crankOffset(0, i < 3 ? -1 : 1);
      expect(p.x).toBeCloseTo(crank.x, 7);
      expect(p.y).toBeCloseTo(RAIL_TOP + WHEEL_RADIUS + crank.y, 7);
      expect(p.z).toBeCloseTo(crank.z + (i % 3 - 1) * CONSIST[0]!.wheelbase / 2, 7);
    }
  });
});
