/* v72: цветы у самой камеры, слева внизу — ближний план первого экрана.

   Это те же цветы, что растут на склоне: тот же венчик из пяти лепестков и тот же шейдер (plantVertex /
   plantFragment) со светом неба, контровым просвечиванием и ветром. Только крупнее и в метре-двух от камеры,
   и повёрнуты венчиком к зрителю. Рисуются отдельным слоем, который постобработка размывает как малую глубину
   резкости (postfx.ts, nearLayer). Стоят в мире, а не на экране: курсор и скролл двигают камеру, и ближний план
   уезжает быстрее холма — так и читается глубина.

   Раньше здесь были плоские размытые картинки, приклеенные к углам экрана: на телефоне их край висел посреди
   травы, цветы на них были другой породы, чем на лугу, и при движении они не жили с глубиной. */
import * as THREE from "three";
import { plantFragment, plantVertex } from "./shaders";

/* Место на экране (x, y в координатах −1…1), расстояние от камеры (м), масштаб растения, цвет венчика.
   Широкий кадр — у левого края под кнопкой «Смотреть кейсы», над подписями внизу; вертикальный — слева над
   карточкой проектов. Большинство — белые, как тысячелистник и ромашка на склоне, по одному — клевер,
   василёк и лютик из той же палитры, что у дрейфов на лугу (HillScene.planMeadow) */
type Spot = [number, number, number, number, number];
const WHITE = 0, PINK = 1, BLUE = 2, YELLOW = 3;
const COLORS = [new THREE.Color(0.80, 0.78, 0.70), new THREE.Color(0.80, 0.42, 0.52), new THREE.Color(0.28, 0.36, 0.78), new THREE.Color(0.78, 0.56, 0.08)];
const WIDE: Spot[] = [
  [-0.93, -0.46, 1.35, 1.8, WHITE], [-0.82, -0.3, 1.8, 2.0, WHITE], [-0.99, -0.16, 2.1, 2.2, WHITE],
  [-0.72, -0.56, 1.5, 1.7, PINK], [-0.87, -0.68, 1.2, 1.6, WHITE], [-0.66, -0.26, 2.2, 2.2, WHITE],
  [-1.02, -0.58, 1.45, 1.8, BLUE], [-0.76, -0.78, 1.35, 1.6, YELLOW],
];
/* на вертикальном экране горизонталь втрое уже — цветы мельче и прижаты к левому краю */
const TALL: Spot[] = [
  [-0.9, -0.36, 1.5, 1.05, WHITE], [-0.72, -0.28, 1.9, 1.15, WHITE], [-1.0, -0.2, 2.1, 1.2, WHITE],
  [-0.6, -0.42, 1.6, 1.0, PINK], [-0.82, -0.48, 1.35, 0.95, WHITE], [-1.02, -0.46, 1.6, 1.0, BLUE],
];
const N = Math.max(WIDE.length, TALL.length);

/* Геометрия ближнего цветка: стебель и два венчика почти вертикально, лицом к +z (к камере после поворота).
   Стебель толще лугового: у камеры в миллиметр он пропадал бы между пикселями буфера расфокуса */
