/* v41: рассказ кейса «Кабинет модератора» на двух языках.
   Источник — Main cases/Moderator-cabinet.html и EN/Moderator-cabinet.en.html. */
import type { CaseStory, CaseImage } from "../caseStory";

const img = (src: string, w: number, h: number, caption: string, kind = "screen"): CaseImage => ({ src, w, h, caption, kind });
const F = "cases/figma/";
const M = "cases/moderator-dashboard/";

export const ru: CaseStory = {
  id: "moderator-dashboard",
  hero: {
    kicker: "B2B-кабинет · Mos.ru · 2024",
    title: "Кабинет модератора",
    tagline: "Собрал модератору один экран на все сущности.",
    summary:
      "«Сообщество» росло, поток контента тоже, а разбирал всё один администратор прямо в общей админке. Я развёл роль модератора и собрал ему отдельное рабочее место: единый механизм на комментарии, пользователей, публикации, группы и посты, плюс быстрая оценка прямо в реестре. Проверил на модерируемом тестировании: восемь модераторов, два прототипа.",
    facts: [
      ["Роль", "UX-дизайнер"],
      ["Компания", "Департамент информационных технологий Москвы (ДИТ)"],
      ["Срок", "2024"],
      ["Платформа", "Веб, десктоп"],
    ],
    tags: ["B2B", "GovTech", "Исследование", "Юзабилити-тест"],
  },
  kpis: [
    { value: "−38 %", label: "шагов сценария на целевой задаче" },
    { value: "−32 %", label: "времени на задачу" },
    { value: "4,3 из 5", label: "удовлетворённость модераторов на тесте" },
    { value: "5 типов", label: "сущностей в одном механизме" },
  ],
  context: {
    lead: "«Сообщество» росло быстрее, чем успевал один админ.",
    text:
      "Платформа историй Москвы взлетела, а вместе с ней вырос поток пользовательского контента: комментарии, публикации, жалобы. Всё оседало на одном администраторе, который разбирал завалы в той же админке, где и всё остальное.\n\nКнопкой «бан» тут было не обойтись. Нужно было развести роль модератора и дать ей рабочее место под разнородные сущности: комментарии, пользователей, публикации, группы, посты. И чтобы механизм работы с ними был один.",
    team: [
      { who: "Саша, аналитик", how: "Описал функциональные требования: что кабинет обязан уметь. Я переводил их в экраны и сценарии." },
      { who: "Разработка", how: "Провёл интервью с разработчиками, чтобы понять ограничения: что реально встроить в существующую систему, а что уедет в бэклог. Дешевле узнать до макетов, чем после." },
      { who: "Родительский продукт", how: "Кабинет — продолжение кейса «Сообщество». Общая очередь модерации, которую я заложил там, здесь выросла в отдельное рабочее место." },
    ],
    myRole:
      "Исследование (разбор действующей админки и функциональных референсов, гипотезы, модерируемое тестирование), логика взаимодействия, макеты и прототипы, единый механизм для всех типов сущностей и задел на остальные разделы.",
  },
  research: {
    lead: "Два прототипа под противоположные ставки, восемь модераторов, один победитель.",
    methods: [
      {
        kind: "Аудит админки",
        title: "Как работают сейчас",
        question: "На что уходит время модератора в общей админке?",
        sample: "Действующая админка и функциональные референсы",
        finding:
          "Комментарии валились одной кучей: непонятно, за что хвататься первым. Короткие однозначные комментарии («спасибо», очевидный спам) всё равно заставляли открывать карточку ради каждого. Для спорного приходилось руками искать исходную публикацию и историю автора.",
      },
      {
        kind: "Интервью с разработкой",
        title: "Что можно встроить",
        question: "Что реально собрать в существующей системе, а что уедет в бэклог?",
        sample: "Команда разработки, до макетов",
        finding: "Кабинет строится на базе существующей админки, поэтому новые разделы должны встраиваться по одной схеме. Отсюда единый механизм на все сущности.",
      },
      {
        kind: "Модерируемое тестирование",
        title: "Прототип против прототипа",
        question: "Что быстрее доводит до решения: богатая карточка или оценка прямо в реестре?",
        sample: "8 модераторов, 2 прототипа, 10 гипотез (семь и три)",
        finding:
          "Ни одна ставка не победила в одиночку, победила связка: реестр с быстрой оценкой закрывает рутину, подробная карточка — спорные случаи. Больше всего хвалили, что «не нужно никуда проваливаться».",
      },
    ],
    hypotheses: {
      intro: "Прототип 1 — богатая карточка с контекстом (семь гипотез). Прототип 2 — быстрая оценка прямо в реестре (три гипотезы). Три гипотезы, которые решили исход:",
      items: [
        { text: "Хочу сразу видеть комментарии, которые требуют оценки, чтобы не тратить время.", verdict: "Прототип 2", won: true },
        { text: "Короткий однозначный комментарий хочу оценить прямо в реестре, без перехода на страницу.", verdict: "Прототип 2", won: true },
        { text: "Для спорного нужен контекст: публикация, автор, ветка ответов и жалобы — на одном экране.", verdict: "Прототип 1", won: true },
      ],
      measured: "Результативность (дошёл ли до цели и за сколько шагов), эффективность (время, ошибки, задержки) и удовлетворённость по шкале 1–5.",
    },
  },
  decisions: {
    lead: "Решения, которые срезали модератору шаги. Каждое выросло из находки аудита и прошло тест.",
    items: [
      {
        id: "registry",
        title: "Реестр со статус-сортировкой",
        found: "В общей админке комментарии валились одной кучей, и модератор не понимал, за что хвататься первым.",
        did: "Реестр со статусами: «Ожидают проверки», «Проверенные», «Нежелательные», «Жалобы», «Переданы менеджеру». Каждый комментарий знает своё место.",
        effect: "На тестировании модераторы находили нужную группу комментариев с первого раза.",
        basis: "Аудит админки; гипотеза 01 на тесте.",
      },
      {
        id: "inline",
        title: "Быстрая оценка прямо в реестре",
        found: "Короткие однозначные комментарии не требуют разбора, но старый флоу заставлял открывать карточку ради каждого.",
        did: "Вынес оценку в сам реестр: очевидное закрывается, не проваливаясь в карточку. Клик вместо пяти.",
        effect: "Основная экономия времени на целевой задаче пришла отсюда: рутина перестала стоить переходов.",
        basis: "Гипотеза 02 на тесте: прототип 2.",
      },
      {
        id: "card",
        title: "Богатая карточка для спорных случаев",
        found: "Для спорного комментария не хватало контекста: исходную публикацию и историю автора приходилось искать руками.",
        did: "В карточке всё сразу: текст исходной публикации, краткая информация об авторе и карма, ветка ответов, история работы над комментарием и жалобы. Плюс сортировка по популярным и по пользователям с низкой кармой.",
        effect: "Решение по сложному комментарию принимается на одном экране.",
        basis: "Гипотеза 03 на тесте: прототип 1.",
        image: img(M + "01.webp", 1600, 1200, "Карточка комментария: действия сверху, контекст публикации, автор, ветка ответов, история и жалобы"),
      },
      {
        id: "mechanism",
        title: "Единый механизм на все сущности",
        found: "Сущностей пять, и у каждой в общей админке свой способ работы.",
        did: "Один паттерн действий на комментарии, пользователей, публикации, группы и посты. Общие статусы и причины отклонения. Новый тип сущности встраивается по той же схеме.",
        effect: "Модератор учит кабинет один раз, а продукт растёт вширь без нового UX под каждый раздел.",
        basis: "Интервью с разработкой: разделы должны собираться по одной схеме.",
      },
    ],
  },
  results: {
    lead: "Меньше шагов — меньше времени на задачу.",
    points: [
      "Целевую задачу (промодерировать комментарий) удалось сократить на 38% по числу шагов, в основном за счёт оценки прямо в реестре",
      "Время на задачу меньше на 32%",
      "Прототип-победитель набрал 4,3 из 5; больше всего хвалили, что «не нужно никуда проваливаться»",
      "Пять типов сущностей работают на одном механизме",
    ],
    honesty: "Это результат исследования на прототипе, а не прод-метрика: кабинет уходил в разработку по этим макетам.",
  },
  roadmap: [
    { kicker: "Сущность", title: "Пользователи", text: "Карточка пользователя с кармой и историей нарушений: модерировать не только комментарии, но и людей за ними." },
    { kicker: "Сущности", title: "Публикации и группы", text: "Те же статусы и единый механизм для публикаций, групп и постов. Схема расчерчена, остаётся разложить по экранам." },
    { kicker: "Хендофф", title: "Передача в разработку", text: "Логика и элементы отрисованы так, чтобы разработка собирала кабинет по частям, не переспрашивая по каждому экрану." },
  ],
  takeaways: [
    "Два прототипа под противоположные ставки полезнее одного «сбалансированного»: тест показал, что победила связка, и показал, где проходит граница между рутиной и спорным случаем.",
    "Про технические ограничения расспросил разработчиков до макетов: так дешевле, чем переделывать после.",
  ],
  quote: "Быстрая оценка в реестре экономит клики, а из кликов у модератора состоит весь рабочий день.",
  gallery: [
    {
      kind: "spot",
      title: "Тот же реестр для другой сущности: пользователи",
      image: img(F + "moderator-queue.png", 1440, 1156, "Очередь пользователей с фильтрами, ответственными, статусами и жалобами", "hero"),
      spots: [
        { x: 27, y: 11.6, text: "Статусы вкладками: очередь разложена, а не свалена", decision: "registry" },
        { x: 40, y: 18.3, text: "Фильтры по ID, имени, ответственному, статусу и периоду", decision: "registry" },
        { x: 66.5, y: 33.1, text: "Статус читается в строке, карточку открывать не нужно", decision: "inline" },
        { x: 94, y: 26.8, text: "Жалобы — отдельной колонкой с сортировкой", decision: "mechanism" },
      ],
    },
    {
      kind: "compare",
      title: "Профиль и подтверждение ответственного действия",
      before: img(F + "moderator-profile.png", 1440, 861, "Профиль пользователя с контекстом модерации и связанными сущностями"),
      after: img(F + "moderator-confirm.png", 1440, 861, "Подтверждение перед тем, как модератор берёт обращение в работу"),
      labels: ["Контекст", "Подтверждение"],
    },
  ],
  deepDives: [],
};

