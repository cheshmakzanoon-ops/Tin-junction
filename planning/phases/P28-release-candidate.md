# P28 — Release candidate and final authorization

> Generated from planning/roadmap.json. Edit the JSON definition, then run `npm run project:render`.

## Outcome

Produce one immutable candidate with complete engineering, device, art and owner evidence.

## Exit gate

A frozen candidate passes all mandatory gates and receives explicit owner permission to submit.

The phase is not accepted merely because these instructions or its source files exist. Each task requires the stated evidence. Current progress lives in [the ledger](../state.json).

## P28-T01 — Freeze scope and audit dependency/evidence completeness

Dependencies: P26-T04, P27-T04, P25-T04, P24-T04

Manual gate: none; planning estimate: 1–3 focused sessions; planning estimate, not a delivery promise. Estimates are not deadlines or completion claims.

### Read first

- [docs/quality/RELEASE_GATES.md](../../docs/quality/RELEASE_GATES.md)
- [docs/operations/RELEASE_RUNBOOK.md](../../docs/operations/RELEASE_RUNBOOK.md)
- [docs/agents/TASK_EVIDENCE.md](../../docs/agents/TASK_EVIDENCE.md)

### Owned scope

- `planning/`
- `evidence/`
- `package-lock.json`

### Deliverables

- Release-candidate gate matrix
- Frozen source/dependency manifest

### Implementation sequence

1. Select the candidate source commit and exact dependency set.
2. Check every required predecessor and manual gate.
3. Identify stale evidence when relevant source/assets changed.
4. Record all residual issues with severity and approved workaround.
5. Freeze scope; route new ideas to post-launch backlog.

### Acceptance criteria

- **P28-T01-A1** — Every release gate has valid build-relevant evidence or an explicitly approved nonblocking limitation.
  - Accepted evidence: repository_validation.
- **P28-T01-A2** — No unknown, failed or skipped required check is represented as passed.
  - Accepted evidence: repository_validation.

### Verification

- Run the project validator and audit acceptance evidence manually.
- Compare evidence source digests with candidate inputs.

### Failure cases and cautions

- A long checklist is not complete when its evidence applies to an older build.

### Handoff requirement

Record tested implementation SHA, changed scope, acceptance evidence, commands/results, unrun checks, blockers and the next exact task. Use [the handoff template](../../templates/HANDOFF.md). Update state through the project CLI, regenerate views, and push the metadata checkpoint.

## P28-T02 — Build and verify the candidate from a clean environment

Dependencies: P28-T01

Manual gate: device; planning estimate: 1–3 focused sessions; planning estimate, not a delivery promise. Estimates are not deadlines or completion claims.

### Read first

- [docs/operations/IOS_CI.md](../../docs/operations/IOS_CI.md)
- [docs/operations/RELEASE_RUNBOOK.md](../../docs/operations/RELEASE_RUNBOOK.md)
- [docs/quality/TEST_STRATEGY.md](../../docs/quality/TEST_STRATEGY.md)

### Owned scope

- `tools/ios/`
- `evidence/`

### Deliverables

- Clean signed archive provenance
- Candidate install/regression result

### Implementation sequence

1. Generate the project and bundle from a clean checkout.
2. Verify all hashes and version identifiers.
3. Build, sign and install the exact candidate.
4. Run automated and critical physical-device regression checks.
5. Archive logs/results without silently rebuilding a different candidate.

### Acceptance criteria

- **P28-T02-A1** — The candidate archive is reproducible from the recorded source and toolchain inputs.
  - Accepted evidence: integration_test.
- **P28-T02-A2** — The exact candidate passes critical physical-device workflows and supported posture tests.
  - Accepted evidence: device_test.

### Verification

- Run the final operating/edit/save/fold/backup sequence.
- Compare signed archive resource hashes with the approved manifest.

### Failure cases and cautions

- Rebuilding after testing can invalidate candidate provenance.

