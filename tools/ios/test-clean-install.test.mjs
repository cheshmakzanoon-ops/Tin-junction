import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, renameSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runtimeFilesForMode } from "../build-web.mjs";

const script = fileURLToPath(new URL("./test-clean-install.mjs", import.meta.url));
const udid = "12345678-1234-1234-1234-123456789ABC";
const bundleID = "com.cheshmakzanoonops.tinjunction";
const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const fullLog = ["** TEST SUCCEEDED **", ...["AssetOriginProbeUITests", "HostSmokeTests", "HostStartupUITests", "PlatformProbeUITests"]
  .map(suite => `Test Suite '${suite}' passed at fixture time.`)].join("\n");

// These are process-boundary fixtures, not Simulator observations. Fake native
// tools implement only the exact public command sequences used by this runner.
const nativeTool = String.raw`
const fs = require('node:fs'), path = require('node:path');
const root = process.env.FAKE_ROOT, mode = process.env.FAKE_CASE;
const tool = path.basename(process.argv[1]), args = process.argv.slice(2);
fs.appendFileSync(path.join(root, 'commands.jsonl'), JSON.stringify({tool,args})+'\n');
const stateFile = path.join(root, 'native-state');
let state = fs.existsSync(stateFile) ? fs.readFileSync(stateFile, 'utf8') : 'before';
const compiled = path.join(root, 'artifacts/ios/DerivedData/Build/Products/Debug-iphonesimulator/TinJunction.app');
const oldApp = path.join(root, 'private-before-app'), oldData = path.join(root, 'private-before-data');
const newApp = path.join(root, 'private-after-app'), newData = path.join(root, 'private-after-data');
const data = state === 'before' ? oldData : newData;
const app = state === 'before' ? oldApp : newApp;
function done(value='', code=0) { if(value) process.stdout.write(value+'\n'); process.exit(code); }
if (tool === 'uname') done('Darwin');
if (tool === 'git') done(root);
if (tool === 'plutil') done(fs.readFileSync(args.at(-1), 'utf8'));
if (tool === 'xcodebuild') {
  if (args[0] === '-version') done('Xcode 27.1\nBuild version fixture');
  fs.writeFileSync(path.join(root,'native-test-ran'),'yes');
  const result = args[args.indexOf('-resultBundlePath')+1]; fs.mkdirSync(result);
  if (mode === 'post-test-corruption') fs.writeFileSync(path.join(newApp,'WebAssets/bundle.js'),'changed after test');
  const store = path.join(newData,'Library/Application Support/TinJunction'); fs.mkdirSync(store,{recursive:true});
  fs.writeFileSync(path.join(store,'current.json'),'saved by test fixture');
  done('fixture scoped native test output', mode.startsWith('test-failure') ? 65 : 0);
}
if (tool !== 'xcrun') done('unexpected tool',99);
if (args[0] === '--sdk') done('27.1');
if (args[0] === 'simctl') {
  if (args[1] === 'help') {
    if (mode === 'stderr-help') { process.stderr.write('Usage: '+args[2]+' fixture documented arguments\n'); done(); }
    done('Usage: '+args[2]+' fixture documented arguments');
  }
  if (args[1] === 'list') {
    const inventory = JSON.parse(fs.readFileSync(path.join(root,'fixture-inventory.json'),'utf8'));
    if (mode === 'device-unavailable' && state === 'removed') inventory.devices['fixture.runtime'][0].isAvailable=false;
    done(JSON.stringify(inventory));
  }
  if (args[1] === 'get_app_container') {
    if (state === 'removed') {
      if (mode === 'mapping-retained') done(oldData);
      if (mode === 'service-error') { process.stderr.write('An error was encountered (domain=CoreSimulatorServiceError, code=2):\nNo such file or directory\n'); process.exit(2); }
      process.stderr.write('An error was encountered processing the command (domain=NSPOSIXErrorDomain, code=2):\nNo such file or directory\n'); process.exit(2);
    }
    done(args[4] === 'app' ? app : data);
  }
  if (args[1] === 'uninstall') {
    if (mode === 'uninstall-error') process.exit(17);
    fs.writeFileSync(stateFile,'removed');
    if (mode !== 'mapping-retained') { fs.rmSync(app,{recursive:true}); fs.rmSync(data,{recursive:true}); }
    done();
  }
  if (args[1] === 'install') {
    fs.cpSync(compiled,newApp,{recursive:true}); fs.mkdirSync(newData,{recursive:true});
    fs.writeFileSync(stateFile,'after');
    if (mode === 'fresh-data-retained') {
      fs.mkdirSync(path.join(newData,'Library/Application Support/TinJunction'),{recursive:true});
      fs.writeFileSync(path.join(newData,'Library/Application Support/TinJunction/current.json'),'stale saved generation');
    }
    if (mode === 'pre-test-corruption') fs.writeFileSync(path.join(newApp,'WebAssets/bundle.js'),'wrong installed package');
    if (mode === 'fresh-data-link') {
      const outside=path.join(root,'unrelated-private-store'); fs.mkdirSync(outside);
      fs.writeFileSync(path.join(outside,'preserve.txt'),'unrelated data');
      fs.symlinkSync(outside,path.join(newData,'Library'),'dir');
    }
    done();
  }
}
if (args[0] === 'xcresulttool') {
  if (args[1] === 'help') {
    if (mode === 'stderr-help') { process.stderr.write('fixture attachment export help\n'); done(); }
    done('fixture attachment export help');
  }
  fs.writeFileSync(path.join(root,'export-attempted'),'yes');
  if (mode === 'export-error' || mode === 'test-failure-export-error') process.exit(19);
  const output=args[args.indexOf('--output-path')+1];
  const attachments=[];
  for (const [index,name] of ['first-launch','cold-relaunch'].entries()) {
    if (mode === 'missing-final-observation' && index === 1) continue;
    const filename='observation-'+index+'.txt';
    const report={stage:'complete',documentURL:'tinjunction://bundle/index.html',webgl2:true,
      results:{glb:{status:'passed'},texture:{status:'passed'}},sessionId:mode==='reused-session'?'same':'session-'+index};
    fs.writeFileSync(path.join(output,filename),JSON.stringify({formatVersion:1,networkPolicy:'http-https-denied',
      webDataCleared:true,persistentStorage:false,isSimulator:true,report}));
    attachments.push({deviceId:process.env.TIN_SIMULATOR_UDID,exportedFileName:filename,
      suggestedHumanReadableName:'asset-origin-observation-'+name+'_0_fixture.txt'});
  }
  fs.writeFileSync(path.join(output,'manifest.json'),JSON.stringify([{
    testIdentifier:'AssetOriginProbeUITests/testActualBundledOriginAfterWebDataResetAndColdRelaunch()',attachments}]));
  done();
}
done('unexpected command',99);
`;

