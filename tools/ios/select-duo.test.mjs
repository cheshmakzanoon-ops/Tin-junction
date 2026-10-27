import test from 'node:test';
import assert from 'node:assert/strict';
import { selectDuo } from './select-duo.mjs';

const runtimeID = 'fixture.runtime.ios-27-1';
const duoTypeID = 'fixture.device-type.iphone-duo';
const udid = '12345678-1234-1234-1234-123456789abc';
function inventory() {
  return {
    runtimes: [{ name: 'iOS 27.1', identifier: runtimeID, version: '27.1', isAvailable: true }],
    devicetypes: [{ name: 'iPhone Duo', identifier: duoTypeID }],
    devices: { [runtimeID]: [{ name: 'iPhone Duo', deviceTypeIdentifier: duoTypeID, udid, isAvailable: true, state: 'Shutdown' }] },
  };
}
test('selects measured Duo UDID and runtime, not a fabricated product identifier', () => {
  assert.equal(selectDuo(inventory()).udid, udid);
});
test('refuses another phone as fallback', () => {
  const value = inventory(); value.devices[runtimeID][0].deviceTypeIdentifier = 'fixture.device-type.ordinary-iphone';
  assert.throws(() => selectDuo(value), /iPhone Duo/);
});
test('does not trust an editable simulator name to prove device model', () => {
  const value = inventory(); value.devices[runtimeID][0].deviceTypeIdentifier = 'fixture.device-type.ordinary-iphone';
  value.devices[runtimeID][0].name = 'iPhone Duo';
  assert.throws(() => selectDuo(value), /iPhone Duo/);
});
test('accepts a renamed actual Duo only by observed device-type identity', () => {
  const value = inventory(); value.devices[runtimeID][0].name = 'Tin Junction QA';
  assert.equal(selectDuo(value).deviceTypeIdentifier, duoTypeID);
});
test('refuses absent or ambiguous device-type metadata', () => {
  const value = inventory(); delete value.devicetypes;
  assert.throws(() => selectDuo(value), /inventory/);
  value.devicetypes = [{ name: 'iPhone Duo', identifier: duoTypeID }, { name: 'iPhone Duo', identifier: 'ambiguous' }];
  assert.throws(() => selectDuo(value), /device type/);
});
test('refuses unavailable runtime or mismatched SDK', () => {
  const value = inventory(); value.runtimes[0].isAvailable = false;
  assert.throws(() => selectDuo(value), /runtime/);
  value.runtimes[0].isAvailable = true; value.runtimes[0].version = '26.0';
  assert.throws(() => selectDuo(value), /runtime/);
});
test('refuses ambiguous device selections', () => {
  const value = inventory(); value.devices[runtimeID].push({ ...value.devices[runtimeID][0] });
  assert.throws(() => selectDuo(value), /found 2/);
});
test('refuses malformed UDIDs and transitional states', () => {
  const value = inventory(); value.devices[runtimeID][0].udid = 'not-a-udid';
  assert.throws(() => selectDuo(value), /UDID/);
  value.devices[runtimeID][0].udid = udid; value.devices[runtimeID][0].state = 'Creating';
  assert.throws(() => selectDuo(value), /bootable/);
});
