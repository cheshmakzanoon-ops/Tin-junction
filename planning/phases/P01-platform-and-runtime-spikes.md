# P01 — Platform truth and packaged-runtime spikes

> Generated from planning/roadmap.json. Edit the JSON definition, then run `npm run project:render`.

## Outcome

Prove the documented Duo SDK and the actual packaged WebView loading path before expanding the product.

## Exit gate

SDK/runtime assumptions have concrete evidence; unresolved commercial exclusivity remains a separately tracked release blocker.

The phase is not accepted merely because these instructions or its source files exist. Each task requires the stated evidence. Current progress lives in [the ledger](../state.json).

## P01-T01 — Compile public Duo capabilities and inventory the CI device

Dependencies: P00-T04

Manual gate: none; planning estimate: 1–3 focused sessions; planning estimate, not a delivery promise. Estimates are not deadlines or completion claims.

### Read first

- [docs/architecture/DUO_PLATFORM.md](../../docs/architecture/DUO_PLATFORM.md)
- [docs/operations/IOS_CI.md](../../docs/operations/IOS_CI.md)
- [docs/architecture/BRIDGE_PROTOCOL.md](../../docs/architecture/BRIDGE_PROTOCOL.md)

### Owned scope

- `apps/ios/TinJunction/Platform/`
- `tools/ios/`
- `evidence/`

### Deliverables

- Public-API compile probe
- Captured Xcode, SDK and Duo simulator inventory

### Implementation sequence

1. Recheck official Apple API documentation and record retrieval dates.
2. Compile the minimal hinge observer using the selected supported SDK.
3. Enumerate real available simulator runtimes and dynamically select a Duo UDID.
4. Exercise launch and rotation without hardcoded screen dimensions.
5. Capture nil-hinge and geometry observations separately from physical-device evidence.
6. Document any unavailable CLI posture controls as gaps, not invented flags.

### Acceptance criteria

- **P01-T01-A1** — A recorded Xcode build compiles the public hinge adapter and identifies the selected SDK and actual Duo simulator.
  - Accepted evidence: integration_test.
- **P01-T01-A2** — The evidence distinguishes supported API signatures from unverified physical-device and store assumptions.
  - Accepted evidence: source_verification.

### Verification

- Run the unsigned native build on the documented runner.
- Confirm a missing Duo runtime produces an explicit failure, not a generic-iPhone fallback.

### Failure cases and cautions

- Runner image contents can change despite a stable label.

### Handoff requirement

Record tested implementation SHA, changed scope, acceptance evidence, commands/results, unrun checks, blockers and the next exact task. Use [the handoff template](../../templates/HANDOFF.md). Update state through the project CLI, regenerate views, and push the metadata checkpoint.

## P01-T02 — Prove bundled asset loading inside the actual WKWebView origin

Dependencies: P01-T01

Manual gate: none; planning estimate: 1–3 focused sessions; planning estimate, not a delivery promise. Estimates are not deadlines or completion claims.

### Read first

- [docs/architecture/BRIDGE_PROTOCOL.md](../../docs/architecture/BRIDGE_PROTOCOL.md)
- [docs/graphics/ASSET_PIPELINE.md](../../docs/graphics/ASSET_PIPELINE.md)
- [docs/operations/IOS_CI.md](../../docs/operations/IOS_CI.md)

### Owned scope

- `apps/ios/TinJunction/Web/`
- `web/src/`
- `tests/web/`
- `evidence/`

### Deliverables

- Packaged asset-origin feasibility report
- Minimal GLB, texture, audio and decoder fixtures

### Implementation sequence

1. Create original minimal fixture assets with recorded hashes.
2. Load the classic script bundle and create WebGL2 inside the packaged host.
3. Load a GLB and texture through the production origin, not the desktop preview server.
4. Probe KTX2/WASM and worker paths under the intended content security policy.
5. Exercise offline launch, cache clearing and repeat loading.
6. Record the selected transport approach and unresolved origin limitations in an ADR.

### Acceptance criteria

- **P01-T02-A1** — Bundled code and fixture GLB/texture content render in the packaged native app with networking disabled.
  - Accepted evidence: integration_test.
- **P01-T02-A2** — Decoder, worker and audio probes report observed success or explicit blockers; unsupported loaders are not silently enabled.
  - Accepted evidence: integration_test.

### Verification

- Inspect native/WebContent logs for origin, MIME, decoder and CSP errors.
- Repeat after deleting app data and disabling network access.

### Failure cases and cautions

- Browser HTTP success does not establish custom-scheme WKWebView compatibility.

### Handoff requirement

Record tested implementation SHA, changed scope, acceptance evidence, commands/results, unrun checks, blockers and the next exact task. Use [the handoff template](../../templates/HANDOFF.md). Update state through the project CLI, regenerate views, and push the metadata checkpoint.

## P01-T03 — Verify the custom-origin security boundary

Dependencies: P01-T02

Manual gate: none; planning estimate: 1–3 focused sessions; planning estimate, not a delivery promise. Estimates are not deadlines or completion claims.

### Read first

- [docs/architecture/BRIDGE_PROTOCOL.md](../../docs/architecture/BRIDGE_PROTOCOL.md)
- [docs/quality/TEST_STRATEGY.md](../../docs/quality/TEST_STRATEGY.md)

### Owned scope

- `apps/ios/TinJunction/Web/`
- `tests/web/`
- `apps/ios/TinJunctionTests/`

### Deliverables

