import * as THREE from "three";
import { RoutedMotion } from "../../../web/src/simulation/routedMotion";
import { solveRoutedPoses } from "../../../web/src/simulation/routedPoses";
import type { RoutedVehiclePose } from "../../../web/src/simulation/routedPoses";
import { consistFootprint, DEFAULT_VEHICLES, VEHICLE_CATALOG, VEHICLE_CONSTRAINTS } from "../../../web/src/simulation/vehicleCatalog";
import { buildTurnoutTopology, turnoutOwner } from "../../../web/src/track/turnout";
import { generateTrackModule, RAIL_PROFILE, SLEEPER } from "../../../web/src/track/module";
import { createPalette } from "../../../web/src/scene/materials";
import { wheelPrefab } from "../../../web/src/scene/train";
import { minimumTurnoutFixture, sCurveVehicleFixture, vehicleCircleFixture } from "./vehicle-fixtures";

interface Diagnostic {
  id: string; tick: number; direction: number; vehicleIds: string[]; axleEdges: string[];
  maximumWheelContactError: number; missedRailContacts: number; maximumWheelbaseError: number;
  maximumCouplerGapError: number; maximumCouplerAngleDegrees: number; calls: number; triangles: number;
  camera: { position: number[]; target: number[]; quaternion: number[]; left: number; right: number; top: number; bottom: number; near: number; far: number };
  rendering: { width: number; height: number; pixelRatio: number; antialias: boolean; colorSpace: string; toneMapping: string; exposure: number; shadows: boolean };
}
const palette = createPalette(), prefab = wheelPrefab(palette), results: Diagnostic[] = [];
const roadbedHeight = VEHICLE_CONSTRAINTS.railTop - (SLEEPER.height + RAIL_PROFILE.footHeight + RAIL_PROFILE.webHeight + RAIL_PROFILE.headHeight);
const point = (value: { x: number; y: number; z: number }) => new THREE.Vector3(value.x, value.y, value.z);

