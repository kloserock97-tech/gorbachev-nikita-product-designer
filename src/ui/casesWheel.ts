/* v65: глава «Кейсы» — «колесо». Идея Никиты: названия кейсов справа стоят на дуге и прокручиваются
   полукругом, слева — превью кейса и текст о нём.

   Устройство. Колесо — шесть ссылок, каждая поставлена на окружность поворотом вокруг общего центра:
   rotate(угол) translateX(−R). Центр окружности лежит за правым краем окна, поэтому видна её левая дуга, а текст
   названия идёт от дуги к центру. Активное название стоит на «трёх часах» напротив метки, соседние уходят по дуге
   вверх и вниз, мельчают и гаснут. На телефоне та же окружность лежит под нижним краем: дуга выгибается вверх,
   названия идут по касательной.
   Всё — функция прокрутки, как и в ленте: дробный номер активного кейса приходит из истории (story.ts, dwell),
   из него считаются угол каждого названия, прозрачность сцен и положение предметов. Предметы не переключаются, а
   проезжают: уходящий поднимается и поворачивается, приходящий выезжает снизу. Текст слева меняется дискретно, когда
   сменился целый номер: читать текст, который ползёт вместе с прокруткой, неудобно.
   Клик по неактивному названию довозит колесо до него, по активному — открывает кейс. На телефоне колесо ещё и
   листается пальцем вбок.

   v66: колесо — основной вид главы (Никита выбрал его из вариантов v65); лента и стопка остались по ?cases=ribbon|deck.
   У превью больше нет плитки-фона: предмет стоит прямо над полем, за ним — огромный курсивный номер кейса. Поэтому
   предметы перевырезаны под тёмный фон (assets-src/matte2.mjs), а зона предмета гасится к верхнему и нижнему краю
   маской: проезжающий предмет растворяется, а не наезжает на заголовок и текст.
   Разметку модуль строит сам, внутри секции .cases. На экране с мышью предмет рисует WebGL (casesWheelGl.ts): объём по
   карте глубины и барабан; картинки остаются под холстом как запасной вид. ?cases=wheel2d — только картинки,
   ?cases=wheel3d — WebGL и на телефоне. */
import { getCases } from "../data/cases";
import notes from "../data/notes";
import { pad2 as pad } from "../lib/format";
import { CASES, CHAPTER, CHAPTER2, chapters, dwell, ramp } from "../scene/story";
import { applyTimeline, onViewport, topFor } from "./storyScroll";
import { cue } from "../audio/bus";
import { onLang, t } from "../i18n";
import { goArrow, lookVars, objectPicture } from "./caseLook";
import { tidy } from "../lib/typograph";
import "./cases-wheel.css";
import { consumeReviewJump } from "./casesReview";
import { createCardPreview, type CardPreview } from "./casesCardPreview";

type Scene = { onStory?: (p: number) => void };
export type WheelGl = { set(active: number, pointerX: number, pointerY: number): void; resize(): void; dispose(): void };

