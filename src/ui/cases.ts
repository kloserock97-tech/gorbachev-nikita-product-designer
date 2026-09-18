import { getCases } from "../data/cases";
import { CASES, CHAPTER, chapters, ramp } from "../scene/story";
import { cue } from "../audio/bus";
import { onLang, t } from "../i18n";

/* Глава «Кейсы» (docs/prompts/scroll.md, промпт 2). По мотивам 3D-сайтов Awwwards: скролл — повествование,
   один кейс — один такт. Лента карточек стоит на дуге (CSS 3D): центральная крупная и ровная,
   соседние развёрнуты от зрителя и отступают вглубь. Вертикальный скролл везёт ленту вбок;
   фон — то же поле под другим ракурсом, размытое (сцена). Карточки — в стиле стеклянных
   карточек холма: обложка, метка, название, подзаголовок, «View case» → страница кейса внутри сайта
   (#/work/<id>, src/ui/caseView.ts).

   Всё — функция от прогресса: transform пишется только когда поменялся, без чтения DOM в кадре.
   (v21 пробовали 3D-карточки в WebGL — Никите не понравились, вернули эту ленту; v26 пробовали сетку
   «Selected work» с фильтрами — Никита попросил вернуть ленту.)
   v27: при смене языка меняются только подписи внутри карточек — сами карточки остаются на местах
   вместе со своим положением в ленте. */

const BASE = import.meta.env.BASE_URL;
const pad = (n: number) => String(n).padStart(2, "0");

type Scene = { onStory?: (p: number) => void };

/** подписи карточек на текущем языке */
function paintCases() {
  const list = getCases();
  document.querySelectorAll<HTMLElement>(".cases-strip .case").forEach((el, i) => {
    const c = list[i];
    if (!c) return;
    el.setAttribute("href", `#/work/${c.id}`);
    const put = (sel: string, text: string) => {
      const n = el.querySelector(sel);
      if (n) n.textContent = text;
    };
    put(".case-tag", `${pad(i + 1)} · ${c.tag}`);
    put(".case-title", c.title);
    put(".case-sub", c.subtitle);
    put(".case-cta-l", t("cases.cta"));
  });
}

/** карточки кейсов в ленту (и для лёгкой версии без 3D — там это просто сетка) */
export function renderCases() {
  const strip = document.querySelector<HTMLElement>(".cases-strip");
  if (!strip || strip.childElementCount) return strip;
  strip.innerHTML = getCases()
    .map(
      (c, i) => `<a class="case" role="listitem" href="#/work/${c.id}" tabindex="-1" style="--i:${i}">
        <span class="case-cover"><img src="${BASE}${c.cover}" alt="" loading="lazy" decoding="async" width="560" height="350"></span>
        <span class="case-body">
          <span class="case-tag">${pad(i + 1)} · ${c.tag}</span>
          <span class="case-title">${c.title}</span>
          <span class="case-sub">${c.subtitle}</span>
          <span class="case-cta"><span class="case-cta-l">${t("cases.cta")}</span> <span aria-hidden="true">↗</span></span>
        </span>
      </a>`,
    )
    .join("");
  onLang(paintCases);
  return strip;
}

