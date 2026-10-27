# Interaction design — operate a physical miniature

Status: PROPOSED. Concrete gestures, thresholds and haptics require a Duo device review. This document defines intent and state rules, not verified hardware behavior.

## 1. Interface hierarchy

The railway is the main content. Persistent controls should be few and readable: operate/edit mode, throttle/stop, layout library and a compact settings entry. Tool palettes appear when relevant and dismiss without destroying a pending layout.

Native SwiftUI owns accessibility-critical controls, system sheets, save/error feedback and document actions. The Three.js surface owns spatial picking, scene handles and visual previews. A single command dispatcher serializes changes from both surfaces.

Do not place transparent native controls over every mesh. Do not make thousands of scenery triangles independently accessible. Provide a native object list/inspector as an alternative path for selection and essential editing.

## 2. Modes and transition rules

| From | Event | Preconditions | Result |
|---|---|---|---|
| Loading | Valid scene and bridge ready | Matching protocol and valid snapshot | Operate, train stopped |
| Operate | Enter edit | No unacknowledged critical command | Pause at a tick boundary; store operating state |
| Edit | Place/move/delete | Validation succeeds | Commit one undoable transaction |
| Edit | Exit edit | No unresolved placement preview | Commit checkpoint; return stopped |
| Any interactive mode | Open library | Pending transaction resolved | Checkpoint then show library |
| Any | Scene inactive/background | None | Cancel active gestures; stop audio; checkpoint |
| Any | Web process loss | None | Native recovery state; no repeated blind reload loop |
| Recovery | Valid last-known-good snapshot | Schema and assets available | Restore safely stopped with notice |

Entering edit mode is not a destructive restart. Leaving edit mode must not resume a previously nonzero throttle automatically.

## 3. Operating controls

### Throttle

- Use a large, native, accessible control with a value and text label, not a tiny unlabeled rotary decoration.
- Normalize the request to a bounded command, not a render-frame velocity assignment.
- A zero throttle permits documented coasting/braking behavior; a separate obvious Stop action guarantees stopping within the simulation's configured envelope.
- Haptic detents, if approved, emphasize meaningful positions rather than continuously vibrating.
- Accessibility increment/decrement actions follow the same command path as touch.
- Display requested and actual movement coherently; do not present maximum throttle as instantaneous speed.

### Direction

- Direction is a deliberate separate choice, not a sign accidentally crossed while adjusting throttle.
- Initial policy: stop first, then reverse. Do not suddenly negate velocity while a consist is moving.
- Preserve vehicle order, route history and coupling geometry through reversal.
- Expose selected direction in text/accessibility, not only an arrow color.

### Stop

- Always reachable in operating mode, never hidden behind a decorative drawer.
- Respond immediately at the UI/command level; braking follows the documented simulation envelope.
- During failure, show stopped/recovering state only when justified. Never claim a command was acknowledged if the bridge did not acknowledge it.

### Turnouts and signals

- Tap a turnout handle or choose it from the native track inspector.
- Show its actual latched route and whether occupancy prevents switching.
- A rejected operation explains the cause with a short message and optional restrained haptic.
- Signals derive from route/occupancy logic. A decorative toggle may not disagree with actual train behavior.

## 4. Camera and gesture ownership

| Gesture | Operate mode | Edit mode |
|---|---|---|
| One-finger drag on empty scene | Bounded orbit | Pan/orbit according to the selected editor tool |
| Two-finger drag | Pan the miniature within the case | Pan while retaining selection |
| Pinch | Bounded zoom/dolly | Zoom/dolly, never scale an object |
| Tap | Select train/turnout or clear selection | Select object/connector |
| Drag a selected handle | Only explicit operating controls | Move/rotate with a ghost preview |
| Double tap | Optional discoverable focus action | Same focus action, never destructive |

Arbitration rules:

1. Native sheet/control hit testing wins within actual control bounds.
2. A gesture has one owner until end/cancel.
3. Exceeding tap slop cancels a pending tap; the same gesture cannot toggle a turnout and orbit.
4. A second pointer upgrades or cancels deterministically, without duplicating a command.
5. Resizing, posture transition, suspension and process loss cancel active gestures.
6. Non-finite deltas and implausible pointer jumps are rejected.

Thresholds use logical points or normalized values, not model-specific raw pixels. Record tested values in configuration during implementation.

Camera requirements:

- Keep ordinary viewing above the model base; use a deliberate inspection mode for low angles.
- Bound near/far planes and approach distance so normal gestures cannot slice the locomotive.
- Derive framing from board/selection bounds, not a device resolution constant.
- Provide a reset-view control.
- Disable strong depth of field in editing; joints and handles stay sharp.
- Reduced Motion disables overshoot and flourish while keeping necessary adaptive layout.

## 5. Track construction

1. Enter edit mode and pause at a tick boundary.
2. Choose a piece; show shape, dimensions and compatible connectors.
3. Move a ghost over the board; show valid/invalid feedback.
4. Snap only when within positional/angular tolerance and candidate selection is unambiguous.
5. Rotate with a visible control. Curved-piece handedness is explicit.
6. Confirm; revalidate against the latest layout revision.
7. Commit piece, connectors and graph edges as one undoable transaction.

