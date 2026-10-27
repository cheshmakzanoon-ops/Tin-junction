# Native startup and termination recurrence — 27 October 2026

**OPEN.** Current required native CI failed. This record preserves an observed recurrence; it does not identify a single cause or claim a repair.

## Exact failing execution

- Commit: `8efb6d4edc68058a5c809ab80118105f1a805d60`, tree `5be9d34e40a91612d3fd04e4e9dde74678649748`.
- [Native workflow 40480076020, attempt 1](https://github.com/cheshmakzanoon-ops/Tin-junction/actions/runs/40480076020), job `122107883698`, runner `1000015894` (`xcode-27`). Started 09:20:55 UTC; completed with failure at 09:39:06 UTC.
- Compilation and all **87 native unit tests passed**. Of eight UI cases, five passed and three failed. Installed-resource verification and the supplemental clean-install trial were skipped by their existing success prerequisites. Evidence staging and all three artifact uploads succeeded.
- [Repository/web workflow 40480075989](https://github.com/cheshmakzanoon-ops/Tin-junction/actions/runs/40480075989) completed successfully at the same commit.

The preceding `c1e6e39ba127e064f4907e9c5a1d84fed7163990` passed all three workflows, including the same eight UI cases and clean reinstall. The coordinator verified that `c1e6e39..8efb6d4` changes **no files under apps, web, tests, tools or .github and neither root package file**. Both native runs' `packaged-web-input-manifest.json` are byte-identical. This narrows the comparison but does not prove infrastructure was the cause.

## What actually failed

| Case | Direct observation | Limit of the evidence |
| --- | --- | --- |
| `AssetOriginProbeUITests/testActualBundledOriginAfterWebDataResetAndColdRelaunch` | Initial launch reported foreground after 9.195 seconds. `host.ready` was absent at its unchanged 40-second check. The captured hierarchy and PNG show the native readiness-timeout recovery screen; `host.assetProbe` is `{}`. Fixture teardown entered and began termination while the public state was foreground. No after-termination attachment exists. The case failed in 196.736 seconds. | No asset result or cold relaunch was reached. The missing after observation cannot establish why termination stalled. |
| `HostSmokeTests/testBundledRendererHandshakes` | Launch reported foreground after 14.426 seconds. The unchanged readiness assertion failed; hierarchy and PNG show the same native timeout screen. Teardown later reported `notRunning`. Case failed in 55.947 seconds. | Native startup stages inside the separate application are absent from the exported text log. |
| `HostSmokeTests/testNativeSaveAndRelaunchRestoresAcknowledgedRailway` | The test reached its durable-save capture. At 09:33:48.706 UTC it recorded foreground immediately before the intended termination. XCTest then failed to terminate the application at the unchanged helper call. Teardown began approximately 60.54 seconds later and reported `notRunning`. No cold relaunch occurred. Case failed in 169.640 seconds. | An asynchronously reported `notRunning` state does not turn the earlier termination failure into a pass or independently prove process-death timing. |

Rotation/foreground, native Help, the controlled startup hold, actual renderer initialization failure/Retry and platform observation cases passed later in the same run. The coordinator directly viewed the original asset failure and durable-save PNGs. Their appearance agrees with the hierarchy and test sequence; they do not diagnose the underlying delay.

The [attachment transcription](INC-NATIVE-RECURRENCE-20261027-observations.json) preserves the complete lifecycle and asset-failure text attachments for those three cases, with original filenames, timestamps and hashes. No app data or private process API was used.

## Recovered original application and runner logs

Further inspection recovered Zstandard-compressed target and runner logs inside the original `.xcresult`. The [independent native review](P01-T02-native-recurrence-8efb6d4-review.md), [108 complete startup lines](P01-T02-native-recurrence-8efb6d4-startup.txt) and [16 unaltered excerpt ranges](P01-T02-native-recurrence-8efb6d4-termination.txt) preserve their exact source identities. The coordinator independently decompressed both original objects into bounded buffers, matched every byte and SHA-256, then verified every startup line and excerpt range. The first extraction assumed a declared Zstandard content size and stopped on an unknown-size frame; bounded decompression subsequently verified the complete objects without changing them.

- Asset process `672`: navigation started at elapsed 6.119 seconds, HTML/CSS/JavaScript were served, navigation finished at 24.232 seconds, and the host recorded `host.failed.beforeBridge` at 26.660 seconds. WebKit earlier reported an unresponsive WebContent process. Its subsequent teardown also timed out, although the UI summary counts the earlier readiness assertion as that case's failure.
- Handshake process `4296`: navigation started at 7.843 seconds and finished at 11.113 seconds. `bridge.webReady` arrived at 28.336 seconds, restore preparation at 28.421 seconds, and `host.failed.afterBridge` at 28.422 seconds. This distinguishes the two startup failures; the whole startup/restore deadline remains 20 seconds from navigation start.
- Save process `4702`: the target answered a main-thread accessibility request about 0.605 seconds before the runner sent termination at 09:33:48.711 UTC. Xcode logged receiving that request at 09:34:45.692, an observed interval of **56.981 seconds**, and the runner timed out at 09:34:48.875. This supports delayed host-side processing in this sequence. It does not identify the delay's cause, establish all intervening process state, or explain both startup failures.

These are direct observations from the stored logs, not new private API calls or a proposed entitlement workaround. Neither adding an entitlement nor increasing a deadline is justified by this record.

## Original artifact identities and inspection

| Artifact | Bytes | SHA-256 |
| --- | ---: | --- |
| Full `duo-host-40480076020-1`, ID `12722114274` | 329467294 | `5c05cacb26b2b655d14a52a43b529c15bb28d0944abd1f881847ebecb4f15f35` |
| Reports `duo-host-reports-40480076020-1`, ID `12722564069` | 244944 | `4a333c77b3938cefb3f08d57480c028b96a1ca4ff006b2ddd35cdc22de761915` |
| Captures `duo-host-captures-40480076020-1`, ID `12722548906` | 10819312 | `1de366c0b2499aef1a5f3ad2e2663d44005bd5a0c211332f17e7f89e3ee12372` |

All downloaded ZIP bytes match GitHub's reported digests. The coordinator verified all **136 report files and 12 PNGs** against the compact index and full original archive. The index SHA-256 is `9d00f8df45575393b231278a727409a4ed0f0dc39a6438734912683716218cf2`. The raw `xcodebuild.log` is 336479 bytes, SHA-256 `d31da4126512a6e0df153e2d32d276ef51ac93c3785ad772ac7d1053bd463b50`. Large originals remain in the workflow artifacts.

## Bounded next experiment

An isolated diagnostic change will expose the existing native startup trace through an explicit Debug-only `--host-diagnostics` accessibility row. The trace has at most 128 validated fixed events and elapsed times; it contains no layout values, names, paths or URLs. Its getter reads on demand without polling or a bridge dependency. The shared UI lifetime helper will request it and attach it before termination and failure cleanup, while the accessibility tree still exists. The visible diagnostic row is 14 points high only in these explicitly instrumented Debug runs; this changes the measured test viewport and is not production UI evidence.

The original test cases, readiness deadlines, termination call, failure behavior, concurrency group and required workflow gates remain intact. This is **instrumentation, not an established fix**. Swift compilation and runtime of the diagnostic remain to be observed in the actual Xcode 27.1 / Duo Simulator workflow. Preserve the new result whether it passes or fails; a later pass alone will not explain this failure.

Three fixed send/delivered/failed trace events also distinguish a pending native-to-web call from a call that returned. `bridge.delivered` means only that the public JavaScript call returned; it is not a semantic receipt or layout acceptance. The trace is app-scoped and bounded, and event names do not independently identify a retry generation. Final fixture termination is kept in a separate teardown block, so an optional accessibility snapshot cannot prevent the cleanup attempt. Local repository validation, the project tests and all 56 iOS-tool tests passed; no local Swift result is claimed.

The previously accepted `c1e6e39` evidence remains immutable and scoped to that execution. The open incident and failed current CI block new acceptance. Unpublished P01 security, P02 preferences and P10 compression work remains separate from this diagnostic checkpoint.

## Follow-up at `eea6f0d`: failure narrowed to the first asset launch

The isolated diagnostic was published as `eea6f0db5e3f7511663506ab580d3a4848ce8abc`, tree `180cc58983821125fbf62fca087ad86600b53e5b`. [Full native run 40484196926, attempt 1](https://github.com/cheshmakzanoon-ops/Tin-junction/actions/runs/40484196926), job `122121763501`, completed **failure** at 10:16:23 UTC. Compilation and **88 units passed; seven of eight UI cases passed**. Only the first asset-probe launch failed its unchanged readiness assertion. Installed identity and clean reinstall remained skipped. Both jobs in [web run 40484196997](https://github.com/cheshmakzanoon-ops/Tin-junction/actions/runs/40484196997) and [focused model run 40484197052](https://github.com/cheshmakzanoon-ops/Tin-junction/actions/runs/40484197052) succeeded. These results exercise the diagnostic baseline, not the unpublished security/preferences/compression features.

The new snapshot exposes the precise gap: loading began at +8.898 seconds, HTML was supplied at +8.913, navigation committed at +19.268, JavaScript was supplied at +19.276, navigation finished at +23.747, and `host.failed.beforeBridge` occurred at +29.511. No `web.ready`, native send or asset report preceded failure. The original target log reported an unresponsive WebContent process before navigation began. This demonstrates a pre-script delay and a missing first-frame acknowledgement; it does not identify why either occurred. The current web code emits `web.ready` only after an actual rendered frame.

The asset fixture terminated successfully this time: public foreground state at 10:06:06.840 UTC and `notRunning` at 10:06:24.917. Ordinary handshake, rotation/foreground, Help, save/relaunch, both controlled startup cases and platform observation passed. The preceding termination failures remain failures in their original execution.

Root independently checked the three downloaded archive digests, all **121 report files and 14 PNGs** against both the compact index and full originals, the new startup snapshot and original failure PNG, and separately decompressed the original unit/target Zstandard objects with a bounded native library buffer. The compact index SHA-256 is `dee4e4ce648732dd00ff35295ca16e3ecb1de546f06cd37c9faea16d086dc768`; the 340,025-byte raw test log SHA-256 is `dc6f9188afdd2871d384c258357ec6418ab58e22b887e8a9b94f8f2215ecd76b`.

| Original artifact | ID | Bytes | SHA-256 |
| --- | --- | ---: | --- |
| `duo-host-reports-40484196926-1` | `12725657062` | 237530 | `ee6f6d8bddde679fa57d4e5ae54584f9755f16c6adbe69bbe1278f9b81e0a394` |
| `duo-host-captures-40484196926-1` | `12725372412` | 14847089 | `68557997be7c2ff6eb0fd1c9d44077a95d8dfe417b93875b7ea73aaa6a2abb6f` |
| `duo-host-40484196926-1` | `12725367469` | 358761012 | `ccf05d0a6bd1085be6781db5ecf62918826f7b7b255daa5ffef75e167fdaf2d1` |

The [source-pinned follow-up review](P01-T02-native-recurrence-eea6f0d-review.md) retains the complete narrow startup and test excerpts. Eleven explicit unit-fixture WKWebViews and the real test-host app view existed in the source; their process activity is a hypothesis to investigate, not a measured live-process census or established cause. The same fixture constructors existed in the earlier passing implementation.

## Next bounded observation: first-frame state

The next isolated Debug diagnostic performs one public `callAsyncJavaScript` read after each actual navigation finish, only with `--host-diagnostics`. It reads the document readiness/visibility, receiver existence and five primitive renderer-state fields. A document-start listener separately counts script errors and unhandled rejections, capped at 32 each, without reading their contents, preventing events or changing app state. This distinguishes an observed error from an otherwise unexplained zero-frame result. Four native parser tests bound the exact 14-field shape and reject unknown/coerced values. Both actual embedded JavaScript bodies passed a bounded Node VM check of exact fields, absence handling, counter saturation and lack of bridge/model mutation; this is not Swift/WebKit execution.

Request and callback events retain native elapsed time, phase and window attachment. A five-second diagnostic timer records a missing callback but does not fail the app, change the startup deadline, await readiness or cancel a later observation. A late result from the same attached view/session is explicitly labelled; replacement navigation and dismantling cancel ownership. Since failure removes the renderer from its window, a hidden/paused result after failure cannot establish the state at navigation finish. A missing response cannot alone distinguish busy, suspended or unresponsive JavaScript.

This remains an experiment, not a repair. Original tests, assertions, timeouts, workflow concurrency and the strict asset policy remain unchanged. The incident remains open until a justified repair and current native evidence support resolution.
