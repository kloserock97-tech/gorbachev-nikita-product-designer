/* v78: общий набор для сцен кейсов: вход и выход, парение карточек, курсор, свечение, ленты, орбиты, огоньки,
   камни. Сцена кейса (community.ts, moderator.ts) только раскладывает свои карточки и линии в пикселях кадра
   референса 1672×941 — механика у всех одна.

   Вход: предметы летят от середины композиции (hub) и из глубины лесенкой по delay, линии прорисовываются,
   свет разгорается (ease-out, ~1,4 с). Присутствие кейса от прокрутки главы (0…1) гасит всё вместе. */
import * as THREE from "three";
import type { Line2 } from "three/examples/jsm/lines/Line2.js";
import type { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";
import { at, bubble, card, canvasTexture, createStage, glow, line, ribbon, rock, sparks, type CardOpts, type Fit, type Stage } from "./engine";

export const deg = THREE.MathUtils.degToRad;
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
export const easeOut = (t: number) => 1 - Math.pow(1 - clamp01(t), 3);

export type CaseScene = {
  stage: Stage;
  ready: Promise<void>;
  /** присутствие кейса на экране 0…1 (от прокрутки главы); вход проигрывается, когда кейс становится текущим */
  setPresence(v: number): void;
  setPointer(x: number, y: number): void;
  /** откуда брать свободную область окна (глава «Кейсы»); после смены — resize() */
  setSafe(fn: () => Safe | null): void;
  /** стенд: показать сразу, без входа */
  still(): void;
  pause(): void;
  resume(): void;
};

type Anim = { delay: number; dur: number; apply(p: number, g: number): void };
type P3 = [number, number, number];

/** свободная область окна главы (css px), куда можно ставить сцену: между списком кейсов, строкой «Далее»,
    названием и таблицей фактов. Её меряет глава (casesCardPreview.ts); на стенде — всё окно с полями */
export type Safe = { l: number; t: number; r: number; b: number };

/** сцена вписывается в свободную область целиком, с воздухом, и никогда не крупнее, чем на референсе.
    На телефоне композиции позволено быть шире экрана (края уходят за кадр), но по высоте — строго в область */
const fitBox = (box: [number, number, number, number], hub: [number, number], safe: () => Safe | null): Fit => (w, h) => {
  const [x0, y0, x1, y1] = box;
  const bw = x1 - x0, bh = y1 - y0;
  const a = safe() ?? { l: w * 0.04, t: h * 0.08, r: w * 0.96, b: h * 0.92 };
  const sw = Math.max(40, a.r - a.l), sh = Math.max(40, a.b - a.t);
  const ref = Math.min(w / 1672, h / 941);
  if (w / h < 0.8) {
    const s = Math.min((1.3 * w) / bw, sh / bh);
    return { s, fx: w / 2 - (hub[0] - 836) * s, fy: (a.t + a.b) / 2 - ((y0 + y1) / 2 - 470.5) * s };
  }
  const s = Math.min(sw / bw, sh / bh, ref);
  return { s, fx: (a.l + a.r) / 2 - ((x0 + x1) / 2 - 836) * s, fy: (a.t + a.b) / 2 - ((y0 + y1) / 2 - 470.5) * s };
};

export type Kit = ReturnType<typeof makeKit>;

function makeKit(stage: Stage, hub: THREE.Vector3) {
  const { renderer, root } = stage;
  const anims: Anim[] = [];
  const ribbonU: Record<string, THREE.IUniform>[] = [];
  const sparkU: Record<string, THREE.IUniform>[] = [];
  const floaters: { m: THREE.Object3D; base: THREE.Vector3; ph: number; amp: number; enter: number }[] = [];
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

  const kit = {
    renderer,
    root,
    rnd,
    /** сколько пикселей текстуры на пиксель кадра — чтобы карточки были резкими на этом экране */
    texScale: () => Math.min(3, Math.max(1.5, stage.pxScale() * 1.25)),
    canvasTexture: (c: HTMLCanvasElement) => canvasTexture(c, renderer),
    /** картинка-текстура (вырезка из рендера Figma и т. п.), с мипмапами и анизотропией */
    imageTexture(im: HTMLImageElement | ImageBitmap) {
      const t = new THREE.Texture(im as HTMLImageElement);
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
      t.minFilter = THREE.LinearMipmapLinearFilter;
      t.needsUpdate = true;
      return t;
    },

    glow(x: number, y: number, z: number, w: number, h: number, color: string, o: number, delay = 0.05) {
      const m = glow(w, h, color, o);
      m.position.copy(at(x, y, z));
      root.add(m);
      const u = (m.material as THREE.ShaderMaterial).uniforms.uOpacity;
      anims.push({ delay, dur: 1.1, apply: (p, g) => { u.value = o * easeOut(p) * g; } });
    },

    /** линия прорисовывается от начала к концу */
    reveal(l: Line2, delay: number, dur: number) {
      root.add(l);
      const geo = l.geometry as THREE.InstancedBufferGeometry;
      const total = geo.attributes.instanceStart.count;
      const mat = l.material as LineMaterial;
      anims.push({ delay, dur, apply: (p, g) => { geo.instanceCount = Math.max(0, Math.round(total * easeOut(p))); mat.color.setScalar(g); } });
    },

    /** орбита: окружность, наклонённая к зрителю, — на экране эллипс; проходит и перед карточками, и за ними */
    orbit(o: { c: [number, number]; r: number; tilt: number; rotZ: number; from: number; to: number; color?: string; width?: number; opacity?: number; fade?: (t: number) => number; delay?: number; z?: number; wobble?: number; seed?: number; sx?: number }) {
      const pts: THREE.Vector3[] = [];
      const q = new THREE.Euler(deg(o.tilt), 0, deg(o.rotZ));
      for (let i = 0; i <= 200; i++) {
        const a = deg(o.from + (o.to - o.from) * (i / 200));
        /* wobble — неровный контур (горизонтали острова), sx — вытянуть по ширине */
        const w = 1 + (o.wobble ?? 0) * (Math.sin(a * 3 + (o.seed ?? 0)) * 0.6 + Math.sin(a * 7 + (o.seed ?? 0) * 2.3) * 0.4);
        pts.push(at(o.c[0], o.c[1], o.z ?? 0).add(new THREE.Vector3(Math.cos(a) * o.r * w * (o.sx ?? 1), 0, Math.sin(a) * o.r * w).applyEuler(q)));
      }
      kit.reveal(line(pts, { color: o.color ?? "#fff1dc", width: o.width ?? 1.4, opacity: o.opacity ?? 0.6, fade: o.fade ?? ((t) => 0.3 + 0.7 * Math.sin(Math.PI * t)) }), o.delay ?? 0.4, 1.3);
    },

    /** кривая линия по точкам кадра (связи между карточками, тонкие линии) */
    curve(pts: P3[], o: { color: string; width: number; opacity?: number; delay?: number; dur?: number; fade?: (t: number) => number }) {
      const c = new THREE.CatmullRomCurve3(pts.map(([x, y, z]) => at(x, y, z)), false, "centripetal");
      kit.reveal(line(c.getPoints(90), { color: o.color, width: o.width, opacity: o.opacity ?? 0.9, fade: o.fade ?? ((t) => Math.min(1, t * 6) * Math.min(1, (1 - t) * 6)) }), o.delay ?? 0.45, o.dur ?? 0.8);
    },

    /** стеклянный пузырь: светится краем */
    bubble(x: number, y: number, z: number, r: number, color: string, o: number, delay = 0.2) {
      const m = bubble(r, color);
      m.position.copy(at(x, y, z));
      root.add(m);
      const u = (m.material as THREE.ShaderMaterial).uniforms.uOpacity;
      anims.push({ delay, dur: 1.2, apply: (p, g) => { u.value = o * easeOut(p) * g; m.scale.setScalar(0.85 + 0.15 * easeOut(p)); } });
    },
    /** парящий остров: плоский тёмный камень под композицией */
    island(x: number, y: number, z: number, w: number, h: number, d: number, seed = 3) {
      const m = rock(1, seed);
      m.scale.set(w / 2, h / 2, d / 2);
      const base = at(x, y, z);
      (m.material as THREE.MeshStandardMaterial).color.set("#1f1c15");
      root.add(m);
      const mat = m.material as THREE.MeshStandardMaterial;
      anims.push({ delay: 0.05, dur: 1.1, apply: (p, g) => { const e = easeOut(p); m.position.set(base.x, base.y - (1 - e) * 60, base.z); mat.opacity = e * g; } });
      return m;
    },

    /** любой предмет (стол, стулья): встаёт снизу и проявляется; материалы должны быть transparent */
    object(obj: THREE.Object3D, x: number, y: number, z: number, delay = 0.1) {
      const base = at(x, y, z);
      root.add(obj);
      const mats: { m: THREE.Material; o: number }[] = [];
      obj.traverse((o) => { const m = (o as THREE.Mesh).material as THREE.Material | undefined; if (m) { m.transparent = true; mats.push({ m, o: m.opacity }); } });
      anims.push({ delay, dur: 1, apply: (p, g) => { const e = easeOut(p); obj.position.set(base.x, base.y - (1 - e) * 50, base.z); for (const { m, o } of mats) m.opacity = o * e * g; } });
      return obj;
    },

    /** глянцевая лента */
    band(pts: P3[], w: number, twist: number, color: string, delay: number) {
      const m = ribbon({ points: pts.map(([x, y, z]) => at(x, y, z)), width: (t) => w * (0.3 + 0.7 * Math.sin(Math.PI * Math.min(1, t * 1.25))), twist: (t) => twist * Math.sin(t * Math.PI * 1.5), color });
      root.add(m);
      const u = (m.material as THREE.ShaderMaterial).uniforms;
      ribbonU.push(u);
      anims.push({ delay, dur: 0.9, apply: (p, g) => { u.uReveal.value = easeOut(p) * 1.001; u.uOpacity.value = g; } });
    },

    /** огоньки: точки кадра с размером (px) */
    sparks(pts: { p: THREE.Vector3; size: number }[], color: string, k: number, delay: number) {
      const m = sparks(pts, color);
      root.add(m);
      const u = (m.material as THREE.ShaderMaterial).uniforms;
      sparkU.push(u);
      anims.push({ delay, dur: 1.2, apply: (p, g) => { u.uOpacity.value = k * easeOut(p) * g; u.uPx.value = stage.pxScale(); } });
    },
    /** облако огоньков по эллипсу вокруг композиции + крупные мягкие пятна, будто вне фокуса */
    sparkField(c: [number, number], r: [number, number], n: number, color = "#ffc070", nodes: [number, number, number][] = []) {
      const sp: { p: THREE.Vector3; size: number }[] = [];
      for (let i = 0; i < n; i++) {
        const a = rnd() * Math.PI * 2, k = 0.55 + rnd() * 0.6;
        sp.push({ p: at(c[0] + Math.cos(a) * r[0] * k, c[1] + Math.sin(a) * r[1] * k, -150 + rnd() * 260), size: 3 + rnd() * 5 });
      }
      for (const [x, y, s] of nodes) sp.push({ p: at(x, y, 0), size: s });
      kit.sparks(sp, color, 1, 0.6);
      const bokeh: { p: THREE.Vector3; size: number }[] = [];
      for (let i = 0; i < 16; i++) bokeh.push({ p: at(c[0] - r[0] * 0.9 + rnd() * r[0] * 1.8, c[1] - r[1] + rnd() * r[1] * 2, 80 + rnd() * 200), size: 22 + rnd() * 30 });
      kit.sparks(bokeh, color, 0.28, 0.4);
    },

    /** камни: при входе всплывают снизу */
    rocks(list: [number, number, number, number][]) {
      list.forEach(([x, y, s, z], i) => {
        const m = rock(s, i + 1);
        const base = at(x, y, z);
        m.rotation.set(i + 1, (i + 1) * 2.1, (i + 1) * 0.7);
        root.add(m);
        const mat = m.material as THREE.MeshStandardMaterial;
        anims.push({ delay: 0.3 + i * 0.04, dur: 1, apply: (p, g) => { const e = easeOut(p); m.position.set(base.x, base.y - (1 - e) * 40, base.z); mat.opacity = e * g; } });
      });
    },

    /** карточка стекла с содержимым: центр и поворот в кадре; при входе летит от середины и из глубины, потом парит */
    card(o: CardOpts & { c: [number, number]; z: number; r: P3; delay: number; amp?: number; order?: number }) {
      const m = card(o);
      m.renderOrder = o.order ?? 3;
      m.rotation.set(deg(o.r[0]), deg(o.r[1]), deg(o.r[2]), "YXZ");
      const fl = { m, base: at(o.c[0], o.c[1], o.z), ph: floaters.length * 1.7, amp: o.amp ?? 4, enter: 0 };
      floaters.push(fl);
      const u = (m.material as THREE.ShaderMaterial).uniforms.uOpacity;
      anims.push({ delay: o.delay, dur: 0.95, apply: (p, g) => { fl.enter = easeOut(p); u.value = Math.min(1, p * 2.2) * g; } });
      root.add(m);
      return m;
    },
  };

  const step = (ti: number, g: number, t: number, reduced: boolean) => {
    for (const a of anims) a.apply((ti - a.delay) / a.dur, g);
    for (const f of floaters) {
      const e = f.enter;
      f.m.position.set(
        hub.x + (f.base.x - hub.x) * e,
        hub.y + (f.base.y - hub.y) * e + (reduced ? 0 : Math.sin(t * 0.9 + f.ph) * f.amp),
        f.base.z - (1 - e) * 260,
      );
    }
    for (const u of ribbonU) u.uTime.value = t;
    for (const u of sparkU) u.uTime.value = t;
  };
  return Object.assign(kit, { step });
}

/** сцена кейса: свой прозрачный холст, цикл отрисовки только пока кейс на экране */
export function createCaseScene(canvas: HTMLCanvasElement, o: { hub: [number, number]; box: [number, number, number, number]; build(kit: Kit): Promise<void> }): CaseScene {
  let safe: (() => Safe | null) | null = null;
  const stage = createStage(canvas, fitBox(o.box, o.hub, () => safe?.() ?? null));
  const { renderer, scene, camera, root } = stage;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const kit = makeKit(stage, at(o.hub[0], o.hub[1], -120));
  const ready = (async () => {
    await o.build(kit);
    /* шейдеры собираются заранее, чтобы первый кадр входа не дёрнулся */
    await renderer.compileAsync(scene, camera);
  })();

  let raf = 0, last = 0, paused = false, built = false;
  let presence = 0, intro = -1; // intro — секунды с начала входа; −1 — вход ещё не начинался
  const pointer = new THREE.Vector2(), look = new THREE.Vector2(), res = new THREE.Vector2();
  const frame = (now: number) => {
    raf = 0;
    const dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016);
    last = now;
    if (!built) return;
    if (presence > 0.5 && intro < 0) intro = 0;
    if (presence <= 0.001) intro = -1;
    if (intro >= 0) intro += dt;
    look.lerp(pointer, 0.06);
    root.rotation.set(-look.y * 0.035, look.x * 0.05, 0);
    kit.step(reduced ? 99 : Math.max(0, intro), presence, now / 1000, reduced);
    renderer.getDrawingBufferSize(res);
    root.traverse((x) => { (x as Line2Like).material?.resolution?.set(res.x, res.y); });
    renderer.render(scene, camera);
    if (!paused && (presence > 0 || intro >= 0)) kick();
  };
  const kick = () => { if (!raf && !paused) raf = requestAnimationFrame(frame); };
  void ready.then(() => { built = true; kick(); });

  return {
    stage,
    ready,
    setPresence(v) { const was = presence; presence = clamp01(v); if (presence !== was) kick(); },
    setPointer(x, y) { pointer.set(x, y); },
    setSafe(fn) { safe = fn; stage.resize(); kick(); },
    still() { presence = 1; intro = 99; kick(); },
    pause() { paused = true; cancelAnimationFrame(raf); raf = 0; },
    resume() { paused = false; kick(); },
  };
}
type Line2Like = THREE.Object3D & { material?: { resolution?: THREE.Vector2 } };
