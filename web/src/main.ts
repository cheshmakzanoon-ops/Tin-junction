import * as THREE from "three";
import { createOutgoingBridge, parseNativeMessage } from "./bridge";
import { FixedStepClock, RenderLifecycle, resolutionScale } from "./clock";
import type { WebMessage } from "./bridge";
import "./style.css";

type Diagnostics = {
  renderer: "starting" | "webgl2" | "unavailable";
  frameCount: number;
  rejectedMessages: number;
  nativeMessages: number;
  lifecycle: "running" | "paused" | "disposed";
  contextLosses: number;
  width: number;
  height: number;
  drawingBufferWidth: number;
  drawingBufferHeight: number;
  initialized: boolean;
};
declare global {
  interface Window {
    webkit?: { messageHandlers?: { tinJunction?: { postMessage: (message: WebMessage) => void } } };
    TinJunction?: { receiveNative: (message: unknown) => void };
    __TIN_DIAGNOSTICS__?: Diagnostics;
  }
}

const diagnostics: Diagnostics = {
  renderer: "starting", frameCount: 0, rejectedMessages: 0, nativeMessages: 0,
  lifecycle: "paused", contextLosses: 0, width: 0, height: 0,
  drawingBufferWidth: 0, drawingBufferHeight: 0, initialized: false,
};
window.__TIN_DIAGNOSTICS__ = diagnostics;
const post = createOutgoingBridge((message) => {
  try { window.webkit?.messageHandlers?.tinJunction?.postMessage(message); }
  catch { document.getElementById("status")!.textContent = "Native bridge unavailable; diagnostic scene retained."; }
});

