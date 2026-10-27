# P14 — Miniature terrain and Alpine village

> Generated from planning/roadmap.json. Edit the JSON definition, then run `npm run project:render`.

## Outcome

Build a coherent handcrafted Alpine diorama with plausible scale and controllable runtime cost.

## Exit gate

Terrain, buildings, foliage and case details form a convincing physical miniature rather than generic game terrain.

The phase is not accepted merely because these instructions or its source files exist. Each task requires the stated evidence. Current progress lives in [the ledger](../state.json).

## P14-T01 — Create terrain and case foundations

Dependencies: P10-T04, P11-T03

Manual gate: none; planning estimate: 1–3 focused sessions; planning estimate, not a delivery promise. Estimates are not deadlines or completion claims.

### Read first

- [docs/graphics/ART_DIRECTION.md](../../docs/graphics/ART_DIRECTION.md)
- [docs/graphics/RENDERING_SPEC.md](../../docs/graphics/RENDERING_SPEC.md)
- [docs/product/INTERACTION_DESIGN.md](../../docs/product/INTERACTION_DESIGN.md)

### Owned scope

- `assets/source/environment/`
- `web/src/environment/`

### Deliverables

- Physical case/baseboard assets
- Terrain surface and placement bounds

### Implementation sequence

1. Model case thickness, hinges, latches and board edges.
2. Use consistent physical dimensions and contact relationships.
3. Create terrain that reads as a crafted miniature surface.
4. Define editable placement and forbidden boundary regions.
5. Keep case presentation separate from route simulation.

### Acceptance criteria

- **P14-T01-A1** — Case and terrain details remain plausible in overview and close-up captures.
  - Accepted evidence: visual_review.
- **P14-T01-A2** — Placement bounds prevent scenery from penetrating the case or blocking essential controls.
  - Accepted evidence: unit_test.

### Verification

- Inspect all visible case edges and opening views.
- Test placement at board corners and terrain boundaries.

### Failure cases and cautions

- Exaggerated tilt-shift cannot compensate for incorrect material scale.

### Handoff requirement

Record tested implementation SHA, changed scope, acceptance evidence, commands/results, unrun checks, blockers and the next exact task. Use [the handoff template](../../templates/HANDOFF.md). Update state through the project CLI, regenerate views, and push the metadata checkpoint.

## P14-T02 — Produce the village building kit

Dependencies: P14-T01

Manual gate: none; planning estimate: 1–3 focused sessions; planning estimate, not a delivery promise. Estimates are not deadlines or completion claims.

### Read first

- [docs/graphics/ART_DIRECTION.md](../../docs/graphics/ART_DIRECTION.md)
- [docs/graphics/ASSET_PIPELINE.md](../../docs/graphics/ASSET_PIPELINE.md)
- [docs/graphics/VISUAL_ACCEPTANCE.md](../../docs/graphics/VISUAL_ACCEPTANCE.md)

### Owned scope

- `assets/source/buildings/`
- `assets/runtime/buildings/`

### Deliverables

- Original coherent Alpine buildings
- Night-emissive and placement metadata

### Implementation sequence

1. Choose a restrained architecture/material palette.
2. Use door/window dimensions consistent with model scale.
3. Create roof, trim and glazing details at appropriate texel density.
4. Prepare economical interior/emissive variants.
5. Validate pivots, footprints and LOD silhouettes.

### Acceptance criteria

- **P14-T02-A1** — Buildings read as one coherent miniature collection with consistent scale and material treatment.
  - Accepted evidence: visual_review.
- **P14-T02-A2** — Every building includes approved footprint, pivot, LOD and nighttime metadata.
  - Accepted evidence: repository_validation.

### Verification

- Compare adjacent buildings with a reference scale figure.
- Inspect roof/window materials at grazing angles.

### Failure cases and cautions

- Random asset-pack mixing creates inconsistent physical scale and style.

