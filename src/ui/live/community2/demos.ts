/* 26.10: мини-демо решений «Сообщества» — как у GRIF (src/ui/decisionDemos.ts): три шага на тех же экранах из Figma,
   что и прототип (flows.ts), курсор, нажатие и кольцо на настоящем слое. Подписи — только то, что сказано в решении.
   · pattern — реакции стоят на одном месте в ленте и на странице истории и работают одинаково;
   · posts — «Рассказать историю» в шапке → форма → поле ответа под историей;
   · older — рубрики одной строкой, выбор с первого клика, в ленте остаётся рубрика;
   · future (26.10, вместо ds) — заделы на будущее: карма и награда у автора комментария, карма, рейтинг и баллы в
     профиле, «Группа создана!» с наградой «Лидер» (кадр 21061:92051, ключ groups).
   Экраны выше окна: сцена доезжает до слоя сама (reach), курсор едет после. */
import type { Demo, Scene } from "../grif2/demoTypes";
import type { Stage } from "../grif2/stage";
import { liven, r, reach } from "./flows";

const base = { r, liven };

/** доехать до слоя, дождаться, пока сцена встанет */
async function go(c: Scene, el: HTMLElement | null) {
  reach(c.s, el, c.calm);
  await c.wait(c.calm ? 0 : 650);
}
/** первая карточка истории в ленте и её ряд «реакция · обсуждение · поделиться» */
const firstCard = (s: Stage) => s.find("Coloumns")?.querySelector<HTMLElement>('[data-n="Publication Card"]') ?? null;
const reactions = (root: HTMLElement | null) => root?.querySelector<HTMLElement>('[data-n="like+share"]') ?? null;
/** счётчик реакции: первый числовой текст в ряду */
const likeCount = (row: HTMLElement | null) => [...(row?.querySelectorAll<HTMLElement>("div") ?? [])].find((n) => !n.children.length && /^\d+$/.test(n.textContent?.trim() ?? "")) ?? null;
/** поле ввода внутри слоя: первый текстовый слой с подсказкой */
const field = (box: HTMLElement | null, re: RegExp) => [...(box?.querySelectorAll<HTMLElement>("div") ?? [])].find((n) => !n.children.length && re.test(n.textContent ?? "")) ?? null;

