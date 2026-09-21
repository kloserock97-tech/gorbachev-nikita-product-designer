/* v41: рассказ кейса «Сообщество» на двух языках. Источник — Main cases/Community.html и EN/Community.en.html.
   Таблицу конкурентов даём картинкой из кейса: отметок по ячейкам в тексте нет, и досочинять их нельзя.
   v56: тексты переписаны простым языком. Факты и цифры те же; термин остаётся в скобках после объяснения. */
import type { CaseStory, CaseImage } from "../caseStory";

const img = (src: string, w: number, h: number, caption: string, kind = "screen"): CaseImage => ({ src, w, h, caption, kind });
const C = "cases/community/";

export const en: CaseStory = {
  id: "community",
  hero: {
    kicker: "Web platform · Mos.ru · 2024",
    title: "Community",
    tagline: "I designed and launched a site where Muscovites tell stories about their city: stories.mos.ru.",
    summary:
      "In two years almost every outlet that wrote about city life in Moscow had shut down, and residents had nowhere left to talk about their city. I built a site for Mos.ru, the Moscow city services portal, where both the editorial team and residents write, and a moderator checks every piece before it goes live. It took nine months from a blank page to the first working version. The first three months after launch: 169.4K views, only one visitor in four leaves from the first page (26.25% bounce rate), and 78.9% are happy in the survey (CSI).",
    facts: [
      ["Role", "Product/UX designer"],
      ["Company", "Moscow Department of Information Technology (Mos.ru)"],
      ["Timeline", "2024, nine months to MVP"],
      ["Platform", "Web"],
    ],
    tags: ["GovTech", "B2C", "Design system", "MVP launch"],
  },
  kpis: [
    { value: "169.4K", label: "views in the first three months" },
    { value: "26.25%", label: "leave from the first page. Three out of four stay to read" },
    { value: "78.9%", label: "are happy with the site in the survey (CSI)" },
    { value: "3:20", label: "spent on the site per visit, on average" },
  ],
  context: {
    lead: "Residents had nowhere left to talk about their city.",
    text:
      "Over two years many outlets that wrote about city life closed down. The news was left with politics and economics. Moscow had no place where a resident could take part: tell a story, leave a comment, argue.\n\nSo I framed the job like this: make people want to take part again. The website was only the means. The hard part: texts come from two places at once, the editorial team and the residents, and every one of them has to be checked before it is published.",
    team: [
      { who: "Clients and managers", how: "Before the first mock-up we agreed on what we were building: a place where residents take part in city life. We did not need a news shop window. Everything else grew out of that one phrase. The first version got a feed, stories and comments, while groups and events had to wait. The numbers we watched after launch came from the same phrase." },
      { who: "Editorial and moderation", how: "I made one publishing path for two sources. An editorial piece and a resident's story land in the same review queue. Every text shows its status, and when one is rejected the author gets the reason. That queue later grew into a case of its own, the Moderator Dashboard." },
      { who: "Engineering", how: "I built our own kit of ready-made interface parts (a design system): buttons, fields and cards in every state. It was separate from the one Mos.ru already used. I handed off mock-ups in parts, one release at a time. The expensive ideas like smart search and podcasts were put off, so the first version shipped sooner." },
    ],
    myRole:
      "Research and the structure of the site, design and a clickable prototype of the whole platform, a design system from scratch, taking the product to its first version and launching it.",
  },
  research: {
    lead: "First I found out what people expect from services like this and where all of them are weak.",
    methods: [
      {
        kind: "Competitor analysis",
        title: "What everyone has and what almost nobody has",
        question: "What does a site like this need to make sense at all, and where can it stand out?",
        sample: "A handful of key competitors, eleven features",
        finding:
          "Everyone lets you write a post and discuss it in the comments. It is like a till in a shop: without one the shop does not work. But competitors keep follow and unfollow on different screens, and people get lost. That gave two decisions: what sits at the centre of the screen, and that one action always looks the same.",
        image: img(C + "07.webp", 1600, 770, "Competitors compared on eleven features: green for what everyone has, red for what the market lacks", "detail"),
      },
      {
        kind: "User portrait",
        title: "Who we design for",
        question: "Who will read and write, and what gets in their way today?",
        sample: "Two target groups: 24 to 35 and 55+",
        finding:
          "Most people in the research were a bit like Oleg: tired of the stream of news and wanting to find things without effort. Some people get lost in complex filters and on screens with too much going on.",
      },
      {
        kind: "Heuristic review",
        title: "The research board",
        question: "Where do similar services confuse people, and what should we not repeat?",
        sample: "Goals, competitors, reference info, heuristics and feedback on one board",
        finding:
          "One mistake comes up again and again: the same action looks different in different places. Imagine a light switch hanging at a new height in every room. In Community, follow, unfollow and reactions work the same way everywhere.",
      },
      {
        kind: "Usability runs",
        title: "Testing the prototype with people",
        question: "Do people manage the main things on the first try?",
        sample: "Ten participants",
        finding: "Nine out of ten people managed to follow and unfollow on the first try.",
      },
      {
        kind: "Satisfaction survey",
        title: "After launch",
        question: "Are both the younger and the older readers happy? Did keeping things simple lose anyone?",
        sample: "CSI on the live project, stories.mos.ru",
        finding: "CSI 78.9%. Older readers rated navigation as easy as younger ones did.",
      },
    ],
    persona: {
      name: "Oleg",
      age: "30",
      note: "Tired of the stream of news and wants to find things without effort. Most people in the research were a bit like Oleg.",
      pains: ["The news is politics and economics, with almost nothing about the city", "Complex filters and screens with too much going on"],
      needs: ["Navigation where you find what you need on the first click", "A place where you can write as well as read"],
    },
  },
  decisions: {
    lead: "Four decisions. Each one grew out of something I noticed.",
    items: [
      {
        id: "pattern",
        title: "One action looks the same everywhere",
        found: "Competitors keep follow and unfollow on different screens, and people get lost.",
        did: "On every page the action now sits in the same place and works the same way.",
        effect: "When we tested with people, nine out of ten participants followed and unfollowed on the first try.",
        why: "Nobody should work the page out again on every screen. One action keeps one place and one look.",
        basis: "Competitor analysis and a review against Nielsen's heuristics: consistency, so the same thing looks the same everywhere.",
      },
      {
        id: "posts",
        title: "The centre of the screen: write and discuss",
        found: "People come to services like this to write a post and discuss it in the comments. The rest is secondary.",
        did: "Built the interface around those two actions.",
        effect: "The first residents' stories arrived in week one. In three months 250+ stories passed the review, with about 3K comments under the pieces.",
        why: "An action people have to hunt for is an action they skip. Writing a story and replying to one are both in plain sight.",
        basis: "Competitor analysis: every service in the eleven-feature comparison has posts and comments.",
        image: img(C + "03.webp", 733, 722, "The \"Tell your story\" form: title, text, up to ten images, and off it goes to review"),
      },
      {
        id: "older",
        title: "Easy for people over 55 too",
        found: "Some people get lost in complex filters and on screens with too much going on.",
        did: "I removed the extras, added hints and pop-up explanations, wrote the texts in plain words and kept only familiar gestures.",
        effect: "Both age groups stayed on the site. In the survey older readers rated navigation as easy as younger ones did.",
        why: "The site runs on city stories, and it is mostly older people who tell them. A complicated filter is a closed door for them.",
        basis: "The user portrait and the satisfaction survey (CSI). Hick's law: the more options on screen, the longer the choice takes.",
      },
      {
        id: "ds",
        title: "A look made for long reading",
        found: "This is a site of long texts. People will read it for a long time, including people over 55.",
        did: "I chose the Golos Text typeface: it is made for screens and stays legible even when small. The contrast is calm, so eyes do not tire on long texts, and that suits a city project. Black builds trust, and a soft pink (#FFECF9) adds lightness.",
        effect: "The interface came out calm and even, comfortable to read for a long time. That is why few people leave from the first page and the survey score is high.",
        why: "People read here for ten minutes at a stretch. The typeface and the contrast decide whether their eyes give up.",
        basis: "The portrait of the older reader and the accessibility guidance (WCAG) on text contrast.",
        image: img(C + "06.webp", 1600, 1598, "Text sizes for long reading: from the main heading down to captions", "detail"),
      },
    ],
  },
  results: {
    lead: "The first three months after launch.",
    points: [
      "169.4K views from zero. A good start for a brand-new city site",
      "Bounce rate 26.25%: three out of four stay and read",
      "3 min 20 s per visit on average. In that time a person finishes one or two pieces",
      "250+ residents' stories and about 3K comments. Roughly one reader in four comes back within a week",
      "Both groups we counted on use the site: 24 to 35 and 55+",
    ],
    honesty: "The numbers are decent, and the site has room to grow.",
  },
  roadmap: [
    { kicker: "Format", title: "Podcasts", text: "People will be able to listen to stories on the go or while doing chores. A voice carries emotion better than text, and transcripts bring people in from search." },
    { kicker: "Search", title: "Search that gathers everything on a topic", text: "A resident searches for \"road repairs\" and sees it all at once: news, neighbours' discussions, the city's plans and a how-to for filing a request." },
    { kicker: "Retention", title: "A profile with rewards", text: "Activity, badges, ratings: from \"Perfectionist\" for a completed profile to \"Content Guru\" for ten stories." },
  ],
  takeaways: [
    "I put off the expensive ideas like smart search and podcasts, and the first version shipped sooner.",
    "Agree on the goal before the first mock-up. The phrase \"a place where residents take part\" gave us both the contents of the first version and the numbers we judged success by.",
  ],
  quote: "The website was the means. The job was to make residents want to take part in city life again.",
  gallery: [
    {
      kind: "spot",
      title: "First-version feed: editorial and residents in one stream",
      image: img(C + "01.webp", 1473, 806, "First-version feed: editorial pieces and residents' stories in one stream", "hero"),
      spots: [
        { x: 50, y: 12.4, text: "Topics sit in one row. Nobody has to figure out a filter panel", decision: "older" },
        { x: 20.5, y: 44, text: "Comments and share on every card", decision: "posts" },
        { x: 51.8, y: 58.3, text: "The same action looks the same everywhere", decision: "pattern" },
      ],
    },
    {
      kind: "bento",
      title: "First-version screens",
      images: [
        img(C + "02.webp", 1600, 794, "Story page: tags, authors and related pieces close at hand"),
        img(C + "04.webp", 1338, 806, "\"About\" page: why the site exists, and the product's signature ticker"),
        img(C + "05.webp", 1105, 788, "Feedback: a support question and an idea go out from one window, socials right next to them"),
      ],
    },
  ],
  deepDives: [],
};
