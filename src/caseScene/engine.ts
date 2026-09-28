/* v78: сцена кейса на three.js вместо сгенерированной картинки-диорамы (разбор — docs/prompts/v78-community-scene.md).

   Координаты — пиксели кадра референса 1672×941: x вправо от центра, y вверх от центра, z к зрителю. Камера
   подобрана так, что плоскость z = 0 ложится на кадр один к одному, поэтому любую деталь можно сверить с
   референсом наложением. Кадр вписывается в окно так же, как в CSS главы (--rw = min(100vw, 177.7vh)).

   Свой прозрачный холст поверх луга, как у casesWheelGl.ts: сцена холма в этот момент рисует размытое поле,
   и вмешиваться в её проходы ради карточек дороже, чем держать второй контекст. */
import * as THREE from "three";
import { Line2 } from "three/examples/jsm/lines/Line2.js";
import { LineGeometry } from "three/examples/jsm/lines/LineGeometry.js";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";

const FRAME = { w: 1672, h: 941 };
const FOV = 30;
/** чистое сложение света: цвет прибавляется, альфа холста не растёт — свет ложится на луг под холстом */
const addLight = (m: THREE.Material) => {
  m.blending = THREE.CustomBlending;
  m.blendSrc = THREE.OneFactor; m.blendDst = THREE.OneFactor;
  m.blendSrcAlpha = THREE.ZeroFactor; m.blendDstAlpha = THREE.OneFactor;
  return m;
};
const DIST = FRAME.h / 2 / Math.tan(THREE.MathUtils.degToRad(FOV / 2));

/** точка кадра референса (px) на глубине z → мировые координаты, которые на экране попадут в ту же точку */
export const at = (px: number, py: number, z = 0) => {
  const k = (DIST - z) / DIST;
  return new THREE.Vector3((px - FRAME.w / 2) * k, (FRAME.h / 2 - py) * k, z);
};

