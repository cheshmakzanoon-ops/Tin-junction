import { describe, expect, it } from "vitest";
import { BROWSER_BACKUP_KEY, BROWSER_SAVE_KEY, BrowserLayoutStore } from "../../../web/src/persistence";
import { createStarterLayout, parseLayoutDocument } from "../../../web/src/model";
import type { LayoutDocument } from "../../../web/src/model";
import nativeStarter from "../../../apps/ios/TinJunctionTests/Fixtures/starter-layout.json";

class MemoryStorage {
  values = new Map<string, string>();
  failingKey: string | null = null;
  getItem(key: string): string | null { return this.values.get(key) ?? null; }
  setItem(key: string, value: string): void { if (key === this.failingKey) throw new Error("Storage full"); this.values.set(key, value); }
}
describe("browser development checkpoint integrity", () => {
  it("accepts the exact fixture also decoded by the Swift unit suite", () => {
    const parsed = parseLayoutDocument(nativeStarter);
    expect(parsed.ok).toBe(true);
    if (parsed.ok) expect(parseLayoutDocument(JSON.stringify(parsed.value))).toEqual(parsed);
  });
  it("distinguishes new storage from unreadable existing data", () => {
    const storage = new MemoryStorage();
    expect(new BrowserLayoutStore(storage).load()).toEqual({ document: null, checkpoint: 0, recovered: false, error: null });
    storage.setItem(BROWSER_SAVE_KEY, "{incomplete");
    const store = new BrowserLayoutStore(storage);
    expect(store.load().error).toMatch(/preserved/);
    expect(() => store.save(createStarterLayout(), 1)).toThrow(/preserve/);
    expect(storage.getItem(BROWSER_SAVE_KEY)).toBe("{incomplete");
  });
  it("round trips a validated layout and tracks durable revisions independently from checkpoints", () => {
    const storage = new MemoryStorage(), store = new BrowserLayoutStore(storage), layout = createStarterLayout();
    store.load(); store.save(layout, 1);
    layout.tick = 60; layout.train.distance += 0.01;
    store.save(layout, 2);
    const loaded = new BrowserLayoutStore(storage).load();
    expect(loaded.document).toEqual(layout); expect(loaded.checkpoint).toBe(2);
    expect(loaded.document?.revision).toBe(0);
  });
  it("hashes exactly the canonical document it writes regardless of caller key insertion order", () => {
    const storage = new MemoryStorage(), store = new BrowserLayoutStore(storage), original = createStarterLayout();
    const reordered = Object.fromEntries(Object.entries(original).reverse()) as unknown as LayoutDocument;
    store.load(); store.save(reordered, 1);
    expect(new BrowserLayoutStore(storage).load().document).toEqual(original);
    const opened = new BrowserLayoutStore(storage); opened.load();
    opened.save({ ...original, revision: 1, name: "Another afternoon" }, 2);
    storage.setItem(BROWSER_SAVE_KEY, "broken");
    expect(new BrowserLayoutStore(storage).load().document).toEqual(original);
  });
  it("rejects stale, conflicting and same-revision structural writes without changing storage", () => {
    const storage = new MemoryStorage(), store = new BrowserLayoutStore(storage), original = createStarterLayout();
    store.load(); store.save(original, 2);
    const before = storage.getItem(BROWSER_SAVE_KEY);
    expect(() => store.save(original, 1)).toThrow(/stale/);
    expect(() => store.save({ ...original, name: "Changed" }, 2)).toThrow(/conflict/);
    expect(() => store.save({ ...original, name: "Changed" }, 3)).toThrow(/new revision/);
    expect(() => store.save({ ...original, documentId: "another-layout", revision: 1 }, 3)).toThrow(/stale/);
    expect(storage.getItem(BROWSER_SAVE_KEY)).toBe(before);
    expect(() => store.save(original, 2)).not.toThrow();
  });
  it("recovers the previous verified generation and preserves the damaged current bytes", () => {
    const storage = new MemoryStorage(), store = new BrowserLayoutStore(storage), original = createStarterLayout();
    store.load(); store.save(original, 1); store.save({ ...original, revision: 1, name: "Evening" }, 2);
    storage.setItem(BROWSER_SAVE_KEY, "damaged");
    const recovered = new BrowserLayoutStore(storage).load();
    expect(recovered.recovered).toBe(true); expect(recovered.document).toEqual(original);
    expect(storage.getItem(BROWSER_SAVE_KEY)).toBe("damaged");
  });
  it("keeps a valid primary and backup after a simulated failed primary write", () => {
    const storage = new MemoryStorage(), store = new BrowserLayoutStore(storage), original = createStarterLayout();
    store.load(); store.save(original, 1); storage.failingKey = BROWSER_SAVE_KEY;
    expect(() => store.save({ ...original, revision: 1, name: "Never committed" }, 2)).toThrow(/Storage full/);
    expect(new BrowserLayoutStore(storage).load().document).toEqual(original);
    storage.values.delete(BROWSER_SAVE_KEY);
    expect(new BrowserLayoutStore(storage).load().document).toEqual(original);
  });
  it("cannot replace good state after a backup write failure", () => {
    const storage = new MemoryStorage(), store = new BrowserLayoutStore(storage), original = createStarterLayout();
    store.load(); store.save(original, 1); storage.failingKey = BROWSER_BACKUP_KEY;
    expect(() => store.save({ ...original, revision: 1, name: "Never committed" }, 2)).toThrow();
    expect(new BrowserLayoutStore(storage).load().document).toEqual(original);
  });
  it("rejects checksummed content that violates document semantics", () => {
    const storage = new MemoryStorage(), store = new BrowserLayoutStore(storage);
    store.load(); store.save(createStarterLayout(), 1);
    const stored = JSON.parse(storage.getItem(BROWSER_SAVE_KEY)!) as { document: LayoutDocument };
    stored.document.train.speed = 99;
    storage.setItem(BROWSER_SAVE_KEY, JSON.stringify(stored));
    const reopened = new BrowserLayoutStore(storage);
    expect(reopened.load().error).not.toBeNull();
    expect(() => reopened.save(createStarterLayout(), 2)).toThrow();
  });
  it("reports unavailable storage without manufacturing a saved state", () => {
    const store = new BrowserLayoutStore({ getItem: () => { throw new Error("Denied"); }, setItem: () => undefined });
    expect(store.load().error).toMatch(/unavailable/);
    expect(() => store.save(createStarterLayout(), 1)).toThrow();
  });
});
