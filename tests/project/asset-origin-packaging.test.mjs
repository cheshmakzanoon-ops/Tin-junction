import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { cp, mkdtemp, readFile, readdir, rm, symlink, unlink, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { inflateSync } from "node:zlib";
import { runInNewContext } from "node:vm";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildWeb, prepareBundleDirectory, verifyBundle, CORE_RUNTIME_FILES, PROBE_RUNTIME_FILES } from "../../tools/build-web.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
let temporary, probeOutput;
before(async () => {
  temporary = await mkdtemp(path.join(tmpdir(), "tin-origin-packaging-"));
  probeOutput = path.join(temporary, "probe-build");
  await buildWeb({ assetProbe: true, outputDirectory: probeOutput });
});
after(async () => { if (temporary) await rm(temporary, { recursive: true, force: true }); });
async function copyBuild(name) {
  const directory = path.join(temporary, name);
  await cp(probeOutput, directory, { recursive: true });
  return directory;
}

test("explicit probe packages only finite original fixtures and the production CSP", async () => {
  const manifest = await verifyBundle(probeOutput);
  assert.equal(manifest.assetOriginProbe, true);
  assert.deepEqual(Object.keys(manifest.artifacts).sort(), [...CORE_RUNTIME_FILES, ...PROBE_RUNTIME_FILES].sort());
  assert.equal(await readFile(path.join(probeOutput, "index.html"), "utf8"), await readFile(path.join(root, "web/packaged.html"), "utf8"));
  const code = await readFile(path.join(probeOutput, "bundle.js"), "utf8");
  assert.match(code, /TinJunctionAssetOriginProbe/);
  assert.match(code, /Play probe tone/);
  assert.match(await readFile(path.join(probeOutput, "bundle.css"), "utf8"), /asset-origin-probe-panel/);
  const fixtures = JSON.parse(await readFile(path.join(root, "tests/fixtures/asset-origin/fixture-manifest.json"), "utf8"));
  for (const [name, expected] of Object.entries(fixtures.artifacts)) {
    const bytes = await readFile(path.join(probeOutput, "probe", name));
    assert.equal(bytes.length, expected.bytes);
    assert.equal(createHash("sha256").update(bytes).digest("hex"), expected.sha256);
  }
});

test("ordinary rebuild removes prior manifest-owned probe files, code and CSS from both destinations", async () => {
  const outputDirectory = await copyBuild("release-output"), iosDirectory = path.join(temporary, "ios-assets");
  await buildWeb({ assetProbe: true, outputDirectory, iosDirectory });
  assert.equal((await verifyBundle(iosDirectory, true)).assetOriginProbe, true);
  await buildWeb({ outputDirectory, iosDirectory });
  for (const [directory, packaged] of [[outputDirectory, false], [iosDirectory, true]]) {
    const manifest = await verifyBundle(directory, packaged);
    assert.equal(manifest.assetOriginProbe, false);
    assert.deepEqual(Object.keys(manifest.artifacts).sort(), [...CORE_RUNTIME_FILES].sort());
    assert.equal((await readdir(directory)).includes("probe"), false);
    for (const name of ["bundle.js", "bundle.css"]) {
      assert.doesNotMatch(await readFile(path.join(directory, name), "utf8"), /TinJunctionAssetOriginProbe|asset-origin-probe-panel|Play probe tone/);
    }
  }
  const metafile = JSON.parse(await readFile(path.join(outputDirectory, "build-metafile.json"), "utf8"));
  assert.equal(Object.keys(metafile.inputs).some(name => /diagnostics\/assetProbe\.(ts|css)$/.test(name)), false);
});

test("unknown prior outputs are preserved and block cleanup", async () => {
  const directory = await copyBuild("unexpected-file");
  const unknown = path.join(directory, "do-not-delete.txt");
  await writeFile(unknown, "unrecognized content");
  await assert.rejects(prepareBundleDirectory(directory, CORE_RUNTIME_FILES), /Unexpected stale bundle file/);
  assert.equal(await readFile(unknown, "utf8"), "unrecognized content");
  assert.equal((await readdir(path.join(directory, "probe"))).length, 6);
});

