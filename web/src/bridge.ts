export type LifecycleState = "active" | "inactive" | "background";
export type Rectangle = { x: number; y: number; width: number; height: number };
export type NativeMessage =
  | { version: 1; id: string; type: "native.bootstrap"; payload: { host: "ios" | "browser"; debug: boolean } }
  | { version: 1; id: string; type: "native.lifecycle"; payload: { state: LifecycleState } }
  | { version: 1; id: string; type: "native.viewport"; payload: { width: number; height: number; pixelRatio: number; reservedRegions?: Rectangle[]; hingeAngleDegrees?: number | null } };
export type WebMessage = { version: 1; id: string; type: "web.ready" | "engine.error" | "engine.metrics"; payload: Record<string, unknown> };

const object = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);
const finite = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);
const dimension = (value: unknown): value is number => finite(value) && value > 0 && value <= 16_384;
const rectangle = (value: unknown): value is Rectangle => object(value) && finite(value.x) && finite(value.y) && finite(value.width) && finite(value.height) && value.width >= 0 && value.height >= 0;

export function parseNativeMessage(value: unknown): NativeMessage | null {
  if (!object(value) || value.version !== 1 || typeof value.id !== "string" || !/^[A-Za-z0-9._:-]{1,128}$/.test(value.id) || !object(value.payload)) return null;
  if (Object.keys(value).some((key) => !["version", "id", "type", "payload"].includes(key))) return null;
  try { if (new TextEncoder().encode(JSON.stringify(value)).length > 65_536) return null; } catch { return null; }
  const payload = value.payload;
  if (value.type === "native.bootstrap") {
    if ((payload.host !== "ios" && payload.host !== "browser") || typeof payload.debug !== "boolean") return null;
    return value as NativeMessage;
  }
  if (value.type === "native.lifecycle") {
    if (payload.state !== "active" && payload.state !== "inactive" && payload.state !== "background") return null;
    return value as NativeMessage;
  }
  if (value.type === "native.viewport") {
    if (!dimension(payload.width) || !dimension(payload.height) || !finite(payload.pixelRatio) || payload.pixelRatio <= 0 || payload.pixelRatio > 8) return null;
    if (payload.reservedRegions !== undefined && (!Array.isArray(payload.reservedRegions) || payload.reservedRegions.length > 16 || !payload.reservedRegions.every(rectangle))) return null;
    if (payload.hingeAngleDegrees !== undefined && payload.hingeAngleDegrees !== null && (!finite(payload.hingeAngleDegrees) || payload.hingeAngleDegrees < 0 || payload.hingeAngleDegrees > 360)) return null;
    return value as NativeMessage;
  }
  return null;
}

export function createOutgoingBridge(post: (message: WebMessage) => void): (type: WebMessage["type"], payload: Record<string, unknown>) => void {
  let sequence = 0;
  return (type, payload) => { sequence += 1; post({ version: 1, id: `web-${sequence}`, type, payload }); };
}
