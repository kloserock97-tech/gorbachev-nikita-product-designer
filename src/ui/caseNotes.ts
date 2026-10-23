/* 23.10: окно «До / После» с заметками на странице кейса (глава «Решения»). Идея — карточка клиента в кейсе CRM
   с портфолио klinaeva: снимок по центру, по бокам заметки. Код и вёрстка свои.

   На странице две карточки, «До» и «После». Нажали — открывается окно во весь экран:
   · переключатель «До / После» и галочки «О блоке» (серые заметки, только у «До») и «Мои комментарии» (синие);
   · заметка стоит на высоте своего места на снимке; навели на заметку или на это место — место обводится рамкой,
     остальные заметки притихают;
   · синие заметки с одним id есть в обоих состояниях: при переключении они переезжают туда, где правка сделана,
     и меняют текст «что было не так» на «что сделал»;
   · внизу лента версий экрана: крайние открывают «До» и «После», средние — просто снимок без заметок.
   На узком экране заметки идут списком под снимком по порядку сверху вниз; нажатие подсвечивает место.
   «Меньше движения» — заметки не едут, а встают сразу.
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
  about: { ru: "О блоке", en: "About the block" },
  mine: { ru: "Мои комментарии", en: "My comments" },
  open: { ru: "Раскрыть", en: "Expand" },
  close: { ru: "Закрыть", en: "Close" },
  hintBefore: { ru: "Наведите на заметку или на место на экране, чтобы увидеть связь.", en: "Hover a note or a spot on the screen to see how they connect." },
  hintAfter: { ru: "Мои комментарии переехали туда, где правка сделана.", en: "My comments moved to where each fix landed." },
  hintTouch: { ru: "Нажмите на заметку, чтобы увидеть место на экране.", en: "Tap a note to see its spot on the screen." },
  versions: { ru: "Как менялся экран", en: "How the screen changed" },
  version: { ru: "Промежуточная версия, без заметок", en: "An in-between version, no notes" },
  todo: { ru: "Нужны данные", en: "Data needed" },
};
const tr = (x: { ru: string; en: string }) => (getLang() === "ru" ? x.ru : x.en);
const ICON = {
  pen: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 16h3.2L15.6 7.6a1.6 1.6 0 0 0 0-2.3l-.9-.9a1.6 1.6 0 0 0-2.3 0L4 12.8V16Z"/><path d="m11.3 5.5 3.2 3.2"/></svg>',
  open: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M11.5 4.5h4v4M8.5 15.5h-4v-4M15.5 4.5 11 9M4.5 15.5 9 11"/></svg>',
  close: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="m5.5 5.5 9 9M14.5 5.5l-9 9"/></svg>',
};
const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
/** [ЗАПОЛНИТЬ: …] и [проверить] — места, где нужны факты владельца: на странице они видны, чтобы их не пропустить */
export const marks = (html: string) => html.replace(/\[(ЗАПОЛНИТЬ|TO FILL|проверить|check)(:?)([^\]]*)\]/g, (_m, w, c, rest) => `<mark class="cn-todo">${w}${c}${rest}</mark>`);

