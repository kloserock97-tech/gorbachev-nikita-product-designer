"""Цветы переднего плана первого экрана (v72): куртина ромашек, васильков и травы в контровом закатном свете.

Зачем. На референсе у нижних углов кадра размытые цветы у самой камеры — от них кадр получает передний план
и глубину. Рисовать их в сцене травинками нельзя: у камеры они должны быть сильно не в фокусе, а честная
расфокусировка по глубине стоит отдельного прохода. Поэтому они рендерятся здесь один раз, размываются в
ffmpeg и лежат в сцене плоским слоем перед камерой (src/scene/foreground.ts).

Всё собрано в этом скрипте из примитивов — ни одной чужой модели.

Запуск (SIDE=left|right — две разные куртины, OUT — куда положить PNG):
  SIDE=left OUT=fg-left.png "C:/Program Files/Blender Foundation/Blender 5.1/blender.exe" --background --factory-startup --python tools/blender-foreground-flowers.py

Дальше: предумножить альфу, размыть, вернуть альфу и пережать в WebP (команда — в docs/prompts/v72-hero-depth.md).
"""
import math, os, random, sys
import bpy
from mathutils import Vector, Euler

SIDE = os.environ.get("SIDE", "left")
OUT = os.environ.get("OUT", os.path.join(os.path.expanduser("~"), f"fg-{SIDE}.png"))
SIZE = int(os.environ.get("SIZE", "1024"))
rng = random.Random(7 if SIDE == "left" else 19)

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene


def mat(name, color, translucent=0.0, emit=0.0):
    """Диффуз с долей просвечивания: против солнца лепесток и травинка светятся, как на закате."""
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    diff = nt.nodes.new("ShaderNodeBsdfDiffuse")
    diff.inputs["Color"].default_value = color
    tr = nt.nodes.new("ShaderNodeBsdfTranslucent")
    tr.inputs["Color"].default_value = color
    mix = nt.nodes.new("ShaderNodeMixShader")
    mix.inputs[0].default_value = translucent
    nt.links.new(diff.outputs[0], mix.inputs[1])
    nt.links.new(tr.outputs[0], mix.inputs[2])
    shader = mix
    if emit > 0:
        em = nt.nodes.new("ShaderNodeEmission")
        em.inputs["Color"].default_value = color
        em.inputs["Strength"].default_value = emit
        add = nt.nodes.new("ShaderNodeAddShader")
        nt.links.new(mix.outputs[0], add.inputs[0])
        nt.links.new(em.outputs[0], add.inputs[1])
        shader = add
    nt.links.new(shader.outputs[0], out.inputs["Surface"])
    return m


PETAL = mat("petal", (0.92, 0.88, 0.80, 1), translucent=0.45)
DISC = mat("disc", (0.95, 0.62, 0.08, 1), translucent=0.2, emit=0.15)
BLUE = mat("cornflower", (0.34, 0.36, 0.92, 1), translucent=0.4)
PINK = mat("clover", (0.86, 0.46, 0.72, 1), translucent=0.4)
STEM = mat("stem", (0.10, 0.22, 0.04, 1), translucent=0.5)
GRASS = mat("grass", (0.14, 0.26, 0.05, 1), translucent=0.55)


def curve(points, radius, m, name="stem", flat=1.0):
    cu = bpy.data.curves.new(name, "CURVE")
    cu.dimensions = "3D"
    cu.bevel_depth = radius
    cu.bevel_resolution = 2
    cu.use_fill_caps = True
    sp = cu.splines.new("BEZIER")
    sp.bezier_points.add(len(points) - 1)
    for bp, (co, r) in zip(sp.bezier_points, points):
        bp.co = Vector(co)
        bp.radius = r
        bp.handle_left_type = bp.handle_right_type = "AUTO"
    ob = bpy.data.objects.new(name, cu)
    ob.data.materials.append(m)
    ob.scale = (1, flat, 1)
    scene.collection.objects.link(ob)
    return ob


def daisy(pos, tilt, size):
    """Ромашка: жёлтый диск, двадцать лепестков чашечкой, стебель вниз до земли."""
    head = Vector(pos)
    bpy.ops.mesh.primitive_uv_sphere_add(radius=size * 0.22, location=head, segments=24, ring_count=12)
    d = bpy.context.object
    d.scale = (1, 1, 0.45)
    d.data.materials.append(DISC)
    parts = [d]
    n = 20
    for i in range(n):
        a = i / n * math.tau + rng.uniform(-0.05, 0.05)
        bpy.ops.mesh.primitive_uv_sphere_add(radius=1, segments=12, ring_count=6)
        p = bpy.context.object
        p.scale = (size * 0.42, size * 0.075, size * 0.02)
        r = size * 0.5
        p.location = head + Vector((math.cos(a) * r, math.sin(a) * r, size * 0.04))
        p.rotation_euler = Euler((0, -0.22 + rng.uniform(-0.08, 0.08), a))
        p.data.materials.append(PETAL)
        parts.append(p)
    for p in parts:
        p.select_set(True)
    bpy.context.view_layer.objects.active = d
    bpy.ops.object.join()
    d.rotation_euler = tilt
    bpy.ops.object.select_all(action="DESELECT")
    base = Vector((pos[0] + rng.uniform(-0.03, 0.03), pos[1] + rng.uniform(-0.03, 0.03), -0.7))
    mid = (head + base) / 2 + Vector((rng.uniform(-0.03, 0.03), 0, 0))
    curve([(base, 1.0), (mid, 0.9), (head - Vector((0, 0, size * 0.05)), 0.8)], size * 0.035, STEM)


