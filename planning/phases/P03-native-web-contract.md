# P03 — Secure native-to-web contract

> Generated from planning/roadmap.json. Edit the JSON definition, then run `npm run project:render`.

## Outcome

Make native/WebView communication bounded, versioned, testable and resilient to stale sessions.

## Exit gate

Both implementations pass identical message fixtures and recover correctly from malformed, late and duplicate traffic.

The phase is not accepted merely because these instructions or its source files exist. Each task requires the stated evidence. Current progress lives in [the ledger](../state.json).

## P03-T01 — Ratify the shared bridge schema

Dependencies: P01-T03, P02-T01

Manual gate: none; planning estimate: 1–3 focused sessions; planning estimate, not a delivery promise. Estimates are not deadlines or completion claims.

### Read first

- [docs/architecture/BRIDGE_PROTOCOL.md](../../docs/architecture/BRIDGE_PROTOCOL.md)
- [docs/architecture/SYSTEM_ARCHITECTURE.md](../../docs/architecture/SYSTEM_ARCHITECTURE.md)
- [docs/agents/TASK_EVIDENCE.md](../../docs/agents/TASK_EVIDENCE.md)

### Owned scope

- `web/src/bridge/`
- `apps/ios/TinJunction/Bridge/`
- `tests/fixtures/bridge/`

### Deliverables

- Versioned message schema and fixtures
- Swift/TypeScript contract compatibility tests

### Implementation sequence

1. Enumerate permitted directions and message types.
2. Define envelope version, message ID, session ID and payload size limits.
3. Specify finite numeric values, coordinate units and optional-field semantics.
4. Introduce error codes and request/response correlation without generic eval.
5. Generate identical valid and invalid fixture sets for both languages.
6. Version changes add migrations or explicit incompatible-version handling.

### Acceptance criteria

- **P03-T01-A1** — Swift and TypeScript accept/reject the same shared fixtures, including unknown versions and non-finite inputs.
  - Accepted evidence: unit_test.
- **P03-T01-A2** — The schema limits message types, sizes and directions; no arbitrary script or filesystem method exists.
  - Accepted evidence: repository_validation, unit_test.

### Verification

- Run cross-language fixture parity checks.
- Verify older schema input fails visibly instead of being partially applied.

### Failure cases and cautions

- Divergent validators create state disagreement at the platform boundary.

### Handoff requirement

Record tested implementation SHA, changed scope, acceptance evidence, commands/results, unrun checks, blockers and the next exact task. Use [the handoff template](../../templates/HANDOFF.md). Update state through the project CLI, regenerate views, and push the metadata checkpoint.

## P03-T02 — Implement handshake, ordering and session replacement

Dependencies: P03-T01, P02-T02

Manual gate: none; planning estimate: 1–3 focused sessions; planning estimate, not a delivery promise. Estimates are not deadlines or completion claims.

### Read first

- [docs/architecture/BRIDGE_PROTOCOL.md](../../docs/architecture/BRIDGE_PROTOCOL.md)
- [docs/architecture/SYSTEM_ARCHITECTURE.md](../../docs/architecture/SYSTEM_ARCHITECTURE.md)

### Owned scope

- `web/src/bridge/`
- `apps/ios/TinJunction/Bridge/`

### Deliverables

- Session-aware handshake
- Ordering, duplicate and timeout controls

### Implementation sequence

1. Wait for web readiness before bootstrap and state restoration.
2. Tag traffic with the current session generation.
3. Drop late replies from a replaced WebView.
4. Bound outstanding requests and define timeout/cancel behavior.
5. Deduplicate durable commands using command IDs.
6. Test reordered, duplicated and delayed messages.

### Acceptance criteria

- **P03-T02-A1** — Commands from stale sessions never mutate the active layout or preferences.
  - Accepted evidence: unit_test, integration_test.
- **P03-T02-A2** — Timeouts and duplicate messages produce the documented outcomes without unbounded queues.
  - Accepted evidence: unit_test.

### Verification

- Inject handshake delays, reply reorder and host replacement.
- Assert the maximum pending-request count under sustained artificial traffic.

### Failure cases and cautions

- Blind retries can apply an edit twice.

### Handoff requirement

Record tested implementation SHA, changed scope, acceptance evidence, commands/results, unrun checks, blockers and the next exact task. Use [the handoff template](../../templates/HANDOFF.md). Update state through the project CLI, regenerate views, and push the metadata checkpoint.

## P03-T03 — Deliver viewport and hinge data without coupling simulation

Dependencies: P03-T02, P01-T01

Manual gate: none; planning estimate: 1–3 focused sessions; planning estimate, not a delivery promise. Estimates are not deadlines or completion claims.

### Read first

- [docs/architecture/DUO_PLATFORM.md](../../docs/architecture/DUO_PLATFORM.md)
- [docs/architecture/BRIDGE_PROTOCOL.md](../../docs/architecture/BRIDGE_PROTOCOL.md)
- [docs/product/INTERACTION_DESIGN.md](../../docs/product/INTERACTION_DESIGN.md)

### Owned scope

- `apps/ios/TinJunction/Platform/`
- `web/src/bridge/`
- `web/src/input/`

### Deliverables

