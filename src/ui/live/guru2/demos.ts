/* 26.10: мини-демо решений Restaurant Guru — как у GRIF (src/ui/decisionDemos.ts): три шага на настоящих экранах
   из Figma (те же, что у прототипа, flows.ts), курсор, нажатие и кольцо на настоящем слое. Экран телефона 393 × 852
   встаёт целиком по высоте посреди сцены 16:10 (движок).
   Прокрутка ленты: слой Scroll едет transform (ease-in-out — движение по экрану), в конце позиция фиксируется
   через top — кольцо (stage.mark) считает место по offset* и transform не видит. */
import type { Demo, Scene } from "../grif2/demoTypes";
import { liven, r } from "./flows";

const size = { w: 393, h: 852 };
const scrollTo = async (c: Scene, y: number, ms = 900) => {
  const sc = c.s.find("Scroll");
  if (!sc) return;
  const top = parseFloat(sc.style.top) || 0;
  if (c.calm) { sc.style.top = `${-y}px`; return; }
  sc.style.transition = `transform ${ms}ms cubic-bezier(0.65, 0, 0.35, 1)`;
  sc.style.transform = `translateY(${-y - top}px)`;
  await c.wait(ms + 40);
  sc.style.transition = "none";
  sc.style.transform = "";
  sc.style.top = `${-y}px`;
};
/* «одним тапом»: выбранный чип — бордовый (так в макете у «Для вас»), нажатый перенимает его вид */
const pick = (chips: HTMLElement[], k: number) => {
  const on = chips[0], now = chips[k];
  if (!on || !now || on === now) return;
  const [ca, cb] = [on.className, now.className];
  const [la, lb] = [on.firstElementChild!.className, now.firstElementChild!.className];
  on.className = cb; on.firstElementChild!.className = lb;
  now.className = ca; now.firstElementChild!.className = la;
};

