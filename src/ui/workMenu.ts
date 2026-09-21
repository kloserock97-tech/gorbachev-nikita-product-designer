import { getCases, type CaseItem } from "../data/cases";
import { pad2 as pad } from "../lib/format";
import { cue } from "../audio/bus";
import { onLang, t, type Key } from "../i18n";

/* Меню «Кейсы» в доке (v29): большая выпадашка по шаблону «Templates» — слева категории, справа сетка
   кейсов с превью, внизу строка с подписью и кнопками. Категория фильтрует сетку; число рядом с ней —
   сколько кейсов останется.

   Категории выводятся из данных, а не пишутся руками: у каждого кейса в cases.ts есть поле kind
   («Веб» или «Мобайл»). Добавится кейс — фильтр подхватит его сам.

   Поведение прежнее: открывается наведением (мышь) и кликом (палец, клавиатура), закрывается, когда
   курсор ушёл и с пункта, и с панели, по Esc и кликом мимо. Анимация по Emil Kowalski: ease-out с резким
   стартом, масштаб от 0.97 от пункта дока, короткий каскад карточек; закрытие быстрее открытия.
   Категорию переключает только клик: при наведении она менялась бы под курсором, пока его ведут
   по диагонали к карточкам. */

const BASE = import.meta.env.BASE_URL;

type Filter = "all" | "web" | "mobile";
const FILTERS: Filter[] = ["all", "web", "mobile"];

const kindOf = (c: CaseItem): Filter[] => c.kind;

const arrow = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17 17 7"/><path d="M8.5 7H17v8.5"/></svg>`;

