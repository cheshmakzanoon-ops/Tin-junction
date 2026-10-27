# Release and maintenance runbook

Status: PROPOSED operational procedure. Initial repository setup must not upload, submit, publish, purchase services or configure pricing. Those are separate owner-authorized actions.

## 1. Authority and non-negotiable stops

An engineering agent may prepare code, tests, metadata drafts and evidence. It must obtain explicit owner approval for external beta distribution, signing/account changes, App Store submission, pricing/territory changes and public release.

Stop release preparation when any of these is unresolved:

- Duo-only distribution eligibility has no supported, owner-approved route.
- Name/trademark or shipped-content rights remain unresolved.
- Required CI is red or evidence describes a different candidate.
- User layouts can be corrupted/lost on a supported path.
- Physical-device visual/performance/posture evidence is missing.
- Secrets, signing materials or personal test data appear in repository/artifacts.
- A protected workflow or permission check denies the operation.

Do not work around a stop by renaming a failing check, adding an unrelated capability, submitting a generic iPhone build or moving credentials into source.

## 2. Milestone definitions

| Milestone | Intended audience | Allowed claim |
|---|---|---|
| Engineering harness | Developers only | Bootstrapping/diagnostic infrastructure |
| Functional vertical slice | Internal development | One operating/saveable railway path works to specified tests |
| Internal alpha | Owner/authorized testers | Core features usable, known limitations explicit |
| External beta | Explicitly approved testers | Real-device gates passed; feedback requested |
| Release candidate | Owner/reviewers | Frozen candidate with complete evidence bundle |
| Submitted | Apple review | Actual submission accepted for review; no approval claim |
| Released | Approved public audience | Exact released version and supported scope |

The project ledger tracks feature/task completion independently of these milestone labels.

## 3. Release identity

Before preparing a signed candidate, record:

- Owner-approved marketing name and subtitle.
- Owner-approved bundle identifier and Apple developer team.
- Marketing version and monotonically increasing build number.
- Git implementation SHA and clean-worktree status.
- Node/package lock, Xcode/SDK, renderer and asset catalog versions.
- Asset manifest/content digest and web bundle digest.
- Document schema version and supported migration range.
- Feature/content scope and excluded optional items.
- Required device/OS eligibility evidence.

Do not infer team ID or legal seller identity from a GitHub username. A placeholder development bundle ID must be replaced through a deliberate identity decision, not silently carried into a public product.

## 4. Freeze procedure

1. Inspect remote `main`, required workflow outcomes and latest handoff.
2. Resolve or explicitly classify every open release blocker.
3. Select a candidate SHA. Tagging/release creation is a separate authorized repository action; do not fabricate a tag before it exists.
4. Build from a clean checkout with lockfiles and explicit toolchain selection.
5. Produce a machine-readable fingerprint of source, web output and assets.
6. Execute the release regression matrix from [test strategy](../quality/TEST_STRATEGY.md).
7. Assemble a release-candidate evidence manifest linking all [release gates](../quality/RELEASE_GATES.md).
8. Freeze functional changes. Any later change creates a new candidate or requires a documented scoped revalidation decision.

Do not cherry-pick unreviewed “small fixes” into a signed candidate without rebuilding its evidence.

## 5. Signing and secrets

The initial CI builds unsigned simulator artifacts. Production signing is deliberately not automatic.

When the owner authorizes signing setup:

- Use configured GitHub environment/repository secrets or an approved managed signing process.
- Limit tokens/keys to required operations and use the shortest practical lifetime.
- Use a protected release environment with required human reviewers where available.
- Avoid exposing secrets to fork/pull-request code or untrusted workflow input.
- Use an isolated temporary keychain when the selected signing workflow requires one; clean only the specifically created resource.
- Never print certificate material, private keys, provisioning profile content, authentication headers or full environment dumps.
- Record secret *names/purposes* in documentation, never values.
- Review workflow dependency pins and permissions before enabling credentials.

The exact signing/export workflow must be implemented against the current official Apple/GitHub guidance and tested. A guessed `ExportOptions.plist`, team ID or entitlement is not acceptable.

## 6. TestFlight preparation

Prerequisites: owner authorization, valid signed candidate, physical Duo test evidence, data safety, content rights and truthful beta scope.

Procedure:

1. Confirm the intended build fingerprint and approved tester audience.
2. Validate archive/export through the supported Xcode toolchain.
3. Upload only the authorized build using configured credentials.
4. Record actual upload/processing result and any Apple warnings.
5. Complete required beta metadata/review steps accurately.
6. Invite only approved recipients through the authorized channel; do not scrape or invent tester contacts.
7. Provide specific test tasks: operate, edit, save, fold, recover, inspect visual quality and prolonged use.
8. Record feedback as reproducible issues tied to device/OS/build, with personal data minimized.

Processing, beta review and tester access are distinct states. Report the actual state; do not say “available to testers” while processing is incomplete.

## 7. Store metadata preparation

Draft first; owner approves before writing to App Store Connect.

