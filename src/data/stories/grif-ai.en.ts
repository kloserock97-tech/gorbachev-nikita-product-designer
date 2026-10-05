/* v41: рассказ кейса GRIF AI на двух языках. Источник — Main cases/Grif-AI.html и EN/Grif-AI.en.html.
   Разделы с пометкой «ждёт ответа владельца» на Tilda сюда не перенесены: публикуем только известное.
   v56: тексты переписаны простым языком. Факты те же; технический термин остаётся рядом с объяснением.
   v86: вслед за русской версией по ревью Никиты. Места с пометкой [TO FILL] Никита заполнит сам. */
import type { CaseStory, CaseImage } from "../caseStory";

const img = (src: string, w: number, h: number, caption: string, kind = "screen"): CaseImage => ({ src, w, h, caption, kind });
const G = "cases/grif-ai/";

export const en: CaseStory = {
  id: "grif-ai",
  hero: {
    kicker: "Proactive AI assistant · built from zero · 2026",
    title: "GRIF AI",
    tagline: "I built a design department out of AI agents and took the product from concept to an MVP with a design system in React.",
    summary:
      "We started with an idea, a couple of screens and a small budget, so agents did most of the design. I prepared the design system and the instructions, connected Figma to Claude through MCP and set up a pipeline to GitHub and Storybook. Agents built prototypes, screens and components, I owned the vision, fixes, animations and identity, and development checked and assembled the final interface.",
    facts: [
      ["Role", "Product Designer"],
      ["Team", "Agents did the design department's work. Frontend and backend were people"],
      ["Timeline", "2025–2026"],
      ["Platform", "Web and desktop app"],
    ],
    tags: ["AI", "Design system", "B2C", "MVP"],
  },
  /* ПРИМЕР: цифры для примера по просьбе Никиты, см. русскую версию; до публикации заменить реальными */
  kpis: [
    { value: "5 → 1", label: "designers on the MVP: a classic team against one designer with agents" },
    { value: "16 → 6 wk", label: "to design the MVP, from concept to ready components" },
    { value: "3 wk → 5 d", label: "time-to-market for a new feature, from idea to code" },
    { value: "87%", label: "of scenarios completed without a hint in usability tests" },
  ],
  context: {
    lead: "The main question: when should an assistant speak first.",
    text:
      "GRIF is a personal assistant that comes to you first. It connects to your mail, messengers, calendar and finances, notices when something needs doing and brings a ready solution. The person only agrees or declines.\n\nBut services have taught people the opposite habit: the person asks, the system answers. An assistant that comes with something that matters is a gift. One that comes over trifles or out of context is an irritation.",
    constraints: [
      { title: "An abstract idea at the start", text: "No research, and the market is only taking shape." },
      { title: "A limited budget", text: "Until the investment came, there was little money for research or a team." },
      { title: "No design system and no shared settings", text: "Only wishes about the look and a couple of generated screens." },
      { title: "A real team and a deadline", text: "Development needed regular, clear deliveries, and investment rounds were already on the calendar." },
    ],
  },
  approach: {
    lead: "Character first, interface second.",
    text:
      "Telling an agent \"make it calm and premium\" is useless: an LLM follows rules but does not guess taste. So my first step was to describe the product's character and turn it into rules, like a recipe that says \"a teaspoon of salt\" where a beginner would get \"salt to taste\".\n\nThe Quiet Strategist: \"the part of your mind that already thought it through while you were busy\". It speaks once, respects silence and wins trust by being precise. Not \"Great question!\" but \"Your brief for the meeting with Sergey is ready. Open it?\".",
    rules: [
      { trait: "Never rushes", rule: "Animations of 120 to 200 ms that change only opacity and colour. Nothing bounces or swells." },
      { trait: "Speaks once", rule: "One guess at a time: one line between two points, no web of connections." },
      { trait: "Silence is a message too", rule: "No spinner and no \"typing…\": a status line says \"Watching, quiet right now\"." },
      { trait: "Trust through precision", rule: "Every answer carries the labels of the sources it was built from." },
      { trait: "Makes no noise", rule: "One blue accent per screen, everything else grey. Where the blue is, look there." },
    ],
    refusals: [
      "Choosing a model. If you have to tune the assistant's brain, it is no longer the one who did the thinking for you.",
      "Folders and projects. They hand back the tidying the assistant was meant to take away.",
      "Waking it with a code word. Something that always listens cannot respect silence.",
    ],
  },
  /* the product's own brand material and a photograph break up the chapters: a long page is read by scrolling */
  interludes: [
    { after: "brief", focus: "50% 62%", image: { src: "cases/grif-ai/brand-visual.webp", w: 1100, h: 1100, caption: "The product's key visual: a query line and prompts over a metal wing", kind: "brand" } },
    { after: "approach", image: { src: "cases/grif-ai/atmosphere.webp", w: 1172, h: 1580, caption: "Dark fabric and a narrow band of blue light", kind: "photo" } },
  ],
  research: {
    lead: "I checked against the market, with users and with investors.",
    /* v87: hypotheses come before the methods and are labelled with the method that tested them */
    hypotheses: {
      first: true,
      items: [
        { text: "Everyone has a chat. A feed where the system brings tasks itself sets us apart.", verdict: "Competitor analysis" },
        { text: "A feed needs no explaining: people know it from email and banking.", verdict: "Competitor analysis" },
        { text: "A ready scenario is worth more than a suggestion button.", verdict: "Competitor analysis" },
        { text: "If an action has an entry point (the input, the chips, a card in the feed), people find it without a hint.", verdict: "Tests and interviews" },
        { text: "If you can see the system reading, people double-check the answer less.", verdict: "Tests and interviews" },
        { text: "\"I won't send this without asking\" removes the fear that it will get it wrong and send.", verdict: "Tests and interviews" },
        { text: "If a sent action can be undone, people confirm more boldly.", verdict: "Tests and interviews" },
        { text: "An investor backs a product they want to use themselves.", verdict: "Investor run" },
        { text: "If the product's logic is clear within minutes, people try it on their own tasks.", verdict: "Investor run" },
      ],
    },
    methods: [
      {
        kind: "Competitor analysis",
        question: "Which AI assistants are on the market, how do they talk to people, and what do reviews say?",
        sample: "ChatGPT, Gemini, Alexa+, Lindy, Martin, alfred_; in Russia, Alice, GigaChat and the T-Bank and MTS \"Secretary\" assistants. Store and published reviews",
        finding:
          "Almost all of them lead with a chat: the person asks, the system answers. Reviews complain about misread context and badly timed suggestions, which people end up switching off. A feed where the system suggests things itself is familiar from email and banking, yet AI assistants barely use it. In GRIF it is an inbox of tasks with ready scenarios that go straight to the result, and that is our edge.",
      },
      {
        kind: "Tests and interviews",
        question: "Does a person understand what the companion can do, find the entry points, and manage and undo its actions?",
        sample: "Tests and interviews on the finished parts of the product",
        finding:
          "Trust erodes through a string of small things: inaccuracies, misread context, the feeling that the process cannot be stopped. Hence the rules: an action is visible before it runs, an answer has a source, and you can undo at any step. Entry points sit where people already look: the input, the chips, the feed. An action without an entry point does not exist for the person.",
      },
      {
        kind: "Investor run",
        question: "Will someone who has seen many startups invest, and, as part of our audience, want to use the product themselves?",
        sample: "Investors went through real tasks in the finished part of the product",
        finding:
          "It turned out to be one question: people invest in what they want to use. Interest came when the product's logic was clear within minutes and people recognised their own tasks, like meeting briefs and sorting email. So the interface explains itself through captions: \"Gathered context, 4 sources\" and \"I won't send this without your OK\".",
      },
    ],
  },
  /* v90: the interface film from Claude Design, rendered frame by frame into a video (see the Russian version) */
  decisions: {
    lead: "How the GRIF chat works, in one film: the main input with a live border, a greeting that follows the day's context, prompt chips, the thinking steps, the artefacts left after an answer, and accessibility.",
    items: [],
    film: { src: G + "film.mp4", poster: G + "film-poster.webp", w: 1920, h: 1080, caption: "GRIF interface film: input, greeting, chips, thinking steps, artefacts and accessibility" },
  },
  /* ПРИМЕР: the numbers below are made up as an example at Nikita's request; replace with real ones before publishing */
  results: {
    lead: "What is left after the project.",
    pointsFirst: true,
    points: [
      "A design system: styling settings, three type families, components in every state, component pages and documentation",
      "The whole user journey, with corner cases and onboarding",
      "A Storybook of working components that frontend builds from",
      "Agents that use the design system to create components, add them to Storybook and assemble screens from a prompt",
    ],
    outcomes: [
      { x: "Designing the MVP: 5 designers × 16 weeks → 1 designer × 6 weeks", y: "An estimate of the classic process by volume of work, against the actual timeline with agents.", z: "Agents draw, a person sets the task and accepts." },
      { x: "Time-to-market for a feature: 3 weeks → 5 days", y: "Median across MVP features from task to code.", z: "A Figma → GitHub → Storybook pipeline with no manual transfer." },
      { x: "Component from mock-up to Storybook: 2 days → 2 hours", y: "From an approved mock-up to a component in every state.", z: "An agent moves components and their updates by itself." },
      { x: "Scenarios completed without a hint: 87%", y: "Usability tests: find an action, launch it, undo it.", z: "Three entry points and undo at every step." },
      { x: "Scenario CSAT: 4.6 of 5", y: "A rating after each scenario.", z: "You can see what the system does and what the answer rests on." },
      { x: "Ready solutions from the feed accepted without edits: 68%", y: "Cards confirmed as they were.", z: "Ready scenarios in place of suggestion buttons." },
    ],
  },
  takeaways: [
    "With a team of agents, the time goes elsewhere: phrasing a rule so it cannot be read two ways, and deciding what counts as a good result.",
    "An agent does not argue. A human designer asks \"what for?\", and some bad ideas die on that question. Without that filter, describing your expectations clearly (how it should and shouldn't be, what is good and what is bad) becomes a critical skill. This project grew it a lot.",
    "A design system, a precise prompt and a tuned pipeline do not replace a person's vision and control. People use the product, and only a person can tell what will hit the audience's pain.",
  ],
  gallery: [
    {
      kind: "bento",
      title: "More screens",
      images: [
        img(G + "t-chat-attach.webp", 1024, 640, "Chat with an attachment"),
        img(G + "07.webp", 1024, 128, "Reasoning steps show what the system is busy with during the pause", "detail"),
      ],
    },
  ],
  /* разборы скрыты вслед за русской версией; вернуть — tracksEn["grif-ai"].tracks */
  deepDives: [],
};
