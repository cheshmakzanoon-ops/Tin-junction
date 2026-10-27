# Source and assumption register

Checked during repository setup on 2026-10-26 (America/Halifax). These are primary documentation links, not promises about future SDK behavior. Recheck before toolchain changes and release. The source excerpts are not reproduced wholesale; project-specific design choices are recorded separately in ADRs.

## Apple platform

| Source | What it supports | What it does not prove |
|---|---|---|
| [Duo developer hub](https://developer.apple.com/iphone-duo/) | Official platform resources and Xcode 27.1 guidance | This repo already compiles or passes hardware review |
| [Prepare your app](https://developer.apple.com/videos/play/tech-talks/111461/) | SDK and adaptive preparation | An invented exact model restriction |
| [Adaptive layouts](https://developer.apple.com/videos/play/tech-talks/111463/) | Public arrangement and reserved-region concepts | Hardcoded hinge width or screen size |
| [Multiple displays and scenes](https://developer.apple.com/videos/play/tech-talks/111464/) | `onHingeChange`, optional hinge context and effect-versus-layout distinction | Any generic app may use camera-only outer-display behavior |
| [Required capabilities](https://developer.apple.com/support/required-device-capabilities/) | Documented compatibility filtering mechanism | A verified Duo-only store switch; none identified in this setup |
| [WKWebView](https://developer.apple.com/documentation/webkit/wkwebview) | Native WebKit embedding | All asset origin/security configurations work |
| [WKURLSchemeHandler](https://developer.apple.com/documentation/webkit/wkurlschemehandler) | Custom resource handling | Replacing WebKit-owned HTTP/HTTPS handling |
| [Argument-safe JS](https://developer.apple.com/documentation/webkit/wkwebview/callasyncjavascript%28_%3Aarguments%3Ain%3Acontentworld%3A%29) | Structured native-to-web calls | Permission for arbitrary untrusted code execution |
| [App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/) | Public APIs, self-contained app, review obligations | Guaranteed approval |

## Renderer and assets

| Source | Engineering relevance |
|---|---|
| [WebGLRenderer](https://threejs.org/docs/pages/WebGLRenderer.html) | WebGL2 baseline |
| [WebGPURenderer](https://threejs.org/manual/pages/webgpurenderer) | Distinct renderer/material/postprocess pipeline and compatibility tradeoffs |
| [Color management](https://threejs.org/manual/pages/color-management.html) | Linear-light working pipeline and texture/output interpretation |
| [Physical material](https://threejs.org/docs/pages/MeshPhysicalMaterial.html) | Advanced material features carry additional cost |
| [GLTFLoader](https://threejs.org/docs/pages/GLTFLoader) | Loader extensions and decoder integration |
| [KTX2Loader](https://threejs.org/docs/pages/KTX2Loader.html) | Support detection and compressed texture loading |
| [Disposal](https://threejs.org/manual/pages/how-to-dispose-of-objects.html) | Explicit graphics resource ownership |
| [glTF 2.0](https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html) | Standard asset representation and coordinate conventions |
| [glTF Validator](https://github.com/KhronosGroup/glTF-Validator) | Structural validation tool, not artistic quality assurance |
| [WebKit Safari 26 release](https://webkit.org/blog/17333/webkit-features-in-safari-26-0/) | Shipping browser WebGPU support; packaged WKWebView still needs a probe |
| [WebKit local-origin issue](https://bugs.webkit.org/show_bug.cgi?id=294381) | Reasons to test origin-sensitive loading; not proof a historical bug affects current SDK |

## Build and project operations

- [GitHub runner selection](https://docs.github.com/en/actions/how-tos/write-workflows/choose-where-workflows-run/choose-the-runner-for-a-job)
- [Xcode 27 ARM64 image manifest](https://github.com/actions/runner-images/blob/main/images/macos/xcode-27-arm64-Readme.md)
- [XcodeGen](https://github.com/yonaskolb/XcodeGen)
- [GitHub workflow security](https://docs.github.com/en/actions/security-for-github-actions/security-guides/security-hardening-for-github-actions)
- [Apple App Store Connect app records](https://developer.apple.com/help/app-store-connect/create-an-app-record/add-a-new-app/)

The runner label, installed Xcode path, SDK/runtime versions and simulator inventory must be checked in the actual run. An online manifest is a configuration input, not a passing build result. Dependencies are pinned in package-lock.json; changed library semantics require code/fixture revalidation.

## Working assumptions requiring evidence

1. A local custom-scheme bundle can support every required production asset format under strict CSP.
2. The proposed HO-inspired scale/board dimensions produce a pleasing, usable Duo layout.
3. The graphics budget can preserve the desired reference quality over sustained play.
4. An owner-approved Duo-only distribution route can be found.
5. The provisional name and $1.99 price/currency are commercially acceptable to the owner.

Each assumption has a corresponding task/risk. Do not relabel these as verified merely because this register links official documentation.
