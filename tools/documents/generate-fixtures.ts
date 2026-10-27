/** Run with pinned esbuild: bundle this file for Node, then execute from repo root. */
import { mkdirSync, writeFileSync } from "node:fs";
import { buildTurnoutTopology } from "../../web/src/track/turnout";
import { RoutedMotion } from "../../web/src/simulation/routedMotion";
import { consistFootprint, DEFAULT_VEHICLES, VEHICLE_CATALOG_VERSION } from "../../web/src/simulation/vehicleCatalog";
import type { ConsistVehicle } from "../../web/src/simulation/vehicleCatalog";
import { DESIGN_CATALOG_VERSION, parseLayoutDesign } from "../../web/src/documents/layoutDesign";
import { circleFixture, straightPiece } from "../../tests/fixtures/track/graph-fixtures";
import { turnoutFixture } from "../../tests/fixtures/track/turnout-fixtures";

const copy = <T>(input: T): T => JSON.parse(JSON.stringify(input)) as T;
const base = () => ({ format: "tin-junction-layout", schemaVersion: 2, documentId: "design-conformance", revision: 0,
  name: "My railway", seed: 12345, catalogVersion: DESIGN_CATALOG_VERSION, boardId: "workbench.case",
  track: { revision: 0, pieces: [], turnouts: [], connections: [] }, selections: [], train: null, scenery: [], environment: { timeOfDay: "day" } });
function trainDocument(input = { ...circleFixture(), turnouts: [] as ReturnType<typeof turnoutFixture>["turnouts"] }, vehicles: readonly ConsistVehicle[] = DEFAULT_VEHICLES, edgeId = "curve-0/forward", rearDistance = 0.01) {
  const built = buildTurnoutTopology(input);
  if (!built.ok) throw new Error(JSON.stringify(built.diagnostics));
  const placed = RoutedMotion.place(built.value, { trainId: "train-01", length: consistFootprint(vehicles), rear: { edgeId, distance: rearDistance } });
  if (!placed.ok) throw new Error(placed.message);
  const motion = placed.motion.snapshot();
  return { ...base(), track: copy(input), selections: copy(motion.consist.selections), train: { id: "train-01", catalogVersion: VEHICLE_CATALOG_VERSION, vehicles: copy(vehicles), motion } };
}
type Case = { id: string; valid: boolean; input: unknown };
const cases: Case[] = [];
const add = (id: string, valid: boolean, input: unknown) => cases.push({ id, valid, input: copy(input) });
const invalid = (id: string, mutate: (document: any) => void, source: unknown = trainDocument()) => { const document: any = copy(source); mutate(document); add(id, false, document); };

add("empty-editable-design", true, base());
add("three-vehicle-circle", true, trainDocument());
add("one-engine-circle", true, trainDocument(undefined, [DEFAULT_VEHICLES[0]!]));
add("occupied-turnout", true, trainDocument(turnoutFixture(), DEFAULT_VEHICLES, "approach/forward", 0.2));
const reverse = trainDocument();
const topology = buildTurnoutTopology(reverse.track);
if (!topology.ok) throw new Error("Fixture topology failed.");
const restored = RoutedMotion.restore(topology.value, reverse.train.motion);
if (!restored.ok) throw new Error(restored.message);
restored.motion.reverse(); restored.motion.setThrottle(0.4);
for (let i = 0; i < 45; i++) restored.motion.step();
reverse.train.motion = restored.motion.snapshot(); add("reversed-moving-checkpoint", true, reverse);
const bigCircle = circleFixture();
bigCircle.pieces = bigCircle.pieces.map(piece => ({ ...piece, centerline: { kind: "arc", radius: 0.15, sweep: Math.PI / 2 }, pose: { ...piece.pose, x: piece.pose.x * 1.5, z: piece.pose.z * 1.5 } }));
const eight: ConsistVehicle[] = [DEFAULT_VEHICLES[0]!, ...Array.from({ length: 7 }, (_, index) => ({ id: `wagon-${index}`, catalogId: "wagon-01" as const }))];
add("eight-vehicle-circle", true, trainDocument({ ...bigCircle, turnouts: [] }, eight));
const max = base() as any;
max.track.pieces = Array.from({ length: 500 }, (_, index) => ({ ...straightPiece(`piece-${index}`), centerline: { kind: "straight", length: 0.001 } }));
max.scenery = Array.from({ length: 128 }, (_, index) => ({ id: `tree-${index}`, kind: "fir", x: -0.35, z: -0.2, rotation: 0, scale: 1 }));
add("maximum-editable-design-budget-not-operation-proof", true, max);
const names = base(); names.name = "🚂".repeat(80); add("eighty-unicode-scalars", true, names);
const open = base() as any; open.track.pieces = [straightPiece("disconnected")]; add("disconnected-editable-track", true, open);

