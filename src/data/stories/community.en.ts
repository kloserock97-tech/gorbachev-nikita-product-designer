/* v41: рассказ кейса «Сообщество» на двух языках. Источник — Main cases/Community.html и EN/Community.en.html.
   Таблицу конкурентов даём картинкой из кейса: отметок по ячейкам в тексте нет, и досочинять их нельзя.
   v56: тексты переписаны простым языком. Факты и цифры те же; термин остаётся в скобках после объяснения.
   v86: вслед за русской версией по ревью Никиты: акцент на участии жителей и дизайн-метриках, повторы вычищены.
   v89: сокращён вслед за русской версией по docs/prompts/case-copy-edit.md.
   23.10: метрики утвердил Никита: 250+ историй, отказы около 26 %, возвращаемость 12–15 % за неделю; CSI, комментарии, просмотры и время на сайте убраны. */
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
  /* 23.10: metrics approved by Nikita: residents' stories, bounce rate and return visits */
  kpis: [
    { value: "250+", label: "residents' stories passed moderation in the first three months" },
    { value: "~26%", label: "bounce rate after launch" },
    { value: "12–15%", label: "of readers come back to the site within a week" },
  ],
  context: {
    lead: "Residents had nowhere left to talk about their city.",
    text:
      "In two years almost every outlet about city life in Moscow shut down. The news was left with politics and economics, and there was no place to tell a story or discuss a neighbourhood.\n\nI wanted to give residents a place to tell their own story and discuss other people's. The hard part is that texts come from two sides, the editorial team and the residents, and each one has to be checked before it goes live.",
    team: [
      { who: "Clients and managers", how: "Before the first mock-up we agreed on the goal: a place where residents write and discuss things themselves. The first version got a feed, stories and comments, and groups and events had to wait." },
      { who: "Editorial and moderation", how: "One publishing path for two sources: an editorial piece and a resident's story land in the same review queue. Every text shows its status, and a rejected author gets the reason. That queue later grew into the Moderator Dashboard case." },
      { who: "Engineering", how: "I built our own design system, separate from the one Mos.ru used: buttons, fields and cards in every state. I handed off mock-ups in parts, one release at a time." },
    ],
  },
  research: {
    lead: "I looked at two things: what every service like this has, and where they all confuse people in the same way.",
    methods: [
      {
        kind: "Competitor analysis",
        question: "What does a site like this need to make sense at all, and where can it stand out?",
        sample: "A handful of key competitors, eleven features",
        finding:
          "Every competitor lets you write a post and discuss it. That is the minimum a site like this needs before people get what it is for.",
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
          "People are tired of information noise and want simpler navigation. Most people in the research were like that, and Oleg is built from them.",
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
      note: "A composite portrait from the research.",
      pains: ["The news is politics and economics, with almost nothing about the city", "Complex filters and crowded screens"],
      needs: ["Navigation where you find what you need on the first click", "A place where you can write something yourself when you have a story to tell"],
    },
  },
  decisions: {
    lead: "Here is what I changed in the mock-ups after the research.",
    /* v91: the interface film from Claude Design in place of the live demo */
    film: { src: C + "film.mp4", poster: C + "film-poster.webp", w: 1920, h: 1080, caption: "Community interface film: feed, topics, audio, story map, profile, events and the story form" },
    items: [
      {
        id: "pattern",
        title: "One action looks the same everywhere",
        found: "The same mistake from the review: at competitors you have to look for follow and unfollow again on every screen.",
        did: "Follow, unfollow and reactions sit in the same place on every page and work the same way.",
        why: "Once people learn where Follow is, they never have to look for it again. Nielsen calls this consistency.",
      },
      {
        id: "posts",
        title: "Writing and discussing come first",
        found: "In the competitor comparison this was the one thing everyone had.",
        did: "The interface is built around two actions: write a story and reply to one. The form has a title, text and up to ten images, and then the story goes to review.",
        effect: "The first residents' stories arrived in week one.",
        image: img(C + "03.webp", 876, 862, "The \"Tell your story\" form"),
      },
      {
        id: "older",
        title: "What brings people back",
        found: "Next we worked out what would bring people back to the platform. City stories are more often told by older people, though, and they get lost in complex filters and on crowded screens.",
        did: "We added achievements, a rating and ways to form communities, plan time out and invite friends to events on top of follows and reactions. Take the feed. We assumed that the easier it is to find an interesting topic, the more likely a person is to stay. So I put the topics in one row and kept only the filters people need. For older readers I added hints and wrote the texts in plain words.",
        why: "Every extra filter is one more option, and the more options there are, the longer people take to choose (Hick's law).",
      },
      {
        id: "ds",
        title: "A look made for long reading",
        found: "People read for ten minutes at a stretch, including people over 55.",
        did: "I chose Golos Text, a typeface made for screens that stays legible even at small sizes. Contrast follows WCAG, and the palette is black, working greys and one pink accent, #FFECF9.",
        image: img(C + "06.webp", 1600, 1598, "The type scale", "detail"),
      },
    ],
  },
  results: {
    lead: "The first three months after launch.",
    outcomes: [
      { x: "250+ residents' stories in the first three months", y: "Stories that passed moderation and went live.", z: "An interface built around writing and discussing, and one publishing path." },
      { x: "Bounce rate about 26%, so roughly three in four visits did not bounce", y: "After launch we tracked the bounce rate.", z: "Topics in one row and only the filters people need in the feed." },
      { x: "12–15% of readers come back to the site within a week", y: "Next we looked at retention through return visits.", z: "Follows, reactions and a feed where an interesting topic is easy to find." },
    ],
    points: [],
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
  takeaways: [
    "Agree on the goal before the first mock-up. The phrase \"a place where residents take part\" gave us both the contents of the first version and the success metrics.",
    "We moved smart search and podcasts to the roadmap right away, and the first version shipped sooner.",
  ],
  gallery: [
    {
      kind: "spot",
      title: "Editorial and residents in one feed",
      image: img(C + "01.webp", 1440, 788, "The first-version feed", "hero"),
      spots: [
        { x: 46.3, y: 15.5, text: "Topics in one row", decision: "older" },
        { x: 10.4, y: 54.4, text: "Comments and share", decision: "posts" },
        { x: 46.3, y: 76.4, text: "Consistent actions", decision: "pattern" },
      ],
    },
    {
      kind: "bento",
      title: "How the project grew",
      images: [
        img(C + "film-01.webp", 1600, 900, "The feed of living stories"),
        img(C + "film-03.webp", 1600, 900, "Stories you can listen to"),
        img(C + "film-04.webp", 1600, 900, "The map of linked stories"),
        img(C + "film-05.webp", 1600, 900, "Profile and reputation"),
        img(C + "film-06.webp", 1600, 900, "An event in the app"),
        img(C + "film-07.webp", 1600, 900, "The story form"),
      ],
    },
  ],
  deepDives: [],
};
