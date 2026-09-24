"""Предмет для карточки кейса «Никто не назначал».

Зачем. У каждого кейса на карточке свой предмет: парящая скульптура из тонированного стекла и матового
металла, без тени, на прозрачном фоне (см. docs/case-preview-art-direction.md). Остальные шесть рисовал
генератор картинок, которого в этой сессии нет, поэтому седьмой собран в Blender — так он попадает в ту же
семью по материалам и свету, а не выбивается из ряда.

Что за предмет. Камертон в стеклянном основании: лид задаёт тон, а звучит команда. Металл повторяет
стержни из кейса «Риски ИИ-агентов», стекло — куб оттуда же, только в тёплом янтаре под палитру кейса,
светящийся шар между ветвями — тот же приём, что и жемчужина в ядре соседнего предмета.

Запуск:
  "C:/Program Files/Blender Foundation/Blender 5.1/blender.exe" --background --python tools/blender-lead-object.py

Результат: <папка сессии>/lead-object.png, 1400×1400 с прозрачностью. Дальше его обрезают по содержимому
и пережимают в avif/webp — как остальные предметы.
"""

import math
import os
import sys

import bpy
from mathutils import Vector

OUT = os.environ.get("LEAD_OUT", os.path.join(os.path.expanduser("~"), "lead-object.png"))
SIZE = int(os.environ.get("LEAD_SIZE", "1400"))
SAMPLES = int(os.environ.get("LEAD_SAMPLES", "220"))

AMBER = (0.70, 0.43, 0.11, 1.0)      # янтарное стекло под палитру кейса
STEEL = (0.74, 0.74, 0.72, 1.0)      # матовый металл, как стержни у соседнего предмета
GLOW = (1.0, 0.92, 0.76, 1.0)        # тёплый свет внутри шара


def clear():
    bpy.ops.wm.read_factory_settings(use_empty=True)


def material(name, build):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nodes, links = mat.node_tree.nodes, mat.node_tree.links
    nodes.clear()
    out = nodes.new("ShaderNodeOutputMaterial")
    out.location = (300, 0)
    shader = build(nodes, links)
    links.new(shader.outputs[0], out.inputs["Surface"])
    return mat


def glass(nodes, links):
    p = nodes.new("ShaderNodeBsdfPrincipled")
    p.inputs["Base Color"].default_value = AMBER
    p.inputs["Roughness"].default_value = 0.04
    p.inputs["IOR"].default_value = 1.52
    # в 4.x и новее пропускание живёт в «Transmission Weight»
    for key in ("Transmission Weight", "Transmission"):
        if key in p.inputs:
            p.inputs[key].default_value = 1.0
            break
    return p


def metal(nodes, links):
    p = nodes.new("ShaderNodeBsdfPrincipled")
    p.inputs["Base Color"].default_value = STEEL
    p.inputs["Metallic"].default_value = 1.0
    p.inputs["Roughness"].default_value = 0.26
    return p


def lamp(nodes, links):
    """Шар светится изнутри и чуть отражает — как жемчужина у соседнего предмета."""
    mix = nodes.new("ShaderNodeMixShader")
    emit = nodes.new("ShaderNodeEmission")
    emit.inputs["Color"].default_value = GLOW
    emit.inputs["Strength"].default_value = 1.35
    diff = nodes.new("ShaderNodeBsdfPrincipled")
    diff.inputs["Base Color"].default_value = (0.97, 0.93, 0.86, 1.0)
    diff.inputs["Roughness"].default_value = 0.18
    mix.inputs[0].default_value = 0.42
    links.new(diff.outputs[0], mix.inputs[1])
    links.new(emit.outputs[0], mix.inputs[2])
    return mix


def bevel(obj, width=0.012, segments=4):
    m = obj.modifiers.new("Bevel", "BEVEL")
    m.width = width
    m.segments = segments
    m.limit_method = "ANGLE"
    m.angle_limit = math.radians(40)


def rod(points, radius, name, mat):
    """Цельный пруток по точкам: кривая с круглым сечением. Так дуга камертона не распадается на куски,
    как было бы из отдельных цилиндров, и кончики скругляются сами."""
    curve = bpy.data.curves.new(name, "CURVE")
    curve.dimensions = "3D"
    curve.bevel_depth = radius
    curve.bevel_resolution = 10
    curve.resolution_u = 24
    curve.use_fill_caps = True
    spline = curve.splines.new("BEZIER")
    spline.bezier_points.add(len(points) - 1)
    for bp, co in zip(spline.bezier_points, points):
        bp.co = Vector(co)
        bp.handle_left_type = bp.handle_right_type = "AUTO"
    obj = bpy.data.objects.new(name, curve)
    obj.data.materials.append(mat)
    bpy.context.collection.objects.link(obj)
    return obj


