/* v43: прокрутка истории в одном месте — границы блока .story, перевод «прогресс ↔ пиксели» и расчёт длины.

   Длина истории больше не записана в CSS числом. Её считает story.ts (layoutTimeline) от числа кейсов и заметок
   и от шага ленты, а сюда приходит результат: высота .story в экранах. Так один кейс занимает одинаковую
   дистанцию прокрутки на любом экране, а добавленный кейс сам удлиняет историю. */
import { TIMELINE, layoutTimeline, type TimelineInput } from "../scene/story";

const story = () => document.querySelector<HTMLElement>(".story");

/** где в прокрутке страницы история начинается и заканчивается */
export function storyBounds() {
  const el = story();
  if (!el) return { start: 0, end: 1 };
  const top = el.offsetTop;
  return { start: Math.max(0, top - innerHeight), end: top + el.offsetHeight - innerHeight };
}
export function topFor(p: number) {
  const b = storyBounds();
  return p <= 0 ? 0 : b.start + (b.end - b.start) * p;
}
export function progressNow() {
  const b = storyBounds();
  return Math.min(1, Math.max(0, (scrollY - b.start) / Math.max(1, b.end - b.start)));
}

type Listener = () => void;
const listeners = new Set<Listener>();
/** вызвать после того, как длина истории пересчитана (границы изменились) */
export const onTimeline = (cb: Listener) => { listeners.add(cb); };

let lastKey = "";
/** Пересчитать доли глав и высоту .story. Позиция читателя сохраняется: та же глава, та же доля. */
export function applyTimeline(input: TimelineInput) {
  const el = story();
  if (!el) return;
  /* на телефоне окно меняет высоту, когда прячется адресная строка: пересчёт по каждому такому событию сбивал бы
     инерцию пальца, поэтому ключ — только то, от чего зависят доли */
  const lead = Math.min(el.offsetTop, innerHeight) / Math.max(1, innerHeight);
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
