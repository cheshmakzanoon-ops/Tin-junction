# System architecture

Status: development architecture accepted; production implementation proceeds through the task graph. The checked-in calibration harness demonstrates plumbing, not the final railway.

## 1. Product boundary

Tin Junction ships as one paid, offline iPhone Duo application. It does not ship as a website, generic iPhone game, Android app or desktop game. The browser target exists to accelerate deterministic engine tests and visual diagnostics. Supporting a browser in development does not change consumer compatibility commitments.

The experience is a personally arranged model railway: operate a locomotive, set turnouts and signals, assemble track and scenery, change lighting, save layouts and return to them. The primary loop is creation and observation, not winning or earning. Public launch requires the owner-approved Duo distribution route in [ADR-0002](../decisions/ADR-0002-duo-only.md).

## 2. Module ownership

| Module | Owns | Must not own |
|---|---|---|
| SwiftUI application shell | Scene lifecycle, accessible menus, alerts, preferences, import/export presentation | Per-mesh renderer state or railway topology |
| Duo adapter | Public hinge observations, actual scene geometry, reserved regions, capability report | Guessed model IDs, inferred hinge location, business logic |
| WebKit host | Bundled resource routing, navigation policy, validated bridge, WebContent recovery | Arbitrary native RPC or remote executable content |
| Native layout store | Atomic persistence, schema migration orchestration, backups, file protection | Advancing active train movement |
| Simulation core | Graph, route occupancy, fixed-tick train motion, command application, deterministic snapshots | DOM, Three.js scene objects, platform APIs |
| Editor domain | Commands, validation, undo/redo transactions, selection IDs | Direct file writes or bypassing graph validation |
| Three.js renderer | GPU resources, render graph, materials, cameras, instance/LOD updates, effects | Durable save authority or authoritative physics |
| Input adapter | Gesture interpretation, hit tests, accessibility commands, coordinate conversion | Hidden mutations outside the command log |
| Asset catalog | Asset identity, version, bounds, sockets, LOD and provenance | Runtime network downloads or unlicensed references |
| Audio/feedback adapter | Event-to-sound mapping, native feedback requests, interruption recovery | Timing authoritative simulation from audio callbacks |

## 3. Runtime flow

1. Native boot loads settings and last-known-good layout metadata without launching multiple renderer instances.
2. Native validates the installed asset manifest and creates a WebView configured for local content only.
3. The bundled web entry initializes bridge validation and reports readiness or a bounded error.
4. Native sends the protocol handshake, actual viewport and lifecycle state. Later production phases add a versioned layout snapshot.
5. The engine validates the snapshot and asset IDs, builds the simulation graph, creates the render scene, and acknowledges the accepted revision.
6. User actions become typed commands. The domain validates and applies them transactionally, increments revision and updates render/audio projections.
7. Native receives bounded durable snapshots at explicit transaction/checkpoint boundaries, writes atomically, and acknowledges the durable revision.
8. On pause, fold transition, backgrounding or process loss, simulation stops safely and recovery uses the last acknowledged snapshot.

No stage is considered complete simply because a spinner disappears. Boot states are explicit: loading metadata, loading runtime, negotiating, loading layout, ready, recoverable failure, fatal compatibility failure.

## 4. Contract boundaries

The bridge is defined in [BRIDGE_PROTOCOL.md](BRIDGE_PROTOCOL.md). Shared rules:

- Messages carry protocol version, unique request ID, known type and a bounded typed payload.
- Reject unknown versions, unknown types, missing keys, non-finite numbers, malicious strings and excessive payloads before changing state.
- Send data through argument-safe WebKit APIs; never interpolate user strings into evaluated JavaScript.
- Native-to-engine layout changes are versioned commands, not arbitrary setter strings.
- Engine-to-native persistence is a full validated snapshot or an explicitly supported transaction; it is never an uncontrolled filename plus bytes.
- Phone observations are latest-value data. Coalesce obsolete pose/viewport updates instead of queuing every sensor sample.
- The initial debug bridge does not imply production save, audio or import contracts already exist.

## 5. World and time conventions

Accepted initial conventions are in [ADR-0003](../decisions/ADR-0003-graphics-baseline.md). Physical miniature meters, right-handed coordinates, Y up, XZ board, locomotive +Z forward and wheel axle +X. Record exact matrices at asset import boundaries; never compensate with unexplained exporter rotations throughout the code.

Simulation advances at a fixed proposed 60 ticks/second. Render interpolation uses the accumulator fraction but cannot mutate authoritative state. Clamp long wall-clock gaps and bound catch-up ticks; backgrounding must not fast-forward an hour of train travel. Use a monotonic clock for elapsed time and explicit integer ticks for replay. Persist simulation tick/seed where needed, not `Date.now()` as the engine clock.

Only one subsystem owns randomness. Seed procedural scenery and effect sampling; artistic particle noise must never affect graph or save determinism. Do not require identical pixels across GPU vendors to assert domain determinism.

## 6. Data model boundaries

Production schema is specified in [PERSISTENCE_AND_EDITOR.md](PERSISTENCE_AND_EDITOR.md). Separate:

- **Layout document:** track pieces/connectors, scenery placement, kit references, named views and explicit schema version.
- **Session state:** train position, route history, throttle, selection, temporary animation phases.
- **Preferences:** volume, reduced motion, control accessibility, chosen quality policy.
- **Derived caches:** mesh buffers, route-distance tables, bounds, thumbnail cache. Rebuild rather than treating them as authoritative data.

