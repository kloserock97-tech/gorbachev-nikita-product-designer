import { getDetails, type CaseDetail, type CaseImage } from "../data/caseDetails";
import { getCases } from "../data/cases";
import { getTracks, type CaseTrack, type CaseTracks, type TrackPart } from "../data/caseTracks";
import { cue } from "../audio/bus";
import { demoBlock, mountDemos } from "./caseDemos";
import { onLang, t } from "../i18n";
import { heroAccent, mountHero } from "./caseHero";

/* Страница кейса внутри сайта (v26, docs/prompts/v26.md; раскладка по мудборду: блок «Страница проекта»,
   бенто результатов, следующий кейс). Открывается поверх сцены по адресу #/work/<id>: карточка в главе
   «Кейсы», меню Work в доке, прямая ссылка. Закрывается кнопкой «Back to work», Esc и «назад» в браузере.
   Пока страница открыта, сцена не рисует кадры (onToggle) — вся видеокарта отдана прокрутке страницы.

   Вкладки — якоря к разделам с подсветкой текущего (IntersectionObserver внутри прокрутки страницы).

   v27: тексты кейса берутся на текущем языке (caseDetails.ru.ts); если страница открыта в момент
   переключения, она перерисовывается на месте. Ссылок на портфолио в Tilda здесь нет: это отдельная,
   прежняя итерация портфолио, и уводить на неё из кейса незачем.

   v35: подзадачи (data/caseTracks.ts). Под шапкой строка чипсов «Внутри кейса»: первый — основной flow,
   дальше задачи, решённые попутно. Адрес #/work/<id>/<track>. Переходы внутри открытого кейса пишутся
   в историю (history.state.cv — глубина), поэтому «назад» возвращает к предыдущей подзадаче, а «Back to
   work» закрывает кейс целиком: history.go(-глубина). */

const BASE = import.meta.env.BASE_URL;
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const arrow = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7"/><path d="M8.5 7H17v8.5"/></svg>`;
const SECTIONS = ["overview", "problem", "solution", "results", "learnings"] as const;
const pad = (x: number) => String(x).padStart(2, "0");
const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;


type Opts = { onToggle?: (open: boolean) => void };
type Route = { id: string; track: string | null };

const figure = (g: CaseImage) => {
  const shape = g.w / g.h > 2.2 ? "is-wide" : g.h > g.w ? "is-tall" : "";
  const device = g.h > g.w ? "cv-mockup--phone" : "cv-mockup--browser";
  return `<figure class="cv-mockup ${device} ${shape}"><span class="cv-mockup__bar" aria-hidden="true"><i></i><i></i><i></i></span><img src="${BASE}${g.src}" alt="${esc(g.caption)}" width="${g.w}" height="${g.h}" loading="lazy" decoding="async"><figcaption>${esc(g.caption)}</figcaption></figure>`;
};

