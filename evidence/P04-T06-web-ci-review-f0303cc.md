# P04-T06 — actual completed web CI at f0303cc

Status: **passed web unit/build and desktop browser integration evidence**. This review does not grant native, whole-task, physical-device, production-art, or release acceptance.

[Workflow 40458903202](https://github.com/cheshmakzanoon-ops/Tin-junction/actions/runs/40458903202) tested `f0303cc9a9f49e48902350b14f526d5dcdbda3de`. Completed GitHub records report success for quality job `122038591432` and asset-export job `122038591766`. The decoded final logs, downloaded archives, embedded HTML-report data, and actual runtime captures were inspected read-only. The two archive digests matched their GitHub metadata. Detailed records and all capture identities are in [observations](P04-T06-web-ci-observations-f0303cc.json).

## Unit/build evidence and A2 scope

The actual `npm run check` step passed repository validation, TypeScript checking, **108 project tests**, **28 iOS-tool tests**, and **301 web unit tests in 22 files**, then built and verified the ordinary bundle. `npm run bundle:ios` also succeeded. Project validation reported historical source-fingerprint warnings; its completed step still succeeded. See the [unaltered unit/build log span](P04-T06-web-unit-tests-f0303cc.txt).

The companion `P04-T06-web-unit-f0303cc.json` maps **only P04-T06-A2** and uses the coordinator's 91 exact source fingerprints, independently matched against this tested Git commit. Its workbench scope includes deterministic model/command behavior, invalid input, bounded edit transactions, and malformed/stale/recovered browser documents. The 108 project and 28 iOS-tool results are ancillary pipeline checks. The 301-test total also includes graph, turnout, routed-consist, geometry, and v2 document modules that do not establish integration of those later systems into the running fixed-oval workbench.

## Full browser completion and A1 scope

The finalized HTML report contains **28 expected outcomes, 0 unexpected, 0 flaky, 0 skipped, and no report errors**. All five detailed report files were decoded: each of the 28 distinct cases has exactly one result, `status: passed`, `retry: 0`, and no errors. Total report duration is **601122.926 ms** (10 minutes 1.123 seconds); the console rounds this to `28 passed (10.0m)`. The [unaltered browser/capture log span](P04-T06-web-browser-tests-f0303cc.txt) preserves the complete result list, successful joint capture, and finalized artifact upload.

The companion `P04-T06-web-integration-f0303cc.json` maps **only the browser portion of P04-T06-A1** using the coordinator's 62 exact source fingerprints, independently matched to the tested Git bytes. The web application and scene bytes are unchanged from d1; the web tests/workflow changed only the scoped capture/test/job budgets. The formerly overrunning saved-layout and recovery cases completed in **35708 ms** and **32147 ms**, with final captures of **6454 ms** and **2408 ms** respectively. This run's shorter duration does not establish a renderer performance improvement caused by changing deadlines.

### Exact case inventory

Durations below are the integer millisecond values in the completed report, not rounded console estimates. Every row passed on attempt 1. File names are report identities; report line locations are retained separately as metadata rather than asserted Git source line numbers.

| File | Exact case title | Duration (ms) |
| --- | --- | ---: |
| control-accessibility | essential controls stay readable and hittable at 1100x760 | 28460 |
| control-accessibility | essential controls stay readable and hittable at 390x844 | 18842 |
| control-accessibility | essential controls stay readable and hittable at 358x300 | 16294 |
| control-accessibility | essential controls stay readable and hittable at 844x390 | 17609 |
| interaction-quality | an interrupted editor tap cannot place scenery after native viewport | 17777 |
| interaction-quality | an interrupted editor tap cannot place scenery after native inactive | 18630 |
| interaction-quality | an interrupted editor tap cannot place scenery after document hidden | 19419 |
| interaction-quality | an interrupted editor tap cannot place scenery after canvas resize | 28661 |
| interaction-quality | a fresh touch can place scenery after an interrupted touch is canceled | 28512 |
| interaction-quality | camera input cannot place scenery after drag away and return | 22223 |
| interaction-quality | camera input cannot place scenery after right click | 17612 |
| interaction-quality | camera input cannot place scenery after middle click | 16872 |
| interaction-quality | an 80-character railway name leaves controls clear at 1100x760 | 20205 |
| interaction-quality | an 80-character railway name leaves controls clear at 382x575 | 14244 |
| interaction-quality | an 80-character railway name leaves controls clear at 358x300 | 10823 |
| interaction-quality | an 80-character railway name leaves controls clear at 844x390 | 12751 |
| interaction-quality | Save remains readable against every canvas background | 31687 |
| railway | drive, brake and safely reverse the actual train controls | 28532 |
| railway | place scenery on the board and undo/redo one complete transaction | 28125 |
| railway | name, light and reopen a saved layout with the train stopped | 35708 |
| railway | corrupt current generation restores an identified previous save | 23388 |
| railway | native bridge queues edits behind a durable acknowledgment and rejects stale sessions | 21426 |
| railway | pinch gesture does not commit scenery and focused buttons keep keyboard activation | 19305 |
| railway | portrait controls and name editing stay usable as the viewport shrinks | 21451 |
| scene-recovery | restoring a context also restores generated lighting, not just frame delivery | 32147 |
| smoke | offline bundle renders the operating miniature with no external requests | 16642 |
| smoke | bridge validation, lifecycle pause/resume and resize are observable | 13756 |
| smoke | WebGL context loss pauses and restoration resumes the same harness | 14664 |

## Actual captures and supplementary joint fixture

The browser archive contains **22 PNG captures from the packaged suite**, the finalized HTML report, and **one additional four-panel joint capture**. The observations retain each PNG's exact dimensions, bytes, and SHA-256. An independent read-only inspection viewed the overview, restored night railway, both recovery-lighting images, and joint fixture:

- No newly observed control clipping/overlap, missing scene region, or broad recovery-lighting darkening in those captures.
- The restored night capture visibly shows `Cedar crossing`, `Saved on this device`, Night selected, and `0 mm/s`.
- Recovery composition and lighting appear consistent; the restored status reads `The railway is ready again.`
- All four joint panels render, with the visible central rail profiles appearing continuous at this image scale. The overview crops the upper case lid, so its full outline is not inspected.

The separate `node tests/fixtures/track/capture-joints.mjs` step completed successfully. Its actual `results.json` records four compatible views with 9192, 9156, 17568, and 17484 triangles respectively, and `errors: []`. This is supplementary fixture evidence; it is not the basis for the browser manifest's 62-file A1 scope or acceptance of the complete general track graph or final rail seams.

## Verified artifact identity

| Artifact | GitHub artifact ID | Downloaded ZIP bytes | SHA-256 |
| --- | ---: | ---: | --- |
| [Browser diagnostics](https://github.com/cheshmakzanoon-ops/Tin-junction/actions/runs/40458903202/artifacts/12714156008) | 12714156008 | 7166726 | `91b8d2bb78718eaedfea979ea8f85e556544a6b8e54d80a73750be0a6a322108` |
| [Asset validation](https://github.com/cheshmakzanoon-ops/Tin-junction/actions/runs/40458903202/artifacts/12713138593) | 12713138593 | 2739 | `90db4c26b13626388c281861f519b3a2e38cfdeb8b053cf3073182c90ec2ca16` |

The ordinary manifest has `assetOriginProbe: false` and identifies `bundle.js` as `e1936e606f3fb93e309446b5ae210672fc3e916b1682db1c72547cd6ba5075eb`. This is preserved web packaging identity, not installed native resource verification. The large archives expire on 2026-11-10 according to retrieved metadata; compact command results, exact case durations, capture identities, report hashes, and joint results remain in Git.

## Prototype limits and remaining gates

The runtime is the original procedural **fixed-oval development workbench** described by [ADR-0006](../docs/decisions/ADR-0006-first-operating-workbench.md). The broader simulation, transaction, persistence, and bridge contracts remain defined in [simulation](../docs/architecture/SIMULATION_AND_TRACKS.md), [persistence](../docs/architecture/PERSISTENCE_AND_EDITOR.md), and [bridge](../docs/architecture/BRIDGE_PROTOCOL.md).

- These tests execute Desktop Chromium with SwiftShader on an Ubuntu hosted runner. Browser storage is the development fallback. Injected native bridge acknowledgments, lifecycle/viewport events, document visibility, touch/CDP gestures, and explicit WebGL loss exercise browser contracts; they do not establish actual Swift storage durability, UIKit gestures, WKWebView process recovery, or native lifecycle delivery.
- DOM control/readability/hit-area checks do not establish actual VoiceOver traversal, maximum native Dynamic Type, folding transitions, or physical-device accessibility.
- The ordinary bundle's request assertions and manifest do not establish a native clean install, verified installed-resource identity, or an OS-denied-network native run.
- Later graph/editor/turnout integration, v1-to-v2 migration, production geometry/content, final original art approval, audio/haptics quality, physical-device sustained performance, signed Release packaging, distribution eligibility, and owner release approval retain their separate gates.
- Actual native integration and whole-task acceptance must be reviewed separately. Neither formal web manifest, this capture inspection, nor the passing web workflow alone marks P04-T06, P02, or App Store readiness complete.

Only new f030-scoped evidence files were written by this reviewer. No app/workflow/test/state edits, commits, local builds, browser reruns, or shared-bundle changes were performed.
