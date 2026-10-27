# P25 — Launch content and final art sign-off

> Generated from planning/roadmap.json. Edit the JSON definition, then run `npm run project:render`.

## Outcome

Finish one coherent miniature railway kit at a quality the owner explicitly accepts.

## Exit gate

No placeholder content remains in release; actual-device captures and interaction footage meet the agreed art standard.

The phase is not accepted merely because these instructions or its source files exist. Each task requires the stated evidence. Current progress lives in [the ledger](../state.json).

## P25-T01 — Audit complete launch-content coverage

Dependencies: P13-T04, P14-T04, P18-T04, P19-T04

Manual gate: none; planning estimate: 1–3 focused sessions; planning estimate, not a delivery promise. Estimates are not deadlines or completion claims.

### Read first

- [docs/product/PRODUCT_SPEC.md](../../docs/product/PRODUCT_SPEC.md)
- [docs/graphics/ASSET_PIPELINE.md](../../docs/graphics/ASSET_PIPELINE.md)
- [docs/quality/RELEASE_GATES.md](../../docs/quality/RELEASE_GATES.md)

### Owned scope

- `assets/catalog.json`
- `assets/layouts/`
- `evidence/`

### Deliverables

- Launch-content coverage matrix
- Placeholder/deferred-feature exclusion report

### Implementation sequence

1. Compare the actual kit with approved product promises.
2. Check locomotive, track, buildings, scenery, lighting and audio variants.
3. Remove test primitives and developer-only palettes from release.
4. Verify deferred weather/features are absent from active promises.
5. Record any missing content as an explicit blocker.

### Acceptance criteria

- **P25-T01-A1** — Every release feature and palette entry maps to approved working content.
  - Accepted evidence: repository_validation, integration_test.
- **P25-T01-A2** — No diagnostic placeholder or unfinished feature is presented as completed launch content.
  - Accepted evidence: repository_validation.

### Verification

- Inspect a clean release-configured install and asset allowlist.
- Cross-check all advertised features against runtime behavior.

### Failure cases and cautions

- A hidden debug menu can accidentally expose unfinished assets.

### Handoff requirement

Record tested implementation SHA, changed scope, acceptance evidence, commands/results, unrun checks, blockers and the next exact task. Use [the handoff template](../../templates/HANDOFF.md). Update state through the project CLI, regenerate views, and push the metadata checkpoint.

## P25-T02 — Capture the final reproducible visual suite

Dependencies: P25-T01, P22-T04, P20-T04

Manual gate: none; planning estimate: 1–3 focused sessions; planning estimate, not a delivery promise. Estimates are not deadlines or completion claims.

### Read first

- [docs/graphics/VISUAL_ACCEPTANCE.md](../../docs/graphics/VISUAL_ACCEPTANCE.md)
- [docs/graphics/ART_DIRECTION.md](../../docs/graphics/ART_DIRECTION.md)
- [docs/quality/TEST_STRATEGY.md](../../docs/quality/TEST_STRATEGY.md)

### Owned scope

- `evidence/`

### Deliverables

- Full reference-vs-runtime capture suite
- Build/asset/camera provenance

### Implementation sequence

1. Use the required overview, macro, contact, night and case views.
2. Capture the actual packaged app on physical Duo.
3. Record build SHA, asset hashes, quality tier and camera settings.
4. Include moving interaction footage, not only still images.
5. Archive raw captures in durable approved storage with manifests.

### Acceptance criteria

- **P25-T02-A1** — Every required shot has traceable actual-runtime evidence at shipping quality.
  - Accepted evidence: device_test, visual_review.
- **P25-T02-A2** — Captures include interaction and motion checks revealing clipping, shimmer and LOD issues.
  - Accepted evidence: visual_review.

### Verification

- Reproduce a selected shot from its manifest.
- Verify screenshots are not concept art or synthetic device mockups.

### Failure cases and cautions

- Golden images without provenance cannot prove the shipped build's quality.

### Handoff requirement

