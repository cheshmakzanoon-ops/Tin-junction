import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, symlinkSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { digest, generatedDocuments, initialState, repoPath, transition, validateEvidence } from '../../tools/project.mjs';

const NOW = '2026-10-26T21:00:00.000Z';
const LATER = '2026-10-26T22:00:00.000Z';
const COMMIT = 'a'.repeat(40);
const makeTask = (id, dependencies = []) => ({
  id, order: Number(id.slice(-2)), title: `Task ${id}`, depends_on: dependencies,
  required_reading: [], scope: ['src/'], deliverables: ['One tested behavior'], steps: ['Read', 'Implement', 'Test'],
  acceptance: [{ id: `${id}-A1`, requirement: 'Behavior checked', evidence_types: ['unit_test'] }],
  tests: ['Execute focused test'], risks: ['No fabricated evidence'], manual_gate: null
});
const plan = () => ({ schema_version: 1, project: 'Tin Junction', phases: [{
  id: 'P00', order: 0, slug: 'foundation', title: 'Foundation', goal: 'Verified infrastructure', exit_gate: 'Tests pass',
  tasks: [makeTask('P00-T01'), makeTask('P00-T02', ['P00-T01']), makeTask('P00-T03', ['P00-T02']), makeTask('P00-T04')]
}] });
const fixture = t => {
  const root = mkdtempSync(path.join(os.tmpdir(), 'tinjunction-review-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  for (const dir of ['src', 'evidence', 'planning']) mkdirSync(path.join(root, dir));
  writeFileSync(path.join(root, 'src/core.ts'), 'export const one = 1;\n');
  writeFileSync(path.join(root, 'evidence/test.log'), 'one test executed successfully\n');
  writeFileSync(path.join(root, 'planning/handoff.md'), '# Real fixture handoff\n');
  return root;
};
const evidence = id => ({
  schema_version: 1, evidence_id: `${id}-old`, task_id: id, kind: 'unit_test', result: 'passed', tested_commit: COMMIT, recorded_at: NOW,
  source_files: [{ path: 'src/core.ts', sha256: digest('export const one = 1;\n') }],
  commands: [{ command: 'node --test', exit_code: 0, output_path: 'evidence/test.log' }],
  artifacts: [{ path: 'evidence/test.log', sha256: digest('one test executed successfully\n') }],
  acceptance: [{ criterion_id: `${id}-A1`, evidence: [0] }], limitations: ['Fixture, not product evidence']
});

test('generated reading links preserve external HTTPS URLs', () => {
  const roadmap = plan();
  const url = 'https://developer.apple.com/documentation/webkit/wkwebview';
  roadmap.phases[0].tasks[0].required_reading.push(url);
  const documents = generatedDocuments(roadmap, initialState(roadmap, NOW));
  for (const filename of ['planning/NEXT_TASK.md', 'planning/phases/P00-foundation.md']) {
    assert.ok(documents.get(filename).includes(`[${url}](${url})`), `${filename} must not treat an external URL as a relative path`);
  }
});

test('an explicit claim cannot bypass the unresolved-incident repair gate', () => {
  const roadmap = plan(), state = initialState(roadmap, NOW);
  state.health.incidents.push({ summary: 'Save integrity regression', resolved: false });
  assert.throws(() => transition('', roadmap, state, 'claim', 'P00-T01', { owner: 'worker', head: COMMIT }, NOW), /incident|repair/i);
  assert.equal(state.tasks['P00-T01'].status, 'todo');
});

test('repository paths cannot traverse an existing symlink outside the repository', t => {
  const root = fixture(t);
  const outside = mkdtempSync(path.join(os.tmpdir(), 'tinjunction-review-outside-'));
  t.after(() => rmSync(outside, { recursive: true, force: true }));
  writeFileSync(path.join(outside, 'external.txt'), 'not repository evidence');
  symlinkSync(outside, path.join(root, 'linked-directory'), 'dir');
  assert.throws(() => repoPath(root, 'linked-directory/external.txt'), /escape|symlink|outside/i);
  assert.throws(() => repoPath(root, 'linked-directory/new-file.txt'), /escape|symlink|outside/i);
});

test('reopening a prerequisite cascades to active and completed descendants but not independent work', () => {
  const roadmap = plan(), state = initialState(roadmap, NOW);
  state.tasks['P00-T01'].status = 'done';
  state.tasks['P00-T02'].status = 'done'; state.tasks['P00-T02'].evidence = ['evidence/old.json'];
  state.tasks['P00-T03'].status = 'in_progress'; state.tasks['P00-T03'].claim = { owner: 'worker' };
  transition('', roadmap, state, 'block', 'P00-T01', { reason: 'Known regression', owner: 'engine' }, LATER);
  for (const id of ['P00-T01', 'P00-T02', 'P00-T03']) assert.equal(state.tasks[id].status, 'blocked');
  assert.equal(state.tasks['P00-T03'].claim, null);
  assert.deepEqual(state.tasks['P00-T02'].evidence, ['evidence/old.json']);
  assert.equal(state.tasks['P00-T04'].status, 'todo');
});

test('reopened acceptance cannot be completed by reusing pre-regression evidence', t => {
  const root = fixture(t), roadmap = plan(), state = initialState(roadmap, NOW);
  writeFileSync(path.join(root, 'evidence/old.json'), JSON.stringify(evidence('P00-T01')));
  state.tasks['P00-T01'].status = 'done'; state.tasks['P00-T01'].evidence = ['evidence/old.json'];
  transition(root, roadmap, state, 'block', 'P00-T01', { reason: 'Regression demonstrated after old test', owner: 'engine' }, LATER);
  transition(root, roadmap, state, 'unblock', 'P00-T01', { resolution: 'Rerun acceptance against the repaired environment' }, LATER);
  transition(root, roadmap, state, 'claim', 'P00-T01', { owner: 'worker', head: COMMIT }, LATER);
  assert.throws(() => transition(root, roadmap, state, 'complete', 'P00-T01', {
    evidence: ['evidence/old.json'], handoff: 'planning/handoff.md', checkGit: false
  }, LATER), /reopen|older|stale|recorded|block|regression/i);
});

test('criterion coverage cannot use a disallowed evidence type', t => {
  const root = fixture(t), target = makeTask('P00-T01'), record = evidence(target.id);
  record.kind = 'source_verification';
  writeFileSync(path.join(root, 'evidence/source-only.json'), JSON.stringify(record));
  assert.ok(validateEvidence(root, target, ['evidence/source-only.json']).errors.some(error => /no accepted evidence type/.test(error)));
});
