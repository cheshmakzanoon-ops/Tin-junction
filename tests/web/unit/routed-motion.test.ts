import { describe, expect, it } from "vitest";
import { FixedStepClock } from "../../../web/src/clock";
import { STEP_SECONDS } from "../../../web/src/model/types";
import { RoutedMotion, DEFAULT_MOTION_PROFILE } from "../../../web/src/simulation/routedMotion";
import { RoutedConsist } from "../../../web/src/simulation/routedConsist";
import { sampleRouteCursor } from "../../../web/src/track/graph";
import { sampleCenterline } from "../../../web/src/track/centerline";
import { buildTurnoutTopology } from "../../../web/src/track/turnout";
import type { TurnoutTopology } from "../../../web/src/track/turnout";
import { circleFixture } from "../../fixtures/track/graph-fixtures";
import { turnoutFixture } from "../../fixtures/track/turnout-fixtures";

const topology = (input: unknown): TurnoutTopology => {
  const result = buildTurnoutTopology(input);
  if (!result.ok) throw new Error(JSON.stringify(result.diagnostics));
  return result.value;
};
const circle = () => topology({ ...circleFixture(), turnouts: [] });
function placed(value = circle(), rear = { edgeId: "curve-0/forward", distance: 0.01 }, length = 0.12): RoutedMotion {
  const result = RoutedMotion.place(value, { trainId: "local", length, rear });
  if (!result.ok) throw new Error(result.message);
  return result.motion;
}
const position = (motion: RoutedMotion) => sampleRouteCursor(motion.network.graph, motion.front).position;
const distance = (a: { x: number; y: number; z: number }, b: { x: number; y: number; z: number }) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
function step(subject: RoutedMotion, ticks: number): void { for (let tick = 0; tick < ticks; tick++) subject.step(); }

