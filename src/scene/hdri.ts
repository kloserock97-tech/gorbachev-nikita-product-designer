import * as THREE from "three";
import { HDRLoader } from "three/examples/jsm/loaders/HDRLoader.js";
import baked from "./hdri-baked.json";

export type HdriLight = {
  /* PMREM для физических материалов (кресло, столик, компьютер, собака) */
  envMap: THREE.Texture;
  /* поворот окружения вокруг Y, чтобы солнце HDRI совпало с солнцем сцены */
  yaw: number;
  /* небесная засветка в сферических гармониках — ей освещается трава */
  sh: THREE.SphericalHarmonics3;
  /* цвет солнца, прочитанный из самого яркого места HDRI (нормирован) */
  sunColor: THREE.Color;
  equirect: THREE.DataTexture;
};

/* v44: один генератор PMREM на всё (окружение холма и студия страницы About), а его шейдеры собираются заранее.

   Что было: PMREMGenerator собирает свои программы при первом использовании и ждёт видеодрайвер синхронно.
   На холодном кэше шейдер GGX-свёртки стоил 0,46–0,5 с главного потока на быстром процессоре (трассировка
   tools/pre-shader-stalls.js), на слабом — около 2 с: страница замирала посреди загрузки. Генератор студии
   создавался заново и после dispose() собирал те же программы ещё раз.

   Теперь материалы генератора создаются сразу, отдаются в compileAsync (KHR_parallel_shader_compile — сборка
   идёт в драйвере, главный поток свободен), и пока едет файл HDRI, программы успевают собраться.
   Приватные поля three (_setSize, _allocateTargets, _ggxMaterial…) — версия three закреплена в package-lock;
   если в новой версии их не окажется, сработает catch и всё соберётся по-старому, синхронно. */
type PmremInternals = {
  _setSize(cubeSize: number): void;
  _allocateTargets(): THREE.WebGLRenderTarget;
  _blurMaterial: THREE.Material | null;
  _ggxMaterial: THREE.Material | null;
  _equirectMaterial: THREE.Material | null;
  _lodMeshes: THREE.Mesh[];
};
const CUBE = 64; // HDRI 256×128 → грань куба 64; студия собирается с тем же размером

let shared: { pmrem: THREE.PMREMGenerator; ready: Promise<void> } | null = null;
export function sharedPmrem(renderer: THREE.WebGLRenderer) {
  if (shared) return shared;
  const pmrem = new THREE.PMREMGenerator(renderer);
  let ready: Promise<void> = Promise.resolve();
  try {
    const p = pmrem as unknown as PmremInternals;
    p._setSize(CUBE);
    const rt = p._allocateTargets();
    pmrem.compileEquirectangularShader();
    const mats = [p._equirectMaterial, p._ggxMaterial, p._blurMaterial].filter((m): m is THREE.Material => !!m);
    const geo = p._lodMeshes[0]?.geometry ?? new THREE.BufferGeometry();
    const group = new THREE.Group();
    for (const m of mats) { const mesh = new THREE.Mesh(geo, m); mesh.frustumCulled = false; group.add(mesh); }
    /* ключ программы зависит от цели рендера — собираем в такой же half-float буфер, в какой генератор рисует */
    const prev = renderer.getRenderTarget();
    renderer.setRenderTarget(rt);
    const done = renderer.compileAsync(group, new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1));
    renderer.setRenderTarget(prev);
    ready = done.then(() => {}, () => {}).finally(() => rt.dispose());
  } catch (e) {
    console.warn("PMREM: шейдеры заранее не собрались, соберутся при первом использовании", e);
  }
  shared = { pmrem, ready };
  return shared;
}
const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/* Солнце, его цвет и SH9 неба запечены заранее (tools/bake-hdri.mjs → hdri-baked.json):
   раньше браузер разбирал HDRI 1k во Float32 и проецировал её в SH прямо при загрузке.
   Сюда приходит только уменьшенная копия 256×128 — для отражений на реквизите. */
export async function loadHdri(renderer: THREE.WebGLRenderer, url: string): Promise<HdriLight> {
  const { pmrem, ready } = sharedPmrem(renderer); // сборка шейдеров идёт, пока скачивается файл
  const tex = await new HDRLoader().setDataType(THREE.HalfFloatType).loadAsync(url);
  tex.mapping = THREE.EquirectangularReflectionMapping;

  const sh = new THREE.SphericalHarmonics3();
  baked.sh.forEach((c, i) => sh.coefficients[i].set(c[0], c[1], c[2]));

  await Promise.race([ready, wait(3000)]);
  const envMap = pmrem.fromEquirectangular(tex).texture;

  return { envMap, yaw: baked.yaw, sh, sunColor: new THREE.Color(...(baked.sunColor as [number, number, number])), equirect: tex };
}
