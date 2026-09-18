/* Страницы кейсов внутри сайта (v26, src/ui/caseView.ts). Тексты и цифры — из английских страниц кейсов
   (Main cases/EN, они же на Tilda), метаданные сверены с igloo/content/projects/*.mdx; ничего не досочинено:
   чего нет в источнике — null. Картинки — public/cases/<id>/NN.webp (≤1600 px).
   Сгенерировано из выгрузки; правится руками как обычные данные. */
import { getLang } from "../i18n";
import ruDetails from "./caseDetails.ru";

export type CaseImage = { src: string; w: number; h: number; caption: string; kind: string };
export type CaseDetail = {
  id: string; title: string; tagline: string; kicker: string; company: string | null; role: string; timeline: string;
  team: string | null; focus: string | null; platforms: string[]; tags: string[]; overview: string;
  problem: { text: string; points: string[] }; solution: { text: string; points: string[] };
  results: { metrics: { value: string; label: string }[]; points: string[] }; learnings: string[];
  quote: string | null; images: CaseImage[];
};

const details: CaseDetail[] = [
  {
    "id": "grif-ai",
    "title": "GRIF AI",
    "tagline": "I built a design function out of AI agents, from a couple of screens to Storybook.",
    "kicker": "Proactive AI assistant · Grif AI",
    "company": "Grif AI",
    "role": "Lead Product Designer",
    "timeline": "2025 to 2026",
    "team": "Solo designer running a team of AI agents; human frontend and backend developers",
    "focus": "Design system from zero, AI-first Figma to Storybook pipeline",
    "platforms": [
      "web"
    ],
    "tags": [
      "AI",
      "Design system",
      "B2C",
      "Leadership"
    ],
    "overview": "GRIF is a proactive personal assistant: it connects to your email, messengers, calendar and finances, notices what needs doing and brings a ready-made action. The user doesn't write a prompt, they approve or decline. I ran product design solo, while agents did the drawing, assembling and moving to code: Claude worked inside Figma via MCP, components went to GitHub, and developers built pages from Storybook.",
    "problem": {
      "text": "What I got was an idea, a couple of screens and not a single line of code. A real dev team on a budget needed regular, clear deliverables, and a design system alone can take a month by hand before the first screen. On top of that, a proactive assistant speaks first, so every appearance spends someone's attention and has to earn it.",
      "points": [
        "No design system, no tokens, no components, an empty repository",
        "Developers' time cost money, and so did their downtime",
        "Timelines agreed task by task: every iteration had to end with something to hand over",
        "Agents follow rules well but are bad at guessing taste"
      ]
    },
    "solution": {
      "text": "I described the product's character first and turned it into checkable rules, then built a pipeline where the same agent reads Figma, draws components and moves them to code, with Storybook as the contract.",
      "points": [
        "Character \"Quiet strategist\" as a spec: 120 to 200 ms transitions, one blue accent per screen, no spinner, source chips under every answer",
        "Figma read via MCP as a file system: components, variants and styles, not image exports",
        "Storybook as the contract: developers assemble pages from working components in every state",
        "A design system you can't break quietly: a raw colour, raw size, foreign font or internal import fails the build",
        "Trust-first interface: chat as home screen, reasoning steps instead of a spinner, nothing leaves without your OK, undo after sending, memory you can say no to"
      ]
    },
    "results": {
      "metrics": [
        {
          "value": "12",
          "label": "mock-up pages: chat, feed, memory, sources, settings, onboarding"
        },
        {
          "value": "4",
          "label": "compliance rules that fail the build"
        }
      ],
      "points": [
        "Design system from zero: tokens, typography across three families, components with states, showcases and docs",
        "Dev handoff through Storybook: working components instead of mock-ups or descriptions",
        "Design system compliance checked by a machine at build, for agents and humans alike",
        "The first concept was fully designed and thrown out because its development timeline grew unacceptable",
        "Validation ran on two tracks: user tests and interviews, and investors working through real tasks in the interface"
      ]
    },
    "learnings": [
      "With a team of agents, a design lead stops explaining, checking and waiting, and spends the time phrasing rules that can't be read two ways and deciding what counts as good.",
      "The agent doesn't argue, and that's dangerous: a bad idea makes it all the way to a finished mock-up, so you have to ask yourself \"why\" on your own.",
      "An agreement holds only if something other than goodwill enforces it. While the design system was just words, everyone broke it, me included. Once it became a build check, the argument was over in a day.",
      "How fast a product gets built is mostly decided in design, before development starts."
    ],
    "quote": "You can ignore a component library. You can't ignore a failed build, so that's what I turned the design system into.",
    "images": [
      {
        "src": "cases/grif-ai/01.webp",
        "w": 1024,
        "h": 640,
        "caption": "Home screen: chat is the way into the product, with a greeting, input field and three suggestions",
        "kind": "hero"
      },
      {
        "src": "cases/grif-ai/02.webp",
        "w": 1024,
        "h": 268,
        "caption": "Feed: one card, one suggestion, one question, in four states",
        "kind": "screen"
      },
      {
        "src": "cases/grif-ai/03.webp",
        "w": 1024,
        "h": 922,
        "caption": "Action card with Edit, Decline, Send: nothing leaves without your OK",
        "kind": "screen"
      },
      {
        "src": "cases/grif-ai/04.webp",
        "w": 1024,
        "h": 300,
        "caption": "Conclusion first, then source chips and a memory note you can decline",
        "kind": "detail"
      },
      {
        "src": "cases/grif-ai/05.webp",
        "w": 1024,
        "h": 640,
        "caption": "Side panel: the email is edited like a document while the chat stays visible",
        "kind": "screen"
      },
      {
        "src": "cases/grif-ai/06.webp",
        "w": 1024,
        "h": 772,
        "caption": "After sending: Undo at the top and Recall in the conversation",
        "kind": "screen"
      },
      {
        "src": "cases/grif-ai/07.webp",
        "w": 1024,
        "h": 128,
        "caption": "Step-by-step reasoning shows what the system is doing during the pause",
        "kind": "detail"
      }
    ]
  },
  {
    "id": "ai-agents",
    "title": "AI agent risks",
    "tagline": "Pulled AI agent risk assessment out of email threads and Excel into a single registry.",
    "kicker": "Internal product · Risk management · Sber",
    "company": "Sber",
    "role": "Product Designer",
    "timeline": "2025",
    "team": "Only product designer; engineering, analytics and risk methodology came from the team",
    "focus": "Discovery, process mapping, information architecture",
    "platforms": [
      "web",
      "desktop"
    ],
    "tags": [
      "AI",
      "Enterprise",
      "Risk management",
      "B2B"
    ],
    "overview": "Inside Sber, an AI agent is closer to an employee than a chatbot: it has a version, an owner, a lifecycle status and risks ordinary software never had. Four departments assess each version and it all rolls up into an integrated score. I designed the registry that moved this assessment out of Jira tickets, Excel exports and forwarded archives into one product.",
    "problem": {
      "text": "Agent versions changed almost daily, while the risk assessment lived in Jira tickets, Excel exports and archives people forwarded to each other. The brief arrived as a symptom: \"we can't keep up and we can't see the big picture\". No process diagram existed in any form.",
      "points": [
        "Six manual handoffs before the assessment even started, each twenty minutes or more of active work plus waiting",
        "Thirteen risk types per version and four approving departments working at their own pace",
        "A regulated process: every decision has to leave a trail of who, when and on what grounds",
        "The bank's design system: no reinventing components"
      ]
    },
    "solution": {
      "text": "Process first, screens second: I built a role-based process map from tracker tasks, found where work changed hands, and moved document collection and the risk draft inside the product.",
      "points": [
        "Four levels of nesting, from registry to agent and versions, to risk list, to a single risk",
        "Summary above the list: total agents, assessed, in assessment, breakdown by risk level",
        "Risks auto-generated from uploaded documents, with progress and skeletons instead of a spinner",
        "\"Not applicable\" status only with a written reason, so the audit trail builds itself",
        "Separate opinions from four departments plus an integrated score, with visible \"no assessment\" states",
        "Auto-apply filters with chips, four sort options, a number simplification toggle"
      ]
    },
    "results": {
      "metrics": [
        {
          "value": "6 → 0",
          "label": "manual handoffs in the assessment route"
        },
        {
          "value": "13",
          "label": "risk types per agent version"
        },
        {
          "value": "4",
          "label": "departments give an opinion in one card"
        },
        {
          "value": "20+ min",
          "label": "active work per handoff step removed"
        }
      ],
      "points": [
        "Data prep is no longer a human's job: four steps of twenty minutes or more replaced by one upload screen",
        "Version status is visible without asking, right in the registry and the card",
        "The go-between administrator role dropped out of the chain"
      ]
    },
    "learnings": [
      "In enterprise products the pain is rarely on the screen. It sits in the handoffs between people, and a process map is how you find it.",
      "In nested systems, start at the lowest data level: the entity the work revolves around sets the vocabulary of states.",
      "Before mock-ups, map who touches the object and when: it uncovers intermediate states nobody mentions in interviews.",
      "Go to engineering earlier: two of my three mistakes cost sprints and could have been settled by one question before the mock-ups."
    ],
    "quote": "Ask a risk manager what to improve and you'll hear about a button. Count the handoffs in their route and you'll see the button has nothing to do with it.",
    "images": [
      {
        "src": "cases/ai-agents/01.webp",
        "w": 1600,
        "h": 1128,
        "caption": "AI agent registry: the summary answers how many in total and how many are done, the list answers what to do next",
        "kind": "hero"
      },
      {
        "src": "cases/ai-agents/02.webp",
        "w": 1600,
        "h": 1048,
        "caption": "Agent card before assessment: empty, but you can see what is missing",
        "kind": "screen"
      },
      {
        "src": "cases/ai-agents/03.webp",
        "w": 1600,
        "h": 1078,
        "caption": "Parsing the archive: progress and skeletons of upcoming risks instead of a spinner",
        "kind": "screen"
      },
      {
        "src": "cases/ai-agents/04.webp",
        "w": 1600,
        "h": 1060,
        "caption": "Applied filters show as chips and can be removed one by one",
        "kind": "screen"
      },
      {
        "src": "cases/ai-agents/05.webp",
        "w": 1338,
        "h": 648,
        "caption": "\"Not applicable\" dialog: the action unlocks only once a reason is written",
        "kind": "detail"
      },
      {
        "src": "cases/ai-agents/06.webp",
        "w": 1600,
        "h": 1040,
        "caption": "Sorting: four options instead of sorting by every field",
        "kind": "detail"
      },
      {
        "src": "cases/ai-agents/07.webp",
        "w": 1464,
        "h": 1836,
        "caption": "Editing a risk: level and rationale",
        "kind": "screen"
      },
      {
        "src": "cases/ai-agents/08.webp",
        "w": 1600,
        "h": 788,
        "caption": "Two-week design sprint board with a separate review column before development",
        "kind": "detail"
      }
    ]
  },
  {
    "id": "community",
    "title": "Community",
    "tagline": "Moscow's city-stories platform with user-generated content and moderation, shipped to production at stories.mos.ru.",
    "kicker": "Web platform · Mos.ru",
    "company": "Moscow Department of Information Technology (Mos.ru)",
    "role": "Product / UX Designer",
    "timeline": "2024",
    "team": null,
    "focus": "Research, IA, design system, MVP launch",
    "platforms": [
      "web"
    ],
    "tags": [
      "GovTech",
      "B2C",
      "Community",
      "Design system"
    ],
    "overview": "In two years Moscow's lifestyle media had shut down one after another, and the city had nothing left to engage residents with. I built a product with user-generated content and moderation for Mos.ru, the Moscow city services portal, from zero to MVP in nine months. I treated the brief as an engagement problem rather than a website to draw.",
    "problem": {
      "text": "Many lifestyle and city media outlets closed down, and what was left in the news feed was politics and economics. Moscow had no place where a resident does more than read: shares a story, comments, argues. The catch: content comes from two sources at once, the editorial team and the users, and all of it goes through moderation.",
      "points": [
        "Two content sources, one moderation flow",
        "Competitors put follow and unfollow on different screens, and users get lost",
        "Part of the audience struggles with complex filters and a crowded interface"
      ]
    },
    "solution": {
      "text": "I got stakeholders to agree on a place where residents take part in city life instead of another news shop window, and built the platform around posts and comments with a calm design system for long reads.",
      "points": [
        "MVP scope: feed, stories, comments; no groups or events yet",
        "One publishing flow for two sources through a shared moderation queue with statuses and rejection reasons",
        "One predictable follow and unfollow pattern across the whole platform",
        "Minimalism, hints, plain language and familiar gestures for both 24 to 35 and 55+ audiences",
        "Design system from scratch: Golos Text, calm black, one soft pink accent (#FFECF9)"
      ]
    },
    "results": {
      "metrics": [
        {
          "value": "169.4K",
          "label": "views in the first three months"
        },
        {
          "value": "26.25%",
          "label": "bounce rate"
        },
        {
          "value": "78.9%",
          "label": "CSI, satisfaction index"
        },
        {
          "value": "3:20",
          "label": "average time on site per visit"
        }
      ],
      "points": [
        "250+ residents' stories passed moderation and about 3K comments in three months",
        "Roughly one reader in four comes back within a week",
        "Nine out of ten usability participants followed and unfollowed on the first try",
        "The older audience rated navigation as easy as the younger one did",
        "The moderation loop later grew into its own case study, Moderator Dashboard"
      ]
    },
    "learnings": [
      "Expensive ideas like multi-touch search and podcasts went honestly to the roadmap backlog, and that's how the MVP shipped sooner.",
      "The numbers are decent, not dazzling, and the service still has a lot of room to grow."
    ],
    "quote": "The brief said \"draw a website\". I read it as \"raise engagement\".",
    "images": [
      {
        "src": "cases/community/01.webp",
        "w": 1473,
        "h": 806,
        "caption": "Pilot feed: editorial pieces and user stories in one stream",
        "kind": "hero"
      },
      {
        "src": "cases/community/02.webp",
        "w": 1600,
        "h": 794,
        "caption": "Story page: tags, authors and related pieces close at hand",
        "kind": "screen"
      },
      {
        "src": "cases/community/03.webp",
        "w": 733,
        "h": 722,
        "caption": "\"Tell your story\" form: title, text, up to ten images, then off to moderation",
        "kind": "screen"
      },
      {
        "src": "cases/community/04.webp",
        "w": 1338,
        "h": 806,
        "caption": "About page: the manifesto and the product's running ticker",
        "kind": "screen"
      },
      {
        "src": "cases/community/05.webp",
        "w": 1105,
        "h": 788,
        "caption": "Feedback: tech support and ideas in one window, socials next to them",
        "kind": "screen"
      },
      {
        "src": "cases/community/06.webp",
        "w": 1600,
        "h": 1598,
        "caption": "Type scale built for long reads, from hero heading to captions",
        "kind": "detail"
      },
      {
        "src": "cases/community/07.webp",
        "w": 1600,
        "h": 770,
        "caption": "Competitor analysis: main competitors compared on eleven features",
        "kind": "detail"
      }
    ]
  },
  {
    "id": "moderator-dashboard",
    "title": "Moderator Dashboard",
    "tagline": "A moderator dashboard for Community, Moscow's city-stories platform: comments, users, publications, groups and posts in a single flow.",
    "kicker": "B2B dashboard · Mos.ru · 2024",
    "company": "Moscow Department of Information Technology (DIT)",
    "role": "UX designer",
    "timeline": "2024",
    "team": "Analyst (Sasha) who wrote the functional requirements, plus the engineering team",
    "focus": "Research, interaction logic, prototypes, usability testing",
    "platforms": [
      "web",
      "desktop"
    ],
    "tags": [
      "B2B",
      "GovTech",
      "Research",
      "Usability testing"
    ],
    "overview": "Community kept growing, and so did the stream of content, yet a single administrator sorted through all of it inside the general admin panel. I split the moderator out as a separate role and built them a workspace of their own: one mechanism for every entity, plus inline review straight from the list. I checked it in moderated usability testing with 8 moderators and 2 prototypes.",
    "problem": {
      "text": "The city-stories platform on Mos.ru took off, and with it the stream of user content: comments, publications, complaints. All of it landed on one administrator, who dug through the backlog in the same admin panel that ran everything else. A ban button wouldn't fix that. Moderation needed a workspace built for mixed entities, with one way of handling all of them.",
      "points": [
        "In the general admin panel, comments landed in one big pile, and moderators couldn't tell what to grab first.",
        "Short, clear-cut comments (\"thanks\", obvious spam) still required opening a card for every single one.",
        "For a disputed comment, moderators had to dig up the original post and the author's history by hand."
      ]
    },
    "solution": {
      "text": "I designed a registry with quick verdicts for routine cases, plus a rich card for the tricky cases, all built on one mechanism that every entity type plugs into.",
      "points": [
        "A registry sorted by status: Awaiting review, Reviewed, Unwanted, Reported, Sent to manager.",
        "Quick verdicts right in the registry: the obvious gets closed without opening a card. One click instead of five.",
        "A rich card for disputed comments: original post, author profile with karma, reply thread, moderation history and reports on one screen.",
        "One action pattern with shared statuses and rejection reasons for comments, users, publications, groups and posts."
      ]
    },
    "results": {
      "metrics": [
        {
          "value": "−38%",
          "label": "Scenario steps on the target task"
        },
        {
          "value": "−32%",
          "label": "Time per task"
        },
        {
          "value": "4.3 / 5",
          "label": "Moderator satisfaction in testing"
        },
        {
          "value": "5 types",
          "label": "Entities handled by one mechanism"
        }
      ],
      "points": [
        "Moderators found the right group of comments on the first try in testing.",
        "Most of the time saved came from verdicts right in the registry. The top praise was \"you don't have to dive in anywhere\".",
        "This is a prototype research result, not a production metric: the dashboard went into development based on these mock-ups."
      ]
    },
    "learnings": [
      "I built two prototypes around opposite bets (a rich card vs. quick verdicts), and the winner turned out to be a mix of the two.",
      "I interviewed developers about constraints before the mock-ups. It's cheaper to learn them then than after.",
      "One shared mechanism means moderators learn the dashboard once, and the product grows sideways without new UX for every section."
    ],
    "quote": "Quick verdicts in the registry save clicks, and a moderator's working day is mostly clicks.",
    "images": [
      {
        "src": "cases/figma/moderator-queue.png",
        "w": 1440,
        "h": 1156,
        "caption": "User review queue with filters, assignees, statuses and complaints",
        "kind": "hero"
      },
      {
        "src": "cases/figma/moderator-profile.png",
        "w": 1440,
        "h": 861,
        "caption": "User profile with moderation context and related entities",
        "kind": "screen"
      },
      {
        "src": "cases/figma/moderator-confirm.png",
        "w": 1440,
        "h": 861,
        "caption": "Confirmation before a moderator takes responsibility for the case",
        "kind": "screen"
      }
    ]
  },
  {
    "id": "stop-spam",
    "title": "Stop Spam",
    "tagline": "Gamified onboarding for an anti-spam app where each critical permission request is a visible step toward protection.",
    "kicker": "Anti-spam app · iOS · Android · 2026",
    "company": null,
    "role": "UX/UI designer",
    "timeline": "2026",
    "team": "Product and analytics, iOS and Android engineering, marketing",
    "focus": "Onboarding, gamification, permission flow",
    "platforms": [
      "ios",
      "android"
    ],
    "tags": [
      "Mobile",
      "Onboarding",
      "Gamification",
      "B2C"
    ],
    "overview": "Onboarding for an anti-spam app means asking for critical permissions: access to calls, messages and filters. It was the screen where people dropped off before they ever got protected. I split the permissions into protection levels and added a progress meter and blocked-spam counters, so a dull system dialog became a visible benefit.",
    "problem": {
      "text": "An anti-spam app is useless without system permissions: no access to calls and messages, nothing gets blocked. To grant them, users click through a series of alarming, confusing \"Allow access to…\" dialogs, and that's where they got lost. A prettier \"please tap Allow\" wouldn't help. Users needed to understand why each permission matters.",
      "points": [
        "Users had no idea how many dialogs were left or why they were there. The process felt endless and opaque.",
        "The app asked for access up front and gave nothing back right away.",
        "System dialogs are dry and scary, so the reflex was \"Don't Allow\"."
      ]
    },
    "solution": {
      "text": "One onboarding rhythm for every permission: explain, show the benefit, request access.",
      "points": [
        "A \"protection level\" meter: every permission granted raises the level and brings you closer to full protection.",
        "Blocked-spam counters next to each permission, showing how many calls and messages it will block.",
        "A short \"why we need this\" screen in plain language before each system prompt.",
        "Screens and states for iOS and Android, working around each platform's system dialogs."
      ]
    },
    "results": {
      "metrics": [
        {
          "value": "+25%",
          "label": "Onboarding conversion"
        },
        {
          "value": "−30%",
          "label": "Drop-off at permission requests"
        },
        {
          "value": "4.5 / 5",
          "label": "Onboarding clarity in user testing (estimate)"
        },
        {
          "value": "2 platforms",
          "label": "iOS and Android, one onboarding"
        }
      ],
      "points": [
        "Roughly a quarter more people made it to protection switched on, mostly thanks to the progress meter and block counters.",
        "The \"why\" screen took the anxiety out, and reflexive \"Don't Allow\" taps dropped noticeably.",
        "+25% conversion and −30% drop-off are real onboarding metrics after release. The clarity rating comes from user testing, not production."
      ]
    },
    "learnings": [
      "I tested two versions (plain system dialogs vs. gamified) and let the funnel numbers decide instead of my taste.",
      "Checking with engineering which system dialogs we could trigger, and in what order, was cheaper before the mock-ups than after.",
      "People trusted a number next to the button more than any persuasive copy."
    ],
    "quote": "I turned the most boring screen into a game of leveling up protection.",
    "images": [
      {
        "src": "cases/stop-spam/01.webp",
        "w": 1300,
        "h": 2642,
        "caption": "Anti-spam onboarding with a protection level meter",
        "kind": "hero"
      }
    ]
  },
  {
    "id": "electronic-house",
    "title": "Electronic House",
    "tagline": "A UX audit and key screen redesign of Electronic House, a Moscow housing-services mobile app.",
    "kicker": "UX audit · Mobile app · 2024",
    "company": "Moscow Department of Information Technology (DIT)",
    "role": "UX designer",
    "timeline": "2024",
    "team": "Research team and product team",
    "focus": "UX audit, prioritisation, key screen redesign",
    "platforms": [
      "ios",
      "android"
    ],
    "tags": [
      "UX audit",
      "Mobile",
      "GovTech",
      "Redesign"
    ],
    "overview": "The housing and utility services app kept collecting bad ratings, and a neighbouring team's research confirmed it. I went through the screens, mapped the navigation and clarity problems, prioritised the recommendations and redesigned the key screens. The team got a roadmap instead of a list of complaints: what to fix right now and what to plan for later.",
    "problem": {
      "text": "Research showed the app got negative ratings and users were confused and annoyed. But \"it's bad\" isn't a task yet: we needed to know what exactly was bad, why, and what to tackle first.",
      "points": [
        "The home screen was so busy that the app's purpose got lost among banners and feeds.",
        "In \"My Home\", the notice that a property ownership request was rejected was almost impossible to find.",
        "Chats mixed four kinds of conversation (building, private, concierge, support), and users didn't know where to write.",
        "Errors appeared in a modal with a cryptic code, one of the main sources of low ratings."
      ]
    },
    "solution": {
      "text": "I audited the key screens against usability heuristics, sorted findings into urgent and long-term, and rebuilt the four most painful screens.",
      "points": [
        "Home screen: cleared out off-target content and brought forward payments, service requests, meter readings and notifications.",
        "\"My Home\": resident status on address cards, payments, requests and votes up front, and a visible rejection notice.",
        "Chats: split into clear groups and renamed so each name honestly says what's behind it.",
        "Errors in plain language: what happened, why, and what to do right now."
      ]
    },
    "results": {
      "metrics": [
        {
          "value": "6 screens",
          "label": "Covered in the audit"
        },
        {
          "value": "4 screens",
          "label": "Rebuilt from scratch"
        },
        {
          "value": "2 horizons",
          "label": "Fix priorities: urgent and long-term"
        },
        {
          "value": "4 ideas",
          "label": "Planned for later"
        }
      ],
      "points": [
        "I handed the team a prioritised roadmap, so it's clear what goes into the next sprint and what can wait.",
        "This is an audit with a roadmap of fixes, not a measured production impact: I don't have post-launch numbers. The figures describe the scope of the work."
      ]
    },
    "learnings": [
      "I weighed each finding on two axes: how hard it hits the user and how much it costs to ship.",
      "First fix \"why it's annoying\", then add \"why people love it\". Cheap fixes like rewriting error copy win back trust fastest.",
      "Heuristics keep the argument on facts instead of \"I feel like\"."
    ],
    "quote": "A field where the interfaces leak worse than the pipes.",
    "images": []
  }
];

export default details;

/* v27: тот же набор кейсов по-русски лежит в caseDetails.ru.ts — картинки и порядок общие */
export function getDetails(): CaseDetail[] {
  return getLang() === "ru" ? ruDetails : details;
}
