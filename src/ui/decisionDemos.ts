/* 23.10: мини-демо решений на странице кейса (глава «Решения»). Идея — ролики решений в кейсе CRM с портфолио
   klinaeva: кусок интерфейса сам проигрывает действие, внизу подпись шага «1 из 3 · …» и пауза. Код свой.

   24.10: внутри — финальные экраны GRIF, перенесённые из Figma один в один (src/ui/live/grif2), на той же сцене,
   что и прототип. Окно продукта целиком, 1440 × 900 с сайдбаром, уменьшенное под ширину блока: видно всё окно
   и как в нём меняется состояние. Ничего не кадрируется и не приближается. Курсор и кольцо подсветки рисуются
   в обратном масштабе, чтобы в уменьшенном окне их было видно. Сценарий — три шага: каждый показывает экран,
   двигает курсор и обводит слой кольцом (слой ищется по имени из Figma или по тексту). Демо только показывает:
   нажать внутри нельзя, для этого есть прототип выше.

   Играет, пока блок на экране; ушёл с экрана — пауза. «Меньше движения» — без автопроигрывания: шаги листаются
   кнопкой, курсор не едет. Экраны грузятся своим чанком, когда блок подъехал к экрану. */
import { getLang } from "../i18n";
import { tidy } from "../lib/typograph";
import type { Stage } from "./live/grif2/stage";
import "./decision-demos.css";

type L = { ru: string; en: string };
type Scene = {
  s: Stage;
  calm: boolean;
  wait: (ms: number) => Promise<void>;
  /** курсор к элементу (по центру или в точку fx, fy в долях элемента) */
  point: (el: HTMLElement | null, fx?: number, fy?: number) => Promise<void>;
  /** нажатие курсором (интерфейсу не передаётся) */
  press: (el: HTMLElement | null) => Promise<void>;
  ring: (el: HTMLElement | null) => void;
};
type Beat = { cap: L; run: (s: Scene) => Promise<void>; hold?: number };
type Demo = { beats: Beat[] };

/** демо показывает окно продукта целиком, как полный экран (размер кадра в Figma), уменьшенным под блок */
const FULL_W = 1440, FULL_H = 900;
const tr = (x: L) => (getLang() === "ru" ? x.ru : x.en);
const T = {
  of: { ru: "из", en: "of" },
  pause: { ru: "Пауза", en: "Pause" },
  play: { ru: "Смотреть", en: "Play" },
  next: { ru: "Следующий шаг", en: "Next step" },
};

