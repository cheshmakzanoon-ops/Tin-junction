# P04 — Deterministic simulation and physical scale

> Generated from planning/roadmap.json. Edit the JSON definition, then run `npm run project:render`.

## Outcome

Establish a renderer-independent physical-miniature model kernel with reproducible time and geometry conventions.

## Exit gate

Fixed-step simulation, stable identity, model-meter units and replay invariants pass headless tests.

The phase is not accepted merely because these instructions or its source files exist. Each task requires the stated evidence. Current progress lives in [the ledger](../state.json).

## P04-T01 — Ratify miniature units and coordinate conventions

Dependencies: P00-T04

Manual gate: none; planning estimate: 1–3 focused sessions; planning estimate, not a delivery promise. Estimates are not deadlines or completion claims.

### Read first

- [docs/architecture/SIMULATION_AND_TRACKS.md](../../docs/architecture/SIMULATION_AND_TRACKS.md)
- [docs/graphics/ART_DIRECTION.md](../../docs/graphics/ART_DIRECTION.md)
- [docs/architecture/SYSTEM_ARCHITECTURE.md](../../docs/architecture/SYSTEM_ARCHITECTURE.md)

### Owned scope

- `web/src/model/`
- `docs/decisions/`
- `tests/fixtures/model/`

### Deliverables

- Scale/units ADR
- Gauge and board calibration fixtures

### Implementation sequence

1. Use right-handed coordinates, Y up and XZ ground.
2. Adopt one world unit as one physical miniature meter.
3. Evaluate the proposed HO 1:87, 16.5 mm gauge and 0.8 by 0.5 m baseboard.
4. Define locomotive forward axis, wheel pivots and angle units.
5. Separate prototype-scale labels from simulation/render transforms.
6. Render and numerically check a ruler, gauge and known-radius fixture.

### Acceptance criteria

- **P04-T01-A1** — All geometry fixtures agree on units, axes and gauge within specified numeric tolerances.
  - Accepted evidence: unit_test.
- **P04-T01-A2** — The scale ADR records actual chosen dimensions without presenting them as device measurements.
  - Accepted evidence: repository_validation.

### Verification

- Round-trip asset/model transforms and compare known distances.
- Check gauge spacing and wheel circumference against the calibration fixture.

### Failure cases and cautions

- Implicit prototype-to-model scaling causes train motion and asset-size mismatches.

### Handoff requirement

Record tested implementation SHA, changed scope, acceptance evidence, commands/results, unrun checks, blockers and the next exact task. Use [the handoff template](../../templates/HANDOFF.md). Update state through the project CLI, regenerate views, and push the metadata checkpoint.

## P04-T02 — Implement a fixed-step clock and deterministic random source

Dependencies: P04-T01

Manual gate: none; planning estimate: 1–3 focused sessions; planning estimate, not a delivery promise. Estimates are not deadlines or completion claims.

### Read first

- [docs/architecture/SIMULATION_AND_TRACKS.md](../../docs/architecture/SIMULATION_AND_TRACKS.md)
- [docs/graphics/PERFORMANCE_BUDGETS.md](../../docs/graphics/PERFORMANCE_BUDGETS.md)

### Owned scope

- `web/src/simulation/`
- `tests/web/`

### Deliverables

- Fixed-step clock with bounded accumulator
- Seeded deterministic random utility

### Implementation sequence

1. Separate simulation ticks from renderer animation frames.
2. Choose and document the fixed tick interval and maximum catch-up work.
3. Define pause/resume and background elapsed-time policy.
4. Use seeded randomness only for reproducible simulation-affecting behavior.
5. Detect non-finite time inputs and timestamp reversals.
6. Compare identical command streams under different render frame schedules.

### Acceptance criteria

- **P04-T02-A1** — Equivalent command streams produce matching model state at the same tick across 30, 60 and variable render schedules.
  - Accepted evidence: unit_test.
- **P04-T02-A2** — Long suspension cannot cause unbounded catch-up or a visible train teleport.
  - Accepted evidence: unit_test.

### Verification

- Run clock tests including long gaps, negative deltas and repeated pause.
- Hash replay snapshots at fixed intervals.

### Failure cases and cautions

- A capped accumulator must have an explicit discarded-time policy.

### Handoff requirement

Record tested implementation SHA, changed scope, acceptance evidence, commands/results, unrun checks, blockers and the next exact task. Use [the handoff template](../../templates/HANDOFF.md). Update state through the project CLI, regenerate views, and push the metadata checkpoint.

## P04-T03 — Define entities, stable IDs and pure model boundaries

Dependencies: P04-T02

Manual gate: none; planning estimate: 1–3 focused sessions; planning estimate, not a delivery promise. Estimates are not deadlines or completion claims.

### Read first

- [docs/architecture/SIMULATION_AND_TRACKS.md](../../docs/architecture/SIMULATION_AND_TRACKS.md)
- [docs/architecture/PERSISTENCE_AND_EDITOR.md](../../docs/architecture/PERSISTENCE_AND_EDITOR.md)
- [docs/architecture/SYSTEM_ARCHITECTURE.md](../../docs/architecture/SYSTEM_ARCHITECTURE.md)

