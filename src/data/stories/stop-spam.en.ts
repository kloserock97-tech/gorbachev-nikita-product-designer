/* v41: рассказ кейса «Стоп-спам» на двух языках. Источник — Main cases/Stop-spam.html и EN/Stop-spam.en.html.
   Воронка показана без процентов по шагам: в кейсе есть только итог (+25 % / −30 %), шаговых цифр нет.
   v56: тексты переписаны простым языком, факты и цифры те же.
   v86: вслед за русской версией по ревью Никиты: повторы вычищены, метрики с источником в «Результате»,
   места с пометкой [TO FILL] Никита заполнит сам или уберёт.
   v89: сокращён вслед за русской версией по docs/prompts/case-copy-edit.md. */
import type { CaseStory, CaseImage } from "../caseStory";

const img = (src: string, w: number, h: number, caption: string, kind = "screen"): CaseImage => ({ src, w, h, caption, kind });
const F = "cases/figma/";

export const en: CaseStory = {
  id: "stop-spam",
  hero: {
    kicker: "Anti-spam app · iOS · Android · 2022",
    title: "Stop Spam",
    tagline: "I turned the permission requests, the most boring screen in the app, into a protection meter that grows with every step.",
    summary:
      "I rebuilt the anti-spam onboarding for iOS and Android: found in the funnel where people gave up on the setup, came up with the protection level and blocked-spam counters, and compared two versions with users.",
    facts: [
      ["Role", "Product designer, mobile (JustDev)"],
      ["Team", "Product and analytics, iOS and Android engineering, marketing"],
      ["Timeline", "2021–2022"],
      ["Platform", "iOS and Android"],
    ],
    tags: ["Mobile", "Onboarding", "Gamification", "B2C"],
  },
  /* product metrics after release and a design metric from the test */
  kpis: [
    { value: "+25%", label: "people reach working protection" },
    { value: "−30%", label: "refusals when the app asks for access" },
    { value: "4.5 of 5", label: "setup clarity in a test with people" },
  ],
  context: {
    lead: "Between install and protection sat a screen nobody likes.",
    text:
      "Without access to calls and messages an anti-spam app is useless: it cannot see that an unknown number is calling. So a person downloads spam protection and ends up without it.\n\nAccess is given through a string of system windows: calls, messages, the SMS filter. Rewording the Allow button would not have helped.",
  },
  research: {
    lead: "First I found where people leave. Then I compared two versions of the setup.",
    methods: [
      {
        kind: "Funnel breakdown",
        question: "Which step between install and working protection loses the most people?",
        sample: "The onboarding funnel, together with product and analytics",
        finding:
          "The system windows: people got nothing back for the access they had given.",
      },
      {
        kind: "Engineering interviews",
        question: "Which system windows can we show, in what order, and what can we show before them?",
        sample: "iOS and Android developers, before mock-ups",
        finding: "The system window cannot be changed, but the screen before it can.",
      },
      {
        kind: "Store promise check",
        question: "Does the first screen back up what the app's store page says?",
        sample: "Marketing and the app's store listing",
        finding: "The store promises to block spam, and the first screen asked for access straight away and gave nothing back.",
      },
      {
        kind: "Two versions compared",
        question: "Which version gets more people to working protection?",
        sample: "Two onboarding versions with users, then metrics after release",
        finding: "The version with the meter and the counters won by a clear margin.",
      },
    ],
    funnel: {
      title: "The path from install to working protection. Red marks where people left.",
      steps: [
        { label: "Install from the store", note: "The promise: we block spam" },
        { label: "First screen", note: "Asked for access straight away" },
        { label: "System window: calls", note: "Dry wording, the hand reaches for \"Don't Allow\"", drop: true },
        { label: "System window: messages and SMS filter", note: "No idea how many steps are left", drop: true },
        { label: "Protection switched on", note: "Not everyone got here" },
      ],
      note: "There are no per-step percentages, only the overall result after the update.",
    },
    hypotheses: {
      intro: "Version 1: system windows back to back with short captions. Version 2: a protection meter, counters and an explanation before each request.",
      items: [
        { text: "I want to know why the app needs my calls before I agree.", verdict: "Version 2", won: true },
        { text: "I want to see that the access already does something. Right now it feels taken on credit.", verdict: "Version 2", won: true },
        { text: "I want to know how many steps are left until protection is ready.", verdict: "Version 2", won: true },
      ],
      measured: "Whether a person reached working protection, at which system window people left, and how long the setup took.",
    },
  },
  decisions: {
    lead: "Every permission goes through the same three steps: explain, show the benefit, ask for access.",
    items: [
      {
        id: "level",
        title: "The protection level meter",
        found: "The setup felt endless.",
        did: "A meter that works like a battery indicator: every permission raises the level and brings full protection closer.",
        effect: "You can see both the end of the road and the point of every step.",
        why: "Visibility of system status, after Nielsen.",
        basis: "Hypothesis 03.",
        image: img("cases/stop-spam/01.webp", 1300, 2642, "Protection level at 90% and counters for 30 days", "device"),
      },
      {
        id: "counters",
        title: "Blocked-spam counters",
        found: "Access was asked for up front, and the benefit came later.",
        did: "A counter next to each permission: this is how many calls and messages we will block. It is an estimate from the app's own data, and we do not present it as a promise.",
        effect: "The store's promise is backed up during the setup itself.",
        basis: "Store promise check, hypothesis 02.",
      },
      {
        id: "why",
        title: "Every permission comes with an explanation",
        found: "The system window asks and explains nothing, so people tap \"Don't Allow\" without reading.",
        did: "Before each window there is a short \"why we need this\" screen in everyday words.",
        effect: "Less anxiety and fewer automatic refusals.",
        basis: "Engineering interviews, hypothesis 01.",
      },
      {
        id: "rhythm",
        title: "The same order on both platforms",
        found: "iOS and Android handle permissions differently, and the windows came in a different order.",
        did: "One order of steps for every permission and a shared look for the meter. A new permission is added the same way.",
        effect: "The setup reads as one story, and no longer as a string of random windows.",
        why: "Consistency, after Nielsen: by the second step the path is already familiar.",
      },
    ],
  },
  results: {
    lead: "The boring screen paid off.",
    outcomes: [
      { x: "Reached working protection: +25%", y: "The app's data after the update.", z: "The protection meter and the counters." },
      { x: "Refusals at access requests: −30%", y: "The app's data after the update.", z: "An explanation before each window." },
      { x: "Setup clarity: 4.5 of 5", y: "A test with people. It was not measured in the live app.", z: "The same three steps on both platforms." },
    ],
    /* [TO FILL] add values or drop a line if there is no data */
    points: [
      "[TO FILL] Time from install to full protection: before → after",
      "[TO FILL] Retention: share of users who open the app on day 7",
    ],
  },
  takeaways: [
    "I compared the two versions of the setup by the numbers. Which one I liked more did not matter.",
  ],
  quote: "People give access more willingly when they see at once what it gets them.",
  gallery: [
    {
      kind: "stack",
      title: "Welcome, filter setup and statistics",
      images: [
        img(F + "spam-welcome.webp", 402, 874, "First screen: the benefit first, requests after", "hero"),
        img("cases/stop-spam/01.webp", 1300, 2642, "Protection statistics", "device"),
        img(F + "spam-sms-setup.webp", 402, 874, "SMS filter in five steps"),
      ],
    },
  ],
  deepDives: [],
};
