/* v78: сцена кейса «Перестройка процесса дизайн-команды» (лидерский). Раскладка — по референсу Никиты
   (assets-src/ref-design-lead.png): круглый стол с местом дизайн-лида, над ним цепочка из пяти шагов, слева
   стопка задач «одной строкой», справа итоги. Экранов у кейса нет, поэтому всё — из текста самого кейса:
   пять вещей, которые Никита завёл за год (шаблон задачи, ревью, дизайн-долг, дизайн-система, дайджест),
   команда из четырёх дизайнеров и итоги (~1 год, ~2 500 сотрудников в продукте).
   Референс придумал «+47 запросов» и «Roadmap & priorities» с чужими пунктами — их здесь нет. */
import * as THREE from "three";
import { createCaseScene, type CaseScene, type SceneHost } from "./kit";
import { MUTED, hr, para, sheet, text, type Ctx } from "./draw";

const HUB: [number, number] = [880, 420];
const GOLD = "#ffd08a";
const BG = "rgba(40, 34, 24, 0.6)";

/* иконки шагов — линией, как на референсе */
const ICONS: Record<string, (c: Ctx, x: number, y: number) => void> = {
  brief: (c, x, y) => { c.beginPath(); c.roundRect(x - 11, y - 14, 22, 28, 3); c.moveTo(x - 6, y - 6); c.lineTo(x + 6, y - 6); c.moveTo(x - 6, y); c.lineTo(x + 6, y); c.moveTo(x - 6, y + 6); c.lineTo(x + 2, y + 6); c.stroke(); },
  review: (c, x, y) => { c.beginPath(); c.ellipse(x, y, 15, 9, 0, 0, Math.PI * 2); c.stroke(); c.beginPath(); c.arc(x, y, 4.5, 0, Math.PI * 2); c.stroke(); },
  debt: (c, x, y) => { c.beginPath(); c.moveTo(x - 12, y - 8); c.lineTo(x + 12, y - 8); c.moveTo(x - 12, y); c.lineTo(x + 12, y); c.moveTo(x - 12, y + 8); c.lineTo(x + 4, y + 8); c.stroke(); c.beginPath(); c.arc(x + 11, y + 8, 3, 0, Math.PI * 2); c.stroke(); },
  system: (c, x, y) => { for (const [dx, dy] of [[-7, -7], [7, -7], [-7, 7], [7, 7]]) { c.beginPath(); c.roundRect(x + dx - 5, y + dy - 5, 10, 10, 2); c.stroke(); } },
  digest: (c, x, y) => { c.beginPath(); c.roundRect(x - 13, y - 9, 26, 18, 3); c.moveTo(x - 13, y - 8); c.lineTo(x, y + 2); c.lineTo(x + 13, y - 8); c.stroke(); },
};
const STEPS = [
  { id: "brief", t: "Шаблон задачи" },
  { id: "review", t: "Дизайн-ревью" },
  { id: "debt", t: "Дизайн-долг" },
  { id: "system", t: "Дизайн-система" },
  { id: "digest", t: "Дайджест и демо" },
];
const paintStep = (st: (typeof STEPS)[number]) => (s: number) => sheet(130, 110, s, (ctx: Ctx) => {
  ctx.strokeStyle = "#fff4dc"; ctx.lineWidth = 2; ctx.lineCap = "round"; ctx.lineJoin = "round";
  ICONS[st.id](ctx, 65, 48);
  text(ctx, st.t, 65, 92, { w: 500, size: 13, align: "center" });
}, BG, 16);

const paintRequest = (s: number) => sheet(180, 170, s, (ctx: Ctx) => {
  text(ctx, "Задача", 18, 32, { w: 600, size: 17 });
  text(ctx, "одной строкой", 18, 52, { size: 13, color: MUTED });
  ctx.fillStyle = "rgba(255,255,255,0.2)";
  for (const [y, w] of [[80, 140], [96, 110], [112, 126]]) { ctx.beginPath(); ctx.roundRect(18, y, w, 6, 3); ctx.fill(); }
  para(ctx, "«Нарисуй экран, релиз в пятницу»", 18, 142, 150, { size: 12, color: MUTED, lh: 15 });
}, BG, 18);

