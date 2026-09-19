/* v41: case stories, English. Same structure as caseStory.ru.ts, key for key.
   Texts come from the English case pages on Tilda (Main cases/EN/*.en.html) and the "Open to lead roles"
   deck, rewritten without the machine accent; facts and numbers untouched. Deep dives come from caseTracks.en.ts. */
import type { StorySet, CaseImage } from "./caseStory";
import tracks from "./caseTracks.en";
import { en as grif } from "./stories/grif-ai";
import { en as community } from "./stories/community";
import { en as moderator } from "./stories/moderator-dashboard";
import { en as spam } from "./stories/stop-spam";
import { en as house } from "./stories/electronic-house";

const img = (src: string, w: number, h: number, caption: string, kind = "screen"): CaseImage => ({ src, w, h, caption, kind });

const A = "cases/ai-agents/";

const stories: StorySet = {
  "ai-agents": {
    id: "ai-agents",
    hero: {
      kicker: "Internal product · Risk management · Sber · 2025",
      title: "AI agent risks",
      tagline: "Pulled AI agent risk assessment out of email threads and Excel into a single registry.",
      summary:
        "Agent versions changed almost daily, while the risk assessment lived in Jira tickets, Excel exports and archives people forwarded to each other. I removed six manual hand-offs from the route by moving document collection and the risk draft inside the product. The agent, its versions, thirteen risk types and the verdicts of four departments now live in one place, and everyone involved can see a version travel from new to approved.",
      facts: [
        ["Role", "Product designer, the only one on the product"],
        ["Company", "Sber"],
        ["Timeline", "2025, several two-week sprints"],
        ["Platform", "Web, internal"],
      ],
      tags: ["Enterprise", "AI / ML", "Risk management", "B2B"],
    },
    kpis: [
      { value: "6 → 0", label: "manual hand-offs in the assessment route" },
      { value: "13", label: "risk types for every agent version" },
      { value: "4", label: "departments give their verdict in one card" },
      { value: "20+ min", label: "cost of each removed hand-off step, waiting not included" },
    ],
    context: {
      lead: "Hundreds of agents, every check done by hand.",
      text:
        "An AI agent inside a bank is closer to an employee than to a chatbot: it registers self-employed clients, plans a conversation with a customer, tracks down debtors. Each one has a version, an owner, a person in charge, a lifecycle status and a record in the shared systems catalogue. And each one carries risks ordinary software never had: direct and data-borne prompt injections, supply-chain vulnerabilities in the models, decisions that affect each other across the bank's shared systems, an AI platform going down.\n\nFour departments assess such an agent, and it all rolls up into an integrated score. While there are few agents, this lives in email. Once there are many and versions update almost daily, email runs out, and shipping AI to production hits the ceiling with it.",
      origin:
        "The brief came from risk-function stakeholders as a symptom: noticeably more agents, versions updated almost daily, thirteen problem areas each, and nobody able to say quickly how ready a given version was. Nobody asked for a registry. What they said was \"we can't keep up and we can't see the big picture\". No process diagram existed in any form: the policy in one place, tasks in the tracker in another, and people holding the connection between them in their heads.",
      roles: [
        { who: "Assessment process owner", needs: "no agent reaching production unassessed, and assessment never becoming the emergency brake for all AI in the bank." },
        { who: "Risk manager", needs: "to stop building archives and forwarding files, and do the actual assessment instead." },
        { who: "Four approving departments", needs: "to see exactly what they are assessing without asking again. Each looks at risk from its own angle and at its own pace." },
        { who: "Agent owners", needs: "to know which step the assessment is on and when it will be done. For them it is an outside procedure." },
      ],
      constraints: [
        { title: "Auditability", text: "A regulated process: every decision leaves a trail of who, when and on what grounds. That is the frame the design has to fit inside." },
        { title: "The bank's design system", text: "No reinventing components: the closer to existing patterns, the cheaper the build and the less users have to learn." },
        { title: "Stream of changes", text: "Agent versions change almost every day, so the interface has to survive that stream." },
        { title: "No process diagram", text: "I had to design while we were still finding out what was going on. Discovery and design overlapped." },
      ],
      myRole:
        "I was the only product designer: discovery, the process map, information architecture, every screen with its states, and defending decisions in front of stakeholders. Engineering, analytics and risk methodology came from the team.",
    },
    approach: {
      lead: "Process first, screens second.",
      text:
        "The domain was new to me, the vocabulary foreign, and the users busy with their own jobs and in no mood to explain them a third time. The most expensive move in that situation is to start drawing before you understand who hands what to whom. So the first artefact was a role-based process map, and the screen grid grew out of it. The usual CJM did not fit, because the pain here lives in the seams between people: a user journey draws one hero, and this route has four.\n\nWe worked in two-week design sprints with a dedicated research column and a dedicated review column: no mock-up went to engineering until someone had looked at it.",
      rejected:
        "Going straight to a prototype and testing it with users. With two available stakeholders and no process diagram, a prototype test would have checked how usable the screens are, not whether the route itself was right.",
      levels: [
        { title: "Registry", text: "All agents and all assessments. Answers \"how many in total, how many done, what to grab first\": summary, filters, sorting, search." },
        { title: "Agent and its versions", text: "A card with the version passport: owner, person in charge, lifecycle status, catalogue record, attachments. The lifecycle lives here too: new → assessment → approval → approved, with branches for correction and reassessment." },
        { title: "The version's risk list", text: "Thirteen risk types with levels and rationales. The risk manager scans everything at once and spots what is contentious." },
        { title: "A single risk", text: "Level, rationale, verdicts from four departments, a \"not applicable\" status with a reason. The bottom level turned out to be the hardest: every contentious case in the process lives here." },
      ],
      image: img(A + "08.webp", 1600, 788, "Two-week design sprint board: a separate review column sits between design and development", "detail"),
    },
    research: {
      lead: "Four sources, because none was enough on its own.",
      methods: [
        {
          kind: "Stakeholder interviews",
          title: "How the process is meant to work",
          question: "Who hands what to whom, and where does work wait for a person?",
          sample: "Two people held the knowledge, many rounds",
          finding:
            "Depth came from frequency, not headcount: I kept coming back with a new version of the process map and asking where I had got it wrong. The key finding was that the expensive part of the route was not where I expected. The assessment itself takes reasonable time; preparation eats it: gathering documents, waiting for an export, forwarding, waiting for an upload.",
        },
        {
          kind: "Tracker reconstruction",
          title: "How it runs in real life",
          question: "Does the route people describe match what the tickets record?",
          sample: "Jira tasks over the project period",
          finding:
            "There was no process diagram, so I pieced the route together from tracker tasks and checked it with stakeholders. That became the \"before\" flow. A mismatch showed up immediately: in conversation the route was shorter than in the tasks. People did not count some steps as work: \"it's just two minutes to forward it\".",
        },
        {
          kind: "Timing each step",
          title: "What it costs in time",
          question: "Which is more expensive: work on a screen or a hand-off between people?",
          sample: "Six steps of the condensed route",
          finding:
            "Each hand-off cost twenty minutes or more of active work, and waiting piled up between steps while the next person noticed, opened, approved. That ratio of work to waiting became the main argument for removing hand-offs before touching the speed of any screen.",
        },
        {
          kind: "Benchmarks and heuristics",
          title: "What the industry does",
          question: "What do mature B2B systems put in the overview, and how do they show the audit trail?",
          sample: "Mature risk-management systems and complex internal registries",
          finding:
            "I took overview-first and a mandatory decision trail. I did not copy the overloaded tables with sorting on every column: for the user's two real questions that is just extra choice.",
        },
      ],
      noData: {
        title: "What to do when there is no data",
        text:
          "In an internal product some decisions have to be made without numbers: there are few users, analytics for a product that does not exist yet cannot exist, and there is usually nothing left to measure \"before\" with after the fact. What could not be measured: how many versions never reach assessment at all, how long an approving department sits on a risk, how often an assessment is sent back. In those spots I lean on three props.",
        props: [
          { title: "A proxy metric", text: "Instead of the unmeasurable \"how much we lose\" I counted manual hand-offs in the route: they are observable, and waiting time grows with them." },
          { title: "A written assumption", text: "Where there was no data at all, I wrote the assumption into the decision itself, so there was something concrete to challenge." },
          { title: "Testability after release", text: "For every assumption I noted what would disprove it once the system starts collecting its own statistics." },
        ],
      },
    },
    flow: {
      title: "Six manual hand-offs versus one screen",
      before: {
        title: "Before: Jira, Excel, portal, archives, email",
        steps: [
          { who: "Risk manager", step: "Gets an assessment task in Jira", note: "There is a task but no data for it: that still has to be gathered in the four steps below" },
          { who: "Administrator", step: "Pulls an Excel export of agents from the systems catalogue", note: "Manual export: it does not exist until someone asks", wait: true },
          { who: "Administrator", step: "Forwards the export to the internal portal", note: "Hand-to-hand transfer that leaves no trail", wait: true },
          { who: "Risk manager", step: "Packs the codebase and business requirements into an archive", note: "Done by hand, with no way to check it is complete" },
          { who: "Risk manager", step: "Forwards the archive to the portal", note: "Another hand-off, another wait", wait: true },
          { who: "Administrator", step: "Uploads the agent and the version", note: "Bottleneck: everything hinges on one person", wait: true },
        ],
        summary: "Six hand-offs, two people busy just with preparation, each step twenty-plus minutes of active work plus waiting in between. And that is the condensed version: in real life the route was longer.",
      },
      after: {
        title: "After: one product from request to approval",
        steps: [
          { who: "Risk manager", step: "Opens the registry and sees the queue", note: "Summary on top: how many in total, assessed, in progress" },
          { who: "Risk manager", step: "Creates an assessment and attaches the archive right in the card", note: "Upload happens inside the product, without an administrator or forwarding" },
          { who: "System", step: "Builds the risk list from the documents", note: "A draft assessment is ready before anyone starts working" },
          { who: "Risk manager", step: "Edits levels and rationales, marks contentious ones \"not applicable\"", note: "The reason is recorded in the system, not in someone's inbox" },
          { who: "Four departments", step: "Add their verdicts in the same card", note: "The integrated score calculates itself" },
          { who: "Head of unit", step: "Approves the version", note: "Everyone sees the status in the registry without asking" },
        ],
        summary: "Both forwarding steps, the manual export, the manual archive packing and the go-between administrator role all dropped out of the route. What is left is the work the process exists for: read, assess, justify.",
      },
    },
    decisions: {
      lead: "Every decision rests on a principle you can name out loud. In an internal product \"users are used to it\" does not fly: there are few users, their habits differ, and the people you argue with are methodologists and security.",
      items: [
        {
          id: "summary",
          title: "Summary above the list",
          found: "The registry answered \"what do we have\", but work starts with a different question: \"what do I grab first\". To gauge the volume, the risk manager counted rows by eye every time.",
          did: "Four tiles above the list: total agents with month-over-month growth, assessed, in assessment, and a separate row broken down by risk level. The list below now answers \"what to do\".",
          effect: "Getting to work starts with an answer, not a recount. The summary is something you can show a manager without opening anything else.",
          why: "Shneiderman's mantra for data-heavy interfaces: overview first, zoom and filter, then details on demand.",
          basis: "Interviews: \"how many in total and how many are done\" is the first question of every visit to the registry.",
          deepDive: "sort-summary",
        },
        {
          id: "filter",
          title: "Filter: two options, one chosen",
          found: "There are many fields to filter by: assessment type, owning department, risk level, status and two date ranges. There is no room on screen for them, and people build their filter set blind.",
          did: "I designed two options and presented them side by side. Option 1: a side panel, filters apply as you fill them in, applied values show up as chips and can be removed one by one. Option 2: multi-select and a \"Show 235 results\" button. We picked the first: results come back fast.",
          why: "Auto-apply wins when results are cheap and people build their set blind. Chips on the main screen follow Nielsen's \"recognition rather than recall\".",
          basis: "A question to engineering about query cost; see mistake 03 below.",
          deepDive: "filter-progress",
        },
        {
          id: "numbers",
          title: "Number simplification toggle",
          found: "Every card has four loss amounts. Across ten cards that is forty numbers, all accurate to the ruble, while people are only comparing them.",
          did: "A switch in the header: \"1M ₽ instead of 1,000,000 ₽\". On, amounts read as orders of magnitude; off, they show exact figures.",
          effect: "The list became something you scan, not proofread. Precision is one click away, where it is needed.",
          why: "A number in a list and a number in a report have different jobs. So it is a toggle: both reading modes are available, and the one needed more often is on by default.",
        },
        {
          id: "sort",
          title: "Sorting in four options",
          found: "People have two real questions for the list: \"what's new\" and \"what's on fire\". Everything else is a job for the filter.",
          did: "Sort by: newest, oldest, high level first, low level first. Four options, the current one ticked, the chosen sort written on the button.",
          effect: "Sorting stopped being a setting and became a quick answer.",
          why: "Hick's law: decision time grows with the number of options. There are two questions, so four options are enough.",
          basis: "Benchmarks: sorting by every column looks generous, but for two questions it is extra choice.",
          deepDive: "sort-summary",
        },
        {
          id: "na",
          title: "\"Not applicable\" with a required reason",
          found: "Some of the thirteen risks do not apply to a given agent. People sorted this out in email, and a month later nobody could remember why a risk was not assessed. In a regulated process that is exactly the question someone will ask.",
          did: "A risk can be marked not applicable only with a written reason: while the field is empty, \"Accept\" stays disabled. A marked risk stays in the list with its comment and a \"Restore\" button, and restoring needs an explanation too.",
          effect: "The reason lives with the risk. The audit trail builds itself.",
          why: "Error prevention over error messages, plus reversibility: a marked risk changes state and is never deleted.",
          basis: "The auditability constraint: an auditor asks why something was decided as often as what was decided.",
          image: img(A + "05.webp", 1338, 648, "\"Risk not applicable\" dialog: the action unlocks only once a reason is written", "detail"),
        },
        {
          id: "auto",
          title: "Auto-generating risks from documents",
          found: "Writing thirteen rationales from scratch takes hours. A good chunk of what is needed is already in the documents the person just uploaded.",
          did: "While the system parses the archive, the screen shows progress and skeletons of the risks to come. The empty state before upload speaks too: \"you don't have any assessments yet\" and what to do next.",
          effect: "People start with a draft to check and fix. Editing is faster than writing.",
          why: "Visibility of system status plus response-time thresholds: past ten seconds attention wanders, and parsing an archive takes longer than that. Skeletons also hint at the shape of the result.",
          basis: "Timing: data preparation cost four steps of twenty minutes each.",
          image: img(A + "03.webp", 1600, 1078, "Parsing the archive: progress and skeletons of upcoming risks instead of a spinner"),
          deepDive: "filter-progress",
        },
        {
          id: "unsaved",
          title: "Protecting unfinished work",
          found: "A risk rationale is several paragraphs written slowly and carefully. Losing them to a stray click means losing half an hour.",
          did: "Leaving a form with unsaved edits is caught by a \"Leave the form?\" dialog with a clear split between cancel and leave.",
          effect: "Not a single \"I wrote it all and it's gone\", the kind of loss that makes people duplicate their work in a notepad.",
          why: "A confirmation belongs where an action is irreversible and costly; everywhere else it turns into noise. The destructive action is labelled with a word, not \"OK\".",
        },
      ],
    },
    mistakes: {
      lead: "What I planned wrong and how I got out of it.",
      intro: "Three decisions I had to redo, and what I do differently since.",
      items: [
        {
          title: "I started designing top-down",
          decided: "Go from general to specific: registry, agent card, risk list, a single risk last. The scope is clearer from the top, details can be picked up along the way.",
          wrong: "The bottom level turned out to be the source of the rules. A single risk had states the upper screens had not accounted for: not applicable, partially ready, assessed by four departments at different times. The registry showed states that do not exist in real life and had to be redone.",
          out: "I stopped and rebuilt the hierarchy bottom-up: described the full life of one risk, with all its states and transitions, and only then assembled the list, the card and the registry. The upper screens came together with almost no arguments.",
          changed: "In nested systems I start at the lowest data level. The entity the work revolves around sets the vocabulary of states; everything above is a way of showing it.",
        },
        {
          title: "I treated assessment as one person's action",
          decided: "Design assessment as the risk manager's job: open the version, go through the risks, set levels, send for approval. Approval was a single final button.",
          wrong: "There were four approvers, and they are not in sync: one department answers quickly, another sits on a risk for a week. In my model a version was either \"in assessment\" or \"approved\", while in real life it is almost always half one and half the other.",
          out: "I split assessment in two: each department's verdict on its own, and the integrated score calculated from them. Intermediate statuses and correction appeared, and the card shows a visible \"no assessment\" for departments that have not replied yet.",
          changed: "Before mock-ups, I map who touches the object and when. The sequence of touches uncovers intermediate states nobody mentions in interviews because they seem obvious. The most expensive of the three: it rewrote the data model.",
        },
        {
          title: "I took both filter options all the way to finished mock-ups",
          decided: "Build two full filter options and present them side by side so the choice would be deliberate.",
          wrong: "The question that separates them sounds like \"how much does one query cost\" and belongs to engineering. I could have got the answer in one conversation, but got it after drawing the second option in full.",
          out: "We picked option 1 based on query cost. The second stayed on the board, labelled \"for ideas and future work\".",
          changed: "Before drawing an alternative, I look for the question that decides between them and check whether it can be answered more cheaply. Often the fork is technical, and then the second mock-up is a wasted sprint.",
        },
      ],
    },
    results: {
      lead: "What changed and how it is measured.",
      intro: "The outcomes are written as a formula: what I achieved, how it is measured, what I did to get there. If there is no link between a decision and its effect, this format shows it immediately.",
      outcomes: [
        { x: "Six manual hand-offs in the route → zero", y: "Number of hand-offs on the process map: six in \"before\", zero in \"after\". The map was built from tracker tasks and checked with stakeholders.", z: "Document upload and the draft risk generation moved inside the product, and the go-between administrator dropped out of the chain." },
        { x: "Data prep is no longer a human's job", y: "Prep steps before the first assessed row: four steps of twenty minutes or more versus one upload screen.", z: "Auto-generation of thirteen risks from uploaded documents, plus the version passport in the same card." },
        { x: "Version status visible without asking", y: "Answering \"what stage is the assessment at\" no longer takes an email: the state reads in the registry and the card.", z: "An explicit version lifecycle, separate verdicts from the four departments and a summary above the list." },
      ],
      points: [],
      contribution:
        "Three decisions I own led to the outcome. Spending the start of the project on a process map before any screens: without it the six hand-offs would have stayed invisible, because each looks harmless on its own. Separating the four departments' verdicts from the integrated score: that rewrote the data model. Moving document upload inside the product: that removed the go-between from the chain.",
      honesty:
        "Confirmed: thirteen risk types, four approving departments, six steps in the condensed old route, twenty-plus minutes per step, the set of screens. The numbers on the screenshots themselves (639 agents, 142 assessed) are demo data in the mock-up and are not claimed as results. The wording of effects was reconstructed over the course of the project; when I walk through the case, I talk about them as a reconstruction, not as measurements.",
    },
    roadmap: [
      { kicker: "Speed", title: "Fast-track assessment", text: "A separate route for agents where the full procedure is overkill: same system, shorter path. The task was already in the sprint backlog." },
      { kicker: "Transparency", title: "Flagging AI-generated risks", text: "If a model drafted a risk, the person approving it should see that. A product that assesses AI risks should label its own AI output too." },
      { kicker: "Scale", title: "Search and sorting by planned dates", text: "Once assessments number in the thousands, the summary and filters will not be enough: the list needs search and a queue by deadline." },
    ],
    takeaways: [
      "In enterprise the pain is almost never on the screen. It is in the seams between people, and you only see it with a process map.",
      "Go to engineering earlier: two of my three mistakes cost sprints and could have been settled by a question asked before the mock-ups.",
      "Start from the bottom data level right away, without testing on myself what happens the other way round.",
    ],
    quote: "Ask a risk manager what to improve and you will hear about a button. Count the hand-offs in their route and you will see the button has nothing to do with it.",
    gallery: [
      {
        kind: "spot",
        title: "Assessment registry: four decisions on one screen",
        image: img(A + "t-registry-assessments.webp", 1600, 1128, "Assessment list: filter chips, loss amounts on every card and the number simplification toggle"),
        spots: [
          { x: 89.5, y: 17.5, text: "Number simplification toggle: amounts read as orders of magnitude", decision: "numbers" },
          { x: 38, y: 33, text: "Applied filters as chips, removable one by one", decision: "filter" },
          { x: 81.5, y: 41.2, text: "The chosen sort is written on the button", decision: "sort" },
          { x: 47.8, y: 56, text: "Four loss amounts per card: forty numbers across ten cards", decision: "numbers" },
        ],
      },
      {
        kind: "spot",
        title: "Agent registry: the summary answers before you count rows",
        image: img(A + "01.webp", 1600, 1128, "AI agent registry: summary on top, list below"),
        spots: [
          { x: 36, y: 36.5, text: "Total, assessed, in assessment, with month-over-month growth", decision: "summary" },
          { x: 53.3, y: 47.8, text: "Breakdown by risk level in a separate row", decision: "summary" },
          { x: 82, y: 60.6, text: "Version status is visible right in the list" },
        ],
      },
      {
        kind: "compare",
        title: "Filter: option 1 versus option 2",
        before: img(A + "t-filter-v1-panel-set.webp", 1032, 1830, "Option 1: side panel with auto-apply", "detail"),
        after: img(A + "t-filter-v2-panel.webp", 990, 2118, "Option 2: multi-select and a \"Show\" button", "detail"),
        labels: ["Auto-apply · chosen", "\"Show\" button"],
      },
      {
        kind: "film",
        title: "Editing a risk: level, rationale and a required comment",
        image: img(A + "07.webp", 1464, 1836, "Risk edit form: level, rationale and a required risk manager comment"),
      },
      {
        kind: "bento",
        title: "More screens",
        images: [
          img(A + "02.webp", 1600, 1048, "Agent card before assessment: empty, but you can see what is missing"),
          img(A + "06.webp", 1600, 1040, "Sort menu with four options", "detail"),
          img(A + "t-agent-card-generating.webp", 750, 496, "Uploading documents from the agent card", "detail"),
          img(A + "t-registry-shimmer.webp", 745, 486, "Uploading documents from the registry", "detail"),
        ],
      },
    ],
    deepDives: tracks["ai-agents"].tracks,
  },
  "grif-ai": grif,
  community,
  "moderator-dashboard": moderator,
  "stop-spam": spam,
  "electronic-house": house,
};

export default stories;
