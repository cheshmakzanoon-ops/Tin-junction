import * as THREE from "three";
import { CONSIST, consistPoses, couplerPosition, sampleOval, WHEEL_RADIUS } from "../model/index";
import type { LayoutDocument } from "../model/index";
import { box, compactGroup, cylinder, RAIL_OFFSET, RAIL_TOP } from "./geometry";
import type { Palette } from "./materials";
import { steamTexture } from "./materials";
import { CHIMNEY_OUTLET, crankOffset, steamOrigin } from "./trainMechanics";
import { barrelEndGeometry, barrelRoofGeometry, turnedProfileGeometry } from "./trainDetailGeometry";

function alongZ(mesh: THREE.Mesh): THREE.Mesh { mesh.rotation.x = Math.PI / 2; return mesh; }
function alongX(mesh: THREE.Mesh): THREE.Mesh { mesh.rotation.z = Math.PI / 2; return mesh; }

function detail(parent: THREE.Group, geometry: THREE.BufferGeometry, material: THREE.Material, position: [number, number, number]): THREE.Mesh {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(...position); parent.add(mesh);
  return mesh;
}

function suspension(group: THREE.Group, palette: Palette, wheelbase: number): void {
  for (const side of [-1, 1]) for (const axle of [-wheelbase / 2, wheelbase / 2]) {
    // A bearing box sits outside the rotating hub; the stacked leaves carry
    // the underframe above it instead of floating beside the carriage body.
    box(group, [0.0020, 0.0030, 0.0030], [side * 0.0111, 0.0137, axle], palette.iron, 0.0003);
    for (let leaf = 0; leaf < 3; leaf++) {
      box(group, [0.0013, 0.00028, 0.008 - leaf * 0.0015], [side * 0.0109, 0.0159 + leaf * 0.00035, axle], palette.iron);
    }
    for (const end of [-1, 1]) box(group, [0.0011, 0.0023, 0.0008], [side * 0.0109, 0.0165, axle + end * 0.004], palette.iron);
  }
}

