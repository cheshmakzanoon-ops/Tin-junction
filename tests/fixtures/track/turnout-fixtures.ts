import { sampleCenterline } from "../../../web/src/track/centerline";
import { RAIL_PROFILE } from "../../../web/src/track/module";
import type { GraphPiece } from "../../../web/src/track/graph";
import type { NetworkConnection, TurnoutDefinition } from "../../../web/src/track/turnout";

export function turnoutFixture(sweep = Math.PI / 6): { revision: number; pieces: GraphPiece[]; turnouts: TurnoutDefinition[]; connections: NetworkConnection[] } {
  const turnout: TurnoutDefinition = { id: "points", pose: { x: 0, y: 0, z: 0, yaw: 0 }, straightLength: 0.15, radius: 0.3, sweep };
  const end = sampleCenterline({ kind: "arc", radius: turnout.radius, sweep }, turnout.radius * Math.abs(sweep));
  const straight = (id: string, x: number, z: number, yaw = 0): GraphPiece => ({ id, centerline: { kind: "straight", length: 0.3 }, pose: { x, y: 0, z, yaw }, gauge: RAIL_PROFILE.gauge, profile: RAIL_PROFILE.id });
  return {
    revision: 0, turnouts: [turnout],
    pieces: [straight("approach", 0, -0.3), straight("main", 0, 0.15), straight("branch", end.position.x, end.position.z, sweep)],
    connections: [
      { id: "stock-joint", a: { pieceId: "approach", socketId: "exit" }, b: { pieceId: "points", socketId: "stock" } },
      { id: "main-joint", a: { pieceId: "points", socketId: "straight" }, b: { pieceId: "main", socketId: "entrance" } },
      { id: "branch-joint", a: { pieceId: "points", socketId: "diverging" }, b: { pieceId: "branch", socketId: "entrance" } },
    ],
  };
}
