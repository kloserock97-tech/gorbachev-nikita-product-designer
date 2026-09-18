/* Футер: контакты и ссылки навигации (вынесено из storyHero в v24 — работает и в лёгкой
   версии без 3D). Появление футера по скроллу — в storyHero.

   v27: кнопок стало меньше, и каждая говорит, что делает. «Написать письмо» открывает почтовую
   программу, Telegram ведёт в Telegram, а сам адрес — кнопка: нажал, адрес в буфере. Раньше рядом
   с адресом стояла отдельная кнопка «Copy», и по ней было непонятно, что именно копируется. */
import { cue } from "../audio/bus";
import { onLang, t } from "../i18n";

export function initFooter({ go }: { go: (to: "cases" | "about" | "top") => void }) {
  const footer = document.querySelector<HTMLElement>(".site-footer");
  if (!footer) return;
  const copy = footer.querySelector<HTMLButtonElement>(".sf-copy");
  const label = copy?.querySelector<HTMLElement>(".sf-copy-l");
  const mail = copy?.dataset.copy ?? "";
  let back = 0;

  const rest = () => {
    copy?.classList.remove("is-done");
    if (label) label.textContent = mail;
    copy?.setAttribute("aria-label", `${t("footer.copy")}: ${mail}`);
  };
  rest();
  onLang(rest);

  copy?.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(mail);
      cue("toggle-on", 0.7);
      copy.classList.add("is-done");
      if (label) label.textContent = t("footer.copied");
      clearTimeout(back);
      back = window.setTimeout(rest, 1800);
    } catch {
      location.href = `mailto:${mail}`; // буфер закрыт политикой браузера — открываем почту
    }
  });

  footer.querySelectorAll<HTMLAnchorElement>("[data-go]").forEach((a) => a.addEventListener("click", (e) => {
    e.preventDefault();
    cue("press", 0.7);
    const to = a.dataset.go;
    go(to === "cases" ? "cases" : to === "about" ? "about" : "top");
  }));
}
