#!/usr/bin/env node
/** Dependency-free, auditable task graph and handoff coordinator. */
import { createHash, randomUUID } from 'node:crypto';
import { existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, renameSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';
import { parseArgs } from 'node:util';

const DEFAULT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const STATES = new Set(['todo', 'in_progress', 'in_review', 'blocked', 'done']);
const KINDS = new Set(['repository_validation', 'unit_test', 'integration_test', 'visual_review', 'device_test', 'source_verification', 'owner_approval']);
const CI_STATES = new Set(['unknown', 'running', 'passed', 'failed']);
const SHA = /^[a-f0-9]{40}$/;
const SHA256 = /^[a-f0-9]{64}$/;
const safeId = (value) => typeof value === 'string' && /^P\d{2}-T\d{2}$/.test(value);
const safeIncidentId = (value) => typeof value === 'string' && /^INC-[A-Za-z0-9][A-Za-z0-9-]{0,63}$/.test(value);
const nonblank = (value) => typeof value === 'string' && value.trim().length > 0;
const isoDate = (value) => typeof value === 'string' && Number.isFinite(Date.parse(value));
const json = (value) => `${JSON.stringify(value, null, 2)}\n`;
export const digest = (content) => createHash('sha256').update(content).digest('hex');

export function repoPath(root, relative) {
  if (!nonblank(relative) || path.isAbsolute(relative) || relative.includes('\\')) throw new Error(`Invalid repository path: ${relative}`);
  const resolved = path.resolve(root, relative);
  if (resolved === root || !resolved.startsWith(`${root}${path.sep}`)) throw new Error(`Path escapes repository: ${relative}`);
  for (let cursor = resolved; cursor !== root; cursor = path.dirname(cursor)) {
    if (lstatSync(cursor, { throwIfNoEntry: false })?.isSymbolicLink()) throw new Error(`Repository evidence/output path contains a symlink: ${relative}`);
  }
  return resolved;
}

function readJSON(root, relative) { return JSON.parse(readFileSync(repoPath(root, relative), 'utf8')); }
function writeAtomic(root, relative, value) {
  const file = repoPath(root, relative);
  mkdirSync(path.dirname(file), { recursive: true });
  const temp = `${file}.${process.pid}.${randomUUID()}.tmp`;
  writeFileSync(temp, value, { encoding: 'utf8', flag: 'wx' });
  renameSync(temp, file);
}

export function tasksOf(roadmap) {
  return (roadmap.phases ?? []).flatMap(phase => (phase.tasks ?? []).map(task => ({
    ...task, phase_id: phase.id, phase_order: phase.order, phase_title: phase.title,
    phase_path: `planning/phases/${phase.id}-${phase.slug}.md`
  }))).sort((a, b) => a.phase_order - b.phase_order || a.order - b.order || a.id.localeCompare(b.id));
}

export function initialState(roadmap, now = new Date().toISOString()) {
  return {
    schema_version: 1,
    updated_at: now,
    health: { ci: { status: 'unknown', checked_commit: null, run_urls: [] }, incidents: [] },
    last_handoff: 'planning/HANDOFF.md',
    tasks: Object.fromEntries(tasksOf(roadmap).map(task => [task.id, {
      status: 'todo', claim: null, blockers: [], evidence: [], last_handoff: null, history: []
    }]))
  };
}

export function loadProject(root = DEFAULT_ROOT) {
  return { roadmap: readJSON(root, 'planning/roadmap.json'), state: readJSON(root, 'planning/state.json') };
}

export function selectNext(roadmap, state, now = new Date().toISOString()) {
  const tasks = tasksOf(roadmap);
  const incidents = state.health?.incidents?.filter(item => item.resolved !== true) ?? [];
  if (incidents.length) return { action: 'repair', reason: `Open project incident: ${incidents[0].summary}`, task: null };
  if (state.health?.ci?.status === 'failed') return { action: 'repair', reason: 'Required CI is recorded as failed. Inspect the current main run and repair it before feature work.', task: null };
  const active = tasks.filter(task => state.tasks[task.id]?.status === 'in_progress');
  const stale = active.find(task => Date.parse(state.tasks[task.id].claim?.expires_at ?? '') <= Date.parse(now));
  if (stale) return { action: 'recover', reason: `Claim for ${stale.id} expired. Inspect pushed work and handoff before releasing or renewing.`, task: stale };
  if (active.length) return { action: 'resume', reason: `Resume the claimed task with its current owner; do not duplicate its work.`, task: active[0] };
  const review = tasks.find(task => state.tasks[task.id]?.status === 'in_review');
  if (review) return { action: 'review', reason: 'Validate submitted evidence and any owner/device gate; do not grant approval on someone else\'s behalf.', task: review };
  const ready = tasks.find(task => state.tasks[task.id]?.status === 'todo' && task.depends_on.every(id => state.tasks[id]?.status === 'done'));
  if (ready) return { action: 'implement', reason: 'First ordered task whose dependencies are complete and whose state is unclaimed.', task: ready };
  const unfinished = tasks.filter(task => state.tasks[task.id]?.status !== 'done');
  return { action: unfinished.length ? 'blocked' : 'complete', reason: unfinished.length ? 'No task is ready. Resolve listed blockers or missing dependencies; do not invent substitute work.' : 'All defined tasks have recorded completion. Revalidate release/maintenance state before claiming the product is current.', task: null };
}

function localOrHTTPS(root, target) {
  if (/^https:\/\//.test(target ?? '')) return true;
  try { return existsSync(repoPath(root, target)); } catch { return false; }
}

export function validateEvidence(root, task, evidencePaths, { strictDigests = false, checkGit = false, requireCoverage = true, requireGates = true } = {}) {
  const errors = [];
  const warnings = [];
  const records = [];
  const require = (condition, message) => { if (!condition) errors.push(message); };
  for (const relative of evidencePaths ?? []) {
    let record;
    try { record = readJSON(root, relative); } catch (error) { errors.push(`${task.id}: cannot read evidence ${relative}: ${error.message}`); continue; }
    records.push(record);
    const label = `${task.id} evidence ${relative}`;
    require(record.schema_version === 1, `${label}: unsupported schema_version`);
    require(nonblank(record.evidence_id), `${label}: missing evidence_id`);
    require(record.task_id === task.id, `${label}: task_id mismatch`);
    require(KINDS.has(record.kind), `${label}: unknown kind`);
    require(record.result === 'passed', `${label}: completion evidence must have result passed`);
    require(SHA.test(record.tested_commit ?? ''), `${label}: tested_commit must be a full existing implementation SHA`);
    if (checkGit && SHA.test(record.tested_commit ?? '')) {
      try { execFileSync('git', ['cat-file', '-e', `${record.tested_commit}^{commit}`], { cwd: root, stdio: 'pipe' }); }
      catch { errors.push(`${label}: tested commit is not available in repository history; fetch it before completing`); }
    }
    require(isoDate(record.recorded_at), `${label}: missing recorded_at timestamp`);
    require(Array.isArray(record.limitations), `${label}: limitations must be explicit (an empty array is permitted)`);
    require(Array.isArray(record.acceptance) && record.acceptance.length > 0, `${label}: missing acceptance mapping`);
    require(Array.isArray(record.source_files), `${label}: missing source_files array`);
    require(Array.isArray(record.commands), `${label}: missing commands array`);
    require(Array.isArray(record.artifacts) && record.artifacts.length > 0, `${label}: at least one evidence artifact is required`);
    if (['repository_validation', 'unit_test', 'integration_test'].includes(record.kind)) {
      require(record.commands?.length > 0, `${label}: automated evidence requires executed commands`);
      require(record.source_files?.length > 0, `${label}: automated evidence requires scoped source fingerprints`);
    }
    for (const source of record.source_files ?? []) {
      require(SHA256.test(source.sha256 ?? ''), `${label}: invalid source hash for ${source.path}`);
      try {
        const sourcePath = repoPath(root, source.path);
        const current = digest(readFileSync(sourcePath));
        if (current !== source.sha256) (strictDigests ? errors : warnings).push(`${label}: source changed since evidence: ${source.path}`);
        if (checkGit && SHA.test(record.tested_commit ?? '')) {
          try {
            const committed = execFileSync('git', ['show', `${record.tested_commit}:${source.path}`], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] });
            require(digest(committed) === source.sha256, `${label}: fingerprint does not match tested commit: ${source.path}`);
          } catch { errors.push(`${label}: source was not present in tested commit: ${source.path}`); }
        }
      } catch { errors.push(`${label}: missing source ${source.path}`); }
    }
    for (const command of record.commands ?? []) {
      require(nonblank(command.command) && command.exit_code === 0, `${label}: each claimed passing command needs command and exit_code 0`);
      require(localOrHTTPS(root, command.output_path), `${label}: missing command output ${command.output_path}`);
      require(record.artifacts?.some(artifact => artifact.path === command.output_path), `${label}: command output must appear in the artifact manifest: ${command.output_path}`);
    }
    for (const artifact of record.artifacts ?? []) {
      require(localOrHTTPS(root, artifact.path), `${label}: missing artifact ${artifact.path}`);
      if (!/^https:\/\//.test(artifact.path ?? '')) {
        require(SHA256.test(artifact.sha256 ?? ''), `${label}: local artifact requires sha256: ${artifact.path}`);
        try {
          require(digest(readFileSync(repoPath(root, artifact.path))) === artifact.sha256, `${label}: artifact digest mismatch: ${artifact.path}`);
        } catch { /* Missing artifact is already reported above. */ }
      }
    }
    const validCriteria = new Set(task.acceptance.map(a => a.id));
    for (const mapping of record.acceptance ?? []) {
      require(validCriteria.has(mapping.criterion_id), `${label}: unknown criterion ${mapping.criterion_id}`);
      require(Array.isArray(mapping.evidence) && mapping.evidence.length > 0, `${label}: criterion ${mapping.criterion_id} lacks evidence references`);
      for (const ref of mapping.evidence ?? []) {
        const commandIndex = typeof ref === 'number' && Number.isInteger(ref) && ref >= 0 && ref < (record.commands?.length ?? 0);
        const artifactMatch = typeof ref === 'string' && (record.artifacts ?? []).some(a => a.path === ref);
        require(commandIndex || artifactMatch, `${label}: criterion reference ${ref} does not name an artifact or command index`);
      }
    }
    if (record.kind === 'owner_approval') {
      require(nonblank(record.reviewed_by) && !/^(agent|ai|self)$/i.test(record.reviewed_by), `${label}: owner approval must identify the actual approving owner`);
      require(localOrHTTPS(root, record.decision_reference), `${label}: owner approval needs a recorded decision reference`);
    }
    if (record.kind === 'visual_review') require(nonblank(record.reviewed_by), `${label}: visual review needs reviewer identity`);
    if (record.kind === 'device_test') {
      require(record.device?.model === 'iPhone Duo', `${label}: hardware gate requires actual iPhone Duo`);
      require(nonblank(record.device?.os) && nonblank(record.device?.build), `${label}: device evidence needs OS and app build`);
      require(Number.isFinite(record.device?.duration_minutes) && record.device.duration_minutes > 0, `${label}: missing test duration`);
      require(record.device?.is_simulator === false, `${label}: simulator cannot satisfy physical-device evidence`);
    }
  }
  for (const criterion of requireCoverage ? task.acceptance : []) {
    const covered = records.some(record => criterion.evidence_types.includes(record.kind) && record.acceptance?.some(a => a.criterion_id === criterion.id));
    require(covered, `${task.id}: criterion ${criterion.id} has no accepted evidence type`);
  }
  if (requireGates && task.manual_gate === 'owner') require(records.some(r => r.kind === 'owner_approval'), `${task.id}: owner gate is not satisfied`);
  if (requireGates && task.manual_gate === 'device') require(records.some(r => r.kind === 'device_test'), `${task.id}: physical device gate is not satisfied`);
  return { errors, warnings };
}