const esc = (s: string) => tidy(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const chevron = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5 8 12l7 7"/></svg>`;

export function initCasesWheel(scene: Scene, root: HTMLElement, opts: { gl?: boolean | "auto"; preview?: "object" | "card" } = {}) {
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let list = getCases();
  const n = list.length;
  /* v70: слева от дуги — карточка кейса (casesCardPreview.ts). Прежний вырезанный предмет остался
     по ?cases=wheel: Никита сказал, что 3D-объекты сделаны плохо, и на главной их больше нет. */
  const asCard = opts.preview !== "object";
  root.dataset.mode = "wheel";
  root.dataset.preview = asCard ? "card" : "object";

  const wrap = document.createElement("div");
  wrap.className = "cw";
  wrap.innerHTML = `
    <div class="cw-preview">
      <div class="cw-stage">
        ${asCard ? "" : `<div class="cw-objs">${list.map((c) => `<div class="cw-objbox" style="${lookVars(c)}">${objectPicture(c, "cw-obj", true)}</div>`).join("")}</div>`}
      </div>
      <div class="cw-info" aria-live="polite">
        <p class="cw-tag"></p>
        <p class="cw-sub"></p>
        <a class="cw-open" href="#"><span class="cw-open-l"></span>${goArrow}</a>
      </div>
    </div>
    <nav class="cw-wheel">
      <svg class="cw-arc" aria-hidden="true"><circle class="cw-ring"/><g class="cw-ticks"></g></svg>
      <i class="cw-needle" aria-hidden="true"></i>
      <ol class="cw-list">${list.map((c, i) => `<li><a class="cw-item" href="#/work/${c.id}" data-i="${i}"><span class="cw-n">${pad(i + 1)}</span><span class="cw-t"></span></a></li>`).join("")}</ol>
    </nav>
    <div class="cw-steps">
      <button type="button" class="cw-step" data-d="-1">${chevron}</button>
      <button type="button" class="cw-step cw-step--next" data-d="1">${chevron}</button>
    </div>`;
  root.insertBefore(wrap, root.querySelector(".cases-foot"));

  const stage = wrap.querySelector<HTMLElement>(".cw-stage")!;
  const card: CardPreview | null = asCard ? createCardPreview(stage, getCases) : null;
  const objs = [...wrap.querySelectorAll<HTMLElement>(".cw-objbox")];
  const items = [...wrap.querySelectorAll<HTMLAnchorElement>(".cw-item")];
  const info = wrap.querySelector<HTMLElement>(".cw-info")!;
  const wheel = wrap.querySelector<HTMLElement>(".cw-wheel")!;
  const ticks = wrap.querySelector<SVGGElement>(".cw-ticks")!;
  const ring = wrap.querySelector<SVGCircleElement>(".cw-ring")!;
  const now = root.querySelector<HTMLElement>(".cases-now");
  const bar = root.querySelector<HTMLElement>(".cases-bar i");
  const steps = [...wrap.querySelectorAll<HTMLButtonElement>(".cw-step")];
  let current = -1; // номер показанного кейса; объявлен здесь, потому что его читает paintSteps ниже

  /* v68: «предыдущий / следующий» кнопками. Раньше кейс можно было сменить только прокруткой или свайпом по
     дуге — а колёсика у мыши может не быть, тачпад у людей настроен по-разному, и на телефоне свайп ещё надо
     угадать. Кнопка переставляет ровно на один кейс и гаснет на краях, поэтому шаг назад такой же точный,
     как шаг вперёд. */
  const paintSteps = () => {
    steps[0].disabled = current <= 0;
    steps[1].disabled = current >= n - 1;
    steps[0].setAttribute("aria-label", t("cases.prev"));
    steps[1].setAttribute("aria-label", t("cases.next"));
  };

  /* подписи на текущем языке */
  const paintTitles = () => {
    list = getCases();
    wheel.setAttribute("aria-label", t("work.title"));
    paintSteps();
    items.forEach((a, i) => {
      a.querySelector(".cw-t")!.textContent = list[i].title;
      a.setAttribute("aria-label", `${list[i].title}. ${list[i].subtitle}`);
    });
  };
  let shownInfo = -1;
  const paintInfo = (i: number, animate: boolean) => {
    const c = list[i];
    shownInfo = i;
    const put = () => {
      info.style.cssText = lookVars(c);
      info.querySelector(".cw-tag")!.textContent = `${pad(i + 1)} · ${c.tag}`;
      info.querySelector(".cw-sub")!.innerHTML = esc(c.subtitle);
      info.querySelector(".cw-open-l")!.textContent = t("cases.cta");
      info.querySelector<HTMLAnchorElement>(".cw-open")!.href = `#/work/${c.id}`;
    };
    if (!animate || reduced) { put(); return; }
    /* старый текст уходит вверх, новый приходит снизу: два коротких такта вместо перекрёстного затухания */
    info.classList.add("is-out");
    window.setTimeout(() => { put(); info.classList.remove("is-out"); info.classList.add("is-in"); requestAnimationFrame(() => requestAnimationFrame(() => info.classList.remove("is-in"))); }, 170);
  };
  paintTitles();
  paintInfo(0, false);
  onLang(() => { paintTitles(); paintInfo(Math.max(0, shownInfo), false); });

  /* ── геометрия колеса ── */
  let narrow = false;
  let R = 480;
  let step = 17; // градусов между соседними названиями
  const measure = () => {
    narrow = matchMedia("(max-width: 900px), (pointer: coarse) and (max-width: 1100px)").matches;
    root.classList.toggle("is-narrow", narrow);
    const r = wheel.getBoundingClientRect();
    if (narrow) {
      /* окружность под нижним краем: радиус от ширины окна, чтобы соседние названия выглядывали с боков */
      R = clamp(innerWidth * 1.15, 380, 760);
      step = clamp((Math.asin(Math.min(0.9, (innerWidth * 0.62) / R)) * 180) / Math.PI, 22, 40);
      wheel.style.setProperty("--cx", `${(r.width / 2).toFixed(1)}px`);
      wheel.style.setProperty("--cy", `${(R + 30).toFixed(1)}px`);
    } else {
      R = clamp(innerHeight * 0.56, 340, 620);
      step = 16.5;
      wheel.style.setProperty("--cx", `${(R + 56).toFixed(1)}px`);
      wheel.style.setProperty("--cy", `${(r.height / 2).toFixed(1)}px`);
    }
    wheel.style.setProperty("--R", `${R.toFixed(1)}px`);
    ring.setAttribute("r", R.toFixed(1));
    ring.setAttribute("cx", "0"); ring.setAttribute("cy", "0");
  };

  /** прокрутка страницы, при которой история стоит на кейсе i */
  const topForCase = (i: number) => {
    const c = CASES.strip[0] + (CASES.strip[1] - CASES.strip[0]) * (i / Math.max(1, n - 1));
    return topFor(CHAPTER + (CHAPTER2 - CHAPTER) * c);
  };
  const goTo = (i: number) => scrollTo({ top: topForCase(clamp(i, 0, n - 1)), behavior: reduced ? ("instant" as ScrollBehavior) : "smooth" });

  let gl: WheelGl | null = null;
  let px = 0, py = 0;
  let lastP = 0;
  const layout = () => {
    measure();
    card?.layout();
    placeObjects();
    /* один кейс — 0,7 экрана прокрутки: колесо успевает довернуться, текст слева — прочитаться */
    applyTimeline({ narrow: innerWidth <= 900, cases: n, notes: notes.length, step: 0.7 });
    gl?.resize();
    lastKey = "";
    scene.onStory?.(lastP);
  };

  /* деления на дуге: короткий штрих у каждого кейса, они едут вместе с названиями */
  ticks.innerHTML = list.map(() => `<line class="cw-tick" x1="0" y1="0" x2="0" y2="0"/>`).join("");
  const tickEls = [...ticks.querySelectorAll<SVGLineElement>(".cw-tick")];

  let shown = false;
  let lastKey = "";

  /* Барабан предметов. Названия на дуге едут вместе с прокруткой (это шкала), а предмет — вещь: он должен
     стоять целым, а не таять на полпути. Поэтому у предметов своя координата: она догоняет ближайший целый
     кейс за ~0,4 с. Между кейсами всегда виден один предмет, а смена читается как поворот барабана. */
  let drum = 0, drumTo = 0, drumRaf = 0, drumLast = 0;
  const placeObjects = () => {
    if (asCard) { card?.drum(drum); return; }
    objs.forEach((o, i) => {
      const d = i - drum;
      const ad = Math.abs(d);
      /* v69: дальние предметы прячет класс, а не инлайновый visibility. Инлайн отменял и скрытие
         всего слоя (.cases выключена через visibility: hidden), из-за чего невидимые боксы
         перехватывали клики по первому экрану — погоду, «позвать ветер» и статистику травы */
      o.classList.toggle("is-far", ad > 1);
      if (ad > 1) return;
      o.style.opacity = clamp(1 - ad * 1.45, 0, 1).toFixed(3);
      o.style.transform = reduced ? "none" : `translate3d(${(d * 6).toFixed(2)}%, ${(d * 96).toFixed(2)}%, 0) rotate(${(d * -7).toFixed(2)}deg) scale(${(1 - ad * 0.12).toFixed(3)})`;
    });
    gl?.set(drum, px, py);
  };
  const spin = (now: number) => {
    drumRaf = 0;
    const dt = Math.min(0.05, (now - drumLast) / 1000);
    drumLast = now;
    const k = 1 - Math.exp(-dt * 11);
    drum += (drumTo - drum) * k;
    if (Math.abs(drumTo - drum) < 0.002) drum = drumTo; else drumRaf = requestAnimationFrame(spin);
    placeObjects();
  };
  const turnTo = (i: number) => {
    if (drumTo === i && current >= 0) return;
    drumTo = i;
    if (reduced) { drum = i; placeObjects(); return; }
    if (!drumRaf) { drumLast = performance.now(); drumRaf = requestAnimationFrame(spin); }
  };
  const place = (active: number, e: number) => {
    const key = `${active.toFixed(4)}|${e.toFixed(3)}|${narrow}`;
    if (key === lastKey) return;
    lastKey = key;
    root.style.setProperty("--e", e.toFixed(3));
    items.forEach((a, i) => {
      const d = i - active;
      const ad = Math.abs(d);
      const ang = reduced ? Math.round(d) * step : d * step;
      /* широкий экран: следующие кейсы ниже активного, угол против часовой; телефон: следующие правее */
      const tr = narrow
        ? `rotate(${ang.toFixed(2)}deg) translateY(${(-R).toFixed(1)}px)`
        : `rotate(${(-ang).toFixed(2)}deg) translateX(${(-R).toFixed(1)}px)`;
      a.style.transform = tr;
      a.style.setProperty("--k", clamp(1 - ad, 0, 1).toFixed(3)); // 1 у активного, 0 у соседей: размер и яркость
      a.style.opacity = clamp(1.15 - ad * 0.34, 0, 1).toFixed(3);
      a.classList.toggle("is-active", ad < 0.5);
      a.tabIndex = shown && ad < 3.2 ? 0 : -1;
      /* штрих на дуге в той же точке, что и название: единичный вектор от центра к точке */
      const tk = tickEls[i];
      const rad = (ang * Math.PI) / 180;
      const ux = narrow ? Math.sin(rad) : -Math.cos(rad);
      const uy = narrow ? -Math.cos(rad) : Math.sin(rad);
      const r0 = R - 6, r1 = R + 6 + clamp(1 - ad, 0, 1) * 12;
      tk.setAttribute("x1", (ux * r0).toFixed(1)); tk.setAttribute("y1", (uy * r0).toFixed(1));
      tk.setAttribute("x2", (ux * r1).toFixed(1)); tk.setAttribute("y2", (uy * r1).toFixed(1));
      tk.style.opacity = clamp(1 - ad * 0.28, 0.12, 1).toFixed(2);
    });
    const idx = clamp(Math.round(active), 0, n - 1);
    if (idx !== current) {
      if (current >= 0) cue("progress-step", 0.5);
      current = idx;
      if (now) now.textContent = pad(idx + 1);
      paintInfo(idx, shown);
      paintSteps();
      /* спутники разлетаются заново на каждом новом кейсе */
      if (card) { card.paint(idx); card.live(); }
      turnTo(idx);
    }
    if (bar) bar.style.transform = `scaleX(${(active / Math.max(1, n - 1)).toFixed(4)})`;
  };

  /* клик по названию: неактивное — довезти колесо, активное — открыть кейс */
  items.forEach((a, i) => {
    a.addEventListener("click", (e) => {
      if (i !== current) { e.preventDefault(); goTo(i); return; }
      cue("forward");
    });
    a.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse") cue("hover", 0.6); });
    /* с клавиатуры: фокус на названии довозит колесо до него */
    a.addEventListener("focus", () => { if (a.matches(":focus-visible") && i !== current) goTo(i); });
  });
  info.querySelector(".cw-open")!.addEventListener("click", () => cue("forward"));
  steps.forEach((b) => b.addEventListener("click", () => { goTo(current + Number(b.dataset.d)); cue("progress-step", 0.6); }));
  /* стрелки на клавиатуре — третий способ, для тех, кто вообще не берётся за мышь. Пока открыт кейс,
     глава под ним не слушает: иначе страница за кейсом уезжала бы вслепую */
  addEventListener("keydown", (e) => {
    if (!shown || e.metaKey || e.ctrlKey || e.altKey || document.body.classList.contains("case-open")) return;
    /* на стыке глав кейсы и заметки короткое время видны обе — стрелки отдаём заметкам */
    if (document.querySelector(".shelf.is-on")) return;
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    const el = document.activeElement as HTMLElement | null;
    if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el?.isContentEditable) return;
    e.preventDefault();
    goTo(current + (e.key === "ArrowRight" ? 1 : -1));
  });
  stage.addEventListener("click", () => { location.hash = `#/work/${list[Math.max(0, current)].id}`; cue("forward"); });

  /* курсор над сценой разводит слои превью */
  stage.addEventListener("pointermove", (e) => {
    if (e.pointerType !== "mouse" || reduced) return;
    const r = stage.getBoundingClientRect();
    px = ((e.clientX - r.left) / r.width) * 2 - 1;
    py = ((e.clientY - r.top) / r.height) * 2 - 1;
    stage.style.setProperty("--px", px.toFixed(3));
    stage.style.setProperty("--py", py.toFixed(3));
    gl?.set(drum, px, py);
  });
  stage.addEventListener("pointerleave", () => { px = 0; py = 0; stage.style.setProperty("--px", "0"); stage.style.setProperty("--py", "0"); gl?.set(drum, 0, 0); });

  /* Свайп по всей главе, не только по дуге: карточка занимает пол-экрана, и жест по ней — первое, что
     пробуют пальцем. Слушаем именно касания: при жесте по карточке браузер отдаёт указатель ей во
     владение, и «отпустили» до обёртки не доходит — touchend приходит всегда. */
  let tx = 0, ty = 0, tSwipe = false;
  addEventListener("touchstart", (ev) => {
    const tt = ev.changedTouches[0];
    if (!shown || !tt || ev.touches.length > 1 || !wrap.contains(tt.target as Node)) { tSwipe = false; return; }
    tx = tt.clientX; ty = tt.clientY; tSwipe = true;
  }, { passive: true });
  addEventListener("touchend", (ev) => {
    const tt = ev.changedTouches[0];
    if (!tSwipe || !tt) return;
    tSwipe = false;
    const dx = tt.clientX - tx, dy = tt.clientY - ty;
    if (Math.abs(dx) > 34 && Math.abs(dx) > Math.abs(dy) * 1.2) goTo(current + (dx < 0 ? 1 : -1));
  }, { passive: true });
  addEventListener("touchcancel", () => (tSwipe = false), { passive: true });

  const prev = scene.onStory;
  scene.onStory = (p) => {
    prev?.(p);
    lastP = p;
    const { c, f } = chapters(p);
    /* экраны продукта включаются, когда глава вот-вот покажется: до этого они только утяжеляют старт */
    if (c > CASES.cardsIn[0] - 0.12) card?.warm();
    const vis = c > CASES.cardsIn[0] && c < CASES.stripOut[1] && f <= 0;
    root.style.setProperty("--leave", ramp(c, ...CASES.stripOut).toFixed(3));
    if (vis !== shown) {
      shown = vis;
      root.classList.toggle("is-on", vis);
      root.setAttribute("aria-hidden", String(!vis));
      steps.forEach((b) => (b.tabIndex = vis ? 0 : -1));
      card?.reach(vis);
      /* глава показалась — спутники разлетаются; ушла — собираются обратно */
      if (vis) card?.live(); else card?.calm();
      lastKey = "";
    }
    if (!vis) return;
    const inK = ramp(c, ...CASES.cardsIn);
    const e = 1 - (1 - inK) ** 3;
    const run = ramp(c, ...CASES.strip) * (n - 1);
    place(reduced ? Math.round(run) : dwell(run), e);
  };

  onViewport(layout);
  onLang(() => requestAnimationFrame(layout));
  layout();
  if (consumeReviewJump()) requestAnimationFrame(() => scrollTo({ top: topForCase(0), behavior: "instant" as ScrollBehavior }));

  /* WebGL по умолчанию — там, где есть мышь: объём предмета раскрывается за курсором. На телефоне хватает картинок */
  const wantGl = !asCard && (opts.gl === true || (opts.gl === "auto" && matchMedia("(hover: hover) and (pointer: fine)").matches));
  if (wantGl && !reduced) {
    /* предметы в WebGL: объём по карте глубины и переход шейдером. Если холст не поднялся, остаются картинки */
    void import("./casesWheelGl").then((m) => m.createWheelGl(stage, list)).then((g) => {
      if (!g) return;
      gl = g;
      root.classList.add("has-gl");
      gl.set(drum, px, py);
    }).catch(() => {});
  }
}
