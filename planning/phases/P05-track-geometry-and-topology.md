# P05 — Track geometry and connectivity

> Generated from planning/roadmap.json. Edit the JSON definition, then run `npm run project:render`.

## Outcome

Create physically consistent modular track and authoritative route topology.

## Exit gate

Supported track pieces connect with continuous position/tangent and correct gauge; invalid layouts fail before operation.

The phase is not accepted merely because these instructions or its source files exist. Each task requires the stated evidence. Current progress lives in [the ledger](../state.json).

## P05-T01 — Implement parametric track centerlines

Dependencies: P04-T05

Manual gate: none; planning estimate: 1–3 focused sessions; planning estimate, not a delivery promise. Estimates are not deadlines or completion claims.

### Read first

- [docs/architecture/SIMULATION_AND_TRACKS.md](../../docs/architecture/SIMULATION_AND_TRACKS.md)
- [docs/graphics/ART_DIRECTION.md](../../docs/graphics/ART_DIRECTION.md)

### Owned scope

- `web/src/track/`
- `tests/fixtures/track/`

### Deliverables

- Straight/arc centerline evaluators
- Arc-length sampling fixtures

### Implementation sequence

1. Represent supported pieces with explicit physical dimensions.
2. Evaluate position, tangent and curvature consistently.
3. Build monotonic arc-length lookup tables.
4. Handle endpoint and zero-length degeneracies.
5. Compare analytic straight/arc lengths with sampled values.

### Acceptance criteria

- **P05-T01-A1** — Supported centerlines meet documented position, tangent and length tolerances.
  - Accepted evidence: unit_test.
- **P05-T01-A2** — Degenerate and out-of-range inputs fail without NaN transforms.
  - Accepted evidence: unit_test.

### Verification

- Test straight, clockwise/counterclockwise arcs and endpoint samples.
- Verify length accuracy at minimum supported radius.

### Failure cases and cautions

- Uniform parameter sampling is not uniform speed.

### Handoff requirement

Record tested implementation SHA, changed scope, acceptance evidence, commands/results, unrun checks, blockers and the next exact task. Use [the handoff template](../../templates/HANDOFF.md). Update state through the project CLI, regenerate views, and push the metadata checkpoint.

## P05-T02 — Generate rails, sleepers and connector metadata

Dependencies: P05-T01, P04-T01

Manual gate: none; planning estimate: 1–3 focused sessions; planning estimate, not a delivery promise. Estimates are not deadlines or completion claims.

### Read first

- [docs/architecture/SIMULATION_AND_TRACKS.md](../../docs/architecture/SIMULATION_AND_TRACKS.md)
- [docs/graphics/ASSET_PIPELINE.md](../../docs/graphics/ASSET_PIPELINE.md)

### Owned scope

- `web/src/track/`
- `tests/fixtures/track/`

### Deliverables

- Gauge-correct track geometry
- Stable connector/socket specification

### Implementation sequence

1. Offset rail paths using a stable local frame.
2. Place sleepers by physical distance, not segment count.
3. Define connector position, direction, gauge and grade.
4. Keep rendering geometry separate from route topology.
5. Validate geometry through curves and module joints.

### Acceptance criteria

- **P05-T02-A1** — Rail spacing and connector frames remain correct across supported pieces.
  - Accepted evidence: unit_test.
- **P05-T02-A2** — Reference captures show no gaps, reversed normals or intersecting rails at standard joints.
  - Accepted evidence: visual_review.

### Verification

- Check connector transform round trips.
- Capture close-ups of straight-to-curve and curve-to-curve joints.

### Failure cases and cautions

- Render joins must not hide topological disconnections.

### Handoff requirement

Record tested implementation SHA, changed scope, acceptance evidence, commands/results, unrun checks, blockers and the next exact task. Use [the handoff template](../../templates/HANDOFF.md). Update state through the project CLI, regenerate views, and push the metadata checkpoint.

## P05-T03 — Build the route graph and connection validator

Dependencies: P05-T02

Manual gate: none; planning estimate: 1–3 focused sessions; planning estimate, not a delivery promise. Estimates are not deadlines or completion claims.

### Read first

- [docs/architecture/SIMULATION_AND_TRACKS.md](../../docs/architecture/SIMULATION_AND_TRACKS.md)
- [docs/architecture/PERSISTENCE_AND_EDITOR.md](../../docs/architecture/PERSISTENCE_AND_EDITOR.md)

### Owned scope

- `web/src/track/`
- `web/src/model/`

### Deliverables

