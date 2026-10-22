/* v115: живой прототип кейса «Риски ИИ-агентов» — внутренний веб-продукт риск-менеджера, собран по кадрам Figma
   XomA0T1zFMATidI4Qq5nEw: 20:2 реестр, 27:270 карточка до оценки, 28:186 разбор, 28:405 черновик, 30:2 карточка риска,
   30:332 правка, 31:445 / 31:565 / 31:736 «не применим», 31:1009 / 31:1125 восстановление, 29:723 «Хотите покинуть форму?».
   Размеры, цвета, радиусы и иконки — из макета; шрифт макета Golos Text, пока его нет на сайте — Onest.
   Путь: реестр → карточка агента → «Загрузить архив» → разбор с прогрессом и скелетонами → черновик из 13 рисков →
   карточка риска → «Редактировать» → уровень и обязательное обоснование → «Сохранить» → итог.
   Ветки из макета: «Не применим» с обязательной причиной и «Восстановить риск», вопрос при уходе из недописанной формы.
   Шаги — prototype.steps в ai-agents.ru.ts / .en.ts (7 шагов, последний — итог). Тексты интерфейса — по-русски в обоих языках.
   Данные демо, как на скриншотах кейса: первые четыре риска — из макета, остальные девять дописаны под список из 13. */
import type { LiveProto } from "./types";
import "./agents.css";

type Lvl = "vhigh" | "high" | "mid" | "low" | "none" | "na";
type Risk = {
  id: string; t: string; model: Lvl; short: string; brief: string; full: string; basis: string;
  lvl: Lvl; done: boolean; note: string; who: string; prev: Lvl; hist: [string, string][];
};
type Overlay = null | "card" | "edit";
type Modal = null | "na" | "restore" | "leave";

const LVL: Record<Lvl, string> = { vhigh: "Очень высокий", high: "Высокий", mid: "Средний", low: "Низкий", none: "Нет оценки", na: "Не применим" };

/* 13 типов рисков версии: первые четыре — из кадра 28:405, остальные — демо-данные под тот же список */
const RISKS: [string, Lvl, string][] = [
  ["Отказ инфраструктуры ИИ-платформ и сервисов", "high", "В августе 2022 закупили лицензии ПО Vendor A, но ключи так и не передали, и платформу не ввели в эксплуатацию"],
  ["Взаимное влияние ИИ-решений на едином ландшафте", "mid", "Агент делит пул GPU с тремя агентами продаж, и пики нагрузки у них совпадают"],
  ["Прямые промпт-инъекции и манипуляции выводом модели", "high", "Агент принимает свободный текст клиента и передаёт его в модель без фильтрации"],
  ["Уязвимости конфигурации и цепочки поставок", "low", "Модель и библиотеки из внутреннего каталога, версии зафиксированы"],
  ["Утечка персональных данных через контекст модели", "high", "В диалог попадают паспортные данные и номера карт, маскирования на входе нет"],
  ["Недостоверные ответы клиенту", "mid", "Ответы о тарифах собираются из базы знаний, сверки с действующими условиями нет"],
  ["Непрозрачность решений агента", "mid", "Логи хранят ответ, но не цепочку шагов, по которой агент к нему пришёл"],
  ["Деградация качества после обновления модели", "low", "Перед каждым релизом прогоняется регрессионный набор из 400 диалогов"],
  ["Избыточная автономность действий", "mid", "Агент сам назначает звонок клиенту, подтверждение сотрудника не требуется"],
  ["Косвенные инъекции через загруженные документы", "low", "Агент читает только документы из внутреннего хранилища"],
  ["Зависимость от внешнего поставщика модели", "high", "Модель одного вендора, резервного поставщика в договоре нет"],
  ["Несоответствие требованиям регулятора к ИИ", "low", "Агент не принимает решений по кредитам и не влияет на скоринг"],
  ["Сбои интеграции с банковскими системами", "mid", "При таймауте CRM диалог обрывается без сообщения клиенту"],
];
const FULL0 = "В августе 2022 года по сублицензионному договору закупили лицензии ПО Vendor A, но файловые ключи и документы так и не передали, поэтому платформу не ввели в эксплуатацию. Если агент переедет на резервную платформу, нагрузка на неё вырастет вдвое.";
const BRIEF0 = "Лицензии Vendor A закупили, ключи не передали, платформу в эксплуатацию не ввели.";
const BASIS0 = "БТ агента, раздел 4.2 · архитектурная схема · договор № 17-СЛ";
const SAMPLE0 = "Агент уже работает на резервной платформе в контуре банка, 18.09 он прошёл нагрузочный тест. Остаточный риск средний.";
const WHO = "Королёва Мария, риск-менеджер · 26.09.2025, 14:32";

/* реестр — четыре строки кадра 20:2 */
const AGENTS = [
  { id: "a1", t: "Агент планирования диалога с клиентом", ci: "CI10000001", div: "Дивизион «Операции»", fn: "Продажи", st: ["wait", "Ожидает оценки"], lvl: "" },
  { id: "a2", t: "ИИ-агент регистрации самозанятых в сервисе «Сам себе дело»", ci: "CI10000002", div: "Дивизион «Операции»", fn: "Продажи", st: ["ok", "Согласовано"], lvl: "high" },
  { id: "a3", t: "Агент сервисов розыска", ci: "CI10000003", div: "Розничное взыскание", fn: "Проблемные активы", st: ["work", "Оценка"], lvl: "" },
  { id: "a4", t: "Credit cards.Debt", ci: "CI10000004", div: "Дивизион «Платежи»", fn: "Кредитные карты", st: ["fix", "Корректировка"], lvl: "mid" },
] as const;

