# Native recurrence investigation and preserved implementation work

Current published `8efb6d4edc68058a5c809ab80118105f1a805d60` has **failed native CI** and successful repository/web CI. See [the recurrence record](../../evidence/INC-NATIVE-RECURRENCE-20261027.md), which preserves exact failures, identities, reviewed originals and the bounded next experiment. The earlier accepted [workbench checkpoint](2026-10-27-verified-workbench.md) is historical, not the current run's result.

The coordinator opened `INC-NATIVE-RECURRENCE-20261027` and recorded CI as failed through the project CLI. All 87 units passed; asset readiness, ordinary handshake and save-test termination failed. Five UI cases passed. Installed and clean-install checks did not run. There is no known single cause: app, tests, workflow and packaged inputs are identical to the preceding passing implementation.

Recovered original target/runner logs distinguish a before-handshake asset timeout from an after-handshake restore timeout and show a 56.981-second interval between the runner sending the save-test termination request and Xcode logging its receipt. Root independently verified both decompressed byte streams, all 108 startup lines and all 16 excerpt ranges. This narrows the diagnosis without proving one cause or a fix. See the linked incident's recovered-log section.

## Immediate action

Publish only the bounded native startup-diagnostic change and this incident record, keeping the uncommitted feature work out of its indexed snapshot. Observe the full original native suite at the resulting SHA and inspect its fresh trace attachments, original failures and public lifecycle observations. Do not extend deadlines, retry into a pass, rename concurrency groups, weaken assertions or describe instrumentation as a repair. Record the actual result and retain the incident until its exit criteria are supported.

The diagnostic is Debug-only and explicitly enabled by the shared UI lifetime helper. It reads a maximum of 128 native events on demand and attaches them before termination and teardown. Its 14-point row affects the instrumented viewport; no ordinary or Release UI claim follows from it. No local Swift compiler is available; actual Xcode compilation remains required.

## Preserved current work

One coordinator owns main, state, handoffs, shared build integration and publication. Existing claimed work remains in progress with disjoint scopes and is not accepted:

- **P01-T03 / submission-native:** manifest-bound asynchronous resource reads, descriptor-relative no-follow validation, bounded JSON preflight and scheduler/cancellation tests. These are unpublished and have not yet compiled on Xcode.
- **P02-T03 / submission-coordinator:** native versioned preferences, accessible Settings, system/user reduced effects, independent native media/haptic gating and actual UI probes. The web worker implemented audio-resume cancellation, typed preference acceptance, live effects/camera updates and status backing. Five focused web unit files pass 38 cases. The first browser run passed 10 of 12; two test-setup failures are retained, corrected fixtures and two additional regression cases await the shared ordinary-bundle rebuild. Native VoiceOver, largest text, persistence and policy tests remain unexecuted.
- **P10-T03 / submission-assets:** pinned Meshopt/KTX2 fixtures and an isolated paired material probe. The private browser harness observed a genuine embedded-texture CSP loading failure. Fixed external texture names are approved to preserve `connect-src`; the only proposed separate diagnostic document exception is `wasm-unsafe-eval`. Shared build, exact native entry policy, native report validation and packaged runtime proof remain unfinished.

Workers preserve source freezes and failure artifacts. Root must review and integrate this work only after prioritizing the native incident. No task can be completed against the old source hashes. Continue independently useful analysis and bounded local checks without representing them as native acceptance.

The procedural fixed-oval workbench still needs general editing, production 3D assets and material/lighting review. Physical Duo evidence, exclusive distribution eligibility, rights/name clearance, final art approval, signing and submission authorization remain external gates.
