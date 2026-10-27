# P11 — Renderer foundation and material calibration

> Generated from planning/roadmap.json. Edit the JSON definition, then run `npm run project:render`.

## Outcome

Create a disciplined, measurable rendering baseline for a photographed physical model.

## Exit gate

The renderer has explicit lifecycle, linear color, calibrated materials and bounded resource ownership.

The phase is not accepted merely because these instructions or its source files exist. Each task requires the stated evidence. Current progress lives in [the ledger](../state.json).

## P11-T01 — Ratify renderer backend and capability policy

Dependencies: P01-T02, P10-T03

Manual gate: none; planning estimate: 1–3 focused sessions; planning estimate, not a delivery promise. Estimates are not deadlines or completion claims.

### Read first

- [docs/graphics/RENDERING_SPEC.md](../../docs/graphics/RENDERING_SPEC.md)
- [docs/graphics/PERFORMANCE_BUDGETS.md](../../docs/graphics/PERFORMANCE_BUDGETS.md)
- [docs/architecture/SYSTEM_ARCHITECTURE.md](../../docs/architecture/SYSTEM_ARCHITECTURE.md)

### Owned scope

- `web/src/rendering/`
- `docs/decisions/`

### Deliverables

- Backend ADR
- Capability/initialization diagnostics

### Implementation sequence

1. Keep WebGL2 as the initial validated baseline.
2. Inventory the packaged origin's actual graphics capabilities.
3. Evaluate WebGPU only as a bounded separate spike.
4. Do not mix incompatible material/postprocessing APIs.
5. Define unsupported-context UI and context-loss recovery.

### Acceptance criteria

- **P11-T01-A1** — The selected backend initializes in the packaged host and has an explicit unsupported-context path.
  - Accepted evidence: integration_test.
- **P11-T01-A2** — The ADR records measured compatibility rather than assuming Safari support proves WKWebView support.
  - Accepted evidence: source_verification, integration_test.

### Verification

- Run context creation and deliberate context-loss fixtures.
- Record the exact renderer, browser engine and app build.

### Failure cases and cautions

- An experimental backend must not silently replace a proven baseline.

### Handoff requirement

Record tested implementation SHA, changed scope, acceptance evidence, commands/results, unrun checks, blockers and the next exact task. Use [the handoff template](../../templates/HANDOFF.md). Update state through the project CLI, regenerate views, and push the metadata checkpoint.

## P11-T02 — Implement linear color and output calibration

Dependencies: P11-T01

Manual gate: none; planning estimate: 1–3 focused sessions; planning estimate, not a delivery promise. Estimates are not deadlines or completion claims.

### Read first

- [docs/graphics/RENDERING_SPEC.md](../../docs/graphics/RENDERING_SPEC.md)
- [docs/graphics/ART_DIRECTION.md](../../docs/graphics/ART_DIRECTION.md)
- [docs/graphics/VISUAL_ACCEPTANCE.md](../../docs/graphics/VISUAL_ACCEPTANCE.md)

### Owned scope

- `web/src/rendering/`
- `tests/fixtures/rendering/`

### Deliverables

- Color calibration room
- Single tone-mapping/output path

### Implementation sequence

1. Classify color and non-color textures explicitly.
2. Ensure lighting calculations stay in linear space.
3. Define SDR output and exposure conventions.
4. Apply final output conversion exactly once.
5. Compare gray cards, primaries and emissive fixtures.

### Acceptance criteria

- **P11-T02-A1** — Calibration fixtures match the documented color pipeline without double gamma or hidden exposure compensation.
  - Accepted evidence: unit_test, visual_review.
- **P11-T02-A2** — Postprocessing and direct rendering produce consistent intended output under the same calibration settings.
  - Accepted evidence: visual_review.

### Verification

- Capture neutral cards with postprocessing enabled and disabled.
- Check non-color masks and normal maps are not sRGB-decoded.

### Failure cases and cautions

