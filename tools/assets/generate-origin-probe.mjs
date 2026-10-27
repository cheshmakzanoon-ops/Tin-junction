import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { deflateSync } from "node:zlib";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const target = path.join(root, "tests/fixtures/asset-origin");
await mkdir(target, { recursive: true });

function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type, bytes) {
  const name = Buffer.from(type), size = Buffer.alloc(4), checksum = Buffer.alloc(4);
  size.writeUInt32BE(bytes.length); checksum.writeUInt32BE(crc32(Buffer.concat([name, bytes])));
  return Buffer.concat([size, name, bytes, checksum]);
}
const colors = [[230, 60, 45, 255], [60, 180, 95, 255], [60, 100, 230, 255], [238, 204, 70, 255]];
const pixels = Buffer.alloc(8 * (1 + 8 * 4));
for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
  Buffer.from(colors[(y >= 4 ? 2 : 0) + (x >= 4 ? 1 : 0)]).copy(pixels, y * 33 + 1 + x * 4);
}
const header = Buffer.alloc(13); header.writeUInt32BE(8); header.writeUInt32BE(8, 4); header[8] = 8; header[9] = 6;
const png = Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]), chunk("IHDR", header), chunk("IDAT", deflateSync(pixels, { level: 9 })), chunk("IEND", Buffer.alloc(0))]);

const sampleRate = 48_000, frames = 5_760, pcm = Buffer.alloc(frames * 2);
for (let frame = 0; frame < frames; frame++) {
  const fade = Math.min(1, frame / 480, (frames - 1 - frame) / 480);
  pcm.writeInt16LE(Math.round(Math.sin(2 * Math.PI * 880 * frame / sampleRate) * 0.08 * fade * 32767), frame * 2);
}
const wave = Buffer.alloc(44);
wave.write("RIFF"); wave.writeUInt32LE(36 + pcm.length, 4); wave.write("WAVEfmt ", 8);
wave.writeUInt32LE(16, 16); wave.writeUInt16LE(1, 20); wave.writeUInt16LE(1, 22);
wave.writeUInt32LE(sampleRate, 24); wave.writeUInt32LE(sampleRate * 2, 28);
wave.writeUInt16LE(2, 32); wave.writeUInt16LE(16, 34); wave.write("data", 36); wave.writeUInt32LE(pcm.length, 40);

// Original minimal module: (func (export "add_one") (param i32) (result i32)
// local.get 0; i32.const 1; i32.add). No imports or decoder implementation.
const wasm = Buffer.from([0,97,115,109,1,0,0,0,1,6,1,96,1,127,1,127,3,2,1,0,7,11,1,7,97,100,100,95,111,110,101,0,0,10,9,1,7,0,32,0,65,1,106,11]);
const worker = Buffer.from('"use strict";\nself.onmessage = function (event) {\n  if (event.data === "asset-probe") self.postMessage("asset-worker-ready:42");\n};\n');
const files = { "checker.png": png, "tone.wav": Buffer.concat([wave, pcm]), "add-one.wasm": wasm, "echo.worker.js": worker };
const artifacts = {};
for (const [name, bytes] of Object.entries(files)) {
  await writeFile(path.join(target, name), bytes);
  artifacts[name] = { bytes: bytes.length, sha256: createHash("sha256").update(bytes).digest("hex") };
}
const glb = await readFile(path.join(root, "tests/fixtures/assets/calibration.glb"));
const manifest = { formatVersion: 1, provenance: "Original generated diagnostic fixtures; calibration GLB from assets/source/calibration/export_fixture.py",
  texture: { width: 8, height: 8, colors }, audio: { sampleRate, frames, channels: 1, format: "PCM16", frequencyHz: 880 },
  wasm: { export: "add_one", input: 41, expected: 42 }, worker: { input: "asset-probe", expected: "asset-worker-ready:42" },
  artifacts, calibrationGLB: { source: "tests/fixtures/assets/calibration.glb", bytes: glb.length, sha256: createHash("sha256").update(glb).digest("hex") } };
await writeFile(path.join(target, "fixture-manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
console.log("Generated original PNG, PCM WAV, classic worker and minimal WASM fixtures with recorded hashes.");
