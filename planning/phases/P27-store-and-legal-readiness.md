# P27 — Store, name, privacy and eligibility readiness

> Generated from planning/roadmap.json. Edit the JSON definition, then run `npm run project:render`.

## Outcome

Prepare an accurate storefront and legally reviewed brand without treating preliminary searches as clearance.

## Exit gate

The owner approves naming, distribution eligibility, pricing, privacy and truthful store materials.

The phase is not accepted merely because these instructions or its source files exist. Each task requires the stated evidence. Current progress lives in [the ledger](../state.json).

## P27-T01 — Clear the final name and third-party rights

Dependencies: P25-T01

Manual gate: owner; planning estimate: 1–3 focused sessions; planning estimate, not a delivery promise. Estimates are not deadlines or completion claims.

### Read first

- [docs/operations/RELEASE_RUNBOOK.md](../../docs/operations/RELEASE_RUNBOOK.md)
- [docs/quality/RELEASE_GATES.md](../../docs/quality/RELEASE_GATES.md)
- [docs/graphics/ASSET_PIPELINE.md](../../docs/graphics/ASSET_PIPELINE.md)

### Owned scope

- `docs/product/PRODUCT_SPEC.md`
- `THIRD_PARTY_NOTICES.md`
- `evidence/`

### Deliverables

- Owner-approved brand decision
- Trademark/rights and attribution record

### Implementation sequence

1. Recheck Tin Junction and confusingly similar relevant names.
2. Distinguish App Store availability from legal trademark clearance.
3. Review the historical Tin Plate Junction finding with appropriate expertise.
4. Verify all shipped asset/package licenses and required notices.
5. Record the owner's final name/rights decision before irreversible branding spend.

### Acceptance criteria

- **P27-T01-A1** — The owner approves the final brand based on documented checks and any needed professional clearance.
  - Accepted evidence: owner_approval.
- **P27-T01-A2** — All shipped third-party notices and asset rights match the actual release inventory.
  - Accepted evidence: repository_validation.

### Verification

- Compare bundle assets/dependencies with the rights register.
- Confirm the selected name in the authorized App Store record.

### Failure cases and cautions

- A web search with no exact match is not a trademark guarantee.

### Handoff requirement

Record tested implementation SHA, changed scope, acceptance evidence, commands/results, unrun checks, blockers and the next exact task. Use [the handoff template](../../templates/HANDOFF.md). Update state through the project CLI, regenerate views, and push the metadata checkpoint.

## P27-T02 — Prepare privacy, support and age-rating declarations

Dependencies: P24-T03, P27-T01

Manual gate: owner; planning estimate: 1–3 focused sessions; planning estimate, not a delivery promise. Estimates are not deadlines or completion claims.

### Read first

- [docs/operations/RELEASE_RUNBOOK.md](../../docs/operations/RELEASE_RUNBOOK.md)
- [docs/quality/RELEASE_GATES.md](../../docs/quality/RELEASE_GATES.md)
- [docs/product/PRODUCT_SPEC.md](../../docs/product/PRODUCT_SPEC.md)

### Owned scope

- `docs/release/`
- `apps/ios/TinJunction/Resources/`

### Deliverables

- Accurate privacy/support text
- Age-rating and permission checklist

### Implementation sequence

1. Inventory actual data collection and third-party behavior.
2. Describe local documents and sharing accurately.
3. Verify support/contact destinations supplied or approved by the owner.
4. Complete age-rating answers from implemented content.
5. Review privacy manifests and required-reason APIs against compiled code.

### Acceptance criteria

- **P27-T02-A1** — Privacy and age-rating declarations match the actual shipped behavior and dependencies.
  - Accepted evidence: repository_validation, owner_approval.
- **P27-T02-A2** — Support and privacy destinations are approved, reachable and do not expose personal credentials.
  - Accepted evidence: owner_approval.

### Verification

- Audit runtime network behavior and bundled SDK inventory.
- Open every approved support/privacy URL and inspect intended content.

### Failure cases and cautions

- An offline design does not justify inaccurate privacy answers about included SDKs.

### Handoff requirement

