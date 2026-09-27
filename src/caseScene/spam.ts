/* v78: сцена кейса «Стоп Спам». Референса у кейса нет — композиция в том же языке, что у остальных:
   телефон под защитным куполом, за ним парит щит бренда, вокруг стеклянные карточки. Содержимое — из
   Figma-файла продукта (6Xs2X1NbfhPaTe8T0ZwDG7): на телефоне первый экран «Никаких уведомлений и лишнего шума»
   (2:8266), щит — узел 2615:15972, карточки — шаги настройки фильтра (2:8281), экран статистики
   («На финишной прямой — 90 %», «СМС заблокировано 7», «Предотвращено мошеннических звонков 7»)
   и итог кейса: +25 % доходят до включённой защиты. */
import { createCaseScene, type CaseScene } from "./kit";
import { MUTED, caseImage, para, sheet, text, type Ctx } from "./draw";

const HUB: [number, number] = [860, 450];
const BLUE = "#5b6cff";
const TEAL = "#6fd0e0";
const BG = "rgba(18, 26, 34, 0.62)";

const paintProgress = (s: number) => sheet(300, 170, s, (ctx: Ctx) => {
  text(ctx, "На финишной прямой!", 20, 36, { w: 600, size: 16 });
  para(ctx, "Предоставьте доступ к СМС", 20, 58, 180, { size: 13, color: MUTED });
  text(ctx, "90 %", 280, 60, { w: 600, size: 32, align: "right", color: TEAL });
  ctx.beginPath(); ctx.roundRect(20, 92, 260, 10, 5); ctx.fillStyle = "rgba(255,255,255,0.14)"; ctx.fill();
  ctx.beginPath(); ctx.roundRect(20, 92, 234, 10, 5); ctx.fillStyle = TEAL; ctx.fill();
  ctx.beginPath(); ctx.roundRect(20, 118, 260, 36, 18); ctx.fillStyle = "rgba(255,255,255,0.1)"; ctx.fill();
  text(ctx, "Повысить уровень защиты", 150, 141, { size: 13, align: "center" });
}, BG, 20);

const paintStats = (s: number) => sheet(300, 200, s, (ctx: Ctx) => {
  text(ctx, "За последние 30 дней", 20, 34, { w: 500, size: 15 });
  const row = (y: number, label: string, n: string, bubble: boolean) => {
    ctx.beginPath(); ctx.roundRect(20, y, 260, 64, 14); ctx.fillStyle = "rgba(255,255,255,0.08)"; ctx.fill();
    para(ctx, label, 34, y + (label.length > 20 ? 28 : 37), 130, { size: 12.5, color: MUTED, lh: 15 });
    text(ctx, n, 196, y + 42, { w: 600, size: 26, align: "right" });
    if (bubble) {
      ctx.beginPath(); ctx.roundRect(214, y + 14, 48, 32, 10); ctx.fillStyle = BLUE; ctx.fill();
      ctx.fillStyle = "#fff"; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(228 + i * 10, y + 30, 3, 0, Math.PI * 2); ctx.fill(); }
    } else {
      ctx.strokeStyle = "#ff8a5c"; ctx.lineWidth = 5; ctx.lineCap = "round"; ctx.beginPath(); ctx.arc(238, y + 32, 14, Math.PI * 0.8, Math.PI * 1.9); ctx.stroke();
    }
  };
  row(50, "СМС заблокировано", "7", true);
  row(122, "Предотвращено мошеннических звонков", "7", false);
}, BG, 20);

const STEPS = ["Настройки", "Приложения", "Сообщения", "Фильтр сообщений", "Разрешите фильтр"];
const paintSteps = (s: number) => sheet(280, 250, s, (ctx: Ctx) => {
  text(ctx, "Блокировать спам-СМС", 20, 36, { w: 600, size: 16 });
  STEPS.forEach((t, i) => {
    const y = 72 + i * 34;
    ctx.beginPath(); ctx.arc(32, y - 5, 12, 0, Math.PI * 2); ctx.fillStyle = i < 4 ? "rgba(111,208,224,0.25)" : BLUE; ctx.fill();
    text(ctx, String(i + 1), 32, y, { w: 600, size: 12, align: "center", color: i < 4 ? TEAL : "#fff" });
    text(ctx, t, 54, y, { size: 14 });
  });
}, BG, 20);

