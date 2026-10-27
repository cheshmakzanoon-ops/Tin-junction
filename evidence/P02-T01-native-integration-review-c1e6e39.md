# P02-T01 — actual native application ownership and startup UI at c1e6e39

## Result and criterion mapping

At exact source `c1e6e39ba127e064f4907e9c5a1d84fed7163990`, [required full native run 40475892006](https://github.com/cheshmakzanoon-ops/Tin-junction/actions/runs/40475892006) passed **87 unit tests and all eight UI tests**, including controlled delayed readiness, actual renderer initialization failure, native Retry and foreground recovery. The compiled test-lifetime helper completed every fixture cleanup, and installed-resource plus actual clean-reinstall checks passed afterward. This integration record supports **P02-T01-A1 and A2** alongside the separately frozen current [27-case ownership unit record](P02-T01-native-unit-c1e6e39.json). The coordinator owns final acceptance.

| Requirement | Actual evidence | Scope boundary |
|---|---|---|
| A1: one application/session authority | Current unit lane's ApplicationSession, host identity, stale teardown, container and scheduling fixtures; actual launch, Help, inactive/active and held-start UI checks each require one WebView | Presentation recreation is a controlled model fixture, not OS scene destruction/recreation; Info.plist disables multiple application scenes |
| A1: loading state before real web readiness | Actual DEBUG one-shot pre-navigation hold; native loading overlay, disabled Save, usable Help, one WebView; native release then real restored readiness and enabled Save | The hold is a diagnostic injection; the real 20-second navigation readiness deadline is unchanged |
| A2: actionable failed initialization | Actual one-shot WebGL2-context failure; exact `renderer_initialization_failed`, native Retry, Help, contrast audit, unavailable web subtree absent | No claim of VoiceOver navigation or largest-text coverage |
| A2: real recovery | Native Retry tap removes error UI, loads the packaged renderer, reaches `host.ready`, retains one WebView; Home/activate retains readiness | This is renderer initialization recovery; actual WebContent-process death is a separate P02-T02 gate |

## Actual UI results and native trace

`testControlledStartupDelayKeepsNativeHelpAvailableBeforeRealReadiness` passed in **41.367 seconds**. While navigation was held, the unchanged test required the actual native progress overlay, no `host.ready`, Save disabled, hittable Help and exactly one WebView. It opened Help, waited for its explicit contents and Done controls, tapped Done, and required actual dismissal. The same held-state assertions still passed afterward. Only the real **Continue startup** tap released navigation; the test then required real readiness, disappearance of held/loading controls, one WebView and eventual Save enablement.

The original hold trace (observed target PID 11565) records `host.loading.lifecycle=active` at +18.382 seconds and `host.layoutAccepted` at +21.655 seconds: **3.273 seconds from actual loading**, not a 21.655-second readiness-timeout pass. The intentional pre-navigation hold does not start or enlarge the product's 20-second readiness deadline.

`testRealRendererInitializationFailureOffersWorkingNativeRetry` passed in **56.098 seconds**. The test requires the exact initialization error, its native recovery container, a hittable Retry button with width and height at least 44 points, no accessible `host.webview`, no ready state and hittable Help. The public contrast accessibility audit completed without throwing. After tapping Retry, it requires real ready, absence of recovery/Retry and one WebView, then repeats readiness/one-WebView checks after Home and activation.

The original recovery trace (observed target PID 12229) shows the real failure at +10.610 seconds as `host.failed.beforeBridge`, the detached view's navigation finish with `window=0`, then Retry loading at +20.652. Navigation starts with `window=1`, receives `bridge.webReady` at +22.949 and reaches `host.layoutAccepted` at +23.062. These actual observations supplement the current container unit fixtures, whose public load override deliberately did not perform WebKit I/O. The native wrapper retains and reattaches the same view; the UI case observes exactly one exposed WebView, while identity continuity itself is covered by the separate model tests.

The full suite also passed packaged handshake (15.222 seconds), lifecycle/foreground smoke (19.808), native Help (16.171) and real edit/save/terminate/relaunch (83.290). The asset case passed its first and cold launch (67.045), and the current platform probe passed (98.860). No test was rerun or assertion relaxed. Selected unchanged original pass lines and complete original startup-event substrings are in [P02-T01-native-integration-tests-c1e6e39.txt](P02-T01-native-integration-tests-c1e6e39.txt).

## Original native UI captures reviewed

Five original shell captures were visually inspected. The failed view shows native recovery with legible Retry and Help; the held views show the actual progress UI before and after Help; the released/retried views show the rendered railway with restored status. They support these specific state observations, not final art or comprehensive accessibility approval.

- Failed initialization: `screenshots/6A5E8CE6-B2EB-4B39-9216-BA38AA0A19E2.png` — 189,821 bytes, SHA-256 `f77eca7a2e426e7fbec9e6bf5f1bafa7cf4771877fa2ec7ea3e208f1de0822b8`
- Retry and foreground: `screenshots/5A8D0A54-2B6A-40B8-8135-E999C07CA06F.png` — 1,395,039 bytes, SHA-256 `6474204b1789355c3c193da8ca118e8df5c0aa9531d3e434883b7541f0375d2d`
- Held startup: `screenshots/E8B8D13B-8344-4F36-9082-00E7EBD16D5D.png` — 184,869 bytes, SHA-256 `0b1dd706017457e00a5a261e74656fc2a1c62f78f0ee2048ac10e6bd1834f42e`
- Held after real Help dismissal: `screenshots/C93BDD58-3A5E-4A08-BFBD-CC59A8302446.png` — 185,183 bytes, SHA-256 `e7f098bcd402421c4d2c21363a8ad530337c238abe81bce9dfd7786ace0c10dd`
- Released and ready: `screenshots/5EF717F9-449F-4CD7-BCC6-85236EF66BBA.png` — 1,394,710 bytes, SHA-256 `704a636a5f10283edb4ebfa0033bf53b3d8812f722443b04a4a243cfbdcd35af`

The actual test source distinguishes disabled Save from a fake pre-ready scene. The failure source distinguishes the injected initialization code from an unrelated timeout. The contrast audit applies only to the actual recovery screen; VoiceOver and system largest-text work remain separate.

## Fixture ownership and cleanup observations

The current shared `UITestApplicationLifetime` compiled in the actual Xcode lane and executed throughout this run. It registers supported XCTest cleanup before launch, preserves LIFO failure capture, uses the public launch/terminate APIs, and records UTC, monotonic time and public application state before and after operations. It adds no arbitrary retry, sleep or changed timeout.

All **48 full-suite and nine clean-trial observations** form complete monotonic fixture sequences. Every initial observation is `notRunning`, every completed launch is `runningForeground`, all explicit asset/save terminations end `notRunning`, and each fixture teardown ends `notRunning`. The original text attachment identities and parsed values are retained in the shared [current observation](P01-T02-native-observation-c1e6e39.json). No claim is made that this asynchronous public state is independent PID/death measurement.

This successful isolation is evidence for current behavior, not an exclusive explanation of prior host-side delays. The clean cold-launch public call still took **44.597 seconds**, and the recovery teardown took about 6.034 seconds. Launch or sustained-rendering performance is not accepted from these test results.

## Exact source and resource provenance

The formal integration manifest preserves all **118** inputs from the exact tested Git commit. It includes application/session ownership, Info.plist, RootView, host/bridge/container/coordinator, every diagnostic and test dependency, the new shared UI lifetime helper, runtime main/bootstrap and scene/module closure, CSS, pinned package/build inputs, fixture bytes, full/focused workflows and installed/clean/evidence tooling. Every current file and Git object digest was independently checked before writing. The separate unit record remains frozen at its own earlier observation time; this integration result does not rewrite it.

Actual job `122093894596` on runner `1000015890`, attempt 1 completed at 09:05:13 UTC. Xcode 27.1 build 27A9275 selected the real available iPhone Duo Simulator on iOS 27.1. The full original log is **335,365 bytes**, SHA-256 `bd99e4be4e1e8ff085b0af588511dee0d417cfd02573464964a408fbdb9591c8`, and ends with `** TEST SUCCEEDED **`. It records 87 unit tests with zero failures and 8 UI tests with zero failures. The separate supplemental one-case clean test did not replace that required suite.

Full archive **12720484130** is 346,308,224 bytes, SHA-256 `798ffb5bbbeefa3f8dc0a7011c22ceedf566dbc7c970a99ac12377daf5668a50`, expiring 2026-11-10 at 09:04:26 UTC. Bounded reports **12720898476** are 345,660 bytes, SHA-256 `32f98b9f1e498832cb4b325c8edd9b8540bdf784a7b09c56ee2868dacd075728`, expiring at 09:04:21; original PNGs **12720594017** are 17,947,337 bytes, SHA-256 `62423a2fe5a3bf54b8054dbd39cf5478fe9624c6ec11dbf202f48bab74b64224`, expiring at 09:04:23. All provider/download digests match. The compact index binds the same exact source/run/attempt, and all 156 copied original files match the full archive. The shared observation retains these identities and all actual report/capture associations.

Actual installed-resource verification passed for ten opted-in Debug runtime files and was repeated around literal app-data uninstall/reinstall. Four native asset sessions succeeded with explicit WASM/KTX2 blockers. The detailed data-reset, network, installed-byte and trace provenance is in the [P01 review](P01-T02-native-observation-review-c1e6e39.md), avoiding a second copy of those originals.

## Limits retained

All three current platform observations show the same viewport (382 × 574.6666666666666 points), pixel ratio 3 and hinge angle 0. The orientation/foreground smoke and probe therefore do not prove a geometry or physical folding transition. Model-level presentation recreation does not prove OS scene destruction. The one-authority app design and same-view retry have source, unit and scoped UI evidence; exclusive device distribution remains a separate policy gate.

The original failure/retry captures retain raw error copy, and the procedural artwork and remaining UI typography/contrast need later visual work. No videos were watched. No physical-device, acoustic-quality, thermal, sustained frame-time, ordinary Release, signing, App Store, VoiceOver or largest-text claim is made. HTTP/HTTPS denial is inside the prepared WebView rather than OS-wide airplane mode. The current success does not alter earlier source-bound failure records or automatically resolve the coordinator-owned operational incident.
