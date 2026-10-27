# P16 — Rendering finish and restrained miniature effects

> Generated from planning/roadmap.json. Edit the JSON definition, then run `npm run project:render`.

## Outcome

Polish image stability and atmosphere while protecting editing clarity and mobile performance.

## Exit gate

Every enabled effect has visual evidence, measured cost and a graceful lower-quality path.

The phase is not accepted merely because these instructions or its source files exist. Each task requires the stated evidence. Current progress lives in [the ledger](../state.json).

## P16-T01 — Implement anti-aliasing and resolution policy

Dependencies: P11-T04, P14-T04

Manual gate: none; planning estimate: 1–3 focused sessions; planning estimate, not a delivery promise. Estimates are not deadlines or completion claims.

### Read first

- [docs/graphics/RENDERING_SPEC.md](../../docs/graphics/RENDERING_SPEC.md)
- [docs/graphics/PERFORMANCE_BUDGETS.md](../../docs/graphics/PERFORMANCE_BUDGETS.md)
- [docs/graphics/VISUAL_ACCEPTANCE.md](../../docs/graphics/VISUAL_ACCEPTANCE.md)

### Owned scope

- `web/src/rendering/`

### Deliverables

- Explicit render-area cap
- Anti-aliasing comparison fixtures

### Implementation sequence

1. Choose the baseline anti-aliasing path for the selected backend.
2. Cap backing-buffer area independently of raw device DPR.
3. Preserve accurate logical input coordinates while resizing.
4. Evaluate rails, sleepers and foliage during camera motion.
5. Record quality-tier transitions and hysteresis.

### Acceptance criteria

- **P16-T01-A1** — Motion captures show controlled shimmer and legible thin details at supported resolutions.
  - Accepted evidence: visual_review.
- **P16-T01-A2** — Resolution adaptation remains bounded and does not oscillate or break picking.
  - Accepted evidence: unit_test, integration_test.

### Verification

- Replay slow pans across rails and foliage.
- Resize repeatedly while selecting objects.

### Failure cases and cautions

- Full screen pixel density may exceed the sustained GPU budget.

### Handoff requirement

Record tested implementation SHA, changed scope, acceptance evidence, commands/results, unrun checks, blockers and the next exact task. Use [the handoff template](../../templates/HANDOFF.md). Update state through the project CLI, regenerate views, and push the metadata checkpoint.

## P16-T02 — Evaluate ambient occlusion and reflection approximations

Dependencies: P16-T01, P15-T02

Manual gate: none; planning estimate: 1–3 focused sessions; planning estimate, not a delivery promise. Estimates are not deadlines or completion claims.

### Read first

- [docs/graphics/RENDERING_SPEC.md](../../docs/graphics/RENDERING_SPEC.md)
- [docs/graphics/PERFORMANCE_BUDGETS.md](../../docs/graphics/PERFORMANCE_BUDGETS.md)
- [docs/graphics/VISUAL_ACCEPTANCE.md](../../docs/graphics/VISUAL_ACCEPTANCE.md)

### Owned scope

- `web/src/rendering/`
- `tests/fixtures/rendering/`

### Deliverables

- Effect cost/quality comparison
- Approved minimal effect stack

### Implementation sequence

1. Compare baseline lighting before adding effects.
2. Evaluate AO at contact areas without black halos.
3. Use environment reflections as the default predictable path.
4. Test any screen-space reflection artifacts and fallback.
5. Enable only effects with demonstrated visible value.

### Acceptance criteria

- **P16-T02-A1** — Approved effects improve reference shots without halos, unstable reflections or obscured detail.
  - Accepted evidence: visual_review.
- **P16-T02-A2** — Per-effect cost and disabled fallback are recorded for the packaged renderer.
  - Accepted evidence: integration_test.

### Verification

- Capture effect-on/effect-off comparisons.
- Inspect screen-edge, disocclusion and low-resolution artifacts.

### Failure cases and cautions

- More postprocessing does not automatically mean greater realism.

