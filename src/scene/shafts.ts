import * as THREE from "three";
import { FullScreenQuad } from "three/examples/jsm/postprocessing/Pass.js";
import { fullscreenVertex } from "./shaders";

/* v124: объёмные лучи по мотивам RDR2 (доклад Ф. Бауэра, SIGGRAPH 2019, сл. 62: вдоль луча взгляда копится доля
   освещённых шагов, и ею умножается подсветка воздуха). Код и устройство свои.

   Радиальное размытие яркого пятна у солнца (godBlur) даёт ровную пелену: небо за кроной светлое везде, и полос
   из него не выходит. Здесь считается сам воздух. На каждом шаге луча взгляда спрашиваем: светит ли сюда солнце?
   Тень дают две вещи, и обе запекаются заранее, потому что солнце у нас неподвижно:
   - холм: для каждой точки xz — высота, ниже которой гребень закрывает солнце (карта 128×128 по тому же куполу, что
     terrain.ts, без мелких кочек — для воздуха они не видны);
   - крона: силуэт дерева, снятый ортокамерой со стороны солнца (256×256, листва со своими просветами). Дерево
     качается на ветру, поэтому снимок обновляется через кадр — полосы в воздухе дрожат вместе с листьями.
   Проход идёт на четверти разрешения, 24 шага со сдвигом старта по шуму, потом мягко размывается.
   Результат — знаковая поправка к дымке, которую уже нарисовали материалы (applyFog): освещённый воздух чуть
   светлее, воздух в тени кроны и гребня темнее. Средняя яркость кадра почти не меняется, а пелены нет. */

const HILL = { height: 2.3, spreadX: 6.8, spreadZ: 4.4 };
/* область карты тени холма: камера стоит на +z, солнце на −z */
const MAP = { x0: -30, x1: 30, z0: -24, z1: 36, n: 128 };

const shaftFragment = /* glsl */ `
uniform mat4 uInvViewProj;
uniform vec3 uCam;
uniform vec3 uSunDir;
uniform sampler2D tHill;
uniform vec4 uHillRect;   /* x0, z0, 1/(x1−x0), 1/(z1−z0) */
uniform sampler2D tCrown; /* глубина кроны со стороны солнца */
uniform mat4 uCrownMat;   /* мир → клип ортокамеры солнца */
uniform vec4 uCrown;      /* xyz — центр кроны, w — радиус */
uniform vec3 uShaft;      /* x — плотность воздуха на метр, y — какая доля освещённости считается «обычной», z — дальность, м */
varying vec2 vUv;
float domeAt(vec2 p){ return ${HILL.height.toFixed(2)} * exp(-(p.x * p.x / ${(HILL.spreadX ** 2).toFixed(2)} + p.y * p.y / ${(HILL.spreadZ ** 2).toFixed(2)})); }
float hgPeak(float g, float mu){ return (1.0 - g * g) / pow(1.0 + g * g - 2.0 * g * mu, 1.5) * ((1.0 - g) * (1.0 - g) / (1.0 + g)); }
float ign(vec2 p){ return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715)))); }
float litAt(vec3 p){
  vec2 hq = (p.xz - uHillRect.xy) * uHillRect.zw;
  float lit = 1.0;
  if (hq.x > 0.0 && hq.x < 1.0 && hq.y > 0.0 && hq.y < 1.0) {
    float h = textureLod(tHill, hq, 0.0).r;
    lit = smoothstep(h - 0.12, h + 0.25, p.y);
  }
  vec4 c = uCrownMat * vec4(p, 1.0);
  vec2 cq = c.xy * 0.5 + 0.5;
  /* v131: тень кроны — по глубине: воздух в тени, только если между ним и солнцем есть листва */
  if (cq.x > 0.0 && cq.x < 1.0 && cq.y > 0.0 && cq.y < 1.0 && uCrown.w > 0.0)
    lit *= step(c.z * 0.5 + 0.5, textureLod(tCrown, cq, 0.0).r + 0.002);
  return lit;
}
void main(){
  vec4 far = uInvViewProj * vec4(vUv * 2.0 - 1.0, 1.0, 1.0);
  vec3 dir = normalize(far.xyz / far.w - uCam);
  const int STEPS = 24;
  float dt = uShaft.z / float(STEPS);
  float t = dt * ign(gl_FragCoord.xy);
  float lit = 0.0, air = 0.0;
  for (int i = 0; i < STEPS; i++) {
    vec3 p = uCam + dir * t;
    /* земля холма или низина за ним — дальше воздуха нет */
    if (p.y < domeAt(p.xz) - 0.05 || p.y < -1.5) break;
    float w = exp(-uShaft.x * t) * uShaft.x * dt;
    lit += litAt(p) * w;
    air += w;
    t += dt;
  }
  /* рассеяние вперёд, как у дымки (airPhase): полосы видны в стороне солнца и тают, когда смотришь от него */
  float mu = dot(dir, uSunDir);
  float ph = max(mix(hgPeak(0.8, mu), hgPeak(0.3, mu), 0.35), 0.03);
  gl_FragColor = vec4((lit - uShaft.y * air) * ph, air * ph, 0.0, 1.0);
}
`;

