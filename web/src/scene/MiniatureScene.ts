import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { resolutionScale } from "../clock";
import { sampleOval } from "../model/index";
import type { LayoutDocument } from "../model/index";
import { box, compactGroup, cylinder, loopLength, makeTerrain, RAIL_HEAD_WIDTH, RAIL_OFFSET, RAIL_TOP, rectangularRail, sweepProfile, terrainHeight, visualRandom } from "./geometry";
import type { Track } from "./geometry";
import { createPalette, labelTexture } from "./materials";
import { createPrefabs, createStation, instantiateScenery } from "./scenery";
import { TrainRig } from "./train";

export type CameraView = "overview" | "trackside" | "top";
export type SceneDimensions = { width: number; height: number; drawingBufferWidth: number; drawingBufferHeight: number };

/** Original procedural development art. No production-art or physical-device performance approval is implied. */
export class MiniatureScene {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.PerspectiveCamera(34, 1, 0.003, 12);
  readonly controls: OrbitControls;
  private readonly palette = createPalette();
  private readonly prefabs = createPrefabs(this.palette);
  private readonly raycaster = new THREE.Raycaster();
  private readonly coordinates = new THREE.Vector2();
  private readonly drawingBuffer = new THREE.Vector2();
  private readonly keyLight = new THREE.DirectionalLight(0xfff0d7, 3.5);
  private readonly fillLight = new THREE.HemisphereLight(0xc6d8e7, 0x786b4e, 2.1);
  private readonly lanternLights = [new THREE.PointLight(0xffba68, 0, 0.14, 2), new THREE.PointLight(0xffba68, 0, 0.14, 2)];
  private readonly environmentTarget: THREE.WebGLRenderTarget;
  private readonly lid = new THREE.Group();
  private readonly train: TrainRig;
  private readonly terrain: THREE.Mesh;
  private readonly selection: THREE.Mesh;
  private scenery = new THREE.Group();
  private track = new THREE.Group();
  private currentDocument: LayoutDocument | null = null;
  private trackKey = "";
  private lastRevision = -1;
  private documentId = "";
  private timeOfDay = "";
  private selectedId: string | null = null;
  private fitScale = 1;
  private view: CameraView = "overview";
  private disposed = false;

