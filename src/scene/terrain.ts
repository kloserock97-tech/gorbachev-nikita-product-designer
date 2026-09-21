/* Рельеф холма — одна аналитическая функция высоты. Её читают и
   раскладка травы, и сетка земли, и луч курсора, поэтому трава всегда
   стоит ровно на той поверхности, которую видно. */

const HILL = {
  height: 2.3,
  /* вытянут по X: при широком экране склоны уходят за края кадра, а не
     обрываются в пустое небо */
  spreadX: 6.8,
  spreadZ: 4.4,
};

/* детерминированный ГПСЧ (mulberry32) — один и тот же луг на каждой перезагрузке */
export function makeRng(seed = 0x3f9a1c7b) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hash2(x: number, y: number) {
  let n = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}

function vnoise(x: number, y: number) {
  const ix = Math.floor(x), iy = Math.floor(y);
  const fx = x - ix, fy = y - iy;
  const ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
  const a = hash2(ix, iy), b = hash2(ix + 1, iy), c = hash2(ix, iy + 1), d = hash2(ix + 1, iy + 1);
  const t = a + (b - a) * ux;
  return t + (c + (d - c) * ux - t) * uy;
}

/* октавы ещё и поворачиваются, чтобы решётка шума не читалась */
export function fbm(x: number, y: number, octaves = 4) {
  let s = 0, amp = 0.5, norm = 0;
  for (let i = 0; i < octaves; i++) {
    s += amp * vnoise(x, y);
    norm += amp;
    const nx = 0.8 * x + 0.6 * y, ny = -0.6 * x + 0.8 * y;
    x = nx * 2.07 + 3.1;
    y = ny * 2.07 - 1.7;
    amp *= 0.5;
  }
  return s / norm;
}

export function heightAt(x: number, z: number) {
  const r2 = (x * x) / (HILL.spreadX * HILL.spreadX) + (z * z) / (HILL.spreadZ * HILL.spreadZ);
  const dome = HILL.height * Math.exp(-r2);
  /* кочки: крупные, чтобы силуэт не был циркульным, и мелкие под травой */
  const bumps = (fbm(x * 0.35 + 11.0, z * 0.35 - 4.0, 3) - 0.5) * 0.34 + (fbm(x * 1.6, z * 1.6, 2) - 0.5) * 0.06;
  /* вершину держим ровной — на ней стоит стул */
  const flat = Math.min(1, Math.sqrt(x * x + z * z) / 1.4);
  return dome + bumps * flat;
}

const E = 0.02;
export function normalAt(x: number, z: number, out: { x: number; y: number; z: number }) {
  const dx = heightAt(x + E, z) - heightAt(x - E, z);
  const dz = heightAt(x, z + E) - heightAt(x, z - E);
  const nx = -dx, ny = 2 * E, nz = -dz;
  const l = Math.hypot(nx, ny, nz);
  out.x = nx / l; out.y = ny / l; out.z = nz / l;
  return out;
}
