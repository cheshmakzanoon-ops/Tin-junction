# Recovery playbook

**Established:** 2026-10-26, America/Halifax.  
**Priority:** restore a truthful, recoverable project before adding another feature.

Read [the operating contract](../../AGENTS.md), [continuation protocol](CONTINUATION_PROTOCOL.md) and [evidence rules](TASK_EVIDENCE.md). The examples below use placeholder IDs, revisions and paths; substitute observed values. They are procedures, not records of failures that actually occurred.

## 1. Universal incident procedure

1. Stop the affected action. Do not repeatedly mutate state while guessing.
2. Preserve local files, logs, evidence and the current task record.
3. Identify the actual branch, remote head, claim and last known good checkpoint.
4. Classify the incident: code defect, state defect, concurrency, missing evidence, infrastructure, permission, hardware, data corruption or owner decision.
5. Record the observation and immediate risk in the handoff.
6. Repair only within a defined scope and existing authorization.
7. Rerun the original failing check plus relevant regressions.
8. Publish the repaired checkpoint, observe CI, update evidence/state and leave a recovery handoff.

Never “recover” by deleting tests, fabricating a pass, force-pushing, discarding user changes or rewriting history to hide the incident.

For a project-wide incident, register the observed problem before feature work resumes:

```sh
node tools/project.mjs incident-open INC-20261026-save --summary "Observed save integrity regression; see the recovery handoff" --owner engineering-coordinator
```

The ID and problem above are examples. Use a new unique `INC-` ID and the actual responsible owner. The incident blocks new feature claims and completion; it does not prevent recording valid partial evidence with `submit`, inspecting code or performing the bounded repair. It does not itself reopen completed tasks: use `block` where prior acceptance is invalid. After observing the repaired checks, record the specific resolution and supporting evidence:

```sh
node tools/project.mjs incident-resolve INC-20261026-save --resolution "Verified repaired revision and regression results; see evidence/actual-repair-record.json and the recovery handoff"
```

Do not run the example unchanged. Resolution text must identify actual evidence; the CLI preserves the original incident and resolution but does not inspect remote results or certify the claim. A still-failed CI snapshot independently continues to block completion. Repeated incidents receive new IDs rather than erasing history. These commands regenerate views; validate, review the diff and publish the truthful checkpoint through the usual coordinator workflow.

## 2. Required CI is red

### Diagnose

- Identify the failed run, tested SHA, job and first meaningful error.
- Read enough preceding log context to distinguish the cause from downstream failures.
- Determine whether the failure is deterministic code behavior, a changed environment or an external service problem.
- Compare to the last relevant passing run, including runner/Xcode/tool versions.
- Record actual failure health and run URL through the project CLI.

```sh
node tools/project.mjs ci --status failed --commit ACTUAL_FAILED_SHA --run ACTUAL_FAILED_RUN_URL
```

### Recover

Repair CI before claiming a new feature. If there is no eligible task for the incident, the coordinator records a bounded repair scope in the handoff rather than bypassing the health gate or crediting an unrelated task.

Add a regression test where possible. Rerun the failing check and the required suite. After the repaired implementation is pushed, inspect the actual run before recording `passed`.

Do not equate a single retried green job with proof that a flaky test is fixed. Preserve the failed attempt and explain why a retry was appropriate. Repeated intermittent failures require root-cause investigation or an explicitly tracked blocker, not silent quarantine.

### Not allowed

- Removing a failing test to restore a green badge.
- Adding `continue-on-error` to a required job.
- Broadly disabling workflow triggers.
- Changing fixture expectations without validating the product requirement.
- Claiming native tests passed because a documentation job did.

## 3. CI is absent, cancelled, inaccessible or awaiting approval

Determine which case applies. Inspect workflow triggers and branch/path conditions before concluding that a missing run is a code defect.

- **Queued/running:** record pending state; do not claim completion dependent on the run.
- **Cancelled:** inspect cancellation reason and whether a newer run covers the same implementation.
- **Awaiting approval:** report the precise approval needed; do not bypass it.
- **Inaccessible:** report that verification is unavailable. Do not guess from a badge or old run.
- **No matching run:** identify whether workflow is installed, enabled and triggered for the actual commit.
- **Runner/Xcode unavailable:** record actual advertised availability and adapt only within supported toolchain constraints; never invent a simulator identifier.

Safe local checks may continue, clearly labeled as local. They do not replace a required unavailable CI or hardware gate.

## 4. Generated status or phase files disagree with source

Read the validation failure. If the authoritative JSON is valid and generated files are merely stale:

