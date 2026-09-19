/* v41: рассказ кейса GRIF AI на двух языках. Источник — Main cases/Grif-AI.html и EN/Grif-AI.en.html.
   Разделы с пометкой «ждёт ответа владельца» на Tilda сюда не перенесены: публикуем только известное. */
import type { CaseStory, CaseImage } from "../caseStory";
import tracksRu from "../caseTracks.ru";
import tracksEn from "../caseTracks.en";

const img = (src: string, w: number, h: number, caption: string, kind = "screen"): CaseImage => ({ src, w, h, caption, kind });
const G = "cases/grif-ai/";

export const ru: CaseStory = {
  id: "grif-ai",
  hero: {
    kicker: "Проактивный ИИ-ассистент · продукт с нуля · 2026",
    title: "GRIF AI",
    tagline: "Собрал дизайн-функцию из ИИ-агентов: от пары экранов до Storybook.",
    summary:
      "На входе была идея, пара экранов и ни строчки кода. Продуктовый дизайн я вёл один, а рисовали, собирали и переносили в код агенты: Claude через MCP работал прямо в Figma, компоненты уезжали в репозиторий на GitHub, разработка брала их из Storybook и собирала страницы. За человеком остались точечные правки и докручивание, после которого макет начинает отвечать задаче.",
    facts: [
      ["Роль", "Лид продуктового дизайна"],
      ["Команда", "Агенты вместо дизайн-отдела; фронтенд и бэкенд — люди"],
      ["Срок", "2025–2026, сроки обговаривались под каждую задачу"],
      ["Платформа", "Веб, тёмная тема, RU / EN"],
    ],
    tags: ["AI", "Дизайн-система", "B2C", "Лидерство"],
  },
  kpis: [
    { value: "12", label: "страниц макета: чат, лента, память, источники, настройки, онбординг" },
    { value: "4", label: "правила соответствия, которые роняют сборку" },
    { value: "8", label: "решений интерфейса, каждое выведено из черты характера" },
    { value: "2", label: "контура проверки: пользователи и инвесторы" },
  ],
  context: {
    lead: "Идея, пара экранов и пустой репозиторий.",
    text:
      "GRIF — проактивный персональный ассистент. Он подключается к почте, мессенджерам, календарю и финансам, сам замечает, что нужно сделать, и приносит готовое действие. Пользователь не формулирует запрос, он подтверждает или отклоняет.\n\nЧат ждёт вопроса, и ответственность за формулировку лежит на человеке. Проактивный ассистент приходит первым, а значит каждое его появление тратит чужое внимание и обязано это оправдать. Из этого вырос весь дизайн: главный вопрос в том, когда система имеет право заговорить.",
    constraints: [
      { title: "Идея и небольшой драфт", text: "Продуктовая задумка словами и пара экранов — скорее иллюстрация мысли, чем макет." },
      { title: "Ни строчки кода", text: "Фронтенда не существовало, компонентов не существовало, репозиторий был пустой." },
      { title: "Ни дизайн-системы, ни токенов", text: "Ни цветовой шкалы, ни типографики, ни правил компоновки. Только эстетические пожелания." },
      { title: "Живая команда на бюджете", text: "Фронтенду и бэкенду надо было что-то отдавать регулярно и в понятном формате. Их время стоило денег, и простой стоил тоже." },
    ],
    myRole:
      "Лид продуктового дизайна. Дизайн-отдела не существовало, поэтому я выстроил команду из агентов и работал с ней как с людьми: ставил задачи, принимал результат, отправлял на переделку и отвечал за качество перед бизнесом. Сроки обговаривались отдельно под каждую задачу, поэтому каждая итерация заканчивалась чем-то, что можно отдать.",
  },
  approach: {
    lead: "Сначала описал характер, потом вывел из него интерфейс.",
    text:
      "Первым артефактом стало описание характера продукта. Причина практическая: когда исполнитель — агент, «сделай спокойно и премиально» не работает как задание. Агент хорошо исполняет правило и плохо угадывает вкус. Значит, вкус надо превратить в правила, иначе каждая итерация станет спором о том, что такое «спокойно».\n\nХарактер получил имя: Тихий стратег. Формула: «та часть твоего интеллекта, которая уже подумала, пока ты был занят». Он не паникует, говорит один раз, уважает молчание, а доверие зарабатывает точностью. Он не скажет «Отличный вопрос!», он скажет «Бриф к встрече с Сергеем готов. Открыть?».",
    rules: [
      { trait: "Не торопится", rule: "Переходы 120–200 мс, только opacity и цвет. Ни одного bounce, ни одного scale на кнопке." },
      { trait: "Говорит один раз", rule: "В поле внимания возникает одна связь между двумя точками, а не сеть линий. По одной догадке за раз." },
      { trait: "Молчание — сообщение", rule: "Нет спиннера и нет «печатает…». Вместо них строка состояния «Наблюдаю, сейчас тихо»." },
      { trait: "Доверие точностью", rule: "Под каждым ответом чипы источников, из которых он собран: «вот откуда я это взял»." },
      { trait: "Не шумит", rule: "Один синий акцент на экран, остальное — нейтральная шкала серого. Где синий, туда и смотреть." },
    ],
    refusals: [
      "Выбор модели и температуры. Ассистент, у которого надо настраивать мозг, перестаёт быть тем, кто уже подумал за тебя.",
      "Папки и проекты. Это перекладывание работы по наведению порядка обратно на пользователя.",
      "Голосовая активация словом-триггером. Тот, кто всегда слушает, не может уважать тишину.",
      "Индикатор «печатает…». Имитация человека там, где можно показать, что система сейчас читает.",
    ],
  },
  research: {
    lead: "Проверяли в двух контурах: на пользователях и на инвесторах.",
    methods: [
      {
        kind: "Тесты и интервью",
        title: "Обычный контур",
        question: "Понимает ли человек, что система делает сейчас, что она уже сделала и как это отменить?",
        sample: "Пользовательские тесты и интервью на готовых частях продукта",
        finding:
          "Доверие редко ломается на одной крупной ошибке. Чаще его подтачивает мелкая непонятность: откуда взял, что уже сделал, как отменить. Поэтому почти каждое решение интерфейса — про видимость и обратимость.",
      },
      {
        kind: "Конкурентный разбор",
        title: "Какие паттерны уже в привычке",
        question: "Что аудитория уже умеет после ChatGPT, Claude и Алисы, а где придётся учить?",
        sample: "ChatGPT, Claude, Алиса, соседние сервисы и чужие дизайн-файлы",
        finding:
          "Чат как точка входа привычен всем. Проактивная лента непривычна, и на первом экране она читается как ещё один входящий поток. Это решило, что главный экран — чат, а лента живёт рядом.",
      },
      {
        kind: "Прогон с инвесторами",
        title: "Редкий контур",
        question: "Объясняет ли интерфейс продукт человеку, который видит его впервые, за несколько минут?",
        sample: "Инвесторы проходили настоящие задачи в готовой части продукта",
        finding:
          "По итогам решали, продолжать ли сотрудничество. Удобство было только частью ответа. У интерфейса появилась вторая работа: дать выполнить задачу и за те же минуты предъявить логику продукта. Отсюда явные подписи «Собрал контекст — 4 источника» и «Без вашего подтверждения не отправлю».",
      },
      {
        kind: "Аудит консистентности",
        title: "Агент проверяет весь флоу",
        question: "Одинаково ли называются одни и те же вещи, везде ли есть ошибка и путь назад?",
        sample: "Весь сервисный флоу, отдельным заходом",
        finding:
          "Скучная работа, которую человек делает плохо на седьмом экране и не делает совсем на двадцатом. Агент прошёл флоу целиком и сверил названия, состояния ошибок и возвраты.",
      },
      {
        kind: "Аудит файла Figma",
        title: "Источник истины врал",
        question: "Совпадают ли заявленные стили с тем, что реально используется в макетах?",
        sample: "Кит на двенадцать страниц, прочитанный через MCP",
        finding:
          "Агент сверил заявленные стили с фактическим использованием и нашёл, что страница со светлой палитрой — остаток чужого шаблона. Это выяснилось на разборе файла, а не на вёрстке.",
      },
    ],
    hypotheses: {
      intro: "Три гипотезы о доверии, которые несли на оба контура. Формулировки — из решений интерфейса; цифр по ним в кейсе нет.",
      items: [
        { text: "Если в паузе видно, что система читает, человек меньше перепроверяет ответ.", verdict: "Пошаговое рассуждение" },
        { text: "Граница полномочий, написанная на карточке, снимает страх «ошибётся и уже отправит».", verdict: "Карточка действия" },
        { text: "Возможность отменить после отправки делает людей решительнее при подтверждении.", verdict: "Отмена и «Вернуть»" },
      ],
    },
  },
  decisions: {
    lead: "Под каждым решением лежит черта характера, которую можно назвать вслух. Продукт, который действует сам, живёт на доверии, поэтому почти все решения — про видимость и обратимость.",
    items: [
      {
        id: "chat-home",
        title: "Главный экран — чат, а не лента",
        found: "Лента проактивных карточек — самая заметная идея продукта, и соблазн сделать её витриной был сильный. Но лента отвечает на «что система заметила», а человек приходит с собственной задачей.",
        did: "Точка входа — чат: приветствие, поле ввода и три подсказки под типовые дела. Лента живёт соседним разделом и приходит сама, когда ей есть что сказать.",
        effect: "Продукт не заставляет разбирать чужую повестку на входе. Инициатива системы остаётся, но не перебивает инициативу человека.",
        why: "Проактивность даёт право заговорить. Занимать ради этого первый экран необязательно.",
        basis: "Конкурентный разбор: чат как вход привычен, лента на входе читается как ещё один поток.",
        image: img(G + "01.webp", 1024, 640, "Главный экран: чат — точка входа в продукт, с приветствием, полем ввода и тремя подсказками", "hero"),
      },
      {
        id: "reasoning",
        title: "Пошаговое рассуждение вместо спиннера",
        found: "Ассистент, который читает почту, календарь и переписку, отвечает не мгновенно. Спиннер в этой паузе сообщает только «ждите», и ожидание растягивается.",
        did: "В паузе видно, что система делает прямо сейчас: «Открыл календарь и переписку с участником встречи — собираю, о чём договорились». Шаги сворачиваются в одну строку с итогом.",
        effect: "К моменту ответа человек уже знает, на чём тот основан, и меньше склонен перепроверять.",
        why: "Черта «молчание — сообщение»: система показывает работу. Если в шагах видно, что модель полезла не туда, её остановят до результата.",
        basis: "Тесты: непонятно, откуда взял — первая причина недоверия.",
        image: img(G + "t-chat-reasoning-steps.webp", 1024, 226, "Развёрнутые шаги рассуждения: ассистент показывает, что изучает, и отмечает шаг «Готово»", "detail"),
      },
      {
        id: "conclusion",
        title: "Вывод первым, источники следом",
        found: "Ассистент легко скатывается в пересказ процесса: «я посмотрел, потом изучил, затем обнаружил». Человеку нужен вывод, а обоснование — если вывод вызвал сомнение.",
        did: "Ответ начинается с итога: «Бриф готов. Главное за минуту — и я подготовил follow-up». Под ним строка «На основе» с чипами источников: Telegram, Gmail, Notion.",
        effect: "Проверка стала выборочной: человек читает вывод, а к источникам идёт, только если что-то смущает.",
        why: "Чипы источников — подпись под утверждением. Для продукта, который действует от вашего имени, происхождение факта важнее формулировки.",
        image: img(G + "04.webp", 1024, 300, "Вывод первым, под ним чипы источников и запись в память, от которой можно отказаться", "detail"),
      },
      {
        id: "confirm",
        title: "Ничего не уходит наружу без подтверждения",
        found: "Главный страх пользователя проактивного ассистента — «он ошибётся и уже отправит». Один такой случай закрывает продукт навсегда.",
        did: "Любое действие вовне приходит карточкой: кому, тема, черновик текста и три кнопки «Редактировать», «Отклонить», «Отправить». Рядом прямая фраза: «Без вашего подтверждения не отправлю».",
        effect: "Обещание продукта проверяется прямо на экране: граница полномочий видна до того, как что-то произойдёт.",
        why: "Сначала предотвращение ошибок: необратимое действие не должно быть доступно одним движением. Обещание, которое нужно искать в настройках, обещанием не работает.",
        basis: "Прогон с инвесторами: подпись на карточке объясняет продукт за секунды.",
        deepDive: "rework-validation",
      },
      {
        id: "undo",
        title: "Отправлено — но ещё не поздно",
        found: "Подтверждение снимает страх наполовину. Человек подтверждает быстро и в этот момент часто ошибается, а дальше остаётся один на один с отправленным письмом.",
        did: "После отправки сверху появляется «Письмо отправлено — Отменить», а в переписке остаётся запись с кнопкой «Вернуть».",
        effect: "Цена ошибки падает, и вместе с ней напряжение при подтверждении. Обратимость делает людей решительнее.",
        why: "Предупреждение перестают читать на третий раз, отмена работает всегда. Запись в истории — ещё и след: видно, что система сделала от вашего имени.",
      },
      {
        id: "document",
        title: "Ответ как редактируемый документ",
        found: "Черновик письма в пузыре чата править невозможно: он живёт в ленте сообщений, а править его хочется как текст, с полями «кому» и «тема».",
        did: "«Редактировать» открывает боковую панель, где письмо — обычный документ. Чат остаётся на месте и виден слева.",
        effect: "Правка перестала быть перепиской с ассистентом «нет, скажи иначе».",
        why: "Сообщение — реплика, письмо — артефакт. Править артефакт средствами реплики значит описывать словами то, что можно исправить руками.",
        image: img(G + "05.webp", 1024, 640, "Боковая панель: письмо правится как документ, а чат остаётся на месте"),
      },
      {
        id: "memory",
        title: "Память с правом отказаться",
        found: "Ассистент, который накапливает контекст, запоминает лишнее. Молча запомненный факт всплывёт через месяц, и человек не поймёт, откуда система это взяла.",
        did: "Каждая запись показывается в момент, когда она происходит: «Запомнил: при Сергее не упоминать конкурента X», и рядом «Не запоминать». Раздел «Память» показывает всё накопленное.",
        effect: "Память стала видимой договорённостью, которую можно отозвать там же, где узнал о ней.",
        why: "Контроль должен находиться там же, где информация. Настройка в отдельном разделе требует сначала догадаться, что есть что отзывать.",
      },
      {
        id: "feed",
        title: "Лента: одна карточка — один вопрос",
        found: "Проактивные предложения легко превращаются в поток уведомлений, и тогда их перестают читать целиком.",
        did: "Карточка несёт одно наблюдение, один срок и один вопрос: «Напомнить?», «Бронирую?». Всегда есть «Позже». Состояние видно на карточке: ждёт решения, в работе, готово, ошибка.",
        effect: "Ленту можно разбирать по одной карточке и бросать в любой момент. Ошибка остаётся в ленте с причиной и кнопкой повтора.",
        why: "Черта «говорит один раз» в применении к списку. Карточка с двумя вопросами откладывается целиком.",
        image: img(G + "02.webp", 1024, 268, "Лента: одна карточка — одно предложение и один вопрос, в четырёх состояниях"),
        deepDive: "pipeline",
      },
    ],
  },
  split: {
    title: "Агент рисует, человек решает, что это хорошо.",
    left: {
      name: "Агент",
      items: [
        "Разбор файла Figma: компоненты, варианты, стили, расхождения",
        "Токены: цвет, типографика, радиусы, тени, отступы",
        "Отрисовка компонентов, состояний и целых экранов",
        "Перенос компонентов в код репозитория",
        "Витрины дизайн-системы и внутренняя документация",
        "Ревью сервисного флоу на консистентность",
      ],
    },
    right: {
      name: "Человек",
      items: [
        "Характер продукта и правила, выведенные из него",
        "Что делаем и в каком порядке",
        "Точечные правки и докручивание до задачи бизнеса",
        "Приёмка: что уходит в разработку, а что на переделку",
        "Защита решений перед заказчиком и инвесторами",
        "Отказы: чего в продукте не будет и почему",
      ],
    },
    why: "Граница проходит по природе ответа, а не по сложности задачи. Всё, у чего есть проверяемый критерий, уходит агенту. Всё, где критерий формулируется только после того, как увидишь результат, остаётся человеку: «достаточно ли это спокойно» заранее не ответишь.",
  },
  mistakes: {
    lead: "Первый концепт пришлось выбросить целиком.",
    items: [
      {
        title: "Спроектировал концепт, который команда не успевала собрать",
        decided: "Довести первый концепт до конца: он был спроектирован полностью.",
        wrong: "Сроки разработки под него росли до неприемлемых. Красивое решение, которое команда не успевает собрать, решением не является.",
        out: "Переделал концепт целиком. След остался в файле Figma: на страницах чата, источников и настроек рядом лежат старая и новая версии, и видно, от чего отказались.",
        changed: "Скорость сборки — свойство дизайна. Когда дизайн быстрый, а разработка живая и на бюджете, узкое место сдвигается, и проектировать приходится с оглядкой на то, из чего это будут собирать.",
      },
    ],
  },
  results: {
    lead: "Что осталось после проекта.",
    points: [
      "Дизайн-система с нуля: токены, типографика на трёх семействах, компоненты с состояниями, витрины и документация",
      "Двенадцать страниц макета: чат, лента, память, источники, настройки, онбординг плюс страницы концептов и черновиков",
      "Передача в разработку через Storybook: рабочие компоненты вместо макетов и описаний",
      "Соответствие дизайн-системе проверяет машина: сырой цвет, сырой размер или чужой шрифт роняют сборку — одинаково для агентов и людей",
    ],
    honesty:
      "Продуктовых метрик в этом кейсе нет: публикую только то, что могу подтвердить файлом Figma, репозиторием и Storybook. Результаты тестов описаны качественно, без процентов.",
  },
  takeaways: [
    "Когда команда состоит из агентов, дизайн-лиду почти не нужно объяснять и ждать. Время уходит на другое: сформулировать правило, которое нельзя понять двояко, и решить, что считать хорошим результатом.",
    "Агент не спорит, и это опаснее, чем кажется. Живой дизайнер спросит «а зачем?», и половина плохих идей умирает на этом вопросе. Агент сделает молча и хорошо, поэтому «зачем» приходится задавать себе самому.",
    "Любой договорённости нужен носитель, который не зависит от доброй воли. Пока дизайн-система была словами, её нарушали все, включая меня. Когда она стала проверкой на сборке, спор закончился за один день.",
  ],
  quote: "Библиотеку компонентов можно проигнорировать. Проверку, которая роняет сборку, уже нет.",
  gallery: [
    {
      kind: "spot",
      title: "Один ответ: пять решений о доверии",
      image: img(G + "03.webp", 1024, 922, "Ответ ассистента с источниками, записью в память и карточкой действия"),
      spots: [
        { x: 56.5, y: 11.9, text: "«Собрал контекст — 4 источника»: шаги рассуждения свёрнуты в строку", decision: "reasoning" },
        { x: 27.5, y: 15.3, text: "Ответ начинается с вывода", decision: "conclusion" },
        { x: 60.5, y: 28, text: "Чипы источников: Telegram, Gmail, Notion", decision: "conclusion" },
        { x: 78, y: 33.3, text: "«Не запоминать» рядом с тем, что запомнено", decision: "memory" },
        { x: 29.6, y: 62.7, text: "«Без вашего подтверждения не отправлю» прямо на карточке", decision: "confirm" },
      ],
    },
    {
      kind: "compare",
      title: "До отправки и после: действие остаётся обратимым",
      before: img(G + "03.webp", 1024, 922, "До отправки: карточка ждёт решения"),
      after: img(G + "06.webp", 1024, 772, "После отправки: «Отменить» сверху и «Вернуть» в переписке"),
      labels: ["Ждёт подтверждения", "Отправлено · можно отменить"],
    },
    {
      kind: "bento",
      title: "Остальные экраны",
      images: [
        img(G + "t-chat-attach.webp", 1024, 640, "Чат с вложением"),
        img(G + "07.webp", 1024, 128, "Пошаговое рассуждение показывает, что система делает в паузе", "detail"),
      ],
    },
  ],
  deepDives: tracksRu["grif-ai"].tracks,
};

