# Visual acceptance — evidence, not adjectives

Status: **PROPOSED quality contract**. At setup there are no approved production screenshots or measured visual scores. An empty evidence directory must not be interpreted as a passing review.

The target is a hyperrealistic physical miniature railway, exclusively for iPhone Duo. “Hyperrealistic” is an intended art quality assessed against real-object references; it is not an automated certification or a substitute for the checks below.

Read [art direction](ART_DIRECTION.md), [rendering](RENDERING_SPEC.md), [asset pipeline](ASSET_PIPELINE.md), [performance budgets](PERFORMANCE_BUDGETS.md), and [test strategy](../quality/TEST_STRATEGY.md).

## 1. Evidence classes

| Evidence | Proves | Does not prove |
| --- | --- | --- |
| Licensed reference photo | Intended physical/material target | Runtime quality or rights to unrelated assets |
| Blender/offline render | Source modelling/material intention | App appearance, frame rate or interaction |
| Desktop browser capture | That specific web implementation/configuration | Duo/WebKit/native integration |
| iOS Simulator capture | That named simulator/build's rendering and UI | Real device thermals, GPU speed or hinge behavior |
| Real Duo app capture | Actual device output under recorded conditions | Unrecorded configurations or sustained performance |
| Sustained device run with metrics | Behavior for the stated scene/duration/conditions | Guaranteed behavior under every future workload |
| Generated concept image | Aesthetic exploration | Any implemented functionality |

Never relabel an evidence class. Store imagery must represent the running product and comply with the release process; it cannot be a generated concept presented as gameplay.

## 2. Deterministic capture manifest

Each capture set records:

- Task ID, tested commit and app build identifier.
- Asset-catalog revision/hash and engine/dependency lock hash.
- Scene/fixture ID, layout hash and seed.
- Simulation tick/time and moving-train command sequence.
- Camera mode, transform, projection parameters and focus settings.
- Lighting/weather preset, exposure and effects configuration.
- Backend and resolved quality tier.
- Logical viewport, safe-area/posture inputs and physical render dimensions.
- Device versus simulator, OS/runtime and available hardware identifiers.
- Capture source/tool, file hashes and artifact URL/path.
- Reviewer identity, review date, criteria outcomes and issue IDs.

Values are explicit; `unknown`/`unavailable` is preferable to fabricated information. For synthetic posture input, the manifest explicitly says `synthetic`, not a guessed real hinge measurement.

Before capture:

1. Load the exact fixture and seed.
2. Wait for documented assets and shader warm-up.
3. Freeze nondeterministic presentation clocks.
4. Resolve the specified quality tier rather than allowing an unknown adaptation state.
5. Apply camera/preset/tick and wait for history to settle if a temporal effect exists.
6. Capture the colour image plus necessary debug/material/depth views.
7. Retain unmodified source captures; derived comparison sheets are separate files.

## 3. Required shot set

| Shot | Composition | Must reveal | Automatic/technical checks | Human checks |
| --- | --- | --- | --- | --- |
| VIS-01 | Daylight whole-layout overview | Case, route, station, landscape hierarchy | All assets loaded, finite transforms, expected bounds | Miniature reads physically; no generic full-size terrain impression |
| VIS-02 | Hero locomotive side/macro | Wheels, rods, paint, rail contact | Correct pose/tick and model dimensions | Silhouette, material layering, believable mechanism |
| VIS-03 | Rail-height curved track/turnout | Gauge, flange/contact, sleeper continuity | Path/visual match and clearance fixture | No floating/derailed appearance, overlapping rails or impossible points |
| VIS-04 | Station/building close-up | Roof/wall thickness, glazing, foundations | Correct asset/material IDs | No paper-thin edges, texture scale mismatch or light leakage |
| VIS-05 | Night station/whole scene | Emission, readable dark materials | Preset/exposure/light budget | No bloom fog, crushed shapes or retained daylight shadow |
| VIS-06 | Rain/wet rail | Roughness response, droplets, water edge | Effect/particle counts and tier | Wetness is local/credible; no chrome terrain or overdraw haze |
| VIS-07 | Case boundary and fold presentation | Thickness, hinge/closure envelope, seam | Verified or labelled synthetic posture | No scenery crushing, track discontinuity or projection cheat |
| VIS-08 | Dense editor view | Preview, selection, handles, native UI | Hit regions/picking transforms/contrast checks | Placement is readable; model remains convincing under overlays |
| VIS-09 | Neutral material calibration | Paint, brass, wood, rock, glazing swatches | Colour-space/texture assignments | Materials distinguishable without dramatic lighting |
| VIS-10 | Slow LOD/zoom transition sequence | Train/scenery silhouettes and grazing textures | Threshold/hysteresis state | No popping wheels, shimmer, alpha halos or shading discontinuity |

Each shot has a fixed fixture definition, not just a descriptive filename. Changes to the camera/preset that materially affect comparison require review.

## 4. Motion evidence is mandatory

A still image cannot approve a moving miniature. Record short reproducible sequences:

1. Slow start, steady running and stop.
2. Straight-to-minimum-curve transition.
3. Both valid turnout routes with the blade visible.
4. Coupled carriages crossing the same curve and points.
5. Slow camera orbit/zoom through LOD thresholds.
6. Place, rotate, move, delete, undo and redo a building near rail clearance.
7. Day/night/weather transition.
8. Verified posture/viewport changes, plus clearly labelled synthetic harness equivalents.
9. Background/foreground and graphics recovery.

Review wheel speed correspondence, linkage collisions, coupler spacing, track contact, ghosting, shimmer, particle sorting, camera comfort and editor continuity. Any severe correctness issue fails regardless of attractive stills.

