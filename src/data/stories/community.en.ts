/* v41: рассказ кейса «Сообщество» на двух языках. Источник — Main cases/Community.html и EN/Community.en.html.
   Таблицу конкурентов даём картинкой из кейса: отметок по ячейкам в тексте нет, и досочинять их нельзя.
   v56: тексты переписаны простым языком. Факты и цифры те же; термин остаётся в скобках после объяснения.
   v86: вслед за русской версией по ревью Никиты: акцент на участии жителей и дизайн-метриках, повторы вычищены.
   v89: сокращён вслед за русской версией по docs/prompts/case-copy-edit.md. */
import type { CaseStory, CaseImage } from "../caseStory";

const img = (src: string, w: number, h: number, caption: string, kind = "screen"): CaseImage => ({ src, w, h, caption, kind });
const C = "cases/community/";

export const en: CaseStory = {
  id: "community",
  hero: {
    kicker: "Web platform · Mos.ru · 2024",
    title: "Community",
    tagline: "I designed and launched stories.mos.ru, a platform where Muscovites tell stories about their city.",
    summary:
      "I designed from scratch a platform where the editorial team and residents write about the city, and every piece goes through moderation before it is published. Research, information architecture, a clickable prototype, the design system, the MVP and the launch took nine months.",
    facts: [
      ["Role", "Product/UX designer"],
      ["Company", "Moscow Department of Information Technology (Mos.ru)"],
      ["Timeline", "2024, nine months to MVP"],
      ["Platform", "Web"],
    ],
    tags: ["GovTech", "B2C", "Design system", "MVP launch"],
  },
  /* residents taking part is the product's goal; first-try success and CSI are the design metrics */
  kpis: [
    { value: "250+", label: "residents' stories passed moderation in the first three months" },
    { value: "~3K", label: "comments under the pieces" },
    { value: "9 of 10", label: "followed and unfollowed on the first try in usability testing" },
    { value: "78.9%", label: "are happy with the site in the survey (CSI)" },
  ],
  context: {
    lead: "Residents had nowhere left to talk about their city.",
    text:
      "In two years almost every outlet about city life in Moscow shut down. The news was left with politics and economics, and there was no place to tell a story or discuss a neighbourhood.\n\nSo I framed the job as making people want to take part in city life again. The hard part: texts come from two sides, the editorial team and the residents, and each has to be checked before it goes live.",
    team: [
      { who: "Clients and managers", how: "Before the first mock-up we agreed to build a place where residents take part, and we did not need a news shop window. The first version got a feed, stories and comments, while groups and events had to wait." },
      { who: "Editorial and moderation", how: "One publishing path for two sources: an editorial piece and a resident's story land in the same review queue. Every text shows its status, and a rejected author gets the reason. That queue later grew into the Moderator Dashboard case." },
      { who: "Engineering", how: "I built our own design system, separate from the one Mos.ru used: buttons, fields and cards in every state. I handed off mock-ups in parts, one release at a time." },
    ],
  },
  research: {
    lead: "First I found out what services like this must have and where all of them are weak.",
    methods: [
      {
        kind: "Competitor analysis",
        question: "What does a site like this need to make sense at all, and where can it stand out?",
        sample: "A handful of key competitors, eleven features",
        finding:
          "Everyone lets you write a post and discuss it. That is the required minimum, and those actions have to lead the screen.",
        image: img(C + "07.webp", 1820, 1010, "Competitors compared on eleven features", "detail"),
      },
      {
        kind: "Heuristic review",
        question: "Where do similar services confuse people, and what should we not repeat?",
        sample: "Goals, competitors, reference info, heuristics and feedback on one board",
        finding:
          "Everyone makes the same mistake: one action looks different in different places. Follow and unfollow are scattered across screens, and people get lost.",
      },
      {
        kind: "User portrait",
        question: "Who will read and write, and what gets in their way?",
        sample: "Two target groups: 24 to 35 and 55+",
        finding:
          "Most people are tired of the news stream and want things to find them.",
      },
      {
        kind: "Usability testing",
        question: "Do people manage the main things on the first try?",
        sample: "Ten participants, a clickable prototype",
        finding: "Nine out of ten people managed to follow and unfollow on the first try.",
      },
    ],
    persona: {
      name: "Oleg",
      age: "30",
      note: "A composite of most people in the research.",
      pains: ["The news is politics and economics, with almost nothing about the city", "Complex filters and crowded screens"],
      needs: ["Navigation where you find what you need on the first click", "A place where you can write as well as read"],
    },
  },
  decisions: {
    lead: "Four decisions, each grown out of the research.",
    items: [
      {
        id: "pattern",
        title: "One action looks the same everywhere",
        found: "At competitors you have to look for follow and unfollow again on every screen.",
        did: "Follow, unfollow and reactions sit in the same place on every page and work the same way.",
        why: "Consistency, after Nielsen: one action keeps one place and one look.",
      },
      {
        id: "posts",
        title: "The centre of the screen: write and discuss",
        found: "Without writing and discussing a service like this does not work, and the rest is secondary.",
        did: "The interface is built around two actions: write a story and reply to one. The form has a title, text and up to ten images, and then the story goes to review.",
        effect: "The first residents' stories arrived in week one.",
        why: "An action people have to hunt for is an action they skip.",
        image: img(C + "03.webp", 876, 862, "The \"Tell your story\" form"),
      },
      {
        id: "older",
        title: "Easy for people over 55 too",
        found: "City stories are more often told by older people, and they get lost in complex filters and on crowded screens.",
        did: "I removed the extras, put topics in one row in place of a filter panel, added hints, wrote the texts in plain words and kept only familiar gestures.",
        effect: "In the survey older readers rated navigation as easy as younger ones did.",
        why: "Hick's law: the more options, the longer the choice.",
      },
      {
        id: "ds",
        title: "A look made for long reading",
        found: "People read for ten minutes at a stretch, including people over 55.",
        did: "Golos Text, a screen typeface that stays legible even when small. Calm contrast following WCAG, black for trust and a soft pink #FFECF9 for lightness.",
        effect: "Eyes do not tire, and the interface stays out of the story's way.",
        image: img(C + "06.webp", 1600, 1598, "The type scale", "detail"),
      },
    ],
  },
  results: {
    lead: "The first three months after launch.",
    outcomes: [
      { x: "Residents take part: 250+ stories and about 3K comments", y: "Stories after moderation and comments over three months.", z: "An interface built around writing and discussing, and one publishing path." },
      { x: "The main action on the first try: 9 of 10", y: "Usability test of the prototype, ten participants.", z: "Every action keeps one place and one look." },
      { x: "Happy with the site: 78.9% (CSI), older readers no lower than younger ones", y: "A survey on the live stories.mos.ru.", z: "Simple navigation and a look made for long reading." },
    ],
    points: [
      "Roughly one reader in four comes back within a week",
      "169.4K views from zero",
      "Bounce rate 26.25%: three out of four stay to read",
      "3 min 20 s per visit on average, enough to finish one or two pieces",
      "Both target groups use the site: 24 to 35 and 55+",
    ],
  },
  takeaways: [
    "Agree on the goal before the first mock-up. The phrase \"a place where residents take part\" gave us both the contents of the first version and the success metrics.",
    "An MVP is a decision about what to put off. Smart search and podcasts went to the roadmap, and the first version shipped sooner.",
  ],
  gallery: [
    {
      kind: "spot",
      title: "The feed: editorial and residents in one stream",
      image: img(C + "01.webp", 1440, 788, "The first-version feed", "hero"),
      spots: [
        { x: 46.3, y: 15.5, text: "Topics in one row", decision: "older" },
        { x: 10.4, y: 54.4, text: "Comments and share", decision: "posts" },
        { x: 46.3, y: 76.4, text: "Consistent actions", decision: "pattern" },
      ],
    },
    {
      kind: "bento",
      title: "First-version screens",
      images: [
        img(C + "02.webp", 1440, 860, "Story page"),
        img(C + "04.webp", 1440, 880, "\"About\" page"),
        img(C + "05.webp", 1440, 1230, "Feedback"),
      ],
    },
  ],
  deepDives: [],
};
