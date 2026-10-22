/* v43: прокрутка истории в одном месте — границы блока .story, перевод «прогресс ↔ пиксели» и расчёт длины.

   Длина истории больше не записана в CSS числом. Её считает story.ts (layoutTimeline) от числа кейсов и заметок
   и от шага ленты, а сюда приходит результат: высота .story в экранах. Так один кейс занимает одинаковую
   дистанцию прокрутки на любом экране, а добавленный кейс сам удлиняет историю. */
import { CASES, CHAPTER, CHAPTER2, TIMELINE, chapters, layoutTimeline, portalAt, type TimelineInput } from "../scene/story";

const story = () => document.querySelector<HTMLElement>(".story");

/* v68: высота окна, которую не шатает адресная строка телефона.

   Симптом, с которого началось: на телефоне не перейти от карточки к карточке, особенно назад — экран моргает
   и карточка перескакивает. Причина: прогресс истории считался от innerHeight. Браузер на телефоне прячет и
   показывает адресную строку, innerHeight меняется на 50–90 px, а страница при этом не сдвигается ни на пиксель.
   Один и тот же scrollY превращался в другой прогресс — и вся глава прыгала. Замер на эмуляции телефона: окно
   ниже на 64 px при неподвижной прокрутке — прогресс 0.750 → 0.809, карточка 02 → 03. Листание назад страдало
   сильнее всего, потому что прокрутка вверх — это ровно тот жест, которым адресная строка и вытаскивается.

   Лечение: мерить не текущее окно, а единицу vh. По спецификации vh считается от «большого» окна (адресная
   строка спрятана) и адресной строкой не двигается; в этих же единицах задана высота .story и высота hero
   (100svh — тоже устойчивая). Значение берём с крошечного скрытого пробника и держим в памяти до настоящей
   смены окна. */
let probe: HTMLElement | null = null;
let cached = 0;
function viewH() {
  if (cached) return cached;
  if (!probe) {
    probe = document.createElement("i");
    probe.setAttribute("aria-hidden", "true");
    probe.style.cssText = "position:fixed;top:0;left:0;width:0;height:100vh;visibility:hidden;pointer-events:none";
    document.body.appendChild(probe);
  }
  cached = probe.offsetHeight || innerHeight;
  return cached;
}

type Listener = () => void;
const listeners = new Set<Listener>();
/** вызвать после того, как длина истории пересчитана (границы изменились) */
export const onTimeline = (cb: Listener) => { listeners.add(cb); };

const viewport = new Set<Listener>();
/** Настоящая смена окна: поворот телефона, другой размер окна на компьютере. Прятки адресной строки сюда не
    попадают — раньше каждая такая прятка запускала полный пересчёт главы прямо под пальцем. */
export const onViewport = (cb: Listener) => { viewport.add(cb); };
let lastW = typeof window === "undefined" ? 0 : innerWidth;
let lastH = 0;
const recheck = () => {
  cached = 0;
  const w = innerWidth, h = viewH();
  if (w === lastW && Math.abs(h - lastH) < 2) return;
  lastW = w; lastH = h;
  viewport.forEach((cb) => cb());
};
if (typeof window !== "undefined") {
  addEventListener("resize", recheck);
  addEventListener("orientationchange", recheck);
}

/* Сколько экрана над историей уже должно быть занято ею, когда она стартует. Широкий экран: первый экран закреплён,
   история начинается с нуля. Узкий (v48): первый экран прокручивается, и карточка заметок стоит в самом его низу.
   Раньше история стартовала, как только низ первого экрана показался в окне: карточка была целиком видна ~200 px
   прокрутки, потом интерфейс гас и переставал отвечать на палец — заметки на телефоне было не полистать.
   Теперь история ждёт, пока низ первого экрана поднимется до 40 % высоты окна: карточка успевает доехать до
   середины экрана, её можно раскрыть и пролистать. */
