# Native recurrence observation — eea6f0d diagnostic checkpoint

Status: **FAILURE OBSERVATION; not task acceptance or a repair claim.** This records the original attempt without reruns, relaxed assertions, changed deadlines, or edits to tested source. The unpublished resource-security, preferences, media-gate, and compression-probe implementation is excluded from this run and remains uncompiled by this evidence.

## Tested identity and actual outcome

- Tested commit: `eea6f0db5e3f7511663506ab580d3a4848ce8abc`.
- Full native [run 40484196926, attempt 1](https://github.com/cheshmakzanoon-ops/Tin-junction/actions/runs/40484196926), job 122121763501, terminal failure observed 2026-10-27 at 10:20:40 UTC. All four evidence staging/upload steps succeeded; installed-resource verification and literal clean reinstall were skipped after the native test failure.
- Original full `xcodebuild.log`: 340025 bytes, SHA256 `dc6f9188afdd2871d384c258357ec6418ab58e22b887e8a9b94f8f2215ecd76b`.
- Actual native unit result: 88 tests, 0 failures, 8.467 (9.098/9.109) seconds. The new startup snapshot buffer unit case passed.
- Actual UI result: 8 tests, 1 failure; the first launch of `AssetOriginProbeUITests.testActualBundledOriginAfterWebDataResetAndColdRelaunch` fails its `host.ready` assertion at source line 34. The fixture totals 119.050 seconds; that is the whole fixture duration, not a new readiness deadline. All seven other UI fixtures pass, including native save/relaunch, controlled startup hold, renderer-failure Retry, and Help.
- Separate focused model run 40484197052 succeeded with 88 tests and 0 failures. Its original log 268345 bytes has SHA256 `2e7bb0f711a7525c319e209c77501e392dceb3c88a099e0ff2c7302ca46fe083`. This independently compiles the diagnostic baseline, not unpublished feature work. Both web jobs in run 40484196997 also completed successfully; their detailed browser/asset evidence is outside this native review.

## Original archive and packaging identities

| Artifact | ID | ZIP bytes | SHA256 | Retained until |
| --- | --- | --- | --- | --- |
| Reports |12725657062|237530|`ee6f6d8bddde679fa57d4e5ae54584f9755f16c6adbe69bbe1278f9b81e0a394`|2026-11-10T10:15:22Z|
| Original PNG captures |12725372412|14847089|`68557997be7c2ff6eb0fd1c9d44077a95d8dfe417b93875b7ea73aaa6a2abb6f`|2026-11-10T10:15:24Z|
| Full xcresult and exports |12725367469|358761012|`ccf05d0a6bd1085be6781db5ecf62918826f7b7b255daa5ffef75e167fdaf2d1`|2026-11-10T10:15:28Z|

Each downloaded ZIP was matched to the provider's size and SHA256 before extraction. All 135 indexed compact files were then checked against their declared size/hash and byte-compared with the full archive originals. Both compact indices pin the tested commit/run/attempt and record `nativeTests=failure`, `installedWeb=skipped`, `cleanInstall=skipped`, with no staging issues. The reports index is 32682 bytes, SHA256 `dee4e4ce648732dd00ff35295ca16e3ecb1de546f06cd37c9faea16d086dc768`.

The generated packaging-input manifest is 1592 bytes, SHA256 `0fce39ed2cc596246e79efb8ba8fec8c871caae2cce7083ad38a87bbe609d8bd`. It is a build-input record. The skipped installed-resource step means this attempt does **not** establish installed-byte identity or a clean-reinstall asset result.

## Actual first-launch trace

The new explicit native diagnostic successfully retained its bounded JSON snapshot before fixture termination. Original attachment `screenshots/981762FD-CE31-4601-BACD-403FD4CC9E93.txt` is 815 bytes, SHA256 `29e7ae7f82fe0a37a6b2777a2fa0c5600b0c352878f10266dc571ac2219f10e0`. It contains these 10 events, with time measured from the target process trace origin:

| Event | Elapsed seconds |
| --- | ---: |
| WebView created |0.000001|
| Native lifecycle active |0.611745|
| Navigation started; attached to a window |8.897575|
| Host loading; lifecycle active |8.898288|
| HTML supplied, 884 bytes |8.912733|
| Navigation committed; attached to a window |19.268372|
| CSS supplied, 19325 bytes |19.270704|
| JS supplied, 801455 bytes |19.275874|
| Navigation finished; attached to a window |23.747497|
| Host failed before bridge |29.510941|

The existing watchdog fails approximately 20.613 seconds after `host.loading`. The HTML-ready→navigation-commit interval is approximately 10.356 seconds. There is no accepted `web.ready`, native send/delivered event, layout acknowledgement, or completed loader report for this failed first launch. This does not identify the JavaScript execution phase at navigation completion.

The asset JSON `screenshots/45FF9C74-1BC6-4688-862E-63A333269C3C.txt` remains the original two-byte `{}`, SHA256 `44136fa355b3678a1146ad16f7e8649e94fb4fc21fe77e8310c060f61caaff8a`. The original failure PNG is `screenshots/527BDB06-632D-46D8-9303-F6678FC6F9FE.png`, 218661 bytes, SHA256 `4910b3f84fcc0b07d779c993811bc8843016d1d64f30072e07bae93371f76966`. The cold relaunch and its asset checks are not reached; no loader-success conclusion can be drawn from this attempt.

Target stdout identifies the app as PID 7739 and its WebContent process as PID 7845. WebKit logs `WebProcessProxy::didBecomeUnresponsive` at 10:04:44.067269 UTC and `WebPageProxy::processDidBecomeUnresponsive` at 10:04:44.141255, **before** navigation starts at 10:04:47.729098 and before HTML/JS is served. The first marker shares an interleaved original line with an accessibility message; the retained excerpt preserves that line and its continuation. This pre-navigation observation cannot be attributed to the app's JavaScript, shader compilation, or first rendering frame from these logs.

Later, navigation finishes at 10:05:02.578862 and `host.failed.beforeBridge` is logged at 10:05:08.342620. Existing logs supply no first-frame marker, document visibility, diagnostic renderer/frame state, or JavaScript exception that resolves that interval. Absence of those observations is not proof of a particular cause.

## Fixture lifetime and the successful cases

Initial launch is recorded at 10:04:27.983 UTC with `notRunning`, then 10:04:40.629 with `runningForeground`. The failure is followed by actual supported termination: 10:06:06.840 before termination with `runningForeground`, and 10:06:24.917 after termination with `notRunning`, an observed interval of 18.077 seconds. Unlike the previous 8ef attempt, this attempt has no fixture termination timeout. This public-state observation is not an independent OS process census.

The original UI activity trace has an existence-query interval from test-relative 32.01 s to 54.26 s, followed by failure-triage activity from 54.33 s to 95.15 s. These are recorded activity gaps, not a measured breakdown of JavaScript/GPU/main-thread work. The 40 second ready wait and production watchdog were not extended.

The subsequent ordinary handshake accepts `web.ready` at 13.572345 s and layout at 14.135541 s from that new process's trace origin. The saved-layout fixture accepts its first layout at 13.609026 s and the restored launch's layout at 14.737118 s; its actual save, termination, relaunch and restored-name assertions pass. Controlled delayed startup accepts layout at 23.439020 s, after the explicit hold releases and loading begins 20.034999 s. Renderer-failure Retry records the intentional first failure, then accepts the retried layout at 14.962342 s. Native Help passes its own accessibility/dismissal assertions; its capture does not contain a layout acknowledgement, so that native-shell fixture is not being relabelled as a renderer-ready proof.

## Unit WebView construction: bounded hypothesis, not attribution

Pinned source has 11 explicit WebView constructions across six unit cases:

| Published test scope | Instances constructed on the executed paths | Cleanup relevance |
| --- | ---: | --- |
| `ApplicationSessionTests.testSecondRendererCannotReplaceOrTearDownTheActiveSession` |2|Blank views used for ownership, with host detach; no production page load claimed.|
| Three `EngineWebViewContainerTests` cases |5|Window/identity fixtures; includes one `load`-recording subclass and a competing-view rejection fixture.|
| Two `HostStartupHoldCoordinatorTests` cases |4|Two fixtures per case; actual coordinator teardown is exercised, public `load` is overridden to record without navigation I/O.|

The real app host independently constructs one additional production WebView before unit execution, observed at 10:03:54.596584. Thus source predicts 12 constructions including that host for these executed paths; it does not prove 12 simultaneously live processes or WebKit's release timing.

The original unit target stdout (PID 7388) contains 9 distinct WebContent launch-duration messages and 8 distinct PIDs in RBS termination-watchdog acquisition warnings. The first launch-duration message precedes the unit suite; the other 8 launch messages and all 8 warnings occur during the suite, which runs 10:03:59.684–10:04:08.782. The first asset launch begins about 19.2 seconds after that suite ends. The source does not expose an OS process-exit acknowledgement for each test view, and the log messages do not establish retained processes or resource exhaustion at the later failure. The same 11 fixture constructors also existed in the successful c1 run; no fixture reduction, reordered test, retry, or workflow change is justified as a proven repair by this correlation alone.

## Retained excerpts and extraction method

- [Startup/asset/lifetime originals](P01-T02-native-recurrence-eea6f0d-startup.txt): 14241 bytes, SHA256 `cf13705030a688d25d103fd10ff63bb6c4fe8949e42b95346ff794371ec89a8d`.
- [Original test outcomes and activity ranges](P01-T02-native-recurrence-eea6f0d-tests.txt): 8519 bytes, SHA256 `57f211bb18e985d8f84a007c95893460041b4c4f467e72a9cdb534aaa04bd7e4`.

Excerpt headings and this review are editorial. Every enclosed source line and attachment body is copied unchanged from its named original. Interleaving and partial diagnostic prefixes are retained. No decoded binary is committed.

Python 3.12.14 with `zstandard` 0.25.0 and standard-library `zipfile` was used. ZIP paths were checked before extraction. The named xcresult `Data/data.*` objects begin with the Zstandard frame magic at byte 0; stream decompression was bounded to 32 MiB per unit/target candidate and 16 MiB for the activity candidate. No private Apple API, synthesized OS log, or repaired log line was used. Reproduction is `ZstdDecompressor().stream_reader(original_object)` followed by a bounded read; the exact selected objects and digests are:

| Original object | Full archive member | Compressed bytes / SHA256 | Decoded bytes / SHA256 |
| --- | --- | --- | --- |
| Unit target stdout | `TinJunction-20261027T095818-2280.xcresult/Data/data.0~rg0kjDGh5K0IscxsZflthuUGfgrnnjM9T47uSEOVbwABRm4oqPCBBkkecLB6en7E5kwOG3I6gNLUHrWXvmxPwQ==` | 8421 / `85bb10e02c791b35f0a76d313ea6e681b89cbc81e7befc7ae15deecd58dd57c0` | 72762 / `63723e72a21c43afc39165d0f18e3035344d469cb5070f7e7776f88649ae40cf` |
| UI target stdout | `TinJunction-20261027T095818-2280.xcresult/Data/data.0~tPzKO2DNmmh80wILhJgdODz0GvYitd7JQncLTg08nfnc9_UybTRw3mTmHm0N-ONQUl_C-avwpQwp5d30MUzpOg==` | 309250 / `3a352b4b4be69a69c28d6f7265bb2846f551826e857ec856802e36b325af5b2b` | 4948935 / `f103daef404009463d7778ca1537dd730a63b9f1adbfc622d32842ca68624f6e` |
| UI activity stdout | `TinJunction-20261027T095818-2280.xcresult/Data/data.0~Drn8HxOSlalTkZQ7FG5W-V9vMPowSMOaE2CtlN81s5Td-97I3dWsU8hakNQW8ckG0fE2s0jCHfOeYG-wge7lnA==` | 7016 / `009c0daad430457847bf4b0d10b4859f40507c9139a23d9b7b9cf366cefc9a0e` | 61776 / `0595cead9dc8a5fb58b14877bc1e490276908a89039aadd81684e5a794fb683e` |

The object aliases used during extraction (`object-6`, `object-8`, `candidate-1`) are scratch names only. The full archive member paths and hashes above are the durable identity.

## Next discriminating observation

The accepted bounded proposal is a DEBUG-only, explicit `--host-diagnostics` one-shot public WebKit JavaScript snapshot after `didFinish`, retaining only fixed document/receiver/renderer/lifecycle primitives and capped error/rejection counts. It must record request and callback/timeout times and label any later callback with its actual current phase/session. It cannot wait on or alter production readiness, relax the existing watchdog, replay the probe, or infer the state at `didFinish` from a later response. That additional diagnostic was not in eea and has not run in this observation. If no callback arrives, the underlying busy/unresponsive/slow execution explanation remains unresolved.

## Relevant tested source fingerprints

These 24 inputs were read from immutable Git objects at eea, including the constructor-count sources. They identify the narrow diagnosis and its build/test context; this is not a full transitive task-acceptance manifest. Current uncommitted feature bytes are deliberately not substituted.

| Tested source | Bytes | SHA256 |
| --- | ---: | --- |
| `apps/ios/TinJunction/TinJunctionApp.swift` | 220 | `903febe836a554b4ce6fe80107703b6dfca321d9a7b5282d11ef027311f88c96` |
| `apps/ios/TinJunction/App/ApplicationSession.swift` | 527 | `ff66bd4016901ca5d4b671ee743d4b452e4d6504517da5df244a5db52c627a53` |
| `apps/ios/TinJunction/RootView.swift` | 12229 | `62ecad77697c2a4d7c059f2766335660d08cf5b8707414decafd190491982170` |
| `apps/ios/TinJunction/Web/EngineHostModel.swift` | 20182 | `ab52532853ce7aa93ebac852d98f6b377d8776a47921da9564808e86890c1d75` |
| `apps/ios/TinJunction/Web/EngineWebView.swift` | 11625 | `a636ce28918124e5d59fb750826dda5e2de9996b8b1784f31c00eb049eb73f35` |
| `apps/ios/TinJunction/Web/EngineWebViewContainer.swift` | 2037 | `4088f6cb43006abdb47c0419b797fd0dabbbbb07f8d379491743c7157f67117d` |
| `apps/ios/TinJunction/Web/BundleSchemeHandler.swift` | 2901 | `3bc199ff21836a451946d4f8ca65ea8b746828880bdb0a78fe505fea7ade0bdb` |
| `apps/ios/TinJunction/Web/BundleResourcePolicy.swift` | 3460 | `f25367b70bc39ffbcecb0a0e0d7089fa017844d0c528885299d7ba3b95141447` |
| `apps/ios/TinJunction/Platform/PlatformStartupTrace.swift` | 2373 | `5c1b680e0f76036f1161c39e45113159e73e45ca60aa4818635b55887eaf49a4` |
| `apps/ios/TinJunction/Platform/StartupTraceDiagnostic.swift` | 1020 | `7c882b40b94869ea7ade770fdd7407d1bd1b78e8159f4e753bb43bae1d4ac5ed` |
| `apps/ios/TinJunction/Diagnostics/AssetOriginProbe.swift` | 5241 | `4ce08db51d14436ca4d5305c5f89ca30f02abcc22090d5a3ffcd26ab7ce55a74` |
| `apps/ios/TinJunctionUITests/UITestApplicationLifetime.swift` | 4695 | `a3cf1ef3e45de9de8d326e4db3f9b1795c1bc64657d4560377d6c6434045c65c` |
| `apps/ios/TinJunctionUITests/AssetOriginProbeUITests.swift` | 5863 | `99e13e483f2ee4d3852ac867d1b58b1ce23b2df505f94836671e3774861e6ba3` |
| `apps/ios/TinJunctionUITests/HostSmokeTests.swift` | 8116 | `1b4e6973001cbb09d8b0b2f77dcded76b2cbc4d8f06f0a84ea74fb26322154b1` |
| `apps/ios/TinJunctionTests/ApplicationSessionTests.swift` | 3314 | `2b1d80d5e242659dd6ffea8bdf44edd60d1a85a7c09637d7cc4ef7cb25c699da` |
| `apps/ios/TinJunctionTests/EngineWebViewContainerTests.swift` | 5735 | `003ebe56bdb243f89bfe7520c8de85cb3e80f3f4ab0f95e85356337832efe943` |
| `apps/ios/TinJunctionTests/HostStartupHoldCoordinatorTests.swift` | 5983 | `5c950907e54ade45964c837e764d2fbde717a59e13beab64a2a224a46823c097` |
| `web/src/main.ts` | 28217 | `e87ba1b202e3e65948588825ddf020a23d946c1ba824cb478faaa6f3a6647a90` |
| `web/src/scene/MiniatureScene.ts` | 19006 | `af9b338172f349b73d623575e001acbbe42c74d7e848dc18536930f71227b6b7` |
| `web/src/clock.ts` | 1965 | `77c37952ff76a84e88f1cb3e4cc7980e5b9ed48bb04840b366aec8a8e467c912` |
| `.github/workflows/ios-simulator.yml` | 6273 | `d22ee7a9f8cf8441b5e9f1e348fee64d2b8a5281886895c6f4eabb1eee9ead91` |
| `apps/ios/project.yml` | 2667 | `815b190547b0448f91adabbefe4ff8b984376ef3fd221e23e50d7aa930a98e6c` |
| `tools/ios/test-simulator.sh` | 2762 | `6224f910afe2855def52ea7a50527621b23578c416dbb57c2fb57d0e5906089d` |
| `tools/build-web.mjs` | 8557 | `324e2e817346bb5ef1c9b40d914b38ebdf57f1b539399d2fbec434eec168b0fe` |
