# P30 — Maintenance and next-version discipline

> Generated from planning/roadmap.json. Edit the JSON definition, then run `npm run project:render`.

## Outcome

Keep the released miniature railway reliable without losing saves, quality or the owner's original scope.

## Exit gate

The first maintenance cycle is documented; future work receives new stable tasks rather than rewriting completed history.

The phase is not accepted merely because these instructions or its source files exist. Each task requires the stated evidence. Current progress lives in [the ledger](../state.json).

## P30-T01 — Establish recurring defect and support triage

Dependencies: P29-T04

Manual gate: none; planning estimate: 1–3 focused sessions; planning estimate, not a delivery promise. Estimates are not deadlines or completion claims.

### Read first

- [docs/operations/RELEASE_RUNBOOK.md](../../docs/operations/RELEASE_RUNBOOK.md)
- [docs/agents/RECOVERY_PLAYBOOK.md](../../docs/agents/RECOVERY_PLAYBOOK.md)
- [docs/agents/CONTINUATION_PROTOCOL.md](../../docs/agents/CONTINUATION_PROTOCOL.md)

### Owned scope

- `planning/`
- `docs/operations/`

### Deliverables

- Maintenance ownership/cadence
- Issue classification policy

### Implementation sequence

1. Define who reviews authorized crash/support information.
2. Assign severity and reproduction requirements.
3. Preserve user privacy in attached diagnostic data.
4. Convert confirmed defects into stable new backlog tasks.
5. Document cadence without claiming an unscheduled monitor is running.

### Acceptance criteria

- **P30-T01-A1** — A concrete owner-approved maintenance process identifies inputs, cadence and escalation rules.
  - Accepted evidence: repository_validation.
- **P30-T01-A2** — Confirmed issues have actionable tasks rather than unsupported completion claims.
  - Accepted evidence: repository_validation.

### Verification

- Triage a real or clearly labelled rehearsal issue end to end.
- Verify no automation is represented as active unless actually configured.

### Failure cases and cautions

- A written monitoring plan is not an operating monitoring service.

### Handoff requirement

Record tested implementation SHA, changed scope, acceptance evidence, commands/results, unrun checks, blockers and the next exact task. Use [the handoff template](../../templates/HANDOFF.md). Update state through the project CLI, regenerate views, and push the metadata checkpoint.

## P30-T02 — Review OS, SDK and dependency compatibility updates

Dependencies: P30-T01

Manual gate: none; planning estimate: 1–3 focused sessions; planning estimate, not a delivery promise. Estimates are not deadlines or completion claims.

### Read first

- [docs/operations/IOS_CI.md](../../docs/operations/IOS_CI.md)
- [docs/architecture/DUO_PLATFORM.md](../../docs/architecture/DUO_PLATFORM.md)
- [docs/graphics/RENDERING_SPEC.md](../../docs/graphics/RENDERING_SPEC.md)
- [docs/quality/RELEASE_GATES.md](../../docs/quality/RELEASE_GATES.md)

### Owned scope

- `package-lock.json`
- `tools/ios/`
- `docs/decisions/`
- `evidence/`

### Deliverables

- First compatibility review
- Evidence-gated upgrade procedure

### Implementation sequence

1. Recheck official platform and dependency release notes.
2. Run existing fixtures before changing version pins.
3. Evaluate native origin, hinge, renderer and asset decoder regressions.
4. Upgrade in a bounded main-branch checkpoint with rollback-safe data behavior.
5. Record actual compatibility results and unresolved blockers.

### Acceptance criteria

- **P30-T02-A1** — The first compatibility review records tested versions and observed results.
  - Accepted evidence: source_verification, integration_test.
- **P30-T02-A2** — No dependency/SDK update bypasses save, device or visual regression gates.
  - Accepted evidence: repository_validation.

### Verification

- Run packaged asset-origin and posture smoke tests on the proposed toolchain.
- Compare key reference captures before accepting renderer upgrades.

### Failure cases and cautions

- A minor renderer upgrade can alter color, shaders or asset extension behavior.

### Handoff requirement

