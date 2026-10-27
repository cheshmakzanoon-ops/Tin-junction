import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { ciFromRuns, evaluateRelease, REPOSITORY, REQUIRED_WORKFLOWS } from '../../tools/release-readiness.mjs';

const COMMIT = '1234567890abcdef1234567890abcdef12345678';
const NOW = '2026-10-26T22:00:00.000Z';
function fixture(t) {
  const root = mkdtempSync(path.join(os.tmpdir(), 'tin-release-test-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  writeFileSync(path.join(root, 'decision.md'), '# Temporary test fixture only\n');
  const phases = Array.from({ length: 29 }, (_, i) => {
    const id = `P${String(i).padStart(2, '0')}`;
    return { id, tasks: [{ id: `${id}-T01` }] };
  });
  const runs = REQUIRED_WORKFLOWS.map((workflow, i) => ({ id: 10 + i, run_attempt: 1, path: workflow, head_sha: COMMIT, head_branch: 'main', event: 'push', repository: { full_name: REPOSITORY }, status: 'completed', conclusion: 'success', html_url: `https://github.com/${REPOSITORY}/actions/runs/${10 + i}` }));
  return {
    root, roadmap: { phases }, state: { tasks: Object.fromEntries(phases.flatMap(p => p.tasks).map(task => [task.id, { status: 'done' }])), health: { incidents: [] } },
    candidate: COMMIT, head: COMMIT, now: NOW, clean: true, projectVerdict: { errors: [], warnings: [] },
    approval: { schema_version: 1, repository: REPOSITORY, candidate_sha: COMMIT, authorized: true, approved_by: 'cheshmakzanoon-ops', approved_at: '2026-10-26T21:00:00.000Z', expires_at: '2026-10-27T21:00:00.000Z', decision_reference: 'decision.md' },
    ci: ciFromRuns(runs, COMMIT, NOW), runs
  };
}

test('complete temporary fixture passes without performing any release action', t => {
  const result = evaluateRelease(fixture(t));
  assert.equal(result.ready, true);
  assert.deepEqual(result.blockers, []);
  assert.equal(result.publication_performed, false);
});

for (const [label, mutate] of [
  ['missing approval', f => { f.approval = null; }],
  ['false authorization', f => { f.approval.authorized = false; }],
  ['string authorization', f => { f.approval.authorized = 'true'; }],
  ['agent approval', f => { f.approval.approved_by = 'ai-agent'; }],
  ['substitute owner', f => { f.approval.approved_by = 'another-person'; }],
  ['expired approval', f => { f.approval.expires_at = NOW; }],
  ['invalid calendar expiry', f => { f.approval.expires_at = '2027-02-30T12:00:00.000Z'; }],
  ['future approval', f => { f.approval.approved_at = '2026-10-27T00:00:00.000Z'; }],
  ['wrong approval commit', f => { f.approval.candidate_sha = 'abcdef1234567890abcdef1234567890abcdef12'; }],
  ['candidate differs from HEAD', f => { f.head = 'abcdef1234567890abcdef1234567890abcdef12'; }],
  ['dirty checkout', f => { f.clean = false; }],
  ['placeholder reference', f => { f.approval.decision_reference = 'https://example.com/approval'; }],
  ['missing reference file', f => { f.approval.decision_reference = 'missing.md'; }],
  ['non-file decision reference', f => { f.approval.decision_reference = '.'; }],
  ['HTTP decision reference', f => { f.approval.decision_reference = 'http://github.com/decision'; }],
  ['incomplete task', f => { f.state.tasks['P28-T01'].status = 'in_review'; }],
  ['truncated roadmap', f => { f.roadmap.phases.pop(); }],
  ['empty phase', f => { f.roadmap.phases[10].tasks = []; }],
  ['validator error', f => { f.projectVerdict.errors.push('Broken evidence'); }],
  ['missing validator result', f => { f.projectVerdict = null; }],
  ['open incident', f => { f.state.health.incidents.push({ resolved: false }); }],
  ['missing live CI', f => { f.ci = null; }],
  ['CI stale observation', f => { f.ci.observed_at = '2026-10-26T20:00:00.000Z'; }],
  ['CI future observation', f => { f.ci.observed_at = '2026-10-27T20:00:00.000Z'; }],
  ['CI wrong candidate', f => { f.ci.candidate_sha = 'abcdef1234567890abcdef1234567890abcdef12'; }],
  ['CI missing native workflow', f => { f.ci.checks.pop(); }],
  ['CI skipped workflow', f => { f.ci.checks[0].conclusion = 'skipped'; }],
  ['CI failure', f => { f.ci.checks[0].conclusion = 'failure'; }],
  ['CI running', f => { f.ci.checks[0].status = 'in_progress'; }],
  ['CI forged run host', f => { f.ci.checks[0].run_url = 'https://github.com.attacker.test/actions/runs/1'; }]
]) test(`${label} blocks release`, t => {
  const data = fixture(t);
  mutate(data);
  const result = evaluateRelease(data);
  assert.equal(result.ready, false);
  assert.ok(result.blockers.length > 0);
});

test('latest failed run wins over an older success for the same commit', t => {
  const data = fixture(t);
  const failed = { ...data.runs[0], id: 100, conclusion: 'failure', html_url: `https://github.com/${REPOSITORY}/actions/runs/100` };
  data.ci = ciFromRuns([...data.runs, failed], COMMIT, NOW);
  assert.equal(evaluateRelease(data).ready, false);
});

test('fork, PR, and nonmain runs are not candidate release health', t => {
  const data = fixture(t);
  const ignored = [
    { ...data.runs[0], id: 101, repository: { full_name: 'untrusted/fork' } },
    { ...data.runs[1], id: 102, event: 'pull_request' },
    { ...data.runs[1], id: 103, head_branch: 'development' }
  ];
  data.ci = ciFromRuns(ignored, COMMIT, NOW);
  assert.equal(evaluateRelease(data).ready, false);
});

test('a newly failed rerun of an older run cannot hide behind a higher run ID', t => {
  const data = fixture(t);
  data.runs[0].updated_at = '2026-10-26T20:00:00.000Z';
  const rerun = { ...data.runs[0], id: 5, run_attempt: 2, updated_at: '2026-10-26T21:00:00.000Z', conclusion: 'failure', html_url: `https://github.com/${REPOSITORY}/actions/runs/5` };
  data.ci = ciFromRuns([...data.runs, rerun], COMMIT, NOW);
  assert.equal(evaluateRelease(data).ready, false);
});

test('HTTPS decision reference accepted as a reference, not a legal/identity certification', t => {
  const data = fixture(t);
  data.approval.decision_reference = `https://github.com/${REPOSITORY}/issues/123`;
  assert.equal(evaluateRelease(data).ready, true);
});