function locomotive(palette: Palette): THREE.Group {
  const group = new THREE.Group();
  // Chassis rails sit between the wheel backs; the wider running board clears
  // the tyre tops. A full-width solid block would cut through every wheel.
  box(group, [0.014, 0.0032, 0.066], [0, 0.0174, -0.001], palette.iron, 0.0005);
  box(group, [0.026, 0.0012, 0.061], [0, 0.0199, -0.001], palette.green, 0.0004);
  alongZ(cylinder(group, 0.0101, 0.0101, 0.035, [0, 0.0285, 0.006], palette.green, 24));
  alongZ(cylinder(group, 0.0096, 0.0096, 0.008, [0, 0.0285, 0.027], palette.iron, 24));
  alongZ(cylinder(group, 0.0102, 0.0102, 0.0007, [0, 0.0285, 0.0314], palette.brass, 24));
  alongZ(cylinder(group, 0.0088, 0.0088, 0.0007, [0, 0.0285, 0.032], palette.iron, 24));
  for (const z of [-0.006, 0.008, 0.021]) alongZ(cylinder(group, 0.01035, 0.01035, 0.0008, [0, 0.0285, z], palette.darkBrass, 24));
  for (const side of [-1, 1]) {
    box(group, [0.004, 0.011, 0.030], [side * 0.0106, 0.025, 0.001], palette.enamel, 0.0008);
    box(group, [0.0042, 0.0008, 0.028], [side * 0.0106, 0.031, 0.001], palette.brass);
    alongZ(cylinder(group, 0.00045, 0.00045, 0.033, [side * 0.0124, 0.0334, 0.004], palette.brass, 8));
    for (const z of [-0.009, 0.004, 0.017]) alongX(cylinder(group, 0.0003, 0.0003, 0.0015, [side * 0.0118, 0.0334, z], palette.darkBrass, 8));
    cylinder(group, 0.0016, 0.0018, 0.0008, [side * 0.0100, 0.0318, 0.002], palette.iron, 12);
    alongZ(cylinder(group, 0.0034, 0.0034, 0.009, [side * 0.0098, 0.0134, 0.0290], palette.iron, 12));
    alongZ(cylinder(group, 0.0021, 0.0021, 0.0035, [side * 0.0085, 0.0167, 0.034], palette.iron, 12));
    for (const y of [0.0130, 0.0165]) box(group, [0.0032, 0.0007, 0.0075], [side * 0.0128, y, -0.024], palette.iron);
    for (const z of [-0.027, -0.021]) box(group, [0.0006, 0.005, 0.0006], [side * 0.0128, 0.015, z], palette.iron);
  }
  detail(group, turnedProfileGeometry([
    [0.0042, 0.03825], [0.0031, 0.0400], [0.0039, 0.0498],
    [0.00325, 0.0498], [0.00245, 0.0400], [0.00245, 0.03825], [0.0042, 0.03825],
  ]), palette.iron, [0, 0, CHIMNEY_OUTLET.z]);
  detail(group, turnedProfileGeometry([
    [0.0046, 0.0498], [0.005, CHIMNEY_OUTLET.y], [0.00325, CHIMNEY_OUTLET.y],
    [0.00325, 0.0498], [0.0046, 0.0498],
  ]), palette.brass, [0, 0, CHIMNEY_OUTLET.z]);
  detail(group, turnedProfileGeometry([
    [0, 0], [0.0048, 0], [0.0048, 0.0011], [0.0045, 0.0035], [0.0037, 0.0052],
    [0.0024, 0.00585], [0, 0.006],
  ]), palette.brass, [0, 0.0371, 0.004]);
  cylinder(group, 0.0012, 0.0015, 0.005, [0.004, 0.042, -0.005], palette.brass, 12);
  box(group, [0.022, 0.012, 0.023], [0, 0.0255, -0.023], palette.green, 0.0006);
  for (const side of [-1, 1]) {
    for (const z of [-0.034, -0.012]) box(group, [0.0017, 0.015, 0.0017], [side * 0.0107, 0.037, z], palette.green);
    for (const z of [-0.028, -0.018]) box(group, [0.0006, 0.0097, 0.0084], [side * 0.0109, 0.0371, z], palette.glass);
    for (const y of [0.0319, 0.0424]) box(group, [0.0011, 0.0009, 0.0207], [side * 0.0110, y, -0.023], palette.green);
    box(group, [0.0011, 0.0110, 0.0008], [side * 0.0110, 0.0371, -0.023], palette.green);
    box(group, [0.0013, 0.0032, 0.022], [side * 0.0109, 0.0442, -0.023], palette.green);
    box(group, [0.00035, 0.0030, 0.0065], [side * 0.01125, 0.0267, -0.0245], palette.brass);
    // Original geometric fleet mark "01" on the tiny cast plate.
    for (const z of [-0.0264, -0.0252]) box(group, [0.00015, 0.0017, 0.00022], [side * 0.01148, 0.0267, z], palette.iron);
    for (const y of [0.02595, 0.02745]) box(group, [0.00015, 0.00022, 0.0014], [side * 0.01148, y, -0.0258], palette.iron);
    box(group, [0.00015, 0.0017, 0.00024], [side * 0.01148, 0.0267, -0.0232], palette.iron);
    for (const z of [-0.0305, -0.014]) cylinder(group, 0.00025, 0.00025, 0.006, [side * 0.0120, 0.0330, z], palette.brass, 8);
  }
  for (const z of [-0.0342, -0.0118]) {
    for (const x of [-0.0054, 0.0054]) box(group, [0.0087, 0.0097, 0.0007], [x, 0.0371, z], palette.glass);
    for (const y of [0.0319, 0.0424]) box(group, [0.0218, 0.0010, 0.0011], [0, y, z], palette.green);
    box(group, [0.0010, 0.0112, 0.0011], [0, 0.0371, z], palette.green);
    box(group, [0.022, 0.0013, 0.0017], [0, 0.0437, z], palette.green);
    detail(group, barrelEndGeometry(0.022, 0.029, 0.0024, 0.0009, 0.0011), palette.green, [0, 0.0437, z]);
  }
  detail(group, barrelRoofGeometry(0.029, 0.028, 0.0024, 0.0008), palette.iron, [0, 0.0446, -0.023]);
  for (const side of [-1, 1]) alongZ(cylinder(group, 0.00035, 0.00035, 0.028, [side * 0.0140, 0.04545, -0.023], palette.iron, 8));
  // Smokebox door latch, hinge knuckles and restrained fasteners give the
  // front a constructed face without changing its operating envelope.
  for (const y of [0.0245, 0.0300]) box(group, [0.0010, 0.0018, 0.0007], [-0.0069, y, 0.0325], palette.darkBrass);
  alongZ(cylinder(group, 0.0012, 0.0012, 0.0008, [0, 0.0273, 0.0325], palette.darkBrass, 12));
  box(group, [0.0040, 0.00055, 0.0005], [0, 0.0273, 0.0330], palette.iron);
  for (let fastener = 0; fastener < 10; fastener++) {
    const angle = fastener * Math.PI / 5;
    alongZ(cylinder(group, 0.00025, 0.00025, 0.00035, [Math.sin(angle) * 0.0076, 0.0285 + Math.cos(angle) * 0.0076, 0.03245], palette.darkBrass, 6));
  }
  alongZ(cylinder(group, 0.0032, 0.0032, 0.0042, [0, 0.034, 0.034], palette.iron, 16));
  alongZ(cylinder(group, 0.0025, 0.0025, 0.0005, [0, 0.034, 0.0364], palette.lampGlass, 16));
  box(group, [0.023, 0.003, 0.002], [0, 0.016, -0.035], palette.wheel);
  return compactGroup(group);
}