function walkMarkdown(root, directory = root) {
  const ignored = new Set(['.git', 'node_modules', 'dist', 'artifacts', 'test-results', 'playwright-report', '.tools', 'WebAssets']);
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    if (ignored.has(entry.name)) return [];
    const file = path.join(directory, entry.name);
    return entry.isDirectory() ? walkMarkdown(root, file) : entry.isFile() && entry.name.endsWith('.md') ? [file] : [];
  });
}

export function validateProject(root, roadmap, state, { checkFiles = true, checkGit = false, checkGenerated = true } = {}) {
  const errors = [], warnings = [];
  const require = (condition, message) => { if (!condition) errors.push(message); };
  require(roadmap.schema_version === 1 && state.schema_version === 1, 'Unsupported roadmap/state schema_version');
  require(roadmap.project === 'Tin Junction', 'Unexpected project identity');
  require(Array.isArray(roadmap.phases) && roadmap.phases.length > 0, 'Roadmap has no phases');
  const tasks = tasksOf(roadmap), byId = new Map(tasks.map(t => [t.id, t]));
  require(byId.size === tasks.length, 'Duplicate task IDs');
  require(new Set(roadmap.phases.map(p => p.id)).size === roadmap.phases.length, 'Duplicate phase IDs');
  require(new Set(roadmap.phases.map(p => p.order)).size === roadmap.phases.length, 'Duplicate phase order');
  for (const phase of roadmap.phases) {
    require(/^P\d{2}$/.test(phase.id) && /^[a-z0-9-]+$/.test(phase.slug), `Invalid phase ID/slug ${phase.id}`);
    require(nonblank(phase.goal) && nonblank(phase.exit_gate), `${phase.id}: missing goal or exit gate`);
    require(new Set(phase.tasks.map(t => t.order)).size === phase.tasks.length, `${phase.id}: duplicate task order`);
  }
  for (const task of tasks) {
    require(safeId(task.id) && task.id.startsWith(`${task.phase_id}-`), `Invalid task ID ${task.id}`);
    for (const key of ['depends_on', 'required_reading', 'scope', 'deliverables', 'steps', 'acceptance', 'tests', 'risks']) require(Array.isArray(task[key]), `${task.id}: ${key} must be an array`);
    if (!Array.isArray(task.depends_on) || !Array.isArray(task.acceptance)) continue;
    require(task.steps.length >= 3 && task.acceptance.length > 0, `${task.id}: task is not actionable`);
    require([null, 'owner', 'device'].includes(task.manual_gate), `${task.id}: invalid manual gate`);
    require(new Set(task.acceptance.map(a => a.id)).size === task.acceptance.length, `${task.id}: duplicate acceptance IDs`);
    for (const a of task.acceptance) {
      require(a.id.startsWith(`${task.id}-A`) && nonblank(a.requirement), `${task.id}: malformed acceptance criterion`);
      require(Array.isArray(a.evidence_types) && a.evidence_types.length > 0 && a.evidence_types.every(k => KINDS.has(k)), `${task.id}: invalid evidence types`);
    }
    for (const dep of task.depends_on) require(byId.has(dep) && dep !== task.id, `${task.id}: invalid dependency ${dep}`);
    if (checkFiles) for (const ref of task.required_reading) require(localOrHTTPS(root, ref), `${task.id}: missing reading ${ref}`);
    const progress = state.tasks?.[task.id];
    require(Boolean(progress), `${task.id}: missing state`);
    if (!progress) continue;
    require(STATES.has(progress.status), `${task.id}: invalid state ${progress.status}`);
    require(Array.isArray(progress.evidence) && Array.isArray(progress.blockers) && Array.isArray(progress.history), `${task.id}: malformed state arrays`);
    if (progress.status === 'in_progress') {
      require(nonblank(progress.claim?.owner) && isoDate(progress.claim?.expires_at) && isoDate(progress.claim?.started_at), `${task.id}: in_progress needs a valid claim`);
      require(SHA.test(progress.claim?.head_at_claim ?? ''), `${task.id}: claim needs starting commit`);
    } else require(progress.claim === null, `${task.id}: only in_progress may hold a claim`);
    if (progress.status === 'blocked') require(progress.blockers.some(b => !b.resolved_at && nonblank(b.reason)), `${task.id}: blocked without a reason`);
    if (['in_progress', 'in_review', 'done'].includes(progress.status)) {
      for (const dep of task.depends_on) require(state.tasks[dep]?.status === 'done', `${task.id}: dependency ${dep} is not done`);
    }
    if (['in_review', 'done'].includes(progress.status) && checkFiles) {
      require(localOrHTTPS(root, progress.last_handoff), `${task.id}: missing task handoff`);
      const result = validateEvidence(root, task, progress.evidence, { checkGit, requireCoverage: progress.status === 'done', requireGates: progress.status === 'done' });
      errors.push(...result.errors); warnings.push(...result.warnings);
    }
  }
  for (const id of Object.keys(state.tasks ?? {})) require(byId.has(id), `Orphan task state ${id}`);
  const visiting = new Set(), visited = new Set();
  const visit = (id) => {
    if (visiting.has(id)) { errors.push(`Dependency cycle at ${id}`); return; }
    if (visited.has(id) || !byId.has(id)) return;
    visiting.add(id); for (const dep of byId.get(id).depends_on ?? []) visit(dep); visiting.delete(id); visited.add(id);
  };
  for (const id of byId.keys()) visit(id);
  require(Array.isArray(state.health?.incidents), 'Project incidents must be an array');
  const incidents = Array.isArray(state.health?.incidents) ? state.health.incidents : [];
  require(new Set(incidents.map(item => item?.id)).size === incidents.length, 'Duplicate incident IDs');
  for (const incident of incidents) {
    require(safeIncidentId(incident?.id) && nonblank(incident?.summary) && nonblank(incident?.owner) && isoDate(incident?.opened_at), 'Malformed project incident');
    require(typeof incident?.resolved === 'boolean', `${incident?.id}: incident resolved must be boolean`);
    if (incident?.resolved === true) require(isoDate(incident.resolved_at) && nonblank(incident.resolution), `${incident.id}: resolved incident requires date and resolution`);
    else require(incident?.resolved_at === null && incident?.resolution === null, `${incident?.id}: open incident cannot contain a resolution`);
  }
  require(CI_STATES.has(state.health?.ci?.status), 'Invalid CI health status');
  if (state.health?.ci?.status !== 'unknown') {
    require(SHA.test(state.health?.ci?.checked_commit ?? ''), 'CI health requires a checked commit');
    require(state.health?.ci?.run_urls?.length > 0 && state.health.ci.run_urls.every(url => /^https:\/\/github\.com\/cheshmakzanoon-ops\/Tin-junction\/actions\/runs\/\d+/.test(url)), 'CI health requires actual repository run URLs');
  }
  if (checkFiles) {
    require(localOrHTTPS(root, state.last_handoff), 'Missing global handoff pointer');
    for (const file of walkMarkdown(root)) {
      const prose = readFileSync(file, 'utf8').replace(/```[\s\S]*?```/g, '');
      for (const match of prose.matchAll(/\]\(([^)]+)\)/g)) {
        const link = match[1].split('#')[0];
        if (!link || /^(https?:|mailto:)/.test(link)) continue;
        const target = path.resolve(path.dirname(file), link);
        require(target.startsWith(`${root}${path.sep}`) && existsSync(target), `Broken local link ${path.relative(root, file)} -> ${link}`);
      }
    }
    if (checkGenerated && errors.length === 0) {
      for (const [relative, expected] of generatedDocuments(roadmap, state)) {
        require(existsSync(repoPath(root, relative)) && readFileSync(repoPath(root, relative), 'utf8') === expected, `Generated view out of date: ${relative}; run npm run project:render`);
      }
    }
  }
  return { errors, warnings };
}

