import { getCases, type CaseItem } from "../data/cases";
import { onLang } from "../i18n";

/* v103: глава «Кейсы» с указателем. Кейс показывает световой столб на живом лугу (scene/meadow/signpost3d.ts), а
   интерфейс собран вокруг него:
   - слева — список всех кейсов (прежний .cx-list), по центру экрана по вертикали;
   - справа, тоже по центру, — колонка: заголовок, превью и подписи (прежние .cx-title и .cx-facts);
   - превью: у кейсов с фильмом интерфейса — сам фильм (без звука, по кругу), у мобильных — экран в рамке телефона,
     у остальных — экран продукта в окне. Клик по превью открывает кейс.
   Летающая карточка и живые сцены кейсов в этом виде не нужны — их прячет cases-signpost.css. ?signpost=0 — как было.
   Номер показанного кейса уходит в сцену (onCase): по нему вырастает столб. */

const BASE = import.meta.env.BASE_URL;

/* фильмы интерфейса — те же, что на страницах кейсов (stories/*: film); постер — первый кадр */
const FILMS: Record<string, string> = { "grif-ai": "cases/grif-ai/film", community: "cases/community/film" };
const calm = matchMedia("(prefers-reduced-motion: reduce)").matches
  || !!(navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;

function preview(c: CaseItem) {
  const film = FILMS[c.id];
  if (film) {
    const poster = `${BASE}${film}-poster.webp`;
    return calm
      ? `<img class="pl-img pl-img--browser" src="${poster}" alt="" decoding="async">`
      : `<video class="pl-img pl-img--browser" muted loop playsinline autoplay preload="metadata" poster="${poster}" aria-hidden="true" tabindex="-1"><source src="${BASE}${film}.mp4" type="video/mp4"></video>`;
  }
  const s = c.look.screen;
  if (s) return `<img class="pl-img pl-img--${s.device}" src="${BASE}${s.src}" width="${s.w}" height="${s.h}" alt="" decoding="async">`;
  return `<img class="pl-img pl-img--obj" src="${BASE}cases/objects/${c.id}.webp" alt="" decoding="async">`;
}

export function initCasesSignpost(onCase: (i: number) => void) {
  const box = document.querySelector<HTMLElement>(".cx");
  const list = box?.querySelector<HTMLElement>(".cx-list");
  const title = box?.querySelector<HTMLElement>(".cx-title");
  const facts = box?.querySelector<HTMLElement>(".cx-facts");
  if (!box || !list || !title || !facts) return;
  document.body.classList.add("has-signpost");

  /* колонка: заголовок, превью, подписи */
  const right = document.createElement("div");
  right.className = "pl-right";
  const shot = document.createElement("a");
  shot.className = "pl-shot";
  box.appendChild(right);
  right.append(title, shot, facts);

  let cur = -1;
  const show = (i: number, force = false) => {
    if (i < 0 || (i === cur && !force)) return;
    cur = i;
    const c = getCases()[i];
    onCase(i);
    shot.href = `#/work/${c.id}`;
    shot.setAttribute("aria-label", c.title);
    shot.dataset.device = FILMS[c.id] ? "browser" : c.look.screen?.device ?? "obj";
    shot.innerHTML = preview(c);
    /* фильм играет, только пока глава на экране */
    const v = shot.querySelector("video");
    if (v && !box.classList.contains("is-live")) v.pause();
  };
  const read = () => {
    const on = list.querySelector<HTMLElement>(".cx-li.is-on");
    show(on ? Number(on.dataset.i) : 0);
  };
  new MutationObserver(read).observe(list, { subtree: true, attributes: true, attributeFilter: ["class"] });
  /* глава показалась или ушла — фильм играет или стоит */
  new MutationObserver(() => {
    const v = shot.querySelector("video");
    if (!v) return;
    if (box.classList.contains("is-live")) void v.play().catch(() => {}); else v.pause();
  }).observe(box, { attributes: true, attributeFilter: ["class"] });
  read();
  onLang(() => show(cur, true));
}
