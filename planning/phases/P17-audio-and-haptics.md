# P17 — Miniature sound and native haptics

> Generated from planning/roadmap.json. Edit the JSON definition, then run `npm run project:render`.

## Outcome

Make operation feel like a physical model with original, responsive audio and restrained tactile feedback.

## Exit gate

Sound/haptics follow simulation and lifecycle correctly with documented provenance and accessibility behavior.

The phase is not accepted merely because these instructions or its source files exist. Each task requires the stated evidence. Current progress lives in [the ledger](../state.json).

## P17-T01 — Specify and produce the original sound palette

Dependencies: P06-T04, P10-T01

Manual gate: none; planning estimate: 1–3 focused sessions; planning estimate, not a delivery promise. Estimates are not deadlines or completion claims.

### Read first

- [docs/graphics/ART_DIRECTION.md](../../docs/graphics/ART_DIRECTION.md)
- [docs/product/PRODUCT_SPEC.md](../../docs/product/PRODUCT_SPEC.md)
- [docs/graphics/ASSET_PIPELINE.md](../../docs/graphics/ASSET_PIPELINE.md)

### Owned scope

- `assets/audio/`
- `assets/catalog.json`

### Deliverables

- Licensed/original sound inventory
- Loop and event sound specifications

### Implementation sequence

1. Define motor/chuff, wheel-joint, switch, whistle and ambience layers.
2. Record or synthesize original source material with provenance.
3. Edit clean loop boundaries and sensible levels.
4. Separate continuous layers from one-shot events.
5. Document samples, synthesis parameters and compression choices.

### Acceptance criteria

- **P17-T01-A1** — Every shipped sound has valid provenance and no audible loop discontinuity.
  - Accepted evidence: repository_validation, visual_review.
- **P17-T01-A2** — The palette fits a miniature mechanical object rather than exaggerated full-scale cinema.
  - Accepted evidence: visual_review.

### Verification

- Audition loops across multiple repeats on headphones and device speaker.
- Inspect peaks and clipping with a fixed gain configuration.

### Failure cases and cautions

- Unlicensed field recordings and copied train sounds cannot ship.

### Handoff requirement

Record tested implementation SHA, changed scope, acceptance evidence, commands/results, unrun checks, blockers and the next exact task. Use [the handoff template](../../templates/HANDOFF.md). Update state through the project CLI, regenerate views, and push the metadata checkpoint.

## P17-T02 — Implement simulation-driven spatial audio

Dependencies: P17-T01, P03-T02

Manual gate: none; planning estimate: 1–3 focused sessions; planning estimate, not a delivery promise. Estimates are not deadlines or completion claims.

### Read first

- [docs/architecture/SIMULATION_AND_TRACKS.md](../../docs/architecture/SIMULATION_AND_TRACKS.md)
- [docs/architecture/SYSTEM_ARCHITECTURE.md](../../docs/architecture/SYSTEM_ARCHITECTURE.md)
- [docs/graphics/PERFORMANCE_BUDGETS.md](../../docs/graphics/PERFORMANCE_BUDGETS.md)

### Owned scope

- `web/src/audio/`
- `apps/ios/TinJunction/Audio/`

### Deliverables

- Audio ownership ADR
- Speed/distance-responsive mixer

### Implementation sequence

1. Choose one authoritative mixer path and document native/web responsibilities.
2. Drive rhythm and pitch from simulated motion.
3. Use camera/listener distance with restrained spatial effects.
4. Rate-limit wheel-joint and switch events.
5. Resume audio only after permitted user interaction/lifecycle conditions.

### Acceptance criteria

- **P17-T02-A1** — Audio timing follows train motion across speed changes without duplicate events or drift.
  - Accepted evidence: unit_test, integration_test.
- **P17-T02-A2** — The chosen packaged audio path handles initialization restrictions without silent failure.
  - Accepted evidence: integration_test.

### Verification

- Compare event timestamps with fixed-tick replay.
- Run first-launch audio activation and interrupted-start tests.

