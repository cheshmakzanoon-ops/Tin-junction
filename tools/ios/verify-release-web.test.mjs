import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { cp, mkdtemp, readFile, rm, symlink, unlink, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { buildWeb } from "../build-web.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const script = path.join(root, "tools/ios/verify-release-web.py");
let temporary, ordinary, diagnostic;
before(async () => {
  temporary = await mkdtemp(path.join(tmpdir(), "tin-release-guard-"));
  ordinary = path.join(temporary, "ordinary"); diagnostic = path.join(temporary, "diagnostic");
  await buildWeb({ outputDirectory: path.join(temporary, "ordinary-build"), iosDirectory: ordinary });
  await buildWeb({ assetProbe: true, outputDirectory: path.join(temporary, "diagnostic-build"), iosDirectory: diagnostic });
});
after(async () => { if (temporary) await rm(temporary, { recursive: true, force: true }); });
function check(directory, configuration = "Release") {
  const result = spawnSync("/usr/bin/python3", [script, "--configuration", configuration, "--assets", directory], { encoding: "utf8" });
  if (result.error) throw result.error;
  return result;
}
async function copyOrdinary(name) { const target = path.join(temporary, name); await cp(ordinary, target, { recursive: true }); return target; }
async function rewriteManifest(directory, change) {
  const file = path.join(directory, "bundle-manifest.json"), manifest = JSON.parse(await readFile(file, "utf8"));
  change(manifest); await writeFile(file, JSON.stringify(manifest));
}

test("ordinary assets pass Release while a leftover opt-in diagnostic bundle fails with a rebuild instruction", () => {
  assert.equal(check(ordinary).status, 0);
  const rejected = check(diagnostic);
  assert.equal(rejected.status, 1);
  assert.match(rejected.stderr, /npm run bundle:ios without --asset-probe/);
  assert.equal(check(diagnostic, "Debug").status, 0, "The explicit full DEBUG probe remains available.");
});

test("missing, unknown and falsely relabeled resources cannot enter a Release archive", async () => {
  assert.equal(check(path.join(temporary, "missing")).status, 1);
  assert.equal(check(ordinary, "Unknown").status, 1);
  const relabeled = path.join(temporary, "relabeled"); await cp(diagnostic, relabeled, { recursive: true });
  await rewriteManifest(relabeled, manifest => { manifest.assetOriginProbe = false; });
  assert.equal(check(relabeled).status, 1);
  const noFlag = await copyOrdinary("no-flag");
  await rewriteManifest(noFlag, manifest => { delete manifest.assetOriginProbe; });
  assert.equal(check(noFlag).status, 1);
});

test("Release verifies actual file bytes and rejects diagnostic JS/CSS even if someone updates its checksum", async () => {
  const corrupt = await copyOrdinary("corrupt");
  await writeFile(path.join(corrupt, "bundle.js"), "corrupt");
  assert.equal(check(corrupt).status, 1);
  for (const [name, marker] of [["bundle.js", "TinJunctionAssetOriginProbe"], ["bundle.css", "asset-origin-probe-panel"]]) {
    const directory = await copyOrdinary(name.replaceAll(".", "-"));
    const file = path.join(directory, name);
    const bytes = Buffer.concat([await readFile(file), Buffer.from(`\n/* ${marker} */\n`)]);
    await writeFile(file, bytes);
    await rewriteManifest(directory, manifest => { manifest.artifacts[name] = { bytes: bytes.length, sha256: createHash("sha256").update(bytes).digest("hex") }; });
    const rejected = check(directory);
    assert.equal(rejected.status, 1);
    assert.match(rejected.stderr, /Diagnostic implementation or controls remain/);
  }
});

test("Release rejects symlinks and project wiring enforces the guard before resources are copied", async () => {
  const linked = await copyOrdinary("linked");
  await unlink(path.join(linked, "bundle.js"));
  await symlink(path.join(ordinary, "bundle.js"), path.join(linked, "bundle.js"));
  assert.equal(check(linked).status, 1);
  const project = await readFile(path.join(root, "apps/ios/project.yml"), "utf8");
  assert.match(project, /preBuildScripts:\s*- name: Verify ordinary resources before Release/);
  assert.match(project, /\/usr\/bin\/python3 "\$\{SRCROOT\}\/\.\.\/\.\.\/tools\/ios\/verify-release-web\.py" --configuration "\$\{CONFIGURATION\}"/);
  assert.match(project, /basedOnDependencyAnalysis: false/);
  assert.match(project, /\$\(SRCROOT\)\/TinJunction\/Resources\/WebAssets/);
});
