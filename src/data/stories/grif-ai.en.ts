/* v97 (portfolio-update-for-claude-code.md): the case is rebuilt on the compact structure — the result, four numbers,
   five steps, a takeaway and "More details". Texts are verbatim from Nikita's brief; the example numbers made up earlier
   are gone. Screens: the second concept, the ready-action card, reasoning steps, the key visual (there is no design
   system screen in the repo) and the chat with an attachment (there is no Storybook screen). Image captions are alt text only. */
import type { CaseStory, CaseImage } from "../caseStory";

const img = (src: string, w: number, h: number, caption: string, kind = "screen"): CaseImage => ({ src, w, h, caption, kind });
const G = "cases/grif-ai/";

export const en: CaseStory = {
  id: "grif-ai",
  hero: {
    kicker: "AI Product Design · GRIF AI · 2025–2026",
    title: "An AI assistant that brings you a ready action on its own",
    tagline: "From someone else's concept to MVP. Acquired in August 2026",
    summary:
      "GRIF is a proactive AI assistant for employees of large companies. It connects to whatever the client picks: mail, messengers, calendar. It notices when something needs doing and brings a ready action. The person just says yes. I led the design from concept to MVP in an international team. In August 2026 the product was acquired.",
    facts: [],
    tags: [],
  },
  main: { film: { src: G + "film.mp4", poster: G + "film-poster.webp", w: 1920, h: 1080, caption: "GRIF interface film: input, greeting, chips, thinking steps, artefacts and accessibility" } },
  kpis: [
    { value: "87%", label: "of scenarios completed without a hint in usability tests" },
    { value: "3 wk → 5 d", label: "from idea to code" },
    { value: "2 days → 2 h", label: "from approved mockup to coded component" },
    { value: "2026", label: "the product was acquired" },
  ],
  role: "Founding Product Designer · International team · 2025–2026",
  steps: [
    {
      title: "Someone else's concept, no source files.",
      text: "I joined a product that was already live, built on an agency's concept. There was no access to the design files, so first I rebuilt the design in Figma straight from production. Then the audit: the design system failed WCAG checks, the main flow didn't make sense, and there were plenty of small UX issues. I made a second concept, and the team switched to it.",
      image: img(G + "05.webp", 1440, 900, "Someone else's concept, no source files"),
    },
    {
      title: "When should an assistant speak first.",
      text: "Products taught us the opposite: you ask, the system answers. An assistant that comes to you on its own is either a lifesaver or a pain. Like a coworker who drops by every five minutes \"just to ask\". So GRIF doesn't ask \"how can I help?\". It brings an action that's already put together, and only when there's a reason.",
      image: img(G + "03.webp", 1436, 1292, "When should an assistant speak first"),
    },
    {
      title: "Trust is made of small things.",
      text: "The assistant acts on the person's behalf, and the main fear is simple: it'll get it wrong and hit send. So the action is visible before it runs, every answer shows its sources and reasoning steps, and you can undo at any step. We checked this in moderated usability tests with target users and with a prospective partner.",
      image: img(G + "t-chat-reasoning-steps.webp", 1380, 304, "Trust is made of small things"),
    },
    {
      title: "Personality, written as rules.",
      text: "Telling an agent \"make it calm and premium\" is useless. It's like \"salt to taste\" in a recipe: you need a teaspoon. So I turned the product's personality into rules: 120–200 ms animations, one blue accent per screen, \"Watching, all quiet\" instead of a spinner. The design system grew out of these rules: tokens, three type families for Latin and Cyrillic, components in every state.",
      image: img(G + "brand-visual.webp", 1100, 1100, "Personality, written as rules"),
    },
    {
      title: "A team of agents.",
      text: "One agent ran usability checks, another did design QA, the third moved components to GitHub and Storybook. I set the rules and accepted the work. Agents don't argue, by the way. A human designer will ask \"why?\", and some bad ideas die right there. So I had to learn to spell out very clearly what's good and what's not.",
      image: img(G + "t-chat-attach.webp", 1440, 900, "A team of agents"),
    },
  ],
  takeaways: [
    "With agents the work doesn't go away, it changes: less drawing, more rules that can't be read two ways. Deciding what actually hits people's pain is still a human job.",
  ],
  more: [
    "Competitors: ChatGPT, Gemini, Alexa+, Lindy and others. Almost all of them lead with a chat, and reviews complain about off-target suggestions.",
    "Tests: find an action, run it, undo it. An action with no entry point doesn't exist for the user.",
    "What we said no to: model picker, folders and projects, wake word.",
    "Type: Sora for Latin, Golos Text for Cyrillic, Inter for UI.",
    "The MVP was demoed to investors ahead of the acquisition.",
  ],
  /* старых глав у компактного кейса нет */
  context: { lead: "" },
  research: { lead: "", methods: [] },
  decisions: { lead: "", items: [] },
  gallery: [],
  deepDives: [],
};
