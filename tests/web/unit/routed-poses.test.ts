import { describe, expect, it } from "vitest";
import { RAIL_CENTER_SPACING } from "../../../web/src/model/types";
import { RoutedMotion } from "../../../web/src/simulation/routedMotion";
import { prepareVehicleStep } from "../../../web/src/simulation/vehicleStep";
import { solveRoutedPoses } from "../../../web/src/simulation/routedPoses";
import type { RoutedVehiclePose } from "../../../web/src/simulation/routedPoses";
import { consistClearanceEnvelope, consistFootprint, DEFAULT_VEHICLES, validateConsistVehicles, VEHICLE_CATALOG, VEHICLE_CATALOG_VERSION, VEHICLE_CONSTRAINTS } from "../../../web/src/simulation/vehicleCatalog";
import { buildTurnoutTopology, compileTurnoutRoutes } from "../../../web/src/track/turnout";
import type { TurnoutTopology } from "../../../web/src/track/turnout";
import { sampleRouteCursor } from "../../../web/src/track/graph";
import { RAIL_PROFILE } from "../../../web/src/track/module";
import { centerlineLength } from "../../../web/src/track/centerline";
import { circleFixture } from "../../fixtures/track/graph-fixtures";
import { minimumTurnoutFixture, sCurveVehicleFixture, vehicleCircleFixture } from "../../fixtures/track/vehicle-fixtures";

const topology = (input: unknown): TurnoutTopology => {
  const built = buildTurnoutTopology(input); if (!built.ok) throw new Error(JSON.stringify(built.diagnostics)); return built.value;
};
const circuit = () => topology({ ...circleFixture(), turnouts: [] });
const distance = (a: { x: number; y: number; z: number }, b: { x: number; y: number; z: number }) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
function motion(value = circuit(), edgeId = "curve-0/forward", offset = 0.01, vehicles = DEFAULT_VEHICLES): RoutedMotion {
  const placed = RoutedMotion.place(value, { trainId: "display-train", length: consistFootprint(vehicles), rear: { edgeId, distance: offset } });
  if (!placed.ok) throw new Error(placed.message); return placed.motion;
}
function poses(subject: RoutedMotion, vehicles = DEFAULT_VEHICLES): readonly RoutedVehiclePose[] {
  const solved = solveRoutedPoses(subject, vehicles); if (!solved.ok) throw new Error(solved.message); return solved.poses;
}

describe("original vehicle catalog and complete footprint P06-T02", () => {
  it("pins stable catalog dimensions and a cross-language integer-micrometre footprint", () => {
    expect(VEHICLE_CATALOG_VERSION).toBe("tin-junction-vehicles-v1");
    expect(consistFootprint(DEFAULT_VEHICLES)).toBe(0.2845);
    expect(consistFootprint(DEFAULT_VEHICLES.slice(0, 1))).toBe(0.1195);
    const longest = [DEFAULT_VEHICLES[0]!, ...Array.from({ length: 7 }, (_, index) => ({ id: `car-${index}`, catalogId: "wagon-01" as const }))];
    expect(consistFootprint(longest)).toBe(0.697);
    expect(consistClearanceEnvelope(DEFAULT_VEHICLES)).toEqual({ halfWidth: 0.02353125, height: 0.0516, minimumRadius: 0.1 });
    expect(Object.isFrozen(VEHICLE_CATALOG["steam-01"])).toBe(true);
  });

  it("rejects unknown assets, duplicate identities, noncanonical engines and unsupported extra fields", () => {
    const invalid = [null, [], [{ id: "a", catalogId: "coach-01" }], [{ id: "a", catalogId: "unknown" }],
      [...DEFAULT_VEHICLES, { id: "another-engine", catalogId: "steam-01" }], [DEFAULT_VEHICLES[0], { ...DEFAULT_VEHICLES[1], id: DEFAULT_VEHICLES[0]!.id }],
      [{ ...DEFAULT_VEHICLES[0], orientation: -1 }], [{ id: "x".repeat(129), catalogId: "steam-01" }], Array(9).fill(DEFAULT_VEHICLES[0])];
    for (const input of invalid) expect(validateConsistVehicles(input)).toBe(false);
    expect(() => consistFootprint([])).toThrow(RangeError);
  });
});

