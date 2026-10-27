#!/usr/bin/env node
/** Read-only release candidate preflight. No signing, upload, or publication code. */
import { execFileSync } from 'node:child_process';
import { readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';
import { loadProject, repoPath, validateProject } from './project.mjs';

export const REPOSITORY = 'cheshmakzanoon-ops/Tin-junction';
export const REQUIRED_WORKFLOWS = ['.github/workflows/quality.yml', '.github/workflows/ios-simulator.yml'];
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SHA = /^[a-f0-9]{40}$/;
const placeholder = (text) => typeof text !== 'string' || !text.trim() || /(?:<[^>]+>|\b(?:todo|tbd|placeholder|changeme|replace[_ -]?me)\b|example\.(?:com|org|net)|\.invalid(?:\/|$))/i.test(text);

function iso(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value)) return false;
  const time = Date.parse(value);
  return Number.isFinite(time) && new Date(time).toISOString() === (value.includes('.') ? value : value.replace('Z', '.000Z'));
}

function referenceExists(root, value) {
  if (placeholder(value)) return false;
  if (value.startsWith('https://')) {
    try {
      const url = new URL(value);
      return url.protocol === 'https:' && Boolean(url.hostname) && !url.username && !url.password && url.hostname !== 'localhost';
    } catch { return false; }
  }
  try { return statSync(repoPath(root, value)).isFile(); } catch { return false; }
}

/** Select only latest trusted main run for each workflow; an older success cannot mask a newer failure. */
export function ciFromRuns(runs, candidate, observedAt = new Date().toISOString()) {
  const checks = REQUIRED_WORKFLOWS.map(workflow => {
    const matches = (Array.isArray(runs) ? runs : []).filter(run => run.path === workflow && run.head_sha === candidate && run.head_branch === 'main' && ['push', 'workflow_dispatch'].includes(run.event) && run.repository?.full_name === REPOSITORY);
    const observed = run => Date.parse(run.updated_at ?? run.created_at ?? '') || 0;
    matches.sort((a, b) => observed(b) - observed(a) || Number(b.id) - Number(a.id) || Number(b.run_attempt) - Number(a.run_attempt));
    const latest = matches[0];
    return { workflow, head_sha: latest?.head_sha ?? null, status: latest?.status ?? 'missing', conclusion: latest?.conclusion ?? null, run_url: latest?.html_url ?? null };
  });
  return { repository: REPOSITORY, candidate_sha: candidate, observed_at: observedAt, checks };
}

