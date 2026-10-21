import * as THREE from "three";
import { getCases } from "../../data/cases";
import { onLang } from "../../i18n";
import { PILLAR, buildPillar, fontsReady, paintFace, type Pillar } from "./signpostPillar";

/* v103: указатель кейса — световой столб в 3D на живом лугу Meadow Walk (модель — signpostPillar.ts). Луг остаётся прежним — облёт сверху, рельеф меняется, вода дышит, — камера на главе кейсов только
   замедляет ход и чуть опускается (Meadow.ts).

   Как живёт столб:
   - вырастает из земли впереди по ходу камеры — там, куда она смотрит, — с травой и кустами вокруг;
   - при смене кейса прежний уходит в землю, новый вырастает на новом месте;
   - стоит на рельефе: основание каждый кадр по высоте земли под ним (рельеф луга медленно меняется), трава и кусты
     вокруг берут высоту из той же карты высот, что и трава луга, — едут вместе с землёй;
   - новый кейс — новый столб далеко впереди и в стороне, камера сама плавно долетает до него (cameraPose).
   Свет приглушённый, как у столба в интерфейсе: акрил светится, но не слепит; блум луга обходит лицо (трафарет). */

const SCALE = 1.45;
const GLOW = 2.4;
const RISE = 1.15; // с — вырасти или уйти в землю

type Ground = (x: number, z: number) => number;
type HeightUniforms = Record<"uHeight" | "uCenter" | "uSize" | "uTexel", THREE.IUniform>;

/* растения вокруг столба: координаты — от основания; высота земли — из карты высот луга, в шейдере */
function plantMaterial(kind: "blade" | "leaf", heightGLSL: string, U: HeightUniforms, u: { uOrigin: THREE.IUniform; uGrow: THREE.IUniform; uWindTime: THREE.IUniform; uYaw: THREE.IUniform }) {
  const m = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.85, metalness: 0, side: THREE.DoubleSide });
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, U, u);
    sh.vertexShader = sh.vertexShader
      .replace("#include <common>", /* glsl */ `#include <common>
${heightGLSL}
uniform vec3 uOrigin;
uniform float uGrow;
uniform float uWindTime;
uniform float uYaw;
varying vec3 vPlantW;
varying float vPlantH;`)
      .replace("#include <project_vertex>", /* glsl */ `
  vec3 root = instanceMatrix[3].xyz;
  vec4 lp = instanceMatrix * vec4(transformed, 1.0);
  /* растёт вместе со столбом: от корня вверх */
  lp.xyz = root + (lp.xyz - root) * vec3(mix(0.6, 1.0, uGrow), uGrow, mix(0.6, 1.0, uGrow));
  /* смещения заданы от лица столба (+z) — поворачиваем вместе с ним */
  float cy = cos(uYaw), sy = sin(uYaw);
  root.xz = vec2(root.x * cy + root.z * sy, -root.x * sy + root.z * cy);
  lp.xz = vec2(lp.x * cy + lp.z * sy, -lp.x * sy + lp.z * cy);
  vec3 rw = uOrigin + root;
  float hk = ${kind === "blade" ? "clamp(position.y, 0.0, 1.0)" : "0.6"};
  float ph = rw.x * 1.7 + rw.z * 1.3;
  float sway = sin(uWindTime * 1.6 + ph) * 0.6 + sin(uWindTime * 2.9 + ph * 1.9) * 0.25;
  vec4 mvPosition = vec4(uOrigin + lp.xyz, 1.0);
  mvPosition.y += hfHeight(rw.xz) - 0.02;
  mvPosition.x += sway * ${kind === "blade" ? "0.09" : "0.02"} * hk * hk * uGrow;
  mvPosition.z += cos(uWindTime * 1.3 + ph) * ${kind === "blade" ? "0.045" : "0.012"} * hk * hk * uGrow;
  vPlantH = hk;
  vPlantW = mvPosition.xyz;
  mvPosition = viewMatrix * mvPosition;
  gl_Position = projectionMatrix * mvPosition;`);
    sh.fragmentShader = sh.fragmentShader
      .replace("#include <common>", /* glsl */ `#include <common>
uniform vec3 uOrigin;
uniform float uGrow;
varying vec3 vPlantW;
varying float vPlantH;`)
      .replace("#include <map_fragment>", /* glsl */ `#include <map_fragment>
${kind === "leaf" ? `  vec2 lq = vUv * 2.0 - 1.0;
  float shape = 1.0 - (lq.x * lq.x) / (0.36 * (1.0 - lq.y * lq.y * 0.92) + 1e-3) - lq.y * lq.y;
  if (shape < 0.0) discard;
  diffuseColor.rgb *= 0.82 + 0.18 * smoothstep(0.0, 0.06, abs(lq.x));` : `  diffuseColor.rgb *= mix(0.35, 1.0, vPlantH);`}`)
      .replace("#include <emissivemap_fragment>", /* glsl */ `#include <emissivemap_fragment>
  /* на просвет у света столба: листья и травинки рядом светятся холодным */
  float dd = length(vPlantW.xz - uOrigin.xz);
  totalEmissiveRadiance += diffuseColor.rgb * vec3(0.75, 0.95, 1.1) * exp(-dd * 1.3) * 0.35 * uGrow;`);
  };
  m.customProgramCacheKey = () => `sign3d-plant-${kind}`;
  if (kind === "leaf") m.defines = { USE_UV: "" };
  return m;
}

