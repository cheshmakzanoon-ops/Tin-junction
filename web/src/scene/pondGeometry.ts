import * as THREE from "three";
import { distanceToOval, RESERVED_SCENERY_AREAS } from "../model/index";
import { compactGroup, cylinder, visualRandom } from "./geometry";
import type { Track } from "./geometry";
import type { Palette } from "./materials";

export const POND = Object.freeze({ x: 0.205, z: 0.065, radiusX: 0.037, radiusZ: 0.0235, waterY: 0.0005, dryRailClearance: 0.030 });
const area = RESERVED_SCENERY_AREAS.find(value => value.name === "pond")!;
const outerBank = -0.0035, innerBank = 0.0025;
type Sample = { x: number; z: number; field: number };
export type PondMaterials = { water: THREE.MeshStandardMaterial; bank: THREE.MeshStandardMaterial };

function outline(angle: number): number {
  return 1 + 0.075 * Math.sin(angle * 3) + 0.028 * Math.cos(angle * 5) + 0.055 * Math.sin(angle);
}

export function pondPoint(angle: number, radius = 1): { x: number; z: number } {
  const scale = outline(angle) * radius;
  return { x: POND.x + Math.cos(angle) * POND.radiusX * scale, z: POND.z + Math.sin(angle) * POND.radiusZ * scale };
}

/** Positive in water; negative on shore. The route subtraction leaves a dry bank. */
export function pondField(x: number, z: number, track: Track): number {
  const dx = (x - POND.x) / POND.radiusX, dz = (z - POND.z) / POND.radiusZ;
  const radius = Math.hypot(dx, dz) / outline(Math.atan2(dz, dx));
  return Math.min((1 - radius) * POND.radiusZ, distanceToOval(track, x, z) - POND.dryRailClearance);
}

export function pondBankHeight(field: number): number {
  if (field < -0.0014) return THREE.MathUtils.lerp(0.0004, 0.00095, THREE.MathUtils.smoothstep(field, outerBank, -0.0014));
  if (field < 0) return THREE.MathUtils.lerp(0.00095, POND.waterY, THREE.MathUtils.smoothstep(field, -0.0014, 0));
  return THREE.MathUtils.lerp(POND.waterY, -0.0014, THREE.MathUtils.smoothstep(field, 0, innerBank));
}

/** Local sculpted recess. Authoritative rail beds and all unrelated terrain stay untouched. */
export function depressPondTerrain(geometry: THREE.BufferGeometry, track: Track): void {
  const positions = geometry.getAttribute("position");
  for (let index = 0; index < positions.count; index += 1) {
    const x = positions.getX(index), z = positions.getZ(index);
    if (x < area.minX || x > area.maxX || z < area.minZ || z > area.maxZ) continue;
    const field = pondField(x, z, track);
    if (field <= outerBank) continue;
    const depth = THREE.MathUtils.smoothstep(field, outerBank, 0.005);
    positions.setY(index, THREE.MathUtils.lerp(positions.getY(index), -0.0028, depth));
  }
  positions.needsUpdate = true; geometry.computeVertexNormals(); geometry.computeBoundingSphere();
}

export function createPondMaterials(palette: Palette): PondMaterials {
  const water = palette.water.clone();
  water.color.set(0xffffff); water.vertexColors = true; water.roughness = 0.26; water.metalness = 0;
  const bank = palette.gravel.clone();
  bank.color.set(0xffffff); bank.vertexColors = true; bank.roughness = 0.98; bank.metalness = 0;
  // Its outer edge intentionally meets the turf. Bias that shared surface
  // without raising the miniature shoreline into a visibly floating ring.
  bank.polygonOffset = true; bank.polygonOffsetFactor = -1; bank.polygonOffsetUnits = -1;
  return { water, bank };
}

function clip(polygon: Sample[], threshold: number, keepGreater: boolean): Sample[] {
  const output: Sample[] = [];
  const inside = (point: Sample): boolean => keepGreater ? point.field >= threshold : point.field <= threshold;
  for (let index = 0; index < polygon.length; index += 1) {
    const current = polygon[index]!, previous = polygon[(index + polygon.length - 1) % polygon.length]!;
    if (inside(current) !== inside(previous)) {
      const t = (threshold - previous.field) / (current.field - previous.field);
      output.push({ x: THREE.MathUtils.lerp(previous.x, current.x, t), z: THREE.MathUtils.lerp(previous.z, current.z, t), field: threshold });
    }
    if (inside(current)) output.push(current);
  }
  return output;
}

