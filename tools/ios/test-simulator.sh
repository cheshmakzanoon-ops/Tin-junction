#!/usr/bin/env bash
set -euo pipefail

if [[ "$(uname -s)" != "Darwin" ]]; then
  printf 'Requires macOS, Xcode 27.1, and an iPhone Duo iOS 27.1 Simulator.\n' >&2
  exit 1
fi
if [[ ! "${TIN_SIMULATOR_UDID:-}" =~ ^[0-9A-Fa-f]{8}-([0-9A-Fa-f]{4}-){3}[0-9A-Fa-f]{12}$ ]]; then
  printf 'Set TIN_SIMULATOR_UDID from select-duo.mjs, not a model assumption.\n' >&2
  exit 1
fi
repo_root="$(git rev-parse --show-toplevel)"
cd "$repo_root"
mkdir -p artifacts/ios
xcodebuild -version | tee artifacts/ios/xcode-version.txt
if [[ "$(sed -n '1p' artifacts/ios/xcode-version.txt)" != 'Xcode 27.1' ]]; then
  printf 'Required compiler is Xcode 27.1; update pins only with recorded evidence.\n' >&2
  exit 1
fi
if [[ "$(xcrun --sdk iphonesimulator --show-sdk-version)" != "27.1" ]]; then
  printf 'Selected iOS Simulator SDK is not 27.1.\n' >&2
  exit 1
fi
test -s apps/ios/TinJunction/Resources/WebAssets/index.html
test -d apps/ios/TinJunction.xcodeproj
xcrun simctl bootstatus "$TIN_SIMULATOR_UDID" -b

# Preserve prior runs instead of silently overwriting an existing result bundle.
result_path="artifacts/ios/TinJunction-$(date -u +%Y%m%dT%H%M%S)-$$.xcresult"
xcodebuild test \
  -project apps/ios/TinJunction.xcodeproj \
  -scheme TinJunction \
  -configuration Debug \
  -destination "platform=iOS Simulator,id=$TIN_SIMULATOR_UDID" \
  -destination-timeout 120 \
  -derivedDataPath artifacts/ios/DerivedData \
  -resultBundlePath "$result_path" \
  -parallel-testing-enabled NO \
  CODE_SIGNING_ALLOWED=NO \
  | tee artifacts/ios/xcodebuild.log
