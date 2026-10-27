# P12 — Hero locomotive production

> Generated from planning/roadmap.json. Edit the JSON definition, then run `npm run project:render`.

## Outcome

Create one original, mechanically convincing miniature locomotive before expanding the fleet.

## Exit gate

The locomotive passes dimension, animation, close-up appearance and runtime budget reviews.

The phase is not accepted merely because these instructions or its source files exist. Each task requires the stated evidence. Current progress lives in [the ledger](../state.json).

## P12-T01 — Design and block out the original locomotive

Dependencies: P10-T04, P11-T03, P06-T02

Manual gate: none; planning estimate: 1–3 focused sessions; planning estimate, not a delivery promise. Estimates are not deadlines or completion claims.

### Read first

- [docs/graphics/ART_DIRECTION.md](../../docs/graphics/ART_DIRECTION.md)
- [docs/graphics/ASSET_PIPELINE.md](../../docs/graphics/ASSET_PIPELINE.md)
- [docs/architecture/SIMULATION_AND_TRACKS.md](../../docs/architecture/SIMULATION_AND_TRACKS.md)

### Owned scope

- `assets/source/locomotive/`
- `assets/catalog.json`

### Deliverables

- Original locomotive design sheet
- Dimensionally correct blockout

### Implementation sequence

1. Choose a fictional unbranded locomotive silhouette.
2. Specify wheelbase, gauge, coupler and body dimensions.
3. Locate wheel/axle and running-gear pivots.
4. Check clearance on minimum supported curves.
5. Review proportions inside the physical case.

### Acceptance criteria

- **P12-T01-A1** — The blockout fits track gauge, curve clearance and consist constraints without hidden scaling.
  - Accepted evidence: unit_test, visual_review.
- **P12-T01-A2** — Design provenance avoids copied commercial branding or protected artwork.
  - Accepted evidence: repository_validation.

### Verification

- Traverse the blockout through curve and turnout fixtures.
- Compare orthographic dimensions with the design sheet.

### Failure cases and cautions

- An attractive shell can conceal incompatible wheelbase geometry.

### Handoff requirement

Record tested implementation SHA, changed scope, acceptance evidence, commands/results, unrun checks, blockers and the next exact task. Use [the handoff template](../../templates/HANDOFF.md). Update state through the project CLI, regenerate views, and push the metadata checkpoint.

## P12-T02 — Produce hero geometry, UVs and materials

Dependencies: P12-T01

Manual gate: none; planning estimate: 1–3 focused sessions; planning estimate, not a delivery promise. Estimates are not deadlines or completion claims.

### Read first

- [docs/graphics/ART_DIRECTION.md](../../docs/graphics/ART_DIRECTION.md)
- [docs/graphics/ASSET_PIPELINE.md](../../docs/graphics/ASSET_PIPELINE.md)
- [docs/graphics/VISUAL_ACCEPTANCE.md](../../docs/graphics/VISUAL_ACCEPTANCE.md)

### Owned scope

- `assets/source/locomotive/`
- `assets/runtime/locomotive/`

### Deliverables

- Hero mesh and material atlas
- Macro reference captures

### Implementation sequence

1. Add silhouette-critical boiler, cabin, wheels and fittings.
2. Use real bevels where macro highlights require geometry.
3. Pack UVs with consistent texel density.
4. Apply calibrated paint, metal, glass and wear recipes.
5. Validate normals, texture seams and compression.

### Acceptance criteria

- **P12-T02-A1** — Macro captures show convincing edges, material separation and no visible UV/normal defects.
  - Accepted evidence: visual_review.
- **P12-T02-A2** — The asset passes catalog, glTF and provisional LOD0 budget validation.
  - Accepted evidence: repository_validation.

### Verification

- Inspect rail-height, side, front and overhead shots.
- Rotate neutral lighting to reveal shading defects.

### Failure cases and cautions

- High polygon count alone does not establish realism.

### Handoff requirement

