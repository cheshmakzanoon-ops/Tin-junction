# P18 — Scenery authoring and creative tools

> Generated from planning/roadmap.json. Edit the JSON definition, then run `npm run project:render`.

## Outcome

Allow meaningful, safe diorama customization using the approved miniature asset kit.

## Exit gate

Scenery placement, transforms, selection, undo and persistence remain coherent under realistic layout density.

The phase is not accepted merely because these instructions or its source files exist. Each task requires the stated evidence. Current progress lives in [the ledger](../state.json).

## P18-T01 — Build the scenery catalog and placement previews

Dependencies: P14-T04, P09-T05

Manual gate: none; planning estimate: 1–3 focused sessions; planning estimate, not a delivery promise. Estimates are not deadlines or completion claims.

### Read first

- [docs/product/INTERACTION_DESIGN.md](../../docs/product/INTERACTION_DESIGN.md)
- [docs/graphics/ASSET_PIPELINE.md](../../docs/graphics/ASSET_PIPELINE.md)
- [docs/architecture/PERSISTENCE_AND_EDITOR.md](../../docs/architecture/PERSISTENCE_AND_EDITOR.md)

### Owned scope

- `web/src/editor/`
- `apps/ios/TinJunction/Editor/`

### Deliverables

- Searchable native scenery palette
- Footprint-aware placement preview

### Implementation sequence

1. Expose approved assets with useful categories and previews.
2. Show physical footprint and valid placement state.
3. Keep unapproved or missing assets out of release palettes.
4. Preserve stable IDs despite display-name changes.
5. Provide accessible alternatives to thumbnail-only selection.

### Acceptance criteria

- **P18-T01-A1** — Every selectable asset resolves to an approved catalog entry and valid runtime resource.
  - Accepted evidence: unit_test, integration_test.
- **P18-T01-A2** — Preview placement does not mutate saved layout state.
  - Accepted evidence: unit_test.

### Verification

- Browse every launch category with large text and VoiceOver labels.
- Cancel previews after repeated asset switching.

### Failure cases and cautions

- Catalog thumbnails can conceal missing runtime variants.

### Handoff requirement

Record tested implementation SHA, changed scope, acceptance evidence, commands/results, unrun checks, blockers and the next exact task. Use [the handoff template](../../templates/HANDOFF.md). Update state through the project CLI, regenerate views, and push the metadata checkpoint.

## P18-T02 — Implement scenery move, rotate, duplicate and delete

Dependencies: P18-T01, P07-T04

Manual gate: none; planning estimate: 1–3 focused sessions; planning estimate, not a delivery promise. Estimates are not deadlines or completion claims.

### Read first

- [docs/architecture/PERSISTENCE_AND_EDITOR.md](../../docs/architecture/PERSISTENCE_AND_EDITOR.md)
- [docs/product/INTERACTION_DESIGN.md](../../docs/product/INTERACTION_DESIGN.md)
- [docs/architecture/SIMULATION_AND_TRACKS.md](../../docs/architecture/SIMULATION_AND_TRACKS.md)

### Owned scope

- `web/src/editor/`
- `web/src/commands/`

### Deliverables

- Atomic scenery edit commands
- Collision/clearance-aware placement

### Implementation sequence

1. Validate case bounds and train-clearance envelopes.
2. Use model-space transforms and stable instance IDs.
3. Support bounded duplicate operations without resource cloning.
4. Coalesce drags into undoable transactions.
5. Emit lighting/bounds invalidation after committed edits.

### Acceptance criteria

- **P18-T02-A1** — Scenery edits cannot block protected train clearance or leave invalid instance references.
  - Accepted evidence: unit_test.
- **P18-T02-A2** — Undo/redo restores exact placements while shared resource ownership remains correct.
  - Accepted evidence: unit_test, integration_test.

### Verification

- Move buildings near track and case boundaries.
- Duplicate/delete dense groups and inspect resource counts.

### Failure cases and cautions