function geometry() {
  const pos: number[] = [], part: number[] = [], luv: number[] = [], idx: number[] = [];
  const add = (x: number, y: number, z: number, pt: number, u: number, v: number) => {
    pos.push(x, y, z); part.push(pt); luv.push(u, v);
    return pos.length / 3 - 1;
  };
  const H = 0.24, w = 0.0035, R = 0.03;
  for (let q = 0; q < 2; q++) {
    const c = Math.cos(q * Math.PI / 2) * w, s = Math.sin(q * Math.PI / 2) * w;
    const a = add(-c, 0, -s, 4, 0, 0), b = add(c, 0, s, 4, 0, 0), e = add(c, H, s, 4, 0, 1), f = add(-c, H, -s, 4, 0, 1);
    idx.push(a, b, e, a, e, f);
  }
  /* листья от основания: узкие длинные ленты веером — у камеры цветок без травы висел в воздухе */
  const L = 0.012;
  for (const [yaw, h, lean] of [[0.3, 0.2, 0.09], [1.9, 0.16, -0.1], [3.4, 0.21, 0.08], [4.8, 0.14, -0.11]]) {
    const c = Math.cos(yaw) * L, s = Math.sin(yaw) * L, lx = Math.sin(yaw) * lean, lz = Math.cos(yaw) * lean;
    const a = add(-c, 0, -s, 4, 0, 0), b = add(c, 0, s, 4, 0, 0), e = add(lx + c * 0.2, h, lz + s * 0.2, 4, 0, 1), f = add(lx - c * 0.2, h, lz - s * 0.2, 4, 0, 1);
    idx.push(a, b, e, a, e, f);
  }
  for (const tilt of [1.12, 1.42]) {
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

export function createNearFlowers(uniforms: Record<string, THREE.IUniform>, layer: number) {
  const geo = geometry();
  const off = new THREE.InstancedBufferAttribute(new Float32Array(N * 3), 3);
  const plant = new THREE.InstancedBufferAttribute(new Float32Array(N * 4), 4);
  const color = new THREE.InstancedBufferAttribute(new Float32Array(N * 3), 3);
  geo.setAttribute("aOffset", off);
  geo.setAttribute("aPlant", plant);
  geo.setAttribute("aColor", color);
  const mat = new THREE.ShaderMaterial({
    vertexShader: plantVertex,
    fragmentShader: plantFragment,
    defines: { NEAR: "" },
    uniforms: { ...uniforms, uPlantHeight: { value: 0.24 } },
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.frustumCulled = false;
  mesh.layers.set(layer);
  mesh.name = "near-flowers";

  const cam = new THREE.PerspectiveCamera(30, 1, 0.1, 10);
  const fwd = new THREE.Vector3(), dir = new THREE.Vector3(), head = new THREE.Vector3();
  let key = "";
  return {
    mesh,
    /** расставить по кадру для позы камеры в покое (pos → target) и пропорций экрана */
    place(pos: THREE.Vector3, target: THREE.Vector3, aspect: number, fov: number) {
      const k = Math.min(1, Math.max(0, (aspect - 0.6) / 0.7));
      const next = `${pos.toArray().map((v) => v.toFixed(3))}|${target.toArray().map((v) => v.toFixed(3))}|${aspect.toFixed(3)}`;
      if (next === key) return;
      key = next;
      cam.fov = fov;
      cam.aspect = aspect;
      cam.position.copy(pos);
      cam.lookAt(target);
      cam.updateProjectionMatrix();
      cam.updateMatrixWorld();
      cam.getWorldDirection(fwd);
      const spots = k > 0.5 ? WIDE : TALL;
      for (let i = 0; i < N; i++) {
        const s = spots[i];
        if (!s) { off.setXYZ(i, 0, -100, 0); plant.setXYZW(i, 0, 0, 0, 0); continue; }
        const [x, y, d, scale, c] = s;
        dir.set(x, y, 0.5).unproject(cam).sub(pos).normalize();
        head.copy(pos).addScaledVector(dir, d / Math.max(0.2, dir.dot(fwd)));
        /* основание — на высоту стебля ниже венчика; венчик повёрнут к камере */
        off.setXYZ(i, head.x, head.y - 0.24 * scale, head.z);
        const yaw = Math.atan2(pos.x - head.x, pos.z - head.z);
        plant.setXYZW(i, yaw, scale, (i * 0.37) % 1, (i * 0.61) % 1);
        const col = COLORS[c];
        const v = 0.9 + ((i * 0.53) % 1) * 0.2;
        color.setXYZ(i, col.r * v, col.g * v, col.b * v);
      }
      off.needsUpdate = plant.needsUpdate = color.needsUpdate = true;
      geo.instanceCount = N;
    },
  };
}
