# Engineering renderer harness

Status: **scaffolding**, not completed game functionality or visual art.

`npm run dev` runs a local browser harness. `npm run build` produces a fully bundled classic-script/IIFE build in `dist/web/`. `npm run bundle:ios` copies only the runtime package into `apps/ios/TinJunction/Resources/WebAssets/` for the Swift host. Runtime imports from a CDN are forbidden. `bundle-manifest.json` records hashes and byte counts.

The simple oval and calibration block deliberately provide a WebGL2/lifecycle/bridge smoke test. They are not a train simulation, approved track model, asset-pipeline acceptance, Duo layout implementation or photorealism milestone. The browser viewport and SwiftShader test GPU do not emulate actual iPhone Duo hardware.

## Initial boundaries

- `src/bridge.ts`: versioned incoming command validation. `window.TinJunction.receiveNative(object)` is the only inbound entry point. Outbound packets use `window.webkit.messageHandlers.tinJunction.postMessage(object)` when embedded.
- `src/clock.ts`: fixed-step scheduling and independent pause gates. A paused page never tries to simulate all elapsed wall time.
- `src/main.ts`: disposable diagnostic Three.js scene with explicit color output, context-loss handling and bounded backing resolution.
- `packaged.html`: production-like restrictive content-security policy. Actual custom-scheme/WASM/worker/asset behavior still needs packaged WebView proof.
- `?capture=1`: freezes the calibration object's animation for reproducible harness captures; this is not an approved visual baseline.

## Contract scope

The initial protocol only covers `native.bootstrap`, `native.lifecycle`, `native.viewport`, `web.ready`, `engine.error` and `engine.metrics`. There is **no persistence, filesystem access, command dispatcher, save migration, simulation or production input system yet**. Add those only with schema changes, migration/compatibility tests and the assigned roadmap task.

Canvas size comes from the actual CSS container and `ResizeObserver`. Native viewport measurements are not multiplied into device scale again. Reserved-region rectangles and hinge values must eventually feed the documented layout/effect adapters; this harness intentionally does not infer crease geometry.

## Verification

`npm run typecheck`, `npm run test:web`, `npm run build`, `npx playwright install --with-deps chromium`, then `npm run test:browser`.

Browser smoke tests exercise the **built bundle**, reject remote network dependencies, verify rendered frames, malformed-message rejection, pause/resume and resize. Native loading and hardware quality are separate gates.

The pinned Playwright 1.56.1/Chromium 141 toolchain was chosen after a newer browser artifact failed to download during setup. It is a reproducible diagnostic browser, not a promise of parity with current Safari. Upgrade it deliberately with a clean installation, full smoke tests and an updated lockfile; never merely change the package version and assume its browser binaries exist.
