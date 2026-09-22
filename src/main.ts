import "./ui/fonts.css";
import "./ui/hero/hero.css";
import "./ui/hill-ui.css";
import "./ui/walk.css";
import "./ui/case-v37.css";
import "./ui/hero/hero-mobile.css";
import { HillScene, type HillSceneOptions } from "./scene/HillScene";
import { initHeroUi } from "./ui/hero/heroUi";
import { initWorkMenu } from "./ui/workMenu";
import { initStory } from "./ui/storyHero";
import { initCases, renderCases } from "./ui/cases";
import { initFieldNote } from "./ui/fieldNote";
import { initWalkChapter, renderShelf } from "./ui/walkChapter";
import { initSound } from "./ui/soundToggle";
import { initFooter } from "./ui/footer";
import { initDockNav, trackByScroll, type DockSection } from "./ui/dockNav";
import { initCaseView } from "./ui/caseView";
import { liteReason, enterLite, rememberLite } from "./ui/lite";
import { initLangToggle } from "./ui/langToggle";
import { initI18n, onLang, t } from "./i18n";
import { cue } from "./audio/bus";
import { CASES, CHAPTER, CHAPTER2, TIMELINE, chapters } from "./scene/story";
import { topFor } from "./ui/storyScroll";
import { smoothWheel } from "./ui/smoothScroll";
import { createNatureLoader } from "./intro/natureLoader";


const params = new URLSearchParams(location.search);
const body = document.body;
/* объявлено до запуска: start3d() вызывается ниже по файлу раньше, чем выполнились бы объявления после него */
let liteTracking: (() => void) | null = null;
/* v69: сцена появляется позже страницы кейса, поэтому пауза ставится через ссылку, а не прямо в замыкании */
type CaseView = ReturnType<typeof initCaseView>;
let scene3d: HillScene | null = null;
const pauseForCase = (open: boolean) => { if (scene3d) scene3d.paused = open; };

/* v27: язык страницы (?lang=ru, сохранённый выбор или язык браузера) — до того, как модули соберут
   свою разметку; переключатель стоит в доке */
initI18n();

/* v24: лёгкая версия без 3D — нет WebGL2, программный рендер, ?lite=1 или устройство уже оказалось
   слишком медленным (нагрузочный прогон: SwiftShader 0.2 fps, без WebGL — исключение и пустой экран) */
const lite = liteReason(params);
if (lite) startLite(lite);
/* v69: открыли прямой ссылкой на кейс — страница кейса собирается первой, холм поднимается после неё */
else if (location.hash.startsWith("#/work/")) startCaseFirst();
else boot3d();

function boot3d(caseView?: CaseView) {
  try {
    start3d(caseView);
  } catch (e) {
    console.warn("3D не запустилось — лёгкая версия", e);
    startLite("error");
  }
}

/* Ссылка в отклике ведёт не на главную, а на конкретный кейс, и у смотрящего полторы минуты на всё портфолио.
   Страница кейса — обычный HTML с картинками, ей 3D не нужно, но раньше она ждала, пока поднимется сцена:
   на среднем ноутбуке заголовок кейса появлялся через 17 секунд вместо двух. Теперь сцена стартует после того,
   как страница кейса оказалась на экране, — в первом же простое, чтобы не мешать чтению.
   Порог держит tools/case-entry-test.mjs. */
function startCaseFirst() {
  const view = initCaseView({ onToggle: pauseForCase });
  let booted = false;
  const boot = () => { if (!booted) { booted = true; boot3d(view); } };
  const idle = (window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number }).requestIdleCallback
    ?? ((cb: () => void) => window.setTimeout(cb, 1));
  const wait = () => {
    if (booted) return;
    if (body.classList.contains("case-open")) idle(boot, { timeout: 1200 });
    else requestAnimationFrame(wait);
  };
  requestAnimationFrame(wait);
  /* кейс так и не открылся — опечатка в адресе или тексты не приехали: холм всё равно нужен */
  setTimeout(boot, 4000);
}

