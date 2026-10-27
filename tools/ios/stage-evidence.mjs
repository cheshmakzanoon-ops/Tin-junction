#!/usr/bin/env node
import { createHash } from "node:crypto";
import { constants } from "node:fs";
import { lstat, mkdir, open, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const REPORT = /\.(?:txt|json|log)$/i;
const PNG = /\.png$/i;
const MAXIMUMS = Object.freeze({ packageBytes: 128 * 1024 * 1024, fileBytes: 64 * 1024 * 1024,
  entries: 2048, manifestBytes: 2 * 1024 * 1024 });
export const REVIEW_INDEX = "_review/index.json";
const sha256 = bytes => createHash("sha256").update(bytes).digest("hex");
const inside = (parent, child) => child === parent || child.startsWith(`${parent}${path.sep}`);
const ordinaryName = name => typeof name === "string" && /^[A-Za-z0-9][A-Za-z0-9._-]{0,254}$/.test(name);

async function ordinaryDirectory(directory) {
  // Check every component, including caller-supplied ancestors. The workflow
  // uses the module's physical checkout path; no source/output links are followed.
  const absolute = path.resolve(directory);
  let current = path.parse(absolute).root;
  for (const part of absolute.slice(current.length).split(path.sep).filter(Boolean)) {
    current = path.join(current, part);
    const info = await lstat(current);
    if (!info.isDirectory() || info.isSymbolicLink()) throw new Error("unsafe-directory");
  }
  return absolute;
}

async function readBounded(file, expected, maximum) {
  const handle = await open(file, constants.O_RDONLY | constants.O_NOFOLLOW);
  try {
    const before = await handle.stat();
    if (!before.isFile() || before.size !== expected || expected > maximum) throw new Error("source-changed");
    const bytes = Buffer.alloc(expected + 1);
    let length = 0;
    while (length < bytes.length) {
      const result = await handle.read(bytes, length, Math.min(65_536, bytes.length - length), null);
      if (result.bytesRead === 0) break;
      length += result.bytesRead;
    }
    const after = await handle.stat();
    if (length !== expected || after.size !== expected || after.mtimeMs !== before.mtimeMs)
      throw new Error("source-changed");
    return bytes.subarray(0, length);
  } finally { await handle.close(); }
}

async function writeNew(file, bytes) {
  await mkdir(path.dirname(file), { recursive: true });
  await ordinaryDirectory(path.dirname(file));
  const handle = await open(file, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW, 0o644);
  try { await handle.writeFile(bytes); }
  finally { await handle.close(); }
}

/** Copy reviewable evidence without changing test results or original artifacts. */
export async function stageEvidence({ sourceDirectory, outputDirectory, context, limits = {} }) {
  const source = path.resolve(sourceDirectory), output = path.resolve(outputDirectory);
  if (inside(source, output) || inside(output, source)) throw new Error("Evidence source and output must not overlap.");
  if (Object.keys(limits).some(name => !Object.hasOwn(MAXIMUMS, name))) throw new Error("Unknown evidence limit.");
  const bound = { ...MAXIMUMS, ...limits };
  for (const [name, maximum] of Object.entries(MAXIMUMS)) {
    if (!Number.isSafeInteger(bound[name]) || bound[name] < 1 || bound[name] > maximum)
      throw new Error("Evidence limits may only reduce the fixed maximums.");
  }
  if (!/^[0-9a-f]{40}$/.test(context?.testedCommit ?? "")) throw new Error("A full tested Git SHA is required.");
  for (const name of ["runId", "runAttempt"])
    if (!/^[0-9]{1,20}$/.test(context[name] ?? "")) throw new Error("A bounded workflow run identity is required.");
  const outcomes = Object.fromEntries(["nativeTests", "installedWeb", "cleanInstall"].map(name =>
    [name, ["success", "failure", "cancelled", "skipped"].includes(context[name]) ? context[name] : "unknown"]));
  await ordinaryDirectory(path.dirname(output));
  // A fresh destination prevents stale passing indices or captures from a prior
  // invocation from being included in this run. Existing paths are never erased.
  await mkdir(output);
  for (const name of ["reports", "captures"]) await mkdir(path.join(output, name));
  const indexReserve = Math.min(4 * 1024 * 1024, Math.floor(bound.packageBytes / 4));
  const dataBudget = bound.packageBytes - indexReserve;
  const files = [], excluded = [], issues = [], planned = new Map(), manifests = new Set(), cleanDirectories = new Set();
  const opaqueCandidates = new Map(), referencedOpaque = new Set();
  const totals = { reports: 0, captures: 0 };
  const allocated = { reports: 0, captures: 0 };
  const index = { formatVersion: 1, kind: "native-evidence-review-packaging", stagingResult: "incomplete",
    createdAt: new Date().toISOString(), testedCommit: context.testedCommit, runId: context.runId,
    runAttempt: context.runAttempt, stepOutcomes: outcomes, limits: bound, files, excluded, issues,
    limitations: ["Packaging status is not a native test, installed-resource or clean-install result.",
      "Files are original byte copies; no screenshot conversion, result synthesis or failure-only filtering is performed.",
      "Manifest-associated extensionless attachments are retained as opaque bytes, without decoding or execution.",
      "Original inputs are untouched. The separate full-artifact upload retains xcresult and media; this helper does not verify that upload."] };
  let entries = 0, exhausted = false;
  const issue = (code, relative, extra = {}) => issues.push({ code, path: relative, ...extra });
  async function scan(relative, mode, depth = 0) {
    const directory = path.join(source, relative);
    let children;
    try { await ordinaryDirectory(directory); children = await readdir(directory, { withFileTypes: true }); }
    catch { issue("missing-or-unsafe-directory", relative || "."); return; }
    for (const child of children.sort((a, b) => a.name.localeCompare(b.name))) {
      if (exhausted) break;
      if (++entries > bound.entries) { issue("entry-count-limit", relative || "."); exhausted = true; break; }
      const entry = relative ? `${relative}/${child.name}` : child.name;
      if (!ordinaryName(child.name) || entry.length > 512) { issue("unsafe-entry-name", relative || "."); continue; }
      if (child.isSymbolicLink()) { issue("symlink-rejected", entry); continue; }
      if (child.isDirectory()) {
        if (child.name.endsWith(".xcresult")) excluded.push({ path: entry, reason: "original-result-bundle" });
        else if (child.name === "screenshots" && mode !== "attachments") {
          manifests.add(`${entry}/manifest.json`);
          await scan(entry, "attachments", depth + 1);
        } else if (mode === "root" && /^clean-install-[A-Za-z0-9_-]+$/.test(child.name)) {
          cleanDirectories.add(entry);
          await scan(entry, "clean", depth + 1);
        } else if (mode === "clean" && depth < 4) await scan(entry, "clean", depth + 1);
        else excluded.push({ path: entry, reason: "outside-review-scope" });
        continue;
      }
      if (!child.isFile()) { issue("nonregular-entry", entry); continue; }
      const category = REPORT.test(child.name) ? "reports" : mode === "attachments" && PNG.test(child.name) ? "captures" : null;
      const opaque = mode === "attachments" && path.posix.extname(child.name) === "";
      if (!category && !opaque) { excluded.push({ path: entry, reason: "original-media-or-other-attachment" }); continue; }
      try {
        const info = await lstat(path.join(source, entry));
        if (!info.isFile() || info.isSymbolicLink()) throw new Error();
        if (opaque) opaqueCandidates.set(entry, { category: "reports", bytes: info.size, opaque: true });
        else planned.set(entry, { category, bytes: info.size });
      } catch { issue("missing-or-unsafe-file", entry); }
    }
  }
  await scan("", "root");
  const required = ["macos-version.txt", "xcode-version.txt", "sdks.txt", "simulator-inventory.json",
    "selected-simulator.json", "packaged-web-input-manifest.json", "xcodebuild.log", "screenshots/manifest.json"];
  if (outcomes.installedWeb === "success") required.push("installed-web-manifest.json", "installed-web-identity.json");
  for (const directory of cleanDirectories) required.push(`${directory}/verification.json`);
  const cleanRoots = [...planned.keys()].filter(name => /^clean-install-[^/]+\/verification\.json$/.test(name));
  if (outcomes.cleanInstall === "success" && cleanRoots.length !== 1) issue("missing-or-ambiguous-clean-install-record", ".");
  for (const relative of planned.keys()) {
    if (/^clean-install-[^/]+\/xcodebuild-clean-install\.log$/.test(relative))
      required.push(`${relative.split("/")[0]}/screenshots/manifest.json`);
  }
  for (const relative of new Set(required)) if (!planned.has(relative)) issue("required-file-missing", relative);
  const manifestBytes = new Map();
  async function copyInput(relative, input) {
    const maximum = manifests.has(relative) ? Math.min(bound.fileBytes, bound.manifestBytes) : bound.fileBytes;
    if (input.bytes > maximum) { issue("file-size-limit", relative, { bytes: input.bytes }); return false; }
    if (allocated[input.category] + input.bytes > dataBudget) { issue("package-size-limit", relative, { bytes: input.bytes }); return false; }
    // Account for a possible partial write even when copying later fails.
    allocated[input.category] += input.bytes;
    try {
      const bytes = await readBounded(path.join(source, relative), input.bytes, maximum);
      await writeNew(path.join(output, input.category, relative), bytes);
      totals[input.category] += bytes.length;
      files.push({ path: relative, package: input.category, bytes: bytes.length, sha256: sha256(bytes),
        ...(input.opaque ? { content: "opaque-exported-attachment" } : {}) });
      if (manifests.has(relative)) manifestBytes.set(relative, bytes);
      return true;
    } catch { issue("copy-failed-or-source-changed", relative); return false; }
  }
  for (const [relative, input] of [...planned].sort(([a], [b]) => a.localeCompare(b))) await copyInput(relative, input);
  const copied = new Set(files.map(file => file.path));
  for (const manifest of manifests) {
    if (!manifestBytes.has(manifest)) { issue("attachment-manifest-unavailable", manifest); continue; }
    try {
      const tests = JSON.parse(manifestBytes.get(manifest).toString("utf8"));
      if (!Array.isArray(tests)) throw new Error();
      const referenced = new Set();
      let count = 0;
      for (const test of tests) {
        if (!test || typeof test.testIdentifier !== "string" || test.testIdentifier.length === 0
          || !Array.isArray(test.attachments)) throw new Error();
        for (const attachment of test.attachments) {
          if (++count > bound.entries || !attachment || !ordinaryName(attachment.exportedFileName ?? "")) throw new Error();
          referenced.add(attachment.exportedFileName);
        }
      }
      const prefix = `${path.posix.dirname(manifest)}/`;
      for (const name of referenced) {
        const relative = `${prefix}${name}`, opaque = path.posix.extname(name) === "";
        if (opaque && opaqueCandidates.has(relative)) {
          referencedOpaque.add(relative);
          if (await copyInput(relative, opaqueCandidates.get(relative))) copied.add(relative);
        }
        if ((REPORT.test(name) || PNG.test(name) || opaque) && !copied.has(relative))
          issue("referenced-review-attachment-missing", relative);
      }
      for (const relative of copied) if (relative.startsWith(prefix) && relative !== manifest && !referenced.has(relative.slice(prefix.length)))
        issue("review-attachment-not-in-manifest", relative);
    } catch { issue("malformed-attachment-manifest", manifest); }
  }
  for (const relative of opaqueCandidates.keys()) if (!referencedOpaque.has(relative))
    excluded.push({ path: relative, reason: "opaque-attachment-without-valid-manifest-association" });
  index.stagingResult = issues.length === 0 ? "complete" : "incomplete";
  index.copiedBytes = totals;
  let bytes = Buffer.from(`${JSON.stringify(index, null, 2)}\n`);
  if (bytes.length > indexReserve) {
    // Keep an explicit bounded failure record instead of losing the whole upload
    // to an unexpectedly large index. The staged originals remain available.
    issue("index-size-limit", "index.json", { bytes: bytes.length });
    index.stagingResult = "incomplete";
    bytes = Buffer.from(`${JSON.stringify({ formatVersion: 1, kind: index.kind, stagingResult: "incomplete",
      testedCommit: context.testedCommit, runId: context.runId, runAttempt: context.runAttempt,
      issues: [{ code: "index-size-limit", path: "index.json" }], omittedIndexEntries: files.length + excluded.length,
      copiedBytes: totals, limits: bound }, null, 2)}\n`);
  }
  if (bytes.length > indexReserve) throw new Error("Evidence index cannot fit within the configured bound.");
  for (const category of ["reports", "captures"]) await writeNew(path.join(output, category, REVIEW_INDEX), bytes);
  return index;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv.length !== 2) {
    console.error("This fixed evidence staging command accepts no arguments."); process.exitCode = 2;
  } else {
    try {
      const result = await stageEvidence({ sourceDirectory: path.join(ROOT, "artifacts/ios"),
        outputDirectory: path.join(ROOT, "artifacts/ios-review"), context: {
          testedCommit: process.env.GITHUB_SHA, runId: process.env.GITHUB_RUN_ID, runAttempt: process.env.GITHUB_RUN_ATTEMPT,
          nativeTests: process.env.TIN_NATIVE_TEST_OUTCOME, installedWeb: process.env.TIN_INSTALLED_WEB_OUTCOME,
          cleanInstall: process.env.TIN_CLEAN_INSTALL_OUTCOME } });
      console.log(`Native review evidence staging ${result.stagingResult}: ${result.files.length} copied files, ${result.issues.length} issues.`);
      if (result.stagingResult !== "complete") process.exitCode = 1;
    } catch {
      console.error("Native evidence staging failed; inspect available staged indices and the unchanged original artifact.");
      process.exitCode = 1;
    }
  }
}
