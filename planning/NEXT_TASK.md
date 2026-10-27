# Next task

> Generated from roadmap.json and state.json. Run `npm run project:next` for a live lease check.

Action: **implement**

First ordered task whose dependencies are complete and whose state is unclaimed.

CI snapshot: **passed**. Always check GitHub Actions for the current remote main commit.

## P00-T04 — Verify and publish the initial repository handoff

Phase: [planning/phases/P00-repository-foundation.md](phases/P00-repository-foundation.md)

Dependencies: P00-T03

Manual gate: none

### Required reading

- [docs/agents/HANDOFF_PROTOCOL.md](../docs/agents/HANDOFF_PROTOCOL.md)
- [docs/agents/TASK_EVIDENCE.md](../docs/agents/TASK_EVIDENCE.md)
- [docs/operations/IOS_CI.md](../docs/operations/IOS_CI.md)

### First actions

1. Run every available setup check and preserve actual output summaries.
2. Record any checks unavailable in the current environment rather than guessing outcomes.
3. Associate evidence with the tested implementation commit and source digests.
4. Publish the setup changes and confirm the intended remote main head.
5. Regenerate status and identify the first uncompleted platform task.
6. Record next actions, current CI state and owner-only release blockers.

### Acceptance

- **P00-T04-A1**: The setup evidence records actual commands/results and distinguishes local, browser, simulator and device validation. (repository_validation)
- **P00-T04-A2**: Remote setup and a durable handoff are published; only satisfied setup tasks are marked done. (repository_validation)

## Blocked work

No task is explicitly blocked. This is not evidence that future external gates are resolved.
