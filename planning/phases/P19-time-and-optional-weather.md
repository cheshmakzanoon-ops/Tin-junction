# P19 — Time of day and gated weather

> Generated from planning/roadmap.json. Edit the JSON definition, then run `npm run project:render`.

## Outcome

Add coherent ambience without compromising core operation or promising unfinished weather systems.

## Exit gate

Day/night is complete; rain and snow each have an evidenced implementation or explicit owner-approved deferral.

The phase is not accepted merely because these instructions or its source files exist. Each task requires the stated evidence. Current progress lives in [the ledger](../state.json).

## P19-T01 — Implement time-of-day controls and deterministic presets

Dependencies: P15-T04, P02-T03

Manual gate: none; planning estimate: 1–3 focused sessions; planning estimate, not a delivery promise. Estimates are not deadlines or completion claims.

### Read first

- [docs/graphics/RENDERING_SPEC.md](../../docs/graphics/RENDERING_SPEC.md)
- [docs/product/INTERACTION_DESIGN.md](../../docs/product/INTERACTION_DESIGN.md)
- [docs/architecture/PERSISTENCE_AND_EDITOR.md](../../docs/architecture/PERSISTENCE_AND_EDITOR.md)

### Owned scope

- `web/src/environment/`
- `apps/ios/TinJunction/Controls/`

### Deliverables

- Saved time-of-day setting
- Stable preset interpolation

### Implementation sequence

1. Define bounded sun/exposure/environment transitions.
2. Persist chosen ambience separately from simulation time.
3. Avoid changing train speed when time-of-day changes.
4. Interpolate only compatible lighting resources.
5. Support immediate and reduced-motion transitions.

### Acceptance criteria

- **P19-T01-A1** — Day/night controls never change track simulation or corrupt saved layouts.
  - Accepted evidence: unit_test.
- **P19-T01-A2** — Preset transitions remain stable without exposure flashes or unbounded resource regeneration.
  - Accepted evidence: integration_test, visual_review.

### Verification

- Scrub time repeatedly while the train runs.
- Save/reload at transition boundaries.

### Failure cases and cautions

- Lighting time and simulation time are different concepts.

### Handoff requirement

Record tested implementation SHA, changed scope, acceptance evidence, commands/results, unrun checks, blockers and the next exact task. Use [the handoff template](../../templates/HANDOFF.md). Update state through the project CLI, regenerate views, and push the metadata checkpoint.

## P19-T02 — Finish night village and train lighting

Dependencies: P19-T01, P14-T02, P12-T03

Manual gate: none; planning estimate: 1–3 focused sessions; planning estimate, not a delivery promise. Estimates are not deadlines or completion claims.

### Read first

- [docs/graphics/ART_DIRECTION.md](../../docs/graphics/ART_DIRECTION.md)
- [docs/graphics/RENDERING_SPEC.md](../../docs/graphics/RENDERING_SPEC.md)
- [docs/graphics/VISUAL_ACCEPTANCE.md](../../docs/graphics/VISUAL_ACCEPTANCE.md)

### Owned scope

- `web/src/lighting/`
- `assets/lighting/`

### Deliverables

- Coherent nighttime composition
- Emissive/light cost policy

### Implementation sequence

1. Coordinate windows, station lamps and locomotive lights.
2. Avoid one dynamic shadow light per window.
3. Keep operating controls and rail paths readable.
4. Check glazing and bloom against calibrated exposure.
5. Capture dark-adapted and mixed-light reference shots.

### Acceptance criteria

- **P19-T02-A1** — Night captures preserve miniature material character without blown windows or black unreadable tracks.
  - Accepted evidence: visual_review.
- **P19-T02-A2** — The night preset remains within the documented light/render-target budget.
  - Accepted evidence: integration_test.

### Verification

- Compare night output with the material calibration room.
- Operate, edit and stop the train in night mode.

### Failure cases and cautions

- Excess bloom can turn a realistic model into neon scenery.

### Handoff requirement

Record tested implementation SHA, changed scope, acceptance evidence, commands/results, unrun checks, blockers and the next exact task. Use [the handoff template](../../templates/HANDOFF.md). Update state through the project CLI, regenerate views, and push the metadata checkpoint.