function startLite(reason: string) {
  const ui = initHeroUi({});
  renderCases();
  renderShelf();
  initFieldNote();
  initWorkMenu({ onOpenComputer: () => {}, onAllCases: () => document.getElementById("work")?.scrollIntoView({ behavior: "smooth" }) });
  initFooter({ go: (to) => document.querySelector(to === "cases" ? "#work" : to === "about" ? ".story-hero" : "#hero")?.scrollIntoView({ behavior: "smooth" }) });
  const liteGo = (sel: string) => document.querySelector(sel)?.scrollIntoView({ behavior: "smooth" });
  const dockNav = initDockNav({
    top: () => scrollTo({ top: 0, behavior: "smooth" }),
    about: () => liteGo(".story-hero"),
    lab: () => liteGo("#notes"),
    contact: () => liteGo("#contact"),
  });
  document.querySelectorAll("[data-action='explore']").forEach((el) =>
    el.addEventListener("click", (e) => { e.preventDefault(); document.getElementById("work")?.scrollIntoView({ behavior: "smooth" }); }),
  );
  enterLite(reason);
  if (dockNav) trackByScroll(dockNav.track);
  /* v43: в лёгкой версии страница прокручивается сама — то же мягкое колесо, что на страницах кейсов */
  smoothWheel(window, () => body.classList.contains("case-open"));
  initCaseView();
  initLangToggle();
  ui.ready();
}

