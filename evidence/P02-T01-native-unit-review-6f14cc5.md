# P02-T01 — scoped native ownership and host-state evidence

## Observed result

[Native-model run 40449797278](https://github.com/cheshmakzanoon-ops/Tin-junction/actions/runs/40449797278), job `122009585826`, passed the actual `TinJunctionTests` target at implementation commit **`6f14cc5bfa03bfa9e522880e8365ed6e1a2cdc31`**. All **69 native unit tests passed**, with zero failures. This record claims the two `ApplicationSessionTests`, thirteen `EngineHostModelTests` and one bounded diagnostic-buffer test as the scoped unit evidence for application ownership and host state. It does not claim a UI integration result.

The runner used macOS **27.0.1 / 26A434**, Xcode **27.1 / 27A9275**, the **iOS 27.1 Simulator SDK**, and the selected actual **iPhone Duo** Simulator, UDID `4C56FCAC-377C-469C-B415-8ABBC4375CBA`. The command was `bash tools/ios/test-models.sh`, whose fixed invocation uses Debug, `CODE_SIGNING_ALLOWED=NO`, `-parallel-testing-enabled NO` and `-only-testing:TinJunctionTests`. The complete native UI workflow remains independent and required.

## What the tests establish

| Actual test scope | Observed assertions | Evidence boundary |
|---|---|---|
| `testPresentationRecreationAndLifecycleKeepTheApplicationAuthority` | Five cycles of model inactive/background/active state and `RootView(host:)` value recreation retain the exact host reference, active session ID and readiness; the injected store is loaded once | Tests presentation-value and state-model ownership. It does not destroy/recreate an operating-system scene or foreground an app through SpringBoard |
| `testSecondRendererCannotReplaceOrTearDownTheActiveSession` | The same real `WKWebView` can attach idempotently; a different live view is rejected; teardown of the rejected or old view cannot cancel the current authority; a new view can attach after the prior owner detaches | The two WebViews are deliberately blank ownership fixtures with no JavaScript receiver; this is not a renderer-loading test |
| Current-session readiness and restore identity | A handshake alone cannot report ready; a matching layout acknowledgement is required; a stale session or wrong restored revision is rejected | Bridge messages are decoded test inputs, not observations of the production renderer |
| Terminal and recoverable host states | A recoverable context-loss message retains transport and clears ready; terminal initialization failure stays failed despite metrics, late handshakes, stale layout acknowledgements and queued writes; an explicit fresh load can recover | The failure is injected at the host-model boundary. Actual WebGL initialization failure and native Retry behavior require the UI test |
| Save authority and replacement | A durable revision appears only after the store completes; normal write failure retains the open model and allows retry; protected failures block overwrite; repeated in-flight requests coalesce; replacing a session clears its pending identity and excludes stale writers | Uses a controlled actor store. It does not assert that unsaved edits survive process death or test physical filesystem interruption |
| Bounded process fallback | `contentProcessTerminated()` without an attached view reaches an explicit failure | This is a direct method call, not actual WebContent process termination and not P02-T02 integration acceptance |
| `testTraceBoundAndFieldValidation` | The local diagnostic buffer rejects invalid/free-form fields and invalid elapsed values, enforces the 96-byte event limit and stops at 128 entries | Bounded buffer unit evidence only; no performance, privacy certification or physical-device claim |

Source review confirms that `TinJunctionApp` owns one `ApplicationSession` as a state object and passes that session's host into `RootView`, whose host is observed rather than recreated. `Info.plist` disables multiple application scenes. The active-view identity checks cover coordinator messages and navigation callbacks as well as attach/detach. These production files and their native dependencies are fingerprinted at the tested commit; the unit assertions above are the runtime evidence for their exercised behavior.

## Exact retained evidence

- [Compact actual test excerpt](P02-T01-native-unit-tests-6f14cc5.txt): selected test starts, results and suite totals copied from the artifact's `xcodebuild.log`; no fabricated test output.
- [Artifact 12709654737](https://github.com/cheshmakzanoon-ops/Tin-junction/actions/runs/40449797278/artifacts/12709654737), `native-models-40449797278-1`: **244,025 bytes**, independently verified SHA-256 **`382b7680aa8769f13dddf4b0805fac84873db2f01431145471a8e2edde20fae4`**.
- Full `xcodebuild.log`: **230,851 bytes**, SHA-256 **`d98830a63c9bcf2d2dee6f1ccc2e7ad97076590c48cf72cf2d56c3707a8d3f46`**. The unit target finished at **2026-10-27 04:35:41.986 UTC**, followed by `** TEST SUCCEEDED **`.
- The attached evidence manifest records native application, model, bridge, document/store, diagnostic, platform, test-fixture and build-input hashes from the actual tested Git tree. It also compares those bytes to the current working tree instead of assuming that a later commit is identical.

The original large result bundle remains in Actions, with retention currently ending **2026-11-10 04:35:46 UTC**. Compact results and the artifact digest are retained here. Existing P07 evidence from the same independently verified run is unchanged.

## Acceptance still pending

This record is now historical for current integration: the subsequent packaged-origin repair changes its fingerprinted `BundleSchemeHandler.swift`. The original dependency hash and actual tested commit are retained. Current task acceptance must use a fresh native result; removing the changed input or relabeling this run would not establish that result.

This unit record maps only to **P02-T01-A1**. The complete task still needs actual packaged integration observations, including **P02-T01-A2**, where a real renderer initialization failure produces actionable native UI and a real Retry action recovers. There is no claim here that those UI assertions passed, that actual WebContent was killed, or that operating-system scene destruction was exercised.

No physical-device, fold/posture transition, audio quality, sustained performance, final-art, signed Release archive, distribution or owner-approval gate is satisfied by this record.
