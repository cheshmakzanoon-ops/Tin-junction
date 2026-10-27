# iOS Simulator CI, evidence and release runbook

Baseline reviewed **2026-10-26**. This runbook describes the executable scaffold in `.github/workflows/ios-simulator.yml`. A checked-in workflow is not a passed workflow; use the GitHub run for the exact current commit as evidence.

## 1. Toolchain lock and source rationale

| Component | Initial pin | How it is checked |
| --- | --- | --- |
| GitHub hosted runner label | `xcode-27` | Official runner documentation and image manifest; inventory is captured per run |
| Xcode | `/Applications/Xcode_27.1.app/Contents/Developer` | `DEVELOPER_DIR`; exact `xcodebuild -version` assertion |
| iOS Simulator SDK | `27.1` | Exact `xcrun --sdk iphonesimulator --show-sdk-version` assertion |
| Destination | Available **iPhone Duo** on available iOS 27.1 | Resolve the actual Duo type from live `devicetypes`, then match its observed identifier; an editable simulator name is not model evidence |
| XcodeGen | `2.46.0` | Release zip checksum, executable version, version minimum in project spec |
| Node | Root `.node-version` | `actions/setup-node` reads the same pin used by the web build |
| JavaScript dependencies | Root `package-lock.json` | `npm ci`, never an ad hoc install or CDN fetch |
| Xcode project | `apps/ios/project.yml` | Generated during CI after WebAssets exist; never hand-patched derived project |

The reviewed `xcode-27` ARM64 runner manifest lists Xcode 27.1 and the relevant iOS runtime. Hosted image contents can change, and the runner label can be unavailable to a particular account or queue. This workflow deliberately **fails** on missing toolchain/runtime instead of running on another iPhone or silently lowering the deployment target. The moving `macos-latest` label is not the baseline. `macos-26` is not interchangeable with an Xcode 27.1 image.

XcodeGen's `projectFormat: xcode16_3` is its documented project serialization format. The SDK/compiler and deployment target still remain 27.1. Do not invent an unsupported XcodeGen format string to match the SDK version.

## 2. Pinned dependency identities

The action pins match the shared web workflow's verified action commits:

```text
actions/checkout@11d5960a326750d5838078e36cf38b85af677262       # v4
actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020     # v4
actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02 # v4
```

XcodeGen source/asset identity:

```text
Release: 2.46.0
Tag commit: 8445e778451c7e44237b90281bde622d764b0084
Asset: https://github.com/yonaskolb/XcodeGen/releases/download/2.46.0/xcodegen.zip
SHA256: 4d9e34b62172d645eed6457cac13fc222569974098ef4ee9c3368bedf0196806
```

The installer only extracts to `.tools/xcodegen-2.46.0` inside the checkout. It never writes to `/Applications`, installs globally, executes a remote shell installer, or relaxes checksum checking. A changed archive/checksum is a review event, not a reason to replace the hash until the download passes.

When updating a pin: inspect the upstream release/commit, record motivation and security implications, verify the new checksum, run both web and native workflows, preserve inventory evidence, and update this document. Do not bundle dependency churn with an unrelated art or gameplay change.

## 3. What the workflow does, in order

1. Check out the requested commit with persisted Git credentials disabled. The token has only `contents: read`.
2. Install the repository's pinned Node version and restore npm's download cache. No native build cache is trusted as proof of compilation.
3. Capture macOS version, Xcode version, SDK list and complete simulator inventory. Assert the required compiler and Simulator SDK.
4. Run `npm ci` and the simulator-selector tests. Invalid, missing, ambiguous and substituted destinations must fail, including a renamed ordinary iPhone pretending to be Duo. A genuine Duo instance may have a custom name; its observed device-type identity is authoritative.
5. Run `npm run bundle:ios`. This builds the pinned renderer and copies the verified offline runtime allowlist into the native WebAssets folder.
6. Download and verify the pinned XcodeGen archive, then generate `apps/ios/TinJunction.xcodeproj` from `project.yml`.
7. Select the one available Duo device on the required runtime and save the selected UDID/runtime/type identifier to an evidence file. Device identifiers are observations, not source-code constants.
8. Boot only if the device is shut down, then wait for `simctl bootstatus`.
9. Execute the Swift unit and UI targets with `xcodebuild test`, explicit destination, Debug configuration, signing disabled, unique result bundle and pipeline failure propagation.
10. Upload inventory, selection, logs and `.xcresult` bundles even if testing fails. UI-test attachments include screenshots. Missing evidence is not silently ignored.