/* иконки из библиотеки макета (Icon / …, обводка 1.75) */
const sv = (vb: number, body: string, cls = "") => `<svg class="la-i ${cls}" width="${vb}" height="${vb}" viewBox="0 0 ${vb} ${vb}" fill="none" aria-hidden="true">${body}</svg>`;
const st = (d: string) => `<path d="${d}"/>`;
const I = {
  home: sv(24, st("M4 10.5L12 4L20 10.5V20H4V10.5Z") + st("M9 20V14H15V20")),
  bolt: sv(24, st("M13 3L5 13.5H11L10 21L18 10.5H12L13 3Z")),
  tasks: sv(24, st("M7 4H17C18.66 4 20 5.34 20 7V17C20 18.66 18.66 20 17 20H7C5.34 20 4 18.66 4 17V7C4 5.34 5.34 4 7 4Z") + st("M8.5 12L11 14.5L16 9.5")),
  pulse: sv(24, st("M7 4H17C18.66 4 20 5.34 20 7V17C20 18.66 18.66 20 17 20H7C5.34 20 4 18.66 4 17V7C4 5.34 5.34 4 7 4Z") + st("M7 12H10L11.5 9L13.5 15L15 12H17")),
  chart: sv(24, st("M5 20V10M5 20H3M5 20H10M10 20V4M10 20H15M15 20V12M15 20H21")),
  doc: sv(24, st("M7 3H17C18.1 3 19 3.9 19 5V19C19 20.1 18.1 21 17 21H7C5.9 21 5 20.1 5 19V5C5 3.9 5.9 3 7 3Z") + st("M9 8H15M9 12H15M9 16H13")),
  scale: sv(24, st("M12 4V8M12 8V20M12 8H5M12 8H19M12 20H8M12 20H16M5 8L2 14C2 15.66 3.34 17 5 17C6.66 17 8 15.66 8 14L5 8ZM19 8L16 14C16 15.66 17.34 17 19 17C20.66 17 22 15.66 22 14L19 8Z")),
  shield: sv(24, st("M12 3L19 6V12C19 16.5 16 19.5 12 21C8 19.5 5 16.5 5 12V6L12 3Z") + st("M9 12L11 14L15 10")),
  target: sv(24, '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3.5"/>'),
  bell: sv(24, st("M6 16V11C6 7.69 8.69 5 12 5C15.31 5 18 7.69 18 11V16L20 18H4L6 16Z") + st("M10 21H14")),
  pie: sv(24, st("M12 3V12H21C21 16.97 16.97 21 12 21C7.03 21 3 16.97 3 12C3 7.03 7.03 3 12 3Z")),
  agent24: sv(24, st("M8 7H16C18.21 7 20 8.79 20 11V16C20 18.21 18.21 20 16 20H8C5.79 20 4 18.21 4 16V11C4 8.79 5.79 7 8 7Z") + st("M9.5 13V14.5M14.5 13V14.5M12 3.5V7")),
  agent: sv(20, st("M6.67 5.83H13.33C15.17 5.83 16.67 7.33 16.67 9.17V13.33C16.67 15.17 15.17 16.67 13.33 16.67H6.67C4.83 16.67 3.33 15.17 3.33 13.33V9.17C3.33 7.33 4.83 5.83 6.67 5.83Z") + st("M7.92 10.83V12.08M12.08 10.83V12.08M10 2.92V5.83"), "is-thin"),
  arrowL: sv(24, st("M19 12H5M11 18L5 12L11 6")),
  back: sv(20, st("M15.83 10H4.17M9.17 15L4.17 10L9.17 5")),
  more: sv(24, '<circle cx="5" cy="12" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="19" cy="12" r="1.2"/>'),
  search: sv(20, st("M15 9.17C15 12.39 12.39 15 9.17 15C5.95 15 3.33 12.39 3.33 9.17C3.33 5.95 5.95 3.33 9.17 3.33C12.39 3.33 15 5.95 15 9.17Z") + st("M16.67 16.67L13.75 13.75")),
  filter: sv(20, st("M3.33 5H11.67M15 5H16.67M3.33 10H6.67M10 10H16.67M3.33 15H13.33") + '<circle cx="13.33" cy="5" r="1.67"/><circle cx="8.33" cy="10" r="1.67"/><circle cx="15" cy="15" r="1.67"/>'),
  sort: sv(20, st("M5.83 3.33V16.67M9.17 13.33L5.83 16.67L2.5 13.33M14.17 16.67V3.33M17.5 6.67L14.17 3.33L10.83 6.67")),
  version: sv(16, st("M4.67 2H11.33C12.07 2 12.67 2.6 12.67 3.33V12.67C12.67 13.4 12.07 14 11.33 14H4.67C3.93 14 3.33 13.4 3.33 12.67V3.33C3.33 2.6 3.93 2 4.67 2Z") + st("M6 5.33H10M6 8H10M6 10.67H8.67")),
  edit: sv(20, st("M3.33 16.67H6.67L15.83 7.5L12.5 4.17L3.33 13.33V16.67Z") + st("M11.25 5.42L14.58 8.75")),
  chevR: sv(20, st("M7.5 5L12.5 10L7.5 15")),
  chevD: sv(20, st("M5 7.5L10 12.5L15 7.5"), "is-thin"),
  close: sv(20, st("M5 5L15 15M15 5L5 15")),
  upload: sv(20, st("M10 13.33V3.33M14.17 7.5L10 3.33L5.83 7.5M4.17 16.67H15.83")),
  info: sv(20, st("M17.5 10C17.5 14.14 14.14 17.5 10 17.5C5.86 17.5 2.5 14.14 2.5 10C2.5 5.86 5.86 2.5 10 2.5C14.14 2.5 17.5 5.86 17.5 10Z") + st("M10 9.17V13.33M10 6.67H10.01")),
  restore: sv(20, st("M3.33 10C3.37 13.67 6.36 16.67 10 16.67C13.68 16.67 16.67 13.68 16.67 10C16.67 6.32 13.68 3.33 10 3.33C8.16 3.33 6.48 4.08 5.25 5.25L3.33 7.08") + st("M3.33 3.33V7.08H7.08")),
  check: sv(20, st("M4.17 10.42L7.92 14.17L15.83 5.83")),
  check16: sv(16, st("M3.33 8.33L6.33 11.33L12.67 4.67"), "is-thin"),
};
const SPARK = (s = 20, white = false) => `<svg class="la-spark" width="${s}" height="${s}" viewBox="0 0 24 24" aria-hidden="true"><path d="M10 4C10.6 8.2 12.8 10.4 17 11C12.8 11.6 10.6 13.8 10 18C9.4 13.8 7.2 11.6 3 11C7.2 10.4 9.4 8.2 10 4Z" fill="${white ? "#fff" : "#2E8BF0"}"/><path d="M18.5 2.5C18.8 4.1 19.5 4.8 21 5C19.5 5.3 18.8 6 18.5 7.5C18.2 6 17.5 5.3 16 5C17.5 4.8 18.2 4.1 18.5 2.5Z" fill="${white ? "#fff" : "#8B5CF6"}"/></svg>`;
const WARN = (s: number) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="12" fill="#FF9500"/><rect x="10.75" y="5.5" width="2.5" height="8" rx="1.25" fill="#fff"/><circle cx="12" cy="17" r="1.5" fill="#fff"/></svg>`;
/* знак уровня: две стрелки, треугольник вверх, ромб, треугольник вниз, пустой круг — форма различает уровни без цвета */
const MARK: Record<Lvl, string> = {
  vhigh: '<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="8" fill="#EE3E32"/><path d="M5 8.5L8 5.5L11 8.5M5 11L8 8L11 11" fill="none" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  high: '<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 5L11.5 10H4.5L8 5Z" fill="#EE3E32"/></svg>',
  mid: '<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 4L12 8L8 12L4 8L8 4Z" fill="#C76A00"/></svg>',
  low: '<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 11L11.5 6H4.5L8 11Z" fill="#646B75"/></svg>',
  none: '<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="7" fill="none" stroke="#DADDE2" stroke-width="1.25"/></svg>',
  na: "",
};
/* знак продукта из макета (Icon / product-logo) — нейтральный, не логотип банка */
const LOGO = '<svg width="32" height="32" viewBox="0 0 32 32" aria-hidden="true"><path d="M16 2L29 14L16 30L3 14L16 2Z" fill="#21C57E"/><path d="M10 13H22L16 21L10 13Z" fill="#fff"/></svg>';
/* Illustration / Архив ждёт загрузки (66:405), 200×150 */
const ILLU = `<svg class="la-illu" aria-hidden="true" width="200" height="150" viewBox="0 0 200 150" fill="none"><g><path d="M100 144C150.81 144 192 116.242 192 82C192 47.7583 150.81 20 100 20C49.1898 20 8 47.7583 8 82C8 116.242 49.1898 144 100 144Z" fill="url(#lvag-paint0_radial_0_161)"/><path d="M100 141C128.719 141 152 138.761 152 136C152 133.239 128.719 131 100 131C71.2812 131 48 133.239 48 136C48 138.761 71.2812 141 100 141Z" fill="#1F2328" fill-opacity="0.08"/><path d="M52 60C52 55.6 55.6 52 60 52H82L90 61H140C144.4 61 148 64.6 148 69V124C148 128.4 144.4 132 140 132H60C55.6 132 52 128.4 52 124V60Z" fill="url(#lvag-paint1_linear_0_161)"/><path d="M110.15 37.055L68.4632 42.1735C65.1742 42.5774 62.8353 45.571 63.2391 48.86L70.0638 104.443C70.4676 107.732 73.4613 110.071 76.7503 109.667L118.437 104.548C121.726 104.144 124.065 101.151 123.661 97.8617L116.837 42.2791C116.433 38.9901 113.439 36.6512 110.15 37.055Z" fill="white" stroke-width="1.5" stroke="#DADDE2"/><path d="M99.4583 48.4429L73.6521 51.6115C72.5557 51.7461 71.7761 52.744 71.9107 53.8403C72.0453 54.9367 73.0432 55.7163 74.1395 55.5817L99.9457 52.4131C101.042 52.2785 101.822 51.2806 101.687 50.1843C101.552 49.0879 100.555 48.3083 99.4583 48.4429Z" fill="#B8BEC6"/><path d="M109.114 57.3325L74.3745 61.5979C73.5522 61.6989 72.9675 62.4473 73.0685 63.2695C73.1694 64.0918 73.9178 64.6765 74.7401 64.5755L109.479 60.3101C110.301 60.2092 110.886 59.4607 110.785 58.6385C110.684 57.8162 109.936 57.2315 109.114 57.3325Z" fill="#E9EBEF"/><path d="M105.996 64.7678L75.2276 68.5457C74.4053 68.6467 73.8206 69.3951 73.9216 70.2174C74.0225 71.0396 74.7709 71.6243 75.5932 71.5234L106.362 67.7454C107.184 67.6445 107.769 66.896 107.668 66.0738C107.567 65.2515 106.819 64.6668 105.996 64.7678Z" fill="#E9EBEF"/><path d="M108.835 71.4719L76.0807 75.4935C75.2584 75.5945 74.6737 76.3429 74.7746 77.1652C74.8756 77.9874 75.624 78.5721 76.4463 78.4712L109.2 74.4495C110.023 74.3485 110.607 73.6001 110.506 72.7779C110.405 71.9556 109.657 71.3709 108.835 71.4719Z" fill="#E9EBEF"/><path d="M142.795 46.6621L101.025 42.2719C97.7298 41.9255 94.7775 44.3163 94.4311 47.6118L88.5775 103.305C88.2311 106.601 90.6219 109.553 93.9175 109.899L135.687 114.29C138.983 114.636 141.935 112.245 142.282 108.95L148.135 53.2564C148.482 49.9608 146.091 47.0084 142.795 46.6621Z" fill="white" stroke-width="1.5" stroke="#DADDE2"/><path d="M125.838 54.9348L103.958 52.6352C102.86 52.5197 101.876 53.3167 101.76 54.4152C101.645 55.5137 102.442 56.4978 103.54 56.6133L125.42 58.9129C126.518 59.0284 127.502 58.2315 127.618 57.1329C127.733 56.0344 126.936 55.0503 125.838 54.9348Z" fill="#B8BEC6"/><path d="M103.176 69.6466C104.824 69.8198 106.3 68.6244 106.473 66.9766C106.646 65.3288 105.451 63.8527 103.803 63.6795C102.155 63.5063 100.679 64.7017 100.506 66.3495C100.333 67.9972 101.528 69.4734 103.176 69.6466Z" fill="#EE3E32"/><path d="M134.974 68.4639L112.1 66.0598C111.276 65.9732 110.538 66.5709 110.451 67.3947C110.364 68.2186 110.962 68.9567 111.786 69.0433L134.66 71.4475C135.484 71.5341 136.222 70.9364 136.309 70.1125C136.395 69.2886 135.797 68.5505 134.974 68.4639Z" fill="#E9EBEF"/><path d="M102.13 79.5918C103.778 79.765 105.254 78.5696 105.428 76.9218C105.601 75.2741 104.405 73.7979 102.758 73.6247C101.11 73.4515 99.6337 74.6469 99.4605 76.2947C99.2873 77.9425 100.483 79.4186 102.13 79.5918Z" fill="#FF9500"/><path d="M129.95 77.991L111.054 76.005C110.23 75.9184 109.492 76.5161 109.406 77.34C109.319 78.1638 109.917 78.9019 110.741 78.9885L129.637 80.9746C130.46 81.0612 131.199 80.4635 131.285 79.6396C131.372 78.8157 130.774 78.0776 129.95 77.991Z" fill="#E9EBEF"/><path d="M101.085 89.537C102.733 89.7102 104.209 88.5148 104.382 86.8671C104.556 85.2193 103.36 83.7431 101.712 83.5699C100.065 83.3967 98.5884 84.5921 98.4152 86.2399C98.242 87.8877 99.4374 89.3639 101.085 89.537Z" fill="#B8BEC6"/><path d="M130.894 88.1453L110.009 85.9502C109.185 85.8636 108.447 86.4613 108.36 87.2852C108.274 88.1091 108.872 88.8472 109.695 88.9338L130.58 91.1289C131.404 91.2154 132.142 90.6178 132.229 89.7939C132.316 88.97 131.718 88.2319 130.894 88.1453Z" fill="#E9EBEF"/><path d="M46 86C46 81.6 49.6 78 54 78H146C150.4 78 154 81.6 154 86L150 124C149.6 128.1 146.1 132 142 132H58C53.9 132 50.4 128.1 50 124L46 86Z" fill="url(#lvag-paint2_linear_0_161)"/><path d="M46 86C46 81.6 49.6 78 54 78H146C150.4 78 154 81.6 154 86" stroke-width="1.5" stroke-linecap="round" stroke="white" stroke-opacity="0.7"/><path d="M109 98H91C89.3431 98 88 99.3431 88 101C88 102.657 89.3431 104 91 104H109C110.657 104 112 102.657 112 101C112 99.3431 110.657 98 109 98Z" fill="white" fill-opacity="0.75"/><path d="M128 44C128.211 43.4723 128.422 42.9557 128.633 42.4501M141 25C140.528 25.283 140.066 25.5926 139.611 25.9298M130.452 38.3794C130.957 37.329 131.465 36.3379 131.978 35.404M134.31 31.6061C134.979 30.6415 135.66 29.7626 136.359 28.9657" stroke-width="2" stroke-linecap="round" stroke="#14A9B5"/><path d="M143 35C150.18 35 156 29.1797 156 22C156 14.8203 150.18 9 143 9C135.82 9 130 14.8203 130 22C130 29.1797 135.82 35 143 35Z" fill="url(#lvag-paint3_radial_0_161)"/><path d="M143 15C143.4 18 144.9 19.5 147.9 19.9C144.9 20.3 143.4 21.8 143 24.8C142.6 21.8 141.1 20.3 138.1 19.9C141.1 19.5 142.6 18 143 15Z" fill="white"/><path d="M36 49C37.6569 49 39 47.6569 39 46C39 44.3431 37.6569 43 36 43C34.3431 43 33 44.3431 33 46C33 47.6569 34.3431 49 36 49Z" fill="#9FD8F5"/><path d="M168 98.5C169.381 98.5 170.5 97.3807 170.5 96C170.5 94.6193 169.381 93.5 168 93.5C166.619 93.5 165.5 94.6193 165.5 96C165.5 97.3807 166.619 98.5 168 98.5Z" fill="#C9BCFB"/><path d="M30 104L31.4 107.1L34.5 108.5L31.4 109.9L30 113L28.6 109.9L25.5 108.5L28.6 107.1L30 104Z" fill="#7FDDB6"/><path d="M170 52L171 54.2L173.2 55.2L171 56.2L170 58.4L169 56.2L166.8 55.2L169 54.2L170 52Z" fill="#9FD8F5"/></g><defs><radialGradient id="lvag-paint0_radial_0_161" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(100 82) scale(92 62)"><stop stop-color="#BFF3DC"/><stop offset="0.55" stop-color="#D9F0FF" stop-opacity="0.7"/><stop offset="1" stop-color="white" stop-opacity="0"/></radialGradient><linearGradient id="lvag-paint1_linear_0_161" x1="52" y1="52" x2="148" y2="128" gradientUnits="userSpaceOnUse"><stop stop-color="#7FDDB6"/><stop offset="1" stop-color="#3FC49A"/></linearGradient><linearGradient id="lvag-paint2_linear_0_161" x1="48" y1="78" x2="152" y2="132" gradientUnits="userSpaceOnUse"><stop stop-color="#B6F0D6"/><stop offset="1" stop-color="#7ED9B5"/></linearGradient><radialGradient id="lvag-paint3_radial_0_161" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(139 17) scale(20)"><stop stop-color="#C9FFE6"/><stop offset="0.35" stop-color="#3ED8A8"/><stop offset="0.7" stop-color="#14A9B5"/><stop offset="1" stop-color="#2D78E8"/></radialGradient></defs></svg>`;

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const badge = (l: Lvl) => `<span class="la-badge la-badge--${l}">${MARK[l]}${LVL[l]}</span>`;
const cut = (s: string, n: number) => (s.length > n ? s.slice(0, n).replace(/\s+\S*$/, "") + "…" : s);

