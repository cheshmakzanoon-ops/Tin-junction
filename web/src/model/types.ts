/** Physical miniature meters, seconds and radians. No renderer or platform objects. */
export const BOARD = Object.freeze({ width: 0.8, depth: 0.5 });
export const TRACK_GAUGE = 0.0165;
export const RAIL_HEAD_WIDTH = 0.001;
export const RAIL_CENTER_SPACING = TRACK_GAUGE + RAIL_HEAD_WIDTH;
export const WHEEL_RADIUS = 0.006;
export const STEP_SECONDS = 1 / 60;
export const MAX_SPEED = 0.18;
export const ACCELERATION = 0.09;
export const BRAKE_DECELERATION = 0.18;
export const MAX_COUNTER = 9_000_000_000_000_000;
export const MAX_DOCUMENT_BYTES = 524_288;
export const MAX_SCENERY = 128;
export const HISTORY_LIMIT = 100;
export const REPLAY_LIMIT = 256;
export const SCENERY_KINDS = ["fir", "oak", "house", "lamp", "bench", "rock"] as const;
export type SceneryKind = typeof SCENERY_KINDS[number];
export type TimeOfDay = "day" | "dusk" | "night";
export type OperatingMode = "operate" | "edit";
export interface Vector3 { x: number; y: number; z: number }
export interface OvalTrack { kind: "oval"; straightLength: number; radius: number }
export interface SceneryItem {
  id: string; kind: SceneryKind; x: number; z: number; rotation: number; scale: number;
}
export interface TrainState {
  distance: number; speed: number; throttle: number; direction: 1 | -1; wheelTravel: number;
}
export interface LayoutDocument {
  format: "tin-junction-layout";
  schemaVersion: 1;
  documentId: string;
  revision: number;
  name: string;
  seed: number;
  track: OvalTrack;
  train: TrainState;
  scenery: SceneryItem[];
  environment: { timeOfDay: TimeOfDay };
  tick: number;
}
export type ParseResult = { ok: true; value: LayoutDocument } | { ok: false; error: string };
export type ModelCommand =
  | { type: "throttle"; value: number }
  | { type: "stop" }
  | { type: "reverse" }
  | { type: "mode"; value: OperatingMode }
  | { type: "scenery.add"; item: SceneryItem }
  | { type: "scenery.move"; id: string; x: number; z: number; rotation?: number }
  | { type: "scenery.remove"; id: string }
  | { type: "environment"; value: TimeOfDay }
  | { type: "rename"; value: string }
  | { type: "track"; value: OvalTrack }
  | { type: "undo" }
  | { type: "redo" };
export interface CommandResult {
  ok: boolean; changed: boolean; code: string; message: string; revision: number;
}
export interface CommandEnvelope {
  id: string; sequence: number; expectedRevision: number; command: ModelCommand;
}
export interface ReplayEntry extends CommandEnvelope { tick: number; resultCode: string }
export interface ReplayLog { initial: LayoutDocument; entries: ReplayEntry[]; finalTick: number; finalDigest: string; complete: boolean }
export const SCENERY_FOOTPRINT: Readonly<Record<SceneryKind, number>> = Object.freeze({
  fir: 0.010, oak: 0.018, house: 0.028, lamp: 0.004, bench: 0.012, rock: 0.014,
});
/** Authored station and pond are immutable scene fixtures in the first operating slice. */
export const RESERVED_SCENERY_AREAS = Object.freeze([
  { name: "station", minX: -0.112, maxX: 0.112, minZ: -0.138, maxZ: -0.055 },
  { name: "pond", minX: 0.155, maxX: 0.255, minZ: 0.030, maxZ: 0.100 },
]);