function start(): void {
  const canvas = document.querySelector<HTMLCanvasElement>("#world");
  const status = document.querySelector<HTMLElement>("#status");
  const metrics = document.querySelector<HTMLElement>("#metrics");
  if (!canvas || !status || !metrics) throw new Error("Required harness elements are missing");
  const context = canvas.getContext("webgl2", { antialias: true, alpha: false });
  if (!context) {
    diagnostics.renderer = "unavailable";
    status.textContent = "WebGL2 unavailable. A supported packaged-app runtime is required.";
    post("engine.error", { code: "webgl2_unavailable", recoverable: false });
    return;
  }

  const renderer = new THREE.WebGLRenderer({ canvas, context, antialias: true, alpha: false });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x151b20);
  const camera = new THREE.PerspectiveCamera(38, 1, 0.01, 10);
  camera.position.set(0.85, 0.8, 0.95);
  camera.lookAt(0, 0, 0);

  // Deliberately simple procedural calibration objects, not approved game assets.
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.035, 0.6), new THREE.MeshStandardMaterial({ color: 0x394c41, roughness: 0.8 }));
  base.position.y = -0.02;
  base.receiveShadow = true;
  scene.add(base);
  const railMaterial = new THREE.MeshStandardMaterial({ color: 0xb1b9bd, roughness: 0.35, metalness: 0.85 });
  for (const radius of [0.177, 0.193]) {
    const rail = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.0025, 8, 80), railMaterial);
    rail.rotation.x = -Math.PI / 2;
    rail.scale.x = 1.7;
    rail.position.y = 0.003;
    rail.castShadow = true;
    scene.add(rail);
  }
  const marker = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.027, 0.022), new THREE.MeshStandardMaterial({ color: 0xd7be7b, roughness: 0.45, metalness: 0.1 }));
  marker.position.set(0.31, 0.022, 0);
  marker.castShadow = true;
  scene.add(marker);
  const light = new THREE.DirectionalLight(0xfff1d5, 3.2);
  light.position.set(-0.5, 1.2, 0.8);
  light.castShadow = true;
  light.shadow.mapSize.set(1024, 1024);
  light.shadow.camera.left = -0.7;
  light.shadow.camera.right = 0.7;
  light.shadow.camera.top = 0.7;
  light.shadow.camera.bottom = -0.7;
  light.shadow.camera.near = 0.1;
  light.shadow.camera.far = 4;
  light.shadow.normalBias = 0.001;
  scene.add(light, new THREE.HemisphereLight(0xdbeaff, 0x263128, 1.8));

  const lifecycle = new RenderLifecycle();
  lifecycle.documentVisible = !document.hidden;
  const clock = new FixedStepClock();
  const capture = new URLSearchParams(window.location.search).get("capture") === "1";
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let scheduledFrame = 0;
  let ticks = 0;
  let lastMetrics = -Infinity;
  let sentReady = false;
  const drawingBuffer = new THREE.Vector2();

  function resize(): void {
    if (lifecycle.disposed) return;
    const bounds = canvas!.getBoundingClientRect();
    const width = Math.max(1, bounds.width);
    const height = Math.max(1, bounds.height);
    // Actual CSS container size is authoritative. Native points are NOT multiplied a second time.
    renderer.setPixelRatio(resolutionScale(width, height, window.devicePixelRatio || 1));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    diagnostics.width = width;
    diagnostics.height = height;
    renderer.getDrawingBufferSize(drawingBuffer);
    diagnostics.drawingBufferWidth = drawingBuffer.x;
    diagnostics.drawingBufferHeight = drawingBuffer.y;
  }

  function updateSchedule(): void {
    if (scheduledFrame) { cancelAnimationFrame(scheduledFrame); scheduledFrame = 0; }
    clock.reset();
    diagnostics.lifecycle = lifecycle.disposed ? "disposed" : lifecycle.running ? "running" : "paused";
    status!.textContent = lifecycle.running ? "WebGL2 running · native integration not yet certified" : "Paused by lifecycle or context state";
    if (lifecycle.running) scheduledFrame = requestAnimationFrame(frame);
  }

  function frame(timestamp: number): void {
    scheduledFrame = 0;
    if (!lifecycle.running) return;
    const { steps } = clock.advance(timestamp);
    ticks += steps;
    if (!capture && !reducedMotion.matches) marker.rotation.y = ticks * clock.stepSeconds * 0.2;
    renderer.render(scene, camera);
    diagnostics.frameCount += 1;
    diagnostics.initialized = true;
    if (!sentReady) {
      post("web.ready", { build: "engineering-harness", protocolVersion: 1, renderer: "webgl2" });
      sentReady = true;
    }
    if (timestamp - lastMetrics >= 2_000) {
      lastMetrics = timestamp;
      metrics!.textContent = `${Math.round(diagnostics.width)} × ${Math.round(diagnostics.height)} CSS pixels · ${renderer.info.render.calls} draw calls · frame ${diagnostics.frameCount}`;
      post("engine.metrics", { frames: diagnostics.frameCount, drawCalls: renderer.info.render.calls, triangles: renderer.info.render.triangles, evidenceKind: "diagnostic-only" });
    }
    scheduledFrame = requestAnimationFrame(frame);
  }

  window.TinJunction = { receiveNative: (input) => {
    if (lifecycle.disposed) return;
    const message = parseNativeMessage(input);
    if (!message) { diagnostics.rejectedMessages += 1; return; }
    diagnostics.nativeMessages += 1;
    switch (message.type) {
      case "native.lifecycle":
        lifecycle.nativeActive = message.payload.state === "active";
        updateSchedule();
        break;
      case "native.viewport":
        // Reserved regions/pose are recorded by future layout tasks. Never infer physical hinge geometry here.
        resize();
        break;
      case "native.bootstrap":
        break;
    }
  } };
  function visibility(): void { lifecycle.documentVisible = !document.hidden; updateSchedule(); }
  function lost(event: Event): void {
    event.preventDefault();
    lifecycle.contextAvailable = false;
    diagnostics.contextLosses += 1;
    updateSchedule();
    post("engine.error", { code: "webgl_context_lost", recoverable: true });
  }
  function restored(): void {
    lifecycle.contextAvailable = true;
    resize();
    updateSchedule();
  }
  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  document.addEventListener("visibilitychange", visibility);
  canvas.addEventListener("webglcontextlost", lost);
  canvas.addEventListener("webglcontextrestored", restored);
  window.addEventListener("pagehide", () => {
    lifecycle.disposed = true;
    updateSchedule();
    observer.disconnect();
    document.removeEventListener("visibilitychange", visibility);
    canvas.removeEventListener("webglcontextlost", lost);
    canvas.removeEventListener("webglcontextrestored", restored);
    const geometries = new Set<THREE.BufferGeometry>();
    const materials = new Set<THREE.Material>();
    scene.traverse((item) => {
      if (!(item instanceof THREE.Mesh)) return;
      geometries.add(item.geometry);
      for (const material of Array.isArray(item.material) ? item.material : [item.material]) materials.add(material);
    });
    geometries.forEach((geometry) => geometry.dispose());
    materials.forEach((material) => material.dispose());
    light.shadow.map?.dispose();
    renderer.dispose();
    delete window.TinJunction;
  }, { once: true });
  diagnostics.renderer = "webgl2";
  resize();
  updateSchedule();
}

try { start(); }
catch (error) {
  diagnostics.renderer = "unavailable";
  const status = document.getElementById("status");
  if (status) status.textContent = "Renderer initialization failed. See diagnostic logs.";
  post("engine.error", { code: "renderer_initialization_failed", recoverable: false });
  console.error(error);
}
