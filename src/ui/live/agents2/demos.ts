/* 26.10: мини-демо решений «Рисков ИИ-агентов» — как у GRIF (src/ui/decisionDemos.ts): три шага на настоящих экранах
   из Figma, курсор ведёт к слою, кольцо обводит его, подпись шага «1 из 3 · …». Экраны и оживление — те же, что у
   прототипа (flows.ts); к ним добавлены кадры 01.2 «Реестр · загрузка» и 01.8 «Сортировка» (ключи loading, sort).
   В данных решения — demo: "agents2:<имя>". */
import type { Demo, Scene } from "../grif2/demoTypes";
import { dialog, drawer, fix, liven, r } from "./flows";

const q = (c: Scene, sel: string) => c.s.el.querySelector<HTMLElement>(sel);
const base = { r, liven, fix };

export const demos: Record<string, Demo> = {
  /* документы и черновик рисков — внутри продукта: архив в карточке → разбор с прогрессом → черновик из 13 рисков */
  auto: {
    ...base,
    beats: [
      {
        cap: { ru: "Архив прикладывается прямо в карточке агента", en: "The archive is attached right in the agent card" },
        run: async (c) => {
          c.s.show("card");
          const btn = q(c, '[data-n="Empty State"] [data-n="Button"]');
          c.ring(btn);
          await c.point(btn, 0.5, 0.5);
          await c.press(btn);
        },
      },
      {
        cap: { ru: "Модель разбирает архив, экран показывает прогресс", en: "The model parses the archive, the screen shows progress" },
        run: async (c) => {
          c.s.show("forming");
          const p = q(c, '[data-n="AI Progress"]');
          c.ring(p);
          await c.point(p, 0.3, 0.5);
        },
        hold: 2400,
      },
      {
        cap: { ru: "Черновик из 13 рисков готов к проверке", en: "A draft of 13 risks is ready for review" },
        run: async (c) => {
          c.s.show("draft");
          const banner = q(c, '[data-n="AI Banner"]');
          c.ring(banner);
          await c.point(q(c, '[data-n="Risk Item"]'), 0.3, 0.5);
        },
        hold: 2000,
      },
    ],
  },

  /* список начинается с ответа «за что браться»: сводка над списком и сортировка из четырёх пунктов */
  summary: {
    ...base,
    beats: [
      {
        cap: { ru: "Пока данные грузятся, на местах цифр — заготовки", en: "While data loads, placeholders stand in for the numbers" },
        run: async (c) => {
          c.s.show("loading");
          const sum = q(c, '[data-n="Summary"]');
          c.ring(sum);
          await c.point(sum, 0.2, 0.3);
        },
        hold: 1400,
      },
      {
        cap: { ru: "Сводка: всего агентов, оценённые, в оценке и уровни риска", en: "Summary: all agents, assessed, in progress and risk levels" },
        run: async (c) => {
          c.s.show("reg");
          const sum = q(c, '[data-n="Summary"]');
          c.ring(sum);
          await c.point(q(c, '[data-n="By risk"]'), 0.15, 0.5);
        },
        hold: 2000,
      },
      {
        cap: { ru: "Сортировка из четырёх пунктов, текущий отмечен галочкой", en: "Sorting has four options, the current one is ticked" },
        run: async (c) => {
          c.s.show("sort");
          const menu = q(c, '[data-n="Sort Menu"]');
          c.ring(menu);
          await c.point(q(c, '[data-n="Sort Menu"] [data-n="Menu Item"]'), 0.4, 0.5);
        },
        hold: 2000,
      },
    ],
  },

  /* фильтр срабатывает сразу, суммы — короткие */
  filter: {
    ...base,
    beats: [
      {
        cap: { ru: "Фильтр открывается шторкой справа", en: "The filter opens as a side panel" },
        run: async (c) => {
          c.s.show("assess");
          const btn = q(c, '[data-n="Search row"] > [data-n="Filter"]');
          c.ring(btn);
          await c.point(btn, 0.5, 0.5);
          await c.press(btn);
          c.s.show("fsheet");
          drawer(c.s);
          c.ring(null);
          await c.point(q(c, '[data-n="Chip / Высокий"]'), 0.5, 0.5);
        },
      },
      {
        cap: { ru: "Отмеченные значения сразу дают результат", en: "Picked values give a result right away" },
        run: async (c) => {
          c.s.show("fpicked", true);
          c.s.el.querySelectorAll<HTMLElement>('[data-n="Chip / Продукт"], [data-n="Chip / Высокий"], [data-n="Chip / Оценка"]').forEach((n, i) => { n.style.animationDelay = `${i * 90}ms`; n.classList.add("g2-pop"); });
          const foot = q(c, '[data-n="Drawer"] [data-n="Footer"]');
          c.ring(foot);
          await c.point(foot, 0.3, 0.6);
        },
        hold: 1900,
      },
      {
        cap: { ru: "Метки снимаются по одной, суммы — в миллионах", en: "Tags come off one by one, sums are in millions" },
        run: async (c) => {
          c.s.show("fapplied");
          const slot = q(c, '[data-n="Applied filters slot"]');
          c.ring(slot);
          await c.point(q(c, '[data-n="Applied filters slot"] [data-n="Filter Chip"] [data-n="Remove hit area"]'), 0.5, 0.5);
          await c.wait(900);
          const toggle = q(c, '[data-n="Simplify numbers"]');
          c.ring(toggle);
          await c.point(q(c, '[data-n="Simplify numbers"] [data-n="Toggle"]'), 0.5, 0.5);
        },
        hold: 2000,
      },
    ],
  },

  /* «не применим» — только с причиной, недописанное не теряется */
  na: {
    ...base,
    beats: [
      {
        cap: { ru: "«Не применим» открывает окно с причиной", en: "“Not applicable” opens a window asking for a reason" },
        run: async (c) => {
          c.s.show("risk");
          drawer(c.s);
          const btn = q(c, '[data-n="Footer"] > [data-n="Not applicable"]');
          c.ring(btn);
          await c.point(btn, 0.5, 0.5);
          await c.press(btn);
        },
      },
      {
        cap: { ru: "Пока причина не описана, «Принять» неактивна", en: "Until the reason is written, Accept stays disabled" },
        run: async (c) => {
          c.s.show("naFilled", true);
          dialog(c.s);
          const value = q(c, '[data-n="Reason field"] > [data-n="Value"]');
          const confirm = q(c, '[data-n="Actions"] > [data-n="Confirm"]');
          const text = value?.textContent ?? "";
          confirm?.classList.add("ag-dim");
          c.ring(q(c, '[data-n="Reason field"]'));
          await c.point(value, 0.2, 0.3);
          await c.s.type(value, text, 16);
          confirm?.classList.remove("ag-dim");
          c.ring(confirm);
          await c.point(confirm, 0.5, 0.5);
        },
        hold: 1600,
      },
      {
        cap: { ru: "Риск остаётся в списке с причиной и кнопкой «Восстановить»", en: "The risk stays in the list with its reason and a Restore button" },
        run: async (c) => {
          c.s.show("naDone");
          const box = q(c, '[data-n="Reason box"]');
          c.ring(box);
          await c.point(q(c, '[data-n="Footer"] > [data-n="Edit"]'), 0.5, 0.5);
        },
        hold: 2200,
      },
    ],
  },
};
