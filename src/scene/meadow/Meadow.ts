import * as THREE from "three";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { heightGLSL, noiseGLSL, terrainHeight } from "./noise";

/* v32: луг Meadow Walk — фон главы «Кейсы». Порт github.com/kloserock97-tech/meadow-walk (код Никиты, MIT)
   на «голый» three без React, пресет dusk зашит константами.

   Рисуется тем же WebGLRenderer, что и холм (без второго контекста), в буфер, который даёт postfx:
   сначала карта высот вокруг камеры (одна на кадр — её читают рельеф, трава, камни и тени),
   потом сцена луга своей камерой. Бесконечная прогулка: камера плывёт вперёд над травой,
   держится над землёй по JS-копии рельефа. Курсор пускает по траве волны. */

export type MeadowQuality = {
  near: number; // травинок у камеры (максимум)
  far: number; // дальний слой
  heightRes: number; // карта высот
  shadows: boolean;
};

const HEAD_RADIUS = 4.5;
const WAVE_SPEED = 2.6;
const WAVE_LIFE = 2.6;
const WAVE_REACH = 0.4 + WAVE_SPEED * WAVE_LIFE + 2.5;
const SEA = -1.6;

/* v73.1: лесная поляна в контровом свете (docs/prompts/v73-cases-grade.md, второй референс — моховой холм
   на фоне тёмного леса). Цвета линейные. Зелень тёплая, жёлто-зелёная, синего в ней почти нет; кромки
   травинок горят лаймом от солнца за травой; цветы — красно-оранжевые. Пасмурный серый пресет (первый
   референс) владелец не принял: трава и камни растворились в светлом тумане */
const C = {
  lush: new THREE.Vector3(0.035, 0.06, 0.012),
  meadow: new THREE.Vector3(0.07, 0.13, 0.025),
  dry: new THREE.Vector3(0.16, 0.18, 0.05),
  rock: new THREE.Vector3(0.3, 0.29, 0.25),
  /* v73.3: дорожки светлее и теплее — на тёмной поляне они читаются тропинками, а не шумом */
  path: new THREE.Vector3(0.62, 0.5, 0.3),
  root: new THREE.Vector3(0.01, 0.016, 0.004),
  tip: new THREE.Vector3(0.12, 0.24, 0.035),
  tipDry: new THREE.Vector3(0.24, 0.3, 0.06),
  stone: new THREE.Vector3(0.36, 0.35, 0.3),
  flower: new THREE.Vector3(0.72, 0.16, 0.05),
  flowerYellow: new THREE.Vector3(0.85, 0.36, 0.14),
};
/* фон и туман: тёмный лес — почти чёрный с зелёной дымкой, на референсе (10–38, 10–42, 14–29) в sRGB */
const NIGHT = new THREE.Color("#141a10");

const cursorFieldGLSL = /* glsl */ `
uniform vec4 uHead;
uniform vec4 uWaves[16];
uniform vec4 uFieldBounds;
vec3 cursorField(vec2 p) {
  if (p.x < uFieldBounds.x || p.y < uFieldBounds.y || p.x > uFieldBounds.z || p.y > uFieldBounds.w) return vec3(0.0);
  vec2 push = vec2(0.0);
  float lift = 0.0;
  if (uHead.w > 0.001) {
    vec2 dv = p - uHead.xz;
    float d = length(dv);
    float f = exp(-(d * d) / ${(HEAD_RADIUS * HEAD_RADIUS).toFixed(2)}) * uHead.w;
    push += dv / max(d, 0.6) * f * smoothstep(0.0, 1.8, d) * 0.7;
    lift += f * 0.35;
  }
  for (int i = 0; i < 16; i++) {
    vec4 wv = uWaves[i];
    float age = wv.w;
    if (age < 0.0 || age > ${WAVE_LIFE.toFixed(2)}) continue;
    vec2 dv = p - wv.xz;
    float d = length(dv);
    float x = (d - (0.4 + age * ${WAVE_SPEED.toFixed(2)})) / (1.0 + age * 0.55);
    float env = smoothstep(0.0, 0.55, age) * (1.0 - smoothstep(${(WAVE_LIFE * 0.27).toFixed(3)}, ${WAVE_LIFE.toFixed(2)}, age));
    float k = exp(-x * x) * env * smoothstep(0.0, 1.2, d);
    lift += k;
    push += dv / max(d, 0.6) * k * 0.55;
  }
  float liftN = 1.0 - exp(-lift * 1.1);
  float pl = length(push);
  vec2 pushN = pl > 1e-4 ? push / pl * (1.0 - exp(-pl * 1.2)) : vec2(0.0);
  return vec3(pushN, liftN);
}
`;

const sampleHeightGLSL = /* glsl */ `
uniform sampler2D uHeight;
uniform vec2 uCenter;
uniform float uSize;
uniform float uTexel;
vec2 hfUv(vec2 wxz) { return (wxz - uCenter) / uSize + 0.5; }
float hfHeight(vec2 wxz) { return texture2D(uHeight, hfUv(wxz)).r; }
vec3 hfNormal(vec2 wxz) {
  vec2 uv = hfUv(wxz);
  float e = uTexel;
  float hl = texture2D(uHeight, uv - vec2(e, 0.0)).r;
  float hr = texture2D(uHeight, uv + vec2(e, 0.0)).r;
  float hd = texture2D(uHeight, uv - vec2(0.0, e)).r;
  float hu = texture2D(uHeight, uv + vec2(0.0, e)).r;
  return normalize(vec3(hl - hr, 2.0 * e * uSize, hd - hu));
}
`;

type Shader = { uniforms: Record<string, THREE.IUniform>; vertexShader: string; fragmentShader: string };
const vec3u = (v: THREE.Vector3) => `vec3(${v.x.toFixed(3)}, ${v.y.toFixed(3)}, ${v.z.toFixed(3)})`;

