import * as THREE from "three";
import { FullScreenQuad } from "three/examples/jsm/postprocessing/Pass.js";
import { finalFragment, fullscreenVertex, godBlurFragment, godMaskFragment, quarterFragment } from "./shaders";
import { TRANSITION } from "./story";

/* Постобработка — своя короткая цепочка вместо EffectComposer.
   Замеры на Intel Arc (экран 2.25, readPixels-бенчмарк) показали, что дороги
   не эффекты, а полноэкранные записи в MSAA-буфер: EffectComposer держит два
   MSAA-буфера и гоняет кадр между ними. Здесь полный кадр пишется дважды —
   сцена в MSAA-буфер и финал на экран, — а лучи считаются на четверти разрешения.

   Отладка: ?msaa=0|2|4, ?rays=0, ?grain=0. Bloom убран: он размазывал ореол
   солнца по гребню и давал светящийся контур холма. */

export type PostFx = {
  /* dpr — разрешение сцены; canvasDpr — канваса (родной DPR экрана) */
  setSize: (w: number, h: number, dpr: number, canvasDpr: number) => void;
  /* MSAA меняется ступенью качества; ?msaa= в адресе имеет приоритет */
  setSamples: (n: number) => void;
  render: () => void;
  /* заранее выделить буфер прохода компьютера — чтобы не на скролле */
  warm: () => void;
  /** шейдеры проходов — параллельно, до первого кадра (v24) */
  compileAsync: () => Promise<unknown>;
  /* буфер, в который реально рисуется сцена, — компилировать материалы нужно с ним: у вывода на экран
     и в HDR-буфер разные программы (тонмаппинг, цветовое пространство), и прогрев «для экрана» не пригождался */
  compileTarget: THREE.WebGLRenderTarget;
  /** v32: буфер луга (для прогрева его шейдеров) */
  altTarget: THREE.WebGLRenderTarget;
  dispose: () => void;
  params: { rays: number; raysEnabled: boolean;
    bgCheap: boolean; exposure: number; vignette: number; vibrance: number; contrast: number; focus: number; whiteBalance: THREE.Vector3; glitch: number; glitchSeed: number; black: number; radial: number; aberration: number; fill: number; overlay: boolean;
    /* v17, светлая страница с глубиной (как oryzo): studio 0…1 — сила студийного фона,
       pcRect — прямоугольник компьютера в UV кадра (x0, y0, x1, y1), spot — центр светового пятна */
    studio: number; pcRect: THREE.Vector4; spot: THREE.Vector2;
    /* v18: бегущая строка за компьютером (текстура, доля ширины/высоты, сдвиг, центр по y, высота полосы) */
    kinetic: number; kineticTex: THREE.Texture | null; kineticRatio: number; kineticShift: number; kineticY: number; kineticH: number;
    /* v19: при превращении в заголовок остаётся только «Hi there!» копии N: (N, доля ширины, сила) */
    kineticKeep: THREE.Vector3;
    /* v19, глава «Кейсы»: tear — нижний край оторванной страницы в долях высоты кадра (≤0 — цела),
       bgBlur 0…1 — размытие сцены-фона, overlayCamera — камера страницы для прохода компьютера */
    tear: number; bgBlur: number; overlayCamera: THREE.Camera | null;
    /* v32: второй фон главы «Кейсы» (луг Meadow Walk). alt 0…1 — его доля; altRender рисует его в переданный буфер */
    alt: number; altRender: ((target: THREE.WebGLRenderTarget) => void) | null;
    /* до и после прохода компьютера — сцена подменяет ему свет и окружение */
    onOverlay?: (before: boolean) => void };
};

