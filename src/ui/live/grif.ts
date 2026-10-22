/* v115: живой прототип GRIF AI — главный путь чата по макетам Figma (страница Chat → секция «New concept»):
   запрос с записями встречи → «Проверяю…» и шаги мышления → бриф и готовое письмо → отправлено, можно вернуть.
   Размеры, цвета и тексты — из фреймов 550:30173, 552:11224, 604:10617, 608:10089, 605:10518, 608:11710.
   Шрифты макета — Inter (текст) и Manrope (заголовки); пока их нет на сайте, стек падает на Onest.
   Шаги: 0 отправить запрос · 1 GRIF разбирает (проходит сам) · 2 проверить письмо и отправить · 3 готово. */
import type { LiveProto } from "./types";
import "./grif.css";

const PROMPT = "GRIF, проанализируй встречу за 10.09.2025: дай краткую сводку, что на ней происходило и о чём мы договорились.";
const FILES = [
  { name: "Встреча 10.09.pdf", size: "1,4 МБ" },
  { name: "Заметки.pdf", size: "86 КБ" },
];
/* шаги мышления: первый — текст макета, второй — по смыслу источников под брифом */
const STEPS: [string, string][] = [
  ["clock", "Открыл календарь и переписку с участником встречи — собираю, о чём договорились."],
  ["doc", "Прочитал записи встречи и сверил договорённости с почтой и Notion."],
];
const P1 = "Встреча с Сергеем (CPO AcmeCorp) во вторник в 10:00. Обсуждаете партнёрство — интеграцию GRIF в их продукт. Три вопроса на повестке: pricing (revenue share 15–25%), пилот на 2 недели и сроки запуска до конца Q2";
const P2 = "Держите акцент на time-to-value — в пятницу Сергей написал, что скорость подключения важнее всего. И не упоминайте конкурента X: между компаниями судебный процесс.";
const SUBJECT = "Follow-up по партнёрству — next steps";
const PREVIEW = "Сергей, спасибо за встречу. Коротко зафиксирую, о чём договорились: пилот на 2 недели, revenue share 15–25%, запуск до конца Q2...";
const LETTER = "Сергей, спасибо за встречу.\n\nКоротко зафиксирую, о чём договорились:\n— Пилот на 2 недели, старт со следующего понедельника.\n— Revenue share обсуждаем в коридоре 15–25%, финализируем после пилота.\n— Цель — запуск интеграции до конца Q2.\n\nСо своей стороны пришлю доступы к sandbox завтра до 12:00. Если удобно, созвонимся в четверг в 15:00 — подтвердите слот.\n\n—Н";

