/* v78: примитивы для карточек сцен кейсов: тёмное дымчатое стекло, светлый текст шрифтом Golos Text.
   Карточка рисуется в разрешении экрана (scale), размеры — в единицах макета.
   v79: общая основа всех рисовалок (paint.ts — «Сообщество», paintModerator.ts — модератор, остальные сцены):
   шрифт продукта, скругления, перенос строк, загрузка картинок, заготовка холста. Раньше у каждой была своя копия. */

const BASE = import.meta.env.BASE_URL;
const FONT = "Golos Text";

let fontsReady: Promise<void> | null = null;
/** шрифт продукта — Golos Text (OFL), лежит в public/fonts; грузится один раз на все сцены */
export function loadFonts() {
  if (fontsReady) return fontsReady;
  const faces = [
    new FontFace(FONT, `url(${BASE}fonts/golos-cyrillic.woff2)`, { weight: "400 600", unicodeRange: "U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116" }),
    new FontFace(FONT, `url(${BASE}fonts/golos-latin.woff2)`, { weight: "400 600", unicodeRange: "U+0000-00FF, U+2000-206F, U+20AC, U+2122, U+2190-2199, U+2212" }),
  ];
  fontsReady = Promise.all(faces.map((ff) => ff.load().then(() => document.fonts.add(ff)))).then(() =>
    Promise.all(["400", "500", "600"].map((w) => document.fonts.load(`${w} 16px "${FONT}"`, "Аа"))).then(() => undefined),
  );
  return fontsReady;
}

export type Ctx = CanvasRenderingContext2D;
export const INK = "#f4efe6";
export const MUTED = "rgba(244, 239, 230, 0.62)";
const LINE = "rgba(255, 255, 255, 0.14)";
export const font = (w: number, size: number) => `${w} ${size}px "${FONT}"`;
export const rr = (ctx: Ctx, x: number, y: number, w: number, h: number, r: number | number[]) => { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); };

export function wrap(ctx: Ctx, text: string, maxW: number) {
  const out: string[] = [];
  let line = "";
  for (const w of text.split(" ")) {
    const t = line ? `${line} ${w}` : w;
    if (ctx.measureText(t).width > maxW && line) { out.push(line); line = w; } else line = t;
  }
  if (line) out.push(line);
  return out;
}

const images = new Map<string, Promise<HTMLImageElement>>();
/** картинка по адресу; одна и та же грузится один раз (сцены берут одни фото по нескольку раз) */
export function loadImage(src: string) {
  let p = images.get(src);
  if (!p) {
    p = new Promise<HTMLImageElement>((res, rej) => { const i = new Image(); i.decoding = "async"; i.onload = () => res(i); i.onerror = rej; i.src = src; });
    images.set(src, p);
  }
  return p;
}
export const caseImage = (path: string) => loadImage(`${BASE}cases/${path}`);

/** холст в разрешении экрана, рисование — в единицах макета */
export function canvasFor(w: number, h: number, scale: number) {
  const c = document.createElement("canvas");
  c.width = Math.round(w * scale); c.height = Math.round(h * scale);
  const ctx = c.getContext("2d")!;
  ctx.scale(scale, scale);
  return { c, ctx };
}

/** фото в прямоугольник по правилу object-fit: cover; fx/fy — фокус (0 — левый/верхний край), zoom — крупнее */
export function cover(ctx: Ctx, im: HTMLImageElement, x: number, y: number, w: number, h: number, fx = 0.5, fy = 0.5, zoom = 1) {
  const s = Math.max(w / im.width, h / im.height) * zoom;
  const sw = w / s, sh = h / s;
  ctx.drawImage(im, (im.width - sw) * fx, (im.height - sh) * fy, sw, sh, x, y, w, h);
}

/** холст карточки: фон — тёмное стекло (или свой цвет), рисование — в единицах макета */
export async function sheet(w: number, h: number, scale: number, draw: (ctx: Ctx) => void | Promise<void>, bg: string | null = "rgba(24, 22, 18, 0.62)", r = 18) {
  await loadFonts();
  const { c, ctx } = canvasFor(w, h, scale);
  if (bg) { rr(ctx, 0, 0, w, h, r); ctx.fillStyle = bg; ctx.fill(); }
  await draw(ctx);
  return c;
}

export function text(ctx: Ctx, s: string, x: number, y: number, o: { w?: number; size?: number; color?: string; align?: CanvasTextAlign } = {}) {
  ctx.font = font(o.w ?? 400, o.size ?? 14);
  ctx.fillStyle = o.color ?? INK;
  ctx.textAlign = o.align ?? "left";
  ctx.fillText(s, x, y);
  ctx.textAlign = "left";
  return ctx.measureText(s).width;
}
/** строки с переносом; возвращает y под последней строкой */
export function para(ctx: Ctx, s: string, x: number, y: number, maxW: number, o: { w?: number; size?: number; color?: string; lh?: number; max?: number } = {}) {
  ctx.font = font(o.w ?? 400, o.size ?? 14);
  ctx.fillStyle = o.color ?? INK;
  const lines = wrap(ctx, s, maxW).slice(0, o.max ?? 99);
  for (const l of lines) { ctx.fillText(l, x, y); y += o.lh ?? (o.size ?? 14) * 1.4; }
  return y;
}
export function chip(ctx: Ctx, s: string, x: number, y: number, o: { bg: string; color: string; size?: number; dot?: string; h?: number }) {
  const size = o.size ?? 13, h = o.h ?? 24;
  ctx.font = font(500, size);
  const w = ctx.measureText(s).width + (o.dot ? 30 : 20);
  rr(ctx, x, y, w, h, h / 2); ctx.fillStyle = o.bg; ctx.fill();
  if (o.dot) { ctx.beginPath(); ctx.arc(x + 13, y + h / 2, 4, 0, Math.PI * 2); ctx.fillStyle = o.dot; ctx.fill(); }
  ctx.fillStyle = o.color; ctx.fillText(s, x + (o.dot ? 22 : 10), y + h / 2 + size * 0.36);
  return w;
}
export function hr(ctx: Ctx, x: number, y: number, w: number) {
  ctx.strokeStyle = LINE; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, y + 0.5); ctx.lineTo(x + w, y + 0.5); ctx.stroke();
}
/** галочка в круге / номер шага */
export function step(ctx: Ctx, x: number, y: number, r: number, done: boolean, n: number, color: string) {
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
  if (done) { ctx.fillStyle = color; ctx.fill(); ctx.strokeStyle = "#10180e"; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(x - r * 0.4, y); ctx.lineTo(x - r * 0.1, y + r * 0.32); ctx.lineTo(x + r * 0.42, y - r * 0.3); ctx.stroke(); }
  else { ctx.strokeStyle = "rgba(255,255,255,0.45)"; ctx.lineWidth = 1.5; ctx.stroke(); text(ctx, String(n), x, y + 5, { size: 13, color: MUTED, align: "center" }); }
}
