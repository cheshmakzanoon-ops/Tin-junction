# P01-T02 — actual packaged-origin and clean-reinstall evidence at c1e6e39

## Result and scope

The mandatory [native run 40475892006](https://github.com/cheshmakzanoon-ops/Tin-junction/actions/runs/40475892006) passed at exact implementation `c1e6e39ba127e064f4907e9c5a1d84fed7163990`: **87 unit tests and all eight UI tests**, followed by successful installed-resource verification and a **separate, unchanged asset-origin UI case after actual app-data uninstall/reinstall**. The latter passed in 113.130 seconds. This supports P01-T02-A1 and A2 within the stated Simulator and WebView network-denial scope. The coordinator owns task acceptance and release gates.

Full test step: 08:47:40–09:01:36 UTC; installed verification: 09:01:37–09:01:43; clean verification: 09:01:43–09:04:19. Job `122093894596`, runner `1000015890`, attempt 1 completed at 09:05:13 UTC and was observed terminal at 09:05:17. There was no retry, filtered replacement for the full suite, or assertion relaxation.

The actual inventory records Xcode 27.1 build 27A9275 and the dynamically selected iPhone Duo Simulator on iOS 27.1. The original inventory identities, exact reports and all current test outcomes are retained in [P01-T02-native-observation-c1e6e39.json](P01-T02-native-observation-c1e6e39.json). The 113 exact Git source fingerprints in the integration manifest include native host/bridge/policy/probe/UI test sources, the new test-lifetime helper, main/bootstrap/CSS, every imported runtime module, pinned dependencies, fixture generators and bytes, builder, workflows, installed recorder, clean runner and evidence staging tools. They are not a claim that every file was exercised by every assertion.

## What ran at the custom origin

The test navigated the app's actual `tinjunction://bundle/index.html`, initialized WebGL2, waited for real `host.ready`, captured the native-accepted report, tapped the actual accessible **Play probe tone** button, and required the report's complete stage. It then explicitly terminated, relaunched, repeated the checks, and required a different native session ID. The additional clean trial ran that same case after deleting native application data.

| Observed operation | All four completed sessions |
|---|---|
| Classic bundled IIFE / WebGL2 | Loaded in the actual WKWebView custom origin; no external runtime dependencies in the installed manifest |
| Original GLB | 14 meshes, 280 triangles, 423 visible pixels from GPU readback |
| Original PNG | 8 × 8 pixels; all four expected color quadrants reached GPU readback |
| Classic worker | Executed bundled code and returned `asset-worker-ready:42` |
| Original PCM WAV | Decoded mono 5,760 frames at 48,000 Hz; an actual accessible tap resumed the AudioContext; source playback completed with context `running` |
| WASM | 44 packaged bytes delivered; compilation explicitly blocked by the unchanged `script-src 'self' tinjunction://bundle` CSP |
| KTX2 / Basis | Fixture and transcoder absent; compressed-texture loader remained explicitly blocked |

WASM and KTX2 are feasibility limitations, not silently enabled loaders. The captured WASM error specifically says that neither `unsafe-eval` nor `wasm-unsafe-eval` is allowed. No policy relaxation or substitution of status-zero fetch success was used. Original GLB, PNG, WAV, worker, WASM and fixture-manifest source hashes appear in the immutable source closure and actual installed identity.

### Four distinct native sessions

Each terminal report is 1,590 original bytes. All four record `networkPolicy: http-https-denied`, `webDataCleared: true`, `persistentStorage: false`, `isSimulator: true`, `stage: complete` and the exact custom document URL. The earlier ready/audio-pending report for each session is also retained, so audio completion is not inferred from decoding alone.

| Trial | Native session | Original terminal attachment | SHA-256 |
|---|---|---|---|
| clean reinstall / first launch | `C03F6423-9AAF-45DC-8294-FF76A24FA5CC` | `clean-install-4yzQlq/screenshots/2E0A31C1-AE29-4C71-8EE6-A52F1F9C6653.txt` | `b03b91739905a425b7f49fecd10fbe5b26e280c729325453d3425955d67bf267` |
| clean reinstall / cold relaunch | `42F2613F-C1CB-41DE-B2D0-B2F5E0EEDDB8` | `clean-install-4yzQlq/screenshots/6366BFEB-2E19-4612-88E6-845B7AC939E3.txt` | `778351c39ad720697741740aed1161f69f8797256e98867cf6c466301d89c0d3` |
| full suite / first launch | `205E5918-1238-4167-A491-85367761C319` | `screenshots/83FF64D4-3AD5-47AA-BDD3-3EB0D50E2950.txt` | `8bbc7fdd63bd301c9c8a6ffb7b5ec6fd5b39f567b2ed47bf8ee7041db52a641a` |
| full suite / cold relaunch | `16545625-CA8F-4BC0-9545-216504E8BBF3` | `screenshots/4FF50611-D277-4EB7-9005-64F651FAAD52.txt` | `412d82b6df2f7e6b335cf10c49c1dd23c4c478eaa843ce379e165477d3c12bf7` |

All four original diagnostic PNGs were visually inspected. They show the loaded calibration geometry, four-color PNG and the same explicit passed/blocked statuses recorded in JSON:

- `screenshots/2E22F315-B730-4644-B9CE-3D244510383C.png` — 848,992 bytes, SHA-256 `93c1a2ca06eb24624f6952557071f0da33d0fefc7c76ec339a1bcfee316d42f7`
- `screenshots/F733FBD7-2CDC-4423-9174-9CE1E715CF0D.png` — 848,897 bytes, SHA-256 `2d238e505df6b75c22ccfdb1616f734abcb4ca97d9fe0cb3195d903ade50006d`
- `clean-install-4yzQlq/screenshots/F2D7B2FD-4891-4F1E-B97B-46CF2A262D1E.png` — 849,369 bytes, SHA-256 `2909df6d5d59e4c957fa0d65e97cd2496ee36b43193a9caef7fdd32c32c51f85`
- `clean-install-4yzQlq/screenshots/14293933-06C5-46B2-8263-591CCD45225F.png` — 849,021 bytes, SHA-256 `872c3ffa28be0b695941791d4328aeb58b4c257554340a1beacb7e66d72ae307`

## Installed bytes and literal app-data reset

The workflow derived the bundle identifier from the compiled app's Info.plist, resolved its installed location using public `simctl get_app_container`, and ran the finite-file verifier against **installed WebAssets**. This is stronger than recording only the generated packaging input; the original input remains separately labeled.

`installed-web-identity.json` is 2,295 bytes, SHA-256 `5b04f8ed83a4b50a67082cab6238cf4dffb43fd52baa34ff4bf2fc4f4d74bde1`. It records all ten actual runtime files, their sizes/digests, and a matching installed/input manifest. Both original manifests are 1,592 bytes with SHA-256 `0fce39ed2cc596246e79efb8ba8fec8c871caae2cce7083ad38a87bbe609d8bd`. The actual diagnostic JS is 801,455 bytes (`c037026dc0865d5c6d5e81e998deee4682959e60f7be82c3cca7db6ff089d68b`) and CSS is 19,325 bytes (`19bd0240a3682d74c7b8caddeae84ea73978ef590107e40e4f76dc30106cd641`). The release-default four-file boundary is a separate build/test fact; these are deliberately opted-in Debug diagnostic resources.

The original `clean-install-4yzQlq/verification.json` is 8,210 bytes, SHA-256 `434eebb1a3657355c8119e76d4583800342300104c03f3bc0cd0d6ccfff6b06c`. It records this observed sequence:

1. Existing `current.json` and `previous.json` were each 3,527 bytes with recorded different digests. Thus the reset did not merely begin with an already empty store.
2. Public uninstall of compiled bundle `com.cheshmakzanoonops.tinjunction` succeeded at 09:01:56.460. The following data-container query returned exit 2 with `NSPOSIXErrorDomain` code 2 and empty stdout. The observed error identity is retained; no container path is published.
3. Public reinstall of the **same compiled app** succeeded at 09:02:02.729. Before any launch or test, the new container location differed and both saved-generation and application-store entry counts were zero.
4. The unchanged asset test ran with `test-without-building`, after the required full suite had already passed. It produced two new terminal reports and distinct sessions.
5. Installed identities before reset, after reinstall and after this test all verified the same ten files and manifest. Their original records and byte identities are retained in the observation JSON.

This establishes actual native app-container removal and fresh application-store absence. It does not establish secure erasure or keychain clearing. HTTP/HTTPS denial was installed inside the prepared WebView before navigation, with a nonpersistent store and explicit WebKit data removal on each launch. **It is WebView offline resource evidence, not OS-wide networking disablement or physical airplane mode.**

## Native log review and timing limits

The original full and clean UI console objects were recovered from the downloaded xcresult archives and verified by compressed and decoded SHA-256. Complete timestamp/PID/event substrings are retained in [P01-T02-native-observation-tests-c1e6e39.txt](P01-T02-native-observation-tests-c1e6e39.txt); surrounding interleaved diagnostic text is not presented as if it were a clean whole line. The console includes the native resource-type/size deliveries and native-accepted report values, including the CSP blocker. We do not claim that every diagnostic line is error-free.

For all four actual asset sessions, the native trace reaches `host.layoutAccepted` **before** GLB probe resource loading. Loading-to-accepted intervals were 9.955 and 1.868 seconds in the full suite, then 13.270 and 3.364 seconds after clean reinstall, within the unchanged 20-second readiness deadline. This confirms actual native acceptance for this run; earlier web-only ordering tests did not.

All 48 full-suite and nine clean-trial public lifecycle observations form complete monotonic fixture sequences. Initial launches began at `notRunning`, launches completed at `runningForeground`, explicit terminations and every teardown ended at `notRunning`. These are asynchronous XCTest states, not independent OS PID death measurements. Successful test isolation does not identify the exclusive cause of earlier host-side processing delays. In particular, the clean cold-launch public call took 44.597 seconds; this is **not** a performance-baseline pass.

The three current platform reports retain identical 382 × 574.6666666666666-point viewport geometry, pixel ratio 3 and hinge angle 0. Orientation requests therefore do not prove a changed viewport or physical fold transition.

## Provenance and retained boundaries

The full original log is 335,365 bytes with SHA-256 `bd99e4be4e1e8ff085b0af588511dee0d417cfd02573464964a408fbdb9591c8`; its actual command ends with `** TEST SUCCEEDED **`. The clean log is 15,626 bytes with SHA-256 `9e5cbee6d9198d53dc78e1552af70c6929f8854c30bb4f870c321292b6e8fad9`, with one test passed and zero failures. Selected unchanged pass/summary lines are separate from editorial headings and extracted startup events.

| Original artifact | ID | Bytes | SHA-256 | Provider expiry UTC |
|---|---:|---:|---|---|
| Full native result | 12720484130 | 346,308,224 | `798ffb5bbbeefa3f8dc0a7011c22ceedf566dbc7c970a99ac12377daf5668a50` | 2026-11-10 09:04:26 |
| Bounded reports | 12720898476 | 345,660 | `32f98b9f1e498832cb4b325c8edd9b8540bdf784a7b09c56ee2868dacd075728` | 2026-11-10 09:04:21 |
| Original PNG captures | 12720594017 | 17,947,337 | `62423a2fe5a3bf54b8054dbd39cf5478fe9624c6ec11dbf202f48bab74b64224` | 2026-11-10 09:04:23 |

All download hashes match provider metadata. Both compact packages identify this exact commit/run/attempt with no staging issues, and all 139 report files plus 17 PNGs match both their index and the full archive byte-for-byte. The shared index digest is `5482cf9b6a2bbf39018ad973e4fc7bc75cc3a3b83d2a8a9177291f5a14e700ce`. Packaging status and actual test success are distinct observations; both succeeded. Large binaries stay in the original artifacts, not Git.

The selected transport remains the public custom-scheme handler with `HTTPURLResponse` status 200 and fixed MIME/length metadata, pinned local classic script, and unchanged CSP, as documented in ADR-0007. Future compressed assets still require their own packaged decoder/fixture proof. Resource allowlist/cancellation hardening belongs to P01-T03; actual WebContent-process recovery belongs to P02-T02. Physical hardware, acoustic quality, sustained performance, full accessibility, premium art approval, signing and commercial distribution remain open gates. Existing failed runs retain their original failure records rather than being relabeled by this success.