export class Meadow {
  private static readonly ZERO = new THREE.Vector2();
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.PerspectiveCamera(40, 1, 0.3, 400);
  private readonly worldSize = 220;
  private readonly heightRT: THREE.WebGLRenderTarget;
  private readonly heightScene = new THREE.Scene();
  private readonly heightCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  private readonly texel: number;
  /* солнце низко в глубине кадра, тёплое: контровой свет, как луч сквозь лес на референсе */
  private readonly sun = new THREE.DirectionalLight("#ffe2a8", 3.4);
  private readonly grass: { geo: THREE.InstancedBufferGeometry; max: number; center: THREE.Vector2; tile: number }[] = [];
  private readonly materials: THREE.Material[] = [];
  private readonly geometries: THREE.BufferGeometry[] = [];
  private density = 1;

  private readonly U = {
    uTime: { value: 0 },
    uWindTime: { value: 0 },
    uSea: { value: SEA },
    uHeight: { value: null as THREE.Texture | null },
    uCenter: { value: new THREE.Vector2() },
    uSize: { value: 0 },
    uTexel: { value: 0 },
    uCam: { value: new THREE.Vector3() },
    uPebbleCenter: { value: new THREE.Vector2() },
    uHead: { value: new THREE.Vector4(1e5, 0, 1e5, 0) },
    uWaves: { value: Array.from({ length: 16 }, () => new THREE.Vector4(1e5, 0, 1e5, -1)) },
    uFieldBounds: { value: new THREE.Vector4(1e5, 1e5, -1e5, -1e5) },
    uDpr: { value: 1 },
  };

  /* прогулка */
  private t = 40; // старт с кадра, где под камерой открытый склон
  private walked = 40 * 2.1;
  private groundSmooth: number | null = null;
  private readonly look = new THREE.Vector3();
  private readonly dir = new THREE.Vector3();
  private readonly mouse = new THREE.Vector2();

  /* курсор */
  private hover = false;
  private hoverAmt = 0;
  private sinceSpawn = 1;
  private readonly pointer = new THREE.Vector2();
  private readonly lastSpawn = new THREE.Vector3(1e6, 0, 1e6);
  private readonly ray = new THREE.Raycaster();
  private readonly hit = new THREE.Vector3();

  constructor(private readonly renderer: THREE.WebGLRenderer, private readonly q: MeadowQuality) {
    this.texel = this.worldSize / q.heightRes;
    this.U.uSize.value = this.worldSize;
    this.U.uTexel.value = 1 / q.heightRes;
    this.scene.background = NIGHT.clone();
    /* даль тонет в темноте леса, ближний склон остаётся в свету */
    this.scene.fog = new THREE.FogExp2(NIGHT.getHex(), 0.02);

    this.heightRT = new THREE.WebGLRenderTarget(q.heightRes, q.heightRes, {
      type: THREE.HalfFloatType, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: false,
    });
    this.heightRT.texture.generateMipmaps = false;
    this.U.uHeight.value = this.heightRT.texture;

    this.buildHeightPass();
    this.buildLights();
    this.buildTerrain();
    this.buildWater();
    this.buildGrass();
    this.buildPebbles();
    this.buildDust();
  }

  /* ── построение ─────────────────────────────────────────────────────────── */

