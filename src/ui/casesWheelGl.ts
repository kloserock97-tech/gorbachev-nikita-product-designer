/* v65: превью кейса в WebGL для варианта «колесо» (?cases=wheel3d). Вариант реализации на three.js — для сравнения
   с тем же превью на картинках (casesWheel.ts).

   Что даёт WebGL и чего не сделать стилями:
   · объём. У каждого предмета есть карта глубины (public/cases/objects/depth, нейросеть depth-anything по исходной
     обложке). Шейдер сдвигает точки картинки тем сильнее, чем они ближе: предмет поворачивается за курсором, как
     настоящий, хотя это одна плоскость. Из той же карты берётся нормаль — по предмету ходит блик;
   · барабан. Шесть плоскостей стоят на цилиндре вокруг горизонтальной оси и прокатываются вместе с колесом названий:
     уходящий предмет заваливается назад и вверх, приходящий выкатывается снизу — с настоящей перспективой камеры;
   · мягкая тень из размытых уровней той же текстуры, без отдельного прохода.

   Свой маленький рендерер, а не сцена холма: HillScene в этот момент рисует размытое поле, и вмешиваться в его
   проходы ради одной плоскости дороже, чем держать второй контекст с одним вызовом отрисовки на кадр.
   three уже загружен сайтом, так что модуль добавляет только собственный код. Если контекст не поднялся или
   текстуры не приехали, возвращается null — под холстом остаются обычные картинки. */
import * as THREE from "three";
import { caseObject, type CaseItem } from "../data/cases";
import type { WheelGl } from "./casesWheel";

const BASE = import.meta.env.BASE_URL;

const VERT = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;
const FRAG = /* glsl */ `
  precision highp float;
  uniform sampler2D uMap, uDepth;
  uniform vec2 uTilt;      // наклон «камеры»: курсор, ход колеса, лёгкое дыхание
  uniform float uOpacity;
  uniform vec3 uInk;       // чернила кейса — цвет тени
  varying vec2 vUv;

  void main() {
    /* сдвиг по глубине в два шага: второй шаг берёт глубину уже в сдвинутой точке, контур рвётся меньше */
    float d = texture2D(uDepth, vUv).r;
    vec2 uv = vUv - (d - 0.42) * uTilt * 0.052;
    d = texture2D(uDepth, uv).r;
    uv = vUv - (d - 0.42) * uTilt * 0.052;
    vec4 c = texture2D(uMap, uv);

    /* нормаль из карты глубины: блик и лёгкая светотень, которые идут за наклоном */
    float e = 1.0 / 384.0;
    float dx = texture2D(uDepth, uv + vec2(e, 0.0)).r - texture2D(uDepth, uv - vec2(e, 0.0)).r;
    float dy = texture2D(uDepth, uv + vec2(0.0, e)).r - texture2D(uDepth, uv - vec2(0.0, e)).r;
    vec3 n = normalize(vec3(-dx * 9.0, -dy * 9.0, 1.0));
    vec3 l = normalize(vec3(-0.35 + uTilt.x * 1.6, 0.55 + uTilt.y * 1.6, 0.9));
    float diff = dot(n, l) - dot(vec3(0.0, 0.0, 1.0), l);
    float spec = pow(max(dot(n, normalize(l + vec3(0.0, 0.0, 1.0))), 0.0), 36.0);
    c.rgb = clamp(c.rgb + diff * 0.22 + spec * 0.16, 0.0, 1.0);

    /* тень: размытая альфа той же картинки, смещённая вниз и против наклона */
    vec2 suv = vUv + vec2(uTilt.x * 0.02, 0.05);
    /* к краям плоскости тень гаснет: размытая альфа широкая, и без этого край плоскости виден прямоугольником */
    vec2 edge = smoothstep(vec2(0.0), vec2(0.14), vUv) * smoothstep(vec2(0.0), vec2(0.14), 1.0 - vUv);
    float sh = texture2D(uMap, suv, 4.2).a * 0.3 * edge.x * edge.y * step(suv.y, 1.0);
    float a = c.a + sh * (1.0 - c.a);
    vec3 rgb = (c.rgb * c.a + uInk * sh * (1.0 - c.a)) / max(a, 0.0001);
    gl_FragColor = vec4(rgb, a * uOpacity);
  }
`;

const loadTexture = (loader: THREE.TextureLoader, urls: string[]): Promise<THREE.Texture> =>
  new Promise((resolve, reject) => {
    const next = (k: number) => {
      if (k >= urls.length) { reject(new Error("texture")); return; }
      loader.load(urls[k], resolve, undefined, () => next(k + 1));
    };
    next(0);
  });

