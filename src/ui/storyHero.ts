import { CASES, CHAPTER, CHAPTER2, FOOTER, STORY, STORY_FX, chapters, ramp, trap } from "../scene/story";
import { onTimeline, storyBounds } from "./storyScroll";
import { cue } from "../audio/bus";
import { onLang, t as tr } from "../i18n";

/* DOM-слой скролл-истории: прогресс прокрутки → сцена, и тексты экрана About портфолио
   на Tilda (слева «Hi there!», справа абзацы и логотипы), когда компьютер встал перед зрителем.

   Прогресс считается, как в igloo (lib/scroll-progress.ts): доля прокрутки внутри блока
   .story; на узком экране — после того как пролистан контент hero. Сглаживает сцена.
   ?story=0.5 — зафиксировать прогресс всей истории для скриншотов (главы — story.ts, CHAPTER).

   Плавность (v18.1): CSS-переменные пишутся не в корень документа, а в свои элементы и только
   когда значение изменилось; DOM в кадре не читается; рамка обновляется после того, как сцена
   поставила камеру и компьютер, — в том же кадре, что и картинка.

   v19: заголовок «Hi there!» появляется подменой бегущей строки (сцена рисует её до этого места
   по замеру заголовка — setKineticTarget), абзац слева проявляется по словам по скроллу; в главе
   «Кейсы» страница About уходит вверх вместе с рваным краем бумаги. */

type Rect = { x: number; y: number; w: number; h: number };
type Scene = {
  setStoryProgress(p: number): void;
  onStory?: (p: number) => void;
  onStoryFrame?: () => void;
  pcClientRect?(): Rect | null;
  setKineticTarget?(t: { left: number; baseline: number; font: number } | null): void;
  setStorySlot?(slot: { top: number; bottom: number } | null): void;
  storyProgress: number;
  storyFlight: number;
  storyTear: number;
  kellyClientPoint?(): { x: number; y: number; w: number } | null;
  kellySleepPoint?(): { x: number; y: number } | null;
};

