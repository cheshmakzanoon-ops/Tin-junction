# Asset workspace

This directory starts with an **empty catalog** and policies. There are no implied production meshes, textures, sound effects, licensed references or device screenshots. Do not create fake manifest entries to make the project appear more complete.

Read [asset pipeline](../docs/graphics/ASSET_PIPELINE.md), [art direction](../docs/graphics/ART_DIRECTION.md), [rendering](../docs/graphics/RENDERING_SPEC.md), [visual acceptance](../docs/graphics/VISUAL_ACCEPTANCE.md) and [performance budgets](../docs/graphics/PERFORMANCE_BUDGETS.md).

## Catalog contract

- `catalog.json` is the human-reviewed identity/provenance/quality inventory.
- `catalog.schema.json` defines its structural contract using JSON Schema 2020-12.
- Stable asset IDs are saved by the application; paths/hashes identify exact build inputs.
- Stages are `planned`, `prototype`, `review`, `approved` and `retired`.
- Only approved entries may ship in a release manifest.
- The empty catalog is valid **for repository setup only**. A production packaging gate must reject missing mandatory locomotive, track, case and scenery content.

Schema validation alone cannot prove that files exist, hashes match, permissions are legally sufficient, or images look correct. The pipeline needs semantic validation and actual reviewer evidence too. It must also check unique logical IDs/socket names/LOD levels, bounds ordering, unit-vector directions, matching runtime paths and allowed extensions. Approved records structurally require rights, technical, art and device review outcomes; those records must represent real reviews, not automatically generated approvals.

## Planned folders

| Folder | Purpose | Policy |
| --- | --- | --- |
| `references/` | Source links, rights records and permitted reference material | No unlicensed image downloads |
| `source/` | Editable models, source textures and generation scripts | Decide LFS/controlled storage before large files |
| `runtime/` | Approved GLB/KTX2 and other bundled resources | Content-addressed and offline |
| `fixtures/` | Tiny loader/material/geometry test assets | Provenance and deterministic expected behavior |
| `reports/` | Compact asset validation metadata | Large captures stay in artifact storage |

Create folders only as useful work arrives. No `.blend`, `.glb`, texture or audio file exists merely because its proposed name appears in documentation.

## Adding a real asset

1. Select/claim the relevant existing task through the project workflow.
2. Read the applicable family contract and establish rights/source ownership.
3. Create source files and document dimensions, pivots and material intent.
4. Export using pinned tools; hash the actual source/runtime files.
5. Add the catalog entry with factual stage/quality status.
6. Run structural and semantic validation plus the actual runtime fixture.
7. Capture required reference views and motion evidence.
8. Obtain the required review before promoting to `approved`.
9. Commit source/manifests/evidence links together and leave a reproducible handoff.

Do not rename an asset ID already used in saved layouts. Supersede or migrate according to the compatibility policy.

## Scale

Right-handed, Y up, XZ ground, physical model-world metres; locomotive authored forward +Z. The proposed starter kit is 1:87, gauge 0.0165 m, board 0.8 m × 0.5 m, ratified by the architecture scale fixture. These are design dimensions, not device facts.

## Security

Reject traversal, absolute external paths, unexpected schemes, malformed input, unknown required extensions and excessive sizes. Runtime asset loading is allowlisted and offline. Never expose an arbitrary filesystem path through the native bridge.