function fixture(mode = "success") {
  const root = mkdtempSync(path.join(tmpdir(), "tin-clean-install-"));
  const bin = path.join(root, "bin"); mkdirSync(bin);
  for (const name of ["git", "uname", "xcrun", "xcodebuild", "plutil"])
    writeFileSync(path.join(bin, name), `#!/usr/bin/env node\n${nativeTool}`, { mode: 0o755 });
  const artifactRoot = path.join(root, "artifacts/ios"); mkdirSync(artifactRoot, { recursive: true });
  const compiled = path.join(artifactRoot, "DerivedData/Build/Products/Debug-iphonesimulator/TinJunction.app");
  const web = path.join(compiled, "WebAssets"); mkdirSync(web, { recursive: true });
  const artifacts = {};
  for (const name of runtimeFilesForMode(true)) {
    const bytes = Buffer.from(`original fixture ${name}`);
    mkdirSync(path.dirname(path.join(web, name)), { recursive: true });
    writeFileSync(path.join(web, name), bytes); artifacts[name] = { bytes: bytes.length, sha256: sha(bytes) };
  }
  const manifest = Buffer.from(JSON.stringify({ formatVersion: 1, scriptFormat: "iife", externalRuntimeDependencies: [], assetOriginProbe: true, artifacts }));
  writeFileSync(path.join(web, "bundle-manifest.json"), manifest);
  writeFileSync(path.join(compiled, "Info.plist"), JSON.stringify({ CFBundleIdentifier: mode === "wrong-app" ? "unrelated.application" : bundleID,
    CFBundleExecutable: "TinJunction", CFBundlePackageType: "APPL" }));
  cpSync(compiled, path.join(root, "private-before-app"), { recursive: true });
  if (mode === "symlink-compiled") {
    const target = path.join(root, "redirected-compiled-app"); renameSync(compiled, target); symlinkSync(target, compiled, "dir");
  }
  const oldStore = path.join(root, "private-before-data/Library/Application Support/TinJunction"); mkdirSync(oldStore, { recursive: true });
  if (mode !== "no-prior-generation") writeFileSync(path.join(oldStore, "current.json"), "existing test save generation");
  writeFileSync(path.join(artifactRoot, "packaged-web-input-manifest.json"), manifest);
  writeFileSync(path.join(artifactRoot, "installed-web-manifest.json"), manifest);
  writeFileSync(path.join(artifactRoot, "installed-web-identity.json"), JSON.stringify({ result: "passed", assetOriginProbe: true,
    packagingInput: { matchesInstalledManifest: true, sha256: mode === "stale-identity" ? "0".repeat(64) : sha(manifest) } }));
  writeFileSync(path.join(artifactRoot, "xcodebuild.log"), mode === "full-suite-failed" ? "** TEST FAILED **" : fullLog);
  writeFileSync(path.join(artifactRoot, "selected-simulator.json"), JSON.stringify({ udid }));
  writeFileSync(path.join(root, "fixture-inventory.json"), JSON.stringify({
    runtimes: [{ name: "iOS 27.1", identifier: "fixture.runtime", version: "27.1", isAvailable: true }],
    devicetypes: [{ name: "iPhone Duo", identifier: "fixture.Duo" }],
    devices: { "fixture.runtime": [{ name: "iPhone Duo", udid, state: "Booted", isAvailable: true, deviceTypeIdentifier: "fixture.Duo" }] },
  }));
  function run(args = []) {
    const result = spawnSync(process.execPath, [script, ...args], { cwd: root, encoding: "utf8", timeout: 20_000,
      env: { ...process.env, PATH: `${bin}:${process.env.PATH}`, FAKE_ROOT: root, FAKE_CASE: mode, TIN_SIMULATOR_UDID: udid } });
    assert.equal(result.error, undefined);
    const commandFile = path.join(root, "commands.jsonl");
    let commands = []; try { commands = readFileSync(commandFile, "utf8").trim().split("\n").filter(Boolean).map(JSON.parse); } catch {}
    const outputs = readdirSync(artifactRoot).filter(name => name.startsWith("clean-install-"));
    const reports = outputs.map(name => JSON.parse(readFileSync(path.join(artifactRoot, name, "verification.json"), "utf8")));
    return { ...result, commands, reports, outputs, root, artifactRoot };
  }
  return { root, run, clean: () => rmSync(root, { recursive: true, force: true }) };
}

