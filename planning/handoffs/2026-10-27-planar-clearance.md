# P05-T05 — conservative planar clearance and editable placement

## Checkpoint and scope

- Claim: `submission-track`, started 2026-10-27T03:38:37.038Z from `e4e5146459d6a3df45594bc5ef5f06a5c244851d`.
- Published implementation and tested scoped source: `637b0dd348dbef0fe92b23aa32b7b0a5f7761ded`, `main`.
- Verification recorded: 2026-10-27T03:52:45.530792Z.
- Outcome: implementation and unit/component-integration evidence ready for coordinator acceptance. No task-state or handoff-pointer change was made by the worker.

`web/src/track/clearance.ts` checks the declared full vehicle envelope against the board, vehicle radius, explicit planar policy and other track. Adaptive centerline capsules include their maximum chord-error allowance. Only local explicit connector neighbourhoods and the two protected routes of one authored turnout receive defined exemptions. Off-plane crossings fail even when a hypothetical vertical gap would fit a vehicle; no bridge or grade is silently certified.

`web/src/editor/placementValidation.ts` preserves invalid or incomplete geometry as a transient editable draft. Its explicit train-placement transaction requires current draft revision and paused edit mode, rebuilds topology/clearance, then places the whole routed consist. Failed placement preserves the draft and any previous committed train. Diagnostics identify physical conflicting piece IDs and how to repair them.

Exact limits, envelope assumptions, exemptions and remaining integration are in [CLEARANCE.md](../../web/src/track/CLEARANCE.md). Fixtures and tests are `tests/fixtures/track/clearance-fixtures.ts`, `tests/web/unit/track-clearance.test.ts` and `tests/web/unit/placement-validation.test.ts`.

## Acceptance evidence

| Criterion | Observed verification | Manifest |
| --- | --- | --- |
| P05-T05-A1 | 12 unit tests passed: safe/incomplete geometry; turnout shared region; crossing, parallel and self-overlap; connector exemptions; case/radius boundaries; raised-crossing rejection; deterministic/bounded validation. | [P05-T05-clearance-unit.json](../../evidence/P05-T05-clearance-unit.json) |
| P05-T05-A2 | 10 component-integration tests passed: draft → topology → clearance → routed train; invalid-draft preservation; corrected placement and turnout lock; previous-train preservation; short disconnected routes; edit mode/revisions; actionable piece IDs; malformed input. | [P05-T05-placement-integration.json](../../evidence/P05-T05-placement-integration.json) |

Actual commands:

```sh
npm run test:web -- tests/web/unit/track-clearance.test.ts
npm run test:web -- tests/web/unit/placement-validation.test.ts
```

Both exited zero under Node/Vitest on Linux. Relevant code, fixture, test and configuration bytes were compared against the committed tree both before and after execution. Source and log SHA-256 values are in the manifests. The existing npm proxy-environment warning was preserved. No test was skipped. Logs: [clearance](../../evidence/P05-T05-clearance-tests.txt), [placement integration](../../evidence/P05-T05-placement-tests.txt).

## Unverified work and boundaries

The integration evidence is a composed Node test, not the rendered app editor or native WKWebView. The existing oval schema, native storage and app controls remain unchanged. Vehicle envelope inputs are declared catalog parameters and still need measurement against production assets. No grades, bridge kit, graphical placement ghost, migration, native inspector, final turnout art or physical-device performance is accepted here.

Required CI for this revision is tracked separately by the coordinator; these local records do not claim a native pass. Other agents' in-progress case/pond graphics, scene tests and P01 source evidence were preserved outside this scoped record. Coordinator owns metadata publication, claim completion and next-task selection.

## Next action

Review both manifests and the actual implementation CI, then complete P05-T05 using both evidence types. P06-T01's distance-based motion evidence is separate. The next train-placement work must combine the catalog's full physical dimensions and rigid route-based vehicle poses; do not replace schema-v1 oval meanings or assume the current declared envelope certifies final wheel/coupler geometry.
