# Checkpoint integrity, camera arbitration and clean-install verification

## Current scope and acceptance

P01-T02, P02-T01 and P04-T06 remain active. No task is completed by this checkpoint. The fixed-oval scene remains procedural development work; the final graphics, general editor, actual device and release gates remain open.

The preceding published implementation is `f0303cc9a9f49e48902350b14f526d5dcdbda3de`. Its [web workflow](https://github.com/cheshmakzanoon-ops/Tin-junction/actions/runs/40458903202) passed all 28 browser cases without retries, plus 108 project, 28 iOS-tool and 301 web unit tests, build checks and the separate reproducible asset-export job. Its [focused native model workflow](https://github.com/cheshmakzanoon-ops/Tin-junction/actions/runs/40458903138) passed all 79 native units. The compact f030 records retain exact source and artifact hashes; these successful executions are historical evidence, not validation of the repairs below.

At the latest observation during preparation, the [full native workflow](https://github.com/cheshmakzanoon-ops/Tin-junction/actions/runs/40458903139) remained in its compile/test script step, with installed-byte verification and artifact upload still pending. That status does not establish whether the script reached compilation, UI execution or export. Inspect its completed log before diagnosing the long run. Its original overall job deadline is 45 minutes from the observed 06:04:13 UTC start.

## Integrity defect and compatibility policy

Independent review found that both native and browser generation wrappers protected document bytes but trusted a separately stored checkpoint number. Changing only that number could bypass the checksum. A maximum legal counter could prevent all later changed-content saves, despite an available valid previous generation; a lowered counter weakened ordering of same-revision operating snapshots.

The native and browser corrections write a version-2 storage wrapper with a separate generation checksum binding storage version, checkpoint and document checksum. The existing document checksum and bridge acknowledgement retain their meaning. Strict wrapper versions and fields remain enforced. This is a storage-wrapper repair for the current oval document; it does not migrate or activate the detached general-layout v2 format.

Legacy documents retain their validated content, while their unprotected checkpoint starts at zero for the new session. Loading leaves stored bytes untouched and does not falsely announce recovery of an older document. The next successful save upgrades through the existing backup and atomic-write path. Native regression fixtures cover high/low metadata corruption, continued saving after recovery, verified legacy preservation, rejected corrupt/future wrappers, and interruption at each legacy-upgrade boundary. Native compilation/execution remains required.

The host fixture also observes the actual awaited store call before it mutates or returns, so a premature durable-state publication after task scheduling can fail the test. This is host-state timing evidence when executed; the fixture has no attached WKWebView and cannot establish delivery of `native.saved` by itself.

## Camera modifier defect

Actual trusted Control, Meta and Shift clicks against the f030 browser build each increased scenery from 29 to 30 and revision from 0 to 1. The new four-case regression also reproduced the problem when Shift was pressed and released during an already held pointer. All four failed against the unchanged build for the expected unwanted edit.

The correction cancels the pending editor tap on camera modifiers at pointer down, movement, release and keydown. Releasing the key before the pointer cannot revive the edit. It leaves OrbitControls event delivery intact. All 12 focused interruption, touch and camera cases passed against the rebuilt app, including a fresh intentional placement after each cancelled gesture. These cases do not separately measure camera displacement or physical Duo input.

The [local repair observation](../../evidence/P04-T06-integrity-input-repair-local.json) identifies exact source hashes and retained logs. The storage regression first observed three expected failures with ten existing passes, then all 13 passed after repair. The complete local `npm run check && npm run bundle:ios` passed 108 project tests, 42 iOS-tool process-fixture tests and 304 web units, TypeScript, ordinary build/integrity verification and native resource packaging. These checks cannot execute Swift locally.

## True clean-install trial

P01-T02 requires an app-data-deletion repeat. The existing WebKit reset and cold relaunch do not delete Application Support layouts. The [reviewed fixed runner](../../evidence/P01-T02-clean-install-runner-review.md) therefore requires the unchanged full native suite and installed-resource identity, observes prior saved data, uninstalls only the fixed compiled test app on the observed Duo, verifies the absent data-container mapping, reinstalls the same product, and observes an empty native store before first launch. It reruns the unchanged asset-origin test and requires two completed observations with distinct sessions and matching installed resources.

The workflow now runs that additional trial only after both prerequisites succeed. The full native step is capped at 45 minutes; the separate clean-install step allows 25 minutes around a 20-minute native test invocation. The overall 75-minute allowance reserves setup and artifact collection without extending the full-suite step's limit. Failed attempts retain their separate `clean-install-*` evidence directories. Fourteen targeted process-fixture tests passed; the complete local iOS-tool suite passed 42. Actual native CLI behavior and clean-install execution remain unverified.

## Next action

1. Inspect and preserve the completed f030 full native outcome. Fix any demonstrated failure before relying on another run; do not infer a UI failure from a still-running script step.
2. Publish the reviewed integrated corrections and run all required workflows against that exact commit. Preserve full unit/UI results, actual held/released startup and Retry captures, both audio/asset observations and installed-byte identity.
3. Require the additional clean-install trial before accepting P01-T02 or the proposed transport ADR. Prepare new source-bound evidence; do not replace f030 hashes with newer files or drop changed source fingerprints.
4. Accept P02-T01 and P04-T06 only when their complete current criteria pass. Then use the project CLI to select and claim newly available work: asynchronous resource handling, accessible preferences and compressed-asset compatibility are prepared directions, not completed dependencies.

The [prior visual critique](2026-10-27-workbench-refinement.md#remaining-quality-limits) still applies. Flat terrain, repetitive foliage and insufficient material detail remain below the target. The f030 overview/night captures were inspected; a passing browser suite did not convert them into production art. Real Duo graphics/thermal validation, exclusive distribution, rights/name clearance, owner art approval and signed release remain external gates.
