/* 23.10: окно «До / После» с заметками на странице кейса (глава «Решения»). Идея — карточка клиента в кейсе CRM
   с портфолио klinaeva: снимок по центру, по бокам заметки. Код и вёрстка свои.

   На странице две карточки, «До» и «После». Нажали — открывается окно во весь экран:
   · переключатель «До / После / Шторка» и галочка «О блоке» (серые заметки, только у «До»); мои комментарии видны
     всегда (26.10: галочку, которая их прятала, Никита попросил убрать);
   · заметка стоит на высоте своего места на снимке; навели на заметку или на это место — место обводится рамкой,
     остальные заметки притихают;
   · синие заметки с одним id есть в обоих состояниях: при переключении они переезжают туда, где правка сделана,
     и меняют текст «что было не так» на «что сделал».
   26.10, окно переделано: шапка — парящая стеклянная плашка (контент проходит под ней, размыт), фон — холст в точку
   с отсветом цвета кейса, у каждой заметки номер, тот же номер — меткой на снимке, как пин комментария в Figma,
   от заметки к её месту идёт линия-выноска (горит у активной). «Шторка» — оба снимка друг на друге, граница
   двигается мышью или пальцем; при открытии шторка сама проезжает, показывая, что её можно тянуть.
   Лента версий «Как менялся экран» убрана.
   На узком экране заметки идут списком под снимком по порядку сверху вниз; нажатие подсвечивает место.
   «Меньше движения» — заметки не едут, а встают сразу; шторка не проезжает сама.
   Данные лежат в блоке JSON рядом с карточками: модуль не знает о кейсе ничего, кроме разметки. */
import type { CaseCompare, CompareNote, CompareSide } from "../data/caseStory";
import { getLang } from "../i18n";
import { tidy } from "../lib/typograph";
import "./case-notes.css";

const BASE = import.meta.env.BASE_URL;
const esc = (s: string) => tidy(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const T = {
  before: { ru: "До", en: "Before" },
  after: { ru: "После", en: "After" },
  wipe: { ru: "Шторка", en: "Slider" },
  about: { ru: "О блоке", en: "About the block" },
  open: { ru: "Раскрыть", en: "Expand" },
  close: { ru: "Закрыть", en: "Close" },
  hintBefore: { ru: "Наведите на заметку или на место на экране, чтобы увидеть связь.", en: "Hover a note or a spot on the screen to see how they connect." },
  hintAfter: { ru: "Мои комментарии переехали туда, где правка сделана.", en: "My comments moved to where each fix landed." },
  hintTouch: { ru: "Нажмите на заметку, чтобы увидеть место на экране.", en: "Tap a note to see its spot on the screen." },
  hintWipe: { ru: "Тяните границу, чтобы сравнить первую версию и финал.", en: "Drag the edge to compare the first version with the final one." },
  handle: { ru: "Граница между «До» и «После»", en: "Edge between Before and After" },
};
const tr = (x: { ru: string; en: string }) => (getLang() === "ru" ? x.ru : x.en);
const ICON = {
  pen: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 16h3.2L15.6 7.6a1.6 1.6 0 0 0 0-2.3l-.9-.9a1.6 1.6 0 0 0-2.3 0L4 12.8V16Z"/><path d="m11.3 5.5 3.2 3.2"/></svg>',
  open: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M11.5 4.5h4v4M8.5 15.5h-4v-4M15.5 4.5 11 9M4.5 15.5 9 11"/></svg>',
  close: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="m5.5 5.5 9 9M14.5 5.5l-9 9"/></svg>',
  grip: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M8 6 4 10l4 4M12 6l4 4-4 4"/></svg>',
};
const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
/** [ЗАПОЛНИТЬ: …] и [проверить] — места, где нужны факты владельца: на странице они видны, чтобы их не пропустить */
export const marks = (html: string) => html.replace(/\[(ЗАПОЛНИТЬ|TO FILL|проверить|check)(:?)([^\]]*)\]/g, (_m, w, c, rest) => `<mark class="cn-todo">${w}${c}${rest}</mark>`);

/* ── разметка на странице ─────────────────────────────────────────────────── */
/* 26.10: снимок телефона (выше, чем шире) — в карточке стоит целиком по высоте на сцене, а не растягивается */
const card = (side: "before" | "after", s: CompareSide) => `<button type="button" class="cn-card cn-card--${side}${s.image.h > s.image.w ? " cn-card--tall" : ""}" data-cn-open="${side}">
    <span class="cn-card-shot"><img src="${BASE}${s.image.src}" alt="${esc(s.image.caption)}" width="${s.image.w}" height="${s.image.h}" loading="lazy" decoding="async"></span>
    <span class="cn-card-foot"><span><em>${tr(T[side])}</em><b>${esc(s.title)}</b></span><span class="cn-card-open">${ICON.open}${tr(T.open)}</span></span>
  </button>`;

