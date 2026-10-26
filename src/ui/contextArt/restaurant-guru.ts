/* 26.10: сцены «Контекста картинками» для кейса restaurant-guru (ключи — в context.art данных кейса). Сцена — HTML-строка
   внутри плитки .ca-tile: размеры в cqw, общие детали (.ca-win, .ca-line…) — из context-art.css, свои — в restaurant-guru.css.
   Движение — только transform/opacity, старт по .ca-card.is-in, «меньше движения» — конечный вид. */
import "./restaurant-guru.css";

export const scenes: Record<string, () => string> = {};
