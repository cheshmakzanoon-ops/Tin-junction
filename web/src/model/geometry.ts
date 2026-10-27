import { RAIL_CENTER_SPACING } from "./types";
import type { OvalTrack, Vector3 } from "./types";

export interface TrackSample {
  position: Vector3; tangent: Vector3; yaw: number; distance: number;
}
export interface VehiclePose {
  position: Vector3; tangent: Vector3; yaw: number;
  front: Vector3; rear: Vector3; frontDistance: number; rearDistance: number;
}

export function validTrack(track: OvalTrack): boolean {
  return track.kind === "oval" && Number.isFinite(track.straightLength) && Number.isFinite(track.radius)
    && track.straightLength >= 0.1 && track.straightLength <= 0.5
    && track.radius >= 0.10 && track.radius <= 0.2
    && track.straightLength + 2 * track.radius <= 0.76 + 1e-10
    && 2 * track.radius <= 0.44 + 1e-10;
}

export function ovalLength(track: OvalTrack): number {
  if (!validTrack(track)) throw new RangeError("Track dimensions do not fit the miniature board.");
  return 2 * track.straightLength + 2 * Math.PI * track.radius;
}

export function wrapDistance(distance: number, length: number): number {
  if (!Number.isFinite(distance) || !Number.isFinite(length) || length <= 0) throw new RangeError("Invalid route distance.");
  return ((distance % length) + length) % length;
}

/** Analytic arc length: top straight, right semicircle, bottom straight, left semicircle. */
export function sampleOval(track: OvalTrack, distance: number): TrackSample {
  const length = ovalLength(track);
  const s = wrapDistance(distance, length);
  const a = track.straightLength, r = track.radius, half = a / 2, arc = Math.PI * r;
  let x: number, z: number, tx: number, tz: number;
  if (s < a) { x = -half + s; z = -r; tx = 1; tz = 0; }
  else if (s < a + arc) {
    const theta = (s - a) / r;
    x = half + r * Math.sin(theta); z = -r * Math.cos(theta);
    tx = Math.cos(theta); tz = Math.sin(theta);
  } else if (s < 2 * a + arc) {
    x = half - (s - a - arc); z = r; tx = -1; tz = 0;
  } else {
    const theta = (s - 2 * a - arc) / r;
    x = -half - r * Math.sin(theta); z = r * Math.cos(theta);
    tx = -Math.cos(theta); tz = -Math.sin(theta);
  }
  return { position: { x, y: 0, z }, tangent: { x: tx, y: 0, z: tz }, yaw: Math.atan2(tx, tz), distance: s };
}

/** Exact distance to a stadium-shaped route, including points inside its footprint. */
export function distanceToOval(track: OvalTrack, x: number, z: number): number {
  if (!Number.isFinite(x) || !Number.isFinite(z) || !validTrack(track)) throw new RangeError("Invalid clearance sample.");
  return Math.abs(Math.hypot(Math.max(Math.abs(x) - track.straightLength / 2, 0), z) - track.radius);
}

export function railFrame(track: OvalTrack, distance: number): { center: TrackSample; left: Vector3; right: Vector3 } {
  const center = sampleOval(track, distance), offset = RAIL_CENTER_SPACING / 2;
  const rx = center.tangent.z * offset, rz = -center.tangent.x * offset;
  return {
    center,
    left: { x: center.position.x - rx, y: 0, z: center.position.z - rz },
    right: { x: center.position.x + rx, y: 0, z: center.position.z + rz },
  };
}

const separation = (a: Vector3, b: Vector3): number => Math.hypot(a.x - b.x, a.z - b.z);

