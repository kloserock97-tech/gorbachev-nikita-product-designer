/* v78: сцена кейса «Плати частями». Раскладка — по референсу Никиты (assets-src/ref-plati-chastyami.png):
   телефон в золотом кольце на мшистом камне, по сторонам четыре стеклянные карточки.
   Содержимое — из Figma-файла продукта (BzIehGAJZ6BPyHDEFYffyA): на телефоне главный экран банка с карточкой
   «Плати частями» (01-sbol-widget), на карточках — цифры тех же экранов: ближайший платёж 3 100 ₽ 28 августа,
   7 из 12 платежей и 12 450 ₽ остатка, перенос на 6 сентября бесплатно, итог «стало свободнее на 3 100 ₽».
   Референс придумал «15 апреля» и «доступно 67 550 ₽» — их здесь нет. */
import { createCaseScene, type CaseScene, type SceneHost } from "./kit";
import { MUTED, caseImage, chip, para, sheet, text, type Ctx } from "./draw";

const HUB: [number, number] = [860, 470];
const GREEN = "#21a038";
const MINT = "#7ce0a0";
const BG = "rgba(26, 34, 24, 0.62)";

const icon = (ctx: Ctx, draw: (ctx: Ctx) => void) => {
  ctx.beginPath(); ctx.roundRect(20, 20, 40, 40, 12); ctx.fillStyle = "rgba(255,255,255,0.14)"; ctx.fill();
  ctx.strokeStyle = "#f4efe6"; ctx.lineWidth = 2; ctx.lineCap = "round"; ctx.lineJoin = "round";
  draw(ctx);
};
const arrowBtn = (ctx: Ctx, x: number, y: number) => {
  ctx.beginPath(); ctx.arc(x, y, 16, 0, Math.PI * 2); ctx.fillStyle = "rgba(255,255,255,0.12)"; ctx.fill();
  ctx.strokeStyle = "#f4efe6"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - 3, y - 6); ctx.lineTo(x + 3, y); ctx.lineTo(x - 3, y + 6); ctx.stroke();
};
const calendar = (ctx: Ctx) => { ctx.beginPath(); ctx.roundRect(29, 31, 22, 20, 4); ctx.stroke(); ctx.beginPath(); ctx.moveTo(29, 38); ctx.lineTo(51, 38); ctx.moveTo(35, 27); ctx.lineTo(35, 33); ctx.moveTo(45, 27); ctx.lineTo(45, 33); ctx.stroke(); };

const paintNext = (s: number) => sheet(280, 170, s, (ctx: Ctx) => {
  icon(ctx, calendar);
  text(ctx, "Ближайший платёж", 74, 46, { w: 500, size: 16 });
  text(ctx, "3 100 ₽", 20, 108, { w: 600, size: 34 });
  text(ctx, "Мегамаркет · 28 августа", 20, 140, { size: 14, color: MUTED });
  arrowBtn(ctx, 246, 126);
}, BG, 22);

const paintStatus = (s: number) => sheet(300, 170, s, (ctx: Ctx) => {
  const cx = 70, cy = 85, r = 44;
  ctx.lineCap = "round";
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.strokeStyle = "rgba(255,255,255,0.14)"; ctx.lineWidth = 9; ctx.stroke();
  ctx.beginPath(); ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (7 / 12)); ctx.strokeStyle = MINT; ctx.stroke();
  text(ctx, "7 из 12", cx, cy + 6, { w: 600, size: 17, align: "center" });
  text(ctx, "Осталось выплатить", 134, 64, { w: 500, size: 15 });
  text(ctx, "12 450 ₽", 134, 100, { w: 600, size: 26 });
  text(ctx, "3 покупки · 7 из 12 платежей", 134, 124, { size: 12, color: MUTED });
  arrowBtn(ctx, 268, 146);
}, BG, 22);

