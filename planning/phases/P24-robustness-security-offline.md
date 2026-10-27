# P24 — Robustness, security and offline release behavior

> Generated from planning/roadmap.json. Edit the JSON definition, then run `npm run project:render`.

## Outcome

Exercise failure paths and remove hidden external dependencies before testers rely on their saved work.

## Exit gate

The app withstands malformed inputs, process failures, network loss and storage pressure without data loss or unsafe access.

The phase is not accepted merely because these instructions or its source files exist. Each task requires the stated evidence. Current progress lives in [the ledger](../state.json).

## P24-T01 — Audit imported data and resource security boundaries

Dependencies: P21-T04, P03-T05

Manual gate: none; planning estimate: 1–3 focused sessions; planning estimate, not a delivery promise. Estimates are not deadlines or completion claims.

### Read first

- [docs/architecture/BRIDGE_PROTOCOL.md](../../docs/architecture/BRIDGE_PROTOCOL.md)
- [docs/architecture/PERSISTENCE_AND_EDITOR.md](../../docs/architecture/PERSISTENCE_AND_EDITOR.md)
- [docs/quality/RELEASE_GATES.md](../../docs/quality/RELEASE_GATES.md)

### Owned scope

- `apps/ios/TinJunction/Documents/`
- `apps/ios/TinJunction/Web/`
- `tests/fixtures/security/`

### Deliverables

- Adversarial import/resource suite
- Reviewed attack-surface inventory

### Implementation sequence

1. Inventory every external input and native bridge method.
2. Apply nesting, size, count and numeric limits.
3. Reject path traversal and unsupported resource references.
4. Keep errors recoverable and current documents intact.
5. Test intentionally hostile but bounded fixtures.

### Acceptance criteria

- **P24-T01-A1** — Malformed imports and resource requests fail safely without file escape, crashes or unbounded processing.
  - Accepted evidence: unit_test, integration_test.
- **P24-T01-A2** — The native bridge exposes only documented capabilities and validates sender/session context.
  - Accepted evidence: repository_validation, integration_test.

### Verification

- Run shared hostile-input fixtures in native and web decoders.
- Review rejected-request logs for accidental data disclosure.

### Failure cases and cautions

- An offline app still processes untrusted imported files.

### Handoff requirement

Record tested implementation SHA, changed scope, acceptance evidence, commands/results, unrun checks, blockers and the next exact task. Use [the handoff template](../../templates/HANDOFF.md). Update state through the project CLI, regenerate views, and push the metadata checkpoint.

## P24-T02 — Test crashes, content loss and storage pressure

Dependencies: P24-T01, P22-T03

Manual gate: none; planning estimate: 1–3 focused sessions; planning estimate, not a delivery promise. Estimates are not deadlines or completion claims.

### Read first

- [docs/architecture/PERSISTENCE_AND_EDITOR.md](../../docs/architecture/PERSISTENCE_AND_EDITOR.md)
- [docs/quality/TEST_STRATEGY.md](../../docs/quality/TEST_STRATEGY.md)
- [docs/agents/RECOVERY_PLAYBOOK.md](../../docs/agents/RECOVERY_PLAYBOOK.md)

### Owned scope

- `apps/ios/TinJunction/`
- `tests/fixtures/failures/`
- `evidence/`

### Deliverables

- Failure-injection matrix
- Data-preservation regression results

### Implementation sequence

1. Inject WebContent termination during operating and editing.
2. Interrupt saves at defined durable boundaries.
3. Simulate full disk and inaccessible temporary storage.
4. Recover startup after corrupt settings and document indexes.
5. Verify retries remain bounded and transparent.

### Acceptance criteria

- **P24-T02-A1** — Every injected failure preserves or explicitly recovers the last acknowledged layout revision.
  - Accepted evidence: integration_test.
- **P24-T02-A2** — Repeated failure does not create infinite restart/save loops or destroy backup evidence.
  - Accepted evidence: unit_test, integration_test.

### Verification

- Run the documented fault matrix from clean and populated installs.
- Verify recovered documents can still operate and export.

### Failure cases and cautions

- Happy-path persistence tests do not establish crash safety.

