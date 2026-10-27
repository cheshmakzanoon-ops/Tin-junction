# Routed scalar motion — P06-T01

`RoutedMotion` owns one `RoutedConsist` and advances exactly one 1/60-second simulation tick per `step()`. It accepts no render timestamp or variable integration interval. A caller uses the existing bounded `FixedStepClock`, stops requesting ticks while suspended, and resets that clock's anchor on resume. This controller is a reusable component; the current rendered app still uses its original oval model and schema version 1.

## Physical parameters and integration

The default profile uses a 0.18 m/s miniature speed ceiling, 0.09 m/s² acceleration, 0.18 m/s² ordinary braking, 0.36 m/s² emergency braking and 0.001 m clearance before a connected route ends. These are explicit model parameters, not measured locomotive dynamics or device-performance claims. Custom profiles are bounded; emergency braking cannot be weaker than ordinary braking, and the complete maximum braking horizon must fit the route kernel's bounded traversal.

Throttle selects a target speed within [0, maxSpeed]. Integration uses the exact area under a linear velocity ramp. If the target is reached during the tick, the tick is split into ramp and constant-speed portions. The resulting physical distance traverses selected directed edges, preserving excess distance across joins. Wheel animation can use signed actual travel; reversal changes the travel sign without resetting that accumulated distance.

## Braking and boundaries

Before advancing, the controller reads the selected connected route ahead, up to its maximum stopping horizon. An unselected trailing turnout is a boundary before the protected points, not a route that can be forced through.

The proposed power step must leave enough distance for its full continuous braking envelope after this tick: step distance + next speed²/(2 × braking deceleration), plus the configured endpoint clearance. If it cannot, power is removed and ordinary braking starts immediately. The automatic stop is latched through zero throttle, avoiding repeated acceleration near a buffer. Normal validated operation decelerates within the profile; tests reject use of the defensive `safety-stop` path in supported fixtures.

If a defensive route/movement check ever fails, motion stops, throttle becomes zero and the returned result explicitly reports `safety-stop`. This prevents invalid cursors but is not a claim of physically smooth recovery from corrupt state. Exact moving-state restore rejects insufficient braking distance rather than relying on that fallback.

An emergency stop uses its stronger bounded deceleration. An ordinary stop cannot downgrade an active emergency brake, and power is rejected until it stops. Direction reversal requires both exactly zero speed and zero throttle. It reverses the retained physical path; it does not reorder vehicles, rotate artwork, or reevaluate an occupied turnout into a different route.

## Atomic route changes

Turnout commands are first applied to a detached candidate consist. Occupancy locks still cover every vehicle, coupler, overhang and exact endpoint contact. An otherwise legal new route is rejected if the moving train lacks safe braking distance along it. Rejected commands leave the current topology, selection revisions and occupied intervals unchanged.

Replacing topology requires a newer validated topology, the expected prior revision, zero speed and zero throttle. Every occupied ordinary piece must retain its semantic dimensions, pose, gauge and profile. The entire physical definition and all attached connection identities of every occupied or contacted turnout must remain unchanged, including its currently unselected route. JSON object-key ordering and equivalent endpoint ordering are not geometric edits. Removal or movement beneath the train is rejected before installation; a safe edit to unrelated track can be accepted while preserving exact physical placement.

## Snapshots and bounds

The standalone `tin-junction-routed-motion` format, schema version 1, includes its immutable profile, routed-consist snapshot, tick, speed, throttle, signed travel and emergency brake state. It does not change the meaning of the app's `tin-junction-layout` schema version 1. Native support and an explicit document migration are required before app integration.

Ordinary restore preserves route identity, tick and signed wheel travel while parking the train. Exact moving restore is an explicit replay/testing option that validates the braking envelope. Inputs reject unknown fields, nonfinite/out-of-range values, incompatible topology and exhausted counters. Tick count is bounded by the shared model counter limit; signed travel is bounded to ±1e9 m. Route history remains bounded by the complete consist footprint, independent of session duration.

## Evidence scope

The motion tests compare analytic acceleration/braking distances, movement through straight and diverging routes, dead ends, wrong trailing approaches, whole-turnout editing locks, emergency and ordinary stops, exact replay restore, malformed inputs, and 31,000 ticks with repeated stopped reversals. Commands applied to identical simulation ticks produce identical snapshots at 30, 60 and 120 Hz and irregular render schedules.

Exact world continuity is tested on mathematically aligned joints. The shared graph validator still permits its documented 0.2 mm positional and 0.25° tangent manufacturing tolerances. These tolerances are not final close-up visual seam acceptance. Rigid bogies, couplers, wheel contact, vehicle minimum-radius certification, browser controls, native persistence, signals, multi-train operation, and physical-device performance remain separate work.
