import { alignModuleSocket, RAIL_PROFILE, trackConnectors } from "../../../web/src/track/module";
import { sampleCenterline } from "../../../web/src/track/centerline";
import type { CenterlineDefinition } from "../../../web/src/track/centerline";
import type { GraphConnection, GraphPiece } from "../../../web/src/track/graph";
import { turnoutFixture } from "./turnout-fixtures";

export function sCurveVehicleFixture(transition = 0.08) {
  const definitions: CenterlineDefinition[] = [
    { kind: "straight", length: 0.2 }, { kind: "arc", radius: 0.1, sweep: Math.PI / 4 },
    ...(transition > 0 ? [{ kind: "straight" as const, length: transition }] : []),
    { kind: "arc", radius: 0.1, sweep: -Math.PI / 4 }, { kind: "straight", length: 0.2 },
  ];
  const pieces: GraphPiece[] = [], connections: GraphConnection[] = [];
  for (const [index, centerline] of definitions.entries()) {
    const previous = pieces[index - 1];
    const pose = previous ? alignModuleSocket(centerline, "entrance", trackConnectors(previous.id, previous.centerline, previous.pose)[1]) : { x: 0, y: 0, z: 0, yaw: 0 };
    pieces.push({ id: `part-${index}`, centerline, pose, gauge: RAIL_PROFILE.gauge, profile: RAIL_PROFILE.id });
    if (previous) connections.push({ id: `joint-${index}`, a: { pieceId: previous.id, socketId: "exit" }, b: { pieceId: `part-${index}`, socketId: "entrance" } });
  }
  return { revision: 0, pieces, connections, turnouts: [] };
}

export function vehicleCircleFixture(radius = 0.1) {
  const pieces: GraphPiece[] = [], connections: GraphConnection[] = [];
  const centerline = { kind: "arc" as const, radius, sweep: Math.PI / 2 };
  for (let index = 0; index < 4; index++) {
    const previous = pieces[index - 1];
    const pose = previous ? alignModuleSocket(centerline, "entrance", trackConnectors(previous.id, previous.centerline, previous.pose)[1]) : { x: -radius, y: 0, z: 0, yaw: 0 };
    pieces.push({ id: `curve-${index}`, centerline: { ...centerline }, pose, gauge: RAIL_PROFILE.gauge, profile: RAIL_PROFILE.id });
    connections.push({ id: `joint-${index}`, a: { pieceId: `curve-${index}`, socketId: "exit" }, b: { pieceId: `curve-${(index + 1) % 4}`, socketId: "entrance" } });
  }
  return { revision: 0, pieces, connections, turnouts: [] };
}

export function minimumTurnoutFixture() {
  const fixture = turnoutFixture();
  const turnout = { ...fixture.turnouts[0]!, radius: 0.1, sweep: Math.PI / 4 };
  fixture.turnouts = [turnout];
  const end = sampleCenterline({ kind: "arc", radius: turnout.radius, sweep: turnout.sweep }, turnout.radius * turnout.sweep);
  fixture.pieces = fixture.pieces.map(piece => piece.id === "branch" ? { ...piece, pose: { ...piece.pose, x: end.position.x, z: end.position.z, yaw: turnout.sweep } } : piece);
  return fixture;
}
