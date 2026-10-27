# Native follow-up: guide hit target

Observed 2026-10-27. This is **failed integration evidence**, not task acceptance.

- Tested implementation: `02c0bc82746b8391fbf578cd0bed2b7bef8e1348`.
- [iOS run 40444287209](https://github.com/cheshmakzanoon-ops/Tin-junction/actions/runs/40444287209), job `121991721212`, conclusion **failure**.
- Artifact `12708171723`, `duo-host-40444287209-1`, 214,695,819 bytes. Downloaded ZIP SHA-256: `1c520b5f20fcfd51d7213a66cc59fcfbaed70d506d0229662c5df378f168d088`, matching the Actions artifact digest.
- All 51 native unit tests and all four host smoke tests passed. The real keyboard rename, native save acknowledgement and exact-name relaunch test passed in 245.361 seconds.
- `PlatformProbeUITests.testObservedPlatformGeometryAcrossSupportedOrientations` failed at line 62: the guide navigation bar still existed after Done was tapped. The preceding Done existence/hittability checks and real tap succeeded. Only portrait observation was captured; landscape validation did not run.

## Discriminating evidence

The retained screen recording is `screenshots/DFDF73DE-B8FD-4254-81EE-4707C3CC4C7A.mp4` (SHA-256 `a0d4e1d6827c1aa9f5fbf0781753bd64a5400ffc576df49637aff2c9d24ae94f`). Its frame at 60 seconds still visibly shows the open guide and Done pill, so this is not merely a stale accessibility-tree assertion.

The corresponding synthesized tap archive is `screenshots/05B6F921-A46E-419B-85EA-FA5A708414CD` (SHA-256 `7cca295de3ac735b3b1ed160df3b142fba9686eb3dc67cbe7ae9e07135cc3f60`). Decoding the Apple property list shows a tap at **(233, 627) points** in a **466 × 678 point** window.

The video frame is 1398 × 2034 pixels, exactly 3 pixels per window point. The visible dark-green pill's pixel bounds are approximately x=490–681, y=1780–1881, or **x=163.33–227, y=593.33–627 points**. The generated tap is right of that visible pill and at its lower edge. Pixel bounds are a measured visual approximation, not a substitute for native hit-test output.

Source inspection shows the expanding frame, padding and background applied outside the styled Button. This gives an accessibility rectangle larger than the interactive label. The repair puts the expanding, rectangular hit area inside the Button label and puts surrounding padding/background on a separate container. The existing platform dismissal assertion remains intact; the basic help smoke test now also requires actual dismissal rather than merely finding the host behind the sheet.

The portrait JSON attachment is `screenshots/2C306634-509A-4185-8D81-CF014DDFFEA0.txt` (SHA-256 `87e322044ff02dfe33aa47c9f3f7ed2fcf2e3e1452badc0741593add74bb2216`). It remains simulator-only evidence. A subsequent native run is required to validate the repair and collect all orientation observations.

Large recordings, screenshots and the xcresult remain in the linked Actions artifact; this record intentionally retains only their identities, hashes and the observed failure. Actions retention expires 2026-11-10.
