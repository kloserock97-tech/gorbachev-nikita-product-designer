/* v115: живой прототип GRIF AI — главный путь чата: записи встречи и задача → GRIF читает источники →
   бриф и готовое письмо → отправлено, можно вернуть. Экран собран по макетам кейса (t-chat-attach, 03, 05, 06, 07).
   Движение по правилам продукта: только прозрачность и цвет, 120–200 мс; при calm — сразу конечные состояния.
   Шаги: 0 отправить запрос · 1 GRIF разбирает (проходит сам) · 2 проверить письмо и отправить · 3 готово. */
import type { LiveProto } from "./types";
import "./grif.css";

const PROMPT =
  "Разбери встречу с Сергеем во вторник: коротко, о чём договорились, и подготовь follow-up письмо. Конкурента X не упоминай.";

const FILES = [
  { name: "Транскрипт встречи.pdf", size: "1,4 МБ" },
  { name: "Заметки со встречи.docx", size: "86 КБ" },
];

const THINK = [
  "Читаю записи встречи: транскрипт и заметки",
  "Смотрю переписку с Сергеем в Telegram",
  "Нахожу адрес и прошлые письма в Gmail",
  "Сверяю условия пилота в Notion",
  "Собираю бриф и черновик письма",
];

const P1 =
  "Встреча с Сергеем (CPO AcmeCorp) прошла во вторник в 10:00. Договорились о трёх вещах: пилот на 2 недели, revenue share в коридоре 15–25% — финализируете после пилота, запуск интеграции до конца Q2.";
const P2 =
  "В письме держу акцент на time-to-value — в пятницу Сергей написал, что скорость подключения важнее всего. Конкурента X не упоминаю: между компаниями судебный процесс.";

const SUBJECT = "Follow-up по партнёрству — next steps";
const LETTER =
  "Сергей, спасибо за встречу.\n\nКоротко зафиксирую, о чём договорились:\n— Пилот на 2 недели, старт со следующего понедельника.\n— Revenue share обсуждаем в коридоре 15–25%, финализируем после пилота.\n— Цель — запуск интеграции до конца Q2.\n\nСо своей стороны пришлю доступы к sandbox завтра до 12:00. Если удобно, созвонимся в четверг в 15:00 — подтвердите слот.\n\n— Н.";
const PREVIEW =
  "Сергей, спасибо за встречу. Коротко зафиксирую, о чём договорились: пилот на 2 недели, revenue share 15–25%, запуск до конца Q2…";

