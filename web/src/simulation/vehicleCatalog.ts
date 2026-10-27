import type { ClearanceEnvelope } from "../track/clearance";

export const VEHICLE_CATALOG_VERSION = "tin-junction-vehicles-v1" as const;
export type VehicleCatalogId = "steam-01" | "coach-01" | "wagon-01";
export interface ConsistVehicle { readonly id: string; readonly catalogId: VehicleCatalogId }
export interface VehicleDefinition {
  readonly id: VehicleCatalogId;
  readonly bodyLengthMicrometres: number;
  readonly wheelbaseMicrometres: number;
  readonly halfWidthMicrometres: number;
  readonly heightMicrometres: number;
  readonly wheelRadiusMicrometres: number;
  readonly minimumRadiusMicrometres: number;
  readonly axles: 2 | 3;
}
export const VEHICLE_CONSTRAINTS = Object.freeze({
  maxVehicles: 8, longitudinalStretch: 1.5, endMarginMicrometres: 2_000,
  couplerExtensionMicrometres: 1_500, couplerGapMicrometres: 6_000,
  maximumCouplerAngle: Math.PI / 3,
  railTop: 0.0072, couplerHeight: 0.016, rootIterations: 36, bracketSamples: 24,
});
/** Original project prototype dimensions; production asset certification remains a separate gate. */
export const VEHICLE_CATALOG: Readonly<Record<VehicleCatalogId, VehicleDefinition>> = Object.freeze({
  "steam-01": Object.freeze({ id: "steam-01", bodyLengthMicrometres: 74_000, wheelbaseMicrometres: 36_000,
    halfWidthMicrometres: 14_500, heightMicrometres: 51_600, wheelRadiusMicrometres: 6_000, minimumRadiusMicrometres: 100_000, axles: 3 }),
  "coach-01": Object.freeze({ id: "coach-01", bodyLengthMicrometres: 46_000, wheelbaseMicrometres: 28_000,
    halfWidthMicrometres: 13_500, heightMicrometres: 41_000, wheelRadiusMicrometres: 6_000, minimumRadiusMicrometres: 100_000, axles: 2 }),
  "wagon-01": Object.freeze({ id: "wagon-01", bodyLengthMicrometres: 46_000, wheelbaseMicrometres: 28_000,
    halfWidthMicrometres: 13_000, heightMicrometres: 35_000, wheelRadiusMicrometres: 6_000, minimumRadiusMicrometres: 100_000, axles: 2 }),
});
export const DEFAULT_VEHICLES: readonly ConsistVehicle[] = Object.freeze([
  Object.freeze({ id: "engine-01", catalogId: "steam-01" }),
  Object.freeze({ id: "carriage-01", catalogId: "coach-01" }),
  Object.freeze({ id: "freight-01", catalogId: "wagon-01" }),
]);
const object = (input: unknown): input is Record<string, unknown> => input !== null && typeof input === "object" && !Array.isArray(input);

export function validateConsistVehicles(input: unknown): input is readonly ConsistVehicle[] {
  if (!Array.isArray(input) || input.length < 1 || input.length > VEHICLE_CONSTRAINTS.maxVehicles) return false;
  const ids = new Set<string>();
  for (let index = 0; index < input.length; index++) {
    const item = input[index];
    if (!object(item) || Object.keys(item).length !== 2 || !Object.hasOwn(item, "id") || !Object.hasOwn(item, "catalogId")
      || typeof item.id !== "string" || !/^[A-Za-z0-9._:-]{1,128}$/.test(item.id) || ids.has(item.id)) return false;
    if (index === 0 ? item.catalogId !== "steam-01" : item.catalogId !== "coach-01" && item.catalogId !== "wagon-01") return false;
    ids.add(item.id);
  }
  return true;
}

/** Integer-micrometre arithmetic is deliberately shared with the native v2 validator. */
export function consistFootprint(vehicles: readonly ConsistVehicle[]): number {
  if (!validateConsistVehicles(vehicles)) throw new RangeError("Use a supported canonical vehicle composition.");
  const bodyAndCouplers = vehicles.reduce((sum, vehicle) => sum + VEHICLE_CATALOG[vehicle.catalogId].bodyLengthMicrometres + 2 * VEHICLE_CONSTRAINTS.couplerExtensionMicrometres, 0);
  const unextended = bodyAndCouplers + VEHICLE_CONSTRAINTS.couplerGapMicrometres * (vehicles.length - 1);
  return (3 * unextended / 2 + 2 * VEHICLE_CONSTRAINTS.endMarginMicrometres) / 1_000_000;
}

export function consistClearanceEnvelope(vehicles: readonly ConsistVehicle[]): ClearanceEnvelope {
  if (!validateConsistVehicles(vehicles)) throw new RangeError("Use a supported canonical vehicle composition.");
  let halfWidth = 0, height = 0, minimumRadius = 0;
  for (const vehicle of vehicles) {
    const definition = VEHICLE_CATALOG[vehicle.catalogId];
    const radius = definition.minimumRadiusMicrometres / 1_000_000, wheelbase = definition.wheelbaseMicrometres / 1_000_000;
    const reach = (definition.bodyLengthMicrometres / 2 + VEHICLE_CONSTRAINTS.couplerExtensionMicrometres) / 1_000_000;
    halfWidth = Math.max(halfWidth, definition.halfWidthMicrometres / 1_000_000 + reach ** 2 / (2 * radius) + wheelbase ** 2 / (8 * radius));
    height = Math.max(height, definition.heightMicrometres / 1_000_000);
    minimumRadius = Math.max(minimumRadius, radius);
  }
  return Object.freeze({ halfWidth, height, minimumRadius });
}
