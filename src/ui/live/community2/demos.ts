/* 26.10: мини-демо решений «Сообщества» — как у GRIF (src/ui/decisionDemos.ts): три шага на тех же экранах из Figma,
   что и прототип (flows.ts), курсор, нажатие и кольцо на настоящем слое. Подписи — только то, что сказано в решении.
   · pattern — реакции стоят на одном месте в ленте и на странице истории и работают одинаково;
   · posts — «Рассказать историю» в шапке → форма → поле ответа под историей;
   · older — рубрики одной строкой, выбор с первого клика, в ленте остаётся рубрика;
   · ds — Golos Text в заголовке и в длинном тексте, один розовый акцент.
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
  ds: {
    ...base,
    beats: [
      {
        cap: { ru: "Golos Text в заголовке истории", en: "Golos Text in the story title" },
        run: async (c) => {
          c.s.show("story");
          const title = c.s.find("heading+subtitle");
          c.ring(title);
          await c.point(title, 0.35, 0.5);
        },
        hold: 1700,
      },
      {
        cap: { ru: "Длинный текст читается без усилий, в том числе 55+", en: "Long text reads easily, people 55+ included" },
        run: async (c) => {
          const text = c.s.find(" Two paragraphs") ?? c.s.find("Two paragraphs", true);
          await go(c, text);
          c.ring(text);
          await c.point(text, 0.4, 0.3);
        },
        hold: 1900,
      },
      {
        cap: { ru: "Чёрный, рабочие серые и один розовый акцент", en: "Black, working greys and a single pink accent" },
        run: async (c) => {
          const card = c.s.find("Statistic Card");
          await go(c, card);
          c.ring(card?.querySelector<HTMLElement>('[data-n="table"]') ?? card);
          await c.point(card?.querySelector<HTMLElement>('[data-n="Table Cell"]') ?? card, 0.5, 0.5);
        },
        hold: 2000,
      },
    ],
  },
};
