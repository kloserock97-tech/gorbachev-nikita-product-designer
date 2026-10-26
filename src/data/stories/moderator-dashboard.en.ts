/* v41: рассказ кейса «Кабинет модератора» на двух языках.
   Источник — Main cases/Moderator-cabinet.html и EN/Moderator-cabinet.en.html.
   v56: тексты переписаны простым языком, факты и цифры те же.
   v86: вслед за русской версией по ревью Никиты.
   23.10: метрики утвердил Никита: −38% AHT с живого кабинета и 4.3 of 5 на тесте после запуска.
   26.10: the case follows the GRIF template, mirroring the Russian version (see its header comment). No new facts. */
import type { CaseStory, CaseImage } from "../caseStory";

const img = (src: string, w: number, h: number, caption: string, kind = "screen"): CaseImage => ({ src, w, h, caption, kind });
const F = "cases/figma/";
const M = "cases/moderator-dashboard/";

export const en: CaseStory = {
  id: "moderator-dashboard",
  compact: true,
  hero: {
    kicker: "B2B dashboard · Mos.ru · 2024",
    title: "Moderator Dashboard",
    tagline: "I made the moderator a separate role and gave them one workplace for everything they check.",
    /* 26.10: In brief opens with the product and the problem; the context paragraphs are gone, the facts are the same */
    summary:
      "The moderator dashboard is a workplace for the people who check comments, users, publications, groups and posts in Community. Before, one administrator went through that whole stream in the general admin panel, the same place where the whole site is set up. I audited the admin panel, tested two prototypes with eight moderators and designed the dashboard from the results: the obvious gets read right in the list, the doubtful on one page with all the context.",
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
  /* 26.10: goals and constraints are built from the earlier case text (context, decisions, engineering interviews) */
  context: {
    lead: "",
    /* 26.10: goals rewritten as goals, not solutions; the «one administrator» constraint is gone — see the Russian version */
    goals: [
      "Cut the time it takes to check one item.",
      "Free a moderator's time for the decision, not for hunting down the comment and its context.",
      "Take the whole moderation stream off one administrator and hand it to moderators.",
      "Bring new item types into moderation without a separate interface for each.",
    ],
    art: { goals: ["md-time", "md-context", "md-team", "md-five"], constraints: ["md-admin"] },
    constraints: [
      { title: "On top of the existing admin panel", text: "The dashboard is built on it, so new sections have to be added to one template." },
    ],
  },
  /* 26.10: the three test hypotheses became the hypotheses of the decisions; audit and engineering findings are numbered F1–F4 */
  research: {
    lead: "",
    methods: [
      {
        kind: "Admin panel audit",
        question: "Where does a moderator's time go in the general admin panel?",
        sample: "The existing admin panel and functional references",
        finding: "A moderator spends time not on decisions but on getting to the right comment and its context.",
        insights: [
          { id: "F1", text: "Comments lie in one pile, and it is unclear where to start." },
          { id: "F2", text: "Even \"thanks\" or plain spam is opened on a separate page." },
          { id: "F3", text: "For a disputed comment the post and the author's history are found by hand." },
        ],
      },
      {
        kind: "Engineering interviews",
        question: "What can be done in the current system, and what will have to wait?",
        sample: "The development team, before mock-ups",
        finding: "New sections of the dashboard have to be added to one template.",
        insights: [
          { id: "F4", text: "The dashboard is built on top of the admin panel, so everything a moderator checks has to work the same way." },
        ],
      },
      {
        kind: "Moderated testing",
        question: "What leads to a decision faster: a detailed comment page or buttons right in the list?",
        sample: "8 moderators, 2 prototypes, 10 hypotheses (seven and three)",
        finding: "It turned out both ideas were needed. A moderator settles an obvious comment right in the list and opens a doubtful one in full.",
      },
    ],
  },
  /* 26.10: one decision per finding; "Changed after testing" only where the two-prototype test settled something */
  decisions: {
    lead: "",
    items: [
      {
        id: "registry",
        demo: "moderator2:registry",
        insight: "F1",
        title: "A list sorted by status",
        found: "If the comments waiting for a check are shown straight away, a moderator does not have to look for them.",
        did: "Tabs: \"Awaiting review\", \"Reviewed\", \"Unwanted\", \"Reported\", \"Sent to manager\". A moderator first sees what is waiting for them now and goes into the details later.",
        image: img(M + "registry.webp", 1440, 1156, "The comment list: tabs by status and filters"),
      },
      {
        id: "inline",
        demo: "moderator2:inline",
        insight: "F2",
        title: "A comment reads right in the list",
        found: "If a short comment can be read in full in the list without opening a page, the obvious gets sorted out faster.",
        did: "A long comment expands in the registry row with “More”, and its status shows the history: who has already taken it on and when. The page is opened when a case is not obvious; the decision buttons are at its top.",
        changed: "In prototype 1 a comment was read only on its page, in prototype 2 it was decided right in the row. In the test moderators sorted short comments out in the list, and what moved from prototype 2 into the final design is reading in the row: the full text and the status history.",
        image: img(M + "quick-list.webp", 1600, 1075, "Prototype 2: a decision from the list row"),
      },
      {
        id: "card",
        demo: "moderator2:card",
        insight: "F3",
        title: "A detailed page for the doubtful cases",
        found: "If the post, the author, the reply thread and the complaints are on one screen, a disputed comment does not have to be pieced together.",
        did: "One page with the post, a note on the author and their karma, the reply thread, the history of work on the comment and the complaints. Sorting by popular comments and by authors with low reputation.",
        changed: "The detailed page came from prototype 1: it was the one that confirmed the hypothesis about disputed comments in the test.",
        image: img(M + "01.webp", 1600, 1200, "Comment page"),
      },
      {
        id: "mechanism",
        demo: "moderator2:mechanism",
        insight: "F4",
        title: "One way of working for five types of items",
        found: "If the order of actions is the same everywhere, a moderator learns once, and a new section is added without a new interface.",
        did: "The same order of actions, shared statuses and rejection reasons for comments, users, publications, groups and posts. A new type is added to the same template.",
        image: img(F + "moderator-queue.webp", 1440, 1156, "The same list for the Users section"),
      },
    ],
  },
  /* 26.10: validation in three rounds — the prototype test, the live measurement and the post-launch test (facts of the former Results) */
  validation: {
    lead: "I checked it in three rounds.",
    stages: [
      {
        kicker: "Stage 1",
        title: "Test of two prototypes",
        text: "Eight moderators went through tasks on two prototypes: a detailed page with all the context and a decision right in the list. We measured task success and the number of steps, time, mistakes and hesitations, and ease of use on a 1 to 5 scale.",
      },
      {
        kicker: "Stage 2",
        title: "Measurement on the live dashboard",
        text: "The dashboard was built from these mock-ups. Average handling time per item was measured before the update and after: −38%.",
      },
      {
        kicker: "Stage 3",
        title: "Test after launch",
        text: "Moderators rated ease of use 4.3 of 5. The most common praise was \"you don't have to dive in anywhere\".",
      },
    ],
  },
  /* v114: prototype from the mock-ups — the "Take into work and approve" scenario from Figma TsqIZDg5rUgbxPNV5ghDZB (section 2494:85199): queue → profile → confirm → in work → approved */
  /* 26.10: the prototype is rebuilt like GRIF's, see the Russian version */
  prototypes: [
    {
      tab: "Users",
      title: "Check a user and approve",
      lead: "Take a user from the queue into work and approve the profile, the way a moderator does it.",
      live: "moderator2:users",
      device: "browser",
      steps: [
        { image: img("cases/moderator-dashboard/live2/s-uQueue.webp", 1200, 750, "The user queue, tabs by status"), action: "Open a user from the queue", why: "This is the queue of the Users section. The tabs at the top split it by status." },
        { image: img("cases/moderator-dashboard/live2/s-uProfile.webp", 1200, 750, "The user profile"), action: "Press “Take into work”", why: "The profile holds everything known about the user. To make a decision, the case is taken into work first." },
        { image: img("cases/moderator-dashboard/live2/s-uConfirm.webp", 1200, 750, "Confirmation before taking the case"), action: "Confirm: “Take”", why: "The dashboard asks once more, so nobody takes a case by an accidental click." },
        { image: img("cases/moderator-dashboard/live2/s-uWork.webp", 1200, 750, "The profile in work, decision buttons on top"), action: "Press “Approve”", why: "The case is in work, and the decision buttons have appeared at the top: approve, freeze, send to a manager or block." },
        { image: img("cases/moderator-dashboard/live2/s-uDone.webp", 1200, 750, "The profile is approved"), action: "Done: the profile is approved", why: "The “Take the next one” button opens a new case straight away, with no trip back to the queue." },
      ],
    },
    {
      tab: "Comments",
      title: "Handle a comment from the registry",
      lead: "A short comment is read right in the registry row, and the page is opened only for the details.",
      live: "moderator2:comments",
      device: "browser",
      steps: [
        { image: img("cases/moderator-dashboard/live2/s-cList.webp", 1200, 750, "The comment registry by status"), action: "Press “More” in the first row", why: "The registry is split by status: what waits for review comes first. A long comment is cut in the row." },
        { image: img("cases/moderator-dashboard/live2/s-cRow.webp", 1200, 750, "The comment expanded right in the row"), action: "Click the “New” status", why: "The comment expanded in the row, no page to open. “Hide” folds it back." },
        { image: img("cases/moderator-dashboard/live2/s-cStatus.webp", 1200, 750, "The status history of the comment"), action: "Open the first comment", why: "The status shows its history: who has already taken the comment and when. If the case is not obvious, it is opened in full." },
        { image: img("cases/moderator-dashboard/live2/s-cData.webp", 1200, 750, "The comment page: publication, author, tabs"), action: "Press “Take into work”", why: "One page holds the publication, a note about the author and tabs with the reply thread, history and complaints." },
        { image: img("cases/moderator-dashboard/live2/s-cWork.webp", 1200, 750, "The comment in work, decision buttons on top"), action: "Done: the comment is in work", why: "The decision buttons are at the top: approve, hide, send to a manager or delete." },
      ],
    },
    {
      tab: "Disputed case",
      title: "Gather the context of a disputed comment",
      lead: "The reply thread, history and complaints sit as tabs on one page, with no hunting through the admin panel.",
      live: "moderator2:disputed",
      device: "browser",
      steps: [
        { image: img("cases/moderator-dashboard/live2/s-dComment.webp", 1200, 750, "The comment page"), action: "Open the “Reply thread” tab", why: "The comment and the publication are on top, a note about the author on the right, decision buttons above." },
        { image: img("cases/moderator-dashboard/live2/s-dThread.webp", 1200, 750, "The reply thread"), action: "Open the “History” tab", why: "The thread shows the conversation the comment was written in: without it a disputed line cannot be understood." },
        { image: img("cases/moderator-dashboard/live2/s-dHistory.webp", 1200, 750, "The history of work on the comment"), action: "Open the “Complaints” tab", why: "History shows who has already done what with the comment and why." },
        { image: img("cases/moderator-dashboard/live2/s-dComplaints.webp", 1200, 750, "Complaints about the comment"), action: "Done: the whole context on one page", why: "Complaints with their reasons are the last tab. A disputed comment does not have to be pieced together." },
      ],
    },
  ],
  /* 26.10: takeaways, the quote and the extra screens are gone, as in GRIF */
  takeaways: [],
  interludes: [],
  gallery: [],
  deepDives: [],
};
