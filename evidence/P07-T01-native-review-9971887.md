# P07-T01 native document conformance — 9971887

## Observed result and current applicability

The actual iPhone Duo Simulator model run compiled the native application and passed **63 unit tests**, including all **11 `LayoutDesignDocumentTests`**. The shared TypeScript/Swift corpus passed all 46 fixed expectations: 9 valid documents and 37 invalid documents. The native implementation preserves exact saved motion for file validation; ordinary application restoration remains a separate stopped-state operation.

**This is successful historical evidence for `9971887835dedae6a5f870b3633acd6747c255b5`. It must not be used to complete the current task while its scoped dependencies differ.** Since this run, `Bridge/BridgeEnvelope.swift` (which defines `BridgeJSON`), `apps/ios/project.yml`, and `tools/build-web.mjs` changed for the explicit asset-origin diagnostic and Release guard. All three tested fingerprints remain in this manifest. Current-source acceptance must await another real native run of those changed inputs.

## Run and verified artifact

- Repository: `cheshmakzanoon-ops/Tin-junction`.
- Workflow: Native model conformance; push to `main`; Debug; unsigned Simulator tests.
- [Run 40448701737](https://github.com/cheshmakzanoon-ops/Tin-junction/actions/runs/40448701737); job `122006045966`, “Swift document and bridge conformance”.
- `xcodebuild` reported `TEST SUCCEEDED` at 2026-10-27 04:23:12 UTC. The workflow completed successfully at 04:25:58 UTC.
- [Artifact 12710395042](https://github.com/cheshmakzanoon-ops/Tin-junction/actions/runs/40448701737/artifacts/12710395042), `native-models-40448701737-1`: **222,227 bytes**, SHA-256 **`3f3601e67a85bd966eb0fa8487884d266009eb4049f73adae3c2a4ff1fd63524`**. Downloaded bytes were hashed independently and match the Actions digest.
- Full `xcodebuild.log`: 207,743 bytes; SHA-256 `c0be91a4073a693fbb8ba2809d24a4b2f031276c7eee5c5f80f20be820594d65`. A compact actual-test excerpt is committed beside this report.
- Original `.xcresult`, inventory, selected Simulator, test scope and installed attachment-export help are retained in that artifact. Retention currently ends 2026-11-10 04:25:19 UTC. Its screenshot attachment manifest is empty; this unit lane supplies no UI captures.

The recorded runner was macOS 27.0.1, build 26A434; Xcode 27.1, build 27A9275; iOS Simulator SDK/runtime 27.1. The selector chose `iPhone Duo`, device type `com.apple.CoreSimulator.SimDeviceType.iPhone-Duo`, UDID `4C56FCAC-377C-469C-B415-8ABBC4375CBA`. Inventory state `Shutdown` was recorded before boot. `test-scope.txt` explicitly says `unit-models-only`.

## What the tests establish

| Criterion | Native observations |
| --- | --- |
| P07-T01-A1: agreement on validity and versions | The same byte-identical 46-case corpus used by the web validator was loaded from the native test bundle. It includes minimal and maximum-budget editable designs, an eight-vehicle circle, occupied turnouts, reverse retained motion, malformed identities/fields/numerics, unknown catalogs/versions, disconnected or misaligned joins, invalid selections and unsafe stopping distance. Dedicated native tests also exercise geometry, whole-footprint scenery bounds, vehicle order/identity/footprint, and structural/byte limits. |
| P07-T01-A2: stable logical serialization without runtime handles | Canonical round trips preserve document identity, vehicle order, retained interval order, signed travel, direction, tick, throttle and speed. Only unordered identity collections are sorted. Unknown document/native-handle fields are rejected. Swift and JavaScript numeric spelling need not be byte-identical; their valid logical document identity and physical sequence must agree. |

File validity deliberately permits editable track designs that have not passed operating clearance. Neither validator can authorize moving a train on an imported design until the separate P05 clearance gate succeeds. The live schema-v1 document/store was preserved; schema-v2 file validation does not claim that migration, save/load UI, atomic v2 persistence or production import are integrated.

## Inputs and verification

The manifest records the native v2 validator, its transitive `BridgeJSON` and v1 shared constants/footprints, native tests, both exact corpus copies, the corpus generator/equality test and format contract, the fixed native model runner, selector, pinned generator installer, Xcode project/workflow, web bundler, and dependency/runtime pins. Hashes were read from the actual tested Git tree, rather than substituted with current working-file hashes.

Executed command: `bash tools/ios/test-models.sh` in the verified workflow, exit 0. It invoked `xcodebuild test` for `TinJunctionTests` on the selected actual Duo Simulator, with parallel testing disabled and code signing disabled. The full required `iOS Simulator` workflow remains an independent gate; this focused lane does not replace it.

A non-strict historical evidence validation may report the three expected source-change warnings. Strict validation against current source must reject those differences. Obtain new native conformance evidence for the current implementation before completing P07-T01 together with the corresponding web evidence.

## Limits and next work

No physical device, fold transition, thermal/performance, final artwork, signing, App Store submission or owner approval is established here. The document implementation remains a detached validation boundary. The next native verification is the published asset-origin/P02 checkpoint; it must compile the changed bridge/build inputs and rerun these model tests. P01-T02 also needs its separate actual custom-origin UI observations and retained blockers.