const paintTeam = (s: number) => sheet(300, 170, s, (ctx: Ctx) => {
  text(ctx, "Команда", 20, 36, { w: 600, size: 18 });
  text(ctx, "4 дизайнера", 20, 58, { size: 13, color: MUTED });
  const roles = ["senior", "middle", "middle", "стажёр"];
  roles.forEach((r, i) => {
    const x = 42 + i * 66;
    ctx.beginPath(); ctx.arc(x, 100, 20, 0, Math.PI * 2); ctx.fillStyle = "rgba(255,255,255,0.14)"; ctx.fill();
    ctx.strokeStyle = GOLD; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(x, 94, 6, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(x, 112, 10, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
    text(ctx, r, x, 142, { size: 12, color: MUTED, align: "center" });
  });
}, BG, 20);

const paintSprint = (s: number) => sheet(300, 150, s, (ctx: Ctx) => {
  text(ctx, "Спринт, две недели", 20, 36, { w: 600, size: 18 });
  const cols = ["Дизайн", "Ревью", "Разработка"];
  cols.forEach((c, i) => {
    const x = 20 + i * 90;
    ctx.beginPath(); ctx.roundRect(x, 56, 80, 70, 10);
    ctx.fillStyle = i === 1 ? "rgba(255, 208, 138, 0.28)" : "rgba(255,255,255,0.1)"; ctx.fill();
    if (i === 1) { ctx.strokeStyle = GOLD; ctx.lineWidth = 1.5; ctx.stroke(); }
    text(ctx, c, x + 40, 96, { w: i === 1 ? 600 : 400, size: 13, align: "center", color: i === 1 ? "#fff4dc" : MUTED });
  });
}, BG, 20);

const paintImpact = (s: number) => sheet(300, 196, s, (ctx: Ctx) => {
  text(ctx, "За год", 20, 36, { w: 600, size: 18 });
  ctx.strokeStyle = GOLD; ctx.lineWidth = 2.5; ctx.lineCap = "round"; ctx.beginPath();
  ctx.moveTo(20, 150); ctx.bezierCurveTo(70, 146, 90, 120, 120, 104); ctx.bezierCurveTo(140, 92, 150, 70, 160, 58); ctx.stroke();
  hr(ctx, 176, 50, 0);
  para(ctx, "Дизайн зовут до решения, а не после", 176, 76, 110, { size: 13, lh: 17 });
  text(ctx, "~2 500", 176, 146, { w: 600, size: 20 });
  para(ctx, "сотрудников в продукте", 176, 164, 110, { size: 11, color: MUTED, lh: 13 });
}, BG, 20);

/** стол: золотой диск с ободом и шесть стульев вокруг */
function table() {
  const g = new THREE.Group();
  const gold = new THREE.MeshStandardMaterial({ color: "#d9b77a", metalness: 0.75, roughness: 0.28, emissive: "#6a4a1a", emissiveIntensity: 0.4 });
  const top = new THREE.Mesh(new THREE.CylinderGeometry(250, 262, 26, 96), gold);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(300, 316, 18, 96), new THREE.MeshStandardMaterial({ color: "#8a7550", metalness: 0.6, roughness: 0.4, emissive: "#40300f", emissiveIntensity: 0.5 }));
  base.position.y = -26;
  g.add(top, base);
  const dark = new THREE.MeshStandardMaterial({ color: "#2f2c28", metalness: 0.6, roughness: 0.35 });
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + 0.3;
    const chair = new THREE.Group();
    const seat = new THREE.Mesh(new THREE.BoxGeometry(46, 6, 44), dark);
    seat.position.y = 34;
    const back = new THREE.Mesh(new THREE.BoxGeometry(46, 44, 5), dark);
    back.position.set(0, 58, 20);
    chair.add(seat, back);
    for (const [lx, lz] of [[-18, -18], [18, -18], [-18, 18], [18, 18]]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(3, 34, 3), dark);
      leg.position.set(lx, 16, lz);
      chair.add(leg);
    }
    chair.position.set(Math.cos(a) * 190, 10, Math.sin(a) * 190);
    chair.rotation.y = Math.atan2(Math.cos(a), Math.sin(a));
    g.add(chair);
  }
  return g;
}

