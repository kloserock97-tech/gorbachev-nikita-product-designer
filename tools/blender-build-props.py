"""Собирает реквизит сцены (кресло + столик + кружка с блюдцем) и экспортирует GLB.

Запуск:
  blender --background --factory-startup --python tools/blender-build-props.py -- assets-src

v29: все модели — те, что можно публиковать вместе с сайтом и репозиторием.
  кресло  — Poly Haven «Modern Arm Chair 01» (Vibrant Nordic), CC0;
  столик  — Poly Haven «Side Table Tall 01» (James Ray Cock), CC0, ножки укорочены до высоты прежнего столика;
  кружка  — своя: профиль вращения и ручка строятся в этом скрипте.
Раньше здесь стояли Hertford Chair, Floyd Side Table и кружка с BlenderKit под лицензией Royalty Free: она
запрещает раздавать ассет в той же форме, а GLB в публичном репозитории и на сайте — это ровно раздача.

Исходники Poly Haven (glTF 1k) лежат в assets-src/polyhaven/<id>/ — папка не в git, скачиваются заново
по адресам https://polyhaven.com/a/modern_arm_chair_01 и https://polyhaven.com/a/side_table_tall_01.

Имена узлов, на которые опирается сцена (src/scene/HillScene.ts): «TableTop» — столешница, на неё встаёт
компьютер; «Mug» — кружка с блюдцем, сдвигается на край столешницы; материал «Cushion» — подушки кресла.
"""
import bpy, bmesh, math, os, sys
from mathutils import Vector

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
SRC = os.path.abspath(argv[0]) if argv else os.path.join(ROOT, "assets-src")
OUT = os.path.join(ROOT, "public", "models", "props.glb")
TEX_MAX = 1024

# Габариты прежнего реквизита: композиция кадра, место Келли и компьютера подобраны под них.
CHAIR_HEIGHT = 0.747     # высота кресла по спинке, м (как у прежнего)
TABLE_HEIGHT = 0.445     # высота столика, м
TABLE_X = 0.62           # столик справа от кресла
TABLE_Y = -0.02

scene = bpy.context.scene
for o in list(bpy.data.objects):
    bpy.data.objects.remove(o, do_unlink=True)


def import_gltf(asset_id):
    path = os.path.join(SRC, "polyhaven", asset_id, f"{asset_id}_1k.gltf")
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=path)
    return [o for o in bpy.data.objects if o not in before]


def roots(objs):
    return [o for o in objs if o.parent is None or o.parent not in objs]


def bounds(objs):
    bpy.context.view_layer.update()
    pts = []
    for o in objs:
        if o.type == "MESH":
            pts += [o.matrix_world @ Vector(c) for c in o.bound_box]
    mn = Vector((min(p.x for p in pts), min(p.y for p in pts), min(p.z for p in pts)))
    mx = Vector((max(p.x for p in pts), max(p.y for p in pts), max(p.z for p in pts)))
    return mn, mx


def apply_scale(objs):
    bpy.ops.object.select_all(action="DESELECT")
    for o in objs:
        if o.type == "MESH":
            o.select_set(True)
            bpy.context.view_layer.objects.active = o
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)


def place_on_ground(objs, cx, cy):
    mn, mx = bounds(objs)
    for r in roots(objs):
        r.location.x += cx - (mn.x + mx.x) / 2
        r.location.y += cy - (mn.y + mx.y) / 2
        r.location.z -= mn.z


# ── кресло ──────────────────────────────────────────────────────────────────
chair = import_gltf("modern_arm_chair_01")
mn, mx = bounds(chair)
k = CHAIR_HEIGHT / (mx.z - mn.z)
for r in roots(chair):
    r.scale *= k
# Poly Haven смотрит сиденьем на -Y в Blender, как и нужно сцене (в three.js это +Z, к камере)
place_on_ground(chair, 0.0, 0.0)

# Подушки: чёрная кожа оригинала в кремовую ткань, как было в кадре. Нормали оставляем — складки
# на подушках остаются, а цвет и блеск ткани задаём сами.
for o in chair:
    if o.type != "MESH":
        continue
    for slot in o.material_slots:
        m = slot.material
        if m and "pillow" in m.name.lower():
            m.name = "Cushion"
            bsdf = next((n for n in m.node_tree.nodes if n.type == "BSDF_PRINCIPLED"), None)
            if bsdf:
                base = bsdf.inputs["Base Color"]
                for link in list(base.links):
                    m.node_tree.links.remove(link)
                base.default_value = (0.78, 0.70, 0.56, 1.0)
                rough = bsdf.inputs["Roughness"]
                for link in list(rough.links):
                    m.node_tree.links.remove(link)
                rough.default_value = 0.92
                if "Metallic" in bsdf.inputs:
                    for link in list(bsdf.inputs["Metallic"].links):
                        m.node_tree.links.remove(link)
                    bsdf.inputs["Metallic"].default_value = 0.0

# ── столик ──────────────────────────────────────────────────────────────────
table = import_gltf("side_table_tall_01")
apply_scale(table)
mn, mx = bounds(table)
# Укорачиваем ножки: всё, что ниже столешницы, сжимается по высоте, сама столешница остаётся прежней толщины.
top_band = 0.05
for o in table:
    if o.type != "MESH":
        continue
    me = o.data
    for v in me.vertices:
        w = o.matrix_world @ v.co
        cut = mx.z - top_band
        if w.z < cut:
            nz = mn.z + (w.z - mn.z) * ((TABLE_HEIGHT - top_band) / (cut - mn.z))
        else:
            nz = mn.z + (TABLE_HEIGHT - top_band) + (w.z - cut)
        local = o.matrix_world.inverted() @ Vector((w.x, w.y, nz))
        v.co = local
    me.update()
