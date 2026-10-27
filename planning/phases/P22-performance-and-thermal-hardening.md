# P22 — Physical-device performance and thermal hardening

> Generated from planning/roadmap.json. Edit the JSON definition, then run `npm run project:render`.

## Outcome

Ratify sustained quality on real Duo hardware with repeatable workloads and explicit fallback policy.

## Exit gate

Shipping quality survives sustained interaction, thermal pressure and repeated layout changes on the supported hardware.

The phase is not accepted merely because these instructions or its source files exist. Each task requires the stated evidence. Current progress lives in [the ledger](../state.json).

## P22-T01 — Create representative benchmark workloads and telemetry

Dependencies: P16-T04, P18-T04, P19-T04, P21-T04

Manual gate: none; planning estimate: 1–3 focused sessions; planning estimate, not a delivery promise. Estimates are not deadlines or completion claims.

### Read first

- [docs/graphics/PERFORMANCE_BUDGETS.md](../../docs/graphics/PERFORMANCE_BUDGETS.md)
- [docs/graphics/RENDERING_SPEC.md](../../docs/graphics/RENDERING_SPEC.md)
- [docs/quality/TEST_STRATEGY.md](../../docs/quality/TEST_STRATEGY.md)

### Owned scope

- `web/src/diagnostics/`
- `assets/layouts/benchmarks/`
- `tools/performance/`

### Deliverables

- Versioned workload suite
- Bounded local frame/resource telemetry

### Implementation sequence

1. Define normal, dense, macro, night and enabled-weather workloads.
2. Record seeds, camera paths, asset hashes and quality settings.
3. Measure median/p95/p99 frame time and long stalls.
4. Track render/shadow calls and resource accounting separately.
5. Keep instrumentation removable and disclose unavailable GPU counters.

### Acceptance criteria

- **P22-T01-A1** — Benchmark runs are reproducible from a named manifest and produce bounded machine-readable reports.
  - Accepted evidence: unit_test, integration_test.
- **P22-T01-A2** — Reports distinguish frame timing, estimated GPU resources and native process memory.
  - Accepted evidence: repository_validation.

### Verification

- Repeat benchmark inputs and compare scene/state hashes.
- Validate telemetry counters against a known simple scene.

### Failure cases and cautions

- Average FPS conceals harmful long-tail stalls.

### Handoff requirement

Record tested implementation SHA, changed scope, acceptance evidence, commands/results, unrun checks, blockers and the next exact task. Use [the handoff template](../../templates/HANDOFF.md). Update state through the project CLI, regenerate views, and push the metadata checkpoint.

## P22-T02 — Establish real Duo sustained-performance baselines

Dependencies: P22-T01, P01-T05

Manual gate: device; planning estimate: 1–3 focused sessions; planning estimate, not a delivery promise. Estimates are not deadlines or completion claims.

### Read first

- [docs/graphics/PERFORMANCE_BUDGETS.md](../../docs/graphics/PERFORMANCE_BUDGETS.md)
- [docs/quality/TEST_STRATEGY.md](../../docs/quality/TEST_STRATEGY.md)
- [docs/quality/RELEASE_GATES.md](../../docs/quality/RELEASE_GATES.md)

### Owned scope

- `evidence/`

### Deliverables

- Physical-device benchmark reports
- Ratified shipping budgets

### Implementation sequence

1. Record device/OS/build, ambient and power conditions.
2. Separate warm-up from sustained measurement.
3. Run the full workload suite on physical Duo.
4. Record thermal changes and process memory with appropriate tooling.
5. Ratify budget values or identify specific failing workloads.

### Acceptance criteria

- **P22-T02-A1** — Physical-device evidence reports sustained frame percentiles, stalls, memory and thermal conditions for every release workload.
  - Accepted evidence: device_test.
- **P22-T02-A2** — Approved budgets are grounded in observations rather than simulator numbers or advertised hardware specifications.
  - Accepted evidence: device_test.

### Verification

- Repeat key workloads under comparable conditions.
- Attach raw report artifacts and summarize variance.

### Failure cases and cautions

- One short cold-device run is not sustained performance proof.