- Visual placement must trigger culling and lighting cache updates.

### Handoff requirement

Record tested implementation SHA, changed scope, acceptance evidence, commands/results, unrun checks, blockers and the next exact task. Use [the handoff template](../../templates/HANDOFF.md). Update state through the project CLI, regenerate views, and push the metadata checkpoint.

## P18-T03 — Add organization, reset and layout composition tools

Dependencies: P18-T02

Manual gate: none; planning estimate: 1–3 focused sessions; planning estimate, not a delivery promise. Estimates are not deadlines or completion claims.

### Read first

- [docs/product/INTERACTION_DESIGN.md](../../docs/product/INTERACTION_DESIGN.md)
- [docs/architecture/PERSISTENCE_AND_EDITOR.md](../../docs/architecture/PERSISTENCE_AND_EDITOR.md)
- [docs/product/PRODUCT_SPEC.md](../../docs/product/PRODUCT_SPEC.md)

### Owned scope

- `web/src/editor/`
- `apps/ios/TinJunction/Editor/`

### Deliverables

- Selection organization and composition helpers
- Safe reset/clear flows

### Implementation sequence

1. Offer locate-selection and fit-layout camera actions.
2. Add controlled multi-selection only after single-edit stability.
3. Protect whole-layout clearing with explicit confirmation.
4. Preserve a recoverable snapshot before destructive reset.
5. Avoid feature bloat such as economies or unlockable decorations.

### Acceptance criteria

- **P18-T03-A1** — Destructive composition actions are clearly identified and recoverable through documented undo/backup behavior.
  - Accepted evidence: integration_test.
- **P18-T03-A2** — Organization helpers work on dense layouts without losing selected IDs.
  - Accepted evidence: unit_test, integration_test.

### Verification

- Reset and recover a modified launch layout.
- Test deletion with mixed selected and unselected assets.

### Failure cases and cautions

- A one-tap clear action can destroy hours of user work.

### Handoff requirement

Record tested implementation SHA, changed scope, acceptance evidence, commands/results, unrun checks, blockers and the next exact task. Use [the handoff template](../../templates/HANDOFF.md). Update state through the project CLI, regenerate views, and push the metadata checkpoint.

## P18-T04 — Validate unrestricted creative sessions

Dependencies: P18-T03, P15-T03

Manual gate: none; planning estimate: 1–3 focused sessions; planning estimate, not a delivery promise. Estimates are not deadlines or completion claims.

### Read first

- [docs/quality/TEST_STRATEGY.md](../../docs/quality/TEST_STRATEGY.md)
- [docs/product/INTERACTION_DESIGN.md](../../docs/product/INTERACTION_DESIGN.md)
- [docs/graphics/PERFORMANCE_BUDGETS.md](../../docs/graphics/PERFORMANCE_BUDGETS.md)

### Owned scope

- `evidence/`
- `tests/fixtures/editor/`

### Deliverables

- Dense scenery editor acceptance
- Long-session edit/save regression

### Implementation sequence

1. Run a scripted session of track and scenery changes.
2. Alternate operating, photo and editing modes.
3. Save, reload and export during the session.
4. Monitor resource growth and responsiveness.
5. Collect usability failures without inventing engagement claims.

### Acceptance criteria

- **P18-T04-A1** — A long creative session preserves topology, placements, undo and durable saves.
  - Accepted evidence: integration_test.
- **P18-T04-A2** — Dense scenes remain selectable and lighting updates reflect actual object positions.
  - Accepted evidence: integration_test, visual_review.

### Verification

- Execute repeated mixed-edit transactions on a fixed seed layout.
- Compare final saved state with the command replay result.

### Failure cases and cautions

- Many individual small edits can expose cumulative leaks.

### Handoff requirement

Record tested implementation SHA, changed scope, acceptance evidence, commands/results, unrun checks, blockers and the next exact task. Use [the handoff template](../../templates/HANDOFF.md). Update state through the project CLI, regenerate views, and push the metadata checkpoint.
