# P02 — Swift native application shell

> Generated from planning/roadmap.json. Edit the JSON definition, then run `npm run project:render`.

## Outcome

Turn the initial native harness into an accessible, recoverable application host.

## Exit gate

Native lifecycle, error handling, scene ownership and settings work before production content depends on them.

The phase is not accepted merely because these instructions or its source files exist. Each task requires the stated evidence. Current progress lives in [the ledger](../state.json).

## P02-T01 — Establish application and scene ownership

Dependencies: P01-T01

Manual gate: none; planning estimate: 1–3 focused sessions; planning estimate, not a delivery promise. Estimates are not deadlines or completion claims.

### Read first

- [docs/architecture/SYSTEM_ARCHITECTURE.md](../../docs/architecture/SYSTEM_ARCHITECTURE.md)
- [docs/architecture/DUO_PLATFORM.md](../../docs/architecture/DUO_PLATFORM.md)
- [docs/product/INTERACTION_DESIGN.md](../../docs/product/INTERACTION_DESIGN.md)

### Owned scope

- `apps/ios/TinJunction/App/`
- `apps/ios/TinJunction/Platform/`

### Deliverables

- Explicit app/scene state model
- Native loading and unsupported-context states

### Implementation sequence

1. Define app launch, scene activation, loading, ready, failed and recovering states.
2. Keep one active authoritative layout session; reject accidental concurrent writers.
3. Model transient inner/outer display transitions separately from new documents.
4. Render native progress and recoverable error UI before web readiness.
5. Remove forced orientation and fixed-size assumptions.
6. Add structured local diagnostic events without transmitting analytics.

### Acceptance criteria

- **P02-T01-A1** — Launch, scene recreation and inactive/active transitions produce one valid session and no duplicate engine host.
  - Accepted evidence: unit_test, integration_test.
- **P02-T01-A2** — A failed renderer initialization shows actionable native UI instead of an indefinite blank view.
  - Accepted evidence: integration_test.

### Verification

- Run lifecycle state-machine fixtures and launch UI tests.
- Inject delayed readiness and initialization failure in the packaged app.

### Failure cases and cautions

- Multiple native scenes can silently contend for the same save.

### Handoff requirement

Record tested implementation SHA, changed scope, acceptance evidence, commands/results, unrun checks, blockers and the next exact task. Use [the handoff template](../../templates/HANDOFF.md). Update state through the project CLI, regenerate views, and push the metadata checkpoint.

## P02-T02 — Implement lifecycle cancellation and WebContent recovery

Dependencies: P02-T01, P01-T03

Manual gate: none; planning estimate: 1–3 focused sessions; planning estimate, not a delivery promise. Estimates are not deadlines or completion claims.

### Read first

- [docs/architecture/SYSTEM_ARCHITECTURE.md](../../docs/architecture/SYSTEM_ARCHITECTURE.md)
- [docs/architecture/BRIDGE_PROTOCOL.md](../../docs/architecture/BRIDGE_PROTOCOL.md)
- [docs/architecture/PERSISTENCE_AND_EDITOR.md](../../docs/architecture/PERSISTENCE_AND_EDITOR.md)

### Owned scope

- `apps/ios/TinJunction/App/`
- `apps/ios/TinJunction/Web/`

### Deliverables

- Cancellable startup and teardown
- Bounded WebContent restart policy

### Implementation sequence

1. Cancel pending tasks when the host is replaced or the scene closes.
2. Remove message handlers and observers deterministically.
3. Handle WebContent process termination with a visible recovery state.
4. Retry only a bounded number of times with diagnostics.
5. Restore the most recent durable checkpoint once persistence is available.
6. Test rapid launch/background/foreground sequences and cancellation races.

### Acceptance criteria

- **P02-T02-A1** — Repeated host creation/destruction does not retain handlers, duplicate messages or crash.
  - Accepted evidence: unit_test, integration_test.
- **P02-T02-A2** — Injected content-process termination yields a bounded recovery or explicit error state, never an infinite restart loop.
  - Accepted evidence: integration_test.

### Verification

- Run host lifetime and cancellation race tests.
- Terminate WebContent in the simulator and inspect recovery logs.

### Failure cases and cautions

