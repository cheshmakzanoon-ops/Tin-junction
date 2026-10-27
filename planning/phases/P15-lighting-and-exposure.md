# P15 — Lighting, shadows and exposure

> Generated from planning/roadmap.json. Edit the JSON definition, then run `npm run project:render`.

## Outcome

Light the physical model coherently without relying on expensive effects to hide weak assets.

## Exit gate

Day/night reference lighting, shadow behavior and editable-object responses are calibrated and reproducible.

The phase is not accepted merely because these instructions or its source files exist. Each task requires the stated evidence. Current progress lives in [the ledger](../state.json).

## P15-T01 — Build calibrated environment and key-light presets

Dependencies: P11-T03, P14-T04

Manual gate: none; planning estimate: 1–3 focused sessions; planning estimate, not a delivery promise. Estimates are not deadlines or completion claims.

### Read first

- [docs/graphics/RENDERING_SPEC.md](../../docs/graphics/RENDERING_SPEC.md)
- [docs/graphics/ART_DIRECTION.md](../../docs/graphics/ART_DIRECTION.md)
- [docs/graphics/VISUAL_ACCEPTANCE.md](../../docs/graphics/VISUAL_ACCEPTANCE.md)

### Owned scope

- `web/src/lighting/`
- `assets/lighting/`

### Deliverables

- Versioned lighting presets
- Neutral/day/night calibration captures

### Implementation sequence

1. Choose licensed environment sources and explicit exposure.
2. Generate bounded prefiltered environment resources.
3. Use one justified shadow-casting key light initially.
4. Document physical intent and units for every light.
5. Capture the same material chart under every preset.

### Acceptance criteria

- **P15-T01-A1** — Lighting presets reproduce consistent material response and a single intentional exposure pipeline.
  - Accepted evidence: visual_review.
- **P15-T01-A2** — Environment preprocessing is cached and never regenerated every render frame.
  - Accepted evidence: unit_test, integration_test.

### Verification

- Compare fixed-camera captures with preset reloads.
- Inspect render-loop traces for accidental environment regeneration.

### Failure cases and cautions

- Bright fill lights can wash out miniature material detail.

### Handoff requirement

Record tested implementation SHA, changed scope, acceptance evidence, commands/results, unrun checks, blockers and the next exact task. Use [the handoff template](../../templates/HANDOFF.md). Update state through the project CLI, regenerate views, and push the metadata checkpoint.

## P15-T02 — Implement stable shadow budgets and contact detail

Dependencies: P15-T01

Manual gate: none; planning estimate: 1–3 focused sessions; planning estimate, not a delivery promise. Estimates are not deadlines or completion claims.

### Read first

- [docs/graphics/RENDERING_SPEC.md](../../docs/graphics/RENDERING_SPEC.md)
- [docs/graphics/PERFORMANCE_BUDGETS.md](../../docs/graphics/PERFORMANCE_BUDGETS.md)
- [docs/graphics/VISUAL_ACCEPTANCE.md](../../docs/graphics/VISUAL_ACCEPTANCE.md)

### Owned scope

- `web/src/lighting/`
- `web/src/rendering/`

### Deliverables

- Shadow-frustum and bias policy
- Contact-shadow regression captures

### Implementation sequence

1. Fit shadow coverage to the useful model region.
2. Tune bias against scale-calibrated reference geometry.
3. Limit casting meshes and include shadow passes in budgets.
4. Separate static and moving-object shadow responsibilities.
5. Test low angles and camera changes for shimmer/acne.

### Acceptance criteria

- **P15-T02-A1** — Train wheels, buildings and case edges have convincing contact without obvious acne or detached shadows.
  - Accepted evidence: visual_review.
- **P15-T02-A2** — Total shadow-inclusive rendering cost is reported and stays within the approved policy.
  - Accepted evidence: integration_test.

### Verification

- Capture wheel/rail contact and thin geometry under grazing light.
- Measure frame cost with individual shadow features toggled.

### Failure cases and cautions

- Shadow-map resolution is not a substitute for correct scale and frustum.

