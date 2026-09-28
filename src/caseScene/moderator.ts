/* v78: сцена кейса «Кабинет модератора». Раскладка снята с референса Никиты (assets-src/ref-moderator-dashboard.png).
   Содержимое — настоящее, из Figma-файла продукта (TsqIZDg5rUgbxPNV5ghDZB):
   - главная панель — очередь «Пользователи» (2494:85178), вырезка рендера Figma в 2×;
   - спереди — кнопки решения со страницы комментария: главный результат кейса, решение прямо в списке;
   - вокруг — очередь с жалобами, настоящий комментарий на проверке, статусы очереди и профиль
     «Юлия Некрасова» (2494:85463). Цифры спутников посчитаны по той же очереди, а не придуманы.
   На референсе спутники были про «1.2K проверено» и «Иванов Алексей» — генератор это сочинил. */
import { createCaseScene, type CaseScene, type SceneHost } from "./kit";
import { ACTIONS_CARD, COMMENT_CARD, PROFILE_CARD, QUEUE_CARD, STATS_CARD, moderatorImage, paintActions, paintComment, paintProfile, paintQueue, paintStats } from "./paintModerator";

const HUB: [number, number] = [940, 440];
const GOLD = "#ffc46a";
const DARK = "#3a3326";

export function createModeratorScene(host: SceneHost): CaseScene {
  return createCaseScene(host, {
    hub: HUB,
    box: [330, 150, 1610, 720],
    async build(k) {
      /* свет: золотая дымка за панелью и светящаяся площадка под ней */
      k.glow(930, 430, -240, 1300, 860, "#ffac40", 0.42);
      k.glow(940, 676, -10, 800, 160, "#ffb850", 0.78);
      k.glow(450, 400, -160, 480, 520, "#ffaa55", 0.18);
      k.glow(1440, 400, -160, 520, 560, "#ffaa55", 0.18);

      /* кольца площадки на земле: почти плоские эллипсы под панелью */
      for (const [i, r] of [235, 290, 345].entries()) {
        k.orbit({ c: [940, 676], r, tilt: 6.5, rotZ: 0, from: -90, to: 270, color: GOLD, width: i === 1 ? 2 : 1.3, opacity: 0.8 - i * 0.18, fade: (t) => 0.4 + 0.6 * Math.abs(Math.sin(Math.PI * t)), delay: 0.2 + i * 0.1 });
      }
      /* большие дуги вокруг всей композиции */
      k.orbit({ c: [950, 420], r: 660, tilt: 19, rotZ: -4, from: 175, to: 365, color: "#ffe2b0", opacity: 0.5, delay: 0.45 });
      k.orbit({ c: [930, 430], r: 600, tilt: 15, rotZ: 6, from: 185, to: 350, color: "#ffe2b0", opacity: 0.45, delay: 0.55 });

      /* связи спутников с панелью — светящиеся нити с узлами */
      const link = (pts: [number, number, number][], delay: number) => k.curve(pts, { color: GOLD, width: 1.8, opacity: 1, delay, dur: 0.7 });
      link([[572, 290, -20], [586, 300, -10], [604, 300, 0]], 0.55);
      link([[548, 470, 0], [572, 462, -5], [598, 470, 0]], 0.6);
      link([[1150, 244, 0], [1210, 200, -20], [1278, 210, -20]], 0.65);
      link([[1262, 430, 0], [1290, 424, -10], [1316, 440, -20]], 0.7);
      link([[548, 590, 0], [600, 640, 20], [665, 670, 50]], 0.75);
      link([[1256, 670, 40], [1300, 640, 10], [1316, 600, -20]], 0.8);

      k.sparkField([950, 430], [660, 300], 110, "#ffc466", [[572, 290, 12], [604, 300, 9], [548, 470, 11], [1278, 210, 12], [1316, 440, 12], [665, 670, 10], [1316, 600, 10], [1150, 244, 9]]);
      k.rocks([[300, 610, 26, 40], [470, 705, 18, 60], [1350, 692, 22, 50], [1560, 640, 16, 20], [820, 748, 14, 60], [1500, 132, 10, -80], [360, 180, 9, -80]]);

      const ts = k.texScale();
      /* главная панель: вырезка очереди из рендера Figma, 660 px кадра по ширине */
      const q = await moderatorImage("queue.webp");
      const iw = 660, ih = (iw * q.height) / q.width;
      k.card({ size: [iw + 26, ih + 26], radius: 30, glass: 0.4, halo: 0, c: [962, 452], z: -45, r: [-8, 4, -1.4], delay: 0.08, amp: 3, order: 1 });
      k.card({ map: k.imageTexture(q), size: [iw + 30, ih + 30], inner: [iw, ih], radius: 30, innerRadius: 14, glass: 0.66, warm: 1, halo: 0.38, margin: 70, c: [930, 440], z: 0, r: [-8, 4, -1.4], delay: 0, amp: 3, order: 5 });

      /* спутники: тёмное дымчатое стекло */
      const sat = async (paint: (s: number) => Promise<HTMLCanvasElement>, size: { w: number; h: number }, w: number, c: [number, number], z: number, r: [number, number, number], delay: number, order = 3) => {
        const cv = await paint((w / size.w) * ts * 2);
        const h = (w * size.h) / size.w;
        k.card({ map: k.canvasTexture(cv), size: [w + 12, h + 12], inner: [w, h], radius: 20, innerRadius: 15, glass: 0.5, tint: DARK, halo: 0.3, margin: 40, c, z, r, delay, amp: 5, order });
      };
      await sat(paintQueue, QUEUE_CARD, 228, [460, 272], -30, [4, 14, -4.5], 0.22);
      await sat(paintComment, COMMENT_CARD, 232, [433, 487], 0, [-2, 14, -3], 0.3);
      await sat(paintStats, STATS_CARD, 318, [1433, 260], -30, [4, -14, 2.4], 0.26);
      await sat(paintProfile, PROFILE_CARD, 268, [1450, 516], -10, [-2, -14, 2], 0.34);
      /* кнопки решения — спереди, светлые, у нижнего края панели */
      const ac = await paintActions((570 / ACTIONS_CARD.w) * ts * 2);
      const ah = (570 * ACTIONS_CARD.h) / ACTIONS_CARD.w;
      k.card({ map: k.canvasTexture(ac), size: [582, ah + 12], inner: [570, ah], radius: 24, innerRadius: 18, glass: 0.6, halo: 0.34, margin: 40, c: [950, 664], z: 70, r: [-10, 2, -2.6], delay: 0.42, amp: 4, order: 7 });
    },
  });
}
