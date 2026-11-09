import "./sound-button.css";
import { onLang, t } from "../../i18n";

/* v139: звук снаружи бургер-меню — пилюля «звук │ меню» в панели (выбор Никиты из четырёх вариантов стенда 09.11).
   Состояние звука по-прежнему ведёт soundToggle.ts через .sound-fab и класс body.sound-on: кнопка в панели только
   нажимает .sound-fab, как и строка «Звук» в меню. Пока звук играет, вместо динамика пляшут три столбика.
   Подпись «Звук · M» — при наведении и на 2,6 с после смены состояния. Стили — sound-button.css. */

export function initSoundButton() {
  const body = document.body;
  const btn = document.querySelector<HTMLButtonElement>(".m-bar__sound");
  const fab = document.querySelector<HTMLButtonElement>(".sound-fab");
  const tip = btn?.querySelector<HTMLElement>("[data-snd-tip]");
  if (!btn || !fab) return;

  btn.addEventListener("click", (e) => { e.preventDefault(); fab.click(); });

  let on = body.classList.contains("sound-on");
  let tellTimer = 0;
  const paint = (told = false) => {
    on = body.classList.contains("sound-on");
    btn.setAttribute("aria-pressed", String(on));
    btn.setAttribute("aria-label", t(on ? "nav.sound.on" : "nav.sound.off"));
    if (tip) tip.textContent = told ? t(on ? "sound.label.on" : "sound.tip.off") : t("menu.sound");
  };
  const tell = () => {
    paint(true);
    btn.classList.add("is-tell");
    clearTimeout(tellTimer);
    tellTimer = window.setTimeout(() => { btn.classList.remove("is-tell"); setTimeout(() => paint(false), 250); }, 2600);
  };
  new MutationObserver(() => {
    if (body.classList.contains("sound-on") !== on) tell();
  }).observe(body, { attributes: true, attributeFilter: ["class"] });
  onLang(() => paint(btn.classList.contains("is-tell")));
  paint();
}
