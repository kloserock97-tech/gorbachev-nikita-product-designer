/* v70: the "Pay in Parts" case, English. A concept: what a buy-now-pay-later service inside a banking
   app could look like a few years from now. Facts come from the project's research board and from a
   frame-by-frame teardown of screen recordings of the live app; screens exported from Figma
   (`BzIehGAJZ6BPyHDEFYffyA`). The word "concept" appears exactly once — as the kicker label.
   v86: following the Russian version after Nikita's review: design metrics of the route on top (5 → 0),
   the hypotheses' product metrics moved to the Outcome, hypotheses no longer marked as confirmed, repetition removed.
   v88: metrics, Outcome and Next steps removed: nothing was measured for a concept.
   v89: shortened following the Russian version, by docs/prompts/case-copy-edit.md. */
import type { CaseStory, CaseImage } from "../caseStory";

const img = (src: string, w: number, h: number, caption: string, kind = "screen"): CaseImage => ({ src, w, h, caption, kind });
const P = "cases/plati-chastyami/";

export const en: CaseStory = {
  id: "plati-chastyami",
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
  context: {
    lead: "The market tripled. Trust did not.",
    text:
      "Instalments stopped being a niche mechanic: the market grew two and a half to three times in a year and came under regulatory supervision. Four payments every two weeks, hundreds of thousands of shops, payment at the till.\n\nYet the rating is 2.8 out of 5, and the same complaints keep coming back: charges nobody understands, a penalty for one day late, lost refunds. Reach is fine. Trust is the problem.\n\nA bank has an advantage a stand-alone instalment service lacks: it sees both the salary and the spending. So it can honestly say \"you can't afford this right now\" or move a payment to the day after payday.",
    constraints: [
      { title: "No live screenshots exist", text: "The bank doesn't publish them, so the audit was built from screen recordings." },
      { title: "The wrong typeface", text: "The bank's font isn't in Figma, so the mock-up uses a close relative. The caveat is in the file." },
    ],
  },
  research: {
    lead: "First I worked out how the service actually lives today. Then I looked for something to stand each decision on.",
    methods: [
      {
        kind: "Screen recording teardown",
        question: "Where does the service actually sit, and what happens when you tap it?",
        sample: "Two screen recordings of the real app, taken apart frame by frame",
        finding:
          "Three conclusions no description mentions: the service hides in a sheet of the \"Credit\" tab, tapping it leaves for the browser, and it is missing from the \"All services\" catalogue altogether.",
      },
      {
        kind: "Audit",
        question: "Why does the screen fail the main question: how much do I owe and when do I pay?",
        sample: "The structure of the section from the FAQ, the web account and reviews",
        finding:
          "Six faults: the word \"Credit\" with no credit agreement, a list of orders with no picture of the debt, silent lateness with a loud penalty, terms learnt after the fact, a storefront over debt management, and separate dates for every order.",
      },
      {
        kind: "Evidence base",
        question: "What is known about extra steps, unexpected charges and proactive nudges?",
        sample: "Spool, Baymard, McKinsey, Accenture, Klarna, Bank of America",
        finding:
          "Removing one forced step before payment once brought $300M a year. Unexpected charges cause 39% of abandoned carts. 71% of customers want an assistant in their bank's app, but 82% want to confirm every action it takes. So the assistant is a co-pilot: it suggests, and the person confirms.",
      },
      {
        kind: "Patterns",
        question: "Do working mechanics for moving a payment and for aggregate status already exist?",
        sample: "Klarna, Zip, Afterpay, Monzo, Tabby, Revolut",
        finding:
          "Klarna extends the due date, Zip moves a payment by up to seven days, Monzo Flex collapses every instalment into one monthly date and splits past purchases. None of them ties a payment to payday.",
      },
    ],
    hypotheses: {
      intro: "Four hypotheses behind the solution.",
      items: [
        { text: "An aggregate status on the home screen gives back the feeling of control.", verdict: "Status on home" },
        { text: "Moving a payment to payday turns missed payments into moved ones.", verdict: "Move to payday" },
        { text: "Warning honestly about overload dents short-term volume but lifts retention.", verdict: "Stop selling" },
        { text: "Any purchase made yesterday on the card can be split into parts.", verdict: "Retro instalments" },
      ],
      measured: "They have to be tested together: moving a payment without the status hides the problem, and the status without the move shows the problem and offers nothing.",
    },
    funnel: {
      title: "The route to \"how much and when do I pay\". In red, where people get lost.",
      steps: [
        { label: "Home screen", note: "The service is not here" },
        { label: "The \"Credit\" tab", note: "The word at the door is a barrier and a stigma", drop: true },
        { label: "\"More offers\" sheet", note: "Between refinancing and a secured loan", drop: true },
        { label: "List of orders", note: "Purchases, with no picture of the debt" },
        { label: "Order → schedule", note: "The answer on the fifth step" },
      ],
      note: "There are no per-step percentages: they aren't public.",
    },
  },
  decisions: {
    lead: "Three rules drove everything else: status before storefront, prevention before punishment, advice before autopilot.",
    items: [
      {
        id: "widget",
        title: "Status on the home screen",
        found: "The answer sat five steps in.",
        did: "A card on the bank's home screen: the next payment, the balance across every instalment and a move button, with the two following payments below.",
        effect: "The status takes zero taps, the action takes one.",
        why: "Visibility of system status: people who can't see where they stand stop using the thing.",
        basis: "The case of the one removed step before payment; Klarna.",
        image: img(P + "01-sbol-widget.webp", 786, 1704, "The bank's home screen", "hero"),
      },
      {
        id: "safe",
        title: "\"Safe for your budget\"",
        found: "The limit followed credit logic and ignored how much was left until payday.",
        did: "The service works out the free money until payday, taking normal spending and every instalment into account, and shows it as a ring and a figure.",
        effect: "There is now an answer to the question people ask themselves before buying.",
        basis: "Safe-to-spend at Up and Revolut. McKinsey on personalisation.",
      },
      {
        id: "move",
        title: "Move the payment to payday in one tap",
        found: "Lateness came silently, and the penalty and the call arrived the same day.",
        did: "When a payment lands in the window before payday, the service offers to move it to the day after and recalculates the schedule. The first move is free and leaves no mark on the credit history, and the confirmation screen says so.",
        effect: "A payment that would have been missed gets moved ahead of time.",
        why: "Prevent the mistake, so there is nothing to punish.",
        basis: "41% of instalment users have paid late at least once; Klarna, Zip.",
        image: img(P + "03-move-confirm.webp", 786, 1704, "Confirming the move"),
      },
      {
        id: "timeline",
        title: "All payments on one timeline",
        found: "Three instalments make twelve dates, hence \"charged me for who knows what\".",
        did: "Every payment in one feed: date, shop, payment n of four, amount. Labels carry the meaning: \"before payday\" is a warning, \"closes this instalment\" is a small win.",
        effect: "You can see which purchase a charge is for, and nobody has to keep the dates in their head.",
        why: "Working memory holds about seven items.",
        basis: "Complaints from reviews; Monzo Flex.",
        image: img(P + "02-hub-gap.webp", 786, 3436, "The hub: status, advice and the payment timeline", "hero"),
      },
      {
        id: "pause",
        title: "The storefront disappears when the budget is overloaded",
        found: "The storefront competed for attention with managing the debt.",
        did: "When the month's payments pass a third of free income, the storefront and offers hide, and an unloading plan takes their place.",
        effect: "When things get tight, the service stops selling.",
        why: "Selling instalments to someone already struggling is a dark pattern. It's also bad business: LTV in BNPL comes from repeat users.",
        basis: "The regulator's stance on nudging BNPL patterns.",
        image: img(P + "06-hub-overload.webp", 786, 3100, "Overload: an unloading plan in place of the storefront"),
      },
      {
        id: "numbers",
        title: "\"Where the numbers come from\" gets its own screen",
        found: "Complaints about hidden fees and refusals with no reason.",
        did: "Every piece of advice links to \"how this was calculated\": what was counted, where the spending came from, why this date.",
        effect: "The advice stopped being magic you take on faith.",
        why: "You can only confirm an assistant's action when you understand where it came from.",
        image: img(P + "07-where-numbers.webp", 786, 1704, "The \"Where the numbers come from\" screen"),
      },
    ],
  },
  mistakes: {
    lead: "I drew the wrong version of the advice first.",
    items: [
      {
        title: "A calendar where one sentence was needed",
        decided: "Explain the advice with a month calendar: when money arrives, when payments leave, and why the 28th is the worst point.",
        wrong: "The calendar proved the conclusion beautifully but made the person draw it themselves. That decision gets made in a second, with one hand, standing in a queue.",
        out: "The variant stayed in the file as a breakdown for anyone who wants to dig in, and left the main flow.",
        changed: "Now I write the conclusion as one sentence first, then decide whether it needs a picture.",
      },
    ],
  },
  takeaways: [
    "Fifteen minutes of going through screen recordings frame by frame was worth more than every FAQ summary.",
    "Look for a product's advantage where a competitor physically can't have one. Here it's the payday calendar.",
  ],
  quote: "In a few years the winner will be whoever helps you pay instalments off best. Selling them best won't be enough.",
  gallery: [
    {
      kind: "compare",
      title: "One zone in two situations",
      before: img(P + "05-hub-ok.webp", 786, 2362, "All on track"),
      after: img(P + "04-hub-moved.webp", 786, 3098, "Move applied, schedule recalculated"),
      labels: ["All on track", "Move applied"],
    },
    {
      kind: "bento",
      title: "The rejected variant and the calculation breakdown",
      images: [
        img(P + "08-variant-b-calendar.webp", 393, 705, "Variant B: a month calendar", "detail"),
        img(P + "07-where-numbers.webp", 786, 1704, "The calculation breakdown", "detail"),
      ],
    },
  ],
  deepDives: [],
};
