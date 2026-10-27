import { describe, expect, it } from "vitest";
import { Box3, Mesh, MeshStandardMaterial, Vector3 } from "three";
import type { BufferGeometry, Group, Material } from "three";
import { distanceToOval, RESERVED_SCENERY_AREAS, validTrack } from "../../../web/src/model/index";
import { CASE_DIMENSIONS, createDisplayCase, openCasePose, pointInLid } from "../../../web/src/scene/caseGeometry";
import { createPondGroup, createPondMaterials, createPondSurface, depressPondTerrain, POND } from "../../../web/src/scene/pondGeometry";
import { makeTerrain } from "../../../web/src/scene/geometry";
import type { Track } from "../../../web/src/scene/geometry";
import type { Palette } from "../../../web/src/scene/materials";
import { createPrefabs } from "../../../web/src/scene/scenery";

function paletteFixture(): Palette {
  return Object.fromEntries(["walnut", "darkWood", "brass", "darkBrass", "felt", "bark", "pine", "pineLight", "leaf", "rock", "plaster", "roof", "roofDark", "glass", "trim", "green", "platform", "plasterDark", "iron", "lampGlass", "wagon", "water", "gravel"].map(name => [name, new MeshStandardMaterial()])) as unknown as Palette;
}
function disposeGroup(group: Group): void {
  const geometries = new Set<BufferGeometry>();
  group.traverse(object => { if (object instanceof Mesh) geometries.add(object.geometry); });
  geometries.forEach(geometry => geometry.dispose());
}
function disposePalette(palette: Palette): void { new Set<Material>(Object.values(palette)).forEach(material => material.dispose()); }

