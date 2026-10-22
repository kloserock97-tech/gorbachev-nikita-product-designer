/* v72: дальний план первого экрана. За левым склоном холма раньше была ровная дымка до горизонта — весь кадр
   жил на одной дистанции, 12–15 метров, и глубины не было. Теперь там четыре гряды, как на пейзажной
   фотографии: ближняя с лесом, за ней холмы повыше, дальше горы, почти растворённые в небе.

   Ничего не грузится: гряда — лента вокруг холма, силуэт режется в шейдере (vistaFragment), цвет неба за
   грядой считается той же функцией, что и само небо. Поэтому погода (облака, сумерки) меняет дальний план
   вместе с небом, а самая дальняя гряда не отличается от неба ничем, кроме формы. */
import * as THREE from "three";
import { fbm } from "./terrain";
import { heightAt } from "./terrain";
import { plainFragment, plainVertex, vistaFragment, vistaVertex } from "./shaders";

type Ridge = {
  r: number;       // радиус дуги от центра холма, м
  base: number;    // подножие (мировой y)
  lo: number;      // высота профиля: нижняя и верхняя, м над подножием
  hi: number;
  freq: number;    // сколько крупных холмов на радиан
  forest: number;  // высота крон над профилем, м
  crown: number;   // ширина кроны, м
  tint: string;    // своя зелень, sRGB
  aerial: number;  // доля неба в цвете
  mist: number;    // высота тумана в низине, м
  seed: number;
  cool?: number;    // v109: доля холодного воздуха (uSea.x)
  sea?: [number, number]; // v109: уровень облачного моря (мировой y) и толщина перехода, м
  ridged?: boolean; // v109: профиль с гребнями (горные склоны), а не пологие холмы
  saddle?: boolean; // v109: под солнцем гряда проваливается — солнце садится в просвет, как у гор
};

/* Высоты подобраны под кадр: ближняя гряда поднимается над горизонтом на пару градусов, дальние — выше, но
   не выше нижней трети неба, где заголовок. Зелень — тёмная оливка травы, к дали холоднее и синее */
const q = new URLSearchParams(location.search);
/* v111 (Никита): ближний лес и облачное море между слоями убраны — луг холма продолжается равниной (createPlain), а
   вдали переходит в одну большую гору слева; она спускается к краю холма (VALLEY_T) и уходит под солнцем в седловину */
const MID_RIDGES: Ridge[] = q.get("mid") === "0" ? [] : [
  { r: 190, base: -10, lo: 8, hi: 19, freq: 1.9, forest: 0, crown: 1, tint: "#4a4750", aerial: 0.68, mist: 6, seed: 4.3, saddle: true, ridged: true, cool: 0.5 },
];
const RIDGES: Ridge[] = [
  /* v111: ближняя лесистая гряда (r 44) убрана по просьбе Никиты — вместо неё луг до самой горы */
  /* v102: средняя (r 80) и дальняя (r 140) гряды убраны по просьбе Никиты — с горами слоёв рельефа было слишком
     много. Остался ближний лес, за ним сразу горы; солнце садится на их предгорья (mountains.ts, uFoot) */
  /* v78: самая дальняя гряда (горы, r 240, до 42 м) убрана по просьбе Никиты — она закрывала солнце у горизонта */
  /* v109 (пример Никиты 22.10): «кулисы» между ближним лесом и горами — пологие горные склоны без леса, ниже горизонта,
     каждый светлее предыдущего; у подножия каждой туман (mist), и между слоями лежат светлые полосы облачного моря */
  ...MID_RIDGES,
];

/* дуга за холмом и по бокам: камера смотрит в −z, на широком экране кадр захватывает и бока */
const THETA0 = -Math.PI - 0.7, THETA1 = 0.7;

/** полуразмер квадрата земли холма (HillScene.buildGround, 44 м) — равнина начинается чуть внутри, под ним */
const GROUND_HALF = 22;
const SUN_T = Math.atan2(-1, -0.08);
/* направление низины: на широком кадре это x ≈ 450–650 px из 1672, сразу левее склона холма */
const VALLEY_T = Number(new URLSearchParams(location.search).get("vt") ?? -1.92);
const smoothstep = (a: number, b: number, x: number) => { const k = Math.min(1, Math.max(0, (x - a) / (b - a))); return k * k * (3 - 2 * k); };