invalid("future-schema", document => { document.schemaVersion = 3; });
invalid("legacy-needs-explicit-migration", document => { document.schemaVersion = 1; });
invalid("unknown-layout-kit", document => { document.catalogVersion = "unavailable-kit"; });
invalid("unknown-case", document => { document.boardId = "unknown-case"; });
invalid("unexpected-script-field", document => { document.script = "remote executable"; });
invalid("boolean-revision", document => { document.revision = true; });
invalid("fractional-revision", document => { document.revision = 0.5; });
invalid("exhausted-counter", document => { document.revision = 9_000_000_000_000_001; });
invalid("invalid-seed", document => { document.seed = -1; });
invalid("control-character-name", document => { document.name = "Train\u0085name"; });
invalid("blank-name", document => { document.name = " \ufeff "; });
invalid("too-many-name-scalars", document => { document.name = "🚂".repeat(81); });
invalid("unknown-centerline-fields", document => { document.track.pieces[0].centerline.controlPoints = []; });
invalid("unsupported-gauge", document => { document.track.pieces[0].gauge = 0.02; });
invalid("duplicate-piece-identity", document => { document.track.pieces[1].id = document.track.pieces[0].id; });
invalid("misaligned-connection", document => { document.track.pieces[1].pose.x += 0.001; });
invalid("unknown-connection-socket", document => { document.track.connections[0].a.socketId = "unknown"; });
invalid("occupied-socket-twice", document => { document.track.connections.push({ ...document.track.connections[0], id: "duplicate" }); });
invalid("too-many-pieces", document => { document.track.pieces.push({ ...document.track.pieces[0], id: "over-limit" }); }, max);
invalid("missing-turnout-selection", document => { document.selections = []; }, trainDocument(turnoutFixture(), DEFAULT_VEHICLES, "approach/forward", 0.2));
invalid("inconsistent-turnout-selection", document => { document.selections[0].route = "diverging"; }, trainDocument(turnoutFixture(), DEFAULT_VEHICLES, "approach/forward", 0.2));
invalid("unknown-vehicle-catalog", document => { document.train.catalogVersion = "newer-vehicles"; });
invalid("unknown-vehicle-asset", document => { document.train.vehicles[1].catalogId = "missing-coach"; });
invalid("duplicate-vehicle-instance", document => { document.train.vehicles[1].id = document.train.vehicles[0].id; });
invalid("noncanonical-vehicle-order", document => { document.train.vehicles.reverse(); });
invalid("mismatched-train-identity", document => { document.train.id = "different-train"; });
invalid("insufficient-retained-footprint", document => { document.train.motion.consist.length -= 0.001; });
invalid("missing-history-interval", document => { document.train.motion.consist.intervals.pop(); });
invalid("unknown-history-edge", document => { document.train.motion.consist.intervals[0].edgeId = "missing/forward"; });
invalid("stale-topology-checkpoint", document => { document.train.motion.consist.topologyRevision = 1; });
invalid("invalid-emergency-power", document => { document.train.motion.emergency = true; document.train.motion.throttle = 1; });
invalid("unknown-motion-field", document => { document.train.motion.rendererHandle = 42; });
const nearEnd = trainDocument(turnoutFixture(), [DEFAULT_VEHICLES[0]!], "main/forward", 0.17);
invalid("unsafe-moving-stopping-envelope", document => { document.train.motion.speed = 0.18; document.train.motion.throttle = 1; }, nearEnd);
invalid("unknown-scenery-asset", document => { document.scenery = [{ id: "s", kind: "downloaded-tree", x: 0, z: 0, rotation: 0, scale: 1 }]; });
invalid("scenery-whole-footprint-outside-board", document => { document.scenery = [{ id: "s", kind: "oak", x: 0.38, z: 0, rotation: 0, scale: 1 }]; });
invalid("duplicate-scenery-identity", document => { document.scenery[1].id = document.scenery[0].id; }, max);
invalid("unknown-environment", document => { document.environment.timeOfDay = "downloaded-weather"; });

for (const test of cases) {
  const observed = parseLayoutDesign(test.input);
  if (observed.ok !== test.valid) throw new Error(`Fixture ${test.id} expected ${test.valid}: ${JSON.stringify(observed)}`);
}
// Generated resource: one case per line keeps repeated budget fixtures compact.
// The authored generator above is the reviewable specification of each case.
const encoded = '{"schemaVersion":1,"format":"tin-junction-design-conformance","cases":[\n'
  + cases.map(test => JSON.stringify(test)).join(",\n") + "\n]}\n";
for (const directory of ["tests/fixtures/documents", "apps/ios/TinJunctionTests/Fixtures"]) {
  mkdirSync(directory, { recursive: true }); writeFileSync(`${directory}/layout-design-v2-corpus.json`, encoded);
}
console.log(`Wrote ${cases.length} independently specified shared design-format cases to web and native test resources.`);
