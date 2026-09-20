/* v41: рассказ кейса «Электронный дом» на двух языках.
   Источник — Main cases/Electronic-house.html и EN/Electronic-house.en.html. Экранов в публичном доступе нет,
   поэтому галереи нет: кейс держится на аудите и матрице приоритетов. Положение точек на матрице — по тексту
   кейса («дёшево и бьёт сильно» / «заметно улучшает, но требует времени»), без выдуманных оценок в баллах.
   v56: тексты переписаны простым языком, факты и цифры те же. */
import type { CaseStory } from "../caseStory";

export const ru: CaseStory = {
  id: "electronic-house",
  hero: {
    kicker: "UX-аудит · Мобильное приложение · 2024",
    title: "Электронный дом",
    tagline: "Выяснил, за что жильцы ругают приложение ЖКХ, и переделал самые больные экраны.",
    summary:
      "Приложение для жильцов получало плохие оценки. Соседняя команда провела исследование и это подтвердила. Я прошёл по экранам и записал, где человек не понимает, куда идти, и где ему не хватает информации. Потом расставил правки по срочности и переделал четыре экрана: главный, «Мой дом», чаты и сообщения об ошибках. Команда получила план: что чинить сейчас, а что запланировать на потом.",
    facts: [
      ["Роль", "UX-дизайнер"],
      ["Компания", "Департамент информационных технологий Москвы (ДИТ)"],
      ["Срок", "2024"],
      ["Платформа", "iOS и Android"],
    ],
    tags: ["UX-аудит", "Мобайл", "GovTech", "Редизайн"],
  },
  kpis: [
    { value: "6 экранов", label: "разобрал в аудите" },
    { value: "4 экрана", label: "переделал заново" },
    { value: "2 горизонта", label: "правки поделены на срочные и на потом" },
    { value: "4 идеи", label: "отложил на будущее" },
  ],
  context: {
    lead: "Оценки падали, а понятного списка правок ни у кого не было.",
    text:
      "Соседняя команда провела исследование и принесла плохие новости: приложению ставят низкие оценки, люди путаются и злятся. Но «всё плохо» ещё не задача. Это как прийти к врачу со словами «мне нехорошо». Сначала надо понять, что именно болит, почему и что лечить первым.\n\nЯ провёл UX-аудит. Прошёл по главным экранам, нашёл места, где человек сбивается с толку, и отдал команде список правок по порядку: что сделать срочно, а что можно отложить.",
    team: [
      { who: "Команда исследований", how: "Принесла оценки и жалобы пользователей. Аудит начался с того, что люди пишут на самом деле, и мои догадки были ни при чём." },
      { who: "Продуктовая команда", how: "Вместе решали, какие находки важнее всего для приложения и что получится сделать в ближайшее время." },
      { who: "Реализуемость", how: "Предлагал только то, что можно сделать в нынешнем приложении: небольшие правки, которые реально выпустить. Переписывать всё с нуля никто не собирался." },
    ],
    myRole: "Проверил экраны по общепринятым правилам удобства, записал проблемы по каждому экрану, расставил их по срочности и переделал четыре самых больных экрана. Остальное оформил рекомендациями.",
  },
  research: {
    lead: "От жалоб в магазине приложений к списку проблем и порядку работ.",
    methods: [
      {
        kind: "Данные команды исследований",
        title: "С чего начался аудит",
        question: "На что жалуются люди, когда ставят низкую оценку?",
        sample: "Оценки и жалобы пользователей, собранные смежной командой",
        finding: "Один из главных поводов для плохой оценки — ошибки. Человеку показывали окно с непонятным кодом. Он не понимал, что случилось и что делать дальше, и шёл писать отзыв.",
      },
      {
        kind: "Эвристический аудит",
        title: "Проверка по правилам, а не на вкус",
        question: "Где человек сбивается с толку, и где текст плохо читается?",
        sample: "Шесть экранов: главный, «Мой дом», соседи, чаты, обработка ошибок, услуги",
        finding: "На главном экране так много всего, что непонятно, зачем вообще это приложение. В «Моём доме» почти не найти сообщение о том, что заявку отклонили. В чатах смешаны четыре вида переписки.",
      },
      {
        kind: "Карта проблем",
        title: "Находки по экранам",
        question: "Какие проблемы повторяются, и на каких экранах люди теряются чаще всего?",
        sample: "Все находки аудита, разложенные по шести экранам",
        finding: "Проблемы оказались двух видов. Первый: непонятно, куда идти и кому писать. Второй: не хватает информации (что с моим адресом, что сейчас произошло). Переделывать я взял четыре экрана, где встречаются оба вида.",
      },
      {
        kind: "Сверка с продуктом",
        title: "Что получится взять в работу",
        question: "Какие находки самые важные, и что успеем сделать в ближайшее время?",
        sample: "Продуктовая команда",
        finding: "Все рекомендации остались в рамках нынешнего приложения. Дорогие идеи (обучение при первом входе, черновики, навигация как принято на iOS) ушли в дальний план.",
      },
    ],
    matrix: {
      title: "Каждую находку я оценил по двум вопросам: насколько она мешает людям и сколько стоит её исправить.",
      axes: ["Насколько мешает людям", "Сколько стоит исправить"],
      items: [
        { text: "Ошибки с непонятным кодом. Больше всего злят людей, а исправить дёшево: нужно переписать тексты", impact: 88, cost: 16, tier: "Срочно" },
        { text: "Перегруженный главный экран и потерянное сообщение об отказе. Мешают при каждом входе, а правки небольшие", impact: 72, cost: 36, tier: "Срочно" },
        { text: "Обучение при первом входе, черновики заявок, навигация как принято на iOS, заполненные профили и услуги. Заметно улучшают приложение, но требуют времени и разработки", impact: 48, cost: 80, tier: "В долгую" },
      ],
      note: "Сначала убрать то, из-за чего ставят одну звезду и пишут гневный отзыв. Это дёшево и возвращает доверие. Потом заняться тем, что делает приложение приятным.",
    },
  },
  decisions: {
    lead: "Что нашёл на каждом экране и что с этим сделал.",
    items: [
      {
        id: "home",
        title: "Главный экран, на котором понятно, зачем ты здесь",
        found: "На главном было так много всего, что терялся смысл приложения. Среди баннеров и лент не найти то, ради чего человек зашёл.",
        did: "Убрал лишнее и поставил вперёд то, что жильцу нужно чаще всего: платежи, заявки, показания счётчиков, уведомления.",
        effect: "С первого экрана видно, что делать. Продираться через рекламу партнёров больше не нужно.",
        basis: "Эвристический аудит; срочный горизонт матрицы.",
      },
      {
        id: "myhome",
        title: "«Мой дом», где видно, что с твоим адресом",
        found: "Раздел выглядел полупустым, а важное в нём терялось. Сообщение о том, что заявку на подтверждение недвижимости отклонили, найти было почти невозможно. Профили соседей рядом тоже были пустыми.",
        did: "Добавил в карточку адреса статус жильца. Поставил вперёд платежи, заявки, голосования и общие собрания собственников (ОСС). Сделал заметным сообщение об отклонённой заявке.",
        effect: "Раздел стал полезным. Больше не нужно гадать, почему «ничего не происходит».",
        basis: "Карта проблем: информативность.",
      },
      {
        id: "chats",
        title: "Чаты, где понятно, кому пишешь",
        found: "В чатах были смешаны четыре вида переписки: дом, личные, консьерж, поддержка. Кнопка «Вопрос консьержу» сбивала с толку: от неё ждали одного, а делала она другое.",
        did: "Разложил чаты по группам и дал им названия, по которым сразу ясно, что внутри.",
        effect: "С первого взгляда понятно, в какой чат ты пишешь и кто ответит.",
        basis: "Карта проблем: навигация.",
      },
      {
        id: "errors",
        title: "Ошибки человеческим языком",
        found: "Об ошибке сообщало окно с непонятным кодом. Человек не понимал, что случилось и что делать дальше, и шёл писать плохой отзыв.",
        did: "Переписал сообщения об ошибках. Теперь в каждом сказано, что случилось, почему и что сделать прямо сейчас. Код, понятный только разработчику, из сообщения убрал.",
        effect: "Ошибка перестала быть тупиком и поводом снять приложению звезду.",
        basis: "Данные команды исследований; самая дешёвая и самая срочная правка матрицы.",
      },
    ],
  },
  results: {
    lead: "Итог работы: список правок по порядку.",
    points: [
      "Записал проблемы на шести экранах: от перегруженного главного до окон, где есть код ошибки и нет объяснения",
      "Переделал четыре экрана: главный, «Мой дом», чаты, сообщения об ошибках",
      "Отдал команде план: что брать в ближайший спринт, а что запланировать на будущее",
    ],
    honesty: "Это аудит с планом правок. Как изменились оценки после внедрения, я не знаю: таких цифр у меня нет. Числа выше показывают объём работы, а не рост оценок в магазине приложений.",
  },
  roadmap: [
    { kicker: "Онбординг", title: "Обучение, которое можно пройти ещё раз", text: "Знакомство с приложением при первом входе, к которому можно вернуться. Новый жилец поймёт, что приложение умеет." },
    { kicker: "Черновики", title: "Заявки и объявления", text: "Сохранять черновики. Если человека прервали на середине, ему не придётся набирать всё заново." },
    { kicker: "Навигация и тексты", title: "Привычки iOS и подсказки", text: "Навигация, к которой привыкли на iOS, и подсказки на пустых экранах: что здесь будет и что нужно сделать." },
  ],
  takeaways: [
    "Сначала чиним «почему бесит», потом добавляем «чтобы полюбили». Дешёвые правки вроде переписанных текстов ошибок возвращают доверие быстрее всего.",
    "Когда в руках общепринятые правила удобства, спор идёт о фактах. Без них он идёт о вкусах.",
    "Аудит стоит заканчивать порядком работ. Список из двадцати «надо бы» команда в работу не возьмёт.",
  ],
  quote: "Сначала чиним «почему бесит», потом добавляем «чтобы полюбили».",
  gallery: [],
  deepDives: [],
};

