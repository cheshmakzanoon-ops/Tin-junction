#!/usr/bin/env node
import { readFileSync, appendFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

/** A normal iPhone result cannot satisfy the Duo gate. */
export function selectDuo(inventory) {
  const runtimes = inventory?.runtimes;
  if (!Array.isArray(runtimes) || !inventory?.devices || !Array.isArray(inventory.devicetypes)) {
    throw new Error('Expected complete `xcrun simctl list --json` inventory.');
  }
  const eligible = runtimes.filter((runtime) => runtime.isAvailable === true
    && runtime.version === '27.1' && /^iOS\s/.test(runtime.name ?? ''));
  if (eligible.length !== 1) {
    throw new Error(`Need exactly one available iOS 27.1 runtime; found ${eligible.length}. Do not substitute another SDK.`);
  }
  const runtime = eligible[0];
  const types = inventory.devicetypes.filter((type) => type.name === 'iPhone Duo'
    && typeof type.identifier === 'string' && type.identifier.length > 0);
  if (types.length !== 1) {
    throw new Error(`Need exactly one observed iPhone Duo device type; found ${types.length}.`);
  }
  const duoType = types[0];
  const devices = (inventory.devices[runtime.identifier] ?? []).filter((device) =>
    device.isAvailable === true && device.deviceTypeIdentifier === duoType.identifier);
  if (devices.length !== 1) {
    throw new Error(`Need exactly one available iPhone Duo on ${runtime.name}; found ${devices.length}. Inspect runner image inventory.`);
  }
  const device = devices[0];
  if (!/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(device.udid ?? '')) {
    throw new Error('Simulator UDID is malformed.');
  }
  if (!['Booted', 'Shutdown'].includes(device.state)) {
    throw new Error(`Simulator is not in a bootable state: ${device.state}`);
  }
  return { name: device.name, udid: device.udid, state: device.state,
    runtime: runtime.identifier, runtimeVersion: runtime.version,
    deviceTypeIdentifier: device.deviceTypeIdentifier };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    if (!process.argv[2]) throw new Error('Usage: node tools/ios/select-duo.mjs <inventory.json> [--github-output]');
    const selected = selectDuo(JSON.parse(readFileSync(process.argv[2], 'utf8')));
    if (process.argv.includes('--github-output')) {
      if (!process.env.GITHUB_OUTPUT) throw new Error('GITHUB_OUTPUT is unavailable.');
      appendFileSync(process.env.GITHUB_OUTPUT, `udid=${selected.udid}\nstate=${selected.state}\n`);
    }
    process.stdout.write(`${JSON.stringify(selected, null, 2)}\n`);
  } catch (error) {
    process.stderr.write(`Duo selection failed: ${error.message}\n`);
    process.exitCode = 1;
  }
}
