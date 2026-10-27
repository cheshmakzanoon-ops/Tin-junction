# ADR-0007 — Packaged asset transport and explicit loader capabilities

## Metadata

- **Status:** Accepted for the bounded P01-T02 development transport at `c1e6e39`; complete native integration, installed-resource identity and the separate clean-install trial passed. Unsupported decoders and later security/device gates remain explicit.
- **Decision date:** 2026-10-27 UTC.
- **Author:** `submission-native`, coordinated by `submission-coordinator`.
- **Decision owner:** Project coordinator for the bounded P01-T02 development task; physical-device, final-art and release approvals retain their existing owners.
- **Related tasks:** P01-T02; follow-up security, lifecycle and device gates P01-T03, P01-T05 and P02-T02.
- **Supersedes:** None. This specializes the runtime spike required by ADR-0001 and preserves the WebGL2 baseline in ADR-0003.
- **Approval reference:** Coordinator review of [current native integration](../../evidence/P01-T02-native-integration-c1e6e39.json), its [original observation review](../../evidence/P01-T02-native-observation-review-c1e6e39.md), and [the verified-workbench handoff](../../planning/handoffs/2026-10-27-verified-workbench.md). This is a development architecture decision, not owner approval of final art, hardware behavior or release.

## Context

The native host serves the bundled classic script and resources through `tinjunction://bundle/index.html`. A desktop HTTP result cannot establish that WebKit accepts the same resource operations at this custom origin. Geometry fetch, texture upload, worker execution, WASM compilation and gesture-activated audio each need their own observations under the packaged content security policy.

The spike uses original, reproducible diagnostic assets and an isolated renderer. It does not alter saved layouts or replace the application scene. The calibration GLB has 14 meshes and 280 triangles with no external texture dependencies; a separate four-quadrant PNG tests texture loading and GPU sampling. A tiny WAV, classic worker and WASM module exercise their respective paths. No KTX2/Basis transcoder is bundled, so KTX2 remains explicitly disabled rather than acquiring an assumed result from the WASM test.

## Decision drivers and alternatives

The decision prioritizes observed offline operation, the existing native security boundary, explicit failures, reproducible packaging and compatibility with the pinned loader. It grants no device-performance or final-asset approval.

| Approach | Benefit | Cost or unresolved evidence |
|---|---|---|
| Retain the custom scheme and classic bundle | Uses the current native resource policy, avoids a server, and keeps runtime assets in the app bundle | Each resource and decoder path must be proved on the exact WebKit/CSP combination |
| Change to a bundled `file:` entry | Another public loading mechanism | Would require a new origin, read-access, bridge and loader security review; this spike has not tested it |
| Add a loopback HTTP server | HTTP semantics may suit some existing loaders | Adds server startup, routing and lifecycle behavior; no such implementation or benchmark exists here |

## Decision

Retain the custom scheme only for resource operations demonstrated by the packaged native experiment. Keep unsupported decoder paths disabled with named blockers. Do not enable a loader because the desktop harness works, because its JavaScript exists in a dependency, or because another decoder happened to run.

The core runtime remains a single pinned, bundled classic IIFE with separate CSS, no external runtime imports and the existing strict CSP. An asset-origin experiment cannot relax CSP or add private WebKit security settings. A future compressed-asset path must bring its own original fixture, pinned decoder bytes, actual packaged-origin result and error/recovery tests.

## Technical contract

- `tools/build-web.mjs` consumes a finite file list and records actual byte counts and SHA-256 hashes. Diagnostic fixtures are copied only by explicit `--asset-probe`; the ordinary build eliminates the probe module, CSS, controls and resources. Cleanup removes only files owned by a previously verified manifest. Unknown files and symlinks block the build.
- Native activation requires a Debug build and `--asset-origin-probe`. Before the first navigation it installs a public content rule that denies HTTP and HTTPS resources and clears WebKit data in a nonpersistent data store. Failure or timeout prevents the experiment from claiming those conditions.
- The native bridge accepts an exact bounded report schema for the active session. Network policy, data clearing and persistence observations are added by native code after preparation; renderer messages cannot assert them.
- The probe loads through the real bundle URLs, counts rendered GLB pixels, samples the PNG quadrants and records independent worker/WASM/audio outcomes. Audio resumes only after an actual accessible button tap, then records playback completion. Disposal aborts pending fetches, stops the worker and sound, and frees diagnostic GPU resources.
- A cold app relaunch repeats the observations with a distinct session. This clears WebKit state without deleting the user's durable layout documents. The phase's additional app-data-deletion check requires a separate, explicit Simulator test-app uninstall/reinstall; a new session cannot substitute for it.
- The Xcode Release pre-build guard rejects a diagnostic or unverifiable WebAssets bundle and instructs the developer to rebuild ordinary assets. Swift conditional compilation alone cannot prevent stale diagnostic files from entering an archive.