function carriage(palette: Palette, freight: boolean): THREE.Group {
  const group = new THREE.Group();
  box(group, [0.014, 0.003, 0.046], [0, 0.017, 0], palette.iron, 0.0004);
  box(group, [0.023, 0.002, 0.044], [0, 0.0203, 0], palette.wagon);
  if (!freight) {
    box(group, [0.022, 0.0074, 0.041], [0, 0.0247, 0], palette.wagonBlue, 0.0004);
    for (const side of [-1, 1]) {
      for (let index = 0; index < 4; index += 1) {
        const z = -0.015 + index * 0.010;
        box(group, [0.00065, 0.0069, 0.0074], [side * 0.0108, 0.0320, z], palette.glass);
        for (const edge of [-1, 1]) box(group, [0.0010, 0.0084, 0.00075], [side * 0.0110, 0.0320, z + edge * 0.0041], palette.trim);
        for (const y of [0.0279, 0.0361]) box(group, [0.0010, 0.0007, 0.0089], [side * 0.0110, y, z], palette.trim);
        box(group, [0.0010, 0.0015, 0.0011], [side * 0.0110, 0.0323, z + 0.0048], palette.wagonBlue);
        box(group, [0.0005, 0.0034, 0.0073], [side * 0.0112, 0.0241, z], palette.wagonBlue);
        for (const edge of [-1, 1]) box(group, [0.0004, 0.0039, 0.0003], [side * 0.01145, 0.0241, z + edge * 0.0038], palette.trim);
      }
      box(group, [0.001, 0.001, 0.041], [side * 0.0114, 0.022, 0], palette.brass);
      box(group, [0.0010, 0.0010, 0.041], [side * 0.0110, 0.0370, 0], palette.wagonBlue);
      for (const z of [-0.020, -0.010, 0, 0.010, 0.020]) box(group, [0.0012, 0.0085, 0.0010], [side * 0.0109, 0.0320, z], palette.wagonBlue);
      for (const end of [-1, 1]) {
        box(group, [0.0032, 0.0006, 0.0055], [side * 0.0116, 0.0176, end * 0.0186], palette.iron);
        cylinder(group, 0.0003, 0.0003, 0.0080, [side * 0.0117, 0.027, end * 0.0192], palette.brass, 8);
      }
    }
    detail(group, barrelRoofGeometry(0.027, 0.046, 0.0025, 0.0007), palette.roofDark, [0, 0.0368, 0]);
    for (const z of [-0.013, 0.013]) {
      cylinder(group, 0.0010, 0.0010, 0.00055, [0, 0.0401, z], palette.iron, 12);
      detail(group, barrelRoofGeometry(0.0038, 0.0036, 0.0005, 0.0002), palette.roofDark, [0, 0.0403, z]);
    }
    for (const end of [-1, 1]) {
      box(group, [0.022, 0.0155, 0.0010], [0, 0.0288, end * 0.0205], palette.wagonBlue);
      detail(group, barrelEndGeometry(0.022, 0.027, 0.0025, 0.0005, 0.0010), palette.wagonBlue, [0, 0.0363, end * 0.0205]);
      box(group, [0.006, 0.0125, 0.00065], [0, 0.0284, end * 0.0211], palette.darkWood);
      box(group, [0.0045, 0.005, 0.0007], [0, 0.032, end * 0.0215], palette.glass);
      for (const x of [-0.0034, 0.0034]) box(group, [0.0006, 0.013, 0.0007], [x, 0.0284, end * 0.0215], palette.trim);
      alongX(cylinder(group, 0.0003, 0.0003, 0.0017, [0.0017, 0.0277, end * 0.0217], palette.brass, 8));
    }
  } else {
    for (const side of [-1, 1]) {
      for (let plank = 0; plank < 3; plank += 1) box(group, [0.0015, 0.0028, 0.043], [side * 0.011, 0.023 + plank * 0.003, 0], palette.wagon);
      for (const z of [-0.019, 0, 0.019]) box(group, [0.0015, 0.011, 0.0012], [side * 0.012, 0.025, z], palette.iron);
      for (let plank = 0; plank < 3; plank++) box(group, [0.022, 0.0028, 0.0015], [0, 0.023 + plank * 0.003, side * 0.021], palette.wagon);
      for (const x of [-0.0085, 0.0085]) box(group, [0.0010, 0.0090, 0.0007], [x, 0.026, side * 0.022], palette.iron);
      for (const z of [-0.019, 0, 0.019]) for (const y of [0.022, 0.029]) alongX(cylinder(group, 0.00028, 0.00028, 0.0004, [side * 0.0128, y, z], palette.iron, 6));
      for (const x of [-0.0085, 0.0085]) alongX(cylinder(group, 0.00055, 0.00055, 0.003, [x, 0.0218, side * 0.022], palette.iron, 8));
    }
    for (let log = 0; log < 5; log += 1) {
      const x = log < 3 ? (log - 1) * 0.0062 : (log - 3.5) * 0.0062;
      const y = log < 3 ? 0.0244 : 0.02978;
      alongZ(cylinder(group, 0.0028, 0.0031, 0.033, [x, y, 0], palette.bark, 16));
      for (const end of [-1, 1]) {
        const radius = end < 0 ? 0.00265 : 0.0024;
        alongZ(cylinder(group, radius, radius, 0.00025, [x, y, end * 0.0166], palette.cream, 16));
        const grain = detail(group, new THREE.TorusGeometry(radius * 0.58, 0.000055, 4, 20), palette.wagon, [x, y, end * 0.01678]);
        grain.scale.y = 0.91; grain.rotation.z = log * 0.37;
        alongZ(cylinder(group, 0.00015, 0.00015, 0.00025, [x, y, end * 0.01675], palette.wagon, 8));
      }
    }
  }
  for (const z of [-0.014, 0.014]) alongX(cylinder(group, 0.0012, 0.0012, 0.018, [0, RAIL_TOP + WHEEL_RADIUS, z], palette.iron, 9));
  suspension(group, palette, 0.028);
  for (const side of [-1, 1]) box(group, [0.0011, 0.0030, 0.042], [side * 0.0067, 0.0172, 0], palette.iron);
  return compactGroup(group);
}

