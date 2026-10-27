# P26 — Controlled TestFlight beta

> Generated from planning/roadmap.json. Edit the JSON definition, then run `npm run project:render`.

## Outcome

Build a reproducible signed beta and learn from authorized physical-device testing.

## Exit gate

The beta is distributed only with owner authorization, tester findings are tracked and release-critical defects are closed.

The phase is not accepted merely because these instructions or its source files exist. Each task requires the stated evidence. Current progress lives in [the ledger](../state.json).

## P26-T01 — Prepare signing and controlled beta credentials

Dependencies: P02-T04, P24-T03

Manual gate: owner; planning estimate: 1–3 focused sessions; planning estimate, not a delivery promise. Estimates are not deadlines or completion claims.

### Read first

- [docs/operations/RELEASE_RUNBOOK.md](../../docs/operations/RELEASE_RUNBOOK.md)
- [docs/operations/IOS_CI.md](../../docs/operations/IOS_CI.md)
- [docs/quality/RELEASE_GATES.md](../../docs/quality/RELEASE_GATES.md)

### Owned scope

- `.github/workflows/`
- `tools/ios/`
- `docs/operations/`

### Deliverables

- Owner-configured signing workflow
- Secret/permission handling checklist

### Implementation sequence

1. Confirm the owner's developer account and app identifier.
2. Document required certificate/profile/API permissions without embedding values.
3. Use protected GitHub environments for signing credentials.
4. Ensure logs and artifacts cannot expose secret material.
5. Require explicit authorization before any upload or tester invitation.

### Acceptance criteria

- **P26-T01-A1** — The owner authorizes the signing/distribution setup and supplies credentials through approved secret storage.
  - Accepted evidence: owner_approval.
- **P26-T01-A2** — Workflow inspection demonstrates least-privilege secret handling and no secret values in Git or logs.
  - Accepted evidence: repository_validation.

### Verification

- Run a non-upload preflight with missing credentials to verify clear failure.
- Review environment protection and artifact redaction.

### Failure cases and cautions

- Account access does not automatically authorize public release.

### Handoff requirement

Record tested implementation SHA, changed scope, acceptance evidence, commands/results, unrun checks, blockers and the next exact task. Use [the handoff template](../../templates/HANDOFF.md). Update state through the project CLI, regenerate views, and push the metadata checkpoint.

## P26-T02 — Produce a reproducible signed TestFlight build

Dependencies: P26-T01, P25-T04

Manual gate: none; planning estimate: 1–3 focused sessions; planning estimate, not a delivery promise. Estimates are not deadlines or completion claims.

### Read first

- [docs/operations/RELEASE_RUNBOOK.md](../../docs/operations/RELEASE_RUNBOOK.md)
- [docs/operations/IOS_CI.md](../../docs/operations/IOS_CI.md)
- [docs/quality/RELEASE_GATES.md](../../docs/quality/RELEASE_GATES.md)

### Owned scope

- `tools/ios/`
- `evidence/`

### Deliverables

- Signed archive and upload evidence
- Build provenance manifest

### Implementation sequence

1. Select the reviewed source commit and locked dependencies.
2. Generate and archive from a clean checkout.
3. Validate bundle identifiers, version, assets and signing.
4. Upload only through the authorized beta workflow.
5. Record App Store Connect processing outcome and artifact hashes.

### Acceptance criteria

- **P26-T02-A1** — The authorized build is accepted for TestFlight processing with traceable source and resource provenance.
  - Accepted evidence: integration_test.
- **P26-T02-A2** — Signing/upload evidence contains no private credential material.
  - Accepted evidence: repository_validation.

### Verification

- Compare archive resources with the approved release manifest.
- Install the processed beta on the actual supported device.

### Failure cases and cautions

- A successful upload is not the same as successful processing or installation.

### Handoff requirement

Record tested implementation SHA, changed scope, acceptance evidence, commands/results, unrun checks, blockers and the next exact task. Use [the handoff template](../../templates/HANDOFF.md). Update state through the project CLI, regenerate views, and push the metadata checkpoint.

## P26-T03 — Execute structured beta testing and triage

Dependencies: P26-T02

Manual gate: device; planning estimate: 1–3 focused sessions; planning estimate, not a delivery promise. Estimates are not deadlines or completion claims.

### Read first

- [docs/quality/TEST_STRATEGY.md](../../docs/quality/TEST_STRATEGY.md)
- [docs/product/INTERACTION_DESIGN.md](../../docs/product/INTERACTION_DESIGN.md)
- [docs/quality/RELEASE_GATES.md](../../docs/quality/RELEASE_GATES.md)

### Owned scope

- `evidence/`
- `planning/`

### Deliverables

- Authorized tester matrix
- Prioritized beta issue log

### Implementation sequence

1. Invite only owner-approved testers through the approved mechanism.
2. Assign operating, editing, fold, backup and accessibility tasks.
3. Collect reproducible defects with device/OS/build details.
4. Separate product opinions from demonstrable faults.
5. Track severity, owner, fix commit and retest evidence.

### Acceptance criteria

- **P26-T03-A1** — The beta matrix covers all critical workflows on physical Duo with documented outcomes.
  - Accepted evidence: device_test.
- **P26-T03-A2** — Every reported critical issue has a reproducible record and accountable resolution state.
  - Accepted evidence: repository_validation.

### Verification

- Run the exact tester scenarios rather than unstructured launch-only checks.
- Verify consent/privacy expectations for diagnostic attachments.

### Failure cases and cautions

- Tester count alone does not prove useful test coverage.

### Handoff requirement

Record tested implementation SHA, changed scope, acceptance evidence, commands/results, unrun checks, blockers and the next exact task. Use [the handoff template](../../templates/HANDOFF.md). Update state through the project CLI, regenerate views, and push the metadata checkpoint.

## P26-T04 — Close beta blockers and revalidate changes

Dependencies: P26-T03

Manual gate: owner; planning estimate: 1–3 focused sessions; planning estimate, not a delivery promise. Estimates are not deadlines or completion claims.

### Read first

- [docs/quality/RELEASE_GATES.md](../../docs/quality/RELEASE_GATES.md)
- [docs/quality/TEST_STRATEGY.md](../../docs/quality/TEST_STRATEGY.md)
- [docs/agents/RECOVERY_PLAYBOOK.md](../../docs/agents/RECOVERY_PLAYBOOK.md)

### Owned scope

- `web/src/`
- `apps/ios/TinJunction/`
- `tests/`
- `evidence/`

### Deliverables

- Beta exit report
- Regression coverage for beta defects

### Implementation sequence

1. Fix crash, data-loss, operation and posture blockers first.
2. Add regression fixtures for reproducible failures.
3. Re-run physical-device tests affected by fixes.
4. Update reviewed build identifiers after changes.
5. Obtain explicit beta-exit acceptance from the owner.

### Acceptance criteria

- **P26-T04-A1** — No beta release-blocking defect remains unresolved, and fixes have retest evidence.
  - Accepted evidence: device_test, integration_test.
- **P26-T04-A2** — The owner approves the beta exit report and residual known limitations.
  - Accepted evidence: owner_approval.

### Verification

- Repeat the critical beta workflow matrix on the final beta build.
- Verify fixes did not silently broaden supported devices or scope.

### Failure cases and cautions

- A fix in source is not closed until the beta build is retested.

### Handoff requirement

Record tested implementation SHA, changed scope, acceptance evidence, commands/results, unrun checks, blockers and the next exact task. Use [the handoff template](../../templates/HANDOFF.md). Update state through the project CLI, regenerate views, and push the metadata checkpoint.
