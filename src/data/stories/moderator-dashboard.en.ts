/* v41: рассказ кейса «Кабинет модератора» на двух языках.
   Источник — Main cases/Moderator-cabinet.html и EN/Moderator-cabinet.en.html.
   v56: тексты переписаны простым языком, факты и цифры те же.
   v86: вслед за русской версией по ревью Никиты: дизайн-метрики наверху, повторы вычищены,
   места с пометкой [TO FILL] Никита заполнит сам или уберёт.
   v89: сокращён вслед за русской версией по docs/prompts/case-copy-edit.md.
   23.10: метрики утвердил Никита: −38% AHT с живого кабинета и 4.3 of 5 на тесте после запуска;
   −38% шагов, −32% времени и пункты [TO FILL] убраны. Тексты вслед за русской версией. */
import type { CaseStory, CaseImage } from "../caseStory";

const img = (src: string, w: number, h: number, caption: string, kind = "screen"): CaseImage => ({ src, w, h, caption, kind });
const F = "cases/figma/";
const M = "cases/moderator-dashboard/";

export const en: CaseStory = {
  id: "moderator-dashboard",
  hero: {
    kicker: "B2B dashboard · Mos.ru · 2024",
    title: "Moderator Dashboard",
    tagline: "I made the moderator a separate role and gave them one workplace for everything they check.",
    summary:
      "A follow-up to the Community case. I audited the admin panel, wrote hypotheses, tested two prototypes with moderators and designed the dashboard from the results.",
    facts: [
      ["Role", "UX designer"],
      ["Company", "Moscow Department of Information Technology (DIT)"],
      ["Timeline", "2024"],
      ["Platform", "Web, desktop"],
    ],
    tags: ["B2B", "GovTech", "Research", "Usability test"],
  },
  /* 23.10: metrics approved by Nikita: AHT from the live dashboard after the update, ease of use from the post-launch test */
  kpis: [
    { value: "−38%", label: "average handling time (AHT) per item after the update" },
    { value: "4.3 of 5", label: "ease of use rated by moderators in the post-launch test" },
  ],
  context: {
    lead: "The site grew faster than one person could keep up.",
    text:
      "Community residents wrote more and more: comments, publications, complaints. One administrator went through them in the general admin panel, the same place where the whole site is set up.\n\nA ban button would not have helped. The moderator needed a role and a workplace of their own for five types of items: comments, users, publications, groups and posts.",
    team: [
      { who: "Sasha, analyst", how: "Wrote down what the dashboard must be able to do. I turned the requirements into screens and the order of actions." },
    ],
  },
  research: {
    lead: "I built two prototypes that worked in different ways and tested them with eight moderators.",
    methods: [
      {
        kind: "Admin panel audit",
        question: "Where does a moderator's time go in the general admin panel?",
        sample: "The existing admin panel and functional references",
        finding:
          "Comments lie in one pile, and it is unclear where to start. Even \"thanks\" or plain spam is opened on a separate page, and for a disputed comment the post and the author's history are found by hand.",
      },
      {
        kind: "Engineering interviews",
        question: "What can be done in the current system, and what will have to wait?",
        sample: "The development team, before mock-ups",
        finding: "The dashboard is built on top of the admin panel, so new sections have to follow one template. That gave the idea of one way of working for everything a moderator checks.",
      },
      {
        kind: "Moderated testing",
        question: "What leads to a decision faster: a detailed comment page or buttons right in the list?",
        sample: "8 moderators, 2 prototypes, 10 hypotheses (seven and three)",
        finding:
          "It turned out both ideas were needed. A moderator settles an obvious comment right in the list and opens a doubtful one in full.",
      },
    ],
    hypotheses: {
      intro: "Prototype 1 was a detailed page with all the context, prototype 2 a decision in the list. Three hypotheses settled it:",
      items: [
        { text: "I want to see the comments that are waiting for a check straight away, so I don't waste time searching.", verdict: "Prototype 2", won: true },
        { text: "A short, clear comment I want to rate right in the list, without opening a page.", verdict: "Prototype 2", won: true },
        { text: "A disputed comment needs context: the post, the author, the reply thread and the complaints, all on one screen.", verdict: "Prototype 1", won: true },
      ],
      measured: "Task success and the number of steps, time, mistakes and hesitations, ease of use on a 1 to 5 scale.",
    },
  },
  decisions: {
    lead: "The dashboard rests on four decisions. Three came from hypotheses in the test, the fourth from a talk with the developers.",
    items: [
      {
        id: "registry",
        title: "A list sorted by status",
        found: "It was unclear where to start.",
        did: "Tabs: \"Awaiting review\", \"Reviewed\", \"Unwanted\", \"Reported\", \"Sent to manager\".",
        effect: "In the test the right group of comments was found on the first try.",
        why: "A moderator opens the dashboard with one question: what is waiting for me now. So they see the lists by status first and go into the details later, just as Shneiderman suggests.",
        basis: "Hypothesis 01, prototype 2.",
      },
      {
        id: "inline",
        title: "A decision right in the list",
        found: "An obvious comment needed a page of its own.",
        did: "The decision buttons sit right in the list row. An obvious comment now takes one click, it used to take five.",
        effect: "In the test moderators settled short, clear comments right in the list, without leaving it.",
        why: "The moderator is already reading the comment in the list, so the buttons sit next to the text and the mouse has only a short way to go (that is Fitts's law).",
        basis: "Hypothesis 02, prototype 2.",
      },
      {
        id: "card",
        title: "A detailed page for the doubtful cases",
        found: "Context was gathered by hand.",
        did: "One page with the post, a note on the author and their karma, the reply thread, the history of work on the comment and the complaints. Sorting by popular comments and by authors with low reputation.",
        effect: "A hard comment gets decided on one screen.",
        why: "You can't judge a disputed comment apart from its post, its thread and the author's history, so all of that sits right next to it.",
        basis: "Hypothesis 03, prototype 1.",
        image: img(M + "01.webp", 1600, 1200, "Comment page"),
      },
      {
        id: "mechanism",
        title: "One way of working for five types of items",
        found: "In the general admin panel each type works its own way.",
        did: "The same order of actions, shared statuses and rejection reasons. A new type is added to the same template.",
        effect: "A moderator learns once, and the team does not invent an interface for every new section.",
        why: "The same moderator handles all five sections. If the order of actions is the same everywhere, they don't have to remember how the next section works. Nielsen calls this consistency.",
      },
    ],
  },
  results: {
    lead: "After the update one item takes noticeably less time.",
    intro: "The dashboard was built from these mock-ups. Handling time was measured on the live dashboard before and after the update, and moderators rated ease of use in a test after launch.",
    outcomes: [
      { x: "Average handling time (AHT): −38%", y: "How long moderating one item takes on average in the live dashboard, before the update and after.", z: "The obvious gets closed right in the list, and the context for a doubtful case no longer has to be dug up across the admin panel." },
      { x: "Ease of use: 4.3 of 5", y: "Rated by moderators in the post-launch test. The most common praise was \"you don't have to dive in anywhere\".", z: "Routine in the list, the doubtful on a detailed page." },
    ],
    points: [],
  },
  /* v114: prototype from the mock-ups — the "Take into work and approve" scenario from Figma TsqIZDg5rUgbxPNV5ghDZB (section 2494:85199): queue → profile → confirm → in work → approved */
  prototype: {
    title: "Check a user and approve",
    lead: "You take a user from the queue into work and approve their profile, the way a moderator does it in my mock-ups.",
    device: "browser",
    steps: [
      { image: img(F + "moderator-queue.webp", 1440, 1156, "The user queue"), spot: [0.453, 0.33], action: "Open a user from the queue", why: "This is the queue of the Users section. The tabs at the top split it by status." },
      { image: img(F + "moderator-profile.webp", 1440, 861, "The user profile"), spot: [0.142, 0.205], action: "Press \"Take into work\"", why: "The profile holds everything known about the user. To make a decision, the case is taken into work first." },
      { image: img(F + "moderator-confirm.webp", 1440, 861, "Confirmation before taking the case"), spot: [0.5, 0.574], action: "Confirm", why: "The dashboard asks once more, so nobody takes a case by an accidental click." },
      { image: img(F + "moderator-inwork.webp", 1440, 861, "The profile in work"), spot: [0.127, 0.204], action: "Press Approve", why: "The case is in work, and the decision buttons have appeared at the top: approve, freeze, send to a manager or block." },
      { image: img(F + "moderator-approved.webp", 1440, 861, "The profile is approved"), action: "Done: the profile is approved", why: "The \"Take the next one\" button opens a new case straight away, with no trip back to the queue." },
    ],
  },
  takeaways: [
    "Two prototypes with different approaches helped more than one \"average\" prototype would have: the test showed where routine ends for a moderator and a doubtful case begins.",
    "I asked about the engineering limits before the mock-ups, and that conversation gave us one way of working for all five sections.",
  ],
  quote: "A moderator checks comments all day long, so an extra click in one check repeats in every check after it.",
  gallery: [
    {
      kind: "spot",
      title: "The same list for the Users section",
      image: img(F + "moderator-queue.webp", 1440, 1156, "User queue", "hero"),
      spots: [
        { x: 27, y: 11.6, text: "Statuses as tabs", decision: "registry" },
        { x: 40, y: 18.3, text: "Filters", decision: "registry" },
        { x: 66.5, y: 33.1, text: "Status in the row", decision: "inline" },
        { x: 94, y: 26.8, text: "Complaints column", decision: "mechanism" },
      ],
    },
    {
      kind: "compare",
      title: "Profile and confirmation before taking a case",
      before: img(F + "moderator-profile.webp", 1440, 861, "User profile"),
      after: img(F + "moderator-confirm.webp", 1440, 861, "Confirmation before taking a request into work"),
      labels: ["Context", "Confirmation"],
    },
  ],
  deepDives: [],
};
