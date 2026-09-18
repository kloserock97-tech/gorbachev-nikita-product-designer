/* v37: живые куски интерфейса на странице кейса (docs/prompts/v37.md, этап 4).
   Не видео, а разметка, которая проигрывает короткий сценарий, когда попадает в кадр: воссоздание
   реальных экранов кейса. Тексты и состояния — со скриншотов и из caseDetails (бриф, чипы источников,
   «Без вашего подтверждения не отправлю», разбор архива со скелетонами, «не применим» с причиной).
   Где названий нет в источниках (риски), строки остаются скелетонами — ничего не досочиняем.
   Сценарий — async-функция с токеном отмены: ушёл из кадра, сменил язык или закрыл кейс — останавливается.
   prefers-reduced-motion — сразу конечный кадр. */
import { getLang } from "../i18n";
import { screenMarkup, screenPlay } from "./caseScreenMotion";

type L = { en: string; ru: string };
const tr = (x: L) => (getLang() === "ru" ? x.ru : x.en);
const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

type Run = { stopped: boolean };
const wait = (run: Run, ms: number) =>
  new Promise<void>((ok, no) => window.setTimeout(() => (run.stopped ? no(new Error("stop")) : ok()), reduced() ? 0 : ms));

const T = {
  label: { en: "Interface walkthrough", ru: "Обзор интерфейса" },
  replay: { en: "Play again", ru: "Ещё раз" },
  grif: {
    ask: { en: "Prep me for the call with Sergey", ru: "Подготовь меня к созвону с Сергеем" },
    thinking: { en: "Thinking", ru: "Думаю" },
    steps: [
      { en: "Opened the calendar and the thread with Sergey", ru: "Открыл календарь и переписку с Сергеем" },
      { en: "Collecting what you agreed on", ru: "Собираю, о чём договорились" },
      { en: "Drafting a follow-up", ru: "Готовлю follow-up" },
    ],
    thought: { en: "Gathered context: 4 sources", ru: "Собрал контекст: 4 источника" },
    answer: { en: "Brief's ready. The gist in a minute, and I've drafted a follow-up.", ru: "Бриф готов. Главное за минуту — и я подготовил follow-up." },
    basedOn: { en: "Based on", ru: "На основе" },
    card: { en: "Ready to send a follow-up", ru: "Готов отправить follow-up письмо" },
    to: { en: "To", ru: "Кому" },
    subject: { en: "Subject", ru: "Тема" },
    who: { en: "Sergey · AcmeCorp", ru: "Сергей · AcmeCorp" },
    subj: { en: "Partnership follow-up: next steps", ru: "Follow-up по партнёрству — next steps" },
    guard: { en: "I won't send without your OK", ru: "Без вашего подтверждения не отправлю" },
    edit: { en: "Edit", ru: "Редактировать" },
    decline: { en: "Decline", ru: "Отклонить" },
    send: { en: "Send", ru: "Отправить" },
    sent: { en: "Email sent", ru: "Письмо отправлено" },
    undo: { en: "Undo", ru: "Отменить" },
    input: { en: "Ask GRIF anything", ru: "Спросите GRIF о чём угодно" },
  },
  agents: {
    title: { en: "Agent: client dialogue planning", ru: "Агент планирования диалога с клиентом" },
    version: { en: "Version 3 · Assessment", ru: "Версия 3 · Оценка" },
    drop: { en: "Upload the archive: code base and business requirements", ru: "Загрузите архив: кодовая база и бизнес-требования" },
    parsing: { en: "Generating risks from the documents", ru: "Формирование рисков на основе документов" },
    list: { en: "Risk list", ru: "Список рисков" },
    count: { en: "13 risk types drafted", ru: "13 типов рисков в черновике" },
    r1: { en: "Prompt injection", ru: "Промпт-инъекции" },
    r2: { en: "AI platform failure", ru: "Отказ ИИ-платформы" },
    levels: [{ en: "High", ru: "Высокий" }, { en: "Medium", ru: "Средний" }, { en: "Low", ru: "Низкий" }],
    na: { en: "Risk not applicable", ru: "Риск не применим" },
    why: { en: "Describe the reason", ru: "Опишите причину" },
    reason: { en: "Doesn't match our requirements", ru: "Так как не соответствует нашим требованиям" },
    cancel: { en: "Cancel", ru: "Отмена" },
    accept: { en: "Accept", ru: "Принять" },
    marked: { en: "Not applicable · reason saved", ru: "Не применим · причина сохранена" },
  },
  spam: {
    title: { en: "Protection setup", ru: "Настройка защиты" },
    sub: { en: "Three permissions — one clear result", ru: "Три разрешения — один понятный результат" },
    steps: [
      { en: "Identify suspicious calls", ru: "Определять подозрительные звонки" },
      { en: "Block known spam numbers", ru: "Блокировать известный спам" },
      { en: "Update the protection database", ru: "Обновлять базу защиты" },
    ],
    allow: { en: "Enable", ru: "Включить" },
    done: { en: "Enabled", ru: "Включено" },
    ready: { en: "Protection is active", ru: "Защита активна" },
    score: { en: "Protection level", ru: "Уровень защиты" },
  },
};

