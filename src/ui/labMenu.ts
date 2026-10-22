/* v111 (Никита): выпадающий список у пункта «Пэт-проекты» — как у «Кейсов» (workMenu.ts): та же тёмная панель и карточки,
   без категорий. Карточка открывает демо в новой вкладке, кнопка внизу ведёт к главе пэт-проектов в истории.
   Открывается наведением (мышь) и кликом, закрывается, когда курсор ушёл с пункта и панели, по Esc и кликом мимо.
   На узком экране выпадашки нет — пункт ведёт прямо к главе (как раньше, через dockNav.ts). */
import notes from "../data/notes";
import { cue } from "../audio/bus";
import { onLang, t, type Key } from "../i18n";

const BASE = import.meta.env.BASE_URL;
const arrow = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17 17 7"/><path d="M8.5 7H17v8.5"/></svg>`;

export function initLabMenu(opts: { onAll: () => void }) {
  const trigger = document.querySelector<HTMLAnchorElement>(".dock a[data-nav='lab']");
  const wrap = document.querySelector<HTMLElement>(".dock-wrap");
  if (!trigger || !wrap) return;
  const wide = () => innerWidth > 900;

  const panel = document.createElement("div");
  panel.className = "work-menu work-menu--lab work-menu--float";
  panel.id = "lab-menu";
  panel.setAttribute("role", "dialog");
  panel.innerHTML = `
    <div class="work-menu__body">
      <div class="work-menu__pane">
        <ul class="work-menu__grid">
          ${notes.map((n, i) => `
            <li style="--i:${i}">
              <a class="work-menu__card" href="${n.links?.demo ?? "#notes"}"${n.links ? ` target="_blank" rel="noopener"` : ""} data-id="${n.id}">
                <span class="work-menu__thumb"><img class="work-menu__cover" src="${BASE}${n.image}" alt="" loading="lazy" decoding="async" draggable="false"><span class="work-menu__go">${arrow}</span></span>
                <span class="work-menu__name"></span>
                <span class="work-menu__sub"></span>
              </a>
            </li>`).join("")}
        </ul>
      </div>
    </div>
    <div class="work-menu__foot">
      <p class="work-menu__note"></p>
      <div class="work-menu__actions">
        <button class="work-menu__all" type="button"><span class="work-menu__all-l"></span> <span aria-hidden="true">→</span></button>
      </div>
    </div>`;
  document.body.appendChild(panel);
  trigger.setAttribute("aria-haspopup", "dialog");
  trigger.setAttribute("aria-expanded", "false");
  trigger.setAttribute("aria-controls", panel.id);

  const paint = () => {
    panel.setAttribute("aria-label", t("nav.lab"));
    panel.querySelectorAll<HTMLAnchorElement>(".work-menu__card").forEach((a) => {
      a.querySelector(".work-menu__name")!.textContent = t(`notes.${a.dataset.id}.title` as Key);
      a.querySelector(".work-menu__sub")!.textContent = t(`notes.${a.dataset.id}.kind` as Key);
    });
    panel.querySelector(".work-menu__note")!.textContent = t("lab.note");
    panel.querySelector(".work-menu__all-l")!.textContent = t("lab.all");
  };
  paint();
  onLang(paint);

  /* под пунктом, по его центру, не вылезая за край экрана — как у «Кейсов» */
  const place = () => {
    const tr = trigger.getBoundingClientRect();
    const pw = panel.offsetWidth;
    const centre = tr.left + tr.width / 2;
    const left = Math.min(Math.max(centre - pw / 2, 16), innerWidth - pw - 16);
    panel.style.left = `${left}px`;
    panel.style.top = `${wrap.getBoundingClientRect().bottom + 10}px`;
    panel.style.setProperty("--origin-x", `${centre - left}px`);
  };

  let open = false, openedAt = 0, closeTimer = 0, openTimer = 0;
  const setOpen = (on: boolean) => {
    clearTimeout(closeTimer);
    clearTimeout(openTimer);
    if (on === open) return;
    open = on;
    cue(on ? "open" : "close", 0.7);
    if (on) { place(); openedAt = performance.now(); }
    panel.classList.toggle("is-open", on);
    document.body.classList.toggle("lab-open", on);
    trigger.setAttribute("aria-expanded", String(on));
  };
  const closeSoon = () => { clearTimeout(openTimer); clearTimeout(closeTimer); closeTimer = window.setTimeout(() => setOpen(false), 220); };

  const hoverable = matchMedia("(hover: hover) and (pointer: fine)");
  for (const el of [trigger, panel]) {
    el.addEventListener("pointerenter", (ev) => {
      if ((ev as PointerEvent).pointerType !== "mouse" || !hoverable.matches || !wide()) return;
      clearTimeout(closeTimer);
      if (!open) openTimer = window.setTimeout(() => setOpen(true), el === trigger ? 60 : 0);
    });
    el.addEventListener("pointerleave", (ev) => { if ((ev as PointerEvent).pointerType === "mouse") closeSoon(); });
  }
  /* на широком экране клик по пункту открывает панель, а не уводит к главе: переход dockNav гасим (обработчик
     в фазе захвата срабатывает раньше его) */
  trigger.addEventListener("click", (e) => {
    if (!wide()) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    if (open && performance.now() - openedAt < 450) return;
    setOpen(!open);
  }, { capture: true });
  panel.querySelectorAll<HTMLAnchorElement>(".work-menu__card").forEach((a) => {
    a.addEventListener("click", (e) => {
      setOpen(false);
      if (!a.target) { e.preventDefault(); opts.onAll(); }
    });
    a.addEventListener("pointerenter", (e) => { if ((e as PointerEvent).pointerType === "mouse") cue("hover", 0.5); });
  });
  panel.querySelector(".work-menu__all")?.addEventListener("click", () => { setOpen(false); cue("press", 0.7); opts.onAll(); });
  document.addEventListener("pointerdown", (e) => {
    if (open && !panel.contains(e.target as Node) && !trigger.contains(e.target as Node)) setOpen(false);
  });
  document.addEventListener("keydown", (e) => { if (open && e.key === "Escape") { setOpen(false); trigger.focus(); } });
  addEventListener("resize", () => { if (open) wide() ? place() : setOpen(false); });
}
