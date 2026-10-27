import * as THREE from "three";
import type { LayoutDocument } from "../model/index";
import { SCENERY_FOOTPRINT } from "../model/index";
import { box, compactGroup, cylinder, terrainHeight, visualRandom } from "./geometry";
import type { Palette } from "./materials";
import { clockTexture, labelTexture } from "./materials";
import { createCanopyGeometry, createFirBoughGeometry } from "./canopyGeometry";
import { createCottageArchitecture, createStationArchitecture } from "./architectureGeometry";
export { createGableGeometry } from "./architectureGeometry";

type Kind = LayoutDocument["scenery"][number]["kind"];
export type Prefab = { geometry: THREE.BufferGeometry; material: THREE.Material }[];

function sphere(group: THREE.Group, radius: number, position: [number, number, number], material: THREE.Material, scale: [number, number, number] = [1, 1, 1]): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 12, 8), material);
  mesh.position.set(...position); mesh.scale.set(...scale);
  group.add(mesh); return mesh;
}

function branch(group: THREE.Group, start: THREE.Vector3, end: THREE.Vector3, radius: number, material: THREE.Material): void {
  const direction = end.clone().sub(start);
  const center = start.clone().add(end).multiplyScalar(0.5);
  const mesh = cylinder(group, radius * 0.32, radius, direction.length(), [center.x, center.y, center.z], material, 5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
}

function foliage(group: THREE.Group, seed: number, position: THREE.Vector3, scale: [number, number, number], angle: number, material: THREE.Material, form: "cluster" | "bough" = "cluster"): void {
  const mesh = new THREE.Mesh(form === "bough" ? createFirBoughGeometry(seed) : createCanopyGeometry(seed), material);
  mesh.position.copy(position); mesh.scale.set(...scale); mesh.rotation.y = angle;
  group.add(mesh);
}

function tree(kind: "fir" | "oak", palette: Palette): THREE.Group {
  const group = new THREE.Group();
  const random = visualRandom(kind === "fir" ? 6539 : 9721);
  cylinder(group, kind === "fir" ? 0.00028 : 0.0005, kind === "fir" ? 0.0012 : 0.0021, 0.059, [0, 0.0295, 0], palette.bark, 9);
  if (kind === "fir") {
    // Staggered boughs overlap into a conifer silhouette, with irregular edges
    // and real branch connections instead of smooth stacked cone shells.
    const boughCounts = [5, 5, 4, 4, 3, 3, 2, 2];
    for (let level = 0; level < boughCounts.length; level += 1) {
      const count = boughCounts[level]!, y = 0.013 + level * 0.0062;
      for (let bough = 0; bough < count; bough += 1) {
        const angle = bough / count * Math.PI * 2 + level * 2.39 + random() * 0.27;
        // Author inside the validated 10 mm radius. Building an oversize crown
        // and relying on footprint scaling would turn its lobes into tall beads.
        const reach = (0.0078 - level * 0.00074) * (0.94 + random() * 0.12);
        const direction = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));
        const tip = direction.clone().multiplyScalar(reach * 0.91); tip.y = y - 0.0012;
        if (level < 6) branch(group, new THREE.Vector3(0, y + 0.001, 0), tip, 0.00045 - level * 0.00004, palette.bark);
        const center = direction.multiplyScalar(reach * 0.44); center.y = y + (random() - 0.5) * 0.0015;
        foliage(group, 80 + level * 23 + bough * 73, center,
          [reach * 0.73, 0.0057 - level * 0.00015, reach * 0.48], -angle,
          (bough + level * 2) % 7 === 0 ? palette.pineLight : palette.pine, "bough");
      }
    }
    const crown = new THREE.Mesh(createFirBoughGeometry(773), palette.pine);
    crown.scale.set(0.0045, 0.0021, 0.0018); crown.rotation.z = Math.PI / 2;
    crown.position.y = 0.061; group.add(crown);
  } else {
    for (let limb = 0; limb < 8; limb += 1) {
      const angle = limb * 2.4, reach = 0.009 + random() * 0.003;
      const fork = new THREE.Vector3(Math.cos(angle) * reach * 0.65, 0.034 + limb % 3 * 0.006, Math.sin(angle) * reach * 0.65);
      branch(group, new THREE.Vector3(0, 0.022 + limb % 2 * 0.004, 0), fork, 0.0011, palette.bark);
      for (let twig = 0; twig < 3; twig += 1) {
        const direction = angle + (twig - 1) * 0.79;
        const tip = fork.clone().add(new THREE.Vector3(Math.cos(direction) * 0.0054, 0.007 + random() * 0.006, Math.sin(direction) * 0.0054));
        branch(group, fork, tip, 0.00055, palette.bark);
        foliage(group, 147 + limb * 67 + twig * 29, tip,
          [0.0065 + random() * 0.0017, 0.0065 + random() * 0.002, 0.0065 + random() * 0.0017], direction,
          (limb + twig) % 3 === 0 ? palette.pineLight : palette.leaf);
      }
    }
  }
  return compactGroup(group);
}

function house(palette: Palette): THREE.Group {
  return compactGroup(createCottageArchitecture(palette));
}

