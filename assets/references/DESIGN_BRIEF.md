# Launch kit: physical credibility before effects

P10-T01 inventory, 2026-10-27. This is a production brief, **not completed artwork**.

## Coherent original direction

A cared-for fictional Alpine branch railway in a walnut/brass display case. Choose a compact six-coupled tank locomotive with restrained green paint, a passenger coach and an open wagon. Buildings share plaster, timber and restrained roof colors. Timber sleepers, small aggregate and subtly flocked scenery reinforce miniature craft. Do not assemble a collage of the exact commercial products in the registry. Historic museum mechanisms and modern concrete track are comparison references, explicitly not the chosen era/style.

The original board and model-scale decisions remain in [ADR-0005](../../docs/decisions/ADR-0005-scale-and-model.md). Case hardware lives at carrying-case scale, while railway objects use the 1:87 design convention. Never divide the case by 87 or interpret a museum display-base dimension as a locomotive body dimension.

## Priority and identity

[launch-kit.json](launch-kit.json) is the machine-readable required launch inventory. Every entry has an immutable ID, minimum family/variant count, priority, responsible role, production task, reference links and explicit dimension status. Matching planned entries are in [the asset catalog](../catalog.json).

- Priority 0: credible case/closure, hero train, route geometry, station, terrain and calibrated materials. These establish the image; effects cannot rescue them.
- Priority 1: working points/signals, bridge/tunnel, coherent village/trees, day/night and audio. These complete the promised railway, not optional decoration.
- Priority 2: supporting props with proportionate production effort.

Rain/snow, extra locomotive fleets, heavy cinematic effects and photo optics are not added to the mandatory launch list. Their existing roadmap gates still apply.

Planned IDs do not replace saved `workbench.*` or schema-v1 kind identities automatically. Production integration needs a compatibility mapping, stable footprints/sockets and migration tests. Preserve old layouts; do not move a user's station or detach their train just to fit new art.

## Dimensions and open research

`source-reported` means stated by a publisher, not measured by our team. `authored-design` means a project choice, not a real object's measurement. `unresolved` means blockout/reference work is still needed. No hidden guesses are represented as measured bounds.

The registry deliberately exposes gaps: timber sleeper/turnout detail, original tank-engine front/rear design, case latch and closed section, species-specific deciduous branching, masonry/bridge construction and neutral wood/stone/glazing swatches need further research during their production tasks. P10-T01 establishes safe research destinations and asset responsibilities; it does not falsely close those tasks' multi-view reference or final art criteria.

Required original design sheets before modelling:

1. Train: side/front/rear/underside, axle centers, wheel radius, crankpins, rods, coupler sockets, minimum-curve swept envelope. Do not copy Planet's historic wheel arrangement into the fictional tank engine.
2. Case: matching base/lid coverage, hinge axis/knuckles, screw and latch sections, internal depth and full closure envelope. Current decorative half-depth lid is not an approved mechanism.
3. Route: dimensioned rail profile, sleepers and fasteners, joints, stock/point rails, frog and buffers; visual route must equal model topology.
4. Village: consistent doorway/figure ruler, real wall/roof thickness, window recesses, foundations and paths linking buildings to the station.
5. Landscape: bounded mounds, rail ballast edges, pond banks and restrained material variation. Reject uniform empty green planes and evenly spaced bead borders as final craft.
6. Trees: varied branch silhouettes, trunk/base integration, flock-sized surface detail and screen-space stability. No smoothly stacked cones as approved foliage.

## Capture and critique checklist

Use [the visual acceptance contract](../../docs/graphics/VISUAL_ACCEPTANCE.md), preserving raw capture metadata and evidence class. No generated concept is a runtime screenshot.

- Neutral overview: whole case and route readable; composition includes foreground inspection space and a connected village rather than scattered copies.
- Hero side/front/macro: wheel/rail contact, true open spokes where designed, attached crankpins, rod/cylinder clearance, distinct enamel and metal.
- Moving curve: slow forward/reverse start/stop, coupling clearance and distance-synchronized wheels; steam originates at the transformed chimney.
- Case boundary: open, intermediate and closed design poses; no unexplained partial lid or scenery crushing. Simulator/synthetic poses are labelled.
- Material swatches: neutral/grazing light with fixed exposure; wood grain, ballast, paint, brass and glazing distinguishable without grading.
- Station/trees: roof thickness, grounded foundations, lamps/window readability at night, irregular foliage outline in motion.
- Editor/compact viewport: readable labels and practical touch targets; overlays do not hide the train or selected object. A desktop shot cannot establish Duo ergonomics.

No final visual scores have been assigned by this task. Reference listing, schema validation and source-code hashes prove neither photorealism nor real-device performance. Final owner/art and physical-Duo gates remain open.
