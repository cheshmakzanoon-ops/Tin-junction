import { describe, expect, it, vi } from "vitest";
import { Box3, CylinderGeometry, Mesh, MeshStandardMaterial, Texture } from "three";
import type { Object3D } from "three";
import { COUPLER_EXTENSION, COUPLER_GAP, CONSIST, createStarterLayout, distanceToOval, validTrack } from "../../../web/src/model";
import type { OvalTrack } from "../../../web/src/model";
import { createStation } from "../../../web/src/scene/scenery";
import { FixedStationPlacement, rectangleToOvalClearance, stationFitsTrack, STATION_CLEARANCE } from "../../../web/src/scene/stationPlacement";
import { TrainRig } from "../../../web/src/scene/train";
import type { Palette } from "../../../web/src/scene/materials";
import { DEFAULT_VEHICLES, VEHICLE_CATALOG, VEHICLE_CONSTRAINTS } from "../../../web/src/simulation/vehicleCatalog";

vi.mock("../../../web/src/scene/materials", () => ({ labelTexture: () => new Texture(), clockTexture: () => new Texture(), steamTexture: () => new Texture() }));
const makePalette = (): Palette => {
  const materials = new Map<PropertyKey, MeshStandardMaterial>();
  return new Proxy({}, { get: (_target, key) => {
    if (!materials.has(key)) materials.set(key, new MeshStandardMaterial());
    return materials.get(key);
  } }) as Palette;
};
function dispose(object: Object3D): void {
  object.traverse(node => { if (node instanceof Mesh) {
    node.geometry.dispose();
    for (const material of Array.isArray(node.material) ? node.material : [node.material]) material.dispose();
  } });
}
const track = (straightLength = 0.34, radius = 0.145): OvalTrack => ({ kind: "oval", straightLength, radius });
const footprint = { minX: -0.11154, maxX: 0.06732, minZ: -0.13, maxZ: -0.0562 };

