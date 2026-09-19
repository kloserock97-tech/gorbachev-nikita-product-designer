/* v43: лента для пальца. На телефоне и планшете карусель — обычная горизонтальная прокрутка с защёлкой
   (CSS scroll-snap): один свайп — одна карточка, соседняя выглядывает с края, инерцию и отскок даёт браузер.
   Это привычный жест; раньше ленту вёз только вертикальный скролл, свайп вбок не делал ничего.

   Вертикальная история при этом не ломается: обе оси связаны через номер карточки.
   • история доехала до карточки i → follow(i): лента сама перелистывается к ней;
   • человек перелистнул пальцем → onUserSettle(i): вызывающий переставляет прокрутку страницы на то же место.
   Пока палец на ленте (и пока она доезжает по инерции), история её не трогает. */

export type SwipeStrip = {
  follow(i: number): void;
  index(): number;
  refresh(): void;
  destroy(): void;
};

type Options = {
  items: () => HTMLElement[];
  /** лента сдвинулась: ближайшая карточка и доля пути 0…1 */
  onMove?: (index: number, fraction: number) => void;
  /** лента остановилась после жеста человека (свайп, Tab, колесо вбок) */
  onUserSettle?: (index: number) => void;
};

export function swipeStrip(strip: HTMLElement, opts: Options): SwipeStrip {
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let items = opts.items();
  let targets: number[] = [];
  let current = -1;
  let goal = -1;
  let auto = false; // ленту везёт история
  let touching = false;
  let timer = 0;

  const measure = () => {
    items = opts.items();
    const mid = strip.clientWidth / 2;
    targets = items.map((el) => el.offsetLeft + el.offsetWidth / 2 - mid);
  };
  const nearest = () => {
    const x = strip.scrollLeft;
    let best = 0;
    for (let i = 1; i < targets.length; i++) if (Math.abs(targets[i] - x) < Math.abs(targets[best] - x)) best = i;
    return best;
  };
  const paint = () => {
    const i = nearest();
    if (i !== current) {
      current = i;
      items.forEach((el, n) => el.classList.toggle("is-active", n === i));
    }
    const span = (targets[targets.length - 1] ?? 0) - (targets[0] ?? 0);
    opts.onMove?.(i, span > 0 ? Math.min(1, Math.max(0, (strip.scrollLeft - targets[0]) / span)) : 0);
  };
  /* остановка: scrollend, а где его нет (Safari) — тишина 160 мс. Один раз на одно движение. */
  let moving = false;
  const settle = () => {
    if (touching || !moving) return;
    moving = false;
    const byUser = !auto;
    auto = false;
    goal = nearest();
    if (byUser) opts.onUserSettle?.(goal);
  };
  const arm = () => {
    clearTimeout(timer);
    timer = window.setTimeout(settle, 160);
  };
  const onScroll = () => {
    moving = true;
    paint();
    arm();
  };
  const down = () => { touching = true; auto = false; clearTimeout(timer); };
  const up = () => { touching = false; arm(); };

  strip.addEventListener("scroll", onScroll, { passive: true });
  const onEnd = () => { clearTimeout(timer); settle(); };
  strip.addEventListener("scrollend", onEnd);
  strip.addEventListener("touchstart", down, { passive: true });
  strip.addEventListener("touchend", up, { passive: true });
  strip.addEventListener("touchcancel", up, { passive: true });
  measure();
  paint();

  return {
    follow(i) {
      if (touching || i === goal || !targets.length) return;
      goal = i;
      if (Math.abs(strip.scrollLeft - targets[i]) < 2) return;
      auto = true;
      strip.scrollTo({ left: targets[i], behavior: reduced ? "auto" : "smooth" });
    },
    index: () => Math.max(0, current),
    refresh() {
      const keep = Math.max(0, current);
      measure();
      if (targets.length) strip.scrollLeft = targets[Math.min(keep, targets.length - 1)];
      current = -1;
      paint();
    },
    destroy() {
      clearTimeout(timer);
      strip.removeEventListener("scroll", onScroll);
      strip.removeEventListener("scrollend", onEnd);
      strip.removeEventListener("touchstart", down);
      strip.removeEventListener("touchend", up);
      strip.removeEventListener("touchcancel", up);
    },
  };
}
