# Native recovery containment and reviewable evidence

## Current state and actual tested baseline

The implementation parent is **`0e6d83c24bd4e0ed5413c095ebaee1cbbc09d406`**. P01-T02, P02-T01 and P04-T06 remain active. CI is failed for that exact commit because the required full native run failed. No task is completed and `INC-NATIVE-QUEUE-20261027` remains open. Publish this reviewed repair, then inspect its own fresh runs; older results retain their tested source identities.

| Actual baseline execution | Outcome |
| --- | --- |
| [Web run 40467652936](https://github.com/cheshmakzanoon-ops/Tin-junction/actions/runs/40467652936) | 34 cases, 34 first-attempt passes; no retries, flakes, skips or report errors. Project 108, iOS tools 42 and web units 304 also passed. |
| [Native model run 40467652937](https://github.com/cheshmakzanoon-ops/Tin-junction/actions/runs/40467652937) | All 84 native units passed; new Swift visibility code compiled. |
| [Full native run 40467652957](https://github.com/cheshmakzanoon-ops/Tin-junction/actions/runs/40467652957) | Exit 65. All 84 units and seven of eight UI cases passed. Installed-byte and clean-reinstall steps skipped. |

The [web review](../../evidence/P04-T06-web-ci-review-0e6d83c.md) and formal [unit](../../evidence/P04-T06-web-unit-0e6d83c.json)/[browser](../../evidence/P04-T06-web-integration-0e6d83c.json) records preserve exact 92/70-input scopes, actual report/attempts and captures. They cover their scoped browser portions only. The [P02](../../evidence/P02-T01-native-unit-0e6d83c.json) and [P04](../../evidence/P04-T06-native-unit-0e6d83c.json) native unit records retain their original tested hashes, even where this repair changes inputs.

## What the full native run established

The [native observation](../../evidence/P01-T02-native-observation-review-0e6d83c.md) and [108-input record](../../evidence/P01-T02-native-observation-0e6d83c.json) retain the actual mixed outcome. First launch and cold relaunch completed distinct native sessions with GLB rendering, four-quadrant texture readback, classic worker execution and actual user-gesture PCM source completion. WASM remains blocked by the unchanged CSP and KTX2/Basis remains explicitly disabled. Native layout acceptance preceded the diagnostic resource responses and occurred **11.151 seconds** and **2.072 seconds** after loading, within the unchanged 20-second deadline.

The sole failure is `HostStartupUITests.swift:23`: the failed `host.webview` remains in the recovery accessibility traversal. The native recovery panel, exact injected error, Retry identifier, hittability and 44-point minimum dimensions passed. The original snapshot includes the WebView and 51 remote descendants; the screenshot shows the native recovery panel. The following Help assertion, contrast audit, Retry tap, real readiness and foreground sequence were not reached. This is not evidence that those later steps passed or failed.

The independently downloaded full archive is **297,014,053 bytes**, SHA-256 `d3db5275efd6418f5fd054df29dfa6ddacde6de636c3e5ae640bf183e4858104`. The coordinator rechecked the archive, full log and all 108 immutable input fingerprints, read both completed native reports, and inspected the original failure, asset and released-ready captures. The latter remains a procedural fixed-oval scene below the requested final-art standard.

## Implemented containment repair; native execution pending

`EngineWebViewContainer.swift` strongly retains one WKWebView. While failed, it removes that child from the visible UIKit hierarchy; it restores the exact same object for a nonfailed phase. Bounds are applied before reattachment and updated during layout. The host's weak ownership, coordinator and bridge remain intact during temporary removal.

A main-actor Combine observation responds synchronously to the emitted phase. This matters because `retryLoading()` changes phase before calling `load(_:)`: the child must already be attached when navigation begins. Apple's [Published documentation](https://developer.apple.com/documentation/combine/published) specifies publication before the stored value changes, so the observer uses its emitted value instead of rereading `host.phase`. UIKit's public [removeFromSuperview](https://developer.apple.com/documentation/uikit/uiview/removefromsuperview()) removes hierarchy/window participation; actual WebKit accessibility behavior still requires the unchanged UI assertion.

The representable returns the stable container and rejects showing a renderer it does not own. Dismantling cancels observation first, then performs the existing preparation/hold/message/delegate teardown against the retained child and detaches only its own host. No native UI assertion, readiness deadline, loader policy, CSP or web application source changed.

Three new native unit fixtures cover immediate failure removal from a real UIKit window, synchronous Retry invocation on the same renderer, retained identity/current bounds after removal, observer cancellation and stale teardown. Their public `load` override records invocation without WebKit I/O. The existing controlled-hold fixtures now dismantle the real container and preserve their previous assertions. Two independent source reviews found no remaining concrete issue after strengthening the tests to prevent direct calls or ownership guards from masking a broken observer. These **three new Swift tests have not executed locally**; the next model/full native lanes must compile and run them.

## Evidence access repair and local verification

The older `2b630f1` native archive exceeded the connector's explicit 512 MiB download limit. The workflow now stages two bounded review artifacts while preserving the original complete-upload configuration unchanged. Reports retain logs, original manifests, source/installed observations and bounded manifest-associated opaque snapshots; the other artifact retains original PNG bytes. Full `.xcresult` bundles, recordings and all other originals remain in the complete archive. All three uploads independently use `always()`.

The helper rejects malformed/missing inputs, symlinks, stale/overlapping destinations and size/count overflow; incomplete packaging remains a failure with an explicit index. It does not decode opaque attachments, synthesize outcomes or repeat native tests. The complete original workflow is recovered by removing only the three added staging/upload steps; test gates, timeouts, concurrency and permissions are unchanged. The shell script's only change captures stderr alongside stdout while preserving original pipeline exit priority. Details and limits are in [the CI runbook](../../docs/operations/IOS_CI.md).

The integrated `npm run check && npm run bundle:ios` passed: **108 project tests, 56 iOS-tool tests, 304 web units across 22 files**, TypeScript, ordinary build/integrity verification and native resource assembly. [The retained log](../../evidence/P02-T01-renderer-containment-local-checks.txt) is **18,380 bytes**, SHA-256 `1136f9624979a661e95099af583c774e79f0a0a6f567ee3ee3e072acf1009383`. Its historical source warnings are retained. No local Swift or fresh browser run is implied.

Independent [exact-byte staging verification](../../evidence/INC-NATIVE-QUEUE-20261027-review-package-local.json) used a fresh extraction of the verified current native archive. It copied **72 files**, including **15 PNGs and 38 opaque attachments**, with no issues; all **1,804 source files** retained identical hashes. The original failing accessibility snapshot is included. The complete reports package is **788,196 bytes** and captures **15,726,213 bytes**, including indices. This proves local packaging behavior, not future native-run uploads. Original console data available only inside `.xcresult` can still require the complete archive.

The ordinary runtime remains the same four-file `0e6d83c` build: JavaScript **716,416 bytes**, SHA-256 `7ed3d0a95874f06b77a2d3234f91a1da56653ca79ab24917eba7f6915be18907`, with diagnostic code/fixtures excluded. The integrated check rebuilt the shared ordinary/native assets; isolated browser fixtures do not overwrite them.

## Next actions and limits

1. Publish the reviewed repair and observe all three exact-SHA workflows. Require new native compilation and unit results, the unchanged eight-case UI suite, first/cold probe completion, installed-resource identity and the actual clean-reinstall repeat. Inspect both compact indices and original captures.
2. If recovery still fails, inspect the actual hierarchy and target trace before another edit. Do not rename the concurrency group, weaken the accessibility assertion, relax deadlines or infer Retry from model tests.
3. Resolve the incident and complete active tasks only after complete current evidence satisfies their gates. Run `npm run project:next` before selecting subsequent resource-boundary, preferences or compressed-asset work.
4. Preserve the [confirmed pending-audio-resume defect](../../evidence/P02-T03-audio-resume-race-0e6d83c.md) for the next eligible lifecycle/sound repair. It is unfixed and was reproduced with inert audio nodes, not speakers or a native audio session.

The current captures retain a small locomotive, repetitive trees, limited terrain/material richness and cropped case framing. General graph/document integration, the full creative editor, production art, sound/haptics and later roadmap work remain unfinished. Physical Duo graphics/thermal/fold evidence, supported exclusive commercial distribution, rights/name clearance, final owner art approval, signing and authorized App Store submission remain external gates. No release or final-art approval is claimed.
