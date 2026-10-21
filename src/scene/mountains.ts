import * as THREE from "three";
import { SKY_PARS } from "./shaders";

/* v102: горы за грядами — рельеф из стенда «ясный день» (ветка lab/sunny-day), который туда пришёл из Window Seat.
   По просьбе Никиты горы не главный герой: они стоят в той же закатной дымке, что и гряды, и читаются силуэтами
   на два-три тона темнее неба, а не скалами и снегом.

   Рельеф с эрозией дорогой (десяток октав шума с производными), поэтому он считается ОДИН раз при загрузке в
   карту: высота (вершины), нормаль и «вогнутость». Считается в «настоящих» метрах (горы ~1,2 км в 3–14 км) и
   входит в сцену уменьшенным в 1/SCALE раз — угловые размеры те же, а камера холма видит на 400 м.

   Солнце висит у горизонта (SUN_DIR в HillScene, ~2°). Горы выше двух градусов закрыли бы его — так в v78 убрали
   дальнюю гряду. Поэтому в стороне солнца хребет проваливается в седловину: солнце садится между вершинами.
   ?mtn=<км> — сдвиг по хребту (выбрать вид), ?mtn=off — без гор. */

const PERIOD = 24000;
const TEX_W = 2048, TEX_H = 384;
const NEAR = 3200, FAR = 14000;
/* на сенсорных экранах сетка вчетверо реже: камера там ниже, горы почти целиком за холмом */
const COARSE = matchMedia("(hover: none) and (pointer: coarse)").matches;
const SEG_X = COARSE ? 384 : 768, SEG_Z = COARSE ? 70 : 140;
const SCALE = 0.02;
/* подножие гор в сцене холма (мировой y) и отступ: горы начинаются за второй грядой */
const BASE_Y = -2.4;
const PUSH_Z = -40;
const DEPTH_GLSL = /* glsl */ `
float rowDepth(float v) { return ${NEAR.toFixed(1)} + ${(FAR - NEAR).toFixed(1)} * pow(v, 1.6); }
`;
const VERT_FS = /* glsl */ `void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }`;

/* свой шум: целочисленный хеш клетки решётки (нечётные множители и перемешивание сдвигами), поверх — value-noise,
   fbm и гребневый шум */
const NOISE = /* glsl */ `
float hash12(vec2 p) {
  uvec2 q = uvec2(ivec2(floor(p)) + ivec2(40503, 21011));
  uint h = q.x * 0xA3C59AC3u + q.y * 0x2D7E1B4Fu;
  h ^= h >> 16u; h *= 0x68E31DA5u; h ^= h >> 13u; h *= 0x4B1C7E39u; h ^= h >> 16u;
  return float(h >> 8u) * (1.0 / 16777216.0);
}
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash12(i), b = hash12(i + vec2(1.0, 0.0));
  float c = hash12(i + vec2(0.0, 1.0)), d = hash12(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}
float fbm(vec2 p) {
  float s = 0.0, a = 0.5;
  mat2 r = mat2(0.8, -0.6, 0.6, 0.8);
  for (int i = 0; i < 5; i++) { s += a * vnoise(p); p = r * p * 2.03 + 17.1; a *= 0.5; }
  return s;
}
float ridged(vec2 p) {
  float s = 0.0, a = 0.5, w = 1.0;
  mat2 r = mat2(0.8, -0.6, 0.6, 0.8);
  for (int i = 0; i < 6; i++) {
    float n = 1.0 - abs(vnoise(p) * 2.0 - 1.0);
    n *= n;
    s += a * n * w;
    w = clamp(n * 1.6, 0.0, 1.0);
    p = r * p * 2.1 + 9.7; a *= 0.5;
  }
  return s;
}
`;

