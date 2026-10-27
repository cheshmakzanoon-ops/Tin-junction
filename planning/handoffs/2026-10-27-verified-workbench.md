# Verified operating workbench and next implementation boundaries

## Accepted development checkpoint

The tested implementation is **`c1e6e39ba127e064f4907e9c5a1d84fed7163990`**, tree **`fc1d945c5c68265b8d4fdcac45e9fa1809594aca`**. Its full native, focused native-model and repository/web workflows all completed successfully. The verification incident is resolved through the project CLI using the inspected current results; historical failures and unknown host-delay causes remain intact. This checkpoint accepts **P01-T02, P02-T01 and P04-T06 only**, using the source-bound manifests below. It does not accept production art or later roadmap/release gates.

| Actual execution | Result |
| --- | --- |
| [Full native 40475892006](https://github.com/cheshmakzanoon-ops/Tin-junction/actions/runs/40475892006) | 87 units and all eight UI tests passed. Installed resources, literal clean reinstall, unchanged supplemental asset UI case, staging and uploads passed. Job completed 09:05:13 UTC. |
| [Focused native 40475891995](https://github.com/cheshmakzanoon-ops/Tin-junction/actions/runs/40475891995) | All 87 units passed; the shared UI lifetime helper compiled. Job completed 08:55:39 UTC. |
| [Web/export 40475892017](https://github.com/cheshmakzanoon-ops/Tin-junction/actions/runs/40475892017) | Both jobs passed. Project/tool/web unit counts: 108/56/304. Browser: 34 cases, 34 first-attempt passes, zero retries/flakes/skips/errors. Run updated 09:07:23 UTC. |

The separate clean trial ran only after full-suite and installed verification success. It observed existing saved generations, test-app removal, the specific missing-container result, reinstall of the same compiled app and an empty store before any launch. Its asset case passed in 113.130 seconds; the four first/cold reports before and after reset have distinct sessions. All report GLB/PNG/worker/gesture-audio success, explicit CSP-blocked WASM and absent/disabled KTX2. The selected custom-origin transport is now accepted in [ADR-0007](../../docs/decisions/ADR-0007-packaged-asset-transport.md) within those measured capabilities.

## Evidence and coordinator review

- **P01-T02:** [native integration](../../evidence/P01-T02-native-integration-c1e6e39.json) and [original observation review](../../evidence/P01-T02-native-observation-review-c1e6e39.md). Exact 113-input scope; A1/A2.
- **P02-T01:** [27-case ownership units](../../evidence/P02-T01-native-unit-c1e6e39.json) and [native integration](../../evidence/P02-T01-native-integration-c1e6e39.json). Exact 118-input scope; A1 plus actual held-start/loading/Help, failed initialization, contrast/accessibility containment, Retry and foreground behavior for A2.
- **P04-T06:** [web units](../../evidence/P04-T06-web-unit-c1e6e39.json), [web integration](../../evidence/P04-T06-web-integration-c1e6e39.json), [46-case native units](../../evidence/P04-T06-native-unit-c1e6e39.json) and [native integration](../../evidence/P04-T06-native-integration-c1e6e39.json). Exact 92/70/129-input scopes. Browser operation/edit/undo/reopen and real native name edit/durable acknowledgment/foreground termination/relaunch are explicitly distinguished.

All formal records passed strict file-digest and immutable Git-source validation. The coordinator independently verified the full native ZIP, both compact ZIPs, their matching index and all **139 reports plus 17 PNGs** against the full originals. All four terminal reports, installed identity, clean-install sequence and 48 full plus nine clean public lifecycle observations were inspected. Four native save/restored/failure/retried captures were directly viewed. The web/export ZIPs, embedded report, six details, all 34 first attempts, 23 PNG identities, manifest and exact unfiltered log spans were independently verified. Reviewers inspected the original captures recorded in their reviews; the coordinator additionally viewed the narrow maximum name and night title. An independent native reviewer found no defect in the coordinator's P04 integration record.

The title repair is visible in actual native/browser captures. Status and footer remain scene-backed and need the separately reviewed backing change. The current procedural scene is a fixed-oval development workbench. General graph/editor integration, production miniature assets and material/lighting calibration remain unfinished.

## Next bounded work

After acceptance, use `project:next` and claim ready tasks through the CLI. Coordinated scopes are:

1. **P01-T03 — custom-origin security:** manifest/resource allowlist, bounded asynchronous read ownership, cancellation without stopped callbacks, malformed-input fixtures and packaged negative probes. Native worker owns handler/policy/new security helpers and tests. Coordinator owns EngineWebView/EngineHostModel/BridgeEnvelope integration and shared workflow/build wiring.
2. **P02-T03 — native preferences/accessibility:** versioned preferences separate from layouts; real sound/haptics/reduced-effects/interaction consumers; Settings/Help and errors usable without the canvas. Coordinator owns native store/UI/session/bridge/media gating and native tests; web worker owns typed web preferences, whistle cancellation, live effects/interaction and web tests. Pending AudioContext resume after inactivity is an observed defect.
3. **P10-T03 — compression compatibility:** pinned original paired texture/mesh fixtures, explicit decoder/extension policy and actual packaged experiment. Asset worker owns compression tooling, fixtures and isolated loader/probe files. CSP/build integration requires coordinator review; no global `unsafe-eval`, unverified fallback or assumed GPU compression.

Workers have disjoint exact file ownership and must not alter state, immutable evidence, lockfiles, shared builds or workflows independently. Temporary read-only preparations are implementation aids, not accepted evidence. Publish a coherent metadata checkpoint before changing the tested app source. Later changes need their own results and must not rewrite `c1e6e39` fingerprints.

## Remaining limits

This is unsigned Debug on the advertised Duo Simulator. WebView HTTP/HTTPS denial is not OS-wide networking disablement. Public XCTest state is asynchronous, not independent PID/death proof. Successful cleanup does not diagnose old host delays. The 44.597-second clean cold launch is not a performance pass; identical platform reports do not prove a geometry/fold transition.

Complete VoiceOver, largest text, physical sound/mute/haptics, real WebContent-process recovery, production art and sustained hardware/thermal validation remain open. Duo-exclusive commercial eligibility remains blocked under P01-T04. Name/asset rights, final art approval, credentials, signing, TestFlight, store materials and submission/release authorization retain their owner gates. Continue independent ready work without broadening the Duo-only product.
