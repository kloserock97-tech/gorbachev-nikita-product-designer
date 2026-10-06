/* v88: живой логотип вместо ролика на обложке заметки (Shelf, Marathon).
   Ролик на телефоне не играет (v72: цикл видео поверх WebGL стоил кадров), а знак из SVG с CSS-анимацией почти
   ничего не стоит, чёткий на любом экране и двигается везде. Первый кадр анимации — собранный знак: он же
   неподвижный кадр при «уменьшить движение». Стили и ключевые кадры — note-logo.css.

   v91: у обоих проектов сменился фирменный стиль, обложки догнали его.
   Marathon — фирменная керамическая дорожка с абрикосовым шаром (брендовая серия трекера, public/ui/
   marathon-journey-*.webp) на кобальте. Дорожка прокладывается слева направо, как путь, шар появляется последним,
   дальше вся скульптура спокойно парит.
   Shelf — тот же язык: синий фон полки и знак полки из белых «керамических» плашек с толщиной и тенью. Предметы
   уходят с полки, доска появляется заново, предметы по очереди приземляются, высокий подпрыгивает. */
import "./hero/note-logo.css";

export type NoteLogo = "shelf" | "marathon";

const BASE = import.meta.env.BASE_URL;

/* у каждой плашки — лицо и нижняя кромка чуть темнее: так плоский знак читается объёмом, как керамика Marathon */
const plate = (cls: string, x: number, y: number, w: number, h: number, r: number) =>
  `<g class="${cls}"><rect class="nlogo__edge" x="${x}" y="${y + 0.7}" width="${w}" height="${h}" rx="${r}"/><rect class="nlogo__face" x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}"/></g>`;

const SHELF = `<svg viewBox="0 0 20 20" class="nlogo__mark">
  ${plate("nlogo__a", 3, 3, 5, 7, 1.5)}
  ${plate("nlogo__b nlogo__soft", 10, 5.5, 7, 4.5, 1.5)}
  ${plate("nlogo__plank", 2, 11.5, 16, 1.5, 0.75)}
  ${plate("nlogo__c nlogo__soft", 4, 14.5, 8, 3, 1.5)}
</svg>`;

const MARATHON = `<span class="nlogo__stage">
  <i class="nlogo__shadow"></i>
  <img class="nlogo__art" src="${BASE}ui/marathon-journey-960.webp" srcset="${BASE}ui/marathon-journey-480.webp 480w, ${BASE}ui/marathon-journey-960.webp 960w" sizes="(max-width: 700px) 70vw, 480px" width="960" height="533" alt="" decoding="async" draggable="false">
</span>`;

/** разметка живого логотипа: слой на всю обложку, поверх картинки-заглушки */
export function noteLogo(kind: NoteLogo) {
  return `<span class="nlogo nlogo--${kind}" aria-hidden="true">${kind === "shelf" ? SHELF : MARATHON}</span>`;
}