/* высота: острые гребни + рельеф «с эрозией» — производные шума гасят мелкие октавы на крутых склонах */
const HEIGHT_FS = /* glsl */ `
${NOISE}
${DEPTH_GLSL}
uniform vec4 uStrip;
vec3 noised(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f), du = 6.0 * f * (1.0 - f);
  float a = hash12(i), b = hash12(i + vec2(1.0, 0.0)), c = hash12(i + vec2(0.0, 1.0)), d = hash12(i + vec2(1.0, 1.0));
  return vec3(a + (b - a) * u.x + (c - a) * u.y + (a - b - c + d) * u.x * u.y,
              du * (vec2(b - a, c - a) + (a - b - c + d) * u.yx));
}
float eroded(vec2 p) {
  float s = 0.0, a = 0.5;
  vec2 d = vec2(0.0);
  mat2 m = mat2(0.8, -0.6, 0.6, 0.8);
  for (int i = 0; i < 10; i++) {
    vec3 n = noised(p);
    d += n.yz;
    s += a * n.x / (1.0 + dot(d, d));
    a *= 0.5;
    p = m * p * 2.0 + 3.7;
  }
  return s;
}
float terrain(vec2 p) {
  float zz = -p.y;
  float env = smoothstep(${NEAR.toFixed(1)}, 6400.0, zz) * (1.0 - 0.3 * smoothstep(10500.0, 13800.0, zz));
  vec2 q = p * vec2(0.00040, 0.00052);
  vec2 warp = vec2(fbm(q * 0.7 + 1.3), fbm(q * 0.7 - 4.1)) - 0.5;
  float r = ridged(q + warp * 0.8);
  float e = eroded(p * 0.0011 + warp * 1.4);
  float big = fbm(p * 0.00015 + 3.0);
  float h = (r * 1.25 + e * 0.75 + big * 0.45 - 0.62) * 1220.0 * env;
  h += (e - 0.25) * 260.0 * smoothstep(${NEAR.toFixed(1)}, 4300.0, zz);
  return max(h, 0.0) + 2.0;
}
float heightAt(float u, float z) {
  float h = terrain(vec2(u, z));
  float w = smoothstep(${(PERIOD - 3000).toFixed(1)}, ${PERIOD.toFixed(1)}, u);
  if (w > 0.0) h = mix(h, terrain(vec2(u - ${PERIOD.toFixed(1)}, z)), w);
  return h;
}
void main() {
  vec2 px = floor(gl_FragCoord.xy);
  if (px.y < uStrip.x || px.y >= uStrip.y) discard;
  float u = (px.x + 0.5) / ${TEX_W}.0 * ${PERIOD.toFixed(1)};
  float z = -rowDepth((px.y + 0.5) / ${TEX_H}.0);
  gl_FragColor = vec4(heightAt(u, z), 0.0, 0.0, 1.0);
}
`;

const NORMAL_FS = /* glsl */ `
${DEPTH_GLSL}
uniform sampler2D tH;
float H(ivec2 c) { c.x = (c.x + ${TEX_W}) % ${TEX_W}; c.y = clamp(c.y, 0, ${TEX_H - 1}); return texelFetch(tH, c, 0).r; }
void main() {
  ivec2 c = ivec2(gl_FragCoord.xy);
  float dx = ${(PERIOD / TEX_W).toFixed(4)};
  float v0 = (float(c.y) + 0.5) / ${TEX_H}.0;
  float dz = rowDepth(min(v0 + 1.0 / ${TEX_H}.0, 1.0)) - rowDepth(max(v0 - 1.0 / ${TEX_H}.0, 0.0));
  float hx = H(c + ivec2(1, 0)) - H(c - ivec2(1, 0));
  float hz = H(c + ivec2(0, 1)) - H(c - ivec2(0, 1));
  vec3 n = normalize(vec3(-hx / (2.0 * dx), 1.0, hz / dz));
  float h = H(c);
  float ring = 0.0;
  for (int i = 0; i < 8; i++) {
    float a = float(i) * 0.785398;
    ring += H(c + ivec2(round(cos(a) * 6.0), round(sin(a) * 3.0)));
  }
  float cav = clamp((ring / 8.0 - h) / 40.0, -1.0, 1.0);
  gl_FragColor = vec4(h, n.x, n.z, cav);
}
`;

