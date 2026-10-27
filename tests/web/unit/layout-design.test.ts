import { describe, expect, it } from "vitest";
import corpus from "../../fixtures/documents/layout-design-v2-corpus.json";
import { layoutOperatingClearance, parseLayoutDesign, serializeLayoutDesign } from "../../../web/src/documents/layoutDesign";

describe("shared native/web layout design contract P07-T01", () => {
  it.each(corpus.cases)("$id", ({ input, valid }) => {
    const result = parseLayoutDesign(input);
    expect(result.ok).toBe(valid);
    expect(parseLayoutDesign(JSON.stringify(input)).ok).toBe(valid);
    if (!result.ok) return;
    const encoded = serializeLayoutDesign(result.value), reopened = parseLayoutDesign(encoded);
    expect(reopened.ok).toBe(true);
    if (reopened.ok) {
      expect(reopened.value).toEqual(result.value);
      expect(serializeLayoutDesign(reopened.value)).toBe(encoded);
    }
  });

  it("keeps geometric operation approval separate from an editable file and reports the actual conflicts", () => {
    const source = corpus.cases.find(item => item.id === "maximum-editable-design-budget-not-operation-proof")!;
    const result = parseLayoutDesign(source.input);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const operational = layoutOperatingClearance(result.value);
    expect(operational.ok).toBe(false); expect(operational.diagnostics[0]!.code).toBe("track-overlap");
  });

  it("canonicalizes field/object ordering without sorting physical vehicle or route-history order", () => {
    const source = corpus.cases.find(item => item.id === "three-vehicle-circle")!;
    const result = parseLayoutDesign(source.input);
    if (!result.ok) throw new Error(result.message);
    const original = serializeLayoutDesign(result.value);
    const changed = JSON.parse(original);
    changed.track.pieces.reverse(); changed.track.connections.reverse();
    const reordered = Object.fromEntries(Object.entries(changed).reverse());
    const parsed = parseLayoutDesign(reordered);
    if (!parsed.ok) throw new Error(parsed.message);
    expect(serializeLayoutDesign(parsed.value)).toBe(original);
    expect(parsed.value.train!.vehicles.map(vehicle => vehicle.id)).toEqual(["engine-01", "carriage-01", "freight-01"]);
    expect(parsed.value.train!.motion.consist.intervals).toEqual(result.value.train!.motion.consist.intervals);
  });

  it("does not quantize saved wheel distance or mutate caller data", () => {
    const input = JSON.parse(JSON.stringify(corpus.cases.find(item => item.id === "three-vehicle-circle")!.input));
    input.train.motion.signedTravel = 0.12345678912345678;
    const result = parseLayoutDesign(input);
    if (!result.ok) throw new Error(result.message);
    input.name = "Mutated caller"; input.train.vehicles[0].id = "mutated";
    expect(result.value.name).toBe("My railway"); expect(result.value.train!.vehicles[0]!.id).toBe("engine-01");
    expect(JSON.parse(serializeLayoutDesign(result.value)).train.motion.signedTravel).toBe(0.12345678912345678);
  });

  it("rejects oversized/deep/nonfinite/runtime values before exposing a document", () => {
    const source = corpus.cases.find(item => item.id === "empty-editable-design")!.input;
    expect(parseLayoutDesign(" ".repeat(524_289)).ok).toBe(false);
    expect(parseLayoutDesign('{"a":'.repeat(40) + "null" + "}".repeat(40)).ok).toBe(false);
    const cyclic: Record<string, unknown> = { ...source }; cyclic.self = cyclic;
    let getterCalled = false;
    const accessor = { ...source, get extra() { getterCalled = true; return "hidden effect"; } };
    for (const input of [cyclic, accessor, { ...source, seed: NaN }, { ...source, seed: Infinity }, { ...source, extra: undefined }, { ...source, extra: () => 1 }, { ...source, extra: new Date() }, { ...source, name: "\ud800" }]) expect(parseLayoutDesign(input).ok).toBe(false);
    expect(getterCalled).toBe(false);
  });

  it("rejects hidden array metadata without invoking a custom serialization hook", () => {
    const source = corpus.cases.find(item => item.id === "empty-editable-design")!.input;
    let called = false;
    const scenery: unknown[] = [];
    Object.defineProperty(scenery, "toJSON", { get() { called = true; return () => []; } });
    expect(parseLayoutDesign({ ...source, scenery }).ok).toBe(false);
    expect(called).toBe(false);
    const hidden: unknown[] = [];
    Object.defineProperty(hidden, "nativeHandle", { value: { pointer: 42 } });
    expect(parseLayoutDesign({ ...source, scenery: hidden }).ok).toBe(false);
  });
});
