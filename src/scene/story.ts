import { clamp01, ramp } from "../lib/math";
import * as THREE from "three";

/* Скролл-история (docs/prompts/scroll.md): прогресс p 0…1 → поза компьютера и эффекты.

   Принцип Theatre.js без библиотеки: у движения отдельные «дорожки» — позиция и три угла,
   ключи расставлены по доле пути u, между ключами — Catmull-Rom (гладкая скорость без
   изломов). Сам u идёт по smootherstep: у старта и у финиша скорость нулевая, поэтому
   компьютер плавно отрывается от стола и мягко останавливается, а не втыкается в кадр.
   Всё — чистые функции от p: скролл назад проигрывает историю в обратную сторону. */

/* Две истории подряд, как в igloo: сначала холм «выгружается» — камера отъезжает, по траве
   бежит волна, кадр смазывается лучами от центра и расслаивается по каналам, снизу поднимается
   заливка; под заливкой — светлая страница About, и на неё прилетает компьютер.
   v67: голубая сетка-голограмма поверх холма убрана — переход собран ровно из того, из чего он
   собран у igloo (zoom-blur + хроматическая аберрация + рваная заливка), без своих добавок. */
export const STORY = {
  uiOut: [0.0, 0.08] as const, // интерфейс холма уходит
  camera: [0.0, 0.44] as const, // камера отъезжает
  wave: [0.03, 0.17] as const, // кольцо волны от кресла
  glitch: [0.22, 0.36, 0.45] as const, // вход, пик, выход глитча
  fill: [0.24, 0.46] as const, // заливка снизу закрывает кадр
  overlay: 0.1, // с этого места компьютер рисуется своим слоем — поверх глитча и заливки
  studio: [0.2, 0.44] as const, // закатный свет компьютера сменяется студийным (v17, как oryzo)
  flight: [0.02, 0.8] as const, // полёт компьютера: отрывается от стола сразу с началом скролла
  static: [0.8, 0.85, 0.91] as const, // помехи на экране
  photo: [0.85, 0.9] as const, // фото проявляется
  textOn: 0.9, // тексты входят
  textOff: 0.86, // и уходят при скролле назад
  /* v18 — дополнения по мотивам oryzo.ai (трапеции: вход от–до, выход от–до) */
  /* v19: бегущая строка «Hi there! I'm Nikita…» едет за компьютером, тормозит, уменьшается и встаёт
     в левую колонку заголовком «Hi there!»; остальной абзац проявляется по словам */
  kineticIn: [0.44, 0.52] as const, // строка проявляется
  kineticRun: [0.44, 0.8] as const, // едет справа налево, к концу тормозит
  kineticMorph: [0.8, 0.9] as const, // уменьшается и уезжает на место заголовка
  kineticSwap: [0.895, 0.905] as const, // подмена на DOM-заголовок (совпадает попиксельно)
  words: [0.9, 0.975] as const, // абзац левой колонки проявляется по словам
  finder: [0.46, 0.52, 0.83, 0.88] as const, // рамка видоискателя вокруг компьютера
  spin: [0.86, 1.0] as const, // на странице About компьютер поворачивается по скроллу
};

/* каждое дополнение v18 выключается в адресе: ?kinetic=0 ?finder=0 ?spin=0 (радугу по краям пробовали — убрана) */
const flags = typeof location === "undefined" ? new URLSearchParams() : new URLSearchParams(location.search);
const tune = (name: string, fallback: number) => (flags.has(name) && Number.isFinite(Number(flags.get(name))) ? Number(flags.get(name)) : fallback);

/* Переход igloo целиком, одними и теми же числами в обоих местах (`igloo/components/scene/
   TransitionEffect.tsx` + `Effects.tsx`, `CONFIG.transition` / `CONFIG.effects`):
   · zoom-blur лучами от центра — набирает силу в первой половине перехода и спадает во второй,
     когда закрывать уже нечего (blurCurve = sin(min(1, t·1.15)·π));
   · хроматическая аберрация — разъезд каналов вдоль луча от центра, растёт кубически, поэтому
     почти весь путь её не видно, а в конце она врывается разом; центр кадра остаётся чистым;
   · рваная заливка (наклон 0.16, два слоя шума 0.22/0.088, мягкость 0.14) — она уже в shaders.ts.
   t — доля перехода 0…1 (у нас это заливка). Переход стоит только на входе в About: тот же набор
   задом наперёд на выходе из неё в «Кейсы» пробовали и убрали — там страница просто обрывается. */