function buildPlants(heightGLSL: string, U: HeightUniforms, u: { uOrigin: THREE.IUniform; uGrow: THREE.IUniform; uWindTime: THREE.IUniform; uYaw: THREE.IUniform }) {
  const rand = (() => { let s = 11; return () => ((s = (s * 16807) % 2147483647) / 2147483647); })();
  const group = new THREE.Group();
  const color = new THREE.Color();
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), sc = new THREE.Vector3(), p = new THREE.Vector3();
  const blade = new THREE.BufferGeometry();
  {
    const pos: number[] = [], uv: number[] = [], idx: number[] = [];
    const seg = 5;
    for (let k = 0; k <= seg; k++) {
      const t = k / seg, wv = 0.5 * (1 - t) ** 0.9;
      pos.push(-wv, t, 0, wv, t, 0);
      uv.push(0, t, 1, t);
      if (k < seg) { const a = k * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    }
    blade.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    blade.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
    blade.setIndex(idx);
    blade.computeVertexNormals();
  }
  /* высокая трава кольцом; перед лицом ниже — не закрывает панель */
  const N = 1500;
  const blades = new THREE.InstancedMesh(blade, plantMaterial("blade", heightGLSL, U, u), N);
  for (let k = 0; k < N; k++) {
    const a = rand() * Math.PI * 2;
    const r = 0.5 + Math.pow(rand(), 0.75) * 3.2;
    const lx = Math.cos(a) * r, lz = Math.sin(a) * r;
    const front = lz > 0 ? Math.min(1, lz / r) * 0.7 : 0;
    const hgt = (0.35 + rand() * 0.7) * (1 - front) * (r < 1.4 ? 1.15 : 1);
    p.set(lx, 0, lz);
    e.set((rand() - 0.5) * 0.5, rand() * Math.PI, (rand() - 0.5) * 0.5);
    q.setFromEuler(e);
    sc.set(0.04 + rand() * 0.035, hgt, 1);
    m4.compose(p, q, sc);
    blades.setMatrixAt(k, m4);
    color.setHSL(0.2 + rand() * 0.07, 0.55 + rand() * 0.2, 0.16 + rand() * 0.1);
    if (rand() < 0.12) color.setHSL(0.13, 0.45, 0.32);
    blades.setColorAt(k, color);
  }
  blades.frustumCulled = false;
  group.add(blades);
  /* кусты сзади и по бокам */
  const leaf = new THREE.PlaneGeometry(0.13, 0.19);
  leaf.translate(0, 0.09, 0);
  const BUSHES = 4, LEAVES = 560;
  const leaves = new THREE.InstancedMesh(leaf, plantMaterial("leaf", heightGLSL, U, u), BUSHES * LEAVES);
  let n = 0;
  for (let b = 0; b < BUSHES; b++) {
    const a = Math.PI * (0.55 + 0.9 * (b / (BUSHES - 1))) + (rand() - 0.5) * 0.3 + Math.PI * 0.5;
    const r = 1.1 + rand() * 1.4;
    const c = new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r);
    if (c.z > 0.4) c.z = -c.z; // спереди кустов нет
    const rad = 0.38 + rand() * 0.32, tall = rad * (1.1 + rand() * 0.6);
    const tint = 0.26 + rand() * 0.06;
    for (let k = 0; k < LEAVES; k++, n++) {
      const uu = rand() * Math.PI * 2, v = Math.acos(2 * rand() - 1), rr = Math.pow(rand(), 0.35);
      p.set(Math.sin(v) * Math.cos(uu) * rad * rr, (Math.cos(v) * 0.5 + 0.5) * tall * rr + 0.04, Math.sin(v) * Math.sin(uu) * rad * rr).add(c);
      e.set(rand() * Math.PI, rand() * Math.PI * 2, rand() * Math.PI);
      q.setFromEuler(e);
      const s2 = 0.7 + rand() * 0.6;
      sc.set(s2, s2, s2);
      m4.compose(p, q, sc);
      leaves.setMatrixAt(n, m4);
      color.setHSL(tint + rand() * 0.04, 0.4 + rand() * 0.18, 0.08 + rr * 0.08 + rand() * 0.04);
      leaves.setColorAt(n, color);
    }
  }
  leaves.frustumCulled = false;
  group.add(leaves);
  return group;
}

