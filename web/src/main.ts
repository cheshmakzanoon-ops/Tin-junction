import { createOutgoingBridge, parseNativeMessage } from "./bridge";
import type { NativeMessage, WebMessage } from "./bridge";
import { FixedStepClock, RenderLifecycle } from "./clock";
import { createStarterLayout, RailwayModel } from "./model";
import type { LayoutDocument, ModelCommand, SceneryKind, TimeOfDay } from "./model";
import { MiniatureScene } from "./scene/MiniatureScene";
import { BrowserLayoutStore } from "./persistence";
import { RailwayAudio } from "./audio";
import { element, mountInterface } from "./ui";
import "./style.css";

type Diagnostics = {
  renderer: "starting" | "webgl2" | "unavailable";
  frameCount: number; rejectedMessages: number; nativeMessages: number;
  lifecycle: "running" | "paused" | "disposed"; contextLosses: number;
  width: number; height: number; drawingBufferWidth: number; drawingBufferHeight: number;
  initialized: boolean; loaded: boolean; mode: string; revision: number; tick: number;
  trainDistance: number; trainSpeed: number; throttle: number; direction: number;
  sceneryCount: number; selectedId: string | null; savedRevision: number | null;
  checkpoint: number; saveState: string; documentName: string; drawCalls: number; triangles: number;
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
  lifecycle: "paused", contextLosses: 0, width: 0, height: 0, drawingBufferWidth: 0,
  drawingBufferHeight: 0, initialized: false, loaded: false, mode: "operate", revision: 0,
  tick: 0, trainDistance: 0, trainSpeed: 0, throttle: 0, direction: 1, sceneryCount: 0,
  selectedId: null, savedRevision: null, checkpoint: 0, saveState: "loading", documentName: "", drawCalls: 0, triangles: 0,
};
window.__TIN_DIAGNOSTICS__ = diagnostics;
mountInterface();
const post = createOutgoingBridge(message => window.webkit?.messageHandlers?.tinJunction?.postMessage(message));

