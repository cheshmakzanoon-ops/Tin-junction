# P29 — Authorized submission and launch

> Generated from planning/roadmap.json. Edit the JSON definition, then run `npm run project:render`.

## Outcome

Submit and release only the approved candidate, then monitor the actual outcome.

## Exit gate

Publication state, review decisions and early defects are recorded honestly with owner-controlled release actions.

The phase is not accepted merely because these instructions or its source files exist. Each task requires the stated evidence. Current progress lives in [the ledger](../state.json).

## P29-T01 — Submit the approved candidate for review

Dependencies: P28-T04

Manual gate: owner; planning estimate: 1–3 focused sessions; planning estimate, not a delivery promise. Estimates are not deadlines or completion claims.

### Read first

- [docs/operations/RELEASE_RUNBOOK.md](../../docs/operations/RELEASE_RUNBOOK.md)
- [docs/quality/RELEASE_GATES.md](../../docs/quality/RELEASE_GATES.md)

### Owned scope

- `evidence/`
- `planning/`

### Deliverables

- Submission receipt/status record
- Immutable submitted-build reference

### Implementation sequence

1. Verify authorization and exact build before submission.
2. Check reviewer notes, eligibility and metadata one final time.
3. Submit through the approved account workflow.
4. Record actual processing/review status without predicting approval.
5. Leave a handoff stating what external decision is pending.

### Acceptance criteria

- **P29-T01-A1** — The submitted build and storefront configuration exactly match owner authorization.
  - Accepted evidence: owner_approval, integration_test.
- **P29-T01-A2** — The repository records actual submission identifiers and status, not an assumed approval.
  - Accepted evidence: repository_validation.

### Verification

- Compare submitted build number/source manifest with the candidate.
- Verify no accidental automatic-release setting changed the authorization scope.

### Failure cases and cautions

- Submission success is not review acceptance.

### Handoff requirement

Record tested implementation SHA, changed scope, acceptance evidence, commands/results, unrun checks, blockers and the next exact task. Use [the handoff template](../../templates/HANDOFF.md). Update state through the project CLI, regenerate views, and push the metadata checkpoint.

## P29-T02 — Handle review feedback without bypassing safeguards

Dependencies: P29-T01

Manual gate: none; planning estimate: 1–3 focused sessions; planning estimate, not a delivery promise. Estimates are not deadlines or completion claims.

### Read first

- [docs/operations/RELEASE_RUNBOOK.md](../../docs/operations/RELEASE_RUNBOOK.md)
- [docs/agents/RECOVERY_PLAYBOOK.md](../../docs/agents/RECOVERY_PLAYBOOK.md)
- [docs/quality/RELEASE_GATES.md](../../docs/quality/RELEASE_GATES.md)

### Owned scope

- `planning/`
- `evidence/`
- `apps/ios/`
- `web/`

### Deliverables

- Review-response record
- Retested fixes when required

### Implementation sequence

1. Read the actual reviewer message and classify the issue.
2. Explain existing behavior with evidence where appropriate.
3. Implement only authorized scope-compatible fixes.
4. Re-run affected gates and obtain renewed approval if the candidate changes.
5. Record approval, rejection or pending status faithfully.

### Acceptance criteria

- **P29-T02-A1** — Every review response and candidate change is traceable to actual feedback and required retests.
  - Accepted evidence: repository_validation, integration_test.
- **P29-T02-A2** — No private API, deceptive capability or misleading metadata is added to evade review.
  - Accepted evidence: repository_validation.

### Verification

- Review the submitted response against actual runtime behavior.
- Repeat changed eligibility, privacy or workflow checks.

### Failure cases and cautions

- Review pressure must not override the user-data and distribution rules.

### Handoff requirement

Record tested implementation SHA, changed scope, acceptance evidence, commands/results, unrun checks, blockers and the next exact task. Use [the handoff template](../../templates/HANDOFF.md). Update state through the project CLI, regenerate views, and push the metadata checkpoint.

## P29-T03 — Release publicly after explicit owner approval

Dependencies: P29-T02

Manual gate: owner; planning estimate: 1–3 focused sessions; planning estimate, not a delivery promise. Estimates are not deadlines or completion claims.

### Read first

- [docs/operations/RELEASE_RUNBOOK.md](../../docs/operations/RELEASE_RUNBOOK.md)
- [docs/quality/RELEASE_GATES.md](../../docs/quality/RELEASE_GATES.md)

### Owned scope

- `evidence/`
- `planning/`

### Deliverables

- Owner-approved release record
- Actual public availability verification

### Implementation sequence

1. Confirm store review approval and candidate identity.
2. Obtain any still-required public-release authorization.
3. Apply only the approved release/territory timing.
4. Verify the actual public listing and supported purchase eligibility.
5. Record the release version and observed availability.

### Acceptance criteria

- **P29-T03-A1** — The owner explicitly authorizes the public release action taken.
  - Accepted evidence: owner_approval.
- **P29-T03-A2** — Actual public availability and metadata are verified after release rather than inferred from a button click.
  - Accepted evidence: integration_test.

### Verification

- Inspect the published listing in intended territories.
- Confirm version, price and eligibility against approval.

### Failure cases and cautions

- Approval to submit is not necessarily approval to publish.

### Handoff requirement

Record tested implementation SHA, changed scope, acceptance evidence, commands/results, unrun checks, blockers and the next exact task. Use [the handoff template](../../templates/HANDOFF.md). Update state through the project CLI, regenerate views, and push the metadata checkpoint.

## P29-T04 — Complete early-launch monitoring and triage

Dependencies: P29-T03

Manual gate: none; planning estimate: 1–3 focused sessions; planning estimate, not a delivery promise. Estimates are not deadlines or completion claims.

### Read first

- [docs/operations/RELEASE_RUNBOOK.md](../../docs/operations/RELEASE_RUNBOOK.md)
- [docs/agents/RECOVERY_PLAYBOOK.md](../../docs/agents/RECOVERY_PLAYBOOK.md)
- [docs/quality/RELEASE_GATES.md](../../docs/quality/RELEASE_GATES.md)

### Owned scope

- `planning/`
- `evidence/`

### Deliverables

- Early-launch issue/status report
- Prioritized hotfix backlog

### Implementation sequence

1. Review authorized crash reports and support channels.
2. Separate observed sales/reviews from estimates.
3. Prioritize data loss, crashes and purchase-eligibility defects.
4. Use the incident runbook for owner-approved corrective action.
5. Record a concrete handoff into maintenance.

### Acceptance criteria

- **P29-T04-A1** — Observed launch issues are triaged with severity, reproduction details and responsible next actions.
  - Accepted evidence: repository_validation.
- **P29-T04-A2** — Revenue, adoption and reliability summaries clearly distinguish actual data from unavailable information.
  - Accepted evidence: repository_validation.

### Verification

- Verify every critical issue has a stop/release/hotfix decision owner.
- Check that support answers do not promise unplanned features.

### Failure cases and cautions

- Absence of reports is not proof that no users encountered defects.

### Handoff requirement

Record tested implementation SHA, changed scope, acceptance evidence, commands/results, unrun checks, blockers and the next exact task. Use [the handoff template](../../templates/HANDOFF.md). Update state through the project CLI, regenerate views, and push the metadata checkpoint.
