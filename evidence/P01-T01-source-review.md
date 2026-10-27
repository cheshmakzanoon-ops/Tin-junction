# P01-T01 public platform source review

Reviewed **2026-10-27** by the Tin Junction native-readiness engineering agent. This record verifies documented APIs; it does not claim a hardware test, App Store eligibility or release approval.

## Hinge adapter

[Apple's multiple-display session](https://developer.apple.com/videos/play/tech-talks/111464/), code demonstrations at 1:44–2:17, uses a two-argument `onHingeChange` closure, an optional `context.hinge`, and `hinge.angle` with SwiftUI's `Angle` type. Its 2:35 guidance reserves hinge data for interaction/effects and directs layout work to region and arrangement APIs. The repository adapter reads the current optional hinge and explicitly converts an available angle to degrees. An absent hinge remains absent.

## Geometry and regions

[Apple's adaptive-layout session](https://developer.apple.com/videos/play/tech-talks/111463/), code at 6:46–8:07, queries `GeometryProxy.reservedRegions` for division and occlusion kinds and reads region frames. This supports the repository's view-local `GeometryReader` measurements. Width, height, scale and region coordinates are observations from the active view, not a table of assumed device dimensions.

## SDK and Simulator

[Apple's preparation session](https://developer.apple.com/videos/play/tech-talks/111461/), 0:30–1:17, identifies iOS 27.1 and Xcode 27.1 and demonstrates the iPhone Duo destination in Device Hub. Its on-screen controls cover opening, closing, rotation and folding. The session also explains asymmetric safe areas and why inner-display layout should use size classes rather than supported interface orientation.

The automated repository probe uses the actual simulator inventory and supported XCTest orientation controls. No command-line fold mechanism was established in this review; none is invented. An automatic orientation test is not evidence of an interactive fold sweep or inner-display transition.

## Boundaries

- The readable official video code was inspected. The direct API page returned a JavaScript shell, and its linked Markdown endpoint could not be retrieved by the search service; no successful direct API-body read is claimed.
- Documentation is distinct from compilation and runtime behavior. Native evidence must separately identify the tested commit, Xcode build, SDK, actual selected simulator and results.
- Synthetic nil/angle unit fixtures verify representation only. They cannot prove system delivery on physical hardware.
- These sources do not establish a supported Duo-only purchase/install filter. P01-T04 and all physical-device, art, signing and release gates remain independent.
