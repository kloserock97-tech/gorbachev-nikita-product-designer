/* v78: карточки сцены «Кабинет модератора». Данные — из Figma-файла продукта (TsqIZDg5rUgbxPNV5ghDZB):
   очередь «Пользователи» 2494:85178, профиль 2494:85463, страница комментария (cases/moderator-dashboard/01).
   Шрифт — Golos Text, цвета статусов сняты с макета. Спутники — тёмное дымчатое стекло, как на референсе Никиты,
   поэтому фон у них полупрозрачный и текст светлый. */
import { INK, MUTED, canvasFor, font, loadFonts, loadImage, rr, wrap, type Ctx } from "./draw";

const DIR = `${import.meta.env.BASE_URL}cases/moderator-dashboard/scene/`;
export const STATUS = { new: { t: "Новый", c: "#26c42d" }, edited: { t: "Отредактирован", c: "#618db1" }, work: { t: "В работе", c: "#717171" } } as const;
/* статусы и жалобы десяти пользователей из очереди (макет 2494:85178) */
const QUEUE: { s: keyof typeof STATUS; n: number }[] = [
  { s: "new", n: 1 }, { s: "new", n: 5 }, { s: "edited", n: 1 }, { s: "work", n: 3 }, { s: "work", n: 1 },
  { s: "new", n: 2 }, { s: "edited", n: 3 }, { s: "work", n: 3 }, { s: "work", n: 3 }, { s: "edited", n: 3 },
];
const DARK = "rgba(24, 22, 18, 0.62)";

export const moderatorImage = (name: string) => loadImage(DIR + name);

/** плашка статуса, как в таблице: серая капсула, цветная точка, подпись */
function pill(ctx: Ctx, s: keyof typeof STATUS, x: number, y: number, dark = false) {
  ctx.font = font(400, 14);
  const t = STATUS[s];
  const w = 6 + 12 + 6 + ctx.measureText(t.t).width + 8;
  rr(ctx, x, y, w, 24, 12); ctx.fillStyle = dark ? "rgba(255,255,255,0.14)" : "#dfdfdf"; ctx.fill();
  ctx.beginPath(); ctx.arc(x + 12, y + 12, 6, 0, Math.PI * 2); ctx.fillStyle = t.c; ctx.fill();
  ctx.fillStyle = dark ? INK : "#1a1a1a"; ctx.fillText(t.t, x + 24, y + 17);
  return w;
}
const panel = (ctx: Ctx, w: number, h: number) => { rr(ctx, 0, 0, w, h, 18); ctx.fillStyle = DARK; ctx.fill(); };

/* ── очередь: сколько ждёт проверки и жалобы по каждому ─────────────────────────────────────────────────── */
export const QUEUE_CARD = { w: 300, h: 176 };
export async function paintQueue(scale: number) {
  await loadFonts();
  const { w, h } = QUEUE_CARD;
  const { c, ctx } = canvasFor(w, h, scale);
  panel(ctx, w, h);
  ctx.font = font(500, 16); ctx.fillStyle = INK; ctx.fillText("Ожидают проверки", 20, 34);
  ctx.font = font(600, 46); ctx.fillText(String(QUEUE.length), 20, 92);
  ctx.font = font(400, 13); ctx.fillStyle = MUTED;
  ctx.fillText("пользователей", 20, 114); ctx.fillText("в очереди", 20, 131);
  /* столбики — жалобы на каждого, цвет — его статус */
  const bx = 140, by = 142, bw = 11, gap = 4;
  QUEUE.forEach((q, i) => {
    const bh = 12 + q.n * 14;
    rr(ctx, bx + i * (bw + gap), by - bh, bw, bh, 3);
    ctx.fillStyle = STATUS[q.s].c; ctx.fill();
  });
  ctx.font = font(400, 12); ctx.fillStyle = MUTED; ctx.fillText("жалобы на каждого", bx, 162);
  return c;
}

