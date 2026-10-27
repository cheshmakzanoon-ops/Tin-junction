# Asset pipeline — source, rights, geometry, and runtime proof

Status: **PROPOSED implementation specification**. The initial [catalog](../../assets/catalog.json) is deliberately empty. Empty setup data is not permission to claim the game has production assets.

Read [art direction](ART_DIRECTION.md), [rendering](RENDERING_SPEC.md), [visual acceptance](VISUAL_ACCEPTANCE.md), [performance budgets](PERFORMANCE_BUDGETS.md) and [the asset directory contract](../../assets/README.md).

## 1. Pipeline and authority

The approved flow is:

1. Source/reference rights review.
2. Dimension, scale, pivot and silhouette design.
3. Editable master creation.
4. Geometry/material/UV checks.
5. glTF/GLB export.
6. Controlled optimization and LOD creation.
7. Texture compression and mip generation.
8. Khronos structural validation plus project-specific validation.
9. Actual bundled loader fixture and visual comparison.
10. Device performance and art review.
11. Manifest approval and release inclusion.

Each stage produces evidence and can reject the asset. Export success is not art approval. Structural validity is not correct appearance. A good screenshot is not a licence.

The catalog assigns immutable logical IDs. Native layouts store those IDs and version-compatible configuration, not absolute file paths or Three.js objects. File hashes identify exact bytes. Updating an asset must preserve semantic sockets and dimensions or include an explicit migration.

## 2. Storage layout and repository hygiene

Proposed directory roles, created when needed:

```text
assets/
  catalog.json
  catalog.schema.json
  references/             rights records and links; licensed imagery only
  source/                 editable masters, generation scripts, source manifests
  runtime/                reviewed export products for app bundling
  fixtures/               tiny deterministic loader/calibration fixtures
  reports/                compact validation metadata; large captures elsewhere
```

The initial setup does not create pretend runtime binaries or third-party textures. Large binaries require an explicit storage/LFS decision before first addition. Keep generated intermediates, caches, tools, dependencies and huge captures outside ordinary Git.

Every externally stored file still needs a content hash, retrieval/version instructions, rights record and reproducible release input. A personal desktop path or expiring URL is not a durable asset source.

The native packaging step consumes only a validated allowlist from the approved catalog. It does not recursively copy an artist's working directory into the app.

## 3. Identity and naming

Use lowercase stable IDs with category-oriented names, for example `locomotive.steam.001`. This is a naming example, not a claim that the asset exists. Do not encode a mutable UI display name into saved identity.

Suggested file naming:

- Master: `<asset-id>__v<version>.blend`.
- Runtime: `<asset-id>__lod<level>__<short-hash>.glb`.
- Material atlas: `<asset-id>__<semantic>__<resolution>__<short-hash>.ktx2`.
- Validation report: `<asset-id>__<version>__validation.json`.
- Capture set: `<asset-id>__<version>__<preset>__<camera-id>`.

Avoid spaces and case-only distinctions in paths. Paths must remain inside approved asset roots. URL parameters, traversal components, symlinks to untracked content and platform-specific absolute paths are rejected.

## 4. Provenance and licensing

Each asset record needs:

| Field | Purpose |
| --- | --- |
| Author/source owner | Person or organisation that created the source |
| Origin | Original, licensed, or public-domain basis |
| Licence identifier/text link | Actual governing terms; not “found online” |
| Rights record | Repository path to permission and attribution requirements |
| Redistribution permission | Whether bytes may ship in the app/repo |
| Derivative permission | Whether modifications are allowed |
| Source URL(s) | Traceable origin, where applicable |
| Verification date/reviewer | Who checked which terms and when |

For commissioned/original work, record ownership/assignment or the applicable contributor agreement. For public-domain claims, record the jurisdiction/source basis instead of assuming age implies unrestricted use. For generated assets, retain generation provenance and review recognisable third-party marks or copied-looking material.

Commercial reference photos may be linked for research without being copied into the repo. The rights record must distinguish “may view as reference” from “may redistribute in app”. Do not ship copied railway liveries, logos, sound recordings or models because the simulated railway is fictional.

If rights are unclear: keep the task blocked, do not approve the catalog entry, and substitute original work only through the normal review process. An agent cannot grant rights it does not own.

## 5. Coordinate and dimensional contract

Confirm the shared scale ADR before building the kit. Proposed baseline:

- Right-handed coordinates, Y up, XZ ground.
- One world unit = one physical model-world metre.
- Locomotive local forward +Z.
- HO-style 1:87 kit and 0.0165 m track gauge.
- 0.8 m × 0.5 m starter board, subject to design validation.

These dimensions are design targets, not iPhone hardware measurements. Keep prototype-to-model conversion explicit. The artist must apply intended object transforms before export and retain a reproducible conversion recipe. Negative scale and mirrored tangents require deliberate correction/testing, not silent acceptance.

