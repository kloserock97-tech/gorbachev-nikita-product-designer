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

/* Солнце, его цвет и SH9 неба запечены заранее (tools/bake-hdri.mjs → hdri-baked.json):
   раньше браузер разбирал HDRI 1k во Float32 и проецировал её в SH прямо при загрузке.
   Сюда приходит только уменьшенная копия 256×128 — для отражений на реквизите. */
export async function loadHdri(renderer: THREE.WebGLRenderer, url: string): Promise<HdriLight> {
  const tex = await new HDRLoader().setDataType(THREE.HalfFloatType).loadAsync(url);
  tex.mapping = THREE.EquirectangularReflectionMapping;

  const sh = new THREE.SphericalHarmonics3();
  baked.sh.forEach((c, i) => sh.coefficients[i].set(c[0], c[1], c[2]));

  const pmrem = new THREE.PMREMGenerator(renderer);
  const envMap = pmrem.fromEquirectangular(tex).texture;
  pmrem.dispose();

  return { envMap, yaw: baked.yaw, sh, sunColor: new THREE.Color(...(baked.sunColor as [number, number, number])), equirect: tex };
}