const mdLink = (from, target) => `[${target}](${/^https?:\/\//.test(target) ? target : path.posix.relative(path.posix.dirname(from), target)})`;
function nextText(roadmap, state, now = state.updated_at) {
  const selected = selectNext(roadmap, state, now);
  const lines = ['# Next task', '', '> Generated from roadmap.json and state.json. Run `npm run project:next` for a live lease check.', '', `Action: **${selected.action}**`, '', selected.reason, '', `CI snapshot: **${state.health.ci.status}**. Always check GitHub Actions for the current remote main commit.`, ''];
  if (selected.task) {
    const t = selected.task;
    lines.push(`## ${t.id} — ${t.title}`, '', `Phase: ${mdLink('planning/NEXT_TASK.md', t.phase_path)}`, '', `Dependencies: ${t.depends_on.join(', ') || 'none'}`, '', `Manual gate: ${t.manual_gate ?? 'none'}`, '', '### Required reading', '', ...t.required_reading.map(ref => `- ${mdLink('planning/NEXT_TASK.md', ref)}`), '', '### First actions', '', ...t.steps.map((step, i) => `${i + 1}. ${step}`), '', '### Acceptance', '', ...t.acceptance.map(a => `- **${a.id}**: ${a.requirement} (${a.evidence_types.join(' / ')})`), '');
  }
  lines.push('## Blocked work', '');
  const blocked = tasksOf(roadmap).filter(t => state.tasks[t.id].status === 'blocked');
  lines.push(...(blocked.length ? blocked.map(t => `- ${t.id}: ${state.tasks[t.id].blockers.filter(b => !b.resolved_at).map(b => b.reason).join('; ')}`) : ['No task is explicitly blocked. This is not evidence that future external gates are resolved.']), '');
  return lines.join('\n');
}

