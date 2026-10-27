# Native verification queue held beyond configured deadline

Status: **OPEN — recovery configured; a complete fresh native result remains required.** This is an operational verification incident, not a diagnosed application failure.

## Observed state

The full native [run 40458903139](https://github.com/cheshmakzanoon-ops/Tin-junction/actions/runs/40458903139) belongs to `f0303cc9a9f49e48902350b14f526d5dcdbda3de`. Its job `122038591332` started at **2026-10-27 06:04:13 UTC**. Its compile/test script step started at **06:04:34 UTC**. The tested workflow specifies a **45-minute overall job limit**.

At **06:54:52 UTC**, independent run/attempt/job observations still reported `in_progress`, with no conclusion: 50 minutes 39 seconds after job start. At **06:55:02 UTC**, the decoded-job-log endpoint returned `404 BlobNotFound` and the artifact list was empty. At **06:56:28 UTC**, the step-status endpoint still showed the same script step in progress, while installed-resource verification and evidence upload remained pending. No completed build, UI, installed-byte or export result can be inferred from those statuses.

The public GitHub page independently displayed **In progress**, **50m 23s** and no artifacts during browser inspection. The browser was signed out, so its cancellation controls were unavailable. The connected GitHub tools expose rerun operations but no workflow cancellation operation. No cancellation, credential submission, permission change or alternate account access was performed.

The next published implementation, `02d2230947528fedc3129d1d4ca43c9749cfa1c6`, started web and focused native-model verification normally. Its full native [run 40463712735](https://github.com/cheshmakzanoon-ops/Tin-junction/actions/runs/40463712735) remained `pending`, with no assigned job, in the old concurrency group.

GitHub's [workflow cancellation reference](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-cancellation) documents a possible five-minute cancellation interval before forced termination. Waiting beyond 45 plus five minutes did not produce a conclusion here. That documentation does not establish that cancellation actually began or identify a provider fault. The script contains boot preflight, compilation, tests and export; without its log, the specific execution stage remains unknown.

## Bounded recovery

Change only the native workflow concurrency-group identity from `ios-simulator-${{ github.ref }}` to `ios-simulator-v2-${{ github.ref }}`. Keep `cancel-in-progress: false`, all subsequent runs serialized within that new group, unchanged full test commands/assertions, installed-byte verification, the supplemental clean-install trial, existing deadlines and evidence upload.

This permits a complete verification of the current source to receive a fresh job while preserving the inaccessible old run for later diagnosis. It does not substitute a focused test lane for full integration, accept an unexecuted check, expand GitHub permissions or change release requirements. Each new result must identify its own commit and workflow hash. The old queued run can still start if the former group is released, so temporary additional runner use is possible; never attribute its result to a newer commit.

The source change is a one-time recovery, not an automatic practice of repeatedly renaming groups. If the fresh group also stalls, preserve its actual state and escalate the specific runner/control limitation instead of spawning an unbounded series of jobs.

Static verification parsed the published and modified workflow YAML, removed only their group-name values, and required the remaining structures to be equal. It also required `cancel-in-progress: false` and exactly `contents: read` permissions. These checks, `git diff --check` and `npm run project:validate` passed. They verify the bounded configuration change, not native execution.

## Resolution gate

Resolve the current verification blocker only after the fresh required native workflow completes, its actual full unit/UI and clean-install outcomes are inspected, and all required current checks pass. Preserve any later old-run result as historical evidence. Its inaccessible log and unknown execution stage must not be rewritten into a success, a specific application defect or an assumed cancellation.
