# P02-T01 — native application authority and startup cancellation at 02d2230

## Actual test result

The fixed native model command at **`02d2230947528fedc3129d1d4ca43c9749cfa1c6`** passed **84 tests with zero failures**. XCTest completed at **2026-10-27 07:00:59.958 UTC**. This P02 record scopes the **24 application/host/startup fixtures** below to P02-T01-A1. Actual delayed startup, native recovery, Retry and foreground behavior require the separate full packaged UI run.

| Actual suite | Passed cases | What the fixtures establish |
|---|---:|---|
| `ApplicationSessionTests` | 2 | Reconstructed RootView values retain one application-owned host/session across controlled lifecycle changes and open storage once. A competing WKWebView is rejected; stale teardown cannot cancel its replacement. |
| `EngineHostModelTests` | 13 | Current-session/document readiness, stale-message rejection, protected/failed save handling, pending host-state ordering, request coalescing, bounded method-level recovery and terminal-failure guards. |
| `HostStartupHoldTests` | 6 | Explicit opt-in, one-shot/reentrant release, stale-token isolation, deterministic expiry, failure before/after arming, and cancellation on loading or detach. |
| `HostStartupHoldCoordinatorTests` | 2 | Actual deferred scheduling cannot navigate after pre-arm failure/detach; dismantling an armed coordinator discards its callback. The ordinary no-hold path records a positive control load. |
| `PlatformStartupTraceTests` | 1 | Local diagnostic field validation and bounded trace retention. |

The [actual test excerpt](P02-T01-native-unit-tests-02d2230.txt) retains the scoped suites and complete target totals from the downloaded log. The [manifest](P02-T01-native-unit-02d2230.json) pins all 36 retained production, test and build inputs to the exact tested commit. These inputs remain byte-identical at the subsequent `2b630f1` queue-recovery revision. That later workflow coordination change does not relabel the execution as a run of a different commit.

## Stronger pending-save observation

The repaired `testSuccessfulSaveChangesDurableStateOnlyAfterStoreCompletes` passed in **0.029 seconds**. Its actor store now invokes a one-shot MainActor observation from inside the actual awaited `save` call, before the store can mutate or return. The callback requires `saving` with no durable revision or checkpoint. After the callback releases storage and the write returns, the test requires the saved revision/checkpoint, one write and exactly one observation.

This establishes host-state ordering while that controlled store call is pending. It has no attached WKWebView and does not inspect or prove delivery of `native.saved`. The original immediate-store f030 fixture remains historical; its initial/final checks are not presented as this stronger observation. The target's additional storage-integrity and legacy-upgrade tests passed as part of the 84-test total, but this P02 mapping is limited to the 24 cases listed above.

## Startup scheduling coverage

All six state fixtures and both coordinator fixtures passed again on this revision. The hold consumes callbacks before release or expiry, preserves the original failure after cancellation, rejects stale owner tokens and disarms when real loading begins or the owner detaches. Deterministic expiry invokes the actual token-checked transition; it does not measure the full 60-second diagnostic deadline.

The coordinator fixtures use real attached WKWebViews and the actual deferred task. Their public `load(_:)` override records requests without starting WebKit I/O. One schedules then fails/detaches before yielding. The other awaits the real `.holding` publication, dismantles through actual teardown, and checks that late release/repeated cancellation cannot navigate. The same override records the expected packaged entry URL in an ordinary no-hold control. Bounded XCTest expectations observe cancellation; no sleep-based readiness claim is made. The normal 20-second renderer deadline remains unchanged.

## Provenance and workflow distinction

- [Native model run 40463712718](https://github.com/cheshmakzanoon-ops/Tin-junction/actions/runs/40463712718), job `122054022825`, attempt 1; advertised runner `1000015875`.
- Actual command: `bash tools/ios/test-models.sh`; fixed `TinJunctionTests` target, generated scheme, Debug configuration, selected Simulator and signing disabled. The command and artifact-upload steps completed successfully. The log contains `** TEST SUCCEEDED **`.
- Actual environment: Xcode **27.1 / 27A9275**, macOS **27.0.1 / 26A434**, iPhone Duo Simulator **27.1**, observed UDID `4C56FCAC-377C-469C-B415-8ABBC4375CBA`.
- Independently downloaded [artifact 12715647618](https://github.com/cheshmakzanoon-ops/Tin-junction/actions/runs/40463712718/artifacts/12715647618), `native-models-40463712718-1`: **277,724 bytes**, SHA-256 `22a36298948062e415d7dee32db08e7f36c9e27ed7e643db957ee979ff630f9b`, matching the reported digest. Retention ends **2026-11-10T07:01:24Z**.
- Full artifact `xcodebuild.log`: **243,816 bytes**, SHA-256 `2b1d1959e7a1f4f41d6f976f96d37d17f4a24e6de64da3d355d0e996d8adace7`.

The completed XCTest result and preserved artifact are distinct from GitHub's final workflow bookkeeping. This record proves the scoped command's execution; it neither declares the required full workflow successful nor resolves the queue incident.

## Limits and remaining verification

Presentation recreation constructs RootView values and drives lifecycle state directly, without demonstrating operating-system scene destruction/recreation. The authority fixture uses real but deliberately blank WKWebViews and controlled bridge envelopes. The coordinator recorder does not initialize a renderer. Packaged loading/Help, exact initialization failure, accessible Retry, contrast audit, real readiness and foreground behavior still require their full UI observations.

Method-level process termination and context-loss inputs are not actual WebContent death. Controlled store observations do not establish physical power-loss behavior or durability of unsaved edits. This lane does not exercise diagnostic loader UI, verify installed WebAssets or delete/reinstall native application data.

This is unsigned Simulator evidence. Physical-device folding, sustained graphics performance, acoustic quality, final artwork, signing, exclusive commercial distribution and owner release approval remain outside its scope. Prior records keep their original source hashes and outcomes; no task acceptance or incident resolution is performed by this record.
