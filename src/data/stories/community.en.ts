/* v97 (portfolio-update-for-claude-code.md): "Community" and "Moderator workspace" are merged into one case, Mos.ru Stories,
   on the compact structure — the result, four numbers, five steps, a takeaway and "More details". Texts are verbatim
   from Nikita's brief. Screens: the feed film frame, the first-version feed with its dots, the story page, the profile
   and the moderator queue. Image captions are alt text only. */
import type { CaseStory, CaseImage } from "../caseStory";

const img = (src: string, w: number, h: number, caption: string, kind = "screen"): CaseImage => ({ src, w, h, caption, kind });
const C = "cases/community/";

export const en: CaseStory = {
  id: "community",
  hero: {
    kicker: "Consumer Product Design · Mos.ru · 2023–2025",
    title: "A place where Muscovites tell stories about their city",
    tagline: "From zero to MVP in nine months, then retention and a moderator workspace",
    summary:
      "stories.mos.ru is a place where both the editors and the residents write about the city. We built it from scratch: from first hypotheses to MVP in nine months. There were two designers. I did the research, the structure, the prototypes and the design system. When the stories came in faster than one person could check them, I also designed a moderator workspace.",
    facts: [],
    tags: [],
  },
  main: { film: { src: C + "film.mp4", poster: C + "film-poster.webp", w: 1920, h: 1080, caption: "Community interface film: feed, topics, audio, story map, profile, events and the story form" } },
  kpis: [
    { value: "250+", label: "resident stories in the first three months" },
    { value: "12–15%", label: "of readers come back within a week" },
    { value: "78.9%", label: "satisfied with the site (CSI)" },
    { value: "−25%", label: "moderation time after launch" },
  ],
  kpiNote: "Plus 169K views, about 3,000 comments and a 26% bounce rate: three out of four visitors stayed to read.",
  role: "Senior Product Designer · Responsive web · 2023–2025",
  steps: [
    {
      title: "The city had nowhere to talk about itself.",
      text: "In a couple of years Moscow lost almost all of its city-life media. Plenty of news, but nowhere to tell a story about your street or argue about your neighbourhood. And mos.ru is mostly people 55+. The job was to bring in 25–35 without losing the people already there.",
      image: img(C + "film-01.webp", 1600, 900, "The city had nowhere to talk about itself"),
    },
    {
      title: "Write and discuss.",
      text: "Every competitor had the same problem: the Follow button lived in a different spot on every screen. Like a light switch at a different height in every room. So on our site one action always looks the same and sits in the same place. And two actions got the main spot: write a story and reply to one.",
      gallery: {
        kind: "spot",
        image: img(C + "01.webp", 1440, 788, "Write and discuss"),
        spots: [
          { x: 46.3, y: 15.5, text: "Topics in one row" },
          { x: 10.4, y: 54.4, text: "Comments and share" },
          { x: 46.3, y: 76.4, text: "Consistent actions" },
        ],
      },
    },
    {
      title: "Two audiences, one screen.",
      text: "Younger people want a lively feed. Older people want nothing to get lost. Instead of a filter panel, topics in one line. Plain words. A typeface that stays readable even small. People read these stories for a while, so the interface shouldn't push in front of the text.",
      image: img(C + "06.webp", 1600, 1598, "Two audiences, one screen"),
    },
    {
      title: "Reading is only half of it.",
      text: "After launch the question was whether people come back. We added follows, reactions, achievements, karma and communities.",
      image: img(C + "film-05.webp", 1600, 900, "Reading is only half of it"),
    },
    {
      title: "Moderators are users too.",
      text: "Every story is checked before it goes live, and soon one admin in a shared admin panel couldn't keep up. I built two prototypes with opposite ideas: decide right in the list, or open a detailed page. We tested them with eight moderators. Both won: obvious cases get decided in the list, tricky ones open in full. The task got 32% faster in testing and 25% faster in production.",
      image: img("cases/figma/moderator-queue.webp", 1440, 1156, "Moderators are users too"),
    },
  ],
  takeaways: [
    "Agree on the goal before the first mockup. One phrase, \"a place where residents take part\", shaped everything: the MVP scope, the screens, the metrics. And think about the moderator before the queue grows.",
  ],
  more: [
    "Research: competitive analysis across eleven features, heuristic review, a composite persona \"Oleg, 30\".",
    "Left out of the MVP: groups, events, smart search, podcasts. The first version shipped sooner.",
    "Design system: its own, separate from mos.ru. Golos Text, WCAG contrast, components in every state.",
    "Moderator workspace: admin panel audit, 10 hypotheses, tabs by status, one logic for five object types.",
    "Mobile app: screens designed, the app didn't reach release.",
  ],
  /* старых глав у компактного кейса нет */
  context: { lead: "" },
  research: { lead: "", methods: [] },
  decisions: { lead: "", items: [] },
  gallery: [],
  deepDives: [],
};
