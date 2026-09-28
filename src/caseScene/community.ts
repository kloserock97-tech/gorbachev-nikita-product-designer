/* v78: сцена кейса «Сообщество». Раскладка снята с референса Никиты (assets-src/ref-community.png, карта слоёв —
   assets-src/community-layers.png): места и повороты карточек, ход лент и орбит — в пикселях кадра 1672×941.
   Содержимое — настоящее, из Figma-файла продукта: главная публикация ленты и пять других публикаций с их
   фото, тегами и числом комментариев. Придуманных генератором фото (сакура, кафе, собака) здесь нет. */
import * as THREE from "three";
import { createCaseScene, type CaseScene, type SceneHost } from "./kit";
import { MAIN, STORY, img, paintMain, paintStory, type Story } from "./paint";

/* карточки-истории: центр (px кадра), ширина (px кадра), поворот (°), глубина */
const STORIES: (Story & { c: [number, number]; w: number; r: [number, number, number]; z: number })[] = [
  { photo: "elephant.webp", tag: "journey", title: "Москва — родина слонов", count: 144, fy: 0.35, c: [506, 263], w: 186, r: [4, 14, -9], z: -30 },
  { photo: "date.webp", tag: "food", title: "Куда пригласить на свидание в Москве незнакомку", count: 201, fy: 0.3, c: [503, 498], w: 222, r: [-4, 16, -8], z: 10 },
  { photo: "fountain.webp", tag: "communal", title: "Укротители воды. Кто управляет фонтанами", count: 16, c: [1215, 272], w: 192, r: [4, -16, 3], z: -30 },
  { photo: "church.webp", tag: "journey", title: "Что посмотреть в Москве за один день", count: 188, c: [1298, 462], w: 170, r: [0, -18, 2], z: -50 },
  { photo: "squirrel.webp", tag: "pets", title: "Московский белкопад", count: 32, c: [1196, 626], w: 182, r: [-4, -14, -5], z: 0 },
];
/* фото-плитки без текста: дальние и ближние, размыты — глубина резкости */
const TILES: { photo: string; c: [number, number]; s: [number, number]; r: [number, number, number]; z: number; blur: number; fy?: number }[] = [
  { photo: "church.webp", c: [325, 430], s: [78, 94], r: [0, 18, -6], z: -120, blur: 2.2 },
  { photo: "building.webp", c: [1422, 292], s: [95, 100], r: [0, -20, 6], z: -140, blur: 1.6 },
  { photo: "elephant.webp", c: [1420, 467], s: [40, 66], r: [0, -24, 4], z: -220, blur: 2.6, fy: 0.3 },
  { photo: "fountain.webp", c: [650, 670], s: [106, 76], r: [-10, 8, 6], z: 90, blur: 2.4 },
  { photo: "date.webp", c: [612, 310], s: [56, 108], r: [0, 20, -6], z: -110, blur: 1.2, fy: 0.2 },
];
const HUB: [number, number] = [872, 435];

