# P06-T01 — fixed-tick routed train motion

## Checkpoint and scope

- Coordinator claim: `submission-coordinator`, started 2026-10-27T03:39:47.018Z from `e4e5146459d6a3df45594bc5ef5f06a5c244851d`.
- Implementation: coordinator; independent review and protected-topology repair: `track_runtime` (with the property-order issue first identified by the native reviewer).
- Published implementation and tested scoped source: `637b0dd348dbef0fe92b23aa32b7b0a5f7761ded`, `main`.
- Verification recorded: 2026-10-27T03:52:45.530792Z.
- Outcome: tested component ready for coordinator acceptance; no worker state mutation or release claim.

`web/src/simulation/routedMotion.ts` owns its routed consist and integrates exact 1/60-second speed ramps. It preserves excess arc distance across joins, ordinary/emergency braking, stopped reversal, signed wheel travel, bounded route lookahead and parked restore. A shortened turnout route must still provide enough stopping distance before its selection can commit.

The read-only `clearanceAhead` query in `routedConsist.ts` reports actual selected-route boundaries, including an unselected trailing turnout. Paused topology replacement preserves the semantic geometry of occupied pieces and the entire definition/connections of occupied or contacted physical turnouts. Unselected turnout routes cannot change beneath the train. Identical geometry and connections remain equivalent across object-key order, array order or reversed connection endpoints; stable IDs remain protected.

See [MOTION.md](../../web/src/simulation/MOTION.md) for parameters, stopping equations, snapshot semantics, limits and graph-tolerance qualifications.

## Acceptance evidence

Manifest: [P06-T01-routed-motion-unit.json](../../evidence/P06-T01-routed-motion-unit.json). Captured log: [P06-T01-motion-tests.txt](../../evidence/P06-T01-motion-tests.txt).

```sh
npm run test:web -- tests/web/unit/routed-motion.test.ts tests/web/unit/turnout.test.ts tests/web/unit/clock.test.ts
```

Observed: exit zero; 40 tests passed across three files (17 motion, 17 turnout and 6 clock tests). Scoped source, fixtures, tests and configurations matched the committed implementation bytes before and after execution. SHA-256 fingerprints and the existing npm proxy warning are preserved in the evidence/log. No skipped tests or scoped failures were observed.

| Criterion | What the tests establish |
| --- | --- |
| P06-T01-A1 | Analytic acceleration distance, preserved excess distance across aligned joins and identical commanded-tick snapshots at 30/60/120 Hz and irregular renderer schedules. |
| P06-T01-A2 | Deterministic stop/reverse, safe dead-end and wrongly-set trailing-turnout stops, bounded emergency braking, exact/parked restore, protected topology replacement, malformed input handling and 31,000 ticks with periodic stopped reversal. |

## Review findings fixed

Read-only executable probes found three topology replacement defects before publication: JSON key order could falsely reject identical occupied geometry; an unselected route within an occupied physical turnout could change; and an exactly contacted turnout could be removed. The implementation now uses explicit semantic comparison and the complete physical turnout/connection protection set. Four regression tests cover these cases plus endpoint-order equivalence and connection-identity preservation.

## Unverified work and next action

This is a pure model component, not integration with the current renderer, user controls, native persistence or document migration. The current app still runs the oval model. No rigid bogie/coupler solver, final wheel-contact review, production vehicle certification, signals, multi-train operation, simulator or physical-device performance is claimed. Exact geometric continuity is checked on aligned fixtures; the shared graph's 0.2 mm position and 0.25° tangent tolerances remain explicit and are not final visible seam acceptance.

Required Actions status remains coordinator-owned and is not declared passed by this local record. After reviewing the exact CI and accepting P06-T01 through the CLI, claim P06-T02 and implement physical vehicle placement from retained route history. Keep catalog identity/composition distinct from travel direction and keep wheel phase tied to signed actual travel. The v2 document/Swift validator work must use a separate explicit schema and preserve v1 layouts through a later tested migration.
