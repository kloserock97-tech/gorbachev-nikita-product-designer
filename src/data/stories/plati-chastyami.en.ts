/* v70: the "Pay in Parts" case, English. A concept: what a buy-now-pay-later service inside a banking
   app could look like a few years from now. Facts come from the project's research board and from a
   frame-by-frame teardown of screen recordings of the live app; screens exported from Figma
   (`BzIehGAJZ6BPyHDEFYffyA`). The word "concept" appears exactly once — as the kicker label.
   v88: metrics, Outcome and Next steps removed: nothing was measured for a concept. 23.10: AI-writing patterns removed.
   26.10: moved to the GRIF template (compact), mirroring the Russian version: context paragraphs, Mistakes, takeaways,
   quote, More screens, the funnel and the separate hypotheses list are gone. Goals come only from existing text,
   findings F1–F5 from the methods, hypotheses became each decision's "Hypothesis". Six decisions merged into four.
   No validation: the concept wasn't tested. Before/After — the "02 · Before → after" section in Figma. */
import type { CaseStory, CaseImage } from "../caseStory";

const img = (src: string, w: number, h: number, caption: string, kind = "screen"): CaseImage => ({ src, w, h, caption, kind });
const P = "cases/plati-chastyami/";

export const en: CaseStory = {
  id: "plati-chastyami",
  compact: true,
  hero: {
    kicker: "Concept · Fintech · 2026",
    title: "Pay in Parts",
    tagline: "Instalments inside a banking app: the debt status on the home screen, a payment moved to payday, and selling stops when the budget is overloaded.",
    summary:
      "I took apart screen recordings of the live app frame by frame, ran an audit, gathered an evidence base and hypotheses, and worked out the personalisation logic, a new route and every screen along with the design system.",
    facts: [
      ["Role", "Product designer, solo"],
      ["Platform", "iOS, banking app"],
      ["When", "2026"],
      ["Horizon", "a few years out"],
    ],
    tags: ["Fintech", "BNPL", "Mobile", "Personalisation"],
  },
  kpis: [],
  /* 26.10: context as pictures inside "In brief" (ui/contextArt/plati-chastyami.ts), see the Russian version */
  context: {
    lead: "",
    goals: [
      "How much to pay and when is visible right on the bank's home screen.",
      "The service warns about a payment you can't afford before any penalty and moves it to payday.",
      "When the budget is overloaded, the service stops selling.",
      "Advice can be checked, and the person presses the button.",
    ],
    art: { goals: ["home", "move", "pause", "why"], constraints: ["rec", "font"] },
    constraints: [
      { title: "No live screenshots exist", text: "The bank doesn't publish them, so the audit was built from screen recordings." },
      { title: "The wrong typeface", text: "The bank's font isn't in Figma, so the mock-up uses a close relative. The caveat is in the file." },
    ],
  },
  research: {
    lead: "",
    methods: [
      {
        kind: "Screen recording teardown",
        question: "Where does the service actually sit, and what happens when you tap it?",
        sample: "Two screen recordings of the real app, taken apart frame by frame",
        finding: "Three conclusions no description mentions.",
        insights: [
          { id: "F1", text: "The service hides in a sheet of the \"Credit\" tab, tapping it leaves for the browser, and it is missing from the \"All services\" catalogue altogether. The answer to \"how much and when do I pay\" sits five steps in." },
        ],
      },
      {
        kind: "Audit",
        question: "Why does the screen fail the main question: how much do I owe and when do I pay?",
        sample: "The structure of the section from the FAQ, the web account and reviews",
        finding:
          "Six faults: the word \"Credit\" with no credit agreement, a list of orders that never shows the total debt, silent lateness with a loud penalty, terms you only learn after buying, a storefront over debt management, and separate dates for every order.",
        insights: [
          { id: "F2", text: "Three instalments make twelve dates, and the total debt is nowhere to be seen. Hence complaints like \"charged me for who knows what\"." },
          { id: "F3", text: "Lateness comes silently, and the penalty and the call arrive the same day. A penalty for one day late is one of the most common complaints in reviews." },
          { id: "F4", text: "The storefront competes for attention with managing the debt." },
        ],
      },
      {
        kind: "Evidence base",
        question: "What is known about extra steps, unexpected charges and proactive nudges?",
        sample: "Spool, Baymard, McKinsey, Accenture, Klarna, Bank of America",
        finding:
          "Removing one forced step before payment once brought $300M a year. Unexpected charges cause 39% of abandoned carts.",
        insights: [
          { id: "F5", text: "71% of customers want an assistant in their bank's app, but 82% want to confirm every action it takes. So the assistant in the concept only suggests, and the person confirms." },
        ],
      },
      {
        kind: "Patterns",
        question: "Do working mechanics for moving a payment and for aggregate status already exist?",
        sample: "Klarna, Zip, Afterpay, Monzo, Tabby, Revolut",
        finding:
          "Klarna extends the due date, Zip moves a payment by up to seven days, Monzo Flex collapses every instalment into one monthly date and splits past purchases. None of them ties a payment to payday.",
      },
    ],
  },
  decisions: {
    lead: "",
    items: [
      {
        id: "widget",
        insight: "F2",
        title: "The debt in sight: status on the home screen and every payment on one timeline",
        found: "If the total debt status is on the home screen, the feeling of control comes back.",
        did: "A card on the bank's home screen: the next payment, the balance across every instalment and a move button, with the two following payments below. Inside the service, a feed sorted by date: date, shop, payment n of four, amount. Labels carry the meaning: \"before payday\" is a warning, \"closes this instalment\" is a small win.",
        image: img(P + "01-sbol-widget.webp", 786, 1704, "The bank's home screen", "hero"),
      },
      {
        id: "move",
        insight: "F3",
        title: "Move the payment to payday in one tap",
        found: "If a payment moves to payday, a missed payment becomes a moved one.",
        did: "When a payment lands in the window before payday, the service offers to move it to the day after and recalculates the schedule. The first move is free and leaves no mark on the credit history, and the confirmation screen says so. The advice is one sentence: the variant where I explained it with a month calendar made people draw the conclusion themselves and left the main flow.",
        image: img(P + "03-move-confirm.webp", 786, 1704, "Confirming the move"),
      },
      {
        id: "pause",
        insight: "F4",
        title: "The storefront disappears when the budget is overloaded",
        found: "If the service warns honestly about overload, short-term volume dips but retention grows.",
        did: "When the month's payments pass a third of free income, the storefront and offers hide, and an unloading plan takes their place. Selling instalments to someone already struggling is a dark pattern, and it's bad business too: LTV in BNPL comes from repeat users.",
        image: img(P + "06-hub-overload.webp", 786, 3100, "Overload: an unloading plan in place of the storefront"),
      },
      {
        id: "numbers",
        insight: "F5",
        title: "\"Safe for your budget\" and where that number comes from",
        found: "If people see what the advice is built on, they can check it before confirming.",
        did: "The service works out the free money until payday, taking normal spending and every instalment into account, and shows it as a ring and a figure. Every piece of advice links to \"how this was calculated\": what was counted, where the spending came from, why this date.",
        image: img(P + "07-where-numbers.webp", 786, 1704, "The \"Where the numbers come from\" screen"),
      },
    ],
  },
  /* 26.10: "before" — a frame of the live app recording from the Figma section "02 · Before → after" (363:6059) */
  compare: {
    title: "The \"Credit\" tab and the home screen",
    lead: "On the left, the bank's live app: the tab where instalments sit today. On the right, the concept. Hover a note to see its spot on the screen.",
    before: {
      title: "The live app",
      image: img(P + "compare-before.webp", 680, 1218, "The \"Credit\" tab in the bank's live app: credit potential and a storefront of loans"),
      notes: [
        { id: "a-search", kind: "about", side: "left", text: "Search and catalogue", extra: "Search on top and the services catalogue icon", rects: [[0.168, 0.066, 0.809, 0.049]] },
        { id: "a-cards", kind: "about", side: "left", text: "Credit potential", extra: "The bank's offers: any purpose, a card, a mortgage, a car loan", rects: [[0.024, 0.255, 0.947, 0.616]] },
        { id: "a-tabs", kind: "about", side: "right", text: "Bottom navigation", extra: "Home, Savings, For life, Payments, Credit", rects: [[0, 0.928, 1, 0.072]] },
        { id: "m-word", kind: "mine", side: "left", text: "People look for instalments under \"Credit\", though there is no credit agreement", rects: [[0.041, 0.184, 0.253, 0.038], [0.832, 0.933, 0.147, 0.062]] },
        { id: "m-hidden", kind: "mine", side: "left", text: "The screen shows a storefront of loans, and the service hides in the \"More offers\" sheet, between refinancing and a secured loan", rects: [[0.024, 0.255, 0.947, 0.616]] },
        { id: "m-catalog", kind: "mine", side: "right", text: "Pay in Parts is missing from the \"All services\" catalogue altogether", rects: [[0.918, 0.074, 0.059, 0.034]] },
        { id: "m-home", kind: "mine", side: "right", text: "The service isn't on the home screen: \"how much and when\" is five steps in", rects: [[0.041, 0.933, 0.13, 0.062]] },
      ],
    },
    after: {
      title: "The concept",
      image: img(P + "01-sbol-widget.webp", 786, 1704, "The bank's home screen with the Pay in Parts card"),
      notes: [
        { id: "m-word", kind: "mine", side: "left", text: "The service is a Pay in Parts card right on the home screen, no \"Credit\" tab needed", rects: [[0.041, 0.502, 0.918, 0.043]] },
        { id: "m-home", kind: "mine", side: "left", text: "\"How much and when\" is answered at once: the next payment of 3,100 ₽ and 12,450 ₽ left across all", rects: [[0.088, 0.59, 0.824, 0.082]] },
        { id: "m-hidden", kind: "mine", side: "right", text: "In place of the storefront: the date and a move button, \"Better after payday\", free", rects: [[0.088, 0.681, 0.824, 0.065]] },
        { id: "m-next", kind: "mine", side: "right", text: "The two following payments below", rects: [[0.082, 0.769, 0.571, 0.041]] },
      ],
    },
  },
  /* 26.10: prototype on the Figma screens one to one, like GRIF (src/ui/live/plati2, pipeline tools/f2h).
     Two tabs: moving a payment to payday and "Where the numbers come from". Step images are fallbacks */
  prototypes: [
    {
      tab: "Move to payday",
      title: "Move a payment to payday",
      lead: "A payment falls in the days before payday, and you move it right from the bank's home screen.",
      live: "plati2:move",
      device: "phone",
      steps: [
        { image: img("cases/plati-chastyami/live2/s-home.webp", 690, 1498, "The bank's home screen with the instalments widget"), action: "Open your instalments from the home screen", why: "The instalment card sits right on the bank's home screen, so there is no section to hunt for." },
        { image: img("cases/plati-chastyami/live2/s-hub.webp", 690, 1498, "The hub: what is left to pay and the next payment explained"), action: "Tap “Move to 6 Sep”", why: "The next payment falls in the days before payday, so the service offers to shift it." },
        { image: img("cases/plati-chastyami/live2/s-confirm.webp", 690, 1498, "The “Check the new schedule” sheet"), action: "Check the dates and tap “Move payment”", why: "Only this payment moves — 3,100 ₽; the other purchases and their dates stay as they are." },
        { image: img("cases/plati-chastyami/live2/s-moved.webp", 690, 1498, "The move is applied, the payment is on 6 September"), action: "Done: the payment is on 6 September and can still be undone", why: "The money leaves after payday, so there is no late payment and no penalty. The move can be undone until 5 September." },
      ],
    },
    {
      tab: "Where the numbers come from",
      title: "Check where the numbers come from",
      lead: "The advice can be checked: there is a calculation based on your own money behind it.",
      live: "plati2:why",
      device: "phone",
      steps: [
        { image: img("cases/plati-chastyami/live2/s-home.webp", 690, 1498, "The bank's home screen with the instalments widget"), action: "Open your instalments from the home screen", why: "The way in is the same: the card on the bank's home screen." },
        { image: img("cases/plati-chastyami/live2/s-hub.webp", 690, 1498, "The hub with the next payment explained"), action: "Tap “Where the numbers come from”", why: "The link sits right under the advice: you can look at the calculation before agreeing." },
        { image: img("cases/plati-chastyami/live2/s-why.webp", 690, 1498, "The “Where the numbers come from” sheet: the budget until payday"), action: "Done: the calculation is in front of you", why: "The service counts income and spending over the last three months and shows what will be left until payday." },
      ],
    },
  ],
  /* 26.10: Mistakes, takeaways, quote and More screens removed, following the GRIF template */
  takeaways: [],
  gallery: [],
  deepDives: [],
};
