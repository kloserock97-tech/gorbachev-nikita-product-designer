/* Док: куда ведут пункты и какой из них активен.
   v24: док гасит клик по пункту ради анимации (hero/heroUi.ts) — поэтому переходы делаются здесь.
   v45: знак (кит) — в начало; «Обо мне» — к экрану About (раньше тут был «Холм», который дублировал знак);
   «Эксперименты» — к своим WebGL-проектам после кейсов (раньше «Заметки» открывали оборот карточки на первом
   экране, и пункт с таким именем никуда не вёл по смыслу). Активный пункт теперь не «последний нажатый»,
   а раздел, на котором человек находится: его сообщает скролл-история (track) или прокрутка лёгкой версии.
   Work — выпадающий список кейсов (workMenu.ts). */
import { cue } from "../audio/bus";

export type DockSection = "home" | "about" | "work" | "lab" | "contact";
type Nav = { top: () => void; about: () => void; lab: () => void; contact: () => void };

export function initDockNav(nav: Nav) {
  const dock = document.querySelector<HTMLElement>(".dock");
  if (!dock) return null;
  const item = (name: DockSection) => dock.querySelector<HTMLAnchorElement>(`[data-nav='${name}']`);
  const on = (el: HTMLElement | null, fn: () => void) => el?.addEventListener("click", (e) => { e.preventDefault(); cue("press", 0.6); fn(); });
  on(item("home"), nav.top);
  on(item("about"), nav.about);
  on(item("lab"), nav.lab);
  on(item("contact"), nav.contact);

  let shown: DockSection | null = null;
  const track = (section: DockSection) => {
    if (section === shown) return;
    shown = section;
    dock.querySelectorAll<HTMLElement>("[data-nav]").forEach((el) => {
      const active = el.dataset.nav === section && section !== "home";
      el.classList.toggle("is-active", active);
      if (active) el.setAttribute("aria-current", "true");
      else el.removeAttribute("aria-current");
    });
  };
  track("home");
  return { track };
}

/** лёгкая версия: страница прокручивается сама — активен раздел, который дошёл до верхней трети окна */
export function trackByScroll(track: (s: DockSection) => void) {
  const marks: [DockSection, string][] = [["contact", "#contact"], ["lab", "#notes"], ["work", "#work"], ["about", ".story-hero"]];
  let raf = 0;
  const pick = () => {
    raf = 0;
    const line = innerHeight * 0.4;
    for (const [name, sel] of marks) {
      const el = document.querySelector<HTMLElement>(sel);
      if (el && el.offsetParent !== null && el.getBoundingClientRect().top <= line) return track(name);
    }
    track("home");
  };
  addEventListener("scroll", () => { if (!raf) raf = requestAnimationFrame(pick); }, { passive: true });
  pick();
}
