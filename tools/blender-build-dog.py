"""Собака для холма: low-poly-dog/out/low-poly-dog-walk.blend (перекрашена под собаку Никиты,
риг 27 костей) → две позы → public/models/dog.glb.
  «Sit»  — сидит у кресла (первый экран, About, кейсы);
  «Curl» — спит клубочком на кресле (футер, v24).

Запуск:
  blender --background --factory-startup --python tools/blender-build-dog.py [-- preview.png]
  npx @gltf-transform/cli draco public/models/dog.glb public/models/dog.glb   # сжатие: сцена грузит Draco

Поза собирается тем же приёмом, что цикл ходьбы (low-poly-dog/scripts/build_walk.py):
лапы ведёт IK к целям на земле, корпус/шея/голова/хвост — повороты вокруг мировых осей,
поза снимается в ключи, констрейнты удаляются. В three поверх позы крутится голова,
шевелятся уши и виляет хвост (src/scene/dog.ts). Текстура 1024 PNG → 512 WebP.

Оси модели: вперёд −Y, вверх +Z, левый бок +X. Для «сидит» корпус поворачивается вокруг кости
Master (таз) носом вверх и опускается, задние лапы складываются, ступни ложатся вперёд.
Для «клубочка» корпус ложится на живот и изгибается дугой к левому боку: передняя часть
позвоночника и шея поворачиваются в одну сторону, круп — в другую, морда ложится на задние
лапы, хвост обнимает нос.
"""
import bpy, math, mathutils, os, sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
SRC = os.path.abspath(os.path.join(ROOT, "..", "..", "low-poly-dog", "out", "low-poly-dog-walk.blend"))
OUT = os.path.join(ROOT, "public", "models", "dog.glb")
PREVIEW = sys.argv[sys.argv.index("--") + 1] if "--" in sys.argv else None
R = math.radians

bpy.ops.wm.open_mainfile(filepath=SRC)
arm = bpy.data.objects["Rig - Cachorro"]
mesh = bpy.data.objects["Cachorro"]
scn = bpy.context.scene
pb = arm.pose.bones
names = [b.name for b in arm.data.bones]

if arm.animation_data:
    arm.animation_data_clear()
for a in list(bpy.data.actions):
    bpy.data.actions.remove(a)


def reset():
    for p in pb:
        p.rotation_mode = "QUATERNION"
        p.rotation_quaternion = (1, 0, 0, 0)
        p.location = (0, 0, 0)
        p.scale = (1, 1, 1)
    bpy.context.view_layer.update()


def wrot(name, *pairs):
    """поворот кости вокруг мировых осей (поверх текущего)"""
    p = pb[name]
    M = p.bone.matrix_local.to_quaternion()
    q = mathutils.Quaternion((1, 0, 0, 0))
    for axis, ang in pairs:
        q = mathutils.Quaternion(mathutils.Vector(axis), ang) @ q
    p.rotation_quaternion = p.rotation_quaternion @ (M.inverted() @ q @ M)


def wloc(name, delta):
    p = pb[name]
    p.location = p.bone.matrix_local.to_3x3().inverted() @ mathutils.Vector(delta)


def world_head(name):
    return arm.matrix_world @ pb[name].head


def solve_legs(targets):
    """IK лап к целям; targets: {концевая кость: мировая точка}"""
    empties = []
    for endbone, target in targets.items():
        e = bpy.data.objects.new("IK_" + endbone, None)
        scn.collection.objects.link(e)
        e.location = target
        empties.append(e)
        c = pb[endbone].constraints.new("IK")
        c.target = e
        c.chain_count = 3
        for nm in (endbone, endbone.replace("_03_", "_02_"), endbone.replace("_03_", "_01_")):
            pb[nm].lock_ik_y = True
            pb[nm].lock_ik_z = True
    bpy.context.view_layer.update()
    return empties


def flat_paws():
    """лапы плоско на земле: доворот ступни к горизонту"""
    for paw in ("Pata_Frente_L", "Pata_Frente_R", "Pata_Tras_L", "Pata_Tras_R"):
        p = pb[paw]
        r = p.bone.matrix_local.to_3x3() @ mathutils.Vector((0, 1, 0))
        c = p.matrix.to_3x3() @ mathutils.Vector((0, 1, 0))
        d = math.atan2(c.z, math.copysign(max(abs(c.y), 1e-4), c.y)) - math.atan2(r.z, r.y)
        wrot(paw, ((1, 0, 0), -d))
    bpy.context.view_layer.update()


