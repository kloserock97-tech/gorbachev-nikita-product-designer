/* v72: валуны во мху на склонах — ещё один план глубины первого экрана, как камень справа на референсе.
   Форма — сфера, продавленная шумом, со сколами: несколько случайных плоскостей срезают её, и валун получает
   плоские грани, как у гранита, а не вид картофелины. Нижняя часть уходит в землю, трава вокруг растёт
   вплотную (HillScene укорачивает её только внутри пятна валуна). Цвет и мох — в rockFragment (shaders.ts),
   свет тот же, что у травы. */
import * as THREE from "three";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { heightAt, makeRng } from "./terrain";
import { rockFragment, rockVertex } from "./shaders";

/* x, z — где лежит; size — поперечник, м; h — доля высоты; yaw — поворот; sink — на сколько доля высоты в земле */
export const ROCKS = [
  { x: 2.45, z: 4.35, size: 0.9, h: 0.6, yaw: 0.6, sink: 0.36, seed: 11 },
  { x: 2.98, z: 4.1, size: 0.36, h: 0.7, yaw: 2.1, sink: 0.3, seed: 23 },
  { x: -4.1, z: 2.3, size: 0.62, h: 0.62, yaw: 1.2, sink: 0.36, seed: 37 },
  { x: -3.6, z: 2.72, size: 0.28, h: 0.75, yaw: 0.2, sink: 0.3, seed: 41 },
];

/* пятна, где трава почти не растёт (под валуном): как у кресла, эллипс в мире */
export const rockFootprints = () => ROCKS.map((r) => ({ x: r.x, z: r.z, rx: r.size * 0.46, rz: r.size * 0.42 }));

function hash3(x: number, y: number, z: number, s: number) {
  let n = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(z | 0, 2147483647) ^ Math.imul(s | 0, 1274126177);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}
function noise3(x: number, y: number, z: number, s: number) {
  const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z);
  const fx = x - ix, fy = y - iy, fz = z - iz;
  const ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy), uz = fz * fz * (3 - 2 * fz);
  const l = (a: number, b: number, t: number) => a + (b - a) * t;
  const c = (dx: number, dy: number, dz: number) => hash3(ix + dx, iy + dy, iz + dz, s);
  return l(
    l(l(c(0, 0, 0), c(1, 0, 0), ux), l(c(0, 1, 0), c(1, 1, 0), ux), uy),
    l(l(c(0, 0, 1), c(1, 0, 1), ux), l(c(0, 1, 1), c(1, 1, 1), ux), uy),
    uz,
  );
}

function rockGeometry(seed: number) {
  const rng = makeRng(0x9e3779b9 ^ seed);
  /* икосаэдр three приходит без общих вершин — нормали считались бы по граням, и камень был бы гранёным */
  const ico = new THREE.IcosahedronGeometry(1, 4);
  ico.deleteAttribute("normal");
  ico.deleteAttribute("uv");
  const geo = mergeVertices(ico);
  ico.dispose();
  const pos = geo.attributes.position as THREE.BufferAttribute;
  /* Форма — три октавы шума по сфере и чуть приплюснутый верх. Плоские сколы плоскостями давали ступеньки
     треугольников и вид кристалла; обветренный валун на лугу круглее и неправильнее */
  const tilt = new THREE.Vector3(rng() - 0.5, 0, rng() - 0.5).multiplyScalar(0.5);
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const big = noise3(v.x * 1.1 + 3, v.y * 1.1, v.z * 1.1, seed) - 0.5;
    const mid = noise3(v.x * 2.6, v.y * 2.6 + 7, v.z * 2.6, seed + 1) - 0.5;
    const fine = noise3(v.x * 7, v.y * 7 - 3, v.z * 7, seed + 2) - 0.5;
    const r = 1 + big * 0.5 + mid * 0.16 + fine * 0.04 + v.dot(tilt) * 0.3;
    v.multiplyScalar(r);
    if (v.y > 0.35) v.y = 0.35 + (v.y - 0.35) * 0.72;
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals();
  return geo;
}

export function createRocks(uniforms: Record<string, THREE.IUniform>) {
  const group = new THREE.Group();
  group.name = "rocks";
  const mat = new THREE.ShaderMaterial({ vertexShader: rockVertex, fragmentShader: rockFragment, uniforms });
  for (const r of ROCKS) {
    const mesh = new THREE.Mesh(rockGeometry(r.seed), mat);
    const half = r.size / 2;
    mesh.scale.set(half, half * r.h * 1.6, half * 0.9);
    mesh.rotation.set(0, r.yaw, 0);
    /* нижняя часть в земле: центр опущен так, чтобы над склоном торчала доля (1 − sink) высоты */
    mesh.position.set(r.x, heightAt(r.x, r.z) + half * r.h * 1.6 * (1 - 2 * r.sink), r.z);
    group.add(mesh);
  }
  return group;
}
