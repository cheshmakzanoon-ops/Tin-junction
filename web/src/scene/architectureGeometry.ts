import * as THREE from "three";
import { box as primitiveBox, cylinder } from "./geometry";
import type { Palette } from "./materials";

export const COTTAGE_DIMENSIONS = Object.freeze({ width: 0.036, depth: 0.030, wallBottom: 0.003, wallHeight: 0.030, wallThickness: 0.0012, ridgeRise: 0.0174, maximumHeight: 0.062 });
export const STATION_DIMENSIONS = Object.freeze({ x: -0.037, z: -0.081, width: 0.088, depth: 0.034, wallBottom: 0.009, wallHeight: 0.035, ground: 0.0004, maximumHeight: 0.070 });
export interface WallOpening { readonly x: number; readonly y: number; readonly width: number; readonly height: number }

/** Closed architectural chamfer: six faces, twelve edge strips and eight corners. */
export function createBevelledBlockGeometry(width: number, height: number, depth: number, bevel: number): THREE.BufferGeometry {
  if (![width, height, depth, bevel].every(value => Number.isFinite(value) && value > 0)
    || bevel >= Math.min(width, height, depth) / 2) throw new RangeError("Invalid miniature block bevel");
  const half = [width / 2, height / 2, depth / 2], inset = half.map(value => value - bevel);
  const positions: number[] = [], normals: number[] = [], uv: number[] = [];
  const polygon = (points: THREE.Vector3[]): void => {
    const centroid = points.reduce((sum, point) => sum.add(point), new THREE.Vector3()).divideScalar(points.length);
    const normal = points[1]!.clone().sub(points[0]!).cross(points[2]!.clone().sub(points[0]!)).normalize();
    if (normal.dot(centroid) < 0) { points.reverse(); normal.negate(); }
    const axis = [Math.abs(normal.x), Math.abs(normal.y), Math.abs(normal.z)].indexOf(Math.max(Math.abs(normal.x), Math.abs(normal.y), Math.abs(normal.z)));
    const u = (axis + 1) % 3, v = (axis + 2) % 3;
    for (let index = 1; index < points.length - 1; index++) for (const point of [points[0]!, points[index]!, points[index + 1]!]) {
      positions.push(...point.toArray()); normals.push(...normal.toArray());
      uv.push(point.getComponent(u) / (2 * half[u]!) + 0.5, point.getComponent(v) / (2 * half[v]!) + 0.5);
    }
  };
  for (let axis = 0; axis < 3; axis++) {
    const b = (axis + 1) % 3, c = (axis + 2) % 3;
    for (const side of [-1, 1]) polygon([[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sb, sc]) =>
      new THREE.Vector3().setComponent(axis, side * half[axis]!).setComponent(b, sb! * inset[b]!).setComponent(c, sc! * inset[c]!)));
    for (const sb of [-1, 1]) for (const sc of [-1, 1]) polygon([
      new THREE.Vector3().setComponent(axis, -inset[axis]!).setComponent(b, sb * half[b]!).setComponent(c, sc * inset[c]!),
      new THREE.Vector3().setComponent(axis, inset[axis]!).setComponent(b, sb * half[b]!).setComponent(c, sc * inset[c]!),
      new THREE.Vector3().setComponent(axis, inset[axis]!).setComponent(b, sb * inset[b]!).setComponent(c, sc * half[c]!),
      new THREE.Vector3().setComponent(axis, -inset[axis]!).setComponent(b, sb * inset[b]!).setComponent(c, sc * half[c]!),
    ]);
  }
  for (const x of [-1, 1]) for (const y of [-1, 1]) for (const z of [-1, 1]) polygon([
    new THREE.Vector3(x * half[0]!, y * inset[1]!, z * inset[2]!),
    new THREE.Vector3(x * inset[0]!, y * half[1]!, z * inset[2]!),
    new THREE.Vector3(x * inset[0]!, y * inset[1]!, z * half[2]!),
  ]);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  geometry.computeBoundingBox(); geometry.computeBoundingSphere(); return geometry;
}

