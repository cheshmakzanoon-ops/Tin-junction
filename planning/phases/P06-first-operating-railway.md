# P06 — First operating railway

> Generated from planning/roadmap.json. Edit the JSON definition, then run `npm run project:render`.

## Outcome

Operate a controllable miniature train on validated routes before final art expansion.

## Exit gate

A functional vertical slice runs forwards/reverse through loops and turnouts with stable rolling-stock placement.

The phase is not accepted merely because these instructions or its source files exist. Each task requires the stated evidence. Current progress lives in [the ledger](../state.json).

## P06-T01 — Implement distance-based train motion

Dependencies: P05-T04, P04-T05

Manual gate: none; planning estimate: 1–3 focused sessions; planning estimate, not a delivery promise. Estimates are not deadlines or completion claims.

### Read first

- [docs/architecture/SIMULATION_AND_TRACKS.md](../../docs/architecture/SIMULATION_AND_TRACKS.md)
- [docs/graphics/PERFORMANCE_BUDGETS.md](../../docs/graphics/PERFORMANCE_BUDGETS.md)

### Owned scope

- `web/src/simulation/`
- `web/src/model/`

### Deliverables

- Throttle/brake/reverse model
- Arc-distance route traversal

### Implementation sequence

1. Define bounded speed, acceleration and braking curves.
2. Integrate distance using the fixed simulation tick.
3. Cross route boundaries without position discontinuities.
4. Require a safe stop before direction reversal.
5. Handle track-end and removed-route conditions explicitly.

### Acceptance criteria

- **P06-T01-A1** — Motion remains continuous through joins and independent of render FPS.
  - Accepted evidence: unit_test.
- **P06-T01-A2** — Stop, reverse and track-end behavior are deterministic and cannot leave invalid route indices.
  - Accepted evidence: unit_test.

### Verification

- Replay identical throttle commands under varied render schedules.
- Run a long-duration loop with periodic reversals.

### Failure cases and cautions

- Route transitions must preserve excess traveled distance.

### Handoff requirement

Record tested implementation SHA, changed scope, acceptance evidence, commands/results, unrun checks, blockers and the next exact task. Use [the handoff template](../../templates/HANDOFF.md). Update state through the project CLI, regenerate views, and push the metadata checkpoint.

## P06-T02 — Place bogies, wheels and a small consist

Dependencies: P06-T01

Manual gate: none; planning estimate: 1–3 focused sessions; planning estimate, not a delivery promise. Estimates are not deadlines or completion claims.

### Read first

- [docs/architecture/SIMULATION_AND_TRACKS.md](../../docs/architecture/SIMULATION_AND_TRACKS.md)
- [docs/graphics/ART_DIRECTION.md](../../docs/graphics/ART_DIRECTION.md)

### Owned scope

- `web/src/simulation/`
- `web/src/rendering/`

### Deliverables

- Route-history based vehicle placement
- Distance-driven wheel animation

### Implementation sequence

1. Resolve front/rear bogies by arc distance.
2. Maintain route history across turnouts and reversal.
3. Place carriage bodies from bogie frames.
4. Drive wheel rotation from actual traveled distance.
5. Clamp or reject unsupported consist/radius combinations.

### Acceptance criteria

- **P06-T02-A1** — Bogie/wheel positions follow rails through supported curves and switches without visible floating.
  - Accepted evidence: unit_test, visual_review.
- **P06-T02-A2** — Trailing vehicles preserve the selected route after the locomotive leaves a turnout.
  - Accepted evidence: unit_test.

### Verification

- Capture minimum-radius curves, turnout passage and reversal.
- Compare wheel phase with distance divided by circumference.

### Failure cases and cautions

- Rigid body rotation at a single point can derail visual bogies.

### Handoff requirement

Record tested implementation SHA, changed scope, acceptance evidence, commands/results, unrun checks, blockers and the next exact task. Use [the handoff template](../../templates/HANDOFF.md). Update state through the project CLI, regenerate views, and push the metadata checkpoint.

## P06-T03 — Add operating controls and railroad interactions

Dependencies: P06-T02, P02-T03, P03-T03

Manual gate: none; planning estimate: 1–3 focused sessions; planning estimate, not a delivery promise. Estimates are not deadlines or completion claims.

### Read first

- [docs/product/INTERACTION_DESIGN.md](../../docs/product/INTERACTION_DESIGN.md)
- [docs/architecture/SIMULATION_AND_TRACKS.md](../../docs/architecture/SIMULATION_AND_TRACKS.md)

### Owned scope

- `web/src/input/`
- `apps/ios/TinJunction/Controls/`

### Deliverables

- Accessible throttle and direction controls
- Signals, turnout and stop interactions

### Implementation sequence

1. Map controls to validated model commands.
2. Provide large emergency-stop and speed feedback.
3. Make turnout selection visible without relying on color.
4. Separate control gestures from camera gestures.
5. Add stationary and moving control-state tests.

### Acceptance criteria

- **P06-T03-A1** — Every operating control changes the intended model command and provides understandable feedback.
  - Accepted evidence: integration_test.
- **P06-T03-A2** — Stop remains reachable during camera movement, resizing and error recovery.
  - Accepted evidence: integration_test.

### Verification

- Run native/WebView interaction smoke tests.
- Exercise control commands during viewport transitions.

### Failure cases and cautions

- Decorative controls must not become inaccessible canvas-only targets.

### Handoff requirement

Record tested implementation SHA, changed scope, acceptance evidence, commands/results, unrun checks, blockers and the next exact task. Use [the handoff template](../../templates/HANDOFF.md). Update state through the project CLI, regenerate views, and push the metadata checkpoint.

## P06-T04 — Approve the functional vertical slice

Dependencies: P06-T03, P03-T05

Manual gate: none; planning estimate: 1–3 focused sessions; planning estimate, not a delivery promise. Estimates are not deadlines or completion claims.

### Read first

- [docs/quality/TEST_STRATEGY.md](../../docs/quality/TEST_STRATEGY.md)
- [docs/product/PRODUCT_SPEC.md](../../docs/product/PRODUCT_SPEC.md)
- [docs/graphics/VISUAL_ACCEPTANCE.md](../../docs/graphics/VISUAL_ACCEPTANCE.md)

### Owned scope

- `tests/fixtures/vertical-slice/`
- `evidence/`

### Deliverables

- One reproducible operating layout
- Functional slice acceptance report

### Implementation sequence

1. Assemble an original oval, turnout and short siding.
2. Run throttle, braking, reverse and safe switching.
3. Exercise pause/resume and host recovery.
4. Capture a continuous interaction video and diagnostic trace.
5. Record unresolved visual work as unfinished, not accepted photorealism.

### Acceptance criteria

- **P06-T04-A1** — The representative layout operates through the documented command sequence without simulation or bridge errors.
  - Accepted evidence: integration_test.
- **P06-T04-A2** — The evidence identifies placeholder art and does not conflate functional success with final appearance.
  - Accepted evidence: repository_validation.

### Verification

- Repeat the full slice sequence after clean app launch.
- Compare final model state with the expected replay snapshot.

### Failure cases and cautions

- A flattering static shot does not prove an operating railway.

### Handoff requirement

Record tested implementation SHA, changed scope, acceptance evidence, commands/results, unrun checks, blockers and the next exact task. Use [the handoff template](../../templates/HANDOFF.md). Update state through the project CLI, regenerate views, and push the metadata checkpoint.
