# Layout design format 2 — P07-T01

This is a new document contract, not a reinterpretation of the shipped development workbench's format 1. Native `LayoutDocument` / `LayoutStore`, the current bridge and the rendered oval app continue to use format 1. Version-by-version migration and durable-store integration are separate gates. Never send a format-2 document through the current format-1 bridge as if it were supported.

## Envelope

Every field below is required, including explicit `train: null` when no train is placed. Unknown fields at every typed level are rejected. The envelope is:

```text
format = "tin-junction-layout"
schemaVersion = 2
documentId, revision, name, seed
catalogVersion = "tin-junction-layout-kit-v1"
boardId = "workbench.case"
track = { revision, pieces[], turnouts[], connections[] }
selections[] = { turnoutId, route: "straight" | "diverging" }
train = null | { id, catalogVersion, vehicles[], motion }
scenery[] = { id, kind, x, z, rotation, scale }
environment = { timeOfDay: "day" | "dusk" | "night" }
```

`track` uses the explicit P05 physical topology: straight/arc `GraphPiece` records, complete authored turnout dimensions/pose, and stable physical socket connections. The rail profile and gauge are known catalog facts. A turnout's internal derived route edges are not separately saved as track pieces. `selections` contains exactly one supported route for every physical turnout.

`train.catalogVersion` is `tin-junction-vehicles-v1`. `vehicles` is one through eight `{ id, catalogId }` records. The first vehicle is `steam-01`; subsequent vehicles are `coach-01` or `wagon-01`. Instance IDs are distinct. Their array order is permanently locomotive-front to last-car; reversing travel does not reverse the composition. The original procedural art is explicitly a development catalog, not approved production assets.

`train.motion` is the separate routed-motion checkpoint described in `../simulation/MOTION.md`. It preserves validated route intervals, selected routes, topology/switch revisions, direction, tick, speed, throttle, signed travel and emergency brake state. Its train ID and selections must agree with the design. Its retained length equals the catalog-derived conservative footprint, within 1e-9 m. It is not the literal sum of vehicle body lengths. The catalog uses exact integer-micrometre source dimensions and the same formula in TypeScript and Swift. Safe default parking occurs when a future application loads the checkpoint, not by silently rewriting an unsafe checkpoint during file validation.

## Validity and operation

Both validators prove file shape, supported catalog/version, finite numeric bounds, stable identities, compatible explicit joins, complete selected routes, and continuous supported train history. Exact moving-state validation also proves enough connected route for the saved braking envelope. A snapshot with invalid route state or unsafe moving speed is rejected even though ordinary application restore will later park the train.

**Valid file does not mean runnable design.** Incomplete layouts remain representable, and geometric conflicts can be preserved for editing. The engine must run P05 operating clearance before placing or running a train; file decoding is never authority to skip that gate. `layoutOperatingClearance` exposes this distinction explicitly. Physical scenery/rail collision checks, vehicle pose certification, signals and supported bridge rules remain their respective engine/editor responsibilities. The format stores no implicit approval flags.

Scenery retains the six original kinds and their numeric/whole-footprint board bounds. Format 2 does not impose the fixed station/pond rectangles from the old oval scene: those are format-1 runtime fixtures, not immutable facts about every future authored layout. This does not authorize the current oval renderer to consume a format-2 design.

## Bounded input and identity

Source data is at most 512 KiB UTF-8, depth 32 and 40,000 JSON values. There are at most 500 compiled track pieces (two per turnout), 64 turnouts, 500 connections, 128 scenery objects and one train. IDs use the existing bounded ASCII identifier contract. Revision/tick counters use the shared safe counter limit. Names contain 1–80 Unicode scalar values with no control characters or unpaired surrogates; seeds are unsigned 32-bit integers. Unknown kits/assets and unsupported versions fail with recoverable explanations, preserving the original input.

Rendering meshes, shaders, arbitrary paths/URLs, native handles and an undo log have no document fields. The TypeScript object boundary also rejects non-JSON runtime values before encoding. Caller-owned objects are detached before use; derived graphs are rebuilt from the document. Physical vehicle order and occupied route-interval order are semantic and must never be sorted. Topology, selections and scenery have stable ID ordering for serialization.

Serialization preserves complete numeric precision; it does not apply the diagnostic state digest's display quantization. Each platform produces deterministic sorted-key JSON and equivalent logical state on decode. Byte-identical floating-point spelling across JavaScript and Foundation encoders is not promised. Native storage's future integrity wrapper hashes its own exact canonical bytes; cross-platform interchange is validated semantically.

## Verification boundary

Shared corpus files exercise both native and web validators, including minimum/populated/budget layouts, route history, unknown fields/assets/versions, identity conflicts, unsafe braking, malformed joins and invalid numeric values. Native acceptance needs actual executed Swift tests on the selected SDK. Until those checks and source-specific evidence pass, this format remains implemented work under review, not an accepted app migration or release claim.