Record tested implementation SHA, changed scope, acceptance evidence, commands/results, unrun checks, blockers and the next exact task. Use [the handoff template](../../templates/HANDOFF.md). Update state through the project CLI, regenerate views, and push the metadata checkpoint.

## P25-T03 — Resolve cross-system polish defects

Dependencies: P25-T02, P24-T04

Manual gate: none; planning estimate: 1–3 focused sessions; planning estimate, not a delivery promise. Estimates are not deadlines or completion claims.

### Read first

- [docs/graphics/VISUAL_ACCEPTANCE.md](../../docs/graphics/VISUAL_ACCEPTANCE.md)
- [docs/product/INTERACTION_DESIGN.md](../../docs/product/INTERACTION_DESIGN.md)
- [docs/graphics/PERFORMANCE_BUDGETS.md](../../docs/graphics/PERFORMANCE_BUDGETS.md)

### Owned scope

- `web/src/`
- `apps/ios/TinJunction/`
- `assets/`

### Deliverables

- Prioritized polish defect closure
- Revalidated affected gates

### Implementation sequence

1. Triage visual, audio and interaction defects by user impact.
2. Fix geometry/material issues at their source instead of hiding them.
3. Re-run affected performance and save tests after each fix.
4. Capture before/after evidence for resolved defects.
5. Freeze only after repeatable regressions are absent.

### Acceptance criteria

- **P25-T03-A1** — Every release-blocking polish defect is resolved with before/after evidence and regression checks.
  - Accepted evidence: visual_review, integration_test.
- **P25-T03-A2** — Polish changes do not invalidate the ratified sustained performance or persistence behavior.
  - Accepted evidence: device_test, integration_test.

### Verification

- Repeat the affected reference shots and benchmark workloads.
- Inspect saved-layout compatibility after asset changes.

### Failure cases and cautions

- Late visual tweaks can introduce memory or migration regressions.

### Handoff requirement

Record tested implementation SHA, changed scope, acceptance evidence, commands/results, unrun checks, blockers and the next exact task. Use [the handoff template](../../templates/HANDOFF.md). Update state through the project CLI, regenerate views, and push the metadata checkpoint.

## P25-T04 — Obtain owner approval of the real product experience

Dependencies: P25-T03, P23-T04, P17-T04

Manual gate: owner; planning estimate: 1–3 focused sessions; planning estimate, not a delivery promise. Estimates are not deadlines or completion claims.

### Read first

- [docs/quality/RELEASE_GATES.md](../../docs/quality/RELEASE_GATES.md)
- [docs/product/PRODUCT_SPEC.md](../../docs/product/PRODUCT_SPEC.md)
- [docs/graphics/VISUAL_ACCEPTANCE.md](../../docs/graphics/VISUAL_ACCEPTANCE.md)

### Owned scope

- `evidence/`
- `planning/`

### Deliverables

- Explicit owner art/product approval
- Approved residual limitations

### Implementation sequence

1. Present actual build footage and accessible device-testing route.
2. Show the complete creative/operating workflow.
3. Disclose unresolved nonblocking defects and deferred features.
4. Ask for explicit acceptance of quality and scope.
5. Record the owner's decision without fabricating approval.

### Acceptance criteria

- **P25-T04-A1** — The owner explicitly approves the actual release-intended experience and visual quality.
  - Accepted evidence: owner_approval.
- **P25-T04-A2** — Approved limitations and deferred features are recorded consistently in product and release documents.
  - Accepted evidence: owner_approval.

### Verification

- Verify approval references the exact reviewed build or unchanged content digest.
- Reopen approval if material appearance or scope changes.

### Failure cases and cautions

- An agent cannot self-approve the owner's artistic quality gate.

### Handoff requirement

Record tested implementation SHA, changed scope, acceptance evidence, commands/results, unrun checks, blockers and the next exact task. Use [the handoff template](../../templates/HANDOFF.md). Update state through the project CLI, regenerate views, and push the metadata checkpoint.
