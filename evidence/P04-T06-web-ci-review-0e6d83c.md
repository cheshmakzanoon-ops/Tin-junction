# P04-T06 — completed web CI review for 0e6d83c

## Observed result and boundary

GitHub Actions [run 40467652936](https://github.com/cheshmakzanoon-ops/Tin-junction/actions/runs/40467652936) completed successfully for commit `0e6d83c24bd4e0ed5413c095ebaee1cbbc09d406`, tree `17905c8ac425085641dded2ec75fe878beaf387f`. Both the quality job `122067843689` and Blender export/Khronos validation job `122067844016` completed successfully. The downloaded Playwright report records **34 expected cases, 34 first-attempt passed results, 0 retries, 0 unexpected, 0 flaky, 0 skipped and no report or result errors**. Its `stats.ok` is `true`; reported browser duration is **1,233,296.413 ms (20 min 33.296 s)** with one worker.

This is completed desktop web evidence for the fixed-oval workbench. The unit manifest maps only **P04-T06-A2**; the integration manifest maps only the browser portion of **P04-T06-A1**. Actual native integration, whole required workflow review, coordinator task acceptance and App Store release gates remain separate. This review changes no project state and grants no owner approval.

The quality log records **108 project tests, 42 iOS-tool tests and 304 web unit tests in 22 files**, plus successful repository validation, TypeScript checking, ordinary web build/integrity verification and ordinary iOS asset assembly. These are the counts executed by this commit. The ancillary project/tool counts do not establish their full source closure or native execution.

## Evidence provenance

Both archives were downloaded, their lengths and SHA-256 hashes checked against the GitHub API, and their metadata matched to the exact commit and run. Signed temporary download URLs are not retained here.

| Artifact | ID | Downloaded bytes | SHA-256 | GitHub expiry |
| --- | ---: | ---: | --- | --- |
| [Browser diagnostics](https://github.com/cheshmakzanoon-ops/Tin-junction/actions/runs/40467652936/artifacts/12717608791) | 12717608791 | 7175918 | `d90d0720ded07d310f1e5f046b1da03a127ff2b9d6c699d9dcb0e1fa9285f4a3` | 2026-11-10T07:56:24Z |
| [Asset validation](https://github.com/cheshmakzanoon-ops/Tin-junction/actions/runs/40467652936/artifacts/12716888658) | 12716888658 | 2735 | `af9e7475774cf4d3ca7859e25600fe8f5359a2db0c01ff8876e9b04ffafb32da` | 2026-11-10T07:35:23Z |

The browser archive contains the actual HTML report, 22 browser-suite PNGs, the supplementary joint PNG/result and `dist/web/bundle-manifest.json`. The report's embedded ZIP SHA-256 is `9975fbad9a13b1002eaf02a5ffc37dbc1e499d92f028d2240f9da5b4e350347a`; its exact `report.json` SHA-256 is `9a3db8eb828e3ffc0bc38f91d72dde5692e55a3358e5fa2a0f7a5cfc0caea932`. The observations preserve each report detail-file digest, exact test title, attempt status, start time, duration, screenshot-step timing and all 23 PNG identities. Reported source locations are retained as report metadata, not asserted Git line references.

The two retained text files are exact contiguous spans of the complete decoded quality-job log, including timestamps, ANSI escapes, blank-message lines and original newlines; there is no line filtering:

- `evidence/P04-T06-web-unit-tests-0e6d83c.txt`: source log lines 166–464 inclusive, beginning at `npm run check` and ending after ordinary asset assembly, before browser installation. SHA-256 `5b422e36f3958c9a359ddb9c5c566c201058bd676ef3cc4940ab6c1678518cf0`.
- `evidence/P04-T06-web-browser-tests-0e6d83c.txt`: source log lines 719–803 inclusive, beginning at `npm run test:browser` and ending at the finalized artifact URL, including joint capture. SHA-256 `522db8968a4c944ee0fc46ab5e5b24e1110f8fa9feb0f8b4c08687caa2d182e8`.

Complete decoded quality-log SHA-256: `f573825e36502247259dce8e78beda6e275113619ff37af5855e3c40b0e39b07`. Complete decoded export-log SHA-256: `0c3236bc99b67e7ba0bd9ced5b5df5856de16efe4535f4dcc6d6679b3fd4719d`. The compact exact spans remain in Git; the larger archives are retained by GitHub until the stated expiry.

## Ordinary build and diagnostic build separation

The archived ordinary manifest has `assetOriginProbe: false`, an empty external-runtime dependency list and IIFE script format. Its exact bytes match the current locally preserved ordinary manifest input; SHA-256 `494103ad029c1a5b0d86c17d900b8197df79ba899effb4b6e8d52555f3eaadbc`. It identifies:

| Ordinary artifact | Bytes | SHA-256 |
| --- | ---: | --- |
| `index.html` | 884 | `3ea87462f52d212b4024c8242c4189bd6d2d1cc1993546ef3c4264e28a0bd437` |
| `bundle.js` | 716416 | `7ed3d0a95874f06b77a2d3234f91a1da56653ca79ab24917eba7f6915be18907` |
| `bundle.css` | 18493 | `2951fd778ea783268ebe5221297b6f5db39e33b75315636b756cbb57bd49a9b6` |
| `bundle.js.LEGAL.txt` | 188 | `cc7cc7e2f53d5db0235ab2226e85fc6e91655161573b39813b41bb00e5919674` |

These are identities recorded in a verified build manifest; the downloaded browser archive does not contain the ordinary `bundle.js` bytes or installed native resources. No native installed-container, clean-install or denied-network conclusion is derived from it.

The 32 ordinary browser cases run the packaged preview. The two cases in `asset-probe-startup.spec.ts` separately build the **actual diagnostic bundle** with `buildWeb({assetProbe:true})` in a temporary directory, load its generated manifest artifact bytes, serve them through Playwright routes and supply a synthetic native bridge. They do not overwrite the ordinary preview bundle. They passed in **27,498 ms** and **22,367 ms**, respectively, verifying delayed diagnostic start after an applied layout/completed receive callback and cancellation by a newer bootstrap.

Those two cases observe JavaScript ordering and cancellation. They require an `engine.assetProbe` report, not success of every individual asset subprobe. They do not demonstrate actual Swift receipt, WKWebView custom-origin asset support, native readiness, or installed-resource identity.

## Source scopes and historical boundaries

The formal manifests fingerprint **92 unit/workbench input files** and **70 browser integration input files**, using SHA-256 of exact `git show 0e6d83c24bd4e0ed5413c095ebaee1cbbc09d406:<path>` bytes. Later native artifact tooling or working-tree changes are excluded. The scopes retain the directly imported starter-layout JSON fixture in the unit inputs and `vite.config.ts` in the browser inputs; both omissions from the older f030 scope were identified previously. Historical manifests are not rewritten.

The seven additional current browser inputs are the new `asset-probe-startup.spec.ts`, `tests/fixtures/asset-origin/fixture-manifest.json`, its `checker.png`, `tone.wav`, `add-one.wasm` and `echo.worker.js`, plus the self-contained `tests/fixtures/assets/calibration.glb`. The builder, diagnostic runtime/styles/build flags, bridge/main source, packaged HTML and pinned configuration are already in the scope. The GLB consumes no external buffer or image. Producer scripts and Blender sources not consumed by these browser cases are not added as browser inputs.

The historical 02d and 2b full browser runs each had a first-attempt resize failure followed by a passing retry. They remain distinct historical outcomes. This current run contains the reviewed exact `{width:600,height:500}` poll with a 10,000 ms bound while retaining the 30,000 ms overall test timeout. The actual current resize/lifecycle case passed once in **22,185 ms**. Its prior failed traces and one-case local correction are retained in the 02d records; this clean current run does not erase them or establish a causal performance diagnosis.

## Actual 34-case result list

Every listed case has one result with `status: passed`, `retry: 0`, `outcome: expected` and an empty error array. Durations below are exact report milliseconds, not inferred from rounded console output.

| # | Spec | Exact test title | Duration (ms) |
| ---: | --- | --- | ---: |
| 1 | `asset-probe-startup.spec.ts` | diagnostic renderer waits for applied layout and the completed receive callback | 27498 |
| 2 | `asset-probe-startup.spec.ts` | a new bootstrap cancels both an unapplied request and an already scheduled diagnostic | 22367 |
| 3 | `control-accessibility.spec.ts` | essential controls stay readable and hittable at 1100x760 | 51933 |
| 4 | `control-accessibility.spec.ts` | essential controls stay readable and hittable at 390x844 | 36812 |
| 5 | `control-accessibility.spec.ts` | essential controls stay readable and hittable at 358x300 | 29852 |
| 6 | `control-accessibility.spec.ts` | essential controls stay readable and hittable at 844x390 | 34844 |
| 7 | `interaction-quality.spec.ts` | an interrupted editor tap cannot place scenery after native viewport | 29576 |
| 8 | `interaction-quality.spec.ts` | an interrupted editor tap cannot place scenery after native inactive | 32923 |
| 9 | `interaction-quality.spec.ts` | an interrupted editor tap cannot place scenery after document hidden | 32976 |
| 10 | `interaction-quality.spec.ts` | an interrupted editor tap cannot place scenery after canvas resize | 46426 |
| 11 | `interaction-quality.spec.ts` | a fresh touch can place scenery after an interrupted touch is canceled | 46566 |
| 12 | `interaction-quality.spec.ts` | camera input cannot place scenery after drag away and return | 35216 |
| 13 | `interaction-quality.spec.ts` | camera input cannot place scenery after right click | 30060 |
| 14 | `interaction-quality.spec.ts` | camera input cannot place scenery after middle click | 28879 |
| 15 | `interaction-quality.spec.ts` | camera input cannot place scenery after Control click | 28293 |
| 16 | `interaction-quality.spec.ts` | camera input cannot place scenery after Meta click | 29423 |
| 17 | `interaction-quality.spec.ts` | camera input cannot place scenery after Shift click | 30685 |
| 18 | `interaction-quality.spec.ts` | pressing and releasing a camera modifier cancels an already held editor tap | 31186 |
| 19 | `interaction-quality.spec.ts` | an 80-character railway name leaves controls clear at 1100x760 | 32046 |
| 20 | `interaction-quality.spec.ts` | an 80-character railway name leaves controls clear at 382x575 | 27615 |
| 21 | `interaction-quality.spec.ts` | an 80-character railway name leaves controls clear at 358x300 | 20989 |
| 22 | `interaction-quality.spec.ts` | an 80-character railway name leaves controls clear at 844x390 | 22918 |
| 23 | `interaction-quality.spec.ts` | Save remains readable against every canvas background | 59693 |
| 24 | `railway.spec.ts` | drive, brake and safely reverse the actual train controls | 49371 |
| 25 | `railway.spec.ts` | place scenery on the board and undo/redo one complete transaction | 52047 |
| 26 | `railway.spec.ts` | name, light and reopen a saved layout with the train stopped | 64319 |
| 27 | `railway.spec.ts` | corrupt current generation restores an identified previous save | 40628 |
| 28 | `railway.spec.ts` | native bridge queues edits behind a durable acknowledgment and rejects stale sessions | 41264 |
| 29 | `railway.spec.ts` | pinch gesture does not commit scenery and focused buttons keep keyboard activation | 31817 |
| 30 | `railway.spec.ts` | portrait controls and name editing stay usable as the viewport shrinks | 42708 |
| 31 | `scene-recovery.spec.ts` | restoring a context also restores generated lighting, not just frame delivery | 58974 |
| 32 | `smoke.spec.ts` | offline bundle renders the operating miniature with no external requests | 28052 |
| 33 | `smoke.spec.ts` | bridge validation, lifecycle pause/resume and resize are observable | 22185 |
| 34 | `smoke.spec.ts` | WebGL context loss pauses and restoration resumes the same harness | 22376 |

The bounded screenshot cases also completed: saved-name/night/reopen took 64,319 ms with its screenshot step at 13,175 ms; lighting recovery took 58,974 ms with screenshot steps at 6,238 and 6,236 ms. These observations preserve the actual configured quality and assertions; they are not device performance measurements.

## Actual capture inspection

Five actual downloaded PNGs were opened directly for this review. Their identities are:

| Archive entry | Dimensions | SHA-256 |
| --- | --- | --- |
| `test-results/first-railway-overview.png` | 1280×720 | `0681c2c78b33f8603ad2a8560649d7461212c9b70e8d53e4fadb92b9118fa700` |
| `test-results/first-railway-night-restored.png` | 1280×720 | `d2bd29e2204f982de116935f58644e50f8a2dfeeb18eab3e977c41919973cee7` |
| `test-results/scene-recovery-restoring-a-e3bfb-ing-not-just-frame-delivery-chromium-harness-not-device-proof/lighting-before-loss.png` | 1280×720 | `0681c2c78b33f8603ad2a8560649d7461212c9b70e8d53e4fadb92b9118fa700` |
| `test-results/scene-recovery-restoring-a-e3bfb-ing-not-just-frame-delivery-chromium-harness-not-device-proof/lighting-after-restore.png` | 1280×720 | `4013bad8ced37e2ad7692b1da21a9bec48a499c4e42876620d43524d71f3a583` |
| `test-results/track-joints/joints.png` | 1280×1050 | `b51e89eeb0b993f66dbca6b1d9e9a0dd382cbc2c66c10b2c5f38e856cb910f0e` |

The overview retains the board, track, train, buildings, trees and pond with readable primary controls; no obvious missing scene or overlapping primary control is visible in that frame. Restored night shows **Cedar crossing**, **Saved on this device**, the selected Night control and **0 mm/s**. The recovery pair retains the same visible scene and broad lighting appearance, with **The railway is ready again** after restoration. This is a bounded visual observation, not a claim of pixel identity.

The upper case lid remains cropped in the overview/recovery framing. The supplementary image contains all four labeled joint panels; the visible central profiles have no obvious gap at this image resolution, while close-up endpoints are outside the frame. The automated joint result reports all four pairings compatible, triangle counts **9192, 9156, 17568 and 17484**, and `errors: []`. Its JSON SHA-256 is `134aba1c1ae5fa5a6aecc2e4623afd474d22a09c06e9fcec8a07129be5fa91d6`. This separate fixture is outside the 70-file browser manifest scope and does not accept a general track graph or final manufactured seams.

All 23 PNG sizes, dimensions and hashes are preserved in the observations. Only the five listed images were visually inspected here. These captures do not confer production art approval, native/device accessibility, motion quality, or physical-device performance acceptance.

## Remaining scope limits

Native bridge acknowledgments, viewport/lifecycle messages, visibility changes, touch/CDP gestures and browser WebGL loss are controlled fixtures. They do not establish Swift Application Support durability, real UIKit interaction, WKWebView process termination recovery, native lifecycle delivery, VoiceOver, maximum Dynamic Type or a physical foldable device. The diagnostic tests exercise a real generated web bundle behind a synthetic bridge; that distinction remains explicit.

The fixed-oval workbench and browser development storage remain distinct from general track editing, branching-route runtime integration and native document migration. Browser generation wrapper version 2 binds checkpoint metadata; it is not integration of layout-design schema v2. Passing isolated graph, turnout, routed-consist or layout-v2 unit modules does not complete their gated roadmap tasks.

Final original artwork, actual native integration, native preferences/audio lifecycle, audio/haptics quality, real-device performance/accessibility, signed Release and distribution verification, App Store materials and owner gates remain outside this web record. Pending AudioContext resume/pause scheduling is not exercised by these tests.
