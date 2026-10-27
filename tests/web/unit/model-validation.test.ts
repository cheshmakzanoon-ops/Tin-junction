import { describe, expect, it } from "vitest";
import { MAX_COUNTER, MAX_DOCUMENT_BYTES, MAX_SCENERY, RESERVED_SCENERY_AREAS, SCENERY_FOOTPRINT, canonicalLayout, createRandom, createStarterLayout, ovalLength, parseLayoutDocument, sceneryPlacementError, stateDigest } from "../../../web/src/model";
import type { LayoutDocument, SceneryItem } from "../../../web/src/model";

const plain = (): Record<string, unknown> => JSON.parse(JSON.stringify(createStarterLayout())) as Record<string, unknown>;
const invalid = (change: (document: Record<string, unknown>) => void): void => {
  const document = plain(); change(document);
  expect(parseLayoutDocument(document).ok).toBe(false);
};

describe("seeded starter and stable identity", () => {
  it("creates a valid miniature world without DOM, WebGL, clock, or native globals", () => {
    const document = createStarterLayout();
    expect(parseLayoutDocument(document)).toEqual({ ok: true, value: document });
    expect(document.train.speed).toBe(0);
    expect(document.train.throttle).toBe(0);
    expect(document.scenery.length).toBeGreaterThan(20);
    expect(new Set(document.scenery.map((item) => item.id)).size).toBe(document.scenery.length);
  });

  it("replays seeded variants exactly, including seed zero", () => {
    for (const seed of [0, 1, 42, 0xffff_ffff]) {
      const first = createRandom(seed), second = createRandom(seed);
      for (let index = 0; index < 100; index++) {
        const value = first(); expect(value).toBe(second()); expect(value).toBeGreaterThanOrEqual(0); expect(value).toBeLessThan(1);
      }
      expect(canonicalLayout(createStarterLayout(seed))).toBe(canonicalLayout(createStarterLayout(seed)));
    }
    expect(stateDigest(createStarterLayout(1))).not.toBe(stateDigest(createStarterLayout(2)));
  });

  it("rejects invalid seeds instead of silently truncating them", () => {
    for (const seed of [-1, 0.5, Infinity, Number.NaN, 0x1_0000_0000]) expect(() => createRandom(seed)).toThrow();
  });

  it("round-trips portable layout JSON and never aliases caller-owned nested state", () => {
    const original = createStarterLayout(), loaded = parseLayoutDocument(JSON.stringify(original));
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) throw new Error(loaded.error);
    expect(canonicalLayout(loaded.value)).toBe(canonicalLayout(original));
    loaded.value.scenery[0]!.x += 0.01;
    loaded.value.train.throttle = 1;
    expect(loaded.value.scenery[0]!.x).not.toBe(original.scenery[0]!.x);
    expect(original.train.throttle).toBe(0);
  });

  it("canonical diagnostics sort stable scenery IDs independent of insertion order", () => {
    const a = createStarterLayout(), b = createStarterLayout(); b.scenery.reverse();
    expect(canonicalLayout(a)).toBe(canonicalLayout(b));
    expect(stateDigest(a)).toBe(stateDigest(b));
  });
});