- Origin/path/size rejection fixtures
- Documented native resource allowlist

### Implementation sequence

1. Define allowed host, scheme, resource root and MIME mappings.
2. Reject dot segments, encoded traversal, unexpected hosts and unsupported methods.
3. Cancel outstanding scheme tasks without calling stopped callbacks.
4. Block remote navigation and arbitrary file access.
5. Fuzz malformed bridge and resource requests within bounded limits.
6. Document evidence that no private WebKit security overrides are used.

### Acceptance criteria

- **P01-T03-A1** — Traversal, unsupported origins, unknown resources and oversized messages fail safely without leaking files.
  - Accepted evidence: unit_test, integration_test.
- **P01-T03-A2** — Cancellation and repeated process teardown complete without crashes or callbacks into invalid tasks.
  - Accepted evidence: integration_test.

### Verification

- Run Swift resource-handler tests and packaged negative tests.
- Inspect shipped native configuration for private KVC or unrestricted navigation.

### Failure cases and cautions

- A permissive development host can accidentally become the production boundary.

### Handoff requirement

Record tested implementation SHA, changed scope, acceptance evidence, commands/results, unrun checks, blockers and the next exact task. Use [the handoff template](../../templates/HANDOFF.md). Update state through the project CLI, regenerate views, and push the metadata checkpoint.

## P01-T04 — Resolve approved Duo-only commercial distribution

Dependencies: P01-T01

Manual gate: owner; planning estimate: 1–3 focused sessions; planning estimate, not a delivery promise. Estimates are not deadlines or completion claims.

### Read first

- [docs/architecture/DUO_PLATFORM.md](../../docs/architecture/DUO_PLATFORM.md)
- [docs/operations/RELEASE_RUNBOOK.md](../../docs/operations/RELEASE_RUNBOOK.md)
- [docs/quality/RELEASE_GATES.md](../../docs/quality/RELEASE_GATES.md)

### Owned scope

- `docs/architecture/DUO_PLATFORM.md`
- `docs/decisions/`
- `evidence/`

### Deliverables

- Owner-approved documented distribution policy
- Release-blocker resolution or explicit stop decision

### Implementation sequence

1. Inspect Apple's current capability and distribution documentation.
2. Determine whether a supported capability or distribution route actually excludes non-Duo purchases.
3. Do not treat TARGETED_DEVICE_FAMILY or an in-app error screen as exclusivity.
4. Record official support guidance where public documentation is insufficient.
5. Present any unavoidable scope tradeoff to the owner.
6. Keep release blocked until the owner approves a documented route; do not broaden device scope automatically.

### Acceptance criteria

- **P01-T04-A1** — A documented Apple-supported route satisfies the owner's exclusive-device requirement, or the owner explicitly approves a revised policy.
  - Accepted evidence: source_verification, owner_approval.
- **P01-T04-A2** — The approved policy is reflected in release gates and cannot be bypassed by an undocumented capability key.
  - Accepted evidence: owner_approval.

### Verification

- Review supported-device eligibility through the approved distribution workflow.
- Verify unrelated engine tasks remain selectable while this gate is blocked.

### Failure cases and cautions

- This task can block release without blocking independent development.

### Handoff requirement

Record tested implementation SHA, changed scope, acceptance evidence, commands/results, unrun checks, blockers and the next exact task. Use [the handoff template](../../templates/HANDOFF.md). Update state through the project CLI, regenerate views, and push the metadata checkpoint.

## P01-T05 — Measure a representative packaged rendering spike

Dependencies: P01-T02

Manual gate: device; planning estimate: 1–3 focused sessions; planning estimate, not a delivery promise. Estimates are not deadlines or completion claims.

### Read first

- [docs/graphics/PERFORMANCE_BUDGETS.md](../../docs/graphics/PERFORMANCE_BUDGETS.md)
- [docs/graphics/RENDERING_SPEC.md](../../docs/graphics/RENDERING_SPEC.md)
- [docs/quality/TEST_STRATEGY.md](../../docs/quality/TEST_STRATEGY.md)

### Owned scope

- `web/src/diagnostics/`
- `apps/ios/TinJunction/Diagnostics/`
- `evidence/`

### Deliverables

- Representative performance probe
- Initial device baseline and benchmark conditions

### Implementation sequence

1. Create an original neutral scene approximating intended material and instance counts.
2. Record scene seed, render dimensions, assets, backend and quality settings.
3. Measure actual frame times and native/WebContent resource behavior.
4. Separate warm-up from steady-state and repeat after a fresh launch.
5. Run a sustained session on a physical Duo when access exists.
6. Use results to ratify or revise provisional budgets before hero-asset volume expands.

### Acceptance criteria

- **P01-T05-A1** — A physical Duo report records device/OS/build, sustained duration and frame-time percentiles under reproducible conditions.
  - Accepted evidence: device_test.
- **P01-T05-A2** — Budget revisions cite measurements and preserve visual targets rather than claiming theoretical hardware capacity.
  - Accepted evidence: device_test.

### Verification

- Run the documented performance capture sequence with fixed scene and camera.
- Record thermal state and limitations of any unavailable GPU timing counters.

### Failure cases and cautions

- Simulator throughput must not be used as the phone baseline.

### Handoff requirement

Record tested implementation SHA, changed scope, acceptance evidence, commands/results, unrun checks, blockers and the next exact task. Use [the handoff template](../../templates/HANDOFF.md). Update state through the project CLI, regenerate views, and push the metadata checkpoint.