/* иконки — свои, линией и заливкой по типу иконок макета */
const sv = (d: string, w = 24, sw = 1.5) =>
  `<svg viewBox="0 0 24 24" width="${w}" height="${w}" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const I = {
  plus: sv('<path d="M12 4.5v15M4.5 12h15"/>'),
  plusSq: sv('<rect x="3.5" y="3.5" width="17" height="17" rx="4.5"/><path d="M12 8.5v7M8.5 12h7"/>'),
  widget: sv('<rect x="3.5" y="3.5" width="7" height="7" rx="2"/><circle cx="17" cy="7" r="3.5"/><circle cx="7" cy="17" r="3.5"/><rect x="13.5" y="13.5" width="7" height="7" rx="2"/>'),
  history: sv('<path d="M4.3 12a7.7 7.7 0 1 0 2.3-5.5"/><path d="M4.5 3.8v3.4h3.4"/><path d="M12 8v4l2.6 1.8"/>'),
  flow: sv('<circle cx="5.5" cy="5" r="2"/><circle cx="18" cy="12" r="2"/><circle cx="18" cy="19" r="2"/><path d="M5.5 7v10a2 2 0 0 0 2 2H16M5.5 12H16M9.5 5h4.5a2 2 0 0 1 2 2"/>'),
  search: sv('<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5v4.5l3 3"/>'),
  panel: sv('<rect x="3.5" y="4.5" width="17" height="15" rx="3"/><path d="M14 4.5v15M6.5 9h4M6.5 12h4"/>'),
  chev: sv('<path d="m6.5 9.5 5.5 5 5.5-5"/>', 16),
  file: sv('<path d="M7 3.5h6.5L18.5 8.5v11a1 1 0 0 1-1 1h-10.5a1 1 0 0 1-1-1v-15a1 1 0 0 1 1-1z"/><path d="M13 3.8v5h5"/>', 20),
  x: '<svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true"><circle cx="10" cy="10" r="8" fill="#e4e4e7"/><path d="m7.4 7.4 5.2 5.2m0-5.2-5.2 5.2" stroke="#18181b" stroke-width="1.6" stroke-linecap="round"/></svg>',
  mic: sv('<rect x="8.5" y="3" width="7" height="11" rx="3.5"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M9.5 9h2M12.5 7h2"/>'),
  send: sv('<path d="M12 3.8 4.2 19a.8.8 0 0 0 1 1.1L12 17.3l6.8 2.8a.8.8 0 0 0 1-1.1z"/>'),
  stop: '<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><rect x="6" y="6" width="12" height="12" rx="2.5" fill="currentColor"/></svg>',
  edit: sv('<path d="M14.5 5.5 18.5 9.5M4.5 19.5l1-4.5L15.8 4.7a1.8 1.8 0 0 1 2.5 0l1 1a1.8 1.8 0 0 1 0 2.5L9 18.5z"/>', 20),
  copy: sv('<rect x="8" y="8" width="12" height="12" rx="3"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>', 20),
  mail: sv('<rect x="3" y="5" width="18" height="14" rx="3.5"/><path d="m4 7.5 8 5.5 8-5.5"/>', 32),
  wand: sv('<path d="M4 20 15 9M13.5 7.5l3 3M16 3v2.5M20.5 8H18M19.2 4.8l-1.6 1.6M9 4l.6 1.6M20 13l-1.6-.6"/>', 32),
  plane: sv('<path d="M4 6.5a2.5 2.5 0 0 1 2.5-2.5h11A2.5 2.5 0 0 1 20 6.5v11a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 17.5z"/><path d="M8 9c1 2.2 2.4 3.3 4 3.3S15 11.2 16 9"/>', 32),
  clock: '<svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true"><circle cx="10" cy="10" r="8.3" fill="#71717a"/><path d="M10 6v4.3l2.7 1.6" stroke="#18181b" stroke-width="1.6" fill="none" stroke-linecap="round"/></svg>',
  doc: '<svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true"><path d="M5 2.5h7l3.5 3.5v10.5A1.5 1.5 0 0 1 14 18H5a1.5 1.5 0 0 1-1.5-1.5V4A1.5 1.5 0 0 1 5 2.5z" fill="#71717a"/><path d="M6.8 10h6.4M10 6.8v6.4" stroke="#18181b" stroke-width="1.6" stroke-linecap="round"/></svg>',
  done: '<svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true"><circle cx="10" cy="10" r="8.3" fill="#34d399"/><path d="m6.5 10.2 2.4 2.4 4.6-4.8" stroke="#064e3b" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  okBig: '<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="#34d399"/><path d="m7.8 12.3 2.9 2.9 5.5-5.8" stroke="#064e3b" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  reads: sv('<path d="m2.5 12.5 4 4 8.5-9M11.5 15.5l1 1 8.5-9"/>', 20),
  bookmark: '<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="4" fill="#aab7f9"/><path d="M8 4v7.5l2-1.5 2 1.5V4" fill="#4361ee"/></svg>',
  shield: sv('<path d="M12 3 4.5 6v5.5c0 4.6 3.2 8.2 7.5 9.5 4.3-1.3 7.5-4.9 7.5-9.5V6z"/><path d="m9 12 2.2 2.2L15.2 10"/>'),
  letter: sv('<rect x="3" y="5" width="18" height="14" rx="3"/><path d="m4 7.5 8 5.5 8-5.5"/>', 14, 1.8),
  refresh: sv('<path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3"/><path d="M19.5 4.5v4h-4"/>', 20, 1.8),
  bell: sv('<path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 1.5h-15z"/><path d="M10 21h4"/>'),
  list: sv('<rect x="3.5" y="3.5" width="17" height="17" rx="4.5"/><path d="M8 9h8M8 12h8M8 15h5"/>'),
  star: sv('<path d="m12 3.8 2.5 5.2 5.6.6-4.2 3.8 1.2 5.6L12 16.2 6.9 19l1.2-5.6-4.2-3.8 5.6-.6z"/>'),
  close: sv('<path d="m6 6 12 12M18 6 6 18"/>'),
  note: sv('<rect x="5" y="3.5" width="14" height="17" rx="3"/><path d="M9 8.5h6M9 12h6M9 15.5h3.5"/>'),
  person: '<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><circle cx="12" cy="9" r="3.6" fill="currentColor"/><path d="M5 19.5c.9-3.4 3.6-5.3 7-5.3s6.1 1.9 7 5.3z" fill="currentColor"/></svg>',
  orb: '<svg viewBox="0 0 14 14" width="14" height="14" aria-hidden="true"><circle cx="7" cy="7" r="6" fill="#4361ee"/><path d="M3.5 8.5c1.5-3 4.5-4.2 7-3.2-1.6.2-3 1.4-3.6 3.4" fill="none" stroke="#aab7f9" stroke-width="1.2" stroke-linecap="round"/></svg>',
};
/* знак GRIF: три пера крыла — свой рисунок */
const WING = '<svg class="lg-wing" viewBox="0 0 44 26" aria-hidden="true"><path d="M1 3.5C15 2 30 5.5 43 15 32 10.5 20 9.5 9 10.5z"/><path d="M8 11.5c11-1 22 1.4 32 7-9-2.6-17-3-25-2.2z"/><path d="M15 17.6c8.5-.6 16.5 1 23.5 4.6-7-1.4-13.4-1.6-19.6-1z"/></svg>';
const SPIN = '<i class="lg-spin" aria-hidden="true"></i>';

const composer = (home: boolean) => `<div class="lg-field">
  <div class="lg-field-in">
    ${home ? '<div class="lg-files" data-files></div><textarea class="lg-prompt" data-prompt rows="2" aria-label="Запрос"></textarea>' : '<div class="lg-ph">Спросите GRIF о чем угодно ...</div>'}
    <div class="lg-bar"><span class="lg-ib">${I.plus}</span><span class="lg-grow"></span><span class="lg-ib">${I.mic}</span>
      ${home ? `<button type="button" class="lg-send" data-send aria-label="Отправить">${I.send}</button>` : `<span class="lg-send" data-dock-send>${I.send}</span>`}</div>
  </div></div>`;

const HTML = `<div class="lv-grif">
  <aside class="lg-side">
    <div class="lg-tb"><span class="lg-logo">${WING}<b>GRIF</b></span><span class="lg-tb-acts"><i class="lg-ib">${I.search}</i><i class="lg-ib">${I.panel}</i></span></div>
    <nav class="lg-menu">
      <div class="lg-mi is-on" data-new><span data-new-ic>${I.plus}</span>Новый чат</div>
      <div class="lg-mi">${I.widget}Лента</div>
      <div class="lg-mi">${I.history}Память</div>
      <div class="lg-mi">${I.flow}Источники</div>
    </nav>
    <div class="lg-groups">
      <div class="lg-grp lg-grp--fav"><p class="lg-gl">Избранное ${I.chev}</p><p class="lg-si">Чат 1</p><p class="lg-si">Чат 2</p></div>
      <div class="lg-grp"><p class="lg-gl">Недавнее ${I.chev}</p><p class="lg-si is-on" data-recent hidden>Анализ встречи</p><p class="lg-si">Подскажи погоду на завтра в Москве</p></div>
    </div>
    <div class="lg-me"><span class="lg-ava">Н</span><span class="lg-grow"><b>Никита Горбачев</b><small>nikita@example.com</small></span></div>
  </aside>
  <main class="lg-main">
    <header class="lg-head" data-head hidden><span>Анализ встречи</span><i class="lg-ib lg-ib--s">${I.chev}</i></header>
    <section class="lg-home" data-home>
      <div class="lg-welcome"><p class="lg-hi">Привет, Никита 👋</p><p class="lg-hi lg-hi--sub">Чем помочь тебе сегодня?</p></div>
      <div class="lg-sec">${composer(true)}
        <div class="lg-hints">
          <button type="button" class="lg-hcard" data-send>${I.mail}<span>Отправить follow-up письмо</span></button>
          <span class="lg-hcard">${I.wand}<span>Резюме встречи</span></span>
          <span class="lg-hcard">${I.plane}<span>Забронировать рейс в Токио</span></span>
        </div></div>
    </section>
    <section class="lg-chat" data-chat hidden>
      <div class="lg-scroll" data-scroll><div class="lg-col">
        <div class="lg-umsg"><div class="lg-ufiles" data-ufiles></div><div class="lg-bubble" data-bubble></div>
          <div class="lg-utools"><i class="lg-ib lg-ib--m">${I.edit}</i><i class="lg-ib lg-ib--m">${I.copy}</i></div></div>
        <div class="lg-ai">
          <p class="lg-checking" data-checking hidden>${SPIN}<span>Проверяю...</span></p>
          <div class="lg-think" data-think hidden><p class="lg-cap">Вторник, 10:00 · Анализ контекста ${I.chev}</p><ol class="lg-steps" data-steps></ol></div>
          <div class="lg-brief" data-brief hidden>
            <button type="button" class="lg-sum" data-sum>${I.orb}<span>Собрал контекст — 4 источника, 1 мин 47 сек</span>${I.chev}</button>
            <div class="lg-think" data-think2 hidden><ol class="lg-steps" data-steps2></ol></div>
            <h3 class="lg-h">Бриф готов. Главное за минуту — и я подготовил follow-up</h3>
            <div class="lg-ps"><p data-p1></p><p data-p2></p></div>
            <div class="lg-based" data-based><span class="lg-based-l">${I.reads}На основе</span>
              <span class="lg-chip"><i></i>Telegram</span><span class="lg-chip"><i></i>Gmail</span><span class="lg-chip"><i></i>Notion</span></div>
          </div>
          <div class="lg-mem" data-mem hidden>${I.bookmark}<span class="lg-grow">Запомнил: при Сергее не упоминать конкурента X<span class="lg-t2"> (судебный процесс)</span></span><span class="lg-link">Не запоминать</span></div>
          <article class="lg-card" data-card hidden>
            <div class="lg-card-h"><span class="lg-mark">${WING}</span><span class="lg-grow"><b>Готов отправить follow-up письмо</b><small>Подготовил черновик — проверьте перед отправкой</small></span>
              <span class="lg-badge">${I.letter}Отправка</span></div>
            <div class="lg-card-b">
              <div class="lg-row"><span class="lg-lab">Кому:</span><span class="lg-to"><span class="lg-pic">${I.person}</span>Сергей · AcmeCorp <span class="lg-t3">sergey@acmecorp.com</span></span></div>
              <div class="lg-row"><span class="lg-lab">Тема:</span><span data-subj>${SUBJECT}</span></div>
              <p class="lg-body" data-preview>${PREVIEW}</p>
            </div>
            <div class="lg-card-f"><span class="lg-safe">${I.shield}<span>Без вашего подтверждения не отправлю</span></span>
              <span class="lg-acts"><button type="button" class="lg-btn" data-edit>Редактировать</button><span class="lg-btn lg-btn--soft">Отклонить</span>
                <button type="button" class="lg-btn lg-btn--brand" data-mail>${I.send}Отправить</button></span></div>
          </article>
          <div class="lg-more" data-more hidden><p class="lg-t2">Могу заодно:</p><div class="lg-more-row">
            <span class="lg-mcard">${I.bell}Напомнить за час до встречи</span><span class="lg-mcard">${I.list}Собрать тезисы для звонка</span><span class="lg-mcard">${I.star}Добавить Сергея в избранное</span></div></div>
          <div class="lg-sent" data-sent hidden>${I.okBig}<span class="lg-grow"><b>Письмо отправлено Сергею</b><span>через Gmail · сегодня, 10:42</span></span>
            <button type="button" class="lg-btn lg-btn--line" data-undo>${I.refresh}Вернуть</button></div>
        </div>
      </div></div>
      <div class="lg-dock">${composer(false)}</div>
    </section>
    <p class="lg-note">GRIF работает, но может ошибаться — проверяйте важное</p>
    <div class="lg-toast" data-toast hidden><span class="lg-toast-ic">${I.okBig}</span><span>Письмо отправлено</span><button type="button" class="lg-toast-b" data-undo>Отменить</button></div>
  </main>
  <aside class="lg-panel" data-panel hidden aria-label="Черновик письма">
    <div class="lg-pn-h"><span class="lg-pn-ic">${I.note}</span><span class="lg-grow"><b>Черновик письма</b><small>${I.letter}отправится через Gmail</small></span>
      <button type="button" class="lg-ib lg-ib--m" data-close aria-label="Закрыть">${I.close}</button></div>
    <div class="lg-pn-b">
      <p class="lg-pn-say"><span class="lg-pn-av">${WING}</span>Подготовил на основе встречи и переписки. Поправьте — и отправлю.</p>
      <div class="lg-row"><span class="lg-lab">Кому:</span><span class="lg-to"><span class="lg-pic">${I.person}</span>Сергей <span class="lg-t2">· sergey@acmecorp.com</span></span></div>
      <label class="lg-row"><span class="lg-lab">Тема:</span><input class="lg-input" data-subj-in></label>
      <textarea class="lg-input lg-letter" data-letter aria-label="Текст письма"></textarea>
    </div>
    <div class="lg-pn-f"><p class="lg-saved">${I.note}Сохранено в черновик</p>
      <div class="lg-pn-acts"><button type="button" class="lg-btn lg-btn--soft" data-close>Закрыть</button><button type="button" class="lg-btn lg-btn--brand" data-mail>${I.send}Отправить</button></div></div>
  </aside>
