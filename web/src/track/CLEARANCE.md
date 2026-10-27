# Planar operating clearance and editable drafts — P05-T05

## Supported scope

`clearance.ts` validates the current constrained planar track kit. It uses the validated P05 topology, including both explicit routes of each turnout. Geometry remains in miniature metres, with +Y up and the board in XZ. The operating board is 0.8 × 0.5 m and the supported rail base is Y = 0, with a 1e-9 m numeric plane tolerance. Grade and bank are zero. `pitch`, `roll`, explicit `grade`, flexible splines, implicit branches and uncertified bridge crossings are unsupported; the editor reports them instead of silently discarding their fields or flattening a layout.

The caller must supply the catalog's conservative vehicle envelope:

- `halfWidth`: maximum lateral sweep including the body, swing/overhang, axle and coupler constraints. It must be at least 0.005 m and no more than one quarter of the declared minimum radius.
- `height`: full clearance height, 0.004–0.2 m.
- `minimumRadius`: the vehicle's supported minimum operating radius, 0.1–1 m.

These are validated declared inputs, not proof that any production vehicle has been measured or certified. P06/asset integration must derive and verify the envelope against the actual vehicle geometry. The tests use a declared 0.015 m lateral half-width, 0.05 m height and 0.1 m minimum radius. Static track width also matters: the effective lateral bound is the greater of the declared half-width and half the 0.029 m sleeper length, plus a 0.0001 m margin.

## Conservative geometric test

Straight and circular centerlines are adaptively sampled with a maximum 0.00001 m chord error, 0.01 m segment length and π/24 rad tangent change. Analytic route length remains authoritative. Every curved segment's capsule radius is enlarged by the maximum chord error, so the polygonal approximation cannot create a false-clear gap. Straight segments do not need this error allowance.

The test checks the complete lateral envelope against the case boundary, then checks intersecting expanded part bounds and segment capsules. It also checks a single piece for nonlocal self-overlap, including almost/full circles whose unconnected ends meet. A train may fit an open, incomplete track without the draft being a closed circuit; closure is not a creative objective or a required global condition.

Only two kinds of overlap are exempt:

1. The two routes of the same authored turnout occupy one protected manufactured region and are mutually exclusive during operation.
2. An explicitly validated connection may overlap within a local endpoint neighbourhood of four effective lateral radii on both pieces. The exemption covers only segments entirely within that neighbourhood. It does not exempt remote intersections between the same two pieces. Turnout stock connections apply to both route origins, while straight/diverging branch connections apply to their respective endpoints.

Visually touching endpoints without an explicit connection are not exempt. Connector geometry still has to satisfy the existing 0.2 mm position and 0.25° opposed-tangent validation. Clearance acceptance does not replace visual seam review.

Raised crossings never pass this v1 gate. If their vertical separation is below the declared vehicle height plus the 0.004 m track-bed allowance, the diagnostic is `vertical-clearance`. At or above that separation, the diagnostic is still `unsupported-overpass`, because height alone does not establish an authored bridge, supports or traversable grade connections. Every off-plane piece also receives `unsupported-elevation`. A later bridge kit requires a deliberate schema/catalog extension and its own measured bounds.

## Bounded work and feedback

The inherited topology limit is 500 compiled pieces, including two internal pieces per turnout. Clearance work additionally stops at 32,768 sampled segments, 3,000,000 segment-pair comparisons or 64 diagnostics. Reaching a budget returns a non-operable result and an explicit capacity diagnostic; it never returns a partial pass. The sample count may exceed its cap by the final bounded piece's sample count before the validator returns.

Diagnostics have stable `code`, sorted physical `pieceIds` and an actionable message. Internal turnout-route IDs are reported as the physical turnout ID. Input order does not change the diagnostic order. No candidate geometry or connection is moved, repaired or discarded by this validator.

## Editor and placement transaction

`editor/placementValidation.ts` composes input-shape validation, P05 topology, geometric clearance and `RoutedConsist.place`. `TrackPlacementDraft` retains bounded JSON drafts even when their topology or clearance is invalid. An edit increments a local draft revision, and the caller can retrieve a detached copy for continued editing. An invalid draft is distinct from invalid non-JSON/oversized data: the latter is rejected without replacing the last editable draft.

The draft limit is 512 KiB of UTF-8 JSON and 10,000 visited JSON values. Nonfinite numbers, functions, symbols, undefined values, big integers and cyclic structures are rejected without losing the prior draft.

`placeTrain(request, expectedRevision, "edit")` is the explicit transaction boundary. It requires paused edit mode and the current draft revision, then rebuilds and revalidates the candidate instead of trusting a cached preview. Clearance must pass before the complete train footprint is placed. The route kernel then verifies support for every interval of the train, including selected turnout routes. A too-long train on short disconnected track reports `insufficient-route` while keeping that track editable.

Only a successful placement replaces the committed train/topology reference. Failed placement, stale commands and unsafe new drafts preserve the previous committed train and its state. Preview edits do not mutate the committed operating topology. The integrating fixed-tick controller is responsible for parking motion when it enters edit mode; this module requires that explicit mode assertion and does not own a second motion clock.

## Verification and remaining integration

`track-clearance.test.ts` verifies circuits, authored turnouts, disconnected track, crossing/parallel/self-overlap, endpoint exemptions, case boundaries, vehicle radius boundaries, raised-crossing limits, deterministic diagnostics and bounded sampling. `placement-validation.test.ts` exercises the actual composed draft → topology → clearance → routed train flow, including invalid-draft preservation, successful correction/placement, occupied turnout locks, paused editing, stale revisions and rejection without losing the committed train.

This component does not yet replace the app's oval editor, its native validator or `tin-junction-layout` schema version 1. No graphical ghost placement, native inspector, migration, production vehicle certification, rendered bridge/turnout art or physical-device performance is claimed by these tests. Those integrations remain later gates; invalid drafts here are transient editor data, not automatically valid saved layouts.
