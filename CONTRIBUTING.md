# Contributing and integrating agent work

Read [AGENTS.md](AGENTS.md) and [START_HERE.md](START_HERE.md). This repository uses one integration branch, `main`; no automatic agent branches or unsolicited feature PRs.

## Before editing

Check the current remote commit and required workflows. Preserve dirty files. Select and claim a ready task through `tools/project.mjs`, read its specifications, and write down the intended acceptance evidence. Do not expand scope silently.

## During work

Keep modules small enough to test. Prefer explicit types and deterministic fixtures over global mutable state. Never depend on frame rate for simulation, model-name guesses for platform features, or a network CDN for shipped assets. Put test data beside the subsystem tests. Retain regression tests for every fixed defect.

For concurrent agents, assign disjoint file scopes. One coordinator owns the ledger, lockfile and integration pushes. If two workers need a shared contract, agree on it first; don't edit past one another.

## Review and checkpoint

Run the selected task's tests and repository checks. Inspect changed files and generated artifacts. Review security, accessibility, storage/migration and real-device implications. Record limitations rather than upgrading untested claims.

Commit coherent checkpoints using `<area>: <task-id> <change>` and push to `main` without force. If the push is rejected, fetch and inspect the new head. Respect repository protections; do not bypass an approval workflow.

The integration coordinator then records the observed CI result, tested implementation commit, evidence manifest and handoff in a follow-up metadata commit. This avoids the impossible requirement for a commit to contain its own final SHA.

## Contributor rights

The repository is public for collaboration. No blanket open-source license has been selected by the owner. Do not add a permissive or copyleft license without authorization. All contributions and third-party assets need clear provenance and compatible distribution rights; public availability alone does not grant reuse permission.
