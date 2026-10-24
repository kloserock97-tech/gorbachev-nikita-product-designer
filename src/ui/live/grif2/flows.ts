/* 24.10: живые прототипы GRIF на финальных экранах из Figma (секция 1066:3810). Три сценария — три модуля
   для движка caseProto (контракт live/types.ts): шаги панели слева совпадают с шагами в данных кейса.
   · Чат «Письмо после встречи»: новый чат → подсказка «Ответить Сергею» → ответ собирается на глазах →
     «Отправить» → «Письмо отправлено» с обратным отсчётом отмены.
   · Лента: задача в работе → разобрать очередь «Отправить» → «Всё разобрано».
   · Память: досье → запись про маму → «Забыть?» → «Запись забыта · Вернуть».
   Точка нажатия — настоящий слой экрана (кнопка, карточка), найденный по имени из Figma; вокруг него кольцо .pt-hint. */
import type { LiveCtx, LiveInstance, LiveProto } from "../types";
import { createStage, type Stage } from "./stage";

type Flow = (s: Stage, ctx: LiveCtx, step: number) => void;

function hint(s: Stage, el: HTMLElement | null, onTap: () => void) {
  s.el.querySelectorAll(".pt-hint").forEach((n) => n.classList.remove("pt-hint"));
  if (!el) return;
  el.classList.add("pt-hint");
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
    const dur = s.reveal(msg, 520);
    s.later(dur + 200, () => go(2));
    return;
  }
  if (step === 2) {
    s.show("pending", true);
    hint(s, s.find("Button/Отправить"), () => go(3));
    return;
  }
  s.show("done");
  const card = s.find("Action card");
  card?.classList.add("g2-rise");
  s.countdown(card);
};

/* ── лента: задача в работе → очередь → всё разобрано ── */
const feed: Flow = (s, ctx, step) => {
  const go = (k: number) => { ctx.go(k); feed(s, ctx, k); };
  if (step === 0) {
    s.show("feed");
    hint(s, s.hot("Готовлю бриф к встрече с командой", 2), () => go(1));
    return;
  }
  if (step === 1) {
    s.show("feedRun");
    const panel = s.find("Preview", true) ?? s.find("Panel", true);
    panel?.classList.add("g2-rise");
    hint(s, s.find("Button/Отправить"), () => {
      /* строки очереди уходят одна за другой, потом лента пустеет */
      const rows = [...(s.find("Group / Ждут вас")?.querySelectorAll<HTMLElement>(":scope > [data-n='Row']") ?? [])];
      rows.forEach((r, i) => s.later(140 * i, () => r.classList.add("g2-gone")));
      s.later(140 * rows.length + 380, () => go(2));
    });
    return;
  }
  s.show("feedEmpty");
};

/* ── память: забыть запись и вернуть ── */
const memory: Flow = (s, ctx, step) => {
  const go = (k: number) => { ctx.go(k); memory(s, ctx, k); };
  if (step === 0) {
    s.show("memory");
    const mama = s.hot("Мама", 1);
    hint(s, mama, () => go(1));
    /* карточка людей ниже первого экрана окна — доезжаем до неё */
    if (mama) s.later(500, () => mama.scrollIntoView({ block: "center", behavior: ctx.calm ? "auto" : "smooth" }));
    return;
  }
  const el = s.show("forget", true);
  const dialog = s.find("Dialog / Forget"), overlay = s.find("Overlay"), toast = s.find("Toast / after forget");
  const root = el.parentElement!;
  if (step === 1) {
    toast?.classList.add("g2-hide");
    dialog?.classList.add("g2-rise");
    if (dialog) root.scrollTop = Math.max(0, dialog.offsetTop - 160);
    hint(s, s.hot("Забыть", 1, dialog), () => go(2));
    return;
  }
  dialog?.classList.add("g2-hide");
  overlay?.classList.add("g2-hide");
  root.scrollTop = 0;
  toast?.classList.add("g2-rise");
  s.countdown(toast);
};

export const grifChat = make({ w: 1440 }, chat);
export const grifFeed = make({ w: 1440 }, feed);
export const grifMemory = make({ w: 1440 }, memory);