const paintMove = (s: number) => sheet(300, 190, s, (ctx: Ctx) => {
  icon(ctx, calendar);
  text(ctx, "Лучше после зарплаты", 74, 46, { w: 500, size: 16 });
  text(ctx, "6 сентября", 20, 104, { w: 600, size: 30 });
  chip(ctx, "бесплатно", 186, 84, { bg: "rgba(124,224,160,0.2)", color: MINT, size: 13, h: 26 });
  ctx.beginPath(); ctx.roundRect(20, 128, 150, 42, 21); ctx.fillStyle = GREEN; ctx.fill();
  text(ctx, "Перенести", 95, 155, { w: 500, size: 15, align: "center" });
  text(ctx, "вместо 28 августа", 184, 154, { size: 12.5, color: MUTED });
}, BG, 22);

const paintDone = (s: number) => sheet(300, 180, s, (ctx: Ctx) => {
  icon(ctx, (c) => { c.beginPath(); c.moveTo(30, 41); c.lineTo(37, 48); c.lineTo(51, 33); c.stroke(); });
  text(ctx, "Готово", 74, 46, { w: 500, size: 16 });
  para(ctx, "Свободных денег до зарплаты стало больше", 20, 92, 230, { size: 14, color: MUTED, lh: 19 });
  text(ctx, "+3 100 ₽", 20, 154, { w: 600, size: 30, color: MINT });
  arrowBtn(ctx, 268, 144);
}, BG, 22);

export function createPlatiScene(host: SceneHost): CaseScene {
  return createCaseScene(host, {
    hub: HUB,
    squeeze: 0.9,
    box: [350, 170, 1440, 790],
    async build(k) {
      k.glow(870, 520, -200, 900, 760, "#ffb440", 0.4);
      k.glow(870, 700, -20, 620, 170, "#ffc060", 0.55);
      /* золотое кольцо вокруг телефона: передняя половина перед ним, задняя — за */
      k.orbit({ c: [870, 500], r: 290, tilt: 27, rotZ: -4, from: 0, to: 360, color: "#ffd27a", width: 2.4, opacity: 0.95, fade: () => 1, delay: 0.3 });
      k.sparkField([870, 470], [560, 300], 110, "#ffcf7a", [[560, 360, 10], [1220, 360, 10], [930, 620, 9]]);
      k.rocks([[405, 285, 24, -40], [300, 590, 18, 30], [1480, 590, 16, 20], [640, 730, 22, 60], [1050, 750, 18, 60], [1180, 180, 9, -80]]);

      const ts = k.texScale();
      /* телефон: тёмный корпус-стекло, внутри настоящий экран */
      const im = await caseImage("plati-chastyami/01-sbol-widget.webp");
      const iw = 236, ih = (iw * im.height) / im.width;
      k.card({ map: k.imageTexture(im), size: [iw + 18, ih + 18], inner: [iw, ih], radius: 48, innerRadius: 40, glass: 0.96, tint: "#2a2a26", warm: 0.8, halo: 0.4, margin: 80, c: [860, 500], z: 20, r: [-4, -18, -9], delay: 0, amp: 3, order: 5 });

      const sat = async (paint: (s: number) => Promise<HTMLCanvasElement>, w0: number, h0: number, w: number, c: [number, number], z: number, r: [number, number, number], delay: number) => {
        const cv = await paint((w / w0) * ts * 2);
        const h = (w * h0) / w0;
        k.card({ map: k.canvasTexture(cv), size: [w + 12, h + 12], inner: [w, h], radius: 24, innerRadius: 19, glass: 0.45, tint: "#4a5236", halo: 0.3, margin: 40, c, z, r, delay, amp: 5, order: 3 });
      };
      await sat(paintNext, 280, 170, 250, [570, 290], -20, [6, 18, 9], 0.22);
      await sat(paintStatus, 300, 170, 270, [507, 498], 0, [-4, 18, 9], 0.3);
      await sat(paintMove, 300, 190, 300, [1258, 325], -20, [6, -18, 10], 0.26);
      await sat(paintDone, 300, 180, 300, [1232, 532], 0, [-4, -18, 10], 0.34);
    },
  });
}
