# Tin Junction — product specification

Status: PROPOSED product requirements. This document is not evidence of implementation or release readiness.

## 1. Product promise

Tin Junction is an offline, premium digital model railway inside a tactile folding case, designed exclusively for iPhone Duo. The pleasure is the same as owning a beautiful working miniature: open it, run a train, operate a switch, rearrange the scenery, and make the little world your own.

It is not a railroad business simulator. It does not test the player with puzzles, require deliveries, award coins, or make creativity depend on progression. A visitor should understand the product by watching a real train move through a real-looking miniature scene, not by reading a story or completing a tutorial.

Working brand: **Tin Junction**. Proposed subtitle: **Pocket Railway**. These remain provisional until the owner completes name and trademark clearance. Do not imply that the repository name establishes commercial rights.

Proposed business model: one upfront purchase around **$1.99**, with currency, regional prices and actual configuration requiring owner approval. Version 1 has no advertisements, subscription, consumable purchases or accounts. A repository task must not silently convert the business model to recover development costs.

## 2. Who the initial product is for

Primary design audiences:

1. A miniature-model enthusiast who wants to operate and arrange a convincing tiny railway without setting up a physical layout.
2. Someone who enjoys tactile objects, dioramas and calm creative play, even without railway knowledge.
3. An iPhone Duo owner interested in an experience whose presentation responds thoughtfully to the device opening and changing posture.

These are hypotheses, not a market-size estimate. Do not promise a revenue floor, install count or conversion rate. User research must distinguish enjoyment of a ten-second video from willingness to purchase and return to the app.

## 3. Product pillars and decisions they govern

| Pillar | Required consequence | A violation |
|---|---|---|
| A believable physical object | Materials, dimensions, sounds and motion agree at close viewing distances | Toy-like bevels combined with full-size vegetation and impossible wheel spacing |
| Immediate operation | The supplied layout can run without constructing anything | Requiring a tutorial or account before the train moves |
| Unpressured creativity | All included parts available immediately; mistakes reversible | Paying coins for a tree, timed tasks, mandatory daily streaks |
| Personal ownership | Durable local layouts, clear save feedback, export/recovery before public beta | Losing edits when the WebView process is terminated |
| Duo-specific physical interaction | Opening and posture affect presentation coherently and safely | Treating the hinge as an unbounded gameplay control or assuming screen dimensions |
| Quiet technical reliability | Offline operation, bounded heat, clear failures, accessible controls | A beautiful still image with crashes, excessive blur or unusable editing |

## 4. Version 1 scope

The first commercial release is deliberately one coherent, finished miniature kit rather than a broad catalog of inconsistent assets.

### 4.1 Included core experience

- One original Alpine-inspired miniature kit. It may suggest a region but must not copy a named railway, commercial model design, station identity or copyrighted branding.
- One fully finished original steam locomotive, with credible wheel and running-gear motion, lighting and layered sound.
- A small compatible carriage/wagon set sufficient for a simple consist. Launch quantity is set by the content review; the engine must support a locomotive plus at least two coupled vehicles.
- One beautiful ready-to-run layout available on first launch.
- User-controlled throttle, brake/stop, deliberate direction change, whistle and operational turnout selection.
- Simple signals associated with actual track occupancy and stop behavior. Signal appearances must agree with the simulation; decorative signals must be labeled or excluded from the interactive set.
- A constrained track kit that supports valid user-built continuous layouts: straights, selected radii, supported turnouts, buffers and the associated scenery interfaces.
- Scenery placement, rotation, removal and undo/redo for the included buildings, trees and props.
- Named local layouts, duplicate/delete with recovery, autosave, thumbnails and a clear last-saved state.
- Bounded viewing camera controls and a simplified native control interface.
- A coherent daylight preset and a coherent night preset. Smooth transition is optional until proven within budget; neither preset may break material readability or editing.
- Offline bundled content with no dependency on a server to open or run a purchased layout.
- Duo posture adaptation, safe-area and reserved-region handling, state preservation across open/close and resize transitions.
- Accessibility alternatives for the primary operations, including named native controls and non-color-only operating status.