describe("physical case geometry", () => {
  it("makes the closed lid cover exactly the base footprint", () => {
    const palette = paletteFixture(), { base, lid } = createDisplayCase(palette);
    lid.rotation.x = Math.PI; lid.updateMatrixWorld(true);
    const panel = new Box3().setFromObject(lid.getObjectByName("case-lid-panel")!);
    const bottom = new Box3().setFromObject(base.children[0]!);
    expect(panel.min.x).toBeCloseTo(bottom.min.x, 7); expect(panel.max.x).toBeCloseTo(bottom.max.x, 7);
    expect(panel.min.z).toBeCloseTo(bottom.min.z, 7); expect(panel.max.z).toBeCloseTo(bottom.max.z, 7);
    expect(panel.min.y).toBeCloseTo(CASE_DIMENSIONS.hingeY + CASE_DIMENSIONS.lidCavity, 7);
    disposeGroup(base); disposeGroup(lid); disposePalette(palette);
  });

  it("grounds each foot and keeps moving hinge knuckles on the same real axis", () => {
    const palette = paletteFixture(), { base, lid } = createDisplayCase(palette);
    expect(base.children.filter(object => object.name === "case-foot")).toHaveLength(4);
    expect(lid.children.filter(object => object.name === "lid-hinge-knuckle")).toHaveLength(6);
    for (const child of base.children.filter(object => object.name === "case-foot")) {
      const bounds = new Box3().setFromObject(child);
      expect(bounds.min.y).toBeCloseTo(CASE_DIMENSIONS.tableY, 8);
      expect(bounds.max.y).toBeCloseTo(-0.045, 8);
    }
    for (let step = 0; step <= 24; step += 1) {
      lid.rotation.x = CASE_DIMENSIONS.minOpenPose + step / 24 * (Math.PI - CASE_DIMENSIONS.minOpenPose); lid.updateMatrixWorld(true);
      for (const child of lid.children.filter(object => object.name === "lid-hinge-knuckle")) {
        const point = child.getWorldPosition(new Vector3());
        expect(point.y).toBeCloseTo(CASE_DIMENSIONS.hingeY, 10); expect(point.z).toBeCloseTo(CASE_DIMENSIONS.hingeZ, 10);
      }
    }
    disposeGroup(base); disposeGroup(lid); disposePalette(palette);
  });

  it("attaches moving hinge screws to a leaf mounted on the inside rear wall", () => {
    const palette = paletteFixture(), { base, lid } = createDisplayCase(palette), d = CASE_DIMENSIONS;
    expect(lid.children.filter(object => object.name === "lid-hinge-leaf-wall")).toHaveLength(3);
    expect(lid.children.filter(object => object.name === "lid-hinge-screw")).toHaveLength(6);
    for (const leaf of lid.children.filter(object => object.name === "lid-hinge-leaf-wall")) {
      expect(leaf.position.z + 0.0014 / 2).toBeCloseTo(d.lidRear - d.wall, 10);
    }
    for (const screw of lid.children.filter(object => object.name === "lid-hinge-screw")) {
      expect(screw.position.z + 0.0008 / 2).toBeCloseTo(d.lidRear - d.wall - 0.0014, 10);
      expect(screw.position.y).toBeGreaterThan(-0.027); expect(screw.position.y).toBeLessThan(-0.001);
    }
    disposeGroup(base); disposeGroup(lid); disposePalette(palette);
  });

  it("keeps the foundation below the pond bed and physically joins the carrying handle", () => {
    const palette = paletteFixture(), { base, lid } = createDisplayCase(palette);
    const foundation = new Box3().setFromObject(base.getObjectByName("case-terrain-foundation")!);
    expect(foundation.max.y).toBeLessThan(-0.0028);
    const handle = new Box3().setFromObject(base.getObjectByName("case-handle")!);
    const brackets = base.children.filter(object => object.name === "case-handle-bracket");
    const pins = base.children.filter(object => object.name === "case-handle-pin");
    expect(brackets).toHaveLength(2); expect(pins).toHaveLength(2);
    for (const [index, pin] of pins.entries()) {
      const bounds = new Box3().setFromObject(pin);
      expect(bounds.intersectsBox(new Box3().setFromObject(brackets[index]!))).toBe(true);
      expect(bounds.intersectsBox(handle)).toBe(true);
    }
    disposeGroup(base); disposeGroup(lid); disposePalette(palette);
  });

  it("clears the maximum accepted scenery height and footprint throughout the closing sweep", () => {
    const palette = paletteFixture(), prefabs = createPrefabs(palette);
    let authoredHeight = 0;
    for (const part of Object.values(prefabs).flat()) {
      part.geometry.computeBoundingBox(); authoredHeight = Math.max(authoredHeight, part.geometry.boundingBox!.max.y); part.geometry.dispose();
    }
    // Saved scenery accepts scale 2; the terrain fixture bounds relief below 30 mm.
    const maximumHeight = authoredHeight * 2 + 0.030, d = CASE_DIMENSIONS;
    const frontInside = -(d.lidRear - d.depth + d.wall);
    expect(maximumHeight - d.hingeY).toBeLessThan(d.lidCavity);
    // A rotated front wall cannot reach the extremal enclosing radius. This
    // bound applies between the sampled poses as well as at their endpoints.
    expect(Math.hypot(0.24 - d.hingeZ, maximumHeight - d.hingeY)).toBeLessThan(frontInside);
    for (let step = 0; step <= 180; step += 1) {
      const angle = d.minOpenPose + step / 180 * (Math.PI - d.minOpenPose);
      for (let zStep = 0; zStep <= 16; zStep += 1) for (const y of [0.0004, maximumHeight / 2, maximumHeight]) {
        const point = pointInLid(new Vector3(0.39, y, -0.24 + zStep * 0.03), angle);
        if (point.y >= 0) continue; // On the open side of the closing rim.
        expect(point.x).toBeLessThan(d.width / 2 - d.wall);
        expect(point.y).toBeGreaterThan(-d.lidCavity);
        expect(point.z).toBeGreaterThan(d.lidRear - d.depth + d.wall);
        expect(point.z).toBeLessThan(d.lidRear - d.wall);
      }
    }
    disposePalette(palette);
  });

  it("keeps sensor presentation explicitly open and above the table", () => {
    const palette = paletteFixture(), { base, lid } = createDisplayCase(palette);
    for (const input of [null, Number.NaN, Number.POSITIVE_INFINITY, -500, 0, 45, 90, 135, 180, 500]) {
      const angle = openCasePose(input);
      expect(angle).toBeGreaterThanOrEqual(CASE_DIMENSIONS.minOpenPose); expect(angle).toBeLessThanOrEqual(CASE_DIMENSIONS.maxOpenPose);
      lid.rotation.x = angle; lid.updateMatrixWorld(true);
      expect(new Box3().setFromObject(lid).min.y).toBeGreaterThan(CASE_DIMENSIONS.tableY);
    }
    disposeGroup(base); disposeGroup(lid); disposePalette(palette);
  });
});

