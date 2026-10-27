# P07 — Document persistence and recovery

> Generated from planning/roadmap.json. Edit the JSON definition, then run `npm run project:render`.

## Outcome

Protect user-created layouts with explicit schema, transactions and durable native storage.

## Exit gate

Layouts survive relaunch, corruption, interruption and migration without silent loss.

The phase is not accepted merely because these instructions or its source files exist. Each task requires the stated evidence. Current progress lives in [the ledger](../state.json).

## P07-T01 — Define the versioned layout document format

Dependencies: P04-T04, P05-T05

Manual gate: none; planning estimate: 1–3 focused sessions; planning estimate, not a delivery promise. Estimates are not deadlines or completion claims.

### Read first

- [docs/architecture/PERSISTENCE_AND_EDITOR.md](../../docs/architecture/PERSISTENCE_AND_EDITOR.md)
- [docs/architecture/BRIDGE_PROTOCOL.md](../../docs/architecture/BRIDGE_PROTOCOL.md)

### Owned scope

- `web/src/documents/`
- `apps/ios/TinJunction/Documents/`
- `tests/fixtures/documents/`

### Deliverables

- Canonical layout schema
- Valid/invalid document fixtures

### Implementation sequence

1. Separate layout design from transient render state.
2. Define schema version, IDs, metadata and asset references.
3. Validate document size, counts and numeric bounds.
4. Specify unknown-field and missing-asset behavior.
5. Create canonical serialization and compatibility fixtures.

### Acceptance criteria

- **P07-T01-A1** — Both native and web validators agree on document validity and supported versions.
  - Accepted evidence: unit_test.
- **P07-T01-A2** — Serialization excludes renderer/native handles and reproduces stable model identity.
  - Accepted evidence: unit_test.

### Verification

- Round-trip minimal, maximum-budget and malformed layouts.
- Reject future-version documents with a recoverable explanation.

### Failure cases and cautions

- Saving all runtime state can freeze accidental implementation details.

### Handoff requirement

Record tested implementation SHA, changed scope, acceptance evidence, commands/results, unrun checks, blockers and the next exact task. Use [the handoff template](../../templates/HANDOFF.md). Update state through the project CLI, regenerate views, and push the metadata checkpoint.

## P07-T02 — Implement atomic native save and last-known-good recovery

Dependencies: P07-T01, P03-T04

Manual gate: none; planning estimate: 1–3 focused sessions; planning estimate, not a delivery promise. Estimates are not deadlines or completion claims.

### Read first

- [docs/architecture/PERSISTENCE_AND_EDITOR.md](../../docs/architecture/PERSISTENCE_AND_EDITOR.md)
- [docs/architecture/SYSTEM_ARCHITECTURE.md](../../docs/architecture/SYSTEM_ARCHITECTURE.md)

### Owned scope

- `apps/ios/TinJunction/Documents/`
- `apps/ios/TinJunctionTests/`

### Deliverables

- Atomic document store
- Backup/recovery policy

### Implementation sequence

1. Write validated data to a temporary sibling file.
2. Flush and replace using documented native file operations.
3. Retain a bounded last-known-good version.
4. Acknowledge only successful durable revision changes.
5. Recover from corrupt primary data without overwriting evidence.

### Acceptance criteria

- **P07-T02-A1** — Interrupted writes never replace a valid document with partial data.
  - Accepted evidence: unit_test, integration_test.
- **P07-T02-A2** — Corrupt-primary recovery preserves the backup and informs the user what was restored.
  - Accepted evidence: integration_test.

### Verification

- Inject failures before write, replacement and acknowledgment.
- Simulate disk-full, missing directory and corrupted checksum cases.

### Failure cases and cautions

- Error handling must not delete the only remaining good save.

### Handoff requirement

Record tested implementation SHA, changed scope, acceptance evidence, commands/results, unrun checks, blockers and the next exact task. Use [the handoff template](../../templates/HANDOFF.md). Update state through the project CLI, regenerate views, and push the metadata checkpoint.

## P07-T03 — Implement schema migrations and asset-ID compatibility

Dependencies: P07-T02

Manual gate: none; planning estimate: 1–3 focused sessions; planning estimate, not a delivery promise. Estimates are not deadlines or completion claims.

### Read first

- [docs/architecture/PERSISTENCE_AND_EDITOR.md](../../docs/architecture/PERSISTENCE_AND_EDITOR.md)
- [docs/graphics/ASSET_PIPELINE.md](../../docs/graphics/ASSET_PIPELINE.md)

### Owned scope

- `web/src/documents/migrations/`
- `apps/ios/TinJunction/Documents/`
- `tests/fixtures/documents/`

### Deliverables

- Version-by-version migrations
- Deprecated asset mapping policy

