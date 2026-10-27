/** Pure miniature-metre geometry. No renderer, clock, persistence or topology dependency. */
export interface TrackVector { readonly x: number; readonly y: number; readonly z: number }
export interface TrackPose { readonly x: number; readonly y: number; readonly z: number; readonly yaw: number }
export type CenterlineDefinition =
  | { readonly kind: "straight"; readonly length: number }
  | { readonly kind: "arc"; readonly radius: number; readonly sweep: number };

export const CENTERLINE_LIMITS = Object.freeze({
  minLength: 0.001, maxStraightLength: 2, minRadius: 0.1, maxRadius: 1,
  maxSweep: Math.PI * 2, maxCoordinate: 100, maxSamples: 8193,
});
export const ORIGIN: TrackPose = Object.freeze({ x: 0, y: 0, z: 0, yaw: 0 });
export interface CenterlineSample {
  readonly distance: number;
  readonly position: TrackVector;
  readonly tangent: TrackVector;
  readonly right: TrackVector;
  readonly up: TrackVector;
  /** d(yaw)/ds. Positive turns towards +X from canonical +Z. */
  readonly curvature: number;
}
export interface ArcLengthEntry extends CenterlineSample { readonly parameter: number }
export interface ArcLengthTable {
  readonly length: number;
  readonly chordLength: number;
  readonly entries: readonly ArcLengthEntry[];
}
export interface SamplingOptions {
  readonly maxChordError?: number;
  readonly maxTangentAngle?: number;
  readonly maxSegmentLength?: number;
}

function bounded(value: number, min: number, max: number, label: string): void {
  if (!Number.isFinite(value) || value < min || value > max) throw new RangeError(`Invalid ${label}.`);
}

export function centerlineLength(definition: CenterlineDefinition): number {
  if (!definition || typeof definition !== "object") throw new RangeError("Invalid centerline definition.");
  if (definition.kind === "straight") {
    bounded(definition.length, CENTERLINE_LIMITS.minLength, CENTERLINE_LIMITS.maxStraightLength, "straight length");
    return definition.length;
  }
  if (definition.kind !== "arc") throw new RangeError("Unsupported centerline kind.");
  bounded(definition.radius, CENTERLINE_LIMITS.minRadius, CENTERLINE_LIMITS.maxRadius, "arc radius");
  if (typeof definition.sweep !== "number") throw new RangeError("Invalid arc sweep.");
  bounded(Math.abs(definition.sweep), Number.MIN_VALUE, CENTERLINE_LIMITS.maxSweep, "arc sweep");
  const length = definition.radius * Math.abs(definition.sweep);
  bounded(length, CENTERLINE_LIMITS.minLength, CENTERLINE_LIMITS.maxRadius * CENTERLINE_LIMITS.maxSweep, "arc length");
  return length;
}

function validatePose(pose: TrackPose): void {
  if (!pose || typeof pose !== "object") throw new RangeError("Invalid track pose.");
  for (const coordinate of [pose.x, pose.y, pose.z]) bounded(coordinate, -CENTERLINE_LIMITS.maxCoordinate, CENTERLINE_LIMITS.maxCoordinate, "track coordinate");
  bounded(pose.yaw, -Math.PI * 2, Math.PI * 2, "track yaw");
}

/** Distance is strictly [0,L], never wrapped or silently clamped to a different piece. */
export function sampleCenterline(definition: CenterlineDefinition, distance: number, pose: TrackPose = ORIGIN): CenterlineSample {
  const length = centerlineLength(definition);
  bounded(distance, 0, length, "centerline distance");
  validatePose(pose);
  const curvature = definition.kind === "arc" ? Math.sign(definition.sweep) / definition.radius : 0;
  const angle = curvature * distance;
  // 2*sin(a/2)^2 avoids cancellation in 1-cos(a) for short supported arcs.
  const localX = curvature === 0 ? 0 : 2 * Math.sin(angle / 2) ** 2 / curvature;
  const localZ = curvature === 0 ? distance : Math.sin(angle) / curvature;
  const c = Math.cos(pose.yaw), s = Math.sin(pose.yaw), heading = pose.yaw + angle;
  return Object.freeze({
    distance,
    position: Object.freeze({ x: pose.x + c * localX + s * localZ, y: pose.y, z: pose.z - s * localX + c * localZ }),
    tangent: Object.freeze({ x: Math.sin(heading), y: 0, z: Math.cos(heading) }),
    right: Object.freeze({ x: Math.cos(heading), y: 0, z: -Math.sin(heading) }),
    up: Object.freeze({ x: 0, y: 1, z: 0 }),
    curvature,
  });
}

