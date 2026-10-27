import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { mkdtemp, mkdir, readFile, readdir, realpath, rename, rm, symlink, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { tmpdir } from "node:os";
import { REVIEW_INDEX, stageEvidence } from "./stage-evidence.mjs";

const sha256 = bytes => createHash("sha256").update(bytes).digest("hex");
const context = { testedCommit: "0".repeat(40), runId: "1234", runAttempt: "1",
  nativeTests: "failure", installedWeb: "skipped", cleanInstall: "skipped" };
async function put(root, relative, content) {
  const file = path.join(root, relative); await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, content);
}
async function fixture(t) {
  const temporary = await realpath(await mkdtemp(path.join(tmpdir(), "tin-review-evidence-")));
  t.after(() => rm(temporary, { recursive: true, force: true }));
  const source = path.join(temporary, "source"), output = path.join(temporary, "review");
  await mkdir(source);
  for (const name of ["macos-version.txt", "xcode-version.txt", "sdks.txt", "xcodebuild.log"])
    await put(source, name, "Original native output.\n");
  for (const name of ["simulator-inventory.json", "selected-simulator.json", "packaged-web-input-manifest.json"])
    await put(source, name, "{\"fixture\":true}\n");
  const manifest = [{ testIdentifier: "HostStartupUITests/example()", attachments: [
    { exportedFileName: "capture.png", suggestedHumanReadableName: "failure-state", isAssociatedWithFailure: false },
    { exportedFileName: "observation.txt", suggestedHumanReadableName: "asset-origin-observation", isAssociatedWithFailure: false },
    { exportedFileName: "observation.json" }, { exportedFileName: "recording.mp4" }, { exportedFileName: "snapshot" },
  ] }];
  await put(source, "screenshots/manifest.json", `${JSON.stringify(manifest)}\n`);
  await put(source, "screenshots/capture.png", Buffer.from([137, 80, 78, 71, 0, 255, 10]));
  await put(source, "screenshots/observation.txt", "{\"stage\":\"failed\"}\n");
  await put(source, "screenshots/observation.json", "{\"originalObservation\":true}\n");
  await put(source, "screenshots/recording.mp4", "original media fixture");
  await put(source, "screenshots/snapshot", "original binary snapshot fixture");
  await put(source, "Full.xcresult/Data/original", "complete original result fixture");
  return { source, output, temporary, run: (options = {}) => stageEvidence({ sourceDirectory: source, outputDirectory: output, context, ...options }) };
}
async function fileIdentities(root, relative = "") {
  const result = {};
  for (const entry of await readdir(path.join(root, relative), { withFileTypes: true })) {
    const name = relative ? `${relative}/${entry.name}` : entry.name;
    if (entry.isDirectory()) Object.assign(result, await fileIdentities(root, name));
    else { const bytes = await readFile(path.join(root, name)); result[name] = { bytes: bytes.length, sha256: sha256(bytes) }; }
  }
  return result;
}
const readIndex = output => readFile(path.join(output, "reports", REVIEW_INDEX), "utf8").then(JSON.parse);

