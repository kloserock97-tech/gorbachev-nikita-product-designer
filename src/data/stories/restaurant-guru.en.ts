/* v70: the "Restaurant Guru" case, English. A concept: redesign of the home screen of a restaurant
   discovery app for iOS, plus a guide that finds a place from a sentence. Facts and figures come from
   the research board behind the project (27 sources); screens exported from Figma (`fHFPiy79mJmlrdEeVGeWY3`).
   The word "concept" appears exactly once — as the kicker label. */
import type { CaseStory, CaseImage } from "../caseStory";

const img = (src: string, w: number, h: number, caption: string, kind = "screen"): CaseImage => ({ src, w, h, caption, kind });
const R = "cases/restaurant-guru/";

export const en: CaseStory = {
  id: "restaurant-guru",
  hero: {
    kicker: "Concept · iOS · 2026",
    title: "Restaurant Guru",
    tagline: "A home screen that showed roughly one restaurant at a time, rebuilt to answer three different questions.",
    summary:
      "The app helps you decide where to eat. On the old home screen about one restaurant fitted into view, categories were icons with no labels, and the way into the guide was an icon in the far top corner. I rebuilt the screen around three jobs: «I know what I'm looking for», «I don't, inspire me», and «I'll say it in words, you find it». Every decision rests on public research with numbers: the project has no users of its own, but other people's measurements are still measurements.",
    facts: [
      ["Role", "Product designer, solo"],
      ["Platform", "iOS"],
      ["When", "2026"],
      ["Grounded in", "27 public studies, Mobbin patterns"],
    ],
    tags: ["Mobile", "Marketplace", "AI feature", "Redesign"],
  },
  kpis: [
    { value: "3–4", label: "places in view instead of one" },
    { value: "1", label: "way into the guide instead of two unnamed icons" },
    { value: "6", label: "places where the old screen argued with the data" },
    { value: "27", label: "sources the decisions stand on" },
  ],
  context: {
    lead: "The screen showed one restaurant and hid the feature the product wanted to push.",
    text:
      "A discovery app's home screen serves three different jobs at once. One person is after a specific place and goes to search. Another has no idea and scrolls collections. A third is ready to describe it: «somewhere quiet with a terrace, for two, under two thousand» — and expects an answer.\n\nThe old screen mixed all three in one space. A full-bleed card plus a ranking line reading «#59 of 2524» left roughly one restaurant in view. Categories were unlabelled circles, so you had to guess what each one meant. At six in the evening the «Pubs and bars» section led with a bar that was closed until four. And the guide lived as an icon in the top right corner, where a thumb does not reach.",
    constraints: [
      { title: "No users of its own", text: "No interviews, no testing. So every decision leans on a published study with a number and a link — other people's measurements instead of my hunches." },
      { title: "The brand already exists", text: "The brand's deep red stays, but it belongs to actions and is not spread across the screen: the red family is where errors live." },
    ],
    myRole:
      "Audit of the current screen, the evidence base, the new structure and priority of blocks, the design system, all screens, and the launch scenario for the guide.",
  },
  research: {
    lead: "No data of my own means I need someone else's. I collected studies where design decisions carry a price tag.",
    methods: [
      {
        kind: "Audit",
        title: "Six places where the screen argues with the data",
        question: "What on the current screen stops a person from reaching a restaurant?",
        sample: "Heuristic walk-through of the live screen",
        finding:
          "The guide sits outside thumb reach; search is narrowed by a single example; category icons carry no labels; one restaurant per screen; closed places take the premium slots; and two unnamed icons in the tab bar compete over the same function.",
      },
      {
        kind: "Evidence base",
        title: "What density and labels are worth",
        question: "What do I stand on when I have no numbers of my own?",
        sample: "27 sources: McKinsey, Baymard, NN/g, Yelp, Tripadvisor",
        finding:
          "Hidden navigation slows people by up to 39% and costs over 20% of discoverability (NN/g). With mediocre lists and filters 67–90% abandon the task, against 17–33% where they are done well (Baymard). 75% of phone interactions happen with a thumb — so what matters lives at the bottom.",
      },
      {
        kind: "Benchmark",
        title: "Where the big players put their AI",
        question: "Is the guide an icon in a corner or a level of navigation?",
        sample: "Yelp, Google Maps, Tripadvisor",
        finding:
          "After a 400% rise in leads Yelp moved its assistant into its own bottom tab. Google put «Ask Maps» directly under the search field. At Tripadvisor, users engaged with AI features bring two to three times the revenue. The conclusion: this is not an icon, it is a level of navigation.",
      },
      {
        kind: "Study",
        title: "Why the interface never says «AI»",
        question: "Does the word «AI» help sell the feature?",
        sample: "Cicek, Gursoy & Lu, Journal of Hospitality Marketing & Management, 2024",
        finding:
          "In the experiment, with the product held identical, mentioning AI in the description lowered intention to use it — in every test. The mechanism is a drop in emotional trust. The study was run on hospitality, which is exactly this industry.",
      },
    ],
    hypotheses: {
      intro: "Three assumptions that shaped the structure:",
      items: [
        { text: "People need to see several places at once, not page through them one by one.", verdict: "Dense cards and a compact list", won: true },
        { text: "A ready-made intent in one tap beats an empty search field.", verdict: "Labelled chips instead of icon puzzles", won: true },
        { text: "A feature the product is pushing cannot live in a blind spot.", verdict: "The guide in the centre tab and as a line in the feed", won: true },
      ],
      measured: "Three things would settle it: the share of sessions that open a place, the share of guide conversations that end at a restaurant, and retention among people who used the guide.",
    },
  },
  decisions: {
    lead: "Six decisions. Each one closes a specific finding from the audit.",
    items: [
      {
        id: "entry",
        title: "One way into the guide instead of two unnamed ones",
        found: "A «✦» icon in the header and a second «✦+» in the middle of the tab bar led to the same place, and neither explained what it was for.",
        did: "I kept two connected entries under one name: a line in the feed carrying a live example query, and a raised «Guide» tab in the centre of the tab bar. The header icon is gone.",
        effect: "The feature stopped being a riddle: the example query is both the promo and the lesson in how to phrase things.",
        why: "The bottom bar is the most reachable part of the screen. That is where you put the thing you are promoting.",
        basis: "NN/g on hidden navigation, Hoober on thumbs, the Yelp Assistant pattern.",
        image: img(R + "01-home.webp", 786, 1704, "Home: the guide line under the chips, the «Guide» tab raised in the bar", "hero"),
      },
      {
        id: "chips",
        title: "Labelled intents instead of icon puzzles",
        found: "Category circles with no labels, the outer ones cut off, and a «Filters» link sitting above a feed with nothing to filter yet.",
        did: "A row of labelled chips — «For you», «Dinner», «Bars», «Coffee» — plus a separate filters button. The order of the chips follows the time of day.",
        effect: "You read the category instead of guessing it. Filters moved into the results, where they belong.",
        why: "Recognition beats recall: a label is read faster than an icon is decoded.",
        basis: "Baymard on lists and filtering; keeping the set to four to six.",
      },
      {
        id: "density",
        title: "Three or four places in view instead of one",
        found: "A full-screen card plus the «#59 of 2524» service line left roughly one restaurant in view.",
        did: "A «For you» shelf with two cards in frame and a compact «Open now nearby» list: photo on the left, facts on the right. The ranking line moved into the place page.",
        effect: "There is a choice where there used to be a single option.",
        why: "One option is not a choice. Twenty-four are worse than six.",
        basis: "NN/g: people read 20–28% of a page. Iyengar & Lepper: 30% against 3% conversion at six options versus twenty-four.",
        image: img(R + "02-home-scrolled.webp", 786, 1704, "Scrolled to the collections: shelves and a compact list hold the density"),
      },
      {
        id: "context",
        title: "Closed places do not get the best slots",
        found: "At six in the evening «Pubs and bars» led with a bar closed until four. The screen did not know what time it was.",
        did: "Location and time of day sit in the header and drive everything below. The block is called «Open now nearby», and each row carries opening hours and distance.",
        effect: "The premium slots go to places you can actually walk into.",
        why: "A discovery app answers «where do I go now». So «now» belongs in the structure of the screen.",
      },
      {
        id: "guide",
        title: "The guide as a stage, not a chat log",
        found: "A message thread has nothing to fill it here: one question, one answer, and the person leaves for the restaurant.",
        did: "Three states: invitation, searching, answer. While it searches, the guide shows an object and says the request back out loud instead of spinning. The answer is a place card with a photo, the facts and a booking button.",
        effect: "The wait stopped being empty, and the answer became an action rather than a paragraph.",
        why: "A chat screen promises a conversation that will not happen. A stage with one answer is the honest version.",
        basis: "A teardown of the Drinkit interface; suggestion-chip answers instead of free input.",
        image: img(R + "05-guide-answer.webp", 786, 1704, "The guide's answer: a place, the facts and a booking at a specific time", "hero"),
      },
      {
        id: "noai",
        title: "The interface never says «AI»",
        found: "«AI» on a button promises technology when the person wants a result — and by the measurements the word actively gets in the way.",
        did: "The tab is called «Guide», the heading promises an outcome, and the mark is a compass. Transparency stays: the guide lists what it is looking through and shows what the answer rests on.",
        effect: "The feature reads as help rather than as a technology demo.",
        why: "The name describes the role or the action. That is how Google's «Help me write» and Spotify's «DJ» are built.",
        basis: "The Cicek, Gursoy & Lu experiment (2024), run on hospitality.",
      },
    ],
  },
  results: {
    lead: "There are no numbers of my own here. There are the numbers the project is betting on, each with a source.",
    points: [
      "Density: three or four places in view instead of one — that is where the chance of choosing anything at all comes from",
      "Findability: the guide moved out of the blind spot into the most reachable part of the screen — Yelp made that move after a 400% rise in leads",
      "Engagement: at Tripadvisor, users drawn into AI features bring two to three times the revenue",
      "Promotion: three native touches instead of a banner — ad-shaped blocks get 0.8% of eye fixations, native messages add 20% to the target action",
    ],
    honesty:
      "All of the above is expectation, not a result achieved: there was no user research and no post-release metrics. The numbers here belong to other people, with links to the originals. Three metrics would settle the bet: the share of sessions that open a place, the share of guide conversations that end at a restaurant, and thirty-day retention against a control group.",
  },
  roadmap: [
    { kicker: "Promotion", title: "Three touches instead of a banner", text: "A one-time announcement at launch, a card second in the feed, and a hint in the empty search result. Each disappears after a click or three unanswered showings." },
    { kicker: "Validation", title: "What to measure first", text: "The share of people who ask the guide at least one question. The market reference is 13.5% of consumers already asking AI about restaurants, so 10–15% in the first quarter is realistic." },
    { kicker: "Next", title: "An answer that drafts the evening", text: "The guide suggests not one place but a route: dinner, then a bar nearby. The shape of the answer already allows for it." },
  ],
  takeaways: [
    "With no users of your own, other people's research is not a crutch — it is a reasonable foundation. The only rule is to name the source behind every number.",
    "The word on a button moves conversion as much as the feature does. «Guide» and «AI assistant» are two different products to someone deciding where to have dinner.",
    "Screen density is not an aesthetic question. One option in view does not convert at all.",
  ],
  quote: "You cannot keep the feature you are promoting where the thumb does not reach.",
  gallery: [
    {
      kind: "stack",
      title: "The guide: invitation, search, answer",
      images: [
        img(R + "03-guide-invite.webp", 786, 1704, "Invitation: a promise of the outcome and an example query"),
        img(R + "04-guide-thinking.webp", 786, 1704, "Searching: the guide lists what it is looking through instead of spinning"),
        img(R + "05-guide-answer.webp", 786, 1704, "Answer: a place, the facts and a booking at a specific time"),
      ],
    },
    {
      kind: "bento",
      title: "Launching the guide, and the place page",
      images: [
        img(R + "06-promo-sheet.webp", 786, 1704, "Touch 1: an announcement with a live example, shown once"),
        img(R + "07-promo-banner.webp", 786, 1704, "Touch 2: a card in the product's own style, not an ad"),
        img(R + "08-promo-hint.webp", 786, 1704, "Touch 3: a hint where the person already has the task"),
        img(R + "09-place-card.webp", 786, 1704, "The place page: the photo leads, and the ranking line moved here from home"),
      ],
    },
  ],
  deepDives: [],
};
