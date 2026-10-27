# First-frame diagnostic and preserved feature work

Current published `eea6f0db5e3f7511663506ab580d3a4848ce8abc` failed full native run **40484196926**. All 88 units and seven of eight UI cases passed; only the first asset-probe readiness check failed. Installed and clean-reinstall checks were skipped. Web run40484196997 and focused native run40484197052 succeeded. The [open recurrence incident](../../evidence/INC-NATIVE-RECURRENCE-20261027.md) preserves both failing executions and the earlier passing history.

The new trace shows a 10.356-second HTML-to-commit gap before the script was supplied, then a finished navigation with no first-frame `web.ready` before the existing startup deadline. Original WebKit logs reported unresponsiveness before navigation. This is not yet an exclusive cause. The same test's termination and the later save/relaunch case succeeded. All compact originals and the recovered target/unit logs were independently verified.

## Immediate action

Publish only the follow-up diagnostic and factual incident records. `WebStartupDiagnostic` uses an explicitly enabled, single public JavaScript state read after navigation finish. Its fixed document-start counters collect no error contents. The exact primitive report, request/return phase/window timing, independent missing-callback event and stale ownership rules leave app readiness unchanged. Native parser tests and actual WebKit execution must run on the resulting SHA. Do not treat a passing instrumented run alone as an explanation or repair.

The coordinator owns index, state, publication and shared build integration. Keep all unfinished features outside this diagnostic commit. Do not lengthen deadlines, retry failures into passes, weaken assertions, modify concurrency groups or discard old artifacts.

## Preserved work, still in progress

- **P01-T03:** manifest-bound asynchronous resource reads, exact resource/path/MIME policy, no-follow descriptor reads, cancellation scheduler and bounded JSON preflight. Owned native files are frozen. New actual WebKit resource tests use a connected UIWindowScene with bounded cleanup. No actual SDK result for these files yet.
- **P02-T03:** versioned native preferences, safe invalid-data handling, native Settings/Help and large-text/VoiceOver fixtures; independent media/haptic policy and held-delivery race tests. Web v4, including required native audio availability, passed the full local source/build check (330 web units) and seven focused browser cases. The complete 49-case browser regression is in progress against unchanged served bytes. Original 10-pass/two-failure fixture run remains preserved. New native settings/media/UI tests remain uncompiled.
- **P10-T03:** 27 frozen fixture/tool/runtime files; 17 source regressions, actual pinned decode, official KTX checks and three private browser material views passed. A supported upstream source build avoids JavaScript string evaluation. The new isolated build helper passed six tests. Root has proposed a separate Debug WASM-only document in ADR-0008; shared build/dispatch, exact native entry/report and packaged captures remain unintegrated. No native or production compression acceptance.

New feature source is preserved in the shared worktree, not part of the tested diagnostic baseline. Compression HTML/helper additions are not imported by the frozen ordinary browser build. No task can be completed against historical source identities or while the incident remains open.

The procedural workbench still needs readable guidance at compact sizes, production train/case/scenery art, material/lighting refinement and general editor integration. Physical Duo validation, supported exclusive distribution, rights/name clearance, final art approval, signing and submission authorization remain external gates.
