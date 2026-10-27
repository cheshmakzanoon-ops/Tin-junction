import { describe, expect, it } from "vitest";
import { Box3, Mesh, MeshStandardMaterial, Raycaster, Vector3 } from "three";
import type { BufferGeometry, Group, Material } from "three";
import { createBevelledBlockGeometry, createCottageArchitecture, createRidgeCapGeometry, createStationArchitecture, createWallGeometry, COTTAGE_DIMENSIONS, STATION_DIMENSIONS } from "../../../web/src/scene/architectureGeometry";
import { compactGroup } from "../../../web/src/scene/geometry";
import { createPrefabs } from "../../../web/src/scene/scenery";
import { RESERVED_SCENERY_AREAS, SCENERY_FOOTPRINT } from "../../../web/src/model";
import type { Palette } from "../../../web/src/scene/materials";

function palette(): Palette {
  return Object.fromEntries(["bark", "pine", "pineLight", "leaf", "rock", "plaster", "roof", "roofDark", "darkWood", "glass", "trim", "green", "platform", "plasterDark", "iron", "lampGlass", "wagon"].map(name => [name, new MeshStandardMaterial()])) as unknown as Palette;
}
function dispose(group: Group, materials: Palette): void {
  group.traverse(node => { if (node instanceof Mesh) node.geometry.dispose(); });
  Object.values(materials).forEach(material => material.dispose());
}
function inspectClosed(geometry: BufferGeometry): void {
  const positions = geometry.getAttribute("position"), indices = geometry.index, edges = new Map<string, number>();
  let volume = 0;
  for (let index = 0; index < (indices?.count ?? positions.count); index += 3) {
    const points = [0, 1, 2].map(corner => new Vector3().fromBufferAttribute(positions, indices?.getX(index + corner) ?? index + corner));
    const [a, b, c] = points as [Vector3, Vector3, Vector3];
    expect(points.flatMap(point => point.toArray()).every(Number.isFinite)).toBe(true);
    expect(b.clone().sub(a).cross(c.clone().sub(a)).length()).toBeGreaterThan(1e-12);
    volume += a.dot(b.clone().cross(c)) / 6;
    const keys = points.map(point => point.toArray().map(value => Math.round(value * 1e8)).join(","));
    for (let edge = 0; edge < 3; edge++) {
      const key = [keys[edge]!, keys[(edge + 1) % 3]!].sort().join("|");
      edges.set(key, (edges.get(key) ?? 0) + 1);
    }
  }
  expect([...edges.values()].every(count => count === 2)).toBe(true);
  expect(volume).toBeGreaterThan(0);
}

