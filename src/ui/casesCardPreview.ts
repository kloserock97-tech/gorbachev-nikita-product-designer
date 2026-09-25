/* v75: глава «Кейсы» по референсу Никиты (сайт о планетах): фон во весь экран, слева столбик названий с точкой
   у текущего, по центру карточка-«сквиркл» с экраном продукта и строкой «Далее: [03] …» над ней, внизу слева —
   огромное сжатое название кейса, внизу справа — таблица фактов с тонкими разделителями.

   Рамка из стекла и мокапы по правилам Яндекса (v74) из главы ушли: референс — открытая сцена, и крупная
   типографика читается только на ней. Мокапы по-прежнему живут в шапке страницы кейса (caseArt.ts).

   Механика прежняя: кейс ведёт прокрутка (casesWheel.ts считает положение и вызывает drum/paint). Карточки лежат
   стопкой и сменяются по дробному положению: уходящая уезжает влево и гаснет, приходящая выходит справа.
   Название собирается по буквам снизу вверх, строки фактов — лесенкой (принципы Emil Kowalski: ease-out, короткие
   длительности, задержка не больше пары десятков миллисекунд на элемент).
   Открывает кейс только карточка (над ней курсор становится кругом «Открыть»). Пункт списка и «Далее» только
   переключают кейс. Дуга, текстовая колонка и кнопки шага casesWheel.ts остаются в разметке, но не видны. */
import type { CaseItem } from "../data/cases";
import { onLang, t } from "../i18n";
import { pad2 } from "../lib/format";
import { CASES, CHAPTER, CHAPTER2 } from "../scene/story";
import { topFor } from "./storyScroll";
import { cue } from "../audio/bus";
import { brandMark, lookVars, objectPicture } from "./caseLook";
import "./cases-card.css";

const BASE = import.meta.env.BASE_URL;
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export type CardPreview = {
  layout(): void;
  drum(pos: number): void;
  paint(i: number): void;
  live(): void;
  calm(): void;
  warm(): void;
  reach(on: boolean): void;
};

/** содержимое карточки: веб — снимок во всю карточку, мобильный — экран приложения на поле цвета кейса,
    без экранов — предмет кейса */
const media = (c: CaseItem) => {
  const s = c.look.screen;
  if (!s) return `<span class="cx-media cx-media--obj">${objectPicture(c, "cx-obj")}</span>`;
  const img = `<img class="cx-shot" data-src="${BASE}${s.src}" alt="" decoding="async" draggable="false">`;
  return s.device === "phone" ? `<span class="cx-media cx-media--phone"><span class="cx-app">${img}</span></span>` : `<span class="cx-media">${img}</span>`;
};

/** подзаголовок без хвоста после двоеточия — хвост пересказывает цифру результата, а она стоит в своей строке */
const headOf = (s: string) => { const i = s.indexOf(":"); return i > 12 ? s.slice(0, i) : s; };

