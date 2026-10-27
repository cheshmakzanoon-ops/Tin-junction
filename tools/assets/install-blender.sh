#!/usr/bin/env bash
# Official Linux x64 Blender, verified before extraction or execution. No sudo.
set -euo pipefail
[[ "$(uname -s)" == Linux && "$(uname -m)" == x86_64 ]] || { echo 'Blender fixture installer requires Linux x86_64' >&2; exit 1; }
script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"
repo="$(cd -- "$script_dir/../.." && pwd -P)"
# SHA256 published at https://download.blender.org/release/Blender4.3/blender-4.3.2.sha256
sha256=4da1c956673c0485e63054e563ee69198cc8f80d8157dd7592dffc8a6a5592e6
url=https://download.blender.org/release/Blender4.3/blender-4.3.2-linux-x64.tar.xz
for tool in curl sha256sum python3 tar mktemp; do command -v "$tool" >/dev/null || { echo "Missing required tool: $tool" >&2; exit 1; }; done
base="${RUNNER_TEMP:-$repo/.tools}"
mkdir -p -- "$base"
base="$(cd -- "$base" && pwd -P)"
install_dir="$(mktemp -d "$base/tin-blender-4.3.2.XXXXXXXX")"
success=false
cleanup() { if [[ "$success" != true ]]; then rm -rf -- "$install_dir"; fi; }
trap cleanup EXIT
archive="$install_dir/blender.tar.xz"
curl --fail --location --proto '=https' --proto-redir '=https' --retry 3 --connect-timeout 30 --max-time 1200 --output "$archive" "$url" >&2
printf '%s  %s\n' "$sha256" "$archive" | sha256sum --check --status
python3 "$script_dir/check-blender-archive.py" "$archive"
tar --extract --xz --file "$archive" --directory "$install_dir" --no-same-owner --no-same-permissions
rm -- "$archive"
binary="$install_dir/blender-4.3.2-linux-x64/blender"
version="$("$binary" --version)"
[[ "${version%%$'\n'*}" == 'Blender 4.3.2' ]] || { echo 'Unexpected Blender version' >&2; exit 1; }
success=true
# stdout is only the verified executable path, suitable for BLENDER_BIN=$(...).
printf '%s\n' "$binary"