export const en: CaseStory = {
  id: "grif-ai",
  hero: {
    kicker: "Proactive AI assistant · built from zero · 2026",
    title: "GRIF AI",
    tagline: "I built a design function out of AI agents, from a couple of screens to Storybook.",
    summary:
      "What I got was an idea, a couple of screens and not a single line of code. I ran product design solo while agents did the drawing, assembling and moving to code: Claude worked inside Figma via MCP, components travelled to a GitHub repository, and developers picked them up from Storybook to assemble pages. The human part was spot fixes and the final polish, the point where a mock-up starts doing its job.",
    facts: [
      ["Role", "Lead Product Designer"],
      ["Team", "Agents instead of a design department; human frontend and backend"],
      ["Timeline", "2025 to 2026, deadlines agreed task by task"],
      ["Platform", "Web, dark theme, RU / EN"],
    ],
    tags: ["AI", "Design system", "B2C", "Leadership"],
  },
  kpis: [
    { value: "12", label: "mock-up pages: chat, feed, memory, sources, settings, onboarding" },
    { value: "4", label: "compliance rules that fail the build" },
    { value: "8", label: "interface decisions, each derived from a character trait" },
    { value: "2", label: "validation tracks: users and investors" },
  ],
  context: {
    lead: "An idea, a couple of screens and an empty repository.",
    text:
      "GRIF is a proactive personal assistant. It connects to your email, messengers, calendar and finances, notices what needs doing and brings a ready-made action. The user does not write a prompt, they approve or decline.\n\nA chat waits for a question, and the burden of phrasing it sits with the person. A proactive assistant speaks first, so every appearance spends someone's attention and has to earn it. The whole design grew out of that: the main question is when the system has the right to speak at all.",
    constraints: [
      { title: "An idea and a small draft", text: "A product concept in words and a couple of screens, more an illustration of a thought than a mock-up." },
      { title: "Zero working code", text: "There was no frontend and no components, and the repository was empty." },
      { title: "No design system, no tokens", text: "There was no colour scale, typography or layout rules, only aesthetic wishes." },
      { title: "A real dev team on a budget", text: "Frontend and backend needed deliverables regularly and in a clear format. Their time cost money, and so did their downtime." },
    ],
    myRole:
      "Lead Product Designer. There was no design department, so I built a team of agents and managed it the way you manage people: set tasks, accepted work, sent it back for rework and answered to the business for quality. Deadlines were agreed task by task, so every iteration ended with something I could hand over.",
  },
  approach: {
    lead: "I described a character first, then derived the interface from it.",
    text:
      "The first artefact was a written description of the product's character. The reason was practical: when your executor is an agent, \"make it calm and premium\" is not a task. Agents follow rules well and guess taste badly. So taste had to become rules, or every iteration would turn into an argument about what \"calm\" means.\n\nThe character got a name: Quiet strategist. The formula: \"the part of your mind that already thought it through while you were busy\". It does not panic, speaks once, respects silence and earns trust through precision. No \"Great question!\", just \"Your brief for the meeting with Sergey is ready. Open it?\".",
    rules: [
      { trait: "Never rushes", rule: "Transitions of 120 to 200 ms, opacity and colour only. Not a single bounce, not a single scale on a button." },
      { trait: "Speaks once", rule: "The attention field shows one link between two points, never a web of lines. One insight at a time." },
      { trait: "Silence is a message", rule: "No spinner and no \"typing…\". A status line instead: \"Watching, all quiet\"." },
      { trait: "Trust through precision", rule: "Every answer carries chips for the sources it was built from: \"here is where I got it\"." },
      { trait: "Keeps it down", rule: "One blue accent per screen, everything else a neutral grey scale. Where the blue is, that is where you look." },
    ],
    refusals: [
      "Model and temperature picker. An assistant whose brain you have to configure is no longer the one who already thought it through for you.",
      "Folders and projects. That hands the job of keeping things tidy back to the user.",
      "Wake-word voice activation. Something that is always listening cannot claim to respect silence.",
      "The \"typing…\" indicator. Pretending to be human where the system could show what it is reading.",
    ],
  },
  research: {
    lead: "Validation ran on two tracks: users and investors.",
    methods: [
      {
        kind: "Tests and interviews",
        title: "The usual track",
        question: "Do people understand what the system is doing now, what it has already done and how to undo it?",
        sample: "User tests and interviews on the finished parts of the product",
        finding:
          "Trust rarely breaks on one big mistake. It breaks on small confusions: unclear where it got that, unclear what it already did, unclear how to undo it. That is why almost every interface decision is about visibility and reversibility.",
      },
      {
        kind: "Competitor review",
        title: "Which patterns people already know",
        question: "What does the audience already know from ChatGPT, Claude and Alice, and where would we have to teach?",
        sample: "ChatGPT, Claude, Alice (Yandex's voice assistant), neighbouring services and other teams' design files",
        finding:
          "Chat as the entry point is familiar to everyone. A proactive feed is not, and on the first screen it reads as one more inbox. That settled it: the home screen is a chat, and the feed lives next to it.",
      },
      {
        kind: "Investor run",
        title: "The rare track",
        question: "Does the interface explain the product in a few minutes to someone seeing it for the first time?",
        sample: "Investors worked through real tasks in the finished part of the product",
        finding:
          "The question on the table was \"do we keep going\". Usability was only part of the answer. The interface got a second job: let people finish the task and present the product's logic in the same few minutes. Hence explicit captions like \"Gathered context, 4 sources\" and \"I won't send this without your OK\".",
      },
      {
        kind: "Consistency audit",
        title: "An agent walks the whole flow",
        question: "Are the same things named the same way, and does every screen have an error state and a way back?",
        sample: "The entire service flow, in a separate pass",
        finding:
          "Dull work that people do badly by screen seven and skip entirely by screen twenty. The agent walked the full flow and checked naming, error states and returns.",
      },
      {
        kind: "Figma file audit",
        title: "The source of truth was lying",
        question: "Do the declared styles match what the mock-ups use?",
        sample: "A twelve-page kit read through MCP",
        finding:
          "The agent compared declared styles with actual usage and found that the light-palette page was a leftover from someone else's template. We caught it while parsing the file, not during front-end build.",
      },
    ],
    hypotheses: {
      intro: "Three hypotheses about trust that went into both tracks. The wording comes from the interface decisions; the case has no numbers for them.",
      items: [
        { text: "If the pause shows what the system is reading, people double-check the answer less.", verdict: "Step-by-step reasoning" },
        { text: "A limit of authority written on the card removes the fear of \"it gets it wrong and has already hit send\".", verdict: "Action card" },
        { text: "Being able to undo after sending makes people more decisive when confirming.", verdict: "Undo and \"Recall\"" },
      ],
    },
  },
  decisions: {
    lead: "Every decision rests on a character trait you can name out loud. A product that acts on its own lives on trust, so almost all of them are about visibility and reversibility.",
    items: [
      {
        id: "chat-home",
        title: "The home screen is a chat, not a feed",
        found: "The feed of proactive cards is the product's most visible idea, and the temptation to make it the shop window was strong. But the feed answers \"what did the system notice\", while people arrive with a task of their own.",
        did: "The entry point is a chat: a greeting, an input field and three suggestions for typical jobs. The feed lives in its own section and shows up when it has something to say.",
        effect: "The product does not make you sort through someone else's agenda on arrival. The system keeps its initiative without talking over the person's.",
        why: "Being proactive gives the product the right to speak. It does not have to own the first screen for that.",
        basis: "Competitor review: chat as the entry is familiar, a feed on entry reads as one more inbox.",
        image: img(G + "01.webp", 1024, 640, "Home screen: chat is the way into the product, with a greeting, an input field and three suggestions", "hero"),
      },
      {
        id: "reasoning",
        title: "Step-by-step reasoning instead of a spinner",
        found: "An assistant that reads your email, calendar and chats does not answer instantly. A spinner in that pause says only \"wait\", and the wait feels longer than it is.",
        did: "During the pause you see what the system is doing right now: \"Opened your calendar and your thread with the attendee, pulling together what you agreed on\". The steps collapse into a single summary line.",
        effect: "By the time the answer appears, the person already knows what it is based on and is less inclined to double-check.",
        why: "\"Silence is a message\": the system shows its work. If the steps show the model heading the wrong way, people stop it before the result.",
        basis: "Tests: not knowing where an answer came from is the first cause of distrust.",
        image: img(G + "t-chat-reasoning-steps.webp", 1024, 226, "Expanded reasoning steps: the assistant shows what it is studying and marks the step as done", "detail"),
      },
      {
        id: "conclusion",
        title: "Conclusion first, sources next",
        found: "Assistants easily slide into narrating the process: \"I looked, then I studied, then I discovered\". People need the conclusion, and the reasoning only if the conclusion raises doubts.",
        did: "The answer opens with the outcome: \"Brief's ready. The key points in a minute, and I've drafted a follow-up\". A \"Based on\" line underneath carries source chips: Telegram, Gmail, Notion.",
        effect: "Checking became selective: people read the conclusion and go to the sources only if something feels off.",
        why: "Source chips are a signature under a claim. For a product acting on your behalf, where a fact came from matters more than how it is phrased.",
        image: img(G + "04.webp", 1024, 300, "Conclusion first, then source chips and a memory note you can turn down", "detail"),
      },
      {
        id: "confirm",
        title: "Nothing leaves without your OK",
        found: "The biggest fear with a proactive assistant is \"it gets it wrong and has already hit send\". One such incident kills the product for good.",
        did: "Any outward action arrives as a card: recipient, subject, draft text and three buttons, \"Edit\", \"Decline\", \"Send\". Next to them a plain line: \"I won't send this without your OK\".",
        effect: "The product promise can be verified on the screen itself: the limit of authority is visible before anything happens.",
        why: "Error prevention first: an irreversible action should not be one tap away. A promise you have to dig for in settings does not work as a promise.",
        basis: "Investor run: a caption on the card explains the product in seconds.",
        deepDive: "rework-validation",
      },
      {
        id: "undo",
        title: "Sent, but not too late",
        found: "Confirmation removes only half the fear. People confirm quickly and that is when they slip up, and then they are left alone with an email that has already gone.",
        did: "After sending, \"Email sent, Undo\" appears at the top, and the conversation keeps a record with a \"Recall\" button.",
        effect: "The cost of a mistake drops, and so does the tension at the moment of confirming. Reversibility makes people more decisive.",
        why: "People stop reading a warning by the third time; an undo works every time. The history record doubles as a trail of what the system did on your behalf.",
      },
      {
        id: "document",
        title: "The answer as an editable document",
        found: "You cannot edit an email draft inside a chat bubble: it lives in the message stream, but you want to edit it as text, with \"to\" and \"subject\" fields.",
        did: "\"Edit\" opens a side panel where the email is a normal document. The chat stays where it is, visible on the left.",
        effect: "Editing stopped being a back-and-forth of \"no, say it differently\" with the assistant.",
        why: "A message is a line of dialogue; an email is an artefact. Editing an artefact through dialogue forces people to describe in words what they could fix directly.",
        image: img(G + "05.webp", 1024, 640, "Side panel: the email is edited like a document while the chat stays put"),
      },
      {
        id: "memory",
        title: "Memory you can say no to",
        found: "An assistant that builds up context remembers too much. A silently memorised fact pops up a month later, and the person has no idea where the system got it.",
        did: "Each memory is shown the moment it is made: \"Noted: don't mention competitor X around Sergey\", with \"Don't remember\" right next to it. A \"Memory\" section shows everything collected.",
        effect: "Memory became a visible agreement you can revoke right where you learned about it.",
        why: "Control belongs where the information is. A setting in a separate section only works if you first guess there is something to revoke.",
      },
      {
        id: "feed",
        title: "Feed: one card, one question",
        found: "Proactive suggestions easily turn into a notification stream, and then people stop reading them altogether.",
        did: "A card carries one observation, one deadline and one question: \"Remind them?\", \"Book it?\". There is always \"Later\". The state is on the card itself: awaiting decision, in progress, done, error.",
        effect: "You can work through the feed one card at a time and drop it at any moment. Errors stay in the feed with their cause and a retry button.",
        why: "\"Speaks once\" applied to a list. A card with two questions gets postponed as a whole.",
        image: img(G + "02.webp", 1024, 268, "Feed: one card, one suggestion, one question, in four states"),
        deepDive: "pipeline",
      },
    ],
  },
  split: {
    title: "The agent draws, the human decides whether it is good.",
    left: {
      name: "Agent",
      items: [
        "Parsing the Figma file: components, variants, styles, inconsistencies",
        "Tokens: colour, typography, radii, shadows, spacing",
        "Drawing components, their states and entire screens",
        "Moving components into repository code",
        "Design system showcases and internal docs",
        "Consistency review of the service flow",
      ],
    },
    right: {
      name: "Human",
      items: [
        "Product character and the rules derived from it",
        "What we build and in what order",
        "Spot fixes and polishing until the solution meets the business goal",
        "Sign-off: what goes to development, what goes back",
        "Defending decisions to the client and investors",
        "Refusals: what the product will not have and why",
      ],
    },
    why: "The line follows the nature of the answer, not the difficulty of the task. Anything with a checkable criterion goes to the agent. Anything whose criterion you can only name after seeing the result stays with the human: \"is this calm enough\" cannot be answered in advance.",
  },
  mistakes: {
    lead: "The first concept had to be thrown out entirely.",
    items: [
      {
        title: "I designed a concept the team could not build in time",
        decided: "Take the first concept all the way: it was fully designed.",
        wrong: "The development timeline it required grew unacceptable. A beautiful solution the team cannot build in time is no solution.",
        out: "I redid the concept from scratch. The trace is still in the Figma file: the chat, sources and settings pages keep the old and new versions side by side, so you can see what we walked away from.",
        changed: "Build speed is a property of design. When design is fast and development is human and on a budget, the bottleneck moves, and you design with an eye on what it will be built from.",
      },
    ],
  },
  results: {
    lead: "What the project left behind.",
    points: [
      "A design system from zero: tokens, typography across three families, components with states, showcases and docs",
      "Twelve mock-up pages: chat, feed, memory, sources, settings, onboarding, plus concept and draft pages",
      "Dev handoff through Storybook: working components instead of mock-ups and descriptions",
      "A machine checks design system compliance: a raw colour, a raw size or a foreign font fails the build, for agents and humans alike",
    ],
    honesty:
      "This case has no product metrics: I publish only what I can back with the Figma file, the repository and Storybook. Test results are described qualitatively, without percentages.",
  },
  takeaways: [
    "With a team of agents, a design lead barely needs to explain and wait. The time goes elsewhere: phrasing a rule that cannot be read two ways and deciding what counts as a good result.",
    "The agent does not argue, and that is more dangerous than it sounds. A human designer asks \"why?\", and half of all bad ideas die right there. An agent does it silently and well, so you have to ask \"why\" yourself.",
    "Any agreement needs a carrier that does not rely on goodwill. While the design system was just words, everyone broke it, me included. Once it became a build check, the argument was over in a day.",
  ],
  quote: "You can ignore a component library. You cannot ignore a check that fails the build.",
  gallery: [
    {
      kind: "spot",
      title: "One answer, five decisions about trust",
      image: img(G + "03.webp", 1024, 922, "An assistant answer with sources, a memory note and an action card"),
      spots: [
        { x: 56.5, y: 11.9, text: "\"Gathered context, 4 sources\": reasoning steps collapsed into a line", decision: "reasoning" },
        { x: 27.5, y: 15.3, text: "The answer opens with the conclusion", decision: "conclusion" },
        { x: 60.5, y: 28, text: "Source chips: Telegram, Gmail, Notion", decision: "conclusion" },
        { x: 78, y: 33.3, text: "\"Don't remember\" right next to what was noted", decision: "memory" },
        { x: 29.6, y: 62.7, text: "\"I won't send this without your OK\" on the card itself", decision: "confirm" },
      ],
    },
    {
      kind: "compare",
      title: "Before and after sending: the action stays reversible",
      before: img(G + "03.webp", 1024, 922, "Before sending: the card awaits a decision"),
      after: img(G + "06.webp", 1024, 772, "After sending: \"Undo\" at the top and \"Recall\" in the conversation"),
      labels: ["Awaiting your OK", "Sent · can be undone"],
    },
    {
      kind: "bento",
      title: "More screens",
      images: [
        img(G + "t-chat-attach.webp", 1024, 640, "Chat with an attachment"),
        img(G + "07.webp", 1024, 128, "Step-by-step reasoning shows what the system is doing in the pause", "detail"),
      ],
    },
  ],
  deepDives: tracksEn["grif-ai"].tracks,
};
