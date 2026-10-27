# ADR-0005 — Physical scale and the first operating-loop model

Status: **Accepted for development.** This decision selects engineering units and a bounded functional slice. It does not approve production artwork, hardware performance, or commercial release.

## Context

The repository began with a diagnostic oval and a fixed-step clock, while the 31-phase roadmap describes a complete railway editor, graph traversal, assets, and native application. The first operating slice needs a testable physical convention and a real shared logical model. A fixed, analytic oval can validate train operation, scenery commands, save transfer, and render reconstruction before arbitrary track graphs and turnout latching are ready.

## Decision

One world unit is one physical miniature meter. The board is 0.8 × 0.5 meters, centered on the XZ plane in right-handed coordinates with +Y up. A locomotive's local forward axis is +Z and its axle direction is +X. Geometry uses radians. These dimensions are authored choices, not measurements of an iPhone display or hinge.

The visual scale is HO-like 1:87. The modeled gap between the inner rail-head faces is 0.0165 m. The 0.001 m rail heads place rail centers 0.0175 m apart. Wheel radius is 0.006 m; signed wheel phase derives from actual distance divided by that radius. There is no hidden conversion between prototype and miniature units.

The first layout schema (`format: tin-junction-layout`, `schemaVersion: 1`) contains one analytic planar oval, one locomotive and two wagons, stable scenery IDs, environment, and a saved train checkpoint. The default oval has 0.34 m straight sections and 0.145 m semicircle radii. Its route starts on the upper straight at X = −0.17, Z = −0.145, traveling toward +X. Native Swift and the TypeScript model share these bounded document semantics; no renderer data is serialized.

Train simulation advances fixed 1/60 second ticks. Speed is capped at 0.18 miniature m/s, acceleration at 0.09 m/s², and braking at 0.18 m/s². A tick that reaches its target speed is split analytically at that time. These are toy-operation tuning choices, not a claimed model of steam thermodynamics or dynamically scaled full-size trains. Reversal requires zero throttle and a stationary consist. Entering Arrange explicitly parks the train and freezes model ticks. Restoring a saved layout keeps position and wheel phase but resets speed and throttle to zero.

Axles use a bounded root solve to preserve the rigid wheelbase chord on curves. Couplers use a separate bounded gap solve between authored body sockets. The procedural asset silhouettes remain development art; numeric contact checks are not final visual approval.

The detailed locomotive body is 0.074 m long with a 0.036 m wheelbase; wagons are 0.046 m long with 0.028 m wheelbases. The coupled consist uses a 0.006 m socket gap. An attempted 0.06 m minimum curve failed the coupler-envelope regression at straight/arc transitions, so this slice accepts radii from 0.10 to 0.20 m. The rejected smaller-radius case remains an explicit validation fixture. This is a geometry compatibility bound, not an adjustable performance budget.

## Transactions and resource limits

All edits build a candidate logical document, validate it, and commit once. Invalid commands leave the live document unchanged. Scenery and track edits require Arrange mode; environment and naming edits can occur during operation. Undo/redo affects structural state, preserves current operating time, and increases durable revision monotonically. The history retains at most 100 committed edits. Runtime command replay retains at most 256 envelopes and explicitly reports truncation. Diagnostics retain 32 messages. Full invariant scans are explicit test/debug probes rather than per-frame walks.

One layout supports at most 128 scenery instances and a 512 KiB input. IDs match `[A-Za-z0-9._:-]{1,128}`. Names contain 1–80 Unicode scalars and no C0/C1 control characters. Numbers must be finite and bounded; unknown fields and unknown schema versions are rejected. The fixed station and pond reserve their authored rectangles. Scenery footprints must remain within the board and clear the train's route envelope. Intentional clusters of scenery are allowed; general object collision authoring is a future task.

Document revision counts structural edits; simulation tick counts fixed operating steps; native persistence checkpoint sequence is a separate transport concern. Session command sequence and replay/undo history are not persisted in the portable layout. A newly restored native session has a new command identity namespace. Within a session, stale revisions, reordered envelopes, and reused command IDs fail explicitly; exact recent duplicates return idempotent results. Evicted old command IDs still cannot replay their stale sequence.

## Scope limits and later migration

The oval is a deliberately bounded operating sample. It is not the roadmap's arbitrary track-piece graph, turnout routing, signals, grades, track editor, full layout library, or imported asset system. Those tasks retain their existing acceptance criteria. Extending the portable format to graph tracks requires an explicit schema migration from this version and must preserve users' first layouts.

The browser harness can validate deterministic mechanics and interaction. Packaged WKWebView tests validate native integration. Physical Duo tests remain necessary for performance, heat, touch, fold ergonomics, and final appearance. No simulator or headless result closes those gates.

## Validation and reversal trigger

The implementation is exercised by `tests/web/unit/model-geometry.test.ts`, `model-validation.test.ts`, and `model-railway.test.ts`. The coordinator records actual results and tested commits in the project evidence ledger. This ADR does not substitute for that evidence.

Revise this decision if a launch asset cannot fit the selected radius/clearance envelope, a new topology requires a different schema, or measured device budgets require a different implementation. Preserve meter units and schema migration history even if the authored board or content dimensions change.
