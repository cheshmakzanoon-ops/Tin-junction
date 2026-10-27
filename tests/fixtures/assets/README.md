# Asset fixtures

`calibration.glb` is the original P10-T02 Blender-exported ruler/axle/socket fixture, not a production asset or copied commercial model. [Master, dimensions and exact reproduction commands](../../../assets/source/calibration/README.md).

`calibration.source-report.json` fingerprints the generator and actual exported bytes and records the pinned Blender version and export settings. Tests reject stale hashes. Do not update the binary merely to silence a failed geometric assertion; inspect differences and preserve the documented physical contract.

These test files are not silently included in the shipping app or approved asset manifest. A packaged-loader task may explicitly copy this fixture into a test build and record its own evidence. No runtime or device success is implied by repository presence.
