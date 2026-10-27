# Handoff protocol

**Established:** 2026-10-26, America/Halifax.  
**Purpose:** make interruption, model replacement and a fresh clone survivable without chat history.

A handoff is an engineering record, not a victory summary. Use [the template](../../templates/HANDOFF.md), [continuation protocol](CONTINUATION_PROTOCOL.md) and [evidence rules](TASK_EVIDENCE.md).

## 1. Three layers

### Current pointer: `planning/HANDOFF.md`

Keep this short: latest full handoff path, active/most recent task, integrated implementation revision, pending verification, critical blockers, exact next command and any warning that changes normal startup.

This pointer is navigation, not a second task database. It must agree with `planning/state.json`. Do not manually maintain a competing progress percentage or next-task list.

### Full record: `planning/handoffs/<run-id>.md`

Use a sortable collision-resistant filename, for example `20261026T213000-0300-renderer-PXX-TYY.md`. Record the timezone/offset; UTC marked `Z` is also acceptable. Do not infer the user's date from a UTC execution host or reuse this example timestamp as fact.

Write a new record for each session or significant responsibility change. Draft it while working. After other handoffs reference it, preserve history and correct mistakes visibly rather than replacing the account silently.

### Verification: `evidence/`

The handoff explains what happened; evidence supports only claims actually observed. Link manifests instead of pasting huge logs.

Large screenshots, videos, `.xcresult` bundles and profiler traces belong in controlled artifact storage. Record checksums and retention. An expiring artifact URL alone is not a permanent verification strategy.

## 2. Mandatory contents

| Section | Required | Insufficient |
| --- | --- | --- |
| Identity | Run/agent, times, task IDs, starting revision | “Worked on graphics” |
| Repository position | Branch, actual implementation commits, remote state | “Everything pushed” without a verifiable revision |
| Objective | Task and acceptance IDs addressed | Repeating the entire product pitch |
| Changes | Paths, important symbols/structures, behavior | Raw diff without explanation |
| Verification | Commands, environment, observed results, evidence links | “Tests pass” without scope |
| Negative evidence | Failures, warnings, checks not run and reasons | Omitting inconvenient outcomes |
| CI | Real run URL, tested SHA, status, artifacts | Guessed run number or another commit's badge |
| Decisions | ADRs and consequences | Architecture changes only in chat |
| Remaining work | Unfinished behavior and acceptance | “Finish polish” |
| Blockers | Cause, owner, observable unblock action | “Blocked on Apple” |
| Next agent | Next task, reading, first three actions | “Continue where I stopped” |
| Local state | Clean/dirty, untracked files, preserved edits, claim state | Automatically cleaning the checkout |

## 3. Write during the session

Update the draft when a task is claimed, checkpoint pushed, test invalidates an assumption, decision made, blocker changes, ownership moves or session ends.

Explicitly mark unfinished entries `NOT RUN`, `PENDING`, `BLOCKED` or `IN PROGRESS`. A useful interrupted draft is better than an end-of-session reconstruction from memory.

## 4. Commit/evidence ordering

1. Implement a coherent change and run available checks.
2. Commit/push implementation.
3. Inspect checks for that exact SHA.
4. Record observations and source/artifact hashes.
5. Update state and handoff.
6. Regenerate projections and validate.
7. Commit/push metadata.
8. Inspect metadata-triggered CI and report its real status.

The handoff may reference the implementation SHA before its own metadata commit exists. Never invent its own future SHA. Git history identifies the commit introducing the record.

If final metadata CI is still running, say so and make checking it the next action. Do not write “passed” in advance.

A source digest distinguishes later metadata-only changes from changed implementation. Behavior, dependencies, build scripts, fixtures or configuration changing may invalidate evidence even when the task ID is unchanged.

## 5. Describe unfinished work precisely

Use paths and behavior, not fragile line numbers.

Good:

> The graph validator rejects disconnected connector pairs. The zero-length cycle fixture still fails; output is linked below. Next: inspect edge normalization, add the zero-length guard, rerun graph tests, then deterministic replay. Do not extend the editor until this invariant holds.

Poor:

> Track graph is basically done; just needs testing.

For graphics include scene/asset versions, camera pose, lighting/exposure, quality preset and visible defects. “Looks good” is not reproducible.

For native/WebView work include runtime/OS, native build, web-bundle hash, origin, bridge version and lifecycle transition tested.

For hardware include model/OS, build configuration, workload, warmup, duration, thermal observations and sustained behavior. A simulator record must say `SIMULATOR` plainly.

## 6. Outcome-specific requirements

### Completed

Link acceptance evidence and approvals, identify actual implementation SHA and exact next task from the graph.

### Submitted

State remaining review, authorized reviewer, existing evidence and what would constitute acceptance. Do not portray review as a formality.

### Interrupted

Checkpoint work, release/document claim, list unfinished requirements and first reproduction command. Put known failures near the top.

### Blocked

Record via CLI. Explain why repeating the failed action will not help. Identify independent work, if any.

### Access failure

Preserve work, report exactly what could not be pushed or verified, and name the needed permission/owner action. Never bypass the restriction or equate local with remote.

### Investigation only

Record findings, diagnostics, ruled-out hypotheses and why no implementation changed. Do not create meaningless edits just to claim activity.

## 7. Shared-workspace integration

Coordinator owns shared ledger, pointer and pushes. Workers send assigned task/scope, files changed, commands/results, failures, integration dependencies and proposed acceptance. Workers do not independently alter status, release other claims or push.

Coordinator reads and verifies worker output. Delegation itself is not evidence that a test ran, and one agent cannot grant the owner's approval gate.

## 8. Review checklist

- A new agent can reproduce results with repository and referenced artifacts.
- Commits and run URLs exist and match the stated SHA.
- State agrees with described outcome.
- Not-run checks and failures are visible.
- Artifact retention is sufficient or durable alternatives are recorded.
- Secrets, private device identifiers and tester data are excluded/redacted.
- Next actions are concrete and authorized.
- Current pointer is accurate.
- `node tools/project.mjs validate` passes.

## 9. Final chat is only a summary

Report changed outcome, repository/commit links, actual verification, unresolved gates and next selected task. Never require the next agent to retrieve a private message, old chat or vanished terminal session to continue.
