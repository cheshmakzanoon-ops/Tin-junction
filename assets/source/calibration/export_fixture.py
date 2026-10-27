"""Original P10-T02 geometry probe, not production artwork. Run with Blender 4.3.2."""
import argparse
import hashlib
import json
import math
from pathlib import Path
import sys

import bpy

ASSET_ID = "fixture.calibration.001"
BLENDER_VERSION = (4, 3, 2)
ROOT = Path(__file__).resolve().parents[3]


def blender_position(gltf):
    # Blender Z-up authoring -> glTF Y-up export: (x,y,z) becomes (x,z,-y).
    return (gltf[0], -gltf[2], gltf[1])


def fail(message):
    raise ValueError(f"{ASSET_ID}: {message}")


def material(name, color, metallic, roughness):
    result = bpy.data.materials.new(name)
    result.use_nodes = True
    result.use_backface_culling = True
    shader = result.node_tree.nodes.get("Principled BSDF")
    shader.inputs["Base Color"].default_value = (*color, 1)
    shader.inputs["Metallic"].default_value = metallic
    shader.inputs["Roughness"].default_value = roughness
    return result


def apply_geometry(obj, name, parent, mat):
    obj.name = name
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    obj.parent = parent
    obj.data.materials.append(mat)
    for face in obj.data.polygons:
        face.use_smooth = False
    return obj


def cube(name, center, dimensions, parent, mat):
    bpy.ops.mesh.primitive_cube_add(size=1, location=blender_position(center))
    obj = bpy.context.object
    obj.dimensions = (dimensions[0], dimensions[2], dimensions[1])
    return apply_geometry(obj, name, parent, mat)


def socket(name, position, parent):
    obj = bpy.data.objects.new(name, None)
    bpy.context.scene.collection.objects.link(obj)
    obj.location = blender_position(position)
    obj.parent = parent
    obj["socketId"] = name
    obj["units"] = "physical-model-meters"
    # Semantic vectors are already runtime Y-up; exporter extras do not transform them.
    obj["forward"] = {"socket.start": [0, 0, -1], "socket.end": [0, 0, 1],
                      "socket.axle.left": [-1, 0, 0], "socket.axle.right": [1, 0, 0]}[name]
    obj["up"] = [0, 1, 0]
    return obj


def construct():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    bpy.context.scene.unit_settings.system = "METRIC"
    bpy.context.scene.unit_settings.scale_length = 1
    root = bpy.data.objects.new(ASSET_ID, None)
    bpy.context.scene.collection.objects.link(root)
    root["assetId"] = ASSET_ID
    root["units"] = "physical-model-meters"
    root["modelScaleRatio"] = 87
    root["purpose"] = "Original ruler, axle and socket export-validation fixture; not launch art"
    cream = material("fixture.dielectric", (0.5, 0.45, 0.33), 0, 0.7)
    black = material("fixture.markings", (0.015, 0.02, 0.015), 0, 0.8)
    steel = material("fixture.metal", (0.5, 0.5, 0.5), 1, 0.25)
    ruler = cube("ruler.100mm", (0, 0.002, 0.05), (0.01, 0.004, 0.1), root, cream)
    for i in range(11):
        # End marks remain inside the exact 100 mm ruler bounds.
        z = min(0.0998, max(0.0002, i * 0.01))
        cube(f"ruler.tick.{i:02d}", (0, 0.0041, z), (0.009 if i % 5 == 0 else 0.005, 0.0002, 0.0002), root, black)
    bpy.ops.mesh.primitive_cylinder_add(vertices=32, radius=0.006, depth=0.0175, location=blender_position((0, 0.02, 0.05)), rotation=(0, math.pi / 2, 0))
    axle = apply_geometry(bpy.context.object, "axle.x", root, steel)
    socket("socket.start", (0, 0, 0), root)
    socket("socket.end", (0, 0, 0.1), root)
    socket("socket.axle.left", (-0.00875, 0.02, 0.05), root)
    socket("socket.axle.right", (0.00875, 0.02, 0.05), root)
    # The asymmetrical marker provides visible +Z orientation without text/font dependencies.
    cube("forward.marker", (0.013, 0.002, 0.09), (0.004, 0.004, 0.02), root, black)
    return root, ruler, axle


