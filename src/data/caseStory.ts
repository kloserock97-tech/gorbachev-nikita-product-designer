/* v41 (docs/prompts/v41.md): страница кейса как один рассказ — от контекста через исследование
   к решениям, ошибкам и результату. Заменяет связку caseDetails + caseTracks на странице кейса
   (caseDetails остаётся для меню Work и ленты). Тексты и цифры — только из страниц кейсов на Tilda
   (Main cases/*.html, EN/*.en.html) и презентации «Open to lead roles»; чего там нет — поле пустое.
   Данные лежат в caseStory.ru.ts и caseStory.en.ts с одинаковой структурой: tsc ловит пропуски. */
import { getLang } from "../i18n";
import type { CaseImage } from "./caseDetails";
import type { CaseTrack } from "./caseTracks";
import ru from "./caseStory.ru";
import en from "./caseStory.en";

export type { CaseImage };

/** пронумерованная точка на экране: проценты от ширины и высоты, подпись и решение, к которому ведёт */
export type Hotspot = { x: number; y: number; text: string; decision?: string };

/** способы показать экраны — вместо одинаковых рамок «браузер/телефон» */
export type Gallery =
  /* высокий экран прокручивается внутри рамки, пока страница едет */
  | { kind: "film"; image: CaseImage; title?: string }
  /* два состояния или два варианта под одним ползунком */
  | { kind: "compare"; before: CaseImage; after: CaseImage; labels: [string, string]; title?: string }
  /* один экран с точками, привязанными к решениям */
  | { kind: "spot"; image: CaseImage; spots: Hotspot[]; title?: string }
  /* веер телефонов */
  | { kind: "stack"; images: CaseImage[]; title?: string }
  /* сетка разных экранов, клик открывает во весь экран */
  | { kind: "bento"; images: CaseImage[]; title?: string };

export type Method = {
  /** метка метода: «Интервью», «Замеры», «Конкуренты»… */
  kind: string;
  title: string;
  /** на какой вопрос отвечали */
  question: string;
  /** кто и сколько: «два стейкхолдера, много заходов» */
  sample?: string;
  finding: string;
  image?: CaseImage;
};

export type Hypothesis = { text: string; verdict: string; won?: boolean };

export type FlowStep = { who: string; step: string; note: string; wait?: boolean };

export type Decision = {
  id: string;
  title: string;
  found: string;
  did: string;
  effect?: string;
  /** принцип, который можно назвать вслух */
  why?: string;
  /** на чём решение стоит: метод из research или наблюдение */
  basis?: string;
  image?: CaseImage;
  /** разбор в глубину — id из deepDives */
  deepDive?: string;
};

export type Mistake = { title: string; decided: string; wrong: string; out: string; changed: string };

export type Outcome = { x: string; y: string; z: string };

export type CaseStory = {
  id: string;
  hero: {
    kicker: string;
    title: string;
    tagline: string;
    /** абзац «о чём кейс» под заголовком */
    summary: string;
    facts: [string, string][];
    tags: string[];
  };
  kpis: { value: string; label: string }[];
  context: {
    lead: string;
    text?: string;
    /** откуда пришла задача */
    origin?: string;
    roles?: { who: string; needs: string }[];
    constraints?: { title: string; text: string }[];
    myRole: string;
    team?: { who: string; how: string }[];
  };
  approach?: {
    lead: string;
    text?: string;
    /** что рассматривал и не взял */
    rejected?: string;
    levels?: { title: string; text: string }[];
    image?: CaseImage;
    /** черты характера → правила (GRIF) */
    rules?: { trait: string; rule: string }[];
    /** чего в продукте нет намеренно */
    refusals?: string[];
  };
  research: {
    lead: string;
    methods: Method[];
    hypotheses?: { intro?: string; items: Hypothesis[]; measured?: string };
    noData?: { title: string; text: string; props: { title: string; text: string }[] };
    persona?: { name: string; age: string; pains: string[]; needs: string[]; note: string };
    competitors?: { title: string; columns: string[]; rows: { name: string; marks: (0 | 1 | 2)[] }[]; note: string };
    matrix?: { title: string; axes: [string, string]; items: { text: string; impact: number; cost: number; tier: string }[]; note: string };
    funnel?: { title: string; steps: { label: string; note: string; drop?: boolean }[]; note: string };
  };
  flow?: { title: string; before: { title: string; steps: FlowStep[]; summary: string }; after: { title: string; steps: FlowStep[]; summary: string } };
  decisions: { lead: string; items: Decision[] };
  /** разделение человек/агент (GRIF) */
  split?: { title: string; left: { name: string; items: string[] }; right: { name: string; items: string[] }; why: string };
  mistakes?: { lead: string; intro?: string; items: Mistake[] };
  results: { lead?: string; intro?: string; outcomes?: Outcome[]; points: string[]; contribution?: string; honesty?: string };
  roadmap?: { kicker: string; title: string; text: string }[];
  takeaways: string[];
  quote?: string;
  gallery: Gallery[];
  /** разборы в глубину — бывшие подзадачи, свой адрес #/work/<кейс>/<id> */
  deepDives: CaseTrack[];
};

export type StorySet = Record<string, CaseStory>;

export function getStory(id: string): CaseStory | null {
  const set: StorySet = getLang() === "ru" ? ru : en;
  return set[id] ?? null;
}

export function storyIds(): string[] {
  return Object.keys(en);
}
