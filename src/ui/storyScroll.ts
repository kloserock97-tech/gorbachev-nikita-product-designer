/* v43: прокрутка истории в одном месте — границы блока .story, перевод «прогресс ↔ пиксели» и расчёт длины.

   Длина истории больше не записана в CSS числом. Её считает story.ts (layoutTimeline) от числа кейсов и заметок
   и от шага ленты, а сюда приходит результат: высота .story в экранах. Так один кейс занимает одинаковую
   дистанцию прокрутки на любом экране, а добавленный кейс сам удлиняет историю. */
import { TIMELINE, layoutTimeline, type TimelineInput } from "../scene/story";

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
export function viewH() {
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
/** Пересчитать доли глав и высоту .story. Позиция читателя сохраняется: та же глава, та же доля. */
export function applyTimeline(input: TimelineInput) {
  const el = story();
  if (!el) return;
  const lead = leadPx(el.offsetTop) / Math.max(1, viewH());
  const key = `${input.narrow}|${input.cases}|${input.notes}|${input.step.toFixed(2)}|${lead.toFixed(2)}`;
  if (key === lastKey) return;
  lastKey = key;
  const before = progressNow();
  const moved = scrollY > storyBounds().start + 2;
  const remap = layoutTimeline(input);
  /* прогресс идёт от «история коснулась низа окна» до «её низ у низа окна». Если над историей меньше экрана
     (широкий экран: hero закреплена, история начинается с нуля), недостающую часть добавляем к высоте */
  el.style.height = `${((TIMELINE.total + 1 - lead) * 100).toFixed(1)}vh`;
  if (moved) scrollTo({ top: topFor(remap(before)), behavior: "instant" as ScrollBehavior });
  listeners.forEach((cb) => cb());
}