Required materials:

- Name/subtitle and confirmed localization strategy.
- Accurate description and feature list.
- Price, currency assumptions, countries/regions and release timing.
- Age/content rating answers grounded in shipped content.
- Privacy declarations based on code/dependency audit, not desired marketing language.
- Support and privacy URLs owned/approved by the user.
- Actual-device screenshots and preview footage from the release candidate.
- Review notes explaining core offline/native functionality, Duo posture behavior and distribution eligibility.
- Copyright/content-rights information and required notices.

Do not use generated concept art as an unqualified gameplay screenshot. Do not promise future weather, locomotives, unlimited layouts or guaranteed frame rate unless the release scope and evidence support the claim.

App name acceptance in App Store Connect is not trademark clearance. The historical similar railway retailer name found during ideation remains a review note until the owner resolves brand risk.

## 8. Submission and release

Before the external action, present a concise approval summary to the owner:

```text
Version/build:
Candidate commit and fingerprint:
Scope and supported device/OS:
Price/territories:
Gate evidence:
Known issues:
Requested action: upload / submit / release
```

Perform only the authorized action. Record actual timestamps, build identifiers, review messages and outcome in an operations handoff. A submission attempt that fails validation is not a submission success.

Release workflows must be manual and protected. A main-branch push or automated dependency update must never automatically publish the paid app.

## 9. Handling App Review feedback

1. Preserve the full relevant review message and affected build, excluding unnecessary personal/security data.
2. Identify whether the issue is metadata, compatibility, privacy, functionality, content rights or policy.
3. Reproduce technical issues on the named configuration when possible.
4. Create a task with a specific correction and test.
5. Do not add hidden reviewer-only behavior or misrepresent device eligibility.
6. Draft an evidence-based reply for owner approval.
7. Build/revalidate a new candidate if code or assets changed.
8. Record resubmission authorization and actual status.

If a rejection calls the Duo-only sales route into question, return to that gate. Do not respond by widening distribution without the owner deciding.

## 10. Post-release triage

The initial product has no analytics/backend requirement. Use only approved sources such as owner-provided crash reports, store feedback and explicit tester reports. Do not add tracking to measure success without a new privacy/product decision.

Triage order:

1. Security or user-data loss.
2. Launch/crash/core interaction failures.
3. Save/migration/import failures.
4. Device/OS compatibility and sustained performance.
5. Accessibility failures.
6. Significant visual defects.
7. Minor polish and new content requests.

For each issue record build, OS/device, reproduction, affected saved-data version, severity, workaround and regression-test plan. Redact personal layout contents unless the user deliberately supplies them for diagnosis.

## 11. Hotfix procedure

- Preserve a reproducible failing fixture and identify the earliest affected release.
- Fix the smallest safe scope on main while preserving unrelated work.
- Add a regression test and rerun affected release gates.
- If persistence changes, perform old-version/new-version round-trip and migration tests.
- Produce a new immutable build; never overwrite a previously published artifact.
- Obtain owner approval for expedited submission or availability changes.
- Document what was fixed and what remains, without hiding defects behind generic “performance improvements.”

An App Store binary cannot be assumed to roll back instantly. Plan a corrected build and an owner-approved availability/support response rather than promising an unavailable rollback mechanism.

## 12. Compatibility maintenance

When a new iOS/Xcode/Three.js version is considered:

1. Read primary release notes and migration guides.
2. Keep production pins unchanged until the upgrade branch/workspace or bounded main task is ready; honor main-only policy with coordinated checkpoints.
3. Test web bundle, native SDK, custom-origin loaders and decoder compatibility together.
4. Re-run pose/lifecycle, save migration and reference visuals.
5. Re-measure a representative real-device scene when renderer/driver behavior changes.
6. Update toolchain ADR, lockfile and evidence in one coherent integration.

Do not update all graphics dependencies simultaneously when a single change can be isolated and measured.

## 13. Evidence retention and handoff

Keep compact manifests in the repository. Large `.xcresult`, videos, screenshots and performance traces belong in actual workflow artifacts or an owner-approved durable artifact store. Record expiration/retention and preserve release evidence before it disappears.

Every operational session leaves:

- What was authorized and what was actually done.
- Exact build/commit and relevant URLs/identifiers.
- Success, failure or pending status—not inference.
- Any active review/processing state.
- Next required action and who may authorize it.
- Known risks, retained evidence and follow-up deadlines if explicitly established.

Future agents must be able to distinguish “prepared,” “uploaded,” “submitted,” “approved” and “released” without reconstructing chat history.

## 14. Official reference entry points

Verify current guidance at implementation time:

- [App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [App Store Connect help](https://developer.apple.com/help/app-store-connect/)
- [TestFlight overview](https://developer.apple.com/testflight/)
- [Required device capabilities](https://developer.apple.com/support/required-device-capabilities/)
- [GitHub deployment environments](https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/manage-environments)

References inform the workflow; they are not evidence that the owner's account, agreement, identity, signing or device eligibility is already configured.
