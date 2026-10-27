# Original miniature export calibration fixture

Task P10-T02. Asset ID `fixture.calibration.001`. This is original engineering geometry, **not launch art, a production train, or a physical-device performance result**. The editable master is [export_fixture.py](export_fixture.py); no third-party mesh, font, photo or texture was used. Optional `.blend` output can be generated locally from that source; it is not needed in Git.

## Actual toolchain and source verification

Verified locally on 2026-10-27: Blender **4.3.2**, bundled Khronos glTF Blender I/O **4.3.47**. The generator rejects any other Blender version. Version upgrades require a new exporter review and byte/geometry comparisons, not a silent pin change.

The [official Blender v4.3.2 exporter source](https://raw.githubusercontent.com/blender/blender/v4.3.2/scripts/addons_core/io_scene_gltf2/__init__.py) was inspected to verify the bundled addon version and relevant export options. Installed RNA properties were queried before running. The Blender manual endpoint could not be retrieved in this research environment; no successful manual read is claimed.

The explicit export preset uses GLB, Y-up conversion, applied modifiers, normals/UVs, material export and extras. Animations, lights, cameras, tangents and Draco compression are off. Textures and decoders are deliberately outside this fixture. Export settings and the generator/runtime hashes are written to `calibration.source-report.json` beside the actual GLB.

The exporter logs an unavailable optional Draco library during its capability probe on this machine. This fixture requests no Draco compression and emits no extensions; actual export succeeds. This is not proof that a compressed loader works. P10-T03 must test any future compression path separately.

## Dimension and pivot contract

All values are authored **physical-model metres**, not measured objects. Blender unit scale is 1. Export converts authoring `(x, y, z)` to runtime `(x, z, -y)`. No corrective Three.js scale/rotation is permitted.

| Object | Runtime contract |
| --- | --- |
| Root | Origin; identity rotation and scale; asset ID and unit metadata |
| Ruler | 0.010 × 0.004 × 0.100 m in X/Y/Z; centered local mesh; world center `(0, .002, .05)` |
| Marks | Eleven 10 mm-spaced positions; first/last mark offset 0.2 mm inward to remain on the ruler |
| Axle | Axis +X, length .0175 m, diameter .012 m; pivot `(0, .020, .050)` |
| Track sockets | `socket.start` at origin; `socket.end` at `(0, 0, .100)`; establishes +Z forward |
| Axle sockets | `socket.axle.left/right` at X ±.00875, Y .020, Z .050 |
| Asymmetric marker | At positive X/Z to expose axis flips without fonts or labels |

This is not a wheelset: axle endpoints demonstrate the project's authored rail-center separation, not complete wheel/flange clearance. Production assets need their own dimensional envelopes and socket definitions.

Three simple linear-base-color PBR materials distinguish dielectric, dark markings and metal. Materials are single-sided so reversed geometry cannot hide behind backface rendering. Meshes have finite normals, nondegenerate outward-wound closed triangles and complete UVs. The fixture contains 14 meshes, 280 triangles and four sockets.

## Reproduce and verify

From repository root, with Blender 4.3.2 on PATH:

```sh
blender --background --factory-startup --python-exit-code 1 \
  --python assets/source/calibration/export_fixture.py
npm ci --prefix tools/assets
node tools/assets/validate-fixture.mjs
node --test tests/project/assets.test.mjs
npm --prefix tools/assets run test:source
```

The generator accepts `-- --output /tmp/calibration.glb --blend /tmp/calibration.blend` for local inspection. Do not commit large/generated `.blend` files by accident. Use `BLENDER_BIN` only to select the executable for source tests; the generator still enforces its exact version.

The Node source test actually launches Blender, re-exports into a temporary directory and compares every GLB byte with the committed result. Six negative Blender executions inject unapplied scale, missing UVs, inverted winding, duplicate sockets, wrong unit scale and missing material. Each must fail with an asset-specific diagnostic **before** writing a GLB. These tests are not skipped when Blender is absent; run them only in an explicitly equipped job.

The always-available project suite tests the committed binary's scale, pivots, directions, hierarchy, UVs, material factors, normals, winding, hashes, extensions and bounded buffers. Malformed inputs include external resources, impossible accessor ranges, nonfinite vertices and missing attributes.

## Khronos validation

[Khronos glTF Validator](https://github.com/KhronosGroup/glTF-Validator) is pinned independently in `tools/assets/package-lock.json` as `gltf-validator` **2.0.0-dev.3.10**, the official npm package identified by its repository. The validator is build tooling only, not runtime code. Its Apache-2.0 licence remains in the installed package. No root application dependency changed.

`validate-fixture.mjs` runs official binary validation without ignored issues/severity overrides, alongside the project geometry contract. It fails for errors, warnings, truncated issue lists or any unreviewed information message. All returned issues are preserved in `artifacts/assets/calibration-validation.json`.

The only admitted information is `UNUSED_OBJECT` for each `TEXCOORD_0`: UVs intentionally exist to test export fidelity, but these untextured materials do not sample them. No warning is blanket-suppressed. Adding textures, compression or extensions requires a new fixture/policy, not expanding an ignore list blindly.

The actual GLB and source report are committed under `tests/fixtures/assets/`; large or time-varying reports belong in Actions artifacts. Native packaged loading, offline origin compatibility, visual appearance and device budgets are separate P01/P10/P11 tasks. This fixture does not satisfy those gates by itself.

### Reproduce with the official Linux build (CI)

`tools/assets/install-blender.sh` downloads only the official Blender 4.3.2 Linux
x64 archive over HTTPS. Its SHA256 is pinned to the publisher's manifest:
https://download.blender.org/release/Blender4.3/blender-4.3.2.sha256
(`4da1c956673c0485e63054e563ee69198cc8f80d8157dd7592dffc8a6a5592e6`).
It checks the hash and archive paths/types/links before extraction or execution,
uses no sudo, and installs into a fresh directory beneath `RUNNER_TEMP` (Actions)
or ignored repository `.tools/`. stdout contains only the verified binary path.
Failed installations clean up their own temporary directory; successful installs
remain available for subsequent steps. Requires Linux x86_64, curl, Python 3,
GNU tar/xz, sha256sum, and Blender's normal Linux runtime libraries.

Run these commands in one Actions shell step (or persist `BLENDER_BIN` through
`GITHUB_ENV` yourself between steps):

```sh
set -euo pipefail
BLENDER_BIN="$(tools/assets/install-blender.sh)"
export BLENDER_BIN
npm ci --prefix tools/assets
npm --prefix tools/assets run test:source
node tools/assets/validate-fixture.mjs
```

`BLENDER_BIN` is already supported by source tests. Neither this installer nor
those tests accepts a different Blender version or silently skips execution.