const proto: LiveProto = {
  design: { w: 1100 },
  mount(root, ctx) {
    const calm = ctx.calm;
    /* на телефоне поле само не фокусируем — иначе выскакивает клавиатура и страница прыгает */
    const fine = matchMedia("(pointer: fine)").matches;
    const focusIn = (el: HTMLElement | null) => { if (el && fine) el.focus({ preventScroll: true }); };

    root.innerHTML = `<div class="lv-agents${calm ? " la-calm" : ""}">
      <nav class="la-side" aria-label="Меню">
        <span class="la-logo">${LOGO}</span>
        <span class="la-qc" aria-hidden="true"><i></i><i></i></span>
        <span class="la-div"></span>
        ${[I.home, I.bolt, I.tasks, I.pulse, I.chart, I.doc, I.scale, I.shield, I.target, I.bell, I.pie].map((s) => `<span class="la-nav">${s}</span>`).join("")}
        <span class="la-nav is-on">${I.agent24}</span>
        <span class="la-side-sp"></span><span class="la-div"></span>
        <span class="la-collapse">${I.arrowL}</span>
      </nav>
      <div class="la-app">
        <header class="la-top">
          <span class="la-top-i">${I.bell}</span>
          <span class="la-user"><span class="la-ava">МК</span><span class="la-name"><b>Королёва Мария</b><small>Риск-менеджер (ЦА)</small></span></span>
          <span class="la-top-i">${I.more}</span>
        </header>
        <main class="la-main" data-main></main>
      </div>
      <div class="la-layer" data-layer></div>
      <div class="la-toast" data-toast hidden role="status">${I.check}<span></span></div>
    </div>`;
    const app = root.firstElementChild as HTMLElement;
    const main = app.querySelector<HTMLElement>("[data-main]")!;
    const layer = app.querySelector<HTMLElement>("[data-layer]")!;
    const toast = app.querySelector<HTMLElement>("[data-toast]")!;
    const screen = root.parentElement;

    /* состояние */
    let at = 0;
    let view: "registry" | "agent" = "registry";
    let phase: "empty" | "parsing" | "draft" = "empty";
    let shown = 0;
    let banner = true;
    let risks: Risk[] = [];
    let cur = 0;
    let overlay: Overlay = null;
    let modal: Modal = null;
    let edLvl: Lvl = "high";
    let edText = "";
    let mdText = "";
    let swap = -1; // строка, у которой только что сменилось состояние (кроссфейд)
    let timers: number[] = [];
    let toastT = 0;
    let enter = false;

    const later = (fn: () => void, ms: number) => { timers.push(window.setTimeout(fn, ms)); };
    const stop = () => { timers.forEach(clearTimeout); timers = []; };
    const reset = () => {
      risks = RISKS.map(([t, model, short], i) => ({
        id: `CRA-${10023 + i}`, t, model, short, brief: i === 0 ? BRIEF0 : short + ".", full: i === 0 ? FULL0 : short + ".",
        basis: i === 0 ? BASIS0 : `БТ агента, раздел ${3 + (i % 4)}.${1 + (i % 3)} · схема интеграций`,
        lvl: model, done: false, note: "", who: "", prev: model, hist: [],
      }));
      banner = true; overlay = null; modal = null; swap = -1; cur = 0;
    };
    /* шаг вперёд — только своим действием; после итога путь не дёргаем */
    const advance = (k: number) => { if (k > at) { at = k; ctx.go(k); hint(); } };
    const back = (k: number) => { if (at < 6) { at = k; ctx.go(k); hint(); } };

    /* ---------- реестр (20:2) ---------- */
    function registry() {
      return `<section class="la-page">
        <div class="la-ph"><div class="la-ph-t"><h1>Риски ИИ-агентов</h1><p>Все агенты и их версии. Сверху видно, сколько оценено и за что браться первым.</p></div>
          <span class="la-btn la-btn--primary">Создать оценку</span></div>
        <div class="la-search"><span class="la-field">${I.search}<span>Поиск</span></span><span class="la-ib">${I.filter}</span></div>
        <div class="la-sum">
          <div class="la-totals">
            <div class="la-stat"><small>Всего агентов</small><span><b>639</b><em class="is-up">+16 за май</em></span></div>
            <div class="la-stat"><small>Оценённые</small><span><b>142</b><em>из 639</em></span></div>
            <div class="la-stat"><small>В оценке</small><span><b>12</b><em>сейчас в работе</em></span></div>
          </div>
          <p class="la-sum-l">Уровень риска у оценённых</p>
          <div class="la-byrisk">
            ${([["vhigh", 9], ["high", 31], ["mid", 58], ["low", 44]] as [Lvl, number][]).map(([l, n]) => `<div class="la-rt"><span class="la-rt-i la-rt-i--${l}">${MARK[l]}</span>${LVL[l]}<b>${n}</b></div>`).join("")}
          </div>
        </div>
        <div class="la-lh"><span>Всего: 639 агентов</span><span class="la-sortb">${I.sort}Сначала новые</span></div>
        <div class="la-agl">
          ${AGENTS.map((a) => {
            const inner = `<span class="la-ac-ic">${I.agent}</span>
              <span class="la-ac-b">
                <span class="la-ac-top"><b>${a.t}</b><span class="la-badges"><span class="la-st la-st--${a.st[0]}">${a.st[1]}</span>${a.lvl ? badge(a.lvl as Lvl) : ""}</span></span>
                <span class="la-ac-bot"><span class="la-meta">${a.ci}<i>•</i>${a.div}<i>•</i>${a.fn}<i>•</i><span class="la-ver">${I.version}Версия 1</span></span><span>Последнее изменение от 24.12.2024</span></span>
              </span>`;
            return a.id === "a1" ? `<button type="button" class="la-ac is-link" data-agent="a1">${inner}</button>` : `<div class="la-ac">${inner}</div>`;
          }).join("")}
        </div>
      </section>`;
    }

    /* ---------- карточка версии (27:270, 28:186, 28:405) ---------- */
    function riskRow(r: Risk, i: number, fresh: boolean) {
      const na = r.lvl === "na";
      const label = na ? "Причина" : "Обоснование";
      const text = na || r.done ? r.note : r.short;
      return `<button type="button" class="la-ri${fresh ? " is-fresh" : ""}${i === swap ? " is-swap" : ""}" data-risk="${i}">
        <span class="la-ri-top"><span class="la-ri-t">${r.t}</span>${r.done ? "" : SPARK(20)}${na ? badge("na") : badge(r.lvl)}${I.chevD}</span>
        <span class="la-ri-j"><b>${label}</b><span>${esc(text)}</span></span>
      </button>`;
    }
    function agent() {
      const ready = phase === "draft";
      const done = risks.filter((r) => r.done || r.lvl === "na").length;
      const top = phase === "parsing"
        ? `<div class="la-prog" aria-live="polite">${SPARK(40)}<div><b>Разбираем архив… готово ${shown} ${plural(shown)} из 13</b><span class="la-track">${Array.from({ length: 13 }, (_, i) => `<i class="${i < shown ? "is-on" : i === shown ? "is-next" : ""}" style="--k:${i}"></i>`).join("")}</span></div></div>`
        : ready && banner ? `<div class="la-banner">${SPARK(24, true)}<div><b>Модель сформировала 13 рисков. Проверьте их</b><p>Уровни и обоснования пока черновые. Риски, которые оценивают подразделения, отмечены отдельно. Итоговое решение за вами.</p></div><button type="button" class="la-banner-x" data-act="banner" aria-label="Скрыть">${I.close}</button></div>` : "";
      let list = "";
      if (phase === "empty") {
        list = `<div class="la-empty">${ILLU}<b>У вас пока нет оценок</b><p>Загрузите архив с документами агента, и модель соберёт черновик рисков</p>
          <button type="button" class="la-btn la-btn--ai" data-act="upload">${I.upload}Загрузить архив</button></div>`;
      } else if (phase === "parsing") {
        list = risks.slice(0, shown).map((r, i) => riskRow(r, i, i === shown - 1)).join("")
          + Array.from({ length: Math.min(3, 13 - shown) }, () => `<div class="la-skel"><span><i></i><i></i></span><i></i></div>`).join("");
      } else {
        list = risks.map((r, i) => riskRow(r, i, false)).join("");
      }
      const hint = phase === "empty" ? "Станет доступно, когда риски будут сформированы и проверены"
        : phase === "parsing" ? "Со страницы можно уйти. Разбор продолжится, а версия появится в «Моих задачах»"
        : `Проверено ${done} из 13. Ждём оценки четырёх подразделений`;
      const stage = phase === "empty" ? 0 : 1;
      return `<section class="la-page la-page--card">
        <div class="la-title"><button type="button" class="la-back" data-act="home" aria-label="К реестру">${I.back}</button><h1>Агент планирования диалога с клиентом</h1><span class="la-st la-st--${stage ? "work" : "wait"}">${stage ? "Оценка" : "Новая"}</span></div>
        <div class="la-cols">
          <div class="la-left">
            ${top}
            <div class="la-int">
              <div class="la-int-h${phase === "empty" ? " is-grouped" : ""}"><b>Интегральный уровень</b>${badge("none")}<span class="la-ghost${ready ? "" : " is-off"}">${I.edit}Оценки подразделений</span></div>
              <div class="la-svcs">${["УМР", "УОР", "ДТН", "ДКБ"].map((s) => `<div class="la-svc"><b>${s}</b>${badge("none")}</div>`).join("")}</div>
            </div>
            <div class="la-rh"><b>Риски версии</b><span>${phase === "empty" ? "0 из 13" : phase === "parsing" ? `${shown} из 13` : "13"}</span>${ready ? `<span class="la-ghost la-ghost--dark">${I.sort}По умолчанию</span>` : ""}</div>
            <div class="la-risks">${list}</div>
          </div>
          <aside class="la-right">
            <div class="la-stepper">
              <small>Этапы версии</small>
              <span class="la-steps">
                ${stage ? `<i class="is-done">${I.check16}</i><em class="is-done"></em><i class="is-now"></i>` : `<i class="is-now"></i><em></em><i></i>`}<em></em><i></i><em></em><i></i>
              </span>
              <span class="la-step-c"><b>${stage ? "Оценка" : "Новая"}</b><span>${stage ? "2" : "1"} из 4</span></span>
            </div>
            <div class="la-pass">
              <b>Паспорт версии</b>
              <dl>
                <dt>Версия:</dt><dd>1</dd>
                <dt>Статус ЖЦ:</dt><dd>Пилот</dd>
                <dt>КЭ:</dt><dd>CI10000001</dd>
                <dt>ID:</dt><dd>CRA-10000</dd>
                <dt>Создано:</dt><dd>24.09.2025<small>1 день в работе</small></dd>
                <dt>Ответственный:</dt><dd>Титов Н.Н.</dd>
                <dt>Владелец:</dt><dd>Орлов М.Н.</dd>
              </dl>
              <span class="la-more">Документы и история версии${I.chevR}</span>
            </div>
            <div class="la-send"><span class="la-btn la-btn--off">Отправить на согласование</span><small>${hint}</small></div>
          </aside>
        </div>
      </section>`;
    }
    const plural = (n: number) => (n % 10 === 1 && n % 100 !== 11 ? "риск" : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? "риска" : "рисков");

    /* ---------- шторка риска (30:2, 30:332, 31:736, 31:1125) ---------- */
    function panel() {
      const r = risks[cur];
      const enterCls = enter && !modal ? " is-enter" : "";
      if (overlay === "card") {
        const na = r.lvl === "na";
        const field = (cap: string, body: string) => `<div class="la-f"><small>${cap}</small>${body}</div>`;
        const data = na
          ? field("Причина", `<p class="la-reason">${esc(r.note)}</p>`) + field("Кто и когда", `<p class="la-src">${r.who}. Было: «${LVL[r.prev]}» (черновик модели)</p>`)
          : r.done
            ? field("Обоснование риск-менеджера", `<p class="la-just">${esc(r.note)}</p>`) + field("Кто и когда", `<p class="la-src">${r.who}. Было: «${LVL[r.prev]}» (черновик модели)</p>`) + field("На чём основано", `<p class="la-src">${r.basis}</p>`)
            : field("Обоснование уровня", `<p class="la-just">${esc(r.full)}</p>`) + field("На чём основано", `<p class="la-src">${r.basis}</p>`)
              + (r.hist.length ? `<div class="la-hist"><b>История риска</b>${r.hist.map(([d, t]) => `<span><time>${d}</time>${esc(t)}</span>`).join("")}</div>` : "");
        return `<aside class="la-drawer${enterCls}" role="dialog" aria-label="${esc(r.t)}">
          <div class="la-d-body">
            <div class="la-d-head"><div><p class="la-cap">${SPARK(16)}${r.id} · черновик модели</p><h2>${r.t}</h2></div><button type="button" class="la-ib la-ib--soft" data-act="close" aria-label="Закрыть шторку">${I.close}</button></div>
            ${field("Уровень риска", `<span class="la-badges">${na ? badge(r.prev) + badge("na") : badge(r.lvl)}</span>`)}
            <h3>Данные риска</h3>
            ${data}
          </div>
          <div class="la-d-foot">
            ${na ? `<button type="button" class="la-btn la-btn--sec" data-act="restore">${I.restore}Восстановить риск</button>`
              : `<button type="button" class="la-btn la-btn--sec" data-act="edit">Редактировать</button><button type="button" class="la-btn la-btn--danger" data-act="na">Не применим</button>`}
          </div>
        </aside>`;
      }
      if (overlay === "edit") {
        return `<aside class="la-drawer la-drawer--edit${enterCls}" role="dialog" aria-label="Редактирование риска">
          <div class="la-d-body">
            <div class="la-e-head"><h2>Редактирование риска</h2><span class="la-ghost">${I.info}Как оценивать уровень</span></div>
            <h3>Данные риска</h3>
            <div class="la-f"><small class="is-strong">Уровень риска</small>
              <div class="la-chips" role="radiogroup" aria-label="Уровень риска">${(["vhigh", "high", "mid", "low", "none", "na"] as Lvl[]).map((l) => `<button type="button" role="radio" aria-checked="${l === edLvl}" class="la-chip${l === edLvl ? " is-on" : ""}" data-lvl="${l}">${LVL[l]}</button>`).join("")}</div>
            </div>
            <div class="la-model"><b>Обоснование модели · было «${LVL[r.model]}»</b><p>${esc(r.brief)}</p></div>
            <div class="la-f la-f--grow"><label class="is-strong" for="la-ta">Обоснование риск-менеджера *</label>
              <div class="la-ta"><textarea id="la-ta" data-ta maxlength="2000" placeholder="Например: агент уже работает на резервной платформе…">${esc(edText)}</textarea><small data-count>${edText.length}/2000</small></div>
            </div>
          </div>
          <div class="la-d-foot">
            <button type="button" class="la-btn la-btn--sec" data-act="cancel">Отмена</button>
            <button type="button" class="la-btn la-btn--primary" data-act="save"${edText.trim() ? "" : " disabled"}>Сохранить</button>
          </div>
        </aside>`;
      }
      return "";
    }
    /* ---------- окна (31:445, 31:1082, 29:829) ---------- */
    function dialog() {
      const r = risks[cur];
      const x = `<button type="button" class="la-ib la-ib--soft la-dlg-x" data-act="mclose" aria-label="Закрыть">${I.close}</button>`;
      const e = enter ? " is-enter" : "";
      if (modal === "na") {
        return `<div class="la-dlg la-dlg--reason${e}" role="dialog" aria-label="Риск не применим?">${x}
          <div class="la-dlg-h">${WARN(24)}<h2>Риск не применим?</h2></div>
          <p class="la-dlg-p">Опишите, почему риск не относится к этому агенту. Причина останется в истории оценки</p>
          <div class="la-ta la-ta--m"><textarea data-mta maxlength="2000" placeholder="Например: агент не обращается к внешним ИИ-платформам…">${esc(mdText)}</textarea><small data-mcount>${mdText.length}/2000</small></div>
          <div class="la-dlg-row"><button type="button" class="la-btn la-btn--sec" data-act="mclose">Отмена</button><button type="button" class="la-btn la-btn--primary" data-act="maccept"${mdText.trim() ? "" : " disabled"}>Принять</button></div>
        </div>`;
      }
      if (modal === "restore") {
        return `<div class="la-dlg la-dlg--confirm${e}" role="alertdialog" aria-label="Восстановить риск?">${x}${WARN(40)}
          <h2>Восстановить риск?</h2><p class="la-dlg-p">Риск вернётся в оценку с уровнем «${LVL[r.prev]}». Причина отказа сохранится в истории</p>
          <div class="la-dlg-col"><button type="button" class="la-btn la-btn--primary" data-act="maccept">Восстановить</button><button type="button" class="la-btn la-btn--sec" data-act="mclose">Отменить</button></div>
        </div>`;
      }
      if (modal === "leave") {
        return `<div class="la-dlg la-dlg--confirm${e}" role="alertdialog" aria-label="Хотите покинуть форму?">${x.replace('data-act="mclose"', 'data-act="stay"')}${WARN(40)}
          <h2>Хотите покинуть форму?</h2><p class="la-dlg-p">Все несохранённые данные будут утеряны</p>
          <div class="la-dlg-col"><button type="button" class="la-btn la-btn--danger" data-act="leave">Покинуть форму</button><button type="button" class="la-btn la-btn--sec" data-act="stay">Отменить</button></div>
        </div>`;
      }
      return "";
    }

    /* ---------- отрисовка ---------- */
    let lastView = "";
    function paintMain(toTop = false) {
      const top = main.scrollTop;
      main.innerHTML = view === "registry" ? registry() : agent();
      main.scrollTop = lastView === view && !toTop ? top : 0;
      lastView = view;
    }
    function paintLayer() {
      const has = !!overlay || !!modal;
      layer.innerHTML = has ? `<div class="la-scrim${enter && (!modal || !overlay) ? " is-enter" : ""}" data-act="scrim"></div>${panel()}${modal ? `<div class="la-scrim la-scrim--2" data-act="mscrim"></div>${dialog()}` : ""}` : "";
      layer.classList.toggle("is-on", has);
      enter = false;
    }
    function paint(toTop = false) { paintMain(toTop); paintLayer(); hint(); }

    /* куда нажать: кольцо .pt-hint; на узком экране окно листается вбок — подвозим подсказку в кадр */
    function hint() {
      app.querySelectorAll(".pt-hint").forEach((e) => e.classList.remove("pt-hint"));
      if (at >= 6) return;
      let sel = "";
      if (modal === "na") sel = mdText.trim() ? '[data-act="maccept"]' : "[data-mta]";
      else if (modal === "restore") sel = '[data-act="maccept"]';
      else if (modal === "leave") sel = '.la-dlg-col [data-act="stay"]';
      else if (overlay === "edit") sel = cur === 0 && edLvl === "high" ? '[data-lvl="mid"]' : !edText.trim() ? "[data-ta]" : '[data-act="save"]';
      else if (overlay === "card") sel = risks[cur].lvl === "na" ? '[data-act="restore"]' : '[data-act="edit"]';
      else if (view === "registry") sel = '[data-agent="a1"]';
      else if (phase === "empty") sel = '[data-act="upload"]';
      else if (phase === "draft") sel = '[data-risk="0"]';
      const el = sel ? app.querySelector<HTMLElement>(sel) : null;
      if (!el) return;
      el.classList.add("pt-hint");
      requestAnimationFrame(() => reveal(el));
    }
    function reveal(el: HTMLElement) {
      if (!el.isConnected) return;
      const b = el.getBoundingClientRect();
      /* по вертикали — внутри прокрутки экрана */
      if (main.contains(el)) {
        const m = main.getBoundingClientRect();
        const dy = b.bottom > m.bottom - 16 ? b.bottom - m.bottom + 24 : b.top < m.top + 16 ? b.top - m.top - 24 : 0;
        if (dy) main.scrollBy({ top: dy / zoom(), behavior: calm ? "auto" : "smooth" });
      }
      /* по горизонтали — окно шире рамки (.pt-screen.is-pan) */
      if (screen && screen.scrollWidth > screen.clientWidth + 1) {
        const s = screen.getBoundingClientRect();
        /* широкое (строка списка) — к левому краю, чтобы читалось начало; узкое (кнопка) — в середину кадра */
        const dx = b.width > s.width - 24 ? b.left - s.left - 12 : (b.left + b.right) / 2 - (s.left + s.right) / 2;
        if (b.left < s.left + 4 || b.right > s.right - 4 || b.width > s.width - 24) screen.scrollBy({ left: dx, behavior: calm ? "auto" : "smooth" });
      }
    }
    /* gBCR отдаёт пиксели после zoom, scrollBy внутри корня ждёт пиксели до него */
    function zoom() { return Number(root.style.zoom) || 1; }

    function say(text: string) {
      clearTimeout(toastT);
      toast.querySelector("span")!.textContent = text;
      toast.classList.toggle("is-side", !!overlay);
      toast.hidden = false;
      toast.classList.remove("is-in"); void toast.offsetWidth; toast.classList.add("is-in");
      toastT = window.setTimeout(() => { toast.hidden = true; }, 4000);
    }
    const hush = () => { clearTimeout(toastT); toast.hidden = true; };

    /* разбор архива: риски по одному сменяют скелетоны, полоса из 13 делений дорастает; в конце — черновик */
    function parse() {
      stop();
      view = "agent"; phase = "parsing"; shown = 0;
      paint(true);
      if (calm) { shown = 13; finish(); return; }
      const step = 2300 / 13;
      for (let i = 1; i <= 13; i++) later(() => { shown = i; paintMain(); }, 300 + step * i);
      later(finish, 300 + step * 13 + 450);
    }
    function finish() { phase = "draft"; banner = true; paint(true); advance(3); }

    function openRisk(i: number) {
      cur = i; overlay = "card"; modal = null; enter = !calm; hush();
      paintLayer(); hint();
      advance(4);
    }
    function openEdit() {
      const r = risks[cur];
      overlay = "edit"; edLvl = r.lvl; edText = r.done ? r.note : "";
      paintLayer(); hint();
      advance(5);
      focusIn(layer.querySelector("[data-ta]"));
    }
    const dirty = () => !!edText.trim() && edText.trim() !== risks[cur].note;
    function closePanel() { overlay = null; modal = null; paintLayer(); hint(); back(3); }
    function crossfade(i: number) { swap = i; later(() => { swap = -1; main.querySelector(".is-swap")?.classList.remove("is-swap"); }, 400); }
    function save() {
      const r = risks[cur];
      if (!edText.trim()) return;
      r.prev = r.model; r.who = WHO;
      if (edLvl === "na") { r.lvl = "na"; r.done = false; }
      else { r.lvl = edLvl; r.done = true; }
      r.note = edText.trim();
      overlay = null; crossfade(cur);
      paint();
      advance(6);
    }
    function acceptModal() {
      const r = risks[cur];
      if (modal === "na") {
        if (!mdText.trim()) return;
        r.prev = r.lvl; r.lvl = "na"; r.done = false; r.note = mdText.trim(); r.who = WHO;
        modal = null; crossfade(cur);
        paint();
        advance(6);
      } else if (modal === "restore") {
        r.hist = [["26.09, 14:32", `Королёва М. отметила «не применим»: «${cut(r.note, 44)}»`], ["26.09, 14:40", "Королёва М. восстановила риск"]];
        r.lvl = r.prev; r.done = false; r.note = "";
        modal = null; crossfade(cur);
        paint();
        say(`Риск снова в оценке · уровень «${LVL[r.lvl]}»`);
      }
    }

    /* ---------- события ---------- */
    const onClick = (e: MouseEvent) => {
      const el = e.target as HTMLElement;
      if (el.closest("[data-agent]")) { view = "agent"; phase = "empty"; reset(); paint(); advance(1); return; }
      const rk = el.closest<HTMLElement>("[data-risk]");
      if (rk && phase === "draft") { openRisk(Number(rk.dataset.risk)); return; }
      const lv = el.closest<HTMLElement>("[data-lvl]");
      if (lv) {
        edLvl = lv.dataset.lvl as Lvl;
        layer.querySelectorAll<HTMLElement>("[data-lvl]").forEach((b) => { const on = b === lv; b.classList.toggle("is-on", on); b.setAttribute("aria-checked", String(on)); });
        hint(); return;
      }
      switch (el.closest<HTMLElement>("[data-act]")?.dataset.act) {
        case "home": stop(); hush(); view = "registry"; overlay = null; modal = null; paint(); back(0); break;
        case "upload": advance(2); parse(); break;
        case "banner": banner = false; paintMain(); hint(); break;
        case "close": closePanel(); break;
        case "scrim": if (overlay === "edit" && dirty()) { modal = "leave"; enter = !calm; paintLayer(); hint(); } else closePanel(); break;
        case "edit": openEdit(); break;
        case "na": modal = "na"; mdText = ""; enter = !calm; paintLayer(); hint(); focusIn(layer.querySelector("[data-mta]")); break;
        case "restore": modal = "restore"; enter = !calm; paintLayer(); hint(); break;
        case "cancel":
          if (dirty()) { modal = "leave"; enter = !calm; paintLayer(); hint(); }
          else { overlay = "card"; paintLayer(); hint(); back(4); }
          break;
        case "leave": modal = null; overlay = "card"; edText = ""; paintLayer(); hint(); back(4); break;
        case "stay": modal = null; paintLayer(); hint(); focusIn(layer.querySelector("[data-ta]")); break;
        case "save": save(); break;
        case "mclose": case "mscrim": modal = null; paintLayer(); hint(); break;
        case "maccept": acceptModal(); break;
      }
    };
    const onInput = (e: Event) => {
      const t = e.target as HTMLTextAreaElement;
      if (t.matches("[data-ta]")) {
        edText = t.value;
        layer.querySelector("[data-count]")!.textContent = `${edText.length}/2000`;
        (layer.querySelector('[data-act="save"]') as HTMLButtonElement).disabled = !edText.trim();
        hint();
      } else if (t.matches("[data-mta]")) {
        mdText = t.value;
        layer.querySelector("[data-mcount]")!.textContent = `${mdText.length}/2000`;
        (layer.querySelector('[data-act="maccept"]') as HTMLButtonElement).disabled = !mdText.trim();
        hint();
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (modal) { modal = null; paintLayer(); hint(); }
      else if (overlay === "edit") (layer.querySelector('[data-act="cancel"]') as HTMLElement)?.click();
      else if (overlay === "card") closePanel();
    };
    app.addEventListener("click", onClick);
    app.addEventListener("input", onInput);
    app.addEventListener("keydown", onKey);

    /* состояние в начале шага k (шаг из списка, «назад», «заново»; последний — итог) */
    function show(k: number) {
      stop(); hush();
      at = k; reset(); edText = ""; mdText = ""; enter = false;
      if (screen) screen.scrollLeft = 0;
      if (k === 0) { view = "registry"; paint(); return; }
      view = "agent";
      if (k === 1) { phase = "empty"; paint(); return; }
      if (k === 2) { parse(); return; }
      phase = "draft"; shown = 13;
      if (k === 4) overlay = "card";
      if (k === 5) { overlay = "edit"; edLvl = "high"; }
      if (k >= 6) { const r = risks[0]; r.lvl = "mid"; r.done = true; r.note = SAMPLE0; r.who = WHO; r.prev = r.model; }
      paint();
    }

    reset();
    show(0);
    return {
      show,
      destroy() {
        stop(); clearTimeout(toastT);
        app.removeEventListener("click", onClick);
        app.removeEventListener("input", onInput);
        app.removeEventListener("keydown", onKey);
        root.innerHTML = "";
      },
    };
  },
};
export default proto;
