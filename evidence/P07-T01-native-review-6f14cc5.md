# P07-T01 current native conformance — 6f14cc5

## Result and evidence scope

The actual native model run passed **69 unit tests**, including all **11 schema-v2 document tests** and the exact shared corpus of **46 cases: 9 valid and 37 invalid**. This rerun includes the bridge/build dependencies that changed after the earlier successful `9971887` run. All 22 scoped source fingerprints match both tested commit `6f14cc5bfa03bfa9e522880e8365ed6e1a2cdc31` and the current checked-out implementation when this record was prepared.

This supplies the native half of P07-T01 conformance; combine it with the coordinator's web unit evidence. The full `iOS Simulator` workflow remains independently required for native UI/bridge and candidate health. Model-only success does not establish P01-T02 custom-origin behavior.

## Provenance and verified bytes

| Item | Actual observation |
| --- | --- |
| Repository | `cheshmakzanoon-ops/Tin-junction` |
| Workflow | Native model conformance, push to `main`, Debug, unsigned Simulator |
| Run | [40449797278](https://github.com/cheshmakzanoon-ops/Tin-junction/actions/runs/40449797278) |
| Job | `122009585826`, Swift document and bridge conformance |
| Test command | `bash tools/ios/test-models.sh`, observed exit 0, `TEST SUCCEEDED` at 2026-10-27 04:35:42 UTC |
| Test scope | Fixed `TinJunctionTests` target only; `test-scope.txt` contains `unit-models-only` |
| Environment | macOS 27.0.1 / 26A434; Xcode 27.1 / 27A9275; iOS Simulator 27.1 |
| Selected device | iPhone Duo; type `com.apple.CoreSimulator.SimDeviceType.iPhone-Duo`; UDID `4C56FCAC-377C-469C-B415-8ABBC4375CBA` |
| Artifact | [12709654737](https://github.com/cheshmakzanoon-ops/Tin-junction/actions/runs/40449797278/artifacts/12709654737), `native-models-40449797278-1` |
| Downloaded ZIP | 244,025 bytes; independently verified SHA-256 `382b7680aa8769f13dddf4b0805fac84873db2f01431145471a8e2edde20fae4`, matching Actions |
| Full `xcodebuild.log` | 230,851 bytes; SHA-256 `d98830a63c9bcf2d2dee6f1ccc2e7ad97076590c48cf72cf2d56c3707a8d3f46` |
| Retention | Actions currently retains the original result bundle and logs until 2026-11-10 04:35:46 UTC |

The selected-device inventory reports its state before boot. This is an actual Simulator result; the inventory is not a physical-device or folding measurement. The compact committed excerpt preserves every v2 test outcome and the overall unit totals.

## Acceptance mapping

**P07-T01-A1:** The native test loads the byte-identical corpus also consumed by the web validator. Its cases cover minimal and maximum-budget editable documents, an eight-vehicle circle, occupied selected turnouts, reverse retained motion, malformed identities/fields/numerics, unsupported catalogs/versions, invalid joins and intervals, and unsafe braking state. Dedicated native tests additionally exercise whole-footprint scenery bounds, supported vehicle ordering/identity/footprint, structural and byte budgets, and unsupported-version recovery classification.

**P07-T01-A2:** Canonical round trips preserve document identity and exact physical order/state: vehicle array, route interval sequence, travel direction, tick, signed travel, speed and throttle. Only unordered identity collections are sorted. Exact-key validation rejects renderer/native handles. Swift and JavaScript numeric spelling is not promised to be byte-identical; the logical document and retained physical sequence must agree.

The v2 parser intentionally preserves an editable design independently of operating clearance. Passing this file boundary does not permit a train to run before P05 clearance certification. The live v1 document/store remains unchanged; migration, v2 persistence and import/restore integration belong to later tasks.

## Changes covered and remaining checks

The earlier evidence remains intact at `P07-T01-native-unit-9971887.json`; its three stale inputs were not removed. This rerun covers their new versions and includes the additional native diagnostic helper/resource policy and the Release resource-check script reached by the updated build configuration. Native compilation and the Debug pre-build script invocation passed. This record does not claim that a signed Release archive was created.

The same run also passed the two application-session ownership tests and four asset-report schema/session tests, but those unit successes are not substitutes for their required UI integration evidence. No physical device, display transition, sustained performance, final art, distribution or owner approval is claimed. The next native work is the current full Simulator run, especially real packaged asset-origin rendering, actual gesture audio, retained unsupported-loader results and repeated cold launch.