export function generatedDocuments(roadmap, state) {
  const result = new Map();
  const tasks = tasksOf(roadmap), count = status => tasks.filter(t => state.tasks[t.id]?.status === status).length;
  const lines = ['# Tin Junction — project status', '', '> Generated. Do not edit by hand. Task counts describe recorded work, not percentage of product quality.', '', `Ledger updated: ${state.updated_at}`, '', `Tasks: ${tasks.length}; done: ${count('done')}; active: ${count('in_progress')}; review: ${count('in_review')}; blocked: ${count('blocked')}; todo: ${count('todo')}.`, '', `CI snapshot: **${state.health.ci.status}**${state.health.ci.checked_commit ? ` for ${state.health.ci.checked_commit}` : ' (not yet recorded)'}. This may be stale; inspect current remote checks.`, '', '[Next task](NEXT_TASK.md) · [Current handoff](HANDOFF.md) · [Agent rules](../AGENTS.md)', '', '| Phase | Purpose | Recorded done | Active / review / blocked |', '|---|---|---:|---|'];
  for (const phase of roadmap.phases) {
    const members = tasks.filter(t => t.phase_id === phase.id);
    const done = members.filter(t => state.tasks[t.id]?.status === 'done').length;
    const active = members.filter(t => ['in_progress', 'in_review', 'blocked'].includes(state.tasks[t.id]?.status)).map(t => `${t.id} ${state.tasks[t.id].status}`).join('; ') || '—';
    lines.push(`| [${phase.id}](phases/${phase.id}-${phase.slug}.md) | ${phase.title} | ${done}/${members.length} | ${active} |`);
    const phasePath = `planning/phases/${phase.id}-${phase.slug}.md`;
    const body = [`# ${phase.id} — ${phase.title}`, '', '> Generated from planning/roadmap.json. Edit the JSON definition, then run `npm run project:render`.', '', `## Outcome`, '', phase.goal, '', '## Exit gate', '', phase.exit_gate, '', 'The phase is not accepted merely because these instructions or its source files exist. Each task requires the stated evidence. Current progress lives in [the ledger](../state.json).', ''];
    for (const t of members) {
      body.push(`## ${t.id} — ${t.title}`, '', `Dependencies: ${t.depends_on.join(', ') || 'none'}`, '', `Manual gate: ${t.manual_gate ?? 'none'}; planning estimate: ${t.estimated_sessions ?? 'not estimated'}. Estimates are not deadlines or completion claims.`, '', '### Read first', '', ...t.required_reading.map(ref => `- ${mdLink(phasePath, ref)}`), '', '### Owned scope', '', ...t.scope.map(ref => `- \`${ref}\``), '', '### Deliverables', '', ...t.deliverables.map(x => `- ${x}`), '', '### Implementation sequence', '', ...t.steps.map((x, i) => `${i + 1}. ${x}`), '', '### Acceptance criteria', '', ...t.acceptance.map(a => `- **${a.id}** — ${a.requirement}\n  - Accepted evidence: ${a.evidence_types.join(', ')}.`), '', '### Verification', '', ...t.tests.map(x => `- ${x}`), '', '### Failure cases and cautions', '', ...t.risks.map(x => `- ${x}`), '', '### Handoff requirement', '', 'Record tested implementation SHA, changed scope, acceptance evidence, commands/results, unrun checks, blockers and the next exact task. Use [the handoff template](../../templates/HANDOFF.md). Update state through the project CLI, regenerate views, and push the metadata checkpoint.', '');
    }
    result.set(phasePath, body.join('\n'));
  }
  lines.push('', '## External gates', '', 'Duo-only distribution, physical-device graphics/thermal validation, final visual approval, name clearance, signing credentials and public release approval are explicit future gates. No generated status can grant them.', '');
  result.set('planning/STATUS.md', lines.join('\n'));
  result.set('planning/NEXT_TASK.md', nextText(roadmap, state));
  return result;
}

