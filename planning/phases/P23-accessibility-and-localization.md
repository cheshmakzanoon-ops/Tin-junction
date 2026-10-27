# P23 — Accessibility, onboarding and text readiness

> Generated from planning/roadmap.json. Edit the JSON definition, then run `npm run project:render`.

## Outcome

Make the creative toy understandable and usable without relying solely on color, gestures or small canvas text.

## Exit gate

Essential actions have accessible paths, concise help and externally managed text with verified layouts.

The phase is not accepted merely because these instructions or its source files exist. Each task requires the stated evidence. Current progress lives in [the ledger](../state.json).

## P23-T01 — Audit essential controls and native accessibility

Dependencies: P21-T04, P20-T03

Manual gate: none; planning estimate: 1–3 focused sessions; planning estimate, not a delivery promise. Estimates are not deadlines or completion claims.

### Read first

- [docs/product/INTERACTION_DESIGN.md](../../docs/product/INTERACTION_DESIGN.md)
- [docs/quality/TEST_STRATEGY.md](../../docs/quality/TEST_STRATEGY.md)
- [docs/quality/RELEASE_GATES.md](../../docs/quality/RELEASE_GATES.md)

### Owned scope

- `apps/ios/TinJunction/Accessibility/`
- `apps/ios/TinJunction/Controls/`

### Deliverables

- Essential-action accessibility map
- VoiceOver/focus regression coverage

### Implementation sequence

1. Map create, operate, stop, undo, save and recover actions.
2. Provide semantic native alternatives for critical canvas actions.
3. Define focus order across changing posture layouts.
4. Use stateful labels and non-color status cues.
5. Test VoiceOver with errors and loading states.

### Acceptance criteria

- **P23-T01-A1** — All essential actions are reachable and understandable through documented accessible controls.
  - Accepted evidence: integration_test.
- **P23-T01-A2** — Posture and document changes do not strand focus on removed controls.
  - Accepted evidence: integration_test.

### Verification

- Execute essential workflows using VoiceOver.
- Check focus after dialogs, errors and layout transitions.

### Failure cases and cautions

- A visible button without a correct accessible state is not accessible.

### Handoff requirement

Record tested implementation SHA, changed scope, acceptance evidence, commands/results, unrun checks, blockers and the next exact task. Use [the handoff template](../../templates/HANDOFF.md). Update state through the project CLI, regenerate views, and push the metadata checkpoint.

## P23-T02 — Validate large text, contrast and reduced effects

Dependencies: P23-T01, P16-T03

Manual gate: none; planning estimate: 1–3 focused sessions; planning estimate, not a delivery promise. Estimates are not deadlines or completion claims.

### Read first

- [docs/product/INTERACTION_DESIGN.md](../../docs/product/INTERACTION_DESIGN.md)
- [docs/graphics/VISUAL_ACCEPTANCE.md](../../docs/graphics/VISUAL_ACCEPTANCE.md)
- [docs/quality/TEST_STRATEGY.md](../../docs/quality/TEST_STRATEGY.md)

### Owned scope

- `apps/ios/TinJunction/`
- `web/src/presentation/`

### Deliverables

- Adaptive text/contrast review
- Reduced-motion/effects behavior

### Implementation sequence

1. Apply semantic text styles and scalable layout constraints.
2. Check contrast on day/night backgrounds.
3. Avoid color-only validity and signal communication.
4. Honor reduce-motion and lower-effect preferences.
5. Keep stop/undo/save visible at supported text sizes.

### Acceptance criteria

- **P23-T02-A1** — Essential native controls remain readable and operable at the supported maximum text sizes.
  - Accepted evidence: integration_test, visual_review.
- **P23-T02-A2** — Reduced-effects settings eliminate nonessential motion without changing simulation or editor correctness.
  - Accepted evidence: unit_test, integration_test.

### Verification

- Capture all major panels in largest text and night mode.
- Compare reduced-motion transitions with normal behavior.

### Failure cases and cautions

