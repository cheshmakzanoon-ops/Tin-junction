# Startup ordering and native recovery verification

## Current checkpoint

P01-T02, P02-T01 and P04-T06 remain active; no task is accepted by this repair. The starting published revision is `2b630f16abf5cce75cc2e58efa9f99f8ab65d99f`. This checkpoint contains a narrowly scoped application repair, regression tests and historical evidence. Hosted verification of the new source is **PENDING**. The verification incident remains open.

The prior [integrity checkpoint](2026-10-27-checkpoint-integrity.md) preserves the storage-wrapper, camera-modifier and clean-install-runner changes. Their actual focused native result is now available: all **84 native units passed** at `02d2230947528fedc3129d1d4ca43c9749cfa1c6`. The [P04 unit record](../../evidence/P04-T06-native-unit-02d2230.json) and [P02 unit record](../../evidence/P02-T01-native-unit-02d2230.json) retain that tested source and its limitations. They are historical after the source changes below.

## Actual full native failures

The [02d full native run](https://github.com/cheshmakzanoon-ops/Tin-junction/actions/runs/40463712735), job `122056107043`, failed with exit 65. All 84 units passed; **six of eight UI tests passed**. Installed-byte verification and the additional clean-install trial were correctly skipped after the full-suite failure.

The two failures are distinct:

1. The first asset-origin launch reached the ordinary 20-second readiness deadline before the native host accepted the layout. In the actual target process, `host.loading` occurred at +5.225 seconds, `bridge.webReady` at +23.675, `host.restorePrepared` at +24.963 and `host.failed.afterBridge` at +25.909. No `host.layoutAccepted` was recorded. Fixture responses began afterward. The accepted native report stayed `{}`; later GLB/texture/worker results visible in the diagnostic DOM are not completed native evidence.
2. The injected renderer failure displayed a legible native recovery panel and hittable Retry button, but the underlying WKWebView remained in the accessibility hierarchy. The test stopped at its absence assertion, before Help, the contrast audit, Retry and foreground verification in that case.

The delayed-startup/Help/release case passed, as did all four operating/save smoke cases and the platform case. The coordinator inspected the actual released-ready and failed asset-launch captures. These are Simulator observations, not physical-device, final-art or release approval.

The [failure review](../../evidence/P01-T02-native-failure-review-02d2230.md) and [source-bound observation](../../evidence/P01-T02-failed-startup-observation-02d2230.json) preserve exact logs, trace, attachments and the archive identity. The archive is 262,080,184 bytes with SHA-256 `3400c70020d6ee465f0ae5990ced25597bf5fbb99397c51a658a652895acd0a7`.

## Implemented repair and its limits

`web/src/main.ts` now records the explicit diagnostic opt-in at bootstrap, applies the native layout and posts `layout.loaded`, then schedules diagnostic import/renderer creation in a later task. New bootstrap and page teardown clear the request/timer and invalidate older asynchronous work. Session, generation and disposal guards remain in place.

The actual diagnostic-bundle browser regression first failed against the unchanged implementation because the diagnostic panel appeared while `native.layout` was withheld and `loaded` remained false. Both isolated order/cancellation cases then passed after the correction. Independent review identified that two cancellation scenarios could mask one another; the final fixture places a frame boundary and absence assertions between them. Its final changed-case execution is recorded in the failure/recovery observation. These browser checks prove ordering in the web receiver; the next native run must establish actual `host.layoutAccepted` and readiness.

The pre-existing first-frame latency consumed **18.450 seconds of the 20-second budget** before bootstrap diagnostics could start. Deferral removes an observed optional-work ordering flaw; it does not establish the exclusive cause of the timeout or prove that first-frame latency is resolved. The native deadline, UI waits, CSP, bridge schema, loader outcomes and native success assertions are unchanged.

`EngineWebView.swift` now sets both the actual UIKit view's `isHidden` and `accessibilityElementsHidden` while the host is failed, and clears them in every nonfailed phase. The same representable and WKWebView remain owned throughout Retry. The unchanged native UI test must verify failure isolation, accessible Help/Retry, return to ready and one host after foregrounding. This Swift change has source review only until the new native job executes.

## Browser resize result and correction

The [02d web run](https://github.com/cheshmakzanoon-ops/Tin-junction/actions/runs/40463712719) succeeded at workflow level, but its actual browser report contains **31 expected cases and one flaky case**, with 33 attempts for 32 cases and `stats.ok: false`. No whole-browser acceptance is granted. All four new camera-modifier regressions passed on their first attempts.

The failed resize attempt's trace shows its still-running evaluation returned width 600 only **5,248.499 ms** after the viewport command, after the outer five-second poll had already failed. The repair gives that single poll 10 seconds and asserts both width 600 and height 500, retaining the original 30-second total case limit and every other assertion. One targeted zero-retry run passed against the unchanged ordinary 02d bundle. It does not validate the later diagnostic-order source or replace fresh full CI.

The [complete web review](../../evidence/P04-T06-web-ci-review-02d2230.md), [retained attempts/trace](../../evidence/P04-T06-web-ci-observations-02d2230.json), [92-input unit record](../../evidence/P04-T06-web-unit-02d2230.json) and [targeted resize record](../../evidence/P04-T06-resize-poll-local-verification-02d2230.json) preserve the different scopes. The current historical manifests validate against immutable Git inputs with zero errors and expected changed-source warnings. Their hashes have not been replaced with new source bytes.

## Local verification of this repair

The integrated `npm run check && npm run bundle:ios` completed successfully: **108 project tests, 42 iOS-tool tests and 304 web units across 22 files**, TypeScript, ordinary build/integrity verification and native resource packaging. [The retained log](../../evidence/P01-T02-startup-order-local-checks.txt) is 17,119 bytes, SHA-256 `4eb7bff1a3d0875504c30badd459b5f7c12d2f983e5b769fa265743e657d0dc2`. It includes historical evidence and npm environment warnings. No Swift execution is implied.

Both isolated and integrated ordinary builds retain exactly the four declared runtime files. The diagnostic module is absent from the ordinary metafile; diagnostic controls and fixtures are excluded. The new ordinary JavaScript is 716,416 bytes, SHA-256 `7ed3d0a95874f06b77a2d3234f91a1da56653ca79ab24917eba7f6915be18907`. The diagnostic browser tests build into a unique temporary directory and serve a finite in-memory route; they do not replace the ordinary preview or native resources.

## Queue and required next checks

[INC-NATIVE-QUEUE-20261027](../../evidence/INC-NATIVE-QUEUE-20261027.md) retains the bounded concurrency recovery. The old f030 run ultimately reported cancelled, with no log/artifact and an unknown execution stage. Its recorded completion time and later observation time are kept separate. No cancellation command was sent by this session.

At the latest observation before this checkpoint, the `2b630f1` [full native run](https://github.com/cheshmakzanoon-ops/Tin-junction/actions/runs/40464291855) and [web quality run](https://github.com/cheshmakzanoon-ops/Tin-junction/actions/runs/40464291804) remained active. Those runs contain the old application source. Preserve any result as its own observation; neither can verify this repair. Keep future native runs serialized in the existing group and do not repeat concurrency renaming if a run stalls.

1. Inspect all required Actions runs for the exact newly published repair SHA. Require the complete native suite, unchanged recovery test, successful first/cold asset observations, installed-resource identity and the real app-data-deletion repeat.
2. Require clean full browser execution with the new order/cancellation cases and strengthened resize assertion. Preserve any failed attempt instead of treating a retry as clean acceptance.
3. If startup still fails, inspect actual target-process timing before changing behavior. In particular, separate first-frame latency from layout delivery and optional diagnostic work; do not infer native receipt from JavaScript event order.
4. Resolve the incident and accept tasks only when their complete current evidence passes. Then run `npm run project:next`; asynchronous resource handling, accessible preferences and compressed-asset compatibility remain subsequent gated work.

## Product quality and external gates

The visible railway remains an original procedural fixed-oval development scene. The native capture has readable controls and a complete board/train/scenery view, but visually flat terrain, repetitive trees, a small locomotive and insufficient material detail remain below the requested production standard. No final visual approval is claimed. The detached general track/document systems, full creative editor, production assets, audio/haptics and later roadmap work remain unfinished.

Physical Duo graphics/thermal checks, a supported Duo-only commercial distribution route, rights/name clearance, final owner art approval, signing and authorized App Store submission remain external gates. Their absence cannot be replaced by browser or Simulator results. Work continues on the runtime repairs and then on independent eligible implementation; no release authorization has been granted by this checkpoint.
