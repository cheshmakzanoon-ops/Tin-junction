import { build } from "esbuild";
import { cp, lstat, mkdir, readFile, readdir, rmdir, unlink, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const output = path.join(root, "dist/web");
export const CORE_RUNTIME_FILES = Object.freeze(["index.html", "bundle.js", "bundle.css", "bundle.js.LEGAL.txt"]);
export const PROBE_RUNTIME_FILES = Object.freeze(["probe/calibration.glb", "probe/checker.png", "probe/tone.wav", "probe/add-one.wasm", "probe/echo.worker.js", "probe/fixture-manifest.json"]);
const digest = bytes => createHash("sha256").update(bytes).digest("hex");
export const runtimeFilesForMode = probe => [...CORE_RUNTIME_FILES, ...(probe ? PROBE_RUNTIME_FILES : [])];

function manifestFiles(manifest) {
  if (manifest.formatVersion !== 1 || manifest.scriptFormat !== "iife" || !Array.isArray(manifest.externalRuntimeDependencies)
    || manifest.externalRuntimeDependencies.length !== 0 || (manifest.assetOriginProbe !== undefined && typeof manifest.assetOriginProbe !== "boolean")) throw new Error("Invalid offline bundle manifest");
  const files = runtimeFilesForMode(manifest.assetOriginProbe === true);
  if (JSON.stringify(Object.keys(manifest.artifacts ?? {}).sort()) !== JSON.stringify([...files].sort())) throw new Error("Unexpected runtime file manifest");
  return files;
}

async function inspectDirectory(directory, files, packaged) {
  const allowedFiles = new Set([...files, "bundle-manifest.json", ...(packaged ? [] : ["build-metafile.json"])]);
  const allowedDirectories = new Set(files.filter(file => file.includes("/")).map(file => file.slice(0, file.lastIndexOf("/"))));
  async function walk(relative = "") {
    for (const entry of await readdir(path.join(directory, relative), { withFileTypes: true })) {
      const name = relative ? `${relative}/${entry.name}` : entry.name;
      if (entry.isSymbolicLink()) throw new Error(`Symlinks are prohibited in bundle outputs: ${name}`);
      if (entry.isDirectory()) {
        if (!allowedDirectories.has(name)) throw new Error(`Unexpected stale bundle directory: ${name}`);
        await walk(name);
      } else if (!entry.isFile() || !allowedFiles.has(name)) throw new Error(`Unexpected stale bundle file: ${name}; review packaging before proceeding`);
    }
  }
  await walk();
}

export async function verifyBundle(directory, packaged = false) {
  if (!(await lstat(directory)).isDirectory() || (await lstat(path.join(directory, "bundle-manifest.json"))).isSymbolicLink())
    throw new Error("Bundle directory and manifest must be ordinary filesystem entries");
  const manifest = JSON.parse(await readFile(path.join(directory, "bundle-manifest.json"), "utf8"));
  const files = manifestFiles(manifest);
  await inspectDirectory(directory, files, packaged);
  for (const filename of files) {
    const bytes = await readFile(path.join(directory, filename)), entry = manifest.artifacts[filename];
    if (entry.bytes !== bytes.length || entry.sha256 !== digest(bytes)) throw new Error(`Bundle integrity failure: ${filename}`);
  }
  if (!manifest.assetOriginProbe) {
    const code = (await Promise.all(["bundle.js", "bundle.css"].map(file => readFile(path.join(directory, file), "utf8")))).join("\n");
    if (["TinJunctionAssetOriginProbe", "asset-origin-probe-panel", "Play probe tone", "probe/calibration.glb"].some(marker => code.includes(marker)))
      throw new Error("Diagnostic probe code leaked into the ordinary bundle");
  }
  return manifest;
}

/** Remove only files declared by a previously verified finite manifest. */
export async function prepareBundleDirectory(directory, nextFiles, packaged = false) {
  await mkdir(directory, { recursive: true });
  let previous;
  try { previous = await verifyBundle(directory, packaged); }
  catch (error) {
    if (error.code !== "ENOENT" || (await readdir(directory)).length !== 0) throw error;
    return;
  }
  for (const filename of manifestFiles(previous)) {
    if (!nextFiles.includes(filename)) await unlink(path.join(directory, filename));
  }
  if (previous.assetOriginProbe && !nextFiles.some(file => file.startsWith("probe/"))) await rmdir(path.join(directory, "probe"));
}

async function copyProbeFixtures(directory) {
  const fixtureRoot = path.join(root, "tests/fixtures/asset-origin");
  const manifest = JSON.parse(await readFile(path.join(fixtureRoot, "fixture-manifest.json"), "utf8"));
  const names = ["checker.png", "tone.wav", "add-one.wasm", "echo.worker.js"];
  if (manifest.formatVersion !== 1 || JSON.stringify(Object.keys(manifest.artifacts).sort()) !== JSON.stringify([...names].sort())
    || manifest.calibrationGLB.source !== "tests/fixtures/assets/calibration.glb") throw new Error("Invalid original probe fixture manifest");
  await mkdir(path.join(directory, "probe"), { recursive: true });
  for (const name of [...names, "calibration.glb"]) {
    const source = name === "calibration.glb" ? path.join(root, manifest.calibrationGLB.source) : path.join(fixtureRoot, name);
    const bytes = await readFile(source), expected = name === "calibration.glb" ? manifest.calibrationGLB : manifest.artifacts[name];
    if (bytes.length !== expected.bytes || digest(bytes) !== expected.sha256) throw new Error(`Original probe fixture integrity failure: ${name}`);
    await cp(source, path.join(directory, "probe", name));
  }
  await cp(path.join(fixtureRoot, "fixture-manifest.json"), path.join(directory, "probe/fixture-manifest.json"));
}

export async function buildWeb({ assetProbe = false, outputDirectory = output, iosDirectory = null } = {}) {
  const files = runtimeFilesForMode(assetProbe);
  await prepareBundleDirectory(outputDirectory, files);
  const result = await build({
    absWorkingDir: root, entryPoints: ["web/src/main.ts"], outfile: path.join(outputDirectory, "bundle.js"),
    bundle: true, format: "iife", target: ["es2022"], platform: "browser", sourcemap: false,
    minify: true, legalComments: "linked", metafile: true, write: true,
    define: { __TIN_ASSET_PROBE__: assetProbe ? "true" : "false" },
  });
  await cp(path.join(root, "web/packaged.html"), path.join(outputDirectory, "index.html"));
  if (assetProbe) await copyProbeFixtures(outputDirectory);
  const artifacts = {};
  for (const filename of files) {
    const bytes = await readFile(path.join(outputDirectory, filename));
    artifacts[filename] = { bytes: bytes.length, sha256: digest(bytes) };
  }
  const manifest = { formatVersion: 1, kind: "first-operating-workbench-not-production-art", bundler: "esbuild",
    scriptFormat: "iife", externalRuntimeDependencies: [], assetOriginProbe: assetProbe, artifacts };
  await writeFile(path.join(outputDirectory, "bundle-manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  await writeFile(path.join(outputDirectory, "build-metafile.json"), `${JSON.stringify(result.metafile, null, 2)}\n`);
  for (const item of Object.values(result.metafile.outputs)) if (item.imports.some(dependency => dependency.external)) throw new Error("Runtime external import is prohibited");
  if (!assetProbe && Object.keys(result.metafile.inputs).some(input => input.endsWith("diagnostics/assetProbe.ts")))
    throw new Error("Probe implementation was not eliminated from the ordinary bundle");
  await verifyBundle(outputDirectory);
  if (iosDirectory) {
    await prepareBundleDirectory(iosDirectory, files, true);
    for (const filename of [...files, "bundle-manifest.json"]) {
      await mkdir(path.dirname(path.join(iosDirectory, filename)), { recursive: true });
      await cp(path.join(outputDirectory, filename), path.join(iosDirectory, filename));
    }
    await verifyBundle(iosDirectory, true);
  }
  return manifest;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv.includes("--check")) {
    await verifyBundle(output);
    console.log("Verified bundle allowlist, byte counts, SHA-256 hashes and ordinary-build probe exclusion.");
  } else {
    const assetProbe = process.argv.includes("--asset-probe");
    await buildWeb({ assetProbe, iosDirectory: process.argv.includes("--ios") ? path.join(root, "apps/ios/TinJunction/Resources/WebAssets") : null });
    console.log(assetProbe ? "Bundled explicit asset-origin diagnostics; actual WKWebView evidence remains required."
      : "Built the offline workbench with all asset-origin diagnostic code, controls and fixtures excluded.");
  }
}
