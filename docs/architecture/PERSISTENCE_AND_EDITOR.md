# Durable layouts, editor transactions and recovery

Status: PROPOSED design. Storage, migration and recovery are release-critical; none is complete until failure-injection and packaged-app tests exist.

## 1. Authority model

Three.js objects are never save data. The in-memory simulation owns current logical scene state; native Swift owns durable local documents and the acknowledged revision. The bridge transfers validated logical commands and snapshots.

Three distinct numbers must not be conflated:

- **Document schema version:** how a file is interpreted/migrated.
- **Layout revision:** monotonic counter for committed user edits.
- **Simulation tick/checkpoint sequence:** operating state within the current revision.

The bridge protocol version is separate again. A UI text change does not require a document migration; a document schema change does not silently change the bridge envelope.

## 2. Proposed document shape

Final wire schemas live with the shared contracts. The conceptual document contains:

```text
format: "tin-junction-layout"
schemaVersion: positive integer
documentId: stable opaque ID
revision: nonnegative integer
catalogVersion: known bundled catalog version
board: supported board ID and immutable dimensions reference
seed: deterministic integer seed
trackPieces: ID, catalog ID, rigid transform, route selection
connections: explicit validated socket pairs
scenery: ID, catalog ID, rigid transform, allowed variation seed
trains: stable consist definitions and validated route positions
signals: ID, compatible track/socket references and direction
environment: known preset IDs and bounded parameters
camera: bounded view parameters, optional on import
metadata: bounded display name and timestamps
```

Native storage may wrap this payload with content hash, generation number, app build and write time. The wrapper's integrity hash detects accidental corruption; it does not make untrusted files trustworthy or provide authentication.

Do not serialize:

- Mesh vertices, renderer objects, GPU IDs, JavaScript functions or native paths.
- Arbitrary remote URLs or asset download instructions.
- Auth credentials, personal identifiers or diagnostic tokens.
- Derived adjacency arrays, BVHs, arc-length lookup caches or transient selections.
- A complete unbounded undo log.

## 3. Save ownership and concurrency

Use one native serialized persistence coordinator, preferably an isolated Swift actor, for each document store. Multiple scenes or repeated bridge callbacks must not perform competing writes to the same document.

Every request carries the document ID, revision, checkpoint sequence and expected prior durable revision. Validation precedes storage. An acknowledgment includes the accepted document/revision/checkpoint and integrity hash.

Rules:

1. An older revision never overwrites a newer durable revision.
2. Duplicate requests are idempotent; they may return the prior acknowledgment.
3. Two requests for the same revision with different content are a conflict, not a silent last-writer win.
4. A new layout session cannot receive stale acknowledgments from the previous layout.
5. A native document switch is acknowledged before the renderer treats a different document as current.
6. App restarts generate a new session identifier; previous-session request IDs cannot mutate the new session.

Conflict handling is initially simple: stop writes, keep both candidate payloads in memory if safe, show a recoverable conflict state, and require a deliberate choice/duplicate. Do not introduce a complex merge algorithm without a separate specification and tests.

## 4. Durable write sequence

Use app-private Application Support storage for active documents. Do not rely on cache directories for irreplaceable layouts. Do not promise survival after uninstall.

Recommended generation-based design:

1. Decode and structurally validate the candidate snapshot.
2. Run semantic validation against the bundled catalog and graph constraints.
3. Encode canonical payload bytes and compute a content hash.
4. Write a new temporary generation file in the same document directory.
5. Finish the write, validate the stored bytes/hash, and move/replace into the immutable generation name using supported atomic filesystem operations.
6. Atomically update a small current-generation index.
7. Retain at least the immediately previous known-good generation.
8. Only now acknowledge the revision as saved.
9. Clean older generations later, never before the new index is committed.

Exact filesystem/API choices must be verified on the supported iOS SDK. An atomic replacement protects against partial application-level writes; it is not a claim of absolute immunity to power loss or hardware failure. Test interruption at each stage and document the guarantees actually observed.

On startup:

- Read the index and validate the named generation.
- If invalid, try the retained known-good generation.
- Ignore/quarantine incomplete temporary files rather than interpreting them as current.
- If all generations fail, preserve the original bytes for user-initiated recovery/export and present a clear error.
- Never silently replace a damaged personal layout with the factory scene.

## 5. Autosave policy