### 4.2 Explicitly out of initial scope

- Puzzles, objectives, points, deliveries, schedules, economy, upgrades, unlock trees and collectible scarcity.
- Online multiplayer, social feeds, user accounts, public asset sharing, marketplace or subscription.
- Android, desktop, web or non-Duo iPhone consumer releases. A browser harness is a development tool, not a shipping SKU.
- Arbitrary track drawing with no geometric constraints; imported model-train formats; real railway signaling certification.
- Real-world train dispatching or physical model-railway hardware control.
- Physically exact steam thermodynamics, rail flex, wheel-flange multibody contact, derailment simulation and destructive crashes.
- A large locomotive catalog, multiple countries, large open worlds, terrain sculpting, complex gradients or procedural cities.
- Cloud synchronization, remote content delivery, AI-generated runtime assets or downloaded executable code.

This is a **credible model-railway simulation**, not an engineering simulator for real rolling stock. Visual contact and motion must be convincing; the physical model can be deliberately simplified and documented.

### 4.3 Optional polish after the core passes its gates

Rain, snow, wet surfaces, seasonal scenery, steam-density variation, a dedicated photo mode and more train variants are tracked as separate deliverables. They may be included in version 1 only after:

1. The operating/editing/save vertical slice is reliable.
2. A representative finished scene passes real-Duo sustained-performance tests.
3. The asset pipeline is reproducible and licensed.
4. The owner approves the additional scope without weakening core quality.

Marketing must list what actually ships. A roadmap entry is not a feature promise.

## 5. First minute of use

### First launch

1. A short native launch state appears while bundled resources load. A failure has a readable reason and recovery action; it is never a permanent black canvas.
2. The original ready-to-run layout appears in a deliberate daylight composition, with the train safely stopped at the station.
3. One restrained hint identifies the throttle. It is dismissible and does not cover the train or depend on color alone.
4. Moving the throttle starts the locomotive smoothly. Wheel rotation, sound and speed agree.
5. The user can look around, stop, sound the whistle and switch to editing without a reward screen or forced sequence.
6. Editing the supplied layout first creates a personal copy. The factory original remains restorable.

### Subsequent launch

- Restore the last selected layout, camera and preferences from the last acknowledged save.
- Restore the train safely stopped unless a later owner-approved policy explicitly allows automatic movement. Opening an app must not make an unseen train unexpectedly accelerate.
- Show a subtle recovery notice if a last-known-good backup was used. Do not silently reset a personal layout.
- Do not show repeated purchase prompts, daily messages, forced review prompts or network-dependent content.

## 6. Main experience modes

| Mode | User's intent | Simulation policy | Safe exit |
|---|---|---|---|
| View/operate | Watch and drive the railway | Fixed-tick simulation runs while foreground-active | Stop or enter edit mode |
| Edit track | Change physical connectivity | Train paused; affected routes locked against movement | Commit a valid transaction or cancel |
| Edit scenery | Arrange included objects | Initially pause by default; live scenery editing is a later measured UX decision | Commit placement or cancel |
| Layout library | Open, duplicate, rename, export or remove layouts | Current session checkpoints before switching | Return to current or successfully loaded layout |
| Settings/accessibility | Change preferences | Pause if the scene is fully covered; no hidden unbounded work | Apply reversible preferences |
| Recover/error | Understand and repair a failed load/save | No uncontrolled simulation | Retry, restore backup, export diagnostic summary or return safely |

The controls must make the current mode explicit. Do not overload one drag gesture with camera motion, object movement and track construction at the same time.

## 7. Duo-specific scope

The commercial product requirement is **iPhone Duo only**. Internal web tests and generic simulator tests do not change that requirement.

Three distinct behaviors must not be conflated:

