import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import validator from 'gltf-validator';
import { parseGlb, validateGeometry, ASSET_ID } from './geometry-contract.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
const source = process.argv[2] ? path.resolve(process.argv[2]) : path.join(root, 'tests/fixtures/assets/calibration.glb');
const output = process.argv[3] ? path.resolve(process.argv[3]) : path.join(root, 'artifacts/assets/calibration-validation.json');
if (validator.version() !== '2.0.0-dev.3.10') throw new Error(`${ASSET_ID}: unexpected Khronos validator version ${validator.version()}`);
const bytes = readFileSync(source);
const contract = validateGeometry(parseGlb(bytes));
const khronos = await validator.validateBytes(new Uint8Array(bytes), {
  uri: path.basename(source), format: 'glb', maxIssues: 1000,
  externalResourceFunction: async uri => { throw new Error(`${ASSET_ID}: external resource forbidden: ${uri}`); }
});
// Keep every issue. UNUSED_OBJECT/TEXCOORD_0 is expected: UV coordinates deliberately
// exist for exporter verification, while this tiny fixture has no image textures.
const unexpected = khronos.issues.messages.filter(issue => !(issue.code === 'UNUSED_OBJECT' && issue.severity === 2 && /TEXCOORD_0$/.test(issue.pointer ?? '')));
const report = {assetId: ASSET_ID, sha256:createHash('sha256').update(bytes).digest('hex'), bytes:bytes.length,
  validatorVersion:validator.version(), contract, khronos,
  issueReview:{allowedInfo:'UNUSED_OBJECT only for intentionally present TEXCOORD_0 attributes; no texture is needed for UV roundtrip', unexpectedCount:unexpected.length}};
mkdirSync(path.dirname(output), {recursive:true});
writeFileSync(output, JSON.stringify(report,null,2)+'\n');
if (khronos.issues.numErrors || khronos.issues.numWarnings || khronos.issues.truncated || unexpected.length) {
  throw new Error(`${ASSET_ID}: Khronos validation/review failed; inspect ${output}`);
}
console.log(`${ASSET_ID}: ${contract.meshCount} meshes, ${contract.triangleCount} triangles, ${bytes.length} bytes; Khronos errors=0 warnings=0; report ${output}`);
