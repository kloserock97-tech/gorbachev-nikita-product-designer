import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { fbm, heightAt, makeRng, normalAt } from "./terrain";
import { loadHdri } from "./hdri";
import { createPostFx, type PostFx } from "./postfx";
import { PortfolioScreen } from "./portfolioScreen";
import { Dog } from "./dog";
import { Weather, type WeatherKind } from "./weather";
import { CASES, FOOTER, MEADOW_OUT, STORY, STORY_FX, TRANSITION, aberrationAt, bell, casesCamera, chapters, flightPose, footerCamera, portalAt, ramp, storyCamera, zoomBlur, type Pose } from "./story";
import type { Meadow } from "./meadow/Meadow";
import { SCROLL_LAMBDA } from "../scrollFeel";
import { KINETIC_BASE, KINETIC_FONT, createKinetic, type Kinetic } from "./kinetic";
import { Studio, projectBox, type HillLights } from "./studio";
import { createPolaroid } from "./polaroid";
import { createVista } from "./vista";
import { createMountains } from "./mountains";
import { createTree } from "./tree";
import { createRocks, rockFootprints } from "./rocks";
import {
  TRAIL_SLOTS,
  plantFragment,
  plantVertex,
  wispFragment,
  wispVertex,
  grassFragment,
  grassVertex,
  groundFragment,
  groundVertex,
  pollenFragment,
  pollenVertex,
  skyFragment,
  skyVertex,
} from "./shaders";

const BASE = import.meta.env.BASE_URL;

/* реквизит: стул смотрит чуть влево; footprint — [cx, cz, rx, rz] в его локальных координатах */
const PROPS_YAW = -0.42;
const FOOTPRINTS: [number, number, number, number][] = [
  [0.0, 0.0, 0.42, 0.46],
  [0.62, 0.0, 0.24, 0.24],
];

/* Солнце низко за холмом справа: оно даёт контровой свет на гребне и лучи.
   v68: кадр развернулся влево, и солнце ушло за правую кромку — веера лучей не стало вовсе
   (ореол в маске до кадра не доставал). Азимут довёрнут влево ровно настолько, чтобы солнце
   снова село за плечо холма в кадре, правее кресла: оттуда лучи ложатся вниз-налево, к кнопке.
   ⚠️ меняли SUN_DIR — перезапустить node tools/bake-hdri.mjs (SH неба запечены под него).
   Тени реквизита кладёт другой, «небесный» ключ повыше — от низкого солнца
   тень кресла тянулась бы на пять метров к камере. */
/* v81: пятна заземления (shaders.ts, groundOcc) — валуны, кресло и столик: [x, z, радиус, сила] в мире; ?occ=0 — без них */
function groundOccluders() {
  const c = Math.cos(PROPS_YAW), s = Math.sin(PROPS_YAW);
  const noRocks = /[?&]rocks=0/.test(location.search);
  /* v96: пятна плотнее и чуть уже (0.6/0.5/0.4 → 0.7/0.7/0.55, радиус реквизита ×0.9): кресло и столик «висели» над травой */
  const rocks = rockFootprints().map((r) => new THREE.Vector4(r.x, r.z, Math.max(r.rx, r.rz) * 1.05, noRocks ? 0 : 0.7));
  const props = FOOTPRINTS.map(([x, z, rx, rz], i) => new THREE.Vector4(x * c + z * s, -x * s + z * c, Math.max(rx, rz) * 0.9, i === 0 ? 0.7 : 0.55));
  const all = [...rocks, ...props];
  while (all.length < 6) all.push(new THREE.Vector4());
  return all.slice(0, 6);
}

const SUN_DIR = new THREE.Vector3(-0.08, 0.04, -1).normalize();
const SUN_GOLD = new THREE.Color(2.4, 1.2, 0.4);
const SHADOW_DIR = new THREE.Vector3(0.25, 1.0, -0.55).normalize();

/* v10: камера на 1.8 м дальше (было z 10.8) — ближняя трава мельче и спокойнее */
const CAMERA_BASE = new THREE.Vector3(0, 1.92, 12.6);
/* v68: композиция по золотому сечению вместо центральной. Камера отведена вправо и развёрнута влево:
   масса холма уходит в правую треть кадра, гребень идёт диагональю вниз-налево и выводит взгляд
   к кнопке «Смотреть кейсы» в левой колонке, за ним открывается дальний левый склон. Кресло с
   компьютером встаёт примерно на правую вертикаль золотого сечения (0.618 ширины), небо над
   склоном — свободное поле под заголовок. Солнце остаётся за правой кромкой кадра: холм и кресло
   получают контровой свет, а лучи ложатся веером вниз-налево, туда же, куда ведёт гребень.
   CAMERA_PIVOT — прежняя точка взгляда: от неё считается отъезд камеры на вертикальном экране. */
const CAMERA_PIVOT = new THREE.Vector3(0, 2.62, 0);
/* x разворота на широком экране: смещение камеры вправо и точки взгляда влево (см. panK ниже) */
const CAMERA_PAN = new THREE.Vector2(3.0, -2.0);
const CAMERA_REST_OFF = new THREE.Vector3(3.0, -0.3, 0.8);
const CAMERA_TARGET = new THREE.Vector3(-2.0, 3.2, 0);
/* v102 (кадр по скриншоту Никиты 21.10): поза покоя первого экрана отодвинута назад и чуть вверх — ровно на первый
   отрезок пути камеры при прокрутке (0.7, 0.53, 2.0). Дерево мельче, за ним видно солнце и дальние холмы.
   ?pull=k — подобрать долю отъезда (0 — прежний кадр) */
const HERO_PULL = Number(new URLSearchParams(location.search).get("pull") ?? 1);
const HERO_PULL_DIR = new THREE.Vector3(0.7, 0.53, 2.0);
const HERO_PULL_OFF = new THREE.Vector3();
const SHADOW_LAYER = 3;
/* v72: ближние предметы — над ними лучи приглушаются (маска в postfx.ts) */
const SHIELD_LAYER = 6;
/* слой компьютера в скролл-истории: рисуется отдельным проходом поверх заливки */
const PC_LAYER = 5;

type TrailPoint = { pos: THREE.Vector3; s: number };

export type HillSceneOptions = {
  /* ?cam=px,py,pz,tx,ty,tz — зафиксировать камеру (для рендера картинок карточек) */
  fixedCamera?: [number, number, number, number, number, number];
};


export class HillScene {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(30, 1, 0.1, 400);
  private timer = new THREE.Timer();
  private fx: PostFx;
  private raf = 0;
  private disposed = false;
  private reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  private camDistance = 1;
  private screen?: PortfolioScreen;
  private weather!: Weather;
  private dog?: Dog;
  /* один загрузчик на кресло, компьютер и собаку: все три GLB сжаты Draco, декодер
     берётся из three (DRACOLoader сам ссылается на свои файлы) и грузится один раз */
  /* v96: декодер лежит в public/draco (wasm + обёртка из three) и грузится сразу, а не после прихода props.glb:
     цепочка «модель → декодер → вторая модель» стоила ~1,2 с до кресла. Заодно сборка перестала тащить три лишних
     файла Draco (~1 МБ) через import.meta.url */
  private draco = new DRACOLoader().setDecoderPath(`${BASE}draco/`).setDecoderConfig({ type: "wasm" }).preload();
  private gltfLoader = new GLTFLoader().setDRACOLoader(this.draco);
  private dpr = 1;
  private qualityScale = 1;

  private uniforms = {
    uTime: { value: 0 },
    uWind: { value: this.reduced ? 0.25 : 1 },
    /* v96, ?next=1: фронты порывов по лугу (shaders.ts, gustFront); при reduced motion их нет */
    uFront: { value: !/[?&]next=0/.test(location.search) && !this.reduced ? 1 : 0 },
    uWindDir: { value: new THREE.Vector2(0.86, 0.5).normalize() },
    uTrail: { value: Array.from({ length: TRAIL_SLOTS }, () => new THREE.Vector4(0, 0, 0, 0)) },
    uPushR: { value: 0.55 },
    uTrailOn: { value: 0 },
    uPixelWorld: { value: 0.001 },
    uCoverageMax: { value: Number(new URLSearchParams(location.search).get("cov") ?? 1.6) },
    uMinPixels: { value: Number(new URLSearchParams(location.search).get("minpx") ?? 0.9) },
    uSunDir: { value: SUN_DIR.clone() },
    uSunCol: { value: new THREE.Color(2.4, 1.55, 0.85) },
    uSH: { value: Array.from({ length: 9 }, () => new THREE.Vector3(0.3, 0.32, 0.34)) },
    uAmbient: { value: 1.0 },
    /* v107 (пример Никиты 22.10): дымка, небо и солнце без персикового налёта — небо сверху холодное серо-голубое, к
       горизонту золотое, дымка светлая нейтральная, свет солнца жёлтый, а не красно-оранжевый */
    uFogCol: { value: new THREE.Color("#e8dcc0") },
    uShadowMap: { value: null as THREE.Texture | null },
    uShadowMatrix: { value: new THREE.Matrix4() },
    uShadowTexel: { value: 1 / 1024 },
    uShadowOn: { value: 0 },
    uBackLight: { value: /[?&]back=0/.test(location.search) ? 0 : 1 },
    /* v80: свет травы как в Unreal (shaders.ts, uGrassLook). Подбор по адресу: ?gtr=просвет&gsky=небо&gao=корни */
    uGrassLook: { value: new THREE.Vector4(...(["gtr", "gsky", "gao"] as const).map((k, i) => { const v = new URLSearchParams(location.search).get(k); return v === null ? [1.4, 0.92, 0.5][i] : Number(v); }).concat(0) as [number, number, number, number]) },
    uHaze: { value: /[?&]haze=0/.test(location.search) ? 0 : 1 },
    /* v80: дымка теплее к солнцу и прохладнее в стороне (shaders.ts, fogTint); ?aerial=0 — прежняя ровная */
    uSkyHorizon: { value: new THREE.Color("#f2c98a") },
    uAerial: { value: /[?&]aerial=0/.test(location.search) ? new THREE.Vector2(0, 0) : new THREE.Vector2(0.5, 1) },
    /* v72: насколько дальше обычного стоит камера (телефон) — на столько же отодвигается дымка */
    uFogShift: { value: 0 },
    /* v72: во сколько раз шире травинки, когда их меньше (ступени качества) — покрытие дёрна то же */
    uWiden: { value: 1 },
    /* v72: ступень без MSAA — цветы и метёлки режут форму альфа-тестом (plantFragment) */
    uNoMsaa: { value: 0 },
    /* волна интро: радиус от кресла, сила, полуширина кольца */
    uWave: { value: new THREE.Vector3(0, 0, 1) },
    /* собака: точка на земле и видимость; направление корпуса — для тени-эллипса */
    uDog: { value: new THREE.Vector4(0, 0, 0, 0) },
    uDogDir: { value: new THREE.Vector2(0, 1) },
    /* тени облаков (сдвиг xy, покрытие z) и мокрая трава — ведёт src/scene/weather.ts */
    uCloud: { value: new THREE.Vector3(0, 0, 0) },
    uWet: { value: 0 },
    uOcc: { value: groundOccluders() },
    /* v81: просвет листвы дерева (shaders.ts, leafFragment); подбор ?ltr= */
    uLeafTrans: { value: Number(new URLSearchParams(location.search).get("ltr") ?? 2.5) },
    uOccOn: { value: /[?&]occ=0/.test(location.search) ? 0 : 1 },
  };

  /* курсор: «голова» догоняет точку на холме, следы остаются позади и гаснут */
  private ndc = new THREE.Vector2(10, 10);
  private pointerSmooth = new THREE.Vector2();
  private pointer = new THREE.Vector2();
  private raycaster = new THREE.Raycaster();
  private hit = new THREE.Vector3();
  private rayP = new THREE.Vector3();
  private head: TrailPoint = { pos: new THREE.Vector3(), s: 0 };
  private headLive = false;
  private trail: TrailPoint[] = Array.from({ length: TRAIL_SLOTS - 1 }, () => ({ pos: new THREE.Vector3(), s: 0 }));
  private trailCursor = 0;
  private lastDrop = new THREE.Vector3(1e6, 0, 0);


  private pollen?: THREE.Points;
  /* размер частиц в пикселях буфера сцены — растёт вместе с его DPR */
  private pollenScale(dpr: number) {
    if (this.pollen) (this.pollen.material as THREE.ShaderMaterial).uniforms.uScale.value = 40 * dpr;
    this.weather?.setPixelRatio(dpr);
  }
  private pollenHead = 0;
  private pollenLast = new THREE.Vector3(1e6, 0, 0);
  private readonly POLLEN_N = 700;
  private readonly POLLEN_LIFE = 2.6;

  private bladeTotal = 0;

