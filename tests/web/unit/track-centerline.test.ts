import { describe, expect, it } from "vitest";
import fixtures from "../../fixtures/track/centerlines.json";
import { buildArcLengthTable, CENTERLINE_LIMITS, centerlineLength, parameterAtDistance, sampleCenterline } from "../../../web/src/track/centerline";
import type { ArcLengthTable, CenterlineDefinition, TrackPose, TrackVector } from "../../../web/src/track/centerline";

const distance = (a: TrackVector, b: TrackVector): number => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
const dot = (a: TrackVector, b: TrackVector): number => a.x * b.x + a.y * b.y + a.z * b.z;
const closeVector = (actual: TrackVector, expected: readonly number[]): void => {
  expect(actual.x).toBeCloseTo(expected[0]!, 10);
  expect(actual.y).toBeCloseTo(expected[1]!, 10);
  expect(actual.z).toBeCloseTo(expected[2]!, 10);
};

describe("parametric centerlines P05-T01", () => {
  for (const fixture of fixtures) it(`matches independent analytic fixture: ${fixture.name}`, () => {
    const definition = fixture.definition as CenterlineDefinition;
    expect(centerlineLength(definition)).toBeCloseTo(fixture.length, 12);
    const start = sampleCenterline(definition, 0), end = sampleCenterline(definition, centerlineLength(definition));
    closeVector(start.position, [0, 0, 0]); closeVector(start.tangent, [0, 0, 1]);
    closeVector(end.position, fixture.end); closeVector(end.tangent, fixture.tangent);
    expect(end.curvature).toBe(definition.kind === "arc" ? Math.sign(definition.sweep) / definition.radius : 0);
  });

  it("places an entire curve under a rigid transform without changing length or curvature", () => {
    const definition: CenterlineDefinition = { kind: "arc", radius: 0.1, sweep: Math.PI / 2 };
    const pose: TrackPose = { x: 0.4, y: 0.015, z: -0.3, yaw: Math.PI / 2 };
    const sample = sampleCenterline(definition, centerlineLength(definition), pose);
    closeVector(sample.position, [0.5, 0.015, -0.4]);
    closeVector(sample.tangent, [0, 0, -1]); closeVector(sample.right, [-1, 0, 0]);
    expect(sample.curvature).toBe(10);
  });

  it("joins a straight and both arc directions with exact position and tangent continuity", () => {
    const straight: CenterlineDefinition = { kind: "straight", length: 0.23 };
    const pose = { x: -0.12, y: 0.018, z: 0.2, yaw: -1.2 };
    const end = sampleCenterline(straight, centerlineLength(straight), pose);
    for (const sign of [-1, 1]) {
      const arc: CenterlineDefinition = { kind: "arc", radius: 0.1, sweep: sign * Math.PI / 2 };
      const next = sampleCenterline(arc, 0, { ...end.position, yaw: pose.yaw });
      expect(distance(end.position, next.position)).toBe(0);
      expect(distance(end.tangent, next.tangent)).toBe(0);
    }
  });

  it("has stable orthonormal right/up/tangent frames and equal-distance motion", () => {
    for (const sign of [-1, 1]) {
      const definition: CenterlineDefinition = { kind: "arc", radius: 0.1, sweep: sign * 2 * Math.PI };
      const length = centerlineLength(definition), step = length / 1000;
      let previous = sampleCenterline(definition, 0);
      for (let index = 1; index <= 1000; index++) {
        const sample = sampleCenterline(definition, index === 1000 ? length : index * step);
        expect(Math.hypot(sample.tangent.x, sample.tangent.y, sample.tangent.z)).toBeCloseTo(1, 12);
        expect(dot(sample.tangent, sample.right)).toBeCloseTo(0, 12);
        expect(dot(sample.tangent, sample.up)).toBe(0);
        expect(distance(sample.position, previous.position)).toBeCloseTo(0.2 * Math.sin(Math.PI / 1000), 12);
        previous = sample;
      }
    }
  });

  it("builds bounded monotonic tables and meets chord/tangent/length budgets", () => {
    for (const radius of [0.1, 0.16, 1]) for (const sweep of [-2 * Math.PI, -0.01, Math.PI / 2, 2 * Math.PI]) {
      const definition: CenterlineDefinition = { kind: "arc", radius, sweep };
      const table = buildArcLengthTable(definition);
      expect(table.entries.length).toBeLessThanOrEqual(CENTERLINE_LIMITS.maxSamples);
      expect(table.entries[0]!.distance).toBe(0);
      expect(table.entries.at(-1)!.distance).toBe(table.length);
      expect(Math.abs(table.length - table.chordLength) / table.length).toBeLessThanOrEqual(1e-6);
      for (let index = 1; index < table.entries.length; index++) {
        const a = table.entries[index - 1]!, b = table.entries[index]!;
        expect(b.distance).toBeGreaterThan(a.distance); expect(b.parameter).toBeGreaterThan(a.parameter);
        const delta = (b.distance - a.distance) / radius;
        expect(delta).toBeLessThanOrEqual(Math.PI / 720 + 1e-12);
        expect(2 * radius * Math.sin(delta / 4) ** 2).toBeLessThanOrEqual(0.00001 + 1e-12);
        expect(b.distance - a.distance).toBeLessThanOrEqual(0.01 + 1e-12);
      }
      for (const fraction of [0, 0.0001, 0.17, 0.5, 0.9999, 1]) {
        expect(parameterAtDistance(table, table.length * fraction)).toBeCloseTo(fraction, 12);
      }
    }
  });

  it("matches analytic and polygonal lengths for straights including smallest piece", () => {
    for (const length of [0.001, 0.1, 2]) {
      const table = buildArcLengthTable({ kind: "straight", length });
      expect(table.chordLength).toBeCloseTo(length, 12);
      expect(parameterAtDistance(table, length / 3)).toBeCloseTo(1 / 3, 12);
    }
  });

  it("is deterministic and immutable without mutating caller definitions", () => {
    const definition = Object.freeze({ kind: "arc" as const, radius: 0.1, sweep: -Math.PI });
    const first = buildArcLengthTable(definition), second = buildArcLengthTable(definition);
    expect(first).toEqual(second);
    expect(Object.isFrozen(first)).toBe(true); expect(Object.isFrozen(first.entries)).toBe(true);
    expect(Object.isFrozen(first.entries[0]!.position)).toBe(true);
  });

  it("matches finite-difference tangents for seeded interior samples", () => {
    let seed = 1789;
    const random = (): number => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 2 ** 32; };
    for (let index = 0; index < 100; index++) {
      const definition: CenterlineDefinition = { kind: "arc", radius: 0.1 + random() * 0.9, sweep: (random() > 0.5 ? 1 : -1) * (0.1 + random() * 6) };
      const length = centerlineLength(definition), s = length * (0.1 + random() * 0.8), h = 1e-6;
      const before = sampleCenterline(definition, s - h), sample = sampleCenterline(definition, s), after = sampleCenterline(definition, s + h);
      expect((after.position.x - before.position.x) / (2 * h)).toBeCloseTo(sample.tangent.x, 8);
      expect((after.position.z - before.position.z) / (2 * h)).toBeCloseTo(sample.tangent.z, 8);
    }
  });

  it("rejects invalid dimensions, unsupported kinds and degenerate arcs", () => {
    const invalid: unknown[] = [null, {}, { kind: "spline" }, { kind: "arc", radius: 0.1, sweep: "1" }, ...[NaN, Infinity, -Infinity, 0, -1, 1e-300, 2.01].map(length => ({ kind: "straight", length })),
      ...[NaN, Infinity, 0, -0.1, 0.0999, 1.01].map(radius => ({ kind: "arc", radius, sweep: 1 })),
      ...[NaN, Infinity, 0, -0, 1e-300, 2 * Math.PI + 0.0001].map(sweep => ({ kind: "arc", radius: 0.1, sweep }))];
    for (const input of invalid) expect(() => sampleCenterline(input as CenterlineDefinition, 0)).toThrow(RangeError);
  });

  it("rejects rather than wraps out-of-range distances and invalid rigid poses", () => {
    const definition: CenterlineDefinition = { kind: "straight", length: 0.2 };
    for (const s of [NaN, Infinity, -Infinity, -1e-12, 0.200000000001]) expect(() => sampleCenterline(definition, s)).toThrow(RangeError);
    for (const key of ["x", "y", "z", "yaw"] as const) {
      for (const value of [NaN, Infinity, -Infinity, 101]) expect(() => sampleCenterline(definition, 0, { x: 0, y: 0, z: 0, yaw: 0, [key]: value })).toThrow(RangeError);
    }
  });

  it("rejects invalid or unaffordable sampling budgets before allocating a table", () => {
    const definition: CenterlineDefinition = { kind: "arc", radius: 0.1, sweep: 2 * Math.PI };
    for (const key of ["maxChordError", "maxTangentAngle", "maxSegmentLength"] as const) {
      for (const value of [0, -1, NaN, Infinity]) expect(() => buildArcLengthTable(definition, { [key]: value })).toThrow(RangeError);
    }
    expect(() => buildArcLengthTable(definition, { maxChordError: 1e-12 })).toThrow(/capacity/);
    expect(() => buildArcLengthTable(definition, { maxTangentAngle: 1e-8 })).toThrow(/capacity/);
    expect(() => buildArcLengthTable(definition, { maxSegmentLength: 1e-8 })).toThrow(/capacity/);
  });

  it("rejects malformed externally constructed tables and lookup distances", () => {
    const table = buildArcLengthTable({ kind: "straight", length: 0.2 });
    for (const value of [NaN, Infinity, -1, 0.200001]) expect(() => parameterAtDistance(table, value)).toThrow(RangeError);
    const invalid: unknown[] = [null, { ...table, entries: [] }, { ...table, length: NaN },
      { ...table, entries: [table.entries[0], table.entries[0], table.entries.at(-1)] },
      { ...table, entries: [{ ...table.entries[0], parameter: 0.1 }, table.entries.at(-1)] },
      { ...table, entries: [table.entries[0], { ...table.entries.at(-1), distance: 0.1 }] },
      { ...table, entries: [table.entries[0], { ...table.entries.at(-1), parameter: NaN }] }];
    for (const input of invalid) expect(() => parameterAtDistance(input as ArcLengthTable, 0.1)).toThrow(RangeError);
  });
});
