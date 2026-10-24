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
      "GRIF is an assistant that comes to you first: it notices tasks in your mail and calendar and brings a ready solution. The main design job was to make people trust it with a whole task and not fear a mistake. We built it from zero on a small budget, so AI agents put together most of the design: I prepared the design system and the rules, connected Figma to Claude through MCP and set up a pipeline to GitHub and Storybook. Agents built screens and components, I owned the vision, fixes and animations.",
    facts: [
      ["Role", "Founding Product Designer"],
      ["Company", "GRIF AI"],
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
  /* 23.10: the case is one chain, mirroring the Russian version: problem → journey → goals → findings → decisions
     (each answers a finding) → before/after → validation → numbers. fill-in markers were removed at Nikita's request */
  context: {
    lead: "People switch off an assistant that speaks first after a couple of misses.",
    text:
      "GRIF is a personal assistant that comes to you first. It connects to your mail, messengers, calendar and finances, notices when something needs doing and brings a ready solution. The person only agrees or declines.\n\nBut services have taught people the opposite habit: the person asks, the system answers. When an assistant shows up with something that matters, people are glad. When it shows up with a trifle or at the wrong moment, they switch it off. So the main job of the interface is to make a person trust GRIF with a whole task: hand over the meeting notes and send an email they did not write.",
    goals: [
      "A person finds what the assistant can do without a hint.",
      "You can see what the system is doing right now and what the answer is built from.",
      "Nothing goes out without a confirmation, and everything can be taken back.",
      "Text is readable: contrast meets WCAG AA.",
      "An investor understands how the product works within a few minutes.",
    ],
    constraints: [
      { title: "An abstract idea at the start", text: "No research, and the market is only taking shape." },
      { title: "A limited budget", text: "Until the investment came, there was little money for research or a team." },
      { title: "No design system and no shared settings", text: "Only wishes about the look and a couple of generated screens." },
      { title: "A real team and a deadline", text: "Development needed regular, clear deliveries, and investment rounds were already on the calendar." },
    ],
  },
  journey: {
    title: "A follow-up after a meeting",
    lead: "The main scenario I tested the chat on: the meeting is over and the agreements need to go out in an email.",
    steps: [
      { kicker: "Before", title: "The meeting is over", note: "A call with Sergey from AcmeCorp, the notes are in the calendar and the threads", outside: true },
      { kicker: "Step 1", title: "Hand over the task", note: "One sentence in the input or the “Reply to Sergey” suggestion" },
      { kicker: "Step 2", title: "GRIF gathers context", note: "Calendar, threads and notes. The person waits but sees what is happening" },
      { kicker: "Step 3", title: "Check the brief and the email", note: "The sources are listed under the brief, the email comes as a draft" },
      { kicker: "Step 4", title: "Send or take back", note: "The email will not go out without a confirmation, and it can be taken back after sending" },
    ],
    measured: "I counted unassisted task success on steps 1, 3 and 4: find an action, launch it and undo it. GRIF does step 2 on its own.",
  },
  /* 24.10: раздел «Подход» убран по просьбе Никиты */

  /* the product's own brand material and a photograph break up the chapters: a long page is read by scrolling */
  /* 23.10: широкие картинки между главами убраны по просьбе Никиты */
  interludes: [],
  /* 23.10: the nine hypotheses are no longer a separate list. Four about the chat moved into the decisions,
     two about investors moved into validation, three about the feed were dropped: the case covers the chat only */
  research: {
    lead: "First I looked at how assistants talk to people, then I showed people the first versions of the chat.",
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
          { id: "F2", text: "An action with no entry point does not exist for a person. People looked where they already look: in the input and in the suggestions under it." },
          { id: "F3", text: "While the system thinks in silence, a person cannot tell whether it is working or stuck. A finished answer with no source got checked by hand." },
          { id: "F4", text: "People were scared the assistant would get it wrong and send the email itself, and that a started action could not be stopped." },
        ],
      },
    ],
  },
  /* v90: the interface film stays below the decisions as the full view. 23.10: one decision per finding */
  decisions: {
    lead: "Four decisions in the chat. Each one answers its own finding, and I adjusted each one after testing.",
    items: [
      {
        id: "entry",
        insight: "F2",
        title: "Entry points where people already look",
        found: "If an action has an entry point in the input or in the suggestions under it, people find it without a hint.",
        did: "The input sits in the middle of a new chat, with three suggestions from today's tasks under it. Typing @ picks a source right in the input: mail, calendar, Notion.",
        changed: "In the first version the suggestion cards had a two-line description that got cut off with an ellipsis. Now a suggestion is one line with a task.",
        demo: "grif-entry",
      },
      {
        id: "reading",
        insight: "F3",
        title: "You can see GRIF reading and where the answer comes from",
        found: "If you can see the system reading and the answer names its source, people double-check it less.",
        did: "While GRIF works, the answer and the input show which step is running and what is left. When it is done, “Thought for 12 s” and “Ran 4 actions” stay, and under the answer you see what it was built from: Gmail, Notion, Calendar.",
        changed: "The draft had a spinner with the word “Checking…” in place of the steps. It was replaced with steps because a spinner does not tell you what is going on.",
        demo: "grif-reading",
      },
      {
        id: "confirm",
        insight: "F4",
        title: "Nothing goes out without a confirmation",
        found: "If the interface says “I won't send this without your confirmation”, the fear that it will get it wrong and send goes away.",
        did: "The email arrives as a draft: recipient, subject, text. At the bottom is the line “I'll send it only after your yes” and three buttons: Don't send, Edit and Send. The Feed works the same way: the email to Sergey sits under “Waiting for you” and goes out only when you press the button.",
        demo: "grif-confirm",
      },
      {
        id: "undo",
        insight: "F4",
        title: "A sent email can be taken back",
        found: "If a sent action can be undone, people confirm more boldly.",
        did: "After sending, Undo stays for 8 seconds. What GRIF remembered can be undone right away, and a record forgotten in Memory can be restored within 10 seconds.",
        demo: "grif-undo",
      },
    ],
    /* 24.10: the interface film is gone: it was shot on the pre-redesign UI */
  },
  /* 23.10: contrast measured on the Figma export pixels, see the Russian version for frame ids.
     In the final mock-up the placeholder is 3.67, the warning 3.90 and the profile email 3.40, also under 4.5 */
  compare: {
    title: "A new chat: the first version and the final one",
    lead: "The first version of the new chat failed the WCAG contrast check. Hover a note to see its spot on the screen.",
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
    versions: [
      { image: img(G + "v1-orb.webp", 960, 600, "The version with an orb"), label: "Orb", note: "Failed contrast, the orb pulls attention" },
      { image: img(G + "v2-navy.webp", 960, 600, "A dark blue version with no orb"), label: "No orb", note: "The input in the middle, files in a row" },
      { image: img(G + "v3-light.webp", 960, 600, "A light theme try"), label: "Light theme", note: "Tried it and stayed with the dark one" },
      { image: img(G + "compare-after.webp", 1440, 900, "The final new chat"), label: "Final", note: "A character in place of the orb, all text at 5.2 : 1 or more" },
    ],
  },
  /* 23.10: the investor run moved here from research: it tested the finished product */
  validation: {
    lead: "I tested it in three rounds.",
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

  /* 24.10: three flows on the final Figma screens (section 1066:3810), see the Russian version */
  prototypes: [
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
    {
      tab: "Feed",
      title: "Clear the feed in a minute",
      lead: "On top is what waits for your decision, below is what GRIF is doing on its own.",
      live: "grif-feed",
      device: "browser",
      steps: [
        { image: img("cases/grif-ai/live2/s-feed.webp", 1200, 750, "The feed: waiting for you, now, done, next"), action: "Open the task “Preparing the brief for the team meeting”", why: "Running tasks come with a progress bar and a step, so you see how much is left." },
        { image: img("cases/grif-ai/live2/s-feedRun.webp", 1200, 750, "Live steps of the task on the right"), action: "Clear the queue: press Send", why: "The task steps are on the right and can be stopped. Queue rows wait for one tap: GRIF prepared everything." },
        { image: img("cases/grif-ai/live2/s-feedEmpty.webp", 1200, 750, "All cleared"), action: "Done: nothing waits for a decision", why: "An empty feed says GRIF will finish the remaining tasks itself and will write if it needs you." },
      ],
    },
    {
      tab: "Memory",
      title: "Remove what GRIF should not keep",
      lead: "Everything GRIF remembered is out in the open, and any record can be forgotten.",
      live: "grif-memory",
      device: "browser",
      steps: [
        { image: img("cases/grif-ai/live2/s-memory.webp", 1200, 750, "The dossier: what GRIF knows about Nikita"), action: "Open the “Mom” card", why: "Memory works like a dossier: about you, people, preferences, rules. Each record shows where it came from." },
        { image: img("cases/grif-ai/live2/s-forget.webp", 1200, 750, "Forget this record?"), action: "Press Forget", why: "Before deleting, GRIF shows the whole record and says plainly that chats where it came up will stay." },
        { image: img("cases/grif-ai/live2/s-forget.webp", 1200, 750, "Record forgotten, can be restored"), action: "Done: the record is forgotten and can be restored", why: "Restore stays for 10 seconds, like undo for an email in the chat." },
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