/* ── стекло карточки ─────────────────────────────────────────────────────────────────────────────────── */
const CARD_VERT = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vN, vV;
  void main() {
    vUv = uv;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vN = normalize(normalMatrix * normal);
    vV = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;
const CARD_FRAG = /* glsl */ `
  precision highp float;
  uniform sampler2D uMap;
  uniform float uHasMap, uRadius, uBorder, uOpacity, uBlur, uGlass, uWarm, uHalo, uMargin;
  uniform vec2 uSize, uInner;   // размер пластины и содержимого (ед. сцены)
  uniform float uInnerR;
  uniform vec2 uRep, uOff;
  uniform vec3 uTint;
  uniform float uRim;
  uniform float uLinear;        // кромка стекла: 0 — только картинка (пин и т. п.)       // тон стекла: молочно-белый или дымчатый тёмный   // вырезка из текстуры: масштаб и сдвиг uv
  varying vec2 vUv;
  varying vec3 vN, vV;

  float sdRound(vec2 p, vec2 b, float r) { vec2 q = abs(p) - b + r; return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r; }

  void main() {
    vec2 p = (vUv - 0.5) * (uSize + 2.0 * uMargin);
    float d = sdRound(p, uSize * 0.5, uRadius);
    float aa = fwidth(d) * 0.75;
    float plate = 1.0 - smoothstep(-aa, aa, d);
    /* тёплый ореол за краем стекла: свет, рассеянный кромкой, ложится на луг */
    if (plate <= 0.0) {
      float h = uHalo * exp(-d / (uMargin * 0.28)) * uOpacity;
      if (h < 0.004) discard;
      gl_FragColor = vec4(vec3(1.0, 0.74, 0.42), h);
      return;
    }

    /* матовое стекло: молочно-белое, к краю светлее и теплее; тонкая яркая кромка-фаска и тёплый отсвет снизу */
    float toEdge = clamp(-d / max(uBorder, 1.0), 0.0, 1.0);
    vec3 glass = mix(vec3(1.0, 0.93, 0.8), uTint, toEdge);
    float ga = uGlass * (0.55 + 0.45 * (1.0 - toEdge));
    float rim = exp(-pow((d + 1.6) / 1.1, 2.0));
    float rimIn = exp(-pow((d + uBorder * 0.35) / (uBorder * 0.25 + 0.5), 2.0)) * 0.35;
    float fres = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 2.0);
    float warmLow = smoothstep(0.2, -0.5, p.y / uSize.y) * uWarm;
    vec3 col = glass + vec3(1.0, 0.72, 0.38) * (rim * 0.9 * uRim + warmLow * 0.35) ;
    float a = ga + (rim * 0.85 + fres * 0.15) * uRim + rimIn * uGlass;

    if (uHasMap > 0.5) {
      float di = sdRound(p, uInner * 0.5, uInnerR);
      float ai = fwidth(di) * 0.75;
      float inside = 1.0 - smoothstep(-ai, ai, di);
      vec2 uv = (p / uInner + 0.5) * uRep + uOff;
      vec4 c = texture2D(uMap, vec2(uv.x, uv.y), uBlur);
      /* текстура приходит в линейном цвете (sRGB-текстура), а стекло рисуется «как есть»: без обратного перевода
         полутона содержимого темнели — тёмный интерфейс GRIF на карточке выглядел тусклым. uLinear — только для
         непрозрачных снимков экранов; у карточек-спутников с полупрозрачным фоном перевод выбеливал бы стекло */
      if (uLinear > 0.5) c.rgb = pow(c.rgb, vec3(1.0 / 2.2));
      /* тень содержимого на стекле и лёгкий тёплый отсвет у нижнего края содержимого */
      float sh = (1.0 - smoothstep(0.0, uBorder * 0.6, di)) * (1.0 - inside) * 0.12;
      col = mix(col, vec3(0.2, 0.16, 0.1), sh);
      a = max(a, sh);
      vec3 cc = c.rgb + vec3(1.0, 0.7, 0.35) * warmLow * 0.06;
      col = mix(col, cc, inside * c.a);
      a = mix(a, 1.0, inside * c.a);
    }
    gl_FragColor = vec4(col, clamp(a, 0.0, 1.0) * plate * uOpacity);
  }
`;

export type CardOpts = {
  map?: THREE.Texture;
  /** размер пластины и содержимого, ед. сцены; содержимое по центру */
  size: [number, number];
  inner?: [number, number];
  radius: number;
  innerRadius?: number;
  glass?: number;
  warm?: number;
  blur?: number;
  /** сила тёплого ореола за краем и его ширина, ед. сцены */
  halo?: number;
  margin?: number;
  /** вырезка из текстуры (uv): масштаб и сдвиг — фото «cover», кусок большого рендера */
  rep?: THREE.Vector2;
  off?: THREE.Vector2;
  /** тон стекла; по умолчанию молочно-белый */
  tint?: string;
  /** яркость кромки стекла, 0 — без кромки */
  rim?: number;
  /** содержимое — снимок экрана: вернуть ему яркость из линейного цвета */
  screen?: boolean;
};
export function card(o: CardOpts) {
  const margin = o.margin ?? 40;
  const geo = new THREE.PlaneGeometry(o.size[0] + margin * 2, o.size[1] + margin * 2);
  const inner = o.inner ?? o.size;
  const mat = new THREE.ShaderMaterial({
    vertexShader: CARD_VERT,
    fragmentShader: CARD_FRAG,
    transparent: true,
    depthWrite: false,
    uniforms: {
      uMap: { value: o.map ?? null },
      uHasMap: { value: o.map ? 1 : 0 },
      uSize: { value: new THREE.Vector2(...o.size) },
      uInner: { value: new THREE.Vector2(...inner) },
      uRadius: { value: o.radius },
      uInnerR: { value: o.innerRadius ?? Math.max(2, o.radius - (o.size[0] - inner[0]) / 2) },
      uBorder: { value: Math.max(2, (o.size[0] - inner[0]) / 2) },
      uGlass: { value: o.glass ?? 0.45 },
      uWarm: { value: o.warm ?? 0.5 },
      uOpacity: { value: 1 },
      uBlur: { value: o.blur ?? 0 },
      uHalo: { value: o.halo ?? 0.22 },
      uMargin: { value: margin },
      uRep: { value: o.rep ?? new THREE.Vector2(1, 1) },
      uRim: { value: o.rim ?? 1 },
      uLinear: { value: o.screen ? 1 : 0 },
      uTint: { value: new THREE.Color(o.tint ?? "#fffcf7") },
      uOff: { value: o.off ?? new THREE.Vector2(0, 0) },
    },
  });
  return new THREE.Mesh(geo, mat);
}

export function canvasTexture(c: HTMLCanvasElement, renderer: THREE.WebGLRenderer) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  t.generateMipmaps = true;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  return t;
}

