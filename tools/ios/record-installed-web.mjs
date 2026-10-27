import { createHash, randomUUID } from "node:crypto";
import { lstat, mkdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runtimeFilesForMode, verifyBundle } from "../build-web.mjs";

const digest = bytes => createHash("sha256").update(bytes).digest("hex");
export const INSTALLED_WEB_MANIFEST = "installed-web-manifest.json";
export const INSTALLED_WEB_IDENTITY = "installed-web-identity.json";

async function removeOwnedFile(file) {
  try { await unlink(file); }
  catch (error) { if (error.code !== "ENOENT") throw error; }
}

/** The workflow resolves this input from the actual installed app via simctl. */
export async function recordInstalledWeb(directory, outputDirectory, expectedManifestFile) {
  const input = path.resolve(directory), output = path.resolve(outputDirectory);
  if (output === input || output.startsWith(`${input}${path.sep}`))
    throw new Error("Evidence must be written outside installed WebAssets");
  await mkdir(output, { recursive: true });
  if (!(await lstat(output)).isDirectory()) throw new Error("Evidence output must be an ordinary directory");

  const manifestOutput = path.join(output, INSTALLED_WEB_MANIFEST);
  const identityOutput = path.join(output, INSTALLED_WEB_IDENTITY);
  // A failed repeated observation must never leave a previous passing report.
  // Only these two owned evidence files are removed; other test artifacts stay.
  await removeOwnedFile(identityOutput);
  await removeOwnedFile(manifestOutput);
  const suffix = randomUUID();
  const temporaryManifest = path.join(output, `.installed-web-manifest-${suffix}.tmp`);
  const temporaryIdentity = path.join(output, `.installed-web-identity-${suffix}.tmp`);
  try {
    if (!(await lstat(expectedManifestFile)).isFile()) throw new Error("Packaging input manifest must be an ordinary file");
    const expectedManifest = await readFile(expectedManifestFile);
    const manifestFile = path.join(input, "bundle-manifest.json");
    const before = await readFile(manifestFile);
    const verified = await verifyBundle(input, true);
    if (typeof verified.assetOriginProbe !== "boolean") throw new Error("Installed bundle mode must be explicit");
    const artifacts = {};
    for (const filename of runtimeFilesForMode(verified.assetOriginProbe)) {
      const bytes = await readFile(path.join(input, filename));
      const observed = { bytes: bytes.length, sha256: digest(bytes) };
      const expected = verified.artifacts[filename];
      if (observed.bytes !== expected.bytes || observed.sha256 !== expected.sha256)
        throw new Error(`Installed resource changed during observation: ${filename}`);
      artifacts[filename] = observed;
    }
    if (!before.equals(await readFile(manifestFile))) throw new Error("Installed manifest changed during observation");
    if (!before.equals(expectedManifest)) throw new Error("Installed manifest differs from this build's packaging input");
    const identity = {
      formatVersion: 1,
      kind: "installed-web-resource-identity",
      result: "passed",
      observedAt: new Date().toISOString(),
      verification: "packaged-allowlist-and-observed-byte-identity",
      assetOriginProbe: verified.assetOriginProbe,
      scriptFormat: verified.scriptFormat,
      externalRuntimeDependencies: verified.externalRuntimeDependencies,
      manifest: { file: INSTALLED_WEB_MANIFEST, bytes: before.length, sha256: digest(before) },
      packagingInput: { bytes: expectedManifest.length, sha256: digest(expectedManifest), matchesInstalledManifest: true },
      artifacts,
      limitations: [
        "The native workflow resolves the input from the installed app using simctl get_app_container after successful full native tests.",
        "Resource identity alone does not establish rendering, physical-device behavior, signing or App Store readiness.",
      ],
    };
    await writeFile(temporaryManifest, before, { flag: "wx" });
    await writeFile(temporaryIdentity, `${JSON.stringify(identity, null, 2)}\n`, { flag: "wx" });
    await rename(temporaryManifest, manifestOutput);
    // Publish the passing record only after all reads, verification and writes.
    await rename(temporaryIdentity, identityOutput);
    return identity;
  } catch (error) {
    await removeOwnedFile(identityOutput);
    await removeOwnedFile(manifestOutput);
    throw error;
  } finally {
    await removeOwnedFile(temporaryManifest);
    await removeOwnedFile(temporaryIdentity);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv.length !== 5) {
    console.error("Usage: node tools/ios/record-installed-web.mjs INSTALLED_WEB_ASSETS EVIDENCE_DIRECTORY EXPECTED_INPUT_MANIFEST");
    process.exitCode = 2;
  } else {
    try {
      const identity = await recordInstalledWeb(process.argv[2], process.argv[3], process.argv[4]);
      console.log(`Verified installed web resources (${Object.keys(identity.artifacts).length} files; probe mode ${identity.assetOriginProbe}).`);
    } catch {
      // Filesystem exceptions can contain the private installed-container path.
      console.error("Installed web resource verification failed; no passing identity record was written.");
      process.exitCode = 1;
    }
  }
}
