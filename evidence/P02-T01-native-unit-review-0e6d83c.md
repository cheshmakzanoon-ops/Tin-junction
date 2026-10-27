# P02-T01 — actual native authority and startup unit result at 0e6d83c

## Verified result and scope

The native model command at **`0e6d83c24bd4e0ed5413c095ebaee1cbbc09d406`** compiled the current Swift source and passed **84 tests with zero failures**. XCTest's `All tests` suite completed at **2026-10-27 07:39:41.137 UTC**, with `** TEST SUCCEEDED **` in the retained log. This record maps **24 application, host and startup fixtures** to **P02-T01-A1**, without granting whole-task integration acceptance.

| Actual suite | Passed | Scope |
|---|---:|---|
| `ApplicationSessionTests` | 2 | Reconstructed presentation values preserve application authority. A competing WebView is rejected and stale teardown cannot detach the replacement. |
| `EngineHostModelTests` | 13 | Session/document readiness, stale-message and terminal-failure guards, protected/failed saves, pending storage ordering, coalesced requests and bounded method-level recovery. |
| `HostStartupHoldTests` | 6 | Explicit opt-in, one-shot release, stale-token isolation, deterministic expiry and cancellation on failure, navigation or detach. |
| `HostStartupHoldCoordinatorTests` | 2 | Deferred arming and actual dismantling cannot invoke a cancelled navigation callback; the ordinary path has a positive control. |
| `PlatformStartupTraceTests` | 1 | Bounded local trace and field validation. |

The [actual test excerpt](P02-T01-native-unit-tests-0e6d83c.txt) preserves those 24 passing cases, suite totals and the complete target result. The [manifest](P02-T01-native-unit-0e6d83c.json) fingerprints all 36 relevant native, fixture and build inputs from exact tested Git objects. Earlier f030 and 02d records retain their original hashes and results.

## What changed and what this execution establishes

This revision includes the narrow UIKit visibility/accessibility update for the failed WebView. The actual model build therefore establishes that the revised Swift compiles and the scoped model fixtures still pass. These fixtures do **not** inspect WebKit's remote accessibility hierarchy. Whether the failed WebView is excluded and Retry restores the same usable renderer still requires the current full UI test.

The separately repaired web diagnostic hook also requires full packaged integration. This model lane builds the ordinary web resources; it does not execute the opted-in loader panel or prove that `host.layoutAccepted` now precedes the readiness deadline.

The pending-save fixture passed in **0.007 seconds**. Its actor store observes the actual awaited save before mutation/return and requires a saving state with no durable revision or checkpoint. After completion it requires the saved revision/checkpoint, one write and one observation. This is host-state ordering during a controlled pending store operation. The fixture has no attached WebView and does not claim `native.saved` delivery.

Startup hold tests exercise the actual one-shot, token-checked state transitions. Coordinator fixtures use real attached WKWebViews and real deferred scheduling, but override public `load(_:)` to record navigation without WebKit I/O. Their deterministic expiry does not measure a 60-second wall-clock deadline. The ordinary native readiness deadline remains 20 seconds.

## Actual provenance

- [Native model run 40467652937](https://github.com/cheshmakzanoon-ops/Tin-junction/actions/runs/40467652937), job `122066851847`, attempt 1; advertised runner `1000015881`.
- Executed command: `bash tools/ios/test-models.sh`, fixed `TinJunctionTests` target, Debug configuration, selected Simulator and signing disabled. Test and artifact-upload steps completed successfully.
- Environment: Xcode **27.1 / 27A9275**, macOS **27.0.1 / 26A434**, iPhone Duo Simulator **27.1**, observed UDID `4C56FCAC-377C-469C-B415-8ABBC4375CBA`.
- Independently downloaded [artifact 12717148859](https://github.com/cheshmakzanoon-ops/Tin-junction/actions/runs/40467652937/artifacts/12717148859), `native-models-40467652937-1`: **277,018 bytes**, SHA-256 **`f0016458c35dbdd9054f7f1caf400f313e7f418b499859faeb58ef2bffbe51a7`**, matching the API digest. Retention ends **2026-11-10T07:39:51Z**.
- Full `xcodebuild.log`: **240,578 bytes**, SHA-256 **`66faa1b7e8dc6bf90afdd5ff0796b020ed99bb3e5c5c7efbf19147412f236a4c`**.

The completed XCTest result is distinct from final GitHub workflow bookkeeping. This record proves the scoped native command, without declaring the required full workflow successful or resolving the open queue incident.

## Remaining limits

Presentation reconstruction is controlled Swift state, not operating-system scene destruction/recreation. The ownership tests use deliberately blank WebViews and controlled bridge messages. Context loss and process termination are method-level inputs, not actual WebContent process death. The latter remains P02-T02.

This lane does not establish native delayed-loading Help, accessible Retry, contrast audit, foreground recovery, diagnostic loader completion, installed WebAssets identity or clean native app-data reinstall. Those require complete actual packaged UI outcomes. It also does not establish physical-device folding, acoustic quality, sustained graphics performance, final artwork, signed Release, commercial distribution or owner approval. No state transition or task acceptance is performed by this record.
