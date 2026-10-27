# Art direction — a real miniature railway, photographed in your hands

Status: **PROPOSED production specification**. No finished art, final device captures, or visual approval exists at repository setup. The commercial product is exclusively designed for iPhone Duo; any desktop/browser view is an engineering harness, not another release platform.

Read with [system architecture](../architecture/SYSTEM_ARCHITECTURE.md), [rendering specification](RENDERING_SPEC.md), [asset pipeline](ASSET_PIPELINE.md), [visual acceptance](VISUAL_ACCEPTANCE.md), and [performance budgets](PERFORMANCE_BUDGETS.md).

## 1. The image we are making

Tin Junction is a convincing **physical model railway inside a folding display case**. Objects must have thickness, weight, materials, mechanisms, and a consistent small scale. This is not a giant landscape viewed from an aeroplane. Its mountains are model scenery; its village is a carefully constructed miniature; its case is a real-looking object surrounding the model.

Visual hierarchy:

1. A mechanically credible train moving smoothly on a continuous track.
2. A coherent miniature landscape with recognisable craftsmanship.
3. A case that makes the composition read as a physical possession.
4. Light, atmosphere, and restrained imperfections that reinforce those objects.
5. Native controls that let the player operate or edit without covering the model.

The first three must work without depth of field, bloom, weather particles, grain, or camera animation. Effects cannot substitute for correct geometry and materials.

## 2. Non-negotiable boundaries

- No puzzle-board appearance, level numbers, coins, rewards, timers, quests, artificial unlocks, tycoon economy, or advert furniture.
- No faceted low-poly hills presented as finished art. Prototype geometry must be labelled in engineering evidence and excluded from final approval.
- No giant-scale vegetation, impossible ballast, floating wheels, paper-thin case edges, or oversized random scratches.
- No ubiquitous polished plastic: each surface has a deliberate material model.
- No real locomotive/operator branding without documented rights; use plausible fictional markings by default.
- No copied commercial meshes, textures, sound libraries, or photographs without appropriate rights.
- No claims of ray tracing, measured physical accuracy, HDR output, or target-device performance without evidence.
- No redesign that silently broadens commercial distribution beyond Duo.

## 3. Reference collection before production modelling

Create reference boards according to [the reference policy](../../assets/references/README.md). Collect physical-object evidence, not just other games. A reference can guide an original model without being redistributable; record this distinction and never commit an image without permission.

| Reference category | Required observations | Decision informed |
| --- | --- | --- |
| Overall model railway | Board proportions, density, foreground/background layering | Scene composition |
| Locomotive profile | Wheelbase, axles, boiler/cab proportions, couplers | Geometry and mechanisms |
| Track macro | Rail profile, ties, joiners, turnout gaps, contact polish | Track kit/materials |
| Case construction | Frame thickness, hinges, corner protectors, latches, lining | Case credibility |
| Model architecture | Wall thickness, roof edges, glazing, light leakage | Building kit |
| Model landscape | Ballast boundaries, flock, plaster rock, planted trees | Scenery scale |
| Material swatches | Neutral diffuse and grazing-light views of the same surface | PBR calibration |
| Motion | Wheels, rods, points, acceleration, carriage clearance | Animation review |

A hero reference board needs overall, side, front/rear, mechanical detail, and material macro views. Missing views create explicit assumptions; they are not an invitation to claim unseen mechanisms are verified.

Reference-pack gate:

1. Record source and rights for each item.
2. Annotate dimensions or mark them estimated.
3. Note lighting/camera differences that affect interpretation.
4. Select a coherent era/style; do not silently mix contradictory references.
5. Approve silhouette before detailed texturing.

## 4. Scale, composition, and camera

### 4.1 One scale convention

Use the shared architecture convention: right-handed glTF/Three.js space, Y up, XZ ground, one world unit equal to one metre of the **physical model world**, locomotive local forward +Z. Model scale is metadata, not a hidden shader or physics multiplier.

The proposed first kit is HO-style 1:87 with 0.0165 m track gauge and a 0.8 m × 0.5 m board. These are design choices to ratify in the scale ADR/fixture, **not measured phone dimensions**. A different approved scale requires a single explicit conversion policy and revalidation of every interacting asset.

Track gauge, wheel diameter, coupler height, tunnels, bridges, buildings, figures, and trees share that convention. No asset designer may independently interpret a world metre as a full-size railway metre.

### 4.2 Starter layout composition

The first production scene has a visible locomotive presentation area, one station, one bridge, one short tunnel, a quiet foreground, a restrained background hill, and an uninterrupted circuit. The route remains legible when the train passes behind scenery.

