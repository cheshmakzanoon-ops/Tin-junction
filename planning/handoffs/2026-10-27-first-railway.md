# First operating railway — implementation and verification

## Published implementation

First playable checkpoint: `299619d6924d2c631c8f58d3eeb5f0e779066cbe` on `main`.

Refined scene, interaction suite and provenance checkpoint: `06378af5861875a13a38c361effa9c64304a10cb`. Its [native run](https://github.com/cheshmakzanoon-ops/Tin-junction/actions/runs/40433242622) passed all 46 unit and four UI tests, and exported genuine [simulator captures](https://github.com/cheshmakzanoon-ops/Tin-junction/actions/runs/40433242622/artifacts/12704080071). Its [web run](https://github.com/cheshmakzanoon-ops/Tin-junction/actions/runs/40433242567) passed repository/type/bundle/unit checks and ten browser tests; the compound lighting recovery test passed its pixel/state assertions on the first attempt, then exceeded the 30-second total test budget while taking the final screenshot. Its retry also timed out; the required job remains failed. The final checkpoint gives that compound test the same 60-second total budget as the interaction suite, retaining its pixel tolerance, state assertions and bounded condition waits. It also adds protected-save UI and stronger edited-layout native verification; record the subsequent implementation's actual result before completing P04-T06.

The bounded workbench in [ADR-0006](../../docs/decisions/ADR-0006-first-operating-workbench.md) replaces the original calibration scene with a working railway. [The implemented contract](../../docs/architecture/FIRST_WORKBENCH.md) is the exact behavior/schema reference.

## Delivered

- Pure deterministic 60 Hz oval model, seeded starter, rigid axle/coupler placement and a three-vehicle consist.
- Throttle, braking, stopped reversal, wheel-driven animation and user-triggered synthesized whistle.
- Original procedural walnut/brass case, profiled rails, ballast/sleepers, terrain, station, pond, buildings and scenery; day/evening/night and three camera views.
- Validated scenery placement/move/rotate/remove, atomic undo/redo, editable name and stable IDs.
- Strict matching native/web document validators and a shared fixture; native current/previous atomic generations with SHA-256, revision/checkpoint checks, corruption recovery and explicit failed-save UI.
- Session-aware restore/acknowledgment transport, bounded retries and in-flight request coalescing. A restored train is stopped; unknown/stale input cannot mutate the active layout.
- Browser interaction tests for operation, editing, durable acknowledgments, saved restore, corruption recovery, pinch/keyboard behavior and portrait controls.
- WebGL context restoration regenerates the GPU environment lighting; a pixel-based regression checks the recovered appearance.

## Evidence observed so far

The first implementation's [repository/web Actions run](https://github.com/cheshmakzanoon-ops/Tin-junction/actions/runs/40431721192) passed. Its logs confirm 60 project tests, 8 simulator-selection tests, 91 web unit tests and the three original packaged browser regression tests. The [native simulator run](https://github.com/cheshmakzanoon-ops/Tin-junction/actions/runs/40431721076) compiled and passed all 46 unit tests, then failed before any of the four UI test methods began. Its runner crashed while loading Accessibility (`dyld_sim` / `UIApplication._accessibilityInit` / `XCUIInitializeForUITesting`), with no application assertion failure. The [retained result artifact](https://github.com/cheshmakzanoon-ops/Tin-junction/actions/runs/40431721076/artifacts/12702593951) preserves the diagnostics. The required job remains failed until a fresh complete run passes; no tests or assertions were bypassed.

The final local `npm run check`, `npm run bundle:ios` and integrated `npm run test:browser` passed: 60 project checks, 8 simulator-selection tests, 91 web unit tests and all 11 actual browser tests (2.9 minutes). The final browser suite includes the pixel-based environment-lighting recovery regression. The seven procedural asset entries validate against the catalog schema and carry current measured source hashes. Local Swift is unavailable on Linux; native compilation and UI results come from the actual Actions runner.

## Review-driven repairs

Real checks exposed and repaired undersized curve compatibility, terrain hidden by lining, case framing on portrait screens, serialized-key-order corruption, same-revision structural saves, duplicate native save flooding, stale-session editor state, pinch-to-place ambiguity, focused-button Space handling, backwards clock timestamps and lost environment lighting after context restoration. Night floating text now has a separate readable palette.

The final audit also found contradictory retry instructions for protected saves. Corrupt/stale/conflicting generations now pause saving in both interfaces, while ordinary write failures keep their retry. The focused actual browser acknowledgment/protection regression passed after this repair. A concrete 358 × 300 keyboard-sized viewport reproduced a collapsed name editor; the compact layout now keeps the input and Close control reachable, with an actual hit-target/edit/close regression passing. The stronger native reopen test changes a name through real WebKit controls, waits for that revision's acknowledgment, and verifies the exact name after termination/relaunch; it cannot pass from an older factory save. The authored native suite is now 47 unit and four UI tests, awaiting execution on the next published revision.

## Current boundaries

This is an operating **development slice**, not completed P05/P06/P07 or final artwork. The fixed oval has no turnout graph, signals, arbitrary track editor, full document library, production native audio/haptics, broad migrations/imports or completed fold ergonomics. The procedural catalog has no fabricated final approvals. Physical-device performance/thermals, reference-matched hyperrealism, supported exclusive distribution, name/rights and release approvals remain open.

## Next action

Finish the required fresh native run for the refined implementation and record its exact SHA/run. The five P04 kernel tasks are complete using observed published evidence. Complete P04-T06 only after the packaged native run passes. After this slice, run `npm run project:next`: the remaining platform/packaged-loader probes and secure bridge production work retain their original priority and dependencies. Preserve schema-v1 layouts when adding the full track graph.
