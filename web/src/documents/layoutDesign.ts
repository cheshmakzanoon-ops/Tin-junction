import { counter, exactKeys, finiteRange, plainObject, sceneryShapeError, validId, validName } from "../model/validation";
import { MAX_DOCUMENT_BYTES, MAX_SCENERY, SCENERY_FOOTPRINT } from "../model/types";
import type { SceneryItem, TimeOfDay } from "../model/types";
import { buildTurnoutTopology, compileTurnoutRoutes } from "../track/turnout";
import type { TurnoutSelection, TurnoutTopology } from "../track/turnout";
import { validateTrackClearance } from "../track/clearance";
import type { ClearanceResult } from "../track/clearance";
import { RoutedMotion } from "../simulation/routedMotion";
import type { RoutedMotionSnapshot } from "../simulation/routedMotion";
import { consistClearanceEnvelope, consistFootprint, validateConsistVehicles, VEHICLE_CATALOG_VERSION } from "../simulation/vehicleCatalog";
import type { ConsistVehicle } from "../simulation/vehicleCatalog";

export const DESIGN_CATALOG_VERSION = "tin-junction-layout-kit-v1";
export const DESIGN_LIMITS = Object.freeze({ bytes: MAX_DOCUMENT_BYTES, depth: 32, values: 40_000 });
export interface DesignTrain {
  readonly id: string;
  readonly catalogVersion: typeof VEHICLE_CATALOG_VERSION;
  /** Permanent physical order; reversing travel never reverses this array. */
  readonly vehicles: readonly ConsistVehicle[];
  readonly motion: RoutedMotionSnapshot;
}
export interface LayoutDesignDocument {
  readonly format: "tin-junction-layout";
  readonly schemaVersion: 2;
  readonly documentId: string;
  readonly revision: number;
  readonly name: string;
  readonly seed: number;
  readonly catalogVersion: typeof DESIGN_CATALOG_VERSION;
  readonly boardId: "workbench.case";
  readonly track: TurnoutTopology;
  readonly selections: readonly TurnoutSelection[];
  readonly train: DesignTrain | null;
  readonly scenery: readonly SceneryItem[];
  readonly environment: { readonly timeOfDay: TimeOfDay };
}
export type DesignParseResult = { readonly ok: true; readonly value: LayoutDesignDocument }
  | { readonly ok: false; readonly code: string; readonly message: string };
const rejected = (code: string, message: string): DesignParseResult => ({ ok: false, code, message });
const ordered = <T extends { readonly id: string }>(a: T, b: T): number => a.id < b.id ? -1 : a.id > b.id ? 1 : 0;

/** No getters, functions, sparse arrays, prototype instances or silent NaN coercion. */
function verifyJSONValues(input: unknown): void {
  const stack = [{ value: input, depth: 0 }];
  const seen = new Set<object>(); let count = 0;
  while (stack.length) {
    const { value, depth } = stack.pop()!;
    if (++count > DESIGN_LIMITS.values || depth > DESIGN_LIMITS.depth) throw new RangeError("Document structure exceeds its bounded depth or value count.");
    if (value === null || typeof value === "boolean" || typeof value === "string") continue;
    if (typeof value === "number" && Number.isFinite(value)) continue;
    if (typeof value !== "object" || (!Array.isArray(value) && !plainObject(value))) throw new TypeError("Document values must be plain finite JSON.");
    // Shared aliases are also rejected: the portable document is a tree, never
    // an object graph whose identity depends on the caller's runtime.
    if (seen.has(value)) throw new TypeError("Document values must form a detached JSON tree.");
    seen.add(value);
    if (Object.getOwnPropertySymbols(value).length) throw new TypeError("Symbol properties are not portable JSON.");
    const descriptors = Object.getOwnPropertyDescriptors(value);
    if (Array.isArray(value)) {
      if (value.length > DESIGN_LIMITS.values || Object.keys(value).length !== value.length) throw new RangeError("Document arrays must be bounded and dense.");
      for (let index = 0; index < value.length; index++) {
        const descriptor = descriptors[String(index)];
        if (!descriptor || !Object.hasOwn(descriptor, "value")) throw new TypeError("Document accessors are not supported.");
        stack.push({ value: descriptor.value, depth: depth + 1 });
      }
    } else {
      if (Object.keys(descriptors).length > DESIGN_LIMITS.values) throw new RangeError("Document object is too large.");
      for (const descriptor of Object.values(descriptors)) {
        if (!Object.hasOwn(descriptor, "value") || !descriptor.enumerable) throw new TypeError("Document accessors and hidden properties are not supported.");
        stack.push({ value: descriptor.value, depth: depth + 1 });
      }
    }
  }
}