/* иконки — свои, линией */
const sv = (d: string, w = 20) =>
  `<svg viewBox="0 0 24 24" width="${w}" height="${w}" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const I = {
  plus: sv('<path d="M12 5v14M5 12h14"/>'),
  plusBox: sv('<rect x="4" y="4" width="16" height="16" rx="4"/><path d="M12 8.5v7M8.5 12h7"/>'),
  feed: sv('<rect x="4" y="4" width="6.5" height="6.5" rx="2"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="3.25"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="3.25"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="2"/>'),
  memory: sv('<path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3"/><path d="M4.5 4.5v3.2h3.2"/><path d="M12 8.5V12l2.5 1.8"/>'),
  sources: sv('<circle cx="6" cy="5.5" r="1.8"/><circle cx="17" cy="12" r="1.8"/><circle cx="17" cy="18.5" r="1.8"/><path d="M6 7.3v9.2c0 1.1.9 2 2 2h7.2M6 12h9.2"/>'),
  search: sv('<circle cx="11" cy="11" r="6"/><path d="m19.5 19.5-4-4"/>'),
  panel: sv('<rect x="4" y="5" width="16" height="14" rx="3"/><path d="M10 5v14M6.8 9h1M6.8 12h1"/>'),
  chev: sv('<path d="m7 10 5 5 5-5"/>', 16),
  file: sv('<path d="M7 3.5h6.5L18 8v11.5a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-15a1 1 0 0 1 1-1z"/><path d="M13 3.8V8.5h4.7"/>'),
  x: sv('<path d="m8 8 8 8M16 8l-8 8"/>', 12),
  close: sv('<path d="m6 6 12 12M18 6 6 18"/>'),
  mic: sv('<rect x="9" y="3.5" width="6" height="11" rx="3"/><path d="M6 11.5a6 6 0 0 0 12 0M12 17.5v3"/>'),
  send: sv('<path d="M12 4.2 4.6 18.4a.9.9 0 0 0 1.2 1.2L12 16.8l6.2 2.8a.9.9 0 0 0 1.2-1.2z"/>'),
  mail: sv('<rect x="3.5" y="5.5" width="17" height="13" rx="3"/><path d="m4.5 7.5 7.5 5.5 7.5-5.5"/>'),
  wand: sv('<path d="m4.5 19.5 11-11M14 5l1-2M19 10l2-1M18.5 5.5 20 4M10 4.5l.5 1.5M19.5 14l-1.5-.5"/><path d="m13.5 7 3.5 3.5"/>'),
  ticket: sv('<rect x="3.5" y="5" width="17" height="14" rx="3"/><path d="M8 9.5c1 2 2.4 3 4 3s3-1 4-3"/>'),
  check: sv('<path d="m5 12.5 4.5 4.5L19 7.5"/>', 16),
  checks: sv('<path d="m2.5 12.5 4 4 8.5-9M11.5 15.5l1 1 8.5-9"/>', 18),
  shield: sv('<path d="M12 3.5 5 6.2v5.3c0 4.3 3 7.6 7 9 4-1.4 7-4.7 7-9V6.2z"/><path d="m9 12 2.2 2.2L15.2 10"/>'),
  undo: sv('<path d="M5 12a7 7 0 1 0 2.1-5"/><path d="M5 4.5V9h4.5"/>', 18),
  bell: sv('<path d="M6.5 16.5V11a5.5 5.5 0 0 1 11 0v5.5l1.5 1.5H5z"/><path d="M10 20.5h4"/>', 18),
  list: sv('<rect x="4" y="4" width="16" height="16" rx="4"/><path d="M8 9h8M8 12h8M8 15h5"/>', 18),
  star: sv('<path d="m12 4 2.4 5 5.4.6-4 3.7 1.1 5.4L12 16l-4.9 2.7 1.1-5.4-4-3.7 5.4-.6z"/>', 18),
  box: sv('<rect x="4" y="5" width="16" height="14" rx="3.5"/><path d="M4 10h16M9 14c.8 1 1.8 1.5 3 1.5s2.2-.5 3-1.5"/>'),
  note: sv('<rect x="5" y="4" width="14" height="16" rx="3"/><path d="M9 9h6M9 12.5h6"/>', 18),
  person: '<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><circle cx="12" cy="9" r="3.4" fill="currentColor"/><path d="M5.5 19c.8-3.2 3.4-5 6.5-5s5.7 1.8 6.5 5z" fill="currentColor"/></svg>',
};
/* знак GRIF: три пера крыла, свой рисунок */
const WING =
  '<svg class="lv-wing" viewBox="0 0 44 26" aria-hidden="true"><path d="M1 3.5C15 2 30 5.5 43 15 32 10.5 20 9.5 9 10.5z"/><path d="M8 11.5c11-1 22 1.4 32 7-9-2.6-17-3-25-2.2z"/><path d="M15 17.6c8.5-.6 16.5 1 23.5 4.6-7-1.4-13.4-1.6-19.6-1z"/></svg>';

const HTML = `<div class="lv-grif">
  <aside class="lv-side">
    <div class="lv-brand">${WING}<b>GRIF</b><span class="lv-tools"><i>${I.search}</i><i>${I.panel}</i></span></div>
    <button type="button" class="lv-nav lv-new is-on" data-new>${I.plusBox}<span>Новый чат</span></button>
    <div class="lv-nav">${I.feed}<span>Лента</span></div>
    <div class="lv-nav">${I.memory}<span>Память</span></div>
    <div class="lv-nav">${I.sources}<span>Источники</span></div>
    <p class="lv-group">Избранное ${I.chev}</p>
    <p class="lv-item">Бриф к созвону с инвестором</p>
    <p class="lv-item">Разбор почты за неделю</p>
    <p class="lv-group">Недавнее ${I.chev}</p>
    <p class="lv-item is-on" data-recent hidden>Анализ встречи</p>
    <p class="lv-item">Подскажи погоду на завтра в Токио</p>
    <p class="lv-item">Отели рядом с Сибуей</p>
    <div class="lv-user"><span class="lv-ava">Н</span><span><b>Никита</b><small>4 источника</small></span></div>
  </aside>
  <main class="lv-main">
    <header class="lv-head" data-head hidden><span>Анализ встречи</span>${I.chev}</header>
    <section class="lv-home" data-home>
      <h2 class="lv-hi">Привет, Никита <span class="lv-wave">👋</span></h2>
      <p class="lv-sub">Чем помочь тебе сегодня?</p>
      <div class="lv-comp lv-live-border">
        <div class="lv-files" data-files></div>
        <textarea class="lv-input" data-prompt rows="3" placeholder="Спросите GRIF о чём угодно…" aria-label="Запрос"></textarea>
        <div class="lv-bar"><span class="lv-ic">${I.plus}</span><span class="lv-grow"></span><span class="lv-ic">${I.mic}</span>
          <button type="button" class="lv-send" data-send aria-label="Отправить">${I.send}</button></div>
      </div>
      <div class="lv-chips">
        <button type="button" class="lv-chip" data-send>${I.mail}<span>Отправить follow-up письмо</span></button>
        <span class="lv-chip">${I.wand}<span>Резюме встречи</span></span>
        <span class="lv-chip">${I.ticket}<span>Забронировать рейс в Токио</span></span>
      </div>
    </section>
    <section class="lv-chat" data-chat hidden>
      <div class="lv-scroll" data-scroll><div class="lv-thread">
        <div class="lv-me"><div class="lv-me-files" data-me-files></div><div class="lv-bubble" data-bubble></div></div>
        <div class="lv-reason">
          <button type="button" class="lv-sum" data-sum hidden><i class="lv-sum-dot"></i><span>Собрал контекст — 4 источника, 1 мин 47 сек</span>${I.chev}</button>
          <div class="lv-steps" data-steps>
            <p class="lv-meta">Сегодня, 10:41 · Анализ контекста</p>
            <ol class="lv-list">${THINK.map((t) => `<li hidden><i class="lv-dot"></i><span>${t}</span></li>`).join("")}</ol>
          </div>
        </div>
        <div class="lv-answer" data-answer hidden>
          <h3 class="lv-title">Бриф готов. Главное за минуту — и я подготовил follow-up</h3>
          <p class="lv-p" data-p1></p>
          <p class="lv-p" data-p2></p>
          <div class="lv-src" data-src hidden><span class="lv-ok">${I.checks}</span><span class="lv-mut">На основе</span>
            <span class="lv-tag"><i></i>Записи встречи</span><span class="lv-tag"><i></i>Telegram</span><span class="lv-tag"><i></i>Gmail</span><span class="lv-tag"><i></i>Notion</span></div>
          <div class="lv-mem" data-mem hidden><span class="lv-mem-ic">${I.box}</span><span class="lv-grow">Запомнил: при Сергее не упоминать конкурента X <span class="lv-mut">(судебный процесс)</span></span>
            <button type="button" class="lv-link" data-forget>Не запоминать</button></div>
          <article class="lv-card" data-card hidden>
            <div class="lv-card-top"><span class="lv-mark">${WING}</span><span class="lv-grow"><b>Готов отправить follow-up письмо</b><small>Подготовил черновик — проверьте перед отправкой</small></span>
              <span class="lv-badge">${I.mail}Отправка</span></div>
            <dl class="lv-fields"><dt>Кому:</dt><dd><span class="lv-pic">${I.person}</span>Сергей · AcmeCorp <span class="lv-mut">sergey@acmecorp.com</span></dd>
              <dt>Тема:</dt><dd data-subj>${SUBJECT}</dd></dl>
            <p class="lv-body" data-preview>${PREVIEW}</p>
            <div class="lv-card-foot" data-foot>
              <span class="lv-safe">${I.shield}<span data-safe>Без вашего подтверждения не отправлю</span></span>
              <span class="lv-acts" data-acts><button type="button" class="lv-btn lv-btn--ghost" data-edit>Редактировать</button>
                <button type="button" class="lv-btn lv-btn--soft" data-reject>Отклонить</button>
                <button type="button" class="lv-btn lv-btn--main" data-mail>${I.send}<span>Отправить</span></button></span>
            </div>
          </article>
          <div class="lv-row lv-row--off" data-rejected hidden><span class="lv-row-ic">${I.close}</span>
            <span class="lv-grow"><b>Черновик отклонён</b><small>Письмо не уйдёт</small></span>
            <button type="button" class="lv-btn lv-btn--line" data-restore>${I.undo}<span>Вернуть</span></button></div>
          <div class="lv-row" data-sent hidden><span class="lv-row-ic lv-row-ic--ok">${I.check}</span>
            <span class="lv-grow"><b>Письмо отправлено Сергею</b><small>через Gmail · сегодня, 10:42</small></span>
            <button type="button" class="lv-btn lv-btn--line" data-undo>${I.undo}<span>Вернуть</span></button></div>
          <div class="lv-more" data-more hidden><p class="lv-mut">Могу заодно:</p>
            <span class="lv-chip lv-chip--sm">${I.bell}<span>Созвон в четверг, 15:00</span></span>
            <span class="lv-chip lv-chip--sm">${I.list}<span>Собрать тезисы к пилоту</span></span>
            <span class="lv-chip lv-chip--sm">${I.star}<span>Добавить Сергея в избранное</span></span></div>
        </div>
      </div></div>
      <div class="lv-comp lv-comp--dock lv-live-border">
        <textarea class="lv-input" rows="1" placeholder="Спросите GRIF о чём угодно…" aria-label="Запрос"></textarea>
        <div class="lv-bar"><span class="lv-ic">${I.plus}</span><span class="lv-grow"></span><span class="lv-ic">${I.mic}</span>
          <span class="lv-send is-off" aria-hidden="true">${I.send}</span></div>
      </div>
    </section>
    <p class="lv-note">GRIF работает, но может ошибаться — проверяйте важное</p>
    <div class="lv-toast" data-toast hidden><span class="lv-row-ic lv-row-ic--ok">${I.check}</span><span>Письмо отправлено</span>
      <button type="button" class="lv-toast-btn" data-undo>Отменить</button></div>
  </main>
  <div class="lv-shade" data-shade hidden></div>
  <aside class="lv-panel" data-panel hidden aria-label="Черновик письма">
    <div class="lv-panel-head"><span class="lv-panel-ic">${I.note}</span><span class="lv-grow"><b>Черновик письма</b><small>отправится через Gmail</small></span>
      <button type="button" class="lv-x" data-close aria-label="Закрыть">${I.close}</button></div>
    <p class="lv-panel-say">${WING}<span>Подготовил на основе встречи и переписки. Поправьте — и отправлю.</span></p>
    <div class="lv-panel-f"><span class="lv-mut">Кому:</span><span><span class="lv-pic">${I.person}</span>Сергей · sergey@acmecorp.com</span></div>
    <label class="lv-panel-f"><span class="lv-mut">Тема:</span><input class="lv-field" data-subj-in value="${SUBJECT}"></label>
    <textarea class="lv-field lv-letter" data-letter aria-label="Текст письма"></textarea>
    <div class="lv-panel-foot"><p class="lv-saved">${I.note}<span>Сохранено в черновик</span></p>
      <div class="lv-panel-acts"><button type="button" class="lv-btn lv-btn--soft lv-btn--wide" data-close>Закрыть</button>
        <button type="button" class="lv-btn lv-btn--main lv-btn--wide" data-mail>${I.send}<span>Отправить</span></button></div></div>
  </aside>
