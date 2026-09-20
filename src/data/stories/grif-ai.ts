/* v41: рассказ кейса GRIF AI на двух языках. Источник — Main cases/Grif-AI.html и EN/Grif-AI.en.html.
   Разделы с пометкой «ждёт ответа владельца» на Tilda сюда не перенесены: публикуем только известное.
   v56: тексты переписаны простым языком. Факты те же; технический термин остаётся рядом с объяснением. */
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
    tagline: "Собрал дизайн-отдел из ИИ-агентов и довёл продукт от пары экранов до готовых деталей интерфейса в коде.",
    summary:
      "В начале была идея, пара экранов и ни строчки кода. Дизайнером в проекте был я один. Рисовали, собирали и переносили в код ИИ-агенты. Claude работал прямо в Figma (через подключение MCP). Готовые детали интерфейса уходили в общее хранилище кода на GitHub. Разработчики брали их из Storybook, это витрина готовых деталей, и собирали из них страницы. На мне оставались точечные правки и доводка, после которой макет начинает решать задачу.",
    facts: [
      ["Роль", "Лид продуктового дизайна"],
      ["Команда", "Агенты вместо дизайн-отдела; фронтенд и бэкенд — люди"],
      ["Срок", "2025–2026, сроки обговаривались под каждую задачу"],
      ["Платформа", "Веб, тёмная тема, RU / EN"],
    ],
    tags: ["AI", "Дизайн-система", "B2C", "Лидерство"],
  },
  kpis: [
    { value: "12", label: "страниц макета: чат, лента, память, источники, настройки, первое знакомство" },
    { value: "4", label: "правила оформления. Нарушил любое, и код не принимается" },
    { value: "8", label: "решений интерфейса, каждое выведено из черты характера продукта" },
    { value: "2", label: "проверки: на пользователях и на инвесторах" },
  ],
  context: {
    lead: "Идея, пара экранов и пустая папка для кода.",
    text:
      "GRIF — личный помощник, который приходит первым. Он подключается к почте, мессенджерам, календарю и финансам. Сам замечает, что пора что-то сделать, и приносит готовое действие. Человеку не нужно ничего формулировать, он только соглашается или отказывается.\n\nОбычный чат ждёт вопроса, и за формулировку отвечает человек. Помощник, который приходит сам, каждый раз отнимает чужое внимание. Представьте коллегу, который подходит к вашему столу: если он подходит по пустякам, вы начнёте его избегать. Поэтому главный вопрос всего дизайна был такой: когда система имеет право заговорить.",
    constraints: [
      { title: "Идея и небольшой набросок", text: "Задумка продукта на словах и пара экранов. Это была скорее иллюстрация мысли, чем макет." },
      { title: "Ни строчки кода", text: "Не было ни сайта, ни готовых деталей интерфейса. Папка для кода была пустой." },
      { title: "Ни дизайн-системы, ни общих настроек", text: "Не было ни набора цветов, ни шрифтов, ни правил, как располагать элементы. Только пожелания, как должно выглядеть." },
      { title: "Живая команда и ограниченный бюджет", text: "Разработчикам надо было что-то отдавать регулярно и в понятном виде. Их время стоило денег, и простой тоже стоил денег." },
    ],
    myRole:
      "Лид продуктового дизайна. Дизайн-отдела не было, поэтому я собрал команду из агентов и работал с ней как с людьми. Ставил задачи, принимал работу, отправлял на переделку и отвечал перед бизнесом за качество. Срок оговаривали для каждой задачи отдельно, поэтому каждый заход заканчивался чем-то, что можно отдать дальше.",
  },
  approach: {
    lead: "Сначала описал характер продукта, потом вывел из него интерфейс.",
    text:
      "Первым делом я написал, какой у продукта характер. Причина практическая. Когда работу делает агент, просьба «сделай спокойно и дорого» не работает. Агент отлично выполняет правило и плохо угадывает вкус. Это как рецепт: «посолите по вкусу» новичку не поможет, а «чайная ложка соли» поможет. Вкус пришлось превратить в правила, иначе мы каждый раз спорили бы о том, что значит «спокойно».\n\nХарактер получил имя: Тихий стратег. Его формула: «та часть твоего ума, которая уже всё обдумала, пока ты был занят». Он не паникует, говорит один раз, уважает молчание и зарабатывает доверие точностью. Он не скажет «Отличный вопрос!». Он скажет «Бриф к встрече с Сергеем готов. Открыть?».",
    rules: [
      { trait: "Не торопится", rule: "Анимации длятся 120–200 мс и меняют только прозрачность и цвет. Ничего не подпрыгивает, ни одна кнопка не раздувается." },
      { trait: "Говорит один раз", rule: "Система показывает одну догадку за раз: одну линию между двумя точками. Паутины из связей на экране нет." },
      { trait: "Молчание — тоже сообщение", rule: "Нет крутящегося значка загрузки и нет надписи «печатает…». Вместо них строка состояния: «Наблюдаю, сейчас тихо»." },
      { trait: "Доверие через точность", rule: "Под каждым ответом стоят метки источников, из которых он собран. Система как бы говорит: «вот откуда я это взял»." },
      { trait: "Не шумит", rule: "На экране один синий акцент, всё остальное в оттенках серого. Где синее, туда и смотреть." },
    ],
    refusals: [
      "Выбор модели и её настроек. Если помощнику надо настраивать мозг, он перестаёт быть тем, кто уже подумал за тебя.",
      "Папки и проекты. Они возвращают человеку работу по наведению порядка, от которой помощник должен был избавить.",
      "Включение голосом по кодовому слову. Тот, кто всё время слушает, не может уважать тишину.",
      "Надпись «печатает…». Она изображает человека там, где можно честно показать, что система сейчас читает.",
    ],
  },
  research: {
    lead: "Проверяли двумя способами: на пользователях и на инвесторах.",
    methods: [
      {
        kind: "Тесты и интервью",
        title: "Обычная проверка",
        question: "Понимает ли человек, что система делает сейчас, что она уже сделала и как это отменить?",
        sample: "Пользовательские тесты и интервью на готовых частях продукта",
        finding:
          "Доверие редко ломается от одной большой ошибки. Чаще его подтачивают мелкие непонятности: откуда система это взяла, что она уже сделала, как это отменить. Поэтому почти каждое решение в интерфейсе отвечает на один из двух вопросов: «видно ли, что происходит» и «можно ли вернуть назад».",
      },
      {
        kind: "Конкурентный разбор",
        title: "К чему люди уже привыкли",
        question: "Что люди уже умеют после ChatGPT, Claude и Алисы, а чему придётся учить?",
        sample: "ChatGPT, Claude, Алиса, соседние сервисы и чужие дизайн-файлы",
        finding:
          "Чат как первый экран привычен всем. Лента, в которой система сама что-то предлагает, непривычна. На первом экране она выглядит как ещё один ящик входящих. Поэтому главным экраном стал чат, а лента живёт рядом.",
      },
      {
        kind: "Прогон с инвесторами",
        title: "Редкая проверка",
        question: "Поймёт ли человек, который видит продукт впервые, в чём его суть, за несколько минут?",
        sample: "Инвесторы проходили настоящие задачи в готовой части продукта",
        finding:
          "По итогам этого прогона инвесторы решали, работать ли с нами дальше. Удобство было только частью ответа. У интерфейса появилась вторая работа: дать выполнить задачу и за те же минуты показать, как продукт устроен. Отсюда прямые подписи «Собрал контекст — 4 источника» и «Без вашего подтверждения не отправлю».",
      },
      {
        kind: "Аудит консистентности",
        title: "Агент проходит весь путь пользователя",
        question: "Одинаково ли названы одни и те же вещи? Везде ли есть сообщение об ошибке и путь назад?",
        sample: "Весь сервисный флоу, отдельным заходом",
        finding:
          "Это скучная работа. Человек делает её плохо на седьмом экране и совсем не делает на двадцатом. Агент прошёл весь путь целиком и сверил названия, сообщения об ошибках и возвраты назад.",
      },
      {
        kind: "Аудит файла Figma",
        title: "Главный файл говорил неправду",
        question: "Совпадают ли заявленные стили с тем, что на самом деле используется в макетах?",
        sample: "Кит на двенадцать страниц, прочитанный через MCP",
        finding:
          "Агент сравнил стили, которые были заявлены, с теми, что реально использовались. Оказалось, что страница со светлыми цветами осталась от чужого шаблона. Это выяснилось при разборе файла, а не тогда, когда разработчики уже собирали страницы.",
      },
    ],
    hypotheses: {
      intro: "Три предположения о доверии, которые мы проверяли обоими способами. Формулировки взяты из решений интерфейса. Цифр по ним у меня нет.",
      items: [
        { text: "Если во время паузы видно, что система читает, человек реже перепроверяет ответ.", verdict: "Пошаговое рассуждение" },
        { text: "Если на карточке написано, чего система без спроса не сделает, уходит страх «ошибётся и уже отправит».", verdict: "Карточка действия" },
        { text: "Если отправленное можно отменить, люди подтверждают решительнее.", verdict: "Отмена и «Вернуть»" },
      ],
    },
  },
  decisions: {
    lead: "За каждым решением стоит черта характера, которую можно назвать вслух. Продукт, который действует сам, держится на доверии. Поэтому почти все решения отвечают на два вопроса: видно ли, что происходит, и можно ли вернуть назад.",
    items: [
      {
        id: "chat-home",
        title: "Первый экран — чат, а лента рядом",
        found: "Лента, где система сама предлагает дела, самая заметная идея продукта. Очень хотелось поставить её на первый экран. Но лента рассказывает, что заметила система, а человек приходит со своей задачей.",
        did: "Сделал первым экраном чат: приветствие, поле ввода и три подсказки для типичных дел. Лента стоит соседним разделом и приходит сама, когда ей есть что сказать.",
        effect: "Человеку не приходится с порога разбирать чужой список дел. Система по-прежнему может начать разговор первой, но не перебивает человека.",
        why: "Помощник имеет право заговорить первым. Занимать для этого весь первый экран ему необязательно.",
        basis: "Конкурентный разбор: чат на входе привычен, а лента на входе выглядит как ещё один ящик входящих.",
        image: img(G + "01.webp", 1024, 640, "Первый экран: чат с приветствием, полем ввода и тремя подсказками", "hero"),
      },
      {
        id: "reasoning",
        title: "Шаги рассуждения вместо значка загрузки",
        found: "Помощник, который читает почту, календарь и переписку, отвечает не сразу. Крутящийся значок в это время говорит только «ждите», и пауза кажется длиннее.",
        did: "Во время паузы видно, что система делает прямо сейчас: «Открыл календарь и переписку с участником встречи — собираю, о чём договорились». Потом шаги сворачиваются в одну строку с итогом.",
        effect: "Когда приходит ответ, человек уже знает, на чём он основан, и реже его перепроверяет.",
        why: "Это черта «молчание — тоже сообщение»: система показывает свою работу. Если по шагам видно, что она полезла не туда, её остановят раньше, чем она закончит.",
        basis: "Тесты: «непонятно, откуда он это взял» — первая причина недоверия.",
        image: img(G + "t-chat-reasoning-steps.webp", 1024, 226, "Развёрнутые шаги рассуждения: помощник показывает, что изучает, и отмечает шаг «Готово»", "detail"),
      },
      {
        id: "conclusion",
        title: "Сначала вывод, потом источники",
        found: "Помощник легко скатывается в пересказ своих действий: «я посмотрел, потом изучил, затем обнаружил». Человеку нужен вывод. Обоснование нужно, только если вывод вызвал сомнение.",
        did: "Ответ начинается с итога: «Бриф готов. Главное за минуту — и я подготовил follow-up». Под ним строка «На основе» с метками источников: Telegram, Gmail, Notion.",
        effect: "Проверять стали выборочно. Человек читает вывод и идёт к источникам, только если что-то смущает.",
        why: "Метки источников работают как подпись под утверждением. Когда продукт действует от вашего имени, важнее всего знать, откуда взят факт.",
        image: img(G + "04.webp", 1024, 300, "Сначала вывод, под ним метки источников и запись в память, от которой можно отказаться", "detail"),
      },
      {
        id: "confirm",
        title: "Без подтверждения наружу ничего не уходит",
        found: "Главный страх человека перед таким помощником: «он ошибётся и уже отправит». Один такой случай, и продуктом больше не пользуются.",
        did: "Любое действие, которое уходит наружу, приходит карточкой: кому, тема, черновик текста и три кнопки «Редактировать», «Отклонить», «Отправить». Рядом прямо написано: «Без вашего подтверждения не отправлю».",
        effect: "Обещание продукта проверяется прямо на экране. Что система может и чего не может без спроса, видно до того, как что-то случится.",
        why: "Сначала надо не дать ошибиться: то, что нельзя вернуть, не должно делаться одним движением. А обещание, которое спрятано в настройках, обещанием не работает.",
        basis: "Прогон с инвесторами: подпись на карточке объясняет продукт за секунды.",
        deepDive: "rework-validation",
      },
      {
        id: "undo",
        title: "Отправлено, но ещё не поздно",
        found: "Подтверждение снимает страх только наполовину. Человек подтверждает быстро и в этот момент часто ошибается. А потом остаётся один на один с отправленным письмом.",
        did: "После отправки сверху появляется «Письмо отправлено — Отменить», а в переписке остаётся запись с кнопкой «Вернуть».",
        effect: "Ошибка стоит дешевле, и подтверждать становится не так страшно. Когда можно вернуть назад, люди решают смелее.",
        why: "Предупреждения перестают читать на третий раз, а отмена работает всегда. Запись в переписке служит ещё и следом: видно, что система сделала от вашего имени.",
      },
      {
        id: "document",
        title: "Ответ, который можно править как документ",
        found: "Черновик письма внутри сообщения в чате править неудобно. Он лежит в ленте реплик, а править его хочется как обычный текст, с полями «кому» и «тема».",
        did: "Кнопка «Редактировать» открывает сбоку панель, где письмо выглядит как обычный документ. Чат остаётся на месте и виден слева.",
        effect: "Чтобы поправить письмо, больше не нужно переписываться с помощником: «нет, скажи иначе».",
        why: "Сообщение в чате — это реплика, а письмо — это вещь. Странно объяснять словами то, что можно поправить руками.",
        image: img(G + "05.webp", 1024, 640, "Боковая панель: письмо правится как документ, а чат остаётся на месте"),
      },
      {
        id: "memory",
        title: "Память, от которой можно отказаться",
        found: "Помощник, который копит знания о вас, запоминает и лишнее. То, что он запомнил молча, всплывёт через месяц, и человек не поймёт, откуда система это знает.",
        did: "Каждую запись система показывает в тот момент, когда делает её: «Запомнил: при Сергее не упоминать конкурента X». Рядом кнопка «Не запоминать». В разделе «Память» видно всё, что накопилось.",
        effect: "Память стала открытым уговором. Отказаться от записи можно там же, где о ней узнал.",
        why: "Кнопка должна стоять там же, где информация. Чтобы найти настройку в отдельном разделе, надо сначала догадаться, что там есть что отменять.",
      },
      {
        id: "feed",
        title: "Лента: одна карточка, один вопрос",
        found: "Предложения от системы легко превращаются в поток уведомлений. Тогда их перестают читать совсем.",
        did: "В карточке одно наблюдение, один срок и один вопрос: «Напомнить?», «Бронирую?». Всегда есть кнопка «Позже». На карточке видно её состояние: ждёт решения, в работе, готово, ошибка.",
        effect: "Ленту можно разбирать по одной карточке и бросить в любой момент. Если что-то не получилось, карточка остаётся в ленте с причиной и кнопкой «повторить».",
        why: "Это черта «говорит один раз», применённая к списку. Карточку с двумя вопросами человек откладывает целиком.",
        image: img(G + "02.webp", 1024, 268, "Лента: в каждой карточке одно предложение и один вопрос, четыре состояния"),
        deepDive: "pipeline",
      },
    ],
  },
  split: {
    title: "Агент рисует, человек решает, хорошо ли получилось.",
    left: {
      name: "Агент",
      items: [
        "Разбирает файл Figma: детали интерфейса, их варианты, стили и расхождения",
        "Ведёт общие настройки оформления (токены): цвета, шрифты, скругления, тени, отступы",
        "Рисует детали интерфейса, их состояния и целые экраны",
        "Переносит детали интерфейса в код",
        "Собирает витрины дизайн-системы и внутреннюю документацию",
        "Проверяет весь путь пользователя на единообразие",
      ],
    },
    right: {
      name: "Человек",
      items: [
        "Характер продукта и правила, которые из него следуют",
        "Что делаем и в каком порядке",
        "Точечные правки и доводка до задачи бизнеса",
        "Приёмка: что отдать разработчикам, а что вернуть на переделку",
        "Защита решений перед заказчиком и инвесторами",
        "Отказы: чего в продукте не будет и почему",
      ],
    },
    why: "Граница проходит не по сложности задачи. Она проходит по тому, можно ли заранее сказать, что считать правильным ответом. Если можно, задача уходит агенту. Если ответ понятен только тогда, когда увидишь результат, задача остаётся человеку. На вопрос «достаточно ли это спокойно» заранее не ответишь.",
  },
  mistakes: {
    lead: "Первый вариант продукта пришлось выбросить целиком.",
    items: [
      {
        title: "Спроектировал вариант, который команда не успевала собрать",
        decided: "Довести первый вариант до конца: он был спроектирован полностью.",
        wrong: "Сроки разработки под него выросли до неприемлемых. Красивое решение, которое команда не успевает собрать, решением не является.",
        out: "Переделал всё целиком. След остался в файле Figma: на страницах чата, источников и настроек рядом лежат старая и новая версии, и видно, от чего отказались.",
        changed: "Скорость сборки — такое же свойство дизайна, как красота. Когда дизайн делается быстро, а разработка живая и с ограниченным бюджетом, узким местом становится она. Проектировать приходится с оглядкой на то, из чего и за сколько это соберут.",
      },
    ],
  },
  results: {
    lead: "Что осталось после проекта.",
    points: [
      "Дизайн-система с нуля: общие настройки оформления, три семейства шрифтов, детали интерфейса со всеми состояниями, витрины и документация",
      "Двенадцать страниц макета: чат, лента, память, источники, настройки, первое знакомство, плюс страницы с вариантами и черновиками",
      "Разработчики получают работу через Storybook: это рабочие детали интерфейса, а не картинки с описаниями",
      "За соблюдением дизайн-системы следит программа. Цвет или размер, вписанный от руки, и чужой шрифт останавливают приём кода. Правило одно для агентов и для людей",
    ],
    honesty:
      "Продуктовых цифр в этом кейсе нет. Показываю только то, что могу подтвердить файлом Figma, кодом на GitHub и Storybook. Результаты тестов описаны словами, без процентов.",
  },
  takeaways: [
    "Когда команда состоит из агентов, лиду почти не нужно объяснять и ждать. Время уходит на другое: сформулировать правило так, чтобы его нельзя было понять двояко, и решить, что считать хорошим результатом.",
    "Агент не спорит, и это опаснее, чем кажется. Живой дизайнер спросит «а зачем?», и половина плохих идей на этом вопросе умирает. Агент сделает молча и хорошо. Поэтому «а зачем?» приходится спрашивать у себя самому.",
    "Любой договорённости нужен сторож, который не зависит от доброй воли. Пока дизайн-система была словами, её нарушали все, включая меня. Когда её стала проверять программа при приёме кода, спор закончился за один день.",
  ],
  quote: "Набор готовых деталей можно не заметить. Проверку, которая не пропускает код, не заметить нельзя.",
  gallery: [
    {
      kind: "spot",
      title: "Один ответ, пять решений о доверии",
      image: img(G + "03.webp", 1024, 922, "Ответ помощника с источниками, записью в память и карточкой действия"),
      spots: [
        { x: 56.5, y: 11.9, text: "«Собрал контекст — 4 источника»: шаги рассуждения свёрнуты в одну строку", decision: "reasoning" },
        { x: 27.5, y: 15.3, text: "Ответ начинается с вывода", decision: "conclusion" },
        { x: 60.5, y: 28, text: "Метки источников: Telegram, Gmail, Notion", decision: "conclusion" },
        { x: 78, y: 33.3, text: "«Не запоминать» стоит рядом с тем, что запомнено", decision: "memory" },
        { x: 29.6, y: 62.7, text: "«Без вашего подтверждения не отправлю» написано прямо на карточке", decision: "confirm" },
      ],
    },
    {
      kind: "compare",
      title: "До отправки и после: действие можно вернуть",
      before: img(G + "03.webp", 1024, 922, "До отправки: карточка ждёт решения"),
      after: img(G + "06.webp", 1024, 772, "После отправки: «Отменить» сверху и «Вернуть» в переписке"),
      labels: ["Ждёт подтверждения", "Отправлено · можно отменить"],
    },
    {
      kind: "bento",
      title: "Остальные экраны",
      images: [
        img(G + "t-chat-attach.webp", 1024, 640, "Чат с вложением"),
        img(G + "07.webp", 1024, 128, "Шаги рассуждения показывают, чем система занята во время паузы", "detail"),
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
    tagline: "I built a design department out of AI agents and took the product from a couple of screens to ready-made interface parts in code.",
    summary:
      "At the start there was an idea, a couple of screens and not a single line of code. I was the only designer on the project. AI agents did the drawing, the assembling and the move into code. Claude worked right inside Figma (through an MCP connection). Finished interface parts went into a shared code repository on GitHub. Developers took them from Storybook, which is a showcase of ready-made parts, and built pages out of them. What stayed with me was the fine-tuning after which a mock-up starts to solve the task.",
    facts: [
      ["Role", "Lead Product Designer"],
      ["Team", "Agents instead of a design department; frontend and backend were people"],
      ["Timeline", "2025 to 2026, deadlines agreed for each task"],
      ["Platform", "Web, dark theme, RU / EN"],
    ],
    tags: ["AI", "Design system", "B2C", "Leadership"],
  },
  kpis: [
    { value: "12", label: "mock-up pages: chat, feed, memory, sources, settings, first-time setup" },
    { value: "4", label: "styling rules. Break any of them and the code is not accepted" },
    { value: "8", label: "interface decisions, each derived from a trait of the product's character" },
    { value: "2", label: "checks: with users and with investors" },
  ],
  context: {
    lead: "An idea, a couple of screens and an empty folder for code.",
    text:
      "GRIF is a personal assistant that comes to you first. It connects to your mail, messengers, calendar and finances. It notices that something needs doing and brings a ready-made action. The person does not have to phrase anything. They only agree or decline.\n\nAn ordinary chat waits for a question, and the person is responsible for how it is phrased. An assistant that comes by itself takes someone's attention every time. Picture a colleague who walks up to your desk: if he comes over trifles, you will start avoiding him. So the main question of the whole design was this: when does the system have the right to speak up.",
    constraints: [
      { title: "An idea and a small sketch", text: "A product concept in words and a couple of screens. It was more an illustration of a thought than a mock-up." },
      { title: "Not a single line of code", text: "There was no website and there were no ready-made interface parts. The folder for code was empty." },
      { title: "No design system and no shared settings", text: "There was no set of colours, no typefaces and no rules for placing elements. Only wishes about how it should look." },
      { title: "A real team and a limited budget", text: "The developers needed something to work with regularly and in a clear form. Their time cost money, and so did their idle time." },
    ],
    myRole:
      "Lead Product Designer. There was no design department, so I put together a team of agents and worked with it the way you work with people. I set tasks, accepted work, sent it back for rework and answered to the business for quality. A deadline was agreed for each task separately, so every round ended with something that could be passed on.",
  },
  approach: {
    lead: "First I described the product's character, then I derived the interface from it.",
    text:
      "The first thing I did was write down what character the product has. The reason was practical. When an agent does the work, the request \"make it calm and premium\" does not work. An agent follows a rule very well and guesses taste badly. It is like a recipe: \"salt to taste\" does not help a beginner, and \"a teaspoon of salt\" does. Taste had to become rules, or we would argue every time about what \"calm\" means.\n\nThe character got a name: the Quiet Strategist. Its formula: \"the part of your mind that already thought it through while you were busy\". It does not panic, speaks once, respects silence and earns trust by being precise. It will not say \"Great question!\". It will say \"Your brief for the meeting with Sergey is ready. Open it?\".",
    rules: [
      { trait: "Never rushes", rule: "Animations last 120 to 200 ms and change only opacity and colour. Nothing bounces, and no button swells." },
      { trait: "Speaks once", rule: "The system shows one guess at a time: one line between two points. There is no web of connections on the screen." },
      { trait: "Silence is a message too", rule: "There is no spinning loader and no \"typing…\" label. A status line takes their place: \"Watching, quiet right now\"." },
      { trait: "Trust through precision", rule: "Under every answer sit the labels of the sources it was built from. The system is saying: \"this is where I got it\"." },
      { trait: "Makes no noise", rule: "One blue accent per screen, everything else in shades of grey. Where the blue is, that is where to look." },
    ],
    refusals: [
      "Choosing a model and its settings. If you have to tune the assistant's brain, it stops being the one who already did the thinking for you.",
      "Folders and projects. They hand back to the person the tidying-up work the assistant was supposed to take away.",
      "Waking it by voice with a code word. Something that listens all the time cannot respect silence.",
      "The \"typing…\" label. It imitates a human where you can honestly show what the system is reading right now.",
    ],
  },
  research: {
    lead: "We checked in two ways: with users and with investors.",
    methods: [
      {
        kind: "Tests and interviews",
        title: "The usual check",
        question: "Does a person understand what the system is doing now, what it has already done, and how to undo it?",
        sample: "User tests and interviews on the finished parts of the product",
        finding:
          "Trust rarely breaks from one big mistake. More often small unclear things wear it down: where the system got this from, what it has already done, how to undo it. So almost every decision in the interface answers one of two questions: \"can I see what is going on\" and \"can I take it back\".",
      },
      {
        kind: "Competitor review",
        title: "What people are already used to",
        question: "What can people already do after ChatGPT, Claude and Alice, and what will we have to teach?",
        sample: "ChatGPT, Claude, Alice (Yandex's voice assistant), neighbouring services and other teams' design files",
        finding:
          "A chat as the first screen is familiar to everyone. A feed where the system suggests things by itself is not. On the first screen it looks like one more inbox. So the chat became the main screen, and the feed lives next to it.",
      },
      {
        kind: "Investor run",
        title: "The rare check",
        question: "Will a person who sees the product for the first time get what it is about in a few minutes?",
        sample: "Investors went through real tasks in the finished part of the product",
        finding:
          "After this run the investors decided whether to keep working with us. Ease of use was only part of the answer. The interface got a second job: let the person finish the task and, in those same minutes, show how the product works. That is where the plain captions came from: \"Gathered context, 4 sources\" and \"I won't send this without your OK\".",
      },
      {
        kind: "Consistency audit",
        title: "An agent walks the whole user path",
        question: "Are the same things called the same names? Is there an error message and a way back everywhere?",
        sample: "The whole service flow, as a separate pass",
        finding:
          "This is dull work. A person does it badly by the seventh screen and does not do it at all by the twentieth. The agent walked the whole path and compared the names, the error messages and the ways back.",
      },
      {
        kind: "Figma file audit",
        title: "The main file was not telling the truth",
        question: "Do the declared styles match what is really used in the mock-ups?",
        sample: "A twelve-page kit read through MCP",
        finding:
          "The agent compared the styles that were declared with the ones really in use. It turned out that the page with light colours was left over from somebody else's template. We learned this while taking the file apart, and not when developers were already building pages.",
      },
    ],
    hypotheses: {
      intro: "Three assumptions about trust that we checked in both ways. The wording comes from the interface decisions. I have no numbers for them.",
      items: [
        { text: "If the pause shows what the system is reading, a person double-checks the answer less often.", verdict: "Step-by-step reasoning" },
        { text: "If the card says what the system will not do without asking, the fear \"it will get it wrong and send it anyway\" goes away.", verdict: "Action card" },
        { text: "If something sent can be undone, people confirm more boldly.", verdict: "Undo and \"Recall\"" },
      ],
    },
  },
  decisions: {
    lead: "Behind every decision there is a trait of character you can say out loud. A product that acts by itself runs on trust. So almost all the decisions answer two questions: can I see what is going on, and can I take it back.",
    items: [
      {
        id: "chat-home",
        title: "The first screen is a chat, and the feed sits next to it",
        found: "The feed where the system suggests things to do is the most striking idea in the product. It was very tempting to put it on the first screen. But the feed tells you what the system noticed, and a person arrives with a task of their own.",
        did: "I made the chat the first screen: a greeting, an input field and three prompts for typical jobs. The feed is the neighbouring section and comes forward by itself when it has something to say.",
        effect: "A person does not have to sort through someone else's to-do list at the door. The system can still start the conversation, but it does not talk over the person.",
        why: "The assistant has the right to speak first. It does not need the whole first screen for that.",
        basis: "Competitor review: a chat at the entrance is familiar, and a feed at the entrance looks like one more inbox.",
        image: img(G + "01.webp", 1024, 640, "First screen: a chat with a greeting, an input field and three prompts", "hero"),
      },
      {
        id: "reasoning",
        title: "Reasoning steps in place of a loader",
        found: "An assistant that reads mail, calendar and chats does not answer at once. A spinning loader at that moment only says \"wait\", and the pause feels longer.",
        did: "During the pause you see what the system is doing right now: \"Opened the calendar and the chat with the attendee, collecting what was agreed\". Then the steps fold into one line with the result.",
        effect: "By the time the answer arrives the person already knows what it rests on, and double-checks it less often.",
        why: "This is the trait \"silence is a message too\": the system shows its work. If the steps show that it went the wrong way, it gets stopped before it finishes.",
        basis: "Tests: \"I can't tell where it got this\" is the first reason for distrust.",
        image: img(G + "t-chat-reasoning-steps.webp", 1024, 226, "Expanded reasoning steps: the assistant shows what it is studying and marks a step as Done", "detail"),
      },
      {
        id: "conclusion",
        title: "The conclusion first, the sources after",
        found: "An assistant easily slides into retelling what it did: \"I looked, then I studied, then I found\". A person needs the conclusion. The reasons are needed only if the conclusion raised a doubt.",
        did: "The answer opens with the result: \"The brief is ready. The key points in a minute, and I drafted a follow-up\". Under it is a \"Based on\" line with source labels: Telegram, Gmail, Notion.",
        effect: "People started checking selectively. A person reads the conclusion and goes to the sources only if something bothers them.",
        why: "Source labels work like a signature under a statement. When a product acts on your behalf, the most important thing is to know where a fact came from.",
        image: img(G + "04.webp", 1024, 300, "The conclusion first, under it the source labels and a memory note you can decline", "detail"),
      },
      {
        id: "confirm",
        title: "Nothing goes out without your confirmation",
        found: "A person's main fear with an assistant like this: \"it will get it wrong and send it anyway\". One case like that, and nobody uses the product again.",
        did: "Any action that goes out arrives as a card: who to, subject, draft text and three buttons, \"Edit\", \"Decline\", \"Send\". Next to them it says plainly: \"I won't send this without your OK\".",
        effect: "The product's promise can be checked right on the screen. What the system can and cannot do without asking is visible before anything happens.",
        why: "First you have to prevent the mistake: something that cannot be taken back should not happen in one move. And a promise hidden in the settings does not work as a promise.",
        basis: "Investor run: the caption on the card explains the product in seconds.",
        deepDive: "rework-validation",
      },
      {
        id: "undo",
        title: "Sent, but not too late",
        found: "Confirmation takes away only half of the fear. A person confirms quickly and often gets it wrong at that very moment. And then they are left alone with a sent email.",
        did: "After sending, \"Email sent. Undo\" appears at the top, and an entry with a \"Recall\" button stays in the conversation.",
        effect: "A mistake costs less, and confirming is not so scary. When you can take it back, people decide more boldly.",
        why: "People stop reading warnings by the third time, and undo always works. The entry in the conversation is also a trace: you can see what the system did on your behalf.",
      },
      {
        id: "document",
        title: "An answer you can edit like a document",
        found: "A draft email inside a chat message is awkward to edit. It sits in a stream of replies, and you want to edit it as ordinary text, with \"to\" and \"subject\" fields.",
        did: "The \"Edit\" button opens a side panel where the email looks like an ordinary document. The chat stays in place and is visible on the left.",
        effect: "To fix an email you no longer have to argue with the assistant: \"no, say it differently\".",
        why: "A chat message is a reply, and an email is a thing. It is odd to explain in words what you can fix by hand.",
        image: img(G + "05.webp", 1024, 640, "Side panel: the email is edited like a document, and the chat stays in place"),
      },
      {
        id: "memory",
        title: "A memory you can say no to",
        found: "An assistant that collects knowledge about you also remembers things it should not. What it remembered silently will come up a month later, and the person will not understand how the system knows it.",
        did: "The system shows every note at the moment it makes it: \"Noted: don't mention competitor X around Sergey\". A \"Don't remember\" button sits right next to it. The \"Memory\" section shows everything collected so far.",
        effect: "Memory became an open agreement. You can refuse a note in the same place where you learned about it.",
        why: "The button has to stand where the information is. To find a setting in a separate section, you first have to guess that there is something to cancel.",
      },
      {
        id: "feed",
        title: "The feed: one card, one question",
        found: "Suggestions from the system easily turn into a stream of notifications. Then people stop reading them at all.",
        did: "A card holds one observation, one deadline and one question: \"Remind you?\", \"Shall I book it?\". There is always a \"Later\" button. The card shows its state: awaiting a decision, in progress, done, error.",
        effect: "You can go through the feed one card at a time and stop at any moment. If something failed, the card stays in the feed with the reason and a \"retry\" button.",
        why: "This is the trait \"speaks once\" applied to a list. A card with two questions gets put off as a whole.",
        image: img(G + "02.webp", 1024, 268, "The feed: each card holds one suggestion and one question, in four states"),
        deepDive: "pipeline",
      },
    ],
  },
  split: {
    title: "The agent draws, the human decides whether it came out well.",
    left: {
      name: "Agent",
      items: [
        "Takes the Figma file apart: interface parts, their variants, styles and mismatches",
        "Keeps the shared styling settings (tokens): colours, typefaces, corner radii, shadows, spacing",
        "Draws interface parts, their states and whole screens",
        "Moves interface parts into code",
        "Builds the design system showcases and the internal documentation",
        "Checks the whole user path for consistency",
      ],
    },
    right: {
      name: "Human",
      items: [
        "The product's character and the rules that follow from it",
        "What we do and in what order",
        "Fine-tuning until the work solves the business task",
        "Acceptance: what goes to the developers and what goes back for rework",
        "Defending decisions in front of the client and investors",
        "Refusals: what the product will not have, and why",
      ],
    },
    why: "The line does not run along how hard a task is. It runs along whether you can say in advance what counts as the right answer. If you can, the task goes to the agent. If the answer is clear only once you see the result, the task stays with the human. You cannot answer \"is this calm enough\" in advance.",
  },
  mistakes: {
    lead: "The first version of the product had to be thrown away whole.",
    items: [
      {
        title: "I designed a version the team could not build in time",
        decided: "To take the first version to the end: it had been designed in full.",
        wrong: "The development time for it grew beyond what was acceptable. A beautiful solution the team cannot build in time is not a solution.",
        out: "I redid all of it. The trace is still in the Figma file: on the chat, sources and settings pages the old and new versions lie side by side, and you can see what was given up.",
        changed: "How fast something can be built is as much a property of a design as how it looks. When design is fast and development is real people on a limited budget, development becomes the bottleneck. You have to design with an eye on what it will be built from and how long that takes.",
      },
    ],
  },
  results: {
    lead: "What is left after the project.",
    points: [
      "A design system from scratch: shared styling settings, three type families, interface parts with every state, showcases and documentation",
      "Twelve mock-up pages: chat, feed, memory, sources, settings, first-time setup, plus pages with variants and drafts",
      "Developers get the work through Storybook: working interface parts, and not pictures with descriptions",
      "A program watches over the design system. A colour or size typed in by hand, or a foreign typeface, stops the code from being accepted. The rule is the same for agents and for people",
    ],
    honesty:
      "This case has no product numbers. I show only what I can back up with the Figma file, the code on GitHub and Storybook. The test results are described in words, without percentages.",
  },
  takeaways: [
    "When the team is made of agents, a lead hardly has to explain and wait. The time goes elsewhere: phrasing a rule so it cannot be read two ways, and deciding what counts as a good result.",
    "An agent does not argue, and that is more dangerous than it seems. A human designer asks \"what for?\", and half of the bad ideas die on that question. An agent will do it silently and well. So you have to ask yourself \"what for?\".",
    "Any agreement needs a guard that does not depend on goodwill. While the design system was words, everyone broke it, me included. Once a program started checking it when code is accepted, the argument ended in a day.",
  ],
  quote: "You can overlook a set of ready-made parts. You cannot overlook a check that will not let your code through.",
  gallery: [
    {
      kind: "spot",
      title: "One answer, five decisions about trust",
      image: img(G + "03.webp", 1024, 922, "An assistant answer with sources, a memory note and an action card"),
      spots: [
        { x: 56.5, y: 11.9, text: "\"Gathered context, 4 sources\": the reasoning steps are folded into one line", decision: "reasoning" },
        { x: 27.5, y: 15.3, text: "The answer opens with the conclusion", decision: "conclusion" },
        { x: 60.5, y: 28, text: "Source labels: Telegram, Gmail, Notion", decision: "conclusion" },
        { x: 78, y: 33.3, text: "\"Don't remember\" sits right next to what was noted", decision: "memory" },
        { x: 29.6, y: 62.7, text: "\"I won't send this without your OK\" is written on the card itself", decision: "confirm" },
      ],
    },
    {
      kind: "compare",
      title: "Before and after sending: the action can be taken back",
      before: img(G + "03.webp", 1024, 922, "Before sending: the card awaits a decision"),
      after: img(G + "06.webp", 1024, 772, "After sending: \"Undo\" at the top and \"Recall\" in the conversation"),
      labels: ["Awaiting your OK", "Sent · can be undone"],
    },
    {
      kind: "bento",
      title: "More screens",
      images: [
        img(G + "t-chat-attach.webp", 1024, 640, "Chat with an attachment"),
        img(G + "07.webp", 1024, 128, "Reasoning steps show what the system is busy with during the pause", "detail"),
      ],
    },
  ],
  deepDives: tracksEn["grif-ai"].tracks,
};
