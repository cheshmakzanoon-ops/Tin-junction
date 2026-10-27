import { Box3, Color, DirectionalLight, HemisphereLight, Mesh, MeshBasicMaterial, NearestFilter, NoToneMapping,
  OrthographicCamera, PerspectiveCamera, PlaneGeometry, Scene, SRGBColorSpace, Texture, Vector3, WebGLRenderer, WebGLRenderTarget } from "three";
import type { Material, Object3D } from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import "./assetProbe.css";

type ProbeName = "glb" | "texture" | "worker" | "wasm" | "ktx2" | "audio";
export interface AssetProbeResult { status: "pending" | "passed" | "blocked" | "failed"; detail: string }
export interface AssetProbeReport {
  formatVersion: 1; sessionId: string; documentURL: string; stage: "running" | "ready" | "complete"; webgl2: boolean;
  results: Record<ProbeName, AssetProbeResult>;
  observed: { meshCount: number; triangleCount: number; textureWidth: number; textureHeight: number;
    glbVisiblePixels: number; textureMatchedQuadrants: number; audioSampleRate: number; audioFrames: number; audioChannels: number;
    audioState: "unavailable" | AudioContextState | "interrupted"; wasmValue: number | null; workerMessage: string | null };
}
export interface AssetProbeHandle { dispose(): void }
export interface AssetProbeOptions { sessionId: string; report(payload: AssetProbeReport): void }
const names: readonly ProbeName[] = ["glb", "texture", "worker", "wasm", "ktx2", "audio"];
const colors = [[230, 60, 45], [60, 180, 95], [60, 100, 230], [238, 204, 70]] as const;
const detail = (error: unknown): string => String(error instanceof Error ? `${error.name}: ${error.message}` : error).slice(0, 300);