/* ── лента ───────────────────────────────────────────────────────────────────────────────────────────── */
const RIB_VERT = /* glsl */ `
  attribute float aT;
  attribute vec3 aN;
  varying float vT;
  varying vec2 vUv;
  varying vec3 vN, vV;
  void main() {
    vT = aT; vUv = uv;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vN = normalize(normalMatrix * aN);
    vV = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;
const RIB_FRAG = /* glsl */ `
  precision highp float;
  uniform vec3 uColor;
  uniform float uReveal, uTime, uOpacity, uFadeIn, uFadeOut;
  varying float vT;
  varying vec2 vUv;
  varying vec3 vN, vV;
  void main() {
    if (vT > uReveal) discard;
    vec3 n = normalize(vN);
    if (!gl_FrontFacing) n = -n;
    vec3 l = normalize(vec3(-0.3, 0.7, 0.65));
    float diff = 0.55 + 0.45 * abs(dot(n, l));
    float spec = pow(max(abs(dot(n, normalize(l + vV))), 0.0), 28.0);
    float y = vUv.y * 2.0 - 1.0;
    /* атлас: середина светлее, края темнее, верхняя кромка ловит свет */
    float body = 0.72 + 0.28 * (1.0 - y * y);
    float lip = exp(-pow((vUv.y - 0.88) / 0.06, 2.0)) * 0.55;
    /* глянец бежит вдоль ленты */
    float sheen = pow(0.5 + 0.5 * sin(vT * 14.0 - uTime * 1.4), 10.0) * 0.45;
    float across = 1.0 - pow(abs(y), 6.0);
    vec3 col = uColor * diff * body + vec3(1.0, 0.78, 0.72) * (spec * 0.8 + sheen + lip) * across;
    float a = smoothstep(0.0, uFadeIn, vT) * (1.0 - smoothstep(1.0 - uFadeOut, 1.0, vT)) * uOpacity;
    a *= smoothstep(0.0, 0.25, across + 0.05);
    gl_FragColor = vec4(col, a);
  }
