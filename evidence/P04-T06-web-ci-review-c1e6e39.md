# P04-T06 — completed web CI review for c1e6e39

## Observed result and boundary

GitHub Actions [run 40475892017](https://github.com/cheshmakzanoon-ops/Tin-junction/actions/runs/40475892017) completed successfully for commit `c1e6e39ba127e064f4907e9c5a1d84fed7163990`, tree `fc1d945c5c68265b8d4fdcac45e9fa1809594aca`. Both the quality job `122093894862` and Blender export/Khronos validation job `122093894323` completed successfully. The downloaded Playwright report records **34 expected cases, 34 first-attempt passed results, 0 retries, 0 unexpected, 0 flaky, 0 skipped and no report or result errors**. Its `stats.ok` is `true`; reported browser duration is **1,165,174.290 ms (19 min 25.174 s)** with one worker.

This is completed desktop web evidence for the fixed-oval workbench. The unit manifest maps only **P04-T06-A2**; the integration manifest maps only the browser portion of **P04-T06-A1**. Actual native integration, whole required workflow review, coordinator task acceptance and App Store release gates remain separate. This review changes no project state and grants no owner approval.

The quality log records **108 project tests, 56 iOS-tool tests and 304 web unit tests in 22 files**, plus successful repository validation, TypeScript checking, ordinary web build/integrity verification and ordinary iOS asset assembly. These are the counts executed by this commit. The ancillary project/tool counts do not establish their full source closure or native execution.

## Evidence provenance

Both archives were downloaded, their lengths and SHA-256 hashes checked against the GitHub API, and their metadata matched to the exact commit and run. Signed temporary download URLs are not retained here.

| Artifact | ID | Downloaded bytes | SHA-256 | GitHub expiry |
| --- | ---: | ---: | --- | --- |
| [Browser diagnostics](https://github.com/cheshmakzanoon-ops/Tin-junction/actions/runs/40475892017/artifacts/12720769800) | 12720769800 | 7077698 | `6095be01aad7d7ee55d9766c5a7798d70c24d0f57a9841233205362fc58ff34d` | 2026-11-10T09:07:19Z |
| [Asset validation](https://github.com/cheshmakzanoon-ops/Tin-junction/actions/runs/40475892017/artifacts/12721206242) | 12721206242 | 2742 | `f5250cdb47824dd1dc7c6156e9e0910dfbbc9ebfabec821e15d2f75b70548c0f` | 2026-11-10T08:47:25Z |

The browser archive contains the actual HTML report, 22 browser-suite PNGs, the supplementary joint PNG/result and `dist/web/bundle-manifest.json`. The report's embedded ZIP SHA-256 is `26fb41e3885ff59a4dfcb5ff4a88e90f3c5cff67f6e679f495282dc7439f6d39`; its exact `report.json` SHA-256 is `79c445117efc86b8404d720b02d5b80531bda9b0df8a3bc2ec650c2c101ce979`. The observations preserve each report detail-file digest, exact test title, attempt status, start time, duration, screenshot-step timing and all 23 PNG identities. Reported source locations are retained as report metadata, not asserted Git line references.

The two retained text files are exact contiguous spans of the complete decoded quality-job log, including timestamps, ANSI escapes, blank-message lines and original newlines; there is no line filtering:

- `evidence/P04-T06-web-unit-tests-c1e6e39.txt`: source log lines 166–483 inclusive, beginning at `npm run check` and ending after ordinary asset assembly, before browser installation. SHA-256 `57f185f147e75e52d2bb32830ef9857297b70228d6ef21a24bb3a49d7f3ef264`.
- `evidence/P04-T06-web-browser-tests-c1e6e39.txt`: source log lines 738–821 inclusive, beginning at `npm run test:browser` and ending at the finalized artifact URL, including joint capture. SHA-256 `ea4db7ada16326b9436c4a344a8f482b172377dab888f542a415be9ed963f36e`.

Complete decoded quality-log SHA-256: `1b692ed9567db2400339a1156d834b80736357ed67a650c2f4d0921d268ca349`. Complete decoded export-log SHA-256: `a25bc31a2cc7e04643dad6f45567d81107d146c327b2b4fe8fa712f21a3ee072`. The compact exact spans remain in Git; the larger archives are retained by GitHub until the stated expiry.

## Ordinary build and diagnostic build separation

The archived ordinary manifest has `assetOriginProbe: false`, an empty external-runtime dependency list and IIFE script format. Its exact bytes match the locally preserved current ordinary manifest input; SHA-256 `c1d9357dacfb70793ab30f060c2ccd6b656cad89a6949bdff5675010819e0ac1`. It identifies:

| Ordinary artifact | Bytes | SHA-256 |
| --- | ---: | --- |
| `index.html` | 884 | `3ea87462f52d212b4024c8242c4189bd6d2d1cc1993546ef3c4264e28a0bd437` |
| `bundle.js` | 716416 | `7ed3d0a95874f06b77a2d3234f91a1da56653ca79ab24917eba7f6915be18907` |
| `bundle.css` | 18796 | `242d4963802fa7a1e1fa09b923d8c5568f661fad8678f124df48fbc0443825bb` |
| `bundle.js.LEGAL.txt` | 188 | `cc7cc7e2f53d5db0235ab2226e85fc6e91655161573b39813b41bb00e5919674` |

These are identities recorded in a verified build manifest; the downloaded browser archive does not contain the ordinary `bundle.js` bytes or installed native resources. No native installed-container, clean-install or denied-network conclusion is derived from it.

The 32 ordinary browser cases run the packaged preview. The two cases in `asset-probe-startup.spec.ts` separately build the **actual diagnostic bundle** with `buildWeb({assetProbe:true})` in a temporary directory, load its generated manifest artifact bytes, serve them through Playwright routes and supply a synthetic native bridge. They do not overwrite the ordinary preview bundle. They passed in **29,965 ms** and **22,538 ms**, respectively, verifying delayed diagnostic start after an applied layout/completed receive callback and cancellation by a newer bootstrap.

These two diagnostic cases were already present in 0e and 53; this title-CSS checkpoint adds no browser cases. Those two cases observe JavaScript ordering and cancellation. They require an `engine.assetProbe` report, not success of every individual asset subprobe. They do not demonstrate actual Swift receipt, WKWebView custom-origin asset support, native readiness, or installed-resource identity.

## Source scopes and historical boundaries

The formal manifests fingerprint **92 unit/workbench input files** and **70 browser integration input files**, using SHA-256 of exact `git show c1e6e39ba127e064f4907e9c5a1d84fed7163990:<path>` bytes. Working-tree changes after the tested commit are excluded. The only changed fingerprint in these two scopes versus the preceding 53 checkpoint is `web/src/style.css`, SHA-256 `6fed42682909f9a628940162ec4156f7742f578946232d00af67de8d7a6be093`. This adds an opaque theme-specific title backing and darker daytime secondary heading text while retaining the title layout rules. Every executed result, report and artifact recorded here comes from this separate c1 workflow. The native UI-test Swift helper is outside the web compilation/source closure. The 56 iOS-tool results remain ancillary observations rather than proof of native workflow execution. The scopes retain the directly imported starter-layout JSON fixture in the unit inputs and `vite.config.ts` in the browser inputs; both omissions from the older f030 scope were identified previously. Historical manifests are not rewritten.

Relative to the historical ordinary-only scope, the seven diagnostic browser inputs are `asset-probe-startup.spec.ts`, `tests/fixtures/asset-origin/fixture-manifest.json`, its `checker.png`, `tone.wav`, `add-one.wasm` and `echo.worker.js`, plus the self-contained `tests/fixtures/assets/calibration.glb`. The builder, diagnostic runtime/styles/build flags, bridge/main source, packaged HTML and pinned configuration are already in the scope. The GLB consumes no external buffer or image. Producer scripts and Blender sources not consumed by these browser cases are not added as browser inputs.

The historical 02d and 2b full browser runs each had a first-attempt resize failure followed by a passing retry. They remain distinct historical outcomes. This current run contains the reviewed exact `{width:600,height:500}` poll with a 10,000 ms bound while retaining the 30,000 ms overall test timeout. The actual current resize/lifecycle case passed once in **20,865 ms**. Its prior failed traces and one-case local correction are retained in the 02d records; this clean current run does not erase them or establish a causal performance diagnosis.

## Actual 34-case result list

Every listed case has one result with `status: passed`, `retry: 0`, `outcome: expected` and an empty error array. Durations below are exact report milliseconds, not inferred from rounded console output.

| # | Spec | Exact test title | Duration (ms) |
| ---: | --- | --- | ---: |
| 1 | `asset-probe-startup.spec.ts` | diagnostic renderer waits for applied layout and the completed receive callback | 29965 |
| 2 | `asset-probe-startup.spec.ts` | a new bootstrap cancels both an unapplied request and an already scheduled diagnostic | 22538 |
| 3 | `control-accessibility.spec.ts` | essential controls stay readable and hittable at 1100x760 | 51175 |
| 4 | `control-accessibility.spec.ts` | essential controls stay readable and hittable at 390x844 | 33776 |
| 5 | `control-accessibility.spec.ts` | essential controls stay readable and hittable at 358x300 | 28329 |
| 6 | `control-accessibility.spec.ts` | essential controls stay readable and hittable at 844x390 | 33022 |
| 7 | `interaction-quality.spec.ts` | an interrupted editor tap cannot place scenery after native viewport | 26279 |
| 8 | `interaction-quality.spec.ts` | an interrupted editor tap cannot place scenery after native inactive | 31462 |
| 9 | `interaction-quality.spec.ts` | an interrupted editor tap cannot place scenery after document hidden | 29145 |
| 10 | `interaction-quality.spec.ts` | an interrupted editor tap cannot place scenery after canvas resize | 44325 |
| 11 | `interaction-quality.spec.ts` | a fresh touch can place scenery after an interrupted touch is canceled | 42262 |
| 12 | `interaction-quality.spec.ts` | camera input cannot place scenery after drag away and return | 37767 |
| 13 | `interaction-quality.spec.ts` | camera input cannot place scenery after right click | 27419 |
| 14 | `interaction-quality.spec.ts` | camera input cannot place scenery after middle click | 26883 |
| 15 | `interaction-quality.spec.ts` | camera input cannot place scenery after Control click | 26765 |
| 16 | `interaction-quality.spec.ts` | camera input cannot place scenery after Meta click | 26940 |
| 17 | `interaction-quality.spec.ts` | camera input cannot place scenery after Shift click | 24846 |
| 18 | `interaction-quality.spec.ts` | pressing and releasing a camera modifier cancels an already held editor tap | 30496 |
| 19 | `interaction-quality.spec.ts` | an 80-character railway name leaves controls clear at 1100x760 | 32654 |
| 20 | `interaction-quality.spec.ts` | an 80-character railway name leaves controls clear at 382x575 | 26360 |
| 21 | `interaction-quality.spec.ts` | an 80-character railway name leaves controls clear at 358x300 | 18790 |
| 22 | `interaction-quality.spec.ts` | an 80-character railway name leaves controls clear at 844x390 | 21915 |
| 23 | `interaction-quality.spec.ts` | Save remains readable against every canvas background | 55944 |
| 24 | `railway.spec.ts` | drive, brake and safely reverse the actual train controls | 48863 |
| 25 | `railway.spec.ts` | place scenery on the board and undo/redo one complete transaction | 50047 |
| 26 | `railway.spec.ts` | name, light and reopen a saved layout with the train stopped | 63216 |
| 27 | `railway.spec.ts` | corrupt current generation restores an identified previous save | 35572 |
| 28 | `railway.spec.ts` | native bridge queues edits behind a durable acknowledgment and rejects stale sessions | 28708 |
| 29 | `railway.spec.ts` | pinch gesture does not commit scenery and focused buttons keep keyboard activation | 31124 |
| 30 | `railway.spec.ts` | portrait controls and name editing stay usable as the viewport shrinks | 42144 |
| 31 | `scene-recovery.spec.ts` | restoring a context also restores generated lighting, not just frame delivery | 58961 |
| 32 | `smoke.spec.ts` | offline bundle renders the operating miniature with no external requests | 26181 |
| 33 | `smoke.spec.ts` | bridge validation, lifecycle pause/resume and resize are observable | 20865 |
| 34 | `smoke.spec.ts` | WebGL context loss pauses and restoration resumes the same harness | 21523 |

The bounded screenshot cases also completed: saved-name/night/reopen took 63,216 ms with its screenshot step at 12,217 ms; lighting recovery took 58,961 ms with screenshot steps at 6,048 and 7,472 ms. These observations preserve the actual configured quality and assertions; they are not device performance measurements.

## Actual capture inspection

The evidence reviewer (`installed_bundle_evidence`) opened exactly eight actual downloaded PNGs directly for this review. Their identities are:

| Archive entry | Dimensions | SHA-256 |
| --- | --- | --- |
| `test-results/first-railway-overview.png` | 1280×720 | `7235d86c43916143a3dad84a8420339c4479b25ab1515e85f71b08c333613d3a` |
| `test-results/first-railway-night-restored.png` | 1280×720 | `00114efea3d10f5178812cfcb3cf11fa2fdbcd643a207113d09d765081f67784` |
| `test-results/scene-recovery-restoring-a-e3bfb-ing-not-just-frame-delivery-chromium-harness-not-device-proof/lighting-before-loss.png` | 1280×720 | `7235d86c43916143a3dad84a8420339c4479b25ab1515e85f71b08c333613d3a` |
| `test-results/scene-recovery-restoring-a-e3bfb-ing-not-just-frame-delivery-chromium-harness-not-device-proof/lighting-after-restore.png` | 1280×720 | `238a903ac1d73e1bf1972922237a965cb8a37f49b32ec7b1df16d85c720c5df2` |
| `test-results/track-joints/joints.png` | 1280×1050 | `b51e89eeb0b993f66dbca6b1d9e9a0dd382cbc2c66c10b2c5f38e856cb910f0e` |
| `test-results/interaction-quality-an-80--12ded-s-controls-clear-at-358x300-chromium-harness-not-device-proof/maximum-name.png` | 358×300 | `c0ed325fc416ced7fc8e4fd1e22a663129a1fbecb6512c7263e70be6e0362184` |
| `test-results/interaction-quality-an-80--77d57-s-controls-clear-at-382x575-chromium-harness-not-device-proof/maximum-name.png` | 382×575 | `2312e24c6596af9f63e01828b7e7562b25d8d48f83c82b654973b566824eee53` |
| `test-results/first-railway-night-portrait.png` | 430×900 | `a7f0557cbcb1165360843e6be0716fb1a04bcb3d7b958ab182827b94015086ee` |

The overview retains the board, track, train, buildings, trees and pond with readable primary controls; no obvious missing scene or overlapping primary control is visible in that frame. Restored night shows **Cedar crossing**, **Saved on this device**, the selected Night control and **0 mm/s**. The recovery pair retains the same visible scene and broad lighting appearance, with **The railway is ready again** after restoration. This is a bounded visual observation, not a claim of pixel identity.

The actual 358×300 maximum-name capture shows dark title text on a light backing with single-line ellipsis. The backing remains within the frame and visibly clears the lighting and camera controls. The image alone does not expose the full 80-character accessible name.

The actual 382×575 maximum-name capture shows the title on a light panel with two-line truncation and visible separation from the adjacent lighting controls. The overline and secondary heading text remain visible; no overlap between the title backing and those controls is apparent.

The actual 430×900 night-portrait capture shows Alpine afternoon in light text on the dark green title backing, visibly separated from the rendered case and clear of the adjacent lighting and camera controls. This is a visual observation of the retained frame, not a measured native contrast or accessibility result.

In the narrow daytime captures, the separate status/caption text still crosses the rendered scene. The title-backing repair and this capture review do not certify that separate readability area or all text over all camera positions.

The upper case lid remains cropped in the overview/recovery framing. The supplementary image contains all four labeled joint panels; the visible central profiles have no obvious gap at this image resolution, while close-up endpoints are outside the frame. The automated joint result reports all four pairings compatible, triangle counts **9192, 9156, 17568 and 17484**, and `errors: []`. Its JSON SHA-256 is `134aba1c1ae5fa5a6aecc2e4623afd474d22a09c06e9fcec8a07129be5fa91d6`. This separate fixture is outside the 70-file browser manifest scope and does not accept a general track graph or final manufactured seams.

All 23 PNG sizes, dimensions and hashes are preserved in the observations. Only the eight listed images were visually inspected here. These captures do not confer production art approval, native/device accessibility, motion quality, or physical-device performance acceptance.

## Remaining scope limits

Native bridge acknowledgments, viewport/lifecycle messages, visibility changes, touch/CDP gestures and browser WebGL loss are controlled fixtures. They do not establish Swift Application Support durability, real UIKit interaction, WKWebView process termination recovery, native lifecycle delivery, VoiceOver, maximum Dynamic Type or a physical foldable device. The diagnostic tests exercise a real generated web bundle behind a synthetic bridge; that distinction remains explicit.

The fixed-oval workbench and browser development storage remain distinct from general track editing, branching-route runtime integration and native document migration. Browser generation wrapper version 2 binds checkpoint metadata; it is not integration of layout-design schema v2. Passing isolated graph, turnout, routed-consist or layout-v2 unit modules does not complete their gated roadmap tasks.

Final original artwork, actual native integration, native preferences/audio lifecycle, audio/haptics quality, real-device performance/accessibility, signed Release and distribution verification, App Store materials and owner gates remain outside this web record. Pending AudioContext resume/pause scheduling is not exercised by these tests.
