# P09 — Creative track-layout editor

> Generated from planning/roadmap.json. Edit the JSON definition, then run `npm run project:render`.

## Outcome

Let users construct and revise valid model railways without puzzle constraints.

## Exit gate

Track construction, validation, undo and save form a coherent creative workflow.

The phase is not accepted merely because these instructions or its source files exist. Each task requires the stated evidence. Current progress lives in [the ledger](../state.json).

## P09-T01 — Create the track palette and placement preview

Dependencies: P08-T03, P07-T04, P05-T05

Manual gate: none; planning estimate: 1–3 focused sessions; planning estimate, not a delivery promise. Estimates are not deadlines or completion claims.

### Read first

- [docs/product/INTERACTION_DESIGN.md](../../docs/product/INTERACTION_DESIGN.md)
- [docs/architecture/SIMULATION_AND_TRACKS.md](../../docs/architecture/SIMULATION_AND_TRACKS.md)
- [docs/architecture/PERSISTENCE_AND_EDITOR.md](../../docs/architecture/PERSISTENCE_AND_EDITOR.md)

### Owned scope

- `web/src/editor/`
- `apps/ios/TinJunction/Editor/`

### Deliverables

- Supported track palette
- Nonmutating placement preview

### Implementation sequence

1. Expose only validated launch-kit track modules.
2. Preview transform and connector compatibility before commit.
3. Distinguish valid, invalid and incomplete circuit states.
4. Use accessible labels for piece type and dimensions.
5. Keep preview objects out of durable documents.

### Acceptance criteria

- **P09-T01-A1** — Preview movement never changes the saved model until the user commits.
  - Accepted evidence: unit_test, integration_test.
- **P09-T01-A2** — Every palette item corresponds to a tested supported track definition.
  - Accepted evidence: repository_validation.

### Verification

- Place and cancel each track type.
- Verify invalid previews explain the reason without blocking unrelated edits.

### Failure cases and cautions

- Preview entities can accidentally leak into saves.

### Handoff requirement

Record tested implementation SHA, changed scope, acceptance evidence, commands/results, unrun checks, blockers and the next exact task. Use [the handoff template](../../templates/HANDOFF.md). Update state through the project CLI, regenerate views, and push the metadata checkpoint.

## P09-T02 — Implement deterministic connector snapping

Dependencies: P09-T01

Manual gate: none; planning estimate: 1–3 focused sessions; planning estimate, not a delivery promise. Estimates are not deadlines or completion claims.

### Read first

- [docs/architecture/SIMULATION_AND_TRACKS.md](../../docs/architecture/SIMULATION_AND_TRACKS.md)
- [docs/product/INTERACTION_DESIGN.md](../../docs/product/INTERACTION_DESIGN.md)

### Owned scope

- `web/src/editor/`
- `tests/fixtures/editor/`

### Deliverables

- Connector snap solver
- Hysteresis and candidate ordering

### Implementation sequence

1. Find compatible nearby connectors within physical tolerance.
2. Rank candidates deterministically with explicit tie breaks.
3. Apply orientation and grade compatibility.
4. Use snap hysteresis to avoid flickering candidates.
5. Expose a way to cancel or override an unwanted snap.

### Acceptance criteria

- **P09-T02-A1** — Identical input produces identical snap candidates and transforms.
  - Accepted evidence: unit_test.
- **P09-T02-A2** — Snapped joints satisfy geometry tolerances without sudden unstable jumps.
  - Accepted evidence: integration_test.

### Verification

- Test symmetric ties, crowded sockets and boundary distances.
- Measure snapping stability during slow drag motion.

### Failure cases and cautions

- Screen-space tolerance must not produce impossible world-space joins.

### Handoff requirement

Record tested implementation SHA, changed scope, acceptance evidence, commands/results, unrun checks, blockers and the next exact task. Use [the handoff template](../../templates/HANDOFF.md). Update state through the project CLI, regenerate views, and push the metadata checkpoint.

## P09-T03 — Implement rotate, move, delete and occupied-track protection

Dependencies: P09-T02, P06-T03

Manual gate: none; planning estimate: 1–3 focused sessions; planning estimate, not a delivery promise. Estimates are not deadlines or completion claims.

### Read first

- [docs/architecture/PERSISTENCE_AND_EDITOR.md](../../docs/architecture/PERSISTENCE_AND_EDITOR.md)
- [docs/architecture/SIMULATION_AND_TRACKS.md](../../docs/architecture/SIMULATION_AND_TRACKS.md)
- [docs/product/INTERACTION_DESIGN.md](../../docs/product/INTERACTION_DESIGN.md)

### Owned scope

- `web/src/editor/`
- `web/src/commands/`

### Deliverables

