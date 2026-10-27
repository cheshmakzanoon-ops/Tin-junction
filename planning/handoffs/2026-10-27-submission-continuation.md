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

The actual recording and synthesized-tap archive identify the remaining defect: the Done button's advertised accessibility rectangle was larger than its interactive pill. The real tap landed outside the visible pill, and the guide stayed open. [Measured failure evidence](../../evidence/P04-T06-help-hit-area-review.md) preserves the artifact identities/hashes and coordinates. Repair `79789aec2894bcf578506997b3bd0da542fa36e1` moves the expanding rectangular hit area inside the Button label and separates surrounding padding into a container. The platform dismissal assertion remains; the basic help smoke test now also demands real dismissal. Its actual [native run 40446175188](https://github.com/cheshmakzanoon-ops/Tin-junction/actions/runs/40446175188) is pending behind an earlier running revision. CI state records this as running, never passed. This executor has no Swift compiler.

Follow-up checkpoint `acbcafdff745f3901ca0b299d7e9b7969090e6ee` closes the terminal-failure state against queued bridge messages until explicit retry. A native regression checks both rejected writes and successful explicit recovery. Native presentation also delegates app-title/save/help chrome to Swift instead of displaying a duplicated web header. The focused browser native-save/retry/session suite passes using the actual native command path. Its pending native run was replaced by the newer pending commit through the existing workflow concurrency policy; it was not a successful native result.

## Reviewed routing and graphics checkpoint

`e4e5146459d6a3df45594bc5ef5f06a5c244851d` publishes explicit turnout topology and whole-consist route protection. The coordinator accepted P05-T04 on its allowed scoped unit evidence: 63 passing track tests, including 17 new turnout tests, with source hashes matching the published commit. See [the detailed turnout handoff](2026-10-27-turnout-routing.md). This component is not yet connected to the rendered app or the native oval document. P05-T05 clearance and P06-T01 routed motion are now claimed as independent next tasks.

The next graphics checkpoint closes cottage/station gables, replaces cone/ball foliage with bounded opaque original geometry, adds correctly tagged roughness/bump data maps and removes full document JSON cloning from the render loop. Two earlier foliage revisions and the first coarse grass pattern were rejected after viewing actual runtime captures. Final overview, trackside, night and synthetic compact-native-host captures showed 157 all-pass draw calls and 268,922 all-pass triangles, versus 157 / 234,938 at baseline. These are desktop software-renderer figures, not Duo GPU measurements. The compact preview is a browser mock, not native simulator evidence.

Integrated `npm run check` passed with 100 project tests, 12 iOS tool tests and 165 web unit tests, plus TypeScript, offline build and exact bundle verification. The complete browser regression suite passed 15/15 in 4.5 minutes on these source changes, including context loss/lighting restoration, native acknowledgement deadlines, compact controls and backup recovery. Main remaining visual defects are the simplified train/buildings, sparse landscape, bead-ring pond and physically incomplete case lid. No final art approval is asserted. Case/pond corrections are the next assigned workbench scope.

## Clearance and routed-motion implementation

The next source checkpoint implements P05-T05 conservative planar clearance and its composed editor placement transaction. Invalid or incomplete drafts stay editable; collisions, unsupported grades/overpasses, excessive radius/board envelopes and unsupported joins block train placement with stable conflicting piece IDs. A failed placement preserves the previous committed train. Exact supported limits are in `web/src/track/CLEARANCE.md`.

P06-T01 adds a fixed-60-Hz routed motion authority with exact ramp distance, continuous braking lookahead, safe trailing-turnout stops, stopped reversal and bounded route history. Independent review found and fixed occupied-turnout replacement loopholes and an incorrect JSON-key-order comparison. The complete physical turnout and its attached connections are now protected even at exact endpoint contact. The motion contract and its limits are in `web/src/simulation/MOTION.md`.

TypeScript and all 204 web unit/integration tests passed before this checkpoint. The scoped clearance/placement/turnout/graph run passed 58/58; the reviewed motion/turnout/placement run passed 44/44. Exact committed-source acceptance manifests for P05-T05 and P06-T01 are prepared after source publication; their states remain active until accepted through the project CLI. Neither component is connected to the app's oval documents or controls yet. In-progress case/pond edits are outside this checkpoint.

## Parallel scopes

The coordinator owns integration, planning and publication. Prior task claims were explicitly released after inspecting the published implementation and reassigned to this continuation. The native worker owns host recovery and P01 platform verification, then the packaged asset-origin probe once P01-T01 is accepted. Track work now covers clearance/editor placement under P05-T05. The coordinator implements the route motion authority under P06-T01. Graphics work repairs existing workbench geometry under P04-T06. No running native check is recorded as passed. Final artwork, hardware performance and distribution remain unaccepted.

## Remaining release limitations

The app remains a fixed-oval development workbench. General track editing, multi-layout documents, production content/audio, physical Duo folding and sustained thermal/performance validation, final visual approval, supported Duo-only distribution, owner business/legal decisions and signed release packaging remain open. Preserve the dependency graph and all owner/device gates. The next coordinator must inspect live checks for the newest pushed revision, not reuse this baseline result.