export function initCases(scene: Scene) {
  const root = document.querySelector<HTMLElement>(".cases");
  const strip = renderCases();
  if (!root || !strip) return;
  const now = root.querySelector<HTMLElement>(".cases-now");
  const bar = root.querySelector<HTMLElement>(".cases-bar i");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const cards = [...strip.querySelectorAll<HTMLElement>(".case")];
  /* звук: тихий hover на карточке, переход к кейсу — «forward» */
  cards.forEach((el) => {
    el.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse") cue("hover", 0.7); });
    el.addEventListener("click", () => cue("forward"));
  });
  const last = cards.map(() => "");
  let shown = false;
  let current = -1;
  let spacing = 0;
  const layout = () => {
    /* v33: все карточки одной высоты. Тексты подобраны на две строки подзаголовка, CSS держит место под две строки
       названия и подзаголовка; остаток (узкий экран, длинное русское название) выравниваем по самой высокой */
    cards.forEach((c) => c.style.removeProperty("min-height"));
    const tallest = Math.max(0, ...cards.map((c) => c.offsetHeight));
    if (tallest > 0) cards.forEach((c) => (c.style.minHeight = `${tallest}px`));
    /* шаг ленты — от ширины карточки: на телефоне соседние выглядывают с краёв */
    const w = cards[0]?.offsetWidth ?? 360;
    spacing = innerWidth < 900 ? w * 0.92 : w * 1.02;
    last.fill("");
  };
  addEventListener("resize", layout);
  /* подсветка под курсором, как у карточек заметок */
  root.addEventListener("pointermove", (e) => {
    const card = (e.target as HTMLElement).closest<HTMLElement>(".case");
    if (!card) return;
    const r = card.getBoundingClientRect();
    card.style.setProperty("--mx", `${(((e.clientX - r.left) / r.width) * 100).toFixed(1)}%`);
    card.style.setProperty("--my", `${(((e.clientY - r.top) / r.height) * 100).toFixed(1)}%`);
  });
  /* обложки подгружаются лениво — высота может измениться, когда картинка получила размер */
  cards.forEach((c) => c.querySelector("img")?.addEventListener("load", () => requestAnimationFrame(layout), { once: true }));
  /* русские подписи длиннее английских — после смены языка карточки мерим заново */
  onLang(() => requestAnimationFrame(layout));
  layout();

  /* обложки декодируем заранее, пока читают About: иначе первый показ ленты декодирует шесть картинок разом.
     По одной, с паузой — requestIdleCallback гоняет цепочку в одно окно простоя */
  let warmed = false;
  const warm = () => {
    warmed = true;
    const imgs = [...strip.querySelectorAll("img")];
    const step = () => {
      const img = imgs.shift();
      if (!img) return;
      img.loading = "eager";
      void img.decode().catch(() => {}).then(() => window.setTimeout(step, 90));
    };
    step();
  };

  const prev = scene.onStory;
  scene.onStory = (p) => {
    prev?.(p);
    if (!warmed && p > CHAPTER - 0.07) warm();
    const { c, f } = chapters(p);
    const inK = ramp(c, ...CASES.cardsIn);
    /* v32: лента уходит до конца главы — после неё заметки */
    const vis = c > CASES.cardsIn[0] && c < CASES.stripOut[1] && f <= 0;
    root.style.setProperty("--leave", ramp(c, ...CASES.stripOut).toFixed(3));
    if (vis !== shown) {
      shown = vis;
      root.classList.toggle("is-on", vis);
      root.setAttribute("aria-hidden", String(!vis));
      cards.forEach((el) => (el.tabIndex = vis ? 0 : -1));
    }
    if (!vis) return;
    const e = 1 - (1 - inK) ** 3;
    /* активный кейс — дробный: лента едет плавно, без щелчков */
    const active = ramp(c, ...CASES.strip) * (cards.length - 1);
    cards.forEach((el, i) => {
      const d = i - active;
      const ad = Math.abs(d);
      const x = d * spacing;
      const z = -Math.min(ad, 3) * (reduced ? 0 : 150);
      /* барабан: стороны уходят вглубь и разворачиваются от зрителя */
      const ry = reduced ? 0 : Math.max(-1, Math.min(1, d)) * 24 + (d - Math.max(-1, Math.min(1, d))) * 6;
      const y = (1 - e) * (innerHeight * 0.55 + i * 40);
      const sc = 1 - Math.min(ad, 2) * 0.08;
      const tr = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, ${z.toFixed(1)}px) rotateY(${ry.toFixed(2)}deg) scale(${sc.toFixed(3)})`;
      const o = (Math.max(0, Math.min(1, 2.6 - ad)) * Math.min(1, e * 1.4)).toFixed(3);
      const key = tr + o;
      if (last[i] !== key) {
        last[i] = key;
        el.style.transform = tr;
        el.style.opacity = o;
        el.classList.toggle("is-active", ad < 0.5);
      }
    });
    const idx = Math.round(active);
    if (idx !== current && now) {
      if (current >= 0) cue("progress-step", 0.5); // лента перелистнула кейс
      current = idx;
      now.textContent = pad(idx + 1);
    }
    if (bar) bar.style.transform = `scaleX(${(active / (cards.length - 1)).toFixed(4)})`;
  };
}