function box(parent: THREE.Object3D, size: [number, number, number], position: [number, number, number], material: THREE.Material, bevel = 0): THREE.Mesh {
  if (bevel <= 0) return primitiveBox(parent, size, position, material);
  const mesh = new THREE.Mesh(createBevelledBlockGeometry(...size, Math.min(bevel, Math.min(...size) / 3)), material);
  mesh.position.set(...position); mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh;
}

/** Solid plaster thickness around real openings; no glass pasted onto a wall. */
export function createWallGeometry(width: number, height: number, thickness: number, openings: readonly WallOpening[]): THREE.BufferGeometry {
  if (![width, height, thickness].every(value => Number.isFinite(value) && value > 0) || openings.length > 16) throw new RangeError("Invalid miniature wall dimensions");
  const shape = new THREE.Shape();
  shape.moveTo(-width / 2, 0); shape.lineTo(width / 2, 0); shape.lineTo(width / 2, height); shape.lineTo(-width / 2, height); shape.closePath();
  for (let index = 0; index < openings.length; index++) {
    const opening = openings[index]!;
    if (![opening.x, opening.y, opening.width, opening.height].every(Number.isFinite) || opening.width <= 0 || opening.height <= 0
      || Math.abs(opening.x) + opening.width / 2 >= width / 2 || opening.y <= 0 || opening.y + opening.height >= height) throw new RangeError("A wall opening must fit wholly inside its wall");
    for (const other of openings.slice(0, index)) if (Math.abs(opening.x - other.x) < (opening.width + other.width) / 2
      && opening.y < other.y + other.height && other.y < opening.y + opening.height) throw new RangeError("Wall openings cannot overlap");
    const hole = new THREE.Path(), left = opening.x - opening.width / 2, right = opening.x + opening.width / 2;
    hole.moveTo(left, opening.y); hole.lineTo(left, opening.y + opening.height); hole.lineTo(right, opening.y + opening.height); hole.lineTo(right, opening.y); hole.closePath();
    shape.holes.push(hole);
  }
  const bevel = Math.min(0.0001, thickness * 0.15, width * 0.005, height * 0.005,
    ...openings.map(opening => Math.min(opening.width, opening.height) / 4));
  const depth = thickness - 2 * bevel;
  const geometry = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelSegments: 1,
    bevelSize: bevel, bevelThickness: bevel, steps: 1, curveSegments: 1 });
  geometry.translate(0, 0, -depth / 2); geometry.computeBoundingBox(); geometry.computeBoundingSphere();
  return geometry;
}

/** Closed attic shell, including both triangular ends and its bottom. */
export function createGableGeometry(width: number, rise: number, depth: number): THREE.BufferGeometry {
  if (![width, rise, depth].every(value => Number.isFinite(value) && value > 0)) throw new RangeError("Gable dimensions must be positive");
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute([
    -width / 2, 0, -depth / 2, width / 2, 0, -depth / 2, 0, rise, -depth / 2,
    -width / 2, 0, depth / 2, width / 2, 0, depth / 2, 0, rise, depth / 2,
  ], 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute([0, 0, 1, 0, 0.5, 1, 0, 0, 1, 0, 0.5, 1], 2));
  geometry.setIndex([0, 2, 1, 3, 4, 5, 0, 1, 4, 0, 4, 3, 0, 3, 5, 0, 5, 2, 1, 2, 5, 1, 5, 4]);
  const shell = geometry.toNonIndexed(); geometry.dispose(); shell.computeVertexNormals(); shell.computeBoundingSphere();
  return shell;
}

