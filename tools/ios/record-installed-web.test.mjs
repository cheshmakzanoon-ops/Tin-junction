import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { cp, mkdir, mkdtemp, readFile, readdir, rm, symlink, unlink, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildWeb, verifyBundle } from "../build-web.mjs";
import { INSTALLED_WEB_IDENTITY, INSTALLED_WEB_MANIFEST, recordInstalledWeb } from "./record-installed-web.mjs";

const script = fileURLToPath(new URL("./record-installed-web.mjs", import.meta.url));
const digest = bytes => createHash("sha256").update(bytes).digest("hex");
let temporary, ordinary, diagnostic;
before(async () => {
  temporary = await mkdtemp(path.join(tmpdir(), "tin-installed-web-"));
  ordinary = path.join(temporary, "ordinary"); diagnostic = path.join(temporary, "diagnostic");
  await buildWeb({ outputDirectory: path.join(temporary, "ordinary-build"), iosDirectory: ordinary });
  await buildWeb({ assetProbe: true, outputDirectory: path.join(temporary, "diagnostic-build"), iosDirectory: diagnostic });
});
after(async () => { if (temporary) await rm(temporary, { recursive: true, force: true }); });
async function copyBundle(source, name) {
  const target = path.join(temporary, name); await cp(source, target, { recursive: true }); return target;
}
const observe = (source, output, packaged = source) =>
  recordInstalledWeb(source, output, path.join(packaged, "bundle-manifest.json"));
async function noPassingOutput(output) {
  const names = await readdir(output);
  assert.ok(!names.includes(INSTALLED_WEB_IDENTITY));
  assert.ok(!names.includes(INSTALLED_WEB_MANIFEST));
  assert.ok(!names.some(name => name.startsWith(".installed-web-")));
}

test("records exact ordinary and diagnostic installed bytes without container paths", async () => {
  for (const [name, source, probe, count] of [["ordinary", ordinary, false, 4], ["probe", diagnostic, true, 10]]) {
    const output = path.join(temporary, `${name}-evidence`);
    const identity = await observe(source, output);
    assert.equal(identity.result, "passed"); assert.equal(identity.assetOriginProbe, probe);
    assert.equal(Object.keys(identity.artifacts).length, count);
    const originalManifest = await readFile(path.join(source, "bundle-manifest.json"));
    assert.deepEqual(await readFile(path.join(output, INSTALLED_WEB_MANIFEST)), originalManifest);
    assert.equal(identity.manifest.sha256, digest(originalManifest));
    assert.deepEqual(identity.packagingInput, { bytes: originalManifest.length, sha256: digest(originalManifest), matchesInstalledManifest: true });
    for (const [filename, observed] of Object.entries(identity.artifacts)) {
      const bytes = await readFile(path.join(source, filename));
      assert.deepEqual(observed, { bytes: bytes.length, sha256: digest(bytes) });
    }
    const report = await readFile(path.join(output, INSTALLED_WEB_IDENTITY), "utf8");
    assert.deepEqual(JSON.parse(report), identity);
    assert.ok(!report.includes(temporary));
  }
});

test("altered, missing, unexpected and falsely relabeled installed resources remove stale passing evidence", async () => {
  const mutations = [
    ["altered", ordinary, directory => writeFile(path.join(directory, "bundle.js"), "changed")],
    ["missing", ordinary, directory => unlink(path.join(directory, "bundle.css"))],
    ["unexpected", ordinary, directory => writeFile(path.join(directory, "remote.js"), "unapproved")],
    ["relabeled", diagnostic, async directory => {
      const file = path.join(directory, "bundle-manifest.json"), manifest = JSON.parse(await readFile(file, "utf8"));
      manifest.assetOriginProbe = false; await writeFile(file, JSON.stringify(manifest));
    }],
    ["ambiguous-mode", ordinary, async directory => {
      const file = path.join(directory, "bundle-manifest.json"), manifest = JSON.parse(await readFile(file, "utf8"));
      delete manifest.assetOriginProbe; await writeFile(file, JSON.stringify(manifest));
    }],
  ];
  for (const [name, original, mutate] of mutations) {
    const source = await copyBundle(original, name), output = path.join(temporary, `${name}-evidence`);
    await observe(source, output, original);
    await writeFile(path.join(output, "native-test.log"), "preserve unrelated evidence");
    await mutate(source);
    await assert.rejects(observe(source, output, original));
    await noPassingOutput(output);
    assert.equal(await readFile(path.join(output, "native-test.log"), "utf8"), "preserve unrelated evidence");
  }
});