## Evidence status

The implementation is published at `8f96036acfab046b87bab5e002b034bc83eeffb6`. Its first full native run [40450589029](https://github.com/cheshmakzanoon-ops/Tin-junction/actions/runs/40450589029) failed during CoreSimulator `bootstatus`, before xcodebuild; the [preserved failure record](../../evidence/P01-T02-simulator-preflight-failure-8f96036.md) contains the observed exception, command and independently verified artifact hash. It provides no resource-loading result.

The retest [40451042264](https://github.com/cheshmakzanoon-ops/Tin-junction/actions/runs/40451042264) at `6a8f3f3bf7e071e421f4d16f8d514097be9ffb67` compiled and ran the app. Git verification shows only evidence/planning changes from the implementation above. Its [actual recovered report](../../evidence/P01-T02-failed-origin-observation-6a8f3f3.json) proves PNG sampling and the classic worker, but GLB/WAV/WASM fetches returned status zero. GLB parsing, audio decoding, WASM compilation and the second cold launch were not established. The [failure review](../../evidence/P01-T02-native-failure-review-6a8f3f3.md) preserves the artifact identity, separate UI launch failure and exact recovery provenance.

The bounded repair supplies public `HTTPURLResponse` success metadata and fixed MIME/length headers. It preserves the actual Fetch API check, loader assertions and CSP. At `d1bfe55800a09fc39f7bed0d31e5fc92e3c57571`, [full native run 40455394205](https://github.com/cheshmakzanoon-ops/Tin-junction/actions/runs/40455394205) proved first-launch GLB rendering (14 meshes, 280 triangles, 423 visible pixels), four-quadrant PNG sampling, worker execution and mono WAV decoding. WASM compilation was explicitly CSP-blocked, and KTX2 remained absent. The [retained failure review](../../evidence/P01-T02-native-failure-review-d1bfe55.md) records every outcome and its limit.

That run still failed: the audio handler published a terminal audio result while its stage remained `ready`, violating the unchanged native schema before its subsequent `complete` update. The last accepted native report stayed pending/suspended; completed playback and the second cold launch were not established. A separate native recovery identifier/contrast defect prevented the Retry UI test from completing. These failures cannot be adopted as passing integration evidence.

The reviewed repair at `f0303cc9a9f49e48902350b14f526d5dcdbda3de` publishes the audio outcome and completion stage atomically and repairs native recovery containment, text contrast and hit area. Its full native run later reported cancelled, with no retrievable completed log or artifact. The [verification incident](../../evidence/INC-NATIVE-QUEUE-20261027.md) preserves the unknown execution stage and subsequent distinct failures; cancellation provides no native passing result.

At `0e6d83c24bd4e0ed5413c095ebaee1cbbc09d406`, [full run 40467652957](https://github.com/cheshmakzanoon-ops/Tin-junction/actions/runs/40467652957) completed both first-launch and cold-relaunch asset observations with different native sessions. GLB rendering, four-quadrant texture sampling, the classic worker and user-gesture audio source completion passed; WASM remained explicitly CSP-blocked and KTX2 disabled. The [source-bound review](../../evidence/P01-T02-native-observation-review-0e6d83c.md) records the unchanged assertions and actual reports. That full run still failed its separate recovery accessibility assertion, so installed-resource verification and the clean-install trial were skipped.

At `53e193b6435d241f8c1462d859112b2cb1b56b77`, [full run 40471495670](https://github.com/cheshmakzanoon-ops/Tin-junction/actions/runs/40471495670) passed all 87 units and six of eight UI cases, including the unchanged recovery exclusion, contrast audit and actual Retry/foreground sequence. Its first asset session completed, but the explicit foreground `app.terminate()` failed before the cold launch. Help's initial launch separately failed while terminating the previous rotation fixture. The recovered runner log records delayed Xcode request handling and process-state notification; it does not establish a product shutdown deadlock or the cause of the host delay. Neither later process death nor an older passing cold session converts this run into a pass. Installed identity and clean reinstall remained skipped.

At **`c1e6e39ba127e064f4907e9c5a1d84fed7163990`**, [full native run 40475892006](https://github.com/cheshmakzanoon-ops/Tin-junction/actions/runs/40475892006) passed **87 unit tests and all eight UI tests**, followed by installed-resource verification and the separate clean-install trial. All four original terminal asset reports—first/cold before reset and first/cold after reinstall—record 14 GLB meshes, 280 triangles, 423 visible pixels, four correctly sampled PNG quadrants, the actual worker response and gesture-activated mono audio source completion. WASM remains explicitly blocked by CSP and KTX2 remains absent/disabled. Every session is distinct; native reports confirm the HTTP/HTTPS-deny rule, completed WebKit data clearing and nonpersistent storage.

The clean trial observed existing saved-layout generations, successful test-app uninstall, the specific missing-container result, and an empty native layout store after reinstall and before any launch or test. It then ran the unchanged asset UI class with `test-without-building` and verified the same compiled app's installed resource identity before reset, after reinstall and after the test. The full suite remains an independently required pass. The [source-bound observations](../../evidence/P01-T02-native-observation-review-c1e6e39.md) preserve the exact outcomes, four reports and limits. The coordinator independently verified the full archive, matching compact indices and all **139 reports plus 17 PNGs** against their original bytes. All three required current workflows passed; no older failure was converted into a pass.

This completes the original separate app-data-deletion verification for the bounded transport decision. It does not establish secure erasure, physical radio isolation, production decoder compatibility or a cause/fix for the earlier host-side termination delays. The earlier proposed state and failed experiments above remain part of this decision's history.

The local packaging tests verify finite file lists, diagnostic exclusion, fixture hashes, safe cleanup and symlink rejection. Release-guard tests check ordinary and diagnostic manifests, integrity and configuration wiring. These are source/build checks, not native origin evidence. A separate desktop HTTP sanity run likewise does not establish WKWebView compatibility.

Public API references checked on 2026-10-27: Apple's [content-rule compilation API](https://developer.apple.com/documentation/webkit/wkcontentruleliststore/compilecontentrulelist(foridentifier:encodedcontentrulelist:completionhandler:)), [nonpersistent website data store](https://developer.apple.com/documentation/webkit/wkwebsitedatastore/nonpersistent()) and [website-data removal API](https://developer.apple.com/documentation/webkit/wkwebsitedatastore/removedata(oftypes:modifiedsince:completionhandler:)). API availability is distinct from the result of this app's runtime experiment.

## Limits and consequences

The WebView HTTP/HTTPS deny rule demonstrates a constrained offline resource environment when the native test passes. It is not a hardware airplane-mode test. WebKit data reset and a new app session are not an app uninstall or deletion of native documents.

The small static GLB and separate PNG do not establish embedded/external glTF texture combinations, skinning, animation, compressed textures, mesh decoders, final-art quality, audio quality, loading peaks or sustained rendering performance. A Simulator result cannot approve physical Duo thermals, speaker output or fold behavior. Native resource cancellation and real WebContent termination remain separate tasks.

This approach keeps diagnostic findings reviewable and prevents unsupported loaders from becoming implicit dependencies. Its cost is an explicit fixture and native validation obligation for each later loader or toolchain change. Original fixture generators and hashes remain in the repository; these diagnostic assets are excluded from ordinary packaging and confer no approval on later production assets.

## Revisit and rollback

Revisit this choice if a supported OS/SDK changes custom-scheme behavior, a production asset requires an unproved decoder, or measured loading/device budgets require a different transport. Preserve the failing fixture and current evidence before proposing a replacement. A replacement must pass the same security, offline, bridge and recovery gates.

To return to an ordinary development bundle, run `npm run bundle:ios` without the diagnostic option. Do not alter user documents, erase failed evidence, broaden CSP, remove assertions or rewrite Git history as a rollback.

## Related records

- [Bridge protocol](../architecture/BRIDGE_PROTOCOL.md)
- [Asset pipeline](../graphics/ASSET_PIPELINE.md)
- [iOS CI operation](../operations/IOS_CI.md)
- [Original fixture manifest](../../tests/fixtures/asset-origin/fixture-manifest.json)
- [Platform and runtime phase](../../planning/phases/P01-platform-and-runtime-spikes.md)
