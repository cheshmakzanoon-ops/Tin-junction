# Rendering specification — Swift-hosted Three.js

Status: **PROPOSED**. This defines requirements, not a claim that a renderer, target-device integration, or performance result exists. Commercial distribution is exclusively iPhone Duo.

Related: [system architecture](../architecture/SYSTEM_ARCHITECTURE.md), [art direction](ART_DIRECTION.md), [asset pipeline](ASSET_PIPELINE.md), [performance budgets](PERFORMANCE_BUDGETS.md), [visual acceptance](VISUAL_ACCEPTANCE.md), [test strategy](../quality/TEST_STRATEGY.md).

## 1. Renderer decision

Initial baseline: Three.js `WebGLRenderer` with WebGL 2, bundled offline and pinned to an exact tested version. Swift/SwiftUI owns the native app; web content is an embedded rendering/interaction engine, not a remotely served website.

WebGPU is a bounded research path, not a prerequisite or performance promise. WebKit documents WebGPU shipping in Safari 26 on iOS, but that does not establish compatibility with the selected WKWebView origin, package loading, decoder workers, shaders, and device. Prove that exact combination in the actual app.

The current Three.js WebGPURenderer manual still describes experimental limitations and a different material/postprocessing stack. A future ADR adopting it must:

- Port custom shaders to TSL/node materials.
- Replace EffectComposer passes with the appropriate node composition.
- Test fallback, failed initialization, and lost-device/context behavior explicitly.
- Supply image-equivalence and measured performance evidence.
- Remove unused competing implementation paths after the decision rather than maintaining two untested engines indefinitely.

### 1.1 Proposed adapter

```ts
interface RendererAdapter {
  initialize(surface: RenderSurface, policy: RenderPolicy): Promise<CapabilityReport>;
  resize(viewport: ViewportMetrics): void;
  applyQuality(policy: ResolvedQualityPolicy): void;
  render(frame: Readonly<RenderFrame>): void;
  capture(request: CaptureRequest): Promise<CaptureResult>;
  suspend(reason: SuspendReason): void;
  resume(): Promise<void>;
  dispose(): void;
}
```

This is a proposed contract, not implemented code. Concrete names may follow the architecture specification. `RenderFrame` contains presentation data, not mutable native persistence. Three.js scene objects are not the serialized layout.

## 2. Responsibilities

| System | Owns | Must not own |
| --- | --- | --- |
| Swift host | Lifecycle, safe areas, verified device/posture facts, durable storage, native accessibility | Per-mesh animation or arbitrary-code bridge |
| Simulation | Fixed ticks, track/train state, IDs, deterministic commands | Materials, GPU resources or render frame delta |
| Presentation | Interpolated transforms, mechanical poses, effects | Authoritative progression or save mutation |
| Renderer | Context, passes, surfaces, resource use, capture | Pricing and durable user-data authority |
| Asset manager | Manifest, loading, reference counts, decoder lifetime | Runtime network code download |
| Quality manager | Measured tier, hysteresis, pressure response | Changing mechanics or deleting player content |

Native layout/lifecycle messages are event-driven. Ordinary per-object animation remains within the engine; do not send one Swift bridge message per mesh per frame.

## 3. Capability proof before expanding art

Build a small scene in the actual app package and record:

1. Commit, dependency lock hash, Xcode/OS build and device evidence.
2. WKWebView resource-loading strategy and origin.
3. WebGL 2 creation result and queried limits used by the pipeline.
4. Required colour/depth target and extension support.
5. KTX2 transcode format, decoder worker/WASM behavior.
6. Meshopt fixture decode result.
7. Shader compilation diagnostics.
8. Context loss/recreation and native WebContent-process recovery.
9. Background/foreground transitions.
10. A native-to-web and web-to-native validated bridge interaction.
11. Measurement capabilities, with missing values explicitly unavailable.

A desktop result does not establish Duo capabilities. A simulator result is evidence only for the named simulator configuration.

## 4. Coordinates and scene organization

Use the shared architecture convention: right-handed, Y up, XZ ground, one unit = one physical model-world metre, locomotive authored forward +Z. Import conversion occurs once. Track/simulation functions never hide additional rendering-scale factors.

Initial proposed kit: 1:87 model ratio, 0.0165 m rail gauge, 0.8 m × 0.5 m board, ratified by the scale ADR/fixture. These are product-design dimensions, not phone measurements.

Conceptual scene layers:

- `case`: shell, lining, hinge presentation and frame.
- `terrain`: layout surface and landforms.
- `track`: rails, sleepers, points, signals and switching hardware.
- `rollingStock`: locomotive/carriage presentation and articulation.
- `scenery`: structures, trees, props and water.
- `effects`: steam, weather and light contributions.
- `editor`: selection, previews, handles and diagnostics.

Map stable logical IDs to render entities. Do not depend on incidental child-array positions or names emitted by a modelling tool for essential behavior.

## 5. Frame sequence and determinism

Physics does not advance from variable rendering delta. The simulation specification owns fixed tick, bounded catch-up and pause rules.

