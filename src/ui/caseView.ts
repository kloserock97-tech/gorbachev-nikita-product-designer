import { getCases } from "../data/cases";
import { getStory } from "../data/caseStory";
import { cue } from "../audio/bus";
import { onLang, t } from "../i18n";
import { renderStory, mountStory } from "./caseStoryView";

/* Страница кейса внутри сайта (v26). Открывается поверх сцены по адресу #/work/<id>: карточка в главе
   «Кейсы», меню Work в доке, прямая ссылка. Закрывается кнопкой «Все кейсы», Esc и «назад» в браузере.
   Пока страница открыта, сцена не рисует кадры (onToggle) — вся видеокарта отдана прокрутке страницы.

   Этот файл — маршруты, история и окно. Саму страницу собирает caseStoryView.ts по рассказу из
   data/caseStory (v41): одна навигация, разборы в глубину вложены в раздел «Решения».

   v27: если страница открыта в момент переключения языка, она перерисовывается на месте.
   v35: адрес разбора — #/work/<id>/<разбор>. Переходы внутри открытого кейса пишутся в историю
   (history.state.cv — глубина), поэтому «назад» возвращает на шаг, а «Все кейсы» закрывает кейс целиком:
   history.go(-глубина).
   v39: адрес кейса, которого нет, открывает экран «кейса нет» со списком всех кейсов. */

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const arrow = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7"/><path d="M8.5 7H17v8.5"/></svg>`;
const pad = (x: number) => String(x).padStart(2, "0");

type Opts = { onToggle?: (open: boolean) => void };
/* missing — адрес вида #/work/<id>, которого нет: старая ссылка или опечатка */
type Route = { id: string; track: string | null; missing?: string };

export function initCaseView(opts: Opts = {}) {
  const order = getCases().map((c) => c.id);
  const root = document.createElement("section");
  root.className = "case-view";
  root.setAttribute("role", "dialog");
  root.setAttribute("aria-modal", "true");
  root.setAttribute("aria-labelledby", "cv-title");
  root.hidden = true;
  document.body.appendChild(root);

  let current: Route | null = null;
  let lastFocus: HTMLElement | null = null;
  let storyApi: ReturnType<typeof mountStory> | null = null;

  const href = (id: string, track?: string | null) => `#/work/${id}${track ? `/${track}` : ""}`;

  /* кейса по адресу нет: говорим об этом прямо и показываем весь список — искать не нужно */
  const renderMissing = (asked: string) => {
    const list = getCases();
    root.innerHTML = `<div class="cv-scroll"><article class="cv cv--missing">
      <div class="cv-bar">
        <button type="button" class="cv-back"><span aria-hidden="true">←</span> ${t("cv.back")}</button>
      </div>
      <header class="cv-missing-head">
        <p class="cv-label">${t("cv.missing.label")}</p>
        <h1 id="cv-title" tabindex="-1">${t("cv.missing.title")}</h1>
        <p class="cv-missing-sub">${t("cv.missing.sub")}</p>
        <p class="cv-missing-path"><code>#/work/${esc(asked)}</code></p>
      </header>
      <nav class="cv-missing-list" aria-label="${t("cv.missing.all")}">
        <p class="cv-label">${t("cv.missing.all")}</p>
        ${list.map((c, k) => `<a href="${href(c.id)}">
          <span class="cv-missing-n">${pad(k + 1)}</span>
          <span class="cv-missing-t"><b>${esc(c.title)}</b><span>${esc(c.subtitle)}</span></span>
          <span class="cv-go">${arrow}</span>
        </a>`).join("")}
      </nav>
    </article></div>`;
    root.querySelector(".cv-back")!.addEventListener("click", () => close());
    root.querySelector<HTMLElement>("#cv-title")?.focus({ preventScroll: true });
  };

  const render = (r: Route) => {
    storyApi?.stop();
    storyApi = null;
    if (r.missing) { renderMissing(r.missing); return; }
    const story = getStory(r.id)!;
    const k = order.indexOf(r.id);
    const n = order.length;
    root.innerHTML = `<div class="cv-scroll cv-scroll--story">${renderStory(story, k, n, order[(k + 1) % n], order[(k - 1 + n) % n])}</div>`;
    const scroller = root.querySelector<HTMLElement>(".cv-scroll")!;
    scroller.scrollTop = 0;
    storyApi = mountStory(root, scroller, { onClose: () => close(), track: r.track, go });
  };

  const open = (r: Route) => {
    if (!r.missing && !getStory(r.id)) return;
    const was = current;
    /* тот же кейс: страница на месте, меняется только раскрытый разбор */
    if (was && storyApi && !r.missing && was.id === r.id) { current = r; storyApi.setTrack(r.track); return; }
    current = r;
    render(r);
    if (!was) {
      lastFocus = document.activeElement as HTMLElement | null;
      root.hidden = false;
      document.body.classList.add("case-open");
      requestAnimationFrame(() => root.classList.add("is-on"));
      opts.onToggle?.(true);
      cue("open", 0.7);
      root.querySelector<HTMLElement>(".cs-back, .cv-back")?.focus({ preventScroll: true });
    } else {
      cue("progress-step", 0.5);
      /* другой кейс: фокус на заголовок, чтобы экранный диктор прочитал новую страницу */
      const h = root.querySelector<HTMLElement>("#cv-title");
      h?.setAttribute("tabindex", "-1");
      h?.focus({ preventScroll: true });
    }
  };

  const hide = () => {
    if (!current) return;
    current = null;
    storyApi?.stop();
    storyApi = null;
    root.classList.remove("is-on");
    document.body.classList.remove("case-open");
    opts.onToggle?.(false);
    cue("close", 0.7);
    window.setTimeout(() => { if (!current) { root.hidden = true; root.innerHTML = ""; } }, 380);
    lastFocus?.focus?.({ preventScroll: true });
  };

  /* глубина наших записей в истории: открыли кликом — 1, каждый разбор или соседний кейс — ещё одна */
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
    if (!m) return null;
    const story = getStory(m[1]);
    if (!story) return { id: "", track: null, missing: m[1] };
    const track = m[2] && story.deepDives.some((x) => x.id === m[2]) ? m[2] : null;
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
      if (!current || current.id !== r.id || current.track !== r.track || current.missing !== r.missing) open(r);
    } else hide();
  };

  /** переход внутри сайта: новая запись в истории (или замена — когда разбор свернули руками) */
  function go(to: string, replace = false) {
    const url = location.pathname + location.search + to;
    if (replace) history.replaceState({ cv: depth() }, "", url);
    else history.pushState({ cv: depth() + 1 }, "", url);
    route();
  }

  /* язык переключили прямо на открытом кейсе — пересобираем страницу тем же кейсом и разбором */
  onLang(() => {
    if (current) render(current);
  });

  /* клики по ссылкам #/work/<id>[/<разбор>] (карточки, меню Work, соседние кейсы, «Следующий кейс») — своя запись в истории */
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
  addEventListener("keydown", (e) => {
    if (e.key !== "Escape" || !current) return;
    /* открытый лайтбокс или лист оглавления закрываются сами, кейс остаётся */
    if (root.querySelector("dialog[open], .cs-sheet:not([hidden])")) {
      root.querySelector<HTMLElement>(".cs-sheet:not([hidden]) .cs-sheet-close")?.click();
      return;
    }
    e.stopImmediatePropagation();
    close();
  }, true);
  route();

  return { open: (id: string) => go(href(id)), close, get isOpen() { return !!current; } };
}