### Handoff requirement

Record tested implementation SHA, changed scope, acceptance evidence, commands/results, unrun checks, blockers and the next exact task. Use [the handoff template](../../templates/HANDOFF.md). Update state through the project CLI, regenerate views, and push the metadata checkpoint.

## P16-T03 — Add deliberate photo-mode optics

Dependencies: P16-T02, P08-T03

Manual gate: none; planning estimate: 1–3 focused sessions; planning estimate, not a delivery promise. Estimates are not deadlines or completion claims.

### Read first

- [docs/graphics/RENDERING_SPEC.md](../../docs/graphics/RENDERING_SPEC.md)
- [docs/product/INTERACTION_DESIGN.md](../../docs/product/INTERACTION_DESIGN.md)
- [docs/graphics/VISUAL_ACCEPTANCE.md](../../docs/graphics/VISUAL_ACCEPTANCE.md)

### Owned scope

- `web/src/camera/`
- `web/src/rendering/`

### Deliverables

- Optional photo/view optics
- Sharp editor-mode policy

### Implementation sequence

1. Keep editing targets and rails sharp by default.
2. Add restrained depth of field only in deliberate viewing/photo mode.
3. Define focus target and prevent extreme blur ranges.
4. Avoid default chromatic aberration or heavy bloom.
5. Respect reduced-effects preferences and deterministic captures.

### Acceptance criteria

- **P16-T03-A1** — Editor interactions remain sharp and readable regardless of photo-mode settings.
  - Accepted evidence: integration_test, visual_review.
- **P16-T03-A2** — Optical effects reproduce believable miniature viewing rather than masking asset defects.
  - Accepted evidence: visual_review.

### Verification

- Switch between editing and photo modes with an active selection.
- Capture foreground/background focus transitions.

### Failure cases and cautions

- A permanent toy-like blur filter conflicts with precise construction.

### Handoff requirement

Record tested implementation SHA, changed scope, acceptance evidence, commands/results, unrun checks, blockers and the next exact task. Use [the handoff template](../../templates/HANDOFF.md). Update state through the project CLI, regenerate views, and push the metadata checkpoint.

## P16-T04 — Integrate steam and bounded atmospheric detail

Dependencies: P16-T02, P12-T03, P17-T01

Manual gate: none; planning estimate: 1–3 focused sessions; planning estimate, not a delivery promise. Estimates are not deadlines or completion claims.

### Read first

- [docs/graphics/RENDERING_SPEC.md](../../docs/graphics/RENDERING_SPEC.md)
- [docs/graphics/ART_DIRECTION.md](../../docs/graphics/ART_DIRECTION.md)
- [docs/graphics/PERFORMANCE_BUDGETS.md](../../docs/graphics/PERFORMANCE_BUDGETS.md)

### Owned scope

- `web/src/effects/`

### Deliverables

- Velocity/load-responsive steam
- Effect pooling and quality controls

### Implementation sequence

1. Derive emission from train operating state.
2. Pool particles and bound lifetime/count.
3. Align steam scale and drift to the miniature world.
4. Avoid sorting artifacts around glazing and foliage.
5. Disable or reduce expensive effects under the quality policy.

### Acceptance criteria

- **P16-T04-A1** — Steam responds coherently to stopped, accelerating and reversing operation without excessive visual obstruction.
  - Accepted evidence: visual_review, integration_test.
- **P16-T04-A2** — Effect resources remain bounded after long operation and repeated layout resets.
  - Accepted evidence: unit_test, integration_test.

### Verification

- Run extended maximum-emission and rapid-reset fixtures.
- Inspect transparency against dark and bright backgrounds.

### Failure cases and cautions

- Transparent overdraw can dominate GPU cost despite low triangle counts.

### Handoff requirement

Record tested implementation SHA, changed scope, acceptance evidence, commands/results, unrun checks, blockers and the next exact task. Use [the handoff template](../../templates/HANDOFF.md). Update state through the project CLI, regenerate views, and push the metadata checkpoint.