const leadPx = (top: number) => Math.min(top, viewH() * (innerWidth <= 900 ? 0.4 : 1));

/** где в прокрутке страницы история начинается и заканчивается */
export function storyBounds() {
  const el = story();
  if (!el) return { start: 0, end: 1 };
  const top = el.offsetTop;
  return { start: Math.max(0, top - leadPx(top)), end: top + el.offsetHeight - viewH() };
}
export function topFor(p: number) {
  const b = storyBounds();
  return p <= 0 ? 0 : b.start + (b.end - b.start) * p;
}
function progressNow() {
  const b = storyBounds();
  return Math.min(1, Math.max(0, (scrollY - b.start) / Math.max(1, b.end - b.start)));
}

let lastKey = "";
let counts = { cases: 0, notes: 0 };
/** Пересчитать доли глав и высоту .story. Позиция читателя сохраняется: та же глава, та же доля. */
export function applyTimeline(input: TimelineInput) {
  counts = { cases: input.cases, notes: input.notes };
  const el = story();
  if (!el) return;
  const lead = leadPx(el.offsetTop) / Math.max(1, viewH());
  /* v84: длина футера зависит от пропорций окна — там, где проём портала закрывает экран (story.ts, PORTAL) */
  input = { ...input, aspect: innerWidth / Math.max(1, viewH()) };
  const key = `${input.narrow}|${input.cases}|${input.notes}|${input.step.toFixed(2)}|${lead.toFixed(2)}|${input.aspect!.toFixed(2)}`;
  if (key === lastKey) return;
  lastKey = key;
  const before = progressNow();
  const moved = scrollY > storyBounds().start + 2;
  const remap = layoutTimeline(input);
  /* прогресс идёт от «история коснулась низа окна» до «её низ у низа окна». Если над историей меньше экрана
     (широкий экран: hero закреплена, история начинается с нуля), недостающую часть добавляем к высоте */
  el.style.height = `${((TIMELINE.total + 1 - lead) * 100).toFixed(1)}vh`;
  if (moved) scrollTo({ top: topFor(remap(before)), behavior: "instant" as ScrollBehavior });
  placeStops();
  listeners.forEach((cb) => cb());
}

/* v74.3: остановка на странице About. Резкий взмах колесом или пальцем проносил страницу через About за один
   жест — компьютер и тексты мелькали и сразу уходили в «Кейсы». Теперь у прокрутки есть точка, где About стоит
   целиком (98,5 % главы: компьютер на месте, абзац проявился весь). Если жест человека (колесо, палец, клавиши)
   пересекает её в любую сторону, страница встаёт ровно в неё и 0,6 с не пускает дальше — хватает, чтобы взмах
   погас. Прокрутку кнопками меню и программные переходы это не трогает: ловится только то, что пришло от
   ввода за последние мгновения. Браузерная привязка (scroll-snap с scroll-snap-stop) не подошла: быстрый взмах
   колесом в Chrome её проскакивал */
let stopY = -1;
let holdUntil = 0;
let lastInput = -1e9;
let lastY = typeof window === "undefined" ? 0 : scrollY;
let snapStops: number[] = [];
function placeStops() {
  if (document.body.classList.contains("lite") || !story()) { stopY = -1; snapStops = []; return; }
  /* 0.985: абзац слева проявляется по словам до 0.975 главы (STORY.words) — останавливаемся, когда он весь */
  stopY = topFor(CHAPTER * 0.985);
  /* v114 (по мотивам igloo): точки доводки — About, каждый кейс в ленте, каждый пэт-проект */
  const at = (c: number) => topFor(CHAPTER + (CHAPTER2 - CHAPTER) * c);
  const run = ([a, b]: readonly [number, number], n: number) => Array.from({ length: n }, (_, i) => at(a + (b - a) * (i / Math.max(1, n - 1))));
  /* v115: и края — начало (первый экран) и конец (футер), как остановки сцен у igloo */
  const end = Math.max(0, (document.scrollingElement?.scrollHeight ?? 0) - innerHeight);
  snapStops = [0, stopY, ...run(CASES.strip, counts.cases), ...run(CASES.notesRun, counts.notes), end];
}
/* чем доводить: плавным движением колеса (storyWheel.ts), иначе — браузерной плавной прокруткой */
let glideTo: ((top: number, seconds: number) => void) | null = null;
export function setSnapGlide(fn: (top: number, seconds: number) => void) { glideTo = fn; }