describe("rigid routed vehicle and wheel placement P06-T02", () => {
  it("preserves rigid wheelbase chords, rail gauge/contact and coupler gaps at the minimum radius", () => {
    const subject = motion(); subject.setThrottle(0.6);
    for (let tick = 0; tick < 900; tick++) {
      subject.step();
      if (tick % 15 !== 0) continue;
      const solved = poses(subject);
      for (const [index, pose] of solved.entries()) {
        const definition = VEHICLE_CATALOG[pose.catalogId];
        expect(distance(pose.frontPivot, pose.rearPivot)).toBeCloseTo(definition.wheelbaseMicrometres / 1e6, 10);
        expect(pose.frontDistance - pose.rearDistance).toBeGreaterThan(definition.wheelbaseMicrometres / 1e6);
        expect(pose.frontCouplerAngle).toBeLessThanOrEqual(VEHICLE_CONSTRAINTS.maximumCouplerAngle);
        expect(pose.rearCouplerAngle).toBeLessThanOrEqual(VEHICLE_CONSTRAINTS.maximumCouplerAngle);
        expect(distance(pose.frontCouplerAttachment, pose.frontCoupler)).toBeCloseTo(0.0015, 12);
        expect(distance(pose.rearCouplerAttachment, pose.rearCoupler)).toBeCloseTo(0.0015, 12);
        for (const axle of pose.axles) {
          const rail = sampleRouteCursor(subject.network.graph, axle.routeCursor);
          expect(distance(axle.leftWheel, axle.rightWheel)).toBeCloseTo(RAIL_CENTER_SPACING, 12);
          expect(axle.center.x).toBeCloseTo(rail.position.x, 12); expect(axle.center.z).toBeCloseTo(rail.position.z, 12);
          expect(axle.center.y - axle.wheelRadius).toBeCloseTo(rail.position.y + VEHICLE_CONSTRAINTS.railTop, 12);
          expect(axle.leftWheel.x).toBeCloseTo(rail.position.x - rail.right.x * RAIL_CENTER_SPACING / 2, 12);
          expect(axle.rightWheel.z).toBeCloseTo(rail.position.z + rail.right.z * RAIL_CENTER_SPACING / 2, 12);
        }
        if (index > 0) expect(distance(solved[index - 1]!.rearCoupler, pose.frontCoupler)).toBeCloseTo(0.006, 8);
      }
    }
  });

  it("places the complete consist through a minimum-radius S curve with an authored transition", () => {
    const subject = motion(topology(sCurveVehicleFixture()), "part-0/forward", 0);
    subject.setThrottle(0.4);
    let sawBothArcDirections = false;
    for (let tick = 0; tick < 360; tick++) {
      subject.step();
      const solved = poses(subject);
      const edges = solved.flatMap(pose => pose.axles.map(axle => axle.routeCursor.edgeId));
      sawBothArcDirections ||= edges.some(edge => edge === "part-1/forward") && edges.some(edge => edge === "part-3/forward");
      for (let index = 1; index < solved.length; index++) expect(distance(solved[index - 1]!.rearCoupler, solved[index]!.frontCoupler)).toBeCloseTo(0.006, 8);
    }
    expect(sawBothArcDirections).toBe(true);
  });

  it("rejects an immediate reverse S curve when it exceeds the supported coupler angle", () => {
    const subject = motion(topology(sCurveVehicleFixture(0)), "part-0/forward", 0);
    subject.setThrottle(0.4);
    let rejected = false;
    for (let tick = 0; tick < 200; tick++) {
      subject.step();
      const before = subject.snapshot(), solved = solveRoutedPoses(subject, DEFAULT_VEHICLES);
      if (solved.ok) continue;
      expect(solved.code).toBe("unsupported-route-geometry"); expect(solved.message).toContain("coupler angle");
      expect(subject.snapshot()).toEqual(before); rejected = true; break;
    }
    expect(rejected).toBe(true);
  });

  it("commits compatible motion and poses together and parks before an unsupported transition", () => {
    let active = motion(topology(sCurveVehicleFixture(0)), "part-0/forward", 0);
    active.setThrottle(0.4);
    let rejected = false;
    for (let tick = 0; tick < 200; tick++) {
      const before = active.snapshot(), currentPoses = poses(active), prepared = prepareVehicleStep(active, DEFAULT_VEHICLES);
      expect(active.snapshot()).toEqual(before);
      if (prepared.ok) {
        expect(prepared.state.motion.tickCount).toBe(active.tickCount + 1);
        expect(prepared.state.poses).toEqual(poses(prepared.state.motion)); active = prepared.state.motion; continue;
      }
      expect(prepared.parked).not.toBeNull(); if (!prepared.parked) return;
      expect(prepared.parked.motion.speed).toBe(0); expect(prepared.parked.motion.throttle).toBe(0);
      expect(prepared.parked.motion.intervals).toEqual(active.intervals);
      expect(prepared.parked.motion.signedTravel).toBe(active.signedTravel);
      expect(prepared.parked.poses).toEqual(currentPoses);
      rejected = true; break;
    }
    expect(rejected).toBe(true);
  });

  it("bounds an eight-vehicle consist on a loop and preserves all physical identities after reversal", () => {
    const vehicles = [DEFAULT_VEHICLES[0]!, ...Array.from({ length: 7 }, (_, index) => ({ id: `car-${index}`, catalogId: "wagon-01" as const }))];
    const subject = motion(topology(vehicleCircleFixture(0.2)), "curve-0/forward", 0.01, vehicles);
    subject.setThrottle(0.8);
    for (let tick = 0; tick < 600; tick++) {
      subject.step();
      if (tick % 30 === 0) expect(poses(subject, vehicles)).toHaveLength(8);
    }
    subject.stop(); for (let tick = 0; tick < 120; tick++) subject.step();
    const before = poses(subject, vehicles); expect(subject.reverse().ok).toBe(true);
    const after = poses(subject, vehicles);
    expect(after.map(pose => pose.id)).toEqual(vehicles.map(vehicle => vehicle.id));
    for (let index = 0; index < before.length; index++) expect(distance(before[index]!.position, after[index]!.position)).toBeLessThan(1e-10);
    const tooShort = RoutedMotion.place(circuit(), { trainId: "too-long", length: consistFootprint(vehicles), rear: { edgeId: "curve-0/forward", distance: 0 } });
    expect(tooShort.ok).toBe(false);
  });

  it("keeps trailing vehicles on the latched turnout after the locomotive has cleared it", () => {
    const subject = motion(topology(minimumTurnoutFixture()), "approach/forward", 0);
    expect(subject.selectTurnout("points", "diverging").ok).toBe(true); subject.setThrottle(0.5);
    let trailingPassage = false;
    for (let tick = 0; tick < 450; tick++) {
      subject.step();
      const solved = poses(subject);
      const engine = solved[0]!, trailing = solved.slice(1).flatMap(pose => pose.axles);
      if (engine.axles.every(axle => axle.routeCursor.edgeId === "branch/forward") && trailing.some(axle => axle.routeCursor.edgeId === "points:route:diverging/forward")) {
        trailingPassage = true;
        const before = subject.snapshot();
        expect(subject.selectTurnout("points", "straight").code).toBe("turnout-occupied"); expect(subject.snapshot()).toEqual(before);
      }
      expect(solved.flatMap(pose => pose.axles).some(axle => axle.routeCursor.edgeId === "points:route:straight/forward")).toBe(false);
    }
    expect(trailingPassage).toBe(true);
  });

  it("preserves every physical vehicle pose, identity and coupler across a stopped reversal", () => {
    const subject = motion(); subject.setThrottle(0.5);
    for (let tick = 0; tick < 100; tick++) subject.step();
    subject.stop(); for (let tick = 0; tick < 120; tick++) subject.step();
    const before = poses(subject), travel = subject.signedTravel;
    expect(subject.reverse().ok).toBe(true);
    const reversed = poses(subject);
    expect(reversed.map(pose => pose.id)).toEqual(before.map(pose => pose.id));
    for (let index = 0; index < before.length; index++) {
      expect(distance(before[index]!.position, reversed[index]!.position)).toBeLessThan(1e-10);
      expect(distance(before[index]!.frontCoupler, reversed[index]!.frontCoupler)).toBeLessThan(1e-10);
      expect(distance(before[index]!.rearCoupler, reversed[index]!.rearCoupler)).toBeLessThan(1e-10);
      for (let axle = 0; axle < before[index]!.axles.length; axle++) expect(reversed[index]!.axles[axle]!.wheelPhase).toBeCloseTo(before[index]!.axles[axle]!.wheelPhase, 10);
    }
    expect(subject.signedTravel).toBe(travel);
    subject.setThrottle(0.25); for (let tick = 0; tick < 60; tick++) subject.step();
    expect(subject.signedTravel).toBeLessThan(travel); expect(poses(subject).map(pose => pose.id)).toEqual(before.map(pose => pose.id));
  });

  it("drives wheel angle from actual signed distance and preserves it across snapshot restoration", () => {
    const value = circuit(), subject = motion(value);
    subject.setThrottle(0.4); for (let tick = 0; tick < 150; tick++) subject.step();
    const saved = subject.snapshot(), restored = RoutedMotion.restore(value, saved);
    expect(restored.ok).toBe(true); if (!restored.ok) return;
    const actual = poses(subject), reloaded = poses(restored.motion);
    for (let index = 0; index < actual.length; index++) for (let axle = 0; axle < actual[index]!.axles.length; axle++) {
      expect(actual[index]!.axles[axle]!.wheelPhase).toBeCloseTo((subject.signedTravel + actual[index]!.axles[axle]!.routeDistance - consistFootprint(DEFAULT_VEHICLES)) / 0.006, 10);
      expect(reloaded[index]!.axles[axle]!.wheelPhase).toBe(actual[index]!.axles[axle]!.wheelPhase);
    }
    const oneTurn = solveRoutedPoses({ network: subject.network, intervals: subject.intervals, direction: subject.direction, signedTravel: subject.signedTravel + 2 * Math.PI * 0.006 }, DEFAULT_VEHICLES);
    expect(oneTurn.ok).toBe(true); if (oneTurn.ok) expect(oneTurn.poses[0]!.axles[0]!.wheelPhase - actual[0]!.axles[0]!.wheelPhase).toBeCloseTo(2 * Math.PI, 12);
  });

  it("uses each axle's actual arc displacement as rigid and coupling offsets change through a curve", () => {
    const fixture = sCurveVehicleFixture(), starts = new Map<string, number>(); let accumulated = 0;
    for (const piece of fixture.pieces) { starts.set(`${piece.id}/forward`, accumulated); accumulated += centerlineLength(piece.centerline); }
    const subject = motion(topology(fixture), "part-0/forward", 0); subject.setThrottle(0.4);
    let prior = poses(subject).flatMap(pose => pose.axles), priorTravel = subject.signedTravel, sawOffsetChange = false;
    for (let tick = 0; tick < 300; tick++) {
      subject.step(); const current = poses(subject).flatMap(pose => pose.axles);
      for (let index = 0; index < current.length; index++) {
        const a = prior[index]!, b = current[index]!, arcDistance = starts.get(b.routeCursor.edgeId)! + b.routeCursor.distance - starts.get(a.routeCursor.edgeId)! - a.routeCursor.distance;
        const spunDistance = (b.wheelPhase - a.wheelPhase) * b.wheelRadius;
        expect(spunDistance).toBeCloseTo(arcDistance, 10);
        expect(spunDistance).toBeCloseTo(subject.signedTravel - priorTravel + b.routeDistance - a.routeDistance, 10);
        sawOffsetChange ||= Math.abs(arcDistance - (subject.signedTravel - priorTravel)) > 1e-7;
      }
      prior = current; priorTravel = subject.signedTravel;
    }
    expect(sawOffsetChange).toBe(true);
  });

  it("rejects wrong footprints and malformed pose history without changing the motion authority", () => {
    const subject = motion(), before = subject.snapshot();
    expect(solveRoutedPoses(subject, DEFAULT_VEHICLES.slice(0, 1)).ok).toBe(false);
    for (const intervals of [[], [{ edgeId: "absent", from: 0, to: 1 }], [{ ...subject.intervals[0]!, from: NaN }], [...subject.intervals].reverse()]) {
      expect(solveRoutedPoses({ network: subject.network, intervals, direction: 1, signedTravel: subject.signedTravel }, DEFAULT_VEHICLES).ok).toBe(false);
    }
    expect(solveRoutedPoses({ network: subject.network, intervals: subject.intervals, direction: 1, signedTravel: Infinity }, DEFAULT_VEHICLES).ok).toBe(false);
    expect(subject.snapshot()).toEqual(before);
  });

  it("rejects forged self-overlapping history even when total length matches the catalog", () => {
    const value = circuit(), network = compileTurnoutRoutes(value); if (!network.ok) throw new Error("invalid fixture");
    const vehicles = [DEFAULT_VEHICLES[0]!, ...Array.from({ length: 7 }, (_, index) => ({ id: `car-${index}`, catalogId: "wagon-01" as const }))];
    const quarter = Math.PI * 0.1 / 2;
    const intervals = Array.from({ length: 4 }, (_, index) => ({ edgeId: `curve-${index}/forward`, from: 0, to: quarter }));
    intervals.push({ edgeId: "curve-0/forward", from: 0, to: consistFootprint(vehicles) - 4 * quarter });
    const solved = solveRoutedPoses({ network: network.value, intervals, direction: 1, signedTravel: 0 }, vehicles);
    expect(solved.ok).toBe(false); if (!solved.ok) expect(solved.message).toContain("overlaps");
    const exactRadius = consistFootprint(vehicles) / (2 * Math.PI), exact = compileTurnoutRoutes(topology(vehicleCircleFixture(exactRadius)));
    if (!exact.ok) throw new Error("invalid full-loop fixture");
    const contact = solveRoutedPoses({ network: exact.value, intervals: Array.from({ length: 4 }, (_, index) => ({ edgeId: `curve-${index}/forward`, from: 0, to: exactRadius * Math.PI / 2 })), direction: 1, signedTravel: 0 }, vehicles);
    expect(contact.ok).toBe(false); if (!contact.ok) expect(contact.message).toContain("entire circuit");
  });

  it("rejects graph-tolerated rail gaps, overlaps and tangent steps before a visible axle reaches them", () => {
    for (const [offset, yaw] of [[0.00019, 0], [-0.00019, 0], [0, 0.003]] as const) {
      const piece = (id: string, z: number, angle = 0) => ({ id, centerline: { kind: "straight" as const, length: 0.2 }, pose: { x: 0, y: 0, z, yaw: angle }, gauge: RAIL_PROFILE.gauge, profile: RAIL_PROFILE.id });
      const value = topology({ revision: 0, turnouts: [], pieces: [piece("a", 0), piece("b", 0.2 + offset, yaw)],
        connections: [{ id: "join", a: { pieceId: "a", socketId: "exit" }, b: { pieceId: "b", socketId: "entrance" } }] });
      const subject = motion(value, "a/forward", 0.1, DEFAULT_VEHICLES.slice(0, 1)), before = subject.snapshot();
      const solved = solveRoutedPoses(subject, DEFAULT_VEHICLES.slice(0, 1));
      expect(solved.ok).toBe(false); if (!solved.ok) expect(solved.message).toContain("Snap");
      expect(subject.snapshot()).toEqual(before);
    }
  });
});
