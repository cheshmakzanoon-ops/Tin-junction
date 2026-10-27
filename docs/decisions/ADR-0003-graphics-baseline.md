# ADR-0003 — Physical miniature rendering with measured budgets

Status: accepted initial baseline; numerical budgets are provisional until measured on physical Duo hardware.

## Decisions

1. Use Three.js WebGLRenderer/WebGL2 initially, behind a renderer adapter. Evaluate WebGPU separately against packaged-origin support, feature parity, stability and sustained hardware timing.
2. Use right-handed coordinates, Y up, XZ ground, +Z locomotive forward. One world unit is one physical model-world meter.
3. The initial proposed kit is HO-inspired 1:87 with 0.0165 m rail gauge and approximately 0.8 × 0.5 m layout footprint. Ratify these dimensions with a scale fixture before production asset authoring. They are design dimensions, not claimed phone measurements.
4. Use a linear-light PBR workflow and calibrated reference scenes. The world should resemble a photographed handcrafted model, not a cartoon or distant full-scale landscape.
5. Hold simulation state independent of graphics quality and phone posture. A fold animation cannot bend the railway graph or detach rolling stock.

## Alternatives

Starting directly with WebGPU/TSL may offer advantages but has different material/postprocessing APIs and must prove its fit. Adding every expensive visual effect before a representative benchmark risks an attractive still that cannot be played. Using full-size railway meters and applying hidden scale factors throughout the engine increases geometry, sound and camera errors.

## Acceptance

Approve one locomotive, one correct operating track loop and one case/environment slice against material, scale, motion and device-performance criteria. Then expand the catalog. Changes to units, gauge, camera conventions or asset origin require migration/compatibility review.
