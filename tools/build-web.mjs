import { build } from "esbuild";
import { cp, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const output = path.join(root, "dist/web");
const runtimeFiles = ["index.html", "bundle.js", "bundle.css", "bundle.js.LEGAL.txt"];

async function verify(directory, packaged = false) {
  const manifest = JSON.parse(await readFile(path.join(directory, "bundle-manifest.json"), "utf8"));
  if (manifest.formatVersion !== 1 || manifest.scriptFormat !== "iife" || manifest.externalRuntimeDependencies.length !== 0) throw new Error("Invalid offline bundle manifest");
  if (JSON.stringify(Object.keys(manifest.artifacts).sort()) !== JSON.stringify([...runtimeFiles].sort())) throw new Error("Unexpected runtime file manifest");
  const allowedFiles = new Set([...runtimeFiles, "bundle-manifest.json", ...(packaged ? [] : ["build-metafile.json"])]);
  for (const filename of await readdir(directory)) {
    if (!allowedFiles.has(filename)) throw new Error(`Unexpected stale bundle file: ${filename}; review packaging before proceeding`);
  }
  for (const filename of runtimeFiles) {
    const bytes = await readFile(path.join(directory, filename));
    const entry = manifest.artifacts[filename];
    if (entry.bytes !== bytes.length || entry.sha256 !== createHash("sha256").update(bytes).digest("hex")) throw new Error(`Bundle integrity failure: ${filename}`);
  }
}

async function buildWeb() {
await mkdir(output, { recursive: true });
const result = await build({
  absWorkingDir: root,
  entryPoints: ["web/src/main.ts"],
  outfile: "dist/web/bundle.js",
  bundle: true,
  format: "iife",
  target: ["es2022"],
  platform: "browser",
  sourcemap: false,
  minify: true,
  legalComments: "linked",
  metafile: true,
  write: true,
});
await cp(path.join(root, "web/packaged.html"), path.join(output, "index.html"));
const artifacts = {};
for (const filename of runtimeFiles) {
  const bytes = await readFile(path.join(output, filename));
  artifacts[filename] = { bytes: bytes.length, sha256: createHash("sha256").update(bytes).digest("hex") };
}
const manifest = {
  formatVersion: 1,
  kind: "first-operating-workbench-not-production-art",
  bundler: "esbuild",
  scriptFormat: "iife",
  externalRuntimeDependencies: [],
  artifacts,
};
await writeFile(path.join(output, "bundle-manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
await writeFile(path.join(output, "build-metafile.json"), `${JSON.stringify(result.metafile, null, 2)}\n`);
for (const item of Object.values(result.metafile.outputs)) {
  if (item.imports.some((dependency) => dependency.external)) throw new Error("Runtime external import is prohibited");
}
if (process.argv.includes("--ios")) {
  const target = path.join(root, "apps/ios/TinJunction/Resources/WebAssets");
  await mkdir(target, { recursive: true });
  for (const filename of [...Object.keys(artifacts), "bundle-manifest.json"]) {
    await cp(path.join(output, filename), path.join(target, filename));
  }
  await verify(target, true);
  console.log("Bundled offline IIFE resources for the Swift WebView; native runtime verification remains required.");
} else {
  console.log("Built the offline operating workbench. Procedural art and browser captures are not final art or physical-device performance evidence.");
}
await verify(output);
}

if (process.argv.includes("--check")) {
  await verify(output);
  console.log("Verified bundle file allowlist, byte counts and SHA-256 hashes.");
} else {
  await buildWeb();
}