### Handoff requirement

Record tested implementation SHA, changed scope, acceptance evidence, commands/results, unrun checks, blockers and the next exact task. Use [the handoff template](../../templates/HANDOFF.md). Update state through the project CLI, regenerate views, and push the metadata checkpoint.

## P24-T03 — Verify offline packaging and dependency/provenance hygiene

Dependencies: P24-T02, P10-T04, P02-T04

Manual gate: none; planning estimate: 1–3 focused sessions; planning estimate, not a delivery promise. Estimates are not deadlines or completion claims.

### Read first

- [docs/operations/RELEASE_RUNBOOK.md](../../docs/operations/RELEASE_RUNBOOK.md)
- [docs/graphics/ASSET_PIPELINE.md](../../docs/graphics/ASSET_PIPELINE.md)
- [docs/quality/RELEASE_GATES.md](../../docs/quality/RELEASE_GATES.md)

### Owned scope

- `package-lock.json`
- `apps/ios/TinJunction/Resources/`
- `THIRD_PARTY_NOTICES.md`
- `evidence/`

### Deliverables

- Offline release audit
- Dependency/license and bundle inventory

### Implementation sequence

1. Launch and exercise the complete app with networking blocked.
2. Inspect web bundle and native configuration for remote code/data dependencies.
3. Inventory licenses for packages, decoders, fonts, textures and audio.
4. Review known dependency advisories and record accepted risk decisions.
5. Verify the release bundle contains no secrets or development URLs.

### Acceptance criteria

- **P24-T03-A1** — All advertised core workflows succeed offline without remote script, CDN or account dependencies.
  - Accepted evidence: integration_test.
- **P24-T03-A2** — Shipped third-party components and assets have complete license/provenance records and no exposed secrets.
  - Accepted evidence: repository_validation.

### Verification

- Run network-disabled clean-launch and full editor journey.
- Scan built resources, not only source files.

### Failure cases and cautions

- A cached asset can hide a first-launch network dependency.

### Handoff requirement

Record tested implementation SHA, changed scope, acceptance evidence, commands/results, unrun checks, blockers and the next exact task. Use [the handoff template](../../templates/HANDOFF.md). Update state through the project CLI, regenerate views, and push the metadata checkpoint.

## P24-T04 — Close reliability blockers and freeze regression fixtures

Dependencies: P24-T03, P23-T04, P22-T04

Manual gate: none; planning estimate: 1–3 focused sessions; planning estimate, not a delivery promise. Estimates are not deadlines or completion claims.

### Read first

- [docs/quality/TEST_STRATEGY.md](../../docs/quality/TEST_STRATEGY.md)
- [docs/quality/RELEASE_GATES.md](../../docs/quality/RELEASE_GATES.md)
- [docs/agents/RECOVERY_PLAYBOOK.md](../../docs/agents/RECOVERY_PLAYBOOK.md)

### Owned scope

- `tests/fixtures/`
- `evidence/`
- `planning/`

### Deliverables

- Reliability acceptance summary
- Permanent regression fixtures for fixed failures

### Implementation sequence

1. Triage every reproducible crash and data-loss defect.
2. Add a minimal fixture for each fixed issue.
3. Retest all severity-critical flows on physical hardware.
4. Record deferred low-severity issues with owner and workaround.
5. Verify no required check was weakened to obtain a pass.

### Acceptance criteria

- **P24-T04-A1** — No unresolved crash, data-loss, security or essential-action blocker remains in the release scope.
  - Accepted evidence: integration_test, device_test.
- **P24-T04-A2** — Fixed critical defects have durable regression coverage and reproducible evidence.
  - Accepted evidence: repository_validation, unit_test.

### Verification

- Run the complete regression matrix on the release-intended configuration.
- Inspect test changes for removed assertions or hidden skips.

### Failure cases and cautions

- A green job can be misleading if its assertions were weakened.

### Handoff requirement

Record tested implementation SHA, changed scope, acceptance evidence, commands/results, unrun checks, blockers and the next exact task. Use [the handoff template](../../templates/HANDOFF.md). Update state through the project CLI, regenerate views, and push the metadata checkpoint.
