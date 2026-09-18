/* Запекает HDRI для сцены (без зависимостей, Node 22+).

   node tools/bake-hdri.mjs [assets-src/qwantani_sunset_puresky_1k.hdr]

   Раньше браузер при загрузке декодировал HDRI 1k во Float32, искал солнце и проецировал
   небо в SH9 — ~131 тыс. вызовов базиса в основном потоке, плюс файл 1 МБ по сети.
   Теперь это считается здесь один раз:
   - src/scene/hdri-baked.json — направление солнца в HDRI, его цвет и SH9 неба;
   - public/hdri/sky-256.hdr — уменьшенная до 256×128 копия, только для отражений на
     реквизите (PMREM), которые и так размыты шероховатостью.
   Формулы те же, что были в src/scene/hdri.ts (equirectUv three, окно 7×7 у солнца,
   солнечные пиксели обрезаны до 8, вес по cos широты). SH считаются уже с поворотом yaw под
   SUN_DIR сцены — ⚠️ поменяли SUN_DIR в HillScene.ts → перезапустить скрипт. */
const SUN_DIR = (() => { const v = [0.24, 0.012, -1]; const l = Math.hypot(...v); return v.map((x) => x / l); })();
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

const src = resolve(process.argv[2] ?? "assets-src/qwantani_sunset_puresky_1k.hdr");
const buf = readFileSync(src);

/* ── чтение Radiance RGBE (новый RLE) ── */
let pos = 0;
const line = () => { let s = ""; while (buf[pos] !== 0x0a) s += String.fromCharCode(buf[pos++]); pos++; return s; };
for (let l = line(); l !== ""; l = line()) {}
const [, H, , W] = line().split(" ").map((v, i) => (i % 2 ? +v : v));
const data = new Float32Array(W * H * 3);
const scan = new Uint8Array(W * 4);
for (let y = 0; y < H; y++) {
  if (buf[pos] !== 2 || buf[pos + 1] !== 2) throw new Error("ожидался RLE-формат RGBE");
  pos += 4;
  for (let c = 0; c < 4; c++) {
    for (let x = 0; x < W;) {
      let n = buf[pos++];
      if (n > 128) { n -= 128; const v = buf[pos++]; while (n--) scan[x++ * 4 + c] = v; }
      else while (n--) scan[x++ * 4 + c] = buf[pos++];
    }
  }
  for (let x = 0; x < W; x++) {
    const e = scan[x * 4 + 3];
    const f = e ? Math.pow(2, e - 136) : 0;
    const i = (y * W + x) * 3;
    data[i] = scan[x * 4] * f; data[i + 1] = scan[x * 4 + 1] * f; data[i + 2] = scan[x * 4 + 2] * f;
  }
}

/* ── солнце ── */
let best = -1, bx = 0, by = 0;
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  const i = (y * W + x) * 3;
  const l = data[i] * 0.2126 + data[i + 1] * 0.7152 + data[i + 2] * 0.0722;
  if (l > best) { best = l; bx = x; by = y; }
}
const dirOf = (x, y) => {
  const u = (x + 0.5) / W, v = 1 - (y + 0.5) / H;
  const az = (u - 0.5) * Math.PI * 2, el = (v - 0.5) * Math.PI;
  return [Math.cos(az) * Math.cos(el), Math.sin(el), Math.sin(az) * Math.cos(el)];
};
const sunEnv = dirOf(bx, by);
const sun = [0, 0, 0]; let n = 0;
for (let y = Math.max(0, by - 3); y <= Math.min(H - 1, by + 3); y++) for (let x = bx - 3; x <= bx + 3; x++) {
  const i = (y * W + ((x + W) % W)) * 3;
  sun[0] += data[i]; sun[1] += data[i + 1]; sun[2] += data[i + 2]; n++;
}
const sm = Math.max(...sun) || 1;
const sunColor = sun.map((v) => +(v / sm).toFixed(5));

/* ── SH9 с поворотом окружения на yaw (то же, что three делает с environmentRotation.y) ── */
const yaw = Math.atan2(sunEnv[2], sunEnv[0]) - Math.atan2(SUN_DIR[2], SUN_DIR[0]);
const rotY = ([x, y, z]) => { const c = Math.cos(yaw), s = Math.sin(yaw); return [x * c + z * s, y, -x * s + z * c]; };
const basis = (d) => {
  const [x, y, z] = d;
  return [0.282095, 0.488603 * y, 0.488603 * z, 0.488603 * x, 1.092548 * x * y, 1.092548 * y * z, 0.315392 * (3 * z * z - 1), 1.092548 * x * z, 0.546274 * (x * x - y * y)];
};
const sh = Array.from({ length: 9 }, () => [0, 0, 0]);
let total = 0;
for (let y = 0; y < H; y += 2) {
  const w = Math.cos((0.5 - (y + 0.5) / H) * Math.PI);
  for (let x = 0; x < W; x += 2) {
    const b = basis(rotY(dirOf(x, y)));
    const i = (y * W + x) * 3;
    const col = [Math.min(data[i], 8), Math.min(data[i + 1], 8), Math.min(data[i + 2], 8)];
    for (let k = 0; k < 9; k++) for (let c = 0; c < 3; c++) sh[k][c] += col[c] * b[k] * w;
    total += w;
  }
}
const norm = (4 * Math.PI) / total;
const shOut = sh.map((c) => c.map((v) => +(v * norm).toFixed(6)));

const outJson = resolve("src/scene/hdri-baked.json");
writeFileSync(outJson, JSON.stringify({ source: src.split(/[\\/]/).pop(), yaw: +yaw.toFixed(6), sunColor, sh: shOut }, null, 2));

/* ── уменьшение 4× (среднее по блоку) и запись RGBE без сжатия ── */
const S = 4, w2 = Math.floor(W / S), h2 = Math.floor(H / S);
const header = `#?RADIANCE\nFORMAT=32-bit_rle_rgbe\n\n-Y ${h2} +X ${w2}\n`;
const out = Buffer.alloc(header.length + w2 * h2 * 4);
out.write(header, 0, "latin1");
let o = header.length;
for (let y = 0; y < h2; y++) for (let x = 0; x < w2; x++) {
  const c = [0, 0, 0];
  for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) {
    const k = ((y * S + j) * W + x * S + i) * 3;
    c[0] += data[k]; c[1] += data[k + 1]; c[2] += data[k + 2];
  }
  for (let k = 0; k < 3; k++) c[k] /= S * S;
  const m = Math.max(...c);
  if (m < 1e-32) { o += 4; continue; }
  const e = Math.ceil(Math.log2(m) + 1e-9);
  const f = 256 / Math.pow(2, e);
  out[o++] = Math.min(255, Math.floor(c[0] * f)); out[o++] = Math.min(255, Math.floor(c[1] * f));
  out[o++] = Math.min(255, Math.floor(c[2] * f)); out[o++] = e + 128;
}
const outHdr = resolve("public/hdri/sky-256.hdr");
mkdirSync(dirname(outHdr), { recursive: true });
writeFileSync(outHdr, out);
console.log(`source ${W}×${H} → ${w2}×${h2}, ${out.length} bytes; sun at (${bx}, ${by}) → ${outJson}`);
