import { RoutedMotion } from "./routedMotion";
import type { MotionTickResult } from "./routedMotion";
import { solveRoutedPoses } from "./routedPoses";
import type { RoutedVehiclePose } from "./routedPoses";
import type { ConsistVehicle } from "./vehicleCatalog";

export interface PreparedVehicleState {
  readonly motion: RoutedMotion;
  readonly poses: readonly RoutedVehiclePose[];
}
export type VehicleStepResult = { readonly ok: true; readonly state: PreparedVehicleState; readonly tick: MotionTickResult }
  | { readonly ok: false; readonly code: string; readonly message: string; readonly parked: PreparedVehicleState | null };

/**
 * Bounded correctness gate for a future graph runtime. The source is never mutated:
 * commit both candidate motion and candidate poses, or use the parked fallback.
 * A rejected shape cannot advance simulation while leaving stale rendered bodies.
 * Snapshot reconstruction is intentional here; device hot-path cost is unmeasured.
 */
export function prepareVehicleStep(current: RoutedMotion, vehicles: readonly ConsistVehicle[]): VehicleStepResult {
  const before = solveRoutedPoses(current, vehicles);
  if (!before.ok) return { ...before, parked: null };
  const snapshot = current.snapshot(), topology = current.network.topology;
  const parked = (): PreparedVehicleState | null => {
    const restored = RoutedMotion.restore(topology, snapshot);
    return restored.ok ? { motion: restored.motion, poses: before.poses } : null;
  };
  const candidate = RoutedMotion.restore(topology, snapshot, { restoreStopped: false });
  if (!candidate.ok) return { ok: false, code: candidate.code, message: candidate.message, parked: parked() };
  const tick = candidate.motion.step(), after = solveRoutedPoses(candidate.motion, vehicles);
  if (!after.ok) return { ...after, message: `${after.message} The train is parked at its last compatible position; edit the track before continuing.`, parked: parked() };
  return { ok: true, state: { motion: candidate.motion, poses: after.poses }, tick };
}
