/* v41: рассказ кейса «Кабинет модератора» на двух языках.
   Источник — Main cases/Moderator-cabinet.html и EN/Moderator-cabinet.en.html.
   v56: тексты переписаны простым языком, факты и цифры те же.
   v86: вслед за русской версией по ревью Никиты: дизайн-метрики наверху, повторы вычищены,
   места с пометкой [TO FILL] Никита заполнит сам или уберёт.
   v89: сокращён вслед за русской версией по docs/prompts/case-copy-edit.md. */
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
  /* design metrics from a moderated test on the prototype */
  kpis: [
    { value: "−38%", label: "steps to check one comment" },
    { value: "−32%", label: "time on the same task" },
    { value: "4.3 of 5", label: "ease of use rated by moderators in the test" },
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
    lead: "Two prototypes on opposite ideas, eight moderators and an unexpected conclusion.",
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
          "Neither idea won on its own. Both together did: a moderator settles the obvious in the list and opens the doubtful in full.",
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
    lead: "Four decisions, each tested with moderators.",
    items: [
      {
        id: "registry",
        title: "A list sorted by status",
        found: "It was unclear where to start.",
        did: "Tabs: \"Awaiting review\", \"Reviewed\", \"Unwanted\", \"Reported\", \"Sent to manager\".",
        effect: "In the test the right group of comments was found on the first try.",
        why: "A moderator opens the dashboard asking \"what is waiting for me now\". Shneiderman: overview first, details later.",
        basis: "Hypothesis 01, prototype 2.",
      },
      {
        id: "inline",
        title: "A decision right in the list",
        found: "An obvious comment needed a page of its own.",
        did: "The decision buttons sit in the list itself: one click where there used to be five.",
        effect: "Most of the saved steps and time came from here.",
        why: "Fitts's law: the button sits where the person is already looking.",
        basis: "Hypothesis 02, prototype 2.",
      },
      {
        id: "card",
        title: "A detailed page for the doubtful cases",
        found: "Context was gathered by hand.",
        did: "One page with the post, a note on the author and their karma, the reply thread, the history of work on the comment and the complaints. Sorting by popular comments and by authors with low reputation.",
        effect: "A hard comment gets decided on one screen.",
        why: "When context has to be hunted across tabs, people decide by guesswork.",
        basis: "Hypothesis 03, prototype 1.",
        image: img(M + "01.webp", 1600, 1200, "Comment page"),
      },
      {
        id: "mechanism",
        title: "One way of working for five types of items",
        found: "In the general admin panel each type works its own way.",
        did: "The same order of actions, shared statuses and rejection reasons. A new type is added to the same template.",
        effect: "A moderator learns once, and the team does not invent an interface for every new section.",
        why: "Consistency, after Nielsen: people recognise one order of actions without having to recall it.",
      },
    ],
  },
  results: {
    lead: "Fewer steps and less time on every check.",
    intro: "The design metrics come from a moderated test on the prototype. The dashboard went into development based on these mock-ups.",
    outcomes: [
      { x: "Steps to check a comment: −38%", y: "Steps to a decision in the test scenario.", z: "A decision in the list and tabs by status." },
      { x: "Time on the same task: −32%", y: "Scenario time in the test.", z: "The obvious gets closed without leaving the list." },
      { x: "Ease of use: 4.3 of 5", y: "Rated by eight moderators. The most common praise was \"you don't have to dive in anywhere\".", z: "Routine in the list, the doubtful on a detailed page." },
    ],
    /* [TO FILL] product metrics after launch: add values or drop a line if there is no data */
    points: [
      "[TO FILL] Average time to moderate one item on the live site",
      "[TO FILL] Review queue: how many items wait and for how long",
      "[TO FILL] Share of decisions made right in the list",
      "[TO FILL] Share of complaints handled on time",
    ],
  },
  takeaways: [
    "Two prototypes on opposite ideas gave more than one \"average\" prototype would: the test showed where the line between routine and a doubtful case runs.",
    "Learn the engineering limits before the mock-ups: here that conversation produced the main decision.",
  ],
  quote: "A decision right in the list saves clicks. And clicks are what a moderator's working day is made of.",
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
      title: "Profile and confirmation of an important action",
      before: img(F + "moderator-profile.webp", 1440, 861, "User profile"),
      after: img(F + "moderator-confirm.webp", 1440, 861, "Confirmation before taking a request into work"),
      labels: ["Context", "Confirmation"],
    },
  ],
  deepDives: [],
};
