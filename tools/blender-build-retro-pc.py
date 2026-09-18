"""Ретро-компьютер для столика: «Old computer 02» с BlenderKit (Free Poly, CC0) —
бежевый ЭЛТ-монитор на системном блоке, начало 2000-х → public/models/computer.glb.

Запуск:
  blender --background --factory-startup --python tools/blender-build-retro-pc.py
  npx @gltf-transform/cli draco public/models/computer.glb public/models/computer.glb   # сжатие: сцена грузит Draco

Что делаем:
- модель — один меш на 335k полигонов; клавиатура, мышь и провода лежат на своём
  материале (06___Default) — удаляем их, монитор и блок (03___Default) оставляем;
- прореживаем до ~16k треугольников, текстуры 1K уходят в WebP;
- экран — своя изогнутая пластина перед стеклом кинескопа: выпуклость стекла
  снята лучами (x ≈ −0.0245 − 0.62·dy² − 0.55·dz² в метрах модели), пластина на 9 мм впереди, развёртка 0..1;
- фронт модели смотрит в +X Blender; поворачиваем на −90° вокруг Z, чтобы в three.js
  он смотрел в +Z. Начало координат — под центром корпуса.
"""
import bpy, bmesh, math, os
from mathutils import Matrix

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
SRC = os.path.join(ROOT, "assets-src", "old-computer-02.blend")
OUT = os.path.join(ROOT, "public", "models", "computer.glb")

# стекло кинескопа в координатах модели (м): y — ширина, z — высота
Y0, Y1, Z0, Z1 = -0.100, 0.150, 0.210, 0.442
CY, CZ = (Y0 + Y1) / 2, (Z0 + Z1) / 2

bpy.ops.wm.open_mainfile(filepath=SRC)
src = bpy.data.objects["defaultMaterial.003"]
for o in list(bpy.data.objects):
    if o is not src:
        bpy.data.objects.remove(o, do_unlink=True)
mw = src.matrix_world.copy()
src.parent = None
src.matrix_world = mw
bpy.context.view_layer.objects.active = src
src.select_set(True)
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

keep_index = [i for i, s in enumerate(src.material_slots) if s.material and s.material.name == "03___Default"][0]
bm = bmesh.new()
bm.from_mesh(src.data)
bmesh.ops.delete(bm, geom=[f for f in bm.faces if f.material_index != keep_index], context="FACES")
bm.to_mesh(src.data)
bm.free()
dec = src.modifiers.new("dec", "DECIMATE")
dec.ratio = 0.25
bpy.ops.object.modifier_apply(modifier="dec")
# убрать неиспользуемый слот материала клавиатуры
for i in reversed(range(len(src.material_slots))):
    if i != keep_index:
        src.active_material_index = i
        bpy.ops.object.material_slot_remove()

# пластина экрана
N = 24
me = bpy.data.meshes.new("screen")
verts, faces, uvs = [], [], []
for j in range(N + 1):
    for i in range(N + 1):
        u, v = i / N, j / N
        y = Y0 + (Y1 - Y0) * u
        z = Z0 + (Z1 - Z0) * v
        dy, dz = y - 0.025, z - 0.32
        x = -0.0245 - 0.62 * dy * dy - 0.55 * dz * dz + 0.009  # 9 мм перед стеклом: вблизи и под углом стекло модели проступало сквозь пластину
        verts.append((x, y, z))
for j in range(N):
    for i in range(N):
        a = j * (N + 1) + i
        faces.append((a, a + 1, a + N + 2, a + N + 1))
me.from_pydata(verts, [], faces)
uv = me.uv_layers.new(name="UVMap")
for poly in me.polygons:
    for li in poly.loop_indices:
        x, y, z = verts[me.loops[li].vertex_index]
        uv.data[li].uv = ((y - Y0) / (Y1 - Y0), (z - Z0) / (Z1 - Z0))
mat = bpy.data.materials.new("screenSurface")
me.materials.append(mat)
screen = bpy.data.objects.new("screen", me)
bpy.context.scene.collection.objects.link(screen)
print("SCREEN_SIZE", round(Y1 - Y0, 4), round(Z1 - Z0, 4))

# центр корпуса → начало координат, поворот фронтом в −Y Blender (= +Z three.js)
vs = [v.co for v in src.data.vertices]
cx = (min(v.x for v in vs) + max(v.x for v in vs)) / 2
cy = (min(v.y for v in vs) + max(v.y for v in vs)) / 2
cz = min(v.z for v in vs)
fix = Matrix.Rotation(-math.pi / 2, 4, "Z") @ Matrix.Translation((-cx, -cy, -cz))
root = bpy.data.objects.new("computer", None)
bpy.context.scene.collection.objects.link(root)
for o in (src, screen):
    o.data.transform(fix)
    o.parent = root
src.name = "case"
print("TRIS", sum(len(p.vertices) - 2 for o in (src, screen) for p in o.data.polygons))

bpy.ops.export_scene.gltf(filepath=OUT, export_format="GLB", export_apply=True, export_yup=True,
                          export_image_format="WEBP", export_image_quality=82)
print("EXPORTED", OUT, os.path.getsize(OUT))