</div>`;

const proto: LiveProto = {
  design: { w: 1200 },
  mount(root, ctx) {
    const calm = ctx.calm;
    root.innerHTML = HTML;
    const box = root.firstElementChild as HTMLElement;
    box.classList.toggle("is-calm", calm);
    const q = <T extends HTMLElement = HTMLElement>(s: string) => box.querySelector<T>(s)!;

    const home = q("[data-home]"), chat = q("[data-chat]"), head = q("[data-head]"), recent = q("[data-recent]");
    const newItem = q("[data-new]"), newIc = q("[data-new-ic]");
    const prompt = q<HTMLTextAreaElement>("[data-prompt]"), filesEl = q("[data-files]"), sendBtn = q("button.lg-send");
    const dockSend = q("[data-dock-send]");
    const scroller = q("[data-scroll]"), bubble = q("[data-bubble]"), ufiles = q("[data-ufiles]");
    const checking = q("[data-checking]"), think = q("[data-think]"), steps = q("[data-steps]");
    const brief = q("[data-brief]"), think2 = q("[data-think2]"), steps2 = q("[data-steps2]"), sum = q("[data-sum]");
    const p1 = q("[data-p1]"), p2 = q("[data-p2]"), based = q("[data-based]");
    const mem = q("[data-mem]"), card = q("[data-card]"), more = q("[data-more]"), sent = q("[data-sent]"), toast = q("[data-toast]");
    const cardSend = q("[data-card] [data-mail]"), panel = q("[data-panel]"), panelSend = q("[data-panel] [data-mail]");
    const subjIn = q<HTMLInputElement>("[data-subj-in]"), letter = q<HTMLTextAreaElement>("[data-letter]");
    const subj = q("[data-subj]"), preview = q("[data-preview]");

    let files = FILES.slice();
    let isSent = false;
    let run = 0;
    let timers: number[] = [];
    const stop = () => { run += 1; timers.forEach(clearTimeout); timers = []; };
    const wait = (ms: number) => new Promise<void>((r) => { timers.push(window.setTimeout(r, ms)); });

    /* низкое окно (телефон: движок держит zoom ≥ 0,5) — ужимаем сайдбар и прячем подпись снизу */
    const fit = new ResizeObserver(() => box.classList.toggle("is-short", root.clientHeight < 600));
    fit.observe(root);

    /* появление — прозрачностью */
    const reveal = (el: HTMLElement) => {
      el.hidden = false;
      if (calm) return;
      el.classList.remove("lg-in");
      void el.offsetWidth;
      el.classList.add("lg-in");
    };
    const down = (smooth = !calm) => scroller.scrollTo({ top: scroller.scrollHeight, behavior: smooth ? "smooth" : "auto" });

    /* координата внутри прокрутки — через offsetTop (собственные px, zoom не мешает) */
    function topIn(el: HTMLElement) {
      let y = 0;
      let n: HTMLElement | null = el;
      while (n && n !== scroller) { y += n.offsetTop; n = n.offsetParent as HTMLElement | null; }
      return y;
    }
    function showIn(el: HTMLElement, smooth: boolean) {
      const top = topIn(el), bottom = top + el.offsetHeight, vh = scroller.clientHeight, st = scroller.scrollTop;
      if (top >= st + 8 && bottom <= st + vh - 8) return;
      scroller.scrollTo({ top: Math.max(0, bottom - vh + 24), behavior: smooth && !calm ? "smooth" : "auto" });
    }
    /* узкий экран: окно шире рамки и листается вбок (.pt-screen.is-pan) — доводим до подсказки */
    function panTo(el: HTMLElement, smooth: boolean) {
      const scr = root.parentElement;
      if (!scr || !scr.classList.contains("is-pan")) return;
      const a = el.getBoundingClientRect(), b = scr.getBoundingClientRect();
      if (a.left >= b.left + 6 && a.right <= b.right - 6) return;
      scr.scrollTo({ left: scr.scrollLeft + (a.left + a.right) / 2 - (b.left + b.right) / 2, behavior: smooth && !calm ? "smooth" : "auto" });
    }
    function hint(el: HTMLElement | null, smooth = !calm) {
      box.querySelectorAll(".pt-hint").forEach((n) => n.classList.remove("pt-hint"));
      if (!el) return;
      el.classList.add("pt-hint");
      requestAnimationFrame(() => {
        if (scroller.contains(el) && !chat.hidden) showIn(el, smooth);
        panTo(el, smooth);
      });
    }

    const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
    const fileCard = (f: { name: string; size: string }, i: number | null) =>
      `<span class="lg-file${i === null ? " lg-file--msg" : ""}"><span class="lg-file-ic">${I.file}</span><span class="lg-file-tx"><b>${esc(f.name)}</b><small>${f.size}</small></span>${i === null ? "" : `<button type="button" class="lg-file-x" data-drop="${i}" aria-label="Убрать файл">${I.x}</button>`}</span>`;
    const paintFiles = () => { filesEl.innerHTML = files.map((f, i) => fileCard(f, i)).join(""); filesEl.hidden = !files.length; };
    const stepRow = (ic: string, text: string, cls = "") => `<li class="lg-st ${cls}"><span class="lg-st-ic">${ic}</span><span class="lg-st-tx">${text}</span></li>`;
    /* n: сколько шагов пройдено; active — строка «изучает контекст» в конце */
    function paintSteps(el: HTMLElement, n: number, active: boolean) {
      let h = "";
      for (let i = 0; i < Math.min(n, STEPS.length); i++) h += stepRow(STEPS[i][0] === "clock" ? I.clock : I.doc, STEPS[i][1]);
      if (n > STEPS.length) h += stepRow(I.done, "Готово", "is-done");
      if (active) h += stepRow(SPIN, "Grif изучает контекст...", "is-now");
      el.innerHTML = h;
    }
    function resetDraft() { subjIn.value = SUBJECT; letter.value = LETTER; subj.textContent = SUBJECT; preview.textContent = PREVIEW; }
    function busy(on: boolean) { dockSend.innerHTML = on ? I.stop : I.send; dockSend.classList.toggle("is-busy", on); }

    function toHome() {
      home.hidden = false; chat.hidden = true; head.hidden = true; recent.hidden = true;
      newItem.classList.add("is-on"); newIc.innerHTML = I.plus;
      panel.hidden = true; toast.hidden = true;
      hint(sendBtn);
    }
    function toChat() {
      home.hidden = true; chat.hidden = false; head.hidden = false; recent.hidden = false;
      newItem.classList.remove("is-on"); newIc.innerHTML = I.plusSq;
      bubble.textContent = prompt.value.trim() || PROMPT;
      ufiles.innerHTML = files.map((f) => fileCard(f, null)).join("");
      ufiles.hidden = !files.length;
    }
    /* ответ целиком, как на макете 03 */
    function answerDone() {
      checking.hidden = true; think.hidden = true;
      paintSteps(steps2, STEPS.length + 1, false); think2.hidden = true; sum.classList.remove("is-open");
      brief.hidden = false; p1.textContent = P1; p2.textContent = P2; based.hidden = false;
      mem.hidden = false; card.hidden = false;
      box.querySelectorAll(".lg-in").forEach((n) => n.classList.remove("lg-in"));
      busy(false);
    }
    function setSent(on: boolean) {
      isSent = on;
      more.hidden = on; sent.hidden = !on; toast.hidden = !on;
      hint(on ? null : cardSend);
    }

    /* шаг 1: «Проверяю…» → шаги мышления по одному → «Готово» → бриф печатается, под ним письмо */
    async function analyse() {
      const my = run;
      const alive = () => my === run;
      toChat(); hint(null); busy(true); isSent = false;
      [think, brief, mem, card, more, sent, toast].forEach((n) => { n.hidden = true; });
      p1.textContent = ""; p2.textContent = ""; based.hidden = true;
      scroller.scrollTop = 0;
      if (calm) {
        think.hidden = false; paintSteps(steps, STEPS.length + 1, false);
        await wait(1600); if (!alive()) return;
        answerDone(); more.hidden = false; setSent(false); down(false);
        ctx.go(2);
        return;
      }
      reveal(checking);
      await wait(1000); if (!alive()) return;
      checking.hidden = true; reveal(think);
      for (let n = 0; n <= STEPS.length; n++) {
        paintSteps(steps, n, true); down();
        await wait(1000); if (!alive()) return;
      }
      paintSteps(steps, STEPS.length + 1, false); down();
      await wait(700); if (!alive()) return;
      think.hidden = true; paintSteps(steps2, STEPS.length + 1, false);
      reveal(brief);
      for (const [p, text] of [[p1, P1], [p2, P2]] as const) {
        const words = text.split(" ");
        for (let i = 2; i < words.length + 2; i += 2) {
          p.textContent = words.slice(0, i).join(" ");
          await wait(30); if (!alive()) return;
        }
      }
      reveal(based);
      for (const n of [mem, card, more]) { await wait(180); if (!alive()) return; reveal(n); down(); }
      busy(false);
      await wait(200); if (!alive()) return;
      setSent(false);
      ctx.go(2);
    }

    function openPanel() { reveal(panel); hint(panelSend); letter.scrollTop = 0; }
    function closePanel() { panel.hidden = true; if (!isSent) hint(cardSend); }
    function sendMail() {
      if (isSent) return;
      panel.hidden = true;
      setSent(true);
      if (!calm) { reveal(toast); reveal(sent); }
      requestAnimationFrame(() => showIn(sent, true));
      ctx.go(3);
    }

    function show(k: number) {
      stop();
      panel.hidden = true;
      resetDraft();
      if (k <= 0) { files = FILES.slice(); paintFiles(); prompt.value = PROMPT; isSent = false; toHome(); return; }
      if (k === 1) { void analyse(); return; }
      toChat(); answerDone(); more.hidden = false;
      setSent(k >= 3);
      requestAnimationFrame(() => { down(false); if (k >= 3) showIn(sent, false); });
    }

    const onClick = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      const drop = t.closest<HTMLElement>("[data-drop]");
      if (drop) { files.splice(Number(drop.dataset.drop), 1); paintFiles(); return; }
      if (t.closest("[data-send]")) { if (!home.hidden) { stop(); ctx.go(1); void analyse(); } return; }
      if (t.closest("[data-sum]")) { const open = think2.hidden === true; think2.hidden = !open; sum.classList.toggle("is-open", open); return; }
      if (t.closest("[data-edit]")) return openPanel();
      if (t.closest("[data-close]")) return closePanel();
      if (t.closest("[data-mail]")) return sendMail();
      if (t.closest("[data-undo]")) { setSent(false); more.hidden = false; ctx.go(2); }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.target === prompt && e.key === "Enter" && !e.shiftKey) { e.preventDefault(); if (!home.hidden) { stop(); ctx.go(1); void analyse(); } }
      if (e.key === "Escape" && !panel.hidden) closePanel();
    };
    const onInput = (e: Event) => {
      if (e.target === subjIn) subj.textContent = subjIn.value || SUBJECT;
      if (e.target === letter) {
        const flat = letter.value.replace(/\s*\n+\s*/g, " ").trim();
        preview.textContent = flat.length > 132 ? flat.slice(0, 130).trimEnd() + "..." : flat;
      }
    };
    box.addEventListener("click", onClick);
    box.addEventListener("keydown", onKey);
    box.addEventListener("input", onInput);

    show(0);
    return {
      show,
      destroy() {
        stop(); fit.disconnect();
        box.removeEventListener("click", onClick);
        box.removeEventListener("keydown", onKey);
        box.removeEventListener("input", onInput);
        root.innerHTML = "";
      },
    };
  },
};
export default proto;
