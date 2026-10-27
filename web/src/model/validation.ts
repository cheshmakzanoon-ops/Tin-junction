import { distanceToOval, ovalLength, validTrack } from "./geometry";
import { MAX_COUNTER, MAX_DOCUMENT_BYTES, MAX_SCENERY, MAX_SPEED, RESERVED_SCENERY_AREAS, SCENERY_FOOTPRINT, SCENERY_KINDS } from "./types";
import type { LayoutDocument, OvalTrack, ParseResult, SceneryItem } from "./types";

export const validId = (value: unknown): value is string => typeof value === "string" && /^[A-Za-z0-9._:-]{1,128}$/.test(value);
export const finiteRange = (value: unknown, min: number, max: number): value is number => typeof value === "number" && Number.isFinite(value) && value >= min && value <= max;
export const counter = (value: unknown): value is number => finiteRange(value, 0, MAX_COUNTER) && Number.isSafeInteger(value);
export const plainObject = (value: unknown): value is Record<string, unknown> => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const prototype: unknown = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
};
export const exactKeys = (value: Record<string, unknown>, required: readonly string[], optional: readonly string[] = []): boolean =>
  required.every((key) => Object.hasOwn(value, key)) && Object.keys(value).every((key) => required.includes(key) || optional.includes(key));
export const validName = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0 && [...value].length <= 80
  && !/[\u0000-\u001f\u007f-\u009f]/.test(value) && !/[\ud800-\udfff]/u.test(value);

export function sceneryPlacementError(item: SceneryItem, track: OvalTrack): string | null {
  const footprint = SCENERY_FOOTPRINT[item.kind] * item.scale;
  if (Math.abs(item.x) + footprint > 0.39 + 1e-10 || Math.abs(item.z) + footprint > 0.24 + 1e-10) return "Keep the whole object inside the case.";
  if (distanceToOval(track, item.x, item.z) + 1e-10 < footprint + 0.018) return "Leave room beside the rails for the train.";
  for (const area of RESERVED_SCENERY_AREAS) {
    const dx = Math.max(area.minX - item.x, 0, item.x - area.maxX);
    const dz = Math.max(area.minZ - item.z, 0, item.z - area.maxZ);
    if (Math.hypot(dx, dz) + 1e-10 < footprint) return `Keep the ${area.name} clear.`;
  }
  return null;
}

export function sceneryShapeError(value: unknown): string | null {
  if (!plainObject(value) || !exactKeys(value, ["id", "kind", "x", "z", "rotation", "scale"])) return "Scenery has missing or unknown fields.";
  if (!validId(value.id)) return "Scenery needs a bounded stable ID.";
  if (typeof value.kind !== "string" || !(SCENERY_KINDS as readonly string[]).includes(value.kind)) return "Unknown scenery kind.";
  if (!finiteRange(value.x, -0.4, 0.4) || !finiteRange(value.z, -0.25, 0.25)) return "Scenery position is outside the board.";
  if (!finiteRange(value.rotation, -2 * Math.PI, 2 * Math.PI) || !finiteRange(value.scale, 0.5, 2)) return "Invalid scenery rotation or scale.";
  return null;
}

function validate(value: unknown): string | null {
  if (!plainObject(value) || !exactKeys(value, ["format", "schemaVersion", "documentId", "revision", "name", "seed", "track", "train", "scenery", "environment", "tick"])) return "Layout has missing or unknown fields.";
  if (value.format !== "tin-junction-layout" || value.schemaVersion !== 1) return "Unsupported layout format or version.";
  if (!validId(value.documentId)) return "Layout needs a bounded stable ID.";
  if (!counter(value.revision) || !counter(value.tick)) return "Layout revision and tick must be nonnegative safe integers.";
  if (!validName(value.name)) return "Name must contain 1–80 characters without control characters.";
  if (!finiteRange(value.seed, 0, 4_294_967_295) || !Number.isInteger(value.seed)) return "Seed must be an unsigned 32-bit integer.";
  if (!plainObject(value.track) || !exactKeys(value.track, ["kind", "straightLength", "radius"]) || !validTrack(value.track as unknown as OvalTrack)) return "Track dimensions do not fit the supported oval.";
  const track = value.track as unknown as OvalTrack;
  if (!plainObject(value.train) || !exactKeys(value.train, ["distance", "speed", "throttle", "direction", "wheelTravel"])) return "Train has missing or unknown fields.";
  if (!finiteRange(value.train.distance, 0, ovalLength(track)) || value.train.distance >= ovalLength(track)) return "Train route distance is outside the circuit.";
  if (!finiteRange(value.train.speed, 0, MAX_SPEED) || !finiteRange(value.train.throttle, 0, 1) || (value.train.direction !== 1 && value.train.direction !== -1) || !finiteRange(value.train.wheelTravel, -1e9, 1e9)) return "Train motion state is invalid.";
  if (!plainObject(value.environment) || !exactKeys(value.environment, ["timeOfDay"]) || (value.environment.timeOfDay !== "day" && value.environment.timeOfDay !== "dusk" && value.environment.timeOfDay !== "night")) return "Unknown lighting preset.";
  if (!Array.isArray(value.scenery) || value.scenery.length > MAX_SCENERY) return `A layout supports at most ${MAX_SCENERY} scenery objects.`;
  const ids = new Set<string>();
  for (const item of value.scenery) {
    const shapeError = sceneryShapeError(item);
    if (shapeError) return shapeError;
    const scenery = item as SceneryItem;
    if (ids.has(scenery.id)) return `Duplicate scenery ID: ${scenery.id}.`;
    ids.add(scenery.id);
    const placementError = sceneryPlacementError(scenery, track);
    if (placementError) return `${scenery.id}: ${placementError}`;
  }
  return null;
}

export function cloneLayout(document: LayoutDocument): LayoutDocument {
  return {
    format: document.format, schemaVersion: document.schemaVersion, documentId: document.documentId,
    revision: document.revision, name: document.name, seed: document.seed,
    track: { ...document.track }, train: { ...document.train },
    scenery: document.scenery.map((item) => ({ ...item })), environment: { ...document.environment }, tick: document.tick,
  };
}

/** Validates untrusted input before allocating any geometry; returned data has no caller aliases. */
export function parseLayoutDocument(input: unknown): ParseResult {
  try {
    let value: unknown = input;
    const text = typeof input === "string" ? input : JSON.stringify(input);
    if (typeof text !== "string" || new TextEncoder().encode(text).byteLength > MAX_DOCUMENT_BYTES) return { ok: false, error: "Layout exceeds the 512 KiB input limit." };
    if (typeof input === "string") value = JSON.parse(input);
    const error = validate(value);
    return error ? { ok: false, error } : { ok: true, value: cloneLayout(value as LayoutDocument) };
  } catch { return { ok: false, error: "Layout is not valid bounded JSON." }; }
}

/** Diagnostic comparison only; this is not a persistence integrity hash. */
export function canonicalLayout(document: LayoutDocument): string {
  const copy = cloneLayout(document);
  copy.scenery.sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  return JSON.stringify(copy, (_key: string, value: unknown) => typeof value === "number" && !Number.isInteger(value) ? Math.round(value * 1e9) / 1e9 : value);
}

export function stateDigest(document: LayoutDocument): string {
  const text = canonicalLayout(document);
  let hash = 0x811c9dc5;
  for (let index = 0; index < text.length; index++) hash = Math.imul(hash ^ text.charCodeAt(index), 0x01000193);
  return (hash >>> 0).toString(16).padStart(8, "0");
}
