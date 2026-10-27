# Simulation, track geometry and operating rules

Status: PROPOSED engineering design. Values below are initial design parameters, not measured device performance or certified railway dynamics. Implementation must prove the listed invariants with fixtures and tests.

## 1. Separation of responsibilities

The simulation is a deterministic TypeScript module with no DOM, Three.js, WebKit, wall-clock, file or audio dependency. It accepts validated commands and immutable catalog definitions, advances fixed ticks, and produces state/events. The renderer interpolates state and owns meshes; native Swift persists snapshots and supplies platform observations.

The simulation must remain testable with a headless Node process. Do not make `THREE.Object3D.position` the authoritative train location. The renderer may disappear and be reconstructed without changing the railway.

## 2. Coordinate and unit contract

Proposed baseline, to be ratified in a scale ADR before final assets:

| Quantity | Convention |
|---|---|
| World distance | Physical miniature meters |
| World handedness | Right-handed |
| Up axis | +Y |
| Board plane | XZ |
| Canonical straight travel / locomotive forward | +Z |
| Canonical axle direction | +X |
| Angles in simulation | Radians |
| Native hinge payload | Degrees, converted explicitly at presentation boundary |
| Time | Seconds; integer tick counter |
| Speed | Miniature meters per second |
| Proposed visual scale | HO-like 1:87 |
| Proposed nominal gauge | 0.0165 m, measured between the modeled inner rail faces |
| Proposed board footprint | 0.8 m × 0.5 m |

Gauge and rail-center spacing are not identical when the rail head has thickness. Define the track profile so the inner-face gap is correct. Rolling-stock wheel tread/flange placement must match the same profile. Do not confuse gauge with centerline spacing between the two rails.

Three.js units are not intrinsically meters; the repository imposes this convention. All Blender/export inputs must honor it. A 1.0 unit model must represent 1.0 physical model meter, not one prototype meter scaled again at runtime.

Prototype-looking speed is an art parameter; do not claim dynamic similarity by merely dividing real train speed by 87. Time, acceleration and sound are tuned together against real miniature references and recorded in catalog data.

## 3. Core state types

Stable IDs are strings generated outside the tick loop and validated for bounded length. IDs never derive from array index, object pointer or current time.

Logical types:

```text
Layout
  id, schemaVersion, revision, catalogVersion, seed
  boardDefinitionId
  trackPieces[], connections[], scenery[], trains[], signals[]

TrackPiece
  id, catalogPieceId, rigidTransform, selectedRoute

Connector
  pieceId, socketId, worldPosition, outwardTangent, up, gauge, profile

TraversalEdge
  id, pieceId, entranceSocketId, exitSocketId
  curveDefinition, arcLength, clearanceProfile, routeCondition

Train
  id, vehicleCatalogIds[], direction, routeCursor, speed, throttle
  brakingState, routeHistory, occupiedIntervals

SimulationState
  tick, mode, layoutRevision, trains, switches, occupancy, acceptedCommands
```

Catalog geometry is immutable. Layout instances store pose and choices, not duplicated baked vertex buffers. Runtime caches such as sampled curves, BVHs and mesh handles are rebuilt and never treated as portable document data.

## 4. Fixed-tick clock

Initial fixed step: **1/60 second**. Higher simulation rates require evidence of an actual benefit and an explicit change to deterministic replay fixtures.

Proposed update sequence:

1. Accept commands whose assigned tick is due, ordered by `(tick, sequence, commandId)`.
2. Validate commands against current layout revision and mode; record accepted/rejected result.
3. Apply route/turnout changes only when occupancy rules permit.
4. Derive safe movement limits and braking targets.
5. Integrate train scalar motion and traverse graph boundaries.
6. Update axle/bogie/body poses from the traversed route.
7. Recompute affected occupancy and signal aspects.
8. Emit bounded semantic events and a state digest when requested.

Rendering uses an accumulator and interpolation fraction. The simulation itself never reads `performance.now()` or `Date.now()`.

Initial scheduler policy:

