/* v37: «Спросите о моей работе» — чат со сценарными ответами (docs/prompts/v37.md, этап 5).
   Разнообразит прохождение портфолио: вместо чтения по порядку можно спросить и перейти сразу к нужному
   кейсу или подзадаче. Это не ИИ: ответы написаны заранее из текстов сайта (caseDetails, подзадачи,
   презентация лидерства), и панель прямо об этом говорит. Ссылки #/work/... открывает caseView. */
import { getLang, onLang } from "../i18n";
import { cue } from "../audio/bus";

type L = { en: string; ru: string };
type Link = { href: string; label: L; external?: boolean };
type QA = { q: L; a: L; links: Link[] };

const tr = (x: L) => (getLang() === "ru" ? x.ru : x.en);
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

const UI = {
  open: { en: "Ask about my work", ru: "Спросите о моей работе" },
  title: { en: "Ask about my work", ru: "Спросите о моей работе" },
  note: { en: "Answers written by Nikita in advance, not generated", ru: "Ответы Никита написал заранее, это не генерация" },
  hello: { en: "Hi! Pick a question and I'll point you to the right case.", ru: "Привет! Выберите вопрос, и я подскажу, какой кейс открыть." },
  close: { en: "Close", ru: "Закрыть" },
  again: { en: "Other questions", ru: "Другие вопросы" },
};

const QAS: QA[] = [
  {
    q: { en: "What did you do at Sber?", ru: "Чем ты занимался в Сбере?" },
    a: {
      en: "Two things at once. I designed the AI agent risk registry: the assessment moved out of Jira and Excel, and six manual handoffs dropped to zero. For about a year I also led the design team (a senior, two middles and an intern) without a formal title.",
      ru: "Две вещи сразу. Спроектировал реестр рисков ИИ-агентов: оценка ушла из Jira и Excel, шесть ручных передач сократились до нуля. И около года вёл дизайн-команду (senior, два middle и стажёр) без формального назначения.",
    },
    links: [
      { href: "#/work/ai-agents", label: { en: "AI agent risks", ru: "Риски ИИ-агентов" } },
      { href: "#/work/ai-agents/lead", label: { en: "Team lead", ru: "Лидерство" } },
    ],
  },
  {
    q: { en: "Show me your work with AI", ru: "Покажи работу с ИИ" },
    a: {
      en: "Two cases. GRIF AI is a proactive assistant I designed solo, with AI agents drawing in Figma and moving components to Storybook. At Sber I designed the registry where AI agents themselves get their risks assessed.",
      ru: "Два кейса. GRIF AI — проактивный ассистент, который я проектировал один, а рисовали в Figma и переносили компоненты в Storybook ИИ-агенты. В Сбере я спроектировал реестр, где риски оценивают у самих ИИ-агентов.",
    },
    links: [
      { href: "#/work/grif-ai", label: { en: "GRIF AI", ru: "GRIF AI" } },
      { href: "#/work/grif-ai/pipeline", label: { en: "Agent pipeline", ru: "Конвейер агентов" } },
      { href: "#/work/ai-agents", label: { en: "AI agent risks", ru: "Риски ИИ-агентов" } },
    ],
  },
  {
    q: { en: "How do you lead a team?", ru: "Как ты ведёшь команду?" },
    a: {
      en: "Through process rather than more screens: a task template with goals and done criteria, regular design reviews, a design debt backlog and a shared design system. A weekly digest and demo sessions got design invited before decisions, not after.",
      ru: "Через процессы, а не через количество экранов: шаблон задачи с целями и критериями готовности, регулярное дизайн-ревью, учёт дизайн-долга и общая дизайн-система. Еженедельный дайджест и демо-сессии сделали так, что дизайн зовут до решений, а не после.",
    },
    links: [{ href: "#/work/ai-agents/lead", label: { en: "Team lead at Sber", ru: "Лидерство в Сбере" } }],
  },
  {
    q: { en: "Where are the numbers?", ru: "Где есть цифры?" },
    a: {
      en: "Moderator Dashboard: 38% fewer steps per task. Stop Spam: +25% conversion in the permission onboarding. Community: zero to MVP in nine months, then 250+ stories through moderation in three months.",
      ru: "Кабинет модератора: на 38% меньше шагов на задачу. Стоп Спам: +25% к конверсии онбординга с доступами. Сообщество: с нуля до MVP за девять месяцев, потом 250+ историй через модерацию за три месяца.",
    },
    links: [
      { href: "#/work/moderator-dashboard", label: { en: "Moderator Dashboard", ru: "Кабинет модератора" } },
      { href: "#/work/stop-spam", label: { en: "Stop Spam", ru: "Стоп Спам" } },
      { href: "#/work/community", label: { en: "Community", ru: "Сообщество" } },
    ],
  },
  {
    q: { en: "How can I reach you?", ru: "Как с тобой связаться?" },
    a: {
      en: "Email is the fastest: kloserock97@gmail.com. Telegram and LinkedIn work too.",
      ru: "Быстрее всего по почте: kloserock97@gmail.com. Telegram и LinkedIn тоже подойдут.",
    },
    links: [
      { href: "mailto:kloserock97@gmail.com", label: { en: "Email", ru: "Почта" }, external: true },
      { href: "https://t.me/Gorbachev_Nikita_Designer", label: { en: "Telegram", ru: "Telegram" }, external: true },
      { href: "https://www.linkedin.com/in/nikita-gorbachev-productdesigner", label: { en: "LinkedIn", ru: "LinkedIn" }, external: true },
    ],
  },
];

