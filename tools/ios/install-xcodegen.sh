#!/usr/bin/env bash
set -euo pipefail

# Version and SHA256 come from GitHub release asset metadata, not a mutable brew tap.
version="2.46.0"
expected_sha256="4d9e34b62172d645eed6457cac13fc222569974098ef4ee9c3368bedf0196806"
repo_root="$(git rev-parse --show-toplevel)"
install_root="$repo_root/.tools/xcodegen-$version"
mkdir -p "$install_root"
archive="$install_root/xcodegen.zip"
curl --fail --location --proto '=https' --tlsv1.2 --retry 3 \
  "https://github.com/yonaskolb/XcodeGen/releases/download/$version/xcodegen.zip" \
  --output "$archive"
printf '%s  %s\n' "$expected_sha256" "$archive" | shasum -a 256 --check
unzip -q -o "$archive" -d "$install_root"
binary="$install_root/xcodegen/bin/xcodegen"
if [[ ! -x "$binary" ]]; then
  printf 'Pinned archive did not contain expected executable: %s\n' "$binary" >&2
  exit 1
fi
"$binary" --version
if [[ -n "${GITHUB_OUTPUT:-}" ]]; then
  printf 'binary=%s\n' "$binary" >> "$GITHUB_OUTPUT"
fi
printf 'XcodeGen executable: %s\n' "$binary"
