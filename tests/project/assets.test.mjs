import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {parseGlb, validateGeometry} from '../../tools/assets/geometry-contract.mjs';
const source=new URL('../../tests/fixtures/assets/calibration.glb',import.meta.url);
const fixture=()=>parseGlb(readFileSync(source));
test('Blender fixture has correct ruler, axle, sockets, normals, UVs and PBR factors',()=>{
  const report=validateGeometry(fixture());
  assert.equal(report.triangleCount,280);
  assert.equal(report.socketCount,4);
});
test('recorded export hashes identify exact source and GLB bytes',()=>{
  const report=JSON.parse(readFileSync(new URL('../../tests/fixtures/assets/calibration.source-report.json',import.meta.url)));
  const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
  assert.equal(hash(readFileSync(source)),report.sha256);
  assert.equal(hash(readFileSync(new URL('../../assets/source/calibration/export_fixture.py',import.meta.url))),report.generatorSha256);
  assert.equal(report.blenderVersion,'4.3.2');
});
for(const [label,mutate] of [
  ['root scale',d=>{d.json.nodes.at(-1).scale=[87,87,87];}],
  ['root rotation',d=>{d.json.nodes.at(-1).rotation=[0,0,1,0];}],
  ['missing physical units',d=>{delete d.json.nodes.at(-1).extras.units;}],
  ['wrong socket',d=>{d.json.nodes.find(n=>n.name==='socket.end').translation=[0,.1,0];}],
  ['wrong socket direction',d=>{d.json.nodes.find(n=>n.name==='socket.end').extras.forward=[1,0,0];}],
  ['lost material semantics',d=>{d.json.materials[0].pbrMetallicRoughness.metallicFactor=.5;}],
  ['external buffer',d=>{d.json.buffers[0].uri='../../private.bin';}],
  ['unknown required extension',d=>{d.json.extensionsRequired=['KHR_unverified'];}],
  ['duplicate node',d=>{d.json.nodes[1].name=d.json.nodes[0].name;}],
  ['missing UVs',d=>{delete d.json.meshes[0].primitives[0].attributes.TEXCOORD_0;}],
  ['missing material',d=>{delete d.json.meshes[0].primitives[0].material;}],
  ['double sided material',d=>{d.json.materials[0].doubleSided=true;}],
  ['NaN vertex',d=>{const a=d.json.accessors[0],v=d.json.bufferViews[a.bufferView];d.binary.writeFloatLE(NaN,(v.byteOffset??0)+(a.byteOffset??0));}],
  ['bad normal',d=>{const a=d.json.accessors[1],v=d.json.bufferViews[a.bufferView];d.binary.writeFloatLE(40,(v.byteOffset??0)+(a.byteOffset??0));}],
  ['out of bounds accessor',d=>{d.json.accessors[0].count=99999;}],
  ['sparse accessor',d=>{d.json.accessors[0].sparse={count:1};}],
  ['wrong ruler length',d=>{const p=d.json.meshes[d.json.nodes.find(n=>n.name==='ruler.100mm').mesh].primitives[0];const a=d.json.accessors[p.attributes.POSITION],v=d.json.bufferViews[a.bufferView];d.binary.writeFloatLE(.2,(v.byteOffset??0)+(a.byteOffset??0)+8);}]
]) test(`asset contract rejects ${label}`,()=>{const data=fixture();mutate(data);assert.throws(()=>validateGeometry(data),/fixture\.calibration\.001:/);});
test('GLB parser rejects truncated bytes and malicious length',()=>{
  const data=readFileSync(source);
  assert.throws(()=>parseGlb(data.subarray(0,30)),/length/);
  data.writeUInt32LE(0xfffffffc,12);
  assert.throws(()=>parseGlb(data),/chunk length/);
});