### Handoff requirement

Record tested implementation SHA, changed scope, acceptance evidence, commands/results, unrun checks, blockers and the next exact task. Use [the handoff template](../../templates/HANDOFF.md). Update state through the project CLI, regenerate views, and push the metadata checkpoint.

## P14-T03 — Create foliage, rocks and small scenery details

Dependencies: P14-T01

Manual gate: none; planning estimate: 1–3 focused sessions; planning estimate, not a delivery promise. Estimates are not deadlines or completion claims.

### Read first

- [docs/graphics/ART_DIRECTION.md](../../docs/graphics/ART_DIRECTION.md)
- [docs/graphics/ASSET_PIPELINE.md](../../docs/graphics/ASSET_PIPELINE.md)
- [docs/graphics/PERFORMANCE_BUDGETS.md](../../docs/graphics/PERFORMANCE_BUDGETS.md)

### Owned scope

- `assets/source/scenery/`
- `web/src/environment/`

### Deliverables

- Foliage/rock/prop kit
- Spatially chunked instance strategy

### Implementation sequence

1. Design model-tree silhouettes and restrained color variation.
2. Use mipmapped alpha coverage without excessive overdraw.
3. Create small rocks and props with bounded variety.
4. Instance repeated assets in cullable spatial chunks.
5. Recompute instance bounds after edits.

### Acceptance criteria

- **P14-T03-A1** — Foliage stays stable in motion without severe alpha halos, shimmering or obvious repetition.
  - Accepted evidence: visual_review.
- **P14-T03-A2** — Dense scenery remains cullable and respects asset/overdraw budgets.
  - Accepted evidence: integration_test.

### Verification

- Inspect distant foliage and close-up silhouettes.
- Profile dense scene views from low camera angles.

### Failure cases and cautions

- One giant instance bound can defeat frustum culling.

### Handoff requirement

Record tested implementation SHA, changed scope, acceptance evidence, commands/results, unrun checks, blockers and the next exact task. Use [the handoff template](../../templates/HANDOFF.md). Update state through the project CLI, regenerate views, and push the metadata checkpoint.

## P14-T04 — Compose and review the launch diorama

Dependencies: P14-T02, P14-T03, P13-T04

Manual gate: none; planning estimate: 1–3 focused sessions; planning estimate, not a delivery promise. Estimates are not deadlines or completion claims.

### Read first

- [docs/graphics/ART_DIRECTION.md](../../docs/graphics/ART_DIRECTION.md)
- [docs/graphics/VISUAL_ACCEPTANCE.md](../../docs/graphics/VISUAL_ACCEPTANCE.md)
- [docs/product/PRODUCT_SPEC.md](../../docs/product/PRODUCT_SPEC.md)

### Owned scope

- `assets/layouts/`
- `evidence/`

### Deliverables

- Original launch layout composition
- Reference-matched environment review

### Implementation sequence

1. Arrange railway, village and landscape with readable focal points.
2. Keep train operation visible and important controls reachable.
3. Avoid scenery collisions and implausible floating placement.
4. Capture the documented overview and macro shot suite.
5. Record remaining lighting and editor dependencies honestly.

### Acceptance criteria

- **P14-T04-A1** — The launch composition passes scale, contact, readability and originality review.
  - Accepted evidence: visual_review.
- **P14-T04-A2** — The saved layout reproduces the same asset IDs and placements deterministically.
  - Accepted evidence: unit_test, integration_test.

### Verification

- Load the layout repeatedly and compare canonical placement data.
- Review all eight required visual viewpoints.

### Failure cases and cautions

- A beautiful fixed composition must still support valid user editing.

### Handoff requirement

Record tested implementation SHA, changed scope, acceptance evidence, commands/results, unrun checks, blockers and the next exact task. Use [the handoff template](../../templates/HANDOFF.md). Update state through the project CLI, regenerate views, and push the metadata checkpoint.
