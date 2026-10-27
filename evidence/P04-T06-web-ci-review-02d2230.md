# P04-T06 — completed web CI with a retained resize retry at 02d2230

Status: **unit/build checks passed; the web workflow succeeded with one flaky browser case. Whole-browser acceptance is not granted.**

[Workflow 40463712719](https://github.com/cheshmakzanoon-ops/Tin-junction/actions/runs/40463712719) tested `02d2230947528fedc3129d1d4ca43c9749cfa1c6`. GitHub reports success for quality job `122054022949` and asset-export job `122054023283`. The completed browser report separately records **31 expected, 1 flaky, 0 unexpected and 0 skipped**, with `stats.ok: false`. All 32 distinct cases ultimately passed across 33 attempts, but this was not a clean first-attempt suite. No passed whole-browser A1 manifest is created for this run.

The downloaded archives, finalized HTML report and its five detail files, failed-attempt trace, and requested runtime captures were inspected. Exact records, all case errors and attempts, capture identities, trace selections, and the 63 browser source fingerprints are retained in [observations](P04-T06-web-ci-observations-02d2230.json).

## Actual unit/build results and source scope

The actual `npm run check` step passed project validation, TypeScript checking, **108 project tests**, **42 iOS-tool tests**, and **304 web unit tests in 22 files**, then built and verified the ordinary bundle. The separate `npm run bundle:ios` step also passed. The unfiltered [unit/build log span](P04-T06-web-unit-tests-02d2230.txt) retains historical source-fingerprint warnings from project validation; those warnings did not fail the completed step.

[The unit manifest](P04-T06-web-unit-02d2230.json) maps only P04-T06-A2 and records **92 exact Git source hashes**. The web workbench subset includes deterministic model/command behavior, invalid inputs, edit transactions, browser save recovery, checkpoint-only corruption in both directions, and legacy counter normalization. Detached graph/turnout/routed-consist/layout-v2 tests do not establish that those systems are integrated into the fixed-oval runtime. Project and iOS-tool counts are ancillary pipeline results; they do not establish native execution or complete source closure for those separate suites.

The new fingerprint scopes retain the previous 91 unit/62 browser paths and add two previously omitted direct inputs: the JSON starter fixture imported by persistence tests, and the Vite preview configuration used by Playwright. Those additional files are unchanged from f030. Their inclusion corrects this new record's scope and does not revise historical evidence. Every hash was computed from `git show 02d2230947528fedc3129d1d4ca43c9749cfa1c6:<path>` bytes, not from the later working tree.

## First failure, retry, and bounded correction

The exact case **“bridge validation, lifecycle pause/resume and resize are observable”** failed its first attempt after **23170 ms** and passed retry 1 after **15193 ms**. The failure was at the tested Git source `tests/web/browser/smoke.spec.ts:36`: a five-second `expect.poll` still reported width 1280 instead of 600. Its test declaration is Git line 21; the report's test location line 34 is retained only as report metadata.

The retained trace establishes more than the retry outcome:

| Actual trace event | Monotonic time (ms) |
| --- | ---: |
| `Page.setViewportSize({width: 600, height: 500})` completed | 1145505.204 |
| Outer width poll started | 1145507.450 |
| Last in-flight width evaluation started | 1148412.200 |
| Outer poll failed at its five-second deadline | 1150507.949 |
| That same evaluation completed, returning numeric 600 | 1150753.703 |
| Its nested exact `toBe(600)` assertion completed successfully | 1150766.980 |

The original failed attempt therefore observed the natural target width **5248.499 ms after viewport-command completion**, **245.754 ms after the outer poll had failed**. No second resize or synthetic event was injected. This is evidence of a deadline expiring during a still-running evaluation, not a permanently lost resize in that attempt. The trace does not isolate the relative cost of rendering, browser scheduling, ResizeObserver dispatch or IPC; it does not establish a physical-device performance result.

Source review of the tested `main.ts` and `MiniatureScene.ts` confirms that `ResizeObserver` invokes `resize`, which immediately assigns the dimensions returned by `scene.resize()` to diagnostics. Width and height are not published by the separate two-second metrics timer. The old assertion covered width only.

The coordinator approved a narrow test-only correction: a **10000 ms** poll for exact `{width: 600, height: 500}`, retaining the existing **30000 ms** total test timeout and every other assertion. It adds height coverage; it does not inject events, change scene quality, change application resize code, or suppress retries/failures. [The separate targeted local record](P04-T06-resize-poll-local-verification-02d2230.json) preserves the modified test hash and its sole zero-retry pass. That local result does not alter this historical failed attempt or stand in for a fresh full CI run.

Failed trace: `test-results/smoke-bridge-validation-li-955c7-e-and-resize-are-observable-chromium-harness-not-device-proof/trace.zip`, **180733 bytes**, SHA-256 `6e05f1cd6eb9918744b95d53c9e68a3f7e200edf4d6da0448781e92d52997e61`. Error context: **2130 bytes**, SHA-256 `6a29c888ef004d30a00be3c0fd9a057570ea77ece8ff460004e749477f519728`. Both remain in the verified browser archive; compact exact call records and the full reported error remain in observations.

## Complete browser case inventory

Total report duration is **1203034.143 ms** (20 minutes 3.034 seconds). The command summary prints `1 flaky` and `31 passed (20.1m)`. There are no report-level errors; the failed first-attempt assertion is retained in its case result. [The original browser/capture/upload log span](P04-T06-web-browser-tests-02d2230.txt) is contiguous and unfiltered, including empty-message lines, the failed attempt, retry, joint capture, and finalized upload.

| File | Exact case title | Aggregate duration (ms) | Actual attempt results |
| --- | --- | ---: | --- |
| smoke.spec.ts | offline bundle renders the operating miniature with no external requests | 28566 | attempt 1: passed 28566 ms |
| smoke.spec.ts | bridge validation, lifecycle pause/resume and resize are observable | 38363 | attempt 1: failed 23170 ms; attempt 2: passed 15193 ms |
| smoke.spec.ts | WebGL context loss pauses and restoration resumes the same harness | 23241 | attempt 1: passed 23241 ms |
| control-accessibility.spec.ts | essential controls stay readable and hittable at 1100x760 | 49459 | attempt 1: passed 49459 ms |
| control-accessibility.spec.ts | essential controls stay readable and hittable at 390x844 | 36330 | attempt 1: passed 36330 ms |
| control-accessibility.spec.ts | essential controls stay readable and hittable at 358x300 | 30515 | attempt 1: passed 30515 ms |
| control-accessibility.spec.ts | essential controls stay readable and hittable at 844x390 | 35909 | attempt 1: passed 35909 ms |
| interaction-quality.spec.ts | an interrupted editor tap cannot place scenery after native viewport | 28465 | attempt 1: passed 28465 ms |
| interaction-quality.spec.ts | an interrupted editor tap cannot place scenery after native inactive | 33036 | attempt 1: passed 33036 ms |
| interaction-quality.spec.ts | an interrupted editor tap cannot place scenery after document hidden | 33588 | attempt 1: passed 33588 ms |
| interaction-quality.spec.ts | an interrupted editor tap cannot place scenery after canvas resize | 48661 | attempt 1: passed 48661 ms |
| interaction-quality.spec.ts | a fresh touch can place scenery after an interrupted touch is canceled | 43190 | attempt 1: passed 43190 ms |
| interaction-quality.spec.ts | camera input cannot place scenery after drag away and return | 40372 | attempt 1: passed 40372 ms |
| interaction-quality.spec.ts | camera input cannot place scenery after right click | 27687 | attempt 1: passed 27687 ms |
| interaction-quality.spec.ts | camera input cannot place scenery after middle click | 29132 | attempt 1: passed 29132 ms |
| interaction-quality.spec.ts | camera input cannot place scenery after Control click | 29503 | attempt 1: passed 29503 ms |
| interaction-quality.spec.ts | camera input cannot place scenery after Meta click | 29435 | attempt 1: passed 29435 ms |
| interaction-quality.spec.ts | camera input cannot place scenery after Shift click | 28688 | attempt 1: passed 28688 ms |
| interaction-quality.spec.ts | pressing and releasing a camera modifier cancels an already held editor tap | 30454 | attempt 1: passed 30454 ms |
| interaction-quality.spec.ts | an 80-character railway name leaves controls clear at 1100x760 | 34665 | attempt 1: passed 34665 ms |
| interaction-quality.spec.ts | an 80-character railway name leaves controls clear at 382x575 | 26208 | attempt 1: passed 26208 ms |
| interaction-quality.spec.ts | an 80-character railway name leaves controls clear at 358x300 | 22563 | attempt 1: passed 22563 ms |
| interaction-quality.spec.ts | an 80-character railway name leaves controls clear at 844x390 | 22754 | attempt 1: passed 22754 ms |
| interaction-quality.spec.ts | Save remains readable against every canvas background | 59955 | attempt 1: passed 59955 ms |
| railway.spec.ts | drive, brake and safely reverse the actual train controls | 47405 | attempt 1: passed 47405 ms |
| railway.spec.ts | place scenery on the board and undo/redo one complete transaction | 54806 | attempt 1: passed 54806 ms |
| railway.spec.ts | name, light and reopen a saved layout with the train stopped | 62714 | attempt 1: passed 62714 ms |
| railway.spec.ts | corrupt current generation restores an identified previous save | 40761 | attempt 1: passed 40761 ms |
| railway.spec.ts | native bridge queues edits behind a durable acknowledgment and rejects stale sessions | 30923 | attempt 1: passed 30923 ms |
| railway.spec.ts | pinch gesture does not commit scenery and focused buttons keep keyboard activation | 31979 | attempt 1: passed 31979 ms |
| railway.spec.ts | portrait controls and name editing stay usable as the viewport shrinks | 43820 | attempt 1: passed 43820 ms |
| scene-recovery.spec.ts | restoring a context also restores generated lighting, not just frame delivery | 67115 | attempt 1: passed 67115 ms |

All four newly added modifier-cancellation cases passed on their first attempt. These fixtures verify that camera gestures cannot place scenery and that a fresh ordinary click still works; they do not separately measure camera displacement.

## Actual captures and supplementary joint fixture

The browser archive contains **22 packaged-suite PNG captures** and **one additional four-panel joint capture**. An independent read-only inspection viewed the overview, restored night railway, both recovery-lighting frames, and joint image. It found no concrete new control clipping/overlap, missing board/train/scenery region, or broad post-recovery lighting darkening in those five images. The night capture visibly shows `Cedar crossing`, `Saved on this device`, Night selected, and `0 mm/s`. The recovered status reads `The railway is ready again.`

The overview/recovery framing crops the upper case lid; its complete outline was not inspected. All four joint panels and labels render, with central profiles appearing continuous at the captured resolution; closeups crop the rail ends. These observations do not establish pixel equivalence, motion quality, physical tolerances or production-art approval.

The separate joint-capture step succeeded. Its actual results report four compatible views with **9192, 9156, 17568 and 17484 triangles**, and `errors: []`. It is supplementary fixture evidence outside the 63-file browser source scope, not acceptance of general track graphs or final manufactured seams.

## Verified artifact and packaging identity

| Artifact | ID | Downloaded ZIP bytes | SHA-256 |
| --- | ---: | ---: | --- |
| [Browser diagnostics](https://github.com/cheshmakzanoon-ops/Tin-junction/actions/runs/40463712719/artifacts/12715728330) | 12715728330 | 7949573 | `5f68d27f8b97f2a421a0ec2d4122d04e9425fa1ac191e7371e8863d98d2337c3` |
| [Asset validation](https://github.com/cheshmakzanoon-ops/Tin-junction/actions/runs/40463712719/artifacts/12715467267) | 12715467267 | 2740 | `d9d653174ee2a2912e75a532ae0e5b44a0555ff26b81019e1d4639db85e65906` |

Both downloaded digests match GitHub metadata. The archived ordinary manifest has `assetOriginProbe: false` and identifies `bundle.js` as **716308 bytes**, SHA-256 `cb73662ef54a78a8f0f980d95bbb4a41ee4f9b3b6729ae30059e9dabfccc93ec`, matching the expected ordinary build. The web archive contains the manifest and build metadata, not the actual `bundle.js` bytes or an installed native bundle. CI's successful assembly/integrity steps and the archived manifest are packaging evidence. Artifact expiry is 2026-11-10 according to retrieved metadata; compact logs, attempts, source/capture identities and trace observations remain in Git.

## Boundaries and remaining gates

The runtime remains the procedural fixed-oval development workbench. Desktop Chromium with SwiftShader runs the browser storage fallback and synthetic native bridge/lifecycle/viewport messages. These results do not establish Swift disk durability, UIKit gestures, native lifecycle delivery, WKWebView process recovery, actual VoiceOver, maximum Dynamic Type, physical folding, clean native installation, installed resource identity or denied-network native operation.

The unrelated storage wrapper version 2 does not integrate the detached layout-design schema v2 or complete production migration. General editing/track integration, original production assets, compression, audio/haptics quality, physical-device sustained performance, signing/distribution and owner release gates remain separate. This run and the targeted correction do not grant P04-T06, P02, whole-browser, native, production-art or App Store acceptance.

Only the expressly approved smoke-test poll and these new evidence records were written for this investigation. No local full-suite rerun, build, application viewport change, scene-quality change, workflow/state change or commit was performed by this reviewer.