/** Finds the trailing axle by rigid chord length; arc offsets alone shorten a body on bends. */
export function vehiclePose(track: OvalTrack, frontDistance: number, wheelbase: number): VehiclePose {
  const length = ovalLength(track);
  if (!Number.isFinite(frontDistance) || !Number.isFinite(wheelbase) || wheelbase < 0.001 || wheelbase > Math.min(0.08, track.radius * 1.5)) {
    throw new RangeError("Wheelbase is incompatible with the supported track radius.");
  }
  const front = sampleOval(track, frontDistance).position;
  let low = wheelbase, high = Math.min(length / 4, wheelbase * 1.5);
  if (separation(front, sampleOval(track, frontDistance - high).position) < wheelbase) throw new RangeError("Cannot bracket the trailing axle.");
  for (let iteration = 0; iteration < 36; iteration++) {
    const middle = (low + high) / 2;
    if (separation(front, sampleOval(track, frontDistance - middle).position) < wheelbase) low = middle;
    else high = middle;
  }
  const rearDistance = frontDistance - (low + high) / 2;
  const rear = sampleOval(track, rearDistance).position;
  const actual = separation(front, rear);
  const tangent = { x: (front.x - rear.x) / actual, y: 0, z: (front.z - rear.z) / actual };
  return {
    position: { x: (front.x + rear.x) / 2, y: 0, z: (front.z + rear.z) / 2 },
    tangent, yaw: Math.atan2(tangent.x, tangent.z), front, rear, frontDistance, rearDistance,
  };
}

export const CONSIST = Object.freeze([
  { wheelbase: 0.036, bodyLength: 0.074 },
  { wheelbase: 0.028, bodyLength: 0.046 },
  { wheelbase: 0.028, bodyLength: 0.046 },
]);
export const COUPLER_EXTENSION = 0.0015;
export const COUPLER_GAP = 0.006;

export function couplerPosition(pose: VehiclePose, bodyLength: number, end: "front" | "rear"): Vector3 {
  const offset = (bodyLength / 2 + COUPLER_EXTENSION) * (end === "front" ? 1 : -1);
  return { x: pose.position.x + pose.tangent.x * offset, y: 0, z: pose.position.z + pose.tangent.z * offset };
}

/** A three-vehicle consist with fixed axle chords and a bounded coupler-gap solve. */
export function consistPoses(track: OvalTrack, leadingDistance: number): VehiclePose[] {
  const first = CONSIST[0]!;
  const poses: VehiclePose[] = [vehiclePose(track, leadingDistance, first.wheelbase)];
  for (let index = 1; index < CONSIST.length; index++) {
    const previous = poses[index - 1]!, previousDefinition = CONSIST[index - 1]!, definition = CONSIST[index]!;
    const rearCoupler = couplerPosition(previous, previousDefinition.bodyLength, "rear");
    // The lower bound places the next front axle at the previous rear axle; the upper bound is safely behind it.
    let low = previous.frontDistance - previous.rearDistance;
    let high = low + previousDefinition.bodyLength + definition.bodyLength;
    const gapAt = (offset: number): { signed: number; distance: number; pose: VehiclePose } => {
      const pose = vehiclePose(track, previous.frontDistance - offset, definition.wheelbase);
      const frontCoupler = couplerPosition(pose, definition.bodyLength, "front");
      const dx = rearCoupler.x - frontCoupler.x, dz = rearCoupler.z - frontCoupler.z;
      const signed = dx * previous.tangent.x + dz * previous.tangent.z;
      return { signed, distance: Math.hypot(dx, dz), pose };
    };
    // Include the sign so overlapping couplers cannot satisfy an absolute-distance root.
    for (let iteration = 0; iteration < 28; iteration++) {
      const middle = (low + high) / 2, gap = gapAt(middle);
      if (gap.signed < 0 || gap.distance < COUPLER_GAP) low = middle;
      else high = middle;
    }
    const solved = gapAt((low + high) / 2);
    if (solved.signed < -1e-8 || Math.abs(solved.distance - COUPLER_GAP) > 0.00001) {
      throw new RangeError("This curve cannot support the consist's coupler envelope.");
    }
    poses.push(solved.pose);
  }
  return poses;
}