/** Both shoreline and dry route banks use the same clipped scalar field. */
export function createPondSurface(track: Track, kind: "water" | "bank"): THREE.BufferGeometry {
  const columns = 48, rows = 34, samples: Sample[] = [];
  const positions: number[] = [], normals: number[] = [], uv: number[] = [], colors: number[] = [], indices: number[] = [];
  const lookup = new Map<string, number>();
  for (let row = 0; row <= rows; row += 1) for (let column = 0; column <= columns; column += 1) {
    const x = THREE.MathUtils.lerp(area.minX, area.maxX, column / columns), z = THREE.MathUtils.lerp(area.minZ, area.maxZ, row / rows);
    samples.push({ x, z, field: pondField(x, z, track) });
  }
  const deep = new THREE.Color(0x3d6961), shallow = new THREE.Color(0x617d68);
  const turf = new THREE.Color(0x78844f), dryEarth = new THREE.Color(0x7d7357), wetEarth = new THREE.Color(0x4d5d48);
  const vertex = (point: Sample): number => {
    const key = `${point.x.toFixed(9)}:${point.z.toFixed(9)}`;
    const known = lookup.get(key); if (known !== undefined) return known;
    const index = positions.length / 3, color = new THREE.Color();
    positions.push(point.x, kind === "water" ? POND.waterY : pondBankHeight(point.field), point.z);
    normals.push(0, 1, 0); uv.push((point.x - area.minX) / (area.maxX - area.minX), (point.z - area.minZ) / (area.maxZ - area.minZ));
    if (kind === "water") color.copy(shallow).lerp(deep, THREE.MathUtils.smoothstep(point.field, 0, 0.012));
    else if (point.field < -0.0014) color.copy(turf).lerp(dryEarth, THREE.MathUtils.smoothstep(point.field, outerBank, -0.0014));
    else color.copy(dryEarth).lerp(wetEarth, THREE.MathUtils.smoothstep(point.field, -0.0014, innerBank));
    colors.push(color.r, color.g, color.b); lookup.set(key, index); return index;
  };
  const triangle = (points: Sample[]): void => {
    let polygon = clip(points, kind === "water" ? 0 : outerBank, true);
    if (kind === "bank") polygon = clip(polygon, innerBank, false);
    for (let index = 1; index < polygon.length - 1; index += 1) {
      const a = vertex(polygon[0]!), b = vertex(polygon[index]!), c = vertex(polygon[index + 1]!);
      if (a !== b && b !== c && a !== c) indices.push(a, b, c);
    }
  };
  for (let row = 0; row < rows; row += 1) for (let column = 0; column < columns; column += 1) {
    const a = row * (columns + 1) + column, b = a + 1, c = a + columns + 1, d = c + 1;
    triangle([samples[a]!, samples[c]!, samples[b]!]); triangle([samples[b]!, samples[c]!, samples[d]!]);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices); geometry.computeVertexNormals(); geometry.computeBoundingSphere();
  return geometry;
}

function bankRock(seed: number): THREE.BufferGeometry {
  const geometry = new THREE.IcosahedronGeometry(1, 1), positions = geometry.getAttribute("position");
  const phase = seed * 0.73;
  for (let index = 0; index < positions.count; index += 1) {
    const x = positions.getX(index), y = positions.getY(index), z = positions.getZ(index);
    const scale = 0.86 + 0.12 * Math.sin(x * 5 + z * 7 + phase) + 0.06 * Math.cos(y * 8 - phase);
    positions.setXYZ(index, x * scale, y * scale, z * scale);
  }
  geometry.computeVertexNormals(); return geometry;
}

function clearDecoration(x: number, z: number, radius: number, track: Track): boolean {
  return x - radius >= area.minX && x + radius <= area.maxX && z - radius >= area.minZ && z + radius <= area.maxZ
    && distanceToOval(track, x, z) >= POND.dryRailClearance + radius;
}

export function createPondGroup(track: Track, palette: Palette, materials: PondMaterials): THREE.Group {
  const group = new THREE.Group(); group.name = "pond";
  for (const kind of ["water", "bank"] as const) {
    const geometry = createPondSurface(track, kind);
    if (!geometry.index?.count) { geometry.dispose(); continue; }
    group.add(new THREE.Mesh(geometry, materials[kind]));
  }
  const random = visualRandom(711);
  // Small irregular clusters leave clear shoreline between them. These are
  // sculpted model stones, never equally spaced beads around the entire pond.
  for (const [index, angle] of [0.12, 0.25, 0.42, 1.18, 1.36, 2.43, 2.56, 2.69, 3.50, 3.65, 4.44, 4.60, 4.77, 5.69].entries()) {
    const position = pondPoint(angle + (random() - 0.5) * 0.07, 1.03 + random() * 0.045);
    const radius = 0.0010 + random() * 0.0016;
    if (!clearDecoration(position.x, position.z, radius * 1.4, track)) continue;
    const rock = new THREE.Mesh(bankRock(index + 71), palette.rock);
    rock.scale.set(radius * (0.95 + random() * 0.35), radius * (0.48 + random() * 0.28), radius * (0.8 + random() * 0.35));
    rock.rotation.y = random() * Math.PI * 2;
    rock.position.set(position.x, pondBankHeight(pondField(position.x, position.z, track)) + radius * 0.12, position.z);
    group.add(rock);
  }
  for (const angle of [2.10, 2.35, 2.61]) {
    const center = pondPoint(angle, 0.98);
    if (!clearDecoration(center.x, center.z, 0.0022, track)) continue;
    for (let stem = 0; stem < 5; stem += 1) {
      const x = center.x + (random() - 0.5) * 0.0014, z = center.z + (random() - 0.5) * 0.0014;
      const y = pondBankHeight(pondField(x, z, track)), height = 0.006 + random() * 0.005;
      const tip = new THREE.Vector3(x + (random() - 0.5) * 0.0009, y + height, z + (random() - 0.5) * 0.0009);
      const curve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(x, y, z), new THREE.Vector3(x, y + height * 0.6, z), tip);
      group.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 3, 0.00014, 4, false), palette.pine));
      if (stem < 2) cylinder(group, 0.00027, 0.0003, 0.0014, [tip.x, tip.y - 0.0007, tip.z], palette.darkWood, 6);
    }
  }
  compactGroup(group);
  for (const child of group.children) if (child instanceof THREE.Mesh && (child.material === materials.water || child.material === materials.bank)) child.castShadow = false;
  return group;
}
