# P20 — Duo-native folding case experience

> Generated from planning/roadmap.json. Edit the JSON definition, then run `npm run project:render`.

## Outcome

Make the physical fold meaningfully shape presentation while preserving simulation and user work.

## Exit gate

Actual Duo posture, resizing and display transitions feel deliberate and never bend or corrupt the track model.

The phase is not accepted merely because these instructions or its source files exist. Each task requires the stated evidence. Current progress lives in [the ledger](../state.json).

## P20-T01 — Integrate official arrangement and reserved-region observations

Dependencies: P03-T03, P08-T03, P01-T01

Manual gate: none; planning estimate: 1–3 focused sessions; planning estimate, not a delivery promise. Estimates are not deadlines or completion claims.

### Read first

- [docs/architecture/DUO_PLATFORM.md](../../docs/architecture/DUO_PLATFORM.md)
- [docs/product/INTERACTION_DESIGN.md](../../docs/product/INTERACTION_DESIGN.md)
- [docs/architecture/BRIDGE_PROTOCOL.md](../../docs/architecture/BRIDGE_PROTOCOL.md)

### Owned scope

- `apps/ios/TinJunction/Platform/`
- `apps/ios/TinJunction/Controls/`

### Deliverables

- Native posture/layout adapter
- Geometry fixture recordings

### Implementation sequence

1. Use documented geometry/arrangement APIs for layout.
2. Keep hinge-angle observations limited to effects.
3. Observe safe areas and reserved regions during resizing.
4. Distinguish actual native events from injected debug fixtures.
5. Record representative geometry changes for regression.

### Acceptance criteria

- **P20-T01-A1** — Native observations produce correct logical viewport and reserved-region messages without hardcoded device dimensions.
  - Accepted evidence: integration_test.
- **P20-T01-A2** — Synthetic posture injection is visibly test-only and excluded from production control paths.
  - Accepted evidence: repository_validation.

### Verification

- Record open, partial, rotated and split-view geometries in the simulator.
- Check every conversion against shared viewport fixtures.

### Failure cases and cautions

- An angle-derived layout can disagree with system-managed window geometry.

### Handoff requirement

Record tested implementation SHA, changed scope, acceptance evidence, commands/results, unrun checks, blockers and the next exact task. Use [the handoff template](../../templates/HANDOFF.md). Update state through the project CLI, regenerate views, and push the metadata checkpoint.

## P20-T02 — Design and implement the case-opening presentation

Dependencies: P20-T01, P14-T01, P16-T03

Manual gate: none; planning estimate: 1–3 focused sessions; planning estimate, not a delivery promise. Estimates are not deadlines or completion claims.

### Read first

- [docs/product/INTERACTION_DESIGN.md](../../docs/product/INTERACTION_DESIGN.md)
- [docs/graphics/ART_DIRECTION.md](../../docs/graphics/ART_DIRECTION.md)
- [docs/architecture/SIMULATION_AND_TRACKS.md](../../docs/architecture/SIMULATION_AND_TRACKS.md)

### Owned scope

- `web/src/presentation/`
- `apps/ios/TinJunction/Platform/`

### Deliverables

- Fold-aware presentation state machine
- Coherent case opening/closing effect

### Implementation sequence

1. Map fully open and partial postures to approved viewport arrangements.
2. Treat the miniature case as presentation, not deformable simulation topology.
3. Prevent trains crossing a visibly disconnected fake hinge.
4. Keep upper/lower regions coherent as controls or scene backdrop.
5. Provide reduced-motion and interrupted-animation behavior.

### Acceptance criteria

- **P20-T02-A1** — Folding changes presentation only; track graph, route distance and document identity remain invariant.
  - Accepted evidence: unit_test, integration_test.
- **P20-T02-A2** — Case animation is visually coherent and never clips essential controls or implies impossible track motion.
  - Accepted evidence: visual_review.

### Verification

- Compare model hashes before/after rapid posture sequences.
- Interrupt opening animations with app deactivation and rotation.

### Failure cases and cautions