def puff(pos, size, m):
    """Василёк или клевер: шапка из мелких лепестков-капель."""
    head = Vector(pos)
    for i in range(26):
        v = Vector((rng.uniform(-1, 1), rng.uniform(-1, 1), rng.uniform(-0.2, 1))).normalized()
        bpy.ops.mesh.primitive_uv_sphere_add(radius=size * rng.uniform(0.16, 0.24), location=head + v * size * 0.45, segments=10, ring_count=6)
        o = bpy.context.object
        o.scale = (1, 1, 1.6)
        o.rotation_euler = v.to_track_quat("Z", "Y").to_euler()
        o.data.materials.append(m)
    base = Vector((pos[0], pos[1], -0.7))
    curve([(base, 1.0), ((head + base) / 2, 0.9), (head, 0.7)], size * 0.05, STEM)


def blade(x, y, h, lean):
    pts = [(Vector((x, y, -0.7)), 1.0), (Vector((x + lean * 0.3, y, h * 0.5)), 0.7), (Vector((x + lean, y + rng.uniform(-0.02, 0.02), h)), 0.05)]
    curve(pts, 0.007, GRASS, "blade", flat=0.3)


# Куртина: камера смотрит с уровня травы, чуть снизу. Левая — ромашки выше и клонятся вправо, в кадр;
# правая — ниже и гуще, с васильками. Всё в пределах 0.5 м, камера в метре.
lean = 1 if SIDE == "left" else -1
for i in range(7 if SIDE == "left" else 6):
    x = rng.uniform(-0.28, 0.28)
    y = rng.uniform(-0.12, 0.2)
    z = rng.uniform(0.05, 0.42 if SIDE == "left" else 0.3)
    daisy((x, y, z), Euler((math.radians(rng.uniform(55, 80)), math.radians(rng.uniform(-25, 25)), math.radians(rng.uniform(-30, 30)) * lean)), rng.uniform(0.1, 0.14))
for i in range(3 if SIDE == "left" else 5):
    puff((rng.uniform(-0.3, 0.3), rng.uniform(-0.1, 0.2), rng.uniform(0.0, 0.3)), rng.uniform(0.06, 0.08), BLUE if i % 2 == 0 else PINK)
for i in range(34):
    blade(rng.uniform(-0.4, 0.4), rng.uniform(-0.15, 0.25), rng.uniform(0.15, 0.55), rng.uniform(-0.12, 0.12) + 0.05 * lean)

# Свет: солнце низко за куртиной (контровой), тёплое небо; кадр прозрачный
sun = bpy.data.lights.new("sun", "SUN")
sun.energy = 5.0
sun.color = (1.0, 0.78, 0.5)
sun.angle = math.radians(3)
so = bpy.data.objects.new("sun", sun)
so.rotation_euler = Euler((math.radians(96), 0, math.radians(180 + 25 * lean)))
scene.collection.objects.link(so)
world = bpy.data.worlds.new("w")
world.use_nodes = True
bg = world.node_tree.nodes["Background"]
bg.inputs["Color"].default_value = (0.95, 0.80, 0.60, 1)
bg.inputs["Strength"].default_value = 0.75
scene.world = world

cam_data = bpy.data.cameras.new("cam")
cam_data.lens = 50
cam = bpy.data.objects.new("cam", cam_data)
cam.location = (0, -1.25, 0.12)
cam.rotation_euler = Euler((math.radians(86), 0, 0))
scene.collection.objects.link(cam)
scene.camera = cam

scene.render.engine = "CYCLES"
try:
    prefs = bpy.context.preferences.addons["cycles"].preferences
    prefs.compute_device_type = "CUDA"
    prefs.get_devices()
    for d in prefs.devices:
        d.use = True
    scene.cycles.device = "GPU"
except Exception:
    scene.cycles.device = "CPU"
scene.cycles.samples = 96
scene.cycles.use_denoising = True
scene.render.resolution_x = SIZE
scene.render.resolution_y = SIZE
scene.render.film_transparent = True
scene.view_settings.view_transform = "Standard"
scene.render.image_settings.file_format = "PNG"
scene.render.image_settings.color_mode = "RGBA"
scene.render.filepath = OUT
bpy.ops.render.render(write_still=True)
sys.stderr.write("готово: %s\n" % OUT)