  private buildHeightPass() {
    const mat = new THREE.ShaderMaterial({
      uniforms: { uCenter: this.U.uCenter, uSize: this.U.uSize, uTime: this.U.uTime },
      vertexShader: /* glsl */ `varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
      fragmentShader: /* glsl */ `
        precision highp float;
        uniform vec2 uCenter; uniform float uSize; uniform float uTime;
        varying vec2 vUv;
        ${heightGLSL}
        void main() { gl_FragColor = vec4(terrainHeight(uCenter + (vUv - 0.5) * uSize, uTime), 0.0, 0.0, 1.0); }`,
      depthTest: false, depthWrite: false,
    });
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat);
    quad.frustumCulled = false;
    this.heightScene.add(quad);
    this.materials.push(mat);
    this.geometries.push(quad.geometry);
  }

  private buildLights() {
    /* под пологом леса рассеянного света мало и он зелёный; главный — солнце за травой */
    this.scene.add(new THREE.HemisphereLight("#8a9a62", "#0b0d07", 0.55));
    this.sun.castShadow = this.q.shadows;
    const s = this.sun.shadow;
    s.mapSize.set(2048, 2048);
    s.bias = -0.0006;
    s.normalBias = 0.05;
    Object.assign(s.camera, { left: -40, right: 40, top: 40, bottom: -40, near: 1, far: 200 });
    this.scene.add(this.sun, this.sun.target);
  }

  private material(patch: (s: Shader) => void, key: string, opts: THREE.MeshStandardMaterialParameters = {}) {
    const m = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.95, metalness: 0, ...opts });
    m.onBeforeCompile = patch as (s: unknown) => void;
    m.customProgramCacheKey = () => key;
    this.materials.push(m);
    return m;
  }
  private depthMaterial(patch: (s: Shader) => void, key: string) {
    const m = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking });
    m.onBeforeCompile = patch as (s: unknown) => void;
    m.customProgramCacheKey = () => key;
    this.materials.push(m);
    return m;
  }

  private buildTerrain() {
    const U = this.U;
    const segments = this.q.heightRes - 16;
    const size = segments * this.texel;
    const geo = new THREE.PlaneGeometry(size, size, segments, segments);
    geo.rotateX(-Math.PI / 2);
    this.geometries.push(geo);
    const displace = /* glsl */ `
      vec2 wxz = position.xz + uCenter;
      float hC = hfHeight(wxz);
      vec3 transformed = vec3(wxz.x, hC, wxz.y);`;

    const mat = this.material((sh) => {
      Object.assign(sh.uniforms, { uHeight: U.uHeight, uCenter: U.uCenter, uSize: U.uSize, uTexel: U.uTexel, uTime: U.uTime, uSea: U.uSea });
      sh.vertexShader = sh.vertexShader
        .replace("#include <common>", `#include <common>\n${sampleHeightGLSL}\nvarying vec2 vWorldXZ; varying float vHeight; varying float vSlope; varying vec3 vWorldNormal;`)
        .replace("#include <beginnormal_vertex>", /* glsl */ `
          vec3 objectNormal = hfNormal(position.xz + uCenter);
          vSlope = length(objectNormal.xz) / max(objectNormal.y, 0.05);
          vWorldNormal = objectNormal;`)
        .replace("#include <begin_vertex>", `${displace}\n vWorldXZ = wxz; vHeight = hC;`);
      sh.fragmentShader = sh.fragmentShader
        .replace("#include <common>", /* glsl */ `#include <common>
          uniform float uTime; uniform float uSea;
          varying vec2 vWorldXZ; varying float vHeight; varying float vSlope; varying vec3 vWorldNormal;
          ${noiseGLSL}
          float detailH(vec2 p) { return (tdNoise(p * 1.9) * 0.6 + tdNoise(p * 5.3) * 0.3) * 0.03; }`)
        .replace("#include <color_fragment>", /* glsl */ `
          #include <color_fragment>
          float h = vHeight;
          float sea = uSea;
          float n1 = tdNoise(vWorldXZ * 0.08);
          float n2 = tdNoise(vWorldXZ * 0.45);
          float n3 = tdNoise(vWorldXZ * 3.1);
          vec3 col = mix(${vec3u(C.lush)}, ${vec3u(C.meadow)}, smoothstep(-0.5, 0.6, n1 + 0.45 * n2 + (h - sea) * 0.12));
          col = mix(col, ${vec3u(C.dry)}, smoothstep(0.1, 0.7, n2 * 0.6 + (h - sea - 2.2) * 0.35) * 0.75);
          col *= 0.9 + 0.2 * n3;
          col = mix(col, ${vec3u(C.rock)} * (0.85 + 0.3 * n3), smoothstep(0.5, 0.95, vSlope + n2 * 0.25));
          col = mix(col, ${vec3u(C.dry)} * vec3(0.14, 0.12, 0.1), (1.0 - smoothstep(sea, sea + 0.18, h)) * 0.85);
          float paths = 0.0;
          float verge = 0.0;
          float fwH = max(fwidth(h), 1e-4);
          for (int k = 0; k < 2; k++) {
            float fk = float(k);
            float level = sea + 0.95 + fk * 1.15 + 0.1 * sin(uTime * 0.21 + fk * 1.7);
            float dpx = abs(h - level) / fwH;
            float line = 1.0 - smoothstep(2.2, 5.0, dpx);
            float on = smoothstep(-0.2, 0.2, tdNoise(vWorldXZ * 0.05 + vec2(fk * 7.3, fk * 2.1))) * (1.0 - fk * 0.3);
            paths += line * on;
            /* тёмная кромка вдоль тропы — утоптанная земля в тени травы: светлая тропа между тёмных краёв */
            verge += (smoothstep(3.5, 5.5, dpx) - smoothstep(6.5, 10.0, dpx)) * on;
          }
          col *= 1.0 - 0.45 * clamp(verge, 0.0, 1.0);
          diffuseColor.rgb = mix(col, ${vec3u(C.path)} * (0.85 + 0.3 * n3), clamp(paths, 0.0, 1.0));`)
        .replace("#include <normal_fragment_maps>", /* glsl */ `
          #include <normal_fragment_maps>
          {
            const float e = 0.05;
            float d0 = detailH(vWorldXZ);
            vec2 slope = vec2(detailH(vWorldXZ + vec2(e, 0.0)) - d0, detailH(vWorldXZ + vec2(0.0, e)) - d0) / e;
            slope *= 1.0 - smoothstep(25.0, 60.0, length(vViewPosition));
            vec3 bumped = normalize(normalize(vWorldNormal) - vec3(slope.x, 0.0, slope.y));
            normal = normalize((viewMatrix * vec4(bumped, 0.0)).xyz);
          }`);
    }, "meadow-terrain", { roughness: 0.97 });

    const depth = this.depthMaterial((sh) => {
      Object.assign(sh.uniforms, { uHeight: U.uHeight, uCenter: U.uCenter, uSize: U.uSize, uTexel: U.uTexel });
      sh.vertexShader = sh.vertexShader
        .replace("#include <common>", `#include <common>\n${sampleHeightGLSL}`)
        .replace("#include <begin_vertex>", displace);
    }, "meadow-terrain-depth");

    const mesh = new THREE.Mesh(geo, mat);
    mesh.customDepthMaterial = depth;
    mesh.frustumCulled = false;
    mesh.receiveShadow = true;
    mesh.castShadow = this.q.shadows;
    this.scene.add(mesh);
  }

