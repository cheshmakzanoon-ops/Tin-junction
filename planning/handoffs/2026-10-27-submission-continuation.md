# Submission-quality continuation

## Observed baseline

The owner requested completion of the app with rigorous visual review and continuous reviewed commits. Coordination resumes on `main` from `0f312d27de28960da7f14348384ea0e72eed5495`. The checkout was clean. The previous published implementation and task claims were inspected before resuming; no uncommitted work was discarded.

The baseline [web workflow](https://github.com/cheshmakzanoon-ops/Tin-junction/actions/runs/40441273793) passed. The baseline [native workflow](https://github.com/cheshmakzanoon-ops/Tin-junction/actions/runs/40441273798) failed. Its actual artifacts show Xcode 27.1 (27A9275), iOS Simulator 27.1, an actual selected iPhone Duo Simulator, 51 passing native unit tests and two failing UI tests. Native build, handshake, lifecycle and basic help passed. The failures were keyboard name entry/readback and a help dismissal action missing from the accessibility tree after scrolling.

Local baseline `npm run check` passed: 100 project tests, 12 iOS tool tests and 143 web unit tests; types, offline build and bundle hashes passed. This executor requires normal subprocess permissions for the project validator to call Git; sandbox `EPERM` is not missing repository history. The full baseline browser suite subsequently passed 15/15.

## First repair checkpoint

- Keep help dismissal in a fixed safe-area footer with an explicit accessible identifier.
- Scope platform-probe scrolling to the actual help List, and retain an assertion that dismissal remains hittable after scrolling.
- Wait for the actual native keyboard and reacquire the layout-name field after its resize before typing. Wait for the complete generated text to appear through accessibility before retaining the original edit/save/revision/relaunch assertions.

Published repair: `02c0bc82746b8391fbf578cd0bed2b7bef8e1348`. Its [native run](https://github.com/cheshmakzanoon-ops/Tin-junction/actions/runs/40444287209) failed; its [web run](https://github.com/cheshmakzanoon-ops/Tin-junction/actions/runs/40444287322) passed. All 51 native unit tests and all four host smoke tests passed, including the original real keyboard rename/save/exact-name relaunch assertions. The only remaining failure was the platform probe's guide-dismissal assertion after scrolling; landscape observations did not execute.

The actual recording and synthesized-tap archive identify the remaining defect: the Done button's advertised accessibility rectangle was larger than its interactive pill. The real tap landed outside the visible pill, and the guide stayed open. [Measured failure evidence](../../evidence/P04-T06-help-hit-area-review.md) preserves the artifact identities/hashes and coordinates. The next narrow repair moves the expanding rectangular hit area inside the Button label and separates surrounding padding into a container. The platform dismissal assertion remains; the basic help smoke test now also demands real dismissal. This executor has no Swift compiler, so its validation remains pending a subsequent native run. Required failure state remains recorded until that repair's actual new CI run is observed.

Follow-up checkpoint `acbcafdff745f3901ca0b299d7e9b7969090e6ee` closes the terminal-failure state against queued bridge messages until explicit retry. A native regression checks both rejected writes and successful explicit recovery. Native presentation also delegates app-title/save/help chrome to Swift instead of displaying a duplicated web header. The focused browser native-save/retry/session suite passes using the actual native command path. Its pending native run was replaced by the newer pending commit through the existing workflow concurrency policy; it was not a successful native result.

## Reviewed routing and graphics checkpoint

`e4e5146459d6a3df45594bc5ef5f06a5c244851d` publishes explicit turnout topology and whole-consist route protection. The coordinator accepted P05-T04 on its allowed scoped unit evidence: 63 passing track tests, including 17 new turnout tests, with source hashes matching the published commit. See [the detailed turnout handoff](2026-10-27-turnout-routing.md). This component is not yet connected to the rendered app or the native oval document. P05-T05 clearance and P06-T01 routed motion are now claimed as independent next tasks.

The next graphics checkpoint closes cottage/station gables, replaces cone/ball foliage with bounded opaque original geometry, adds correctly tagged roughness/bump data maps and removes full document JSON cloning from the render loop. Two earlier foliage revisions and the first coarse grass pattern were rejected after viewing actual runtime captures. Final overview, trackside, night and synthetic compact-native-host captures showed 157 all-pass draw calls and 268,922 all-pass triangles, versus 157 / 234,938 at baseline. These are desktop software-renderer figures, not Duo GPU measurements. The compact preview is a browser mock, not native simulator evidence.

Integrated `npm run check` passed with 100 project tests, 12 iOS tool tests and 165 web unit tests, plus TypeScript, offline build and exact bundle verification. The complete browser regression suite passed 15/15 in 4.5 minutes on these source changes, including context loss/lighting restoration, native acknowledgement deadlines, compact controls and backup recovery. Main remaining visual defects are the simplified train/buildings, sparse landscape, bead-ring pond and physically incomplete case lid. No final art approval is asserted. Case/pond corrections are the next assigned workbench scope.

## Parallel scopes

The coordinator owns integration, planning and publication. Prior task claims were explicitly released after inspecting the published implementation and reassigned to this continuation. The native worker owns host recovery and P01 platform verification, then the packaged asset-origin probe once P01-T01 is accepted. Track work now covers clearance/editor placement under P05-T05. The coordinator implements the route motion authority under P06-T01. Graphics work repairs existing workbench geometry under P04-T06. No running native check is recorded as passed. Final artwork, hardware performance and distribution remain unaccepted.

## Remaining release limitations

The app remains a fixed-oval development workbench. General track editing, multi-layout documents, production content/audio, physical Duo folding and sustained thermal/performance validation, final visual approval, supported Duo-only distribution, owner business/legal decisions and signed release packaging remain open. Preserve the dependency graph and all owner/device gates. The next coordinator must inspect live checks for the newest pushed revision, not reuse this baseline result.