def build():
    glass_mat = material("amber glass", glass)
    metal_mat = material("brushed steel", metal)
    lamp_mat = material("core", lamp)

    # камертон одной кривой: левая ветвь — дуга внизу — правая ветвь
    rod(
        [(-0.46, 0, 1.46), (-0.46, 0, 0.12), (-0.30, 0, -0.28), (0.30, 0, -0.28), (0.46, 0, 0.12), (0.46, 0, 1.46)],
        0.082, "fork", metal_mat,
    )
    # ножка вниз, в стеклянное основание
    rod([(0, 0, -0.30), (0, 0, -1.02)], 0.088, "stem", metal_mat)

    # основание: стеклянный брусок, на нём всё стоит
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, -1.26))
    base = bpy.context.object
    base.name = "base"
    base.scale = (0.86, 0.74, 0.34)
    bpy.ops.object.transform_apply(scale=True)
    bevel(base, 0.05, 6)
    base.data.materials.append(glass_mat)

    # светящийся шар между ветвями — тот самый тон
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.27, location=(0, 0, 0.62), segments=64, ring_count=32)
    core = bpy.context.object
    core.name = "core"
    bpy.ops.object.shade_smooth()
    core.data.materials.append(lamp_mat)

    # стеклянные кубики в воздухе — мотив соседнего предмета, он держит карточки в одной семье
    for pos, size, rot in (
        ((-0.92, -0.22, 1.08), 0.34, 24),
        ((0.95, 0.18, 0.16), 0.27, -32),
        ((-0.66, 0.26, -0.72), 0.22, 41),
    ):
        bpy.ops.mesh.primitive_cube_add(size=size, location=pos)
        c = bpy.context.object
        c.rotation_euler = (math.radians(rot * 0.6), math.radians(rot), math.radians(rot * 0.4))
        bevel(c, size * 0.09, 5)
        c.data.materials.append(glass_mat)


def light():
    # мягкий рисующий свет слева сверху, заполняющий справа и контровой сзади — как на остальных предметах
    for name, loc, rot, size, power in (
        ("key", (-2.6, -2.4, 3.1), (math.radians(48), 0, math.radians(-40)), 5.0, 900),
        ("fill", (3.0, -1.6, 0.8), (math.radians(78), 0, math.radians(62)), 4.0, 260),
        ("rim", (0.4, 3.2, 1.9), (math.radians(-64), 0, math.radians(6)), 3.4, 420),
    ):
        data = bpy.data.lights.new(name, "AREA")
        data.energy = power
        data.size = size
        obj = bpy.data.objects.new(name, data)
        obj.location = loc
        obj.rotation_euler = rot
        bpy.context.collection.objects.link(obj)

    world = bpy.data.worlds.new("w")
    world.use_nodes = True
    bg = world.node_tree.nodes["Background"]
    bg.inputs["Color"].default_value = (0.86, 0.84, 0.80, 1.0)
    bg.inputs["Strength"].default_value = 0.55
    bpy.context.scene.world = world


def camera():
    cam_data = bpy.data.cameras.new("cam")
    cam_data.lens = 82
    cam = bpy.data.objects.new("cam", cam_data)
    cam.location = (0.0, -8.4, 0.18)
    cam.rotation_euler = (math.radians(89.0), 0, 0)
    bpy.context.collection.objects.link(cam)
    bpy.context.scene.camera = cam


def render():
    sc = bpy.context.scene
    sc.render.engine = "CYCLES"
    try:
        sc.cycles.device = "GPU"
        prefs = bpy.context.preferences.addons["cycles"].preferences
        prefs.compute_device_type = "CUDA"
        prefs.get_devices()
        for d in prefs.devices:
            d.use = True
    except Exception:
        sc.cycles.device = "CPU"
    sc.cycles.samples = SAMPLES
    sc.cycles.use_denoising = True
    sc.cycles.transmission_bounces = 12
    sc.cycles.transparent_max_bounces = 16
    sc.render.resolution_x = SIZE
    sc.render.resolution_y = SIZE
    sc.render.film_transparent = True          # фон прозрачный: предмет ложится на сцену карточки
    sc.render.image_settings.file_format = "PNG"
    sc.render.image_settings.color_mode = "RGBA"
    sc.render.filepath = OUT
    bpy.ops.render.render(write_still=True)


clear()
build()
light()
camera()
render()
sys.stderr.write("готово: %s\n" % OUT)
