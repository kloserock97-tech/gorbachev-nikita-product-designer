/* v41: рассказ кейса «Кабинет модератора» на двух языках.
   Источник — Main cases/Moderator-cabinet.html и EN/Moderator-cabinet.en.html.
   v56: тексты переписаны простым языком, факты и цифры те же. */
import type { CaseStory, CaseImage } from "../caseStory";

const img = (src: string, w: number, h: number, caption: string, kind = "screen"): CaseImage => ({ src, w, h, caption, kind });
const F = "cases/figma/";
const M = "cases/moderator-dashboard/";

export const en: CaseStory = {
  id: "moderator-dashboard",
  hero: {
    kicker: "B2B dashboard · Mos.ru · 2024",
    title: "Moderator Dashboard",
    tagline: "I gave the moderator one workplace for everything they check.",
    summary:
      "The Community site kept growing, and residents wrote more and more. One administrator checked all of it, in the same admin panel that runs the whole site. I made the moderator a separate role with a workplace of their own. Comments, users, publications, groups and posts are all checked there in the same way, and the obvious cases can be settled right in the list. I tested it with real people: eight moderators, two prototypes.",
    facts: [
      ["Role", "UX designer"],
      ["Company", "Moscow Department of Information Technology (DIT)"],
      ["Timeline", "2024"],
      ["Platform", "Web, desktop"],
    ],
    tags: ["B2B", "GovTech", "Research", "Usability test"],
  },
  kpis: [
    { value: "−38%", label: "steps to check one comment" },
    { value: "−32%", label: "time on the same task" },
    { value: "4.3 of 5", label: "moderators' rating in the test" },
    { value: "5 types", label: "of items checked in one way" },
  ],
  context: {
    lead: "The site grew faster than one administrator could keep up.",
    text:
      "The city-stories site on Mos.ru became popular, and residents started writing a lot: comments, publications, complaints. All of it landed on a single administrator, who dug through the pile in the same admin panel where everything else gets done. Picture a mailbox where letters, bills and adverts lie in one stack.\n\nA ban button would not have helped. The moderator needed a role and a workplace of their own. They check different things: comments, users, publications, groups, posts. I wanted all of them to be handled in one and the same way.",
    team: [
      { who: "Sasha, analyst", how: "Wrote down what the dashboard must be able to do. I turned those requirements into screens and the order of actions." },
      { who: "Engineering", how: "I talked to the developers before the first mock-ups. I wanted to know what could be built into the current system and what would have to wait. Learning the limits early is cheaper than redrawing later." },
      { who: "Parent product", how: "The dashboard continues the Community case. The shared review queue I set up there grew into a separate workplace here." },
    ],
    myRole:
      "Research (taking apart the current admin panel and similar systems, hypotheses, a test with moderators), the logic of the work, mock-ups and prototypes, one way of working for every type of item and the groundwork for the remaining sections.",
  },
  research: {
    lead: "Two prototypes built on opposite ideas, eight moderators and one conclusion.",
    methods: [
      {
        kind: "Admin panel audit",
        title: "How they work today",
        question: "Where does a moderator's time go in the general admin panel?",
        sample: "The existing admin panel and functional references",
        finding:
          "Comments lay in one big pile, and nobody could tell where to start. Even a short, obvious comment (\"thanks\", plain spam) had to be opened on a separate page. For a disputed one you had to find by hand what it was written under and what the author had posted before.",
      },
      {
        kind: "Engineering interviews",
        title: "What can be built in",
        question: "What can be done in the current system, and what will have to wait?",
        sample: "The development team, before mock-ups",
        finding: "The dashboard is built on top of the current admin panel, so new sections have to be added to one template. That gave the idea: one way of working for everything a moderator checks.",
      },
      {
        kind: "Moderated testing",
        title: "Prototype against prototype",
        question: "What leads to a decision faster: a detailed comment page or buttons right in the list?",
        sample: "8 moderators, 2 prototypes, 10 hypotheses (seven and three)",
        finding:
          "Neither idea won on its own. Both together did. Think of a ticket inspector on a train: most tickets get a glance, and a doubtful one gets a careful look. A moderator settles the obvious in the list and opens the detailed page for the doubtful. The most common praise was \"you don't have to dive in anywhere\".",
      },
    ],
    hypotheses: {
      intro: "Prototype 1 was a detailed comment page with all the context (seven hypotheses). Prototype 2 was a decision right in the list (three hypotheses). These three settled it:",
      items: [
        { text: "I want to see the comments that are waiting for a check straight away, so I don't waste time searching.", verdict: "Prototype 2", won: true },
        { text: "A short, clear comment I want to rate right in the list, without opening a page.", verdict: "Prototype 2", won: true },
        { text: "A disputed comment needs context: the post, the author, the reply thread and the complaints, all on one screen.", verdict: "Prototype 1", won: true },
      ],
      measured: "We looked at three things. Did the person reach the goal, and in how many steps. How much time it took, and how many mistakes and hesitations there were. And how comfortable it felt, on a 1 to 5 scale.",
    },
  },
  decisions: {
    lead: "Decisions that took extra steps away from the moderator. Each grew out of something I noticed and was tested with people.",
    items: [
      {
        id: "registry",
        title: "A list sorted by status",
        found: "In the general admin panel comments lay in one big pile, and the moderator could not tell where to start.",
        did: "I split the list into tabs: \"Awaiting review\", \"Reviewed\", \"Unwanted\", \"Reported\", \"Sent to manager\". Like letters in folders: you see at once what needs attention.",
        effect: "In the test moderators found the right group of comments on the first try.",
        why: "A moderator opens the dashboard with one question: what is waiting for me. A tab answers it straight away, with no need to read the whole list.",
        basis: "The audit of the current admin panel and a test with eight moderators: hypothesis 01 held. Shneiderman's rule: overview first, details later.",
      },
      {
        id: "inline",
        title: "A decision right in the list",
        found: "A short, obvious comment needs no investigation, but before, each one had to be opened on a separate page.",
        did: "I moved the decision buttons into the list itself. The obvious gets closed on the spot: one click where there used to be five.",
        effect: "Most of the time saved came from here. Routine no longer means jumping between pages.",
        why: "An obvious comment does not deserve a page of its own. The button sits where the person is already looking.",
        basis: "A test of two prototypes with eight moderators: hypothesis 02 went to the decision in the list, prototype 2 won. Fitts's law: a big, close button is quicker to reach.",
      },
      {
        id: "card",
        title: "A detailed page for the doubtful cases",
        found: "A disputed comment lacked context. The original post and the author's history had to be found by hand.",
        did: "I put everything needed for a decision on one page: the text of the post, a short note on the author and their reputation (karma), the reply thread, the history of work on this comment and the complaints. I added sorting by popular comments and by authors with low reputation.",
        effect: "A hard comment gets decided on one screen.",
        why: "A doubtful case can only be settled with context. When context has to be hunted across tabs, people decide by guesswork.",
        basis: "The test: hypothesis 03 went to the detailed page, prototype 1. Shneiderman's rule: details on demand, not all at once.",
        image: img(M + "01.webp", 1600, 1200, "Comment page: actions on top, the post, the author, the reply thread, history and complaints"),
      },
      {
        id: "mechanism",
        title: "One way of working for everything",
        found: "A moderator checks five different things, and the general admin panel handles each in its own way.",
        did: "I made the same order of actions for comments, users, publications, groups and posts. Statuses and rejection reasons are shared. A new type is added to the same template.",
        effect: "A moderator learns the dashboard once. When a new section appears there is nothing to relearn, and the team does not have to invent a new interface for it.",
        why: "One order of actions gets recognised, not recalled. Nobody has to keep five different ways in their head.",
        basis: "Engineering interviews: sections are assembled from one template. Nielsen's consistency rule: the same thing looks and works the same way.",
      },
    ],
  },
  results: {
    lead: "Fewer steps, less time on every check.",
    points: [
      "Checking a comment now takes 38% fewer steps, mostly thanks to the decision right in the list",
      "The same task takes 32% less time",
      "The winning prototype scored 4.3 out of 5. The most common praise was \"you don't have to dive in anywhere\"",
      "Five types of items are checked in one and the same way",
    ],
    honesty: "These are results of a test on a prototype. I have no numbers from the live site: the dashboard went into development based on these mock-ups.",
  },
  roadmap: [
    { kicker: "Section", title: "Users", text: "A user page with reputation and a history of violations. Moderators will check the people who write comments as well as the comments." },
    { kicker: "Sections", title: "Publications and groups", text: "The same statuses and the same way of working for publications, groups and posts. The scheme is ready. What is left is laying it out on screens." },
    { kicker: "Handoff", title: "Handoff to engineering", text: "The logic and the elements are described so that developers can build the dashboard piece by piece without asking about every screen." },
  ],
  takeaways: [
    "Two prototypes built on opposite ideas gave more than one \"average\" prototype would. The test showed that both ideas are needed at once, and where the line between routine and a doubtful case runs.",
    "I asked the developers about technical limits before the mock-ups. That is cheaper than redoing them later.",
  ],
  quote: "A decision right in the list saves clicks. And clicks are what a moderator's working day is made of.",
  gallery: [
    {
      kind: "spot",
      title: "The same list for another section: users",
      image: img(F + "moderator-queue.webp", 1440, 1156, "User queue with filters, assignees, statuses and complaints", "hero"),
      spots: [
        { x: 27, y: 11.6, text: "Statuses are tabs: the queue is sorted into folders", decision: "registry" },
        { x: 40, y: 18.3, text: "Filters by ID, name, assignee, status and period", decision: "registry" },
        { x: 66.5, y: 33.1, text: "The status shows right in the row, no need to open the page", decision: "inline" },
        { x: 94, y: 26.8, text: "Complaints have their own column, and you can sort by it", decision: "mechanism" },
      ],
    },
    {
      kind: "compare",
      title: "Profile and confirmation of an important action",
      before: img(F + "moderator-profile.webp", 1440, 861, "User profile: what they wrote and what is linked to them"),
      after: img(F + "moderator-confirm.webp", 1440, 861, "Confirmation before a moderator takes a request into work"),
      labels: ["Context", "Confirmation"],
    },
  ],
  deepDives: [],
};
