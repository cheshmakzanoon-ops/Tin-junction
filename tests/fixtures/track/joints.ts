import * as THREE from "three";
import { alignModuleSocket, connectorsCompatible, generateTrackModule, SLEEPER } from "../../../web/src/track/module";
import type { TrackModule } from "../../../web/src/track/module";
import type { CenterlineDefinition } from "../../../web/src/track/centerline";

const fixtures: { title: string; a: CenterlineDefinition; b: CenterlineDefinition; macro: boolean }[] = [
  { title: "Straight → right curve · overview", a: { kind: "straight", length: 0.06 }, b: { kind: "arc", radius: 0.1, sweep: Math.PI / 4 }, macro: false },
  { title: "Straight → right curve · rail-height close-up", a: { kind: "straight", length: 0.06 }, b: { kind: "arc", radius: 0.1, sweep: Math.PI / 4 }, macro: true },
  { title: "Right → left curve · overview", a: { kind: "arc", radius: 0.1, sweep: Math.PI / 4 }, b: { kind: "arc", radius: 0.1, sweep: -Math.PI / 4 }, macro: false },
  { title: "Right → left curve · rail-height close-up", a: { kind: "arc", radius: 0.1, sweep: Math.PI / 4 }, b: { kind: "arc", radius: 0.1, sweep: -Math.PI / 4 }, macro: true },
];
const results: { title: string; compatible: boolean; triangles: number }[] = [];
for (const fixture of fixtures) {
  const section = document.createElement("section"), heading = document.createElement("h2");
  heading.textContent = fixture.title; section.append(heading); document.querySelector("#views")!.append(section);
  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  renderer.setSize(600, 360); renderer.setPixelRatio(1); renderer.setClearColor(0x283337); renderer.outputColorSpace = THREE.SRGBColorSpace;
  section.append(renderer.domElement);
  const scene = new THREE.Scene(); scene.add(new THREE.HemisphereLight(0xf0f6ff, 0x413324, 2.2));
  const light = new THREE.DirectionalLight(0xffe4bf, 3.1); light.position.set(-0.4, 0.6, -0.3); scene.add(light);
  const a = generateTrackModule("fixture-a", fixture.a, undefined, { capExit: false });
  const pose = alignModuleSocket(fixture.b, "entrance", a.connectors[1]);
  const b = generateTrackModule("fixture-b", fixture.b, pose, { capEntrance: false, routeOffset: a.length });
  const metal = new THREE.MeshStandardMaterial({ color: 0x84959b, roughness: 0.28, metalness: 0.4 });
  const wood = new THREE.MeshStandardMaterial({ color: 0x544033, roughness: 0.9 });
  for (const module of [a, b]) addModule(module);
  function addModule(module: TrackModule): void {
    for (const rail of module.rails) {
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.Float32BufferAttribute(rail.positions, 3));
      geometry.setAttribute("normal", new THREE.Float32BufferAttribute(rail.normals, 3)); geometry.setIndex([...rail.indices]);
      scene.add(new THREE.Mesh(geometry, metal));
    }
    const geometry = new THREE.BoxGeometry(SLEEPER.length, SLEEPER.height, SLEEPER.width);
    for (const sleeper of module.sleepers) {
      const mesh = new THREE.Mesh(geometry, wood); mesh.position.set(sleeper.position.x, sleeper.position.y, sleeper.position.z); mesh.rotation.y = sleeper.yaw; scene.add(mesh);
    }
  }
  const seam = a.connectors[1].position, view = fixture.macro ? 0.021 : 0.095;
  const camera = new THREE.OrthographicCamera(-view * 600 / 360, view * 600 / 360, view, -view, 0.001, 2);
  camera.position.set(seam.x + (fixture.macro ? 0.055 : 0.13), fixture.macro ? 0.025 : 0.14, seam.z - (fixture.macro ? 0.052 : 0.15));
  camera.lookAt(seam.x, 0.002, seam.z); renderer.render(scene, camera);
  const caption = document.createElement("small"); caption.textContent = "Seam centered. Single-sided rail material; connected caps omitted explicitly. Gauge 16.5 mm."; section.append(caption);
  results.push({ title: fixture.title, compatible: connectorsCompatible(a.connectors[1], b.connectors[0]), triangles: renderer.info.render.triangles });
}
Object.assign(window, { __TRACK_FIXTURE__: results });
