# First operating workbench — implemented contract

This is the bounded P04-T06 development slice approved by [ADR-0006](../decisions/ADR-0006-first-operating-workbench.md). It turns the original diagnostic shell into a functioning railway while retaining the original production roadmap. The latest tested revision, CI and limitations are in [the handoff](../../planning/HANDOFF.md).

## What can be used now

| Feature | Implemented behavior |
| --- | --- |
| Operating railway | Analytic oval; original steam locomotive plus two wagons; bounded acceleration/braking, stopped reversal and signed wheel phase |
| Train geometry | Rigid axle chord placement, bounded coupled-body placement, consistent 16.5 mm inner rail gauge |
| Scene | Walnut/brass folding display case, terrain, profiled rails, sleepers/ballast, station/platform, pond and original miniature props |
| Controls | Run/pause throttle, brake, deliberate reversal, synthesized whistle; named keyboard-accessible controls |
| Camera | Orbit/pinch/zoom; overview, trackside and overhead views; bounded framing at landscape and portrait sizes |
| Environment | Day, evening and night presets with window/lantern emission and readable UI |
| Arrangement | Place, select, move, rotate and remove firs, oaks, cottages, lamps, benches and rocks; atomic undo/redo and rail/board clearance |
| Layout identity | Editable bounded Unicode name, deterministic starter seed, stable scenery IDs |
| Native documents | Application Support, checksum-verified atomic current/previous generations, revision/checkpoint validation, recovery notice and preserved corrupt files |
| Runtime recovery | Background pause without accumulated travel; renderer context recovery including regenerated environment lighting; bounded WebContent reload from the native save |

The physical case lid can receive the existing native hinge observation. This does not complete the final posture-specific interaction design or real-device fold review.

## Controls and editing

The first launch starts stopped on the foreground straight. Run sets a moderate throttle; the slider sets its exact value. Stop brakes to zero. Reverse is rejected until throttle and speed are zero. Entering Arrange deliberately parks the train and freezes simulation ticks.

Choose a scenery kind, then tap a clear board location. Tap the selected kind again to leave placement mode. With no placement kind active, tap an existing object to select it; a subsequent board tap moves it. Rotate and Remove act on that selection. Undo/Redo apply complete transactions and increase the durable revision; they never rewind a storage revision.

Space stops the train when focus is on the scene. E toggles Arrange, W sounds the whistle, Escape clears placement/selection or closes Arrange, and Command/Ctrl-Z operates editor undo. Native button keyboard semantics take precedence when a button has focus. Multi-touch gestures cannot commit placement transactions.

A new durable factory layout is created only when storage is empty. An unreadable saved layout is retained and reported; it is not silently overwritten by a fresh scene. The browser development harness can display a starter preview when storage cannot be read, with saving blocked and an explicit warning. Restoring a valid document preserves position and wheel travel but resets speed/throttle to zero.

## Current v1 document

The exact strict validators are [TypeScript](../../web/src/model/validation.ts) and [Swift](../../apps/ios/TinJunction/Documents/LayoutDocument.swift). Both decode the same [committed fixture](../../apps/ios/TinJunctionTests/Fixtures/starter-layout.json).

```text
format: "tin-junction-layout"
schemaVersion: 1
documentId, revision, name, seed, tick
track: { kind: "oval", straightLength, radius }
train: { distance, speed, throttle, direction, wheelTravel }
scenery: [{ id, kind, x, z, rotation, scale }]
environment: { timeOfDay: "day" | "dusk" | "night" }
```

World quantities are miniature meters, seconds and radians. The board is 0.8 × 0.5 m. The default oval uses 0.34 m straights and 0.145 m radius; the tested minimum radius is 0.10 m. The renderer cannot change the model's physical dimensions or fixed 60 Hz clock.

The format is limited to 128 scenery items, a 512 KiB decoded-input boundary, known keys/kinds and finite bounded values. Train/tick checkpoint updates can keep a structural revision; changing scenery, lighting or name requires a new revision. Undo history is capped at 100; replay history at 256; diagnostic messages at 32. Intentional scenery clusters are supported; general mesh collision authoring remains future work.

The graph-based production editor will require an explicit migration from this format. Do not repurpose schema version 1 to mean arbitrary track pieces or erase the user's early layouts.

## Implemented bridge subset

Every message uses `{version:1,id,type,payload}`. Existing lifecycle and actual viewport observations remain independent of train simulation.

| Direction/type | Payload |
| --- | --- |
| Native `native.bootstrap` | `host`, `debug`, `sessionId` |
| Native `native.layout` | `sessionId`, `document` or null, `recovered`, `checkpoint` |
| Web `layout.loaded` | `sessionId`, `documentId`, `revision` |
| Web `layout.checkpoint` | `sessionId`, `requestId`, `document`, `checkpoint`, `expectedRevision` or null |
| Native `native.saved` | `sessionId`, `requestId`, `documentId`, `revision`, `checkpoint`, SHA-256 `checksum` |
| Native `native.saveFailed` | `sessionId`, `requestId`, `code`, bounded `message` |
| Native `native.requestCheckpoint` | `sessionId` |

Ordinary messages remain capped at 64 KiB; document transfers are separately capped at 512 KiB. The web sends one pending save at a time, coalesces later edits, and retries the same request after an acknowledgment timeout. The native host coalesces duplicate in-flight IDs. A saved label requires a matching acknowledgment after successful storage. Corrupt, stale or conflicting saved generations pause saving and disable Save to protect the existing file; ordinary write failures retain an explicit retry. Session replacement rejects stale messages and clears editor state before restoring a stopped model.

Structural edits coalesce for 200 ms. Moving trains checkpoint at a bounded five-second interval, with explicit Save and lifecycle checkpoints as additional triggers. Forced termination can still lose unacknowledged changes; hardware power-loss immunity is not claimed.

The browser store is exclusively an internal development fallback. It uses atomic localStorage key replacement, previous-generation recovery and an accidental-corruption checksum. The Swift app always uses native storage and SHA-256. LocalStorage is not the production save authority.

## Verification and provenance

Run `npm run check`, `npm run bundle:ios`, and `npm run test:browser`. Browser tests operate the real controls, place scenery, undo/redo, save/reopen, inject damaged generations, simulate native acknowledgments, exercise pinch/keyboard behavior, inspect portrait controls and name editing in a reduced viewport, and restore a deliberately lost WebGL context. The lighting recovery test compares actual rendered pixel channels so a resumed but incorrectly lit scene fails.

The native Actions workflow compiles the actual Swift host, exercises document/store/session tests and runs the packaged UI. Its result bundle and exported UI screenshots are retained as artifacts. Source existence and simulator timing are not hardware evidence.

All scene meshes, canvas material textures, icons and whistle tones are original procedural project code; no runtime image/model/audio download is required. [Prototype provenance](../../assets/PROCEDURAL_PROTOTYPES.md) distinguishes these sources from future approved GLB/KTX2 artwork.

## Remaining product work

This slice has one fixed loop and one current document. It does not implement arbitrary track construction, branch/turnout route latching, signals, grades, the complete layout library/import/export system, production native audio/haptics, full settings/localization, final launch artwork, or final Duo posture UX. The original P01–P30 gates remain the authority for those capabilities. Device performance/thermals, final visuals, supported Duo-only distribution, name/rights review and owner-controlled release remain unaccepted.