/** «6 screens», "+25%", "20+ min", "−38%": досчитать ведущее число, остальное оставить; «6 → 0» не трогать */
function countUp(el: HTMLElement) {
  const raw = el.dataset.count ?? "";
  const m = raw.match(/^([+−-]?~?)(\d+)(.*)$/);
  if (!m || /→/.test(raw) || reduced()) return;
  const [, pre, num, post] = m;
  const to = Number(num);
  const t0 = performance.now();
  const dur = Math.min(1400, 500 + to * 20);
  const tick = (now: number) => {
    const k = Math.min(1, (now - t0) / dur);
    el.textContent = `${pre}${Math.round(to * (1 - (1 - k) ** 3))}${post}`;
    if (k < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

export function initCaseView(opts: Opts = {}) {
  const order = getCases().map((c) => c.id);
  const detail = (id: string) => getDetails().find((d) => d.id === id) ?? null;
  const root = document.createElement("section");
  root.className = "case-view";
  root.setAttribute("role", "dialog");
  root.setAttribute("aria-modal", "true");
  root.setAttribute("aria-labelledby", "cv-title");
  root.hidden = true;
  document.body.appendChild(root);

  let current: Route | null = null;
  let lastFocus: HTMLElement | null = null;
  let spy: IntersectionObserver | null = null;
  let revealIo: IntersectionObserver | null = null;
  let stopDemos: (() => void) | null = null;
  let stopHero: (() => void) | null = null;

  const href = (id: string, track?: string | null) => `#/work/${id}${track ? `/${track}` : ""}`;

  /* ── общие куски ── */
  const bar = (i: number, n: number, tabs: [string, string][], navLabel: string) => `
    <div class="cv-bar">
      <button type="button" class="cv-back"><span aria-hidden="true">←</span> ${t("cv.back")}</button>
      <nav class="cv-tabs" aria-label="${navLabel}">${tabs.map(([id, label], k) => `<a href="#cv-${id}" data-sec="${id}"${k ? "" : ' class="is-on"'}>${esc(label)}</a>`).join("")}</nav>
      <div class="cv-pager">
        <span class="cv-count">${pad(i + 1)} / ${pad(n)}</span>
        <button type="button" class="cv-nav" data-go="-1" aria-label="${t("cv.prev")}"><span aria-hidden="true">←</span></button>
        <button type="button" class="cv-nav" data-go="1" aria-label="${t("cv.next")}"><span aria-hidden="true">→</span></button>
      </div>
    </div>`;

  const chips = (d: CaseDetail, set: CaseTracks | null, active: string | null) => {
    if (!set?.tracks.length) return "";
    const items: [string | null, string][] = [[null, set.main], ...set.tracks.map((tr): [string, string] => [tr.id, tr.chip])];
    return `<nav class="cv-chips" aria-label="${t("cv.inside")}">
      <span class="cv-chips-label">${t("cv.inside")}</span>
      <div class="cv-chips-row">${items.map(([id, label], k) =>
        `<a href="${href(d.id, id)}" data-track="${id ?? ""}"${id === active ? ' class="is-on" aria-current="page"' : ""}><span>${pad(k + 1)}</span>${esc(label)}</a>`).join("")}</div>
    </nav>`;
  };

  const nextCase = (i: number, n: number) => {
    const list = getCases();
    const next = detail(order[(i + 1) % n])!;
    const nextCard = list.find((c) => c.id === next.id)!;
    return `<a class="cv-next" href="#/work/${next.id}">
      <span class="cv-next-text"><span class="cv-label">${t("cv.nextcase")}</span><b>${esc(nextCard.title)}</b><span>${esc(nextCard.subtitle)}</span></span>
      <span class="cv-next-img"><img src="${BASE}${next.images[0]?.src ?? nextCard.cover}" alt="" loading="lazy" decoding="async"></span>
      <span class="cv-go">${arrow}</span>
    </a>`;
  };

  /* ── основной flow ──
     v37: читать легче. Первый экран — одна мысль: заголовок, строка о сути, главные цифры, визуал;
     факты строкой. Дальше короткие разделы: текст крупно, списки свёрнуты («подробнее»), живое демо
     в решении, скриншоты лентой. Результаты-цифры переехали наверх, карточка «моя роль» — в строку фактов. */
  const renderMain = (d: CaseDetail, set: CaseTracks | null, i: number, n: number) => {
    const card = getCases().find((c) => c.id === d.id)!;
    const gallery = d.images;
    const facts = [d.role, d.company, d.timeline].filter(Boolean) as string[];
    /* у пункта есть подробный разбор — ссылка на подзадачу прямо под ним */
    const hint = (section: "problem" | "solution" | "results", k: number) => {
      const links = (set?.hints ?? []).filter((h) => h.section === section && h.point === k)
        .map((h) => set!.tracks.find((tr) => tr.id === h.track)).filter((tr): tr is CaseTrack => !!tr);
      return links.length ? `<span class="cv-hints">${links.map((tr) => `<a class="cv-hint" href="${href(d.id, tr.id)}">${t("cv.hint")}: ${esc(tr.chip)} <span aria-hidden="true">→</span></a>`).join("")}</span>` : "";
    };
    const more = (label: string, count: number, body: string) =>
      `<details class="cv-more"><summary><span>${label}</span><em>${count}</em></summary>${body}</details>`;
    const [firstLearn, ...restLearn] = d.learnings;

    return `
      ${bar(i, n, SECTIONS.map((id) => [id, t(`cv.${id}`)]), t("cv.sections"))}
      ${chips(d, set, null)}

      <header class="cv-hero cv-hero--lite">
        <div class="cv-intro">
          <p class="cv-kicker" data-reveal>${esc(d.kicker)}</p>
          <h1 id="cv-title" data-reveal style="--rd:1">${esc(card.title)}</h1>
          <p class="cv-tagline" data-reveal style="--rd:2">${esc(d.tagline)}</p>
          <p class="cv-factline" data-reveal style="--rd:3">${facts.map((f) => `<span>${esc(f)}</span>`).join("")}</p>
        </div>
        <div data-reveal style="--rd:2">${heroAccent(d.id, card.title)}</div>
      </header>

      ${d.results.metrics.length ? `<section class="cv-kpis" aria-label="${t("cv.results")}">
        ${d.results.metrics.slice(0, 4).map((m, k) => `<div class="cv-kpi" data-reveal style="--rd:${k}"><b data-count="${esc(m.value)}">${esc(m.value)}</b><span>${esc(m.label)}</span></div>`).join("")}
      </section>` : ""}

      <section class="cv-sec cv-beat" id="cv-overview">
        <p class="cv-label" data-reveal>${t("cv.overview")}</p>
        <p class="cv-lead" data-reveal style="--rd:1">${esc(d.overview)}</p>
        ${d.quote ? `<blockquote class="cv-quote cv-quote--soft" data-reveal style="--rd:2"><span aria-hidden="true">“</span>${esc(d.quote)}</blockquote>` : ""}
      </section>

      <section class="cv-sec cv-beat" id="cv-problem">
        <p class="cv-label" data-reveal>${t("cv.problem")}</p>
        <p class="cv-lead cv-lead--s" data-reveal style="--rd:1">${esc(d.problem.text)}</p>
        <div data-reveal style="--rd:2">${more(t("cv.constraints"), d.problem.points.length,
          `<ol class="cv-points">${d.problem.points.map((p, k) => `<li><span>${pad(k + 1)}</span><span>${esc(p)}${hint("problem", k)}</span></li>`).join("")}</ol>`)}</div>
      </section>

      <section class="cv-sec cv-beat" id="cv-solution">
        <p class="cv-label" data-reveal>${t("cv.solution")}</p>
        <p class="cv-lead cv-lead--s" data-reveal style="--rd:1">${esc(d.solution.text)}</p>
        ${demoBlock(d.id)}
        <div data-reveal style="--rd:1">${more(t("cv.did"), d.solution.points.length,
          `<ul class="cv-checks cv-checks--grid">${d.solution.points.map((p, k) => `<li>${esc(p)}${hint("solution", k)}</li>`).join("")}</ul>`)}</div>
        ${gallery.length ? `<div class="cv-strip" data-reveal tabindex="0" aria-label="${t("cv.gallery")}">${gallery.map(figure).join("")}</div>` : ""}
      </section>

      <section class="cv-sec cv-beat" id="cv-results">
        <p class="cv-label" data-reveal>${t("cv.changed")}</p>
        <ul class="cv-changed-list">${d.results.points.map((p, k) => `<li data-reveal style="--rd:${k}">${esc(p)}${hint("results", k)}</li>`).join("")}</ul>
      </section>

      <section class="cv-sec cv-beat" id="cv-learnings">
        <p class="cv-label" data-reveal>${t("cv.learnings")}</p>
        ${firstLearn ? `<p class="cv-takeaway" data-reveal style="--rd:1">${esc(firstLearn)}</p>` : ""}
        ${restLearn.length ? `<div data-reveal style="--rd:2">${more(t("cv.morelearn"), restLearn.length, `<ul class="cv-learn">${restLearn.map((l) => `<li>${esc(l)}</li>`).join("")}</ul>`)}</div>` : ""}
      </section>

      ${set?.tracks.length ? `<section class="cv-sec cv-more-sec">
        <p class="cv-label" data-reveal>${t("cv.moretracks")}</p>
        <div class="cv-more-grid">${set.tracks.map((tr, k) => `<a class="cv-track-card" href="${href(d.id, tr.id)}" data-reveal style="--rd:${k}">
          <span class="cv-track-num">${pad(k + 2)}</span><b>${esc(tr.chip)}</b><span>${esc(tr.tagline)}</span><span class="cv-go">${arrow}</span></a>`).join("")}</div>
      </section>` : ""}

      ${nextCase(i, n)}`;
  };

  /* ── подзадача ── */
  const part = (p: TrackPart, k: number) => {
    const blocks: string[] = [];
    if (p.before) blocks.push(`<div class="cv-before"><span class="cv-label">${esc(p.before.label)}</span><b class="cv-before-q">${esc(p.before.text)}</b>${p.before.note ? `<p>${esc(p.before.note)}</p>` : ""}<span class="cv-before-arrow" aria-hidden="true">→</span></div>`);
    if (p.found || p.did || p.points?.length) {
      blocks.push(`<div class="cv-cols">
        ${p.found ? `<div><p class="cv-mini">${t("cv.found")}</p><p class="cv-lead cv-lead--s">${esc(p.found)}</p></div>` : "<div></div>"}
        <div>${p.did ? `<p class="cv-mini">${t("cv.did")}</p><p class="cv-text">${esc(p.did)}</p>` : ""}
        ${p.points?.length ? `<ul class="cv-checks${p.did ? " cv-checks--gap" : ""}">${p.points.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : ""}</div>
      </div>`);
    }
    if (p.options?.length) {
      blocks.push(`<div class="cv-options">${p.options.map((o) => `<article class="cv-option${o.chosen ? " is-chosen" : ""}">
        <header><b>${esc(o.name)}</b>${o.chosen ? `<span class="cv-badge">${t("cv.chosen")}</span>` : ""}</header>
        <p>${esc(o.text)}</p>
        ${o.image ? `<img src="${BASE}${o.image.src}" alt="${esc(o.image.caption)}" width="${o.image.w}" height="${o.image.h}" loading="lazy" decoding="async">` : ""}
      </article>`).join("")}</div>`);
    }
    if (p.steps?.length) {
      blocks.push(`<ol class="cv-steps${p.steps.length === 4 ? " cv-steps--4" : ""}">${p.steps.map((s, j) => `<li><span>${pad(j + 1)}</span><b>${esc(s.title)}</b><p>${esc(s.text)}</p></li>`).join("")}</ol>`);
    }
    if (p.effect || p.why) {
      blocks.push(`<div class="cv-pair">
        ${p.effect ? `<div class="cv-card"><h3>${t("cv.effect")}</h3><p>${esc(p.effect)}</p></div>` : ""}
        ${p.why ? `<div class="cv-card cv-why"><h3>${t("cv.why")}</h3><p>${esc(p.why)}</p></div>` : ""}
      </div>`);
    }
    if (p.lesson) blocks.push(`<div class="cv-lesson"><p class="cv-mini">${t("cv.lesson")}</p><b>${esc(p.lesson.title)}</b><p>${esc(p.lesson.text)}</p></div>`);
    if (p.images?.length) blocks.push(`<div class="cv-gallery${p.images.length === 1 ? " cv-gallery--one" : ""}">${p.images.map(figure).join("")}</div>`);

    return `<section class="cv-sec cv-part" id="cv-${p.id}">
      <p class="cv-label">${pad(k + 1)} · ${esc(p.label)}</p>
      <h2 class="cv-part-title">${esc(p.title)}</h2>
      ${blocks.join("")}
    </section>`;
  };

  const renderTrack = (d: CaseDetail, set: CaseTracks, tr: CaseTrack, i: number, n: number) => {
    const card = getCases().find((c) => c.id === d.id)!;
    const k = set.tracks.indexOf(tr);
    const next = set.tracks[k + 1] ?? null;
    const aside = tr.metrics?.length
      ? `<div class="cv-tmetrics">${tr.metrics.map((m) => `<div class="cv-metric"><b>${esc(m.value)}</b><span>${esc(m.label)}</span></div>`).join("")}</div>`
      : (() => {
          const img = tr.parts.flatMap((p) => p.images ?? [])[0];
          return img ? `<figure class="cv-visual"><img src="${BASE}${img.src}" alt="${esc(img.caption)}" width="${img.w}" height="${img.h}" decoding="async"><figcaption>${esc(img.caption)}</figcaption></figure>` : "";
        })();

    return `
      ${bar(i, n, tr.parts.map((p) => [p.id, p.label]), t("cv.parts"))}
      ${chips(d, set, tr.id)}

      <header class="cv-hero cv-hero--track">
        <div class="cv-intro">
          <p class="cv-kicker">${esc(tr.kicker)}</p>
          <h1 id="cv-title">${esc(tr.title)}</h1>
          <p class="cv-tagline">${esc(tr.tagline)}</p>
          ${tr.facts?.length ? `<dl class="cv-facts">${tr.facts.map(([a, b]) => `<div><dt>${esc(a)}</dt><dd>${esc(b)}</dd></div>`).join("")}</dl>` : ""}
          <p class="cv-case-of">${t("cv.subtask")} · <a href="${href(d.id)}">${esc(card.title)}</a></p>
        </div>
        ${aside}
      </header>

      ${tr.parts.map(part).join("")}

      ${tr.quote ? `<section class="cv-sec"><blockquote class="cv-quote cv-quote--wide"><span aria-hidden="true">“</span>${esc(tr.quote)}</blockquote></section>` : ""}

      <a class="cv-next cv-next--track" href="${href(d.id, next?.id)}">
        <span class="cv-next-text"><span class="cv-label">${next ? t("cv.nexttrack") : t("cv.backmain")}</span><b>${esc(next ? next.chip : set.main)}</b><span>${esc(next ? next.tagline : d.tagline)}</span></span>
        <span class="cv-go">${arrow}</span>
      </a>
      ${next ? "" : nextCase(i, n)}`;
  };

  const render = (r: Route) => {
    const d = detail(r.id)!;
    const i = order.indexOf(d.id);
    const n = order.length;
    const set = getTracks(d.id);
    const tr = r.track ? set?.tracks.find((x) => x.id === r.track) ?? null : null;

    root.innerHTML = `<div class="cv-scroll">${set && tr ? renderTrack(d, set, tr, i, n) : renderMain(d, set, i, n)}</div>`;

    const scroller = root.querySelector<HTMLElement>(".cv-scroll")!;
    root.querySelector(".cv-back")!.addEventListener("click", () => close());
    root.querySelectorAll<HTMLButtonElement>(".cv-nav").forEach((b) => b.addEventListener("click", () => {
      const to = order[(i + Number(b.dataset.go) + n) % n];
      go(href(to), true);
    }));
    /* вкладки: плавная прокрутка внутри страницы; текущий раздел подсвечивается */
    const tabs = [...root.querySelectorAll<HTMLAnchorElement>(".cv-tabs a")];
    tabs.forEach((a) => a.addEventListener("click", (e) => {
      e.preventDefault();
      const sec = root.querySelector<HTMLElement>(`#cv-${a.dataset.sec}`);
      if (sec) scroller.scrollTo({ top: sec.offsetTop - 84, behavior: reduced() ? "auto" : "smooth" });
    }));
    spy?.disconnect();
    spy = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const id = e.target.id.replace("cv-", "");
        tabs.forEach((x) => x.classList.toggle("is-on", x.dataset.sec === id));
      }
    }, { root: scroller, rootMargin: "-30% 0px -60% 0px" });
    root.querySelectorAll(".cv-sec[id]").forEach((s) => spy!.observe(s));
    scroller.scrollTop = 0;

    /* v37: блоки проявляются, когда въезжают в кадр; числа в цифрах результата досчитываются */
    revealIo?.disconnect();
    revealIo = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const el = e.target as HTMLElement;
        el.classList.add("is-in");
        revealIo!.unobserve(el);
        el.querySelectorAll<HTMLElement>("[data-count]").forEach(countUp);
      }
    }, { root: scroller, rootMargin: "0px 0px -8% 0px", threshold: 0.12 });
    root.querySelectorAll<HTMLElement>("[data-reveal]").forEach((el) => revealIo!.observe(el));
    stopDemos?.();
    stopDemos = mountDemos(root, scroller);
    stopHero?.();
    stopHero = mountHero(root, scroller);
    /* активный чипс виден и в узкой прокручиваемой строке */
    root.querySelector<HTMLElement>(".cv-chips-row a.is-on")?.scrollIntoView({ block: "nearest", inline: "center" });
  };

  const open = (r: Route) => {
    if (!detail(r.id)) return;
    const was = current;
    current = r;
    render(r);
    if (!was) {
      lastFocus = document.activeElement as HTMLElement | null;
      root.hidden = false;
      document.body.classList.add("case-open");
      requestAnimationFrame(() => root.classList.add("is-on"));
      opts.onToggle?.(true);
      cue("open", 0.7);
      root.querySelector<HTMLElement>(".cv-back")?.focus({ preventScroll: true });
    } else {
      cue("progress-step", 0.5);
      /* смена подзадачи: фокус на её заголовок, чтобы экранный диктор прочитал новую страницу */
      const h = root.querySelector<HTMLElement>("#cv-title");
      h?.setAttribute("tabindex", "-1");
      h?.focus({ preventScroll: true });
    }
  };

  const hide = () => {
    if (!current) return;
    current = null;
    spy?.disconnect();
    revealIo?.disconnect();
    stopDemos?.();
    stopDemos = null;
    stopHero?.();
    stopHero = null;
    root.classList.remove("is-on");
    document.body.classList.remove("case-open");
    opts.onToggle?.(false);
    cue("close", 0.7);
    window.setTimeout(() => { if (!current) { root.hidden = true; root.innerHTML = ""; } }, 380);
    lastFocus?.focus?.({ preventScroll: true });
  };

  /* глубина наших записей в истории: открыли кликом — 1, каждая смена подзадачи или кейса — ещё одна */
  const depth = () => (history.state && typeof history.state.cv === "number" ? history.state.cv : 0);

  /* закрыть: свои записи в истории — отмотать их все, иначе просто убрать адрес */
  let closing = false;
  const close = () => {
    const n = depth();
    /* после отмотки route() сам уберёт адрес, если кейс открыли прямой ссылкой и под нашими записями снова кейс */
    if (n > 0) { closing = true; history.go(-n); }
    else { history.replaceState(null, "", location.pathname + location.search); hide(); }
  };

  const parse = (): Route | null => {
    const m = location.hash.match(/^#\/work\/([\w-]+)(?:\/([\w-]+))?/);
    if (!m || !detail(m[1])) return null;
    const set = getTracks(m[1]);
    const track = m[2] && set?.tracks.some((x) => x.id === m[2]) ? m[2] : null;
    return { id: m[1], track };
  };

  const route = () => {
    const r = parse();
    if (closing) {
      closing = false;
      if (r) history.replaceState(null, "", location.pathname + location.search);
      hide();
      return;
    }
    if (r) {
      if (!current || current.id !== r.id || current.track !== r.track) open(r);
    } else hide();
  };

  /** переход внутри сайта: новая запись в истории (или замена — для стрелок «пред./след. кейс») */
  const go = (to: string, replace = false) => {
    const url = location.pathname + location.search + to;
    if (replace) history.replaceState({ cv: depth() }, "", url);
    else history.pushState({ cv: depth() + 1 }, "", url);
    route();
  };

  /* язык переключили прямо на открытом кейсе — пересобираем страницу тем же кейсом и подзадачей */
  onLang(() => {
    if (current) render(current);
  });

  /* клики по ссылкам #/work/<id>[/<track>] (карточки, меню Work, чипсы, «Next case») — своя запись в истории */
  document.addEventListener("click", (e) => {
    const a = (e.target as Element).closest?.<HTMLAnchorElement>("a[href^='#/work/']");
    if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    const to = a.getAttribute("href")!;
    if (location.hash === to) return;
    go(to);
  });
  addEventListener("hashchange", route);
  addEventListener("popstate", route);
  addEventListener("keydown", (e) => { if (e.key === "Escape" && current) { e.stopImmediatePropagation(); close(); } }, true);
  route();

  return { open: (id: string) => go(href(id)), close, get isOpen() { return !!current; } };
}
