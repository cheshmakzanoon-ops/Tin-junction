import { describe, expect, it } from "vitest";
import { MeshStandardMaterial, Vector3 } from "three";
import type { BufferGeometry } from "three";
import { createCanopyGeometry, createFirBoughGeometry } from "../../../web/src/scene/canopyGeometry";
import { createGableGeometry, createPrefabs } from "../../../web/src/scene/scenery";
import type { Palette } from "../../../web/src/scene/materials";

function inspectClosedSurface(geometry: BufferGeometry): { volume: number; triangles: number } {
  const positions = geometry.getAttribute("position"), indices = geometry.index;
  const count = indices?.count ?? positions.count;
  const edges = new Map<string, number>();
  let volume = 0;
  const points = [new Vector3(), new Vector3(), new Vector3()];
  for (let index = 0; index < count; index += 3) {
    for (let corner = 0; corner < 3; corner += 1) points[corner]!.fromBufferAttribute(positions, indices?.getX(index + corner) ?? index + corner);
    const [a, b, c] = points as [Vector3, Vector3, Vector3];
    expect(b.clone().sub(a).cross(c.clone().sub(a)).length()).toBeGreaterThan(1e-12);
    volume += a.dot(b.clone().cross(c)) / 6;
    const keys = points.map(point => point.toArray().map(value => Math.round(value * 1e8)).join(","));
    for (let edge = 0; edge < 3; edge += 1) {
      const key = [keys[edge]!, keys[(edge + 1) % 3]!].sort().join("|");
      edges.set(key, (edges.get(key) ?? 0) + 1);
    }
  }
  expect([...edges.values()].every(count => count === 2)).toBe(true);
  expect(volume).toBeGreaterThan(0);
  return { volume, triangles: count / 3 };
}

describe("original miniature scenery surfaces", () => {
  it("closes both attic ends with outward-wound geometry at the authored physical dimensions", () => {
    const width = 0.038, rise = 0.0183, depth = 0.033;
    const geometry = createGableGeometry(width, rise, depth);
    const result = inspectClosedSurface(geometry);
    expect(result.volume).toBeCloseTo(width * rise * depth / 2, 10);
    geometry.computeBoundingBox();
    expect(geometry.boundingBox!.min.y).toBe(0);
    expect(geometry.boundingBox!.max.y).toBeCloseTo(rise, 8);
    expect(result.triangles).toBeLessThan(12);
    geometry.dispose();
  });

  it("keeps opaque flock clusters closed, smoothly normaled and within a small geometric budget", () => {
    for (const seed of [0, 80, 147, 773, 0xffff_ffff]) {
      const geometry = createCanopyGeometry(seed);
      const result = inspectClosedSurface(geometry), positions = geometry.getAttribute("position"), normals = geometry.getAttribute("normal");
      expect(result.triangles).toBeLessThanOrEqual(80);
      for (let index = 0; index < positions.count; index += 1) {
        const point = new Vector3().fromBufferAttribute(positions, index), normal = new Vector3().fromBufferAttribute(normals, index);
        expect(point.length()).toBeLessThanOrEqual(1.21);
        expect(normal.length()).toBeCloseTo(1, 5);
        expect(point.dot(normal)).toBeGreaterThan(0);
      }
      geometry.dispose();
    }
  });

  it("rebuilds the same foliage after recovery without using a global random stream", () => {
    const first = createCanopyGeometry(123), recovered = createCanopyGeometry(123), variant = createCanopyGeometry(456);
    expect(Array.from(first.getAttribute("position").array)).toEqual(Array.from(recovered.getAttribute("position").array));
    expect(Array.from(first.getAttribute("position").array)).not.toEqual(Array.from(variant.getAttribute("position").array));
    [first, recovered, variant].forEach(geometry => geometry.dispose());
  });

  it("keeps serrated fir boughs closed rather than using transparent leaf cards", () => {
    for (const seed of [0, 80, 773]) {
      const geometry = createFirBoughGeometry(seed), result = inspectClosedSurface(geometry);
      expect(result.triangles).toBeLessThanOrEqual(72);
      geometry.computeBoundingBox();
      expect(geometry.boundingBox!.min.x).toBe(-1);
      expect(geometry.boundingBox!.max.x).toBe(1);
      const normals = geometry.getAttribute("normal");
      for (let index = 0; index < normals.count; index += 1) expect(new Vector3().fromBufferAttribute(normals, index).length()).toBeCloseTo(1, 5);
      geometry.dispose();
    }
  });

  it("retains three shared material batches per tree without an alpha or per-instance material expansion", () => {
    const materials = Object.fromEntries(["bark", "pine", "pineLight", "leaf", "rock", "plaster", "roof", "roofDark", "darkWood", "glass", "trim", "green", "platform", "plasterDark", "iron", "lampGlass", "wagon"].map(name => [name, new MeshStandardMaterial()]));
    const prefabs = createPrefabs(materials as unknown as Palette);
    for (const kind of ["fir", "oak"] as const) {
      expect(prefabs[kind]).toHaveLength(3);
      expect(prefabs[kind].every(part => !part.material.transparent)).toBe(true);
      const triangles = prefabs[kind].reduce((sum, part) => sum + (part.geometry.index?.count ?? part.geometry.getAttribute("position").count) / 3, 0);
      expect(triangles).toBeLessThanOrEqual(2_500);
    }
    Object.values(prefabs).flat().forEach(part => part.geometry.dispose());
    Object.values(materials).forEach(material => material.dispose());
  });
});