- Coalesced viewport contract
- Logical-point and reserved-region fixtures

### Implementation sequence

1. Obtain content bounds and reserved regions from native geometry.
2. Serialize logical units and explicitly named angle units.
3. Coalesce high-frequency changes to the newest pending sample.
4. Apply geometry before hit-testing and drawing the next frame.
5. Keep hinge effect values out of track topology and clock state.
6. Exercise split-view, rotated and inner/outer transition fixtures.

### Acceptance criteria

- **P03-T03-A1** — Viewport changes preserve correct picking coordinates and occlusion-safe controls across tested geometries.
  - Accepted evidence: unit_test, integration_test.
- **P03-T03-A2** — Rapid hinge updates remain bounded and cannot advance, pause or reset simulation accidentally.
  - Accepted evidence: unit_test.

### Verification

- Run geometry conversion round-trip fixtures.
- Replay rapid posture/resize samples and verify queue bounds.

### Failure cases and cautions

- Raw hinge angle is not an authoritative layout API.

### Handoff requirement

Record tested implementation SHA, changed scope, acceptance evidence, commands/results, unrun checks, blockers and the next exact task. Use [the handoff template](../../templates/HANDOFF.md). Update state through the project CLI, regenerate views, and push the metadata checkpoint.

## P03-T04 — Implement durable command and snapshot transfer

Dependencies: P03-T02

Manual gate: none; planning estimate: 1–3 focused sessions; planning estimate, not a delivery promise. Estimates are not deadlines or completion claims.

### Read first

- [docs/architecture/BRIDGE_PROTOCOL.md](../../docs/architecture/BRIDGE_PROTOCOL.md)
- [docs/architecture/PERSISTENCE_AND_EDITOR.md](../../docs/architecture/PERSISTENCE_AND_EDITOR.md)
- [docs/architecture/SYSTEM_ARCHITECTURE.md](../../docs/architecture/SYSTEM_ARCHITECTURE.md)

### Owned scope

- `web/src/bridge/`
- `apps/ios/TinJunction/Bridge/`

### Deliverables

- Acknowledged snapshot transport
- Explicit persistence failure propagation

### Implementation sequence

1. Define snapshot revision and expected previous revision.
2. Transfer only validated serializable model data, never Three.js objects.
3. Bound snapshot size and reject unsupported document versions.
4. Return native persistence acknowledgments only after durable success.
5. Surface failures to the editor without discarding unsaved state.
6. Exercise interrupted transfer, retries and stale revisions.

### Acceptance criteria

- **P03-T04-A1** — An acknowledgment identifies the committed document revision and is never emitted before successful storage.
  - Accepted evidence: unit_test, integration_test.
- **P03-T04-A2** — Malformed, oversized and stale snapshots leave the previously committed document intact.
  - Accepted evidence: unit_test.

### Verification

- Use an injected persistence stub to simulate disk full and interrupted writes.
- Verify retries cannot overwrite a newer saved revision.

### Failure cases and cautions

- Treating receipt as durability can lose user work.

### Handoff requirement

Record tested implementation SHA, changed scope, acceptance evidence, commands/results, unrun checks, blockers and the next exact task. Use [the handoff template](../../templates/HANDOFF.md). Update state through the project CLI, regenerate views, and push the metadata checkpoint.

## P03-T05 — Add bridge diagnostics and security regression coverage

Dependencies: P03-T03, P03-T04

Manual gate: none; planning estimate: 1–3 focused sessions; planning estimate, not a delivery promise. Estimates are not deadlines or completion claims.

### Read first

- [docs/architecture/BRIDGE_PROTOCOL.md](../../docs/architecture/BRIDGE_PROTOCOL.md)
- [docs/quality/TEST_STRATEGY.md](../../docs/quality/TEST_STRATEGY.md)
- [docs/quality/RELEASE_GATES.md](../../docs/quality/RELEASE_GATES.md)

### Owned scope

- `tests/fixtures/bridge/`
- `apps/ios/TinJunctionTests/`
- `web/src/diagnostics/`

### Deliverables

- Local bounded bridge diagnostics
- Adversarial protocol regression suite

### Implementation sequence

1. Record counts and error categories without storing sensitive layout contents.
2. Rate-limit repeated malformed input diagnostics.
3. Fuzz schema boundaries, long strings and deeply nested data.
4. Verify navigation cannot introduce another sender origin.
5. Exercise repeated pause/resume during active requests.
6. Document recovery steps and known platform limitations.

### Acceptance criteria

- **P03-T05-A1** — Adversarial fixtures complete within bounded time/memory and preserve application state.
  - Accepted evidence: unit_test, integration_test.
- **P03-T05-A2** — Diagnostics explain failures without leaking secrets or growing indefinitely.
  - Accepted evidence: unit_test.

### Verification

- Run bounded fuzz fixtures under both decoders.
- Review a deliberately corrupted bridge session from captured logs.

### Failure cases and cautions

- Debug logging can become an accidental data store.

### Handoff requirement

Record tested implementation SHA, changed scope, acceptance evidence, commands/results, unrun checks, blockers and the next exact task. Use [the handoff template](../../templates/HANDOFF.md). Update state through the project CLI, regenerate views, and push the metadata checkpoint.
