# P01-T02 — preserved Simulator preflight failure

The first full asset-probe workflow attempt for `8f96036acfab046b87bab5e002b034bc83eeffb6` failed **before xcodebuild started**. This run provides no new GLB, texture, audio, startup-retry or UI assertion result.

[Run 40450589029](https://github.com/cheshmakzanoon-ops/Tin-junction/actions/runs/40450589029), job `122012948001`, reached the explicit diagnostic bundle build, XcodeGen project generation, actual Duo selection and initial `simctl boot` successfully. At 2026-10-27 04:41:04 UTC, `tools/ios/test-simulator.sh:26` aborted while running the existing `xcrun simctl bootstatus "$TIN_SIMULATOR_UDID" -b` preflight command. The process exited **134**.

CoreSimulator raised `NSInternalInconsistencyException` with reason `Invalid parameter not satisfying: devicePair`; the stack includes `SimDeviceSet addDevicePairAsync` and `handleXPCNotificationDevicePairAdded`. Reaching this line under `set -euo pipefail` establishes that the preceding SDK, nonempty bundled index and generated-project directory checks passed. The complete job log identifies the command; the absence of an xcresult alone was not used to infer it.

The compact actual-log excerpt is retained in [the companion text record](P01-T02-simulator-preflight-failure-8f96036.txt). [Artifact 12710412440](https://github.com/cheshmakzanoon-ops/Tin-junction/actions/runs/40450589029/artifacts/12710412440), `duo-host-40450589029-1`, was downloaded and independently verified: **7,286 bytes**, SHA-256 **`63089f0d71c906ae389bececebff14d2f7f102bd29f13e69633c34492de91a31`**. It contains only macOS/SDK/Xcode and Simulator inventory, with no `xcodebuild.log`, result bundle or screenshots. Retention currently ends 2026-11-10 04:42:13 UTC.

The selected Simulator remained the actual `iPhone Duo`, runtime `com.apple.CoreSimulator.SimRuntime.iOS-27-1`, UDID `4C56FCAC-377C-469C-B415-8ABBC4375CBA`. The toolchain reported Xcode 27.1, build 27A9275. No ordinary-iPhone fallback was used.

## Retest decision

This is a runner/CoreSimulator preflight failure. Its application-loading outcome remains unobserved. No source, SDK pin, CSP, selector or assertion was changed to bypass it. The coordinator authorized one exact failed-job rerun if this diagnosis held, then identified an already active full workflow at source-identical metadata descendant `6a8f3f3bf7e071e421f4d16f8d514097be9ffb67`: [run 40451042264](https://github.com/cheshmakzanoon-ops/Tin-junction/actions/runs/40451042264). A local Git comparison verified that this descendant changes only P07 evidence and planning records; the application, fixtures, build scripts and workflows are unchanged. That active run is the retest; **no additional rerun API call was made**. Its outcome must be observed separately and cannot be presumed successful.

The failed attempt and artifact remain preserved. P01-T02 custom-origin acceptance and P02 startup/retry integration still require the actual complete native test results.
