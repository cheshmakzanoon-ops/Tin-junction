import { describe, expect, it } from "vitest";
import { FixedStepClock } from "../../../web/src/clock";
import { ACCELERATION, BRAKE_DECELERATION, HISTORY_LIMIT, MAX_SPEED, REPLAY_LIMIT, RailwayModel, STEP_SECONDS, canonicalLayout, cloneLayout, createRandom, createStarterLayout, ovalLength, parseLayoutDocument, replayCommands, stateDigest, wrapDistance } from "../../../web/src/model";
import type { LayoutDocument, ModelCommand, SceneryItem } from "../../../web/src/model";

const ornament = (id = "user-fir"): SceneryItem => ({ id, kind: "fir", x: -0.15, z: 0.015, rotation: 0, scale: 0.8 });
const semantic = (document: LayoutDocument): string => {
  const copy = cloneLayout(document); copy.revision = 0;
  return canonicalLayout(copy);
};

describe("distance-based fixed-tick railway operation", () => {
  it("starts stopped, accelerates smoothly, caps speed and counts ticks independently of revision", () => {
    const model = new RailwayModel();
    const initial = model.snapshot();
    expect(model.apply({ type: "throttle", value: 1 }).ok).toBe(true);
    model.step();
    expect(model.state.train.speed).toBeCloseTo(ACCELERATION * STEP_SECONDS, 14);
    expect(model.state.train.wheelTravel).toBeCloseTo(ACCELERATION * STEP_SECONDS ** 2 / 2, 14);
    model.step(239);
    expect(model.state.train.speed).toBe(MAX_SPEED);
    expect(model.state.train.wheelTravel).toBeCloseTo(0.54, 12);
    expect(model.state.tick).toBe(240);
    expect(model.state.revision).toBe(initial.revision);
    expect(model.state.train.distance).toBeCloseTo(wrapDistance(initial.train.distance + 0.54, ovalLength(initial.track)), 11);
  });

  it("splits a tick exactly when reaching a target velocity", () => {
    const model = new RailwayModel();
    model.apply({ type: "throttle", value: 0.001 / MAX_SPEED });
    model.step();
    const reach = 0.001 / ACCELERATION;
    const distance = 0.001 * reach / 2 + 0.001 * (STEP_SECONDS - reach);
    expect(model.state.train.speed).toBeCloseTo(0.001, 15);
    expect(model.state.train.wheelTravel).toBeCloseTo(distance, 15);
  });

  it("brakes to zero using the documented stopping distance", () => {
    const model = new RailwayModel();
    model.apply({ type: "throttle", value: 1 }); model.step(180);
    const before = model.state.train.wheelTravel;
    expect(model.apply({ type: "stop" }).ok).toBe(true);
    model.step(60);
    expect(model.state.train.speed).toBe(0);
    expect(model.state.train.wheelTravel - before).toBeCloseTo(MAX_SPEED ** 2 / (2 * BRAKE_DECELERATION), 12);
    const stopped = model.state.train.distance; model.step(600);
    expect(model.state.train.distance).toBe(stopped);
  });

  it("rejects reversal until stationary with zero throttle, then preserves physical identity and wheel phase", () => {
    const model = new RailwayModel();
    model.apply({ type: "throttle", value: 0.5 });
    expect(model.apply({ type: "reverse" }).code).toBe("moving");
    model.step(180);
    const moving = model.snapshot();
    expect(model.apply({ type: "reverse" }).ok).toBe(false);
    expect(model.snapshot()).toEqual(moving);
    model.apply({ type: "stop" }); model.step(180);
    const before = model.snapshot();
    expect(model.apply({ type: "reverse" }).ok).toBe(true);
    expect(model.state.train.distance).toBe(before.train.distance);
    expect(model.state.train.wheelTravel).toBe(before.train.wheelTravel);
    model.apply({ type: "throttle", value: 0.5 }); model.step(120);
    expect(model.state.train.wheelTravel).toBeLessThan(before.train.wheelTravel);
    expect(model.state.train.direction).toBe(-1);
    expect(model.state.documentId).toBe(before.documentId);
  });

  it("restores a saved curve checkpoint stopped without losing travel phase or identifiers", () => {
    const model = new RailwayModel(); model.apply({ type: "throttle", value: 0.6 }); model.step(217);
    const saved = model.snapshot(), restored = new RailwayModel(saved);
    expect(restored.state.train).toEqual({ ...saved.train, speed: 0, throttle: 0 });
    expect(restored.state.tick).toBe(saved.tick);
    expect(restored.state.scenery).toEqual(saved.scenery);
    expect(restored.state.documentId).toBe(saved.documentId);
    expect(new RailwayModel(saved, { restoreStopped: false }).snapshot()).toEqual(saved);
  });

  it("produces identical model state under 30, 60, 120 and irregular render schedules", () => {
    const run = (timestamps: number[]): LayoutDocument => {
      const model = new RailwayModel(), clock = new FixedStepClock();
      model.apply({ type: "throttle", value: 0.7 });
      for (const timestamp of timestamps) model.step(clock.advance(timestamp).steps);
      return model.snapshot();
    };
    const fixed = (hz: number): number[] => Array.from({ length: hz * 6 + 1 }, (_, i) => i * 1000 / hz);
    const irregular = [0]; let time = 0;
    for (const interval of Array.from({ length: 600 }, (_, i) => [7, 13, 11, 9][i % 4]!)) { time += interval; irregular.push(time); }
    const expected = run(fixed(60));
    expect(expected.tick).toBe(360);
    for (const schedule of [fixed(30), fixed(120), irregular]) expect(run(schedule)).toEqual(expected);
  });

  it("bounds suspension catch-up and starts a fresh clock anchor after resume", () => {
    const model = new RailwayModel(), clock = new FixedStepClock();
    model.apply({ type: "throttle", value: 1 }); model.step(clock.advance(0).steps);
    model.step(clock.advance(120_000).steps);
    expect(model.state.tick).toBe(8);
    expect(model.state.train.wheelTravel).toBeLessThan(0.002);
    clock.reset(); const before = model.snapshot();
    model.step(clock.advance(9_000_000).steps);
    expect(model.snapshot()).toEqual(before);
  });

  it("parks in Arrange and freezes ticks until returning to operation", () => {
    const model = new RailwayModel(); model.apply({ type: "throttle", value: 1 }); model.step(120);
    const distance = model.state.train.distance;
    expect(model.setMode("edit").ok).toBe(true);
    const parked = model.snapshot(); model.step(10_000);
    expect(model.snapshot()).toEqual(parked);
    expect(model.state.train.speed).toBe(0);
    expect(model.state.train.throttle).toBe(0);
    expect(model.apply({ type: "throttle", value: 1 }).code).toBe("editing");
    model.setMode("operate"); model.step(100);
    expect(model.state.train.distance).toBe(distance);
  });

  it("rejects invalid advance requests before changing state", () => {
    const model = new RailwayModel(), original = model.snapshot();
    for (const ticks of [-1, 0.5, Infinity, Number.NaN, 360_001]) expect(() => model.step(ticks)).toThrow();
    expect(model.snapshot()).toEqual(original);
  });
});

