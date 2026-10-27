# P02-T01 — actual native authority and container unit result at c1e6e39

## Verified result and scope

The focused native model command tested **`c1e6e39ba127e064f4907e9c5a1d84fed7163990`** and passed **87 tests with zero failures**. XCTest's `All tests` suite completed at **2026-10-27 08:53:11.186 UTC**, with `** TEST SUCCEEDED **` in the original log. Its total was **5.227 (6.238) seconds**. The GitHub job completed successfully at **08:55:39 UTC**. This record maps **27 application, host, container and startup fixtures** to **P02-T01-A1**; it does not grant whole-task integration acceptance.

| Actual suite | Passed | Scope |
|---|---:|---|
| `ApplicationSessionTests` | 2 | Presentation reconstruction preserves application authority; competing renderers and stale teardown are rejected. |
| `EngineHostModelTests` | 13 | Session/document readiness, terminal-failure guards, stale messages, protected/failed saves, pending storage ordering and bounded method-level recovery. |
| `EngineWebViewContainerTests` | 3 | Failure removes the retained child from its window; Retry attaches the same child before the public load invocation; bounds and teardown ownership remain valid. |
| `HostStartupHoldTests` | 6 | Explicit opt-in, one-shot release, stale-token isolation, deterministic expiry and cancellation on failure, navigation or detach. |
| `HostStartupHoldCoordinatorTests` | 2 | Deferred arming and actual container dismantling cannot invoke a cancelled navigation callback; the ordinary path has a positive control. |
| `PlatformStartupTraceTests` | 1 | Bounded local trace and field validation. |

The [selected original excerpt](P02-T01-native-unit-tests-c1e6e39.txt) retains all 27 unique pass lines, the scoped suite totals and the complete model-target result. The [manifest](P02-T01-native-unit-c1e6e39.json) preserves **118 source fingerprints** from exact tested Git objects. Earlier records retain their original identities. One selected hold-coordinator pass line has an interleaved diagnostic prefix; the full original line is retained and matched by its contained test marker, not by a start-anchored parser.

## Actual compilation and unit behavior

This model command also compiled `UITestApplicationLifetime.swift` in the `TinJunctionUITests` target. The original compile lines appear in the excerpt. This resolves the helper's Swift 6 compilation uncertainty, while its public-state observations and per-fixture teardown behavior remain UI-runtime questions. The lane executed no UI test cases.

The three container results were retained identity/bounds **0.010s**, teardown/observer/ownership **0.013s**, and synchronous failure/Retry reattachment **0.019s**. Failure detachment is asserted immediately after `host.fail`, before direct availability calls. The teardown fixture reattaches the same renderer after dismantling and changes phase, so a leaked observer would incorrectly reinsert it; repeated old teardown must also preserve a different replacement. Retry checks the actual UIWindow association and bounds inside an overridden public `load(_:)`. The test window is not made key or visible. These fixtures prove tested UIKit containment and host transitions, not WebKit I/O or remote accessibility exclusion.

The pending-save case passed in **0.003s**. Its actor store observes the awaited operation before mutation/return and requires a saving state with no durable revision/checkpoint. Completion requires the saved revision/checkpoint, one write and one observation. No WebView is attached in that fixture, so `native.saved` delivery is outside its evidence scope.

Hold/coordinator cases use real attached WKWebViews, deferred arming and actual container dismantling while replacing public load with a recorder. Deterministic expiry invokes the token-checked transition rather than waiting out the 60-second diagnostic hold. The ordinary 20-second native readiness timeout is unchanged.

The prior **53e193b** full run separately passed actual controlled-delay Help and initialization-failure/Retry/foreground tests while failing two XCTest termination operations. Those successful and failed observations remain historical. They do not become current c1 UI results merely because the product host source is unchanged. At this record's collection, the current full run **40475892006** was still pending its final outcome.

## Source closure and provenance

The scope is deliberately broader than the 27 Swift cases. It retains inspected compiled native sources, tests/resources, web bundle inputs, package/build configuration, native workflows and iOS-tool prerequisites. The native-model workflow also runs the shared document-fixture equality test and `tools/ios/*.test.mjs`; their inputs remain included. The new lifetime helper and the changed CSS are fingerprinted. Six paths differ from the previous 53 closure: the four existing UI test files, the new helper and `web/src/style.css`. This is source closure, not a claim that all inputs are exercised by these 27 assertions.

- [Focused native run 40475891995](https://github.com/cheshmakzanoon-ops/Tin-junction/actions/runs/40475891995), job `122093894305`, attempt 1; advertised runner `1000015891`.
- Command: `bash tools/ios/test-models.sh`, fixed `TinJunctionTests` target, Debug configuration, selected Simulator, signing disabled. Test execution, upload and final job status all succeeded.
- Environment: Xcode **27.1 / 27A9275**, macOS **27.0.1 / 26A434**, iPhone Duo Simulator **27.1**, selected UDID `4C56FCAC-377C-469C-B415-8ABBC4375CBA`.
- Independently downloaded [artifact 12720323118](https://github.com/cheshmakzanoon-ops/Tin-junction/actions/runs/40475891995/artifacts/12720323118), `native-models-40475891995-1`: **288,105 bytes**, SHA256 **`2e095c55753412beb39176e6fe9e479c6592686570f37bd0ee2079b62456bd25`**, matching the provider digest. Retention ends **2026-11-10T08:55:03Z**.
- Original `xcodebuild.log`: **266,909 bytes**, SHA256 **`d934ec5b498885709773749bb1a76ce8e4bcd2719965ebd513e9e27c9ead96b9`**.

## Remaining limits

Presentation recreation is controlled Swift state, not operating-system scene destruction/recreation. Ownership and container fixtures use blank WebViews and controlled bridge messages. Method-level process termination does not simulate actual WebContent death; that remains P02-T02.

This lane packages ordinary resources. It does not execute diagnostic loaders, native loading/recovery UI, contrast audits, foregrounding, installed-byte verification or clean native app-data reinstall. The current full native result and open queue incident remain separate gates.

No physical-device folding, actual VoiceOver navigation, acoustic quality, sustained graphics performance, final artwork, signed Release, commercial distribution or owner approval is claimed. This evidence makes no state transition or task acceptance.