Every committed editor transaction yields a logical revision immediately. Native receives a validated snapshot or a rigorously validated command/snapshot checkpoint for that revision. Start with full bounded snapshots for simplicity; optimize only after measuring serialization and bridge costs.

Proposed healthy-foreground target: coalesce rapid editing for at most 250 ms and aim to durably commit within one second after a completed transaction. This is a target, not a guarantee under storage failure or forced termination.

Save triggers:

- Committed editor transaction.
- Rename, duplicate, preferences requiring durability, or layout switch.
- Entering library or a significant native scene transition.
- Background/inactive notification, using the latest snapshot native already has.
- Explicit user save/export request.
- Bounded periodic train/camera checkpoint if those states are retained.

Do not wait until backgrounding to ask JavaScript for the only copy of user edits. The system may suspend or terminate the WebView before that round trip completes.

Operating train position can be checkpointed less often than structural edits. On restore, throttle is zero and the train is stopped even if the saved operating state included motion. A later auto-resume feature requires an explicit product decision.

UI save feedback is revision-aware:

- **Unsaved changes:** in-memory revision exceeds durable revision.
- **Saving:** a write for the current or later requested revision is in flight.
- **Saved:** current revision has a matching native durable acknowledgment.
- **Save failed:** last request failed; retain edits and offer retry/export.
- **Recovered:** a prior generation was loaded; explain potential lost changes honestly.

## 6. Editor command model

All edits use one command dispatcher. Native inspector actions and scene gestures converge here.

Each command has:

- Stable command ID and session ID.
- Expected layout revision.
- Command kind and schema-validated arguments.
- Target entity IDs, never raw object references.
- User-intent grouping/transaction ID.
- Deterministic application and inverse information.

Initial command families:

| Family | Examples | Critical validation |
|---|---|---|
| Track | Add, move, rotate, remove, connect, disconnect | Sockets, graph, train occupancy, clearance |
| Scenery | Add, move, rotate, duplicate, remove | Catalog, transform, board and route clearance |
| Train placement | Add/remove/relocate a supported consist | Complete route support and vehicle radius |
| Environment | Change known preset | Allowed parameters and resource limits |
| Metadata | Rename/duplicate | Bounded strings, distinct document identity |

Runtime operating commands such as throttle or whistle are not automatically part of structural Undo. Define their own replay/diagnostic stream; do not fill the editor history with every throttle adjustment.

## 7. Transaction protocol

For a single edit:

1. Decode and validate the command without mutation.
2. Confirm the expected revision and current editor mode.
3. Build a candidate logical change using copy-on-write or a reversible transaction buffer.
4. Validate all affected geometry, references, catalog constraints and rolling-stock clearance.
5. Generate the inverse operation or bounded before-state needed for Undo.
6. Atomically commit the candidate, increment revision and append one history entry.
7. Notify renderer and persistence with a committed-change event.

If any step fails before commit, the original state is untouched. Do not repair partial mutations by guessing what was changed.

For a placement gesture:

- Pointer-down creates a transient preview session.
- Moves change preview only and may compute candidate snap diagnostics.
- Pointer-up confirms a single command if valid.
- Cancel, posture change, suspension or selection loss discards the preview.
- A ghost object never appears in a save, graph or final occupancy map.

## 8. Undo/redo design

Store semantic inverse operations or compact immutable before/after snapshots of affected entities. Do not copy the entire world at every pointer movement.

Initial proposed caps: 100 committed transactions or 16 MiB of history payload, whichever is reached first. These limits must be tested and documented in the implementation configuration.

Invariants:

- Undo followed by Redo returns to an equivalent logical world, subject to documented revision counters.
- A composite command is undone atomically.
- IDs recreated by Undo remain stable, while a deliberate Duplicate creates new IDs.
- New edit after Undo discards the redo branch.
- Native durable revision still increases when an Undo changes the world; it does not rewind storage revision numbers.
- Undo of topology changes rebuilds derived graph caches from logical data.
- History is scoped to one document/session. Cross-session history is not promised initially.
- A missing catalog asset or incompatible schema blocks historical operations cleanly.

## 9. Migration strategy

Provide pure, sequential migrations `vN → vN+1`, tested on committed fixtures. Do not use one broad “upgrade old data” function that changes behavior silently.

Migration sequence:

