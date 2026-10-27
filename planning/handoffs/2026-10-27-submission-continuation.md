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

TypeScript and all 204 web unit/integration tests passed before source checkpoint `637b0dd348dbef0fe92b23aa32b7b0a5f7761ded`. The scoped clearance/placement/turnout/graph run passed 58/58; the reviewed motion/turnout/placement run passed 44/44. P05-T05 and P06-T01 are now accepted through the project CLI on exact committed-source evidence. See [clearance handoff](2026-10-27-planar-clearance.md) and [motion handoff](2026-10-27-routed-motion.md). Neither component is connected to the app's oval documents or controls yet.

## Passing native platform checkpoint

Both required workflows passed for `637b0dd348dbef0fe92b23aa32b7b0a5f7761ded`: [native run 40446521510](https://github.com/cheshmakzanoon-ops/Tin-junction/actions/runs/40446521510) and [web run 40446521525](https://github.com/cheshmakzanoon-ops/Tin-junction/actions/runs/40446521525). The native run compiled the public platform adapter and passed 52 unit tests and five UI tests, including real keyboard entry, exact-name save/relaunch, help dismissal and terminal-failure recovery. P01-T01 is accepted with the [native observations and handoff](../../evidence/P01-T01-native-review.md) and separate official-source review. All three requested orientations still reported the same portrait viewport; this does not establish actual rotation or physical fold behavior. No observed nil-hinge callback or physical-device performance is claimed. The older pending 79789ae run was cancelled by workflow concurrency; the later successful revision includes its help repair.

## Case, pond and portable document checkpoint

The case now has matching full-size base/lid geometry, a real cavity, coaxial alternating hinge knuckles, attached handle hardware, latch keepers and grounded feet. The original pond has an irregular recessed shoreline with embedded rocks and a dry clearance strip where valid oval routes approach it. The coordinator rejected an initial overview that made the railway too small; the reviewed overview frames the whole board, with the upper lid naturally outside the frame. Actual overview, trackside, night and compact browser-preview captures recorded 161 all-pass draw calls and 281,572 all-pass triangles with no JavaScript errors. This is desktop evidence; the compact host is synthetic. The supported case pose remains open-only and is not P20 folding acceptance. The train/buildings and scene density still require visual refinement.

P07-T01 introduces an isolated version-2 design document with connected track, explicit turnout selections, catalog vehicle identities, retained motion history and bounded scenery. Swift and TypeScript consume the same 46 valid/invalid fixtures. The web suite passes 50 document tests and rejects unsupported versions, unsafe checkpoints and runtime handles. Serialization preserves full numeric precision and stable logical order. Incomplete editable designs remain valid files; operating clearance is a separate mandatory gate. The current app still uses version 1, so this contract does not yet implement migration or save-store integration. Native conformance remains pending an actual compiled run.

An additional `Native model conformance` workflow compiles and runs the Swift unit target through a separate fixed-scope `tools/ios/test-models.sh`. The exact passing full native runner and required `iOS Simulator` workflow remain unchanged. This focused lane cannot substitute for full UI/device/release evidence. All 17 runner/selector tool tests pass locally.

## Parallel scopes

The coordinator owns integration, planning, the P07-T01 document contract and publication. The native worker is now assigned P01-T02's opt-in packaged asset-origin probe. Track work covers P06-T02's rigid vehicle/wheel/coupler poses and atomic motion-to-pose gate. A separate graphics worker refines existing train geometry under P04-T06 while preserving the fixed vehicle dimensions. These workers have disjoint source scopes and do not publish independently. Final artwork, hardware performance and distribution remain unaccepted.

## Remaining release limitations

The app remains a fixed-oval development workbench. General track editing, multi-layout documents, production content/audio, physical Duo folding and sustained thermal/performance validation, final visual approval, supported Duo-only distribution, owner business/legal decisions and signed release packaging remain open. Preserve the dependency graph and all owner/device gates. The next coordinator must inspect live checks for the newest pushed revision, not reuse this baseline result.
