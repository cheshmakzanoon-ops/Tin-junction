import { describe, expect, it } from "vitest";
import { turnoutFixture } from "../../fixtures/track/turnout-fixtures";
import { circleFixture } from "../../fixtures/track/graph-fixtures";
import { advanceRoute, sampleRouteCursor } from "../../../web/src/track/graph";
import { buildTurnoutTopology, compileTurnoutRoutes, turnoutEdge, turnoutOwner } from "../../../web/src/track/turnout";
import type { TurnoutRoute, TurnoutRouteState, TurnoutTopology } from "../../../web/src/track/turnout";
import { CONSIST_ROUTE_LIMITS, RoutedConsist } from "../../../web/src/simulation/routedConsist";

const topology = (input: unknown = turnoutFixture()): TurnoutTopology => {
  const built = buildTurnoutTopology(input);
  if (!built.ok) throw new Error(JSON.stringify(built.diagnostics));
  return built.value;
};
const routes = (value: TurnoutTopology, route: TurnoutRoute = "straight"): TurnoutRouteState => {
  const built = compileTurnoutRoutes(value, [{ turnoutId: "points", route }]);
  if (!built.ok) throw new Error(JSON.stringify(built.diagnostics));
  return built.value;
};
function train(value = topology(), options: { rear?: { edgeId: string; distance: number }; length?: number; route?: TurnoutRoute } = {}): RoutedConsist {
  const built = RoutedConsist.place(value, { trainId: "engine-and-two-carriages", length: options.length ?? 0.12,
    rear: options.rear ?? { edgeId: "approach/forward", distance: 0.05 },
    selections: value.turnouts.length ? [{ turnoutId: "points", route: options.route ?? "straight" }] : [] });
  if (!built.ok) throw new Error(built.message);
  return built.consist;
}
const closePosition = (actual: { x: number; y: number; z: number }, expected: { x: number; y: number; z: number }) => {
  expect(actual.x).toBeCloseTo(expected.x, 12); expect(actual.y).toBeCloseTo(expected.y, 12); expect(actual.z).toBeCloseTo(expected.z, 12);
};

