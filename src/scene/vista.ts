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
};

/* Высоты подобраны под кадр: ближняя гряда поднимается над горизонтом на пару градусов, дальние — выше, но
   не выше нижней трети неба, где заголовок. Зелень — тёмная оливка травы, к дали холоднее и синее */
const RIDGES: Ridge[] = [
  { r: 44, base: -1.2, lo: 0.4, hi: 2.4, freq: 3.2, forest: 1.1, crown: 1.1, tint: "#2c3a1c", aerial: 0.36, mist: 2.2, seed: 1.7 },
  { r: 80, base: -1.5, lo: 2.2, hi: 7.5, freq: 2.4, forest: 1.8, crown: 1.9, tint: "#2f3d2a", aerial: 0.52, mist: 3.0, seed: 5.3 },
  { r: 140, base: -2, lo: 7, hi: 20, freq: 1.9, forest: 2.6, crown: 3.4, tint: "#303c4c", aerial: 0.62, mist: 4, seed: 9.1 },
  /* v78: самая дальняя гряда (горы, r 240, до 42 м) убрана по просьбе Никиты — она закрывала солнце у горизонта */
];

/* дуга за холмом и по бокам: камера смотрит в −z, на широком экране кадр захватывает и бока */
const THETA0 = -Math.PI - 0.7, THETA1 = 0.7;

/** полуразмер квадрата земли холма (HillScene.buildGround, 44 м) — равнина начинается чуть внутри, под ним */
const GROUND_HALF = 22;

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
      const n = fbm(t * g.freq + g.seed, g.seed * 3.1, 4);
      const side = Math.min(1, Math.min(t - THETA0, THETA1 - t) / 0.5);
      const h = g.base + (g.lo + (g.hi - g.lo) * Math.pow(n, 1.35)) * (0.55 + 0.45 * side);
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
  const size = 120, seg = 80;
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