function render(root, roadmap, state) { for (const [file, content] of generatedDocuments(roadmap, state)) writeAtomic(root, file, content); }
const currentCommit = root => execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
function history(record, action, detail, now) { record.history.push({ at: now, action, detail }); }

export function transitionIncident(state, command, id, options = {}, now = new Date().toISOString()) {
  if (!safeIncidentId(id)) throw new Error('Incident ID must start INC- and contain only letters, digits and hyphens (up to 64 characters after INC-).');
  if (!Array.isArray(state.health?.incidents)) throw new Error('Project incidents must be an array. Repair the ledger schema first.');
  const incident = state.health.incidents.find(item => item.id === id);
  if (command === 'incident-open') {
    if (incident) throw new Error(`Incident ${id} already exists; preserve its history and use a new ID for a recurrence.`);
    if (!nonblank(options.summary) || !nonblank(options.owner)) throw new Error('incident-open requires --summary and --owner.');
    state.health.incidents.push({ id, summary: options.summary, owner: options.owner, opened_at: now, resolved: false, resolved_at: null, resolution: null });
  } else if (command === 'incident-resolve') {
    if (!incident || incident.resolved) throw new Error(`${id} is not an open incident.`);
    if (!nonblank(options.resolution)) throw new Error('incident-resolve requires --resolution describing the verified repair and evidence reference.');
    incident.resolved = true; incident.resolved_at = now; incident.resolution = options.resolution;
  } else throw new Error(`Unknown incident transition ${command}`);
  state.updated_at = now;
  return state;
}

