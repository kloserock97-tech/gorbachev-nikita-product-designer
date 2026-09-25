import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { fbm, heightAt, makeRng, normalAt } from "./terrain";
import { loadHdri } from "./hdri";
import { createPostFx, type PostFx } from "./postfx";
import { PortfolioScreen } from "./portfolioScreen";
import { Dog } from "./dog";
import { Weather, type WeatherKind } from "./weather";
import { CASES, CHAPTER, FOOTER, MEADOW_OUT, STORY, STORY_FX, TRANSITION, aberrationAt, bell, casesCamera, chapters, flightPose, footerCamera, ramp, storyCamera, zoomBlur, type Pose } from "./story";
import { Meadow } from "./meadow/Meadow";
import { SCROLL_LAMBDA } from "../scrollFeel";
import { KINETIC_BASE, KINETIC_FONT, createKinetic, type Kinetic } from "./kinetic";
import { Studio, projectBox, type HillLights } from "./studio";
import { QualityGovernor } from "./quality";
import { createPolaroid } from "./polaroid";
import { createVista } from "./vista";
import { createTree } from "./tree";
import { createRocks, rockFootprints } from "./rocks";
import {
  TRAIL_SLOTS,
  ghostFragment,
  ghostVertex,
  plantFragment,
  plantVertex,
  mistFragment,
  mistVertex,
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
const SUN_DIR = new THREE.Vector3(-0.08, 0.04, -1).normalize();
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
  private mistMats: THREE.ShaderMaterial[] = [];
  private dog?: Dog;
  /* один загрузчик на кресло, компьютер и собаку: все три GLB сжаты Draco, декодер
     берётся из three (DRACOLoader сам ссылается на свои файлы) и грузится один раз */
  private draco = new DRACOLoader();
  private gltfLoader = new GLTFLoader().setDRACOLoader(this.draco);
  private dpr = 1;
  private qualityScale = 1;

  private uniforms = {
    uTime: { value: 0 },
    uWind: { value: this.reduced ? 0.25 : 1 },
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
    uFogCol: { value: new THREE.Color("#eedcb8") },
    uShadowMap: { value: null as THREE.Texture | null },
    uShadowMatrix: { value: new THREE.Matrix4() },
    uShadowTexel: { value: 1 / 1024 },
    uShadowOn: { value: 0 },
    uBackLight: { value: /[?&]back=0/.test(location.search) ? 0 : 1 },
    uHaze: { value: /[?&]haze=0/.test(location.search) ? 0 : 1 },
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
    this.buildGhost();
    this.buildGround();
    this.buildGrass();
    this.buildPollen();
    this.buildMist();
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
      mist: this.mistMats,
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

    window.addEventListener("resize", this.resize);
    window.addEventListener("pointermove", this.onPointer, { passive: true });
    window.addEventListener("pointerdown", this.onPointer, { passive: true });
    document.documentElement.addEventListener("pointerleave", this.onLeave);
    window.addEventListener("blur", this.onLeave);
    this.restoreTier();
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
      + (this.pendingCompile === 0 ? .08 : 0) + (this.tierLocked ? .14 : 0);
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

  private sky!: THREE.ShaderMaterial;

  private buildSky() {
    this.sky = new THREE.ShaderMaterial({
      vertexShader: skyVertex,
      fragmentShader: skyFragment,
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: {
        uZenith: { value: new THREE.Color("#b3c1c8") },
        uHigh: { value: new THREE.Color("#d8ddd8") },
        uMid: { value: new THREE.Color("#efebdd") },
        uHorizon: { value: new THREE.Color("#f4d49a") },
        uGlow: { value: new THREE.Color("#f7c27e") },
        uSunDir: this.uniforms.uSunDir,
        uSunCol: { value: new THREE.Color(1.6, 1.15, 0.7) },
        uSunDisc: { value: 6 },
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
      sky: { uZenith: u.uZenith, uHigh: u.uHigh, uMid: u.uMid, uHorizon: u.uHorizon, uGlow: u.uGlow, uSunDir: u.uSunDir, uSunCol: u.uSunCol },
      sh: this.uniforms.uSH,
      ambient: this.uniforms.uAmbient,
    }));
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

  /* «SYLVA» у оригинала — огромное полупрозрачное слово за сценой; у нас оно
     стоит в воздухе за холмом, и гребень его частично закрывает */
  private buildGhost() {
    const c = document.createElement("canvas");
    c.width = 2048; c.height = 512;
    const g = c.getContext("2d")!;
    g.fillStyle = "#fff";
    g.font = "400 430px Onest, 'Segoe UI', sans-serif";
    g.textAlign = "center";
    g.textBaseline = "alphabetic";
    const draw = () => {
      g.clearRect(0, 0, c.width, c.height);
      (g as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = "40px";
      g.fillText("NIKITA", c.width / 2, 470);
      tex.needsUpdate = true;
    };
    const tex = new THREE.CanvasTexture(c);
    draw();
    document.fonts?.load("400 430px Onest").then(draw).catch(() => {});
    const mat = new THREE.ShaderMaterial({
      vertexShader: ghostVertex,
      fragmentShader: ghostFragment,
      transparent: true,
      depthWrite: false,
      uniforms: { uMap: { value: tex }, uColor: { value: new THREE.Color("#5d5a45") }, uOpacity: { value: 0.05 } },
    });
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(18, 4.5), mat);
    plane.position.set(0, 3.2, -16);
    plane.renderOrder = -5;
    this.scene.add(plane);
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
    return small ? 110_000 : 220_000;
  }

  private footprintWorld() {
    const c = Math.cos(PROPS_YAW), s = Math.sin(PROPS_YAW);
    return FOOTPRINTS.map(([x, z, rx, rz]) => ({ x: x * c + z * s, z: -x * s + z * c, rx, rz }));
  }

  private restPos = new THREE.Vector3();
  /* без выделения памяти: вызывается каждый кадр; кому нужна копия — клонирует */
  private cameraRest() {
    return this.restPos.lerpVectors(CAMERA_PIVOT, CAMERA_BASE, this.camDistance).add(CAMERA_REST_OFF);
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
    this.setTier(this.tier);
  }

  private buildGrass() {
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
    let k = 0, guard = 0;
    while (k < count && guard < count * 25) {
      guard++;
      let x = X0 + (X1 - X0) * rng();
      let z = Z0 + (Z1 - Z0) * rng();
      const h0 = heightAt(x, z);
      const d0 = Math.hypot(x - cam.x, h0 - cam.y, z - cam.z);
      if (d0 < (this.opts.fixedCamera ? 0.05 : 1.2)) continue;
      /* Плотность ∝ ~1/d²: так на экран приходится примерно одинаково травинок
         на пиксель по всей глубине. Раньше до 8.5 м плотность на метр была
         постоянной, и низ кадра (ближняя трава) получал меньше травинок на
         экранную площадь, чем даль — отсюда просветы дёрна внизу. */
      const density = Math.min(1, Math.pow(5.2 / d0, 1.8));
      /* прогалины — только лёгкие разрежения, без проплешин до земли */
      /* v44: посадка — 0,5 с главного потока на загрузке. Случайное число берём до шума прогалин: bare ≤ 1, поэтому
         при r > density кандидат отброшен при любом шуме, и три октавы fbm для него не считаем (дальние кандидаты
         отсеиваются почти все). Высота для проверки видимости — уже посчитанная. Порядок rng() и результат те же. */
      const r = rng();
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
      let len = (0.09 + 0.09 * rng()) * this.lenScale * (0.75 + 0.5 * fbm(x * 1.2 - 5.0, z * 1.2 + 9.0, 2)) * (0.88 + 0.26 * hash01(clump.id, 1));
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

  /* Дымка: вертикальные «простыни» тумана поперёк склона, от гребня к камере.
     Шум плывёт по ветру; низ мягко уходит в землю. Полупрозрачные, без записи
     глубины — стоят копейки, но склон перестаёт быть стерильным. */
  private buildMist() {
    if (/[?&]haze=0/.test(location.search)) return;
    const rows = [
      { z: -2.6, w: 26, h: 2.2, o: 0.2 },
      { z: -0.6, w: 22, h: 1.6, o: 0.12 },
      { z: 1.8, w: 22, h: 1.3, o: 0.1 },
      { z: 4.2, w: 24, h: 1.1, o: 0.07 },
    ];
    rows.forEach((r, i) => {
      const mat = new THREE.ShaderMaterial({
        vertexShader: mistVertex,
        fragmentShader: mistFragment,
        transparent: true,
        depthWrite: false,
        uniforms: {
          uTime: this.uniforms.uTime,
          uWindDir: this.uniforms.uWindDir,
          uColor: { value: new THREE.Color(1.05, 0.93, 0.76) },
          uOpacity: { value: r.o },
          uSeed: { value: i * 17.3 },
        },
      });
      const plane = new THREE.Mesh(new THREE.PlaneGeometry(r.w, r.h), mat);
      plane.position.set(0, heightAt(0, r.z) + r.h * 0.3, r.z);
      plane.renderOrder = 3;
      this.mistMats.push(mat);
      this.scene.add(plane);
    });
  }

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
  private driftSeeds(dt: number) {
    if (this.reduced || /[?&]wind=0/.test(location.search)) return;
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
        this.uniforms.uSunCol.value.copy(h.sunColor).multiplyScalar(2.4);
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
    /* v43: та же постоянная, что у мягкого колеса на страницах кейсов (ui/smoothScroll.ts) */
    this.storyS += (target - this.storyS) * (1 - Math.exp(-dt * SCROLL_LAMBDA));
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
    this.storyTear = c > 0 ? -0.12 + tearK * 1.32 : -1;
    fx.tear = this.storyTear;
    /* v32: с лугом кадр под заставкой резкий, размытие — перед лентой (CASES.blur); без луга (?walk=0 или не успел
       собраться) холм размывается сразу, как раньше: резкий холм с MSAA на весь кадр стоит ~25 мс против ~4,5 */
    const walkOn = this.walkReady && !this.walkOff;
    const bu = walkOn ? ramp(c, ...CASES.blur) : ramp(c, 0, 0.04);
    const ub = ramp(f, ...FOOTER.unblur);
    fx.bgBlur = (this.reduced ? 0.7 : 1) * bu * bu * (3 - 2 * bu) * (1 - ub * ub * (3 - 2 * ub));
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
    const alt = c > 0 && this.walkReady ? 1 - wo * wo * (3 - 2 * wo) : 0;
    fx.alt = alt;
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
    fx.radial = this.reduced ? 0 : zoomBlur(fu);
    fx.aberration = this.reduced ? 0 : aberrationAt(fu);
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
      /* ушёл за верх кадра вместе со страницей — в главе «Кейсы» не рисуется и в сцене; в футере снова на столике */
      this.pc.visible = this.storyTear < 1.18 || f > 0;
      fx.overlay = overlay;
    }
    this.screen.setPhoto(ramp(s, ...STORY.photo), Math.max(bell(s, 0.24, 0.32, 0.42) * 0.55, bell(s, ...STORY.static)));

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
    if (slot && slot.bottom - slot.top > 120) {
      /* v43: на вертикальном экране компьютер вписывается в свободное место между текстами страницы About.
         Расстояние — из габарита компьютера и высоты промежутка (и ширины окна), сдвиг по высоте — к центру
         промежутка. Раньше стоял на фиксированных 1,95 м по центру кадра и на невысоких телефонах закрывал
         нижний абзац. */
      const c = this.canvasRect;
      const tanH = Math.tan(THREE.MathUtils.degToRad(this.camera.fov) / 2);
      const size = this.storyTmp3.copy(this.pcLocalBox.max).sub(this.pcLocalBox.min).multiply(this.pc.scale);
      const fitH = (size.y * c.height) / (2 * tanH * (slot.bottom - slot.top));
      const fitW = size.x / (2 * tanH * this.camera.aspect * 0.8);
      /* ближняя грань ближе центра и выглядит крупнее — запас 12 % */
      dist = Math.min(3.4, Math.max(1.5, Math.max(fitH, fitW) * 1.12));
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
    /* остановился — чуть «дышит», чтобы не выглядел наклейкой */
    const hover = ramp(u, 0.9, 1) * (this.reduced ? 0 : 1);
    pose.pos.y += Math.sin(t * 1.3) * 0.01 * hover;
    pose.yaw += Math.sin(t * 0.7) * 0.025 * hover;
    /* v17: встал — поворачивается за курсором, как предмет в руках (oryzo) */
    const tiltOn = this.reduced ? 0 : ramp(u, 0.8, 1);
    const tk = 1 - Math.exp(-dt * 4);
    this.pcTilt.x += (this.pointer.x * tiltOn - this.pcTilt.x) * tk;
    this.pcTilt.y += (this.pointer.y * tiltOn - this.pcTilt.y) * tk;
    pose.yaw += this.pcTilt.x * 0.22;
    pose.pitch -= this.pcTilt.y * 0.1;
    /* v18: на странице About поворачивается по скроллу — показывает бок и возвращается к зрителю */
    if (STORY_FX.spin && !this.reduced) {
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
    if (this.pcBox.isEmpty()) this.pcBox.setFromObject(this.pc).expandByScalar(0.03);
    return this.raycaster.ray.intersectsBox(this.pcBox);
  }

  setComputerFocus(on: boolean) {
    if (!this.pc || !this.screenMesh || this.focusOn === on) return;
    if (on && this.storyCh1 > 0.02) return; // компьютер в полёте или перед зрителем
    this.focusOn = on;
    this.screen?.setActive(on);
    if (on) this.computeFocusPose();
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
  /** v24: интерфейс показан раньше калибровки (медленная сеть: модели и HDRI ещё едут) — пока не
      откалибровались, стоим на осторожной ступени, а не на самой тяжёлой: на бюджетном телефоне первые
      секунды истории шли на ступени 0 по 13 кадров */
  provisionalTier() {
    if (this.tierLocked) return;
    const nav = navigator as Navigator & { deviceMemory?: number };
    const weak = matchMedia("(pointer: coarse)").matches || (navigator.hardwareConcurrency ?? 8) <= 4 || (nav.deviceMemory ?? 8) <= 4;
    const t = weak ? 6 : 4;
    if (this.tier < t) {
      this.setTier(t, "provisional");
      this.calibSkip = 6;
      this.calibFrames = [];
    }
  }

  /** v24: сцена не справляется — main.ts переводит страницу в лёгкую версию без 3D */
  onDegrade?: (why: "slow" | "context") => void;
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
    if (forced > 0) { this.dprMax = forced; this.qualityScale = 1; if (!this.tierLocked) this.lockTier(false); }
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
    this.camDistance = aspect < 1 ? Math.min(1.5, 1 + (1 - aspect) * 0.9) : 1;
    /* v72: на вертикальном экране камера отъезжает на ~6 м, и дымка по расстоянию (airFog) густела на весь
       склон — цвет на телефоне был блёклым, серо-оливковым. Дымку сдвигаем на величину отъезда: склон в том же
       воздухе, что на широком экране, дальний план — по-прежнему в дымке */
    this.uniforms.uFogShift.value = (this.camDistance - 1) * CAMERA_BASE.distanceTo(CAMERA_PIVOT);
    /* v68: боковой разворот кадра — только там, где для него есть ширина. На вертикальном экране
       угол обзора по горизонтали втрое уже, и тот же разворот вынес бы кресло с компьютером за
       правую кромку. Поэтому на телефоне кадр остаётся прежним, центральным, а к широкому экрану
       разворот набирается плавно: композиция по золотому сечению — про широкий кадр. */
    const panK = Math.min(1, Math.max(0, (aspect - 0.6) / 0.7));
    CAMERA_REST_OFF.x = 0.6 + (CAMERA_PAN.x - 0.6) * panK;
    CAMERA_TARGET.x = 0.2 + (CAMERA_PAN.y - 0.2) * panK;
    const panMoved = Math.abs(panK - this.plantedFor.pan) > 0.04;
    /* Поворот телефона или сужение окна отодвигает камеру — передний склон, посаженный под
       прежнюю позу, остался бы голым. Шире 16:9 × 1.2 — не хватит травы по бокам. */
    const planted = this.plantedFor;
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
    /* во время калибровки потолка нет — иначе интервалы упрутся в 60 Гц */
    const since = now - this.lastRafAt;
    this.lastRafAt = now;
    if (this.frameInterval > 0 && this.tierLocked) {
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
    const lookAt = this.pc && this.storyCh1 > 0.1 && this.storyCh2 <= 0 && this.storyCh3 <= 0 ? this.pc.position : this.headLive && !this.focusOn ? this.head.pos : null;
    /* v24: в дождь — кепка с зонтиком; в футере Келли спит клубочком на кресле (с запасом, чтобы не дёргалась на границе) */
    const sleep = this.dog?.isSleeping ? this.storyCh3 > 0.06 : this.storyCh3 > 0.12;
    this.dog?.update(dt, lookAt, this.camera.position, { rain: this.weather.kind === "rain", sleep });

    this.uniforms.uWind.value = (this.reduced ? 0.25 : 1) * this.weather.windScale + this.gustAmount(this.uniforms.uTime.value);
    /* пока играет интро, экспозицией и цветом постобработки управляет оно */
    this.weather.update(dt, true);
    this.updateStory(dt);

    const fixed = this.opts.fixedCamera;
    if (fixed) {
      this.camera.position.set(fixed[0], fixed[1], fixed[2]);
      this.camera.lookAt(fixed[3], fixed[4], fixed[5]);
    } else {
      this.pointerSmooth.lerp(this.pointer, 1 - Math.exp(-dt * 2.5));
      /* параллакс гаснет в главе 1 и возвращается в «Кейсах» */
      const par = (this.reduced ? 0 : 1) * Math.max(1 - ramp(this.storyCh1, 0, 0.1), ramp(this.storyCh2, 0.1, 0.3) * (1 - ramp(this.storyCh3, 0.02, 0.2)), ramp(this.storyCh3, 0.5, 0.7));
      const rest = this.storyS > 0 ? this.cameraRest().copy(this.storyCamPos) : this.cameraRest();
      /* у экрана параллакс гаснет, иначе журнал «плавает» под курсором */
      const hold = 1 - this.focus;
      rest.set(rest.x - this.pointerSmooth.x * 0.5 * par * hold, rest.y + this.pointerSmooth.y * 0.2 * par * hold, rest.z);
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
      this.onStoryFrame?.();
    }
    this.updateCursor(dt);
    this.driftSeeds(dt);
    /* регулятор качества меряет видеокарту только на спокойном холме (quality.ts) */
    if (!this.shadersReady || this.pendingCompile > 0) return;
    if (this.walk && this.fx.params.alt > 0) {
      /* курсор над лугом пускает волны по траве; сенсорный экран — без волн */
      this.walk.setPointer(this.ndc.x < 2 && !this.reduced ? this.ndc : null);
      this.walk.update(dt);
    }
    const gov = this.governor;
    gov?.begin();
    this.fx.render();
    this.renderedFrames++;
    if (this.assetsReady >= 2) this.resolvePresentation();
    gov?.end();
    if (gov && !gov.asleep) {
      const idle = this.storyS === 0 && this.focus === 0 && !document.hidden;
      const next = gov.poll(this.tier, idle, dt);
      if (next !== null) {
        this.setTier(next, "governor");
        try { localStorage.setItem(this.tierKey(), JSON.stringify({ tier: this.tier, at: Date.now() })); } catch { /* ничего */ }
      }
    }
    if (!this.storyWarm && this.tierLocked && this.pc && this.assetsReady >= 2) this.warmStory();
    /* калибровка — после компиляции шейдеров, пока UI ещё проявляется */
    if (!this.tierLocked && this.assetsReady === 2) {
      /* ждём секунду после загрузки кресла и HDRI: PMREM, декодирование Draco и
         компиляция материалов иначе попадают в замер и роняют ступень до пола */
      this.calibrateDelay -= dt;
      if (this.calibrateDelay <= 0) this.calibrate(now);
    }
  };

  /* Ступени качества вместо непрерывной подстройки. Раньше DPR менялся раз в
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
  private static readonly PHONE_LADDER: [number, number, number, boolean][] = [
    [1, 4, 1, true], [0.9, 4, 0.9, true], [0.82, 4, 0.8, true], [0.76, 4, 0.75, true],
    [0.76, 2, 0.65, true], [0.7, 2, 0.62, false], [0.76, 0, 0.6, false], [0.7, 0, 0.55, false], [0.65, 0, 0.5, false],
  ];
  /* телефон или планшет: основной указатель — палец, мыши нет */
  private readonly phone = matchMedia("(pointer: coarse)").matches && !matchMedia("(any-pointer: fine)").matches;
  private readonly ladder = this.phone ? HillScene.PHONE_LADDER : HillScene.LADDER;
  /* полный кадр 60 Гц: бенчмарк ждёт всю очередь видеокарты, включая кнопки UI */
  /* медиана интервала кадров; 18 мс — с запасом над 16.7 мс экрана 60 Гц,
     где быстрее vsync интервал всё равно не станет */
  private static readonly BUDGET_MS = 18;
  private static readonly TOO_SLOW_MS = 45;
  private tier = 0;
  private tierLocked = false;
  private retried = false;
  private predicted = false;
  private climbs = 0;
  private climbFailed = false;
  private fallbackTier = -1;
  private assetsReady = 0; // кресло и HDRI
  private calibrateDelay = 0.3;
  readonly calibrationLog: [number, number, number][] = []; // [dpr, мс, время сцены] — для замеров
  /* UI проявляется только после калибровки: CSS-маски входа нагружают ту же
     видеокарту и завышали замер (ступень падала до DPR 1.0) */
  private resolveCalibrated!: () => void;
  readonly calibrated = new Promise<void>((r) => (this.resolveCalibrated = r));
  private dprMax = 1;

  private tierKey() {
    const gl = this.renderer.getContext();
    const ext = gl.getExtension("WEBGL_debug_renderer_info");
    const gpu = ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : "gpu";
    /* v3 — версия рендер-пайплайна: при его изменении старые ступени недействительны */
    return `hill-tier:v17:${gpu}:${screen.width}x${screen.height}@${window.devicePixelRatio}:${this.bladeTotal}`;
  }

  private static readonly TIER_TTL = 14 * 24 * 3600 * 1000;
  private restoreTier() {
    if (this.tierLocked) return; // ?dpr= — ручной режим для замеров
    /* v44: ?tier=0…8 — поставить ступень руками (посмотреть, что видит слабый компьютер); регулятор выключен */
    const forcedTier = new URLSearchParams(location.search).get("tier");
    if (forcedTier !== null && Number.isInteger(+forcedTier) && +forcedTier >= 0 && +forcedTier < this.ladder.length) {
      this.setTier(+forcedTier, "param");
      this.lockTier(false);
      return;
    }
    if (/[?&]recalibrate=1/.test(location.search)) return;
    try {
      /* ступень хранится со временем замера: одна неудачная калибровка (занятая видеокарта,
         ноутбук на батарее) не должна навсегда держать устройство на низкой ступени —
         через две недели меряем заново */
      const raw = JSON.parse(localStorage.getItem(this.tierKey()) ?? "null") as { tier: number; at: number } | null;
      const fresh = raw && Date.now() - raw.at < HillScene.TIER_TTL;
      if (fresh && Number.isInteger(raw.tier) && raw.tier >= 0 && raw.tier < this.ladder.length) {
        this.setTier(raw.tier, "restore");
        this.lockTier(false);
      }
    } catch { /* приватный режим или старый формат — просто меряем заново */ }
  }

  /* густота травы и лучи: ступень качества × облегчение под размытием кейсов (v25) */
  private bgCheap = false;
  /* v32: луг Meadow Walk — фон главы «Кейсы» (scene/meadow). Создаётся заранее, пока читают About, в простое;
     шейдеры прогреваются в его буфер. Не готов вовремя или ?walk=0 — в кейсах, как раньше, холм */
  private walk?: Meadow;
  private walkReady = false;
  private walkStarted = false;
  private readonly walkOff = new URLSearchParams(location.search).get("walk") === "0";
  private readonly vignetteBase = 0.55;
  private ensureWalk() {
    if (this.walkStarted || this.walkOff || !this.tierLocked || this.storyS < CHAPTER - 0.12) return;
    this.walkStarted = true;
    const idle = (window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number }).requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 0));
    idle(() => {
      if (this.disposed) return;
      const small = Math.min(window.innerWidth, window.innerHeight) < 700 || matchMedia("(pointer: coarse)").matches;
      /* травы столько же, сколько у холма (220k/110k), — в кейсах луг рисуется вместо холма, а не вместе */
      const heavy = this.tier <= 5;
      this.walk = new Meadow(this.renderer, {
        near: small ? 80000 : 160000,
        far: small ? 30000 : 60000,
        heightRes: small ? 256 : 384,
        shadows: heavy && !small,
      });
      this.walk.setDensity(this.ladder[this.tier][2]);
      const w = this.canvas.clientWidth || window.innerWidth, h = this.canvas.clientHeight || window.innerHeight;
      this.walk.setSize(w, h, this.dpr);
      this.walk.update(0);
      this.fx.params.altRender = (target) => this.walk?.render(target);
      void this.walk.compile(this.fx.altTarget).then(() => { if (!this.disposed) this.walkReady = true; }).catch(() => { this.walkReady = false; });
    }, { timeout: 1500 });
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
  private setTier(t: number, why = "calibrate") {
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

  /* Замер — медиана реальных интервалов между кадрами (без потолка FPS), а не
     readPixels: на гибридной графике (RTX рисует, Intel выводит) синхронное чтение
     пикселя то раздувало время в разы, то подвешивало страницу. Если видеокарта не
     успевает, браузер сам растягивает кадры — это и есть то, что видит человек. */
  private calibFrames: number[] = [];
  private calibLast = 0;
  private calibSkip = 6;

  private calibrate(now: number) {
    if (this.tierLocked) return;
    if (this.opts.fixedCamera) { this.lockTier(false); return; }
    if (Number(new URLSearchParams(location.search).get("dpr")) > 0) { this.lockTier(false); return; }
    /* после смены ступени пропускаем кадры: пересоздание буферов и прогрев */
    if (this.calibSkip > 0) { this.calibSkip--; this.calibLast = now; return; }
    this.calibFrames.push(now - this.calibLast);
    this.calibLast = now;
    if (this.calibFrames.length < 20) return;
    const sorted = this.calibFrames.slice().sort((a, b) => a - b);
    /* v22.2: кадр, упёршийся в развёртку экрана, укладывается в бюджет. На 55 Гц медиана 18.2 мс —
       чуть выше прежнего бюджета 18, и ступень падала до DPR 1.35 без лучей («качество упало»).
       Быстрейший из 20 интервалов ≈ период развёртки, если GPU успевает; бюджет — не меньше него + 10% */
    const vsync = sorted[1];
    const raw = sorted[sorted.length >> 1];
    const budget = vsync > 12 && vsync < 19 ? Math.max(HillScene.BUDGET_MS, vsync * 1.1) : HillScene.BUDGET_MS;
    const ms = raw * (HillScene.BUDGET_MS / budget);
    this.calibFrames = [];
    this.calibSkip = 6;
    this.calibrationLog.push([+this.dpr.toFixed(2), +ms.toFixed(1), +this.uniforms.uTime.value.toFixed(1)]);
    /* чуть выше бюджета — возможно, случайная помеха (видеокарта общая); перемеряем один раз */
    if (ms > HillScene.BUDGET_MS && ms < HillScene.BUDGET_MS * 1.15 && !this.retried) {
      this.retried = true;
      return;
    }
    this.retried = false;
    /* Первый замер — на верхней ступени. Остальные не перебираем по одной
       (на Intel это ~4 с до показа сцены), а прогнозируем: вершинная часть
       травы от разрешения не зависит (~35%), пиксельная растёт как DPR² и
       чуть дешевле с MSAA 2×. Прыгаем на подходящую ступень и перемеряем. */
    if (!this.predicted && ms > HillScene.BUDGET_MS) {
      this.predicted = true;
      const [s0, m0] = this.ladder[this.tier];
      /* вершинная часть ∝ доле травинок, пиксельная ∝ DPR² и числу сэмплов */
      const msaaFactor = (m: number) => (m === m0 ? 1 : m === 0 ? 0.6 : m < m0 ? 0.82 : 1.2);
      const cost = (s: number, m: number, b: number) => 0.35 * b + 0.65 * ((s * s) / (s0 * s0)) * msaaFactor(m);
      let t = this.tier;
      while (t < this.ladder.length - 1 && ms * cost(this.ladder[t][0], this.ladder[t][1], this.ladder[t][2]) > HillScene.BUDGET_MS) t++;
      this.setTier(t);
      return;
    }
    /* проба ступенью выше не удалась — возвращаемся и больше не поднимаемся */
    if (this.fallbackTier >= 0 && ms > HillScene.BUDGET_MS) {
      this.climbFailed = true;
      this.setTier(this.fallbackTier);
      this.fallbackTier = -1;
      return;
    }
    if (ms > HillScene.BUDGET_MS && this.tier < this.ladder.length - 1) {
      this.setTier(this.tier + 1);
      return; // следующий кадр перемеряет на новой ступени
    }
    /* v72: подъём, пока есть запас. Раньше была одна проба вверх и только после прогноза, с условием «медиана
       меньше 14 мс». На экране 60 Гц интервал кадра не бывает короче 16.7 мс, так что условие не выполнялось
       никогда: телефон, опущенный на осторожную ступень (интерфейс показан до калибровки — медленная сеть),
       так на ней и оставался. iPhone 11 получал треть травы и сцену в DPR 1.2. Теперь запас — это либо
       короткий кадр, либо кадры без пропусков: 85 % интервалов в пределах развёртки. Тогда пробуем ступень
       выше, до пяти раз; первая же проба с пропусками возвращает на прежнюю и калибровка заканчивается */
    const onTime = vsync > 12 && vsync < 19 && sorted[Math.floor(sorted.length * 0.85)] < vsync * 1.25;
    const headroom = ms < HillScene.BUDGET_MS * 0.78 || onTime;
    if (!this.climbFailed && this.climbs < 5 && this.tier > 0 && headroom) {
      this.climbs++;
      this.fallbackTier = this.tier;
      this.setTier(this.tier - 1);
      return;
    }
    this.fallbackTier = -1;
    /* v24: даже нижняя ступень дольше 45 мс (меньше 22 кадров) — на скролле будет ~13 (бюджетный Android
       в нагрузочном прогоне); такому устройству лучше лёгкая версия */
    if (this.tier === this.ladder.length - 1 && ms > HillScene.TOO_SLOW_MS && !/[?&]lite=0/.test(location.search)) {
      this.lockTier(false);
      this.onDegrade?.("slow");
      return;
    }
    this.lockTier(true);
  }

  private governor: QualityGovernor | null = null;
  private lockTier(save: boolean) {
    this.tierLocked = true;
    const manual = this.opts.fixedCamera || Number(new URLSearchParams(location.search).get("dpr")) > 0 || /[?&](governor=0|tier=d)/.test(location.search);
    if (!manual && !this.governor) this.governor = new QualityGovernor(this.renderer.getContext() as WebGL2RenderingContext, this.ladder);
    if (save) try { localStorage.setItem(this.tierKey(), JSON.stringify({ tier: this.tier, at: Date.now() })); } catch { /* ничего */ }
    this.resolveCalibrated();
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
    window.removeEventListener("resize", this.resize);
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