place_on_ground(table, TABLE_X, TABLE_Y)
t_mn, t_mx = bounds(table)

# Столешница отдельным узлом с понятным именем: по ней сцена ставит компьютер.
top = bpy.data.objects.new("TableTop", None)
scene.collection.objects.link(top)
top.location = ((t_mn.x + t_mx.x) / 2, (t_mn.y + t_mx.y) / 2, t_mx.z)
# ── кружка с блюдцем (своя) ─────────────────────────────────────────────────
def lathe(name, profile, segments=40):
    """Тело вращения по профилю [(радиус, высота), ...] вокруг оси Z."""
    me = bpy.data.meshes.new(name)
    bm = bmesh.new()
    rings = []
    for i in range(segments):
        a = 2 * math.pi * i / segments
        rings.append([bm.verts.new((r * math.cos(a), r * math.sin(a), z)) for r, z in profile])
    for i in range(segments):
        a, b = rings[i], rings[(i + 1) % segments]
        for j in range(len(profile) - 1):
            bm.faces.new((a[j], b[j], b[j + 1], a[j + 1]))
    bm.normal_update()
    bm.to_mesh(me)
    bm.free()
    for p in me.polygons:
        p.use_smooth = True
    obj = bpy.data.objects.new(name, me)
    scene.collection.objects.link(obj)
    return obj


def glaze(name, color, roughness):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    bsdf = next(n for n in m.node_tree.nodes if n.type == "BSDF_PRINCIPLED")
    bsdf.inputs["Base Color"].default_value = color
    bsdf.inputs["Roughness"].default_value = roughness
    return m


porcelain = glaze("Porcelain", (0.93, 0.92, 0.88, 1.0), 0.28)
coffee = glaze("Coffee", (0.09, 0.05, 0.03, 1.0), 0.12)

mug_root = bpy.data.objects.new("Mug", None)
scene.collection.objects.link(mug_root)

# профиль: блюдце — плоское, с приподнятым краем
saucer = lathe("Saucer", [(0.0, 0.0), (0.045, 0.0), (0.058, 0.004), (0.072, 0.012), (0.074, 0.014),
                          (0.070, 0.013), (0.056, 0.007), (0.040, 0.006), (0.0, 0.006)])
# кружка — стенка с толщиной: снаружи вверх, по кромке, внутри вниз до дна
mug = lathe("MugBody", [(0.0, 0.008), (0.028, 0.008), (0.033, 0.012), (0.036, 0.03), (0.038, 0.07),
                        (0.039, 0.086), (0.035, 0.087), (0.034, 0.07), (0.032, 0.03), (0.027, 0.015), (0.0, 0.015)])
surface = lathe("CoffeeSurface", [(0.0, 0.074), (0.0335, 0.074)], segments=40)
# ручка — половина тора
bpy.ops.mesh.primitive_torus_add(major_radius=0.022, minor_radius=0.005, major_segments=24, minor_segments=10,
                                 location=(0.045, 0.0, 0.05), rotation=(math.pi / 2, 0.0, 0.0))
handle = bpy.context.active_object
handle.name = "MugHandle"
bpy.ops.object.mode_set(mode="EDIT")
bm = bmesh.from_edit_mesh(handle.data)
for v in [v for v in bm.verts if (handle.matrix_world @ v.co).x < 0.036]:
    bm.verts.remove(v)
bmesh.update_edit_mesh(handle.data)
bpy.ops.object.mode_set(mode="OBJECT")

for o, m in ((saucer, porcelain), (mug, porcelain), (handle, porcelain), (surface, coffee)):
    o.data.materials.clear()
    o.data.materials.append(m)
    o.parent = mug_root

# кружка на столешнице, как раньше чашка
mug_root.location = ((t_mn.x + t_mx.x) / 2 - 0.03, (t_mn.y + t_mx.y) / 2 + 0.02, t_mx.z)
mug_root.rotation_euler = (0.0, 0.0, math.radians(-35))

# ── общий корень ────────────────────────────────────────────────────────────
root = bpy.data.objects.new("props", None)
scene.collection.objects.link(root)
bpy.context.view_layer.update()
for o in list(bpy.data.objects):
    if o is root or o.parent is not None:
        continue
    mw = o.matrix_world.copy()
    o.parent = root
    o.matrix_world = mw

# Карты высоты вебу не нужны, текстуры не крупнее 1K.
for mat in bpy.data.materials:
    if not mat.use_nodes:
        continue
    for n in list(mat.node_tree.nodes):
        if n.type == "DISPLACEMENT":
            mat.node_tree.nodes.remove(n)
for img in bpy.data.images:
    if img.size[0] > TEX_MAX:
        img.scale(TEX_MAX, TEX_MAX)

os.makedirs(os.path.dirname(OUT), exist_ok=True)
bpy.ops.export_scene.gltf(
    filepath=OUT,
    export_format="GLB",
    export_image_format="JPEG",
    export_jpeg_quality=85,
    export_apply=True,
    export_yup=True,
    use_selection=False,
)
mn, mx = bounds([o for o in bpy.data.objects if o.type == "MESH"])
c_mn, c_mx = bounds(chair)
print("CHAIR_BOUNDS", tuple(round(v, 3) for v in c_mn), tuple(round(v, 3) for v in c_mx))
print("TABLE_BOUNDS", tuple(round(v, 3) for v in t_mn), tuple(round(v, 3) for v in t_mx))
print("PROPS_BOUNDS", tuple(round(v, 3) for v in mn), tuple(round(v, 3) for v in mx))
print("EXPORTED", OUT, os.path.getsize(OUT))
