import { getCases, type CaseItem } from "../data/cases";
import { onLang } from "../i18n";
import { bodyHas, onBodyState } from "../lib/bodyState";

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
/* v118 (замер): превью шириной ~400 px играло полный фильм 1920×1080 — 2,8 и 4,4 МБ на одну главу. Теперь лёгкие копии
   640×360 из карточки холма (ui/card-<id>, 0,3–0,6 МБ): webm для Chrome и Firefox, mp4 для Safari */
const FILMS: Record<string, string> = { "grif-ai": "ui/card-grif-ai", community: "ui/card-community" };
const calm = matchMedia("(prefers-reduced-motion: reduce)").matches
  || !!(navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;

function preview(c: CaseItem) {
  const film = FILMS[c.id];
  if (film) {
    const poster = `${BASE}${film}.webp`;
    return calm
      ? `<img class="pl-img pl-img--browser" src="${poster}" alt="" decoding="async">`
      /* v103: без autoplay и с preload="none". Список собирается при загрузке, и autoplay скачивал фильм первого кейса
         (2,8 МБ — больше половины веса страницы) на первом экране, когда до главы ещё далеко. Играет его sync() */
      : `<video class="pl-img pl-img--browser" muted loop playsinline preload="none" poster="${poster}" aria-hidden="true" tabindex="-1"><source src="${BASE}${film}.webm" type="video/webm"><source src="${BASE}${film}.mp4" type="video/mp4"></video>`;
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

  /* фильм играет, только пока глава на экране: не под страницей кейса и не в скрытой вкладке */
  const sync = () => {
    const v = shot.querySelector("video");
    if (!v) return;
    if (box.classList.contains("is-live") && !bodyHas("case-open") && !document.hidden) void v.play().catch(() => {});
    else v.pause();
  };

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
    sync();
  };
  const read = () => {
    const on = list.querySelector<HTMLElement>(".cx-li.is-on");
    show(on ? Number(on.dataset.i) : 0);
  };
  new MutationObserver(read).observe(list, { subtree: true, attributes: true, attributeFilter: ["class"] });
  /* глава показалась или ушла, открылся кейс, вкладку спрятали — фильм играет или стоит */
  new MutationObserver(sync).observe(box, { attributes: true, attributeFilter: ["class"] });
  read();
  onBodyState(sync);
  document.addEventListener("visibilitychange", sync);
  onLang(() => show(cur, true));
}
