import "./ui/fonts.css";
import "./ui/hero/hero.css";
import "./ui/hill-ui.css";
import "./ui/hero/notch.css";
import "./ui/walk.css";
import "./ui/case-v37.css";
import "./ui/cases-signpost.css";
import { initCasesSignpost } from "./ui/casesSignpost";
import "./ui/hero/hero-mobile.css";
import "./ui/hero/mobile-nav.css";
import "./ui/pc-hud.css";
import "./ui/hero/clear-glass.css";
import { initMobileNav } from "./ui/hero/mobileNav";
import { initSoundButton } from "./ui/hero/soundButton";
import "./ui/hero/sky-tone.css";
import { initLabMenu } from "./ui/labMenu";
import { initStoryWheel } from "./ui/storyWheel";
import { HillScene, type HillSceneOptions } from "./scene/HillScene";
import { startModels } from "./scene/models";
import { runChores } from "./lib/chores";
import { initHeroUi } from "./ui/hero/heroUi";
import { initWorkMenu } from "./ui/workMenu";
import { initStory } from "./ui/storyHero";
import { initCases, renderCases } from "./ui/cases";
import { initFieldNote } from "./ui/fieldNote";
import { initMobileCopy } from "./ui/hero/mobileCopy";
import { initHeroHints } from "./ui/hero/heroHints";
import { initWalkChapter, renderShelf } from "./ui/walkChapter";
import { initSound } from "./ui/soundToggle";
import { initFooter } from "./ui/footer";
import { initDockNav, trackByScroll, type DockSection } from "./ui/dockNav";
import { initCaseView } from "./ui/caseView";
import { liteSaved, liteProbe, enterLite, rememberLite } from "./ui/lite";
import { initLangToggle } from "./ui/langToggle";
import { initGlassLens } from "./ui/hero/glassLens";
import { initLiquidButton } from "./ui/hero/liquidButton";
import { initI18n, onLang, t } from "./i18n";

/* v74.2: ширина полосы прокрутки. Сетка первого экрана считается от 100vw (с полосой), а всё закреплённое
   (fixed) — от видимой ширины без неё: кнопка звука и кнопки «Кейсов» стояли левее правого поля карточки
   ровно на ширину полосы. --sbw возвращает им общую вертикаль */
const syncScrollbar = () => document.documentElement.style.setProperty("--sbw", `${Math.max(0, innerWidth - document.documentElement.clientWidth)}px`);
syncScrollbar();
addEventListener("resize", syncScrollbar);
import { cue } from "./audio/bus";
import { CASES, CHAPTER, CHAPTER2, TIMELINE, chapters } from "./scene/story";
import { setSnapGlide, topFor } from "./ui/storyScroll";
import { smoothWheel } from "./ui/smoothScroll";
import { createFocusLoader, type FocusLoader } from "./intro/focusLoader";


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
/* v128: преломление в стеклянных плашках (только Chromium с мышью).
   v138: «Смотреть кейсы» — тёмная капсула с кромкой жидкого металла и светом под курсором (свой WebGL-холст).
   v140: оба стояли здесь, в самом начале, и первыми будили видеокарту — до заставки и до страницы кейса по прямой
   ссылке. Теперь запускаются там, где нужны: перед сборкой холма (порядок прежний — кнопка меняет поля, а раскладка
   первого экрана мерится после неё) */
function heroFx() {
  initGlassLens();
  initLiquidButton();
}

/* v24: лёгкая версия без 3D — нет WebGL2, программный рендер, ?lite=1 или устройство уже оказалось
   слишком медленным (нагрузочный прогон: SwiftShader 0.2 fps, без WebGL — исключение и пустой экран) */
const lite = liteSaved(params);
/* v102: лёгкая версия — отдельная страница lite.html (src/liteLab). Здесь в лёгком режиме остаётся только страница
   кейса по прямой ссылке: она та же, что в 3D-версии. Закрыли кейс — уходим на lite.html */
const isCaseLink = () => location.hash.startsWith("#/work/");
function toLitePage() {
  const url = new URL("lite.html", location.href);
  const lang = params.get("lang");
  if (lang) url.searchParams.set("lang", lang);
  location.replace(url.href);
}
if (lite && !isCaseLink()) toLitePage();
else if (lite) { heroFx(); startLite(lite); }
/* v69: открыли прямой ссылкой на кейс — страница кейса собирается первой, холм поднимается после неё */
else if (isCaseLink()) startCaseFirst();
else bootHill();

