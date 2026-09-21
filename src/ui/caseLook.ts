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
  return `--s1:${stage[0]};--s2:${stage[1]};--ink:${ink};--accent:${accent};--ow:${pct(o.w)};--ox:${pct(o.x)};--oy:${pct(o.y)};--oar:${o.ratio.toFixed(4)}`;
};

/** предмет кейса: avif, для старых браузеров webp. Размеры нужны, чтобы место под картинку было известно заранее */
export const objectPicture = (c: CaseItem, cls: string, eager = false) => {
  const w = 900, h = Math.round(900 / c.look.object.ratio);
  return `<picture class="${cls}" aria-hidden="true"><source type="image/avif" srcset="${BASE}${caseObject(c.id)}"><img src="${BASE}${caseObject(c.id, "webp")}" alt="" width="${w}" height="${h}" decoding="async" loading="${eager ? "eager" : "lazy"}" draggable="false"></picture>`;
};

export const goArrow = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7"/><path d="M8.5 7H17v8.5"/></svg>`;