export const en: CaseStory = {
  id: "moderator-dashboard",
  hero: {
    kicker: "B2B dashboard · Mos.ru · 2024",
    title: "Moderator Dashboard",
    tagline: "Built the moderator one screen for every entity.",
    summary:
      "Community kept growing, and so did the stream of content, yet a single administrator sorted through all of it inside the general admin panel. I split the moderator out as a separate role and built them a workspace of their own: one mechanism for comments, users, publications, groups and posts, plus quick verdicts straight from the list. Checked in moderated usability testing: eight moderators, two prototypes.",
    facts: [
      ["Role", "UX designer"],
      ["Company", "Moscow Department of Information Technology (DIT)"],
      ["Timeline", "2024"],
      ["Platform", "Web, desktop"],
    ],
    tags: ["B2B", "GovTech", "Research", "Usability test"],
  },
  kpis: [
    { value: "−38%", label: "scenario steps on the target task" },
    { value: "−32%", label: "time per task" },
    { value: "4.3 of 5", label: "moderators' satisfaction in testing" },
    { value: "5 types", label: "of entities in one mechanism" },
  ],
  context: {
    lead: "Community grew faster than one admin could keep up.",
    text:
      "The city-stories platform on Mos.ru took off, and with it the stream of user content: comments, publications, complaints. All of it landed on a single administrator, who dug through the backlog in the same admin panel that ran everything else.\n\nA ban button would not do. The moderator had to become a separate role with a workspace built for mixed entities: comments, users, publications, groups, posts. And one way of handling all of them.",
    team: [
      { who: "Sasha, analyst", how: "Wrote the functional requirements: what the dashboard must be able to do. I turned them into screens and scenarios." },
      { who: "Engineering", how: "I interviewed the developers to learn the constraints: what could really be built into the existing system and what would slide into the backlog. Cheaper to find out before the mock-ups than after." },
      { who: "Parent product", how: "The dashboard is a direct sequel to the Community case. The shared moderation queue I laid down there grew into a dedicated workspace here." },
    ],
    myRole:
      "Research (taking apart the existing admin panel and functional references, hypotheses, moderated testing), interaction logic, mock-ups and prototypes, one mechanism for every entity type and the groundwork for the remaining sections.",
  },
  research: {
    lead: "Two prototypes around opposite bets, eight moderators, one winner.",
    methods: [
      {
        kind: "Admin panel audit",
        title: "How they work today",
        question: "Where does a moderator's time go in the general admin panel?",
        sample: "The existing admin panel and functional references",
        finding:
          "Comments landed in one big pile: nobody could tell what to grab first. Short, clear-cut comments (\"thanks\", obvious spam) still forced you to open a card for each one. For a disputed one you had to dig up the original post and the author's history by hand.",
      },
      {
        kind: "Engineering interviews",
        title: "What can be built in",
        question: "What can really be assembled in the existing system, and what goes to the backlog?",
        sample: "The development team, before mock-ups",
        finding: "The dashboard builds on the existing admin panel, so new sections have to plug into one scheme. Hence one mechanism for every entity.",
      },
      {
        kind: "Moderated testing",
        title: "Prototype against prototype",
        question: "What gets to a decision faster: a rich card or a verdict right in the registry?",
        sample: "8 moderators, 2 prototypes, 10 hypotheses (seven and three)",
        finding:
          "Neither bet won on its own. The combination did: a registry with quick verdicts handles routine, a detailed card handles the tricky cases. The top praise was \"you don't have to dive in anywhere\".",
      },
    ],
    hypotheses: {
      intro: "Prototype 1 was a rich card with context (seven hypotheses). Prototype 2 was quick verdicts right in the registry (three hypotheses). The three that settled it:",
      items: [
        { text: "I want to see the comments that need a verdict straight away, so I don't waste time.", verdict: "Prototype 2", won: true },
        { text: "A short, clear-cut comment I want to rate right in the registry, without opening a page.", verdict: "Prototype 2", won: true },
        { text: "A disputed one needs context: the post, the author, the reply thread and reports, all on one screen.", verdict: "Prototype 1", won: true },
      ],
      measured: "Effectiveness (did they reach the goal and in how many steps), efficiency (time, errors, hesitations) and satisfaction on a 1 to 5 scale.",
    },
  },
  decisions: {
    lead: "Decisions that cut steps for the moderator. Each grew out of an audit finding and went through testing.",
    items: [
      {
        id: "registry",
        title: "A registry sorted by status",
        found: "In the general admin panel comments landed in one big pile, and moderators could not tell what to grab first.",
        did: "A registry with statuses: \"Awaiting review\", \"Reviewed\", \"Unwanted\", \"Reported\", \"Sent to manager\". Every comment knows its place.",
        effect: "In testing, moderators found the right group of comments on the first try.",
        basis: "Admin panel audit; hypothesis 01 in testing.",
      },
      {
        id: "inline",
        title: "Quick verdicts right in the registry",
        found: "Short, clear-cut comments need no investigation, but the old flow made you open a card for every single one.",
        did: "Moved the verdict into the registry itself: the obvious gets closed without diving into a card. One click instead of five.",
        effect: "Most of the time saved on the target task came from here: routine stopped costing page jumps.",
        basis: "Hypothesis 02 in testing: prototype 2.",
      },
      {
        id: "card",
        title: "A rich card for the tricky cases",
        found: "For a disputed comment the moderator lacked context and had to dig up the original post and the author's history by hand.",
        did: "Everything in the card at once: the original post, a short author profile with karma, the reply thread, the comment's moderation history and reports. Plus sorting by most popular and by low-karma users.",
        effect: "A tricky comment gets decided on one screen.",
        basis: "Hypothesis 03 in testing: prototype 1.",
        image: img(M + "01.webp", 1600, 1200, "Comment card: actions on top, post context, author, reply thread, history and reports"),
      },
      {
        id: "mechanism",
        title: "One mechanism for every entity",
        found: "There are five entities, and the general admin panel handles each in its own way.",
        did: "One action pattern for comments, users, publications, groups and posts. Shared statuses and rejection reasons. A new entity type plugs into the same scheme.",
        effect: "Moderators learn the dashboard once, and the product grows sideways without new UX for every section.",
        basis: "Engineering interviews: sections have to be assembled from one scheme.",
      },
    ],
  },
  results: {
    lead: "Fewer steps, less time per task.",
    points: [
      "The target task, moderating a comment, got 38% shorter in steps, mostly thanks to verdicts right in the registry",
      "Time per task went down by 32%",
      "The winning prototype scored 4.3 out of 5; the top praise was \"you don't have to dive in anywhere\"",
      "Five entity types run on one mechanism",
    ],
    honesty: "This is a prototype research result, not a production metric: the dashboard went into development based on these mock-ups.",
  },
  roadmap: [
    { kicker: "Entity", title: "Users", text: "A user card with karma and violation history: moderate the people behind the comments too." },
    { kicker: "Entities", title: "Publications and groups", text: "The same statuses and one mechanism for publications, groups and posts. The scheme is mapped out; what is left is laying it out on screens." },
    { kicker: "Handoff", title: "Handoff to engineering", text: "Logic and elements are designed so developers can assemble the dashboard piece by piece without asking about every screen." },
  ],
  takeaways: [
    "Two prototypes around opposite bets are more useful than one balanced prototype: testing showed that a combination won, and where the line between routine and a tricky case runs.",
    "I asked engineering about technical constraints before the mock-ups: cheaper than redoing them after.",
  ],
  quote: "Quick verdicts in the registry save clicks, and clicks are a moderator's whole working day.",
  gallery: [
    {
      kind: "spot",
      title: "The same registry for another entity: users",
      image: img(F + "moderator-queue.png", 1440, 1156, "User queue with filters, assignees, statuses and reports", "hero"),
      spots: [
        { x: 27, y: 11.6, text: "Statuses as tabs: the queue is sorted, not piled up", decision: "registry" },
        { x: 40, y: 18.3, text: "Filters by ID, name, assignee, status and period", decision: "registry" },
        { x: 66.5, y: 33.1, text: "Status reads in the row, no need to open the card", decision: "inline" },
        { x: 94, y: 26.8, text: "Reports in their own sortable column", decision: "mechanism" },
      ],
    },
    {
      kind: "compare",
      title: "Profile and confirmation of a consequential action",
      before: img(F + "moderator-profile.png", 1440, 861, "User profile with moderation context and related entities"),
      after: img(F + "moderator-confirm.png", 1440, 861, "Confirmation before a moderator takes a request into work"),
      labels: ["Context", "Confirmation"],
    },
  ],
  deepDives: [],
};
