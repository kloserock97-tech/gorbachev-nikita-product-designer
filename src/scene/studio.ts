import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

/* Студийный свет для компьютера на светлой странице (v17, по мотивам oryzo.ai; вынесено из
   HillScene в v21). Закатный свет делал корпус оливково-тёмным на белом фоне. Лампы студии живут
   только на слое компьютера — холм их не видит: тёплый ключ сверху слева, холодная заливка справа,
   яркий контровой сзади (светлый кант отделяет силуэт от фона), светлая полусфера.
   Окружение — RoomEnvironment того же размера PMREM (64), что и HDRI: шейдеры не пересобираются.

   Порядок за кадр: mix ← сцена; place() ставит лампы от камеры страницы; в проходе компьютера
   onOverlay(true) гасит закат и подменяет окружение, onOverlay(false) возвращает всё как было. */

export type HillLights = { key: THREE.DirectionalLight; rim: THREE.DirectionalLight; hemi: THREE.HemisphereLight };

export class Studio {
  private key = new THREE.DirectionalLight(new THREE.Color(1.0, 0.95, 0.88), 0);
  private fill = new THREE.DirectionalLight(new THREE.Color(0.86, 0.92, 1.0), 0);
  private rim = new THREE.DirectionalLight(new THREE.Color(1.0, 0.93, 0.84), 0);
  private hemi = new THREE.HemisphereLight(0xffffff, 0xe9ddd0, 0);
  private env: THREE.Texture | null = null;
  private saved = { key: 0, rim: 0, hemi: 0, env: null as THREE.Texture | null, rot: 0, int: 0.7 };
  private tmp = new THREE.Vector3();
  private right = new THREE.Vector3();
  /** 0 — закат, 1 — студия */
  mix = 0;

  constructor(private scene: THREE.Scene, layer: number) {
    for (const l of [this.key, this.fill, this.rim, this.hemi]) {
      l.layers.set(layer);
      scene.add(l);
      if ("target" in l) scene.add((l as THREE.DirectionalLight).target);
    }
  }

  /** v24: окружение студии собирается не в конструкторе (0,47 с главного потока на загрузке),
      а при прогреве истории — после HDRI, программы PMREM к этому времени уже скомпилированы */
  prepare(renderer: THREE.WebGLRenderer) {
    if (this.env) return;
    try {
      const pmrem = new THREE.PMREMGenerator(renderer);
      const room = new RoomEnvironment();
      this.env = pmrem.fromScene(room, 0.04, 0.1, 100, { size: 64 }).texture;
      room.dispose();
      pmrem.dispose();
    } catch (e) {
      console.warn("студийное окружение не собралось", e);
    }
  }

  /** лампы вокруг точки at, ориентированные от камеры страницы */
  place(cam: THREE.Camera, at: THREE.Vector3) {
    const k = this.mix;
    const right = this.right.setFromMatrixColumn(cam.matrixWorld, 0);
    const put = (l: THREE.DirectionalLight, r: number, up: number, back: number) => {
      l.target.position.copy(at);
      l.position.copy(at).addScaledVector(right, r).add(this.tmp.set(0, up, 0));
      this.tmp.subVectors(cam.position, at).setY(0).normalize();
      l.position.addScaledVector(this.tmp, back);
      l.target.updateMatrixWorld();
    };
    put(this.key, -2.2, 2.8, 2.4);
    put(this.fill, 2.6, 0.4, 1.6);
    put(this.rim, 1.2, 2.4, -3.0);
    this.key.intensity = 2.6 * k;
    this.fill.intensity = 0.9 * k;
    this.rim.intensity = 3.2 * k;
    this.hemi.intensity = 0.9 * k;
  }

  /** до/после прохода компьютера: закат гаснет, студия разгорается; окружение меняется через ноль яркости */
  onOverlay(before: boolean, L: HillLights | null) {
    if (!L) return;
    const s = this.scene, k = this.mix, sv = this.saved;
    if (before) {
      sv.key = L.key.intensity; sv.rim = L.rim.intensity; sv.hemi = L.hemi.intensity;
      sv.env = s.environment; sv.rot = s.environmentRotation.y; sv.int = s.environmentIntensity;
      const fade = 1 - k;
      L.key.intensity *= fade; L.rim.intensity *= fade; L.hemi.intensity *= fade;
      if (k > 0.5 && this.env) {
        s.environment = this.env;
        s.environmentRotation.y = 0;
        s.environmentIntensity = 0.85 * (k - 0.5) * 2;
      } else {
        s.environmentIntensity = sv.int * (1 - k * 2);
      }
    } else {
      L.key.intensity = sv.key; L.rim.intensity = sv.rim; L.hemi.intensity = sv.hemi;
      s.environment = sv.env; s.environmentRotation.y = sv.rot; s.environmentIntensity = sv.int;
    }
  }

  dispose() {
    this.env?.dispose();
  }
}

/** прямоугольник объекта в UV кадра камеры: восемь углов его собственного габарита × matrixWorld.
    Мировой AABB при поворотах скачком раздувался — рамка и контактная тень прыгали */
const corner = new THREE.Vector3();
export function projectBox(obj: THREE.Object3D, box: THREE.Box3, cam: THREE.Camera, out: THREE.Vector4) {
  obj.updateMatrixWorld();
  let x0 = 1, y0 = 1, x1 = 0, y1 = 0;
  for (let i = 0; i < 8; i++) {
    corner.set(i & 1 ? box.max.x : box.min.x, i & 2 ? box.max.y : box.min.y, i & 4 ? box.max.z : box.min.z).applyMatrix4(obj.matrixWorld).project(cam);
    const x = corner.x * 0.5 + 0.5, y = corner.y * 0.5 + 0.5;
    x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
  }
  return out.set(x0, y0, x1, y1);
}