/** Analytic distance nodes plus measured polygonal length; never use chord sum for motion. */
export function buildArcLengthTable(definition: CenterlineDefinition, options: SamplingOptions = {}, pose: TrackPose = ORIGIN): ArcLengthTable {
  const length = centerlineLength(definition);
  validatePose(pose);
  const chordError = options.maxChordError ?? 0.00001;
  const tangentAngle = options.maxTangentAngle ?? Math.PI / 720;
  const segmentLength = options.maxSegmentLength ?? 0.01;
  bounded(chordError, 1e-12, 1, "chord-error budget");
  bounded(tangentAngle, 1e-8, Math.PI / 2, "tangent-angle budget");
  bounded(segmentLength, 1e-8, 2, "segment-length budget");
  let segments = Math.ceil(length / segmentLength);
  if (definition.kind === "arc") {
    // Sagitta = 2*r*sin(delta/4)^2. Inverting via asin is stable for tiny errors.
    const sagittaAngle = 4 * Math.asin(Math.sqrt(Math.min(1, chordError / (2 * definition.radius))));
    segments = Math.max(segments, Math.ceil(Math.abs(definition.sweep) / Math.min(tangentAngle, sagittaAngle)));
  }
  if (segments + 1 > CENTERLINE_LIMITS.maxSamples) throw new RangeError("Sampling error budget exceeds the bounded table capacity.");
  const entries: ArcLengthEntry[] = [];
  let chordLength = 0;
  for (let index = 0; index <= segments; index++) {
    const parameter = index / segments;
    // Preserve the exact final length instead of an accumulated stepping error.
    const distance = index === segments ? length : parameter * length;
    const sample = sampleCenterline(definition, distance, pose);
    const previous = entries[index - 1];
    if (previous) chordLength += Math.hypot(sample.position.x - previous.position.x, sample.position.z - previous.position.z);
    entries.push(Object.freeze({ ...sample, parameter }));
  }
  return Object.freeze({ length, chordLength, entries: Object.freeze(entries) });
}

/** Validates even externally constructed tables before bounded binary-search interpolation. */
export function parameterAtDistance(table: ArcLengthTable, distance: number): number {
  if (!table || !Array.isArray(table.entries) || table.entries.length < 2 || table.entries.length > CENTERLINE_LIMITS.maxSamples) throw new RangeError("Invalid arc-length table.");
  bounded(table.length, CENTERLINE_LIMITS.minLength, CENTERLINE_LIMITS.maxRadius * CENTERLINE_LIMITS.maxSweep, "table length");
  bounded(distance, 0, table.length, "lookup distance");
  for (let index = 0; index < table.entries.length; index++) {
    const entry = table.entries[index];
    if (!entry) throw new RangeError("Missing arc-length entry.");
    bounded(entry.distance, 0, table.length, "table distance");
    bounded(entry.parameter, 0, 1, "table parameter");
    const previous = table.entries[index - 1];
    if (previous && (entry.distance <= previous.distance || entry.parameter <= previous.parameter)) throw new RangeError("Arc-length table must be strictly monotonic.");
  }
  const first = table.entries[0]!, last = table.entries[table.entries.length - 1]!;
  if (first.distance !== 0 || first.parameter !== 0 || last.distance !== table.length || last.parameter !== 1) throw new RangeError("Arc-length table endpoints do not span the piece.");
  if (distance === table.length) return 1;
  let low = 0, high = table.entries.length - 1;
  while (high - low > 1) {
    const middle = Math.floor((low + high) / 2);
    if (table.entries[middle]!.distance <= distance) low = middle; else high = middle;
  }
  const a = table.entries[low]!, b = table.entries[high]!;
  return a.parameter + (b.parameter - a.parameter) * (distance - a.distance) / (b.distance - a.distance);
}
