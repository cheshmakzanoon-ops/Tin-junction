import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {mkdtempSync, readFileSync, rmSync, existsSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {parseGlb, validateGeometry} from './geometry-contract.mjs';
const root = fileURLToPath(new URL('../../', import.meta.url));
const blender = process.env.BLENDER_BIN ?? 'blender';
const script = path.join(root,'assets/source/calibration/export_fixture.py');
function run(output, invalid) {
  return spawnSync(blender,['--background','--factory-startup','--python-exit-code','1','--python',script,'--','--output',output,...(invalid ? ['--invalid',invalid] : [])],{encoding:'utf8',timeout:90000});
}
function temporary(t) {const folder=mkdtempSync(path.join(os.tmpdir(),'tin-asset-')); t.after(()=>rmSync(folder,{recursive:true,force:true})); return path.join(folder,'fixture.glb');}
test('actual pinned Blender export reproduces committed GLB bytes and geometry without runtime scale', t=>{
  const output=temporary(t), result=run(output);
  assert.equal(result.status,0,result.stdout+result.stderr);
  const actual=readFileSync(output);
  assert.deepEqual(actual,readFileSync(path.join(root,'tests/fixtures/assets/calibration.glb')));
  assert.equal(validateGeometry(parseGlb(actual)).result,'passed');
});
for(const [invalid,diagnostic] of [['scale','unapplied scale'],['uv','missing complete UV'],['winding','inverted winding'],['socket','duplicate socket'],['units','scene units'],['material','explicit PBR material']]) {
  test(`actual Blender rejects invalid ${invalid} source before writing an export`,t=>{
    const output=temporary(t), result=run(output,invalid);
    assert.equal(result.status,1,result.stdout+result.stderr);
    assert.match(result.stdout+result.stderr,new RegExp(`fixture\\.calibration\\.001:.*${diagnostic}`));
    assert.equal(existsSync(output),false);
  });
}
