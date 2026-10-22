import * as THREE from "three";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";

/* v113 (Никита, по мотивам портала igloo.inc; геометрия, шейдеры и числа свои): кольцо из расколотых «кирпичей» вместо
   рамки из плюща. Как устроено:
   · У каждой вершины — центр её блока (aCentr) и случайный вектор (aRand), по ним вершинный шейдер двигает блоки по
     отдельности: пока камера далеко, кольцо «рассыпано», на подлёте собирается в ровное и только дышит.
   · Внутренняя кромка светится, свет течёт шумом и уходит за единицу — ореол даёт отдельный плоский слой вокруг кромки.
   v121 (Никита: «блоки потолще, пофактурнее; у igloo воздух затягивается внутрь»):
   · блоки — один ряд из ~14 крупных и толстых (глубина 1 м против 0,5), скруглённые, с выщербинами и сколами
     (подразбитый брусок, шум сдвигает вершины), фактура камня в шейдере: зерно, раковины, светлые стёртые рёбра,
     тень в швах, тёплый свет окна на внутренних гранях;
   · втягивание — три слоя движутся к центру: штрихи-«воздух» по спирали снаружи в окно, ускоряясь (вместо кружащей
     пыли); дымная воронка перед кольцом — шум бежит по логарифмической спирали внутрь; кольцо медленно
     проворачивается на подлёте. Трава у портала клонится к нему (Meadow, uSink), картинка в окне у кромки слегка
     закручивается (MeadowPortal). */

export const RING_IN = 3.05;
export const RING_OUT = 4.3;
const DEPTH = 1.0;

function rng(seed: number) {
  let s = seed >>> 0;
  return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; };
}

/* шум для сколов: значения в узлах решётки, плавная интерполяция */
function hash3(x: number, y: number, z: number) {
  const h = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453;
  return h - Math.floor(h);
}
function vnoise(x: number, y: number, z: number) {
  const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z);
  const fx = x - ix, fy = y - iy, fz = z - iz;
  const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy), sz = fz * fz * (3 - 2 * fz);
  const l = (a: number, b: number, t: number) => a + (b - a) * t;
  const c = (dx: number, dy: number, dz: number) => hash3(ix + dx, iy + dy, iz + dz);
  return l(l(l(c(0, 0, 0), c(1, 0, 0), sx), l(c(0, 1, 0), c(1, 1, 0), sx), sy),
           l(l(c(0, 0, 1), c(1, 0, 1), sx), l(c(0, 1, 1), c(1, 1, 1), sx), sy), sz);
}

/* грани бруска: нормаль и две оси в плоскости, u × v = n — обход против часовой снаружи */
const FACES: [number, number, number][] = [[0, 1, 2], [0, 2, 1], [1, 2, 0], [1, 0, 2], [2, 0, 1], [2, 1, 0]];
const SIGNS = [1, -1, 1, -1, 1, -1];

