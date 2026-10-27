# Test strategy and evidence standards

Status: PROPOSED full-product test strategy. The repository's initial harness implements only a subset. Consult the task ledger and actual test files for implemented coverage.

## 1. What a passing test means

There are separate claims to prove:

1. The repository plan is internally consistent and resumable.
2. Pure simulation/data code is correct for its specified inputs.
3. The web bundle renders and handles messages in a browser harness.
4. The same bundle works inside the packaged Swift/WebKit app.
5. Native Duo posture/layout/lifecycle integration works on the intended SDK and device.
6. The finished scene is visually convincing, accessible and usable.
7. It remains stable and performant during sustained physical-device use.
8. The exact release build is eligible, signed, licensed and approved for distribution.

No single CI job establishes all eight. Test reports must name which claim they support and which remain untested.

## 2. Test layers

| Layer | Execution environment | Proves | Does not prove |
|---|---|---|---|
| Project validator | Node, Linux/macOS | Task DAG/state/evidence/document consistency | App functionality or visual quality |
| Pure unit/property tests | Node | Algorithms, schema validation, deterministic state | GPU behavior, native APIs |
| Browser smoke/integration | Pinned Playwright browser | Web packaging, JS execution, basic rendered state | iPhone Duo hardware support |
| Swift unit tests | Selected Xcode Simulator | Native decoding, resource policy, storage logic | Real flash-failure behavior or touch feel |
| Packaged XCUITest | Actual available Duo simulator | Swift app + WKWebView integration on that runtime | Real-device GPU, thermal or haptic behavior |
| Device integration | Physical iPhone Duo | Actual fold, audio route, lifecycle, resource behavior | Worldwide App Store eligibility |
| Visual/usability review | Runtime captures + human reviewer | Reference quality and understandable interaction | Future revenue or absence of all defects |
| Release verification | Exact archive/build and owner evidence | Submission readiness for reviewed scope | Automatic approval by Apple |

Browser mocks, injected hinge events and real native hinge observations must have different labels in test reports. Never rename synthetic data as “device-tested.”

## 3. Current bootstrap command map

The setup installs these root commands; each agent must inspect `package.json` for the current authoritative definitions:

```sh
npm ci
npm run project:validate
npm run typecheck
npm test
npm run build
npm run build:verify
npm run bundle:ios
npm run test:browser
```

`npm run check` aggregates the configured project/code/build checks. `test:browser` additionally requires the pinned browser installation described by the workflow. Native execution requires macOS, the selected Xcode, generated project, bundled assets and a verified Duo simulator UDID; use [iOS CI](../operations/IOS_CI.md).

This command list does not assert that any run passed. Record actual commands, exit codes, commit SHA and artifacts. Future tests described below need implementation tasks; do not add a fake always-passing script under their names.

## 4. Project-system verification

Required negative fixtures:

- Duplicate task/phase IDs.
- Unknown dependency and dependency cycle.
- Done task with unfinished dependency.
- In-progress task without a valid owner/lease.
- Stale claim with no recovery record.
- Missing required evidence, fabricated placeholder or nonexistent artifact path.
- Device-required criterion backed only by browser/simulator evidence.
- Owner approval without a recorded decision reference.
- Changed source digest after an evidence record was produced.
- Manually changed generated status or phase documentation.
- Invalid local links and orphaned task state.

The validator cannot establish that an externally linked screenshot really looks good or that an owner genuinely approved something. It enforces traceability and structural requirements; human review still owns judgment.

## 5. Simulation and track verification

Tests must exercise the actual production modules without importing renderer code.

### Geometry

- Analytical length of straights/arcs against known fixtures.
- Arc-length inversion error bounds on any supported nonanalytic curve.
- Endpoint and tangent continuity at connections.
- Rail inner-face gauge and sleeper spacing.
- Invalid radius, zero-length piece, duplicate connection and incompatible gauge rejection.
- Consistent geometry after rigid transform, serialization and reload.
- Boundaries/clearance envelopes including vehicle overhang.

### Train movement

- Same commands at the same ticks with different render rates.
- Forward, coast, brake, stop and stop-before-reverse.
- More than one piece crossed in a tick.
- Full route-history retention for the entire consist, bounded over many laps.
- Facing/trailing turnout behavior and branch latching.
- Occupancy until the rear of the last vehicle clears.
- Buffer/red-signal stopping at maximum certified speed.
- Bogie chord and coupler constraints on the minimum supported radius.
- Wheel phase continuity on reverse, pause and load.
- No hidden motion on background/foreground transition.

