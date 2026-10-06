/* v91: заставка раздела «Экраны» — огромное слово «Макеты» по центру, по которому проходит выделение из
   редактора макетов. Идея по образцу Никиты (reactbits, Tech Text), код свой.

   Зачем: экраны лежат в самом конце кейса, после результатов, и раньше начинались маленькой строкой — читатель
   пролистывал их как приложение к тексту. Крупное слово ставит паузу: история закончилась, дальше сама работа.
   Выделение — тот же жест, каким дизайнер проверяет макет: буква становится контуром, вокруг рамка с ручками
   и размером, рядом курсор. В конце рамка охватывает всё слово — «макет собран» — и уходит.

   Проход играет, когда блок попал в кадр, и ещё раз, если блок ушёл из кадра и вернулся. При «уменьшить
   движение» слово просто стоит. */
import { getLang, t } from "../i18n";
import "./mockups-title.css";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** «12 экранов» / «12 screens» */
const screensWord = (n: number) => {
  if (getLang() !== "ru") return `${n} ${n === 1 ? "screen" : "screens"}`;
  const d = n % 10, h = n % 100;
  const w = d === 1 && h !== 11 ? "экран" : d >= 2 && d <= 4 && (h < 12 || h > 14) ? "экрана" : "экранов";
  return `${n} ${w}`;
};

const cursor = `<svg class="mk-cursor" viewBox="0 0 16 16" aria-hidden="true"><path d="M2.5 1.5 13 7.2l-4.6 1.3-1.9 4.5z"/></svg>`;

/** шапка раздела «Экраны»: номер раздела для оглавления и большое слово. count — сколько экранов ниже */
export function mockupsHead(num: string, numLabel: string, count: number) {
  const word = t("cs.mockups");
  return `<header class="cs-head mk" id="cs-screens">
    <p class="cs-num">${num}<span>${numLabel}</span>${esc(t("cs.screens"))}</p>
    <div class="mk-stage">
      <h2 class="mk-word" aria-label="${esc(word)}">${[...word].map((ch) => `<span class="mk-l" aria-hidden="true">${esc(ch)}</span>`).join("")}</h2>
      <span class="mk-frame" aria-hidden="true"><i></i><i></i><i></i><i></i><b class="mk-size"></b>${cursor}</span>
    </div>
    <p class="mk-sub">${esc(screensWord(count))} ${esc(t("cs.mockupsSub"))}</p>
  </header>`;
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export function mountMockups(root: HTMLElement, scroller: HTMLElement) {
  const head = root.querySelector<HTMLElement>(".mk");
  if (!head) return () => {};
  const stage = head.querySelector<HTMLElement>(".mk-stage")!;
  const frame = head.querySelector<HTMLElement>(".mk-frame")!;
  const size = head.querySelector<HTMLElement>(".mk-size")!;
  const letters = [...head.querySelectorAll<HTMLElement>(".mk-l")];
  const reduce = matchMedia("(prefers-reduced-motion: reduce)");
  let run = 0;

  /** рамка встаёт на прямоугольник (координаты в сцене) и подписывает его размер */
  const put = (x: number, y: number, w: number, h: number, label: string) => {
    frame.style.translate = `${x.toFixed(1)}px ${y.toFixed(1)}px`;
    frame.style.width = `${w.toFixed(1)}px`;
    frame.style.height = `${h.toFixed(1)}px`;
    size.textContent = `${label} · ${Math.round(w)} × ${Math.round(h)}`;
  };
  const box = (el: HTMLElement) => {
    const s = stage.getBoundingClientRect(), r = el.getBoundingClientRect();
    return [r.left - s.left, r.top - s.top, r.width, r.height] as const;
  };

  const play = async () => {
    const id = ++run;
    const live = () => id === run;
    letters.forEach((l) => l.classList.remove("is-edit", "is-done"));
    head.classList.add("is-run");
    head.classList.remove("is-whole");
    const step = Math.max(150, Math.min(260, 1500 / letters.length));
    for (const l of letters) {
      if (!live()) return;
      const [x, y, w, h] = box(l);
      put(x, y, w, h, l.textContent ?? "");
      l.classList.add("is-edit");
      await sleep(step);
      if (!live()) return;
      l.classList.remove("is-edit");
      l.classList.add("is-done");
    }
    /* последний шаг — рамка на всё слово */
    const [x, y, w, h] = box(head.querySelector<HTMLElement>(".mk-word")!);
    head.classList.add("is-whole");
    put(x, y, w, h, t("cs.mockups"));
    await sleep(1100);
    if (!live()) return;
    head.classList.remove("is-run", "is-whole");
  };

  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting && !reduce.matches) void play();
      else if (!e.isIntersecting) { run++; head.classList.remove("is-run", "is-whole"); letters.forEach((l) => l.classList.remove("is-edit", "is-done")); }
    }
  }, { root: scroller, threshold: 0.6 });
  io.observe(stage);
  return () => { run++; io.disconnect(); };
}