test("corrupted manifest-owned bytes block cleanup before any deletion", async () => {
  const directory = await copyBuild("corruption");
  await writeFile(path.join(directory, "probe/tone.wav"), "corrupt");
  await assert.rejects(prepareBundleDirectory(directory, CORE_RUNTIME_FILES), /Bundle integrity failure/);
  assert.equal((await readdir(path.join(directory, "probe"))).length, 6);
});

test("root, manifest and child symlinks cannot redirect packaging or cleanup", async () => {
  const rootLink = path.join(temporary, "root-link");
  await symlink(probeOutput, rootLink);
  await assert.rejects(prepareBundleDirectory(rootLink, CORE_RUNTIME_FILES), /ordinary filesystem entries/);
  const directory = await copyBuild("manifest-link");
  await unlink(path.join(directory, "bundle-manifest.json"));
  await symlink(path.join(probeOutput, "bundle-manifest.json"), path.join(directory, "bundle-manifest.json"));
  await assert.rejects(prepareBundleDirectory(directory, CORE_RUNTIME_FILES), /ordinary filesystem entries/);
  const child = await copyBuild("child-link");
  await unlink(path.join(child, "probe/checker.png"));
  await symlink(path.join(probeOutput, "probe/checker.png"), path.join(child, "probe/checker.png"));
  await assert.rejects(prepareBundleDirectory(child, CORE_RUNTIME_FILES), /Symlinks are prohibited/);
  assert.equal((await readdir(path.join(probeOutput, "probe"))).length, 6);
});

test("minimal WASM and classic-worker fixtures execute their actual expected behavior", async () => {
  const wasm = await WebAssembly.instantiate(await readFile(path.join(probeOutput, "probe/add-one.wasm")));
  assert.equal(wasm.instance.exports.add_one(41), 42);
  const received = [], self = { postMessage: value => received.push(value) };
  runInNewContext(await readFile(path.join(probeOutput, "probe/echo.worker.js"), "utf8"), { self });
  self.onmessage({ data: "unrelated" });
  assert.deepEqual(received, []);
  self.onmessage({ data: "asset-probe" });
  assert.deepEqual(received, ["asset-worker-ready:42"]);
});

test("PNG quadrants and the low-level PCM tone contain real original sample data", async () => {
  const png = await readFile(path.join(probeOutput, "probe/checker.png"));
  assert.equal(png.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
  assert.equal(png.readUInt32BE(16), 8); assert.equal(png.readUInt32BE(20), 8);
  assert.equal(png[24], 8); assert.equal(png[25], 6);
  const chunks = [];
  for (let offset = 8; offset < png.length;) {
    const length = png.readUInt32BE(offset), name = png.toString("ascii", offset + 4, offset + 8);
    if (name === "IDAT") chunks.push(png.subarray(offset + 8, offset + 8 + length));
    offset += length + 12;
  }
  const pixels = inflateSync(Buffer.concat(chunks));
  assert.equal(pixels.length, 8 * 33);
  const samples = [[0, 0], [7, 0], [0, 7], [7, 7]].map(([x, y]) => [...pixels.subarray(y * 33 + 1 + x * 4, y * 33 + 1 + x * 4 + 4)]);
  assert.deepEqual(samples, [[230, 60, 45, 255], [60, 180, 95, 255], [60, 100, 230, 255], [238, 204, 70, 255]]);
  const wav = await readFile(path.join(probeOutput, "probe/tone.wav"));
  assert.equal(wav.toString("ascii", 0, 4), "RIFF"); assert.equal(wav.toString("ascii", 8, 12), "WAVE");
  assert.equal(wav.readUInt16LE(20), 1); assert.equal(wav.readUInt16LE(22), 1);
  assert.equal(wav.readUInt32LE(24), 48_000); assert.equal(wav.readUInt16LE(34), 16);
  assert.equal(wav.readUInt32LE(40), 5760 * 2);
  let peak = 0;
  for (let offset = 44; offset < wav.length; offset += 2) peak = Math.max(peak, Math.abs(wav.readInt16LE(offset)));
  assert.ok(peak > 2000 && peak < 2700, "The fixture must contain a bounded, non-silent tone.");
});
