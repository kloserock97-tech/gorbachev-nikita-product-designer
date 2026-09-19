/* Мягкое колесо для прокручиваемого блока (страница кейса).

   Почему так. Менять скорость или направление прокрутки нельзя: NN/g называет это scrolljacking, люди
   принимают такое поведение за поломку. Поэтому расстояние остаётся 1:1 — один щелчок колеса проезжает
   ровно столько же, сколько в браузере, — сглаживается только рывок: позиция догоняет цель по экспоненте.
   Приём тот же, что у Lenis (цель + догоняющая позиция, настоящий scrollTop, никаких transform), код свой.

   Что остаётся родным: тачпад (у него своя инерция, второе сглаживание даёт «резину»), палец, клавиатура,
   полоса прокрутки, поиск по странице, Ctrl+колесо (масштаб), вложенные прокрутки. Если страница прокрутилась
   не нами (клавиша, полоса, scrollTo), догонялка сразу подхватывает новое место.
   prefers-reduced-motion — сглаживания нет совсем. */

const LAMBDA = 6.5; // 1/с: за ~0,45 с позиция проходит 95 % пути
const LINE = 100 / 3; // пикселей в «строке» колеса (deltaMode = 1)

export type Smoother = { to: (top: number) => void; stop: () => void };

export function smoothWheel(scroller: HTMLElement): Smoother {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)");
  let target = scroller.scrollTop;
  let current = target;
  let expected = -1;
  let raf = 0;
  let last = 0;

  const max = () => Math.max(0, scroller.scrollHeight - scroller.clientHeight);
  const clamp = (v: number) => Math.min(max(), Math.max(0, v));

  const tick = (now: number) => {
    /* шаг считается от настоящего времени: на слабом устройстве с редкими кадрами движение занимает те же ~0,5 с */
    const dt = Math.min(1, (now - last) / 1000);
    last = now;
    current += (target - current) * (1 - Math.exp(-dt * LAMBDA));
    if (Math.abs(target - current) < 0.4) current = target;
    expected = current;
    scroller.scrollTop = current;
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
    target = current = scroller.scrollTop;
  };

  /* под курсором есть своя прокрутка, и ей ещё есть куда ехать — не мешаем */
  const nested = (from: EventTarget | null, dy: number) => {
    for (let el = from as HTMLElement | null; el && el !== scroller; el = el.parentElement) {
      if (el.scrollHeight <= el.clientHeight + 1) continue;
      const oy = getComputedStyle(el).overflowY;
      if (oy !== "auto" && oy !== "scroll") continue;
      if (dy > 0 ? el.scrollTop + el.clientHeight < el.scrollHeight - 1 : el.scrollTop > 0) return true;
    }
    return false;
  };

  const onWheel = (e: WheelEvent) => {
    if (reduce.matches || e.ctrlKey || e.metaKey || e.defaultPrevented) return;
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
    /* тачпад шлёт мелкие пиксельные дельты с собственной инерцией */
    if (e.deltaMode === 0 && Math.abs(e.deltaY) < 40) { if (raf) halt(); return; }
    if (nested(e.target, e.deltaY)) return;
    const px = e.deltaMode === 1 ? e.deltaY * LINE : e.deltaMode === 2 ? e.deltaY * scroller.clientHeight * 0.9 : e.deltaY;
    e.preventDefault();
    if (!raf) target = current = scroller.scrollTop;
    target = clamp(target + px);
    start();
  };

  /* прокрутили не мы — клавиатура, полоса, чужой scrollTo: подхватываем место и не спорим */
  const onScroll = () => {
    if (raf && Math.abs(scroller.scrollTop - expected) > 2) halt();
  };

  scroller.addEventListener("wheel", onWheel, { passive: false });
  scroller.addEventListener("scroll", onScroll, { passive: true });

  return {
    /** доехать до места тем же движением, что и колесо; издалека — подлететь и мягко сесть */
    to(top: number) {
      const goal = clamp(top);
      if (reduce.matches) { halt(); scroller.scrollTop = goal; return; }
      if (!raf) target = current = scroller.scrollTop;
      const reach = scroller.clientHeight * 1.2;
      if (Math.abs(goal - current) > reach) {
        current = goal + (current > goal ? reach : -reach);
        expected = current;
        scroller.scrollTop = current;
      }
      target = goal;
      start();
    },
    stop() {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      scroller.removeEventListener("wheel", onWheel);
      scroller.removeEventListener("scroll", onScroll);
    },
  };
}