function createMotion(input: unknown, edgeId: string, throttle: number, ticks: number): RoutedMotion {
  const topology = buildTurnoutTopology(input); if (!topology.ok) throw new Error(JSON.stringify(topology.diagnostics));
  const placed = RoutedMotion.place(topology.value, { trainId: "inspection-train", length: consistFootprint(DEFAULT_VEHICLES), rear: { edgeId, distance: 0.01 } });
  if (!placed.ok) throw new Error(placed.message);
  placed.motion.setThrottle(throttle);
  for (let tick = 0; tick < ticks; tick++) placed.motion.step();
  return placed.motion;
}
function solve(motion: RoutedMotion): readonly RoutedVehiclePose[] {
  const result = solveRoutedPoses(motion, DEFAULT_VEHICLES); if (!result.ok) throw new Error(result.message); return result.poses;
}
function addLink(scene: THREE.Scene, a: THREE.Vector3, b: THREE.Vector3, radius: number, material: THREE.Material): void {
  const direction = b.clone().sub(a), mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, direction.length(), 10), material);
  mesh.position.copy(a).add(b).multiplyScalar(0.5); mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize()); scene.add(mesh);
}
function show(id: string, title: string, caption: string, motion: RoutedMotion, poses: readonly RoutedVehiclePose[], macro = false): void {
  const figure = document.createElement("figure"), heading = document.createElement("h2"), description = document.createElement("figcaption"), metrics = document.createElement("div");
  figure.id = id; heading.textContent = title; description.textContent = caption; metrics.className = "metrics";
  figure.append(heading); document.querySelector("#views")!.append(figure);
  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  renderer.setSize(620, 350); renderer.setPixelRatio(1); renderer.setClearColor(0x223039); renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.3; figure.append(renderer.domElement, description, metrics);
  const scene = new THREE.Scene(), rails: THREE.Mesh[] = [], trainBounds = new THREE.Box3();
  scene.add(new THREE.HemisphereLight(0xf3f7fa, 0x4a3c2f, 3));
  const light = new THREE.DirectionalLight(0xffe8cd, 4); light.position.set(-0.25, 0.6, -0.4); scene.add(light);
  const activeRail = new THREE.MeshStandardMaterial({ color: 0xb1b8b1, metalness: 0.6, roughness: 0.33 });
  const inactiveRail = new THREE.MeshStandardMaterial({ color: 0x526169, metalness: 0.1, roughness: 0.85, transparent: true, opacity: 0.45 });
  const sleepers = new THREE.MeshStandardMaterial({ color: 0x77604a, roughness: 1 });
  for (const piece of motion.network.graph.pieces) {
    const owner = turnoutOwner(motion.network, `${piece.id}/forward`), active = !owner || piece.id === `${owner}:route:${motion.network.selections.find(item => item.turnoutId === owner)!.route}`;
    const module = generateTrackModule(piece.id, piece.centerline, { ...piece.pose, y: piece.pose.y + roadbedHeight }, { capEntrance: false, capExit: false });
    for (const rail of module.rails) {
      const geometry = new THREE.BufferGeometry(); geometry.setAttribute("position", new THREE.Float32BufferAttribute(rail.positions, 3));
      geometry.setAttribute("normal", new THREE.Float32BufferAttribute(rail.normals, 3)); geometry.setIndex([...rail.indices]);
      const mesh = new THREE.Mesh(geometry, active ? activeRail : inactiveRail); scene.add(mesh); if (active) rails.push(mesh);
    }
    if (active) {
      const mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(SLEEPER.length, SLEEPER.height, SLEEPER.width), sleepers, module.sleepers.length), matrix = new THREE.Object3D();
      module.sleepers.forEach((sleeper, index) => { matrix.position.copy(point(sleeper.position)); matrix.rotation.y = sleeper.yaw; matrix.updateMatrix(); mesh.setMatrixAt(index, matrix.matrix); });
      scene.add(mesh);
    }
  }
  const bodyColors = [0x81cfa5, 0x89bdd7, 0xe3be76], gold = new THREE.MeshStandardMaterial({ color: 0xe4be6c, metalness: 0.45, roughness: 0.4 });
  for (const [index, pose] of poses.entries()) {
    const definition = VEHICLE_CATALOG[pose.catalogId], width = definition.halfWidthMicrometres * 2 / 1e6, length = definition.bodyLengthMicrometres / 1e6, height = definition.heightMicrometres / 1e6;
    const body = new THREE.Group(); body.position.copy(point(pose.position)); body.rotation.y = pose.yaw;
    const envelope = new THREE.BoxGeometry(width, height - 0.015, length), outline = new THREE.LineSegments(new THREE.EdgesGeometry(envelope), new THREE.LineBasicMaterial({ color: bodyColors[index] }));
    outline.position.y = (height + 0.015) / 2; body.add(outline);
    const shell = new THREE.Mesh(envelope, new THREE.MeshStandardMaterial({ color: bodyColors[index], roughness: 0.9, transparent: true, opacity: macro ? 0.035 : 0.10, depthWrite: false }));
    shell.position.copy(outline.position); body.add(shell);
    const chassis = new THREE.Mesh(new THREE.BoxGeometry(width * 0.7, 0.002, length * 0.9), palette.iron); chassis.position.y = 0.016; body.add(chassis); scene.add(body);
    for (const axle of pose.axles) {
      const yaw = Math.atan2(axle.tangent.x, axle.tangent.z), frame = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
      for (const [side, center] of [[-1, axle.leftWheel], [1, axle.rightWheel]] as const) {
        const wheel = prefab.clone(true); wheel.position.copy(point(center));
        wheel.quaternion.setFromEuler(new THREE.Euler(axle.wheelPhase + (side < 0 ? Math.PI / 2 : 0), side < 0 ? Math.PI : 0, 0)); wheel.quaternion.premultiply(frame); scene.add(wheel);
      }
      addLink(scene, point(axle.leftWheel), point(axle.rightWheel), 0.0008, palette.iron);
    }
    addLink(scene, point(pose.frontCouplerAttachment), point(pose.frontCoupler), 0.00065, gold);
    addLink(scene, point(pose.rearCouplerAttachment), point(pose.rearCoupler), 0.00065, gold);
    if (index > 0) addLink(scene, point(poses[index - 1]!.rearCoupler), point(pose.frontCoupler), 0.00085, gold);
    trainBounds.expandByPoint(point(pose.frontCoupler)); trainBounds.expandByPoint(point(pose.rearCoupler));
  }
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.MeshStandardMaterial({ color: 0x36444a, roughness: 1 })); ground.rotation.x = -Math.PI / 2; ground.position.y = -0.0001; scene.add(ground);
  const target = macro ? point(poses[0]!.axles[0]!.center) : trainBounds.getCenter(new THREE.Vector3());
  const size = trainBounds.getSize(new THREE.Vector3()), view = macro ? 0.021 : Math.max(size.x, size.z, 0.1) * 0.55 + 0.015;
  const camera = new THREE.OrthographicCamera(-view * 620 / 350, view * 620 / 350, view, -view, 0.001, 3);
  if (macro) {
    const tangent = poses[0]!.axles[0]!.tangent, right = new THREE.Vector3(tangent.z, 0, -tangent.x);
    camera.position.copy(target).addScaledVector(right, 0.075).add(new THREE.Vector3(-tangent.x * 0.035, 0.028, -tangent.z * 0.035));
  } else camera.position.copy(target).add(new THREE.Vector3(0.24, 0.30, -0.32));
  camera.lookAt(target); scene.updateMatrixWorld(true); renderer.render(scene, camera);
  let contactError = 0, missed = 0, wheelbaseError = 0, couplingError = 0, angle = 0;
  const ray = new THREE.Raycaster();
  for (const [index, pose] of poses.entries()) {
    wheelbaseError = Math.max(wheelbaseError, Math.abs(point(pose.frontPivot).distanceTo(point(pose.rearPivot)) - VEHICLE_CATALOG[pose.catalogId].wheelbaseMicrometres / 1e6));
    if (index > 0) couplingError = Math.max(couplingError, Math.abs(point(poses[index - 1]!.rearCoupler).distanceTo(point(pose.frontCoupler)) - 0.006));
    angle = Math.max(angle, pose.frontCouplerAngle, pose.rearCouplerAngle);
    for (const axle of pose.axles) for (const wheel of [axle.leftWheel, axle.rightWheel]) {
      ray.set(new THREE.Vector3(wheel.x, wheel.y + 0.01, wheel.z), new THREE.Vector3(0, -1, 0));
      const hit = ray.intersectObjects(rails, false)[0];
      if (!hit) missed++; else contactError = Math.max(contactError, Math.abs(wheel.y - axle.wheelRadius - hit.point.y));
    }
  }
  const result = { id, tick: motion.tickCount, direction: motion.direction, vehicleIds: poses.map(pose => pose.id), axleEdges: poses.flatMap(pose => pose.axles.map(axle => axle.routeCursor.edgeId)),
    maximumWheelContactError: contactError, missedRailContacts: missed, maximumWheelbaseError: wheelbaseError, maximumCouplerGapError: couplingError,
    maximumCouplerAngleDegrees: angle * 180 / Math.PI, calls: renderer.info.render.calls, triangles: renderer.info.render.triangles,
    camera: { position: camera.position.toArray(), target: target.toArray(), quaternion: camera.quaternion.toArray(), left: camera.left, right: camera.right, top: camera.top, bottom: camera.bottom, near: camera.near, far: camera.far },
    rendering: { width: 620, height: 350, pixelRatio: 1, antialias: true, colorSpace: "sRGB", toneMapping: "ACESFilmic", exposure: 1.3, shadows: false } };
  results.push(result);
  metrics.textContent = `Contact error ${(contactError * 1e6).toFixed(3)} µm · ${missed} missed contacts · coupling max ${(angle * 180 / Math.PI).toFixed(1)}° / 60°`;
}