  constructor(private readonly canvas: HTMLCanvasElement) {
    const context = canvas.getContext("webgl2", { antialias: true, alpha: false });
    if (!context) throw new Error("WebGL2 is unavailable");
    this.renderer = new THREE.WebGLRenderer({ canvas, context, antialias: true, alpha: false });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.06;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.scene.background = new THREE.Color(0xd3c7b2);
    this.scene.fog = new THREE.Fog(0xd3c7b2, 3, 9);
    const room = new RoomEnvironment();
    const generator = new THREE.PMREMGenerator(this.renderer);
    this.environmentTarget = generator.fromScene(room, 0.05);
    this.scene.environment = this.environmentTarget.texture;
    this.scene.environmentIntensity = 0.55;
    generator.dispose(); room.dispose();

    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    this.controls.dampingFactor = 0.085;
    this.controls.minDistance = 0.26;
    this.controls.maxDistance = 3.1;
    this.controls.minPolarAngle = 0.035;
    this.controls.maxPolarAngle = 1.32;
    this.controls.rotateSpeed = 0.65;
    this.controls.zoomSpeed = 0.7;
    this.controls.panSpeed = 0.45;
    this.controls.screenSpacePanning = false;

    this.keyLight.position.set(-0.5, 1.15, 0.72);
    this.keyLight.castShadow = true;
    this.keyLight.shadow.mapSize.set(2048, 2048);
    Object.assign(this.keyLight.shadow.camera, { left: -0.7, right: 0.7, top: 0.7, bottom: -0.7, near: 0.1, far: 3 });
    this.keyLight.shadow.normalBias = 0.00025;
    this.keyLight.shadow.bias = -0.00006;
    this.keyLight.shadow.camera.updateProjectionMatrix();
    this.scene.add(this.keyLight, this.fillLight, this.keyLight.target);
    this.scene.add(...this.lanternLights);

    const table = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), this.palette.table);
    table.rotation.x = -Math.PI / 2;
    table.position.y = -0.056;
    table.receiveShadow = true;
    this.scene.add(table);
    this.createCase();
    this.scene.add(createStation(this.palette));
    this.createPond();
    this.terrain = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.5), this.palette.grass);
    this.terrain.name = "terrain";
    this.terrain.receiveShadow = true;
    this.scene.add(this.terrain, this.track, this.scenery);
    this.train = new TrainRig(this.palette);
    this.scene.add(this.train.group);
    this.selection = new THREE.Mesh(
      new THREE.TorusGeometry(0.024, 0.0007, 8, 64),
      new THREE.MeshBasicMaterial({ color: 0xf8ca68, transparent: true, opacity: 0.9, depthWrite: false }),
    );
    this.selection.rotation.x = -Math.PI / 2;
    this.selection.visible = false;
    this.scene.add(this.selection);
    this.resize();
    this.setView("overview");
  }

  private createCase(): void {
    const group = new THREE.Group();
    group.name = "case";
    box(group, [0.846, 0.040, 0.546], [0, -0.025, 0], this.palette.walnut, 0.009);
    box(group, [0.811, 0.009, 0.510], [0, -0.008, 0], this.palette.felt, 0.002);
    for (const side of [-1, 1]) {
      box(group, [0.018, 0.042, 0.542], [side * 0.414, -0.005, 0], this.palette.walnut, 0.002);
      box(group, [0.815, 0.042, 0.018], [0, -0.005, side * 0.264], this.palette.walnut, 0.002);
      box(group, [0.002, 0.0014, 0.524], [side * 0.405, 0.0163, 0], this.palette.brass);
      box(group, [0.812, 0.0014, 0.002], [0, 0.0163, side * 0.255], this.palette.brass);
      for (const end of [-1, 1]) {
        cylinder(group, 0.014, 0.017, 0.009, [side * 0.344, -0.049, end * 0.204], this.palette.felt, 16);
        box(group, [0.033, 0.0015, 0.025], [side * 0.403, 0.017, end * 0.257], this.palette.brass, 0.002);
        cylinder(group, 0.0018, 0.0018, 0.0009, [side * 0.398, 0.018, end * 0.254], this.palette.darkBrass, 12);
      }
      box(group, [0.023, 0.022, 0.0025], [side * 0.245, -0.012, 0.274], this.palette.darkBrass, 0.002);
      box(group, [0.014, 0.013, 0.004], [side * 0.245, -0.011, 0.277], this.palette.brass, 0.002);
      cylinder(group, 0.0016, 0.0016, 0.018, [side * 0.245, -0.012, 0.281], this.palette.brass, 10).rotation.z = Math.PI / 2;
    }
    for (const x of [-0.29, 0, 0.29]) {
      cylinder(group, 0.0045, 0.0045, 0.054, [x, 0.014, -0.274], this.palette.brass, 16).rotation.z = Math.PI / 2;
      box(group, [0.052, 0.0015, 0.021], [x, 0.017, -0.257], this.palette.brass);
    }
    const handle = new THREE.Mesh(new THREE.TorusGeometry(0.024, 0.0032, 10, 30, Math.PI), this.palette.darkWood);
    handle.rotation.z = Math.PI;
    handle.scale.x = 2.5;
    handle.position.set(0, -0.014, 0.288);
    group.add(handle);
    for (const side of [-1, 1]) box(group, [0.011, 0.013, 0.010], [side * 0.059, -0.013, 0.278], this.palette.brass, 0.001);
    this.scene.add(compactGroup(group));

    this.lid.position.set(0, 0.014, -0.274);
    this.lid.name = "case-lid";
    box(this.lid, [0.844, 0.018, 0.274], [0, 0, -0.137], this.palette.walnut, 0.006);
    box(this.lid, [0.799, 0.002, 0.234], [0, 0.010, -0.137], this.palette.felt, 0.004);
    for (const side of [-1, 1]) {
      box(this.lid, [0.0016, 0.0014, 0.235], [side * 0.398, 0.0115, -0.137], this.palette.brass);
      box(this.lid, [0.799, 0.0014, 0.0016], [0, 0.0115, -0.137 + side * 0.117], this.palette.brass);
    }
    const plaque = new THREE.Mesh(new THREE.PlaneGeometry(0.37, 0.0925), new THREE.MeshStandardMaterial({ map: labelTexture("TIN JUNCTION", "A LITTLE WORLD, YOUR OWN", true), roughness: 0.68 }));
    plaque.rotation.x = -Math.PI / 2;
    plaque.position.set(0, 0.0119, -0.142);
    this.lid.add(plaque);
    compactGroup(this.lid);
    this.lid.rotation.x = 1.04;
    this.scene.add(this.lid);
  }

  private createPond(): void {
    const pond = new THREE.Group();
    pond.name = "pond";
    const water = new THREE.Mesh(new THREE.CircleGeometry(0.035, 48), this.palette.water);
    water.rotation.x = -Math.PI / 2;
    water.scale.set(1.23, 0.71, 1);
    water.position.set(0.205, 0.0019, 0.066);
    water.receiveShadow = true;
    pond.add(water);
    const random = visualRandom(711);
    for (let index = 0; index < 40; index += 1) {
      const angle = index / 40 * Math.PI * 2;
      const rock = new THREE.Mesh(new THREE.SphereGeometry(0.0028 + random() * 0.001, 8, 5), this.palette.rock);
      rock.position.set(0.205 + Math.cos(angle) * 0.043, 0.0012, 0.066 + Math.sin(angle) * 0.026);
      rock.scale.set(1, 0.65, 1);
      pond.add(rock);
    }
    for (let index = 0; index < 10; index += 1) {
      const x = 0.18 + random() * 0.014, z = 0.085 + random() * 0.006;
      cylinder(pond, 0.0002, 0.0003, 0.007 + random() * 0.004, [x, 0.004, z], this.palette.pine, 5);
    }
    this.scene.add(compactGroup(pond));
  }

  private createTrack(track: Track): THREE.Group {
    const group = new THREE.Group();
    const ballast = new THREE.Mesh(sweepProfile(track, [[-0.021, 0.0005], [0.021, 0.0005], [0.014, 0.0026], [-0.014, 0.0026]]), this.palette.ballast);
    ballast.receiveShadow = true; group.add(ballast);
    const rails = new THREE.Group();
    for (const side of [-1, 1]) {
      const offset = side * RAIL_OFFSET;
      for (const [width, bottom, top] of [[0.0025, 0.0034, 0.0040], [0.0007, 0.0040, 0.0063]]) {
        const mesh = new THREE.Mesh(rectangularRail(track, offset, width!, bottom!, top!), this.palette.railSide);
        rails.add(mesh);
      }
      rails.add(new THREE.Mesh(rectangularRail(track, offset, RAIL_HEAD_WIDTH, 0.0063, RAIL_TOP), this.palette.steel));
    }
    group.add(compactGroup(rails));
    const length = loopLength(track), count = Math.ceil(length / 0.009);
    const sleepers = new THREE.InstancedMesh(new THREE.BoxGeometry(0.029, 0.0018, 0.0037), this.palette.sleepers, count);
    const pins = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.0005, 0.0005, 0.0004, 6), this.palette.iron, count * 2);
    const transform = new THREE.Object3D(), random = visualRandom(8192), color = new THREE.Color();
    for (let index = 0; index < count; index += 1) {
      const point = sampleOval(track, length * index / count);
      transform.position.set(point.position.x, 0.0025, point.position.z);
      transform.rotation.set(0, point.yaw, 0);
      transform.updateMatrix(); sleepers.setMatrixAt(index, transform.matrix);
      color.setScalar(0.73 + random() * 0.42); sleepers.setColorAt(index, color);
      for (let side = 0; side < 2; side += 1) {
        const offset = side === 0 ? -0.0111 : 0.0111;
        transform.position.set(point.position.x + point.tangent.z * offset, 0.0036, point.position.z - point.tangent.x * offset);
        transform.updateMatrix(); pins.setMatrixAt(index * 2 + side, transform.matrix);
      }
    }
    sleepers.castShadow = true; sleepers.receiveShadow = true;
    pins.castShadow = false;
    group.add(sleepers, pins);
    const gravel = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 6, 4), this.palette.gravel, 950);
    for (let index = 0; index < gravel.count; index += 1) {
      const point = sampleOval(track, random() * length), side = random() < 0.5 ? -1 : 1;
      const offset = side * (0.0145 + random() * 0.006), size = 0.00035 + random() * 0.0005;
      transform.position.set(point.position.x + point.tangent.z * offset, 0.0014 + size / 2, point.position.z - point.tangent.x * offset);
      transform.rotation.set(random(), random(), random());
      transform.scale.set(size * 1.1, size * 0.7, size);
      transform.updateMatrix(); gravel.setMatrixAt(index, transform.matrix);
      color.setScalar(0.72 + random() * 0.44); gravel.setColorAt(index, color);
    }
    gravel.receiveShadow = true; group.add(gravel);
    return group;
  }

  update(document: LayoutDocument): void {
    if (this.disposed) return;
    const key = document.track.straightLength + ":" + document.track.radius;
    const trackChanged = key !== this.trackKey;
    if (trackChanged) {
      this.disposeGroupGeometry(this.track);
      this.scene.remove(this.track);
      this.track = this.createTrack(document.track);
      this.scene.add(this.track);
      this.terrain.geometry.dispose();
      this.terrain.geometry = makeTerrain(document.track);
      this.trackKey = key;
    }
    if (trackChanged || document.documentId !== this.documentId || document.revision !== this.lastRevision) {
      this.scenery.traverse(object => { if (object instanceof THREE.InstancedMesh) object.dispose(); });
      this.scene.remove(this.scenery);
      this.scenery = instantiateScenery(document, this.prefabs);
      this.scene.add(this.scenery);
      this.lastRevision = document.revision; this.documentId = document.documentId;
    }
    this.currentDocument = document;
    const lamps = document.scenery.filter(item => item.kind === "lamp");
    this.lanternLights.forEach((light, index) => {
      const item = lamps[index];
      light.visible = Boolean(item);
      if (item) light.position.set(item.x, terrainHeight(item.x, item.z, document.track) + 0.039 * item.scale, item.z);
    });
    this.train.update(document);
    if (document.environment.timeOfDay !== this.timeOfDay) this.setLighting(document.environment.timeOfDay);
    this.updateSelection();
  }

  private setLighting(time: LayoutDocument["environment"]["timeOfDay"]): void {
    this.timeOfDay = time;
    const night = time === "night", dusk = time === "dusk";
    this.keyLight.color.set(night ? 0xadc9ed : dusk ? 0xffbf76 : 0xfff0d7);
    this.keyLight.intensity = night ? 0.75 : dusk ? 2.4 : 3.5;
    this.keyLight.position.set(dusk ? -0.9 : -0.5, dusk ? 0.5 : 1.15, 0.72);
    this.fillLight.color.set(night ? 0x7896c3 : dusk ? 0x9caccb : 0xc6d8e7);
    this.fillLight.intensity = night ? 0.9 : dusk ? 1.45 : 2.1;
    this.scene.environmentIntensity = night ? 0.28 : dusk ? 0.42 : 0.55;
    this.palette.glass.emissiveIntensity = night ? 2.6 : dusk ? 1.4 : 0.05;
    this.palette.lampGlass.emissiveIntensity = night ? 4.0 : dusk ? 2.2 : 0.18;
    this.lanternLights.forEach(light => { light.intensity = night ? 0.006 : dusk ? 0.0025 : 0; });
    this.palette.table.color.set(night ? 0x434a55 : dusk ? 0xa99988 : 0xd3c7b2);
    const background = new THREE.Color(night ? 0x343d4b : dusk ? 0xad9e91 : 0xd3c7b2);
    this.scene.background = background;
    if (this.scene.fog instanceof THREE.Fog) this.scene.fog.color.copy(background);
    this.renderer.toneMappingExposure = night ? 1.08 : 1.06;
  }

  render(_deltaSeconds = 0): void {
    if (this.disposed) return;
    this.controls.target.x = THREE.MathUtils.clamp(this.controls.target.x, -0.30, 0.30);
    this.controls.target.y = THREE.MathUtils.clamp(this.controls.target.y, -0.08, 0.10);
    this.controls.target.z = THREE.MathUtils.clamp(this.controls.target.z, -0.20, 0.20);
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  resize(): SceneDimensions {
    const bounds = this.canvas.getBoundingClientRect();
    const width = Math.max(1, bounds.width), height = Math.max(1, bounds.height);
    this.renderer.setPixelRatio(resolutionScale(width, height, window.devicePixelRatio || 1));
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    // Compose the physical object above the operating desk, retaining correct ray picking.
    this.camera.setViewOffset(width, height, 0, Math.min(55, height * 0.07), width, height);
    this.camera.updateProjectionMatrix();
    const nextFit = Math.max(1.38, 1.55 / this.camera.aspect);
    if (Math.abs(this.fitScale - nextFit) > 0.001) {
      const ratio = nextFit / this.fitScale;
      this.camera.position.sub(this.controls.target).multiplyScalar(ratio).add(this.controls.target);
      this.fitScale = nextFit;
      this.controls.maxDistance = 3.1 * nextFit;
    }
    this.renderer.getDrawingBufferSize(this.drawingBuffer);
    return { width, height, drawingBufferWidth: this.drawingBuffer.x, drawingBufferHeight: this.drawingBuffer.y };
  }

  setView(view: CameraView): void {
    this.view = view;
    const target = view === "trackside" ? new THREE.Vector3(0, 0.022, 0.045) : new THREE.Vector3(0, 0.025, -0.035);
    const offset = view === "top" ? new THREE.Vector3(0.001, 1.1, 0.002) : view === "trackside" ? new THREE.Vector3(0.34, 0.23, 0.42) : new THREE.Vector3(0.62, 0.62, 0.86);
    this.controls.target.copy(target);
    this.camera.position.copy(offset.multiplyScalar(this.fitScale).add(target));
    this.controls.update();
  }

  get cameraView(): CameraView { return this.view; }
  setControlsEnabled(enabled: boolean): void { this.controls.enabled = enabled; }

  private ray(clientX: number, clientY: number): void {
    const bounds = this.canvas.getBoundingClientRect();
    this.coordinates.set((clientX - bounds.left) / Math.max(1, bounds.width) * 2 - 1, -(clientY - bounds.top) / Math.max(1, bounds.height) * 2 + 1);
    this.raycaster.setFromCamera(this.coordinates, this.camera);
  }

  pickBoard(clientX: number, clientY: number): { x: number; z: number } | null {
    this.ray(clientX, clientY);
    const hit = this.raycaster.intersectObject(this.terrain, false)[0];
    return hit ? { x: hit.point.x, z: hit.point.z } : null;
  }

  pickScenery(clientX: number, clientY: number): string | null {
    this.ray(clientX, clientY);
    const hit = this.raycaster.intersectObject(this.scenery, true)[0];
    if (!hit || hit.instanceId === undefined) return null;
    const ids: unknown = hit.object.userData.entityIds;
    return Array.isArray(ids) && typeof ids[hit.instanceId] === "string" ? ids[hit.instanceId] as string : null;
  }

  setSelected(id: string | null): void { this.selectedId = id; this.updateSelection(); }
  private updateSelection(): void {
    const item = this.currentDocument?.scenery.find(value => value.id === this.selectedId);
    this.selection.visible = Boolean(item);
    if (!item || !this.currentDocument) return;
    this.selection.position.set(item.x, terrainHeight(item.x, item.z, this.currentDocument.track) + 0.002, item.z);
    this.selection.scale.setScalar(item.scale * (item.kind === "house" ? 1.35 : item.kind === "lamp" ? 0.55 : 1));
  }

  /** Decorative lid only; this does not claim physical fold ergonomics or alter track topology. */
  setHingeAngle(degrees: number | null): void {
    this.lid.rotation.x = degrees === null || !Number.isFinite(degrees) ? 1.04 : THREE.MathUtils.clamp((180 - degrees) * Math.PI / 180, 0.32, 1.18);
  }

  private disposeGroupGeometry(group: THREE.Group): void {
    const geometries = new Set<THREE.BufferGeometry>();
    group.traverse(object => {
      if (object instanceof THREE.Mesh || object instanceof THREE.Points) geometries.add(object.geometry);
      if (object instanceof THREE.InstancedMesh) object.dispose();
    });
    geometries.forEach(geometry => geometry.dispose());
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.controls.dispose();
    const geometries = new Set<THREE.BufferGeometry>(), materials = new Set<THREE.Material>(), textures = new Set<THREE.Texture>();
    this.scene.traverse(object => {
      if (object instanceof THREE.Mesh || object instanceof THREE.Points) {
        geometries.add(object.geometry);
        for (const material of Array.isArray(object.material) ? object.material : [object.material]) materials.add(material);
      }
      if (object instanceof THREE.InstancedMesh) object.dispose();
    });
    for (const prefab of Object.values(this.prefabs)) for (const part of prefab) geometries.add(part.geometry);
    for (const material of Object.values(this.palette)) materials.add(material);
    materials.forEach(material => {
      for (const value of Object.values(material)) if (value instanceof THREE.Texture) textures.add(value);
      material.dispose();
    });
    geometries.forEach(geometry => geometry.dispose()); textures.forEach(texture => texture.dispose());
    this.keyLight.shadow.map?.dispose();
    this.environmentTarget.dispose();
    this.renderer.dispose();
  }
}
