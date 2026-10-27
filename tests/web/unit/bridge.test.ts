import { describe, expect, it } from "vitest";
import { createOutgoingBridge, parseNativeMessage } from "../../../web/src/bridge";
import type { WebMessage } from "../../../web/src/bridge";
import { createStarterLayout } from "../../../web/src/model";

const lifecycle = { version: 1, id: "native-1", type: "native.lifecycle", payload: { state: "active" } };
describe("native bridge boundary", () => {
  it("accepts known versioned commands", () => {
    expect(parseNativeMessage(lifecycle)?.type).toBe("native.lifecycle");
    expect(parseNativeMessage({ version: 1, id: "boot", type: "native.bootstrap", payload: { host: "ios", debug: true } })).not.toBeNull();
    expect(parseNativeMessage({ version: 1, id: "view", type: "native.viewport", payload: { width: 500, height: 400, pixelRatio: 3, reservedRegions: [{ x: 10, y: 0, width: 5, height: 400 }], hingeAngleDegrees: null } })).not.toBeNull();
  });
  it("rejects malformed, unknown and oversized messages", () => {
    for (const value of [null, [], "script", {}, { ...lifecycle, version: 2 }, { ...lifecycle, type: "eval" }, { ...lifecycle, id: "../path" }, { ...lifecycle, payload: { state: "banana" } }, { ...lifecycle, arbitrary: true }, { ...lifecycle, payload: { state: "active", text: "x".repeat(70_000) } }]) expect(parseNativeMessage(value)).toBeNull();
  });
  it("rejects nonfinite and unreasonable geometry", () => {
    for (const payload of [{ width: Number.NaN, height: 400, pixelRatio: 2 }, { width: 500, height: 400, pixelRatio: 99 }, { width: 500, height: 0, pixelRatio: 2 }, { width: 500, height: 400, pixelRatio: 2, hingeAngleDegrees: 999 }, { width: 500, height: 400, pixelRatio: 2, reservedRegions: [{ x: 0, y: 0, width: -1, height: 5 }] }]) expect(parseNativeMessage({ version: 1, id: "v", type: "native.viewport", payload })).toBeNull();
  });
  it("gives outgoing messages monotonic local IDs", () => {
    const messages: WebMessage[] = [];
    const post = createOutgoingBridge((message) => messages.push(message));
    post("web.ready", { protocolVersion: 1 }); post("engine.metrics", { frames: 1 });
    expect(messages.map((message) => message.id)).toEqual(["web-1", "web-2"]);
  });
  it("accepts a typed bounded document and exact native durable acknowledgment", () => {
    expect(parseNativeMessage({ version: 1, id: "layout", type: "native.layout", payload: { sessionId: "session-1", document: createStarterLayout(), recovered: false, checkpoint: 3 } })?.type).toBe("native.layout");
    expect(parseNativeMessage({ version: 1, id: "saved", type: "native.saved", payload: { sessionId: "session-1", requestId: "save-4", documentId: "layout-1", revision: 1, checkpoint: 4, checksum: "a".repeat(64) } })?.type).toBe("native.saved");
  });
  it("rejects unknown document fields, fractional checkpoints and malformed save acknowledgments", () => {
    const payload = { sessionId: "session-1", document: createStarterLayout(), recovered: false, checkpoint: 3 };
    for (const malformed of [{ ...payload, checkpoint: 1.2 }, { ...payload, document: { ...payload.document, script: "eval" } }, { ...payload, recovered: "false" }, { ...payload, sessionId: "../file" }, { ...payload, checkpoint: -1 }]) expect(parseNativeMessage({ version: 1, id: "l", type: "native.layout", payload: malformed })).toBeNull();
    expect(parseNativeMessage({ version: 1, id: "s", type: "native.saved", payload: { sessionId: "s", requestId: "s", documentId: "d", revision: 0, checkpoint: 1, checksum: "not-a-sha256" } })).toBeNull();
    expect(parseNativeMessage({ ...lifecycle, payload: { state: { toString: () => "active" } } })).toBeNull();
  });
});
