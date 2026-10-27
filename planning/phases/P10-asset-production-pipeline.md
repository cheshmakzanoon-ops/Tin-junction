# P10 — Reproducible 3D asset pipeline

> Generated from planning/roadmap.json. Edit the JSON definition, then run `npm run project:render`.

## Outcome

Turn licensed source material into validated, budgeted runtime assets with traceable provenance.

## Exit gate

No runtime asset enters a release bundle without dimensions, license, toolchain, hash and loader evidence.

The phase is not accepted merely because these instructions or its source files exist. Each task requires the stated evidence. Current progress lives in [the ledger](../state.json).

## P10-T01 — Assemble licensed references and the asset catalog

Dependencies: P00-T04, P04-T01

Manual gate: none; planning estimate: 1–3 focused sessions; planning estimate, not a delivery promise. Estimates are not deadlines or completion claims.

### Read first

- [docs/graphics/ASSET_PIPELINE.md](../../docs/graphics/ASSET_PIPELINE.md)
- [docs/graphics/ART_DIRECTION.md](../../docs/graphics/ART_DIRECTION.md)
- [docs/graphics/VISUAL_ACCEPTANCE.md](../../docs/graphics/VISUAL_ACCEPTANCE.md)

### Owned scope

- `assets/catalog.json`
- `assets/references/`
- `assets/source/`

### Deliverables

- Reference/provenance registry
- Prioritized launch-kit asset list

### Implementation sequence

1. List case, locomotive, track, architecture and foliage references.
2. Record creator, rights, source URL and permitted use.
3. Separate inspiration references from redistributable assets.
4. Assign immutable asset IDs and owners.
5. Record measured dimensions versus estimated artistic dimensions.

### Acceptance criteria

- **P10-T01-A1** — Each accepted reference/asset has a concrete rights record and stable ID.
  - Accepted evidence: repository_validation.
- **P10-T01-A2** — The catalog identifies required launch assets and clearly marks unproduced entries.
  - Accepted evidence: repository_validation.

### Verification

- Validate catalog schema and referenced paths.
- Review that commercial train brands and ripped assets are not included.

### Failure cases and cautions

- Publicly visible images are not automatically licensed for redistribution.

### Handoff requirement

Record tested implementation SHA, changed scope, acceptance evidence, commands/results, unrun checks, blockers and the next exact task. Use [the handoff template](../../templates/HANDOFF.md). Update state through the project CLI, regenerate views, and push the metadata checkpoint.

## P10-T02 — Build Blender export and geometry validation rules

Dependencies: P10-T01

Manual gate: none; planning estimate: 1–3 focused sessions; planning estimate, not a delivery promise. Estimates are not deadlines or completion claims.

### Read first

- [docs/graphics/ASSET_PIPELINE.md](../../docs/graphics/ASSET_PIPELINE.md)
- [docs/graphics/ART_DIRECTION.md](../../docs/graphics/ART_DIRECTION.md)
- [docs/architecture/SIMULATION_AND_TRACKS.md](../../docs/architecture/SIMULATION_AND_TRACKS.md)

### Owned scope

- `assets/source/`
- `tools/assets/`
- `tests/fixtures/assets/`

### Deliverables

- Documented exporter preset
- Scale/pivot/UV/normal validation

### Implementation sequence

1. Pin Blender/export tooling and document the exact export procedure.
2. Apply model-meter dimensions and consistent axes.
3. Validate wheel pivots, track sockets and collision proxies.
4. Check transforms, UVs, normals and material assignments.
5. Export a minimal original fixture through the full pipeline.

### Acceptance criteria

- **P10-T02-A1** — The exported fixture preserves scale, pivots and orientation without compensating runtime transforms.
  - Accepted evidence: unit_test, integration_test.
- **P10-T02-A2** — Invalid source geometry fails validation with asset-specific diagnostics.
  - Accepted evidence: unit_test.

### Verification

- Round-trip known ruler, axle and track socket fixtures.
- Run Khronos glTF validation on accepted output.

### Failure cases and cautions

- Artist-local export settings are not reproducible build inputs.

### Handoff requirement

