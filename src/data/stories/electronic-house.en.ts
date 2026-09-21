/* v41: рассказ кейса «Электронный дом» на двух языках.
   Источник — Main cases/Electronic-house.html и EN/Electronic-house.en.html. Экранов в публичном доступе нет,
   поэтому галереи нет: кейс держится на аудите и матрице приоритетов. Положение точек на матрице — по тексту
   кейса («дёшево и бьёт сильно» / «заметно улучшает, но требует времени»), без выдуманных оценок в баллах.
   v56: тексты переписаны простым языком, факты и цифры те же. */
import type { CaseStory } from "../caseStory";

export const en: CaseStory = {
  id: "electronic-house",
  hero: {
    kicker: "UX audit · Mobile app · 2024",
    title: "Electronic House",
    tagline: "I found out why residents complain about their housing app and redid its most painful screens.",
    summary:
      "An app for residents of apartment buildings kept getting bad ratings. A neighbouring team ran research and confirmed it. I went through the screens and wrote down where a person cannot tell where to go and where they lack information. Then I sorted the fixes by urgency and redid four screens: the home screen, \"My Home\", the chats and the error messages. The team got a plan: what to fix now and what to schedule for later.",
    facts: [
      ["Role", "UX designer"],
      ["Company", "Moscow Department of Information Technology (DIT)"],
      ["Timeline", "2024"],
      ["Platform", "iOS and Android"],
    ],
    tags: ["UX audit", "Mobile", "GovTech", "Redesign"],
  },
  kpis: [
    { value: "6 screens", label: "covered in the audit" },
    { value: "4 screens", label: "redone from scratch" },
    { value: "2 horizons", label: "fixes split into urgent and later" },
    { value: "4 ideas", label: "put off for the future" },
  ],
  context: {
    lead: "Ratings were dropping, and nobody had a clear list of fixes.",
    text:
      "A neighbouring team ran research and came back with bad news: the app gets low ratings, and people get confused and angry. But \"everything is bad\" is not a task yet. It is like telling a doctor \"I don't feel well\". First you have to find out what hurts, why, and what to treat first.\n\nI ran a UX audit. I went through the main screens, found the places where a person gets confused, and gave the team a list of fixes in order: what to do urgently and what can wait.",
    team: [
      { who: "Research team", how: "Brought the ratings and the user complaints. The audit started from what people really write, and my guesses had nothing to do with it." },
      { who: "Product team", how: "Together we decided which findings matter most for the app and what could be done in the near future." },
      { who: "Feasibility", how: "I only suggested what can be done in the current app: small fixes that can really ship. Nobody was going to rewrite everything from scratch." },
    ],
    myRole: "I checked the screens against the common rules of usability, wrote down the problems on each screen, sorted them by urgency and redid the four most painful screens. The rest went into recommendations.",
  },
  research: {
    lead: "From complaints in the app store to a list of problems and an order of work.",
    methods: [
      {
        kind: "Research team data",
        title: "Where the audit started",
        question: "What do people complain about when they leave a low rating?",
        sample: "Ratings and user complaints collected by the neighbouring team",
        finding: "One of the main reasons for a bad rating is errors. People were shown a window with a cryptic code. They did not understand what had happened or what to do next, so they went and wrote a review.",
      },
      {
        kind: "Heuristic audit",
        title: "Checked against rules, not taste",
        question: "Where does a person get confused, and where is the text hard to read?",
        sample: "Six screens: home, \"My Home\", neighbours, chats, error handling, services",
        finding: "The home screen has so much on it that you cannot tell what the app is for. In \"My Home\" the message that a request was rejected is almost impossible to find. The chats mix four kinds of conversation.",
      },
      {
        kind: "Problem map",
        title: "Findings by screen",
        question: "Which problems repeat, and on which screens do people get lost most often?",
        sample: "All audit findings sorted across six screens",
        finding: "The problems came in two kinds. The first: it is unclear where to go and who to write to. The second: information is missing (what is up with my address, what just happened). I chose to redo the four screens where both kinds meet.",
      },
      {
        kind: "Product check",
        title: "What we can take on",
        question: "Which findings matter most, and what can we get done in the near future?",
        sample: "The product team",
        finding: "All the recommendations stayed within the current app. The expensive ideas (a first-launch walkthrough, drafts, navigation the way iOS users expect it) went into the long-term plan.",
      },
    ],
    matrix: {
      title: "I rated every finding on two questions: how much it gets in people's way and how much it costs to fix.",
      axes: ["How much it gets in the way", "How much it costs to fix"],
      items: [
        { text: "Errors with a cryptic code. They anger people the most and are cheap to fix: the texts need rewriting", impact: 88, cost: 16, tier: "Urgent" },
        { text: "An overloaded home screen and a lost rejection message. They get in the way on every visit, and the fixes are small", impact: 72, cost: 36, tier: "Urgent" },
        { text: "A first-launch walkthrough, request drafts, navigation the way iOS users expect it, filled-in profiles and services. They improve the app a lot but need time and development", impact: 48, cost: 80, tier: "Long term" },
      ],
      note: "First remove whatever makes people leave one star and an angry review. It is cheap and wins trust back. Then work on what makes the app pleasant.",
    },
  },
  decisions: {
    lead: "What I found on each screen and what I did about it.",
    items: [
      {
        id: "home",
        title: "A home screen that tells you why you are here",
        found: "The home screen had so much on it that the point of the app got lost. Among the banners and feeds you could not find the thing you came for.",
        did: "I removed the extras and put forward what a resident needs most often: payments, service requests, meter readings, notifications.",
        effect: "From the first screen it is clear what to do. There is no more wading through partner ads.",
        why: "A resident comes in to pay or to file a request. The first thing they see should be about that.",
        basis: "A review against Nielsen's heuristics and the urgent horizon of the fix matrix. Hick's law: the more there is on screen, the longer the choice takes.",
      },
      {
        id: "myhome",
        title: "A \"My Home\" that shows what is up with your address",
        found: "The section looked half empty, and the important things in it got lost. The message that your property confirmation request was rejected was almost impossible to find. The neighbours' profiles next to it were empty too.",
        did: "I added the resident's status to the address card. I put forward payments, requests, votes and the owners' general meetings. I made the message about a rejected request easy to notice.",
        effect: "The section became useful. No more guessing why \"nothing is happening\".",
        why: "An empty section reads as a broken one. The status on the address says which step the person is on.",
        basis: "The problem map, the clarity row. Nielsen's rule: the system shows what is going on with it.",
      },
      {
        id: "chats",
        title: "Chats where you know who you are writing to",
        found: "The chats mixed four kinds of conversation: building, private, concierge, support. The \"Ask the concierge\" button was confusing: people expected one thing from it, and it did another.",
        did: "I sorted the chats into groups and gave them names that tell you at once what is inside.",
        effect: "At a glance you know which chat you are writing in and who will answer.",
        why: "Writing to the concierge in the building chat feels awkward and gets nowhere. The group name answers who will read it.",
        basis: "The problem map, the navigation row.",
      },
      {
        id: "errors",
        title: "Errors in plain words",
        found: "An error was reported by a window with a cryptic code. People did not understand what had happened or what to do next, so they went and wrote a bad review.",
        did: "I rewrote the error messages. Each one now says what happened, why, and what to do right now. The code that only a developer can read is gone from the message.",
        effect: "An error stopped being a dead end and a reason to take a star off the app.",
        why: "An error code tells a resident nothing. They go and leave a bad review because they see no other way out.",
        basis: "Research team data and the fix matrix: the cheapest and the most urgent. Nielsen's rule: an error explains the cause and offers a way out.",
      },
    ],
  },
  results: {
    lead: "The outcome: a list of fixes in order.",
    points: [
      "I wrote down the problems on six screens, from the overloaded home screen to windows that show an error code and no explanation",
      "I redid four screens: home, \"My Home\", chats, error messages",
      "I gave the team a plan: what goes into the next sprint and what to schedule for the future",
    ],
    honesty: "This is an audit with a plan of fixes. I do not know how the ratings changed after the fixes went in: I have no such numbers. The figures above show how much work was done. They say nothing about ratings in the app store.",
  },
  roadmap: [
    { kicker: "Onboarding", title: "A walkthrough you can take again", text: "An introduction to the app on first launch that you can come back to. A new resident will see what the app can do." },
    { kicker: "Drafts", title: "Requests and listings", text: "Save drafts. If a person is interrupted halfway, they will not have to type everything again." },
    { kicker: "Navigation and copy", title: "iOS habits and hints", text: "Navigation the way iOS users are used to, and hints on empty screens: what will appear here and what you need to do." },
  ],
  takeaways: [
    "First fix \"why it's annoying\", then add \"why people love it\". Cheap fixes like rewritten error texts win trust back fastest.",
    "With the common rules of usability in hand, the argument is about facts. Without them it is about taste.",
    "An audit should end with an order of work. A team will not pick up a list of twenty \"we really should\"s.",
  ],
  quote: "First fix \"why it's annoying\", then add \"why people love it\".",
  gallery: [],
  deepDives: [],
};
