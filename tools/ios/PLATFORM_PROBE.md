# P01-T01 platform probe

Source review: 2026-10-27. Probe status: implemented; its new native tests require an exact-commit GitHub Actions run. This is not a physical-device or distribution approval.

## Verified public API sources

- [Apple iPhone Duo developer hub](https://developer.apple.com/iphone-duo/) identifies Xcode 27.1 as the development toolchain.
- [Leverage multiple displays and scenes](https://developer.apple.com/videos/play/tech-talks/111464/), code at 1:44–2:17, shows `.onHingeChange { _, context in ... }`, optional `context.hinge`, and `hinge.angle`. Its guidance separates interactive hinge effects from arrangement/region-driven layout.
- [Adaptive layouts](https://developer.apple.com/videos/play/tech-talks/111463/), code at 6:46–8:07, shows `GeometryReader` queries for `.division` and `.occlusion` reserved regions and their frames.
- [Prepare your app](https://developer.apple.com/videos/play/tech-talks/111461/), 1:17 and accompanying transcript, documents interactive Device Hub open/close/rotate/fold controls. No supported command-line fold operation was established by this review. The tests do not invent one.

These source observations support the existing native adapter; actual SDK compatibility still requires the build. The hub is not evidence of an App Store filter that excludes other iPhones.

## Actual observations, not synthetic device claims

`PlatformProbeUITests` opens the app's DEBUG-only diagnostic row and retains JSON plus screenshots for portrait and both landscape orientations. JSON reports:

- `isSimulator`, set by the compiler's target environment, not a device-name guess;
- the observed engine-view width/height in logical points, display scale and reserved rectangles;
- `hingeObservation`: `awaiting` until the callback is seen, `unavailable` for an observed nil hinge, or `measured` for an actual angle;
- an angle in degrees or JSON null. Null is never replaced by zero.

The UI test checks measured viewport dimensions against the actual WKWebView accessibility frame, without hardcoded device dimensions. It records the current system hinge result rather than assuming a specific simulator pose. The separate unit tests supply synthetic values solely to test payload semantics and rejection of invalid samples; those fixtures are not device observations.

Diagnostics do not inject state, expose a filesystem bridge, or appear in Release builds. They establish native measurement, not end-to-end rendered reserved-region avoidance. That downstream layout work retains its own acceptance gates.

## Evidence collection

Run the existing `iOS Simulator` workflow unchanged. It pins and captures Xcode/SDK versions, inventories all simulator types/runtimes, and selects the observed Duo identifier without a generic-iPhone fallback. The existing selector suite rejects renamed ordinary iPhones, absent/ambiguous runtimes and invalid device instances.

The workflow executes the new unit/UI tests and exports attachments using `xcresulttool`. Keep the exact tested SHA, run and job URLs, artifact identifier, test counts, observed JSON and screenshots in the task evidence. A compiled test file alone is not a passed test. Keep failing results and diagnose any geometry mismatch rather than increasing its tolerance without explanation.

Physical fold delivery, outer-display switching, sustained frame rate, thermal behavior and supported commercial exclusivity remain unverified by this probe. Device Hub interactive fold evidence is also separate from automatic orientation testing.