Per frame:

1. Observe lifecycle, viewport and pressure changes.
2. Consume validated commands at the simulation boundary.
3. Advance bounded fixed ticks.
4. Interpolate presentation between authoritative states.
5. Update dirty transforms and mechanism poses only.
6. Update camera and bounded effects.
7. Resolve visible chunks/LOD and overlays.
8. Execute the approved pass chain.
9. Update lightweight rolling metrics without allocation or bridge spam.

Deterministic capture uses fixed seed, tick, camera, lighting, exposure, weather and quality policy, after assets and shader warm-up settle. Wall-clock time cannot alter golden images.

Background pause, context loss and long stalls cannot trigger an unbounded simulation burst on resume. Reset the render accumulator through the native lifecycle contract, not by altering the saved user layout.

## 6. Colour pipeline

| Data | Input interpretation | Working use |
| --- | --- | --- |
| Base/emissive colour | sRGB unless explicitly authored otherwise | Convert once to linear shading |
| Normal, metallic, roughness, AO and masks | Non-colour | No display transfer conversion |
| HDR environment/lightmap | Explicit linear/open-range intent | Lighting, not display colour |
| Vertex colour | Authored/converted to working linear values | Avoid double conversion |
| Output | Approved tone mapping and sRGB conversion | Exactly once |

Keep Three.js colour management enabled. Validate imported content and custom shaders, decals, particles, thumbnails and captures. The WebGL postprocess path needs the correct final output stage. Do not stack manual gamma conversion with OutputPass without proving correctness.

SDR/sRGB is the baseline until a separate tested ADR approves wider output. Wide-gamut/HDR device hardware does not automatically make the canvas HDR. Exposure is not a repair for incorrect colour annotations.

## 7. Lighting and shadows

### 7.1 Baseline lighting

- One dynamic shadowed key.
- Prefiltered environment for material response.
- Approved restrained indirect representation.
- Emissive windows plus a tightly bounded local-light budget.
- Baked contributions only with explicit validity conditions.

Environment content is owned/licensed and bundled offline. Cache bounded PMREM presets; do not regenerate environment maps each frame. Release replaced intermediate targets when their owners are done.

### 7.2 Baking in an editable world

| Contribution | Validity | Invalidation |
| --- | --- | --- |
| Static terrain occlusion | Same terrain geometry | Terrain change |
| Building-local cavity data | Same building shape | Asset revision |
| Directional baked illumination | Matching lighting and arrangement | Time/weather/placement change |
| Ground shadow of a movable object | Not safe as permanent data | Move/remove object |

The sandbox must look correct after ordinary edits. A beautiful starter scene with lingering shadow ghosts is not an acceptable implementation.

### 7.3 Shadow requirements

Fit the light frustum to useful content. Fix scale/normals before tuning bias. Reject peter-panning, unstable rail shadows and noise on thin details. If an object cannot cast a useful stable shadow within budget, select a documented cheaper contribution.

Count every shadow pass in submission/timing budgets. Avoid casual addition of shadowed point lights. Reusing a static shadow map requires a validity rule covering light, casters and relevant receivers.

## 8. Materials and shaders

- Central versioned recipe registry, with shared instances where sensible.
- Bounded shader variants; measure program count.
- Instanced attributes/atlases for small variations instead of hundreds of clones.
- Standard metallic/roughness by default.
- Clearcoat, transmission, anisotropy and other costly features need visible reference benefit and profiling.
- Development shader diagnostics remain enabled and visible.
- Custom shader tests cover neutral appearance, colour pipeline, depth, shadow and quality tiers.
- Selection must not permanently mutate a shared imported material.

If WebGPU is adopted, each custom effect explicitly identifies its TSL implementation and fallback limits. GLSL snippets alone are not renderer-agnostic.

## 9. Track geometry, instancing and LOD

### 9.1 Track correspondence

Use a small approved modular kit or deterministic geometry generator with a shared rail profile, sleeper spacing, joins and turnout rules. Visual track derives from authoritative topology. Do not independently edit a visual spline that the train does not follow.

Important profile/contact/silhouette details use geometry. Fine ballast and surface marks can use textures plus sparse close-up meshes.

### 9.2 Instancing

Instance repeated geometry/material combinations. Chunk instances spatially for useful culling. After edits, update transforms and bounds as required. Picking retains a stable logical entity mapping even if instance storage is compacted.

### 9.3 LOD invariants

Preserve silhouette, motion envelope, pivots, sockets, couplers, material identity and compatible animation. Collision/topology never depend on visible LOD. Use hysteresis and slow-zoom tests; screen-space size is often more useful than one global distance.

No LOD may erase visible wheels and leave a body floating. Remove small repeated hardware first. Verify material/shading consistency at the transition, not only vertex count reduction.

### 9.4 Transparency

Budget transparency explicitly. Prefer stable alpha-tested foliage when appropriate, economical window approximations and bounded particles. Test every camera mode. Making everything double-sided is not an acceptable generic sorting fix.

## 10. Postprocessing ladder