/* ── сценарии GRIF: экраны и имена слоёв — из Figma (секция 1066:3810) ─────────────── */
const DEMOS: Record<string, Demo> = {
  "grif-entry": {
    beats: [
      {
        cap: { ru: "Поле ввода стоит в центре нового чата", en: "The input sits in the middle of a new chat" },
        run: async (c) => {
          c.s.show("new");
          const box = c.s.find("Composer v3");
          c.ring(box);
          await c.point(c.s.find("Placeholder"), 0.12, 0.5);
        },
      },
      {
        cap: { ru: "Через @ источник выбирается прямо в поле", en: "Typing @ picks a source right in the input" },
        run: async (c) => {
          c.s.show("input");
          const ph = c.s.find("Placeholder");
          const pop = c.s.find("Mention popover");
          pop?.classList.add("g2-hide");
          await c.point(ph, 0.1, 0.5);
          await c.s.type(ph, "Найди в @Gmail письмо от Сергея про пилот", 34);
          pop?.classList.remove("g2-hide");
          pop?.classList.add("g2-rise");
          c.ring(pop);
          await c.point(c.s.text("Gmail"), 0.5, 0.5);
        },
        hold: 1800,
      },
      {
        cap: { ru: "Или подсказка из дел на сегодня", en: "Or a suggestion from today's tasks" },
        run: async (c) => {
          c.s.show("new");
          const chip = c.s.find("Card");
          c.ring(chip);
          await c.point(chip, 0.4, 0.5);
          await c.press(chip);
        },
      },
    ],
  },
  "grif-reading": {
    beats: [
      {
        cap: { ru: "Пока GRIF работает, видно шаг и сколько осталось", en: "While GRIF works, you see the step and what is left" },
        run: async (c) => {
          c.s.show("working");
          const task = c.s.find("Long task");
          c.ring(task);
          await c.point(task, 0.3, 0.35);
          await c.wait(900);
          await c.point(c.s.text("GRIF работает: шаг 2 из 4 — ищу переписку в Gmail"), 0.4, 0.5);
        },
        hold: 1800,
      },
      {
        cap: { ru: "Готово: «Думал 12 с» и «Выполнил 4 действия»", en: "Done: “Thought for 12 s” and “Ran 4 actions”" },
        run: async (c) => {
          c.s.show("pending");
          /* ответ собирается на глазах: «думал», действия, бриф печатается словами, письмо */
          const msg = c.s.find("Agent message");
          const dur = c.s.reveal(msg, 340, 0, (kid, at) => {
            const text = [...kid.querySelectorAll<HTMLElement>("div"), kid].find((n) => !n.children.length && (n.textContent ?? "").startsWith("Бриф готов"));
            return text ? c.s.stream(text, at, 30) : 0;
          });
          await c.wait(Math.min(dur, 4200));
          const steps = c.s.find("Agent steps");
          c.ring(steps);
          await c.point(steps, 0.25, 0.5);
        },
        hold: 1800,
      },
      {
        cap: { ru: "Под ответом подписано, из чего он собран", en: "Under the answer: what it was built from" },
        run: async (c) => {
          c.s.show("done");
          const src = c.s.text("Gmail · 12 писем")?.parentElement?.parentElement ?? null;
          c.ring(src);
          await c.point(src, 0.5, 0.5);
        },
        hold: 2200,
      },
    ],
  },
  "grif-confirm": {
    beats: [
      {
        cap: { ru: "Письмо приходит черновиком", en: "The email arrives as a draft" },
        run: async (c) => {
          c.s.show("pending");
          const card = c.s.find("Action card");
          card?.classList.add("g2-await");
          c.ring(card);
          await c.point(card, 0.5, 0.35);
        },
      },
      {
        cap: { ru: "«Отправлю только после вашего «да»»", en: "“I'll send it only after your yes”" },
        run: async (c) => {
          const line = c.s.text("Отправлю только после вашего «да»");
          c.ring(line?.parentElement ?? line);
          await c.point(line, 0.5, 0.5);
        },
        hold: 1900,
      },
      {
        cap: { ru: "В Ленте то же: решения ждут вас в «Ждут вас»", en: "Same in the Feed: decisions wait under “Waiting for you”" },
        run: async (c) => {
          c.s.show("feed");
          await c.wait(500);
          const group = c.s.find("Group / Ждут вас");
          c.ring(group);
          const send = c.s.find("Button/Отправить");
          await c.point(send, 0.5, 0.5);
          await c.press(send);
        },
        hold: 2000,
      },
    ],
  },
  "grif-undo": {
    beats: [
      {
        cap: { ru: "Письмо ушло, но «Отменить» держится 8 секунд", en: "Sent, but “Undo” stays for 8 seconds" },
        run: async (c) => {
          c.s.show("done");
          const card = c.s.find("Action card");
          c.ring(card);
          c.s.countdown(card);
          await c.point(c.s.text("Отменить · 8 с"), 0.5, 0.5);
        },
        hold: 2200,
      },
      {
        cap: { ru: "Запомненное тоже можно отменить", en: "What it remembered can be undone too" },
        run: async (c) => {
          const note = c.s.find("Memory note");
          c.ring(note);
          await c.point(c.s.text("Отменить", note), 0.5, 0.5);
        },
      },
      {
        cap: { ru: "Забытое в Памяти — «Вернуть» в течение 10 секунд", en: "Forgotten in Memory: “Restore” for 10 seconds" },
        run: async (c) => {
          c.s.show("forget");
          c.s.find("Dialog / Forget")?.classList.add("g2-hide");
          c.s.find("Overlay")?.classList.add("g2-hide");
          const toast = c.s.find("Toast / after forget");
          toast?.classList.add("g2-rise");
          c.ring(toast);
          c.s.countdown(toast);
          await c.point(toast, 0.75, 0.5);
        },
        hold: 2200,
      },
    ],
  },
};

export const hasDecisionDemo = (id?: string) => !!id && id in DEMOS;