```sh
node tools/project.mjs render
node tools/project.mjs validate
```

Inspect the diff before publishing. If someone manually edited a generated file, preserve the useful change by intentionally transferring it into its authoritative task definition before regenerating. Do not erase unknown user prose without inspection.

Never fix an incorrect task state by editing only `STATUS.md` or `NEXT_TASK.md`. Never use generation to conceal a contradiction in the actual ledger.

## 5. Ledger or task graph is invalid

Possible causes include duplicate IDs, unknown dependencies, cycles, orphan state, malformed JSON, a done task with incomplete prerequisites, missing references or contradictory claims.

1. Preserve the invalid file and inspect the exact validator error.
2. Compare relevant Git history and the latest handoff.
3. Determine whether the task definition or mutable state is wrong.
4. Apply the smallest justified correction; do not reinitialize the entire ledger.
5. Preserve existing evidence and historical records.
6. Regenerate and validate.
7. Explain the correction and its effect on next-task selection.

`init` is initial setup, not a recovery command. Do not overwrite a populated ledger with all tasks reset to todo. A graph change affecting work already done needs an explicit migration/rationale, not opportunistic renumbering.

If a missing task definition was accidentally deleted, recover its actual prior definition from Git history. Do not fabricate a replacement criterion merely to accept an existing result.

## 6. A claim expired

An expired lease does not prove abandoned work. The live `next` command checks current time; generated Markdown may show an older snapshot.

1. Stop editing under the expired claim.
2. Check pushed commits, current handoff, worker messages and active CI.
3. Inspect local modifications and ownership.
4. If the original worker remains active, coordinate a checkpoint and renewal.
5. If abandoned, record what was recovered and why reassignment is safe.
6. Release explicitly, then claim again if appropriate.

```sh
node tools/project.mjs release PXX-TYY --reason "Stale lease inspected; describe checkpoint and ownership resolution"
node tools/project.mjs claim PXX-TYY --owner recovery-session --hours 4
```

Do not automatically mark the task done or erase its changes. If ownership cannot be established safely, block the task and request direction.

## 7. Session crashed with local changes

Inspect `git status`, staged and unstaged diffs, untracked paths and the latest draft handoff. Separate task changes from user/other-agent changes.

Reproduce the current result before trusting it. A file existing does not prove the previous agent ran a command. Reconstruct verification only from actual logs/artifacts, or rerun it.

Resume known task work under a valid claim. Preserve unknown files. If a partial checkpoint cannot compile, record that plainly and make restoring buildability the first action. Do not describe it as a finished feature.

If evidence was drafted but never committed, verify every source SHA and artifact before submitting it. A record referring to a nonexistent future commit must be corrected using an actual tested implementation revision.

## 8. Push rejected or main moved

Do not force-push. Fetch and inspect:

```sh
git fetch origin main
git log --oneline --left-right HEAD...origin/main
git diff --stat HEAD origin/main
```

Determine which commits are yours and whether they have been published anywhere. Reconcile with the coordinating writer. A clean checkout with no local divergence can fast-forward normally.

If your local commits are genuinely unpublished, the coordinator may replay them on the updated main after inspecting overlap. Resolve conflicts deliberately, rerun all affected checks, and push normally. Never rebase or rewrite someone else's published history to solve this.

If the remote includes a task-state update, re-read the ledger and reselect work before continuing. Preserve both legitimate changes; do not pick one entire version of a shared state file blindly.

## 9. Evidence missing, expired or stale

### Missing local artifact

Do not replace its path with an unrelated file. Recover from the actual artifact store or rerun the check. If neither is possible, mark the requirement unverified and reopen/block affected work as necessary.

### Expired CI artifact

Check any documented durable copy and hashes. If the evidence cannot be inspected, rerun or obtain a new review. A run once being green does not reconstruct a visual capture or thermal trace that has vanished.

### Source digest mismatch

Compare changes since the tested implementation. Distinguish expected historical evidence from a claim that is currently being completed. Completion requires applicable source hashes; do not overwrite the digest without rerunning or otherwise justifying the relevant verification.

### Reopening completed work

```sh
node tools/project.mjs block PXX-TYY --reason "Describe the acceptance condition invalidated by new evidence" --owner engineering-coordinator
```

Preserve prior manifests and completion history. The block operation recursively blocks progressed descendants and records dependency-block events; todo descendants remain waiting on dependencies. Inspect the resulting affected set. A dependent cannot remain accepted on an invalidated prerequisite without explicit revalidation. Do not delete dependencies to hide the inconsistency.