### Failure cases and cautions

- Two independent mixers can double-play events.

### Handoff requirement

Record tested implementation SHA, changed scope, acceptance evidence, commands/results, unrun checks, blockers and the next exact task. Use [the handoff template](../../templates/HANDOFF.md). Update state through the project CLI, regenerate views, and push the metadata checkpoint.

## P17-T03 — Implement audio-session interruption and haptic behavior

Dependencies: P17-T02, P02-T03

Manual gate: none; planning estimate: 1–3 focused sessions; planning estimate, not a delivery promise. Estimates are not deadlines or completion claims.

### Read first

- [docs/architecture/DUO_PLATFORM.md](../../docs/architecture/DUO_PLATFORM.md)
- [docs/product/INTERACTION_DESIGN.md](../../docs/product/INTERACTION_DESIGN.md)
- [docs/quality/TEST_STRATEGY.md](../../docs/quality/TEST_STRATEGY.md)

### Owned scope

- `apps/ios/TinJunction/Audio/`
- `apps/ios/TinJunction/Haptics/`

### Deliverables

- Native interruption policy
- Bounded tactile event vocabulary

### Implementation sequence

1. Handle mute, volume and other audio consistently.
2. Pause/resume through interruptions and background transitions.
3. Map switch and control detents to subtle haptics.
4. Respect disabled haptics and accessibility preferences.
5. Avoid continuous vibration tied to every rail joint.

### Acceptance criteria

- **P17-T03-A1** — Interruptions and relaunch do not leave silent-stuck, duplicate or background-running audio.
  - Accepted evidence: integration_test.
- **P17-T03-A2** — Haptic preferences and unsupported capability paths work without affecting control behavior.
  - Accepted evidence: unit_test, integration_test.

### Verification

- Exercise interruption, route change and mute preference cases.
- Verify event rate limits during rapid control movement.

### Failure cases and cautions

- Simulator tests cannot establish tactile quality.

### Handoff requirement

Record tested implementation SHA, changed scope, acceptance evidence, commands/results, unrun checks, blockers and the next exact task. Use [the handoff template](../../templates/HANDOFF.md). Update state through the project CLI, regenerate views, and push the metadata checkpoint.

## P17-T04 — Review sound and haptics on physical Duo

Dependencies: P17-T03

Manual gate: device; planning estimate: 1–3 focused sessions; planning estimate, not a delivery promise. Estimates are not deadlines or completion claims.

### Read first

- [docs/quality/TEST_STRATEGY.md](../../docs/quality/TEST_STRATEGY.md)
- [docs/graphics/ART_DIRECTION.md](../../docs/graphics/ART_DIRECTION.md)
- [docs/quality/RELEASE_GATES.md](../../docs/quality/RELEASE_GATES.md)

### Owned scope

- `evidence/`

### Deliverables

- Device audio/haptic review
- Resolved comfort and clipping findings

### Implementation sequence

1. Listen on actual speaker and headphones.
2. Evaluate tactile cues in intended folded/open postures.
3. Inspect motor rhythm, whistle levels and environment balance.
4. Test long-session comfort and reduced-feedback settings.
5. Record device/OS/build and subjective limitations.

### Acceptance criteria

- **P17-T04-A1** — Physical-device review approves audio balance, loop quality and restrained haptic comfort.
  - Accepted evidence: device_test.
- **P17-T04-A2** — Mute, interruption and accessibility behavior pass the real-device checklist.
  - Accepted evidence: device_test.

### Verification

- Run the documented sound/haptic acceptance script.
- Record remaining issues with reproducible event sequences.

### Failure cases and cautions

- Visual inspection cannot verify sound or haptics.

### Handoff requirement

Record tested implementation SHA, changed scope, acceptance evidence, commands/results, unrun checks, blockers and the next exact task. Use [the handoff template](../../templates/HANDOFF.md). Update state through the project CLI, regenerate views, and push the metadata checkpoint.
