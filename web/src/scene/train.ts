import * as THREE from "three";
import { CONSIST, consistPoses, couplerPosition, sampleOval, WHEEL_RADIUS } from "../model/index";
import type { LayoutDocument } from "../model/index";
import { box, compactGroup, cylinder, RAIL_OFFSET, RAIL_TOP } from "./geometry";
import type { Palette } from "./materials";
import { steamTexture } from "./materials";

function alongZ(mesh: THREE.Mesh): THREE.Mesh { mesh.rotation.x = Math.PI / 2; return mesh; }
function alongX(mesh: THREE.Mesh): THREE.Mesh { mesh.rotation.z = Math.PI / 2; return mesh; }

function locomotive(palette: Palette): THREE.Group {
  const group = new THREE.Group();
  box(group, [0.024, 0.0032, 0.066], [0, 0.0174, -0.001], palette.iron, 0.0005);
  box(group, [0.026, 0.0012, 0.061], [0, 0.0195, -0.001], palette.green, 0.0004);
  alongZ(cylinder(group, 0.0101, 0.0101, 0.035, [0, 0.0285, 0.006], palette.green, 24));
  alongZ(cylinder(group, 0.0096, 0.0096, 0.008, [0, 0.0285, 0.027], palette.iron, 24));
  alongZ(cylinder(group, 0.0102, 0.0102, 0.0007, [0, 0.0285, 0.0314], palette.brass, 24));
  alongZ(cylinder(group, 0.0088, 0.0088, 0.0007, [0, 0.0285, 0.032], palette.iron, 24));
  for (const z of [-0.006, 0.008, 0.021]) alongZ(cylinder(group, 0.01035, 0.01035, 0.0008, [0, 0.0285, z], palette.darkBrass, 24));
  for (const side of [-1, 1]) {
    box(group, [0.004, 0.011, 0.030], [side * 0.0106, 0.025, 0.001], palette.enamel, 0.0008);
    box(group, [0.0042, 0.0008, 0.028], [side * 0.0106, 0.031, 0.001], palette.brass);
    alongZ(cylinder(group, 0.00045, 0.00045, 0.033, [side * 0.0124, 0.0334, 0.004], palette.brass, 8));
    alongZ(cylinder(group, 0.0034, 0.0034, 0.009, [side * 0.0098, 0.0134, 0.0255], palette.iron, 12));
    alongZ(cylinder(group, 0.0021, 0.0021, 0.0035, [side * 0.0085, 0.0167, 0.034], palette.iron, 12));
    box(group, [0.0035, 0.0015, 0.010], [side * 0.0133, 0.013, -0.024], palette.iron);
  }
  cylinder(group, 0.0039, 0.003, 0.0115, [0, 0.044, 0.023], palette.iron, 18);
  cylinder(group, 0.005, 0.0046, 0.0018, [0, 0.0507, 0.023], palette.brass, 18);
  cylinder(group, 0.0037, 0.0048, 0.006, [0, 0.0401, 0.004], palette.brass, 18);
  cylinder(group, 0.0012, 0.0015, 0.005, [0.004, 0.042, -0.005], palette.brass, 12);
  box(group, [0.022, 0.013, 0.023], [0, 0.025, -0.023], palette.green, 0.0006);
  for (const side of [-1, 1]) {
    for (const z of [-0.034, -0.012]) box(group, [0.0017, 0.015, 0.0017], [side * 0.0107, 0.037, z], palette.green);
    box(group, [0.0008, 0.011, 0.018], [side * 0.0109, 0.037, -0.023], palette.glass);
    box(group, [0.0015, 0.0013, 0.022], [side * 0.0109, 0.0435, -0.023], palette.brass);
  }
  box(group, [0.022, 0.0015, 0.002], [0, 0.0437, -0.034], palette.green);
  box(group, [0.029, 0.0032, 0.029], [0, 0.0462, -0.023], palette.iron, 0.0013);
  alongZ(cylinder(group, 0.0032, 0.0032, 0.0042, [0, 0.034, 0.034], palette.iron, 16));
  alongZ(cylinder(group, 0.0025, 0.0025, 0.0005, [0, 0.034, 0.0364], palette.lampGlass, 16));
  box(group, [0.023, 0.003, 0.002], [0, 0.016, -0.035], palette.wheel);
  return compactGroup(group);
}

