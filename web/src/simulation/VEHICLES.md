# Routed vehicle placement — P06-T02

This is a pure route-history pose solver and a bounded motion/pose transaction gate. It is not yet connected to the app's original oval `TrainRig`, controls or native storage. The visual fixture uses actual modular rail geometry and the project's original hollow wheel prefab, with explicitly marked body envelopes. It does not certify final locomotive art, valve gear, turnouts, or device performance.

## Catalog and physical identity

`vehicleCatalog.ts` exports `VEHICLE_CATALOG_VERSION = "tin-junction-vehicles-v1"`, `VEHICLE_CATALOG`, `DEFAULT_VEHICLES`, `validateConsistVehicles`, `consistFootprint` and `consistClearanceEnvelope`.

| Catalog ID | Original workbench identity | Body length | Reference wheelbase | Body half-width | Height | Axles |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| `steam-01` | `engine-01` | 74 mm | 36 mm | 14.5 mm | 51.6 mm | 3 |
| `coach-01` | `carriage-01` | 46 mm | 28 mm | 13.5 mm | 41 mm | 2 |
| `wagon-01` | `freight-01` | 46 mm | 28 mm | 13 mm | 35 mm | 2 |

These logical prototype dimensions derive from `model/geometry.ts`, `scene/train.ts` and `scene/trainMechanics.ts`. They are not a finished asset bounds certificate. Small art details such as the locomotive steps and coach roof require later asset-specific clearance review; the diagnostic body boxes deliberately represent the catalog, not every current mesh. All wheels have 6 mm tread radius. All entries require at least 100 mm route radius. Rail-center spacing is the shared 16.5 mm inner-face gauge plus the 1 mm rail-head width.

The canonical composition has one engine first, followed by zero to seven coaches/wagons. Each `{id,catalogId}` has exactly those two fields, a unique bounded stable ID and a known asset. Physical order never reverses. Control direction is separate: when travelling backwards, the same engine remains at the same physical end and keeps its forward-facing body frame.

Native and TypeScript calculate the full occupied route length using integer micrometres:

```
unextended = sum(bodyLengthMicrometres + 2 * 1500) + (count - 1) * 6000
footprintMetres = (3 * unextended / 2 + 2 * 2000) / 1_000_000
```

This gives 0.1195 m for the engine, 0.2845 m for the default three vehicles, and 0.697 m for an engine plus seven wagons. The 1.5 multiplier bounds local arc searches; each end has a further 2 mm margin. This conservative footprint intentionally locks and stops earlier than the visible vehicle ends. It is not the sum of visible body lengths. The solver rejects any pose that would exceed its retained footprint.

`consistClearanceEnvelope` returns the maximum catalog height and minimum radius, and a deliberately broad lateral envelope. For each vehicle, in metres, `reach = bodyLength/2 + 0.0015` and `halfWidth = bodyHalfWidth + reach²/(2*radius) + wheelbase²/(8*radius)`. The default composition produces `{halfWidth:0.02353125,height:0.0516,minimumRadius:0.1}`. This is a logical prototype planning envelope; final authored meshes and running gear still need asset-specific certification.

## Bounded pose solve

`solveRoutedPoses(state, vehicles)` accepts a `PoseRouteState`; `RoutedMotion` satisfies that interface directly. It returns either frozen poses or an explicit failure, never partly updated vehicles. It uses the shared `occupiedRouteError` validator, so malformed, disconnected, wrongly selected, self-overlapping and full-loop-contact history cannot masquerade as valid vehicle placement.

For reverse travel, the retained intervals are inverted back into canonical physical orientation before sampling. The leading physical engine pivot is inset from the footprint end by its conservative overhang margin. Each rear reference pivot is solved by 36 bisections for the exact authored Euclidean wheelbase, within `[wheelbase,1.5*wheelbase]` arc distance. Body position and yaw follow the rigid pivot chord. No body is scaled to fit a curve.