describe("explicit turnout topology P05-T04", () => {
  it("compiles one physical stock socket into the selected stable route, preserving both exits", () => {
    const value = topology(), straight = routes(value), divergent = routes(value, "diverging");
    expect(turnoutEdge(straight, "approach/forward").nextEdgeId).toBe("points:route:straight/forward");
    expect(turnoutEdge(divergent, "approach/forward").nextEdgeId).toBe("points:route:diverging/forward");
    expect(turnoutEdge(straight, "points:route:diverging/reverse").nextEdgeId).toBeNull();
    expect(turnoutEdge(divergent, "points:route:straight/reverse").nextEdgeId).toBeNull();
    expect(turnoutEdge(straight, "points:route:straight/forward").nextEdgeId).toBe("main/forward");
    expect(turnoutEdge(straight, "points:route:diverging/forward").nextEdgeId).toBe("branch/forward");
    expect(turnoutOwner(straight, "points:route:straight/forward")).toBe("points");
    expect(turnoutOwner(straight, "main/forward")).toBeNull();
  });

  it.each(["straight", "diverging"] as const)("traverses %s forward and backward without a branch teleport", route => {
    for (const sweep of [Math.PI / 6, -Math.PI / 6]) {
      const state = routes(topology(turnoutFixture(sweep)), route);
      const edge = turnoutEdge(state, `points:route:${route}/forward`);
      const forward = advanceRoute(state.graph, { edgeId: "approach/forward", distance: 0.29 }, 0.01 + edge.length + 0.02);
      expect(forward.blocked).toBe(false);
      expect(forward.cursor.edgeId).toBe(`${route === "straight" ? "main" : "branch"}/forward`);
      expect(forward.cursor.distance).toBeCloseTo(0.02, 12);
      const reverse = advanceRoute(state.graph, { edgeId: `${route === "straight" ? "main" : "branch"}/reverse`, distance: 0.28 }, 0.02 + edge.length + 0.01);
      expect(reverse.cursor.edgeId).toBe("approach/reverse"); expect(reverse.cursor.distance).toBeCloseTo(0.01, 12);
      const stock = sampleRouteCursor(state.graph, { edgeId: `points:route:${route}/forward`, distance: 0 });
      closePosition(stock.position, { x: 0, y: 0, z: 0 });
    }
  });

  it("stops a trailing approach on the unselected branch exactly at the points", () => {
    const state = routes(topology());
    const distance = turnoutEdge(state, "points:route:diverging/reverse").length;
    const traversed = advanceRoute(state.graph, { edgeId: "branch/reverse", distance: 0.29 }, 1);
    expect(traversed.blocked).toBe(true);
    expect(traversed.cursor).toEqual({ edgeId: "points:route:diverging/reverse", distance });
    expect(traversed.travelled).toBeCloseTo(distance + 0.01, 12);
    expect(turnoutEdge(state, "approach/forward").nextEdgeId).toBe("points:route:straight/forward");
  });

  it("rejects unknown, duplicated and physically misaligned connections without mutating input", () => {
    const good = turnoutFixture(), before = JSON.stringify(good);
    const bad = [
      { ...good, connections: [...good.connections, { ...good.connections[0]!, id: "duplicate-stock" }] },
      { ...good, connections: [{ id: "bad", a: { pieceId: "points", socketId: "exit" }, b: { pieceId: "main", socketId: "entrance" } }] },
      { ...good, connections: [{ id: "bad", a: { pieceId: "points", socketId: "stock" }, b: { pieceId: "points", socketId: "straight" } }] },
      { ...good, pieces: good.pieces.map(piece => piece.id === "branch" ? { ...piece, pose: { ...piece.pose, x: 0.5 } } : piece) },
      { ...good, pieces: [...good.pieces, { ...good.pieces[0]!, id: "points:route:straight" }] },
      { ...good, turnouts: [...good.turnouts, good.turnouts[0]] },
      { ...good, turnouts: [...good.turnouts, { ...good.turnouts[0], id: "points:route:straight" }] },
      { ...good, turnouts: [{ ...good.turnouts[0], id: "points:route:straight" }, ...good.turnouts] },
    ];
    for (const input of bad) expect(buildTurnoutTopology(input).ok).toBe(false);
    expect(JSON.stringify(good)).toBe(before);
  });

  it("validates bounds, exact shapes and complete route selections", () => {
    const good = turnoutFixture();
    for (const input of [null, {}, { ...good, extra: true }, { ...good, turnouts: Array(65).fill(good.turnouts[0]) },
      ...[{ radius: 0 }, { straightLength: 0 }, { sweep: 0 }, { sweep: Infinity }, { sweep: Math.PI }, { pose: { x: NaN, y: 0, z: 0, yaw: 0 } }, { id: "x".repeat(101) }].map(change => ({ ...good, turnouts: [{ ...good.turnouts[0], ...change }] }))]) expect(buildTurnoutTopology(input).ok).toBe(false);
    const value = topology();
    for (const selection of [null, [], [{ turnoutId: "points", route: "unknown" }], [{ turnoutId: "absent", route: "straight" }], [{ turnoutId: "points", route: "straight", extra: true }]]) expect(compileTurnoutRoutes(value, selection).ok).toBe(false);
    expect(compileTurnoutRoutes({ ...value }).ok).toBe(false);
  });

  it("detaches and freezes topology and selections, including prototype-like IDs", () => {
    const fixture = turnoutFixture();
    fixture.turnouts[0] = { ...fixture.turnouts[0]!, id: "__proto__" };
    fixture.connections = fixture.connections.map(item => ({ ...item, a: { ...item.a, pieceId: item.a.pieceId === "points" ? "__proto__" : item.a.pieceId }, b: { ...item.b, pieceId: item.b.pieceId === "points" ? "__proto__" : item.b.pieceId } }));
    const value = topology(fixture), selections = [{ turnoutId: "__proto__", route: "diverging" }];
    const compiled = compileTurnoutRoutes(value, selections); expect(compiled.ok).toBe(true);
    if (!compiled.ok) return;
    selections[0]!.route = "straight"; fixture.connections.length = 0;
    expect(compiled.value.selections[0]!.route).toBe("diverging"); expect(value.connections).toHaveLength(3);
    expect(Object.isFrozen(value.turnouts[0]!.pose)).toBe(true); expect(Object.isFrozen(compiled.value.selections)).toBe(true);
  });
});

