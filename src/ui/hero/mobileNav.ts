/* v107: панель телефона по картинке Никиты — знак слева, язык и меню справа (стили — mobile-nav.css).
   Переходы не дублируются: пункты меню нажимают те же пункты чёлки (dockNav.ts) и кнопку «Смотреть кейсы», звук —
   ту же кнопку звука (soundToggle.ts), которая на узком экране спрятана. Меню закрывается выбором пункта, Esc и
   нажатием мимо списка. */
import { getLang, onLang, otherLang, setLang, t } from "../../i18n";
import { cue } from "../../audio/bus";

export function initMobileNav() {
  const body = document.body;
  const bar = document.querySelector<HTMLElement>(".m-bar");
  const menu = document.querySelector<HTMLElement>(".m-menu");
  const burger = bar?.querySelector<HTMLButtonElement>(".m-bar__burger");
  if (!bar || !menu || !burger) return;
  const dock = (name: string) => document.querySelector<HTMLElement>(`.dock [data-nav='${name}']`);

  const setOpen = (open: boolean) => {
    if (open === body.classList.contains("m-menu-open")) return;
    body.classList.toggle("m-menu-open", open);
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", t(open ? "nav.menu.close" : "nav.menu"));
    menu.inert = !open;
    cue("press", 0.5);
  };
  burger.addEventListener("click", () => setOpen(!body.classList.contains("m-menu-open")));
  menu.addEventListener("click", (e) => { if (!(e.target as HTMLElement).closest(".m-menu__in")) setOpen(false); });
  addEventListener("keydown", (e) => { if (e.key === "Escape") setOpen(false); });

  bar.querySelector(".m-bar__mark")?.addEventListener("click", (e) => { e.preventDefault(); setOpen(false); dock("home")?.click(); });
  bar.querySelector(".m-bar__lang")?.addEventListener("click", () => { cue("toggle-on", 0.8); setLang(otherLang()); });

  menu.querySelectorAll<HTMLAnchorElement>("[data-m-go]").forEach((a) => a.addEventListener("click", (e) => {
    e.preventDefault();
    setOpen(false);
    const go = a.dataset.mGo!;
    if (go === "work") document.querySelector<HTMLElement>("[data-action='explore']")?.click();
    else dock(go)?.click();
  }));

  /* звук: состояние берём с body.sound-on, которое пишет soundToggle; когда играет — под строкой название трека */
  const sound = menu.querySelector<HTMLButtonElement>(".m-menu__sound");
  const soundLabel = sound?.querySelector<HTMLElement>("[data-m-sound]");
  const lite = menu.querySelector<HTMLAnchorElement>(".m-menu__lite");
  const langs = menu.querySelectorAll<HTMLButtonElement>("[data-m-lang]");
  const paint = () => {
    const on = body.classList.contains("sound-on");
    sound?.setAttribute("aria-pressed", String(on));
    sound?.setAttribute("aria-label", t(on ? "nav.sound.on" : "nav.sound.off"));
    if (soundLabel) soundLabel.textContent = on ? `${t("menu.sound.on")} · Northern Resonance` : t("menu.sound.off");
    langs.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.mLang === getLang())));
    if (lite) lite.href = `lite.html?lang=${getLang()}`;
  };
  sound?.addEventListener("click", () => document.querySelector<HTMLButtonElement>(".sound-fab")?.click());
  langs.forEach((b) => b.addEventListener("click", () => {
    const next = b.dataset.mLang as ReturnType<typeof getLang>;
    if (next === getLang()) return;
    cue("toggle-on", 0.8);
    setLang(next);
  }));
  new MutationObserver(paint).observe(body, { attributes: true, attributeFilter: ["class"] });
  onLang(paint);
  paint();

  /* кружок внизу первого экрана — на экран ниже, к карточке кейса и дальше в историю */
  document.querySelector(".m-down")?.addEventListener("click", () => scrollBy({ top: innerHeight * 0.85, behavior: "smooth" }));
}