/* ── комментарий на проверке ─────────────────────────────────────────────────────────────────────────── */
export const COMMENT_CARD = { w: 300, h: 300 };
export async function paintComment(scale: number) {
  await loadFonts();
  const { w, h } = COMMENT_CARD;
  const { c, ctx } = canvasFor(w, h, scale);
  panel(ctx, w, h);
  ctx.font = font(500, 16); ctx.fillStyle = INK; ctx.fillText("Комментарий", 20, 34);
  /* жалобы: 2 — плашка в тон «Жалобы» из вкладок */
  ctx.font = font(400, 13);
  rr(ctx, 20, 50, 92, 24, 12); ctx.fillStyle = "#ffecf9"; ctx.fill();
  ctx.fillStyle = "#9c2a6d"; ctx.fillText("Жалобы: 2", 32, 67);
  pill(ctx, "new", 120, 50, true);
  ctx.font = font(400, 17); ctx.fillStyle = INK;
  let y = 108;
  for (const l of wrap(ctx, "«Гусь отличный, мне бы очень хотелось увидеть что там было на самом деле. Это же очень интересно!»", w - 40)) { ctx.fillText(l, 20, y); y += 24; }
  ctx.font = font(400, 13); ctx.fillStyle = MUTED;
  ctx.fillText("К посту «Путешествие по России:", 20, y + 10);
  ctx.fillText("от Калининграда до Владивостока»", 20, y + 28);
  ctx.strokeStyle = "rgba(255,255,255,0.14)"; ctx.beginPath(); ctx.moveTo(20, h - 58); ctx.lineTo(w - 20, h - 58); ctx.stroke();
  ctx.font = font(500, 14); ctx.fillStyle = INK; ctx.fillText("Андреев Андрей", 20, h - 32);
  ctx.font = font(400, 13); ctx.fillStyle = MUTED; ctx.fillText("03.07.2024, 12:01", 20, h - 14);
  ctx.textAlign = "right"; ctx.fillText("Борисов Алексей", w - 20, h - 14); ctx.textAlign = "left";
  return c;
}

/* ── статусы очереди: кольцо ─────────────────────────────────────────────────────────────────────────── */
export const STATS_CARD = { w: 340, h: 196 };
export async function paintStats(scale: number) {
  await loadFonts();
  const { w, h } = STATS_CARD;
  const { c, ctx } = canvasFor(w, h, scale);
  panel(ctx, w, h);
  ctx.font = font(500, 16); ctx.fillStyle = INK; ctx.fillText("Статусы в очереди", 20, 34);
  const counts = (Object.keys(STATUS) as (keyof typeof STATUS)[]).map((s) => ({ s, n: QUEUE.filter((q) => q.s === s).length }));
  const cx = 80, cy = 118, R = 52;
  let a = -Math.PI / 2;
  for (const { s, n } of counts) {
    const da = (n / QUEUE.length) * Math.PI * 2;
    ctx.beginPath(); ctx.arc(cx, cy, R, a + 0.05, a + da - 0.05); ctx.strokeStyle = STATUS[s].c; ctx.lineWidth = 12; ctx.lineCap = "round"; ctx.stroke();
    a += da;
  }
  ctx.textAlign = "center"; ctx.font = font(600, 30); ctx.fillStyle = INK; ctx.fillText(String(QUEUE.length), cx, cy + 6);
  ctx.font = font(400, 12); ctx.fillStyle = MUTED; ctx.fillText("в очереди", cx, cy + 24); ctx.textAlign = "left";
  let y = 84;
  for (const { s, n } of counts) {
    ctx.beginPath(); ctx.arc(162, y - 5, 6, 0, Math.PI * 2); ctx.fillStyle = STATUS[s].c; ctx.fill();
    ctx.font = font(400, 15); ctx.fillStyle = INK; ctx.fillText(STATUS[s].t, 176, y);
    ctx.textAlign = "right"; ctx.font = font(600, 15); ctx.fillText(String(n), w - 20, y); ctx.textAlign = "left";
    y += 34;
  }
  return c;
}