Record tested implementation SHA, changed scope, acceptance evidence, commands/results, unrun checks, blockers and the next exact task. Use [the handoff template](../../templates/HANDOFF.md). Update state through the project CLI, regenerate views, and push the metadata checkpoint.

## P10-T03 — Implement texture compression and extension compatibility checks

Dependencies: P10-T02, P01-T02

Manual gate: none; planning estimate: 1–3 focused sessions; planning estimate, not a delivery promise. Estimates are not deadlines or completion claims.

### Read first

- [docs/graphics/ASSET_PIPELINE.md](../../docs/graphics/ASSET_PIPELINE.md)
- [docs/graphics/RENDERING_SPEC.md](../../docs/graphics/RENDERING_SPEC.md)
- [docs/graphics/PERFORMANCE_BUDGETS.md](../../docs/graphics/PERFORMANCE_BUDGETS.md)

### Owned scope

- `tools/assets/`
- `web/src/assets/`
- `tests/fixtures/assets/`

### Deliverables

- Pinned texture/mesh optimization pipeline
- Supported glTF extension allowlist

### Implementation sequence

1. Generate complete mipmaps with correct color-space metadata.
2. Choose compression per normal, color and mask texture.
3. Bundle matching KTX2 and mesh decoder resources.
4. Reject unsupported required glTF extensions before packaging.
5. Compare compressed/uncompressed material fixtures in the native host.

### Acceptance criteria

- **P10-T03-A1** — Every emitted extension and compression format passes the exact pinned runtime loader fixtures.
  - Accepted evidence: unit_test, integration_test.
- **P10-T03-A2** — Compression captures reveal no unacceptable normal, alpha or roughness artifacts at target viewing scales.
  - Accepted evidence: visual_review.

### Verification

- Load compressed fixtures offline inside packaged WKWebView.
- Inspect grazing-angle normal maps and distant foliage mipmaps.

### Failure cases and cautions

- A newer exporter may emit KHR variants unsupported by the pinned loader.

### Handoff requirement

Record tested implementation SHA, changed scope, acceptance evidence, commands/results, unrun checks, blockers and the next exact task. Use [the handoff template](../../templates/HANDOFF.md). Update state through the project CLI, regenerate views, and push the metadata checkpoint.

## P10-T04 — Automate asset budgets and provenance enforcement

Dependencies: P10-T03

Manual gate: none; planning estimate: 1–3 focused sessions; planning estimate, not a delivery promise. Estimates are not deadlines or completion claims.

### Read first

- [docs/graphics/ASSET_PIPELINE.md](../../docs/graphics/ASSET_PIPELINE.md)
- [docs/graphics/PERFORMANCE_BUDGETS.md](../../docs/graphics/PERFORMANCE_BUDGETS.md)
- [docs/quality/RELEASE_GATES.md](../../docs/quality/RELEASE_GATES.md)

### Owned scope

- `tools/assets/`
- `assets/catalog.json`
- `.github/workflows/`

### Deliverables

- Asset validation report
- Release allowlist and stale-hash rejection

### Implementation sequence

1. Extract triangle, material, texture and extension statistics.
2. Record runtime hashes and source/tool version provenance.
3. Enforce LOD and size budget review thresholds.
4. Reject missing licenses, source references and stale catalog hashes.
5. Keep heavyweight source files in approved storage rather than accidental Git blobs.

### Acceptance criteria

- **P10-T04-A1** — CI rejects missing provenance, unsupported extensions and mismatched runtime hashes.
  - Accepted evidence: unit_test, repository_validation.
- **P10-T04-A2** — The release asset allowlist excludes placeholders and unapproved references.
  - Accepted evidence: repository_validation.

### Verification

- Inject broken license, hash and extension fixtures into isolated test catalogs.
- Verify release bundles match the approved manifest exactly.

### Failure cases and cautions

- Compressed download size is not GPU resident memory.

### Handoff requirement

Record tested implementation SHA, changed scope, acceptance evidence, commands/results, unrun checks, blockers and the next exact task. Use [the handoff template](../../templates/HANDOFF.md). Update state through the project CLI, regenerate views, and push the metadata checkpoint.
