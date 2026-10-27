# P13 — Track and railway infrastructure art

> Generated from planning/roadmap.json. Edit the JSON definition, then run `npm run project:render`.

## Outcome

Replace diagnostic rail geometry with convincing model-railway construction and functional infrastructure.

## Exit gate

Track, turnouts, signals, bridges and station interfaces remain mechanically correct at macro distances.

The phase is not accepted merely because these instructions or its source files exist. Each task requires the stated evidence. Current progress lives in [the ledger](../state.json).

## P13-T01 — Finish rail, sleeper and ballast appearance

Dependencies: P05-T02, P11-T03, P10-T04

Manual gate: none; planning estimate: 1–3 focused sessions; planning estimate, not a delivery promise. Estimates are not deadlines or completion claims.

### Read first

- [docs/graphics/ART_DIRECTION.md](../../docs/graphics/ART_DIRECTION.md)
- [docs/graphics/ASSET_PIPELINE.md](../../docs/graphics/ASSET_PIPELINE.md)
- [docs/graphics/RENDERING_SPEC.md](../../docs/graphics/RENDERING_SPEC.md)

### Owned scope

- `assets/source/track/`
- `web/src/track/`

### Deliverables

- Polished rail and model ballast kit
- Instanced sleeper rendering

### Implementation sequence

1. Model polished contact surfaces and rough rail sides.
2. Build plausible sleeper spacing and fastening details.
3. Combine aggregate textures with sparse close-up ballast geometry.
4. Avoid repeated dirt patterns at module joins.
5. Verify silhouette and material consistency across pieces.

### Acceptance criteria

- **P13-T01-A1** — Macro joints show continuous rails, consistent gauge and convincing miniature construction.
  - Accepted evidence: visual_review.
- **P13-T01-A2** — Repeated track sections use bounded material/draw-call counts.
  - Accepted evidence: repository_validation, integration_test.

### Verification

- Capture straight, curved and joined track at rail height.
- Profile a dense supported track layout.

### Failure cases and cautions

- Thousands of separate ballast meshes can destroy draw-call budgets.

### Handoff requirement

Record tested implementation SHA, changed scope, acceptance evidence, commands/results, unrun checks, blockers and the next exact task. Use [the handoff template](../../templates/HANDOFF.md). Update state through the project CLI, regenerate views, and push the metadata checkpoint.

## P13-T02 — Create functional turnout, buffer and signal assets

Dependencies: P13-T01, P05-T04

Manual gate: none; planning estimate: 1–3 focused sessions; planning estimate, not a delivery promise. Estimates are not deadlines or completion claims.

### Read first

- [docs/architecture/SIMULATION_AND_TRACKS.md](../../docs/architecture/SIMULATION_AND_TRACKS.md)
- [docs/graphics/ART_DIRECTION.md](../../docs/graphics/ART_DIRECTION.md)
- [docs/product/INTERACTION_DESIGN.md](../../docs/product/INTERACTION_DESIGN.md)

### Owned scope

- `assets/source/infrastructure/`
- `web/src/infrastructure/`

### Deliverables

- Animated turnout blades
- Buffers and readable signals

### Implementation sequence

1. Align visual blades with the selected topological route.
2. Build buffers and signal pivots at correct physical scale.
3. Map signal appearance to explicit operating states.
4. Provide non-color-only state cues.
5. Test occupied-route switching feedback with final assets.

### Acceptance criteria

- **P13-T02-A1** — Turnout animation and signal state always agree with the authoritative model.
  - Accepted evidence: unit_test, integration_test.
- **P13-T02-A2** — Signals and buffers remain legible without exaggerated cartoon proportions.
  - Accepted evidence: visual_review.

### Verification

- Compare blade positions against both route centerlines.
- Test signal interpretation under night and accessibility settings.

### Failure cases and cautions

- An animation must not switch topology before occupancy checks succeed.

### Handoff requirement