describe("atomic editor transactions and bounded history", () => {
  it("requires Arrange for physical edits and never mutates on rejection", () => {
    const model = new RailwayModel(), original = model.snapshot();
    expect(model.apply({ type: "scenery.add", item: ornament() }).code).toBe("editing_required");
    expect(model.snapshot()).toEqual(original);
    model.setMode("edit");
    expect(model.apply({ type: "scenery.add", item: ornament() }).ok).toBe(true);
    const after = model.snapshot();
    expect(after.revision).toBe(1);
    for (const command of [
      { type: "scenery.add", item: ornament() },
      { type: "scenery.move", id: "user-fir", x: 0, z: 0.145 },
      { type: "scenery.move", id: "missing-id", x: 0, z: 0 },
      { type: "scenery.remove", id: "missing-id" },
      { type: "scenery.add", item: { ...ornament("outside"), x: 0.4 } },
      { type: "track", value: { kind: "oval", straightLength: 0.5, radius: 0.2 } },
    ] as ModelCommand[]) {
      expect(model.apply(command).ok).toBe(false); expect(model.snapshot()).toEqual(after);
    }
  });

  it("validates expected revisions and malformed commands without partial changes", () => {
    const model = new RailwayModel(); model.setMode("edit");
    model.apply({ type: "scenery.add", item: ornament() });
    const current = model.snapshot();
    expect(model.apply({ type: "scenery.remove", id: "user-fir" }, 0).code).toBe("stale_revision");
    expect(model.apply({ type: "throttle", value: Number.NaN }).code).toBe("invalid_command");
    expect(model.apply({ type: "eval", value: "javascript" } as unknown as ModelCommand).code).toBe("invalid_command");
    expect(model.apply({ type: "stop", arbitrary: true } as unknown as ModelCommand).code).toBe("invalid_command");
    expect(model.snapshot()).toEqual(current);
  });

  it("undoes and redoes mixed structural edits exactly while revision always increases", () => {
    const model = new RailwayModel(); model.setMode("edit");
    const initial = model.snapshot();
    const commands: ModelCommand[] = [
      { type: "scenery.add", item: ornament() },
      { type: "scenery.move", id: "user-fir", x: -0.16, z: 0.025, rotation: 1 },
      { type: "environment", value: "night" },
      { type: "rename", value: "A little evening railway" },
      { type: "scenery.remove", id: "village-house-center" },
    ];
    for (const command of commands) expect(model.apply(command).ok).toBe(true);
    const changed = model.snapshot();
    for (let i = 0; i < commands.length; i++) expect(model.undo().ok).toBe(true);
    expect(semantic(model.snapshot())).toBe(semantic(initial));
    expect(model.state.revision).toBe(10);
    for (let i = 0; i < commands.length; i++) expect(model.redo().ok).toBe(true);
    expect(semantic(model.snapshot())).toBe(semantic(changed));
    expect(model.state.revision).toBe(15);
  });

  it("discards a redo branch on a new edit and leaves rejected edits out of history", () => {
    const model = new RailwayModel(); model.setMode("edit");
    model.apply({ type: "rename", value: "One" }); model.apply({ type: "rename", value: "Two" });
    model.undo(); expect(model.canRedo).toBe(true);
    const history = model.historyLength;
    model.apply({ type: "scenery.remove", id: "missing" });
    expect(model.historyLength).toBe(history); expect(model.canRedo).toBe(true);
    model.apply({ type: "rename", value: "Three" });
    expect(model.canRedo).toBe(false); expect(model.redo().code).toBe("empty_history");
  });

  it("permits intentional scenery clusters but still validates every rail/board boundary", () => {
    const model = new RailwayModel(); model.setMode("edit");
    expect(model.apply({ type: "scenery.add", item: ornament("a") }).ok).toBe(true);
    expect(model.apply({ type: "scenery.add", item: ornament("b") }).ok).toBe(true);
    expect(parseLayoutDocument(model.snapshot()).ok).toBe(true);
  });

  it("changes lighting during operation without altering motion or topology", () => {
    const model = new RailwayModel(); model.apply({ type: "throttle", value: 0.5 }); model.step(60);
    const before = model.snapshot();
    expect(model.apply({ type: "environment", value: "night" }).ok).toBe(true);
    expect(model.state.train).toEqual(before.train);
    expect(model.state.tick).toBe(before.tick);
    expect(model.state.track).toEqual(before.track);
    expect(model.state.revision).toBe(before.revision + 1);
  });

  it("keeps save/restore transaction boundaries and monotonic revisions", () => {
    const first = new RailwayModel(); first.setMode("edit");
    first.apply({ type: "scenery.add", item: ornament() }); first.apply({ type: "rename", value: "Saved layout" });
    const restored = new RailwayModel(first.snapshot()); restored.setMode("edit");
    expect(restored.historyLength).toBe(0);
    expect(restored.apply({ type: "scenery.remove", id: "user-fir" }, 1).code).toBe("stale_revision");
    expect(restored.apply({ type: "scenery.remove", id: "user-fir" }, 2).ok).toBe(true);
    expect(restored.state.revision).toBe(3);
    expect(restored.state.name).toBe("Saved layout");
  });

  it("caps histories and diagnostics during extended editing", () => {
    const model = new RailwayModel(); model.setMode("edit");
    for (let index = 0; index < 500; index++) {
      model.apply({ type: "rename", value: `Railway ${index}` });
      model.apply({ type: "scenery.remove", id: "missing-object" });
    }
    expect(model.historyLength).toBe(HISTORY_LIMIT);
    expect(model.replayLength).toBe(REPLAY_LIMIT);
    expect(model.diagnostics.length).toBe(32);
    expect(model.exportReplay().complete).toBe(false);
    expect(() => replayCommands(model.exportReplay())).toThrow(/truncated/);
    model.assertInvariants();
  });
});

