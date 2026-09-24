/* v72: дальний план первого экрана. За левым склоном холма раньше была ровная дымка до горизонта — весь кадр
   жил на одной дистанции, 12–15 метров, и глубины не было. Теперь там четыре гряды, как на пейзажной
   фотографии: ближняя с лесом, за ней холмы повыше, дальше горы, почти растворённые в небе.

   Ничего не грузится: гряда — лента вокруг холма, силуэт режется в шейдере (vistaFragment), цвет неба за
   грядой считается той же функцией, что и само небо. Поэтому погода (облака, сумерки) меняет дальний план
   вместе с небом, а самая дальняя гряда не отличается от неба ничем, кроме формы. */
import * as THREE from "three";
import { fbm } from "./terrain";
import { vistaFragment, vistaVertex } from "./shaders";

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
  { r: 44, base: -1.2, lo: 0.4, hi: 2.4, freq: 3.2, forest: 1.1, crown: 1.1, tint: "#2c3a1c", aerial: 0.36, mist: 0.9, seed: 1.7 },
  { r: 80, base: -1.5, lo: 2.2, hi: 7.5, freq: 2.4, forest: 1.8, crown: 1.9, tint: "#2f3d2a", aerial: 0.52, mist: 2.0, seed: 5.3 },
  { r: 140, base: -2, lo: 7, hi: 20, freq: 1.9, forest: 2.6, crown: 3.4, tint: "#303c4c", aerial: 0.62, mist: 4, seed: 9.1 },
  { r: 240, base: -3, lo: 16, hi: 42, freq: 1.4, forest: 0, crown: 8, tint: "#3e4658", aerial: 0.76, mist: 8, seed: 13.9 },
];

/* дуга за холмом и по бокам: камера смотрит в −z, на широком экране кадр захватывает и бока */
const THETA0 = -Math.PI - 0.7, THETA1 = 0.7;

export function createVista(shared: {
  sky: Record<string, THREE.IUniform>;
  sh: THREE.IUniform;
  ambient: THREE.IUniform;
}): THREE.Group {
  const group = new THREE.Group();
  group.name = "vista";
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
