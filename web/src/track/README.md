# Parametric centerline contract (P05-T01)

This pure module is independent of the current schema-v1 oval and does not replace its save format or claim a complete track editor.

- Physical miniature metres, XZ plane, +Y up, canonical start at the origin traveling +Z. Optional rigid pose rotates yaw about +Y and translates the piece; there are no grades, cant or splines.
- Positive arc sweep turns towards +X (clockwise when viewed from +Y with +Z pointing up the plan). Negative sweep turns towards −X. Signed curvature is `sign(sweep)/radius`; straights have zero curvature. Right = up × tangent.
- Straight lengths: 0.001–2 m. Radius: 0.1–1 m. Arc sweeps: nonzero through ±2π, and arc length must be at least 0.001 m. The minimum radius matches the existing workbench. These bounds are geometric guardrails, not certification of every vehicle, board placement or connection.
- Pose coordinates: ±100 m, yaw: ±2π radians. External callers normalize authored rotations before validation; no enormous-angle precision loss is hidden.
- Sampling rejects non-finite and out-of-range values instead of wrapping or clamping. Zero-length pieces fail before any division. Exact endpoints are included.
- Analytic arc length is authoritative. Lookup tables contain strictly increasing exact distances and parameters; their chord sum is a separate approximation metric, never the simulation's distance clock.
- Default sampling budgets: 0.00001 m maximum sagitta, 0.25° endpoint tangent change, 0.01 m arc distance per segment. The strictest bound chooses subdivisions; at most 8,193 samples may be allocated. Impossible budgets throw instead of silently reducing fidelity.
- Numeric acceptance in unit tests: 1e-10 m for analytic positions/lengths and unit-frame components, 1e-10 radians for tangent expectations. Default polygonal length relative error ≤ 1e-6 for arcs, including the minimum 0.1 m radius. These computational tolerances are stricter than, and do not certify, manufactured socket or visual seam tolerances.

`parameterAtDistance` validates the table before binary search. For future hot-path graph traversal, compile/validate route caches once rather than repeatedly accepting untrusted tables. Both primitives already have analytic distance parameterizations; no lookup approximation is needed for their actual motion.

Fixtures: `tests/fixtures/track/centerlines.json`. Tests: `tests/web/unit/track-centerline.test.ts`. Neither browser/device rendering nor general graph connectivity is established by these tests.

## Modular rail kit (P05-T02)

`module.ts` sweeps the shared original HO-like rail section along the analytic centerline. The 16.5 mm gauge is between the inner head faces, while 1 mm heads put rail centers 17.5 mm apart. Rail foot, web and head are one concave section with hard face normals, consistently outward triangle winding and optional endpoint caps. Rendering samples do not change analytic route length. Planar arcs preserve a positive inner offset radius at the minimum supported 0.1 m centerline radius.

Sleepers are 29 × 3 × 1.5 mm at 7 mm center spacing. Supply cumulative `routeOffset` to retain the same half-spacing lattice across module boundaries. Exactly-on-boundary sleepers belong only to the following module. The fixed dimension limits bound sleeper allocation; route offsets are finite 0–10,000 m.

Connectors have stable `entrance`/`exit` IDs scoped to a piece ID, outward tangents, +Y up, grade zero, gauge and profile metadata. Unsupported profiles/grades or malformed frames fail explicitly. Compatibility checks use the specification's 0.2 mm positional and 0.25° angular limits; exact alignment returns a new pose and does not mutate a layout. Occupancy, duplicate connections and graph authority are intentionally P05-T03 work. A compatible-looking seam is not automatically registered as a graph connection. End caps are removed only when the caller explicitly asks; no proximity heuristic hides broken topology.

`tests/web/unit/track-module.test.ts` checks gauge throughout both minimum-radius curve directions, coincident section vertices at standard joints, winding/normals, connector round trips, and sleeper continuity. `tests/fixtures/track/joints.html` is a separate non-shipping Three.js inspection fixture. Run `node tests/fixtures/track/capture-joints.mjs` (with an installed Playwright Chromium) from the repository root to capture actual straight/curve and curve/curve overviews and close-ups in `test-results/track-joints/`. Captures use single-sided materials so reversed surfaces cannot be hidden by DoubleSide. This is geometric visual evidence, not final production art or a native/device test.

## Directed route graph (P05-T03)

`graph.ts` validates a detached candidate and produces an immutable graph of at most 500 pieces and 500 explicit connections. Piece definitions include gauge/profile metadata and validated rigid poses. Socket pairs are not inferred from visual proximity. Unsupported profiles, missing IDs, duplicate IDs, self-connections, occupied sockets/implicit branching, malformed inputs and misaligned endpoints fail before a graph is published. Unconnected sockets are reported in `openSockets`; decorative disconnected track is allowed, but traversal cannot jump between nearby pieces.

Each piece has stable `/forward` and `/reverse` directed edge IDs. Entering the exit socket chooses the reverse edge, rather than changing the piece's identity. Connections use the P05-T02 compatibility tolerances without silently moving pieces to close their gaps. Validated edge arrays are sorted by stable piece ID. Runtime adjacency lives in a private weak cache; a deserialized or forged derived graph must pass `buildRouteGraph` again.

`advanceRoute` traverses iteratively, stops exactly at open ends, and reports consumed/remaining distance. Exact connected endpoints canonicalize to the next directed edge at distance zero. It detects repeated directed-edge arrivals and skips complete cycles, keeping a graph-derived transition limit and bounded arrival map even for a million laps. Requested distance is finite, nonnegative and at most 1,000,000 miniature metres; this defensive algorithm limit is not a permitted simulation tick speed. `sampleRouteCursor` preserves physical piece placement and reverses the travel tangent/frame only when following a reverse edge.

`editRouteGraph` requires paused edit mode and the current revision. Up to 100 add/remove/move/connect/disconnect operations build one detached candidate. Only a fully valid final graph commits and increments the revision once; rejection returns the identical original graph. Removing a connected piece requires explicit disconnects in the same batch. There is no silent graph repair or automatic train relocation.

Tests cover four-piece circuits in both directions, 20,000 successive laps, huge-cycle skipping, the full 500-piece open chain, branched/duplicate/malformed fixtures, exact endpoint conventions, external mutation isolation, unchanged rejected edits, and seeded valid edits. These components are not yet integrated into schema-v1 saves or the app editor. Turnout route conditions/occupancy are P05-T04; board collision, train-placement and full editing validation remain their separate gates.
