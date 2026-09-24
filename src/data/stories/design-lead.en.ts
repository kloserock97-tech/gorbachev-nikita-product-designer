/* Leadership case: a year running the design team with nobody appointed. It used to be a deep dive inside the
   AI-agent risk case (caseTracks, the "lead" track) and moved out into a case of its own — someone looking for
   a lead should not have to dig through another product to find it.
   Same facts as the track carried: team, span, the four things put in place, the digest and the demos.
   No growth numbers here: nobody measured them, and inventing them afterwards is not evidence. */
import type { CaseStory, CaseImage } from "../caseStory";

const img = (src: string, w: number, h: number, caption: string, kind = "screen"): CaseImage => ({ src, w, h, caption, kind });

export const en: CaseStory = {
  id: "design-lead",
  hero: {
    kicker: "Acting design lead · Sber · 2025–2026",
    title: "Nobody Appointed Me",
    tagline: "The design lead left and the team stayed. For about a year I ran it in practice — and what I changed was not the screens.",
    summary:
      "Not long after I joined Sber, the design lead resigned. No replacement was named — not me, not anyone. The team stayed: a senior, two mid-level designers and an intern. For roughly a year I owned design quality, handed out the work, hired people and helped them grow. The product was internal and bank-wide: risk assessment and review of AI agents, around 2,500 employees. What changed over that year was not the screens. It was the shape a task arrives in, and the moment design gets into the conversation.",
    facts: [
      ["Role", "Acting design lead"],
      ["Span", "About a year, with no formal appointment"],
      ["Team", "One senior, two mid-level designers, one intern"],
      ["Product", "Internal, around 2,500 bank employees"],
    ],
    tags: ["Leadership", "Process", "Design system", "Hiring"],
  },
  kpis: [
    { value: "4", label: "designers on the team: one senior, two mid, one intern" },
    { value: "~1 year", label: "running the team while nobody was appointed" },
    { value: "~2,500", label: "bank employees work in the product" },
  ],
  context: {
    lead: "The lead left. The work did not.",
    text:
      "Picture it: you joined a couple of months ago, you are still working out where everything is — and the person holding it all together walks out. Nobody is named to replace them. Not out of malice; it simply never reaches the top of anyone's list.\n\nMeanwhile the work carries on. Tasks land, releases sit in the calendar, and the intern looks at you and asks whether they got it right.\n\nI did not wait for the paperwork. I started doing the things the team would stall without: reviewing work, breaking tasks down, sitting next to whoever was stuck.",
    myRole:
      "Owned design quality, handed out the work and helped with product calls, ran hiring and onboarding, kept a growth plan with each designer, joined the hard projects myself.",
  },
  approach: {
    lead: "What needed changing was not the screens. It was what happens before and after them.",
    text:
      "A lead who simply draws more screens runs into their own ceiling: the day is as long for them as for everyone else. So I went after the things around the work rather than the work itself. The shape a task arrives in. Who looks at a solution before it reaches engineering. Where the corners we cut end up. Where shared interface parts come from.\n\nFour things, and not one of them is about how a screen looks.",
    levels: [
      { title: "Task template", text: "What hurts for the business and for the user, the goal, how we will measure it, the constraints, and what counts as done." },
      { title: "Design review", text: "We go through each other's work regularly. Quality climbs, mistakes drop, and what one person figured out spreads." },
      { title: "Design debt", text: "We write down what was done in a hurry and decide what to fix first. Mess stops piling up by itself." },
      { title: "Design system", text: "A shared library of interface parts and shared rules. Work moves faster and screens stop disagreeing with each other." },
    ],
  },
  research: {
    lead: "Before putting anything in place I watched how the work actually ran. Two holes.",
    methods: [
      {
        kind: "Observation",
        title: "The shape a task arrives in",
        question: "What does a designer get to start from?",
        finding:
          "\"We need a modal.\" That was the whole brief. Not what it is for, not who it is for, not how anyone would know it worked. Like asking a carpenter for a shelf without saying what goes on it.",
      },
      {
        kind: "Observation",
        title: "The moment a designer is called",
        question: "Is design part of the decision, or the wrapping on one already made?",
        finding:
          "Design was treated as a service and brought in once the important things were settled. Roughly like calling an architect when the walls are already up.",
      },
    ],
  },
  decisions: {
    lead: "Five things I put in place over the year. Not one of them is about drawing.",
    items: [
      {
        id: "brief",
        title: "A task arrives filled in, not as one line",
        found: "A designer got \"we need a modal\" and filled in the rest by guesswork: what for, for whom, and what would count as success.",
        did: "I put a template in place. Until it says what hurts for the business and the user, the goal, how we will measure it, the constraints and what counts as done, the task is not picked up.",
        effect: "The argument about drawing the wrong thing moved to before the mockup, where it costs ten minutes instead of two weeks.",
        why: "Asking a carpenter for a shelf without saying what goes on it is a reliable way to get the wrong shelf.",
        deepDive: "brief-example",
      },
      {
        id: "review",
        title: "Nothing reaches engineering unreviewed",
        found: "Everyone worked in their own corner. Mistakes surfaced in the build, where fixing them is expensive.",
        did: "I set up a regular design review, and in the two-week sprint a column of its own appeared between design and engineering. You cannot skip past it.",
        effect: "Fewer mistakes, and knowledge stopped living in one head: what one person worked out, the rest can do a week later.",
      },
      {
        id: "debt",
        title: "Corners we cut get written down, not forgotten",
        found: "Rushed decisions piled up quietly. Six months on, nobody remembered where we cut a corner or why.",
        did: "I started a design debt list: what was done in a hurry, and the order in which we fix it.",
        effect: "The mess stopped growing on its own. Every cut corner got a date.",
      },
      {
        id: "system",
        title: "Shared parts instead of starting over",
        found: "Screens that meant the same thing looked different, because everyone assembled them from their own pieces.",
        did: "We built a shared library of interface parts and agreed the rules: what we take ready-made and what we draw.",
        effect: "Work moved faster, and the product stopped looking like several apps glued together.",
      },
      {
        id: "voice",
        title: "Design became visible, and got called earlier",
        found: "While nobody can see what design is doing, design gets called last. Not out of spite — it is just unclear why you would call sooner.",
        did: "A weekly digest: what shipped, what we decided, what results and research came back. Plus demo sessions for the business and neighbouring teams.",
        effect: "Designers started being pulled into the problem from the beginning. Design got an equal voice in product calls.",
        why: "Trust does not come with the job title. You earn it by being visible.",
      },
    ],
  },
  results: {
    lead: "What stayed in the team after that year",
    points: [
      "A task arrives with a goal, constraints and a mark for done",
      "Nothing reaches engineering without a review",
      "Rushed work is written down and worked through in order, instead of piling up",
      "A shared library and shared rules instead of starting over each time",
      "Designers are called to the problem, not to decorate the answer",
    ],
    honesty:
      "No numbers here. The internal product had no metrics on how the team worked, and inventing percentages after the fact is a poor way to prove you led anything. Everything above is what carried on working once I stepped away.",
  },
  takeaways: [
    "You do not need the title to start owning the outcome. You need someone who stops waiting first.",
    "While design is invisible, it gets called last.",
    "A rule that rests on one person is not a rule. It is that person's habit.",
  ],
  quote:
    "A lead is not there to draw more screens. A lead is there to arrange the work so the team makes good product calls again and again.",
  gallery: [
    {
      kind: "bento",
      title: "Review sits between design and engineering",
      images: [
        img(
          "cases/ai-agents/t-jira-sprint-board.webp",
          1600,
          788,
          "A two-week design sprint: a review column of its own sits between design and engineering. Nothing moves on until someone has looked at it",
          "detail",
        ),
      ],
    },
  ],
  deepDives: [
    {
      id: "first-180",
      chip: "First six months",
      kicker: "A plan, not a report",
      title: "What I do when I join a new team",
      tagline: "Look first, change next, and only then make it stick. The order matters more than the speed.",
      parts: [
        {
          id: "month-1",
          label: "Month one",
          title: "Month one: listen and map",
          found:
            "For the first four weeks I break nothing. The team that ran before me knows more about the product than I do, and that has to be collected first.",
          steps: [
            { title: "Facts", text: "What the product is, who uses it, which numbers it is judged by, where it hurts." },
            { title: "People", text: "I meet product and engineering: the goals, and how the work runs — when a task is ready to be picked up and when it counts as done (DoR/DoD), how designs reach engineering." },
            { title: "What already exists", text: "A quick pass over what has piled up: repositories, analytics, the bug tracker, the design system." },
          ],
        },
        {
          id: "month-2-3",
          label: "Two to three",
          title: "Months two and three: a base, and first moves",
          found: "By now it is clear where it hurts, and I can touch things — a little at a time, so that what worked keeps working.",
          steps: [
            { title: "One to one", text: "With every designer: who owns what, and what we expect of each other." },
            { title: "Key flows", text: "I walk them myself and look for places where help lands quickly." },
            { title: "A minimum routine", text: "Design review, stand-up, syncs with product and engineering. Less would not hold; more is not needed yet." },
            { title: "The bar", text: "A plan for the design system and a couple of working pieces that show the quality we hold to." },
          ],
        },
        {
          id: "month-3-6",
          label: "Three to six",
          title: "Months three to six: steady, and larger",
          found: "From here the job is one thing: make all of it work without me.",
          steps: [
            { title: "Made routine", text: "Review, an agreed definition of done, working through design tasks before the sprint (grooming)." },
            { title: "People", text: "Mentoring, training, a hiring plan." },
            { title: "The system as a product", text: "With a roadmap and a join to engineering, not as a folder of buttons." },
            { title: "Arguments", text: "Systemic ones I settle with facts and options. Stuck means escalate, not wait for it to pass." },
          ],
          effect: "The first four weeks are nothing but watching. By the second month, the first changes. By the sixth, processes that hold on their own.",
          why: "The order shifts if something catches fire, or if the team is plainly short of a skill.",
        },
      ],
    },
    {
      id: "brief-example",
      chip: "Task template",
      kicker: "What it looks like in practice",
      title: "One task, laid out in the template",
      tagline: "The original document is not here, so I took a real task about a filter and wrote it up the way the template asks.",
      parts: [
        {
          id: "fields",
          label: "Fields",
          title: "Four fields, without which a task is not picked up",
          found:
            "This is an example, not a scan. The task is real — the filter in the assessment registry from the case next door; the template is the one we put in place.",
          steps: [
            { title: "Problem", text: "There are many fields to filter by: assessment type, owning division, risk level, status, two pairs of dates. There is no room on screen, so people pick filters by guesswork." },
            { title: "User", text: "A risk manager." },
            { title: "Constraint", text: "The cost of one request to the list decides which filter to build: the one that applies as you go, or one with a Show button. Ask engineering before drawing." },
            { title: "Done when", text: "Chosen values are visible without opening the panel and come off one at a time." },
          ],
          effect: "Four lines, five minutes to fill in — and a designer starts from the task rather than from guesswork.",
        },
      ],
    },
  ],
};