export const demos: Record<string, Demo> = {
  pattern: {
    ...base,
    beats: [
      {
        cap: { ru: "В ленте реакция и обсуждение стоят над заголовком", en: "In the feed, reactions and comments sit above the title" },
        run: async (c) => {
          c.s.show("feed");
          const card = firstCard(c.s);
          await go(c, card);
          const row = reactions(card);
          c.ring(row);
          await c.point(row, 0.3, 0.5);
        },
        hold: 1900,
      },
      {
        cap: { ru: "На странице истории — тот же ряд на том же месте", en: "On the story page, the same row in the same place" },
        run: async (c) => {
          c.s.show("story");
          const row = reactions(c.s.find("Icons"));
          c.ring(row);
          await c.point(row, 0.3, 0.5);
        },
        hold: 1900,
      },
      {
        cap: { ru: "И работает так же: нажали — реакция засчитана", en: "And it works the same: tap, and the reaction counts" },
        run: async (c) => {
          const row = reactions(c.s.find("Icons"));
          const count = likeCount(row);
          const btn = count?.parentElement ?? null;
          await c.point(btn, 0.3, 0.5);
          await c.press(btn);
          if (count) { count.textContent = String(+(count.textContent ?? "0") + 1); btn?.classList.add("g2-pop"); }
          c.ring(btn);
        },
        hold: 2000,
      },
    ],
  },
  posts: {
    ...base,
    beats: [
      {
        cap: { ru: "«Рассказать историю» — в шапке, на любой странице", en: "“Tell a story” sits in the header on every page" },
        run: async (c) => {
          c.s.show("feed");
          const btn = c.s.find("Header Full")?.querySelector<HTMLElement>('[data-n="Button Main"]') ?? null;
          c.ring(btn);
          await c.point(btn, 0.5, 0.5);
          await c.press(btn);
        },
      },
      {
        cap: { ru: "Форма: заголовок, текст и до десяти изображений", en: "The form: a title, the text and up to ten images" },
        run: async (c) => {
          c.s.show("write");
          const body = c.s.find("inputs")?.querySelectorAll<HTMLElement>('[data-n="input"]')[1]?.querySelector<HTMLElement>('[data-n="Text"]') ?? null;
          c.ring(c.s.find("inputs"));
          await c.point(body, 0.1, 0.5);
          body?.style.setProperty("color", "#1d1d1f");
          await c.s.type(body, "Три года назад здесь была парковка. Рассказываю, как мы договорились и что посадили.", 22);
        },
        hold: 1600,
      },
      {
        cap: { ru: "Под каждой историей — поле, чтобы ответить", en: "Under every story, a field to reply" },
        run: async (c) => {
          c.s.show("story");
          const box = c.s.find("My comment");
          await go(c, box);
          c.ring(box);
          const input = field(box, /комментари/i);
          await c.point(input, 0.1, 0.5);
          input?.style.setProperty("color", "#1d1d1f");
          await c.s.type(input, "Жил рядом и не знал, что у квартала такая история.", 26);
        },
        hold: 1800,
      },
    ],
  },
  older: {
    ...base,
    beats: [
      {
        cap: { ru: "Рубрики — одной строкой над лентой", en: "Topics sit in one row above the feed" },
        run: async (c) => {
          c.s.show("feed");
          const row = c.s.find("Tags")?.querySelector<HTMLElement>('[data-n="Tags"]') ?? null;
          c.ring(row);
          await c.point(row, 0.25, 0.5);
        },
        hold: 1700,
      },
      {
        cap: { ru: "Нужная тема — с первого клика", en: "The right topic in one click" },
        run: async (c) => {
          const tags = [...(c.s.find("Tags")?.querySelectorAll<HTMLElement>('[data-n="tag"]') ?? [])].slice(0, 13);
          const all = tags[0];
          const food = tags.find((t) => t.textContent?.trim() === "Еда") ?? null;
          await c.point(food, 0.5, 0.5);
          await c.press(food);
          /* выбранная рубрика в макете — белая с тёмной обводкой, как «Все» */
          if (all) { all.style.boxShadow = "none"; all.style.background = "#eef0f2"; }
          if (food) {
            food.style.boxShadow = "inset 0 0 0 1px #212121, 0 4px 8px rgba(180,180,180,0.24)";
            food.style.background = "#fff";
            food.querySelector<HTMLElement>('[data-n="label"]')?.style.setProperty("color", "#212121");
            food.classList.add("g2-pop");
          }
          c.ring(food);
        },
        hold: 1500,
      },
      {
        cap: { ru: "В ленте остаются истории этой рубрики", en: "The feed keeps the stories of that topic" },
        run: async (c) => {
          const cards = [...(c.s.find("Coloumns")?.querySelectorAll<HTMLElement>('[data-n="Publication Card"], [data-n="Question Card"]') ?? [])];
          const keep = cards.filter((k) => [...k.querySelectorAll<HTMLElement>('[data-n="tag"]')].some((t) => t.textContent?.trim() === "Еда"));
          cards.forEach((k) => { k.style.transition = "opacity 0.4s ease"; if (!keep.includes(k)) k.style.opacity = "0.18"; });
          const first = keep[0] ?? null;
          await go(c, first);
          c.ring(first);
          await c.point(first?.querySelector<HTMLElement>('[data-n="title"]') ?? first, 0.3, 0.4);
        },
        hold: 2200,
      },
    ],
  },
  future: {
    ...base,
    beats: [
      {
        cap: { ru: "У автора комментария — карма и награда", en: "A commenter shows karma and an award" },
        run: async (c) => {
          c.s.show("story");
          const award = c.s.text("Экстраверт");
          const user = award?.closest<HTMLElement>('[data-n="User Name"]') ?? c.s.find("User Name");
          await go(c, user);
          c.ring(user);
          await c.point(award ?? user, 0.5, 0.5);
        },
        hold: 2000,
      },
      {
        cap: { ru: "В профиле — карма, рейтинг и баллы за активность", en: "The profile shows karma, rating and points for activity" },
        run: async (c) => {
          c.s.show("profile");
          const info = c.s.find("Info");
          await go(c, info);
          c.ring(info);
          await c.point(info?.querySelector<HTMLElement>('[data-n="Carma"]') ?? info, 0.5, 0.5);
          await c.wait(c.calm ? 0 : 1100);
          const points = c.s.text("+5 баллов");
          const bubble = points?.closest<HTMLElement>('[data-n="Bubble"]') ?? points;
          await go(c, bubble);
          bubble?.classList.add("g2-pop");
          c.ring(bubble);
          await c.point(bubble, 0.5, 0.5);
        },
        hold: 2000,
      },
      {
        cap: { ru: "Группы по интересам: за первую — награда «Лидер»", en: "Interest groups: the first one earns the “Leader” award" },
        run: async (c) => {
          c.s.show("groups");
          c.s.find("Rectangle 10")?.classList.add("g2-fade");
          const modal = c.s.find("Main Modal");
          modal?.classList.add("g2-dialog");
          await c.wait(c.calm ? 0 : 450);
          const award = modal?.querySelector<HTMLElement>('[data-n="Img+Description"]') ?? modal;
          c.ring(award);
          await c.point(c.s.text("Опубликовать первый пост") ?? award, 0.5, 0.5);
        },
        hold: 2400,
      },
    ],
  },
};
