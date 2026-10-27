# P05-T04 — explicit turnout routes and whole-consist protection

## Checkpoint

- Coordinator claim: `submission-track`, started 2026-10-27T03:28:17.004Z; implementation worker: `track_runtime`.
- Starting claim revision: `02c0bc82746b8391fbf578cd0bed2b7bef8e1348` on `main`.
- Published and locally verified implementation: `e4e5146459d6a3df45594bc5ef5f06a5c244851d`.
- Evidence recorded: 2026-10-27T03:35:36.472719Z.
- Outcome: implemented and submitted to the coordinator for scoped acceptance. The coordinator owns task state, required CI observation and publication of this metadata.
- Critical boundary: this is a pure routing/occupancy component. The rendered app and its native schema-v1 oval documents are unchanged.

## Implementation

`web/src/track/turnout.ts` validates physical stock/straight/diverging sockets and compiles stable directed routes using the existing centerline, connector and graph modules. Only the selected route joins the stock socket. Duplicate physical connections, invalid geometry, route-ID aliases and malformed route selections fail without publishing a candidate graph.

`web/src/simulation/routedConsist.ts` keeps the entire train's swept footprint as bounded directed intervals. The declared length includes every vehicle, coupler and overhang. Switching is locked while any part or endpoint contact occupies a protected turnout. A trailing approach on the wrong branch stops at the protected entrance. Reversal preserves the existing physical path and requires an explicit stopped-state assertion from the future traction controller. Restore validates the full route and rejects a selection change beneath an occupied train, even if the train is wholly inside one turnout route.

The current route state and graph are unchanged on rejected commands. Selection revisions reject stale commands. Movement history is trimmed from the rear, so its memory depends on train length and the traversed pieces rather than session duration. Fully occupied circuits without nose/tail clearance and self-overlap are rejected.

Supporting files: `tests/fixtures/track/turnout-fixtures.ts`, `tests/web/unit/turnout.test.ts`, and the appended contract in `web/src/track/README.md`.

## Acceptance evidence

Manifest: [P05-T04-turnout-routing-unit.json](../../evidence/P05-T04-turnout-routing-unit.json). Captured log: [P05-T04-turnout-tests.txt](../../evidence/P05-T04-turnout-tests.txt). Relevant source/configuration/fixture hashes were measured and compared byte-for-byte against the committed implementation tree before execution.

| Criterion | Observed result |
| --- | --- |
| P05-T04-A1 | Both routes and directions, mirrored geometry, front/middle/rear and exact-boundary occupancy, safe trailing stops, reversal and snapshot restore passed. A 20,000-step circuit fixture retained at most three intervals for its 0.12 m train. |
| P05-T04-A2 | Occupied, unknown and stale switch commands returned deterministic feedback with unchanged graph/path and byte-identical serialized state. Invalid movement returned an error without throwing or mutating state. |

Executed against the committed scoped inputs on Linux with Node as recorded in the log:

```sh
npm run typecheck
npm run test:web -- tests/web/unit/turnout.test.ts tests/web/unit/track-graph.test.ts tests/web/unit/track-centerline.test.ts tests/web/unit/track-module.test.ts
```

Both exited zero. The focused turnout suite passed 17 tests; the complete scoped run passed 63 tests across four files. The existing npm `http-proxy` environment warning was retained in the log. No skipped tests or known failures occurred in this scoped run. `git diff --check` also passed before handoff preparation.

## Limits and unrun verification

No browser UI, packaged WKWebView, native simulator or physical device was exercised by this evidence. No rendered turnout, rigid vehicle/coupler integration, signal behavior, speed/braking envelope, multi-train operation, topology-edit-under-train behavior or complete graph editor is accepted here. No final art or release approval is claimed. Required GitHub Actions for the implementation revision are observed separately by the coordinator; this local manifest does not declare them passed.

The separate `tin-junction-routed-consist` snapshot is not a replacement interpretation of `tin-junction-layout` schema version 1. P06 integration must preserve early oval layouts through an explicit versioned migration and corresponding native validation. Do not attach this snapshot to the current bridge as though its schema were already supported.

## Coordination and next work

The coordinator accepted P05-T04 through the project CLI against the published implementation and reviewed unit evidence, then claimed P05-T05 as `submission-track`. These metadata changes await the next publication checkpoint. Other agents' edits to `web/src/main.ts`, scene materials/scenery, canopy geometry, scenery tests and P01 source evidence were preserved and are outside this record.

The next independent task is P05-T05: conservative board/track clearance and explicit unsupported-geometry diagnostics, with composed editor placement integration evidence as required by A2. Retain editable disconnected track while rejecting unsafe operation. The current implementation's remote CI is pending; the native repair run at `02c0bc8` is still executing and its web workflow passed. Do not infer general app integration, current native CI success or store readiness from this component's unit evidence.
