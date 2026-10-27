import { describe, expect, it } from "vitest";
import { circleFixture, straightPiece } from "../../fixtures/track/graph-fixtures";
import { advanceRoute, buildRouteGraph, editRouteGraph, GRAPH_LIMITS, sampleRouteCursor } from "../../../web/src/track/graph";
import type { GraphOperation, RouteGraph, RouteCursor } from "../../../web/src/track/graph";

function graph(input: unknown): RouteGraph {
  const result = buildRouteGraph(input);
  if (!result.ok) throw new Error(JSON.stringify(result.diagnostics));
  return result.graph;
}
const loop = (): RouteGraph => graph(circleFixture());
const start = { edgeId: "curve-0/forward", distance: 0 };

describe("directed route graph P05-T03", () => {
  it("compiles stable forward/reverse edge identities and explicit socket ownership", () => {
    const route = loop();
    expect(route.edges).toHaveLength(8); expect(route.openSockets).toHaveLength(0);
    expect(route.edges.find(e => e.id === "curve-0/forward")!.nextEdgeId).toBe("curve-1/forward");
    expect(route.edges.find(e => e.id === "curve-0/reverse")!.nextEdgeId).toBe("curve-3/reverse");
    expect(Object.isFrozen(route.pieces[0]!.pose)).toBe(true);
  });

  it("traverses 20,000 successive laps without losing route identity", () => {
    const route = loop(), length = 2 * Math.PI * 0.1;
    let cursor = start;
    for (let lap = 0; lap < 20_000; lap++) {
      const result = advanceRoute(route, cursor, length);
      expect(result.blocked).toBe(false); expect(result.cursor.edgeId).toBe(start.edgeId);
      expect(result.cursor.distance).toBeCloseTo(0, 10);
      cursor = result.cursor;
    }
    expect(sampleRouteCursor(route, cursor).position.x).toBeCloseTo(0, 10);
  });

  it("skips huge repeated cycles in bounded work while preserving final position", () => {
    const route = loop(), circumference = 2 * Math.PI * 0.1;
    const result = advanceRoute(route, start, circumference * 1_000_000 + 0.013);
    expect(result.skippedCycles).toBeGreaterThan(999_990);
    expect(result.transitions).toBeLessThanOrEqual(route.edges.length * 3 + 1);
    expect(result.cursor.edgeId).toBe(start.edgeId); expect(result.cursor.distance).toBeCloseTo(0.013, 7);
    expect(result.travelled).toBeCloseTo(circumference * 1_000_000 + 0.013, 7);
  });

  it("walks reverse edges without reversing physical piece identity", () => {
    const route = loop(), length = Math.PI * 0.1 / 2;
    const result = advanceRoute(route, { edgeId: "curve-0/reverse", distance: 0 }, length + 0.01);
    expect(result.cursor.edgeId).toBe("curve-3/reverse"); expect(result.cursor.distance).toBeCloseTo(0.01, 12);
    const forward = sampleRouteCursor(route, { edgeId: "curve-0/forward", distance: 0.03 });
    const reverse = sampleRouteCursor(route, { edgeId: "curve-0/reverse", distance: length - 0.03 });
    expect(reverse.position.x).toBeCloseTo(forward.position.x, 12); expect(reverse.position.z).toBeCloseTo(forward.position.z, 12);
    expect(reverse.tangent.x).toBeCloseTo(-forward.tangent.x, 12); expect(reverse.curvature).toBe(-forward.curvature);
  });

  it("reports decorative disconnected sockets and stops at an actual open end", () => {
    const route = graph({ revision: 0, pieces: [straightPiece("a"), straightPiece("b", 0.1)], connections: [] });
    expect(route.openSockets).toHaveLength(4);
    const result = advanceRoute(route, { edgeId: "a/forward", distance: 0.08 }, 0.1);
    expect(result.cursor).toEqual({ edgeId: "a/forward", distance: 0.1 });
    expect(result.travelled).toBeCloseTo(0.02, 12); expect(result.remaining).toBeCloseTo(0.08, 12); expect(result.blocked).toBe(true);
  });

  it("canonicalizes connected exact endpoints but does not report blocked for exact open arrival", () => {
    const route = loop(), length = route.edges[0]!.length;
    expect(advanceRoute(route, start, length).cursor).toEqual({ edgeId: "curve-1/forward", distance: 0 });
    expect(advanceRoute(route, { edgeId: "curve-0/forward", distance: length }, 0).cursor).toEqual({ edgeId: "curve-1/forward", distance: 0 });
    const open = graph({ revision: 0, pieces: [straightPiece("a")], connections: [] });
    expect(advanceRoute(open, { edgeId: "a/forward", distance: 0 }, 0.1).blocked).toBe(false);
  });

  it("preserves direction at exit-to-exit connections and treats prototype-like IDs safely", () => {
    const a = straightPiece("__proto__"), b = { ...straightPiece("constructor", 0.2), pose: { x: 0, y: 0, z: 0.2, yaw: Math.PI } };
    const route = graph({ revision: 0, pieces: [a, b], connections: [{ id: "connection", a: { pieceId: a.id, socketId: "exit" }, b: { pieceId: b.id, socketId: "exit" } }] });
    const result = advanceRoute(route, { edgeId: "__proto__/forward", distance: 0.09 }, 0.04);
    expect(result.cursor.edgeId).toBe("constructor/reverse"); expect(result.cursor.distance).toBeCloseTo(0.03, 12);
    expect(sampleRouteCursor(route, result.cursor).position.z).toBeCloseTo(0.13, 12);
  });

  it("crosses all 500 allowed pieces iteratively and stops without tunneling at the last end", () => {
    const pieces = Array.from({ length: 500 }, (_, index) => straightPiece(`piece-${index}`, index * 0.1));
    const connections = pieces.slice(1).map((piece, index) => ({ id: `joint-${index}`, a: { pieceId: pieces[index]!.id, socketId: "exit" }, b: { pieceId: piece.id, socketId: "entrance" } }));
    const route = graph({ revision: 0, pieces, connections });
    const result = advanceRoute(route, { edgeId: "piece-0/forward", distance: 0 }, 100);
    expect(result.blocked).toBe(true); expect(result.cursor).toEqual({ edgeId: "piece-499/forward", distance: 0.1 });
    expect(result.travelled).toBeCloseTo(50, 9); expect(result.remaining).toBeCloseTo(50, 9); expect(result.transitions).toBe(499);
  });

  it("rejects duplicate connections, branches, dangling references and self-joins", () => {
    const fixture = circleFixture();
    const variants = [
      { ...fixture, connections: [...fixture.connections, fixture.connections[0]] },
      { ...fixture, connections: [...fixture.connections, { ...fixture.connections[0], id: "branch" }] },
      { ...fixture, connections: [{ id: "missing", a: { pieceId: "absent", socketId: "exit" }, b: { pieceId: "curve-0", socketId: "entrance" } }] },
      { ...fixture, connections: [{ id: "self", a: { pieceId: "curve-0", socketId: "exit" }, b: { pieceId: "curve-0", socketId: "entrance" } }] },
    ];
    for (const input of variants) expect(buildRouteGraph(input).ok).toBe(false);
  });

  it("rejects mismatched gauge/profile, positional gap and tangent misalignment", () => {
    for (const change of [{ gauge: 0.02 }, { profile: "other" }, { pose: { x: 0.001, y: 0, z: 0, yaw: 0 } }, { pose: { x: 0, y: 0, z: 0, yaw: 0.1 } }]) {
      const fixture = circleFixture(); fixture.pieces[0] = { ...fixture.pieces[0]!, ...change };
      expect(buildRouteGraph(fixture).ok).toBe(false);
    }
  });

  it("accepts compatible but nonzero endpoint tolerance without pretending it is exact alignment", () => {
    const a = straightPiece("a"), b = straightPiece("b", 0.1001);
    const route = graph({ revision: 0, pieces: [a, b], connections: [{ id: "ab", a: { pieceId: "a", socketId: "exit" }, b: { pieceId: "b", socketId: "entrance" } }] });
    expect(route.edges.find(e => e.id === "a/forward")!.nextEdgeId).toBe("b/forward");
    expect(route.pieces[1]!.pose.z).toBe(0.1001);
  });

  it("compiles canonical arrays regardless of insertion order and isolates external mutation", () => {
    const fixture = circleFixture(), first = graph(fixture);
    const second = graph({ ...fixture, pieces: [...fixture.pieces].reverse(), connections: [...fixture.connections].reverse() });
    expect(first).toEqual(second);
    fixture.pieces[0] = straightPiece("replacement"); fixture.connections.length = 0;
    expect(first.pieces[0]!.id).toBe("curve-0"); expect(first.connections).toHaveLength(4);
  });

  it("rejects atomic edits unchanged on any invalid final connection", () => {
    const route = loop(), before = JSON.stringify(route);
    const result = editRouteGraph(route, 0, "edit", [{ type: "move", pieceId: "curve-0", pose: { x: 1, y: 0, z: 0, yaw: 0 } }]);
    expect(result.ok).toBe(false); expect(result.graph).toBe(route); expect(JSON.stringify(route)).toBe(before);
    const remove = editRouteGraph(route, 0, "edit", [{ type: "remove", pieceId: "curve-0" }]);
    expect(remove.ok).toBe(false); expect(remove.graph).toBe(route);
    const duplicate = editRouteGraph(route, 0, "edit", [{ type: "connect", connection: { ...route.connections[0]!, id: "duplicate" } }]);
    expect(duplicate.ok).toBe(false); expect(duplicate.graph).toBe(route);
    const mismatch = editRouteGraph(route, 0, "edit", [{ type: "add", piece: { ...straightPiece("bad"), gauge: 0.02 } }]);
    expect(mismatch.ok).toBe(false); expect(mismatch.graph).toBe(route);
  });

  it("commits a validated disconnect/remove batch once, keeping prior graph usable", () => {
    const route = loop();
    const result = editRouteGraph(route, 0, "edit", [
      { type: "disconnect", connectionId: "joint-0" }, { type: "disconnect", connectionId: "joint-3" }, { type: "remove", pieceId: "curve-0" },
    ]);
    expect(result.ok).toBe(true); expect(result.graph.revision).toBe(1); expect(result.graph.pieces).toHaveLength(3);
    expect(result.graph.openSockets).toHaveLength(2); expect(route.openSockets).toHaveLength(0);
    expect(advanceRoute(route, start, 1).blocked).toBe(false);
  });

  it("requires edit mode/current revision and detects missing edit targets", () => {
    const route = loop(), op: GraphOperation[] = [{ type: "disconnect", connectionId: "joint-0" }];
    expect(editRouteGraph(route, 0, "operate", op).ok).toBe(false);
    expect(editRouteGraph(route, 1, "edit", op).ok).toBe(false);
    for (const operation of [{ type: "remove", pieceId: "absent" }, { type: "move", pieceId: "absent", pose: straightPiece("a").pose }, { type: "disconnect", connectionId: "absent" }] as GraphOperation[]) expect(editRouteGraph(route, 0, "edit", [operation]).ok).toBe(false);
  });

  it("rechecks referential integrity after 200 seeded valid disconnect/reconnect edits", () => {
    const fixture = circleFixture(); let route = graph(fixture), seed = 42;
    for (let i = 0; i < 200; i++) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      const selected = fixture.connections[seed % 4]!;
      const disconnected = editRouteGraph(route, route.revision, "edit", [{ type: "disconnect", connectionId: selected.id }]);
      expect(disconnected.ok).toBe(true); expect(disconnected.graph.openSockets).toHaveLength(2);
      const connected = editRouteGraph(disconnected.graph, disconnected.graph.revision, "edit", [{ type: "connect", connection: selected }]);
      expect(connected.ok).toBe(true); expect(connected.graph.openSockets).toHaveLength(0);
      for (const edge of connected.graph.edges) expect(connected.graph.edges.some(next => next.id === edge.nextEdgeId)).toBe(true);
      route = connected.graph;
    }
    expect(route.revision).toBe(400);
  });

  it("rejects hostile shapes, count limits, unknown fields and zero-length traversal", () => {
    const fixture = circleFixture();
    const invalid: unknown[] = [null, {}, { ...fixture, revision: NaN }, { ...fixture, revision: -1 }, { ...fixture, extra: true },
      { ...fixture, pieces: [fixture.pieces[0], fixture.pieces[0]] }, { ...fixture, pieces: Array(GRAPH_LIMITS.pieces + 1).fill(null) },
      { ...fixture, connections: Array(GRAPH_LIMITS.connections + 1).fill(null) },
      { ...fixture, pieces: [{ ...fixture.pieces[0], centerline: { kind: "straight", length: 0 } }] },
      { ...fixture, pieces: [{ ...fixture.pieces[0], pose: { x: Infinity, y: 0, z: 0, yaw: 0 } }] },
      { ...fixture, connections: [{ id: "bad", a: { pieceId: "curve-0", socketId: "bogus" }, b: null }] }];
    for (const input of invalid) expect(buildRouteGraph(input).ok).toBe(false);
  });

  it("bounds malformed mutation batches without throwing or partially changing a graph", () => {
    const route = loop();
    for (const operations of [null, [], Array(101).fill(null), [null], [{ type: "add", piece: null }, { type: "remove", pieceId: "x" }], [{ type: "connect", connection: null }], [{ type: "unknown" }]]) {
      const result = editRouteGraph(route, 0, "edit", operations as GraphOperation[]);
      expect(result.ok).toBe(false); expect(result.graph).toBe(route);
    }
  });

  it("bounds invalid cursor/distance and rejects forged derived graph objects", () => {
    const route = loop();
    for (const distance of [NaN, Infinity, -1, GRAPH_LIMITS.distance + 1]) expect(() => advanceRoute(route, start, distance)).toThrow(RangeError);
    for (const cursor of [null, { edgeId: "missing", distance: 0 }, { ...start, distance: NaN }, { ...start, distance: 1 }]) {
      expect(() => advanceRoute(route, cursor as RouteCursor, 1)).toThrow(RangeError);
      expect(() => sampleRouteCursor(route, cursor as RouteCursor)).toThrow(RangeError);
    }
    expect(() => advanceRoute({ ...route }, start, 1)).toThrow(RangeError);
  });
});
