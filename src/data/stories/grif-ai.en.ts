/* v41: рассказ кейса GRIF AI на двух языках. Источник — Main cases/Grif-AI.html и EN/Grif-AI.en.html.
   Разделы с пометкой «ждёт ответа владельца» на Tilda сюда не перенесены: публикуем только известное.
   v56: тексты переписаны простым языком. Факты те же; технический термин остаётся рядом с объяснением.
   v86: вслед за русской версией по ревью Никиты. Места с пометкой [TO FILL] Никита заполнит сам.
   23.10: тексты почищены вслед за русской версией (тройки, морали, антитезы, шаблонные лиды). */
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
  /* 23.10: Никита оставил две метрики: task success rate 87% и time-to-market 3 нед → 5 дн */
  kpis: [
    { value: "3 wk → 5 d", label: "time-to-market for a new feature, from idea to code" },
    { value: "87%", label: "unassisted task success rate in usability tests" },
  ],
  context: {
    lead: "The main question: when should an assistant speak first.",
    text:
      "GRIF is a personal assistant that comes to you first. It connects to your mail, messengers, calendar and finances, notices when something needs doing and brings a ready solution. The person only agrees or declines.\n\nBut services have taught people the opposite habit: the person asks, the system answers. When an assistant shows up with something that matters, people are glad. When it shows up with a trifle or at the wrong moment, it gets annoying.",
    constraints: [
      { title: "An abstract idea at the start", text: "No research, and the market is only taking shape." },
      { title: "A limited budget", text: "Until the investment came, there was little money for research or a team." },
      { title: "No design system and no shared settings", text: "Only wishes about the look and a couple of generated screens." },
      { title: "A real team and a deadline", text: "Development needed regular, clear deliveries, and investment rounds were already on the calendar." },
    ],
  },
  approach: {
    lead: "I wrote down the product's character in a form an agent can work from.",
    text:
      "Telling an agent \"make it calm and premium\" is useless: an LLM follows rules but does not guess taste. So my first step was to describe the product's character and turn it into rules, like a recipe that says \"a teaspoon of salt\" where a beginner would get \"salt to taste\".\n\nGRIF's character is the Quiet Strategist, \"the part of your mind that already thought it through while you were busy\". It speaks rarely and gets straight to the point, for example: \"Your brief for the meeting with Sergey is ready. Open it?\".",
    rules: [
      { trait: "Never rushes", rule: "Animations of 120 to 200 ms that change only opacity and colour. Nothing bounces or swells." },
      { trait: "Speaks once", rule: "One guess at a time: one line between two points, no web of connections." },
      { trait: "Silence is a message too", rule: "There is no spinner and no \"typing…\". During a pause a status line says \"Watching, quiet right now\"." },
      { trait: "Trust through precision", rule: "Every answer carries the labels of the sources it was built from." },
      { trait: "Makes no noise", rule: "One blue accent per screen, everything else grey. Blue marks what to look at right now." },
    ],
    refusals: [
      "Choosing a model. The assistant decides which model fits the task, and the person has no need to know.",
      "Folders and projects. Sorting tasks into folders would fall on the person, and that tidying is exactly what the assistant takes on.",
      "Waking it with a code word. That would mean the assistant listens all the time, and GRIF already comes on its own when there is a reason.",
    ],
  },
  /* the product's own brand material and a photograph break up the chapters: a long page is read by scrolling */
  interludes: [
    { after: "brief", focus: "50% 62%", image: { src: "cases/grif-ai/brand-visual.webp", w: 1100, h: 1100, caption: "The product's key visual: a query line and prompts over a metal wing", kind: "brand" } },
    { after: "approach", image: { src: "cases/grif-ai/atmosphere.webp", w: 1172, h: 1580, caption: "Dark fabric and a narrow band of blue light", kind: "photo" } },
  ],
  research: {
    lead: "There were nine hypotheses, and each one is labelled with how I tested it.",
    /* v87: hypotheses come before the methods and are labelled with the method that tested them */
    hypotheses: {
      first: true,
      items: [
        { text: "Everyone has a chat, so a feed where the system brings tasks itself can set us apart.", verdict: "Competitor analysis" },
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
        sample: "ChatGPT, Gemini, Alexa+, Lindy, Martin, alfred_. In Russia: Alice, GigaChat and the T-Bank and MTS \"Secretary\" assistants. Store and published reviews",
        finding:
          "Almost all of them lead with a chat: the person asks, the system answers. Reviews complain about misread context and badly timed suggestions, which people end up switching off. A feed where the system suggests things itself is familiar from email and banking, yet AI assistants barely use it. So GRIF has a feed: an inbox of tasks with ready scenarios that take the job straight to the result.",
      },
      {
        kind: "Tests and interviews",
        question: "Does a person understand what the companion can do, find the entry points, and manage and undo its actions?",
        sample: "Tests and interviews on the finished parts of the product",
        finding:
          "Trust dropped over small things: an inaccuracy in an answer here, misread context there. People were also scared that a process, once started, could not be stopped. So every answer shows its source, and an action is visible before it runs and can be undone at any step. I put the entry points where people already look: the input, the chips and the feed.",
      },
      {
        kind: "Investor run",
        question: "Will someone who has seen many startups invest, and, as part of our audience, want to use the product themselves?",
        sample: "Investors went through real tasks in the finished part of the product",
        finding:
          "Wanting to invest and wanting to use it yourself went together. Interest came when the product's logic was clear within minutes and people recognised their own tasks, like meeting briefs and sorting email. So the interface explains itself through captions: \"Gathered context, 4 sources\" and \"I won't send this without your OK\".",
      },
    ],
  },
  /* v90: the interface film from Claude Design, rendered frame by frame into a video (see the Russian version) */
  decisions: {
    lead: "Here is how the GRIF chat works, shown in one film: the main input with a live border, a greeting that follows the day's context, prompt chips, the thinking steps, the artefacts left after an answer, and accessibility.",
    items: [],
    film: { src: G + "film.mp4", poster: G + "film-poster.webp", w: 1920, h: 1080, caption: "GRIF interface film: input, greeting, chips, thinking steps, artefacts and accessibility" },
  },
  /* 23.10: Никита оставил две метрики: task success rate 87% и time-to-market 3 нед → 5 дн, остальные убраны */
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
      { x: "Time-to-market for a feature: 3 weeks → 5 days", y: "How long it takes from a feature idea to its code.", z: "A Figma → GitHub → Storybook pipeline where nobody moves mock-ups by hand." },
      { x: "Unassisted task success rate: 87%", y: "Usability tests: find an action, launch it and undo it.", z: "Three entry points and undo at every step." },
    ],
  },
  /* v114: prototype from the mock-ups — the main flow: meeting files → brief and a ready email → sent */
  prototype: {
    title: "Send a follow-up after the meeting",
    lead: "You hand GRIF your meeting files, it puts together a brief and an email, and all that is left is to press Send.",
    live: "grif-ai",
    device: "browser",
    steps: [
      { image: img(G + "t-chat-attach.webp", 1440, 900, "A request with the meeting files"), spot: [0.892, 0.804], action: "Send the meeting files and the task", why: "The files are already attached to the message. Tap the send button on the right." },
      { image: img(G + "t-chat-reasoning-steps.webp", 1380, 304, "Reasoning steps"), wait: 3200, action: "GRIF reads the meeting and the threads", why: "Wait a couple of seconds, the screen moves on by itself." },
      { image: img(G + "03.webp", 1436, 1292, "The brief and a ready email"), spot: [0.84, 0.627], action: "Check the email and press Send", why: "The sources are listed under the brief: Telegram, Gmail and Notion. The email will not go out until you press the button yourself." },
      { image: img(G + "06.webp", 1438, 1084, "The email is sent"), action: "Done: the email is sent and can be taken back", why: "Changed your mind? You can still cancel the send." },
    ],
  },
  takeaways: [
    "With a team of agents, the time goes elsewhere: phrasing a rule so it cannot be read two ways, and deciding what counts as a good result.",
    "An agent does not argue. A human designer asks \"what for?\", and some bad ideas die on that question. Without that filter, everything depends on how clearly you describe your expectations: how it should and shouldn't be, what is good and what is bad. This project taught me a lot about that.",
    "Agents build screens by the rules. Deciding what would hit the audience's pain was still my job, and I did it from the tests and interviews.",
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
