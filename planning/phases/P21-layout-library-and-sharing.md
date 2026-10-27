# P21 — Layout library and native sharing

> Generated from planning/roadmap.json. Edit the JSON definition, then run `npm run project:render`.

## Outcome

Make user creations easy to find, duplicate, back up and share without accounts or backend services.

## Exit gate

Multiple documents and native sharing work safely with honest offline and privacy behavior.

The phase is not accepted merely because these instructions or its source files exist. Each task requires the stated evidence. Current progress lives in [the ledger](../state.json).

## P21-T01 — Build the native layout library and thumbnails

Dependencies: P07-T05, P18-T04

Manual gate: none; planning estimate: 1–3 focused sessions; planning estimate, not a delivery promise. Estimates are not deadlines or completion claims.

### Read first

- [docs/architecture/PERSISTENCE_AND_EDITOR.md](../../docs/architecture/PERSISTENCE_AND_EDITOR.md)
- [docs/product/INTERACTION_DESIGN.md](../../docs/product/INTERACTION_DESIGN.md)
- [docs/architecture/SYSTEM_ARCHITECTURE.md](../../docs/architecture/SYSTEM_ARCHITECTURE.md)

### Owned scope

- `apps/ios/TinJunction/Library/`
- `web/src/documents/`

### Deliverables

- Layout index and thumbnail lifecycle
- Accessible library UI

### Implementation sequence

1. Store metadata/index separately from document payloads.
2. Generate bounded thumbnails after consistent saved revisions.
3. Handle missing/corrupt thumbnails without losing layouts.
4. Show meaningful names, modification state and recovery indicators.
5. Support large text and non-thumbnail navigation.

### Acceptance criteria

- **P21-T01-A1** — The library lists valid documents even when thumbnails or metadata caches are missing.
  - Accepted evidence: unit_test, integration_test.
- **P21-T01-A2** — A thumbnail corresponds to an identified saved revision rather than unsaved transient state.
  - Accepted evidence: unit_test.

### Verification

- Delete/rebuild the thumbnail cache and reopen the library.
- Load many bounded fixture documents without decoding every scene.

### Failure cases and cautions

- Preview caches must never become the only copy of user data.

### Handoff requirement

Record tested implementation SHA, changed scope, acceptance evidence, commands/results, unrun checks, blockers and the next exact task. Use [the handoff template](../../templates/HANDOFF.md). Update state through the project CLI, regenerate views, and push the metadata checkpoint.

## P21-T02 — Implement new, duplicate, rename and delete flows

Dependencies: P21-T01

Manual gate: none; planning estimate: 1–3 focused sessions; planning estimate, not a delivery promise. Estimates are not deadlines or completion claims.

### Read first

- [docs/architecture/PERSISTENCE_AND_EDITOR.md](../../docs/architecture/PERSISTENCE_AND_EDITOR.md)
- [docs/product/INTERACTION_DESIGN.md](../../docs/product/INTERACTION_DESIGN.md)

### Owned scope

- `apps/ios/TinJunction/Library/`
- `apps/ios/TinJunction/Documents/`

### Deliverables

- Safe document-management actions
- Recoverable deletion policy

### Implementation sequence

1. Assign new document IDs when duplicating layouts.
2. Validate names without using them as raw filesystem paths.
3. Confirm destructive deletion and preserve the agreed recovery window.
4. Switch active documents only after handling unsaved revisions.
5. Keep built-in templates immutable and clone on first edit.

### Acceptance criteria

- **P21-T02-A1** — Document operations cannot overwrite another layout or leak unsafe paths.
  - Accepted evidence: unit_test, integration_test.
- **P21-T02-A2** — Deleting or switching an active layout follows the documented recovery/unsaved-work policy.
  - Accepted evidence: integration_test.

### Verification

- Test duplicate names, special characters and active-document deletion.
- Verify editing a template never changes the bundled original.

### Failure cases and cautions

- A duplicated layout must not share mutable save identity.

