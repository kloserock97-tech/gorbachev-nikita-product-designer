/* Мягкое колесо для прокручиваемого блока (страница кейса).

   Почему так. Менять скорость или направление прокрутки нельзя: NN/g называет это scrolljacking, люди
   принимают такое поведение за поломку. Поэтому расстояние остаётся 1:1 — один щелчок колеса проезжает
   ровно столько же, сколько в браузере, — сглаживается только рывок: позиция догоняет цель по экспоненте.
   Приём тот же, что у Lenis (цель + догоняющая позиция, настоящий scrollTop, никаких transform), код свой.

   Что остаётся родным: тачпад (у него своя инерция, второе сглаживание даёт «резину»), палец, клавиатура,
   полоса прокрутки, поиск по странице, Ctrl+колесо (масштаб), вложенные прокрутки. Если страница прокрутилась
   не нами (клавиша, полоса, scrollTo), догонялка сразу подхватывает новое место.
   prefers-reduced-motion — сглаживания нет совсем. */

import { SCROLL_LAMBDA as LAMBDA } from "../scrollFeel";

const LINE = 100 / 3; // пикселей в «строке» колеса (deltaMode = 1)

export type Smoother = { to: (top: number) => void; stop: () => void };

/** scroller — блок с прокруткой или window (лёгкая версия главной); skip — когда колесо занято другим */
export function smoothWheel(scroller: HTMLElement | Window, skip?: () => boolean): Smoother {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)");
  const win = scroller === window;
  const root = document.scrollingElement as HTMLElement;
  const box = win ? root : (scroller as HTMLElement);
  const getTop = () => (win ? scrollY : box.scrollTop);
  const setTop = (v: number) => { if (win) scrollTo({ top: v, behavior: "instant" as ScrollBehavior }); else box.scrollTop = v; };
  const view = () => (win ? innerHeight : box.clientHeight);
  let target = getTop();
  let current = target;
  let expected = -1;
  let raf = 0;
  let last = 0;

  const max = () => Math.max(0, box.scrollHeight - view());
  const clamp = (v: number) => Math.min(max(), Math.max(0, v));

  const tick = (now: number) => {
    /* шаг считается от настоящего времени: на слабом устройстве с редкими кадрами движение занимает те же ~0,5 с */
    const dt = Math.min(1, (now - last) / 1000);
    last = now;
    current += (target - current) * (1 - Math.exp(-dt * LAMBDA));
    if (Math.abs(target - current) < 0.4) current = target;
    expected = current;
    setTop(current);
    raf = current === target ? 0 : requestAnimationFrame(tick);
  };
  const start = () => {
    if (raf) return;
    last = performance.now();
    raf = requestAnimationFrame(tick);
  };
  const halt = () => {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    target = current = getTop();
  };

  /* под курсором есть своя прокрутка, и ей ещё есть куда ехать — не мешаем */
  const nested = (from: EventTarget | null, dy: number) => {
    for (let el = from as HTMLElement | null; el && el !== box; el = el.parentElement) {
      if (el === document.body || el.scrollHeight <= el.clientHeight + 1) continue;
      const oy = getComputedStyle(el).overflowY;
      if (oy !== "auto" && oy !== "scroll") continue;
      if (dy > 0 ? el.scrollTop + el.clientHeight < el.scrollHeight - 1 : el.scrollTop > 0) return true;
    }
    return false;
  };

  const onWheel = (e: WheelEvent) => {
    if (reduce.matches || e.ctrlKey || e.metaKey || e.defaultPrevented || skip?.()) return;
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
    /* тачпад шлёт мелкие пиксельные дельты с собственной инерцией */
    if (e.deltaMode === 0 && Math.abs(e.deltaY) < 40) { if (raf) halt(); return; }
    if (nested(e.target, e.deltaY)) return;
    const px = e.deltaMode === 1 ? e.deltaY * LINE : e.deltaMode === 2 ? e.deltaY * view() * 0.9 : e.deltaY;
    e.preventDefault();
    if (!raf) target = current = getTop();
    target = clamp(target + px);
    start();
  };

  /* прокрутили не мы — клавиатура, полоса, чужой scrollTo: подхватываем место и не спорим */
  const onScroll = () => {
    if (raf && Math.abs(getTop() - expected) > 2) halt();
  };

  scroller.addEventListener("wheel", onWheel as EventListener, { passive: false });
  scroller.addEventListener("scroll", onScroll, { passive: true });

  return {
    /** доехать до места тем же движением, что и колесо; издалека — подлететь и мягко сесть */
    to(top: number) {
      const goal = clamp(top);
      if (reduce.matches) { halt(); setTop(goal); return; }
      if (!raf) target = current = getTop();
      const reach = view() * 1.2;
      if (Math.abs(goal - current) > reach) {
        current = goal + (current > goal ? reach : -reach);
        expected = current;
        setTop(current);
      }
      target = goal;
      start();
    },
    stop() {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      scroller.removeEventListener("wheel", onWheel as EventListener);
      scroller.removeEventListener("scroll", onScroll);
    },
  };
}
