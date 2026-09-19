/* v41: рассказ кейса «Электронный дом» на двух языках.
   Источник — Main cases/Electronic-house.html и EN/Electronic-house.en.html. Экранов в публичном доступе нет,
   поэтому галереи нет: кейс держится на аудите и матрице приоритетов. Положение точек на матрице — по тексту
   кейса («дёшево и бьёт сильно» / «заметно улучшает, но требует времени»), без выдуманных оценок в баллах. */
import type { CaseStory } from "../caseStory";

export const ru: CaseStory = {
  id: "electronic-house",
  hero: {
    kicker: "UX-аудит · Мобильное приложение · 2024",
    title: "Электронный дом",
    tagline: "Разобрал, за что жильцы ругают приложение ЖКХ, и пересобрал ключевые экраны.",
    summary:
      "Приложение для ЖКХ собирало негативные оценки, смежная команда подтвердила это исследованием. Я прошёл по экранам, собрал проблемы навигации и информативности, приоритизировал рекомендации и переделал главный экран, «Мой дом», чаты и обработку ошибок. На выходе получилась дорожная карта: что чинить срочно, а что заложить на вырост.",
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
    { value: "4 экрана", label: "пересобрал заново" },
    { value: "2 горизонта", label: "приоритеты правок: срочное и долгосрочное" },
    { value: "4 идеи", label: "заложил на вырост" },
  ],
  context: {
    lead: "Оценки падали, а внятного списка правок не было.",
    text:
      "Смежная команда провела исследование и принесла неприятное: приложение получает негативные оценки, пользователи путаются и раздражаются. Но «плохо» — это ещё не задача. Нужно было понять, что плохо, почему и за что хвататься первым.\n\nЗадачей стал UX-аудит: пройти по ключевым экранам, найти, где ломается логика и где человек теряется, и выдать приоритизированные рекомендации, срочные и долгосрочные.",
    team: [
      { who: "Команда исследований", how: "Принесла данные о негативе: оценки и жалобы пользователей. Аудит стартовал с реального фидбэка, а не с моих догадок." },
      { who: "Продуктовая команда", how: "Вместе решали, что из находок критично для продукта и что реалистично взять в ближайшие итерации." },
      { who: "Реализуемость", how: "Держал рекомендации в рамках существующего приложения: точечные правки, которые можно выкатить. Переписывать всё с нуля никто не собирался." },
    ],
    myRole: "Аудит по юзабилити-нормам, карта проблем по экранам, приоритизация находок и редизайн четырёх самых больных экранов. Остальное оформил рекомендациями.",
  },
  research: {
    lead: "От жалоб в сторах к карте проблем и порядку работ.",
    methods: [
      {
        kind: "Данные команды исследований",
        title: "С чего начался аудит",
        question: "На что жалуются люди, когда ставят низкую оценку?",
        sample: "Оценки и жалобы пользователей, собранные смежной командой",
        finding: "Один из главных источников плохих оценок — ошибки: модалка с непонятным кодом. Человек не понимал ни причины, ни что делать дальше, и шёл писать отзыв.",
      },
      {
        kind: "Эвристический аудит",
        title: "Проход по нормам, а не «на вкус»",
        question: "Где ломается логика взаимодействия и где не хватает читаемости и контраста?",
        sample: "Шесть экранов: главный, «Мой дом», соседи, чаты, обработка ошибок, услуги",
        finding: "На главном столько всего, что цель приложения не считывается. В «Моём доме» уведомление об отклонённой заявке почти нельзя найти. В чатах намешаны четыре типа общения.",
      },
      {
        kind: "Карта проблем",
        title: "Находки по экранам",
        question: "Какие проблемы повторяются и на каких экранах человек теряется чаще всего?",
        sample: "Все находки аудита, разложенные по шести экранам",
        finding: "Проблемы двух видов: навигация (куда идти и кому писать) и информативность (что с моим адресом, что случилось). Это задало состав редизайна: четыре экрана, где сходятся оба вида.",
      },
      {
        kind: "Сверка с продуктом",
        title: "Что реально взять в работу",
        question: "Что из находок критично и что помещается в ближайшие итерации?",
        sample: "Продуктовая команда",
        finding: "Рекомендации остались в рамках существующего приложения. Дорогие идеи (онбординг, черновики, навигация под iOS) ушли в долгий горизонт.",
      },
    ],
    matrix: {
      title: "Каждую находку взвесил по двум осям: насколько сильно бьёт по пользователю и сколько стоит внедрить.",
      axes: ["Сила удара по пользователю", "Стоимость внедрения"],
      items: [
        { text: "Ошибки с непонятным кодом: главный генератор негатива, а починка дешёвая — переписать тексты", impact: 88, cost: 16, tier: "Срочно" },
        { text: "Перегруженный главный и потерянное уведомление об отклонении: бьют по каждому входу, правки точечные", impact: 72, cost: 36, tier: "Срочно" },
        { text: "Онбординг, черновики заявок, навигация под iOS, наполнение профилей и услуг: заметно улучшают, но требуют времени и разработки", impact: 48, cost: 80, tier: "В долгую" },
      ],
      note: "Сначала снять то, из-за чего ставят одну звезду и пишут гневный отзыв: это дёшево и возвращает доверие. Потом то, что делает приложение приятным.",
    },
  },
  decisions: {
    lead: "Что нашёл по экранам и что с этим сделал.",
    items: [
      {
        id: "home",
        title: "Главный экран, который отвечает «зачем я здесь»",
        found: "На главном столько всего, что цель приложения не считывается: среди баннеров и лент теряется то, ради чего человек зашёл.",
        did: "Вычистил нецелевое и вывел вперёд то, что нужно жильцу чаще всего: платежи, заявки, показания, уведомления.",
        effect: "С первого экрана видно, что делать, и не нужно продираться сквозь рекламу партнёров.",
        basis: "Эвристический аудит; срочный горизонт матрицы.",
      },
      {
        id: "myhome",
        title: "«Мой дом», где понятно, что с адресом",
        found: "Раздел выглядел полупустым, а важное терялось: уведомление, что заявку на подтверждение недвижимости отклонили, найти было почти нельзя. Профили соседей рядом тоже пустые.",
        did: "Добавил в карточки адресов статус жильца, вывел вперёд платежи, заявки, голосования и ОСС, сделал заметным уведомление об отклонении заявки.",
        effect: "Раздел стал рабочим: не нужно гадать, почему «ничего не происходит».",
        basis: "Карта проблем: информативность.",
      },
      {
        id: "chats",
        title: "Чаты, где понятно, кому пишешь",
        found: "В чатах намешаны четыре типа общения: дом, личные, консьерж, поддержка. Кнопка «Вопрос консьержу» вводила в заблуждение: от неё ждали не того, что она делала.",
        did: "Развёл типы чатов по группам и переименовал так, чтобы название говорило, что за ним стоит.",
        effect: "С первого взгляда ясно, в какой чат пишешь и кто ответит.",
        basis: "Карта проблем: навигация.",
      },
      {
        id: "errors",
        title: "Ошибки на человеческом языке",
        found: "Ошибку показывали модалкой с непонятным кодом. Человек не понимал ни причины, ни что делать дальше, и шёл писать негативный отзыв.",
        did: "Переписал ошибки: что случилось, почему и что сделать прямо сейчас. Код, понятный только разработчику, из сообщения ушёл.",
        effect: "Ошибка перестала быть тупиком и поводом снять приложению звезду в сторе.",
        basis: "Данные команды исследований; самая дешёвая и самая срочная правка матрицы.",
      },
    ],
  },
  results: {
    lead: "На выходе — приоритизированная карта правок.",
    points: [
      "Собрал проблемы навигации и информативности по шести экранам: от перегруженного главного до модалок, где есть код ошибки и нет объяснения",
      "Пересобрал четыре экрана: главный, «Мой дом», чаты, обработка ошибок",
      "Передал команде дорожную карту: понятно, что брать в ближайший спринт, а что планировать на вырост",
    ],
    honesty: "Это аудит с дорожной картой правок, а не замер прод-эффекта: цифр по внедрению у меня нет. Числа выше — про охват работы, а не про изменение оценок в сторах.",
  },
  roadmap: [
    { kicker: "Онбординг", title: "Обучение с повтором", text: "Сценарий первого входа, который можно пройти заново: чтобы новый жилец понимал, что умеет приложение." },
    { kicker: "Черновики", title: "Заявки и объявления", text: "Сохранение черновиков, чтобы прерванное на полпути не приходилось набирать заново." },
    { kicker: "Навигация и тексты", title: "iOS-гайдлайны и подсказки", text: "Навигация под привычные iOS-паттерны, плейсхолдеры и подсказки на пустых экранах." },
  ],
  takeaways: [
    "Сначала чиним «почему бесит», потом добавляем «чтобы полюбили». Дешёвые правки вроде переписанных текстов ошибок быстрее всего возвращают доверие.",
    "С юзабилити-нормами в руках спорить можно фактами, а не «мне кажется».",
    "Аудит стоит заканчивать порядком работ. Список из двадцати «надо бы» команда не возьмёт.",
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
    tagline: "I found out why residents hate their housing app and rebuilt the key screens.",
    summary:
      "The housing and utility services app kept collecting bad ratings, and a neighbouring team's research confirmed it. I went through the screens, mapped the navigation and clarity problems, prioritised the recommendations and redesigned the home screen, \"My Home\", chats and error handling. The result is a roadmap: what to fix right now and what to plan for later.",
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
    { value: "4 screens", label: "rebuilt from scratch" },
    { value: "2 horizons", label: "fix priorities: urgent and long-term" },
    { value: "4 ideas", label: "planned for later" },
  ],
  context: {
    lead: "Ratings were dropping, and nobody had a clear list of fixes.",
    text:
      "A neighbouring team ran research and came back with bad news: the app gets negative ratings, users get confused and annoyed. But \"it's bad\" is not a task yet. We needed to know what exactly was bad, why, and what to tackle first.\n\nThe job was a UX audit: walk through the key screens, find where the logic breaks and where people get lost, and deliver prioritised recommendations, urgent and long-term.",
    team: [
      { who: "Research team", how: "Brought the data on the negativity: ratings and user complaints. The audit started from real feedback, not my guesses." },
      { who: "Product team", how: "Together we decided which findings were critical for the product and what was realistic for the next iterations." },
      { who: "Feasibility", how: "I kept the recommendations within the existing app: targeted fixes that can actually ship instead of \"rewrite everything from scratch\"." },
    ],
    myRole: "An audit against usability heuristics, a problem map by screen, prioritised findings and a redesign of the four most painful screens. The rest went into recommendations.",
  },
  research: {
    lead: "From store complaints to a problem map and an order of work.",
    methods: [
      {
        kind: "Research team data",
        title: "Where the audit started",
        question: "What exactly do people complain about when they leave a low rating?",
        sample: "Ratings and user complaints collected by the neighbouring team",
        finding: "One of the main sources of bad ratings was errors: a modal with a cryptic code. People did not understand the cause or what to do next, so they went and wrote a review.",
      },
      {
        kind: "Heuristic audit",
        title: "Checked against heuristics, not taste",
        question: "Where does the interaction logic break, and where are readability and contrast lacking?",
        sample: "Six screens: home, \"My Home\", neighbours, chats, error handling, services",
        finding: "The home screen has so much going on that the app's purpose gets lost. In \"My Home\" the notice about a rejected request is almost impossible to find. The chats mix four kinds of conversation.",
      },
      {
        kind: "Problem map",
        title: "Findings by screen",
        question: "Which problems repeat, and on which screens do people get lost most often?",
        sample: "All audit findings sorted across six screens",
        finding: "Two kinds of problems: navigation (where to go and who to write to) and clarity (what is up with my address, what just happened). That set the scope of the redesign: the four screens where both kinds meet.",
      },
      {
        kind: "Product check",
        title: "What can really be taken on",
        question: "Which findings are critical, and what fits into the next iterations?",
        sample: "The product team",
        finding: "The recommendations stayed within the existing app. The expensive ideas (onboarding, drafts, iOS-style navigation) went to the long horizon.",
      },
    ],
    matrix: {
      title: "I weighed every finding on two axes: how hard it hits the user and how much it costs to ship.",
      axes: ["Impact on the user", "Cost to ship"],
      items: [
        { text: "Errors with cryptic codes: the top source of negativity, and the fix is cheap, rewrite the copy", impact: 88, cost: 16, tier: "Urgent" },
        { text: "An overloaded home screen and a buried rejection notice: they hit every visit, and the fixes are targeted", impact: 72, cost: 36, tier: "Urgent" },
        { text: "Onboarding, request drafts, iOS-style navigation, richer profiles and services: a noticeable improvement that needs time and development", impact: 48, cost: 80, tier: "Long term" },
      ],
      note: "First remove whatever makes people leave one star and an angry review: it is cheap and wins back trust. Then work on what makes the app pleasant to use.",
    },
  },
  decisions: {
    lead: "What I found on each screen, and what I did about it.",
    items: [
      {
        id: "home",
        title: "A home screen that answers \"why am I here\"",
        found: "The home screen had so much going on that the app's purpose got lost: among the banners and feeds, the thing people came for disappeared.",
        did: "Cleared out the off-target content and brought forward what residents need most often: payments, service requests, meter readings, notifications.",
        effect: "From the first screen it is clear what to do, with no wading through partner ads.",
        basis: "Heuristic audit; the urgent horizon of the matrix.",
      },
      {
        id: "myhome",
        title: "A \"My Home\" that tells you what is up with your address",
        found: "The section looked half-empty while the important things got lost: the notice that your property ownership request was rejected was almost impossible to find. The neighbours' profiles next to it were empty too.",
        did: "Added the resident's status to the address cards, brought forward payments, requests, votes and owners' general meetings, and made the rejection notice visible.",
        effect: "The section became useful: no more guessing why \"nothing is happening\".",
        basis: "Problem map: clarity.",
      },
      {
        id: "chats",
        title: "Chats where you know who you are writing to",
        found: "The chats mixed four kinds of conversation: building, private, concierge, support. The \"Ask the concierge\" button was misleading: people expected it to do something other than what it did.",
        did: "Split the chat types into groups and renamed them so each name says what is behind it.",
        effect: "At a glance you know which chat you are in and who will answer.",
        basis: "Problem map: navigation.",
      },
      {
        id: "errors",
        title: "Errors in human language",
        found: "Errors appeared in a modal with a cryptic code. People did not understand the cause or what to do next, so they went and wrote a bad review.",
        did: "Rewrote the errors: what happened, why, and what to do right now. The code that only a developer can read is gone.",
        effect: "An error stopped being a dead end and a reason to knock a star off the app in the store.",
        basis: "Research team data; the cheapest and most urgent fix on the matrix.",
      },
    ],
  },
  results: {
    lead: "The result: a prioritised map of fixes.",
    points: [
      "Navigation and clarity problems mapped across six screens, from an overloaded home screen to error modals that show a code and no explanation",
      "Four screens rebuilt: home, \"My Home\", chats, error handling",
      "A roadmap handed to the team: what goes into the next sprint and what to plan for later",
    ],
    honesty: "This is an audit with a roadmap of fixes, not a measured production impact: I do not have post-launch numbers. The figures above describe the scope of the work, not a change in store ratings.",
  },
  roadmap: [
    { kicker: "Onboarding", title: "Replayable walkthrough", text: "A first-launch flow you can replay, so a new resident understands what the app can do." },
    { kicker: "Drafts", title: "Requests and listings", text: "Saving drafts, so anything abandoned halfway does not have to be typed again." },
    { kicker: "Navigation and copy", title: "iOS guidelines and hints", text: "Navigation built on familiar iOS patterns, plus placeholders and hints on empty screens." },
  ],
  takeaways: [
    "First fix \"why it's annoying\", then add \"why people love it\". Cheap fixes like rewritten error copy win trust back fastest.",
    "With usability heuristics in hand, the argument is about facts rather than \"I feel like\".",
    "An audit should end with an order of work. A team will not pick up a list of twenty \"we really should\"s.",
  ],
  quote: "First fix \"why it's annoying\", then add \"why people love it\".",
  gallery: [],
  deepDives: [],
};
