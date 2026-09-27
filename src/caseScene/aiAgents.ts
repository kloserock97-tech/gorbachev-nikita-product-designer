/* v78: сцена кейса «Риски ИИ-агентов». Раскладка — по референсу Никиты (assets-src/ref-ai-agents.png).
   Содержимое — из Figma-файла продукта (XomA0T1zFMATidI4Qq5nEw) и текста кейса:
   - главная панель — реестр «Риски ИИ-агентов» (кадр 20:2), рендер Figma 2×;
   - уровни риска у оценённых (9 / 31 / 58 / 44 из того же реестра), итог кейса 6 → 0 передач,
     путь версии «новая → оценка → согласование → согласовано», риски версии из карточки агента.
   Референс придумал «+40 %» и «Причины риска: галлюцинации 12…» — их здесь нет. */
import { createCaseScene, type CaseScene } from "./kit";
import { MUTED, caseImage, chip, hr, para, sheet, step, text, type Ctx } from "./draw";

const HUB: [number, number] = [925, 450];
const LIME = "#b9f27a";

const levels = [
  { t: "Очень высокий", n: 9, c: "#f0524b" },
  { t: "Высокий", n: 31, c: "#ff8f86" },
  { t: "Средний", n: 58, c: "#ffb648" },
  { t: "Низкий", n: 44, c: "#9aa3a0" },
];

/* уровни риска у оценённых агентов — столбики */
const paintLevels = (s: number) => sheet(300, 262, s, (ctx: Ctx) => {
  text(ctx, "Уровень риска у оценённых", 20, 34, { w: 500, size: 16 });
  text(ctx, "142", 20, 84, { w: 600, size: 44 });
  text(ctx, "агента из 639", 104, 80, { size: 14, color: MUTED });
  const max = 58, bx = 20, by = 198, bw = 56, gap = 14;
  levels.forEach((l, i) => {
    const h = 14 + (l.n / max) * 56;
    const x = bx + i * (bw + gap);
    ctx.beginPath(); ctx.roundRect(x, by - h, bw, h, 6); ctx.fillStyle = l.c; ctx.fill();
    text(ctx, String(l.n), x + bw / 2, by - h - 8, { w: 600, size: 15, align: "center" });
  });
  hr(ctx, 20, 206, 260);
  let x = 20;
  for (const l of levels.slice(0, 2)) {
    ctx.beginPath(); ctx.arc(x + 5, 231, 5, 0, Math.PI * 2); ctx.fillStyle = l.c; ctx.fill();
    x += 14 + text(ctx, l.t, x + 14, 236, { size: 13, color: MUTED }) + 16;
  }
});

/* итог кейса: шесть передач из рук в руки — ноль */
const paintRoute = (s: number) => sheet(300, 188, s, (ctx: Ctx) => {
  text(ctx, "Передачи на пути оценки", 20, 34, { w: 500, size: 16 });
  text(ctx, "6", 20, 100, { w: 600, size: 54 });
  text(ctx, "→", 62, 96, { w: 500, size: 38, color: LIME });
  text(ctx, "0", 110, 100, { w: 600, size: 54, color: LIME });
  para(ctx, "из рук в руки: всё в одной карточке", 20, 132, 170, { size: 13, color: MUTED, lh: 18 });
  /* спад: шесть ступенек до нуля */
  ctx.strokeStyle = LIME; ctx.lineWidth = 2.5; ctx.lineJoin = "round"; ctx.beginPath();
  for (let i = 0; i <= 6; i++) { const x = 190 + i * 14, y = 70 + i * 13; if (i) ctx.lineTo(x, y - 13); else ctx.moveTo(x, y); ctx.lineTo(x, y); }
  ctx.stroke();
  chip(ctx, "−100 %", 200, 150, { bg: "rgba(185,242,122,0.18)", color: LIME, size: 14, h: 26 });
});

/* путь версии агента */
const paintPath = (s: number) => sheet(420, 170, s, (ctx: Ctx) => {
  text(ctx, "Путь версии", 20, 34, { w: 500, size: 16 });
  const steps = ["Новая", "Оценка", "Согласование", "Согласовано"];
  const x0 = 50, dx = 106, y = 88;
  ctx.strokeStyle = "rgba(255,255,255,0.25)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x0 + dx * 3, y); ctx.stroke();
  ctx.strokeStyle = LIME; ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x0 + dx, y); ctx.stroke();
  steps.forEach((t, i) => {
    step(ctx, x0 + i * dx, y, 14, i < 2, i + 1, LIME);
    text(ctx, t, x0 + i * dx, y + 38, { size: 12.5, color: i < 2 ? "#f4efe6" : MUTED, align: "center" });
  });
  text(ctx, "4 подразделения дают заключение", 20, 154, { size: 13, color: MUTED });
});