/* ── разметка на странице ─────────────────────────────────────────────────── */
const card = (side: "before" | "after", s: CompareSide) => `<button type="button" class="cn-card cn-card--${side}" data-cn-open="${side}">
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
type View = "before" | "after" | number;

function buildDialog(c: CaseCompare) {
  const dlg = document.createElement("dialog");
  dlg.className = "cn-dlg";
  dlg.setAttribute("aria-labelledby", "cn-dlg-title");
  const versions = c.versions ?? [];
  dlg.innerHTML = `
    <header class="cn-bar">
      <h2 class="cn-dlg-title" id="cn-dlg-title"></h2>
      <div class="cn-seg" role="group">
        <button type="button" data-view="before">${tr(T.before)}</button>
        <button type="button" data-view="after">${tr(T.after)}</button>
      </div>
      <div class="cn-filters">
        <label class="cn-check cn-check--about"><input type="checkbox" data-f="about"><span>${tr(T.about)}</span></label>
        <label class="cn-check cn-check--mine"><input type="checkbox" data-f="mine" checked><span><i>${ICON.pen}</i>${tr(T.mine)}</span></label>
      </div>
      <button type="button" class="cn-close" aria-label="${tr(T.close)}">${ICON.close}</button>
    </header>
    <div class="cn-scroll">
      <p class="cn-hint" aria-live="polite"></p>
      <div class="cn-stage">
        <div class="cn-col cn-col--left"></div>
        <div class="cn-shot"><img alt="" draggable="false"><div class="cn-boxes" aria-hidden="true"></div></div>
        <div class="cn-col cn-col--right"></div>
      </div>
      ${versions.length ? `<div class="cn-versions"><p class="cn-mini">${tr(T.versions)}</p><ol>${versions.map((v, k) => `<li><button type="button" data-v="${k}">
        <img src="${BASE}${v.image.src}" alt="" width="${v.image.w}" height="${v.image.h}" loading="lazy" decoding="async">
        <b>${esc(v.label)}</b><span>${marks(esc(v.note))}</span></button></li>`).join("")}</ol></div>` : ""}
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
  const img = $<HTMLImageElement>(".cn-shot img");
  const boxes = $(".cn-boxes");
  const cols = { left: $(".cn-col--left"), right: $(".cn-col--right") };
  const title = $(".cn-dlg-title");
  const hint = $(".cn-hint");
  const about = $<HTMLInputElement>('[data-f="about"]');
  const mine = $<HTMLInputElement>('[data-f="mine"]');
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
  const sideOf = (v: View): CompareSide | null => (v === "before" ? c.before : v === "after" ? c.after : null);
  const visible = () => {
    const s = sideOf(view);
    if (!s) return [] as CompareNote[];
    return s.notes.filter((n) => (n.kind === "about" ? about.checked && view === "before" : mine.checked));
  };

  const fill = (b: HTMLButtonElement, n: CompareNote) => {
    const html = `${n.kind === "mine" ? `<i class="cn-pen">${ICON.pen}</i>` : ""}<span class="cn-note-text">${marks(esc(n.text))}${n.extra ? `<em>${marks(esc(n.extra))}</em>` : ""}</span>`;
    if (b.innerHTML === html) return;
    /* текст меняется, пока заметка едет: новый проявляется, а не выскакивает. Подмена сразу, иначе высота
       заметки поменяется уже после раскладки и соседи налезут */
    const swap = !!b.innerHTML && !reduced();
    b.innerHTML = html;
    if (swap) { b.classList.remove("is-swap"); void b.offsetWidth; b.classList.add("is-swap"); }
  };

  const drawBoxes = (list: CompareNote[]) => {
    boxes.innerHTML = list.flatMap((n) => (n.rects ?? []).map((r) => `<i class="cn-box cn-box--${n.kind}" data-key="${keyOf(n)}" style="left:${r[0] * 100}%;top:${r[1] * 100}%;width:${r[2] * 100}%;height:${r[3] * 100}%"></i>`)).join("");
  };

  /* раскладка колонок: заметка встаёт напротив своего места, налезающие сдвигаются вниз */
  const layout = () => {
    const list = visible();
    const wide = !narrow.matches;
    const h = img.clientHeight || 1;
    for (const side of ["left", "right"] as const) {
      const col = cols[side];
      const mineHere = wide ? list.filter((n) => n.side === side) : side === "left" ? list : [];
      /* на узком экране один список по порядку сверху вниз */
      const order = [...mineHere].sort((a, b) => (a.rects?.[0]?.[1] ?? 1) - (b.rects?.[0]?.[1] ?? 1));
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
    drawBoxes(list);
    light(active);
  };

  const light = (key: string) => {
    active = key;
    dlg.classList.toggle("has-active", !!key);
    els.forEach((b, k) => b.classList.toggle("is-active", k === key));
    boxes.querySelectorAll<HTMLElement>(".cn-box").forEach((x) => x.classList.toggle("is-active", x.dataset.key === key));
  };

  const show = (v: View) => {
    view = v;
    const s = sideOf(v);
    const ver = typeof v === "number" ? c.versions![v] : null;
    const src = s ? s.image : ver!.image;
    title.textContent = s ? tidy(s.title) : tidy(ver!.label);
    img.src = BASE + src.src;
    img.alt = tidy(src.caption);
    img.width = src.w;
    img.height = src.h;
    dlg.querySelectorAll<HTMLButtonElement>("[data-view]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.view === v)));
    dlg.querySelectorAll<HTMLButtonElement>("[data-v]").forEach((b) => b.setAttribute("aria-current", String(isCurrent(+b.dataset.v!))));
    dlg.classList.toggle("is-after", v === "after");
    dlg.classList.toggle("is-version", !s);
    hint.innerHTML = !s ? `${marks(esc(ver!.note))} · ${tr(T.version)}` : touch.matches ? tr(T.hintTouch) : tr(v === "after" ? T.hintAfter : T.hintBefore);
    light("");
    if (img.complete) layout(); else img.addEventListener("load", layout, { once: true });
  };
  /** крайние версии — это и есть «До» и «После» */
  const isCurrent = (k: number) => {
    const last = (c.versions?.length ?? 0) - 1;
    return view === k || (view === "before" && k === 0) || (view === "after" && k === last);
  };

  /* наведение на снимок: подсвечивается самое мелкое место под курсором — оно точнее */
  const onShot = (e: PointerEvent) => {
    if (e.pointerType !== "mouse") return;
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
    const ver = el.closest<HTMLElement>("[data-v]");
    if (ver) {
      const k = +ver.dataset.v!, last = (c.versions?.length ?? 0) - 1;
      show(k === 0 ? "before" : k === last ? "after" : k);
      dlg.querySelector(".cn-shot")!.scrollIntoView({ block: "nearest", behavior: reduced() ? "auto" : "smooth" });
      return;
    }
    if (el.closest(".cn-close") || el === dlg) { dlg.close(); return; }
    const note = el.closest<HTMLButtonElement>(".cn-note");
    if (note) {
      light(note.dataset.key === active && touch.matches ? "" : note.dataset.key!);
      /* на узком экране снимок выше списка: доехать до него, чтобы рамку было видно */
      if (narrow.matches && active) dlg.querySelector(".cn-shot")!.scrollIntoView({ block: "nearest", behavior: reduced() ? "auto" : "smooth" });
    }
  });
  on(dlg, "change", () => layout());
  on(dlg, "pointerover", (e) => { const n = (e.target as HTMLElement).closest<HTMLElement>(".cn-note"); if (n && (e as PointerEvent).pointerType === "mouse") light(n.dataset.key!); });
  on(dlg, "pointerout", (e) => { const n = (e.target as HTMLElement).closest<HTMLElement>(".cn-note"); if (n && (e as PointerEvent).pointerType === "mouse" && !n.contains((e as PointerEvent).relatedTarget as Node)) light(""); });
  on(dlg, "focusin", (e) => { const n = (e.target as HTMLElement).closest<HTMLElement>(".cn-note"); if (n) light(n.dataset.key!); });
  on($(".cn-shot"), "pointermove", onShot);
  on($(".cn-shot"), "pointerleave", () => light(""));
  /* колесо внутри окна не уходит к плавной прокрутке страницы за ним */
  on(dlg, "wheel", (e) => e.stopPropagation());
  const ro = new ResizeObserver(() => { if (dlg.open) layout(); });
  ro.observe(img);
  narrow.addEventListener("change", layout, { signal: ac.signal });

  return () => { ac.abort(); ro.disconnect(); if (dlg.open) dlg.close(); dlg.remove(); };
}

export function mountNotes(root: HTMLElement) {
  const stops = [...root.querySelectorAll<HTMLElement>("[data-cn]")].map(mountOne);
  return () => stops.forEach((f) => f());
}
