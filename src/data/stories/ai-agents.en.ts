/* v86: кейс «Риски ИИ-агентов» вынесен из caseStory.en.ts в свой файл и переписан вслед за русской версией:
   повторы вычищены, метрики дизайнерские и продуктовые.
   v89: сокращён вслед за русской версией по docs/prompts/case-copy-edit.md.
   23.10: метрики утвердил Никита: остались 6 → 0 ручных передач и 4 → 1 шагов.
   26.10: the GRIF template, mirroring the Russian version (see the comment there). */
import type { CaseStory, CaseImage } from "../caseStory";

const img = (src: string, w: number, h: number, caption: string, kind = "screen"): CaseImage => ({ src, w, h, caption, kind });
const A = "cases/ai-agents/";

export const en: CaseStory = {
  id: "ai-agents",
  compact: true,
  hero: {
    kicker: "Internal product · Risk management · Sber · 2025",
    title: "AI agent risks",
    tagline: "I moved the risk assessment of AI agents out of Jira, Excel and email into one product with no manual handoffs.",
    summary:
      "I traced, step by step, a tangled bank approval procedure that ran through Jira, Excel, an internal portal and direct messages, and built a simple interface out of it. The product was built for the bank's staff, and later the bank decided to take it to market.",
    facts: [
      ["Role", "Product designer, the only one on the product"],
      ["Company", "Sber"],
      ["Timeline", "2025, two-week sprints"],
      ["Platform", "Web, internal"],
    ],
    tags: ["Enterprise", "AI / ML", "Risk management", "B2B"],
  },
  /* design metrics backed by the process map and the mock-ups. 26.10: the Outcome section is gone, the numbers stay here */
  kpis: [
    { value: "6 → 0", label: "manual handoffs on a version's assessment route" },
    { value: "4 → 1", label: "preparation steps before the first assessed risk" },
  ],
  /* 26.10: goals are built from the former roles, constraints are the same four; scenes in src/ui/contextArt/ai-agents.ts */
  context: {
    lead: "",
    goals: [
      "Every agent is checked before it goes to work, and the checks keep up with new versions.",
      "The risk manager assesses risks on their own, with no archive building or file forwarding.",
      "The four departments see exactly what they are checking, without asking again.",
      "An agent's owner knows which step the approval is on and when it will end.",
    ],
    art: { goals: ["versions", "upload", "depts", "stepper"], constraints: ["audit", "ds", "stream", "nomap"] },
    constraints: [
      { title: "Auditability", text: "For every decision it must be clear who made it, when and on what grounds." },
      { title: "The bank's design system", text: "We do not invent new components: development is cheaper and learning is shorter." },
      { title: "A stream of versions", text: "Agent versions change almost every day, and the interface has to keep that pace." },
      { title: "No process diagram", text: "Research and design overlapped: I designed while finding out how things worked." },
    ],
  },
  /* 26.10: the Approach and the before / after diagram are gone: the diagram's point now sits in finding F1 and the first decision */
  interludes: [],
  research: {
    lead: "",
    methods: [
      {
        kind: "Stakeholder interviews",
        question: "Who hands what to whom, and where does work wait for a person?",
        sample: "Four people held the knowledge, many rounds",
        finding: "My method was frequency: I kept coming back with a new version of the map and asking where I had got it wrong.",
        insights: [
          { id: "F1", text: "The time is eaten by preparation, not by the assessment itself: gathering documents, waiting for an export, forwarding, waiting for an upload." },
        ],
      },
      {
        kind: "Prototype tests",
        question: "Which prototype best reflects the real route of approving a risk?",
        sample: "The same stakeholders, prototypes before development",
        finding: "I built the approval route as prototypes in different layouts and, before development, checked with the stakeholders which one read most easily.",
        insights: [
          { id: "F2", text: "The route reads well when people recognise their everyday work in it: the layout that moved forward was the one where the stakeholders did." },
        ],
      },
    ],
  },
  /* 26.10: seven decisions merged into four without losing facts */
  decisions: {
    lead: "",
    items: [
      {
        id: "auto",
        insight: "F1",
        title: "Documents and the risk draft live inside the product",
        found: "If uploading documents and drafting the risks happen in the product itself, preparation will stop eating the time: thirteen sets of reasons from scratch take hours, while much of it is already in the uploaded files.",
        did: "The risk manager attaches the archive in the agent card, with no administrator and no forwarding, and the system drafts the risks from it. Parsing takes longer than 10 seconds, so the screen shows progress and risk placeholders, and the empty state points to the next step.",
        image: img(A + "03.webp", 1440, 900, "Parsing the archive: progress and risk placeholders"),
      },
      {
        id: "summary",
        title: "The list starts with “what do I pick up”",
        found: "The list answered “what do we have”, and work starts with “what do I pick up”. The volume was counted row by row, and the list has two real questions: “what is new” and “what is on fire”.",
        did: "Four tiles above the list: all agents with growth over the month, assessed, in assessment, and the split by risk level. Sorting has four items: newest, oldest, high level, low level; the current one has a tick and its name is on the button.",
        image: img(A + "01.webp", 1440, 900, "A summary above the agent list, and sorting"),
      },
      {
        id: "filter",
        title: "The filter works at once, the amounts are short",
        found: "Many fields to filter by (assessment type, department, risk level, status, two pairs of dates), little room, and the combination is found by trial and error. Forty loss amounts exact to the rouble on one screen, though people only compare them.",
        did: "I made two filter options: an instant one and one with a “Show 235 results” button. We chose the first: the developers said a request to the list is cheap. Selected values show as labels and come off one by one. A header switch turns “1,000,000 ₽” into “1M ₽”, and exact figures are one click away.",
        image: img(A + "t-registry-assessments.webp", 1440, 900, "The assessment list: filter labels, sorting and short amounts"),
      },
      {
        id: "na",
        title: "“Not applicable” only with a reason, unfinished work is safe",
        found: "Some of the 13 risks do not apply to an agent. This used to be settled in email and forgotten a month later, and in a regulated setting someone is bound to ask. The reasons for a risk run to several paragraphs, and a stray click could cost half an hour of work.",
        did: "Until the reason is written, the “Accept” button stays inactive. The risk stays in the list with its comment and a “Restore” button, which also needs an explanation. Leaving with unsaved edits brings up “Leave the form?”, with buttons labelled in words and kept apart.",
        image: img(A + "05.webp", 1440, 900, "“Risk not applicable”: the button works only with a reason", "detail"),
      },
    ],
  },
  /* 26.10: before = the registry screen from the 2025 boards, after = 01.webp; button contrast measured on the pixels of both */
  compare: {
    title: "The agent registry: the 2025 mock-up and the final",
    lead: "The registry screen in the mock-up from the 2025 boards and the same screen in the final. Hover a note to see its spot on the screen.",
    before: {
      title: "The 2025 mock-up",
      image: img(A + "compare-before.webp", 1440, 900, "The agent registry in the 2025 mock-up: a mint button, the summary and the list"),
      notes: [
        { id: "a-nav", kind: "about", side: "left", text: "Sidebar", extra: "The product's sections", rects: [[0, 0, 0.044, 1]] },
        { id: "a-summary", kind: "about", side: "left", text: "Summary", extra: "All agents, assessed, in assessment", rects: [[0.111, 0.309, 0.825, 0.089]] },
        { id: "a-levels", kind: "about", side: "left", text: "Risk levels", extra: "How many agents sit at each level", rects: [[0.111, 0.448, 0.825, 0.071]] },
        { id: "a-create", kind: "about", side: "right", text: "The “Create assessment” button", rects: [[0.835, 0.123, 0.095, 0.044]] },
        { id: "a-list", kind: "about", side: "right", text: "Agent list", extra: "Name, department, version, status", rects: [[0.101, 0.597, 0.847, 0.222]] },
        { id: "m-subtitle", kind: "mine", side: "left", text: "The subtitle retells what you can do on the page", rects: [[0.117, 0.146, 0.462, 0.044]] },
        { id: "m-meta", kind: "mine", side: "left", text: "Department, line of business and version are scattered across the row", rects: [[0.117, 0.651, 0.392, 0.024]] },
        { id: "m-button", kind: "mine", side: "right", text: "White text on the mint button is barely readable", extra: "1.88 : 1 against the 4.5 norm (WCAG AA)", rects: [[0.835, 0.123, 0.095, 0.044]] },
        { id: "m-numbers", kind: "mine", side: "right", text: "The summary numbers do not add up", extra: "5 + 3 + 5 + 5 by level against 142 assessed, “of 500” with 639 agents, “Total: 122 objects”", rects: [[0.111, 0.309, 0.825, 0.089], [0.111, 0.448, 0.825, 0.071], [0.101, 0.553, 0.094, 0.024]] },
      ],
    },
    after: {
      title: "Final",
      image: img(A + "01.webp", 1440, 900, "The agent registry in the final: a dark green button, the summary adds up, sorting above the list"),
      notes: [
        { id: "m-subtitle", kind: "mine", side: "left", text: "The subtitle says what the screen is for: how much is assessed and what to pick up first", rects: [[0.117, 0.148, 0.396, 0.022]] },
        { id: "m-meta", kind: "mine", side: "left", text: "The agent's details sit in one row, one after another", rects: [[0.117, 0.64, 0.313, 0.024]] },
        { id: "m-button", kind: "mine", side: "right", text: "The button is dark green, and white text reads well", extra: "4.67 : 1 instead of 1.88", rects: [[0.828, 0.099, 0.099, 0.044]] },
        { id: "m-numbers", kind: "mine", side: "right", text: "The summary adds up", extra: "9 + 31 + 58 + 44 = 142 assessed of 639", rects: [[0.111, 0.284, 0.822, 0.089], [0.111, 0.422, 0.822, 0.071], [0.101, 0.536, 0.09, 0.024]] },
        { id: "m-sort", kind: "mine", side: "right", text: "Sorting sits right above the list", extra: "“Newest first”", rects: [[0.831, 0.529, 0.114, 0.038]] },
      ],
    },
  },
  /* 26.10: timing on real assessments is a check of the finished product, moved here from the research */
  validation: {
    lead: "I checked it on real assessments.",
    stages: [
      {
        kicker: "Timing",
        title: "The same risks along two routes",
        text: "We ran the same risks in parallel: the old way, through Excel, Jira and direct messages, and in the new interface, and timed them. On the old route each handoff took 20 minutes or more, plus waiting for the next person. In the interface there were no handoffs left.",
      },
    ],
  },
  /* v114: prototype from the mock-ups — the risk manager's main flow: registry → agent → archive → draft → risk card → edit. Card and edit are frames 30:2 and 30:332 from Figma XomA0T1zFMATidI4Qq5nEw */
  prototype: {
    title: "Assess the risks of a new agent",
    lead: "Walk the risk manager's route from the agent registry to the first reviewed risk in the draft.",
    live: "ai-agents",
    device: "browser",
    steps: [
      { image: img(A + "01.webp", 1440, 900, "The list of all AI agents"), spot: [0.255, 0.62], action: "Open an agent from the registry", why: "Above the registry sits a summary: how many agents there are, how many are assessed and how many are in progress." },
      { image: img(A + "02.webp", 1440, 900, "The agent card before assessment"), spot: [0.405, 0.824], action: "Upload the archive of the agent's documents", why: "The agent has no assessment yet. The documents are uploaded right here, with no administrator involved." },
      { image: img(A + "03.webp", 1440, 900, "Reading the archive"), wait: 2600, action: "Wait while the model reads the archive", why: "While the parsing runs, the screen shows progress and grey placeholders of the risks to come." },
      { image: img("cases/figma/agents-review.webp", 1520, 950, "The draft: 13 risks to review"), spot: [0.257, 0.613], action: "Open a risk from the draft", why: "The model suggested 13 risks with levels and reasons. It is a draft, and a person makes the call." },
      { image: img(A + "proto-risk-card.webp", 1440, 900, "The risk card"), spot: [0.697, 0.942], action: "Press Edit", why: "Next to the level sit the model's reasoning and the documents behind it: you can check it without leaving the card." },
      { image: img(A + "proto-risk-edit.webp", 1440, 900, "Level, reasoning and a required comment"), spot: [0.887, 0.942], action: "Adjust the level and write why", why: "The model's reasoning stays in view, and the risk manager must add their own. Unsaved text can only be left behind through \"Leave the form?\"." },
      { image: img("cases/figma/agents-review.webp", 1520, 950, "Risk reviewed: level and reasoning saved"), action: "Done: the level and the comment are saved", why: "The risk is marked as reviewed in the draft, and the comment stays in its history. The rest are waiting their turn." },
    ],
  },
  takeaways: [],
  gallery: [],
  /* deep dives repeated the decisions almost word for word, so they are hidden; the texts in caseTracks.en.ts stay */
  deepDives: [],
};
