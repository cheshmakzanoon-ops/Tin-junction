import { RAIL_PROFILE } from "../../../web/src/track/module";
import type { GraphPiece } from "../../../web/src/track/graph";
import { turnoutFixture } from "./turnout-fixtures";

export const testEnvelope = Object.freeze({ halfWidth: 0.015, height: 0.05, minimumRadius: 0.1 });
export const clearanceStraight = (id: string, x = 0, z = -0.1, length = 0.2, yaw = 0, y = 0): GraphPiece => ({
  id, centerline: { kind: "straight", length }, pose: { x, y, z, yaw }, gauge: RAIL_PROFILE.gauge, profile: RAIL_PROFILE.id,
});
export const clearanceDraft = (pieces: GraphPiece[]) => ({ revision: 0, pieces, turnouts: [], connections: [] });
export function crossingFixture(elevation = 0) {
  return clearanceDraft([clearanceStraight("east-west", -0.15, 0, 0.3, Math.PI / 2), clearanceStraight("north-south", 0, -0.15, 0.3, 0, elevation)]);
}
export function compactTurnoutFixture() {
  const fixture = turnoutFixture();
  fixture.turnouts = fixture.turnouts.map(turnout => ({ ...turnout, pose: { ...turnout.pose, z: -0.03 } }));
  fixture.pieces = fixture.pieces.map(piece => ({ ...piece,
    centerline: { kind: "straight" as const, length: piece.id === "approach" ? 0.2 : 0.1 },
    pose: { ...piece.pose, z: piece.id === "approach" ? -0.23 : piece.pose.z - 0.03 },
  }));
  return fixture;
}