export const TRANSITION = {
  blur: tune("tblur", 0.55), // CONFIG.transition.blur; ?tblur= — подобрать
  /* разъезд каналов у края кадра в долях кадра на пике (igloo: 0.0004…0.003 × 22 с прижимом к краям) */
  aberration: tune("taberr", 0.03), // ?taberr= — подобрать
  /* центр кадра остаётся чистым: аберрация включается с этой доли радиуса (CONFIG.effects.aberrationRadial) */
  aberrationRadial: 0.35,
  /* на какой доле перехода аберрация выходит на полную. У igloo это самый конец, но там кадр к тому
     моменту ещё открыт; здесь заливка закрывает его раньше, и на пике в конце эффекта не видно совсем */
  aberrationPeak: 0.45,
  glitch: 0.32, // v17: мягче — полосы и расслоение намёком, а не на весь кадр
};
/** zoom-blur по доле перехода: пик посреди, ноль на концах (blurCurve igloo) */
export const zoomBlur = (t: number) => (t > 0 ? Math.max(0, Math.sin(Math.min(1, t * 1.15) * Math.PI)) * TRANSITION.blur : 0);
/** хроматическая аберрация по доле перехода: кубический рост (Effects.tsx igloo) */
export const aberrationAt = (t: number) => {
  const k = Math.min(1, Math.max(0, t) / TRANSITION.aberrationPeak);
  return k * k * k * TRANSITION.aberration;
};

/* Главы: 0…CHAPTER — холм → About (все ключи STORY выше — в долях этой главы),
   CHAPTER…CHAPTER2 — «Кейсы» (ключи CASES), CHAPTER2…1 — футер на закатном холме (ключи FOOTER).
   v23: доли пересчитаны под удлинённый .story (1330vh) — длина первых двух глав в прокрутке прежняя.
   (v26 пробовали сетку кейсов на 300vh — вернули ленту и её длину) */
/* v32: глава «Кейсы» выросла с ~450vh до ~870vh (луг, заставка, кейсы, заметки); .story 1330vh → 1750vh.
   Доли пересчитаны так, чтобы About и футер остались той же длины в прокрутке (529vh и 250vh). */
/* v43: доли глав больше не константы, а результат расчёта. Длина каждой сцены задана в экранах (1 = 100vh),
   а длина лент — от числа элементов: один кейс или одна заметка = один шаг прокрутки `step`. Шаг считает
   cases.ts от настоящего расстояния между карточками, поэтому лента едет примерно с той же скоростью, что и
   страница, на любом экране. layoutTimeline() пересчитывает доли; высоту .story ставит src/ui/storyScroll.ts. */
type Span = readonly [number, number];
export let CHAPTER = 0.3208;
export let CHAPTER2 = 0.8485;
export const FOOTER = {
  leave: [0.0, 0.14] as const, // лента кейсов уходит
  camera: [0.04, 0.5] as const, // камера возвращается к холму
  unblur: [0.3, 0.58] as const, // размытие уходит
  portal: [0.07, 0.47] as const, // v76: посреди луга встаёт портал, камера проходит сквозь него к холму
  dusk: 0.08, // погода — закат, светлячки
  content: 0.52, // тексты и контакты футера
};
export const CASES: Record<"tear" | "intro" | "blur" | "cardsIn" | "strip" | "stripOut" | "notes" | "notesIn" | "notesRun", Span> = {
  tear: [0.0, 0.083], // страница About отрывается снизу и уходит вверх — под ней луг (v32)
  intro: [0.06, 0.25], // заставка «сейчас будут кейсы» поверх резкого луга
  blur: [0.22, 0.28], // луг уходит в размытие под ленту
  cardsIn: [0.26, 0.343], // лента кейсов поднимается
  strip: [0.32, 0.71], // лента едет: от первого кейса к последнему
  stripOut: [0.71, 0.76], // лента уходит
  notes: [0.74, 1.0], // заметки в новом формате
  notesIn: [0.74, 0.777], // заметки входят
  notesRun: [0.771, 0.984], // заметки листаются: от первой к последней
};

