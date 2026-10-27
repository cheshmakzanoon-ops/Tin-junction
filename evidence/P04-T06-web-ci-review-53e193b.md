# P04-T06 — completed web CI review for 53e193b

## Observed result and boundary

GitHub Actions [run 40471495796](https://github.com/cheshmakzanoon-ops/Tin-junction/actions/runs/40471495796) completed successfully for commit `53e193b6435d241f8c1462d859112b2cb1b56b77`, tree `9ea784f3b75a9f80181ef0c00201a38c2a795a9c`. Both the quality job `122079339273` and Blender export/Khronos validation job `122079339702` completed successfully. The downloaded Playwright report records **34 expected cases, 34 first-attempt passed results, 0 retries, 0 unexpected, 0 flaky, 0 skipped and no report or result errors**. Its `stats.ok` is `true`; reported browser duration is **1,219,125.768 ms (20 min 19.126 s)** with one worker.

This is completed desktop web evidence for the fixed-oval workbench. The unit manifest maps only **P04-T06-A2**; the integration manifest maps only the browser portion of **P04-T06-A1**. Actual native integration, whole required workflow review, coordinator task acceptance and App Store release gates remain separate. This review changes no project state and grants no owner approval.

The quality log records **108 project tests, 56 iOS-tool tests and 304 web unit tests in 22 files**, plus successful repository validation, TypeScript checking, ordinary web build/integrity verification and ordinary iOS asset assembly. These are the counts executed by this commit. The ancillary project/tool counts do not establish their full source closure or native execution.

## Evidence provenance

Both archives were downloaded, their lengths and SHA-256 hashes checked against the GitHub API, and their metadata matched to the exact commit and run. Signed temporary download URLs are not retained here.

| Artifact | ID | Downloaded bytes | SHA-256 | GitHub expiry |
| --- | ---: | ---: | --- | --- |
| [Browser diagnostics](https://github.com/cheshmakzanoon-ops/Tin-junction/actions/runs/40471495796/artifacts/12718749189) | 12718749189 | 7175453 | `466d0da983674e825a1cef2f24bf9690543a7d8700130d2e8f1cb7bbd124d9a2` | 2026-11-10T08:30:26Z |
| [Asset validation](https://github.com/cheshmakzanoon-ops/Tin-junction/actions/runs/40471495796/artifacts/12718657311) | 12718657311 | 2740 | `2c7b81a71ee41dad0055d770e6886490fbc63b8b2a1def1b605a0c9e05a3ad6e` | 2026-11-10T08:09:40Z |

The browser archive contains the actual HTML report, 22 browser-suite PNGs, the supplementary joint PNG/result and `dist/web/bundle-manifest.json`. The report's embedded ZIP SHA-256 is `b35a8c90c4078e21614743341e4634c31f009de25c8c40ad3f86128b289456d7`; its exact `report.json` SHA-256 is `0dc703a6df1807688f20613dd67ac3e2ff85e99718dbb098886ca1247d314eac`. The observations preserve each report detail-file digest, exact test title, attempt status, start time, duration, screenshot-step timing and all 23 PNG identities. Reported source locations are retained as report metadata, not asserted Git line references.

The two retained text files are exact contiguous spans of the complete decoded quality-job log, including timestamps, ANSI escapes, blank-message lines and original newlines; there is no line filtering:

- `evidence/P04-T06-web-unit-tests-53e193b.txt`: source log lines 166–481 inclusive, beginning at `npm run check` and ending after ordinary asset assembly, before browser installation. SHA-256 `e5080aa283952fefce16b7eb84238f4727c30f6d001998f880261a79c9eac50e`.
- `evidence/P04-T06-web-browser-tests-53e193b.txt`: source log lines 736–820 inclusive, beginning at `npm run test:browser` and ending at the finalized artifact URL, including joint capture. SHA-256 `8713c0519fac5c307c066504a0d1f4fecd84d761fb207ec1f3fb6152fbf902a4`.

Complete decoded quality-log SHA-256: `848bec112434048e56230a4a487c0293ee3e2e6f460f34800a414e65c3c9993e`. Complete decoded export-log SHA-256: `97a3c1a056447994ca953aa73ef555c342e856639e18c59a335fefb36dc6eedc`. The compact exact spans remain in Git; the larger archives are retained by GitHub until the stated expiry.

## Ordinary build and diagnostic build separation

The archived ordinary manifest has `assetOriginProbe: false`, an empty external-runtime dependency list and IIFE script format. Its exact bytes match the preserved expected ordinary manifest from the byte-identical 0e web inputs; SHA-256 `494103ad029c1a5b0d86c17d900b8197df79ba899effb4b6e8d52555f3eaadbc`. It identifies:

| Ordinary artifact | Bytes | SHA-256 |
| --- | ---: | --- |
| `index.html` | 884 | `3ea87462f52d212b4024c8242c4189bd6d2d1cc1993546ef3c4264e28a0bd437` |
| `bundle.js` | 716416 | `7ed3d0a95874f06b77a2d3234f91a1da56653ca79ab24917eba7f6915be18907` |
| `bundle.css` | 18493 | `2951fd778ea783268ebe5221297b6f5db39e33b75315636b756cbb57bd49a9b6` |
| `bundle.js.LEGAL.txt` | 188 | `cc7cc7e2f53d5db0235ab2226e85fc6e91655161573b39813b41bb00e5919674` |

These are identities recorded in a verified build manifest; the downloaded browser archive does not contain the ordinary `bundle.js` bytes or installed native resources. No native installed-container, clean-install or denied-network conclusion is derived from it.

The 32 ordinary browser cases run the packaged preview. The two cases in `asset-probe-startup.spec.ts` separately build the **actual diagnostic bundle** with `buildWeb({assetProbe:true})` in a temporary directory, load its generated manifest artifact bytes, serve them through Playwright routes and supply a synthetic native bridge. They do not overwrite the ordinary preview bundle. They passed in **29,105 ms** and **22,320 ms**, respectively, verifying delayed diagnostic start after an applied layout/completed receive callback and cancellation by a newer bootstrap.

Those two cases observe JavaScript ordering and cancellation. They require an `engine.assetProbe` report, not success of every individual asset subprobe. They do not demonstrate actual Swift receipt, WKWebView custom-origin asset support, native readiness, or installed-resource identity.

## Source scopes and historical boundaries

The formal manifests fingerprint **92 unit/workbench input files** and **70 browser integration input files**, using SHA-256 of exact `git show 53e193b6435d241f8c1462d859112b2cb1b56b77:<path>` bytes. Working-tree changes after the tested commit are excluded. All fingerprints in these two scopes match the preceding 0e web checkpoint, but every executed result, report and artifact recorded here comes from the separate 53 workflow. The added native artifact-tool cases are reflected in this run's actual ancillary count of 56; their native workflow behavior is outside this web source scope. The scopes retain the directly imported starter-layout JSON fixture in the unit inputs and `vite.config.ts` in the browser inputs; both omissions from the older f030 scope were identified previously. Historical manifests are not rewritten.

The seven additional current browser inputs are the new `asset-probe-startup.spec.ts`, `tests/fixtures/asset-origin/fixture-manifest.json`, its `checker.png`, `tone.wav`, `add-one.wasm` and `echo.worker.js`, plus the self-contained `tests/fixtures/assets/calibration.glb`. The builder, diagnostic runtime/styles/build flags, bridge/main source, packaged HTML and pinned configuration are already in the scope. The GLB consumes no external buffer or image. Producer scripts and Blender sources not consumed by these browser cases are not added as browser inputs.

The historical 02d and 2b full browser runs each had a first-attempt resize failure followed by a passing retry. They remain distinct historical outcomes. This current run contains the reviewed exact `{width:600,height:500}` poll with a 10,000 ms bound while retaining the 30,000 ms overall test timeout. The actual current resize/lifecycle case passed once in **23,255 ms**. Its prior failed traces and one-case local correction are retained in the 02d records; this clean current run does not erase them or establish a causal performance diagnosis.

## Actual 34-case result list

Every listed case has one result with `status: passed`, `retry: 0`, `outcome: expected` and an empty error array. Durations below are exact report milliseconds, not inferred from rounded console output.

| # | Spec | Exact test title | Duration (ms) |
| ---: | --- | --- | ---: |
| 1 | `asset-probe-startup.spec.ts` | diagnostic renderer waits for applied layout and the completed receive callback | 29105 |
| 2 | `asset-probe-startup.spec.ts` | a new bootstrap cancels both an unapplied request and an already scheduled diagnostic | 22320 |
| 3 | `control-accessibility.spec.ts` | essential controls stay readable and hittable at 1100x760 | 52716 |
| 4 | `control-accessibility.spec.ts` | essential controls stay readable and hittable at 390x844 | 36078 |
| 5 | `control-accessibility.spec.ts` | essential controls stay readable and hittable at 358x300 | 30084 |
| 6 | `control-accessibility.spec.ts` | essential controls stay readable and hittable at 844x390 | 32096 |
| 7 | `interaction-quality.spec.ts` | an interrupted editor tap cannot place scenery after native viewport | 29367 |
| 8 | `interaction-quality.spec.ts` | an interrupted editor tap cannot place scenery after native inactive | 33018 |
| 9 | `interaction-quality.spec.ts` | an interrupted editor tap cannot place scenery after document hidden | 32970 |
| 10 | `interaction-quality.spec.ts` | an interrupted editor tap cannot place scenery after canvas resize | 46462 |
| 11 | `interaction-quality.spec.ts` | a fresh touch can place scenery after an interrupted touch is canceled | 46498 |
| 12 | `interaction-quality.spec.ts` | camera input cannot place scenery after drag away and return | 40033 |
| 13 | `interaction-quality.spec.ts` | camera input cannot place scenery after right click | 29256 |
| 14 | `interaction-quality.spec.ts` | camera input cannot place scenery after middle click | 28412 |
| 15 | `interaction-quality.spec.ts` | camera input cannot place scenery after Control click | 26217 |
| 16 | `interaction-quality.spec.ts` | camera input cannot place scenery after Meta click | 28428 |
| 17 | `interaction-quality.spec.ts` | camera input cannot place scenery after Shift click | 26345 |
| 18 | `interaction-quality.spec.ts` | pressing and releasing a camera modifier cancels an already held editor tap | 30158 |
| 19 | `interaction-quality.spec.ts` | an 80-character railway name leaves controls clear at 1100x760 | 34421 |
| 20 | `interaction-quality.spec.ts` | an 80-character railway name leaves controls clear at 382x575 | 27775 |
| 21 | `interaction-quality.spec.ts` | an 80-character railway name leaves controls clear at 358x300 | 22378 |
| 22 | `interaction-quality.spec.ts` | an 80-character railway name leaves controls clear at 844x390 | 22629 |
| 23 | `interaction-quality.spec.ts` | Save remains readable against every canvas background | 60260 |
| 24 | `railway.spec.ts` | drive, brake and safely reverse the actual train controls | 49441 |
| 25 | `railway.spec.ts` | place scenery on the board and undo/redo one complete transaction | 52244 |
| 26 | `railway.spec.ts` | name, light and reopen a saved layout with the train stopped | 64550 |
| 27 | `railway.spec.ts` | corrupt current generation restores an identified previous save | 37734 |
| 28 | `railway.spec.ts` | native bridge queues edits behind a durable acknowledgment and rejects stale sessions | 28092 |
| 29 | `railway.spec.ts` | pinch gesture does not commit scenery and focused buttons keep keyboard activation | 31888 |
| 30 | `railway.spec.ts` | portrait controls and name editing stay usable as the viewport shrinks | 41094 |
| 31 | `scene-recovery.spec.ts` | restoring a context also restores generated lighting, not just frame delivery | 63968 |
| 32 | `smoke.spec.ts` | offline bundle renders the operating miniature with no external requests | 27893 |
| 33 | `smoke.spec.ts` | bridge validation, lifecycle pause/resume and resize are observable | 23255 |
| 34 | `smoke.spec.ts` | WebGL context loss pauses and restoration resumes the same harness | 22609 |

The bounded screenshot cases also completed: saved-name/night/reopen took 64,550 ms with its screenshot step at 13,127 ms; lighting recovery took 63,968 ms with screenshot steps at 6,182 and 11,004 ms. These observations preserve the actual configured quality and assertions; they are not device performance measurements.

## Actual capture inspection

An independent reviewer (`installed_bundle_evidence/web02d_review`) opened exactly five actual downloaded PNGs directly for this review. Their identities are:

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