function selectionsEqual(a: readonly TurnoutSelection[], b: readonly TurnoutSelection[]): boolean {
  return a.length === b.length && a.every((selection, index) => selection.turnoutId === b[index]!.turnoutId && selection.route === b[index]!.route);
}

/**
 * File validity is distinct from operation clearance. A document can preserve
 * an incomplete design; P05 clearance must pass again before placing/running a
 * train. Saved occupied intervals and moving-state braking are always valid.
 */
export function parseLayoutDesign(input: unknown): DesignParseResult {
  try {
    let value: unknown;
    if (typeof input === "string") {
      if (new TextEncoder().encode(input).byteLength > DESIGN_LIMITS.bytes) return rejected("too-large", "The layout exceeds the 512 KiB document limit.");
      value = JSON.parse(input); verifyJSONValues(value);
    } else {
      verifyJSONValues(input);
      const text = JSON.stringify(input);
      if (new TextEncoder().encode(text).byteLength > DESIGN_LIMITS.bytes) return rejected("too-large", "The layout exceeds the 512 KiB document limit.");
      value = JSON.parse(text);
    }
    if (!plainObject(value) || value.format !== "tin-junction-layout") return rejected("format", "This is not a Tin Junction layout document.");
    if (value.schemaVersion !== 2) return rejected("unsupported-version", "This layout version needs a supported migration or a newer app. The original file is unchanged.");
    if (!exactKeys(value, ["format", "schemaVersion", "documentId", "revision", "name", "seed", "catalogVersion", "boardId", "track", "selections", "train", "scenery", "environment"])) return rejected("fields", "The layout has missing or unknown fields.");
    if (!validId(value.documentId) || !counter(value.revision) || !validName(value.name) || !finiteRange(value.seed, 0, 0xffff_ffff) || !Number.isInteger(value.seed))
      return rejected("identity", "The layout identity, revision, name or seed is invalid.");
    if (value.catalogVersion !== DESIGN_CATALOG_VERSION || value.boardId !== "workbench.case") return rejected("unsupported-catalog", "A required layout kit or case is unavailable. Keep the original file for a compatible app.");
    if (!plainObject(value.track) || !counter(value.track.revision)) return rejected("track", "The track revision is invalid.");
    const topology = buildTurnoutTopology(value.track);
    if (!topology.ok) return rejected("track", topology.diagnostics[0]!.message);
    const routes = compileTurnoutRoutes(topology.value, value.selections);
    if (!routes.ok || !Array.isArray(value.selections)) return rejected("selections", "Every turnout needs one known selected route.");
    let train: DesignTrain | null = null;
    if (value.train !== null) {
      const source = value.train;
      if (!plainObject(source) || !exactKeys(source, ["id", "catalogVersion", "vehicles", "motion"]) || !validId(source.id)) return rejected("train", "The train design has missing or unknown fields.");
      if (source.catalogVersion !== VEHICLE_CATALOG_VERSION || !validateConsistVehicles(source.vehicles)) return rejected("unsupported-vehicle", "Choose one supported locomotive followed by known carriages with distinct stable identities.");
      if (!plainObject(source.motion) || !plainObject(source.motion.consist) || source.motion.consist.trainId !== source.id || !counter(source.motion.consist.switchRevision))
        return rejected("train", "Train identity or switch revision disagrees with its checkpoint.");
      const vehicles = source.vehicles as unknown as readonly ConsistVehicle[];
      if (!finiteRange(source.motion.consist.length, 0.001, 1) || Math.abs(source.motion.consist.length - consistFootprint(vehicles)) > 1e-9)
        return rejected("train-footprint", "The checkpoint must retain the catalog's complete conservative train footprint.");
      const restored = RoutedMotion.restore(topology.value, source.motion, { restoreStopped: false });
      if (!restored.ok) return rejected("train-checkpoint", restored.message);
      const motion = restored.motion.snapshot();
      if (!selectionsEqual(routes.value.selections, motion.consist.selections)) return rejected("selections", "The checkpoint's turnout selections disagree with the layout design.");
      train = { id: source.id, catalogVersion: VEHICLE_CATALOG_VERSION, vehicles: vehicles.map(vehicle => ({ id: vehicle.id, catalogId: vehicle.catalogId })), motion };
    }
    if (!Array.isArray(value.scenery) || value.scenery.length > MAX_SCENERY) return rejected("scenery", "The layout exceeds its supported scenery count.");
    const scenery: SceneryItem[] = [], ids = new Set<string>();
    for (const source of value.scenery) {
      const error = sceneryShapeError(source);
      if (error) return rejected("scenery", error);
      const item = source as SceneryItem, footprint = SCENERY_FOOTPRINT[item.kind] * item.scale;
      if (ids.has(item.id) || Math.abs(item.x) + footprint > 0.39 + 1e-10 || Math.abs(item.z) + footprint > 0.24 + 1e-10)
        return rejected("scenery", "Scenery identities must be distinct and their complete footprints must fit inside the case.");
      ids.add(item.id); scenery.push({ ...item });
    }
    if (!plainObject(value.environment) || !exactKeys(value.environment, ["timeOfDay"]) || !["day", "dusk", "night"].includes(value.environment.timeOfDay as string)) return rejected("environment", "The lighting preset is not supported.");
    return { ok: true, value: {
      format: "tin-junction-layout", schemaVersion: 2, documentId: value.documentId, revision: value.revision, name: value.name,
      seed: value.seed, catalogVersion: DESIGN_CATALOG_VERSION, boardId: "workbench.case", track: topology.value,
      selections: routes.value.selections, train, scenery: scenery.sort(ordered), environment: { timeOfDay: value.environment.timeOfDay as TimeOfDay },
    } };
  } catch { return rejected("invalid-json", "The layout must contain bounded, finite JSON without runtime objects. The original is unchanged."); }
}

/** Engine-side operating gate; successful file decoding never implies clearance certification. */
export function layoutOperatingClearance(document: LayoutDesignDocument): ClearanceResult {
  const parsed = parseLayoutDesign(document);
  if (!parsed.ok) throw new RangeError(parsed.message);
  const train = parsed.value.train;
  return validateTrackClearance(parsed.value.track, train ? consistClearanceEnvelope(train.vehicles) : { halfWidth: 0.0145, height: 0.004, minimumRadius: 0.1 });
}

function sortedJSON(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortedJSON);
  if (plainObject(value)) return Object.fromEntries(Object.keys(value).sort().map(key => [key, sortedJSON(value[key])]));
  return value;
}

/** Stable logical ordering and full precision; no display quantization enters persistence. */
export function serializeLayoutDesign(document: LayoutDesignDocument): string {
  const result = parseLayoutDesign(document);
  if (!result.ok) throw new RangeError(result.message);
  const text = JSON.stringify(sortedJSON(result.value));
  if (new TextEncoder().encode(text).byteLength > DESIGN_LIMITS.bytes) throw new RangeError("Canonical layout exceeds its byte limit.");
  return text;
}