export type TimelineInput = {
  /** узкий экран: сцены короче, как было в v32 (1454vh против 1750vh) */
  narrow: boolean;
  cases: number;
  notes: number;
  /** сколько экранов прокрутки приходится на один кейс или одну заметку */
  step: number;
};
/** длины глав в экранах после последнего расчёта */
export const TIMELINE = { about: 5.29, cases: 8.7, footer: 2.5, total: 16.5, step: 0.68 };

/** Пересчитать доли глав. Возвращает функцию, которая переводит старый прогресс в новый (та же глава, та же доля). */
export function layoutTimeline(input: TimelineInput) {
  const old = { a: CHAPTER, b: CHAPTER2 };
  const k = input.narrow ? 0.88 : 1;
  const about = input.narrow ? 4.66 : 5.29;
  const footer = input.narrow ? 2.2 : 2.5;
  const step = Math.min(0.9, Math.max(0.4, input.step));
  /* сцены главы «Кейсы» в экранах от её начала */
  /* v74.2: переход About → «Кейсы» длиннее (было 0.72 экрана): бумага не рвётся, а растворяется облаком,
     и растворению нужно время, чтобы читаться. Всё, что после него, сдвинуто на ту же добавку L */
  const L = 0.58 * k;
  const tear: Span = [0, 1.3 * k];
  const intro: Span = [0.52 * k + L, 2.17 * k + L];
  const blur: Span = [1.91 * k + L, 2.43 * k + L];
  const cardsIn: Span = [2.26 * k + L, 2.98 * k + L];
  const stripStart = 2.88 * k + L; // первая карточка трогается, когда лента почти встала
  const stripEnd = stripStart + Math.max(1, input.cases - 1) * step;
  const stripOut: Span = [stripEnd, stripEnd + 0.43 * k];
  const notesStart = stripEnd + 0.26 * k;
  const notesIn: Span = [notesStart, notesStart + 0.32 * k];
  const runStart = notesStart + 0.27 * k;
  const runEnd = runStart + Math.max(1, input.notes - 1) * step;
  const cases = runEnd + 0.14 * k;
  const total = about + cases + footer;
  const frac = (s: Span): Span => [s[0] / cases, s[1] / cases];
  Object.assign(CASES, {
    tear: frac(tear), intro: frac(intro), blur: frac(blur), cardsIn: frac(cardsIn),
    strip: frac([stripStart, stripEnd]), stripOut: frac(stripOut),
    notes: frac([notesStart, cases]), notesIn: frac(notesIn), notesRun: frac([runStart, runEnd]),
  });
  CHAPTER = about / total;
  CHAPTER2 = (about + cases) / total;
  Object.assign(TIMELINE, { about, cases, footer, total, step });
  const now = { a: CHAPTER, b: CHAPTER2 };
  return (p: number) =>
    p <= old.a ? (p / old.a) * now.a
    : p <= old.b ? now.a + ((p - old.a) / (old.b - old.a)) * (now.b - now.a)
    : now.b + ((p - old.b) / (1 - old.b)) * (1 - now.b);
}

/** Номер карточки для ленты под палец (v48). Простое округление переключало карточку от движения на полшага:
    после свайпа вбок страница стоит ровно на карточке, и 200 px вертикального скролла уже листали дальше — лента
    дёргалась под пальцем, пока человек читал. Здесь гистерезис: вперёд — когда пройдено 60 % шага, назад — когда
    отступили на 60 %; между порогами карточка стоит. Далёкий прыжок (пункт меню) попадает сразу куда надо. */