After the issue is resolved:

```sh
node tools/project.mjs unblock PXX-TYY --resolution "Describe the observed resolution and next verification"
```

Reclaim, reverify and submit a current evidence package. Explicit `--evidence` arguments replace the active evidence set and archive old references in history; provide all applicable current manifests by repeating the option. Old failed/stale files remain historical, not new passing evidence. Resolve and revalidate affected descendants individually after prerequisites are restored. If the CLI rejects a valid recovery transition, repair the coordinator/validator with tests rather than editing status to bypass it.

## 10. False or overbroad completion discovered

Examples: mockup labeled implementation, simulator FPS labeled device result, generated planning files labeled finished gameplay, invented workflow run, or unapproved public release.

1. Correct the misleading claim immediately in repository records and the next handoff.
2. Reopen/block affected tasks and identify downstream assumptions.
3. Preserve the record with an explicit correction; do not silently erase the mistake.
4. Perform missing verification or retain the blocker.
5. Add a validator/test/procedure guard where the failure can be detected mechanically.

No task is entitled to stay done merely because much time was spent on it. Conversely, a warning must not be inflated into proof of a product failure without investigating the actual evidence.

## 11. Platform assumption cannot be verified

Do not invent SDK availability, hinge signatures, device-model strings, Info.plist capabilities, App Store compatibility rules or simulator commands.

Record the exact official source checked, SDK/runtime inspected and probe attempted. Separate documentation existence, compilation, runtime behavior and distribution enforcement: these are different claims.

If the platform-specific task remains blocked, continue only genuinely independent work such as deterministic simulation, asset production or a clearly marked internal harness. Do not silently change the shipping target to ordinary iPhones, iPad, Android or the browser.

A device-only gate remains blocked until a physical target device produces the required evidence. User-approved scope changes require an ADR and task-graph update.

## 12. Save/layout corruption or migration failure

Treat user data preservation as higher priority than another feature.

- Preserve the original damaged layout and last-known-good copy; avoid collecting personal layouts into a public repo.
- Reproduce with a minimal synthetic fixture where possible.
- Identify format version, migration path, failed transaction and write/replace sequence.
- Avoid silently loading a default empty world over the original file.
- Restore using a documented backup path and make the outcome visible to the user.
- Add corruption, interrupted-write and migration regression tests before closing the incident.

Never “fix” a migration by dropping fields or discarding a layout without an explicit, approved recovery design.

## 13. Graphics or performance regression

Reproduce using the recorded scene, camera, exposure, quality tier and asset versions. Compare like-for-like captures and measurements.

For visual regressions, locate the cause before changing golden images. For performance regressions, identify CPU, GPU, memory, upload, shader compilation or thermal contribution using appropriate instrumentation. An average FPS improvement cannot justify new severe frame spikes without review.

Restore the relevant budget/quality requirement or record a justified decision with its trade-off. Do not silently remove the visual feature, lower resolution or change the acceptance environment merely to report a pass.

Physical-device regression results need new device evidence. Desktop results may narrow the cause but cannot close the target-hardware requirement.

## 14. Permission, secret or protected workflow incident

Respect permission failures and protected workflows. Do not switch accounts, extract unrelated tokens, disable protection, bypass approvals or expose signing material in logs.

If a secret may have been committed, stop publishing it, alert the owner and follow the authorized rotation/removal process. Do not independently rewrite all Git history. Record the incident without reproducing the secret.

If a workflow needs signing credentials or App Store permissions, prepare the documented secure configuration and identify the owner action. Never commit a certificate, provisioning profile or private key as a convenience.

## 15. No eligible work remains

Run live status/next and verify the blockers. Do not invent a new monetization feature, platform port or speculative redesign to fill the session.

Provide:

- exact blocked task IDs;
- missing resource/decision for each;
- owner who can resolve it;
- evidence already available;
- next command after resolution;
- whether any bounded independent work is actually authorized and useful.

When all defined tasks are done, revalidate release and maintenance state. A completed roadmap is not proof that a newer OS update, expired certificate or new dependency issue has been checked.

## 16. Recovery exit criteria

An incident is closed only when:

- the original failure is reproduced or credibly explained;
- the repair or external resolution is observed;
- relevant regression checks pass;
- applicable CI/device/manual evidence exists;
- state, claims and derived views are consistent;
- history and user data are preserved;
- the recovery handoff identifies the next safe task.

If any of these remain unknown, retain the blocker. Do not let the desire for a clean status page replace the actual engineering condition.