</div>`;

const proto: LiveProto = {
  design: { w: 1100 },
  mount(root, ctx) {
    const calm = ctx.calm;
    root.innerHTML = HTML;
    const box = root.firstElementChild as HTMLElement;
    box.classList.toggle("is-calm", calm);
    const q = <T extends HTMLElement = HTMLElement>(s: string) => box.querySelector<T>(s)!;
    const qa = <T extends HTMLElement = HTMLElement>(s: string) => [...box.querySelectorAll<T>(s)];

    const home = q("[data-home]"), chat = q("[data-chat]"), head = q("[data-head]"), recent = q("[data-recent]"), newChat = q("[data-new]");
    const prompt = q<HTMLTextAreaElement>("[data-prompt]"), filesEl = q("[data-files]"), sendBtn = q("button.lv-send");
    const scroller = q("[data-scroll]"), bubble = q("[data-bubble]"), meFiles = q("[data-me-files]");
    const sum = q("[data-sum]"), stepsEl = q("[data-steps]"), lis = qa("[data-steps] li");
    const answer = q("[data-answer]"), p1 = q("[data-p1]"), p2 = q("[data-p2]");
    const src = q("[data-src]"), mem = q("[data-mem]"), card = q("[data-card]"), more = q("[data-more]");
    const acts = q("[data-acts]"), safe = q("[data-safe]"), cardSend = q("[data-card] [data-mail]");
    const rejected = q("[data-rejected]"), sent = q("[data-sent]"), toast = q("[data-toast]");
    const panel = q("[data-panel]"), shade = q("[data-shade]"), panelSend = q("[data-panel] [data-mail]");
    const subjIn = q<HTMLInputElement>("[data-subj-in]"), letter = q<HTMLTextAreaElement>("[data-letter]");
    const subj = q("[data-subj]"), preview = q("[data-preview]"), restore = q("[data-restore]");

    let files = FILES.slice();
    let run = 0;
    let timers: number[] = [];
    const stop = () => { run += 1; timers.forEach(clearTimeout); timers = []; };
    const wait = (ms: number) => new Promise<void>((r) => { timers.push(window.setTimeout(r, ms)); });

    const hint = (el: HTMLElement | null) => {
      qa(".pt-hint").forEach((n) => n.classList.remove("pt-hint"));
      el?.classList.add("pt-hint");
    };
    /* появление — только прозрачность */
    const reveal = (el: HTMLElement) => {
      el.hidden = false;
      if (calm) return;
      el.classList.remove("lv-in");
      void el.offsetWidth;
      el.classList.add("lv-in");
    };
    const down = (smooth = !calm) => scroller.scrollTo({ top: scroller.scrollHeight, behavior: smooth ? "smooth" : "auto" });

    const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
    function paintFiles() {
      filesEl.innerHTML = files.map((f, i) => `<span class="lv-file"><span class="lv-file-ic">${I.file}</span><span><b>${esc(f.name)}</b><small>${f.size}</small></span>
        <button type="button" class="lv-file-x" data-drop="${i}" aria-label="Убрать файл">${I.x}</button></span>`).join("");
      filesEl.hidden = !files.length;
    }
    function resetDraft() {
      subjIn.value = SUBJECT;
      letter.value = LETTER;
      subj.textContent = SUBJECT;
      preview.textContent = PREVIEW;
    }

    /* экраны */
    function toHome() {
      home.hidden = false; chat.hidden = true; head.hidden = true; recent.hidden = true;
      newChat.classList.add("is-on");
      closePanel(false);
      toast.hidden = true;
      hint(sendBtn);
    }
    function toChat() {
      home.hidden = true; chat.hidden = false; head.hidden = false; recent.hidden = false;
      newChat.classList.remove("is-on");
      bubble.textContent = prompt.value.trim() || PROMPT;
      meFiles.innerHTML = files.map((f) => `<span class="lv-file lv-file--sm"><span class="lv-file-ic">${I.file}</span><span><b>${esc(f.name)}</b><small>${f.size}</small></span></span>`).join("");
      meFiles.hidden = !files.length;
    }
    /* ответ целиком, как после разбора */
    function answerDone() {
      lis.forEach((li) => { li.hidden = false; li.className = "is-done"; });
      stepsEl.hidden = true; sum.hidden = false; sum.classList.remove("is-open");
      answer.hidden = false; p1.textContent = P1; p2.textContent = P2;
      src.hidden = false; mem.hidden = false; card.hidden = false; more.hidden = false;
      qa(".lv-in").forEach((n) => n.classList.remove("lv-in"));
    }
    type CardState = "ready" | "sent" | "rejected";
    function setCard(s: CardState) {
      card.hidden = s === "rejected";
      card.classList.toggle("is-sent", s === "sent");
      acts.hidden = s === "sent";
      safe.textContent = s === "sent" ? "Отправлено после вашего подтверждения" : "Без вашего подтверждения не отправлю";
      sent.hidden = s !== "sent";
      rejected.hidden = s !== "rejected";
      toast.hidden = s !== "sent";
      hint(s === "ready" ? cardSend : s === "rejected" ? restore : null);
    }

    /* шаг 1: GRIF читает источники — строки по одной, потом сворачиваются в сводку, ответ печатается */
    async function think() {
      const my = run;
      const alive = () => my === run;
      toChat();
      hint(null);
      answer.hidden = true;
      [src, mem, card, more, sent, rejected].forEach((n) => { n.hidden = true; });
      card.classList.remove("is-sent"); acts.hidden = false;
      p1.textContent = ""; p2.textContent = "";
      sum.hidden = true; stepsEl.hidden = false;
      lis.forEach((li) => { li.hidden = true; li.className = ""; });
      scroller.scrollTop = 0;
      if (calm) {
        lis.forEach((li) => { li.hidden = false; li.className = "is-done"; });
        await wait(1600); if (!alive()) return;
        answerDone(); setCard("ready"); toast.hidden = true; down(false);
        ctx.go(2);
        return;
      }
      await wait(380); if (!alive()) return;
      for (const li of lis) {
        reveal(li); li.className = "is-now"; down();
        await wait(560); if (!alive()) return;
        li.className = "is-done";
      }
      await wait(260); if (!alive()) return;
      stepsEl.hidden = true; reveal(sum); reveal(answer);
      for (const [p, text] of [[p1, P1], [p2, P2]] as const) {
        const words = text.split(" ");
        for (let i = 2; i < words.length + 2; i += 2) {
          p.textContent = words.slice(0, i).join(" ");
          if (i % 8 === 0) down();
          await wait(30); if (!alive()) return;
        }
        await wait(120); if (!alive()) return;
      }
      for (const n of [src, mem, card, more]) {
        reveal(n); down();
        await wait(170); if (!alive()) return;
      }
      setCard("ready"); toast.hidden = true;
      await wait(220); if (!alive()) return;
      down();
      ctx.go(2);
    }

    function openPanel() {
      reveal(shade); reveal(panel);
      hint(panelSend);
      letter.scrollTop = 0;
    }
    function closePanel(back = true) {
      panel.hidden = true; shade.hidden = true;
      if (back && !card.hidden && !card.classList.contains("is-sent")) hint(cardSend);
    }
    function sendMail() {
      if (card.classList.contains("is-sent")) return;
      closePanel(false);
      setCard("sent");
      if (!calm) { reveal(toast); reveal(sent); }
      timers.push(window.setTimeout(() => { toast.hidden = true; }, 7000));
      requestAnimationFrame(() => down());
      ctx.go(3);
    }

    function show(k: number) {
      stop();
      closePanel(false);
      mem.hidden = false;
      if (k <= 0) {
        files = FILES.slice(); paintFiles();
        prompt.value = PROMPT; resetDraft();
        toHome();
        return;
      }
      resetDraft();
      if (k === 1) { void think(); return; }
      toChat(); answerDone();
      setCard(k >= 3 ? "sent" : "ready");
      requestAnimationFrame(() => down(false));
    }

    const onClick = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      const drop = t.closest<HTMLElement>("[data-drop]");
      if (drop) { files.splice(Number(drop.dataset.drop), 1); paintFiles(); return; }
      if (t.closest("[data-send]")) {
        if (!home.hidden) { stop(); resetDraft(); ctx.go(1); void think(); }
        return;
      }
      if (t.closest("[data-new]")) { if (home.hidden) { show(0); ctx.go(0); } return; }
      if (t.closest("[data-sum]")) { const open = stepsEl.hidden === true; stepsEl.hidden = !open; sum.classList.toggle("is-open", open); return; }
      if (t.closest("[data-forget]")) { mem.hidden = true; return; }
      if (t.closest("[data-edit]")) return openPanel();
      if (t.closest("[data-close]")) return closePanel();
      if (t.closest("[data-shade]")) return closePanel();
      if (t.closest("[data-mail]")) return sendMail();
      if (t.closest("[data-reject]")) { setCard("rejected"); if (!calm) reveal(rejected); return; }
      if (t.closest("[data-restore]")) { setCard("ready"); if (!calm) reveal(card); return; }
      if (t.closest("[data-undo]")) {
        setCard("ready");
        ctx.go(2);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.target === prompt && e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        if (!home.hidden) { stop(); resetDraft(); ctx.go(1); void think(); }
      }
      if (e.key === "Escape" && !panel.hidden) closePanel();
    };
    const onInput = (e: Event) => {
      if (e.target === subjIn) subj.textContent = subjIn.value || SUBJECT;
      if (e.target === letter) {
        const flat = letter.value.replace(/\s*\n+\s*/g, " ").trim();
        preview.textContent = flat.length > 132 ? flat.slice(0, 130).trimEnd() + "…" : flat;
      }
    };
    box.addEventListener("click", onClick);
    box.addEventListener("keydown", onKey);
    box.addEventListener("input", onInput);

    show(0);
    return {
      show,
      destroy() {
        stop();
        box.removeEventListener("click", onClick);
        box.removeEventListener("keydown", onKey);
        box.removeEventListener("input", onInput);
        root.innerHTML = "";
      },
    };
  },
};
export default proto;
