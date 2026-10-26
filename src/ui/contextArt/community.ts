/* 26.10: сцены «Контекста картинками» для кейса community (ключи — в context.art данных кейса). Сцена — HTML-строка
   внутри плитки .ca-tile: размеры в cqw, общие детали (.ca-win, .ca-line…) — из context-art.css, свои — в community.css.
   Движение — только transform/opacity, старт по .ca-card.is-in, «меньше движения» — конечный вид.
   Язык сцен — светлый интерфейс «Сообщества»: белые карточки, чёрный текст и кнопки, пастельные рубрики,
   розовый акцент #FFECF9. Слов нет — подпись под плиткой и так говорит, о чём она. */
import "./community.css";

/* пастель рубрик — из макетов ленты (src/ui/live/community.ts) */
const PASTEL = ["#fff2fb", "#e2f8ff", "#f4fbe4", "#fff1e4", "#f1edff", "#e7fdf2"];

export const scenes: Record<string, () => string> = {
  /* рассказать и обсудить: форма истории — заголовок, текст, картинки, кнопка; рядом пузырь обсуждения */
  write: () => `
    <div class="ca-cm-card ca-cm-form">
      <i class="ca-cm-l ca-cm-l--b" style="--w:58%;--i:0"></i>
      <i class="ca-cm-l" style="--w:92%;--i:1"></i><i class="ca-cm-l" style="--w:80%;--i:2"></i>
      <div class="ca-cm-pics"><i style="--i:0"></i><i style="--i:1"></i><i style="--i:2"></i></div>
      <i class="ca-cm-btn"></i>
    </div>
    <div class="ca-cm-bubble"><i class="ca-cm-av"></i><i class="ca-cm-l" style="--w:70%"></i></div>`,
  /* один путь проверки: текст редакции и текст жителя сходятся в одну очередь, у каждого — статус */
  queue: () => `
    <div class="ca-cm-q">
      <div class="ca-cm-row" style="--i:0"><i class="ca-cm-src ca-cm-src--ed"></i><i class="ca-cm-l" style="--w:46%"></i><i class="ca-cm-st ca-cm-st--ok"></i></div>
      <div class="ca-cm-row" style="--i:1"><i class="ca-cm-src"></i><i class="ca-cm-l" style="--w:54%"></i><i class="ca-cm-st ca-cm-st--wait"></i></div>
      <div class="ca-cm-row" style="--i:2"><i class="ca-cm-src"></i><i class="ca-cm-l" style="--w:40%"></i><i class="ca-cm-st ca-cm-st--no"></i></div>
      <i class="ca-cm-reason"></i>
    </div>`,
  /* с первого клика: рубрики одной строкой, выбранная — чёрная, под ней карточки */
  rubrics: () => `
    <div class="ca-cm-chips">${PASTEL.slice(0, 4).map((c, i) => `<i style="--c:${c};--i:${i}"></i>`).join("")}<b class="ca-cm-pick"></b></div>
    <div class="ca-cm-cards"><i class="ca-cm-card" style="--i:0"></i><i class="ca-cm-card" style="--i:1"></i></div>`,
  /* долгое чтение: крупное «Аа» Golos Text, строки текста и полоска прочитанного */
  read: () => `
    <div class="ca-cm-card ca-cm-page">
      <i class="ca-cm-progress"></i>
      <b class="ca-cm-aa">Аа</b>
      <i class="ca-cm-l" style="--w:94%;--i:0"></i><i class="ca-cm-l" style="--w:88%;--i:1"></i><i class="ca-cm-l" style="--w:91%;--i:2"></i><i class="ca-cm-l" style="--w:62%;--i:3"></i>
    </div>`,
  /* девять месяцев: девять клеток-месяцев заполняются, последняя — запуск */
  months: () => `
    <div class="ca-cm-months">${Array.from({ length: 9 }, (_, i) => `<i class="${i === 8 ? "is-mvp" : ""}" style="--i:${i}"></i>`).join("")}</div>`,
  /* своя дизайн-система: кнопка в трёх состояниях и поле — собираются по одной детали */
  kit: () => `
    <div class="ca-cm-kit">
      <i class="ca-cm-k ca-cm-k--fill" style="--i:0"></i>
      <i class="ca-cm-k ca-cm-k--line" style="--i:1"></i>
      <i class="ca-cm-k ca-cm-k--off" style="--i:2"></i>
      <i class="ca-cm-k ca-cm-k--field" style="--i:3"></i>
    </div>`,
};
