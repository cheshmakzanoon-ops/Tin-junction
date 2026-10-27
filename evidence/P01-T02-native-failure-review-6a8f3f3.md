# P01-T02 — actual packaged fetch failure and bounded repair

## The failed run

[Full native run 40451042264](https://github.com/cheshmakzanoon-ops/Tin-junction/actions/runs/40451042264), job `122014401975`, attempt 1, tested **`6a8f3f3bf7e071e421f4d16f8d514097be9ffb67`** and failed with exit **65**. Unlike the preceding [Simulator preflight failure](P01-T02-simulator-preflight-failure-8f96036.md), this attempt compiled the app and executed the native tests.

All **69 native unit tests passed**. The four existing host smoke tests and the platform UI probe also passed. The two new UI tests failed for different reasons:

| Test | Actual result | Meaning |
|---|---|---|
| `AssetOriginProbeUITests.testActualBundledOriginAfterWebDataResetAndColdRelaunch` | The first-launch report reached its loader assertions; GLB status was `failed`, where the unchanged test requires `passed` | A real packaged resource-loading defect; the second launch was not reached |
| `HostStartupUITests.testRealRendererInitializationFailureOffersWorkingNativeRetry` | `app.launch()` failed at line 9 because XCUITest could not terminate the preceding app process, PID **87900** | Renderer-failure and Retry assertions were never executed; this is no evidence for or against their product behavior |

The failed probe had used PID **87176**. HostStartup's different PID **87900** came from the preceding successful save/relaunch smoke test. The later launch failure must not be attributed to the probe merely because both failed in the same run. The save/relaunch assertions passed, including real keyboard input, durable save and restored name. Its teardown was unusually long; this record does not infer a root cause for the XCUITest termination failure.

The [compact actual test excerpt](P01-T02-native-failure-tests-6a8f3f3.txt) preserves both failures and the successful suites. Neither P01-T02 nor P02-T01 integration is accepted by this run.

## Recovered native observations

The probe's Swift `defer` did not execute after XCTest stopped the test at its failed assertion with `continueAfterFailure = false`. The exported attachment manifest therefore contains no named probe JSON or screenshot. This evidence gap was observed directly; a deferred capture was not treated as if it had run.

The complete report was recovered from the actual xcresult diagnostic data. Its Zstandard-compressed blob contains the native accessibility response for `XC_kAXXCAttributeValue` at **2026-10-27 04:49:53.768191 UTC**. Decoding that escaped JSON string produces the [retained observation and exact recovery provenance](P01-T02-failed-origin-observation-6a8f3f3.json). No loader result was supplied or guessed by the reviewer.

| Probe | Native report | Observed detail |
|---|---|---|
| Entry and renderer | `tinjunction://bundle/index.html`; WebGL2 `true` | The real packaged origin was active |
| GLB | **failed** | `Error: calibration.glb: response 0`; no mesh parsing, triangle count or visible pixels |
| PNG texture | **passed** | 8 × 8 original PNG; all four expected color quadrants reached GPU readback |
| Classic worker | **passed** | The bundled worker returned `asset-worker-ready:42` |
| WASM | **blocked before compilation** | `Error: add-one.wasm: response 0`; no WASM result, and no conclusion about CSP compilation support |
| Audio | **blocked before decoding** | `Error: tone.wav: response 0`; context remained suspended, with zero decoded frames; no tone was played |
| KTX2 | **explicitly blocked** | No Basis/KTX2 transcoder or fixture is packaged; the loader remains disabled |

Native-supplied conditions were `networkPolicy: http-https-denied`, `webDataCleared: true`, `persistentStorage: false`, and `isSimulator: true`. These describe WebView preparation, not hardware airplane mode or an app-data uninstall. The report session was `05797D86-ED34-4ECE-8CC1-7C6022F61FE5`; it reached `stage: complete` because each probe had an outcome, not because each outcome succeeded.

Visual inspection of the actual probe recording at media time 35 seconds confirms a blank GLB half, a visible four-quadrant texture half, the same loader statuses and a disabled tone button. The recording is `screenshots/A96D6804-6831-4B67-A506-305D9F24390B.mp4` inside the artifact. The extracted review frame has SHA-256 `c491783b40f5a2e6a67c516a40d09ef7bd161f5250be57bb17fcfc47a19c5f13`; the large video/frame is not committed to Git.

## Cause and repair scope

The existing handler returned a generic Foundation `URLResponse`. The probe correctly requires the Fetch API's `response.ok`, and the actual native Fetch responses carried status zero. WebKit's [maintainer explanation in bug 203273, comment 9](https://bugs.webkit.org/show_bug.cgi?id=203273#c9), retrieved on 2026-10-27, explains that Cocoa extracts response status and headers when the response is an `NSHTTPURLResponse`.

The bounded repair changes `BundleSchemeHandler` to return public `HTTPURLResponse` metadata with status **200**, only the policy-owned `Content-Type`, and the measured byte `Content-Length`. Text responses retain UTF-8; binary responses do not acquire a text charset. Resource size and extension checks remain explicit. No request header is echoed; no redirect, CORS exception, private WebKit setting or CSP change is introduced. The probe still rejects `response.ok == false` and still requires actual GLB rendering.

Two new response-contract unit tests exercise binary status/MIME/length, exact fixed header keys, text encoding, byte length and unsupported/oversized inputs. They are authored but **not yet compiled or run** in this Linux workspace. The next actual native run must verify the public response contract and the unchanged packaged fetch/render assertions.

The UI probe now attaches raw observations before validating their contents, captures the render before loader assertions, and registers XCTest teardown blocks for failure capture followed by termination of its own app. The save/relaunch smoke test also registers termination of its final relaunched app as fixture cleanup; every existing assertion remains. This improves ownership and failure evidence. It is **not claimed as a proven repair of the separate XCUITest launch failure**, and product recovery logic is unchanged.

Apple's [Xcode 15.3 release notes](https://developer.apple.com/documentation/xcode-release-notes/xcode-15_3-release-notes) document main-actor isolation for synchronous `addTeardownBlock` closures; no private XCTest behavior is required. The deferred-capture failure itself remains recorded above.

## Artifact identity and limits

[Artifact 12711102321](https://github.com/cheshmakzanoon-ops/Tin-junction/actions/runs/40451042264/artifacts/12711102321), `duo-host-40451042264-1`, was downloaded and independently verified: **370,052,062 bytes**, SHA-256 **`69b0c95050ae99195f1e0ea153bb3c386ead50daed2fe550897a43748546804b`**. Its full `xcodebuild.log` is **269,721 bytes**, SHA-256 **`2304d1cb04cb8b51beb8b99a58834436193011188b6a7658210136aa1a55a792`**. Current retention ends **2026-11-10 05:04:34 UTC**.

This artifact did not upload the generated or installed WebAssets manifest. Its exact bundle identity must not be reconstructed from a later build and relabeled as measured here. A separately coordinated recorder will preserve those identities in a later run. That later source also includes application changes beyond this tested commit, so this result remains historical; changed relevant source fingerprints must be retained rather than omitted for current acceptance.

No native repair success, second cold-load success, audio output, WASM execution, actual startup Retry, physical-device quality, final art or release approval is claimed by this failure record.