const circle = createMotion(vehicleCircleFixture(), "curve-0/forward", 0.55, 120), circlePoses = solve(circle);
show("minimum-curve", "01 · Minimum-radius curve — 100 mm", "Rigid body chords preserve the authored wheelbase. Each axle gets its own rail frame; the two rail contact points remain on the actual generated rail heads.", circle, circlePoses);
show("wheel-contact", "02 · Wheel and rail contact — macro", "The original hollow tyre and inward flange are shown at inspection scale. The rail generator is offset by the explicit 3.7 mm roadbed height.", circle, circlePoses, true);
const sCurve = createMotion(sCurveVehicleFixture(), "part-0/forward", 0.4, 110);
show("s-transition", "03 · S curve — authored 80 mm transition", "The carriages keep their physical lengths. Pivoting coupler stems preserve a 6 mm central link and reject angles above 60°; an immediate reverse curve is unsupported.", sCurve, solve(sCurve));
const turnout = createMotion(minimumTurnoutFixture(), "approach/forward", 0, 0);
if (!turnout.selectTurnout("points", "diverging").ok) throw new Error("Turnout fixture cannot switch.");
turnout.setThrottle(0.5);
let passage: readonly RoutedVehiclePose[] | null = null;
for (let tick = 0; tick < 400; tick++) {
  turnout.step(); const poses = solve(turnout);
  if (poses[0]!.axles.every(axle => axle.routeCursor.edgeId === "branch/forward") && poses.slice(1).some(pose => pose.axles.some(axle => axle.routeCursor.edgeId === "points:route:diverging/forward"))) { passage = poses; break; }
}
if (!passage) throw new Error("Trailing turnout passage was not reached.");
show("turnout-passage", "04 · Locomotive clear, trailing cars protected", "The locomotive has entered the branch while a following axle remains on the selected turnout. A conflicting switch request is still rejected by full-consist occupancy.", turnout, passage);
const switchBlocked = turnout.selectTurnout("points", "straight").code === "turnout-occupied";
circle.stop(); for (let tick = 0; tick < 120; tick++) circle.step();
const before = solve(circle);
show("before-reversal", "05 · Stopped before reversal", "The same physical engine, coach and wagon remain in canonical order. Signed wheel travel and all body/socket poses are preserved at the stop.", circle, before);
if (!circle.reverse().ok) throw new Error("Stopped reversal failed.");
const after = solve(circle);
show("after-reversal", "06 · Reversed control direction", "Only travel direction changes. This image should match the preceding stopped pose: vehicles do not rotate 180°, reorder, or jump to another route.", circle, after);
const reversalError = Math.max(...before.flatMap((pose, index) => [point(pose.position).distanceTo(point(after[index]!.position)), point(pose.frontCoupler).distanceTo(point(after[index]!.frontCoupler)), point(pose.rearCoupler).distanceTo(point(after[index]!.rearCoupler))]));
Object.assign(window, { __VEHICLE_FIXTURE__: { environment: "Desktop Chromium / software rendering; engineering body envelopes, not production art or device evidence", roadbedHeight, switchBlocked, reversalError,
  lighting: { hemisphere: { sky: "#f3f7fa", ground: "#4a3c2f", intensity: 3 }, directional: { color: "#ffe8cd", intensity: 4, position: [-0.25, 0.6, -0.4] }, effects: "No shadows, depth of field, bloom, weather or post-processing" }, results } });
