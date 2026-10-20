/* v97 (portfolio-update-for-claude-code.md): "AI agent risks" and the design process story are merged into one Sber case
   on the compact structure — the result, four numbers, five steps, a takeaway and "More details". Texts are verbatim
   from Nikita's brief. Main screen: the assessment list with its dots. Steps: the before / after journey (expanded),
   the risk edit screen, the draft being prepared, the "not applicable" reason and the sprint board. The journey
   is kept as it was; image captions are alt text only. */
import type { CaseStory, CaseImage } from "../caseStory";

const img = (src: string, w: number, h: number, caption: string, kind = "screen"): CaseImage => ({ src, w, h, caption, kind });
const A = "cases/ai-agents/";

export const en: CaseStory = {
  id: "ai-agents",
  hero: {
    kicker: "Complex UX & Design Leadership · Sber · 2025–2026",
    title: "AI agent risk assessment: from Jira, Excel and chats to one product",
    tagline: "Prep went from over two hours to 20–30 minutes. I also changed how design works in the team",
    summary:
      "At the bank, every AI agent goes through a risk assessment before it goes live. It used to live in Jira, Excel and private messages. Just to send an agent for assessment, a risk manager spent over two hours. I was the only designer on this module and took it from process map to production. Now it all happens in one product, and the system writes the first draft of the risks from the agent's documents.",
    facts: [],
    tags: [],
  },
  main: {
    gallery: {
      kind: "spot",
      image: img(A + "t-registry-assessments.webp", 1440, 900, "Risk assessment list"),
      spots: [
        { x: 90.2, y: 13.2, text: "Short numbers" },
        { x: 28.3, y: 26.4, text: "Filter labels" },
        { x: 89.2, y: 34.4, text: "Current sorting on the button" },
        { x: 52.2, y: 51.4, text: "Four loss amounts per card" },
      ],
    },
  },
  kpis: [
    { value: "2+ h → 20–30 min", label: "to send an agent for assessment" },
    { value: "6 → 0", label: "manual handoffs between people" },
    { value: "60 → 73", label: "CSI among product users" },
    { value: "~2,500", label: "employees use the product" },
  ],
  kpiNote: "And prep steps before the first assessed risk went from 4 to 1.",
  role: "Senior Product Designer · Internal web product · 2025–2026",
  /* the before / after journey, shown expanded in step 1 */
  flow: {
    title: "User journey: before / after",
    before: {
      title: "Before: Jira, Excel, portal, archives, email",
      steps: [
        { who: "Risk manager", step: "Gets an assessment task in Jira", note: "No data for it yet" },
        { who: "Administrator", step: "Makes an Excel export of agents from the systems catalogue", note: "By hand and only on request", wait: true },
        { who: "Administrator", step: "Forwards the export to the internal portal", note: "Leaves no trace", wait: true },
        { who: "Risk manager", step: "Packs the program code and business requirements into an archive", note: "No way to check that everything is there" },
        { who: "Risk manager", step: "Sends the archive to the portal", note: "Another wait", wait: true },
        { who: "Administrator", step: "Uploads the agent and the version", note: "The bottleneck: it all rests on one person", wait: true },
      ],
      summary: "Two people busy with preparation alone, waiting between the steps. And this is a shortened diagram.",
    },
    after: {
      title: "After: one product from request to approval",
      steps: [
        { who: "Risk manager", step: "Opens the shared list and sees the queue", note: "A summary on top: total, assessed, in progress" },
        { who: "Risk manager", step: "Creates an assessment and attaches the archive right in the card", note: "No administrator, no forwarding" },
        { who: "System", step: "Draws up the risk list from the documents", note: "The draft is ready before the person sits down to work" },
        { who: "Risk manager", step: "Edits levels and reasons, marks what does not fit as \"not applicable\"", note: "The reason stays next to the risk" },
        { who: "Four departments", step: "Add their conclusions in the same card", note: "The final score is calculated automatically" },
        { who: "Manager", step: "Approves the version", note: "Everyone sees the status" },
      ],
      summary: "The forwarding, manual export, archive packing and go-between administrator are gone. What is left is the assessment itself.",
    },
  },
  steps: [
    {
      title: "Understand first, draw later.",
      text: "At first I understood nothing about bank risk management. There was no process diagram, so I built one myself: I'd come to people with a new version of the map and ask where I got it wrong. Turned out the time doesn't go into the assessment itself. It goes into the prep: put together an archive, wait for an export, forward it, wait for an upload.",
      flow: true,
    },
    {
      title: "I started at the wrong end.",
      text: "I designed top-down first: list, agent card, risk. But the rules come from the lowest level. A single risk had states the upper screens didn't know about, and the list had to be redone. I rebuilt it bottom-up. Now with nested systems I always start from the deepest level.",
      image: img(A + "07.webp", 1200, 1800, "I started at the wrong end"),
    },
    {
      title: "The system writes the draft.",
      text: "Thirteen justifications from scratch take hours, even though most of it is already in the uploaded documents. Now the system reads the agent's documentation and prepares a draft, and the risk manager edits it. While it works, the screen shows progress and risk placeholders instead of an endless spinner.",
      image: img(A + "03.webp", 1440, 900, "The system writes the draft"),
    },
    {
      title: "\"Not applicable\" needs a reason.",
      text: "In a bank, someone will ask in a month why a risk was dismissed. So Accept stays disabled until there's a reason, and the reason is stored next to the risk.",
      image: img(A + "05.webp", 1440, 900, "\"Not applicable\" needs a reason"),
    },
    {
      title: "How design works in the team.",
      text: "From the fourth month, I also took on design lead duties. Tasks used to arrive as one line: \"need a modal\". I made a task template with a goal and a success metric, set up design reviews before development, allocated tasks, took part in quarterly planning and aligned with product owners and engineering. The way I see it, a lead doesn't have to draw more than everyone else. The job is to make good decisions happen without you.",
      image: img(A + "t-jira-sprint-board.webp", 1600, 788, "How design works in the team"),
    },
  ],
  takeaways: [
    "The person who knows the pain best is the one who has it. Dig into their work deep enough and even bank risk management turns into a system that makes sense. Well, almost.",
  ],
  more: [
    "Who's involved: process owner, risk manager, four approving departments, agent owners. Thirteen risk types.",
    "Constraints: every decision must be auditable, only the bank's design system, agent versions change almost daily, no process diagram existed.",
    "Smaller decisions: summary above the list, instant filter, short-number toggle (\"1M ₽\"), four-option sort, protection for unsaved justifications.",
    "Second mistake: I assumed one person does the assessment. There are four approvers, each at their own pace. Intermediate statuses and send-back appeared.",
    "Task template on a real example: the filter task broken down by fields.",
    "Numbers on the screenshots are demo data.",
  ],
  /* старых глав у компактного кейса нет */
  context: { lead: "" },
  research: { lead: "", methods: [] },
  decisions: { lead: "", items: [] },
  gallery: [],
  deepDives: [],
};
