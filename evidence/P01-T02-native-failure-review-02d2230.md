# P01-T02 / P02-T01 — first-launch deadline and recovery accessibility observations

## Exact failed run

[Full native run 40463712735](https://github.com/cheshmakzanoon-ops/Tin-junction/actions/runs/40463712735), job `122056107043`, attempt 1, tested **`02d2230947528fedc3129d1d4ca43c9749cfa1c6`**. The native command exited **65**. All **84 unit tests passed**; **six of eight UI tests passed**. Installed-resource verification and clean app reinstall were skipped after the failure. This is a retained failure record, not task acceptance.

| Actual UI case | Result |
|---|---|
| Asset origin | Failed on **first launch**, `AssetOriginProbeUITests.swift:30`, waiting 40 seconds for `host.ready`; no tone tap or cold relaunch reached |
| Packaged renderer handshake | Passed, 18.687 seconds |
| Rotation/foreground smoke | Passed, 21.290 seconds; requested rotation does not establish a physical fold or an actual orientation transition |
| Native Help | Passed, 14.938 seconds |
| Real keyboard edit, durable save and relaunch | Passed, 78.731 seconds |
| Controlled startup hold, Help, release and real readiness | Passed, 20.443 seconds |
| Renderer initialization failure and Retry | Failed at `HostStartupUITests.swift:23`: failed WebView remained in accessibility traversal; Retry and foreground recovery were not reached |
| Platform geometry | Passed, 81.522 seconds; only the actual captured measurements are evidence |

The [compact observation](P01-T02-failed-startup-observation-02d2230.json) preserves archive, log, attachment and packaging identities, and all **107** relevant source hashes from the tested tree. The [test and trace excerpt](P01-T02-native-failure-tests-02d2230.txt) retains the actual outcomes without duplicating the full log.

## First-launch timeline and observation limits

The target application was PID **18942**, with observed WebContent PID **19189**. Its retained native report is exactly **`{}`**, a two-byte attachment. The failure hierarchy and screenshot show **“The railway took too long to open. Try loading it again. Your saved layout is retained.”** This is the existing native readiness deadline, not asset-policy preparation failure or the controlled renderer fault.

The target-app console was recovered from a Zstandard-compressed data object inside the actual xcresult. Its original and decoded hashes are retained; these are the target process's records, not unit-host events. Times below are relative to its first `webview.created` event:

| Event | Recorded elapsed time | Consequence |
|---|---:|---|
| Native WebView created | 0.000 s | Target trace begins at 07:06:57.218 UTC |
| Host loading begins | 5.225 s | Starts the unchanged 20-second deadline |
| Packaged document finishes navigation | 11.719 s | Navigation completed before readiness |
| Actual `web.ready` received | 23.675 s | First rendered readiness consumed **18.450 s** of the deadline |
| Native restore prepared | 24.963 s | Store load finished, but no layout acceptance followed |
| `host.failed.afterBridge` | 25.909 s | Deadline fired **20.684 s** after loading began |
| GLB / PNG / worker / WASM responses | 26.455–26.481 s | Diagnostic resource responses continued after native failure |
| WAV response | 26.898 s | Does not establish accepted audio decoding or playback |

No `host.layoutAccepted` appears for that process. The launch recording confirms loading, then restoring, then native timeout. XCTest's roughly 64.5-second launch-to-automation interval mostly preceded creation of this WebView; it must not be substituted for the native deadline duration.

The full hierarchy later contains diagnostic DOM text: **GLB, texture and worker passed; WASM and KTX2 blocked; audio pending**. This establishes that the diagnostic page eventually ran. It is **not** an accepted native report, decoded capability record, completed audio result, or second-session result. The failed host correctly rejects later messages until an explicit new load. No native asset completion is claimed from that DOM text.

## Bounded diagnostic scheduling repair

The tested bootstrap hook immediately imported and constructed the optional second WebGL renderer. Native `bootstrap`, lifecycle, viewport and layout messages are delivered serially. Consequently diagnostic initialization could run before `native.layout` was delivered and acknowledged. An isolated Chromium regression using the actual diagnostic bundle reproduced that ordering flaw: with bootstrap delivered and layout withheld, the diagnostic panel already existed while the actual application's `loaded` observation remained false.

The repair records the explicit session-bound diagnostic request at bootstrap. After applying `native.layout` and posting `layout.loaded`, it schedules diagnostic import in a later task with `setTimeout(0)`. This lets the layout receive callback return first. New bootstrap and page teardown clear pending starts; generation, session and disposal checks guard the timer, asynchronous import and report callback. The native deadline, loader outcomes, real gesture, CSP and bridge schema are unchanged.

This repairs the demonstrated ordering flaw. **It does not prove that diagnostic initialization exclusively caused the native timeout or that the earlier 18.450-second first-frame latency is fixed.** A fresh actual native trace must show `host.layoutAccepted` within the existing deadline, followed by the strict complete probe reports. If the first frame remains too slow, its actual costs need diagnosis.

The probe worker's local verification covers TypeScript checking, isolated actual-bundle browser ordering/cancellation tests, and the ordinary four-file bundle boundary. The pre-repair test failed as intended. Both initial repaired cases passed; independent review then separated the two cancellation scenarios so one could not mask the other, and the corrected cancellation case was run separately. Exact test revisions/results are retained in the JSON. The browser observes layout application, posting, callback return and a queued microtask sentinel; native receipt is a separate gate. The later-task scheduling guarantee also follows from the source's explicit timer.

The coordinator's separate integrated `npm run check && npm run bundle:ios` also exited 0: **108 project checks, 42 iOS tool checks and 304 web unit tests across 22 files**, plus TypeScript checking, ordinary build/verification and packaging. That integrated command intentionally rebuilt the shared ordinary output and native WebAssets. The [raw local output](P01-T02-startup-order-local-checks.txt) is 17,119 bytes, SHA-256 `4eb7bff1a3d0875504c30badd459b5f7c12d2f983e5b769fa265743e657d0dc2`. This Linux check does not compile Swift or run the repaired native application.

The ordinary output still contains only `index.html`, `bundle.js`, `bundle.css` and `bundle.js.LEGAL.txt`. The diagnostic module is absent from its build inputs; probe controls and fixtures are excluded. The probe worker's regression builds, separate boundary check and browser outputs used isolated temporary directories and did not overwrite the shared ordinary or native resources.

## Separate native recovery and controlled-delay findings

The controlled delay passed its actual UI assertions: native loading remained visible, Save was disabled, Help opened and dismissed, and exactly one WebView existed before navigation. Releasing the one-shot hold reached the real packaged renderer, removed the hold/loading UI, preserved one WebView and enabled Save. Captures `EA69B7FE-9183-46F7-8DE6-610DE3AAEC7B.png`, `B168C84F-D632-4470-AE8D-66FA9A2D632A.png` and `EA3D1BE9-4353-49E9-8B10-BF41D5D50E0D.png` preserve those stages.

The separate controlled renderer-failure case reached the exact `renderer_initialization_failed` status. Its distinct recovery container and `host.retry` identifier were present; Retry was hittable and at least 44 points in each dimension. The actual screenshot shows readable Retry text. This confirms progress beyond the earlier inherited-identifier failure.

It then failed because `host.webview` still existed in the accessibility tree. SwiftUI's wrapper-level hiding had not removed WebKit's remote accessibility descendants; the asset failure's full hierarchy independently exposes real web controls behind its recovery overlay. The contrast audit, Retry action and foreground recovery assertions did not execute. The coordinator owns the narrow UIKit visibility/accessibility repair, keeping the same WebView for explicit retry. Source review or deterministic fixtures for that repair do not substitute for the next actual native UI result.

## Retained artifact and remaining gates

[Artifact 12716507656](https://github.com/cheshmakzanoon-ops/Tin-junction/actions/runs/40463712735/artifacts/12716507656), `duo-host-40463712735-1`, was downloaded and independently hashed: **262,080,184 bytes**, SHA-256 **`3400c70020d6ee465f0ae5990ced25597bf5fbb99397c51a658a652895acd0a7`**. Retention ends **2026-11-10 07:12:49 UTC**. Its full `xcodebuild.log` is **298,792 bytes**, SHA-256 **`4fc1bff5ea22cd50b1b3bdace30d5c5e1512d358e104c3ba685fde7d2a71d27d`**.

`packaged-web-input-manifest.json` is the actual generated packaging input. Neither installed-resource identity nor clean-reinstall proof exists in this attempt; both workflow steps were skipped. Cleared/nonpersistent WebKit data is not native app-container deletion. HTTP/HTTPS denial in WebKit is not physical airplane mode. Passing units and the six successful UI cases remain separately useful historical evidence, while full P01/P02/P04 integration, completed first/cold/clean-install asset sessions, physical-device behavior, final art, performance, signing and distribution remain unestablished by this run.
