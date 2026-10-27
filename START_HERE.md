# Continue Tin Junction

This is the entry point for a new agent given only the repository URL and **“continue this project.”** The repository, not previous chat history, owns the project context.

## 1. Understand the product

Tin Junction is a premium, offline, highly realistic miniature model railway in a folding case, **exclusively designed for iPhone Duo**. The native application is Swift/SwiftUI; the railway renderer, simulation and editor are TypeScript/Three.js inside a bundled WKWebView. A browser harness is an internal engineering tool, not another shipping platform.

It is an open-ended physical toy. People operate trains, arrange tracks, place scenery, save their own miniature worlds and enjoy the details. There are no puzzles, missions, economy, currencies, mandatory accounts, advertising, subscriptions or pay-to-progress mechanics.

The proposed price is a $1.99 one-time purchase. The owner must confirm currency, final price, name clearance and commercial terms before release. “Tin Junction” is a working title, not a certified trademark clearance.

## 2. Find the actual state

Read these in order:

1. [Agent operating contract](AGENTS.md)
2. [Generated project status](planning/STATUS.md)
3. [Current handoff](planning/HANDOFF.md)
4. [Next task](planning/NEXT_TASK.md)
5. The selected phase and its required-reading links.

Then inspect the repository and remote checks:

```sh
git status --short --branch
git log -8 --oneline
git fetch origin main
git merge --ff-only origin/main
npm ci
npm run project:validate
npm run project:status
npm run project:next
```

Only fast-forward when the worktree is clean. If changes or divergence exist, use the [recovery playbook](docs/agents/RECOVERY_PLAYBOOK.md); never reset someone else's work. Inspect GitHub Actions for the current `origin/main` SHA. A failed required check takes priority over a new feature. The local health ledger is a snapshot, not a substitute for GitHub.

## 3. Work one bounded task

```sh
node tools/project.mjs claim P01-T01 --owner your-agent-name --hours 4
# Read the selected task and specifications; implement and verify its scope.
npm run check
npm run bundle:ios
npm run test:browser
```

`P01-T01` is an example, not a permanently hardcoded next task. Always use the ID returned by `project:next`. For native changes, use the [iOS CI guide](docs/operations/IOS_CI.md) and the actual Duo Simulator workflow. For physical appearance, sound, fold behavior and sustained speed, collect physical-device evidence as specified by the task.

Follow [the continuation protocol](docs/agents/CONTINUATION_PROTOCOL.md). Record tests that were **not** run and why. If blocked, record the exact obstacle and move only to an independent ready task.

## 4. Finish so another agent can continue

1. Commit/push the tested implementation to `main`.
2. Observe the corresponding CI result; capture exact links, commits and failures.
3. Create a compact evidence manifest using [the template](templates/EVIDENCE.json) and a chronological handoff using [the template](templates/HANDOFF.md).
4. Submit or complete the task with the CLI, which validates dependencies and evidence.
5. Update `planning/HANDOFF.md`, regenerate planning views, validate, then commit/push the metadata checkpoint.

```sh
node tools/project.mjs submit P01-T01 --evidence evidence/your-record.json --handoff planning/handoffs/your-session.md
# When all acceptance criteria and any owner/device gates are actually met:
node tools/project.mjs complete P01-T01 --evidence evidence/your-record.json --handoff planning/handoffs/your-session.md
npm run project:render
npm run project:validate
```

Repeated `--evidence` flags attach multiple evidence types. A planning check passing does not mean the game, artwork, native integration or device performance is complete.

## 5. Know the non-negotiable gates

- Public Apple Duo APIs and Xcode 27.1 are documented; their exact packaged behavior must still be compiled and tested in this repository.
- A supported mechanism to enforce Duo-only App Store distribution is **not yet verified**. Preserve the exclusive product scope and keep public release blocked until the owner approves a documented route. Do not invent Info.plist keys or quietly broaden support.
- A generic iPhone Simulator or desktop Chromium result is not Duo hardware evidence.
- Hyperrealism requires reference-matched, in-app captures and explicit visual review. It cannot be established by checking a “PBR enabled” box.
- No signing, uploading to TestFlight, purchases, paid infrastructure, external messages or public release without the appropriate owner authorization and credentials.

## Map

| Area | Start here |
|---|---|
| Product and scope | [Product specification](docs/product/PRODUCT_SPEC.md) |
| Architecture | [System architecture](docs/architecture/SYSTEM_ARCHITECTURE.md) |
| Swift / Duo / Simulator | [Duo platform](docs/architecture/DUO_PLATFORM.md), [iOS CI](docs/operations/IOS_CI.md) |
| Simulation and editor | [Tracks and trains](docs/architecture/SIMULATION_AND_TRACKS.md), [Persistence/editor](docs/architecture/PERSISTENCE_AND_EDITOR.md) |
| Graphics | [Art direction](docs/graphics/ART_DIRECTION.md), [Rendering](docs/graphics/RENDERING_SPEC.md) |
| Assets | [Asset pipeline](docs/graphics/ASSET_PIPELINE.md), [Catalog](assets/catalog.json) |
| Testing | [Test strategy](docs/quality/TEST_STRATEGY.md), [Release gates](docs/quality/RELEASE_GATES.md) |
| What happens next | [Generated next task](planning/NEXT_TASK.md) |
| Why a choice was made | [Architecture decisions](docs/decisions/README.md) |
| Sources and known risks | [Source register](docs/research/SOURCES.md), [Risk register](docs/operations/RISK_REGISTER.md) |
