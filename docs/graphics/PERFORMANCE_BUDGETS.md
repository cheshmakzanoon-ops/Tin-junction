# Performance budgets and measurement protocol

Status: **PROVISIONAL, UNMEASURED TARGETS**. No number in this document is a measured iPhone Duo result, an Apple hardware limit, or a promise. Ratify budgets using the actual app, renderer, content and target hardware. Duo-only remains the commercial scope.

See [rendering](RENDERING_SPEC.md), [asset pipeline](ASSET_PIPELINE.md), [visual acceptance](VISUAL_ACCEPTANCE.md), and [test strategy](../quality/TEST_STRATEGY.md).

## 1. Principles

- Prefer stable motion and responsive touch over a prettier single frame.
- Measure the actual Swift/WKWebView app, not just a desktop browser.
- Report distributions and sustained behavior, not an isolated maximum FPS.
- Treat simulator results as correctness evidence, never thermal/GPU hardware evidence.
- Keep quality degradation explicit and bounded; it cannot change track connectivity, train behavior, saved data or placement correctness.
- Do not “fix” a failing benchmark by changing the scene, camera, sample duration or thresholds without an approved budget revision.

## 2. Starting quality tiers

All values below are initial review limits. The engine may use fewer resources. Exceeding a limit triggers investigation/approval, not automatic proof of failure on every device. Meeting limits does not prove a scene performs well.

| Metric | Interactive baseline | Reduced-pressure tier | Rationale |
| --- | --- | --- | --- |
| Presentation target | 60 Hz | 30 Hz | Stable motion; deliberate fallback |
| Rendered area | Up to about 2.0 megapixels | Up to about 1.2 megapixels | Limit fill/bandwidth cost |
| Main-view draw submissions | 150 | 100 | CPU/driver overhead control |
| All-pass draw submissions | 250 | 170 | Include shadows and effects |
| Main visible triangles | 350,000 | 200,000 | Initial content cap |
| Shadowed key lights | 1 | 1 | Bound repeated geometry work |
| Key shadow map | Up to 2048² | Up to 1024² | Stability/cost tradeoff |
| Ordinary additional lights | Small measured budget; proposed 4 visible | Proposed 2 visible | Do not scale per window |
| GPU resource accounting | Up to 256 MiB estimated | Up to 192 MiB estimated | Asset/target planning, not OS limit |
| Hero atlas resolution | Generally at most 2K | Lower mip/resident variant if supported | Justified by camera range |
| Scenery atlases | Generally at most 1K | Same or lower tested variant | Sharing/instancing |
| Expensive physical-material features | Hero objects only, measured | Disable optional terms | Bound per-pixel cost |
| Depth of field | Optional viewing/photo mode | Off | Keep editing readable |
| Dynamic reflections/SSGI | Not baseline | Off | Require separate proof |

Do not use `window.devicePixelRatio` unbounded as the render pixel ratio. Compute effective scale from viewport, measured policy and an area cap. Native UI stays sharp independently. Record the actual render dimensions in every benchmark/capture.

The example GPU allocation envelope is 128 MiB textures, 64 MiB render targets, 32 MiB geometry and 32 MiB reserve. This is an engineering estimate and excludes unknown driver/process overhead. Track actual allocations conservatively; process memory needs platform measurement.

## 3. Asset planning budgets

| Asset family | Initial guidance | Review focus |
| --- | --- | --- |
| Hero locomotive LOD0 | 25k–50k triangles | Silhouette, wheels, linkage and bevels |
| Hero locomotive LOD1 | 12k–18k triangles | Preserve wheels, pivots and material response |
| Hero locomotive LOD2 | 3k–5k triangles | Recognisable moving silhouette/contact |
| Carriage | Set by visible contribution, below hero unless justified | Couplers/bogies and repetitions |
| Small building | Low-thousands range, measured scene-wide | Roof/wall thickness, window cost |
| Repeated tree | Several LODs, shared materials, bounded alpha | Shimmer/overdraw, not only triangles |
| Ballast/sleepers | Instanced/chunked or approved generator | Submission count and grazing stability |
| Case | Spend geometry on visible edges/hardware | Closure envelope and macro appearance |

