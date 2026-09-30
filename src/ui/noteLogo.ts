/* v88: живой логотип вместо ролика на обложке заметки (Shelf, Marathon).
   Ролик на телефоне не играет (v72: цикл видео поверх WebGL стоил кадров), а знак из SVG с CSS-анимацией почти
   ничего не стоит, чёткий на любом экране и двигается везде. Первый кадр анимации — собранный знак: он же
   неподвижный кадр при «уменьшить движение». Стили и ключевые кадры — note-logo.css.

   Shelf — знак полки: два предмета на доске и один под ней. Предметы уходят с полки, доска появляется заново,
   предметы по очереди приземляются, высокий подпрыгивает (так же знак ведёт себя на самом сайте полки).
   Marathon — два кольца недели в цветах двух людей, как на экране «Сегодня»: заполняются до цели, и
   галочка закрывает неделю. */
import "./hero/note-logo.css";

export type NoteLogo = "shelf" | "marathon";

const SHELF = `<svg viewBox="0 0 20 20" class="nlogo__mark">
  <rect class="nlogo__a" x="3" y="3" width="5" height="7" rx="1.5"/>
  <rect class="nlogo__b" x="10" y="5.5" width="7" height="4.5" rx="1.5"/>
  <rect class="nlogo__plank" x="2" y="11.5" width="16" height="1.5" rx=".75"/>
  <rect class="nlogo__c" x="4" y="14.5" width="8" height="3" rx="1.5"/>
</svg>`;

const MARATHON = `<svg viewBox="0 0 100 100" class="nlogo__mark">
  <circle class="nlogo__track nlogo__track--out" cx="50" cy="50" r="38"/>
  <circle class="nlogo__track nlogo__track--in" cx="50" cy="50" r="24"/>
  <g transform="rotate(-90 50 50)">
    <circle class="nlogo__ring nlogo__ring--out" cx="50" cy="50" r="38" pathLength="100"/>
    <circle class="nlogo__ring nlogo__ring--in" cx="50" cy="50" r="24" pathLength="100"/>
  </g>
  <path class="nlogo__check" d="M42 50.5l5.5 5.5 11-12"/>
</svg>`;

/** разметка живого логотипа: слой на всю обложку, поверх картинки-заглушки */
export function noteLogo(kind: NoteLogo) {
  return `<span class="nlogo nlogo--${kind}" aria-hidden="true">${kind === "shelf" ? SHELF : MARATHON}</span>`;
}