const paintResult = (s: number) => sheet(240, 130, s, (ctx: Ctx) => {
  text(ctx, "+25 %", 20, 62, { w: 600, size: 40, color: TEAL });
  para(ctx, "доходят до включённой защиты", 20, 92, 200, { size: 13, color: MUTED, lh: 17 });
}, BG, 20);

export function createSpamScene(canvas: HTMLCanvasElement): CaseScene {
  return createCaseScene(canvas, {
    hub: HUB,
    box: [360, 170, 1400, 720],
    async build(k) {
      k.glow(860, 460, -220, 1100, 780, "#4aa8d8", 0.36);
      k.glow(862, 650, -20, 520, 150, "#7fd8f0", 0.5);
      k.bubble(862, 450, -100, 270, "#bfeeff", 0.55);
      k.orbit({ c: [862, 648], r: 190, tilt: 12, rotZ: 0, from: -90, to: 270, color: "#bfeeff", width: 2, opacity: 0.85, fade: () => 1, delay: 0.25 });
      k.orbit({ c: [862, 652], r: 230, tilt: 12, rotZ: 0, from: -90, to: 270, color: "#bfeeff", width: 1.2, opacity: 0.5, fade: () => 1, delay: 0.32 });
      k.orbit({ c: [860, 430], r: 620, tilt: 17, rotZ: -5, from: 185, to: 355, color: "#dff6ff", opacity: 0.45, delay: 0.5 });
      k.sparkField([860, 440], [620, 300], 100, "#bfeeff", [[520, 250, 10], [1200, 250, 10], [1230, 560, 9]]);
      k.rocks([[330, 620, 22, 40], [1420, 650, 18, 30], [540, 720, 16, 60], [1180, 740, 14, 60], [1480, 170, 9, -80]]);

      const ts = k.texScale();
      const [phone, shield] = await Promise.all([caseImage("figma/spam-welcome@2x.webp"), caseImage("figma/spam-shield.png")]);
      /* щит бренда — за телефоном, как предмет */
      k.card({ map: k.imageTexture(shield), size: [230, 230], inner: [230, 230], radius: 0, innerRadius: 0, glass: 0, rim: 0, halo: 0, margin: 0, c: [1010, 560], z: -260, r: [0, -18, 8], delay: 0.1, amp: 6, order: 1 });
      const iw = 200, ih = (iw * phone.height) / phone.width;
      k.card({ map: k.imageTexture(phone), size: [iw + 18, ih + 18], inner: [iw, ih], radius: 44, innerRadius: 36, glass: 0.96, tint: "#1e2430", warm: 0.2, halo: 0.34, margin: 80, c: [866, 470], z: 20, r: [-3, -14, 6], delay: 0, amp: 3, order: 5 });

      const sat = async (paint: (s: number) => Promise<HTMLCanvasElement>, w0: number, h0: number, w: number, c: [number, number], z: number, r: [number, number, number], delay: number) => {
        const cv = await paint((w / w0) * ts * 2);
        const h = (w * h0) / w0;
        k.card({ map: k.canvasTexture(cv), size: [w + 12, h + 12], inner: [w, h], radius: 22, innerRadius: 18, glass: 0.45, tint: "#2c4656", halo: 0.3, margin: 40, c, z, r, delay, amp: 5, order: 3 });
      };
      await sat(paintSteps, 280, 250, 250, [500, 300], -20, [4, 18, -4], 0.22);
      await sat(paintResult, 240, 130, 210, [520, 530], 20, [-2, 18, -3], 0.3);
      await sat(paintProgress, 300, 170, 280, [1230, 290], -20, [4, -18, 4], 0.26);
      await sat(paintStats, 300, 200, 280, [1240, 520], 0, [-2, -18, 3], 0.34);
    },
  });
}
