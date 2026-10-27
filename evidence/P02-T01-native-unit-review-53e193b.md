# P02-T01 — actual native authority and container unit result at 53e193b

## Verified result and scope

The native model command at **`53e193b6435d241f8c1462d859112b2cb1b56b77`** compiled the published Swift source and passed **87 tests with zero failures**. XCTest's `All tests` suite completed at **2026-10-27 08:19:50.536 UTC**, with `** TEST SUCCEEDED **` in the retained log. The GitHub job subsequently completed successfully at **08:20:28 UTC**. This record maps **27 application, host, container and startup fixtures** to **P02-T01-A1**; it does not grant whole-task integration acceptance.

| Actual suite | Passed | Scope |
|---|---:|---|
| `ApplicationSessionTests` | 2 | Presentation reconstruction preserves application authority; competing renderers and stale teardown are rejected. |
| `EngineHostModelTests` | 13 | Session/document readiness, terminal-failure guards, stale messages, protected/failed saves, pending storage ordering and bounded method-level recovery. |
| `EngineWebViewContainerTests` | 3 | Failure removes the retained child from its window; Retry attaches the same child before the public load invocation; bounds and teardown ownership remain valid. |
| `HostStartupHoldTests` | 6 | Explicit opt-in, one-shot release, stale-token isolation, deterministic expiry and cancellation on failure, navigation or detach. |
| `HostStartupHoldCoordinatorTests` | 2 | Deferred arming and actual container dismantling cannot invoke a cancelled navigation callback; the ordinary path has a positive control. |
| `PlatformStartupTraceTests` | 1 | Bounded local trace and field validation. |

The [actual test excerpt](P02-T01-native-unit-tests-53e193b.txt) retains those 27 unique passing cases, scoped suite totals, and the complete 87-test target result. The [manifest](P02-T01-native-unit-53e193b.json) preserves **117 source fingerprints** from exact tested Git objects. Earlier records retain their original hashes and results.

## What the new container execution proves

The three actual new results are:

- Retained renderer identity and current bounds after removal/reattachment: **0.010 seconds**.
- Dismantling an unavailable renderer cancels observation and preserves later ownership: **0.041 seconds**.
- Synchronous failure detachment and Retry reattachment before the load invocation: **0.022 seconds**.

The first failure-detachment assertion runs immediately after `host.fail`, before direct availability calls. The teardown fixture reattaches the same renderer after dismantling and changes phase, so a leaked observer would incorrectly reinsert it. It then verifies that repeated old teardown cannot detach a different replacement. Retry checks the renderer's actual UIWindow association and bounds inside an overridden public `load(_:)` call. These fixtures establish the tested UIKit containment and host transitions, not actual WebKit navigation or remote accessibility exclusion. The test window is not made key or visible.

The current full UI test must still prove that the failed WebKit subtree disappears, native recovery remains accessible, and Retry restores a working packaged renderer. The previous `0e6d83c` full run failed that accessibility assertion despite its model suite passing. This new model result does not erase or supersede that actual UI failure.

The pending-save fixture passed in **0.020 seconds**. Its actor store observes the awaited operation before mutation/return and requires a saving state with no durable revision or checkpoint. After completion it requires the saved revision/checkpoint, one write and one observation. No WebView is attached in this fixture; it does not claim `native.saved` delivery.

The hold/coordinator fixtures preserve their earlier scope while passing the new container to actual dismantling. They use real attached WKWebViews and deferred scheduling, but override public `load(_:)` to record navigation without WebKit I/O. Deterministic expiry invokes the token-checked transition; it does not measure the 60-second wall-clock hold deadline. The ordinary native readiness deadline remains 20 seconds.

## Source closure and provenance

The fingerprint scope is deliberately broader than the 27 P02 assertions. It includes the inspected compiled native sources, tests/resources, ordinary web bundle inputs, package/build configuration, native workflows and iOS-tool prerequisites. The native-model workflow explicitly executes the shared document-fixture test and all `tools/ios/*.test.mjs`; their relevant sources are retained, including the new evidence-staging helper and the changed full-runner stderr capture. The shared fixture corpus and its equality test are included. Expanding this closure does not claim these unrelated helpers are tested by the Swift container fixtures.

- [Native model run 40471495783](https://github.com/cheshmakzanoon-ops/Tin-junction/actions/runs/40471495783), job `122079339187`, attempt 1; advertised runner `1000015886`.
- Executed command: `bash tools/ios/test-models.sh`, fixed `TinJunctionTests` target, Debug configuration, selected Simulator and signing disabled. Test, artifact upload and final job bookkeeping completed successfully.
- Environment: Xcode **27.1 / 27A9275**, macOS **27.0.1 / 26A434**, iPhone Duo Simulator **27.1**, observed UDID `4C56FCAC-377C-469C-B415-8ABBC4375CBA`.
- Independently downloaded [artifact 12719795526](https://github.com/cheshmakzanoon-ops/Tin-junction/actions/runs/40471495783/artifacts/12719795526), `native-models-40471495783-1`: **286,902 bytes**, SHA-256 **`1cb318d54ebaba1d63bda37cecc911235912b36fb2d76011c31aef9afc7bc70d`**, matching the API digest. Retention ends **2026-11-10T08:19:56Z**.
- Full `xcodebuild.log`: **251,831 bytes**, SHA-256 **`9c9d998bba4c5c47ffb6d951a9c950410fb8d3b06d2806c0727504cdb513f35a`**.

## Remaining limits

Presentation reconstruction is controlled Swift state, not operating-system scene destruction/recreation. Ownership and container fixtures use deliberately blank WebViews and controlled bridge messages. Context loss and process termination are method-level inputs, not actual WebContent process death. Actual process termination remains P02-T02.

This model lane builds ordinary web resources. It does not exercise diagnostic loaders, native delayed-loading Help, accessible Retry, the contrast audit or foreground recovery. It does not verify installed WebAssets bytes or clean native app-data reinstall. The required full native result and open queue incident remain separate.

There is no physical-device folding, acoustic quality, sustained graphics performance, final artwork, signed Release, commercial distribution or owner-approval claim. No state transition or task acceptance is performed by this record.
