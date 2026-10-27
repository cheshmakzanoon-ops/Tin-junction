import { describe, expect, it, vi } from "vitest";
import * as THREE from "three";
import { TrainRig } from "../../../web/src/scene/train";
import { barrelRoofGeometry, turnedProfileGeometry } from "../../../web/src/scene/trainDetailGeometry";
import { VEHICLE_CATALOG } from "../../../web/src/simulation/vehicleCatalog";
import type { Palette } from "../../../web/src/scene/materials";
import { RAIL_OFFSET, RAIL_TOP } from "../../../web/src/scene/geometry";
import { WHEEL_RADIUS } from "../../../web/src/model/index";

vi.mock("../../../web/src/scene/materials", () => ({ steamTexture: () => new THREE.Texture() }));
const materials = new Map<PropertyKey, THREE.MeshStandardMaterial>();
const palette = new Proxy({}, { get: (_target, key) => {
  if (!materials.has(key)) materials.set(key, new THREE.MeshStandardMaterial());
  return materials.get(key);
} }) as Palette;
const dispose = (group: THREE.Object3D): void => group.traverse(object => {
  if (object instanceof THREE.Mesh || object instanceof THREE.Points) object.geometry.dispose();
});

describe("constructed workbench vehicle geometry", () => {
  it("keeps every visible body inside the route catalog's unchanged physical envelope", () => {
    const rig = new TrainRig(palette);
    for (const [bodyId, catalogId] of [["engine-01", "steam-01"], ["carriage-01", "coach-01"], ["freight-01", "wagon-01"]] as const) {
      const body = rig.group.getObjectByName(bodyId)!;
      expect(body).toBeDefined();
      const bounds = new THREE.Box3().setFromObject(body), definition = VEHICLE_CATALOG[catalogId];
      const tolerance = 1e-8;
      expect(bounds.min.x).toBeGreaterThanOrEqual(-definition.halfWidthMicrometres / 1e6 - tolerance);
      expect(bounds.max.x).toBeLessThanOrEqual(definition.halfWidthMicrometres / 1e6 + tolerance);
      expect(bounds.min.z).toBeGreaterThanOrEqual(-definition.bodyLengthMicrometres / 2e6 - tolerance);
      expect(bounds.max.z).toBeLessThanOrEqual(definition.bodyLengthMicrometres / 2e6 + tolerance);
      expect(bounds.max.y).toBeLessThanOrEqual(definition.heightMicrometres / 1e6 + tolerance);
      expect(bounds.min.y).toBeGreaterThan(0.0072);
    }
    dispose(rig.group);
  });

  it("has an open chimney bore and a physical annular rim at the steam outlet", () => {
    const rig = new TrainRig(palette), body = rig.group.getObjectByName("engine-01")!;
    body.updateMatrixWorld(true);
    const cast = (x: number) => new THREE.Raycaster(new THREE.Vector3(x, 0.07, 0.023), new THREE.Vector3(0, -1, 0), 0, 0.06).intersectObject(body, true);
    const bore = cast(0), rim = cast(0.0042);
    expect(bore.length).toBeGreaterThan(0);
    expect(bore[0]!.point.y).toBeLessThan(0.040);
    expect(rim.length).toBeGreaterThan(0);
    expect(rim[0]!.point.y).toBeCloseTo(0.0516, 6);
    dispose(rig.group);
  });

  it("leaves actual tyre-top clearance instead of hiding wheels inside full-width chassis blocks", () => {
    const rig = new TrainRig(palette);
    for (const [bodyId, axles] of [["engine-01", [-0.018, 0, 0.018]], ["carriage-01", [-0.014, 0.014]], ["freight-01", [-0.014, 0.014]]] as const) {
      const body = rig.group.getObjectByName(bodyId)!;
      body.updateMatrixWorld(true);
      for (const axle of axles) for (const offset of [-0.003, 0, 0.003]) for (const side of [-1, 1]) {
        const hits = new THREE.Raycaster(new THREE.Vector3(side * RAIL_OFFSET, RAIL_TOP + WHEEL_RADIUS + 0.002, axle + offset), new THREE.Vector3(0, 1, 0), 0, 0.03).intersectObject(body, true);
        expect(hits.length).toBeGreaterThan(0);
        expect(hits[0]!.point.y).toBeGreaterThanOrEqual(RAIL_TOP + 2 * WHEEL_RADIUS + 0.00009);
      }
    }
    dispose(rig.group);
  });

  it("closes both curved roof faces and both end plates without exceeding the authored crown", () => {
    const geometry = barrelRoofGeometry(0.027, 0.046, 0.0025, 0.0007);
    const material = new THREE.MeshBasicMaterial(), mesh = new THREE.Mesh(geometry, material);
    mesh.updateMatrixWorld(true);
    const ray = (from: [number, number, number], direction: [number, number, number]) => new THREE.Raycaster(new THREE.Vector3(...from), new THREE.Vector3(...direction), 0, 0.1).intersectObject(mesh);
    expect(ray([0, 0.02, 0], [0, -1, 0])[0]!.point.y).toBeCloseTo(0.0032, 7);
    expect(ray([0, -0.02, 0], [0, 1, 0])[0]!.point.y).toBeCloseTo(0.0025, 7);
    for (const end of [-1, 1]) expect(ray([0, 0.0028, end * 0.04], [0, 0, -end])[0]!.point.z).toBeCloseTo(end * 0.023, 7);
    for (const side of [-1, 1]) expect(ray([side * 0.03, 0.00035, 0], [-side, 0, 0])[0]!.point.x).toBeCloseTo(side * 0.0135, 7);
    geometry.dispose(); material.dispose();
  });

  it("rejects non-finite or impossible construction dimensions", () => {
    expect(() => barrelRoofGeometry(0.027, 0.046, 0, 0.001)).toThrow();
    expect(() => barrelRoofGeometry(0.027, 0.046, 0.02, 0.001)).toThrow();
    expect(() => barrelRoofGeometry(0.027, NaN, 0.0025, 0.0007)).toThrow();
    expect(() => turnedProfileGeometry([[0, 0], [0.01, 0], [0.01, NaN], [0, 0]])).toThrow();
  });
});
