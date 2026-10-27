#!/usr/bin/env node
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { closeSync, openSync } from "node:fs";
import { lstat, mkdir, mkdtemp, readFile, readdir, realpath, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { recordInstalledWeb } from "./record-installed-web.mjs";
import { selectDuo } from "./select-duo.mjs";
import { verifyBundle } from "../build-web.mjs";

// This is an additional fixed verification lane, never a replacement for the
// full suite. No bundle identifier, test filter or filesystem target is accepted
// from command-line arguments. Match the reviewed project.yml application ID.
const BUNDLE_IDENTIFIER = "com.cheshmakzanoonops.tinjunction";
const TEST_CLASS = "TinJunctionUITests/AssetOriginProbeUITests";
const TEST_IDENTIFIER = "AssetOriginProbeUITests/testActualBundledOriginAfterWebDataResetAndColdRelaunch()";
const digest = bytes => createHash("sha256").update(bytes).digest("hex");
const identity = bytes => ({ bytes: bytes.length, sha256: digest(bytes) });

class VerificationFailure extends Error {
  constructor(message, exitCode = 1) { super(message); this.exitCode = exitCode; }
}
function requireThat(condition, message) { if (!condition) throw new VerificationFailure(message); }

function helpText(result) {
  requireThat(result.stdout.trim().length > 0 || result.stderr.trim().length > 0,
    "The installed native command returned no help output.");
  return `stdout:\n${result.stdout}\nstderr:\n${result.stderr}`;
}

async function ordinaryEntry(file, kind) {
  const entry = await lstat(file);
  requireThat(!entry.isSymbolicLink() && (kind === "directory" ? entry.isDirectory() : entry.isFile()),
    `Expected an ordinary ${kind} for a required verification input.`);
  return entry;
}

async function repositoryEntry(root, relative, kind) {
  let current = root;
  const parts = relative.split("/");
  for (let i = 0; i < parts.length; i++) {
    requireThat(parts[i] !== ".." && parts[i] !== "." && parts[i].length > 0, "Invalid fixed repository path.");
    current = path.join(current, parts[i]);
    await ordinaryEntry(current, i === parts.length - 1 ? kind : "directory");
  }
  return current;
}

async function boundedFile(file, maximum = 2_000_000) {
  const info = await ordinaryEntry(file, "file");
  requireThat(info.size > 0 && info.size <= maximum, "A required verification file has an invalid size.");
  return readFile(file);
}

async function containerPath(result) {
  const value = result.stdout.trim();
  requireThat(result.exitCode === 0 && value.startsWith("/") && value !== "/" && !/[\r\n\0]/.test(value),
    "Simulator did not return one absolute app-container path.");
  await ordinaryEntry(value, "directory");
  // Paths stay in process memory. The uploaded record contains only outcomes,
  // generation byte identities and comparisons, never container locations.
  return realpath(value);
}

async function generations(container) {
  let directory = container;
  for (const part of ["Library", "Application Support", "TinJunction"]) {
    directory = path.join(directory, part);
    try { await ordinaryEntry(directory, "directory"); }
    catch (error) { if (error.code === "ENOENT") return { entries: [], generations: {} }; throw error; }
  }
  const entries = await readdir(directory);
  const found = {};
  for (const name of ["current.json", "previous.json"]) {
    if (entries.includes(name)) found[name] = identity(await boundedFile(path.join(directory, name), 524_288 + 1_024));
  }
  return { entries, generations: found };
}

function missingContainer(result) {
  // A service/unknown-device failure must not masquerade as deleted app data.
  // This exact POSIX domain/code is a guard to verify on the installed CLI,
  // not a claim that every future simctl version has an identical error format.
  return result.exitCode !== 0 && result.stdout.trim() === ""
    && /domain\s*=\s*NSPOSIXErrorDomain\s*,?\s*code\s*=\s*2(?:\D|$)/i.test(result.stderr)
    && /(?:^|\n)\s*No such file or directory\s*(?:\n|$)/.test(result.stderr);
}

async function observedProbes(directory, selectedUDID) {
  const manifest = JSON.parse(await boundedFile(path.join(directory, "manifest.json")));
  requireThat(Array.isArray(manifest), "Attachment export did not produce a manifest array.");
  const tests = manifest.filter(item => item.testIdentifier === TEST_IDENTIFIER);
  requireThat(tests.length === 1 && Array.isArray(tests[0].attachments), "The fixed asset-origin test has no unique exported record.");
  const observed = [];
  for (const name of ["first-launch", "cold-relaunch"]) {
    const matching = tests[0].attachments.filter(item =>
      typeof item.suggestedHumanReadableName === "string"
      && item.suggestedHumanReadableName.startsWith(`asset-origin-observation-${name}_`));
    requireThat(matching.length === 1, `Missing or ambiguous final ${name} observation.`);
    const attachment = matching[0];
    requireThat(attachment.deviceId === selectedUDID && typeof attachment.exportedFileName === "string"
      && /^[A-Za-z0-9_-]+\.txt$/.test(attachment.exportedFileName), "Unexpected observation device or attachment filename.");
    const bytes = await boundedFile(path.join(directory, attachment.exportedFileName), 65_536);
    const wrapper = JSON.parse(bytes), report = wrapper.report;
    requireThat(wrapper.formatVersion === 1 && wrapper.networkPolicy === "http-https-denied"
      && wrapper.webDataCleared === true && wrapper.persistentStorage === false && wrapper.isSimulator === true,
    "The exported observation lacks the required prepared Simulator network/cache policy.");
    requireThat(report?.stage === "complete" && report.documentURL === "tinjunction://bundle/index.html"
      && report.webgl2 === true && report.results?.glb?.status === "passed" && report.results?.texture?.status === "passed"
      && typeof report.sessionId === "string" && report.sessionId.length > 0,
    "The exported probe is not a completed packaged rendering observation.");
    observed.push({ name, file: attachment.exportedFileName, ...identity(bytes), sessionId: report.sessionId });
  }
  requireThat(observed[0].sessionId !== observed[1].sessionId, "Cold relaunch did not establish a distinct native session.");
  return observed;
}

export async function runCleanInstall() {
  requireThat(process.argv.length === 2, "This fixed clean-install runner accepts no arguments.");
  const initial = spawnSync("git", ["rev-parse", "--show-toplevel"], { encoding: "utf8", timeout: 10_000 });
  requireThat(initial.status === 0, "Run this verification within its repository.");
  const root = await realpath(initial.stdout.trim());
  const artifactRoot = await repositoryEntry(root, "artifacts/ios", "directory");
  const output = await mkdtemp(path.join(artifactRoot, "clean-install-"));
  const report = { formatVersion: 1, kind: "simulator-clean-install-asset-verification", result: "in-progress",
    startedAt: new Date().toISOString(), scope: TEST_CLASS, phase: "preflight", commands: [],
    limitations: ["Additional fixed asset-origin verification after the mandatory full native suite.",
      "HTTP/HTTPS is denied inside the prepared WKWebView; this is not OS-wide networking or physical airplane mode.",
      "App-container removal and fresh saved-layout absence do not claim secure erasure, keychain clearing or physical-device evidence."] };
  let counter = 0;
  async function save() {
    const temporary = path.join(output, `verification-${counter++}.tmp`);
    await writeFile(temporary, `${JSON.stringify(report, null, 2)}\n`, { flag: "wx" });
    await rename(temporary, path.join(output, "verification.json"));
  }
  async function run(label, executable, args, { allowFailure = false, log = null, timeout = 120_000 } = {}) {
    const start = new Date().toISOString();
    let descriptor;
    if (log) descriptor = openSync(path.join(output, log), "wx");
    let result;
    try {
      result = spawnSync(executable, args, { cwd: root, encoding: "utf8", timeout, maxBuffer: 2_000_000,
        stdio: log ? ["ignore", descriptor, descriptor] : ["ignore", "pipe", "pipe"] });
    } finally { if (descriptor !== undefined) closeSync(descriptor); }
    const exitCode = Number.isInteger(result.status) ? result.status : result.error?.code === "ETIMEDOUT" ? 124 : 1;
    report.commands.push({ label, executable: path.basename(executable), exitCode, signal: result.signal ?? null,
      processErrorCode: result.error?.code ?? null, startedAt: start, completedAt: new Date().toISOString(), ...(log ? { log } : {}) });
    await save();
    if (!allowFailure && exitCode !== 0) throw new VerificationFailure(`${label} failed.`, exitCode);
    return { exitCode, stdout: result.stdout ?? "", stderr: result.stderr ?? "" };
  }
  async function inventory(label) {
    const raw = (await run(label, "xcrun", ["simctl", "list", "--json"])).stdout;
    const selected = selectDuo(JSON.parse(raw));
    requireThat(selected.udid.toLowerCase() === process.env.TIN_SIMULATOR_UDID.toLowerCase()
      && selected.state === "Booted", "The observed selected Duo is no longer the booted verification device.");
    await writeFile(path.join(output, `${label}.json`), raw, { flag: "wx" });
    return selected;
  }
  try {
    await save();
    requireThat((await run("host-platform", "uname", ["-s"])).stdout.trim() === "Darwin", "Clean-install verification requires macOS.");
    requireThat(/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(process.env.TIN_SIMULATOR_UDID ?? ""),
      "Set TIN_SIMULATOR_UDID from the observed Duo selector.");
    const compiler = (await run("compiler", "xcodebuild", ["-version"])).stdout;
    requireThat(compiler.split(/\r?\n/)[0] === "Xcode 27.1", "The clean-install compiler must remain Xcode 27.1.");
    requireThat((await run("simulator-sdk", "xcrun", ["--sdk", "iphonesimulator", "--show-sdk-version"])).stdout.trim() === "27.1",
      "The clean-install Simulator SDK must remain 27.1.");
    report.compiler = compiler.trim();
    report.selectedSimulator = await inventory("inventory-before-reset");
    const udid = report.selectedSimulator.udid;
    const priorSelection = JSON.parse(await boundedFile(await repositoryEntry(root, "artifacts/ios/selected-simulator.json", "file")));
    requireThat(priorSelection.udid === udid, "The full suite and clean-install trial selected different Simulators.");
    const fullLog = await boundedFile(await repositoryEntry(root, "artifacts/ios/xcodebuild.log", "file"), 64_000_000);
    const fullText = fullLog.toString("utf8");
    requireThat(fullText.includes("** TEST SUCCEEDED **") && !fullText.includes("-only-testing:") && !fullText.includes("-skip-testing:"),
      "The original full-suite success log is required before app removal.");
    for (const suite of ["AssetOriginProbeUITests", "HostSmokeTests", "HostStartupUITests", "PlatformProbeUITests"])
      requireThat(fullText.includes(`Test Suite '${suite}' passed`), "A required full-suite UI class has no passing prerequisite result.");
    report.fullSuiteLog = identity(fullLog);
    const input = await repositoryEntry(root, "artifacts/ios/packaged-web-input-manifest.json", "file");
    const inputBytes = await boundedFile(input);
    requireThat(JSON.parse(inputBytes).assetOriginProbe === true, "The compiled clean-install trial needs the explicit diagnostic package.");
    const priorIdentityBytes = await boundedFile(await repositoryEntry(root, "artifacts/ios/installed-web-identity.json", "file"));
    const priorIdentity = JSON.parse(priorIdentityBytes);
    requireThat(priorIdentity.result === "passed" && priorIdentity.assetOriginProbe === true
      && priorIdentity.packagingInput?.matchesInstalledManifest === true
      && priorIdentity.packagingInput?.sha256 === digest(inputBytes), "The full suite's installed resource identity is required before app removal.");
    report.packagingInput = identity(inputBytes);
    report.originalInstalledIdentity = identity(priorIdentityBytes);
    const compiled = await repositoryEntry(root, "artifacts/ios/DerivedData/Build/Products/Debug-iphonesimulator/TinJunction.app", "directory");
    const compiledPlist = await ordinaryEntry(path.join(compiled, "Info.plist"), "file");
    requireThat(compiledPlist.size > 0, "Compiled application Info.plist is empty.");
    const info = JSON.parse((await run("compiled-app-plist", "plutil", ["-convert", "json", "-o", "-", path.join(compiled, "Info.plist")])).stdout);
    requireThat(info.CFBundleIdentifier === BUNDLE_IDENTIFIER && info.CFBundleExecutable === "TinJunction"
      && info.CFBundlePackageType === "APPL", "The compiled product is not the configured Tin Junction test application.");
    const bundleID = info.CFBundleIdentifier;
    report.bundleIdentifier = bundleID;
    for (const command of ["install", "uninstall", "get_app_container"]) {
      const help = await run(`simctl-help-${command}`, "xcrun", ["simctl", "help", command]);
      await writeFile(path.join(output, `simctl-help-${command}.txt`), helpText(help), { flag: "wx" });
    }
    const beforeApp = await containerPath(await run("installed-app-before-reset", "xcrun", ["simctl", "get_app_container", udid, bundleID, "app"]));
    const beforeData = await containerPath(await run("installed-data-before-reset", "xcrun", ["simctl", "get_app_container", udid, bundleID, "data"]));
    const priorData = await generations(beforeData);
    requireThat(Object.keys(priorData.generations).length > 0, "No existing saved generation was observed; app-data deletion would not be demonstrated.");
    report.priorGenerations = priorData.generations;
    await recordInstalledWeb(path.join(beforeApp, "WebAssets"), path.join(output, "before-reset"), input);
    await verifyBundle(path.join(compiled, "WebAssets"), true);
    const compiledManifest = await boundedFile(path.join(compiled, "WebAssets", "bundle-manifest.json"));
    requireThat(compiledManifest.equals(inputBytes), "Compiled resources differ from this build's packaging input.");
    report.compiledManifest = identity(compiledManifest);
    report.phase = "uninstall"; await save();
    await run("uninstall-compiled-test-app", "xcrun", ["simctl", "uninstall", udid, bundleID]);
    const absent = await run("data-container-after-uninstall", "xcrun", ["simctl", "get_app_container", udid, bundleID, "data"], { allowFailure: true });
    report.removalObservation = { exitCode: absent.exitCode, stdoutEmpty: absent.stdout.trim() === "",
      errorIdentity: identity(Buffer.from(absent.stderr)),
      reportedErrors: [...absent.stderr.matchAll(/domain\s*=\s*([A-Za-z0-9_.-]+)\s*,?\s*code\s*=\s*(-?\d+)/gi)]
        .map(match => ({ domain: match[1], code: Number(match[2]) })),
      expectedPOSIXNoEntry: missingContainer(absent) };
    requireThat(missingContainer(absent), "App removal did not yield the expected missing-container domain/code.");
    await inventory("inventory-after-uninstall");
    report.phase = "reinstall"; await save();
    await run("reinstall-exact-compiled-test-app", "xcrun", ["simctl", "install", udid, compiled]);
    const freshData = await containerPath(await run("fresh-data-before-launch", "xcrun", ["simctl", "get_app_container", udid, bundleID, "data"]));
    const fresh = await generations(freshData);
    requireThat(fresh.entries.length === 0 && Object.keys(fresh.generations).length === 0, "Fresh installation retained prior Tin Junction storage.");
    report.freshDataBeforeLaunch = { savedGenerationCount: 0, applicationStoreEntryCount: 0,
      containerLocationChanged: freshData !== beforeData, inspectedBeforeAnyLaunchOrTest: true };
    const freshApp = await containerPath(await run("fresh-app-before-test", "xcrun", ["simctl", "get_app_container", udid, bundleID, "app"]));
    await recordInstalledWeb(path.join(freshApp, "WebAssets"), path.join(output, "after-reinstall"), input);
    report.phase = "asset-origin-test"; await save();
    const resultBundle = path.join(output, "CleanInstall.xcresult");
    const native = await run("unchanged-asset-origin-ui-test", "xcodebuild", ["test-without-building",
      "-project", "apps/ios/TinJunction.xcodeproj", "-scheme", "TinJunction", "-configuration", "Debug",
      "-destination", `platform=iOS Simulator,id=${udid}`, "-destination-timeout", "120",
      "-derivedDataPath", "artifacts/ios/DerivedData", "-resultBundlePath", resultBundle,
      "-parallel-testing-enabled", "NO", `-only-testing:${TEST_CLASS}`, "CODE_SIGNING_ALLOWED=NO"],
    { allowFailure: true, log: "xcodebuild-clean-install.log", timeout: 20 * 60_000 });
    report.nativeTestExitCode = native.exitCode;
    let exportFailure, identityFailure;
    const screenshots = path.join(output, "screenshots");
    try {
      const help = await run("attachment-export-help", "xcrun", ["xcresulttool", "help", "export", "attachments"]);
      await writeFile(path.join(output, "xcresulttool-attachments-help.txt"), helpText(help), { flag: "wx" });
      await mkdir(screenshots);
      await run("export-clean-install-attachments", "xcrun", ["xcresulttool", "export", "attachments", "--path", resultBundle, "--output-path", screenshots]);
      await boundedFile(path.join(screenshots, "manifest.json"));
    } catch (error) { exportFailure = error; }
    try {
      const afterApp = await containerPath(await run("installed-app-after-test", "xcrun", ["simctl", "get_app_container", udid, bundleID, "app"]));
      await recordInstalledWeb(path.join(afterApp, "WebAssets"), path.join(output, "after-test"), input);
    } catch (error) { identityFailure = error; }
    report.attachmentExportPassed = !exportFailure;
    report.postTestInstalledIdentityPassed = !identityFailure;
    if (native.exitCode !== 0) throw new VerificationFailure("The clean-install native test failed; its result and attempted exports are retained.", native.exitCode);
    if (exportFailure) throw exportFailure;
    if (identityFailure) throw identityFailure;
    report.observations = await observedProbes(screenshots, udid);
    report.phase = "complete"; report.result = "passed"; report.completedAt = new Date().toISOString();
    await save();
    console.log(`Verified clean installation and two packaged asset sessions. Evidence: artifacts/ios/${path.basename(output)}`);
    return 0;
  } catch (error) {
    report.result = "failed"; report.completedAt = new Date().toISOString();
    report.failure = error instanceof VerificationFailure ? error.message : "Filesystem, JSON or resource verification failed; no passing clean-install result is established.";
    try { await save(); } catch { /* A prior in-progress/failed record never claims success. */ }
    console.error(`Clean-install verification failed during ${report.phase}. ${report.failure}`);
    return error instanceof VerificationFailure ? error.exitCode : 1;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv.length !== 2) {
    console.error("This fixed clean-install runner accepts no arguments."); process.exitCode = 2;
  } else {
    try { process.exitCode = await runCleanInstall(); }
    catch { console.error("Clean-install preflight failed; no app reset or passing report is established."); process.exitCode = 1; }
  }
}
