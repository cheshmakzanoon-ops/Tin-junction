import { describe, expect, it } from "vitest";
import { BOARD, CONSIST, COUPLER_GAP, RAIL_CENTER_SPACING, RAIL_HEAD_WIDTH, TRACK_GAUGE, WHEEL_RADIUS, consistPoses, couplerPosition, distanceToOval, ovalLength, railFrame, sampleOval, validTrack, vehiclePose, wrapDistance } from "../../../web/src/model";
import type { OvalTrack, Vector3 } from "../../../web/src/model";

const track: OvalTrack = { kind: "oval", straightLength: 0.34, radius: 0.145 };
const distance = (a: Vector3, b: Vector3): number => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);

describe("physical miniature scale and analytic geometry", () => {
  it("calibrates board meters, HO-like gauge, rail inner faces and wheel circumference", () => {
    expect(BOARD).toEqual({ width: 0.8, depth: 0.5 });
    expect(TRACK_GAUGE).toBe(16.5 / 1000);
    expect(RAIL_CENTER_SPACING - RAIL_HEAD_WIDTH).toBeCloseTo(TRACK_GAUGE, 14);
    expect(2 * Math.PI * WHEEL_RADIUS / WHEEL_RADIUS).toBeCloseTo(2 * Math.PI, 14);
    const straight = sampleOval(track, 0.12), advanced = sampleOval(track, 0.13);
    expect(distance(straight.position, advanced.position)).toBeCloseTo(0.01, 14);
    expect(straight.position.y).toBe(0);
    expect(straight.yaw).toBeCloseTo(Math.PI / 2, 14);
  });

  it("has exact straight and circular arc lengths", () => {
    expect(ovalLength(track)).toBeCloseTo(0.68 + 0.29 * Math.PI, 14);
    const rightExtreme = sampleOval(track, track.straightLength + Math.PI * track.radius / 2);
    expect(rightExtreme.position.x).toBeCloseTo(0.315, 14);
    expect(rightExtreme.position.z).toBeCloseTo(0, 14);
    expect(rightExtreme.tangent).toMatchObject({ y: 0 });
    expect(rightExtreme.tangent.z).toBeCloseTo(1, 14);
  });

  it("joins every straight/arc and the loop seam with continuous position and tangent", () => {
    const joins = [0, track.straightLength, track.straightLength + Math.PI * track.radius, 2 * track.straightLength + Math.PI * track.radius, ovalLength(track)];
    for (const join of joins) {
      const before = sampleOval(track, join - 1e-9), after = sampleOval(track, join + 1e-9);
      expect(distance(before.position, after.position)).toBeLessThan(2.1e-9);
      expect(distance(before.tangent, after.tangent)).toBeLessThan(2e-8);
    }
  });

  it("keeps rail spacing and orthonormal tangent frames correct everywhere", () => {
    const length = ovalLength(track);
    for (let index = 0; index < 120; index++) {
      const frame = railFrame(track, index * length / 120);
      expect(distance(frame.left, frame.right)).toBeCloseTo(RAIL_CENTER_SPACING, 13);
      expect(Math.hypot(frame.center.tangent.x, frame.center.tangent.z)).toBeCloseTo(1, 14);
      const offsetX = frame.right.x - frame.left.x, offsetZ = frame.right.z - frame.left.z;
      expect(offsetX * frame.center.tangent.x + offsetZ * frame.center.tangent.z).toBeCloseTo(0, 14);
      expect(distanceToOval(track, frame.center.position.x, frame.center.position.z)).toBeLessThan(1e-12);
    }
  });

  it("wraps reverse and many-lap travel without changing route identity", () => {
    const length = ovalLength(track);
    for (const laps of [-10_000, -1, 0, 1, 10_000]) {
      expect(distance(sampleOval(track, 0.123).position, sampleOval(track, 0.123 + laps * length).position)).toBeLessThan(1e-11);
    }
    expect(wrapDistance(-0.01, length)).toBeCloseTo(length - 0.01, 14);
    expect(wrapDistance(length, length)).toBe(0);
  });

  it("measures nearest route distance on straight and curved parts", () => {
    expect(distanceToOval(track, 0, 0)).toBeCloseTo(0.145, 14);
    expect(distanceToOval(track, 0, -0.165)).toBeCloseTo(0.020, 14);
    expect(distanceToOval(track, 0.335, 0)).toBeCloseTo(0.020, 14);
    expect(distanceToOval(track, 0.300, 0)).toBeCloseTo(0.015, 14);
  });

  it.each([Number.NaN, Infinity, -Infinity])("rejects non-finite distance %s", (value) => {
    expect(() => sampleOval(track, value)).toThrow();
    expect(() => distanceToOval(track, value, 0)).toThrow();
  });

  it.each([
    { ...track, radius: 0 }, { ...track, radius: 0.06 }, { ...track, radius: Number.NaN }, { ...track, radius: 0.3 },
    { ...track, straightLength: -1 }, { ...track, straightLength: 0.5, radius: 0.2 },
  ])("rejects degenerate or out-of-board track %j", (invalid) => {
    expect(validTrack(invalid)).toBe(false);
    expect(() => ovalLength(invalid)).toThrow();
    expect(() => sampleOval(invalid, 0)).toThrow();
  });
});

describe("rigid axle placement and coupled consist", () => {
  it("solves wheelbase as a chord rather than an arc offset", () => {
    const frontDistance = track.straightLength + Math.PI * track.radius / 2;
    const pose = vehiclePose(track, frontDistance, 0.036);
    expect(distance(pose.front, pose.rear)).toBeCloseTo(0.036, 12);
    expect(pose.frontDistance - pose.rearDistance).toBeGreaterThan(0.036);
    expect(distanceToOval(track, pose.front.x, pose.front.z)).toBeLessThan(1e-12);
    expect(distanceToOval(track, pose.rear.x, pose.rear.z)).toBeLessThan(1e-12);
  });

  it("keeps wheelbases and coupler gaps throughout supported loops", () => {
    for (const definition of [track, { kind: "oval", straightLength: 0.1, radius: 0.10 } as const]) {
      const length = ovalLength(definition);
      for (let sample = 0; sample < 60; sample++) {
        const poses = consistPoses(definition, sample * length / 60);
        expect(poses).toHaveLength(3);
        for (const [index, pose] of poses.entries()) {
          expect(distance(pose.front, pose.rear)).toBeCloseTo(CONSIST[index]!.wheelbase, 11);
          expect(Number.isFinite(pose.yaw)).toBe(true);
          if (index > 0) {
            const prior = couplerPosition(poses[index - 1]!, CONSIST[index - 1]!.bodyLength, "rear");
            const next = couplerPosition(pose, CONSIST[index]!.bodyLength, "front");
            expect(distance(prior, next)).toBeCloseTo(COUPLER_GAP, 7);
          }
        }
      }
    }
  });

  it("preserves continuous body poses at loop wrap and joins", () => {
    for (const at of [0, track.straightLength, track.straightLength + Math.PI * track.radius]) {
      const before = consistPoses(track, at - 1e-7), after = consistPoses(track, at + 1e-7);
      for (let index = 0; index < 3; index++) expect(distance(before[index]!.position, after[index]!.position)).toBeLessThan(1e-6);
    }
  });

  it("rejects unsupported or non-finite wheelbases with a bounded failure", () => {
    for (const wheelbase of [0, -1, Number.NaN, 0.2]) expect(() => vehiclePose(track, 0, wheelbase)).toThrow();
  });
});
