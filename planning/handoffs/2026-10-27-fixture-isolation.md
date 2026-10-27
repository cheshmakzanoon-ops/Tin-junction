# UI fixture ownership, native termination observations and readable titles

## Current result

The tested implementation parent is **`53e193b6435d241f8c1462d859112b2cb1b56b77`**. Its required full native run failed; CI remains failed and `INC-NATIVE-QUEUE-20261027` remains open. P01-T02, P02-T01 and P04-T06 remain active. No task, final art or release gate is accepted by this checkpoint.

| Actual parent execution | Result |
| --- | --- |
| [Web 40471495796](https://github.com/cheshmakzanoon-ops/Tin-junction/actions/runs/40471495796) | 34 cases, 34 first-attempt passes, zero retries/flakes/skips/errors. Project/tool/web units: 108/56/304. |
| [Native models 40471495783](https://github.com/cheshmakzanoon-ops/Tin-junction/actions/runs/40471495783) | All 87 native units passed, including three container cases. |
| [Full native 40471495670](https://github.com/cheshmakzanoon-ops/Tin-junction/actions/runs/40471495670) | 87 units and six of eight UI cases passed; exit 65. Installed-byte and clean-reinstall checks skipped. |

The [full native observation](../../evidence/P01-T02-native-observation-review-53e193b.md) preserves the exact 112-source scope, first-session report, original captures and failed operations. The coordinator independently checked its source fingerprints and original excerpt lines, the downloaded full archive, both compact indices and all 66 indexed original files. The [web review](../../evidence/P04-T06-web-ci-review-53e193b.md) retains the actual 34-case report, zero retries, 23 PNG identities and 92/70-input unit/integration scopes. The coordinator independently verified both web archives, exact original log spans and both formal manifests before applying the title change.

The scoped [P02 native unit](../../evidence/P02-T01-native-unit-53e193b.json) record maps 27 tests to A1; the [P04 native unit](../../evidence/P04-T06-native-unit-53e193b.json) record maps 46 tests to A2. Both refer to the actual separate focused run and preserve their tested source identities. Subsequent edits do not rewrite historical hashes.

## Native findings and bounded change

The original recovery case now passes unchanged: failed WebKit accessibility exclusion, native Help, contrast audit, actual Retry to readiness, recovery removal, one WebView and foreground return. The [previous containment handoff](2026-10-27-recovery-containment.md) describes the implemented container; its formerly pending native execution now has this scoped passing result. Controlled startup, handshake, rotation/foreground, save/relaunch and platform cases also passed. Three platform reports retained the same geometry; passing rotation commands do not establish an actual geometry or hinge transition.

The asset case completed all first-session assertions, then failed its explicit foreground `app.terminate()` at line 22. Cold launch was not reached. Standalone Help failed in `app.launch()` while terminating the preceding rotation fixture; its Help interactions were not reached. The [original diagnostic excerpt](../../evidence/P01-T02-native-termination-53e193b.txt) shows delayed Xcode request processing and state notification. In the first case, recorded process death precedes the unchanged 60-second timeout, while the not-running notification follows it. In the second, Xcode receives the termination request 118.493 seconds after the runner sends it. The reason for that host delay remains unknown. Do not claim an app shutdown deadlock, a specific Apple defect, or a repaired termination path.

This checkpoint adds `UITestApplicationLifetime` and updates all four UI-test classes. Every fixture registers owned app cleanup before launch; orientation restoration and end captures use XCTest teardown rather than relying on Swift `defer` after assertions. Fixed-label observations record public application state, UTC, uptime and elapsed time before/after launch and termination, with a teardown observation that survives an assertion abort. Records are bounded to 32 per fixture; current complete paths use at most nine. They contain no PID probing, app documents or private APIs. Public application state remains an asynchronous observation, not independent process-death proof.

The same foreground termination, cold session distinction, Help, native save, failed-renderer and Retry assertions remain. No retry, new backgrounding precondition, timeout inflation, swallowed failure or workflow bypass was added. If cleanup itself fails, the test still fails. Two independent source reviews found no concrete ownership, changed-assertion or actor-isolation blocker; **actual Swift 6 compilation and UI execution remain pending for the next published revision**. The recursive XcodeGen UI-test source list already includes the helper.

## Visible repair and actual local verification

The restored native screenshot confirmed that a long railway title crossed the dark wooden/green case lid. `web/src/style.css` now gives the existing title an opaque cream backing in daylight/evening and a dark green backing at night, with darker secondary text. The backing has no shadow, does not take pointer input and preserves the existing title geometry, visual clipping and full accessible name.

The actual rebuilt bundle was inspected at 382×575 and 358×300 in all three time presets. All six working-tree cases passed full 80-character accessible/document names, unchanged title/control geometry, opaque contrast and eight 44-pixel minimum center-hit targets, with no page/console errors. All six fresh PNGs were visually inspected and matched the separately reviewed candidate byte-for-byte. This uses Chromium 141.0.7390.37 with the existing synthetic native handshake; it is not WKWebView or device evidence. The retained [original local observations](../../evidence/P04-T06-title-legibility-local-observations.json) identify actual input bytes and times, without relabeling the candidate as unmodified `53e193b`.

Visible text contrast is 10.358 for the day/evening name and 5.362 for secondary text; night ratios are 10.836 and 8.410. The backing clears view tools by 5 pixels horizontally at 382×575 and 8 pixels vertically at 358×300. The source CSS is 22,381 bytes, SHA-256 `6fed42682909f9a628940162ec4156f7742f578946232d00af67de8d7a6be093`. Built ordinary/native CSS is 18,796 bytes, SHA-256 `242d4963802fa7a1e1fa09b923d8c5568f661fad8678f124df48fbc0443825bb`; the unchanged JavaScript remains 716,416 bytes, SHA-256 `7ed3d0a95874f06b77a2d3234f91a1da56653ca79ab24917eba7f6915be18907`.

| Local command or observation | Actual result and retained evidence |
| --- | --- |
| `npm run build && npm run build:verify && npm run bundle:ios` | Passed; actual ordinary/native resources rebuilt with the title repair. |
| `npm run check` | Passed: 108 project tests, 56 iOS-tool tests, 304 web units across 22 files, typecheck and offline build/integrity. [Exact log](../../evidence/P02-T01-fixture-isolation-local-checks.txt), 18,261 bytes, SHA-256 `fe831942b7039b401baa6cef44e3d635e39cf2434ff99a72c9ab7d8a365f0226`. |
| Existing four maximum-name browser cases, one worker and zero retries | All four passed in 53.5 seconds, at 1100×760, 382×575, 358×300 and 844×390. [Exact log](../../evidence/P04-T06-title-legibility-browser-checks.txt), 1,099 bytes, SHA-256 `b124a081cf13ef06de8e683b465187d81f9d73cc7860223c04498724e0c2e0cb`. |
| Actual six-case integrated visual check | Passed, 08:40:36.989–08:41:13.612 UTC. Observations 39,751 bytes, SHA-256 `10b2441fbc1ee66d3a58e7914e9b6d18a44f3d555c97aab66d1ff5857d5eed40`. |

No fresh full browser or native execution is inferred from these local checks. The status message and footer remain scene-backed and need the separately recorded readability work. This title repair does not imply that the procedural artwork meets the requested production standard.

## Next actions

1. Publish this coherent checkpoint, then inspect its exact-SHA web, native model and full native runs. Preserve all required tests and their first outcomes.
2. Inspect the new lifecycle attachments, complete first/cold asset sessions, unchanged recovery case, actual installed-byte identity and clean app-data reinstall. If a termination operation fails again, inspect the original runner/target timelines before editing app behavior. Do not change the concurrency group or turn a later cleanup into a passing retry.
3. Resolve the incident and accept active tasks only when the current full requirements actually pass. Use `npm run project:next` before selecting subsequent origin security, native preferences/audio lifecycle and compressed-asset work.

The [confirmed pending-audio-resume defect](../../evidence/P02-T03-audio-resume-race-0e6d83c.md) is still unfixed. General graph/document integration, the full creative editor, production locomotive/village/materials/lighting, sound and later phases remain unfinished. Physical Duo graphics/thermal/fold evidence, supported Duo-exclusive distribution, rights/name clearance, final owner art approval, signing and authorized submission remain separate external gates.
