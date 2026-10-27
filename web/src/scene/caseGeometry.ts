import * as THREE from "three";
import { box, cylinder } from "./geometry";
import type { Palette } from "./materials";

/** Authored physical model dimensions; none are device/screen measurements. */
export const CASE_DIMENSIONS = Object.freeze({
  width: 0.846, depth: 0.546, wall: 0.009, lidCavity: 0.170,
  hingeY: 0.017, hingeZ: -0.277, lidRear: -0.004,
  tableY: -0.056, openPose: 1.30, minOpenPose: 1.20, maxOpenPose: 1.43,
});

/** Keep sensor-driven presentation open; full device closing is a later P20 gate. */
export function openCasePose(degrees: number | null): number {
  if (degrees === null || !Number.isFinite(degrees)) return CASE_DIMENSIONS.openPose;
  return THREE.MathUtils.clamp((180 - degrees) * Math.PI / 180, CASE_DIMENSIONS.minOpenPose, CASE_DIMENSIONS.maxOpenPose);
}

/** Return a point in the lid's authored cavity coordinates, for clearance checks. */
export function pointInLid(world: THREE.Vector3, angle: number): THREE.Vector3 {
  return world.clone().sub(new THREE.Vector3(0, CASE_DIMENSIONS.hingeY, CASE_DIMENSIONS.hingeZ))
    .applyAxisAngle(new THREE.Vector3(1, 0, 0), -angle);
}