export function createPostFx(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera,
  sunDir: THREE.Vector3,
  /* слой, который скролл-история рисует отдельным проходом поверх заливки (компьютер) */
  overlayLayer = 5,
  /* v72: слой ближних предметов (кресло, столик, компьютер, собака), над которыми лучи приглушаются */
  shieldLayer = 6,
): PostFx {
  const q = new URLSearchParams(location.search);
  const forcedSamples = q.has("msaa") ? Number(q.get("msaa")) : null;
  const samples = forcedSamples ?? 4;
  const raysOn = q.get("rays") !== "0";
  /* ширина ореола солнца в маске лучей: чем меньше, тем дальше веер достаёт от солнца за кромкой кадра */
  const lum = (q.get("raysmask")?.split(",").map(Number).filter(Number.isFinite) ?? []).length === 2 ? (q.get("raysmask")!.split(",").map(Number) as [number, number]) : ([0.85, 2.2] as [number, number]);
  const halo = q.has("rayshalo") && Number.isFinite(Number(q.get("rayshalo"))) ? Number(q.get("rayshalo")) : 5;
  /* с какого выхода солнца за кромку кадра лучи начинают гаснуть и где гаснут совсем */
  const raysFade = (q.get("raysoff")?.split(",").map(Number).filter(Number.isFinite) ?? []).length === 2
    ? (q.get("raysoff")!.split(",").map(Number) as [number, number])
    : ([1.6, 2.7] as [number, number]);

  /* HDR-буфер с MSAA: тонкая трава без него искрит.
     Пробовали R11F_G11F_B10F (вдвое меньше видеопамяти): three создаёт MSAA-рендербуфер
     в RGBA16F, а текстуру в R11F — кадровый буфер неполный, GL 1286 каждый кадр. Оставлен RGBA16F. */
  const sceneRT = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples });
  /* v22.1: задник главы «Кейсы» — половинное разрешение без MSAA. Под размытием полноразмерная трава
     с MSAA не видна, а стоила дороже самого холма (замер с readPixels: кейсы 20 мс против холма 17) —
     прокрутка кейсов тормозила. Вчетверо меньше пикселей, картинка после размытия та же */
  const bgRT = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 0 });
  /* четверть разрешения: размытый задник и мягкая тень компьютера (quarterFragment) */
  const bgBlurRT = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, depthBuffer: false });
  const shadowRT = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, depthBuffer: false });
  let sharp = 0;
  const edgeAA = new URLSearchParams(location.search).has("edgeaa") ? Number(new URLSearchParams(location.search).get("edgeaa")) : null;
  const small = { type: THREE.HalfFloatType, depthBuffer: false };
  const maskRT = new THREE.WebGLRenderTarget(1, 1, small);
  const blurA = new THREE.WebGLRenderTarget(1, 1, small);
  const blurB = new THREE.WebGLRenderTarget(1, 1, small);
  /* v72: маска ближних предметов в четверти разрешения. Лучи прибавлялись поверх всего кадра, и компьютер с
     креслом, стоящие у самого солнца, тонули в светлой дымке: контраст падал, края расплывались, а на глаз это
     читалось как «пиксельный» реквизит. Настоящий воздух между камерой и креслом в двенадцать метров столько
     не светит — над предметами лучи остаются слабым отсветом. Четверть разрешения даёт мягкий край маски */
  const shieldRT = new THREE.WebGLRenderTarget(1, 1, { type: THREE.UnsignedByteType, depthBuffer: false });
  const shieldMat = new THREE.MeshBasicMaterial({ color: 0xffffff, fog: false });
  const shieldOn = q.get("shield") !== "0";
  /* компьютер поверх заливки: свой MSAA-буфер с прозрачным фоном */
  const pcRT = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples });
  /* v25: финал поверх полностью размытого фона кейсов — в половине разрешения экрана и растяжкой на экран.
     Финальный шейдер сам делает тонмаппинг и вывод sRGB, так что обычный 8-битный буфер ничего не меняет */
  const halfRT = new THREE.WebGLRenderTarget(1, 1, { depthBuffer: false });
  /* v32: луг — без MSAA, чуть ниже разрешения сцены (как и в самом Meadow Walk, сглаживание не нужно под зерном);
     altBgRT/altBlurRT — его размытый вариант, пока на выходе из кейсов смешиваем с холмом */
  const altRT = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 0 });
  const altBgRT = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 0 });
  const altBlurRT = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, depthBuffer: false });
  const clear = new THREE.Color();

  const sunUv = new THREE.Vector2(0.5, 0.5);
  const flat = { depthTest: false, depthWrite: false, vertexShader: fullscreenVertex };
  const mask = new THREE.ShaderMaterial({
    ...flat,
    fragmentShader: godMaskFragment,
    uniforms: { tColor: { value: sceneRT.texture }, uSun: { value: sunUv }, uAspect: { value: 1 }, uHalo: { value: halo }, uLumLo: { value: lum[0] }, uLumHi: { value: lum[1] } },
  });
  const quarter = new THREE.ShaderMaterial({
    depthTest: false, depthWrite: false, vertexShader: fullscreenVertex,
    fragmentShader: quarterFragment,
    uniforms: { tInput: { value: null }, uR: { value: 0 }, uAspect: { value: 1 }, uMode: { value: 0 } },
  });
  const blur = new THREE.ShaderMaterial({
    ...flat,
    fragmentShader: godBlurFragment,
    uniforms: { tInput: { value: null }, uSun: { value: sunUv }, uStep: { value: 1 }, uDecay: { value: 0.96 } },
  });
  /* ?tone=neutral|agx|punchy — сравнение тонмапперов; по умолчанию Neutral */
  const toneMode = ({ neutral: 0, agx: 1, punchy: 2 } as Record<string, number>)[q.get("tone") ?? ""] ?? 0;
  const params = {
    rays: 0.32,
    raysEnabled: true,
    bgCheap: false,
    exposure: renderer.toneMappingExposure,
    vignette: 0.55,
    /* выбрано сравнением кадров: Neutral + vibrance 0.35 + контраст 1.12 держит тёплое
       небо референса и наливает траву; AgX/Punchy серили небо */
    /* v6: трава ушла в реалистичный оливковый — насыщенность вернули почти к нейтрали */
    vibrance: q.has("vib") ? Number(q.get("vib")) : 0.18,
    contrast: q.has("con") ? Number(q.get("con")) : 1.06,
    focus: q.get("focus") === "0" ? 0 : 1,
    /* интро: холодный грейд «камеры наблюдения», глитч и провал в темноту */
    whiteBalance: new THREE.Vector3(1, 1, 1),
    glitch: 0,
    glitchSeed: 0,
    black: 0,
    radial: 0,
    aberration: 0,
    fill: 0,
    overlay: false,
    studio: 0,
    pcRect: new THREE.Vector4(0.4, 0.3, 0.6, 0.7),
    spot: new THREE.Vector2(0.5, 0.55),
    kinetic: 0,
    kineticTex: null as THREE.Texture | null,
    kineticRatio: 1,
    kineticShift: 0,
    kineticY: 0.5,
    kineticH: 0.3,
    kineticKeep: new THREE.Vector3(0, 0.2, 0),
    tear: -1,
    bgBlur: 0,
    alt: 0,
    altRender: null as ((target: THREE.WebGLRenderTarget) => void) | null,
    overlayCamera: null as THREE.Camera | null,
    onOverlay: undefined as ((before: boolean) => void) | undefined,
  };
  const final = new THREE.ShaderMaterial({
    ...flat,
    fragmentShader: finalFragment,
    uniforms: {
      tScene: { value: sceneRT.texture },
      tRays: { value: blurB.texture },
      tShield: { value: shieldRT.texture },
      uShield: { value: 0 },
      uRays: { value: 0 },
      uRayTint: { value: new THREE.Color(1.0, 0.86, 0.66) },
      uVignette: { value: params.vignette },
      uGrain: { value: q.get("grain") === "0" ? 0 : 0.012 },
      uExposure: { value: params.exposure },
      uTexel: { value: new THREE.Vector2(1, 1) },
      uSharp: { value: 0 },
      uDown: { value: new THREE.Vector2(0, 0) },
      uEdgeAA: { value: 0 },
      uTone: { value: toneMode },
      uVibrance: { value: params.vibrance },
      uContrast: { value: params.contrast },
      uWhiteBalance: { value: params.whiteBalance },
      uFocus: { value: params.focus },
      uGlitch: { value: 0 },
      uGlitchSeed: { value: 0 },
      uBlack: { value: 0 },
      uRadial: { value: 0 },
      uAberr: { value: 0 },
      uAberrRadial: { value: TRANSITION.aberrationRadial },
      uFill: { value: 0 },
      uFillColor: { value: new THREE.Color(0.949, 0.949, 0.949) }, // #F2F2F2 в sRGB, как фон About на Tilda
      tPC: { value: pcRT.texture },
      uOverlay: { value: 0 },
      uStudio: { value: 0 },
      uPCRect: { value: params.pcRect },
      uSpot: { value: params.spot },
      tKinetic: { value: null as THREE.Texture | null },
      uKinetic: { value: 0 },
      uKinetic2: { value: new THREE.Vector4() },
      uKinKeep: { value: params.kineticKeep },
      uTear: { value: -1 },
      uBgBlur: { value: 0 },
      tShadow: { value: shadowRT.texture },
      tAlt: { value: altBlurRT.texture },
      uAlt: { value: 0 },
    },
  });
  const blit = new THREE.ShaderMaterial({
    ...flat,
    fragmentShader: /* glsl */ `uniform sampler2D tInput; varying vec2 vUv; void main(){ gl_FragColor = texture2D(tInput, vUv); }`,
    uniforms: { tInput: { value: halfRT.texture } },
  });
  const quad = new FullScreenQuad();
  const sunNdc = new THREE.Vector3();
  let raysVisible = 1;
  let bgFrame = 0;
  let halfReady = false;

  const draw = (m: THREE.Material, rt: THREE.WebGLRenderTarget | null) => {
    quad.material = m;
    renderer.setRenderTarget(rt);
    quad.render(renderer);
  };

  return {
    params,
    setSamples(n) {
      const next = forcedSamples ?? n;
      if (sceneRT.samples === next) return;
      sceneRT.samples = next;
      sceneRT.dispose(); // three пересоздаст буфер с новым числом сэмплов при следующем рендере
      pcRT.samples = next;
      pcRT.dispose();
    },
    setSize(w, h, dpr, canvasDpr) {
      const W = Math.max(1, Math.round(w * dpr)), H = Math.max(1, Math.round(h * dpr));
      sceneRT.setSize(W, H);
      bgRT.setSize(Math.max(1, Math.ceil(W / 2)), Math.max(1, Math.ceil(H / 2)));
      bgBlurRT.setSize(Math.max(1, Math.ceil(W / 4)), Math.max(1, Math.ceil(H / 4)));
      altRT.setSize(Math.max(1, Math.round(W * 0.8)), Math.max(1, Math.round(H * 0.8)));
      altBgRT.setSize(Math.max(1, Math.ceil(W / 2)), Math.max(1, Math.ceil(H / 2)));
      altBlurRT.setSize(Math.max(1, Math.ceil(W / 4)), Math.max(1, Math.ceil(H / 4)));
      shadowRT.setSize(Math.max(1, Math.ceil(W / 4)), Math.max(1, Math.ceil(H / 4)));
      quarter.uniforms.uAspect.value = w / h;
      pcRT.setSize(W, H);
      halfRT.setSize(Math.max(1, Math.ceil((w * canvasDpr) / 2)), Math.max(1, Math.ceil((h * canvasDpr) / 2)));
      final.uniforms.uTexel.value.set(1 / W, 1 / H);
      /* v72: сцена крупнее экрана (суперсэмплинг на DPR 1) — финал сжимает её четырьмя билинейными выборками
         на пиксель экрана, то есть усредняет весь его след, а не берёт одну точку из середины */
      const down = dpr / canvasDpr;
      final.uniforms.uDown.value.set(down > 1.05 ? 0.25 / Math.max(1, w * canvasDpr) : 0, down > 1.05 ? 0.25 / Math.max(1, h * canvasDpr) : 0);
      /* резкость нужна только при растяжении; ?sharp=0 выключает */
      const upscale = canvasDpr / dpr;
      sharp = q.get("sharp") === "0" ? 0 : THREE.MathUtils.clamp((upscale - 1) * 0.8, 0, 0.6) /* сильнее — светлый ореол на краях подушек против неба */;
      /* лучам хватает четверти — они всё равно размыты */
      const qw = Math.max(1, Math.round(W / 4)), qh = Math.max(1, Math.round(H / 4));
      maskRT.setSize(qw, qh);
      blurA.setSize(qw, qh);
      blurB.setSize(qw, qh);
      shieldRT.setSize(qw, qh);
      mask.uniforms.uAspect.value = w / h;
    },
    render() {
      /* заливка закрыла кадр целиком — холм (220k травинок) не рисуем вовсе */
      const covered = params.fill >= 0.999 && params.tear <= -0.2;
      /* размытый задник кейсов: сцена в половинном буфере, размытие — в четвертном, финал берёт готовое.
         Переход прячется под бумагой: размытие включается, пока рваный край у самого низа кадра */
      const low = params.bgBlur > 0.001;
      const src = low ? bgRT : sceneRT;
      /* v25: полностью размытый фон кейсов обновляется через кадр — карточки живут в DOM, их плавность от
         этого не зависит, а медленное движение травы под размытием на 30 Гц не отличить */
      /* ровный кадр кейсов: страница About ушла, компьютера и глитча нет — финал в половинном буфере */
      const half = low && params.bgCheap && params.bgBlur > 0.95 && params.tear > 1.15 && !params.overlay && params.glitch < 0.001 && params.kinetic < 0.001;
      const reuse = half && halfReady && (++bgFrame & 1) === 1;
      if (reuse) {
        /* через кадр: ни сцены, ни финала — только растяжка готового кадра */
        draw(blit, null);
        return;
      }
      halfReady = half;
      /* v32: луг вместо холма. Целиком (alt = 1) — холм не рисуем вовсе; на выходе из кейсов (0 < alt < 1)
         оба фона рисуются в половинные буферы, размываются и смешиваются в финале */
      const altOn = !!params.altRender && params.alt > 0.001;
      const altFull = altOn && params.alt >= 0.999;
      const altMix = altOn && !altFull && low;
      if (!covered && !reuse && !altFull) {
        renderer.setRenderTarget(src);
        renderer.render(scene, camera);
      }
      if (altOn && !covered) {
        const target = altFull ? (low ? bgRT : altRT) : altBgRT;
        params.altRender!(target);
      }
      mask.uniforms.tColor.value = src.texture;
      if (low && !covered && !reuse) {
        quarter.uniforms.tInput.value = bgRT.texture;
        quarter.uniforms.uR.value = params.bgBlur * 0.016;
        quarter.uniforms.uMode.value = 0;
        draw(quarter, bgBlurRT);
        if (altMix) {
          quarter.uniforms.tInput.value = altBgRT.texture;
          draw(quarter, altBlurRT);
        }
      }
      final.uniforms.tScene.value = low ? bgBlurRT.texture : altFull ? altRT.texture : sceneRT.texture;
      final.uniforms.uAlt.value = altMix ? params.alt : 0;
      /* резкость CAS считает соседей полноразмерным текселем — на половинном буфере она ни к чему */
      final.uniforms.uSharp.value = low || altFull ? 0 : sharp;
      /* v44: без MSAA края сглаживает финальный проход целиком, с MSAA 2× — наполовину (две ступени покрытия
         всё ещё дают лесенку на DPR 1); с MSAA 4× не нужен. Размытому заднику он тоже не нужен. ?edgeaa=0|1 — для сравнения */
      final.uniforms.uEdgeAA.value = low || altFull ? 0 : edgeAA ?? (sceneRT.samples === 0 ? 1 : sceneRT.samples <= 2 ? 0.5 : 0);
      if (params.overlay) {
        const mask = camera.layers.mask;
        const alpha = renderer.getClearAlpha();
        renderer.getClearColor(clear);
        renderer.setClearColor(0x000000, 0);
        renderer.setRenderTarget(pcRT);
        renderer.clear();
        params.onOverlay?.(true);
        const oc = params.overlayCamera ?? camera;
        oc.layers.set(overlayLayer);
        renderer.render(scene, oc);
        params.onOverlay?.(false);
        camera.layers.mask = mask;
        renderer.setClearColor(clear, alpha);
        quarter.uniforms.tInput.value = pcRT.texture;
        quarter.uniforms.uMode.value = 1;
        draw(quarter, shadowRT);
      }

      /* Солнце в экранных координатах; за спиной камеры или далеко за краем — лучи гаснут.
         v68: кадр первого экрана развёрнут влево, и солнце ушло за правую кромку — а лучи от солнца
         чуть за краем кадра как раз и нужны (классический контровой кадр). Порог отодвинут: гаснут
         они теперь только когда солнце ушло совсем далеко. ?raysoff=1.5,2.6 — подобрать. */
      sunNdc.copy(sunDir).multiplyScalar(250).add(camera.position).project(camera);
      sunUv.set(sunNdc.x * 0.5 + 0.5, sunNdc.y * 0.5 + 0.5);
      const off = Math.max(Math.abs(sunNdc.x), Math.abs(sunNdc.y));
      const target = raysOn && params.raysEnabled && sunNdc.z <= 1 ? 1 - THREE.MathUtils.smoothstep(off, raysFade[0], raysFade[1]) : 0;
      raysVisible += (target - raysVisible) * 0.1;

      if (raysVisible > 0.01 && !covered && !altFull) {
        draw(mask, maskRT);
        blur.uniforms.tInput.value = maskRT.texture;
        blur.uniforms.uStep.value = 0.9;
        draw(blur, blurA);
        blur.uniforms.tInput.value = blurA.texture;
        blur.uniforms.uStep.value = 0.35;
        draw(blur, blurB);
      }
      const shield = shieldOn && raysVisible > 0.01 && !covered && !altFull && !low;
      if (shield) {
        const layers = camera.layers.mask;
        const alpha = renderer.getClearAlpha();
        renderer.getClearColor(clear);
        const override = scene.overrideMaterial;
        camera.layers.set(shieldLayer);
        scene.overrideMaterial = shieldMat;
        renderer.setClearColor(0x000000, 1);
        renderer.setRenderTarget(shieldRT);
        renderer.clear(true, false, false);
        renderer.render(scene, camera);
        scene.overrideMaterial = override;
        camera.layers.mask = layers;
        renderer.setClearColor(clear, alpha);
      }
      final.uniforms.uShield.value = shield ? 0.72 : 0;
      final.uniforms.uRays.value = params.rays * raysVisible;
      final.uniforms.uExposure.value = params.exposure;
      final.uniforms.uVignette.value = params.vignette;
      final.uniforms.uVibrance.value = params.vibrance;
      final.uniforms.uContrast.value = params.contrast;
      final.uniforms.uFocus.value = params.focus;
      final.uniforms.uGlitch.value = params.glitch;
      final.uniforms.uGlitchSeed.value = params.glitchSeed;
      final.uniforms.uBlack.value = params.black;
      final.uniforms.uRadial.value = params.radial;
      final.uniforms.uAberr.value = params.aberration;
      final.uniforms.uFill.value = params.fill;
      final.uniforms.uOverlay.value = params.overlay ? 1 : 0;
      final.uniforms.uStudio.value = params.studio;
      final.uniforms.uKinetic.value = params.kineticTex ? params.kinetic : 0;
      final.uniforms.tKinetic.value = params.kineticTex;
      final.uniforms.uKinetic2.value.set(params.kineticRatio, params.kineticShift, params.kineticY, params.kineticH);
      final.uniforms.uTear.value = params.tear;
      final.uniforms.uBgBlur.value = params.bgBlur;
      if (half) {
        draw(final, halfRT);
        draw(blit, null);
      } else draw(final, null);
    },
    compileTarget: sceneRT,
    altTarget: altRT,
    compileAsync() {
      /* ключ программы зависит от цели: промежуточные проходы — в half-float буфер, финал — на экран */
      const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
      const geo = new THREE.PlaneGeometry(2, 2);
      /* v44: у настоящего полноэкранного прохода (FullScreenQuad) нормалей нет. С нормалями three добавляет
         #define HAS_NORMAL — ключ программы другой, и все проходы собирались дважды: заранее (впустую) и синхронно
         на первом кадре (финальный шейдер — 0,18 с главного потока на холодном кэше) */
      geo.deleteAttribute("normal");
      const scene = (mats: THREE.Material[]) => {
        const s = new THREE.Scene();
        for (const m of mats) { const mesh = new THREE.Mesh(geo, m); mesh.frustumCulled = false; s.add(mesh); }
        return s;
      };
      const prev = renderer.getRenderTarget();
      renderer.setRenderTarget(maskRT);
      const a = renderer.compileAsync(scene([mask, blur, quarter]), cam);
      renderer.setRenderTarget(halfRT);
      const c = renderer.compileAsync(scene([final]), cam);
      renderer.setRenderTarget(shieldRT);
      const d = renderer.compileAsync(scene([shieldMat]), cam);
      renderer.setRenderTarget(null);
      const b = renderer.compileAsync(scene([final, blit]), cam);
      renderer.setRenderTarget(prev);
      return Promise.all([a, b, c, d]).finally(() => geo.dispose());
    },
    warm() {
      /* буферы и шейдер четвертного прохода — заранее: первый показ компьютера отдельным слоем
         и начало отрыва страницы давали кадр 36–145 мс на компиляции и выделении памяти */
      for (const t of [pcRT, bgRT, bgBlurRT, shadowRT, halfRT, altRT, altBgRT, altBlurRT]) renderer.initRenderTarget(t);
      const prev = renderer.getRenderTarget();
      quarter.uniforms.tInput.value = sceneRT.texture;
      quarter.uniforms.uMode.value = 0;
      draw(quarter, bgBlurRT);
      quarter.uniforms.uMode.value = 1;
      draw(quarter, shadowRT);
      renderer.setRenderTarget(prev);
    },
    dispose() {
      [sceneRT, bgRT, bgBlurRT, shadowRT, pcRT, maskRT, blurA, blurB, shieldRT, halfRT, altRT, altBgRT, altBlurRT].forEach((t) => t.dispose());
      [mask, blur, quarter, final, blit, shieldMat].forEach((m) => m.dispose());
      quad.dispose();
    },
  };
}