function attempt(mode, verify) {
  const fixtureRun = fixture(mode);
  try { verify(fixtureRun.run()); } finally { fixtureRun.clean(); }
}
const hasCommand = (run, name) => run.commands.some(item => item.tool === "xcrun" && item.args[0] === "simctl" && item.args[1] === name);
const hasNativeTest = run => run.commands.some(item => item.tool === "xcodebuild" && item.args[0] === "test-without-building");

test("fixed clean reinstall proves prior data, fresh empty storage, two sessions and installed byte identity", () => {
  attempt("success", run => {
    assert.equal(run.status, 0, run.stderr);
    const report = run.reports[0]; assert.equal(report.result, "passed");
    assert.ok(report.priorGenerations["current.json"].bytes > 0);
    assert.equal(report.removalObservation.expectedPOSIXNoEntry, true);
    assert.deepEqual(report.removalObservation.reportedErrors, [{ domain: "NSPOSIXErrorDomain", code: 2 }]);
    assert.deepEqual(report.freshDataBeforeLaunch, { savedGenerationCount: 0, applicationStoreEntryCount: 0,
      containerLocationChanged: true, inspectedBeforeAnyLaunchOrTest: true });
    assert.notEqual(report.observations[0].sessionId, report.observations[1].sessionId);
    assert.equal(report.postTestInstalledIdentityPassed, true);
    assert.ok(!JSON.stringify(report).includes(run.root));
    const uninstall = run.commands.find(item => item.tool === "xcrun" && item.args[1] === "uninstall");
    assert.deepEqual(uninstall.args, ["simctl", "uninstall", udid, bundleID]);
    const invocation = run.commands.find(item => item.tool === "xcodebuild" && item.args[0] === "test-without-building");
    assert.deepEqual(invocation.args.filter(arg => arg.startsWith("-only-testing:")), ["-only-testing:TinJunctionUITests/AssetOriginProbeUITests"]);
    assert.ok(!invocation.args.some(arg => arg.startsWith("-skip-testing")));
    const freshIndex = run.commands.findIndex(item => item.tool === "xcrun" && item.args[1] === "install");
    assert.ok(freshIndex < run.commands.indexOf(invocation));
    assert.equal(readFileSync(path.join(run.artifactRoot, "xcodebuild.log"), "utf8"), fullLog);
    for (const directory of ["before-reset", "after-reinstall", "after-test"])
      assert.equal(JSON.parse(readFileSync(path.join(run.artifactRoot, run.outputs[0], directory, "installed-web-identity.json"))).result, "passed");
  });
});