Record tested implementation SHA, changed scope, acceptance evidence, commands/results, unrun checks, blockers and the next exact task. Use [the handoff template](../../templates/HANDOFF.md). Update state through the project CLI, regenerate views, and push the metadata checkpoint.

## P30-T03 — Ship a data-safe maintenance update when authorized

Dependencies: P30-T02

Manual gate: owner; planning estimate: 1–3 focused sessions; planning estimate, not a delivery promise. Estimates are not deadlines or completion claims.

### Read first

- [docs/architecture/PERSISTENCE_AND_EDITOR.md](../../docs/architecture/PERSISTENCE_AND_EDITOR.md)
- [docs/operations/RELEASE_RUNBOOK.md](../../docs/operations/RELEASE_RUNBOOK.md)
- [docs/quality/RELEASE_GATES.md](../../docs/quality/RELEASE_GATES.md)

### Owned scope

- `apps/ios/`
- `web/`
- `tests/fixtures/documents/`
- `evidence/`

### Deliverables

- Authorized maintenance candidate or documented no-update decision
- Preserved migration compatibility

### Implementation sequence

1. Choose a bounded defect set from observed issues.
2. Preserve historical document fixtures and migration paths.
3. Re-run affected engineering/device/art gates.
4. Obtain approval for any upload, submission or public update.
5. Record the actual update outcome or justified no-release decision.

### Acceptance criteria

- **P30-T03-A1** — Any shipped maintenance build preserves supported user documents and passes relevant regression gates; a no-update outcome is explicitly owner-approved.
  - Accepted evidence: integration_test, device_test, owner_approval.
- **P30-T03-A2** — The owner approves release actions or explicitly records that no update is needed.
  - Accepted evidence: owner_approval.

### Verification

- Load/export older real-world fixture layouts on the maintenance candidate.
- Repeat the release authorization and provenance checks.

### Failure cases and cautions

- A hotfix must not silently reset incompatible saves.

### Handoff requirement

Record tested implementation SHA, changed scope, acceptance evidence, commands/results, unrun checks, blockers and the next exact task. Use [the handoff template](../../templates/HANDOFF.md). Update state through the project CLI, regenerate views, and push the metadata checkpoint.

## P30-T04 — Create the next-version backlog without erasing history

Dependencies: P30-T03

Manual gate: none; planning estimate: 1–3 focused sessions; planning estimate, not a delivery promise. Estimates are not deadlines or completion claims.

### Read first

- [docs/agents/CONTINUATION_PROTOCOL.md](../../docs/agents/CONTINUATION_PROTOCOL.md)
- [docs/agents/HANDOFF_PROTOCOL.md](../../docs/agents/HANDOFF_PROTOCOL.md)
- [docs/product/PRODUCT_SPEC.md](../../docs/product/PRODUCT_SPEC.md)

### Owned scope

- `planning/roadmap.json`
- `planning/handoffs/`
- `docs/decisions/`

### Deliverables

- Versioned next-development scope
- Preserved release history and handoff

### Implementation sequence

1. Review actual demand and maintenance findings before expanding content.
2. Keep original no-puzzle/offline/Duo scope unless the owner changes it.
3. Assign new stable task IDs for new features or releases.
4. Preserve completed evidence and supersede decisions explicitly.
5. Leave a next-version handoff with ready work and owner gates.

### Acceptance criteria

- **P30-T04-A1** — Future work has explicit dependencies and acceptance criteria without renumbering or erasing completed tasks.
  - Accepted evidence: repository_validation.
- **P30-T04-A2** — Scope changes require recorded owner approval rather than speculative feature creep.
  - Accepted evidence: repository_validation, owner_approval.

### Verification

- Run task-graph validation after backlog extension.
- Verify a fresh agent can identify the next ready task from repository state.

### Failure cases and cautions

- Maintenance is ongoing; completing this setup cycle does not mean all future work is finished.

### Handoff requirement

Record tested implementation SHA, changed scope, acceptance evidence, commands/results, unrun checks, blockers and the next exact task. Use [the handoff template](../../templates/HANDOFF.md). Update state through the project CLI, regenerate views, and push the metadata checkpoint.