export function createCommunityScene(host: SceneHost): CaseScene {
  return createCaseScene(host, {
    hub: HUB,
    box: [300, 150, 1470, 720],
    async build(k) {
      /* свечение: золотая дымка за композицией, тёплый отсвет у низа главной карточки, пятна света у историй */
      k.glow(880, 440, -220, 1250, 820, "#ff9a3c", 0.46);
      k.glow(860, 648, -20, 720, 220, "#ffb060", 0.8);
      k.glow(520, 420, -160, 520, 460, "#ffaa55", 0.2);
      k.glow(1250, 440, -160, 520, 520, "#ffaa55", 0.2);
      k.glow(870, 300, -260, 900, 300, "#ffd28a", 0.16);

      k.orbit({ c: [845, 425], r: 560, tilt: 21, rotZ: -5, from: -10, to: 350, opacity: 0.6, fade: (t) => 0.35 + 0.65 * Math.sin(Math.PI * t), delay: 0.35 });
      k.orbit({ c: [880, 395], r: 510, tilt: 18, rotZ: 7, from: 170, to: 530, opacity: 0.6, fade: (t) => 0.25 + 0.75 * Math.sin(Math.PI * t), delay: 0.5 });

      /* красные ленты — продолжение красной фигуры иллюстрации: слева уходят за истории, справа поднимаются вверх */
      k.band([[770, 405, -60], [670, 380, -30], [590, 385, -10], [520, 410, -40], [450, 445, -90]], 36, 0.9, "#ea2d3c", 0.25);
      k.band([[770, 440, -60], [672, 424, -30], [592, 436, -10], [528, 466, -40], [462, 505, -100]], 26, 1.2, "#dd2734", 0.32);
      k.band([[770, 474, -60], [676, 470, -30], [602, 492, -20], [546, 530, -70]], 16, 0.6, "#c9202d", 0.4);
      k.band([[1030, 470, -60], [1118, 450, -20], [1200, 405, -10], [1272, 335, -30], [1326, 250, -60], [1342, 185, -100]], 32, 1.1, "#ea2d3c", 0.3);
      k.band([[1030, 505, -60], [1124, 490, -20], [1214, 452, -20], [1290, 380, -40], [1352, 288, -80]], 20, 0.8, "#dd2734", 0.38);
      for (let i = 0; i < 4; i++) {
        k.curve([[1060, 402 + i * 11, -40], [1150, 370 + i * 11, -30], [1240, 316 + i * 13, -40], [1312, 242 + i * 15, -60]], { color: "#ff3b45", width: 1.6, opacity: 0.95, delay: 0.45 + i * 0.05, fade: (t) => Math.min(1, t * 6) * Math.min(1, (1 - t) * 3) });
      }

      k.sparkField([850, 430], [620, 280], 110, "#ffc070", [[640, 210, 12], [1045, 212, 12], [1400, 575, 12], [460, 635, 9], [300, 545, 9], [1300, 640, 8], [950, 640, 10]]);
      k.rocks([[345, 625, 30, 60], [872, 708, 20, 40], [1010, 682, 14, 20], [530, 632, 11, 0], [610, 590, 8, -40], [1290, 150, 9, -60], [1570, 162, 10, -80]]);

      const ts = k.texScale();
      /* главная: содержимое 405 px кадра по ширине, вокруг 17 px стекла */
      const iw = 405, ih = (iw * MAIN.h) / MAIN.w;
      const mainTex = k.canvasTexture(await paintMain((iw / MAIN.w) * ts * 2));
      k.card({ size: [iw + 30, ih + 30], radius: 32, glass: 0.45, halo: 0, c: [915, 450], z: -45, r: [-6, 10, -8], delay: 0.08, amp: 3, order: 1 });
      k.card({ map: mainTex, size: [iw + 34, ih + 34], inner: [iw, ih], radius: 34, innerRadius: 18, glass: 0.7, warm: 1, halo: 0.42, margin: 70, c: [878, 434], z: 0, r: [-6, 10, -8], delay: 0, amp: 3, order: 5 });

      for (const [i, s] of STORIES.entries()) {
        const c = await paintStory(s, (s.w / STORY.w) * ts * 2);
        const w = s.w, h = (w * c.height) / c.width;
        k.card({ map: k.canvasTexture(c), size: [w + 12, h + 12], inner: [w, h], radius: 16, innerRadius: 12, glass: 0.6, halo: 0.3, margin: 36, c: s.c, z: s.z, r: s.r, delay: 0.22 + i * 0.07, amp: 5 + i });
      }
      for (const [i, tl] of TILES.entries()) {
        const im = await img(tl.photo);
        const t = k.imageTexture(im);
        /* плитка — фото «cover»: подрезаем через repeat/offset в шейдере */
        const ar = tl.s[0] / tl.s[1], iar = im.width / im.height;
        const rep = iar > ar ? new THREE.Vector2(ar / iar, 1) : new THREE.Vector2(1, iar / ar);
        const off = iar > ar ? new THREE.Vector2((1 - ar / iar) / 2, 0) : new THREE.Vector2(0, (1 - iar / ar) * (1 - (tl.fy ?? 0.5)));
        k.card({ map: t, rep, off, size: [tl.s[0] + 6, tl.s[1] + 6], inner: tl.s, radius: 10, innerRadius: 8, glass: 0.4, blur: tl.blur, halo: 0.12, margin: 20, c: tl.c, z: tl.z, r: tl.r, delay: 0.35 + i * 0.05, amp: 6, order: tl.z > 0 ? 6 : 2 });
      }
    },
  });
}
