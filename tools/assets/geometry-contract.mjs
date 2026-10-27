/** Strict uncompressed GLB fixture policy, not a general-purpose glTF importer. */
export const ASSET_ID = 'fixture.calibration.001';
const epsilon = 1e-6;
function require(condition, message) { if (!condition) throw new Error(`${ASSET_ID}: ${message}`); }
const near = (a, b) => Number.isFinite(a) && Math.abs(a - b) <= epsilon;
const same = (a, b) => Array.isArray(a) && a.length === b.length && a.every((n, i) => near(n, b[i]));

export function parseGlb(bytes) {
  const data = Buffer.from(bytes);
  require(data.length >= 20 && data.length <= 1024 * 1024, 'GLB size outside fixture limit');
  require(data.readUInt32LE(0) === 0x46546c67 && data.readUInt32LE(4) === 2, 'invalid GLB header/version');
  require(data.readUInt32LE(8) === data.length, 'GLB length mismatch');
  const chunks = [];
  for (let offset = 12; offset < data.length;) {
    require(offset + 8 <= data.length, 'truncated chunk header');
    const length = data.readUInt32LE(offset), type = data.readUInt32LE(offset + 4);
    require(length % 4 === 0 && offset + 8 + length <= data.length, 'invalid chunk length');
    chunks.push({ type, data: data.subarray(offset + 8, offset + 8 + length) });
    offset += 8 + length;
  }
  require(chunks.length === 2 && chunks[0].type === 0x4e4f534a && chunks[1].type === 0x004e4942, 'fixture requires JSON then BIN only');
  let json;
  try { json = JSON.parse(chunks[0].data.toString('utf8')); } catch { require(false, 'invalid JSON chunk'); }
  require(json.asset?.version === '2.0', 'glTF 2.0 required');
  return { json, binary: chunks[1].data };
}

export function readAccessor(document, index) {
  const { json, binary } = document;
  const accessor = json.accessors?.[index];
  require(accessor && !accessor.sparse && !accessor.normalized, `accessor ${index}: unsupported sparse/normalized or missing accessor`);
  const widths = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 };
  const size = { 5123: 2, 5125: 4, 5126: 4 }[accessor.componentType], width = widths[accessor.type];
  require(size && width && Number.isSafeInteger(accessor.count) && accessor.count > 0 && accessor.count < 100000, `accessor ${index}: invalid shape`);
  const view = json.bufferViews?.[accessor.bufferView];
  require(view && view.buffer === 0, `accessor ${index}: invalid buffer view`);
  const viewOffset = view.byteOffset ?? 0, accessorOffset = accessor.byteOffset ?? 0;
  const stride = view.byteStride ?? size * width;
  require([viewOffset, view.byteLength, accessorOffset, stride].every(Number.isSafeInteger) && viewOffset >= 0 && accessorOffset >= 0 && stride >= size * width, `accessor ${index}: invalid offsets/stride`);
  require(viewOffset + view.byteLength <= binary.length && accessorOffset + (accessor.count - 1) * stride + size * width <= view.byteLength, `accessor ${index}: out of bounds`);
  const values = [];
  for (let i = 0; i < accessor.count; i++) {
    const row = [];
    for (let c = 0; c < width; c++) {
      const offset = viewOffset + accessorOffset + i * stride + c * size;
      const value = accessor.componentType === 5126 ? binary.readFloatLE(offset) : accessor.componentType === 5123 ? binary.readUInt16LE(offset) : binary.readUInt32LE(offset);
      require(Number.isFinite(value), `accessor ${index}: non-finite value`);
      row.push(value);
    }
    values.push(row);
  }
  return values;
}