- Clamp a single foreground elapsed interval to 0.25 s.
- Run at most 8 catch-up ticks in one render opportunity.
- If still behind, discard excess wall-time debt with an explicit diagnostic counter; do not increase simulation `dt`.
- Reset the wall-clock anchor/accumulator on background or long suspension. Never fast-forward a train through minutes of unobserved movement.
- Paused editing advances neither train motion nor simulation-side sound phase unless explicitly necessary for a diagnostic test.

These bounds prevent a spiral of death. Replays compare the same commanded tick sequence, not elapsed wall time under different render stalls.

## 5. Determinism contract

- No `Math.random()` in deterministic systems. Use an identified, versioned seeded PRNG.
- Sort graph traversal candidates and serialized maps by stable IDs where order affects outcomes.
- Use explicit tolerances for floating-point comparisons; never compare geometry endpoints with exact equality.
- Reject `NaN`, infinity and denormal/pathologically small geometry parameters at input boundaries.
- Random scenery variation uses seed plus object ID, not creation order alone.
- Deterministic tests promise identical logical decisions and bounded numerical differences across supported JS engines. Bit-identical floating-point output across engines is not assumed without proof.
- State hashes use a canonical, documented numeric quantization. Hash quantization is for comparison only; it must not repeatedly round the live simulation state.
- Save round-trips preserve semantic IDs and route state, not ephemeral traversal cache indices.

## 6. Track-piece geometry

### 6.1 Supported primitives

Initial catalog uses certified planar straights, constant-radius arcs and authored turnouts. Grades, vertical curves, cant and freeform splines are separate future capabilities, not hidden additions to the first editor.

For each primitive provide:

- Position `p(s)` along centerline for arc length `s` in `[0,L]`.
- Unit tangent `t(s)` and unit up/normal frame.
- Curvature or a conservative curvature bound.
- Entrance/exit sockets with outward tangents.
- Rail-profile sweep definition, collision proxy and rolling-stock clearance envelope.
- Certified supported vehicle minimum radius.

Straights and circular arcs have analytic arc length. Do not approximate travel by linearly advancing a spline parameter and call that constant speed.

For later general curves, build an adaptive arc-length lookup table with explicit maximum chord and tangent error. Use binary search plus bounded refinement to invert distance to curve parameter. Validate high-curvature segments; a lookup table with arbitrary fixed samples is not a quality guarantee.

### 6.2 Rail placement

For a planar centerline, derive the right vector from the tangent/up convention. Rail sweeps use offsets established by the rail-profile/gauge definition. Sleepers are placed by accumulated arc distance, not parameter increments. Keep spacing coherent across adjacent pieces unless an intentional manufactured seam is authored.

Visual geometry may use LOD, but route length and connectivity never depend on the current rendering LOD. Collision and rail-contact surfaces remain stable when a mesh swaps level.

### 6.3 Connector compatibility

Two sockets connect only if:

1. Their positions are within the configured positional tolerance.
2. Their outward tangents are opposed within angular tolerance.
3. Their up frames and height/grade constraints are compatible.
4. Their gauge, rail profile and connector type agree.
5. Neither is already connected to an incompatible socket.
6. The resulting geometry remains within board/clearance constraints.

Proposed initial validation tolerances: 0.0002 m endpoint distance and 0.25° tangent opposition, subject to an authored-part round-trip test. These are engineering tolerances, not a license to show a visible 0.2 mm gap at macro zoom. Final visual seams require the stricter reference acceptance rubric.

Snap previews use a slightly larger user-interaction radius, but a committed snap produces mathematically aligned rigid transforms. Store the final pose; do not continually attract neighboring pieces every frame.

### 6.4 Junction graph

A turnout is not a graph node with an arbitrary random outgoing edge. Model each legal entrance-to-exit traversal as an explicit route with a condition. The selected route is latched when a train enters the protected turnout region and cannot change until the entire consist clears it.

Graph construction must detect duplicate edges, dangling connection references, self-connection errors, inconsistent direction and zero-length traversals. Disconnected decorative track can exist, but placing a train on it requires enough valid route for its complete consist and safe movement envelope.

## 7. Train motion model

The initial model is a bounded scalar traction/braking controller along a track route. It does not claim exact steam pressure, wheel slip or collision dynamics.