- Plausible-looking exposure can conceal an incorrect color pipeline.

### Handoff requirement

Record tested implementation SHA, changed scope, acceptance evidence, commands/results, unrun checks, blockers and the next exact task. Use [the handoff template](../../templates/HANDOFF.md). Update state through the project CLI, regenerate views, and push the metadata checkpoint.

## P11-T03 — Build the shared physical material library

Dependencies: P11-T02, P10-T01

Manual gate: none; planning estimate: 1–3 focused sessions; planning estimate, not a delivery promise. Estimates are not deadlines or completion claims.

### Read first

- [docs/graphics/ART_DIRECTION.md](../../docs/graphics/ART_DIRECTION.md)
- [docs/graphics/RENDERING_SPEC.md](../../docs/graphics/RENDERING_SPEC.md)
- [docs/graphics/ASSET_PIPELINE.md](../../docs/graphics/ASSET_PIPELINE.md)

### Owned scope

- `web/src/materials/`
- `assets/materials/`

### Deliverables

- Versioned enamel, rail, brass, timber and scenery recipes
- Neutral-light material swatches

### Implementation sequence

1. Create reusable recipes with source/reference links.
2. Distinguish dielectric paint from exposed metallic surfaces.
3. Use physical-material extensions only where visibly justified.
4. Separate baked lighting from albedo and movable-object materials.
5. Inspect roughness, edge wear and normal response in motion.

### Acceptance criteria

- **P11-T03-A1** — Each launch material has documented parameters and reference-matched neutral-light captures.
  - Accepted evidence: visual_review.
- **P11-T03-A2** — Material variants stay inside the agreed texture and shader-feature budgets.
  - Accepted evidence: repository_validation.

### Verification

- Review swatches from front, grazing and close-up angles.
- Measure expensive feature toggles individually.

### Failure cases and cautions

- Random dirt and excessive clearcoat undermine miniature realism.

### Handoff requirement

Record tested implementation SHA, changed scope, acceptance evidence, commands/results, unrun checks, blockers and the next exact task. Use [the handoff template](../../templates/HANDOFF.md). Update state through the project CLI, regenerate views, and push the metadata checkpoint.

## P11-T04 — Implement resource ownership and scene disposal

Dependencies: P11-T03

Manual gate: none; planning estimate: 1–3 focused sessions; planning estimate, not a delivery promise. Estimates are not deadlines or completion claims.

### Read first

- [docs/graphics/RENDERING_SPEC.md](../../docs/graphics/RENDERING_SPEC.md)
- [docs/graphics/PERFORMANCE_BUDGETS.md](../../docs/graphics/PERFORMANCE_BUDGETS.md)
- [docs/quality/TEST_STRATEGY.md](../../docs/quality/TEST_STRATEGY.md)

### Owned scope

- `web/src/assets/`
- `web/src/rendering/`

### Deliverables

- Reference-counted shared resources
- Repeat-load/disposal regression

### Implementation sequence

1. Define ownership for geometry, textures, materials and render targets.
2. Reuse shared resources without accidental double disposal.
3. Release image bitmaps and decoder resources explicitly.
4. Dispose transient scene and editor preview allocations.
5. Repeat layout replacement and inspect resource counts.

### Acceptance criteria

- **P11-T04-A1** — Repeated scene load/unload returns tracked resources to the expected baseline.
  - Accepted evidence: unit_test, integration_test.
- **P11-T04-A2** — Disposing one instance does not break another instance sharing its asset.
  - Accepted evidence: unit_test.

### Verification

- Run repeated replacement cycles with asset reuse.
- Track texture/render-target counts and inspect native process memory separately.

### Failure cases and cautions

- Removing an object from a scene does not free GPU resources.

### Handoff requirement

Record tested implementation SHA, changed scope, acceptance evidence, commands/results, unrun checks, blockers and the next exact task. Use [the handoff template](../../templates/HANDOFF.md). Update state through the project CLI, regenerate views, and push the metadata checkpoint.
