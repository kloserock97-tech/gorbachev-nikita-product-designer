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
  const s = c.look.screen, d = c.look.diorama;
  if (d) {
    const scr = s && d.quad ? `<span class="cx-dio-screen" style="width:${s.w}px;height:${s.h}px"><img class="cx-shot" data-src="${BASE}${s.src}" alt="" decoding="async" draggable="false"><i class="cx-dio-glare"></i></span>` : "";
    return `<span class="cx-media cx-media--dio"><img class="cx-dio-img" data-src="${BASE}${d.src}" width="${d.w}" height="${d.h}" alt="" decoding="async" draggable="false">${scr}</span>`;
  }
  if (!s) return `<span class="cx-media cx-media--obj">${objectPicture(c, "cx-obj")}</span>`;
  const img = `<img class="cx-shot" data-src="${BASE}${s.src}" alt="" decoding="async" draggable="false">`;
  return s.device === "phone" ? `<span class="cx-media cx-media--phone"><span class="cx-app">${img}</span></span>` : `<span class="cx-media">${img}</span>`;
};

/** подзаголовок без хвоста после двоеточия — хвост пересказывает цифру результата, а она стоит в своей строке */
const headOf = (s: string) => { const i = s.indexOf(":"); return i > 12 ? s.slice(0, i) : s; };

/** место диорамы: доли кадра референса и пропорция картинки — в переменные для cases-card.css */
const dioVars = (c: CaseItem) => {
  const d = c.look.diorama;
  return d ? `;--ax:${d.at[0]};--ay:${d.at[1]};--aw:${d.at[2]};--ar:${(d.h / d.w).toFixed(4)};--nw:${d.nw ?? 1.12};--nx:${d.nx ?? 0.5};--gl:${d.glow ?? "255,170,70"}` : "";
};

