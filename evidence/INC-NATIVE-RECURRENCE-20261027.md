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
