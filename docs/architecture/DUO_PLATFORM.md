# Duo platform contract and verification gates

Last source review: **2026-10-26**. Read this with the architecture, bridge, persistence, graphics-budget, and release specifications. This document defines platform decisions and evidence requirements; task completion remains in the central planning state.

## 1. Product target versus verified capability

Tin Junction is designed exclusively as a physical miniature railway in a folding case for **iPhone Duo**. The host is SwiftUI; the rendered world is bundled TypeScript/Three.js inside WKWebView. Browser builds are engineering tools, not an alternate commercial release. The minimum deployment target and the initial SDK/compiler baseline are **iOS 27.1 / Xcode 27.1**.

| Claim | Evidence/status | Consequence |
| --- | --- | --- |
| Apple publicly documents iPhone Duo and Xcode 27.1 support | VERIFIED in Apple's developer hub and technical sessions, linked below | Use the published platform APIs rather than imagined hardware interfaces |
| SwiftUI has `onHingeChange` and optional `DeviceHingeContext.hinge` | VERIFIED in Apple's code sample | A small native adapter may observe actual hinge changes |
| Geometry reserved-region and arrangement APIs serve adaptive layout | VERIFIED in Apple's layout session | Layout must not be inferred solely from hinge angles |
| The checked-in Swift source compiles against this SDK | NOT implied by this document | The actual pinned macOS CI compile is a gate; preserve failures |
| Packaged Three.js successfully boots through this WKWebView custom scheme | IMPLEMENTED as a spike, requires native runtime test evidence | Browser success is not sufficient |
| A Duo-only App Store compatibility filter is available for this app | UNVERIFIED; release blocker | Owner must verify a supported distribution mechanism before selling |
| Real-Duo visual quality, sustained performance, thermals, latency and haptics | UNMEASURED | Physical-device evidence is mandatory before production approval |

The Info.plist deliberately has no invented `hinge`, `duo`, or `foldable` required capability. `TARGETED_DEVICE_FAMILY = 1` restricts to the iPhone family, **not** to Duo. Disabling Mac-designed-for-iPhone or visionOS compatibility likewise does not establish Duo exclusivity. A minimum OS version is not a model selector.

## 2. Public API adapter

The initial adapter uses these verified source-level concepts:

- `.onHingeChange { previous, current in … }`; `current.hinge` is optional. A missing value must stay absent, not be converted into a fabricated model or angle.
- `hinge.angle` is a SwiftUI `Angle`. The native bridge explicitly sends **degrees**. The renderer converts once to radians when required by 3D transforms.
- `GeometryProxy.reservedRegions(kind: .division)` and `.reservedRegions(kind: .occlusion)` provide geometry in the inspected view's coordinate space. The adapter combines their measured rectangles for the initial bridge. A future revision may preserve region kinds if the layout contract needs them.
- `GeometryReader` provides the actual engine view's width and height. `EnvironmentValues.displayScale` supplies the observed pixel ratio. These are not copied from a device-spec table.
- `scenePhase` drives active/inactive/background messages. Window resizing and actual view geometry drive layout separately.

The `RootView` is an intentionally small compile/runtime probe. If an API signature differs in the installed public SDK, stop, inspect the official documentation and compiler diagnostic, and update this adapter plus tests with an evidence entry. Never introduce private KVC settings, copied private headers, guessed selector names, fabricated entitlements, or swallowed compile errors.

## 3. Physical experience and pose rules

The hardware fold makes the railway case feel like an object. It does not turn the application into a puzzle or introduce objectives. The detailed art and interaction specifications decide how the lid, case, controls, track and miniature scenery respond. Native code supplies measured state; the renderer owns visual expression.

| Situation | Required behavior | Evidence required |
| --- | --- | --- |
| Inner display fully open | Accurate visible case framing, reachable controls, no dependence on a nominal screen size | Packaged screenshot, region diagnostics, interactive inspection |
| Partially open/tabletop | Respond smoothly to live hinge input while respecting current reserved regions | Recorded physical fold sweep plus simulator layout inspection |
| Transition to outer display/closed device | Preserve the user's layout and simulation state; present a deliberate cover/return experience | Lifecycle trace and save/restore test; not a reset-to-default shortcut |
| Rotation | Recompute layout from new view geometry; do not stretch rendering or swap units | Both supported landscape orientations and portrait captures |
| Side-by-side multitasking | Handle constrained width/height and safe areas without inaccessible controls | Resized scene captures and touch-target review |
| Missing hinge context | Report unavailable; no invented sensor data, no crash, no implied shipping support | Diagnostic test with absent context |
| Inactive/background | Stop active rendering/audio as specified, preserve state, avoid wall-clock jumps on return | Event ordering and deterministic simulation-resume evidence |
| Content process termination | Bound recovery; production recovery restores the last acknowledged native snapshot | Forced-failure test and persistence evidence |