export function createCardPreview(stage: HTMLElement, getList: () => CaseItem[]): CardPreview {
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let list = getList();
  const n = list.length;
  const root = stage.closest<HTMLElement>(".cases") ?? stage;

  const box = document.createElement("div");
  box.className = "cx";
  box.innerHTML = `
    <i class="cx-shade" aria-hidden="true"></i>
    <nav class="cx-list">
      <p class="cx-cap"><span class="cx-cap-l"></span> <sup>${pad2(n)}</sup></p>
      <ol>${list.map((c, i) => `<li><a class="cx-li" href="#/work/${c.id}" data-i="${i}"><i class="cx-dot" aria-hidden="true"></i><span></span></a></li>`).join("")}</ol>
    </nav>
    <div class="cx-center">
      <button class="cx-next" type="button"><span class="cx-next-l"></span><span class="cx-next-n"></span><b class="cx-next-t"></b></button>
      <div class="cx-stack">
        ${list.map((c, i) => `<a class="cx-card" href="#/work/${c.id}" data-i="${i}" tabindex="-1" aria-hidden="true" style="${lookVars(c)}">${media(c)}</a>`).join("")}
        <span class="cx-cursor" aria-hidden="true"><i></i><span class="cx-cursor-l"></span></span>
        <span class="cx-brand" aria-hidden="true"></span>
      </div>
    </div>
    <h3 class="cx-title" aria-live="polite"></h3>
    <dl class="cx-facts"></dl>
    <p class="cx-seg" aria-hidden="true">${list.map(() => "<i></i>").join("")}</p>`;
  root.appendChild(box);

  const q = <T extends HTMLElement = HTMLElement>(sel: string) => box.querySelector<T>(sel)!;
  const cards = [...box.querySelectorAll<HTMLAnchorElement>(".cx-card")];
  const items = [...box.querySelectorAll<HTMLAnchorElement>(".cx-li")];
  const segs = [...box.querySelectorAll<HTMLElement>(".cx-seg i")];
  const title = q(".cx-title"), facts = q(".cx-facts"), next = q<HTMLButtonElement>(".cx-next"), stack = q(".cx-stack"), cursor = q(".cx-cursor");
  for (const img of box.querySelectorAll<HTMLImageElement>(".cx-shot")) img.addEventListener("error", () => img.remove());

  /* переход к кейсу прокруткой — та же формула, что у casesWheel (положение кейса на ленте главы) */
  const toCase = (i: number) => {
    const k = clamp(i, 0, n - 1);
    const c = CASES.strip[0] + (CASES.strip[1] - CASES.strip[0]) * (k / Math.max(1, n - 1));
    scrollTo({ top: topFor(CHAPTER + (CHAPTER2 - CHAPTER) * c), behavior: reduced ? ("instant" as ScrollBehavior) : "smooth" });
    cue("progress-step", 0.6);
  };
  let cur = 0;
  items.forEach((a, i) => a.addEventListener("click", (e) => { e.preventDefault(); if (i !== cur) toCase(i); }));
  next.addEventListener("click", () => toCase(cur + 1 >= n ? 0 : cur + 1));
  cards.forEach((a) => a.addEventListener("click", () => cue("forward")));

  /* курсор над карточкой — круг «Открыть», только там, где есть мышь */
  const fine = matchMedia("(hover: hover) and (pointer: fine)");
  stack.addEventListener("pointermove", (e) => {
    if (!fine.matches || e.pointerType !== "mouse") return;
    const r = stack.getBoundingClientRect();
    cursor.style.translate = `${(e.clientX - r.left).toFixed(1)}px ${(e.clientY - r.top).toFixed(1)}px`;
    stack.classList.add("is-hover");
  });
  stack.addEventListener("pointerleave", () => stack.classList.remove("is-hover"));

  /* подписи на текущем языке */
  const paintStatic = () => {
    list = getList();
    q(".cx-cap-l").textContent = t("work.title");
    q(".cx-list").setAttribute("aria-label", t("work.title"));
    q(".cx-next-l").textContent = t("cases.upnext");
    q(".cx-cursor-l").textContent = t("cases.open");
    items.forEach((a, i) => { a.querySelector("span")!.textContent = list[i].title; });
    cards.forEach((a, i) => a.setAttribute("aria-label", `${t("cases.cta")}: ${list[i].title}`));
  };
  paintStatic();

  /* название — по буквам: каждое слово в своей маске, буквы выходят снизу со сдвигом в 18 мс */
  const letters = (s: string) =>
    s.toUpperCase().split(" ").map((w) => `<span class="cx-w">${[...w].map((ch, k) => `<span class="cx-c" style="--k:${k}">${esc(ch)}</span>`).join("")}</span>`).join(" ");
  /* кегль названия подгоняется так, чтобы самое длинное слово целиком влезало в отведённую ширину: слова не рвутся,
     а «ИИ-АГЕНТАМИ» и «RESTAURANT» не вылезают на карточку. Кегль из CSS — потолок */
  const fitTitle = () => {
    title.style.fontSize = "";
    const max = title.clientWidth || 1;
    const widest = Math.max(1, ...[...title.querySelectorAll<HTMLElement>(".cx-w")].map((w) => w.scrollWidth));
    if (widest > max) title.style.fontSize = `${(parseFloat(getComputedStyle(title).fontSize) * (max / widest) * 0.98).toFixed(1)}px`;
  };
  addEventListener("resize", () => requestAnimationFrame(fitTitle));
  void document.fonts?.ready.then(fitTitle);
  let shown = -1;
  let swapTimer = 0;
  const put = (i: number) => {
    const c = list[i];
    title.innerHTML = letters(c.title);
    fitTitle();
    const phone = c.look.screen?.device === "phone";
    const rows: [string, string][] = [
      [t("cases.f.about"), headOf(c.subtitle)],
      [t("cases.f.where"), c.tag],
      [t("cases.f.platform"), t(phone ? "work.mobile" : "work.web")],
      [t("cases.f.result"), `${c.stat.value} — ${c.stat.label}`],
    ];
    facts.innerHTML = rows.map(([a, b], k) => `<div style="--k:${k}"><dt>${esc(a)}</dt><dd>${esc(b)}</dd></div>`).join("");
    const ni = i + 1 >= n ? 0 : i + 1;
    q(".cx-next-n").textContent = `[${pad2(ni + 1)}]`;
    q(".cx-next-t").textContent = list[ni].title;
    const brand = q(".cx-brand");
    brand.innerHTML = brandMark(c, "cx-brand-img");
    brand.hidden = !brand.firstElementChild;
    box.classList.remove("is-in");
    if (reduced) { box.classList.add("is-in"); return; }
    requestAnimationFrame(() => requestAnimationFrame(() => box.classList.add("is-in")));
  };
  const paint = (i: number) => {
    list = getList();
    if (i === shown) return;
    const first = shown < 0;
    shown = i;
    clearTimeout(swapTimer);
    if (first || reduced) { put(i); return; }
    /* старое уходит вверх быстро (0,16 с), новое собирается снизу */
    box.classList.add("is-out");
    swapTimer = window.setTimeout(() => { box.classList.remove("is-out"); put(i); }, 160);
  };
  onLang(() => { paintStatic(); const i = shown; shown = -1; if (i >= 0) paint(i); });

  const live = () => { box.classList.add("is-live"); };
  const calm = () => { box.classList.remove("is-live"); };

  let warmed = false;
  const warm = () => {
    if (warmed) return;
    warmed = true;
    for (const img of box.querySelectorAll<HTMLImageElement>("img[data-src]")) { img.src = img.dataset.src!; delete img.dataset.src; }
  };

  let reachOn = false;
  let lastDrum = -999;
  const drum = (pos: number) => {
    if (Math.abs(pos - lastDrum) < 0.001) return;
    lastDrum = pos;
    cards.forEach((el, i) => {
      const d = i - pos, ad = Math.abs(d);
      el.classList.toggle("is-far", ad > 1);
      el.classList.toggle("is-cur", ad < 0.5);
      if (ad > 1) return;
      el.style.opacity = clamp(1 - ad * 1.8, 0, 1).toFixed(3);
      el.style.transform = reduced ? "none" : `translate3d(${(d * 14).toFixed(2)}%, 0, 0) scale(${(1 - ad * 0.08).toFixed(3)}) rotate(${(d * 3).toFixed(2)}deg)`;
      el.tabIndex = reachOn && ad < 0.5 ? 0 : -1;
      el.setAttribute("aria-hidden", String(ad >= 0.5));
    });
    cur = clamp(Math.round(pos), 0, n - 1);
    items.forEach((a, i) => { a.classList.toggle("is-on", i === cur); a.setAttribute("aria-current", i === cur ? "true" : "false"); });
    segs.forEach((s, i) => s.classList.toggle("is-on", i === cur));
  };
  const reach = (on: boolean) => { reachOn = on; lastDrum = -999; };
  const layout = () => { /* раскладка — CSS; пересчитывать нечего */ };

  paint(0);
  return { layout, drum, paint, live, calm, warm, reach };
}
