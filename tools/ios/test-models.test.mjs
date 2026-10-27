import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const script = fileURLToPath(new URL('./test-models.sh', import.meta.url));
function run(testExit, exportExit, args = []) {
  const root = mkdtempSync(path.join(tmpdir(), 'tin-ios-script-'));
  try {
    const bin = path.join(root, 'bin'); mkdirSync(bin);
    const executable = (name, source) => writeFileSync(path.join(bin, name), `#!/usr/bin/env bash\n${source}\n`, { mode: 0o755 });
    executable('uname', 'echo Darwin');
    executable('git', 'printf "%s\\n" "$FAKE_ROOT"');
    executable('xcodebuild', `
if [[ "$1" == '-version' ]]; then printf 'Xcode 27.1\\nBuild version fixture\\n'; exit 0; fi
printf '%s\\n' "$@" > "$FAKE_ROOT/test-arguments"
while (( $# )); do
  if [[ "$1" == '-resultBundlePath' ]]; then shift; mkdir -p "$1"; fi
  shift
done
echo 'fixture build output'
exit "$FAKE_TEST_EXIT"`);
    executable('xcrun', `
if [[ "$1" == '--sdk' ]]; then echo 27.1; exit 0; fi
if [[ "$1" == 'simctl' ]]; then exit 0; fi
if [[ "$2" == 'help' ]]; then echo 'fixture export help'; exit 0; fi
echo export >> "$FAKE_ROOT/export-attempts"
if (( FAKE_EXPORT_EXIT != 0 )); then exit "$FAKE_EXPORT_EXIT"; fi
mkdir -p "$FAKE_ROOT/artifacts/ios/screenshots"
echo '[]' > "$FAKE_ROOT/artifacts/ios/screenshots/manifest.json"`);
    mkdirSync(path.join(root, 'apps/ios/TinJunction/Resources/WebAssets'), { recursive: true });
    writeFileSync(path.join(root, 'apps/ios/TinJunction/Resources/WebAssets/index.html'), '<html></html>');
    mkdirSync(path.join(root, 'apps/ios/TinJunction.xcodeproj'));
    const result = spawnSync('bash', [script, ...args], {
      cwd: root, encoding: 'utf8', timeout: 10_000,
      env: { ...process.env, PATH: `${bin}:${process.env.PATH}`, FAKE_ROOT: root,
        FAKE_TEST_EXIT: String(testExit), FAKE_EXPORT_EXIT: String(exportExit),
        TIN_SIMULATOR_UDID: '12345678-1234-1234-1234-123456789abc' },
    });
    assert.equal(result.error, undefined);
    assert.equal(readFileSync(path.join(root, 'export-attempts'), 'utf8'), 'export\n');
    assert.match(readFileSync(path.join(root, 'artifacts/ios/xcodebuild.log'), 'utf8'), /fixture build output/);
    return { status: result.status, arguments: readFileSync(path.join(root, 'test-arguments'), 'utf8'),
      scope: readFileSync(path.join(root, 'artifacts/ios/test-scope.txt'), 'utf8').trim() };
  } finally { rmSync(root, { recursive: true, force: true }); }
}

test('the separate model lane selects exactly the unit target and identifies its evidence scope', () => {
  const result = run(0, 0);
  assert.equal(result.status, 0);
  assert.match(result.arguments, /\n-only-testing:TinJunctionTests\n/);
  assert.doesNotMatch(result.arguments, /skip-testing/);
  assert.equal(result.scope, 'unit-models-only');
});
test('failed model test still exports attachments and preserves exit 65', () => assert.equal(run(65, 0).status, 65));
test('failed export cannot conceal failed model test', () => assert.equal(run(65, 17).status, 65));
test('missing evidence fails an otherwise successful model test', () => assert.equal(run(0, 17).status, 17));
test('arbitrary test filters are rejected before starting native tools', () => {
  const result = spawnSync('bash', [script, '--skip-ui'], { encoding: 'utf8', timeout: 1000 });
  assert.equal(result.status, 2);
  assert.match(result.stderr, /accepts no test-filter arguments/);
});