For every geometric asset record:

1. World-space bounding box and intended dimensions.
2. Root pivot and forward/up convention.
3. Connection/socket transforms.
4. Collision/clearance proxy independent of visual LOD.
5. Minimum supported curvature/clearance, where applicable.
6. Model-scale ratio used in reference conversion.

## 6. Family-specific authoring contracts

### 6.1 Locomotive and rolling stock

- Root pivot at the documented reference position, consistently used by the simulation.
- Named transforms for axles, bogies, wheels, rods, pistons, couplers and effects origins.
- Wheel radius/axle coordinates agree with metadata and track-contact tests.
- Coupler sockets retain exact coordinates across LODs.
- Moving mechanisms are separable and have correct authored pivots.
- Distinguish wheel-spin, bogie-yaw, rod linkage and presentation-only vibration channels.
- Geometry includes supported underside/cab views; inaccessible interior detail is not a budget priority.
- Decals and fictional numbering do not require a unique giant texture per train.
- Each mechanism has a reference capture and a maximum-envelope test on the minimum curve.

### 6.2 Track and points

- Shared rail profile and track gauge across all modules.
- End sockets encode position, tangent, up direction and gauge compatibility.
- Rails join without visible gaps or overlapping z-fighting surfaces.
- Sleeper spacing does not abruptly reset at every curved segment.
- Turnout blade and frog geometry agrees with the simulation's available paths.
- Guard rails/clearance and collision boundaries are inspected at wheel height.
- Decorative ballast remains separate from authoritative path topology.
- Track-length information is computed from the authoritative geometry contract, not hand-entered to conceal errors.

### 6.3 Buildings and scenery

- Base pivot lies on the approved placement surface; foundation and overhang envelopes are explicit.
- Roof edges/walls have useful physical thickness.
- Interior/window cheats are documented and survive all allowed camera positions.
- Footprint collision proxy prevents accidental placement through rail clearance.
- Local AO is separated from placement-dependent shadows.
- Material/texture density is consistent with the rest of the kit.
- Terrain contact has a designed solution; no floating generic bounding-box placement.

### 6.4 Vegetation, ballast and repeated detail

- Produce low-overdraw silhouettes before dense alpha cards.
- Provide shared materials and variation attributes suitable for instancing.
- Author useful LODs and conservative bounds for animated foliage.
- Test mip stability during slow camera motion.
- Use geometry where close-up silhouette warrants it, not one mesh per invisible stone.

### 6.5 Case

- Explicit hinge/frame/lid pivots and closure envelope.
- Frame/lining thickness survives macro inspection.
- Parts that must fold/retract have plausible mechanisms or authored presentation rules.
- Case dimensions are scene parameters; they cannot infer unverified phone sensors.
- Material wear matches the intended cared-for object, not a random grunge generator.

## 7. UV, texture and material rules

- Consistent texel density chosen for the supported camera range; specify a numeric project target after the scale fixture, not independently per artist.
- Atlas padding accounts for the full mip pyramid; inspect lower mips for bleeding.
- No lighting, specular reflection or cast shadow in base colour.
- Base/emissive colour have sRGB intent; normal/roughness/metallic/AO/masks are non-colour.
- Document packed channel order. For standard glTF metallic-roughness, validate the expected channel interpretation rather than guessing from filenames.
- Normal-map orientation/tangents must match exporter and renderer conventions.
- Share materials/atlases where it reduces submissions without creating impossible edit coupling.
- Texture dimensions are justified by screen contribution. Start with 2K hero and 1K scenery ceilings; 4K+ requires measured benefit and budget approval.
- Preserve lossless editable source maps separately from compressed runtime textures.
- Transparency mode is explicit; avoid accidental blended materials from opaque exports.

No texture may be approved solely because it looks attractive in Blender. Use the app's lighting and output pipeline for review.

## 8. Geometry optimization and LOD

Optimization order:

1. Remove invisible duplicate/internal geometry that has no supported visual purpose.
2. Weld/clean only where normals, UV seams and mechanical separation remain correct.
3. Reduce material splits and duplicate textures.
4. Preserve hero silhouette and mechanical pivots.
5. Create distinct LOD meshes with matched sockets/bounds.
6. Apply geometry compression supported by the exact loader version.
7. Compare before/after frames at supported camera distances.

Do not apply a blind percentage decimator and call the result approved. LOD acceptance is based on silhouette, shading, motion and transition stability. Document authored triangle/material counts and expected screen-size ranges for each level.

Keep collision/track-clearance proxies independent of visible simplification. Instances need identity/picking maps and spatial chunking; baking every repeated object into one giant mesh can destroy editability and culling.

## 9. glTF compression and decoder compatibility

Use glTF 2.0/GLB as the geometry/material interchange. Use KTX2/Basis where the pinned runtime supports it. Bundle decoder JS/WASM and all required assets offline.