export function wheelPrefab(palette: Palette): THREE.Group {
  const group = new THREE.Group();
  // A closed radial section makes a real hollow tyre, not a solid cylinder
  // with painted-on spokes. The flange is on local -X (towards the track centre).
  const section = [
    [0.0047, -0.0013], [0.0065, -0.0013], [0.0065, -0.0009],
    [WHEEL_RADIUS, -0.0007], [WHEEL_RADIUS, 0.0009], [0.0047, 0.0009], [0.0047, -0.0013],
  ].map(([radius, axial]) => new THREE.Vector2(radius!, axial!));
  const tyreGeometry = new THREE.LatheGeometry(section, 32);
  // sin(2π) is not exactly zero. Close the duplicated seam bit-for-bit, which
  // also prevents a ray passing through the seam at macro inspection distance.
  const tyrePositions = tyreGeometry.getAttribute("position");
  for (let point = 0; point < section.length; point += 1) {
    tyrePositions.setXYZ(32 * section.length + point, tyrePositions.getX(point), tyrePositions.getY(point), tyrePositions.getZ(point));
  }
  const tyre = new THREE.Mesh(tyreGeometry, palette.steel);
  // Lathe's axial +Y becomes local +X.
  tyre.rotation.z = -Math.PI / 2;
  group.add(tyre);
  for (let spoke = 0; spoke < 8; spoke += 1) {
    const angle = spoke * Math.PI / 4;
    const rib = box(group, [0.0015, 0.0039, 0.0007], [0, Math.cos(angle) * 0.0031, Math.sin(angle) * 0.0031], palette.wheel);
    rib.rotation.x = angle;
  }
  alongX(cylinder(group, 0.0014, 0.0014, 0.003, [0, 0, 0], palette.darkBrass, 12));
  return compactGroup(group);
}