### Property-based checks

Generate small valid graphs and command sequences from a seeded generator. Invariants: all references resolve; no train occupies an impossible route; accepted edit increases revision exactly once; rejected edit does not mutate; route histories stay bounded; all numeric outputs remain finite.

Every failure records the seed and a minimized fixture. Keep regressions in the repository. A nondeterministic test is a defect to diagnose, not a reason to rerun until green.

## 6. Bridge and WebView security

Test both Swift and TypeScript boundaries against the same fixture corpus:

- Missing/incorrect version, ID, type or payload.
- Unknown message type and extra privileged operation requests.
- Oversized payload, overlong strings, deep nesting and invalid numbers.
- Out-of-order, duplicate and stale-session messages.
- Rapid valid message bursts with bounded queues/coalescing.
- Bootstrap arriving before/after renderer readiness.
- Lifecycle pause during a pending asynchronous operation.
- Viewport dimensions of zero, resize storms and reserved rectangles outside bounds.
- Unexpected web navigation, external scheme, host mismatch and new window requests.
- Literal and percent-encoded path traversal, ambiguous path separators and symlink escape.
- Correct MIME type for every bundled resource kind.
- Resource request cancellation without later callbacks to a stopped task.
- Web content process termination followed by bounded recovery.

No test may enable private universal file access or disable WebKit security to make the result pass. The test origin/CSP/bundle layout must match production as closely as possible.

## 7. Packaged asset compatibility

The production origin spike must load each intended class of asset from the signed/bundled structure, not only from Vite localhost:

1. JavaScript bundle and stylesheet.
2. GLB with representative material attributes.
3. Standard textures with correct color interpretation.
4. KTX2 decoder assets and actual compressed textures.
5. Mesh compression decoder and a compatible compressed mesh.
6. WASM/worker resources where used, under the real CSP.
7. Audio assets and playback after permitted activation.

Capture loader errors, exact URLs, decoder versions, origin, renderer backend and resource manifest hash. A GLB loaded over local HTTP does not prove it works under the app's custom scheme.

## 8. Persistence failure-injection suite

Inject failure before and after every generation-write stage described in [persistence](../architecture/PERSISTENCE_AND_EDITOR.md). Assertions include:

- Previous generation remains intact on failure.
- Current index never references a partly written generation as valid.
- Corrupt current data falls back with a truthful notice.
- Unknown future schema never mutates the original.
- Duplicate/stale requests cannot roll back state.
- Layout-switch races cannot write to the wrong document.
- Undo/redo and migrations preserve semantic state.
- Storage-full/save-denied failures retain in-memory work and expose recovery.
- Import limits are enforced before derived allocations.

Test process termination, not only thrown Swift errors. Distinguish a simulated injected failure from actual operating-system termination evidence.

## 9. Rendering and visual regression

Use deterministic scene fixtures with:

- Named scene and seed.
- Fixed camera transform, exposure, environment and quality tier.
- Pinned renderer and asset-manifest version/hash.
- Fixed animation tick for still comparisons.
- Device/runtime/browser/backend/color-output metadata.
- Disabled nondeterministic decorative effects or a fixed seed/time.

Automated image comparisons identify changes; they do not decide whether the change is desirable. Maintain separate baselines for materially different renderer/device configurations. Do not demand pixel-identical output across GPU drivers.

Baseline updates require side-by-side review, a reason, the changed source/asset IDs and reviewer acknowledgment. Never replace goldens merely because a regression test failed.

Required camera/scene coverage includes whole layout, locomotive macro, turnout traversal, wheel/rail contact, village daylight, night lighting, case edges, editor overlays and each supported posture. Weather captures are required only when weather is promoted into release scope.

## 10. Physical-device performance

See [performance budgets](../graphics/PERFORMANCE_BUDGETS.md) for provisional numbers. Tests must disclose whether a target is still provisional or ratified against a measured scene.

Record:

- Physical device identity/capacity, OS version and app build.
- Release/debug configuration, renderer backend, quality tier and scene hash.
- Power state, low-power mode, charging status, approximate starting thermal condition and ambient conditions when relevant.
- Warm-up and steady-state durations separately.
- Frame-time median, p95/p99, long stalls and event timestamps.
- Native and web-content memory observations; browser heap is not total memory.
- Draw calls/triangles and texture/resource accounting estimates, with method limitations.
- Thermal-state transitions and adaptive-quality decisions.
- Startup/load time and repeat-load memory growth.

