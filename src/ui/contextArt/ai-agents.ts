/* 26.10: сцены «Контекста картинками» для кейса ai-agents (ключи — в context.art данных кейса). Сцена — HTML-строка
   внутри плитки .ca-tile: размеры в cqw, общие детали (.ca-win, .ca-line…) — из context-art.css, свои — в ai-agents.css.
   Движение — только transform/opacity, старт по .ca-card.is-in, «меньше движения» — конечный вид.
   Все сцены — кусочки светлого интерфейса реестра рисков: белые карточки с серой рамкой #E9EBEF, тёмно-зелёная
   кнопка #0E8552, бейджи статусов в цветах макета (Figma XomA0T1zFMATidI4Qq5nEw). Слов нет — подпись под плиткой. */
import "./ai-agents.css";

const ok = '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="m3 6.2 2 2L9 4"/></svg>';

export const scenes: Record<string, () => string> = {
  /* проверка успевает за версиями: строка агента, версии одна за другой получают галочку, новая — «в оценке» */
  versions: () => `
    <div class="ca-ag-card ca-ag-card--versions">
      <i class="ca-ag-title"></i><i class="ca-ag-sub"></i>
      <div class="ca-ag-vers">
        <span style="--i:0"><b class="ca-ag-ok">${ok}</b><i></i></span>
        <span style="--i:1"><b class="ca-ag-ok">${ok}</b><i></i></span>
        <span style="--i:2"><b class="ca-ag-ok">${ok}</b><i></i></span>
        <span class="is-new" style="--i:3"><b class="ca-ag-dot"></b><i></i></span>
      </div>
    </div>`,
  /* риск-менеджер загружает сам: архив падает в поле загрузки, полоска дорастает, появляются заготовки рисков */
  upload: () => `
    <div class="ca-ag-card ca-ag-card--upload">
      <div class="ca-ag-drop"><i class="ca-ag-file"><b></b></i></div>
      <div class="ca-ag-prog"><i></i></div>
      <i class="ca-ag-skel" style="--i:0"></i><i class="ca-ag-skel" style="--i:1;--w:72%"></i><i class="ca-ag-skel" style="--i:2;--w:84%"></i>
    </div>`,
  /* четыре подразделения: у каждой строки своё заключение, галочки встают по очереди — каждый в своём темпе */
  depts: () => `
    <div class="ca-ag-card ca-ag-card--depts">
      ${["#2D78E8", "#8B5CF6", "#14A9B5", "#FF9500"].map((c, i) => `<div class="ca-ag-row" style="--i:${i};--c:${c}"><i class="ca-ag-ava"></i><i class="ca-ag-line" style="--w:${[58, 46, 64, 52][i]}%"></i><b class="ca-ag-pill">${ok}</b></div>`).join("")}
    </div>`,
  /* владелец видит шаг: степпер версии «новая → оценка → согласование → согласовано», текущий шаг дышит */
  stepper: () => `
    <div class="ca-ag-card ca-ag-card--stepper">
      <div class="ca-ag-steps">
        <i class="ca-ag-rail"><i></i></i>
        <span class="is-done" style="--i:0"><b>${ok}</b></span>
        <span class="is-done" style="--i:1"><b>${ok}</b></span>
        <span class="is-now" style="--i:2"><b></b></span>
        <span style="--i:3"><b></b></span>
      </div>
      <div class="ca-ag-labels"><i></i><i></i><i></i><i></i></div>
    </div>`,
  /* аудируемость: журнал решений — кто, когда, почему; новая запись встаёт сверху */
  audit: () => `
    <div class="ca-ag-log">
      ${[0, 1, 2].map((i) => `<div class="ca-ag-entry" style="--i:${i}"><i class="ca-ag-ava"></i><i class="ca-ag-line" style="--w:${[70, 56, 64][i]}%"></i><i class="ca-ag-time"></i></div>`).join("")}
    </div>`,
  /* дизайн-система банка: только готовые детали — кнопка, переключатель, бейдж, поле */
  ds: () => `
    <div class="ca-ag-kit">
      <i class="ca-ag-k ca-ag-k--btn" style="--i:0"></i><i class="ca-ag-k ca-ag-k--tog" style="--i:1"><b></b></i>
      <i class="ca-ag-k ca-ag-k--badge" style="--i:2"></i><i class="ca-ag-k ca-ag-k--field" style="--i:3"></i>
    </div>`,
  /* поток версий: метки версий непрерывно едут вверх, как лента */
  stream: () => `
    <div class="ca-ag-ticker"><div class="ca-ag-belt">
      ${[0, 1, 2, 3, 4, 5, 6, 7].map((i) => `<span><b></b><i style="--w:${[60, 44, 52][i % 3]}%"></i></span>`).join("")}
    </div></div>`,
  /* нет схемы процесса: узлы карты появляются по одному, связи между ними дорисовываются пунктиром */
  nomap: () => `
    <div class="ca-ag-map">
      <i class="ca-ag-link" style="--i:0;left:24%;top:30%;width:30%;rotate:18deg"></i>
      <i class="ca-ag-link" style="--i:1;left:50%;top:44%;width:28%;rotate:-28deg"></i>
      <i class="ca-ag-link" style="--i:2;left:30%;top:62%;width:34%;rotate:8deg"></i>
      <b class="ca-ag-node" style="--i:0;left:16%;top:22%"></b><b class="ca-ag-node" style="--i:1;left:48%;top:36%"></b>
      <b class="ca-ag-node is-q" style="--i:2;left:74%;top:22%"></b><b class="ca-ag-node" style="--i:3;left:22%;top:58%"></b>
      <b class="ca-ag-node is-q" style="--i:4;left:62%;top:64%"></b>
    </div>`,
};