function beam(parent: THREE.Group, from: THREE.Vector3, to: THREE.Vector3, width: number, depth: number, material: THREE.Material): THREE.Mesh {
  const direction = to.clone().sub(from), midpoint = from.clone().add(to).multiplyScalar(0.5);
  const mesh = box(parent, [width, direction.length(), depth], midpoint.toArray() as [number, number, number], material);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  return mesh;
}

function window(parent: THREE.Group, opening: WallOpening, thickness: number, palette: Palette, shutters = false): void {
  const { x, y, width, height } = opening, frame = 0.0006, face = thickness / 2 + 0.00015;
  const glass = box(parent, [width - frame * 1.4, height - frame * 1.4, 0.00025], [x, y + height / 2, -thickness / 2 + 0.0002], palette.glass);
  glass.name = "window-inset-glazing";
  for (const side of [-1, 1]) {
    box(parent, [frame, height + frame, thickness + 0.0004], [x + side * width / 2, y + height / 2, 0], palette.trim);
    box(parent, [width + frame, frame, thickness + 0.0004], [x, y + (side === 1 ? height : 0), 0], palette.trim);
  }
  box(parent, [0.00035, height, 0.0006], [x, y + height / 2, face], palette.trim);
  box(parent, [width, 0.00035, 0.0006], [x, y + height * 0.52, face], palette.trim);
  const sill = box(parent, [width + 0.0017, 0.0007, 0.0021], [x, y - 0.0004, 0.00065], palette.platform, 0.00012);
  sill.name = "window-attached-sill";
  if (shutters) for (const side of [-1, 1]) {
    const shutterX = x + side * (width / 2 + 0.0017), shutterWidth = 0.0027;
    box(parent, [shutterWidth, height + 0.0006, 0.00045], [shutterX, y + height / 2, face + 0.00005], palette.green);
    for (let slat = 0; slat < 5; slat++) {
      const louvre = box(parent, [shutterWidth - 0.00045, height / 6, 0.0003], [shutterX, y + height * (slat + 0.9) / 6, face + 0.00035], palette.green);
      louvre.rotation.x = 0.15;
    }
    for (const level of [0.2, 0.8]) box(parent, [0.0006, 0.0003, 0.0003], [shutterX - side * shutterWidth / 2, y + height * level, face + 0.0003], palette.darkWood);
  }
}

function door(parent: THREE.Group, opening: WallOpening, thickness: number, palette: Palette): void {
  const { x, y, width, height } = opening, face = thickness / 2;
  const leaf = box(parent, [width - 0.0007, height - 0.0004, 0.00065], [x, y + height / 2, -0.00025], palette.darkWood);
  leaf.name = "door-inset-leaf";
  for (const side of [-1, 1]) box(parent, [0.0007, height + 0.0004, thickness + 0.0006], [x + side * width / 2, y + height / 2, 0.0001], palette.trim);
  box(parent, [width + 0.001, 0.0007, thickness + 0.0006], [x, y + height, 0.0001], palette.trim);
  box(parent, [width * 0.63, height * 0.28, 0.00035], [x, y + height * 0.28, face], palette.green);
  box(parent, [width * 0.63, height * 0.30, 0.00025], [x, y + height * 0.73, 0.00015], palette.glass);
  box(parent, [0.00035, height * 0.3, 0.00035], [x, y + height * 0.73, face + 0.0001], palette.trim);
  box(parent, [0.00045, 0.0012, 0.0004], [x + width * 0.29, y + height * 0.47, face + 0.00035], palette.darkWood);
}

function facade(parent: THREE.Group, name: string, width: number, height: number, thickness: number, origin: [number, number, number], rotation: number, openings: readonly WallOpening[], palette: Palette, doorIndex = -1, shutters = false): void {
  const group = new THREE.Group(); group.name = name; group.position.set(...origin); group.rotation.y = rotation;
  const wall = new THREE.Mesh(createWallGeometry(width, height, thickness, openings), palette.plaster);
  wall.name = "perforated-plaster-wall"; group.add(wall);
  openings.forEach((opening, index) => index === doorIndex ? door(group, opening, thickness, palette) : window(group, opening, thickness, palette, shutters));
  parent.add(group);
}