export function transition(root, roadmap, state, command, id, options = {}, now = new Date().toISOString()) {
  const task = tasksOf(roadmap).find(t => t.id === id);
  if (!task) throw new Error(`Unknown task ${id}`);
  const record = state.tasks[id];
  const ready = task.depends_on.every(dep => state.tasks[dep]?.status === 'done');
  if (command === 'claim') {
    if (state.health.ci.status === 'failed') throw new Error('Repair failing required CI before claiming a feature.');
    if (state.health.incidents?.some(incident => incident.resolved !== true)) throw new Error('Repair the unresolved project incident before claiming a feature.');
    if (record.status !== 'todo' || !ready) throw new Error(`${id} is not ready and unclaimed.`);
    if (!nonblank(options.owner)) throw new Error('claim requires --owner');
    const hours = Number(options.hours ?? 4);
    if (!Number.isFinite(hours) || hours <= 0 || hours > 24) throw new Error('Claim hours must be >0 and <=24.');
    record.status = 'in_progress';
    record.claim = { owner: options.owner, started_at: now, expires_at: new Date(Date.parse(now) + hours * 3600000).toISOString(), head_at_claim: options.head ?? currentCommit(root), scope: task.scope };
    history(record, 'claim', `${options.owner}; ${hours} hours`, now);
  } else if (command === 'release') {
    if (record.status !== 'in_progress' || !nonblank(options.reason)) throw new Error('release requires an active claim and --reason documenting inspection.');
    record.status = 'todo'; record.claim = null; history(record, 'release', options.reason, now);
  } else if (command === 'block') {
    if (!nonblank(options.reason) || !nonblank(options.owner)) throw new Error('block requires --reason and --owner (who can resolve it).');
    record.status = 'blocked'; record.claim = null;
    record.blockers.push({ reason: options.reason, owner: options.owner, opened_at: now, resolved_at: null, resolution: null });
    history(record, 'block', options.reason, now);
    const affected = new Set([id]);
    let changed = true;
    while (changed) {
      changed = false;
      for (const descendant of tasksOf(roadmap)) {
        if (affected.has(descendant.id) || !descendant.depends_on.some(dep => affected.has(dep))) continue;
        affected.add(descendant.id); changed = true;
        const downstream = state.tasks[descendant.id];
        if (['in_progress', 'in_review', 'done'].includes(downstream.status)) {
          const reason = `Dependency ${id} reopened: ${options.reason}`;
          downstream.status = 'blocked'; downstream.claim = null;
          downstream.blockers.push({ reason, owner: options.owner, opened_at: now, resolved_at: null, resolution: null });
          history(downstream, 'dependency_block', reason, now);
        }
      }
    }
  } else if (command === 'unblock') {
    if (record.status !== 'blocked' || !nonblank(options.resolution)) throw new Error('unblock requires blocked state and --resolution.');
    for (const blocker of record.blockers) if (!blocker.resolved_at) { blocker.resolved_at = now; blocker.resolution = options.resolution; }
    record.status = 'todo'; history(record, 'unblock', options.resolution, now);
  } else if (['submit', 'complete'].includes(command)) {
    if (command === 'complete' && state.health.ci.status === 'failed') throw new Error('Repair failing required CI before completing a task. Partial evidence may still be submitted.');
    if (command === 'complete' && state.health.incidents?.some(incident => incident.resolved !== true)) throw new Error('Resolve the open project incident before completing a task. Partial evidence may still be submitted.');
    if (!['in_progress', 'in_review'].includes(record.status) || !ready) throw new Error(`${id} must be claimed or in review with completed dependencies.`);
    if (record.claim && Date.parse(record.claim.expires_at) <= Date.parse(now)) throw new Error('Claim expired. Inspect and release/reclaim before submitting.');
    if (!nonblank(options.handoff) || !existsSync(repoPath(root, options.handoff))) throw new Error('A real local --handoff file is required.');
    const evidencePaths = [...new Set(options.evidence?.length ? options.evidence : (record.evidence ?? []))];
    if (!evidencePaths.length) throw new Error('At least one --evidence manifest is required.');
    const latestBlock = Math.max(0, ...record.history.filter(event => ['block', 'dependency_block'].includes(event.action)).map(event => Date.parse(event.at)));
    for (const evidencePath of evidencePaths) {
      if (Date.parse(readJSON(root, evidencePath).recorded_at) <= latestBlock) throw new Error(`${id}: evidence predates the latest regression/block; record fresh acceptance evidence after reopening.`);
    }
    const verdict = validateEvidence(root, task, evidencePaths, { strictDigests: true, checkGit: options.checkGit !== false, requireCoverage: command === 'complete', requireGates: command === 'complete' });
    if (verdict.errors.length) throw new Error(verdict.errors.join('\n'));
    if (record.evidence?.length && JSON.stringify(record.evidence) !== JSON.stringify(evidencePaths)) {
      record.history.push({ at: now, action: 'archive_evidence', detail: 'Replaced active acceptance set; old manifests remain immutable.', evidence: record.evidence });
    }
    record.evidence = evidencePaths; record.last_handoff = options.handoff; record.claim = null;
    record.status = command === 'complete' ? 'done' : 'in_review';
    state.last_handoff = options.handoff; history(record, command, options.handoff, now);
  } else throw new Error(`Unknown transition ${command}`);
  state.updated_at = now;
  return state;
}

