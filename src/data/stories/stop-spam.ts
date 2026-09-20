/* v41: рассказ кейса «Стоп-спам» на двух языках. Источник — Main cases/Stop-spam.html и EN/Stop-spam.en.html.
   Воронка показана без процентов по шагам: в кейсе есть только итог (+25 % / −30 %), шаговых цифр нет.
   v56: тексты переписаны простым языком, факты и цифры те же. */
import type { CaseStory, CaseImage } from "../caseStory";

const img = (src: string, w: number, h: number, caption: string, kind = "screen"): CaseImage => ({ src, w, h, caption, kind });
const F = "cases/figma/";

export const ru: CaseStory = {
  id: "stop-spam",
  hero: {
    kicker: "Антиспам-приложение · iOS · Android · 2026",
    title: "Стоп-спам",
    tagline: "Самый скучный экран приложения стал шкалой, которая заполняется у тебя на глазах.",
    summary:
      "Приложение против спама начинает работать только после того, как человек разрешит ему доступ к звонкам, сообщениям и фильтрам. Именно на этих разрешениях люди и бросали настройку, так и не включив защиту. Я разложил разрешения по уровням защиты, добавил шкалу, которая растёт с каждым шагом, и счётчики заблокированного спама. До включённой защиты стало доходить на 25% больше людей, отказов на разрешениях стало на 30% меньше.",
    facts: [
      ["Роль", "UX/UI-дизайнер"],
      ["Команда", "Продукт и аналитика, разработка iOS и Android, маркетинг"],
      ["Срок", "2026"],
      ["Платформа", "iOS и Android"],
    ],
    tags: ["Мобайл", "Онбординг", "Геймификация", "B2C"],
  },
  kpis: [
    { value: "+25 %", label: "людей доходят до включённой защиты" },
    { value: "−30 %", label: "отказов, когда приложение просит доступ" },
    { value: "4,5 из 5", label: "насколько понятна настройка, по тесту с людьми" },
    { value: "2 платформы", label: "iOS и Android, настройка устроена одинаково" },
  ],
  context: {
    lead: "Между установкой и защитой стоял экран, который никто не любит.",
    text:
      "Без системных разрешений приложение против спама бесполезно. Пока нет доступа к звонкам и сообщениям, оно ничего не заблокирует. Чтобы дать доступ, человек проходит несколько системных окон «Разрешить доступ к…». Они тревожные, непонятные и скучные. Это как курьер, который с порога просит ключи от квартиры и не говорит зачем. Приложение ставили, а до работающей защиты не доходили.\n\nКрасивее просить «нажмите Разрешить» было бессмысленно. Нужно было объяснить, зачем нужно каждое разрешение, и показать, что человек получает за каждый выданный доступ.",
    team: [
      { who: "Продукт и аналитика", how: "Вместе смотрели, на каком шаге настройки уходит больше всего людей и без каких разрешений защита не работает совсем." },
      { who: "Разработка iOS и Android", how: "Выяснил, какие системные окна можно показывать и в каком порядке: что позволяет каждая платформа. Узнать это до макетов дешевле, чем после." },
      { who: "Маркетинг и стор", how: "На странице приложения в магазине написано «блокируем спам». Договорились, что настройка подтверждает это обещание с первого экрана." },
    ],
    myRole:
      "Нашёл, где люди бросают настройку, заново выстроил порядок экранов, придумал «уровень защиты» и счётчики, сделал макеты и прототип для iOS и Android с учётом системных окон обеих платформ.",
  },
  research: {
    lead: "Сначала нашёл, на каких окнах люди уходят. Потом сравнил две версии настройки по цифрам.",
    methods: [
      {
        kind: "Разбор воронки",
        title: "Где люди уходят",
        question: "На каком шаге между установкой и включённой защитой теряется больше всего людей?",
        sample: "Воронка онбординга, вместе с продуктом и аналитикой",
        finding:
          "Люди уходили на системных окнах с разрешениями. Человек не знал, сколько ещё окон впереди и зачем они нужны. И ничего не получал сразу за доступ, который уже дал.",
      },
      {
        kind: "Интервью с разработкой",
        title: "Что разрешает платформа",
        question: "Какие системные окна можно показывать, в каком порядке и что можно показать перед ними?",
        sample: "Разработчики iOS и Android, до макетов",
        finding: "Само системное окно изменить нельзя, а экран перед ним можно. Поэтому перед каждым запросом появился экран с объяснением, и порядок на обеих платформах стал одинаковым.",
      },
      {
        kind: "Сверка с обещанием стора",
        title: "Что человеку пообещали",
        question: "Подтверждает ли первый экран то, что написано на странице приложения в магазине?",
        sample: "Маркетинг и карточка приложения в сторе",
        finding: "В магазине обещают «блокируем спам». А первый экран сразу просил доступы и ничего не давал взамен. Счётчики блокировок закрывают этот разрыв прямо во время настройки.",
      },
      {
        kind: "Сравнение двух версий",
        title: "Обычная настройка против настройки со шкалой",
        question: "Какая версия доводит больше людей до включённой защиты?",
        sample: "Две версии онбординга на пользователях, затем метрики после релиза",
        finding: "С заметным отрывом выиграла версия со шкалой и счётчиками: до конца доходило больше людей. После выхода обновления: +25% дошедших до защиты и −30% отказов.",
      },
    ],
    funnel: {
      title: "Путь от установки до включённой защиты. Красным отмечены шаги, на которых люди уходили.",
      steps: [
        { label: "Установка из магазина", note: "На странице приложения обещают: «блокируем спам»" },
        { label: "Первый экран", note: "Раньше он сразу просил доступы" },
        { label: "Системное окно: звонки", note: "Сухое и пугающее. Рука сама тянется к «Запретить»", drop: true },
        { label: "Системное окно: сообщения и фильтр SMS", note: "Непонятно, сколько ещё шагов впереди", drop: true },
        { label: "Защита включена", note: "Сюда доходили не все, кто установил приложение" },
      ],
      note: "Процентов по каждому шагу у меня нет. Показываю только общий результат после выхода обновления.",
    },
    hypotheses: {
      intro: "Версия 1: системные окна идут подряд, у каждого короткая подпись. Версия 2: шкала уровня защиты, счётчики блокировок и экран с объяснением перед каждым запросом.",
      items: [
        { text: "Хочу понимать, зачем приложению мои звонки, до того как соглашусь.", verdict: "Версия 2", won: true },
        { text: "Хочу видеть, что доступ уже что-то даёт. Сейчас его берут как будто в долг.", verdict: "Версия 2", won: true },
        { text: "Хочу понимать, сколько шагов осталось до готовой защиты.", verdict: "Версия 2", won: true },
      ],
      measured: "Смотрели, дошёл ли человек до включённой защиты, на каком системном окне уходили и сколько времени занимала настройка.",
    },
  },
  decisions: {
    lead: "Каждое разрешение проходит одни и те же три шага: объяснить, показать пользу, попросить доступ.",
    items: [
      {
        id: "level",
        title: "Шкала «уровня защиты»",
        found: "Человек не знал, сколько ещё окон впереди и зачем они. Настройка казалась бесконечной.",
        did: "Добавил шкалу, похожую на индикатор заряда. Каждое выданное разрешение поднимает уровень и приближает к «полной защите».",
        effect: "Виден и конец пути, и смысл каждого шага.",
        basis: "Разбор воронки; гипотеза 03.",
        image: img("cases/stop-spam/01.webp", 1300, 2642, "Статистика: уровень защиты 90% и счётчики заблокированного за 30 дней", "device"),
      },
      {
        id: "counters",
        title: "Счётчики заблокированного спама",
        found: "Доступ просили вперёд и ничего не давали за него прямо сейчас.",
        did: "Рядом с каждым разрешением поставил счётчик: столько звонков и сообщений мы заблокируем. Это оценка по данным самого приложения, а не обещание.",
        effect: "Доступ дают охотнее, когда сразу видно, что он даёт.",
        basis: "Сверка с обещанием стора; гипотеза 02.",
      },
      {
        id: "why",
        title: "У каждого разрешения есть объяснение",
        found: "Системное окно сухое и пугающее. Человек не понимает, зачем приложению его звонки и сообщения, и рука сама тянется к «Запретить».",
        did: "Перед каждым системным окном поставил короткий экран «зачем это нужно». Написал его обычными словами, без казённых оборотов и мелкого шрифта.",
        effect: "Меньше тревоги, и реже отказывают не глядя.",
        basis: "Интервью с разработкой: менять можно только экран перед окном; гипотеза 01.",
      },
      {
        id: "rhythm",
        title: "Одинаковый порядок на обеих платформах",
        found: "На iOS и Android разрешения устроены по-разному, и окна идут в разном порядке.",
        did: "Сделал один и тот же порядок для каждого разрешения и общий вид шкалы. Новое разрешение добавляется по тому же образцу.",
        effect: "Настройка читается как одна история, а не как набор случайных окон.",
      },
    ],
  },
  results: {
    lead: "Скучный экран окупился.",
    points: [
      "До включённой защиты стало доходить на четверть больше людей. В основном благодаря шкале и счётчикам блокировок",
      "Отказов, когда приложение просит доступ, стало на 30% меньше",
      "На тесте с людьми понятность настройки оценили на 4,5 из 5",
      "Одна и та же настройка работает на двух очень разных платформах",
    ],
    honesty: "+25% дошедших до защиты и −30% отказов посчитаны по данным приложения после выхода обновления. Оценку понятности я взял из теста с людьми, в работающем приложении её не мерили.",
  },
  roadmap: [
    { kicker: "Механика", title: "Награды за защиту", text: "Значки и уровни за заблокированный спам. Настройка плавно переходит в привычку пользоваться приложением." },
    { kicker: "Персонализация", title: "Подсказки вовремя", text: "Предлагать следующее разрешение в тот момент, когда оно принесёт больше всего пользы. Сейчас всё просят разом при первом запуске." },
    { kicker: "Передача", title: "Передача в разработку", text: "Экраны и все их состояния нарисованы для обеих платформ." },
  ],
  takeaways: [
    "Две версии настройки я сравнивал по цифрам. Какая из них нравится мне больше, значения не имело.",
    "Какие системные окна можно показывать и в каком порядке, стоит выяснить у разработчиков до макетов.",
    "Счётчик рядом с кнопкой убеждал лучше любого текста с уговорами.",
  ],
  quote: "Доступ дают охотнее, когда сразу видно, что он даёт.",
  gallery: [
    {
      kind: "stack",
      title: "Знакомство, настройка фильтра и статистика защиты",
      images: [
        img(F + "spam-welcome.png", 402, 874, "Первый экран: сначала польза приложения, потом просьбы о доступе", "hero"),
        img("cases/stop-spam/01.webp", 1300, 2642, "Статистика: уровень защиты и счётчики заблокированного", "device"),
        img(F + "spam-sms-setup.png", 402, 874, "Настройка фильтра SMS, разложенная на пять понятных шагов"),
      ],
    },
  ],
  deepDives: [],
};