Keep a debug path to the calibrated base image. Add effects in order:

1. Correct tone mapping/output conversion.
2. Stable anti-aliasing appropriate to target/backend.
3. Restrained contact/AO, if reference review shows benefit.
4. Modest bloom for genuine bright sources.
5. Optional viewing/photo depth of field.
6. Additional effects only with cost/benefit approval.

Each pass defines quality-tier behavior, resolution, colour interpretation, lifetime, fixture and measured timing. Avoid accidental full-resolution chains at device DPR.

Temporal accumulation requires valid history rules for moving wheels, disocclusion, camera cuts, editor overlays, resize and posture change. A stable still does not justify ghosting in motion.

## 11. Viewport and fold integration

Native code supplies verified viewport/safe-area/posture data through a versioned contract. Browser resize is not a measured hinge angle. Synthetic harness input is always labelled.

Resize transaction:

1. Resolve logical viewport and insets.
2. Apply measured render-area policy rather than raw DPR.
3. Update camera and picking transforms.
4. Resize all relevant targets together.
5. Invalidate temporal history.
6. Recompute overlay presentation.
7. Capture abrupt and continuous transition evidence.

Zero-sized/background surfaces allocate no invalid targets. Coalesce excessive events and release superseded targets. Picking accounts for content rect, safe areas, render scale and any verified two-surface mapping.

## 12. Loading, lifecycle and recovery

Proposed startup sequence: native shell, capability check, manifest verification, critical assets, shader warm-up, useful first frame, remaining assets. UI progress reflects actual work, not a fabricated percentage.

Offline resource rules:

- Bundle engine, loaders, decoder JS/WASM and required assets/fonts.
- No executable CDN dependency.
- Resolve only approved bundle/resource-origin paths.
- Reject traversal, unknown schemes, malformed paths and oversized/unlisted resources.
- Use the architecture's navigation restrictions and validated bridge.

On context loss or WebContent termination, recreate presentation resources from authoritative state. Do not rely on serializing the Three.js graph. Preserve layouts and explain a non-instant recovery through native UI.

Suspend unnecessary animation and effects in background. Resume validates context/resources, resets frame-clock accumulation, respects audio policy and restores input. Test long suspension, low-memory conditions and repeated interruptions.

## 13. Resource ownership

Every texture, geometry, material, render target, decoder worker and effect buffer has an owner. Sharing uses explicit reference/lifetime rules.

- Removing a mesh is not disposal.
- Material disposal does not release shared textures automatically.
- Geometry, texture and render-target APIs require appropriate release.
- CPU ImageBitmap resources may need separate closure.
- Shared-resource reuse after disposal is a bug.
- Cancelled async loads cannot attach resources to a discarded scene.

Exercise repeated scene load/reset, place/delete, weather changes, capture generation, resize, context recovery and suspend/resume. Warmed caches may retain documented resources; counts must return to a stable plateau rather than grow without bound.

## 14. Instrumentation

Record frame distributions, simulation/CPU preparation, all-pass draw calls, triangles, shader variants, tracked texture/buffer estimates, render area, quality tier, load/transcode timing and lifecycle events.

Use GPU timing only where supported and trustworthy. Missing metrics are `unavailable`, never zero. Renderer counters are not native/WebContent process memory. Simulator timings are not hardware timings.

Use bounded rolling aggregates and explicit diagnostic capture, not per-frame logging across the bridge. Version metric schemas and attach backend/device/OS context.

## 15. Acceptance checklist

- [ ] Exact dependency and tool versions pinned.
- [ ] Actual offline WKWebView probe passes.
- [ ] No private/imaginary platform assumptions.
- [ ] Shared scale and colour conventions enforced.
- [ ] Simulation/presentation separation tested.
- [ ] Calibration and screenshot fixtures pass.
- [ ] Track, contact and mechanism correspondence passes.
- [ ] Edits invalidate visual data correctly.
- [ ] Quality ladder preserves correctness and readability.
- [ ] Lifetime and recovery tests pass.
- [ ] Real Duo visual/sustained performance evidence exists before release.

## 16. Primary references

- [WebGLRenderer](https://threejs.org/docs/pages/WebGLRenderer.html)
- [WebGPURenderer and migration limits](https://threejs.org/manual/pages/webgpurenderer)
- [Safari 26 WebGPU release](https://webkit.org/blog/17333/webkit-features-in-safari-26-0/)
- [Colour management](https://threejs.org/manual/pages/color-management.html)
- [MeshPhysicalMaterial](https://threejs.org/docs/pages/MeshPhysicalMaterial.html)
- [PMREMGenerator](https://threejs.org/docs/pages/PMREMGenerator.html)
- [InstancedMesh](https://threejs.org/docs/pages/InstancedMesh.html)
- [LOD](https://threejs.org/docs/pages/LOD.html)
- [Shadows](https://threejs.org/manual/pages/shadows.html)
- [Disposal](https://threejs.org/manual/pages/how-to-dispose-of-objects.html)

Consult the pinned release's local types before implementation; these links can evolve.
