/* 26.10: сцены «Контекста картинками» для кейса plati-chastyami (ключи — в context.art данных кейса). Сцена — HTML-строка
   внутри плитки .ca-tile: размеры в cqw, общие детали (.ca-win, .ca-line…) — из context-art.css, свои — в plati-chastyami.css.
   Движение — только transform/opacity, старт по .ca-card.is-in, «меньше движения» — конечный вид. */
import "./plati-chastyami.css";

export const scenes: Record<string, () => string> = {};
