/* v102: описание кейса в карточке холма — по тому же принципу, что у пэт-проектов (notes.ts): свой штриховой значок,
   три цифры и три абзаца «что было → что я сделал → что вышло». До этого у кейса была одна цифра и подзаголовок, и
   рядом с Marathon или Meadow Walk карточка выглядела недописанной. Тексты и цифры — со страницы самого кейса
   (stories/*.ts: контекст, роль, «Результат»), ничего нового. glyph — содержимое svg с viewBox 0 0 64 64 */
import { getLang } from "../i18n";
import type { CaseStat } from "./cases";

type Copy = { stats: [CaseStat, CaseStat, CaseStat]; points: [string, string, string] };
type Card = { glyph: string; en: Copy; ru: Copy };

const cards: Record<string, Card> = {
  "grif-ai": {
    /* реплика ассистента с искрой */
    glyph: '<path d="M10 14h44v28H30l-10 9v-9H10z"/><path d="M32 20v16M24 28h16"/>',
    en: {
      stats: [{ value: "5 days", label: "from idea to a feature in code" }, { value: "87%", label: "unassisted task success rate" }, { value: "1", label: "designer on the whole product" }],
      points: [
        "GRIF is an assistant that speaks first. It connects to mail, messengers, the calendar and finances, notices when it's time to act and brings a ready solution. The person only has to say yes or no.",
        "The budget was small, so I built the design department out of AI agents. I prepared the design system and the instructions, connected Figma to Claude and set up a pipeline all the way to code. Agents draw screens and components, I set the task and accept the work.",
        "A new feature gets from idea to code in five days, down from three weeks. In usability tests people completed 87% of tasks without a hint.",
      ],
    },
    ru: {
      stats: [{ value: "5 дней", label: "от идеи до фичи в коде" }, { value: "87 %", label: "задач выполнено без подсказки" }, { value: "1", label: "дизайнер на весь продукт" }],
      points: [
        "GRIF — ассистент, который приходит первым. Он подключается к почте, мессенджерам, календарю и финансам, сам замечает, что пора действовать, и приносит готовое решение. Человеку остаётся согласиться или отказаться.",
        "Бюджет был маленький, поэтому дизайн-отдел я собрал из ИИ-агентов. Подготовил дизайн-систему и инструкции, подключил Figma к Claude и настроил конвейер до кода. Агенты рисуют экраны и компоненты, я ставлю задачу и принимаю работу.",
        "Новая фича доходит от идеи до кода за пять дней, раньше на это уходило три недели. На юзабилити-тестах люди выполнили без подсказки 87% задач.",
      ],
    },
  },
  community: {
    /* два дома — город */
    glyph: '<path d="M8 52V30l12-10 12 10v22"/><path d="M32 52V24l12-10 12 10v28"/><path d="M6 52h52"/><path d="M17 52v-9h6v9"/>',
    en: {
      stats: [{ value: "250+", label: "residents' stories in three months" }, { value: "~26%", label: "bounce rate" }, { value: "12–15%", label: "of readers come back within a week" }],
      points: [
        "In a couple of years almost every outlet about city life in Moscow closed. The city needed a place where both the editors and residents write about it, and every text goes through moderation before it's published.",
        "I designed stories.mos.ru from scratch: research, site structure, a clickable prototype, the design system, the first version and the launch. It all took nine months.",
        "In the first three months residents wrote over 250 stories. The bounce rate is about 26%, so roughly three in four visits go past the first page. 12–15% of readers come back within a week.",
      ],
    },
    ru: {
      stats: [{ value: "250+", label: "историй жителей за три месяца" }, { value: "~26 %", label: "отказов (bounce rate)" }, { value: "12–15 %", label: "читателей возвращаются за неделю" }],
      points: [
        "За пару лет в Москве закрылись почти все издания о городской жизни. Городу нужно было место, где о нём пишут и редакция, и сами жители, а каждый текст перед публикацией проходит модерацию.",
        "Я спроектировал stories.mos.ru с нуля: исследование, структура сайта, кликабельный прототип, дизайн-система, первая версия и запуск. На всё ушло девять месяцев.",
        "За первые три месяца жители написали больше 250 историй. Отказов около 26%: примерно три четверти визитов проходят без отказа. В течение недели на сайт возвращаются 12–15% читателей.",
      ],
    },
  },
  "ai-agents": {
    /* щит с галочкой — проверенный риск */
    glyph: '<path d="M32 8l20 7v14c0 13-9 22-20 27-11-5-20-14-20-27V15z"/><path d="M24 32l6 6 11-12"/>',
    en: {
      stats: [{ value: "6 → 0", label: "manual handoffs" }, { value: "4 → 1", label: "steps before the first assessed risk" }, { value: "4", label: "departments review the risks" }],
      points: [
        "At Sber every AI agent has several versions, and four departments review the risks of each one. The assessment went through Jira, Excel and email, and documents were passed from hand to hand like a relay baton.",
        "I mapped the whole approval chain and turned it into one product. Documents are uploaded once, the risk draft appears right in the product, and a \"not applicable\" decision can't be accepted without a reason.",
        "There used to be six manual handoffs on the assessment route, now there are none. Preparation before the first assessed risk went from four steps to one.",
      ],
    },
    ru: {
      stats: [{ value: "6 → 0", label: "ручных передач" }, { value: "4 → 1", label: "шагов до первого оценённого риска" }, { value: "4", label: "подразделения проверяют риски" }],
      points: [
        "В Сбере у каждого ИИ-агента несколько версий, и риски каждой разбирают четыре подразделения. Оценка шла через Jira, Excel и переписку: документы передавали из рук в руки, как эстафетную палочку.",
        "Я восстановил всю цепочку согласования и превратил её в один продукт. Документы загружаются один раз, черновик рисков появляется прямо в продукте, а решение «не применим» нельзя принять без причины.",
        "Ручных передач на пути оценки было шесть, стало ноль. Подготовка до первого оценённого риска сократилась с четырёх шагов до одного.",
      ],
    },
  },
  "moderator-dashboard": {
    /* список, который разбирают галочками */
    glyph: '<rect x="10" y="10" width="44" height="44" rx="6"/><path d="M18 24l4 4 7-7"/><path d="M35 25h11"/><path d="M18 40l4 4 7-7"/><path d="M35 41h11"/>',
    en: {
      stats: [{ value: "−38%", label: "average handling time" }, { value: "4.3 of 5", label: "ease of use for moderators" }, { value: "8", label: "moderators in the test" }],
      points: [
        "Community residents wrote more and more, and comments, posts and complaints were handled by one administrator in a shared admin panel. The same one where the whole site is configured.",
        "I took the admin panel apart, tested two differently built prototypes with moderators and made the moderator a separate role. Routine gets decided right in the list, doubtful cases open in detail.",
        "After the update, moderating one item takes 38% less time on average. In a test after launch, moderators rated ease of use 4.3 of 5.",
      ],
    },
    ru: {
      stats: [{ value: "−38 %", label: "времени на модерацию (AHT)" }, { value: "4,3 из 5", label: "удобство по оценке модераторов" }, { value: "8", label: "модераторов на тесте" }],
      points: [
        "Жители «Сообщества» писали всё больше, а комментарии, публикации и жалобы разбирал один администратор в общей админке. Там же, где настраивается весь сайт.",
        "Разобрал админку по шагам, проверил на модераторах два прототипа, устроенных по-разному, и выделил модератора в отдельную роль. Рутину он решает прямо в списке, сомнительное открывает подробно.",
        "После обновления кабинета среднее время модерации одного объекта сократилось на 38%. На тесте после запуска модераторы оценили удобство на 4,3 из 5.",
      ],
    },
  },
  "plati-chastyami": {
    /* покупка, поделённая на четыре платежа */
    glyph: '<circle cx="32" cy="32" r="22"/><path d="M32 10v44M10 32h44"/><path d="M36 14a18 18 0 0114 14"/>',
    en: {
      stats: [{ value: "5 → 0", label: "steps to the answer" }, { value: "1 tap", label: "to move a payment to payday" }, { value: "3", label: "rules the concept grew from" }],
      points: [
        "Instalments in banks are growing, but people don't trust them: a 2.8 of 5 rating and the same complaints about unclear charges and fines. To find out how much to pay and when, you had to go five steps deep.",
        "I went through screen recordings of the live app frame by frame and built a concept: the debt status on the home screen, moving a payment to payday in one tap, and a shop window that hides when the budget is overloaded.",
        "In the concept, the answer to \"how much and when do I pay\" is visible right away, without a single step. The bank sees both salary and spending, so it can honestly say \"you can't afford this now\".",
      ],
    },
    ru: {
      stats: [{ value: "5 → 0", label: "переходов до ответа" }, { value: "1 тап", label: "чтобы перенести платёж к зарплате" }, { value: "3", label: "правила, из которых вырос концепт" }],
      points: [
        "Рассрочка в банках растёт, а доверия к ней нет: оценка 2,8 из 5 и одни и те же жалобы на непонятные списания и штрафы. Чтобы узнать, сколько и когда платить, нужно было пройти пять переходов.",
        "Я разобрал записи экрана живого приложения по кадрам и собрал концепт: статус долга на главном экране, перенос платежа к зарплате в один тап и витрина, которая прячется, когда бюджет перегружен.",
        "В концепте ответ «сколько и когда я плачу» виден сразу, без единого перехода. Банк видит и зарплату, и траты, поэтому может честно сказать «сейчас не потянешь».",
      ],
    },
  },
  "restaurant-guru": {
    /* метка на карте с вилкой */
    glyph: '<path d="M32 56S16 41 16 28a16 16 0 0132 0c0 13-16 28-16 28z"/><path d="M27 19v8a5 5 0 0010 0v-8"/><path d="M32 19v18"/>',
    en: {
      stats: [{ value: "1 → 3–4", label: "places in view" }, { value: "27", label: "public studies behind the decisions" }, { value: "6", label: "decisions, each from the audit" }],
      points: [
        "The home screen of a restaurant app has three jobs: find a known place by name, browse collections, or describe in words what you want. The old screen mixed them up and showed one venue, and the guide hid as an icon in the corner.",
        "I built the new screen around these three jobs and put the guide in the middle of the bottom bar, where the thumb reaches. There were no users of my own to test with, so every decision rests on a public study.",
        "The concept fits three or four places in view, up from one, and closed venues no longer take the best rows. The guide finds a place from a phrase like \"quiet, with a terrace, for two\".",
      ],
    },
    ru: {
      stats: [{ value: "1 → 3–4", label: "места в кадре" }, { value: "27", label: "публичных исследований в основе" }, { value: "6", label: "решений, каждое из аудита" }],
      points: [
        "У главного экрана агрегатора три задачи: найти знакомое место по названию, полистать подборки или описать словами, что хочется. Старый экран мешал их в кучу и показывал одно заведение, а гид прятался иконкой в углу.",
        "Экран я пересобрал под эти три задачи и поставил гида в центр нижней панели, куда дотягивается большой палец. Своих пользователей не было, поэтому каждое решение опирается на публичное исследование.",
        "В концепте в кадре три-четыре места, а было одно, и закрытые заведения не занимают лучшие строки. Гид подбирает место по фразе вроде «тихо, с верандой, на двоих».",
      ],
    },
  },
};

/** описание кейса для карточки холма на текущем языке; значок от языка не зависит */
export function caseCard(id: string): (Copy & { glyph: string }) | undefined {
  const c = cards[id];
  return c && { glyph: c.glyph, ...(getLang() === "en" ? c.en : c.ru) };
}