export const stickyIndex = (run: number, current: number) => {
  if (current < 0) return Math.round(run);
  if (run > current + 0.6) return Math.floor(run + 0.4);
  if (run < current - 0.6) return Math.ceil(run - 0.4);
  return current;
};

/** Шаги с мягкой остановкой: у каждого элемента лента притормаживает, между элементами едет быстрее.
    Производная 1 − k·cos(2πf): при k = 0,5 скорость у карточки вдвое ниже средней, без остановок и рывков. */
export const dwell = (x: number, k = 0.5) => {
  const i = Math.floor(x);
  const f = x - i;
  return i + f - (k / (2 * Math.PI)) * Math.sin(2 * Math.PI * f);
};
/* v32: луг Meadow Walk — фон всей главы «Кейсы»; в футере под размытием смешивается обратно с холмом */
export const MEADOW_OUT = [0.1, 0.26] as const;
/** прогресс всей истории → доли глав */
export const chapters = (p: number) => ({
  s: Math.min(1, p / CHAPTER),
  c: clamp01((p - CHAPTER) / (CHAPTER2 - CHAPTER)),
  f: clamp01((p - CHAPTER2) / (1 - CHAPTER2)),
});

/* футер: камера от последнего кадра кейсов плавно возвращается к холму — чуть дальше и ниже,
   чем на первом экране, чтобы над гребнем было закатное небо под тексты */
/* v47: этот кадр стал позой покоя самого холма (HillScene: CAMERA_REST_OFF, CAMERA_TARGET) — футер возвращается
   ровно в неё, без собственного сдвига */
const FOOT_OFF = new THREE.Vector3(0, 0, 0);
const FOOT_LOOK = new THREE.Vector3(0, 0, 0);
const tmpF = new THREE.Vector3();
const tmpL = new THREE.Vector3();
export function footerCamera(f: number, rest: THREE.Vector3, restLook: THREE.Vector3, pos: THREE.Vector3, look: THREE.Vector3) {
  const k = smoother(ramp(f, ...FOOTER.camera));
  if (k <= 0) return;
  tmpF.copy(rest).add(FOOT_OFF);
  tmpL.copy(restLook).add(FOOT_LOOK);
  pos.lerp(tmpF, k);
  look.lerp(tmpL, k);
}

/* Ракурс главы «Кейсы»: низко в траве перед холмом, снизу вверх на кресло против закатного неба.
   Трава посажена только там, куда смотрит основная камера, — кадр держится внутри этой зоны.
   Лента кейсов ведёт камеру вбок. ?casecam=x,y,z,tx,ty,tz — подобрать кадр. */
const CASE_POS = new THREE.Vector3(-1.5, 2.05, 5.2);
const CASE_LOOK = new THREE.Vector3(0.35, 2.75, 0);
const CASE_DRIFT = new THREE.Vector3(1.6, 0.12, -0.35);
{
  const q = flags.get("casecam")?.split(",").map(Number);
  if (q?.length === 6 && q.every(Number.isFinite)) { CASE_POS.set(q[0], q[1], q[2]); CASE_LOOK.set(q[3], q[4], q[5]); }
}
export function casesCamera(c: number, pos: THREE.Vector3, look: THREE.Vector3) {
  const k = smoother(ramp(c, CASES.strip[0] - 0.2, 1));
  pos.copy(CASE_POS).addScaledVector(CASE_DRIFT, k);
  look.copy(CASE_LOOK).addScaledVector(CASE_DRIFT, k * 0.55);
}

export const STORY_FX = {
  kinetic: flags.get("kinetic") !== "0",
  finder: flags.get("finder") !== "0",
  spin: flags.get("spin") !== "0",
};

/* Камера отъезжает назад и чуть вверх — как CameraRig у igloo: одна траектория по прогрессу.
   Ключи — смещения от позы покоя (на вертикальном экране она сама дальше). */