Each adjacent pair has a body-end attachment pivot, two pivoting 1.5 mm stems, and a fixed 6 mm central link. The solver seeks the outward distance root at a 9 mm attachment separation, using 24 bracket samples and 36 bounded bisections. It rejects missing/multiple outward brackets and checks both coupler directions against the 60° articulation limit. This avoids the earlier signed-distance discontinuity, which could mistake a sideways coupling for a root. Stem lengths and the central gap do not stretch. Each output includes attachment positions, head positions and articulation angles.

Supported tests include the 100 mm circle, straight-to-100 mm turnout passage, and an S curve with an authored 80 mm straight transition. An immediate opposing 100 mm-radius S curve exceeds the coupling angle and is explicitly unsupported. A radius check alone is insufficient to certify a compound route. Eight vehicles are supported only where the complete footprint fits without self-overlap.

Every axle gets an individual route position and tangent; left and right wheel centers use the shared rail-center offsets. The middle locomotive axle samples the midpoint along the retained route with prototype lateral accommodation. This is not a rigid three-axle chassis or a certified side-rod/valve-gear mechanism. Later production art must honor or replace that convention explicitly.

Each axle's wheel phase is `(signedTravel + canonicalAxleDistance - footprint)/wheelRadius`, with the canonical footprint end as a fixed phase origin. The axle-distance term matters: rigid rear pivots and coupled cars change their arc offsets during curvature transitions, so the lead window's travel alone would not describe their wheel travel. A regression compares phase deltas with independent stations along the authored S route. Stop, reverse and parked restoration preserve phase. Renderers can reduce an angle modulo a full turn when constructing matrices; they must not replace saved signed travel with the reduced phase. This route-distance model does not simulate different inner/outer tyre rolling radii or certify the later coupled steam linkage.

## Exact joins and render origins

The graph accepts its existing 0.2 mm / 0.25° editing/import tolerances. Those are not sufficient for pose continuity. The pose gate checks every joined pair in the conservative occupied history against a 1e-9 m positional difference and a 1e-9 tangent-vector difference. These numerical bounds recognize mathematically snapped parts; they are not claims of physical measurement accuracy. A visible axle must not cross a tolerated gap, overlap or tangent step. The gate rejects those joins as the retained footprint reaches them, before the leading axle does.

The original wheel contract uses a running surface 7.2 mm above the route's local base. Generated modules contain 1.5 mm sleepers and a 2 mm rail section, so their root needs a 3.7 mm roadbed offset. The diagnostic applies that transform and raycasts wheel contact points onto the actual generated rail meshes. Comparing two references to the same catalog constant would not establish rendered contact.

## Required integration transaction

Placement and exact restore must call `solveRoutedPoses` before committing a train. Any topology or composition change must validate both clearance and the complete candidate pose. An unsupported result must remain an editable diagnostic, not a partially displayed train.

For operation, `prepareVehicleStep(current, vehicles)` reconstructs a detached exact-motion candidate, advances one fixed tick, and solves all poses. On success, commit its `state.motion` and `state.poses` together. It never changes the supplied motion object. On a rejected candidate it supplies a parked fallback at the last compatible placement, with zero throttle/speed and unchanged route, signed travel and poses. Use that fallback and show the actionable error. If `parked` is null, the incoming placement itself was invalid and must not enter operation.

This compatibility stop is defensive rejection of unsupported geometry, not a physically smooth braking simulation. It prevents a model from continuing while old bodies remain rendered. The snapshot reconstruction has bounded input but unmeasured device cost; optimize it only while preserving the transaction and regression tests. The future graph runtime must use this gate or an equivalent tested atomic implementation, rather than calling `RoutedMotion.step()` and ignoring a failed pose result.

## Reproduce the evidence

```
npm run test:web -- tests/web/unit/routed-poses.test.ts tests/web/unit/turnout.test.ts tests/web/unit/routed-motion.test.ts
node tests/fixtures/track/capture-vehicles.mjs
```

The capture script creates six unchanged renderer views and a measured JSON report under `test-results/routed-vehicles/`. Minimum-radius motion, S transition, turnout passage, wheel contact and stopped reversal are mechanical engineering evidence. The fixture has no final locomotive body, production turnout blades/frogs, final scenery, audio or native UI. Its draw/triangle counts and software-renderer contact measurements do not establish Duo GPU performance or release readiness.
