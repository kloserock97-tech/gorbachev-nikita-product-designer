import * as THREE from "three";

/* v103: блум для луга (указатель кейса, signpost3d.ts). Свечение светового короба на фото — это свет, который рассеивается в воздухе и в
   линзе: край короба мягко «перетекает» в темноту, а рядом с ним светлеет трава. Плоский ореол-подложка этого не
   даёт — у него читается свой контур. Здесь свечение считается из самого кадра: всё, что ярче порога, уходит в
   цепочку уменьшенных копий (каждая вдвое меньше), а на обратном пути копии складываются с мягким фильтром-«шатром».
   Широкие уровни дают дымку на метр вокруг, узкие — сияние у самой кромки. Результат прибавляется к кадру луга.

   Работает в том же HDR-буфере, куда рисуется луг (до тонмаппинга), поэтому светятся только по-настоящему яркие
   вещи: акрил столба; трава в контровом солнце — едва. */

const LEVELS = 6;
/* вклад уровней от узкого к широкому: у самой кромки сияние слабое — иначе оно заливает чёрную печать на панели;
   основная доля — широкая дымка, как свет в воздухе на фото */
const WEIGHTS = [0.0, 0.04, 0.25, 0.6, 1.0];

const vert = /* glsl */ `varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;

/* уменьшение: четыре билинейные выборки по углам текселя = среднее 4×4; на первом шаге — порог по яркости с мягким
   коленом и потолок (одиночные сверхъяркие пиксели иначе мигают пятнами) */
const downFrag = /* glsl */ `
uniform sampler2D tSrc;
uniform vec2 uTexel;
uniform float uThreshold;
uniform float uFirst;
varying vec2 vUv;
vec3 pick(vec2 uv) {
  vec3 c = texture2D(tSrc, uv).rgb;
  if (uFirst > 0.5) {
    c = min(c, vec3(24.0));
    float l = max(c.r, max(c.g, c.b));
    float k = smoothstep(uThreshold * 0.55, uThreshold * 1.6, l);
    c *= k;
  }
  return c;
}
void main() {
  vec2 o = uTexel;
  vec3 c = pick(vUv + vec2(-o.x, -o.y)) + pick(vUv + vec2(o.x, -o.y)) + pick(vUv + vec2(-o.x, o.y)) + pick(vUv + vec2(o.x, o.y));
  gl_FragColor = vec4(c * 0.25, 1.0);
}`;

/* увеличение: «шатёр» 3×3 по меньшему уровню плюс свой уровень того же размера */
const upFrag = /* glsl */ `
uniform sampler2D tSmall;
uniform sampler2D tSame;
uniform vec2 uTexel;
uniform float uSpread;
uniform float uWeight;
varying vec2 vUv;
void main() {
  vec2 o = uTexel * uSpread;
  vec3 s = texture2D(tSmall, vUv).rgb * 4.0;
  s += (texture2D(tSmall, vUv + vec2(o.x, 0.0)).rgb + texture2D(tSmall, vUv - vec2(o.x, 0.0)).rgb
      + texture2D(tSmall, vUv + vec2(0.0, o.y)).rgb + texture2D(tSmall, vUv - vec2(0.0, o.y)).rgb) * 2.0;
  s += texture2D(tSmall, vUv + o).rgb + texture2D(tSmall, vUv - o).rgb
     + texture2D(tSmall, vUv + vec2(o.x, -o.y)).rgb + texture2D(tSmall, vUv + vec2(-o.x, o.y)).rgb;
  gl_FragColor = vec4(s / 16.0 + texture2D(tSame, vUv).rgb * uWeight, 1.0);
}`;

const addFrag = /* glsl */ `
uniform sampler2D tBloom;
uniform float uIntensity;
varying vec2 vUv;
void main() { gl_FragColor = vec4(texture2D(tBloom, vUv).rgb * uIntensity, 1.0); }`;

export function createBloom(renderer: THREE.WebGLRenderer, intensity = 0.07) {
  const opts = { type: THREE.HalfFloatType, depthBuffer: false, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter } as const;
  const down = Array.from({ length: LEVELS }, () => new THREE.WebGLRenderTarget(1, 1, opts));
  const up = Array.from({ length: LEVELS - 1 }, () => new THREE.WebGLRenderTarget(1, 1, opts));
  const q = new URLSearchParams(location.search);
  const downMat = new THREE.ShaderMaterial({
    vertexShader: vert, fragmentShader: downFrag, depthTest: false, depthWrite: false,
    uniforms: { tSrc: { value: null }, uTexel: { value: new THREE.Vector2() }, uThreshold: { value: Number(q.get("bloomthr") ?? 1.1) }, uFirst: { value: 0 } },
  });
  const upMat = new THREE.ShaderMaterial({
    vertexShader: vert, fragmentShader: upFrag, depthTest: false, depthWrite: false,
    uniforms: { tSmall: { value: null }, tSame: { value: null }, uTexel: { value: new THREE.Vector2() }, uSpread: { value: 1 }, uWeight: { value: 1 } },
  });
  const addMat = new THREE.ShaderMaterial({
    vertexShader: vert, fragmentShader: addFrag, depthTest: false, depthWrite: false, transparent: true, blending: THREE.AdditiveBlending,
    uniforms: { tBloom: { value: null }, uIntensity: { value: Number(q.get("bloom") ?? intensity) } },
  });
  /* светящиеся грани столба помечены в трафарете (signpostPillar.ts: markGlow) — на них свечение не кладём: печать
     остаётся чёрной и чёткой, как на фото, а свет уходит в воздух вокруг */
  addMat.stencilWrite = true;
  addMat.stencilRef = 1;
  addMat.stencilFunc = THREE.NotEqualStencilFunc;
  addMat.stencilZPass = THREE.KeepStencilOp;
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), downMat);
  quad.frustumCulled = false;
  const scene = new THREE.Scene();
  scene.add(quad);
  const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  let w = 0, h = 0;

  const pass = (mat: THREE.ShaderMaterial, rt: THREE.WebGLRenderTarget | null) => {
    quad.material = mat;
    renderer.setRenderTarget(rt);
    renderer.render(scene, cam);
  };

  return {
    /** прибавить свечение к кадру в target (кадр уже нарисован) */
    apply(target: THREE.WebGLRenderTarget) {
      if (addMat.uniforms.uIntensity.value <= 0) return;
      const tw = Math.max(2, target.width >> 1), th = Math.max(2, target.height >> 1);
      if (tw !== w || th !== h) {
        w = tw; h = th;
        down.forEach((rt, i) => rt.setSize(Math.max(1, w >> i), Math.max(1, h >> i)));
        up.forEach((rt, i) => rt.setSize(Math.max(1, w >> i), Math.max(1, h >> i)));
      }
      const autoClear = renderer.autoClear;
      renderer.autoClear = true;
      let src: THREE.Texture = target.texture, sw = target.width, sh = target.height;
      down.forEach((rt, i) => {
        downMat.uniforms.tSrc.value = src;
        downMat.uniforms.uTexel.value.set(0.5 / sw, 0.5 / sh).multiplyScalar(2);
        downMat.uniforms.uFirst.value = i === 0 ? 1 : 0;
        pass(downMat, rt);
        src = rt.texture; sw = rt.width; sh = rt.height;
      });
      let small: THREE.WebGLRenderTarget = down[LEVELS - 1];
      for (let i = LEVELS - 2; i >= 0; i--) {
        upMat.uniforms.tSmall.value = small.texture;
        upMat.uniforms.tSame.value = down[i].texture;
        upMat.uniforms.uTexel.value.set(1 / small.width, 1 / small.height);
        upMat.uniforms.uWeight.value = WEIGHTS[i];
        pass(upMat, up[i]);
        small = up[i];
      }
      addMat.uniforms.tBloom.value = up[0].texture;
      renderer.autoClear = false;
      pass(addMat, target);
      renderer.autoClear = autoClear;
    },
    /* программы — заранее, вместе с лугом */
    compile() {
      for (const m of [downMat, upMat, addMat]) { quad.material = m; renderer.compile(scene, cam); }
    },
    dispose() {
      [...down, ...up].forEach((rt) => rt.dispose());
      [downMat, upMat, addMat].forEach((m) => m.dispose());
      quad.geometry.dispose();
    },
  };
}