/** inSection — блок стоит в своей главе (её заголовок уже назвал блок), своё название не нужно */
export function notesBlock(c: CaseCompare, inSection = false) {
  /* строки JSON проходят ту же типографику, что и остальной текст страницы; «</» не даст закрыть script раньше */
  const clean = (n: CompareNote) => ({ ...n, text: tidy(n.text), extra: n.extra ? tidy(n.extra) : undefined });
  const data = { ...c, before: { ...c.before, notes: c.before.notes.map(clean) }, after: { ...c.after, notes: c.after.notes.map(clean) } };
  return `<div class="cn" data-cn data-reveal>
    ${inSection ? "" : `<p class="cn-title">${esc(c.title)}</p>`}
    ${c.lead ? `<p class="cn-lead">${marks(esc(c.lead))}</p>` : ""}
    <div class="cn-cards">${card("before", c.before)}${card("after", c.after)}</div>
    <script type="application/json" class="cn-data">${JSON.stringify(data).replace(/</g, "\\u003c")}</script>
  </div>`;
}

/* ── окно ─────────────────────────────────────────────────────────────────── */
type View = "before" | "after" | "wipe";

function buildDialog(c: CaseCompare) {
  const dlg = document.createElement("dialog");
  dlg.className = "cn-dlg";
  dlg.setAttribute("aria-labelledby", "cn-dlg-title");
  dlg.innerHTML = `
    <header class="cn-bar">
      <h2 class="cn-dlg-title" id="cn-dlg-title"></h2>
      <div class="cn-seg" role="group">
        <i class="cn-seg-thumb" aria-hidden="true"></i>
        <button type="button" data-view="before">${tr(T.before)}</button>
        <button type="button" data-view="after">${tr(T.after)}</button>
        <button type="button" data-view="wipe">${tr(T.wipe)}</button>
      </div>
      <div class="cn-filters">
        <label class="cn-check cn-check--about"><input type="checkbox" data-f="about"><span>${tr(T.about)}</span></label>
      </div>
      <button type="button" class="cn-close" aria-label="${tr(T.close)}">${ICON.close}</button>
    </header>
    <div class="cn-scroll">
      <p class="cn-hint" aria-live="polite"></p>
      <div class="cn-stage">
        <svg class="cn-leads" aria-hidden="true"></svg>
        <div class="cn-col cn-col--left"></div>
        <div class="cn-shot">
          <img class="cn-img" alt="" draggable="false">
          <div class="cn-wipe" aria-hidden="true"><img alt="" draggable="false" src="${BASE}${c.after.image.src}"></div>
          <div class="cn-boxes" aria-hidden="true"></div>
          <div class="cn-pins" aria-hidden="true"></div>
          <button type="button" class="cn-handle" role="slider" aria-label="${tr(T.handle)}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="50"><i>${ICON.grip}</i></button>
          <span class="cn-tag cn-tag--l">${tr(T.before)}</span><span class="cn-tag cn-tag--r">${tr(T.after)}</span>
        </div>
        <div class="cn-col cn-col--right"></div>
      </div>
    </div>`;
  return dlg;
}

