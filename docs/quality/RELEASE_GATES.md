# Release gates — evidence before distribution

Status: PROPOSED gate definitions. Every gate starts unfulfilled until the task ledger references real evidence. The existence of this checklist does not constitute approval.

## 1. Gate semantics

A gate is either unmet, blocked, satisfied for a named build/scope, or superseded by an owner-approved decision. Avoid ambiguous labels such as “mostly done.” A gate's evidence becomes stale when its relevant source/assets/configuration change.

The gate reviewer records:

- Gate ID, exact build/commit and source/asset digest.
- Acceptance evidence and limitations.
- Relevant known defects and disposition.
- Reviewer identity/role and decision reference.
- Scope of approval: engineering harness, internal alpha, external beta, release candidate or public release.

An engineering agent can gather evidence, fix defects and recommend a decision. It cannot impersonate the owner, trademark adviser, human art reviewer, tester or Apple App Review.

## 2. Gate overview

| Gate | Subject | Earliest milestone blocked when unmet |
|---|---|---|
| RG-01 | Product and scope integrity | All implementation acceptance |
| RG-02 | Reproducible repository/toolchain | Shared development checkpoints |
| RG-03 | Packaged runtime/bridge | Functional vertical slice |
| RG-04 | Correct railway operation | Functional vertical slice |
| RG-05 | Durable user data/editor | User-data alpha |
| RG-06 | Original licensed content | Any external distribution |
| RG-07 | Reference-quality visuals | Art-complete milestone |
| RG-08 | Physical Duo integration | External beta |
| RG-09 | Real-device performance/reliability | External beta/release |
| RG-10 | Accessibility/usability | External beta/release |
| RG-11 | Duo-only distribution eligibility | Public release |
| RG-12 | Brand/legal/privacy/store material | Store submission |
| RG-13 | Signed build and supply chain | TestFlight/release upload |
| RG-14 | Release candidate evidence freeze | Submission recommendation |
| RG-15 | Explicit owner publication approval | Any public release action |

Scope-specific internal testing may continue while a commercial/legal gate is blocked, provided the work does not falsely claim that gate is satisfied.

## RG-01 — Product and scope integrity

Acceptance:

- The product remains an offline creative model-railway toy with no puzzles, economy, ads, accounts or subscriptions.
- Commercial scope remains exclusively iPhone Duo unless the owner explicitly changes it.
- Swift/native ownership and Three.js rendering ownership remain documented and coherent.
- Version 1 launch features and optional polish are separated.
- No implementation uses a temporary diagnostic scene as proof of finished miniature art.

Evidence: current product/architecture ADRs, feature-to-task map, review of runtime behavior and marketing claims. Any scope change needs a decision reference and affected-document/task updates.

## RG-02 — Reproducible repository and toolchain

Acceptance:

- Fresh checkout on a documented environment installs from committed lockfiles.
- Required Node/TypeScript/project tests and package-build checks pass.
- Native toolchain selection is explicit and an inventory artifact identifies actual SDK/runtime.
- Generated dashboards/phases agree with roadmap/state.
- Current remote main and local intended state agree; no uncommitted required work remains.
- Dependency licenses and pinned versions are reviewable.

Evidence: real workflow runs or equivalent exact local results tied to the tested SHA; no guessed workflow URLs. A planning-only green job is not app completion.

## RG-03 — Packaged runtime and bridge

Acceptance:

- Bundled web assets execute within the real WKWebView origin without a CDN or remote script.
- Representative GLB, textures, compressed assets/decoders and audio work under the intended CSP.
- Native and web boundaries reject malformed, oversized, stale and unauthorized messages.
- Navigation/resource policy rejects external hosts, traversal and unapproved schemes.
- Lifecycle shutdown and WebView process recovery are bounded and visible.
- Protocol mismatch produces a recoverable native error rather than a blank scene.

Evidence: Swift tests, shared fixture tests, packaged integration/XCUITest results, resource load logs and a runtime capture. A Vite/browser result alone cannot satisfy this gate.

## RG-04 — Correct railway operation

Acceptance:

- Fixed-tick operation independent of render cadence.
- Valid track gauge, certified curve radii and continuous connectors.
- Smooth acceleration, stopping and stop-before-reverse.
- Entire consist follows latched turnout choices.
- Occupancy includes rear vehicles and overhang; occupied turnouts cannot change.
- Buffers, missing connections and stop signals prevent unsafe graph traversal.
- Route history and constraint solving remain bounded over a long run.
- Wheel phase, bogie/chassis geometry and couplers agree with travel through curves.