/* v95: заставка «Расфокус» (src/intro/focusLoader.ts): сам холм в мягком фокусе и графите за именем, «Enter»
   возвращает резкость и цвет. Прежний «живой сад» стал отдельным демо (github.com/kloserock97-tech/overgrowth).
   Один раз за сессию; ?intro=1 — всегда, ?intro=0 — никогда, ?ui=0 и ?cam= — тоже без заставки. */
function wantsIntro() {
  const introParam = params.get("intro");
  let seen = false;
  try { seen = sessionStorage.getItem("hill-intro") === "1"; } catch { /* приватный режим */ }
  return !isCaseLink() && (introParam === "1" || (introParam !== "0" && !seen && params.get("ui") !== "0" && !fixedCamera()));
}
function fixedCamera() {
  const cam = params.get("cam")?.split(",").map(Number);
  return cam?.length === 6 && cam.every(Number.isFinite) ? (cam as HillSceneOptions["fixedCamera"]) : undefined;
}

/* v140: заставка — в первом же кадре. Раньше она создавалась и тут же, в том же куске скрипта, собирался холм
   (посадка травы, модели, шейдеры): браузер не мог нарисовать ничего, пока кусок не кончится, и человек 2,4 с на
   ноутбуке и 6 с на телефоне смотрел в пустой светлый экран, после чего тот резко темнел. Теперь заставка успевает
   нарисоваться, и только потом начинается сборка: тёмный экран и кнопка лёгкой версии — сразу.
   Обработчики заставки привязываются позже, когда сцена есть; до этого «Лёгкая версия» просто уводит на lite.html */
type IntroBoot = { intro: FocusLoader; hooks: { done: () => void; lite: () => void } };
function bootHill() {
  /* v140: модели начинают распаковываться до сборки сцены (scene/models.ts) — и с заставкой, и без неё */
  const models = startModels();
  if (!wantsIntro()) {
    if (liteProbe(params)) return toLitePage();
    void models.kicked.then(() => { heroFx(); boot3d(); });
    return;
  }
  let left = false;
  const hooks: IntroBoot["hooks"] = { done: () => {}, lite: () => { left = true; rememberLite(); toLitePage(); } };
  const intro = createFocusLoader(() => hooks.done(), () => hooks.lite());
  let ran = false;
  const run = () => {
    if (ran || left) return;
    ran = true;
    /* проверка WebGL — первое обращение к видеокарте, уже под заставкой; не прошла — лёгкая страница, как и раньше */
    if (liteProbe(params)) { intro.dispose(); return toLitePage(); }
    void models.kicked.then(() => {
      if (left) return;
      heroFx();
      boot3d(undefined, { intro, hooks });
    });
  };
  /* кадр нарисован, когда управление получила следующая задача после rAF; скрытая вкладка кадров не рисует — не ждём */
  requestAnimationFrame(() => setTimeout(run, 0));
  setTimeout(run, 250);
}

function boot3d(caseView?: CaseView, introBoot?: IntroBoot) {
  try {
    start3d(caseView, introBoot);
  } catch (e) {
    console.warn("3D не запустилось — лёгкая версия", e);
    if (!isCaseLink()) return toLitePage();
    startLite("error");
  }
}

/* Ссылка в отклике ведёт не на главную, а на конкретный кейс, и у смотрящего полторы минуты на всё портфолио.
   Страница кейса — обычный HTML с картинками, ей 3D не нужно, но раньше она ждала, пока поднимется сцена:
   на среднем ноутбуке заголовок кейса появлялся через 17 секунд вместо двух. Теперь сцена стартует после того,
   как страница кейса оказалась на экране, — в первом же простое, чтобы не мешать чтению.
   Порог держит tools/case-entry-test.mjs. */
/* v96: шрифты, которых нет на первом экране (Caveat, Playfair, Oswald — fonts-late.css), подключаются, когда холм
   готов; на прямой ссылке в кейс и в лёгкой версии — сразу */
function lateFonts() { void import("./ui/fonts-late.css"); } // объявление функцией: зовётся из startCaseFirst/startLite раньше этой строки