The initial harness only observes geometry, sends lifecycle messages and attempts one clean WebKit reload. It does **not** yet implement the cover experience, durable saves, train freeze/resume semantics, mechanical hinge fitting, or native audio. Those remain planned features.

For production, coalesce geometry/hinge updates at a measured cadence; do not push every mesh or every simulation tick across the native bridge. A position sampled for a frame is not a physics command. Do not let interpolation alter persisted track geometry. If a track would visually cross a moving case hinge, the physical and visual continuity policy must be explicitly designed and tested rather than solved by a hidden reset.

## 4. Native/web ownership

| Native Swift | Bundled engine | Never implicit |
| --- | --- | --- |
| Scene lifecycle, device/region observations, accessible shell | Camera, picking, materials, lighting, renderer resize | A browser screen size is not Duo geometry |
| Durable storage, atomic migration and recovery in later phases | In-memory deterministic simulation/editor state | JavaScript storage is not the final save authority |
| Native audio session, interruptions and haptics in later phases | Event requests and visual synchronization | WebAudio startup does not prove native audio is complete |
| Validated, versioned bridge and bounded resource loading | Validated command handling and batched diagnostics | Raw JavaScript or generic filesystem commands are never allowed |

Current outgoing payloads are exactly:

```text
native.bootstrap { host: "ios", debug: boolean }
native.lifecycle { state: "active" | "inactive" | "background" }
native.viewport {
  width: logicalPoints, height: logicalPoints, pixelRatio: measuredScale,
  reservedRegions: [{ x, y, width, height }], hingeAngleDegrees: number | null
}
```

All messages use `{version:1,id,type,payload}`. Native calls the constant JavaScript receiver `window.TinJunction.receiveNative(message)` using WebKit's argument API, not interpolated script source. JavaScript posts to `window.webkit.messageHandlers.tinJunction`. Native accepts only `web.ready`, `engine.error`, and `engine.metrics` from the expected top-level bundled document. Incoming diagnostic envelopes are limited to **65,536 bytes**; this is unrelated to the resource-asset limit.

Renderer errors require a bounded `code` string and Boolean `recoverable`. A recoverable WebGL context-loss error clears visible renderer readiness but keeps the existing native transport alive, so background/foreground and viewport updates still reach JavaScript. The next rendered-frame diagnostic metrics event restores visible readiness. A terminal error disables transport and cannot be cleared by a stray metrics event. This is a scaffold state transition, not complete resource/saved-world recovery. A generation-aware 20-second initial handshake deadline makes a missing or blocked script fail visibly instead of showing an endless loading label; it is cancelled on ready, failure, reload and detach.

The viewport is the actual engine view in logical points. It is not multiplied by pixel ratio before transmission. The web canvas decides its drawing-buffer resolution from the measured ratio and renderer quality policy. The current SwiftUI shell stays in normal safe-area layout; do not later add `ignoresSafeArea` without extending and testing the safe-area contract.

## 5. Offline WebKit packaging spike

The entry point is `tinjunction://bundle/index.html`. A custom `WKURLSchemeHandler` serves files only from the code-signed `WebAssets` folder. The generated bundle is included as an Xcode folder reference so relative asset paths survive packaging.

The implementation rejects other schemes/hosts, credentials, ports, queries, fragments, non-GET requests, path traversal, encoded separators, NUL bytes, nested percent encodings, symlink escapes, unsupported extensions, missing/non-regular files, and assets above 64 MiB. Main-frame navigation is limited to the entry document; popups and remote navigation are not a browser feature of this app. WebKit uses a nonpersistent website store. No public web server or local HTTP server is introduced by this scaffold.

The first bundle uses one **classic IIFE** JavaScript entry. This avoids assuming that ES modules work across a custom scheme's origin/CORS behavior. It does not prove the future asset pipeline. Every new resource kind must pass a packaged WKWebView test on the targeted runtime:

1. Basic HTML, CSS and JavaScript with restrictive CSP and correct MIME types.
2. A tiny texture and a tiny glTF/GLB with explicit relative resource paths.
3. Any proposed KTX2/Draco/Meshopt decoder, worker, or WASM module, bundled offline with its legal notices and integrity manifest.
4. Network disabled, first launch, relaunch, background/foreground, and content-process termination.
5. Missing/corrupt/oversized resources and deliberately malformed paths, with a useful visible error instead of a blank screen.

