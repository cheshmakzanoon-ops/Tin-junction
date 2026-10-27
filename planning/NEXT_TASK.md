# Next task

> Generated from roadmap.json and state.json. Run `npm run project:next` for a live lease check.

Action: **resume**

Resume the claimed task with its current owner; do not duplicate its work.

CI snapshot: **running**. Always check GitHub Actions for the current remote main commit.

## P01-T02 — Prove bundled asset loading inside the actual WKWebView origin

Phase: [planning/phases/P01-platform-and-runtime-spikes.md](phases/P01-platform-and-runtime-spikes.md)

Dependencies: P01-T01

Manual gate: none

### Required reading

- [docs/architecture/BRIDGE_PROTOCOL.md](../docs/architecture/BRIDGE_PROTOCOL.md)
- [docs/graphics/ASSET_PIPELINE.md](../docs/graphics/ASSET_PIPELINE.md)
- [docs/operations/IOS_CI.md](../docs/operations/IOS_CI.md)

### First actions

1. Create original minimal fixture assets with recorded hashes.
2. Load the classic script bundle and create WebGL2 inside the packaged host.
3. Load a GLB and texture through the production origin, not the desktop preview server.
4. Probe KTX2/WASM and worker paths under the intended content security policy.
5. Exercise offline launch, cache clearing and repeat loading.
6. Record the selected transport approach and unresolved origin limitations in an ADR.

### Acceptance

- **P01-T02-A1**: Bundled code and fixture GLB/texture content render in the packaged native app with networking disabled. (integration_test)
- **P01-T02-A2**: Decoder, worker and audio probes report observed success or explicit blockers; unsupported loaders are not silently enabled. (integration_test)

## Blocked work

- P01-T04: No supported Duo-only purchase/install eligibility mechanism verified in current Apple public sources. Preserve exclusivity; obtain Apple Developer Support guidance and verify actual eligibility. See docs/research/DUO_DISTRIBUTION_2026-10-27.md.