Record tested implementation SHA, changed scope, acceptance evidence, commands/results, unrun checks, blockers and the next exact task. Use [the handoff template](../../templates/HANDOFF.md). Update state through the project CLI, regenerate views, and push the metadata checkpoint.

## P27-T03 — Approve device eligibility, one-time price and metadata

Dependencies: P01-T04, P27-T02, P26-T04

Manual gate: owner; planning estimate: 1–3 focused sessions; planning estimate, not a delivery promise. Estimates are not deadlines or completion claims.

### Read first

- [docs/operations/RELEASE_RUNBOOK.md](../../docs/operations/RELEASE_RUNBOOK.md)
- [docs/quality/RELEASE_GATES.md](../../docs/quality/RELEASE_GATES.md)
- [docs/product/PRODUCT_SPEC.md](../../docs/product/PRODUCT_SPEC.md)
- [docs/architecture/DUO_PLATFORM.md](../../docs/architecture/DUO_PLATFORM.md)

### Owned scope

- `docs/release/`
- `evidence/`

### Deliverables

- Approved storefront configuration
- Final scope/price/currency decision

### Implementation sequence

1. Apply the documented owner-approved Duo distribution route.
2. Confirm supported regions and device eligibility before sales.
3. Treat $1.99 USD as a provisional proposal, not authorization to change prices.
4. Draft accurate title, subtitle and description without ranking/revenue claims.
5. Obtain explicit owner approval for price, currencies, territories and metadata.

### Acceptance criteria

- **P27-T03-A1** — The owner approves the exact price/currency/territory configuration and documented device eligibility.
  - Accepted evidence: owner_approval.
- **P27-T03-A2** — Metadata advertises only implemented supported functionality and contains no false exclusivity claim.
  - Accepted evidence: repository_validation, owner_approval.

### Verification

- Inspect storefront eligibility and price configuration through authorized access.
- Cross-check every feature claim against the release feature matrix.

### Failure cases and cautions

- An in-app rejection screen does not prevent unsupported customers from purchasing.

### Handoff requirement

Record tested implementation SHA, changed scope, acceptance evidence, commands/results, unrun checks, blockers and the next exact task. Use [the handoff template](../../templates/HANDOFF.md). Update state through the project CLI, regenerate views, and push the metadata checkpoint.

## P27-T04 — Prepare genuine screenshots, previews and reviewer notes

Dependencies: P27-T03, P25-T02

Manual gate: none; planning estimate: 1–3 focused sessions; planning estimate, not a delivery promise. Estimates are not deadlines or completion claims.

### Read first

- [docs/operations/RELEASE_RUNBOOK.md](../../docs/operations/RELEASE_RUNBOOK.md)
- [docs/graphics/VISUAL_ACCEPTANCE.md](../../docs/graphics/VISUAL_ACCEPTANCE.md)
- [docs/quality/RELEASE_GATES.md](../../docs/quality/RELEASE_GATES.md)

### Owned scope

- `docs/release/`
- `evidence/`

### Deliverables

- Actual-build store asset manifest
- Complete review instructions

### Implementation sequence

1. Capture store screenshots from the release-intended app.
2. Use current Apple asset specifications without invented dimensions.
3. Disclose the offline toy, folding behavior and any review setup needs.
4. Provide reviewer access instructions without secret leakage.
5. Verify screenshots and videos contain only shipping content.

### Acceptance criteria

- **P27-T04-A1** — Store assets are traceable to actual running app content and satisfy current official format requirements.
  - Accepted evidence: repository_validation, visual_review.
- **P27-T04-A2** — Reviewer notes accurately explain tested device requirements and feature behavior.
  - Accepted evidence: repository_validation.

### Verification

- Validate asset dimensions/encoding against current Apple documentation.
- Have an unfamiliar reviewer follow the instructions from a clean install.

### Failure cases and cautions

- Concept renders must not be presented as in-app screenshots.

### Handoff requirement

Record tested implementation SHA, changed scope, acceptance evidence, commands/results, unrun checks, blockers and the next exact task. Use [the handoff template](../../templates/HANDOFF.md). Update state through the project CLI, regenerate views, and push the metadata checkpoint.