export async function createWheelGl(stage: HTMLElement, list: CaseItem[]): Promise<WheelGl | null> {
  const canvas = document.createElement("canvas");
  canvas.className = "cw-gl";
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, premultipliedAlpha: true, powerPreference: "low-power" });
  } catch {
    return null;
  }
  renderer.setClearColor(0x000000, 0);

  const loader = new THREE.TextureLoader();
  let maps: THREE.Texture[], depths: THREE.Texture[];
  try {
    [maps, depths] = await Promise.all([
      Promise.all(list.map((c) => loadTexture(loader, [`${BASE}${caseObject(c.id)}`, `${BASE}${caseObject(c.id, "webp")}`]))),
      Promise.all(list.map((c) => loadTexture(loader, [`${BASE}cases/objects/depth/${c.id}.webp`]))),
    ]);
  } catch {
    renderer.dispose();
    return null;
  }
  for (const m of maps) { m.colorSpace = THREE.NoColorSpace; m.generateMipmaps = true; m.minFilter = THREE.LinearMipmapLinearFilter; m.anisotropy = 4; m.needsUpdate = true; }
  for (const d of depths) { d.colorSpace = THREE.NoColorSpace; d.minFilter = THREE.LinearFilter; d.generateMipmaps = false; d.needsUpdate = true; }

  const scene = new THREE.Scene();
  const FOV = 26;
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 50);
  const DIST = 1 / Math.tan((FOV * Math.PI) / 360); // на этом расстоянии высота кадра в плоскости z=0 равна 2
  camera.position.set(0, 0, DIST);

  const geo = new THREE.PlaneGeometry(1, 1);
  const meshes = list.map((c, i) => {
    const mat = new THREE.ShaderMaterial({
      vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthWrite: false, depthTest: false,
      uniforms: {
        uMap: { value: maps[i] }, uDepth: { value: depths[i] }, uTilt: { value: new THREE.Vector2() }, uOpacity: { value: 0 },
        uInk: { value: new THREE.Color(c.look.ink) },
      },
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.visible = false;
    scene.add(mesh);
    return mesh;
  });
  stage.insertBefore(canvas, stage.querySelector(".cw-num"));

  let aspect = 1;
  const fit = () => {
    const w = Math.max(1, stage.clientWidth), h = Math.max(1, stage.clientHeight);
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, innerWidth <= 900 ? 1.5 : 2));
    renderer.setSize(w, h, false);
    aspect = w / h;
    camera.aspect = aspect;
    camera.updateProjectionMatrix();
    /* та же раскладка, что у картинок: высота предмета 98 % сцены, не шире 92 %, центр на 54 %, низ на 6 % ниже края */
    list.forEach((c, i) => {
      const ratio = c.look.object.ratio;
      let ph = 0.98 * 2, pw = ph * ratio;
      const maxW = 0.92 * 2 * aspect;
      if (pw > maxW) { pw = maxW; ph = pw / ratio; }
      const m = meshes[i];
      m.scale.set(pw, ph, 1);
      m.userData.x = 0.08 * aspect;
      m.userData.y = -1 - 0.12 + ph / 2;
    });
    dirty = true;
  };

  let active = 0, lastActive = 0, spin = 0;
  let tx = 0, ty = 0, cx = 0, cy = 0;
  let dirty = true, visible = true, raf = 0, last = performance.now();
  const RD = 1.7;        // радиус барабана
  const STEP = 1.05;     // радиан между соседними предметами на барабане

  const frame = (now: number) => {
    raf = 0;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    /* наклон догоняет курсор; ход колеса добавляет наклон по вертикали и затухает */
    const k = 1 - Math.exp(-dt * 7);
    cx += (tx - cx) * k; cy += (ty - cy) * k;
    spin += ((active - lastActive) * 5 - spin) * (1 - Math.exp(-dt * 9));
    lastActive = active;
    const breathe = now * 0.00055;
    const tiltX = cx * 0.9 + Math.sin(breathe) * 0.16;
    const tiltY = -cy * 0.7 + Math.cos(breathe * 0.8) * 0.1 + Math.max(-1.2, Math.min(1.2, spin));
    meshes.forEach((m, i) => {
      const d = i - active;
      const ad = Math.abs(d);
      const on = ad < 1.25;
      m.visible = on;
      if (!on) return;
      const phi = d * STEP;
      m.position.set(m.userData.x + d * 0.12 * aspect, m.userData.y - Math.sin(phi) * RD, (Math.cos(phi) - 1) * RD);
      m.rotation.set(phi * 0.9, -tiltX * 0.12, d * -0.12);
      const u = (m.material as THREE.ShaderMaterial).uniforms;
      (u.uTilt.value as THREE.Vector2).set(tiltX, tiltY);
      u.uOpacity.value = Math.max(0, Math.min(1, 1 - ad * 1.5));
    });
    renderer.render(scene, camera);
    /* кадры нужны, пока глава на экране: предмет слегка «дышит» даже без курсора */
    if (visible) raf = requestAnimationFrame(frame);
  };
  const kick = () => { if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } };

  /* вне главы и на скрытой вкладке кадры не идут */
  const io = new IntersectionObserver((entries) => { visible = entries.some((e) => e.isIntersecting) && !document.hidden; if (visible) kick(); });
  io.observe(stage);
  const onVis = () => { visible = !document.hidden && stage.getBoundingClientRect().bottom > 0; if (visible) kick(); };
  document.addEventListener("visibilitychange", onVis);
  canvas.addEventListener("webglcontextlost", (e) => { e.preventDefault(); stage.closest(".cases")?.classList.remove("has-gl"); canvas.remove(); });

  fit();
  kick();
  return {
    set(a, px, py) { active = a; tx = px; ty = py; if (dirty || visible) kick(); dirty = false; },
    resize: fit,
    dispose() {
      cancelAnimationFrame(raf);
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      maps.forEach((m) => m.dispose()); depths.forEach((d) => d.dispose());
      meshes.forEach((m) => (m.material as THREE.Material).dispose());
      geo.dispose(); renderer.dispose(); canvas.remove();
    },
  };
}