/** matrix3d, который кладёт прямоугольник w×h на четырёхугольник q (углы по часовой от левого верхнего) */
const quadMatrix = (w: number, h: number, q: [number, number][]) => {
  const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = q;
  const sx = x0 - x1 + x2 - x3, sy = y0 - y1 + y2 - y3;
  const dx1 = x1 - x2, dx2 = x3 - x2, dy1 = y1 - y2, dy2 = y3 - y2;
  const den = dx1 * dy2 - dx2 * dy1;
  const g = (sx * dy2 - dx2 * sy) / den, k = (dx1 * sy - sx * dy1) / den;
  const a = x1 - x0 + g * x1, b = x3 - x0 + k * x3, d = y1 - y0 + g * y1, e = y3 - y0 + k * y3;
  /* единичный квадрат → четырёхугольник, затем масштаб w×h → единичный */
  const m = [a / w, d / w, 0, g / w, b / h, e / h, 0, k / h, 0, 0, 1, 0, x0, y0, 0, 1];
  return `matrix3d(${m.map((v) => +v.toFixed(8)).join(",")})`;
};

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
        ${list.map((c, i) => `<a class="cx-card${c.look.diorama ? " cx-card--dio" : ""}" href="#/work/${c.id}" data-i="${i}" tabindex="-1" aria-hidden="true" style="${esc(lookVars(c) + dioVars(c))}">${media(c)}</a>`).join("")}
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
  /* на телефоне факты бывают в две строки: название стоит над их верхом, а не на постоянной высоте, иначе
     двухстрочное название на узком экране наезжало на таблицу */
  const stackTitle = () => {
    if (!root.classList.contains("is-narrow")) { title.style.bottom = ""; return; }
    title.style.bottom = `${(box.clientHeight - facts.offsetTop + 14).toFixed(0)}px`;
  };
  addEventListener("resize", () => requestAnimationFrame(() => { fitTitle(); stackTitle(); }));
  void document.fonts?.ready.then(fitTitle);
  let shown = -1;
  let swapTimer = 0;
  const put = (i: number) => {
    const c = list[i];
    title.innerHTML = letters(c.title);
    fitTitle();
    const phone = c.look.screen?.device === "phone";
    box.classList.toggle("has-scene", !!c.look.scene);
    const rows: [string, string][] = [
      [t("cases.f.about"), headOf(c.subtitle)],
      [t("cases.f.where"), c.tag],
      [t("cases.f.platform"), t(phone ? "work.mobile" : "work.web")],
      [t("cases.f.result"), `${c.stat.value} — ${c.stat.label}`],
    ];
    facts.innerHTML = rows.map(([a, b], k) => `<div style="--k:${k}"><dt>${esc(a)}</dt><dd>${esc(b)}</dd></div>`).join("");
    stackTitle();
    const ni = i + 1 >= n ? 0 : i + 1;
    q(".cx-next-n").textContent = `[${pad2(ni + 1)}]`;
    q(".cx-next-t").textContent = list[ni].title;
    const brand = q(".cx-brand");
    brand.innerHTML = brandMark(c, "cx-brand-img");
    brand.hidden = !brand.firstElementChild || !!c.look.diorama || !!c.look.scene;
    placeNext();
    refit();
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

  /* v78: живые сцены кейсов (src/caseScene) — свой прозрачный холст под карточками. Модуль грузится, когда глава
     вот-вот появится (warm); пока сцена не готова или WebGL не поднялся, видна картинка-диорама */
  type LiveScene = { i: number; setPresence(v: number): void; setPointer(x: number, y: number): void; pause(): void; resume(): void; resize(): void };
  const refit = () => requestAnimationFrame(() => { for (const s of scenes) s.resize(); });
  const scenes: LiveScene[] = [];
  let lastPos = 0;
  const presenceOf = (i: number) => clamp(1 - Math.abs(i - lastPos) * 1.8, 0, 1);
  /* свободная область для сцены: правее списка кейсов, ниже панели, выше названия и таблицы фактов — с воздухом.
     Название у каждого кейса своей длины, поэтому область меряется заново при смене кейса */
  const safeArea = () => {
    const B = box.getBoundingClientRect();
    if (!B.width) return null;
    const rel = (el: Element) => { const r = el.getBoundingClientRect(); return { l: r.left - B.left, t: r.top - B.top, r: r.right - B.left, b: r.bottom - B.top }; };
    const air = Math.max(20, Math.min(40, B.width * 0.022));
    const ti = rel(title), fa = rel(facts);
    if (root.classList.contains("is-narrow")) {
      /* на телефоне у кейса со сценой нет строки «Далее» (переключают кнопки внизу): сцене отдан весь верх */
      const top = next.offsetParent ? rel(next).b + 10 : Math.max(56, B.height * 0.08);
      return { l: 0, r: B.width, t: top, b: ti.t - 18 };
    }
    const li = rel(q(".cx-list"));
    return { l: li.r + air, r: B.width - air, t: bandTop() + next.offsetHeight + air * 0.6, b: Math.min(ti.t, fa.t) - air };
  };
  const bootScenes = () => {
    list.forEach((c, i) => {
      const kind = c.look.scene;
      if (!kind) return;
      /* пока сцена грузится, карточка пустая: картинка-диорама появлялась на секунды и резко менялась на сцену
         в другом месте. Диорама — только если сцена не поднялась */
      cards[i].classList.add("is-scene");
      const fallback = () => {
        cards[i].classList.remove("is-scene");
        for (const img of cards[i].querySelectorAll<HTMLImageElement>("img[data-src]")) { img.src = img.dataset.src!; delete img.dataset.src; }
      };
      void import("../caseScene/registry").then((r) => r.SCENES[kind]()).then(async (create) => {
        const canvas = document.createElement("canvas");
        canvas.className = "cx-scene";
        canvas.setAttribute("aria-hidden", "true");
        box.querySelector(".cx-shade")!.after(canvas);
        try {
          const sc = create(canvas);
          sc.setSafe(safeArea);
          await sc.ready;
          const ls: LiveScene = { i, setPresence: sc.setPresence, setPointer: sc.setPointer, pause: sc.pause, resume: sc.resume, resize: sc.stage.resize };
          scenes.push(ls);
          ls.setPresence(presenceOf(i));
          if (!box.classList.contains("is-live")) ls.pause();
        } catch {
          canvas.remove();
          fallback();
        }
      }, fallback);
    });
  };
  const fineMouse = matchMedia("(hover: hover) and (pointer: fine)");
  root.addEventListener("pointermove", (e) => {
    if (!scenes.length || !fineMouse.matches) return;
    for (const s of scenes) s.setPointer((e.clientX / innerWidth) * 2 - 1, (e.clientY / innerHeight) * 2 - 1);
  });
  addEventListener("resize", refit);

  const live = () => { box.classList.add("is-live"); for (const s of scenes) s.resume(); };
  const calm = () => { box.classList.remove("is-live"); for (const s of scenes) s.pause(); };

  let warmed = false;
  const warm = () => {
    if (warmed) return;
    warmed = true;
    bootScenes();
    for (const img of box.querySelectorAll<HTMLImageElement>(".cx-card:not(.is-scene) img[data-src]")) { img.src = img.dataset.src!; delete img.dataset.src; }
  };

  let reachOn = false;
  let lastDrum = -999;
  const drum = (pos: number) => {
    if (Math.abs(pos - lastDrum) < 0.001) return;
    lastDrum = pos;
    lastPos = pos;
    for (const s of scenes) s.setPresence(presenceOf(s.i));
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
  /* экран на диораме: раскладка CSS, а четырёхугольник экрана считается от настоящего размера картинки */
  const dios = cards.map((el, i) => ({ el: el.querySelector<HTMLElement>(".cx-dio-screen"), c: list[i] })).filter((x) => x.el);
  const layout = () => {
    /* диорамы считают место от центра окна главы, а стопка стоит чуть выше: поправка — разница центров */
    const r = box.getBoundingClientRect(), st = stack.getBoundingClientRect();
    stack.style.setProperty("--fx", `${(r.left + r.width / 2 - st.left - st.width / 2).toFixed(1)}px`);
    stack.style.setProperty("--fy", `${(r.top + r.height / 2 - st.top - st.height / 2).toFixed(1)}px`);
    for (const { el, c } of dios) {
      const pic = el!.parentElement!, W = pic.clientWidth, H = pic.clientHeight, s = c.look.screen!;
      if (W && H) el!.style.transform = quadMatrix(s.w, s.h, c.look.diorama!.quad!.map(([x, y]) => [x * W, y * H] as [number, number]));
    }
    placeNext();
  };
  /* над диорамой «Далее» встаёт к её верхнему краю: на картинке сверху почти пусто, предмет начинается с ~4 % высоты */
  /* у живой сцены «Далее» стоит полосой сверху, под панелью, а сцена начинается ниже — строки не наезжают
     на карточки. Верх полосы — тот же, что верх свободной области в safeArea */
  const bandTop = () => Math.max(84, box.clientHeight * 0.1);
  const placeNext = () => {
    if (list[shown]?.look.scene && !box.closest(".is-narrow")) {
      const cur = parseFloat(next.style.getPropertyValue("--ny")) || 0;
      const top = next.getBoundingClientRect().top - box.getBoundingClientRect().top - cur;
      next.style.setProperty("--ny", `${(bandTop() - top).toFixed(1)}px`);
      return;
    }
    const pic = cards[shown]?.classList.contains("cx-card--dio") ? cards[shown].querySelector<HTMLElement>(".cx-dio-img") : null;
    if (!pic || box.closest(".is-narrow")) { next.style.setProperty("--ny", "0px"); return; }
    const top = stack.getBoundingClientRect().top + pic.offsetTop + (pic.parentElement!.parentElement as HTMLElement).offsetTop + pic.offsetHeight * (list[shown].look.diorama?.next ?? 0.04);
    const nb = next.getBoundingClientRect().bottom - (parseFloat(next.style.getPropertyValue("--ny")) || 0);
    next.style.setProperty("--ny", `${Math.min(0, top - nb - 10).toFixed(1)}px`);
  };
  addEventListener("resize", () => requestAnimationFrame(layout));
  new ResizeObserver(() => layout()).observe(stack);

  paint(0);
  layout();
  return { layout, drum, paint, live, calm, warm, reach };
}
