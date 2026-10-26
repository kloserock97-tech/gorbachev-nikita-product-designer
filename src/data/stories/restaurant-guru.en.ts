/* v70: the "Restaurant Guru" case, English. A concept: redesign of the home screen of a restaurant
   discovery app for iOS, plus a guide that finds a place from a sentence. Facts and figures come from
   the research board behind the project (27 sources); screens exported from Figma (`fHFPiy79mJmlrdEeVGeWY3`).
   The word "concept" appears exactly once — as the kicker label.
   26.10: moved to the GRIF template, mirroring the Russian version (see the comment there). */
import type { CaseStory, CaseImage } from "../caseStory";

const img = (src: string, w: number, h: number, caption: string, kind = "screen"): CaseImage => ({ src, w, h, caption, kind });
const R = "cases/restaurant-guru/";
const L = "cases/restaurant-guru/live2/";

export const en: CaseStory = {
  id: "restaurant-guru",
  compact: true,
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
  /* 26.10: goals come from the former context text (the screen's three jobs) and the closed-places decision */
  context: {
    lead: "",
    goals: [
      "Someone who knows the place finds it by name.",
      "Someone with no idea chooses from several places, not from one card.",
      "Someone ready to describe the evening in words sees right away where to do it.",
      "The best slots on the screen go to places you can walk into right now.",
    ],
    art: { goals: ["search", "shelf", "guide", "open"], constraints: ["sources", "brand"] },
    constraints: [
      { title: "No users of its own", text: "There were no interviews and no testing, so every decision leans on a published study with a number and a link." },
      { title: "The brand already exists", text: "The brand's deep red can only go on actions. People read red as an error, so it can't be spread across the screen." },
    ],
  },
  research: {
    lead: "",
    methods: [
      {
        kind: "Audit",
        question: "What on the current screen stops a person from reaching a restaurant?",
        sample: "Heuristic walk-through of the live screen",
        finding:
          "Six zones: the guide out of thumb reach, search narrowed by one example, category icons with no labels, one restaurant per screen, closed places in the premium slots, and two unnamed icons leading to the same function.",
        insights: [
          { id: "F1", text: "A feature the product is pushing cannot sit in a blind spot, and the guide hid behind an icon in the top corner." },
        ],
      },
      {
        kind: "Evidence base",
        question: "What do I stand on when I have no numbers of my own?",
        sample: "27 sources: McKinsey, Baymard, NN/g, Yelp, Tripadvisor",
        finding:
          "Hidden navigation slows people by up to 39% and cuts discoverability by 20% (NN/g). With mediocre lists and filters 67–90% abandon the task, against 17–33% where they are done well (Baymard). 75% of phone interactions happen with a thumb, so the important things belong in the lower half of the screen.",
        insights: [
          { id: "F2", text: "People need to see several places at once to have something to choose from." },
          { id: "F3", text: "A ready-made intent in one tap beats an empty search field." },
        ],
      },
      {
        kind: "Benchmark",
        question: "Is an icon in the corner enough for the guide, or does it need its own tab?",
        sample: "Yelp, Google Maps, Tripadvisor",
        finding:
          "After a 400% rise in leads Yelp moved its assistant into its own bottom tab. Google put \"Ask Maps\" right under the search field. At Tripadvisor, users of AI features bring two to three times the revenue.",
      },
      {
        kind: "Study",
        question: "Does the word \"AI\" help sell the feature?",
        sample: "Cicek, Gursoy & Lu, Journal of Hospitality Marketing & Management, 2024",
        finding:
          "With the product held identical, mentioning AI lowered intention to use it in every test, because emotional trust drops. The study was run on hospitality, which is exactly this industry.",
        insights: [
          { id: "F4", text: "The word \"AI\" in a feature's name lowers people's wish to use it." },
        ],
      },
    ],
  },
  decisions: {
    lead: "",
    items: [
      {
        id: "entry",
        insight: "F1",
        title: "The guide got a name and a place in the tab bar",
        found: "If the guide sits where a thumb reaches and the feed shows an example query, people find it without a hint. Before, a \"✦\" icon in the header and a \"✦+\" in the tab bar led to the same place and explained nothing.",
        did: "Two connected entries under one name: a line in the feed with a live example query, and a raised \"Guide\" tab in the centre of the tab bar. The header icon is gone. A thumb reaches the bottom bar without shifting your grip: 75% of phone interactions happen with a thumb.",
        image: img(R + "01-home.webp", 786, 1704, "Home screen", "hero"),
      },
      {
        id: "density",
        insight: "F2",
        title: "Three or four places in view, all of them open",
        found: "If several open places are in view, there is something to choose from. Before, a huge card and the \"#59 of 2524\" line left one restaurant in view, and at six in the evening \"Pubs and bars\" led with a bar closed until four.",
        did: "A \"For you\" shelf with two cards in frame and a compact \"Open now nearby\" list: photo on the left, opening hours and distance on the right. Location and time of day sit in the header and drive everything below. The ranking line moved into the place page. Six options sell better than twenty-four: 30% against 3% in Iyengar & Lepper.",
        image: img(R + "02-home-scrolled.webp", 786, 1704, "Collections and a compact list"),
      },
      {
        id: "chips",
        insight: "F3",
        title: "Categories are labelled with words",
        found: "If a category is a labelled chip, people pick it in one tap. Before, the category circles had no labels, the outer ones were cut off, and \"Filters\" sat where there was nothing to filter yet.",
        did: "A row of labelled chips (\"For you\", \"Dinner\", \"Bars\", \"Coffee\") plus a separate filters button. The order of the chips follows the time of day. Filters moved into the results, where there is something to filter: with well-made lists and filters 17–33% abandon the task, against 67–90% (Baymard).",
      },
      {
        id: "guide",
        title: "The guide answers with a single place card",
        found: "A message thread has nothing to fill it: one question, one answer, and the person leaves for the restaurant. A chat screen promises a conversation that will not happen.",
        did: "Three states: invitation, searching, answer. While it searches, the screen shows an object and the request said back, with no spinner. The answer is a place card with a photo, the facts and a booking button. Suggested answers you can pick without typing come from a teardown of the Drinkit interface.",
        image: img(R + "05-guide-answer.webp", 786, 1704, "The guide's answer", "hero"),
      },
      {
        id: "noai",
        insight: "F4",
        title: "The interface never says \"AI\"",
        found: "If the name describes a role rather than the technology, people use the feature more willingly. \"AI\" on a button promises technology, and the person wants dinner.",
        did: "The tab is called \"Guide\", the heading promises an outcome, and the mark is a compass. That's how Google (\"Help me write\") and Spotify (\"DJ\") name their features. Transparency stays: the guide lists what it's looking through and shows what the answer rests on.",
      },
    ],
  },
  /* 26.10: before — a Restaurant Advisor screenshot from the board (Figma 191:15551), after — 01-home.webp */
  compare: {
    title: "Home screen: before and after",
    lead: "On the left, the app's home screen before the redesign; on the right, the new one. Hover a note to see its spot on the screen.",
    before: {
      title: "Before",
      image: img(R + "compare-before.webp", 786, 1704, "Restaurant Advisor home screen before the redesign: a \"Quick bite\" search, category icons, one big restaurant card"),
      notes: [
        { id: "a-loc", kind: "about", side: "left", text: "Location", extra: "A city or the current spot", rects: [[0.03, 0.072, 0.6, 0.038]] },
        { id: "a-search", kind: "about", side: "left", text: "Search", extra: "A search field for places", rects: [[0.036, 0.139, 0.923, 0.067]] },
        { id: "a-cats", kind: "about", side: "left", text: "Categories", extra: "Restaurants, bars, cafés and other kinds of place", rects: [[0.0, 0.278, 1.0, 0.095]] },
        { id: "a-feed", kind: "about", side: "right", text: "Collections", extra: "\"Restaurants\", \"Pubs and bars\" and other shelves", rects: [[0.036, 0.41, 0.928, 0.33]] },
        { id: "m-ai", kind: "mine", side: "right", text: "The way into the guide is an \"AI ✦\" icon in the corner, out of thumb reach", rects: [[0.79, 0.072, 0.16, 0.035]] },
        { id: "m-search", kind: "mine", side: "left", text: "Search is narrowed by one example: \"Quick bite\"", rects: [[0.036, 0.139, 0.923, 0.067]] },
        { id: "m-cats", kind: "mine", side: "left", text: "Category icons have no labels, the outer ones are cut off, and \"Filters\" sits where there is nothing to filter", rects: [[0.0, 0.278, 1.0, 0.095], [0.716, 0.239, 0.236, 0.028]] },
        { id: "m-density", kind: "mine", side: "left", text: "One huge card and the \"#59 of 2524\" line: one restaurant in view", rects: [[0.036, 0.456, 0.928, 0.21], [0.048, 0.711, 0.7, 0.024]] },
        { id: "m-time", kind: "mine", side: "right", text: "At six in the evening \"Pubs and bars\" leads with a bar closed until 16:00", rects: [[0.06, 0.853, 0.35, 0.034]] },
        { id: "m-tabs", kind: "mine", side: "right", text: "A tab bar of five unlabelled icons, with a puzzling \"✦+\" in the middle", rects: [[0.048, 0.922, 0.904, 0.067]] },
      ],
    },
    after: {
      title: "After",
      image: img(R + "01-home.webp", 786, 1704, "The new home screen: collection of the week, labelled chips, the guide line and the \"For you\" shelf"),
      notes: [
        { id: "m-ai", kind: "mine", side: "left", text: "A guide line in the feed with a live example query", rects: [[0.053, 0.617, 0.894, 0.067]] },
        { id: "m-search", kind: "mine", side: "right", text: "The field says \"Place, cuisine or dish\"", rects: [[0.053, 0.131, 0.894, 0.058]] },
        { id: "m-cats", kind: "mine", side: "left", text: "Labelled chips (\"For you\", \"Dinner\", \"Bars\", \"Coffee\") and a separate filters button", rects: [[0.041, 0.539, 0.93, 0.048]] },
        { id: "m-density", kind: "mine", side: "left", text: "The \"For you\" shelf: two cards in frame, the ranking line moved into the place page", rects: [[0.053, 0.794, 0.947, 0.106]] },
        { id: "m-time", kind: "mine", side: "right", text: "City and time in the header drive everything below", rects: [[0.036, 0.067, 0.615, 0.044]] },
        { id: "m-tabs", kind: "mine", side: "right", text: "Five labelled tabs, with the Guide raised in the middle", rects: [[0.048, 0.909, 0.904, 0.079]] },
      ],
    },
  },
  /* 26.10: the prototype is rebuilt like GRIF's — final Figma screens via tools/f2h (src/ui/live/guru2), two flows as tabs, see the Russian version */
  prototypes: [
    {
      tab: "The guide picks an evening",
      title: "Find somewhere to go tonight",
      lead: "You're looking for a quiet place for two and go from the home screen through the guide to the place card.",
      live: "guru2:guide",
      device: "phone",
      steps: [
        { image: img(L + "s-home.webp", 786, 1704, "Home screen"), action: "Open the Guide in the middle of the tab bar", why: "The Guide tab sits raised above the others, so you spot it right away." },
        { image: img(L + "s-invite.webp", 786, 1704, "Guide — invitation"), action: "Pick \"quiet, for two\"", why: "The chips under the field are ready-made requests, so there's nothing to type." },
        { image: img(L + "s-thinking.webp", 786, 1704, "Guide — picking"), action: "The guide is picking a place", why: "A couple of seconds of waiting. No spinner: the guide mark and your request said back to you." },
        { image: img(L + "s-answer.webp", 786, 1704, "Guide — answer"), action: "Open \"Ronin\"", why: "The guide suggests one place. The card already has a photo, the key facts and a booking button." },
        { image: img(L + "s-place.webp", 786, 1704, "Place card"), action: "Done: everything for the decision on one screen", why: "Facts, table options and a 19:30 booking side by side. All that's left is leaving the house." },
      ],
    },
    {
      tab: "Meeting the guide",
      title: "Learn about the guide from the home screen",
      lead: "The guide shows up in the feed gradually: three touches, and each can be closed.",
      live: "guru2:launch",
      device: "phone",
      steps: [
        { image: img(L + "s-promoSheet.webp", 786, 1704, "Touch 1 — guide announcement"), action: "Tap \"Not now\"", why: "The first touch is a card over the home screen. Declining is a text link, not a second button." },
        { image: img(L + "s-promoBanner.webp", 786, 1704, "Touch 2 — banner in the feed"), action: "Close the banner", why: "The second touch is a feed banner in one purple fill. There's no request field next to it: it's the same action." },
        { image: img(L + "s-promoHint.webp", 786, 1704, "Touch 3 — contextual hint"), action: "Tap \"Didn't find it? Ask the guide\"", why: "The third touch is a hint above the tab bar that points at the Guide tab." },
        { image: img(L + "s-invite.webp", 786, 1704, "Guide — invitation"), action: "Done: the guide opens with an invitation", why: "Ready-made requests sit under the field, so you can start without typing." },
      ],
    },
  ],
  takeaways: [],
  gallery: [],
  deepDives: [],
};