/* v114 (по мотивам igloo.inc): доводка. Через 1,4 с после последнего жеста, если страница остановилась рядом с кейсом,
   пэт-проектом или страницей About (v115: ближе половины шага ленты), она плавно доезжает до него — человек не застревает
   между двумя кейсами. Дальше от точки — не трогаем (глава между ними, футер, первый экран). ?snap=0 — без доводки */
const SNAP = typeof location === "undefined" || !/[?&]snap=0/.test(location.search);
let snapTimer = 0;
let lastScrollAt = 0;
let scrollDir = 0, dirY = 0;
/* v122 (Никита: «перескакивает через кейс»): остановка, у которой стояли перед жестом. Вперёд доводим только к соседней
   с ней — раньше «соседняя» считалась от ближайшей к месту остановки, и, проскочив кейс на треть шага, страница
   уезжала ещё на кейс дальше */
let anchor = -1;
let gestureAt = -1e9;
const nearestStop = (y: number) => snapStops.reduce((b, v) => (Math.abs(v - y) < Math.abs(b - y) ? v : b), snapStops[0] ?? -1);
function scheduleSnap() {
  clearTimeout(snapTimer);
  if (!SNAP || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  snapTimer = window.setTimeout(() => {
    const b = document.body.classList;
    if (b.contains("lite") || b.contains("case-open") || b.contains("pc-focus") || b.contains("m-menu-open") || !snapStops.length) return;
    /* страница ещё катится (инерция пальца на телефоне) — подождать, пока встанет */
    if (performance.now() - lastScrollAt < 250) { scheduleSnap(); return; }
    const bounds = storyBounds();
    /* v115: порог — половина шага ленты (у igloo — середина пути до соседней остановки) */
    const reach = (bounds.end - bounds.start) * (CHAPTER2 - CHAPTER) * (CASES.strip[1] - CASES.strip[0]) / Math.max(1, counts.cases - 1) * 0.5;
    let best = -1, dist = Infinity;
    for (const y of snapStops) { const d = Math.abs(y - scrollY); if (d < dist) { dist = d; best = y; } }
    /* v120 (замер: «Кейсы тормозят»): ближайшая остановка тянула назад даже после нескольких щелчков к следующему кейсу —
       листать было как против пружины. Если человек ушёл от остановки в сторону прокрутки хотя бы на пятую часть шага,
       доводим вперёд, к следующей остановке в ту же сторону (если она не дальше шага) */
    const step = reach * 2;
    let forward = false;
    if (scrollDir !== 0 && best === anchor && Math.abs(scrollY - best) > step * 0.2 && Math.sign(scrollY - best) === scrollDir) {
      const ahead = snapStops.filter((y) => Math.sign(y - anchor) === scrollDir && Math.abs(y - anchor) < step * 1.6)
        .sort((a, b) => Math.abs(a - anchor) - Math.abs(b - anchor))[0];
      if (ahead !== undefined) { best = ahead; dist = Math.abs(ahead - scrollY); forward = true; }
    }
    /* v122 (Никита: «долетел до колонны, а кейс справа не появился»): между заставкой кейсов и первым кейсом и между
       уходом ленты и первым пэт-проектом страница не стоит — доезжает до первого */
    if (!forward) {
      const pg = Math.min(1, Math.max(0, (scrollY - bounds.start) / Math.max(1, bounds.end - bounds.start)));
      const ch = chapters(pg).c;
      const funnel = ([a, b]: readonly [number, number]) => ch > a && ch < b && scrollDir >= 0;
      const first = (span: readonly [number, number]) => topFor(CHAPTER + (CHAPTER2 - CHAPTER) * span[0]);
      if (chapters(pg).f <= 0 && funnel([CASES.cardsIn[0] - 0.03, CASES.strip[0] - 0.002])) { best = first(CASES.strip); dist = Math.abs(best - scrollY); forward = true; }
      else if (chapters(pg).f <= 0 && funnel([CASES.stripOut[1] - 0.01, CASES.notesRun[0] - 0.002])) { best = first(CASES.notesRun); dist = Math.abs(best - scrollY); forward = true; }
    }
    /* к первому экрану не тянем: чуть прокрутили от него и остановились — страница стоит, где оставили */
    if (!forward && best === 0) return;
    /* v115 (как у igloo): в портале не стоят — за серединой прохода он довозит до футера, раньше — назад к лугу */
    const p = Math.min(1, Math.max(0, (scrollY - bounds.start) / Math.max(1, bounds.end - bounds.start)));
    const { f } = chapters(p);
    const pk = f > 0 ? portalAt(f) : 0;
    if (pk > 0.02 && pk < 0.98) {
      best = pk > 0.3 ? snapStops[snapStops.length - 1] : topFor(CHAPTER2);
      dist = Math.abs(best - scrollY);
      if (dist < 2) return;
      glideTo ? glideTo(best, Math.min(2.2, Math.max(0.9, (dist / innerHeight) * 0.9))) : scrollTo({ top: best, behavior: "smooth" });
      return;
    }
    if (best < 0 || dist < 2 || (dist > reach && !forward)) return;
    /* длительность от расстояния: короткий доезд ~0,6 с, полшага — до 1,3 с */
    const seconds = Math.min(1.3, Math.max(0.6, (dist / innerHeight) * 1.6));
    anchor = best;
    if (glideTo) glideTo(best, seconds);
    else scrollTo({ top: best, behavior: "smooth" });
  }, 1400);
}
if (typeof window !== "undefined") {
  onViewport(() => requestAnimationFrame(placeStops));
  /* начало жеста (после паузы больше 0,6 с): запоминаем остановку, у которой стояли */
  const input = () => {
    const now = performance.now();
    if (now - gestureAt > 600 && snapStops.length) anchor = nearestStop(scrollY);
    gestureAt = now;
    lastInput = now; scheduleSnap();
  };
  /* инерция пальца продолжается после отпускания — окно «жеста» после touchend длиннее */
  addEventListener("touchend", () => { lastInput = performance.now() + 900; scheduleSnap(); }, { passive: true });
  addEventListener("keydown", input);
  const hold = (e: Event) => { if (performance.now() < holdUntil && e.cancelable) e.preventDefault(); };
  addEventListener("wheel", (e) => { input(); hold(e); }, { passive: false });
  addEventListener("touchmove", (e) => { input(); hold(e); }, { passive: false });
  addEventListener("scroll", () => {
    lastScrollAt = performance.now();
    if (Math.abs(scrollY - dirY) > 2) { scrollDir = Math.sign(scrollY - dirY); dirY = scrollY; }
    const y = scrollY;
    const now = performance.now();
    if (stopY > 0 && now < holdUntil && Math.abs(y - stopY) > 1) {
      scrollTo({ top: stopY, behavior: "instant" as ScrollBehavior });
      return;
    }
    const crossed = stopY > 0 && ((lastY < stopY - 2 && y > stopY + 2) || (lastY > stopY + 2 && y < stopY - 2));
    lastY = y;
    if (crossed && now - lastInput < 250) {
      holdUntil = now + 600;
      lastY = stopY;
      scrollTo({ top: stopY, behavior: "instant" as ScrollBehavior });
    }
  }, { passive: true });
}
