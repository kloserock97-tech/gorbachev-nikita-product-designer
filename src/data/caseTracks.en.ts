/* v35: case subtasks, English. Structure (case keys, track/part ids, images, hints) matches caseTracks.ru.ts
   one to one; only the texts differ. Facts come from the case pages (Main cases/EN) and the "Open to lead roles"
   presentation; nothing invented.
   v56: rewritten in plain language. A term stays next to its explanation, facts and numbers are the same. */
import type { TrackSet } from "./caseTracks";

const tracks: TrackSet = {
  "ai-agents": {
    main: "Main flow",
    tracks: [
      {
        id: "filter-progress",
        chip: "Filters & progress",
        kicker: "Subtask · AI agent risks",
        title: "A filter people set by trial and error, and a wait that doesn't look broken",
        tagline: "Two small screens. A clear rule made the choice in one of them, and one question to the developers made it in the other.",
        parts: [
          {
            id: "filter",
            label: "Filter",
            title: "Filter: two options, one chosen",
            found:
              "You can select by many fields: assessment type, owning department, risk level, status and two pairs of dates. There is no room for them on the screen. And people find the right combination of filters by trial and error, without knowing in advance what will turn up.",
            did: "I made two options and defended them side by side.",
            options: [
              {
                name: "Option 1: works at once",
                text: "A panel on the right. The filter works while you fill it in. The chosen values show as labels on the main screen and can be removed one by one.",
                chosen: true,
                image: {
                  src: "cases/ai-agents/t-filter-v1-panel-set.webp",
                  w: 500,
                  h: 900,
                  caption: "Filter panel, option 1",
                  kind: "detail",
                },
              },
              {
                name: "Option 2: \"Show\" button",
                text: "You can choose several values in the panel, and at the bottom there is a \"Show 235 results\" button. The result is already counted, but you do not see it until you press. This option stayed in reserve for later.",
                image: {
                  src: "cases/ai-agents/t-filter-v2-panel.webp",
                  w: 500,
                  h: 1140,
                  caption: "Option 2 with a \"Show\" button",
                  kind: "detail",
                },
              },
            ],
            effect:
              "We chose the first option. The second one is good too, it just fits a different case. It will come in handy if there are many more filters or if a request to the list gets expensive.",
            why:
              "A filter that works at once is handier when the result is calculated quickly and the person finds the combination by trial and error. They see what each step gave them. It is like turning a volume knob: you hear the change right away, with no \"Apply\" button to press. The labels on the main screen rest on Nielsen's rule: recognising is easier than recalling. You see what is chosen without opening the panel, and you can remove it right there.",
            lesson: {
              title: "I took both options all the way to finished mock-ups",
              text: "One question decided between the options: \"what does one request to the list cost\". It is a question for the developers, and the user has nothing to do with it. I got the answer only after I had drawn the second option in full. Now, before I draw a second option, I first look for the question that chooses between them.",
            },
            images: [
              {
                src: "cases/ai-agents/t-filter-v1-applied.webp",
                w: 1270,
                h: 700,
                caption: "Option 1: the chosen filters show as labels and can be removed one by one",
                kind: "screen",
              },
              {
                src: "cases/ai-agents/t-filter-v2-chips.webp",
                w: 1440,
                h: 1140,
                caption: "Option 2: labels on the main screen, status picked with ticks and a \"Done\" button",
                kind: "screen",
              },
            ],
          },
          {
            id: "progress",
            label: "Progress",
            title: "The system drafts the risks from the documents",
            found:
              "Writing thirteen sets of reasons from a blank page is hours of work. Meanwhile much of what is needed already sits in the documents the person has just uploaded: the agent description, the business requirements, the program code.",
            did:
              "While the system goes through the uploaded archive, the screen shows how much is done and grey placeholders of the future risks. The empty screen before the upload is not silent either: \"you have no assessments yet\", and what to do next.",
            effect:
              "A person starts from a draft that needs checking and fixing. Editing is always faster than composing.",
            why:
              "A system should show what it is busy with (Nielsen's first rule). There are waiting thresholds too: up to 0.1 s a reply feels instant, up to 1 s the train of thought holds, after 10 s attention drifts away. Going through an archive is sure to take longer than ten seconds. Without an indicator the screen looks broken, like a lift where the floor number does not light up. The grey placeholders also show what the result will look like.",
            images: [
              {
                src: "cases/ai-agents/03.webp",
                w: 1440,
                h: 900,
                caption: "Going through the archive: you see how much is done, and grey placeholders of future risks in place of a spinner",
                kind: "screen",
              },
              {
                src: "cases/ai-agents/t-agent-card-generating.webp",
                w: 910,
                h: 500,
                caption: "Uploading documents from the agent card",
                kind: "detail",
              },
              {
                src: "cases/ai-agents/t-registry-shimmer.webp",
                w: 1180,
                h: 470,
                caption: "Uploading documents from the shared list",
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
        title: "The list answers \"what do I pick up\" before anyone starts counting rows",
        tagline: "A summary and four sorting items replaced counting by eye and a dozen columns.",
        parts: [
          {
            id: "summary",
            label: "Summary",
            title: "A summary above the list",
            found:
              "The list answered the question \"what do we have\". But work starts with a different question: \"what do I pick up\". To grasp the volume, the risk manager counted rows by eye every time.",
            did:
              "I put four tiles above the list: all agents with the growth over the month, assessed, in assessment, and on a separate line the split by risk level. The list below already answers \"what to do\".",
            effect:
              "A person starts the day with an answer, and there is nothing to count. The summary can be shown to a manager without opening anything else.",
            why:
              "Shneiderman's rule for screens with a lot of data: the overall picture first, then selecting and zooming, details on request. Without a summary a person counts by eye what the system already knows exactly. It is like a bank statement with no \"total\" line.",
            images: [
              {
                src: "cases/ai-agents/01.webp",
                w: 1440,
                h: 900,
                caption: "The shared list of AI agents: the summary answers how many in total and how many are done, the list answers what to do next",
                kind: "hero",
              },
              {
                src: "cases/ai-agents/t-registry-assessments.webp",
                w: 1440,
                h: 900,
                caption: "Risk assessment list: filter labels, loss amounts on every card and the switch for short numbers",
                kind: "screen",
              },
            ],
          },
          {
            id: "sort",
            label: "Sorting",
            title: "Sorting with four items",
            found:
              "A person has two real questions for the list: \"what is new\" and \"what is on fire\". The filter solves everything else.",
            did:
              "First: newest, oldest, high level, low level. Four items. The current one has a tick, and the name of the chosen sorting is written on the button.",
            effect:
              "Sorting stopped being a setting and became a quick answer to a question. People open the menu to switch. They no longer have to work out what is in there at all.",
            why:
              "Hick's law: the more options there are, the longer a person takes to choose. Sorting on every column looks generous, but it makes you choose from a dozen every time. It is like a twenty-page menu in a cafe where people come for coffee. There are two questions, so there are four items and not twelve.",
            images: [
              {
                src: "cases/ai-agents/t-sort-base.webp",
                w: 1440,
                h: 900,
                caption: "The name of the chosen sorting is written on the button, no need to open the menu",
                kind: "screen",
              },
              {
                src: "cases/ai-agents/t-sort-open.webp",
                w: 1440,
                h: 900,
                caption: "Four items, the current one has a tick, and the button already shows the new sorting",
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
        tagline: "About a year of leading designers without the title: order in the work, reviews, hiring and a voice where the product's fate is decided.",
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
            title: "I led the team although nobody had appointed me",
            found:
              "Soon after I joined Sber, the design lead left the team. For about a year I was the one who led it in practice. The product is internal, for the bank's staff: risk assessment and checks of AI agents, around 2,500 users.",
            points: [
              "Reviewed my colleagues' mock-ups and answered for the quality of design",
              "Handed out tasks and helped with product decisions",
              "Hired: interviews, assessing candidates, bringing newcomers up to speed",
              "Made a personal growth plan with each designer and mentored them",
              "Stepped in to help designers on hard projects",
            ],
          },
          {
            id: "process",
            label: "Process",
            title: "Tasks stopped arriving as one line",
            before: {
              label: "Before",
              text: "\"We need a modal window.\"",
              note: "Nothing about why it is needed, who it is for, or how to tell that it worked. It is like asking a carpenter to \"make a shelf\" without saying what will stand on it.",
            },
            steps: [
              {
                title: "Task template",
                text: "What hurts for the business and for the user, what the goal is, how we measure it, what the limits are, when we call the task done.",
              },
              {
                title: "Design review",
                text: "We go through each other's decisions regularly. Quality goes up, mistakes go down, and knowledge spreads across the team.",
              },
              {
                title: "Design debt",
                text: "We write down what was done in a hurry and decide what to fix first. That way the mess does not pile up.",
              },
              {
                title: "Design system",
                text: "A shared library of interface parts and shared rules. With them the work goes faster and the screens look alike.",
              },
            ],
            images: [
              {
                src: "cases/ai-agents/t-jira-sprint-board.webp",
                w: 1600,
                h: 788,
                caption: "A two-week design sprint: a separate review column sits between \"design\" and \"development\". A mock-up does not go to development until someone has looked at it",
                kind: "detail",
              },
            ],
          },
          {
            id: "template-example",
            label: "Template",
            title: "What a task looks like in the template",
            found:
              "This is an example, and the original document is not shown here. I took the filter task from this same case and wrote it down the way the template asks.",
            steps: [
              {
                title: "Problem",
                text: "Many fields to select by: assessment type, owning department, risk level, status, two pairs of dates. There is no room on the screen, and people set the filters by trial and error.",
              },
              { title: "User", text: "Risk manager." },
              {
                title: "Constraint",
                text: "The price of one request to the list decides which filter to build: the one that works at once or the one with a \"Show\" button. Ask the developers before the mock-ups.",
              },
              {
                title: "Done when",
                text: "The chosen values are visible without opening the panel and can be removed one by one.",
              },
            ],
          },
          {
            id: "first-180",
            label: "First six months",
            title: "What I do when I join a new team",
            found:
              "This is not a report on work done, it is a plan. This is how I intend to work in a new place: look first, change next, and only then make it stick.",
            steps: [
              {
                title: "Month one: listen and map",
                text: "I gather facts: what the product is, who uses it, which numbers it is judged by, where it hurts. I meet product and engineering to learn the goals and how the work runs: when a task is ready to be picked up and when it counts as done (DoR/DoD), how designs reach engineering. I take a quick look at what already exists: repositories, analytics, the bug tracker, the design system.",
              },
              {
                title: "Months two and three: a base, and first moves",
                text: "I sit down one to one with every designer: who owns what, and what we expect of each other. I walk the key flows and look for places where help lands quickly. I start a minimum routine: design review, stand-up, syncs with product and engineering. I prepare a plan for the design system and a couple of working pieces that show the bar for quality.",
              },
              {
                title: "Months three to six: steady, and larger",
                text: "I make routine what I have tested: review, an agreed definition of done, working through design tasks before the sprint (grooming). I work on the team: mentoring, training, a hiring plan. I run the design system as a product, with a roadmap and a join to engineering. Systemic arguments I settle with facts and options, and when we are stuck I escalate.",
              },
            ],
            effect:
              "The first four weeks are nothing but watching. By the second month, the first changes. By the sixth, processes that hold on their own.",
            why: "The order shifts if something catches fire, or if the team is plainly short of a skill.",
          },
          {
            id: "influence",
            label: "Influence",
            title: "Designers got invited before the decisions, and no longer after",
            found:
              "At first people saw design as a service desk. Designers were brought in when the main things had already been decided. It is a bit like calling the architect when the walls are already up.",
            steps: [
              {
                title: "Weekly digest",
                text: "What we shipped, what we decided, which results and research came in.",
              },
              {
                title: "Demo sessions",
                text: "Meetings with the business and neighbouring teams. They show what design is busy with, and trust grows from there.",
              },
            ],
            effect:
              "Designers started getting invited to discuss problems from the very start. Design got an equal voice in product decisions.",
          },
        ],
        quote:
          "A lead does not have to draw more screens. The job is to set up the work so that the team makes good product decisions again and again.",
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
        title: "From Figma to Storybook with nothing carried over by hand",
        tagline: "How one agent carried the design from the Figma file to code, and which decisions stayed with the human.",
        parts: [
          {
            id: "route",
            label: "Route",
            title: "We cut out the rewriting",
            found:
              "It usually goes like this. A designer draws in Figma. A developer looks at the mock-up and writes similar code. Then both sides spend months finding out where the two drifted apart. It works like the telephone game: something gets lost at every handover.",
            did:
              "The agent connected to Figma (through MCP) and saw the file itself from the inside: layers, styles, variants of the parts. From that same material it built the code and put it into the shared repository. Developers took ready parts from Storybook, which is a showcase of working interface parts.",
            steps: [
              {
                title: "Figma as a folder of files",
                text: "The agent read the whole kit through MCP: parts, their variants, styles, sticky notes. Along the way it found that the page with the light palette was left over from someone else's template.",
              },
              {
                title: "Design system: variants, parts, screens",
                text: "Claude did most of the drawing. I set the rules and accepted the result. The product is in two languages, so the three fonts have different jobs: Sora for Latin headings, Golos Text for Cyrillic headings, Inter for the interface.",
              },
              {
                title: "Screen drafts in Claude Design",
                text: "Some screens were made as working pages from the start. A mock-up will forgive a heading that is too long, and a browser will not.",
              },
              {
                title: "Parts moved to code on GitHub",
                text: "The same agent that drew the parts moved them into code. It had both the Figma layer and the code file in front of it.",
              },
              {
                title: "Storybook as the agreement",
                text: "People used to check against the mock-up. Now they check against a working part in all of its states.",
              },
              {
                title: "Real people build the pages",
                text: "Developers put screens together from Storybook parts. The question \"what's the padding here?\" vanished from our chats.",
              },
            ],
            effect:
              "What the designer hands over has changed. Before, the designer handed over a description of the interface and hoped it would be repeated correctly. Now the designer hands over the interface itself: a working part that cannot be misread. The difference is like a recipe and a cooked dish.",
            images: [
              {
                src: "cases/grif-ai/01.webp",
                w: 1024,
                h: 640,
                caption: "Home screen: work in the product starts with the chat. A greeting, an input field and three suggestions",
                kind: "hero",
              },
            ],
          },
          {
            id: "split",
            label: "Who does what",
            title: "The agent draws, the human decides whether it came out well",
            options: [
              {
                name: "Agent",
                text: "Goes through the Figma file. Gathers the shared style settings (tokens). Draws parts, their states and whole screens. Moves parts into code. Builds showcase pages and documentation. Checks that the whole user path looks the same and uses the same names.",
              },
              {
                name: "Human",
                text: "Sets the character of the product and the rules that follow from it. Decides what we do and in what order. Makes spot fixes and finishes things off. Accepts the work before development. Defends decisions in front of the client and investors. Decides what the product will not have.",
              },
            ],
            why:
              "It does not matter whether the task is hard or easy. What matters is whether you can say in advance how to check the answer. If you can, the task goes to the agent. If the yardstick shows up only once you see the result, the task stays with the human. You cannot answer \"is this calm enough\" in advance, so you cannot hand it over either. It is the same with soup: you find out whether there is enough salt only when you taste it.",
          },
        ],
      },
      {
        id: "rework-validation",
        chip: "Rework & validation",
        kicker: "Subtask · GRIF AI",
        title: "A concept thrown out, and a test the investment depended on",
        tagline: "Build time and investors shape the design as much as users do.",
        parts: [
          {
            id: "rework",
            label: "Rework",
            title: "The first concept had to be thrown out entirely",
            found:
              "The most expensive change on the project touched the whole idea. I designed the first concept in full and redid it in full. The development time for it was growing beyond what we could accept.",
            did:
              "The trace of the rework stayed in the Figma file. On the chat, sources and settings pages the old and new versions lie side by side, and you can see what we gave up.",
            why: "A beautiful solution the team cannot build in time does not count as a solution. It is like a house plan you do not have enough bricks for.",
            lesson: {
              title: "Build speed is a property of design",
              text: "When design is done fast and development is done by real people on a limited budget, the bottleneck moves to them. You have to design with an eye on what it will be built from.",
            },
          },
          {
            id: "validation",
            label: "Validation",
            title: "The same run was both a usability test and an investment decision",
            steps: [
              {
                title: "The usual check",
                text: "User tests and interviews. A review of competitors (ChatGPT, Claude, Alice and neighbouring services) and of other teams' design files.",
              },
              {
                title: "The rare check",
                text: "Investors went through real tasks in the finished part of the product. Afterwards they decided whether to keep working with us. Usability was only part of the answer.",
              },
            ],
            effect:
              "The interface got a second job. It has to let you finish the task and, in the same few minutes, explain what this product is. That is where the plain-text labels come from, like \"Gathered context: 4 sources\" and \"I won't send this without your OK\".",
            why:
              "In a separate pass the agent went through the whole user path and checked three things. Are the same things called the same everywhere. Is there a screen for the error case everywhere. Does the way back ever get lost. A human does this badly by the seventh screen and does not do it at all by the twentieth.",
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
                caption: "Expanded reasoning steps: the assistant shows what it is studying and marks the step \"Done\"",
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