test("copies original full and clean-install reports/PNGs and leaves complete inputs untouched", async t => {
  const f = await fixture(t);
  await put(f.source, "screenshots/unlisted-snapshot", "This has no manifest association.");
  const clean = "clean-install-ABC123";
  await put(f.source, `${clean}/verification.json`, "{\"result\":\"failed\",\"phase\":\"asset-origin-test\"}\n");
  await put(f.source, `${clean}/xcodebuild-clean-install.log`, "Original clean-install failure.\n");
  for (const phase of ["before-reset", "after-reinstall", "after-test"])
    await put(f.source, `${clean}/${phase}/installed-web-identity.json`, "{\"originalIdentity\":true}\n");
  for (const name of ["manifest.json", "capture.png", "observation.txt", "observation.json", "recording.mp4", "snapshot"])
    await put(f.source, `${clean}/screenshots/${name}`, await readFile(path.join(f.source, "screenshots", name)));
  await put(f.source, `${clean}/CleanInstall.xcresult/Data/original`, "original clean result");
  const before = await fileIdentities(f.source), result = await f.run();
  assert.equal(result.stagingResult, "complete"); assert.deepEqual(result.issues, []);
  assert.equal(result.stepOutcomes.nativeTests, "failure", "Complete packaging never rewrites the native outcome.");
  assert.deepEqual(await fileIdentities(f.source), before);
  for (const file of result.files) {
    const original = await readFile(path.join(f.source, file.path));
    assert.deepEqual(await readFile(path.join(f.output, file.package, file.path)), original);
    assert.deepEqual({ bytes: file.bytes, sha256: file.sha256 }, before[file.path]);
  }
  assert.ok(result.files.some(file => file.path === "screenshots/observation.txt"));
  assert.ok(result.files.some(file => file.path === `${clean}/screenshots/capture.png`));
  for (const file of ["screenshots/snapshot", `${clean}/screenshots/snapshot`])
    assert.ok(result.files.some(item => item.path === file && item.package === "reports" && item.content === "opaque-exported-attachment"));
  assert.ok(result.files.every(file => file.path !== "screenshots/unlisted-snapshot"));
  assert.ok(result.excluded.some(file => file.path === "screenshots/unlisted-snapshot"
    && file.reason === "opaque-attachment-without-valid-manifest-association"));
  assert.ok(result.excluded.some(file => file.path === `${clean}/CleanInstall.xcresult`));
  assert.ok(result.excluded.some(file => file.path === "screenshots/recording.mp4"));
  assert.ok(result.files.every(file => !file.path.includes(".xcresult/") && !file.path.endsWith(".mp4")));
  assert.equal(JSON.stringify(result).includes(f.temporary), false, "Indices contain only relative evidence paths.");
  assert.deepEqual(await readIndex(f.output), result);
  assert.deepEqual(await readFile(path.join(f.output, "reports", REVIEW_INDEX)), await readFile(path.join(f.output, "captures", REVIEW_INDEX)));
});

test("missing attachments and malformed manifests leave explicit incomplete indices and available originals", async t => {
  await t.test("referenced original is missing", async sub => {
    const f = await fixture(sub); await unlink(path.join(f.source, "screenshots/capture.png"));
    const result = await f.run();
    assert.equal(result.stagingResult, "incomplete");
    assert.ok(result.issues.some(issue => issue.code === "referenced-review-attachment-missing"));
    assert.ok(result.files.some(file => file.path === "xcodebuild.log"));
    assert.equal((await readIndex(f.output)).stagingResult, "incomplete");
  });
  await t.test("manifest is malformed", async sub => {
    const f = await fixture(sub); const malformed = "{ invalid original JSON\n";
    await writeFile(path.join(f.source, "screenshots/manifest.json"), malformed);
    const result = await f.run();
    assert.ok(result.issues.some(issue => issue.code === "malformed-attachment-manifest"));
    assert.equal(await readFile(path.join(f.output, "reports/screenshots/manifest.json"), "utf8"), malformed);
    assert.ok(result.files.some(file => file.path === "screenshots/capture.png"));
    assert.ok(result.files.every(file => file.path !== "screenshots/snapshot"));
  });
  await t.test("manifest-associated opaque original is missing", async sub => {
    const f = await fixture(sub); await unlink(path.join(f.source, "screenshots/snapshot"));
    const result = await f.run();
    assert.equal(result.stagingResult, "incomplete");
    assert.ok(result.issues.some(issue => issue.code === "referenced-review-attachment-missing" && issue.path === "screenshots/snapshot"));
  });
  await t.test("clean invocation lacks its export", async sub => {
    const f = await fixture(sub);
    await put(f.source, "clean-install-ABC123/verification.json", "{\"result\":\"failed\"}");
    await put(f.source, "clean-install-ABC123/xcodebuild-clean-install.log", "native failed");
    const result = await f.run();
    assert.ok(result.issues.some(issue => issue.path === "clean-install-ABC123/screenshots/manifest.json"));
    assert.equal(result.stagingResult, "incomplete");
  });
});

