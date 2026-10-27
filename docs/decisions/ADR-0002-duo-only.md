# ADR-0002 — Duo-only means product intent and a release gate

Status: accepted scope; App Store enforcement mechanism unresolved.

## Context and decision

The owner's latest instruction is exclusive iPhone Duo support. Earlier exploratory suggestions about supporting ordinary iPhones are superseded. Do not expand the consumer audience without explicit owner approval.

Apple's Duo developer hub and public hinge/layout APIs are documented. The setup does not establish an approved App Store mechanism to restrict purchases specifically to Duo. Setting iPhone device family, an OS deployment target, detecting a hinge at runtime, or advertising “Duo only” are not equivalent to store-enforced eligibility.

## Consequences

- All design, interaction, native integration and hardware acceptance target Duo.
- Internal desktop/web harnesses and generic non-Duo tests are engineering fixtures only.
- Do not invent `UIRequiredDeviceCapabilities` values such as `iphone-duo`, `hinge` or `foldable`.
- Do not add unrelated hardware requirements as an exclusion trick.
- Do not assume a post-purchase rejection screen satisfies the requirement.
- Public release remains gated on a documented distribution route or a new owner-approved scope decision.

## Required resolution

Record current Apple documentation or a relevant Apple Developer Support response, verify the actual App Store Connect compatibility controls, document affected purchasers and review implications, and obtain owner approval. No agent can self-approve a scope change. Independent simulation, asset and editor tasks may continue while this release gate is blocked.