test("symlinked resources, manifest or WebAssets root cannot produce a passing identity", async () => {
  for (const name of ["bundle.js", "bundle-manifest.json", "root"]) {
    const target = path.join(temporary, `link-${name.replaceAll(".", "-")}`);
    if (name === "root") await symlink(ordinary, target, "dir");
    else {
      await cp(ordinary, target, { recursive: true });
      await unlink(path.join(target, name));
      await symlink(path.join(ordinary, name), path.join(target, name));
    }
    const output = `${target}-evidence`;
    await assert.rejects(observe(target, output, ordinary));
    await noPassingOutput(output);
  }
});

test("recording fails closed for unusable output and never writes into installed resources", async () => {
  const source = await copyBundle(ordinary, "output-boundary");
  const before = await readdir(source);
  await assert.rejects(observe(source, source), /outside installed WebAssets/);
  await assert.rejects(observe(source, path.join(source, "evidence")), /outside installed WebAssets/);
  assert.deepEqual(await readdir(source), before);
  const output = path.join(temporary, "blocked-output"); await mkdir(output);
  await mkdir(path.join(output, INSTALLED_WEB_MANIFEST));
  await assert.rejects(observe(source, output));
  assert.ok(!(await readdir(output)).includes(INSTALLED_WEB_IDENTITY));
});

test("CLI verification failure exits nonzero without printing its private input path", async () => {
  const source = path.join(temporary, "private-container-do-not-report");
  const output = path.join(temporary, "cli-failure-evidence");
  const run = spawnSync(process.execPath, [script, source, output, path.join(ordinary, "bundle-manifest.json")],
    { cwd: temporary, encoding: "utf8", timeout: 10_000 });
  assert.equal(run.error, undefined); assert.equal(run.status, 1);
  assert.match(run.stderr, /no passing identity record was written/);
  assert.ok(!run.stderr.includes(source)); assert.ok(!run.stdout.includes(source));
  await noPassingOutput(output);
});

test("a real child-process file-write limit cannot publish partial evidence as passed", async () => {
  const output = path.join(temporary, "limited-write-evidence");
  // Apply the limit only to this child. Reads of the valid installed fixture
  // remain unrestricted; writing its identity record exceeds the file limit.
  const run = spawnSync("bash", ["-c", 'ulimit -c 0; ulimit -f 1; exec "$@"', "tin-installed-write-limit",
    process.execPath, script, ordinary, output, path.join(ordinary, "bundle-manifest.json")],
  { cwd: temporary, encoding: "utf8", timeout: 10_000 });
  assert.equal(run.error, undefined);
  assert.notEqual(run.status, 0);
  const names = await readdir(output);
  assert.ok(!names.includes(INSTALLED_WEB_IDENTITY));
  assert.ok(!names.includes(INSTALLED_WEB_MANIFEST));
  assert.doesNotMatch(run.stdout, /Verified installed web resources/);
});

test("a different internally valid installed build cannot pass this build's identity gate", async () => {
  const source = await copyBundle(ordinary, "different-valid-build");
  const output = path.join(temporary, "different-valid-build-evidence");
  await observe(source, output, ordinary);
  const bytes = Buffer.from("/* A different internally valid ordinary bundle. */");
  await writeFile(path.join(source, "bundle.js"), bytes);
  const manifestFile = path.join(source, "bundle-manifest.json");
  const manifest = JSON.parse(await readFile(manifestFile, "utf8"));
  manifest.artifacts["bundle.js"] = { bytes: bytes.length, sha256: digest(bytes) };
  await writeFile(manifestFile, `${JSON.stringify(manifest, null, 2)}\n`);
  assert.equal((await verifyBundle(source, true)).assetOriginProbe, false);
  await assert.rejects(observe(source, output, ordinary), /differs from this build's packaging input/);
  await noPassingOutput(output);
});
