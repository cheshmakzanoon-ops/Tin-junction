# Handoff — TASK_ID — concise outcome

> TEMPLATE ONLY. Copy into `planning/handoffs/<actual-run-id>.md`. Replace every placeholder and instruction with facts. Use `NOT RUN`, `PENDING`, `BLOCKED` or `NONE` instead of implying success. Update `planning/HANDOFF.md` to point to the completed record.

## At a glance

- **Run/agent:** Actual responsible agent/session.
- **Task(s):** Exact roadmap IDs.
- **Started:** Actual ISO-8601 timestamp with timezone.
- **Ended/checkpointed:** Actual timestamp, or state that the session remains active.
- **Outcome:** Completed / Submitted for review / Interrupted / Blocked / Investigation only. Choose one and explain.
- **Branch:** Actual branch; normal policy is `main`.
- **Starting commit:** Actual full SHA.
- **Tested implementation commit(s):** Actual full SHA(s), or explain why nothing was committed/tested.
- **Published remote revision:** Actual observed revision; never guess a future metadata commit.
- **Critical warning:** Highest-priority failure or missing verification, or `NONE` with basis.

## Objective and acceptance scope

State the exact task objective and acceptance IDs addressed. Distinguish implementation work from planning or research.

| Criterion ID | Observed outcome | Evidence reference | Remaining condition |
| --- | --- | --- | --- |
| Replace with real criterion | Passed / Failed / Not run / Pending | Actual manifest/artifact | Exact unfinished condition or `NONE` |

## Changes made

| Path/module | Concrete change | Why it was needed |
| --- | --- | --- |
| Actual repository path | Actual behavior or documentation change | Task/defect addressed |

Describe important interfaces, invariants and integration decisions. Do not claim that adding a file proves the behavior works.

## Decisions and assumptions

- New or superseded ADRs: actual paths, or `NONE`.
- Verified facts: official source/probe references when relevant.
- Proposed or unverified assumptions: explicit list.
- Scope changes approved by owner: exact decision reference, or `NONE`.

## Verification performed

| Command/check | Environment and tested revision | Actual result | Evidence/log |
| --- | --- | --- | --- |
| Exact executed command | Tool/runtime/device context | Exit code and meaningful result | Actual path/URL |

Record known warnings, skipped tests, flaky outcomes and exclusions. Include reproducible seeds/fixtures where relevant. Never convert a skipped check into a pass.

## Verification not performed

| Check/acceptance | Why not run | Who/resource needed | Next action |
| --- | --- | --- | --- |
| Actual missing check | Concrete reason | Specific owner/resource | Reproducible next step |

If everything required was verified, state that with references rather than leaving this section ambiguous.

## GitHub Actions

- Actual run URL(s): verified URLs only, or `NOT RUN`/`INACCESSIBLE`.
- Commit checked by each run: actual full SHA(s).
- Required jobs and statuses: include failed, pending, skipped and approval-held jobs.
- Artifacts: names, locations, hashes where available and retention implications.
- Metadata commit CI: actual observed state, or `PENDING` with next-check action.

## Visual/device context, if relevant

- Actual physical device or explicit `SIMULATOR`/`BROWSER HARNESS`.
- OS/runtime and native build.
- Web bundle/asset revision and hashes.
- Scene/layout, camera, lighting/exposure, weather/time and quality tier.
- Workload, warmup, duration and measurement tools.
- Visible defects, frame-time/memory/thermal observations.
- Capture/reference paths and reviewer decision.

If not relevant, state why. Do not invent a measurement or use an image-generation mockup as a runtime capture.

## Known failures and reproduction

For each failure include prerequisites, exact reproduction steps, expected versus actual behavior, logs/captures and suspected cause clearly labeled as a hypothesis.

## Blockers

| Task/requirement | Observed blocker | Responsible owner | Observable unblock condition | Independent work possible |
| --- | --- | --- | --- | --- |
| Actual task/criterion | Concrete cause | Specific role/person | Exact evidence/resource needed | Actual eligible task or `NONE` |

## Current repository and claim state

- Working tree: actual `git status --short --branch` interpretation.
- Untracked/uncommitted work: paths and ownership, or `NONE`.
- Preserved user/other-agent changes: exact scope, or `NONE`.
- Claim: owner, expiry and whether released/submitted/completed/blocked.
- State/projection validation: exact command/result.
- Everything intended pushed: yes only if verified; otherwise explain the access/network blocker.

## Remaining work in this task

List concrete unfinished behaviors, files, tests and acceptance requirements. Avoid “polish”, “cleanup” or “finish the rest” without detail.

## Next agent: start here

- **Next selected task/action:** Exact output of the live selection command, including repair/recovery if appropriate.
- **Read first:** Actual phase/specification/ADR paths.
- **First action:** Precise command or inspection and expected information.
- **Second action:** Precise implementation or diagnostic step.
- **Third action:** Required verification and evidence update.
- **Do not do:** Specific risky action or unresolved assumption to avoid.

## Final integrity check

- [ ] Every claimed command/result was actually observed.
- [ ] Actual implementation revision and artifacts are traceable.
- [ ] Manual approvals were not self-granted.
- [ ] Device and simulator/browser results are distinguished.
- [ ] Failed and unrun checks are visible.
- [ ] State, projections and handoff pointer agree.
- [ ] No credentials/private tester data are exposed.
- [ ] Unknown changes were preserved.
- [ ] Next action is concrete and within scope.

Do not check an item until true. If this is an interrupted handoff, leave unmet items unchecked and explain them above.