export type Shafts = ReturnType<typeof createShafts>;

export function createShafts(renderer: THREE.WebGLRenderer, camera: THREE.PerspectiveCamera, sunDir: THREE.Vector3) {
  const q = new URLSearchParams(location.search);
  const cfg = (q.get("shafts")?.split(",").map(Number) ?? []) as number[];

  /* ---- тень холма: высота, выше которой точку освещает солнце ----
     v125: солнце теперь переезжает (ясно — справа, сумерки — за горами), поэтому карта считается на видеокарте, в
     том же куполе: 160 шагов к солнцу на тексель, 128×128 — доли миллисекунды, можно хоть каждый кадр переезда */
  const s = sunDir.clone().normalize();
  const hillRT = new THREE.WebGLRenderTarget(MAP.n, MAP.n, { type: THREE.HalfFloatType, format: THREE.RedFormat, depthBuffer: false });
  const hillMat = new THREE.ShaderMaterial({
    depthTest: false, depthWrite: false, vertexShader: fullscreenVertex,
    fragmentShader: /* glsl */ `
      uniform vec3 uSunDir;
      uniform vec4 uRect; /* x0, z0, ширина, глубина */
      varying vec2 vUv;
      float domeAt(vec2 p){ return ${HILL.height.toFixed(2)} * exp(-(p.x * p.x / ${(HILL.spreadX ** 2).toFixed(2)} + p.y * p.y / ${(HILL.spreadZ ** 2).toFixed(2)})); }
      void main(){
        vec2 p = uRect.xy + vUv * uRect.zw;
        float h = -10.0;
        for (int i = 0; i < 160; i++) { float t = float(i) * 0.25; h = max(h, domeAt(p + t * uSunDir.xz) - t * uSunDir.y); }
        gl_FragColor = vec4(h, 0.0, 0.0, 1.0);
      }`,
    uniforms: { uSunDir: { value: s }, uRect: { value: new THREE.Vector4(MAP.x0, MAP.z0, MAP.x1 - MAP.x0, MAP.z1 - MAP.z0) } },
  });
  const quad = new FullScreenQuad(hillMat);
  let hillDirty = true;

  /* ---- силуэт кроны со стороны солнца ---- */
  /* v131 (RDR2: растительность в тенях солнца, «мягкие тени»): у снимка кроны есть и глубина — настоящая карта тени
     кроны: листья затеняют друг друга, ветки и ствол, траву под деревом; свет внутри кроны пятнами */
  const CROWN_RES = 384;
  const crownRT = new THREE.WebGLRenderTarget(CROWN_RES, CROWN_RES, { type: THREE.UnsignedByteType });
  crownRT.depthTexture = new THREE.DepthTexture(CROWN_RES, CROWN_RES, THREE.FloatType);
  const sunCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 80);
  const crownMat = new THREE.Matrix4();
  const crown = new THREE.Vector4(0, 0, 0, 0);
  const box = new THREE.Box3();
  const sphere = new THREE.Sphere();
  const clear = new THREE.Color();

  const material = new THREE.ShaderMaterial({
    depthTest: false, depthWrite: false, vertexShader: fullscreenVertex, fragmentShader: shaftFragment,
    uniforms: {
      uInvViewProj: { value: new THREE.Matrix4() },
      uCam: { value: new THREE.Vector3() },
      uSunDir: { value: s },
      tHill: { value: hillRT.texture },
      uHillRect: { value: new THREE.Vector4(MAP.x0, MAP.z0, 1 / (MAP.x1 - MAP.x0), 1 / (MAP.z1 - MAP.z0)) },
      tCrown: { value: crownRT.depthTexture },
      uCrownMat: { value: crownMat },
      uCrown: { value: crown },
      /* ?shafts=плотность,доля,дальность,сила */
      uShaft: { value: new THREE.Vector3(cfg[0] || 0.05, cfg[1] ?? 0.9, cfg[2] || 48) },
    },
  });

  let tree: THREE.Object3D | null = null;
  let frame = 0;

  const withTarget = (rt: THREE.WebGLRenderTarget, fn: () => void) => {
    const prev = renderer.getRenderTarget();
    const alpha = renderer.getClearAlpha();
    renderer.getClearColor(clear);
    renderer.setClearColor(0x000000, 0);
    renderer.setRenderTarget(rt);
    renderer.clear();
    fn();
    renderer.setRenderTarget(prev);
    renderer.setClearColor(clear, alpha);
  };

  return {
    material,
    /** карта тени холма, силуэт кроны и их привязка к миру — их же читают трава, земля, листва (hillSun) и пылинки */
    hill: hillRT.texture,
    hillRect: material.uniforms.uHillRect.value as THREE.Vector4,
    crownTexture: crownRT.texture,
    crownDepth: crownRT.depthTexture,
    crownTexel: 1 / CROWN_RES,
    crownMatrix: crownMat,
    crownSphere: crown,
    /** сила поправки в финале; 0 — выключено (?shafts=0) */
    strength: q.get("shafts") === "0" ? 0 : cfg[3] ?? 5,
    setTree(group: THREE.Object3D | null) { tree = group; frame = 0; },
    /** вызывается вокруг съёмки кроны: true — перед, false — после */
    onCapture: null as ((capturing: boolean) => void) | null,
    /** солнце переехало — карту тени холма пересчитать в ближайшем prepare() */
    setSun(dir: THREE.Vector3) { s.copy(dir).normalize(); hillDirty = true; frame = 0; },
    /** раз в кадр, пока холм на экране: карта холма (если солнце сдвинулось) и через кадр — снимок кроны */
    prepare() {
      if (hillDirty) { hillDirty = false; withTarget(hillRT, () => quad.render(renderer)); }
      if (!tree || (frame++ & 1)) return;
      box.setFromObject(tree);
      box.getBoundingSphere(sphere);
      const r = sphere.radius;
      sunCam.left = sunCam.bottom = -r;
      sunCam.right = sunCam.top = r;
      sunCam.position.copy(sphere.center).addScaledVector(s, 40);
      sunCam.lookAt(sphere.center);
      sunCam.updateProjectionMatrix();
      sunCam.updateMatrixWorld();
      crownMat.multiplyMatrices(sunCam.projectionMatrix, sunCam.matrixWorldInverse);
      crown.set(sphere.center.x, sphere.center.y, sphere.center.z, r);
      const t = tree;
      /* листва сама читает этот снимок (тень кроны на дальней стороне, hillSun) — на время съёмки снимок у неё отбираем,
         иначе выходит петля «пишем в текстуру, которую читаем», и WebGL молча отбрасывает отрисовку */
      this.onCapture?.(true);
      withTarget(crownRT, () => renderer.render(t, sunCam));
      this.onCapture?.(false);
    },
    /** перед проходом лучей: матрицы камеры этого кадра */
    update() {
      const u = material.uniforms;
      camera.updateMatrixWorld();
      u.uInvViewProj.value.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse).invert();
      u.uCam.value.copy(camera.position);
    },
    dispose() {
      hillRT.dispose();
      hillMat.dispose();
      quad.dispose();
      crownRT.dispose();
      material.dispose();
    },
  };
}
