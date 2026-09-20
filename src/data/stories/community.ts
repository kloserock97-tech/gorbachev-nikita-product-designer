/* v41: рассказ кейса «Сообщество» на двух языках. Источник — Main cases/Community.html и EN/Community.en.html.
   Таблицу конкурентов даём картинкой из кейса: отметок по ячейкам в тексте нет, и досочинять их нельзя.
   v56: тексты переписаны простым языком. Факты и цифры те же; термин остаётся в скобках после объяснения. */
import type { CaseStory, CaseImage } from "../caseStory";

const img = (src: string, w: number, h: number, caption: string, kind = "screen"): CaseImage => ({ src, w, h, caption, kind });
const C = "cases/community/";

export const ru: CaseStory = {
  id: "community",
  hero: {
    kicker: "Веб-платформа · Mos.ru · 2024",
    title: "Сообщество",
    tagline: "Придумал и довёл до запуска сайт, где москвичи рассказывают истории о городе: stories.mos.ru.",
    summary:
      "За два года в Москве закрылись почти все издания про городскую жизнь, и жителям стало негде говорить о городе. Я сделал сайт, куда пишет и редакция, и сами жители, а каждый текст перед публикацией проверяет модератор. От пустого листа до первой рабочей версии прошло девять месяцев. За первые три месяца после запуска: 169,4 тыс. просмотров, с первой страницы уходит только каждый четвёртый (Bounce 26,25%), в опросе довольны 78,9% (CSI).",
    facts: [
      ["Роль", "Product/UX-дизайнер"],
      ["Компания", "Департамент информационных технологий Москвы (Mos.ru)"],
      ["Срок", "2024, девять месяцев до MVP"],
      ["Платформа", "Веб"],
    ],
    tags: ["GovTech", "B2C", "Дизайн-система", "Вывод MVP"],
  },
  kpis: [
    { value: "169,4 тыс.", label: "просмотров за первые три месяца" },
    { value: "26,25 %", label: "уходят с первой страницы. Трое из четырёх остаются читать" },
    { value: "78,9 %", label: "довольны сайтом по опросу (CSI)" },
    { value: "3:20", label: "в среднем проводят на сайте за один заход" },
  ],
  context: {
    lead: "Жителям стало негде говорить о своём городе.",
    text:
      "За два года закрылись многие издания про городскую жизнь. В новостях остались политика и экономика. У Москвы не осталось места, где житель может поучаствовать: рассказать свою историю, оставить комментарий, поспорить.\n\nПоэтому задачу я поставил так: вернуть людям желание участвовать. Сайт был только способом. Главная сложность: тексты приходят сразу из двух мест, от редакции и от жителей, и каждый надо проверить перед публикацией.",
    team: [
      { who: "Заказчики и руководители", how: "До первого макета договорились, что именно строим: место, где жители участвуют в жизни города. Витрина новостей нам была не нужна. Из этой одной фразы выросло всё остальное. В первую версию вошли лента, истории и комментарии, а группы и события мы отложили. Оттуда же взялись цифры, на которые смотрели после запуска." },
      { who: "Редакция и модерация", how: "Сделал один путь публикации для двух источников. Статья редакции и история жителя попадают в одну очередь на проверку. У каждого текста виден статус, а при отказе автору пишут причину. Из этой очереди потом вырос отдельный кейс, «Кабинет модератора»." },
      { who: "Разработка", how: "Собрал свой набор готовых деталей интерфейса (дизайн-систему): кнопки, поля, карточки во всех состояниях. Он был отдельным от того, что уже использовал Mos.ru. Макеты отдавал частями, под каждый релиз. Дорогие идеи вроде умного поиска и подкастов отложил на потом, поэтому первая версия вышла раньше." },
    ],
    myRole:
      "Исследование и устройство сайта, дизайн и кликабельный прототип всей платформы, дизайн-система с нуля, доведение до первой версии и запуск.",
  },
  research: {
    lead: "Сначала выяснил, что люди считают обязательным в таких сервисах и где у всех слабые места.",
    methods: [
      {
        kind: "Конкурентный анализ",
        title: "Что есть у всех и чего почти ни у кого нет",
        question: "Без чего такой сайт не поймут, а чем можно выделиться?",
        sample: "Несколько главных конкурентов, одиннадцать функций",
        finding:
          "Написать пост и обсудить его в комментариях можно у всех. Это как касса в магазине: без неё магазин не работает. Зато «подписаться» и «отписаться» у конкурентов лежат на разных экранах, и люди путаются. Отсюда два решения: что будет главным на экране и что одно действие всегда выглядит одинаково.",
        image: img(C + "07.webp", 1600, 770, "Сравнение конкурентов по одиннадцати функциям: зелёным отмечено то, что есть у всех, красным то, чего рынку не хватает", "detail"),
      },
      {
        kind: "Портрет пользователя",
        title: "Для кого делаем",
        question: "Кто будет читать и писать, и что этим людям мешает сейчас?",
        sample: "Две целевые группы: 24–35 и 55+",
        finding:
          "Большинство участников оказались похожи на Олега: устали от потока новостей и хотят, чтобы нужное находилось без усилий. Часть людей теряется в сложных фильтрах и на экранах, где слишком много всего.",
      },
      {
        kind: "Эвристический разбор",
        title: "Доска исследования",
        question: "Где похожие сервисы сбивают человека с толку, и чего нам нельзя повторять?",
        sample: "Цели, конкуренты, справочная информация, эвристика, фидбек — на одной доске",
        finding:
          "Чаще всего повторяется одна ошибка: одно и то же действие в разных местах выглядит по-разному. Представьте, что выключатель света в каждой комнате висит на новой высоте. В «Сообществе» подписка, отписка и реакция везде устроены одинаково.",
      },
      {
        kind: "Юзабилити-прогоны",
        title: "Проверка прототипа на людях",
        question: "Получается ли у людей главное с первой попытки?",
        sample: "Десять участников",
        finding: "Подписаться и отписаться с первой попытки смогли девять человек из десяти.",
      },
      {
        kind: "Опрос удовлетворённости",
        title: "После запуска",
        question: "Довольны ли и молодые, и старшие? Не потеряли ли мы кого-то из-за простоты?",
        sample: "CSI на живом проекте stories.mos.ru",
        finding: "CSI 78,9%. Старшие оценили удобство навигации не ниже, чем молодые.",
      },
    ],
    persona: {
      name: "Олег",
      age: "30 лет",
      note: "Устал от потока новостей и хочет, чтобы нужное находилось без усилий. Таких, как Олег, в исследовании оказалось большинство.",
      pains: ["В новостях политика и экономика, про город почти ничего", "Сложные фильтры и экраны, на которых слишком много всего"],
      needs: ["Навигация, в которой нужное находится с первого клика", "Место, где можно не только читать, но и написать самому"],
    },
  },
  decisions: {
    lead: "Четыре решения. У каждого есть наблюдение, из которого оно выросло.",
    items: [
      {
        id: "pattern",
        title: "Одно действие выглядит одинаково везде",
        found: "У конкурентов «подписаться» и «отписаться» лежат на разных экранах, и люди путаются.",
        did: "Сделал так, что действие на любой странице находится в одном месте и работает одинаково.",
        effect: "На проверке с людьми подписаться и отписаться с первой попытки смогли девять участников из десяти.",
        basis: "Конкурентный анализ и эвристический разбор.",
      },
      {
        id: "posts",
        title: "Главное на экране: написать и обсудить",
        found: "Люди приходят в такие сервисы, чтобы написать пост и обсудить его в комментариях. Остальное вторично.",
        did: "Построил интерфейс вокруг этих двух действий.",
        effect: "Первые истории жителей пришли в первую неделю после запуска. За три месяца проверку прошли 250+ историй, под материалами набралось около трёх тысяч комментариев.",
        basis: "Конкурентный анализ: посты и комментарии есть у каждого сервиса из сравнения по одиннадцати функциям.",
        image: img(C + "03.webp", 733, 722, "Форма «Расскажите свою историю»: заголовок, текст, до десяти изображений, и история уходит на проверку"),
      },
      {
        id: "older",
        title: "Удобно и тем, кому за 55",
        found: "Часть людей теряется в сложных фильтрах и на экранах, где слишком много всего.",
        did: "Убрал лишнее, добавил подсказки и всплывающие пояснения, написал тексты простыми словами, оставил только привычные жесты.",
        effect: "На сайте остались обе возрастные группы. В опросе старшие оценили удобство навигации не ниже, чем молодые.",
        basis: "Портрет пользователя и опрос CSI.",
      },
      {
        id: "ds",
        title: "Оформление под долгое чтение",
        found: "Это сайт с длинными текстами. Читать его будут долго, в том числе люди 55+.",
        did: "Взял шрифт Golos Text: он сделан для экранов и остаётся разборчивым даже мелким. Контраст спокойный, глаза не устают на длинных текстах, и для городского проекта это уместно. Чёрный цвет вызывает доверие, нежно-розовый (#FFECF9) добавляет лёгкости.",
        effect: "Интерфейс получился спокойным и ровным, в нём удобно читать долго. Поэтому мало кто уходит с первой страницы, а оценка в опросе высокая.",
        image: img(C + "06.webp", 1600, 1598, "Размеры текста под длинное чтение: от главного заголовка до подписей", "detail"),
      },
    ],
  },
  results: {
    lead: "Первые три месяца после запуска.",
    points: [
      "169,4 тыс. просмотров с нуля. Для нового городского сайта это хороший старт",
      "Bounce Rate 26,25%: трое из четырёх остаются и читают",
      "В среднем 3 мин 20 с за один заход. За это время человек дочитывает один-два материала",
      "250+ историй жителей и около трёх тысяч комментариев. Примерно каждый четвёртый читатель возвращается в течение недели",
      "Сайтом пользуются обе группы, на которые мы рассчитывали: 24–35 и 55+",
    ],
    honesty: "Цифры приличные, и сайту есть куда расти.",
  },
  roadmap: [
    { kicker: "Формат", title: "Подкасты", text: "Истории можно будет слушать в дороге или за домашними делами. Голос передаёт эмоции лучше текста, а расшифровки приводят людей из поиска." },
    { kicker: "Поиск", title: "Поиск, который собирает всё по теме", text: "Житель ищет «ремонт дорог» и видит сразу всё: новости, обсуждения соседей, планы администрации и инструкцию, как подать заявку." },
    { kicker: "Удержание", title: "Профиль с наградами", text: "Активность, значки, рейтинги: от «Перфекциониста» за заполненный профиль до «Гуру контента» за десять историй." },
  ],
  takeaways: [
    "Дорогие идеи вроде умного поиска и подкастов я отложил на потом, и первая версия вышла раньше.",
    "О цели стоит договориться до первого макета. Из фразы «место, где жители участвуют» выросли и состав первой версии, и цифры, по которым мы оценивали успех.",
  ],
  quote: "Сайт был способом. Задача была в том, чтобы жители снова захотели участвовать в жизни города.",
  gallery: [
    {
      kind: "spot",
      title: "Лента первой версии: редакция и жители в одном потоке",
      image: img(C + "01.webp", 1473, 806, "Лента первой версии: статьи редакции и истории жителей в одном потоке", "hero"),
      spots: [
        { x: 50, y: 12.4, text: "Рубрики стоят одной строкой. Разбираться в панели фильтров не нужно", decision: "older" },
        { x: 20.5, y: 44, text: "Комментарии и «поделиться» есть на каждой карточке", decision: "posts" },
        { x: 51.8, y: 58.3, text: "Одно и то же действие выглядит одинаково везде", decision: "pattern" },
      ],
    },
    {
      kind: "bento",
      title: "Экраны первой версии",
      images: [
        img(C + "02.webp", 1600, 794, "Страница истории: теги, авторы и похожие материалы под рукой"),
        img(C + "04.webp", 1338, 806, "Страница «О проекте»: зачем сайт нужен, и фирменная бегущая строка"),
        img(C + "05.webp", 1105, 788, "Обратная связь: вопрос в поддержку и идея отправляются из одного окна, соцсети рядом"),
      ],
    },
  ],
  deepDives: [],
};

