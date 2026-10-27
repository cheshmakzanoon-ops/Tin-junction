# P02-T01 — application authority and startup cancellation, actual native units

## Observed result and scope

The focused native model workflow for `f0303cc9a9f49e48902350b14f526d5dcdbda3de` passed **79 tests with zero failures** on the selected iPhone Duo iOS 27.1 Simulator. XCTest completed at **2026-10-27 06:11:05.666 UTC**. This record maps the **24 application/host/startup fixtures** below to P02-T01-A1. The separate full packaged UI workflow is required for actual delayed startup, native recovery, Retry and foreground behavior; this unit record does not substitute for those observations.

**Historical for the current worktree:** after this run, `LayoutStore.swift` and `EngineHostModelTests.swift` changed for checkpoint integrity and deterministic pending-store coverage. Their original tested hashes remain in this manifest. The actual f030 result remains a pass for its recorded source; current implementation acceptance requires a new native run with the changed inputs.

| Actual suite | Passed tests | What the fixtures establish |
|---|---:|---|
| `ApplicationSessionTests` | 2 | Reconstructed RootView values keep the same application-owned host and session across controlled lifecycle changes; the store opens once. A second WKWebView cannot displace the attached authority, and a stale detach cannot cancel its replacement. |
| `EngineHostModelTests` | 13 | Current-session and document-identity readiness, stale-session rejection, protected/failed save handling, bounded method-level recovery, context-loss transport behavior and terminal-failure guards. |
| `HostStartupHoldTests` | 6 | Explicit diagnostic opt-in, one-shot/reentrant release, stale-token isolation, deterministic expiry, failure before/after arming, and cancellation on real-load entry or detach. |
| `HostStartupHoldCoordinatorTests` | 2 | Actual deferred coordinator scheduling cannot navigate after pre-arm failure/detach; dismantling an armed coordinator discards its callback. The ordinary no-hold path is a positive control for the recorded load invocation. |
| `PlatformStartupTraceTests` | 1 | Local diagnostic field validation and bounded trace retention. |

The [retained test excerpt](P02-T01-native-unit-tests-f0303cc.txt) contains the actual scoped suite output and complete target totals from the downloaded build log. The [machine-readable manifest](P02-T01-native-unit-f0303cc.json) pins the relevant production, test and build inputs to the tested commit. It retains dependencies such as the existing host, resource handler, bridge, store, platform adapter and packaged-build configuration; it is not limited to the new hold files.

## The eight added startup fixtures

The six `HostStartupHoldTests` exercise the same token-checked transitions used by the diagnostic. Release consumes the callback before invoking navigation, so a reentrant tap cannot initiate another load. Expiry consumes navigation before invoking failure. Stale cancellation/expiry tokens cannot take another owner's hold. An original host failure is preserved after cancellation, including failure before the deferred coordinator can arm. Entering the real loading path or detaching the owner disarms the hold.

The two coordinator fixtures use real attached WKWebViews and the actual deferred coordinator task. A public `load(_:)` override records requests while avoiding WebKit I/O. One fixture schedules then fails/detaches without yielding first, and observes that no request follows. The other awaits the actual `.holding` publication, dismantles the view through the real teardown method, and checks that late release/repeated cancellation cannot load. Its ordinary coordinator control records the expected packaged entry URL, so an empty request list is meaningful. Bounded inverted XCTest expectations observe a quiet interval; there are no arbitrary sleep-based success assertions.

These are scheduling/cancellation checks. The six transition fixtures invoke expiry deterministically; they do **not** measure the full 60-second diagnostic deadline. The recorder override does **not** initialize a renderer. The normal 20-second renderer readiness deadline is unchanged in the tested source; real readiness and error UI require the separate integration record.

## Provenance

- Workflow: [native models run 40458903138, attempt 1](https://github.com/cheshmakzanoon-ops/Tin-junction/actions/runs/40458903138), job `122038591253`.
- Actual command: `bash tools/ios/test-models.sh`; the fixed runner invokes `xcodebuild test` with `-only-testing:TinJunctionTests`, the generated TinJunction scheme, Debug configuration, selected Simulator UDID and signing disabled. Exit code: **0**.
- Actual environment: Xcode **27.1 / 27A9275**, macOS **27.0.1 / 26A434**, iPhone Duo Simulator **27.1**, observed UDID `4C56FCAC-377C-469C-B415-8ABBC4375CBA`.
- Downloaded [artifact 12713359093](https://github.com/cheshmakzanoon-ops/Tin-junction/actions/runs/40458903138/artifacts/12713359093), `native-models-40458903138-1`: **267,604 bytes**; independently measured ZIP SHA-256 `8e2987806a7f141860b77b1f3a27be5b07200397d6e10fcd73a49f5415df3a75`, matching the upload log and artifact API digest.
- Original artifact retention ends **2026-11-10T06:11:15Z**. The compact actual test excerpt and archive identity remain in the repository.
- Full artifact `xcodebuild.log`: **248,059 bytes**, SHA-256 `864885100a5899d4f6cca6c53ab092ee6e65b7598b15cc4af4108f034f4c9731`.

## Limits

Presentation recreation constructs RootView values and drives lifecycle state directly. It does not demonstrate operating-system scene destruction/recreation. The authority tests attach real but deliberately blank WKWebViews and use controlled bridge envelopes for readiness. Native foreground and renderer initialization are assessed by the full UI run.

Method-level process termination/context-loss inputs are not actual WebContent process death. Save-state checks use a controlled store that returns immediately: they inspect initial and final state, without holding an in-flight write or inspecting emitted `native.saved` acknowledgements. They do not establish that stronger pending-write observation, filesystem interruption safety or durability of unsaved edits after process loss. The later checkpoint-integrity and pending-store repairs require fresh native evidence. The focused workflow neither exercises the diagnostic loader UI nor verifies installed WebAssets.

This is unsigned Simulator evidence. It does not establish physical-device fold/posture behavior, audio quality, sustained performance, a signed Release archive, exclusive commercial distribution, final artwork or owner approval. Earlier native records remain historical; this record identifies its own tested source and does not rewrite earlier outcomes.