- **Physical hinge:** observed from supported native APIs; may drive the case-opening presentation.
- **Usable layout regions:** reported by the platform and used to place controls and the scene.
- **Simulation world:** a stable miniature coordinate system with unchanged track geometry and connectivity.

Folding the phone must not stretch railway curves, bend a saved layout, relocate a train, or accidentally operate a switch. A half-open presentation may use one native-designated region for the railway and another for controls. It must not depict a train driving across a visually disconnected crease. Exact posture composition requires on-device usability and visual review.

The outer display is still part of the same Duo device. Its product behavior is a deliberate compact preview/control or safely paused case state, not evidence that ordinary iPhone devices are supported. The initial implementation may use a compact paused preview until the full interaction is approved.

**Release blocker:** documented distribution enforcement has not yet been established. `TARGETED_DEVICE_FAMILY = 1` selects the iPhone family, not a single model. Do not add invented capability keys or use unrelated hardware requirements to exclude devices. If Apple cannot support the intended commercial restriction, request an owner decision before release; never broaden distribution silently.

## 8. Realism definition

The desired appearance is a photograph of a hand-built miniature railway, not a photograph of a full-sized landscape. The case edge, rail gauge, tiny ballast, paint finish, model trees, glazing and restrained scenery imperfections reinforce one consistent scale.

Graphics acceptance requires:

- Runtime captures from the actual app, not concept art.
- Whole-layout, rail-height and close-up views with no hidden geometry failures.
- Moving views that reveal aliasing, LOD transitions, wheel contact and animation quality.
- A physically coherent material/lighting workflow, not layers of blur and bloom.
- Real-device frame-time, memory and thermal evidence at the approved visual tier.

The word “hyperrealistic” is a quality target. It is never a task completion criterion by itself. Use the criteria in the graphics specifications.

## 9. Data ownership and privacy

- No account is required to purchase, launch, edit or save.
- User layouts are local documents, not analytics events.
- The app does not request camera, microphone, location, contacts or tracking permission for ordinary railway use.
- Audio playback does not justify microphone access.
- Crash reports and test diagnostics must not include personal layout names, file contents or identifiers without a separately approved policy.
- Sharing/export happens only through an explicit user action and the native system interface.
- Deleting a layout needs confirmation or a clear recoverable undo path. Reinstall/backup behavior must be explained accurately; do not promise persistence across uninstall.

## 10. Validation with people

Before the beta, conduct observed sessions with both model-railway enthusiasts and people unfamiliar with the hobby. Proposed questions:

1. Can they start and stop the train without instruction?
2. Do they understand why the phone's posture changes the controls?
3. Can they build one valid loop and recover from one invalid placement?
4. Do they know whether their changes are saved?
5. Do they come back to alter the layout after the initial novelty?
6. Would they choose the app at the proposed price after using it, rather than merely liking its trailer?

Record participant consent, build, device, task, observed behavior and actionable findings. Avoid collecting unnecessary personal information. A small study can expose usability failures; it cannot establish a revenue forecast.

## 11. Product acceptance boundaries

The product is not ready if any of these remain true:

- The scene operates only in a desktop browser.
- The train moves but cannot reliably save or recover user edits.
- The only attractive image is a staged screenshot at an unusable quality setting.
- Launch content mixes temporary primitives with final art.
- The controls are unreachable in a supported Duo posture.
- Distribution, name clearance, content rights or release approval are unresolved.
- A required test is skipped and its absence is presented as success.

## 12. Related specifications

- [Interaction design](INTERACTION_DESIGN.md)
- [System architecture](../architecture/SYSTEM_ARCHITECTURE.md)
- [Simulation and tracks](../architecture/SIMULATION_AND_TRACKS.md)
- [Persistence and editor](../architecture/PERSISTENCE_AND_EDITOR.md)
- [Art direction](../graphics/ART_DIRECTION.md)
- [Release gates](../quality/RELEASE_GATES.md)
