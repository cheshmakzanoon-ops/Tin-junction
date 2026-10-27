# P00 — Repository foundation and agent continuity

> Generated from planning/roadmap.json. Edit the JSON definition, then run `npm run project:render`.

## Outcome

Establish truthful specifications and an executable continuation system before game implementation.

## Exit gate

Repository definitions, validation harness and a reproducible handoff exist; no game, graphics or hardware completion is implied.

The phase is not accepted merely because these instructions or its source files exist. Each task requires the stated evidence. Current progress lives in [the ledger](../state.json).

## P00-T01 — Publish the product contract and engineering boundaries

Dependencies: none

Manual gate: none; planning estimate: 1–3 focused sessions; planning estimate, not a delivery promise. Estimates are not deadlines or completion claims.

### Read first

- [docs/product/PRODUCT_SPEC.md](../../docs/product/PRODUCT_SPEC.md)
- [docs/architecture/SYSTEM_ARCHITECTURE.md](../../docs/architecture/SYSTEM_ARCHITECTURE.md)
- [docs/agents/CONTINUATION_PROTOCOL.md](../../docs/agents/CONTINUATION_PROTOCOL.md)

### Owned scope

- `README.md`
- `AGENTS.md`
- `START_HERE.md`
- `docs/`

### Deliverables

- Navigable product and architecture specifications
- Explicit Duo-only, offline and no-puzzle scope

### Implementation sequence

1. Translate the owner's accepted concept into one launch-kit scope.
2. Separate Swift platform responsibilities from Three.js world responsibilities.
3. List verified platform facts separately from proposed performance targets.
4. Record unresolved naming and Duo-only distribution gates without declaring clearance.
5. Cross-link the boot path, subsystem specifications and release constraints.

### Acceptance criteria

- **P00-T01-A1** — Product and architecture documents state the accepted scope, subsystem ownership and unresolved release constraints.
  - Accepted evidence: repository_validation.
- **P00-T01-A2** — A new reader can locate the roadmap, ledger and handoff from root instructions without relying on chat.
  - Accepted evidence: repository_validation.

### Verification

- Check all required_reading paths and Markdown relative links.
- Review forbidden monetization and puzzle features against the product specification.

### Failure cases and cautions

- A large document volume can conceal missing operational instructions.

### Handoff requirement

Record tested implementation SHA, changed scope, acceptance evidence, commands/results, unrun checks, blockers and the next exact task. Use [the handoff template](../../templates/HANDOFF.md). Update state through the project CLI, regenerate views, and push the metadata checkpoint.

## P00-T02 — Install the task graph, evidence ledger and continuation validator

Dependencies: P00-T01

Manual gate: none; planning estimate: 1–3 focused sessions; planning estimate, not a delivery promise. Estimates are not deadlines or completion claims.

### Read first

- [docs/agents/CONTINUATION_PROTOCOL.md](../../docs/agents/CONTINUATION_PROTOCOL.md)
- [docs/agents/TASK_EVIDENCE.md](../../docs/agents/TASK_EVIDENCE.md)
- [docs/agents/HANDOFF_PROTOCOL.md](../../docs/agents/HANDOFF_PROTOCOL.md)
- [docs/agents/RECOVERY_PLAYBOOK.md](../../docs/agents/RECOVERY_PLAYBOOK.md)

### Owned scope

- `tools/project.mjs`
- `planning/`
- `tests/project/`

### Deliverables

- Machine-readable dependency graph and mutable task ledger
- Deterministic next-task and claim commands

### Implementation sequence

1. Define immutable task IDs, ordered phases and dependency edges.
2. Store mutable status, claims, blockers and evidence only in the ledger.
3. Generate human-readable phase pages, status and next-task projections.
4. Reject cycles, orphan tasks, false completion, absent evidence and invalid transitions.
5. Test active/stale claims, blocked dependencies and failed-CI priority.
6. Demonstrate a handoff and recovery without changing unrelated work.

### Acceptance criteria

- **P00-T02-A1** — Repository validation and project-command tests pass for valid state and reject the documented invalid fixtures.
  - Accepted evidence: repository_validation, unit_test.
- **P00-T02-A2** — Repeated selection on identical state identifies the same next eligible task and explains blockers.
  - Accepted evidence: unit_test.

### Verification

- Run the project validator and Node project test suite.
- Mutate isolated fixture state to demonstrate failed dependencies cannot become done.

### Failure cases and cautions