Proposed parameters to tune against miniature references:

- Normal miniature operating range around 0.04–0.12 m/s.
- Initial hard speed ceiling 0.18 m/s.
- Acceleration/braking envelopes are catalog data and must remain finite and positive.
- Optional jerk limiting is a later smoothness improvement after baseline stop/reverse correctness.

Compute target speed from throttle and direction. Approach it using acceleration/deceleration limits. Use a distance integration consistent with the chosen velocity ramp; do not use the new velocity for an entire tick without documenting the error. For a linear ramp within a step, trapezoidal integration is appropriate until a target/stop boundary is reached, at which point split the step.

### 7.1 Safety envelope

Before movement, compute available route distance to a buffer, red stop boundary, occupied block or missing connection. Initial stopping envelope:

```text
required distance = v² / (2 * guaranteedBrakeDeceleration)
                  + command/tick margin
                  + vehicle front/coupler clearance
```

The real implementation must account for its acceleration policy and any jerk limit; this formula is not sufficient if the guaranteed deceleration is delayed. Clamp requested movement so a single tick cannot cross an unsafe boundary. Safety traversal must handle crossing several short edges in one tick without tunneling.

If the safety limit is already violated by an imported state, stop and report invalid placement; do not teleport a train forward through the obstacle to recover.

### 7.2 Reversal

Initial rule: a direction change is accepted only once speed is below the configured stopped tolerance. Clear/zero throttle before reversal. Preserve the exact consist and its route history. The newly leading end needs a valid route and stopping envelope before acceleration.

Do not reverse by rotating every car 180° or rebuilding the consist in reverse array order. Vehicle orientations and coupler sides are physical identities.

## 8. Routed consist geometry

### 8.1 Route history

Maintain a deque of directed traversal segments with cumulative distance and the latched turnout decision used. Retain enough route behind the leading end to place the entire consist, plus a bounded margin. Reversing uses retained route history; it cannot reevaluate an occupied turnout into a new branch.

On loops, cumulative travel distance is unwrapped. Do not identify position solely by `distance % totalLoopLength`, because branched routes and long consists need traversal history. Bound retained history by consist length and look-ahead, not total session duration.

### 8.2 Axle and body placement

Each axle/bogie must remain on the correct traversed centerline. For a rigid vehicle with two reference bogie pivots separated by physical chord length `D`:

1. Locate its leading pivot on the route.
2. Search backward locally for a trailing route position whose Euclidean distance from the leading pivot is `D`.
3. Use a bounded root finder over the certified local curve interval.
4. Derive the rigid body pose from the pivot midpoint and connecting direction, with a stable up frame.
5. Solve the bogie/axle detail against that body transform.

Simply putting pivots `D` arc-length units apart produces a shorter chord on curves and can visibly shrink/slide the vehicle. A simplified arc-offset model is acceptable only for an explicitly marked engineering harness; it cannot pass final wheel-contact review.

Minimum radius and maximum vehicle length must guarantee a valid local solution. Detect non-bracketed or ambiguous solutions and reject the incompatible layout/vehicle combination; do not iterate forever.

### 8.3 Couplers

Coupler attachment points are authored sockets in vehicle coordinates. Adjacent cars maintain a bounded gap and allowed angular range. Use sequential route placement plus bounded local correction to satisfy coupler distance, with a deterministic iteration cap and explicit failure diagnostics. Do not model cars as independent followers that compress into each other at turnouts.

The v1 constraint model may omit elastic slack. If slack is later added, document its state, units and save/replay behavior. It must not create random oscillation or cause cars to jump to another branch.

### 8.4 Wheels and running gear

- Wheel phase follows signed traveled distance divided by actual wheel radius.
- Direction reversal reverses phase smoothly; it does not reset animation time.
- Wheel mesh axes and radii are catalog facts checked during asset validation.
- Side rods and valve gear follow wheel phase with authored linkage constraints; independent looping clips that visibly detach are not acceptable.
- Locomotive sound cadence should derive from the same movement/phase model where practical.
- World movement and wheel phase survive pause/resume and save/load without a visible discontinuity.

## 9. Turnout occupancy and signals