const tracks: Track[] = [
  { kind: "oval", straightLength: 0.34, radius: 0.145 },
  { kind: "oval", straightLength: 0.25, radius: 0.10 },
  { kind: "oval", straightLength: 0.10, radius: 0.10 },
  { kind: "oval", straightLength: 0.50, radius: 0.10 },
  { kind: "oval", straightLength: 0.10, radius: 0.20 },
  { kind: "oval", straightLength: 0.36, radius: 0.20 },
];
const area = RESERVED_SCENERY_AREAS.find(value => value.name === "pond")!;

describe("pond shore, dry route banks and resource ownership", () => {
  it("clips both water and bank inside the reserved footprint and away from valid rail beds", () => {
    for (const track of tracks) for (const kind of ["water", "bank"] as const) {
      expect(validTrack(track)).toBe(true);
      const geometry = createPondSurface(track, kind), positions = geometry.getAttribute("position"), indices = geometry.index!;
      for (let index = 0; index < positions.count; index += 1) {
        const x = positions.getX(index), z = positions.getZ(index);
        expect(x).toBeGreaterThanOrEqual(area.minX - 1e-7); expect(x).toBeLessThanOrEqual(area.maxX + 1e-7);
        expect(z).toBeGreaterThanOrEqual(area.minZ - 1e-7); expect(z).toBeLessThanOrEqual(area.maxZ + 1e-7);
        expect(distanceToOval(track, x, z)).toBeGreaterThan(kind === "water" ? 0.0298 : 0.025);
        if (kind === "water") expect(positions.getY(index)).toBeCloseTo(POND.waterY, 9);
      }
      for (let index = 0; index < indices.count; index += 3) {
        const a = new Vector3().fromBufferAttribute(positions, indices.getX(index)), b = new Vector3().fromBufferAttribute(positions, indices.getX(index + 1)), c = new Vector3().fromBufferAttribute(positions, indices.getX(index + 2));
        const center = a.clone().add(b).add(c).multiplyScalar(1 / 3);
        expect(distanceToOval(track, center.x, center.z)).toBeGreaterThan(kind === "water" ? 0.0298 : 0.025);
        expect(b.clone().sub(a).cross(c.clone().sub(a)).y).toBeGreaterThanOrEqual(0);
      }
      geometry.dispose();
    }
  });

  it("never depresses a rail bed or unrelated ground when the track crosses the pond area", () => {
    for (const track of tracks) {
      const geometry = makeTerrain(track), positions = geometry.getAttribute("position"), before = Array.from(positions.array);
      depressPondTerrain(geometry, track);
      for (let index = 0; index < positions.count; index += 1) {
        const x = positions.getX(index), z = positions.getZ(index);
        const outside = x < area.minX || x > area.maxX || z < area.minZ || z > area.maxZ;
        if (outside || distanceToOval(track, x, z) <= 0.025) expect(positions.getY(index)).toBe(before[index * 3 + 1]);
        expect(positions.getY(index)).toBeGreaterThanOrEqual(-0.002801);
      }
      geometry.dispose();
    }
  });

  it("filters decorative stones and reeds without changing layout geometry or shared materials", () => {
    const palette = paletteFixture(), materials = createPondMaterials(palette);
    let disposedMaterials = 0;
    materials.water.addEventListener("dispose", () => { disposedMaterials += 1; });
    materials.bank.addEventListener("dispose", () => { disposedMaterials += 1; });
    for (const track of tracks) {
      const before = JSON.stringify(track), group = createPondGroup(track, palette, materials);
      group.traverse(object => {
        if (!(object instanceof Mesh)) return;
        const positions = object.geometry.getAttribute("position");
        for (let index = 0; index < positions.count; index += 1) {
          const x = positions.getX(index), z = positions.getZ(index);
          expect(x).toBeGreaterThanOrEqual(area.minX - 1e-7); expect(x).toBeLessThanOrEqual(area.maxX + 1e-7);
          expect(z).toBeGreaterThanOrEqual(area.minZ - 1e-7); expect(z).toBeLessThanOrEqual(area.maxZ + 1e-7);
          expect(distanceToOval(track, x, z)).toBeGreaterThan(0.025);
        }
        expect((object.material as Material).transparent).toBe(false);
      });
      disposeGroup(group);
      expect(disposedMaterials).toBe(0); expect(JSON.stringify(track)).toBe(before);
    }
    materials.water.dispose(); materials.bank.dispose(); disposePalette(palette);
  });
});
