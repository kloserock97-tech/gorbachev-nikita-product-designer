/* v78: сцена кейса GRIF AI. Раскладка — по референсу Никиты (assets-src/ref-grif-ai.png): панель чата на
   парящем острове со светящимися горизонталями, за ней стеклянный пузырь, вокруг стеклянные карточки.
   Содержимое — из Figma-файла продукта (fpMhI2lUFjbMoiZVOVcJHe, «New concept»):
   - главная панель — чат «Анализ встречи» (кадр 05) целиком, с шторкой черновика справа, рендер Figma 2×;
     файл сцены уменьшен до 1600 px — ближе к размеру на экране, чтобы тонкий светлый текст не размывался мипмапами;
   - спутники — оттуда же: «Собрал контекст», черновик письма Сергею через Gmail, договорённости встречи
     и память «при Сергее не упоминать конкурента X».
   Референс придумал «Резюме встречи, готово за 10 секунд» — здесь время из самого экрана: 1 мин 47 сек. */
import { createCaseScene, type CaseScene, type SceneHost } from "./kit";
import { MUTED, caseImage, chip, hr, para, sheet, text, type Ctx } from "./draw";

const HUB: [number, number] = [900, 430];
const LEMON = "#e8f27a";
const BLUE = "#4d5cff";

/* лёгкое светлое стекло с тёмным текстом — как карточки на референсе */
const GLASS_BG = "rgba(34, 38, 22, 0.66)";
const TXT = "#f6f7ee";

const paintContext = (s: number) => sheet(260, 250, s, (ctx: Ctx) => {
  ctx.beginPath(); ctx.roundRect(20, 20, 40, 40, 10); ctx.fillStyle = "rgba(255,255,255,0.16)"; ctx.fill();
  ctx.strokeStyle = TXT; ctx.lineWidth = 2; ctx.beginPath(); ctx.roundRect(31, 29, 18, 22, 3); ctx.stroke();
  for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(35, 36 + i * 5); ctx.lineTo(45, 36 + i * 5); ctx.stroke(); }
  ctx.beginPath(); ctx.arc(222, 40, 16, 0, Math.PI * 2); ctx.strokeStyle = LEMON; ctx.lineWidth = 2; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(214, 40); ctx.lineTo(220, 46); ctx.lineTo(231, 34); ctx.stroke();
  text(ctx, "Бриф готов", 20, 96, { w: 600, size: 20, color: TXT });
  para(ctx, "Собрал контекст — 4 источника, 1 мин 47 сек", 20, 124, 220, { size: 14, color: MUTED, lh: 19 });
  let x = 20;
  for (const t of ["Telegram", "Gmail", "Notion"]) x += chip(ctx, t, x, 176, { bg: "rgba(255,255,255,0.14)", color: TXT, size: 12, h: 26 }) + 6;
  ctx.fillStyle = "rgba(255,255,255,0.22)";
  for (const [y, w] of [[222, 200], [236, 150]]) { ctx.beginPath(); ctx.roundRect(20, y, w, 6, 3); ctx.fill(); }
}, GLASS_BG, 22);

const paintDraft = (s: number) => sheet(300, 222, s, (ctx: Ctx) => {
  ctx.beginPath(); ctx.roundRect(20, 20, 40, 40, 10); ctx.fillStyle = "rgba(255,255,255,0.16)"; ctx.fill();
  ctx.strokeStyle = TXT; ctx.lineWidth = 2; ctx.beginPath(); ctx.roundRect(29, 31, 22, 16, 2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(29, 32); ctx.lineTo(40, 41); ctx.lineTo(51, 32); ctx.stroke();
  text(ctx, "Черновик письма", 74, 38, { w: 600, size: 17, color: TXT });
  text(ctx, "отправится через Gmail", 74, 57, { size: 13, color: MUTED });
  hr(ctx, 20, 76, 260);
  text(ctx, "Кому:", 20, 102, { size: 13, color: MUTED });
  text(ctx, "Сергей · AcmeCorp", 70, 102, { size: 14, color: TXT });
  text(ctx, "Тема:", 20, 128, { size: 13, color: MUTED });
  para(ctx, "Follow-up по партнёрству — next steps", 70, 128, 210, { size: 14, color: TXT, lh: 18 });
  ctx.beginPath(); ctx.roundRect(20, 172, 124, 34, 17); ctx.fillStyle = BLUE; ctx.fill();
  text(ctx, "Отправить", 82, 194, { w: 500, size: 14, color: "#fff", align: "center" });
  ctx.beginPath(); ctx.arc(262, 189, 17, 0, Math.PI * 2); ctx.strokeStyle = "rgba(255,255,255,0.5)"; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(255, 189); ctx.lineTo(268, 189); ctx.moveTo(263, 184); ctx.lineTo(268, 189); ctx.lineTo(263, 194); ctx.stroke();
}, GLASS_BG, 22);

const paintAgreed = (s: number) => sheet(300, 250, s, (ctx: Ctx) => {
  ctx.beginPath(); ctx.roundRect(20, 20, 40, 40, 10); ctx.fillStyle = "rgba(255,255,255,0.16)"; ctx.fill();
  ctx.strokeStyle = TXT; ctx.lineWidth = 2;
  for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(30, 32 + i * 8); ctx.lineTo(33, 32 + i * 8); ctx.moveTo(37, 32 + i * 8); ctx.lineTo(50, 32 + i * 8); ctx.stroke(); }
  text(ctx, "О чём договорились", 74, 38, { w: 600, size: 17, color: TXT });
  text(ctx, "выделено из встречи", 74, 57, { size: 13, color: MUTED });
  let y = 92;
  for (const t of ["Пилот на 2 недели, старт в понедельник", "Revenue share в коридоре 15–25 %", "Запуск интеграции до конца Q2"]) {
    ctx.beginPath(); ctx.roundRect(20, y - 15, 20, 20, 5); ctx.fillStyle = LEMON; ctx.fill();
    ctx.strokeStyle = "#20240e"; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(25, y - 5); ctx.lineTo(29, y - 1); ctx.lineTo(36, y - 10); ctx.stroke();
    y = para(ctx, t, 52, y, 228, { size: 14, color: TXT, lh: 19 }) + 14;
  }
}, GLASS_BG, 22);

