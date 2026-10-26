/* 24.10: живые прототипы GRIF на финальных экранах из Figma (секция 1066:3810). Два сценария — два модуля для движка
   caseProto (контракт live/types.ts): шаги панели слева совпадают с шагами в данных кейса.
   · Знакомство в чате: имя → чем занимаетесь → «Запомнил 3 факта» → подключить почту → первая задача → итог.
   · Письмо после встречи: новый чат → подсказка «Ответить Сергею» → ответ собирается на глазах → «Отправить» →
     «Письмо отправлено» с обратным отсчётом отмены.
   Точка нажатия — настоящий слой экрана, найденный по имени из Figma; кольцо вокруг него рисует stage.mark */
import type { LiveCtx, LiveInstance, LiveProto } from "../types";
import { createStage, type Stage } from "./stage";

type Flow = (s: Stage, ctx: LiveCtx, step: number) => void;

/* куда нажать: кольцо отдельным слоем поверх экрана (stage.mark) — на самом слое его срезали бы родители */
function hint(s: Stage, el: HTMLElement | null, onTap: () => void) {
  s.mark(el);
  if (!el) return;
  el.dataset.hot = "";
  el.addEventListener("click", (e) => { e.stopPropagation(); onTap(); }, { once: true });
}

function make(design: { w: number }, flow: Flow): LiveProto {
  return {
    design,
    mount(root, ctx): LiveInstance {
      const s = createStage(root, { base: ctx.base, calm: ctx.calm });
      const show = (k: number) => flow(s, ctx, k);
      show(0);
      return { show, destroy: () => s.destroy() };
    },
  };
}

/* ── чат: письмо после встречи ── */
const chat: Flow = (s, ctx, step) => {
  const go = (k: number) => { ctx.go(k); chat(s, ctx, k); };
  if (step === 0) {
    s.show("new");
    hint(s, s.find("Card"), () => go(1));
    return;
  }
  if (step === 1) {
    /* ответ собирается на глазах: сообщение, «думал», выполненные действия, текст брифа, карточка письма */
    s.show("pending");
    const msg = s.find("Agent message");
    /* текст брифа печатается словами, следующая часть ждёт конца печати */
    const dur = s.reveal(msg, 480, 0, (kid, at) => {
      const text = [...kid.querySelectorAll<HTMLElement>("div"), kid].find((n) => !n.children.length && (n.textContent ?? "").startsWith("Бриф готов"));
      return text ? s.stream(text, at) : 0;
    });
    /* пока ответ собирается, «Думал 12 с» переливается — как статус «думаю» */
    const think = [...(s.find("Reasoning row")?.querySelectorAll<HTMLElement>("div") ?? [])].find((n) => !n.children.length && /Думал|Thought/.test(n.textContent ?? ""));
    think?.classList.add("g2-sheen");
    s.later(dur, () => think?.classList.remove("g2-sheen"));
    s.later(dur + 200, () => go(2));
    return;
  }
  if (step === 2) {
    s.show("pending", true);
    s.find("Action card")?.classList.add("g2-await");
    hint(s, s.find("Button/Отправить"), () => go(3));
    return;
  }
  s.show("done");
  const card = s.find("Action card");
  card?.classList.add("g2-rise");
  s.countdown(card);
};

/* ── знакомство в чате (онбординг): шесть кадров «Онбординг — знакомство 1–6» ──
   Каждый ход: ответ человека выезжает справа, ответ GRIF собирается по частям, длинный текст печатается словами,
   шкала «Знакомство · n из 5» дорастает, кольцо встаёт на следующее действие */
function turn(s: Stage, onReady: () => void) {
  const thread = s.find("Thread");
  const msgs = [...(thread?.children ?? [])] as HTMLElement[];
  const user = [...msgs].reverse().find((m) => m.dataset.n === "User message");
  const agent = [...msgs].reverse().find((m) => m.dataset.n === "Agent message");
  let t = 0;
  if (user) { user.classList.add("g2-from-right"); t = 360; }
  const dur = s.reveal(agent ?? null, 320, 0, (kid, at) => {
    const text = [...kid.querySelectorAll<HTMLElement>("div"), kid].find((n) => !n.children.length && (n.textContent ?? "").length > 48);
    return text ? s.stream(text, t + at, 26) : 0;
  });
  /* reveal считает от нуля — сдвигаем на время выезда ответа человека */
  if (t && agent) [...agent.children].forEach((k) => ((k as HTMLElement).style.animationDelay = `${t}ms`));
  s.later(t + dur, onReady);
}

const onboarding: Flow = (s, ctx, step) => {
  const go = (k: number) => { ctx.go(k); onboarding(s, ctx, k); };
  const key = (["onb1", "onb2", "onb3", "onb4", "onb5", "onb6"] as const)[Math.min(step, 5)];
  s.show(key);
  const target = (): HTMLElement | null => {
    if (step === 0) return s.hot("Никита", 1, s.find("Answer chips"));
    if (step === 1) return s.find("Chip / selected");
    if (step === 2) return s.find("Button/Всё верно");
    if (step === 3) return s.find("Button/Подключить Google");
    if (step === 4) return s.find("Button/Отправить");
    return null;
  };
  if (step === 4) s.find("Action card")?.classList.add("g2-await");
  turn(s, () => {
    /* отсчёт отмены идёт с момента, когда карточка «Письмо отправлено» уже на виду */
    if (step === 5) s.countdown(s.find("Action card"));
    const el = target();
    if (el) hint(s, el, () => go(step + 1));
  });
};

export const grifOnboarding = make({ w: 1440 }, onboarding);
export const grifChat = make({ w: 1440 }, chat);