Evidence: deterministic fixtures/property tests, long-run diagnostic report and close-up motion recordings. Test primitives can establish algorithm correctness but not final visual contact quality.

## RG-05 — Durable user data and editor

Acceptance:

- All structural edits are validated atomic transactions.
- Invalid operations leave the original state unchanged.
- Undo/redo invariants pass randomized and fixed regressions.
- Native durable acknowledgment controls the Saved indicator.
- Generation/index writes and backup recovery pass failure injection.
- Background/process termination does not silently overwrite or discard acknowledged layouts.
- Future-version and malformed imports are rejected without mutation.
- Migrations preserve original data and have versioned fixtures.
- Delete/restore/export actions have truthful safety behavior.

Evidence: storage injection suite, packaged process-loss tests, migration fixture report, user-visible recovery captures and an export/restore drill. No external beta involving personal user layouts before this gate passes.

## RG-06 — Original and licensed content

Acceptance:

- Every shipped mesh, texture, font, icon, HDR environment, audio clip and reference-derived asset has provenance and permitted-use evidence.
- Third-party code notices and licenses are included as required.
- No copied commercial locomotive logos, branded railway identities, ripped game assets or unapproved voice/music content.
- Source assets and runtime outputs have reproducible identifiers/hashes.
- Generated/commissioned assets have documented rights and human review; generation does not itself prove legal clearance.

Evidence: approved asset manifest, license/rights records and shipped-content audit. A visually modified unauthorized asset is still unauthorized.

## RG-07 — Visual quality

Acceptance:

- One coherent miniature scale and material language.
- All launch content final; temporary primitives and debug overlays removed from consumer mode.
- Reference-matched whole-layout and macro captures pass the graphics rubric.
- Moving camera/trains reveal no severe shimmer, LOD pop, floating wheels, clipping couplers, disconnected rails or light leaks.
- Day/night presets are both usable; optional weather meets the same standard if shipped.
- Editing remains sharp/readable; visual effects do not hide interaction failures.
- Captures are generated at the approved actual-device quality tier, not an offline-only “ultra” setting.

Evidence: actual running-app still/video set, asset/scene/quality hashes and a named human visual review. A unit test or generated marketing concept image cannot satisfy this gate.

## RG-08 — Physical iPhone Duo integration

Acceptance:

- Actual native hinge observations and platform layout regions are used for their intended separate purposes.
- Fully open, partially open, outer-display, rotation and resize behavior are reviewed on physical hardware.
- Folding during drive/edit/save cannot corrupt topology, lose acknowledged edits or leave a gesture stuck.
- No hardcoded fake model identifier, capability key, crease width or screen resolution is required.
- Native controls remain reachable outside reserved/occluded regions.
- Audio/haptic behavior and interruption handling are tested on device.

Evidence must identify a physical iPhone Duo with `device.is_simulator: false`, OS/build, test procedure and recordings/logs. Synthetic pose injection and simulator Device Hub are useful supplementary evidence, not substitutes.

## RG-09 — Performance and reliability

Acceptance:

- Provisional rendering budgets have been ratified or consciously revised from hardware evidence.
- Representative steady-state and stress scenes meet approved frame-time targets.
- Quality adaptation is predictable and does not alter simulation correctness.
- Sustained soak does not produce unacceptable thermal degradation, crashes or unbounded memory growth.
- Repeated load/edit/reset and foreground/background cycles clean up resources.
- Startup/recovery has a bounded timeout and a clear native failure path.
- No unresolved S0/S1 defect; S2 exceptions require explicit approved scope/risk treatment.

Evidence: release-configuration device report, frame-time distributions, resource/thermal observations and failure/lifecycle logs. Simulator FPS and browser heap alone cannot establish this gate.

## RG-10 — Accessibility and usability

Acceptance:

- Essential operations reachable through native accessible controls.
- Tested large text, VoiceOver, reduced motion and color-independent status.
- Users can start/stop, edit, undo, save and understand recovery without staff completing the task for them.
- Supported postures do not create unreasonable reach or precision demands.
- No critical usability finding remains disguised as an aesthetic preference.