type Slot = {
  p: Pillar;
  plants: THREE.Group;
  u: { uOrigin: THREE.IUniform<THREE.Vector3>; uGrow: THREE.IUniform<number>; uWindTime: THREE.IUniform; uYaw: THREE.IUniform<number> };
  light: THREE.PointLight;
  pos: THREE.Vector3; yaw: number;
  caseIdx: number;
  /** 0 — в земле, 1 — стоит; dir — куда идёт */
  k: number; dir: 1 | -1;
};

export function createSignpost3d(o: { shadows: boolean; heightGLSL: string; U: HeightUniforms; wind: THREE.IUniform }) {
  const root = new THREE.Group();
  root.name = "signpost3d";
  const slots: Slot[] = [0, 1].map(() => {
    const p = buildPillar(o.shadows, GLOW, 1.5);
    p.group.scale.setScalar(SCALE);
    p.group.visible = false;
    const u = { uOrigin: { value: new THREE.Vector3() }, uGrow: { value: 0 }, uWindTime: o.wind, uYaw: { value: 0 } };
    const plants = buildPlants(o.heightGLSL, o.U, u);
    plants.visible = false;
    const light = new THREE.PointLight("#e9f1ff", 0, 9, 2);
    root.add(p.group, plants, light);
    return { p, plants, u, light, pos: new THREE.Vector3(), yaw: 0, caseIdx: -1, k: 0, dir: -1 as const };
  });

  const paint = async (s: Slot) => {
    if (s.caseIdx < 0) return;
    await fontsReady();
    paintFace(s.p.canvas, getCases()[s.caseIdx], s.caseIdx);
    s.p.face.needsUpdate = true;
  };
  onLang(() => slots.forEach((s) => void paint(s)));

  let active: Slot | null = null;
  const tmpV = new THREE.Vector3();

  /* Полёт к столбу. Новый кейс — новый столб далеко впереди и в стороне (40–55 м), камера сама долетает до него за
     несколько секунд: мягкий разгон, дуга над холмами, мягкая посадка. Прокрутка только запускает полёт. */
  const travel = {
    on: false,
    start: 0,
    dur: 5,
    from: new THREE.Vector3(),
    fromLook: new THREE.Vector3(),
    dir: new THREE.Vector3(0, 0, -1), // откуда подлетаем (по горизонтали)
    arc: 2,
  };
  let lastCam: THREE.Vector3 | null = null, lastLook: THREE.Vector3 | null = null;
  const smoother = (x: number) => x * x * x * (x * (x * 6 - 15) + 10);
  const VIEW = 11.5; // м от столба по горизонтали, где камера останавливается
  let side = 1;

  /* сухое ровное место около точки */
  const settle = (cx: number, cz: number, ground: Ground, sea: number, out: THREE.Vector3) => {
    let best = Infinity;
    for (let r = 0; r <= 7; r += 1.75) {
      for (let a = 0; a < 6.28; a += r === 0 ? 7 : 0.785) {
        const x = cx + Math.cos(a) * r, z = cz + Math.sin(a) * r;
        const y = ground(x, z);
        const slope = Math.abs(ground(x + 0.8, z) - ground(x - 0.8, z)) + Math.abs(ground(x, z + 0.8) - ground(x, z - 0.8));
        const sc = r * 0.25 + slope * 3 + (y > sea + 0.5 ? 0 : 100);
        if (sc < best) { best = sc; out.set(x, y, z); }
      }
    }
    return best < 100;
  };

  const spawn = (i: number, camera: THREE.Camera, ground: Ground, sea: number, now: number) => {
    const s = slots.find((x) => x !== active && x.k <= 0.001) ?? slots.find((x) => x !== active)!;
    /* куда: вперёд по ходу камеры; первый — в 26 м, следующие — в 40–55 м от прежнего столба и в сторону */
    const fwd = tmpV.set(0, 0, -1);
    if (lastCam && lastLook) fwd.subVectors(lastLook, lastCam).setY(0).normalize();
    const fx = fwd.x, fz = fwd.z;
    const base = active ? active.pos : camera.position;
    side = -side;
    const along = active ? 40 + Math.random() * 15 : 26;
    const lateral = active ? side * (9 + Math.random() * 6) : -3;
    if (!settle(base.x + fx * along - fz * lateral, base.z + fz * along + fx * lateral, ground, sea, s.pos)) return;
    /* полёт: из текущей позы камеры к точке обзора нового столба */
    travel.from.copy(lastCam ?? camera.position);
    travel.fromLook.copy(lastLook ?? s.pos);
    travel.dir.subVectors(s.pos, travel.from).setY(0);
    const far = travel.dir.length();
    travel.dir.normalize();
    travel.start = now;
    travel.dur = THREE.MathUtils.clamp(far / 9, 3.6, 7);
    travel.arc = THREE.MathUtils.clamp(far * 0.06, 1, 4);
    travel.on = true;
    /* лицом к точке, где встанет камера, вполоборота — видна боковая грань с пазом */
    const vx = s.pos.x - travel.dir.x * VIEW, vz = s.pos.z - travel.dir.z * VIEW;
    s.yaw = Math.atan2(vx - s.pos.x, vz - s.pos.z) - 0.5;
    s.caseIdx = i;
    s.k = 0;
    s.dir = 1;
    void paint(s);
    if (active) active.dir = -1;
    active = s;
  };

  return {
    root,
    /** хоть один столб над землёй — есть чему светиться */
    get shown() { return slots.some((s) => s.k > 0.001); },
    /** поза камеры у столба (во время полёта и после); false — столба ещё нет */
    cameraPose(now: number, aspect: number, ground: Ground, pos: THREE.Vector3, look: THREE.Vector3) {
      if (!active || !travel.on) return false;
      const P = active.pos, d = travel.dir;
      const rx = -d.z, rz = d.x; // вправо от направления подлёта
      const g = ground(P.x, P.z);
      /* точка обзора: перед столбом, чуть правее; взгляд — правее столба, он стоит левее центра кадра */
      /* на вертикальном экране кадр узкий: камера дальше и почти напротив, столб выше середины — внизу название
         и подписи, справа сверху экран продукта */
      const tall = aspect < 0.9;
      const view = tall ? VIEW * 1.3 : VIEW, sx = tall ? 0.6 : 1.5, lx = tall ? 0.75 : 2.2;
      const tx = P.x - d.x * view + rx * sx, tz = P.z - d.z * view + rz * sx;
      const ty = Math.max(g + 5.6, ground(tx, tz) + 4.2);
      const u = THREE.MathUtils.clamp((now - travel.start) / travel.dur, 0, 1);
      const e = smoother(u);
      pos.set(
        THREE.MathUtils.lerp(travel.from.x, tx, e),
        THREE.MathUtils.lerp(travel.from.y, ty, e) + Math.sin(Math.PI * u) * travel.arc,
        THREE.MathUtils.lerp(travel.from.z, tz, e),
      );
      /* не ниже земли по дороге */
      pos.y = Math.max(pos.y, ground(pos.x, pos.z) + 3.2);
      const lk = smoother(Math.min(1, u * 1.3));
      look.set(
        THREE.MathUtils.lerp(travel.fromLook.x, P.x + rx * lx, lk),
        THREE.MathUtils.lerp(travel.fromLook.y, g + PILLAR.h * SCALE * (tall ? 0.05 : 0.45), lk),
        THREE.MathUtils.lerp(travel.fromLook.z, P.z + rz * lx, lk),
      );
      /* на месте кадр живёт: медленный облёт и дыхание */
      const live = smoother(u);
      pos.x += (rx * 0.9 * Math.sin(now * 0.11) + d.x * 0.5 * Math.sin(now * 0.07 + 1.0)) * live;
      pos.z += (rz * 0.9 * Math.sin(now * 0.11) + d.z * 0.5 * Math.sin(now * 0.07 + 1.0)) * live;
      pos.y += 0.3 * Math.sin(now * 0.15 + 0.6) * live;
      return true;
    },
    /** i — номер кейса (−1 — столба нет), on — глава кейсов на экране; camera и look — итоговые за этот кадр */
    update(dt: number, now: number, i: number, on: boolean, camera: THREE.Camera, look: THREE.Vector3, ground: Ground, sea: number) {
      lastCam = (lastCam ?? new THREE.Vector3()).copy(camera.position);
      lastLook = (lastLook ?? new THREE.Vector3()).copy(look);
      if (!on || i < 0) { if (active) { active.dir = -1; active = null; travel.on = false; } }
      else if (!active || active.caseIdx !== i) spawn(i, camera, ground, sea, now);
      for (const s of slots) {
        s.k = THREE.MathUtils.clamp(s.k + (s.dir * dt) / RISE, 0, 1);
        const vis = s.k > 0.001;
        s.p.group.visible = s.plants.visible = vis;
        s.light.intensity = 0;
        if (!vis) continue;
        /* подъём: быстрый старт, мягкая посадка; уход — наоборот */
        const e = s.dir > 0 ? 1 - Math.pow(1 - s.k, 3) : s.k * s.k * (3 - 2 * s.k);
        const g = ground(s.pos.x, s.pos.z);
        const sink = (PILLAR.base + PILLAR.h + 0.2) * SCALE * (1 - e);
        s.p.group.position.set(s.pos.x, g - 0.05 - sink, s.pos.z);
        s.p.group.rotation.y = s.yaw;
        s.u.uOrigin.value.set(s.pos.x, 0, s.pos.z);
        s.u.uYaw.value = s.yaw;
        /* трава и кусты вырастают чуть позже столба и уходят раньше */
        s.u.uGrow.value = THREE.MathUtils.smoothstep(e, 0.25, 1);
        tmpV.set(0, (PILLAR.base + 0.8) * SCALE, (PILLAR.d / 2 + 0.35) * SCALE).applyAxisAngle(THREE.Object3D.DEFAULT_UP, s.yaw);
        s.light.position.set(s.pos.x + tmpV.x, g + tmpV.y, s.pos.z + tmpV.z);
        /* свет включается, когда столб вышел из земли: короткое мерцание, как у лайтбокса */
        const lit = THREE.MathUtils.smoothstep(e, 0.7, 1);
        const flick = s.dir > 0 && lit < 1 ? 0.6 + 0.4 * Math.sin(lit * 40) : 1;
        s.light.intensity = 7 * lit * flick;
      }
    },
  };
}