describe("ordered idempotent command streams and reproducible invariants", () => {
  it("rejects stale ordering and conflicting identities, while exact duplicates do not reverse twice", () => {
    const model = new RailwayModel();
    const envelope = { id: "request-1", sequence: 1, expectedRevision: 0, command: { type: "reverse" } as const };
    expect(model.dispatch(envelope).ok).toBe(true);
    expect(model.state.train.direction).toBe(-1);
    expect(model.dispatch(envelope).changed).toBe(false);
    expect(model.state.train.direction).toBe(-1);
    expect(model.dispatch({ ...envelope, command: { type: "stop" } }).code).toBe("command_conflict");
    expect(model.dispatch({ ...envelope, id: "different-id" }).code).toBe("stale_sequence");
    expect(model.dispatch({ ...envelope, id: "future-id", sequence: 3 }).code).toBe("stale_sequence");
  });

  it("still rejects old sequences after idempotency cache eviction", () => {
    const model = new RailwayModel();
    for (let sequence = 1; sequence <= REPLAY_LIMIT + 10; sequence++) model.dispatch({ id: `id-${sequence}`, sequence, expectedRevision: 0, command: { type: "stop" } });
    expect(model.dispatch({ id: "id-1", sequence: 1, expectedRevision: 0, command: { type: "reverse" } }).code).toBe("stale_sequence");
    expect(model.state.train.direction).toBe(1);
  });

  it("replays operation, rejected reversal, edits, undo and resume to the same canonical result", () => {
    const model = new RailwayModel();
    model.apply({ type: "throttle", value: 0.75 }); model.step(131);
    model.apply({ type: "reverse" }); model.step(33);
    model.apply({ type: "stop" }); model.step(100);
    model.apply({ type: "reverse" }); model.setMode("edit");
    model.apply({ type: "scenery.add", item: ornament() });
    model.apply({ type: "environment", value: "dusk" }); model.undo(); model.redo();
    model.setMode("operate"); model.apply({ type: "throttle", value: 0.42 }); model.step(231);
    const replayed = replayCommands(model.exportReplay());
    expect(replayed.snapshot()).toEqual(model.snapshot());
    expect(replayed.digest()).toBe(model.digest());
  });

  it("reports replay tampering or impossible tick order instead of silently drifting", () => {
    const model = new RailwayModel(); model.apply({ type: "throttle", value: 0.5 }); model.step(100);
    const digestChanged = model.exportReplay(); digestChanged.finalDigest = "00000000";
    expect(() => replayCommands(digestChanged)).toThrow(/differs/);
    const sequenceChanged = model.exportReplay(); sequenceChanged.entries[0]!.sequence = 4;
    expect(() => replayCommands(sequenceChanged)).toThrow(/diverged/);
    const tickChanged = model.exportReplay(); tickChanged.entries[0]!.tick = -1;
    expect(() => replayCommands(tickChanged)).toThrow(/tick/);
  });

  it("keeps invariants for long seeded runs and reproduces the same state at every checkpoint", () => {
    const run = (seed: number): string[] => {
      const random = createRandom(seed), model = new RailwayModel(createStarterLayout(seed)), trace: string[] = [];
      for (let index = 0; index < 200; index++) {
        model.apply({ type: "throttle", value: random() }); model.step(300);
        if (index % 7 === 0) { model.apply({ type: "stop" }); model.step(80); model.apply({ type: "reverse" }); }
        model.assertInvariants();
        expect(model.state.train.distance).toBeGreaterThanOrEqual(0);
        expect(model.state.train.distance).toBeLessThan(ovalLength(model.state.track));
        trace.push(stateDigest(model.snapshot()));
      }
      expect(model.replayLength).toBeLessThanOrEqual(REPLAY_LIMIT);
      return trace;
    };
    for (const seed of [0, 12345, 0xffff_ffff]) expect(run(seed)).toEqual(run(seed));
  });

  it("makes corruption diagnostics reproducible with tick and seed", () => {
    const document = createStarterLayout(123);
    const model = new RailwayModel(document); model.step(10);
    // Deliberate test-only corruption bypasses the typed command API to exercise the invariant tripwire.
    (model.state.train as { speed: number }).speed = Number.NaN;
    expect(() => model.assertInvariants()).toThrow(/tick 10, seed 123/);
  });
});