Initial required scenarios: ready layout running, close train inspection, busy editing, repeated library switches, night preset, open/close transitions and a sustained soak. A 30-minute initial soak is a proposed minimum; increase when failures appear. A short cold-device benchmark is insufficient.

GPU timing is reported only when a trustworthy supported measurement is actually available. Otherwise mark it unavailable rather than deriving fake GPU milliseconds from total frame time.

## 11. Native lifecycle and posture matrix

| Condition | Expected behavior | Required environment |
|---|---|---|
| Inner fully open launch | Correct scene bounds and reachable controls | Duo simulator plus hardware |
| Inner partially open | Native regions respected, stable topology | Hardware/native observations |
| Outer display transition | Defined compact/paused behavior, no lost edits | Hardware |
| Rotation and split resize | No stretching, blank canvas or stale hit tests | Simulator and hardware |
| Fold during active drag | Cancel preview, preserve last committed revision | Hardware |
| Fold during save | Correct acknowledgment/recovery | Hardware |
| Background while moving | Pause/silence, bounded checkpoint | Packaged app and hardware |
| Phone/audio interruption | Correct sound recovery without duplicate loops | Hardware |
| Web process terminated | Native recovery and last durable state | Packaged app |
| Memory warning/resource pressure | Bounded caches and no silent data loss | Native test plus hardware observation |
| Repeated resume | No duplicate observers, contexts or simulation loops | Packaged app |

If a public simulator CLI cannot automate a posture, record that limit and use a documented manual Device Hub or physical-device procedure. Do not invent a command or mark the case skipped-success.

## 12. Accessibility and usability

Inspect native accessibility hierarchy and test with assistive technology, not only an automated label scan.

- VoiceOver: start/stop, throttle change, mode switch, library open, selected turnout.
- Large text: no missing critical controls in compact layouts.
- Contrast and color-independent signal/selection feedback.
- Reduced motion and sound/haptic settings.
- Non-precision-touch access to essential object selection/editing.
- Comfortable reach and control separation in supported postures.
- Plain save/recovery/error understanding in observed user sessions.

Record failures with exact steps, screenshots where useful and the affected mode/posture. No arbitrary percentage score substitutes for closure of critical accessibility blockers.

## 13. Offline and privacy checks

- Fresh install/first launch with network unavailable.
- Existing layout loading, editing and saving offline.
- No unexpected outgoing resource requests or CDN dependency.
- No permission prompt unrelated to stated functionality.
- No secrets/private paths/layout contents in logs or artifacts.
- Export only after user action; imported content cannot invoke external resources.
- Production build excludes test-only pose injection and privileged diagnostics.

Network-observation methods and limitations must be documented. “We did not add analytics” is not a dependency audit.

## 14. Test evidence manifest

Each completed criterion references a structured evidence record following [task evidence](../agents/TASK_EVIDENCE.md). Include:

- Actual tested implementation commit plus source digest.
- Command/procedure, environment and start/end time.
- Exit code/outcome and real artifact paths/URLs.
- Exact scene/catalog/build versions when relevant.
- Known limitations and tests not executed.
- For hardware: `device.is_simulator: false` plus actual device/OS metadata.
- For owner gates: `decision_reference` pointing to the owner's recorded decision, never an agent-authored approval substitute.

Evidence links must be retained long enough to support release review. Before ephemeral Actions artifacts expire, preserve approved release evidence through the project's documented retention route. Do not commit gigabytes of recordings or private test data into ordinary Git.

## 15. Severity and triage

| Severity | Examples | Release effect |
|---|---|---|
| S0 | Credential exposure, destructive data loss, unsafe release action | Stop relevant work; contain and inform owner |
| S1 | Crash on core path, corrupt saves, unusable Duo posture, inaccessible Stop | Blocks beta/release |
| S2 | Major visual defect, broken editor operation with workaround, sustained budget failure | Blocks affected milestone; release only with explicit documented scope change |
| S3 | Minor polish, rare noncritical cosmetic issue | Prioritized backlog with truthful known-issues entry |

Every defect has a reproducer, build/environment, expected/actual result, owner and regression-test plan. A flaky required test is not automatically S3.

## 16. Anti-shortcut rules

Do not delete failing tests, loosen thresholds without evidence, add `continue-on-error`, skip a missing Duo runtime, fabricate a screenshot or treat a generated concept image as runtime proof. CI failure repair has priority over the next feature. A disabled check requires a documented owner-approved exception and remains visible as incomplete evidence.
