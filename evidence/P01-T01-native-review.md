# Public platform adapter: recorded native result

The public hinge/region adapter compiled and the native test workflow passed at implementation **637b0dd348dbef0fe92b23aa32b7b0a5f7761ded**. This establishes evidence for the platform compilation/inventory question only. It does not establish physical Duo behavior or a supported commercial eligibility policy.

[Actions run 40446521510](https://github.com/cheshmakzanoon-ops/Tin-junction/actions/runs/40446521510) and [job 122000278157](https://github.com/cheshmakzanoon-ops/Tin-junction/actions/runs/40446521510/job/122000278157) completed successfully on 2026-10-27. The unsigned Debug build executed **52 native unit tests and 5 UI tests with no failures**, including the actual keyboard edit, acknowledged native save and exact-name relaunch, guide dismissal, lifecycle survival and platform-observation test. The separate simulator selector step passed all eight tests, including explicit rejection of ordinary iPhones, renamed non-Duo devices, unavailable runtimes and ambiguous inventory.

## Actual toolchain and simulator

| Item | Recorded value |
| --- | --- |
| Runner macOS | 27.0.1, build 26A434 |
| Xcode | 27.1, build 27A9275 |
| iOS Simulator SDK | 27.1 |
| Selected device | iPhone Duo |
| Device type | `com.apple.CoreSimulator.SimDeviceType.iPhone-Duo` |
| Runtime | `com.apple.CoreSimulator.SimRuntime.iOS-27-1` |
| UDID | `4C56FCAC-377C-469C-B415-8ABBC4375CBA` |

The selector chose this actual inventory entry before boot. Its recorded `Shutdown` state is the pre-boot inventory state, not the later test state. No generic iPhone fallback or guessed model identifier was used.

## Observed geometry and its limit

The UI test requested portrait, landscape-left and landscape-right in sequence. At each request, the DEBUG-only report matched the actual WKWebView accessibility frame within one point, and the guide could be dismissed using its real button. All three reports were identical:

- viewport **382 × 574.6666666666666 logical points**, pixel ratio **3**;
- `isSimulator: true`;
- hinge observation **measured**, angle **0 degrees**;
- reserved rectangles **(399.6666666666667, −40, 37, 37)** and **(382, −69.33333333333333, 84, 174)** in engine-view coordinates.

The retained screenshots all remain portrait. These results establish consistent measurement after the requested orientations; they do **not** establish an actual display rotation, expanded-screen geometry or a fold transition. The source code retains observed negative reserved-region coordinates instead of fabricating a nominal screen or hinge width. This is not evidence that every rendered control avoids every reserved region.

No nil-hinge observation occurred in these runtime samples. Independent unit fixtures prove that an observed nil hinge, an absent callback and a measured zero angle remain distinct in the payload; those synthetic fixtures are not device observations. The official-source review separately records the optional public API and the absence of a verified command-line fold control.

## Evidence identity and retention

Artifact **12709365676**, `duo-host-40446521510-1`, is **184,855,412 bytes**. Its downloaded ZIP SHA-256 is **8a358a1eba886141de5eae1879393246cf270c9fdb15e2abafc0d7136814417c**, matching the Actions digest. It retains the full xcresult, original logs, inventory, screenshots and recordings until **2026-11-10**.

`P01-T01-platform-observations.json` retains the compact original observations, every relevant attachment identity/hash, and hashes of the original compiler, SDK, inventory and build-log files. The accompanying native and selector excerpts preserve the relevant passed results. Large captures remain in the Actions artifact.

Physical fold sweeps, hardware haptics/audio, sustained frame time and thermal behavior, production art approval, signing and App Store exclusivity remain separate unverified gates. This evidence makes no release-readiness claim.

## Handoff

The implementation checkpoint includes the public `RootView` hinge/reserved-region adapter, read-only DEBUG platform report, unit checks for nil/invalid observations, actual-viewport UI checks, strict simulator selection and captured toolchain inventory. The subsequent guide hit-area repair is part of the tested checkpoint; its prior failed run remains documented separately in `P04-T06-help-hit-area-review.md`.

Acceptance inputs are `P01-T01-native-integration.json` for A1 and `P01-T01-source-verification.json` for A2. They cite actual commands/results and exact source fingerprints from the tested implementation. The coordinator owns the ledger transition and regenerated planning views.

The next exact task is **P01-T02**: prove original GLB/texture fixtures, audio, worker and decoder paths in the packaged custom origin with WebView HTTP/HTTPS denied; repeat after clearing WebContent data; retain explicit unsupported-path observations; and verify that ordinary Release bundles omit all probe code, controls and assets. It must not use browser HTTP results as packaged-origin evidence. The hardware and commercial checks listed above remain unrun.
