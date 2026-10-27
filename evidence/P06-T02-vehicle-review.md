# Routed vehicle mechanical review

**Result:** pass for the scoped P06-T02-A1 wheel/rail placement criterion on the supported diagnostic routes. This is AI engineering inspection of actual renderer output, not owner approval or production-art acceptance.

**Reviewed implementation:** `6f14cc5bfa03bfa9e522880e8365ed6e1a2cdc31`. All 28 scoped source inputs, including the imported train/wheel module and capture metadata code, matched that committed tree both before and after capture. The unit suite is separately anchored to `13ecc51674e629cad78ee6d7251f74278e7edc9e`; its pose/model inputs are unchanged in the visual checkpoint.

**Artifacts:** [unchanged inspection plate](P06-T02-vehicle-inspection.png), [measured report](P06-T02-vehicle-diagnostics.json), [actual capture output](P06-T02-vehicle-capture.txt), and [unit evidence](P06-T02-routed-vehicles-unit.json). The compact plate is retained unchanged for durable review; the larger collection of individual local views remains in ignored test results.

## Controlled setup

The fixture uses the committed original modular rail generator, original hollow wheel prefab, three logical vehicle envelopes, and solved axle/coupling frames. No generated illustration or external reference image substitutes for runtime geometry. The project owns these original procedural inputs; this inspection makes no railway-brand or photographic-reference fidelity claim.

Actual environment: Linux, Node **24.22.1**, Chromium **141.0.7390.37**, launched with SwiftShader software rendering. Each of the six canvases is **620 × 350** at pixel ratio 1 with antialiasing. The full-page browser viewport is **1320 × 1040**; the resulting plate includes all six views and their captions. The report records each orthographic camera's actual position, target, quaternion, projection bounds and near/far planes.

Lighting is fixed: a hemisphere light with intensity 3 and a directional light with intensity 4 at `(-0.25, 0.6, -0.4)`. Output uses sRGB, ACES filmic tone mapping and exposure 1.3. Shadows, depth of field, bloom, weather and post-processing are disabled. The purpose is readable mechanical contact without optical effects concealing it.

## Findings by view

| View | Observation | Scoped decision |
| --- | --- | --- |
| 100 mm-radius circle, tick 120 | Three rigid body envelopes retain their dimensions. Each axle follows its own rail frame; the front/rear reference wheelbase is a chord rather than a shortened arc-offset body. | Pass |
| Wheel-contact macro | Hollow tyre openings and inward flanges are visible. The tread bottoms meet the rendered rail heads without a visible vertical gap. The explicit 3.7 mm rail-root/roadbed offset reconciles the two geometry origins. | Pass |
| Opposing curves with 80 mm transition, tick 110 | Engine, coach and wagon remain ordered and on their actual retained route. Couplers articulate without changing stem or central-link lengths. | Pass for the authored transition |
| Turnout passage, tick 132 | Every engine axle is on the branch; coach axles remain on the diverging turnout; the wagon is still on the approach. The attempted conflicting switch is rejected. | Pass for placement; persistent route retention is also tested over time in units |
| Stopped before reversal, tick 240 | Vehicle identities, body positions, sockets and wheel positions are recorded at zero speed. | Comparison baseline |
| Reversed control direction, tick 240 | The physical engine/coach/wagon order and orientations visibly match the preceding frame. No vehicle flips, route jump or pose displacement is visible. | Pass |

The final plate was viewed in full and the separate macro image was also inspected at its actual rendered size after the corrected per-axle phase implementation was captured.

## Measured checks accompanying inspection

- All **84 wheel contact raycasts** across six views hit the actual generated active rail meshes; there were **zero missed contacts**.
- Maximum numerical vertical contact error was **1.236796411813179e-10 m**. This is agreement between software geometry calculations, not a claim of real-world manufacturing or sensor accuracy.
- Maximum recorded coupler articulation was **45.3974°**, below the **60°** supported bound. The S-transition and turnout captures measured approximately **17.43°** and **25.80°** respectively.
- Maximum before/after reversal body/socket position difference was **2.7755575615628914e-17 m**, with unchanged vehicle IDs and selected physical route.
- The capture process reported **zero JavaScript errors**. Each view rendered actual geometry, with per-view calls and triangle counts retained in the report. Those counts are fixture diagnostics and cannot be substituted for app or Duo GPU performance.

The unit suite supplies the temporal wheel-phase proof: each axle's phase delta times its radius matches independently accumulated cursor-station distance through a curve transition. These static images alone do not establish rolling animation, every possible route or a continuous app interaction.

## Explicit residual limits

The neutral wireframe/transparent boxes are catalog envelopes, not finished locomotive or carriage bodies. Their simple chassis plates and independently oriented axles do not establish a production suspension or rigid steam mechanism. The middle locomotive axle uses prototype lateral accommodation. Side rods, valve gear and differing inner/outer tyre rolling radii require later mechanical/art validation.

The turnout displays selected and inactive route rails; final blade, frog and guard-rail geometry is not present in this fixture. The reviewed pose criterion does not approve that missing art. Materials and lighting are readable inspection settings, not a reference-matched final miniature scene. Scenery, camera interaction, native UI, shadows and final optical treatment are outside this review.

An immediate opposing 100 mm-radius S curve is explicitly rejected when its coupling angle is unsupported. Graph-tolerated rail gaps, overlaps and tangent steps are also rejected by the stricter pose compatibility gate. The fixture therefore establishes the stated supported cases, not blanket approval for every layout whose nominal radius is at least 100 mm.

The production graph runtime must commit compatible motion and poses atomically using `prepareVehicleStep` or an equivalent tested transaction. The current app still uses its original oval runtime. Native operational integration, final asset clearance, sustained device performance, owner visual approval and release readiness remain separate gates.