The job timeout bounds a hung runner to 45 minutes. Explicit `shell: bash` enables GitHub's `-eo pipefail` behavior so a selector failure cannot be hidden by a successful `tee`. Concurrency cancellation prevents obsolete runs on the same ref from consuming the queue after a newer push. A cancelled old run is not a failed current commit; inspect commit associations carefully.

## 4. Check meanings and non-claims

| Check | What success establishes | What it does not establish |
| --- | --- | --- |
| Node selector tests | Selection logic rejects missing/ambiguous/substituted fixtures | Real Apple runtime availability |
| `npm run bundle:ios` | Bundle can be built and copied with the project's offline integrity checks | That WKWebView can execute every future resource type |
| Swift compile | Public APIs used by the scaffold resolve on the selected compiler | Correct physical folding behavior |
| Swift policy/state tests | Exercised envelope, path, symlink, size-policy and recoverable-versus-terminal host states behave as asserted | An exhaustive security audit or packaged GPU recovery proof |
| Bundled-entry unit test | Native app contains the generated entry with the selected script format | Texture/GLB/decoder streaming readiness |
| UI handshake | Real packaged WebKit reports the expected WebGL2 diagnostic readiness | Finished gameplay, hyperrealistic art, or high performance |
| Rotation/foreground UI smoke | Host remains present and reports readiness through those transitions | Fold-system events, saved-world recovery, haptics or audio latency |
| Simulator screenshot | Reproducible simulator appearance for its captured state | A physical-device photograph or reference-matched final-art approval |

The harness sends native viewport/lifecycle values, but the initial tests do not yet assert end-to-end acknowledgements of every event. Add explicit observable protocol evidence before claiming those richer semantics tested. The harness's single content-process reload is not durable game-state recovery.

## 5. Local/agent reproduction

Use the commands in `apps/ios/README.md`. On Windows/Linux, the web build, TypeScript tests, static policy checks, and simulator-selector tests can run locally. Native SwiftUI/WebKit compilation and the iOS Simulator require the selected macOS environment. Do not substitute a Linux Swift compiler result for the Xcode target, and do not claim a GitHub workflow was executed merely because its YAML parses.

The expected build command is:

```bash
xcodebuild test \
  -project apps/ios/TinJunction.xcodeproj \
  -scheme TinJunction \
  -configuration Debug \
  -destination "platform=iOS Simulator,id=$TIN_SIMULATOR_UDID" \
  -destination-timeout 120 \
  -derivedDataPath artifacts/ios/DerivedData \
  -resultBundlePath artifacts/ios/UNIQUE-RUN.xcresult \
  -parallel-testing-enabled NO \
  CODE_SIGNING_ALLOWED=NO
```

`tools/ios/test-simulator.sh` supplies an actual unique result path and records the log. Its variables are task-specific, not `HOME` overrides. Use that script rather than copying the illustrative `UNIQUE-RUN` filename across several runs.

After downloading an Actions artifact, retain the manifest/compact conclusions in `evidence/` and point to the run URL, job URL, tested Git commit, artifact name and any expiry. Do not commit DerivedData, complete app bundles, generated Xcode projects, signing material or large `.xcresult` directories. For long-term release evidence, the owner must preserve large artifacts outside the default 14-day Actions retention window.

## 6. Failure triage