/** A small closed half-round clay ridge cap, with a real underside. */
export function createRidgeCapGeometry(radius: number, thickness: number, length: number): THREE.BufferGeometry {
  if (![radius, thickness, length].every(value => Number.isFinite(value) && value > 0) || thickness >= radius) throw new RangeError("Invalid roof cap");
  const shape = new THREE.Shape(), segments = 8;
  for (let index = 0; index <= segments; index++) {
    const angle = index * Math.PI / segments, x = Math.cos(angle) * radius, y = Math.sin(angle) * radius;
    if (index === 0) shape.moveTo(x, y); else shape.lineTo(x, y);
  }
  for (let index = segments; index >= 0; index--) {
    const angle = index * Math.PI / segments;
    shape.lineTo(Math.cos(angle) * (radius - thickness), Math.sin(angle) * (radius - thickness));
  }
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, { depth: length, bevelEnabled: false, steps: 1, curveSegments: 1 });
  geometry.translate(0, 0, -length / 2); return geometry;
}

function roof(parent: THREE.Group, wallWidth: number, wallDepth: number, wallTop: number, rise: number, overhang: number, endOverhang: number, palette: Palette): void {
  const slope = rise / (wallWidth / 2), angle = Math.atan(slope), run = wallWidth / 2 + overhang, length = run / Math.cos(angle);
  const depth = wallDepth + 2 * endOverhang, ridge = wallTop + rise, thickness = 0.00075, rows = 6, columns = Math.ceil(depth / 0.0055);
  for (const side of [-1, 1]) {
    const pitch = new THREE.Group(); pitch.position.set(side * run / 2, ridge - slope * run / 2, 0); pitch.rotation.z = -side * angle;
    const sheet = box(pitch, [length, thickness, depth], [0, thickness / 2, 0], palette.roofDark);
    sheet.name = "closed-roof-deck";
    // Half-bond cut tiles avoid long, subpixel stripes up the slope. Courses
    // have real overlaps; the close side joints remain restrained at board size.
    for (let row = 0; row < rows; row++) {
      const shifted = row % 2, courseFromEave = side === 1 ? rows - 1 - row : row, tileDepth = depth / columns;
      for (let column = 0; column < columns + shifted; column++) {
        const start = Math.max(-depth / 2, -depth / 2 + (column - shifted / 2) * tileDepth);
        const end = Math.min(depth / 2, -depth / 2 + (column + 1 - shifted / 2) * tileDepth);
        const tile = box(pitch, [length / rows + 0.00012, 0.00016, end - start - 0.000018],
          [-length / 2 + (row + 0.5) * length / rows, thickness + 0.00008 + courseFromEave * 0.000035, (start + end) / 2], palette.roof);
        tile.name = "clay-roof-course";
      }
    }
    for (const end of [-1, 1]) box(pitch, [length + 0.0001, 0.001, 0.0008], [0, 0, end * depth / 2], palette.darkWood);
    const edge = side === 1 ? length / 2 : -length / 2;
    box(pitch, [0.001, 0.0014, depth + 0.0007], [edge, -0.0004, 0], palette.darkWood);
    parent.add(pitch);
    // Attached half-round gutters follow the eave and drain down a wall corner.
    const gutter = new THREE.Mesh(createRidgeCapGeometry(0.0008, 0.00022, depth), palette.roofDark);
    gutter.rotation.z = Math.PI; gutter.position.set(side * (run + 0.0003), ridge - slope * run - 0.0002, 0); gutter.name = "eave-gutter"; parent.add(gutter);
  }
  const caps = Math.ceil(depth / 0.0044);
  for (let index = 0; index < caps; index++) {
    const cap = new THREE.Mesh(createRidgeCapGeometry(0.00085, 0.0003, depth / caps - 0.00004), palette.roof);
    cap.position.set(0, ridge + thickness * Math.cos(angle), -depth / 2 + (index + 0.5) * depth / caps); cap.name = "clay-ridge-cap"; parent.add(cap);
  }
}