export function decisionDemoBlock(id: string, alt: string) {
  const esc = (s: string) => tidy(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  return `<figure class="dd" data-dd="${id}" style="--dd-ar:${FULL_W} / ${FULL_H}" aria-label="${esc(alt)}">
    <div class="dd-view" aria-hidden="true"><div class="dd-cam"><div class="dd-root"></div><i class="dd-cursor"></i></div></div>
    <figcaption class="dd-bar">
      <span class="dd-step" aria-live="polite"><b data-dd-n></b><span data-dd-cap></span></span>
      <button type="button" class="dd-btn" data-dd-btn></button>
    </figcaption>
  </figure>`;
}

const ICON = {
  pause: '<svg viewBox="0 0 20 20" aria-hidden="true"><rect x="6" y="5" width="2.6" height="10" rx="1"/><rect x="11.4" y="5" width="2.6" height="10" rx="1"/></svg>',
  play: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M7 5.2v9.6a.6.6 0 0 0 .9.5l7.6-4.8a.6.6 0 0 0 0-1L7.9 4.7a.6.6 0 0 0-.9.5Z"/></svg>',
  next: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M7.5 5 12.5 10l-5 5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
};

function mountOne(fig: HTMLElement, scroller: HTMLElement) {
  const d = DEMOS[fig.dataset.dd!];
  const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const view = fig.querySelector<HTMLElement>(".dd-view")!;
  const cam = fig.querySelector<HTMLElement>(".dd-cam")!;
  const root = fig.querySelector<HTMLElement>(".dd-root")!;
  const cursor = fig.querySelector<HTMLElement>(".dd-cursor")!;
  const nEl = fig.querySelector<HTMLElement>("[data-dd-n]")!;
  const capEl = fig.querySelector<HTMLElement>("[data-dd-cap]")!;
  const btn = fig.querySelector<HTMLButtonElement>("[data-dd-btn]")!;
  let stage: Stage | null = null;
  let scale = 1;
  let visible = false, userPaused = false, dead = false, loop = 0;
  let k = 0;

  const fit = () => {
    const vw = view.clientWidth || FULL_W;
    for (const el of [cam, root]) { el.style.width = `${FULL_W}px`; el.style.height = `${FULL_H}px`; }
    view.style.aspectRatio = `${FULL_W} / ${FULL_H}`;
    scale = vw / FULL_W;
    cam.style.transform = `scale(${scale})`;
    /* курсор и кольцо — в экранных пикселях, а не в уменьшенных */
    view.style.setProperty("--dd-k", String(1 / scale));
  };
  const ro = new ResizeObserver(fit);
  ro.observe(view);

  const paused = () => !visible || userPaused || dead;
  /** пауза считается только по времени на экране и без нажатой «Паузы» */
  const wait = (ms: number) => new Promise<void>((res) => {
    let left = ms, last = performance.now();
    const tick = () => {
      if (dead) return;
      const now = performance.now();
      if (!paused()) left -= now - last;
      last = now;
      if (left <= 0) res(); else setTimeout(tick, 60);
    };
    setTimeout(tick, 60);
  });
  /* координаты элемента в пикселях экрана: от корня сцены, делённые на масштаб камеры */
  const at = (el: HTMLElement, fx = 0.5, fy = 0.5) => {
    const a = el.getBoundingClientRect(), b = root.getBoundingClientRect();
    return [(a.left - b.left + a.width * fx) / scale, (a.top - b.top + a.height * fy) / scale];
  };
  const scene = (): Scene => ({
    s: stage!,
    calm,
    wait,
    point: async (el, fx, fy) => {
      if (!el) return;
      const [x, y] = at(el, fx, fy);
      cursor.style.transform = `translate(${x}px, ${y}px)`;
      cursor.classList.add("is-on");
      if (!calm) await wait(650);
    },
    press: async (el) => {
      if (!el) return;
      cursor.classList.add("is-down");
      el.classList.add("dd-pressed");
      await wait(calm ? 0 : 220);
      cursor.classList.remove("is-down");
      el.classList.remove("dd-pressed");
      await wait(calm ? 0 : 260);
    },
    /* кольцо — слоем поверх экрана (stage.mark): на самом слое его срезали бы родители с обрезкой содержимого */
    ring: (el) => { stage!.mark(el); },
  });

  const caption = (i: number) => {
    nEl.textContent = `${i + 1} ${tr(T.of)} ${d.beats.length}`;
    capEl.textContent = tidy(tr(d.beats[i].cap));
  };
  const paintBtn = () => {
    const mode = calm ? "next" : userPaused ? "play" : "pause";
    btn.innerHTML = ICON[mode];
    btn.setAttribute("aria-label", tr(T[mode]));
    btn.title = tr(T[mode]);
  };

  async function playBeat(i: number) {
    k = i;
    caption(i);
    scene().ring(null);
    await d.beats[i].run(scene());
  }
  async function run() {
    const my = ++loop;
    while (!dead && my === loop) {
      for (let i = 0; i < d.beats.length && my === loop && !dead; i++) {
        await playBeat(i);
        await wait(d.beats[i].hold ?? 1600);
      }
      cursor.classList.remove("is-on");
      await wait(900);
    }
  }

  async function start() {
    if (stage) return;
    const { createStage } = await import("./live/grif2/stage");
    if (dead) return;
    stage = createStage(root, { base: import.meta.env.BASE_URL, calm });
    root.style.overflow = "hidden";
    fit();
    paintBtn();
    if (calm) await playBeat(0); else void run();
  }

  const io = new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (visible) void start();
  }, { root: scroller, rootMargin: "120px 0px" });
  io.observe(fig);

  btn.addEventListener("click", async () => {
    if (calm) { if (stage) await playBeat((k + 1) % d.beats.length); return; }
    userPaused = !userPaused;
    paintBtn();
  });
  paintBtn();
  caption(0);

  return () => { dead = true; loop++; io.disconnect(); ro.disconnect(); stage?.destroy(); };
}

export function mountDecisionDemos(root: HTMLElement, scroller: HTMLElement) {
  const stops = [...root.querySelectorAll<HTMLElement>("[data-dd]")].filter((f) => f.dataset.dd! in DEMOS).map((f) => mountOne(f, scroller));
  return () => stops.forEach((f) => f());
}
