# Native observations at 53e193b: recovery passes; termination failures retain the gate

The required full run **40471495670**, attempt 1, tested exactly `53e193b6435d241f8c1462d859112b2cb1b56b77`. It completed with **87 native unit passes and 6 of 8 UI passes**, exit 65. The two failures were XCTest termination operations. Installed-resource verification and the clean uninstall/reinstall repeat were skipped. This record preserves successful individual observations and the failures; it is **not a full integration acceptance**.

## Actual outcomes

| UI case | Actual result | Scope |
|---|---|---|
| Asset-origin probe | Failed, 184.412s | First session completed all loader/audio assertions; explicit `app.terminate()` at line 22 failed. Cold `app.launch()` at line 23 was never entered. |
| Bundled-renderer handshake | Passed, 26.414s | Existing readiness/WebView assertions executed. |
| Rotation/foreground smoke | Passed, 48.543s | Existing automation assertions executed; this alone does not prove a geometry transition. |
| Standalone native Help | Failed, 123.295s | `app.launch()` at line 123 failed while implicitly terminating the preceding rotation/foreground app. Help body was unexecuted. |
| Save/relaunch smoke | Passed, 109.529s | Existing real edit/save/acknowledgement/relaunch assertions executed. |
| Controlled startup hold | Passed, 52.504s | Actual loading overlay, Save disabled, Help open/dismiss, one WebView, release to real readiness and Save enabled. |
| Renderer failure/retry | Passed, 31.621s | Exact initialization error, failed-WebView AX exclusion, contrast audit, hittable native Retry, actual readiness, one WebView and foreground checks. |
| Platform probe | Passed, 62.615s | Three reports were all 382 by 574.6666666666666 points, scale 3, hinge 0; no actual rotation/hinge transition established. |

These unit results are from the full run, whose unit summary is 6.695 (8.657) seconds. The separate focused-model run 40471495783 also passed 87 tests and has its own artifact and timing; the two results are not relabeled.

## What the original termination diagnostics establish

The decisive text is an original runner/host diagnostic object within the full xcresult. Its compressed bytes SHA256 is `c494b01209106b5dbd43ec50e4bc82a02f81f30683ea6ee2804fb87cc786cc7b`; Zstandard decompression at offset 0 yields 6,452,992 bytes, SHA256 `adbe5f04c3e114c388652789a46e76c61d11b90894da408bc6bebfb100995b65`. The machine record identifies the full original entry. The separate termination excerpt retains selected original lines and records the selection; no messages were reconstructed.

| Event, UTC | Asset first session, PID 11744/token 1 | Previous rotation app, PID 13723/token 3 |
|---|---|---|
| Last target responsiveness retained | AX main-loop work completed 08:20:33.117990, reply 08:20:33.118144 | Main-loop idle reply 08:22:50.223274; animations idle 08:22:50.223385 |
| Runner asks Xcode to terminate | 08:20:33.291 | 08:23:03.204 |
| Xcode logs receiving the request | 08:20:33.362 | 08:25:01.697 |
| Xcode logs tracker cancellation | 08:21:07.881 | 08:25:01.702 |
| Xcode death notice, signal 15 | 08:21:24.865 | 08:25:05.758 |
| Runner timeout, still reports Running Foreground | 08:21:33.347 | 08:24:04.058 |
| Runner receives not-running state | 08:21:43.380 | 08:25:05.473 |

Both failure paths show delayed host processing and/or state acknowledgement. For the asset app, a death notice precedes the runner timeout, demonstrating that the timeout's Running Foreground state was stale. The later PID 0 in the failure text follows XCTest resetting its tracked PID; it does not establish that the original app never launched. The Help termination request is logged by the host after the runner's 60-second deadline. Logs use their recorded per-process timestamps; merged-file position is not chronological ordering.

The cause of these delays remains unknown. The target was responsive at its last recorded AX requests; there is no basis here for claiming a product main-thread shutdown deadlock or a repaired app shutdown path. The diagnostic message about ignoring a mismatched launch-session exit also appears during a successful termination of PID 12959/token 2, so it is not a unique cause. Full and focused jobs advertise different runner IDs, 1000015885 and 1000015886; the same cloned Simulator UDID does not establish a shared machine.

No explicit `XCUIApplication.state` attachment was recorded at either failed call site. The asset teardown's retained text says only `Native probe row unavailable`; the Help test has a recording but no body/failure hierarchy capture. Runner state notifications above are original diagnostics, not an invented public fixture observation. Future test cleanup or state logging must retain all assertions and receive a new actual run.