export function createMountains(renderer: THREE.WebGLRenderer, shared: { sky: Record<string, THREE.IUniform> }) {
  const q = new URLSearchParams(location.search);
  const offset = Number(q.get("mtn") ?? 6.2) * 1000;
  const floatOk = renderer.extensions.has("EXT_color_buffer_float");
  const heightRT = new THREE.WebGLRenderTarget(TEX_W, TEX_H, { type: floatOk ? THREE.FloatType : THREE.HalfFloatType, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, depthBuffer: false });
  const mapRT = new THREE.WebGLRenderTarget(TEX_W, TEX_H, { type: THREE.HalfFloatType, format: THREE.RGBAFormat, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: false, wrapS: THREE.RepeatWrapping, wrapT: THREE.ClampToEdgeWrapping });

  const quadScene = new THREE.Scene();
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2));
  quad.frustumCulled = false;
  quadScene.add(quad);
  const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const flat = { vertexShader: VERT_FS, depthTest: false, depthWrite: false };
  const heightMat = new THREE.ShaderMaterial({ ...flat, fragmentShader: HEIGHT_FS, uniforms: { uStrip: { value: [0, 0, 0, 0] } } });
  const normalMat = new THREE.ShaderMaterial({ ...flat, fragmentShader: NORMAL_FS, uniforms: { tH: { value: heightRT.texture } } });
  const pass = (mat: THREE.ShaderMaterial, rt: THREE.WebGLRenderTarget) => {
    quad.material = mat;
    const prev = renderer.getRenderTarget();
    renderer.setRenderTarget(rt);
    renderer.render(quadScene, cam);
    renderer.setRenderTarget(prev);
  };

  const geo = new THREE.PlaneGeometry(PERIOD, 1, SEG_X, SEG_Z);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const uv = geo.attributes.uv as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) pos.setXYZ(i, pos.getX(i), 0, -(NEAR + (FAR - NEAR) * Math.pow(uv.getY(i), 1.6)));
  geo.computeBoundingSphere();

  const material = new THREE.ShaderMaterial({
    uniforms: {
      ...shared.sky,
      uOffset: { value: offset },
      uScale: { value: SCALE },
      /* 0 — рельеф ещё не запечён: вершины уходят за кадр. Меш виден с первого кадра, чтобы его программа собралась
         вместе со всей сценой (precompile), а не синхронно в момент появления гор */
      uReady: { value: 0 },
      /* x — доля неба вблизи (ближние склоны), y — плотность воздуха на километр; ?mhaze=0.32,0.095 */
      uHaze: { value: new THREE.Vector2(...((q.get("mhaze") ?? "0.32,0.095").split(",").map(Number) as [number, number])) },
      tMap: { value: mapRT.texture },
    },
    vertexShader: /* glsl */ `
      uniform float uOffset;
      uniform float uReady;
      uniform vec3 uSunDir;
      uniform sampler2D tMap;
      varying vec3 vReal;
      varying vec3 vWorld;
      varying vec2 vMap;
      void main() {
        vMap = vec2((position.x + uOffset) / ${PERIOD.toFixed(1)}, uv.y);
        vec3 p = position;
        p.y = textureLod(tMap, vMap, 0.0).r;
        /* седловина под солнцем: по азимуту от камеры в сторону солнца хребет опускается, и солнце садится между
           вершинами, а не за ними */
        vec3 w0 = (modelMatrix * vec4(position, 1.0)).xyz;
        float off = acos(clamp(dot(normalize(w0.xz - cameraPosition.xz), normalize(uSunDir.xz)), -1.0, 1.0));
        p.y *= mix(0.1, 1.0, smoothstep(0.03, 0.32, off));
        vReal = p;
        vWorld = (modelMatrix * vec4(p, 1.0)).xyz;
        gl_Position = uReady > 0.5 ? projectionMatrix * modelViewMatrix * vec4(p, 1.0) : vec4(2.0, 2.0, 2.0, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform sampler2D tMap;
      uniform float uScale;
      uniform vec2 uHaze;
      varying vec3 vReal;
      varying vec3 vWorld;
      varying vec2 vMap;
      ${SKY_PARS}
      ${NOISE}
      void main() {
        vec4 m = texture2D(tMap, vMap);
        float h = vReal.y;
        vec3 n = normalize(vec3(m.g, sqrt(max(1.0 - m.g * m.g - m.b * m.b, 0.0)), m.b));
        float cav = m.a;
        vec2 p = vec2(vMap.x * ${PERIOD.toFixed(1)}, vReal.z);
        float dn = fbm(p * 0.004);
        float slope = 1.0 - n.y;

        /* материалы приглушены: лес у подножия, выше — камень; снега нет — в закатной дымке он вспыхивал бы пятнами */
        vec3 forest = vec3(0.05, 0.07, 0.04);
        vec3 rock = mix(vec3(0.16, 0.15, 0.15), vec3(0.24, 0.22, 0.20), dn);
        float treeline = 420.0 + (dn - 0.5) * 220.0;
        vec3 alb = mix(forest, rock, smoothstep(0.35, 0.65, slope + smoothstep(treeline, treeline + 400.0, h) * 0.4 - cav * 0.3));

        /* свет: солнце низко и впереди, к камере повёрнута теневая сторона — склоны берут свет неба, гребни против
           солнца ловят кант, как у гряд */
        vec3 V = vWorld - cameraPosition;
        vec3 vd = normalize(V);
        float ao = clamp(0.75 + cav * 0.8, 0.35, 1.0);
        vec3 amb = mix(uHorizon, uZenith, 0.5 + 0.5 * n.y) * 0.6;
        float wrap = max((dot(n, uSunDir) + 0.2) / 1.2, 0.0);
        vec3 col = alb * (uSunCol * wrap * 0.5 + amb * ao);

        /* воздух: цвет неба прямо за горой (тот же skyBase и свечение вокруг солнца, что у неба и гряд) */
        vec3 sky = skyBase(vd);
        float cosA = max(dot(vd, uSunDir), 0.0);
        sky += uSunCol * (pow(cosA, 90.0) * 0.3 + pow(cosA, 12.0) * 0.06) + skyMie(vd);
        float km = length(V) / uScale * 0.001;
        float air = uHaze.x + (1.0 - uHaze.x) * (1.0 - exp(-km * uHaze.y));
        /* подножие тонет в дымке долины — без ровной границы с грядами */
        air = max(air, smoothstep(260.0, 0.0, h) * 0.85);
        gl_FragColor = vec4(mix(col, sky, clamp(air, 0.0, 1.0)), 1.0);
      }
    `,
  });
  const mesh = new THREE.Mesh(geo, material);
  mesh.frustumCulled = false;
  mesh.scale.setScalar(SCALE);
  mesh.position.set(0, BASE_Y, PUSH_Z);
  /* после гряд (renderOrder 4–6), до неба (10): что закрыто грядами, не считается */
  mesh.renderOrder = 8;
  mesh.name = "mountains";

  /* Рельеф считается полосами по кадру: один большой проход может подвесить слабую видеокарту дольше, чем
     браузер разрешает. Пока не готово — гор нет, видно небо. */
  async function bake() {
    const STRIPS = 8;
    /* полосы дописываются в одну цель — без очистки; между кадрами сцена холма рендерится как обычно */
    const autoClear = renderer.autoClear;
    for (let s = 0; s < STRIPS; s++) {
      heightMat.uniforms.uStrip.value = [Math.floor((s * TEX_H) / STRIPS), Math.floor(((s + 1) * TEX_H) / STRIPS), 0, 0];
      renderer.autoClear = false;
      pass(heightMat, heightRT);
      renderer.autoClear = autoClear;
      await new Promise((r) => requestAnimationFrame(r));
    }
    pass(normalMat, mapRT);
    heightRT.dispose();
    heightMat.dispose();
    normalMat.dispose();
    material.uniforms.uReady.value = 1;
  }
  return { mesh, bake };
}