- Atomic track edit commands
- Train-safe edit policy

### Implementation sequence

1. Define which edits require the train to stop.
2. Reject deletion beneath occupied consists or move trains explicitly.
3. Revalidate neighboring connectors after transforms.
4. Commit topology and geometry as one transaction.
5. Make destructive actions reversible with clear feedback.

### Acceptance criteria

- **P09-T03-A1** — Editing occupied track cannot leave a train referencing deleted or disconnected geometry.
  - Accepted evidence: unit_test, integration_test.
- **P09-T03-A2** — Undo restores both the track graph and affected train placement exactly.
  - Accepted evidence: unit_test.

### Verification

- Delete/move tracks under front, middle and rear of a consist.
- Undo sequences across turnout changes and train relocation.

### Failure cases and cautions

- Protecting only the locomotive misses carriage occupancy.

### Handoff requirement

Record tested implementation SHA, changed scope, acceptance evidence, commands/results, unrun checks, blockers and the next exact task. Use [the handoff template](../../templates/HANDOFF.md). Update state through the project CLI, regenerate views, and push the metadata checkpoint.

## P09-T04 — Add circuit diagnostics and build assistance

Dependencies: P09-T03

Manual gate: none; planning estimate: 1–3 focused sessions; planning estimate, not a delivery promise. Estimates are not deadlines or completion claims.

### Read first

- [docs/product/INTERACTION_DESIGN.md](../../docs/product/INTERACTION_DESIGN.md)
- [docs/architecture/SIMULATION_AND_TRACKS.md](../../docs/architecture/SIMULATION_AND_TRACKS.md)
- [docs/product/PRODUCT_SPEC.md](../../docs/product/PRODUCT_SPEC.md)

### Owned scope

- `web/src/editor/`
- `apps/ios/TinJunction/Editor/`

### Deliverables

- Optional topology diagnostics
- Discoverable creative assistance

### Implementation sequence

1. Highlight disconnected ends and invalid operations.
2. Allow saving incomplete layouts for later work.
3. Provide clear train-placement eligibility checks.
4. Offer optional fit/view helpers without scoring or missions.
5. Ensure diagnostics remain useful at large text sizes.

### Acceptance criteria

- **P09-T04-A1** — Users can identify why a train cannot run while retaining freedom to build incomplete layouts.
  - Accepted evidence: integration_test.
- **P09-T04-A2** — No progression gate, reward currency or puzzle objective is introduced.
  - Accepted evidence: repository_validation.

### Verification

- Open intentionally incomplete and invalid sample layouts.
- Review error wording with first-time testers.

### Failure cases and cautions

- Validation UI must not turn the sandbox into a puzzle game.

### Handoff requirement

Record tested implementation SHA, changed scope, acceptance evidence, commands/results, unrun checks, blockers and the next exact task. Use [the handoff template](../../templates/HANDOFF.md). Update state through the project CLI, regenerate views, and push the metadata checkpoint.

## P09-T05 — Verify the complete track-building journey

Dependencies: P09-T04, P07-T05

Manual gate: none; planning estimate: 1–3 focused sessions; planning estimate, not a delivery promise. Estimates are not deadlines or completion claims.

### Read first

- [docs/quality/TEST_STRATEGY.md](../../docs/quality/TEST_STRATEGY.md)
- [docs/product/INTERACTION_DESIGN.md](../../docs/product/INTERACTION_DESIGN.md)
- [docs/architecture/PERSISTENCE_AND_EDITOR.md](../../docs/architecture/PERSISTENCE_AND_EDITOR.md)

### Owned scope

- `tests/fixtures/editor/`
- `evidence/`

### Deliverables

- End-to-end layout authoring regression
- Editor usability defect log

### Implementation sequence

1. Create a layout from an empty board.
2. Place a loop, turnout and siding with snapping.
3. Operate a train, revise the layout and undo.
4. Save, terminate, relaunch and export the result.
5. Capture the complete journey with exact build metadata.

### Acceptance criteria

- **P09-T05-A1** — The full authoring journey completes without lost edits, invalid train routes or inaccessible essential actions.
  - Accepted evidence: integration_test.
- **P09-T05-A2** — The exported layout reproduces the authored topology and placements on reimport.
  - Accepted evidence: integration_test.

### Verification

- Run the native end-to-end sequence from a clean install.
- Repeat with interrupted saves and viewport resizing.

### Failure cases and cautions

- Independent feature tests can miss failures between editor and persistence.

### Handoff requirement

Record tested implementation SHA, changed scope, acceptance evidence, commands/results, unrun checks, blockers and the next exact task. Use [the handoff template](../../templates/HANDOFF.md). Update state through the project CLI, regenerate views, and push the metadata checkpoint.