- Recovered renderer readiness is not proof that unsaved layout edits were durable.

### Handoff requirement

Record tested implementation SHA, changed scope, acceptance evidence, commands/results, unrun checks, blockers and the next exact task. Use [the handoff template](../../templates/HANDOFF.md). Update state through the project CLI, regenerate views, and push the metadata checkpoint.

## P02-T03 — Build native preferences and accessible shell controls

Dependencies: P02-T01

Manual gate: none; planning estimate: 1–3 focused sessions; planning estimate, not a delivery promise. Estimates are not deadlines or completion claims.

### Read first

- [docs/product/INTERACTION_DESIGN.md](../../docs/product/INTERACTION_DESIGN.md)
- [docs/product/PRODUCT_SPEC.md](../../docs/product/PRODUCT_SPEC.md)
- [docs/quality/TEST_STRATEGY.md](../../docs/quality/TEST_STRATEGY.md)

### Owned scope

- `apps/ios/TinJunction/Settings/`
- `apps/ios/TinJunction/Accessibility/`

### Deliverables

- Persistent user preferences
- Accessible settings and help shell

### Implementation sequence

1. Define versioned preferences separately from layout documents.
2. Add sound, haptics, reduced-effects and interaction settings with explicit defaults.
3. Use native semantic controls, labels and Dynamic Type.
4. Make errors and support information reachable without the 3D canvas.
5. Respect system reduce-motion and mute behavior where applicable.
6. Test preference migration and invalid stored values.

### Acceptance criteria

- **P02-T03-A1** — Preferences survive relaunch, reject invalid values and do not corrupt layout state.
  - Accepted evidence: unit_test, integration_test.
- **P02-T03-A2** — Native settings can be navigated with VoiceOver and large text without clipped essential controls.
  - Accepted evidence: integration_test.

### Verification

- Run preferences decode/migration fixtures.
- Capture largest supported text layout and VoiceOver focus order.

### Failure cases and cautions

- Custom decorative controls can conceal essential accessibility semantics.

### Handoff requirement

Record tested implementation SHA, changed scope, acceptance evidence, commands/results, unrun checks, blockers and the next exact task. Use [the handoff template](../../templates/HANDOFF.md). Update state through the project CLI, regenerate views, and push the metadata checkpoint.

## P02-T04 — Harden native app packaging and configuration

Dependencies: P02-T02, P02-T03

Manual gate: none; planning estimate: 1–3 focused sessions; planning estimate, not a delivery promise. Estimates are not deadlines or completion claims.

### Read first

- [docs/operations/IOS_CI.md](../../docs/operations/IOS_CI.md)
- [docs/operations/RELEASE_RUNBOOK.md](../../docs/operations/RELEASE_RUNBOOK.md)
- [docs/quality/RELEASE_GATES.md](../../docs/quality/RELEASE_GATES.md)

### Owned scope

- `apps/ios/project.yml`
- `apps/ios/TinJunction/Resources/`
- `tools/ios/`

### Deliverables

- Reproducible app resources and identifiers
- Explicit entitlements/privacy inventory

### Implementation sequence

1. Document bundle identifiers as project configuration, not secret values.
2. Inventory Info.plist keys and justify each entitlement or permission.
3. Exclude debug tools and test data from release resources.
4. Bundle versioned web assets with a build manifest and hashes.
5. Build a clean unsigned simulator app from generated project files.
6. Validate version/build metadata and diagnostic artifact collection.

### Acceptance criteria

- **P02-T04-A1** — Fresh generation and build package the correct web manifest and no development server or secret material.
  - Accepted evidence: integration_test.
- **P02-T04-A2** — Every shipped permission/entitlement is justified and unnecessary capabilities are absent.
  - Accepted evidence: repository_validation.

### Verification

- Inspect compiled bundle resources and Info.plist.
- Compare two clean builds' normalized resource manifests.

### Failure cases and cautions

- Generated Xcode project drift can obscure the actual build inputs.

### Handoff requirement

Record tested implementation SHA, changed scope, acceptance evidence, commands/results, unrun checks, blockers and the next exact task. Use [the handoff template](../../templates/HANDOFF.md). Update state through the project CLI, regenerate views, and push the metadata checkpoint.