describe("strict untrusted document validation", () => {
  it("rejects unsupported schemas, missing fields and unknown executable/URL content", () => {
    invalid((d) => { d.schemaVersion = 99; });
    invalid((d) => { d.format = "other"; });
    invalid((d) => { delete d.scenery; });
    invalid((d) => { d.url = "https://example.com/asset.js"; });
    invalid((d) => { (d.track as Record<string, unknown>).script = "evil()"; });
    invalid((d) => { (d.environment as Record<string, unknown>).timeOfDay = { toString: () => "day" }; });
  });

  it.each(["../escape", "", "x".repeat(129), "with space", "slash/name"])("rejects invalid IDs %s", (id) => {
    invalid((d) => { d.documentId = id; });
  });

  it("rejects duplicate scenery and unknown catalog IDs", () => {
    invalid((d) => { const scenery = d.scenery as SceneryItem[]; scenery.push({ ...scenery[0]! }); });
    invalid((d) => { (d.scenery as Record<string, unknown>[])[0]!.kind = "downloaded-model"; });
  });

  it("enforces Unicode scalar names, control rejection and exact numeric types", () => {
    const document = createStarterLayout(); document.name = "🚂".repeat(80);
    expect(parseLayoutDocument(document).ok).toBe(true);
    invalid((d) => { d.name = "🚂".repeat(81); });
    invalid((d) => { d.name = "\nHidden"; });
    invalid((d) => { d.name = " \t "; });
    invalid((d) => { d.name = "\ud800"; });
    invalid((d) => { d.revision = true; });
    invalid((d) => { d.tick = "0"; });
    invalid((d) => { d.revision = MAX_COUNTER + 1; });
    invalid((d) => { d.tick = 0.5; });
  });

  it("bounds physical values before any mesh allocations", () => {
    for (const value of [Number.NaN, Infinity, -Infinity, -0.1, 1]) invalid((d) => { (d.train as Record<string, unknown>).speed = value; });
    invalid((d) => { (d.train as Record<string, unknown>).distance = ovalLength((d as unknown as LayoutDocument).track); });
    invalid((d) => { (d.train as Record<string, unknown>).throttle = 2; });
    invalid((d) => { (d.train as Record<string, unknown>).direction = 0; });
    invalid((d) => { (d.train as Record<string, unknown>).wheelTravel = 1e10; });
    invalid((d) => { (d.track as Record<string, unknown>).radius = 0; });
    invalid((d) => { (d.scenery as Record<string, unknown>[])[0]!.scale = 10; });
    invalid((d) => { (d.scenery as Record<string, unknown>[])[0]!.rotation = 99; });
  });

  it("rejects pollution keys, class instances, circular objects and malformed JSON", () => {
    const document = plain(); Object.defineProperty(document, "__proto__", { value: { polluted: true }, enumerable: true });
    expect(parseLayoutDocument(document).ok).toBe(false);
    expect(parseLayoutDocument(Object.assign(new Date(), plain())).ok).toBe(false);
    const cyclic = plain(); cyclic.self = cyclic;
    expect(parseLayoutDocument(cyclic).ok).toBe(false);
    for (const input of [null, undefined, [], "{broken}", "null", "[]"]) expect(parseLayoutDocument(input).ok).toBe(false);
  });

  it("caps document bytes and object count", () => {
    expect(parseLayoutDocument(" ".repeat(MAX_DOCUMENT_BYTES + 1)).ok).toBe(false);
    invalid((d) => { d.scenery = Array.from({ length: MAX_SCENERY + 1 }, (_, i) => ({ ...(d.scenery as SceneryItem[])[0]!, id: `over-${i}` })); });
  });
});

describe("scenery board and railway clearance", () => {
  const track = createStarterLayout().track;
  const item: SceneryItem = { id: "placed", kind: "fir", x: -0.18, z: 0, rotation: 0, scale: 1 };
  it("uses catalog footprints and rejects whole-object board overhang", () => {
    expect(SCENERY_FOOTPRINT.house).toBe(0.028);
    expect(sceneryPlacementError(item, track)).toBeNull();
    expect(sceneryPlacementError({ ...item, x: 0.389 }, track)).toMatch(/inside/);
    expect(sceneryPlacementError({ ...item, z: 0.239 }, track)).toMatch(/inside/);
  });

  it("keeps train clearance through straights and tight curves", () => {
    expect(sceneryPlacementError({ ...item, x: 0, z: 0.145 }, track)).toMatch(/rails/);
    expect(sceneryPlacementError({ ...item, x: 0.315, z: 0 }, track)).toMatch(/rails/);
    expect(sceneryPlacementError({ ...item, x: -0.18, z: 0.08 }, track)).toBeNull();
  });

  it("protects immutable station and pond footprints", () => {
    for (const area of RESERVED_SCENERY_AREAS) {
      expect(sceneryPlacementError({ ...item, x: (area.minX + area.maxX) / 2, z: (area.minZ + area.maxZ) / 2 }, track)).toMatch(new RegExp(area.name));
    }
  });
});
