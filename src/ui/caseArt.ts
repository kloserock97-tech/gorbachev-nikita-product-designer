/* v74: мокап продукта по правилам бренда Яндекса (teambook.yandex.ru/application/mockup) — один на главу
   «Кейсы» и на шапку страницы кейса. Образец — карточка GRIF AI, которую прислал Никита.

   Что взято из правил:
   - сетка из микромодулей: 60 штук по узкой стороне макета при любом формате. Здесь микромодуль --m считается
     от контейнера (container-type: size), поэтому вся композиция одинакова в любом размере;
   - крупная фигура — скругление 5 модулей; фигура-акцент — сдвиг 2 модуля от крупной, скругление в четверть
     от её скругления;
   - овальная акцентная плашка высотой 6 модулей заходит на фигуру на 1 модуль;
   - от кромки фигуры до содержимого — не меньше 3 модулей.
   Остальное — приём образца: интерфейс стоит в окне браузера macOS, развёрнутом в перспективе, и срезан краем
   крупной фигуры; у мобильных кейсов — экран приложения; у кейса без экранов — его предмет. */
import type { CaseItem } from "../data/cases";
import { shots2x } from "../data/shots2x";
import { lookVars, objectPicture } from "./caseLook";
import "./caseArt.css";

const BASE = import.meta.env.BASE_URL;
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
/* стрелки «назад / вперёд» в строке окна — как у Safari: без них строка читалась пустой полосой */
const nav = `<svg class="ya-nav" viewBox="0 0 28 12" aria-hidden="true"><path d="M6 2 2 6l4 4"/><path d="M18 2l4 4-4 4" opacity=".45"/></svg>`;
const arrow = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15"/><path d="m13 6 6 6-6 6"/></svg>`;

/** srcset из манифеста двойных снимков: мокап крупный, на экране с DPR 2 нужен файл вдвое больше */
const hi = (src: string, sizes: string) => {
  const w = shots2x.get(src);
  return w ? ` srcset="${BASE}${src} ${w}w, ${BASE}${src.replace(/\.webp$/, "@2x.webp")} ${w * 2}w" sizes="${sizes}"` : "";
};

export type ArtOptions = {
  /** "hero" — шапка кейса: фигура уходит за край сцены; "fit" — глава «Кейсы»: вся композиция внутри рамки */
  mode: "hero" | "fit";
  /** подпись для чтения с экрана; пусто — картинка декоративная */
  label?: string;
  /** грузить снимок сразу (шапка) или по data-src, когда его вот-вот увидят (глава) */
  eager?: boolean;
  sizes?: string;
};

export function caseArt(c: CaseItem, o: ArtOptions) {
  const s = c.look.screen;
  const kind = s ? s.device : "solo";
  const alt = o.label ? esc(o.label) : "";
  const src = (path: string) => (o.eager ? `src="${BASE}${path}"${hi(path, o.sizes ?? "60vw")}` : `data-src="${BASE}${path}"`);
  const img = s ? `<img class="ya-shot" ${src(s.src)} width="${s.w}" height="${s.h}" alt="${alt}" decoding="async" draggable="false"${o.eager ? ` fetchpriority="high"` : ""}>` : "";
  const screen = !s
    ? `<span class="ya-solo">${objectPicture(c, "ya-obj", o.eager)}</span>`
    : s.device === "phone"
      ? `<span class="ya-screen ya-screen--phone">${img}<i class="ya-glare" aria-hidden="true"></i></span>`
      : `<span class="ya-screen"><span class="ya-chrome" aria-hidden="true"><i></i><i></i><i></i>${nav}<span>${esc(c.title)}</span></span>${img}<i class="ya-glare" aria-hidden="true"></i></span>`;
  return `<figure class="ya ya--${o.mode} ya--${kind}" style="${lookVars(c)}"${alt ? "" : ` aria-hidden="true"`}>
    <i class="ya-accent" aria-hidden="true"></i>
    <span class="ya-shape"><span class="ya-glow" aria-hidden="true"></span>${screen}</span>
    <span class="ya-tag" aria-hidden="true">${arrow}</span>
  </figure>`;
}
