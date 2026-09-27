/* v78: содержимое карточек сцены кейса рисуется Canvas 2D из настоящих данных продукта — шрифт, цвета тегов,
   иконки и фото взяты из Figma-файла «Сообщества» (LdUrYy9cNus6q7005xnmXo, лента 2103:12251). Так текст остаётся
   резким на любом экране: холст рисуется в разрешении, которое карточка займёт на экране, а не растягивается
   из готовой картинки. Размеры ниже — в единицах макета Figma (1 ед. = 1 px макета). */

const BASE = import.meta.env.BASE_URL;
const DIR = `${BASE}cases/community/scene/`;
export const FONT = "Golos Text";

/* теги продукта: цвет плашки и иконка — из компонента Tag (3930:55550) */
export const TAGS = {
  journey: { t: "Путешествие", bg: "#e2f8ff" },
  communal: { t: "ЖКХ", bg: "#f5e8e8" },
  disease: { t: "Болезнь", bg: "#fff1e4" },
  detail: { t: "Деталь", bg: "#f2ecdf" },
  food: { t: "Еда", bg: "#fffedf" },
  sport: { t: "Спорт", bg: "#e7fdf2" },
  night: { t: "Ночь", bg: "#f2f5ff" },
  party: { t: "Кутёж", bg: "#fff2fb" },
  pets: { t: "Фауна", bg: "#f4fbe4" },
  tragedy: { t: "Трагедия", bg: "#f2f2f2" },
  transport: { t: "Транспорт", bg: "#f1edff" },
} as const;
export type TagId = keyof typeof TAGS;

const C = { heading: "#020202", primary: "#212121", icon: "#5d6570", secondary: "#efefef" };

let fontsReady: Promise<void> | null = null;
/** шрифт продукта — Golos Text (OFL), лежит в public/fonts */
export function loadFonts() {
  if (fontsReady) return fontsReady;
  const faces = [
    new FontFace(FONT, `url(${BASE}fonts/golos-cyrillic.woff2)`, { weight: "400 600", unicodeRange: "U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116" }),
    new FontFace(FONT, `url(${BASE}fonts/golos-latin.woff2)`, { weight: "400 600", unicodeRange: "U+0000-00FF, U+2000-206F, U+20AC, U+2122, U+2190-2199, U+2212" }),
  ];
  fontsReady = Promise.all(faces.map((f) => f.load().then(() => document.fonts.add(f)))).then(() =>
    Promise.all(["400", "500", "600"].map((w) => document.fonts.load(`${w} 16px "${FONT}"`, "Аа"))).then(() => undefined),
  );
  return fontsReady;
}

const images = new Map<string, Promise<HTMLImageElement>>();
export function img(name: string) {
  let p = images.get(name);
  if (!p) {
    p = new Promise((res, rej) => { const i = new Image(); i.decoding = "async"; i.onload = () => res(i); i.onerror = rej; i.src = DIR + name; });
    images.set(name, p);
  }
  return p;
}

type Ctx = CanvasRenderingContext2D;
const font = (w: number, size: number) => `${w} ${size}px "${FONT}"`;

function rr(ctx: Ctx, x: number, y: number, w: number, h: number, r: number | [number, number, number, number]) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

/** фото в прямоугольник по правилу object-fit: cover, со сдвигом фокуса fy (0 — верх, 0.5 — центр) */
function cover(ctx: Ctx, im: HTMLImageElement, x: number, y: number, w: number, h: number, fx = 0.5, fy = 0.5, zoom = 1) {
  const s = Math.max(w / im.width, h / im.height) * zoom;
  const sw = w / s, sh = h / s;
  ctx.drawImage(im, (im.width - sw) * fx, (im.height - sh) * fy, sw, sh, x, y, w, h);
}

function wrap(ctx: Ctx, text: string, maxW: number) {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = w; } else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

/** тег: плашка 32 высотой, отступы 10, иконка 16 + 4 + подпись 14/20 */
async function tag(ctx: Ctx, id: TagId | "all", x: number, y: number) {
  ctx.font = font(400, 14);
  if (id === "all") {
    const w = 46;
    ctx.save();
    ctx.shadowColor = "rgba(180,180,180,0.24)"; ctx.shadowBlur = 8; ctx.shadowOffsetY = 4;
    rr(ctx, x, y, w, 32, 20); ctx.fillStyle = "#fff"; ctx.fill();
    ctx.restore();
    rr(ctx, x + 0.5, y + 0.5, w - 1, 31, 20); ctx.strokeStyle = C.primary; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = C.primary; ctx.textAlign = "center"; ctx.fillText("Все", x + w / 2, y + 21); ctx.textAlign = "left";
    return w;
  }
  const t = TAGS[id];
  const w = 10 + 16 + 4 + ctx.measureText(t.t).width + 10;
  rr(ctx, x, y, w, 32, 20); ctx.fillStyle = t.bg; ctx.fill();
  ctx.drawImage(await img(`${id}.svg`), x + 10, y + 8, 16, 16);
  ctx.fillStyle = C.icon; ctx.fillText(t.t, x + 30, y + 21);
  return w;
}

