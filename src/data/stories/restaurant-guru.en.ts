/* v70: the "Restaurant Guru" case, English. A concept: redesign of the home screen of a restaurant
   discovery app for iOS, plus a guide that finds a place from a sentence. Facts and figures come from
   the research board behind the project (27 sources); screens exported from Figma (`fHFPiy79mJmlrdEeVGeWY3`).
   The word "concept" appears exactly once — as the kicker label.
   v86: following the Russian version after Nikita's review: design metrics and the guide's product target on
   top, other companies' numbers stay in the research and are no longer presented as the result, hypotheses
   no longer marked as confirmed, repetition removed.
   v88: metrics, Outcome and Next steps removed: nothing was measured for a concept.
   v89: shortened following the Russian version, by docs/prompts/case-copy-edit.md. */
import type { CaseStory, CaseImage } from "../caseStory";

const img = (src: string, w: number, h: number, caption: string, kind = "screen"): CaseImage => ({ src, w, h, caption, kind });
const R = "cases/restaurant-guru/";

export const en: CaseStory = {
  id: "restaurant-guru",
  hero: {
    kicker: "Concept · iOS · 2026",
    title: "Restaurant Guru",
    tagline: "I rebuilt a restaurant discovery app's home screen around three jobs and moved the guide that finds a place from a sentence into the centre of navigation.",
    summary:
      "I audited the home screen of the iOS app, gathered an evidence base from 27 public studies, and built a new screen structure, the design system, every screen and the guide's launch scenario.",
    facts: [
      ["Role", "Product designer, solo"],
      ["Platform", "iOS"],
      ["When", "2026"],
      ["Grounded in", "27 public studies, Mobbin patterns"],
    ],
    tags: ["Mobile", "Marketplace", "AI feature", "Redesign"],
  },
  kpis: [],
  context: {
    lead: "The screen showed one restaurant and hid the feature the product wanted to push.",
    text:
      "A discovery app's home screen has three jobs. One person knows the place and searches for it by name. Another has no idea and scrolls collections. A third is ready to describe it, \"somewhere quiet with a terrace, for two, under two thousand\", and expects an answer.\n\nThe old screen mixed all three together, and the guide hid behind an icon in the top corner, out of thumb reach.",
    constraints: [
      { title: "No users of its own", text: "There were no interviews and no testing, so every decision leans on a published study with a number and a link." },
      { title: "The brand already exists", text: "The brand's deep red can only go on actions. People read red as an error, so it can't be spread across the screen." },
    ],
  },
  research: {
    lead: "I gathered studies where design decisions carry a price tag.",
    methods: [
      {
        kind: "Audit",
        question: "What on the current screen stops a person from reaching a restaurant?",
        sample: "Heuristic walk-through of the live screen",
        finding:
          "Six zones: the guide out of thumb reach, search narrowed by one example, category icons with no labels, one restaurant per screen, closed places in the premium slots, and two unnamed icons leading to the same function.",
      },
      {
        kind: "Evidence base",
        question: "What do I stand on when I have no numbers of my own?",
        sample: "27 sources: McKinsey, Baymard, NN/g, Yelp, Tripadvisor",
        finding:
          "Hidden navigation slows people by up to 39% and cuts discoverability by 20% (NN/g). With mediocre lists and filters 67–90% abandon the task, against 17–33% where they are done well (Baymard). 75% of phone interactions happen with a thumb, so the important things belong in the lower half of the screen.",
      },
      {
        kind: "Benchmark",
        question: "Is an icon in the corner enough for the guide, or does it need its own tab?",
        sample: "Yelp, Google Maps, Tripadvisor",
        finding:
          "After a 400% rise in leads Yelp moved its assistant into its own bottom tab. Google put \"Ask Maps\" right under the search field. At Tripadvisor, users of AI features bring two to three times the revenue. So I moved the guide out of the corner and into the main navigation.",
      },
      {
        kind: "Study",
        question: "Does the word \"AI\" help sell the feature?",
        sample: "Cicek, Gursoy & Lu, Journal of Hospitality Marketing & Management, 2024",
        finding:
          "With the product held identical, mentioning AI lowered intention to use it in every test, because emotional trust drops. The study was run on hospitality, which is exactly this industry.",
      },
    ],
    hypotheses: {
      intro: "Three assumptions shaped the structure of the screen.",
      items: [
        { text: "People need to see several places at once to have something to choose from.", verdict: "Dense cards and a compact list" },
        { text: "A ready-made intent in one tap beats an empty search field.", verdict: "A row of labelled chips" },
        { text: "A feature the product is pushing cannot sit in a blind spot.", verdict: "The guide in the centre tab and as a line in the feed" },
      ],
    },
  },
  decisions: {
    lead: "Six changes, from the way into the guide to what it is called.",
    items: [
      {
        id: "entry",
        title: "The guide got a name and a place in the tab bar",
        found: "A \"✦\" icon in the header and a \"✦+\" in the tab bar led to the same place and explained nothing.",
        did: "Two connected entries under one name: a line in the feed with a live example query, and a raised \"Guide\" tab in the centre of the tab bar. The header icon is gone.",
        effect: "The example query in the feed shows right away that you can write to the guide in plain words.",
        why: "A thumb reaches the bottom bar without shifting your grip on the phone, so that's where you put what you want to promote.",
        basis: "NN/g on hidden navigation, Hoober on thumbs, Yelp Assistant.",
        image: img(R + "01-home.webp", 786, 1704, "Home screen", "hero"),
      },
      {
        id: "chips",
        title: "Categories are labelled with words",
        found: "Category circles with no labels, the outer ones cut off, and \"Filters\" where there was nothing to filter yet.",
        did: "A row of labelled chips (\"For you\", \"Dinner\", \"Bars\", \"Coffee\") plus a separate filters button. The order of the chips follows the time of day.",
        effect: "You can tell the category at a glance now. Filters moved into the results, where there is something to filter.",
        why: "A label is read faster than an icon is decoded. Nielsen has a heuristic about this: it's easier to recognise a word than to remember what a picture means.",
        basis: "Baymard on lists and filtering; four to six options in a set.",
      },
      {
        id: "density",
        title: "Three or four places in view",
        found: "A huge card and the \"#59 of 2524\" line left one restaurant in view.",
        did: "A \"For you\" shelf with two cards in frame and a compact \"Open now nearby\" list: photo on the left, facts on the right. The ranking line moved into the place page.",
        effect: "There is a choice where there used to be a single option.",
        why: "One option is not a choice, and twenty-four are worse than six.",
        basis: "NN/g: people read 20–28% of a page. Iyengar & Lepper: 30% against 3% conversion at six options versus twenty-four.",
        image: img(R + "02-home-scrolled.webp", 786, 1704, "Collections and a compact list"),
      },
      {
        id: "context",
        title: "Closed places do not get the best slots",
        found: "At six in the evening \"Pubs and bars\" led with a bar closed until four: the screen didn't know what time it was.",
        did: "Location and time of day sit in the header and drive everything below. The \"Open now nearby\" block shows opening hours and distance.",
        effect: "The premium slots go to places you can walk into right now.",
        why: "The app answers \"where do I go now\", so \"now\" belongs in the structure of the screen.",
      },
      {
        id: "guide",
        title: "The guide answers with a single place card",
        found: "A message thread has nothing to fill it: one question, one answer, and the person leaves for the restaurant.",
        did: "Three states: invitation, searching, answer. While it searches, the screen shows an object and the request said back, with no spinner. The answer is a place card with a photo, the facts and a booking button.",
        effect: "While you wait, you can see the guide understood the request, and from the answer card you can book a table straight away.",
        why: "A chat screen promises a conversation that will not happen.",
        basis: "A teardown of the Drinkit interface: suggested answers you can pick without typing anything.",
        image: img(R + "05-guide-answer.webp", 786, 1704, "The guide's answer", "hero"),
      },
      {
        id: "noai",
        title: "The interface never says \"AI\"",
        found: "\"AI\" on a button promises technology, and the person wants dinner.",
        did: "The tab is called \"Guide\", the heading promises an outcome, and the mark is a compass. Transparency stays: the guide lists what it's looking through and shows what the answer rests on.",
        effect: "The interface dropped the word that lowered people's intention to use the feature in the Cicek study.",
        why: "The name describes the role or the action, like Google's \"Help me write\" and Spotify's \"DJ\".",
        basis: "Cicek, Gursoy & Lu (2024).",
      },
    ],
  },
  /* v114: prototype from the mock-ups — the main flow: home → guide → picking → the place */
  prototype: {
    title: "Find somewhere to go tonight",
    lead: "You're looking for a quiet place for two, and you'll go from the home screen through the guide to a booked table.",
    steps: [
      { image: img(R + "01-home.webp", 786, 1704, "Home screen"), spot: [0.5, 0.935], action: "Open the Guide in the middle of the tab bar", why: "The Guide tab sits raised above the others, so you spot it right away." },
      { image: img(R + "03-guide-invite.webp", 786, 1704, "Invitation"), spot: [0.333, 0.757], action: "Pick \"quiet, for two\"", why: "The chips under the field are ready-made requests, so there's nothing to type." },
      { image: img(R + "04-guide-thinking.webp", 786, 1704, "Picking"), wait: 2200, action: "The guide is picking a place", why: "A couple of seconds of waiting. The guide says your request back so you can see it understood." },
      { image: img(R + "05-guide-answer.webp", 786, 1704, "Answer"), spot: [0.5, 0.477], action: "Open \"Ronin\"", why: "The guide suggests one place. The card already has a photo, the key facts and a booking button." },
      { image: img(R + "09-place-card.webp", 786, 1704, "Place card"), action: "Done: everything for the decision on one screen", why: "The route and a 19:30 table booking are side by side. All that's left is leaving the house." },
    ],
  },
  takeaways: [
    "With no users of your own, other people's research is a reasonable foundation. The rules are to name the source behind every number and never pass someone else's result off as your own.",
    "To someone deciding where to have dinner, \"Guide\" and \"AI assistant\" are two different products, even though the feature behind them is the same.",
  ],
  gallery: [
    {
      kind: "stack",
      title: "The guide: invitation, search, answer",
      images: [
        img(R + "03-guide-invite.webp", 786, 1704, "Invitation"),
        img(R + "04-guide-thinking.webp", 786, 1704, "Searching"),
        img(R + "05-guide-answer.webp", 786, 1704, "Answer"),
      ],
    },
    {
      kind: "bento",
      title: "Launching the guide, and the place page",
      images: [
        img(R + "06-promo-sheet.webp", 786, 1704, "Touch 1: launch announcement"),
        img(R + "07-promo-banner.webp", 786, 1704, "Touch 2: a card in the feed"),
        img(R + "08-promo-hint.webp", 786, 1704, "Touch 3: a hint in search"),
        img(R + "09-place-card.webp", 786, 1704, "Place page"),
      ],
    },
  ],
  deepDives: [],
};
