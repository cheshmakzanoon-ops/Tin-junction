import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { digest, initialState, loadProject, repoPath, runCLI, selectNext, tasksOf, transition, transitionIncident, validateEvidence, validateProject, generatedDocuments } from '../../tools/project.mjs';

const NOW = '2026-10-26T22:00:00.000Z';
const COMMIT = 'c'.repeat(40);
const task = (id, dependencies = [], gate = null) => ({
  id, order: Number(id.slice(-2)), title: `Task ${id}`, depends_on: dependencies,
  required_reading: [], scope: ['src/'], deliverables: ['Concrete output'], steps: ['Inspect', 'Implement', 'Test'],
  acceptance: [{ id: `${id}-A1`, requirement: 'Behavior demonstrated', evidence_types: ['unit_test'] }],
  tests: ['Run regression'], risks: ['No fake evidence'], manual_gate: gate
});
const roadmap = () => ({ schema_version: 1, project: 'Tin Junction', phases: [
  { id: 'P00', order: 0, slug: 'foundation', title: 'Foundation', goal: 'A real project', exit_gate: 'Verified', tasks: [task('P00-T01'), task('P00-T02', ['P00-T01']), task('P00-T03')] }
] });
const fixture = t => {
  const root = mkdtempSync(path.join(os.tmpdir(), 'tinjunction-project-test-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(path.join(root, 'src')); mkdirSync(path.join(root, 'evidence')); mkdirSync(path.join(root, 'planning'));
  writeFileSync(path.join(root, 'src/engine.ts'), 'export const answer = 42;\n');
  writeFileSync(path.join(root, 'evidence/test.txt'), 'Executed unit test: passed\n');
  writeFileSync(path.join(root, 'planning/handoff.md'), '# Handoff\nVerified fixture.\n');
  return root;
};
const evidence = id => ({
  schema_version: 1, evidence_id: `${id}-E1`, task_id: id, kind: 'unit_test', result: 'passed',
  tested_commit: COMMIT, recorded_at: NOW, reviewed_by: null,
  source_files: [{ path: 'src/engine.ts', sha256: digest('export const answer = 42;\n') }],
  commands: [{ command: 'node --test', exit_code: 0, output_path: 'evidence/test.txt' }],
  artifacts: [{ path: 'evidence/test.txt', sha256: digest('Executed unit test: passed\n') }],
  acceptance: [{ criterion_id: `${id}-A1`, evidence: [0, 'evidence/test.txt'] }], limitations: ['Test fixture, not real product evidence']
});

test('task order and readiness are derived, not a mutable next-task field', () => {
  const r = roadmap(), s = initialState(r, NOW);
  assert.equal(tasksOf(r).length, 3);
  assert.equal(selectNext(r, s, NOW).task.id, 'P00-T01');
  s.tasks['P00-T01'].status = 'blocked';
  assert.equal(selectNext(r, s, NOW).task.id, 'P00-T03');
});

test('failing CI and unresolved incidents outrank planned features', () => {
  const r = roadmap(), s = initialState(r, NOW);
  s.health.ci.status = 'failed';
  assert.equal(selectNext(r, s, NOW).action, 'repair');
  s.health.ci.status = 'passed'; s.health.incidents.push({ summary: 'Save data loss', resolved: false });
  assert.match(selectNext(r, s, NOW).reason, /Save data loss/);
});

test('incident lifecycle preserves the observed problem and requires explicit resolution', () => {
  const r = roadmap(), s = initialState(r, NOW), id = 'INC-20261026-save';
  assert.throws(() => transitionIncident(s, 'incident-open', 'bad/id', {}, NOW), /Incident ID/);
  assert.throws(() => transitionIncident(s, 'incident-open', id, { summary: 'Save corruption' }, NOW), /--owner/);
  transitionIncident(s, 'incident-open', id, { summary: 'Save corruption', owner: 'coordinator' }, NOW);
  assert.equal(selectNext(r, s, NOW).action, 'repair');
  assert.deepEqual(validateProject('', r, s, { checkFiles: false }).errors, []);
  assert.throws(() => transitionIncident(s, 'incident-open', id, { summary: 'Overwrite', owner: 'other' }, NOW), /already exists/);
  assert.throws(() => transitionIncident(s, 'incident-resolve', id, {}, NOW), /--resolution/);
  transitionIncident(s, 'incident-resolve', id, { resolution: 'Fix and regression proof: evidence/save-recovery.json' }, NOW);
  assert.equal(s.health.incidents[0].summary, 'Save corruption');
  assert.equal(s.health.incidents[0].resolved, true);
  assert.equal(s.health.incidents[0].resolved_at, NOW);
  assert.equal(selectNext(r, s, NOW).action, 'implement');
  assert.deepEqual(validateProject('', r, s, { checkFiles: false }).errors, []);
  assert.throws(() => transitionIncident(s, 'incident-resolve', id, { resolution: 'Repeat' }, NOW), /not an open incident/);
});

test('incident CLI writes and resolves fixtures without hand editing the ledger', t => {
  const root = fixture(t), r = roadmap();
  writeFileSync(path.join(root, 'planning/roadmap.json'), JSON.stringify(r));
  writeFileSync(path.join(root, 'planning/state.json'), JSON.stringify(initialState(r, NOW)));
  runCLI(['incident-open', 'INC-fixture', '--summary', 'Observed fixture regression', '--owner', 'coordinator'], root);
  assert.equal(loadProject(root).state.health.incidents[0].resolved, false);
  runCLI(['incident-resolve', 'INC-fixture', '--resolution', 'Verified fixture repair: evidence/test.txt'], root);
  const result = loadProject(root).state.health.incidents[0];
  assert.equal(result.resolved, true);
  assert.equal(result.owner, 'coordinator');
  assert.match(result.resolution, /evidence\/test.txt/);
});

test('claim, stale-claim recovery, release and dependency checks', () => {
  const r = roadmap(), s = initialState(r, NOW);
  assert.throws(() => transition('', r, s, 'claim', 'P00-T02', { owner: 'worker', head: COMMIT }, NOW), /not ready/);
  transition('', r, s, 'claim', 'P00-T01', { owner: 'worker', head: COMMIT, hours: '2' }, NOW);
  assert.equal(selectNext(r, s, NOW).action, 'resume');
  assert.equal(selectNext(r, s, '2026-10-27T01:00:00Z').action, 'recover');
  assert.throws(() => transition('', r, s, 'release', 'P00-T01', {}, NOW), /--reason/);
  transition('', r, s, 'release', 'P00-T01', { reason: 'Inspected clean checkpoint, no concurrent worker' }, NOW);
  assert.equal(s.tasks['P00-T01'].status, 'todo');
  assert.equal(s.tasks['P00-T01'].history.length, 2);
});

test('claim hours cannot be infinite, negative, zero or longer than one day', () => {
  for (const hours of ['0', '-1', '25', 'NaN']) {
    const r = roadmap(), s = initialState(r, NOW);
    assert.throws(() => transition('', r, s, 'claim', 'P00-T01', { owner: 'worker', head: COMMIT, hours }, NOW), /hours/);
  }
});

test('blocking completed work preserves history and evidence; explicit resolution reopens it', () => {
  const r = roadmap(), s = initialState(r, NOW);
  s.tasks['P00-T01'].status = 'done'; s.tasks['P00-T01'].evidence = ['old.json'];
  transition('', r, s, 'block', 'P00-T01', { reason: 'Regression observed', owner: 'engine' }, NOW);
  assert.deepEqual(s.tasks['P00-T01'].evidence, ['old.json']);
  transition('', r, s, 'unblock', 'P00-T01', { resolution: 'Root cause understood; redo acceptance' }, NOW);
  assert.equal(s.tasks['P00-T01'].status, 'todo');
  assert.equal(s.tasks['P00-T01'].blockers[0].resolved_at, NOW);
});

test('validator rejects cycles, orphan states and unfinished dependencies marked done', () => {
  const r = roadmap(), s = initialState(r, NOW);
  r.phases[0].tasks[0].depends_on = ['P00-T02'];
  s.tasks['P00-T02'].status = 'done'; s.tasks['P99-T99'] = { status: 'todo' };
  const result = validateProject('', r, s, { checkFiles: false });
  assert.ok(result.errors.some(x => x.includes('cycle')));
  assert.ok(result.errors.some(x => x.includes('Orphan')));
  assert.ok(result.errors.some(x => x.includes('not done')));
});

test('evidence needs real files, matching hashes, commands and criterion references', t => {
  const root = fixture(t), e = evidence('P00-T01');
  writeFileSync(path.join(root, 'evidence/pass.json'), JSON.stringify(e));
  const result = validateEvidence(root, task('P00-T01'), ['evidence/pass.json'], { strictDigests: true });
  assert.deepEqual(result.errors, []);
  e.commands[0].exit_code = 1; e.acceptance[0].evidence = [9];
  writeFileSync(path.join(root, 'evidence/pass.json'), JSON.stringify(e));
  assert.ok(validateEvidence(root, task('P00-T01'), ['evidence/pass.json']).errors.length >= 2);
});

test('command output must also be a hashed local artifact or manifested HTTPS artifact', t => {
  const root = fixture(t), e = evidence('P00-T01');
  e.commands[0].output_path = 'src/engine.ts';
  writeFileSync(path.join(root, 'evidence/pass.json'), JSON.stringify(e));
  assert.ok(validateEvidence(root, task('P00-T01'), ['evidence/pass.json']).errors.some(x => /command output must appear/.test(x)));
  e.artifacts.push({ path: 'src/engine.ts', sha256: digest('wrong bytes') });
  writeFileSync(path.join(root, 'evidence/pass.json'), JSON.stringify(e));
  assert.ok(validateEvidence(root, task('P00-T01'), ['evidence/pass.json']).errors.some(x => /artifact digest mismatch/.test(x)));
});

test('changed source fails completion but remains a historical warning', t => {
  const root = fixture(t);
  writeFileSync(path.join(root, 'evidence/pass.json'), JSON.stringify(evidence('P00-T01')));
  writeFileSync(path.join(root, 'src/engine.ts'), 'changed');
  const historical = validateEvidence(root, task('P00-T01'), ['evidence/pass.json']);
  assert.equal(historical.errors.length, 0); assert.equal(historical.warnings.length, 1);
  assert.ok(validateEvidence(root, task('P00-T01'), ['evidence/pass.json'], { strictDigests: true }).errors.length > 0);
});

test('claim→submit→complete needs handoff and evidence; no self-certification from status alone', t => {
  const root = fixture(t), r = roadmap(), s = initialState(r, NOW);
  transition(root, r, s, 'claim', 'P00-T01', { owner: 'worker', head: COMMIT }, NOW);
  assert.throws(() => transition(root, r, s, 'complete', 'P00-T01', {}, NOW), /handoff/);
  writeFileSync(path.join(root, 'evidence/pass.json'), JSON.stringify(evidence('P00-T01')));
  const opts = { evidence: ['evidence/pass.json'], handoff: 'planning/handoff.md', checkGit: false };
  transition(root, r, s, 'submit', 'P00-T01', opts, NOW);
  assert.equal(s.tasks['P00-T01'].status, 'in_review'); assert.equal(s.tasks['P00-T01'].claim, null);
  transition(root, r, s, 'complete', 'P00-T01', opts, NOW);
  assert.equal(s.tasks['P00-T01'].status, 'done');
  assert.equal(selectNext(r, s, NOW).task.id, 'P00-T02');
});

test('in-review can collect partial evidence but completion requires all criteria', t => {
  const root = fixture(t), r = roadmap(), s = initialState(r, NOW);
  r.phases[0].tasks[0].acceptance.push({ id: 'P00-T01-A2', requirement: 'Additional proof', evidence_types: ['integration_test'] });
  writeFileSync(path.join(root, 'evidence/pass.json'), JSON.stringify(evidence('P00-T01')));
  transition(root, r, s, 'claim', 'P00-T01', { owner: 'worker', head: COMMIT }, NOW);
  const opts = { evidence: ['evidence/pass.json'], handoff: 'planning/handoff.md', checkGit: false };
  transition(root, r, s, 'submit', 'P00-T01', opts, NOW);
  assert.throws(() => transition(root, r, s, 'complete', 'P00-T01', opts, NOW), /A2/);
});

test('failed CI and open incidents block completion but allow review submission', t => {
  const root = fixture(t);
  writeFileSync(path.join(root, 'evidence/pass.json'), JSON.stringify(evidence('P00-T01')));
  for (const gate of ['ci', 'incident']) {
    const r = roadmap(), s = initialState(r, NOW);
    transition(root, r, s, 'claim', 'P00-T01', { owner: 'worker', head: COMMIT }, NOW);
    if (gate === 'ci') s.health.ci.status = 'failed';
    else transitionIncident(s, 'incident-open', 'INC-review', { summary: 'Observed regression', owner: 'coordinator' }, NOW);
    const opts = { evidence: ['evidence/pass.json'], handoff: 'planning/handoff.md', checkGit: false };
    transition(root, r, s, 'submit', 'P00-T01', opts, NOW);
    assert.equal(s.tasks['P00-T01'].status, 'in_review');
    assert.throws(() => transition(root, r, s, 'complete', 'P00-T01', opts, NOW), gate === 'ci' ? /failing required CI/ : /open project incident/);
    assert.equal(s.tasks['P00-T01'].status, 'in_review');
    if (gate === 'ci') s.health.ci.status = 'passed';
    else transitionIncident(s, 'incident-resolve', 'INC-review', { resolution: 'Inspected passing regression proof: evidence/pass.json' }, NOW);
    transition(root, r, s, 'complete', 'P00-T01', opts, NOW);
    assert.equal(s.tasks['P00-T01'].status, 'done');
  }
});
test('simulator cannot satisfy a hardware gate', t => {
  const root = fixture(t), target = task('P00-T01', [], 'device'), e = evidence(target.id);
  target.acceptance[0].evidence_types = ['device_test'];
  e.kind = 'device_test'; e.device = { model: 'iPhone Duo', os: '27.1', build: 'test', duration_minutes: 30, is_simulator: true };
  writeFileSync(path.join(root, 'evidence/device.json'), JSON.stringify(e));
  assert.ok(validateEvidence(root, target, ['evidence/device.json']).errors.some(x => /simulator/.test(x)));
});

test('owner gate requires a real identified decision reference', t => {
  const root = fixture(t), target = task('P00-T01', [], 'owner'), e = evidence(target.id);
  writeFileSync(path.join(root, 'evidence/pass.json'), JSON.stringify(e));
  assert.ok(validateEvidence(root, target, ['evidence/pass.json']).errors.some(x => /owner gate/.test(x)));
});

test('path traversal and absolute evidence paths are rejected', () => {
  const root = path.resolve('/tmp/test-project');
  for (const input of ['../secret', '/etc/passwd', 'a/../../secret', 'a\\file']) assert.throws(() => repoPath(root, input));
  assert.equal(repoPath(root, 'evidence/ok.json'), '/tmp/test-project/evidence/ok.json');
});

test('generated views are deterministic and do not invent product completion', () => {
  const r = roadmap(), s = initialState(r, NOW);
  const a = generatedDocuments(r, s), b = generatedDocuments(r, s);
  assert.deepEqual([...a], [...b]);
  assert.match(a.get('planning/STATUS.md'), /not percentage of product quality/);
  assert.match(a.get('planning/NEXT_TASK.md'), /P00-T01/);
});
