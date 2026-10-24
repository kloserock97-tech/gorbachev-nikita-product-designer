/* 24.10: сцена для экранов GRIF из Figma (render.ts). Общая для прототипа (три сценария) и для демо решений.
   Сцена держит один экран; смена экрана — короткая смена прозрачности, как переход в продукте. Внутри экрана
   сценарий находит слой по имени из Figma или по тексту, прячет и проявляет части ответа по очереди, печатает
   в поле ввода. Экран выше окна (Память, 1176 px) прокручивается внутри сцены. */
import { byText, ensureStyles, layer, renderScreen, type ScreenKey } from "./render";
import "./stage.css";

export type Stage = ReturnType<typeof createStage>;

export function createStage(root: HTMLElement, opts: { base: string; calm: boolean }) {
  ensureStyles(opts.base);
  root.classList.add("g2-stage");
  let cur: HTMLElement | null = null;
  let timers: number[] = [];

  const clear = () => { timers.forEach(clearTimeout); timers = []; };
  const later = (ms: number, fn: () => void) => { timers.push(window.setTimeout(fn, opts.calm ? 0 : ms)); };

  function show(key: ScreenKey, instant = false) {
    clear();
    const el = renderScreen(key);
    root.append(el);
    const old = cur;
    if (old && !instant && !opts.calm) {
      el.classList.add("g2-in");
      old.classList.add("g2-out");
      window.setTimeout(() => old.remove(), 240);
    } else old?.remove();
    cur = el;
    root.scrollTop = 0;
    return el;
  }

  /** ближайший предок-«кнопка» текстового слоя: up — на сколько уровней подняться от текста */
  function hot(text: string, up = 1, within?: HTMLElement | null) {
    let el = byText(within ?? cur!, text);
    for (let i = 0; i < up && el && el.parentElement && !el.parentElement.classList.contains("g2"); i++) el = el.parentElement as HTMLElement;
    return el;
  }

  /** дети слоя появляются по очереди (ответ агента собирается на глазах) */
  function reveal(parent: HTMLElement | null, gap = 420, from = 0) {
    if (!parent) return 0;
    const kids = [...parent.children] as HTMLElement[];
    kids.forEach((k, i) => {
      if (i < from) return;
      k.classList.add("g2-hide");
      later(gap * (i - from + 1), () => { k.classList.remove("g2-hide"); k.classList.add("g2-rise"); });
    });
    return gap * (kids.length - from + 1);
  }

  /** печать в текстовый слой; resolve, когда допечатано */
  function type(el: HTMLElement | null, text: string, speed = 32) {
    return new Promise<void>((res) => {
      if (!el) return res();
      if (opts.calm) { el.textContent = text; return res(); }
      el.textContent = "";
      let i = 0;
      const tick = () => { el.textContent = text.slice(0, ++i); if (i < text.length) timers.push(window.setTimeout(tick, speed)); else res(); };
      tick();
    });
  }

  /** обратный отсчёт в первом текстовом слое внутри within, который кончается на «N с» («Отменить · 8 с») */
  function countdown(within: HTMLElement | null) {
    if (!within || opts.calm) return;
    const el = [...within.querySelectorAll<HTMLElement>("div")].find((n) => !n.children.length && /\d+\s?с$/.test(n.textContent?.trim() ?? ""));
    const m = el?.textContent?.trim().match(/^(.*?)(\d+)(\s?с)$/);
    if (!el || !m) return;
    const from = +m[2];
    for (let i = 1; i < from; i++) later(i * 1000, () => { el.textContent = `${m[1]}${from - i}${m[3]}`; });
  }

  return {
    show,
    hot,
    reveal,
    type,
    countdown,
    later,
    clear,
    get el() { return cur!; },
    find: (name: string, contains = false) => (cur ? layer(cur, name, contains) : null),
    text: (t: string, within?: HTMLElement | null) => byText(within ?? cur!, t),
    destroy() { clear(); root.textContent = ""; root.classList.remove("g2-stage"); cur = null; },
  };
}
