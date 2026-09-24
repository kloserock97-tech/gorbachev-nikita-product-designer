/* v72: размытые цветы у нижних углов кадра — передний план первого экрана, как на референсе. Без него всё в
   кадре стояло на одной дистанции, от 12 до 15 метров, и глубины не было.

   Цветы у самой камеры должны быть сильно не в фокусе, а честная расфокусировка по глубине стоит отдельного
   прохода. Поэтому куртины отрендерены один раз в Blender (tools/blender-foreground-flowers.py), размыты и лежат
   двумя квадратами прямо в экранных координатах. Рисуются в буфер сцены последними, до постобработки: тот же
   тонмаппинг, зерно, виньетка и размытие низа кадра, что у холма, — не наклейка поверх.

   Живут только на первом экране: качаются на ветру, от курсора сдвигаются сильнее холма (ближний план ближе),
   с началом скролла гаснут. */
import * as THREE from "three";

const BASE = import.meta.env.BASE_URL;

/* прямоугольники в координатах экрана (−1…1): широкий кадр и вертикальный. Кнопка «Смотреть кейсы» и подписи
   внизу слева на широком экране, текст и карточка проектов на телефоне — мимо них */
const WIDE = { l: [-1.16, -1.08, 0.84], r: [0.5, -1.12, 1.02] };   // x0, y0, высота
const TALL = { l: [-1.3, -0.8, 0.5], r: [0.32, -0.86, 0.56] };

const vertex = /* glsl */ `
uniform vec4 uRectL;
uniform vec4 uRectR;
uniform float uTime;
uniform float uWind;
uniform vec2 uShift;
attribute float aSide;
varying vec2 vUv;
varying float vSide;
void main(){
  vec4 r = aSide < 0.5 ? uRectL : uRectR;
  vec2 p = mix(r.xy, r.zw, uv);
  /* ветер: верх куртины качается, низ стоит */
  float sway = sin(uTime * 1.25 + aSide * 2.1) * 0.6 + sin(uTime * 2.3 + aSide * 4.0) * 0.4;
  p.x += uv.y * uv.y * 0.018 * uWind * sway;
  p += uShift;
  vUv = uv;
  vSide = aSide;
  gl_Position = vec4(p, 0.0, 1.0);
}
`;
const fragment = /* glsl */ `
uniform sampler2D uLeft;
uniform sampler2D uRight;
uniform float uOpacity;
uniform vec3 uLight;
varying vec2 vUv;
varying float vSide;
void main(){
  vec4 t = vSide < 0.5 ? texture2D(uLeft, vUv) : texture2D(uRight, vUv);
  /* внутренние края и верх гаснут: у куртины нет рамки, она уходит за край кадра только наружу */
  float inner = vSide < 0.5 ? smoothstep(1.0, 0.72, vUv.x) : smoothstep(0.0, 0.28, vUv.x);
  /* размытие делает тонкие стебли полупрозрачными, и куртина читалась призраком, сквозь который виден камень;
     степень возвращает ей плотность, мягкий край остаётся */
  float a = pow(t.a, 0.6) * inner * smoothstep(1.0, 0.8, vUv.y) * uOpacity;
  if (a < 0.003) discard;
  /* куртина снята под закатным солнцем — в сумерки и в облака темнеет вместе с холмом; не выше порога
     маски лучей, чтобы белые лепестки не становились вторым солнцем */
  gl_FragColor = vec4(t.rgb * uLight, a);
}
`;

export function createForeground(renderer: THREE.WebGLRenderer) {
  const load = (name: string) => {
    const t = new THREE.TextureLoader().load(`${BASE}ui/${name}`, (tex) => renderer.initTexture(tex));
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  };
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(8 * 3);
  const uv = new Float32Array([0, 0, 1, 0, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1]);
  const side = new Float32Array([0, 0, 0, 0, 1, 1, 1, 1]);
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  geo.setAttribute("aSide", new THREE.BufferAttribute(side, 1));
  geo.setIndex([0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7]);
  const uniforms = {
    uRectL: { value: new THREE.Vector4() },
    uRectR: { value: new THREE.Vector4() },
    uTime: { value: 0 },
    uWind: { value: 1 },
    uShift: { value: new THREE.Vector2() },
    uLeft: { value: load("fg-left.webp") },
    uRight: { value: load("fg-right.webp") },
    uOpacity: { value: 1 },
    uLight: { value: new THREE.Color(0.82, 0.8, 0.76) },
  };
  const mat = new THREE.ShaderMaterial({ vertexShader: vertex, fragmentShader: fragment, uniforms, transparent: true, depthTest: false, depthWrite: false });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.frustumCulled = false;
  mesh.renderOrder = 100; // после неба и всего прозрачного
  mesh.name = "foreground";
  const clear = 2.4; // яркость солнца в ясную погоду (uSunCol.r) — от неё свет куртины в другую погоду
  return {
    mesh,
    /** aspect — ширина к высоте; fade — 1 на первом экране, 0 после начала скролла */
    update(aspect: number, time: number, wind: number, sun: THREE.Color, ambient: number, pointer: THREE.Vector2, fade: number) {
      const k = Math.min(1, Math.max(0, (aspect - 0.6) / 0.7));
      const rect = (a: number[], b: number[], out: THREE.Vector4) => {
        const x0 = a[0] + (b[0] - a[0]) * k, y0 = a[1] + (b[1] - a[1]) * k, h = a[2] + (b[2] - a[2]) * k;
        out.set(x0, y0, x0 + h / aspect, y0 + h);
      };
      rect(TALL.l, WIDE.l, uniforms.uRectL.value);
      rect(TALL.r, WIDE.r, uniforms.uRectR.value);
      uniforms.uTime.value = time;
      uniforms.uWind.value = wind;
      uniforms.uShift.value.set(-pointer.x * 0.02, -pointer.y * 0.012);
      uniforms.uOpacity.value = fade;
      const s = Math.min(1.2, sun.r / clear) * 0.62 + ambient * 0.2;
      uniforms.uLight.value.setRGB(s, s * 0.97, s * 0.92);
      mesh.visible = fade > 0.003;
    },
  };
}