### Handoff requirement

Record tested implementation SHA, changed scope, acceptance evidence, commands/results, unrun checks, blockers and the next exact task. Use [the handoff template](../../templates/HANDOFF.md). Update state through the project CLI, regenerate views, and push the metadata checkpoint.

## P21-T03 — Implement native screenshot and file sharing

Dependencies: P21-T02, P16-T03

Manual gate: none; planning estimate: 1–3 focused sessions; planning estimate, not a delivery promise. Estimates are not deadlines or completion claims.

### Read first

- [docs/product/INTERACTION_DESIGN.md](../../docs/product/INTERACTION_DESIGN.md)
- [docs/architecture/PERSISTENCE_AND_EDITOR.md](../../docs/architecture/PERSISTENCE_AND_EDITOR.md)
- [docs/quality/RELEASE_GATES.md](../../docs/quality/RELEASE_GATES.md)

### Owned scope

- `apps/ios/TinJunction/Sharing/`
- `web/src/capture/`

### Deliverables

- Reproducible image capture
- Native document/image share flows

### Implementation sequence

1. Capture a finished render at bounded resolution.
2. Exclude debug overlays and private filesystem metadata.
3. Use native sharing for image and versioned layout files.
4. Report cancellation and export failure accurately.
5. Keep video recording as a separate future decision unless explicitly scoped.

### Acceptance criteria

- **P21-T03-A1** — Shared images represent the actual running app and contain no debug/secret data.
  - Accepted evidence: integration_test, visual_review.
- **P21-T03-A2** — Exported layout files reimport successfully without losing stable asset or track references.
  - Accepted evidence: integration_test.

### Verification

- Share/cancel repeatedly and inspect temporary-file cleanup.
- Reimport exported files after app relaunch.

### Failure cases and cautions

- Presenting a share sheet does not prove successful external delivery.

### Handoff requirement

Record tested implementation SHA, changed scope, acceptance evidence, commands/results, unrun checks, blockers and the next exact task. Use [the handoff template](../../templates/HANDOFF.md). Update state through the project CLI, regenerate views, and push the metadata checkpoint.

## P21-T04 — Verify library recovery and portability

Dependencies: P21-T03, P07-T03

Manual gate: none; planning estimate: 1–3 focused sessions; planning estimate, not a delivery promise. Estimates are not deadlines or completion claims.

### Read first

- [docs/architecture/PERSISTENCE_AND_EDITOR.md](../../docs/architecture/PERSISTENCE_AND_EDITOR.md)
- [docs/quality/TEST_STRATEGY.md](../../docs/quality/TEST_STRATEGY.md)
- [docs/quality/RELEASE_GATES.md](../../docs/quality/RELEASE_GATES.md)

### Owned scope

- `tests/fixtures/documents/`
- `evidence/`

### Deliverables

- Multi-document recovery suite
- Backup/import user instructions

### Implementation sequence

1. Test storage pressure with several user layouts.
2. Restore exported older-version documents through migrations.
3. Reject duplicate/corrupt imports without destroying current work.
4. Recover from process termination during library actions.
5. Document what local-only storage does and does not back up.

### Acceptance criteria

- **P21-T04-A1** — Multi-document failure scenarios preserve independent layouts and recoverable originals.
  - Accepted evidence: integration_test.
- **P21-T04-A2** — User-facing backup instructions match the actual export/import behavior and avoid unimplemented cloud claims.
  - Accepted evidence: repository_validation.

### Verification

- Run import, duplicate, delete and relaunch fault sequences.
- Verify all recovered documents can operate trains.

### Failure cases and cautions

- Offline-first does not automatically mean data is backed up.

### Handoff requirement

Record tested implementation SHA, changed scope, acceptance evidence, commands/results, unrun checks, blockers and the next exact task. Use [the handoff template](../../templates/HANDOFF.md). Update state through the project CLI, regenerate views, and push the metadata checkpoint.