### Handoff requirement

Record tested implementation SHA, changed scope, acceptance evidence, commands/results, unrun checks, blockers and the next exact task. Use [the handoff template](../../templates/HANDOFF.md). Update state through the project CLI, regenerate views, and push the metadata checkpoint.

## P15-T03 — Handle editable geometry and indirect-light invalidation

Dependencies: P15-T02, P18-T02

Manual gate: none; planning estimate: 1–3 focused sessions; planning estimate, not a delivery promise. Estimates are not deadlines or completion claims.

### Read first

- [docs/graphics/RENDERING_SPEC.md](../../docs/graphics/RENDERING_SPEC.md)
- [docs/architecture/PERSISTENCE_AND_EDITOR.md](../../docs/architecture/PERSISTENCE_AND_EDITOR.md)
- [docs/graphics/VISUAL_ACCEPTANCE.md](../../docs/graphics/VISUAL_ACCEPTANCE.md)

### Owned scope

- `web/src/lighting/`
- `web/src/editor/`

### Deliverables

- Lighting invalidation rules
- Movable-object bake policy

### Implementation sequence

1. Identify which surfaces may use baked lighting.
2. Prevent movable objects from carrying baked location shadows.
3. Invalidate or recompute affected cached lighting after edits.
4. Use bounded approximations where realtime GI is unaffordable.
5. Test moving/removing scenery under different presets.

### Acceptance criteria

- **P15-T03-A1** — Moving or deleting scenery leaves no stale baked shadow in its previous location.
  - Accepted evidence: integration_test, visual_review.
- **P15-T03-A2** — Lighting invalidation completes within bounded work and does not stall each drag event.
  - Accepted evidence: unit_test, integration_test.

### Verification

- Move a large building repeatedly through lit and shaded areas.
- Compare before/after captures for ghost shadows.

### Failure cases and cautions

- Author-time beauty lighting may be incompatible with a freeform editor.

### Handoff requirement

Record tested implementation SHA, changed scope, acceptance evidence, commands/results, unrun checks, blockers and the next exact task. Use [the handoff template](../../templates/HANDOFF.md). Update state through the project CLI, regenerate views, and push the metadata checkpoint.

## P15-T04 — Approve integrated lighting against reference shots

Dependencies: P15-T03, P12-T04

Manual gate: none; planning estimate: 1–3 focused sessions; planning estimate, not a delivery promise. Estimates are not deadlines or completion claims.

### Read first

- [docs/graphics/VISUAL_ACCEPTANCE.md](../../docs/graphics/VISUAL_ACCEPTANCE.md)
- [docs/graphics/ART_DIRECTION.md](../../docs/graphics/ART_DIRECTION.md)
- [docs/graphics/PERFORMANCE_BUDGETS.md](../../docs/graphics/PERFORMANCE_BUDGETS.md)

### Owned scope

- `evidence/`
- `assets/lighting/`

### Deliverables

- Lighting acceptance report
- Resolved exposure/material interaction defects

### Implementation sequence

1. Capture the required whole-layout and macro views.
2. Review highlights, roughness, shadow softness and model scale.
3. Compare day and night without arbitrary per-shot material changes.
4. Measure worst-case lighting views.
5. Record settings and asset hashes for reproducibility.

### Acceptance criteria

- **P15-T04-A1** — Reference-matched captures pass the documented material, contact and exposure rubric.
  - Accepted evidence: visual_review.
- **P15-T04-A2** — Accepted presets have stable identifiers and reproducible runtime settings.
  - Accepted evidence: repository_validation.

### Verification

- Reload each preset from a clean app session.
- Repeat captures with final locomotive and infrastructure.

### Failure cases and cautions

- Per-shot cheats cannot become the shipped interactive lighting system.

### Handoff requirement

Record tested implementation SHA, changed scope, acceptance evidence, commands/results, unrun checks, blockers and the next exact task. Use [the handoff template](../../templates/HANDOFF.md). Update state through the project CLI, regenerate views, and push the metadata checkpoint.