export const demos: Record<string, Demo> = {
  /* Гид получил имя и место в таб-баре */
  entry: {
    r, size, liven,
    beats: [
      {
        cap: { ru: "В ленте — строка гида с примером запроса", en: "In the feed: a guide row with a sample request" },
        run: async (c) => {
          c.s.show("home");
          const row = c.s.find("Guide Prompt Row");
          c.ring(row);
          await c.point(c.s.find("Example query"), 0.35, 0.5);
        },
        hold: 1900,
      },
      {
        cap: { ru: "Вкладка «Гид» — в центре таб-бара, под большим пальцем", en: "The Guide tab sits mid tab bar, under the thumb" },
        run: async (c) => {
          const tab = c.s.find("Tab/ai");
          c.ring(tab);
          await c.point(tab, 0.5, 0.45);
          await c.press(tab);
        },
      },
      {
        cap: { ru: "Гид открывается приглашением", en: "The guide opens with an invitation" },
        run: async (c) => {
          c.s.show("invite");
          await c.wait(500);
          c.ring(c.s.find("Headline"));
          await c.point(c.s.find("Ask Input"), 0.3, 0.5);
        },
        hold: 2000,
      },
    ],
  },
  /* В кадре три-четыре места, и все открыты */
  density: {
    r, size, liven,
    beats: [
      {
        cap: { ru: "Место и время в шапке задают всю выдачу", en: "Location and time in the header set the whole feed" },
        run: async (c) => {
          c.s.show("home");
          const loc = c.s.find("Location");
          c.ring(loc);
          await c.point(loc, 0.6, 0.5);
        },
        hold: 1800,
      },
      {
        cap: { ru: "Полка «Для вас»: в кадре две карточки", en: "The For you shelf: two cards in view" },
        run: async (c) => {
          c.ring(null);
          await scrollTo(c, 250);
          /* полка шире экрана (третья карточка за краем) — кольцо по видимой части, двум карточкам */
          const shelf = c.s.find("Shelf");
          if (shelf) shelf.style.width = "353px";
          c.ring(shelf);
          await c.point(shelf?.children[1] as HTMLElement ?? null, 0.5, 0.4);
        },
        hold: 1900,
      },
      {
        cap: { ru: "«Открыто сейчас рядом»: время работы и расстояние", en: "Open now nearby: hours and distance" },
        run: async (c) => {
          c.ring(null);
          await scrollTo(c, 560);
          const near = c.s.find("Nearby");
          c.ring(near);
          const st = near?.querySelector<HTMLElement>('[data-n="Status"]') ?? null;
          await c.point(st, 0.5, 0.5);
        },
        hold: 2200,
      },
    ],
  },
  /* Категории подписаны словами */
  chips: {
    r, size, liven,
    beats: [
      {
        cap: { ru: "Категории — подписанные чипы", en: "Categories are labelled chips" },
        run: async (c) => {
          c.s.show("home");
          c.ring(c.s.find("Categories"));
          await c.point(c.s.text("Для вас"), 0.5, 0.5);
        },
        hold: 1700,
      },
      {
        cap: { ru: "Нужная выбирается одним тапом", en: "One tap picks the one you need" },
        run: async (c) => {
          const chips = [...(c.s.find("Categories")?.children ?? [])] as HTMLElement[];
          const dinner = chips[1] ?? null;
          c.ring(dinner);
          await c.point(dinner, 0.5, 0.5);
          await c.press(dinner);
          pick(chips, 1);
        },
        hold: 1800,
      },
      {
        cap: { ru: "Фильтры — отдельной кнопкой", en: "Filters get their own button" },
        run: async (c) => {
          const f = c.s.find("Filters");
          c.ring(f);
          await c.point(f, 0.5, 0.5);
        },
        hold: 2000,
      },
    ],
  },
  /* Гид отвечает одной карточкой места */
  guide: {
    r, size, liven,
    beats: [
      {
        cap: { ru: "Готовые запросы — ничего не набирая", en: "Ready-made requests, no typing" },
        run: async (c) => {
          c.s.show("invite");
          await c.wait(400);
          const chip = c.s.hot("тихо и на двоих", 1, c.s.find("Suggestions"));
          c.ring(chip);
          await c.point(chip, 0.5, 0.5);
          await c.press(chip);
        },
      },
      {
        cap: { ru: "Пока гид подбирает — повторённый запрос, без крутилки", en: "While it picks: your request repeated, no spinner" },
        run: async (c) => {
          c.s.show("thinking");
          const echo = c.s.find("Query echo");
          c.s.find("Status")?.classList.add("g2-shimmer");
          c.ring(echo);
          await c.point(echo, 0.5, 0.5);
          await c.s.type(echo, echo?.textContent?.trim() ?? "", 45);
        },
        hold: 1600,
      },
      {
        cap: { ru: "Ответ — одна карточка: фото, факты и бронь", en: "The answer is one card: photo, facts and booking" },
        run: async (c) => {
          c.s.show("answer");
          await c.wait(700);
          const card = c.s.find("Result Card");
          c.ring(card);
          await c.point(card?.querySelector<HTMLElement>('[data-n="CTA"]') ?? null, 0.5, 0.5);
        },
        hold: 2400,
      },
    ],
  },
  /* В интерфейсе не произносится «ИИ» */
  noai: {
    r, size, liven,
    beats: [
      {
        cap: { ru: "Вкладка называется «Гид», знак — компас", en: "The tab is called Guide, the icon is a compass" },
        run: async (c) => {
          c.s.show("home");
          const tab = c.s.find("Tab/ai");
          c.ring(tab);
          await c.point(tab, 0.5, 0.45);
        },
        hold: 1800,
      },
      {
        cap: { ru: "Заголовок обещает результат", en: "The header promises a result" },
        run: async (c) => {
          c.s.show("invite");
          await c.wait(400);
          const sub = c.s.find("Header sub");
          c.ring(sub);
          await c.point(sub, 0.5, 0.5);
        },
        hold: 1900,
      },
      {
        cap: { ru: "Гид перечисляет, что просматривает", en: "The guide says what it is looking through" },
        run: async (c) => {
          c.s.show("thinking");
          const st = c.s.find("Status");
          st?.classList.add("g2-shimmer");
          c.ring(st);
          await c.point(st, 0.5, 0.5);
        },
        hold: 2200,
      },
    ],
  },
};
