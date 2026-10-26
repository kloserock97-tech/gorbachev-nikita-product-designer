/* 26.10: мини-демо решений «Плати частями» — как у GRIF: три шага на экранах из Figma (те же, что у прототипа),
   курсор ведёт к настоящему слою, кольцо обводит его, подпись шага внизу. Телефон 393 × 852 стоит целиком посреди
   сцены; окно телефона 393 × 640 — экран доезжает до нужного блока прокруткой внутри окна (reach).
   · widget — долг на виду: виджет на главном, два следующих платежа, лента по датам в сервисе;
   · move — перенос к зарплате: предложение на главном → подтверждение (1-й перенос бесплатный) → готово;
   · pause — перегрузка (кадр 89:3869): новые покупки на паузе, вместо предложений — план разгрузки, помощь;
   · numbers — «Откуда цифры»: кнопка в хабе → сумма и шкала бюджета → как считаем. */
import type { Demo, Scene } from "../grif2/demoTypes";
import { countUp, leaf, liven, r, widgetTop } from "./flows";

/* окно телефона ниже кадра (640 из 852): экран в сцене крупнее, шаг доезжает до своего блока сам */
const size = { w: 393, h: 640 };

/** доехать внутри окна телефона до слоя (сверху остаётся отступ), дождаться конца прокрутки */
async function reach(c: Scene, el: HTMLElement | null, top = 120) {
  const scr = c.s.el?.parentElement;
  if (!el || !scr) return;
  let y = 0;
  for (let n: HTMLElement | null = el; n && n !== c.s.el; n = n.offsetParent as HTMLElement | null) y += n.offsetTop;
  const to = Math.max(0, Math.min(y - top, c.s.el.offsetHeight - scr.clientHeight));
  scr.scrollTo({ top: to, behavior: c.calm ? "auto" : "smooth" });
  await c.wait(c.calm ? 0 : 700);
}

