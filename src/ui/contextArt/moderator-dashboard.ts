/* 26.10: сцены «Контекста картинками» для кейса moderator-dashboard (ключи — в context.art данных кейса). Сцена — HTML-строка
   внутри плитки .ca-tile: размеры в cqw, общие детали (.ca-win, .ca-line…) — из context-art.css, свои — в moderator-dashboard.css.
   Движение — только transform/opacity, старт по .ca-card.is-in, «меньше движения» — конечный вид.
   Язык сцен — сам кабинет из макетов: белые окна, розовые шапки таблицы, чёрные кнопки-пилюли, зелёная точка «Новый». */
import "./moderator-dashboard.css";

const row = (i: number, w: number, cls = "") => `<div class="ca-md-row${cls}" style="--i:${i}"><i class="ca-md-dot"></i><i class="ca-md-l" style="--w:${w}%"></i><i class="ca-md-l ca-md-l--s"></i></div>`;

export const scenes: Record<string, () => string> = {
  /* сразу видно, что ждёт проверки: вкладки статусов, у первой — метка, строки «Новый» въезжают по очереди */
  "md-queue": () => `
    <div class="ca-md-win ca-md-win--queue">
      <div class="ca-md-tabs"><i class="is-on"><b class="ca-md-badge"></b></i><i></i><i></i><i></i></div>
      ${row(0, 52)}${row(1, 38)}${row(2, 46)}
    </div>`,
  /* 26.10: цель «сократить время на проверку объекта»: было — длинная полоса, стало — на 38 % короче (замер AHT) */
  "md-time": () => `
    <div class="ca-md-win ca-md-win--time">
      <div class="ca-md-trow"><i class="ca-md-clock"></i><i class="ca-md-bar ca-md-bar--was"></i></div>
      <div class="ca-md-trow"><i class="ca-md-clock is-now"></i><i class="ca-md-bar ca-md-bar--now"></i><b class="ca-md-minus">−38 %</b></div>
    </div>`,
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
  /* 26.10: цель «снять поток с одного администратора»: стопка комментариев и жалоб расходится по трём модераторам */
  "md-team": () => `
    <div class="ca-md-team">
      ${[0, 1, 2].map((p) => `<div class="ca-md-mod" style="--p:${p}"><span class="ca-md-stack"><i style="--i:${p * 2};--r:${p === 1 ? 4 : -5}deg"></i><i style="--i:${p * 2 + 1};--r:${p === 1 ? -3 : 6}deg"></i></span><i class="ca-md-person"></i></div>`).join("")}
    </div>`,
};
