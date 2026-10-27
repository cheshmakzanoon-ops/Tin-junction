import { Box3 } from "three";
import type { Object3D } from "three";
import { COUPLER_GAP, RESERVED_SCENERY_AREAS, validTrack } from "../model/index";
import type { OvalTrack } from "../model/index";
import { consistClearanceEnvelope, DEFAULT_VEHICLES, VEHICLE_CATALOG, VEHICLE_CONSTRAINTS } from "../simulation/vehicleCatalog";

export interface StationFootprint { readonly minX: number; readonly maxX: number; readonly minZ: number; readonly maxZ: number }
const definitions = DEFAULT_VEHICLES.map(vehicle => VEHICLE_CATALOG[vehicle.catalogId]);
const margin = 0.00025;
const halfWidth = Math.max(...definitions.map(vehicle => vehicle.halfWidthMicrometres / 1e6));
// If either axle is on a semicircle, its |x| is at least straightLength / 2.
// Every point of its body is within this radius of that axle, regardless of yaw.
// Expanding the radius by the clearance margin excludes even transition bodies
// from the station's X interval before using the tighter straight-track width.
const transitionReach = Math.max(...definitions.map(vehicle => Math.hypot(
  (vehicle.wheelbaseMicrometres + vehicle.bodyLengthMicrometres) / 2e6,
  vehicle.halfWidthMicrometres / 1e6,
))) + margin;
const curveHalfWidth = consistClearanceEnvelope(DEFAULT_VEHICLES).halfWidth;
// The actual coupling links are 1.1 mm-radius cylinders. Their endpoints have
// the catalog's conservative overhang/sagitta bound; any point on a link is at
// most half its accepted length from an endpoint (distance is 1-Lipschitz).
// This whole-route bound is narrower than the 14.5 mm body corridor, so links
// do not need to be treated as full-width body extensions at a curve transition.
const couplerRadius = 0.0011, couplerSolveTolerance = 0.00001;
const couplerHalfWidth = Math.max(...definitions.map(vehicle => {
  const radius = vehicle.minimumRadiusMicrometres / 1e6;
  const reach = (vehicle.bodyLengthMicrometres / 2 + VEHICLE_CONSTRAINTS.couplerExtensionMicrometres) / 1e6;
  const wheelbase = vehicle.wheelbaseMicrometres / 1e6;
  return reach ** 2 / (2 * radius) + wheelbase ** 2 / (8 * radius);
})) + (COUPLER_GAP + couplerSolveTolerance) / 2 + couplerRadius;

export const STATION_CLEARANCE = Object.freeze({ margin, halfWidth, transitionReach, curveHalfWidth, couplerHalfWidth, couplerRadius });
const reservation = RESERVED_SCENERY_AREAS.find(area => area.name === "station")!;
const finiteFootprint = (bounds: StationFootprint): boolean =>
  [bounds.minX, bounds.maxX, bounds.minZ, bounds.maxZ].every(Number.isFinite)
  && bounds.minX < bounds.maxX && bounds.minZ < bounds.maxZ;

/** Exact minimum distance from a filled rectangle to an analytic oval. */
export function rectangleToOvalClearance(track: OvalTrack, bounds: StationFootprint): number {
  if (!validTrack(track) || !finiteFootprint(bounds)) throw new RangeError("Invalid station clearance geometry");
  const half = track.straightLength / 2;
  // The route is the radius-r level set of distance to the central segment.
  // That continuous distance covers [nearest, farthest] on a connected filled
  // rectangle. A level inside the interval crosses its interior, even when all
  // corners are well clear of the rail. The convex farthest distance is at a corner.
  const nearX = Math.max(bounds.minX - half, -half - bounds.maxX, 0);
  const nearZ = Math.max(bounds.minZ, -bounds.maxZ, 0);
  const nearest = Math.hypot(nearX, nearZ);
  const farX = Math.max(Math.abs(bounds.minX) - half, Math.abs(bounds.maxX) - half, 0);
  const farZ = Math.max(Math.abs(bounds.minZ), Math.abs(bounds.maxZ));
  const farthest = Math.hypot(farX, farZ);
  return Math.max(nearest - track.radius, track.radius - farthest, 0);
}

/** The authored station is optional decoration, never a saved scenery item. */
export function stationFitsTrack(track: OvalTrack, bounds: StationFootprint): boolean {
  if (!validTrack(track) || !finiteFootprint(bounds)
    || bounds.minX < reservation.minX || bounds.maxX > reservation.maxX
    || bounds.minZ < reservation.minZ || bounds.maxZ > reservation.maxZ
    || couplerHalfWidth > halfWidth) return false;
  const half = track.straightLength / 2;
  const straightOnly = bounds.minX >= -half + transitionReach && bounds.maxX <= half - transitionReach;
  const required = (straightOnly ? halfWidth : curveHalfWidth) + margin;
  // Keep the positive physical gap at equality; do not let floating-point
  // rounding turn a boundary case into an unsafe acceptance.
  return rectangleToOvalClearance(track, bounds) >= required + 1e-9;
}

/** Cache the full transformed render bounds once; geometry and pose stay fixed. */
export class FixedStationPlacement {
  readonly footprint: StationFootprint;
  constructor(readonly object: Object3D) {
    const bounds = new Box3().setFromObject(object);
    this.footprint = Object.freeze({ minX: bounds.min.x, maxX: bounds.max.x, minZ: bounds.min.z, maxZ: bounds.max.z });
    object.visible = false;
  }

  update(track: OvalTrack): void {
    this.object.visible = stationFitsTrack(track, this.footprint);
  }
}
