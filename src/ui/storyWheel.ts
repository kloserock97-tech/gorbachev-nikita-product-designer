/* v115 (Никита: «прокрутка igloo нравится — сделай так же»; приёмы igloo.inc, код свой). Колесо на 3D-главной.

   Как у igloo:
   · колесо двигает не страницу, а невидимую цель; к цели тянется «ведущая» точка с ограничением скорости, а страница
     встаёт в неё. Вторую ступень сглаживания даёт сама сцена (HillScene.updateStory догоняет прогресс) — вместе две
     ступени, как у них: короткий щелчок колеса мягко разгоняется и мягко садится, без рывка в начале;
   · цель не убегает от страницы дальше чем на 0,75 экрана: резкий взмах не проносит сквозь главы, а «копит» ход;
   · доводка до остановки (storyScroll.ts) едет по этой же точке кривой «медленно — быстро — медленно».
   Что осталось родным: палец, клавиатура, полоса прокрутки, Ctrl+колесо, вложенные прокрутки (меню кейсов), режим
   «меньше движения». Прокрутили не мы (клавиша, полоса, переход по меню) — подхватываем место и не спорим. */

const LINE = 100 / 3;
/* v120 (замер: «Кейсы тормозят»): у igloo две ступени, а у нас сверху ещё затухание сцены — с 4,7 отклик на колесо
   был вдвое медленнее прежнего (90 % хода за 0,87 с против 0,44). 12 — мягкий старт остаётся, задержка почти как была.
   v122 (Никита: «в прогулке дёргано, кадры дёргаются»): одна ступень λ 12 давала толчок на каждый щелчок колеса —
   скорость прыгала вверх и затухала до следующего щелчка, тексты и карточки, привязанные к прокрутке, ехали рывками.
   Теперь две одинаковые ступени подряд (цель → средняя → ведущая): скорость меняется плавно, без ступенек, а 90 %
   хода набирается за то же время, что у одной ступени 12 */
const LEAD = 18; // 1/с: каждая из двух ступеней догоняет предыдущую
const MAX_SPEED = 4.5; // экранов в секунду — предел скорости ведущей точки
const AHEAD = 0.75; // экрана — на сколько цель может обогнать страницу

export type StoryWheel = { glide: (top: number, seconds: number) => void };

export function initStoryWheel(skip: () => boolean): StoryWheel {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)");
  const root = document.scrollingElement as HTMLElement;
  const max = () => Math.max(0, root.scrollHeight - innerHeight);
  const clamp = (v: number) => Math.min(max(), Math.max(0, v));
  let target = scrollY, mid = scrollY, lead = scrollY, expected = -1;
  let raf = 0, last = 0;
  let glide: { from: number; to: number; t0: number; dur: number } | null = null;

  const set = (v: number) => { expected = Math.round(v); scrollTo({ top: v, behavior: "instant" as ScrollBehavior }); };
  /* «медленно — быстро — медленно» с крутой серединой (как их кривая inOut) */
  const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  const tick = (now: number) => {
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    if (glide) {
      const k = Math.min(1, (now - glide.t0) / (glide.dur * 1000));
      lead = mid = target = glide.from + (glide.to - glide.from) * ease(k);
      if (k >= 1) glide = null;
    } else {
      const k = 1 - Math.exp(-dt * LEAD);
      mid += (target - mid) * k;
      let step = (mid - lead) * k;
      const cap = MAX_SPEED * innerHeight * dt;
      step = Math.max(-cap, Math.min(cap, step));
      lead += step;
      if (Math.abs(target - lead) < 0.5 && Math.abs(target - mid) < 0.5) lead = mid = target;
    }
    set(lead);
    raf = lead === target && !glide ? 0 : requestAnimationFrame(tick);
  };
  const start = () => { if (!raf) { last = performance.now(); raf = requestAnimationFrame(tick); } };
  const halt = () => { if (raf) cancelAnimationFrame(raf); raf = 0; glide = null; target = mid = lead = scrollY; };

  const nested = (from: EventTarget | null, dy: number) => {
    for (let el = from as HTMLElement | null; el && el !== document.body; el = el.parentElement) {
      if (el.scrollHeight <= el.clientHeight + 1) continue;
      const oy = getComputedStyle(el).overflowY;
      if (oy !== "auto" && oy !== "scroll") continue;
      if (dy > 0 ? el.scrollTop + el.clientHeight < el.scrollHeight - 1 : el.scrollTop > 0) return true;
    }
    return false;
  };

  /* ?wheel=0 — родное колесо браузера (для сравнения) */
  const off = /[?&]wheel=0/.test(location.search);
  addEventListener("wheel", (e) => {
    if (off || reduce.matches || e.ctrlKey || e.metaKey || e.defaultPrevented || skip()) return;
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
    if (nested(e.target, e.deltaY)) return;
    const px = e.deltaMode === 1 ? e.deltaY * LINE : e.deltaMode === 2 ? e.deltaY * innerHeight * 0.9 : e.deltaY;
    e.preventDefault();
    if (!raf) target = mid = lead = scrollY;
    glide = null;
    const reach = innerHeight * AHEAD;
    target = clamp(Math.max(lead - reach, Math.min(lead + reach, target + px)));
    start();
  }, { passive: false });

  addEventListener("scroll", () => { if (raf && Math.abs(scrollY - expected) > 2) halt(); }, { passive: true });

  return {
    glide(top, seconds) {
      if (reduce.matches) { halt(); set(clamp(top)); return; }
      if (!raf) target = mid = lead = scrollY;
      glide = { from: lead, to: clamp(top), t0: performance.now(), dur: seconds };
      start();
    },
  };
}