  private buildWater() {
    const U = this.U;
    const m = new THREE.MeshBasicMaterial({ color: 0x050807 });
    m.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, { uCenter: U.uCenter, uSea: U.uSea, uCam: U.uCam });
      sh.vertexShader = sh.vertexShader
        .replace("#include <common>", "#include <common>\nuniform vec2 uCenter;\nuniform float uSea;\nvarying vec3 vWaterPos;")
        .replace("#include <begin_vertex>", "vec3 transformed = vec3(position.x + uCenter.x, uSea, position.z + uCenter.y);\nvWaterPos = transformed;");
      sh.fragmentShader = sh.fragmentShader
        .replace("#include <common>", "#include <common>\nuniform vec3 uCam;\nvarying vec3 vWaterPos;")
        .replace("#include <color_fragment>", `#include <color_fragment>
          vec3 v = normalize(uCam - vWaterPos);
          diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.1, 0.1, 0.095), pow(1.0 - clamp(v.y, 0.0, 1.0), 4.0) * 0.6);`);
    };
    m.customProgramCacheKey = () => "meadow-water";
    const geo = new THREE.PlaneGeometry(this.worldSize, this.worldSize, 1, 1);
    geo.rotateX(-Math.PI / 2);
    const mesh = new THREE.Mesh(geo, m);
    mesh.frustumCulled = false;
    this.scene.add(mesh);
    this.materials.push(m);
    this.geometries.push(geo);
  }

  private buildGrass() {
    const U = this.U;
    const layers = [
      { name: "near", count: this.q.near, tile: 26, levels: [0, 0.5], height: [0.16, 0.46], width: [0.05, 0.09], shadows: this.q.shadows },
      { name: "far", count: this.q.far, tile: 70, levels: [0], height: [0.2, 0.5], width: [0.12, 0.2], shadows: false },
    ];
    for (const L of layers) {
      if (L.count <= 0) continue;
      const pos: number[] = [];
      for (const y of L.levels) { const w = Math.pow(1 - y, 0.9); pos.push(-0.5 * w, y, 0, 0.5 * w, y, 0); }
      pos.push(0, 1, 0);
      const index: number[] = [];
      for (let i = 0; i < L.levels.length - 1; i++) { const a = i * 2; index.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
      const top = pos.length / 3 - 1;
      index.push(top - 2, top - 1, top);
      const geo = new THREE.InstancedBufferGeometry();
      geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
      geo.setAttribute("normal", new THREE.Float32BufferAttribute(new Array(pos.length).fill(0), 3));
      geo.setIndex(index);
      const seeds = new Float32Array(L.count * 4);
      for (let i = 0; i < seeds.length; i++) seeds[i] = Math.random();
      geo.setAttribute("aSeed", new THREE.InstancedBufferAttribute(seeds, 4));
      geo.instanceCount = L.count;
      this.geometries.push(geo);
      const center = new THREE.Vector2();
      this.grass.push({ geo, max: L.count, center, tile: L.tile });

      const mat = this.material((sh) => {
        Object.assign(sh.uniforms, {
          uHeight: U.uHeight, uCenter: U.uCenter, uSize: U.uSize, uTexel: U.uTexel,
          uGrassCenter: { value: center }, uGrassTile: { value: L.tile },
          uBladeH: { value: new THREE.Vector2(L.height[0], L.height[1]) }, uBladeW: { value: new THREE.Vector2(L.width[0], L.width[1]) },
          uTime: U.uTime, uWindTime: U.uWindTime, uSea: U.uSea,
          uHead: U.uHead, uWaves: U.uWaves, uFieldBounds: U.uFieldBounds, uCam: U.uCam,
        });
        sh.vertexShader = sh.vertexShader
          .replace("#include <common>", /* glsl */ `#include <common>
            ${sampleHeightGLSL}
            ${noiseGLSL}
            ${cursorFieldGLSL}
            uniform vec3 uCam;
            attribute vec4 aSeed;
            uniform vec2 uGrassCenter; uniform float uGrassTile; uniform vec2 uBladeH; uniform vec2 uBladeW;
            uniform float uTime; uniform float uWindTime; uniform float uSea;
            varying float vGrassY; varying float vGrassTint; varying float vFlower; varying float vGlow;`)
          .replace("#include <beginnormal_vertex>", "vec3 objectNormal = vec3(0.0, 1.0, 0.0);")
          .replace("#include <begin_vertex>", /* glsl */ `
            float T = uGrassTile;
            vec2 origin = uGrassCenter - 0.5 * T;
            vec2 wxz = origin + mod(aSeed.xy * T - origin, T);
            vec2 fromC = abs(wxz - uGrassCenter) / (0.5 * T);
            /* переход к гладкому лугу — широкий и мягкий: участок едет с камерой, и узкий край читался волной,
               по которой трава то вырастала, то уходила в землю */
            float edge = 1.0 - smoothstep(0.2, 1.0, max(fromC.x, fromC.y));
            edge = edge * edge * (3.0 - 2.0 * edge);
            float h = hfHeight(wxz);
            float sea = uSea;
            float r1 = aSeed.z; float r2 = aSeed.w; float r3 = fract(r2 * 13.17 + r1 * 3.1);
            float dens = smoothstep(sea + 0.12, sea + 0.5, h);
            for (int k = 0; k < 2; k++) {
              float fk = float(k);
              float level = sea + 0.95 + fk * 1.15 + 0.1 * sin(uTime * 0.21 + fk * 1.7);
              dens *= mix(1.0, smoothstep(0.02, 0.11, abs(h - level)), 0.9 - fk * 0.2);
            }
            float clump = tdNoise(wxz * 0.13 + 7.0);
            dens *= 0.62 + 0.38 * smoothstep(-0.35, 0.3, clump);
            /* v73.4: трава держится вершин и гребней холмов, на склонах её нет, и чем дальше от камеры, тем её
               меньше — будто луг зарастает от вершин и трава постепенно захватывает пространство. Вершина —
               точка выше соседей в пяти метрах вокруг; склон — наклон нормали рельефа */
            float hAvg = 0.25 * (hfHeight(wxz + vec2(5.0, 0.0)) + hfHeight(wxz - vec2(5.0, 0.0))
                               + hfHeight(wxz + vec2(0.0, 5.0)) + hfHeight(wxz - vec2(0.0, 5.0)));
            float crest = smoothstep(-0.12, 0.18, h - hAvg);
            float flatGround = smoothstep(0.82, 0.94, hfNormal(wxz).y);
            float nearCam = 1.0 - smoothstep(11.0, 28.0, length(wxz - uCam.xz));
            float grow = crest * flatGround * nearCam + (clump - 0.5) * 0.12;
            dens *= smoothstep(0.12, 0.45, grow);
            /* край участка: травинки не редеют, а становятся ниже и уходят в луг — иначе по границе рассыпались
               отдельные треугольники */
            float s = step(r1, dens) * step(0.02, edge);
            float bladeH = mix(uBladeH.x, uBladeH.y, r2 * r2) * (0.7 + 0.5 * smoothstep(-0.4, 0.5, clump));
            float bladeW = mix(uBladeW.x, uBladeW.y, r3);
            float gust = tdNoise(wxz * 0.045 + vec2(uWindTime * 0.22, uWindTime * 0.09));
            float wave = sin(uWindTime * 1.25 + dot(wxz, vec2(0.23, 0.14)) + r1 * 2.0);
            /* v73.3: ветер слабее и у каждой травинки свой наклон. Раньше весь луг клонился в одну сторону с
               постоянным креном — сверху это читалось течением, «своей гравитацией» */
            vec2 bend = vec2(0.86, 0.5) * (0.1 * wave + 0.2 * gust + 0.05)
                      + vec2(cos(r1 * 6.2832 + 1.3), sin(r1 * 6.2832 + 1.3)) * (0.08 + 0.14 * r3);
            vec3 field = cursorField(wxz);
            bend += field.xy * 1.6;
            float bl = length(bend);
            if (bl > 1.2) bend *= 1.2 / bl;
            float yy = position.y;
            float ang = r1 * 6.2832;
            /* на кромке захвата травинки ниже — трава будто только прорастает, а не обрывается */
            float hh = bladeH * s * edge * mix(0.25, 1.0, smoothstep(0.15, 0.7, grow)) * (1.0 - 0.25 * field.z);
            vec3 transformed = vec3(wxz.x, h - 0.03, wxz.y)
              + vec3(cos(ang), 0.0, sin(ang)) * position.x * bladeW * s
              + vec3(bend.x * yy * yy * hh, yy * hh * (1.0 - 0.4 * min(bl, 1.0)), bend.y * yy * yy * hh);
            vGrassY = yy;
            vGrassTint = clamp(r3 * 0.6 + gust * 0.5 + 0.2, 0.0, 1.0);
            /* v73: цветы — кончики части травинок в пятнах-куртинах; чаще белые, изредка жёлтые. Под размытием
               главы они читаются мягкими светлыми пятнами, как цветущие кусты на референсе */
            float flowerPatch = smoothstep(0.2, 0.42, tdNoise(wxz * 0.085 + 31.0));
            float pick = fract(r1 * 7.31 + r2 * 3.17);
            vFlower = pick < 0.22 * flowerPatch ? (fract(r2 * 11.3) < 0.4 ? 2.0 : 1.0) : 0.0;
            /* пятна света: солнце пробивается сквозь полог — по склону медленно плывут освещённые поляны */
            vGlow = smoothstep(-0.1, 0.45, tdNoise(wxz * 0.05 + vec2(uWindTime * 0.015, -uWindTime * 0.01) + 13.0));
`);
        sh.fragmentShader = sh.fragmentShader
          .replace("#include <common>", "#include <common>\nvarying float vGrassY;\nvarying float vGrassTint;\nvarying float vFlower;\nvarying float vGlow;")
          /* контровой свет: кончики травинок светятся лаймом на просвет — в освещённых пятнах сильнее */
          .replace("#include <emissivemap_fragment>", `#include <emissivemap_fragment>
            float lit = pow(clamp(vGrassY, 0.0, 1.0), 3.5) * mix(0.1, 1.0, vGlow * vGlow);
            totalEmissiveRadiance += (vFlower > 0.5 ? diffuseColor.rgb * 0.8 : vec3(0.16, 0.3, 0.035)) * lit;`)
          /* обратная грань не переворачивает нормаль — иначе стебли чёрные */
          .replace("#include <normal_fragment_begin>", "#include <normal_fragment_begin>\n normal = normalize(vNormal);")
          /* clamp: у основания интерполяция даёт −1e-7, pow от отрицательного = NaN → чёрные вспышки через bloom */
          .replace("#include <color_fragment>", `#include <color_fragment>
            diffuseColor.rgb = mix(${vec3u(C.root)}, mix(${vec3u(C.tip)}, ${vec3u(C.tipDry)}, vGrassTint), pow(clamp(vGrassY, 0.0, 1.0), 0.45));
            if (vFlower > 0.5) diffuseColor.rgb = mix(diffuseColor.rgb, vFlower > 1.5 ? ${vec3u(C.flowerYellow)} : ${vec3u(C.flower)}, smoothstep(0.5, 0.72, vGrassY));`);
      }, `meadow-grass-${L.name}`, { roughness: 0.85, side: THREE.DoubleSide });

      const mesh = new THREE.Mesh(geo, mat);
      mesh.frustumCulled = false;
      mesh.receiveShadow = L.shadows;
      this.scene.add(mesh);
    }
  }

  private buildPebbles() {
    const U = this.U;
    const count = Math.round(this.q.near / 6);
    let g: THREE.BufferGeometry = new THREE.IcosahedronGeometry(1, 0);
    g.deleteAttribute("normal");
    g.deleteAttribute("uv");
    g = mergeVertices(g);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) { const k = 0.72 + Math.random() * 0.45; p.setXYZ(i, p.getX(i) * k, p.getY(i) * k, p.getZ(i) * k); }
    g.computeVertexNormals();
    const geo = new THREE.InstancedBufferGeometry();
    geo.index = g.index;
    geo.setAttribute("position", g.attributes.position);
    geo.setAttribute("normal", g.attributes.normal);
    const seeds = new Float32Array(count * 4);
    for (let i = 0; i < seeds.length; i++) seeds[i] = Math.random();
    geo.setAttribute("aSeed", new THREE.InstancedBufferAttribute(seeds, 4));
    geo.instanceCount = count;
    this.geometries.push(g, geo);

    const head = /* glsl */ `
      ${sampleHeightGLSL}
      ${noiseGLSL}
      ${cursorFieldGLSL}
      attribute vec4 aSeed;
      uniform vec2 uPebbleCenter; uniform float uTime; uniform float uSea;
      mat3 mdRot(vec3 a) {
        float cx = cos(a.x), sx = sin(a.x), cy = cos(a.y), sy = sin(a.y), cz = cos(a.z), sz = sin(a.z);
        return mat3(cy, 0.0, -sy, 0.0, 1.0, 0.0, sy, 0.0, cy) * mat3(1.0, 0.0, 0.0, 0.0, cx, sx, 0.0, -sx, cx) * mat3(cz, sz, 0.0, -sz, cz, 0.0, 0.0, 0.0, 1.0);
      }`;
    const body = /* glsl */ `
      const float T = 72.0;
      vec2 origin = uPebbleCenter - 0.5 * T;
      vec2 wxz = origin + mod(aSeed.xy * T - origin, T);
      vec2 fromC = abs(wxz - uPebbleCenter) / (0.5 * T);
      float edge = 1.0 - smoothstep(0.8, 1.0, max(fromC.x, fromC.y));
      float h = hfHeight(wxz);
      float sea = uSea;
      float r1 = aSeed.z; float r2 = aSeed.w; float r3 = fract(r2 * 13.17 + r1 * 3.1);
      float bands = 0.0;
      for (int k = 0; k < 2; k++) {
        float fk = float(k);
        float d = (h - (sea + 0.95 + fk * 1.15 + 0.1 * sin(uTime * 0.21 + fk * 1.7))) / 0.18;
        bands += exp(-d * d) * (1.0 - fk * 0.3);
      }
      float ds = (h - (sea + 0.15)) / 0.2;
      float shoreBand = exp(-ds * ds);
      float veins = smoothstep(0.8, 0.97, 1.0 - abs(tdNoise(wxz * 0.085 + 4.0)) * 2.2);
      float mask = clamp(bands * 0.1 + shoreBand * 0.12 + veins * 0.18 + 0.006, 0.0, 1.0);
      vec3 field = cursorField(wxz);
      float jitter = 0.75 + 0.5 * r3;
      wxz += field.xy * 0.9 * jitter;
      float lift = field.z * (0.1 + 0.32 * fract(r1 * 31.7)) * jitter;
      if (field.z > 0.0005) h = hfHeight(wxz);
      float visible = step(r1, mask) * edge * smoothstep(sea - 0.05, sea + 0.08, h);
      float sc = mix(0.04, 0.2, pow(fract(r2 * 3.7), 2.6)) * (0.85 + 0.4 * min(bands + shoreBand, 1.0)) * visible;
      mat3 rot = mdRot(vec3(r1 * 6.2832 + field.y * 0.6, r2 * 6.2832 + field.z * (r3 - 0.5) * 0.8, r3 * 6.2832 - field.x * 0.6));
      vec3 transformed = rot * (position * vec3(1.0, 0.62, 0.85)) * sc + vec3(wxz.x, h + sc * 0.3 + lift, wxz.y);`;
    const uniforms = {
      uHeight: U.uHeight, uCenter: U.uCenter, uSize: U.uSize, uTexel: U.uTexel,
      uPebbleCenter: U.uPebbleCenter, uTime: U.uTime, uSea: U.uSea,
      uHead: U.uHead, uWaves: U.uWaves, uFieldBounds: U.uFieldBounds,
    };
    const mat = this.material((sh) => {
      Object.assign(sh.uniforms, uniforms);
      sh.vertexShader = sh.vertexShader
        .replace("#include <common>", `#include <common>\n${head}\nvarying float vShade;`)
        .replace("#include <begin_vertex>", `${body}\n vShade = 0.55 + 0.6 * pow(fract(r1 * 17.3 + r2), 1.4);`);
      sh.fragmentShader = sh.fragmentShader
        .replace("#include <common>", "#include <common>\nvarying float vShade;")
        .replace("#include <color_fragment>", `#include <color_fragment>\n diffuseColor.rgb = ${vec3u(C.stone)} * vShade;`);
    }, "meadow-pebbles", { roughness: 0.62, flatShading: true });
    const depth = this.depthMaterial((sh) => {
      Object.assign(sh.uniforms, uniforms);
      sh.vertexShader = sh.vertexShader
        .replace("#include <common>", `#include <common>\n${head}`)
        .replace("#include <begin_vertex>", body);
    }, "meadow-pebbles-depth");
    const mesh = new THREE.Mesh(geo, mat);
    mesh.customDepthMaterial = depth;
    mesh.frustumCulled = false;
    mesh.castShadow = this.q.shadows;
    mesh.receiveShadow = true;
    this.scene.add(mesh);
  }

  private buildDust() {
    const U = this.U;
    const count = 2000;
    const geo = new THREE.BufferGeometry();
    const seeds = new Float32Array(count * 3);
    for (let i = 0; i < seeds.length; i++) seeds[i] = Math.random();
    geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    geo.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 3));
    const mat = new THREE.ShaderMaterial({
      uniforms: { uCam: U.uCam, uTime: U.uTime, uDpr: U.uDpr, uHead: U.uHead, uWaves: U.uWaves, uFieldBounds: U.uFieldBounds },
      vertexShader: /* glsl */ `
        attribute vec3 aSeed;
        uniform vec3 uCam; uniform float uTime; uniform float uDpr;
        ${cursorFieldGLSL}
        varying float vAlpha;
        varying float vSpin;
        varying float vTone;
        void main() {
          vSpin = uTime * (0.8 + aSeed.z * 1.6) + aSeed.x * 20.0;
          vTone = fract(aSeed.y * 7.1);
          vec3 box = vec3(56.0, 22.0, 56.0);
          /* v73.1: лепестки медленно падают и кружатся, а не висят пылью */
          vec3 p = aSeed * box + vec3(sin(uTime * 0.4 + aSeed.x * 40.0) * 1.4, -uTime * (0.35 + aSeed.y * 0.5), uTime * 0.35);
          vec3 origin = uCam - box * vec3(0.5, 0.65, 0.5);
          vec3 w = origin + mod(p - origin, box);
          vec3 field = cursorField(w.xz);
          w.xz += field.xy * 1.2;
          w.y += field.z * (0.6 + 1.2 * aSeed.y);
          vec4 mv = viewMatrix * vec4(w, 1.0);
          gl_Position = projectionMatrix * mv;
          float size = (2.4 + 5.0 * pow(fract(aSeed.z * 9.13), 4.0)) * uDpr * 14.0 / -mv.z;
          /* не меньше 2 px: субпиксельные точки мерцают между кадрами */
          gl_PointSize = clamp(size, 2.0 * uDpr, 7.0 * uDpr);
          float tw = 0.75 + 0.25 * sin(uTime * (0.6 + aSeed.x * 1.2) + aSeed.y * 50.0);
          vAlpha = tw * min(size / (2.0 * uDpr), 1.0) * smoothstep(60.0, 20.0, -mv.z) * smoothstep(0.5, 2.0, -mv.z);
        }`,
      fragmentShader: /* glsl */ `
        varying float vAlpha;
        varying float vSpin;
        varying float vTone;
        void main() {
          /* лепесток: вытянутый эллипс, поворачивается и «переворачивается» (сплющивается) в полёте */
          vec2 q = gl_PointCoord - 0.5;
          float c = cos(vSpin), s = sin(vSpin);
          q = mat2(c, -s, s, c) * q;
          q.y /= max(0.25, abs(sin(vSpin * 0.7))) * 0.55;
          float a = smoothstep(0.5, 0.3, length(q)) * vAlpha;
          vec3 col = mix(vec3(0.95, 0.42, 0.26), vec3(0.98, 0.72, 0.52), vTone);
          gl_FragColor = vec4(col * a, a);
        }`,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    });
    const points = new THREE.Points(geo, mat);
    points.frustumCulled = false;
    this.scene.add(points);
    this.materials.push(mat);
    this.geometries.push(geo);
  }


  /* ── кадр ───────────────────────────────────────────────────────────────── */

  setSize(w: number, h: number, dpr: number) {
    this.camera.aspect = w / Math.max(1, h);
    this.camera.updateProjectionMatrix();
    this.U.uDpr.value = dpr;
  }

  /** доля травы 0…1 (ступень качества холма) */
  setDensity(k: number) {
    this.density = THREE.MathUtils.clamp(k, 0.05, 1);
    for (const g of this.grass) g.geo.instanceCount = Math.max(1, Math.floor(g.max * this.density));
  }

  /** указатель в NDC; null — курсор ушёл (или сенсорный экран) */
  setPointer(ndc: THREE.Vector2 | null) {
    this.hover = !!ndc;
    if (ndc) this.pointer.copy(ndc);
  }

  update(dt: number) {
    dt = Math.min(dt, 1 / 20);
    const U = this.U;
    this.t += dt;
    const t = this.t;
    U.uTime.value = t;
    U.uWindTime.value += dt;
    U.uSea.value = SEA + 0.16 * Math.sin(t * 0.021) + 0.06 * Math.sin(t * 0.37 - 0.6);
    const sea = U.uSea.value;

    /* прогулка: низкий полёт над травой — фон под текстом и карточками, горизонт в кадре */
    const smooth = (x: number) => x * x * (3 - 2 * x);
    const pathX = (tt: number) => 16 * Math.sin(tt * 0.029) + 6 * Math.sin(tt * 0.071 + 1.3);
    const breath = 0.5 + 0.5 * Math.sin(t * 0.05 + 1.9);
    /* v73.2: сверху и подальше (владелец): 7–11 м над лугом, взгляд вниз под 30–42°. Трава при этом читается —
       с тех пор как её шейдер снова собирается, и размытие главы вдвое слабее */
    let height = THREE.MathUtils.lerp(7, 11, smooth(breath)) + Math.sin(t * 0.105) * 0.8;
    this.walked += dt * 2.1;
    this.mouse.lerp(this.hover ? this.pointer : Meadow.ZERO, 1 - Math.exp(-dt * 2.4));
    const x = pathX(t) + this.mouse.x * 0.6;
    const z = -this.walked;
    const heading = Math.atan2(pathX(t + 0.5) - pathX(t - 0.5), 2.1);
    let ground = sea;
    for (const ahead of [0, 4, 9]) ground = Math.max(ground, terrainHeight(x + Math.sin(heading) * ahead, z - Math.cos(heading) * ahead, t));
    if (this.groundSmooth === null) this.groundSmooth = ground;
    this.groundSmooth += (ground - this.groundSmooth) * Math.min(1, dt * (ground > this.groundSmooth ? 3 : 0.8));
    height = Math.max(height, this.groundSmooth + 5.5);
    const lift = THREE.MathUtils.clamp((height - 4) / 15, 0, 1);
    /* v73: взгляд чуть сверху вниз, под углом: склон с цветами занимает кадр, серое небо — полосой сверху.
       Было −14…−40° (одна трава и чёрная полоска неба), почти горизонт (−4…−13°) владельцу показался плоским */
    const pitch = THREE.MathUtils.degToRad(THREE.MathUtils.lerp(-30, -42, smooth(lift)) + Math.sin(t * 0.13) * 2 + this.mouse.y * 2.5);
    const yaw = THREE.MathUtils.degToRad(THREE.MathUtils.radToDeg(heading) * 0.8 + Math.sin(t * 0.057) * 9 - this.mouse.x * 4);
    this.camera.position.set(x, height, z);
    this.dir.set(-Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), -Math.cos(yaw) * Math.cos(pitch));
    const dist = Math.min(Math.max(height - this.groundSmooth, 1) / Math.max(-this.dir.y, 0.12), 70);
    this.look.copy(this.camera.position).addScaledVector(this.dir, dist);
    this.camera.lookAt(this.look);
    this.camera.updateMatrixWorld();

    const tx = this.texel;
    const ahead = new THREE.Vector2(this.dir.x, this.dir.z).normalize().multiplyScalar(this.worldSize * 0.28);
    U.uCenter.value.set(Math.round((x + ahead.x) / tx) * tx, Math.round((z + ahead.y) / tx) * tx);
    U.uPebbleCenter.value.set(this.look.x * 0.6 + x * 0.4, this.look.z * 0.6 + z * 0.4);
    U.uCam.value.copy(this.camera.position);
    const horiz = Math.hypot(this.dir.x, this.dir.z);
    for (const g of this.grass) {
      const reach = Math.min(dist, g.tile * 0.4);
      g.center.set(x + (this.dir.x / horiz) * reach, z + (this.dir.z / horiz) * reach);
    }

    /* солнце: низко, из глубины кадра справа — длинные тени к зрителю */
    const el = THREE.MathUtils.degToRad(22), az = THREE.MathUtils.degToRad(12);
    const fx = Math.round(this.look.x / 0.05) * 0.05, fz = Math.round(this.look.z / 0.05) * 0.05;
    this.sun.target.position.set(fx, 0, fz);
    this.sun.position.set(fx + Math.sin(az) * Math.cos(el) * 80, Math.sin(el) * 80, fz - Math.cos(az) * Math.cos(el) * 80);
    this.sun.target.updateMatrixWorld();


    this.updateCursor(dt);
  }

  private updateCursor(dt: number) {
    const U = this.U;
    const HEAD = U.uHead.value, WAVES = U.uWaves.value;
    let found = false;
    if (this.hover) {
      this.ray.setFromCamera(this.pointer, this.camera);
      found = this.pick(this.ray.ray.origin, this.ray.ray.direction, U.uTime.value, U.uSea.value, this.hit);
    }
    this.hoverAmt += ((found ? 1 : 0) - this.hoverAmt) * Math.min(1, dt * (found ? 1.5 : 1));
    if (found) {
      if (HEAD.w < 0.01) HEAD.set(this.hit.x, this.hit.y, this.hit.z, HEAD.w);
      const k = Math.min(1, dt * 4);
      HEAD.x += (this.hit.x - HEAD.x) * k;
      HEAD.y += (this.hit.y - HEAD.y) * k;
      HEAD.z += (this.hit.z - HEAD.z) * k;
      this.sinceSpawn += dt;
      if (this.lastSpawn.distanceToSquared(HEAD) > 1.4 * 1.4 && this.sinceSpawn > 0.17) {
        let s = 0;
        for (let i = 0; i < WAVES.length; i++) {
          const a = WAVES[i].w;
          if (a < 0 || a > WAVE_LIFE) { s = i; break; }
          if (a > WAVES[s].w) s = i;
        }
        WAVES[s].set(HEAD.x, HEAD.y, HEAD.z, 0);
        this.lastSpawn.set(HEAD.x, HEAD.y, HEAD.z);
        this.sinceSpawn = 0;
      }
    }
    const h = Math.min(Math.max(this.hoverAmt, 0), 1);
    HEAD.w = h * h * (3 - 2 * h);
    let minX = 1e5, minZ = 1e5, maxX = -1e5, maxZ = -1e5;
    for (const wv of WAVES) {
      if (wv.w < 0) continue;
      wv.w += dt;
      if (wv.w > WAVE_LIFE) { wv.w = -1; continue; }
      minX = Math.min(minX, wv.x - WAVE_REACH); maxX = Math.max(maxX, wv.x + WAVE_REACH);
      minZ = Math.min(minZ, wv.z - WAVE_REACH); maxZ = Math.max(maxZ, wv.z + WAVE_REACH);
    }
    if (HEAD.w > 0.001) {
      const r = HEAD_RADIUS * 3;
      minX = Math.min(minX, HEAD.x - r); maxX = Math.max(maxX, HEAD.x + r);
      minZ = Math.min(minZ, HEAD.z - r); maxZ = Math.max(maxZ, HEAD.z + r);
    }
    U.uFieldBounds.value.set(minX, minZ, maxX, maxZ);
  }

  private pick(origin: THREE.Vector3, dir: THREE.Vector3, t: number, sea: number, out: THREE.Vector3) {
    const surface = (x: number, z: number) => Math.max(terrainHeight(x, z, t), sea);
    let prev = 0, d = 0.5;
    for (let i = 0; i < 200 && d < 120; i++) {
      if (origin.y + dir.y * d <= surface(origin.x + dir.x * d, origin.z + dir.z * d)) {
        let lo = prev, hi = d;
        for (let k = 0; k < 7; k++) {
          const m = (lo + hi) / 2;
          if (origin.y + dir.y * m <= surface(origin.x + dir.x * m, origin.z + dir.z * m)) hi = m; else lo = m;
        }
        out.copy(origin).addScaledVector(dir, hi);
        return true;
      }
      prev = d;
      d += Math.max(0.25, d * 0.025);
    }
    return false;
  }

  /** карта высот + сцена луга в target (HDR, линейный цвет — финал холма сам тонмаппит) */
  render(target: THREE.WebGLRenderTarget) {
    const r = this.renderer;
    r.setRenderTarget(this.heightRT);
    r.render(this.heightScene, this.heightCam);
    /* у холма тени запечены (autoUpdate=false) — луг обновляет свою карту каждый кадр сам */
    if (this.q.shadows) r.shadowMap.needsUpdate = true;
    r.setRenderTarget(target);
    r.render(this.scene, this.camera);
  }

  /** шейдеры луга — заранее, в ту же цель, что и кадр: первый показ без рывка */
  compile(target: THREE.WebGLRenderTarget) {
    const r = this.renderer;
    const prev = r.getRenderTarget();
    r.setRenderTarget(this.heightRT);
    const a = r.compileAsync(this.heightScene, this.heightCam);
    r.setRenderTarget(target);
    const b = r.compileAsync(this.scene, this.camera);
    r.setRenderTarget(prev);
    r.initRenderTarget(this.heightRT);
    return Promise.all([a, b]).then(() => undefined);
  }

  dispose() {
    this.heightRT.dispose();
    for (const m of this.materials) m.dispose();
    for (const g of this.geometries) g.dispose();
    this.sun.shadow.map?.dispose();
  }
}