### Implementation sequence

1. Create immutable historical fixture documents.
2. Migrate stepwise with validation between versions.
3. Preserve an original backup before migration.
4. Map renamed asset IDs explicitly rather than by display name.
5. Reject irreversible migrations unless an export path exists.

### Acceptance criteria

- **P07-T03-A1** — Every supported historical fixture migrates without lost track topology or scenery identity.
  - Accepted evidence: unit_test.
- **P07-T03-A2** — Migration failure leaves the original document and last-known-good copy recoverable.
  - Accepted evidence: unit_test, integration_test.

### Verification

- Run migration fixtures repeatedly to confirm idempotent loading.
- Test missing/deprecated asset definitions.

### Failure cases and cautions

- Changing asset filenames is not a valid migration strategy.

### Handoff requirement

Record tested implementation SHA, changed scope, acceptance evidence, commands/results, unrun checks, blockers and the next exact task. Use [the handoff template](../../templates/HANDOFF.md). Update state through the project CLI, regenerate views, and push the metadata checkpoint.

## P07-T04 — Implement undo, redo and autosave transaction boundaries

Dependencies: P07-T01, P04-T04, P07-T02

Manual gate: none; planning estimate: 1–3 focused sessions; planning estimate, not a delivery promise. Estimates are not deadlines or completion claims.

### Read first

- [docs/architecture/PERSISTENCE_AND_EDITOR.md](../../docs/architecture/PERSISTENCE_AND_EDITOR.md)
- [docs/product/INTERACTION_DESIGN.md](../../docs/product/INTERACTION_DESIGN.md)

### Owned scope

- `web/src/commands/`
- `web/src/documents/`

### Deliverables

- Bounded undo/redo history
- Revision-aware autosave scheduling

### Implementation sequence

1. Store reversible commands or bounded before/after patches.
2. Coalesce continuous drags into one user transaction.
3. Clear redo history after a new divergent edit.
4. Autosave only consistent committed model revisions.
5. Retain visible unsaved status until native acknowledgment.

### Acceptance criteria

- **P07-T04-A1** — Undo/redo restores exact topology and scenery state across mixed edit sequences.
  - Accepted evidence: unit_test.
- **P07-T04-A2** — Autosave cannot persist an intermediate invalid drag state or mark failed writes as saved.
  - Accepted evidence: unit_test, integration_test.

### Verification

- Replay alternating track/scenery edits with undo and redo.
- Suspend during dragging and during save acknowledgment.

### Failure cases and cautions

- A history stack without byte bounds can exhaust memory.

### Handoff requirement

Record tested implementation SHA, changed scope, acceptance evidence, commands/results, unrun checks, blockers and the next exact task. Use [the handoff template](../../templates/HANDOFF.md). Update state through the project CLI, regenerate views, and push the metadata checkpoint.

## P07-T05 — Exercise import, export and lifecycle recovery

Dependencies: P07-T03, P07-T04, P02-T02

Manual gate: none; planning estimate: 1–3 focused sessions; planning estimate, not a delivery promise. Estimates are not deadlines or completion claims.

### Read first

- [docs/architecture/PERSISTENCE_AND_EDITOR.md](../../docs/architecture/PERSISTENCE_AND_EDITOR.md)
- [docs/quality/TEST_STRATEGY.md](../../docs/quality/TEST_STRATEGY.md)
- [docs/quality/RELEASE_GATES.md](../../docs/quality/RELEASE_GATES.md)

### Owned scope

- `apps/ios/TinJunction/Documents/`
- `tests/fixtures/documents/`
- `evidence/`

### Deliverables

- Safe document import/export
- Recovery acceptance suite

### Implementation sequence

1. Validate imported document content before opening.
2. Apply size and decompression limits if archives are introduced.
3. Export a portable versioned file through native sharing.
4. Recover the latest acknowledged revision after process termination.
5. Expose backup/export status and actionable storage failures.

### Acceptance criteria

- **P07-T05-A1** — Malicious or corrupt imports cannot escape storage boundaries or destroy the current layout.
  - Accepted evidence: unit_test, integration_test.
- **P07-T05-A2** — Relaunch after forced termination recovers the last acknowledged revision and reports any unsaved loss honestly.
  - Accepted evidence: integration_test.

### Verification

- Round-trip a user-created layout through exported file import.
- Terminate native/WebContent processes at multiple save boundaries.

### Failure cases and cautions

- Export success requires a usable file, not merely a share-sheet presentation.

### Handoff requirement

Record tested implementation SHA, changed scope, acceptance evidence, commands/results, unrun checks, blockers and the next exact task. Use [the handoff template](../../templates/HANDOFF.md). Update state through the project CLI, regenerate views, and push the metadata checkpoint.
