# Tin Junction

A highly realistic miniature model railway in a folding case, designed exclusively for **iPhone Duo**. Swift/SwiftUI owns the native application; bundled TypeScript/Three.js owns the railway, editor and rendering inside WKWebView. The browser version is an internal diagnostic harness, not a second shipping product.

**Current maturity:** a playable first operating workbench. Drive an original miniature locomotive and two wagons, arrange six kinds of scenery with undo/redo, choose daylight/evening/night, name your layout, and save/reopen it through the native host. The walnut case, station, rails, scenery and train are procedural development artwork. The general track editor, turnouts, final art, physical-device performance and release approval remain ahead.

Read the [implemented workbench contract](docs/architecture/FIRST_WORKBENCH.md) for exact behavior, data format, controls and current limits. Actual verification and the latest implementation SHA are recorded in the [handoff](planning/HANDOFF.md).

## Continue this project

Start at **[START_HERE.md](START_HERE.md)** and follow **[AGENTS.md](AGENTS.md)**. No previous conversation is required.

```sh
npm ci
npm run project:validate
npm run project:status
npm run project:next
```

The authoritative roadmap contains **31 phases, 131 tasks and 262 acceptance criteria**, including the explicitly bounded first operating workbench. Original production gates remain in place. Task dependencies, claims, blockers, evidence and handoffs determine what the next agent should do.

| Question | Authoritative entry |
|---|---|
| What is the current state? | [Project status](planning/STATUS.md), [state ledger](planning/state.json) |
| What should I do next? | [Next task](planning/NEXT_TASK.md), or `npm run project:next` |
| What did the last agent leave? | [Current handoff](planning/HANDOFF.md) |
| What must the product do? | [Product specification](docs/product/PRODUCT_SPEC.md), [interaction design](docs/product/INTERACTION_DESIGN.md) |
| How do native and web parts fit? | [System architecture](docs/architecture/SYSTEM_ARCHITECTURE.md), [bridge protocol](docs/architecture/BRIDGE_PROTOCOL.md) |
| How do trains and track work? | [Simulation and tracks](docs/architecture/SIMULATION_AND_TRACKS.md), [persistence and editor](docs/architecture/PERSISTENCE_AND_EDITOR.md) |
| How will it look physically real? | [Art direction](docs/graphics/ART_DIRECTION.md), [rendering specification](docs/graphics/RENDERING_SPEC.md), [asset pipeline](docs/graphics/ASSET_PIPELINE.md) |
| How is quality demonstrated? | [Test strategy](docs/quality/TEST_STRATEGY.md), [visual acceptance](docs/graphics/VISUAL_ACCEPTANCE.md), [release gates](docs/quality/RELEASE_GATES.md) |
| How do agents resume and hand over? | [Continuation protocol](docs/agents/CONTINUATION_PROTOCOL.md), [handoff protocol](docs/agents/HANDOFF_PROTOCOL.md), [evidence rules](docs/agents/TASK_EVIDENCE.md) |
| Where is every phase defined? | [Machine-readable roadmap](planning/roadmap.json); linked phase pages in [status](planning/STATUS.md) |
| How does native CI work? | [Duo platform contract](docs/architecture/DUO_PLATFORM.md), [iOS CI runbook](docs/operations/IOS_CI.md) |

## Product boundaries

Operate miniature trains, arrange track, place scenery, save layouts and enjoy the physical details. This is an open-ended railway toy: **no puzzles, missions, economy, accounts, ads, subscriptions or pay-to-progress**. The proposed commercial model is a $1.99 one-time purchase; currency and final pricing remain owner decisions.

The initial visual target is a coherent premium miniature railway, not a full-size railway photographed from far away. Weather and additional content require explicit scoped decisions. Scale, frame budgets, asset limits and delivery estimates are proposals until validated.

## Engineering checks

```sh
npm run check          # planning, TypeScript, unit tests and reproducible web bundle
npm run bundle:ios     # generate local WebAssets for the Swift host
npm run test:browser   # install Playwright Chromium first if absent
npm run dev           # playable internal workbench; not a separate shipping platform
```

GitHub Actions runs repository/web checks and unsigned native tests on the specified Xcode/iPhone Duo Simulator toolchain. See the [Actions page](https://github.com/cheshmakzanoon-ops/Tin-junction/actions). Inspect the actual run for the current SHA; workflow files alone are not evidence of success. Real Duo hardware is required for fold ergonomics, haptics, thermals, sustained performance and final visual approval.

## Important unresolved release gates

- **Duo-only distribution:** no supported App Store hardware-exclusivity mechanism has yet been verified. Preserve the exclusive scope, do not invent capability keys, and keep commercial release blocked until the owner approves a documented route.
- **Name and rights:** Tin Junction is a provisional working title. Trademark, App Store name availability, asset rights and licenses need explicit review.
- **Artwork:** the [asset catalog](assets/catalog.json) records original procedural prototypes and their source hashes. None is presented as approved production art; see [provenance](assets/PROCEDURAL_PROTOTYPES.md).
- **Publishing:** ordinary workflows never sign, upload to TestFlight or publish. A manual [read-only release preflight](release/README.md) checks the exact candidate, live CI and an externally supplied owner decision. Release still requires the separate owner gates in the [release runbook](docs/operations/RELEASE_RUNBOOK.md).

See [contributing](CONTRIBUTING.md), [security](SECURITY.md), [risks](docs/operations/RISK_REGISTER.md) and [primary sources](docs/research/SOURCES.md). Repository publication is not an open-source license grant; no project license has been selected by the owner.
