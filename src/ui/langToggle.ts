/* Переключатель языка в доке (v27). Подпись — язык, на который переключит: стоишь на английском,
   на кнопке «RU». Язык меняется без перезагрузки: словари подставляют строки, модули перерисовывают
   свою разметку, холм продолжает крутиться. */
import { onLang, otherLang, setLang, t } from "../i18n";
import { cue } from "../audio/bus";

export function initLangToggle() {
  const btn = document.querySelector<HTMLButtonElement>(".dock-lang");
  if (!btn) return;
  const label = btn.querySelector<HTMLElement>(".dock-lang-l");
  const paint = () => {
    if (label) label.textContent = t("nav.lang.short");
    btn.setAttribute("aria-label", t("nav.lang"));
  };
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    cue("toggle-on", 0.8);
    setLang(otherLang());
  });
  onLang(paint);
  paint();
}
