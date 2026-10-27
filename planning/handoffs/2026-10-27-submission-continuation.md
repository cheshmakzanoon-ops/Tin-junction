# Submission-quality continuation

## Observed baseline

The owner requested completion of the app with rigorous visual review and continuous reviewed commits. Coordination resumes on `main` from `0f312d27de28960da7f14348384ea0e72eed5495`. The checkout was clean. The previous published implementation and task claims were inspected before resuming; no uncommitted work was discarded.

The baseline [web workflow](https://github.com/cheshmakzanoon-ops/Tin-junction/actions/runs/40441273793) passed. The baseline [native workflow](https://github.com/cheshmakzanoon-ops/Tin-junction/actions/runs/40441273798) failed. Its actual artifacts show Xcode 27.1 (27A9275), iOS Simulator 27.1, an actual selected iPhone Duo Simulator, 51 passing native unit tests and two failing UI tests. Native build, handshake, lifecycle and basic help passed. The failures were keyboard name entry/readback and a help dismissal action missing from the accessibility tree after scrolling.

Local baseline `npm run check` passed: 100 project tests, 12 iOS tool tests and 143 web unit tests; types, offline build and bundle hashes passed. This executor requires normal subprocess permissions for the project validator to call Git; sandbox `EPERM` is not missing repository history. Browser interaction verification is running separately.

## First repair checkpoint

- Keep help dismissal in a fixed safe-area footer with an explicit accessible identifier.
- Scope platform-probe scrolling to the actual help List, and retain an assertion that dismissal remains hittable after scrolling.
- Wait for the actual native keyboard and reacquire the layout-name field after its resize before typing. Wait for the complete generated text to appear through accessibility before retaining the original edit/save/revision/relaunch assertions.

The keyboard diagnosis is a hypothesis pending the next actual native run. This checkpoint does not claim the failure repaired before that run completes. No required test or release criterion is removed.

## Parallel scopes

The coordinator owns integration, planning and publication. Native repair owns the three native view/UI-test files. Track investigation covers explicit turnout routes and whole-consist occupancy. Graphics investigation covers original instanced foliage and closed building gables. Feature implementation waits for the required CI repair; final artwork, hardware performance and distribution are not accepted from these investigations.

## Remaining release limitations

The app remains a fixed-oval development workbench. General track editing, multi-layout documents, production content/audio, physical Duo folding and sustained thermal/performance validation, final visual approval, supported Duo-only distribution, owner business/legal decisions and signed release packaging remain open. Preserve the dependency graph and all owner/device gates. The next coordinator must inspect live checks for the newest pushed revision, not reuse this baseline result.