Record tested implementation SHA, changed scope, acceptance evidence, commands/results, unrun checks, blockers and the next exact task. Use [the handoff template](../../templates/HANDOFF.md). Update state through the project CLI, regenerate views, and push the metadata checkpoint.

## P13-T03 — Produce bridges, tunnel portals and station interfaces

Dependencies: P13-T01, P05-T05

Manual gate: none; planning estimate: 1–3 focused sessions; planning estimate, not a delivery promise. Estimates are not deadlines or completion claims.

### Read first

- [docs/graphics/ART_DIRECTION.md](../../docs/graphics/ART_DIRECTION.md)
- [docs/graphics/ASSET_PIPELINE.md](../../docs/graphics/ASSET_PIPELINE.md)
- [docs/architecture/SIMULATION_AND_TRACKS.md](../../docs/architecture/SIMULATION_AND_TRACKS.md)

### Owned scope

- `assets/source/infrastructure/`
- `assets/runtime/infrastructure/`

### Deliverables

- Clearance-correct infrastructure kit
- Collision and placement metadata

### Implementation sequence

1. Design bridge, portal and platform dimensions from train clearance.
2. Create visible miniature material and construction details.
3. Add low-cost collision/placement proxies.
4. Avoid light leaks and shadow discontinuities inside portals.
5. Test whole-consist passage and camera proximity.

### Acceptance criteria

- **P13-T03-A1** — The approved train and consist pass every supported structure without clipping.
  - Accepted evidence: unit_test, visual_review.
- **P13-T03-A2** — Infrastructure exports include validated clearance metadata and provenance.
  - Accepted evidence: repository_validation.

### Verification

- Traverse structures at minimum clearances.
- Inspect portal interiors and platform edges from macro views.

### Failure cases and cautions

- A portal sized only for the locomotive can clip wider rolling stock.

### Handoff requirement

Record tested implementation SHA, changed scope, acceptance evidence, commands/results, unrun checks, blockers and the next exact task. Use [the handoff template](../../templates/HANDOFF.md). Update state through the project CLI, regenerate views, and push the metadata checkpoint.

## P13-T04 — Review infrastructure as a coherent launch kit

Dependencies: P13-T02, P13-T03, P12-T04

Manual gate: none; planning estimate: 1–3 focused sessions; planning estimate, not a delivery promise. Estimates are not deadlines or completion claims.

### Read first

- [docs/graphics/VISUAL_ACCEPTANCE.md](../../docs/graphics/VISUAL_ACCEPTANCE.md)
- [docs/graphics/PERFORMANCE_BUDGETS.md](../../docs/graphics/PERFORMANCE_BUDGETS.md)
- [docs/graphics/ASSET_PIPELINE.md](../../docs/graphics/ASSET_PIPELINE.md)

### Owned scope

- `evidence/`
- `assets/catalog.json`

### Deliverables

- Integrated railway kit review
- Resolved infrastructure defect list

### Implementation sequence

1. Assemble the hero train with all infrastructure types.
2. Capture common joints and interacting moving parts.
3. Check material consistency and model scale.
4. Measure representative draw/shadow cost.
5. Record accepted variants and rejected placeholders.

### Acceptance criteria

- **P13-T04-A1** — Reference captures demonstrate consistent scale and no mechanical intersections across the complete kit.
  - Accepted evidence: visual_review.
- **P13-T04-A2** — Approved assets are traceable and remain within ratified or explicitly provisional budget limits.
  - Accepted evidence: repository_validation.

### Verification

- Run the functional vertical-slice sequence with final infrastructure.
- Review every defect against before/after captures.

### Failure cases and cautions

- Individual asset approval can miss clashes between neighboring assets.

### Handoff requirement

Record tested implementation SHA, changed scope, acceptance evidence, commands/results, unrun checks, blockers and the next exact task. Use [the handoff template](../../templates/HANDOFF.md). Update state through the project CLI, regenerate views, and push the metadata checkpoint.