export function initStory(scene: Scene) {
  const story = document.querySelector<HTMLElement>(".story");
  const hero = document.querySelector<HTMLElement>(".story-hero");
  if (!story || !hero) return null;
  const body = document.body;
  const stage = document.querySelector<HTMLElement>(".stage");
  const progress = document.querySelector<HTMLElement>(".story-progress");
  const head = hero.querySelector<HTMLElement>(".story-hi");
  const base = hero.querySelector<HTMLElement>(".story-base");
  const intro = hero.querySelector<HTMLElement>(".story-intro");
  /* логотипы с подсказками фокусируются с клавиатуры только когда тексты видны */
  const focusables = [...hero.querySelectorAll<HTMLElement>("[tabindex]")];
  focusables.forEach((el) => (el.tabIndex = -1));
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const morph = STORY_FX.kinetic && !reduced;

  /* абзац — по словам: каждое слово — span с номером, прозрачность считает CSS из --r.
     v27: смена языка возвращает в абзац обычный текст (applyStatic) — режем заново */
  const splitIntro = () => {
    if (!intro) return;
    const words = (intro.textContent ?? "").trim().split(/\s+/);
    intro.setAttribute("aria-label", words.join(" "));
    intro.innerHTML = words.map((w, i) => `<span class="w" aria-hidden="true" style="--i:${i}">${w}</span>`).join(" ");
    intro.style.setProperty("--n", String(words.length));
  };
  splitIntro();
  onLang(() => { splitIntro(); measure(); });

  const fixed = Number(new URLSearchParams(location.search).get("story"));
  const hasFixed = new URLSearchParams(location.search).has("story") && Number.isFinite(fixed);

  const bounds = storyBounds;
  let b = bounds();
  let raf = 0;
  const read = () => {
    raf = 0;
    const p = hasFixed ? fixed : (scrollY - b.start) / Math.max(1, b.end - b.start);
    scene.setStoryProgress(p);
  };
  const schedule = () => { if (!raf) raf = requestAnimationFrame(read); };

  /* где стоит заголовок «Hi there!» — сцена доводит бегущую строку ровно сюда. Мерим, пока страница
     About на месте (в главе «Кейсы» она сдвинута), на resize и когда приехал шрифт */
  const measure = () => {
    if (!head || !base || scene.storyTear > -0.5) return;
    const r = head.getBoundingClientRect();
    scene.setKineticTarget?.({ left: r.left, baseline: base.getBoundingClientRect().top, font: parseFloat(getComputedStyle(head).fontSize) });
    /* v43: узкий экран — тексты стоят над компьютером и под ним; сцене нужен промежуток между ними.
       offsetTop не зависит от translate, которым тексты въезжают. 64px сверху — под подпись «а это Келли» */
    const left = hero.querySelector<HTMLElement>(".story-col--left");
    const below = [...hero.children].filter((el): el is HTMLElement => el instanceof HTMLElement && el !== left && el.offsetHeight > 0 && getComputedStyle(el).position !== "absolute");
    if (innerWidth <= 900 && left && below.length) {
      const top = hero.getBoundingClientRect().top;
      scene.setStorySlot?.({ top: top + left.offsetTop + left.offsetHeight + 64, bottom: top + Math.min(...below.map((el) => el.offsetTop)) - 8 });
    } else scene.setStorySlot?.(null);
  };
  addEventListener("scroll", schedule, { passive: true });
  /* v48: на телефоне первый экран меняет высоту, когда раскрывается карточка заметок, — история сдвигается вместе с ним */
  const heroBox = document.querySelector<HTMLElement>(".hero");
  if (heroBox && "ResizeObserver" in window) {
    const ro = new ResizeObserver(() => { b = bounds(); schedule(); });
    ro.observe(heroBox);
    if (stage) ro.observe(stage);
  }
  addEventListener("resize", () => { b = bounds(); schedule(); measure(); });
  document.fonts?.ready.then(measure);
  /* шрифт грузится асинхронно — перемерить, когда шрифт реально подгрузился */
  document.fonts?.addEventListener("loadingdone", measure);
  /* v24: пока шрифт не приехал, страница About скрыта (visibility) — перенос строк при подмене шрифта
     давал сдвиг раскладки CLS 0.09 на телефоне */
  const fontsReady = () => document.documentElement.classList.add("fonts-ready");
  /* ждём именно Onest: fonts.check() отвечает «готово» и для ещё не объявленного шрифта */
  document.fonts?.addEventListener("loadingdone", (e) => { if ((e as FontFaceSetLoadEvent).fontfaces.some((f) => /onest/i.test(f.family))) fontsReady(); });
  if ([...(document.fonts ?? [])].some((f) => /onest/i.test(f.family) && f.status === "loaded")) fontsReady();
  window.setTimeout(fontsReady, 5000);
  read();
  measure();
  if (hasFixed) scrollTo(0, b.start + (b.end - b.start) * fixed);
  /* v43: длину истории считает cases.ts от числа кейсов и шага ленты — границы после этого другие */
  onTimeline(() => {
    b = bounds();
    if (hasFixed) scrollTo(0, b.start + (b.end - b.start) * fixed);
    schedule();
    measure();
  });

  const jumpTo = (p: number) => {
    b = bounds();
    const target = p <= 0 ? 0 : b.start + (b.end - b.start) * p;
    const far = Math.abs(scrollY - target) > innerHeight * 2.5;
    if (far && !reduced) scrollTo({ top: target + (target > scrollY ? -1 : 1) * innerHeight * 1.2, behavior: "instant" as ScrollBehavior });
    scrollTo({ top: target, behavior: reduced ? "auto" : "smooth" });
  };
  const scrollToProgress = (p: number) => {
    b = bounds();
    scrollTo({ top: b.start + (b.end - b.start) * p, behavior: reduced ? "auto" : "smooth" });
  };
  /* «Discover» внизу hero — к экрану About */
  document.querySelector<HTMLAnchorElement>(".scroll")?.addEventListener("click", (e) => {
    e.preventDefault();
    scrollToProgress(CHAPTER);
  });

  /* CSS-переменная — в свой элемент и только при изменении */
  const written = new Map<string, string>();
  const setVar = (el: HTMLElement | null, name: string, value: string) => {
    const key = name + (el?.className ?? "");
    if (!el || written.get(key) === value) return;
    written.set(key, value);
    el.style.setProperty(name, value);
  };

  let on = false;
  let active = false;
  let away = false;
  let gone = false;
  let settle = 0;
  scene.onStory = (p) => {
    const { s, c } = chapters(p);
    const so = Math.min(1, Math.max(0, s / STORY.uiOut[1]));
    setVar(stage, "--so", so.toFixed(3));
    setVar(progress, "--sp", p.toFixed(3));
    /* полоса прогресса тёмная над бумагой, светлая над сценой */
    setVar(progress, "--sf", (ramp(s, ...STORY.fill) * (1 - ramp(c, 0.02, 0.12))).toFixed(2));
    const nowActive = p > 0.01;
    if (nowActive !== active) { active = nowActive; body.classList.toggle("story-active", active); }
    /* интерфейс холма ушёл целиком — его размытый слой не рисуем вовсе */
    const nowAway = so >= 1;
    if (nowAway !== away) { away = nowAway; body.classList.toggle("story-away", away); }

    /* заголовок: подмена бегущей строки (или просто проявление без кинетики) */
    const headA = morph ? ramp(s, ...STORY.kineticSwap) : ramp(s, STORY.kineticMorph[0] + 0.04, STORY.kineticSwap[1]);
    setVar(head, "opacity", headA.toFixed(3));
    setVar(intro, "--r", ramp(s, ...STORY.words).toFixed(3));

    /* глава «Кейсы»: страница уходит вверх ровно с рваным краем (сцена: storyTear — доля кадра) */
    const lift = c > 0 ? Math.max(0, scene.storyTear + 0.12) : 0;
    setVar(hero, "--lift", (lift * 100).toFixed(2) + "vh");
    /* v74.2: бумага больше не уезжает, а растворяется облаком (shaders.ts) — текст и его подложки растворяются
       вместе с ней, иначе светлые плашки About висели прямоугольниками над открывшимся лугом */
    setVar(hero, "opacity", c > 0 ? Math.max(0, 1 - lift * 1.8).toFixed(3) : "");
    const nowGone = lift > 1.2;
    if (nowGone !== gone) { gone = nowGone; hero.style.visibility = gone ? "hidden" : ""; }

    /* гистерезис: правая колонка входит после остановки компьютера и уходит чуть раньше назад */
    const next = (on ? s > STORY.textOff : s > STORY.textOn) && !gone;
    if (next !== on) {
      on = next;
      body.classList.toggle("story-on", on);
      clearTimeout(settle);
      body.classList.remove("story-settled");
      if (on) settle = window.setTimeout(() => body.classList.add("story-settled"), 1400);
      hero.setAttribute("aria-hidden", String(!on));
      focusables.forEach((el) => (el.tabIndex = on ? 0 : -1));
    }
  };

  /* ── рамка видоискателя: мягко ведёт компьютер, пока он летит по светлой странице ── */
  const vf = document.querySelector<HTMLElement>(".vf");
  if (vf && STORY_FX.finder) initFinder(scene, vf);

  /* ── футер: контакты на закатном холме ── */
  const footer = document.querySelector<HTMLElement>(".site-footer");
  if (footer) {
    const links = [...footer.querySelectorAll<HTMLElement>("a, button")];
    let footOn = false;
    const prevStory = scene.onStory;
    scene.onStory = (p) => {
      prevStory?.(p);
      const next = chapters(p).f > FOOTER.content;
      if (next === footOn) return;
      footOn = next;
      footer.classList.toggle("is-on", footOn);
      footer.setAttribute("aria-hidden", String(!footOn));
      links.forEach((el) => (el.tabIndex = footOn ? 0 : -1));
    };
  }

  /* ── «and this is Kelly»: подпись над полароидом, пока открыт экран About ── */
  const note = document.querySelector<HTMLElement>(".kelly-note");
  if (note) {
    let noteOn = false;
    let lastKey = "";
    const prevFrame = scene.onStoryFrame;
    scene.onStoryFrame = () => {
      prevFrame?.();
      const { s, c } = chapters(scene.storyProgress);
      const want = s > STORY.textOn + 0.02 && c <= 0;
      const pt = want ? scene.kellyClientPoint?.() : null;
      const next = !!pt;
      if (next !== noteOn) { noteOn = next; note.classList.toggle("is-on", noteOn); }
      if (!pt) return;
      /* стрелка упирается в верхний край карточки, чуть правее центра */
      const key = `translate3d(${(pt.x + pt.w * 0.15).toFixed(0)}px, ${(pt.y - 4).toFixed(0)}px, 0)`;
      if (key !== lastKey) { lastKey = key; note.style.transform = key; }
    };
  }

  /* ── v24: «z z z» над спящей Келли, пока открыт футер ── */
  const zzz = document.querySelector<HTMLElement>(".kelly-zzz");
  if (zzz) {
    let zOn = false;
    let lastKey = "";
    const prevFrame = scene.onStoryFrame;
    scene.onStoryFrame = () => {
      prevFrame?.();
      const want = chapters(scene.storyProgress).f > FOOTER.content;
      const pt = want ? scene.kellySleepPoint?.() : null;
      if (!!pt !== zOn) { zOn = !!pt; zzz.classList.toggle("is-on", zOn); }
      if (!pt) return;
      const key = `translate3d(${pt.x.toFixed(0)}px, ${(pt.y - 6).toFixed(0)}px, 0)`;
      if (key !== lastKey) { lastKey = key; zzz.style.transform = key; }
    };
  }

  return {
    /** к главе «Кейсы»: лента уже поднялась */
    toCases: () => scrollToProgress(CHAPTER + (CHAPTER2 - CHAPTER) * CASES.strip[0]),
    toAbout: () => scrollToProgress(CHAPTER),
    /** к своим проектам: первая заметка уже встала */
    toNotes: () => jumpTo(CHAPTER + (CHAPTER2 - CHAPTER) * CASES.notesRun[0]),
    /** к холму и к контактам: из середины истории плавная прокрутка тянулась бы секунды — прыжок ближе, остаток плавно */
    toTop: () => jumpTo(0),
    toFooter: () => jumpTo(1),
  };
}