- Accessibility settings must not become a hidden low-quality mode for core clarity.

### Handoff requirement

Record tested implementation SHA, changed scope, acceptance evidence, commands/results, unrun checks, blockers and the next exact task. Use [the handoff template](../../templates/HANDOFF.md). Update state through the project CLI, regenerate views, and push the metadata checkpoint.

## P23-T03 — Externalize text and define localization scope

Dependencies: P23-T02

Manual gate: none; planning estimate: 1–3 focused sessions; planning estimate, not a delivery promise. Estimates are not deadlines or completion claims.

### Read first

- [docs/product/PRODUCT_SPEC.md](../../docs/product/PRODUCT_SPEC.md)
- [docs/product/INTERACTION_DESIGN.md](../../docs/product/INTERACTION_DESIGN.md)
- [docs/operations/RELEASE_RUNBOOK.md](../../docs/operations/RELEASE_RUNBOOK.md)

### Owned scope

- `apps/ios/TinJunction/Resources/`
- `web/src/localization/`

### Deliverables

- Shared terminology glossary
- Localization-ready string catalogs

### Implementation sequence

1. Move user-facing strings out of rendering logic.
2. Define terminology for track, turnout, consist and recovery.
3. Use locale-aware numbers and units where appropriate.
4. Run pseudolocalization and long-text layout tests.
5. Record owner-approved launch languages without claiming unperformed translations.

### Acceptance criteria

- **P23-T03-A1** — User-facing text is externalized with stable keys and no untranslated hardcoded release paths.
  - Accepted evidence: repository_validation, unit_test.
- **P23-T03-A2** — Pseudolocalized and long-string layouts preserve essential actions without clipping.
  - Accepted evidence: integration_test, visual_review.

### Verification

- Scan release source for user-visible hardcoded strings.
- Test bidirectional layout fixtures if those languages are in approved scope.

### Failure cases and cautions

- String extraction is not proof of translation quality.

### Handoff requirement

Record tested implementation SHA, changed scope, acceptance evidence, commands/results, unrun checks, blockers and the next exact task. Use [the handoff template](../../templates/HANDOFF.md). Update state through the project CLI, regenerate views, and push the metadata checkpoint.

## P23-T04 — Run beginner usability and contextual-help acceptance

Dependencies: P23-T03, P09-T05

Manual gate: none; planning estimate: 1–3 focused sessions; planning estimate, not a delivery promise. Estimates are not deadlines or completion claims.

### Read first

- [docs/product/INTERACTION_DESIGN.md](../../docs/product/INTERACTION_DESIGN.md)
- [docs/product/PRODUCT_SPEC.md](../../docs/product/PRODUCT_SPEC.md)
- [docs/quality/TEST_STRATEGY.md](../../docs/quality/TEST_STRATEGY.md)

### Owned scope

- `apps/ios/TinJunction/Help/`
- `evidence/`

### Deliverables

- Minimal optional onboarding/help
- Observed usability findings

### Implementation sequence

1. Teach opening, operating and editing through concise optional guidance.
2. Avoid mandatory missions or progression systems.
3. Observe first-time users creating and saving a small layout.
4. Record task failures and actual confusion rather than inferred satisfaction.
5. Revise wording and interactions and repeat failed tasks.

### Acceptance criteria

- **P23-T04-A1** — Observed users can operate, edit, undo and recover using the provided guidance.
  - Accepted evidence: integration_test.
- **P23-T04-A2** — Onboarding can be skipped and revisited without locking creative features.
  - Accepted evidence: integration_test.

### Verification

- Run the same beginner task script before and after fixes.
- Document participant count and limitations without claiming broad demand proof.

### Failure cases and cautions

- A tutorial should not change the sandbox into a task-based game.

### Handoff requirement

Record tested implementation SHA, changed scope, acceptance evidence, commands/results, unrun checks, blockers and the next exact task. Use [the handoff template](../../templates/HANDOFF.md). Update state through the project CLI, regenerate views, and push the metadata checkpoint.