- Keep a foreground segment where wheel/rail contact can be inspected.
- Put the station where native controls will not obscure it.
- Use height variation to create depth, not conceal missing content.
- Keep scenery below the case closure envelope unless a documented folding/retracting mechanism explains it.
- Use landmarks as orientation aids; do not populate every surface uniformly.
- Ensure the device-fold composition does not accidentally make the track appear broken.

The starter scene must be reproducible by the sandbox's supported tools, not a privileged artwork with incompatible lighting or geometry.

### 4.3 Camera modes

Default perspective resembles a person inspecting a tabletop model. Focal length/orbit limits need reference review; avoid fisheye and strategy-map flattening.

| Mode | Objective | Constraints |
| --- | --- | --- |
| Overview | Read layout and case | Stable horizon, modest perspective, no heavy blur |
| Inspection | Appreciate material and motion | Safe approach distance, bounded orbit, correct near plane |
| Follow | Watch a chosen train | Damped motion, no sudden rotations, reduced-motion alternative |
| Editing | Precise placement | Sharp handles, stable ground projection, selected object visible |
| Photo/viewing | Attractive capture | Optional restrained depth of field, actual geometry unchanged |

Movements are interruptible and functional. Never fly through buildings or the ground, or automatically choose an angle that hides an editing defect.

## 5. Material direction

Numbers below are **initial artistic search ranges**, not measured physical constants. Final values require neutral-scene calibration and reference review. Correct colour-space interpretation is mandatory before tuning.

| Surface | Construction intent | Initial recipe direction | Reject when |
| --- | --- | --- | --- |
| Locomotive body | Enamel over metal | Dielectric paint; roughness 0.25–0.55; clearcoat only when justified | Painted regions are uniformly metallic/mirror-like |
| Rail contact strip | Wheel-polished metal | Metallic; roughness 0.15–0.35; restrained directional wear | Rail resembles white emission or chrome everywhere |
| Rail sides/joiners | Oxidised handled metal | Roughness 0.45–0.8; exposure-based colour variation | Random rust covers clean wheel-contact zones |
| Brass | Small machined conductor | Metallic; roughness 0.2–0.5; correctly sized marks | Yellow diffuse plastic |
| Case frame | Coated metal | Dielectric coating; exposed corners only where credible | Identical bright wear on every edge |
| Sleepers | Wood or deliberate moulded imitation | Directional grain; roughness 0.65–0.95 | Grain is wider than the sleeper |
| Ballast | Small aggregate on a model board | Roughness variation; sparse close-up geometry | Gravel resembles boulders or uniform beads |
| Rock | Sculpted/painted model scenery | Matte microdetail, coherent strata and washes | Full-size cliff texture at wrong scale |
| Foliage | Crafted model-tree canopy | Controlled silhouette, stable alpha coverage | Giant leaves, flicker, dense overdraw clouds |
| Architecture | Detailed miniature construction | Real edge thickness, restrained wear, consistent texel density | Paper roofs or oversized mortar |
| Glazing | Small thin panes | Reflection first; transmission only when measured | Black interiors, sorting artifacts, excessive cost |
| Lining | Felt, cloth or painted board | Fine roughness detail and restrained normals | Fibres exceed the size of miniature figures |

Authoring rules:

1. Base colour describes the surface, not a painted sun, cast shadow, reflection or lens flare.
2. Dirt follows creases, handling and exposure, not a uniform procedural-noise coating.
3. Important bevels and silhouette edges are geometry; normals cannot replace every edge.
4. Paint and exposed metal are distinct material regions.
5. Roughness variation is usually more useful than exaggerated normal strength.
6. Check atlas seams and repeated dirt in motion and at grazing angles.
7. Default style is cared-for working craftsmanship with restrained wear, not a rusty abandoned railway.

## 6. Mechanical visual truth

- Wheels touch the intended rail surface on straights and curves.
- Wheel rotation follows travelled distance and wheel radius.
- Axles, bogies, rods and pistons use authored pivots and a documented mechanism model.
- Articulated parts do not pass through the cab, boiler, wheels, adjacent carriages or couplers.
- Coupler spacing remains credible through the minimum supported curve.
- Turnout blades visibly select the actual simulated path.
- Underside geometry is sufficient for all allowed camera angles.
- Steam starts at the chimney/valve and does not conceal incomplete mechanics.
- Low-speed motion is smooth. Any wobble must be subtle, intentional and reference-supported.

Maintain an engineering overlay for axle axes, bogie pivots, track centreline, contact points and coupling envelopes. Do not use it in store imagery.

## 7. Lighting style and exposure

