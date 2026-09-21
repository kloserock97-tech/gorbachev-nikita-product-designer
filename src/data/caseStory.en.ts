/* v41: case stories, English. Same structure as caseStory.ru.ts, key for key.
   Texts come from the English case pages on Tilda (Main cases/EN/*.en.html) and the "Open to lead roles"
   deck, rewritten without the machine accent; facts and numbers untouched. Deep dives come from caseTracks.en.ts.
   v56: rewritten in plain language. A term stays next to its explanation, facts and numbers are the same. */
import type { StorySet, CaseImage } from "./caseStory";
import tracks from "./caseTracks.en";
import { en as grif } from "./stories/grif-ai.en";
import { en as community } from "./stories/community.en";
import { en as moderator } from "./stories/moderator-dashboard.en";
import { en as spam } from "./stories/stop-spam.en";
import { en as house } from "./stories/electronic-house.en";

const img = (src: string, w: number, h: number, caption: string, kind = "screen"): CaseImage => ({ src, w, h, caption, kind });

const A = "cases/ai-agents/";

const stories: StorySet = {
  "ai-agents": {
    id: "ai-agents",
    hero: {
      kicker: "Internal product · Risk management · Sber · 2025",
      title: "AI agent risks",
      tagline: "I moved the risk assessment of AI agents out of emails and Excel sheets into one shared list.",
      summary:
        "An AI agent in a bank is a program that carries out a task by itself. New agent versions came out almost every day. Yet the assessment of their risks lived in Jira tickets, Excel exports and archives that people forwarded to each other. I removed six hand-to-hand transfers from that route: collecting the documents and drafting the risks now happen inside the product. The agent, its versions, thirteen risk types and the conclusions of four departments sit in one place. Everyone involved can see a version travel from \"new\" to \"approved\".",
      facts: [
        ["Role", "Product designer, the only one on the product"],
        ["Company", "Sber"],
        ["Timeline", "2025, several two-week sprints"],
        ["Platform", "Web, internal"],
      ],
      tags: ["Enterprise", "AI / ML", "Risk management", "B2B"],
    },
    kpis: [
      { value: "6 → 0", label: "hand-to-hand transfers on the assessment route" },
      { value: "13", label: "risk types for every agent version" },
      { value: "4", label: "departments give their conclusion in one card" },
      { value: "20+ min", label: "each removed transfer took, and that is without the waiting" },
    ],
    context: {
      lead: "Hundreds of agents, and each one checked by hand.",
      text:
        "An AI agent in a bank is like an employee. One registers self-employed clients, another plans a conversation with a customer, a third tracks down debtors. Each has a version, an owner, a person in charge, a stage of life and a record in the shared catalogue of systems. And each has risks that ordinary software never had. Someone can slip the agent a command right in a text or in data, and it will carry it out (this is called prompt injection). The model it runs on may turn out to be vulnerable. Decisions of different agents affect each other. And the AI platform itself can go down.\n\nFour departments assess the risk of such an agent, and then one overall score is calculated from their assessments. While there are few agents, all of this fits into email. Once there are many and versions come out almost daily, email stops coping. And putting AI to work slows down with it.",
      origin:
        "The task came from the managers responsible for risk assessment. They described it as a symptom: there are clearly more agents, versions come out almost every day, each has thirteen problem areas, and nobody can quickly say how ready a given version is. Nobody said \"make us a shared list\". They said \"we can't keep up and we can't see the picture\". There was no diagram of the process. The policy lay in one place, the tasks in the tracker in another, and people kept the link between them in their heads.",
      roles: [
        { who: "Assessment process owner", needs: "no agent going to work without an assessment. And the assessment itself never becoming an emergency brake for all AI in the bank." },
        { who: "Risk manager", needs: "to stop building archives and forwarding files, and to get on with the assessment itself." },
        { who: "Four approving departments", needs: "to see what exactly they are assessing, without asking again. Each looks at the risk from its own side and works at its own pace." },
        { who: "Agent owners", needs: "to know which step the assessment is on and when it will end. For them it is someone else's procedure they cannot look into." },
      ],
      constraints: [
        { title: "Everything leaves a trace", text: "Regulators oversee the process. After any decision it must be clear who made it, when and on what grounds (this is called auditability). You can only design inside that frame." },
        { title: "The bank's design system", text: "We do not invent new interface parts. The closer to what the bank already has, the cheaper the development and the less people have to learn." },
        { title: "A stream of changes", text: "Agent versions change almost every day. The interface has to take that stream calmly." },
        { title: "No process diagram", text: "I had to design while we were still finding out what was going on at all. Research and design overlapped." },
      ],
      myRole:
        "I was the only product designer: research, the process map, the structure of the product, every screen in every state, and defending the decisions in front of the managers. The team handled development, analytics and the risk assessment method.",
    },
    approach: {
      lead: "First I worked out the process, then I drew screens.",
      text:
        "The field was new to me, the words unfamiliar, and the people busy with their own jobs and not ready to explain them a third time. In that situation the most expensive thing is to start drawing before you understand who hands what to whom. So first I drew a map of the process by role, and the set of screens came out of it. The usual map of one user's path (a CJM) did not fit here. It describes one hero, and here there are four, and the problems live in the joins between them.\n\nWe worked in two-week design sprints. The board had a separate column for research and a separate column for review: a mock-up did not go to development until someone had looked at it.",
      rejected:
        "Making a prototype straight away and \"testing it with users\". I had two people I could talk to and no process diagram. A prototype test would have shown whether the screens are easy to use. It would not have told me whether this is the right route at all.",
      levels: [
        { title: "The shared list", text: "All agents and all assessments. It answers \"how many in total, how many done, what to pick up\": a summary, filters, sorting, search." },
        { title: "An agent and its versions", text: "A card with the version's passport: owner, person in charge, stage of life, catalogue record, attachments. The version's path is here too: new → assessment → approval → approved, with branches for correction and reassessment." },
        { title: "The version's risk list", text: "Thirteen risk types with levels and reasons. The risk manager sees everything at once and notices where something is in dispute." },
        { title: "A single risk", text: "Level, reasons, the assessments of four departments, a \"not applicable\" mark with a reason. The lowest level turned out to be the hardest: every disputed situation in the process lives right here." },
      ],
      image: img(A + "08.webp", 1600, 788, "Two-week design sprint board: a separate review column sits between design and development", "detail"),
    },
    research: {
      lead: "There were four sources, because no single one was enough.",
      methods: [
        {
          kind: "Stakeholder interviews",
          title: "How the process is meant to work",
          question: "Who hands what to whom, and where does work stand still waiting for a person?",
          sample: "Two people held the knowledge, many rounds",
          finding:
            "I could talk to only two people, so I made up for it with frequency. I kept coming back with a new version of the process map and asking where I had got it wrong. The main discovery: the time was going somewhere other than I thought. The assessment itself takes a reasonable time. Preparation eats it: gathering documents, waiting for an export, forwarding, waiting for an upload. It is like a certificate at a clinic: the doctor's signature takes a minute, and the queue to the door takes an hour.",
        },
        {
          kind: "Tracker reconstruction",
          title: "How the process really runs",
          question: "Does the route people describe match what the tasks record?",
          sample: "Jira tasks over the project period",
          finding:
            "There was no process diagram. I rebuilt the route from the tasks in the tracker and checked it with the managers. That became the \"before\" diagram. A mismatch showed up at once: in words the route is shorter than in the tasks. People did not count some steps as work at all: \"it's just two minutes to forward it\".",
        },
        {
          kind: "Timing each step",
          title: "What it costs in time",
          question: "Which costs more: work on a screen or a transfer between people?",
          sample: "Six steps of the condensed route",
          finding:
            "Each transfer took twenty minutes of work or more. And between the steps there was waiting too: until the other person notices, opens, approves. It is like a relay race where the baton lies on the ground for a long time between runners. So I decided to remove the transfers themselves and leave the speed of the screens alone.",
        },
        {
          kind: "Benchmarks and heuristics",
          title: "How this is usually done",
          question: "What do mature work systems show first, and how do they keep the history of decisions?",
          sample: "Mature risk-management systems and complex internal registries",
          finding:
            "I took two things from them: the overall picture comes first, and every decision has a recorded history. I did not copy the overloaded tables with sorting on every column. A person has two real questions for the list, and extra options only get in the way.",
        },
      ],
      noData: {
        title: "What to do when there are no numbers",
        text:
          "In an internal product some decisions have to be made without numbers. There are few users. There can be no statistics for a product that does not exist yet. And there is usually nothing left to measure \"how it was\" with after the fact. I could not find out how many versions never reach assessment at all, how long a risk sits with an approving department, or how often an assessment is sent back for rework. In those places I lean on three things.",
        props: [
          { title: "I count what can be counted", text: "\"How much time we lose\" could not be measured. But hand-to-hand transfers can be counted. The more of them there are, the longer the waiting." },
          { title: "I write the assumption down in words", text: "Where there were no numbers at all, I wrote right in the decision what exactly I was assuming. You can argue with something written down. You cannot argue with a feeling." },
          { title: "I know in advance how to check it", text: "For every assumption I wrote down which data would disprove it once the system starts collecting its own statistics." },
        ],
      },
    },
    flow: {
      title: "Six hand-to-hand transfers against one screen",
      before: {
        title: "Before: Jira, Excel, portal, archives, email",
        steps: [
          { who: "Risk manager", step: "Gets an assessment task in Jira", note: "There is a task but no data for it. That still has to be gathered in the four steps below" },
          { who: "Administrator", step: "Makes an Excel export of agents from the systems catalogue", note: "The export is made by hand: until you ask, there is none", wait: true },
          { who: "Administrator", step: "Forwards the export to the internal portal", note: "A hand-to-hand transfer that leaves no trace", wait: true },
          { who: "Risk manager", step: "Packs the program code and business requirements into an archive", note: "Packed by hand. There is no way to check that everything is there" },
          { who: "Risk manager", step: "Forwards the archive to the portal", note: "One more transfer and one more wait", wait: true },
          { who: "Administrator", step: "Uploads the agent and the version", note: "The bottleneck: everything depends on one person", wait: true },
        ],
        summary: "Six transfers, two people busy with preparation alone. Each step takes twenty minutes of work or more, plus the waiting between steps. And this is a shortened diagram: in real life the route was longer.",
      },
      after: {
        title: "After: one product from request to approval",
        steps: [
          { who: "Risk manager", step: "Opens the shared list and sees the queue", note: "A summary on top: how many in total, how many assessed, how many in progress" },
          { who: "Risk manager", step: "Creates an assessment and attaches the archive right in the card", note: "The upload is inside the product, with no administrator and no forwarding" },
          { who: "System", step: "Draws up the risk list from the documents", note: "The draft assessment is ready before the person sits down to work" },
          { who: "Risk manager", step: "Edits levels and reasons, marks what does not fit as \"not applicable\"", note: "The reason is written in the system, and not in email" },
          { who: "Four departments", step: "Put in their assessments in the same card", note: "The overall score is calculated by itself" },
          { who: "Manager", step: "Approves the version", note: "Everyone sees the status, nobody has to be asked" },
        ],
        summary: "Both forwards, the manual export, the manual packing of the archive and the go-between administrator are gone from the route. What is left is the work all of this was started for: read, assess, give reasons.",
      },
    },
    decisions: {
      lead: "Behind every decision there is a principle you can say out loud. In an internal product the argument \"people are used to it this way\" does not work. There are few users, everyone's habits differ, and you have to argue with methodologists and the security team.",
      items: [
        {
          id: "summary",
          title: "A summary above the list",
          found: "The list answered the question \"what do we have\". But work starts with a different question: \"what do I pick up\". To grasp the volume, the risk manager counted rows by eye every time.",
          did: "I put four tiles above the list: all agents with the growth over the month, assessed, in assessment, and on a separate line the split by risk level. The list below already answers \"what to do\".",
          effect: "A person starts the day with an answer and not with counting. The summary can be shown to a manager without opening anything else.",
          why: "Shneiderman's rule for screens with a lot of data: the overall picture first, then selecting and zooming, details on request.",
          basis: "Interviews: \"how many in total and how many did we get through\" is asked first every time someone opens the list.",
          deepDive: "sort-summary",
        },
        {
          id: "filter",
          title: "The filter: two options, one chosen",
          found: "You can select by many fields: assessment type, owning department, risk level, status and two pairs of dates. There is little room on the screen, and people find the right combination of filters by trial and error.",
          did: "I made two options and defended them side by side. Option 1: a panel on the right, where the filter works at once while you fill it in. The chosen values show as labels on the main screen and can be removed one by one. Option 2: choosing several values and a \"Show 235 results\" button. We chose the first, because the result is calculated quickly.",
          why: "A filter that works at once is handier when the result is calculated quickly and the person finds the combination by trial and error. The labels on the main screen rest on Nielsen's rule: recognising is easier than recalling.",
          basis: "A question to the developers about what one request to the list costs; the breakdown of mistake 03 below.",
          deepDive: "filter-progress",
        },
        {
          id: "numbers",
          title: "A switch for short numbers",
          found: "Every card has four loss amounts. On ten cards that is forty numbers, each exact to the rouble. And at that moment the person is only comparing them.",
          did: "I put a switch in the header: \"1M ₽ instead of 1,000,000 ₽\". When it is on, amounts read as orders of magnitude. When it is off, you see the exact figures.",
          effect: "The list can now be looked through and no longer has to be read line by line. Exact figures are one click away where they are needed.",
          why: "A number in a list and a number in a report do different jobs. In a shop we compare \"about a thousand\" and \"about two\", and count the pennies at the till. So both ways of reading are there, and the one needed more often is on by default.",
        },
        {
          id: "sort",
          title: "Sorting with four items",
          found: "A person has two real questions for the list: \"what is new\" and \"what is on fire\". Everything else is solved by the filter.",
          did: "First: newest, oldest, high level, low level. Four items. The current one has a tick, and the name of the chosen sorting is written on the button.",
          effect: "Sorting stopped being a setting and became a quick answer to a question.",
          why: "Hick's law: the more options there are, the longer a person takes to choose. There are two questions, so there are four items and not twelve.",
          basis: "Benchmarks: sorting on every column looks generous, but for two questions it is extra choice.",
          deepDive: "sort-summary",
        },
        {
          id: "na",
          title: "\"Not applicable\" only with a reason",
          found: "Some of the thirteen risks do not apply to a particular agent. This used to be settled in email. A month later nobody could remember why the risk was not assessed. And in an overseen process someone will certainly ask.",
          did: "A risk can be marked as not applicable only if the reason is written down. While the field is empty, the \"Accept\" button cannot be pressed. A marked risk stays in the list with its comment and a \"Restore\" button. Restoring it needs an explanation too.",
          effect: "The reason is kept together with the risk. The history of decisions builds up by itself.",
          why: "Prevent the mistake and keep a way back. A marked risk changes its state but does not disappear anywhere.",
          basis: "The requirement to leave a trace: what was decided matters, and so does why.",
          image: img(A + "05.webp", 1338, 648, "The \"Risk not applicable\" window: the button becomes available only after the reason is written", "detail"),
        },
        {
          id: "auto",
          title: "The system drafts the risks from the documents",
          found: "Writing thirteen sets of reasons from a blank page is hours of work. Meanwhile much of what is needed already sits in the documents the person has just uploaded.",
          did: "While the system goes through the archive, the screen shows how much is done and grey placeholders of the future risks. The empty screen before the upload is not silent either: \"you have no assessments yet\", and what to do next.",
          effect: "A person starts from a draft that needs checking and fixing. Editing is faster than composing.",
          why: "A system should show what it is busy with. After 10 seconds of waiting attention drifts away, and going through an archive is sure to take longer. The grey placeholders also show what the result will look like.",
          basis: "Timing: preparing the data took four steps of twenty minutes each.",
          image: img(A + "03.webp", 1600, 1078, "Going through the archive: you see how much is done, and grey placeholders of future risks in place of a spinner"),
          deepDive: "filter-progress",
        },
        {
          id: "unsaved",
          title: "Protecting unfinished work",
          found: "The reasons for a risk are several paragraphs written with thought. Losing them to a stray click means losing half an hour.",
          did: "If a person leaves the form with unsaved edits, a question appears: \"Leave the form?\". The \"cancel\" and \"leave\" buttons are labelled in words and kept apart.",
          effect: "There was not a single \"I wrote it all and it's gone\". After cases like that people start keeping a copy of their work in a notebook.",
          why: "It is worth asking again where an action cannot be taken back and costs a lot. Everywhere else questions turn into noise. The dangerous button is labelled with a word, and not with \"OK\".",
        },
      ],
    },
    mistakes: {
      lead: "What I planned wrong and how I got out.",
      intro: "Three decisions I had to redo, and what I do differently after them.",
      items: [
        {
          title: "I started designing from the top down",
          decided: "To go from the general to the particular: the shared list, the agent card, the risk list, and the single risk at the end. The volume is clearer from above, and we will pick up the details on the way.",
          wrong: "It turned out that the lowest level sets the rules. A single risk had states the upper screens had not allowed for: not applicable, partly ready, assessed by four departments at different times. The shared list showed states that do not exist in real life, and it had to be redone.",
          out: "I stopped and went through everything from the bottom up. First I described the whole life of one risk, with every state and every transition. Then I put together the risk list, the card and the shared list. The upper screens fell into place almost without argument.",
          changed: "If one thing in a system is nested inside another, I start from the very lowest level. The thing the work revolves around sets all the possible states. Everything above it only shows them in different ways.",
        },
        {
          title: "I thought one person does the assessment",
          decided: "To design the assessment as the risk manager's work: open a version, go through the risks, set the levels, send for approval. Approval is one button at the end.",
          wrong: "There are four approvers, and they do not work at the same time. One department answers quickly, another holds a risk for a week. In my scheme a version was either \"in assessment\" or \"approved\". In real life it is almost always half there and half here.",
          out: "I split the assessment into two things. The first: each department's conclusion, separately. The second: the overall score calculated from them. That brought in-between statuses, a return for correction, and a visible \"no assessment\" mark for departments that have not answered yet.",
          changed: "Before mock-ups I draw who touches the object and at what moment. That sequence shows the in-between states nobody mentions in interviews, because they seem obvious. This is the most expensive mistake of the three: because of it the structure of the data had to be redone.",
        },
        {
          title: "I took both filter options all the way to finished mock-ups",
          decided: "To make two full filter options and defend them side by side, so the choice would be a conscious one.",
          wrong: "One question decided between them: \"what does one request to the list cost\". That is a question for the developers. I could have had the answer in one conversation, and I got it after I had drawn the second option in full.",
          out: "We chose the first option, because a request is cheap. The second stayed on the board with the caption \"for ideas and future work\".",
          changed: "Before I draw a second option, I look for the question that chooses between them and see whether it can be answered more cheaply. Often it is a technical question, and then the second mock-up is a wasted sprint.",
        },
      ],
    },
    results: {
      lead: "What changed and how to measure it.",
      intro: "Every result is written to one formula: what I achieved, how to measure it, what made it happen. If there is no link between a decision and a result, writing it this way shows it at once.",
      outcomes: [
        { x: "Six hand-to-hand transfers on the assessment route → zero", y: "The number of transfers on the process map: six in \"before\", zero in \"after\". The map was built from the tasks in the tracker and checked with the managers.", z: "The document upload and the risk draft moved inside the product. The go-between administrator is gone from the chain." },
        { x: "A person no longer has to prepare the data", y: "Steps before the first assessed line: it used to be four steps of twenty minutes or more, now it is one upload screen.", z: "The system drafts thirteen risks from the uploaded documents, and the version's passport sits in the same card." },
        { x: "The status of a version is visible without asking", y: "To find out what stage the assessment is at, you no longer have to write an email. It shows in the shared list and in the card.", z: "The version's path is shown plainly, the conclusions of four departments go separately, and a summary sits above the list." },
      ],
      points: [],
      contribution:
        "Three decisions I answer for myself led to the result. The first: to spend the start of the project on the process map and only then draw screens. Without the map the six transfers would have stayed unnoticed, because each one looks harmless by itself. The second: to separate the conclusions of four departments from the overall score. That changed the structure of the data. The third: to move the document upload inside the product. That is what took the go-between out of the chain.",
      honesty:
        "Confirmed: thirteen risk types, four approving departments, six steps in the shortened diagram of the old route, twenty minutes or more per step, the set of screens. The numbers on the screenshots themselves (639 agents, 142 assessed) are demo data from the mock-up. I do not pass them off as a result of the work. I rebuilt the descriptions of the effects as the project went along. In an interview I speak of them as reconstructed, and not as measured.",
    },
    roadmap: [
      { kicker: "Speed", title: "A short assessment route", text: "A separate route for agents that do not need the full procedure: the same system, only shorter. This task was already in the sprint plans." },
      { kicker: "Transparency", title: "Marking risks written by AI", text: "If a model drafted a risk, the person approving it should see that. A product that assesses AI risks should mark its own AI as well." },
      { kicker: "Scale", title: "Search and sorting by planned dates", text: "When assessments number in the thousands, the summary and the filters will not be enough. The list will need search and a queue by deadline." },
    ],
    takeaways: [
      "In big companies the problem is almost never on the screen. It is in the joins between people, and you can see it only on a process map.",
      "Go to the developers earlier. Two of the three mistakes cost me sprints, and each was solved by one question asked before the mock-ups.",
      "Start from the very lowest level of the data. I do not want to find out again for myself what happens if you start from the top.",
    ],
    quote: "Ask a risk manager what to improve, and he will tell you about a button. Count how many times his work passes from hand to hand, and you will see the button has nothing to do with it.",
    gallery: [
      {
        kind: "spot",
        title: "The list of assessments: four decisions on one screen",
        image: img(A + "t-registry-assessments.webp", 1600, 1128, "Risk assessment list: filter labels, loss amounts on every card and the switch for short numbers"),
        spots: [
          { x: 89.5, y: 17.5, text: "The switch for short numbers: amounts read as orders of magnitude", decision: "numbers" },
          { x: 38, y: 33, text: "The chosen filters show as labels and can be removed one by one", decision: "filter" },
          { x: 81.5, y: 41.2, text: "The name of the chosen sorting is written on the button", decision: "sort" },
          { x: 47.8, y: 56, text: "Four loss amounts per card: forty numbers on ten cards", decision: "numbers" },
        ],
      },
      {
        kind: "spot",
        title: "The list of agents: the summary answers before you can count the rows",
        image: img(A + "01.webp", 1600, 1128, "The shared list of AI agents: summary on top, list below"),
        spots: [
          { x: 36, y: 36.5, text: "Total, assessed, in assessment, and the growth over the month", decision: "summary" },
          { x: 53.3, y: 47.8, text: "The split by risk level on a separate line", decision: "summary" },
          { x: 82, y: 60.6, text: "The status of a version shows right in the list, no need to ask" },
        ],
      },
      {
        kind: "compare",
        title: "The filter: option 1 against option 2",
        before: img(A + "t-filter-v1-panel-set.webp", 1032, 1830, "Option 1: a panel where the filter works at once", "detail"),
        after: img(A + "t-filter-v2-panel.webp", 990, 2118, "Option 2: choosing several values and a \"Show\" button", "detail"),
        labels: ["Works at once · chosen", "\"Show\" button"],
      },
      {
        kind: "film",
        title: "Editing a risk: level, reasons and a required comment",
        image: img(A + "07.webp", 1464, 1836, "Risk editing form: level, reasons and the risk manager's required comment"),
      },
      {
        kind: "bento",
        title: "More screens",
        images: [
          img(A + "02.webp", 1600, 1048, "An agent card before assessment: empty, but you can see what is missing"),
          img(A + "06.webp", 1600, 1040, "The sorting menu with four items", "detail"),
          img(A + "t-agent-card-generating.webp", 750, 496, "Uploading documents from the agent card", "detail"),
          img(A + "t-registry-shimmer.webp", 745, 486, "Uploading documents from the shared list", "detail"),
        ],
      },
    ],
    deepDives: tracks["ai-agents"].tracks,
  },
  "grif-ai": grif,
  community,
  "moderator-dashboard": moderator,
  "stop-spam": spam,
  "electronic-house": house,
};

export default stories;