Occupancy is computed from the full consist's swept route intervals, not only the locomotive point. Include front/rear overhang and couplers in clearance.

A turnout has a protected route region. While any train interval intersects it:

- Switching is rejected or explicitly queued according to one chosen policy; initial policy is reject with explanation.
- The selected branch remains latched for all following cars.
- Deletion/editing of the occupied track is prohibited unless the user deliberately relocates/resets the train in edit mode.

Initial signal system is intentionally simple:

- Divide designated routes into blocks bounded by authored signal positions.
- A permissive aspect requires a valid selected route, sufficient free stopping distance and no incompatible occupied block.
- A stop aspect constrains simulation movement; its lamp color is not only decorative.
- Unknown/malformed state fails safely to stop.
- Document whether a signal applies in one direction or both; do not infer direction from mesh orientation alone.

A one-train launch still needs turnout safety. Multi-train operation is a separate capacity/UX decision, not automatically promised by generic array types.

## 10. Editing and graph invalidation

All topology-changing commands execute while the operating simulation is paused. Validation uses a candidate graph without mutating the live world.

Transaction order:

1. Validate command shape, layout revision and catalog references.
2. Build candidate changed pieces/connections.
3. Rebuild only affected graph/curve caches.
4. Validate connectivity, clearances and each existing consist placement.
5. If invalid, reject without partial mutation.
6. If valid, atomically replace affected logical state and increment revision.
7. Emit one committed-edit event; renderer updates independently.

After deleting track under a train, do not silently snap the train to the nearest unrelated rail. Require deliberate train removal/relocation or reject deletion.

## 11. Numeric and resource limits

All imported and editor-authored data is bounded. Initial limits are proposed and must be ratified by performance tests:

- Maximum track pieces per layout: 500.
- Maximum scenery instances: 2,000, with catalog-specific resource limits.
- Maximum vehicles per consist: 8 internally; launch UX may expose fewer.
- Maximum supported operating trains: explicitly configured, initially 1.
- Maximum graph traversal steps per tick: derived from smallest legal edge length and speed cap, with a hard defensive ceiling.
- Maximum constraint iterations per vehicle: fixed and recorded; no unbounded iterative solver.

Reject oversized documents before allocating large derived geometry. A limit message must explain what exceeded the limit, not crash or silently drop content.

## 12. Required simulation fixtures

| Fixture | Required assertions |
|---|---|
| Straight and reverse | Distance integration, wheel phase, stop and reversal |
| Full circle | No accumulated position drift or visible joint snap after many laps |
| Oval with mixed lengths | Constant physical speed across piece boundaries |
| S-curve | Bogie and coupler constraints remain valid |
| Facing turnout | Branch chosen and latched; entire train follows it |
| Trailing turnout | Defined legal route behavior; no forced illegal switch |
| Occupied turnout | Switch rejected until rear clearance leaves region |
| Buffer end | Train stops before boundary at maximum certified speed |
| Broken connection | Safe stop; no graph tunneling or infinite loop |
| Delete under consist | Transaction rejected without partial mutation |
| Long consist near loop length | Bounded history, no self-overlap accepted accidentally |
| Pause/background | No hidden travel or burst catch-up on resume |
| Save/load on curve | Stable route, vehicle pose and wheel phase |
| Renderer at 30/60/120 Hz | Same commanded ticks produce equivalent logical state |
| Extreme invalid input | NaN, infinity, zero radius, duplicate IDs and huge counts rejected |

Use property-based generation for graph invariants once basic fixtures are stable. Seed every failure and preserve a minimal reproducer. A long-running test checks bounded route-history and memory growth, not just whether the train still appears to move.

## 13. Completion evidence

Simulation completion requires unit/property tests, deterministic replay fixtures and runtime captures of the same cases. Final visual train motion additionally needs the hero assets, real-device frame-time evidence and close-up wheel/coupler review. Passing pure geometry tests does not certify visual realism.

Related: [System architecture](SYSTEM_ARCHITECTURE.md), [persistence/editor](PERSISTENCE_AND_EDITOR.md), [asset pipeline](../graphics/ASSET_PIPELINE.md), [test strategy](../quality/TEST_STRATEGY.md).