/* риски версии: 13 типов, первые четыре из карточки агента */
const risks = [
  { t: "Отказ инфраструктуры ИИ-платформ и сервисов", l: "Высокий", c: "#ff8f86" },
  { t: "Взаимное влияние ИИ-решений", l: "Средний", c: "#ffb648" },
  { t: "Прямые промпт-инъекции и манипуляции выводом модели", l: "Высокий", c: "#ff8f86" },
  { t: "Уязвимости конфигурации и цепочки поставок", l: "Средний", c: "#ffb648" },
];
const paintRisks = (s: number) => sheet(300, 300, s, (ctx: Ctx) => {
  text(ctx, "Риски версии", 20, 34, { w: 500, size: 16 });
  text(ctx, "13", 280, 34, { w: 600, size: 16, align: "right", color: LIME });
  let y = 62;
  for (const r of risks) {
    hr(ctx, 20, y - 8, 260);
    const end = para(ctx, r.t, 20, y + 12, 190, { size: 13, lh: 17, max: 2 });
    chip(ctx, r.l, 212, y + 1, { bg: "rgba(255,255,255,0.1)", color: r.c, size: 12, h: 22, dot: r.c });
    y = Math.max(end, y + 40) + 8;
  }
  text(ctx, "…и ещё девять типов", 20, 286, { size: 13, color: MUTED });
});

export function createAiAgentsScene(canvas: HTMLCanvasElement): CaseScene {
  return createCaseScene(canvas, {
    hub: HUB,
    box: [300, 130, 1640, 690],
    async build(k) {
      k.glow(930, 440, -240, 1300, 860, "#8fd64a", 0.3);
      k.glow(930, 690, -10, 900, 180, "#b8f07a", 0.45);
      k.glow(430, 380, -160, 480, 520, "#9ee060", 0.14);
      k.glow(1460, 400, -160, 520, 560, "#9ee060", 0.14);

      k.orbit({ c: [950, 430], r: 660, tilt: 19, rotZ: -4, from: 175, to: 365, color: "#e4ffc8", opacity: 0.5, delay: 0.45 });
      k.orbit({ c: [930, 440], r: 610, tilt: 15, rotZ: 6, from: 185, to: 350, color: "#e4ffc8", opacity: 0.4, delay: 0.55 });
      const link = (pts: [number, number, number][], delay: number) => k.curve(pts, { color: LIME, width: 1.8, opacity: 1, delay, dur: 0.7 });
      link([[552, 250, -20], [575, 262, -10], [598, 262, 0]], 0.55);
      link([[512, 500, 0], [548, 470, -5], [590, 470, 0]], 0.6);
      link([[1180, 212, 0], [1240, 180, -20], [1296, 230, -20]], 0.65);
      link([[1262, 460, 0], [1296, 430, -10], [1326, 450, -20]], 0.7);
      link([[430, 350, -10], [400, 390, -10], [395, 428, -10]], 0.75);

      k.sparkField([940, 430], [680, 300], 110, "#d6ff9e", [[552, 250, 12], [590, 470, 11], [1296, 230, 12], [1326, 450, 12], [395, 428, 10], [1180, 212, 9]]);
      k.rocks([[300, 640, 26, 40], [470, 705, 18, 60], [1350, 700, 22, 50], [1560, 660, 16, 20], [820, 745, 14, 60], [1500, 132, 10, -80], [240, 250, 9, -80]]);

      const ts = k.texScale();
      const im = await caseImage("ai-agents/scene/registry.webp");
      const iw = 670, ih = (iw * im.height) / im.width;
      k.card({ size: [iw + 26, ih + 26], radius: 30, glass: 0.4, halo: 0, c: [955, 462], z: -45, r: [-6, -8, 2], delay: 0.08, amp: 3, order: 1 });
      k.card({ map: k.imageTexture(im), size: [iw + 30, ih + 30], inner: [iw, ih], radius: 30, innerRadius: 14, glass: 0.66, warm: 0.6, halo: 0.36, margin: 70, c: [925, 450], z: 0, r: [-6, -8, 2], delay: 0, amp: 3, order: 5 });

      const sat = async (paint: (s: number) => Promise<HTMLCanvasElement>, w0: number, h0: number, w: number, c: [number, number], z: number, r: [number, number, number], delay: number) => {
        const cv = await paint((w / w0) * ts * 2);
        const h = (w * h0) / w0;
        k.card({ map: k.canvasTexture(cv), size: [w + 12, h + 12], inner: [w, h], radius: 20, innerRadius: 15, glass: 0.5, tint: "#26301e", halo: 0.26, margin: 40, c, z, r, delay, amp: 5 });
      };
      await sat(paintLevels, 300, 262, 237, [437, 236], -30, [4, 14, 3], 0.22);
      await sat(paintRoute, 300, 188, 243, [393, 503], 10, [-2, 14, -1], 0.3);
      await sat(paintPath, 420, 170, 340, [1457, 262], -30, [4, -14, -1], 0.26);
      await sat(paintRisks, 300, 300, 290, [1472, 532], -10, [-2, -14, 2], 0.34);
    },
  });
}
