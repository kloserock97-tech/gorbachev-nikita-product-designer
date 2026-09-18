/* Док: куда ведут пункты (v24). Док гасит клик по пункту ради анимации активного пункта (hero/heroUi.ts) — из-за
   этого Hill, Notes и Say hi никуда не вели (нагрузочный прогон / взгляд рекрутера: «Say hi» не открывал
   контакты). Work — выпадающий список кейсов (workMenu.ts), звук — soundToggle.ts. */
import { cue } from "../audio/bus";

type Nav = { top: () => void; contact: () => void };

export function initDockNav(nav: Nav) {
  const dock = document.querySelector<HTMLElement>(".dock");
  if (!dock) return;
  const items = [...dock.querySelectorAll<HTMLAnchorElement>("a.dock-item")];
  const hill = items.find((a) => !a.classList.contains("dock-mark") && a.getAttribute("href") === "#");
  const mark = dock.querySelector<HTMLAnchorElement>(".dock-mark");
  const notes = dock.querySelector<HTMLAnchorElement>("a[href='#notes']");
  const hi = dock.querySelector<HTMLAnchorElement>("a[href='#contact']");

  const on = (el: HTMLElement | null | undefined, fn: () => void) => el?.addEventListener("click", (e) => { e.preventDefault(); cue("press", 0.6); fn(); });
  on(hill, nav.top);
  on(mark, nav.top);
  on(hi, nav.contact);
  /* Notes — оборот карточки «How the hill was grown» на первом экране */
  on(notes, () => {
    nav.top();
    const knob = document.querySelector<HTMLButtonElement>(".knob--note");
    const card = document.querySelector<HTMLElement>(".card--stove");
    const open = () => { if (!card?.classList.contains("is-open")) knob?.click(); };
    /* клик по доку закрыл бы оборот обработчиком «клик мимо» — открываем после него */
    window.setTimeout(open, scrollY > 40 ? 900 : 60);
  });
}