export function createLeadScene(host: SceneHost): CaseScene {
  return createCaseScene(host, {
    hub: HUB,
    box: [280, 110, 1620, 620],
    async build(k) {
      k.glow(870, 480, -200, 1200, 700, "#ffb050", 0.4);
      k.glow(870, 500, -20, 700, 240, "#ffd080", 0.55);
      /* стол стоит на земле: наклонён к зрителю, как на референсе */
      const t = table();
      t.rotation.x = 0.36;
      t.scale.setScalar(0.66);
      k.object(t, 875, 478, -60, 0.05);
      for (const [i, r] of [235, 265, 300].entries()) {
        k.orbit({ c: [875, 486], r, tilt: 20.6, rotZ: 0, from: -90, to: 270, color: GOLD, width: i ? 1.2 : 1.8, opacity: 0.8 - i * 0.2, fade: () => 1, delay: 0.2 + i * 0.08, z: -60 });
      }
      /* место лида: табличка у стола */
      const plaque = await sheet(120, 100, k.texScale() * 2, (ctx) => {
        text(ctx, "Design", 60, 40, { w: 600, size: 18, align: "center" });
        text(ctx, "lead", 60, 64, { w: 600, size: 18, align: "center" });
      }, "rgba(60, 46, 26, 0.75)", 14);
      k.card({ map: k.canvasTexture(plaque), size: [96, 80], inner: [96, 80], radius: 12, innerRadius: 12, glass: 0.4, halo: 0.4, margin: 30, c: [874, 378], z: 0, r: [0, 0, 0], delay: 0.3, amp: 2, order: 6 });

      /* цепочка шагов над столом и стрелки между ними */
      const ts = k.texScale();
      const xs = [610, 738, 866, 1000, 1135];
      for (const [i, st] of STEPS.entries()) {
        const cv = await paintStep(st)((100 / 130) * ts * 2);
        k.card({ map: k.canvasTexture(cv), size: [106, 90], inner: [100, 85], radius: 16, innerRadius: 13, glass: 0.45, tint: "#6a5a3a", halo: 0.3, margin: 30, c: [xs[i], 290 - i * 4], z: -40, r: [0, 0, -1.5], delay: 0.35 + i * 0.07, amp: 3, order: 3 });
        if (i < 4) k.curve([[xs[i] + 58, 290 - i * 4, -40], [xs[i] + 64, 290 - i * 4, -40], [xs[i + 1] - 58, 288 - i * 4, -40]], { color: GOLD, width: 1.8, delay: 0.5 + i * 0.07, dur: 0.4, fade: () => 1 });
        /* нити от стола к шагам */
        k.curve([[xs[i], 336 - i * 4, -40], [xs[i] + (875 - xs[i]) * 0.2, 400, -50], [875 + (xs[i] - 875) * 0.3, 440, -60]], { color: "#ffe6b5", width: 1.2, opacity: 0.8, delay: 0.55 + i * 0.05 });
      }
      /* стопка задач «одной строкой» слева и нити от неё к столу */
      for (let i = 3; i >= 0; i--) {
        const cv = i === 0 ? await paintRequest((140 / 180) * ts * 2) : null;
        k.card({ map: cv ? k.canvasTexture(cv) : undefined, size: [146, 138], inner: [140, 132], radius: 16, innerRadius: 13, glass: cv ? 0.45 : 0.3, tint: "#6a5a3a", halo: i ? 0 : 0.3, margin: 30, c: [400 - i * 14, 350 - i * 12], z: -i * 30, r: [2, 22, -6], delay: 0.2 + (3 - i) * 0.05, amp: 4, order: 3 });
      }
      for (let i = 0; i < 5; i++) k.curve([[470, 330 + i * 16, 0], [560, 360 + i * 20, -20], [720, 420 + i * 8, -50]], { color: "#ffe6b5", width: 1.1, opacity: 0.7, delay: 0.5 + i * 0.04 });
      /* справа — итоги, к ним стрелки от цепочки */
      const sat = async (paint: (s: number) => Promise<HTMLCanvasElement>, w0: number, h0: number, w: number, c: [number, number], z: number, r: [number, number, number], delay: number) => {
        const cv = await paint((w / w0) * ts * 2);
        const h = (w * h0) / w0;
        k.card({ map: k.canvasTexture(cv), size: [w + 12, h + 12], inner: [w, h], radius: 20, innerRadius: 16, glass: 0.45, tint: "#6a5a3a", halo: 0.3, margin: 40, c, z, r, delay, amp: 5, order: 3 });
      };
      await sat(paintTeam, 300, 170, 270, [1400, 210], -30, [2, -16, 5], 0.4);
      await sat(paintSprint, 300, 150, 270, [1462, 370], -10, [0, -16, 3], 0.46);
      await sat(paintImpact, 300, 196, 280, [1450, 520], 0, [-2, -16, 2], 0.52);
      k.curve([[1190, 280, -40], [1215, 240, -40], [1260, 225, -30]], { color: GOLD, width: 1.8, delay: 0.8 });
      k.curve([[1080, 470, -40], [1200, 440, -30], [1318, 370, -20]], { color: GOLD, width: 1.8, delay: 0.85 });
      k.curve([[1080, 510, -40], [1200, 530, -30], [1300, 522, -10]], { color: GOLD, width: 1.8, delay: 0.9 });

      k.sparkField([880, 420], [640, 280], 110, "#ffd08a", [[610, 350, 8], [866, 350, 8], [1135, 350, 8], [1260, 225, 10], [1318, 370, 10], [1300, 522, 10]]);
    },
  });
}
