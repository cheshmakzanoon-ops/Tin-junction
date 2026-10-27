# Next task

> Generated from roadmap.json and state.json. Run `npm run project:next` for a live lease check.

Action: **resume**

Resume the claimed task with its current owner; do not duplicate its work.

CI snapshot: **passed**. Always check GitHub Actions for the current remote main commit.

## P04-T01 — Ratify miniature units and coordinate conventions

Phase: [planning/phases/P04-deterministic-model-kernel.md](phases/P04-deterministic-model-kernel.md)

Dependencies: P00-T04

Manual gate: none

### Required reading

- [docs/architecture/SIMULATION_AND_TRACKS.md](../docs/architecture/SIMULATION_AND_TRACKS.md)
- [docs/graphics/ART_DIRECTION.md](../docs/graphics/ART_DIRECTION.md)
- [docs/architecture/SYSTEM_ARCHITECTURE.md](../docs/architecture/SYSTEM_ARCHITECTURE.md)

### First actions

1. Use right-handed coordinates, Y up and XZ ground.
2. Adopt one world unit as one physical miniature meter.
3. Evaluate the proposed HO 1:87, 16.5 mm gauge and 0.8 by 0.5 m baseboard.
4. Define locomotive forward axis, wheel pivots and angle units.
5. Separate prototype-scale labels from simulation/render transforms.
6. Render and numerically check a ruler, gauge and known-radius fixture.

### Acceptance

- **P04-T01-A1**: All geometry fixtures agree on units, axes and gauge within specified numeric tolerances. (unit_test)
- **P04-T01-A2**: The scale ADR records actual chosen dimensions without presenting them as device measurements. (repository_validation)

## Blocked work

No task is explicitly blocked. This is not evidence that future external gates are resolved.
