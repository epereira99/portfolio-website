"""Shared helpers for the low-poly walk scripts: flat colours, flat shading, one mesh per part.

Conventions: Blender Z up. The web path (src/journey/lowpoly/path.json) is [x, z] with Y up and the walk toward -Z;
glTF export turns Blender (x, y, z) into (x, z, -y), so a web point (x, z) is Blender (x, -z).
"""

import json
import os
import sys

import bpy

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
_materials = {}


def setup():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    _materials.clear()


def out_path():
    return sys.argv[sys.argv.index("--") + 1]


def read_path():
    """The walk's path as Blender (x, y) points."""
    with open(os.path.join(ROOT, "src", "journey", "lowpoly", "path.json")) as f:
        return [(x, -z) for x, z in json.load(f)["points"]]


def material(name, hex_color):
    if name in _materials:
        return _materials[name]
    rgb = tuple((int(hex_color[i : i + 2], 16) / 255) ** 2.2 for i in (1, 3, 5))  # sRGB -> linear
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    bsdf = m.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (*rgb, 1)
    bsdf.inputs["Roughness"].default_value = 1.0
    _materials[name] = m
    return m


def mesh(name, verts, faces, mats, face_mats=None):
    """A flat-shaded mesh object from raw geometry; face_mats picks each face's material index."""
    me = bpy.data.meshes.new(name)
    me.from_pydata(verts, [], faces)
    for m in mats:
        me.materials.append(m)
    if face_mats:
        for poly, i in zip(me.polygons, face_mats):
            poly.material_index = i
    for poly in me.polygons:
        poly.use_smooth = False
    ob = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(ob)
    return ob


def primitive(op, mat, **kw):
    """Add a mesh primitive (bpy.ops.mesh.primitive_*), give it one material, flat shaded."""
    getattr(bpy.ops.mesh, op)(**kw)
    ob = bpy.context.active_object
    ob.data.materials.append(mat)
    for poly in ob.data.polygons:
        poly.use_smooth = False
    return ob


def join(objs, name):
    """Join objects into one, transforms applied, origin at the world origin."""
    bpy.ops.object.select_all(action="DESELECT")
    for ob in objs:
        ob.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    if len(objs) > 1:
        bpy.ops.object.join()
    ob = bpy.context.active_object
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    ob.name = ob.data.name = name
    ob.select_set(False)
    return ob


def export(path, animations=False):
    os.makedirs(os.path.dirname(os.path.abspath(path)), exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=path, export_format="GLB", export_yup=True, export_apply=True, export_animations=animations,
        export_cameras=False, export_lights=False,
    )
    print("wrote", path, flush=True)
