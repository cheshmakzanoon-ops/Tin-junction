# P08 — Camera, picking and gesture arbitration

> Generated from planning/roadmap.json. Edit the JSON definition, then run `npm run project:render`.

## Outcome

Make a miniature world comfortable to inspect and edit on actual Duo geometry.

## Exit gate

Camera, selection and controls behave predictably across scale, occlusion, rotation and posture changes.

The phase is not accepted merely because these instructions or its source files exist. Each task requires the stated evidence. Current progress lives in [the ledger](../state.json).

## P08-T01 — Build a constrained miniature-view camera

Dependencies: P06-T04, P03-T03

Manual gate: none; planning estimate: 1–3 focused sessions; planning estimate, not a delivery promise. Estimates are not deadlines or completion claims.

### Read first

- [docs/product/INTERACTION_DESIGN.md](../../docs/product/INTERACTION_DESIGN.md)
- [docs/graphics/RENDERING_SPEC.md](../../docs/graphics/RENDERING_SPEC.md)
- [docs/graphics/ART_DIRECTION.md](../../docs/graphics/ART_DIRECTION.md)

### Owned scope

- `web/src/camera/`
- `tests/web/`

### Deliverables

- Orbit/pan/zoom controller
- Documented camera constraints

### Implementation sequence

1. Choose a believable tabletop perspective and target.
2. Limit orbit and zoom to protect interaction clarity.
3. Avoid clipping through case walls or terrain.
4. Keep camera state independent of world simulation.
5. Interpolate transitions with reduce-motion support.

### Acceptance criteria

- **P08-T01-A1** — Camera paths remain finite and cannot enter forbidden geometry under supported gestures.
  - Accepted evidence: unit_test.
- **P08-T01-A2** — Macro and overview views preserve model scale and useful editing visibility.
  - Accepted evidence: visual_review.

### Verification

- Replay gesture sequences near every camera bound.
- Capture overview, rail-height and maximum-zoom views.

### Failure cases and cautions

- Excessively shallow depth of field can hide the object being edited.

### Handoff requirement

Record tested implementation SHA, changed scope, acceptance evidence, commands/results, unrun checks, blockers and the next exact task. Use [the handoff template](../../templates/HANDOFF.md). Update state through the project CLI, regenerate views, and push the metadata checkpoint.

## P08-T02 — Implement stable picking and selection

Dependencies: P08-T01, P05-T03

Manual gate: none; planning estimate: 1–3 focused sessions; planning estimate, not a delivery promise. Estimates are not deadlines or completion claims.

### Read first

- [docs/product/INTERACTION_DESIGN.md](../../docs/product/INTERACTION_DESIGN.md)
- [docs/architecture/SIMULATION_AND_TRACKS.md](../../docs/architecture/SIMULATION_AND_TRACKS.md)
- [docs/architecture/DUO_PLATFORM.md](../../docs/architecture/DUO_PLATFORM.md)

### Owned scope

- `web/src/input/`
- `web/src/selection/`

### Deliverables

- ID-based picking layer
- Accessible selection state

### Implementation sequence

1. Convert native viewport points into canvas coordinates.
2. Raycast only relevant interactive layers.
3. Resolve hits to stable model IDs.
4. Define occlusion, selection priority and empty-space behavior.
5. Highlight selection without altering source materials permanently.

### Acceptance criteria

- **P08-T02-A1** — Picking remains correct after resize, camera motion and reserved-region changes.
  - Accepted evidence: unit_test, integration_test.
- **P08-T02-A2** — Selection references never survive deletion as invalid IDs or leaked highlights.
  - Accepted evidence: unit_test.

### Verification

- Test coordinate conversions with synthetic safe-area/region fixtures.
- Select overlapping track and scenery at multiple zoom levels.

### Failure cases and cautions

- Device-pixel and logical-point confusion causes offset taps.

### Handoff requirement

Record tested implementation SHA, changed scope, acceptance evidence, commands/results, unrun checks, blockers and the next exact task. Use [the handoff template](../../templates/HANDOFF.md). Update state through the project CLI, regenerate views, and push the metadata checkpoint.

## P08-T03 — Arbitrate operating, camera and editing gestures

Dependencies: P08-T02

Manual gate: none; planning estimate: 1–3 focused sessions; planning estimate, not a delivery promise. Estimates are not deadlines or completion claims.

### Read first

- [docs/product/INTERACTION_DESIGN.md](../../docs/product/INTERACTION_DESIGN.md)
- [docs/architecture/PERSISTENCE_AND_EDITOR.md](../../docs/architecture/PERSISTENCE_AND_EDITOR.md)

### Owned scope

- `web/src/input/`
- `apps/ios/TinJunction/Controls/`

### Deliverables

- Explicit gesture state machine
- Cancel/interrupt behavior

### Implementation sequence

1. Separate tap, drag, pan, pinch and long-press thresholds.
2. Assign one owner to each active pointer sequence.
3. Cancel safely on app deactivation and viewport replacement.
4. Prevent accidental edits while operating the train.
5. Provide native alternatives to difficult multi-touch actions.

### Acceptance criteria

- **P08-T03-A1** — A gesture can never both edit an object and orbit the camera.
  - Accepted evidence: unit_test, integration_test.
- **P08-T03-A2** — Interrupted gestures leave a valid model and a recoverable undo boundary.
  - Accepted evidence: integration_test.

### Verification

- Run pointer-sequence fixtures including multi-touch cancellation.
- Exercise foreground loss during every gesture state.

### Failure cases and cautions

- Heuristic gesture overlap can produce rare destructive edits.

### Handoff requirement

Record tested implementation SHA, changed scope, acceptance evidence, commands/results, unrun checks, blockers and the next exact task. Use [the handoff template](../../templates/HANDOFF.md). Update state through the project CLI, regenerate views, and push the metadata checkpoint.

## P08-T04 — Validate interaction ergonomics on physical Duo

Dependencies: P08-T03, P02-T03

Manual gate: device; planning estimate: 1–3 focused sessions; planning estimate, not a delivery promise. Estimates are not deadlines or completion claims.

### Read first

- [docs/product/INTERACTION_DESIGN.md](../../docs/product/INTERACTION_DESIGN.md)
- [docs/quality/TEST_STRATEGY.md](../../docs/quality/TEST_STRATEGY.md)
- [docs/architecture/DUO_PLATFORM.md](../../docs/architecture/DUO_PLATFORM.md)

### Owned scope

- `evidence/`
- `docs/product/INTERACTION_DESIGN.md`

### Deliverables

- Device interaction review
- Revised touch-target and posture findings

### Implementation sequence

1. Test actual one- and two-handed use on Duo.
2. Inspect hinge-adjacent targets in intended postures.
3. Evaluate zoom, selection, stop and undo reachability.
4. Record accidental touches and ambiguous gestures.
5. Adjust interaction thresholds from observed behavior.

### Acceptance criteria

- **P08-T04-A1** — A physical-device report demonstrates reliable camera, selection and stop/undo interactions in supported postures.
  - Accepted evidence: device_test.
- **P08-T04-A2** — Observed ergonomic defects are resolved or explicitly block the affected interaction mode.
  - Accepted evidence: device_test.

### Verification

- Run the published task script with users unfamiliar with the editor.
- Record posture, orientation and accessibility settings.

### Failure cases and cautions

- Simulator mouse input does not validate touch ergonomics.

### Handoff requirement

Record tested implementation SHA, changed scope, acceptance evidence, commands/results, unrun checks, blockers and the next exact task. Use [the handoff template](../../templates/HANDOFF.md). Update state through the project CLI, regenerate views, and push the metadata checkpoint.
