/* 26.10: сцены «Контекста картинками» для кейса moderator-dashboard (ключи — в context.art данных кейса). Сцена — HTML-строка
   внутри плитки .ca-tile: размеры в cqw, общие детали (.ca-win, .ca-line…) — из context-art.css, свои — в moderator-dashboard.css.
   Движение — только transform/opacity, старт по .ca-card.is-in, «меньше движения» — конечный вид.
   Язык сцен — сам кабинет из макетов: белые окна, розовые шапки таблицы, чёрные кнопки-пилюли, зелёная точка «Новый». */
import "./moderator-dashboard.css";

const row = (i: number, w: number, cls = "") => `<div class="ca-md-row${cls}" style="--i:${i}"><i class="ca-md-dot"></i><i class="ca-md-l" style="--w:${w}%"></i><i class="ca-md-l ca-md-l--s"></i></div>`;
const cursor = `<svg class="ca-md-cursor" viewBox="0 0 16 20" aria-hidden="true"><path d="M1.5 1.5v15l4.2-3.9 2.9 6.2 2.6-1.2-2.9-6.1 5.9-.4Z"/></svg>`;

export const scenes: Record<string, () => string> = {
  /* сразу видно, что ждёт проверки: вкладки статусов, у первой — метка, строки «Новый» въезжают по очереди */
  "md-queue": () => `
    <div class="ca-md-win ca-md-win--queue">
      <div class="ca-md-tabs"><i class="is-on"><b class="ca-md-badge"></b></i><i></i><i></i><i></i></div>
      ${row(0, 52)}${row(1, 38)}${row(2, 46)}
    </div>`,
  /* очевидное решается в строке: курсор подъезжает к «Одобрить», нажатие, у строки появляется отметка */
  "md-inline": () => `
    <div class="ca-md-win ca-md-win--inline">
      ${row(0, 40, " is-dim")}
      <div class="ca-md-row is-hot"><i class="ca-md-dot"></i><i class="ca-md-l" style="--w:34%"></i><span class="ca-md-acts"><i class="ca-md-btn ca-md-btn--ghost"></i><i class="ca-md-btn"><b class="ca-md-ok"></b></i></span></div>
      ${row(2, 46, " is-dim")}
    </div>
    ${cursor}`,
  /* спорное — на одном экране: публикация, автор с кармой, ветка ответов и жалобы собираются вместе */
  "md-context": () => `
    <div class="ca-md-win ca-md-win--page">
      <div class="ca-md-post" style="--i:0"><i class="ca-md-pic"></i><i class="ca-md-l" style="--w:80%"></i><i class="ca-md-l" style="--w:62%"></i></div>
      <div class="ca-md-author" style="--i:1"><i class="ca-md-ava"></i><i class="ca-md-l" style="--w:70%"></i><i class="ca-md-karma"><b></b></i></div>
      <div class="ca-md-thread" style="--i:2"><i class="ca-md-l" style="--w:86%"></i><i class="ca-md-l ca-md-l--in" style="--w:64%"></i><i class="ca-md-l ca-md-l--in" style="--w:52%"></i></div>
      <div class="ca-md-flags" style="--i:3"><i></i><i></i><i></i></div>
    </div>`,
  /* пять типов — один образец: строки с разными значками устроены одинаково */
  "md-five": () => `
    <div class="ca-md-five">
      ${["c", "u", "p", "g", "s"].map((k, i) => `<div class="ca-md-frow" style="--i:${i}"><i class="ca-md-ico ca-md-ico--${k}"></i><i class="ca-md-l" style="--w:44%"></i><i class="ca-md-pill"></i></div>`).join("")}
    </div>`,
  /* поверх существующей админки: в панель настроек сайта встаёт модуль модерации */
  "md-admin": () => `
    <div class="ca-md-admin">
      <i></i><i></i><i></i><i></i><i class="ca-md-slot"><b></b></i><i></i>
    </div>`,
  /* один администратор на весь поток: над одним человеком растёт стопка комментариев и жалоб */
  "md-one": () => `
    <div class="ca-md-pile">
      <i style="--i:0;--r:-6deg"></i><i style="--i:1;--r:5deg"></i><i style="--i:2;--r:-3deg"></i><i style="--i:3;--r:7deg"></i><i style="--i:4;--r:-8deg"></i>
    </div>
    <i class="ca-md-person"></i>`,
};