/* ── профиль пользователя (2494:85463) ───────────────────────────────────────────────────────────────── */
export const PROFILE_CARD = { w: 300, h: 352 };
export async function paintProfile(scale: number) {
  await loadFonts();
  const { w, h } = PROFILE_CARD;
  const { c, ctx } = canvasFor(w, h, scale);
  panel(ctx, w, h);
  ctx.font = font(500, 16); ctx.fillStyle = INK; ctx.fillText("Пользователь 12313", 20, 34);
  const av = await moderatorImage("avatar.webp");
  ctx.save(); ctx.beginPath(); ctx.arc(48, 82, 28, 0, Math.PI * 2); ctx.clip();
  const s = 56 / Math.min(av.width, av.height);
  ctx.drawImage(av, 48 - (av.width * s) / 2, 82 - (av.height * s) / 2, av.width * s, av.height * s);
  ctx.restore();
  ctx.font = font(600, 19); ctx.fillStyle = INK; ctx.fillText("Юлия Некрасова", 88, 78);
  ctx.font = font(400, 13); ctx.fillStyle = MUTED; ctx.fillText("Ник: Юля", 88, 97);
  const rows: [string, string][] = [["Дата рождения", "01.12.1974"], ["Карма", "−3000"], ["Рейтинг", "−3000"]];
  let y = 138;
  for (const [k, v] of rows) {
    ctx.font = font(400, 14); ctx.fillStyle = MUTED; ctx.fillText(k, 20, y);
    ctx.fillStyle = v.startsWith("−") ? "#ff8a7a" : INK; ctx.fillText(v, 140, y);
    y += 26;
  }
  ctx.font = font(400, 14); ctx.fillStyle = MUTED; ctx.fillText("О себе", 20, y);
  ctx.fillStyle = INK;
  for (const l of wrap(ctx, "Работа не волк, работа это ворк. Волк — это ходить.", w - 160)) { ctx.fillText(l, 140, y); y += 19; }
  pill(ctx, "new", 20, h - 72, true);
  ctx.font = font(400, 13); ctx.fillStyle = MUTED; ctx.fillText("Жалобы: 2", 120, h - 55);
  rr(ctx, 20, h - 40, w - 40, 30, 15); ctx.fillStyle = "#f4efe6"; ctx.fill();
  ctx.font = font(500, 14); ctx.fillStyle = "#212121"; ctx.textAlign = "center"; ctx.fillText("Взять в работу", w / 2, h - 20); ctx.textAlign = "left";
  return c;
}

/* ── решение прямо в списке: кнопки страницы комментария ─────────────────────────────────────────────── */
export const ACTIONS_CARD = { w: 700, h: 84 };
export async function paintActions(scale: number) {
  await loadFonts();
  const { w, h } = ACTIONS_CARD;
  const { c, ctx } = canvasFor(w, h, scale);
  rr(ctx, 0, 0, w, h, 20); ctx.fillStyle = "rgba(250, 248, 244, 0.94)"; ctx.fill();
  ctx.font = font(400, 17);
  const btns = [["Одобрить", true], ["Скрыть", false], ["Отправить менеджеру", false], ["Удалить", false]] as const;
  const total = btns.reduce((a, [t]) => a + ctx.measureText(t).width + 52, 0) + 12 * (btns.length - 1);
  let x = (w - total) / 2;
  for (const [t, dark] of btns) {
    const bw = ctx.measureText(t).width + 52;
    rr(ctx, x, 20, bw, 44, 22); ctx.fillStyle = dark ? "#212121" : "#efefef"; ctx.fill();
    ctx.fillStyle = dark ? "#fff" : "#212121"; ctx.textAlign = "center"; ctx.fillText(t, x + bw / 2, 48); ctx.textAlign = "left";
    x += bw + 12;
  }
  return c;
}
