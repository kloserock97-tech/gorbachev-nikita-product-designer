/* 23.10: мини-демо решений на странице кейса (глава «Решения»). Идея — ролики решений в кейсе CRM с портфолио
   klinaeva: кусок интерфейса сам проигрывает действие, внизу подпись шага «1 из 3 · …» и пауза. Код свой.

   Демо не рисует интерфейс заново: внутри — тот же живой прототип, что в главе «Готовый интерфейс» (src/ui/live),
   целиком, как полный экран продукта (окно 1200 × 750 с сайдбаром), уменьшенный под ширину блока: видно всё окно
   и как в нём меняется состояние. Ничего не кадрируется и не приближается. Курсор и кольцо подсветки рисуются
   в обратном масштабе, чтобы в уменьшенном окне их было видно. Сценарий — три шага: каждый ставит прототип
   в нужное состояние, двигает курсор и обводит элемент кольцом. Демо только показывает: нажать внутри нельзя, для этого есть прототип выше.

   Играет, пока блок на экране; ушёл с экрана — пауза. «Меньше движения» — без автопроигрывания: шаги листаются
   кнопкой, курсор не едет. Модуль прототипа грузится своим чанком, когда блок подъехал к экрану. */
import { getLang } from "../i18n";
import { tidy } from "../lib/typograph";
import { LIVE } from "./live";
import type { LiveInstance } from "./live/types";
import "./decision-demos.css";

type L = { ru: string; en: string };
type Scene = {
  q: <E extends HTMLElement = HTMLElement>(sel: string) => E;
  inst: LiveInstance;
  calm: boolean;
  wait: (ms: number) => Promise<void>;
  /** курсор к элементу (по центру или в точку fx, fy в долях элемента) */
  point: (el: HTMLElement, fx?: number, fy?: number) => Promise<void>;
  /** нажатие курсором; click — передать нажатие интерфейсу */
  press: (el: HTMLElement, click?: boolean) => Promise<void>;
  ring: (el: HTMLElement | null) => void;
  type: (el: HTMLTextAreaElement, text: string) => Promise<void>;
  /** дождаться, пока элемент покажется (прототип сам ведёт свои паузы) */
  until: (sel: string, ms?: number) => Promise<void>;
  /** поставить элемент к верху прокрутки чата */
  top: (el: HTMLElement, middle?: boolean) => void;
};
type Beat = { cap: L; run: (s: Scene) => Promise<void>; hold?: number };
type Demo = { live: string; beats: Beat[] };

/** демо показывает окно продукта целиком, как полный экран (дизайн-ширина живого прототипа), уменьшенным под блок */
const FULL_W = 1200, FULL_H = 750;
const tr = (x: L) => (getLang() === "ru" ? x.ru : x.en);
const T = {
  of: { ru: "из", en: "of" },
  pause: { ru: "Пауза", en: "Pause" },
  play: { ru: "Смотреть", en: "Play" },
  next: { ru: "Следующий шаг", en: "Next step" },
  label: { ru: "Демо решения: проигрывается само", en: "Demo of the decision: plays by itself" },
};