## 5. Rubric

Use explicit per-domain outcomes, not an overall unexplained percentage.

| Score | Meaning |
| --- | --- |
| 0 | Missing/broken or contradicts product intent |
| 1 | Clearly prototype-quality or major defects |
| 2 | Convincing in ordinary views but documented defects remain |
| 3 | Meets approved reference/interaction standard in required views |

Domains:

- Scale and proportions.
- Mechanical/contact correctness.
- Material response and colour pipeline.
- Lighting, exposure and grounding.
- Texture/geometry detail at supported camera distance.
- Scene composition and case credibility.
- Motion/temporal stability.
- Editing/native-interface readability.
- Consistency across approved quality tiers/postures.

For a production hero gate, every domain must reach 3 or have an explicitly accepted noncritical exception from the owner/reviewer. An exception includes defect, impact, evidence, rationale and follow-up; it is not a hidden relaxed threshold. No average score can override a critical defect.

## 6. Critical visual failures

Any of the following blocks the affected milestone:

- Missing/checkerboard/unlicensed production asset.
- Wheels visibly separated from rails or train following a different path from the visible track.
- Broken/overlapping track joins or visibly impossible turnout mechanism.
- Important parts intersecting during allowed movement.
- Inconsistent model scale between interacting assets.
- Colour-space errors, double output conversion or exposure used to conceal them.
- Baked shadows remaining after scenery is moved/deleted.
- Screen/fold transition losing layout state or corrupting projection/picking.
- Editing controls obscured or misleading placement preview.
- Severe temporal ghosting, aliasing shimmer, alpha sorting or LOD disappearance.
- Unreadable native text/controls in a supported accessibility setting.
- Fake device capture, undisclosed synthetic posture, or a concept image labelled as runtime.

## 7. Automated image comparisons

Automated snapshots help catch regressions; they cannot certify photorealism or rights.

Requirements:

- Pin browser/runtime/toolchain where the test needs reproducibility.
- Compare against the same evidence class and configuration.
- Separate deterministic no-effect fixtures from tolerance-based production scenes.
- Define masks only for intentionally variable regions, with reviewed reasons.
- Establish numeric thresholds from observed repeatability; do not invent universal SSIM/pixel thresholds before collecting a baseline.
- Keep difference images, reference/current captures and test metadata as artifacts.
- Test failure must identify scene/shot/configuration, not only “snapshot changed”.

Do not accept a new golden image solely because code changed. A reviewer must inspect what changed, whether it matches the specification, whether motion/performance worsened, and whether the change was intentional. Reference/golden update and explanation belong in the same coherent checkpoint.

## 8. Neutral calibration fixtures

Maintain a compact set of renderer fixtures independent of the full railway:

1. Known neutral colour patches, with documented input/output handling.
2. Metallic and dielectric spheres/blocks across roughness values.
3. Normal-map orientation/tangent fixture.
4. Emissive/window fixture under fixed exposure.
5. Opaque, masked and blended material fixture.
6. Thin rail/fence geometry at grazing angles.
7. Contact-shadow and depth-bias fixture at model-world scale.
8. KTX2 and uncompressed texture comparison.
9. Meshopt-compressed/uncompressed geometry comparison.
10. Colour/capture roundtrip fixture for thumbnails and exported images.

Fixtures are tiny engineering assets with recorded provenance, not store art. They diagnose whether a visual error originates in source content, compression, loading, shading or output.

## 9. Visual regression matrix

At minimum cross the critical shots with:

- Baseline and reduced-pressure quality tiers.
- Approved daylight/night states.
- Normal and reduced-motion presentation.
- Supported orientation/posture states established by the platform contract.
- Starter and dense supported layout.
- Fresh launch and recovered/resumed session.

The full Cartesian product may be expensive. Document a deliberate coverage matrix: every critical behavior appears somewhere, and risky combinations such as rain + night + dense scenery receive explicit device review. Do not silently skip the hardest combination.

## 10. Review workflow

1. Author submits candidate with task ID, manifest, validation and capture artifacts.
2. Technical reviewer checks geometry, colour, loading, lifetime and budget evidence.
3. Art reviewer compares references and required shots, assigning domain outcomes.
4. Interaction reviewer checks motion and editing readability.
5. Device reviewer verifies actual Duo behavior and the accompanying sustained metrics.
6. Coordinator records result and remaining blockers in project state using repository commands.

Roles may be held by the same person on a solo project, but the checklist remains separate. AI self-review can find defects and prepare evidence; it does not invent a human/owner sign-off.

## 11. Artifact and handoff conventions

Keep compact manifests/review notes in `evidence/`. Store large images/video/xcresult or profiler output in GitHub Actions artifacts or the controlled asset store. Record stable artifact identity, checksum and retention limitations; copy release-critical proof into durable retention before temporary artifacts expire.

Handoff minimum:

```text
Task: <existing task ID>
Asset/scene version: <exact catalog/layout IDs>
Tested commit: <SHA>
Evidence class: <desktop | simulator | actual Duo>
Configuration: <backend / quality / render size / preset>
Shots/sequences reviewed: <IDs>
Result by domain: <0..3 plus rationale>
Critical defects: <issue IDs or none observed>
Performance counterpart: <report reference, or blocked/not_run>
Reviewer/sign-off: <actual reviewer and date; never invented>
Next action: <one reproducible task>
```

## 12. Release statement

The project may describe the intended style as hyperrealistic during planning. It may claim the production visual gate is complete only when the exact release candidate has approved runtime shots, motion review, provenance, actual Duo integration and sustained performance evidence. Code presence, test-count growth and generated marketing art do not satisfy that gate.
