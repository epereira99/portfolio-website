"""Shared helpers for the landmark scripts (Townscaper-soft, flat colours).

Conventions: Blender Z up; the landmark's front faces Blender -Y, which exports as glTF +Z
(toward the path). Everything stands on z = 0. All parts are joined into ONE object named
after the landmark id, so the glb has one mesh with one primitive per material (few draw calls).
"""

import sys

import bmesh
import bpy

_materials = {}


def setup():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    _materials.clear()


def out_path():
    return sys.argv[sys.argv.index("--") + 1]


def material(name, hex_color, roughness=0.85, metallic=0.0):
    if name in _materials:
        return _materials[name]
    rgb = tuple((int(hex_color[i : i + 2], 16) / 255) ** 2.2 for i in (1, 3, 5))  # sRGB -> linear
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    bsdf = m.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (*rgb, 1)
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Metallic"].default_value = metallic
    _materials[name] = m
    return m


def _finish(obj, mat, bevel):
    obj.data.materials.append(mat)
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    if bevel:
        mod = obj.modifiers.new("Bevel", "BEVEL")
        mod.width, mod.segments, mod.limit_method = bevel, 2, "NONE"
        bpy.ops.object.modifier_apply(modifier=mod.name)
    bpy.ops.object.shade_smooth()
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    obj.select_set(False)
    return obj


def box(size, loc, mat, bevel=0.12, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc, rotation=rot)
    obj = bpy.context.active_object
    obj.scale = size
    bpy.ops.object.transform_apply(scale=True)
    return _finish(obj, mat, min(bevel, min(size) * 0.45))


def cylinder(radius, depth, loc, mat, vertices=16, bevel=0.06, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_cylinder_add(radius=radius, depth=depth, location=loc, vertices=vertices, rotation=rot)
    return _finish(bpy.context.active_object, mat, min(bevel, radius * 0.4))


def cone(radius, depth, loc, mat, vertices=16, radius2=0.0):
    bpy.ops.mesh.primitive_cone_add(radius1=radius, radius2=radius2, depth=depth, location=loc, vertices=vertices)
    return _finish(bpy.context.active_object, mat, 0)


def sphere(radius, loc, mat, scale=(1, 1, 1), segments=16, rings=10):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=radius, location=loc, segments=segments, ring_count=rings)
    obj = bpy.context.active_object
    obj.scale = scale
    return _finish(obj, mat, 0)


def hip_roof(w, d, h, loc, mat):
    """A hipped roof over a w (along X) x d footprint: ridge along X, sloped ends; base at loc's z."""
    x, y, z = loc
    r = max(w / 2 - d / 2, 0.01)  # half ridge length
    verts = [
        (x - w / 2, y - d / 2, z), (x + w / 2, y - d / 2, z), (x + w / 2, y + d / 2, z), (x - w / 2, y + d / 2, z),
        (x - r, y, z + h), (x + r, y, z + h),
    ]
    faces = [(0, 1, 5, 4), (2, 3, 4, 5), (1, 2, 5), (3, 0, 4), (3, 2, 1, 0)]
    mesh = bpy.data.meshes.new("roof")
    mesh.from_pydata(verts, [], faces)
    obj = bpy.data.objects.new("roof", mesh)
    bpy.context.scene.collection.objects.link(obj)
    return _finish(obj, mat, 0)


def prism(w, h, depth, loc, mat):
    """A triangular gable (pediment): base w on loc, apex h above, `depth` thick along Y."""
    x, y, z = loc
    d = depth / 2
    verts = [(x - w / 2, y - d, z), (x + w / 2, y - d, z), (x, y - d, z + h), (x - w / 2, y + d, z), (x + w / 2, y + d, z), (x, y + d, z + h)]
    faces = [(0, 1, 2), (3, 5, 4), (0, 3, 4, 1), (1, 4, 5, 2), (2, 5, 3, 0)]
    mesh = bpy.data.meshes.new("prism")
    mesh.from_pydata(verts, [], faces)
    obj = bpy.data.objects.new("prism", mesh)
    bpy.context.scene.collection.objects.link(obj)
    return _finish(obj, mat, 0)


def mound(radius, height, mat, segments=32):
    """A soft hill: the top half of a squashed sphere, cut flat at z = 0."""
    bpy.ops.mesh.primitive_uv_sphere_add(radius=1, segments=segments, ring_count=16)
    obj = bpy.context.active_object
    bm = bmesh.new()
    bm.from_mesh(obj.data)
    bmesh.ops.bisect_plane(bm, geom=bm.verts[:] + bm.edges[:] + bm.faces[:], plane_co=(0, 0, 0), plane_no=(0, 0, 1), clear_inner=True)
    bm.to_mesh(obj.data)
    bm.free()
    obj.scale = (radius, radius, height)
    return _finish(obj, mat, 0)


def export(name):
    """Join every mesh into one object called `name` and write the glb."""
    meshes = [o for o in bpy.context.scene.objects if o.type == "MESH"]
    for o in meshes:
        o.select_set(True)
    bpy.context.view_layer.objects.active = meshes[0]
    bpy.ops.object.join()
    joined = bpy.context.active_object
    joined.name = name
    joined.data.name = name
    path = out_path()
    bpy.ops.export_scene.gltf(filepath=path, export_format="GLB", export_yup=True, export_animations=False)
    print("wrote", path)