function startCaseFirst() {
  lateFonts();
  const view = initCaseView({ onToggle: pauseForCase });
  let booted = false;
  /* v140: и здесь модели уходят в распаковку до сборки сцены — но стартуют только теперь, а не вместе со страницей
     кейса: её картинкам сеть нужнее */
  const boot = () => {
    if (booted) return;
    booted = true;
    /* проверка WebGL — первое обращение к видеокарте (на только что открытой вкладке ~0,5 с ожидания): раньше она
       шла до страницы кейса, теперь под ней. Не прошла — под кейсом собирается лёгкая страница, как и прежде */
    const why = liteProbe(params);
    if (why) { heroFx(); return startLite(why, view); }
    void startModels().kicked.then(() => { heroFx(); boot3d(view); });
  };
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

function startLite(reason: string, caseView?: CaseView) {
  lateFonts();
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
  if (!caseView) initCaseView();
  initLangToggle();
  ui.ready();
  /* кейс закрыли (адрес без #/work/ и страница кейса убрана) — возвращаемся на лёгкую страницу */
  new MutationObserver(() => { if (!isCaseLink() && !body.classList.contains("case-open")) toLitePage(); }).observe(body, { attributes: true, attributeFilter: ["class"] });
}

function start3d(caseView?: CaseView, introBoot?: IntroBoot) {
  const opts: HillSceneOptions = {};
  const cam = fixedCamera();
  if (cam) opts.fixedCamera = cam;
  if (params.get("ui") === "0") body.classList.add("no-ui");

  /* заставка уже на экране (bootHill); здесь ей достаются настоящие обработчики */
  const intro = introBoot?.intro ?? null;
  if (introBoot) {
    introBoot.hooks.done = () => {
      try { sessionStorage.setItem("hill-intro", "1"); } catch { /* private mode */ }
      scene.paused = body.classList.contains("case-open");
      ui.ready();
    };
    introBoot.hooks.lite = () => degrade("stall");
  }

  const canvas = document.getElementById("scene") as HTMLCanvasElement;
  let scene: HillScene;
  try { scene = new HillScene(canvas, opts); }
  catch (error) { intro?.dispose(); throw error; }
  scene3d = scene;
  intro?.bind((v) => { scene.post.intro = v; });

  /* Погода: клик по «Weather» в углу перебирает ясно → облака → дождь → сумерки */
  const weatherLabel = (k: typeof scene.weatherKind) => t(`weather.${k}` as "weather.clear");
  const weatherStat = document.querySelector<HTMLElement>("[data-action='weather']");
  const weatherText = document.querySelector("[data-stat='wind']");
  /* v139: html[data-sky] — по нему текст первого экрана меняет тон вместе с небом (ui/hero/sky-tone.css) */
  const showWeather = () => {
    if (weatherText) weatherText.textContent = weatherLabel(scene.weatherKind);
    document.documentElement.dataset.sky = scene.weatherKind;
  };
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
  initMobileCopy(scene);
  initCases(scene);
  /* v103: указатель кейса на лугу; без 3D (лёгкая версия) или с ?signpost=0 — прежняя карточка */
  if (scene.signpost && !document.body.classList.contains("lite")) initCasesSignpost((i) => scene.setSignCase(i));
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
  /* v136: третья цифра «N кейсов» убрана с первого экрана (Никита 02.11) */

  /* Порядок показа: сцена сразу в финальной позе (без отъезда камеры) — как только
     откалибровалось качество, канвас мягко проявляется целиком; через мгновение за
     ним входят надписи, док и карточки. Пока канвас скрыт, замер не мешает CSS. */
  // Real readiness milestones drive the loader; no simulated download percentage.
  const introPoll = intro ? window.setInterval(() => intro.progress(scene.loadingProgress), 160) : 0;

  /* v140: разовые тяжёлые дела (lib/chores.ts) — когда модели приехали и видеокарта собирает их шейдеры */
  const chores = scene.propsReady.then(runChores);

  let started = false;
  const start = () => {
    if (started || body.classList.contains("lite")) return;
    started = true;
    body.classList.add("scene-ready");
    clearInterval(introPoll);
    if (intro) {
      // The loading screen shows the hill itself behind the name, so the scene keeps running.
      /* v140: вуаль тает, только когда очередь дел загрузки пуста — иначе они попадают в проявление холма рывком */
      /* и только после прогрева скролл-истории (он идёт кадром позже готовности); без компьютера прогрева нет — не ждём */
      Promise.all([scene.presentationReady, chores])
        .then(() => Promise.race([scene.storyWarmed, new Promise((r) => setTimeout(r, 800))]))
        .then(() => {
          if (body.classList.contains("lite")) return;
          intro.ready();
        });
    } else setTimeout(() => ui.ready(), 280);
  };
  scene.sceneReady.then(start);
  scene.presentationReady.then(lateFonts);
  setTimeout(start, 6000);

  /* v24: WebGL-контекст пропал и не вернулся, или за 14 с не нарисовано ни кадра — переходим в лёгкую версию, не
     оставляя человека перед замёрзшим холстом. v104: «медленно» больше не повод — качество не подстраивается, а лёгкую
     версию человек выбирает сам (кнопка на заставке и в навигации) */
  const degrade = (why: "context" | "stall") => {
    if (body.classList.contains("lite")) return;
    if (why !== "context") rememberLite();
    /* кейс не открыт — уходим на лёгкую страницу; открыт — дочитывают его здесь, в лёгком режиме */
    if (!isCaseLink() && !body.classList.contains("case-open")) return toLitePage();
    clearInterval(introPoll);
    intro?.dispose();
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
  /* v96: «Назад на холм» и подсказка у экрана скрыты прозрачностью и ловили Tab первыми на странице */
  const hud = document.querySelector<HTMLElement>(".pc-hud");
  if (hud) hud.inert = true;
  const openPc = () => {
    if (scene.computerFocused || body.classList.contains("lite")) return;
    workMenu?.close();
    scene.setComputerFocus(true);
    if (!scene.computerFocused) return; // компьютер в скролл-истории — не у стола
    pcAnim();
    cue("open");
    body.classList.add("pc-focus");
    body.classList.remove("pc-hover");
    if (hud) hud.inert = false;
    document.querySelector<HTMLElement>(".pc-back")?.focus({ preventScroll: true });
  };
  function closePc() {
    if (!scene.computerFocused) return;
    body.classList.remove("pc-button");
    scene.setComputerFocus(false);
    cue("close");
    pcAnim();
    body.classList.remove("pc-focus");
    if (hud) hud.inert = true;
  }
  scene.onComputerHover = (hover) => body.classList.toggle("pc-hover", hover);
  /* v94: подсказки первого экрана — погода, ветер, компьютер (точка на мониторе тоже открывает его) */
  initHeroHints(scene, openPc);
  window.addEventListener("pointermove", (e) => {
    if (tip) tip.style.transform = `translate(${e.clientX + 18}px, ${e.clientY + 14}px)`;
  }, { passive: true });
  window.addEventListener("click", (e) => {
    if (scene.computerFocused || body.classList.contains("lite")) return;
    if ((e.target as Element).closest("a, button, .card, .dock, .cta-wrap, .hero-stats, .wind")) return;
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
  /* v111: у «Пэт-проектов» тоже выпадающий список; кнопка внизу — к главе пэт-проектов */
  initLabMenu({
    onAll: () => {
      if (body.classList.contains("lite")) return document.querySelector("#notes")?.scrollIntoView({ behavior: "smooth" });
      closePc();
      story?.toNotes();
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
  initMobileNav();
  initSoundButton();
  document.querySelector(".pc-back")?.addEventListener("click", closePc);
  window.addEventListener("wheel", (e) => {
    if (!scene.computerFocused) return;
    e.preventDefault();
    scene.scrollScreen(e.deltaY * (e.deltaMode === 1 ? 36 : e.deltaMode === 2 ? 600 : 1) * 1.1);
  }, { passive: false });
  /* v115: колесо как у igloo — после обработчика компьютера, чтобы тот первым забирал колесо у экрана ПК */
  const wheel = initStoryWheel(() => {
    const b = body.classList;
    return isLite() || b.contains("case-open") || b.contains("m-menu-open") || b.contains("work-open") || b.contains("lab-open") || scene.computerFocused;
  });
  setSnapGlide(wheel.glide);
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
  /* v78: кнопки «Обо мне / Проекты / Контакты» на первом экране монитора — наведение и клик */
  let screenDown: { x: number; y: number } | null = null;
  window.addEventListener("pointermove", (e) => {
    if (!scene.computerFocused || e.pointerType !== "mouse") return;
    body.classList.toggle("pc-button", scene.hoverScreen(e.clientX, e.clientY));
  }, { passive: true });
  window.addEventListener("pointerdown", (e) => { screenDown = scene.computerFocused ? { x: e.clientX, y: e.clientY } : null; });
  window.addEventListener("click", (e) => {
    const d = screenDown;
    screenDown = null;
    if (!d || !scene.computerFocused || (e.target as Element).closest("a, button")) return;
    /* палец тянул страницу — это прокрутка, а не нажатие */
    if (Math.hypot(e.clientX - d.x, e.clientY - d.y) > 8) return;
    if (scene.clickScreen(e.clientX, e.clientY)) cue("press");
  });
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
        const s = scene as unknown as { qualityTier: number; pixelRatio: number; blades: number };
        box.textContent = `tier ${s.qualityTier}  dpr ${s.pixelRatio.toFixed(2)} / screen ${devicePixelRatio}\nfps ${Math.round((frames * 1000) / (now - last))}  blades ${s.blades}`;
        frames = 0; last = now;
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
}
