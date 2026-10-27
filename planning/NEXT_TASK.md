# Next task

> Generated from roadmap.json and state.json. Run `npm run project:next` for a live lease check.

Action: **resume**

Resume the claimed task with its current owner; do not duplicate its work.

CI snapshot: **running**. Always check GitHub Actions for the current remote main commit.

## P01-T01 — Compile public Duo capabilities and inventory the CI device

Phase: [planning/phases/P01-platform-and-runtime-spikes.md](phases/P01-platform-and-runtime-spikes.md)

Dependencies: P00-T04

Manual gate: none

### Required reading

- [docs/architecture/DUO_PLATFORM.md](../docs/architecture/DUO_PLATFORM.md)
- [docs/operations/IOS_CI.md](../docs/operations/IOS_CI.md)
- [docs/architecture/BRIDGE_PROTOCOL.md](../docs/architecture/BRIDGE_PROTOCOL.md)

### First actions

1. Recheck official Apple API documentation and record retrieval dates.
2. Compile the minimal hinge observer using the selected supported SDK.
3. Enumerate real available simulator runtimes and dynamically select a Duo UDID.
4. Exercise launch and rotation without hardcoded screen dimensions.
5. Capture nil-hinge and geometry observations separately from physical-device evidence.
6. Document any unavailable CLI posture controls as gaps, not invented flags.

### Acceptance

- **P01-T01-A1**: A recorded Xcode build compiles the public hinge adapter and identifies the selected SDK and actual Duo simulator. (integration_test)
- **P01-T01-A2**: The evidence distinguishes supported API signatures from unverified physical-device and store assumptions. (source_verification)

## Blocked work

- P01-T04: No supported Duo-only purchase/install eligibility mechanism verified in current Apple public sources. Preserve exclusivity; obtain Apple Developer Support guidance and verify actual eligibility. See docs/research/DUO_DISTRIBUTION_2026-10-27.md.