describe("original cottage and station construction", () => {
  it("keeps thin bevels closed and at their declared size without dense rounded-box tessellation", () => {
    const geometry = createBevelledBlockGeometry(0.04, 0.006, 0.03, 0.00025);
    inspectClosed(geometry);
    expect(geometry.getAttribute("position").count / 3).toBe(44);
    const size = geometry.boundingBox!.getSize(new Vector3());
    expect(size.x).toBeCloseTo(0.04, 8); expect(size.y).toBeCloseTo(0.006, 8); expect(size.z).toBeCloseTo(0.03, 8);
    geometry.dispose();
  });

  it("creates real wall openings with closed reveals instead of hiding solid plaster behind glazing", () => {
    const material = new MeshStandardMaterial(), geometry = createWallGeometry(0.04, 0.03, 0.0012, [{ x: 0, y: 0.008, width: 0.009, height: 0.011 }]);
    inspectClosed(geometry);
    const wall = new Mesh(geometry, material); wall.updateMatrixWorld();
    const ray = new Raycaster(new Vector3(0.002, 0.014, 0.02), new Vector3(0, 0, -1));
    expect(ray.intersectObject(wall)).toHaveLength(0);
    ray.set(new Vector3(0.01, 0.014, 0.02), new Vector3(0, 0, -1));
    expect(ray.intersectObject(wall)[0]!.point.z).toBeCloseTo(0.0006, 8);
    geometry.dispose(); material.dispose();
  });

  it("rejects out-of-wall, overlapping and non-finite apertures before geometry creation", () => {
    for (const opening of [{ x: 0.019, y: 0.01, width: 0.008, height: 0.01 }, { x: 0, y: 0, width: 0.008, height: 0.01 }, { x: 0, y: 0.01, width: NaN, height: 0.01 }])
      expect(() => createWallGeometry(0.04, 0.03, 0.001, [opening])).toThrow();
    expect(() => createWallGeometry(0.04, 0.03, 0.001, [{ x: 0, y: 0.005, width: 0.01, height: 0.01 }, { x: 0.002, y: 0.006, width: 0.01, height: 0.01 }])).toThrow();
  });

  it("keeps cottage geometry inside its physical footprint before prefab fitting and below the closure envelope", () => {
    const materials = palette(), cottage = createCottageArchitecture(materials), point = new Vector3();
    cottage.updateMatrixWorld(true);
    let radius = 0;
    cottage.traverse(node => {
      if (!(node instanceof Mesh)) return;
      const positions = node.geometry.getAttribute("position");
      for (let index = 0; index < positions.count; index++) {
        point.fromBufferAttribute(positions, index).applyMatrix4(node.matrixWorld);
        radius = Math.max(radius, Math.hypot(point.x, point.z));
      }
    });
    const bounds = new Box3().setFromObject(cottage);
    expect(radius).toBeLessThanOrEqual(SCENERY_FOOTPRINT.house);
    expect(bounds.min.y).toBeCloseTo(0, 8);
    expect(bounds.max.y).toBeLessThanOrEqual(COTTAGE_DIMENSIONS.maximumHeight);
    expect(new Box3().setFromObject(cottage.getObjectByName("cottage-ground-foundation")!).min.y).toBeCloseTo(0, 8);
    dispose(cottage, materials);
  });

  it("exposes inset glazing through real openings on every cottage façade", () => {
    const materials = palette(), cottage = createCottageArchitecture(materials); cottage.updateMatrixWorld(true);
    for (const name of ["cottage-front", "cottage-rear", "cottage-side--1", "cottage-side-1"]) {
      const face = cottage.getObjectByName(name)!;
      const glass = face.getObjectByName("window-inset-glazing") as Mesh;
      expect(glass).toBeDefined();
      glass.geometry.computeBoundingBox();
      const size = glass.geometry.boundingBox!.getSize(new Vector3());
      const local = glass.position.clone().add(new Vector3(size.x * 0.22, size.y * 0.22, 0.02));
      const origin = face.localToWorld(local), normal = new Vector3(0, 0, -1).transformDirection(face.matrixWorld);
      const hits = new Raycaster(origin, normal).intersectObject(cottage, true);
      expect(hits[0]?.object.name).toBe("window-inset-glazing");
      expect(hits[0]!.distance).toBeGreaterThan(0.0195);
    }
    dispose(cottage, materials);
  });

  it("builds a recessed chimney flue and closed thin ridge-cap shells", () => {
    const materials = palette(), cottage = createCottageArchitecture(materials); cottage.updateMatrixWorld(true);
    const bore = new Raycaster(new Vector3(0.0055, 0.08, -0.0055), new Vector3(0, -1, 0)).intersectObject(cottage, true);
    expect(bore[0]?.object.name).toBe("chimney-recessed-flue");
    const rim = new Raycaster(new Vector3(0.0055 + 0.0029, 0.08, -0.0055), new Vector3(0, -1, 0)).intersectObject(cottage, true);
    expect(rim[0]?.object.name).toBe("chimney-open-crown");
    expect(rim[0]!.point.y - bore[0]!.point.y).toBeGreaterThan(0.0014);
    const cap = createRidgeCapGeometry(0.00085, 0.0003, 0.0044); inspectClosed(cap); cap.dispose();
    dispose(cottage, materials);
  });

  it("separates overlapping roof courses in depth and staggers their tight side joints", () => {
    const materials = palette(), cottage = createCottageArchitecture(materials); cottage.updateMatrixWorld(true);
    const pitches = cottage.children.filter(group => group.children.some(child => child.name === "clay-roof-course"));
    expect(pitches).toHaveLength(2);
    for (const pitch of pitches) {
      const tiles = pitch.children.filter(child => child.name === "clay-roof-course") as Mesh[];
      const rows = [...new Set(tiles.map(tile => tile.position.x))].sort((a, b) => a - b);
      let previousJoints: number[] = [];
      for (const row of rows) {
        const course = tiles.filter(tile => tile.position.x === row).sort((a, b) => a.position.z - b.position.z), joints: number[] = [];
        for (let index = 1; index < course.length; index++) {
          const left = course[index - 1]!, right = course[index]!; left.geometry.computeBoundingBox(); right.geometry.computeBoundingBox();
          const leftEdge = left.position.z + left.geometry.boundingBox!.max.z, rightEdge = right.position.z + right.geometry.boundingBox!.min.z;
          expect(rightEdge - leftEdge).toBeGreaterThan(0); expect(rightEdge - leftEdge).toBeLessThan(0.00002);
          const joint = (leftEdge + rightEdge) / 2;
          expect(previousJoints.every(previous => Math.abs(previous - joint) > 0.001)).toBe(true); joints.push(joint);
        }
        previousJoints = joints;
      }
      for (let index = 1; index < rows.length; index++) {
        const left = rows[index - 1]!, right = rows[index]!;
        const origin = pitch.localToWorld(new Vector3((left + right) / 2, 0.01, 0.0012));
        const direction = new Vector3(0, -1, 0).transformDirection(pitch.matrixWorld);
        const hits = new Raycaster(origin, direction).intersectObjects(tiles).filter(hit => hit.face!.normal.y > 0.9);
        const first = hits.find(hit => hit.object.position.x === left), second = hits.find(hit => hit.object.position.x === right);
        expect(first).toBeDefined(); expect(second).toBeDefined();
        expect(Math.abs(first!.distance - second!.distance)).toBeGreaterThan(0.00003);
      }
    }
    dispose(cottage, materials);
  });

  it("grounds the station foundation, canopy posts, cargo and steps within the original reserved area", () => {
    const materials = palette(), station = createStationArchitecture(materials); station.scale.x = 0.88; station.updateMatrixWorld(true);
    const bounds = new Box3().setFromObject(station), area = RESERVED_SCENERY_AREAS.find(area => area.name === "station")!;
    expect(bounds.min.x).toBeGreaterThanOrEqual(area.minX); expect(bounds.max.x).toBeLessThanOrEqual(area.maxX);
    expect(bounds.min.z).toBeGreaterThanOrEqual(area.minZ); expect(bounds.max.z).toBeLessThanOrEqual(area.maxZ);
    expect(bounds.min.y).toBeCloseTo(STATION_DIMENSIONS.ground, 8);
    expect(bounds.max.y).toBeLessThanOrEqual(STATION_DIMENSIONS.maximumHeight);
    const foundation = new Box3().setFromObject(station.getObjectByName("station-ground-foundation")!);
    expect(foundation.min.y).toBeCloseTo(STATION_DIMENSIONS.ground, 8); expect(foundation.max.y).toBeCloseTo(STATION_DIMENSIONS.wallBottom, 8);
    const platform = new Box3().setFromObject(station.getObjectByName("station-grounded-platform")!);
    station.traverse(node => {
      if (node.name === "station-canopy-grounded-post") expect(new Box3().setFromObject(node).min.y).toBeCloseTo(platform.max.y, 7);
      if (node.name === "platform-grounded-cargo") expect(new Box3().setFromObject(node).min.y).toBeCloseTo(platform.max.y, 7);
      if (node.name === "station-entry-step") expect(new Box3().setFromObject(node).min.y).toBeCloseTo(STATION_DIMENSIONS.ground, 8);
    });
    dispose(station, materials);
  });

  it("preserves existing architecture material batches and bounded reusable prefab geometry", () => {
    const materials = palette(), cottage = compactGroup(createCottageArchitecture(materials)), station = compactGroup(createStationArchitecture(materials));
    const count = (group: Group): number => group.children.reduce((sum, child) => {
      const geometry = (child as Mesh).geometry;
      return sum + (geometry.index?.count ?? geometry.getAttribute("position").count) / 3;
    }, 0);
    expect(cottage.children).toHaveLength(10);
    expect(station.children).toHaveLength(11); // Existing sign/clock remain two separate textured batches.
    expect(count(cottage)).toBeLessThan(8_000); expect(count(station)).toBeLessThan(12_000);
    expect([...cottage.children, ...station.children].every(child => Object.values(materials).includes((child as Mesh).material as Material as MeshStandardMaterial))).toBe(true);
    const prefabs = createPrefabs(materials);
    expect(prefabs.house).toHaveLength(10);
    Object.values(prefabs).flat().forEach(part => part.geometry.dispose());
    cottage.traverse(node => { if (node instanceof Mesh) node.geometry.dispose(); });
    dispose(station, materials);
  });
});