def validate_source(root):
    if tuple(bpy.app.version) != BLENDER_VERSION:
        fail(f"requires Blender {'.'.join(map(str, BLENDER_VERSION))}; found {bpy.app.version_string}")
    if bpy.context.scene.unit_settings.scale_length != 1:
        fail("scene units must be physical metres without scene scaling")
    socket_ids = set()
    mesh_count = 0
    for obj in [root, *root.children_recursive]:
        if any(not math.isfinite(value) for row in obj.matrix_local for value in row):
            fail(f"{obj.name}: non-finite transform")
        if any(abs(value - 1) > 1e-7 for value in obj.scale) or any(abs(value) > 1e-7 for value in obj.rotation_euler):
            fail(f"{obj.name}: unapplied scale or rotation")
        if "socketId" in obj:
            identifier = obj["socketId"]
            if identifier in socket_ids:
                fail(f"{obj.name}: duplicate socket ID {identifier}")
            socket_ids.add(identifier)
        if obj.type != "MESH":
            continue
        mesh_count += 1
        mesh = obj.data
        if not mesh.vertices or not mesh.polygons:
            fail(f"{obj.name}: empty mesh")
        if len(mesh.materials) != 1 or not mesh.materials[0].use_nodes:
            fail(f"{obj.name}: explicit PBR material required")
        if any(not math.isfinite(c) for vertex in mesh.vertices for c in vertex.co):
            fail(f"{obj.name}: non-finite vertex")
        if not mesh.uv_layers.active or len(mesh.uv_layers.active.data) != len(mesh.loops):
            fail(f"{obj.name}: missing complete UV layer")
        for uv in mesh.uv_layers.active.data:
            if any(not math.isfinite(c) or c < -1e-6 or c > 1.000001 for c in uv.uv):
                fail(f"{obj.name}: UV outside fixture atlas")
        mesh.calc_loop_triangles()
        volume = 0
        for triangle in mesh.loop_triangles:
            a, b, c = (mesh.vertices[index].co for index in triangle.vertices)
            area_vector = (b - a).cross(c - a)
            if area_vector.length < 1e-12:
                fail(f"{obj.name}: degenerate triangle")
            uv_a, uv_b, uv_c = (mesh.uv_layers.active.data[index].uv for index in triangle.loops)
            uv_area = (uv_b.x - uv_a.x) * (uv_c.y - uv_a.y) - (uv_b.y - uv_a.y) * (uv_c.x - uv_a.x)
            if abs(uv_area) < 1e-12:
                fail(f"{obj.name}: degenerate UV triangle")
            volume += a.dot(b.cross(c)) / 6
        if volume <= 1e-14:
            fail(f"{obj.name}: inverted winding or non-positive closed volume")
        if any(face.normal.length < 0.999 for face in mesh.polygons):
            fail(f"{obj.name}: invalid normals")
    if mesh_count != 14 or len(socket_ids) != 4:
        fail("fixture requires 14 meshes and four unique sockets")
    return {"assetId": ASSET_ID, "meshCount": mesh_count, "socketCount": len(socket_ids), "units": "physical-model-meters", "sourceValidation": "passed"}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path, default=ROOT / "tests/fixtures/assets/calibration.glb")
    parser.add_argument("--blend", type=Path, help="Optional local editable .blend; generator is the committed editable master")
    parser.add_argument("--invalid", choices=["scale", "uv", "winding", "socket", "units", "material"])
    args = parser.parse_args(sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else [])
    root, ruler, axle = construct()
    if args.invalid == "scale": ruler.scale.x = 2
    if args.invalid == "uv": ruler.data.uv_layers.remove(ruler.data.uv_layers.active)
    if args.invalid == "winding":
        for face in ruler.data.polygons: face.flip()
        ruler.data.update()
    if args.invalid == "socket": bpy.data.objects["socket.end"]["socketId"] = "socket.start"
    if args.invalid == "units": bpy.context.scene.unit_settings.scale_length = 0.01
    if args.invalid == "material": ruler.data.materials.clear()
    report = validate_source(root)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    if args.blend:
        args.blend.parent.mkdir(parents=True, exist_ok=True)
        bpy.ops.wm.save_as_mainfile(filepath=str(args.blend.resolve()))
    settings = dict(export_format="GLB", export_yup=True, export_apply=True, export_normals=True,
                    export_texcoords=True, export_tangents=False, export_materials="EXPORT",
                    export_animations=False, export_extras=True, export_cameras=False,
                    export_lights=False, export_image_format="AUTO", export_draco_mesh_compression_enable=False)
    bpy.ops.export_scene.gltf(filepath=str(args.output.resolve()), **settings)
    blob = args.output.read_bytes()
    report.update({"blenderVersion": bpy.app.version_string, "exportSettings": settings,
                   "bytes": len(blob), "sha256": hashlib.sha256(blob).hexdigest(),
                   "generatorSha256": hashlib.sha256(Path(__file__).read_bytes()).hexdigest()})
    args.output.with_suffix(".source-report.json").write_text(json.dumps(report, indent=2) + "\n")
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