### Handoff requirement

Record tested implementation SHA, changed scope, acceptance evidence, commands/results, unrun checks, blockers and the next exact task. Use [the handoff template](../../templates/HANDOFF.md). Update state through the project CLI, regenerate views, and push the metadata checkpoint.

## P28-T03 — Rehearse backup, hotfix and release rollback limits

Dependencies: P28-T02

Manual gate: none; planning estimate: 1–3 focused sessions; planning estimate, not a delivery promise. Estimates are not deadlines or completion claims.

### Read first

- [docs/operations/RELEASE_RUNBOOK.md](../../docs/operations/RELEASE_RUNBOOK.md)
- [docs/architecture/PERSISTENCE_AND_EDITOR.md](../../docs/architecture/PERSISTENCE_AND_EDITOR.md)
- [docs/agents/RECOVERY_PLAYBOOK.md](../../docs/agents/RECOVERY_PLAYBOOK.md)

### Owned scope

- `docs/operations/RELEASE_RUNBOOK.md`
- `evidence/`

### Deliverables

- Release incident rehearsal
- Data-safe hotfix procedure

### Implementation sequence

1. Rehearse restoration from exported user-layout fixtures.
2. Confirm previous document versions remain loadable.
3. Document what store release controls can and cannot undo.
4. Prepare a main-branch hotfix path with preserved evidence.
5. Identify owner contacts and stop-release triggers.

### Acceptance criteria

- **P28-T03-A1** — The team can recover representative documents and prepare a data-safe hotfix without destructive Git operations.
  - Accepted evidence: integration_test, repository_validation.
- **P28-T03-A2** — The runbook accurately distinguishes stopping rollout from downgrading installed user applications.
  - Accepted evidence: source_verification.

### Verification

- Execute a mock critical-regression scenario without publishing anything.
- Verify the recovery process preserves current user documents.

### Failure cases and cautions

- App-store rollback does not automatically reverse installed data migrations.

### Handoff requirement

Record tested implementation SHA, changed scope, acceptance evidence, commands/results, unrun checks, blockers and the next exact task. Use [the handoff template](../../templates/HANDOFF.md). Update state through the project CLI, regenerate views, and push the metadata checkpoint.

## P28-T04 — Obtain final owner submission authorization

Dependencies: P28-T03

Manual gate: owner; planning estimate: 1–3 focused sessions; planning estimate, not a delivery promise. Estimates are not deadlines or completion claims.

### Read first

- [docs/quality/RELEASE_GATES.md](../../docs/quality/RELEASE_GATES.md)
- [docs/operations/RELEASE_RUNBOOK.md](../../docs/operations/RELEASE_RUNBOOK.md)

### Owned scope

- `evidence/`
- `planning/`

### Deliverables

- Explicit candidate authorization
- Final build/store configuration approval

### Implementation sequence

1. Present exact candidate build, source commit and gate summary.
2. Disclose residual risks and known limitations.
3. Confirm price, territories, eligibility and store assets.
4. Ask for authorization to submit, distinct from authorization to publish.
5. Record the owner's explicit decision and permitted actions.

### Acceptance criteria

- **P28-T04-A1** — The owner explicitly authorizes submission of the identified candidate and configuration.
  - Accepted evidence: owner_approval.
- **P28-T04-A2** — The authorization record states whether public release is also approved or remains a separate gate.
  - Accepted evidence: owner_approval.

### Verification

- Verify approval refers to the unchanged candidate.
- Stop if material code, asset or storefront configuration changes afterward.

### Failure cases and cautions

- Finishing development does not authorize store submission automatically.

### Handoff requirement

Record tested implementation SHA, changed scope, acceptance evidence, commands/results, unrun checks, blockers and the next exact task. Use [the handoff template](../../templates/HANDOFF.md). Update state through the project CLI, regenerate views, and push the metadata checkpoint.
