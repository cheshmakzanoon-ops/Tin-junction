# Architecture decision register

Use [the ADR template](../../templates/ADR.md). Decisions have a status (`proposed`, `accepted`, `superseded`), a context, alternatives, consequences, validation evidence and a reversal trigger.

| ID | Decision | Status |
|---|---|---|
| [ADR-0001](ADR-0001-swift-threejs.md) | Swift host + bundled Three.js, explicit ownership | Accepted for development; packaged runtime spike required |
| [ADR-0002](ADR-0002-duo-only.md) | Duo-only product scope; distribution verification gate | Accepted scope; distribution mechanism unresolved |
| [ADR-0003](ADR-0003-graphics-baseline.md) | WebGL2 baseline, physical miniature units, measured quality | Accepted baseline; hardware budget provisional |
| [ADR-0004](ADR-0004-agent-state.md) | Task graph + evidence ledger, generated continuation views | Accepted |

New decisions receive new stable IDs. Do not rewrite history to pretend an early assumption was verified. When reversing a decision, record the old ID in the new ADR and link both directions.