| Symptom | First investigation | Forbidden shortcut |
| --- | --- | --- |
| Job never starts | Runner label/account availability, queue, Actions policy/approval, spending limit | Claiming a skipped job passed, or buying a paid runner without approval |
| Xcode path missing | Current official image manifest and captured inventory | Switch to any compiler present without a reviewed baseline change |
| Duo absent | Inspect `simulator-inventory.json`; confirm matching runtime and image | Run another phone and label evidence Duo |
| API compile failure | Exact public SDK declaration, deployment target, compiler diagnostic | Fake API shims that remove the feature from validation |
| XcodeGen missing resource path | Ensure `bundle:ios` ran first and packaging output directory exists | Create a blank HTML placeholder to satisfy the test |
| Blank canvas / no ready label | Packaged CSP, custom-scheme origin, script MIME, navigation policy, JS error | Universal file access or unrestricted remote navigation |
| Decoder/worker fails | Packaged fetch paths, MIME, worker and WASM behavior on WKWebView | CDN decoder fallback hidden from offline tests |
| Test failure after foreground | Scene lifecycle event ordering, stale native message, actual web process termination | Fixed sleeps until a flaky test happens to pass |
| Artifact missing | Earlier inventory step, output patterns, upload action log | `continue-on-error` or silently omitting the evidence |
| Signing/provisioning prompt | Confirm Simulator destination and `CODE_SIGNING_ALLOWED=NO` | Uploading private credentials to a log or pull-request job |

Do not delete assertions, weaken the destination selector, change visual golden references, or disable an entire test target to make the status green. Diagnose the failure, record it in the current handoff, and select an independent task only if the blocker is explicit.

## 7. Fold verification beyond the automatic smoke test

Apple documents Device Hub's interactive Duo controls. No supported command-line fold operation was established in this setup, so the workflow does not invent a `simctl` fold command.

Manual simulator evidence should include: fully open, a partial pose, closed/outer-display transition, portrait, both landscapes, resized multitasking, and return to the initial state. Record the actual tool version and controls used. Synthetic hinge messages are useful unit/integration fixtures, but must be labeled synthetic and cannot close the system fold-delivery criterion.

Physical-device testing additionally measures sustained frame-time percentiles, memory peaks, energy/thermal behavior, touch/picking precision, native haptics, audio behavior and final-material quality. Collect frame traces and reference-matched images with the exact build SHA. A simulator's host GPU and CPU do not predict the phone's thermal envelope.

## 8. Release and signing separation

This workflow can be triggered by push, pull request, or manual dispatch. Every path is **unsigned Simulator testing only**. There is no App Store upload, automatic archive/export, automatic TestFlight invitation, certificate import, developer-team selection, or price change.

A later signed workflow must be a separate reviewed change, explicitly manual, bound to an owner-approved commit and a protected release environment. Require current green checks, physical-Duo evidence, license/provenance audit, accessibility review, privacy review, save-migration recovery tests, approved metadata, and a verified Duo-only distribution route. Signing secrets must use the configured protected secret store, never source files or command-line printing. Public release remains an owner action.

Do not claim branch protection was configured by this repository. The owner should make the relevant web/native job names required checks after the first verified successful runs and after confirming repository settings. Workflow source cannot itself grant that protection.

## 9. Primary references

- GitHub runner selection and current labels: https://docs.github.com/en/actions/how-tos/write-workflows/choose-where-workflows-run/choose-the-runner-for-a-job
- Xcode 27 ARM64 image inventory: https://github.com/actions/runner-images/blob/main/images/macos/xcode-27-arm64-Readme.md
- Runner image repository and update history: https://github.com/actions/runner-images
- XcodeGen project spec at the pinned release: https://github.com/yonaskolb/XcodeGen/blob/2.46.0/Docs/ProjectSpec.md
- XcodeGen release metadata/checksum source: https://api.github.com/repos/yonaskolb/XcodeGen/releases/tags/2.46.0
- XcodeGen release: https://github.com/yonaskolb/XcodeGen/releases/tag/2.46.0
- Checkout action: https://github.com/actions/checkout
- Setup Node action: https://github.com/actions/setup-node
- Upload Artifact action: https://github.com/actions/upload-artifact
- Apple's Duo preparation/simulator session: https://developer.apple.com/videos/play/tech-talks/111461/
- Apple's hinge and multi-scene session: https://developer.apple.com/videos/play/tech-talks/111464/

Source documentation is evidence for the selected workflow design. Only an actual run, on the intended commit and destination, is evidence that this repository's native harness works.