def bake(action_name, empties):
    """снимает текущую позу (с IK) в матрицы, убирает констрейнты, пишет ключи в новое действие"""
    baked = {n: pb[n].matrix.copy() for n in names}
    for p in pb:
        for c in list(p.constraints):
            p.constraints.remove(c)
        p.lock_ik_y = p.lock_ik_z = False
    for e in empties:
        bpy.data.objects.remove(e, do_unlink=True)
    act = bpy.data.actions.new(action_name)
    act.use_fake_user = True
    arm.animation_data_create()
    arm.animation_data.action = act
    try:
        arm.animation_data.action_slot = act.slots[0] if len(act.slots) else act.slots.new("OBJECT", arm.name)
    except Exception as ex:
        print("slot:", ex)
    for f in (1, 2):
        scn.frame_set(f)
        for n in names:
            pb[n].matrix = baked[n]
            bpy.context.view_layer.update()
        for n in names:
            pb[n].keyframe_insert("location", frame=f, group=n)
            pb[n].keyframe_insert("rotation_quaternion", frame=f, group=n)
    scn.frame_set(1)
    bpy.context.view_layer.update()
    dg = bpy.context.evaluated_depsgraph_get()
    ev = mesh.evaluated_get(dg)
    ws = [ev.matrix_world @ v.co for v in ev.to_mesh().vertices]
    print(action_name.upper() + "_BOUNDS min", [round(min(v[i] for v in ws), 2) for i in range(3)], "max", [round(max(v[i] for v in ws), 2) for i in range(3)])
    ev.to_mesh_clear()
    return act


def pose_sit():
    reset()
    wloc("Master", (0, 0.05, -0.9))
    wrot("Master", ((1, 0, 0), -R(40)))
    wrot("Pescoço", ((1, 0, 0), R(22)))
    wrot("Cabeça", ((1, 0, 0), R(14)))
    wrot("Rabo_01", ((1, 0, 0), R(-18)), ((0, 0, 1), R(28)))
    wrot("Rabo_02", ((1, 0, 0), R(-6)), ((0, 0, 1), R(22)))
    bpy.context.view_layer.update()
    empties = solve_legs({
        "Perna_Frente_03_L": (0.30, -0.10, 0.03),
        "Perna_Frente_03_R": (-0.30, -0.10, 0.03),
        "Perna_Tras_03_L": (0.40, 0.62, 0.10),
        "Perna_Tras_03_R": (-0.40, 0.62, 0.10),
    })
    flat_paws()
    return bake("Sit", empties)


# клубочек: насколько изогнут корпус и куда легла морда
CURL_DROP = 1.34   # живот на земле
CURL_SPINE = R(26) # изгиб на каждом суставе позвоночника
CURL_NECK = R(40)


def pose_curl():
    reset()
    wloc("Master", (0, 0, -CURL_DROP))
    # передняя половина — дугой к левому боку (+X), круп — навстречу
    wrot("Coluna_02", ((0, 0, 1), CURL_SPINE))
    wrot("Coluna_03", ((0, 0, 1), CURL_SPINE))
    wrot("Coluna_01", ((0, 0, 1), -CURL_SPINE * 1.1))
    # шея опускается и доворачивает к хвосту, голова лежит щекой вниз
    wrot("Pescoço", ((1, 0, 0), R(48)), ((0, 0, 1), CURL_NECK))
    wrot("Cabeça", ((1, 0, 0), R(22)), ((0, 0, 1), R(18)), ((0, 1, 0), R(-14)))
    # уши прижаты
    wrot("Orelha_L", ((0, 1, 0), R(-25)))
    wrot("Orelha_R", ((0, 1, 0), R(25)))
    # хвост ложится на землю и обнимает морду
    wrot("Rabo_01", ((1, 0, 0), R(-48)), ((0, 0, 1), R(-70)))
    wrot("Rabo_02", ((1, 0, 0), R(-4)), ((0, 0, 1), R(-55)))
    bpy.context.view_layer.update()

    # лапы: подбор углов перебором. IK с шарнирами не дотягивался и уводил лапы под землю, а ручные
    # углы у поджатых лап промахивались. Для каждой лапы ищем бедро (вперёд/вбок) и колено, при которых
    # все суставы над землёй, а лапа ложится к своей точке: передние — к морде, левая задняя — под
    # грудь внутрь дуги, правая задняя — на бок наружу
    def xy(v):
        return mathutils.Vector((v.x, v.y, 0))

    snout = xy(world_head("Focinho"))
    chest = xy(world_head("Perna_Frente_01_L") + world_head("Perna_Frente_01_R")) * 0.5
    hips = xy(world_head("Perna_Tras_01_L") + world_head("Perna_Tras_01_R")) * 0.5
    goals = {
        "Frente_L": chest.lerp(snout, 0.4) + mathutils.Vector((0.1, 0, 0)),
        "Frente_R": chest.lerp(snout, 0.45) + mathutils.Vector((-0.1, -0.15, 0)),
        "Tras_L": hips.lerp(chest, 0.45) + mathutils.Vector((0.1, 0, 0)),
        "Tras_R": hips.lerp(chest, 0.35) + (hips - chest).normalized().cross(mathutils.Vector((0, 0, 1))) * -0.45,
    }
    for leg, goal in goals.items():
        side = leg[-1]
        b1, b2, b3 = f"Perna_{leg[:-2]}_01_{side}", f"Perna_{leg[:-2]}_02_{side}", f"Perna_{leg[:-2]}_03_{side}"
        paw = f"Pata_{leg}"
        base = {n: pb[n].rotation_quaternion.copy() for n in (b1, b2, b3)}
        best = None
        for fx in range(-130, 41, 10):
            for fy in range(-60, 61, 15):
                for kx in range(-100, 101, 20):
                    for n in (b1, b2, b3):
                        pb[n].rotation_quaternion = base[n]
                    wrot(b1, ((1, 0, 0), R(fx)), ((0, 1, 0), R(fy)))
                    wrot(b2, ((1, 0, 0), R(kx)))
                    wrot(b3, ((1, 0, 0), R(-kx * 0.5)))
                    bpy.context.view_layer.update()
                    zs = [world_head(n).z for n in (b2, b3, paw)] + [(arm.matrix_world @ pb[paw].tail).z]
                    under = sum(max(0.0, 0.08 - z) for z in zs)
                    tip = world_head(paw)
                    knee = world_head(b3)
                    # компактно: колено тоже тянется к точке лапы, а не торчит в сторону
                    cost = (xy(tip) - goal).length + 0.45 * (xy(knee) - goal).length + abs(tip.z - 0.1) + under * 8
                    if best is None or cost < best[0]:
                        best = (cost, fx, fy, kx)
        for n in (b1, b2, b3):
            pb[n].rotation_quaternion = base[n]
        _, fx, fy, kx = best
        wrot(b1, ((1, 0, 0), R(fx)), ((0, 1, 0), R(fy)))
        wrot(b2, ((1, 0, 0), R(kx)))
        wrot(b3, ((1, 0, 0), R(-kx * 0.5)))
        bpy.context.view_layer.update()
        print("CURL_LEG", leg, "cost", round(best[0], 2), "angles", fx, fy, kx)
    for b in ("Focinho", "Cabeça", "Pata_Frente_L", "Pata_Frente_R", "Pata_Tras_L", "Pata_Tras_R", "Rabo_02", "Master"):
        print("CURL_BONE", b, [round(x, 2) for x in world_head(b)])
    empties = []
    return bake("Curl", empties)