const icon = {
  replay: `<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10a6 6 0 1 0 2-4.5"/><path d="M4 3.5V7h3.5"/></svg>`,
  send: `<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3.5 10 16 4l-4.5 12-2.2-4.8z"/></svg>`,
  file: `<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M6 2.8h5.5L15 6.3v10.9H6z"/><path d="M11.3 2.8v3.7H15"/></svg>`,
  shield: `<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 2.8 16 5v4.6c0 3.8-2.6 6.4-6 7.6-3.4-1.2-6-3.8-6-7.6V5z"/></svg>`,
};

/* ── GRIF: чат ──────────────────────────────────────────────────────────────── */
function grifMarkup() { return screenMarkup("grif-ai"); }
function grifPlay(root: HTMLElement, run: Run) { return screenPlay("grif-ai", root, run); }
function agentsMarkup() { return screenMarkup("ai-agents"); }
function agentsPlay(root: HTMLElement, run: Run) { return screenPlay("ai-agents", root, run); }

function spamMarkup() {
  const s = T.spam;
  return `<div class="dm dm--spam">
    <div class="dm-phone-top"><i></i></div>
    <div class="dm-spam-head"><span>${tr(s.title)}</span><small>${tr(s.sub)}</small></div>
    <div class="dm-shield" data-s="shield"><span data-score>0%</span><small>${tr(s.score)}</small></div>
    <ol class="dm-permissions">${s.steps.map((step, i) => `<li data-step="${i}"><span><i></i>${tr(step)}</span><button type="button" tabindex="-1">${tr(s.allow)}</button></li>`).join("")}</ol>
    <div class="dm-spam-ready" data-s="ready"><b>✓</b><span>${tr(s.ready)}</span></div>
  </div>`;
}

async function spamPlay(root: HTMLElement, run: Run) {
  const score = root.querySelector<HTMLElement>("[data-score]")!;
  const shield = root.querySelector<HTMLElement>('[data-s="shield"]')!;
  const ready = root.querySelector<HTMLElement>('[data-s="ready"]')!;
  root.querySelectorAll<HTMLElement>("[data-step]").forEach((row) => {
    row.classList.remove("is-done");
    row.querySelector("button")!.textContent = tr(T.spam.allow);
  });
  shield.classList.remove("is-in"); ready.classList.remove("is-in"); score.textContent = "0%";
  await wait(run, 350); shield.classList.add("is-in");
  const rows = [...root.querySelectorAll<HTMLElement>("[data-step]")];
  for (let i = 0; i < rows.length; i++) {
    await wait(run, 650);
    rows[i].classList.add("is-done");
    rows[i].querySelector("button")!.textContent = tr(T.spam.done);
    score.textContent = `${Math.round(((i + 1) / rows.length) * 100)}%`;
  }
  await wait(run, 550); ready.classList.add("is-in");
}

const DEMOS: Record<string, { markup: () => string; play: (root: HTMLElement, run: Run) => Promise<void> }> = {
  "grif-ai": { markup: grifMarkup, play: grifPlay },
  "ai-agents": { markup: agentsMarkup, play: agentsPlay },
  "stop-spam": { markup: spamMarkup, play: spamPlay },
};

export const hasDemo = (id: string) => id in DEMOS;

/** разметка блока с демо для кейса (или пустая строка) */
export function demoBlock(id: string) {
  const d = DEMOS[id];
  if (!d) return "";
  return `<figure class="dm-wrap" data-demo="${id}" aria-label="${tr(T.label)}">
    <div class="dm-stage">${d.markup()}</div>
    <figcaption><span class="dm-live"><i></i>${tr(T.label)}</span><button type="button" class="dm-replay">${icon.replay}${tr(T.replay)}</button></figcaption>
  </figure>`;
}

/** запускает демо, когда блок виден; возвращает функцию остановки */
export function mountDemos(root: HTMLElement, scroller: HTMLElement) {
  const runs = new Map<HTMLElement, Run>();
  const start = (wrap: HTMLElement) => {
    const id = wrap.dataset.demo!;
    const prev = runs.get(wrap);
    if (prev) prev.stopped = true;
    const run: Run = { stopped: false };
    runs.set(wrap, run);
    const stage = wrap.querySelector<HTMLElement>(".dm")!;
    wrap.classList.add("is-playing");
    DEMOS[id].play(stage, run).finally(() => {
      if (runs.get(wrap) === run) wrap.classList.remove("is-playing");
    }).catch(() => {});
  };
  const played = new WeakSet<HTMLElement>();
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      const wrap = e.target as HTMLElement;
      if (e.isIntersecting && !played.has(wrap)) { played.add(wrap); start(wrap); }
      if (!e.isIntersecting) { const r = runs.get(wrap); if (r) r.stopped = true; played.delete(wrap); }
    }
  }, { root: scroller, threshold: 0.45 });
  root.querySelectorAll<HTMLElement>(".dm-wrap").forEach((w) => {
    io.observe(w);
    w.querySelector(".dm-replay")?.addEventListener("click", () => start(w));
  });
  return () => { io.disconnect(); runs.forEach((r) => (r.stopped = true)); };
}
