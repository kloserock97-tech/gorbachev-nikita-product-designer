/* Луг Meadow Walk внутри холма (v32): шум и функция высоты — те же, что в проекте
   github.com/kloserock97-tech/meadow-walk (код Никиты, MIT). Хэш — lowbias32 (Chris Wellons, public domain).
   GLSL и JS считают одно и то же бит в бит: JS нужен камере (держаться над землёй) и курсору (волны). */

export const noiseGLSL = /* glsl */ `
uint mdMix(uint x) {
  x ^= x >> 16u;
  x *= 0x7feb352du;
  x ^= x >> 15u;
  x *= 0x846ca68bu;
  x ^= x >> 16u;
  return x;
}
uint mdCell(ivec2 c) {
  return mdMix((uint(c.x) * 0x0001f35bu) ^ mdMix(uint(c.y) + 0x9e3779b9u));
}
vec2 mdGrad(ivec2 c) {
  uint h = mdCell(c);
  return vec2(float(h & 0xffffu), float((h >> 16u) & 0xffffu)) / 32767.5 - 1.0;
}
float tdNoise(vec2 p) {
  vec2 fl = floor(p);
  ivec2 i = ivec2(fl);
  vec2 f = p - fl;
  vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  float a = dot(mdGrad(i), f);
  float b = dot(mdGrad(i + ivec2(1, 0)), f - vec2(1.0, 0.0));
  float c = dot(mdGrad(i + ivec2(0, 1)), f - vec2(0.0, 1.0));
  float d = dot(mdGrad(i + ivec2(1, 1)), f - vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}
const mat2 mdTurn = mat2(0.82, -0.57, 0.57, 0.82);
float tdFbm3(vec2 p) {
  float s = 0.0, a = 0.5;
  for (int i = 0; i < 3; i++) { s += a * tdNoise(p); p = mdTurn * p * 2.03; a *= 0.5; }
  return s * 1.6;
}
float tdFbm5(vec2 p) {
  float s = 0.0, a = 0.5;
  for (int i = 0; i < 5; i++) { s += a * tdNoise(p); p = mdTurn * p * 2.01; a *= 0.5; }
  return s * 1.55;
}
`;

export const heightGLSL = /* glsl */ `
${noiseGLSL}
float terrainHeight(vec2 p, float t) {
  vec2 q = p * 0.03;
  q.y *= 1.3;
  vec2 w = vec2(
    tdFbm3(q * 1.2 + vec2(1.7, 9.2) + vec2(t * 0.012, 0.0)),
    tdFbm3(q * 1.2 + vec2(8.3, 2.8) - vec2(0.0, t * 0.010))
  );
  q += w * 1.1;
  float n = tdFbm5(q);
  float bands = sin(q.y * 4.2 + n * 2.6 + t * 0.04);
  float s = n * 1.8 + bands * 0.55;
  float plateau = s / (0.75 + abs(s));
  return plateau * 2.6 + n * 0.7 + tdNoise(p * 0.21) * 0.25;
}
`;

function mix32(x: number) {
  x ^= x >>> 16;
  x = Math.imul(x, 0x7feb352d);
  x ^= x >>> 15;
  x = Math.imul(x, 0x846ca68b);
  x ^= x >>> 16;
  return x >>> 0;
}
function cell(ix: number, iy: number) {
  return mix32(Math.imul(ix | 0, 0x0001f35b) ^ mix32(((iy | 0) + 0x9e3779b9) >>> 0));
}
function noise(px: number, py: number) {
  const fx0 = Math.floor(px), fy0 = Math.floor(py);
  const fx = px - fx0, fy = py - fy0;
  const ux = fx * fx * fx * (fx * (fx * 6 - 15) + 10);
  const uy = fy * fy * fy * (fy * (fy * 6 - 15) + 10);
  const g = (ix: number, iy: number, dx: number, dy: number) => {
    const h = cell(ix, iy);
    return ((h & 0xffff) / 32767.5 - 1) * dx + (((h >>> 16) & 0xffff) / 32767.5 - 1) * dy;
  };
  const a = g(fx0, fy0, fx, fy), b = g(fx0 + 1, fy0, fx - 1, fy);
  const c = g(fx0, fy0 + 1, fx, fy - 1), d = g(fx0 + 1, fy0 + 1, fx - 1, fy - 1);
  const ab = a + (b - a) * ux, cd = c + (d - c) * ux;
  return ab + (cd - ab) * uy;
}
function fbm(px: number, py: number, octaves: number, lac: number, norm: number) {
  let s = 0, a = 0.5;
  for (let i = 0; i < octaves; i++) {
    s += a * noise(px, py);
    const nx = (0.82 * px + 0.57 * py) * lac;
    const ny = (-0.57 * px + 0.82 * py) * lac;
    px = nx; py = ny; a *= 0.5;
  }
  return s * norm;
}

export function terrainHeight(x: number, z: number, t: number) {
  let qx = x * 0.03;
  let qy = z * 0.03 * 1.3;
  const wx = fbm(qx * 1.2 + 1.7 + t * 0.012, qy * 1.2 + 9.2, 3, 2.03, 1.6);
  const wy = fbm(qx * 1.2 + 8.3, qy * 1.2 + 2.8 - t * 0.01, 3, 2.03, 1.6);
  qx += wx * 1.1;
  qy += wy * 1.1;
  const n = fbm(qx, qy, 5, 2.01, 1.55);
  const bands = Math.sin(qy * 4.2 + n * 2.6 + t * 0.04);
  const s = n * 1.8 + bands * 0.55;
  const plateau = s / (0.75 + Math.abs(s));
  return plateau * 2.6 + n * 0.7 + noise(x * 0.21, z * 0.21) * 0.25;
}