const ICON = {
  spark: `<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 2.5c.4 3.6 2 5.3 5.5 5.7-3.5.4-5.1 2.1-5.5 5.7-.4-3.6-2-5.3-5.5-5.7 3.5-.4 5.1-2.1 5.5-5.7Z"/><path d="M15.5 13.5c.2 1.4.8 2 2 2.2-1.2.2-1.8.8-2 2.2-.2-1.4-.8-2-2-2.2 1.2-.2 1.8-.8 2-2.2Z"/></svg>`,
  close: `<svg viewBox="0 0 20 20" aria-hidden="true"><path d="m5 5 10 10M15 5 5 15"/></svg>`,
};

export function initAskPortfolio() {
  const wrap = document.createElement("div");
  wrap.className = "ask";
  document.body.appendChild(wrap);
  let open = false;
  let busy = 0; // номер текущего ответа: новый вопрос обрывает печать старого

  const render = () => {
    wrap.innerHTML = `
      <button type="button" class="ask-launch metal" aria-expanded="${open}" aria-controls="ask-panel">${ICON.spark}<span>${tr(UI.open)}</span></button>
      <section class="ask-panel" id="ask-panel" role="dialog" aria-label="${tr(UI.title)}"${open ? "" : " hidden"}>
        <header class="ask-head">
          <div><b>${tr(UI.title)}</b><span>${tr(UI.note)}</span></div>
          <button type="button" class="ask-close" aria-label="${tr(UI.close)}">${ICON.close}</button>
        </header>
        <div class="ask-log" aria-live="polite"><div class="ask-msg ask-msg--bot">${tr(UI.hello)}</div></div>
        <div class="ask-chips">${QAS.map((x, i) => `<button type="button" data-q="${i}">${esc(tr(x.q))}</button>`).join("")}</div>
      </section>`;
    wrap.querySelector(".ask-launch")!.addEventListener("click", () => toggle(!open));
    wrap.querySelector(".ask-close")!.addEventListener("click", () => toggle(false));
    wrap.querySelectorAll<HTMLButtonElement>("[data-q]").forEach((b) => b.addEventListener("click", () => ask(Number(b.dataset.q))));
    wrap.querySelector(".ask-panel")!.addEventListener("click", (e) => {
      const a = (e.target as Element).closest("a");
      if (a && a.getAttribute("href")?.startsWith("#/work/")) toggle(false);
    });
  };

  const toggle = (v: boolean) => {
    open = v;
    const panel = wrap.querySelector<HTMLElement>(".ask-panel")!;
    wrap.querySelector(".ask-launch")!.setAttribute("aria-expanded", String(v));
    wrap.classList.toggle("is-open", v);
    cue(v ? "open" : "close", 0.5);
    if (v) {
      panel.hidden = false;
      requestAnimationFrame(() => panel.classList.add("is-in"));
      panel.querySelector<HTMLElement>("[data-q]")?.focus({ preventScroll: true });
    } else {
      panel.classList.remove("is-in");
      window.setTimeout(() => { if (!open) panel.hidden = true; }, 260);
      wrap.querySelector<HTMLElement>(".ask-launch")?.focus({ preventScroll: true });
    }
  };

  const ask = async (i: number) => {
    const qa = QAS[i];
    const id = ++busy;
    const log = wrap.querySelector<HTMLElement>(".ask-log")!;
    const chips = wrap.querySelector<HTMLElement>(".ask-chips")!;
    cue("press", 0.5);
    log.insertAdjacentHTML("beforeend", `<div class="ask-msg ask-msg--me">${esc(tr(qa.q))}</div>`);
    const bot = document.createElement("div");
    bot.className = "ask-msg ask-msg--bot is-typing";
    bot.innerHTML = `<span class="ask-dots"><i></i><i></i><i></i></span>`;
    log.appendChild(bot);
    chips.querySelectorAll("button").forEach((b) => b.classList.toggle("is-used", b.dataset.q === String(i)));
    log.scrollTop = log.scrollHeight;
    await new Promise((r) => window.setTimeout(r, reduced() ? 0 : 650));
    if (id !== busy) return;
    bot.classList.remove("is-typing");
    const p = document.createElement("p");
    bot.replaceChildren(p);
    const text = tr(qa.a);
    if (reduced()) p.textContent = text;
    else {
      /* печатаем словами — быстро и без дёрганья переносов */
      const words = text.split(" ");
      for (let k = 0; k < words.length; k++) {
        if (id !== busy) return;
        p.textContent = words.slice(0, k + 1).join(" ");
        log.scrollTop = log.scrollHeight;
        await new Promise((r) => window.setTimeout(r, 28));
      }
    }
    bot.insertAdjacentHTML("beforeend", `<span class="ask-links">${qa.links.map((l) =>
      `<a href="${l.href}"${l.external ? ' target="_blank" rel="noopener"' : ""}>${esc(tr(l.label))} <span aria-hidden="true">${l.external ? "↗" : "→"}</span></a>`).join("")}</span>`);
    log.scrollTop = log.scrollHeight;
  };

  addEventListener("keydown", (e) => { if (e.key === "Escape" && open) { e.stopPropagation(); toggle(false); } });
  onLang(() => { busy++; render(); if (open) { wrap.querySelector<HTMLElement>(".ask-panel")!.hidden = false; wrap.querySelector(".ask-panel")!.classList.add("is-in"); } });
  render();
}