/** Render-only rig: train location and wheel distance remain owned by the pure model. */
export class TrainRig {
  readonly group = new THREE.Group();
  private readonly bodies: THREE.Group[];
  private readonly wheels: THREE.InstancedMesh[];
  private readonly rods: THREE.Mesh[];
  private readonly couplers: THREE.Mesh[];
  private readonly crankPins: THREE.InstancedMesh;
  private readonly steam: THREE.Points;
  private readonly transforms = Array.from({ length: 3 }, () => new THREE.Matrix4());
  private readonly transform = new THREE.Object3D();
  private readonly worldMatrix = new THREE.Matrix4();
  private readonly point = new THREE.Vector3();
  private lastUpdate = "";

  constructor(palette: Palette) {
    this.group.name = "train";
    this.bodies = [locomotive(palette), carriage(palette, false), carriage(palette, true)];
    this.bodies.forEach((body, index) => { body.name = ["engine-01", "carriage-01", "freight-01"][index]!; this.group.add(body); });
    const prefab = wheelPrefab(palette);
    this.wheels = prefab.children.map(child => {
      const source = child as THREE.Mesh<THREE.BufferGeometry, THREE.Material>;
      const mesh = new THREE.InstancedMesh(source.geometry, source.material, 14);
      mesh.name = "instanced-wheel-parts";
      mesh.castShadow = true; mesh.receiveShadow = true;
      this.group.add(mesh); return mesh;
    });
    this.rods = [-1, 1].map(() => {
      const parts = new THREE.Group();
      box(parts, [0.0012, 0.0012, 0.036], [0, 0, 0], palette.steel);
      for (const z of [-0.018, 0, 0.018]) alongX(cylinder(parts, 0.00135, 0.00135, 0.0012, [0, 0, z], palette.steel, 12));
      const rod = compactGroup(parts).children[0] as THREE.Mesh;
      rod.name = "coupling-rod";
      rod.castShadow = true; this.group.add(rod); return rod;
    });
    const pinGeometry = new THREE.CylinderGeometry(0.0008, 0.0008, 0.0018, 10);
    pinGeometry.rotateZ(Math.PI / 2);
    this.crankPins = new THREE.InstancedMesh(pinGeometry, palette.darkBrass, 6);
    this.crankPins.name = "quartered-crank-pins";
    this.crankPins.castShadow = true;
    this.group.add(this.crankPins);
    this.couplers = [0, 1].map(() => {
      const coupler = new THREE.Mesh(new THREE.CylinderGeometry(0.0011, 0.0011, 1, 8), palette.iron);
      this.group.add(coupler); return coupler;
    });
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(new Float32Array(16 * 3), 3));
    const material = new THREE.PointsMaterial({ map: steamTexture(), color: 0xf2eee4, size: 0.018, transparent: true, opacity: 0.35, depthWrite: false, sizeAttenuation: true });
    this.steam = new THREE.Points(geometry, material);
    this.steam.name = "chimney-steam";
    this.steam.frustumCulled = false;
    this.group.add(this.steam);
  }

  update(document: LayoutDocument): void {
    const updateKey = [document.track.straightLength, document.track.radius, document.train.distance, document.train.wheelTravel, document.train.speed, document.train.speed > 0.002 ? document.tick : 0].join(":");
    if (updateKey === this.lastUpdate) return;
    this.lastUpdate = updateKey;
    const poses = consistPoses(document.track, document.train.distance);
    const phase = document.train.wheelTravel / WHEEL_RADIUS;
    let wheelIndex = 0;
    for (let index = 0; index < 3; index += 1) {
      const pose = poses[index]!;
      const body = this.bodies[index]!;
      body.position.set(pose.position.x, 0, pose.position.z);
      body.rotation.y = pose.yaw;
      body.updateMatrix();
      this.transforms[index]!.copy(body.matrix);
      const wheelbase = index === 0 ? 0.036 : 0.028;
      const axles = index === 0 ? [-wheelbase / 2, 0, wheelbase / 2] : [-wheelbase / 2, wheelbase / 2];
      for (const z of axles) for (const side of [-1, 1]) {
        this.transform.position.set(side * RAIL_OFFSET, RAIL_TOP + WHEEL_RADIUS, z);
        if (index === 0 && z === 0) {
          const center = sampleOval(document.track, (pose.frontDistance + pose.rearDistance) / 2);
          this.point.set(center.position.x, RAIL_TOP + WHEEL_RADIUS, center.position.z).applyMatrix4(body.matrix.clone().invert());
          this.transform.position.x += this.point.x;
          this.transform.position.z = this.point.z;
        }
        // Turn the left tyre around so both flanges face inwards. Do not use
        // negative instance scales: Three.js InstancedMesh does not support them.
        this.transform.rotation.set(phase + (side < 0 ? Math.PI / 2 : 0), side < 0 ? Math.PI : 0, 0);
        this.transform.scale.setScalar(1);
        this.transform.updateMatrix();
        this.worldMatrix.multiplyMatrices(body.matrix, this.transform.matrix);
        this.wheels.forEach(mesh => mesh.setMatrixAt(wheelIndex, this.worldMatrix));
        wheelIndex += 1;
      }
    }
    this.wheels.forEach(mesh => { mesh.instanceMatrix.needsUpdate = true; mesh.computeBoundingSphere(); });
    this.transform.scale.setScalar(1);
    this.rods.forEach((rod, index) => {
      const side = index === 0 ? -1 : 1;
      const crank = crankOffset(phase, side);
      this.transform.position.set(crank.x, RAIL_TOP + WHEEL_RADIUS + crank.y, crank.z);
      this.transform.rotation.set(0, 0, 0);
      this.transform.updateMatrix();
      rod.matrixAutoUpdate = false;
      rod.matrix.multiplyMatrices(this.transforms[0]!, this.transform.matrix);
      for (let axle = 0; axle < 3; axle += 1) {
        this.transform.position.z = crank.z + (axle - 1) * CONSIST[0]!.wheelbase / 2;
        this.transform.updateMatrix();
        this.worldMatrix.multiplyMatrices(this.transforms[0]!, this.transform.matrix);
        this.crankPins.setMatrixAt(index * 3 + axle, this.worldMatrix);
      }
    });
    this.crankPins.instanceMatrix.needsUpdate = true;
    this.crankPins.computeBoundingSphere();
    this.couplers.forEach((coupler, index) => {
      const rear = couplerPosition(poses[index]!, CONSIST[index]!.bodyLength, "rear");
      const front = couplerPosition(poses[index + 1]!, CONSIST[index + 1]!.bodyLength, "front");
      const a = new THREE.Vector3(rear.x, 0.016, rear.z);
      const b = new THREE.Vector3(front.x, 0.016, front.z);
      coupler.position.copy(a).add(b).multiplyScalar(0.5);
      const delta = b.sub(a), length = delta.length();
      coupler.scale.set(1, Math.max(0.001, length), 1);
      coupler.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), delta.normalize());
    });
    this.steam.visible = document.train.speed > 0.002;
    if (this.steam.visible) {
      const positions = this.steam.geometry.getAttribute("position");
      for (let index = 0; index < positions.count; index += 1) {
        const age = ((document.tick / 60 + index * 0.107) % 1.7);
        const outlet = steamOrigin(document.track, document.train.distance, document.train.speed, document.train.direction, age);
        positions.setXYZ(index, outlet.x + Math.sin(index * 1.77 + age) * age * 0.004, outlet.y + age * 0.021, outlet.z + 0.01 * age);
      }
      positions.needsUpdate = true;
    }
  }
}
