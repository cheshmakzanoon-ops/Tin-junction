import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { validateReferenceInventory } from '../../assets/references/validate.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
const read = file => JSON.parse(readFileSync(path.join(root, file), 'utf8'));
function fixture() {
  return [read('assets/references/registry.json'), read('assets/references/launch-kit.json'), read('assets/catalog.json'), read('planning/roadmap.json')];
}

test('reference registry and required launch catalog have consistent identities, rights and dimensions', () => {
  assert.deepEqual(validateReferenceInventory(...fixture()), []);
});

test('rights/design records exist and research contains no unlicensed reference binaries', () => {
  const [registry, kit] = fixture();
  for (const file of [registry.rightsPolicy, kit.rightsRecord, kit.designRecord]) {
    assert.equal(typeof file, 'string');
    assert.ok(file.startsWith('assets/references/'));
    assert.ok(!file.split('/').includes('..'));
    assert.ok(existsSync(path.join(root, file)), file);
  }
  const files = readdirSync(path.join(root, 'assets/references'), { recursive: true });
  assert.ok(files.every(file => /\.(md|json|mjs)$/.test(file)), 'Image/model/PDF copies require a separately reviewed admission policy');
});

test('museum metadata permission is not confused with a commercial photo licence', () => {
  const [registry] = fixture();
  const museum = registry.references.find(reference => reference.id === 'ref.smg.planet-model');
  assert.match(museum.rights, /CC0/);
  assert.match(museum.rights, /CC BY-NC-SA 4\.0/);
  assert.equal(museum.commercialImagePermission, false);
  assert.equal(museum.imageDerivativePermission, false);
});

for (const [label, mutate] of [
  ['missing creator', ([r]) => { r.references[0].creator = ''; }],
  ['missing rights evidence', ([r]) => { r.references[0].rightsEvidenceUrl = ''; }],
  ['insecure source', ([r]) => { r.references[0].url = 'http://example.org/model'; }],
  ['implicit image rights', ([r]) => { delete r.references[0].commercialImagePermission; }],
  ['unreviewed image rights', ([r]) => { r.references[0].commercialImagePermission = true; }],
  ['duplicate reference', ([r]) => { r.references.push(structuredClone(r.references[0])); }],
  ['missing required family', ([r]) => { r.references = r.references.filter(item => item.family !== 'track'); }],
  ['missing dimension qualification', ([, k]) => { k.assets[0].dimensions.status = 'measured'; }],
  ['unknown source reference', ([, k]) => { k.assets[0].referenceIds.push('ref.not-real'); }],
  ['unassigned owner', ([, k]) => { k.assets[0].owner = ''; }],
  ['unknown production task', ([, k]) => { k.assets[0].productionTask = 'P99-T99'; }],
  ['duplicate launch asset', ([, k]) => { k.assets.push(structuredClone(k.assets[0])); }],
  ['missing catalog entry', ([, k, c]) => { c.assets = c.assets.filter(item => item.id !== k.assets[0].id); }],
  ['fabricated production files', ([, k, c]) => { c.assets.find(item => item.id === k.assets[0].id).runtimeFiles.push({ path: 'fake.glb' }); }],
  ['fabricated art approval', ([, k, c]) => { c.assets.find(item => item.id === k.assets[0].id).quality.visual = 'pass'; }],
  ['unearned asset rights', ([, k, c]) => { c.assets.find(item => item.id === k.assets[0].id).provenance.redistributionAllowed = true; }],
  ['wrong catalog source', ([, k, c]) => { c.assets.find(item => item.id === k.assets[0].id).provenance.sourceUrls = []; }]
]) test(`reference inventory rejects ${label}`, () => {
  const data = fixture();
  mutate(data);
  assert.ok(validateReferenceInventory(...data).length > 0);
});
