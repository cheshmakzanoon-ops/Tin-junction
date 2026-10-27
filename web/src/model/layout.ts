import { parseLayoutDocument } from "./validation";
import { ovalLength } from "./geometry";
import type { LayoutDocument, OvalTrack, SceneryItem, SceneryKind } from "./types";

/** Mulberry32 v1. Integer seed zero is valid and does not lock the generator. */
export function createRandom(seed: number): () => number {
  if (!Number.isInteger(seed) || seed < 0 || seed > 0xffff_ffff) throw new RangeError("Seed must be an unsigned 32-bit integer.");
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value ^= value + Math.imul(value ^ (value >>> 7), 61 | value);
    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
  };
}

export function createStarterLayout(seed = 20_261_026): LayoutDocument {
  const random = createRandom(seed);
  const scenery: SceneryItem[] = [];
  const place = (id: string, kind: SceneryKind, x: number, z: number, scale = 1, rotation = 0): void => {
    scenery.push({ id, kind, x, z, scale, rotation });
  };
  place("village-house-west", "house", -0.09, 0.025, 0.9, Math.PI / 2);
  place("village-house-center", "house", 0, 0.04, 1.05, -Math.PI / 2);
  place("village-house-east", "house", 0.09, 0.02, 0.85, Math.PI / 2);
  place("village-oak", "oak", -0.02, -0.005, 0.85, 0.3);
  place("village-bench", "bench", 0.055, -0.027, 0.8, 0);
  place("village-lamp-west", "lamp", -0.08, -0.030, 1, 0);
  place("village-lamp-east", "lamp", 0.105, -0.030, 1, 0);
  const treePositions: readonly (readonly [number, number])[] = [
    [-0.25, -0.02], [-0.23, 0.015], [-0.20, -0.015], [-0.18, 0.045], [-0.22, 0.065], [-0.145, 0.07],
    [0.17, -0.040], [0.205, -0.025], [0.245, -0.035], [0.27, -0.01],
    [-0.30, -0.19], [-0.26, -0.205], [-0.34, -0.16], [0.30, -0.19], [0.26, -0.205],
    [-0.30, 0.19], [-0.26, 0.205], [0.30, 0.19], [0.26, 0.205], [0.34, 0.16],
  ];
  for (const [index, [x, z]] of treePositions.entries()) place(`forest-${index + 1}`, "fir", x, z, 0.72 + random() * 0.45, random() * Math.PI * 2);
  place("rock-west", "rock", -0.283, 0.012, 0.7, 0.5);
  place("rock-east", "rock", 0.28, 0.035, 0.65, -0.8);
  const track: OvalTrack = { kind: "oval", straightLength: 0.34, radius: 0.145 };
  const document: LayoutDocument = {
    format: "tin-junction-layout", schemaVersion: 1, documentId: `layout-${seed.toString(16)}`,
    revision: 0, name: "Alpine afternoon", seed,
    track,
    train: { distance: ovalLength(track) * 0.62, speed: 0, throttle: 0, direction: 1, wheelTravel: 0 },
    scenery, environment: { timeOfDay: "day" }, tick: 0,
  };
  const parsed = parseLayoutDocument(document);
  if (!parsed.ok) throw new Error(`Invalid starter layout: ${parsed.error}`);
  return parsed.value;
}