function buildBricks() {
  const random = rng(40213);
  const pos: number[] = [], cen: number[] = [], rnd: number[] = [], box: number[] = [];
  const seg = [12, 7, 6]; // вдоль дуги, по радиусу, в глубину
  let a = random() * 0.3;
  const end = a + Math.PI * 2;
  while (a < end - 0.1) {
    const w = Math.min(end - a, 0.38 + random() * 0.16);
    const gap = 0.022 + random() * 0.012;
    const a0 = a + gap / 2, a1 = a + w - gap / 2, mid = (a0 + a1) / 2;
    /* у каждого блока свои радиусы и глубина: кольцо неровное, как сложенное руками */
    const ri = RING_IN + random() * 0.06, ro = RING_OUT - random() * 0.14;
    const rm = (ri + ro) / 2;
    const hx = (rm * (a1 - a0)) / 2, hy = (ro - ri) / 2, hz = DEPTH / 2 - random() * 0.1;
    const zc = -0.12 + (random() - 0.5) * 0.12;
    const b = 0.1 + random() * 0.04; // фаска
    const seed = random() * 50;
    const inner = [hx - b, hy - b, hz - b];
    const half = [hx, hy, hz];
    const rv = [random(), random(), random()];
    const c = [Math.cos(mid) * rm, Math.sin(mid) * rm, zc];
    const vert = (s: number[]) => {
      /* точка на кубе [-1,1]³ → скруглённый брусок → неровности по нормали → изгиб по дуге кольца */
      const pb = s.map((v, k) => v * half[k]);
      const q = pb.map((v, k) => Math.max(-inner[k], Math.min(inner[k], v)));
      let n = pb.map((v, k) => v - q[k]);
      const nl = Math.hypot(n[0], n[1], n[2]) || 1;
      n = n.map((v) => v / nl);
      const p = q.map((v, k) => v + n[k] * b);
      const nx = p[0] * 1.3 + seed, ny = p[1] * 1.3, nz = p[2] * 1.3;
      /* крупные волны поверхности, мелкое зерно и сколы — вмятины там, где шум выше порога */
      const chip = Math.max(0, vnoise(nx * 1.4, ny * 1.4, nz * 1.4) - 0.6) / 0.4;
      const d = (vnoise(nx * 2.2, ny * 2.2, nz * 2.2) - 0.5) * 0.06 + (vnoise(nx * 7, ny * 7, nz * 7) - 0.5) * 0.018 - chip * chip * 0.16;
      for (let k = 0; k < 3; k++) p[k] += n[k] * d;
      const ang = mid - p[0] / rm, rad = rm + p[1];
      pos.push(Math.cos(ang) * rad, Math.sin(ang) * rad, zc + p[2]);
      cen.push(...c); rnd.push(...rv); box.push(...s);
    };
    FACES.forEach(([ni, ui, vi], f) => {
      const sg = SIGNS[f];
      const nu = seg[ui], nv = seg[vi];
      /* для отрицательных граней оси поменяны местами в FACES, знак нормали — здесь */
      const at = (i: number, j: number) => { const s = [0, 0, 0]; s[ni] = sg; s[ui] = -1 + (2 * i) / nu; s[vi] = -1 + (2 * j) / nv; return s; };
      for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) {
        const A = at(i, j), B = at(i + 1, j), C = at(i + 1, j + 1), D = at(i, j + 1);
        [A, B, C, A, C, D].forEach(vert);
      }
    });
    a += w;
  }
  let geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute("aCentr", new THREE.Float32BufferAttribute(cen, 3));
  geo.setAttribute("aRand", new THREE.Float32BufferAttribute(rnd, 3));
  geo.setAttribute("aBox", new THREE.Float32BufferAttribute(box, 3));
  geo = mergeVertices(geo, 1e-5);
  geo.computeVertexNormals();
  return geo;
}

/* штрих — четырёхугольник: x поперёк (−1…1), y от хвоста (0) к голове (1) */
function buildStreaks(count: number) {
  const random = rng(9127);
  const geo = new THREE.InstancedBufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute([-1, 0, 0, 1, 0, 0, 1, 1, 0, -1, 1, 0], 3));
  geo.setIndex([0, 1, 2, 0, 2, 3]);
  const seed = new Float32Array(count * 4);
  for (let i = 0; i < seed.length; i++) seed[i] = random();
  geo.setAttribute("aSeed", new THREE.InstancedBufferAttribute(seed, 4));
  geo.instanceCount = count;
  return geo;
}