/** Isolated, explicit diagnostic surface. No durable layout or application scene is mutated. */
export function startAssetOriginProbe(options: AssetProbeOptions): AssetProbeHandle {
  if (!/^[A-Za-z0-9._:-]{1,128}$/.test(options.sessionId)) throw new Error("Invalid probe session");
  const abort = new AbortController(), timers = new Set<number>();
  let disposed = false, worker: Worker | null = null, renderer: WebGLRenderer | null = null;
  let context: AudioContext | null = null, audioBuffer: AudioBuffer | null = null, source: AudioBufferSourceNode | null = null;
  let target: WebGLRenderTarget | null = null, glbObject: Object3D | null = null, texture: Texture | null = null;
  const glbScene = new Scene(), textureScene = new Scene(), textureGeometry = new PlaneGeometry(2, 2);
  const textureMaterial = new MeshBasicMaterial({ toneMapped: false });
  const camera = new PerspectiveCamera(40, 1, 0.0001, 100);
  const textureCamera = new OrthographicCamera(-1, 1, 1, -1, 0, 2); textureCamera.position.z = 1;
  const report: AssetProbeReport = {
    formatVersion: 1, sessionId: options.sessionId, documentURL: location.href, stage: "running", webgl2: false,
    results: Object.fromEntries(names.map(name => [name, { status: "pending", detail: "Waiting for observed result." }])) as Record<ProbeName, AssetProbeResult>,
    observed: { meshCount: 0, triangleCount: 0, textureWidth: 0, textureHeight: 0, glbVisiblePixels: 0, textureMatchedQuadrants: 0,
      audioSampleRate: 0, audioFrames: 0, audioChannels: 0, audioState: "unavailable", wasmValue: null, workerMessage: null },
  };
  const panel = document.createElement("section"); panel.id = "asset-origin-probe-panel";
  panel.dataset.probe = "TinJunctionAssetOriginProbe"; panel.setAttribute("aria-label", "Bundled asset origin diagnostic");
  const heading = document.createElement("strong"); heading.textContent = "Bundled asset origin diagnostic";
  const canvas = document.createElement("canvas"); canvas.setAttribute("aria-label", "Actual bundled GLB and PNG rendering");
  const status = document.createElement("p"); status.setAttribute("role", "status");
  const play = document.createElement("button"); play.type = "button"; play.textContent = "Play probe tone"; play.disabled = true;
  panel.append(heading, canvas, status, play); document.body.append(panel);

  function publish(): void {
    if (disposed) return;
    status.textContent = names.map(name => `${name}: ${report.results[name].status}`).join(" · ");
    options.report(JSON.parse(JSON.stringify(report)) as AssetProbeReport);
  }
  function result(name: ProbeName, state: AssetProbeResult["status"], message: string): void {
    report.results[name] = { status: state, detail: message.slice(0, 300) }; publish();
  }
  function bounded<T>(operation: Promise<T>, label: string, milliseconds = 8000): Promise<T> {
    if (disposed) return Promise.reject(new DOMException("Probe disposed", "AbortError"));
    return new Promise<T>((resolve, reject) => {
      const timer = window.setTimeout(() => { timers.delete(timer); reject(new Error(`${label} exceeded ${milliseconds} ms`)); }, milliseconds);
      timers.add(timer);
      const cancel = () => { clearTimeout(timer); timers.delete(timer); reject(new DOMException("Probe disposed", "AbortError")); };
      abort.signal.addEventListener("abort", cancel, { once: true });
      operation.then(resolve, reject).finally(() => { clearTimeout(timer); timers.delete(timer); abort.signal.removeEventListener("abort", cancel); });
    });
  }
  function url(name: string): string { return new URL(`probe/${name}`, location.href).href; }
  async function bytes(name: string): Promise<ArrayBuffer> {
    const request = new AbortController(), cancel = () => request.abort();
    if (disposed) throw new DOMException("Probe disposed", "AbortError");
    abort.signal.addEventListener("abort", cancel, { once: true });
    const deadline = window.setTimeout(cancel, 8000); timers.add(deadline);
    try {
      const response = await fetch(url(name), { cache: "no-store", signal: request.signal });
      if (!response.ok) throw new Error(`${name}: response ${response.status}`);
      const value = await response.arrayBuffer();
      if (value.byteLength === 0 || value.byteLength > 1_048_576) throw new Error(`${name}: invalid fixture size`);
      return value;
    } finally { clearTimeout(deadline); timers.delete(deadline); abort.signal.removeEventListener("abort", cancel); }
  }
  function readFrame(scene: Scene, sceneCamera: PerspectiveCamera | OrthographicCamera): Uint8Array {
    if (!renderer || !target) throw new Error("WebGL2 renderer unavailable");
    renderer.setScissorTest(false); renderer.setRenderTarget(target); renderer.setClearColor(0x000000, 0);
    renderer.clear(); renderer.render(scene, sceneCamera);
    const pixels = new Uint8Array(128 * 128 * 4); renderer.readRenderTargetPixels(target, 0, 0, 128, 128, pixels);
    const error = renderer.getContext().getError(); renderer.setRenderTarget(null);
    if (error !== 0) throw new Error(`WebGL readback error ${error}`);
    return pixels;
  }
  function present(): void {
    if (!renderer || disposed) return;
    renderer.setRenderTarget(null); renderer.setScissorTest(true);
    renderer.setViewport(0, 0, 160, 160); renderer.setScissor(0, 0, 160, 160); renderer.clear(); renderer.render(glbScene, camera);
    renderer.setViewport(160, 0, 160, 160); renderer.setScissor(160, 0, 160, 160); renderer.clear(); renderer.render(textureScene, textureCamera);
    renderer.setScissorTest(false);
  }

  async function glb(): Promise<void> {
    try {
      const loaded = await bounded(new GLTFLoader().parseAsync(await bytes("calibration.glb"), new URL("probe/", location.href).href), "GLB parse");
      glbObject = loaded.scene;
      if (disposed) { disposeObject(glbObject); glbObject = null; return; }
      glbObject.traverse(object => {
        if (!(object instanceof Mesh)) return;
        report.observed.meshCount++; report.observed.triangleCount += (object.geometry.index?.count ?? object.geometry.getAttribute("position").count) / 3;
      });
      const bounds = new Box3().setFromObject(glbObject), center = bounds.getCenter(new Vector3()), size = bounds.getSize(new Vector3());
      const span = Math.max(size.x, size.y, size.z);
      if (!Number.isFinite(span) || span <= 0 || report.observed.meshCount < 1) throw new Error("GLB has no bounded visible meshes");
      glbObject.position.sub(center); glbScene.add(glbObject);
      glbScene.add(new HemisphereLight(0xffffff, 0x526555, 3));
      const light = new DirectionalLight(0xffffff, 3); light.position.set(span, span * 2, span); glbScene.add(light);
      camera.near = span / 100; camera.far = span * 20; camera.position.set(span * 1.7, span * 1.3, span * 1.8); camera.lookAt(0, 0, 0); camera.updateProjectionMatrix();
      const pixels = readFrame(glbScene, camera);
      for (let index = 0; index < pixels.length; index += 4) if (pixels[index + 3]! > 0 && Math.max(pixels[index]!, pixels[index + 1]!, pixels[index + 2]!) > 4) report.observed.glbVisiblePixels++;
      if (report.observed.glbVisiblePixels < 32) throw new Error("Loaded GLB did not produce a visible readback");
      result("glb", "passed", `Parsed ${report.observed.meshCount} meshes / ${report.observed.triangleCount} triangles; ${report.observed.glbVisiblePixels} visible pixels from custom-origin GLB.`);
    } catch (error) { result("glb", "failed", detail(error)); }
  }
  async function png(): Promise<void> {
    const bitmap = new Image();
    try {
      await bounded(new Promise<void>((resolve, reject) => {
        bitmap.onload = () => resolve(); bitmap.onerror = () => reject(new Error("Custom-origin PNG image load failed")); bitmap.src = url("checker.png");
      }), "PNG decode");
      if (disposed) return;
      report.observed.textureWidth = bitmap.naturalWidth; report.observed.textureHeight = bitmap.naturalHeight;
      if (bitmap.naturalWidth !== 8 || bitmap.naturalHeight !== 8) throw new Error("PNG dimensions differ from original fixture");
      texture = new Texture(bitmap); texture.colorSpace = SRGBColorSpace; texture.minFilter = NearestFilter; texture.magFilter = NearestFilter; texture.needsUpdate = true;
      textureMaterial.map = texture; textureMaterial.needsUpdate = true; textureScene.add(new Mesh(textureGeometry, textureMaterial));
      const pixels = readFrame(textureScene, textureCamera), matched = new Set<number>();
      for (const [x, y] of [[32, 32], [96, 32], [32, 96], [96, 96]]) {
        const index = (y! * 128 + x!) * 4;
        colors.forEach((color, number) => {
          const linear = color.map(value => Math.round(new Color().setRGB(value / 255, 0, 0, SRGBColorSpace).r * 255));
          if ([color, linear].some(expected => expected.every((value, channel) => Math.abs(pixels[index + channel]! - value) <= 6))) matched.add(number);
        });
      }
      report.observed.textureMatchedQuadrants = matched.size;
      if (matched.size !== 4) throw new Error(`PNG texture readback matched ${matched.size}/4 original color quadrants`);
      result("texture", "passed", "Decoded 8×8 original PNG; all four color quadrants reached WebGL readback.");
    } catch (error) { result("texture", "failed", detail(error)); }
    finally { bitmap.onload = null; bitmap.onerror = null; if (disposed) bitmap.removeAttribute("src"); }
  }
  async function workerProbe(): Promise<void> {
    try {
      const message = await bounded(new Promise<string>((resolve, reject) => {
        worker = new Worker(url("echo.worker.js"), { name: "TinJunctionAssetOriginProbe" });
        worker.onmessage = event => typeof event.data === "string" ? resolve(event.data) : reject(new Error("Invalid worker message"));
        worker.onerror = event => { event.preventDefault(); reject(new Error(event.message || "Custom-origin worker failed under the current CSP")); };
        worker.postMessage("asset-probe");
      }), "Classic worker");
      if (message !== "asset-worker-ready:42") throw new Error("Worker returned an unexpected result");
      report.observed.workerMessage = message; result("worker", "passed", "Bundled classic worker executed and returned its expected message.");
    } catch (error) { result("worker", "blocked", detail(error)); }
    finally { worker?.terminate(); worker = null; }
  }
  async function wasmProbe(): Promise<void> {
    try {
      const instance = await bounded(WebAssembly.instantiate(await bytes("add-one.wasm")), "WASM compilation");
      const add = instance.instance.exports.add_one;
      if (typeof add !== "function" || add(41) !== 42) throw new Error("WASM export did not return 42");
      report.observed.wasmValue = 42; result("wasm", "passed", "Bundled minimal WASM executed add_one(41) = 42 under unchanged CSP.");
    } catch (error) { result("wasm", "blocked", detail(error)); }
  }
  async function audioProbe(): Promise<void> {
    try {
      context = new AudioContext(); report.observed.audioState = context.state;
      audioBuffer = await bounded(context.decodeAudioData(await bytes("tone.wav")), "PCM WAV decode");
      if (disposed) return;
      report.observed.audioSampleRate = audioBuffer.sampleRate; report.observed.audioFrames = audioBuffer.length; report.observed.audioChannels = audioBuffer.numberOfChannels;
      if (audioBuffer.numberOfChannels !== 1 || Math.abs(audioBuffer.duration - 0.12) > 0.001) throw new Error("Decoded WAV differs from the original mono fixture");
      result("audio", "pending", "Original PCM WAV decoded; awaiting a real tap to resume and play.");
    } catch (error) { result("audio", "blocked", detail(error)); }
  }
  play.addEventListener("click", () => {
    if (!context || !audioBuffer || disposed || report.stage !== "ready") return;
    play.disabled = true;
    // Resume is invoked directly in the real user-gesture callback.
    const resumed = context.resume();
    void bounded(resumed, "Audio gesture resume").then(async () => {
      if (!context || !audioBuffer || disposed || context.state !== "running") throw new Error("Audio context did not run after the tap");
      report.observed.audioState = context.state;
      source = context.createBufferSource(); source.buffer = audioBuffer; source.connect(context.destination);
      await bounded(new Promise<void>(resolve => { source!.onended = () => resolve(); source!.start(); }), "Tone completion", 4000);
      source.disconnect(); source = null;
      if (!disposed) {
        // Publish one valid transition: native validation requires ready to
        // retain pending audio until its observed outcome is complete.
        report.stage = "complete";
        result("audio", "passed", "Real user tap resumed audio; the bundled PCM source completed playback. Acoustic quality remains a device check.");
      }
    }).catch(error => {
      if (disposed) return;
      if (context) report.observed.audioState = context.state;
      report.stage = "complete";
      result("audio", "blocked", detail(error));
    });
  });

  try {
    renderer = new WebGLRenderer({ canvas, antialias: false, alpha: true, preserveDrawingBuffer: true });
    report.webgl2 = renderer.getContext() instanceof WebGL2RenderingContext;
    if (!report.webgl2) throw new Error("WebGL2 is unavailable");
    renderer.setSize(320, 160, false); renderer.setPixelRatio(1); renderer.toneMapping = NoToneMapping; renderer.outputColorSpace = SRGBColorSpace;
    target = new WebGLRenderTarget(128, 128); target.texture.colorSpace = SRGBColorSpace;
  } catch (error) { result("glb", "failed", detail(error)); result("texture", "failed", detail(error)); }
  result("ktx2", "blocked", "Basis/KTX2 transcoder and fixture are not packaged. The compressed texture loader remains disabled; WASM and worker transport are probed separately.");
  publish();
  void Promise.allSettled([...(report.webgl2 ? [glb(), png()] : []), workerProbe(), wasmProbe(), audioProbe()]).then(() => {
    if (disposed) return;
    present(); report.stage = report.results.audio.status === "pending" ? "ready" : "complete"; play.disabled = report.stage !== "ready"; publish();
  });
  function disposeObject(object: Object3D): void {
    const materials = new Set<Material>();
    object.traverse(child => { if (child instanceof Mesh) { child.geometry.dispose(); for (const material of Array.isArray(child.material) ? child.material : [child.material]) materials.add(material); } });
    materials.forEach(material => material.dispose());
  }
  return { dispose(): void {
    if (disposed) return;
    disposed = true; abort.abort(); timers.forEach(timer => clearTimeout(timer)); timers.clear(); worker?.terminate(); worker = null;
    try { source?.stop(); } catch { /* The source may already have ended. */ }
    source?.disconnect(); if (context && context.state !== "closed") void context.close().catch(() => undefined);
    if (glbObject) disposeObject(glbObject); glbObject = null;
    texture?.dispose(); textureGeometry.dispose(); textureMaterial.dispose(); target?.dispose(); renderer?.dispose(); renderer?.forceContextLoss();
    glbScene.clear(); textureScene.clear(); panel.remove();
  } };
}