Record tested implementation SHA, changed scope, acceptance evidence, commands/results, unrun checks, blockers and the next exact task. Use [the handoff template](../../templates/HANDOFF.md). Update state through the project CLI, regenerate views, and push the metadata checkpoint.

## P12-T03 — Integrate running gear, lights and train motion

Dependencies: P12-T02, P06-T02

Manual gate: none; planning estimate: 1–3 focused sessions; planning estimate, not a delivery promise. Estimates are not deadlines or completion claims.

### Read first

- [docs/architecture/SIMULATION_AND_TRACKS.md](../../docs/architecture/SIMULATION_AND_TRACKS.md)
- [docs/graphics/RENDERING_SPEC.md](../../docs/graphics/RENDERING_SPEC.md)
- [docs/graphics/VISUAL_ACCEPTANCE.md](../../docs/graphics/VISUAL_ACCEPTANCE.md)

### Owned scope

- `web/src/rolling-stock/`
- `assets/runtime/locomotive/`

### Deliverables

- Distance-synchronized mechanical animation
- Headlight/emissive integration

### Implementation sequence

1. Bind animation pivots to stable asset metadata.
2. Drive wheels and rods from traveled distance.
3. Account for direction reversal and stationary states.
4. Align lights with calibrated exposure and actual geometry.
5. Verify bogie/rail contact through supported routes.

### Acceptance criteria

- **P12-T03-A1** — Wheels, rods and body motion remain mechanically coherent in forward, reverse and braking sequences.
  - Accepted evidence: unit_test, visual_review.
- **P12-T03-A2** — Close-up route traversal shows no floating wheels, clipping rods or unstable couplers.
  - Accepted evidence: visual_review.

### Verification

- Capture slow-motion curve and turnout passage.
- Compare wheel phase after known forward/reverse distances.

### Failure cases and cautions

- Time-driven wheel animation produces sliding at changing speeds.

### Handoff requirement

Record tested implementation SHA, changed scope, acceptance evidence, commands/results, unrun checks, blockers and the next exact task. Use [the handoff template](../../templates/HANDOFF.md). Update state through the project CLI, regenerate views, and push the metadata checkpoint.

## P12-T04 — Create LODs and approve the hero asset

Dependencies: P12-T03, P11-T04

Manual gate: none; planning estimate: 1–3 focused sessions; planning estimate, not a delivery promise. Estimates are not deadlines or completion claims.

### Read first

- [docs/graphics/ASSET_PIPELINE.md](../../docs/graphics/ASSET_PIPELINE.md)
- [docs/graphics/PERFORMANCE_BUDGETS.md](../../docs/graphics/PERFORMANCE_BUDGETS.md)
- [docs/graphics/VISUAL_ACCEPTANCE.md](../../docs/graphics/VISUAL_ACCEPTANCE.md)

### Owned scope

- `assets/runtime/locomotive/`
- `evidence/`

### Deliverables

- Silhouette-preserving LOD chain
- Hero approval report

### Implementation sequence

1. Reduce geometry while preserving wheels and major silhouette.
2. Create appropriate texture/material simplifications.
3. Tune LOD distance hysteresis using actual screen coverage.
4. Check shadows and lights across LOD transitions.
5. Capture the final hero in calibration and railway scenes.

### Acceptance criteria

- **P12-T04-A1** — LOD transitions avoid objectionable popping and retain a coherent moving silhouette.
  - Accepted evidence: visual_review.
- **P12-T04-A2** — The approved catalog records every runtime variant, hash and measured resource cost.
  - Accepted evidence: repository_validation.

### Verification

- Move camera repeatedly across every LOD boundary.
- Profile hero-only and representative-scene costs separately.

### Failure cases and cautions

- Reducing visible geometry can leave shadow or animation costs unchanged.

### Handoff requirement

Record tested implementation SHA, changed scope, acceptance evidence, commands/results, unrun checks, blockers and the next exact task. Use [the handoff template](../../templates/HANDOFF.md). Update state through the project CLI, regenerate views, and push the metadata checkpoint.
