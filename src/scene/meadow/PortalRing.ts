import * as THREE from "three";

/* v113 (Никита, по мотивам портала igloo.inc; геометрия, шейдеры и числа свои): кольцо из расколотых «кирпичей» вместо
   рамки из плюща. Как устроено:
   · Геометрия строится здесь: два слоя по радиусу, в каждом ~30 кирпичей случайной ширины со швами между ними;
     каждый кирпич — призма из кольцевого сектора. У каждой вершины — центр её кирпича (aCentr) и случайный вектор
     (aRand), по ним вершинный шейдер двигает кирпичи по отдельности.
   · Пока камера далеко, кольцо «рассыпано»: кирпичи повёрнуты вокруг своих центров и отодвинуты наружу; по мере
     подлёта собираются в ровное кольцо и только дышат.
   · Внутренняя кромка светится, свет течёт шумом и уходит за единицу — ореол даёт отдельный плоский слой вокруг кромки
     (блума в сцене луга нет).
   · Пыль — короткие светлые штрихи, вытянутые вдоль пути камеры, медленно кружат в кольце. */

export const RING_IN = 3.05;
export const RING_OUT = 3.95;
const DEPTH = 0.5;

function rng(seed: number) {
  let s = seed >>> 0;
  return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; };
}

function buildBricks() {
  const random = rng(40213);
  const pos: number[] = [], cen: number[] = [], rnd: number[] = [];
  const layers: [number, number][] = [[RING_IN, (RING_IN + RING_OUT) / 2 + 0.02], [(RING_IN + RING_OUT) / 2 - 0.02, RING_OUT]];
  layers.forEach(([r0, r1], li) => {
    let a = random() * 0.2 + li * 0.11;
    const end = a + Math.PI * 2;
    while (a < end - 0.05) {
      const w = Math.min(end - a, 0.15 + random() * 0.17);
      const a0 = a + 0.012, a1 = a + w - 0.012;
      /* неровные края: радиусы и глубина у каждого кирпича свои */
      const ri = r0 + 0.02 + random() * 0.05, ro = r1 - 0.02 - random() * 0.06;
      const z0 = -DEPTH / 2 + random() * 0.12, z1 = DEPTH / 2 - random() * 0.12;
      const steps = 3;
      const ring = (r: number, z: number) => Array.from({ length: steps + 1 }, (_, i) => {
        const t = a0 + ((a1 - a0) * i) / steps;
        return new THREE.Vector3(Math.cos(t) * r, Math.sin(t) * r, z);
      });
      const fi = ring(ri, z1), fo = ring(ro, z1), bi = ring(ri, z0), bo = ring(ro, z0);
      const quad = (p: THREE.Vector3, q: THREE.Vector3, r: THREE.Vector3, s: THREE.Vector3) => { pos.push(...p.toArray(), ...q.toArray(), ...r.toArray(), ...p.toArray(), ...r.toArray(), ...s.toArray()); };
      const start = pos.length;
      for (let i = 0; i < steps; i++) {
        quad(fi[i], fo[i], fo[i + 1], fi[i + 1]); // перед
        quad(bi[i + 1], bo[i + 1], bo[i], bi[i]); // зад
        quad(bi[i], fi[i], fi[i + 1], bi[i + 1]); // внутренняя кромка
        quad(fo[i], bo[i], bo[i + 1], fo[i + 1]); // наружная
      }
      quad(bi[0], bo[0], fo[0], fi[0]); // торцы
      quad(fi[steps], fo[steps], bo[steps], bi[steps]);
      const mid = (a0 + a1) / 2, rm = (ri + ro) / 2;
      const c = [Math.cos(mid) * rm, Math.sin(mid) * rm, (z0 + z1) / 2];
      const rv = [random(), random(), random()];
      for (let k = start; k < pos.length; k += 3) { cen.push(...c); rnd.push(...rv); }
      a += w;
    }
  });
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute("aCentr", new THREE.Float32BufferAttribute(cen, 3));
  geo.setAttribute("aRand", new THREE.Float32BufferAttribute(rnd, 3));
  geo.computeVertexNormals();
  return geo;
}