export const en: CaseStory = {
  id: "stop-spam",
  hero: {
    kicker: "Anti-spam app · iOS · Android · 2026",
    title: "Stop Spam",
    tagline: "The most boring screen in the app became a meter that fills up as you go.",
    summary:
      "An anti-spam app only starts working after a person lets it access calls, messages and filters. Those permissions were exactly where people gave up on the setup, without ever switching protection on. I sorted the permissions into protection levels and added a meter that grows with every step, plus counters of blocked spam. 25% more people now reach working protection, and refusals at the permission requests went down by 30%.",
    facts: [
      ["Role", "UX/UI designer"],
      ["Team", "Product and analytics, iOS and Android engineering, marketing"],
      ["Timeline", "2026"],
      ["Platform", "iOS and Android"],
    ],
    tags: ["Mobile", "Onboarding", "Gamification", "B2C"],
  },
  kpis: [
    { value: "+25%", label: "people reach working protection" },
    { value: "−30%", label: "refusals when the app asks for access" },
    { value: "4.5 of 5", label: "how clear the setup is, from a test with people" },
    { value: "2 platforms", label: "iOS and Android, the setup works the same" },
  ],
  context: {
    lead: "Between install and protection sat a screen nobody likes.",
    text:
      "Without system permissions an anti-spam app is useless. Until it can see calls and messages, it blocks nothing. To give access, a person goes through several \"Allow access to…\" system windows. They are alarming, confusing and dull. It is like a courier who asks for the keys to your flat at the door and does not say why. People installed the app and never got to working protection.\n\nAsking \"please tap Allow\" in a prettier way was pointless. The job was to explain why each permission is needed and to show what a person gets for every access they give.",
    team: [
      { who: "Product and analytics", how: "Together we looked at which setup step loses the most people and which permissions protection cannot work without." },
      { who: "iOS and Android engineering", how: "I found out which system windows we can show and in what order: what each platform allows. Learning that before the mock-ups is cheaper than after." },
      { who: "Marketing and app stores", how: "The app's store page says \"we block spam\". We agreed that the setup backs up that promise from the first screen." },
    ],
    myRole:
      "I found where people give up on the setup, rebuilt the order of screens, came up with the protection level and the counters, and made mock-ups and a prototype for iOS and Android that take each platform's system windows into account.",
  },
  research: {
    lead: "First I found which windows made people leave. Then I compared two versions of the setup by the numbers.",
    methods: [
      {
        kind: "Funnel breakdown",
        title: "Where people leave",
        question: "Which step between install and working protection loses the most people?",
        sample: "The onboarding funnel, together with product and analytics",
        finding:
          "People left at the system permission windows. A person did not know how many windows were still ahead or why they were needed. And they got nothing right away for the access they had already given.",
      },
      {
        kind: "Engineering interviews",
        title: "What the platform allows",
        question: "Which system windows can we show, in what order, and what can we show before them?",
        sample: "iOS and Android developers, before mock-ups",
        finding: "The system window itself cannot be changed, but the screen before it can. So every request got a screen with an explanation before it, and the order became the same on both platforms.",
      },
      {
        kind: "Store promise check",
        title: "What people were promised",
        question: "Does the first screen back up what the app's store page says?",
        sample: "Marketing and the app's store listing",
        finding: "The store promises \"we block spam\". The first screen asked for access straight away and gave nothing back. The block counters close that gap right during the setup.",
      },
      {
        kind: "Two versions compared",
        title: "A plain setup against a setup with a meter",
        question: "Which version gets more people to working protection?",
        sample: "Two onboarding versions with users, then metrics after release",
        finding: "The version with the meter and the counters won by a clear margin: more people made it to the end. After the update went out: +25% reaching protection and −30% refusals.",
      },
    ],
    funnel: {
      title: "The path from install to working protection. Red marks the steps where people left.",
      steps: [
        { label: "Install from the store", note: "The store page promises: \"we block spam\"" },
        { label: "First screen", note: "It used to ask for access straight away" },
        { label: "System window: calls", note: "Dry and scary. The hand reaches for \"Don't Allow\" by itself", drop: true },
        { label: "System window: messages and SMS filter", note: "No idea how many steps are left", drop: true },
        { label: "Protection switched on", note: "Not everyone who installed the app got here" },
      ],
      note: "I have no percentages for each step. I show only the overall result after the update went out.",
    },
    hypotheses: {
      intro: "Version 1: system windows back to back, each with a short caption. Version 2: a protection level meter, block counters and a screen with an explanation before each request.",
      items: [
        { text: "I want to know why the app needs my calls before I agree.", verdict: "Version 2", won: true },
        { text: "I want to see that the access already does something. Right now it feels taken on credit.", verdict: "Version 2", won: true },
        { text: "I want to know how many steps are left until protection is ready.", verdict: "Version 2", won: true },
      ],
      measured: "We looked at whether a person reached working protection, at which system window people left, and how long the setup took.",
    },
  },
  decisions: {
    lead: "Every permission goes through the same three steps: explain, show the benefit, ask for access.",
    items: [
      {
        id: "level",
        title: "The protection level meter",
        found: "A person did not know how many windows were still ahead or why. The setup felt endless.",
        did: "I added a meter that works like a battery indicator. Every permission given raises the level and brings full protection closer.",
        effect: "You can see both the end of the road and the point of every step.",
        basis: "Funnel breakdown; hypothesis 03.",
        image: img("cases/stop-spam/01.webp", 1300, 2642, "Statistics: protection level at 90% and counters for what was blocked in 30 days", "device"),
      },
      {
        id: "counters",
        title: "Blocked-spam counters",
        found: "The app asked for access up front and gave nothing back right away.",
        did: "I put a counter next to each permission: this is how many calls and messages we will block. It is an estimate from the app's own data. We do not present it as a promise.",
        effect: "People give access more willingly when they see at once what it gets them.",
        basis: "Store promise check; hypothesis 02.",
      },
      {
        id: "why",
        title: "Every permission comes with an explanation",
        found: "The system window is dry and scary. A person does not see why an app wants their calls and messages, and the hand reaches for \"Don't Allow\" by itself.",
        did: "Before each system window I put a short \"why we need this\" screen. It is written in everyday words, with no official phrasing and no fine print.",
        effect: "Less anxiety, and fewer people refuse without reading.",
        basis: "Engineering interviews: only the screen before the window can change; hypothesis 01.",
      },
      {
        id: "rhythm",
        title: "The same order on both platforms",
        found: "iOS and Android handle permissions differently, and the windows come in a different order.",
        did: "I made one and the same order for every permission and a shared look for the meter. A new permission is added the same way.",
        effect: "The setup reads as one story, and no longer as a string of random windows.",
      },
    ],
  },
  results: {
    lead: "The boring screen paid off.",
    points: [
      "A quarter more people now reach working protection, mostly thanks to the meter and the block counters",
      "Refusals when the app asks for access went down by 30%",
      "In a test with people the setup was rated 4.5 out of 5 for clarity",
      "One and the same setup works on two very different platforms",
    ],
    honesty: "+25% reaching protection and −30% refusals are counted from the app's data after the update went out. The clarity rating comes from a test with people. It was not measured in the live app.",
  },
  roadmap: [
    { kicker: "Mechanic", title: "Rewards for protection", text: "Badges and levels for blocked spam. The setup flows into a habit of using the app." },
    { kicker: "Personalisation", title: "Prompts at the right moment", text: "Suggest the next permission at the moment it will be most useful. Today everything is asked at once on first launch." },
    { kicker: "Handoff", title: "Handoff to engineering", text: "The screens and all their states are drawn for both platforms." },
  ],
  takeaways: [
    "I compared the two versions of the setup by the numbers. Which one I liked more did not matter.",
    "Which system windows can be shown, and in what order, is worth asking the developers before the mock-ups.",
    "A counter next to the button was more convincing than any text that tries to persuade.",
  ],
  quote: "People give access more willingly when they see at once what it gets them.",
  gallery: [
    {
      kind: "stack",
      title: "Welcome, filter setup and protection statistics",
      images: [
        img(F + "spam-welcome.png", 402, 874, "First screen: what the app is good for comes first, requests for access come after", "hero"),
        img("cases/stop-spam/01.webp", 1300, 2642, "Statistics: protection level and blocked-spam counters", "device"),
        img(F + "spam-sms-setup.png", 402, 874, "SMS filter setup laid out in five clear steps"),
      ],
    },
  ],
  deepDives: [],
};
