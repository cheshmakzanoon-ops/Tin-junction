# Original procedural workbench assets

Stage: **prototype**. These are the actual source-generated assets used in the first operating workbench, not approved launch art or downloaded reference models.

The model/case/scene materials were authored as original TypeScript geometry and canvas-texture code during this project implementation. The rail profiles, locomotive, wagon bodies, station, cottages, trees, benches, lamps, rocks and pond use generic original forms without real railway branding. UI icons are original inline SVG paths. Whistle audio is synthesized from oscillators after a user gesture; no recording, microphone input or external audio asset is used.

| Family | Reproducible source |
| --- | --- |
| Walnut/brass folding case and scene fixtures | `web/src/scene/MiniatureScene.ts` |
| Profiled rails, sleepers, ballast and terrain | `web/src/scene/geometry.ts`, `web/src/scene/MiniatureScene.ts` |
| Steam locomotive, wagons, wheels and rods | `web/src/scene/train.ts` |
| Scenery and station geometry | `web/src/scene/scenery.ts` |
| Grain, felt, painted surfaces and studio environment | `web/src/scene/materials.ts`, `web/src/scene/MiniatureScene.ts` |
| Whistle synthesis | `web/src/audio.ts` |
| Interface icons | `web/src/ui.ts` |

The asset catalog records actual source hashes. Runtime geometry is constructed from bundled code; no standalone GLB/KTX2/audio file is claimed to exist. The build manifest independently fingerprints the real compiled JS/CSS/HTML bundle.

Three.js and its imported addons retain their dependency license notices in `bundle.js.LEGAL.txt`. This provenance record does not grant a project-wide open-source license or certify trademarks. Owner rights review, final technical/art/device approvals and the production asset pipeline remain open. Catalog entries therefore stay `prototype`, have no invented approvals, and cannot pass the approved-release asset gate.

The current visible style is a coherent original procedural miniature. It is not yet the reference-matched hyperrealistic launch target. Final production artwork must replace or refine these assets through the existing art phases, preserving the physical units, contact points and saved scenery identities.