### Owned scope

- `web/src/model/`
- `web/src/simulation/`

### Deliverables

- Stable entity identifiers
- Renderer-free typed world model

### Implementation sequence

1. Define track, turnout, train, consist and scenery entities.
2. Keep references by ID rather than mutable object pointer graphs.
3. Separate immutable asset definitions from editable instance state.
4. Validate referential integrity and bounds at model creation.
5. Exclude renderer handles, native objects and functions from serialization.
6. Test clone, serialize and deserialize behavior.

### Acceptance criteria

- **P04-T03-A1** — The model can run and serialize in headless tests without WebGL, DOM or native APIs.
  - Accepted evidence: unit_test.
- **P04-T03-A2** — Duplicate IDs, missing references and invalid numeric state are rejected with actionable errors.
  - Accepted evidence: unit_test.

### Verification

- Instantiate and advance a minimal model without renderer imports.
- Round-trip a fixture and compare canonical state.

### Failure cases and cautions

- Mesh names are not stable document IDs.

### Handoff requirement

Record tested implementation SHA, changed scope, acceptance evidence, commands/results, unrun checks, blockers and the next exact task. Use [the handoff template](../../templates/HANDOFF.md). Update state through the project CLI, regenerate views, and push the metadata checkpoint.

## P04-T04 — Implement command transactions and replay log

Dependencies: P04-T03

Manual gate: none; planning estimate: 1–3 focused sessions; planning estimate, not a delivery promise. Estimates are not deadlines or completion claims.

### Read first

- [docs/architecture/SIMULATION_AND_TRACKS.md](../../docs/architecture/SIMULATION_AND_TRACKS.md)
- [docs/architecture/PERSISTENCE_AND_EDITOR.md](../../docs/architecture/PERSISTENCE_AND_EDITOR.md)

### Owned scope

- `web/src/commands/`
- `tests/fixtures/replay/`

### Deliverables

- Validated deterministic command reducer
- Replay fixtures and transaction boundaries

### Implementation sequence

1. Represent user actions as explicit typed commands.
2. Validate preconditions before mutating model state.
3. Apply a complete command atomically or reject it unchanged.
4. Assign monotonic sequence and transaction IDs.
5. Replay the same sequence from a known snapshot.
6. Define schema changes and invalid-command diagnostics.

### Acceptance criteria

- **P04-T04-A1** — Invalid commands cannot partially mutate a layout, and valid replay reproduces the expected canonical state.
  - Accepted evidence: unit_test.
- **P04-T04-A2** — Command ordering and transaction boundaries remain stable across save/load cycles.
  - Accepted evidence: unit_test.

### Verification

- Run replay fixtures with injected invalid and duplicate commands.
- Compare before/after state digests when rejection is expected.

### Failure cases and cautions

- Partial edit application makes later undo and persistence unreliable.

### Handoff requirement

Record tested implementation SHA, changed scope, acceptance evidence, commands/results, unrun checks, blockers and the next exact task. Use [the handoff template](../../templates/HANDOFF.md). Update state through the project CLI, regenerate views, and push the metadata checkpoint.

## P04-T05 — Install simulation invariants and debug observability

Dependencies: P04-T04

Manual gate: none; planning estimate: 1–3 focused sessions; planning estimate, not a delivery promise. Estimates are not deadlines or completion claims.

### Read first

- [docs/architecture/SIMULATION_AND_TRACKS.md](../../docs/architecture/SIMULATION_AND_TRACKS.md)
- [docs/quality/TEST_STRATEGY.md](../../docs/quality/TEST_STRATEGY.md)
- [docs/graphics/PERFORMANCE_BUDGETS.md](../../docs/graphics/PERFORMANCE_BUDGETS.md)

### Owned scope

- `web/src/simulation/`
- `web/src/diagnostics/`
- `tests/web/`

### Deliverables

- Invariant checker
- Deterministic long-run simulation tests

### Implementation sequence

1. Define bounds for speed, position, route indices and entity references.
2. Assert invariants after each transaction in debug builds.
3. Collect bounded per-tick diagnostics and replay seeds.
4. Keep production diagnostics lightweight and non-networked.
5. Run long headless sequences with repeatable generated commands.
6. Document how to minimize a failing replay.

### Acceptance criteria

- **P04-T05-A1** — Long seeded runs preserve every declared invariant and produce reproducible failure traces when deliberately corrupted.
  - Accepted evidence: unit_test.
- **P04-T05-A2** — Debug checks do not leak into release behavior as unbounded logs or expensive per-object tracing.
  - Accepted evidence: repository_validation.

### Verification

- Run multiple fixed seeds and replay the recorded failing seed fixture.
- Profile invariant overhead separately from production simulation.

### Failure cases and cautions

- Determinism claims need reproducible seeds and canonical serialization.

### Handoff requirement

Record tested implementation SHA, changed scope, acceptance evidence, commands/results, unrun checks, blockers and the next exact task. Use [the handoff template](../../templates/HANDOFF.md). Update state through the project CLI, regenerate views, and push the metadata checkpoint.