function carriage(palette: Palette, freight: boolean): THREE.Group {
  const group = new THREE.Group();
  box(group, [0.024, 0.003, 0.046], [0, 0.017, 0], palette.iron, 0.0004);
  box(group, [0.023, 0.002, 0.044], [0, 0.020, 0], palette.wagon);
  if (!freight) {
    box(group, [0.022, 0.016, 0.041], [0, 0.029, 0], palette.wagonBlue, 0.0006);
    for (const side of [-1, 1]) {
      for (let index = 0; index < 4; index += 1) {
        const z = -0.015 + index * 0.010;
        box(group, [0.0008, 0.007, 0.0065], [side * 0.0114, 0.031, z], palette.glass);
        box(group, [0.0013, 0.0008, 0.008], [side * 0.0116, 0.0269, z], palette.trim);
      }
      box(group, [0.001, 0.001, 0.041], [side * 0.0114, 0.022, 0], palette.brass);
    }
    box(group, [0.027, 0.0034, 0.047], [0, 0.039, 0], palette.roofDark, 0.0015);
    for (const end of [-1, 1]) {
      box(group, [0.006, 0.012, 0.001], [0, 0.028, end * 0.021], palette.darkWood);
      box(group, [0.005, 0.005, 0.0012], [0, 0.032, end * 0.0213], palette.glass);
    }
  } else {
    for (const side of [-1, 1]) {
      for (let plank = 0; plank < 3; plank += 1) box(group, [0.0015, 0.0028, 0.043], [side * 0.011, 0.023 + plank * 0.003, 0], palette.wagon);
      for (const z of [-0.019, 0, 0.019]) box(group, [0.0015, 0.011, 0.0012], [side * 0.012, 0.025, z], palette.iron);
      box(group, [0.022, 0.010, 0.0015], [0, 0.025, side * 0.021], palette.wagon);
    }
    for (let log = 0; log < 5; log += 1) {
      const x = (log % 3 - 1) * 0.006;
      const y = log < 3 ? 0.026 : 0.031;
      alongZ(cylinder(group, 0.0028, 0.0031, 0.033, [x, y, 0], palette.bark, 9));
      alongZ(cylinder(group, 0.0023, 0.0025, 0.0004, [x, y, 0.0168], palette.cream, 9));
    }
  }
  for (const z of [-0.014, 0.014]) alongX(cylinder(group, 0.0012, 0.0012, 0.018, [0, RAIL_TOP + WHEEL_RADIUS, z], palette.iron, 9));
  return compactGroup(group);
}

function wheelPrefab(palette: Palette): THREE.Group {
  const group = new THREE.Group();
  alongX(cylinder(group, WHEEL_RADIUS, WHEEL_RADIUS, 0.0018, [0, 0, 0], palette.steel, 20));
  alongX(cylinder(group, WHEEL_RADIUS * 0.85, WHEEL_RADIUS * 0.85, 0.0021, [0, 0, 0], palette.wheel, 20));
  for (let spoke = 0; spoke < 8; spoke += 1) {
    const rib = box(group, [0.00225, 0.0095, 0.00055], [0, 0, 0], palette.wheel);
    rib.rotation.x = spoke * Math.PI / 8;
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
  private readonly steam: THREE.Points;
  private readonly transforms = Array.from({ length: 3 }, () => new THREE.Matrix4());
  private readonly transform = new THREE.Object3D();
  private readonly worldMatrix = new THREE.Matrix4();
  private readonly point = new THREE.Vector3();
  private lastUpdate = "";

  constructor(palette: Palette) {
    this.group.name = "train";
    this.bodies = [locomotive(palette), carriage(palette, false), carriage(palette, true)];
    this.bodies.forEach(body => this.group.add(body));
    const prefab = wheelPrefab(palette);
    this.wheels = prefab.children.map(child => {
      const source = child as THREE.Mesh<THREE.BufferGeometry, THREE.Material>;
      const mesh = new THREE.InstancedMesh(source.geometry, source.material, 14);
      mesh.castShadow = true; mesh.receiveShadow = true;
      this.group.add(mesh); return mesh;
    });
    this.rods = [-1, 1].map(() => {
      const rod = new THREE.Mesh(new THREE.BoxGeometry(0.0012, 0.0016, 0.037), palette.steel);
      rod.castShadow = true; this.group.add(rod); return rod;
    });
    this.couplers = [0, 1].map(() => {
      const coupler = new THREE.Mesh(new THREE.CylinderGeometry(0.0011, 0.0011, 1, 8), palette.iron);
      this.group.add(coupler); return coupler;
    });
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(new Float32Array(16 * 3), 3));
    const material = new THREE.PointsMaterial({ map: steamTexture(), color: 0xf2eee4, size: 0.018, transparent: true, opacity: 0.35, depthWrite: false, sizeAttenuation: true });
    this.steam = new THREE.Points(geometry, material);
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
        this.transform.rotation.set(phase + (side < 0 ? Math.PI / 2 : 0), 0, 0);
        this.transform.scale.setScalar(1);
        this.transform.updateMatrix();
        this.worldMatrix.multiplyMatrices(body.matrix, this.transform.matrix);
        this.wheels.forEach(mesh => mesh.setMatrixAt(wheelIndex, this.worldMatrix));
        wheelIndex += 1;
      }
    }
    this.wheels.forEach(mesh => { mesh.instanceMatrix.needsUpdate = true; mesh.computeBoundingSphere(); });
    this.rods.forEach((rod, index) => {
      const side = index === 0 ? -1 : 1, angle = phase + (side < 0 ? Math.PI / 2 : 0);
      this.transform.position.set(side * 0.0109, RAIL_TOP + WHEEL_RADIUS + Math.cos(angle) * 0.0022, Math.sin(angle) * 0.0022);
      this.transform.rotation.set(0, 0, 0);
      this.transform.updateMatrix();
      rod.matrixAutoUpdate = false;
      rod.matrix.multiplyMatrices(this.transforms[0]!, this.transform.matrix);
    });
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
        const sample = sampleOval(document.track, document.train.distance - document.train.direction * document.train.speed * age);
        positions.setXYZ(index, sample.position.x + Math.sin(index * 1.77 + age) * age * 0.004, 0.051 + age * 0.021, sample.position.z + 0.01 * age);
      }
      positions.needsUpdate = true;
    }
  }
}
