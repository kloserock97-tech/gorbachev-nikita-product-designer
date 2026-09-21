/* v41: рассказ кейса «Стоп-спам» на двух языках. Источник — Main cases/Stop-spam.html и EN/Stop-spam.en.html.
   Воронка показана без процентов по шагам: в кейсе есть только итог (+25 % / −30 %), шаговых цифр нет.
   v56: тексты переписаны простым языком, факты и цифры те же. */
import type { CaseStory, CaseImage } from "../caseStory";

const img = (src: string, w: number, h: number, caption: string, kind = "screen"): CaseImage => ({ src, w, h, caption, kind });
const F = "cases/figma/";

export const en: CaseStory = {
  id: "stop-spam",
  hero: {
    kicker: "Anti-spam app · iOS · Android · 2026",
    title: "Stop Spam",
    tagline: "The most boring screen in the app became a meter that fills up as you go.",
    summary:
      "An anti-spam app only starts working after a person lets it access calls, messages and filters. Those permissions were exactly where people gave up on the setup, without ever switching protection on. I sorted the permissions into protection levels and added a meter that grows with every step, plus counters of blocked spam. 25% more people now reach working protection, and refusals at the permission requests went down by 30%.",
    facts: [
      ["Role", "UX/UI designer"],
      ["Team", "Product and analytics, iOS and Android engineering, marketing"],
      ["Timeline", "2026"],
      ["Platform", "iOS and Android"],
    ],
    tags: ["Mobile", "Onboarding", "Gamification", "B2C"],
  },
  kpis: [
    { value: "+25%", label: "people reach working protection" },
    { value: "−30%", label: "refusals when the app asks for access" },
    { value: "4.5 of 5", label: "how clear the setup is, from a test with people" },
    { value: "2 platforms", label: "iOS and Android, the setup works the same" },
  ],
  context: {
    lead: "Between install and protection sat a screen nobody likes.",
    text:
      "Without system permissions an anti-spam app is useless. Until it can see calls and messages, it blocks nothing. To give access, a person goes through several \"Allow access to…\" system windows. They are alarming, confusing and dull. It is like a courier who asks for the keys to your flat at the door and does not say why. People installed the app and never got to working protection.\n\nAsking \"please tap Allow\" in a prettier way was pointless. The job was to explain why each permission is needed and to show what a person gets for every access they give.",
    team: [
      { who: "Product and analytics", how: "Together we looked at which setup step loses the most people and which permissions protection cannot work without." },
      { who: "iOS and Android engineering", how: "I found out which system windows we can show and in what order: what each platform allows. Learning that before the mock-ups is cheaper than after." },
      { who: "Marketing and app stores", how: "The app's store page says \"we block spam\". We agreed that the setup backs up that promise from the first screen." },
    ],
    myRole:
      "I found where people give up on the setup, rebuilt the order of screens, came up with the protection level and the counters, and made mock-ups and a prototype for iOS and Android that take each platform's system windows into account.",
  },
  research: {
    lead: "First I found which windows made people leave. Then I compared two versions of the setup by the numbers.",
    methods: [
      {
        kind: "Funnel breakdown",
        title: "Where people leave",
        question: "Which step between install and working protection loses the most people?",
        sample: "The onboarding funnel, together with product and analytics",
        finding:
          "People left at the system permission windows. A person did not know how many windows were still ahead or why they were needed. And they got nothing right away for the access they had already given.",
      },
      {
        kind: "Engineering interviews",
        title: "What the platform allows",
        question: "Which system windows can we show, in what order, and what can we show before them?",
        sample: "iOS and Android developers, before mock-ups",
        finding: "The system window itself cannot be changed, but the screen before it can. So every request got a screen with an explanation before it, and the order became the same on both platforms.",
      },
      {
        kind: "Store promise check",
        title: "What people were promised",
        question: "Does the first screen back up what the app's store page says?",
        sample: "Marketing and the app's store listing",
        finding: "The store promises \"we block spam\". The first screen asked for access straight away and gave nothing back. The block counters close that gap right during the setup.",
      },
      {
        kind: "Two versions compared",
        title: "A plain setup against a setup with a meter",
        question: "Which version gets more people to working protection?",
        sample: "Two onboarding versions with users, then metrics after release",
        finding: "The version with the meter and the counters won by a clear margin: more people made it to the end. After the update went out: +25% reaching protection and −30% refusals.",
      },
    ],
    funnel: {
      title: "The path from install to working protection. Red marks the steps where people left.",
      steps: [
        { label: "Install from the store", note: "The store page promises: \"we block spam\"" },
        { label: "First screen", note: "It used to ask for access straight away" },
        { label: "System window: calls", note: "Dry and scary. The hand reaches for \"Don't Allow\" by itself", drop: true },
        { label: "System window: messages and SMS filter", note: "No idea how many steps are left", drop: true },
        { label: "Protection switched on", note: "Not everyone who installed the app got here" },
      ],
      note: "I have no percentages for each step. I show only the overall result after the update went out.",
    },
    hypotheses: {
      intro: "Version 1: system windows back to back, each with a short caption. Version 2: a protection level meter, block counters and a screen with an explanation before each request.",
      items: [
        { text: "I want to know why the app needs my calls before I agree.", verdict: "Version 2", won: true },
        { text: "I want to see that the access already does something. Right now it feels taken on credit.", verdict: "Version 2", won: true },
        { text: "I want to know how many steps are left until protection is ready.", verdict: "Version 2", won: true },
      ],
      measured: "We looked at whether a person reached working protection, at which system window people left, and how long the setup took.",
    },
  },
  decisions: {
    lead: "Every permission goes through the same three steps: explain, show the benefit, ask for access.",
    items: [
      {
        id: "level",
        title: "The protection level meter",
        found: "A person did not know how many windows were still ahead or why. The setup felt endless.",
        did: "I added a meter that works like a battery indicator. Every permission given raises the level and brings full protection closer.",
        effect: "You can see both the end of the road and the point of every step.",
        why: "People agree more readily when they can see how much is left. The meter shows the end of the road.",
        basis: "A step-by-step breakdown of the path and hypothesis 03. Nielsen's rule: the system shows which step you are on.",
        image: img("cases/stop-spam/01.webp", 1300, 2642, "Statistics: protection level at 90% and counters for what was blocked in 30 days", "device"),
      },
      {
        id: "counters",
        title: "Blocked-spam counters",
        found: "The app asked for access up front and gave nothing back right away.",
        did: "I put a counter next to each permission: this is how many calls and messages we will block. It is an estimate from the app's own data. We do not present it as a promise.",
        effect: "People give access more willingly when they see at once what it gets them.",
        why: "Access gets asked for up front and the benefit arrives later. The counter hands over the benefit first.",
        basis: "A check against the promise in the store and hypothesis 02.",
      },
      {
        id: "why",
        title: "Every permission comes with an explanation",
        found: "The system window is dry and scary. A person does not see why an app wants their calls and messages, and the hand reaches for \"Don't Allow\" by itself.",
        did: "Before each system window I put a short \"why we need this\" screen. It is written in everyday words, with no official phrasing and no fine print.",
        effect: "Less anxiety, and fewer people refuse without reading.",
        why: "The system window asks and explains nothing. The screen in front of it answers the question \"why do you want my calls\".",
        basis: "Engineering interviews: only the screen before the system window can change; hypothesis 01.",
      },
      {
        id: "rhythm",
        title: "The same order on both platforms",
        found: "iOS and Android handle permissions differently, and the windows come in a different order.",
        did: "I made one and the same order for every permission and a shared look for the meter. A new permission is added the same way.",
        effect: "The setup reads as one story, and no longer as a string of random windows.",
        why: "By the second permission the person walks a path they already know, with nothing to work out again.",
        basis: "Nielsen's consistency rule: identical steps get recognised without reading.",
      },
    ],
  },
  results: {
    lead: "The boring screen paid off.",
    points: [
      "A quarter more people now reach working protection, mostly thanks to the meter and the block counters",
      "Refusals when the app asks for access went down by 30%",
      "In a test with people the setup was rated 4.5 out of 5 for clarity",
      "One and the same setup works on two very different platforms",
    ],
    honesty: "+25% reaching protection and −30% refusals are counted from the app's data after the update went out. The clarity rating comes from a test with people. It was not measured in the live app.",
  },
  roadmap: [
    { kicker: "Mechanic", title: "Rewards for protection", text: "Badges and levels for blocked spam. The setup flows into a habit of using the app." },
    { kicker: "Personalisation", title: "Prompts at the right moment", text: "Suggest the next permission at the moment it will be most useful. Today everything is asked at once on first launch." },
    { kicker: "Handoff", title: "Handoff to engineering", text: "The screens and all their states are drawn for both platforms." },
  ],
  takeaways: [
    "I compared the two versions of the setup by the numbers. Which one I liked more did not matter.",
    "Which system windows can be shown, and in what order, is worth asking the developers before the mock-ups.",
    "A counter next to the button was more convincing than any text that tries to persuade.",
  ],
  quote: "People give access more willingly when they see at once what it gets them.",
  gallery: [
    {
      kind: "stack",
      title: "Welcome, filter setup and protection statistics",
      images: [
        img(F + "spam-welcome.png", 402, 874, "First screen: what the app is good for comes first, requests for access come after", "hero"),
        img("cases/stop-spam/01.webp", 1300, 2642, "Statistics: protection level and blocked-spam counters", "device"),
        img(F + "spam-sms-setup.png", 402, 874, "SMS filter setup laid out in five clear steps"),
      ],
    },
  ],
  deepDives: [],
};