/* ── сценарии GRIF: селекторы — из разметки src/ui/live/grif.ts ─────────────── */
const TYPED: L = { ru: "Напиши Сергею follow-up по вчерашней встрече", en: "Write Sergey a follow-up on yesterday's meeting" };
const DEMOS: Record<string, Demo> = {
  "grif-entry": {
    live: "grif-ai",
    beats: [
      {
        cap: { ru: "Поле ввода стоит в центре нового чата", en: "The input sits in the middle of a new chat" },
        run: async (s) => {
          s.inst.show(0);
          const p = s.q<HTMLTextAreaElement>("[data-prompt]");
          p.value = "";
          s.q("[data-files]").hidden = true;
          await s.point(p, 0.2, 0.5);
          await s.type(p, tr(TYPED));
        },
      },
      {
        cap: { ru: "Файлы встают в ряд над текстом", en: "Files line up above the text" },
        run: async (s) => {
          const files = s.q("[data-files]");
          files.hidden = false;
          s.ring(files);
          await s.point(files, 0.3, 0.5);
        },
      },
      {
        cap: { ru: "Или готовое дело в один клик", en: "Or a ready-made task in one click" },
        run: async (s) => {
          const chip = s.q(".lg-hcard[data-send]");
          s.ring(chip);
          await s.point(chip, 0.45, 0.5);
          await s.press(chip);
        },
      },
    ],
  },
  "grif-reading": {
    live: "grif-ai",
    beats: [
      {
        cap: { ru: "Пока GRIF работает, видно, что именно он делает", en: "While GRIF works, you can see what exactly it is doing" },
        run: async (s) => {
          s.inst.show(1);
          await s.until("[data-think]:not([hidden])", 2500);
          s.ring(s.q("[data-think]"));
          /* прототип сам докручивает чат вниз, пока дописывает ответ: шаг длится до конца ответа */
          await s.until("[data-card]:not([hidden])", 8000);
          /* после письма прототип ещё раз доводит чат до кнопки «Отправить» — даём ему закончить */
          await s.until("[data-more]:not([hidden])", 2000);
          await s.wait(700);
        },
        hold: 300,
      },
      {
        cap: { ru: "Готово: шаги свернулись в одну строку, их можно раскрыть", en: "Done: the steps fold into one line you can open" },
        run: async (s) => {
          s.top(s.q("[data-brief]"));
          const sum = s.q("[data-sum]");
          s.ring(sum);
          await s.point(sum, 0.5, 0.5);
          await s.press(sum, true);
          await s.wait(1500);
          await s.press(sum, true);
        },
      },
      {
        cap: { ru: "Под ответом подписано, из чего он собран", en: "Under the answer: what it was built from" },
        run: async (s) => {
          const based = s.q("[data-based]");
          /* на узкой вёрстке бриф длинный, и строку источников у верха брифа прикрыло бы поле ввода */
          s.top(based, true);
          s.ring(based);
          await s.point(based, 0.55, 0.5);
        },
        hold: 2200,
      },
    ],
  },
  "grif-confirm": {
    live: "grif-ai",
    beats: [
      {
        cap: { ru: "Письмо приходит черновиком", en: "The email arrives as a draft" },
        run: async (s) => {
          s.inst.show(2);
          await s.wait(60);
          const card = s.q("[data-card]");
          s.top(s.q("[data-mem]"));
          s.ring(card);
          await s.point(card, 0.5, 0.45);
        },
      },
      {
        cap: { ru: "«Редактировать» открывает письмо целиком", en: "“Edit” opens the whole email" },
        run: async (s) => {
          const edit = s.q("[data-edit]");
          s.ring(edit);
          await s.point(edit);
          await s.press(edit, true);
        },
        hold: 2400,
      },
      {
        cap: { ru: "Без подтверждения ничего не уйдёт", en: "Nothing goes out without your confirmation" },
        run: async (s) => {
          await s.press(s.q("[data-panel] [data-close]"), true);
          const safe = s.q(".lg-safe");
          s.ring(safe);
          await s.point(safe, 0.6, 0.5);
          await s.wait(900);
          const send = s.q("[data-card] [data-mail]");
          s.ring(send);
          await s.point(send);
        },
      },
    ],
  },
  "grif-undo": {
    live: "grif-ai",
    beats: [
      {
        cap: { ru: "Нажали «Отправить»: письмо ушло", en: "Hit “Send”: the email is out" },
        run: async (s) => {
          s.inst.show(2);
          await s.wait(60);
          s.top(s.q("[data-mem]"));
          const send = s.q("[data-card] [data-mail]");
          s.ring(send);
          await s.point(send);
          await s.press(send, true);
          s.ring(s.q("[data-toast]"));
        },
      },
      {
        cap: { ru: "Передумали: «Вернуть»", en: "Changed your mind: “Undo”" },
        run: async (s) => {
          const undo = s.q("[data-sent] [data-undo]");
          s.ring(undo);
          await s.point(undo);
          await s.press(undo, true);
          s.top(s.q("[data-mem]"));
        },
      },
      {
        cap: { ru: "Запомненное тоже можно отменить", en: "What it remembered can be undone too" },
        run: async (s) => {
          const link = s.q(".lg-mem .lg-link");
          s.ring(link);
          await s.point(link);
          await s.press(link);
        },
        hold: 2200,
      },
    ],
  },
};