## P19-T03 — Decide and validate rain/wetness scope

Dependencies: P19-T02, P16-T04

Manual gate: owner; planning estimate: 1–3 focused sessions; planning estimate, not a delivery promise. Estimates are not deadlines or completion claims.

### Read first

- [docs/graphics/RENDERING_SPEC.md](../../docs/graphics/RENDERING_SPEC.md)
- [docs/graphics/PERFORMANCE_BUDGETS.md](../../docs/graphics/PERFORMANCE_BUDGETS.md)
- [docs/product/PRODUCT_SPEC.md](../../docs/product/PRODUCT_SPEC.md)
- [docs/quality/RELEASE_GATES.md](../../docs/quality/RELEASE_GATES.md)

### Owned scope

- `web/src/weather/`
- `evidence/`
- `docs/decisions/`

### Deliverables

- Rain implementation or approved deferral
- Cost/quality decision record

### Implementation sequence

1. Prototype bounded rain and surface wetness in isolation.
2. Respect miniature scale and prevent indoor/case leakage.
3. Measure overdraw, transparency and material variant cost.
4. Evaluate visual benefit during actual interaction.
5. Request owner approval for inclusion or explicit deferral; remove deferred marketing/UI promises.

### Acceptance criteria

- **P19-T03-A1** — An owner decision approves the measured rain implementation or clearly defers rain from the release scope.
  - Accepted evidence: owner_approval.
- **P19-T03-A2** — Included rain passes native visual/performance checks; deferred rain leaves no misleading active controls or store claims.
  - Accepted evidence: integration_test, visual_review, repository_validation.

### Verification

- If included, run sustained rain on the representative scene and compare dry/wet materials.
- If deferred, inspect release UI and metadata for weather promises.

### Failure cases and cautions

- Weather cannot be accepted on a static concept image alone.

### Handoff requirement

Record tested implementation SHA, changed scope, acceptance evidence, commands/results, unrun checks, blockers and the next exact task. Use [the handoff template](../../templates/HANDOFF.md). Update state through the project CLI, regenerate views, and push the metadata checkpoint.

## P19-T04 — Decide and validate snow scope

Dependencies: P19-T03

Manual gate: owner; planning estimate: 1–3 focused sessions; planning estimate, not a delivery promise. Estimates are not deadlines or completion claims.

### Read first

- [docs/graphics/RENDERING_SPEC.md](../../docs/graphics/RENDERING_SPEC.md)
- [docs/graphics/ASSET_PIPELINE.md](../../docs/graphics/ASSET_PIPELINE.md)
- [docs/graphics/PERFORMANCE_BUDGETS.md](../../docs/graphics/PERFORMANCE_BUDGETS.md)
- [docs/quality/RELEASE_GATES.md](../../docs/quality/RELEASE_GATES.md)

### Owned scope

- `web/src/weather/`
- `assets/weather/`
- `evidence/`
- `docs/decisions/`

### Deliverables

- Snow implementation or approved deferral
- Seasonal asset and performance policy

### Implementation sequence

1. Assess snowfall and accumulation as separate features.
2. Check snow coverage on movable scenery and tracks.
3. Budget extra textures, particles and variants.
4. Reject visual snow that obscures controls or breaks rail readability.
5. Obtain an explicit include/defer decision and update release promises.

### Acceptance criteria

- **P19-T04-A1** — The owner approves either a tested bounded snow feature or its explicit release deferral.
  - Accepted evidence: owner_approval.
- **P19-T04-A2** — Included snow survives editing/save/load; deferred snow assets and claims are excluded from release.
  - Accepted evidence: integration_test, visual_review, repository_validation.

### Verification

- If included, move/delete snow-covered objects and reload the layout.
- If deferred, validate the release asset allowlist.

### Failure cases and cautions

- Snow accumulation multiplies asset and editing-state complexity.

### Handoff requirement

Record tested implementation SHA, changed scope, acceptance evidence, commands/results, unrun checks, blockers and the next exact task. Use [the handoff template](../../templates/HANDOFF.md). Update state through the project CLI, regenerate views, and push the metadata checkpoint.
