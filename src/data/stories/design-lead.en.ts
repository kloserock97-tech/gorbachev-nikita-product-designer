/* The case about design in the team moving out of service work and into product decisions.
   It used to be a deep dive inside the AI-agent risk case and moved out into a case of its own — someone
   looking for a lead should not have to dig through another product to find it.
   v86: rewritten after Nikita's review, following the Russian version: repetition removed, metrics are design
   and product ones. Places marked [TO FILL] are for Nikita to fill in.
   v89: shortened following the Russian version, by docs/prompts/case-copy-edit.md. */
import type { CaseStory, CaseImage } from "../caseStory";

const img = (src: string, w: number, h: number, caption: string, kind = "screen"): CaseImage => ({ src, w, h, caption, kind });

export const en: CaseStory = {
  id: "design-lead",
  hero: {
    kicker: "Product design · Sber · 2025–2026",
    title: "Design Got a Seat",
    tagline: "I rebuilt the process around the design team, and design started being called into product decisions from the start.",
    summary:
      "I led the design team of an internal bank product for risk assessment and review of AI agents: design quality, handing out work, hiring, onboarding and growth plans, and I joined the hard projects myself. Over a year I changed the process around the screens, and pinned every rule to the sprint board so it did not live in the lead's memory.",
    facts: [
      ["Role", "Design lead"],
      ["Span", "About a year"],
      ["Team", "One senior, two mid-level designers, one intern"],
      ["Product", "Internal, around 2,500 bank employees"],
    ],
    tags: ["Leadership", "Process", "Design system", "Hiring"],
  },
  /* process rules checked against the sprint board; the measured effect sits in the Outcome */
  kpis: [
    { value: "100%", label: "of tasks are picked up with a goal, a metric and a definition of done" },
    { value: "0", label: "mockups reach engineering without a design review" },
  ],
  context: {
    lead: "Design was called once the important things were settled.",
    text:
      "Design worked as a service: it was brought in at the end and asked to \"just draw it\". All that was left to choose was the styling.\n\nAnd a task arrived as a single line: \"We need a modal.\"",
  },
  approach: {
    lead: "Change the process around the mockups. The mockups come after.",
    text:
      "I went after what surrounds a designer's work: the shape a task arrives in, who looks at a mockup before engineering, where rushed work ends up, where components come from, and whether the team's work is visible from outside.",
  },
  research: {
    lead: "Before changing anything, I looked at how the work ran. I found two holes.",
    methods: [
      {
        kind: "Observation",
        question: "What shape does a task arrive in?",
        finding:
          "There is no goal, no user and no definition of done, so the designer guesses them. The mismatch surfaces on a finished mockup, when a redo costs weeks.",
      },
      {
        kind: "Observation",
        question: "When is design brought in?",
        finding:
          "Once the important things are settled. Design's work is invisible from outside, so there is no reason to call it sooner.",
      },
    ],
  },
  decisions: {
    lead: "Five rules over the year, each closing a hole from the research.",
    items: [
      {
        id: "brief",
        title: "A task arrives filled in",
        found: "The designer guessed the goal and what would count as success.",
        did: "A template: the business and user problem, the goal, the metric, the constraints, the definition of done. A task that is not filled in is not picked up.",
        effect: "The argument about drawing the wrong thing moved to before the mockup, where it costs ten minutes. After the mockup it costs two weeks.",
        deepDive: "brief-example",
      },
      {
        id: "review",
        title: "No mockup reaches engineering unreviewed",
        found: "Mistakes surfaced in the build, where fixing them is expensive.",
        did: "A regular design review and a column of its own in the sprint between design and engineering. You cannot skip past it.",
        effect: "Fewer mistakes, and what one designer works out, the whole team knows a week later.",
      },
      {
        id: "debt",
        title: "Design debt is written down and worked through in order",
        found: "Rushed decisions piled up quietly, and six months on nobody remembered where we cut a corner.",
        did: "A list of rushed work with the order of fixing it.",
        effect: "Every cut corner got a date.",
      },
      {
        id: "system",
        title: "Shared components, so nobody starts from scratch",
        found: "Screens that meant the same thing looked different.",
        did: "A shared component library and rules: what we take ready-made and what we draw.",
        effect: "Work got faster, and the product looks whole.",
      },
      {
        id: "voice",
        title: "Design's work became visible",
        found: "The business did not know what the team was busy with.",
        did: "A weekly digest: what shipped, what we decided, what results and research came back. Plus demos for the business and neighbouring teams.",
        effect: "Designers started being pulled into the problem from the beginning.",
      },
    ],
  },
  results: {
    lead: "Metrics: process, design, product.",
    intro: "The process rules are checked against the sprint board.",
    outcomes: [
      { x: "Tasks with a goal, a metric and a definition of done: 100%", y: "Tasks on the sprint board.", z: "The task template." },
      { x: "Mockups in engineering without a review: 0", y: "The review column on the sprint board.", z: "A regular design review." },
    ],
    /* [TO FILL] add before → after values or drop a line if there is no data */
    points: [
      "[TO FILL] Share of tasks where design joined at problem definition: before → after",
      "[TO FILL] Design bugs found in engineering and after release: before → after",
      "[TO FILL] Time from task definition to a finished mockup",
      "[TO FILL] Share of screens built from design system components",
      "[TO FILL] Design debt: items on the list and items closed per quarter",
      "[TO FILL] A product metric the team moved, for example CSAT of the internal product",
      "[TO FILL] Team: people hired and people promoted",
    ],
  },
  takeaways: [
    "A rule that rests on one person is really just that person's habit.",
    "Trust does not arrive with the role. You earn it by making the team's work visible.",
  ],
  quote:
    "A lead's job is to arrange the work so the team makes good product calls again and again. Drawing more screens can't do that.",
  gallery: [
    {
      kind: "bento",
      title: "Review between design and engineering",
      images: [
        img(
          "cases/ai-agents/t-jira-sprint-board.webp",
          1600,
          788,
          "Design sprint: a review column between design and engineering",
          "detail",
        ),
      ],
    },
  ],
  deepDives: [
    {
      id: "first-180",
      chip: "First six months",
      kicker: "A plan I'd follow",
      title: "What I do when I join a new team",
      tagline: "Look first, change next, then make it stick. The order matters more than the speed.",
      parts: [
        {
          id: "month-1",
          label: "Month one",
          title: "Month one: listen and map",
          found:
            "For the first four weeks I break nothing: the team knows the product better than I do, and that knowledge has to be collected first.",
          steps: [
            { title: "Facts", text: "The product, its users, its metrics, its pains." },
            { title: "People", text: "Meetings with product and engineering: goals, when a task is ready and when it is done (DoR/DoD), how designs reach engineering." },
            { title: "What already exists", text: "Repositories, analytics, the bug tracker, the design system." },
          ],
        },
        {
          id: "month-2-3",
          label: "Two to three",
          title: "Months two and three: a base, and first moves",
          found: "By now it is clear where it hurts, and I can change things, a little at a time, so that what works keeps working.",
          steps: [
            { title: "One to one", text: "With every designer: areas of ownership and mutual expectations." },
            { title: "Key flows", text: "I walk them myself and look for places where help lands quickly." },
            { title: "A minimum routine", text: "Design review, stand-up, syncs with product and engineering." },
            { title: "The bar", text: "A plan for the design system and a couple of reference pieces." },
          ],
        },
        {
          id: "month-3-6",
          label: "Three to six",
          title: "Months three to six: steady, and larger",
          found: "One job from here: make it all work without me.",
          steps: [
            { title: "Made routine", text: "Review, an agreed definition of done, working through design tasks before the sprint (grooming)." },
            { title: "People", text: "Mentoring, training, a hiring plan." },
            { title: "The system as a product", text: "A roadmap and a link to engineering, so it's more than a folder of buttons." },
            { title: "Arguments", text: "I settle systemic ones with facts and options, and escalate the stuck ones." },
          ],
          effect: "Month one is watching, month two brings the first changes, and by month six the processes hold on their own.",
          why: "The order shifts if something catches fire, or if the team is plainly short of a skill.",
        },
      ],
    },
    {
      id: "brief-example",
      chip: "Task template",
      kicker: "What it looks like in practice",
      title: "One task, laid out in the template",
      tagline: "A real task about a filter, written up in the template.",
      parts: [
        {
          id: "fields",
          label: "Fields",
          title: "The main fields of the template",
          found:
            "An example, not a scan: a task from the case next door, the filter in the assessment registry.",
          steps: [
            { title: "Problem", text: "Many fields to filter by (assessment type, department, risk level, status, two pairs of dates), little room, and filters picked by guesswork." },
            { title: "User", text: "A risk manager." },
            { title: "Constraint", text: "Whether the filter applies at once or has a Show button depends on the cost of a request to the list. Ask engineering before drawing." },
            { title: "Done when", text: "Chosen values are visible without opening the panel and come off one at a time." },
          ],
          effect: "Five minutes to fill in, and a designer starts from the task, with nothing to guess.",
        },
      ],
    },
  ],
};