test("file, aggregate and entry limits cannot publish complete or oversized review packages", async t => {
  for (const [name, limits, input, expected] of [
    ["file", { fileBytes: 65_536 }, { "oversized.log": Buffer.alloc(65_537) }, "file-size-limit"],
    ["opaque file", { fileBytes: 65_536 }, { "screenshots/snapshot": Buffer.alloc(65_537) }, "file-size-limit"],
    ["aggregate", { packageBytes: 65_536 }, { "large-a.log": Buffer.alloc(32_768), "large-b.log": Buffer.alloc(32_768) }, "package-size-limit"],
    ["entries", { entries: 3 }, {}, "entry-count-limit"],
  ]) await t.test(name, async sub => {
    const f = await fixture(sub);
    for (const [file, bytes] of Object.entries(input)) await put(f.source, file, bytes);
    const result = await f.run({ limits });
    assert.equal(result.stagingResult, "incomplete");
    assert.ok(result.issues.some(issue => issue.code === expected));
    for (const category of ["reports", "captures"]) {
      const copied = await fileIdentities(path.join(f.output, category));
      assert.ok(Object.values(copied).reduce((sum, file) => sum + file.bytes, 0) <= (limits.packageBytes ?? 128 * 1024 * 1024));
    }
  });
});

test("symlinks, overlapping destinations and stale outputs cannot be followed or overwritten", async t => {
  const f = await fixture(t);
  const secret = path.join(f.temporary, "outside.txt"); await writeFile(secret, "must not be copied");
  await symlink(secret, path.join(f.source, "linked.txt"));
  const result = await f.run();
  assert.equal(result.stagingResult, "incomplete");
  assert.ok(result.issues.some(issue => issue.code === "symlink-rejected"));
  assert.ok(result.files.every(file => file.path !== "linked.txt"));
  await assert.rejects(f.run(), /EEXIST/);
  await assert.rejects(f.run({ outputDirectory: path.join(f.source, "review") }), /must not overlap/);
  const link = path.join(f.temporary, "linked-output"); await symlink(f.output, link, "dir");
  await assert.rejects(f.run({ outputDirectory: link }));
  const before = await readIndex(f.output);
  assert.deepEqual(before, result);
  assert.equal(await readFile(secret, "utf8"), "must not be copied");
});

test("unsafe manifest filenames and missing successful-step inputs stay incomplete", async t => {
  const f = await fixture(t);
  await writeFile(path.join(f.source, "screenshots/manifest.json"), JSON.stringify([
    { testIdentifier: "fixture()", attachments: [{ exportedFileName: "../outside.txt" }] },
  ]));
  const result = await f.run({ context: { ...context, installedWeb: "success", cleanInstall: "success" } });
  assert.equal(result.stagingResult, "incomplete");
  assert.ok(result.issues.some(issue => issue.code === "malformed-attachment-manifest"));
  assert.ok(result.issues.some(issue => issue.path === "installed-web-identity.json"));
  assert.ok(result.issues.some(issue => issue.code === "missing-or-ambiguous-clean-install-record"));
});

test("the workflow command exits nonzero while preserving readable incomplete packages", async t => {
  const f = await fixture(t);
  await unlink(path.join(f.source, "screenshots/capture.png"));
  await mkdir(path.join(f.temporary, "artifacts"));
  await rename(f.source, path.join(f.temporary, "artifacts/ios"));
  await put(f.temporary, "tools/ios/stage-evidence.mjs", await readFile(new URL("./stage-evidence.mjs", import.meta.url)));
  const result = spawnSync(process.execPath, [path.join(f.temporary, "tools/ios/stage-evidence.mjs")],
    { encoding: "utf8", timeout: 10_000, env: { ...process.env, GITHUB_SHA: context.testedCommit,
      GITHUB_RUN_ID: context.runId, GITHUB_RUN_ATTEMPT: context.runAttempt, TIN_NATIVE_TEST_OUTCOME: "failure",
      TIN_INSTALLED_WEB_OUTCOME: "skipped", TIN_CLEAN_INSTALL_OUTCOME: "skipped" } });
  assert.equal(result.error, undefined); assert.equal(result.status, 1);
  assert.match(result.stdout, /staging incomplete/);
  const index = await readIndex(path.join(f.temporary, "artifacts/ios-review"));
  assert.equal(index.stagingResult, "incomplete");
  assert.ok(index.issues.some(issue => issue.code === "referenced-review-attachment-missing"));
  assert.ok(index.files.some(file => file.path === "xcodebuild.log"));
});
