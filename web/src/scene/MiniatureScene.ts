import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { resolutionScale } from "../clock";
import { sampleOval } from "../model/index";
import type { LayoutDocument } from "../model/index";
import { compactGroup, loopLength, makeTerrain, RAIL_HEAD_WIDTH, RAIL_OFFSET, RAIL_TOP, rectangularRail, sweepProfile, terrainHeight, visualRandom } from "./geometry";
import type { Track } from "./geometry";
import { createPalette, labelTexture } from "./materials";
import { createPrefabs, createStation, instantiateScenery } from "./scenery";
import { TrainRig } from "./train";
import { CASE_DIMENSIONS, createDisplayCase, openCasePose } from "./caseGeometry";
import { createPondGroup, createPondMaterials, depressPondTerrain } from "./pondGeometry";
import { FixedStationPlacement } from "./stationPlacement";

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
  private environmentTarget: THREE.WebGLRenderTarget | null = null;
  private readonly restoreEnvironment = (): void => { this.rebuildEnvironment(); };
  private readonly lid: THREE.Group;
  private readonly station: FixedStationPlacement;
  private readonly pondMaterials = createPondMaterials(this.palette);
  private pond = new THREE.Group();
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
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.scene.background = new THREE.Color(0xd3c7b2);
    this.scene.fog = new THREE.Fog(0xd3c7b2, 3, 9);
    this.rebuildEnvironment();
    this.scene.environmentIntensity = 0.55;
    // Render-target pixels cannot be uploaded from a CPU image after WebGL context loss.
    // The renderer registered its own restore listener first, so its new context is ready here.
    canvas.addEventListener("webglcontextrestored", this.restoreEnvironment);

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
    table.position.y = CASE_DIMENSIONS.tableY;
    table.receiveShadow = true;
    this.scene.add(table);
    this.lid = this.createCase();
    this.station = new FixedStationPlacement(createStation(this.palette));
    this.scene.add(this.station.object);
    this.terrain = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.5), this.palette.grass);
    this.terrain.name = "terrain";
    this.terrain.receiveShadow = true;
    this.scene.add(this.terrain, this.track, this.scenery, this.pond);
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

  private rebuildEnvironment(): void {
    if (this.disposed) return;
    this.scene.environment = null;
    this.environmentTarget?.dispose();
    const room = new RoomEnvironment();
    const generator = new THREE.PMREMGenerator(this.renderer);
    try {
      this.environmentTarget = generator.fromScene(room, 0.05);
      this.scene.environment = this.environmentTarget.texture;
    } finally {
      generator.dispose();
      room.dispose();
    }
  }

  private createCase(): THREE.Group {
    const { base, lid } = createDisplayCase(this.palette);
    this.scene.add(compactGroup(base));
    const plaque = new THREE.Mesh(new THREE.PlaneGeometry(0.37, 0.0925), new THREE.MeshStandardMaterial({ map: labelTexture("TIN JUNCTION", "A LITTLE WORLD, YOUR OWN", true), roughness: 0.68 }));
    plaque.rotation.x = -Math.PI / 2;
    plaque.position.set(0, -CASE_DIMENSIONS.lidCavity + 0.0016, CASE_DIMENSIONS.lidRear - CASE_DIMENSIONS.depth / 2);
    lid.add(plaque); compactGroup(lid); this.scene.add(lid); return lid;
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
      // A supported custom oval must never pass through fixed decoration.
      // Saved scenery, station geometry and authored transforms are untouched.
      this.station.update(document.track);
      this.disposeGroupGeometry(this.track);
      this.scene.remove(this.track);
      this.track = this.createTrack(document.track);
      this.scene.add(this.track);
      this.disposeGroupGeometry(this.pond);
      this.scene.remove(this.pond);
      this.pond = createPondGroup(document.track, this.palette, this.pondMaterials);
      this.scene.add(this.pond);
      this.terrain.geometry.dispose();
      this.terrain.geometry = makeTerrain(document.track);
      depressPondTerrain(this.terrain.geometry, document.track);
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
    this.controls.target.y = THREE.MathUtils.clamp(this.controls.target.y, -0.08, 0.18);
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
    const target = view === "trackside" ? new THREE.Vector3(0, 0.022, 0.045) : view === "overview" ? new THREE.Vector3(0, 0.025, 0.01) : new THREE.Vector3(0, 0.025, -0.035);
    // Overview presents the complete railway board. The matching full lid
    // continues above the frame, as it would in a close product photograph.
    const offset = view === "top" ? new THREE.Vector3(0.001, 1.1, 0.002) : view === "trackside" ? new THREE.Vector3(0.34, 0.23, 0.42) : new THREE.Vector3(0.62, 0.76, 0.78);
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

  /** Open-only presentation; geometry checks do not grant actual Duo fold approval. */
  setHingeAngle(degrees: number | null): void {
    this.lid.rotation.x = openCasePose(degrees);
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
    this.canvas.removeEventListener("webglcontextrestored", this.restoreEnvironment);
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
    for (const material of Object.values(this.pondMaterials)) materials.add(material);
    materials.forEach(material => {
      for (const value of Object.values(material)) if (value instanceof THREE.Texture) textures.add(value);
      material.dispose();
    });
    geometries.forEach(geometry => geometry.dispose()); textures.forEach(texture => texture.dispose());
    this.keyLight.shadow.map?.dispose();
    this.scene.environment = null;
    this.environmentTarget?.dispose();
    this.environmentTarget = null;
    this.renderer.dispose();
  }
}