- A visually clever fold effect can contradict the railway's physical logic.

### Handoff requirement

Record tested implementation SHA, changed scope, acceptance evidence, commands/results, unrun checks, blockers and the next exact task. Use [the handoff template](../../templates/HANDOFF.md). Update state through the project CLI, regenerate views, and push the metadata checkpoint.

## P20-T03 — Handle closed/outer-display and multitasking transitions

Dependencies: P20-T02, P07-T05, P02-T02

Manual gate: none; planning estimate: 1–3 focused sessions; planning estimate, not a delivery promise. Estimates are not deadlines or completion claims.

### Read first

- [docs/architecture/DUO_PLATFORM.md](../../docs/architecture/DUO_PLATFORM.md)
- [docs/architecture/PERSISTENCE_AND_EDITOR.md](../../docs/architecture/PERSISTENCE_AND_EDITOR.md)
- [docs/product/INTERACTION_DESIGN.md](../../docs/product/INTERACTION_DESIGN.md)

### Owned scope

- `apps/ios/TinJunction/App/`
- `web/src/presentation/`

### Deliverables

- Same-device display-transition policy
- Safe pause/checkpoint behavior

### Implementation sequence

1. Define supported outer-display behavior without promising a second consumer platform.
2. Pause or adapt presentation without losing layout ownership.
3. Checkpoint at safe native lifecycle boundaries.
4. Handle split-view size changes and unavailable scene actions.
5. Recover after closing/reopening during editing or saving.

### Acceptance criteria

- **P20-T03-A1** — Display transitions preserve the last acknowledged layout and do not create competing simulation sessions.
  - Accepted evidence: integration_test.
- **P20-T03-A2** — Essential controls remain accessible in every supported geometry or a clear native state explains the limitation.
  - Accepted evidence: integration_test.

### Verification

- Exercise close/reopen while dragging, saving and operating.
- Repeat during split-view and device rotation.

### Failure cases and cautions

- Closing the hinge does not necessarily equal terminating the app.

### Handoff requirement

Record tested implementation SHA, changed scope, acceptance evidence, commands/results, unrun checks, blockers and the next exact task. Use [the handoff template](../../templates/HANDOFF.md). Update state through the project CLI, regenerate views, and push the metadata checkpoint.

## P20-T04 — Approve real-device fold ergonomics and continuity

Dependencies: P20-T03, P08-T04

Manual gate: device; planning estimate: 1–3 focused sessions; planning estimate, not a delivery promise. Estimates are not deadlines or completion claims.

### Read first

- [docs/quality/TEST_STRATEGY.md](../../docs/quality/TEST_STRATEGY.md)
- [docs/architecture/DUO_PLATFORM.md](../../docs/architecture/DUO_PLATFORM.md)
- [docs/quality/RELEASE_GATES.md](../../docs/quality/RELEASE_GATES.md)

### Owned scope

- `evidence/`

### Deliverables

- Physical Duo fold acceptance
- Resolved posture defect list

### Implementation sequence

1. Run repeated real fold cycles across supported postures.
2. Check touch occlusion, reachability and scene continuity.
3. Test slow/fast opening and pauses near transition boundaries.
4. Inspect audio, haptic and save behavior during transitions.
5. Record device, OS, build and observed limitations.

### Acceptance criteria

- **P20-T04-A1** — Physical Duo testing confirms coherent folding interaction without lost edits, broken picking or simulation discontinuity.
  - Accepted evidence: device_test.
- **P20-T04-A2** — All supported posture states have evidence and remaining failures block release.
  - Accepted evidence: device_test.

### Verification

- Execute the full posture matrix with final scene content.
- Compare results with synthetic CI coverage to document gaps.

### Failure cases and cautions

- Simulator geometry tests do not validate the physical folding experience.

### Handoff requirement

Record tested implementation SHA, changed scope, acceptance evidence, commands/results, unrun checks, blockers and the next exact task. Use [the handoff template](../../templates/HANDOFF.md). Update state through the project CLI, regenerate views, and push the metadata checkpoint.
