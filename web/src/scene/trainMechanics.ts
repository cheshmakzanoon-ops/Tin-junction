import { CONSIST, vehiclePose } from "../model/index";
import type { LayoutDocument, Vector3 } from "../model/index";

/** Model-world metres. Shared with the chimney geometry, not a route-centre approximation. */
export const CHIMNEY_OUTLET = Object.freeze({ x: 0, y: 0.0516, z: 0.023 });
export const CRANK_RADIUS = 0.0022;
export const CRANK_AXIAL_OFFSET = 0.0109;

export function crankOffset(phase: number, side: -1 | 1): Vector3 {
  const angle = phase + (side < 0 ? Math.PI / 2 : 0);
  return { x: side * CRANK_AXIAL_OFFSET, y: Math.cos(angle) * CRANK_RADIUS, z: Math.sin(angle) * CRANK_RADIUS };
}

/** Render-only back-projection at current speed; not an authoritative smoke/fluid simulation. */
export function steamOrigin(track: LayoutDocument["track"], leadingDistance: number, speed: number, direction: -1 | 1, age = 0): Vector3 {
  if (![leadingDistance, speed, age].every(Number.isFinite) || speed < 0 || age < 0 || age > 1.7 || (direction !== 1 && direction !== -1)) {
    throw new RangeError("Invalid steam presentation sample.");
  }
  const pose = vehiclePose(track, leadingDistance - direction * speed * age, CONSIST[0]!.wheelbase);
  return {
    x: pose.position.x + Math.cos(pose.yaw) * CHIMNEY_OUTLET.x + Math.sin(pose.yaw) * CHIMNEY_OUTLET.z,
    y: CHIMNEY_OUTLET.y,
    z: pose.position.z - Math.sin(pose.yaw) * CHIMNEY_OUTLET.x + Math.cos(pose.yaw) * CHIMNEY_OUTLET.z,
  };
}
