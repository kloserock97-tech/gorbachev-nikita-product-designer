/* 26.10: мини-демо решений «Кабинета модератора» — как у GRIF (src/ui/decisionDemos.ts): по три шага на финальных
   экранах из Figma (те же, что у прототипа, moderator2/screens.json), курсор и кольцо на настоящем слое. Ключи в данных
   кейса — «moderator2:<имя>». Подписи — только то, что видно на экранах.
   · registry — вкладки по статусам, статус у каждой строки, фильтры;
   · inline — комментарий раскрывается и читается прямо в строке, история статуса — тоже в списке
     (кнопок решения в строке на финальных макетах нет — их не показываем);
   · card — публикация и автор на странице комментария, ветка ответов и жалобы вкладками рядом;
   · mechanism — у пользователя и у комментария те же решения на том же месте и те же вкладки. */
import type { Demo, Scene } from "../grif2/demoTypes";
import { liven, r } from "./flows";

/** ближайший предок не уже w: строка таблицы, блок, всплывающая плашка */
const up = (el: HTMLElement | null, w: number) => {
  let n = el;
  while (n && n.offsetWidth < w && n.parentElement && !n.parentElement.classList.contains("g2")) n = n.parentElement;
  return n;
};
/** ближайший предок, в котором есть текст needle: блок целиком, а не его заголовок */
const upTo = (el: HTMLElement | null, needle: string) => {
  let n = el;
  while (n && !(n.textContent ?? "").includes(needle) && n.parentElement && !n.parentElement.classList.contains("g2")) n = n.parentElement;
  return n;
};
/** вкладка страницы объекта по названию (в таблице ниже есть столбцы с теми же словами) */
const tab = (c: Scene, text: string) => c.s.hot(text, 1, c.s.find("Ветки"));

const registry: Demo = {
  r, liven,
  beats: [
    {
      cap: { ru: "Вкладки по статусам: сначала то, что ждёт проверки", en: "Tabs by status: what waits for review comes first" },
      run: async (c) => {
        c.s.show("cList");
        c.ring(c.s.find("tabs"));
        await c.point(c.s.hot("Ожидают проверки", 1, c.s.find("tabs")), 0.5, 0.5);
      },
      hold: 1900,
    },
    {
      cap: { ru: "У каждой строки — статус", en: "Every row shows its status" },
      run: async (c) => {
        /* плашка статуса первой строки */
        const st = up(c.s.text("Новый"), 60);
        c.ring(st);
        await c.point(st, 0.5, 0.5);
      },
    },
    {
      cap: { ru: "Фильтры: ответственный, публикация, статус, период", en: "Filters: assignee, post, status, period" },
      run: async (c) => {
        const f = c.s.find("Filters");
        c.ring(f);
        await c.point(f, 0.2, 0.5);
      },
      hold: 2000,
    },
  ],
};

const inline: Demo = {
  r, liven,
  beats: [
    {
      cap: { ru: "Комментарий раскрывается прямо в строке", en: "A comment opens right in its row" },
      run: async (c) => {
        c.s.show("cList");
        const more = c.s.hot("Ещё", 1);
        c.ring(more);
        await c.point(more, 0.5, 0.5);
        await c.press(more);
      },
    },
    {
      cap: { ru: "Текст целиком — без перехода на страницу", en: "The full text, without leaving the list" },
      run: async (c) => {
        c.s.show("cRow");
        const text = c.s.text("Гусь отличный, мне бы очень хотелось увидеть что там было на самом деле. Это же очень интересно!");
        c.ring(up(text, 1000));
        await c.point(text, 0.4, 0.5);
      },
      hold: 2000,
    },
    {
      cap: { ru: "История статуса — тоже в списке", en: "The status history is in the list too" },
      run: async (c) => {
        c.s.show("cStatus");
        const pop = up([...c.s.el.querySelectorAll<HTMLElement>("div")].find((n) => !n.children.length && /История/.test(n.textContent ?? "")) ?? null, 150);
        c.ring(pop);
        await c.point(pop, 0.5, 0.3);
      },
      hold: 2200,
    },
  ],
};

const card: Demo = {
  r, liven,
  beats: [
    {
      cap: { ru: "Публикация и автор — на странице комментария", en: "The post and its author sit on the comment page" },
      run: async (c) => {
        c.s.show("dComment");
        const author = upTo(c.s.text("Об авторе"), "ofellin");
        c.ring(author);
        await c.point(author, 0.5, 0.25);
      },
      hold: 1900,
    },
    {
      cap: { ru: "Ветка ответов — вкладкой рядом", en: "The reply thread is one tab away" },
      run: async (c) => {
        const t = tab(c, "Ветка ответов");
        c.ring(t);
        await c.point(t, 0.5, 0.5);
        await c.press(t);
        c.s.show("dThread");
        c.ring(c.s.find("table"));
      },
      hold: 2000,
    },
    {
      cap: { ru: "Жалобы — там же, без поисков", en: "Complaints are right there too" },
      run: async (c) => {
        const t = tab(c, "Жалобы");
        c.ring(t);
        await c.point(t, 0.5, 0.5);
        await c.press(t);
        c.s.show("dComplaints");
        c.ring(c.s.find("table"));
      },
      hold: 2200,
    },
  ],
};

const mechanism: Demo = {
  r, liven,
  beats: [
    {
      cap: { ru: "Пользователь: решения вверху страницы", en: "A user: the decisions sit at the top" },
      run: async (c) => {
        c.s.show("uWork");
        const ctl = c.s.find("control");
        c.ring(ctl);
        await c.point(ctl, 0.15, 0.5);
      },
      hold: 1900,
    },
    {
      cap: { ru: "Комментарий: те же решения на том же месте", en: "A comment: the same decisions in the same place" },
      run: async (c) => {
        c.s.show("cWork");
        const ctl = c.s.find("control");
        c.ring(ctl);
        await c.point(ctl, 0.15, 0.5);
      },
      hold: 1900,
    },
    {
      cap: { ru: "И вкладки с историей и жалобами — у каждого объекта", en: "And every object has tabs for history and complaints" },
      run: async (c) => {
        const nav = c.s.find("navigation");
        c.ring(nav);
        await c.point(tab(c, "История"), 0.5, 0.5);
      },
      hold: 2200,
    },
  ],
};

export const demos: Record<string, Demo> = { registry, inline, card, mechanism };
