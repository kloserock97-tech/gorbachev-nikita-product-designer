/* v115: живой прототип кейса «Риски ИИ-агентов» — внутренний веб-продукт риск-менеджера.
   Путь: реестр → карточка агента (пустое состояние) → «Загрузить архив» → разбор с прогрессом и скелетонами →
   черновик из 13 рисков → карточка риска → «Редактировать» → уровень + обязательное обоснование → «Сохранить» → готово.
   Побочные ветки: «Не применим» (окно с обязательной причиной, риск остаётся в списке с «Восстановить»),
   защита недописанного («Хотите покинуть форму?»), сортировка и поиск в реестре.
   Шаги — prototype.steps в ai-agents.ru.ts / .en.ts (7 шагов, последний — итог). Тексты интерфейса — по-русски в обоих языках.
   Данные — демо: агенты и риски выдуманы для макета, как и на скриншотах кейса. */
import type { LiveProto } from "./types";
import "./agents.css";

type Lvl = "vhigh" | "high" | "mid" | "low" | "none" | "na";
type Risk = {
  id: string; t: string; model: Lvl; short: string; full?: string; basis: string;
  lvl: Lvl; checked: boolean; note: string; prev?: Lvl;
};
type Overlay = null | "card" | "edit";
type Modal = null | "na" | "restore" | "leave";

const LVL: Record<Lvl, string> = { vhigh: "Очень высокий", high: "Высокий", mid: "Средний", low: "Низкий", none: "Нет оценки", na: "Не применим" };
const RANK: Record<Lvl, number> = { vhigh: 4, high: 3, mid: 2, low: 1, none: 0, na: -1 };