/** A matching base/lid with a real cavity and coaxial alternating hinge knuckles. */
export function createDisplayCase(palette: Palette): { base: THREE.Group; lid: THREE.Group } {
  const d = CASE_DIMENSIONS, base = new THREE.Group(), lid = new THREE.Group();
  base.name = "case"; lid.name = "case-lid";
  box(base, [d.width, 0.040, d.depth], [0, -0.025, 0], palette.walnut, 0.006);
  // The foundation lies below the sculpted pond recess, rather than cutting
  // through its banks when the terrain dips below the surrounding turf.
  const foundation = box(base, [0.811, 0.0046, 0.510], [0, -0.0057, 0], palette.felt, 0.001);
  foundation.name = "case-terrain-foundation";
  for (const side of [-1, 1]) {
    box(base, [0.018, 0.042, 0.542], [side * 0.414, -0.005, 0], palette.walnut, 0.002);
    box(base, [0.815, 0.042, 0.018], [0, -0.005, side * 0.264], palette.walnut, 0.002);
    box(base, [0.002, 0.0014, 0.524], [side * 0.405, 0.0163, 0], palette.brass);
    box(base, [0.812, 0.0014, 0.002], [0, 0.0163, side * 0.255], palette.brass);
    for (const end of [-1, 1]) {
      const foot = cylinder(base, 0.014, 0.017, 0.011, [side * 0.344, -0.0505, end * 0.204], palette.felt, 16);
      foot.name = "case-foot"; // Top touches the base; bottom touches the table.
      box(base, [0.033, 0.0015, 0.025], [side * 0.403, 0.017, end * 0.257], palette.brass, 0.002);
      for (const offset of [-0.007, 0.007]) cylinder(base, 0.0011, 0.0011, 0.0007, [side * 0.403 + offset, 0.018, end * 0.257], palette.darkBrass, 10);
    }
    // Open toggle-latch hardware: the catch lives on the corresponding lid face.
    box(base, [0.023, 0.024, 0.002], [side * 0.245, -0.006, 0.274], palette.darkBrass, 0.002);
    box(base, [0.014, 0.016, 0.0035], [side * 0.245, -0.010, 0.277], palette.brass, 0.002);
    cylinder(base, 0.0015, 0.0015, 0.019, [side * 0.245, -0.001, 0.278], palette.brass, 10).rotation.z = Math.PI / 2;
    for (const y of [-0.015, 0.003]) {
      const screw = cylinder(base, 0.001, 0.001, 0.0007, [side * 0.245, y, 0.2755], palette.brass, 10);
      screw.rotation.x = Math.PI / 2;
    }
  }
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.024, 0.0032, 10, 30, Math.PI), palette.darkWood);
  handle.rotation.z = Math.PI; handle.scale.x = 2.5; handle.position.set(0, -0.014, 0.288); base.add(handle);
  for (const side of [-1, 1]) {
    const bracket = box(base, [0.011, 0.013, 0.010], [side * 0.059, -0.013, 0.278], palette.brass, 0.001);
    bracket.name = "case-handle-bracket";
    const pin = cylinder(base, 0.0022, 0.0022, 0.010, [side * 0.059, -0.014, 0.285], palette.darkBrass, 12);
    pin.rotation.x = Math.PI / 2; pin.name = "case-handle-pin";
  }
  handle.name = "case-handle";

  const middleZ = d.lidRear - d.depth / 2;
  const panel = box(lid, [d.width, d.wall, d.depth], [0, -d.lidCavity - d.wall / 2, middleZ], palette.walnut, 0.003);
  panel.name = "case-lid-panel";
  box(lid, [d.width - d.wall * 2, 0.0014, d.depth - d.wall * 2], [0, -d.lidCavity + 0.0007, middleZ], palette.felt, 0.001);
  for (const side of [-1, 1]) {
    box(lid, [d.wall, d.lidCavity, d.depth], [side * (d.width - d.wall) / 2, -d.lidCavity / 2, middleZ], palette.walnut, 0.0012);
    box(lid, [d.width - 2 * d.wall, d.lidCavity, d.wall], [0, -d.lidCavity / 2, middleZ + side * (d.depth - d.wall) / 2], palette.walnut, 0.0012);
    // Fine gasket and brass edge sit on the physical closing rim, not in mid-air.
    box(lid, [0.0055, 0.0012, d.depth - 0.011], [side * (d.width - d.wall) / 2, 0.0002, middleZ], palette.felt);
    box(lid, [d.width - 0.011, 0.0012, 0.0055], [0, 0.0002, middleZ + side * (d.depth - d.wall) / 2], palette.felt);
    box(lid, [0.0013, 0.0009, d.depth - 0.018], [side * (d.width / 2 - 0.002), 0.0009, middleZ], palette.brass);
    box(lid, [d.width - 0.018, 0.0009, 0.0013], [0, 0.0009, middleZ + side * (d.depth / 2 - 0.002)], palette.brass);
    const keeper = box(lid, [0.021, 0.018, 0.002], [side * 0.245, -0.012, d.lidRear - d.depth - 0.001], palette.darkBrass, 0.001);
    keeper.name = "lid-latch-keeper";
    cylinder(lid, 0.0016, 0.0016, 0.015, [side * 0.245, -0.010, d.lidRear - d.depth - 0.003], palette.brass, 10).rotation.z = Math.PI / 2;
  }
  for (const x of [-0.29, 0, 0.29]) {
    box(base, [0.056, 0.0014, 0.021], [x, 0.0167, -0.266], palette.brass, 0.001);
    box(lid, [0.056, 0.0014, 0.010], [x, 0.0007, -0.008], palette.brass, 0.0005);
    const leaf = box(lid, [0.056, 0.026, 0.0014], [x, -0.014, d.lidRear - d.wall - 0.0007], palette.brass, 0.0005);
    leaf.name = "lid-hinge-leaf-wall";
    for (let knuckle = 0; knuckle < 5; knuckle += 1) {
      const localX = x + (knuckle - 2) * 0.011;
      const moving = knuckle % 2 === 1;
      const barrel = cylinder(moving ? lid : base, 0.0036, 0.0036, 0.0104,
        [localX, moving ? 0 : d.hingeY, moving ? 0 : d.hingeZ], palette.brass, 16);
      barrel.rotation.z = Math.PI / 2; barrel.name = moving ? "lid-hinge-knuckle" : "base-hinge-knuckle";
    }
    for (const offset of [-0.019, 0.019]) {
      cylinder(base, 0.0011, 0.0011, 0.0008, [x + offset, 0.0177, -0.261], palette.darkBrass, 10);
      const screw = cylinder(lid, 0.0011, 0.0011, 0.0008, [x + offset, -0.019, d.lidRear - d.wall - 0.0018], palette.darkBrass, 10);
      screw.rotation.x = Math.PI / 2; screw.name = "lid-hinge-screw";
    }
  }
  lid.position.set(0, d.hingeY, d.hingeZ); lid.rotation.x = d.openPose;
  return { base, lid };
}