### Handoff requirement

Record tested implementation SHA, changed scope, acceptance evidence, commands/results, unrun checks, blockers and the next exact task. Use [the handoff template](../../templates/HANDOFF.md). Update state through the project CLI, regenerate views, and push the metadata checkpoint.

## P22-T03 — Optimize bottlenecks and quality adaptation

Dependencies: P22-T02

Manual gate: none; planning estimate: 1–3 focused sessions; planning estimate, not a delivery promise. Estimates are not deadlines or completion claims.

### Read first

- [docs/graphics/PERFORMANCE_BUDGETS.md](../../docs/graphics/PERFORMANCE_BUDGETS.md)
- [docs/graphics/RENDERING_SPEC.md](../../docs/graphics/RENDERING_SPEC.md)
- [docs/graphics/ASSET_PIPELINE.md](../../docs/graphics/ASSET_PIPELINE.md)

### Owned scope

- `web/src/rendering/`
- `web/src/assets/`
- `web/src/simulation/`

### Deliverables

- Measured optimization changes
- Stable quality policy

### Implementation sequence

1. Identify CPU, GPU, overdraw, loading or memory bottlenecks individually.
2. Optimize the measured dominant issue before broad rewrites.
3. Tune instancing, culling, LOD, texture and render-area policies.
4. Use hysteresis and minimum dwell time for adaptation.
5. Compare appearance and performance before accepting each optimization.

### Acceptance criteria

- **P22-T03-A1** — Optimizations improve the documented bottleneck without violating simulation correctness or visual acceptance.
  - Accepted evidence: integration_test, visual_review.
- **P22-T03-A2** — Quality transitions do not oscillate, break picking or silently enable unavailable effects.
  - Accepted evidence: unit_test, integration_test.

### Verification

- Re-run the failing workload and regression capture suite.
- Report tradeoffs rather than only the best-case FPS gain.

### Failure cases and cautions

- Unmeasured optimization can reduce quality without solving the bottleneck.

### Handoff requirement

Record tested implementation SHA, changed scope, acceptance evidence, commands/results, unrun checks, blockers and the next exact task. Use [the handoff template](../../templates/HANDOFF.md). Update state through the project CLI, regenerate views, and push the metadata checkpoint.

## P22-T04 — Pass thermal, battery and memory soak gates

Dependencies: P22-T03, P20-T04, P17-T04

Manual gate: device; planning estimate: 1–3 focused sessions; planning estimate, not a delivery promise. Estimates are not deadlines or completion claims.

### Read first

- [docs/graphics/PERFORMANCE_BUDGETS.md](../../docs/graphics/PERFORMANCE_BUDGETS.md)
- [docs/quality/TEST_STRATEGY.md](../../docs/quality/TEST_STRATEGY.md)
- [docs/quality/RELEASE_GATES.md](../../docs/quality/RELEASE_GATES.md)

### Owned scope

- `evidence/`

### Deliverables

- Final sustained device soak
- Resolved performance release blockers

### Implementation sequence

1. Run the specified long-duration operating/editing workload.
2. Exercise repeated layout replacement and fold transitions.
3. Record thermal response and battery/power observations.
4. Check memory growth after stabilization and repeated recovery.
5. Re-run visual captures at the actual shipping quality tier.

### Acceptance criteria

- **P22-T04-A1** — Physical Duo soak meets ratified sustained frame/memory targets without thermal failure or uncontrolled resource growth.
  - Accepted evidence: device_test.
- **P22-T04-A2** — The quality tier used to pass performance still passes the approved visual rubric.
  - Accepted evidence: device_test, visual_review.

### Verification

- Run the full soak procedure with exact conditions recorded.
- Inspect post-soak save/relaunch correctness.

### Failure cases and cautions

- A lower-quality benchmark cannot validate a higher-quality release configuration.

### Handoff requirement

Record tested implementation SHA, changed scope, acceptance evidence, commands/results, unrun checks, blockers and the next exact task. Use [the handoff template](../../templates/HANDOFF.md). Update state through the project CLI, regenerate views, and push the metadata checkpoint.