/* 13 типов рисков версии; первые четыре и тексты карточки — из макетов Figma, остальные — демо-данные */
const RISKS: [string, Lvl, string][] = [
  ["Отказ инфраструктуры ИИ-платформ и сервисов", "high", "В августе 2022 закупили лицензии ПО Vendor A, но ключи так и не передали, и платформу не ввели в эксплуатацию"],
  ["Взаимное влияние ИИ-решений на едином ландшафте", "mid", "Агент делит пул GPU с тремя агентами продаж, и пики нагрузки у них совпадают"],
  ["Прямые промпт-инъекции и манипуляции выводом модели", "high", "Агент принимает свободный текст клиента и передаёт его в модель без фильтрации"],
  ["Уязвимости конфигурации и цепочки поставок", "mid", "Модель и библиотеки из внутреннего каталога, версии зафиксированы"],
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
const SAMPLE0 = "Агент уже работает на резервной платформе в контуре банка, 18.09 он прошёл нагрузочный тест. Остаточный риск средний.";
const SAMPLE = "Сверил с документами архива: вывод модели подтверждается, уровень оставляю.";
const NA_SAMPLE = "Агент не обращается к внешним ИИ-платформам: модель развёрнута во внутреннем контуре.";
const RESTORE_SAMPLE = "Агент начал вызывать внешний сервис, риск снова относится к версии.";

const AGENTS = [
  { id: "a1", t: "Агент планирования диалога с клиентом", ci: "CI10000001", div: "Дивизион «Операции»", fn: "Продажи", st: ["wait", "Ожидает оценки"], lvl: "" as Lvl | "", d: 20241224 },
  { id: "a2", t: "ИИ-агент регистрации самозанятых", ci: "CI10000002", div: "Дивизион «Операции»", fn: "Продажи", st: ["ok", "Согласовано"], lvl: "high" as Lvl | "", d: 20241220 },
  { id: "a3", t: "Агент сервисов розыска", ci: "CI10000003", div: "Розничное взыскание", fn: "Проблемные активы", st: ["work", "Оценка"], lvl: "" as Lvl | "", d: 20241218 },
  { id: "a4", t: "Credit cards.Debt", ci: "CI10000004", div: "Розничный бизнес", fn: "Карты", st: ["fix", "Корректировка"], lvl: "mid" as Lvl | "", d: 20241211 },
  { id: "a5", t: "Ассистент оператора контакт-центра", ci: "CI10000005", div: "Сервис", fn: "Поддержка", st: ["ok", "Согласовано"], lvl: "low" as Lvl | "", d: 20241202 },
];
const SORTS = [["new", "Новые"], ["old", "Старые"], ["hi", "С высоким уровнем"], ["lo", "С низким уровнем"]] as const;
type Sort = (typeof SORTS)[number][0];

const I = {
  home: '<path d="M4 10.5 12 4l8 6.5V20H4z"/><path d="M10 20v-5h4v5"/>',
  bolt: '<path d="M13 3 5 13.5h6L10 21l8-10.5h-6z"/>',
  check: '<rect x="4" y="4" width="16" height="16" rx="3"/><path d="m8.5 12 2.5 2.5 4.5-5"/>',
  pulse: '<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M7 12h2.5l1.5-3 2 6 1.5-3H17"/>',
  bars: '<path d="M5 20h14M7 16V9M11 16V5M15 16v-4M19 16v-6"/>',
  doc: '<rect x="5" y="3.5" width="14" height="17" rx="2.5"/><path d="M9 8.5h6M9 12h6M9 15.5h4"/>',
  scale: '<path d="M12 4v16M7 20h10M5 7h14M5 7l-2.5 6a2.5 2.5 0 0 0 5 0zM19 7l-2.5 6a2.5 2.5 0 0 0 5 0z"/>',
  shield: '<path d="M12 3.5 19 6v5.5c0 4.5-3 7.6-7 9-4-1.4-7-4.5-7-9V6z"/><path d="m9 12 2 2 4-4"/>',
  target: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3.5"/>',
  bell: '<path d="M6.5 16.5V11a5.5 5.5 0 0 1 11 0v5.5l1.5 1.5H5z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>',
  pie: '<path d="M12 4a8 8 0 1 0 8 8h-8z"/><path d="M15 3.5A6 6 0 0 1 20.5 9H15z"/>',
  bot: '<rect x="4.5" y="7" width="15" height="12" rx="3.5"/><path d="M12 4v3M9.5 12.5v1M14.5 12.5v1M9.5 16h5"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/>',
  sliders: '<path d="M4 7h10M18 7h2M4 12h3M11 12h9M4 17h12M20 17h0"/><circle cx="16" cy="7" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="18" cy="17" r="2"/>',
  sort: '<path d="M8 4v16M4.5 7.5 8 4l3.5 3.5M16 20V4M12.5 16.5 16 20l3.5-3.5"/>',
  back: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
  pen: '<path d="M14.5 5.5 18.5 9.5M4.5 19.5l1-4.5L16 4.5a1.4 1.4 0 0 1 2 0l1.5 1.5a1.4 1.4 0 0 1 0 2L9 18.5z"/>',
  chev: '<path d="m9.5 6 6 6-6 6"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  upload: '<path d="M12 16V5M7 10l5-5 5 5M5 19.5h14"/>',
  info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.5M12 7.8v.2"/>',
  tick: '<path d="m5.5 12.5 4 4 9-9"/>',
  undo: '<path d="M9 7 4.5 11.5 9 16"/><path d="M5 11.5h9a5 5 0 0 1 0 10h-2"/>',
  dots: '<circle cx="5.5" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="18.5" cy="12" r="1.4"/>',
  user: '<circle cx="12" cy="8.5" r="3.5"/><path d="M5 20a7 7 0 0 1 14 0"/>',
  doc2: '<path d="M7 3.5h7l4 4V20.5H7z"/><path d="M14 3.5v4h4M9.5 12h6M9.5 15.5h6"/>',
};
const ic = (k: keyof typeof I, cls = "") => `<svg class="lv-i ${cls}" viewBox="0 0 24 24" aria-hidden="true">${I[k]}</svg>`;
const SPARK = '<svg class="lv-spark" viewBox="0 0 24 24" aria-hidden="true"><path d="M10 3.5c.6 4 2.5 5.9 6.5 6.5-4 .6-5.9 2.5-6.5 6.5-.6-4-2.5-5.9-6.5-6.5 4-.6 5.9-2.5 6.5-6.5z"/><path d="M18.5 2.5c.25 1.6 1 2.35 2.6 2.6-1.6.25-2.35 1-2.6 2.6-.25-1.6-1-2.35-2.6-2.6 1.6-.25 2.35-1 2.6-2.6z"/></svg>';
/* нейтральный знак продукта — не логотип банка */
const MARK = '<svg viewBox="0 0 32 32" aria-hidden="true"><rect x="3" y="3" width="26" height="26" rx="8" fill="#21a35f"/><path d="M10 21.5 16 9.5l6 12" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/><circle cx="16" cy="18" r="2.2" fill="#fff"/></svg>';

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const chip = (l: Lvl) => `<span class="lv-lvl lv-lvl--${l}"><i></i>${LVL[l]}</span>`;
const date = (d: number) => { const s = String(d); return `${s.slice(6)}.${s.slice(4, 6)}.${s.slice(0, 4)}`; };

const proto: LiveProto = {
  design: { w: 1100 },
  mount(root, ctx) {
    const calm = ctx.calm;
    /* на телефоне не фокусируем поле само — иначе выскакивает клавиатура и страница прыгает */
    const fine = matchMedia("(pointer: fine)").matches;
    const focusIn = (el: HTMLElement | null) => { if (el && fine) el.focus({ preventScroll: true }); };
    root.innerHTML = `<div class="lv-agents${calm ? " lv-calm" : ""}">
      <nav class="lv-side" aria-label="Меню">
        <span class="lv-mark">${MARK}</span>
        <span class="lv-new">${ic("plus")}</span>
        <span class="lv-sep"></span>
        ${(["home", "bolt", "check", "pulse", "bars", "doc", "scale", "shield", "target", "bell", "pie"] as const).map((k) => `<span class="lv-nav">${ic(k)}</span>`).join("")}
        <span class="lv-nav is-on">${ic("bot")}</span>
      </nav>
      <div class="lv-app">
        <header class="lv-top">
          <span class="lv-top-bell">${ic("bell")}</span>
          <span class="lv-ava">МК</span>
          <span class="lv-who"><b>Королёва Мария</b><small>Риск-менеджер (ЦА)</small></span>
          <span class="lv-top-dots">${ic("dots")}</span>
        </header>
        <main class="lv-main" data-main></main>
      </div>
      <div class="lv-layer" data-layer></div>
      <div class="lv-toast" data-toast hidden>${ic("tick")}<span></span></div>
    </div>`;
    const app = root.firstElementChild as HTMLElement;
    const main = app.querySelector<HTMLElement>("[data-main]")!;
    const layer = app.querySelector<HTMLElement>("[data-layer]")!;
    const toast = app.querySelector<HTMLElement>("[data-toast]")!;

    /* состояние */
    let at = 0;
    let view: "registry" | "agent" = "registry";
    let phase: "empty" | "parsing" | "draft" = "empty";
    let shown = 0; // разобрано рисков при разборе
    let banner = true;
    let sort: Sort = "new";
    let sortOpen = false;
    let query = "";
    let risks: Risk[] = [];
    let cur = 0;
    let overlay: Overlay = null;
    let modal: Modal = null;
    let edLvl: Lvl = "high";
    let edText = "";
    let mdText = "";
    let flash = -1;
    let timers: number[] = [];
    let toastT = 0;
    let enter = false; // панель въезжает (только при открытии)

    const later = (fn: () => void, ms: number) => { timers.push(window.setTimeout(fn, ms)); };
    const stop = () => { timers.forEach(clearTimeout); timers = []; };
    const reset = () => {
      risks = RISKS.map(([t, model, short], i) => ({
        id: `CRA-${10023 + i}`, t, model, short, full: i === 0 ? FULL0 : undefined,
        basis: i === 0 ? "БТ агента, раздел 4.2 · архитектурная схема · договор № 17-СЛ" : `БТ агента, раздел ${3 + (i % 4)}.${1 + (i % 3)} · схема интеграций`,
        lvl: model, checked: false, note: "",
      }));
      banner = true; overlay = null; modal = null; flash = -1; sortOpen = false; cur = 0;
    };
    /* шаг вперёд — только своим действием и только вперёд по пути; после итога путь не дёргаем */
    const advance = (k: number) => { if (k > at) { at = k; ctx.go(k); hint(); } };
    const back = (k: number) => { if (at < 6) { at = k; ctx.go(k); } };

    /* ---------- реестр ---------- */
    function registry() {
      const q = query.trim().toLowerCase();
      const list = AGENTS.filter((a) => !q || (a.t + " " + a.ci + " " + a.div).toLowerCase().includes(q)).sort((a, b) =>
        sort === "new" ? b.d - a.d : sort === "old" ? a.d - b.d
          : sort === "hi" ? RANK[(b.lvl || "none") as Lvl] - RANK[(a.lvl || "none") as Lvl] || b.d - a.d
          : RANK[(a.lvl || "none") as Lvl] - RANK[(b.lvl || "none") as Lvl] || b.d - a.d);
      const label = sort === "new" ? "Сначала новые" : sort === "old" ? "Сначала старые" : sort === "hi" ? "Сначала высокий" : "Сначала низкий";
      return `<section class="lv-reg">
        <div class="lv-head"><div><h1>Риски ИИ-агентов</h1><p class="lv-sub">Все агенты и их версии. Сверху видно, сколько оценено и за что браться первым.</p></div>
          <span class="lv-btn lv-btn--green lv-btn--static">Создать оценку</span></div>
        <div class="lv-search"><label>${ic("search")}<input data-q type="search" placeholder="Поиск по названию или КЭ" value="${esc(query)}" aria-label="Поиск"></label><span class="lv-sq">${ic("sliders")}</span></div>
        <div class="lv-sum">
          <div class="lv-tiles">
            <div class="lv-tile"><small>Всего агентов</small><b>639</b><em class="is-up">+16 за май</em></div>
            <div class="lv-tile"><small>Оценённые</small><b>142</b><em>из 639</em></div>
            <div class="lv-tile"><small>В оценке</small><b>12</b><em>сейчас в работе</em></div>
          </div>
          <p class="lv-sum-t">Уровень риска у оценённых</p>
          <div class="lv-levels">
            ${([["vhigh", 9], ["high", 31], ["mid", 58], ["low", 44]] as [Lvl, number][]).map(([l, n]) => `<div class="lv-lt"><span class="lv-dot lv-dot--${l}"><i></i></span>${LVL[l]}<b>${n}</b></div>`).join("")}
          </div>
        </div>
        <div class="lv-listhead"><span>Всего: ${q ? list.length : 639} ${q ? "найдено" : "агентов"}</span>
          <div class="lv-sortw"><button type="button" class="lv-sortb" data-act="sort" aria-expanded="${sortOpen}">${ic("sort")}${label}</button>
          ${sortOpen ? `<div class="lv-menu" role="menu"><small>Сначала:</small>${SORTS.map(([k, t]) => `<button type="button" role="menuitemradio" aria-checked="${k === sort}" data-sort="${k}">${t}${k === sort ? ic("tick") : ""}</button>`).join("")}</div>` : ""}
          </div></div>
        <div class="lv-agents-list">
          ${list.length ? list.map((a) => {
            const inner = `<span class="lv-ar-main"><b>${a.t}</b><small>${a.ci}<i>•</i>${a.div}<i>•</i>${a.fn}<i>•</i>${ic("doc")}Версия 1</small></span>
              <span class="lv-ar-side"><span class="lv-chips"><span class="lv-st lv-st--${a.st[0]}">${a.st[1]}</span>${a.lvl ? chip(a.lvl) : ""}</span><small>Последнее изменение от ${date(a.d)}</small></span>`;
            return a.id === "a1" ? `<button type="button" class="lv-ar is-link" data-agent="a1">${inner}</button>` : `<div class="lv-ar">${inner}</div>`;
          }).join("") : `<p class="lv-none">Ничего не нашлось. Попробуйте другое название или КЭ.</p>`}
        </div>
      </section>`;
    }

    /* ---------- карточка агента ---------- */
    function riskRow(r: Risk, i: number, fresh: boolean) {
      const na = r.lvl === "na";
      const who = na ? "" : r.checked ? `<span class="lv-ok">${ic("tick")}проверено</span>` : SPARK;
      const reason = na ? `<span class="lv-why"><b>Причина</b>${esc(r.note)}</span>`
        : r.checked ? `<span class="lv-why"><b>Обоснование риск-менеджера</b>${esc(r.note)}</span>`
        : `<span class="lv-why">${ic("chev")}<b>Обоснование</b>${esc(r.short)}</span>`;
      return `<div class="lv-rw${na ? " is-na" : ""}${r.checked ? " is-checked" : ""}${fresh ? " is-fresh" : ""}${i === flash ? " is-flash" : ""}">
        <button type="button" class="lv-risk" data-risk="${i}"><span class="lv-rt"><span class="lv-rn">${r.t}</span>${who}${chip(r.lvl)}</span>${reason}</button>
        ${na ? `<button type="button" class="lv-restore" data-restore="${i}">${ic("undo")}Восстановить</button>` : ""}
      </div>`;
    }
    function agent() {
      const ready = phase === "draft";
      const done = risks.filter((r) => r.checked).length;
      const status = phase === "empty" ? "Новая" : "Оценка";
      const top = phase === "parsing"
        ? `<div class="lv-prog"><span class="lv-prog-i">${SPARK}</span><div><b>Разбираем архив… готово ${shown} ${shown === 1 ? "риск" : shown < 5 && shown > 1 ? "риска" : "рисков"} из 13</b><span class="lv-bar"><i style="width:${(shown / 13) * 100}%"></i></span></div></div>`
        : ready && banner ? `<div class="lv-banner">${SPARK}<div><b>Модель сформировала 13 рисков. Проверьте их</b><p>Уровни и обоснования пока черновые. Риски, которые оценивают подразделения, отмечены отдельно. Итоговое решение за вами.</p></div><button type="button" class="lv-x" data-act="banner" aria-label="Скрыть">${ic("close")}</button></div>` : "";
      let list = "";
      if (phase === "empty") {
        list = `<div class="lv-empty">
          <svg class="lv-folder" viewBox="0 0 160 130" aria-hidden="true">
            <circle cx="22" cy="40" r="3" fill="#c9d6ff"/><circle cx="142" cy="78" r="3.5" fill="#d9c9ff"/><path d="M18 98h8M22 94v8" stroke="#8fd9b0" stroke-width="2" stroke-linecap="round"/><path d="M136 40h6M139 37v6" stroke="#c9d6ff" stroke-width="2" stroke-linecap="round"/>
            <rect x="46" y="28" width="52" height="62" rx="6" fill="#fff" stroke="#e2e5ea" transform="rotate(-8 72 59)"/>
            <rect x="62" y="24" width="52" height="64" rx="6" fill="#fff" stroke="#e2e5ea" transform="rotate(6 88 56)"/>
            <path d="M70 40h28M70 48h22M70 56h26" stroke="#d5d9e0" stroke-width="3" stroke-linecap="round" transform="rotate(6 88 56)"/>
            <circle cx="72" cy="66" r="2.6" fill="#ff6b5b" transform="rotate(6 88 56)"/><circle cx="72" cy="74" r="2.6" fill="#ffb648" transform="rotate(6 88 56)"/>
            <path d="M34 64a6 6 0 0 1 6-6h22l6 6h46a6 6 0 0 1 6 6v36a8 8 0 0 1-8 8H42a8 8 0 0 1-8-8z" fill="#9fe3bf"/>
            <path d="M34 74a6 6 0 0 1 6-6h80a6 6 0 0 1 6 6v32a8 8 0 0 1-8 8H42a8 8 0 0 1-8-8z" fill="#7fd6a8"/>
            <rect x="68" y="86" width="24" height="5" rx="2.5" fill="#fff" opacity=".85"/>
            <circle cx="122" cy="22" r="11" fill="#2fc48a"/><path d="M122 16v12M116 22h12" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/>
          </svg>
          <b>У вас пока нет оценок</b>
          <p>Загрузите архив с документами агента, и модель соберёт черновик рисков</p>
          <button type="button" class="lv-btn lv-btn--ai" data-act="upload">${ic("upload")}Загрузить архив</button>
          <small>ZIP с кодом агента и бизнес-требованиями, до 200 МБ</small>
        </div>`;
      } else if (phase === "parsing") {
        list = risks.slice(0, shown).map((r, i) => riskRow(r, i, i === shown - 1)).join("")
          + Array.from({ length: Math.min(3, 13 - shown) }, () => `<div class="lv-skel"><i></i><i></i><i></i></div>`).join("");
      } else {
        list = risks.map((r, i) => riskRow(r, i, false)).join("");
      }
      const hint = phase === "empty" ? "Станет доступно, когда риски будут сформированы и проверены"
        : phase === "parsing" ? "Со страницы можно уйти. Разбор продолжится, а версия появится в «Моих задачах»"
        : `Проверено ${done} из 13. Ждём оценки четырёх подразделений`;
      return `<section class="lv-card">
        <div class="lv-title"><button type="button" class="lv-backb" data-act="home" aria-label="К реестру">${ic("back")}</button><h1>Агент планирования диалога с клиентом</h1><span class="lv-st lv-st--${phase === "empty" ? "wait" : "work"}">${status}</span></div>
        <div class="lv-cols">
          <div class="lv-left">
            ${top}
            <div class="lv-integral">
              <div class="lv-int-head"><b>Интегральный уровень</b>${chip("none")}<span class="lv-int-edit${ready ? " is-on" : ""}">${ic("pen")}Оценки подразделений</span></div>
              <div class="lv-svcs">${["УМР", "УОР", "ДТН", "ДКБ"].map((s) => `<div class="lv-svc"><b>${s}</b>${chip("none")}</div>`).join("")}</div>
            </div>
            <div class="lv-rh"><b>Риски версии</b><span>${phase === "empty" ? "0 из 13" : phase === "parsing" ? `${shown} из 13` : "13"}</span>${ready && done ? `<em>${ic("tick")}проверено ${done}</em>` : ""}</div>
            <div class="lv-risks">${list}</div>
          </div>
          <aside class="lv-right">
            <div class="lv-pass">
              <b class="lv-pass-t">Паспорт версии</b>
              <dl>
                <dt>Версия</dt><dd>1</dd>
                <dt>Статус ЖЦ</dt><dd>Пилот</dd>
                <dt>КЭ</dt><dd>CI10000001</dd>
                <dt>ID</dt><dd>CRA-10000</dd>
                <dt>Создано</dt><dd>24.09.2025<small>1 день в работе</small></dd>
                <dt>Ответственный</dt><dd>Титов Н.Н.</dd>
                <dt>Владелец</dt><dd>Орлов М.Н.</dd>
              </dl>
              <span class="lv-more">Документы и история версии${ic("chev")}</span>
            </div>
            <div class="lv-send"><span class="lv-btn lv-btn--off">Отправить на согласование</span><small>${hint}</small></div>
          </aside>
        </div>
      </section>`;
    }

    /* ---------- панель риска и окна ---------- */
    function panel() {
      const r = risks[cur];
      if (overlay === "card") {
        const na = r.lvl === "na";
        return `<aside class="lv-panel${enter && !modal ? " is-enter" : ""}" role="dialog" aria-label="${esc(r.t)}">
          <div class="lv-p-scroll">
            <p class="lv-p-kick">${r.checked || na ? ic("user") : SPARK}${r.id} · ${na ? "не применим" : r.checked ? "проверен риск-менеджером" : "черновик модели"}</p>
            <h2>${r.t}</h2>
            <button type="button" class="lv-x lv-p-x" data-act="close" aria-label="Закрыть">${ic("close")}</button>
            <p class="lv-p-lab">Уровень риска</p>${chip(r.lvl)}
            <h3>Данные риска</h3>
            ${r.checked || na ? `<p class="lv-p-lab">${na ? "Причина" : "Обоснование риск-менеджера"}</p><p class="lv-p-txt">${esc(r.note)}</p>
              <p class="lv-p-lab">Обоснование модели${r.prev && r.prev !== r.lvl ? ` · было «${LVL[r.prev]}»` : ""}</p><p class="lv-p-txt is-soft">${esc(r.full ?? r.short)}</p>`
              : `<p class="lv-p-lab">Обоснование уровня</p><p class="lv-p-txt">${esc(r.full ?? r.short + ".")}</p>`}
            <p class="lv-p-lab">На чём основано</p><p class="lv-p-basis">${ic("doc2")}${r.basis}</p>
          </div>
          <div class="lv-p-foot">
            ${na ? `<button type="button" class="lv-btn lv-btn--line" data-restore="${cur}">${ic("undo")}Восстановить</button>`
              : `<button type="button" class="lv-btn lv-btn--line" data-act="edit">Редактировать</button><button type="button" class="lv-btn lv-btn--red" data-act="na">Не применим</button>`}
          </div>
        </aside>`;
      }
      if (overlay === "edit") {
        const was = r.checked ? r.lvl : r.model;
        return `<aside class="lv-panel${enter && !modal ? " is-enter" : ""}" role="dialog" aria-label="Редактирование риска">
          <div class="lv-p-scroll">
            <div class="lv-e-head"><h2>Редактирование риска</h2><span class="lv-howto">${ic("info")}Как оценивать уровень</span></div>
            <p class="lv-e-name">${r.t}</p>
            <p class="lv-p-lab is-strong">Уровень риска</p>
            <div class="lv-lvls" role="radiogroup" aria-label="Уровень риска">${(["vhigh", "high", "mid", "low", "none"] as Lvl[]).map((l) => `<button type="button" role="radio" aria-checked="${l === edLvl}" class="lv-lc${l === edLvl ? " is-on" : ""}" data-lvl="${l}">${LVL[l]}</button>`).join("")}</div>
            <div class="lv-model"><b>${SPARK}Обоснование модели · было «${LVL[was]}»</b><p>${esc(r.short)}</p></div>
            <div class="lv-ta-head"><label for="lv-ta" class="lv-p-lab is-strong">Обоснование риск-менеджера <i>*</i></label><button type="button" class="lv-linkb" data-act="sample">Вставить пример</button></div>
            <div class="lv-ta"><textarea id="lv-ta" data-ta maxlength="2000" placeholder="Почему уровень такой: на чём основано, что проверили">${esc(edText)}</textarea><small data-count>${edText.length}/2000</small></div>
            <p class="lv-need" data-need${edText.trim() ? " hidden" : ""}>Без обоснования сохранить нельзя: оно останется в истории риска</p>
          </div>
          <div class="lv-p-foot">
            <button type="button" class="lv-btn lv-btn--line" data-act="cancel">Отмена</button>
            <button type="button" class="lv-btn lv-btn--green" data-act="save"${edText.trim() ? "" : " disabled"}>Сохранить</button>
          </div>
        </aside>`;
      }
      return "";
    }
    function dialog() {
      if (!modal) return "";
      if (modal === "leave") {
        return `<div class="lv-modal${enter ? " is-enter" : ""}" role="alertdialog" aria-label="Хотите покинуть форму?">
          <div class="lv-m-head"><span class="lv-warn">!</span><h2>Хотите покинуть форму?</h2></div>
          <p class="lv-m-sub">Обоснование не сохранено. Если уйти, текст пропадёт.</p>
          <div class="lv-m-foot"><button type="button" class="lv-btn lv-btn--line" data-act="leave">Покинуть без сохранения</button><button type="button" class="lv-btn lv-btn--green" data-act="stay">Остаться</button></div>
        </div>`;
      }
      const na = modal === "na";
      return `<div class="lv-modal${enter ? " is-enter" : ""}" role="dialog" aria-label="${na ? "Риск не применим?" : "Восстановить риск?"}">
        <div class="lv-m-head"><span class="lv-warn">!</span><h2>${na ? "Риск не применим?" : "Восстановить риск?"}</h2><button type="button" class="lv-x" data-act="mclose" aria-label="Закрыть">${ic("close")}</button></div>
        <p class="lv-m-sub">${na ? "Опишите, почему риск не относится к этому агенту. Причина останется в истории оценки" : "Опишите, почему риск снова относится к агенту. Причина останется в истории оценки"}</p>
        <div class="lv-ta lv-ta--m"><textarea data-mta maxlength="2000" placeholder="${na ? "Например: агент не обращается к внешним ИИ-платформам…" : "Например: агент начал вызывать внешний сервис…"}">${esc(mdText)}</textarea><small data-mcount>${mdText.length}/2000</small></div>
        <button type="button" class="lv-linkb lv-m-sample" data-act="msample">Вставить пример</button>
        <div class="lv-m-foot"><button type="button" class="lv-btn lv-btn--line" data-act="mclose">Отмена</button><button type="button" class="lv-btn lv-btn--green" data-act="maccept"${mdText.trim() ? "" : " disabled"}>${na ? "Принять" : "Восстановить"}</button></div>
      </div>`;
    }

    /* ---------- отрисовка ---------- */
    let lastView = "";
    function paintMain() {
      const top = main.scrollTop;
      main.innerHTML = view === "registry" ? registry() : agent();
      main.scrollTop = lastView === view ? top : 0;
      lastView = view;
    }
    function paintLayer() {
      const has = !!overlay || !!modal;
      layer.innerHTML = has ? `<div class="lv-scrim${enter && (!modal || !overlay) ? " is-enter" : ""}" data-act="scrim"></div>${panel()}${modal ? `<div class="lv-mscrim" data-act="mscrim"></div>${dialog()}` : ""}` : "";
      layer.classList.toggle("is-on", has);
      enter = false;
    }
    function paint() { paintMain(); paintLayer(); hint(); }

    function hint() {
      app.querySelectorAll(".pt-hint").forEach((e) => e.classList.remove("pt-hint"));
      if (at >= 6) return;
      let sel = "";
      if (modal === "na" || modal === "restore") sel = mdText.trim() ? '[data-act="maccept"]' : '[data-act="msample"]';
      else if (modal === "leave") sel = '[data-act="stay"]';
      else if (overlay === "edit") sel = cur === 0 && edLvl === "high" ? '[data-lvl="mid"]' : !edText.trim() ? '[data-act="sample"]' : '[data-act="save"]';
      else if (overlay === "card") sel = '[data-act="edit"]';
      else if (view === "registry") sel = '[data-agent="a1"]';
      else if (phase === "empty") sel = '[data-act="upload"]';
      else if (phase === "draft") sel = '[data-risk="0"]';
      if (sel) app.querySelector(sel)?.classList.add("pt-hint");
    }

    function say(text: string) {
      clearTimeout(toastT);
      toast.querySelector("span")!.textContent = text;
      toast.hidden = false;
      toast.classList.remove("is-in"); void toast.offsetWidth; toast.classList.add("is-in");
      toastT = window.setTimeout(() => { toast.hidden = true; }, 4200);
    }
    const hush = () => { clearTimeout(toastT); toast.hidden = true; };

    /* разбор архива: риски появляются по одному на месте скелетонов, в конце — черновик */
    function parse() {
      stop();
      view = "agent"; phase = "parsing"; shown = 0;
      paint();
      if (calm) { shown = 13; finish(); return; }
      const step = 2400 / 13;
      for (let i = 1; i <= 13; i++) later(() => { shown = i; paintMain(); }, 260 + step * i);
      later(finish, 260 + step * 13 + 420);
    }
    function finish() { phase = "draft"; banner = true; paint(); advance(3); }

    function openRisk(i: number) {
      cur = i; overlay = "card"; modal = null; enter = !calm; hush();
      paintLayer(); hint();
      advance(4);
    }
    function openEdit() {
      const r = risks[cur];
      overlay = "edit"; edLvl = r.lvl === "na" ? r.model : r.lvl; edText = r.checked ? r.note : ""; enter = false;
      paintLayer(); hint();
      advance(5);
      focusIn(layer.querySelector("[data-ta]"));
    }
    function closePanel() { overlay = null; modal = null; paintLayer(); hint(); back(3); }
    function save() {
      const r = risks[cur];
      if (!edText.trim()) return;
      r.prev = r.checked ? r.prev : r.model;
      r.lvl = edLvl; r.checked = true; r.note = edText.trim();
      overlay = null; flash = cur;
      paint();
      say("Уровень сохранён. Обоснование хранится вместе с риском");
      advance(6);
      later(() => { flash = -1; main.querySelector(".is-flash")?.classList.remove("is-flash"); }, 1600);
    }
    function acceptModal() {
      const r = risks[cur];
      if (!mdText.trim()) return;
      if (modal === "na") {
        r.prev = r.lvl; r.lvl = "na"; r.checked = false; r.note = mdText.trim();
        say("Риск помечен «Не применим». Причина хранится вместе с риском");
      } else {
        r.lvl = r.prev && r.prev !== "na" ? r.prev : r.model; r.checked = false; r.note = ""; r.prev = undefined;
        say("Риск восстановлен. Причина записана в историю оценки");
      }
      modal = null; overlay = null; flash = cur;
      paint();
      advance(6);
      later(() => { flash = -1; main.querySelector(".is-flash")?.classList.remove("is-flash"); }, 1600);
    }

    /* ---------- события ---------- */
    const onClick = (e: MouseEvent) => {
      const el = e.target as HTMLElement;
      if (sortOpen && !el.closest(".lv-sortw")) { sortOpen = false; paintMain(); hint(); }
      const s = el.closest<HTMLElement>("[data-sort]");
      if (s) { sort = s.dataset.sort as Sort; sortOpen = false; paintMain(); hint(); return; }
      if (el.closest("[data-agent]")) { view = "agent"; phase = "empty"; reset(); paint(); advance(1); return; }
      const rk = el.closest<HTMLElement>("[data-risk]");
      if (rk && phase === "draft") { openRisk(Number(rk.dataset.risk)); return; }
      const rs = el.closest<HTMLElement>("[data-restore]");
      if (rs) { cur = Number(rs.dataset.restore); modal = "restore"; mdText = ""; enter = !calm; paintLayer(); hint(); return; }
      const lv = el.closest<HTMLElement>("[data-lvl]");
      if (lv) {
        edLvl = lv.dataset.lvl as Lvl;
        layer.querySelectorAll<HTMLElement>("[data-lvl]").forEach((b) => { const on = b === lv; b.classList.toggle("is-on", on); b.setAttribute("aria-checked", String(on)); });
        hint(); return;
      }
      const act = el.closest<HTMLElement>("[data-act]")?.dataset.act;
      switch (act) {
        case "sort": sortOpen = !sortOpen; paintMain(); hint(); break;
        case "home": stop(); hush(); view = "registry"; overlay = null; modal = null; paint(); back(0); break;
        case "upload": advance(2); parse(); break;
        case "banner": banner = false; paintMain(); hint(); break;
        case "close": closePanel(); break;
        case "scrim": if (overlay === "edit" && edText.trim() && edText.trim() !== risks[cur].note) { modal = "leave"; enter = !calm; paintLayer(); hint(); } else closePanel(); break;
        case "edit": openEdit(); break;
        case "na": modal = "na"; mdText = ""; enter = !calm; paintLayer(); hint(); break;
        case "cancel":
          if (edText.trim() && edText.trim() !== risks[cur].note) { modal = "leave"; enter = !calm; paintLayer(); hint(); }
          else { overlay = "card"; paintLayer(); hint(); back(4); }
          break;
        case "leave": modal = null; overlay = "card"; edText = ""; paintLayer(); hint(); back(4); break;
        case "stay": modal = null; paintLayer(); hint(); focusIn(layer.querySelector("[data-ta]")); break;
        case "sample": {
          edText = cur === 0 ? SAMPLE0 : SAMPLE;
          const ta = layer.querySelector<HTMLTextAreaElement>("[data-ta]");
          if (ta) { ta.value = edText; focusIn(ta); }
          syncEdit(); break;
        }
        case "save": save(); break;
        case "mclose": case "mscrim": modal = null; paintLayer(); hint(); break;
        case "msample": {
          mdText = modal === "na" ? NA_SAMPLE : RESTORE_SAMPLE;
          const ta = layer.querySelector<HTMLTextAreaElement>("[data-mta]");
          if (ta) { ta.value = mdText; focusIn(ta); }
          syncModal(); break;
        }
        case "maccept": acceptModal(); break;
      }
    };
    function syncEdit() {
      layer.querySelector("[data-count]")!.textContent = `${edText.length}/2000`;
      const ok = !!edText.trim();
      (layer.querySelector('[data-act="save"]') as HTMLButtonElement).disabled = !ok;
      (layer.querySelector("[data-need]") as HTMLElement).hidden = ok;
      hint();
    }
    function syncModal() {
      layer.querySelector("[data-mcount]")!.textContent = `${mdText.length}/2000`;
      (layer.querySelector('[data-act="maccept"]') as HTMLButtonElement).disabled = !mdText.trim();
      hint();
    }
    const onInput = (e: Event) => {
      const t = e.target as HTMLElement;
      if (t.matches("[data-ta]")) { edText = (t as HTMLTextAreaElement).value; syncEdit(); }
      else if (t.matches("[data-mta]")) { mdText = (t as HTMLTextAreaElement).value; syncModal(); }
      else if (t.matches("[data-q]")) {
        query = (t as HTMLInputElement).value;
        const pos = (t as HTMLInputElement).selectionStart ?? query.length;
        paintMain(); hint();
        const q = main.querySelector<HTMLInputElement>("[data-q]")!;
        q.focus({ preventScroll: true }); q.setSelectionRange(pos, pos);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (sortOpen) { sortOpen = false; paintMain(); hint(); }
      else if (modal) { modal = null; paintLayer(); hint(); }
      else if (overlay === "edit") (layer.querySelector('[data-act="cancel"]') as HTMLElement)?.click();
      else if (overlay === "card") closePanel();
    };
    app.addEventListener("click", onClick);
    app.addEventListener("input", onInput);
    app.addEventListener("keydown", onKey);

    /* состояние в начале шага k (шаг из списка, «назад», «заново»; последний — итог) */
    function show(k: number) {
      stop(); hush();
      at = k; reset(); query = ""; sort = "new"; edText = ""; mdText = ""; enter = false;
      if (k === 0) { view = "registry"; paint(); return; }
      view = "agent";
      if (k === 1) { phase = "empty"; paint(); return; }
      if (k === 2) { parse(); return; }
      phase = "draft"; shown = 13;
      if (k === 4) { overlay = "card"; cur = 0; }
      if (k === 5) { overlay = "edit"; cur = 0; edLvl = "high"; }
      if (k >= 6) {
        const r = risks[0];
        r.prev = r.model; r.lvl = "mid"; r.checked = true; r.note = SAMPLE0; flash = 0;
        paint();
        say("Уровень сохранён. Обоснование хранится вместе с риском");
        later(() => { flash = -1; main.querySelector(".is-flash")?.classList.remove("is-flash"); }, 1600);
        return;
      }
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
