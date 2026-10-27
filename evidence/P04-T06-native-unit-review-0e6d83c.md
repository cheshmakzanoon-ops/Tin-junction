# P04-T06 — native workbench units at 0e6d83c

[Native model run 40467652937](https://github.com/cheshmakzanoon-ops/Tin-junction/actions/runs/40467652937), job `122066851847`, executed the fixed unit target at **`0e6d83c24bd4e0ed5413c095ebaee1cbbc09d406`**. All **84 native unit cases passed**, with zero failures. XCTest recorded `All tests` passed at **2026-10-27 07:39:41.137 UTC** and the actual log ends with `** TEST SUCCEEDED **`. The compile/test and artifact-upload steps succeeded; this result does not infer the outcome of the separate full UI workflow from GitHub's bookkeeping status.

This record maps **46 cases** to P04-T06-A2:

| Actual class | Passed | Scope |
| --- | ---: | --- |
| BridgeEnvelopeTests | 14 | Typed protocol, bounded input, supported messages, layout/session authority and malformed-input rejection |
| EngineHostModelTests | 13 | Session ordering, pending/durable save state, protected failures, restored identity/revision and terminal-failure isolation |
| LayoutDocumentTests | 8 | Strict current-document decoding, bounds, names, scenery, identity and stopped restoration |
| LayoutStoreTests | 11 | Real temporary-file writes, idempotent retry, integrity and recovery, legacy preservation/upgrades, stale/conflicting writes and injected interruption boundaries |

[The retained excerpt](P04-T06-native-unit-tests-0e6d83c.txt) contains every actual scoped pass line and the overall completion markers. Interleaved native logging is retained as observed. The coordinator independently counted 84 unique passes, verified the 46-case class breakdown and hashed the downloaded archive and full log.

The pending-store fixture passed in **0.007 seconds**. Its one-shot observation runs inside the actual awaited actor-store save, before mutation/return, and requires a pending state without a published durable revision/checkpoint. Completion then publishes the expected durable state. It has no attached WKWebView, so this remains host-state ordering evidence; it does not establish delivery of `native.saved`.

The current checkpoint-integrity and legacy regressions all passed. Temporary-file and injected-boundary results do not establish arbitrary physical power-loss behavior. Storage-wrapper version 2 remains distinct from the detached general-layout document v2 and does not integrate the general track graph or editor.

Artifact `native-models-40467652937-1`, ID **12717148859**, is **277,018 bytes**, SHA-256 **`f0016458c35dbdd9054f7f1caf400f313e7f418b499859faeb58ef2bffbe51a7`**; the independently downloaded digest matches API metadata. Its full `xcodebuild.log` is **240,578 bytes**, SHA-256 **`66faa1b7e8dc6bf90afdd5ff0796b020ed99bb3e5c5c7efbf19147412f236a4c`**. Recorded retention ends **2026-11-10 07:39:51 UTC**.

The [manifest](P04-T06-native-unit-0e6d83c.json) retains the full prior **114-file** native-unit source scope, with every fingerprint computed from this exact tested Git tree. Application, UI-target and bundled inputs are included, but this lane executes only unit tests. The new UIKit visibility repair compiled; actual WebKit accessibility removal, Retry, startup ordering, first/cold asset completion, installed bytes and clean reinstall still require the current full native workflow. No older execution has been relabelled as this source.

The fixed-oval procedural workbench remains below the requested production-art standard. Current browser/full-native integration, the original roadmap, physical-device graphics/thermal/folding checks, sound quality, rights, supported exclusive distribution, signing and owner release gates remain open. This record supplies scoped unit evidence only, with no whole-task or App Store acceptance.
