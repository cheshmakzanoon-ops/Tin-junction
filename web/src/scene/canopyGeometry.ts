import * as THREE from "three";

/**
 * A small, opaque flock cluster. Shared ring vertices keep its soft normals
 * continuous at the seam; the seeded outline avoids identical smooth balls.
 * Geometry stays bounded and is merged/instanced with the existing tree kit.
 */
export function createCanopyGeometry(seed: number): THREE.BufferGeometry {
  if (!Number.isInteger(seed) || seed < 0 || seed > 0xffff_ffff) throw new RangeError("Canopy seed must be an unsigned integer");
  const segments = 8, rings = 4;
  const phase = seed % 997 / 997 * Math.PI * 2;
  const positions = [0, 1, 0], uv = [0.5, 1], indices: number[] = [];
  for (let ring = 1; ring <= rings; ring += 1) {
    const polar = ring / (rings + 1) * Math.PI;
    for (let segment = 0; segment < segments; segment += 1) {
      const angle = segment / segments * Math.PI * 2;
      const relief = 1 + Math.sin(polar) * (0.13 * Math.sin(angle * 3 + phase) + 0.07 * Math.cos(angle * 5 - polar * 3 + phase));
      positions.push(Math.cos(angle) * Math.sin(polar) * relief, Math.cos(polar) * relief, Math.sin(angle) * Math.sin(polar) * relief);
      uv.push(segment / segments, 1 - ring / (rings + 1));
    }
  }
  const bottom = positions.length / 3;
  positions.push(0, -1, 0); uv.push(0.5, 0);
  for (let segment = 0; segment < segments; segment += 1) {
    const next = (segment + 1) % segments;
    indices.push(0, 1 + next, 1 + segment);
    for (let ring = 0; ring < rings - 1; ring += 1) {
      const a = 1 + ring * segments + segment, b = 1 + ring * segments + next;
      indices.push(a, b, a + segments, b, b + segments, a + segments);
    }
    indices.push(1 + (rings - 1) * segments + segment, 1 + (rings - 1) * segments + next, bottom);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}

/** A closed, drooping mass of miniature needles, with a narrow serrated outline. */
export function createFirBoughGeometry(seed: number): THREE.BufferGeometry {
  if (!Number.isInteger(seed) || seed < 0 || seed > 0xffff_ffff) throw new RangeError("Bough seed must be an unsigned integer");
  const positions: number[] = [], uv: number[] = [], indices: number[] = [];
  const widths = [0.21, 0.76, 1, 0.79, 0.58, 0.07];
  const phase = seed % 997 / 997 * Math.PI * 2;
  const rows = widths.length, columns = 3, surfaceSize = rows * columns;
  for (const top of [true, false]) {
    for (let row = 0; row < rows; row += 1) {
      const x = row / (rows - 1) * 2 - 1, width = widths[row]!;
      for (let column = 0; column < columns; column += 1) {
        const side = column - 1;
        const fringe = 1 + 0.17 * Math.sin(row * 2.71 + side * 1.7 + phase);
        const crown = side === 0 ? width * (top ? 0.67 : -0.29) : top ? 0.047 : -0.047;
        positions.push(x, crown - x * 0.12, side * width * fringe);
        uv.push(row / (rows - 1), column / (columns - 1));
      }
    }
  }
  for (let row = 0; row < rows - 1; row += 1) for (let column = 0; column < columns - 1; column += 1) {
    const a = row * columns + column, b = a + 1, c = a + columns;
    indices.push(a, b, c, b, c + 1, c);
    indices.push(a + surfaceSize, c + surfaceSize, b + surfaceSize, b + surfaceSize, c + surfaceSize + 1, c + surfaceSize);
  }
  const perimeter = [
    ...Array.from({ length: rows }, (_, row) => row * columns),
    (rows - 1) * columns + 1, rows * columns - 1,
    ...Array.from({ length: rows - 1 }, (_, offset) => (rows - 2 - offset) * columns + 2), 1,
  ];
  for (let edge = 0; edge < perimeter.length; edge += 1) {
    const a = perimeter[edge]!, b = perimeter[(edge + 1) % perimeter.length]!;
    indices.push(a, b, a + surfaceSize, a + surfaceSize, b, b + surfaceSize);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  geometry.setIndex(indices); geometry.computeVertexNormals(); geometry.computeBoundingSphere();
  return geometry;
}
