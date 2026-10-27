# P04-T06 — native workbench units at 53e193b

[Native model run 40471495783](https://github.com/cheshmakzanoon-ops/Tin-junction/actions/runs/40471495783), job `122079339187`, executed the fixed native unit target at **`53e193b6435d241f8c1462d859112b2cb1b56b77`**. The original log records **87 unique passing cases and zero failures**, with `All tests` completed at **2026-10-27 08:19:50.536 UTC** and `** TEST SUCCEEDED **`. The selected environment was Xcode **27.1**, build **27A9275**, and the actual **iPhone Duo / iOS 27.1 Simulator** selected by the workflow. This is Simulator unit evidence; the separate full UI and browser outcomes are not inferred from it.

This record maps **46 actual cases** to the unit portion of **P04-T06-A2**:

| Actual class | Passed | Scope |
| --- | ---: | --- |
| BridgeEnvelopeTests | 14 | Typed and bounded protocol input, document/session authority, malformed-message rejection |
| EngineHostModelTests | 13 | Session ordering, pending/durable save state, protected failures, restored identity and terminal-failure isolation |
| LayoutDocumentTests | 8 | Strict fixed-oval document decoding, bounds, names, scenery, identity and stopped restoration |
| LayoutStoreTests | 11 | Real temporary-file writes, retry idempotence, integrity/recovery, legacy preservation/upgrades and injected interruption boundaries |

[The retained excerpt](P04-T06-native-unit-tests-53e193b.txt) preserves each complete original scoped pass line and the overall completion markers. The coordinator independently verified all 87 unique cases, the 46-case breakdown, archive contents, byte counts and digests. The excerpt is a selected set of actual log lines, not a new test execution or an unfiltered full log.

The pending-store observation passed in **0.020 seconds**. Its one-shot callback executes inside the awaited actor-store save, before mutation and return; it requires pending host state before durable revision/checkpoint publication. It does not attach a WKWebView and therefore does not establish actual delivery of `native.saved`. Temporary-file and injected-boundary tests also do not establish arbitrary physical power-loss behavior. Storage-wrapper version 2 remains distinct from the detached general-layout document v2.

The new renderer-container code compiled, and all three added `EngineWebViewContainerTests` passed in the same unit run: detached retention/current bounds **0.010 s**, dismantling/ownership **0.041 s**, and synchronous removal/Retry reattachment **0.022 s**. Their real blank UIKit views and public load recorder exercise ownership and ordering without WebKit navigation. Actual remote accessibility exclusion, visible recovery, Retry navigation and subsequent foreground operation still require the unchanged full UI tests. These three cases are recorded here as compiled-change context; the 46-case P04 assertion scope is unchanged.

## Provenance and input scope

The independently downloaded [artifact 12719795526](https://github.com/cheshmakzanoon-ops/Tin-junction/actions/runs/40471495783/artifacts/12719795526), `native-models-40471495783-1`, is **286,902 bytes**, SHA-256 **`1cb318d54ebaba1d63bda37cecc911235912b36fb2d76011c31aef9afc7bc70d`**. Its digest, length, run and commit match GitHub metadata. The exact archived `xcodebuild.log` is **251,831 bytes**, SHA-256 **`9c9d998bba4c5c47ffb6d951a9c950410fb8d3b06d2806c0727504cdb513f35a`**. Recorded retention ends **2026-11-10 08:19:56 UTC**. The selected simulator was UDID `4C56FCAC-377C-469C-B415-8ABBC4375CBA`; its selection inventory recorded Shutdown before the explicit boot step. That inventory state is not the state during test execution.

The [manifest](P04-T06-native-unit-53e193b.json) fingerprints **128 exact tested Git inputs**. It retains every path in the historical 114-input P04 scope and adds the independently audited current native compilation, bundle and workflow-prerequisite inventory. The expansion includes both new container files, all current iOS tool inputs, the explicit shared-document prerequisite test and its corpus, and conservative full-native/probe tooling. This larger input inventory does not broaden the 46-case assertion claim or assert that UI tests executed in this unit-only lane. Historical evidence and hashes remain unchanged.

The ordinary web bundle is used in this lane. Full native UI operation, first/cold diagnostic completion, actual installed WebAssets identity, the distinct observed app-data uninstall/reinstall trial and original-capture review remain separate required evidence. No success is inferred for those gates from these unit results.

The fixed-oval workbench remains procedural development art. The general track graph/editor, production assets, complete accessibility and sound behavior, physical Duo graphics/thermal/folding validation, rights, supported exclusive distribution, signing and owner release gates remain unfinished. This record grants scoped unit evidence only, with no whole-task, final-art or App Store acceptance.