const paintMemory = (s: number) => sheet(330, 64, s, (ctx: Ctx) => {
  ctx.beginPath(); ctx.roundRect(16, 16, 32, 32, 8); ctx.fillStyle = "rgba(77,92,255,0.35)"; ctx.fill();
  text(ctx, "✓", 32, 38, { w: 600, size: 16, color: "#fff", align: "center" });
  para(ctx, "Запомнил: при Сергее не упоминать конкурента X", 60, 28, 256, { size: 13, color: TXT, lh: 17 });
}, "rgba(20, 22, 30, 0.7)", 18);

export function createGrifScene(host: SceneHost): CaseScene {
  return createCaseScene(host, {
    hub: HUB,
    box: [370, 150, 1530, 720],
    async build(k) {
      /* остров: плоский камень, на верхней грани светятся горизонтали */
      k.island(890, 705, -120, 820, 120, 280, 5);
      k.glow(890, 560, -60, 1100, 360, "#e2ee6a", 0.42);
      k.glow(900, 420, -260, 1300, 820, "#c8d64a", 0.3);
      for (let i = 0; i < 5; i++) {
        k.orbit({ c: [890, 652 + i * 5], r: 290 - i * 46, sx: 1.12, tilt: 9, rotZ: -3, from: -90, to: 270, color: "#f4ff9c", width: i === 0 ? 1.8 : 1.3, opacity: 0.85 - i * 0.12, wobble: 0.12, seed: i * 1.7, fade: () => 1, delay: 0.25 + i * 0.07 });
      }
      k.bubble(1050, 410, -200, 260, "#f2ffb0", 0.55);
      k.sparkField([900, 420], [640, 300], 120, "#f4ff9c", [[1070, 175, 10], [440, 520, 9], [1260, 560, 9]]);
      k.rocks([[1110, 160, 26, -30], [445, 505, 22, 30], [1195, 400, 18, -60], [540, 700, 14, 40], [1560, 250, 10, -80], [300, 640, 16, 30], [1430, 760, 18, 60]]);

      const ts = k.texScale();
      const im = await caseImage("grif-ai/scene/chat.webp");
      const iw = 620, ih = (iw * im.height) / im.width;
      k.card({ size: [iw + 26, ih + 26], radius: 34, glass: 0.35, tint: "#2a2d22", halo: 0, c: [922, 470], z: -45, r: [-6, 14, 4], delay: 0.08, amp: 3, order: 1 });
      k.card({ map: k.imageTexture(im), size: [iw + 30, ih + 30], inner: [iw, ih], radius: 34, innerRadius: 20, glass: 0.5, tint: "#8a8f78", warm: 0.4, halo: 0.4, screen: true, margin: 70, c: [898, 462], z: 0, r: [-6, 14, 4], delay: 0, amp: 3, order: 5 });

      const sat = async (paint: (s: number) => Promise<HTMLCanvasElement>, w0: number, h0: number, w: number, c: [number, number], z: number, r: [number, number, number], delay: number, order = 3) => {
        const cv = await paint((w / w0) * ts * 2);
        const h = (w * h0) / w0;
        k.card({ map: k.canvasTexture(cv), size: [w + 12, h + 12], inner: [w, h], radius: 22, innerRadius: 18, glass: 0.4, tint: "#566036", halo: 0.3, margin: 40, c, z, r, delay, amp: 5, order });
      };
      await sat(paintContext, 260, 250, 200, [497, 352], 20, [4, 18, 8], 0.22);
      await sat(paintDraft, 300, 222, 240, [1333, 327], -20, [4, -18, -7], 0.28);
      await sat(paintAgreed, 300, 250, 250, [1375, 556], 0, [-2, -16, -8], 0.34);
      await sat(paintMemory, 330, 64, 300, [870, 668], 160, [-8, 6, 2], 0.42, 7);
    },
  });
}
