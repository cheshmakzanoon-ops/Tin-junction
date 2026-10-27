# Tin Junction — agent operating contract

## Mission and boundaries

Build a premium, offline, hyperrealistic **physical miniature railway in a folding case**, exclusively designed for iPhone Duo. Swift owns the native application; TypeScript and Three.js own the interactive 3D world. This is a creative model-railway toy, not a puzzle, tycoon, idle game, or advertising product. No missions, currencies, energy, forced progression, accounts, subscription, analytics, backend, or remotely downloaded executable code in version 1.

The repository is initially an engineering plan and a validation harness, not a finished game. Never represent scaffolding, a simulator result, a synthetic screenshot, an unexecuted workflow, or an unmeasured budget as production evidence.

## Every new session — mandatory order

1. Read `START_HERE.md`, this file, `planning/STATUS.md`, `planning/HANDOFF.md`, and the latest referenced handoff.
2. Inspect `git status --short --branch`, recent commits, and GitHub Actions for the current remote `main` SHA. Preserve other contributors' edits. A failed required check on main takes priority over feature work.
3. Run `npm ci`, `npm run project:validate`, and `npm run project:next`. Do not choose a task from memory or infer completion from a heading or an unchecked roadmap.
4. Read the selected phase and all referenced specifications, decisions, evidence, and blockers. Task dependencies are gates, not suggestions.
5. Claim the task with the documented project command. One coordinator integrates on `main`; concurrent workers must have disjoint write scopes and must not independently edit shared state or push.
6. Implement the smallest coherent task, test it, record evidence, and update the state through the project commands. Commit and push meaningful verified checkpoints to `main`; never force-push. If the remote head changed, inspect and reconcile instead of overwriting it.
7. Finish with a durable handoff: exact current state, changed files, tests and results, known failures, blocker owner, and the next actionable task. Push the handoff too. A chat summary is not the project record.

## Source of truth

- `planning/roadmap.json`: ordered phases, dependency graph, implementation steps and acceptance criteria.
- `planning/state.json`: task status, claims, blockers and evidence links. Only this file stores mutable task progress.
- `planning/STATUS.md` and `planning/NEXT_TASK.md`: generated views; never manually claim progress in them.
- `planning/HANDOFF.md`: current navigation pointer and actionable context; chronological handoffs live in `planning/handoffs/`.
- `docs/architecture/`, `docs/graphics/`, `docs/product/`, `docs/quality/`, `docs/operations/`: specifications.
- `docs/decisions/`: accepted architecture decisions; supersede with a new decision rather than erasing history.
- `evidence/`: compact, factual manifests. Large captures/results belong in GitHub Actions artifacts or a controlled asset store, not ordinary Git.

If code, documents and state disagree, stop and reconcile using observed evidence. Do not mark a task done merely because code or documentation exists. Progress requires the task's specified tests and evidence; device-only criteria require a real iPhone Duo.

## Architecture invariants

- Native: SwiftUI lifecycle and accessible shell, WebKit host, public Duo capability/layout adapter, native persistence and migration, audio/haptics integration, privacy and release packaging.
- Web: bundled, pinned Three.js + TypeScript, deterministic train/track simulation, renderer, editor and validated bridge. No CDN runtime dependencies.
- State: native storage is durable authority; the engine is in-memory simulation authority during a session. Use versioned command/snapshot messages; never send arbitrary evaluated script or one bridge message per mesh/frame.
- Graphics baseline: evidence-gated WebGL2 implementation. WebGPU is a separate measured decision, not an automatic upgrade or a promise of performance.
- Platform facts need official documentation **and** a compile/runtime probe. Do not invent model identifiers, Info.plist capabilities, screen dimensions, hinge signatures or simulator flags.
- Duo-only commercial distribution must be independently verified. `TARGETED_DEVICE_FAMILY = 1` means iPhone, not Duo-only. Never fake exclusivity, block paying unsupported users without a review-approved design, or silently ship on other devices.
- Documentation must distinguish VERIFIED, PROPOSED, IMPLEMENTED, TESTED and BLOCKED. Numbers in the performance budget are provisional until measured on hardware.

## Quality and safety

- Use SI world units, fixed simulation ticks, stable IDs, seeded randomness and explicit serialization versions. Do not couple physics to render FPS.
- Preserve and migrate user layouts. Atomic save, last-known-good recovery, import size limits and untrusted-input validation precede a public beta.
- Reject untrusted WebView navigation, malformed bridge input, path traversal and oversized assets. Never expose a generic filesystem or arbitrary-code bridge.
- No private Apple APIs, copied commercial assets, real railway branding, undocumented entitlements or unlicensed audio. Track provenance for every shipped asset.
- Never commit signing keys, certificates, provisioning profiles, tokens, personal test layouts, DerivedData, node_modules or generated dependency caches.
- No placeholder claims such as “hyperrealistic complete.” Use reference-matched captures and the visual rubric. Do not update golden images just to hide a regression.
- Do not delete tests, weaken assertions, add `continue-on-error`, or silently skip a required job to make CI green.
- Respect protected branches and workflow approval restrictions. Report access blockers; do not bypass them.

## Working conventions

- Main branch only unless the owner explicitly changes the policy. Do not create a fleet of agent branches.
- Read existing code before editing. Prefer `rg`; use `apply_patch` for hand-edited files.
- Commit message: `<area>: <task-id> <verified change>`; for example `engine: P08-T02 validate turnout occupancy`.
- Keep handoffs short enough to scan but exact enough to reproduce. Do not replace specifications with chat links.
- Real-device, legal, art approval, paid services, App Store submission and public release are owner gates. Do not claim them completed on the owner's behalf.
- When a requested task is blocked, record the cause and precise unblock action, then select an independent ready task. If none exists, report the blocker honestly.

## Repository setup session

During initial repository creation, some paths and commands above are being installed. Workers assigned by the coordinating agent may author only their assigned files. They must not change `planning/state.json`, root instructions, lockfiles, or workflows unless explicitly assigned. The coordinator validates and publishes the integrated result.