These are review starting points, not production prescriptions. Do not inflate geometry to “use the budget”, and do not destroy the hero silhouette simply to hit a nominal triangle count.

## 4. Frame-time acceptance targets

For a controlled warmed 60 Hz interactive run, proposed initial targets are median frame interval near 16.7 ms, p95 at or below 20 ms, p99 at or below 33.3 ms, and fewer than 1% of intervals exceeding 50 ms. These permit a limited number of outliers while exposing persistent stutter; tune with real-device evidence.

For the explicit 30 Hz tier, evaluate against its own expected cadence, not by calling the result a passing 60 Hz run. Proposed p95 is at or below 36 ms and p99 at or below 50 ms. Report all outliers and their causes.

Separate:

- Simulation update time.
- CPU presentation preparation.
- GPU execution timing, **only if supported and valid**.
- End-to-end observed frame intervals.
- Touch-to-visible-response measurement methodology.
- Native scheduling/lifecycle interruption.

CPU preparation around 6 ms and GPU work around 10 ms are initial diagnostic envelopes for the 60 Hz tier, not guarantees or additive hard limits. Pipelining and measurement method affect interpretation. A JavaScript timer around `render()` is not GPU time.

## 5. Required benchmark scenes

| ID | Scenario | Exercises |
| --- | --- | --- |
| PERF-01 | Starter layout, one train, daylight overview | Ordinary play baseline |
| PERF-02 | Hero inspection at rail height, turning wheels/rods | Geometry/material cost and motion |
| PERF-03 | Maximum approved visible scenery density | Instancing, LOD, culling |
| PERF-04 | Night station with allowed lamps | Light/emission/transparency policy |
| PERF-05 | Rain plus moving train at approved density | Particles, wetness, overdraw |
| PERF-06 | Editing, dragging preview and repeated undo/redo | Picking, dirty updates, allocations |
| PERF-07 | Verified posture/viewport transitions | Reallocation, projection and input |
| PERF-08 | Repeated load/reset and place/delete | Lifetime leaks and cache behavior |
| PERF-09 | Suspend/resume and forced context-recovery fixture | Recovery and first useful frame |
| PERF-10 | Largest supported saved layout | Load, decode, peak resources, graceful limits |

Scene IDs, seeds, content limits and camera paths are version-controlled. If production limits increase, update the stress scene and repeat measurement before release.

## 6. Measurement procedure

### 6.1 Record the environment

Required metadata:

- App commit, build configuration, engine version and lockfile hash.
- Asset catalog/version/hash and scene ID.
- Actual target hardware and OS build; simulator/device distinction.
- Native app and WebKit/renderer/backend identifiers that can be obtained legitimately.
- Logical viewport, physical render size, safe-area/posture input and quality tier.
- Brightness, power source, low-power state, starting battery range and ambient conditions as observed.
- Thermal state before/during/after when available through approved APIs.
- Tool versions and whether developer instrumentation changes behavior.

Do not fabricate missing values. Use `unknown` or `unavailable` and explain impact on confidence.

### 6.2 Run protocol

1. Clean launch for cold-start timing; separate that run from steady-state rendering.
2. Load the fixed scene and wait for the documented asset/compilation warm-up.
3. Execute a reproducible camera/input sequence.
4. Capture at least three comparable runs for short benchmarks.
5. Run a sustained device session of at least 20 minutes for the representative heavy scenario.
6. Compare early and late intervals with quality/thermal changes visible in the report.
7. Repeat after relevant renderer, shader, asset, OS or packaging changes.

Do not cool the device between intervals and then call the combined result a sustained run. Record interruptions and invalidate runs whose conditions are no longer comparable.

### 6.3 Report contents

