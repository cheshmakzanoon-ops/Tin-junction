# Native / engine bridge protocol

Protocol baseline: **1**. Status: diagnostic subset implemented; persistence/editor/audio extensions below are design contracts awaiting their roadmap tasks.

## Transport

Web-to-native: `window.webkit.messageHandlers.tinJunction.postMessage(message)`.

Native-to-web: invoke `window.TinJunction.receiveNative(message)` through WebKit's argument-safe JavaScript API. Pass the object as an argument, not string-built source. The exact casing is part of the contract. Native owns creation/destruction of the handler and avoids retention cycles.

The debug browser adapter implements the same envelope but cannot confer native capability or device approval.

## Envelope

```json
{
  "version": 1,
  "id": "native-42",
  "type": "native.lifecycle",
  "payload": { "state": "active" }
}
```

| Field | Rule |
|---|---|
| `version` | Integer exactly 1 for this contract |
| `id` | Non-empty bounded string; unique per sender/session; no user secrets |
| `type` | An exact supported discriminant, never an arbitrary method name |
| `payload` | Plain JSON object validated by message type |

Suggested diagnostic payload ceiling: 64 KiB serialized. Production document transfer receives its own independently bounded channel and chunk/ack design; do not simply increase the general bridge limit to fit arbitrary files. Reject `NaN`, Infinity, negative dimensions, invalid enum values, excessive array lengths and wrong nested types. JS JSON serialization is not itself validation.

## Implemented diagnostic messages

| Direction / type | Payload | Semantics |
|---|---|---|
| Native → `native.bootstrap` | `host: "ios" | "browser"`, `debug: boolean` | Handshake context. Debug does not prove a supported device. |
| Native → `native.lifecycle` | `state: "active" | "inactive" | "background"` | Changes native pause gate; must compose with browser visibility and context-loss gates. |
| Native → `native.viewport` | `width`, `height`, `pixelRatio`, optional `reservedRegions`, optional `hingeAngleDegrees` | Native scene observations, never a hardcoded screen profile. |
| Web → `web.ready` | `build: "engineering-harness"`, `protocolVersion: 1`, `renderer: "webgl2"` | Diagnostic runtime initialization has reached readiness. It does not claim production content is loaded. |
| Web → `engine.error` | Bounded diagnostic fields defined by the checked-in decoder | Report failures without native file paths, secrets or arbitrary remote logs. |
| Web → `engine.metrics` | Bounded numeric diagnostics defined by the checked-in decoder | Low-frequency measurement summary; not a per-mesh or per-frame RPC stream. |

The actual Swift and TypeScript validators must agree on required/optional keys and ranges. If implementation diverges, add a shared fixture and fix both sides before extending the contract. A type assertion that casts unvalidated input is not a validator.

## Viewport units and sequencing

Width, height and reserved rectangles are logical scene points/CSS-pixel equivalents within the web content's coordinate system, not physical display pixels. `pixelRatio` is metadata for quality calculation; multiply exactly once when choosing backing-buffer resolution. The canvas's actual observed container dimensions remain authoritative for allocation.

Each reserved rectangle is `{x,y,width,height}` with finite coordinates and non-negative dimensions. Native must convert from its view coordinate space correctly. Later protocol extensions should classify divisions/occlusions explicitly; the diagnostic flat array is not the final layout policy.

`hingeAngleDegrees` is a finite value or null. Null means no usable measurement, not a zero-degree folded device. Do not identify the consumer model from a raw angle. Let native public APIs provide capability evidence. Coalesce viewport and pose samples to the latest value before the next presentation update; use lifecycle events as ordering barriers.

## Handshake and liveness

1. Install the JS receiver before emitting `web.ready`.
2. Native records the ready event and sends bootstrap, current lifecycle and latest viewport.
3. Until ready, native retains the latest state instead of an unbounded queue of duplicate updates.
4. A failed or incompatible handshake produces an explicit native diagnostic screen.
5. Recreated WebContent starts a new session identity. Old acknowledgements must not satisfy new-session commands.

The production bridge task adds explicit session IDs, monotonically increasing sequence/revision numbers, acknowledgement timeout handling, duplicate-command protection, request cancellation and bounded queues. Do not claim those features exist merely because this document specifies them.

## Planned production extension families

| Family | Planned behavior | Safety prerequisite |
|---|---|---|
| `layout.load` / accepted/rejected | Load a validated versioned snapshot | Schema limits, asset allowlist, revision ownership |
| `layout.checkpoint` / durable acknowledgement | Store a committed editor state natively | Atomic write, checksums, failure feedback |
| `editor.command` / accepted/rejected | Typed graph/scenery transaction | Expected revision and rollback semantics |
| `feedback.request` | Named bounded haptic/audio event | Public supported platform APIs; rate limits |
| `export.request` / result | Export a known safe document or approved capture | Native destination UI; no raw filesystem paths |
| `runtime.capabilities` | Explicit packaged runtime feature report | Tests distinguish actual probes from injected fixtures |

These types must be added to protocol fixtures and version compatibility rules before implementation. Do not send arbitrary JS expressions, shell commands, native selectors, URL loads or user-specified file paths.

## Security and lifecycle tests

- Wrong type/version/ID, null/nonobject payload, oversized string and nested wrong-type values are rejected on both sides.
- Negative/out-of-bounds viewport rectangles and non-finite numbers cannot allocate huge buffers.
- An untrusted page/frame cannot exercise native services; allow only the expected local origin and main-frame messages where applicable.
- Navigation to external HTTP(S), `file:`, `javascript:` or unapproved local hosts is rejected.
- Resource traversal tests include `%2e%2e`, double encoding, separators, query/fragment tricks and symlink containment policy.
- Handler removal, WebView deallocation, page reload and process termination do not retain stale callbacks.
- Background + hidden + context-lost pause conditions compose independently; one recovered condition cannot resume while another remains active.
- Golden JSON fixtures are decoded by Swift and TypeScript, including malformed examples. Test success and error paths.

## Observability

Use stable error codes, bounded ring buffers and opt-in local diagnostics. Do not upload logs automatically. A failure report records native build, engine bundle hash, protocol, OS/device or simulator, current task and exact repro steps. Hinge values and viewport metrics in a screenshot are engineering diagnostics, not a proof that the visual experience is accepted.