  constructor(private canvas: HTMLCanvasElement, private opts: HillSceneOptions = {}) {
    /* на холст рисуется только финальный полноэкранный проход — буфер глубины и трафарета ему не нужны */
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false, depth: false, stencil: false, powerPreference: "high-performance" });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    /* Neutral (Khronos PBR Neutral) держит цвета неба как задуманы, ACES их гасил в серое */
    this.renderer.toneMapping = THREE.NeutralToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    /* реквизит неподвижен: карта теней перерисовывается только после загрузки и пока летит
       компьютер, а не каждый кадр */
    this.renderer.shadowMap.autoUpdate = false;
    this.timer.connect(document);

    this.fx = createPostFx(this.renderer, this.scene, this.camera, SUN_DIR, PC_LAYER, SHIELD_LAYER);
    this.fx.params.onOverlay = this.onPcOverlay;
    this.focusBase = this.fx.params.focus;

    /* кадрирование до посадки травы: зона и плотность зависят от того, где стоит камера */
    this.resize();
    this.buildSky();
    this.buildVista();
    this.buildTree();
    if (!/[?&]rocks=0/.test(location.search)) this.scene.add(createRocks(this.uniforms));
    this.buildGround();
    this.buildGrass();
    this.buildPollen();
    this.buildWisps();
    this.buildLights();
    /* Кресло, компьютер и собака — стандартные материалы, airFog из шейдеров травы до них не
       доходил. Линейный туман того же цвета на их дистанции (~12 м) даёт те же 3–4 %.
       ShaderMaterial его не видят (fog: false), так что трава и небо не затуманятся дважды. */
    this.scene.fog = new THREE.Fog(this.uniforms.uFogCol.value, 10, 60);
    this.weather = new Weather({
      scene: this.scene,
      uniforms: this.uniforms,
      sky: this.sky.uniforms as never,
      fx: this.fx,
      lights: () => this.lights,
      flowers: () => this.meadow.drifts,
      reduced: this.reduced,
    });
    this.weather.setPixelRatio(this.dpr);
    this.loadProps();
    this.loadEnvironment();
    if (!/[?&]dog=0/.test(location.search)) {
      this.dog = new Dog(this.uniforms, this.reduced);
      this.scene.add(this.dog.group);
      void this.dog.load(this.gltfLoader).then(() => this.compileLate(this.dog!.group));
    }

    window.addEventListener("resize", this.onWindowResize);
    window.addEventListener("pointermove", this.onPointer, { passive: true });
    window.addEventListener("pointerdown", this.onPointer, { passive: true });
    document.documentElement.addEventListener("pointerleave", this.onLeave);
    window.addEventListener("blur", this.onLeave);
    this.pinTier();
    this.observer = new IntersectionObserver(([e]) => (this.onScreen = e?.isIntersecting ?? true));
    this.observer.observe(canvas);
    /* Потеря WebGL-контекста (телефон выгрузил вкладку, сбой драйвера): после восстановления
       пропали бы запечённая тень реквизита, отражения и все текстуры-холсты. Сцена целиком
       строится при загрузке, поэтому надёжнее перезагрузить страницу, чем чинить по частям. */
    canvas.addEventListener("webglcontextlost", this.onContextLost);
    canvas.addEventListener("webglcontextrestored", this.onContextRestored);
    this.precompile();
    this.loop();
  }

  /* v24: шейдеры холма и постобработки собираются параллельно (KHR_parallel_shader_compile) до первого
     кадра. Раньше первый кадр компилировал ~40 программ синхронно: главный поток стоял 2,4 с на мощном ПК,
     11 с на ноутбуке со слабым CPU (нагрузочный прогон tools/load-test.mjs). Пока компилируется — не рисуем */
  private shadersReady = false;
  readonly loadLog: string[] = [];
  /* Кресло, компьютер и собака приезжают позже: их стандартные материалы компилируются тоже параллельно и
     только когда уже есть окружение HDRI (от него зависит ключ программы — иначе кресло собиралось дважды).
     Пока такие компиляции идут, кадр не рисуется — холст к этому времени ещё скрыт калибровкой */
  private pendingCompile = 0;
  private resolveEnv!: () => void;
  private envReady = new Promise<void>((r) => (this.resolveEnv = r));
  private compileLate(obj: THREE.Object3D) {
    this.pendingCompile++;
    const t0 = performance.now();
    Promise.race([this.envReady, new Promise((r) => setTimeout(r, 4000))])
      .then(() => {
        const prev = this.renderer.getRenderTarget();
        this.renderer.setRenderTarget(this.fx.compileTarget);
        const p = this.renderer.compileAsync(obj, this.camera, this.scene);
        this.renderer.setRenderTarget(prev);
        return p;
      })
      .catch(() => {})
      .finally(() => {
        this.pendingCompile--;
        this.loadLog.push(`${obj.name || obj.type} ${Math.round(performance.now() - t0)} ms`);
      });
  }
  private precompile() {
    const t0 = performance.now();
    const prev = this.renderer.getRenderTarget();
    this.renderer.setRenderTarget(this.fx.compileTarget);
    const scene = this.renderer.compileAsync(this.scene, this.camera);
    this.renderer.setRenderTarget(prev);
    Promise.all([scene, this.fx.compileAsync()])
      .catch(() => {})
      .then(() => {
        this.shadersReady = true;
        this.loadLog.push(`shaders ${Math.round(performance.now() - t0)} ms`);
      });
  }

  /** следующая погода по кругу: ясно → облака → дождь → сумерки */
  cycleWeather(): WeatherKind {
    return this.weather.next();
  }
  get weatherKind(): WeatherKind {
    return this.weather.kind;
  }
  /** сила ветра с порывом (uWind) — для звука травы */
  get windNow() {
    return this.uniforms.uWind.value;
  }

  get blades() {
    return this.bladeTotal;
  }

  /** Readiness of setup phases, not transferred byte percentage. */
  get loadingProgress() {
    return .08 + Math.min(this.assetsReady, 2) * .21 + (this.shadersReady ? .22 : 0)
      + (this.pendingCompile === 0 ? .08 : 0) + (this.settled ? .14 : 0);
  }

  /* ---------------------------- интро --------------------------------- */

  private propBox: THREE.Box3 | null = null;
  private resolveProps!: () => void;
  /* кресло, столик и компьютер загружены */
  readonly propsReady = new Promise<void>((r) => (this.resolveProps = r));

  /* параметры финального прохода (грейд, глитч) — интро их анимирует */
  get post() {
    return this.fx.params;
  }

  /* границы реквизита в мире (или прикидка до загрузки) */
  get propBounds() {
    if (this.propBox) return this.propBox;
    const y = heightAt(0, 0);
    return new THREE.Box3(new THREE.Vector3(-0.5, y, -0.5), new THREE.Vector3(1.0, y + 1.0, 0.5));
  }



  /* точка мира → координаты в окне (CSS px); z > 1 — за камерой */
  worldToClient(v: THREE.Vector3) {
    const p = v.clone().project(this.camera);
    const r = this.canvas.getBoundingClientRect();
    return { x: r.left + (p.x * 0.5 + 0.5) * r.width, y: r.top + (-p.y * 0.5 + 0.5) * r.height, behind: p.z > 1 };
  }

  /* ------------------------------------------------------------------ */

  /* v96: эффекты пакета 5 — порыв-фронт, туман в низинах, дыхание камеры, блик кинескопа, облака в сменяемой погоде.
     Включены (выбор Никиты 20.10); ?next=0 — прежний вид для сравнения */
  private readonly next = !/[?&]next=0/.test(location.search);
  private sky!: THREE.ShaderMaterial;

  private buildSky() {
    this.sky = new THREE.ShaderMaterial({
      vertexShader: skyVertex,
      fragmentShader: skyFragment,
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: {
        uZenith: { value: new THREE.Color("#9eb0bf") },
        uHigh: { value: new THREE.Color("#bcc6c8") },
        uMid: { value: new THREE.Color("#efe1bf") },
        uHorizon: this.uniforms.uSkyHorizon,
        uGlow: { value: new THREE.Color("#ffb956") },
        uSunDir: this.uniforms.uSunDir,
        uSunCol: { value: new THREE.Color(1.6, 1.15, 0.7) },
        uSunDisc: { value: 6 },
        /* v80: широкое свечение неба вокруг солнца (shaders.ts, skyMie); ?mie=0 — без него */
        uMie: { value: /[?&]mie=0/.test(location.search) ? 0 : 0.8 },
        /* v96, ?next=1: облака в небе (shaders.ts, skyClouds) — тот же сдвиг и покрытие, что у теней облаков на траве */
        uCloud: this.uniforms.uCloud,
        /* облака — только в сменяемой погоде (облака, дождь, сумерки), в ясную на первом экране их нет (Никита 20.10);
           долю пишет кадр из погоды (cloudShare) */
        uClouds: { value: 0 },
        uCloudLook: { value: new THREE.Vector4(...((new URLSearchParams(location.search).get("cl") ?? "1.6,-0.04,1.4,1").split(",").map(Number) as [number, number, number, number])) },
      },
    });
    const sky = new THREE.Mesh(new THREE.SphereGeometry(300, 48, 24), this.sky);
    /* небо — последним из непрозрачного: z = w и тест глубины оставляют ему только пиксели,
       не закрытые травой и холмом (раньше оно заливало весь экран первым) */
    sky.renderOrder = 10;
    sky.frustumCulled = false;
    this.scene.add(sky);
  }

  /* v72: дальний план — гряды холмов с лесом за холмом (vista.ts); цвет неба и погода — общие с небом */
  private buildVista() {
    const u = this.sky.uniforms;
    this.scene.add(createVista({
      /* v96: uCloud и uMistDrift — плывущий туман в низинах между грядами (?next=1) */
      sky: { uZenith: u.uZenith, uHigh: u.uHigh, uMid: u.uMid, uHorizon: u.uHorizon, uGlow: u.uGlow, uSunDir: u.uSunDir, uSunCol: u.uSunCol, uMie: u.uMie, uCloud: this.uniforms.uCloud, uMistDrift: { value: this.next ? 1 : 0 } },
      sh: this.uniforms.uSH,
      ambient: this.uniforms.uAmbient,
      horizon: this.uniforms.uSkyHorizon,
    }));
    /* v102: за грядами — горы в той же дымке (mountains.ts). Рельеф запекается, когда сцена уже показана и браузер
       свободен: десяток октав шума на слабой видеокарте не должен задерживать первый кадр. ?mtn=off — без гор */
    if (!/[?&]mtn=off/.test(location.search)) {
      const m = createMountains(this.renderer, {
        sky: { uZenith: u.uZenith, uHigh: u.uHigh, uMid: u.uMid, uHorizon: u.uHorizon, uGlow: u.uGlow, uSunDir: u.uSunDir, uSunCol: u.uSunCol, uMie: u.uMie },
      });
      this.scene.add(m.mesh);
      const idle = (window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number }).requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 0));
      void this.envReady.then(() => idle(() => void m.bake(), { timeout: 3000 }));
    }
  }

  /* v72: дерево на правом плече холма (tree.ts). На широком экране — за креслом, чуть правее: крона над
     компьютером, ствол за столиком, солнце светит сквозь листву — кадр «кресло под деревом на холме». Правее
     стоит карточка проектов, и дальше по склону дерево ушло бы под неё. На вертикальном экране та же точка
     посадила бы крону под текст, поэтому дерево отходит правее и ниже по склону и уходит за правую кромку —
     обрамляет кадр. Между ними — плавно, по той же доле, что и разворот камеры (placeTree). ?tree=0 — без него */
  private tree?: ReturnType<typeof createTree>;
  private buildTree() {
    if (/[?&]tree=0/.test(location.search)) return;
    this.tree = createTree(this.uniforms, { base: new THREE.Vector3(), height: 5.6, lean: new THREE.Vector3(-0.2, 0, 0.1), msaa: true });
    this.scene.add(this.tree.group);
    this.placeTree();
  }
  private placeTree() {
    if (!this.tree) return;
    const k = Math.min(1, Math.max(0, (this.camera.aspect - 0.6) / 0.7));
    const x = 2.8 + (0.95 - 2.8) * k, z = -5.2 + (-2.7 + 5.2) * k;
    this.tree.place(x, heightAt(x, z) - 0.05, z, 0.85 - 0.07 * k);
  }

  private buildGround() {
    const size = 44, seg = 260;
    const geo = new THREE.PlaneGeometry(size, size, seg, seg);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) pos.setY(i, heightAt(pos.getX(i), pos.getZ(i)) - 0.01);
    geo.computeVertexNormals();
    const ground = new THREE.Mesh(geo, new THREE.ShaderMaterial({ vertexShader: groundVertex, fragmentShader: groundFragment, uniforms: this.uniforms }));
    /* земля после травы: её пять шумов на пиксель считаются только в просветах дёрна */
    ground.renderOrder = 1;
    this.scene.add(ground);
  }

  private bladeCount() {
    const q = /[?&]blades=(\d+)/.exec(location.search);
    if (q) return +q[1];
    const small = Math.min(window.innerWidth, window.innerHeight) < 700 || window.innerWidth * window.innerHeight < 700_000;
    /* v7: травинки длиннее и шире к дали — прежнее покрытие даёт меньшее число */
    /* v8: широкие дальние травинки (покрытие + ≥0.9 px) дают тот же дёрн меньшим числом */
    /* v9: после отсечения невидимой травы все травинки в кадре. Замер на Intel,
       DPR 1.5 + MSAA 4×: 150k — 17 мс, 240k — 19.6, 320k — 48 (обрыв по памяти) */
    /* v108: телефон — 130k (было 110k): камера там вдвое дальше, и склона в кадре больше */
    return small ? 130_000 : 220_000;
  }

  private footprintWorld() {
    const c = Math.cos(PROPS_YAW), s = Math.sin(PROPS_YAW);
    return FOOTPRINTS.map(([x, z, rx, rz]) => ({ x: x * c + z * s, z: -x * s + z * c, rx, rz }));
  }

  private restPos = new THREE.Vector3();
  /* без выделения памяти: вызывается каждый кадр; кому нужна копия — клонирует */
  private cameraRest() {
    return this.restPos.lerpVectors(CAMERA_PIVOT, CAMERA_BASE, this.camDistance).add(CAMERA_REST_OFF).add(HERO_PULL_OFF);
  }

  /* Всё посаженное (трава, цветы, пампасы, колоски) — одной группой: посадка зависит от позы
     камеры, и при её заметной смене луг пересаживается целиком */
  private meadowGroup = new THREE.Group();
  private plantedFor = { dist: 0, aspect: 0, pan: -1 };
  private replantTimer = 0;

  private rebuildMeadow() {
    this.meadowGroup.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
    });
    this.scene.remove(this.meadowGroup);
    this.meadowGroup = new THREE.Group();
    this.stalkSpots = [];
    this.buildGrass();
    this.setTier(this.tier, "replant");
  }

  private buildGrass() {
    /* посадка под текущую позу: отложенная пересадка под неё же больше не нужна */
    clearTimeout(this.replantTimer);
    this.scene.add(this.meadowGroup);
    this.plantedFor = { dist: this.camDistance, aspect: this.camera.aspect, pan: Math.min(1, Math.max(0, (this.camera.aspect - 0.6) / 0.7)) };
    const rng = makeRng();
    const count = this.bladeCount();
    const cam = this.opts.fixedCamera ? new THREE.Vector3(...this.opts.fixedCamera.slice(0, 3)) : this.cameraRest().clone();
    /* отсечение при посадке: травинка вне кадра или за гребнем не создаётся вовсе */
    const visible = this.opts.fixedCamera ? () => true : this.makeVisibilityTest();
    const feet = this.footprintWorld();
    const rocks = rockFootprints();
    this.meadow = this.planMeadow(feet);

    /* два LOD, как в Ghost of Tsushima: рядом с камерами — травинка в 7 вершин,
       дальше — один треугольник (3 вершины); на расстоянии разницы не видно */
    const LOD_NEAR = 5.5;
    const near = { off: [] as number[], nrm: [] as number[], rnd: [] as number[], clump: [] as number[], lean: [] as number[] };
    const far = { off: [] as number[], nrm: [] as number[], rnd: [] as number[], clump: [] as number[], lean: [] as number[] };
    const n = { x: 0, y: 1, z: 0 };
    const clump = { cx: 0, cz: 0, id: 0, dist: 0 };

    /* Трава сажается по области, которую видит камера: передний склон и гребень.
       Плотность падает с расстоянием, чтобы у камеры не было проплешин, а
       дальние склоны не жгли сотни тысяч невидимых травинок. */
    const X0 = -15, X1 = 15, Z0 = -2.4, Z1 = Math.max(6, cam.z + 0.5);
    /* v108 (Никита: «холм лысый»): на вертикальном экране камера в 26 м от вершины (на широком — 15), травинка 9–18 см
       выходит штрихом в ~5 px, и между ними видна земля — у гребня торчали редкие волоски на гладком склоне. Там
       травинки длиннее в 1,6 раза: склон закрыт травой, кромка холма травяная. ?mlen= — подобрать */
    const lenK = this.lenScale * (this.camera.aspect < 1 ? Number(new URLSearchParams(location.search).get("mlen") ?? 1.6) : 1);
    let k = 0, guard = 0;
    while (k < count && guard < count * 25) {
      guard++;
      let x = X0 + (X1 - X0) * rng();
      let z = Z0 + (Z1 - Z0) * rng();
      /* v96: точная высота (пять октав шума) считалась для каждого кандидата, а отбрасывается их большинство — 0,65 с
         главного потока. Сначала расстояние по гладкому куполу: кочки меняют высоту не больше чем на BUMP, поэтому
         по нему можно наверняка отбросить кандидата и наверняка пройти проверку «не у самой камеры». Случайные числа
         берутся в том же порядке, что и раньше, — луг тот же до бита */
      const nearCut = this.opts.fixedCamera ? 0.05 : 1.2;
      const da = Math.hypot(x - cam.x, domeAt(x, z) - cam.y, z - cam.z);
      if (da < nearCut - BUMP) continue;
      let r = -1;
      if (da > nearCut + BUMP) {
        r = rng();
        if (r > Math.min(1, Math.pow(5.2 / Math.max(da - BUMP, 1e-3), 1.8))) continue;
      }
      const h0 = heightAt(x, z);
      const d0 = Math.hypot(x - cam.x, h0 - cam.y, z - cam.z);
      if (d0 < nearCut) continue;
      /* Плотность ∝ ~1/d²: так на экран приходится примерно одинаково травинок
         на пиксель по всей глубине. Раньше до 8.5 м плотность на метр была
         постоянной, и низ кадра (ближняя трава) получал меньше травинок на
         экранную площадь, чем даль — отсюда просветы дёрна внизу. */
      const density = Math.min(1, Math.pow(5.2 / d0, 1.8));
      /* прогалины — только лёгкие разрежения, без проплешин до земли */
      /* v44: посадка — 0,5 с главного потока на загрузке. Случайное число берём до шума прогалин: bare ≤ 1, поэтому
         при r > density кандидат отброшен при любом шуме, и три октавы fbm для него не считаем (дальние кандидаты
         отсеиваются почти все). Высота для проверки видимости — уже посчитанная. Порядок rng() и результат те же. */
      if (r < 0) r = rng();
      if (r > density) continue;
      const patch = fbm(x * 0.55 + 7.3, z * 0.55 - 2.1, 3);
      const bare = 0.72 + 0.28 * smooth(0.28, 0.52, patch);
      if (r > density * bare) continue;
      if (!visible(x, h0, z, 0.2)) continue;

      /* Кочки по Вороному (GoT): травинка знает свою ячейку, подтягивается
         к её центру и клонится к нему; рост и тон — общие на ячейку.
         Между кочками остаются просветы — луг перестаёт быть ковром. */
      /* мягко: на сильной подтяжке кочки складывались в заметные ряды */
      voronoiCell(x, z, 0.2, clump);
      const pull = 0.07 * hash01(clump.id, 3);
      x += (clump.cx - x) * pull;
      z += (clump.cz - z) * pull;
      const y = heightAt(x, z);

      const L = Math.hypot(x - cam.x, y - cam.y, z - cam.z) < LOD_NEAR ? near : far;
      normalAt(x, z, n);
      L.off.push(x, y, z);
      L.nrm.push(n.x, n.y, n.z);

      /* Трава 9–18 см (была 5–10): мелкая трава — это детали мельче пикселя,
         экран их не показывает, а рябит; крупнее форма — спокойнее и реалистичнее */
      let len = (0.09 + 0.09 * rng()) * lenK * (0.75 + 0.5 * fbm(x * 1.2 - 5.0, z * 1.2 + 9.0, 2)) * (0.88 + 0.26 * hash01(clump.id, 1));
      if (rng() < 0.06) len *= 1.6; // редкие длинные травинки ломают ровный «газон»
      /* колоски — «дополнения» к траве, как цветы и пампасы у GoT: редко и не у самой камеры */
      if (rng() < 0.0075 && d0 < 16 && d0 > 1.8) this.stalkSpots.push(x, y, z);
      for (const f of feet) {
        const e = Math.hypot((x - f.x) / f.rx, (z - f.z) / f.rz);
        if (e < 1) len *= 0.45 + 0.55 * smooth(0.55, 1.0, e);
      }
      /* v72: под валуном травы нет, по его краю она растёт вплотную — камень утоплен в траву, а не лежит на ней */
      for (const f of rocks) {
        const e = Math.hypot((x - f.x) / f.rx, (z - f.z) / f.rz);
        if (e < 1.1) len *= 0.05 + 0.95 * smooth(0.8, 1.1, e);
      }

      L.rnd.push(rng() * Math.PI * 2, len, 0, rng());
      const tone = fbm(x * 0.9 + 17.0, z * 0.9 - 3.0, 3) * 0.6 + fbm(x * 5.5 - 3.3, z * 5.5 + 2.1, 2) * 0.4;
      L.clump.push(Math.min(1, tone * 0.88 + hash01(clump.id, 2) * 0.14));
      /* наклон к центру кочки: сильнее у края ячейки + небольшой разброс */
      const toC = Math.hypot(clump.cx - x, clump.cz - z) || 1;
      const lean = (0.05 + 0.16 * smooth(0.02, 0.14, clump.dist)) * (0.5 + 0.5 * hash01(clump.id, 4));
      L.lean.push(((clump.cx - x) / toC) * lean + (rng() - 0.5) * 0.36, ((clump.cz - z) / toC) * lean + (rng() - 0.5) * 0.36);
      k++;
    }
    this.bladeTotal = k;

    /* alphaToCoverage: мягкие края травинок через сэмплы MSAA (?a2c=0 — выключить) */
    const a2c = !/[?&]a2c=0/.test(location.search);
    const material = new THREE.ShaderMaterial({
      vertexShader: grassVertex,
      fragmentShader: grassFragment,
      uniforms: { ...this.uniforms, uA2C: { value: a2c ? 1 : 0 } },
      side: THREE.DoubleSide,
      alphaToCoverage: a2c,
    });
    this.grassMaterial = material;
    this.grassGeos = [];
    for (const [L, geo] of [[near, bladeGeometry()], [far, bladeGeometryFar()]] as const) {
      const m = L.off.length / 3;
      if (!m) continue;
      geo.setAttribute("aOffset", new THREE.InstancedBufferAttribute(new Float32Array(L.off), 3));
      geo.setAttribute("aNormal", new THREE.InstancedBufferAttribute(new Float32Array(L.nrm), 3));
      geo.setAttribute("aRnd", new THREE.InstancedBufferAttribute(new Float32Array(L.rnd), 4));
      geo.setAttribute("aClump", new THREE.InstancedBufferAttribute(new Float32Array(L.clump), 1));
      geo.setAttribute("aLean", new THREE.InstancedBufferAttribute(new Float32Array(L.lean), 2));
      geo.instanceCount = m;
      geo.userData.total = m;
      const mesh = new THREE.Mesh(geo, material);
      mesh.frustumCulled = false;
      this.meadowGroup.add(mesh);
      this.grassGeos.push(geo);
    }
    this.bladeSplit = { near: near.off.length / 3, far: far.off.length / 3 };
    this.buildFlowers();
    this.buildPampas();
    this.buildStalks();
  }
  private stalkSpots: number[] = [];
  private readonly lenScale = Number(new URLSearchParams(location.search).get("len") ?? 1);

  /* Колоски: высокий стебель 25–40 см и узкий колос семян. Тот же шейдер, что у
     клевера (части 4 — стебель, 3 — колос), своя высота раскачки. */
  private buildStalks() {
    const n = this.stalkSpots.length / 3;
    if (!n) return;
    const rng = makeRng(0x57a1c);
    const plant: number[] = [];
    for (let i = 0; i < n; i++) plant.push(rng() * Math.PI * 2, 0.75 + rng() * 0.55, rng(), rng());
    const geo = stalkGeometry();
    geo.setAttribute("aOffset", new THREE.InstancedBufferAttribute(new Float32Array(this.stalkSpots), 3));
    geo.setAttribute("aPlant", new THREE.InstancedBufferAttribute(new Float32Array(plant), 4));
    geo.instanceCount = n;
    const mat = new THREE.ShaderMaterial({
      vertexShader: plantVertex,
      fragmentShader: plantFragment,
      uniforms: { ...this.uniforms, uPlantHeight: { value: 0.34 } },
      side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.frustumCulled = false;
    this.meadowGroup.add(mesh);
    this.stalkCount = n;
    this.stalkGeo = geo;
  }
  stalkCount = 0;
  private stalkGeo?: THREE.InstancedBufferGeometry;
  private grassGeos: THREE.InstancedBufferGeometry[] = [];
  private grassMaterial!: THREE.ShaderMaterial;
  bladeSplit = { near: 0, far: 0 };

  /* ---------------- луг: цветы и пампасная трава ---------------- */

  /* Проверка видимости для посадки: проекция кончика в кадр камеры (с запасом
     на параллакс и более широкий экран) и отсечение гребнем — луч от камеры
     к кончику проходит под куполом холма. Высота купола — без мелких кочек,
     поэтому запас 0.2 м: лучше посадить лишнюю травинку, чем проплешину. */
  private makeVisibilityTest() {
    const rest = this.cameraRest().clone();
    const cam = new THREE.PerspectiveCamera(30 * 1.18, Math.max(this.camera.aspect, 16 / 9) * 1.2, 0.1, 400);
    cam.position.copy(rest);
    cam.lookAt(CAMERA_TARGET);
    cam.updateMatrixWorld();
    cam.updateProjectionMatrix();
    const v = new THREE.Vector3();
    return (x: number, y: number, z: number, h: number) => {
      v.set(x, y + h, z).project(cam);
      if (v.z > 1 || v.x < -1.08 || v.x > 1.08 || v.y > 1.08 || v.y < -1.15) return false;
      const dx = x - rest.x, dy = y + h - rest.y, dz = z - rest.z;
      for (let k = 2; k < 10; k++) {
        const t = k / 10;
        if (domeAt(rest.x + dx * t, rest.z + dz * t) - 0.2 > rest.y + dy * t) return false;
      }
      return true;
    };
  }

  private meadow: { drifts: { x: number; z: number; r: number; color: THREE.Color }[]; pampas: { x: number; z: number; r: number }[] } = { drifts: [], pampas: [] };

  /* Цветы растут дрейфами одного вида, как в поле; пампасы — кустами по бокам
     и за гребнем, в контровом свете, не перекрывая кресло */
  private planMeadow(feet: { x: number; z: number; rx: number; rz: number }[]) {
    const rng = makeRng(0xf10e7);
    const palette = [
      new THREE.Color(0.80, 0.78, 0.70), // тысячелистник, ромашка
      new THREE.Color(0.78, 0.56, 0.08), // лютик
      new THREE.Color(0.44, 0.22, 0.50), // василёк луговой
      new THREE.Color(0.80, 0.42, 0.52), // клевер красный, гвоздика
      new THREE.Color(0.28, 0.36, 0.78), // василёк синий
    ];
    const weights = [0.34, 0.26, 0.16, 0.14, 0.1];
    const drifts: { x: number; z: number; r: number; color: THREE.Color }[] = [];
    let guard = 0;
    while (drifts.length < 38 && guard++ < 800) {
      const x = (rng() - 0.5) * 16, z = -1 + rng() * 9;
      if (heightAt(x, z) < 0.5) continue;
      if (feet.some((f) => Math.hypot(x - f.x, z - f.z) < 0.9)) continue;
      let u = rng(), k = 0;
      while (k < weights.length - 1 && u > weights[k]) { u -= weights[k]; k++; }
      drifts.push({ x, z, r: 0.25 + rng() * 0.6, color: palette[k] });
    }
    const pampas = [
      { x: -4.3, z: 1.3, r: 0.42 }, { x: -5.9, z: 3.4, r: 0.5 }, { x: 4.7, z: 0.9, r: 0.45 },
      { x: 6.2, z: 3.0, r: 0.5 }, { x: -2.7, z: -1.3, r: 0.38 }, { x: 3.1, z: -1.7, r: 0.4 }, { x: -7.4, z: 5.6, r: 0.55 },
    ];
    return { drifts, pampas };
  }

  private buildFlowers() {
    const rng = makeRng(0xf1a0);
    const off: number[] = [], plant: number[] = [], color: number[] = [];
    const visible = this.opts.fixedCamera ? () => true : this.makeVisibilityTest();
    for (const d of this.meadow.drifts) {
      /* прорежено: плотные дрейфы читались ковром из точек */
      const n = Math.round(d.r * d.r * 140 * (0.5 + rng() * 0.8));
      for (let i = 0; i < n; i++) {
        const a = rng() * Math.PI * 2, rr = Math.sqrt(rng()) * d.r;
        const x = d.x + Math.cos(a) * rr, z = d.z + Math.sin(a) * rr;
        const y = heightAt(x, z);
        if (!visible(x, y, z, 0.25)) continue;
        off.push(x, y - 0.004, z);
        plant.push(rng() * Math.PI * 2, 0.6 + rng() * 0.75, rng(), rng());
        const v = 0.85 + rng() * 0.3;
        color.push(d.color.r * v, d.color.g * v, d.color.b * v);
      }
    }
    if (!off.length) return;
    const geo = flowerGeometry();
    geo.setAttribute("aOffset", new THREE.InstancedBufferAttribute(new Float32Array(off), 3));
    geo.setAttribute("aPlant", new THREE.InstancedBufferAttribute(new Float32Array(plant), 4));
    geo.setAttribute("aColor", new THREE.InstancedBufferAttribute(new Float32Array(color), 3));
    geo.instanceCount = off.length / 3;
    this.addPlantMesh(geo, 0.24);
    this.flowerCount = off.length / 3;
  }
  flowerCount = 0;

  private buildPampas() {
    const rng = makeRng(0xba5a);
    const leaf = { off: [] as number[], nrm: [] as number[], rnd: [] as number[], clump: [] as number[], lean: [] as number[] };
    const plumeOff: number[] = [], plume: number[] = [];
    for (const c of this.meadow.pampas) {
      const y0 = heightAt(c.x, c.z);
      /* листья: длинные узкие дуги из центра куста наружу */
      for (let i = 0; i < 70; i++) {
        const a = rng() * Math.PI * 2, rr = rng() * c.r * 0.35;
        const x = c.x + Math.cos(a) * rr, z = c.z + Math.sin(a) * rr;
        leaf.off.push(x, heightAt(x, z), z);
        leaf.nrm.push(0, 1, 0);
        leaf.rnd.push(rng() * Math.PI * 2, 0.32 + rng() * 0.3, 0.13 + rng() * 0.06, rng());
        leaf.clump.push(0.45 + rng() * 0.3);
        const out = 0.55 + rng() * 0.35;
        leaf.lean.push(Math.cos(a) * out, Math.sin(a) * out);
      }
      /* метёлки: 6–9 стеблей по колено, ниже сиденья кресла на переднем плане */
      const m = 6 + Math.floor(rng() * 4);
      for (let i = 0; i < m; i++) {
        const a = rng() * Math.PI * 2, rr = rng() * c.r * 0.25;
        plumeOff.push(c.x + Math.cos(a) * rr, y0 - 0.02, c.z + Math.sin(a) * rr);
        plume.push(rng() * Math.PI * 2, 0.7 + rng() * 0.36, rng(), rng());
      }
    }
    const lg = bladeGeometry();
    lg.setAttribute("aOffset", new THREE.InstancedBufferAttribute(new Float32Array(leaf.off), 3));
    lg.setAttribute("aNormal", new THREE.InstancedBufferAttribute(new Float32Array(leaf.nrm), 3));
    lg.setAttribute("aRnd", new THREE.InstancedBufferAttribute(new Float32Array(leaf.rnd), 4));
    lg.setAttribute("aClump", new THREE.InstancedBufferAttribute(new Float32Array(leaf.clump), 1));
    lg.setAttribute("aLean", new THREE.InstancedBufferAttribute(new Float32Array(leaf.lean), 2));
    lg.instanceCount = leaf.off.length / 3;
    const leaves = new THREE.Mesh(lg, this.grassMaterial);
    leaves.frustumCulled = false;
    this.meadowGroup.add(leaves);

    const pg = pampasGeometry();
    pg.setAttribute("aOffset", new THREE.InstancedBufferAttribute(new Float32Array(plumeOff), 3));
    pg.setAttribute("aPlant", new THREE.InstancedBufferAttribute(new Float32Array(plume), 4));
    pg.instanceCount = plumeOff.length / 3;
    this.addPlantMesh(pg, 0.8);
  }

  private addPlantMesh(geo: THREE.InstancedBufferGeometry, height: number) {
    const mat = new THREE.ShaderMaterial({
      vertexShader: plantVertex,
      fragmentShader: plantFragment,
      uniforms: { ...this.uniforms, uPlantHeight: { value: height } },
      side: THREE.DoubleSide,
      alphaToCoverage: true,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.frustumCulled = false;
    this.meadowGroup.add(mesh);
  }  /* ---------------- атмосфера ---------------- */


  /* Струи ветра: 12 тонких лент над травой, каждая раз в несколько секунд
     пролетает по склону по ветру. Видны едва-едва — как дрожание воздуха. */
  private buildWisps() {
    if (/[?&]wind=0/.test(location.search) || this.reduced) return;
    const SEG = 28, N = 12;
    const pos: number[] = [], idx: number[] = [];
    for (let i = 0; i <= SEG; i++) {
      pos.push(i / SEG, -1, 0, i / SEG, 1, 0);
      if (i < SEG) {
        const a = i * 2;
        idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
      }
    }
    const geo = new THREE.InstancedBufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    geo.setIndex(idx);
    const rng = makeRng(0x3a1d);
    const start: number[] = [], param: number[] = [];
    const wd = this.uniforms.uWindDir.value;
    for (let i = 0; i < N; i++) {
      /* старт — с наветренной стороны видимого склона */
      /* только передний склон и низко над травой — у гребня струя висела бы на фоне неба */
      const acrossX = (rng() - 0.5) * 12, acrossZ = 1.5 + rng() * 6;
      start.push(acrossX - wd.x * 5, 0.08 + rng() * 0.22, acrossZ - wd.y * 5, rng() * 20);
      param.push(5 + rng() * 4, 2.5 + rng() * 2.5, rng());
    }
    geo.setAttribute("aStart", new THREE.InstancedBufferAttribute(new Float32Array(start), 4));
    geo.setAttribute("aParam", new THREE.InstancedBufferAttribute(new Float32Array(param), 3));
    geo.instanceCount = N;
    const mat = new THREE.ShaderMaterial({
      vertexShader: wispVertex,
      fragmentShader: wispFragment,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      uniforms: {
        uTime: this.uniforms.uTime,
        uWindDir: this.uniforms.uWindDir,
        uColor: { value: new THREE.Color(1.2, 1.1, 0.9) },
        uOpacity: { value: 0.09 },
      },
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.frustumCulled = false;
    mesh.renderOrder = 4;
    this.scene.add(mesh);
  }

  /* Семена и пух, которые ветер несёт над лугом без участия курсора */
  private seedTimer = 0;
  /* v96: флаги адреса — один раз, а не регулярным выражением в каждом кадре */
  private readonly windOff = /[?&]wind=0/.test(location.search);
  private driftSeeds(dt: number) {
    if (this.reduced || this.windOff) return;
    this.seedTimer += dt * (0.6 + this.uniforms.uWind.value * 0.8);
    const wd = this.uniforms.uWindDir.value;
    while (this.seedTimer > 0.12) {
      this.seedTimer -= 0.12;
      const x = (Math.random() - 0.5) * 12, z = -1 + Math.random() * 8;
      const p = new THREE.Vector3(x, heightAt(x, z) + 0.05 + Math.random() * 0.5, z);
      this.spawnPollen(p, 0.6, new THREE.Vector3(wd.x * (0.5 + Math.random() * 0.5), 0.04, wd.y * (0.5 + Math.random() * 0.5)));
    }
  }
  private pollenAttr!: { pos: Float32Array; vel: Float32Array; birth: Float32Array; rnd: Float32Array };

  private buildPollen() {
    const N = this.POLLEN_N;
    const pos = new Float32Array(N * 3), vel = new Float32Array(N * 3), birth = new Float32Array(N).fill(-999), rnd = new Float32Array(N * 2);
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("aVel", new THREE.BufferAttribute(vel, 3));
    g.setAttribute("aBirth", new THREE.BufferAttribute(birth, 1));
    g.setAttribute("aRnd", new THREE.BufferAttribute(rnd, 2));
    this.pollenAttr = { pos, vel, birth, rnd };
    this.pollen = new THREE.Points(
      g,
      new THREE.ShaderMaterial({
        vertexShader: pollenVertex,
        fragmentShader: pollenFragment,
        transparent: true,
        depthWrite: false,
        uniforms: {
          uTime: this.uniforms.uTime,
          uLife: { value: this.POLLEN_LIFE },
          uScale: { value: 40 },
          uColor: { value: new THREE.Color(1.6, 1.35, 0.8) },
        },
      }),
    );
    this.pollen.frustumCulled = false;
    this.pollenScale(this.dpr);
    this.pollen.renderOrder = 5;
    this.scene.add(this.pollen);
  }

  private spawnPollen(p: THREE.Vector3, boost = 1, drift?: THREE.Vector3) {
    const i = this.pollenHead;
    this.pollenHead = (this.pollenHead + 1) % this.POLLEN_N;
    const { pos, vel, birth, rnd } = this.pollenAttr;
    const r = Math.random;
    pos[i * 3] = p.x + (r() - 0.5) * 0.25 * boost;
    pos[i * 3 + 1] = p.y + 0.04 + r() * 0.08;
    pos[i * 3 + 2] = p.z + (r() - 0.5) * 0.25 * boost;
    if (drift) {
      /* семя на ветру: почти без разброса, летит по потоку */
      vel[i * 3] = drift.x + (r() - 0.5) * 0.08;
      vel[i * 3 + 1] = drift.y + (r() - 0.5) * 0.05;
      vel[i * 3 + 2] = drift.z + (r() - 0.5) * 0.08;
    } else {
      vel[i * 3] = (r() - 0.5) * 0.35 * boost + this.uniforms.uWindDir.value.x * 0.15;
      vel[i * 3 + 1] = (0.05 + r() * 0.3) * boost;
      vel[i * 3 + 2] = (r() - 0.5) * 0.35 * boost + this.uniforms.uWindDir.value.y * 0.15;
    }
    birth[i] = this.uniforms.uTime.value;
    rnd[i * 2] = 0.5 + r() * 0.8;
    rnd[i * 2 + 1] = r();
    const a = this.pollen!.geometry.attributes;
    a.position.needsUpdate = a.aVel.needsUpdate = a.aBirth.needsUpdate = a.aRnd.needsUpdate = true;
  }

  /* клик по доку в UI: горсть пыльцы из точки на холме под курсором (или у кресла) */
  burstAt(clientX: number, clientY: number) {
    if (this.reduced) return;
    const r = this.canvas.getBoundingClientRect();
    const saved = this.ndc.clone();
    this.ndc.set(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
    const p = this.pickHill() ? this.hit.clone() : new THREE.Vector3(0, heightAt(0, 0) + 0.3, 0.4);
    this.ndc.copy(saved);
    for (let i = 0; i < 60; i++) this.spawnPollen(p, 2.2);
  }

  /* кнопка play: по лугу проходит сильный порыв */
  /* Порыв: быстрый набор за 0.9 с и долгое затухание — та же кривая, что была в Theatre */
  private gustStart = -1;
  private gustAmount(now: number) {
    if (this.gustStart < 0) return 0;
    const t = now - this.gustStart;
    if (t > 3.4) { this.gustStart = -1; return 0; }
    const easeOut = (x: number) => 1 - Math.pow(1 - x, 3);
    const easeInOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
    return t < 0.9 ? 1.7 * easeOut(t / 0.9) : 1.7 * (1 - easeInOut((t - 0.9) / 2.5));
  }

  gust() {
    if (this.reduced) return;
    this.gustStart = this.uniforms.uTime.value;
    this.weather.burst();
    for (let i = 0; i < 90; i++) {
      const x = (Math.random() - 0.5) * 8, z = Math.random() * 4;
      this.spawnPollen(new THREE.Vector3(x, heightAt(x, z), z), 1.5);
    }
  }

  private lights: HillLights | null = null;

  private buildLights() {
    const top = heightAt(0, 0);
    /* ключ для реквизита: мягкая тень кресла на себя */
    const key = new THREE.DirectionalLight(new THREE.Color(1.0, 0.88, 0.7), 2.1);
    key.position.copy(SHADOW_DIR).multiplyScalar(6).add(new THREE.Vector3(0, top, 0));
    key.target.position.set(0, top, 0);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.radius = 5;
    key.shadow.bias = -0.0004;
    key.shadow.normalBias = 0.01;
    Object.assign(key.shadow.camera, { left: -1.4, right: 1.4, top: 1.4, bottom: -1.4, near: 1, far: 14 });
    this.scene.add(key, key.target);
    /* v69: карта теней рисуется по флагу (autoUpdate = false), а флаг раньше вставал только после того,
       как приехал и разместился компьютер. Реквизит и собака попадают в сцену раньше, и в этом окне
       материал с receiveShadow рисовался, когда карты ещё нет: в слот sampler2DShadow привязывалась
       обычная текстура, драйвер отклонял вызов отрисовки (GL_INVALID_OPERATION, mismatch between texture
       format and sampler type). На быстрой машине это один кадр, при замедленном процессоре — десятки.
       Просим карту сразу: пустая, но настоящая глубинная текстура закрывает окно навсегда.
       Держит tools/gl-errors-test.mjs. */
    this.renderer.shadowMap.needsUpdate = true;
    /* контровой от низкого солнца — золотой кант по раме и подушкам */
    const rim = new THREE.DirectionalLight(new THREE.Color(1.0, 0.72, 0.42), 2.6);
    rim.position.copy(SUN_DIR).multiplyScalar(10).add(new THREE.Vector3(0, top, 0));
    rim.target.position.set(0, top, 0);
    this.scene.add(rim, rim.target);
    /* отражённый от травы зелёный снизу; до загрузки HDRI — и небо сверху.
       v14: снизу теплее и насыщеннее — днища подушек, корпус компьютера и грудь собаки
       подхватывают цвет луга, а не остаются серыми (отражённый свет, как в GoT) */
    const hemi = new THREE.HemisphereLight(0xdfe3dc, 0x52632a, 0.55);
    this.scene.add(hemi);
    /* свет и для слоя компьютера — его проход в скролл-истории рисует только этот слой */
    for (const l of [key, rim, hemi]) l.layers.enable(PC_LAYER);
    this.lights = { key, rim, hemi };
    this.studio = new Studio(this.scene, PC_LAYER);
  }
  /* студийный свет для компьютера на светлой странице — src/scene/studio.ts */
  private studio: Studio | null = null;
  private onPcOverlay = (before: boolean) => this.studio?.onOverlay(before, this.lights);


  private loadEnvironment() {
    loadHdri(this.renderer, `${BASE}hdri/sky-256.hdr`)
      .then((h) => {
        if (this.disposed) return;
        this.scene.environment = h.envMap;
        this.resolveEnv();
        this.assetsReady++;
        this.scene.environmentRotation.y = h.yaw;
        this.scene.environmentIntensity = 0.7;
        h.sh.coefficients.forEach((c, i) => this.uniforms.uSH.value[i].copy(c));
        /* v107: цвет солнца из HDRI почти красный (2,4 / 0,83 / 0,05) — луг и дымка уходили в персик. Свет жёлто-золотой */
        this.uniforms.uSunCol.value.copy(h.sunColor).multiplyScalar(2.4).lerp(SUN_GOLD, 0.65);
        this.weather.setLightBase(this.uniforms.uSunCol.value, 0.38);
        /* ?bg=hdri — посмотреть на саму HDRI вместо нарисованного неба */
        if (/[?&]bg=hdri/.test(location.search)) {
          this.scene.background = h.equirect;
          this.scene.backgroundRotation.y = h.yaw;
          this.sky.visible = false;
        } else {
          h.equirect.dispose();
        }
      })
      .catch((e) => {
        this.assetsReady++;
        console.warn("HDRI не загрузилась, остаётся запасной свет", e);
        this.resolveEnv();
      });
  }

  private loadProps() {
    this.gltfLoader.load(`${BASE}models/props.glb`, (gltf) => {
      if (this.disposed) return;
      const props = gltf.scene;
      props.rotation.y = PROPS_YAW;
      props.position.set(0, heightAt(0, 0) - 0.015, 0);
      props.traverse((o) => {
        const mesh = o as THREE.Mesh;
        if (!mesh.isMesh) return;
        mesh.castShadow = mesh.receiveShadow = true;
        mesh.layers.enable(SHADOW_LAYER);
        mesh.layers.enable(SHIELD_LAYER);
        const m = mesh.material as THREE.MeshStandardMaterial;
        this.sharpenMaps(m);
        if (m.isMeshStandardMaterial) {
          m.envMapIntensity = 1;
          /* белые подушки на солнце слепили — ткань не бывает альбедо 1 */
          if (m.map === null || m.color.getHSL({ h: 0, s: 0, l: 0 }).l > 0.8) m.color.multiplyScalar(0.86);
          /* голубое небо HDRI остужало ткань — возвращаем кремовый тон референса */
          if (m.name === "Cushion") m.color.multiply(new THREE.Color(1.16, 1.0, 0.78));
        }
      });
      this.scene.add(props);
      this.compileLate(props);
      /* сиденье ищем лучами в простое после загрузки: 49 лучей по креслу — ~0,06 с, на загрузке не нужно */
      const idle = (window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number }).requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 0));
      window.setTimeout(() => idle(() => this.placeDogBed(props), { timeout: 3000 }), /[?&]dog=sleep/.test(location.search) ? 0 : 3500);
      this.placeComputer(props).finally(() => {
        this.assetsReady++;
        this.renderer.shadowMap.needsUpdate = true;
        this.bakePropShadow(props);
        this.propBox = new THREE.Box3().setFromObject(props);
        this.resolveProps();
      });
    }, undefined, (error) => {
      /* v96: кресло не загрузилось (обрыв сети, 404) — холм без реквизита лучше вечной заставки: без этого
         assetsReady не доходил до 2, presentationReady не наступал и заставка не отпускала человека */
      if (this.disposed) return;
      console.warn("props.glb не загрузился, холм без реквизита", error);
      this.assetsReady++;
      this.resolveProps();
    });
  }

  /* v72: анизотропная фильтрация текстур реквизита. Камера смотрит на кресло снизу по склону, сиденье и
     столешница видны под острым углом, и без неё мип-уровень выбирается по худшему направлению: ткань
     подушек либо рябила, либо расплывалась в пятно. Восемь выборок — потолок, после которого разницы не видно */
  private sharpenMaps(m: THREE.Material) {
    const std = m as THREE.MeshStandardMaterial;
    if (!std.isMeshStandardMaterial) return;
    const n = Math.min(8, this.renderer.capabilities.getMaxAnisotropy());
    for (const t of [std.map, std.normalMap, std.roughnessMap, std.metalnessMap, std.aoMap]) if (t) t.anisotropy = n;
  }

  /* v24: сиденье кресла — постель для спящей Келли в футере. Лучи сверху по сетке над креслом
     (кресло в центре реквизита, столик сбоку за пределами сетки), берём попадания на высоте сиденья */
  private placeDogBed(props: THREE.Object3D) {
    props.updateMatrixWorld(true);
    const meshes: THREE.Object3D[] = [];
    props.traverse((o) => { if ((o as THREE.Mesh).isMesh) meshes.push(o); });
    const ground = props.position.y;
    const ray = new THREE.Raycaster();
    const down = new THREE.Vector3(0, -1, 0);
    const pts: THREE.Vector3[] = [];
    for (let i = -3; i <= 3; i++) for (let j = -3; j <= 3; j++) {
      ray.set(props.localToWorld(new THREE.Vector3(i * 0.085, 2, j * 0.085)), down);
      const hit = ray.intersectObjects(meshes, false)[0];
      const h = hit ? hit.point.y - ground : -1;
      if (h > 0.3 && h < 0.62) pts.push(hit!.point);
    }
    if (pts.length < 4) return;
    const seat = new THREE.Vector3();
    pts.forEach((p) => seat.add(p));
    seat.divideScalar(pts.length);
    seat.y = pts.map((p) => p.y).sort((a, b) => a - b)[pts.length >> 1];
    this.dog?.setBed(seat, this.cameraRest().clone());
  }

  /* Компьютер на столике: монитор, клавиатура и мышь из рабочего места
     «Участка Никиты» (кит в стиле Бруно). Чашка уезжает к краю столешницы.
     На экране — страницы портфолио с шейдером кинескопа, как в игре; пока без кликов. */
  private async placeComputer(props: THREE.Object3D) {
    props.updateMatrixWorld(true);
    /* v29: реквизит собран из моделей CC0 (tools/blender-build-props.py): столешница отмечена узлом TableTop
       в центре её верхней плоскости, кружка с блюдцем — узел Mug */
    const top = props.getObjectByName("TableTop");
    const cup = props.getObjectByName("Mug");
    if (!top) return;
    const local = props.worldToLocal(top.getWorldPosition(new THREE.Vector3()));
    /* ЭЛТ-монитор на системном блоке занимает почти всю столешницу Ø38 см — чашка уходит на передний левый край */
    if (cup) {
      cup.position.x = local.x - 0.12;
      cup.position.z = local.z + 0.12;
    }
    const gltf = await this.gltfLoader.loadAsync(`${BASE}models/computer.glb`).catch(() => null);
    if (!gltf || this.disposed) return;
    const pc = gltf.scene;
    pc.scale.setScalar(0.8);
    pc.position.set(local.x + 0.035, local.y + 0.001, local.z - 0.035);
    /* повёрнут к камере и чуть к креслу */
    pc.rotation.y = 0.3;
    const warmed = new Set<THREE.Material>();
    pc.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.castShadow = mesh.receiveShadow = true;
      /* слой запечённой тени травы не включаем: компьютер улетает со стола, и его тень
         осталась бы лежать на траве под столиком */
      /* бежевый пластик в тени против солнца и под голубым небом уходил в серый — греем */
      const mat = mesh.material as THREE.MeshStandardMaterial;
      this.sharpenMaps(mat);
      /* корпус с несколькими материалами GLTFLoader делит на меши case_1, case_2… с общими
         материалами — греем каждый материал один раз */
      if (mesh.name !== "screen" && mat.color && !warmed.has(mat)) {
        warmed.add(mat);
        mat.color.multiply(new THREE.Color(1.06, 1.0, 0.9));
        mat.envMapIntensity = 0.7;
      }
      mesh.layers.enable(SHIELD_LAYER);
      if (mesh.name === "screen") {
        this.screen ??= new PortfolioScreen();
        mesh.material = this.screen.material;
        mesh.castShadow = false;
        this.screenMesh = mesh;
      }
    });
    props.add(pc);
    this.compileLate(pc);
    this.pc = pc;
    /* скролл-история уносит компьютер со стола: держим его прямо в сцене с той же мировой позой */
    props.updateMatrixWorld(true);
    this.scene.attach(pc);
    const e = new THREE.Euler().setFromQuaternion(pc.quaternion, "YXZ");
    /* собственный габарит компьютера — для рамки видоискателя и контактной тени */
    const keep = { p: pc.position.clone(), q: pc.quaternion.clone(), s: pc.scale.clone() };
    pc.position.set(0, 0, 0);
    pc.quaternion.identity();
    pc.scale.set(1, 1, 1);
    pc.updateMatrixWorld(true);
    this.pcLocalBox.setFromObject(pc);
    this.placePolaroid(pc);
    pc.position.copy(keep.p);
    pc.quaternion.copy(keep.q);
    pc.scale.copy(keep.s);
    pc.updateMatrixWorld(true);
    this.pcRest = { pos: pc.position.clone(), yaw: e.y, pitch: e.x, roll: e.z };
  }

  /* v23: полароид Келли вместо красного стикера в правом верхнем углу рамки монитора.
     Компьютер здесь в собственных координатах (без позы и масштаба): угол экрана берётся из пластины
     экрана, передняя плоскость рамки — лучом по корпусу, чтобы карточка легла, а не висела в воздухе */
  private polaroid?: THREE.Mesh;
  private placePolaroid(pc: THREE.Object3D) {
    const screen = this.screenMesh;
    if (!screen) return;
    const sb = new THREE.Box3().setFromObject(screen);
    const w = (sb.max.x - sb.min.x) * 0.34;
    const x = sb.max.x - w * 0.04, y = sb.max.y - w * 0.08;
    const ray = new THREE.Raycaster(new THREE.Vector3(x, y, sb.max.z + 1), new THREE.Vector3(0, 0, -1), 0, 2);
    const hull: THREE.Object3D[] = [];
    pc.traverse((o) => { if ((o as THREE.Mesh).isMesh && o !== screen) hull.push(o); });
    const hit = ray.intersectObjects(hull, false)[0];
    /* стикер модели выпуклый — карточка на сантиметр перед рамкой, иначе его угол прорастает сквозь */
    const z = (hit ? hit.point.z : sb.max.z) + 0.022;
    const card = createPolaroid(`${BASE}ui/kelly.webp`, (t) => this.renderer.initTexture(t));
    card.scale.setScalar(w);
    card.position.set(x, y, z);
    card.rotation.z = -0.13;
    card.castShadow = false;
    card.receiveShadow = false;
    pc.add(card);
    this.polaroid = card;
  }
  private polaroidTmp = new THREE.Vector3();
  /** v85.3: верх кроны дерева по вертикали, px окна, при камере в покое — как на первом экране. По нему телефон
      ставит середину кнопки «Смотреть кейсы» (ui/hero/mobileCopy.ts). Считается по запросу (resize), не в кадре */
  treeTopClient(reach = 0.37): number | null {
    if (!this.tree) return null;
    const p = this.tree.crownTopWorld(new THREE.Vector3());
    /* видимая верхушка — между центром верхнего пучка и краем его карточек: над пучком торчат листья, но самые
       крайние тонут в дымке. 0,37 пути к верху рамки дерева — по замеру кадров на четырёх телефонах (±3 px) */
    const box = new THREE.Box3().setFromObject(this.tree.group);
    if (!box.isEmpty()) p.y += (box.max.y - p.y) * reach;
    const cam = this.camera.clone();
    cam.position.copy(this.cameraRest());
    cam.lookAt(CAMERA_TARGET);
    cam.updateMatrixWorld();
    p.project(cam);
    const c = this.canvasRect;
    return c.top + (-p.y * 0.5 + 0.5) * c.height;
  }
  /** голова спящей Келли в координатах окна — для «z z z» в футере */
  kellySleepPoint(): { x: number; y: number } | null {
    if (!this.dog?.isSleeping) return null;
    const h = this.dog.headWorld(this.polaroidTmp);
    if (!h) return null;
    h.project(this.camera);
    if (h.z > 1) return null;
    const c = this.canvasRect;
    return { x: c.left + (h.x * 0.5 + 0.5) * c.width, y: c.top + (-h.y * 0.5 + 0.5) * c.height };
  }
  /** верх полароида в координатах окна — для рукописной подписи «and this is Kelly» */
  kellyClientPoint(): { x: number; y: number; w: number } | null {
    const card = this.polaroid;
    if (!card || !this.pc?.visible) return null;
    card.updateMatrixWorld();
    const cam = this.storyCh1 > 0 ? this.overlayCam : this.camera;
    const top = this.polaroidTmp.set(0, 0.62, 0).applyMatrix4(card.matrixWorld).project(cam);
    const c = this.canvasRect;
    const x = c.left + (top.x * 0.5 + 0.5) * c.width, y = c.top + (-top.y * 0.5 + 0.5) * c.height;
    const side = this.polaroidTmp.set(0.5, 0.62, 0).applyMatrix4(card.matrixWorld).project(cam);
    const w = Math.abs(c.left + (side.x * 0.5 + 0.5) * c.width - x) * 2;
    return { x, y, w };
  }

  /* ───────────── скролл-история: компьютер взлетает и встаёт перед зрителем ───────────── */

  private pcRest?: Pose;
  private storyTarget = 0;
  private storyS = 0;
  private storyApplied = -1;
  private storyEnd: Pose = { pos: new THREE.Vector3(), yaw: 0, pitch: 0, roll: 0 };
  private storyPose: Pose = { pos: new THREE.Vector3(), yaw: 0, pitch: 0, roll: 0 };
  private coolWB = new THREE.Vector3(0.86, 0.95, 1.12);
  private static readonly OVERCAST_WB = new THREE.Vector3(1.0, 1.0, 0.97);
  /** вызывается каждый кадр со сглаженным прогрессом — для DOM-слоя */
  onStory?: (s: number) => void;

  /** прогресс скролла 0…1; сглаживание — внутри, как у Lenis/igloo */
  setStoryProgress(p: number) {
    this.storyTarget = Math.min(1, Math.max(0, p));
  }
  get storyProgress() {
    return this.storyS;
  }

  private updateStory(dt: number) {
    const target = this.focusOn ? 0 : this.storyTarget;
    /* The portal has a softer response, blended in/out with its chapter. Keep
       navigation jumps responsive and the reduced-motion fallback unchanged. */
    const footerProgress = chapters(this.storyS).f;
    /* v84: за порогом проёма (FOOTER.settle) отклик снова обычный — кадр футера доезжает сразу, а не тянется */
    const portalDamping = !this.reduced && this.walkReady && !this.walkOff && Math.abs(target - this.storyS) < 0.12
      ? THREE.MathUtils.smoothstep(footerProgress, 0, FOOTER.leave[1]) * (1 - THREE.MathUtils.smoothstep(footerProgress, ...FOOTER.settle))
      : 0;
    const scrollLambda = THREE.MathUtils.lerp(SCROLL_LAMBDA, 3.6, portalDamping);
    this.storyS += (target - this.storyS) * (1 - Math.exp(-dt * scrollLambda));
    if (Math.abs(target - this.storyS) < 1e-5) this.storyS = target;
    /* главы: s — холм → About, c — «Кейсы» (story.ts, CHAPTER) */
    const { s, c, f } = chapters(this.storyS);
    this.storyCh1 = s;
    this.storyCh2 = c;
    this.storyCh3 = f;
    this.onStory?.(this.storyS);
    const t = this.uniforms.uTime.value;
    const fx = this.fx.params;

    /* 1) камера отъезжает (как CameraRig igloo); в главе «Кейсы» — свой ракурс. Переход — склейкой
       под бумагой, пока страница About ещё закрывает кадр целиком */
    const rest = this.storyTmp.copy(this.cameraRest());
    storyCamera(s, rest, CAMERA_TARGET, this.storyCamPos, this.storyCamLook);
    if (c > 0) casesCamera(c, this.storyCamPos, this.storyCamLook);
    if (f > 0) footerCamera(f, this.cameraRest(), CAMERA_TARGET, this.storyCamPos, this.storyCamLook);
    /* футер: закат со светлячками; уходим из футера — возвращаем погоду, которую выбрал человек */
    if (f > FOOTER.dusk && !this.footerDusk) {
      this.footerDusk = true;
      this.weatherBeforeFooter = this.weather.kind;
      this.weather.set("dusk");
    } else if (f < FOOTER.dusk * 0.5 && this.footerDusk) {
      this.footerDusk = false;
      this.weather.set(this.weatherBeforeFooter);
    }

    /* глава «Кейсы»: страница уходит вверх рваным краем, сцена за ней размыта */
    const tu = ramp(c, ...CASES.tear);
    const tearK = tu * tu * (3 - 2 * tu);
    /* v74.2: край уходит от −0.12 до 1.5 — облачная кромка шириной в треть кадра должна целиком уйти за верх */
    this.storyTear = c > 0 ? -0.12 + tearK * 1.62 : -1;
    fx.tear = this.storyTear;
    /* v32: с лугом кадр под заставкой резкий, размытие — перед лентой (CASES.blur); без луга (?walk=0 или не успел
       собраться) холм размывается сразу, как раньше: резкий холм с MSAA на весь кадр стоит ~25 мс против ~4,5 */
    const walkOn = this.walkReady && !this.walkOff;
    const bu = walkOn ? ramp(c, ...CASES.blur) : ramp(c, 0, 0.04);
    const ub = ramp(f, ...FOOTER.unblur);
    fx.bgBlur = (this.reduced ? 0.7 : 1) * bu * bu * (3 - 2 * bu) * (1 - ub * ub * (3 - 2 * ub));
    /* v106 (Никита): на телефоне указатель кейса — главное на экране, а размытие луга под карточками мылило и его.
       На узком экране с указателем луг в «Кейсах» резкий; на широком всё как было */
    if (walkOn && this.signpost && this.camera.aspect < 0.8 && f <= 0) fx.bgBlur = 0;
    /* v25: под сильным размытием кейсов детали не видны — треть травинок и без лучей; переключение
       только когда размытие почти полное, чтобы смена густоты не читалась */
    const cheap = this.bgCheap ? fx.bgBlur > 0.6 : fx.bgBlur > 0.8;
    if (cheap !== this.bgCheap) {
      this.bgCheap = cheap;
      this.applyDensity();
    }
    /* v32: луг под оторванной страницей — переключение, пока бумага ещё закрывает кадр целиком;
       в футере под размытием смешивается обратно с холмом */
    this.ensureWalk();
    const wo = ramp(f, ...MEADOW_OUT);
    /* Из «Кейсов» в футер — через объёмный портал (meadow/MeadowPortal.ts): луг остаётся снаружи двери, пока камера
       не пройдёт сквозь неё. Цвет луга сменяется цветом холма по мере того, как дверь закрывает экран.
       Без луга (?walk=0) — прежнее смешивание под размытием */
    const pk = portalAt(f);
    const viaPortal = walkOn && !this.reduced && f > 0;
    const alt = c > 0 && this.walkReady
      ? viaPortal ? (pk < 0.999 ? Math.max(0.002, 1 - THREE.MathUtils.smoothstep(pk, 0.6, 0.95)) : 0) : 1 - wo * wo * (3 - 2 * wo)
      : 0;
    fx.alt = alt;
    /* луг ещё собирается, а человек уже в «Кейсах» — вместо размытого холма размытый кадр луга (index.html .walk-wait) */
    const waiting = c > 0.01 && f <= 0 && !this.walkReady && !this.walkOff;
    if (waiting !== this.walkWaiting) { this.walkWaiting = waiting; document.body.classList.toggle("walk-wait", waiting); }
    fx.portal = viaPortal ? pk : 0;
    this.walk?.setPortal(viaPortal ? pk : 0);
    // Establish the chair/hill inside the small opening, then settle into the
    // wider footer composition. Both position and framing meet the final view.
    if (viaPortal) {
      this.storyCamPos.copy(this.cameraRest());
      this.storyCamLook.copy(CAMERA_TARGET);
      const discover = 1 - THREE.MathUtils.smoothstep(pk, 0.28, 0.76);
      this.storyCamLook.x += (0.2 - CAMERA_TARGET.x) * discover;
      this.storyCamLook.y += (2.35 - CAMERA_TARGET.y) * discover;
    }
    if (viaPortal) fx.bgBlur = 0;
    /* v74.1: в «Кейсах» луг за стеклянной рамкой — в окне рамки он резкий (размыто только стекло вокруг,
       ui/cases-card.css). На телефоне остаётся размытым: резкий луг рисуется в полном разрешении каждый кадр,
       а размытый — в четверти и через кадр, и iPhone на этом теряет кадры */
    if (!this.phone) fx.bgBlur *= 1 - alt;
    if (alt > 0) {
      /* v73: пасмурный грейд по референсу (docs/prompts/v73-cases-grade.md): цвет приглушён, но не выбит в серое,
         контраст мягкий — его держат белые цветы против неба, виньетка лёгкая: центр чуть светлее краёв.
         Был тёмный грейд Meadow Walk — насыщенность −0.5, контраст 1.12, виньетка 0.85 — почти ночь */
      /* v73.1: тёмная лесная поляна (второй референс): зелень насыщенная и тёплая, контраст высокий,
         края кадра уходят в темноту леса */
      fx.vibrance += (0.12 - fx.vibrance) * alt;
      fx.contrast += (1.12 - fx.contrast) * alt;
      fx.vignette = this.vignetteBase + (0.7 - this.vignetteBase) * alt;
      fx.raysEnabled = false;
    } else if (fx.vignette !== this.vignetteBase) {
      fx.vignette = this.vignetteBase;
      this.applyDensity();
    }

    /* 2) холм выгружается: волна от кресла бежит по траве (v67: голубая сетка-голограмма поверх
       холма убрана — от неё кадр читался как чертёж, а не как переход) */
    const wu = ramp(s, ...STORY.wave);
    this.uniforms.uWave.value.set(0.2 + 18.8 * wu, this.reduced || wu <= 0 || wu >= 1 ? 0 : Math.sin(Math.PI * wu) ** 0.6, 0.55 + 1.05 * wu);

    /* 3) переход igloo целиком: полосы глитча, zoom-blur лучами от центра (пик посреди перехода и
       гаснет, когда закрывать нечего — blurCurve), разъезд каналов к краям кадра (растёт кубически),
       рваная заливка снизу и холодная вспышка. Доля перехода — та же заливка.
       Только здесь: в главе «Кейсы» страница просто обрывается рваным краем и уходит — переход
       оттуда пробовали и убрали (v67). */
    const g = this.reduced ? 0 : bell(s, ...STORY.glitch);
    const fu = ramp(s, ...STORY.fill);
    fx.glitch = g * TRANSITION.glitch;
    fx.glitchSeed = Math.floor(t * 18) + Math.floor(s * 60);
    /* v74.2: тот же воздух на выходе из About в «Кейсы»: смаз лучами от центра и разъезд каналов к краям
       поднимаются и гаснут вместе с растворением бумаги — переход не рвёт лист, а уносит его */
    const tearAir = c > 0 && !this.reduced ? ramp(c, ...CASES.tear) : 0;
    fx.radial = this.reduced ? 0 : Math.max(zoomBlur(fu), zoomBlur(tearAir) * 0.7);
    fx.aberration = this.reduced ? 0 : Math.max(aberrationAt(fu), tearAir > 0 && tearAir < 1 ? aberrationAt(Math.sin(tearAir * Math.PI)) * 0.8 : 0);
    fx.whiteBalance.set(1, 1, 1).lerp(this.coolWB, g);
    /* v73.1: в «Кейсах» баланс белого чуть теплее — солнечный луч сквозь лес */
    if (fx.alt > 0) fx.whiteBalance.lerp(HillScene.OVERCAST_WB, fx.alt);
    fx.fill = fu;
    const sk = ramp(s, ...STORY.studio);
    const studioMix = sk * sk * (3 - 2 * sk);
    if (this.studio) this.studio.mix = studioMix;
    fx.studio = studioMix;
    /* v19: бегущая строка «Hi there! I’m Nikita…» — едет за компьютером, тормозит и встаёт
       заголовком левой колонки (updateKinetic) */
    this.updateKinetic(s);

    if (!this.pc || !this.pcRest || !this.screen) return;

    /* 4) компьютер: поверх заливки своим проходом — вырывается из холма на белую страницу */
    /* в главе «Кейсы» компьютер уезжает вверх вместе со страницей — когда ушёл, проход не нужен */
    /* v25: край страницы в кейсах упирается в 1.2 (-0.12 + 1.32), порог 1.25 не достигался — проход компьютера
       (полный кадр с MSAA и мягкая тень) рисовался всю главу «Кейсы», хотя компьютер давно за кадром */
    const overlay = s >= STORY.overlay && this.storyTear < 1.18 && f <= 0;
    if (overlay !== this.pcOverlay) {
      this.pcOverlay = overlay;
      this.pc.traverse((o) => { o.layers.set(overlay ? PC_LAYER : 0); if (!overlay) o.layers.enable(SHIELD_LAYER); });
      fx.overlay = overlay;
    }
    /* ушёл за верх кадра вместе со страницей — в главе «Кейсы» не рисуется и в сцене; в футере снова на столике.
       Каждый кадр, а не только при смене слоя: из «Кейсов» в футер слой не меняется, и компьютер оставался невидимым */
    this.pc.visible = this.storyTear < 1.18 || f > 0;
    this.screen.setPhoto(ramp(s, ...STORY.photo), Math.max(bell(s, 0.24, 0.32, 0.42) * 0.55, bell(s, ...STORY.static)));
    this.screen.setGlass(this.next ? 1 - this.focus : 0, this.camera.position.x * 0.04);

    /* футер: компьютер снова на столике — под размытием, пока камера возвращается */
    if (f > 0) {
      if (!this.pcHome) {
        this.pcHome = true;
        this.pc.position.copy(this.pcRest.pos);
        this.pc.rotation.set(this.pcRest.pitch, this.pcRest.yaw, this.pcRest.roll, "YXZ");
        this.renderer.shadowMap.needsUpdate = true;
        this.storyApplied = -1;
      }
      return;
    }
    this.pcHome = false;
    const moving = Math.abs(s - this.storyApplied) > 1e-5;
    const u = ramp(s, ...STORY.flight);
    this.storyFlight = u;
    /* стоим на месте — позу не пересчитываем; но с u 0.8 компьютер «дышит» и следит за курсором,
       и это должно идти каждый кадр (раньше замирало, пока скролл стоит до p 0.8, и дёргалось на старте) */
    if (!moving && u < 0.8) return;
    this.storyApplied = s;
    if (u <= 0) {
      this.pc.position.copy(this.pcRest.pos);
      this.pc.rotation.set(this.pcRest.pitch, this.pcRest.yaw, this.pcRest.roll, "YXZ");
      if (moving) this.renderer.shadowMap.needsUpdate = true;
      return;
    }
    this.pcBox.makeEmpty();

    /* точка финиша — перед камерой в конце отъезда, экран в центре кадра */
    storyCamera(1, rest, CAMERA_TARGET, this.storyEndCam, this.storyEndLook);
    const fwd = this.storyTmp2.subVectors(this.storyEndLook, this.storyEndCam).normalize();
    let dist = this.camera.aspect < 1 ? 1.95 : 1.42;
    const e = this.storyEnd;
    const slot = this.camera.aspect < 1 ? this.storySlot : null;
    if (slot && slot.bottom - slot.top > 48) {
      /* v43: на вертикальном экране компьютер вписывается в свободное место между текстами страницы About.
         Расстояние — из габарита компьютера и высоты промежутка (и ширины окна), сдвиг по высоте — к центру
         промежутка. Раньше стоял на фиксированных 1,95 м по центру кадра и на невысоких телефонах закрывал
         нижний абзац. */
      const c = this.canvasRect;
      const tanH = Math.tan(THREE.MathUtils.degToRad(this.camera.fov) / 2);
      const size = this.storyTmp3.copy(this.pcLocalBox.max).sub(this.pcLocalBox.min).multiply(this.pc.scale);
      const fitH = (size.y * c.height) / (2 * tanH * (slot.bottom - slot.top));
      /* v107: компьютер не шире 56 % кадра — справа от полароида место под подпись «а это Келли» (раньше она висела
         над компьютером и на невысоком телефоне налезала на абзац). v110: по центру кадра, без сдвига влево (Никита) */
      const fitW = size.x / (2 * tanH * this.camera.aspect * 0.56);
      /* ближняя грань ближе центра и выглядит крупнее — запас 12 % */
      /* v74.2: ещё 14 процентов — воздух между компьютером и абзацами над и под ним */
      dist = Math.min(7, Math.max(1.5, Math.max(fitH, fitW) * 1.12 * 1.06));
      e.pos.copy(this.storyEndCam).addScaledVector(fwd, dist);
      const mid = (slot.top + slot.bottom) / 2 - c.top;
      e.pos.y += (0.5 - mid / c.height) * 2 * dist * tanH;
      e.pos.y -= ((this.pcLocalBox.min.y + this.pcLocalBox.max.y) / 2) * this.pc.scale.y;
    } else {
      e.pos.copy(this.storyEndCam).addScaledVector(fwd, dist);
      e.pos.y -= 0.26 * this.pc.scale.y / 0.8; // центр экрана выше основания компьютера
    }
    const toCam = this.storyTmp2.subVectors(this.storyEndCam, e.pos);
    e.yaw = Math.atan2(toCam.x, toCam.z);
    e.pitch = -Math.atan2(toCam.y, Math.hypot(toCam.x, toCam.z)) * 0.9;

    const pose = flightPose(this.pcRest, e, u, this.storyPose);
    /* v74.2: на вертикальном экране компьютер стоит в промежутке между абзацами. Поворот по скроллу, наклон за
       пальцем и заметное покачивание делали его болтающимся, а повёрнутый боком он становился шире промежутка
       и заезжал на текст. Там он только чуть дышит */
    const still = this.camera.aspect < 1;
    /* остановился — чуть «дышит», чтобы не выглядел наклейкой */
    const hover = ramp(u, 0.9, 1) * (this.reduced ? 0 : still ? 0.35 : 1);
    pose.pos.y += Math.sin(t * 1.3) * 0.01 * hover;
    pose.yaw += Math.sin(t * 0.7) * 0.025 * hover;
    /* v17: встал — поворачивается за курсором, как предмет в руках (oryzo) */
    const tiltOn = this.reduced || still ? 0 : ramp(u, 0.8, 1);
    const tk = 1 - Math.exp(-dt * 4);
    this.pcTilt.x += (this.pointer.x * tiltOn - this.pcTilt.x) * tk;
    this.pcTilt.y += (this.pointer.y * tiltOn - this.pcTilt.y) * tk;
    pose.yaw += this.pcTilt.x * 0.22;
    pose.pitch -= this.pcTilt.y * 0.1;
    /* v18: на странице About поворачивается по скроллу — показывает бок и возвращается к зрителю */
    if (STORY_FX.spin && !this.reduced && !still) {
      const sp = ramp(s, ...STORY.spin);
      pose.yaw += Math.sin(sp * Math.PI) * 0.55;
      pose.roll += Math.sin(sp * Math.PI * 2) * 0.03;
    }
    /* глава «Кейсы»: уходит вверх ровно с краем страницы — на расстоянии от камеры страницы высота
       кадра 2·tg(fov/2)·d, сдвиг — на ту же долю кадра, что и рваный край */
    if (this.storyTear > -0.12) {
      const cam = this.overlayCam;
      const up = this.storyTmp2.setFromMatrixColumn(cam.matrixWorld, 1);
      const d = Math.max(0.5, cam.position.distanceTo(pose.pos));
      const h = 2 * Math.tan(THREE.MathUtils.degToRad(cam.fov) / 2) * d;
      pose.pos.addScaledVector(up, (this.storyTear + 0.12) * h);
    }
    this.pc.position.copy(pose.pos);
    this.pc.rotation.set(pose.pitch, pose.yaw, pose.roll, "YXZ");
    if (moving && u < 0.2) this.renderer.shadowMap.needsUpdate = true;
  }
  /** доли глав и край оторванной страницы — для DOM-слоя */
  storyCh1 = 0;
  storyCh2 = 0;
  storyTear = -1;
  storyCh3 = 0;
  private pcHome = false;
  private footerDusk = false;
  private weatherBeforeFooter: WeatherKind = "clear";
  /* камера страницы: пока идёт глава 1, повторяет основную; в главе «Кейсы» замирает — компьютер
     и страница About остаются в своём кадре, а основная камера уходит на ракурс кейсов */
  private overlayCam = new THREE.PerspectiveCamera();
  private syncOverlayCam() {
    const oc = this.overlayCam;
    if (this.storyCh2 <= 0) {
      oc.position.copy(this.camera.position);
      oc.quaternion.copy(this.camera.quaternion);
    }
    if (oc.fov !== this.camera.fov || oc.aspect !== this.camera.aspect || oc.near !== this.camera.near || oc.far !== this.camera.far) {
      oc.fov = this.camera.fov; oc.aspect = this.camera.aspect; oc.near = this.camera.near; oc.far = this.camera.far;
      oc.updateProjectionMatrix();
    }
    oc.updateMatrixWorld();
  }

  /* DOM сообщает, где стоит заголовок «Hi there!»: левый край, базовая линия и кегль в px окна */
  private kineticTarget: { left: number; baseline: number; font: number } | null = null;
  setKineticTarget(t: { left: number; baseline: number; font: number } | null) {
    this.kineticTarget = t;
  }
  private updateKinetic(s: number) {
    const fx = this.fx.params;
    fx.kinetic = 0;
    const on = STORY_FX.kinetic && !this.reduced && s > STORY.kineticIn[0] && s < STORY.kineticSwap[1] && this.storyCh2 <= 0;
    if (!on) return;
    this.kinetic ??= this.makeKinetic();
    const k = this.kinetic;
    const cr = this.canvasRect;
    const aspect = cr.width / Math.max(1, cr.height);
    const portrait = aspect < 1;
    /* большая строка: постоянная высота и центр полосы */
    const bigH = portrait ? 0.15 : 0.27;
    const bigY = portrait ? 0.5 : 0.47;
    /* заголовок: высота полосы — из кегля, центр — из базовой линии (метрики kinetic.ts) */
    const tg = this.kineticTarget;
    const headH = tg ? tg.font / (KINETIC_FONT * cr.height) : bigH * 0.4;
    const headBaseUv = tg ? 1 - (tg.baseline - cr.top) / cr.height : 0.7;
    const headY = headBaseUv + (KINETIC_BASE - 0.5) * headH;
    const headX = tg ? (tg.left - cr.left) / cr.width : 0.06;
    const N = 3;
    const mu = ramp(s, ...STORY.kineticMorph);
    const m = mu * mu * mu * (mu * (mu * 6 - 15) + 10);
    const H = bigH + (headH - bigH) * m;
    const Y = bigY + (headY - bigY) * m;
    /* сдвиг: копия N стоит левым краем в headX; до этого строка въезжает справа и тормозит */
    const run = ramp(s, ...STORY.kineticRun);
    const approach = (1 - run) * (1 - run);
    fx.kinetic = ramp(s, ...STORY.kineticIn) * (1 - ramp(s, ...STORY.kineticSwap));
    fx.kineticTex = k.texture;
    fx.kineticRatio = k.ratio;
    fx.kineticShift = N - (headX * aspect) / (H * k.ratio) - approach * 1.35;
    fx.kineticY = Y;
    fx.kineticH = H;
    const keep = ramp(s, STORY.kineticMorph[0], STORY.kineticMorph[0] + 0.05);
    fx.kineticKeep.set(N, k.headFrac, keep * keep * (3 - 2 * keep));
  }
  /** доля полёта компьютера 0…1 — для рамки видоискателя («захват» в конце) */
  storyFlight = 0;
  /** после камеры и позы компьютера, перед рендером — для DOM-слоя, чтобы рамка шла с кадром */
  onStoryFrame?: () => void;
  private storyWarm = false;
  private canvasRect = { left: 0, top: 0, width: 1, height: 1 };
  private readCanvasRect = () => {
    const r = this.canvas.getBoundingClientRect();
    this.canvasRect = { left: r.left, top: r.top, width: r.width, height: r.height };
  };
  private makeKinetic() {
    return createKinetic((tex) => this.renderer.initTexture(tex));
  }
  /* Прогрев скролл-истории, пока пользователь ещё на холме. Без него первые кадры истории
     спотыкались: проход компьютера видит другой набор ламп (студия на PC_LAYER), и three
     синхронно собирал его шейдеры на p 0.1; MSAA-буфер pcRT, текстура бегущей строки
     (~5000×300) и фото на экране тоже заливались в видеопамять прямо посреди скролла. */
  /** собрать шейдеры объекта заранее — с тем же буфером, куда он реально рисуется (HDR, без тонмаппинга);
      синхронная часть compile() читает текущую цель рендера */
  private compileFor(obj: THREE.Object3D, camera: THREE.Camera) {
    const prev = this.renderer.getRenderTarget();
    this.renderer.setRenderTarget(this.fx.compileTarget);
    this.renderer.compileAsync(obj, camera, this.scene).catch(() => {});
    this.renderer.setRenderTarget(prev);
  }
  private warmStory() {
    this.storyWarm = true;
    if (!this.pc) return;
    const mask = this.camera.layers.mask;
    this.camera.layers.set(PC_LAYER);
    this.compileFor(this.pc, this.camera);
    this.camera.layers.mask = mask;
    /* светлячки и дождь впервые показываются в футере (закат) или по кнопке погоды */
    for (const o of [...this.weather.warmObjects, ...(this.dog?.warmObjects ?? [])]) {
      const v = o.visible;
      o.visible = true;
      this.compileFor(o, this.camera);
      o.visible = v;
    }
    /* окружение студии (PMREM комнаты, ~0,1–0,5 с главного потока) — отдельно, в простое: вместе с прогревом
       оно попадало на вход интерфейса и давало секундный рывок на слабом CPU; до сборки проход компьютера
       просто не подменяет окружение */
    const idle = (window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number }).requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 0));
    window.setTimeout(() => idle(() => { if (!this.disposed) this.studio?.prepare(this.renderer); }, { timeout: 4000 }), 2500);
    this.fx.warm();
    if (STORY_FX.kinetic) this.kinetic ??= this.makeKinetic();
    this.screen?.preloadPhoto(this.renderer);
  }
  private pcTilt = new THREE.Vector2();
  private kinetic?: Kinetic;
  /** прямоугольник компьютера в координатах окна — для рамки видоискателя в DOM */
  pcClientRect(): { x: number; y: number; w: number; h: number } | null {
    if (!this.pc || !this.studio || this.studio.mix <= 0) return null;
    const c = this.canvasRect;
    const r = this.fx.params.pcRect;
    return { x: c.left + r.x * c.width, y: c.top + (1 - r.w) * c.height, w: (r.z - r.x) * c.width, h: (r.w - r.y) * c.height };
  }
  private pcLocalBox = new THREE.Box3();
  /** студийный свет — от камеры страницы; прямоугольник компьютера в кадре — для фона, тени и рамки */
  private updateStudio() {
    const S = this.studio;
    if (!S || !this.pc) return;
    S.place(this.overlayCam, this.pc.position);
    if (S.mix <= 0) return;
    const r = projectBox(this.pc, this.pcLocalBox, this.overlayCam, this.fx.params.pcRect);
    /* пятно света — за компьютером, чуть выше центра, и немного следует за курсором */
    this.fx.params.spot.set((r.x + r.z) * 0.5 + this.pcTilt.x * 0.03, (r.y + r.w) * 0.5 + 0.06 + this.pcTilt.y * 0.02);
  }
  private pcOverlay = false;
  private storyCamPos = new THREE.Vector3();
  private storyCamLook = new THREE.Vector3().copy(CAMERA_TARGET);
  private storyTmp3 = new THREE.Vector3();
  /** свободное место под компьютер на странице About, px окна (пишет storyHero.ts; только вертикальный экран) */
  private storySlot: { top: number; bottom: number } | null = null;
  setStorySlot(slot: { top: number; bottom: number } | null) {
    this.storySlot = slot;
  }
  private storyEndCam = new THREE.Vector3();
  private storyEndLook = new THREE.Vector3();
  private storyTmp2 = new THREE.Vector3();  private storyTmp = new THREE.Vector3();

  /* ───────────── компьютер: наведение, подлёт камеры к экрану, прокрутка ───────────── */

  private pc?: THREE.Object3D;
  private screenMesh?: THREE.Mesh;
  private focus = 0;
  private focusOn = false;
  private focusDirty = false;
  private focusPos = new THREE.Vector3();
  private focusLook = new THREE.Vector3();
  private pcBox = new THREE.Box3();
  private hitNdc = new THREE.Vector2();
  private look = new THREE.Vector3();
  /** вызывается при смене состояния: навели на компьютер / камера у экрана */
  onComputerHover?: (hover: boolean) => void;
  private hovering = false;

  /** v94: правый верхний угол монитора в координатах окна, пока компьютер на столике, — для точки-подсказки (heroHints.ts) */
  pcClientPoint(): { x: number; y: number } | null {
    if (!this.pc || !this.screenMesh || this.focusOn || this.storyCh1 > 0.02) return null;
    const b = this.hintBox.setFromObject(this.screenMesh);
    const p = this.polaroidTmp.set(b.max.x, b.max.y, (b.min.z + b.max.z) / 2).project(this.camera);
    if (p.z > 1) return null;
    const c = this.canvasRect;
    return { x: c.left + (p.x * 0.5 + 0.5) * c.width, y: c.top + (-p.y * 0.5 + 0.5) * c.height };
  }
  private hintBox = new THREE.Box3();

  get computerFocused() {
    return this.focusOn;
  }

  /** Попадает ли точка экрана (clientX/Y) в компьютер. */
  hitComputer(clientX: number, clientY: number) {
    if (!this.pc) return false;
    const r = this.canvasRect; // без чтения DOM в кадре: наведение проверяется каждый кадр
    this.hitNdc.set(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
    this.raycaster.setFromCamera(this.hitNdc, this.camera);
    /* компьютер неподвижен — рамка считается один раз */
    /* v94: рамка с запасом 12 см — по маленькому компьютеру на столике легко попасть */
    if (this.pcBox.isEmpty()) this.pcBox.setFromObject(this.pc).expandByScalar(0.12);
    return this.raycaster.ray.intersectsBox(this.pcBox);
  }

  setComputerFocus(on: boolean) {
    if (!this.pc || !this.screenMesh || this.focusOn === on) return;
    if (on && this.storyCh1 > 0.02) return; // компьютер в полёте или перед зрителем
    this.focusOn = on;
    this.screen?.setActive(on);
    if (on) this.computeFocusPose();
  }

  /* v78: кнопки первого экрана страницы на мониторе — наведение и клик. Луч из точки окна в меш экрана,
     uv попадания отдаём экрану: он сам учитывает кривизну стекла и прокрутку */
  private screenUv(clientX: number, clientY: number) {
    if (!this.screenMesh || !this.focusOn) return null;
    const r = this.canvasRect;
    this.hitNdc.set(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
    this.raycaster.setFromCamera(this.hitNdc, this.camera);
    const hit = this.raycaster.intersectObject(this.screenMesh, false)[0];
    return hit?.uv ?? null;
  }

  /** курсор над кнопкой экрана? (подсвечивает её) */
  hoverScreen(clientX: number, clientY: number) {
    const uv = this.screenUv(clientX, clientY);
    return this.screen?.hoverAt(uv ? uv.x : -1, uv ? uv.y : -1) ?? false;
  }

  /** клик по экрану: кнопка листает страницу к разделу; true — клик пришёлся на кнопку */
  clickScreen(clientX: number, clientY: number) {
    const uv = this.screenUv(clientX, clientY);
    return uv ? this.screen?.clickAt(uv.x, uv.y) ?? false : false;
  }

  scrollScreen(px: number) {
    this.screen?.scrollBy(px);
  }

  scrollScreenPage(dir: number) {
    this.screen?.scrollPage(dir);
  }

  scrollScreenEdge(end: boolean) {
    this.screen?.scrollHome(end);
  }

  /** Сколько пикселей журнала на один CSS-пиксель высоты экрана монитора в кадре у экрана. */
  get screenScrollScale() {
    return (this.screen?.viewHeight ?? 800) / Math.max(1, (this.canvas.clientHeight || innerHeight) * 0.6);
  }

  /* Поза у экрана: камера на оси экрана, экран занимает ~60% высоты кадра
     (на узком экране — ~86% ширины): корпус читается целиком, снизу место под «Back» */
  private computeFocusPose() {
    const mesh = this.screenMesh!;
    mesh.updateWorldMatrix(true, false);
    const geo = mesh.geometry;
    geo.computeBoundingBox();
    const bb = geo.boundingBox!.clone().applyMatrix4(mesh.matrixWorld);
    const c = bb.getCenter(this.focusLook);
    const normal = new THREE.Vector3(0, 0, 1).transformDirection(this.pc!.matrixWorld).setY(0).normalize();
    const s = new THREE.Vector3(1, 0, 0).transformDirection(this.pc!.matrixWorld);
    const scale = this.pc!.getWorldScale(new THREE.Vector3()).x;
    const sw = 0.25 * scale * s.length(), sh = 0.232 * scale;
    const tanV = Math.tan(THREE.MathUtils.degToRad(this.camera.fov) / 2);
    const dV = sh / 0.6 / (2 * tanV);
    const dH = sw / 0.86 / (2 * tanV * this.camera.aspect);
    const d = Math.max(dV, dH);
    this.focusPos.copy(c).addScaledVector(normal, d);
    this.focusDirty = false;
  }

  private updateComputer(dt: number, rest: THREE.Vector3) {
    const dur = this.reduced ? 0.25 : 1.7;
    this.focus = THREE.MathUtils.clamp(this.focus + (this.focusOn ? dt : -dt) / dur, 0, 1);
    const f = this.focus;
    if (this.focusOn && this.focusDirty) this.computeFocusPose();
    /* плавный старт и посадка; по пути камера чуть поднимается над травой */
    const e = f < 0.5 ? 4 * f * f * f : 1 - Math.pow(-2 * f + 2, 3) / 2;
    this.camera.position.lerpVectors(rest, this.focusPos, e);
    this.camera.position.y += Math.sin(Math.PI * e) * 0.35;
    this.look.lerpVectors(this.storyS > 0 ? this.storyCamLook : CAMERA_TARGET, this.focusLook, Math.min(1, e * 1.25));
    this.camera.lookAt(this.look);
    /* размытие переднего плана и курсор по траве у экрана не нужны */
    this.fx.params.focus = this.focusBase * (1 - e);
    if (f > 0) this.ndc.set(10, 10);

    const hover = !this.focusOn && f === 0 && this.storyCh1 < 0.02 && this.pc !== undefined && this.lastClient.x >= 0 && this.hitComputer(this.lastClient.x, this.lastClient.y);
    if (hover !== this.hovering) {
      this.hovering = hover;
      this.onComputerHover?.(hover);
    }
  }

  private lastClient = new THREE.Vector2(-1, -1);
  private focusBase = 1;
  /* своя карта глубины реквизита для травы и земли: реквизит неподвижен,
     поэтому снимаем её один раз, а не каждый кадр */
  private shadowRT?: THREE.WebGLRenderTarget;
  private bakePropShadow(props: THREE.Object3D) {
    const size = 1024;
    this.shadowRT?.dispose();
    const rt = (this.shadowRT = new THREE.WebGLRenderTarget(size, size));
    rt.depthTexture = new THREE.DepthTexture(size, size, THREE.FloatType);
    const box = new THREE.Box3().setFromObject(props);
    const center = box.getCenter(new THREE.Vector3());
    const cam = new THREE.OrthographicCamera(-1.5, 1.5, 1.5, -1.5, 0.1, 12);
    cam.position.copy(center).addScaledVector(SHADOW_DIR, 6);
    cam.lookAt(center);
    cam.updateMatrixWorld();
    cam.layers.set(SHADOW_LAYER);

    /* v24: нужна только глубина — один простой материал вместо PBR-материалов реквизита
       (иначе рендер без ламп синхронно собирал для кресла второй комплект программ) */
    const depthOnly = new THREE.MeshBasicMaterial({ colorWrite: false });
    const bake = () => {
      if (this.disposed) return;
      const prevTarget = this.renderer.getRenderTarget();
      const bg = this.scene.background;
      this.scene.background = null;
      this.renderer.setRenderTarget(rt);
      this.renderer.setClearColor(0x000000, 0);
      this.renderer.clear();
      const over = this.scene.overrideMaterial;
      this.scene.overrideMaterial = depthOnly;
      this.renderer.render(this.scene, cam);
      this.scene.overrideMaterial = over;
      this.renderer.setRenderTarget(prevTarget);
      this.scene.background = bg;
      depthOnly.dispose();

      this.uniforms.uShadowMap.value = rt.depthTexture;
      this.uniforms.uShadowMatrix.value.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse);
      this.uniforms.uShadowTexel.value = 1 / size;
      this.uniforms.uShadowOn.value = 1;
    };
    /* v44: программа этого материала собиралась синхронно прямо в рендере тени — 0,33 с главного потока на
       холодном кэше. Теперь сначала параллельная сборка (те же геометрии, та же цель, тот же туман сцены),
       запекание — когда программа готова; тень появляется на долю секунды позже, холст в это время ещё скрыт */
    const twins = new THREE.Group();
    props.updateWorldMatrix(true, true);
    props.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh || !m.layers.isEnabled(SHADOW_LAYER)) return;
      const twin = new THREE.Mesh(m.geometry, depthOnly);
      twin.layers.set(SHADOW_LAYER);
      twin.frustumCulled = false;
      twins.add(twin);
    });
    const prev = this.renderer.getRenderTarget();
    this.renderer.setRenderTarget(rt);
    const compiled = this.renderer.compileAsync(twins, cam, this.scene);
    this.renderer.setRenderTarget(prev);
    void Promise.race([compiled, new Promise((r) => setTimeout(r, 3000))]).catch(() => {}).then(bake);
  }

  /* ------------------------------------------------------------------ */

  private onPointer = (e: PointerEvent) => {
    /* v44: канвас закреплён в окне — его прямоугольник меняется только на resize (readCanvasRect);
       getBoundingClientRect на каждое движение мыши тоже форсировал раскладку */
    const r = this.canvasRect;
    this.ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    /* параллакс — от окна, а не от канваса: на телефоне канвас выше экрана */
    this.pointer.set((e.clientX / window.innerWidth) * 2 - 1, -((e.clientY / window.innerHeight) * 2 - 1));
    this.lastClient.set(e.clientX, e.clientY);
  };

  private observer?: IntersectionObserver;
  /** WebGL-контекст пропал и не вернулся — main.ts переводит страницу в лёгкую версию без 3D */
  onDegrade?: (why: "context") => void;
  renderedFrames = 0;
  private resolvePresentation!: () => void;
  /** A frame with the critical assets and compiled materials has actually been drawn. */
  readonly presentationReady = new Promise<void>(resolve => { this.resolvePresentation = resolve; });
  private onContextLost = (e: Event) => {
    e.preventDefault();
    cancelAnimationFrame(this.raf);
    /* контекст обычно возвращается за секунду (тогда перезагрузка); не вернулся — лёгкая версия */
    window.setTimeout(() => { if (this.renderer.getContext().isContextLost()) this.onDegrade?.("context"); }, 2500);
  };
  private onContextRestored = () => location.reload();

  private onLeave = () => {
    this.ndc.set(10, 10);
    this.pointer.set(0, 0);
    this.lastClient.set(-1, -1);
  };

  /* луч против поля высот: шагаем, пока не нырнём под верх травы, затем бисекция */
  private pickHill(): boolean {
    if (this.ndc.x > 2) return false;
    this.raycaster.setFromCamera(this.ndc, this.camera);
    const { origin, direction } = this.raycaster.ray;
    const lift = 0.06;
    const p = this.rayP;
    /* луч, ушедший выше вершины холма, землю уже не встретит — дальше не шагаем */
    const top = heightAt(0, 0) + 0.3;
    const tMax = direction.y > 1e-4 ? Math.min(45, (top - origin.y) / direction.y) : 45;
    if (tMax <= 0.5) return false;
    let prev = 0;
    for (let t = 0.5; t < tMax; t += 0.08) {
      p.copy(origin).addScaledVector(direction, t);
      if (p.y < heightAt(p.x, p.z) + lift) {
        let a = prev, b = t;
        for (let i = 0; i < 12; i++) {
          const m = (a + b) / 2;
          p.copy(origin).addScaledVector(direction, m);
          if (p.y < heightAt(p.x, p.z) + lift) b = m; else a = m;
        }
        this.hit.copy(p);
        return true;
      }
      prev = t;
    }
    return false;
  }

  /** холм в этом кадре не рисуется: те же условия, что в postfx.render() (covered и altFull) */
  private hillHidden() {
    const p = this.fx.params;
    const covered = p.fill >= 0.999 && p.tear <= -0.2;
    const portal = p.portal > 0.001 && p.portal < 0.999;
    return covered || (!!p.altRender && p.alt >= 0.999 && !portal);
  }

  private updateCursor(dt: number) {
    const hitNow = !this.reduced && this.pickHill();
    if (hitNow) {
      if (!this.headLive || this.head.s < 0.01) this.head.pos.copy(this.hit);
      else this.head.pos.lerp(this.hit, 1 - Math.exp(-dt * 16));
      this.head.s += (1 - this.head.s) * (1 - Math.exp(-dt * 10));
      this.headLive = true;
    } else {
      this.head.s *= Math.exp(-dt * 3);
      this.headLive = false;
    }

    /* след: когда голова отошла на полрадиуса — оставляем отпечаток */
    if (this.head.s > 0.05 && this.head.pos.distanceTo(this.lastDrop) > this.uniforms.uPushR.value * 0.45) {
      const slot = this.trail[this.trailCursor];
      slot.pos.copy(this.head.pos);
      slot.s = this.head.s * 0.85;
      this.trailCursor = (this.trailCursor + 1) % this.trail.length;
      this.lastDrop.copy(this.head.pos);
    }
    for (const t of this.trail) t.s *= Math.exp(-dt * 1.4);

    const u = this.uniforms.uTrail.value;
    u[0].set(this.head.pos.x, this.head.pos.y, this.head.pos.z, this.head.s);
    this.trail.forEach((t, i) => u[i + 1].set(t.pos.x, t.pos.y, t.pos.z, t.s));
    this.uniforms.uTrailOn.value = this.head.s > 0.002 || this.trail.some((t) => t.s > 0.002) ? 1 : 0;

    /* пыльца срывается с травы, по которой прошёл курсор */
    if (this.headLive && this.head.s > 0.3) {
      const d = this.head.pos.distanceTo(this.pollenLast);
      if (d > 0.09) {
        const n = Math.min(4, Math.floor(d / 0.09));
        for (let i = 0; i < n; i++) this.spawnPollen(this.head.pos);
        this.pollenLast.copy(this.head.pos);
      }
    } else {
      this.pollenLast.set(1e6, 0, 0);
    }
  }

  /* v96: окно тянут десятки раз в секунду, а каждый resize пересоздаёт 14 буферов постобработки — ждём паузу 120 мс.
     Смена ступени качества зовёт resize напрямую */
  private resizeTimer = 0;
  private onWindowResize = () => {
    clearTimeout(this.resizeTimer);
    this.resizeTimer = window.setTimeout(this.resize, 120);
  };
  private resize = () => {
    this.readCanvasRect();
    const w = this.canvas.clientWidth || window.innerWidth;
    const h = this.canvas.clientHeight || window.innerHeight;
    /* максимум — родной DPR экрана (до 2.25); ступень качества берёт от него долю.
       v72: на компьютере с экраном DPR ниже 1.5 верх лестницы — суперсэмплинг до 1.5. Кресло с компьютером
       на экране DPR 1 занимают около ста пикселей: MSAA сглаживает только края геометрии, а рябь внутри
       текстур (ткань подушек, пластик корпуса) оставалась, и всё реквизитное выглядело «пиксельным».
       Кадр сжимается финальным проходом с фильтром (см. uDown в shaders.ts). Слабый ноутбук лестница
       и регулятор уводят обратно к родному разрешению — ниже него пол не пускает. */
    const native = Math.min(window.devicePixelRatio || 1, 2.25);
    this.dprMax = this.phone ? native : Math.max(native, Math.min(1.5, native * 1.5));
    const forced = Number(new URLSearchParams(location.search).get("dpr"));
    if (forced > 0) { this.dprMax = forced; this.qualityScale = 1; }
    /* ступень качества задаёт долю от максимума; раньше здесь было min(текущий, максимум)
       со стартом 1 — DPR никогда не поднимался выше 1 и картинка на экране 2.25 была пиксельной */
    /* пол резкости: на экране с DPR ≥ 1.25 сцена не рисуется грубее 1.25 (на DPR 1 — не ниже 1) */
    this.dpr = Math.max(this.dprMax * this.qualityScale, Math.min(native, 1.25));
    /* канвас — в родном DPR (финальный проход растягивает или сжимает сцену), сцена — в DPR ступени качества */
    const canvasDpr = /[?&]canvas=scene/.test(location.search) ? this.dpr : forced > 0 ? Math.min(forced, native) : native;
    this.renderer.setPixelRatio(canvasDpr);
    this.renderer.setSize(w, h, false);
    this.fx.setSize(w, h, this.dpr, canvasDpr);
    this.walk?.setSize(w, h, this.dpr);
    this.pollenScale(this.dpr);
    this.camera.aspect = w / h;
    this.placeTree();
    this.focusDirty = true;
    /* на узком экране отъезжаем назад, а не расширяем угол: так в кадр
       попадает весь склон, а не ближняя трава крупным планом */
    const aspect = w / h;
    /* v96: предел отъезда снижен с 1,5 до 1,25. На iPhone камера уходила на весь предел, и кресло с компьютером были в полтора
       раза мельче, чем на широком экране (экран компьютера ~45 px); при 1,25 склон по-прежнему в кадре, предметы на
       четверть крупнее, а травинок в кадре меньше — кадр дешевле. Текстовый блок встаёт по кроне сам (mobileCopy) */
    /* v106 (Никита): на телефоне холм стоял слишком близко — камера отъезжает дальше (было не больше 1,25), кресло с
       компьютером мельче, зато виден весь холм с деревом и закатом. ?camd= — подобрать предел */
    const q = new URLSearchParams(location.search);
    /* v107: кадр телефона по картинке Никиты: камера выше гребня — за креслом горизонт, горы и море тумана, солнце между
       компьютером и деревом; кресло в правой половине, дерево режет правая кромка. Ниже гребня камера смотрела в склон
       снизу вверх — дали не было видно, а трава с расстояния 1,7 казалась лысой. Подбор: ?camd ?mcx ?mcy ?mtx ?mty */
    const mob = (k: string, d: number) => Number(q.get(k) ?? d);
    /* v108 (Никита): камера ещё дальше — с 1,45 у нижнего края травинки стояли редко и сквозь них виднелась земля;
       с расстояния 2 холм читается сплошным лугом */
    const camMax = mob("camd", 2);
    this.camDistance = aspect < 1 ? Math.min(camMax, 1 + (1 - aspect) * mob("mcf", 3)) : 1;
    /* v72: на вертикальном экране камера отъезжает на ~6 м, и дымка по расстоянию (airFog) густела на весь
       склон — цвет на телефоне был блёклым, серо-оливковым. Дымку сдвигаем на величину отъезда: склон в том же
       воздухе, что на широком экране, дальний план — по-прежнему в дымке */
    this.uniforms.uFogShift.value = (this.camDistance - 1) * CAMERA_BASE.distanceTo(CAMERA_PIVOT);
    /* v68: боковой разворот кадра — только там, где для него есть ширина. На вертикальном экране
       угол обзора по горизонтали втрое уже, и тот же разворот вынес бы кресло с компьютером за
       правую кромку. Поэтому на телефоне кадр остаётся прежним, центральным, а к широкому экрану
       разворот набирается плавно: композиция по золотому сечению — про широкий кадр. */
    const panK = Math.min(1, Math.max(0, (aspect - 0.6) / 0.7));
    CAMERA_REST_OFF.x = 0.6 + (CAMERA_PAN.x - 0.6) * panK + mob("mcx", 1.5) * (1 - panK);
    CAMERA_REST_OFF.y = -0.3 + mob("mcy", 1.5) * (1 - panK);
    CAMERA_TARGET.x = 0.2 + (CAMERA_PAN.y - 0.2) * panK;
    CAMERA_TARGET.x += mob("mtx", -1) * (1 - panK);
    CAMERA_TARGET.y = 3.2 + mob("mty", -0.15) * (1 - panK);
    /* отъезд первого экрана — композиция широкого кадра: на телефоне камера и так дальше, а текст встаёт по кроне */
    HERO_PULL_OFF.copy(HERO_PULL_DIR).multiplyScalar(HERO_PULL * panK);
    /* Поворот телефона или сужение окна отодвигает камеру — передний склон, посаженный под
       прежнюю позу, остался бы голым. Шире 16:9 × 1.2 — не хватит травы по бокам. */
    const planted = this.plantedFor;
    /* v103: до первой посадки (pan −1) сравнивать не с чем. Без этой проверки кадрирование в конструкторе ставило
       таймер, и через 450 мс после загрузки луг сажался второй раз целиком (~1,2 с главного потока) */
    const panMoved = planted.pan >= 0 && Math.abs(panK - planted.pan) > 0.04;
    const moved = planted.dist > 0 && Math.abs(this.camDistance - planted.dist) > 0.04;
    const wider = planted.aspect > 0 && aspect > Math.max(planted.aspect, (16 / 9) * 1.2) * 1.05;
    if ((moved || wider || panMoved) && !this.opts.fixedCamera) {
      clearTimeout(this.replantTimer);
      this.replantTimer = window.setTimeout(() => !this.disposed && this.rebuildMeadow(), 450);
    }
    this.camera.updateProjectionMatrix();
  };

  /* Потолок частоты кадров. На экранах 120–165 Гц сцена без него рисовала до 165
     кадров, грела видеокарту и ноутбук сбрасывал частоты. Трава и так плавная на 60.
     ?fps=0 — без потолка, ?fps=30 — экономный режим. */
  private readonly frameInterval = (() => {
    const f = Number(new URLSearchParams(location.search).get("fps") ?? 60);
    return f > 0 ? 1000 / f : 0;
  })();
  private nextFrameAt = 0;
  private onScreen = true;
  /** v26: страница кейса закрывает сцену целиком — цикл стоит, канвас держит последний кадр */
  paused = false;
  /* Потолок кратен частоте экрана: на 144 Гц «60 кадров по таймеру» чередовали паузы
     в 2 и 3 кадра развёртки (14 и 21 мс), и параллакс подёргивался. Частоту меряем по
     пропущенным (дешёвым) кадрам rAF, затем рисуем каждый N-й: 144 → 72, 120 → 60, 165 → 55. */
  private lastRafAt = 0;
  private lastWasSkip = false;
  private vsyncSamples: number[] = [];
  private vsyncSkip = 0;
  private rafCount = 0;

  private loop = (now = performance.now()) => {
    if (this.disposed) return;
    this.raf = requestAnimationFrame(this.loop);
    /* вкладка скрыта, канвас прокручен за экран или поверх открыта страница кейса — не рисуем вовсе */
    if (document.hidden || !this.onScreen || this.paused) return;
    const since = now - this.lastRafAt;
    this.lastRafAt = now;
    if (this.frameInterval > 0) {
      if (this.vsyncSkip > 0) {
        if (++this.rafCount % this.vsyncSkip !== 0) return;
      } else {
        if (this.lastWasSkip && since > 3 && since < 40) this.vsyncSamples.push(since);
        if (this.vsyncSamples.length >= 45) {
          const s = this.vsyncSamples.sort((a, b) => a - b)[this.vsyncSamples.length >> 1];
          const hz = 1000 / s;
          this.vsyncSkip = Math.max(1, Math.round(hz / (1000 / this.frameInterval)));
        }
        this.lastWasSkip = now < this.nextFrameAt - 1;
        if (this.lastWasSkip) return;
        /* шаг сетки, а не «от текущего кадра» — иначе при 165 Гц выходит 55, а не 60 */
        this.nextFrameAt = Math.max(this.nextFrameAt + this.frameInterval, now - this.frameInterval);
      }
    }
    this.timer.update(now);
    const dt = Math.min(this.timer.getDelta(), 0.05);
    this.uniforms.uTime.value += dt;
    this.screen?.update(this.uniforms.uTime.value, dt);
    /* v79: холм не виден — под белой страницей About или в «Кейсах», где вместо него луг. Тогда не считаем то,
       что живёт только на холме: собаку, поиск точки под курсором (сотни шагов по рельефу на кадр) и семена */
    const hillShown = !this.hillHidden();
    const lookAt = this.pc && this.storyCh1 > 0.1 && this.storyCh2 <= 0 && this.storyCh3 <= 0 ? this.pc.position : this.headLive && !this.focusOn ? this.head.pos : null;
    /* v24: в дождь — кепка с зонтиком; в футере Келли спит клубочком на кресле (с запасом, чтобы не дёргалась на границе) */
    const sleep = this.dog?.isSleeping ? this.storyCh3 > 0.06 : this.storyCh3 > 0.12;
    if (hillShown) this.dog?.update(dt, lookAt, this.camera.position, { rain: this.weather.kind === "rain", sleep });

    this.uniforms.uWind.value = (this.reduced ? 0.25 : 1) * this.weather.windScale + this.gustAmount(this.uniforms.uTime.value);
    /* пока играет интро, экспозицией и цветом постобработки управляет оно */
    this.weather.update(dt, true);
    this.sky.uniforms.uClouds.value = this.next ? this.weather.cloudShare : 0;
    this.updateStory(dt);

    const fixed = this.opts.fixedCamera;
    if (fixed) {
      this.camera.position.set(fixed[0], fixed[1], fixed[2]);
      this.camera.lookAt(fixed[3], fixed[4], fixed[5]);
    } else {
      this.pointerSmooth.lerp(this.pointer, 1 - Math.exp(-dt * 2.5));
      /* параллакс гаснет в главе 1 и возвращается в «Кейсах» */
      const par = (this.reduced ? 0 : 1) * Math.max(1 - ramp(this.storyCh1, 0, 0.1), ramp(this.storyCh2, 0.1, 0.3) * (1 - ramp(this.storyCh3, 0.02, 0.2)), ramp(this.storyCh3, ...FOOTER.settle));
      const rest = this.storyS > 0 ? this.cameraRest().copy(this.storyCamPos) : this.cameraRest();
      /* у экрана параллакс гаснет, иначе журнал «плавает» под курсором */
      const hold = 1 - this.focus;
      rest.set(rest.x - this.pointerSmooth.x * 0.5 * par * hold, rest.y + this.pointerSmooth.y * 0.2 * par * hold, rest.z);
      /* v96, ?next=1: камера «дышит», как с рук — пара сантиметров на двух несоизмеримых частотах; гаснет вместе с
         параллаксом и у экрана компьютера, при reduced motion её нет (par = 0) */
      if (this.next) {
        const t = this.uniforms.uTime.value, k = par * hold;
        rest.x += (Math.sin(t * 0.37) * 0.6 + Math.sin(t * 0.83 + 1.3) * 0.4) * 0.035 * k;
        rest.y += (Math.sin(t * 0.51 + 0.7) * 0.6 + Math.sin(t * 1.13) * 0.4) * 0.022 * k;
      }
      this.updateComputer(dt, rest);
    }

    /* v44: высота канваса — из замера в resize, а не canvas.clientHeight. Чтение clientHeight каждый кадр после
       записи стилей интерфейса заставляло браузер синхронно пересчитывать раскладку всей страницы: по профилю
       22 % времени главного потока на быстром процессоре, на слабом — почти весь бюджет кадра */
    this.uniforms.uPixelWorld.value = (2 * Math.tan(THREE.MathUtils.degToRad(this.camera.fov) / 2)) / Math.max(1, (this.canvasRect.height || window.innerHeight) * this.dpr);
    /* студийный свет и прямоугольник компьютера — по камере этого кадра, иначе фон и рамка отстают на кадр */
    if (this.storyS > 0) {
      this.syncOverlayCam();
      this.fx.params.overlayCamera = this.overlayCam;
      this.updateStudio();
    }
    if (hillShown) {
      this.updateCursor(dt);
      this.driftSeeds(dt);
    }
    /* регулятор качества меряет видеокарту только на спокойном холме (quality.ts) */
    if (!this.shadersReady || this.pendingCompile > 0) return;
    if (this.walk && this.fx.params.alt > 0) {
      /* курсор над лугом пускает волны по траве; сенсорный экран — без волн */
      this.walk.setPointer(this.ndc.x < 2 && !this.reduced ? this.ndc : null);
      if (this.signpost) {
        const { c, f } = chapters(this.storyS);
        this.walk.setSign(this.signCase, f <= 0 && c > CASES.cardsIn[0] - 0.02 && c < CASES.stripOut[0] + 0.02);
      }
      this.walk.update(dt);
    }
    if (this.storyS > 0) this.onStoryFrame?.();
    this.fx.render();
    this.renderedFrames++;
    if (this.assetsReady >= 2) this.resolvePresentation();
    if (!this.storyWarm && this.settled && this.pc && this.assetsReady >= 2) this.warmStory();
    /* кресло и HDRI на месте — сцена готова, интерфейс может проявляться */
    if (!this.settled && this.assetsReady === 2) this.settle();
  };

  /* v104: подстройки качества под устройство больше нет — Никита: «сразу показать качественный результат, а если не
     тянет, человек перейдёт на лёгкую версию» (кнопка на заставке и в навигации). Сцена всегда на верхней ступени:
     родной DPR (на экранах ниже 1.5 — суперсэмплинг до 1.5), MSAA 4×, вся трава, лучи. Ушли стартовый замер кадров,
     регулятор по таймеру видеокарты (quality.ts), запоминание ступени на две недели и уход в лёгкую версию «медленно».
     Лестницы ниже остались для ?tier= — посмотреть, как выглядели бы нижние ступени. История ниже — как они подбирались.

     Ступени качества вместо непрерывной подстройки. Раньше DPR менялся раз в
     секунду: на экране 165 Гц пороги срабатывали то вверх, то вниз, буферы
     пересоздавались, картинка «дышала» резкостью — это было второе мерцание.
     Теперь: на старте (канвас ещё скрыт входом UI) сцена меряет время кадра
     readPixels-бенчмарком и спускается по лестнице, пока кадр не уложится в
     бюджет; результат запоминается для этой видеокарты и экрана. После старта
     разрешение не меняется. */
  /* [доля родного DPR, MSAA]. Сравнение на экране 2.25: DPR 1.5 + MSAA 2× резче,
     чем DPR 1.26 + MSAA 4× при том же времени кадра — ниже верха меняем сэмплы на пиксели */
  /* [доля DPR, MSAA, доля травинок, лучи]. Нижние ступени — для телефонов и слабых
     встроенных видеокарт: там дешевле убрать часть травы и лучи, чем уронить
     разрешение до мыла (совет из path tracer erichlof: на мобильных pixel ratio 0.5–1). */
  /* v7: сначала жертвуем количеством травинок и лучами, резкость — в последнюю
     очередь. Пиксельная трава заметнее, чем чуть более редкая: травинки дальше
     и так расширяются, сохраняя покрытие. DPR к тому же не опускается ниже
     DPR_FLOOR (см. resize). */
  /* v8: сэмплы важнее пикселей. Сравнение кадров на экране 2.25: DPR 1.76 + MSAA 2×
     даёт «лесенку» ярких точек на краях тонких травинок, а DPR 1.5 + MSAA 4× почти
     не отличим от родного разрешения — и дешевле (13.8 мс против 14.6 на Intel).
     Поэтому MSAA 4× держится до последней ступени, травинки и лучи уходят раньше. */
  /* v22.2: MSAA 4× → 2× теперь раньше, чем потеря разрешения, лучей и густоты травы. Замер на Intel
     при DPR 1.51: 4× — 20 мс, 2× — 15, 0 — 9; по кадрам 1.51 + 2× почти не отличим от 1.51 + 4×,
     а прежняя следующая ступень (1.35, 80% травы, без лучей) заметно беднее — «качество упало». */
  private static readonly LADDER: [number, number, number, boolean][] = [
    [1, 4, 1, true], [0.89, 4, 1, true], [0.78, 4, 1, true], [0.67, 4, 1, true],
    [0.67, 2, 1, true], [0.6, 2, 1, true], [0.6, 2, 0.8, false], [0.56, 2, 0.62, false], [0.56, 0, 0.5, false],
  ];
  /* v72: лестница телефона. Та, что выше, подобрана на Intel Arc, где MSAA дорогой, и он уходил одним из
     первых, а следом разрешение: телефон с экраном DPR 3 доходил до сцены в DPR 1.26 без MSAA, и финальный
     проход растягивал её в 2.4 раза — цветы квадратиками, у кресла лесенка. У телефонных видеокарт (тайловых)
     наоборот: MSAA разрешается в памяти тайла и почти бесплатен, а дорог каждый лишний пиксель и каждая
     вершина. Поэтому здесь первыми уходят густота травы и лучи, MSAA 4× держится почти до низа, а
     разрешение не опускается ниже 0.6 от потолка (1.35 на DPR 2.25). Травинки на телефоне и так мельче:
     камера отъезжает дальше, чтобы в вертикальный кадр вошёл весь склон. Длина та же — девять ступеней,
     чтобы ?tier=, запомненная ступень и пороги «тяжёлой» травы читались одинаково. */
  /* v72.1: густота травы держится дольше — поредевшая трава на iPhone читалась сильнее, чем чуть меньшее разрешение.
     v72.2: замер на iPhone 11 владельца — нижняя ступень (DPR 1.25, MSAA 2×) шла 30 мс. Замер той же ступени
     таймером на ПК: MSAA-буфер — половина всего кадра (2.0 мс против 1.1 без него). Поэтому нижние три ступени
     без MSAA, но в разрешении выше: сцена DPR 1.3–1.5 и сглаживание краёв в финальном проходе (edgeAA) вдвое
     дешевле, чем 1.25 с MSAA 2×, и резче — меньше растяжка на экран DPR 2 */
  /* v96: по жалобе «на телефоне пиксельно и мало травы». Низ лестницы рисовал сцену в 0,65 родного разрешения (на
     экранах DPR 3 — в половину: канвас ограничен 2,25) без MSAA, и iPhone 11 на нём и жил, потому что калибровка
     целилась в 60 кадров, которых он не даёт. Теперь разрешение не опускается ниже 0,8, MSAA 4× держится до середины,
     а бюджет телефона — 30 кадров в секунду (budgetMs): первый экран почти статичен, ему этого хватает */
  private static readonly PHONE_LADDER: [number, number, number, boolean][] = [
    [1, 4, 1, true], [0.92, 4, 0.9, true], [0.86, 4, 0.8, true], [0.8, 4, 0.75, true],
    [0.8, 4, 0.65, false], [0.8, 2, 0.62, false], [0.8, 2, 0.55, false], [0.8, 0, 0.55, false], [0.8, 0, 0.5, false],
  ];
  /* телефон или планшет: основной указатель — палец, мыши нет */
  private readonly phone = matchMedia("(pointer: coarse)").matches && !matchMedia("(any-pointer: fine)").matches;
  private readonly ladder = this.phone ? HillScene.PHONE_LADDER : HillScene.LADDER;
  private tier = 0;
  private settled = false;
  private assetsReady = 0; // кресло и HDRI
  /* UI проявляется, когда кресло и HDRI на месте (settle) */
  private resolveSettled!: () => void;
  readonly sceneReady = new Promise<void>((r) => (this.resolveSettled = r));
  private dprMax = 1;

  /* v44: ?tier=0…8 — поставить ступень руками (посмотреть, что видит слабый компьютер). Без параметра — верхняя */
  private pinTier() {
    const forcedTier = new URLSearchParams(location.search).get("tier");
    if (forcedTier !== null && Number.isInteger(+forcedTier) && +forcedTier >= 0 && +forcedTier < this.ladder.length) this.setTier(+forcedTier, "param");
  }

  /* густота травы и лучи: ступень качества × облегчение под размытием кейсов (v25) */
  private bgCheap = false;
  /* v32: луг Meadow Walk — фон главы «Кейсы» (scene/meadow). Создаётся заранее, пока читают About, в простое;
     шейдеры прогреваются в его буфер. Не готов вовремя или ?walk=0 — в кейсах, как раньше, холм */
  private walk?: Meadow;
  get footerPortalClip() {
    if (this.fx.params.portal >= 0.999) return "inset(0)";
    return this.fx.params.portal > 0 ? this.walk?.portal.clip(this.walk.camera) ?? null : null;
  }
  private walkReady = false;
  private walkStarted = false;
  private readonly walkOff = new URLSearchParams(location.search).get("walk") === "0";
  private readonly vignetteBase = 0.55;
  /* v103: указатель кейса на лугу (meadow/signpost3d.ts); номер кейса приходит из списка кейсов (ui/casesSignpost.ts).
     ?signpost=0 — прежняя карточка */
  readonly signpost = !/[?&]signpost=0/.test(location.search);
  private signCase = -1;
  setSignCase(i: number) {
    this.signCase = i;
  }
  /* v106: луг собирался, только когда прокрутка подходила к «Кейсам». Быстрая прокрутка или «Кейсы» в чёлке приводили в главу
     раньше, чем он был готов, и несколько секунд за кейсами стоял размытый холм. Теперь сборка начинается, как только
     человек тронул историю, или через 6 с после первого экрана (после заставки, в свободное время браузера) */
  private walkAfter = 0;
  private walkWaiting = false;
  private ensureWalk() {
    /* и не ждём, пока закончится подбор качества (tierLocked): на встроенной видеокарте он идёт долго, и луг не начинал
       собираться вовсе. Плотность луга всё равно подстраивается под ступень в setTier. С v104 подбора нет совсем */
    if (this.walkStarted || this.walkOff || document.body.classList.contains("intro-loading")) return;
    if (!this.walkAfter) this.walkAfter = performance.now() + 6000;
    if (this.storyS < 0.015 && performance.now() < this.walkAfter) return;
    this.walkStarted = true;
    const idle = (window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number }).requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 0));
    /* v96: луг и портал — отдельный чанк, грузится здесь, а не с первым экраном */
    idle(() => void import("./meadow/Meadow").then(({ Meadow }) => {
      if (this.disposed) return;
      const small = Math.min(window.innerWidth, window.innerHeight) < 700 || matchMedia("(pointer: coarse)").matches;
      /* травы столько же, сколько у холма (220k/110k), — в кейсах луг рисуется вместо холма, а не вместе */
      const heavy = this.tier <= 5;
      this.walk = new Meadow(this.renderer, {
        /* v73.3: дальнего слоя нет — сверху его редкие крупные треугольники читались ёлочками; даль — гладкий луг
           (рельеф), а освободившиеся травинки ушли в ближний слой, передний план плотнее */
        near: small ? 110000 : 220000,
        far: 0,
        heightRes: small ? 256 : 384,
        shadows: heavy && !small,
      });
      this.walk.setDensity(this.ladder[this.tier][2]);
      const w = this.canvas.clientWidth || window.innerWidth, h = this.canvas.clientHeight || window.innerHeight;
      this.walk.setSize(w, h, this.dpr);
      if (this.signpost) this.walk.enableSignpost();
      this.walk.update(0);
      this.fx.params.altRender = (target, destination) => {
        if (destination) this.walk?.portal.setDestination(destination);
        this.walk?.render(target);
      };
      /* ?walkhold=1 — луг никогда не «готов»: проверить подложку .walk-wait */
      void this.walk.compile(this.fx.altTarget).then(() => { if (!this.disposed && !/[?&]walkhold=1/.test(location.search)) this.walkReady = true; }).catch(() => { this.walkReady = false; });
    }), { timeout: 1500 });
  }
  private applyDensity() {
    const [, , frac, rays] = this.ladder[this.tier];
    const k = frac * (this.bgCheap ? 0.35 : 1);
    for (const g of this.grassGeos) g.instanceCount = Math.round(g.userData.total * k);
    /* v72: травинок меньше — каждая шире (как у дальней травы, «сохранение покрытия» AMD GPUOpen): площадь дёрна
       ∝ число × ширина, поэтому ширина ∝ 1/√доли даёт то же покрытие без проплешин. Корень, а не прямая
       пропорция: вдвое реже и вдвое шире — это уже лента, а не трава. На телефоне на нижних ступенях между
       травинками была видна земля — «мало травы» */
    this.uniforms.uWiden.value = Math.min(1.6, 1 / Math.sqrt(Math.max(0.25, k)));
    if (this.stalkGeo) this.stalkGeo.instanceCount = Math.round(this.stalkCount * k);
    this.fx.params.raysEnabled = rays && !this.bgCheap;
    this.fx.params.bgCheap = this.bgCheap;
  }

  /** журнал смен ступени: [секунд с загрузки, ступень, откуда] — для замеров и ?debug=1 */
  readonly tierLog: string[] = [];
  private setTier(t: number, why: string) {
    this.tierLog.push(`${(performance.now() / 1000).toFixed(1)}s ${why} ${this.tier}→${t}`);
    this.tier = t;
    this.qualityScale = this.ladder[t][0];
    this.fx.setSamples(this.ladder[t][1]);
    this.tree?.setMsaa(this.ladder[t][1] > 0);
    this.uniforms.uNoMsaa.value = this.ladder[t][1] > 0 ? 0 : 1;
    /* травинки уже в случайном порядке (посадка отбором), так что любая начальная
       доля — равномерная выборка с той же зависимостью плотности от расстояния */
    this.applyDensity();
    this.walk?.setDensity(this.ladder[t][2]);
    this.resize();
  }

  private settle() {
    this.settled = true;
    this.resolveSettled();
  }
  get qualityTier() {
    return this.tier;
  }

  get pixelRatio() {
    return this.dpr;
  }

  /* Бенчмарк для замеров: N кадров подряд без rAF и vsync. После каждого кадра
     читаем один пиксель — readPixels ждёт видеокарту (gl.finish в Chrome не ждёт),
     поэтому время честное и не зависит от частоты экрана и видимости окна. */
  benchmark(frames = 60) {
    const gl = this.renderer.getContext();
    const px = new Uint8Array(4);
    const t0 = performance.now();
    for (let i = 0; i < frames; i++) {
      this.uniforms.uTime.value += 1 / 60;
      this.fx.render();
      gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
    }
    return (performance.now() - t0) / frames;
  }

  dispose() {
    this.disposed = true;
    this.walk?.dispose();
    this.draco.dispose();
    this.screen?.dispose();
    this.kinetic?.dispose();
    this.studio?.dispose();
    cancelAnimationFrame(this.raf);
    window.removeEventListener("resize", this.onWindowResize);
    clearTimeout(this.resizeTimer);
    window.removeEventListener("pointermove", this.onPointer);
    window.removeEventListener("pointerdown", this.onPointer);
    document.documentElement.removeEventListener("pointerleave", this.onLeave);
    window.removeEventListener("blur", this.onLeave);
    this.observer?.disconnect();
    this.canvas.removeEventListener("webglcontextlost", this.onContextLost);
    this.canvas.removeEventListener("webglcontextrestored", this.onContextRestored);
    this.timer.dispose();
    /* material.dispose() текстуры не освобождает — собираем их из свойств и униформ */
    const textures = new Set<THREE.Texture>();
    const collect = (v: unknown) => { if ((v as THREE.Texture)?.isTexture) textures.add(v as THREE.Texture); };
    this.scene.traverse((o) => {
      const mesh = o as THREE.Mesh;
      mesh.geometry?.dispose();
      const m = mesh.material as THREE.Material | THREE.Material[] | undefined;
      for (const mat of Array.isArray(m) ? m : m ? [m] : []) {
        Object.values(mat).forEach(collect);
        Object.values((mat as THREE.ShaderMaterial).uniforms ?? {}).forEach((u) => collect(u.value));
        mat.dispose();
      }
    });
    if (this.scene.environment) textures.add(this.scene.environment);
    textures.forEach((tex) => tex.dispose());
    this.shadowRT?.dispose();
    this.fx.dispose();
    this.renderer.dispose();
  }
}

