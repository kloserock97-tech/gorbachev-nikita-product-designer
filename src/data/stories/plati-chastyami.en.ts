/* v70: the "Pay in Parts" case, English. A concept: what a buy-now-pay-later service inside a banking
   app could look like a few years from now. Facts come from the project's research board and from a
   frame-by-frame teardown of screen recordings of the live app; screens exported from Figma
   (`BzIehGAJZ6BPyHDEFYffyA`). The word "concept" appears exactly once — as the kicker label. */
import type { CaseStory, CaseImage } from "../caseStory";

const img = (src: string, w: number, h: number, caption: string, kind = "screen"): CaseImage => ({ src, w, h, caption, kind });
const P = "cases/plati-chastyami/";

export const en: CaseStory = {
  id: "plati-chastyami",
  hero: {
    kicker: "Concept · Fintech · 2026",
    title: "Pay in Parts",
    tagline: "An instalment service that helps you pay it off instead of selling you one more purchase.",
    summary:
      "Instalments in the banking app live under «Credit», three levels deep, and never answer the one question that matters: how much do I owe in total. I took apart the live app frame by frame, found three things that appear in no description of it, and built this: the status moves to the bank's home screen, a payment moves to the day after payday in one tap, and the shop showcase disappears when the month is already overloaded.",
    facts: [
      ["Role", "Product designer, solo"],
      ["Platform", "iOS, banking app"],
      ["When", "2026"],
      ["Horizon", "a few years out"],
    ],
    tags: ["Fintech", "BNPL", "Mobile", "Personalisation"],
  },
  kpis: [
    { value: "5 → 1", label: "steps to «how much and when do I pay»" },
    { value: "3", label: "findings in the live app that no description mentions" },
    { value: "6", label: "faults in the current screen, each with its reason" },
    { value: "4", label: "hypotheses, each with the metric that settles it" },
  ],
  context: {
    lead: "The market tripled. Trust did not.",
    text:
      "Instalments stopped being a niche mechanic: the market grew two and a half to three times in a year and came under regulatory supervision. The service itself is large — four payments every two weeks, hundreds of thousands of shops, payment at the till. The ratings, though, describe a trust problem rather than a reach problem: 2.8 out of 5, and the complaints repeat — charges nobody understands, a penalty for one day late, refunds that go nowhere.\n\nThat sets the product frame. In a few years the winner is not the service that sells instalments best, but the one that helps you pay them off best. A bank has an advantage here that stand-alone services cannot copy: it sees the salary and the spending, so it can honestly say «you cannot afford this right now» or «let's move that payment to the day after payday». A stand-alone service physically cannot.",
    constraints: [
      { title: "No live screenshots exist", text: "The bank does not publish them. So the audit was built from screen recordings of the real app — which is exactly where the findings came from that the FAQ and the reviews do not have." },
      { title: "The wrong typeface", text: "The bank's own font is not available in Figma libraries, so the mock-up uses a close relative. The caveat sits in the file itself rather than hidden away." },
    ],
    myRole:
      "The teardown of the recordings, the audit, the evidence base, hypotheses with metrics, the personalisation logic, the new route and every screen along with the design system.",
  },
  research: {
    lead: "First I worked out how the service actually lives today. Then I looked for something to stand each decision on.",
    methods: [
      {
        kind: "Recording teardown",
        title: "What the live app shows",
        question: "Where does the service actually sit, and what happens when you tap it?",
        sample: "Two screen recordings of the real app, taken apart frame by frame",
        finding:
          "First: the service sits in the «Credit» tab, inside a «More offers» sheet, between refinancing and a secured loan. Second: tapping it leaves the bank for a browser-based shop map, with a system dialog asking where to continue. Third: it does not appear in the «All services» catalogue at all.",
      },
      {
        kind: "Audit",
        title: "Six faults in today's screen",
        question: "Why does the screen fail the main question?",
        sample: "The structure of the section from the FAQ, the web account and reviews",
        finding:
          "The service hides behind the word «Credit», although no credit agreement is signed. The screen is a list of orders, not a picture of what you owe. Falling behind happens silently and is punished loudly. Terms are learnt after, not before. The shop showcase competes with managing what you already took. And every order carries its own universe of dates.",
      },
      {
        kind: "Evidence base",
        title: "What holds each decision up",
        question: "What is known about extra steps, unexpected charges and proactive nudges?",
        sample: "Spool, Baymard, McKinsey, Accenture, Klarna, Bank of America",
        finding:
          "Removing one forced step before payment once brought $300M a year. 39% of abandoned carts are caused by unexpected charges — the number one reason. 71% of customers want an assistant inside their own bank's app, but 82% want to confirm every action it takes — hence a co-pilot rather than an autopilot.",
      },
      {
        kind: "Patterns",
        title: "How others solved it",
        question: "Do working mechanics for moving a payment and for aggregate status already exist?",
        sample: "Klarna, Zip, Afterpay, Monzo, Tabby, Revolut",
        finding:
          "Klarna extends the due date, Zip moves a payment by up to seven days, Monzo Flex collapses every instalment into one date a month and converts a past purchase retroactively. None of them can see the customer's payday calendar. The bank can.",
      },
    ],
    hypotheses: {
      intro: "Four hypotheses, each with the metric that settles it:",
      items: [
        { text: "An aggregate status on the home screen gives back the feeling of control.", verdict: "On-time rate, returns to the section", won: true },
        { text: "Moving a payment to payday turns missed payments into moved ones.", verdict: "Late rate, share of payments «saved»", won: true },
        { text: "Warning honestly about overload dents short-term volume but lifts retention.", verdict: "Cohort LTV, six-month retention", won: true },
        { text: "Any purchase made yesterday on the card can be split into parts.", verdict: "Usage frequency, share of retro instalments", won: true },
      ],
      measured: "They have to be tested together: moving a payment without the aggregate status merely hides the problem, and the status without the move shows the problem and offers nothing.",
    },
    funnel: {
      title: "The route to «how much and when do I pay». In red, the steps where people fall away.",
      steps: [
        { label: "Home screen", note: "The service is not here" },
        { label: "The «Credit» tab", note: "The word at the door adds a barrier and a stigma", drop: true },
        { label: "«More offers» sheet", note: "Between refinancing and a secured loan", drop: true },
        { label: "List of orders", note: "A list of purchases, not a picture of the debt" },
        { label: "Order → schedule", note: "The answer arrives on the fifth step" },
      ],
      note: "I have no per-step percentages — they are not public. This shows the depth of the route, nothing more.",
    },
  },
  decisions: {
    lead: "Three rules drove everything else: status before showcase, prevention before punishment, advice before autopilot.",
    items: [
      {
        id: "widget",
        title: "Status on the home screen, without entering the section",
        found: "The answer to «how much do I owe» sat five steps in, behind the word «Credit».",
        did: "A card on the bank's home screen: the next payment, the balance across every instalment and a move button right there. Below it, the two following payments as a line.",
        effect: "The status takes zero taps, the action takes one.",
        why: "Visibility of system state is the first rule of an interface. People who cannot see where they stand stop using the thing.",
        basis: "The case of the one removed step before payment; Klarna's aggregate-balance pattern.",
        image: img(P + "01-sbol-widget.webp", 786, 1704, "The bank's home screen: next payment, balance and a move button — no section to enter", "hero"),
      },
      {
        id: "safe",
        title: "«Safe for your budget» — the thing a stand-alone service cannot do",
        found: "The limit came from credit logic rather than from how much the person actually has left until payday.",
        did: "The service works out the free money until payday, taking normal spending and every instalment into account, and shows it as a ring and a figure.",
        effect: "There is now an answer to the question people ask themselves before buying.",
        why: "The bank sees the whole cash flow, not only its own charges. It is the one advantage a competitor cannot copy.",
        basis: "Safe-to-spend patterns at Up and Revolut; McKinsey on personalisation.",
      },
      {
        id: "move",
        title: "Move the payment to payday in one tap",
        found: "Falling behind happens silently, and the penalty and the phone call arrive the same day. There is no mechanic for moving a payment at all.",
        did: "When a payment lands in the window before payday, the service offers to move it to the day after and recalculates the schedule. The first move is free and leaves no mark on the credit history — and that is written on the confirmation screen.",
        effect: "A missed payment becomes a moved one — before it happens.",
        why: "You design the system so the mistake cannot happen, not so that it gets punished.",
        basis: "41% of instalment users have paid late at least once; Klarna's extended due date, Zip's seven-day move.",
        image: img(P + "03-move-confirm.webp", 786, 1704, "Confirming the move: the new date, the terms and the fact that the history stays clean"),
      },
      {
        id: "timeline",
        title: "One timeline instead of a list of orders",
        found: "Four payments per order with different start dates — three instalments make twelve dates. That is where «charged me for who knows what» comes from.",
        did: "Every instalment in one feed by date: date, shop, payment n of four, amount. Status labels carry the meaning: «before payday» is a warning, «closes this instalment» is motivation.",
        effect: "The link between a charge and a purchase became visible, and the load stopped living in someone's head.",
        why: "Working memory holds about seven items. It does not hold twelve dates.",
        basis: "Complaints from reviews; Monzo Flex collapsing every instalment into one rhythm.",
        image: img(P + "02-hub-gap.webp", 786, 3436, "The hub: status, the co-pilot's advice and one timeline of payments", "hero"),
      },
      {
        id: "pause",
        title: "The showcase disappears when the budget is overloaded",
        found: "The shop showcase competed for attention with managing instalments already taken. «Buy more» outranked «pay this off calmly».",
        did: "When the month's payment load passes a third of free income, the showcase and the offers hide, and a plan for unloading appears in their place.",
        effect: "At the moment things get tight, the service stops selling.",
        why: "Selling instalments to someone who is already struggling is a dark pattern. It is also bad business: the people who come back are the ones who did not get burnt.",
        basis: "Regulators classifying nudging BNPL patterns; LTV in BNPL comes from repeat users.",
        image: img(P + "06-hub-overload.webp", 786, 3100, "Budget overloaded: no showcase, an unloading plan in its place"),
      },
      {
        id: "numbers",
        title: "«Where the numbers come from» is a screen, not small print",
        found: "Complaints about hidden fees and refusals with no reason given. Terms were learnt after, not before.",
        did: "Every piece of advice carries a «how this was calculated» link to a screen that breaks it down: what was counted, where the spending figures came from, why this date.",
        effect: "The advice stopped being magic you have to take on faith.",
        why: "82% of people want to confirm every action an assistant takes. You can only confirm what you understand.",
        image: img(P + "07-where-numbers.webp", 786, 1704, "«Where the numbers come from»: what went into the calculation and why this date"),
      },
    ],
  },
  mistakes: {
    lead: "I drew the wrong version of the advice first.",
    items: [
      {
        title: "A calendar where one sentence was needed",
        decided: "At first the advice was explained with a month calendar: you could see when money arrives, when payments leave, and why the 28th is the worst possible point.",
        wrong: "The calendar proved the conclusion beautifully, but it asked the person to read it and draw the conclusion themselves. That decision gets made in a second, with one hand.",
        out: "The variant stayed in the file as a breakdown for anyone who wants to dig in, but it left the main flow.",
        changed: "Now I write the conclusion as one sentence first, then decide whether it needs a picture underneath. I used to do it the other way round.",
      },
    ],
  },
  results: {
    lead: "There are no post-release metrics here. It has what it is betting on, and what would measure it.",
    points: [
      "The route to «how much and when do I pay» goes from five steps to none: the status moved to the home screen",
      "A missed payment gets an alternative before it happens: moved to payday in one tap, free, and with no mark on the history",
      "The structure of the screen does not change with the situation — only one meaning slot does, so the habit stays intact",
      "The single structural exception is the vanishing showcase under overload: a deliberate refusal to sell",
    ],
    honesty:
      "No user research, no numbers after release. The audit rests on screen recordings of the live app and public reviews, and each decision on a study with a link. The typeface in the mock-up is not the brand's, because the brand's is not in the libraries — the caveat sits in the file itself.",
  },
  roadmap: [
    { kicker: "Validation", title: "What to measure first", text: "On-time rate and the share of moves instead of missed payments. If moves rise while late payments fall, the hypothesis holds." },
    { kicker: "Reach", title: "Retro instalments", text: "Any purchase made yesterday on the card can be split into parts. Instalments then become a property of the card rather than of a partner's till." },
    { kicker: "Risk", title: "The hardship path", text: "Three days before the risk: move it, then partial payment, then a plan. A debt collector is never the first step." },
  ],
  takeaways: [
    "Screen recordings of the live app gave me what no description had: the service parked in someone else's section, a tap that leaves for the browser, and an absence from the catalogue. Fifteen minutes of frame-by-frame was worth more than every FAQ summary.",
    "You look for a product's advantage where a competitor physically cannot have one. Here it is the payday calendar: moving a payment to payday is a mechanic a stand-alone BNPL service will never assemble.",
    "A beautiful proof and a fast decision are not the same thing. The calendar explained better; the single sentence worked.",
  ],
  quote: "In a few years the winner is not the one who sells instalments best, but the one who helps you pay them off best.",
  gallery: [
    {
      kind: "compare",
      title: "The same zone in two situations",
      before: img(P + "05-hub-ok.webp", 786, 2362, "All on track: the advice confirms that nothing needs doing"),
      after: img(P + "04-hub-moved.webp", 786, 3098, "Move applied: the schedule is recalculated, the next payment lands after payday"),
      labels: ["All on track", "Move applied"],
    },
    {
      kind: "bento",
      title: "The rejected variant and the calculation breakdown",
      images: [
        img(P + "08-variant-b-calendar.webp", 393, 705, "Variant B: a month calendar — it proved the point but had to be read", "detail"),
        img(P + "07-where-numbers.webp", 786, 1704, "The breakdown the «how this was calculated» link leads to", "detail"),
      ],
    },
  ],
  deepDives: [],
};