export class PortalRing {
  private readonly geometries: THREE.BufferGeometry[] = [];
  private readonly time = { value: 0 };
  private readonly opacity = { value: 0 };
  private readonly chaos = { value: 1 };
  private readonly glow = { value: 0 };
  private readonly pixelScale = { value: 1200 };
  private readonly disperse = { value: 0 };
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
    uniforms: { uTime: this.time, uOpacity: this.opacity, uChaos: this.chaos, uGlow: this.glow },
    vertexShader: `attribute vec3 aCentr; attribute vec3 aRand;
      uniform float uTime; uniform float uChaos;
      varying vec3 vN; varying vec3 vLocal; varying vec3 vView; varying float vRand;
      vec3 turn(vec3 v, vec3 axis, float a) { float c = cos(a), s = sin(a); return v * c + cross(axis, v) * s + axis * dot(axis, v) * (1.0 - c); }
      void main() {
        vec3 axis = normalize(aRand - 0.5 + vec3(0.001));
        /* рассыпанное кольцо: поворот вокруг центра кирпича и отход наружу; собранное — только дыхание */
        float a = uChaos * (aRand.x * 2.0 - 1.0) * 1.0 + sin(uTime * 0.5 + aRand.y * 6.28) * 0.03;
        vec3 p = turn(position - aCentr, axis, a);
        vec3 out2 = normalize(vec3(aCentr.xy, 0.0));
        vec3 c = aCentr + out2 * (uChaos * (0.25 + aRand.z * 0.8) + 0.02 * sin(uTime * 0.6 + aRand.x * 9.0))
               + vec3(0.0, 0.0, uChaos * (aRand.y - 0.5) * 1.2);
        vec4 wp = modelMatrix * vec4(c + p, 1.0);
        vN = normalize(mat3(modelMatrix) * turn(normal, axis, a));
        vLocal = position; vRand = aRand.x;
        vView = cameraPosition - wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }`,
    fragmentShader: `uniform float uTime; uniform float uOpacity; uniform float uGlow;
      varying vec3 vN; varying vec3 vLocal; varying vec3 vView; varying float vRand;
      void main() {
        vec3 n = normalize(vN), v = normalize(vView);
        /* матовый светлый камень-лёд: свет сверху-спереди, кромки к зрителю светлее (скользящий угол) */
        /* v113.1: в ночном луге светлые кирпичи читались белыми кубиками — камень темнее, свет даёт кромка и кант */
        float lit = 0.3 + 0.7 * max(dot(n, normalize(vec3(0.2, 0.8, 0.6))), 0.0);
        float rim = pow(1.0 - max(dot(n, v), 0.0), 3.0);
        vec3 col = mix(vec3(0.07, 0.075, 0.085), vec3(0.3, 0.31, 0.33), lit) * (0.85 + 0.3 * vRand) + rim * vec3(0.35, 0.33, 0.3);
        /* свечение внутренней кромки течёт по кругу */
        float r = length(vLocal.xy);
        float edge = 1.0 - smoothstep(${RING_IN.toFixed(2)}, ${(RING_IN + 0.5).toFixed(2)}, r);
        float ang = atan(vLocal.y, vLocal.x);
        float flow = 0.62 + 0.38 * sin(ang * 5.0 + uTime * 0.9 + sin(ang * 3.0 - uTime * 0.4) * 1.5);
        col += vec3(1.5, 1.2, 0.75) * edge * edge * flow * uGlow;
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
  private readonly dust = new THREE.ShaderMaterial({
    uniforms: { uTime: this.time, uOpacity: this.opacity, uPixelScale: this.pixelScale },
    vertexShader: `attribute vec3 aSeed; uniform float uTime; uniform float uPixelScale; varying float vA;
      void main() {
        float t = uTime * (0.05 + aSeed.x * 0.06) + aSeed.y * 6.28;
        float r = ${(RING_IN * 0.55).toFixed(2)} + aSeed.z * ${(RING_OUT * 0.7).toFixed(2)};
        vec3 p = vec3(cos(t) * r, sin(t) * r, position.z + sin(uTime * 0.3 + aSeed.x * 9.0) * 0.6);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        vA = (0.5 + 0.5 * sin(uTime * 0.8 + aSeed.y * 17.0)) * smoothstep(0.6, 2.5, -mv.z);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = clamp(0.06 * uPixelScale / max(0.3, -mv.z), 1.0, 24.0);
      }`,
    fragmentShader: `uniform float uOpacity; varying float vA;
      void main() {
        vec2 q = gl_PointCoord - 0.5;
        /* штрих: узкий по горизонтали, вытянутый по вертикали */
        float s = exp(-q.x * q.x * 180.0) * pow(1.0 - min(1.0, abs(q.y) * 2.0), 2.0);
        gl_FragColor = vec4(vec3(1.0, 0.95, 0.85) * s, s) * vA * uOpacity * 0.9;
      }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false,
  });

  constructor(group: THREE.Group, centreY: number) {
    const geo = buildBricks();
    this.geometries.push(geo);
    const ring = new THREE.Mesh(geo, this.bricks);
    ring.position.y = centreY;
    ring.renderOrder = 2;
    ring.frustumCulled = false;
    group.add(ring);

    const haloGeo = new THREE.PlaneGeometry(RING_OUT * 2 + 3, RING_OUT * 2 + 3);
    this.geometries.push(haloGeo);
    const halo = new THREE.Mesh(haloGeo, this.halo);
    halo.position.set(0, centreY, 0.05);
    halo.renderOrder = 3;
    group.add(halo);

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

    const random = rng(9127);
    const n = 260, p = new Float32Array(n * 3), s = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { p[i * 3 + 2] = (random() - 0.3) * 6; s.set([random(), random(), random()], i * 3); }
    const dustGeo = new THREE.BufferGeometry();
    dustGeo.setAttribute("position", new THREE.BufferAttribute(p, 3));
    dustGeo.setAttribute("aSeed", new THREE.BufferAttribute(s, 3));
    this.geometries.push(dustGeo);
    const dust = new THREE.Points(dustGeo, this.dust);
    dust.position.y = centreY;
    dust.frustumCulled = false;
    dust.renderOrder = 4;
    group.add(dust);
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
  }
  dispose() {
    this.geometries.forEach((g) => g.dispose());
    this.bricks.dispose(); this.halo.dispose(); this.dust.dispose(); this.core.dispose();
  }
}