- Directed route graph
- Connectivity and invalid-placement diagnostics

### Implementation sequence

1. Connect compatible sockets within explicit tolerances.
2. Preserve direction and route segment identity.
3. Detect disconnected ends and illegal overlapping connections.
4. Validate graph mutations atomically.
5. Traverse loops without infinite recursion.

### Acceptance criteria

- **P05-T03-A1** — Valid circuits traverse indefinitely without losing route identity.
  - Accepted evidence: unit_test.
- **P05-T03-A2** — Mismatched gauge, endpoint tolerance and duplicate connections are rejected unchanged.
  - Accepted evidence: unit_test.

### Verification

- Run loop, branch, disconnected and malformed graph fixtures.
- Generate random valid edits and recheck referential integrity.

### Failure cases and cautions

- A visually adjacent track is not necessarily connected.

### Handoff requirement

Record tested implementation SHA, changed scope, acceptance evidence, commands/results, unrun checks, blockers and the next exact task. Use [the handoff template](../../templates/HANDOFF.md). Update state through the project CLI, regenerate views, and push the metadata checkpoint.

## P05-T04 — Implement turnout routing and occupancy locks

Dependencies: P05-T03

Manual gate: none; planning estimate: 1–3 focused sessions; planning estimate, not a delivery promise. Estimates are not deadlines or completion claims.

### Read first

- [docs/architecture/SIMULATION_AND_TRACKS.md](../../docs/architecture/SIMULATION_AND_TRACKS.md)
- [docs/product/INTERACTION_DESIGN.md](../../docs/product/INTERACTION_DESIGN.md)

### Owned scope

- `web/src/track/`
- `web/src/simulation/`

### Deliverables

- Turnout topology and route states
- Occupancy-aware switching behavior

### Implementation sequence

1. Model stock, straight and diverging routes explicitly.
2. Define switch states independently of decorative animation.
3. Track occupied route intervals for entire consists.
4. Reject or defer unsafe switching while occupied.
5. Preserve selected route through serialization and reversal.

### Acceptance criteria

- **P05-T04-A1** — A train cannot teleport between turnout routes or switch beneath an occupying consist.
  - Accepted evidence: unit_test, integration_test.
- **P05-T04-A2** — Invalid switching gives deterministic feedback and leaves topology unchanged.
  - Accepted evidence: unit_test.

### Verification

- Traverse both routes in both directions.
- Request switching while front, middle and rear vehicles occupy the turnout.

### Failure cases and cautions

- Locomotive-only occupancy misses trailing carriages.

### Handoff requirement

Record tested implementation SHA, changed scope, acceptance evidence, commands/results, unrun checks, blockers and the next exact task. Use [the handoff template](../../templates/HANDOFF.md). Update state through the project CLI, regenerate views, and push the metadata checkpoint.

## P05-T05 — Validate grades, clearance and unsupported layouts

Dependencies: P05-T03, P05-T04

Manual gate: none; planning estimate: 1–3 focused sessions; planning estimate, not a delivery promise. Estimates are not deadlines or completion claims.

### Read first

- [docs/architecture/SIMULATION_AND_TRACKS.md](../../docs/architecture/SIMULATION_AND_TRACKS.md)
- [docs/product/PRODUCT_SPEC.md](../../docs/product/PRODUCT_SPEC.md)

### Owned scope

- `web/src/track/`
- `web/src/editor/`

### Deliverables

- Clearance and placement validator
- Explicit supported-geometry limits

### Implementation sequence

1. Define initial supported grades and crossing rules.
2. Compute conservative swept clearance envelopes.
3. Detect intersections without valid bridge clearance.
4. Explain invalid placements with stable error categories.
5. Keep unsupported flexible track and complex crossings out of v1.

### Acceptance criteria

- **P05-T05-A1** — Unsafe overlaps, excessive grades and unsupported joins are rejected before train placement.
  - Accepted evidence: unit_test.
- **P05-T05-A2** — Validation messages identify the conflicting pieces without forcing puzzle-style completion rules.
  - Accepted evidence: integration_test.

### Verification

- Test minimum-radius, grade-boundary and bridge-clearance fixtures.
- Check incomplete layouts remain editable even when not runnable.

### Failure cases and cautions

- Editing freedom must coexist with safe operation constraints.

### Handoff requirement

Record tested implementation SHA, changed scope, acceptance evidence, commands/results, unrun checks, blockers and the next exact task. Use [the handoff template](../../templates/HANDOFF.md). Update state through the project CLI, regenerate views, and push the metadata checkpoint.
