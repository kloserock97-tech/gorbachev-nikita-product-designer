/* v41: рассказ кейса GRIF AI на двух языках. Источник — Main cases/Grif-AI.html и EN/Grif-AI.en.html.
   Разделы с пометкой «ждёт ответа владельца» на Tilda сюда не перенесены: публикуем только известное.
   v56: тексты переписаны простым языком. Факты те же; технический термин остаётся рядом с объяснением.
   v87 (30.09): новый текст Никиты, см. grif-ai.ru.ts. */
import type { CaseStory, CaseImage } from "../caseStory";
import tracksEn from "../caseTracks.en";

const img = (src: string, w: number, h: number, caption: string, kind = "screen"): CaseImage => ({ src, w, h, caption, kind });
const G = "cases/grif-ai/";

export const en: CaseStory = {
  id: "grif-ai",
  hero: {
    kicker: "Proactive AI assistant · built from zero · 2026",
    title: "GRIF AI",
    tagline: "I built a full design department out of AI agents and took the product from a concept to an MVP with a design system in React.",
    summary:
      "At the start there was an idea, a couple of screens and not a single line of code. The budget was tight, so we handed most of the design to AI agents. I prepared the design system and instructions for the agents, connected Claude to Figma (through MCP) and set up the route to a shared code repository on GitHub. One agent moved every interface part and every update to it into Storybook by itself, another assembled screens in Figma for fine-tuning and the backlog, and prototypes were built in Claude Design. What stayed with me was the overall vision, precise edits, the animations, the identity and the brand. The developers checked what the agents generated and did the final assembly of the interface.",
    facts: [
      ["Role", "Product designer"],
      ["Team", "Agents in place of a design department, people on frontend and backend"],
      ["Timeline", "2025 to 2026"],
      ["Platform", "Web and a desktop app"],
    ],
    tags: ["AI", "Design system", "B2C", "MVP"],
  },
  kpis: [
    { value: "×2", label: "faster design with agents. The classic way, a design system from scratch takes 4 to 7 months for a team of 2 to 4 designers" },
    { value: "×2", label: "faster for interface parts to reach code and Storybook. A first component library in code usually takes 300 to 500 hours of work" },
    { value: "1", label: "designer in place of the team of 2 to 4 people usual for a product like this" },
  ],
  context: {
    lead: "An idea, a couple of screens and an empty folder for code.",
    text:
      "GRIF is a personal assistant that comes to you first. It connects to your mail, messengers, calendar and finances. It notices that something needs doing and brings a ready-made solution. The person does not have to phrase anything. They only agree or decline.\n\nBut for years services have taught people the opposite order: the person asks, the system answers. An assistant that comes by itself breaks that order. If it comes with something that matters, it is a gift. If it comes over trifles or without the right context, it annoys you, like a colleague who walks up to your desk every ten minutes.\n\nSo the main question of the whole design was this: when does the assistant have the right to speak up at all, and how should it do it.",
    constraints: [
      { title: "An abstract idea to start from", text: "There was no research at the start. Products like this are only just appearing, so there was no ready answer to borrow." },
      { title: "A limited budget", text: "Before the investment there was little money for research and for a team. Hiring a design department was out of the question." },
      { title: "No design system and no shared settings", text: "All we had were wishes about how it should look and a couple of generated screens." },
      { title: "A real team and a deadline", text: "The developers needed work regularly and in a clear form. Investment rounds were already scheduled, and we had to be ready for them." },
    ],
    myRole:
      "Product design lead. There was no design department, so I put together a team of agents and worked with it the way you work with people. I set tasks, accepted work, sent it back for rework and answered to the business for quality. A deadline was agreed for each task separately, so every round ended with something that could be passed on.",
  },
  approach: {
    lead: "From the product's character to the interface.",
    text:
      "The first thing I did was write down what character the product has. The reason was practical. When an agent does the work, the request \"make it calm and premium\" does not work. A language model understands rules and limits well and does not guess taste at all. It is like a recipe: \"salt to taste\" does not help a beginner, and \"a teaspoon of salt\" does. Taste had to become rules, or we would argue every time about what \"calm\" means.\n\nThe character got a name: the Quiet Strategist. Its formula: \"the part of your mind that already thought it through while you were busy\". It does not panic, speaks once, respects silence and earns trust by being precise. It will not say \"Great question!\". It will say \"Your brief for the meeting with Sergey is ready. Open it?\".",
    rules: [
      { trait: "Never rushes", rule: "Animations last 120 to 200 ms and change only opacity and colour. Nothing bounces, and no button swells." },
      { trait: "Speaks once", rule: "The system shows one guess at a time: one line between two points. There is no web of connections on the screen." },
      { trait: "Silence is a message too", rule: "There is no spinning loader and no \"typing…\" label. A status line takes their place: \"Watching, quiet right now\"." },
      { trait: "Trust through precision", rule: "Under every answer sit the labels of the sources it was built from. The system is saying: \"this is where I got it\"." },
      { trait: "Makes no noise", rule: "One blue accent per screen, everything else in shades of grey. Where the blue is, that is where to look." },
    ],
    refusals: [
      "Choosing a model and its settings. If you have to tune the assistant's brain, it stops being the one who already did the thinking for you.",
      "Folders and projects. They hand back to the person the tidying-up work the assistant was supposed to take away.",
      "Waking it by voice with a code word. Something that listens all the time cannot respect silence.",
      "The \"typing…\" label. It imitates a human where you can honestly show what the system is reading right now.",
    ],
  },
  /* the product's own brand material and a photograph break up the chapters: a long page is read by scrolling */
  interludes: [
    { after: "brief", focus: "50% 62%", image: { src: "cases/grif-ai/brand-visual.webp", w: 1100, h: 1100, caption: "The product's key visual: a query line and prompts over a metal wing", kind: "brand" } },
    { after: "approach", image: { src: "cases/grif-ai/atmosphere.webp", w: 1172, h: 1580, caption: "Dark fabric and a narrow band of blue light", kind: "photo" } },
    { after: "decisions", focus: "50% 46%", image: { src: "cases/grif-ai/brand-wing.webp", w: 1100, h: 1100, caption: "The product mark: the griffin's wing and its three pillars, proactive AI, interface and data work", kind: "brand" } },
  ],
  research: {
    lead: "I tested with users, against the market and with investors.",
    methods: [
      {
        kind: "Tests and interviews",
        title: "The usual check",
        question: "Does a person understand what the system is doing now, what it has already done, and how to undo it?",
        sample: "User tests and interviews on the finished parts of the product",
        finding:
          "Trust rarely breaks from one big mistake. More often small things wear it down: where the system got this from, what it has already done, how to undo it. So almost every decision in the interface answers one of two questions: \"can I see what is going on\" and \"can I take it back\".",
      },
      {
        kind: "Competitor review",
        title: "What people are already used to",
        question: "What can people already do after ChatGPT, Claude and Alice, and what will we have to teach?",
        sample: "ChatGPT, Claude, Alice (Yandex's voice assistant), neighbouring services and other teams' design files",
        finding:
          "A chat as the first screen is familiar to everyone. A feed where the system suggests things by itself is not: at the entrance it looks like one more inbox, and you already have plenty. So the chat became the main screen, and the feed lives next to it.",
      },
      {
        kind: "Investor run",
        title: "The rare check",
        question: "Will a person who sees the product for the first time get what it is about in a few minutes?",
        sample: "Investors went through real tasks in the finished part of the product",
        finding:
          "After this run the investors decided whether to keep working with us. Willingness to pay is the strictest test of a product, and ease of use was only part of the answer. The interface got a second job: let the person finish the task and, in those same minutes, explain how the product works. That is where the plain captions came from: \"Gathered context, 4 sources\" and \"I won't send this without your OK\".",
      },
    ],
    hypotheses: {
      intro: "Three assumptions about trust that we tested with people. Each one turned into an interface decision.",
      items: [
        { text: "If the pause shows what the system is reading, a person double-checks the answer less often.", verdict: "Step-by-step reasoning" },
        { text: "If the card says what the system will not do without asking, the fear \"it will get it wrong and send it anyway\" goes away.", verdict: "Action card" },
        { text: "If something sent can be undone, people confirm more boldly.", verdict: "Undo and \"Recall\"" },
      ],
    },
  },
  flow: {
    title: "How the product gets built: the classic way and with agents",
    before: {
      title: "The classic way: a design department and moving things into code by hand",
      steps: [
        { who: "Design system designer", step: "Builds the foundations: colours, type, spacing, interface parts with every state", note: "A design system from scratch: usually 4 to 7 months" },
        { who: "Product designers", step: "Draw the screens: chat, feed, memory, sources, settings, first-time setup", note: "Designing a new product: 3 to 5 months for a team of 2 to 4 designers" },
        { who: "Designer", step: "Builds a clickable prototype for tests and for investors", note: "A separate round after the mock-ups", wait: true },
        { who: "Frontend developer", step: "Rewrites every part from the mock-up into code, looking at the picture", note: "Components and matching the code to the mock-up: 140 to 500 hours" },
        { who: "Designer and developer", step: "Find where the code drifted from the mock-up and fix it", note: "A game of telephone: something gets lost at every handover", wait: true },
      ],
      summary: "By public industry estimates, this scope takes several months the classic way for a team of 2 to 4 designers, plus hundreds of frontend hours to move it into code.",
    },
    after: {
      title: "With agents: one designer sets the rules, agents do the hands-on work",
      steps: [
        { who: "Me", step: "Describe the product's character and its rules, write instructions for the agents", note: "Taste turned into rules that can be checked" },
        { who: "Agent in Figma", step: "Builds interface parts, their states and screens, keeps the shared styling settings", note: "Sees the file from the inside through MCP: layers, styles, variants" },
        { who: "Claude Design", step: "Builds prototypes that open in a browser", note: "A mock-up forgives a headline that is too long, a browser does not" },
        { who: "Agent", step: "Moves the parts into code and Storybook along with every update", note: "It has both the Figma layer and the code file in front of it" },
        { who: "Check on code intake", step: "Stops any colour, size or typeface that bypasses the design system", note: "One rule for agents and for people" },
        { who: "Developers", step: "Check the generated parts and do the final assembly of the interface", note: "They compare against a working part and not a picture" },
      ],
      summary: "With agents both the design and the move into code went about twice as fast. One designer did the hands-on judgement, and the agents did the repeatable work by the rules.",
    },
  },
  decisions: {
    lead: "Behind every decision there is a trait of character you can say out loud. A product that acts by itself runs on trust. So almost all the decisions answer two questions: can I see what is going on, and can I take it back.",
    items: [
      {
        id: "chat-home",
        title: "The first screen is a chat with a greeting that fits the moment",
        found: "The feed where the system suggests things to do is the most striking idea in the product. It was very tempting to put it on the first screen. But the feed tells you what the system noticed, and a person arrives with a task of their own. And a blank \"How can I help?\" leaves them facing an empty page.",
        did: "I made the chat the first screen. The greeting uses the person's name and changes with the situation. Right after setup it says \"While you were getting to know me, I was already watching\". On an ordinary day it says \"While you were busy, I kept the context at hand\". Under it a status line reads \"Watching · 4 sources connected · quiet right now\". The feed is the neighbouring section and comes forward by itself when it has something to say.",
        effect: "From the first screen you can see that the assistant is already up to speed and what it is busy with. Nobody has to sort through someone else's to-do list at the door.",
        why: "Someone who already did the thinking for you does not ask \"how can I help?\". They tell you what they are keeping in mind and wait.",
        basis: "Competitor review: a chat at the entrance is familiar, and a feed at the entrance looks like one more inbox.",
        image: img(G + "01.webp", 1024, 640, "First screen: a greeting, an input field and three prompts", "hero"),
      },
      {
        id: "composer",
        title: "An input field that shows it is listening",
        found: "The input field is the front door of the product. At rest it should not compete with the greeting. And when a person is about to type, they need to feel heard before the first word.",
        did: "At rest the field has a thin, quiet border. When you place the cursor in it, a glowing blue ring starts to run slowly along the edge, one lap every five seconds, and a soft halo breathes around it. The send button, the griffin's wing, breathes along with it. Voice has its own state: \"Listening…\" and a live waveform that trembles with your voice.",
        effect: "The assistant \"leans in to listen\", and you see it without a single word. Nothing jumps or blinks: the movement is slow, like a nod from the person you are talking to.",
        why: "This is the trait \"never rushes\". Attention is shown and never imposed: the ring appears only when the person reaches for the field.",
      },
      {
        id: "chips",
        title: "Prompts under the field are the most common jobs",
        found: "An empty input field is intimidating: it is unclear what you can ask an assistant like this for, and in how much detail.",
        did: "Under the field sit three prompts: \"Send a follow-up email\", \"Meeting summary\", \"Book a flight to Tokyo\". These are the most common requests, and a tap starts the task right away, with nothing to type. After the answer the next steps appear: \"I can also: remind you an hour before the meeting, gather talking points for the call\". A finished prompt turns into \"Done\".",
        effect: "The first request takes one tap. Along the way the person sees in a second what the product can do, with no tour and no training.",
        why: "A prompt works as a button and as a showcase of what is possible at the same time. A menu of thirty items suggests nothing, and three actions do.",
        basis: "Competitor review: prompts under the field are familiar from ChatGPT and Claude, so nobody has to learn them.",
      },
      {
        id: "reasoning",
        title: "You can see GRIF think, and it leaves a trace",
        found: "An assistant that reads mail, calendar and chats does not answer at once. A spinning loader at that moment only says \"wait\", and the pause feels longer. And after the answer it is unclear what it rests on.",
        did: "During the pause you see the work. The sources light up one by one: calendar, mail, Telegram, documents. A line of thought changes step by step: \"I see the meeting with Sergey at 10:00, collecting what relates to it\". When the important part is found, a gold dot flashes: \"Found what matters\". Then everything folds into one line, \"Gathered context, 4 sources, 1 min 47 s\", which you can expand. After the answer you are left with a brief, a \"Based on\" line with the sources, a memory note, an action card and a draft email.",
        effect: "By the time the answer arrives the person already knows what it rests on, and double-checks it less often. If the steps show that the system went the wrong way, it gets stopped before it finishes.",
        why: "This is the trait \"silence is a message too\": the system shows its work and does not pretend to be busy.",
        basis: "Tests: \"I can't tell where it got this\" is the first reason for distrust.",
        image: img(G + "t-chat-reasoning-steps.webp", 1024, 226, "Expanded reasoning steps: the assistant shows what it is studying and marks a step as Done", "detail"),
      },
      {
        id: "conclusion",
        title: "The conclusion first, the sources after",
        found: "An assistant easily slides into retelling what it did: \"I looked, then I studied, then I found\". A person needs the conclusion. The reasons are needed only if the conclusion raised a doubt.",
        did: "The answer opens with the result: \"The brief is ready. The key points in a minute, and I drafted a follow-up\". Under it is a \"Based on\" line with source labels: Telegram, Gmail, Notion.",
        effect: "People started checking selectively. A person reads the conclusion and goes to the sources only if something bothers them.",
        why: "Source labels work like a signature under a statement. When a product acts on your behalf, the most important thing is to know where a fact came from.",
        basis: "Shneiderman's rule: overview first, details on demand.",
        image: img(G + "04.webp", 1024, 300, "The conclusion first, under it the source labels and a memory note you can decline", "detail"),
      },
      {
        id: "confirm",
        title: "Nothing goes out without your confirmation",
        found: "A person's main fear with an assistant like this: \"it will get it wrong and send it anyway\". One case like that, and nobody uses the product again.",
        did: "Any action that goes out arrives as a card: who to, subject, draft text and three buttons, \"Edit\", \"Decline\", \"Send\". Next to them it says plainly: \"I won't send this without your OK\".",
        effect: "The product's promise can be checked right on the screen. What the system can and cannot do without asking is visible before anything happens.",
        why: "First you have to prevent the mistake: something that cannot be taken back should not happen in one move. And a promise hidden in the settings does not work as a promise.",
        basis: "Investor run: the caption on the card explains the product in seconds.",
        deepDive: "rework-validation",
      },
      {
        id: "undo",
        title: "Sent, but not too late",
        found: "Confirmation takes away only half of the fear. A person confirms quickly and often gets it wrong at that very moment. And then they are left alone with a sent email.",
        did: "After sending, \"Email sent. Undo\" appears at the top, and an entry with a \"Recall\" button stays in the conversation.",
        effect: "A mistake costs less, and confirming is not so scary. When you can take it back, people decide more boldly.",
        basis: "Nielsen's user control rule: a person needs a clear way out of a mistake.",
        why: "People stop reading warnings by the third time, and undo always works. The entry in the conversation is also a trace: you can see what the system did on your behalf.",
      },
      {
        id: "document",
        title: "An answer you can edit like a document",
        found: "A draft email inside a chat message is awkward to edit. It sits in a stream of replies, and you want to edit it as ordinary text, with \"to\" and \"subject\" fields.",
        did: "The \"Edit\" button opens a side panel where the email looks like an ordinary document and is saved to drafts. The chat stays in place and is visible on the left.",
        effect: "To fix an email you no longer have to argue with the assistant: \"no, say it differently\".",
        why: "A chat message is a reply, and an email is a thing. It is odd to explain in words what you can fix by hand.",
        basis: "Direct manipulation after Shneiderman: a person edits the thing itself and does not have to describe the edit in words.",
        image: img(G + "05.webp", 1024, 640, "Side panel: the email is edited like a document, and the chat stays in place"),
      },
      {
        id: "memory",
        title: "A memory you can say no to",
        found: "An assistant that collects knowledge about you also remembers things it should not. What it remembered silently will come up a month later, and the person will not understand how the system knows it.",
        did: "The system shows every note at the moment it makes it: \"Noted: don't mention competitor X around Sergey\". A \"Don't remember\" button sits right next to it. The \"Memory\" section shows everything collected so far.",
        effect: "Memory became an open agreement. You can refuse a note in the same place where you learned about it.",
        why: "The button has to stand where the information is. To find a setting in a separate section, you first have to guess that there is something to cancel.",
      },
      {
        id: "feed",
        title: "The feed: one card, one question",
        found: "Suggestions from the system easily turn into a stream of notifications. Then people stop reading them at all.",
        did: "A card holds one observation, one deadline and one question: \"Remind you?\", \"Shall I book it?\". There is always a \"Later\" button. The card shows its state: awaiting a decision, in progress, done, error.",
        effect: "You can go through the feed one card at a time and stop at any moment. If something failed, the card stays in the feed with the reason and a \"retry\" button.",
        why: "This is the trait \"speaks once\" applied to a list. A card with two questions gets put off as a whole.",
        deepDive: "pipeline",
      },
      {
        id: "a11y",
        title: "Accessibility in the foundation, the brand on top",
        found: "A dark interface in shades of grey is easy to make beautiful and unreadable: grey text on a grey background. Checking every colour against the contrast threshold by hand takes long, and an agent does not spot it by eye.",
        did: "We started from the open Tailwind library and took from it the colour pairs and interface parts that meet the WCAG accessibility standard. From there we tuned the brand look point by point: the blue accent, the gold \"found what matters\" signal, the typefaces, the corner radii. For people who turned on \"reduce motion\" in their system, every animation, from the ring around the field to the reasoning steps, gives way to calm still frames.",
        effect: "Text contrast, focus states and labels for screen readers did not have to be invented from scratch. The brand went on top of a tested foundation, and not the other way round.",
        why: "Accessibility is cheapest at the start. Later you have to fix it across the whole interface, screen by screen.",
        basis: "The WCAG standard: contrast for regular text of at least 4.5 : 1.",
      },
    ],
  },
  split: {
    title: "The agent draws, the human decides whether it came out well.",
    left: {
      name: "Agent",
      items: [
        "Takes the Figma file apart: interface parts, their variants, styles and mismatches",
        "Keeps the shared styling settings (tokens): colours, typefaces, corner radii, shadows, spacing",
        "Draws interface parts, their states and whole screens",
        "Moves interface parts into code and Storybook",
        "Builds the design system showcases and the internal documentation",
        "Checks the whole user path for consistency",
      ],
    },
    right: {
      name: "Human",
      items: [
        "The product's character and the rules that follow from it",
        "What we do and in what order",
        "Precise edits, tuning the animations, the identity and the brand",
        "Acceptance: what goes to the developers and what goes back for rework",
        "Defending decisions in front of the client and investors",
        "Refusals: what the product will not have, and why",
      ],
    },
    why: "The line does not run along how hard a task is. It runs along whether you can say in advance what counts as the right answer. If you can, the task goes to the agent. If the answer is clear only once you see the result, the task stays with the human. You cannot answer \"is this calm enough\" in advance.",
  },
  mistakes: {
    lead: "The first version of the product had to be thrown away whole.",
    items: [
      {
        title: "I designed a version the team could not build in time",
        decided: "To take the first version to the end: it had been designed in full.",
        wrong: "The development time for it grew beyond what was acceptable. A beautiful solution the team cannot build in time is not a solution.",
        out: "I redid all of it. The trace is still in the Figma file: on the chat, sources and settings pages the old and new versions lie side by side, and you can see what was given up.",
        changed: "How fast something can be built is as much a property of a design as how it looks. When design is fast and development is real people on a limited budget, development becomes the bottleneck. You have to design with an eye on what it will be built from and how long that takes.",
      },
    ],
  },
  results: {
    lead: "What is left after the project.",
    outcomes: [
      { x: "The design came together about twice as fast as the classic way", y: "The project timeline against public estimates for the same scope: a design system from scratch in 4 to 7 months, a new product design in 3 to 5 months for a team of 2 to 4 designers (Fuselab Creative, 2026).", z: "Agents did the hands-on work by the rules and instructions, and I set the rules and accepted the work." },
      { x: "Interface parts reached code about twice as fast", y: "The time to move parts into code and Storybook against an estimate of 300 to 500 hours for a first component library (DesignWhine, 2024).", z: "The agent moved into code the same parts it drew in Figma, and the check on code intake kept the design system intact." },
    ],
    points: [
      "A design system from scratch: shared styling settings, three type families, interface parts with every state, showcases and documentation",
      "Mock-ups of every main section: chat, feed, memory, sources, settings, first-time setup, plus variants and drafts",
      "Developers get the work through Storybook: working interface parts, and not pictures with descriptions",
      "A program watches over the design system. A colour or size typed in by hand, or a foreign typeface, stops the code from being accepted. The rule is the same for agents and for people",
    ],
    honesty:
      "The twofold speed-up is my estimate for the project. It compares our timeline with public industry estimates for the same scope of work, since nobody ran two teams side by side. The results of the tests with people are described in words.",
  },
  takeaways: [
    "When the team is made of agents, a lead hardly has to explain and wait. The time goes elsewhere: phrasing a rule so it cannot be read two ways, and deciding what counts as a good result.",
    "An agent does not argue, and that is more dangerous than it seems. A human designer asks \"what for?\", and half of the bad ideas die on that question. An agent will do it silently and well. So you have to ask yourself \"what for?\".",
    "Any agreement needs a guard that does not depend on goodwill. While the design system was words, everyone broke it, me included. Once a program started checking it when code is accepted, the argument ended in a day.",
  ],
  quote: "You can overlook a set of ready-made parts. You cannot overlook a check that will not let your code through.",
  gallery: [
    {
      kind: "spot",
      title: "One answer, five decisions about trust",
      image: img(G + "03.webp", 1024, 922, "An assistant answer with sources, a memory note and an action card"),
      spots: [
        { x: 56.5, y: 11.9, text: "\"Gathered context, 4 sources\": the reasoning steps are folded into one line", decision: "reasoning" },
        { x: 27.5, y: 15.3, text: "The answer opens with the conclusion", decision: "conclusion" },
        { x: 60.5, y: 28, text: "Source labels: Telegram, Gmail, Notion", decision: "conclusion" },
        { x: 78, y: 33.3, text: "\"Don't remember\" sits right next to what was noted", decision: "memory" },
        { x: 29.6, y: 62.7, text: "\"I won't send this without your OK\" is written on the card itself", decision: "confirm" },
      ],
    },
    {
      kind: "compare",
      title: "Before and after sending: the action can be taken back",
      before: img(G + "03.webp", 1024, 922, "Before sending: the card awaits a decision"),
      after: img(G + "06.webp", 1024, 772, "After sending: \"Undo\" at the top and \"Recall\" in the conversation"),
      labels: ["Awaiting your OK", "Sent · can be undone"],
    },
    {
      kind: "bento",
      title: "More screens",
      images: [
        img(G + "t-chat-attach.webp", 1024, 640, "Chat with an attachment"),
        img(G + "07.webp", 1024, 128, "Reasoning steps show what the system is busy with during the pause", "detail"),
      ],
    },
  ],
  deepDives: tracksEn["grif-ai"].tracks,
};
