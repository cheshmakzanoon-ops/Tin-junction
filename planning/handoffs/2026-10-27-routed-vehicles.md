# Routed vehicles and mechanical contact — P06-T02

## Published implementation

The vehicle source checkpoint is `13ecc51674e629cad78ee6d7251f74278e7edc9e`. It adds the bounded route-history vehicle solver and atomic motion/pose gate. `vehicleCatalog.ts` was first published in the preceding shared-document checkpoint and remains unchanged in this implementation. The catalog and complete-footprint formula are shared with the native/web v2 document validators.

Owned source: `web/src/simulation/vehicleCatalog.ts`, `routedPoses.ts`, `vehicleStep.ts`, `VEHICLES.md`; the existing `routedConsist.ts` only exports and reuses its unchanged occupied-route validation. Tests and diagnostic inputs are `tests/web/unit/routed-poses.test.ts` and `tests/fixtures/track/{vehicle-fixtures.ts,vehicles.html,vehicles.ts,capture-vehicles.mjs}`. The coordinator owns planning state and publication.

## Behavior and supported bounds

- Stable physical vehicle order is engine, then zero to seven known coaches/wagons. Reversal changes travel direction without rotating or reordering physical vehicles.
- Front/rear reference pivots solve the authored wheelbase as a Euclidean chord. Bodies retain their dimensions on curves; each axle receives a separate rail frame.
- Coupling uses two fixed 1.5 mm pivoting stems and a fixed 6 mm central link, with a 60° articulation limit. A bounded outward-root search rejects unsupported or ambiguous placement.
- Tests support the 100 mm circle, straight-to-100 mm turnout passage, and an opposing S curve with an authored 80 mm straight transition. Immediate opposing 100 mm curves can exceed the angle limit and are rejected. Minimum radius alone does not certify arbitrary compound geometry.
- Complete occupied lengths are 0.1195 m for one engine, 0.2845 m for the default three vehicles, and 0.697 m for eight. The 1.5 route-span multiplier and end margins are deliberately conservative, so route locks/stops can precede visible body clearance.
- Wheel phase includes each axle's changing canonical route offset: `(signedTravel + axleDistance - footprint)/radius`. A regression independently compares phase changes with route-cursor stations along the S curve.

Review found and fixed three important gaps: a public pose state could forge self-overlapping route history; graph-tolerated 190 µm joins could cause a visible jump or late solve failure; and lead-window travel alone was insufficient to animate individual axles through curvature transitions. Shared route validation now rejects overlap/full-loop contact, the pose gate requires mathematically aligned joints, and per-axle phase includes the changing offset. The graph's existing 0.2 mm / 0.25° edit/import tolerances remain unchanged and do not grant pose certification.

`prepareVehicleStep` advances and solves a detached candidate. Success returns motion and poses to commit together. Failure leaves the supplied authority byte-identical and supplies a parked fallback at the last compatible placement, preserving route, wheel travel and poses. This is defensive unsupported-geometry handling, not a smooth physical braking model. The future graph runtime must use this gate or an equivalent tested transaction; it must never advance the model and keep stale body poses after a solve failure.

## Unit evidence

[The unit manifest](../../evidence/P06-T02-routed-vehicles-unit.json) and [actual test output](../../evidence/P06-T02-vehicle-tests.txt) record 48 passing tests: 14 vehicle/pose/transaction, 17 turnout/consist, and 17 routed-motion tests. All 23 scoped source files were verified byte-identical to the published implementation both before and after the evidence run. TypeScript and repository validation also passed during implementation; the coordinator's full check is recorded separately.

## Visual evidence checkpoint

The six-view actual Three.js diagnostic has been implemented and inspected for the minimum-radius circle, wheel-contact macro, S transition, trailing turnout passage and stopped reversal. It uses the original hollow wheel prefab and actual modular rail meshes, with explicitly marked neutral catalog body envelopes. The rail root receives a 3.7 mm roadbed offset to match the 7.2 mm running-surface contract; contact is measured by raycasting onto the generated rail heads.

Final acceptance evidence is pending a recapture from the combined train-art checkpoint. The post-publication fixture metadata addition records actual camera transforms, viewport, lighting, tone mapping and runtime versions. The final visual manifest must name the commit containing those additions and the `scene/train.ts` version actually imported; it must not label uncommitted train art as tested at `13ecc`. The earlier local images precede the corrected per-axle phase and are not the final acceptance artifacts.

## Limits and next action

The live app still runs the original oval model; the new graph pose solver is not connected to its controls or renderer. General editor placement must validate clearance and the entire candidate pose before commit. Native document shape validation is separate from operational compatibility. The prototype steam middle axle uses lateral accommodation, and the solver does not certify a rigid steam chassis, side rods, valve gear or differing inner/outer tyre rolling radii. Production asset clearance and device cost remain unmeasured.

After the combined source is published, rerun `node tests/fixtures/track/capture-vehicles.mjs` against verified matching inputs, inspect the unchanged images, retain the compact plate/report/review and create the `visual_review` manifest. Update this section with the actual SHA and results. Only then should the coordinator submit/complete P06-T02 with both evidence kinds. No native UI, final-art, hardware-performance or release approval is granted by this component handoff.