sit = pose_sit()
curl = pose_curl()

if PREVIEW:
    scn.render.engine = "BLENDER_WORKBENCH"
    scn.display.shading.light = "STUDIO"
    scn.display.shading.color_type = "TEXTURE"
    scn.render.resolution_x, scn.render.resolution_y = 700, 520
    scn.render.film_transparent = False
    bpy.ops.mesh.primitive_plane_add(size=8, location=(0, 0, 0))
    shots = [((0.0, 0.3, 9.0), "top", (0, 0.3, 0)), ((5.5, -5.0, 3.2), "front34", (0, 0.3, 0.6)), ((-6.0, 1.0, 1.2), "side", (0, 0.3, 0.6))]
    for act, tag0 in ((curl, "curl"), (sit, "sit")):
        arm.animation_data.action = act
        try:
            arm.animation_data.action_slot = act.slots[0]
        except Exception:
            pass
        scn.frame_set(1)
        bpy.context.view_layer.update()
        for loc, tag, at in shots:
            cam_data = bpy.data.cameras.new(tag)
            cam_data.type = "ORTHO"
            cam_data.ortho_scale = 5.2
            cam = bpy.data.objects.new(tag, cam_data)
            scn.collection.objects.link(cam)
            cam.location = loc
            look = mathutils.Vector(at) - mathutils.Vector(loc)
            cam.rotation_euler = look.to_track_quat("-Z", "Y").to_euler()
            scn.camera = cam
            path = PREVIEW.replace(".png", f"-{tag0}-{tag}.png")
            scn.render.filepath = path
            bpy.ops.render.render(write_still=True)
            print("PREVIEW", path)
            bpy.data.objects.remove(cam, do_unlink=True)

# по умолчанию на арматуре — «Sit»; «Curl» уходит в glb отдельной анимацией
arm.animation_data.action = sit
try:
    arm.animation_data.action_slot = sit.slots[0]
except Exception:
    pass
scn.frame_set(1)

for img in bpy.data.images:
    if img.size[0] > 512:
        img.scale(512, 512)
for o in list(bpy.data.objects):
    if o.type == "CAMERA" or o.name.startswith("Icosphere") or o.name.startswith("Plane"):
        bpy.data.objects.remove(o, do_unlink=True)
if "--no-export" not in sys.argv:
    bpy.ops.export_scene.gltf(filepath=OUT, export_format="GLB", export_image_format="WEBP", export_image_quality=85,
                              export_animations=True, export_animation_mode="ACTIONS", export_skins=True, export_apply=False, export_yup=True)
    print("EXPORTED", OUT, os.path.getsize(OUT))