- Hand-edited generated dashboards can drift from the ledger.

### Handoff requirement

Record tested implementation SHA, changed scope, acceptance evidence, commands/results, unrun checks, blockers and the next exact task. Use [the handoff template](../../templates/HANDOFF.md). Update state through the project CLI, regenerate views, and push the metadata checkpoint.

## P00-T03 — Install diagnostic Swift and Three.js scaffolds with CI definitions

Dependencies: P00-T02

Manual gate: none; planning estimate: 1–3 focused sessions; planning estimate, not a delivery promise. Estimates are not deadlines or completion claims.

### Read first

- [docs/architecture/SYSTEM_ARCHITECTURE.md](../../docs/architecture/SYSTEM_ARCHITECTURE.md)
- [docs/architecture/BRIDGE_PROTOCOL.md](../../docs/architecture/BRIDGE_PROTOCOL.md)
- [docs/operations/IOS_CI.md](../../docs/operations/IOS_CI.md)

### Owned scope

- `apps/ios/`
- `web/`
- `tools/ios/`
- `tools/build-web.mjs`
- `.github/workflows/`
- `package.json`
- `package-lock.json`

### Deliverables

- Pinned web diagnostic build and offline native asset bundle
- Unsigned simulator and repository-quality workflow definitions

### Implementation sequence

1. Pin dependency versions and commit the reproducible lockfile.
2. Create a plainly labelled engineering scene with no finished-game claim.
3. Connect native and web bootstrap diagnostics using the versioned envelope.
4. Add explicit toolchain and Duo simulator inventory assertions.
5. Upload logs and diagnostic artifacts on failures as well as success.
6. Keep signing and store publication outside ordinary push workflows.

### Acceptance criteria

- **P00-T03-A1** — Web type checks, unit checks and bundled asset generation succeed with locked dependencies.
  - Accepted evidence: repository_validation, unit_test.
- **P00-T03-A2** — Native project and workflow files are installed with explicit SDK checks; unexecuted native checks are clearly disclosed.
  - Accepted evidence: repository_validation.

### Verification

- Run the web build and inspect the generated local bundle for remote-script dependencies.
- Parse workflow YAML and verify every referenced tool/script path exists.

### Failure cases and cautions

- Installing a workflow does not prove it ran or that the application is ready.

### Handoff requirement

Record tested implementation SHA, changed scope, acceptance evidence, commands/results, unrun checks, blockers and the next exact task. Use [the handoff template](../../templates/HANDOFF.md). Update state through the project CLI, regenerate views, and push the metadata checkpoint.

## P00-T04 — Verify and publish the initial repository handoff

Dependencies: P00-T03

Manual gate: none; planning estimate: 1–3 focused sessions; planning estimate, not a delivery promise. Estimates are not deadlines or completion claims.

### Read first

- [docs/agents/HANDOFF_PROTOCOL.md](../../docs/agents/HANDOFF_PROTOCOL.md)
- [docs/agents/TASK_EVIDENCE.md](../../docs/agents/TASK_EVIDENCE.md)
- [docs/operations/IOS_CI.md](../../docs/operations/IOS_CI.md)

### Owned scope

- `planning/handoffs/`
- `planning/HANDOFF.md`
- `evidence/`
- `planning/state.json`

### Deliverables

- Reproducible local check evidence
- Initial published continuation handoff

### Implementation sequence

1. Run every available setup check and preserve actual output summaries.
2. Record any checks unavailable in the current environment rather than guessing outcomes.
3. Associate evidence with the tested implementation commit and source digests.
4. Publish the setup changes and confirm the intended remote main head.
5. Regenerate status and identify the first uncompleted platform task.
6. Record next actions, current CI state and owner-only release blockers.

### Acceptance criteria

- **P00-T04-A1** — The setup evidence records actual commands/results and distinguishes local, browser, simulator and device validation.
  - Accepted evidence: repository_validation.
- **P00-T04-A2** — Remote setup and a durable handoff are published; only satisfied setup tasks are marked done.
  - Accepted evidence: repository_validation.

### Verification

- Run project validation after the evidence/state update.
- Verify remote main contains the reported files and handoff.

### Failure cases and cautions

- A local-only handoff does not help the next agent.

### Handoff requirement

Record tested implementation SHA, changed scope, acceptance evidence, commands/results, unrun checks, blockers and the next exact task. Use [the handoff template](../../templates/HANDOFF.md). Update state through the project CLI, regenerate views, and push the metadata checkpoint.