export const hasDecisionDemo = (id?: string) => !!id && id in DEMOS;

export function decisionDemoBlock(id: string, alt: string) {
  const w = FULL_W, h = FULL_H;
  const esc = (s: string) => tidy(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  return `<figure class="dd" data-dd="${id}" style="--dd-ar:${w} / ${h}" aria-label="${esc(alt)}">
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
  let inst: LiveInstance | null = null;
  let scale = 1;
  let visible = false, userPaused = false, dead = false, loop = 0;
  let k = 0;

  /* ширина вёрстки — по блоку: интерфейс не мельче 0,9 (на телефоне 0,68, иначе чат не поместится) */
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
  /* координаты элемента в пикселях дизайна: от корня прототипа, делённые на масштаб камеры */
  const at = (el: HTMLElement, fx = 0.5, fy = 0.5) => {
    const a = el.getBoundingClientRect(), b = root.getBoundingClientRect();
    return [(a.left - b.left + a.width * fx) / scale, (a.top - b.top + a.height * fy) / scale];
  };
  const scene = (): Scene => ({
    q: <E extends HTMLElement = HTMLElement>(sel: string) => root.querySelector<E>(sel)!,
    inst: inst!,
    calm,
    wait,
    point: async (el, fx, fy) => {
      const [x, y] = at(el, fx, fy);
      cursor.style.transform = `translate(${x}px, ${y}px)`;
      cursor.classList.add("is-on");
      if (!calm) await wait(650);
    },
    press: async (el, click = false) => {
      cursor.classList.add("is-down");
      el.classList.add("dd-pressed");
      await wait(calm ? 0 : 220);
      cursor.classList.remove("is-down");
      el.classList.remove("dd-pressed");
      if (click) el.click();
      await wait(calm ? 0 : 260);
    },
    ring: (el) => {
      root.querySelectorAll(".dd-ring").forEach((n) => n.classList.remove("dd-ring"));
      el?.classList.add("dd-ring");
    },
    type: async (el, text) => {
      if (calm) { el.value = text; return; }
      for (let i = 1; i <= text.length; i++) { el.value = text.slice(0, i); await wait(38); }
    },
    until: async (sel, ms = 4000) => {
      for (let t = 0; t < ms && !root.querySelector(sel); t += 100) await wait(100);
    },
    top: (el, middle = false) => {
      const sc = root.querySelector<HTMLElement>("[data-scroll]");
      if (!sc || !sc.contains(el)) return;
      let y = 0;
      for (let n: HTMLElement | null = el; n && n !== sc; n = n.offsetParent as HTMLElement | null) y += n.offsetTop;
      sc.scrollTop = Math.max(0, middle ? y - (sc.clientHeight - el.offsetHeight) / 2 : y - 16);
    },
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
    if (inst) return;
    const mod = await LIVE[d.live]();
    if (dead) return;
    inst = mod.default.mount(root, { lang: getLang() === "ru" ? "ru" : "en", calm, base: import.meta.env.BASE_URL, go: () => {} });
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
    if (calm) { if (inst) await playBeat((k + 1) % d.beats.length); return; }
    userPaused = !userPaused;
    paintBtn();
  });
  paintBtn();
  caption(0);

  return () => { dead = true; loop++; io.disconnect(); ro.disconnect(); inst?.destroy(); };
}

export function mountDecisionDemos(root: HTMLElement, scroller: HTMLElement) {
  const stops = [...root.querySelectorAll<HTMLElement>("[data-dd]")].filter((f) => f.dataset.dd! in DEMOS).map((f) => mountOne(f, scroller));
  return () => stops.forEach((f) => f());
}