Do not enable undocumented universal file access to make a demo work. Do not equate a custom scheme with an HTTPS secure context. WebGPU, worker support, decoder fetch behavior and WebGL limits require their own evidence. WebGL2 is the current graphics baseline; a renderer migration is a separate decision.

The current scheme handler reads small immutable resources synchronously and completes each request before returning. This is appropriate only for the small engineering spike. The production asset phase must replace it with cancellation-safe bounded IO, prove no callback occurs after `stop`, measure load stalls, and set asset budgets. Its 64 MiB per-resource rejection limit is a safety ceiling, not a recommended texture or model size.

## 6. Simulator and hardware verification order

1. Inventory the real runner, Xcode build, SDK and installed simulator list. Fail if the required Duo destination is absent.
2. Compile the actual Swift targets with Xcode 27.1 and run the policy/bridge tests. Do not wrap platform APIs in a permanently disabled compilation block.
3. Boot the selected Duo runtime and install the built app. Confirm the packaged WebKit handshake, native receiver delivery, diagnostic status and canvas capture.
4. Use documented Xcode Device Hub controls to inspect open/closed/partial poses and rotations. Save the session evidence. A script that only injects a numeric hinge value proves the adapter, not system fold delivery.
5. Observe native events and reserved regions during resizing and multitasking. Verify their coordinate system against visible positions.
6. Run lifecycle, WebKit termination, asset corruption, save migration and interaction tests as those features become implemented.
7. Repeat the applicable matrix on physical Duo hardware. Record device model/OS build, app commit, build configuration, thermal state, battery conditions, display mode and test scene.

No undocumented `simctl` hinge flag is assumed. The initial CI checks normal launch, rotation and foregrounding; interactive simulator pose review is still a separate task. Device testing must assess sustained frame time, frame pacing, memory pressure, temperature, battery drain, touch latency, audio latency, haptic quality, accessibility and readable final artwork. Simulator timings cannot close those gates.

## 7. Duo-only distribution release blocker

Before external sale or public metadata claims, the owner must establish exactly how the App Store will restrict installation/purchase to the intended supported product. Acceptable evidence is a current documented capability/distribution mechanism applicable to this app, or clear Apple Developer Support/App Review guidance recorded in the repository's evidence index.

Until then:

- Do not invent a required capability or add an unrelated hardware requirement to exclude other models.
- Do not call an iPhone-family build "Duo-only distribution verified."
- Do not take payment from users on unsupported models and reveal a surprise unusable screen.
- Do not silently widen the commercial target to other phones; that changes the user's product requirement.
- Keep signed TestFlight/public submission and marketing assertions behind the owner-controlled release gates.

## 8. Primary sources

- Apple Duo developer hub: https://developer.apple.com/iphone-duo/
- Prepare your app for iPhone Duo; SDK and simulator guidance: https://developer.apple.com/videos/play/tech-talks/111461/
- Adaptive geometry/reserved-region/arrangement APIs: https://developer.apple.com/videos/play/tech-talks/111463/
- Hinge context, angle, scene behavior and source samples: https://developer.apple.com/videos/play/tech-talks/111464/
- SwiftUI hinge modifier: https://developer.apple.com/documentation/swiftui/view/onhingechange%28isenabled%3A_%3A%29
- SwiftUI hinge context: https://developer.apple.com/documentation/swiftui/devicehingecontext
- UIKit public hinge interaction: https://developer.apple.com/documentation/uikit/uihingeinteraction
- Required device capabilities: https://developer.apple.com/support/required-device-capabilities/
- Info.plist compatibility key: https://developer.apple.com/documentation/BundleResources/Information-Property-List/UIRequiredDeviceCapabilities
- WKURLSchemeHandler: https://developer.apple.com/documentation/webkit/wkurlschemehandler
- Typed-argument JavaScript execution: https://developer.apple.com/documentation/webkit/wkwebview/callasyncjavascript%28_%3Aarguments%3Ain%3Acontentworld%3A%29
- WebKit process termination callback: https://developer.apple.com/documentation/webkit/wknavigationdelegate/webviewwebcontentprocessdidterminate%28_%3A%29
- App Review Guidelines, especially public APIs, executable-code packaging and minimum functionality: https://developer.apple.com/app-store/review/guidelines/

These sources establish the API/platform direction, not app approval or measured product quality. Recheck source availability and SDK behavior whenever changing the baseline.