Evidence: accessibility audit and observed-session notes for the exact build, with consent/privacy respected. A passing label scanner alone is insufficient.

## RG-11 — Duo-only commercial distribution

This gate is **BLOCKED pending supported Apple distribution verification** at repository setup.

Acceptance:

- The owner has a documented supported route that prevents unintended non-Duo purchases/installation as required, or explicitly approves a changed commercial scope.
- App Store availability, compatibility metadata and review notes accurately reflect the route.
- The exact release archive uses only genuine supported requirements.
- No arbitrary `UIRequiredDeviceCapabilities` key or unrelated requirement is used to trick filtering.
- A runtime “unsupported device” screen is not treated as proof of pre-purchase eligibility enforcement.

Evidence: current official Apple documentation or recorded developer-support guidance plus an owner decision reference. A generic iPhone device-family setting is not sufficient.

Relevant official starting points:

- [Apple required device capabilities](https://developer.apple.com/support/required-device-capabilities/)
- [UIRequiredDeviceCapabilities](https://developer.apple.com/documentation/BundleResources/Information-Property-List/UIRequiredDeviceCapabilities)
- [Apple iPhone Duo developer hub](https://developer.apple.com/iphone-duo/)

If no supported route exists, stop public-release work and ask the owner. Continue independent engineering only when useful; do not quietly release to the entire iPhone family.

## RG-12 — Brand, privacy and store materials

Acceptance:

- “Tin Junction” or its approved replacement has owner-reviewed name/trademark checks in the intended markets.
- App Store Connect accepts the intended name/localization; this is distinct from trademark clearance.
- Price/currency/territories, age rating, support/contact and privacy disclosures are approved.
- Privacy manifest and declarations reflect actual shipped APIs/dependencies/data flows.
- Product description, screenshots and previews depict the actual approved build/features.
- No misleading claim of guaranteed performance, unlimited content, verified revenue or Apple endorsement.
- App Review notes explain native functionality and Duo-specific behavior accurately.

Evidence: owner decision references, actual store metadata draft, rights/privacy audit and matching runtime captures. The repository owner—not an autonomous agent—approves legal/business representations.

## RG-13 — Signed build and supply chain

Acceptance:

- Correct owner-approved bundle ID/team, version and build number.
- Valid signing assets are stored through approved secret mechanisms and never committed or printed.
- Build uses reviewed locked dependencies and approved asset manifests.
- Signing/release environment has explicit approval controls.
- Archive/export validation succeeds for the exact intended configuration.
- Release product excludes privileged test injection, developer-only navigation and unapproved networking.
- Symbol/debug artifacts are retained securely according to policy.

Evidence: actual archive/export logs, build fingerprint and approved workflow configuration. A simulator unsigned build is not a signed-release artifact.

## RG-14 — Release candidate freeze

Acceptance:

- Name a candidate commit and immutable build fingerprint.
- Required CI, native integration, hardware and visual evidence correspond to that candidate or provably unchanged source scopes.
- All release features and content are complete; omitted optional work is reflected in marketing.
- Restore/export drill and clean-install/update test pass.
- Known issues and recovery/support process are reviewed.
- Changes after freeze either create a new candidate or have explicit scoped revalidation.

Evidence: release-candidate manifest linking every gate and test. Do not attach successful results from an earlier unrelated build.

## RG-15 — Owner approval and publication

Acceptance:

- Owner explicitly authorizes the specific TestFlight upload, store submission and/or public release action being taken.
- Approval references build, version, scope, price/territories and intended release timing.
- An agent performs only the approved action and records Apple's actual response.
- Pending review is reported as pending; rejection is reported with exact issues; approval is not invented.
- No unattended workflow publishes automatically merely because a tag or main push occurred.

Evidence: owner decision reference and actual submission/release outcome. This gate cannot be auto-completed by an agent checklist.

## 3. Gate exceptions and changes

A scope change can remove an optional feature from a release; it cannot remove the need for truthful evidence about remaining functionality. Security, data integrity, legal rights and authorized publication are not cosmetic waivers.

For an exception record: rationale, affected users, risk, compensating control, expiry/revisit trigger, owner approval and changed marketing/test scope. Preserve the original gate and superseding decision for future agents.

Related: [test strategy](TEST_STRATEGY.md), [release runbook](../operations/RELEASE_RUNBOOK.md), [task evidence](../agents/TASK_EVIDENCE.md).