Loader integration requirements:

- Configure `GLTFLoader.setKTX2Loader()` with a tested KTX2 loader.
- Run `KTX2Loader.detectSupport(renderer)` before loading compressed textures.
- Supply the pinned meshopt decoder via `setMeshoptDecoder()` for supported meshopt assets.
- Validate required glTF extensions against a committed allowlist derived from the exact loader version.
- Test decoding inside the real WKWebView packaging/origin, not only a desktop localhost server.

Khronos documents both `EXT_meshopt_compression` and the newer `KHR_meshopt_compression`. Do not blindly emit the latest exporter default: the currently retrieved GLTFLoader documentation explicitly describes EXT support. Adopt the KHR form only after a pinned loader fixture demonstrates support. Decoder and export-tool upgrades are coordinated changes with fixture review.

Use complete mip chains. Prefer higher-quality texture encoding where normal/roughness/hero detail suffers; use smaller encodings for suitable distant colour textures. Compare texture errors in motion, on grazing rails and under neutral lighting.

Do not report package bytes as resident GPU bytes. Record source, compressed, decoded/estimated GPU and loading peak costs separately.

## 10. Validation layers

| Layer | Required checks | Evidence |
| --- | --- | --- |
| Catalog | Schema, IDs, versions, file hashes, rights, states | Catalog validation report |
| Paths | Allowed roots, no traversal, bounded size, expected media type | Packaging report |
| glTF | Khronos validator errors/warnings, extension support | JSON validator report |
| Geometry | Bounds, finite transforms, scale, pivots, normals, sockets | Project asset report |
| Textures | Dimensions, colour semantics, mip count, alpha, compression | Texture report |
| Runtime | Actual loader/decode, offline behavior, error recovery | App fixture run |
| Visual | Reference match, LOD, contact, materials and lighting | Approved capture/review |
| Performance | Draw calls, resource costs, load/transcode, device soak | Device metrics |

Warnings are triaged individually. A blanket ignore flag is prohibited. Record accepted warnings with exact code/reason/asset version and expiry or review condition.

Negative fixtures should include corrupted GLB header, unsupported required extension, missing texture, invalid/traversing URI, oversized asset, malformed transform and incompatible catalog version. Import failures must preserve the user's existing layout and offer a useful error.

## 11. Promotion and release manifest

Catalog stages:

- `planned`: requirements only; no claim of usable bytes.
- `prototype`: engineering asset, not approved for final appearance.
- `review`: exported, validated candidate awaiting specified reviewers.
- `approved`: rights, technical and visual criteria met with evidence.
- `retired`: no longer selectable for new layouts; compatibility policy retained.

Only approved runtime records enter a release manifest. A development build may intentionally load a prototype, but its environment/capture metadata must say so. Production packaging fails if the mandatory hero/track/case set is missing, not quietly substitutes placeholders.

Promotion records include task ID, asset ID/version, commit, tool versions, reviewer, outcome, outstanding constraints, validation artifacts, runtime captures and real-device evidence where required. Never use an unexplained completion percentage.

## 12. Updating an asset used in saved layouts

Before replacing approved bytes:

1. Identify affected stable IDs and saved-layout schema assumptions.
2. Compare bounds, sockets, scale, collision footprint and supported options.
3. Determine whether the replacement is compatible or needs migration/new ID.
4. Load representative old layouts, including tight track/scenery clearances.
5. Run animation/contact and visual regression tests.
6. Keep a last-known-good release input and rollback path.
7. Record the decision and update hashes/version/evidence together.

An asset visual upgrade must not detach track connections, move a user's station, or invalidate a saved train without an explicit compatible migration.

## 13. Handoff for an asset task

Leave the source location, rights status, exact export command/settings, tool versions, output hashes, validator results, rejected experiments, screenshots, reviewer notes, known visual/performance defects, and precise next step. “Model done” is not a handoff.

## 14. Primary sources

- [glTF 2.0 specification](https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html)
- [Khronos glTF Validator](https://github.com/KhronosGroup/glTF-Validator)
- [Three.js GLTFLoader](https://threejs.org/docs/pages/GLTFLoader)
- [Three.js KTX2Loader](https://threejs.org/docs/pages/KTX2Loader.html)
- [KHR_texture_basisu](https://github.com/KhronosGroup/glTF/blob/main/extensions/2.0/Khronos/KHR_texture_basisu/README.md)
- [EXT_meshopt_compression](https://github.com/KhronosGroup/glTF/blob/main/extensions/2.0/Vendor/EXT_meshopt_compression/README.md)
- [KHR_meshopt_compression](https://github.com/KhronosGroup/glTF/blob/main/extensions/2.0/Khronos/KHR_meshopt_compression/README.md)

Commands and flags must be verified against pinned installed tools before becoming executable CI requirements.