describe("whole-consist turnout protection P05-T04", () => {
  it("rejects switching while the front, middle and rear occupy the protected route", () => {
    const subject = train(topology(), { rear: { edgeId: "approach/forward", distance: 0.19 } });
    for (const distance of [0, 0.08, 0.10]) {
      expect(subject.advance(distance).ok).toBe(true);
      const before = subject.snapshot(), graph = subject.network.graph;
      expect(subject.occupiedTurnouts()).toEqual(["points"]);
      expect(subject.selectTurnout("points", "diverging")).toMatchObject({ ok: false, changed: false, code: "turnout-occupied" });
      expect(subject.snapshot()).toEqual(before); expect(subject.network.graph).toBe(graph);
    }
    expect(subject.front.edgeId).toBe("main/forward"); // Locomotive is already clear; the rear is still protected.
    expect(subject.advance(0.081).ok).toBe(true);
    expect(subject.occupiedTurnouts()).toEqual([]);
    expect(subject.selectTurnout("points", "diverging")).toMatchObject({ ok: true, changed: true });
    expect(subject.switchRevision).toBe(1);
  });

  it("keeps exact front and rear boundary contact locked until strictly clear", () => {
    const frontContact = train(topology(), { rear: { edgeId: "approach/forward", distance: 0.18 } });
    expect(frontContact.occupiedTurnouts()).toEqual(["points"]);
    const rearContact = train(topology(), { rear: { edgeId: "main/forward", distance: 0 }, length: 0.1 });
    expect(rearContact.selectTurnout("points", "diverging").code).toBe("turnout-occupied");
    expect(rearContact.advance(0.000001).ok).toBe(true);
    expect(rearContact.selectTurnout("points", "diverging").ok).toBe(true);
  });

  it.each(["straight", "diverging"] as const)("retains the entire %s path through reversal, serialization and further movement", route => {
    const value = topology(), subject = train(value, { route });
    expect(subject.advance(0.35).ok).toBe(true);
    const front = sampleRouteCursor(subject.network.graph, subject.front).position;
    const rear = sampleRouteCursor(subject.network.graph, subject.rear).position;
    const before = subject.snapshot();
    expect(subject.reverse(false).code).toBe("train-moving"); expect(subject.snapshot()).toEqual(before);
    expect(subject.reverse(true).ok).toBe(true); expect(subject.direction).toBe(-1);
    closePosition(sampleRouteCursor(subject.network.graph, subject.front).position, rear);
    closePosition(sampleRouteCursor(subject.network.graph, subject.rear).position, front);
    const restored = RoutedConsist.restore(value, JSON.parse(JSON.stringify(subject.snapshot())));
    expect(restored.ok).toBe(true);
    if (!restored.ok) return;
    expect(restored.consist.snapshot()).toEqual(subject.snapshot());
    expect(restored.consist.selectTurnout("points", route === "straight" ? "diverging" : "straight").code).toBe("turnout-occupied");
    const a = subject.advance(0.25), b = restored.consist.advance(0.25);
    expect(a).toEqual(b); expect(subject.front.edgeId).toBe("approach/reverse");
    expect(subject.snapshot()).toEqual(restored.consist.snapshot());
    expect(subject.trainId).toBe("engine-and-two-carriages");
  });

  it("can retreat from an unselected trailing branch without forcing or changing the points", () => {
    const subject = train(topology(), { rear: { edgeId: "branch/reverse", distance: 0.03 } });
    const advanced = subject.advance(1);
    expect(advanced.ok).toBe(true); expect(advanced.blocked).toBe(true);
    expect(subject.front).toEqual({ edgeId: "branch/reverse", distance: 0.3 });
    expect(subject.intervals.every(interval => !interval.edgeId.startsWith("points:"))).toBe(true);
    expect(subject.network.selections).toEqual([{ turnoutId: "points", route: "straight" }]);
    expect(subject.selectTurnout("points", "diverging").code).toBe("turnout-occupied");
    expect(subject.reverse(true).ok).toBe(true);
    expect(subject.advance(0.25).ok).toBe(true); expect(subject.front.edgeId).toBe("branch/forward");
  });

  it("gives deterministic invalid/stale command feedback without changing topology", () => {
    const subject = train(), before = subject.snapshot(), serialized = JSON.stringify(before), graph = subject.network.graph;
    for (const command of [() => subject.selectTurnout("unknown", "straight"), () => subject.selectTurnout("points", "bad" as TurnoutRoute), () => subject.selectTurnout("points", "diverging", 1)]) {
      const first = command(), second = command(); expect(first).toEqual(second); expect(first.ok).toBe(false);
      expect(subject.snapshot()).toEqual(before); expect(JSON.stringify(subject.snapshot())).toBe(serialized); expect(subject.network.graph).toBe(graph);
    }
    expect(subject.selectTurnout("points", "straight")).toMatchObject({ ok: true, changed: false, code: "unchanged" });
    expect(subject.selectTurnout("points", "diverging", 0).ok).toBe(true);
    expect(subject.selectTurnout("points", "straight", 0).code).toBe("stale-switch-revision");
  });

  it("rejects incomplete, changed-branch and forged snapshots before exposing a train", () => {
    const value = topology(), subject = train(value); subject.advance(0.2);
    const snapshot = subject.snapshot();
    const invalid = [null, {}, { ...snapshot, schemaVersion: 2 }, { ...snapshot, topologyRevision: 1 }, { ...snapshot, extra: true },
      { ...snapshot, length: 0 }, { ...snapshot, intervals: [] }, { ...snapshot, intervals: [null] }, { ...snapshot, intervals: Array(2049).fill(snapshot.intervals[0]) },
      { ...snapshot, intervals: snapshot.intervals.slice(1) }, { ...snapshot, selections: undefined }, { ...snapshot, selections: [{ turnoutId: "points", route: "diverging" }] },
      { ...snapshot, intervals: [{ edgeId: "absent/forward", from: 0, to: 0.12 }] },
      { ...snapshot, intervals: [{ edgeId: "main/forward", from: NaN, to: 0.12 }] },
    ];
    for (const input of invalid) expect(RoutedConsist.restore(value, input).ok).toBe(false);
    expect(subject.snapshot()).toEqual(snapshot);
    const withinPoints = train(value, { rear: { edgeId: "points:route:straight/forward", distance: 0.01 }, length: 0.1 }).snapshot();
    expect(RoutedConsist.restore(value, { ...withinPoints, selections: [{ turnoutId: "points", route: "diverging" }] }).ok).toBe(false);
    const restored = RoutedConsist.restore(value, snapshot); expect(restored.ok).toBe(true);
    if (!restored.ok) return;
    (snapshot.intervals[0] as { from: number }).from = 99;
    expect(restored.consist.intervals[0]!.from).not.toBe(99);
  });

  it("rejects route-short and self-overlapping placements, while allowing disconnected decorative tracks", () => {
    const value = topology();
    expect(RoutedConsist.place(value, { trainId: "train", length: 0.4, rear: { edgeId: "main/forward", distance: 0 } }).ok).toBe(false);
    expect(RoutedConsist.place(value, { trainId: "train", length: 0.1, rear: { edgeId: "points:route:diverging/reverse", distance: 0 } }).ok).toBe(false);
    for (const rear of [{ edgeId: "absent", distance: 0 }, { edgeId: "main/forward", distance: NaN }, { edgeId: "main/forward", distance: -1 }]) expect(RoutedConsist.place(value, { trainId: "train", length: 0.12, rear }).ok).toBe(false);
    const loop = topology({ ...circleFixture(), turnouts: [] });
    expect(RoutedConsist.place(loop, { trainId: "long", length: 0.8, rear: { edgeId: "curve-0/forward", distance: 0 } }).ok).toBe(false);
    expect(RoutedConsist.place(loop, { trainId: "exact", length: 2 * Math.PI * 0.1, rear: { edgeId: "curve-0/forward", distance: 0 } }).ok).toBe(false);
    expect(RoutedConsist.place(loop, { trainId: "exact-mid-piece", length: 2 * Math.PI * 0.1, rear: { edgeId: "curve-0/forward", distance: 0.02 } }).ok).toBe(false);
    const fixture = turnoutFixture(); fixture.connections.length = 0;
    expect(train(topology(fixture)).intervals).toHaveLength(1);
  });

  it("keeps occupied history bounded over 20,000 steps and reversible save/reloads on a circuit", () => {
    const value = topology({ ...circleFixture(), turnouts: [] });
    let subject = train(value, { rear: { edgeId: "curve-0/forward", distance: 0.02 } });
    for (let index = 0; index < 20_000; index++) {
      expect(subject.advance(0.003).ok).toBe(true);
      expect(subject.intervals.length).toBeLessThanOrEqual(3);
      if (index % 997 === 0) {
        expect(subject.reverse(true).ok).toBe(true);
        const restored = RoutedConsist.restore(value, subject.snapshot());
        expect(restored.ok).toBe(true);
        if (restored.ok) subject = restored.consist;
      }
    }
    expect(subject.intervals.reduce((sum, item) => sum + item.to - item.from, 0)).toBeCloseTo(subject.length, 9);
    expect(subject.occupiedTurnouts()).toEqual([]);
  });

  it("rejects nonfinite or excessive movement without touching occupied history", () => {
    const subject = train(), before = subject.snapshot();
    for (const movement of [-1, NaN, Infinity, CONSIST_ROUTE_LIMITS.maxMovement + 1]) {
      expect(() => subject.advance(movement)).not.toThrow();
      expect(subject.advance(movement).ok).toBe(false); expect(JSON.stringify(subject.snapshot())).toBe(JSON.stringify(before));
    }
    expect(subject.snapshot()).toEqual(before); expect(Object.isFrozen(subject.intervals)).toBe(true);
  });
});
