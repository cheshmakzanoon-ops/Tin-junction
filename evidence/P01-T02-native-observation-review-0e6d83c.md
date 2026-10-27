# P01-T02 — actual asset success and separate recovery failure at 0e6d83c

**Observed:** the packaged asset probe passed in two real iPhone Duo Simulator app sessions. **The required full native suite failed:** one recovery accessibility assertion failed, and the installed-resource and clean-reinstall steps did not execute. This record is an observation of the exact tested commit, not task acceptance or a passing whole-task integration manifest.

## Immutable run and artifact

- Tested commit: `0e6d83c24bd4e0ed5413c095ebaee1cbbc09d406`.
- Run: [40467652957](https://github.com/cheshmakzanoon-ops/Tin-junction/actions/runs/40467652957), attempt 1; job `122069396584`, runner `1000015884`.
- GitHub records completed/failure at `2026-10-27T07:52:45Z`. Native test command exited 65. Evidence upload succeeded; installed-resource verification and clean reinstall were skipped.
- Independently downloaded artifact `12717438505`, `duo-host-40467652957-1`: **297,014,053 bytes**, SHA-256 `d3db5275efd6418f5fd054df29dfa6ddacde6de636c3e5ae640bf183e4858104`. The downloaded digest matches the API and upload log. Retention ends `2026-11-10T07:52:13Z`.
- Original `xcodebuild.log`: **299,139 bytes**, SHA-256 `b7bcb2be43e086ae9600a3cc2a2827ba36df5299241272abe72eb76b25a05868`.

The companion JSON preserves 108 source fingerprints from the immutable tested Git objects, exact report/capture identities, and the generated packaging-input manifest. Subsequent native or artifact-packaging repairs do not inherit this run's result. Large binary captures and the xcresult remain in the retained Actions artifact, rather than ordinary Git.

## Actual test outcomes

All **84 native unit tests passed**. The UI suite executed **8 tests: 7 passed and 1 failed**.

| Actual UI case | Outcome | Seconds |
|---|---|---:|
| Asset origin after WebKit data reset and cold relaunch | Passed | 70.478 |
| Bundled renderer handshake | Passed | 15.268 |
| Rotation/foreground smoke sequence | Passed | 21.124 |
| Native Help | Passed | 13.668 |
| Keyboard edit, acknowledged save and cold restore | Passed | 56.596 |
| Controlled startup hold, native Help and release | Passed | 19.816 |
| Renderer initialization failure and native Retry | **Failed at the accessibility exclusion assertion** | 13.699 |
| Platform geometry sequence | Passed | 53.667 |

The names of the orientation tests do not establish an actual rotation or hinge transition. The full raw test log remains authoritative; the companion excerpt retains the exact outcomes and selected original target-app trace events.

## Two accepted native asset reports

The first app session is `F645643C-DF4B-46B5-800E-E24DC83A249F`; the cold-relaunch session is `EA7CEE44-EEBD-43A9-9EAE-69B4B83A6EE5`. Each initial accepted report was `ready` with audio pending and a suspended AudioContext. XCTest then tapped the actual accessible **Play probe tone** control. Each final native-accepted report reached `complete`, with audio passed and the context running. The two session identifiers differ.

| Capability | Actual observation in both sessions |
|---|---|
| GLB through `tinjunction://bundle` | Passed: 14 meshes, 280 triangles, 423 non-background readback pixels |
| Original PNG texture | Passed: 8 × 8 pixels; all four expected quadrants reached WebGL readback |
| Bundled classic worker | Passed: `asset-worker-ready:42` |
| WAV decode and user-gesture playback | Passed: mono, 5,760 decoded frames, 48,000 Hz; source completion observed |
| WASM | Blocked by the unchanged `script-src` policy; the exact WebKit CompileError is retained |
| KTX2/Basis | Blocked: no transcoder or fixture is packaged; this loader remains disabled |

Each native wrapper records `http-https-denied`, a nonpersistent WebKit store, and completed WebKit data clearing. This proves the exercised custom-origin operations under the installed WebView content rule. It does not prove hardware airplane mode, acoustic quality, native app-container deletion, or a successful KTX2/WASM path. The artifact includes the original first-launch and cold-relaunch diagnostic captures and all four accepted JSON reports. The first-launch capture was visually reviewed: the calibration model, color quadrants, and reported outcomes are present. This diagnostic is not production artwork.

## Actual readiness ordering

The original xcresult console object was decompressed without changing its bytes. Selected events retain their original timestamps, process identities, and elapsed values. Interleaved logging prefixes are excluded only when extracting an exact complete `[TinStartup]` event substring; the original compressed and decoded object digests remain in the companion JSON.

| Native target app | Loading begins | Native layout accepted | First GLB response | Acceptance after loading |
|---|---:|---:|---:|---:|
| First session, PID 9963 | +4.839 s | +15.990 s | +16.103 s | 11.151 s |
| Cold relaunch, PID 10864 | +4.340 s | +6.412 s | +6.603 s | 2.072 s |

Both actual native acknowledgements occur within the unchanged 20-second readiness deadline and precede diagnostic resource responses. This verifies successful ordering in these attempts. It does not establish that eager diagnostics were the exclusive cause of the previous timeout, or eliminate variability in initial renderer startup.

## Sole failure: failed renderer remains in the accessibility subtree

`HostStartupUITests.swift:23` fails `XCTAssertFalse(app.webViews["host.webview"].exists)` with the unchanged requirement that unavailable web controls not remain in recovery accessibility traversal. The preceding assertions passed: exact `renderer_initialization_failed` status, a distinct native recovery container, an accessible Retry identifier, a hittable Retry, and both Retry dimensions at least 44 points. The screenshot visibly shows the native recovery screen and legible Retry text. The later Help assertion, contrast audit, Retry tap, real retry readiness, and foreground recovery assertions were **not reached**.

The original failure snapshot is `screenshots/41D76F55-A5B4-4DF5-B196-91733B6B3393` (NSKeyedArchive, 24,455 bytes). It contains `host.webview` in app PID 15944, its scroll/content containers, and **51 descendant snapshot nodes belonging to WebContent PID 16580**, including an explicit `UISlider` class. This is more than an empty native view identifier. Most remote labels and element types were not requested by that targeted snapshot; it does not prove that every descendant was interactable. Nor does it reveal whether SwiftUI overwrote UIKit flags or WebKit retained remote accessibility exposure. The earlier `isHidden`/`accessibilityElementsHidden` implementation did not satisfy the actual UI assertion.

The native trace records `host.failed.beforeBridge` at +3.834 s and navigation completion with `window=1` at +3.883 s. No Retry action followed the failing assertion. The pending repair must remove the unavailable subtree while retaining one renderer identity and must preserve the same actual native UI assertion. It requires a new compiled and executed native run.

## Controlled readiness and remaining gates

The separate controlled-delay case passed: the real native loading state was held before navigation, Save was disabled, Help opened and dismissed, one WebView remained, and explicit release reached the real restored renderer with Save enabled. Its held and released captures were visually reviewed. Those captures establish the tested app states, not production art quality.

No installed-byte identity report exists in this artifact because that step was skipped. `packaged-web-input-manifest.json` is the **generated packaging input**, not proof of the installed app's bytes. No clean-reinstall trial exists. P01-T02 still requires the mandated successful full suite, installed identity verification, and observed native uninstall/reinstall repetition. P02-T01 still requires the actual recovery accessibility, contrast, Retry, and foreground sequence to pass. Physical-device, distribution, signing, acoustic and visual-quality gates remain separate.
