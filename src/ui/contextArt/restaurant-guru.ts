/* 26.10: сцены «Контекста картинками» для кейса restaurant-guru (ключи — в context.art данных кейса). Сцена — HTML-строка
   внутри плитки .ca-tile: размеры в cqw, общие детали (.ca-win, .ca-line…) — из context-art.css, свои — в restaurant-guru.css.
   Движение — только transform/opacity, старт по .ca-card.is-in, «меньше движения» — конечный вид.
   Цвета продукта: светлый интерфейс, бордовый #9E1B32 только на действиях, фиолетовый #6E4BF0 — гид,
   зелёный #2E6B4F — «открыто». Фото заведений — тёплые градиенты, не картинки. */
import { getLang } from "../../i18n";
import "./restaurant-guru.css";

const L = (ru: string, en: string) => (getLang() === "ru" ? ru : en);

export const scenes: Record<string, () => string> = {
  /* знает место: поле поиска, название набирается, под ним выскакивает найденное место */
  search: () => `
    <div class="ca-rg-sheet ca-rg-sheet--search">
      <div class="ca-rg-field"><i class="ca-rg-lens"></i><i class="ca-rg-typed"></i><i class="ca-rg-caret"></i></div>
      <div class="ca-rg-row ca-rg-found"><i class="ca-rg-ph ca-rg-ph--a"></i><span><i class="ca-line" style="--w:70%"></i><i class="ca-line" style="--w:44%"></i></span><b class="ca-rg-star">4.8</b></div>
    </div>`,
  /* выбор из нескольких: полка из двух карточек мест выезжает лесенкой, на одной сердечко */
  shelf: () => `
    <div class="ca-rg-shelf">
      <div class="ca-rg-card" style="--i:0"><i class="ca-rg-ph ca-rg-ph--a"></i><i class="ca-rg-heart"></i><i class="ca-line" style="--w:72%"></i></div>
      <div class="ca-rg-card" style="--i:1"><i class="ca-rg-ph ca-rg-ph--b"></i><i class="ca-rg-heart"></i><i class="ca-line" style="--w:56%"></i></div>
      <div class="ca-rg-card" style="--i:2"><i class="ca-rg-ph ca-rg-ph--c"></i><i class="ca-line" style="--w:64%"></i></div>
    </div>`,
  /* описать словами: строка гида с компасом в ленте и приподнятая вкладка «Гид» внизу */
  guide: () => `
    <div class="ca-rg-ask"><i class="ca-rg-compass"></i><i class="ca-line ca-rg-q" style="--w:56%"></i><i class="ca-rg-go"></i></div>
    <div class="ca-rg-tabs"><i></i><i></i><b><i class="ca-rg-compass"></i></b><i></i><i></i></div>`,
  /* открыто сейчас: время в шапке, ниже места с зелёной точкой; закрытое уходит вниз и гаснет */
  open: () => `
    <div class="ca-rg-sheet ca-rg-sheet--open">
      <p class="ca-rg-time"><i></i>${L("пятница · 19:20", "Friday · 19:20")}</p>
      <div class="ca-rg-row" style="--i:0"><i class="ca-rg-ph ca-rg-ph--b"></i><span><i class="ca-line" style="--w:62%"></i><i class="ca-rg-open">${L("Открыто", "Open")}</i></span></div>
      <div class="ca-rg-row" style="--i:1"><i class="ca-rg-ph ca-rg-ph--a"></i><span><i class="ca-line" style="--w:50%"></i><i class="ca-rg-open">${L("Открыто", "Open")}</i></span></div>
      <div class="ca-rg-row ca-rg-closed"><i class="ca-rg-ph ca-rg-ph--c"></i><span><i class="ca-line" style="--w:56%"></i><i class="ca-rg-shut">${L("Закрыто", "Closed")}</i></span></div>
    </div>`,
  /* своих пользователей нет: стопка чужих исследований, у каждого — своя цифра */
  sources: () => `
    <div class="ca-rg-papers">
      <i class="ca-rg-paper" style="--i:0"></i><i class="ca-rg-paper" style="--i:1"></i>
      <i class="ca-rg-paper ca-rg-paper--top" style="--i:2"><b class="ca-rg-bars"><i></i><i></i><i></i></b></i>
    </div>`,
  /* бордовый — только на действиях: серые блоки и одна бордовая кнопка */
  brand: () => `
    <div class="ca-rg-mono">
      <i class="ca-line" style="--w:76%"></i><i class="ca-line" style="--w:52%"></i>
      <i class="ca-rg-btn"></i>
    </div>`,
};