`;
export type RibbonOpts = { points: THREE.Vector3[]; width: number | ((t: number) => number); twist?: (t: number) => number; color?: string; segments?: number; fadeIn?: number; fadeOut?: number };
export function ribbon(o: RibbonOpts) {
  const curve = new THREE.CatmullRomCurve3(o.points, false, "centripetal");
  const N = o.segments ?? 160;
  const pos: number[] = [], nor: number[] = [], ts: number[] = [], uv: number[] = [], idx: number[] = [];
  const Z = new THREE.Vector3(0, 0, 1);
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const p = curve.getPointAt(t), T = curve.getTangentAt(t).normalize();
    /* лента лежит почти в плоскости кадра, закручивается вокруг своей оси — от этого ходит блик */
    const side = new THREE.Vector3().crossVectors(T, Z).normalize();
    side.applyAxisAngle(T, o.twist ? o.twist(t) : 0);
    const n = new THREE.Vector3().crossVectors(side, T).normalize();
    const w = (typeof o.width === "function" ? o.width(t) : o.width) / 2;
    for (const s of [-1, 1]) {
      pos.push(p.x + side.x * w * s, p.y + side.y * w * s, p.z + side.z * w * s);
      nor.push(n.x, n.y, n.z);
      ts.push(t);
      uv.push(t, s < 0 ? 0 : 1);
    }
    if (i < N) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute("aN", new THREE.Float32BufferAttribute(nor, 3));
  geo.setAttribute("aT", new THREE.Float32BufferAttribute(ts, 1));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(idx);
  const mat = new THREE.ShaderMaterial({
    vertexShader: RIB_VERT, fragmentShader: RIB_FRAG, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    uniforms: { uColor: { value: new THREE.Color(o.color ?? "#e2323f") }, uReveal: { value: 1 }, uTime: { value: 0 }, uOpacity: { value: 1 }, uFadeIn: { value: o.fadeIn ?? 0.06 }, uFadeOut: { value: o.fadeOut ?? 0.12 } },
  });
  return new THREE.Mesh(geo, mat);
}

/* ── тонкая линия постоянной толщины в пикселях (орбиты, тонкие красные линии) ─────────────────────────── */
export function line(points: THREE.Vector3[], o: { color: string; width: number; fade?: (t: number) => number; opacity?: number }) {
  const g = new LineGeometry();
  g.setPositions(points.flatMap((p) => [p.x, p.y, p.z]));
  const base = new THREE.Color(o.color);
  const cols: number[] = [];
  points.forEach((_, i) => { const k = (o.fade ? o.fade(i / (points.length - 1)) : 1) * (o.opacity ?? 1); cols.push(base.r * k, base.g * k, base.b * k); });
  g.setColors(cols);
  /* сложение цветов: затухание по длине — это просто темнее цвет */
  const m = new LineMaterial({ linewidth: o.width, vertexColors: true, transparent: true, depthWrite: false, worldUnits: false });
  addLight(m);
  const l = new Line2(g, m);
  l.computeLineDistances();
  return l;
}

/* ── огоньки ─────────────────────────────────────────────────────────────────────────────────────────── */
const SPARK_VERT = /* glsl */ `
  attribute float aSize, aSeed;
  uniform float uTime, uPx;
  varying float vA;
  void main() {
    vec3 p = position;
    p.y += sin(uTime * 0.5 + aSeed * 6.28) * 4.0;
    p.x += cos(uTime * 0.35 + aSeed * 9.1) * 3.0;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    vA = 0.55 + 0.45 * sin(uTime * (1.2 + aSeed) + aSeed * 40.0);
    gl_PointSize = aSize * uPx * (${DIST.toFixed(1)} / -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`;
const SPARK_FRAG = /* glsl */ `
  precision highp float;
  uniform vec3 uColor;
  uniform float uOpacity;
  varying float vA;
  void main() {
    float r = length(gl_PointCoord - 0.5) * 2.0;
    float core = smoothstep(0.22, 0.0, r);
    float halo = exp(-r * r * 5.0) * 0.45;
    gl_FragColor = vec4(uColor * (core * 2.2 + halo * 1.4) * vA * uOpacity, 0.0);
  }
`;
export function sparks(points: { p: THREE.Vector3; size: number }[], color = "#ffc070") {
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(points.flatMap((s) => [s.p.x, s.p.y, s.p.z]), 3));
  g.setAttribute("aSize", new THREE.Float32BufferAttribute(points.map((s) => s.size), 1));
  g.setAttribute("aSeed", new THREE.Float32BufferAttribute(points.map(() => Math.random()), 1));
  const m = new THREE.ShaderMaterial({
    vertexShader: SPARK_VERT, fragmentShader: SPARK_FRAG, transparent: true, depthWrite: false,
    uniforms: { uTime: { value: 0 }, uPx: { value: 1 }, uColor: { value: new THREE.Color(color) }, uOpacity: { value: 1 } },
  });
  addLight(m);
  return new THREE.Points(g, m);
}

/* ── свечение: мягкое пятно, сложением ───────────────────────────────────────────────────────────────── */
const GLOW_FRAG = /* glsl */ `
  precision highp float;
  uniform vec3 uColor;
  uniform float uOpacity;
  varying vec2 vUv;
  void main() {
    vec2 q = vUv * 2.0 - 1.0;
    float r = dot(q, q);
    /* к краю пятна свет гаснет ровно в ноль: иначе на тёмном фоне телефона был виден край прямоугольника */
    gl_FragColor = vec4(uColor * exp(-r * 3.2) * smoothstep(1.0, 0.55, r) * uOpacity, 0.0);
  }
`;
export function glow(w: number, h: number, color: string, opacity: number) {
  const m = new THREE.ShaderMaterial({
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: GLOW_FRAG, transparent: true, depthWrite: false,
    uniforms: { uColor: { value: new THREE.Color(color) }, uOpacity: { value: opacity } },
  });
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), addLight(m));
}

/* ── камень: низкополигональный, тёмный, освещён тёплым контровым ─────────────────────────────────────── */
export function rock(size: number, seed: number) {
  const g = new THREE.IcosahedronGeometry(size, 1);
  const p = g.attributes.position as THREE.BufferAttribute;
  const rnd = (k: number) => { const x = Math.sin(seed * 91.7 + k * 12.9898) * 43758.5453; return x - Math.floor(x); };
  const v = new THREE.Vector3();
  const cache = new Map<string, number>();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const key = `${v.x.toFixed(3)},${v.y.toFixed(3)},${v.z.toFixed(3)}`;
    let k = cache.get(key);
    if (k === undefined) { k = 0.72 + rnd(cache.size) * 0.45; cache.set(key, k); }
    v.multiplyScalar(k);
    v.y *= 0.8;
    p.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals();
  return new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: "#2c261e", roughness: 0.92, metalness: 0, flatShading: true, transparent: true }));
}

/* ── стеклянный пузырь: прозрачная сфера, светится только край (френель) ──────────────────────────────── */
export function bubble(r: number, color: string) {
  const m = new THREE.ShaderMaterial({
    vertexShader: `varying vec3 vN, vV; void main(){ vec4 mv = modelViewMatrix * vec4(position,1.0); vN = normalize(normalMatrix*normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }`,
    fragmentShader: `precision highp float; uniform vec3 uColor; uniform float uOpacity; varying vec3 vN, vV;
      void main(){ float f = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 3.0);
        float spec = pow(max(dot(normalize(vN), normalize(vec3(-0.4, 0.6, 0.7))), 0.0), 60.0);
        gl_FragColor = vec4(uColor * (f * 0.9 + spec * 0.8) * uOpacity, 0.0); }`,
    transparent: true, depthWrite: false, side: THREE.FrontSide,
    uniforms: { uColor: { value: new THREE.Color(color) }, uOpacity: { value: 1 } },
  });
  return new THREE.Mesh(new THREE.SphereGeometry(r, 64, 48), addLight(m));
}

/* ── рендерер: один на все сцены кейсов ──────────────────────────────────────────────────────────────────
   v79: раньше у каждой из восьми сцен был свой WebGL-контекст на холсте во всё окно. Рисовала одна, а семь
   держали буферы кадра впустую; на iPhone столько контекстов браузер не держит и начинает гасить старые —
   вплоть до контекста самого холма. Теперь рендерер и холст общие (Host), у сцены — только своя камера,
   свет и граф объектов (Stage). */
export type Host = {
  renderer: THREE.WebGLRenderer;
  canvas: HTMLCanvasElement;
  /** размер холста в css-пикселях — один замер на все сцены */
  size: { w: number; h: number };
  dpr(): number;
  resize(): void;
  /** сцены подписываются, чтобы пересчитать камеры после смены размера */
  onResize(fn: () => void): void;
};
export function createHost(canvas: HTMLCanvasElement): Host {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  /* сцены рисуются одна поверх другой (уходящая и приходящая при смене кейса) — очищаем кадр сами */
  renderer.autoClear = false;
  const subs: (() => void)[] = [];
  const size = { w: 1, h: 1 };
  const dpr = () => Math.min(2, devicePixelRatio);
  let px = "";
  const resize = () => {
    size.w = canvas.clientWidth || innerWidth;
    size.h = canvas.clientHeight || innerHeight;
    /* буфер кадра пересоздаётся только при настоящей смене размера: глава зовёт resize и при смене кейса
       (у названия своя длина — своя свободная область), и тогда достаточно пересчитать камеры */
    const key = `${size.w}x${size.h}@${dpr()}`;
    if (key !== px) {
      px = key;
      renderer.setPixelRatio(dpr());
      renderer.setSize(size.w, size.h, false);
    }
    for (const fn of subs) fn();
  };
  resize();
  return { renderer, canvas, size, dpr, resize, onResize: (fn) => { subs.push(fn); fn(); } };
}

export type Stage = {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  root: THREE.Group;
  resize(): void;
  /** сколько экранных пикселей в одном пикселе кадра референса (с учётом DPR) */
  pxScale(): number;
};
/** как кадр референса лежит в окне: s — css-пикселей на пиксель кадра, fx/fy — где на экране центр кадра (css px) */
export type Fit = (w: number, h: number) => { s: number; fx: number; fy: number };
const containFit: Fit = (w, h) => ({ s: Math.min(w / FRAME.w, h / FRAME.h), fx: w / 2, fy: h / 2 });

export function createStage(host: Host, fit: Fit = containFit): Stage {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(FOV, 16 / 9, 10, DIST * 3);
  camera.position.set(0, 0, DIST);
  const root = new THREE.Group();
  scene.add(root);
  scene.add(new THREE.HemisphereLight("#ffe6c0", "#1a2410", 1.1));
  const sun = new THREE.DirectionalLight("#ffc680", 2.4);
  sun.position.set(300, 500, 400);
  scene.add(sun);
  let s = 1;
  const resize = () => {
    const { w, h } = host.size;
    const f = fit(w, h);
    s = f.s;
    const visH = h / s;
    camera.fov = THREE.MathUtils.radToDeg(2 * Math.atan(visH / 2 / DIST));
    camera.aspect = w / h;
    /* центр кадра не обязательно в центре окна: сдвигаем вид, а не камеру — перспектива остаётся той же */
    camera.setViewOffset(w, h, w / 2 - f.fx, h / 2 - f.fy, w, h);
    camera.updateProjectionMatrix();
  };
  host.onResize(resize);
  return { renderer: host.renderer, scene, camera, root, resize, pxScale: () => s * host.dpr() };
}
