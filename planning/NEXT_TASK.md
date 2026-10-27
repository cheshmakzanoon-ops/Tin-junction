# Next task

> Generated from roadmap.json and state.json. Run `npm run project:next` for a live lease check.

Action: **resume**

Resume the claimed task with its current owner; do not duplicate its work.

CI snapshot: **passed**. Always check GitHub Actions for the current remote main commit.

## P01-T03 — Verify the custom-origin security boundary

Phase: [planning/phases/P01-platform-and-runtime-spikes.md](phases/P01-platform-and-runtime-spikes.md)

Dependencies: P01-T02

Manual gate: none

### Required reading

- [docs/architecture/BRIDGE_PROTOCOL.md](../docs/architecture/BRIDGE_PROTOCOL.md)
- [docs/quality/TEST_STRATEGY.md](../docs/quality/TEST_STRATEGY.md)

### First actions

1. Define allowed host, scheme, resource root and MIME mappings.
2. Reject dot segments, encoded traversal, unexpected hosts and unsupported methods.
3. Cancel outstanding scheme tasks without calling stopped callbacks.
4. Block remote navigation and arbitrary file access.
5. Fuzz malformed bridge and resource requests within bounded limits.
6. Document evidence that no private WebKit security overrides are used.

### Acceptance

- **P01-T03-A1**: Traversal, unsupported origins, unknown resources and oversized messages fail safely without leaking files. (unit_test / integration_test)
- **P01-T03-A2**: Cancellation and repeated process teardown complete without crashes or callbacks into invalid tasks. (integration_test)

## Blocked work

- P01-T04: No supported Duo-only purchase/install eligibility mechanism verified in current Apple public sources. Preserve exclusivity; obtain Apple Developer Support guidance and verify actual eligibility. See docs/research/DUO_DISTRIBUTION_2026-10-27.md.
