# ADR-0006 — First operating workbench

Status: accepted for development. Owner instruction: start implementation and deliver a large coherent milestone.

## Context

The repository has a working native/WebGL shell and a comprehensive production roadmap, but no operating railway. The complete track graph, authoring kit, production artwork and hardware acceptance require multiple later phases. A bounded operating workbench provides useful integration evidence while those requirements remain intact.

## Decision

Add P04-T06 as a development integration task after the verified repository foundation. Build a deterministic analytic oval, one steam locomotive with two wagons, procedural original scenery/case, operating controls, bounded scenery transactions, day/dusk/night lighting, camera views and versioned native checkpoints. The separate P04 kernel tasks retain their own acceptance evidence.

The workbench is an internal development slice of the intended Swift/Three.js app. It is not an additional shipping platform. Its fixed oval format deliberately cannot represent the full future track-piece graph. A future schema migration must retain these layouts before the general editor replaces it. Browser storage is a development fallback; native Application Support remains the app's durable authority.

Parallel scope is explicit: model worker owns `web/src/model/`; renderer worker owns `web/src/scene/`; native worker owns `apps/ios/`; coordinator owns integration, bridge, browser tests, planning and publication. Only the coordinator commits and updates shared state.

## Acceptance boundary

The workbench must build, operate, edit, undo/redo and save/reopen through the actual packaged native host. Tests must demonstrate rejection of malformed/stale saves and recovery from a damaged primary generation. Web runtime screenshots document procedural art; they do not approve final hyperrealism or hardware performance.

No original roadmap dependency, owner gate, device gate or release restriction is removed. P05/P06/P07 and the later content phases remain unaccepted until their complete requirements, including branching routes, production contracts and applicable physical evidence, are met. This task cannot authorize publishing, signing, distribution-policy changes or external purchases.

## Alternatives and consequences

Building the entire general track editor before an operating scene would postpone native integration feedback. Replacing the roadmap with a prototype checklist would hide the remaining product work. The chosen slice keeps both: concrete playable behavior now and explicit future acceptance gates.

The first-loop JSON format is intentionally small and strictly validated in Swift and TypeScript. All procedural visual assets are original code with no remote runtime dependencies. Native session IDs, checkpoint ordering, acknowledgments after storage, and visible recovery failures are required even for this slice.

## Validation and reversal

Record actual test commands, implementation SHAs, runtime captures and GitHub Actions runs in the handoff/evidence. If the slice undermines a production invariant, repair or restrict that behavior before extending it. Replace this decision only with a new recorded decision; do not relabel prototype evidence as production acceptance.