const CAM_OFF = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0.7, 0.53, 2.0), new THREE.Vector3(1.5, 1.18, 4.6)];
const LOOK_OFF = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, -0.07, 0), new THREE.Vector3(0, -0.22, 0)];
const tmpA = new THREE.Vector3();
export function storyCamera(s: number, rest: THREE.Vector3, restLook: THREE.Vector3, pos: THREE.Vector3, look: THREE.Vector3) {
  const u = smoother(ramp(s, ...STORY.camera));
  const seg = u < 0.5 ? 0 : 1;
  const k = u < 0.5 ? u * 2 : (u - 0.5) * 2;
  pos.copy(rest).add(tmpA.lerpVectors(CAM_OFF[seg], CAM_OFF[seg + 1], k));
  look.copy(restLook).add(tmpA.lerpVectors(LOOK_OFF[seg], LOOK_OFF[seg + 1], k));
}

/* ramp нужен почти всем, кто читает эту раскладку, поэтому отдаётся и отсюда */
export { ramp };
const smoother = (x: number) => x * x * x * (x * (x * 6 - 15) + 10);
/** трапеция: 0 до a, 1 от b до c, 0 после d (со сглаживанием) */
export const trap = (x: number, a: number, b: number, c: number, d: number) => {
  const t = Math.min(ramp(x, a, b), 1 - ramp(x, c, d));
  return t * t * (3 - 2 * t);
};
/** колокол: 0 до a, 1 в b, 0 после c */
export const bell = (x: number, a: number, b: number, c: number) => {
  if (x <= a || x >= c) return 0;
  const t = x < b ? (x - a) / (b - a) : (c - x) / (c - b);
  return t * t * (3 - 2 * t);
};

/* Catmull-Rom по равномерным ключам (u = 0, 1/(n−1), … 1) */
function track(keys: number[], u: number) {
  const n = keys.length - 1;
  const f = clamp01(u) * n;
  const i = Math.min(n - 1, Math.floor(f));
  const t = f - i;
  const p0 = keys[Math.max(0, i - 1)], p1 = keys[i], p2 = keys[i + 1], p3 = keys[Math.min(n, i + 2)];
  const t2 = t * t, t3 = t2 * t;
  return 0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3);
}

export type Pose = { pos: THREE.Vector3; yaw: number; pitch: number; roll: number };

const tmp = new THREE.Vector3();

/**
 * Поза компьютера на пути от столика (rest) к точке перед камерой (end).
 * u — доля полёта 0…1 (уже без сглаживания — оно внутри).
 */
export function flightPose(rest: Pose, end: Pose, u: number, out: Pose): Pose {
  /* v17: smoothstep по чуть «ускоренному» времени вместо smootherstep — компьютер заметно
     приподнимается уже на первых оборотах колеса, пока холм ещё виден, и мягко останавливается */
  const w = clamp01(u) ** 0.8;
  const s = w * w * (3 - 2 * w);
  /* позиция: отрыв вверх → дуга в сторону и к зрителю → финиш. Ключи — смещения от rest к end */
  const d = tmp.subVectors(end.pos, rest.pos);
  const kx = [0, 0.06, 0.45, 0.85, 1];
  const ky = [0, 0.3, 0.8, 1.06, 1];
  const kz = [0, 0.14, 0.6, 0.92, 1]; // v17: к зрителю раньше — на странице не крошечная точка
  /* подъём над столом в метрах и уход вбок, пока летит */
  const lift = [0, 0.32, 0.38, 0.12, 0];
  const side = [0, -0.05, 0.55, 0.28, 0];
  out.pos.set(
    rest.pos.x + d.x * track(kx, s) + track(side, s),
    rest.pos.y + d.y * track(ky, s) + track(lift, s),
    rest.pos.z + d.z * track(kz, s),
  );
  /* повороты: разворот боком и обратно, покачивание — плавно гаснут к финишу */
  const dy = end.yaw - rest.yaw;
  out.yaw = rest.yaw + track([0, -0.35, 1.9, 0.72, 0], s) + dy * track([0, 0.05, 0.4, 0.9, 1], s);
  out.pitch = rest.pitch + track([0, 0.22, -0.18, 0.1, 0], s) + (end.pitch - rest.pitch) * track([0, 0.1, 0.5, 0.9, 1], s);
  out.roll = track([0, -0.1, 0.24, -0.08, 0], s);
  return out;
}
