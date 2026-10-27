# P01-T02 — actual transport success, audio report rejection, and remaining native UI failure

## Exact run and result

[Full native run 40455394205](https://github.com/cheshmakzanoon-ops/Tin-junction/actions/runs/40455394205), job `122027425126`, attempt 1, tested **`d1bfe55800a09fc39f7bed0d31e5fc92e3c57571`**. The native test command exited **65**. All **71 native unit tests passed**, including both new custom-origin response tests. Five existing UI tests passed; the asset-origin and initialization-failure tests failed for different observed reasons. The [actual test excerpt](P01-T02-native-failure-tests-d1bfe55.txt) preserves those distinctions.

| Test | Actual result |
|---|---|
| Asset-origin first/cold launch | Failed at `AssetOriginProbeUITests.swift:43`, waiting for `stage: complete` after tapping Play probe tone; the second launch was not reached |
| Bundled renderer handshake | Passed, 22.134 seconds |
| Host rotation/foreground smoke | Passed, 20.750 seconds; requested rotation alone does not establish an actual fold or orientation transition |
| Native Help | Passed, 13.481 seconds |
| Real keyboard edit, native save and relaunch | Passed, 57.437 seconds, including every existing save/restored-name assertion |
| Initialization-failure/Retry | Failed at `HostStartupUITests.swift:12`, waiting for the `host.retry` accessibility identifier; actual failure UI and its intended error were present |
| Platform geometry probe | Passed, 96.179 seconds; retain the actual reported measurements rather than inferring a hardware transition |

Unlike the earlier [6a attempt](P01-T02-native-failure-review-6a8f3f3.md), HostStartup launched and reached its first assertion. No `app.launch()` termination failure occurred in this attempt. The asset probe's registered XCTest teardown captured its report and screenshot, then terminated its own app, PID **7757**.

## First-launch resource observations

The initial native JSON at **05:34:52.809 UTC** and failure JSON at **05:35:42.535 UTC** are byte-identical, 1,543 bytes each, SHA-256 `f558f931c1ff03d760d6b07a821d579596f4297b8bc7127890da280029b25212`. Both were exported as named attachments; no xcresult reconstruction is necessary. The [retained observation record](P01-T02-failed-audio-observation-d1bfe55.json) contains their exact identities, decoded data, and all 102 relevant source fingerprints from the tested Git tree, including the web bootstrap and packaging inputs.

| Probe | Accepted native observation | Limit |
|---|---|---|
| Entry | `tinjunction://bundle/index.html`, WebGL2 `true` | Real packaged origin, first launch only |
| GLB | **passed**: 14 meshes, 280 triangles, **423 visible pixels** | This original calibration fixture has no embedded texture or compressed decoder |
| PNG | **passed**: 8 × 8 pixels and all four color quadrants in GPU readback | Separate image/texture path |
| Classic worker | **passed**: `asset-worker-ready:42` | Simple bundled worker, not a transcoder worker |
| WASM | **blocked**: actual compilation error names the unchanged `script-src` and absent `unsafe-eval`/`wasm-unsafe-eval` permission | No WASM execution; the CSP was not relaxed |
| KTX2 | **blocked**: no fixture or Basis transcoder is packaged | Remains disabled |
| Audio | WAV decoded: **mono, 5,760 frames at 48,000 Hz**; last accepted report remains **pending/suspended**, `stage: ready` | Completed native playback is not established |

The native wrapper records HTTP/HTTPS resource denial, cleared WebKit data, nonpersistent storage and Simulator execution. These describe the prepared WebView, not physical airplane mode or app-data removal. The native session is `6775E523-1BC5-43E5-81D6-A7B7134752DD`.

The previous response-zero transport failure is resolved for this first-launch GLB and WAV path: the actual loader parsed/rendered the GLB and decoded the audio bytes. That progress does not convert the failed two-launch integration test into a pass.

## Audio failure diagnosis and bounded repair

The actual failure screenshot displays **“Rejected invalid renderer bridge message.”** The synthesized event targeted PID 7757 at window point **(83.0, 359.277008)** in the observed **466 × 678** window. Its recording is **1398 × 2034**, exactly three times those dimensions. The point maps to pixel **(249, 1078)** inside the visible Play probe tone button in the media-time 24-second frame. The 30-second frame shows native bridge rejection. This is not evidence of a missed-button defect.

Source review identifies an invalid intermediate report. The audio handler calls `result("audio", "passed"/"blocked", ...)`, which publishes immediately, while the stage still says `ready`. Only a later `finally` changes the stage to `complete`. Native validation correctly requires `ready` to retain pending audio. Either terminal audio outcome therefore emits a report that violates the existing contract. Once rejected, the native host stays failed and retains its last accepted pending observation.

The rejected native body itself was **not recovered**. The source defect and observed rejection timing support the repair; they do not identify whether native audio would have reported passed or blocked. No completed native playback or acoustic-quality claim is made.

The [retained component regression](P01-T02-audio-transition-regression-d1bfe55.json) records every emitted payload and exact module source hashes. An isolated HTTP Chromium harness used the real module, original fixtures, unchanged packaged CSP and a trusted Playwright click:

- Before repair: `ready/pending → ready/passed → complete/passed`; one invalid transition, command exit 1.
- After repair: `ready/pending → complete/passed`; zero invalid transitions, command exit 0.
- Controlled resume-rejection fixture after repair: `ready/pending → complete/blocked`; zero invalid transitions, command exit 0. This injected browser error is a transition fixture, not a native audio capability result.

The minimal TypeScript repair sets `stage: complete` before publishing the terminal audio result. Both branches publish one valid transition; disposed probes publish nothing. Native validation, schema, CSP, actual gesture, timeouts and all original native UI assertions remain unchanged. TypeScript checking passed. The repaired working-tree source hash is retained without inventing a future commit; another actual native run is required.

## Separate initialization-failure observation

The retained full hierarchy for app PID **11462** reports the correct native status: **`The railway view could not open: renderer_initialization_failed`**. It also contains a real button labelled **Try loading again**, at frame **(114.3, 417.3, 153.7, 34.3)**. The failure image, heading, explanatory text and button all carry **`host.recovery`**. The parent overlay identifier was inherited by its children, replacing the intended `host.retry` lookup on the actual button.

Therefore the test failure does not mean the intended renderer fault failed to execute or the visible Retry button was absent. Retry and subsequent foreground assertions were not reached. The coordinator owns the bounded native containment, accessibility and minimum hit-area repair, plus the separately reviewed controlled-startup hold. This record does not claim those changes have run.

The exact hierarchy is `screenshots/81ACA215-3612-4002-B13E-107CA465356C.txt`, SHA-256 `dee9164c0d180175ed9d3f963803b6a7267539c28554d7ec971203f20ad025ca`, in the retained artifact.

## Artifact and packaging identity

[Artifact 12712522067](https://github.com/cheshmakzanoon-ops/Tin-junction/actions/runs/40455394205/artifacts/12712522067), `duo-host-40455394205-1`, was downloaded and independently hashed: **231,634,397 bytes**, SHA-256 **`683e74ecf32360b91e8c4a656cae1c075f53a6991e8a280db398f6eef31e99a9`**. Retention currently ends **2026-11-10 05:40:50 UTC**. Its full `xcodebuild.log` is **279,112 bytes**, SHA-256 **`48f26573f71a38b3d021437ffa1485d61a4f79e33d735c9892776b06ed1fa777`**.

The artifact includes `packaged-web-input-manifest.json`, 1,592 bytes, SHA-256 `9b22940396925044fefc74e00b162058c59c7bc9b9ef3cb89c9ad8d89edc9356`. This is the actual generated **packaging input**. The workflow correctly skipped installed-resource verification after test failure; neither `installed-web-manifest.json` nor `installed-web-identity.json` exists in this artifact. Installed-byte verification remains required and is not inferred from the input manifest.

The actual environment remains Xcode **27.1 / 27A9275**, macOS **27.0.1 / 26A434**, and the selected iPhone Duo Simulator on iOS **27.1**. No physical-device, completed second cold launch, final-art, sustained-performance, signed Release, distribution or owner-approval result is established here.
