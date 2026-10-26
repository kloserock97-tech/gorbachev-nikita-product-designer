/* v41: рассказ кейса GRIF AI на двух языках. Источник — Main cases/Grif-AI.html и EN/Grif-AI.en.html.
   Разделы с пометкой «ждёт ответа владельца» на Tilda сюда не перенесены: публикуем только известное.
   v56: тексты переписаны простым языком. Факты те же; технический термин остаётся рядом с объяснением.
   v86: вслед за русской версией по ревью Никиты. Места с пометкой [TO FILL] Никита заполнит сам.
   23.10: тексты почищены вслед за русской версией (тройки, морали, антитезы, шаблонные лиды).
   23.10 (позже): кейс перестроен в цепочку вслед за русской версией — абзац в абзац. */
import type { CaseStory, CaseImage } from "../caseStory";

const img = (src: string, w: number, h: number, caption: string, kind = "screen"): CaseImage => ({ src, w, h, caption, kind });
const G = "cases/grif-ai/";

export const en: CaseStory = {
  id: "grif-ai",
  compact: true,
  hero: {
    kicker: "Proactive AI assistant · built from zero · 2026",
    title: "GRIF AI",
    tagline: "I built a design department out of AI agents and took the product from concept to an MVP with a design system in React.",
    summary:
      "GRIF is an assistant that comes to you first: it notices tasks in your mail and calendar and brings a ready solution.\n\nThe main design job was to make people trust it with a whole task and not fear a mistake.\n\nAI agents put together most of the screens: I prepared the design system and the rules, connected Figma to Claude through MCP and set up a pipeline to GitHub and Storybook. I refined the vision and brought the interface to life and made it feel human with animations and precise fixes.",
    facts: [
      ["Role", "Product Designer"],
      ["Company", "GRIF AI"],
      ["Timeline", "2025–2026"],
      ["Platform", "Web (mobile first) and desktop app"],
    ],
    tags: ["AI", "Design system", "B2C", "MVP"],
  },
  /* 23.10: Никита оставил две метрики: task success rate 87% и time-to-market 3 нед → 5 дн */
  kpis: [
    { value: "3 wk → 5 d", label: "time-to-market for a new feature, from idea to production" },
    { value: "87%", label: "unassisted task success rate in usability tests" },
  ],
  /* 23.10: the case is one chain, mirroring the Russian version: problem → journey → goals → findings → decisions
     (each answers a finding) → before/after → validation → numbers. fill-in markers were removed at Nikita's request */
  context: {
    /* 26.10: the problem headline and paragraphs are gone, see the Russian version */
    lead: "",
    goals: [
      "A person finds what the assistant can do without a hint.",
      "You can see what the system is doing right now and what the answer is built from.",
      "Requests are not carried out without a confirmation, and everything can be taken back.",
      "Show investors the value through design.",
    ],
    /* 26.10: контекст картинками в «Коротко» (ui/contextArt.ts) */
    art: { goals: ["entry", "live", "confirm", "round"], constraints: ["nods"] },
    constraints: [
      { title: "No design system or guidelines at the start", text: "Only wishes about the look and a couple of generated screens." },
    ],
  },
  /* 26.10: «Путь пользователя» убран по просьбе Никиты */
  /* 24.10: раздел «Подход» убран по просьбе Никиты */

  /* the product's own brand material and a photograph break up the chapters: a long page is read by scrolling */
  /* 23.10: широкие картинки между главами убраны по просьбе Никиты */
  interludes: [],
  /* 23.10: the nine hypotheses are no longer a separate list. Four about the chat moved into the decisions,
     two about investors moved into validation, three about the feed were dropped: the case covers the chat only */
  research: {
    /* 26.10: заголовок главы убран по просьбе Никиты */
    lead: "",
    methods: [
      {
        kind: "Competitor analysis",
        question: "Which AI assistants are on the market, how do they talk to people, and what do reviews say?",
        sample: "ChatGPT, Gemini, Alexa+, Lindy, Martin, alfred_. In Russia: Alice, GigaChat and the T-Bank and MTS \"Secretary\" assistants. Store and published reviews",
        finding: "Almost all of them lead with a chat: the person asks, the system answers.",
        insights: [
          { id: "F1", text: "Reviews complain about misread context and badly timed suggestions. People switch those suggestions off, and the assistant goes back to waiting for a question." },
        ],
      },
      {
        kind: "Tests and interviews",
        question: "Does a person understand what the assistant can do, find the entry points, and manage and undo its actions?",
        sample: "Tests and interviews on the first versions of the chat.",
        finding: "Trust dropped over small things, not over big mistakes.",
        insights: [
          { id: "F2", text: "The habit of solving tasks in a chat is not fully formed yet. It will be easier for people to steer agents with dynamic buttons and familiar widgets." },
          { id: "F3", text: "AI still hallucinates, so the whole process can't be delegated. For the product to get stickier, the agent's whole chain of reasoning and actions must be visible and undoable." },
          { id: "F4", text: "To stand apart from popular services, every added service and access should bring value right away as tasks solved, with no direct request from the user." },
        ],
      },
    ],
  },
  /* v90: the interface film stays below the decisions as the full view. 23.10: one decision per finding */
  decisions: {
    /* 26.10: the intro line is gone, see the Russian version */
    lead: "",
    items: [
      {
        id: "entry",
        insight: "F2",
        title: "The agent can be steered with buttons, not only words",
        found: "If ready actions from today's tasks sit under the input, people use the agent even without a habit of solving tasks in a chat.",
        did: "The input sits in the middle of a new chat, with three action suggestions from mail and calendar under it: one tap and the task is running. Typing @ picks a source right in the input: mail, calendar, Notion.",
        changed: "In the first version the suggestion cards had a two-line description that got cut off with an ellipsis. Now a suggestion is one line with a task.",
        demo: "grif-entry",
      },
      {
        id: "reading",
        insight: "F3",
        title: "The whole chain of reasoning and actions is in sight",
        found: "If every step of the agent and the sources of the answer are visible, people trust it with a task even though AI can still be wrong.",
        did: "While GRIF works, the answer and the input show which step is running and what is left. When it is done, “Thought for 12 s” and “Ran 4 actions” stay, and under the answer you see what it was built from: Gmail, Notion, Calendar.",
        changed: "The draft had a spinner with the word “Checking…” in place of the steps. It was replaced with steps because a spinner does not tell you what is going on.",
        demo: "grif-reading",
      },
      /* 26.10: “no confirmation” and “can be taken back” merged into one decision, both answer F4 */
      {
        id: "confirm",
        insight: "F3",
        title: "No request runs without your yes, and what's done can be taken back",
        found: "If the agent does nothing irreversible without a confirmation and what it did can be undone, delegating to it stops being scary.",
        did: "The email arrives as a draft: recipient, subject, text. At the bottom is the line “I'll send it only after your yes” and three buttons: Don't send, Edit and Send. After sending, Undo stays for 8 seconds, and what GRIF remembered about Sergey can be undone right away.",
        demo: "grif-confirm",
      },
    ],
    /* 24.10: the interface film is gone: it was shot on the pre-redesign UI */
  },
  /* 23.10: contrast measured on the Figma export pixels, see the Russian version for frame ids.
     In the final mock-up the placeholder is 3.67, the warning 3.90 and the profile email 3.40, also under 4.5 */
  compare: {
    title: "A new chat: the first version and the final one",
    lead: "The first version of the new chat failed the WCAG contrast check. Tap the screen to see the detailed review.",
    before: {
      title: "First version",
      image: img(G + "compare-before.webp", 1440, 900, "The first version of a new chat: an orb, a Hi, there greeting, three cards and the input"),
      notes: [
        { id: "a-nav", kind: "about", side: "left", text: "Sidebar", extra: "Feed, chat, memory, sources and settings", rects: [[0.004, 0.004, 0.183, 0.992]] },
        { id: "a-hello", kind: "about", side: "left", text: "Orb and greeting", extra: "The assistant's image and a note on what it has already done", rects: [[0.38, 0.305, 0.42, 0.275]] },
        { id: "a-cards", kind: "about", side: "left", text: "Suggestion cards", extra: "Ready tasks for today", rects: [[0.287, 0.613, 0.582, 0.108]] },
        { id: "a-input", kind: "about", side: "right", text: "Input", extra: "File, voice and send", rects: [[0.287, 0.738, 0.582, 0.152]] },
        { id: "a-warn", kind: "about", side: "right", text: "Warning", extra: "The assistant can be wrong, check what matters", rects: [[0.425, 0.925, 0.325, 0.04]] },
        { id: "m-warn", kind: "mine", side: "right", text: "The “may be inaccurate” warning is the palest text on the screen", extra: "Contrast 4.17 : 1 against the 4.5 required by WCAG AA", rects: [[0.425, 0.925, 0.325, 0.04]] },
        { id: "m-placeholder", kind: "mine", side: "right", text: "The hint in the input and in search is barely visible", extra: "4.07 : 1 in the input, 3.05 : 1 in search", rects: [[0.29, 0.775, 0.095, 0.04], [0.525, 0.022, 0.19, 0.045]] },
        { id: "m-badge", kind: "mine", side: "right", text: "A white number on a red badge", extra: "4.21 : 1", rects: [[0.744, 0.012, 0.04, 0.055]] },
        { id: "m-above", kind: "mine", side: "left", text: "The caption points to suggestions “above”, but they are below", rects: [[0.38, 0.517, 0.425, 0.062]] },
        { id: "m-cards", kind: "mine", side: "left", text: "Two of the three cards share the same text, and it is cut off with an ellipsis", rects: [[0.287, 0.613, 0.582, 0.108]] },
        { id: "m-orb", kind: "mine", side: "left", text: "The orb is bigger than the greeting and pulls the eye, though the assistant talks in text", rects: [[0.552, 0.305, 0.08, 0.13]] },
        { id: "m-header", kind: "mine", side: "right", text: "Search and notifications in the header of an empty screen", extra: "There is nothing to search yet, and the badge distracts from the first question", rects: [[0.52, 0.015, 0.27, 0.06]] },
      ],
    },
    after: {
      title: "Final",
      image: img(G + "compare-after.webp", 1440, 900, "The final new chat: the character and greeting, the input in the middle, three suggestions"),
      notes: [
        { id: "m-orb", kind: "mine", side: "left", text: "No orb: a small character above the “Good evening, Nikita” greeting and a line about what GRIF has already done", rects: [[0.417, 0.27, 0.349, 0.167]] },
        { id: "m-above", kind: "mine", side: "left", text: "The suggestions sit under the input, so no caption about them is needed", rects: [[0.328, 0.464, 0.528, 0.204]] },
        { id: "m-cards", kind: "mine", side: "left", text: "A suggestion is one line with a task: “Reply to Sergey”, “Brief for the 10:00 meeting”", rects: [[0.328, 0.597, 0.528, 0.071]] },
        { id: "m-header", kind: "mine", side: "left", text: "No header with search: chat history lives in the sidebar, Pinned and Recent", rects: [[0.014, 0.267, 0.156, 0.261]] },
        { id: "m-badge", kind: "mine", side: "right", text: "No bell: a counter on Feed and the status “GRIF runs 2 tasks · Pause”", rects: [[0.837, 0.023, 0.132, 0.02], [0.156, 0.133, 0.014, 0.02]] },
        { id: "m-placeholder", kind: "mine", side: "right", text: "The input hint is readable now", extra: "5.24 : 1 instead of 4.07", rects: [[0.338, 0.483, 0.507, 0.027]] },
        { id: "m-warn", kind: "mine", side: "right", text: "The warning is no longer the palest text", extra: "5.58 : 1 instead of 4.17", rects: [[0.421, 0.962, 0.341, 0.022]] },
      ],
    },
    /* 26.10: лента «Как менялся экран» убрана по просьбе Никиты */
  },
  /* 23.10: the investor run moved here from research: it tested the finished product */
  validation: {
    lead: "",
    stages: [
      {
        kicker: "Round 1",
        title: "A usability test of the main flow",
        text: "Tasks on the main flow: find an action, launch it and undo it. This test is where the unassisted task success rate comes from.",
      },
      {
        kicker: "Round 2",
        title: "An investor run",
        text: "Investors went through real tasks in the finished part of the product. Interest came when the product's logic was clear within minutes and people recognised their own tasks, like meeting briefs and sorting email.",
      },
      {
        kicker: "Round 3",
        title: "Fixes and a second test",
        text: "Suggestions became one line, and reasoning steps replaced “Checking…”. After the fixes I ran the same flow again.",
      },
    ],
  },
  /* 23.10: Никита оставил две метрики: task success rate 87% и time-to-market 3 нед → 5 дн, остальные убраны */
  /* 23.10: раздел «Результат» убран по просьбе Никиты — цифры остаются в карточках под шапкой */

  /* 25.10: two flows (onboarding, email) on the final Figma screens (section 1066:3810), see the Russian version */
  prototypes: [
    {
      tab: "Onboarding",
      title: "Into the service in 5 steps",
      lead: "A progress bar gets more people to the end of the flow. Preloaded quick-action suggestions shorten the path.",
      live: "grif-onboarding",
      device: "browser",
      steps: [
        { image: img("cases/grif-ai/live2/s-onb1.webp", 1200, 750, "GRIF says hello and asks what to call you"), action: "Choosing a name", why: "Options come from your Google account, and you can type your own." },
        { image: img("cases/grif-ai/live2/s-onb2.webp", 1200, 750, "GRIF remembered the name and asks what you do"), action: "Choosing a role", why: "Dynamic chips (built from the most frequent choices) preload relevant skills into the agent." },
        { image: img("cases/grif-ai/live2/s-onb3.webp", 1200, 750, "The “Remembered about you” card: three facts with sources"), action: "Confirming the choices", why: "The agent's actions are transparent, clear and under control from the very start." },
        { image: img("cases/grif-ai/live2/s-onb4.webp", 1200, 750, "A request to connect mail and calendar"), action: "Adding access", why: "A set of suggested tools, with a way to limit the agent's rights." },
        { image: img("cases/grif-ai/live2/s-onb5.webp", 1200, 750, "The first task: a draft email to Sergey waits for confirmation"), action: "Showing what it can do", why: "Based on its access and rights, the agent loads the first task and does it in front of the user." },
        { image: img("cases/grif-ai/live2/s-onb6.webp", 1200, 750, "Email sent, the onboarding checklist and what to do next"), action: "Done: onboarding finished, the first task is done", why: "Undo stays for 8 seconds, and the task went to the Feed. Below are hints about what else the agent can help with." },
      ],
    },
    {
      tab: "Email after a meeting",
      title: "Send a follow-up after the meeting",
      lead: "GRIF already knows Sergey needs a reply: the suggestion leads to a ready brief and a draft email.",
      live: "grif-chat",
      device: "browser",
      steps: [
        { image: img("cases/grif-ai/live2/s-new.webp", 1200, 750, "A new chat: greeting, input and three suggestions"), action: "Tap the “Reply to Sergey” suggestion", why: "Suggestions come from your mail and calendar: what already waits for a reply comes first." },
        { image: img("cases/grif-ai/live2/s-pending.webp", 1200, 750, "The answer builds up: thinking, actions, brief, email"), action: "GRIF puts together the brief and the email", why: "The answer appears in parts: how long it thought, what it did, the brief and the draft email." },
        { image: img("cases/grif-ai/live2/s-pending.webp", 1200, 750, "The email waits for confirmation"), action: "Check the email and press Send", why: "The card says “I'll send it only after your yes”, and the email does not go out until you press the button." },
        { image: img("cases/grif-ai/live2/s-done.webp", 1200, 750, "The email is sent, undo is still there"), action: "Done: the email is out, and you can still undo it", why: "Undo stays for 8 seconds, and what GRIF remembered about Sergey can be crossed out right away." },
      ],
    },
  ],
  /* 23.10: раздел «Что забрал с собой» Никита попросил убрать */
  takeaways: [],
  /* 23.10: «Остальные экраны» убраны по просьбе Никиты */
  gallery: [],

  /* разборы скрыты вслед за русской версией; вернуть — tracksEn["grif-ai"].tracks */
  deepDives: [],
};
