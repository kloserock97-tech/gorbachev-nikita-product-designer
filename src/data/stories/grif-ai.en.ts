/* v41: рассказ кейса GRIF AI на двух языках. Источник — Main cases/Grif-AI.html и EN/Grif-AI.en.html.
   Разделы с пометкой «ждёт ответа владельца» на Tilda сюда не перенесены: публикуем только известное.
   v56: тексты переписаны простым языком. Факты те же; технический термин остаётся рядом с объяснением. */
import type { CaseStory, CaseImage } from "../caseStory";
import tracksEn from "../caseTracks.en";

const img = (src: string, w: number, h: number, caption: string, kind = "screen"): CaseImage => ({ src, w, h, caption, kind });
const G = "cases/grif-ai/";

export const en: CaseStory = {
  id: "grif-ai",
  hero: {
    kicker: "Proactive AI assistant · built from zero · 2026",
    title: "GRIF AI",
    tagline: "I built a design department out of AI agents and took the product from a couple of screens to ready-made interface parts in code.",
    summary:
      "At the start there was an idea, a couple of screens and not a single line of code. I was the only designer on the project. AI agents did the drawing, the assembling and the move into code. Claude worked right inside Figma (through an MCP connection). Finished interface parts went into a shared code repository on GitHub. Developers took them from Storybook, which is a showcase of ready-made parts, and built pages out of them. What stayed with me was the fine-tuning after which a mock-up starts to solve the task.",
    facts: [
      ["Role", "Product designer"],
      ["Team", "Agents instead of a design department; frontend and backend were people"],
      ["Timeline", "2025 to 2026, deadlines agreed for each task"],
      ["Platform", "Web, dark theme, RU / EN"],
    ],
    tags: ["AI", "Design system", "B2C", "Leadership"],
  },
  kpis: [
    { value: "12", label: "mock-up pages: chat, feed, memory, sources, settings, first-time setup" },
    { value: "4", label: "styling rules. Break any of them and the code is not accepted" },
    { value: "8", label: "interface decisions, each derived from a trait of the product's character" },
    { value: "2", label: "checks: with users and with investors" },
  ],
  context: {
    lead: "An idea, a couple of screens and an empty folder for code.",
    text:
      "GRIF is a personal assistant that comes to you first. It connects to your mail, messengers, calendar and finances. It notices that something needs doing and brings a ready-made action. The person does not have to phrase anything. They only agree or decline.\n\nAn ordinary chat waits for a question, and the person is responsible for how it is phrased. An assistant that comes by itself takes someone's attention every time. Picture a colleague who walks up to your desk: if he comes over trifles, you will start avoiding him. So the main question of the whole design was this: when does the system have the right to speak up.",
    constraints: [
      { title: "An idea and a small sketch", text: "A product concept in words and a couple of screens. It was more an illustration of a thought than a mock-up." },
      { title: "Not a single line of code", text: "There was no website and there were no ready-made interface parts. The folder for code was empty." },
      { title: "No design system and no shared settings", text: "There was no set of colours, no typefaces and no rules for placing elements. Only wishes about how it should look." },
      { title: "A real team and a limited budget", text: "The developers needed something to work with regularly and in a clear form. Their time cost money, and so did their idle time." },
    ],
    myRole:
      "Product designer. There was no design department, so I put together a team of agents and worked with it the way you work with people. I set tasks, accepted work, sent it back for rework and answered to the business for quality. A deadline was agreed for each task separately, so every round ended with something that could be passed on.",
  },
  approach: {
    lead: "First I described the product's character, then I derived the interface from it.",
    text:
      "The first thing I did was write down what character the product has. The reason was practical. When an agent does the work, the request \"make it calm and premium\" does not work. An agent follows a rule very well and guesses taste badly. It is like a recipe: \"salt to taste\" does not help a beginner, and \"a teaspoon of salt\" does. Taste had to become rules, or we would argue every time about what \"calm\" means.\n\nThe character got a name: the Quiet Strategist. Its formula: \"the part of your mind that already thought it through while you were busy\". It does not panic, speaks once, respects silence and earns trust by being precise. It will not say \"Great question!\". It will say \"Your brief for the meeting with Sergey is ready. Open it?\".",
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
    { after: "decisions", focus: "50% 46%", image: { src: "cases/grif-ai/brand-wing.webp", w: 1100, h: 1100, caption: "The product mark: the griffin's wing and its three pillars — proactive AI, interface, data work", kind: "brand" } },
  ],
  research: {
    lead: "We checked in two ways: with users and with investors.",
    methods: [
      {
        kind: "Tests and interviews",
        title: "The usual check",
        question: "Does a person understand what the system is doing now, what it has already done, and how to undo it?",
        sample: "User tests and interviews on the finished parts of the product",
        finding:
          "Trust rarely breaks from one big mistake. More often small unclear things wear it down: where the system got this from, what it has already done, how to undo it. So almost every decision in the interface answers one of two questions: \"can I see what is going on\" and \"can I take it back\".",
      },
      {
        kind: "Competitor review",
        title: "What people are already used to",
        question: "What can people already do after ChatGPT, Claude and Alice, and what will we have to teach?",
        sample: "ChatGPT, Claude, Alice (Yandex's voice assistant), neighbouring services and other teams' design files",
        finding:
          "A chat as the first screen is familiar to everyone. A feed where the system suggests things by itself is not. On the first screen it looks like one more inbox. So the chat became the main screen, and the feed lives next to it.",
      },
      {
        kind: "Investor run",
        title: "The rare check",
        question: "Will a person who sees the product for the first time get what it is about in a few minutes?",
        sample: "Investors went through real tasks in the finished part of the product",
        finding:
          "After this run the investors decided whether to keep working with us. Ease of use was only part of the answer. The interface got a second job: let the person finish the task and, in those same minutes, show how the product works. That is where the plain captions came from: \"Gathered context, 4 sources\" and \"I won't send this without your OK\".",
      },
      {
        kind: "Consistency audit",
        title: "An agent walks the whole user path",
        question: "Are the same things called the same names? Is there an error message and a way back everywhere?",
        sample: "The whole service flow, as a separate pass",
        finding:
          "This is dull work. A person does it badly by the seventh screen and does not do it at all by the twentieth. The agent walked the whole path and compared the names, the error messages and the ways back.",
      },
      {
        kind: "Figma file audit",
        title: "The main file was not telling the truth",
        question: "Do the declared styles match what is really used in the mock-ups?",
        sample: "A twelve-page kit read through MCP",
        finding:
          "The agent compared the styles that were declared with the ones really in use. It turned out that the page with light colours was left over from somebody else's template. We learned this while taking the file apart, and not when developers were already building pages.",
      },
    ],
    hypotheses: {
      intro: "Three assumptions about trust that we checked in both ways. The wording comes from the interface decisions. I have no numbers for them.",
      items: [
        { text: "If the pause shows what the system is reading, a person double-checks the answer less often.", verdict: "Step-by-step reasoning" },
        { text: "If the card says what the system will not do without asking, the fear \"it will get it wrong and send it anyway\" goes away.", verdict: "Action card" },
        { text: "If something sent can be undone, people confirm more boldly.", verdict: "Undo and \"Recall\"" },
      ],
    },
  },
  decisions: {
    lead: "Behind every decision there is a trait of character you can say out loud. A product that acts by itself runs on trust. So almost all the decisions answer two questions: can I see what is going on, and can I take it back.",
    items: [
      {
        id: "chat-home",
        title: "The first screen is a chat, and the feed sits next to it",
        found: "The feed where the system suggests things to do is the most striking idea in the product. It was very tempting to put it on the first screen. But the feed tells you what the system noticed, and a person arrives with a task of their own.",
        did: "I made the chat the first screen: a greeting, an input field and three prompts for typical jobs. The feed is the neighbouring section and comes forward by itself when it has something to say.",
        effect: "A person does not have to sort through someone else's to-do list at the door. The system can still start the conversation, but it does not talk over the person.",
        why: "The assistant has the right to speak first. It does not need the whole first screen for that.",
        basis: "Competitor review: a chat at the entrance is familiar, and a feed at the entrance looks like one more inbox.",
        image: img(G + "01.webp", 1024, 640, "First screen: a chat with a greeting, an input field and three prompts", "hero"),
      },
      {
        id: "reasoning",
        title: "Reasoning steps in place of a loader",
        found: "An assistant that reads mail, calendar and chats does not answer at once. A spinning loader at that moment only says \"wait\", and the pause feels longer.",
        did: "During the pause you see what the system is doing right now: \"Opened the calendar and the chat with the attendee, collecting what was agreed\". Then the steps fold into one line with the result.",
        effect: "By the time the answer arrives the person already knows what it rests on, and double-checks it less often.",
        why: "This is the trait \"silence is a message too\": the system shows its work. If the steps show that it went the wrong way, it gets stopped before it finishes.",
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
        did: "The \"Edit\" button opens a side panel where the email looks like an ordinary document. The chat stays in place and is visible on the left.",
        effect: "To fix an email you no longer have to argue with the assistant: \"no, say it differently\".",
        why: "A chat message is a reply, and an email is a thing. It is odd to explain in words what you can fix by hand.",
        basis: "Direct manipulation after Shneiderman: a person edits the thing itself instead of describing the edit in words.",
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
        "Moves interface parts into code",
        "Builds the design system showcases and the internal documentation",
        "Checks the whole user path for consistency",
      ],
    },
    right: {
      name: "Human",
      items: [
        "The product's character and the rules that follow from it",
        "What we do and in what order",
        "Fine-tuning until the work solves the business task",
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
    points: [
      "A design system from scratch: shared styling settings, three type families, interface parts with every state, showcases and documentation",
      "Twelve mock-up pages: chat, feed, memory, sources, settings, first-time setup, plus pages with variants and drafts",
      "Developers get the work through Storybook: working interface parts, and not pictures with descriptions",
      "A program watches over the design system. A colour or size typed in by hand, or a foreign typeface, stops the code from being accepted. The rule is the same for agents and for people",
    ],
    honesty:
      "This case has no product numbers. I show only what I can back up with the Figma file, the code on GitHub and Storybook. The test results are described in words, without percentages.",
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