async function meta(ctx: Ctx, count: number, x: number, y: number) {
  ctx.drawImage(await img("bubble.svg"), x, y + 2, 16, 16);
  ctx.font = font(400, 14); ctx.fillStyle = C.icon;
  ctx.fillText(String(count), x + 20, y + 15);
  const cw = ctx.measureText(String(count)).width;
  ctx.drawImage(await img("share.svg"), x + 20 + cw + 16, y + 2, 16, 16);
}

async function arrowButton(ctx: Ctx, x: number, y: number) {
  ctx.beginPath(); ctx.arc(x + 24, y + 24, 24, 0, Math.PI * 2); ctx.fillStyle = C.secondary; ctx.fill();
  ctx.drawImage(await img("arrow.svg"), x + 12, y + 12, 24, 24);
}

const canvasFor = (w: number, h: number, scale: number) => {
  const c = document.createElement("canvas");
  c.width = Math.round(w * scale); c.height = Math.round(h * scale);
  const ctx = c.getContext("2d")!;
  ctx.scale(scale, scale);
  ctx.textBaseline = "alphabetic";
  return { c, ctx };
};

/* ── главная карточка: шапка ленты + ряд тегов + первая публикация (Publication Card 2103:24833) ───────────── */
export const MAIN = { w: 652, h: 612 };
export async function paintMain(scale: number) {
  await loadFonts();
  const { c, ctx } = canvasFor(MAIN.w, MAIN.h, scale);
  rr(ctx, 0, 0, MAIN.w, MAIN.h, 26); ctx.fillStyle = "#fff"; ctx.fill();
  rr(ctx, 0, 0, MAIN.w, MAIN.h, 26); ctx.clip();
  const P = 20;
  /* шапка: знак «сообщество» и «Лента» */
  const logo = await img("logo.svg");
  ctx.drawImage(logo, P, 22, 183, 25.28);
  ctx.font = font(500, 16); ctx.fillStyle = C.heading; ctx.textAlign = "right";
  ctx.fillText("Лента", MAIN.w - P - 36, 41);
  ctx.textAlign = "left";
  ctx.fillStyle = C.icon;
  for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.arc(MAIN.w - P - 18 + k * 7 - 7, 35, 1.8, 0, Math.PI * 2); ctx.fill(); }
  /* ряд тегов: уходит под край, конец гаснет в белое */
  let x = P;
  const tagY = 70;
  for (const id of ["all", "journey", "communal", "disease", "detail", "food", "sport", "night"] as const) x += (await tag(ctx, id, x, tagY)) + 8;
  const fade = ctx.createLinearGradient(MAIN.w - 110, 0, MAIN.w - 20, 0);
  fade.addColorStop(0, "rgba(255,255,255,0)"); fade.addColorStop(1, "#fff");
  ctx.fillStyle = fade; ctx.fillRect(MAIN.w - 110, tagY - 6, 110, 44);
  /* публикация */
  const iy = 118, iw = MAIN.w - P * 2, ih = 240;
  ctx.save(); rr(ctx, P, iy, iw, ih, 16); ctx.clip();
  /* кадр как в макете: картинка на всю ширину, высота 170 %, сдвиг −7,46 % */
  const hero = await img("hero.webp");
  const s = iw / hero.width;
  ctx.drawImage(hero, P, iy - ih * 0.0746, iw, hero.height * s);
  ctx.restore();
  let y = iy + ih + 20;
  await meta(ctx, 28, P, y);
  y += 20 + 16;
  ctx.font = font(600, 26); ctx.fillStyle = C.heading;
  for (const line of wrap(ctx, "Весна! Московские улицы — на смену гимнастическому залу", iw)) { y += 32; ctx.fillText(line, P, y - 8); }
  y += 24;
  let tx = P;
  for (const id of ["sport", "journey"] as const) tx += (await tag(ctx, id, tx, y + 8)) + 4;
  await arrowButton(ctx, MAIN.w - P - 48, y);
  return c;
}

/* ── карточка-история: фото, тег на стыке, заголовок, счётчики ─────────────────────────────────────────── */
export type Story = { photo: string; tag: TagId; title: string; count: number; fx?: number; fy?: number; zoom?: number };
export const STORY = { w: 300, photo: 172 };
export async function paintStory(s: Story, scale: number) {
  await loadFonts();
  const W = STORY.w, P = 16;
  const probe = canvasFor(1, 1, 1).ctx;
  probe.font = font(600, 19);
  const lines = wrap(probe, s.title, W - P * 2).slice(0, 3);
  const H = STORY.photo + 22 + lines.length * 25 + 14 + 20 + P;
  const { c, ctx } = canvasFor(W, H, scale);
  rr(ctx, 0, 0, W, H, 20); ctx.fillStyle = "#fff"; ctx.fill();
  ctx.save(); rr(ctx, 0, 0, W, STORY.photo, [20, 20, 0, 0]); ctx.clip();
  cover(ctx, await img(s.photo), 0, 0, W, STORY.photo, s.fx ?? 0.5, s.fy ?? 0.5, s.zoom ?? 1);
  ctx.restore();
  await tag(ctx, s.tag, P, STORY.photo - 16);
  let y = STORY.photo + 22;
  ctx.font = font(600, 19); ctx.fillStyle = C.heading;
  for (const line of lines) { y += 25; ctx.fillText(line, P, y - 6); }
  await meta(ctx, s.count, P, y + 12);
  return c;
}