Produce machine-readable metrics plus a concise human summary. Include sample count, duration, median/p95/p99, stutter counts, all-pass submissions, triangles, resource estimates, load/transcode times, tier changes, thermal observations and screenshots identifying the exact scene.

Retain raw data or an artifact link, not only a screenshot of a favourable number. Explain excluded samples and the predetermined exclusion rule.

## 7. Memory and lifetime

Track these separately:

1. Compressed on-disk asset/package size.
2. Temporary loading/decompression/transcoding peaks.
3. Tracked geometry/texture/render-target estimates.
4. JavaScript/CPU resources where observably measurable.
5. Native and WebContent process footprint through platform tools.

No browser heap API is assumed available. No particular memory pressure/jetsam threshold is asserted. Resource estimates and total system pressure are different quantities.

Leak test: warm caches, repeat a fixed sequence of load/reset, place/delete, capture, weather change and resize, then compare resource counts after each complete cycle. The expected plateau and retained caches are documented. Growth outside that explanation fails investigation even if the app has not yet terminated.

## 8. Quality adaptation

Quality manager inputs include measured frame behavior, verified thermal/low-power facts, content complexity and user preference if offered. Apply hysteresis and a cool-down; never oscillate every frame.

Proposed reduction order:

1. Reduce optional particle count/overdraw.
2. Disable optional depth of field and nonessential expensive postprocessing.
3. Reduce render scale within approved readability bounds.
4. Reduce shadow resolution/caster set while preserving key contact cues.
5. Select more aggressive approved scenery LODs.
6. Move to the explicit stable 30 Hz tier if needed.

Order must be validated visually. Do not remove rails, wheels, signals, editor handles, or the geometry needed to understand placement. Do not reduce physics tick accuracy or skip persistence validation.

Diagnostic capture records the resolved policy and why it changed. Test quality transitions while a train crosses points and while an object is dragged; correctness cannot depend on tier.

## 9. Performance failure triage

| Symptom | First discriminating experiment | Typical next area |
| --- | --- | --- |
| GPU pressure suspected | Lower resolution while keeping scene constant | Fill, blending, postprocess |
| Submission pressure suspected | Replace materials/instances in controlled fixture | Draw calls, variants, CPU preparation |
| Heavy shadows | Disable shadows in the same scene | Caster set, frustum, shadow count |
| Jank on first appearance | Repeat after warm-up | Compilation/upload/decode scheduling |
| Jank during edits | Profile dirty updates and allocations | Rebuild scope, picking, garbage collection |
| Slow thermal drift | Compare early/late runs and tier events | Sustained power, unnecessary work |
| Memory grows per reset | Trace lifetime owner counts | Texture/target/worker disposal |

Temporary diagnostic changes are not automatically production fixes. Re-run the original scene after the actual fix.

## 10. Gate ownership and handoff

Every performance task leaves task ID, tested commit, exact commands/tool procedure, scene/catalog hashes, conditions, raw artifact location, measured result, target comparison, known uncertainty, reviewer and next action. Use explicit `not_run`, `unavailable`, `pass`, `fail` or `blocked` states, not inferred completion percentages.

Budget changes require a dated decision explaining content/quality tradeoffs, new evidence and regression impact. No agent may silently raise a limit until CI turns green. The owner/device reviewer approves release-level sustained evidence.

## 11. Primary references

- [Three.js WebGLRenderer](https://threejs.org/docs/pages/WebGLRenderer.html)
- [Shadow pass implications](https://threejs.org/manual/pages/shadows.html)
- [Instancing](https://threejs.org/docs/pages/InstancedMesh.html)
- [LOD hysteresis](https://threejs.org/docs/pages/LOD.html)
- [Physical-material cost](https://threejs.org/docs/pages/MeshPhysicalMaterial.html)
- [Explicit disposal](https://threejs.org/manual/pages/how-to-dispose-of-objects.html)

The proposed numeric budgets are project choices, not values asserted by those sources.
