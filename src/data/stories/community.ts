/* v41: рассказ кейса «Сообщество» на двух языках. Источник — Main cases/Community.html и EN/Community.en.html.
   Таблицу конкурентов даём картинкой из кейса: отметок по ячейкам в тексте нет, и досочинять их нельзя. */
import type { CaseStory, CaseImage } from "../caseStory";

const img = (src: string, w: number, h: number, caption: string, kind = "screen"): CaseImage => ({ src, w, h, caption, kind });
const C = "cases/community/";

export const ru: CaseStory = {
  id: "community",
  hero: {
    kicker: "Веб-платформа · Mos.ru · 2024",
    title: "Сообщество",
    tagline: "Спроектировал платформу историй Москвы и вывел её в прод: stories.mos.ru.",
    summary:
      "За два года в городе закрылись лайфстайл-медиа, и вовлекать жителей стало нечем. Я собрал продукт с пользовательским контентом и модерацией: с нуля до MVP за девять месяцев. Первые три месяца после запуска — 169,4 тыс. просмотров, Bounce 26,25%, CSI 78,9%.",
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
    { value: "26,25 %", label: "Bounce Rate: трое из четырёх остаются читать" },
    { value: "78,9 %", label: "CSI, индекс удовлетворённости" },
    { value: "3:20", label: "среднее время на сайте за визит" },
  ],
  context: {
    lead: "Город терял площадку для голоса жителей.",
    text:
      "За два года закрылись многие лайфстайл и городские медиа. В инфополе остались политика и экономика. У Москвы не осталось места, где житель может участвовать: делится историей, комментирует, спорит.\n\nЗадачу я сформулировал как «поднять вовлечённость». Сайт был только средством. Сложность в том, что контент идёт из двух источников сразу, от редакции и от пользователей, и весь проходит модерацию.",
    team: [
      { who: "Стейкхолдеры", how: "Выровнял цели на старте: делаем место, где жители участвуют в жизни города, а не витрину новостей. Из этого выросли скоуп MVP (лента, истории, комментарии, без групп и событий) и метрики, на которые смотрели после запуска." },
      { who: "Редакция и модерация", how: "Один поток публикации на два источника: материалы редакции и истории жителей идут через общую очередь модерации со статусами и причинами отклонения. Этот контур позже вырос в кейс «Кабинет модератора»." },
      { who: "Разработка", how: "Дизайн-система с состояниями компонентов появилась отдельно от той, что уже применялась в Mos.ru. Макеты сдавал поэтапно под релизы, а дорогие идеи вроде поиска со связями и подкастов уехали в бэклог, поэтому MVP вышел раньше." },
    ],
    myRole:
      "Исследование и архитектура, UX/UI и прототип всей платформы, дизайн-система с нуля, доведение до MVP и вывод в прод.",
  },
  research: {
    lead: "Сначала выяснил, что у рынка считается базой и где у него дыры.",
    methods: [
      {
        kind: "Конкурентный анализ",
        title: "Что для людей база, а где рынок не дотягивает",
        question: "Какие функции есть у всех, а какие почти ни у кого?",
        sample: "Несколько главных конкурентов, одиннадцать функций",
        finding:
          "Посты и комментарии есть у всех: это базовый драйвер взаимодействия, без него продукт не поймут. Подписка и отписка у конкурентов живут на разных экранах, и пользователь путается. Это стало двумя решениями: ядро интерфейса и единый паттерн действий.",
        image: img(C + "07.webp", 1600, 770, "Сравнение конкурентов по одиннадцати функциям: зелёным отмечена база, красным точки роста рынка", "detail"),
      },
      {
        kind: "Портрет пользователя",
        title: "Для кого проектируем",
        question: "Кто будет читать и писать, и что им мешает в существующих сервисах?",
        sample: "Две целевые группы: 24–35 и 55+",
        finding:
          "Большинство в исследовании оказались похожи на Олега: устали от инфошума и хотят навигацию попроще. Часть аудитории плохо справляется со сложными фильтрами и перегруженным интерфейсом.",
      },
      {
        kind: "Эвристический разбор",
        title: "Доска исследования",
        question: "Где у похожих сервисов ломается логика и что из этого нельзя повторять?",
        sample: "Цели, конкуренты, справочная информация, эвристика, фидбек — на одной доске",
        finding:
          "Главная повторяющаяся проблема — одно и то же действие выглядит по-разному в разных местах. В «Сообществе» подписка, отписка и реакция работают одинаково везде.",
      },
      {
        kind: "Юзабилити-прогоны",
        title: "Проверка прототипа",
        question: "Выполняют ли люди ключевые действия с первого раза?",
        sample: "Десять участников",
        finding: "Подписку и отписку с первого раза выполнили девять участников из десяти.",
      },
      {
        kind: "Опрос удовлетворённости",
        title: "После запуска",
        question: "Довольны ли обе возрастные группы и не теряет ли простота кого-то из них?",
        sample: "CSI на живом проекте stories.mos.ru",
        finding: "CSI 78,9%. Старшая аудитория оценила простоту навигации не ниже молодой.",
      },
    ],
    persona: {
      name: "Олег",
      age: "30 лет",
      note: "Устал от инфошума, хочет навигацию попроще. Таких, как Олег, в исследовании оказалось большинство.",
      pains: ["В инфополе политика и экономика, про город почти ничего", "Сложные фильтры и перегруженные интерфейсы"],
      needs: ["Навигация, в которой нужное находится с первого клика", "Место, где можно не только читать, но и написать самому"],
    },
  },
  decisions: {
    lead: "Четыре решения, и у каждого есть находка, из которой оно выросло.",
    items: [
      {
        id: "pattern",
        title: "Единая логика действий",
        found: "У конкурентов подписка и отписка живут на разных экранах, и пользователь путается.",
        did: "Свёл действие в один предсказуемый паттерн по всей платформе.",
        effect: "На юзабилити-прогонах подписку и отписку выполняли с первого раза девять участников из десяти.",
        basis: "Конкурентный анализ и эвристический разбор.",
      },
      {
        id: "posts",
        title: "Ставка на посты и комментарии",
        found: "Возможность написать пост и обсудить его в комментариях — базовый драйвер взаимодействия в таких сервисах.",
        did: "Сделал это ядром интерфейса.",
        effect: "Первые истории жителей пришли в первую неделю после запуска. За три месяца модерацию прошли 250+ пользовательских историй, под материалами — около трёх тысяч комментариев.",
        basis: "Конкурентный анализ: посты и комментарии — база у всех одиннадцати функций сравнения.",
        image: img(C + "03.webp", 733, 722, "Форма «Расскажите свою историю»: заголовок, текст, до десяти изображений — и история уходит на модерацию"),
      },
      {
        id: "older",
        title: "Забота о старшей аудитории",
        found: "Часть людей плохо справляется со сложными фильтрами и перегруженным интерфейсом.",
        did: "Минимализм, подсказки и поп-апы, простой язык, привычные жесты.",
        effect: "Удержал внимание обеих возрастных групп: в опросе удовлетворённости старшая аудитория оценила простоту навигации не ниже молодой.",
        basis: "Портрет пользователя и опрос CSI.",
      },
      {
        id: "ds",
        title: "Дизайн-система под текстовый городской продукт",
        found: "Продукт про длинные тексты, и читать его будут долго, в том числе люди 55+.",
        did: "Golos Text сделан для экранов: читается в мелком кегле, спокойная контрастность не утомляет на лонгридах и уместна для госпроекта. Чёрный даёт доверие, нежный розовый акцент (#FFECF9) — лёгкость.",
        effect: "Спокойный и консистентный интерфейс, в котором комфортно долго читать. Отсюда низкий Bounce и высокий CSI.",
        image: img(C + "06.webp", 1600, 1598, "Типографическая шкала под лонгриды: от hero-заголовка до подписей", "detail"),
      },
    ],
  },
  results: {
    lead: "Первые три месяца после MVP.",
    points: [
      "169,4 тыс. просмотров с нуля, для нового городского продукта",
      "Bounce Rate 26,25%: люди остаются и читают",
      "В среднем 3 мин 20 с на визит: за сессию читают один-два материала целиком",
      "250+ историй жителей и около трёх тысяч комментариев; примерно каждый четвёртый читатель возвращается в течение недели",
      "Попал в обе целевые группы: 24–35 и 55+",
    ],
    honesty: "Показатели приличные, и сервису есть куда расти.",
  },
  roadmap: [
    { kicker: "Формат", title: "Подкасты", text: "Другой способ потреблять контент, в дороге или за делами. Голос добавляет эмоции, а расшифровки дают трафик из поиска." },
    { kicker: "Поиск", title: "Поиск со связями", text: "Житель ищет «ремонт дорог» и видит не только новости, но и обсуждения соседей, планы администрации и инструкцию, как подать заявку." },
    { kicker: "Удержание", title: "Профиль с геймификацией", text: "Активность, бейджи, рейтинги: от «Перфекциониста» за оформление профиля до «Гуру контента» за десять историй." },
  ],
  takeaways: [
    "Дорогие идеи вроде поиска со связями и подкастов я отложил в бэклог, и поэтому MVP вышел раньше.",
    "Цели со стейкхолдерами стоит выровнять до первого макета: из формулировки «место, где жители участвуют» выросли и скоуп, и метрики.",
  ],
  quote: "Я взял задачу не «нарисовать сайт», а поднять вовлечённость.",
  gallery: [
    {
      kind: "spot",
      title: "Лента пилота: редакция и жители в одном потоке",
      image: img(C + "01.webp", 1473, 806, "Лента пилота: редакционные статьи и пользовательские истории в одном потоке", "hero"),
      spots: [
        { x: 50, y: 12.4, text: "Рубрики стоят одной строкой, панель фильтров осваивать не нужно", decision: "older" },
        { x: 20.5, y: 44, text: "Комментарии и «поделиться» на каждой карточке", decision: "posts" },
        { x: 51.8, y: 58.3, text: "Одно и то же действие выглядит одинаково везде", decision: "pattern" },
      ],
    },
    {
      kind: "bento",
      title: "Экраны MVP",
      images: [
        img(C + "02.webp", 1600, 794, "Страница истории: теги, авторы и соседние материалы под рукой"),
        img(C + "04.webp", 1338, 806, "Страница «О проекте»: манифест и фирменная бегущая строка продукта"),
        img(C + "05.webp", 1105, 788, "Обратная связь: техподдержка и идеи в одном окне, соцсети рядом"),
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
    tagline: "Designed Moscow's city-stories platform and shipped it to production: stories.mos.ru.",
    summary:
      "In two years Moscow's lifestyle media had shut down one after another, and the city had nothing left to engage residents with. I built a product with user-generated content and moderation for Mos.ru, the Moscow city services portal: from zero to MVP in nine months. The first three months after launch: 169.4K views, 26.25% bounce rate, CSI 78.9%.",
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
    { value: "26.25%", label: "bounce rate: three out of four stay to read" },
    { value: "78.9%", label: "CSI, customer satisfaction index" },
    { value: "3:20", label: "average time on site per visit" },
  ],
  context: {
    lead: "The city was losing a place for residents' voices.",
    text:
      "Over two years many lifestyle and city media outlets closed down. What was left in the news was politics and economics. Moscow had no place where a resident could take part: share a story, comment, argue.\n\nI framed the job as \"raise engagement\"; the website was only the means. The catch: content comes from two sources at once, the editorial team and the users, and all of it goes through moderation.",
    team: [
      { who: "Stakeholders", how: "Aligned the goals at kick-off: we are building a place where residents take part in city life, not a news shop window. That set the MVP scope (feed, stories, comments; no groups or events) and the metrics we watched after launch." },
      { who: "Editorial and moderation", how: "One publishing flow for two sources: editorial pieces and residents' stories go through a shared moderation queue with statuses and rejection reasons. That loop later grew into the Moderator Dashboard case." },
      { who: "Engineering", how: "The design system, with every component state, was built separately from the one Mos.ru already used. I handed off mock-ups release by release, and the expensive ideas like connected search and podcasts went to the backlog, which is why the MVP shipped sooner." },
    ],
    myRole:
      "Research and architecture, UX/UI and the prototype for the whole platform, a design system from scratch, taking the product to MVP and shipping it to production.",
  },
  research: {
    lead: "First I found out what the market treats as basics and where it has gaps.",
    methods: [
      {
        kind: "Competitor analysis",
        title: "What people expect, and where the market falls short",
        question: "Which features does everyone have, and which does almost nobody have?",
        sample: "A handful of key competitors, eleven features",
        finding:
          "Everyone has posts and comments: that is the core engagement driver, and a product without it would not be understood. Competitors put follow and unfollow on different screens, and users get lost. Those became two decisions: the heart of the interface and one action pattern.",
        image: img(C + "07.webp", 1600, 770, "Competitors compared on eleven features: green for basics, red for where the market has room to grow", "detail"),
      },
      {
        kind: "User portrait",
        title: "Who we design for",
        question: "Who will read and write, and what gets in their way in existing services?",
        sample: "Two target groups: 24 to 35 and 55+",
        finding:
          "Most people in the research were a bit like Oleg: tired of information noise and wanting simpler navigation. Part of the audience struggles with complex filters and a crowded interface.",
      },
      {
        kind: "Heuristic review",
        title: "The research board",
        question: "Where does the logic of similar services break, and what should we not repeat?",
        sample: "Goals, competitors, reference info, heuristics and feedback on one board",
        finding:
          "The main recurring problem: the same action looks different in different places. In Community, follow, unfollow and reactions work the same way everywhere.",
      },
      {
        kind: "Usability runs",
        title: "Testing the prototype",
        question: "Do people complete the key actions on the first try?",
        sample: "Ten participants",
        finding: "Nine out of ten participants followed and unfollowed on the first try.",
      },
      {
        kind: "Satisfaction survey",
        title: "After launch",
        question: "Are both age groups happy, and does simplicity lose either of them?",
        sample: "CSI on the live project, stories.mos.ru",
        finding: "CSI 78.9%. The older audience rated navigation as easy as the younger one did.",
      },
    ],
    persona: {
      name: "Oleg",
      age: "30",
      note: "Tired of information noise, wants simpler navigation. Most people in the research were a bit like Oleg.",
      pains: ["The news is politics and economics, with almost nothing about the city", "Complex filters and crowded interfaces"],
      needs: ["Navigation where you find what you need on the first click", "A place where you can write, not just read"],
    },
  },
  decisions: {
    lead: "Four decisions, each grown out of a finding.",
    items: [
      {
        id: "pattern",
        title: "One logic for every action",
        found: "Competitors put follow and unfollow on different screens, and users get lost.",
        did: "Turned it into one predictable pattern across the whole platform.",
        effect: "In usability runs, nine out of ten participants followed and unfollowed on the first try.",
        basis: "Competitor analysis and the heuristic review.",
      },
      {
        id: "posts",
        title: "Betting on posts and comments",
        found: "Writing a post and discussing it in the comments is the core engagement driver in services like this.",
        did: "Made it the heart of the interface.",
        effect: "The first residents' stories arrived in week one. In three months 250+ user stories passed moderation, with about 3K comments under the pieces.",
        basis: "Competitor analysis: posts and comments are the baseline across all compared services.",
        image: img(C + "03.webp", 733, 722, "The \"Tell your story\" form: title, text, up to ten images, and off it goes to moderation"),
      },
      {
        id: "older",
        title: "Caring for the older audience",
        found: "Some people struggle with complex filters and a crowded interface.",
        did: "Minimalism, hints and pop-ups, plain language, familiar gestures.",
        effect: "Kept both age groups on board: in the satisfaction survey the older audience rated navigation as easy as the younger one did.",
        basis: "The user portrait and the CSI survey.",
      },
      {
        id: "ds",
        title: "A design system for a text-heavy city product",
        found: "The product is about long texts, and people will read it for a long time, including people over 55.",
        did: "Golos Text is made for screens: it reads well at small sizes, its calm contrast does not tire you on long reads, and it feels right for a public-sector project. Black builds trust, a soft pink accent (#FFECF9) adds lightness.",
        effect: "A calm, consistent interface that is comfortable to read for a long time. Hence the low bounce and high CSI.",
        image: img(C + "06.webp", 1600, 1598, "A type scale built for long reads: from the hero heading down to captions", "detail"),
      },
    ],
  },
  results: {
    lead: "The first three months after MVP.",
    points: [
      "169.4K views from zero, for a brand-new city product",
      "Bounce rate 26.25%: people stay and read",
      "3 min 20 s per visit on average: one or two pieces read in full per session",
      "250+ residents' stories and about 3K comments; roughly one reader in four comes back within a week",
      "Reached both target groups: 24 to 35 and 55+",
    ],
    honesty: "The numbers are decent and leave room to grow.",
  },
  roadmap: [
    { kicker: "Format", title: "Podcasts", text: "Another way to take in content, on the go or while doing chores. Voice adds emotion, and transcripts bring in search traffic." },
    { kicker: "Search", title: "Connected search", text: "A resident searches for \"road repairs\" and sees news, neighbours' discussions, the city's plans and a how-to for filing a request." },
    { kicker: "Retention", title: "Gamified profile", text: "Activity, badges, ratings: from \"Perfectionist\" for completing your profile to \"Content Guru\" for ten stories." },
  ],
  takeaways: [
    "I put the expensive ideas like connected search and podcasts in the backlog, and that is why the MVP shipped sooner.",
    "Align goals with stakeholders before the first mock-up: both the scope and the metrics grew out of the phrase \"a place where residents take part\".",
  ],
  quote: "I took the job as \"raise engagement\" rather than \"draw a website\".",
  gallery: [
    {
      kind: "spot",
      title: "Pilot feed: editorial and residents in one stream",
      image: img(C + "01.webp", 1473, 806, "Pilot feed: editorial pieces and user stories in one stream", "hero"),
      spots: [
        { x: 50, y: 12.4, text: "Topics sit in one row, so nobody has to learn a filter panel", decision: "older" },
        { x: 20.5, y: 44, text: "Comments and share on every card", decision: "posts" },
        { x: 51.8, y: 58.3, text: "The same action looks the same everywhere", decision: "pattern" },
      ],
    },
    {
      kind: "bento",
      title: "MVP screens",
      images: [
        img(C + "02.webp", 1600, 794, "Story page: tags, authors and related pieces close at hand"),
        img(C + "04.webp", 1338, 806, "\"About\" page: the manifesto and the product's signature ticker"),
        img(C + "05.webp", 1105, 788, "Feedback: tech support and ideas in one window, socials right next to them"),
      ],
    },
  ],
  deepDives: [],
};
