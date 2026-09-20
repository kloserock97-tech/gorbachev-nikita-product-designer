/** One rounded solid shared by the tile, planting and coverage checks.
    v59: a thick slab (thickness ≈ 12 % of the width) with a small vertical bevel: the box is rounded at
    `modelHeight` and then compressed, so the corner radius in plan stays large while the edge bevel stays tight. */
export const TILE = { width: 3.05, depth: 3.25, modelHeight: 1.5, thickness: .42, radius: .36 } as const;
export const rand = (n: number) => { const v = Math.sin(n * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };
export const delayAt = (x: number, z: number) => Math.min(.70, Math.max(.025,
  Math.hypot((x - 1.15) * .8, z - 1.1) / 4.5 + Math.sin(x * 5 + z * 3) * .035));
export const GARDEN_DELAY_GLSL = "clamp(length(vec2((x-1.15)*.8,z-1.1))/4.5+sin(x*5.+z*3.)*.035,.025,.70)";

/** The moss never takes the whole slab: it stops where `delayAt` reaches COVER (about 45 % of the top face).
    FRONT is the growth value at which the front arrives there; the rest of the run is for blades and bloom. */
export const COVER = .34;
export const FRONT = .62;
export const seedDelay = (x: number, z: number) => Math.min(1, delayAt(x, z) / COVER) * FRONT;

const cx = TILE.width / 2 - TILE.radius, cz = TILE.depth / 2 - TILE.radius;
const sy = TILE.thickness / TILE.modelHeight;
export type GardenSurface = { x: number; y: number; z: number; nx: number; ny: number; nz: number };

/** Top hemisphere of the compressed rounded box, including its curved shoulders. */
export function topSurface(x: number, z: number): GardenSurface | null {
  const qx = Math.max(0, Math.abs(x) - cx), qz = Math.max(0, Math.abs(z) - cz);
  const d2 = qx * qx + qz * qz;
  if (d2 > TILE.radius * TILE.radius) return null;
  const h = Math.sqrt(Math.max(0, TILE.radius * TILE.radius - d2));
  const nx = Math.sign(x) * qx, ny = h / sy, nz = Math.sign(z) * qz;
  const length = Math.hypot(nx, ny, nz);
  return { x, y: sy * (h - TILE.radius), z, nx: nx / length, ny: ny / length, nz: nz / length };
}

/** Even perimeter planting, from the upper shoulder around to the lower lip. */
export function rimSurface(u: number, v: number): GardenSurface {
  const r = TILE.radius, arc = Math.PI * r / 2;
  const lengths = [cx * 2, arc, cz * 2, arc, cx * 2, arc, cz * 2, arc];
  let t = ((u % 1) + 1) % 1 * lengths.reduce((a, b) => a + b, 0), segment = 0;
  while (segment < 7 && t > lengths[segment]) t -= lengths[segment++];
  const p = t / lengths[segment];
  let x: number, z: number, nx: number, nz: number;
  if (segment % 2 === 0) {
    const edge = segment / 2;
    x = edge === 0 ? -cx + p * cx * 2 : edge === 1 ? cx : edge === 2 ? cx - p * cx * 2 : -cx;
    z = edge === 0 ? cz : edge === 1 ? cz - p * cz * 2 : edge === 2 ? -cz : -cz + p * cz * 2;
    nx = edge === 1 ? 1 : edge === 3 ? -1 : 0; nz = edge === 0 ? 1 : edge === 2 ? -1 : 0;
  } else {
    const corner = (segment - 1) / 2, a = Math.PI / 2 - (corner + p) * Math.PI / 2;
    x = corner < 2 ? cx : -cx; z = corner === 0 || corner === 3 ? cz : -cz;
    nx = Math.cos(a); nz = Math.sin(a);
  }
  const angle = .85 + Math.min(1, Math.max(0, v)) * (Math.PI - 1.7);
  const sine = Math.sin(angle), cosine = Math.cos(angle);
  const y = sy * ((TILE.modelHeight / 2 - r) * Math.sign(cosine) + r * cosine) - TILE.thickness / 2;
  const length = Math.hypot(sine, cosine / sy);
  return { x: x + nx * r * sine, y, z: z + nz * r * sine,
    nx: nx * sine / length, ny: cosine / sy / length, nz: nz * sine / length };
}

/* ── v59: what lies on the slab ─────────────────────────────────────────────────────────────────── */

/** Where a layer (moss, ice) rests. Inside the footprint it is the slab's top; past the edge it drapes down the
    wall, so a cushion near the rim can bulge over it. `rest` is a point just under the surface: a layer that has
    not grown yet, or has melted, hides there. */
export function baseAt(x: number, z: number): { y: number; rest: [number, number, number] } {
  const inside = topSurface(x, z);
  if (inside) return { y: inside.y, rest: [x, inside.y - .008, z] };
  const qx = Math.max(0, Math.abs(x) - cx), qz = Math.max(0, Math.abs(z) - cz);
  const dist = Math.hypot(qx, qz), over = dist - TILE.radius;
  const pull = (TILE.radius - .03) / dist;
  const rx = Math.sign(x) * (Math.min(Math.abs(x), cx) + qx * pull), rz = Math.sign(z) * (Math.min(Math.abs(z), cz) + qz * pull);
  const shoulder = topSurface(rx, rz);
  return { y: -sy * TILE.radius - over * 1.35, rest: [rx, (shoulder?.y ?? -sy * TILE.radius) - .008, rz] };
}

const hash = (i: number, j: number) => rand(i * 157.31 + j * 311.7 + .5);
const ease = (t: number) => t * t * (3 - 2 * t);
export function noise(x: number, z: number) {
  const i = Math.floor(x), j = Math.floor(z), u = ease(x - i), v = ease(z - j);
  return (hash(i, j) * (1 - u) + hash(i + 1, j) * u) * (1 - v) + (hash(i, j + 1) * (1 - u) + hash(i + 1, j + 1) * u) * v;
}
export function fbm(x: number, z: number) {
  let sum = 0, amp = .5;
  for (let o = 0; o < 4; o++) { sum += noise(x, z) * amp; x = x * 2.03 + 11.7; z = z * 2.03 + 5.3; amp *= .5; }
  return sum / .9375;
}

/** Moss grows as cushions: a union of flattened domes, smaller towards the edge of the covered area. */
type Cushion = { x: number; z: number; r: number; k: number };
const cushions: Cushion[] = [];
for (let n = 0; cushions.length < 46 && n < 4000; n++) {
  const x = (rand(n * 5 + 901) - .5) * (TILE.width + .3), z = (rand(n * 5 + 902) - .5) * (TILE.depth + .3);
  const d = delayAt(x, z);
  if (d > COVER - .025) continue;
  const near = Math.min(1, Math.max(.5, (COVER - d) / .2));
  /* the warm corner carries the big mound, like the reference: tall near the origin of growth, low at the front */
  cushions.push({ x, z, r: (.15 + rand(n * 5 + 903) * .30) * near, k: (.6 + rand(n * 5 + 904) * .4) * (.5 + near * .75) });
}
/* second order: small knobs riding on the big cushions. They are what makes it read as moss, not as a lawn. */
const knobs: Cushion[] = [];
for (let n = 0; knobs.length < 230 && n < 9000; n++) {
  const x = (rand(n * 5 + 1901) - .5) * TILE.width, z = (rand(n * 5 + 1902) - .5) * TILE.depth;
  if (delayAt(x, z) > COVER - .03) continue;
  knobs.push({ x, z, r: .05 + rand(n * 5 + 1903) * .075, k: .55 + rand(n * 5 + 1904) * .35 });
}
/* `soft` cushions are paraboloids: a hemisphere meets the glass with a vertical wall, which the grid of the sheet
   can only draw as a staircase. Knobs ride on top and never touch the glass, so they stay round. */
const dome = (list: Cushion[], x: number, z: number, soft = false) => {
  let h = soft ? -1 : 0;
  for (const c of list) {
    const dx = x - c.x, dz = z - c.z, d2 = dx * dx + dz * dz, r2 = c.r * c.r;
    if (soft) h = Math.max(h, (1 - d2 / r2) * c.r * .9 * c.k);
    else if (d2 < r2) h = Math.max(h, Math.sqrt(r2 - d2) * c.k);
  }
  return h;
};
/** 0 in the creases between knobs, 1 on their crowns: drives the colour of the velvet. */
export const mossKnob = (x: number, z: number) => Math.min(1, dome(knobs, x, z) / .07);
/** Height of the moss, 0 where there is none. */
export const mossHeight = (x: number, z: number) => Math.max(0, mossField(x, z));
/** Signed: negative past the edge of a cushion. The sheet uses it so that its line of contact with the glass is
    interpolated inside a grid cell instead of following the cells as a staircase. */
export function mossField(x: number, z: number) {
  const inside = topSurface(x, z);
  if (!inside) return -.05;
  /* a thin carpet under the cushions, so no pocket of bare glass is left in the middle of the mound */
  const big = Math.max(dome(cushions, x, z, true), (COVER - .075 - delayAt(x, z)) * .4);
  if (big <= 0) return Math.max(-.05, big);
  const h = big + dome(knobs, x, z) * Math.min(1, big / .05);
  /* cushions flatten on the rounded shoulder, so the sheet closes onto the glass at the rim */
  return h * Math.min(1, inside.ny * inside.ny * 1.15);
}

/** Ice sits in the cold corner (−x, −z): a jagged sheet, thickest at the corner.
    `t` is 0 at the corner and 1 at the edge of the sheet; melting eats it from the edge inwards. */
export function iceAt(x: number, z: number): { h: number; t: number } {
  const u = Math.max(0, (x + TILE.width / 2 + .12) / 1.75), v = Math.max(0, (z + TILE.depth / 2 + .12) / 2.2);
  const t = Math.pow(u, 1.25) + Math.pow(v, 1.25) + (fbm(x * 2.4 + 3, z * 2.4) - .5) * .42;
  if (t >= 1) return { h: Math.max(-.05, (1 - t) * .3), t };
  const edge = Math.min(1, (1 - t) / .16);
  const ridge = 1 - Math.abs(2 * fbm(x * 3.1 + 40, z * 3.1 + 9) - 1);
  return { h: edge * (.05 + ridge * ridge * .21 * (.4 + .6 * (1 - t))), t };
}
