/* Язык страницы (v27). Язык меняется без перезагрузки: словари подставляют строки, модули перерисовывают
   свою разметку, холм продолжает крутиться.
   v104: переключатель вынесен из дока в отдельную пару кнопок RU | EN слева вверху (.top-lang, ui/hero/notch.css);
   текущий язык — нажатая кнопка. Рядом ссылка на лёгкую версию — она открывается на том же языке. */
import { getLang, onLang, setLang, type Lang } from "../i18n";
import { cue } from "../audio/bus";

export function initLangToggle() {
  const buttons = [...document.querySelectorAll<HTMLButtonElement>(".top-lang [data-lang-set]")];
  const lite = document.querySelector<HTMLAnchorElement>(".top-lite");
  const paint = () => {
    buttons.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.langSet === getLang())));
    if (lite) lite.href = `lite.html?lang=${getLang()}`;
  };
  buttons.forEach((b) => b.addEventListener("click", () => {
    if (b.dataset.langSet === getLang()) return;
    cue("toggle-on", 0.8);
    setLang(b.dataset.langSet as Lang);
  }));
  onLang(paint);
  paint();
}