| Rejection | Required feedback |
|---|---|
| Endpoints do not meet | Highlight the gap and intended connector |
| Tangents incompatible | Show orientation guides |
| Unsupported height/grade | Show expected plane/height |
| Outside case | Outline the board edge and conflicting part |
| Protected clearance collision | Identify the conflicting object |
| Train occupies affected track | Explain how to move/reset the train safely |
| Invalid turnout route | Identify the disconnected exit |

Do not auto-delete content, change certified curve radii or distort a track to force a connection. Snapping changes a rigid pose, not geometry dimensions.

Connectivity assistance is not a puzzle score. Open lines with valid buffers are allowed. The app can show an incomplete connection without declaring the entire creative layout a failure.

## 6. Scenery editing

- Use authored miniature scale; arbitrary stretching is not the default.
- Rotate around an authored ground-contact pivot.
- Ghosts remain transient; no permanent shadows, collisions or save entries before commit.
- Ground snap uses a designated collision surface, not incidental visible mesh bounds.
- Enforce rolling-stock clearance unless a separately approved non-operating decorative state exists.
- Duplicate creates new stable IDs while sharing immutable asset data.
- Single-object placement is mandatory; multi-select/grouping is a separately gated enhancement.
- Deleting selection updates the native inspector and chooses a predictable next focus target.

## 7. Undo/redo behavior

- One drag produces one committed command, not one command per pointer event.
- Cancel produces no history item.
- Composite edits are atomic. Track plus generated support/ballast is one transaction.
- A new edit after Undo clears the redo branch.
- Cross-layout undo is forbidden. Cross-session history is not promised by v1.
- Undo cannot resurrect unknown assets or overwrite newer native revisions.
- A documented memory/history cap prevents unbounded growth.
- All tools use the same transaction system; no exceptional UI-only deletion code path.

## 8. Layout library and save confidence

Each layout has a name, generated thumbnail, modified time and relevant save/recovery status. No unnecessary personal metadata is stored.

| Action | Safety rule |
|---|---|
| Open | Validate before replacing current world; failed load preserves current scene |
| Duplicate | New document ID; no shared mutable arrays |
| Rename | Validate length/control characters and commit atomically |
| Delete | Confirm or provide real recoverable trash; no imaginary undo |
| Export | Explicit system share sheet; versioned data; no private paths |
| Import | Offline validation; no partial merge on failure |
| Restore factory layout | Create a fresh personal copy; never overwrite same-name user data |

Save states: Unsaved changes → Saving → Saved, or Save failed/Recovered. “Saved” is shown only after native acknowledgment for the matching revision.

## 9. Duo posture composition

| Situation | Presentation | Simulation |
|---|---|---|
| Fully open inner display | Full railway viewport with compact controls | Runs while foreground-active |
| Partially open usable regions | Native-designated railway viewport plus control region | Coordinates/topology unchanged |
| Closing/transition | Cancel gestures; restrained case effect | Checkpoint and pause on inactive state |
| Outer display | Compact same-device preview or paused case | No hidden duplicate scene work |
| Split-view resize | Reflow controls and update camera aspect | Preserve world and commands |
| Reserved region intersects a control | Relocate/collapse control | Never conceal Stop or a required action |

Native viewport messages use logical points plus reserved rectangles; hinge messages use explicit degrees. Raw hinge angle is not a layout authority. Never infer the crease from half the display width.

Case-opening animation affects presentation only. It does not bend the physics track, stretch a train or change connectivity. A half-open layout must not depict a train crossing a visually disconnected hinge. Exact layout and perspective require actual-device review, not just a browser mock.

## 10. Sound and haptics

- Audio starts only when active and allowed by the native session policy.
- Handle interruptions and route changes; test headphones and speaker on hardware.
- Train loops follow actual speed, not requested throttle.
- Whistle has bounded duration and repeat protection.
- Switch clicks align with accepted operations, not rejected taps.
- Haptics are reinforcement, never the only feedback.
- Master sound and ambience preferences persist.
- Native suspension silences playback even if JavaScript is delayed.

## 11. Accessibility acceptance

- Useful labels, values, traits and increment/decrement actions on essential native controls.
- Tested large text sizes without clipped critical actions.
- VoiceOver can stop, adjust throttle, switch mode, open a layout and operate selected turnout.
- Shape/outline/text supplement color-only states.
- Native inspector offers an alternative to precision 3D picking for essential edits.
- Reduced motion/sensory effects do not weaken simulation correctness.
- Hit targets are reviewed against current platform guidance rather than inherited from tiny visual knobs.
- No per-frame accessibility announcement spam.

## 12. Error language

Examples of truthful, actionable wording:

- “This layout could not be saved. Your current edits are still open. Try again or export a copy.”
- “This turnout is occupied. Stop and move the train clear before changing the route.”
- “This layout was created by a newer version. The original file has not been changed.”
- “The railway view restarted. We restored your last saved layout.”

Never say everything is saved when edits lack acknowledgment. A raw stack trace is not a user explanation. Detailed diagnostics belong in a separate native view with sensitive values redacted.

## 13. End-to-end usability trial

Test the complete path: first launch → drive → stop → edit → undo → save → close/reopen device → switch layouts → recover from invalid import. Record observed failures, build/device, specific corrective change and retest. A visual approval cannot substitute for this interaction trial.

Related: [Product](PRODUCT_SPEC.md), [persistence/editor](../architecture/PERSISTENCE_AND_EDITOR.md), [Duo platform](../architecture/DUO_PLATFORM.md), [test strategy](../quality/TEST_STRATEGY.md).
