/* v78: сцена кейса Restaurant Guru. Раскладка — по референсу Никиты (assets-src/ref-restaurant-guru.png):
   телефон под стеклянным куполом на стеклянной плите с горизонталями, слева карточка блюда и пин, справа —
   карточка места. Содержимое — из макетов концепта: на телефоне главный экран (01-home); на карточках —
   «Дим-самы» с того же экрана и бар «Ронин» с его карточки места (09-place-card): рейтинг 4,7, 1,2 км.
   Референс придумал «Italian 3,4 km» и «Coffee 800 m» — здесь места из макета. */
import { createCaseScene, type CaseScene } from "./kit";
import { MUTED, caseImage, chip, sheet, text, type Ctx } from "./draw";

const HUB: [number, number] = [830, 470];
const BG = "rgba(34, 22, 20, 0.62)";

const crop = (ctx: Ctx, im: HTMLImageElement, sx: number, sy: number, sw: number, sh: number, x: number, y: number, w: number, h: number, r: number) => {
  ctx.save(); ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.clip();
  const s = Math.max(w / sw, h / sh);
  const cw = w / s, ch = h / s;
  ctx.drawImage(im, sx + (sw - cw) / 2, sy + (sh - ch) / 2, cw, ch, x, y, w, h);
  ctx.restore();
};
const heart = (ctx: Ctx, x: number, y: number) => {
  ctx.strokeStyle = "#f4efe6"; ctx.lineWidth = 2; ctx.beginPath();
  ctx.moveTo(x, y + 6); ctx.bezierCurveTo(x - 12, y - 3, x - 5, y - 12, x, y - 5); ctx.bezierCurveTo(x + 5, y - 12, x + 12, y - 3, x, y + 6); ctx.stroke();
};

const paintDish = (home: HTMLImageElement) => (s: number) => sheet(240, 230, s, (ctx: Ctx) => {
  crop(ctx, home, 40, 1356, 336, 190, 10, 10, 220, 138, 14);
  text(ctx, "Дим-самы", 20, 180, { w: 600, size: 20 });
  text(ctx, "Для вас · по сохранённым", 20, 204, { size: 13, color: MUTED });
  heart(ctx, 212, 178);
}, BG, 20);

const paintPlace = (card: HTMLImageElement) => (s: number) => sheet(250, 250, s, (ctx: Ctx) => {
  crop(ctx, card, 40, 365, 706, 440, 10, 10, 230, 140, 14);
  text(ctx, "Ронин", 20, 180, { w: 600, size: 20 });
  text(ctx, "японский бар", 20, 202, { size: 13, color: MUTED });
  chip(ctx, "★ 4,7", 20, 214, { bg: "rgba(255,255,255,0.12)", color: "#ffd27a", size: 12, h: 24 });
  chip(ctx, "1,2 км", 82, 214, { bg: "rgba(255,255,255,0.12)", color: "#f4efe6", size: 12, h: 24 });
  heart(ctx, 222, 178);
}, BG, 20);

/* пин: стеклянная капля с вилкой и ножом, как на референсе */
const paintPin = (s: number) => sheet(120, 150, s, (ctx: Ctx) => {
  const g = ctx.createRadialGradient(60, 54, 6, 60, 60, 60);
  g.addColorStop(0, "rgba(255, 214, 140, 0.95)"); g.addColorStop(1, "rgba(214, 120, 40, 0.8)");
  ctx.beginPath(); ctx.moveTo(60, 146); ctx.bezierCurveTo(20, 100, 8, 82, 8, 58); ctx.arc(60, 58, 52, Math.PI, 0); ctx.bezierCurveTo(112, 82, 100, 100, 60, 146); ctx.fillStyle = g; ctx.fill();
  ctx.strokeStyle = "rgba(255,240,210,0.9)"; ctx.lineWidth = 2; ctx.stroke();
  ctx.strokeStyle = "#fff8ec"; ctx.lineWidth = 5; ctx.lineCap = "round";
  ctx.beginPath(); ctx.moveTo(48, 36); ctx.lineTo(48, 84); ctx.moveTo(40, 36); ctx.lineTo(40, 52); ctx.quadraticCurveTo(48, 60, 56, 52); ctx.lineTo(56, 36); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(74, 84); ctx.lineTo(74, 36); ctx.quadraticCurveTo(86, 46, 80, 64); ctx.lineTo(74, 64); ctx.stroke();
}, null);

export function createGuruScene(canvas: HTMLCanvasElement): CaseScene {
  return createCaseScene(canvas, {
    hub: HUB,
    squeeze: 0.95,
    box: [430, 150, 1310, 735],
    async build(k) {
      k.glow(830, 500, -200, 1000, 760, "#ff9a40", 0.46);
      k.glow(830, 650, -40, 900, 260, "#ffb050", 0.6);
      /* стеклянная плита под телефоном: её горизонтали светятся */
      for (let i = 0; i < 6; i++) {
        k.orbit({ c: [840, 612 + i * 4], r: 280 - i * 38, sx: 1.25, tilt: 11, rotZ: -2, from: -90, to: 270, color: i % 2 ? "#ffd08a" : "#fff0cc", width: i === 0 ? 2 : 1.2, opacity: 0.9 - i * 0.1, wobble: 0.09, seed: i * 2.1, fade: () => 1, delay: 0.25 + i * 0.06 });
      }
      k.bubble(870, 400, -140, 250, "#ffe2b0", 0.5);
      k.sparkField([840, 460], [620, 300], 110, "#ffc070", [[650, 560, 12], [1130, 420, 9], [1180, 330, 9]]);
      k.rocks([[370, 330, 22, -40], [1290, 360, 18, -30], [410, 440, 14, 0], [1350, 560, 16, 20], [520, 700, 20, 60], [1150, 720, 16, 60]]);

      const ts = k.texScale();
      const [home, place] = await Promise.all([caseImage("restaurant-guru/01-home.webp"), caseImage("restaurant-guru/09-place-card.webp")]);
      /* телефон с настоящим главным экраном */
      const iw = 226, ih = (iw * home.height) / home.width;
      k.card({ map: k.imageTexture(home), size: [iw + 18, ih + 18], inner: [iw, ih], radius: 46, innerRadius: 38, glass: 0.96, tint: "#262222", warm: 0.8, halo: 0.42, margin: 80, c: [850, 420], z: 20, r: [-2, 14, -12], delay: 0, amp: 3, order: 5 });

      const sat = async (paint: (s: number) => Promise<HTMLCanvasElement>, w0: number, h0: number, w: number, c: [number, number], z: number, r: [number, number, number], delay: number, glass = 0.45) => {
        const cv = await paint((w / w0) * ts * 2);
        const h = (w * h0) / w0;
        k.card({ map: k.canvasTexture(cv), size: [w + 12, h + 12], inner: [w, h], radius: 22, innerRadius: 18, glass, tint: "#5a3a2a", halo: glass ? 0.3 : 0, margin: 40, c, z, r, delay, amp: 5, order: 3 });
      };
      await sat(paintDish(home), 240, 230, 180, [548, 318], -20, [6, 22, -10], 0.22);
      await sat(paintPlace(place), 250, 250, 180, [1196, 470], 0, [4, -24, 8], 0.3);
      const pin = await paintPin((80 / 120) * ts * 2);
      k.card({ map: k.canvasTexture(pin), size: [80, 100], inner: [80, 100], radius: 0, innerRadius: 0, glass: 0, rim: 0, halo: 0, margin: 0, c: [650, 500], z: 30, r: [0, 10, 0], delay: 0.36, amp: 8, order: 6 });
    },
  });
}
