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

type Run = { stopped: boolean };

const T = {
  label: { en: "Interface walkthrough", ru: "Обзор интерфейса" },
  replay: { en: "Play again", ru: "Ещё раз" },
};

const replayIcon = `<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10a6 6 0 1 0 2-4.5"/><path d="M4 3.5V7h3.5"/></svg>`;

/* ── GRIF: чат ──────────────────────────────────────────────────────────────── */
function grifMarkup() { return screenMarkup("grif-ai"); }
function grifPlay(root: HTMLElement, run: Run) { return screenPlay("grif-ai", root, run); }
function agentsMarkup() { return screenMarkup("ai-agents"); }
function agentsPlay(root: HTMLElement, run: Run) { return screenPlay("ai-agents", root, run); }

function spamMarkup() { return screenMarkup("stop-spam"); }
function spamPlay(root: HTMLElement, run: Run) { return screenPlay("stop-spam", root, run); }
function communityMarkup() { return screenMarkup("community"); }
function communityPlay(root: HTMLElement, run: Run) { return screenPlay("community", root, run); }

const DEMOS: Record<string, { markup: () => string; play: (root: HTMLElement, run: Run) => Promise<void> }> = {
  "grif-ai": { markup: grifMarkup, play: grifPlay },
  "ai-agents": { markup: agentsMarkup, play: agentsPlay },
  "stop-spam": { markup: spamMarkup, play: spamPlay },
  "community": { markup: communityMarkup, play: communityPlay },
};

export const hasDemo = (id: string) => id in DEMOS;

/** разметка блока с демо для кейса (или пустая строка) */
export function demoBlock(id: string) {
  const d = DEMOS[id];
  if (!d) return "";
  return `<figure class="dm-wrap" data-demo="${id}" aria-label="${tr(T.label)}">
    <div class="dm-stage">${d.markup()}</div>
    <figcaption><span class="dm-live"><i></i>${tr(T.label)}</span><button type="button" class="dm-replay">${replayIcon}${tr(T.replay)}</button></figcaption>
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
