/* v41: рассказ кейса «Кабинет модератора» на двух языках.
   Источник — Main cases/Moderator-cabinet.html и EN/Moderator-cabinet.en.html.
   v56: тексты переписаны простым языком, факты и цифры те же. */
import type { CaseStory, CaseImage } from "../caseStory";

const img = (src: string, w: number, h: number, caption: string, kind = "screen"): CaseImage => ({ src, w, h, caption, kind });
const F = "cases/figma/";
const M = "cases/moderator-dashboard/";

export const ru: CaseStory = {
  id: "moderator-dashboard",
  hero: {
    kicker: "B2B-кабинет · Mos.ru · 2024",
    title: "Кабинет модератора",
    tagline: "Сделал модератору одно рабочее место для всего, что он проверяет.",
    summary:
      "Сайт «Сообщество» рос, и текстов от жителей становилось всё больше. Проверял их один администратор, в той же админке, где настраивается весь сайт. Я выделил модератора в отдельную роль и сделал ему своё рабочее место. Комментарии, пользователи, публикации, группы и посты проверяются в нём одним и тем же способом, а очевидное можно решить прямо в списке. Проверил на живых людях: восемь модераторов, два прототипа.",
    facts: [
      ["Роль", "UX-дизайнер"],
      ["Компания", "Департамент информационных технологий Москвы (ДИТ)"],
      ["Срок", "2024"],
      ["Платформа", "Веб, десктоп"],
    ],
    tags: ["B2B", "GovTech", "Исследование", "Юзабилити-тест"],
  },
  kpis: [
    { value: "−38 %", label: "шагов, чтобы проверить один комментарий" },
    { value: "−32 %", label: "времени на ту же задачу" },
    { value: "4,3 из 5", label: "оценка модераторов на тесте" },
    { value: "5 типов", label: "объектов проверяются одним способом" },
  ],
  context: {
    lead: "Сайт рос быстрее, чем успевал один администратор.",
    text:
      "Сайт с историями о Москве стал популярным, и жители начали писать много: комментарии, публикации, жалобы. Всё это падало на одного администратора. Он разбирал завалы в той же админке, где делается всё остальное. Представьте почту, в которой письма, счета и реклама лежат одной стопкой.\n\nКнопка «забанить» тут не помогла бы. Модератору нужна была своя роль и своё рабочее место. Проверять приходится разное: комментарии, пользователей, публикации, группы, посты. Я хотел, чтобы со всем этим работали одним и тем же способом.",
    team: [
      { who: "Саша, аналитик", how: "Написал, что кабинет обязан уметь. Я превращал эти требования в экраны и в порядок действий." },
      { who: "Разработка", how: "Поговорил с разработчиками до первых макетов. Хотел понять, что можно встроить в нынешнюю систему, а что придётся отложить. Узнать об ограничениях заранее дешевле, чем потом перерисовывать." },
      { who: "Родительский продукт", how: "Кабинет продолжает кейс «Сообщество». Общая очередь на проверку, которую я заложил там, здесь выросла в отдельное рабочее место." },
    ],
    myRole:
      "Исследование (разбор нынешней админки и похожих систем, гипотезы, тест с модераторами), логика работы, макеты и прототипы, один способ работы для всех типов объектов и задел на остальные разделы.",
  },
  research: {
    lead: "Два прототипа с противоположными идеями, восемь модераторов и один вывод.",
    methods: [
      {
        kind: "Аудит админки",
        title: "Как работают сейчас",
        question: "На что у модератора уходит время в общей админке?",
        sample: "Действующая админка и функциональные референсы",
        finding:
          "Комментарии лежали одной кучей, и было непонятно, с чего начинать. Даже короткий и очевидный комментарий («спасибо», явный спам) приходилось открывать на отдельной странице. Для спорного комментария надо было вручную искать, под чем он написан и что раньше писал этот автор.",
      },
      {
        kind: "Интервью с разработкой",
        title: "Что можно встроить",
        question: "Что получится сделать в нынешней системе, а что придётся отложить?",
        sample: "Команда разработки, до макетов",
        finding: "Кабинет строится поверх нынешней админки, поэтому новые разделы должны добавляться по одному образцу. Отсюда идея: один способ работы для всего, что проверяет модератор.",
      },
      {
        kind: "Модерируемое тестирование",
        title: "Прототип против прототипа",
        question: "Что быстрее приводит к решению: подробная страница комментария или кнопки прямо в списке?",
        sample: "8 модераторов, 2 прототипа, 10 гипотез (семь и три)",
        finding:
          "По отдельности не победила ни одна идея, победили обе вместе. Это как контролёр в электричке: большинство билетов он проверяет взглядом, а спорный изучает внимательно. Очевидное модератор решает в списке, а спорное открывает на подробной странице. Чаще всего хвалили за то, что «не нужно никуда проваливаться».",
      },
    ],
    hypotheses: {
      intro: "Прототип 1: подробная страница комментария со всем контекстом (семь гипотез). Прототип 2: решение прямо в списке (три гипотезы). Вот три гипотезы, которые решили исход:",
      items: [
        { text: "Хочу сразу видеть комментарии, которые ждут проверки, чтобы не тратить время на поиски.", verdict: "Прототип 2", won: true },
        { text: "Короткий и понятный комментарий хочу оценить прямо в списке, не открывая страницу.", verdict: "Прототип 2", won: true },
        { text: "Для спорного комментария нужен контекст: публикация, автор, ветка ответов и жалобы — на одном экране.", verdict: "Прототип 1", won: true },
      ],
      measured: "Смотрели на три вещи. Дошёл ли человек до цели и за сколько шагов. Сколько времени ушло, сколько было ошибок и заминок. И насколько ему было удобно, по шкале 1–5.",
    },
  },
  decisions: {
    lead: "Решения, которые убрали у модератора лишние шаги. Каждое выросло из наблюдения и прошло проверку на людях.",
    items: [
      {
        id: "registry",
        title: "Список, разложенный по статусам",
        found: "В общей админке комментарии лежали одной кучей, и модератор не понимал, с чего начинать.",
        did: "Разложил список по вкладкам: «Ожидают проверки», «Проверенные», «Нежелательные», «Жалобы», «Переданы менеджеру». Как письма по папкам: сразу видно, что требует внимания.",
        effect: "На тесте модераторы находили нужную группу комментариев с первой попытки.",
        basis: "Аудит админки; гипотеза 01 на тесте.",
      },
      {
        id: "inline",
        title: "Решение прямо в списке",
        found: "Короткий очевидный комментарий разбирать незачем, но раньше ради каждого приходилось открывать отдельную страницу.",
        did: "Вынес кнопки решения в сам список. Очевидное закрывается на месте: один клик вместо пяти.",
        effect: "Отсюда пришла основная экономия времени. Рутина больше не требует переходов между страницами.",
        basis: "Гипотеза 02 на тесте: прототип 2.",
      },
      {
        id: "card",
        title: "Подробная страница для спорных случаев",
        found: "Для спорного комментария не хватало контекста. Исходную публикацию и историю автора приходилось искать вручную.",
        did: "Собрал на одной странице всё, что нужно для решения: текст публикации, короткую справку об авторе и его репутацию (карму), ветку ответов, историю работы с этим комментарием и жалобы. Добавил сортировку по популярным комментариям и по авторам с низкой репутацией.",
        effect: "Решение по сложному комментарию принимается на одном экране.",
        basis: "Гипотеза 03 на тесте: прототип 1.",
        image: img(M + "01.webp", 1600, 1200, "Страница комментария: действия сверху, публикация, автор, ветка ответов, история и жалобы"),
      },
      {
        id: "mechanism",
        title: "Один способ работы для всего",
        found: "Модератор проверяет пять разных вещей, и в общей админке с каждой работают по-своему.",
        did: "Сделал одинаковый порядок действий для комментариев, пользователей, публикаций, групп и постов. Статусы и причины отказа общие. Новый тип добавляется по тому же образцу.",
        effect: "Модератор учится работать в кабинете один раз. Когда появляется новый раздел, переучиваться не нужно, а команде не нужно придумывать для него новый интерфейс.",
        basis: "Интервью с разработкой: разделы должны собираться по одному образцу.",
      },
    ],
  },
  results: {
    lead: "Меньше шагов, меньше времени на каждую проверку.",
    points: [
      "Чтобы проверить комментарий, теперь нужно на 38% меньше шагов. В основном за счёт решения прямо в списке",
      "Времени на ту же задачу уходит на 32% меньше",
      "Прототип-победитель получил 4,3 из 5. Чаще всего хвалили за то, что «не нужно никуда проваливаться»",
      "Пять типов объектов проверяются одним и тем же способом",
    ],
    honesty: "Это результаты теста на прототипе. Цифр с работающего сайта у меня нет: кабинет ушёл в разработку по этим макетам.",
  },
  roadmap: [
    { kicker: "Раздел", title: "Пользователи", text: "Страница пользователя с репутацией и историей нарушений. Проверять можно будет не только комментарии, но и людей, которые их пишут." },
    { kicker: "Разделы", title: "Публикации и группы", text: "Те же статусы и тот же способ работы для публикаций, групп и постов. Схема готова, осталось разложить её по экранам." },
    { kicker: "Передача", title: "Передача в разработку", text: "Логика и элементы описаны так, чтобы разработчики собирали кабинет по частям и не переспрашивали про каждый экран." },
  ],
  takeaways: [
    "Два прототипа с противоположными идеями дали больше, чем один «средний». Тест показал, что нужны обе идеи сразу, и показал, где проходит граница между рутиной и спорным случаем.",
    "Про технические ограничения я спросил разработчиков до макетов. Это дешевле, чем переделывать потом.",
  ],
  quote: "Решение прямо в списке экономит клики. А рабочий день модератора из кликов и состоит.",
  gallery: [
    {
      kind: "spot",
      title: "Тот же список для другого раздела: пользователи",
      image: img(F + "moderator-queue.png", 1440, 1156, "Очередь пользователей с фильтрами, ответственными, статусами и жалобами", "hero"),
      spots: [
        { x: 27, y: 11.6, text: "Статусы стоят вкладками: очередь разложена по папкам", decision: "registry" },
        { x: 40, y: 18.3, text: "Фильтры по ID, имени, ответственному, статусу и периоду", decision: "registry" },
        { x: 66.5, y: 33.1, text: "Статус виден прямо в строке, страницу открывать не нужно", decision: "inline" },
        { x: 94, y: 26.8, text: "Жалобы вынесены в отдельную колонку, по ней можно сортировать", decision: "mechanism" },
      ],
    },
    {
      kind: "compare",
      title: "Профиль и подтверждение важного действия",
      before: img(F + "moderator-profile.png", 1440, 861, "Профиль пользователя: что он писал и что с ним связано"),
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
    tagline: "I gave the moderator one workplace for everything they check.",
    summary:
      "The Community site kept growing, and residents wrote more and more. One administrator checked all of it, in the same admin panel that runs the whole site. I made the moderator a separate role with a workplace of their own. Comments, users, publications, groups and posts are all checked there in the same way, and the obvious cases can be settled right in the list. I tested it with real people: eight moderators, two prototypes.",
    facts: [
      ["Role", "UX designer"],
      ["Company", "Moscow Department of Information Technology (DIT)"],
      ["Timeline", "2024"],
      ["Platform", "Web, desktop"],
    ],
    tags: ["B2B", "GovTech", "Research", "Usability test"],
  },
  kpis: [
    { value: "−38%", label: "steps to check one comment" },
    { value: "−32%", label: "time on the same task" },
    { value: "4.3 of 5", label: "moderators' rating in the test" },
    { value: "5 types", label: "of items checked in one way" },
  ],
  context: {
    lead: "The site grew faster than one administrator could keep up.",
    text:
      "The city-stories site on Mos.ru became popular, and residents started writing a lot: comments, publications, complaints. All of it landed on a single administrator, who dug through the pile in the same admin panel where everything else gets done. Picture a mailbox where letters, bills and adverts lie in one stack.\n\nA ban button would not have helped. The moderator needed a role and a workplace of their own. They check different things: comments, users, publications, groups, posts. I wanted all of them to be handled in one and the same way.",
    team: [
      { who: "Sasha, analyst", how: "Wrote down what the dashboard must be able to do. I turned those requirements into screens and the order of actions." },
      { who: "Engineering", how: "I talked to the developers before the first mock-ups. I wanted to know what could be built into the current system and what would have to wait. Learning the limits early is cheaper than redrawing later." },
      { who: "Parent product", how: "The dashboard continues the Community case. The shared review queue I set up there grew into a separate workplace here." },
    ],
    myRole:
      "Research (taking apart the current admin panel and similar systems, hypotheses, a test with moderators), the logic of the work, mock-ups and prototypes, one way of working for every type of item and the groundwork for the remaining sections.",
  },
  research: {
    lead: "Two prototypes built on opposite ideas, eight moderators and one conclusion.",
    methods: [
      {
        kind: "Admin panel audit",
        title: "How they work today",
        question: "Where does a moderator's time go in the general admin panel?",
        sample: "The existing admin panel and functional references",
        finding:
          "Comments lay in one big pile, and nobody could tell where to start. Even a short, obvious comment (\"thanks\", plain spam) had to be opened on a separate page. For a disputed one you had to find by hand what it was written under and what the author had posted before.",
      },
      {
        kind: "Engineering interviews",
        title: "What can be built in",
        question: "What can be done in the current system, and what will have to wait?",
        sample: "The development team, before mock-ups",
        finding: "The dashboard is built on top of the current admin panel, so new sections have to be added to one template. That gave the idea: one way of working for everything a moderator checks.",
      },
      {
        kind: "Moderated testing",
        title: "Prototype against prototype",
        question: "What leads to a decision faster: a detailed comment page or buttons right in the list?",
        sample: "8 moderators, 2 prototypes, 10 hypotheses (seven and three)",
        finding:
          "Neither idea won on its own. Both together did. Think of a ticket inspector on a train: most tickets get a glance, and a doubtful one gets a careful look. A moderator settles the obvious in the list and opens the detailed page for the doubtful. The most common praise was \"you don't have to dive in anywhere\".",
      },
    ],
    hypotheses: {
      intro: "Prototype 1 was a detailed comment page with all the context (seven hypotheses). Prototype 2 was a decision right in the list (three hypotheses). These three settled it:",
      items: [
        { text: "I want to see the comments that are waiting for a check straight away, so I don't waste time searching.", verdict: "Prototype 2", won: true },
        { text: "A short, clear comment I want to rate right in the list, without opening a page.", verdict: "Prototype 2", won: true },
        { text: "A disputed comment needs context: the post, the author, the reply thread and the complaints, all on one screen.", verdict: "Prototype 1", won: true },
      ],
      measured: "We looked at three things. Did the person reach the goal, and in how many steps. How much time it took, and how many mistakes and hesitations there were. And how comfortable it felt, on a 1 to 5 scale.",
    },
  },
  decisions: {
    lead: "Decisions that took extra steps away from the moderator. Each grew out of something I noticed and was tested with people.",
    items: [
      {
        id: "registry",
        title: "A list sorted by status",
        found: "In the general admin panel comments lay in one big pile, and the moderator could not tell where to start.",
        did: "I split the list into tabs: \"Awaiting review\", \"Reviewed\", \"Unwanted\", \"Reported\", \"Sent to manager\". Like letters in folders: you see at once what needs attention.",
        effect: "In the test moderators found the right group of comments on the first try.",
        basis: "Admin panel audit; hypothesis 01 in testing.",
      },
      {
        id: "inline",
        title: "A decision right in the list",
        found: "A short, obvious comment needs no investigation, but before, each one had to be opened on a separate page.",
        did: "I moved the decision buttons into the list itself. The obvious gets closed on the spot: one click where there used to be five.",
        effect: "Most of the time saved came from here. Routine no longer means jumping between pages.",
        basis: "Hypothesis 02 in testing: prototype 2.",
      },
      {
        id: "card",
        title: "A detailed page for the doubtful cases",
        found: "A disputed comment lacked context. The original post and the author's history had to be found by hand.",
        did: "I put everything needed for a decision on one page: the text of the post, a short note on the author and their reputation (karma), the reply thread, the history of work on this comment and the complaints. I added sorting by popular comments and by authors with low reputation.",
        effect: "A hard comment gets decided on one screen.",
        basis: "Hypothesis 03 in testing: prototype 1.",
        image: img(M + "01.webp", 1600, 1200, "Comment page: actions on top, the post, the author, the reply thread, history and complaints"),
      },
      {
        id: "mechanism",
        title: "One way of working for everything",
        found: "A moderator checks five different things, and the general admin panel handles each in its own way.",
        did: "I made the same order of actions for comments, users, publications, groups and posts. Statuses and rejection reasons are shared. A new type is added to the same template.",
        effect: "A moderator learns the dashboard once. When a new section appears there is nothing to relearn, and the team does not have to invent a new interface for it.",
        basis: "Engineering interviews: sections have to be assembled from one template.",
      },
    ],
  },
  results: {
    lead: "Fewer steps, less time on every check.",
    points: [
      "Checking a comment now takes 38% fewer steps, mostly thanks to the decision right in the list",
      "The same task takes 32% less time",
      "The winning prototype scored 4.3 out of 5. The most common praise was \"you don't have to dive in anywhere\"",
      "Five types of items are checked in one and the same way",
    ],
    honesty: "These are results of a test on a prototype. I have no numbers from the live site: the dashboard went into development based on these mock-ups.",
  },
  roadmap: [
    { kicker: "Section", title: "Users", text: "A user page with reputation and a history of violations. Moderators will check the people who write comments as well as the comments." },
    { kicker: "Sections", title: "Publications and groups", text: "The same statuses and the same way of working for publications, groups and posts. The scheme is ready. What is left is laying it out on screens." },
    { kicker: "Handoff", title: "Handoff to engineering", text: "The logic and the elements are described so that developers can build the dashboard piece by piece without asking about every screen." },
  ],
  takeaways: [
    "Two prototypes built on opposite ideas gave more than one \"average\" prototype would. The test showed that both ideas are needed at once, and where the line between routine and a doubtful case runs.",
    "I asked the developers about technical limits before the mock-ups. That is cheaper than redoing them later.",
  ],
  quote: "A decision right in the list saves clicks. And clicks are what a moderator's working day is made of.",
  gallery: [
    {
      kind: "spot",
      title: "The same list for another section: users",
      image: img(F + "moderator-queue.png", 1440, 1156, "User queue with filters, assignees, statuses and complaints", "hero"),
      spots: [
        { x: 27, y: 11.6, text: "Statuses are tabs: the queue is sorted into folders", decision: "registry" },
        { x: 40, y: 18.3, text: "Filters by ID, name, assignee, status and period", decision: "registry" },
        { x: 66.5, y: 33.1, text: "The status shows right in the row, no need to open the page", decision: "inline" },
        { x: 94, y: 26.8, text: "Complaints have their own column, and you can sort by it", decision: "mechanism" },
      ],
    },
    {
      kind: "compare",
      title: "Profile and confirmation of an important action",
      before: img(F + "moderator-profile.png", 1440, 861, "User profile: what they wrote and what is linked to them"),
      after: img(F + "moderator-confirm.png", 1440, 861, "Confirmation before a moderator takes a request into work"),
      labels: ["Context", "Confirmation"],
    },
  ],
  deepDives: [],
};