function chimney(parent: THREE.Group, position: [number, number, number], width: number, depth: number, height: number, palette: Palette): void {
  const [x, bottom, z] = position, top = bottom + height;
  box(parent, [width, height, depth], [x, bottom + height / 2, z], palette.plasterDark);
  box(parent, [width + 0.0006, 0.0006, depth + 0.0006], [x, top - 0.0012, z], palette.plasterDark);
  const wall = 0.0008, outsideX = width + 0.0016, outsideZ = depth + 0.0016;
  for (const side of [-1, 1]) {
    const long = box(parent, [outsideX, 0.0017, wall], [x, top + 0.00085, z + side * (outsideZ - wall) / 2], palette.rock);
    long.name = "chimney-open-crown";
    const short = box(parent, [wall, 0.0017, outsideZ - 2 * wall], [x + side * (outsideX - wall) / 2, top + 0.00085, z], palette.rock);
    short.name = "chimney-open-crown";
  }
  const bore = box(parent, [width, 0.0001, depth], [x, top + 0.00005, z], palette.darkWood);
  bore.name = "chimney-recessed-flue";
}

function gableBraces(parent: THREE.Group, width: number, depth: number, wallTop: number, rise: number, palette: Palette): void {
  for (const side of [-1, 1]) {
    const z = side * (depth / 2 + 0.00065);
    box(parent, [width, 0.001, 0.00065], [0, wallTop + 0.0006, z], palette.darkWood);
    beam(parent, new THREE.Vector3(0, wallTop + 0.0006, z), new THREE.Vector3(0, wallTop + rise - 0.0005, z), 0.0008, 0.00065, palette.darkWood);
    for (const edge of [-1, 1]) beam(parent, new THREE.Vector3(edge * width * 0.4, wallTop + 0.0011, z), new THREE.Vector3(0, wallTop + rise * 0.73, z), 0.00065, 0.00065, palette.darkWood);
  }
}

export function createCottageArchitecture(palette: Palette): THREE.Group {
  const group = new THREE.Group(), d = COTTAGE_DIMENSIONS, top = d.wallBottom + d.wallHeight;
  group.name = "cottage-architecture";
  const foundation = box(group, [0.039, 0.003, 0.033], [0, 0.0015, 0], palette.rock, 0.00025); foundation.name = "cottage-ground-foundation";
  box(group, [d.width - d.wallThickness, 0.0008, d.depth - d.wallThickness], [0, d.wallBottom + 0.0004, 0], palette.darkWood);
  const front: WallOpening[] = [{ x: 0, y: 0.00025, width: 0.007, height: 0.015 },
    { x: -0.0107, y: 0.0175, width: 0.0063, height: 0.0085 }, { x: 0.0107, y: 0.0175, width: 0.0063, height: 0.0085 }];
  facade(group, "cottage-front", d.width, d.wallHeight, d.wallThickness, [0, d.wallBottom, d.depth / 2], 0, front, palette, 0, true);
  facade(group, "cottage-rear", d.width, d.wallHeight, d.wallThickness, [0, d.wallBottom, -d.depth / 2], Math.PI,
    [{ x: -0.0098, y: 0.011, width: 0.007, height: 0.0095 }, { x: 0.0098, y: 0.011, width: 0.007, height: 0.0095 }], palette, -1, true);
  for (const side of [-1, 1]) facade(group, `cottage-side-${side}`, d.depth, d.wallHeight, d.wallThickness,
    [side * d.width / 2, d.wallBottom, 0], side * Math.PI / 2,
    [{ x: -0.0067, y: 0.011, width: 0.0074, height: 0.010 }, { x: 0.0067, y: 0.011, width: 0.0074, height: 0.010 }], palette);
  const attic = new THREE.Mesh(createGableGeometry(d.width, d.ridgeRise, d.depth), palette.plaster); attic.position.y = top; group.add(attic);
  gableBraces(group, d.width, d.depth, top, d.ridgeRise, palette);
  roof(group, d.width, d.depth, top, d.ridgeRise, 0.0025, 0.002, palette);
  for (const side of [-1, 1]) {
    // The downpipe is inside the roof's footprint and is attached by two clips.
    const pipe = cylinder(group, 0.00038, 0.00038, 0.0254, [side * 0.0187, 0.0157, -0.0135], palette.roofDark, 8); pipe.name = "attached-rainwater-pipe";
    const from = new THREE.Vector3(side * 0.0208, 0.030, -0.0135), to = new THREE.Vector3(side * 0.0187, 0.0284, -0.0135);
    const direction = to.clone().sub(from), midpoint = from.clone().add(to).multiplyScalar(0.5);
    const elbow = cylinder(group, 0.00038, 0.00038, direction.length(), midpoint.toArray() as [number, number, number], palette.roofDark, 8);
    elbow.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize()); elbow.name = "connected-gutter-outlet";
    for (const y of [0.008, 0.025]) box(group, [0.0014, 0.0004, 0.001], [side * 0.0185, y, -0.0135], palette.roofDark);
  }
  box(group, [0.010, 0.0015, 0.0033], [0, 0.00075, 0.0181], palette.platform, 0.00015);
  box(group, [0.009, 0.0015, 0.002], [0, 0.00225, 0.0175], palette.platform, 0.00012);
  chimney(group, [0.0055, 0.039, -0.0055], 0.005, 0.0058, 0.016, palette);
  return group;
}