function start(): void {
  const canvas = element<HTMLCanvasElement>("world");
  const scene = new MiniatureScene(canvas);
  const audio = new RailwayAudio();
  const lifecycle = new RenderLifecycle();
  lifecycle.documentVisible = !document.hidden;
  const clock = new FixedStepClock();
  const native = Boolean(window.webkit?.messageHandlers?.tinJunction);
  document.body.classList.toggle("native-host", native);
  let model = new RailwayModel(createStarterLayout());
  let store: BrowserLayoutStore | null = null;
  let sessionId: string | null = null;
  let loaded = !native;
  let saveBlocked = false;
  let checkpoint = 0;
  let durableRevision: number | null = null;
  let saveQueued = false;
  let saveTimer = 0;
  let acknowledgmentTimer = 0;
  let retryAllowed = false;
  let pending: { requestId: string; document: LayoutDocument; checkpoint: number; expectedRevision: number | null } | null = null;
  let scheduledFrame = 0;
  let lastUI = -Infinity;
  let lastMetrics = -Infinity;
  let lastCheckpoint = 0;
  let lastFrame = 0;
  let sentReady = false;
  let selected: string | null = null;
  let palette: SceneryKind | null = null;
  let scenerySequence = 0;
  let pointerStart: { x: number; y: number } | null = null;
  const activePointers = new Set<number>();
  let multiPointerGesture = false;
  let noticeTimer = 0;
  const throttle = element<HTMLInputElement>("throttle");
  const help = element<HTMLDialogElement>("help-dialog");

  function notice(message: string, persistent = false): void {
    clearTimeout(noticeTimer);
    const node = element("notice"); node.textContent = message; node.hidden = false;
    if (!persistent) noticeTimer = window.setTimeout(() => { node.hidden = true; }, 5_000);
  }
  function status(message: string): void { element("status").textContent = message; }
  function setSaveState(state: string, text: string): void {
    diagnostics.saveState = state; element("save-status").textContent = text;
  }
  function syncUI(): void {
    const state = model.state;
    Object.assign(diagnostics, { loaded, mode: model.mode, revision: state.revision, tick: state.tick,
      trainDistance: state.train.distance, trainSpeed: state.train.speed, throttle: state.train.throttle,
      direction: state.train.direction, sceneryCount: state.scenery.length, selectedId: selected,
      savedRevision: durableRevision, checkpoint, documentName: state.name });
    element("layout-title").textContent = state.name;
    if (document.activeElement !== element("layout-name")) element<HTMLInputElement>("layout-name").value = state.name;
    throttle.value = String(Math.round(state.train.throttle * 100));
    throttle.style.setProperty("--throttle", `${state.train.throttle * 100}%`);
    element("speed").innerHTML = `${Math.round(state.train.speed * 1000)} <span>mm/s</span>`;
    element("train-status").textContent = model.mode === "edit" ? "Resting while you arrange" : state.train.speed > 0.001 ? state.train.throttle === 0 ? "Coasting to a stop" : "A little journey" : "Ready when you are";
    element("direction-label").textContent = state.train.direction === 1 ? "Forward" : "Reverse";
    element("run-symbol").textContent = state.train.throttle > 0 ? "Ⅱ" : "▶";
    element("run").setAttribute("aria-label", state.train.throttle > 0 ? "Pause train" : "Run train");
    for (const id of ["run", "throttle", "reverse"]) element<HTMLButtonElement | HTMLInputElement>(id).disabled = !loaded || model.mode === "edit";
    element<HTMLButtonElement>("edit").disabled = !loaded;
    element<HTMLButtonElement>("stop").disabled = !loaded;
    element<HTMLButtonElement>("save").disabled = !loaded;
    element<HTMLButtonElement>("undo").disabled = !model.canUndo;
    element<HTMLButtonElement>("redo").disabled = !model.canRedo;
    element<HTMLButtonElement>("remove").disabled = selected === null;
    element<HTMLButtonElement>("rotate").disabled = selected === null;
    document.querySelectorAll<HTMLButtonElement>("[data-time]").forEach(button => {
      button.setAttribute("aria-pressed", String(button.dataset.time === state.environment.timeOfDay)); button.disabled = !loaded;
    });
    document.querySelectorAll<HTMLButtonElement>("[data-piece]").forEach(button => button.setAttribute("aria-pressed", String(button.dataset.piece === palette)));
  }
  function sendPending(): void {
    if (!pending || !sessionId) return;
    clearTimeout(acknowledgmentTimer);
    retryAllowed = false;
    setSaveState("saving", "Saving your railway…");
    post("layout.checkpoint", { sessionId, ...pending });
    acknowledgmentTimer = window.setTimeout(() => {
      if (!pending || lifecycle.disposed) return;
      retryAllowed = true;
      setSaveState("failed", "Save needs a retry");
      notice("Your changes are still here. The save has not been confirmed; tap Save to retry.", true);
    }, 10_000);
  }
  function saveNow(retry = false): void {
    clearTimeout(saveTimer);
    if (!loaded || saveBlocked || lifecycle.disposed) return;
    if (pending) { if (retry) { if (retryAllowed) sendPending(); } else saveQueued = true; return; }
    const document = model.snapshot(); checkpoint += 1;
    if (native) {
      if (!sessionId) { checkpoint -= 1; return; }
      pending = { requestId: `save-${checkpoint}`, document, checkpoint, expectedRevision: durableRevision };
      try { sendPending(); } catch { retryAllowed = true; setSaveState("failed", "Save needs a retry"); notice("Your edits are still here. The native save connection is unavailable.", true); }
    } else {
      try {
        store?.save(document, checkpoint);
        if (!store) throw new Error("Local storage is unavailable.");
        durableRevision = document.revision;
        setSaveState("saved", "Saved on this device");
      } catch (error) {
        setSaveState("failed", "Changes not saved"); notice(error instanceof Error ? error.message : "The layout could not be saved.", true);
      }
    }
    syncUI();
  }
  function scheduleSave(): void {
    if (saveBlocked) return;
    setSaveState("unsaved", "Unsaved changes"); clearTimeout(saveTimer);
    saveTimer = window.setTimeout(() => saveNow(), 200);
  }
  function select(id: string | null): void {
    selected = id; scene.setSelected(id); diagnostics.selectedId = id;
    element("editor-hint").textContent = id ? "Tap a clear spot to move this miniature, or rotate and remove it below." : palette ? "Tap a clear spot on the board to place your miniature." : "Choose a miniature, then tap a clear spot on the board.";
    syncUI();
  }
  function perform(command: ModelCommand): boolean {
    if (!loaded) return false;
    const result = model.apply(command);
    if (!result.ok) { notice(result.message); syncUI(); return false; }
    if (selected && !model.state.scenery.some(item => item.id === selected)) select(null);
    if (result.changed) { scene.update(model.snapshot()); scheduleSave(); }
    syncUI(); return true;
  }
  function editing(enabled: boolean): void {
    if (!loaded) return;
    if (!perform({ type: "mode", value: enabled ? "edit" : "operate" })) return;
    select(null); palette = null;
    element("editor").hidden = !enabled;
    element("edit").setAttribute("aria-pressed", String(enabled));
    document.body.classList.toggle("is-editing", enabled);
    element("mode-label").textContent = enabled ? "A world in the making" : "Your own little escape";
    status(enabled ? "A tree here. A cottage there. Make it yours." : "A quiet afternoon. A railway of your own.");
    if (enabled) scene.setView("top");
    syncUI();
  }
  function whistle(): void {
    void audio.whistle().then(played => { if (!played) status("Tap Whistle again when sound is available."); else status("A little hello, from the little local."); });
  }
  function loadBrowser(): void {
    try {
      store = new BrowserLayoutStore(window.localStorage);
      const restored = store.load();
      checkpoint = restored.checkpoint;
      if (restored.document) { model = new RailwayModel(restored.document); durableRevision = restored.document.revision; }
      if (restored.error) { saveBlocked = true; setSaveState("failed", "Changes not saved"); notice(restored.error, true); }
      else if (restored.recovered) { setSaveState("recovered", "Recovered previous save"); notice("Your previous good save was restored. The most recent changes may be missing.", true); }
      else setSaveState(restored.document ? "saved" : "unsaved", restored.document ? "Saved on this device" : "Your new railway");
    } catch { saveBlocked = true; setSaveState("failed", "Changes not saved"); notice("This browser cannot save local layouts. Your railway can still be explored.", true); }
  }
  function receive(message: NativeMessage): void {
    if ("sessionId" in message.payload && message.type !== "native.bootstrap" && message.payload.sessionId !== sessionId) { diagnostics.rejectedMessages += 1; return; }
    switch (message.type) {
      case "native.bootstrap":
        if (message.payload.sessionId && message.payload.sessionId !== sessionId) {
          sessionId = message.payload.sessionId; loaded = false; pending = null; saveQueued = false;
          clearTimeout(acknowledgmentTimer); clearTimeout(saveTimer); setSaveState("loading", "Opening your railway…");
        }
        break;
      case "native.layout":
        if (loaded || !native) { diagnostics.rejectedMessages += 1; return; }
        model = new RailwayModel(message.payload.document ?? createStarterLayout());
        palette = null; selected = null; scene.setSelected(null);
        element("editor").hidden = true; element("edit").setAttribute("aria-pressed", "false");
        document.body.classList.remove("is-editing");
        element("mode-label").textContent = "Your own little escape";
        checkpoint = message.payload.checkpoint;
        durableRevision = message.payload.document?.revision ?? null;
        loaded = true; saveBlocked = false; scene.update(model.snapshot());
        setSaveState(message.payload.recovered ? "recovered" : "saved", message.payload.recovered ? "Recovered previous save" : message.payload.document ? "Saved on this iPhone" : "Your new railway");
        if (message.payload.recovered) notice("Your previous good save was restored. The most recent changes may be missing.", true);
        post("layout.loaded", { sessionId, documentId: model.state.documentId, revision: model.state.revision });
        if (!message.payload.document) saveNow();
        break;
      case "native.saved": {
        const ack = message.payload;
        if (!pending || ack.requestId !== pending.requestId || ack.documentId !== pending.document.documentId || ack.revision !== pending.document.revision || ack.checkpoint !== pending.checkpoint) { diagnostics.rejectedMessages += 1; return; }
        clearTimeout(acknowledgmentTimer); retryAllowed = false; durableRevision = ack.revision; pending = null;
        setSaveState(durableRevision === model.state.revision ? "saved" : "unsaved", durableRevision === model.state.revision ? "Saved on this iPhone" : "Unsaved changes");
        if (saveQueued || durableRevision !== model.state.revision) { saveQueued = false; saveNow(); }
        break;
      }
      case "native.saveFailed":
        if (!pending || message.payload.requestId !== pending.requestId) { diagnostics.rejectedMessages += 1; return; }
        clearTimeout(acknowledgmentTimer); pending = null; saveQueued = false;
        if (["no_valid_save", "stale_checkpoint", "revision_conflict", "checkpoint_conflict", "different_document", "invalid_stored_generation"].includes(message.payload.code)) saveBlocked = true;
        setSaveState("failed", "Changes not saved"); notice(message.payload.message, true);
        break;
      case "native.requestCheckpoint": saveNow(true); break;
      case "native.lifecycle":
        if (message.payload.state !== "active") { saveNow(); audio.pause(); }
        lifecycle.nativeActive = message.payload.state === "active"; updateSchedule(); break;
      case "native.viewport":
        scene.setHingeAngle(message.payload.hingeAngleDegrees ?? null); resize(); break;
    }
    syncUI();
  }
  window.TinJunction = { receiveNative(input: unknown): void {
    if (lifecycle.disposed) return;
    const message = parseNativeMessage(input);
    if (!message) { diagnostics.rejectedMessages += 1; return; }
    diagnostics.nativeMessages += 1;
    receive(message);
  } };
  function resize(): void {
    if (!lifecycle.disposed) Object.assign(diagnostics, scene.resize());
  }
  function updateSchedule(): void {
    if (scheduledFrame) cancelAnimationFrame(scheduledFrame);
    scheduledFrame = 0; clock.reset(); lastFrame = 0;
    diagnostics.lifecycle = lifecycle.disposed ? "disposed" : lifecycle.running ? "running" : "paused";
    if (lifecycle.running) scheduledFrame = requestAnimationFrame(frame);
  }
  function frame(timestamp: number): void {
    scheduledFrame = 0;
    if (!lifecycle.running) return;
    const { steps } = clock.advance(timestamp);
    if (loaded && !help.open) model.step(steps);
    scene.update(model.snapshot());
    scene.render(lastFrame === 0 ? 0 : Math.min(0.1, (timestamp - lastFrame) / 1000)); lastFrame = timestamp;
    diagnostics.frameCount += 1; diagnostics.initialized = true;
    if (!sentReady) { sentReady = true; post("web.ready", { build: "first-railway", protocolVersion: 1, renderer: "webgl2" }); }
    if (timestamp - lastUI > 100) { lastUI = timestamp; syncUI(); }
    if (timestamp - lastMetrics >= 2_000) {
      lastMetrics = timestamp;
      diagnostics.drawCalls = scene.renderer.info.render.calls; diagnostics.triangles = scene.renderer.info.render.triangles;
      element("metrics").textContent = `${Math.round(diagnostics.width)} × ${Math.round(diagnostics.height)} viewport · ${diagnostics.drawCalls} draw calls · ${diagnostics.triangles.toLocaleString()} triangles. Browser/simulator figures do not measure device performance.`;
      post("engine.metrics", { frames: diagnostics.frameCount, drawCalls: diagnostics.drawCalls, triangles: diagnostics.triangles, evidenceKind: "diagnostic-only" });
    }
    if (loaded && model.state.train.speed > 0 && timestamp - lastCheckpoint >= 5_000) { lastCheckpoint = timestamp; saveNow(); }
    scheduledFrame = requestAnimationFrame(frame);
  }

  element("run").addEventListener("click", () => perform(model.state.train.throttle > 0 ? { type: "stop" } : { type: "throttle", value: 0.55 }));
  throttle.addEventListener("input", () => perform({ type: "throttle", value: Number(throttle.value) / 100 }));
  element("stop").addEventListener("click", () => { perform({ type: "stop" }); status("Coming gently to a stop."); saveNow(); });
  element("reverse").addEventListener("click", () => { if (perform({ type: "reverse" })) status("A new direction. Set the throttle when you’re ready."); });
  element("whistle").addEventListener("click", whistle);
  element("save").addEventListener("click", () => saveNow(true));
  element("edit").addEventListener("click", () => editing(model.mode !== "edit"));
  element("close-editor").addEventListener("click", () => editing(false));
  element("undo").addEventListener("click", () => perform({ type: "undo" }));
  element("redo").addEventListener("click", () => perform({ type: "redo" }));
  element("remove").addEventListener("click", () => { if (selected) perform({ type: "scenery.remove", id: selected }); });
  element("rotate").addEventListener("click", () => {
    const item = model.state.scenery.find(value => value.id === selected);
    if (item) perform({ type: "scenery.move", id: item.id, x: item.x, z: item.z, rotation: ((item.rotation + Math.PI / 4 + Math.PI) % (Math.PI * 2)) - Math.PI });
  });
  element<HTMLInputElement>("layout-name").addEventListener("change", event => perform({ type: "rename", value: (event.target as HTMLInputElement).value.trim() }));
  document.querySelectorAll<HTMLButtonElement>("[data-time]").forEach(button => button.addEventListener("click", () => perform({ type: "environment", value: button.dataset.time as TimeOfDay })));
  document.querySelectorAll<HTMLButtonElement>("[data-view]").forEach(button => button.addEventListener("click", () => {
    scene.setView(button.dataset.view as "overview" | "trackside" | "top");
    document.querySelectorAll<HTMLButtonElement>("[data-view]").forEach(item => item.setAttribute("aria-pressed", String(item === button)));
  }));
  document.querySelectorAll<HTMLButtonElement>("[data-piece]").forEach(button => button.addEventListener("click", () => { palette = palette === button.dataset.piece ? null : button.dataset.piece as SceneryKind; select(null); }));
  element("help").addEventListener("click", () => { help.showModal(); audio.pause(); });
  for (const id of ["close-help", "start-playing"]) element(id).addEventListener("click", () => help.close());
  canvas.addEventListener("pointerdown", event => {
    activePointers.add(event.pointerId);
    if (activePointers.size > 1) { multiPointerGesture = true; pointerStart = null; }
    else if (!multiPointerGesture) pointerStart = { x: event.clientX, y: event.clientY };
  });
  canvas.addEventListener("pointercancel", event => { activePointers.delete(event.pointerId); pointerStart = null; if (!activePointers.size) multiPointerGesture = false; });
  canvas.addEventListener("pointerup", event => {
    activePointers.delete(event.pointerId);
    if (multiPointerGesture) { pointerStart = null; if (!activePointers.size) multiPointerGesture = false; return; }
    const start = pointerStart; pointerStart = null;
    if (!start || Math.hypot(event.clientX - start.x, event.clientY - start.y) > 7 || model.mode !== "edit") return;
    const hit = scene.pickScenery(event.clientX, event.clientY);
    if (!palette && hit && hit !== selected) { select(hit); return; }
    const point = scene.pickBoard(event.clientX, event.clientY);
    if (!point) return;
    if (palette) {
      do { scenerySequence += 1; } while (model.state.scenery.some(item => item.id === `user-${scenerySequence}`));
      const id = `user-${scenerySequence}`;
      if (perform({ type: "scenery.add", item: { id, kind: palette, ...point, rotation: 0, scale: 1 } })) {
        status("A little addition. Already feeling like home.");
      }
    } else if (selected) perform({ type: "scenery.move", id: selected, ...point });
  });
  function keyboard(event: KeyboardEvent): void {
    if ((event.target instanceof Element && event.target.closest("input,textarea,button,select,a,summary,[contenteditable='true']")) || help.open) return;
    if (event.code === "Space") { event.preventDefault(); perform({ type: "stop" }); }
    else if (event.key.toLowerCase() === "e" && !event.metaKey && !event.ctrlKey) editing(model.mode !== "edit");
    else if (event.key.toLowerCase() === "w" && !event.metaKey && !event.ctrlKey) whistle();
    else if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "z" && model.mode === "edit") { event.preventDefault(); perform({ type: event.shiftKey ? "redo" : "undo" }); }
    else if ((event.key === "Delete" || event.key === "Backspace") && selected && model.mode === "edit") { event.preventDefault(); perform({ type: "scenery.remove", id: selected }); }
    else if (event.key === "Escape") { if (palette || selected) { palette = null; select(null); } else if (model.mode === "edit") editing(false); }
  }
  function visibility(): void {
    if (document.hidden) { saveNow(); audio.pause(); }
    lifecycle.documentVisible = !document.hidden; updateSchedule();
  }
  function lost(event: Event): void {
    event.preventDefault(); lifecycle.contextAvailable = false; diagnostics.contextLosses += 1;
    audio.pause(); updateSchedule(); status("The railway is paused while its view recovers.");
    post("engine.error", { code: "webgl_context_lost", recoverable: true });
  }
  function restored(): void { lifecycle.contextAvailable = true; resize(); scene.update(model.snapshot()); updateSchedule(); status("The railway is ready again."); }
  const observer = new ResizeObserver(resize); observer.observe(canvas);
  document.addEventListener("keydown", keyboard);
  document.addEventListener("visibilitychange", visibility);
  canvas.addEventListener("webglcontextlost", lost); canvas.addEventListener("webglcontextrestored", restored);
  window.addEventListener("pagehide", () => {
    saveNow(); lifecycle.disposed = true; updateSchedule();
    clearTimeout(saveTimer); clearTimeout(acknowledgmentTimer); clearTimeout(noticeTimer);
    observer.disconnect(); document.removeEventListener("keydown", keyboard); document.removeEventListener("visibilitychange", visibility);
    canvas.removeEventListener("webglcontextlost", lost); canvas.removeEventListener("webglcontextrestored", restored);
    scene.dispose(); audio.dispose(); delete window.TinJunction;
  }, { once: true });
  if (!native) loadBrowser();
  scene.update(model.snapshot()); diagnostics.renderer = "webgl2";
  if (navigator.maxTouchPoints > 0) element("camera-hint").textContent = "Drag to look around · pinch to get closer";
  resize(); syncUI(); updateSchedule();
}

try { start(); }
catch (error) {
  diagnostics.renderer = "unavailable";
  element("status").textContent = "The railway view could not open. Reload to try again.";
  element("notice").textContent = "The 3D view is unavailable. Your saved layout has not been changed.";
  element("notice").hidden = false;
  post("engine.error", { code: "renderer_initialization_failed", recoverable: false });
  console.error(error);
}
