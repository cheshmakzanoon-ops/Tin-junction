# P04-T06 — packaged workbench integration at c1e6e39

The required [full native run 40475892006](https://github.com/cheshmakzanoon-ops/Tin-junction/actions/runs/40475892006), job `122093894596`, **passed at `c1e6e39ba127e064f4907e9c5a1d84fed7163990`**. Its original log contains **87 unique passing unit cases and all eight passing UI cases**, followed by `** TEST SUCCEEDED **`. Installed-resource verification and the separate observed uninstall/reinstall trial also passed. The job completed **2026-10-27 09:05:13 UTC** on advertised runner `1000015890`.

This is the native portion of **P04-T06-A1**. The current browser integration record separately covers operating, scenery transactions and undo/redo. The native test exercises the real keyboard/editor name change, durable revision acknowledgment, foreground app termination and exact-name restoration. It must not be described as a native UI test of every scenery or throttle action.

## Original execution

| Full native UI case | Result | Recorded duration |
| --- | --- | ---: |
| Asset-origin first launch and cold relaunch | Passed | 67.045 s |
| Bundled renderer handshake | Passed | 15.222 s |
| Rotation and foreground host survival | Passed | 19.808 s |
| Native Help and actual dismissal | Passed | 16.171 s |
| Native edit/save/termination/relaunch | Passed | 83.290 s |
| Controlled startup delay, Help and real release | Passed | 41.367 s |
| Actual renderer failure, recovery exclusion, contrast audit, Retry and foreground | Passed | 56.098 s |
| Public platform observations across requested orientations | Passed | 98.860 s |

The full unit suite completed at **08:54:31.880 UTC**, with 87 tests and zero failures. The full UI suite ran **08:54:41.144–09:01:19.041 UTC**, with eight cases, zero failures and recorded duration **397.860 (397.897) seconds**. The [selected original excerpt](P04-T06-native-integration-tests-c1e6e39.txt) preserves all eight complete UI pass lines and the original suite start/completion markers. The coordinator independently matched every excerpt line to the archived full log; it is selected output, not a replacement full execution.

The save case first reads the current durable revision, changes the railway name through the actual WebKit text field and visible keyboard, commits the editor change, and requires native acknowledgment of **the edited revision**. It then calls the unchanged foreground termination operation, launches again, requires the native restored marker and locates the exact edited heading. An earlier autosave cannot satisfy that assertion. This establishes the exercised acknowledged checkpoint, not durability of arbitrary unsaved edits or physical power-loss behavior.

All **48** full-suite lifetime attachments were present. Every fixture's initial launch began with public `notRunning`; completed launches reported `runningForeground`; all explicit and teardown terminations returned `notRunning`. The clean-install fixture adds **nine** observations with the same completed transitions. These public XCTest states remain asynchronous observations, not independent PID death measurements. This successful run does not identify the cause of the earlier Xcode request/state delays or prove that they cannot recur. The unchanged assertions, deadlines and foreground-termination preconditions were retained.

## Installed bytes and clean app-data trial

The actual selected environment was **Xcode 27.1 / 27A9275**, **macOS 27.0.1 / 26A434**, and the **iPhone Duo iOS 27.1 Simulator**, UDID `4C56FCAC-377C-469C-B415-8ABBC4375CBA`. This is unsigned Debug Simulator execution. The full lane explicitly packages the diagnostic assets; it is not a signed ordinary Release build.

The installed asset manifest and packaging input are identical: **1,592 bytes**, SHA-256 **`0fce39ed2cc596246e79efb8ba8fec8c871caae2cce7083ad38a87bbe609d8bd`**. Actual installed identities were checked after the full suite, immediately before uninstall, after reinstall before the repeated test, and after that test. Each records the same manifest and expected finite resource hashes. The diagnostic JavaScript is **801,455 bytes**, SHA-256 `c037026dc0865d5c6d5e81e998deee4682959e60f7be82c3cca7db6ff089d68b`; diagnostic CSS is **19,325 bytes**, SHA-256 `19bd0240a3682d74c7b8caddeae84ea73978ef590107e40e4f76dc30106cd641`. These differ intentionally from the ordinary unit/browser bundle.

The original `clean-install-4yzQlq/verification.json` records the additional trial from **09:01:43.676 to 09:04:18.863 UTC**. It first observed both current and previous saved generations. Uninstall succeeded; the subsequent data-container lookup returned the expected **NSPOSIXErrorDomain / code 2**, empty stdout and missing-container result. The same selected booted Simulator was observed again. Reinstall used the exact compiled test app; before any fresh launch or test, there were **zero Tin Junction store entries and zero saved generations**, with a changed container location.

The additional unchanged asset-origin class then passed its one two-session test in **113.130 seconds**. Its original log ends with **`** TEST EXECUTE SUCCEEDED **`**, distinct from the full build-and-test marker. Export and post-test installed identity both succeeded. This was a supplemental clean-install test after the successful full suite, not a filtered replacement for that suite.

All four final native asset reports—first/cold before removal and first/cold after reinstall—record GLB rendering, four-quadrant texture sampling, classic-worker response and gesture-activated audio completion as passed. WASM remains explicitly blocked by the current CSP; KTX2 remains absent/disabled. Distinct sessions, WebKit-data clearing and the native HTTP/HTTPS deny policy are recorded. The policy is scoped to the prepared WebView, not OS-wide airplane mode or physical-device networking.

## Original captures inspected

The coordinator inspected these **unaltered 1,398×2,034 PNGs** from the capture artifact. Viewing-tool scaling does not change the original image dimensions or identities.

| Archived capture | Observation | SHA-256 |
| --- | --- | --- |
| `screenshots/370DF695-81D7-47B6-89AC-4EE0E16F082B.png` | Native durable-save state and edited CI-tagged name; the title is readable on its opaque backing. | `ce1cc7c59ca95f420cd3ffc3ba45ff56093cd9e1e1668e23b74e2c95715aedae` |
| `screenshots/D7F146FB-1689-4E99-A2D5-5A24D21C03CF.png` | Relaunched scene, restored marker and matching edited name. | `704a636a5f10283edb4ebfa0033bf53b3d8812f722443b04a4a243cfbdcd35af` |
| `screenshots/6A5E8CE6-B2EB-4B39-9216-BA38AA0A19E2.png` | Native renderer-failure recovery panel and reachable Retry. | `f77eca7a2e426e7fbec9e6bf5f1bafa7cf4771877fa2ec7ea3e208f1de0822b8` |
| `screenshots/5A8D0A54-2B6A-40B8-8135-E999C07CA06F.png` | Scene restored after actual Retry and foreground return. | `6474204b1789355c3c193da8ca118e8df5c0aa9531d3e434883b7541f0375d2d` |

These captures confirm the current title repair and the exercised visible states. They also retain known limitations: scene-backed status/footer text, small footer type, a raw renderer error identifier in recovery copy, and procedural artwork whose train/terrain/material presentation still needs production work. No final visual score is awarded.

All three actual platform reports retained the same **382×574.6666666666666 logical-point** viewport, scale **3**, and reported hinge angle **0°**. Successful orientation requests therefore do not establish a measured geometry or hinge transition. Physical folding remains a separate gate.

## Provenance

| Original item | Bytes | SHA-256 |
| --- | ---: | --- |
| Full artifact [12720484130](https://github.com/cheshmakzanoon-ops/Tin-junction/actions/runs/40475892006/artifacts/12720484130) | 346,308,224 | `798ffb5bbbeefa3f8dc0a7011c22ceedf566dbc7c970a99ac12377daf5668a50` |
| Reports artifact [12720898476](https://github.com/cheshmakzanoon-ops/Tin-junction/actions/runs/40475892006/artifacts/12720898476) | 345,660 | `32f98b9f1e498832cb4b325c8edd9b8540bdf784a7b09c56ee2868dacd075728` |
| Captures artifact [12720594017](https://github.com/cheshmakzanoon-ops/Tin-junction/actions/runs/40475892006/artifacts/12720594017) | 17,947,337 | `62423a2fe5a3bf54b8054dbd39cf5478fe9624c6ec11dbf202f48bab74b64224` |
| Full `xcodebuild.log` | 335,365 | `bd99e4be4e1e8ff085b0af588511dee0d417cfd02573464964a408fbdb9591c8` |
| Clean-install `xcodebuild-clean-install.log` | 15,626 | `9e5cbee6d9198d53dc78e1552af70c6929f8854c30bb4f870c321292b6e8fad9` |

Both compact packages contain the identical index, SHA-256 **`5482cf9b6a2bbf39018ad973e4fc7bc75cc3a3b83d2a8a9177291f5a14e700ce`**, naming this commit/run/attempt, all three successful step outcomes, complete staging and zero issues. The coordinator independently hashed every original **139 report files and 17 PNGs**, and then compared all **156 files / 19,375,743 bytes** to the original full ZIP. All identities match. The full archive retains result bundles and video excluded from the bounded packages; this review does not claim to have watched those videos. Artifact retention ends on **2026-11-10** at the provider's respective recorded expiry times.

The formal [manifest](P04-T06-native-integration-c1e6e39.json) uses the 129-input current P04 compilation/bundle/test inventory, with exact tested Git fingerprints. It preserves the original scope and does not borrow older passing outcomes. The separate current browser and focused native records supply their own scopes.

The graph-based editor, production art and asset compression, complete accessibility/sound behavior, physical Duo performance/folding/acoustics, supported exclusive distribution, rights/name clearance, signing and authorized submission remain unfinished. This is acceptance evidence for the bounded development workbench, not App Store readiness.
