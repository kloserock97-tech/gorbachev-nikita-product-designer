/* v41: рассказ кейса «Сообщество» на двух языках. Источник — Main cases/Community.html и EN/Community.en.html.
   Таблицу конкурентов даём картинкой из кейса: отметок по ячейкам в тексте нет, и досочинять их нельзя.
   v56: тексты переписаны простым языком. Факты и цифры те же; термин остаётся в скобках после объяснения.
   v86: вслед за русской версией по ревью Никиты: акцент на участии жителей и дизайн-метриках, повторы вычищены.
   v89: сокращён вслед за русской версией по docs/prompts/case-copy-edit.md.
   23.10: метрики утвердил Никита: 250+ историй, отказы около 26 %, возвращаемость 12–15 % за неделю; CSI, комментарии, просмотры и время на сайте убраны.
   26.10: the GRIF template, mirroring the Russian version (see the comments there). */
import type { CaseStory, CaseImage } from "../caseStory";

const img = (src: string, w: number, h: number, caption: string, kind = "screen"): CaseImage => ({ src, w, h, caption, kind });
const C = "cases/community/";

export const en: CaseStory = {
  id: "community",
  compact: true,
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
  /* 23.10: metrics approved by Nikita: residents' stories, bounce rate and return visits */
  kpis: [
    { value: "250+", label: "residents' stories passed moderation in the first three months" },
    { value: "~26%", label: "bounce rate after launch" },
    { value: "12–15%", label: "of readers come back to the site within a week" },
  ],
  /* 26.10: goals and constraints as pictures in "In brief", built only from what the case already said */
  context: {
    lead: "",
    goals: [
      "A resident can tell their own story and discuss other people's.",
      "An editorial piece and a resident's story go through one review path: every text shows its status, and a rejected author gets the reason.",
      "What you need is one click away, with no complex filters.",
      "A long text is easy to read, including for people over 55.",
    ],
    art: { goals: ["write", "queue", "rubrics", "read"], constraints: ["months", "kit"] },
    constraints: [
      { title: "Nine months to MVP", text: "Research, architecture, a prototype, the design system and the launch. Groups and events had to wait." },
      { title: "Our own design system", text: "Separate from Mos.ru: I built buttons, fields and cards in every state from scratch." },
    ],
  },
  /* 26.10: numbered findings F1–F4 that the decisions point to; the usability test moved to validation */
  research: {
    lead: "",
    methods: [
      {
        kind: "Competitor analysis",
        question: "What does a site like this need to make sense at all, and where can it stand out?",
        sample: "A handful of key competitors, eleven features",
        finding: "Every competitor lets you write a post and discuss it.",
        image: img(C + "07.webp", 1820, 1010, "Competitors compared on eleven features", "detail"),
        insights: [
          { id: "F1", text: "Writing and discussing are the minimum a site like this needs before people get what it is for." },
        ],
      },
      {
        kind: "Heuristic review",
        question: "Where do similar services confuse people, and what should we not repeat?",
        sample: "Goals, competitors, reference info, heuristics and feedback on one board",
        finding: "Everyone makes the same mistake: one action looks different in different places.",
        insights: [
          { id: "F2", text: "Follow and unfollow are scattered across screens, and people get lost." },
        ],
      },
      {
        kind: "User portrait",
        question: "Who will read and write, and what gets in their way?",
        sample: "Two target groups: 24 to 35 and 55+",
        finding: "Most people are tired of information noise and want simpler navigation.",
        insights: [
          { id: "F3", text: "City stories are more often told by older people, and they get lost in complex filters and on crowded screens." },
          { id: "F4", text: "People read for ten minutes at a stretch, including people over 55." },
        ],
      },
    ],
  },
  decisions: {
    lead: "",
    items: [
      {
        id: "pattern",
        insight: "F2",
        title: "One action looks the same everywhere",
        found: "If Follow and reactions sit in the same place everywhere, people remember them the first time.",
        did: "Follow, unfollow and reactions sit in the same place on every page and work the same way. Nielsen calls this consistency.",
        image: img(C + "02.webp", 1440, 860, "A story page: Listen, comments and Share in the same places as in the feed"),
      },
      {
        id: "posts",
        insight: "F1",
        title: "Writing and discussing come first",
        found: "If writing and discussing are at the centre of the interface, residents will start telling stories themselves.",
        did: "The interface is built around two actions: write a story and reply to one. The form has a title, text and up to ten images, and then the story goes to review. The first residents' stories arrived in week one.",
        image: img(C + "03.webp", 876, 862, "The \"Tell your story\" form"),
      },
      {
        id: "older",
        insight: "F3",
        title: "The right topic is one click away",
        found: "The easier it is to find an interesting topic, the more likely a person is to stay.",
        did: "I put the topics in one row and kept only the filters people need: every extra filter is one more option, and choosing among many takes longer (Hick's law). For older readers I added hints and wrote the texts in plain words.",
        image: img(C + "01.webp", 1440, 788, "The feed: topics in one row above the cards"),
      },
      {
        id: "ds",
        insight: "F4",
        title: "A look made for long reading",
        found: "If the typeface stays legible even at small sizes, people over 55 finish a long story too.",
        did: "I chose Golos Text, a typeface made for screens that stays legible even at small sizes. Contrast follows WCAG, and the palette is black, working greys and one pink accent, #FFECF9.",
        image: img(C + "06.webp", 1600, 1598, "The type scale", "detail"),
      },
    ],
  },
  /* 26.10: before — the feed from "Pilot Layouts" (Figma 2103:12251), after — from "Layouts Full" (21061:89858) */
  compare: {
    title: "The feed: pilot and full version",
    lead: "The feed from the pilot mock-ups and from the full ones. Hover a note to see its spot on the screen.",
    before: {
      title: "Pilot",
      image: img(C + "compare-before.webp", 1440, 900, "The pilot feed: menu, topics, story cards and news"),
      notes: [
        { id: "a-nav", kind: "about", side: "left", text: "Menu", extra: "Feed, about, feedback", rects: [[0.393, 0.02, 0.27, 0.042]] },
        { id: "a-rubrics", kind: "about", side: "left", text: "Topics", extra: "All topics in one row above the feed", rects: [[0.069, 0.108, 0.862, 0.043]] },
        { id: "a-card", kind: "about", side: "left", text: "Story card", extra: "Cover, Listen, comments and topics", rects: [[0.069, 0.171, 0.426, 0.551]] },
        { id: "a-news", kind: "about", side: "right", text: "News", extra: "Short editorial pieces in a column on the right", rects: [[0.507, 0.18, 0.424, 0.8]] },
        { id: "m-write", kind: "mine", side: "right", text: "No \"Tell a story\" in the header: the way into the form is a block in the middle of the feed", rects: [[0.85, 0.013, 0.085, 0.05]] },
        { id: "m-groups", kind: "mine", side: "left", text: "The menu has only the feed and the project pages: groups and events did not make the first version", rects: [[0.393, 0.02, 0.27, 0.042]] },
        { id: "m-react", kind: "mine", side: "left", text: "You can only discuss and share a story", rects: [[0.083, 0.455, 0.055, 0.028]] },
      ],
    },
    after: {
      title: "Full version",
      image: img(C + "compare-after.webp", 1440, 900, "The full feed: Tell a story in the header, an editorial pick, cards with reactions"),
      notes: [
        { id: "m-write", kind: "mine", side: "right", text: "\"Tell a story\" is a button in the header, top right", rects: [[0.742, 0.018, 0.149, 0.044]] },
        { id: "m-groups", kind: "mine", side: "left", text: "The menu now has \"Groups and events\"", rects: [[0.285, 0.02, 0.132, 0.042]] },
        { id: "m-hero", kind: "mine", side: "right", text: "On top, an editorial pick as a carousel", rects: [[0.069, 0.174, 0.862, 0.483]] },
        { id: "m-react", kind: "mine", side: "left", text: "Stories got reactions: a like next to the comments", rects: [[0.264, 0.717, 0.076, 0.033]] },
      ],
    },
  },
  validation: {
    lead: "I checked it in two rounds.",
    stages: [
      {
        kicker: "Round 1",
        title: "Usability test of the prototype",
        text: "Ten participants, a clickable prototype. Nine out of ten managed to follow and unfollow on the first try.",
      },
      {
        kicker: "Round 2",
        title: "The first three months after launch",
        text: "We tracked residents' stories that passed moderation, the bounce rate and how many readers came back within a week.",
      },
    ],
  },
  /* v114: prototype from the mock-ups — the main flow: a reader becomes an author (feed → story → form → published). Full pages from Figma LdUrYy9cNus6q7005xnmXo: 2103:12251, 2109:18727, 2202:7956, 2128:33091 */
  prototype: {
    title: "Read a story, then tell your own",
    lead: "Walk the path of a reader who finishes someone else's story and decides to tell their own.",
    live: "community",
    device: "browser",
    steps: [
      { image: img(C + "s1-feed.webp", 1440, 3058, "The story feed"), spot: [0.719, 0.727], action: "Open \"The mysterious Dangauerovka\"", why: "Look at the cards: Listen, comments and topics sit in the same place on each one." },
      { image: img(C + "s1-article.webp", 1440, 4011, "A story page"), spot: [0.817, 0.0092], action: "Want to tell yours? Press \"Tell a story\"", why: "The button is in the header, top right." },
      { image: img(C + "s1-story.webp", 1440, 1064, "The \"Tell a story\" form"), spot: [0.295, 0.697], action: "Write the story and press Send", why: "The fields are a title, text and pictures. Once you send it, the story goes to a moderator." },
      { image: img(C + "s1-profile.webp", 1440, 1884, "The author's profile: activity"), action: "Done: the story is published", why: "When a moderator approves the story, it shows up in the shared feed and in the author's profile." },
    ],
  },
  takeaways: [],
  gallery: [],
  deepDives: [],
};
