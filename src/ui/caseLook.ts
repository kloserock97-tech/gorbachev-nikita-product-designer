/* v64: вид кейса — светлая сцена в его цвет и предмет без фона. Один и тот же вид рисуют карточка в ленте,
   меню «Кейсы», герой страницы кейса и блок «следующий кейс», поэтому разметка и переменные собраны здесь. */
import { caseObject, type CaseItem } from "../data/cases";

const BASE = import.meta.env.BASE_URL;
const pct = (v: number) => `${(v * 100).toFixed(1)}%`;

/** v65: внутри кейса цвет один на всех — графит на холодном светло-сером, как у Apple. Шесть палитр на длинной
   странице спорили с экранами продукта и между собой; цвет кейса теперь несёт только предмет-обложка.
   Карточка в ленте и меню «Кейсы» остаются в цвете кейса (tone "color"). */
export const MONO = { stage: ["#f0f0f3", "#e2e2e7"], ink: "#1d1d1f", accent: "#1d1d1f" } as const;
export type LookTone = "color" | "mono";

/** переменные вида для атрибута style: тона сцены, чернила, акцент и раскладка предмета */
export const lookVars = (c: CaseItem, tone: LookTone = "color") => {
  const { object: o } = c.look;
  const { stage, ink, accent } = tone === "mono" ? MONO : c.look;
  /* фирменная подложка — только в цветном виде: на странице кейса всё графитовое, и картинка там спорила бы */
  const back = tone === "color" && c.look.backdrop ? `;--backdrop:url("${BASE}${c.look.backdrop}")` : "";
  return `--s1:${stage[0]};--s2:${stage[1]};--ink:${ink};--accent:${accent};--ow:${pct(o.w)};--ox:${pct(o.x)};--oy:${pct(o.y)};--oar:${o.ratio.toFixed(4)}${back}`;
};

/** предмет кейса: avif, для старых браузеров webp. Размеры нужны, чтобы место под картинку было известно заранее */
export const objectPicture = (c: CaseItem, cls: string, eager = false) => {
  const w = 900, h = Math.round(900 / c.look.object.ratio);
  /* avif вдвое легче, но он есть не у каждого предмета; источник ставим только там, где файл правда лежит,
     иначе <picture> покажет пустоту: на <img> он в этом случае не откатывается */
  const avif = c.look.object.avif === false ? "" : `<source type="image/avif" srcset="${BASE}${caseObject(c.id)}">`;
  return `<picture class="${cls}" aria-hidden="true">${avif}<img src="${BASE}${caseObject(c.id, "webp")}" alt="" width="${w}" height="${h}" decoding="async" loading="${eager ? "eager" : "lazy"}" draggable="false"></picture>`;
};

/* v68: на обложке видно, что внутри и на чём это работает.
   Раньше карточка показывала только вырезанный предмет — красиво, но по ней нельзя было сказать, веб это,
   мобильное приложение или дашборд. Совет с разбора портфолио ровно об этом: обложка обязана показывать
   интерфейс и платформу, а не абстракцию. Поэтому рядом с предметом теперь стоит настоящий экран продукта
   в рамке: у веба — полоска браузера, у мобильного — силуэт телефона. Форма рамки и есть ответ «на чём».
   Экран берётся уменьшенной копией (public/cases/thumbs, tools/make-webp.mjs): на карточке он занимает
   пару сотен пикселей, и тащить ради этого полноразмерный снимок незачем. */
export const caseThumb = (id: string) => `cases/thumbs/${id}.webp`;

/** настоящий экран продукта в рамке устройства; null — у кейса открытых экранов нет */
export const screenDevice = (c: CaseItem, cls: string) => {
  const s = c.look.screen;
  if (!s) return "";
  const bar = s.device === "browser" ? `<i class="${cls}-bar" aria-hidden="true"></i>` : "";
  /* адрес лежит в data-src, а не в src: панель меню висит в разметке скрытой, и «ленивая» загрузка её не
     пропускает — картинки поехали бы вместе с первым экраном. Кто их показывает, тот и включает (warmScreens) */
  return `<span class="${cls} ${cls}--${s.device}" aria-hidden="true">${bar}<img data-src="${BASE}${caseThumb(c.id)}" alt="" width="${s.w}" height="${s.h}" decoding="async" draggable="false"></span>`;
};

/* v68: знак продукта у заголовка кейса. Знаки лежали в public/cases/brands и нигде не показывались, хотя
   именно они за долю секунды отвечают на вопрос «что это за продукт» — раньше, чем прочитан заголовок.
   Высоту задаёт CSS, поэтому знаки разной формы (широкое слово «Сбербанк» и квадратные иконки) стоят в одном
   ряду ровно. Знак декоративный: название продукта рядом написано словами, и читалке экрана он не нужен. */
export const brandMark = (c: CaseItem, cls: string) =>
  c.brand ? `<img class="${cls}" src="${BASE}cases/brands/${c.brand}" alt="" decoding="async" draggable="false" aria-hidden="true">` : "";

/** включить экраны внутри блока: вызывать, когда их вот-вот увидят (курсор дошёл до пункта, меню открылось) */
export const warmScreens = (root: ParentNode) => {
  for (const img of root.querySelectorAll<HTMLImageElement>("img[data-src]")) {
    img.src = img.dataset.src!;
    delete img.dataset.src;
  }
};

export const goArrow = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7"/><path d="M8.5 7H17v8.5"/></svg>`;
