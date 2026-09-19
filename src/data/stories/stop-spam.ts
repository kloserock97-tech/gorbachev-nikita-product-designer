/* v41: рассказ кейса «Стоп-спам» на двух языках. Источник — Main cases/Stop-spam.html и EN/Stop-spam.en.html.
   Воронка показана без процентов по шагам: в кейсе есть только итог (+25 % / −30 %), шаговых цифр нет. */
import type { CaseStory, CaseImage } from "../caseStory";

const img = (src: string, w: number, h: number, caption: string, kind = "screen"): CaseImage => ({ src, w, h, caption, kind });
const F = "cases/figma/";

export const ru: CaseStory = {
  id: "stop-spam",
  hero: {
    kicker: "Антиспам-приложение · iOS · Android · 2026",
    title: "Стоп-спам",
    tagline: "Превратил самый скучный экран в игровой прогресс защиты.",
    summary:
      "Онбординг антиспама — это выдача критичных разрешений: доступ к звонкам, сообщениям, фильтрам. На этом экране люди отваливались, не дойдя до защиты. Я разложил разрешения по уровням защиты, добавил шкалу прогресса и счётчики заблокированного спама. Конверсия онбординга выросла на 25%, отказы на выдаче разрешений упали на 30%.",
    facts: [
      ["Роль", "UX/UI-дизайнер"],
      ["Команда", "Продукт и аналитика, разработка iOS и Android, маркетинг"],
      ["Срок", "2026"],
      ["Платформа", "iOS и Android"],
    ],
    tags: ["Мобайл", "Онбординг", "Геймификация", "B2C"],
  },
  kpis: [
    { value: "+25 %", label: "конверсия онбординга после релиза" },
    { value: "−30 %", label: "отказов на выдаче разрешений" },
    { value: "4,5 из 5", label: "понятность онбординга на пользовательском тесте" },
    { value: "2 платформы", label: "iOS и Android — единый онбординг" },
  ],
  context: {
    lead: "Между установкой и защитой стоял экран, который все ненавидят.",
    text:
      "Антиспам-приложение бесполезно без системных разрешений: не дашь доступ к звонкам и сообщениям — оно ничего не заблокирует. Но чтобы их выдать, пользователь проходит череду системных диалогов «Разрешить доступ к…», тревожных, непонятных и скучных. Приложение установили, а до работающей защиты не дошли.\n\nУговаривать нажать «Разрешить» покрасивее смысла не было. Нужно было объяснить, зачем каждое разрешение, и превратить обязательный шаг в понятный прогресс: что пользователь получает за каждый доступ.",
    team: [
      { who: "Продукт и аналитика", how: "Сверялись по метрикам воронки: где проседает конверсия и какие разрешения критичны для работы защиты." },
      { who: "Разработка iOS и Android", how: "Выяснил, какие системные диалоги можно вызывать и в каком порядке: что позволяет платформа, а что нет. Дешевле узнать до макетов, чем после." },
      { who: "Маркетинг и стор", how: "Договорились, что обещание из карточки приложения, «блокируем спам», онбординг подтверждает с первого экрана." },
    ],
    myRole:
      "Исследование точек отвала, редизайн последовательности экранов, механика «уровня защиты» и счётчиков, макеты и прототип под iOS и Android с учётом системных диалогов обеих платформ.",
  },
  research: {
    lead: "Сначала нашёл, на каких диалогах уходят, потом сравнил две версии онбординга по воронке.",
    methods: [
      {
        kind: "Разбор воронки",
        title: "Где люди уходят",
        question: "На каком шаге между установкой и включённой защитой теряется больше всего людей?",
        sample: "Воронка онбординга, вместе с продуктом и аналитикой",
        finding:
          "Отвал сидел на системных диалогах разрешений. Пользователь не понимал, сколько ещё диалогов впереди и зачем они, а выгоды за выданный доступ не получал сразу.",
      },
      {
        kind: "Интервью с разработкой",
        title: "Что разрешает платформа",
        question: "Какие системные диалоги можно вызывать, в каком порядке и что показать перед ними?",
        sample: "Разработчики iOS и Android, до макетов",
        finding: "Сам системный диалог изменить нельзя, но экран перед ним — можно. Отсюда экран-смысл перед каждым запросом и общий ритм на обе платформы.",
      },
      {
        kind: "Сверка с обещанием стора",
        title: "Что человеку пообещали",
        question: "Подтверждает ли первый экран то, что написано в карточке приложения?",
        sample: "Маркетинг и карточка приложения в сторе",
        finding: "В сторе обещают «блокируем спам», а первый экран просил доступы и ничего не давал взамен. Счётчики блокировок закрывают этот разрыв прямо в онбординге.",
      },
      {
        kind: "Сравнение двух версий",
        title: "Привычная против геймифицированной",
        question: "Какая версия доводит больше людей до включённой защиты?",
        sample: "Две версии онбординга на пользователях, затем метрики после релиза",
        finding: "Выиграла геймифицированная версия с ощутимым отрывом по доходимости до конца. После релиза: +25% к конверсии онбординга и −30% отказов.",
      },
    ],
    funnel: {
      title: "Путь от установки до включённой защиты. Красным — шаги, где терялись люди.",
      steps: [
        { label: "Установка из стора", note: "Обещание карточки: «блокируем спам»" },
        { label: "Первый экран", note: "Раньше — сразу просьба о доступах" },
        { label: "Системный диалог: звонки", note: "Сухой и пугающий, рефлекс — «Запретить»", drop: true },
        { label: "Системный диалог: сообщения и фильтр SMS", note: "Непонятно, сколько ещё шагов впереди", drop: true },
        { label: "Защита включена", note: "Сюда доходили не все, кто установил" },
      ],
      note: "Шаговых процентов в кейсе нет: публикую только итог по воронке после релиза.",
    },
    hypotheses: {
      intro: "Версия 1 — системные диалоги подряд с короткими подписями. Версия 2 — шкала уровня защиты, счётчики блокировок, экран-смысл перед каждым запросом.",
      items: [
        { text: "Хочу понимать, зачем приложению мои звонки, до того как соглашусь.", verdict: "Версия 2", won: true },
        { text: "Хочу видеть, что доступ уже что-то даёт, а не просто списан авансом.", verdict: "Версия 2", won: true },
        { text: "Хочу понимать, сколько ещё шагов осталось до готовой защиты.", verdict: "Версия 2", won: true },
      ],
      measured: "Конверсия онбординга (дошёл ли пользователь до включённой защиты), отвалы на каждом системном диалоге и время прохождения.",
    },
  },
  decisions: {
    lead: "Один ритм на каждое разрешение: объясни, покажи выгоду, запроси доступ.",
    items: [
      {
        id: "level",
        title: "Шкала «уровня защиты»",
        found: "Пользователь не понимал, сколько ещё диалогов впереди и зачем они. Процесс ощущался бесконечным и непрозрачным.",
        did: "Прогресс-шкала: каждое выданное разрешение поднимает уровень и приближает к «полной защите».",
        effect: "Виден и конец пути, и смысл каждого шага.",
        basis: "Разбор воронки; гипотеза 03.",
        image: img("cases/stop-spam/01.webp", 1300, 2642, "Статистика: уровень защиты 90% и счётчики заблокированного за 30 дней", "device"),
      },
      {
        id: "counters",
        title: "Счётчики заблокированного спама",
        found: "Разрешение просили авансом, не давая ничего взамен прямо сейчас.",
        did: "Рядом с каждым разрешением счётчик: столько звонков и сообщений заблокируем. Это прикидка по собственным данным приложения, а не обещание.",
        effect: "Доступ выдают охотнее, когда сразу видно, что он даёт.",
        basis: "Сверка с обещанием стора; гипотеза 02.",
      },
      {
        id: "why",
        title: "Каждое разрешение — со смыслом",
        found: "Системный диалог сухой и пугающий, а пользователь не понимает, зачем приложению его звонки и сообщения. Рефлекс — «Запретить».",
        did: "Перед каждым системным запросом короткий экран «зачем это нужно» на человеческом языке, без канцелярита и мелкого шрифта.",
        effect: "Меньше тревоги и рефлекторных отказов.",
        basis: "Интервью с разработкой: менять можно только экран перед диалогом; гипотеза 01.",
      },
      {
        id: "rhythm",
        title: "Единый ритм онбординга",
        found: "Две платформы с разными системами разрешений и разным порядком диалогов.",
        did: "Один паттерн на каждое разрешение и общий визуальный язык прогресса. Новое разрешение встраивается в ту же схему.",
        effect: "Онбординг читается как одна история.",
      },
    ],
  },
  results: {
    lead: "Скучный экран окупился конверсией.",
    points: [
      "До включённой защиты стало доходить на четверть больше людей, в основном благодаря шкале прогресса и счётчикам блокировок",
      "Отказов на выдаче разрешений стало меньше на 30%",
      "Понятность онбординга на пользовательском тесте — 4,5 из 5",
      "Один сценарий на две разные системы разрешений",
    ],
    honesty: "+25% к конверсии и −30% отказов получены на метриках онбординга после релиза. Оценка понятности взята с пользовательского теста, в проде её не мерили.",
  },
  roadmap: [
    { kicker: "Механика", title: "Достижения за защиту", text: "Бейджи и уровни за заблокированный спам: онбординг перетекает в удержание." },
    { kicker: "Персонализация", title: "Умные подсказки", text: "Предлагать следующее разрешение тогда, когда оно даст максимум пользы, а не всё скопом на старте." },
    { kicker: "Хендофф", title: "Передача в разработку", text: "Экраны и состояния отрисованы под обе платформы." },
  ],
  takeaways: [
    "Две версии онбординга я сравнивал по цифрам воронки, а не по тому, какая нравится больше.",
    "Какие системные диалоги можно вызывать и в каком порядке, стоит выяснить у разработки до макетов.",
    "Счётчик рядом с кнопкой убеждал лучше любого текста с уговорами.",
  ],
  quote: "Доступ выдают охотнее, когда сразу видно, что он даёт.",
  gallery: [
    {
      kind: "stack",
      title: "Знакомство, настройка фильтра и статистика защиты",
      images: [
        img(F + "spam-welcome.png", 402, 874, "Первый экран: ценность продукта до запроса системных разрешений", "hero"),
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
    tagline: "I turned the most boring screen into visible progress towards protection.",
    summary:
      "Onboarding for an anti-spam app means asking for critical permissions: access to calls, messages and filters. It was the screen where people dropped off before they ever got protected. I split the permissions into protection levels and added a progress meter and blocked-spam counters. Onboarding conversion went up 25%, drop-off at permission requests went down 30%.",
    facts: [
      ["Role", "UX/UI designer"],
      ["Team", "Product and analytics, iOS and Android engineering, marketing"],
      ["Timeline", "2026"],
      ["Platform", "iOS and Android"],
    ],
    tags: ["Mobile", "Onboarding", "Gamification", "B2C"],
  },
  kpis: [
    { value: "+25%", label: "onboarding conversion after release" },
    { value: "−30%", label: "drop-off at permission requests" },
    { value: "4.5 of 5", label: "onboarding clarity in user testing" },
    { value: "2 platforms", label: "iOS and Android, one onboarding" },
  ],
  context: {
    lead: "Between install and protection sat the screen everyone hates.",
    text:
      "An anti-spam app is useless without system permissions: no access to calls and messages, nothing gets blocked. But to grant them, the user clicks through a series of \"Allow access to…\" system dialogs that are alarming, confusing and dull. People installed the app and never reached working protection.\n\nMaking \"please tap Allow\" prettier was pointless. The job was to explain why each permission matters and turn a mandatory step into clear progress: what the user gets for each access they grant.",
    team: [
      { who: "Product and analytics", how: "We aligned on funnel metrics: where exactly conversion sagged and which permissions protection cannot work without." },
      { who: "iOS and Android engineering", how: "I found out which system dialogs we could trigger and in what order: what each platform allows and what it does not. Cheaper to learn before the mock-ups than after." },
      { who: "Marketing and app stores", how: "We agreed that onboarding has to deliver on the store listing's promise, \"we block spam\", on the very first screen." },
    ],
    myRole:
      "Drop-off research, a rebuilt screen flow, the protection level and counter mechanics, mock-ups and a prototype for iOS and Android that work around each platform's system dialogs.",
  },
  research: {
    lead: "First I found which dialogs made people leave, then compared two onboarding versions on the funnel.",
    methods: [
      {
        kind: "Funnel breakdown",
        title: "Where people leave",
        question: "Which step between install and protection switched on loses the most people?",
        sample: "The onboarding funnel, together with product and analytics",
        finding:
          "The drop-off sat on the system permission dialogs. Users had no idea how many dialogs were left or why they were there, and got nothing back right away for the access they granted.",
      },
      {
        kind: "Engineering interviews",
        title: "What the platform allows",
        question: "Which system dialogs can we trigger, in what order, and what can we show before them?",
        sample: "iOS and Android developers, before mock-ups",
        finding: "The system dialog itself cannot be changed, but the screen before it can. Hence a \"why\" screen before every request and one rhythm for both platforms.",
      },
      {
        kind: "Store promise check",
        title: "What people were promised",
        question: "Does the first screen deliver on what the store listing says?",
        sample: "Marketing and the app's store listing",
        finding: "The store says \"we block spam\", while the first screen asked for access and gave nothing back. Block counters close that gap right inside onboarding.",
      },
      {
        kind: "Two versions compared",
        title: "Familiar versus gamified",
        question: "Which version gets more people to protection switched on?",
        sample: "Two onboarding versions with users, then metrics after release",
        finding: "The gamified version won with a clear lead in how many people made it to the end. After release: +25% onboarding conversion and −30% drop-off.",
      },
    ],
    funnel: {
      title: "The path from install to protection switched on. Red marks the steps where people were lost.",
      steps: [
        { label: "Install from the store", note: "The listing's promise: \"we block spam\"" },
        { label: "First screen", note: "Used to ask for access straight away" },
        { label: "System dialog: calls", note: "Dry and scary, the reflex is \"Don't Allow\"", drop: true },
        { label: "System dialog: messages and SMS filter", note: "No idea how many steps are left", drop: true },
        { label: "Protection switched on", note: "Not everyone who installed got here" },
      ],
      note: "The case has no per-step percentages: I publish only the overall funnel result after release.",
    },
    hypotheses: {
      intro: "Version 1: system dialogs back to back with short captions. Version 2: a protection level meter, block counters and a \"why\" screen before each request.",
      items: [
        { text: "I want to know why the app needs my calls before I agree.", verdict: "Version 2", won: true },
        { text: "I want to see that the access already does something, not that it is just taken up front.", verdict: "Version 2", won: true },
        { text: "I want to know how many steps are left until I'm protected.", verdict: "Version 2", won: true },
      ],
      measured: "Onboarding conversion (did the user reach protection switched on), drop-off at each system dialog and time to complete.",
    },
  },
  decisions: {
    lead: "One rhythm for every permission: explain, show the benefit, request access.",
    items: [
      {
        id: "level",
        title: "The protection level meter",
        found: "Users had no idea how many dialogs were left or why they were there. The process felt endless and opaque.",
        did: "A progress meter: every permission granted raises the level and brings you closer to full protection.",
        effect: "You can see the finish line and the point of every step.",
        basis: "Funnel breakdown; hypothesis 03.",
        image: img("cases/stop-spam/01.webp", 1300, 2642, "Statistics: protection level at 90% and counters for what was blocked in 30 days", "device"),
      },
      {
        id: "counters",
        title: "Blocked-spam counters",
        found: "The app asked for permissions up front and gave nothing back right away.",
        did: "Next to each permission, a counter: this is how many calls and messages we will block. It is an estimate based on the app's own data, not a promise.",
        effect: "People grant access more willingly when they see what it gets them.",
        basis: "Store promise check; hypothesis 02.",
      },
      {
        id: "why",
        title: "Every permission explains itself",
        found: "The system dialog is dry and scary, and users do not get why an app wants their calls and messages. The reflex is \"Don't Allow\".",
        did: "Before each system prompt, a short \"why we need this\" screen in plain language, without legalese or fine print.",
        effect: "Less anxiety and fewer reflexive refusals.",
        basis: "Engineering interviews: only the screen before the dialog can change; hypothesis 01.",
      },
      {
        id: "rhythm",
        title: "One onboarding rhythm",
        found: "Two platforms with different permission systems and a different order of dialogs.",
        did: "One pattern for every permission and a shared visual language for progress. A new permission slots into the same pattern.",
        effect: "Onboarding reads as one story.",
      },
    ],
  },
  results: {
    lead: "The boring screen paid off in conversion.",
    points: [
      "A quarter more people reached protection switched on, mostly thanks to the progress meter and block counters",
      "Drop-off at permission requests went down by 30%",
      "Onboarding clarity in user testing: 4.5 out of 5",
      "One flow for two very different permission systems",
    ],
    honesty: "+25% conversion and −30% drop-off are onboarding metrics after release. The clarity rating comes from user testing, not production.",
  },
  roadmap: [
    { kicker: "Mechanic", title: "Protection achievements", text: "Badges and levels for blocked spam: onboarding flows into retention." },
    { kicker: "Personalisation", title: "Smart prompts", text: "Suggest the next permission when it will be most useful, instead of asking for all of them at launch." },
    { kicker: "Handoff", title: "Handoff to engineering", text: "Screens and states are designed for both platforms." },
  ],
  takeaways: [
    "I compared the two onboarding versions on funnel numbers, not on which one I liked more.",
    "Which system dialogs can be triggered, and in what order, is worth asking engineering before the mock-ups.",
    "A counter next to the button was more convincing than any persuasive copy.",
  ],
  quote: "People grant access more willingly when they see what it gets them.",
  gallery: [
    {
      kind: "stack",
      title: "Welcome, filter setup and protection statistics",
      images: [
        img(F + "spam-welcome.png", 402, 874, "First screen: the product's value before any system permission request", "hero"),
        img("cases/stop-spam/01.webp", 1300, 2642, "Statistics: protection level and blocked-spam counters", "device"),
        img(F + "spam-sms-setup.png", 402, 874, "SMS filter setup laid out in five clear steps"),
      ],
    },
  ],
  deepDives: [],
};
