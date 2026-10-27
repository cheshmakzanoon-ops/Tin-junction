# P01-T02 — clean-app verification runner

Status: **IMPLEMENTED; local process-fixture tests passed; actual native reset/test UNEXECUTED.** This prepares the phase's required repeat after deleting app data. The earlier WebKit data reset and cold relaunch do not establish deletion of native Application Support data.

## Fixed operation and evidence

`node tools/ios/test-clean-install.mjs` accepts no arguments. Its only uninstall target is the identifier read from the actual compiled Debug `TinJunction.app`, checked against a fixed allowlisted identifier that matches the reviewed application configuration in `apps/ios/project.yml`. A later identifier change requires explicit runner review; the script does not accept a new removal target merely because configuration changed. It uses the exact selected and freshly inventoried booted Duo UDID. No general app identifier, path or test-filter option is exposed.

Before removal, the runner requires the original full-suite success log, passing results for all four existing UI classes, absence of test filters in that full-suite invocation, and the original installed identity matched to the current packaging input. It independently verifies the current installed resources and compiled manifest, then observes at least one existing native save generation. It records generation byte counts and hashes without copying layout contents.

The runner captures the installed `simctl` help for `install`, `uninstall` and `get_app_container`, accepting successful help on either stdout or stderr and retaining both labelled streams. It uninstalls only the compiled test app and requires an empty stdout plus the specific `NSPOSIXErrorDomain` / code 2 missing-container response. A generic service error cannot satisfy that check. A new positive inventory must still identify the same available booted Duo after the missing-container lookup.

After reinstalling the exact compiled application, it verifies that the observed native `Library/Application Support/TinJunction` store is absent or empty **before any launch or test**, and verifies installed WebAssets against the same packaging input. It then runs only the unchanged `TinJunctionUITests/AssetOriginProbeUITests` class using public `xcodebuild test-without-building`, the original project/scheme/Debug configuration/DerivedData and the same destination. The normal full suite remains a prerequisite.

Each attempt has a new `artifacts/ios/clean-install-*` directory with its own xcresult, build log, attachment export, partial/final verification record and pre/post installed identities. Original full-suite files are not overwritten. Attachment export and post-test resource verification are attempted even after a failed scoped test; native exit 65 retains priority over later failures. A passing result additionally requires both final named probe observations on the selected device, with completed rendering and distinct native session IDs. This prevents a zero-test command or missing export from masquerading as a verified clean install.

App-container paths remain local process values. Uploaded result JSON contains outcomes, command statuses, public error domain/code, byte identities and a boolean location comparison. The raw missing-container stderr is represented by byte count/hash, not copied into the result. Symlinked compiled products or native-store components fail closed.

## Local verification

`node --test tools/ios/test-clean-install.test.mjs` passed **14 tests, zero failures, zero skips**, in 12.817 seconds. The [retained log](P01-T02-clean-install-runner-tests.txt) identifies the actual local invocation result. These tests launch the CLI against temporary process stubs; they do not execute Apple tools or simulate real WebKit rendering.

| Observed local input/output | Bytes | SHA-256 |
| --- | ---: | --- |
| `tools/ios/test-clean-install.mjs` | 19,354 | `cd50a7b3c5ddcaaee505a4faf49a76b3f79338f9b9c4fe59916c2f429bb45d6e` |
| `tools/ios/test-clean-install.test.mjs` | 18,810 | `57903a1d88291b85f515ce95b8f4e188738e1399b948b8b2625cc3be6d420f8d` |
| Retained local test log | 1,655 | `0f4053f4b4f0a91a53044260ccead45e1abac4fee1d0f543bb7efbea0eafd751` |

The cases cover the successful command sequence and original-artifact preservation; arbitrary argument rejection; stderr-only help; failed full-suite and stale identity prerequisites; wrong compiled app; missing prior save; unrelated missing-path service errors; a surviving container mapping; a disappearing Simulator; failed uninstall; stale post-install data; pre/post test resource corruption; symlink redirects; native failure priority and failure-safe export; export failure; missing final observations; repeated session IDs; and repeated attempts without overwriting previous evidence.

No shared build output, app source, existing tool, workflow, task state or commit was changed by this worker. Syntax/whitespace review passed. The coordinator owns integration and publication.

## Workflow integration

The coordinator has integrated the fixed command after the existing successful full-native-test and installed-resource verification steps. Both remain mandatory, and the selected `TIN_SIMULATOR_UDID` is passed unchanged. The existing always-run artifact upload now includes `artifacts/ios/clean-install-*/`, preserving failed reset/export attempts without replacing the original full-suite artifacts.

The full native step has a 45-minute limit; the additional clean-install step has 25 minutes around its runner's 20-minute test invocation. The overall job allows 75 minutes for these separate stages, setup and evidence upload. Workflow parsing and prerequisite/order/destination/artifact checks passed locally. This wiring has not yet executed on a native runner.

The installed native command behavior, actual error representation, fresh-data observation, repeated packaged rendering/audio outcomes and attachment manifest admission must still pass in a real macOS/Simulator run. An unexpected error format must remain a failure until its actual cause is reviewed. This local runner result does not complete P01-T02.

## Public source basis and limits

- Apple's [command-line testing note](https://developer.apple.com/library/archive/technotes/tn2339/_index.html) documents `test-without-building`, scheme/destination selection and individual test selection. The checked-in invocation uses the already-built products and fixed existing test class.
- Apple's [Simulator command-line session](https://developer.apple.com/videos/play/wwdc2019/418/) documents per-command `simctl help`, identifier-based automation, JSON device inventory, installation and inspection through `get_app_container`.
- Apple's [Xcode command-line tool reference](https://developer.apple.com/documentation/xcode/xcode-command-line-tool-reference) identifies `simctl` and `xcodebuild` as Xcode tools. The actual selected Xcode 27.1 and iOS Simulator SDK 27.1 are rechecked at runtime.

The prepared probe denies HTTP/HTTPS within its WKWebView; it does not turn off OS networking or physical radios. The reset trial proves installation data handling, not secure erasure, keychain clearing, physical-device behavior, acoustic quality or App Store readiness.
