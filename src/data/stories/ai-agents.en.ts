/* v86: кейс «Риски ИИ-агентов» вынесен из caseStory.en.ts в свой файл и переписан вслед за русской версией:
   повторы вычищены, метрики дизайнерские и продуктовые. Места с пометкой [TO FILL] Никита заполнит сам.
   v89: сокращён вслед за русской версией по docs/prompts/case-copy-edit.md.
   23.10: метрики утвердил Никита: остались 6 → 0 ручных передач и 4 → 1 шагов, остальные метрики-результаты и [TO FILL] убраны. */
import type { CaseStory, CaseImage } from "../caseStory";

const img = (src: string, w: number, h: number, caption: string, kind = "screen"): CaseImage => ({ src, w, h, caption, kind });
const A = "cases/ai-agents/";

export const en: CaseStory = {
  id: "ai-agents",
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
  /* design metrics backed by the process map and the mock-ups; product metrics sit in the Outcome */
  kpis: [
    { value: "6 → 0", label: "manual handoffs on a version's assessment route" },
    { value: "4 → 1", label: "preparation steps before the first assessed risk" },
  ],
  context: {
    lead: "AI agents landed on top of an old banking procedure.",
    text:
      "Risk assessment in a bank is a multi-stage, bureaucratic procedure. AI added a new area of risk to it, one the bank was only starting to study.\n\nEvery AI agent has several versions and its own owner. Four departments examine the risk, and the final score is built from their conclusions. As the bank and the number of approvers grew, the chain got harder to follow.",
    roles: [
      { who: "Assessment process owner", needs: "every agent is checked before it goes to work, and the checks keep up with new releases." },
      { who: "Risk manager", needs: "to get on with assessing risks, with no archive building or file forwarding." },
      { who: "Four approving departments", needs: "to see exactly what they are checking without asking again." },
      { who: "Agent owners", needs: "to know which step the approval is on and when it will end." },
    ],
    constraints: [
      { title: "Auditability", text: "For every decision it must be clear who made it, when and on what grounds." },
      { title: "The bank's design system", text: "We do not invent new components: development is cheaper and learning is shorter." },
      { title: "A stream of versions", text: "Agent versions change almost every day, and the interface has to keep that pace." },
      { title: "No process diagram", text: "Research and design overlapped: I designed while finding out how things worked." },
    ],
  },
  approach: {
    lead: "The mock-ups waited until there was a process map.",
    text:
      "The field was new and specific, tasks land on the staff without a pause, and the route I had to carry into an interface turned out to be very tangled. So my first move was a map of roles and handoffs, and the product structure grew out of it.",
    image: img(A + "08.webp", 1600, 788, "Design sprint board: a review column between design and development", "detail"),
  },
  research: {
    lead: "First I questioned people, then I showed them prototypes, and at the end we timed real assessments.",
    methods: [
      {
        kind: "Stakeholder interviews",
        question: "Who hands what to whom, and where does work wait for a person?",
        sample: "Four people held the knowledge, many rounds",
        finding:
          "My method was frequency: I kept coming back with a new version of the map and asking where I had got it wrong. The time was eaten by preparation, long before the assessment itself: gathering documents, waiting for an export, forwarding, waiting for an upload.",
      },
      {
        kind: "Prototype tests",
        question: "Which prototype best reflects the real route of approving a risk?",
        sample: "The same stakeholders, prototypes before development",
        finding:
          "I built the approval route as prototypes in different layouts and, before development, checked with the stakeholders which one read most easily. The one that moved forward was the variant in which they recognised their everyday work.",
      },
      {
        kind: "Timing in real work",
        question: "What is faster: handoffs between people along the old route, or work in the new interface?",
        sample: "The same risks taken along both routes",
        finding:
          "We ran the same risks in parallel along both routes: the old way through Excel, Jira and direct messages, and in the new interface. And we timed them. On the old route each handoff took 20 minutes or more, plus waiting for the next person. In the interface there were no handoffs left.",
      },
    ],
  },
  /* v87: the before and after diagram is folded inside the Decisions */
  flow: {
    title: "User journey: before / after",
    folded: true,
    before: {
      title: "Before: Jira, Excel, portal, archives, email",
      steps: [
        { who: "Risk manager", step: "Gets an assessment task in Jira", note: "No data for it yet" },
        { who: "Administrator", step: "Makes an Excel export of agents from the systems catalogue", note: "By hand and only on request", wait: true },
        { who: "Administrator", step: "Forwards the export to the internal portal", note: "Leaves no trace", wait: true },
        { who: "Risk manager", step: "Packs the program code and business requirements into an archive", note: "No way to check that everything is there" },
        { who: "Risk manager", step: "Sends the archive to the portal", note: "Another wait", wait: true },
        { who: "Administrator", step: "Uploads the agent and the version", note: "The bottleneck: it all rests on one person", wait: true },
      ],
      summary: "Two people busy with preparation alone, waiting between the steps. And this is a shortened diagram.",
    },
    after: {
      title: "After: one product from request to approval",
      steps: [
        { who: "Risk manager", step: "Opens the shared list and sees the queue", note: "A summary on top: total, assessed, in progress" },
        { who: "Risk manager", step: "Creates an assessment and attaches the archive right in the card", note: "No administrator, no forwarding" },
        { who: "System", step: "Draws up the risk list from the documents", note: "The draft is ready before the person sits down to work" },
        { who: "Risk manager", step: "Edits levels and reasons, marks what does not fit as \"not applicable\"", note: "The reason stays next to the risk" },
        { who: "Four departments", step: "Add their conclusions in the same card", note: "The final score is calculated automatically" },
        { who: "Manager", step: "Approves the version", note: "Everyone sees the status" },
      ],
      summary: "The forwarding, manual export, archive packing and go-between administrator are gone: the risk manager uploads the documents and edits a ready draft.",
    },
  },
  decisions: {
    lead: "In an internal product the argument \"people are used to it\" does not work: there are few users, and you argue with methodologists and the security team. So for each decision below I brought an argument: an answer from the developers or a known usability rule.",
    items: [
      {
        id: "summary",
        title: "A summary above the list",
        found: "The list answered \"what do we have\", and work starts with \"what do I pick up\". The volume was counted row by row.",
        did: "Four tiles: all agents with growth over the month, assessed, in assessment, and the split by risk level.",
        effect: "The day starts with an answer you can show a manager without a report.",
        why: "In the morning a risk manager needs the overall workload, and drills into a specific agent later. It is Shneiderman's well-known mantra: overview first, then filtering and details on demand.",
      },
      {
        id: "filter",
        title: "A filter that works at once",
        found: "Many fields to filter by (assessment type, department, risk level, status, two pairs of dates), little room, and the combination is found by trial and error.",
        did: "I made two options: an instant one and one with a \"Show 235 results\" button. We chose the first: selected values show as labels and come off one by one.",
        why: "People find the right combination of fields by trial and error, and an extra click on \"Show\" after every try only gets in the way. The labels mean nobody has to keep the selection in their head: as Nielsen puts it, recognising is easier than recalling.",
        basis: "The developers' answer: a request to the list is cheap.",
      },
      {
        id: "numbers",
        title: "A switch for short numbers",
        found: "Forty loss amounts exact to the rouble on one screen, though people only compare them.",
        did: "A header switch turns \"1,000,000 ₽\" into \"1M ₽\", and exact figures are one click away.",
        why: "In a list people compare amounts by eye, by order of magnitude, and count them to the kopeck later in a report. So the numbers are short by default.",
      },
      {
        id: "sort",
        title: "Sorting with four items",
        found: "The list has two real questions: \"what is new\" and \"what is on fire\". The filter handles the rest.",
        did: "Newest, oldest, high level, low level. The current item has a tick, and its name is on the button.",
        why: "Each of the two questions needs just a pair of items: newest and oldest, high and low level. The fewer the items, the faster the choice, which is Hick's law.",
      },
      {
        id: "na",
        title: "\"Not applicable\" only with a reason",
        found: "Some of the 13 risks do not apply to an agent. This used to be settled in email and forgotten a month later, and in a regulated setting someone is bound to ask.",
        did: "Until the reason is written, the \"Accept\" button stays inactive. The risk stays in the list with its comment and a \"Restore\" button, which also needs an explanation.",
        effect: "The history of decisions builds up by itself, with the reason kept next to the risk.",
        why: "A decision cannot be saved without a reason, and a mistaken \"not applicable\" is easy to undo: the risk stays in the list, only its status changes.",
        image: img(A + "05.webp", 1440, 900, "\"Risk not applicable\": the button works only with a reason", "detail"),
      },
      {
        id: "auto",
        title: "A risk draft from the documents",
        found: "Thirteen sets of reasons from scratch take hours, while much of it is already in the uploaded files.",
        did: "The system drafts the risks from the archive. While it works, the screen shows progress and skeletons of the risks, and the empty state points to the next step.",
        why: "Parsing an archive takes longer than 10 seconds, and around that point people drift off. The progress and placeholders show that the system has not frozen (Nielsen calls this visibility of system status).",
        image: img(A + "03.webp", 1440, 900, "Parsing the archive: progress and risk placeholders"),
      },
      {
        id: "unsaved",
        title: "Protecting unfinished work",
        found: "The reasons for a risk run to several paragraphs, and a stray click could cost half an hour of work.",
        did: "Leaving with unsaved edits brings up \"Leave the form?\", with buttons labelled in words and kept apart.",
        why: "Once you leave, the typed text is gone, and it took half an hour to write. In that case one extra question pays for itself.",
      },
    ],
  },
  mistakes: {
    lead: "Two mistakes that cost a redo.",
    items: [
      {
        title: "I started designing from the top down",
        decided: "General to particular: the list, the agent card, the version's risks, a single risk.",
        wrong: "The lowest layer sets the rules. A single risk had states the upper screens did not know: \"not applicable\", \"partly ready\", conclusions arriving at different times. The shared list had to be redone.",
        out: "I described the life cycle of one risk with every transition and built the screens bottom up, almost without argument.",
        changed: "In a nested system I start from the deepest level: that is where you see every state the upper screens will have to show.",
      },
      {
        title: "I thought one person does the assessment",
        decided: "The assessment is the risk manager's work, and approval is one button at the end.",
        wrong: "There are four approvers, each at their own pace. In my scheme a version was either \"in assessment\" or \"approved\", and in real life it got stuck in between.",
        out: "I separated the departments' conclusions from the final score. That brought in-between statuses, a return for correction and a \"no assessment\" mark.",
        changed: "Before mock-ups I draw who touches the object and when. This mistake cost more: the data model had to change.",
      },
    ],
  },
  results: {
    lead: "What changed in the process.",
    intro: "I counted both numbers from the before and after map and the mock-ups.",
    outcomes: [
      { x: "Manual handoffs on the assessment route: 6 → 0", y: "Handoffs between people on the process map, checked with the managers.", z: "Document upload and the risk draft inside the product." },
      { x: "Preparation steps before the first assessed risk: 4 → 1", y: "It used to be an export, an archive and two forwards. Now it is one upload screen.", z: "The draft and the version's passport in one card." },
    ],
    /* 23.10: метрики утвердил Никита: только 6 → 0 и 4 → 1; «0 decisions without a reason» и строки [TO FILL] удалены */
    points: [],
    honesty: "The numbers on the screenshots (639 agents, 142 assessed) are demo data from the mock-up.",
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
  takeaways: [
    "At first I understood nothing about bank risk management. The people who could best explain where it hurt were the ones working in the process every day. Once I laid out their work step by step, the bank procedure became a system an outsider can find their way around.",
  ],
  gallery: [
    {
      kind: "spot",
      title: "The list of assessments: four decisions on one screen",
      image: img(A + "t-registry-assessments.webp", 1440, 900, "Risk assessment list"),
      spots: [
        { x: 90.2, y: 13.2, text: "Short numbers", decision: "numbers" },
        { x: 28.3, y: 26.4, text: "Filter labels", decision: "filter" },
        { x: 89.2, y: 34.4, text: "Current sorting on the button", decision: "sort" },
        { x: 52.2, y: 51.4, text: "Four loss amounts per card", decision: "numbers" },
      ],
    },
    {
      kind: "spot",
      title: "The list of agents: a summary above the list",
      image: img(A + "01.webp", 1440, 900, "The shared list of AI agents"),
      spots: [
        { x: 35, y: 32.9, text: "Total, assessed, in assessment, growth", decision: "summary" },
        { x: 52.2, y: 45.8, text: "Risk levels", decision: "summary" },
        { x: 89, y: 61.9, text: "Version status right in the list" },
      ],
    },
    {
      kind: "compare",
      title: "The filter: two options",
      before: img(A + "t-filter-v1-panel-set.webp", 500, 900, "Option 1: works at once", "detail"),
      after: img(A + "t-filter-v2-panel.webp", 500, 1140, "Option 2: a \"Show\" button", "detail"),
      labels: ["Works at once · chosen", "\"Show\" button"],
    },
    {
      kind: "film",
      title: "Editing a risk",
      image: img(A + "07.webp", 1200, 1800, "Level, reasons and a required comment"),
    },
    {
      kind: "bento",
      title: "More screens",
      images: [
        img(A + "02.webp", 1440, 900, "An agent card before assessment"),
        img(A + "t-sort-open.webp", 1440, 900, "The sorting menu", "detail"),
        img(A + "t-agent-card-generating.webp", 910, 500, "Uploading from the agent card", "detail"),
        img(A + "t-registry-shimmer.webp", 1180, 470, "Uploading from the shared list", "detail"),
      ],
    },
  ],
  /* deep dives repeated the decisions almost word for word, so they are hidden; the texts in caseTracks.en.ts stay */
  deepDives: [],
};
