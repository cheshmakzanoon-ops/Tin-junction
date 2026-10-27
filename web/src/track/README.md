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