describe("fixed station compatibility with supported ovals", () => {
  it("detects a rail crossing the filled footprint when every corner is clear", () => {
    const bounds = { minX: -0.04, maxX: 0.04, minZ: -0.13, maxZ: -0.08 }, oval = track(0.34, 0.1);
    for (const x of [bounds.minX, bounds.maxX]) for (const z of [bounds.minZ, bounds.maxZ])
      expect(distanceToOval(oval, x, z)).toBeGreaterThanOrEqual(0.019999);
    expect(rectangleToOvalClearance(oval, bounds)).toBe(0);
    expect(stationFitsTrack(oval, footprint)).toBe(false);
  });

  it("finds continuous interior, exterior and curved-end distances", () => {
    const oval = track(0.2, 0.1);
    expect(rectangleToOvalClearance(oval, { minX: -0.02, maxX: 0.02, minZ: -0.06, maxZ: -0.04 })).toBeCloseTo(0.04, 12);
    expect(rectangleToOvalClearance(oval, { minX: -0.02, maxX: 0.02, minZ: -0.14, maxZ: -0.12 })).toBeCloseTo(0.02, 12);
    expect(rectangleToOvalClearance(oval, { minX: 0.13, maxX: 0.15, minZ: 0.01, maxZ: 0.02 })).toBeCloseTo(0.1 - Math.hypot(0.05, 0.02), 12);
    expect(rectangleToOvalClearance(oval, { minX: 0.19, maxX: 0.21, minZ: -0.005, maxZ: 0.005 })).toBe(0);
  });

  it("requires the positive body gap and rejects rounded equality at the straight platform", () => {
    const threshold = 0.13 + STATION_CLEARANCE.halfWidth + STATION_CLEARANCE.margin;
    expect(stationFitsTrack(track(0.34, threshold - 1e-8), footprint)).toBe(false);
    expect(stationFitsTrack(track(0.34, threshold), footprint)).toBe(false);
    expect(stationFitsTrack(track(0.34, threshold + 1e-8), footprint)).toBe(true);
    expect(stationFitsTrack(createStarterLayout().track, footprint)).toBe(true);
  });

  it("uses the conservative full curve corridor when bends can reach the station", () => {
    expect(stationFitsTrack(track(0.2, 0.145), footprint)).toBe(false);
    expect(stationFitsTrack(track(0.2, 0.18), footprint)).toBe(true);
    const required = STATION_CLEARANCE.curveHalfWidth + STATION_CLEARANCE.margin;
    const farthest = Math.hypot(0.11154 - 0.05, 0.13);
    expect(stationFitsTrack(track(0.1, farthest + required), footprint)).toBe(false);
    expect(stationFitsTrack(track(0.1, farthest + required + 1e-8), footprint)).toBe(true);
  });

  it("handles the complete supported shape range without changing oval validity", () => {
    for (const length of [0.1, 0.2, 0.34, 0.5]) for (const radius of [0.1, 0.125, 0.145, 0.17, 0.2]) {
      const oval = track(length, radius);
      if (!validTrack(oval)) continue;
      const before = JSON.stringify(oval), visible = stationFitsTrack(oval, footprint);
      expect(Number.isFinite(rectangleToOvalClearance(oval, footprint))).toBe(true);
      if (radius === 0.1) expect(visible).toBe(false);
      if (visible) expect(rectangleToOvalClearance(oval, footprint)).toBeGreaterThan(STATION_CLEARANCE.halfWidth + STATION_CLEARANCE.margin);
      expect(JSON.stringify(oval)).toBe(before);
    }
  });

  it("updates the actual constructed station instance and restores it without moving or rebuilding geometry", () => {
    const station = createStation(makePalette()), placement = new FixedStationPlacement(station);
    const matrices = station.children.map(child => child.matrix.elements.slice()), geometry = station.children.map(child => (child as Mesh).geometry);
    const bounds = new Box3().setFromObject(station), starter = createStarterLayout(), original = JSON.stringify(starter);
    expect(placement.footprint.minX).toBeCloseTo(bounds.min.x, 12);
    expect(placement.footprint.minZ).toBeCloseTo(-0.13, 7);
    expect(station.visible).toBe(false);
    placement.update(starter.track); expect(station.visible).toBe(true);
    placement.update(track(0.34, 0.1)); expect(station.visible).toBe(false);
    placement.update(starter.track); expect(station.visible).toBe(true);
    expect(station.children.map(child => (child as Mesh).geometry)).toEqual(geometry);
    expect(station.children.map(child => child.matrix.elements)).toEqual(matrices);
    expect(JSON.stringify(starter)).toBe(original);
    dispose(station);
  });

  it("fails closed for malformed bounds, out-of-reservation architecture or unsupported tracks", () => {
    for (const bounds of [{ ...footprint, minX: NaN }, { ...footprint, minX: 0.2 }, { ...footprint, maxX: 0.12 }, { ...footprint, maxZ: -0.04 }])
      expect(stationFitsTrack(track(), bounds)).toBe(false);
    expect(stationFitsTrack(track(0.1, 0.09), footprint)).toBe(false);
    expect(() => rectangleToOvalClearance(track(), { ...footprint, maxZ: Infinity })).toThrow();
    expect(() => rectangleToOvalClearance(track(0.5, 0.2), footprint)).toThrow();
  });

  it("ties the conservative body and narrow coupling bounds to the actual workbench train", () => {
    DEFAULT_VEHICLES.forEach((vehicle, index) => {
      const definition = VEHICLE_CATALOG[vehicle.catalogId];
      expect(definition.bodyLengthMicrometres / 1e6).toBe(CONSIST[index]!.bodyLength);
      expect(definition.wheelbaseMicrometres / 1e6).toBe(CONSIST[index]!.wheelbase);
    });
    expect(COUPLER_EXTENSION).toBe(VEHICLE_CONSTRAINTS.couplerExtensionMicrometres / 1e6);
    expect(COUPLER_GAP).toBe(VEHICLE_CONSTRAINTS.couplerGapMicrometres / 1e6);
    expect(STATION_CLEARANCE.couplerHalfWidth).toBeLessThan(STATION_CLEARANCE.halfWidth);
    const rig = new TrainRig(makePalette());
    const links = rig.group.children.filter(child => child instanceof Mesh && child.geometry instanceof CylinderGeometry && child.geometry.parameters.height === 1) as Mesh<CylinderGeometry>[];
    expect(links).toHaveLength(2);
    for (const link of links) {
      expect(link.geometry.parameters.radiusTop).toBeLessThanOrEqual(STATION_CLEARANCE.couplerRadius);
      expect(link.geometry.parameters.radiusBottom).toBeLessThanOrEqual(STATION_CLEARANCE.couplerRadius);
    }
    dispose(rig.group);
  });
});