test("arbitrary bundle identifiers and test filters are rejected before native commands", () => {
  const f = fixture();
  try {
    const run = f.run(["--bundle-id", "unrelated.application", "--skip-tests"]);
    assert.equal(run.status, 2); assert.deepEqual(run.commands, []); assert.deepEqual(run.outputs, []);
  } finally { f.clean(); }
});

test("successful native help on stderr is retained and does not require stdout", () => {
  attempt("stderr-help", run => {
    assert.equal(run.status, 0, run.stderr);
    for (const file of ["simctl-help-install.txt", "simctl-help-uninstall.txt", "simctl-help-get_app_container.txt", "xcresulttool-attachments-help.txt"])
      assert.match(readFileSync(path.join(run.artifactRoot, run.outputs[0], file), "utf8"), /stdout:\n\nstderr:\n\S/);
  });
});

test("failed full suite, stale installed identity, wrong compiled app and absent prior save forbid app removal", () => {
  for (const mode of ["full-suite-failed", "stale-identity", "wrong-app", "no-prior-generation"])
    attempt(mode, run => { assert.notEqual(run.status, 0, mode); assert.equal(run.reports[0].result, "failed");
      assert.equal(hasCommand(run, "uninstall"), false, mode); assert.equal(hasNativeTest(run), false, mode); });
});

test("an unrelated service error or surviving mapping cannot masquerade as a removed data container", () => {
  for (const mode of ["service-error", "mapping-retained"])
    attempt(mode, run => { assert.notEqual(run.status, 0, mode); assert.equal(run.reports[0].removalObservation.expectedPOSIXNoEntry, false);
      assert.equal(hasCommand(run, "install"), false); assert.equal(hasNativeTest(run), false); });
});

test("a missing-container response is insufficient if the actual selected Simulator is no longer available", () => {
  attempt("device-unavailable", run => {
    assert.notEqual(run.status, 0); assert.equal(run.reports[0].removalObservation.expectedPOSIXNoEntry, true);
    assert.equal(hasCommand(run, "install"), false); assert.equal(hasNativeTest(run), false);
  });
});