function lamp(palette: Palette): THREE.Group {
  const group = new THREE.Group();
  cylinder(group, 0.0013, 0.0021, 0.035, [0, 0.0175, 0], palette.iron, 12);
  cylinder(group, 0.0033, 0.0042, 0.002, [0, 0.001, 0], palette.iron, 12);
  box(group, [0.006, 0.008, 0.006], [0, 0.039, 0], palette.lampGlass, 0.0007);
  cylinder(group, 0.0005, 0.0045, 0.0035, [0, 0.0445, 0], palette.iron, 4);
  for (const x of [-0.0028, 0.0028]) for (const z of [-0.0028, 0.0028]) box(group, [0.0005, 0.009, 0.0005], [x, 0.039, z], palette.iron);
  return compactGroup(group);
}

function bench(palette: Palette): THREE.Group {
  const group = new THREE.Group();
  for (let slat = 0; slat < 3; slat += 1) box(group, [0.021, 0.0011, 0.0019], [0, 0.0078, (slat - 1) * 0.0023], palette.wagon);
  for (let slat = 0; slat < 3; slat += 1) box(group, [0.021, 0.0018, 0.0011], [0, 0.010 + slat * 0.0023, -0.003], palette.wagon);
  for (const x of [-0.008, 0.008]) {
    box(group, [0.001, 0.014, 0.001], [x, 0.007, -0.003], palette.iron);
    box(group, [0.001, 0.008, 0.001], [x, 0.004, 0.0028], palette.iron);
  }
  return compactGroup(group);
}

export function createPrefabs(palette: Palette): Record<Kind, Prefab> {
  const rock = new THREE.Group();
  sphere(rock, 0.012, [0, 0.008, 0], palette.rock, [1.3, 0.8, 0.9]);
  sphere(rock, 0.006, [0.009, 0.004, 0.006], palette.rock, [1.1, 0.8, 1.4]);
  const groups: Record<Kind, THREE.Group> = { fir: tree("fir", palette), oak: tree("oak", palette), house: house(palette), lamp: lamp(palette), bench: bench(palette), rock: compactGroup(rock) };
  return Object.fromEntries(Object.entries(groups).map(([kind, group]) => {
    const parts = group.children.map(child => {
      const mesh = child as THREE.Mesh<THREE.BufferGeometry, THREE.Material>;
      return { geometry: mesh.geometry, material: mesh.material };
    });
    let radius = 0;
    for (const part of parts) {
      const positions = part.geometry.getAttribute("position");
      for (let index = 0; index < positions.count; index += 1) radius = Math.max(radius, Math.hypot(positions.getX(index), positions.getZ(index)));
    }
    const factor = Math.min(1, SCENERY_FOOTPRINT[kind as Kind] / Math.max(radius, 0.0001));
    for (const part of parts) part.geometry.scale(factor, 1, factor);
    return [kind, parts];
  })) as Record<Kind, Prefab>;
}

export function instantiateScenery(document: LayoutDocument, prefabs: Record<Kind, Prefab>): THREE.Group {
  const group = new THREE.Group();
  const transform = new THREE.Object3D();
  for (const kind of Object.keys(prefabs) as Kind[]) {
    const objects = document.scenery.filter(item => item.kind === kind);
    if (objects.length === 0) continue;
    for (const component of prefabs[kind]) {
      const mesh = new THREE.InstancedMesh(component.geometry, component.material, objects.length);
      mesh.userData.entityIds = objects.map(item => item.id);
      for (let index = 0; index < objects.length; index += 1) {
        const item = objects[index]!;
        transform.position.set(item.x, terrainHeight(item.x, item.z, document.track), item.z);
        transform.rotation.set(0, item.rotation, 0);
        transform.scale.setScalar(item.scale);
        transform.updateMatrix();
        mesh.setMatrixAt(index, transform.matrix);
      }
      mesh.instanceMatrix.needsUpdate = true;
      mesh.computeBoundingSphere();
      mesh.castShadow = true; mesh.receiveShadow = true;
      group.add(mesh);
    }
  }
  return group;
}

export function createStation(palette: Palette): THREE.Group {
  const group = createStationArchitecture(palette);
  const stationSign = new THREE.Mesh(new THREE.PlaneGeometry(0.039, 0.007), new THREE.MeshStandardMaterial({ map: labelTexture("TIN JUNCTION", "ALPINE LINE", true), roughness: 0.72 }));
  // Fit between the windows and below the projecting eaves. A shallow backing
  // makes the enamel sign read as mounted hardware instead of painted plaster.
  box(group, [0.040, 0.0078, 0.0008], [-0.037, 0.0336, -0.0632], palette.darkWood);
  stationSign.position.set(-0.037, 0.0336, -0.06275);
  group.add(stationSign);
  const clockMount = cylinder(group, 0.0035, 0.0035, 0.0005, [0.00795, 0.0385, -0.081], palette.green, 24);
  clockMount.rotation.z = -Math.PI / 2;
  const clock = new THREE.Mesh(new THREE.CircleGeometry(0.0033, 24), new THREE.MeshStandardMaterial({ map: clockTexture(), roughness: 0.7 }));
  clock.position.set(0.00825, 0.0385, -0.081); clock.rotation.y = Math.PI / 2;
  group.add(clock);
  const station = compactGroup(group);
  station.name = "station";
  station.scale.x = 0.88; // All fixed architecture fits the same reserved rectangle as the validators.
  return station;
}
