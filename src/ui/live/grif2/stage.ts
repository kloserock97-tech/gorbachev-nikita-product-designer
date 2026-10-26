/* 24.10: сцена для экранов GRIF из Figma (render.ts). Общая для прототипа (три сценария) и для демо решений.
   Сцена держит один экран; смена экрана — короткая смена прозрачности, как переход в продукте. Внутри экрана
   сценарий находит слой по имени из Figma или по тексту, прячет и проявляет части ответа по очереди, печатает
   в поле ввода. Экран выше окна (Память, 1176 px) прокручивается внутри сцены. */
import { byText, grif, layer, type Renderer } from "./render";
import "./stage.css";

export type Stage = ReturnType<typeof createStage>;

/* 26.10: сцена общая для всех кейсов: r — экраны кейса (createRenderer), по умолчанию GRIF; liven — своё оживление
   экранов кейса поверх общего (имена слоёв у каждого продукта свои) */
export function createStage(root: HTMLElement, opts: { base: string; calm: boolean; r?: Renderer; liven?: (el: HTMLElement, key: string, instant: boolean) => void; fix?: (el: HTMLElement, key: string) => void }) {
  const r = opts.r ?? grif;
  r.ensureStyles(opts.base);
  root.classList.add("g2-stage");
  let cur: HTMLElement | null = null;
  let timers: number[] = [];

  const clear = () => { timers.forEach(clearTimeout); timers = []; };
  const later = (ms: number, fn: () => void) => { timers.push(window.setTimeout(fn, opts.calm ? 0 : ms)); };

  function show(key: string, instant = false) {
    clear();
    const el = r.renderScreen(key);
    root.append(el);
    const old = cur;
    if (old && !instant && !opts.calm) {
      el.classList.add("g2-in");
      old.classList.add("g2-out");
      window.setTimeout(() => old.remove(), 240);
    } else old?.remove();
    cur = el;
    root.scrollTop = 0;
    /* fix — поправки вида экрана (например, обрезка текста по высоте прописных): работают и при «меньше движения» */
    opts.fix?.(el, key);
    liven(el, key, instant);
    return el;
  }

  /* 24.10: экран живёт и без нажатий — то, что в продукте движется, движется и здесь: спиннеры крутятся, полоски
     прогресса дорастают, точка статуса и персонаж «дышат», строка текущего шага мерцает. На входе экрана его части
     появляются лесенкой (30–60 мс), а не все разом. «Меньше движения» — без этого. */
  function liven(el: HTMLElement, key: string, instant: boolean) {
    if (opts.calm) return;
    opts.liven?.(el, key, instant);
    const all = (sel: string) => [...el.querySelectorAll<HTMLElement>(sel)];
    all('[data-n="icon/spin"]').forEach((n) => n.classList.add("g2-spin"));
    all('[data-n="Progress"], [data-n="Long task"] > div > [data-n="Rectangle"]').forEach((n) => n.classList.add("g2-grow"));
    all('[data-n="Agent status"] > [data-n="Ellipse"]').forEach((n) => n.classList.add("g2-pulse"));
    all('[data-n="Character · Working"]').forEach((n) => n.classList.add("g2-breathe"));
    all('[data-n="Character · Listening"]').forEach((n) => n.classList.add("g2-breathe-slow"));
    all('[data-n="Character · Idle"]').forEach((n) => n.classList.add("g2-float"));
    /* текущий шаг: строка рядом со спиннером */
    all('[data-n="icon/spin"]').forEach((sp) => [...(sp.parentElement?.children ?? [])].forEach((c) => {
      if (c !== sp && c.tagName === "DIV" && !c.children.length && (c.textContent ?? "").length > 6) c.classList.add("g2-shimmer");
    }));
    all('[data-n="Working status"] div').forEach((n) => { if (!n.children.length && (n.textContent ?? "").length > 10) n.classList.add("g2-shimmer"); });
    /* 26.10: рамка поля ввода переливается; в пустом поле мигает каретка; ожидание решения и синхронизация — блик по тексту */
    all('[data-n="Composer v3"] > [data-n^="Glow"]').forEach((n, i) => { n.style.animationDelay = `${-i * 1.9}s`; n.style.animationDuration = `${6 + i * 1.3}s`; n.classList.add("g2-flow"); });
    all('[data-n="Composer v3"] [data-n="Placeholder"]').forEach((n) => n.classList.add("g2-caret"));
    all('[data-n="Presence"] > div').forEach((n) => { if (!n.children.length && /Жду|Waiting/.test(n.textContent ?? "")) n.classList.add("g2-sheen"); });
    all('[data-n="Sync status"] div').forEach((n) => { if (!n.children.length && (n.textContent ?? "").length > 12) n.classList.add("g2-sheen"); });
    if (instant) return;
    const stagger = (list: (HTMLElement | null | undefined)[], step = 50, from = 0, cls = "g2-rise") =>
      list.filter(Boolean).forEach((n, i) => { n!.style.animationDelay = `${from + i * step}ms`; n!.classList.add(cls); });
    const kids = (sel: string) => [...(el.querySelector(sel)?.children ?? [])] as HTMLElement[];
    if (key === "new") {
      /* приветствие проявляется словами */
      const hello = [...el.querySelectorAll<HTMLElement>('[data-n="Greeting row"] div')].find((n) => !n.children.length && (n.textContent ?? "").length > 6);
      stream(hello ?? null, 120, 70);
    }
    if (key === "new") stagger([el.querySelector<HTMLElement>('[data-n="Greeting row"]'), el.querySelector<HTMLElement>('[data-n="Composer v3"]'), ...kids('[data-n="Prompt buttons"]')], 60, 80);
    if (key === "feed" || key === "feedRun" || key === "feedEmpty") stagger(all('[data-n="Main Container"] [data-n^="Group"] > [data-n^="Row"]'), 35, 60);
    if (key === "feedRun") stagger(kids('[data-n="Steps"]'), 260, 200), all('[data-n="Steps"] [data-n="icon/okc"]').forEach((n, i) => { n.style.animationDelay = `${300 + i * 260}ms`; n.classList.add("g2-pop"); });
    if (key === "memory" || key === "forget") stagger([...kids('[data-n="Recently remembered"]'), ...kids('[data-n="Dossier grid"]')], 45, 60);
    if (key.startsWith("onb")) {
      /* знакомство: персонаж выходит и покачивается, крыло за ним проявляется медленно */
      all('[data-n="Character · знакомство"]').forEach((n) => n.classList.add("g2-hello"));
      all('[data-n="Meet hero"] > i').forEach((n) => n.classList.add("g2-fade-slow"));
      /* шкала «Знакомство · n из 5»: заполненные сегменты дорастают */
      all('[data-n="Intro progress"] div').forEach((n) => { if (n.offsetHeight > 0 && n.offsetHeight <= 4 && n.offsetWidth > 4 && !n.children.length) n.classList.add("g2-grow"); });
      /* чек-лист итога: галочки по очереди */
      all('[data-n="Intro checklist"] i').forEach((n, i) => { n.style.animationDelay = `${500 + i * 220}ms`; n.classList.add("g2-pop"); });
    }
  }

  /** кольцо-подсказка отдельным слоем поверх экрана: родители слоя в Figma обрезают содержимое, кольцо на самом
      слое срезалось бы по их краю. Координаты — сумма offset* до корня экрана (не зависят от zoom и transform) */
  function mark(target: HTMLElement | null) {
    cur?.querySelectorAll(".g2-mark").forEach((n) => n.remove());
    if (!target || !cur) return;
    let x = 0, y = 0;
    for (let n: HTMLElement | null = target; n && n !== cur; n = n.offsetParent as HTMLElement | null) { x += n.offsetLeft; y += n.offsetTop; }
    const k = parseFloat(getComputedStyle(root).getPropertyValue("--dd-k")) || 1 / (parseFloat(root.style.zoom) || 1);
    const pad = 5 * k;
    const r = parseFloat(getComputedStyle(target).borderTopLeftRadius) || 8;
    const m = document.createElement("i");
    m.className = "g2-mark";
    m.style.cssText = `left:${x - pad}px;top:${y - pad}px;width:${target.offsetWidth + pad * 2}px;height:${target.offsetHeight + pad * 2}px;--k:${k};border-radius:${r + pad}px`;
    cur.append(m);
    pan(m);
    return m;
  }

  /* телефон: окно движка листается вбок (.pt-screen.is-pan) — довозим его до подсказки, как в Community */
  function pan(el: HTMLElement) {
    const scr = root.parentElement;
    if (!scr || !scr.classList.contains("is-pan")) return;
    const a = el.getBoundingClientRect();
    const b = scr.getBoundingClientRect();
    if (a.left >= b.left + 6 && a.right <= b.right - 6) return;
    const left = a.width > b.width ? scr.scrollLeft + a.left - b.left - 8 : scr.scrollLeft + (a.left + a.right) / 2 - (b.left + b.right) / 2;
    scr.scrollTo({ left, behavior: opts.calm ? "auto" : "smooth" });
  }

  /** текст появляется словами, как стриминг ответа: каждое слово проявляется из размытия (26.10 — раньше просто
      дописывалось). С момента at; возвращает, сколько длится. Слова — span с задержкой анимации, без таймеров */
  function stream(el: HTMLElement | null, at = 0, gap = 40) {
    if (!el || opts.calm) return 0;
    const parts = (el.textContent ?? "").split(/(\s+)/);
    el.textContent = "";
    let i = 0;
    for (const w of parts) {
      if (!w) continue;
      if (/^\s+$/.test(w)) { el.append(w); continue; }
      const s = document.createElement("span");
      s.className = "g2-w";
      s.textContent = w;
      s.style.animationDelay = `${at + i++ * gap}ms`;
      el.append(s);
    }
    return i * gap;
  }

  /** ближайший предок-«кнопка» текстового слоя: up — на сколько уровней подняться от текста */
  function hot(text: string, up = 1, within?: HTMLElement | null) {
    let el = byText(within ?? cur!, text);
    for (let i = 0; i < up && el && el.parentElement && !el.parentElement.classList.contains("g2"); i++) el = el.parentElement as HTMLElement;
    return el;
  }

  /** дети слоя появляются по очереди (ответ агента собирается на глазах) */
  /** дети слоя появляются по очереди; onShow(kid, at) — что сделать с частью к моменту at и сколько ещё ждать
      до следующей (часть печатается словами — следующая ждёт конца печати). Возвращает общую длительность */
  function reveal(parent: HTMLElement | null, gap = 420, from = 0, onShow?: (kid: HTMLElement, at: number) => number) {
    if (!parent) return 0;
    const kids = ([...parent.children] as HTMLElement[]).slice(from);
    kids.forEach((k) => k.classList.add("g2-hide"));
    let t = 0;
    for (const k of kids) {
      t += gap;
      const extra = onShow ? onShow(k, t) : 0;
      later(t, () => { k.classList.remove("g2-hide"); k.classList.add("g2-rise"); });
      t += extra;
    }
    return t + gap;
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
    mark,
    stream,
    clear,
    get el() { return cur!; },
    find: (name: string, contains = false) => (cur ? layer(cur, name, contains) : null),
    text: (t: string, within?: HTMLElement | null) => byText(within ?? cur!, t),
    destroy() { clear(); root.textContent = ""; root.classList.remove("g2-stage"); cur = null; },
  };
}
