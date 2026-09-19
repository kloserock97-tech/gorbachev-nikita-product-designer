/* v35: case subtasks, English. Structure (case keys, track/part ids, images, hints) matches caseTracks.ru.ts
   one to one; only the texts differ. Facts come from the case pages (Main cases/EN) and the "Open to lead roles"
   presentation; nothing invented. */
import type { TrackSet } from "./caseTracks";

const tracks: TrackSet = {
  "ai-agents": {
    main: "Main flow",
    tracks: [
      {
        id: "filter-progress",
        chip: "Filters & progress",
        kicker: "Subtask · AI agent risks",
        title: "A filter people can use blind, and a wait that doesn't look broken",
        tagline: "Two small screens where the choice came from a named principle and one question to engineering.",
        parts: [
          {
            id: "filter",
            label: "Filter",
            title: "Filter: two options, one chosen",
            found:
              "There are a lot of fields to filter by: assessment type, owning department, risk level, status and two date ranges. There's no room on screen for them, and people pick filter sets blind, without knowing what they'll find.",
            did: "I designed two options and presented them side by side.",
            options: [
              {
                name: "Option 1: auto-apply",
                text: "A side panel on the right, filters apply as you fill them in, applied values show up as chips on the main screen and can be removed one by one.",
                chosen: true,
                image: {
                  src: "cases/ai-agents/t-filter-v1-panel-set.webp",
                  w: 1032,
                  h: 1830,
                  caption: "Filter panel, option 1",
                  kind: "detail",
                },
              },
              {
                name: "Option 2: \"Show\" button",
                text: "Multi-select inside the panel and a \"Show 235 results\" button: the result is counted but not shown until you press it. Kept in the backlog of ideas for later.",
                image: {
                  src: "cases/ai-agents/t-filter-v2-panel.webp",
                  w: 990,
                  h: 2118,
                  caption: "Option 2 with a \"Show\" button",
                  kind: "detail",
                },
              },
            ],
            effect:
              "We picked option 1. The second one isn't bad, it solves a different problem: it will come in handy if the number of filters grows noticeably or queries get more expensive.",
            why:
              "Auto-apply wins when results come back fast and people build their filter set blind: they see the result of each step. Chips on the main screen follow from Nielsen's \"recognition rather than recall\": filter state is visible without opening the panel, and you remove it right where you see it.",
            lesson: {
              title: "I took both options all the way to finished mock-ups",
              text: "The question that separates them sounds like \"how much does one query to the results cost\", and it's a question for engineering, not users. I got the answer only after drawing the second option in full. Now, before drawing an alternative, I look for the question that decides between them first.",
            },
            images: [
              {
                src: "cases/ai-agents/t-filter-v1-applied.webp",
                w: 1600,
                h: 1060,
                caption: "Option 1: applied filters show as chips and can be removed one by one",
                kind: "screen",
              },
              {
                src: "cases/ai-agents/t-filter-v2-chips.webp",
                w: 1600,
                h: 1232,
                caption: "Option 2: chips on the main screen, status picked with checkboxes and a \"Done\" button",
                kind: "screen",
              },
            ],
          },
          {
            id: "progress",
            label: "Progress",
            title: "Auto-generating risks from documents",
            found:
              "Writing thirteen rationales from scratch takes hours. Meanwhile a good chunk of what's needed is already in the documents the person just uploaded: the agent description, business requirements, the codebase.",
            did:
              "While the system parses the uploaded archive, the screen shows progress and skeletons of the risks to come. The empty state before upload isn't silent either: \"you don't have any assessments yet\" plus a hint on what to do next.",
            effect:
              "People start from a draft they check and fix. Editing is always faster than writing.",
            why:
              "Nielsen's first heuristic, visibility of system status, backed by response-time thresholds: up to 0.1 s feels instant, up to 1 s keeps the train of thought, past 10 s attention wanders. Parsing an archive takes well over ten seconds, so without an indicator the screen reads as broken. Skeletons also hint at the shape of the result.",
            images: [
              {
                src: "cases/ai-agents/03.webp",
                w: 1600,
                h: 1078,
                caption: "Parsing the archive: progress and skeletons of upcoming risks instead of a spinner",
                kind: "screen",
              },
              {
                src: "cases/ai-agents/t-agent-card-generating.webp",
                w: 750,
                h: 496,
                caption: "Uploading documents from the agent card",
                kind: "detail",
              },
              {
                src: "cases/ai-agents/t-registry-shimmer.webp",
                w: 745,
                h: 486,
                caption: "Uploading documents from the registry",
                kind: "detail",
              },
            ],
          },
        ],
      },
      {
        id: "sort-summary",
        chip: "Sorting & summary",
        kicker: "Subtask · AI agent risks",
        title: "The registry answers \"what do I grab first\" before anyone counts rows",
        tagline: "A summary and four sort options replaced counting rows by eye and a dozen sortable columns.",
        parts: [
          {
            id: "summary",
            label: "Summary",
            title: "Summary above the list",
            found:
              "The registry answered \"what do we have\", but work starts with a different question: \"what do I grab first\". To gauge the volume, the risk manager counted rows by eye every time.",
            did:
              "Four tiles above the list: total agents with month-over-month growth, assessed, in assessment, and a separate row broken down by risk level. The list below now answers \"what to do\", not \"how are things\".",
            effect:
              "Getting to work starts with an answer, not a recount. As a bonus, the summary became something you can show a manager without opening anything else.",
            why:
              "Shneiderman's mantra for data-heavy interfaces: overview first, zoom and filter, then details on demand. A registry without a summary makes people count by eye what the system knows exactly.",
            images: [
              {
                src: "cases/ai-agents/01.webp",
                w: 1600,
                h: 1128,
                caption: "AI agent registry: the summary answers how many in total and how many are done, the list answers what to do next",
                kind: "hero",
              },
              {
                src: "cases/ai-agents/t-registry-assessments.webp",
                w: 1600,
                h: 1128,
                caption: "Risk assessment list: filter chips, loss amounts on every card and the number simplification toggle",
                kind: "screen",
              },
            ],
          },
          {
            id: "sort",
            label: "Sorting",
            title: "Sorting in four options",
            found:
              "People really have just two questions for the list: \"what's new\" and \"what's on fire\". Everything else is a job for the filter, not sorting.",
            did:
              "Sort by: newest, oldest, high level first, low level first. Four options, the current one ticked, and the chosen sort shown on the button.",
            effect:
              "Sorting stopped being a setting and became a quick answer. People open the menu to switch, not to figure out what's in there.",
            why:
              "Hick's law: decision time grows with the number of options. Sorting by every column looks generous, but makes people pick from a dozen every time. Two questions matter, so there are four options, not twelve.",
            images: [
              {
                src: "cases/ai-agents/t-sort-base.webp",
                w: 1600,
                h: 1030,
                caption: "The chosen sort is written on the button, visible without opening the menu",
                kind: "screen",
              },
              {
                src: "cases/ai-agents/t-sort-open.webp",
                w: 1600,
                h: 1042,
                caption: "Four options, the current one ticked",
                kind: "screen",
              },
              {
                src: "cases/ai-agents/t-sort-result.webp",
                w: 1600,
                h: 1034,
                caption: "After switching: the button shows the new sort",
                kind: "screen",
              },
            ],
          },
        ],
      },
      {
        id: "lead",
        chip: "Team lead",
        kicker: "Acting design lead · Sber",
        title: "The lead left, the team stayed, so I led it",
        tagline: "About a year of leading designers without the title: processes, reviews, hiring and a seat at product decisions.",
        facts: [
          ["Role", "Acting Design Lead"],
          ["Duration", "About a year, without a formal appointment"],
          ["Team", "Senior Designer, two Middle Designers, Intern"],
        ],
        metrics: [
          { value: "4", label: "designers in the team: senior, two middles, intern" },
          { value: "~1 year", label: "leading without a formal appointment" },
          { value: "~2,500", label: "users of the internal product" },
        ],
        parts: [
          {
            id: "team",
            label: "Team",
            title: "I ran the team without being appointed to",
            found:
              "Soon after I joined Sber, the design lead left the team. For about a year I effectively led it. The product: internal B2B, risk management and audit of AI agents, around 2,500 users.",
            points: [
              "Design review and quality control of design work",
              "Distributing tasks and helping with product decisions",
              "Hiring: interviews, candidate assessment, onboarding",
              "Individual development plans and mentoring",
              "Supporting designers on complex projects",
            ],
          },
          {
            id: "process",
            label: "Process",
            title: "Tasks stopped arriving as one line",
            before: {
              label: "Before",
              text: "\"We need a modal window.\"",
              note: "No context, goals, scenarios or success criteria.",
            },
            steps: [
              {
                title: "Task template",
                text: "Business and user problem, goals, metrics, constraints, definition of done.",
              },
              {
                title: "Design review",
                text: "Regular review of solutions: quality, knowledge sharing, fewer mistakes.",
              },
              {
                title: "Design debt",
                text: "Tracked and prioritised, so quality improves step by step and small flaws stop piling up.",
              },
              {
                title: "Design system",
                text: "Component library and shared guidelines for speed and consistency.",
              },
            ],
            images: [
              {
                src: "cases/ai-agents/t-jira-sprint-board.webp",
                w: 1600,
                h: 788,
                caption: "A two-week design sprint: a separate review column sits between \"design\" and \"development\", so no mock-up goes to dev until it's been looked at",
                kind: "detail",
              },
            ],
          },
          {
            id: "template-example",
            label: "Template",
            title: "What a task looks like in the template",
            found:
              "An example, not an original document: the filter task from this case, written the way the template asks for it.",
            steps: [
              {
                title: "Problem",
                text: "Many fields to filter by: assessment type, owning department, risk level, status, two date ranges. No room on screen, and people pick filters blind.",
              },
              { title: "User", text: "Risk manager." },
              {
                title: "Constraint",
                text: "The cost of one query to the results decides between auto-apply and a \"Show\" button. Ask engineering before drawing.",
              },
              {
                title: "Done when",
                text: "Applied values are visible without opening the panel and can be removed one by one.",
              },
            ],
          },
          {
            id: "influence",
            label: "Influence",
            title: "Design got invited before the decisions, not after",
            found:
              "At the start design was seen as a service function: designers were brought in after the main decisions were made.",
            steps: [
              {
                title: "Weekly digest",
                text: "What was shipped, which decisions were made, what results and research came in.",
              },
              {
                title: "Demo sessions",
                text: "Meetings with business and neighbouring teams to make design work transparent and build trust.",
              },
            ],
            effect:
              "Design started taking part in discussing problems at early stages and became a full participant in product decisions.",
          },
        ],
        quote:
          "A leader's job is not to make more screens but to build an environment where the team systematically makes good product decisions.",
      },
    ],
    hints: [
      { section: "solution", point: 1, track: "sort-summary" },
      { section: "solution", point: 2, track: "filter-progress" },
      { section: "solution", point: 5, track: "filter-progress" },
      { section: "solution", point: 5, track: "sort-summary" },
    ],
  },
  "grif-ai": {
    main: "Main flow",
    tracks: [
      {
        id: "pipeline",
        chip: "Agent pipeline",
        kicker: "Subtask · GRIF AI",
        title: "From Figma to Storybook with no manual handoff",
        tagline: "How one agent carried design from the Figma file to code, and where the human stayed in charge.",
        parts: [
          {
            id: "route",
            label: "Route",
            title: "We cut out the rewriting",
            found:
              "The usual route: a designer draws in Figma, a developer looks at the mock-up and writes similar code, then both sides spend months checking where things drifted. Every joint is a manual rewrite, and every joint loses precision.",
            did:
              "The agent connected to Figma via MCP and worked with the file's structure: layers, styles, component variants. From that same structure it built code and pushed it to the repository. Developers took ready components from Storybook.",
            steps: [
              {
                title: "Figma as a file system",
                text: "The kit file was read in full via MCP: components, variants, styles, sticky notes. Along the way the agent found that the light-palette page was a leftover from someone else's template.",
              },
              {
                title: "Design system: variants, components, screens",
                text: "Claude did most of the drawing, I set rules and accepted results. Three fonts split by job: Sora for Latin display, Golos Text for Cyrillic headings, Inter for the interface, because the product is bilingual.",
              },
              {
                title: "Screen drafts in Claude Design",
                text: "Some screens were born as working pages: a mock-up forgives a heading that's too long, a browser doesn't.",
              },
              {
                title: "Components moved to code on GitHub",
                text: "The same agent that drew components moved them to the repository, with both the Figma layer and the code file in view.",
              },
              {
                title: "Storybook as the contract",
                text: "A working component in every state replaced the mock-up as the thing you check against.",
              },
              {
                title: "The human team assembles pages",
                text: "Frontend and backend built screens from Storybook components, and \"what's the padding here?\" vanished from our chats.",
              },
            ],
            effect:
              "The unit of handoff changed. Design used to deliver a description of the interface and hope it got reproduced correctly. Here it delivers the interface itself: a working component that can't be misread.",
            images: [
              {
                src: "cases/grif-ai/01.webp",
                w: 1024,
                h: 640,
                caption: "Home screen: chat is the way into the product, with a greeting, input field and three suggestions",
                kind: "hero",
              },
            ],
          },
          {
            id: "split",
            label: "Who does what",
            title: "The agent draws, the human decides whether it's good",
            options: [
              {
                name: "Agent",
                text: "Parses the Figma file; builds tokens; draws components, states and entire screens; moves components to code; builds design system pages and internal docs; checks the service flow for consistency.",
              },
              {
                name: "Human",
                text: "Sets the product character and its rules; decides what we build and in what order; makes spot fixes and final polish; signs off what goes to development; defends decisions to the client and investors; decides what the product won't have.",
              },
            ],
            why:
              "The line isn't drawn by task difficulty but by the nature of the answer. Anything with a checkable criterion goes to the agent. Anything whose criterion you can only name after seeing the result stays with the human: \"is this calm enough?\" can't be answered in advance, so it can't be delegated.",
          },
        ],
      },
      {
        id: "rework-validation",
        chip: "Rework & validation",
        kicker: "Subtask · GRIF AI",
        title: "A concept thrown out, and a test that doubled as an investment decision",
        tagline: "What it looks like when build time and investors shape the design as much as users do.",
        parts: [
          {
            id: "rework",
            label: "Rework",
            title: "The first concept had to be thrown out entirely",
            found:
              "The most expensive fix on the project was in the idea, not a mock-up. The first concept was fully designed and then fully redone, because the development timeline it required had grown unacceptable.",
            did:
              "Traces of the rework stay in the Figma file: the chat, sources and settings pages keep the old and new versions side by side, so you can see what we walked away from.",
            why: "A beautiful solution the team can't build in time isn't a solution.",
            lesson: {
              title: "Build speed is a property of design",
              text: "When design is fast and development is human and on a budget, the bottleneck moves. You have to design with an eye on what it will be built from.",
            },
          },
          {
            id: "validation",
            label: "Validation",
            title: "The same run was both a usability test and an investment decision",
            steps: [
              {
                title: "The usual track",
                text: "User tests and interviews, a review of competitors (ChatGPT, Claude, Alice and neighbouring services) and of other teams' design files.",
              },
              {
                title: "The rare track",
                text: "Investors worked through real tasks in the finished part of the product. The question on the table was \"do we keep going\". Usability was only part of the answer.",
              },
            ],
            effect:
              "The interface got a second job: let you complete the task and explain the product in the same few minutes. Hence explicit labels like \"Gathered context: 4 sources\" and \"I won't send this without your OK\".",
            why:
              "In a separate pass the agent walked the entire service flow for consistency: same names for same things, an error state on every screen, a way back that never gets lost. People do this badly by screen seven and skip it by screen twenty.",
            images: [
              {
                src: "cases/grif-ai/03.webp",
                w: 1024,
                h: 922,
                caption: "Action card with Edit, Decline, Send: nothing leaves without your OK",
                kind: "screen",
              },
              {
                src: "cases/grif-ai/t-chat-reasoning-steps.webp",
                w: 1024,
                h: 226,
                caption: "Expanded reasoning steps: the assistant shows what it's studying and marks the step \"Done\"",
                kind: "detail",
              },
            ],
          },
        ],
      },
    ],
    hints: [
      { section: "solution", point: 1, track: "pipeline" },
      { section: "solution", point: 2, track: "pipeline" },
      { section: "results", point: 1, track: "pipeline" },
      { section: "results", point: 3, track: "rework-validation" },
      { section: "results", point: 4, track: "rework-validation" },
    ],
  },
};

export default tracks;