test("failed uninstall preserves its real exit code and prevents reinstall or tests", () => {
  attempt("uninstall-error", run => { assert.equal(run.status, 17); assert.equal(hasCommand(run, "install"), false); assert.equal(hasNativeTest(run), false); });
});

test("retained save data or changed installed resources stop before any post-reset test launch", () => {
  for (const mode of ["fresh-data-retained", "pre-test-corruption"])
    attempt(mode, run => { assert.notEqual(run.status, 0, mode); assert.equal(hasCommand(run, "install"), true);
      assert.equal(hasNativeTest(run), false); assert.equal(run.reports[0].result, "failed"); });
});

test("symlinks cannot redirect the compiled app or the fresh native storage inspection", () => {
  for (const mode of ["symlink-compiled", "fresh-data-link"])
    attempt(mode, run => {
      assert.notEqual(run.status, 0, mode); assert.equal(hasNativeTest(run), false);
      if (mode === "symlink-compiled") assert.equal(hasCommand(run, "uninstall"), false);
      else assert.equal(readFileSync(path.join(run.root, "unrelated-private-store/preserve.txt"), "utf8"), "unrelated data");
      assert.ok(!JSON.stringify(run.reports[0]).includes(run.root));
    });
});

test("native exit65 has priority while attachment export and post-test identity are still attempted", () => {
  for (const mode of ["test-failure", "test-failure-export-error"])
    attempt(mode, run => { assert.equal(run.status, 65); assert.equal(run.reports[0].nativeTestExitCode, 65);
      assert.equal(readFileSync(path.join(run.root, "export-attempted"), "utf8"), "yes");
      assert.equal(run.reports[0].postTestInstalledIdentityPassed, true); assert.equal(run.reports[0].result, "failed"); });
});

test("failed attachment export cannot turn a passing native test into a passing verification", () => {
  attempt("export-error", run => { assert.equal(run.status, 19); assert.equal(run.reports[0].nativeTestExitCode, 0);
    assert.equal(run.reports[0].attachmentExportPassed, false); assert.equal(run.reports[0].result, "failed"); });
});

test("missing final observations or a repeated native session reject an otherwise successful command", () => {
  for (const mode of ["missing-final-observation", "reused-session"])
    attempt(mode, run => { assert.notEqual(run.status, 0, mode); assert.equal(run.reports[0].nativeTestExitCode, 0);
      assert.equal(run.reports[0].result, "failed"); });
});

test("post-test resource changes fail even when the fixed UI test and attachment export succeeded", () => {
  attempt("post-test-corruption", run => { assert.notEqual(run.status, 0); assert.equal(run.reports[0].nativeTestExitCode, 0);
    assert.equal(run.reports[0].attachmentExportPassed, true); assert.equal(run.reports[0].postTestInstalledIdentityPassed, false);
    assert.equal(run.reports[0].result, "failed"); });
});

test("repeated verification preserves each result directory and the original full-suite artifacts", () => {
  const f = fixture();
  try {
    const first = f.run(); assert.equal(first.status, 0, first.stderr);
    const firstDirectory = path.join(first.artifactRoot, first.outputs[0]);
    const firstReport = readFileSync(path.join(firstDirectory, "verification.json"));
    const firstLog = readFileSync(path.join(firstDirectory, "xcodebuild-clean-install.log"));
    const originalIdentity = readFileSync(path.join(first.artifactRoot, "installed-web-identity.json"));
    const second = f.run(); assert.equal(second.status, 0, second.stderr); assert.equal(second.outputs.length, 2);
    assert.deepEqual(readFileSync(path.join(firstDirectory, "verification.json")), firstReport);
    assert.deepEqual(readFileSync(path.join(firstDirectory, "xcodebuild-clean-install.log")), firstLog);
    assert.deepEqual(readFileSync(path.join(first.artifactRoot, "installed-web-identity.json")), originalIdentity);
    assert.equal(readFileSync(path.join(first.artifactRoot, "xcodebuild.log"), "utf8"), fullLog);
  } finally { f.clean(); }
});