export function validateGeometry(document) {
  const { json, binary } = document;
  require(json.buffers?.length === 1 && json.buffers[0].uri === undefined && json.buffers[0].byteLength <= binary.length, 'single embedded buffer required');
  require(!json.extensionsRequired?.length && !json.extensionsUsed?.length, 'unvalidated extension');
  require(!json.images?.length && !json.textures?.length && !json.animations?.length && !json.skins?.length, 'fixture contains unexpected external or animated resources');
  require(json.nodes?.length === 19 && json.meshes?.length === 14, 'expected 19 nodes and 14 original meshes');
  const nodes = new Map();
  for (const [index, node] of json.nodes.entries()) {
    require(typeof node.name === 'string' && !nodes.has(node.name), `node ${index}: missing/duplicate name`);
    nodes.set(node.name, node);
    require(node.matrix === undefined && same(node.scale ?? [1, 1, 1], [1, 1, 1]) && same(node.rotation ?? [0, 0, 0, 1], [0, 0, 0, 1]), `${node.name}: compensating scale/rotation is forbidden`);
    const translation = node.translation ?? [0, 0, 0];
    require(Array.isArray(translation) && translation.length === 3 && translation.every(Number.isFinite), `${node.name}: non-finite or invalid translation`);
  }
  const root = nodes.get(ASSET_ID);
  require(root && same(root.translation ?? [0, 0, 0], [0, 0, 0]), 'root pivot must remain at origin');
  require(root.extras?.units === 'physical-model-meters' && root.extras?.modelScaleRatio === 87 && root.extras?.assetId === ASSET_ID, 'missing physical-unit metadata');
  const rootIndex = json.nodes.indexOf(root);
  require(json.scenes?.length === 1 && json.scene === 0 && same(json.scenes[0].nodes, [rootIndex]), 'fixture scene must select its root only');
  require(root.children?.length === 18 && new Set(root.children).size === 18 && root.children.every(index => Number.isInteger(index) && index >= 0 && index < 19 && index !== rootIndex), 'invalid fixture hierarchy');
  for (const node of json.nodes) if (node !== root) require(!node.children?.length, `${node.name}: unexpected nested transform`);
  const sockets = {
    'socket.start': [0, 0, 0], 'socket.end': [0, 0, 0.1],
    'socket.axle.left': [-0.00875, 0.02, 0.05], 'socket.axle.right': [0.00875, 0.02, 0.05]
  };
  for (const [id, expected] of Object.entries(sockets)) {
    const node = nodes.get(id);
    require(node?.extras?.socketId === id && node.mesh === undefined && same(node.translation ?? [0, 0, 0], expected), `${id}: socket identity/position lost`);
    const forward = id === 'socket.start' ? [0,0,-1] : id === 'socket.end' ? [0,0,1] : id.endsWith('left') ? [-1,0,0] : [1,0,0];
    require(same(node.extras.forward, forward) && same(node.extras.up,[0,1,0]), `${id}: outward direction/up lost`);
  }
  require(json.materials?.length === 3, 'three explicit PBR materials required');
  for (const material of json.materials) {
    const pbr = material.pbrMetallicRoughness;
    require(pbr && pbr.baseColorFactor?.length === 4 && pbr.baseColorFactor.every(v => Number.isFinite(v) && v >= 0 && v <= 1), `${material.name}: invalid linear base colour`);
    require([pbr.metallicFactor ?? 1, pbr.roughnessFactor ?? 1].every(v => Number.isFinite(v) && v >= 0 && v <= 1), `${material.name}: invalid PBR factor`);
    require(material.doubleSided !== true, `${material.name}: backface culling must expose winding defects`);
  }
  for (const [name, metal, roughness] of [['fixture.metal',1,.25],['fixture.markings',0,.8],['fixture.dielectric',0,.7]]) {
    const pbr=json.materials.find(material=>material.name===name)?.pbrMetallicRoughness;
    require(pbr && near(pbr.metallicFactor??1,metal) && near(pbr.roughnessFactor??1,roughness), `${name}: material semantic roundtrip failed`);
  }
  let triangleCount = 0;
  const bounds = {};
  for (const node of json.nodes.filter(node => node.mesh !== undefined)) {
    const mesh = json.meshes[node.mesh];
    require(mesh?.primitives?.length === 1, `${node.name}: exactly one primitive required`);
    const primitive = mesh.primitives[0];
    require((primitive.mode ?? 4) === 4 && Number.isInteger(primitive.material) && json.materials[primitive.material], `${node.name}: triangles and material required`);
    const positions = readAccessor(document, primitive.attributes?.POSITION);
    const normals = readAccessor(document, primitive.attributes?.NORMAL);
    const uv = readAccessor(document, primitive.attributes?.TEXCOORD_0);
    const indices = readAccessor(document, primitive.indices).flat();
    require(positions.length === normals.length && positions.length === uv.length, `${node.name}: attribute count mismatch`);
    require(positions.every(row => row.length === 3) && normals.every(row => row.length === 3 && near(Math.hypot(...row), 1)), `${node.name}: position/normal invalid`);
    require(uv.every(row => row.length === 2 && row.every(v => v >= -epsilon && v <= 1 + epsilon)), `${node.name}: invalid UV atlas`);
    require(indices.length % 3 === 0 && indices.every(i => Number.isInteger(i) && i >= 0 && i < positions.length), `${node.name}: invalid triangle indices`);
    let volume = 0;
    for (let i = 0; i < indices.length; i += 3) {
      const [a, b, c] = indices.slice(i, i + 3).map(index => positions[index]);
      const u = b.map((n, axis) => n - a[axis]), v = c.map((n, axis) => n - a[axis]);
      const cross = [u[1]*v[2]-u[2]*v[1], u[2]*v[0]-u[0]*v[2], u[0]*v[1]-u[1]*v[0]];
      require(Math.hypot(...cross) > 1e-12, `${node.name}: degenerate triangle`);
      const normal = normals[indices[i]];
      require(cross.reduce((sum, value, axis) => sum + value * normal[axis], 0) > 0, `${node.name}: winding disagrees with normals`);
      const [ta,tb,tc]=indices.slice(i,i+3).map(index=>uv[index]);
      require(Math.abs((tb[0]-ta[0])*(tc[1]-ta[1])-(tb[1]-ta[1])*(tc[0]-ta[0]))>1e-12,`${node.name}: degenerate UV triangle`);
      volume += a[0]*(b[1]*c[2]-b[2]*c[1])/6 + a[1]*(b[2]*c[0]-b[0]*c[2])/6 + a[2]*(b[0]*c[1]-b[1]*c[0])/6;
    }
    require(volume > 1e-14, `${node.name}: inverted closed volume`);
    triangleCount += indices.length / 3;
    const min = [0,1,2].map(axis => Math.min(...positions.map(v => v[axis]))), max = [0,1,2].map(axis => Math.max(...positions.map(v => v[axis])));
    bounds[node.name] = {min, max, size: max.map((v, axis) => v - min[axis])};
  }
  require(same(bounds['ruler.100mm']?.size, [0.01, 0.004, 0.1]), 'ruler: physical 100 mm/+Z roundtrip failed');
  require(same(bounds['ruler.100mm']?.min, [-0.005,-0.002,-0.05]) && same(nodes.get('ruler.100mm').translation, [0,0.002,0.05]), 'ruler: centered pivot or world placement lost');
  require(same(bounds['axle.x']?.size, [0.0175, 0.012, 0.012]) && same(nodes.get('axle.x').translation, [0,0.02,0.05]), 'axle: +X direction or pivot lost');
  for (let i = 0; i <= 10; i++) {
    const name = `ruler.tick.${String(i).padStart(2,'0')}`;
    require(same(nodes.get(name)?.translation, [0,0.0041,Math.min(0.0998,Math.max(0.0002,i*0.01))]), `${name}: ruler tick placement lost`);
  }
  require(same(nodes.get('forward.marker').translation, [0.013,0.002,0.09]), 'asymmetric forward marker lost');
  return {assetId:ASSET_ID, result:'passed', meshCount:14, socketCount:4, triangleCount, materialCount:3, bounds};
}
