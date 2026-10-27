import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

test('native and web consume byte-identical versioned layout conformance cases', () => {
  const source = readFileSync(new URL('../fixtures/documents/layout-design-v2-corpus.json', import.meta.url));
  const native = readFileSync(new URL('../../apps/ios/TinJunctionTests/Fixtures/layout-design-v2-corpus.json', import.meta.url));
  assert.deepEqual(native, source);
  const corpus = JSON.parse(source);
  assert.equal(corpus.schemaVersion, 1);
  assert.equal(corpus.format, 'tin-junction-design-conformance');
  assert.ok(corpus.cases.some(item => item.valid));
  assert.ok(corpus.cases.some(item => !item.valid));
  assert.equal(new Set(corpus.cases.map(item => item.id)).size, corpus.cases.length);
});
