# ADR-0001 — Swift native host and bundled Three.js world

Status: accepted for initial development; local-resource transport remains subject to the packaged-runtime spike.

## Context

The owner explicitly requires Swift app engineering and Three.js graphics. Three.js runs JavaScript/TypeScript compiled to JavaScript; it is not a Swift renderer. We therefore combine a native SwiftUI application with a local, bundled WKWebView renderer. The browser harness is internal-only.

## Decision

Swift owns application lifecycle, Duo observations, accessible controls, settings, durable files/migrations, platform feedback and store packaging. The engine owns railway graph, fixed-tick session simulation, editor command state and rendering. The bridge transports versioned commands, snapshots and bounded diagnostics. It is never a generic native RPC facility.

The diagnostic scaffold uses a narrow `tinjunction://bundle/` scheme and a classic bundled script. No runtime dependencies are fetched from CDNs. The final asset transport must prove GLB, compressed textures, audio, WASM and worker behavior with the exact production CSP in WKWebView.

## Alternatives and tradeoffs

- Pure native Metal/RealityKit would remove WebView integration risk but would not meet the Three.js requirement.
- A remotely hosted web app would simplify deployment but introduce offline, review, reproducibility and security concerns.
- A loopback HTTP server is not the default; it adds lifecycle/network surface. Consider only after a documented transport spike, without disabling WebKit protections.

## Validation and reversal

Compile and launch the native diagnostic host, exercise bidirectional schema validation, load all production-format fixture assets offline, terminate/recreate the WebContent process, and verify resource cancellation. A browser-only pass is insufficient. If the chosen origin blocks necessary capabilities, write a replacement transport ADR rather than enabling private WebKit flags or quietly removing the relevant tests.