IDs survive reorder, save/load and migrations. Asset IDs are immutable identity; paths and material indices are not identity. Commands reference IDs and expected revisions. A stale command must be rejected or reconciled explicitly, not applied to whichever object occupies an array index.

## 7. Storage transactions

Native storage is the durable authority. The simulation owns the current in-memory world during a healthy session. The word “authority” has these different time scopes; it does not mean both sides can independently edit a document.

The engine sends revision N with a content checksum and schema version. Native validates size/schema, writes a temporary file in the app container, completes the atomic replacement, retains the previous valid generation and acknowledges N. The UI may say “Saved” only after that acknowledgement. Save errors keep the document dirty and visible; they must not silently discard edits.

Checkpoint on completed editor transactions, explicit Save, and best-effort lifecycle opportunities. Background callbacks are not guaranteed time to perform an arbitrarily large save, so ordinary interaction must already produce recoverable checkpoints. On WebContent restart, load only the last valid durable revision; report loss of uncommitted changes truthfully.

## 8. Fold behavior

Hinge angle drives case-opening presentation and optional restrained feedback. Layout uses actual native geometry and reserved-region observations. The track graph stays unchanged as the phone folds.

Fully open: wide layout canvas with accessible controls outside protected regions. Partially folded: approved tabletop composition with a designated railway viewport and controls, not a rail line visually broken across two planes. Closed/outer display: a same-device paused/preview state determined by the product interaction spec and actual system lifecycle. Never simulate train motion while the renderer is invisible unless explicitly designed and tested.

Do not use a camera-only outer-display accessory merely to show a decorative train; each Apple API must be used for its documented purpose. Screen-size and fold-debug sliders in the harness are test inputs, not proof of hardware support.

## 9. Rendering and resource lifecycle

Initial WebGL2 rendering uses calibrated PBR, restrained effects and a strict ownership graph. Every geometry, material, texture, render target, event listener, worker and animation callback has an owner and disposal path. Loading another layout must release the previous layout's resources after the transition.

The renderer provides `initialize`, `resize`, `loadWorld`, `applyProjection`, `render`, `pause`, `resume`, `captureDiagnostics`, `recoverContext`, and `dispose` concepts; exact interfaces are implemented under the relevant task. Simulation tests must not require a GPU context.

The packed canvas resolution is a bounded quality decision, not simply native screen pixels. Aggregate draw calls across shadow and postprocessing passes. Texture download bytes, decoded texture cost, JavaScript heap, native process footprint and GPU memory estimates are distinct metrics. See [performance budgets](../graphics/PERFORMANCE_BUDGETS.md).

## 10. Packaging and reproducibility

`package-lock.json` pins runtime/build dependencies. The web build emits only approved local runtime files and a SHA-256 manifest. The native bundle step copies the verified outputs to the Xcode resource folder. Source maps, test assets, internal hooks and diagnostics must be audited before release packaging.

The bootstrap uses an IIFE/classic script to reduce local-origin module-loading variables. This is not a permanent exemption from testing texture, worker, audio or WASM origins. Compression-decoder compatibility is an integration test against the exact packaged engine, not inferred from a file extension.

Swift project generation is explicit and version-pinned; generated `.xcodeproj` and WebAssets are build outputs. Simulator builds are unsigned. Device signing and App Store actions require the owner-approved release workflow, credentials and gates.

## 11. Versioning and migrations

- Protocol version changes when incompatible bridge semantics change.
- Save schema version changes when old documents require migration.
- Asset manifest version and hashes identify exact art inputs.
- Build version identifies native code, engine bundle and content together.
- Project ledger schema version identifies agent state format, independently of app format.

Write migration fixtures before changing a format. Never confuse app semantic version with document schema version. A release cannot downgrade a user document without preserving a recovery path.

## 12. Failure and recovery matrix

| Event | Required behavior | Evidence |
|---|---|---|
| Missing runtime asset | Native error with actionable code; no infinite loading | Packaged missing-file test |
| Unsupported bridge version | Refuse handshake; bounded diagnostic | Swift + TS contract tests |
| WebGL context loss | Pause presentation, recreate resources, retain domain state | Browser and packaged host tests |
| WebContent termination | Recreate host and restore durable checkpoint | Native integration test |
| Corrupt layout file | Preserve original, offer last good generation | Store recovery tests |
| Storage full | Keep dirty state, explain failure, do not replace valid file | Fault-injection integration test |
| Unknown asset ID | Controlled fallback or import rejection, never crash | Schema/catalog test |
| Fold during drag | Cancel or finalize transaction by explicit rule; no half edit | Duo interaction test |
| App interruption during save | Atomic old/new document, not partial bytes | Transaction test |
| Thermal pressure | Defined quality/pause response without physics change | Physical-device soak |

## 13. Build-now versus design-next

The setup contains a native/WebGL diagnostic harness, minimal bridge validation, test configurations and the agent planning system. It does not contain production trains, track topology, full storage, scenery editing, licensed art, production sound, completed posture UX or release-ready compatibility enforcement. Those are tasks, not implied capabilities.

Use the [roadmap](../../planning/roadmap.json) and generated phase files to implement these systems incrementally. Any change to these boundaries must include an ADR, tests and a handoff explaining the downstream consequences.