function smooth(a: number, b: number, x: number) {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

/* травинка: три ступени и один общий кончик — 7 вершин, 5 треугольников.
   Вершинный шейдер — самое дорогое в сцене (замер: 700k травинок по 10 вершин
   давали 53 FPS при любом разрешении), поэтому лишние вершины здесь стоят дороже пикселей. */
function bladeGeometry() {
  const SEGS = 3;
  const verts: number[] = [], uvs: number[] = [], idx: number[] = [];
  for (let i = 0; i < SEGS; i++) {
    const t = i / SEGS;
    const w = 0.5 * (1 - Math.pow(t, 1.6));
    verts.push(-w, t, 0, w, t, 0);
    uvs.push(0, t, 1, t);
  }
  const tipIndex = SEGS * 2;
  verts.push(0, 1, 0);
  uvs.push(0.5, 1);
  for (let i = 0; i < SEGS - 1; i++) {
    const a = i * 2, b = a + 1, c = a + 2, d = a + 3;
    idx.push(a, b, c, b, d, c);
  }
  idx.push(tipIndex - 2, tipIndex - 1, tipIndex);
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  g.setIndex(idx);
  return g;
}

/* дальний LOD травинки: один треугольник — основание и кончик */
function bladeGeometryFar() {
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute([-0.5, 0, 0, 0.5, 0, 0, 0, 1, 0], 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute([0, 0, 1, 0, 0.5, 1], 2));
  g.setIndex([0, 1, 2]);
  return g;
}

/* Ячейка Вороного на решётке со случайным смещением центров: ближайший центр,
   его id и расстояние до него. Проверяем 3×3 соседних клетки. */
function voronoiCell(x: number, z: number, size: number, out: { cx: number; cz: number; id: number; dist: number }) {
  const gx = Math.floor(x / size), gz = Math.floor(z / size);
  let best = Infinity;
  for (let dz = -1; dz <= 1; dz++) {
    for (let dx = -1; dx <= 1; dx++) {
      const ix = gx + dx, iz = gz + dz;
      const id = (Math.imul(ix, 73856093) ^ Math.imul(iz, 19349663)) >>> 0;
      const cx = (ix + hash01(id, 7)) * size;
      const cz = (iz + hash01(id, 8)) * size;
      const d = (cx - x) * (cx - x) + (cz - z) * (cz - z);
      if (d < best) { best = d; out.cx = cx; out.cz = cz; out.id = id; }
    }
  }
  out.dist = Math.sqrt(best);
}

function hash01(id: number, salt: number) {
  let n = Math.imul(id ^ Math.imul(salt, 0x9e3779b1), 1274126177);
  n = Math.imul(n ^ (n >>> 15), 0x85ebca6b);
  return ((n ^ (n >>> 13)) >>> 0) / 4294967296;
}

/* насколько кочки (terrain.ts, heightAt) отклоняют высоту от купола: (fbm−0.5)·0.34 + (fbm−0.5)·0.06 ≤ 0.2, с запасом */
const BUMP = 0.21;

/* купол холма без мелких кочек — для дешёвого отсечения гребнем */
function domeAt(x: number, z: number) {
  return 2.3 * Math.exp(-((x * x) / 46.24 + (z * z) / 19.36));
}

/* Полевой цветок: тонкий стебель и венчик из двух плоскостей — горизонтальной
   и наклонённой к небу, чтобы с низкой камеры он не превращался в линию.
   aPart 4 — стебель, 6 — венчик; aLeafUV у венчика — координаты −1…1. */
function flowerGeometry() {
  const pos: number[] = [], part: number[] = [], luv: number[] = [], idx: number[] = [];
  const add = (x: number, y: number, z: number, pt: number, u: number, v: number) => {
    pos.push(x, y, z); part.push(pt); luv.push(u, v);
    return pos.length / 3 - 1;
  };
  const H = 0.24, w = 0.0012, R = 0.02;
  for (let q = 0; q < 2; q++) {
    const c = Math.cos(q * Math.PI / 2) * w, s = Math.sin(q * Math.PI / 2) * w;
    const a = add(-c, 0, -s, 4, 0, 0), b = add(c, 0, s, 4, 0, 0), e = add(c, H, s, 4, 0, 1), f = add(-c, H, -s, 4, 0, 1);
    idx.push(a, b, e, a, e, f);
  }
  for (const tilt of [0, 0.75]) {
    const ct = Math.cos(tilt), st = Math.sin(tilt);
    const corner = (u: number, v: number) => add(u * R, H + v * R * st, v * R * ct, 6, u, v);
    const a = corner(-1, -1), b = corner(1, -1), e = corner(1, 1), f = corner(-1, 1);
    idx.push(a, b, e, a, e, f);
  }
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("aPart", new THREE.Float32BufferAttribute(part, 1));
  g.setAttribute("aLeafUV", new THREE.Float32BufferAttribute(luv, 2));
  g.setIndex(idx);
  return g;
}

/* Стебель пампасной травы с метёлкой: стебель до 62% высоты и перистая метёлка
   из трёх скрещенных плоскостей, слегка отклонённая. aPart 4 и 5. */
function pampasGeometry() {
  const pos: number[] = [], part: number[] = [], luv: number[] = [], idx: number[] = [];
  const add = (x: number, y: number, z: number, pt: number, u: number, v: number) => {
    pos.push(x, y, z); part.push(pt); luv.push(u, v);
    return pos.length / 3 - 1;
  };
  /* v12: метёлки были 1.2–1.8 м и у переднего склона вставали выше кресла — теперь 0.55–0.85 м */
  const H = 0.8, p0 = H * 0.58, w = 0.006, W = 0.04, lean = 0.07;
  for (let q = 0; q < 2; q++) {
    const c = Math.cos(q * Math.PI / 2) * w, s = Math.sin(q * Math.PI / 2) * w;
    const a = add(-c, 0, -s, 4, 0, 0), b = add(c, 0, s, 4, 0, 0), e = add(c + lean * 0.3, p0, s, 4, 0, 1), f = add(-c + lean * 0.3, p0, -s, 4, 0, 1);
    idx.push(a, b, e, a, e, f);
  }
  const SEG = 4;
  for (let q = 0; q < 3; q++) {
    const yaw = (q / 3) * Math.PI, c = Math.cos(yaw), s = Math.sin(yaw);
    const rows: number[][] = [];
    for (let k = 0; k <= SEG; k++) {
      const t = k / SEG, y = p0 + (H - p0) * t, off = lean * (0.3 + 0.7 * t * t);
      rows.push([add(-c * W + off, y, -s * W, 5, -1, t), add(c * W + off, y, s * W, 5, 1, t)]);
    }
    for (let k = 0; k < SEG; k++) idx.push(rows[k][0], rows[k][1], rows[k + 1][1], rows[k][0], rows[k + 1][1], rows[k + 1][0]);
  }
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("aPart", new THREE.Float32BufferAttribute(part, 1));
  g.setAttribute("aLeafUV", new THREE.Float32BufferAttribute(luv, 2));
  g.setIndex(idx);
  return g;
}

/* Колосок: два скрещенных узких стебля и колос из двух скрещенных плоскостей
   в верхней части. aPart 4 — стебель, 3 — колос; aLeafUV у колоса: x поперёк, y вдоль. */
function stalkGeometry() {
  const pos: number[] = [], part: number[] = [], luv: number[] = [], idx: number[] = [];
  const add = (x: number, y: number, z: number, pt: number, u: number, v: number) => {
    pos.push(x, y, z); part.push(pt); luv.push(u, v);
    return pos.length / 3 - 1;
  };
  const H = 0.34, head0 = H * 0.74, stemW = 0.0011, headW = 0.0045;
  for (let q = 0; q < 2; q++) {
    const yaw = q * Math.PI / 2, c = Math.cos(yaw), s = Math.sin(yaw);
    /* стебель чуть изогнут: верх смещён, чтобы колосок не стоял палкой */
    const a = add(-c * stemW, 0, -s * stemW, 4, 0, 0), b = add(c * stemW, 0, s * stemW, 4, 0, 0);
    const e = add(c * stemW + 0.012, head0, s * stemW, 4, 0, 1), f = add(-c * stemW + 0.012, head0, -s * stemW, 4, 0, 1);
    idx.push(a, b, e, a, e, f);
    const g = add(-c * headW + 0.012, head0, -s * headW, 3, -1, 0), h = add(c * headW + 0.012, head0, s * headW, 3, 1, 0);
    const k = add(c * headW * 0.4 + 0.02, H, s * headW * 0.4, 3, 1, 1), l = add(-c * headW * 0.4 + 0.02, H, -s * headW * 0.4, 3, -1, 1);
    idx.push(g, h, k, g, k, l);
  }
  const geo = new THREE.InstancedBufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute("aPart", new THREE.Float32BufferAttribute(part, 1));
  geo.setAttribute("aLeafUV", new THREE.Float32BufferAttribute(luv, 2));
  geo.setIndex(idx);
  return geo;
}