## First-session bundled origin and audio

The native accepted terminal report is `screenshots/07D05F8A-627B-4753-96F2-EACEDB2096AC.txt`, session `30652382-11CC-4619-8986-06FF01D92CE2`, stage complete. The machine record embeds both original initial and terminal JSON values with their byte identities. Actual first-session observations were:

- Custom-origin GLB parsed 14 meshes and 280 triangles, with 423 visible WebGL pixels.
- Original 8 by 8 PNG produced all four expected quadrant colors.
- The bundled classic worker returned `asset-worker-ready:42`.
- The real tap resumed AudioContext to running and the decoded mono PCM WAV completed playback: 5760 frames at 48000 Hz.
- WASM bytes arrived but compilation was blocked by unchanged CSP. KTX2 remains blocked because the transcoder/fixture are absent. Neither is a successful compressed-texture claim.

The native wrapper reports a nonpersistent WebKit store, WebKit data cleared and HTTP/HTTPS resource denial. That is not native app-container deletion or physical airplane mode. The first asset screenshot was visually inspected: fixture rendering, all four quadrants and audio-passed status are visible. Native startup trace records loading at+4.568s, layout acceptance at+18.847s and GLB delivery at+19.125s; this run's actual loading-to-acceptance interval is 14.279s. It does not explain all prior timing variability.

## Recovery and held-start results

The previously failing failed-WebView accessibility assertion now passed unchanged. The successful test also checked exact `renderer_initialization_failed`, a distinct recovery container, individual Retry identifier, hittability and at least 44-point dimensions, absence of ready state, Help availability, the public contrast audit, actual Retry to packaged readiness, disappearance of recovery, one WKWebView, and Home/activate with readiness and one WKWebView. Original PNGs `BC995F99-4E60-4872-8E4C-DD4B0966C7F6.png` and `7DCB302F-2BB3-4488-9BA6-F15D7FB4D4B2.png` were visually inspected: the native error/Retry is legible and the latter shows the actual restored railway. This is scoped contrast/accessibility-query evidence, not actual VoiceOver navigation.

The separate held-start test passed its real loading-overlay/Save/Help/one-WebView assertions before and after opening and dismissing Help, then released the diagnostic hold and reached actual readiness with Save enabled. Captures `DF9EA715-BA0C-48C6-801F-BFF844C12919.png` and `EEEF5B17-F8C2-47DF-91BE-0BE61ACE877D.png` were visually inspected; `C28FE332-A13B-4F01-B7DD-AB2229AA791B.png` is retained as the post-Help held capture. Controlled readiness and renderer-failure recovery are separate successful observations; neither changes the full-run failure or unexecuted standalone Help/cold-probe bodies.

## Artifact and source integrity

The full archive is artifact 12719623690, 411,740,701 bytes, SHA256 `9e5fa0d5ff94fe82fafec6600fd405c0b6c0eaab044564329b5901706d238997`, retained until 2026-11-10T08:30:17Z. Its original xcodebuild.log is 338,566 bytes, SHA256 `27b4ae1bb7fb169225f8dbe01c9bf4d0b7f5c2058625444e7ad0b4eeca4ab622`; the combined-stream log includes `** TEST FAILED **`.

The new bounded reports and captures archives were downloaded and independently verified against their provider digests. Their identical index identifies this commit/run/attempt, complete staging and no issues. All 52 report files and 14 original PNGs, 16,791,904 total bytes, match their indexed paths, lengths and SHA256 hashes, and were independently compared against the full original archive. Packaging success is separate from test success. Original video recordings remain in the full archive; they are not disguised as PNG or report payloads.

The uploaded `packaged-web-input-manifest.json` is a packaging input: 1,592 bytes, SHA256 `47974b52afb8076476bda63262319bb96db60ca30cfbe60bfb3fbcc6805454cc`. Its JS is 801,455 bytes, SHA256 `c037026dc0865d5c6d5e81e998deee4682959e60f7be82c3cca7db6ff089d68b`. Installed-byte verification did not run, so these are not labeled installed resource identities.

All 112 transitive source/build/workflow fingerprints are retained from immutable 53e193b, including the container, diagnostic/bootstrap inputs, full runner, clean-install tools and evidence staging. Subsequent source changes do not alter this tested identity. No retry, source change, state transition, task acceptance, physical-device pass, distribution signing or production-art claim is made by this record.
