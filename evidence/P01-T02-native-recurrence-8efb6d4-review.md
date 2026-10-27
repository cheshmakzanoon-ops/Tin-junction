# Native recurrence at 8efb6d4: startup deadlines and termination observations

Recorded 2026-10-27T09:51:20+00:00 by submission-native. This is a mixed/failure observation and diagnostic review, not an acceptance manifest or a claim that the app is ready for submission.

## Tested identity and actual result

The original run is [iOS simulator 40480076020, attempt 1](https://github.com/cheshmakzanoon-ops/Tin-junction/actions/runs/40480076020), tested commit `8efb6d4edc68058a5c809ab80118105f1a805d60`. The indexed native test step failed; installed-resource verification and clean installation were skipped. The compact index says staging completed with no issues. The coordinator separately checked every compact original against the full archive. This review independently hashed the downloaded archives and decoded the original result objects.

An immutable Git comparison from accepted commit `c1e6e39ba127e064f4907e9c5a1d84fed7163990` to tested `8efb6d4` returned no changed paths under `apps`, `web`, `tests`, `tools`, or `.github/workflows`. The generated packaging-input manifest is also byte-identical to c1: 1,592 bytes, SHA-256 `0fce39ed2cc596246e79efb8ba8fec8c871caae2cce7083ad38a87bbe609d8bd`. It remains packaging-input evidence; the skipped installed step supplies no new installed-file proof. Unpublished security/preferences work was not part of this run and cannot explain its failure.

The original log records **87 native unit tests with zero failures**, then **8 UI tests with three counted failures**, followed by `** TEST FAILED **`. The failed UI tests are the first asset-origin readiness assertion (`AssetOriginProbeUITests.swift:34`), basic renderer handshake (`HostSmokeTests.swift:14`), and the explicit termination before saved-layout relaunch (`UITestApplicationLifetime.swift:43`). Rotation/foreground, Help, controlled startup hold, renderer-failure Retry, and platform probe cases passed. The asset fixture's later teardown also timed out in the runner log; it did not produce a fourth counted UI failure. No cold asset session, restored-layout relaunch assertion, installed-resource verification, or clean-install result is established by this attempt.

## Original byte identities

| Original downloaded archive or file | Bytes | SHA-256 |
| --- | ---: | --- |
| Full native ZIP | 329467294 | `5c05cacb26b2b655d14a52a43b529c15bb28d0944abd1f881847ebecb4f15f35` |
| Compact reports ZIP | 244944 | `4a333c77b3938cefb3f08d57480c028b96a1ca4ff006b2ddd35cdc22de761915` |
| Original captures ZIP | 10819312 | `1de366c0b2499aef1a5f3ad2e2663d44005bd5a0c211332f17e7f89e3ee12372` |
| Original `xcodebuild.log` | 336479 | `d31da4126512a6e0df153e2d32d276ef51ac93c3785ad772ac7d1053bd463b50` |

The local full ZIP is `/tmp/tin-native-8ef-full.zip`; compact originals are under `/tmp/tin-native-8ef-reports` and `/tmp/tin-native-8ef-captures`. Binary originals are not added to Git. Provider retention remains governed by the workflow/artifact metadata; local copies are not a guarantee of permanent external retention.

The target-console object is full-ZIP member:

`TinJunction-20261027T092437-95430.xcresult/Data/data.0~xTwmFpK1MGY1nF153Fw1_A-LtTfAN9A2X5SrWHGijouRERIpqrhW2KFZtBVTopLyRJ2nxtO4EbKzsNQLY97xvA==`

Its compressed bytes are 257251, SHA-256 `9875629d84c22e0fc59f97eae080271609575ad0e2e8d096133d5e5e63c06abb`. Decoding its Zstandard frame at offset zero produces 4143412 bytes, SHA-256 `86aee07919c85004e08aad0d81827b83f815a3a02222cb5e71d8a75b6ce8d95c`. The scratch extraction is `/tmp/tin-native-8ef-trace-review/trace-object-6.bin`. The ordinal 6 is a local extraction index, not a provider-issued object identifier; the complete member name and hashes identify the original.

The detailed runner/Xcode object is:

`TinJunction-20261027T092437-95430.xcresult/Data/data.0~l9itPC9TbveQOY1OQi8x3n1rrM6Pxr3Hmp1Di6JO5LDVWIj8Qh2XJkRvjpCpmIsGhQNfPmf8dIDsddxQqHYszQ==`

Its compressed bytes are 399759, SHA-256 `cae4895c2b35973a80c9f14abc78776da7b3ff6c10a79b030ed871536b660070`. Offset-zero Zstandard decoding produces 6500781 bytes, SHA-256 `7293c62e7faf622bba23d55f1b91c0f9bfd44c006ded9df4708c3ffe38df3d57`. The scratch extraction is `/tmp/tin-native-8ef-runner-review/candidate-4.txt`; ordinal 4 is likewise local only.

## Startup failures are distinct

Elapsed values below are the target's monotonic trace offsets, rounded by the original logger. They are relative to that process's first trace record, not test-start or application-launch timestamps.

| Actual event | Asset fixture, app PID 672 | Handshake fixture, app PID 4296 |
| --- | ---: | ---: |
| Native `host.loading` | +6.119 s | +7.882 s |
| HTML read ready | +6.125 s | +7.892 s |
| Navigation committed, attached window | +12.550 s | +8.024 s |
| CSS read ready | +12.552 s | +8.135 s |
| JS read ready | +12.555 s | +8.388 s |
| Navigation finished | +24.232 s | +11.113 s |
| Native received `web.ready` | Not recorded before failure | +28.336 s |
| Native restore prepared | Not recorded before failure | +28.421 s |
| Terminal host failure | +26.660 s, before bridge | +28.422 s, after bridge |

For the asset fixture, approximately 20.541 seconds elapsed from `host.loading` to terminal failure. The native failure hierarchy explicitly says the railway took too long to open. The accepted probe observation is still the original two-byte `{}` in `screenshots/F2E204FC-ED93-478C-AB90-B6BC1511E2CB.txt`; no asset stage or cold relaunch ran. A long automation interval also occurs while checking readiness: test elapsed 21.72 to 51.01 seconds. This alone does not identify which process caused the wait.

For the following handshake, native receipt of `web.ready` occurs approximately **20.454 seconds after loading**, and terminal failure approximately 20.540 seconds after loading. Restore preparation follows the late ready receipt, but there is no `host.layoutAccepted` event. The original 20-second watchdog starts in `loading()` from actual provisional navigation, is cancelled on accepted layout, and cannot reopen a failed session through a late bridge message. Its task runs on the main actor, so the source interval is not a promise of an exact wall-clock callback instant. The observed timing is consistent with an exhausted startup budget; it does not justify increasing that budget or skipping real readiness.

The tested web source posts `web.ready` after its first `scene.render` return. The native timestamps cannot divide the preceding latency into resource delivery, JS execution, first-frame/GPU work, bridge transport, or native scheduling. In particular, the optional asset renderer begins only after the normal layout path; an absent accepted probe report is not proof that the asset fixture renderer caused this earlier failure.

The target console supplies two additional WebKit observations. For app PID 672, it records `WebProcessProxy::didBecomeUnresponsive` and `WebPageProxy::processDidBecomeUnresponsive` for **observed WebContent PID 1244** at 09:27:38.103, before native provisional navigation at 09:27:39.182. For app PID 4296, WebKit records a GPU process `IdleExit` at 09:30:59.569, before loading at 09:31:00.387. Both observations are retained verbatim. Neither is classified as the exclusive cause, proof of a GPU crash, or proof of an application deadlock. Reading reported PIDs for diagnosis does not authorize guessed process termination.

## Two termination sequences

The asset test reached fixture teardown with public automation state `runningForeground`; it sent the termination request at **09:29:05.939**. Xcode records receipt at **09:29:10.214**, and execution-tracker cancellation at **09:29:11.538**. The runner then records a 60-second predicate timeout at **09:30:06.137** while its state is still `Running Foreground`. There is no after-termination lifecycle attachment. The runner interrupts teardown; its existing readiness assertion remains the one counted case failure. This is a recorded cleanup failure, not evidence that the next case inherited the same application process.

The save fixture is materially different: app PID 4702 had accepted its layout at +10.328 seconds and reached its durable-save assertions/capture before termination. The last recorded target main-thread accessibility reply is **09:33:48.106586**, about 0.605 seconds before the runner's termination request. The relevant original sequence is:

| Observation | Original timestamp |
| --- | --- |
| Test activity begins termination | 09:33:48.709 |
| Runner sends request using launch token 5 | 09:33:48.711 |
| Xcode logs receipt of that request | 09:34:45.692 |
| Xcode cancels execution tracker | 09:34:46.209 |
| Runner automation connection interrupts | 09:34:48.338 |
| Runner reports 60-second timeout | 09:34:48.875 |
| Teardown-entry public state reports `notRunning` | 09:34:49.247 |
| Xcode observes tracker termination | 09:34:51.040 |

The approximately **56.981-second interval** between runner request and host receipt is present in the original timestamped log. It supports delayed host-side processing/recording as a material observation, with its cause still unknown. A later public `notRunning` state does not retroactively make `terminate()` succeed or independently establish the operating-system exit instant. The saved-layout relaunch and restored-name checks were not reached. No application-shutdown repair is inferred from these logs.

## Retained excerpts and reproducible extraction

- `P01-T02-native-recurrence-8efb6d4-startup.txt`: 11781 bytes, SHA-256 `087062bfeb4f9a1201f476c5bb4da6e37dd6e0ed25afc6f212bfbec5e87c7b0b`. It contains **all 108 complete original target lines** containing both `[TinStartup]` and `TinJunction[`, in source order. A start-anchored preliminary parser counted only 104: source lines 2086, 2094, 6733, and 6821 have interleaved hierarchy prefixes or indentation. Those full prefixes remain unchanged in the final excerpt.
- `P01-T02-native-recurrence-8efb6d4-termination.txt`: 19252 bytes, SHA-256 `e08844d2de9ca14fd66fdc69c004e9330d3d42a637bca82a3b57951540b7bdd2`. Editorial span headers identify the source and inclusive line numbers; bytes inside each span are unchanged. Target spans are 16–17, 349–350, 1621–1623, 1980–1986, and 14494–14524. Runner spans are 2733–2741, 4932–4955, 23504–23512, and 23598–23613. Xcode log spans retain the test totals, assertions, teardown/termination sequence, and failure marker.

Extraction used Python **3.12.14**, standard-library `zipfile`/`hashlib`, and Python `zstandard` **0.25.0**. Read the exact ZIP member bytes above, verify their compressed SHA-256, and call `zstandard.ZstdDecompressor().decompress(member, max_output_size=128*1024*1024)`; the frame starts at offset zero. Verify the decoded SHA-256 before selecting bytes with `decoded.splitlines(keepends=True)`. Select startup lines by contained byte strings, without a timestamp-at-start condition, and concatenate them without rewriting whitespace or decoding/re-encoding. For the other excerpt, copy each indicated inclusive source-line span; only the marked editorial headers/separators are added. No xcresult reconstruction, log synthesis, image conversion, or source execution was used.

## Bounded next diagnostic step

The coordinator's proposed DEBUG-only `--host-diagnostics` row exposes a fresh finite native trace through a UIKit accessibility-value getter. This can make the native startup events available in compact reports even when the bridge/canvas failed; it does not create new evidence for this run. Preserve a trace before explicit termination and in a separate fixture teardown block, while keeping final cleanup independent of optional accessibility queries. Native send/returned-call/failure events can locate bridge-delivery waits, but a returned-call event must not be described as accepted layout or successful restoration. Current traces recovered from xcresult already distinguish the two failed startup stages.

No product source, watchdog, retry policy, test assertion, or timeout was changed by this review. Native execution of any diagnostic patch and all installed/clean gates remain required. The three records do not replace, edit, or relabel the previously accepted c1 observations.

## Relevant tested source fingerprints

These bounded diagnostic-review inputs are read from immutable `8efb6d4` Git objects. They are not a replacement for the larger formal acceptance source closure, and they intentionally do not describe current unpublished worktree bytes.

| Path | Bytes | SHA-256 |
| --- | ---: | --- |
| `apps/ios/TinJunction/Web/EngineHostModel.swift` | 19963 | `6ca37b5837904d707203e60527f3d90aaed97d8883bfad6090d2d9a66db7fc6c` |
| `apps/ios/TinJunction/Web/EngineWebView.swift` | 11625 | `a636ce28918124e5d59fb750826dda5e2de9996b8b1784f31c00eb049eb73f35` |
| `apps/ios/TinJunction/Platform/PlatformStartupTrace.swift` | 1408 | `224a463a172d32d334439d827a764ec1f62b632963539add8711e554e118eca8` |
| `apps/ios/TinJunctionUITests/UITestApplicationLifetime.swift` | 3517 | `5c5a4e1e80646bed65499e440de1abe20b7c5d6e0e671c4dfd837561ed738d98` |
| `apps/ios/TinJunctionUITests/AssetOriginProbeUITests.swift` | 5863 | `99e13e483f2ee4d3852ac867d1b58b1ce23b2df505f94836671e3774861e6ba3` |
| `apps/ios/TinJunctionUITests/HostSmokeTests.swift` | 8116 | `1b4e6973001cbb09d8b0b2f77dcded76b2cbc4d8f06f0a84ea74fb26322154b1` |
| `web/src/main.ts` | 28217 | `e87ba1b202e3e65948588825ddf020a23d946c1ba824cb478faaa6f3a6647a90` |
| `web/src/scene/MiniatureScene.ts` | 19006 | `af9b338172f349b73d623575e001acbbe42c74d7e848dc18536930f71227b6b7` |
| `web/src/clock.ts` | 1965 | `77c37952ff76a84e88f1cb3e4cc7980e5b9ed48bb04840b366aec8a8e467c912` |
