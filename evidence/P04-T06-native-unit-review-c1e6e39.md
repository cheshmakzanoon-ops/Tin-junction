# P04-T06 — native workbench units at c1e6e39

[Native model run 40475891995](https://github.com/cheshmakzanoon-ops/Tin-junction/actions/runs/40475891995), job `122093894305`, executed the fixed native unit target at **`c1e6e39ba127e064f4907e9c5a1d84fed7163990`**. The original log records **87 unique passing cases and zero failures**, with `All tests` completed at **2026-10-27 08:53:11.186 UTC** and `** TEST SUCCEEDED **`. The selected environment was Xcode **27.1**, build **27A9275**, macOS **27.0.1 / 26A434**, and the actual **iPhone Duo / iOS 27.1 Simulator** selected by the workflow. The job completed successfully at **08:55:39 UTC**. This is Simulator unit evidence; full UI and browser results require their own original reports.

This record maps **46 actual cases** to the unit portion of **P04-T06-A2**:

| Actual class | Passed | Scope |
| --- | ---: | --- |
| BridgeEnvelopeTests | 14 | Typed and bounded protocol input, document/session authority and malformed-message rejection |
| EngineHostModelTests | 13 | Session ordering, pending/durable save state, protected failures, restored identity and terminal-failure isolation |
| LayoutDocumentTests | 8 | Strict fixed-oval document decoding, bounds, names, scenery, identity and stopped restoration |
| LayoutStoreTests | 11 | Real temporary-file writes, retry idempotence, integrity/recovery, legacy preservation/upgrades and injected interruption boundaries |

[The retained excerpt](P04-T06-native-unit-tests-c1e6e39.txt) preserves every complete original scoped pass line and the overall start/completion markers. The coordinator independently verified the downloaded archive and log, all 87 unique pass markers, the 46-case breakdown and the excerpt's exact original lines. Two original pass lines in the full log have interleaved diagnostic prefixes; the scoped checksum case retains its original timestamp fragment without cleaning or rewriting it. A parser anchored to the start of a line would miss these markers. The excerpt is a selected set of actual log lines, not a new execution or an unfiltered full log.

The pending-store observation passed in **0.003 seconds**. Its one-shot callback executes inside the awaited actor-store save, before mutation and return; it requires pending host state before durable revision/checkpoint publication. It does not attach a WKWebView and therefore does not establish actual `native.saved` delivery. Temporary-file and injected-boundary tests also do not establish arbitrary physical power-loss behavior. Storage-wrapper version 2 remains distinct from the detached general-layout document v2.

All three `EngineWebViewContainerTests` passed: detached retention/current bounds **0.010 s**, dismantling/ownership **0.013 s**, and synchronous removal/Retry reattachment **0.019 s**. Their real blank UIKit views and public load recorder exercise ownership and ordering without WebKit navigation. They are compiled-change context here, without broadening the 46-case P04 assertion scope.

The new **`UITestApplicationLifetime.swift` actually compiled** in the `TinJunctionUITests` target: the archived log includes both its arm64 compile invocation and the overall successful test outcome. The fixed unit selector still executes only `TinJunctionTests`. Compilation of the UI target does not establish successful launches, termination, fixture cleanup or any of the new lifecycle observations; those require the separate full UI execution.

## Provenance and input scope

The independently downloaded [artifact 12720323118](https://github.com/cheshmakzanoon-ops/Tin-junction/actions/runs/40475891995/artifacts/12720323118), `native-models-40475891995-1`, is **288,105 bytes**, SHA-256 **`2e095c55753412beb39176e6fe9e479c6592686570f37bd0ee2079b62456bd25`**. Its digest, length, run and commit match GitHub metadata. The exact archived `xcodebuild.log` is **266,909 bytes**, SHA-256 **`d934ec5b498885709773749bb1a76ce8e4bcd2719965ebd513e9e27c9ead96b9`**. Recorded retention ends **2026-11-10 08:55:03 UTC**. The selected Simulator was UDID `4C56FCAC-377C-469C-B415-8ABBC4375CBA`; the selection inventory recorded Shutdown before the explicit boot step, not during execution.

The [manifest](P04-T06-native-unit-c1e6e39.json) fingerprints **129 exact tested Git inputs**. It retains all 128 paths from the preceding `53e193b` scope, adds the new UI lifetime helper, and fingerprints the changed four UI-test files and title CSS at this commit. Every current source file was independently compared to its committed bytes. This conservative compilation, bundle and workflow-prerequisite inventory does not expand the scoped assertions or imply that UI cases ran in the focused unit lane. Historical evidence and hashes remain unchanged.

The ordinary web bundle is used in this lane. Full native UI operation, first/cold diagnostic completion, installed WebAssets identity, the distinct observed app-data uninstall/reinstall trial and original-capture review remain separate required evidence. No success is inferred for them from this unit result.

The fixed-oval workbench remains procedural development art. General graph/editor integration, production assets, complete accessibility and sound behavior, physical Duo graphics/thermal/folding validation, rights, supported exclusive distribution, signing and owner release gates remain unfinished. This record grants scoped unit evidence only, with no whole-task, final-art or App Store acceptance.
