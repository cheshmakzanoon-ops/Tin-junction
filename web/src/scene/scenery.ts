import * as THREE from "three";
import type { LayoutDocument } from "../model/index";
import { SCENERY_FOOTPRINT } from "../model/index";
import { box, compactGroup, cylinder, terrainHeight } from "./geometry";
import type { Palette } from "./materials";
import { clockTexture, labelTexture } from "./materials";

type Kind = LayoutDocument["scenery"][number]["kind"];
export type Prefab = { geometry: THREE.BufferGeometry; material: THREE.Material }[];

function sphere(group: THREE.Group, radius: number, position: [number, number, number], material: THREE.Material, scale: [number, number, number] = [1, 1, 1]): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 12, 8), material);
  mesh.position.set(...position); mesh.scale.set(...scale);
  group.add(mesh); return mesh;
}

function tree(kind: "fir" | "oak", palette: Palette): THREE.Group {
  const group = new THREE.Group();
  cylinder(group, 0.0013, 0.0025, 0.052, [0, 0.026, 0], palette.bark, 9);
  if (kind === "fir") {
    for (let level = 0; level < 5; level += 1) {
      const canopy = new THREE.Mesh(new THREE.ConeGeometry(0.017 - level * 0.0025, 0.024 - level * 0.0025, 14), level % 2 === 0 ? palette.pine : palette.pineLight);
      canopy.position.set(Math.sin(level * 2.1) * 0.0008, 0.022 + level * 0.0088, 0);
      canopy.rotation.y = level * 0.93;
      canopy.scale.set(1, 1, 0.9);
      group.add(canopy);
    }
    for (let branch = 0; branch < 9; branch += 1) {
      const angle = branch * 2.4;
      sphere(group, 0.004, [Math.cos(angle) * 0.012, 0.02 + (branch % 3) * 0.009, Math.sin(angle) * 0.012], palette.pine, [1, 0.8, 1]);
    }
  } else {
    for (let branch = 0; branch < 8; branch += 1) {
      const angle = branch * 2.4;
      const reach = branch === 0 ? 0 : 0.013;
      sphere(group, 0.0125, [Math.cos(angle) * reach, 0.041 + (branch % 3) * 0.007, Math.sin(angle) * reach], branch % 2 === 0 ? palette.leaf : palette.pineLight, [1, 0.9, 1]);
    }
    for (const side of [-1, 1]) {
      const branch = cylinder(group, 0.0008, 0.0012, 0.024, [side * 0.004, 0.031, 0], palette.bark, 8);
      branch.rotation.z = side * -0.42;
    }
  }
  return compactGroup(group);
}

