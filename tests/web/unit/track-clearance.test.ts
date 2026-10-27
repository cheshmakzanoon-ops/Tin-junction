import { describe, expect, it } from "vitest";
import { buildTurnoutTopology } from "../../../web/src/track/turnout";
import type { TurnoutTopology } from "../../../web/src/track/turnout";
import { CLEARANCE_LIMITS, validateTrackClearance } from "../../../web/src/track/clearance";
import { clearanceDraft, clearanceStraight, compactTurnoutFixture, crossingFixture, testEnvelope } from "../../fixtures/track/clearance-fixtures";
import { circleFixture } from "../../fixtures/track/graph-fixtures";

const topology = (input: unknown): TurnoutTopology => {
  const result = buildTurnoutTopology(input);
  if (!result.ok) throw new Error(JSON.stringify(result.diagnostics));
  return result.value;
};
const analyze = (input: unknown, envelope: unknown = testEnvelope) => validateTrackClearance(topology(input), envelope);

describe("conservative planar track clearance P05-T05", () => {
  it("accepts an explicitly connected circuit and safe disconnected decorative track", () => {
    const circle = { ...circleFixture(), turnouts: [] };
    expect(analyze(circle).ok).toBe(true);
    expect(analyze(clearanceDraft([clearanceStraight("first", -0.1), clearanceStraight("second", 0.1)])).ok).toBe(true);
    expect(analyze(clearanceDraft([])).ok).toBe(true);
  });

  it("accepts both authored turnout routes without classifying the points as a collision", () => {
    const value = analyze(compactTurnoutFixture());
    expect(value.diagnostics).toEqual([]); expect(value.ok).toBe(true);
    expect(value.sampledSegments).toBeGreaterThan(0);
  });

  it("identifies both conflicting pieces for a level crossing and parallel overlap", () => {
    const crossing = analyze(crossingFixture());
    expect(crossing.ok).toBe(false);
    expect(crossing.diagnostics).toContainEqual(expect.objectContaining({ code: "track-overlap", pieceIds: ["east-west", "north-south"] }));
    const overlap = analyze(clearanceDraft([clearanceStraight("b", 0.02), clearanceStraight("a")]));
    expect(overlap.diagnostics).toContainEqual(expect.objectContaining({ code: "track-overlap", pieceIds: ["a", "b"] }));
    expect(overlap.diagnostics[0]!.message).toContain("Move a piece");
  });

  it("only exempts a legal connector neighbourhood, not arbitrary nearby endpoints", () => {
    const pieces = [clearanceStraight("a", 0, -0.1, 0.1), clearanceStraight("b", 0, 0, 0.1)];
    const draft = clearanceDraft(pieces);
    expect(analyze(draft).ok).toBe(false);
    const connected = { ...draft, connections: [{ id: "joint", a: { pieceId: "a", socketId: "exit" }, b: { pieceId: "b", socketId: "entrance" } }] };
    expect(analyze(connected).ok).toBe(true);
    const returnLoop = { ...connected, pieces: [clearanceStraight("a", 0, -0.2, 0.2), { ...clearanceStraight("b", 0, 0), centerline: { kind: "arc", radius: 0.1, sweep: Math.PI * 2 } }] };
    expect(analyze(returnLoop).diagnostics).toContainEqual(expect.objectContaining({ code: "track-overlap", pieceIds: ["a", "b"] }));
  });

  it("rejects self-overlap near a full-circle piece's unconnected ends", () => {
    const draft = clearanceDraft([{ ...clearanceStraight("ring", 0, 0), centerline: { kind: "arc", radius: 0.1, sweep: Math.PI * 2 } }]);
    expect(analyze(draft).diagnostics).toContainEqual(expect.objectContaining({ code: "self-overlap", pieceIds: ["ring"] }));
  });

  it("checks the complete swept envelope against the case boundary", () => {
    const radius = testEnvelope.halfWidth + CLEARANCE_LIMITS.lateralMargin;
    const edge = clearanceStraight("edge", CLEARANCE_LIMITS.boardWidth / 2 - radius, -0.05, 0.1);
    expect(analyze(clearanceDraft([edge])).ok).toBe(true);
    expect(analyze(clearanceDraft([{ ...edge, pose: { ...edge.pose, x: edge.pose.x + 1e-7 } }])).diagnostics).toContainEqual(expect.objectContaining({ code: "board-clearance", pieceIds: ["edge"] }));
    const outwardCurve = { ...clearanceStraight("curve", 0.3, -0.1), centerline: { kind: "arc" as const, radius: 0.1, sweep: Math.PI } };
    expect(analyze(clearanceDraft([outwardCurve])).diagnostics).toContainEqual(expect.objectContaining({ code: "board-clearance", pieceIds: ["curve"] }));
  });

  it("uses the stricter vehicle minimum radius and accepts its exact supported boundary", () => {
    const curve = { ...clearanceStraight("curve", 0, 0), centerline: { kind: "arc" as const, radius: 0.1, sweep: Math.PI / 2 } };
    const envelope = { ...testEnvelope, minimumRadius: 0.1001 };
    expect(analyze(clearanceDraft([curve]), envelope).diagnostics).toContainEqual(expect.objectContaining({ code: "minimum-radius", pieceIds: ["curve"] }));
    expect(analyze(clearanceDraft([{ ...curve, centerline: { ...curve.centerline, radius: 0.1001 } }]), envelope).ok).toBe(true);
  });

  it("rejects raised crossings below and above hypothetical headroom instead of silently certifying a bridge", () => {
    const low = analyze(crossingFixture(testEnvelope.height + CLEARANCE_LIMITS.trackBedHeight - 1e-6));
    expect(low.diagnostics).toContainEqual(expect.objectContaining({ code: "vertical-clearance", pieceIds: ["east-west", "north-south"] }));
    const high = analyze(crossingFixture(testEnvelope.height + CLEARANCE_LIMITS.trackBedHeight));
    expect(high.diagnostics).toContainEqual(expect.objectContaining({ code: "unsupported-overpass", pieceIds: ["east-west", "north-south"] }));
    expect(high.diagnostics).toContainEqual(expect.objectContaining({ code: "unsupported-elevation", pieceIds: ["north-south"] }));
    expect(low.ok).toBe(false); expect(high.ok).toBe(false);
  });

  it("requires the single supported rail plane and never rewrites the candidate elevations", () => {
    const draft = clearanceDraft([clearanceStraight("raised", 0, -0.1, 0.2, 0, 0.01)]), before = JSON.stringify(draft);
    expect(analyze(draft).diagnostics[0]!.code).toBe("unsupported-elevation");
    expect(JSON.stringify(draft)).toBe(before);
    expect(analyze(clearanceDraft([clearanceStraight("level")])).ok).toBe(true);
  });

  it("returns bounded deterministic diagnostics and rejects invalid or forged policy inputs", () => {
    const crowd = clearanceDraft(Array.from({ length: 100 }, (_, index) => clearanceStraight(`piece-${String(index).padStart(3, "0")}`)));
    const first = analyze(crowd), second = analyze(crowd);
    expect(first).toEqual(second); expect(first.truncated).toBe(true); expect(first.diagnostics.length).toBe(CLEARANCE_LIMITS.maxDiagnostics);
    expect(first.diagnostics.at(-1)!.code).toBe("diagnostic-limit");
    const draft = clearanceDraft([clearanceStraight("a")]);
    for (const envelope of [null, {}, { ...testEnvelope, extra: true }, { ...testEnvelope, height: NaN }, { ...testEnvelope, minimumRadius: 0 }, { ...testEnvelope, halfWidth: 0.1 }]) expect(analyze(draft, envelope).diagnostics[0]!.code).toBe("invalid-envelope");
    expect(validateTrackClearance({ ...topology(draft) }, testEnvelope).diagnostics[0]!.code).toBe("invalid-topology");
  });

  it("does not depend on input piece order for conflicting identifiers or messages", () => {
    const draft = crossingFixture(), reversed = { ...draft, pieces: [...draft.pieces].reverse() };
    expect(analyze(draft)).toEqual(analyze(reversed));
    expect(Object.isFrozen(analyze(draft).diagnostics[0]!.pieceIds)).toBe(true);
  });

  it("fails safely when a dense draft exceeds the adaptive sampling budget", () => {
    const draft = clearanceDraft(Array.from({ length: 150 }, (_, index) => ({ ...clearanceStraight(`ring-${index}`, 0, 0), centerline: { kind: "arc" as const, radius: 0.1, sweep: 2 * Math.PI } })));
    const report = analyze(draft);
    expect(report.ok).toBe(false); expect(report.truncated).toBe(true);
    expect(report.diagnostics).toContainEqual(expect.objectContaining({ code: "sampling-limit" }));
    expect(report.sampledSegments).toBeGreaterThan(CLEARANCE_LIMITS.maxSegments);
    expect(report.sampledSegments).toBeLessThan(CLEARANCE_LIMITS.maxSegments + 1_000);
  });
});