function mountOne(block: HTMLElement) {
  const raw = block.querySelector<HTMLScriptElement>(".cn-data")?.textContent;
  if (!raw) return () => {};
  const c = JSON.parse(raw) as CaseCompare;
  const dlg = buildDialog(c);
  /* окно живёт внутри статьи кейса: так ему достаются её цвета и шрифты */
  (block.closest(".cs") ?? document.body).append(dlg);
  const $ = <E extends Element = HTMLElement>(sel: string) => dlg.querySelector<E>(sel)!;
  const img = $<HTMLImageElement>(".cn-img");
  const shot = $(".cn-shot");
  const stage = $(".cn-stage");
  const leads = $<SVGSVGElement>(".cn-leads");
  const boxes = $(".cn-boxes");
  const pins = $(".cn-pins");
  const handle = $<HTMLButtonElement>(".cn-handle");
  const cols = { left: $(".cn-col--left"), right: $(".cn-col--right") };
  const title = $(".cn-dlg-title");
  const hint = $(".cn-hint");
  const about = $<HTMLInputElement>('[data-f="about"]');
  const narrow = matchMedia("(max-width: 900px)");
  const touch = matchMedia("(hover: none)");

  /* одна кнопка на заметку: синяя с тем же id в «После» — та же кнопка, она переезжает */
  const els = new Map<string, HTMLButtonElement>();
  const keyOf = (n: CompareNote) => `${n.kind}:${n.id}`;
  for (const n of [...c.before.notes, ...c.after.notes]) {
    if (els.has(keyOf(n))) continue;
    const b = document.createElement("button");
    b.type = "button";
    b.className = `cn-note cn-note--${n.kind}`;
    b.dataset.key = keyOf(n);
    els.set(keyOf(n), b);
  }

  let view: View = "before";
  let active = "";
  let num = new Map<string, number>();
  const sideOf = (v: View): CompareSide | null => (v === "before" ? c.before : v === "after" ? c.after : null);
  const visible = () => {
    const s = sideOf(view);
    if (!s) return [] as CompareNote[];
    return s.notes.filter((n) => n.kind === "mine" || (about.checked && view === "before"));
  };

  const fill = (b: HTMLButtonElement, n: CompareNote) => {
    const k = num.get(keyOf(n)) ?? 0;
    const html = `<i class="cn-num">${k}</i><span class="cn-note-text">${marks(esc(n.text))}${n.extra ? `<em>${marks(esc(n.extra))}</em>` : ""}</span>`;
    if (b.innerHTML === html) return;
    /* текст меняется, пока заметка едет: новый проявляется, а не выскакивает. Подмена сразу, иначе высота
       заметки поменяется уже после раскладки и соседи налезут */
    const swap = !!b.innerHTML && !reduced();
    b.innerHTML = html;
    if (swap) { b.classList.remove("is-swap"); void b.offsetWidth; b.classList.add("is-swap"); }
  };

  /* рамки мест и номера-метки на снимке: метка — у верхнего левого угла первого места */
  const drawMarks = (list: CompareNote[]) => {
    boxes.innerHTML = list.flatMap((n) => (n.rects ?? []).map((r) => `<i class="cn-box cn-box--${n.kind}" data-key="${keyOf(n)}" style="left:${r[0] * 100}%;top:${r[1] * 100}%;width:${r[2] * 100}%;height:${r[3] * 100}%"></i>`)).join("");
    /* метки у соседних мест не ложатся друг на друга: близкую сдвигаем вправо */
    const placed: [number, number][] = [];
    pins.innerHTML = list.map((n, i) => {
      const r = n.rects?.[0];
      if (!r) return "";
      let x = r[0] * 100;
      const y = r[1] * 100;
      while (placed.some(([px, py]) => Math.abs(px - x) < 2.6 && Math.abs(py - y) < 4)) x += 2.8;
      placed.push([x, y]);
      return `<i class="cn-pin cn-pin--${n.kind}" data-key="${keyOf(n)}" style="left:${x}%;top:${y}%;--d:${i * 40}ms">${num.get(keyOf(n))}</i>`;
    }).join("");
  };

  /* линии-выноски: от края заметки к её метке на снимке; перерисовываются, пока заметки едут на место */
  const drawLeads = () => {
    if (narrow.matches || view === "wipe") { leads.innerHTML = ""; return; }
    const sr = stage.getBoundingClientRect();
    leads.setAttribute("viewBox", `0 0 ${sr.width} ${sr.height}`);
    leads.setAttribute("width", String(sr.width));
    leads.setAttribute("height", String(sr.height));
    leads.innerHTML = [...pins.querySelectorAll<HTMLElement>(".cn-pin")].map((p) => {
      const b = els.get(p.dataset.key!);
      if (!b || b.hidden) return "";
      const br = b.getBoundingClientRect(), pr = p.getBoundingClientRect();
      const left = b.parentElement === cols.left;
      const x1 = (left ? br.right : br.left) - sr.left, y1 = br.top + Math.min(26, br.height / 2) - sr.top;
      const x2 = pr.left + pr.width / 2 - sr.left, y2 = pr.top + pr.height / 2 - sr.top;
      const mx = (x1 + x2) / 2;
      return `<path data-key="${p.dataset.key}" class="cn-lead cn-lead--${b.classList.contains("cn-note--mine") ? "mine" : "about"}" d="M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}"/><circle data-key="${p.dataset.key}" class="cn-lead-dot" cx="${x1}" cy="${y1}" r="3"/>`;
    }).join("");
    light(active);
  };
  let follow = 0;
  const followLeads = () => {
    cancelAnimationFrame(follow);
    const until = performance.now() + (reduced() ? 0 : 650);
    const step = () => { drawLeads(); if (performance.now() < until) follow = requestAnimationFrame(step); };
    step();
  };

  /* раскладка колонок: заметка встаёт напротив своего места, налезающие сдвигаются вниз */
  const layout = () => {
    const list = visible();
    /* номера — по месту на снимке: сверху вниз, слева направо */
    const ordered = [...list].sort((a, b) => { const ra = a.rects?.[0], rb = b.rects?.[0]; return (ra?.[1] ?? 1) - (rb?.[1] ?? 1) || (ra?.[0] ?? 0) - (rb?.[0] ?? 0); });
    num = new Map(ordered.map((n, i) => [keyOf(n), i + 1]));
    const wide = !narrow.matches;
    const h = img.clientHeight || 1;
    for (const side of ["left", "right"] as const) {
      const col = cols[side];
      const mineHere = wide ? list.filter((n) => n.side === side) : side === "left" ? list : [];
      /* на узком экране один список по порядку сверху вниз */
      const order = [...mineHere].sort((a, b) => (num.get(keyOf(a)) ?? 0) - (num.get(keyOf(b)) ?? 0));
      for (const n of order) {
        const b = els.get(keyOf(n))!;
        if (b.parentElement !== col) {
          /* переезд в другую колонку: стартует с места, где был, чтобы движение читалось */
          col.append(b);
          b.style.transition = "none";
        }
        fill(b, n);
        b.hidden = false;
      }
      if (!wide) { order.forEach((n) => { const b = els.get(keyOf(n))!; b.style.top = ""; col.append(b); }); continue; }
      let floor = 0;
      for (const n of order) {
        const b = els.get(keyOf(n))!;
        const r = n.rects?.[0];
        const want = r ? (r[1] + r[3] / 2) * h - b.offsetHeight / 2 : floor;
        const top = Math.max(0, floor, want);
        b.style.top = `${top}px`;
        floor = top + b.offsetHeight + 10;
      }
      col.style.minHeight = `${floor}px`;
    }
    const shown = new Set(list.map(keyOf));
    els.forEach((b, k) => { if (!shown.has(k)) b.hidden = true; });
    requestAnimationFrame(() => els.forEach((b) => { b.style.transition = ""; }));
    drawMarks(ordered);
    light(active);
    followLeads();
  };

  const light = (key: string) => {
    active = key;
    dlg.classList.toggle("has-active", !!key);
    els.forEach((b, k) => b.classList.toggle("is-active", k === key));
    dlg.querySelectorAll<Element>(".cn-box, .cn-pin, .cn-lead, .cn-lead-dot").forEach((x) => x.classList.toggle("is-active", (x as HTMLElement).dataset.key === key));
  };

  /* шторка: доля ширины, где проходит граница; «После» справа от неё */
  const setWipe = (x: number) => {
    const v = Math.min(100, Math.max(0, x));
    shot.style.setProperty("--wipe", `${v}%`);
    handle.setAttribute("aria-valuenow", String(Math.round(v)));
  };
  let sweep = 0;
  const show = (v: View) => {
    view = v;
    const s = sideOf(v) ?? c.before;
    title.textContent = v === "wipe" ? `${tidy(c.before.title)} → ${tidy(c.after.title)}` : tidy(s.title);
    img.src = BASE + s.image.src;
    img.alt = tidy(s.image.caption);
    img.width = s.image.w;
    img.height = s.image.h;
    const order: View[] = ["before", "after", "wipe"];
    dlg.querySelectorAll<HTMLButtonElement>("[data-view]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.view === v)));
    dlg.style.setProperty("--seg", String(order.indexOf(v)));
    dlg.classList.toggle("is-after", v === "after");
    dlg.classList.toggle("is-wipe", v === "wipe");
    dlg.classList.toggle("is-tall", s.image.h > s.image.w);
    hint.innerHTML = v === "wipe" ? tr(T.hintWipe) : touch.matches ? tr(T.hintTouch) : tr(v === "after" ? T.hintAfter : T.hintBefore);
    cancelAnimationFrame(sweep);
    if (v === "wipe") {
      /* шторка сама проезжает от «После» к середине — видно, что её можно тянуть */
      if (reduced()) setWipe(50);
      else {
        const t0 = performance.now();
        const run = (now: number) => {
          const k = Math.min(1, (now - t0) / 1100);
          const e = 1 - Math.pow(1 - k, 3);
          setWipe(88 - 38 * e + Math.sin(k * Math.PI) * -12);
          if (k < 1) sweep = requestAnimationFrame(run);
        };
        sweep = requestAnimationFrame(run);
      }
    }
    light("");
    if (img.complete) layout(); else img.addEventListener("load", layout, { once: true });
  };

  /* наведение на снимок: подсвечивается самое мелкое место под курсором — оно точнее */
  const onShot = (e: PointerEvent) => {
    if (e.pointerType !== "mouse" || view === "wipe") return;
    const r = img.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
    let best = "", area = Infinity;
    for (const n of visible()) for (const q of n.rects ?? []) {
      if (x >= q[0] && x <= q[0] + q[2] && y >= q[1] && y <= q[1] + q[3] && q[2] * q[3] < area) { area = q[2] * q[3]; best = keyOf(n); }
    }
    if (best !== active) light(best);
  };

  const ac = new AbortController();
  const on = <K extends keyof HTMLElementEventMap>(el: EventTarget, ev: K, fn: (e: HTMLElementEventMap[K]) => void) => el.addEventListener(ev, fn as EventListener, { signal: ac.signal });

  block.querySelectorAll<HTMLButtonElement>("[data-cn-open]").forEach((b) => on(b, "click", () => {
    show(b.dataset.cnOpen as View);
    dlg.showModal();
    /* размеры известны только в открытом окне */
    requestAnimationFrame(layout);
  }));
  on(dlg, "click", (e) => {
    const el = e.target as HTMLElement;
    const v = el.closest<HTMLElement>("[data-view]");
    if (v) { show(v.dataset.view as View); return; }
    if (el.closest(".cn-close") || el === dlg) { dlg.close(); return; }
    const note = el.closest<HTMLButtonElement>(".cn-note");
    if (note) {
      light(note.dataset.key === active && touch.matches ? "" : note.dataset.key!);
      /* на узком экране снимок выше списка: доехать до него, чтобы рамку было видно */
      if (narrow.matches && active) shot.scrollIntoView({ block: "nearest", behavior: reduced() ? "auto" : "smooth" });
    }
  });
  on(dlg, "change", () => layout());
  on(dlg, "pointerover", (e) => { const n = (e.target as HTMLElement).closest<HTMLElement>(".cn-note"); if (n && (e as PointerEvent).pointerType === "mouse") light(n.dataset.key!); });
  on(dlg, "pointerout", (e) => { const n = (e.target as HTMLElement).closest<HTMLElement>(".cn-note"); if (n && (e as PointerEvent).pointerType === "mouse" && !n.contains((e as PointerEvent).relatedTarget as Node)) light(""); });
  on(dlg, "focusin", (e) => { const n = (e.target as HTMLElement).closest<HTMLElement>(".cn-note"); if (n) light(n.dataset.key!); });
  on(shot, "pointermove", onShot);
  on(shot, "pointerleave", () => { if (view !== "wipe") light(""); });
  /* шторку тянут за любое место снимка */
  let drag = false;
  const wipeAt = (e: PointerEvent) => { const r = shot.getBoundingClientRect(); setWipe(((e.clientX - r.left) / r.width) * 100); };
  on(shot, "pointerdown", (e) => { if (view !== "wipe") return; cancelAnimationFrame(sweep); drag = true; shot.setPointerCapture(e.pointerId); wipeAt(e); });
  on(shot, "pointermove", (e) => { if (drag) wipeAt(e); });
  on(shot, "pointerup", () => { drag = false; });
  on(shot, "pointercancel", () => { drag = false; });
  on(handle, "keydown", (e) => {
    const now = Number(handle.getAttribute("aria-valuenow"));
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") { e.preventDefault(); cancelAnimationFrame(sweep); setWipe(now + (e.key === "ArrowLeft" ? -5 : 5)); }
  });
  /* колесо внутри окна не уходит к плавной прокрутке страницы за ним */
  on(dlg, "wheel", (e) => e.stopPropagation());
  on($(".cn-scroll"), "scroll", () => { if (!narrow.matches) drawLeads(); });
  const ro = new ResizeObserver(() => { if (dlg.open) layout(); });
  ro.observe(img);
  narrow.addEventListener("change", layout, { signal: ac.signal });

  return () => { ac.abort(); ro.disconnect(); cancelAnimationFrame(follow); cancelAnimationFrame(sweep); if (dlg.open) dlg.close(); dlg.remove(); };
}

export function mountNotes(root: HTMLElement) {
  const stops = [...root.querySelectorAll<HTMLElement>("[data-cn]")].map(mountOne);
  return () => stops.forEach((f) => f());
}