1. Read original bytes and retain them unchanged.
2. Identify format and version with a small bounded parser.
3. Reject unknown future versions without writing anything.
4. Validate the old version's shape before transformation.
5. Apply each migration sequentially in memory.
6. Validate final structure, semantic references and resource limits.
7. Write the migrated result as a new generation; retain a recovery copy of the original until owner-approved retention policy permits cleanup.
8. Record migration path, app build and outcome in local diagnostics without private layout content.

Required fixtures include a minimal document, a populated curved-track layout, a turnout with consist, renamed/duplicated documents, optional missing fields, corrupt data and a future-version file. Idempotence applies to the final-current-version load path: reopening a migrated layout must not repeat geometry scaling or ID generation.

## 10. Import/export format and security

Initial interchange format should be plain bounded JSON with a dedicated extension such as `.tinjunction`, subject to an approved document-type declaration. Avoid ZIP archives and embedded executable/custom asset content in version 1.

Proposed validation limits, to be ratified:

- Maximum source document: 5 MiB before decoding.
- Maximum nesting depth: 32.
- Maximum display name: 80 Unicode scalar values, with control characters rejected.
- Maximum object/track/train counts: as specified by simulation and content budgets.
- Finite bounded numbers only; valid unit quaternions or normalized rotations with bounded correction.
- Known catalog IDs, enum values and schema properties only.
- No paths, URLs, scripts, HTML, shader code or executable expressions.

Native decoding must enforce size/count limits before large derived allocations. TypeScript validation must not copy untrusted keys into prototypes; reject dangerous/prohibited properties and use explicit constructors/records. Swift validation alone does not excuse unsafe JavaScript object merging.

Import runs in a temporary logical world. It becomes a new personal document only after complete validation, avoiding accidental overwrite of an existing ID. Export strips private implementation paths and includes only needed metadata. Thumbnails are regenerated, not trusted as externally supplied executable/oversized image payloads.

## 11. Failure and recovery matrix

| Failure | Expected result | Evidence |
|---|---|---|
| Storage full during generation write | Current generation remains readable; UI shows unsaved state | Failure-injection test and native log |
| Process dies before index replace | Prior index/generation restored | Relaunch fixture |
| Process dies after index replace | New generation restored if valid, otherwise backup | Relaunch fixture |
| Corrupt current generation | Last-known-good restored with notice | Hash corruption test |
| Both current and backup corrupt | No silent factory reset; preserve originals | Native UI test |
| Stale save request | Rejected/ignored without rollback | Out-of-order bridge test |
| Duplicate request | Idempotent acknowledgment | Replay test |
| Same revision, different content | Conflict reported | Conflict fixture |
| Web content process terminated | Recreate scene from native durable snapshot | Packaged WKWebView test |
| Close during drag | Preview canceled, prior committed state retained | Duo integration test |
| Future-version import | Clear unsupported-version response, original unchanged | Import test |
| Catalog ID unavailable | Explicit incompatibility; no unsafe arbitrary substitute | Fixture |
| Migration fails midway | Original bytes retained; current state unchanged | Migration failure injection |

## 12. Test design for transactions

Use canonical logical snapshots to compare before/after, not renderer screenshots alone.

- Generate valid random edit sequences, record seed, undo all, compare to original semantic state.
- Redo all, compare to the first forward result.
- Inject one invalid edit at every command position and assert no mutation.
- Verify graph/cache rebuilding yields the same route geometry as a fresh document load.
- Rapidly switch layouts while delayed acknowledgments arrive; no cross-document writes.
- Repeatedly save, terminate, restore and edit while keeping memory bounded.
- Make export/import round-trips preserve supported content without retaining private storage paths.

## 13. Completion criteria

Persistence is not done because a JSON file can be written. It is done only when ordinary saves, stale/conflicting requests, failure injection, migrations, process loss, unsupported imports and recovery UI all have evidence for the packaged app.

Editor completion additionally requires actual users to distinguish previews from committed changes, recover through Undo, understand invalid placement and know whether edits are saved.

Related: [System architecture](SYSTEM_ARCHITECTURE.md), [bridge protocol](BRIDGE_PROTOCOL.md), [simulation](SIMULATION_AND_TRACKS.md), [interaction design](../product/INTERACTION_DESIGN.md), [test strategy](../quality/TEST_STRATEGY.md).
