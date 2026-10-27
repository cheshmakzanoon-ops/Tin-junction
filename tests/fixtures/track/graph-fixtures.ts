import { alignModuleSocket, RAIL_PROFILE, trackConnectors } from "../../../web/src/track/module";
import type { GraphConnection, GraphPiece } from "../../../web/src/track/graph";

export function circleFixture(): { revision: number; pieces: GraphPiece[]; connections: GraphConnection[] } {
  const pieces: GraphPiece[] = [], connections: GraphConnection[] = [];
  const centerline = { kind: "arc" as const, radius: 0.1, sweep: Math.PI / 2 };
  for (let index = 0; index < 4; index++) {
    const previous = pieces[index - 1];
    const pose = previous ? alignModuleSocket(centerline, "entrance", trackConnectors(previous.id, previous.centerline, previous.pose)[1]) : { x: 0, y: 0, z: 0, yaw: 0 };
    pieces.push({ id: `curve-${index}`, centerline: { ...centerline }, pose, gauge: RAIL_PROFILE.gauge, profile: RAIL_PROFILE.id });
    connections.push({ id: `joint-${index}`, a: { pieceId: `curve-${index}`, socketId: "exit" }, b: { pieceId: `curve-${(index + 1) % 4}`, socketId: "entrance" } });
  }
  return { revision: 0, pieces, connections };
}

export function straightPiece(id: string, z = 0): GraphPiece {
  return { id, centerline: { kind: "straight", length: 0.1 }, pose: { x: 0, y: 0, z, yaw: 0 }, gauge: RAIL_PROFILE.gauge, profile: RAIL_PROFILE.id };
}
