# Release readiness — read-only and blocked by default

This directory is **not a release approval**. The initial repository is an engineering scaffold. No signing, TestFlight upload, App Store submission, or publication runs automatically. `tools/release-readiness.mjs` only reads the checkout, an owner-supplied approval, and GitHub Actions results; it prints a report and returns nonzero when blocked. The manual workflow has read-only permissions and no deployment step.

## Gates

All of the following must pass:

1. Candidate is the full lowercase SHA of checked-out `HEAD`; the worktree is clean. There is no metadata-only SHA exception.
2. Every phase P00 through P28 exists, is nonempty, and every task in those phases is `done`. P29 and later do not bypass these gates or become prerequisites automatically.
3. Project validation passes with actual files, historical commits, evidence, and generated views checked. Unresolved project incidents block. Validator warnings remain in the report for human review; they are not silently removed.
4. The latest eligible main run of **each** required workflow, `.github/workflows/quality.yml` and `.github/workflows/ios-simulator.yml`, completed successfully for that exact SHA. Queued, skipped, cancelled, missing, failed, fork, and pull-request runs cannot stand in for successful candidate main checks. CI is fetched live using the configured read-only GitHub credential; observation must be no older than one hour.
5. Owner approval matches the repository and candidate, names `cheshmakzanoon-ops`, contains boolean `authorized: true`, has a nonfuture `approved_at` and unexpired `expires_at`, and points to a real local decision file or nonplaceholder HTTPS reference. Dates use UTC ISO 8601 (`YYYY-MM-DDTHH:mm:ssZ`, optionally with three millisecond digits). Agent identities and substitute owners fail.

`planning/state.json` contains a useful CI snapshot, but committing a CI result for `HEAD` changes `HEAD`. This preflight therefore checks a **runtime, uncommitted** exact-candidate CI observation. Approval is also supplied externally, avoiding the same self-referential commit problem. Neither is written into the task ledger by this command.

## Local use by the owner

Keep the approval JSON outside the checkout. It must have these fields; this deliberately invalid example **cannot authorize a release**:

```json
{
  "schema_version": 1,
  "repository": "cheshmakzanoon-ops/Tin-junction",
  "candidate_sha": "REPLACE_WITH_EXACT_COMMIT_AFTER_REVIEW",
  "authorized": false,
  "approved_by": "cheshmakzanoon-ops",
  "approved_at": "REPLACE_WITH_ACTUAL_APPROVAL_TIME",
  "expires_at": "REPLACE_WITH_OWNER_CHOSEN_EXPIRY",
  "decision_reference": "REPLACE_WITH_RECORDED_OWNER_DECISION"
}
```

After independently reviewing the candidate, the owner supplies their actual values and explicitly authorizes it. Agents must never change an approval to `true` or invent an approval record. The decision reference may point to an already committed owner decision; authorization JSON binds that decision to the final candidate separately.

```sh
git status --short
git rev-parse HEAD
node tools/release-readiness.mjs --candidate FULL_40_CHARACTER_SHA --approval /absolute/path/to/owner-approval.json --observe-ci
```

`gh` must already be authenticated with task-relevant repository/Actions read access. A missing approval, missing credential, inaccessible history, unreadable input, or failed API call blocks. Do not broaden token permissions to make this check pass. Running without `--observe-ci` blocks because there is no fresh CI proof; a historical ledger success alone is insufficient.

## Manual GitHub Actions use

The owner sets repository Actions variable `TIN_RELEASE_APPROVAL_JSON` to the reviewed JSON, then dispatches **Read-only release readiness** with its matching full candidate SHA. An absent or empty variable blocks. The workflow does not create this variable or an approval, does not fetch arbitrary approval URLs, and never prints the approval body. Do not put secrets in an approval or decision reference; repository variables are not a secret store. Expired or stale-SHA approvals must be reviewed anew by the owner, not automatically extended by an agent.

The workflow requires only `contents: read` and `actions: read`. A successful report is an engineering preflight, **not** permission for an agent to perform a later signing/upload/submission step. Those actions remain separate owner-authorized operations under the release runbook.

## Limitations and verification

- An owner login in JSON is an assertion, not cryptographic identity verification. Protect repository-variable editing and retain the owner's actual recorded decision. HTTPS references are syntax-checked and retained; their remote content is not fetched or certified.
- The API queries the latest 100 runs for the candidate. Missing required runs conservatively block instead of guessing. A new failed rerun after inspection invalidates the old readiness conclusion; rerun this check immediately before an owner-authorized release operation.
- Passing simulator/browser CI is not real-device graphics, thermals, audio, or commercial Duo-only-distribution approval. Those remain evidence gates in the phase plan.
- Unit tests create approval data only inside disposable test fixtures. No usable approval file is checked in. Run `node --test tests/project/release.test.mjs` (also included in `npm run test:project`).

For the remaining manual process, read [the release runbook](../docs/operations/RELEASE_RUNBOOK.md).