/* воронка: кольцевая поверхность, внешний край ближе к зрителю — воздух сходится к окну конусом */
const FUNNEL_OUT = RING_OUT + 4.5;
function buildFunnel() {
  const rs = 28, as = 120;
  const pos: number[] = [], idx: number[] = [];
  for (let i = 0; i <= rs; i++) {
    const r = RING_IN * 0.62 + (FUNNEL_OUT - RING_IN * 0.62) * Math.pow(i / rs, 1.4);
    const z = 0.18 + Math.pow(Math.max(0, r - RING_IN) / (FUNNEL_OUT - RING_IN), 1.3) * 2.8;
    for (let j = 0; j <= as; j++) { const t = (j / as) * Math.PI * 2; pos.push(Math.cos(t) * r, Math.sin(t) * r, z); }
  }
  for (let i = 0; i < rs; i++) for (let j = 0; j < as; j++) {
    const a = i * (as + 1) + j, b = a + as + 1;
    idx.push(a, a + 1, b, a + 1, b + 1, b);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setIndex(idx);
  return geo;
}

const NOISE3 = /* glsl */ `
  float h31(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
  float vn3(vec3 x) {
    vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(h31(i), h31(i + vec3(1, 0, 0)), f.x), mix(h31(i + vec3(0, 1, 0)), h31(i + vec3(1, 1, 0)), f.x), f.y),
               mix(mix(h31(i + vec3(0, 0, 1)), h31(i + vec3(1, 0, 1)), f.x), mix(h31(i + vec3(0, 1, 1)), h31(i + vec3(1, 1, 1)), f.x), f.y), f.z);
  }`;

export class PortalRing {
  private readonly geometries: THREE.BufferGeometry[] = [];
  private readonly time = { value: 0 };
  private readonly opacity = { value: 0 };
  private readonly chaos = { value: 1 };
  private readonly glow = { value: 0 };
  private readonly pixelScale = { value: 1200 };
  private readonly disperse = { value: 0 };
  private readonly near = { value: 1 };
  private readonly centerW = { value: new THREE.Vector3() };
  private readonly facing = { value: new THREE.Vector3(0, 0, 1) };
  private readonly ringMesh: THREE.Mesh;
  private readonly tmpQ = new THREE.Quaternion();
  /* v116 (прожарка по igloo): ядро портала — облако светлых искр в центре кольца. Издалека оно плотное и кружит, на
     подлёте разлетается наружу и гаснет, открывая окно. Искры ярче белого — их подхватывает ореол (блум портала) */
  private readonly core = new THREE.ShaderMaterial({
    uniforms: { uTime: this.time, uOpacity: this.opacity, uPixelScale: this.pixelScale, uDisperse: this.disperse },
    vertexShader: `attribute vec4 aSeed; uniform float uTime; uniform float uPixelScale; uniform float uDisperse; varying float vA;
      void main() {
        float r = pow(aSeed.x, 1.6) * 1.15;
        float th = aSeed.y * 6.2831 + uTime * (0.25 + aSeed.w * 0.5) * (aSeed.z > 0.5 ? 1.0 : -1.0);
        float ph = acos(aSeed.z * 2.0 - 1.0);
        vec3 p = vec3(sin(ph) * cos(th), sin(ph) * sin(th), cos(ph) * 0.45) * r;
        p += vec3(sin(uTime * 1.7 + aSeed.y * 40.0), cos(uTime * 1.3 + aSeed.x * 31.0), 0.0) * 0.04;
        p *= 1.0 + uDisperse * (2.2 + aSeed.w * 2.5);
        p.z += 0.35;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        vA = (0.55 + 0.45 * sin(uTime * 3.0 + aSeed.w * 50.0)) * (1.0 - uDisperse) * (1.0 - aSeed.x * 0.5);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = clamp((0.05 + aSeed.w * 0.05) * uPixelScale / max(0.3, -mv.z), 1.5, 16.0);
      }`,
    fragmentShader: `uniform float uOpacity; varying float vA;
      void main() {
        float d = length(gl_PointCoord - 0.5) * 2.0;
        float g = exp(-d * d * 4.0) * (1.0 - smoothstep(0.7, 1.0, d));
        gl_FragColor = vec4(vec3(2.2, 2.0, 1.7) * g, g) * vA * uOpacity;
      }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false,
  });
  private readonly bricks = new THREE.ShaderMaterial({
    uniforms: { uTime: this.time, uOpacity: this.opacity, uChaos: this.chaos, uGlow: this.glow, uCenterW: this.centerW, uFacing: this.facing },
    vertexShader: `attribute vec3 aCentr; attribute vec3 aRand; attribute vec3 aBox;
      uniform float uTime; uniform float uChaos;
      varying vec3 vN; varying vec3 vLocal; varying vec3 vView; varying vec3 vW; varying vec3 vBox; varying float vRand;
      vec3 turn(vec3 v, vec3 axis, float a) { float c = cos(a), s = sin(a); return v * c + cross(axis, v) * s + axis * dot(axis, v) * (1.0 - c); }
      void main() {
        vec3 axis = normalize(aRand - 0.5 + vec3(0.001));
        /* рассыпанное кольцо: поворот вокруг центра блока и отход наружу; собранное — только дыхание */
        float a = uChaos * (aRand.x * 2.0 - 1.0) * 1.0 + sin(uTime * 0.5 + aRand.y * 6.28) * 0.02;
        vec3 p = turn(position - aCentr, axis, a);
        vec3 out2 = normalize(vec3(aCentr.xy, 0.0));
        vec3 c = aCentr + out2 * (uChaos * (0.3 + aRand.z * 0.9) + 0.025 * sin(uTime * 0.6 + aRand.x * 9.0))
               + vec3(0.0, 0.0, uChaos * (aRand.y - 0.5) * 1.4);
        vec4 wp = modelMatrix * vec4(c + p, 1.0);
        vN = normalize(mat3(modelMatrix) * turn(normal, axis, a));
        vLocal = position; vRand = aRand.x; vBox = aBox; vW = wp.xyz;
        vView = cameraPosition - wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }`,
    fragmentShader: `uniform float uTime; uniform float uOpacity; uniform float uGlow; uniform vec3 uCenterW; uniform vec3 uFacing;
      varying vec3 vN; varying vec3 vLocal; varying vec3 vView; varying vec3 vW; varying vec3 vBox; varying float vRand;
      ${NOISE3}
      void main() {
        vec3 p = vLocal * 1.7 + vRand * 20.0;
        float big = vn3(p) * 0.6 + vn3(p * 2.3) * 0.4;
        float grain = vn3(p * 11.0);
        float h = big * 0.55 + grain * 0.3 + vn3(p * 27.0) * 0.15;
        /* рельеф камня: нормаль наклоняется по производным высоты на экране — зерно и раковины без текстур */
        vec3 n = normalize(vN);
        vec3 dpx = dFdx(vW), dpy = dFdy(vW);
        vec3 r1 = cross(dpy, n), r2 = cross(n, dpx);
        float det = dot(dpx, r1);
        vec2 dh = vec2(dFdx(h), dFdy(h)) * 0.06;
        n = normalize(abs(det) * n - sign(det) * (dh.x * r1 + dh.y * r2));
        vec3 v = normalize(vView);
        /* камень: пятна светлее и темнее, раковины, стёртые светлые рёбра */
        vec3 stone = mix(vec3(0.13, 0.135, 0.145), vec3(0.29, 0.29, 0.295), big) * (0.88 + 0.24 * vRand);
        float pits = smoothstep(0.74, 0.86, vn3(p * 3.0 + 7.3));
        stone *= 1.0 - pits * 0.35;
        vec3 ab = abs(vBox);
        float mx = max(ab.x, max(ab.y, ab.z)), mn = min(ab.x, min(ab.y, ab.z));
        float mid = ab.x + ab.y + ab.z - mx - mn;
        float worn = smoothstep(0.78, 0.97, mid) * (0.45 + 0.55 * grain);
        stone = mix(stone, stone * 1.35 + 0.02, worn);
        /* тень в швах (торцы блоков) и на тыльной стороне */
        float ao = mix(0.5, 1.0, smoothstep(1.0, 0.72, ab.x)) * mix(0.55, 1.0, smoothstep(-1.0, -0.4, vBox.z));
        /* свет: небо сверху, тёплый отсвет луга снизу, ночной ключ сверху-спереди, тёплый свет окна изнутри */
        vec3 amb = mix(vec3(0.07, 0.06, 0.035), vec3(0.2, 0.22, 0.28), n.y * 0.5 + 0.5);
        vec3 key = vec3(0.62, 0.64, 0.72) * max(dot(n, normalize(vec3(0.0, 0.85, 0.0) + uFacing * 0.55)), 0.0);
        vec3 toC = uCenterW + uFacing * 0.9 - vW;
        float r = length(vLocal.xy);
        float fall = exp(-max(r - ${RING_IN.toFixed(2)}, 0.0) * 1.15);
        vec3 win = vec3(1.5, 0.98, 0.52) * max(dot(n, normalize(toC)), 0.0) * fall * fall * (0.3 + 0.7 * uGlow);
        float rim = pow(1.0 - max(dot(n, v), 0.0), 3.0);
        vec3 col = stone * (amb + key * 0.7 + win) * ao * 1.15 + rim * vec3(0.16, 0.15, 0.13) * ao;
        /* свечение внутренней кромки течёт по кругу */
        float edge = 1.0 - smoothstep(${RING_IN.toFixed(2)}, ${(RING_IN + 0.4).toFixed(2)}, r);
        float ang = atan(vLocal.y, vLocal.x);
        float flow = 0.62 + 0.38 * sin(ang * 5.0 + uTime * 0.9 + sin(ang * 3.0 - uTime * 0.4) * 1.5);
        col += vec3(1.5, 1.2, 0.75) * edge * edge * flow * uGlow * 0.85 * (0.6 + 0.4 * grain);
        gl_FragColor = vec4(col, uOpacity);
      }`,
    transparent: true, toneMapped: false,
  });
  private readonly halo = new THREE.ShaderMaterial({
    uniforms: { uTime: this.time, uOpacity: this.opacity, uGlow: this.glow },
    vertexShader: `varying vec2 vP; void main() { vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `uniform float uTime; uniform float uOpacity; uniform float uGlow; varying vec2 vP;
      void main() {
        float r = length(vP), ang = atan(vP.y, vP.x);
        float d = r - ${RING_IN.toFixed(2)};
        float flow = 0.6 + 0.4 * sin(ang * 4.0 - uTime * 0.7 + sin(ang * 7.0 + uTime * 0.3));
        float g = exp(-abs(d) * (d < 0.0 ? 3.2 : 1.6)) * flow;
        gl_FragColor = vec4(vec3(1.0, 0.86, 0.6) * g * 0.55 * uGlow, 1.0) * uOpacity;
      }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false,
  });
  /* штрихи-«воздух»: каждый живёт по кругу жизни — родится снаружи и перед кольцом, по спирали и с ускорением уходит
     в окно и гаснет у кромки. Хвост — та же траектория чуть раньше, четырёхугольник растянут между ними на экране */
  private readonly streaks = new THREE.ShaderMaterial({
    uniforms: { uTime: this.time, uOpacity: this.opacity, uPixelScale: this.pixelScale, uNear: this.near },
    vertexShader: `attribute vec4 aSeed; uniform float uTime; uniform float uPixelScale; uniform float uNear; varying float vA; varying vec2 vQ;
      vec3 path(float t) {
        float e = t * t;
        float r = mix(${RING_OUT.toFixed(2)} * (1.0 + aSeed.z * 0.9), ${(RING_IN * 0.08).toFixed(2)}, e);
        /* закрутка растёт к центру — как вода в сливе */
        float a = aSeed.w * 6.2832 + e * (2.6 + aSeed.y * 1.4) + uTime * 0.04;
        float z = mix(0.4 + aSeed.y * 1.8, 0.0, e);
        return vec3(cos(a) * r, sin(a) * r, z);
      }
      void main() {
        float life = fract(aSeed.x + uTime * (0.07 + aSeed.y * 0.07));
        vec3 head = path(life), tail = path(max(0.0, life - 0.04 - aSeed.z * 0.04));
        vec4 ch = projectionMatrix * modelViewMatrix * vec4(head, 1.0);
        vec4 ct = projectionMatrix * modelViewMatrix * vec4(tail, 1.0);
        float aspect = projectionMatrix[1][1] / projectionMatrix[0][0];
        vec2 d = (ch.xy / ch.w - ct.xy / ct.w) * vec2(aspect, 1.0);
        vec2 perp = normalize(vec2(-d.y, d.x) + 1e-6);
        float depth = max(0.3, ch.w);
        float px = clamp(0.015 * uPixelScale / depth, 0.9, 2.4);
        vec2 off = perp * px * 2.0 / (uPixelScale * 0.728) / vec2(aspect, 1.0);
        vec4 c = mix(ct, ch, position.y);
        c.xy += off * position.x * c.w;
        gl_Position = c;
        float r = length(head.xy);
        /* v122 (Никита: «воздух должен уходить в сам портал, а не только вокруг»): штрих проходит кромку и гаснет уже
           внутри окна, у центра */
        vA = smoothstep(0.0, 0.18, life) * smoothstep(${(RING_IN * 0.1).toFixed(2)}, ${(RING_IN * 0.55).toFixed(2)}, r)
           * (0.3 + 0.7 * life) * smoothstep(1.0, 3.0, depth) * uNear;
        vQ = position.xy;
      }`,
    fragmentShader: `uniform float uOpacity; varying float vA; varying vec2 vQ;
      void main() {
        float s = exp(-vQ.x * vQ.x * 3.0) * vQ.y * vQ.y;
        gl_FragColor = vec4(vec3(1.0, 0.9, 0.74) * s, s) * vA * uOpacity * 1.0;
      }`,
    /* обход четырёхугольника зависит от направления штриха на экране — рисуем обе стороны */
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, side: THREE.DoubleSide,
  });
  /* воронка: шум в полярных координатах бежит по логарифмической спирали к центру — дымка, которую тянет в окно;
     у кромки — лента светлой «плазмы», текущая по кругу */
  private readonly funnel = new THREE.ShaderMaterial({
    uniforms: { uTime: this.time, uOpacity: this.opacity, uGlow: this.glow, uNear: this.near },
    vertexShader: `varying vec3 vP; void main() { vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `uniform float uTime; uniform float uOpacity; uniform float uGlow; uniform float uNear; varying vec3 vP;
      ${NOISE3}
      void main() {
        float r = length(vP.xy), ang = atan(vP.y, vP.x);
        float s = log(r);
        float a = ang + s * 2.4 - uTime * 0.05;
        vec2 cs = vec2(cos(a), sin(a));
        float t = uTime * 0.22;
        /* три слоя шума перемножены — остаются редкие тонкие пряди, как у дыма на ветру */
        float w = vn3(vec3(cs * 2.0, s * 3.0 + t)) * vn3(vec3(cs * 3.4 + 5.0, s * 5.0 + t * 1.3)) * vn3(vec3(cs * 5.5 + 9.0, s * 8.0 + t * 1.7));
        /* без насыщения: пряди не вспыхивают яркими дугами, остаются дымкой */
        w = smoothstep(0.06, 0.3, w);
        float fade = smoothstep(${(RING_IN * 0.3).toFixed(2)}, ${(RING_IN * 0.95).toFixed(2)}, r) * (1.0 - smoothstep(${(RING_OUT + 1.2).toFixed(2)}, ${FUNNEL_OUT.toFixed(2)}, r));
        float plasma = exp(-abs(r - ${(RING_IN + 0.05).toFixed(2)}) * 5.0) * (0.55 + 0.45 * sin(ang * 6.0 - uTime * 1.3 + sin(ang * 3.0 + uTime * 0.5) * 2.0));
        float v = w * fade * 0.1 + plasma * vn3(vec3(cs * 4.0, uTime * 0.6)) * 0.22 * uGlow;
        gl_FragColor = vec4(vec3(1.0, 0.86, 0.66) * v, v) * uOpacity * uNear;
      }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, side: THREE.DoubleSide,
  });

  /* v122 (Никита: «чтобы камни туда стремились, прямо из луга»): камешки выныривают из травы перед порталом,
     поднимаются дугой и по спирали, кувыркаясь и ускоряясь, уходят в окно — проходят за его плоскость и скрываются за
     картинкой подвала. Позиции считает вершинный шейдер по семени и времени, на процессоре ничего не движется */
  private readonly stones = new THREE.ShaderMaterial({
    uniforms: { uTime: this.time, uOpacity: this.opacity, uCenterW: this.centerW, uFacing: this.facing, uGlow: this.glow },
    vertexShader: `attribute vec4 aSeed; uniform float uTime; uniform float uOpacity;
      varying vec3 vN; varying vec3 vW; varying float vShade;
      vec3 turn(vec3 v, vec3 axis, float a) { float c = cos(a), s = sin(a); return v * c + cross(axis, v) * s + axis * dot(axis, v) * (1.0 - c); }
      void main() {
        float life = fract(aSeed.x + uTime * (0.045 + aSeed.y * 0.04));
        /* старт: в траве перед порталом, левее и правее входа */
        vec3 p0 = vec3((aSeed.z - 0.5) * 15.0, -4.55, 1.2 + aSeed.w * 8.5);
        float rise = smoothstep(0.0, 0.14, life);
        vec3 start = p0 + vec3(0.0, rise * 0.75, 0.0);
        float k = smoothstep(0.1, 1.0, life);
        k = k * k;
        vec3 c = vec3(0.0, 0.0, -0.6);
        vec3 p = mix(start, c, k);
        /* закрутка вокруг оси портала растёт к центру, плюс дуга вверх на полпути */
        float ang = k * k * (2.4 + aSeed.y * 1.5);
        vec2 o = p.xy - c.xy;
        p.xy = c.xy + mat2(cos(ang), sin(ang), -sin(ang), cos(ang)) * o;
        p.y += sin(k * 3.14159) * (0.6 + aSeed.w * 1.4);
        float size = (0.06 + aSeed.y * 0.1) * smoothstep(0.0, 0.06, life) * (1.0 - smoothstep(0.88, 1.0, k)) * uOpacity;
        vec3 axis = normalize(vec3(aSeed.w - 0.5, aSeed.z - 0.5, aSeed.y - 0.5) + 0.001);
        float spin = uTime * (0.6 + aSeed.z * 2.0) + k * 6.0;
        vec3 local = turn(position * vec3(1.0, 0.75, 0.9), axis, spin) * size;
        vec4 wp = modelMatrix * vec4(p + local, 1.0);
        vN = normalize(mat3(modelMatrix) * turn(normal, axis, spin));
        vW = wp.xyz;
        vShade = 0.75 + 0.5 * fract(aSeed.x * 17.3);
        gl_Position = projectionMatrix * viewMatrix * wp;
      }`,
    fragmentShader: `uniform vec3 uCenterW; uniform vec3 uFacing; uniform float uGlow; varying vec3 vN; varying vec3 vW; varying float vShade;
      void main() {
        vec3 n = normalize(vN);
        vec3 amb = mix(vec3(0.06, 0.055, 0.035), vec3(0.18, 0.2, 0.26), n.y * 0.5 + 0.5);
        vec3 toC = uCenterW + uFacing * 0.6 - vW;
        float d = length(toC);
        vec3 win = vec3(1.6, 1.05, 0.55) * max(dot(n, toC / d), 0.0) * (0.25 + 0.75 * uGlow) * 6.0 / (6.0 + d * d);
        vec3 col = vec3(0.2, 0.2, 0.21) * vShade * (amb + win + 0.35 * max(dot(n, normalize(vec3(0.0, 1.0, 0.0) + uFacing * 0.5)), 0.0));
        gl_FragColor = vec4(col, 1.0);
      }`,
    toneMapped: false,
  });

  constructor(group: THREE.Group, centreY: number) {
    const geo = buildBricks();
    this.geometries.push(geo);
    const ring = new THREE.Mesh(geo, this.bricks);
    ring.position.y = centreY;
    ring.renderOrder = 2;
    ring.frustumCulled = false;
    group.add(ring);
    this.ringMesh = ring;

    const haloGeo = new THREE.PlaneGeometry(RING_OUT * 2 + 3, RING_OUT * 2 + 3);
    this.geometries.push(haloGeo);
    const halo = new THREE.Mesh(haloGeo, this.halo);
    halo.position.set(0, centreY, 0.05);
    halo.renderOrder = 3;
    group.add(halo);

    const funnelGeo = buildFunnel();
    this.geometries.push(funnelGeo);
    const funnel = new THREE.Mesh(funnelGeo, this.funnel);
    funnel.position.y = centreY;
    funnel.renderOrder = 4;
    funnel.frustumCulled = false;
    group.add(funnel);

    const crand = rng(5531);
    const nc = 1600, cs = new Float32Array(nc * 4);
    for (let i = 0; i < nc * 4; i++) cs[i] = crand();
    const coreGeo = new THREE.BufferGeometry();
    coreGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(nc * 3), 3));
    coreGeo.setAttribute("aSeed", new THREE.BufferAttribute(cs, 4));
    this.geometries.push(coreGeo);
    const core = new THREE.Points(coreGeo, this.core);
    core.position.y = centreY;
    core.frustumCulled = false;
    core.renderOrder = 5;
    group.add(core);

    const rock = new THREE.IcosahedronGeometry(1, 0); // уже без индексов — грани плоские
    rock.computeVertexNormals();
    const stoneGeo = new THREE.InstancedBufferGeometry();
    stoneGeo.setAttribute("position", rock.getAttribute("position"));
    stoneGeo.setAttribute("normal", rock.getAttribute("normal"));
    rock.dispose();
    const ns = typeof innerWidth !== "undefined" && innerWidth < 700 ? 36 : 72;
    const ss = new Float32Array(ns * 4), srand = rng(3319);
    for (let i = 0; i < ss.length; i++) ss[i] = srand();
    stoneGeo.setAttribute("aSeed", new THREE.InstancedBufferAttribute(ss, 4));
    stoneGeo.instanceCount = ns;
    this.geometries.push(stoneGeo);
    const stones = new THREE.Mesh(stoneGeo, this.stones);
    stones.position.y = centreY;
    stones.frustumCulled = false;
    group.add(stones);

    const streakGeo = buildStreaks(typeof innerWidth !== "undefined" && innerWidth < 700 ? 260 : 480);
    this.geometries.push(streakGeo);
    const streaks = new THREE.Mesh(streakGeo, this.streaks);
    streaks.position.y = centreY;
    streaks.frustumCulled = false;
    streaks.renderOrder = 4;
    group.add(streaks);
  }

  setSize(height: number, dpr: number) { this.pixelScale.value = height * dpr / (2 * Math.tan(THREE.MathUtils.degToRad(20))); }
  /** distance — от камеры до кольца, м: издалека кольцо рассыпано, вблизи собрано и светится */
  update(time: number, opacity: number, distance: number) {
    this.time.value = time;
    this.opacity.value = opacity;
    /* собирается на подлёте: к середине пути почти ровное кольцо, у входа — только дыхание */
    const k = THREE.MathUtils.smoothstep(distance, 9, 25);
    this.chaos.value = k * k;
    this.glow.value = 0.35 + 0.65 * (1 - THREE.MathUtils.smoothstep(distance, 3, 20));
    this.disperse.value = 1 - THREE.MathUtils.smoothstep(distance, 5, 13);
    /* у самого входа воздух и воронка гаснут: последний кадр портала — чистое окно в подвал */
    this.near.value = THREE.MathUtils.smoothstep(distance, 1.6, 5);
    /* кольцо проворачивается по мере подлёта — вместе с закруткой воздуха читается водоворотом */
    this.ringMesh.rotation.z = (1 - THREE.MathUtils.smoothstep(distance, 2, 26)) * 0.55;
    this.ringMesh.getWorldPosition(this.centerW.value);
    this.facing.value.set(0, 0, 1).applyQuaternion(this.ringMesh.getWorldQuaternion(this.tmpQ));
  }
  dispose() {
    this.geometries.forEach((g) => g.dispose());
    this.bricks.dispose(); this.halo.dispose(); this.streaks.dispose(); this.core.dispose(); this.funnel.dispose(); this.stones.dispose();
  }
}