Default lighting suggests a softly lit physical display: a restrained directional key reveals shape, with environment reflections and readable indirect light. Day/night/weather presets must preserve a coherent relationship between miniature and case.

| Preset | Desired qualities | Main failure |
| --- | --- | --- |
| Neutral review | Fixed diffuse lighting and reference patches | Hiding faults with dramatic contrast |
| Clear day | Readable materials, gentle directional shadow | Bleached ballast/crushed locomotive blacks |
| Overcast | Soft contrast with shape cues | Uniform flat grey |
| Evening | Warm windows and cooler ambient environment | Orange grading and excessive bloom |
| Night | Local luminous detail, legible surroundings | Unreadable black objects |
| Rain | Controlled wetness and small ripples | Universal chrome or particle fog |
| Snow | Accumulation supported by geometry | White paint over moving mechanisms |

Use fixed exposure per approved preset or a documented tested adaptation curve. No unbounded exposure pumping when a bright window enters view. Calibration always uses fixed exposure.

Contact is especially important at wheel/rail, sleeper base, building feet and case corners. Moving scenery must not leave baked shadow stains. Time/weather changes must not retain conflicting directional lightmaps.

## 8. Effects restraint

- Steam is sparse, soft, scaled and bounded in count/overdraw.
- Rain is conveyed mainly through material/lighting response and sound; particles support rather than dominate it.
- Snow combines restrained particles and authored supported accumulation; it does not require a global fluid simulation.
- Water is a modest river/pond with credible banks, not an ocean shader scaled down blindly.
- Wind is subtle and respects the miniature presentation; rigid model trees do not bend like jungle trees.
- Bloom belongs to genuinely bright sources, not ordinary painted objects.
- Depth of field is optional and limited/disabled while editing.
- Grain, vignette, lens dirt and chromatic aberration are off by default and require explicit justification later.

Every effect is independently switchable in the engineering inspector.

## 9. Case and fold presentation

The case is an important authored object: frame, lining, hinge and latch details should withstand inspection without dominating playable space. Scenery must have a credible closure envelope.

Before implementing fold response, verify actual public platform data and lifecycle behavior. This art specification does not invent hinge-angle APIs or device identifiers.

Desired states to implement only against the verified platform contract:

1. Closed/obscured: native lifecycle and persistence policy controls pause; heavy invisible rendering stops.
2. Opening: reveal the layout without mutating its saved structure.
3. Supported partial posture: compose the two-surface presentation based on real verified behavior.
4. Flat: continuous readable layout and predictable projection.
5. Closing: preserve state without visual objects crushing through each other.

A fold slider in the engineering harness is synthetic test input, not real Duo evidence.

## 10. Native UI and accessibility art rules

- SwiftUI controls complement the object without creating a large conventional game HUD.
- Operational controls have clear labels and affordances; decoration is not an undiscoverable button.
- Text contrast is independent of scene lighting.
- Selection/invalid placement never rely on red/green alone.
- Reduced motion removes nonessential camera travel/effects without changing simulation correctness.
- Small objects receive enlarged hit regions or accessible alternative controls rather than oversized impossible geometry.
- Native text/buttons remain legible at supported text sizes.
- Brass/cream styling must not defeat system semantics or accessibility.

## 11. Art gates and stop conditions

| Gate | Required output | Stop if |
| --- | --- | --- |
| Reference lock | Rights-recorded reference set, scale/style decisions | Core forms are guessed or provenance is unclear |
| Silhouette lock | Neutral hero train/track/case views | Proportions or clearance fail |
| Material calibration | Fixed-light swatches | Colour-space errors or baked light remain |
| Vertical slice | One loop/train/station/case in the app | Motion is implausible or hardware performance unmeasured |
| Kit consistency | Reusable asset families | Scale, wear or texel density disagree |
| Full presentation | Day/night/weather/editing views | Effects hide defects or obscure placement |
| Release art | All visual shots and device review signed | Critical defect or missing rights remains |

Each gate leaves manifest revision, runtime-capture metadata, review decisions, open defects and next task. Concept art is not runtime evidence; desktop screenshots are not Duo captures.

## 12. Primary technical references

The following support mechanics, not aesthetic guarantees:

- [Three.js colour management](https://threejs.org/manual/pages/color-management.html)
- [Physical materials](https://threejs.org/docs/pages/MeshPhysicalMaterial.html)
- [glTF units, geometry, materials and animation](https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html)
- [Shadow-map behavior/cost](https://threejs.org/manual/pages/shadows.html)

Revalidate against the pinned release. Never replace an approved style with the default appearance of a downloaded asset pack.