export const en: CaseStory = {
  id: "electronic-house",
  hero: {
    kicker: "UX audit · Mobile app · 2024",
    title: "Electronic House",
    tagline: "I found out why residents complain about their housing app and redid its most painful screens.",
    summary:
      "An app for residents of apartment buildings kept getting bad ratings. A neighbouring team ran research and confirmed it. I went through the screens and wrote down where a person cannot tell where to go and where they lack information. Then I sorted the fixes by urgency and redid four screens: the home screen, \"My Home\", the chats and the error messages. The team got a plan: what to fix now and what to schedule for later.",
    facts: [
      ["Role", "UX designer"],
      ["Company", "Moscow Department of Information Technology (DIT)"],
      ["Timeline", "2024"],
      ["Platform", "iOS and Android"],
    ],
    tags: ["UX audit", "Mobile", "GovTech", "Redesign"],
  },
  kpis: [
    { value: "6 screens", label: "covered in the audit" },
    { value: "4 screens", label: "redone from scratch" },
    { value: "2 horizons", label: "fixes split into urgent and later" },
    { value: "4 ideas", label: "put off for the future" },
  ],
  context: {
    lead: "Ratings were dropping, and nobody had a clear list of fixes.",
    text:
      "A neighbouring team ran research and came back with bad news: the app gets low ratings, and people get confused and angry. But \"everything is bad\" is not a task yet. It is like telling a doctor \"I don't feel well\". First you have to find out what hurts, why, and what to treat first.\n\nI ran a UX audit. I went through the main screens, found the places where a person gets confused, and gave the team a list of fixes in order: what to do urgently and what can wait.",
    team: [
      { who: "Research team", how: "Brought the ratings and the user complaints. The audit started from what people really write, and my guesses had nothing to do with it." },
      { who: "Product team", how: "Together we decided which findings matter most for the app and what could be done in the near future." },
      { who: "Feasibility", how: "I only suggested what can be done in the current app: small fixes that can really ship. Nobody was going to rewrite everything from scratch." },
    ],
    myRole: "I checked the screens against the common rules of usability, wrote down the problems on each screen, sorted them by urgency and redid the four most painful screens. The rest went into recommendations.",
  },
  research: {
    lead: "From complaints in the app store to a list of problems and an order of work.",
    methods: [
      {
        kind: "Research team data",
        title: "Where the audit started",
        question: "What do people complain about when they leave a low rating?",
        sample: "Ratings and user complaints collected by the neighbouring team",
        finding: "One of the main reasons for a bad rating is errors. People were shown a window with a cryptic code. They did not understand what had happened or what to do next, so they went and wrote a review.",
      },
      {
        kind: "Heuristic audit",
        title: "Checked against rules, not taste",
        question: "Where does a person get confused, and where is the text hard to read?",
        sample: "Six screens: home, \"My Home\", neighbours, chats, error handling, services",
        finding: "The home screen has so much on it that you cannot tell what the app is for. In \"My Home\" the message that a request was rejected is almost impossible to find. The chats mix four kinds of conversation.",
      },
      {
        kind: "Problem map",
        title: "Findings by screen",
        question: "Which problems repeat, and on which screens do people get lost most often?",
        sample: "All audit findings sorted across six screens",
        finding: "The problems came in two kinds. The first: it is unclear where to go and who to write to. The second: information is missing (what is up with my address, what just happened). I chose to redo the four screens where both kinds meet.",
      },
      {
        kind: "Product check",
        title: "What we can take on",
        question: "Which findings matter most, and what can we get done in the near future?",
        sample: "The product team",
        finding: "All the recommendations stayed within the current app. The expensive ideas (a first-launch walkthrough, drafts, navigation the way iOS users expect it) went into the long-term plan.",
      },
    ],
    matrix: {
      title: "I rated every finding on two questions: how much it gets in people's way and how much it costs to fix.",
      axes: ["How much it gets in the way", "How much it costs to fix"],
      items: [
        { text: "Errors with a cryptic code. They anger people the most and are cheap to fix: the texts need rewriting", impact: 88, cost: 16, tier: "Urgent" },
        { text: "An overloaded home screen and a lost rejection message. They get in the way on every visit, and the fixes are small", impact: 72, cost: 36, tier: "Urgent" },
        { text: "A first-launch walkthrough, request drafts, navigation the way iOS users expect it, filled-in profiles and services. They improve the app a lot but need time and development", impact: 48, cost: 80, tier: "Long term" },
      ],
      note: "First remove whatever makes people leave one star and an angry review. It is cheap and wins trust back. Then work on what makes the app pleasant.",
    },
  },
  decisions: {
    lead: "What I found on each screen and what I did about it.",
    items: [
      {
        id: "home",
        title: "A home screen that tells you why you are here",
        found: "The home screen had so much on it that the point of the app got lost. Among the banners and feeds you could not find the thing you came for.",
        did: "I removed the extras and put forward what a resident needs most often: payments, service requests, meter readings, notifications.",
        effect: "From the first screen it is clear what to do. There is no more wading through partner ads.",
        basis: "Heuristic audit; the urgent horizon of the matrix.",
      },
      {
        id: "myhome",
        title: "A \"My Home\" that shows what is up with your address",
        found: "The section looked half empty, and the important things in it got lost. The message that your property confirmation request was rejected was almost impossible to find. The neighbours' profiles next to it were empty too.",
        did: "I added the resident's status to the address card. I put forward payments, requests, votes and the owners' general meetings. I made the message about a rejected request easy to notice.",
        effect: "The section became useful. No more guessing why \"nothing is happening\".",
        basis: "Problem map: clarity.",
      },
      {
        id: "chats",
        title: "Chats where you know who you are writing to",
        found: "The chats mixed four kinds of conversation: building, private, concierge, support. The \"Ask the concierge\" button was confusing: people expected one thing from it, and it did another.",
        did: "I sorted the chats into groups and gave them names that tell you at once what is inside.",
        effect: "At a glance you know which chat you are writing in and who will answer.",
        basis: "Problem map: navigation.",
      },
      {
        id: "errors",
        title: "Errors in plain words",
        found: "An error was reported by a window with a cryptic code. People did not understand what had happened or what to do next, so they went and wrote a bad review.",
        did: "I rewrote the error messages. Each one now says what happened, why, and what to do right now. The code that only a developer can read is gone from the message.",
        effect: "An error stopped being a dead end and a reason to take a star off the app.",
        basis: "Research team data; the cheapest and most urgent fix on the matrix.",
      },
    ],
  },
  results: {
    lead: "The outcome: a list of fixes in order.",
    points: [
      "I wrote down the problems on six screens, from the overloaded home screen to windows that show an error code and no explanation",
      "I redid four screens: home, \"My Home\", chats, error messages",
      "I gave the team a plan: what goes into the next sprint and what to schedule for the future",
    ],
    honesty: "This is an audit with a plan of fixes. I do not know how the ratings changed after the fixes went in: I have no such numbers. The figures above show how much work was done. They say nothing about ratings in the app store.",
  },
  roadmap: [
    { kicker: "Onboarding", title: "A walkthrough you can take again", text: "An introduction to the app on first launch that you can come back to. A new resident will see what the app can do." },
    { kicker: "Drafts", title: "Requests and listings", text: "Save drafts. If a person is interrupted halfway, they will not have to type everything again." },
    { kicker: "Navigation and copy", title: "iOS habits and hints", text: "Navigation the way iOS users are used to, and hints on empty screens: what will appear here and what you need to do." },
  ],
  takeaways: [
    "First fix \"why it's annoying\", then add \"why people love it\". Cheap fixes like rewritten error texts win trust back fastest.",
    "With the common rules of usability in hand, the argument is about facts. Without them it is about taste.",
    "An audit should end with an order of work. A team will not pick up a list of twenty \"we really should\"s.",
  ],
  quote: "First fix \"why it's annoying\", then add \"why people love it\".",
  gallery: [],
  deepDives: [],
};
