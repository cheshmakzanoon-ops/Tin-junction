#!/usr/bin/python3
"""Fail closed before an archive can copy development diagnostics into the app."""
import argparse
import hashlib
import json
from pathlib import Path
import re
import sys

RUNTIME_FILES = {"index.html", "bundle.js", "bundle.css", "bundle.js.LEGAL.txt"}
PROBE_MARKERS = ("TinJunctionAssetOriginProbe", "asset-origin-probe-panel", "Play probe tone", "probe/calibration.glb")


def verify_release_assets(directory: Path) -> None:
    if directory.is_symlink() or not directory.is_dir():
        raise ValueError("WebAssets must be an ordinary directory")
    entries = list(directory.iterdir())
    if {entry.name for entry in entries} != RUNTIME_FILES | {"bundle-manifest.json"}:
        raise ValueError("WebAssets contains missing or unexpected resources, including possible probe fixtures")
    if any(entry.is_symlink() or not entry.is_file() for entry in entries):
        raise ValueError("WebAssets must contain regular files only; symlinks and subdirectories are prohibited")
    manifest_bytes = (directory / "bundle-manifest.json").read_bytes()
    if len(manifest_bytes) > 16_384:
        raise ValueError("Bundle manifest exceeds its bounded size")
    manifest = json.loads(manifest_bytes)
    if not isinstance(manifest, dict) or type(manifest.get("formatVersion")) is not int or manifest["formatVersion"] != 1:
        raise ValueError("Unsupported bundle manifest")
    if manifest.get("assetOriginProbe") is not False:
        raise ValueError("Release requires an explicitly ordinary bundle; the diagnostic flag is set or absent")
    if manifest.get("scriptFormat") != "iife" or manifest.get("externalRuntimeDependencies") != []:
        raise ValueError("Release requires the offline classic script bundle")
    artifacts = manifest.get("artifacts")
    if not isinstance(artifacts, dict) or set(artifacts) != RUNTIME_FILES:
        raise ValueError("Release manifest must list exactly the approved ordinary runtime files")
    for name in sorted(RUNTIME_FILES):
        expected = artifacts[name]
        if not isinstance(expected, dict) or set(expected) != {"bytes", "sha256"}:
            raise ValueError("Invalid artifact declaration: " + name)
        size, checksum = expected["bytes"], expected["sha256"]
        if type(size) is not int or not 0 < size <= 67_108_864 or not isinstance(checksum, str) or not re.fullmatch(r"[a-f0-9]{64}", checksum):
            raise ValueError("Invalid artifact bounds or checksum: " + name)
        file = directory / name
        if file.stat().st_size != size:
            raise ValueError("Artifact byte count mismatch: " + name)
        content = file.read_bytes()
        if hashlib.sha256(content).hexdigest() != checksum:
            raise ValueError("Artifact checksum mismatch: " + name)
        if name in {"bundle.js", "bundle.css"} and any(marker in content.decode("utf-8") for marker in PROBE_MARKERS):
            raise ValueError("Diagnostic implementation or controls remain in " + name)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--configuration", required=True)
    parser.add_argument("--assets", required=True, type=Path)
    arguments = parser.parse_args()
    if arguments.configuration == "Debug":
        return 0
    if arguments.configuration != "Release":
        print("error: Unsupported build configuration for the offline resource guard.", file=sys.stderr)
        return 1
    try:
        verify_release_assets(arguments.assets)
    except (OSError, UnicodeError, ValueError, TypeError) as error:
        print("error: Release resource validation failed: " + str(error), file=sys.stderr)
        print("error: Run npm run bundle:ios without --asset-probe, then archive again. Diagnostic resources must never ship.", file=sys.stderr)
        return 1
    print("Verified ordinary offline resources: diagnostic fixtures, implementation and controls are excluded from Release.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
