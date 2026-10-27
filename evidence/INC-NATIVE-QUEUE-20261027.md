# Native verification queue held beyond configured deadline

Status: **OPEN — fresh native verification is running; its complete result remains required.** This is an operational verification incident, not a diagnosed application failure.

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

## Recovery observations

The bounded queue change was published at **`2b630f16abf5cce75cc2e58efa9f99f8ab65d99f`**. Its new full [run 40464291855](https://github.com/cheshmakzanoon-ops/Tin-junction/actions/runs/40464291855) received job `122055896365`, started at **06:58:37 UTC** on advertised runner `1000015877`. Its compile/test script step began at **06:59:03 UTC**, after the observed boot step completed. This runner identity differs from the old f030 job's advertised runner `1000015870`; neither identity by itself diagnoses the old run.

Between **07:08:49 and 07:09:06 UTC**, the old f030 job was observed as **completed / cancelled**. The subsequently inspected terminal metadata records `completed_at` as **06:59:13 UTC**, 55 minutes after job start; that recorded completion time is distinct from the later observation time. Its last script-step metadata still reported in progress without a conclusion; a completed-job log request still returned `404 BlobNotFound`, and its artifact list was empty. The cancellation is an observed status, not an established cause or native test outcome. No cancellation command was sent by this recovery.

The formerly pending `02d2230` full run received job `122056107043` in the old group. Its metadata records a **06:59:16 UTC** start on advertised runner `1000015878`, with the compile/test script step starting at **06:59:44 UTC**. Preserve its separate commit identity and any eventual result. At the later observation above, the required current `2b630f1` job remained active in its compile/test script step. The old cancellation and new run starts do not resolve this incident or accept any application task.

The `02d2230` full run subsequently **failed with exit 65** and retained artifact `12716507656`. The downloaded 262,080,184-byte archive has SHA-256 `3400c70020d6ee465f0ae5990ced25597bf5fbb99397c51a658a652895acd0a7`. All 84 native unit tests passed; two of eight UI tests failed. The asset-origin test reached the normal readiness timeout on its first launch. The initialization-failure test displayed its native recovery panel but still exposed WebKit's accessibility container. The delayed-startup/Help test, all four operating/save smoke tests and the platform test passed. Installed-byte verification and the clean-install repeat were correctly skipped after the full-suite failure.

The actual target-app startup trace distinguishes this application failure from the earlier unknown queue condition: `host.loading` at +5.225 seconds, `bridge.webReady` at +23.675, `host.restorePrepared` at +24.963, and `host.failed.afterBridge` at +25.909, with no `host.layoutAccepted`. Fixture responses began only afterward. The accepted native probe remained `{}` even though the diagnostic DOM eventually displayed partial loader results. Those DOM observations do not establish completed native acceptance. The source starts the optional second renderer at bootstrap, before serialized layout restoration finishes; deferring that diagnostic work and hiding the failed UIKit view are the concrete repair scope. Their outcomes require fresh execution.

At **07:23 UTC**, the required `2b630f1` full native run and web quality run still reported `in_progress`. Their application source is identical to `02d2230`, but their outcomes remain separate observations. Neither the successful focused 84-unit run nor the old full-suite result can stand in for those current required checks or for a new repair revision.

## Resolution gate

Resolve the current verification blocker only after the fresh required native workflow completes, its actual full unit/UI and clean-install outcomes are inspected, and all required current checks pass. Preserve any later old-run result as historical evidence. Its inaccessible log and unknown execution stage must not be rewritten into a success, a specific application defect or an assumed cancellation.