function start3d(caseView?: CaseView) {
  const opts: HillSceneOptions = {};
  const cam = params.get("cam")?.split(",").map(Number);
  if (cam?.length === 6 && cam.every(Number.isFinite)) opts.fixedCamera = cam as HillSceneOptions["fixedCamera"];
  if (params.get("ui") === "0") body.classList.add("no-ui");

  /* Живой сад (docs/nature-loader.md): процедурная сцена растёт во время загрузки.
     Один раз за сессию; ?intro=1 — всегда, ?intro=0 — никогда, ?ui=0 — тоже без заставки. */
  const introParam = params.get("intro");
  let seen = false;
  try { seen = sessionStorage.getItem("hill-intro") === "1"; } catch { /* приватный режим */ }
  const withIntro = !location.hash.startsWith("#/work/") && (introParam === "1" || (introParam !== "0" && !seen && params.get("ui") !== "0" && !opts.fixedCamera));
  const garden = withIntro ? createNatureLoader(() => {
    try { sessionStorage.setItem("hill-intro", "1"); } catch { /* private mode */ }
    scene.paused = body.classList.contains("case-open");
    ui.ready();
  }, () => degrade("stall")) : null;

  const canvas = document.getElementById("scene") as HTMLCanvasElement;
  let scene: HillScene;
  try { scene = new HillScene(canvas, opts); }
  catch (error) { garden?.dispose(); throw error; }
  scene3d = scene;

  /* Погода: клик по «Weather» в углу перебирает ясно → облака → дождь → сумерки */
  const weatherLabel = (k: typeof scene.weatherKind) => t(`weather.${k}` as "weather.clear");
  const weatherStat = document.querySelector<HTMLElement>("[data-action='weather']");
  const weatherText = document.querySelector("[data-stat='wind']");
  const showWeather = () => { if (weatherText) weatherText.textContent = weatherLabel(scene.weatherKind); };
  showWeather();
  onLang(showWeather);
  const changeWeather = () => {
    scene.cycleWeather();
    cue("toggle-on", 0.8);
    showWeather();
  };
  weatherStat?.addEventListener("click", changeWeather);
  weatherStat?.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); changeWeather(); }
  });

  const ui = initHeroUi({
    burstAt: (x, y) => scene.burstAt(x, y),
    onGust: () => {
      cue("swipe");
      scene.gust();
      if (weatherText) {
        weatherText.textContent = t("stat.gust");
        setTimeout(showWeather, 3200);
      }
    },
  });

  /* скролл-история: компьютер взлетает со стола и встаёт перед зрителем (About), затем — «Кейсы» и футер */
  const story = initStory(scene);
  initCases(scene);
  initWalkChapter(scene);
  initFieldNote();
  initSound(scene);
  initFooter({ go: (to) => (to === "cases" ? story?.toCases() : to === "about" ? story?.toAbout() : story?.toTop()) });
  /* v26: страница кейса поверх сцены — пока открыта, сцена кадры не рисует */
  /* v69: при входе по прямой ссылке страница кейса собрана до сцены — берём её, а не делаем вторую */
  if (caseView) scene.paused = caseView.isOpen;
  else initCaseView({ onToggle: pauseForCase });

  const blades = document.querySelector("[data-stat='blades']");
  const showBlades = () => { if (blades) blades.textContent = t("stat.blades.value", { n: Math.round(scene.blades / 1000) }); };
  showBlades();
  onLang(showBlades);

  /* Порядок показа: сцена сразу в финальной позе (без отъезда камеры) — как только
     откалибровалось качество, канвас мягко проявляется целиком; через мгновение за
     ним входят надписи, док и карточки. Пока канвас скрыт, замер не мешает CSS. */
  // Real readiness milestones drive the loader; no simulated download percentage.
  const gardenPoll = garden ? window.setInterval(() => garden.progress(scene.loadingProgress), 160) : 0;

  let started = false;
  const start = () => {
    if (started || body.classList.contains("lite")) return;
    started = true;
    body.classList.add("scene-ready");
    clearInterval(gardenPoll);
    if (garden) {
      scene.presentationReady.then(() => {
        if (body.classList.contains("lite")) return;
        // The prepared hill is completely occluded. Keep its last frame until reveal.
        scene.paused = true;
        garden.ready();
      });
    } else setTimeout(() => ui.ready(), 280);
  };
  scene.calibrated.then(start);
  setTimeout(() => { if (!started) scene.provisionalTier(); start(); }, 6000);

  /* v24: сцена не тянет (калибровка на нижней ступени всё равно дольше бюджета, WebGL-контекст пропал
     и не вернулся, или за 14 с не нарисовано ни кадра) — переходим в лёгкую версию, не оставляя
     человека перед замёрзшим холстом */
  const degrade = (why: "slow" | "context" | "stall") => {
    if (body.classList.contains("lite")) return;
    if (why !== "context") rememberLite();
    clearInterval(gardenPoll);
    garden?.dispose();
    closePc();
    scene.dispose();
    renderCases();
    renderShelf();
    enterLite(why);
    liteTracking?.();
    smoothWheel(window, () => body.classList.contains("case-open"));
    ui.ready();
  };
  scene.onDegrade = degrade;
  /* вкладка в фоне не рисует вовсе — это не зависание */
  let wasHidden = document.hidden;
  document.addEventListener("visibilitychange", () => { if (document.hidden) wasHidden = true; });
  const stallCheck = () => {
    if (scene.renderedFrames > 0 || wasHidden || opts.fixedCamera) return;
    /* v27: открыли прямую ссылку на кейс — сцена стоит нарочно (paused), это не зависание */
    if (scene.paused) return void setTimeout(stallCheck, 6000);
    degrade("stall");
  };
  setTimeout(stallCheck, 14000);

  /* Компьютер на столике: наведение и клик (или строка внизу меню Work)
     подвозит камеру к экрану — там журнал с прокруткой. Выход: Esc или «Back to the hill». */
  const tip = document.querySelector<HTMLElement>(".pc-tip");
  /* плавность затухания интерфейса нужна только на входе/выходе из режима у экрана */
  let pcAnimTimer = 0;
  const pcAnim = () => {
    body.classList.add("pc-anim");
    clearTimeout(pcAnimTimer);
    pcAnimTimer = window.setTimeout(() => body.classList.remove("pc-anim"), 700);
  };
  const openPc = () => {
    if (scene.computerFocused || body.classList.contains("lite")) return;
    workMenu?.close();
    scene.setComputerFocus(true);
    if (!scene.computerFocused) return; // компьютер в скролл-истории — не у стола
    pcAnim();
    cue("open");
    body.classList.add("pc-focus");
    body.classList.remove("pc-hover");
    document.querySelector<HTMLElement>(".pc-back")?.focus({ preventScroll: true });
  };
  function closePc() {
    if (!scene.computerFocused) return;
    scene.setComputerFocus(false);
    cue("close");
    pcAnim();
    body.classList.remove("pc-focus");
  }
  scene.onComputerHover = (hover) => body.classList.toggle("pc-hover", hover);
  window.addEventListener("pointermove", (e) => {
    if (tip) tip.style.transform = `translate(${e.clientX + 18}px, ${e.clientY + 14}px)`;
  }, { passive: true });
  window.addEventListener("click", (e) => {
    if (scene.computerFocused || body.classList.contains("lite")) return;
    if ((e.target as Element).closest("a, button, .card, .dock, .cta-wrap, .play-wrap")) return;
    if (scene.hitComputer(e.clientX, e.clientY)) openPc();
  });
  /* «See the work» проматывает скролл-историю к главе «Кейсы» (v19; раньше открывала компьютер,
     но он и так открывается наведением) */
  document.querySelectorAll("[data-action='explore']").forEach((el) =>
    el.addEventListener("click", (e) => {
      e.preventDefault();
      cue("press");
      if (body.classList.contains("lite")) document.getElementById("work")?.scrollIntoView({ behavior: "smooth" });
      else story?.toCases();
    }),
  );
  /* Work в доке — выпадающий список кейсов с превью */
  const workMenu = initWorkMenu({
    onOpenComputer: openPc,
    onAllCases: () => {
      if (body.classList.contains("lite")) return document.getElementById("work")?.scrollIntoView({ behavior: "smooth" });
      closePc();
      story?.toCases();
    },
  });
  /* v24: остальные пункты дока вели в никуда (клик гасился ради анимации пилюли) — теперь Hill к холму,
     Say hi к контактам в футере */
  const isLite = () => body.classList.contains("lite");
  const liteGo = (sel: string) => document.querySelector(sel)?.scrollIntoView({ behavior: "smooth" });
  const dockNav = initDockNav({
    top: () => {
      if (isLite()) return scrollTo({ top: 0, behavior: "smooth" });
      closePc();
      story?.toTop();
    },
    about: () => {
      if (isLite()) return liteGo(".story-hero");
      closePc();
      story?.toAbout();
    },
    lab: () => {
      if (isLite()) return liteGo("#notes");
      closePc();
      story?.toNotes();
    },
    contact: () => {
      if (isLite()) return liteGo("#contact");
      closePc();
      story?.toFooter();
    },
  });
  /* v45: активный пункт дока — раздел истории, в котором сейчас человек */
  if (dockNav) {
    const sectionAt = (p: number): DockSection => {
      const { s, c, f } = chapters(p);
      if (f > 0.2) return "contact";
      if (c >= CASES.notesIn[0]) return "lab";
      if (c > CASES.intro[0]) return "work";
      return s > 0.5 ? "about" : "home";
    };
    const prevStory = scene.onStory;
    scene.onStory = (p) => { prevStory?.(p); if (!isLite()) dockNav.track(sectionAt(p)); };
    liteTracking = () => trackByScroll(dockNav.track);
  }
  initLangToggle();
  document.querySelector(".pc-back")?.addEventListener("click", closePc);
  window.addEventListener("wheel", (e) => {
    if (!scene.computerFocused) return;
    e.preventDefault();
    scene.scrollScreen(e.deltaY * (e.deltaMode === 1 ? 36 : e.deltaMode === 2 ? 600 : 1) * 1.1);
  }, { passive: false });
  window.addEventListener("keydown", (e) => {
    if (!scene.computerFocused) return;
    const steps: Record<string, () => void> = {
      Escape: closePc,
      ArrowDown: () => scene.scrollScreen(90),
      ArrowUp: () => scene.scrollScreen(-90),
      PageDown: () => scene.scrollScreenPage(1),
      PageUp: () => scene.scrollScreenPage(-1),
      " ": () => scene.scrollScreenPage(e.shiftKey ? -1 : 1),
      Home: () => scene.scrollScreenEdge(false),
      End: () => scene.scrollScreenEdge(true),
    };
    const act = steps[e.key];
    if (act) { e.preventDefault(); act(); }
  });
  /* палец: тянем журнал вверх-вниз */
  let dragY: number | null = null;
  window.addEventListener("pointerdown", (e) => {
    if (scene.computerFocused && e.pointerType !== "mouse" && !(e.target as Element).closest("button")) dragY = e.clientY;
  });
  window.addEventListener("pointermove", (e) => {
    if (dragY === null) return;
    scene.scrollScreen((dragY - e.clientY) * scene.screenScrollScale);
    dragY = e.clientY;
  });
  window.addEventListener("pointerup", () => (dragY = null));
  window.addEventListener("pointercancel", () => (dragY = null));
  window.addEventListener("touchmove", (e) => { if (scene.computerFocused) e.preventDefault(); }, { passive: false });
  /* для CDP-замеров */
  Object.assign(window, { __hill: scene, __story: { TIMELINE, CASES, topFor, chapter: () => [CHAPTER, CHAPTER2] } });

  /* ?debug=1 — плашка качества: какую ступень выбрала калибровка на этом устройстве */
  if (params.get("debug") === "1") {
    const box = document.createElement("div");
    box.style.cssText = "position:fixed;left:8px;bottom:8px;z-index:99;font:12px/1.4 monospace;color:#fff;background:rgba(0,0,0,.6);padding:6px 8px;border-radius:6px;pointer-events:none;white-space:pre";
    body.appendChild(box);
    let frames = 0, last = performance.now();
    const tick = (now: number) => {
      frames++;
      if (now - last > 1000) {
        const s = scene as unknown as { qualityTier: number; pixelRatio: number; blades: number; calibrationLog: number[][] };
        box.textContent = `tier ${s.qualityTier}  dpr ${s.pixelRatio.toFixed(2)} / screen ${devicePixelRatio}\nfps ${Math.round((frames * 1000) / (now - last))}  blades ${s.blades}\ncalib ${JSON.stringify(s.calibrationLog)}`;
        frames = 0; last = now;
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
}