function initFinder(scene: Scene, vf: HTMLElement) {
  const coords = vf.querySelector<HTMLElement>("[data-vf-coords]");
  const size = vf.querySelector<HTMLElement>("[data-vf-size]");
  const state = vf.querySelector<HTMLElement>("[data-vf-state]");
  const cur = { x: 0, y: 0, w: 0, h: 0 };
  let shown = false;
  let locked = false;
  let lastT = performance.now();
  let lastText = 0;
  let lastW = -1, lastH = -1;
  scene.onStoryFrame = () => {
    const { s, c } = chapters(scene.storyProgress);
    const a = c > 0 ? 0 : trap(s, ...STORY.finder);
    const r = a > 0.001 ? scene.pcClientRect?.() : null;
    const now = performance.now();
    const dt = Math.min(0.05, (now - lastT) / 1000);
    lastT = now;
    if (!r) {
      if (shown) { shown = false; vf.style.opacity = "0"; vf.style.visibility = "hidden"; }
      return;
    }
    /* отступ; на входе рамка шире и «сжимается» на объект */
    const pad = Math.max(16, r.w * 0.09) + (1 - a) * 28;
    const tx = r.x - pad, ty = r.y - pad, tw = r.w + pad * 2, th = r.h + pad * 2;
    if (!shown) {
      shown = true;
      Object.assign(cur, { x: tx, y: ty, w: tw, h: th });
      vf.style.visibility = "visible";
    } else {
      /* ведёт с лёгкой инерцией, как оператор камеру, — не прилипает к каждому кадру полёта */
      const k = 1 - Math.exp(-dt * 14);
      cur.x += (tx - cur.x) * k;
      cur.y += (ty - cur.y) * k;
      cur.w += (tw - cur.w) * k;
      cur.h += (th - cur.h) * k;
    }
    vf.style.opacity = a.toFixed(3);
    const w = Math.round(cur.w), h = Math.round(cur.h);
    if (w !== lastW || h !== lastH) {
      lastW = w; lastH = h;
      vf.style.width = w + "px";
      vf.style.height = h + "px";
    }
    vf.style.transform = `translate3d(${cur.x.toFixed(1)}px, ${cur.y.toFixed(1)}px, 0)`;
    /* захват: компьютер долетел — уголки щёлкают внутрь, статус меняется */
    const nowLocked = scene.storyFlight > 0.985;
    if (nowLocked !== locked) {
      locked = nowLocked;
      vf.classList.toggle("vf--lock", locked);
      if (locked) cue("checkpoint", 0.6);
      if (state) state.textContent = tr(locked ? "vf.locked" : "vf.tracking");
    }
    /* цифры — 12 раз в секунду: чаще не читается и зря перекладывает текст */
    if (now - lastText > 80) {
      lastText = now;
      if (coords) coords.textContent = `X ${String(Math.round(r.x + r.w / 2)).padStart(4, "0")}  Y ${String(Math.round(r.y + r.h / 2)).padStart(4, "0")}`;
      if (size) size.textContent = `${Math.round(r.w)} × ${Math.round(r.h)} px`;
    }
  };
}