describe("distance and safety authority P06-T01", () => {
  it("integrates acceleration and a fractional target time against the analytic distance", () => {
    const subject = placed();
    subject.setThrottle(0.37);
    const speed = DEFAULT_MOTION_PROFILE.maxSpeed * 0.37, accelerationTime = speed / DEFAULT_MOTION_PROFILE.acceleration;
    step(subject, 120);
    expect(subject.speed).toBe(speed);
    expect(subject.signedTravel).toBeCloseTo(speed * accelerationTime / 2 + speed * (2 - accelerationTime), 12);
    expect(subject.intervals.reduce((sum, interval) => sum + interval.to - interval.from, 0)).toBeCloseTo(0.12, 10);
  });

  it("preserves excess distance and world continuity across mixed-length joins", () => {
    const subject = placed(topology(turnoutFixture()), { edgeId: "approach/forward", distance: 0.15 });
    subject.setThrottle(0.6);
    const edges = new Set<string>(); let previous = position(subject), summed = 0;
    for (let tick = 0; tick < 500; tick++) {
      const result = subject.step(), current = position(subject);
      expect(result.code).not.toBe("safety-stop");
      expect(distance(previous, current)).toBeCloseTo(result.travelled, 10);
      expect(result.travelled).toBeLessThanOrEqual(DEFAULT_MOTION_PROFILE.maxSpeed * STEP_SECONDS + 1e-12);
      summed += result.travelled; previous = current; edges.add(subject.front.edgeId);
    }
    expect([...edges]).toEqual(["approach/forward", "points:route:straight/forward", "main/forward"]);
    expect(subject.signedTravel).toBeCloseTo(summed, 12);
    expect(subject.front.edgeId).toBe("main/forward");
    expect(subject.front.distance).toBeLessThan(0.3 - DEFAULT_MOTION_PROFILE.endClearance + 1e-9);
    expect(subject.speed).toBe(0); expect(subject.throttle).toBe(0);
  });

  it("produces the same commanded ticks at 30, 60, 120 Hz and an irregular render schedule", () => {
    const replay = (intervals: readonly number[]) => {
      const subject = placed(), clock = new FixedStepClock();
      clock.advance(0); let now = 0, frame = 0;
      const command = () => {
        switch (subject.tickCount) {
          case 0: subject.setThrottle(0.8); break;
          case 600: subject.stop(); break;
          case 720: expect(subject.reverse().ok).toBe(true); break;
          case 780: subject.setThrottle(0.4); break;
          case 1500: subject.stop(true); break;
          case 1620: expect(subject.reverse().ok).toBe(true); subject.setThrottle(0.7); break;
        }
      };
      while (subject.tickCount < 2400) {
        now += intervals[frame++ % intervals.length]!;
        const due = clock.advance(now).steps;
        for (let tick = 0; tick < due && subject.tickCount < 2400; tick++) { command(); subject.step(); }
      }
      return subject.snapshot();
    };
    const reference = replay([1000 / 60]);
    for (const schedule of [[1000 / 30], [1000 / 120], [5, 41, 12, 8, 70, 15, 22]]) expect(replay(schedule)).toEqual(reference);
  });

  it.each(["straight", "diverging"] as const)("brakes before the %s route end with bounded deceleration and no endpoint jump", route => {
    const subject = placed(topology(turnoutFixture()), { edgeId: "approach/forward", distance: 0 });
    expect(subject.selectTurnout("points", route).ok).toBe(true); subject.setThrottle(1);
    let before = 0, automaticStop = false;
    for (let tick = 0; tick < 700; tick++) {
      const result = subject.step();
      expect(result.code).not.toBe("safety-stop");
      automaticStop ||= result.code === "route-end";
      expect(before - subject.speed).toBeLessThanOrEqual(DEFAULT_MOTION_PROFILE.brakeDeceleration * STEP_SECONDS + 1e-12);
      expect(subject.speed - before).toBeLessThanOrEqual(DEFAULT_MOTION_PROFILE.acceleration * STEP_SECONDS + 1e-12);
      before = subject.speed;
    }
    expect(automaticStop).toBe(true); expect(subject.speed).toBe(0); expect(subject.throttle).toBe(0);
    expect(subject.front.edgeId).toBe(route === "straight" ? "main/forward" : "branch/forward");
    expect(0.3 - subject.front.distance).toBeGreaterThanOrEqual(DEFAULT_MOTION_PROFILE.endClearance - 1e-9);
    expect(0.3 - subject.front.distance).toBeLessThan(0.01);
    const stopped = subject.snapshot().consist;
    step(subject, 100); expect(subject.snapshot().consist).toEqual(stopped);
  });

  it("treats an unselected trailing turnout as a stopping boundary and permits safe retreat", () => {
    const subject = placed(topology(turnoutFixture()), { edgeId: "branch/reverse", distance: 0.01 }, 0.08);
    subject.setThrottle(1); step(subject, 500);
    expect(subject.speed).toBe(0); expect(subject.front.edgeId).toBe("branch/reverse");
    expect(subject.front.distance).toBeLessThan(0.3);
    expect(subject.network.selections).toEqual([{ turnoutId: "points", route: "straight" }]);
    const oldRear = sampleRouteCursor(subject.network.graph, subject.rear).position;
    expect(subject.reverse().ok).toBe(true); expect(distance(position(subject), oldRear)).toBeLessThan(1e-12);
    subject.setThrottle(0.3); step(subject, 120);
    expect(subject.front.edgeId).toBe("branch/forward"); expect(subject.speed).toBeGreaterThan(0);
  });

  it("requires zero power and zero speed for reversal, retaining wheel travel and physical identity", () => {
    const subject = placed(), initial = subject.snapshot();
    subject.setThrottle(1); expect(subject.reverse().code).toBe("train-moving");
    step(subject, 90); const moving = subject.snapshot();
    expect(subject.reverse().ok).toBe(false); expect(subject.snapshot()).toEqual(moving);
    subject.stop(); step(subject, 180); const stoppedTravel = subject.signedTravel;
    expect(subject.speed).toBe(0); expect(subject.reverse().ok).toBe(true);
    expect(subject.signedTravel).toBe(stoppedTravel); expect(subject.snapshot().consist.trainId).toBe(initial.consist.trainId);
    subject.setThrottle(0.5); step(subject, 120); expect(subject.signedTravel).toBeLessThan(stoppedTravel);
  });

  it("does not downgrade an emergency brake or accept power before the stop", () => {
    const subject = placed(); subject.setThrottle(1); step(subject, 180);
    const start = subject.signedTravel, speed = subject.speed;
    subject.stop(true); subject.stop();
    expect(subject.setThrottle(1).code).toBe("emergency-braking");
    step(subject, 120); expect(subject.speed).toBe(0);
    expect(subject.signedTravel - start).toBeCloseTo(speed ** 2 / (2 * DEFAULT_MOTION_PROFILE.emergencyDeceleration), 12);
    expect(subject.setThrottle(0.5).ok).toBe(true);
  });

  it("rejects a too-short switch choice before changing a moving train's route", () => {
    const fixture = turnoutFixture();
    fixture.turnouts[0] = { ...fixture.turnouts[0]!, radius: 0.1, sweep: 0.01 };
    fixture.connections = fixture.connections.filter(connection => connection.id !== "branch-joint");
    const subject = placed(topology(fixture), { edgeId: "approach/forward", distance: 0 }, 0.05);
    subject.setThrottle(1);
    while (subject.front.edgeId === "approach/forward" && subject.front.distance < 0.24) subject.step();
    const before = subject.snapshot();
    expect(subject.selectTurnout("points", "diverging").code).toBe("unsafe-stopping-distance");
    expect(subject.snapshot()).toEqual(before);
  });

  it("restores exact replay motion only with a safe braking envelope and defaults to parked", () => {
    const value = circle(), subject = placed(value); subject.setThrottle(0.65); step(subject, 137);
    const snapshot = JSON.parse(JSON.stringify(subject.snapshot()));
    const parked = RoutedMotion.restore(value, snapshot), exact = RoutedMotion.restore(value, snapshot, { restoreStopped: false });
    expect(parked.ok).toBe(true); expect(exact.ok).toBe(true);
    if (!parked.ok || !exact.ok) return;
    expect(parked.motion.speed).toBe(0); expect(parked.motion.throttle).toBe(0);
    expect(parked.motion.signedTravel).toBe(subject.signedTravel);
    expect(exact.motion.snapshot()).toEqual(subject.snapshot());
    step(exact.motion, 173); step(subject, 173); expect(exact.motion.snapshot()).toEqual(subject.snapshot());
    const branch = topology(turnoutFixture()), nearEnd = placed(branch, { edgeId: "main/forward", distance: 0.17 });
    const forged = { ...nearEnd.snapshot(), speed: 0.18, throttle: 1 };
    expect(RoutedMotion.restore(branch, forged, { restoreStopped: false })).toMatchObject({ ok: false, code: "unsafe-stopping-distance" });
    expect(RoutedMotion.restore(branch, forged).ok).toBe(true);
  });

  it("atomically rejects removed or moved occupied track and accepts a safe disconnected edit", () => {
    const fixture = turnoutFixture(), subject = placed(topology(fixture), { edgeId: "main/forward", distance: 0.02 });
    const before = subject.snapshot();
    const removed = topology({ ...fixture, revision: 1, pieces: fixture.pieces.filter(piece => piece.id !== "main"), connections: fixture.connections.filter(connection => connection.id !== "main-joint") });
    expect(subject.replaceTopology(removed, 0).code).toBe("occupied-route-changed"); expect(subject.snapshot()).toEqual(before);
    const moved = topology({ ...fixture, revision: 1, pieces: fixture.pieces.map(piece => piece.id === "main" ? { ...piece, pose: { ...piece.pose, x: 0.1 } } : piece), connections: fixture.connections.filter(connection => connection.id !== "main-joint") });
    expect(subject.replaceTopology(moved, 0).code).toBe("occupied-route-changed"); expect(subject.snapshot()).toEqual(before);
    const safe = topology({ ...fixture, revision: 1, pieces: fixture.pieces.filter(piece => piece.id !== "branch"), connections: fixture.connections.filter(connection => connection.id !== "branch-joint") });
    expect(subject.replaceTopology(safe, 0).ok).toBe(true);
    expect(subject.front).toEqual(before.consist.intervals.at(-1) && { edgeId: before.consist.intervals.at(-1)!.edgeId, distance: before.consist.intervals.at(-1)!.to });
    subject.setThrottle(1);
    expect(subject.replaceTopology(topology({ ...fixture, revision: 2 }), 1).code).toBe("train-moving");
    expect(subject.replaceTopology(safe, 0).code).toBe("stale-topology");
  });

  it("accepts identical occupied ordinary geometry regardless of property insertion order", () => {
    const fixture = turnoutFixture(), subject = placed(topology(fixture), { edgeId: "main/forward", distance: 0.02 });
    const before = subject.snapshot().consist, world = position(subject);
    const reordered = topology({ ...fixture, revision: 1, pieces: fixture.pieces.map(piece => piece.id === "main" ? {
      ...piece, centerline: { length: 0.3, kind: "straight" }, pose: { yaw: piece.pose.yaw, z: piece.pose.z, y: piece.pose.y, x: piece.pose.x },
    } : piece) });
    expect(subject.replaceTopology(reordered, 0).ok).toBe(true);
    expect(subject.snapshot().consist.intervals).toEqual(before.intervals);
    expect(distance(position(subject), world)).toBeLessThan(1e-12);
  });

  it("protects the complete occupied turnout, including its unselected route and connection identities", () => {
    const fixture = turnoutFixture(), subject = placed(topology(fixture), { edgeId: "points:route:straight/forward", distance: 0.01 }, 0.1);
    const before = JSON.stringify(subject.snapshot()), turnout = fixture.turnouts[0]!;
    const changedRadius = 0.4, branchEnd = sampleCenterline({ kind: "arc", radius: changedRadius, sweep: turnout.sweep }, changedRadius * Math.abs(turnout.sweep), turnout.pose);
    const changedRoute = topology({ ...fixture, revision: 1,
      turnouts: [{ ...turnout, radius: changedRadius }],
      pieces: fixture.pieces.map(piece => piece.id === "branch" ? { ...piece, pose: { ...piece.pose, x: branchEnd.position.x, z: branchEnd.position.z } } : piece),
    });
    const disconnected = topology({ ...fixture, revision: 1, connections: fixture.connections.filter(connection => connection.id !== "branch-joint") });
    const renamedConnection = topology({ ...fixture, revision: 1, connections: fixture.connections.map(connection => connection.id === "branch-joint" ? { ...connection, id: "different-identity" } : connection) });
    for (const candidate of [changedRoute, disconnected, renamedConnection]) {
      expect(subject.replaceTopology(candidate, 0)).toMatchObject({ ok: false, changed: false, code: "occupied-turnout-changed" });
      expect(JSON.stringify(subject.snapshot())).toBe(before);
    }
  });

  it("rejects turnout removal when only the train's front boundary contacts its stock socket", () => {
    const fixture = turnoutFixture(), subject = placed(topology(fixture), { edgeId: "approach/forward", distance: 0.18 }, 0.12);
    expect(subject.front).toEqual({ edgeId: "approach/forward", distance: 0.3 });
    const before = JSON.stringify(subject.snapshot());
    const removed = topology({ ...fixture, revision: 1, turnouts: [], connections: [] });
    expect(subject.replaceTopology(removed, 0)).toMatchObject({ ok: false, changed: false, code: "occupied-turnout-changed" });
    expect(JSON.stringify(subject.snapshot())).toBe(before);
  });

  it("normalizes connection endpoint order and turnout object keys while retaining their identities", () => {
    const fixture = turnoutFixture(), subject = placed(topology(fixture), { edgeId: "points:route:straight/forward", distance: 0.01 }, 0.1);
    const before = subject.snapshot().consist, world = position(subject);
    const reordered = topology({ ...fixture, revision: 1,
      turnouts: fixture.turnouts.map(turnout => ({ sweep: turnout.sweep, radius: turnout.radius, straightLength: turnout.straightLength,
        pose: { yaw: turnout.pose.yaw, z: turnout.pose.z, x: turnout.pose.x, y: turnout.pose.y }, id: turnout.id })),
      connections: [...fixture.connections].reverse().map(connection => ({ b: { socketId: connection.a.socketId, pieceId: connection.a.pieceId },
        a: { socketId: connection.b.socketId, pieceId: connection.b.pieceId }, id: connection.id })),
    });
    expect(subject.replaceTopology(reordered, 0).ok).toBe(true);
    expect(subject.snapshot().consist.intervals).toEqual(before.intervals);
    expect(distance(position(subject), world)).toBeLessThan(1e-12);
  });

  it("retains bounded history and exact save/replay across long operation and periodic stopped reversals", () => {
    const value = circle(); let subject = placed(value);
    for (let cycle = 0; cycle < 50; cycle++) {
      subject.setThrottle(0.9); step(subject, 500); subject.stop(); step(subject, 120);
      expect(subject.speed).toBe(0); expect(subject.reverse().ok).toBe(true);
      expect(subject.intervals.length).toBeLessThanOrEqual(3);
      const restored = RoutedMotion.restore(value, subject.snapshot(), { restoreStopped: false });
      if (!restored.ok) throw new Error(restored.message);
      expect(restored.motion.snapshot()).toEqual(subject.snapshot()); subject = restored.motion;
    }
    expect(subject.tickCount).toBe(31_000); expect(subject.direction).toBe(1);
  });

  it("validates public numeric boundaries without poisoning a valid train", () => {
    const value = circle(), subject = placed(value), before = subject.snapshot();
    for (const bad of [NaN, Infinity, -1, 1.01]) { expect(subject.setThrottle(bad).ok).toBe(false); expect(subject.snapshot()).toEqual(before); }
    for (const profile of [null, {}, { ...DEFAULT_MOTION_PROFILE, maxSpeed: Infinity }, { ...DEFAULT_MOTION_PROFILE, acceleration: 0 }, { ...DEFAULT_MOTION_PROFILE, emergencyDeceleration: 0.01 }])
      expect(RoutedMotion.place(value, { trainId: "local", length: 0.1, rear: subject.rear }, profile).ok).toBe(false);
    for (const input of [null, {}, { ...before, speed: NaN }, { ...before, throttle: 2 }, { ...before, tick: 0.5 }, { ...before, signedTravel: Infinity }, { ...before, emergency: true, throttle: 1 }, { ...before, extra: true }])
      expect(RoutedMotion.restore(value, input).ok).toBe(false);
    const consist = RoutedConsist.restore(value, before.consist);
    if (!consist.ok) throw new Error(consist.message);
    for (const bad of [NaN, Infinity, -1, 2]) expect(() => consist.consist.clearanceAhead(bad)).toThrow();
    expect(consist.consist.snapshot()).toEqual(before.consist);
  });
});