export function createStationArchitecture(palette: Palette): THREE.Group {
  const group = new THREE.Group(), d = STATION_DIMENSIONS, top = d.wallBottom + d.wallHeight;
  group.name = "station-architecture";
  const platform = box(group, [0.203, 0.0056, 0.030], [-0.025, 0.0032, -0.115], palette.platform, 0.0008); platform.name = "station-grounded-platform";
  for (let index = 0; index < 26; index++) box(group, [0.00022, 0.00018, 0.027], [-0.122 + index * 0.0077, 0.00608, -0.115], palette.plasterDark);
  box(group, [0.201, 0.0005, 0.0021], [-0.025, 0.00605, -0.1284], palette.trim);
  const foundation = box(group, [0.093, d.wallBottom - d.ground, 0.039], [d.x, (d.wallBottom + d.ground) / 2, d.z], palette.rock, 0.00035);
  foundation.name = "station-ground-foundation";
  for (const side of [-1, 1]) {
    for (const y of [0.0035, 0.0063]) box(group, [0.091, 0.00017, 0.00018], [d.x, y, d.z + side * 0.01951], palette.plasterDark);
    for (let stone = 0; stone < 10; stone++) box(group, [0.00016, 0.0026, 0.00018], [d.x - 0.042 + stone * 0.009, 0.0049, d.z + side * 0.01951], palette.plasterDark);
  }
  const entry: WallOpening = { x: 0, y: 0.0003, width: 0.012, height: 0.019 };
  for (const side of [-1, 1]) facade(group, side === 1 ? "station-village-front" : "station-platform-front", d.width, d.wallHeight, 0.0015,
    [d.x, d.wallBottom, d.z + side * d.depth / 2], side === 1 ? 0 : Math.PI,
    [entry, { x: -0.028, y: 0.008, width: 0.0135, height: 0.015 }, { x: 0.028, y: 0.008, width: 0.0135, height: 0.015 }], palette, 0);
  for (const side of [-1, 1]) facade(group, `station-gable-wall-${side}`, d.depth, d.wallHeight, 0.0015,
    [d.x + side * d.width / 2, d.wallBottom, d.z], side * Math.PI / 2,
    [{ x: 0, y: 0.010, width: 0.012, height: 0.014 }], palette);
  box(group, [d.width - 0.0015, 0.001, d.depth - 0.0015], [d.x, d.wallBottom + 0.0005, d.z], palette.darkWood);
  const roofGroup = new THREE.Group(); roofGroup.position.set(d.x, 0, d.z); roofGroup.rotation.y = Math.PI / 2;
  const attic = new THREE.Mesh(createGableGeometry(d.depth, 0.0162, d.width), palette.plaster); attic.position.y = top; roofGroup.add(attic);
  gableBraces(roofGroup, d.depth, d.width, top, 0.0162, palette);
  roof(roofGroup, d.depth, d.width, top, 0.0162, 0.004, 0.007, palette); group.add(roofGroup);
  chimney(group, [-0.065, 0.045, -0.075], 0.0065, 0.0065, 0.023, palette);
  const canopy = box(group, [0.093, 0.0011, 0.020], [d.x, 0.036, -0.1085], palette.green); canopy.name = "station-canopy";
  box(group, [0.093, 0.0017, 0.0012], [d.x, 0.0348, -0.1179], palette.green);
  box(group, [0.093, 0.001, 0.0014], [d.x, 0.0362, -0.0987], palette.roofDark);
  for (const x of [-0.079, 0.005]) {
    const post = cylinder(group, 0.00085, 0.0011, 0.0293, [x, 0.02065, -0.1155], palette.green, 10); post.name = "station-canopy-grounded-post";
    box(group, [0.003, 0.001, 0.003], [x, 0.0065, -0.1155], palette.rock);
    for (const side of [-1, 1]) beam(group, new THREE.Vector3(x, 0.0295, -0.1155), new THREE.Vector3(x + side * 0.007, 0.0348, -0.1155), 0.0008, 0.0008, palette.green);
  }
  // Three attached steps descend from the actual foundation to the ground,
  // staying inside the same immutable station exclusion rectangle.
  for (let step = 0; step < 3; step++) {
    const height = (3 - step) * (d.wallBottom - d.ground) / 3;
    const tread = box(group, [0.018 + step * 0.001, height, 0.0024], [d.x, d.ground + height / 2, -0.0614 + step * 0.002], palette.platform, 0.00015);
    tread.name = "station-entry-step";
  }
  for (let index = 0; index < 3; index++) {
    const x = 0.031 + index * 0.011;
    const cargo = box(group, [0.009, 0.008, 0.009], [x, 0.010, -0.117], palette.wagon, 0.00025); cargo.name = "platform-grounded-cargo";
    for (const side of [-1, 1]) box(group, [0.0092, 0.0006, 0.0007], [x, 0.0135, -0.117 + side * 0.0044], palette.darkWood);
    for (const side of [-1, 1]) box(group, [0.0006, 0.008, 0.0007], [x + side * 0.0035, 0.010, -0.1216], palette.darkWood);
  }
  const gateCenter = d.x, gateHalf = 0.012;
  for (let index = 0; index < 17; index++) {
    const x = -0.126 + index * 0.012;
    if (Math.abs(x - gateCenter) < gateHalf) continue;
    box(group, [0.0015, 0.0126, 0.0015], [x, 0.0067, -0.058], palette.trim);
  }
  for (const y of [0.0045, 0.0105]) {
    const left = -0.126, right = 0.066;
    box(group, [gateCenter - gateHalf - left, 0.0011, 0.001], [(left + gateCenter - gateHalf) / 2, y, -0.058], palette.trim);
    box(group, [right - gateCenter - gateHalf, 0.0011, 0.001], [(right + gateCenter + gateHalf) / 2, y, -0.058], palette.trim);
  }
  for (const side of [-1, 1]) box(group, [0.0018, 0.013, 0.0018], [gateCenter + side * gateHalf, 0.0069, -0.058], palette.trim);
  return group;
}
