/* Найти, каким куском фрейма вырезана картинка кейса.

   Зачем. Экраны в кейсах — не фреймы целиком, а кадрированные куски, и вдобавок растянутые (кусок шириной
   1440 лежит файлом в 1600). Чтобы переснять их резко, нужно знать прямоугольник кропа. Перебирать на глаз
   по двум десяткам картинок — долго и неточно, поэтому прямоугольник ищется сравнением.

   Как ищет. Обе картинки переводятся в яркость, по фрейму строится таблица сумм (summed-area table): она
   позволяет за постоянное время получить средний цвет любого прямоугольника, а значит — дешёвую «иконку»
   любого кропа. Иконки нормируются по среднему и разбросу, поэтому разница яркости между выгрузками
   не мешает. Дальше грубый проход по сетке и точный вокруг лучшего.

   node tools/shot-match.mjs <картинка кейса> <фрейм.png> [<фрейм.png> ...] [--grid 40] */
import { execFileSync } from "node:child_process";
import { basename } from "node:path";

const args = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i < 0 ? d : +process.argv[i + 1]; };
const TH = arg("th", 40);          // сторона «иконки» для сравнения
const [target, ...frames] = args;

/** яркость картинки как массив байтов плюс её размеры */
function luma(path) {
  const meta = execFileSync("ffprobe", ["-v", "error", "-select_streams", "v", "-show_entries", "stream=width,height", "-of", "csv=p=0", path]).toString().trim();
  const [w, h] = meta.split(",").map(Number);
  const buf = execFileSync("ffmpeg", ["-v", "error", "-i", path, "-pix_fmt", "gray", "-f", "rawvideo", "-"], { maxBuffer: 1 << 28 });
  return { w, h, px: buf };
}

/** таблица сумм: sat[y][x] — сумма яркостей прямоугольника от начала до (x, y) */
function sat({ w, h, px }) {
  const s = new Float64Array((w + 1) * (h + 1));
  for (let y = 0; y < h; y++) {
    let row = 0;
    for (let x = 0; x < w; x++) {
      row += px[y * w + x];
      s[(y + 1) * (w + 1) + x + 1] = s[y * (w + 1) + x + 1] + row;
    }
  }
  return s;
}
const boxSum = (s, w, x0, y0, x1, y1) =>
  s[y1 * (w + 1) + x1] - s[y0 * (w + 1) + x1] - s[y1 * (w + 1) + x0] + s[y0 * (w + 1) + x0];

/** «иконка» прямоугольника: средние яркости по сетке TH×TH, приведённые к нулевому среднему и единичному разбросу */
function thumb(s, w, x, y, cw, ch, out = new Float64Array(TH * TH)) {
  for (let j = 0; j < TH; j++) {
    const y0 = y + Math.floor((j * ch) / TH), y1 = y + Math.floor(((j + 1) * ch) / TH);
    for (let i = 0; i < TH; i++) {
      const x0 = x + Math.floor((i * cw) / TH), x1 = x + Math.floor(((i + 1) * cw) / TH);
      const n = Math.max(1, (x1 - x0) * (y1 - y0));
      out[j * TH + i] = boxSum(s, w, x0, y0, x1, y1) / n;
    }
  }
  let m = 0; for (const v of out) m += v; m /= out.length;
  let sd = 0; for (const v of out) sd += (v - m) * (v - m);
  sd = Math.sqrt(sd / out.length) || 1;
  for (let i = 0; i < out.length; i++) out[i] = (out[i] - m) / sd;
  return out;
}
const dist = (a, b) => { let d = 0; for (let i = 0; i < a.length; i++) { const t = a[i] - b[i]; d += t * t; } return d / a.length; };

const T = luma(target);
const want = thumb(sat(T), T.w, 0, 0, T.w, T.h);
const ar = T.w / T.h;

let best = null;
for (const f of frames) {
  const F = luma(f), S = sat(F);
  const buf = new Float64Array(TH * TH);
  const try1 = (x, y, cw) => {
    const ch = Math.round(cw / ar);
    if (cw < 60 || ch < 60 || x < 0 || y < 0 || x + cw > F.w || y + ch > F.h) return;
    const d = dist(want, thumb(S, F.w, x, y, cw, ch, buf));
    if (!best || d < best.d) best = { d, f, x, y, cw, ch, fw: F.w, fh: F.h };
  };
  /* грубо: ширина куска от трети фрейма до всего фрейма */
  for (let cw = Math.round(F.w * 0.3); cw <= F.w; cw += Math.max(8, Math.round(F.w / 60))) {
    const ch = Math.round(cw / ar);
    if (ch > F.h) continue;
    const step = Math.max(6, Math.round(cw / 28));
    for (let x = 0; x + cw <= F.w; x += step) for (let y = 0; y + ch <= F.h; y += step) try1(x, y, cw);
  }
}
if (!best) { console.log("ничего не подошло"); process.exit(1); }
/* точно: вокруг найденного */
{
  const F = luma(best.f), S = sat(F), buf = new Float64Array(TH * TH);
  const near = { ...best };
  for (let cw = near.cw - 30; cw <= near.cw + 30; cw += 2) {
    const ch = Math.round(cw / ar);
    if (ch > F.h) continue;
    for (let x = Math.max(0, near.x - 30); x <= Math.min(F.w - cw, near.x + 30); x += 2)
      for (let y = Math.max(0, near.y - 30); y <= Math.min(F.h - ch, near.y + 30); y += 2) {
        const d = dist(want, thumb(S, F.w, x, y, cw, ch, buf));
        if (d < best.d) best = { d, f: best.f, x, y, cw, ch, fw: F.w, fh: F.h };
      }
  }
}
console.log(JSON.stringify({
  картинка: basename(target), фрейм: basename(best.f), фреймразмер: `${best.fw}×${best.fh}`,
  кроп: { x: best.x, y: best.y, w: best.cw, h: best.ch }, расхождение: +best.d.toFixed(4),
}));
