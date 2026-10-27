import { describe, expect, it } from "vitest";
import { previewTrackDraft, TrackPlacementDraft } from "../../../web/src/editor/placementValidation";
import { clearanceDraft, clearanceStraight, compactTurnoutFixture, crossingFixture, testEnvelope } from "../../fixtures/track/clearance-fixtures";

const placement = (edgeId = "first/forward", length = 0.12) => ({ trainId: "train", length, rear: { edgeId, distance: 0.02 } });

describe("editor draft → geometry clearance → routed train integration P05-T05", () => {
  it("retains an unsafe draft and identifies conflicting pieces while rejecting operation", () => {
    const original = crossingFixture(), editor = new TrackPlacementDraft(original, testEnvelope), before = JSON.stringify(editor.snapshot());
    expect(editor.preview.structurallyValid).toBe(true); expect(editor.preview.readyForPlacement).toBe(false);
    expect(editor.preview.diagnostics).toContainEqual(expect.objectContaining({ code: "track-overlap", pieceIds: ["east-west", "north-south"] }));
    expect(editor.placeTrain(placement("east-west/forward"), 0, "edit")).toMatchObject({ ok: false, code: "unsafe-placement" });
    expect(JSON.stringify(editor.snapshot())).toBe(before); expect(editor.activeTrain).toBeNull();
    expect(original).toEqual(crossingFixture());
  });

  it("accepts a corrected editing transaction and atomically publishes a fully supported consist", () => {
    const draft = crossingFixture(), editor = new TrackPlacementDraft(draft, testEnvelope);
    draft.pieces = draft.pieces.map(piece => piece.id === "north-south" ? { ...piece, pose: { ...piece.pose, x: 0.25 } } : piece);
    const changed = editor.replace(draft, 0);
    expect(changed.ok).toBe(true); expect(changed.preview.readyForPlacement).toBe(true); expect(editor.revision).toBe(1);
    const placed = editor.placeTrain(placement("east-west/forward"), 1, "edit");
    expect(placed.ok).toBe(true);
    if (!placed.ok) return;
    expect(editor.activeTrain).toBe(placed.consist); expect(placed.consist.length).toBe(0.12);
    expect(placed.consist.advance(0.05).ok).toBe(true);
    expect(placed.consist.front.edgeId).toBe("east-west/forward");
  });

  it("preserves the previous safe placement when an invalid new draft cannot be operated", () => {
    const editor = new TrackPlacementDraft(clearanceDraft([clearanceStraight("first")]), testEnvelope);
    expect(editor.placeTrain(placement(), 0, "edit").ok).toBe(true);
    const active = editor.activeTrain, state = active!.snapshot();
    const changed = editor.replace(crossingFixture(), 0);
    expect(changed.ok).toBe(true); expect(changed.preview.readyForPlacement).toBe(false);
    const failed = editor.placeTrain(placement("east-west/forward"), 1, "edit");
    expect(failed.ok).toBe(false); expect(editor.activeTrain).toBe(active); expect(active!.snapshot()).toEqual(state);
    expect(editor.snapshot()).toEqual(crossingFixture());
  });

  it("leaves incomplete layouts editable and distinguishes insufficient train support from geometric conflicts", () => {
    const draft = clearanceDraft([clearanceStraight("first", 0, -0.05, 0.1), clearanceStraight("decorative", 0.1, -0.05, 0.1)]);
    const editor = new TrackPlacementDraft(draft, testEnvelope);
    expect(editor.preview.readyForPlacement).toBe(true);
    const tooLong = editor.placeTrain(placement("first/forward", 0.12), 0, "edit");
    expect(tooLong).toMatchObject({ ok: false, code: "insufficient-route" });
    if (!tooLong.ok) expect(tooLong.diagnostics[0]!.pieceIds).toEqual(["first"]);
    expect(editor.placeTrain(placement("first/forward", 0.05), 0, "edit").ok).toBe(true);
    expect(editor.snapshot()).toEqual(draft);
  });

  it("uses explicit turnout connections, safe selections and full occupancy after placement", () => {
    const editor = new TrackPlacementDraft(compactTurnoutFixture(), testEnvelope);
    expect(editor.preview.readyForPlacement).toBe(true);
    const placed = editor.placeTrain({ trainId: "train", length: 0.08, rear: { edgeId: "approach/forward", distance: 0.1 }, selections: [{ turnoutId: "points", route: "diverging" }] }, 0, "edit");
    expect(placed.ok).toBe(true);
    if (!placed.ok) return;
    expect(placed.consist.advance(0.05).ok).toBe(true);
    expect(placed.consist.front.edgeId).toBe("points:route:diverging/forward");
    expect(placed.consist.selectTurnout("points", "straight").code).toBe("turnout-occupied");
  });

  it("rejects stale preview/placement revisions without changing draft or committed topology", () => {
    const draft = clearanceDraft([clearanceStraight("first")]), editor = new TrackPlacementDraft(draft, testEnvelope);
    expect(editor.placeTrain(placement(), 0, "edit").ok).toBe(true);
    const active = editor.activeTrain, before = JSON.stringify(editor.snapshot()), preview = editor.preview;
    expect(editor.replace(crossingFixture(), 1).code).toBe("stale-draft");
    expect(editor.placeTrain(placement(), 1, "edit")).toMatchObject({ ok: false, code: "stale-draft" });
    expect(editor.preview).toBe(preview); expect(editor.activeTrain).toBe(active); expect(JSON.stringify(editor.snapshot())).toBe(before);
  });

  it("requires paused edit mode before publishing a replacement train placement", () => {
    const editor = new TrackPlacementDraft(clearanceDraft([clearanceStraight("first")]), testEnvelope);
    expect(editor.placeTrain(placement(), 0, "operate")).toMatchObject({ ok: false, code: "editing-required" });
    expect(editor.activeTrain).toBeNull(); expect(editor.revision).toBe(0);
    expect(editor.placeTrain(placement(), 0, "edit").ok).toBe(true);
    const active = editor.activeTrain;
    expect(editor.placeTrain({ ...placement(), trainId: "replacement" }, 0, "operate").ok).toBe(false);
    expect(editor.activeTrain).toBe(active);
  });

  it("preserves malformed topology drafts for repair and gives actionable grade/geometry/join diagnostics", () => {
    const valid = clearanceDraft([clearanceStraight("first")]);
    const grade = { ...valid, pieces: [{ ...valid.pieces[0], pose: { ...valid.pieces[0]!.pose, pitch: 0.01 } }] };
    const editor = new TrackPlacementDraft(grade, testEnvelope);
    expect(editor.preview.diagnostics[0]).toMatchObject({ code: "unsupported-grade", pieceIds: ["first"] });
    expect(previewTrackDraft({ ...valid, pieces: [{ ...valid.pieces[0], grade: 0.000001 }] }, testEnvelope).diagnostics[0]!.code).toBe("unsupported-grade");
    expect(editor.snapshot()).toEqual(grade); expect(editor.placeTrain(placement(), 0, "edit").ok).toBe(false);
    const spline = { ...valid, pieces: [{ ...valid.pieces[0], centerline: { kind: "spline", controls: [] } }] };
    expect(editor.replace(spline, 0).ok).toBe(true); expect(editor.preview.diagnostics[0]!.code).toBe("unsupported-geometry");
    const unsupportedJoin = { ...clearanceDraft([clearanceStraight("first"), clearanceStraight("second", 0.1)]), connections: [{ id: "joint", a: { pieceId: "first", socketId: "exit" }, b: { pieceId: "second", socketId: "entrance" } }] };
    expect(editor.replace(unsupportedJoin, 1).ok).toBe(true);
    expect(editor.preview.diagnostics[0]).toMatchObject({ code: "misaligned-socket", pieceIds: ["first", "second"] });
    expect(editor.preview.diagnostics[0]!.message).toContain("Align");
    expect(editor.replace(valid, 2).ok).toBe(true); expect(editor.preview.readyForPlacement).toBe(true);
  });

  it("rejects nonfinite, oversized and non-JSON replacement data without losing editable work", () => {
    const draft = clearanceDraft([clearanceStraight("first")]), editor = new TrackPlacementDraft(draft, testEnvelope), before = JSON.stringify(editor.snapshot());
    const circular: Record<string, unknown> = {}; circular.self = circular;
    for (const invalid of [{ value: NaN }, { value: Infinity }, { value: "x".repeat(600_000) }, { value: Array(10_001).fill(0) }, circular, undefined, { value: () => 1 }]) {
      expect(editor.replace(invalid, 0).code).toBe("invalid-draft-data");
      expect(JSON.stringify(editor.snapshot())).toBe(before); expect(editor.revision).toBe(0);
    }
    expect(() => new TrackPlacementDraft(draft, { ...testEnvelope, halfWidth: 0 })).toThrow(RangeError);
  });

  it("detaches caller-owned drafts and does not let a mutated snapshot bypass the placement gate", () => {
    const draft = crossingFixture(), editor = new TrackPlacementDraft(draft, testEnvelope);
    draft.pieces.length = 0;
    const snapshot = editor.snapshot() as ReturnType<typeof crossingFixture>; snapshot.pieces.length = 0;
    expect((editor.snapshot() as ReturnType<typeof crossingFixture>).pieces).toHaveLength(2);
    expect(editor.placeTrain(placement("east-west/forward"), 0, "edit").ok).toBe(false);
    expect(previewTrackDraft(null, testEnvelope).readyForPlacement).toBe(false);
  });
});