export function runCLI(args = process.argv.slice(2), root = DEFAULT_ROOT) {
  const parsed = parseArgs({ args, allowPositionals: true, options: {
    owner: { type: 'string' }, hours: { type: 'string' }, reason: { type: 'string' }, resolution: { type: 'string' },
    summary: { type: 'string' },
    evidence: { type: 'string', multiple: true }, handoff: { type: 'string' }, status: { type: 'string' },
    commit: { type: 'string' }, run: { type: 'string', multiple: true }, json: { type: 'boolean' }
  } });
  const [command = 'next', id] = parsed.positionals;
  if (command === 'init') {
    if (existsSync(repoPath(root, 'planning/state.json'))) throw new Error('State already exists; init will not overwrite it.');
    const roadmap = readJSON(root, 'planning/roadmap.json'), state = initialState(roadmap);
    writeAtomic(root, 'planning/state.json', json(state)); render(root, roadmap, state); return 'Initialized task ledger.';
  }
  const { roadmap, state } = loadProject(root);
  if (command === 'next') {
    const selected = selectNext(roadmap, state);
    return parsed.values.json ? json(selected) : `${selected.action.toUpperCase()}: ${selected.task ? `${selected.task.id} — ${selected.task.title}` : ''}\n${selected.reason}\nRead: ${selected.task?.phase_path ?? 'planning/HANDOFF.md'}\nCI snapshot: ${state.health.ci.status}; verify the current remote main before editing.`;
  }
  if (command === 'status') return generatedDocuments(roadmap, state).get('planning/STATUS.md');
  if (command === 'render') { render(root, roadmap, state); return 'Rendered phase procedures, STATUS.md and NEXT_TASK.md.'; }
  if (command === 'validate') {
    const verdict = validateProject(root, roadmap, state, { checkGit: true });
    if (verdict.errors.length) throw new Error(verdict.errors.join('\n'));
    return `Validated ${roadmap.phases.length} phases and ${tasksOf(roadmap).length} tasks; graph, state, evidence, generated views and local links are consistent.\n${verdict.warnings.length ? `Historical evidence warnings:\n${verdict.warnings.join('\n')}` : 'No historical source-digest warnings.'}\nThis checks repository consistency, not gameplay, graphics quality or current remote CI.`;
  }
  if (command === 'fingerprint') return json(parsed.positionals.slice(1).map(relative => ({ path: relative, sha256: digest(readFileSync(repoPath(root, relative))) })));
  if (command === 'ci') {
    if (!CI_STATES.has(parsed.values.status) || !SHA.test(parsed.values.commit ?? '') || !parsed.values.run?.length) throw new Error('ci requires --status, --commit full-SHA and one or more --run URLs, copied from observed GitHub results.');
    state.health.ci = { status: parsed.values.status, checked_commit: parsed.values.commit, run_urls: parsed.values.run };
    state.updated_at = new Date().toISOString();
  } else if (['incident-open', 'incident-resolve'].includes(command)) transitionIncident(state, command, id, parsed.values);
  else transition(root, roadmap, state, command, id, parsed.values);
  writeAtomic(root, 'planning/state.json', json(state)); render(root, roadmap, state);
  return `Recorded ${command}${id ? ` for ${id}` : ''}. Validate, inspect the diff, then commit and push this checkpoint.`;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try { console.log(runCLI()); } catch (error) { console.error(error.message); process.exitCode = 1; }
}