/** Explicit inputs make release gates testable without creating any real owner approval. */
export function evaluateRelease({ root, roadmap, state, candidate, head, approval, ci, projectVerdict, clean = true, now = new Date().toISOString() }) {
  const blockers = [];
  const require = (condition, message) => { if (!condition) blockers.push(message); };
  require(SHA.test(candidate ?? '') && candidate === head, 'Candidate must be the full 40-character SHA of checked-out HEAD.');
  require(clean === true, 'Working tree must be clean; commit the candidate before preflight.');
  require(iso(now), 'Current observation time must be a valid UTC ISO timestamp.');
  require(projectVerdict && Array.isArray(projectVerdict.errors) && projectVerdict.errors.length === 0, 'Project validator must pass with file, history, and generated-view checks enabled.');
  for (const error of projectVerdict?.errors ?? []) blockers.push(`Project: ${error}`);
  require(!(state?.health?.incidents ?? []).some(incident => incident.resolved !== true), 'Unresolved project incidents block release.');
  for (let number = 0; number <= 28; number += 1) {
    const id = `P${String(number).padStart(2, '0')}`;
    const phase = roadmap?.phases?.find(item => item.id === id);
    require(phase && Array.isArray(phase.tasks) && phase.tasks.length > 0, `${id} must exist and contain tasks; a truncated plan cannot pass.`);
    for (const task of phase?.tasks ?? []) require(state?.tasks?.[task.id]?.status === 'done', `${task.id} is not done.`);
  }

  require(approval && typeof approval === 'object' && !Array.isArray(approval), 'Missing owner approval JSON; no approval is generated automatically.');
  if (approval && typeof approval === 'object' && !Array.isArray(approval)) {
    require(approval.schema_version === 1 && approval.repository === REPOSITORY, 'Approval schema/repository does not match.');
    require(approval.authorized === true, 'Owner must explicitly set authorized to boolean true.');
    require(approval.approved_by === REPOSITORY.split('/')[0], 'Approval must name the repository owner, not an agent, bot, or substitute identity.');
    require(approval.candidate_sha === candidate && SHA.test(approval.candidate_sha ?? ''), 'Approval must authorize this exact candidate SHA.');
    require(iso(approval.approved_at) && Date.parse(approval.approved_at) <= Date.parse(now), 'Approval approved_at must be a valid nonfuture UTC ISO timestamp.');
    require(iso(approval.expires_at) && Date.parse(approval.expires_at) > Date.parse(now) && Date.parse(approval.expires_at) > Date.parse(approval.approved_at), 'Approval must have a valid, unexpired UTC ISO expiry after approved_at.');
    require(referenceExists(root, approval.decision_reference), 'Approval decision_reference must be a real repository file or nonplaceholder HTTPS URL.');
  }

  require(ci?.repository === REPOSITORY && ci?.candidate_sha === candidate, 'Live CI health must belong to this repository and exact candidate SHA.');
  require(iso(ci?.observed_at) && Date.parse(ci.observed_at) <= Date.parse(now) && Date.parse(now) - Date.parse(ci.observed_at) <= 3_600_000, 'CI must be observed within the last hour, not future-dated.');
  for (const workflow of REQUIRED_WORKFLOWS) {
    const check = ci?.checks?.find(item => item.workflow === workflow);
    const runPattern = /^https:\/\/github\.com\/cheshmakzanoon-ops\/Tin-junction\/actions\/runs\/\d+$/;
    require(check?.head_sha === candidate && check.status === 'completed' && check.conclusion === 'success' && runPattern.test(check.run_url ?? ''), `Required CI has not passed for candidate: ${workflow}`);
  }
  return { schema_version: 1, repository: REPOSITORY, candidate_sha: candidate ?? null, ready: blockers.length === 0, checked_at: now, blockers, warnings: projectVerdict?.warnings ?? [], ci: ci ?? null, publication_performed: false };
}

export function runReleaseCLI(args = process.argv.slice(2), root = ROOT) {
  const { values } = parseArgs({ args, strict: true, options: { candidate: { type: 'string' }, approval: { type: 'string' }, 'approval-env': { type: 'boolean', default: false }, 'observe-ci': { type: 'boolean', default: false } } });
  if (values.approval && values['approval-env']) throw new Error('Choose --approval path or --approval-env, not both.');
  const head = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
  const candidate = values.candidate ?? head;
  if (!SHA.test(candidate)) throw new Error('Candidate must be a full lowercase SHA.');
  let approval = null;
  const approvalText = values.approval ? readFileSync(path.resolve(values.approval), 'utf8') : values['approval-env'] ? process.env.TIN_RELEASE_APPROVAL_JSON : null;
  if (approvalText?.trim()) approval = JSON.parse(approvalText);
  const { roadmap, state } = loadProject(root);
  const projectVerdict = validateProject(root, roadmap, state, { checkFiles: true, checkGit: true, checkGenerated: true });
  let ci = null;
  if (values['observe-ci']) {
    // A scoped, configured GitHub token is used normally by gh; no token is read or printed here.
    const result = JSON.parse(execFileSync('gh', ['api', `repos/${REPOSITORY}/actions/runs?head_sha=${candidate}&per_page=100`], { cwd: root, encoding: 'utf8', maxBuffer: 8 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] }));
    ci = ciFromRuns(result.workflow_runs, candidate);
  }
  const clean = execFileSync('git', ['status', '--porcelain', '--untracked-files=normal'], { cwd: root, encoding: 'utf8' }).trim() === '';
  return evaluateRelease({ root, roadmap, state, candidate, head, approval, ci, projectVerdict, clean });
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    const result = runReleaseCLI();
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    process.exitCode = result.ready ? 0 : 1;
  } catch (error) {
    // Do not echo approval JSON, environment values, or potentially sensitive gh stderr.
    process.stderr.write('Release preflight BLOCKED: input, repository validation, or read-only CI observation failed. No release action was taken.\n');
    if (!(error instanceof SyntaxError) && !error.stderr) process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}