export const demos: Record<string, Demo> = {
  widget: {
    r, size, liven,
    beats: [
      {
        cap: { ru: "Ближайший платёж и остаток — на главном экране банка", en: "The next payment and the balance sit on the bank's home screen" },
        run: async (c) => {
          c.s.show("home");
          countUp(c.s, leaf(c.s.find("Ближайший"), /₽/), 600);
          await c.wait(500);
          await reach(c, c.s.find("Виджет / Плати частями"), 40);
          c.ring(c.s.find("Виджет / Плати частями"));
          await c.point(c.s.find("Всего"), 0.4, 0.5);
        },
        hold: 1900,
      },
      {
        cap: { ru: "Ниже — два следующих платежа", en: "Below are the next two payments" },
        run: async (c) => {
          const next = c.s.find("Дальше");
          c.ring(next);
          await c.point(next, 0.6, 0.5);
          await c.wait(500);
          await c.point(widgetTop(c.s), 0.5, 0.5);
          await c.press(widgetTop(c.s));
        },
      },
      {
        cap: { ru: "В сервисе — все платежи одной лентой по датам", en: "Inside the service: every payment in one timeline by date" },
        run: async (c) => {
          c.s.show("hub");
          await c.wait(400);
          const line = c.s.find("Card / Единый таймлайн");
          await reach(c, line, 60);
          c.ring(c.s.find("График") ?? line);
          await c.point(c.s.text("28 августа", line), 0.5, 0.5);
        },
        hold: 2200,
      },
    ],
  },
  move: {
    r, size, liven,
    beats: [
      {
        cap: { ru: "Платёж перед зарплатой — сервис предлагает перенос", en: "A payment right before payday: the service offers to move it" },
        run: async (c) => {
          c.s.show("home");
          await c.wait(500);
          await reach(c, c.s.find("Виджет / Плати частями"), 40);
          c.ring(c.s.find("Предложение · перенос"));
          const btn = c.s.find("Кнопка / Перенести");
          await c.point(btn, 0.5, 0.5);
          await c.press(btn);
        },
      },
      {
        cap: { ru: "Первый перенос бесплатный и не трогает историю", en: "The first move is free and leaves the credit history alone" },
        run: async (c) => {
          c.s.show("confirm");
          await c.wait(900);
          await reach(c, c.s.find("Почему эта дата"), 140);
          c.ring(c.s.find("факты"));
          await c.point(c.s.text("1-й перенос — 0 ₽"), 0.5, 0.5);
          await c.wait(700);
          const go = c.s.hot("Перенести платёж", 1);
          await c.point(go, 0.5, 0.5);
          await c.press(go);
        },
        hold: 1200,
      },
      {
        cap: { ru: "Готово: платёж 6 сентября, его ещё можно отменить", en: "Done: the payment is on 6 September and can still be undone" },
        run: async (c) => {
          c.s.show("moved");
          c.s.stream(leaf(c.s.find("Суть"), /^Готово/), 320, 50);
          await c.wait(1000);
          await reach(c, c.s.find("Лист / Разбор"), 40);
          c.ring(c.s.find("Лист / Разбор"));
          await c.point(c.s.hot("Отменить перенос", 1), 0.5, 0.5);
        },
        hold: 2400,
      },
    ],
  },
  pause: {
    r, size, liven,
    beats: [
      {
        cap: { ru: "Нагрузка выше нормы — новые покупки на паузе", en: "The load is above the norm: new purchases are paused" },
        run: async (c) => {
          c.s.show("over");
          await c.wait(600);
          const row = c.s.hot("Новые покупки — на паузе", 1);
          await reach(c, row, 200);
          c.ring(row);
          await c.point(row, 0.4, 0.5);
        },
        hold: 1900,
      },
      {
        cap: { ru: "На месте предложений — план разгрузки", en: "In place of offers: a plan to ease the load" },
        run: async (c) => {
          const plan = c.s.find("Лист / План разгрузки");
          await reach(c, plan, 90);
          c.ring(plan);
          const btn = c.s.hot("Смотреть план", 1);
          await c.point(btn, 0.5, 0.5);
          await c.press(btn);
        },
        hold: 1600,
      },
      {
        cap: { ru: "Если платить тяжело — перенос и частичная оплата без штрафов", en: "If paying gets hard: a move or a part payment, no penalties" },
        run: async (c) => {
          const help = c.s.find("Card / Поддержка при трудностях");
          await reach(c, help, 260);
          c.ring(help);
          await c.point(help, 0.4, 0.5);
        },
        hold: 2400,
      },
    ],
  },
  numbers: {
    r, size, liven,
    beats: [
      {
        cap: { ru: "У совета есть ссылка «Откуда цифры»", en: "The advice links to “Where the numbers come from”" },
        run: async (c) => {
          c.s.show("hub");
          await c.wait(500);
          const btn = c.s.find("Кнопка / Откуда цифры");
          await reach(c, btn, 300);
          c.ring(btn);
          await c.point(btn, 0.5, 0.5);
          await c.press(btn);
        },
      },
      {
        cap: { ru: "Сколько свободно до зарплаты — с учётом трат и рассрочек", en: "What is free until payday, after spending and instalments" },
        run: async (c) => {
          c.s.show("why");
          countUp(c.s, leaf(c.s.find("Сумма"), /₽/), 800);
          await c.wait(900);
          await reach(c, c.s.find("Сумма"), 160);
          c.ring(c.s.find("Шкала бюджета"));
          await c.point(c.s.find("Шкала бюджета"), 0.5, 0.5);
        },
        hold: 2000,
      },
      {
        cap: { ru: "Как посчитано: доход, траты и рассрочки за три месяца", en: "How it is counted: income, spending and instalments over three months" },
        run: async (c) => {
          const how = c.s.find("Как считаем");
          await reach(c, how, 260);
          c.ring(how);
          await c.point(how, 0.5, 0.4);
        },
        hold: 2400,
      },
    ],
  },
};