function house(palette: Palette): THREE.Group {
  const group = new THREE.Group();
  box(group, [0.043, 0.003, 0.038], [0, 0.0015, 0], palette.rock);
  box(group, [0.038, 0.032, 0.033], [0, 0.019, 0], palette.plaster, 0.0006);
  for (const side of [-1, 1]) {
    const roof = box(group, [0.0275, 0.0024, 0.043], [side * 0.0114, 0.0446, 0], palette.roof, 0.0004);
    roof.rotation.z = -side * 0.72;
    for (let row = 0; row < 6; row += 1) {
      const rib = cylinder(group, 0.00055, 0.00055, 0.043, [side * (0.003 + row * 0.0037), 0.052 - row * 0.0032, 0], palette.roofDark, 7);
      rib.rotation.x = Math.PI / 2;
    }
    box(group, [0.040, 0.002, 0.0015], [0, 0.031, side * 0.0171], palette.darkWood);
    for (const x of [-0.0115, 0.0115]) {
      box(group, [0.008, 0.010, 0.001], [x, 0.023, side * 0.0171], palette.glass);
      box(group, [0.010, 0.0012, 0.0018], [x, 0.0175, side * 0.0177], palette.trim);
      box(group, [0.0008, 0.010, 0.0018], [x, 0.023, side * 0.0179], palette.trim);
      for (const shutter of [-1, 1]) box(group, [0.003, 0.010, 0.0012], [x + shutter * 0.006, 0.023, side * 0.0178], palette.green);
    }
  }
  box(group, [0.007, 0.015, 0.0015], [0, 0.0105, 0.0175], palette.darkWood);
  box(group, [0.009, 0.0015, 0.004], [0, 0.003, 0.020], palette.platform);
  box(group, [0.005, 0.016, 0.006], [0.010, 0.052, -0.007], palette.plasterDark);
  box(group, [0.007, 0.002, 0.008], [0.010, 0.061, -0.007], palette.rock);
  return compactGroup(group);
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
  const group = new THREE.Group();
  box(group, [0.203, 0.006, 0.030], [-0.025, 0.003, -0.115], palette.platform, 0.0015);
  for (let index = 0; index < 26; index += 1) box(group, [0.001, 0.0003, 0.027], [-0.122 + index * 0.0077, 0.0063, -0.115], palette.plasterDark);
  box(group, [0.093, 0.003, 0.039], [-0.037, 0.0075, -0.081], palette.rock);
  box(group, [0.088, 0.035, 0.034], [-0.037, 0.026, -0.081], palette.plaster, 0.0008);
  for (const side of [-1, 1]) {
    const roof = box(group, [0.104, 0.0025, 0.027], [-0.037, 0.052, -0.081 + side * 0.0115], palette.roof, 0.0005);
    roof.rotation.x = side * 0.61;
    for (let tile = 0; tile < 20; tile += 1) {
      const rib = box(group, [0.0008, 0.0006, 0.028], [-0.087 + tile * 0.0051, 0.0533, -0.081 + side * 0.0115], palette.roofDark);
      rib.rotation.x = side * 0.61;
    }
  }
  for (const x of [-0.066, -0.037, -0.008]) {
    box(group, [0.014, 0.018, 0.0012], [x, 0.027, -0.0988], palette.glass);
    for (const side of [-1, 1]) box(group, [0.0011, 0.020, 0.0019], [x + side * 0.0076, 0.027, -0.0992], palette.trim);
    box(group, [0.016, 0.0012, 0.0024], [x, 0.0172, -0.0992], palette.trim);
    box(group, [0.001, 0.018, 0.002], [x, 0.027, -0.0995], palette.trim);
  }
  box(group, [0.093, 0.0015, 0.018], [-0.037, 0.036, -0.109], palette.green);
  for (const x of [-0.079, 0.005]) cylinder(group, 0.001, 0.001, 0.029, [x, 0.0205, -0.115], palette.green, 10);
  const stationSign = new THREE.Mesh(new THREE.PlaneGeometry(0.049, 0.012), new THREE.MeshStandardMaterial({ map: labelTexture("TIN JUNCTION", "ALPINE LINE"), roughness: 0.72 }));
  stationSign.position.set(-0.037, 0.027, -0.0632);
  group.add(stationSign);
  const clock = new THREE.Mesh(new THREE.CircleGeometry(0.006, 24), new THREE.MeshStandardMaterial({ map: clockTexture(), roughness: 0.7 }));
  clock.position.set(-0.037, 0.045, -0.063);
  group.add(clock);
  box(group, [0.007, 0.024, 0.007], [-0.065, 0.056, -0.074], palette.plasterDark);
  box(group, [0.009, 0.002, 0.009], [-0.065, 0.069, -0.074], palette.rock);
  for (let index = 0; index < 3; index += 1) {
    box(group, [0.009, 0.008, 0.009], [0.031 + index * 0.011, 0.010, -0.117], palette.wagon, 0.0003);
    box(group, [0.0095, 0.0007, 0.0095], [0.031 + index * 0.011, 0.014, -0.117], palette.darkWood);
  }
  for (let index = 0; index < 17; index += 1) box(group, [0.0016, 0.013, 0.0016], [-0.126 + index * 0.012, 0.007, -0.058], palette.trim);
  for (const y of [0.0045, 0.0105]) box(group, [0.192, 0.0015, 0.001], [-0.030, y, -0.058], palette.trim);
  const station = compactGroup(group);
  station.name = "station";
  station.scale.x = 0.88; // All fixed architecture fits the same reserved rectangle as the validators.
  return station;
}
