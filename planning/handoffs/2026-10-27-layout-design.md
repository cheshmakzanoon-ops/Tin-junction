# Portable layout design — P07-T01

## Scope and publication

The version-2 document boundary was first published at `9971887835dedae6a5f870b3633acd6747c255b5`. It is a detached design format, implemented by `web/src/documents/layoutDesign.ts` and `apps/ios/TinJunction/Documents/LayoutDesignDocument.swift`. The current app, bridge and native save store still use schema 1. No migration, general editor, import UI or atomic v2 save integration is claimed.

The [format contract](../../web/src/documents/FORMAT_V2.md) defines the complete envelope and unsupported-version behavior. It includes connected track and turnouts, explicit selected routes, known vehicle identities, retained train motion/history, bounded scenery and a lighting preset. It excludes paths, native/renderer handles, executable content and derived GPU data.

## Design decisions

- Files are bounded to 512 KiB UTF-8, depth 32 and 40,000 JSON values. Piece, turnout, connection, scenery and vehicle counts have explicit bounds shared by the readers.
- Unknown fields, catalogs and versions fail with recoverable explanations; original input is not rewritten.
- The vehicle catalog's integer-micrometre footprint formula is shared with the native reader. A train checkpoint cannot omit its trailing footprint, disagree with turnout selections or retain unsafe braking state.
- A valid editable file may contain incomplete or overlapping track. Operating clearance and complete rigid-vehicle compatibility are separate mandatory placement/run gates; decoding success is not authorization to operate.
- Canonical serialization sorts unordered identity collections and object keys. Physical vehicle order, occupied route-history order and full numeric precision are preserved. Cross-language floating-point JSON spelling is not promised to be byte-identical.
- Input objects are detached and inspected before JSON serialization. A follow-up review found that hidden array properties could carry a custom `toJSON` getter; the guard now permits only dense indices and the intrinsic array length, rejecting that hook without invoking it.

## Verification and current acceptance status

The shared corpus has 46 literal validity expectations and is checked byte-identical in web and native test resources. It covers empty/minimal layouts, a maximum editable design, one/three/eight-vehicle trains, occupied turnouts, reverse history, bounds and malformed identities/topology/snapshots. Additional web tests cover semantic round trips, stable ordering, detached caller data, operational clearance separation and unsafe runtime objects. The latest focused web run passes 51 tests.

Actual native model run [40448701737](https://github.com/cheshmakzanoon-ops/Tin-junction/actions/runs/40448701737) passed all 63 unit tests at `9971887`, including all 11 native document tests and the shared corpus. The compact [native historical review](../../evidence/P07-T01-native-review-9971887.md) retains its tested fingerprints and independently verified artifact digest. The independent full native workflow also passed at that revision.

The native bridge JSON container, Xcode project and bundler subsequently changed for the asset probe and Release guard. Historical success must not be relabeled as current-source acceptance. The task remains active pending fresh native evidence from the newer source checkpoint and a fresh web manifest covering the hidden-array-hook correction. No current task completion is granted by this handoff.

## Next action

Retain the passing historical evidence. Observe the new native model run, repair any actual compile/test defect, and create a new native manifest from that run's source tree and artifact. After publishing the small web guard correction, rerun the focused web corpus/round-trip tests and refresh its exact-source manifest. Complete P07-T01 through the project CLI only when both current scoped inputs pass. Native save/migration work remains dependency-gated by P03 and the subsequent P07 tasks.