export const en: CaseStory = {
  id: "community",
  hero: {
    kicker: "Web platform · Mos.ru · 2024",
    title: "Community",
    tagline: "I designed and launched a site where Muscovites tell stories about their city: stories.mos.ru.",
    summary:
      "In two years almost every outlet that wrote about city life in Moscow had shut down, and residents had nowhere left to talk about their city. I built a site for Mos.ru, the Moscow city services portal, where both the editorial team and residents write, and a moderator checks every piece before it goes live. It took nine months from a blank page to the first working version. The first three months after launch: 169.4K views, only one visitor in four leaves from the first page (26.25% bounce rate), and 78.9% are happy in the survey (CSI).",
    facts: [
      ["Role", "Product/UX designer"],
      ["Company", "Moscow Department of Information Technology (Mos.ru)"],
      ["Timeline", "2024, nine months to MVP"],
      ["Platform", "Web"],
    ],
    tags: ["GovTech", "B2C", "Design system", "MVP launch"],
  },
  kpis: [
    { value: "169.4K", label: "views in the first three months" },
    { value: "26.25%", label: "leave from the first page. Three out of four stay to read" },
    { value: "78.9%", label: "are happy with the site in the survey (CSI)" },
    { value: "3:20", label: "spent on the site per visit, on average" },
  ],
  context: {
    lead: "Residents had nowhere left to talk about their city.",
    text:
      "Over two years many outlets that wrote about city life closed down. The news was left with politics and economics. Moscow had no place where a resident could take part: tell a story, leave a comment, argue.\n\nSo I framed the job like this: make people want to take part again. The website was only the means. The hard part: texts come from two places at once, the editorial team and the residents, and every one of them has to be checked before it is published.",
    team: [
      { who: "Clients and managers", how: "Before the first mock-up we agreed on what we were building: a place where residents take part in city life. We did not need a news shop window. Everything else grew out of that one phrase. The first version got a feed, stories and comments, while groups and events had to wait. The numbers we watched after launch came from the same phrase." },
      { who: "Editorial and moderation", how: "I made one publishing path for two sources. An editorial piece and a resident's story land in the same review queue. Every text shows its status, and when one is rejected the author gets the reason. That queue later grew into a case of its own, the Moderator Dashboard." },
      { who: "Engineering", how: "I built our own kit of ready-made interface parts (a design system): buttons, fields and cards in every state. It was separate from the one Mos.ru already used. I handed off mock-ups in parts, one release at a time. The expensive ideas like smart search and podcasts were put off, so the first version shipped sooner." },
    ],
    myRole:
      "Research and the structure of the site, design and a clickable prototype of the whole platform, a design system from scratch, taking the product to its first version and launching it.",
  },
  research: {
    lead: "First I found out what people expect from services like this and where all of them are weak.",
    methods: [
      {
        kind: "Competitor analysis",
        title: "What everyone has and what almost nobody has",
        question: "What does a site like this need to make sense at all, and where can it stand out?",
        sample: "A handful of key competitors, eleven features",
        finding:
          "Everyone lets you write a post and discuss it in the comments. It is like a till in a shop: without one the shop does not work. But competitors keep follow and unfollow on different screens, and people get lost. That gave two decisions: what sits at the centre of the screen, and that one action always looks the same.",
        image: img(C + "07.webp", 1600, 770, "Competitors compared on eleven features: green for what everyone has, red for what the market lacks", "detail"),
      },
      {
        kind: "User portrait",
        title: "Who we design for",
        question: "Who will read and write, and what gets in their way today?",
        sample: "Two target groups: 24 to 35 and 55+",
        finding:
          "Most people in the research were a bit like Oleg: tired of the stream of news and wanting to find things without effort. Some people get lost in complex filters and on screens with too much going on.",
      },
      {
        kind: "Heuristic review",
        title: "The research board",
        question: "Where do similar services confuse people, and what should we not repeat?",
        sample: "Goals, competitors, reference info, heuristics and feedback on one board",
        finding:
          "One mistake comes up again and again: the same action looks different in different places. Imagine a light switch hanging at a new height in every room. In Community, follow, unfollow and reactions work the same way everywhere.",
      },
      {
        kind: "Usability runs",
        title: "Testing the prototype with people",
        question: "Do people manage the main things on the first try?",
        sample: "Ten participants",
        finding: "Nine out of ten people managed to follow and unfollow on the first try.",
      },
      {
        kind: "Satisfaction survey",
        title: "After launch",
        question: "Are both the younger and the older readers happy? Did keeping things simple lose anyone?",
        sample: "CSI on the live project, stories.mos.ru",
        finding: "CSI 78.9%. Older readers rated navigation as easy as younger ones did.",
      },
    ],
    persona: {
      name: "Oleg",
      age: "30",
      note: "Tired of the stream of news and wants to find things without effort. Most people in the research were a bit like Oleg.",
      pains: ["The news is politics and economics, with almost nothing about the city", "Complex filters and screens with too much going on"],
      needs: ["Navigation where you find what you need on the first click", "A place where you can write as well as read"],
    },
  },
  decisions: {
    lead: "Four decisions. Each one grew out of something I noticed.",
    items: [
      {
        id: "pattern",
        title: "One action looks the same everywhere",
        found: "Competitors keep follow and unfollow on different screens, and people get lost.",
        did: "On every page the action now sits in the same place and works the same way.",
        effect: "When we tested with people, nine out of ten participants followed and unfollowed on the first try.",
        basis: "Competitor analysis and the heuristic review.",
      },
      {
        id: "posts",
        title: "The centre of the screen: write and discuss",
        found: "People come to services like this to write a post and discuss it in the comments. The rest is secondary.",
        did: "Built the interface around those two actions.",
        effect: "The first residents' stories arrived in week one. In three months 250+ stories passed the review, with about 3K comments under the pieces.",
        basis: "Competitor analysis: every service in the eleven-feature comparison has posts and comments.",
        image: img(C + "03.webp", 733, 722, "The \"Tell your story\" form: title, text, up to ten images, and off it goes to review"),
      },
      {
        id: "older",
        title: "Easy for people over 55 too",
        found: "Some people get lost in complex filters and on screens with too much going on.",
        did: "I removed the extras, added hints and pop-up explanations, wrote the texts in plain words and kept only familiar gestures.",
        effect: "Both age groups stayed on the site. In the survey older readers rated navigation as easy as younger ones did.",
        basis: "The user portrait and the CSI survey.",
      },
      {
        id: "ds",
        title: "A look made for long reading",
        found: "This is a site of long texts. People will read it for a long time, including people over 55.",
        did: "I chose the Golos Text typeface: it is made for screens and stays legible even when small. The contrast is calm, so eyes do not tire on long texts, and that suits a city project. Black builds trust, and a soft pink (#FFECF9) adds lightness.",
        effect: "The interface came out calm and even, comfortable to read for a long time. That is why few people leave from the first page and the survey score is high.",
        image: img(C + "06.webp", 1600, 1598, "Text sizes for long reading: from the main heading down to captions", "detail"),
      },
    ],
  },
  results: {
    lead: "The first three months after launch.",
    points: [
      "169.4K views from zero. A good start for a brand-new city site",
      "Bounce rate 26.25%: three out of four stay and read",
      "3 min 20 s per visit on average. In that time a person finishes one or two pieces",
      "250+ residents' stories and about 3K comments. Roughly one reader in four comes back within a week",
      "Both groups we counted on use the site: 24 to 35 and 55+",
    ],
    honesty: "The numbers are decent, and the site has room to grow.",
  },
  roadmap: [
    { kicker: "Format", title: "Podcasts", text: "People will be able to listen to stories on the go or while doing chores. A voice carries emotion better than text, and transcripts bring people in from search." },
    { kicker: "Search", title: "Search that gathers everything on a topic", text: "A resident searches for \"road repairs\" and sees it all at once: news, neighbours' discussions, the city's plans and a how-to for filing a request." },
    { kicker: "Retention", title: "A profile with rewards", text: "Activity, badges, ratings: from \"Perfectionist\" for a completed profile to \"Content Guru\" for ten stories." },
  ],
  takeaways: [
    "I put off the expensive ideas like smart search and podcasts, and the first version shipped sooner.",
    "Agree on the goal before the first mock-up. The phrase \"a place where residents take part\" gave us both the contents of the first version and the numbers we judged success by.",
  ],
  quote: "The website was the means. The job was to make residents want to take part in city life again.",
  gallery: [
    {
      kind: "spot",
      title: "First-version feed: editorial and residents in one stream",
      image: img(C + "01.webp", 1473, 806, "First-version feed: editorial pieces and residents' stories in one stream", "hero"),
      spots: [
        { x: 50, y: 12.4, text: "Topics sit in one row. Nobody has to figure out a filter panel", decision: "older" },
        { x: 20.5, y: 44, text: "Comments and share on every card", decision: "posts" },
        { x: 51.8, y: 58.3, text: "The same action looks the same everywhere", decision: "pattern" },
      ],
    },
    {
      kind: "bento",
      title: "First-version screens",
      images: [
        img(C + "02.webp", 1600, 794, "Story page: tags, authors and related pieces close at hand"),
        img(C + "04.webp", 1338, 806, "\"About\" page: why the site exists, and the product's signature ticker"),
        img(C + "05.webp", 1105, 788, "Feedback: a support question and an idea go out from one window, socials right next to them"),
      ],
    },
  ],
  deepDives: [],
};