export function initWorkMenu(opts: { onOpenComputer?: () => void; onAllCases?: () => void } = {}) {
  const trigger = document.querySelector<HTMLAnchorElement>(".dock a[href='#work']");
  const wrap = document.querySelector<HTMLElement>(".dock-wrap");
  if (!trigger || !wrap) return;

  const all = getCases();
  const counts = Object.fromEntries(FILTERS.map((f) => [f, f === "all" ? all.length : all.filter((c) => kindOf(c).includes(f)).length])) as Record<Filter, number>;
  let filter: Filter = "all";

  const panel = document.createElement("div");
  panel.className = "work-menu";
  panel.id = "work-menu";
  panel.setAttribute("role", "dialog");
  panel.innerHTML = `
    <div class="work-menu__body">
      <div class="work-menu__filters" role="group">
        ${FILTERS.map((f) => `<button type="button" class="work-menu__filter${f === filter ? " is-on" : ""}" data-filter="${f}" aria-pressed="${f === filter}">
          <span class="work-menu__filter-l"></span><span class="work-menu__filter-n">${pad(counts[f])}</span>
        </button>`).join("")}
      </div>
      <ul class="work-menu__grid">
        ${all.map((c, i) => `
          <li style="--i:${i}" data-kinds="${kindOf(c).join(" ")}">
            <a class="work-menu__card" href="#/work/${c.id}">
              <span class="work-menu__thumb"><img src="${BASE}${c.cover}" alt="" loading="lazy" decoding="async" width="560" height="350"><span class="work-menu__go">${arrow}</span></span>
              <span class="work-menu__name"></span>
              <span class="work-menu__sub"></span>
            </a>
          </li>`).join("")}
      </ul>
    </div>
    <div class="work-menu__foot">
      <p class="work-menu__note"></p>
      <div class="work-menu__actions">
        <button class="work-menu__all" type="button"><span class="work-menu__all-l"></span> <span aria-hidden="true">→</span></button>
      </div>
    </div>`;
  wrap.appendChild(panel);

  trigger.setAttribute("aria-haspopup", "dialog");
  trigger.setAttribute("aria-expanded", "false");
  trigger.setAttribute("aria-controls", panel.id);

  const items = [...panel.querySelectorAll<HTMLLIElement>(".work-menu__grid li")];
  const filterButtons = [...panel.querySelectorAll<HTMLButtonElement>(".work-menu__filter")];

  /* все подписи — из словаря текущего языка; вызывается и при смене языка */
  const paint = () => {
    const list = getCases();
    panel.setAttribute("aria-label", t("work.title"));
    panel.querySelector(".work-menu__filters")?.setAttribute("aria-label", t("work.filters"));
    filterButtons.forEach((b) => {
      const l = b.querySelector(".work-menu__filter-l");
      if (l) l.textContent = t(`work.${b.dataset.filter}` as Key);
    });
    items.forEach((li, i) => {
      const c = list[i];
      li.querySelector(".work-menu__name")!.textContent = c.title;
      li.querySelector(".work-menu__sub")!.textContent = c.tag;
    });
    panel.querySelector(".work-menu__note")!.textContent = t("work.note");
    panel.querySelector(".work-menu__all-l")!.textContent = t("work.allCases");
  };
  paint();
  onLang(paint);

  /* Фильтр: сетка гаснет на мгновение, меняет состав и проявляется каскадом — без прыжков раскладки
     посреди видимого кадра */
  let filterTimer = 0;
  const setFilter = (next: Filter) => {
    if (next === filter) return;
    filter = next;
    cue("toggle-on", 0.5);
    filterButtons.forEach((b) => {
      const on = b.dataset.filter === next;
      b.classList.toggle("is-on", on);
      b.setAttribute("aria-pressed", String(on));
    });
    panel.classList.add("is-filtering");
    clearTimeout(filterTimer);
    filterTimer = window.setTimeout(() => {
      let k = 0;
      items.forEach((li) => {
        const show = next === "all" || (li.dataset.kinds ?? "").split(" ").includes(next);
        li.hidden = !show;
        if (show) li.style.setProperty("--i", String(k++));
      });
      requestAnimationFrame(() => panel.classList.remove("is-filtering"));
    }, 120);
  };
  filterButtons.forEach((b) => b.addEventListener("click", (e) => {
    e.stopPropagation();
    setFilter(b.dataset.filter as Filter);
  }));

  let open = false;
  let openedAt = 0;
  let closeTimer = 0;
  let openTimer = 0;

  /* v46: на широком экране панель живёт в body, а не в доке. Док лежит внутри закреплённого первого экрана,
     а тот целиком — слой ниже глав истории (About, кейсы, эксперименты, футер): z-index панели внутри него
     ничего не решал, и на любом экране после первого карточка открывалась под контентом. Наведение, клавиатура
     и закрытие от родителя не зависят. На узком экране док прокручивается вместе с первым экраном, меню
     открывается только там — панель остаётся в доке. */
  const float = () => {
    const wide = innerWidth > 900;
    const home = wide ? document.body : wrap;
    if (panel.parentElement !== home) home.appendChild(panel);
    panel.classList.toggle("work-menu--float", wide);
    return wide;
  };
  /* панель встаёт под доком по центру пункта Work, но не вылезает за край экрана */
  const place = () => {
    if (!float()) { panel.style.left = ""; panel.style.top = ""; return; }
    const w = wrap.getBoundingClientRect();
    const tr = trigger.getBoundingClientRect();
    const pw = panel.offsetWidth;
    const margin = 16;
    const centre = tr.left + tr.width / 2;
    const left = Math.min(Math.max(centre - pw / 2, margin), innerWidth - pw - margin);
    panel.style.left = `${left}px`;
    panel.style.top = `${w.bottom + 10}px`;
    panel.style.setProperty("--origin-x", `${centre - left}px`);
  };
  float();

  const setOpen = (on: boolean) => {
    clearTimeout(closeTimer);
    clearTimeout(openTimer);
    if (on === open) return;
    open = on;
    cue(on ? "open" : "close", 0.7);
    if (on) { place(); openedAt = performance.now(); }
    panel.classList.toggle("is-open", on);
    document.body.classList.toggle("work-open", on);
    trigger.setAttribute("aria-expanded", String(on));
  };
  const closeSoon = () => { clearTimeout(openTimer); clearTimeout(closeTimer); closeTimer = window.setTimeout(() => setOpen(false), 220); };

  const hoverable = matchMedia("(hover: hover) and (pointer: fine)");
  for (const el of [trigger, panel]) {
    el.addEventListener("pointerenter", (ev) => {
      const e = ev as PointerEvent;
      if (e.pointerType !== "mouse" || !hoverable.matches) return;
      clearTimeout(closeTimer);
      if (!open) openTimer = window.setTimeout(() => setOpen(true), el === trigger ? 60 : 0);
    });
    el.addEventListener("pointerleave", (ev) => { if ((ev as PointerEvent).pointerType === "mouse") closeSoon(); });
  }
  trigger.addEventListener("click", (e) => {
    e.preventDefault();
    /* клик сразу после открытия наведением не должен его захлопнуть */
    if (open && performance.now() - openedAt < 450) return;
    setOpen(!open);
    if (open && e.detail === 0) filterButtons[0]?.focus();
  });
  /* карточки открывают страницу кейса внутри сайта (caseView.ts) — меню закрываем сразу */
  panel.querySelectorAll(".work-menu__card").forEach((a) => {
    a.addEventListener("click", () => setOpen(false));
    a.addEventListener("pointerenter", (e) => { if ((e as PointerEvent).pointerType === "mouse") cue("hover", 0.5); });
  });
  /* v51: кнопка «На компьютере из нулевых» убрана по просьбе Никиты; компьютер по-прежнему открывается кликом по нему в сцене */
  panel.querySelector(".work-menu__all")?.addEventListener("click", () => {
    setOpen(false);
    cue("press", 0.7);
    opts.onAllCases?.();
  });
  document.addEventListener("pointerdown", (e) => {
    if (open && !panel.contains(e.target as Node) && !trigger.contains(e.target as Node)) setOpen(false);
  });
  document.addEventListener("keydown", (e) => {
    if (!open) return;
    if (e.key === "Escape") { setOpen(false); trigger.focus(); return; }
    /* стрелки ходят по всем элементам панели по порядку: категории, карточки, кнопки */
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      const focusables = [...panel.querySelectorAll<HTMLElement>("button, a")].filter((el) => !el.closest("[hidden]"));
      const i = focusables.indexOf(document.activeElement as HTMLElement);
      const next = e.key === "ArrowDown" ? (i + 1) % focusables.length : (i - 1 + focusables.length) % focusables.length;
      focusables[next]?.focus();
      e.preventDefault();
    }
  });
  addEventListener("resize", () => (open ? place() : float()));

  return { close: () => setOpen(false) };
}
