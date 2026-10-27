/** P10-T01 metadata checks. This does not certify copyright, artwork or runtime quality. */
export function validateReferenceInventory(registry, kit, catalog, roadmap) {
  const errors = [];
  const require = (condition, message) => { if (!condition) errors.push(message); };
  const nonempty = value => typeof value === 'string' && value.trim().length > 0;
  const validId = value => typeof value === 'string' && /^[a-z0-9]+(?:[._-][a-z0-9]+)*$/.test(value);
  const https = value => { try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password; } catch { return false; } };
  require(registry?.schemaVersion === 1 && kit?.schemaVersion === 1, 'Unsupported reference/kit schema');
  const references = Array.isArray(registry?.references) ? registry.references : [];
  const assets = Array.isArray(kit?.assets) ? kit.assets : [];
  const catalogAssets = Array.isArray(catalog?.assets) ? catalog.assets : [];
  require(references.length > 0 && assets.length > 0, 'Reference registry and launch kit must not be empty');
  const refs = new Map(), ids = new Set();
  const taskIds = new Set((roadmap?.phases ?? []).flatMap(phase => phase.tasks ?? []).map(task => task.id));
  for (const reference of references) {
    const id = reference.id;
    require(validId(id) && !refs.has(id), `Invalid or duplicate reference ID: ${id}`);
    refs.set(id, reference);
    for (const field of ['family', 'title', 'creator', 'rightsHolder', 'inspection', 'use', 'rights', 'attribution', 'decision']) {
      require(nonempty(reference[field]), `${id}: missing ${field}`);
    }
    require(https(reference.url) && https(reference.rightsEvidenceUrl), `${id}: invalid source/rights URL`);
    require(/^\d{4}-\d{2}-\d{2}$/.test(reference.accessedAt ?? '') && !Number.isNaN(Date.parse(reference.accessedAt)), `${id}: missing access date`);
    for (const flag of ['repositoryImagePermission', 'commercialImagePermission', 'imageDerivativePermission']) {
      // This registry admits link-only references, not files. A new file licence needs a new reviewed policy.
      require(reference[flag] === false, `${id}: link-only registry cannot grant ${flag}`);
    }
    require(nonempty(reference.dimensions?.status) && nonempty(reference.dimensions?.description), `${id}: dimension evidence missing`);
    for (const field of ['observations', 'limitations', 'requiredViews']) {
      require(Array.isArray(reference[field]) && reference[field].length > 0 && reference[field].every(nonempty), `${id}: missing ${field}`);
    }
  }
  for (const family of ['locomotive', 'motion', 'track', 'case', 'architecture', 'foliage', 'composition']) {
    require(references.some(reference => reference.family === family), `Missing reference family: ${family}`);
  }
  for (const item of assets) {
    require(validId(item.id) && !ids.has(item.id), `Invalid or duplicate launch ID: ${item.id}`);
    ids.add(item.id);
    require(nonempty(item.owner), `${item.id}: owner role missing`);
    require(taskIds.has(item.productionTask), `${item.id}: unknown production task`);
    require(Number.isInteger(item.priority) && item.priority >= 0 && item.priority <= 2, `${item.id}: invalid priority`);
    require(item.requiredForLaunch === true && Number.isInteger(item.minimumVariants) && item.minimumVariants > 0, `${item.id}: required launch quantity missing`);
    require(['authored-design', 'unresolved', 'not-applicable'].includes(item.dimensions?.status) && nonempty(item.dimensions?.description), `${item.id}: unqualified dimension claim`);
    require(Array.isArray(item.referenceIds), `${item.id}: reference list missing`);
    for (const id of item.referenceIds ?? []) require(refs.has(id), `${item.id}: unknown reference ${id}`);
    const matches = catalogAssets.filter(asset => asset.id === item.id);
    require(matches.length === 1, `${item.id}: missing or duplicate catalog record`);
    const record = matches[0];
    if (!record) continue;
    require(record.kind === item.kind && record.taskId === item.productionTask, `${item.id}: catalog/kit mismatch`);
    require(record.provenance?.rightsRecord === kit.rightsRecord, `${item.id}: missing rights record`);
    const expectedUrls = (item.referenceIds ?? []).map(id => refs.get(id)?.url).filter(Boolean);
    require(JSON.stringify(record.provenance?.sourceUrls) === JSON.stringify(expectedUrls), `${item.id}: catalog reference URLs differ`);
    if (record.stage === 'planned') {
      require(record.sourceFiles?.length === 0 && record.runtimeFiles?.length === 0, `${item.id}: planned asset must not pretend files exist`);
      require(record.approvals?.length === 0 && record.provenance?.status === 'pending', `${item.id}: planned asset has invented approval`);
      require(record.provenance?.redistributionAllowed === false && record.provenance?.derivativeWorksAllowed === false, `${item.id}: planned asset has unearned rights`);
      for (const field of ['technical', 'visual', 'device']) require(record.quality?.[field] === 'not_run', `${item.id}: planned ${field} evidence invented`);
    }
  }
  return errors;
}
