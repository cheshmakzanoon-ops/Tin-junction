import * as THREE from "three";

/** Closed sheet-metal roof with a circular crown and real, constant vertical thickness. */
export function barrelRoofGeometry(width: number, length: number, rise: number, thickness: number): THREE.BufferGeometry {
  if (![width, length, rise, thickness].every(value => Number.isFinite(value) && value > 0)
    || rise >= width / 2 || thickness >= rise) throw new RangeError("Invalid miniature roof dimensions.");
  const halfWidth = width / 2, radius = (halfWidth ** 2 + rise ** 2) / (2 * rise);
  const section = new THREE.Shape();
  const crown = (x: number): number => Math.sqrt(Math.max(0, radius ** 2 - x ** 2)) - radius + rise;
  const steps = 24;
  for (let index = 0; index <= steps; index++) {
    const x = -halfWidth + width * index / steps, y = crown(x) + thickness;
    if (index === 0) section.moveTo(x, y); else section.lineTo(x, y);
  }
  for (let index = steps; index >= 0; index--) {
    const x = -halfWidth + width * index / steps;
    section.lineTo(x, crown(x));
  }
  section.closePath();
  const geometry = new THREE.ExtrudeGeometry(section, { depth: length, bevelEnabled: false, steps: 1 });
  geometry.translate(0, 0, -length / 2);
  // Smooth only the rolled faces. The end plates and cut sheet edges retain
  // their own hard normals, so the metal has thickness instead of a soft blob.
  const positions = geometry.getAttribute("position"), normals = geometry.getAttribute("normal");
  for (let index = 0; index < positions.count; index++) {
    const sign = Math.sign(normals.getY(index));
    if (Math.abs(normals.getZ(index)) > 0.5 || Math.abs(normals.getY(index)) < 0.5) continue;
    const x = positions.getX(index);
    normals.setXYZ(index, sign * x / radius, sign * Math.sqrt(Math.max(0, radius ** 2 - x ** 2)) / radius, 0);
  }
  geometry.computeBoundingBox();
  return geometry;
}

/** End wall follows the roof's inner crown, including the narrower body/overhang relationship. */
export function barrelEndGeometry(width: number, roofWidth: number, rise: number, skirtHeight: number, depth: number): THREE.BufferGeometry {
  if (![width, roofWidth, rise, skirtHeight, depth].every(value => Number.isFinite(value) && value > 0)
    || width > roofWidth || rise >= roofWidth / 2) throw new RangeError("Invalid roof end wall dimensions.");
  const radius = ((roofWidth / 2) ** 2 + rise ** 2) / (2 * rise), section = new THREE.Shape();
  section.moveTo(-width / 2, 0); section.lineTo(width / 2, 0);
  for (let index = 0; index <= 24; index++) {
    const x = width / 2 - width * index / 24;
    section.lineTo(x, skirtHeight + Math.sqrt(radius ** 2 - x ** 2) - radius + rise);
  }
  section.closePath();
  const geometry = new THREE.ExtrudeGeometry(section, { depth, bevelEnabled: false, steps: 1 });
  geometry.translate(0, 0, -depth / 2);
  return geometry;
}

/** A closed revolved section; both outer wall and inner bore are authored explicitly. */
export function turnedProfileGeometry(points: ReadonlyArray<readonly [number, number]>, segments = 24): THREE.BufferGeometry {
  if (points.length < 4 || !Number.isInteger(segments) || segments < 8 || segments > 64
    || points.some(point => point.some(value => !Number.isFinite(value)) || point[0] < 0)) throw new RangeError("Invalid turned miniature profile.");
  const geometry = new THREE.LatheGeometry(points.map(([radius, height]) => new THREE.Vector2(radius, height)), segments);
  // A bit-identical seam keeps macro ray inspection and shadowing continuous.
  const positions = geometry.getAttribute("position"), normals = geometry.getAttribute("normal");
  for (let index = 0; index < points.length; index++) {
    const end = segments * points.length + index;
    positions.setXYZ(end, positions.getX(index), positions.getY(index), positions.getZ(index));
    normals.setXYZ(end, normals.getX(index), normals.getY(index), normals.getZ(index));
  }
  geometry.computeBoundingBox();
  return geometry;
}
