import { parseLayoutDocument } from "./model";
import type { LayoutDocument } from "./model";

export type LifecycleState = "active" | "inactive" | "background";
export type Rectangle = { x: number; y: number; width: number; height: number };
type Envelope<T extends string, P> = { version: 1; id: string; type: T; payload: P };
export type NativeMessage =
  | Envelope<"native.bootstrap", { host: "ios" | "browser"; debug: boolean; sessionId?: string }>
  | Envelope<"native.lifecycle", { state: LifecycleState }>
  | Envelope<"native.viewport", { width: number; height: number; pixelRatio: number; reservedRegions?: Rectangle[]; hingeAngleDegrees?: number | null }>
  | Envelope<"native.layout", { sessionId: string; document: LayoutDocument | null; recovered: boolean; checkpoint: number }>
  | Envelope<"native.saved", { sessionId: string; requestId: string; documentId: string; revision: number; checkpoint: number; checksum: string }>
  | Envelope<"native.saveFailed", { sessionId: string; requestId: string; code: string; message: string }>
  | Envelope<"native.requestCheckpoint", { sessionId: string }>;
export type WebMessage = Envelope<"web.ready" | "engine.error" | "engine.metrics" | "layout.checkpoint" | "layout.loaded", Record<string, unknown>>;

const object = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);
const finite = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);
const dimension = (value: unknown): value is number => finite(value) && value > 0 && value <= 16_384;
const integer = (value: unknown): value is number => Number.isSafeInteger(value) && (value as number) >= 0;
const identifier = (value: unknown): value is string => typeof value === "string" && /^[A-Za-z0-9._:-]{1,128}$/.test(value);
const keys = (value: Record<string, unknown>, allowed: readonly string[]): boolean => Object.keys(value).every(key => allowed.includes(key));
const rectangle = (value: unknown): value is Rectangle => object(value) && keys(value, ["x", "y", "width", "height"]) && finite(value.x) && finite(value.y) && finite(value.width) && finite(value.height) && value.width >= 0 && value.height >= 0 && Math.abs(value.x) <= 16_384 && Math.abs(value.y) <= 16_384 && value.width <= 16_384 && value.height <= 16_384;

/** The receiver accepts data only; the protocol has no script, URL or filesystem operation. */
export function parseNativeMessage(value: unknown): NativeMessage | null {
  if (!object(value) || value.version !== 1 || !identifier(value.id) || !object(value.payload) || !keys(value, ["version", "id", "type", "payload"])) return null;
  try { if (new TextEncoder().encode(JSON.stringify(value)).length > (value.type === "native.layout" ? 524_288 : 65_536)) return null; } catch { return null; }
  const payload = value.payload;
  switch (value.type) {
    case "native.bootstrap":
      if (!keys(payload, ["host", "debug", "sessionId"]) || (payload.host !== "ios" && payload.host !== "browser") || typeof payload.debug !== "boolean" || (payload.sessionId !== undefined && !identifier(payload.sessionId))) return null;
      break;
    case "native.lifecycle":
      if (!keys(payload, ["state"]) || (payload.state !== "active" && payload.state !== "inactive" && payload.state !== "background")) return null;
      break;
    case "native.viewport":
      if (!keys(payload, ["width", "height", "pixelRatio", "reservedRegions", "hingeAngleDegrees"]) || !dimension(payload.width) || !dimension(payload.height) || !finite(payload.pixelRatio) || payload.pixelRatio <= 0 || payload.pixelRatio > 8) return null;
      if (payload.reservedRegions !== undefined && (!Array.isArray(payload.reservedRegions) || payload.reservedRegions.length > 16 || !payload.reservedRegions.every(rectangle))) return null;
      if (payload.hingeAngleDegrees !== undefined && payload.hingeAngleDegrees !== null && (!finite(payload.hingeAngleDegrees) || payload.hingeAngleDegrees < 0 || payload.hingeAngleDegrees > 360)) return null;
      break;
    case "native.layout":
      if (!keys(payload, ["sessionId", "document", "recovered", "checkpoint"]) || !identifier(payload.sessionId) || typeof payload.recovered !== "boolean" || !integer(payload.checkpoint)) return null;
      if (payload.document !== null && !parseLayoutDocument(payload.document).ok) return null;
      break;
    case "native.saved":
      if (!keys(payload, ["sessionId", "requestId", "documentId", "revision", "checkpoint", "checksum"]) || !identifier(payload.sessionId) || !identifier(payload.requestId) || !identifier(payload.documentId) || !integer(payload.revision) || !integer(payload.checkpoint) || typeof payload.checksum !== "string" || !/^[a-f0-9]{64}$/.test(payload.checksum)) return null;
      break;
    case "native.saveFailed":
      if (!keys(payload, ["sessionId", "requestId", "code", "message"]) || !identifier(payload.sessionId) || !identifier(payload.requestId) || !identifier(payload.code) || typeof payload.message !== "string" || payload.message.length < 1 || payload.message.length > 300) return null;
      break;
    case "native.requestCheckpoint":
      if (!keys(payload, ["sessionId"]) || !identifier(payload.sessionId)) return null;
      break;
    default: return null;
  }
  return value as NativeMessage;
}

export function createOutgoingBridge(post: (message: WebMessage) => void): (type: WebMessage["type"], payload: Record<string, unknown>) => void {
  let sequence = 0;
  return (type, payload) => { sequence += 1; post({ version: 1, id: `web-${sequence}`, type, payload }); };
}