export function createVista(shared: {
  sky: Record<string, THREE.IUniform>;
  sh: THREE.IUniform;
  ambient: THREE.IUniform;
  horizon: THREE.IUniform;
}): THREE.Group {
  const group = new THREE.Group();
  group.name = "vista";
  group.add(createPlain(shared));
  RIDGES.forEach((g, li) => {
    /* сегмент дуги ≈ 1.5 м у ближней гряды: плавный профиль идёт вершинами, кроны — во фрагментах */
    const segs = Math.round(((THETA1 - THETA0) * g.r) / Math.max(1.5, g.r / 40));
    const pos = new Float32Array((segs + 1) * 2 * 3);
    const arc = new Float32Array((segs + 1) * 2 * 2);
    const idx: number[] = [];
    for (let i = 0; i <= segs; i++) {
      const t = THETA0 + ((THETA1 - THETA0) * i) / segs;
      const x = Math.cos(t) * g.r, z = Math.sin(t) * g.r;
      /* крупные холмы и мелкие перегибы; к краям дуги гряда ниже — не торчит стеной сбоку */
      const n0 = fbm(t * g.freq + g.seed, g.seed * 3.1, 4);
      /* гребни: сложенный по модулю шум даёт острые вершины и седловины, мелкая октава — изломы склонов */
      const n = g.ridged ? Math.min(1, Math.max(0, 0.3 * n0 + 0.8 * Math.pow(1 - Math.abs(2 * fbm(t * g.freq * 0.7 + g.seed * 2.3, 1.7, 3) - 1), 1.6) + (fbm(t * g.freq * 5 + g.seed, 4.1, 2) - 0.5) * 0.22)) : n0;
      const side = Math.min(1, Math.min(t - THETA0, THETA1 - t) / 0.5);
      /* азимут солнца — SUN_DIR в HillScene (−0,08; −1): почти прямо за холмом */
      const dip = g.saddle ? 0.25 + 0.75 * smoothstep(0.1, 0.55, Math.abs(t - SUN_T)) : 1;
      /* v110 (Никита, пример 22.10): у левого края холма — низина. Гряды высокие слева и спускаются к склону, у самого
         края уходят в туман; дальше они за холмом, а справа снова поднимаются. Азимут низины — VALLEY_T (?vt=) */
      const valley = t < VALLEY_T ? smoothstep(0.02, 0.4, VALLEY_T - t) : smoothstep(0.15, 0.6, t - VALLEY_T);
      const low = 0.04 + 0.96 * valley;
      const h = g.base + (g.lo + (g.hi - g.lo) * Math.pow(n, 1.35)) * (0.55 + 0.45 * side) * dip * low;
      const top = h + g.forest * 1.02;
      pos.set([x, g.base - 4, z, x, top, z], i * 6);
      arc.set([t * g.r, h, t * g.r, h], i * 4);
      if (i < segs) {
        const a = i * 2;
        idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("aArc", new THREE.BufferAttribute(arc, 2));
    geo.setIndex(idx);
    geo.computeBoundingSphere();
    const mat = new THREE.ShaderMaterial({
      vertexShader: vistaVertex,
      fragmentShader: vistaFragment,
      side: THREE.DoubleSide,
      uniforms: {
        ...shared.sky,
        uSH: shared.sh,
        uAmbient: shared.ambient,
        uTint: { value: new THREE.Color(g.tint) },
        uAerial: { value: g.aerial },
        uForest: { value: g.forest },
        uCrown: { value: g.crown },
        uMist: { value: g.mist },
        uBase: { value: g.base },
        uSeed: { value: g.seed * 13.7 },
        uSea: { value: new THREE.Vector3(g.cool ?? 0, g.sea?.[0] ?? 0, g.sea?.[1] ?? 0) },
      },
    });
    /* кромка крон режется discard — с MSAA сглаживаем её покрытием, как края травинок */
    mat.alphaToCoverage = true;
    const mesh = new THREE.Mesh(geo, mat);
    /* ближние гряды раньше дальних: дальние пиксели за ними не считаются */
    mesh.renderOrder = 4 + li;
    mesh.frustumCulled = false;
    group.add(mesh);
  });
  return group;
}

/* v80: равнина вокруг земли холма до гряд (shaders.ts, plainFragment). У края земли — тот же рельеф, чуть ниже:
   под краем земли равнина не выглядывает, а зазора между ними нет; дальше она уходит в долину */
function createPlain(shared: { sky: Record<string, THREE.IUniform>; sh: THREE.IUniform; ambient: THREE.IUniform; horizon: THREE.IUniform }) {
  /* v111: равнина — луг до самой горы и дальше, почти до дальней плоскости камеры (400 м): было 120 м, и за краем
     светлой полосой («озером») проступало небо под горизонтом */
  const size = 740, seg = 160;
  const geo = new THREE.PlaneGeometry(size, size, seg, seg);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  /* от края земли равнина уходит вниз, в долину: ближняя гряда (подножие на −1,2 м) поднимается из дымки, а не
     прячется за плоской равниной с ровной кромкой */
  const sm = (a: number, b: number, x: number) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i);
    pos.setY(i, heightAt(x, z) - 0.08 - 3.2 * sm(GROUND_HALF - 0.5, 42, Math.max(Math.abs(x), Math.abs(z))));
  }
  const mat = new THREE.ShaderMaterial({
    vertexShader: plainVertex,
    fragmentShader: plainFragment,
    uniforms: { ...shared.sky, uSH: shared.sh, uAmbient: shared.ambient, uSkyHorizon: shared.horizon, uHole: { value: GROUND_HALF - 0.6 } },
  });
  const mesh = new THREE.Mesh(geo, mat);
  /* после земли и травы, раньше гряд: гряды за равниной не считаются там, где их закрывает земля */
  mesh.renderOrder = 3;
  mesh.frustumCulled = false;
  return mesh;
}
