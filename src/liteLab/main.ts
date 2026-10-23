/* Стенд облегчённой версии (lite-lab.html): страница без WebGL по референсу Никиты (Lumóra) — имя крупным словом,
   кадр холма в рамке, абзац «о себе», цифры карточками, кейсы, пэт-проекты, тёмный подвал. Тексты и данные — те же,
   что у 3D-версии (словари i18n, cases.ts, notes.ts); здесь только подписи, которых там нет. */
import "../ui/fonts.css";
import "./lite-lab.css";
import { getLang, initI18n, onLang, setLang, t, type Key } from "../i18n";
import { getCases, type CaseItem } from "../data/cases";
import notes from "../data/notes";
import { mountHeroDeck } from "./heroDeck";
import { mountAsciiWord } from "./asciiWord";
import { mountReel } from "./reel";
import { mountCursor } from "./cursor";
import { watchReveal } from "./reveal";

const BASE = import.meta.env.BASE_URL;

const OWN: Record<"ru" | "en", Record<string, string>> = {
  ru: {
    skip: "Перейти к кейсам",
    "nav.contacts": "Контакты",
    "nav.label": "Разделы",
    "nav.langs": "Язык страницы",
    "nav.3d": "Версия с 3D",
    "nav.3d.label": "Открыть версию с 3D",
    "nav.menu": "Меню",
    "hero.alt": "Холм на закате: кресло, ретро-компьютер, собака и дерево над долиной в тумане",
    "brand.sber": "Сбер",
    "facts.label": "Коротко в цифрах",
    "work.title": "Кейсы",
    "work.filter": "Показать кейсы",
    "filter.all": "Все",
    "filter.web": "Веб",
    "filter.mobile": "Мобайл",
    "lab.note": "Графика в браузере и продукты, которые я сделал для себя",
    "lab.closed": "Закрытый проект",
    "lab.demo": "Открыть демо",
    "case.open": "Открыть кейс",
    "contact.title": "Расскажите, что не работает",
    "foot.nav": "Разделы",
    "foot.social": "Где ещё найти",
    "foot.links": "Ссылки",
    "foot.word": "Designer",
    "exp.title": "Где работал",
    "deck.label": "Кейсы и пэт-проекты",
    "deck.case": "Кейс",
    "deck.note": "Пэт-проект",
    "deck.prev": "Предыдущий проект",
    "deck.next": "Следующий проект",
    "reel.title": "Что изменилось после моей работы",
    "cursor.view": "Смотреть",
    "mail.copy": "Скопировать",
    "mail.copied": "Скопировано",
    "kind.web": "Веб",
    "kind.mobile": "Мобайл",
  },
  en: {
    skip: "Skip to the work",
    "nav.contacts": "Contact",
    "nav.label": "Sections",
    "nav.langs": "Page language",
    "nav.3d": "3D version",
    "nav.3d.label": "Open the 3D version",
    "nav.menu": "Menu",
    "hero.alt": "A hill at sunset: an armchair, a retro computer, a dog and a tree above a misty valley",
    "brand.sber": "Sber",
    "facts.label": "In numbers",
    "work.title": "Work",
    "work.filter": "Filter the work",
    "filter.all": "All",
    "filter.web": "Web",
    "filter.mobile": "Mobile",
    "lab.note": "Graphics in the browser and products I made for myself",
    "lab.closed": "Private project",
    "lab.demo": "Open the demo",
    "case.open": "Open the case",
    "contact.title": "Tell me what's not working",
    "foot.nav": "Sections",
    "foot.social": "Elsewhere",
    "foot.links": "Links",
    "foot.word": "Designer",
    "exp.title": "Where I worked",
    "deck.label": "Case studies and pet projects",
    "deck.case": "Case study",
    "deck.note": "Pet project",
    "deck.prev": "Previous project",
    "deck.next": "Next project",
    "reel.title": "What changed after my work",
    "cursor.view": "View",
    "mail.copy": "Copy",
    "mail.copied": "Copied",
    "kind.web": "Web",
    "kind.mobile": "Mobile",
  },
};
/* подписи, собранные из строк 3D-версии */
const COMPOSED: Record<string, () => string> = {
  "hero.lead": () => `${t("hero.focus")}. ${t("about.p1")}`,
  "hero.trust": () => t("about.logos"),
};
const L = (key: string) => COMPOSED[key]?.() ?? OWN[getLang()][key] ?? t(key as Key);
const arrow = '<span class="ll-round" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M8 16 16 8M9 8h7v7"/></svg></span>';
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

let kind: "all" | "web" | "mobile" = "all";

/* где работал — по CV (Никита, 21.10): должности, месяцы, главный результат. Знаки — те же, что в 3D-версии */
type Job = { logo?: string; mark?: string; co: string; when: string; role: string; result: string };
const JOBS: Record<"ru" | "en", Job[]> = {
  ru: [
    { logo: "grif", co: "GRIF AI", when: "авг 2025 – авг 2026", role: "Founding Product Designer", result: "Новая фича доходит до кода за 5 дней, раньше уходило 3 недели" },
    { logo: "sber", co: "Сбер", when: "июл 2025 – май 2026", role: "Senior Product Designer", result: "Убрал из оценки рисков ИИ-агентов все 6 ручных передач" },
    { logo: "mos", co: "Цифровые сервисы Москвы", when: "янв 2023 – июл 2025", role: "Senior Product Designer", result: "Запустил «Сообщество» за 9 месяцев, жители написали 250+ историй" },
    { mark: "JD", co: "JustDev", when: "авг 2021 – янв 2023", role: "Product Designer", result: "Приложения iOS и Android, сайты, B2B-кабинеты и CRM" },
  ],
  en: [
    { logo: "grif", co: "GRIF AI", when: "Aug 2025 – Aug 2026", role: "Founding Product Designer", result: "A new feature reaches code in 5 days, down from 3 weeks" },
    { logo: "sber", co: "Sber", when: "Jul 2025 – May 2026", role: "Senior Product Designer", result: "Took all 6 manual handoffs out of AI agent risk review" },
    { logo: "mos", co: "Moscow Digital Services", when: "Jan 2023 – Jul 2025", role: "Senior Product Designer", result: "Launched Community in 9 months, residents wrote 250+ stories" },
    { mark: "JD", co: "JustDev", when: "Aug 2021 – Jan 2023", role: "Product Designer", result: "iOS and Android apps, sites, B2B dashboards and CRMs" },
  ],
};
const jobCard = (j: Job) => `<li class="ll-exp__card">
    <div class="ll-exp__head">
      <span class="ll-exp__logo" aria-hidden="true">${j.logo ? `<img src="${BASE}lite/logos/${j.logo}.svg" alt="" width="44" height="44" loading="lazy">` : esc(j.mark ?? "")}</span>
      <span class="ll-exp__co"><b>${esc(j.co)}</b><span>${esc(j.when)}</span></span>
    </div>
    <p class="ll-exp__role">${esc(j.role)}</p>
    <p class="ll-exp__result">${esc(j.result)}</p>
  </li>`;

/* плитка кейса: обложка (экраны на цветах кейса) с чипами поверх, под ней название, «о проекте» с годом и цифра.
   v114: по мотивам карточек klinaeva — две колонки крупных обложек, теги чипами на самой обложке, курсор «Смотреть»
   цвета кейса. Ссылка ведёт на страницу кейса в облегчённой версии сайта */
const KIND_ICON: Record<string, string> = {
  web: '<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="1.8" y="2.6" width="12.4" height="8.6" rx="1.4"/><path d="M5.6 13.6h4.8"/></svg>',
  mobile: '<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="4.4" y="1.6" width="7.2" height="12.8" rx="1.8"/><path d="M7 12h2"/></svg>',
};
function caseTile(c: CaseItem) {
  const parts = c.tag.split(" · ");
  const year = parts.pop() ?? "";
  const chips = [
    ...c.kind.map((k) => `<span class="ll-tag">${KIND_ICON[k]}${esc(L(`kind.${k}`))}</span>`),
    ...parts.map((t) => `<span class="ll-tag">${esc(t)}</span>`),
  ].join("");
  return `<li class="ll-tile" data-kind="${c.kind.join(" ")}" style="--st0:${c.look.stage[0]};--st1:${c.look.stage[1]}">
    <a href="./?lite=1#/work/${c.id}" aria-label="${esc(`${L("case.open")}: ${c.title}`)}" data-cursor="view" data-tone="${c.look.accent}">
      <span class="ll-tile__art"><img class="is-cover" src="${BASE}lite/cards/${c.id}.webp" alt="" width="960" height="600" loading="lazy" decoding="async"><span class="ll-tile__tags">${chips}</span></span>
      <span class="ll-tile__body">
        <span class="ll-tile__title">${esc(c.title)}</span>
        <span class="ll-tile__about">${esc(c.about ?? c.subtitle)} · ${esc(year)}</span>
        <span class="ll-tile__stat"><b>${esc(c.stat.value)}</b> ${esc(c.stat.label)}</span>
      </span>
      ${arrow}
    </a>
  </li>`;
}

function noteRow(n: (typeof notes)[number]) {
  const title = t(`notes.${n.id}.title` as Key), what = t(`notes.${n.id}.kind` as Key);
  const media = n.video
    ? `<video src="${BASE}${n.video.mp4}" poster="${BASE}${n.image}" muted loop playsinline preload="none"></video>`
    : `<img src="${BASE}${n.image}" alt="" loading="lazy" decoding="async">`;
  const inner = `<span class="ll-row__thumb">${media}</span>
    <span class="ll-row__body"><span class="ll-row__title">${esc(title)}</span><span class="ll-row__what">${esc(what)}</span></span>
    <span class="ll-row__meta">${esc(n.links ? n.meta : L("lab.closed"))}</span>`;
  return n.links
    ? `<li class="ll-row"><a href="${n.links.demo}" target="_blank" rel="noopener" aria-label="${esc(`${L("lab.demo")}: ${title}`)}">${inner}${arrow}</a></li>`
    : `<li class="ll-row"><div>${inner}</div></li>`;
}

/* «о себе»: первая фраза тёмная, продолжение светлее. Фразу о последней должности (Head of Product Design) Никита
   попросил не писать — она выпадает. about.p1 стоит в hero.lead, about.p2 рядом с «5+ лет», поэтому сюда их не добавляем */
function statement() {
  const parts = t("about.intro").split(/(?<=[.!?])\s+/);
  const kept = parts.map((s) => s.trim()).filter((s) => !/Head of|Последняя роль|Most recently/i.test(s));
  const lead = kept.shift() ?? "";
  const rest = kept.join(" ");
  const put = (k: string, s: string) => { const el = document.querySelector(`[data-statement="${k}"]`); if (el) el.textContent = s; };
  put("lead", lead);
  put("rest", rest);
}

function render() {
  document.documentElement.lang = getLang();
  document.querySelectorAll<HTMLElement>("[data-ll]").forEach((el) => (el.textContent = L(el.dataset.ll!)));
  document.querySelectorAll<HTMLElement>("[data-ll-label]").forEach((el) => el.setAttribute("aria-label", L(el.dataset.llLabel!)));
  document.querySelectorAll<HTMLElement>("[data-ll-alt]").forEach((el) => el.setAttribute("alt", L(el.dataset.llAlt!)));
  document.querySelectorAll<HTMLButtonElement>("[data-lang-set]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.langSet === getLang())));
  statement();
  const cases = getCases();
  const exp = document.querySelector("[data-exp]");
  if (exp) exp.innerHTML = JOBS[getLang()].map(jobCard).join("");
  const grid = document.querySelector("[data-cases]");
  if (grid) grid.innerHTML = cases.map(caseTile).join("");
  const list = document.querySelector("[data-notes]");
  if (list) list.innerHTML = notes.map(noteRow).join("");
  applyFilter();
  wireRows();
  refreshDeck?.();
  refreshAscii?.();
  refreshReel?.();
  refreshCursor();
  watchReveal();
}

function applyFilter() {
  document.querySelectorAll<HTMLButtonElement>(".ll-chip").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.kind === kind)));
  document.querySelectorAll<HTMLElement>(".ll-tile").forEach((li) => (li.hidden = kind !== "all" && !li.dataset.kind!.split(" ").includes(kind)));
}

/* превью пэт-проекта играет, пока на строку наведён курсор или она в фокусе. v106: на телефоне роликов нет — только
   обложки: строки с роликами по очереди качали 2,5 МБ, и лёгкая версия переставала быть лёгкой */
function wireRows() {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches || matchMedia("(hover: none)").matches) return;
  document.querySelectorAll<HTMLElement>(".ll-row").forEach((row) => {
    const v = row.querySelector("video");
    if (!v) return;
    const on = () => void v.play().catch(() => {});
    const off = () => v.pause();
    row.addEventListener("pointerenter", on);
    row.addEventListener("pointerleave", off);
    row.addEventListener("focusin", on);
    row.addEventListener("focusout", off);
  });
}

const deckRoot = document.querySelector<HTMLElement>(".hero__deck");
const refreshDeck = deckRoot ? mountHeroDeck(deckRoot, L) : null;
const asciiPre = document.querySelector<HTMLElement>(".ll-foot__ascii");
const refreshAscii = asciiPre ? mountAsciiWord(asciiPre, () => L("foot.word")) : null;
const reelRoot = document.querySelector<HTMLElement>("[data-reel]");
const refreshReel = reelRoot ? mountReel(reelRoot, L) : null;
const refreshCursor = mountCursor(() => L("cursor.view"));

/* почта: кнопка рядом кладёт адрес в буфер и на пару секунд говорит «Скопировано» */
document.querySelector<HTMLButtonElement>(".ll-copy")?.addEventListener("click", async (e) => {
  const b = e.currentTarget as HTMLButtonElement;
  const text = b.querySelector<HTMLElement>("[data-copy-label]")!;
  try { await navigator.clipboard.writeText(b.dataset.copy!); } catch { location.href = `mailto:${b.dataset.copy}`; return; }
  b.classList.add("is-done");
  text.textContent = L("mail.copied");
  setTimeout(() => { b.classList.remove("is-done"); text.textContent = L("mail.copy"); }, 1800);
});

document.querySelector(".ll-chips")?.addEventListener("click", (e) => {
  const b = (e.target as HTMLElement).closest<HTMLButtonElement>(".ll-chip");
  if (!b) return;
  kind = b.dataset.kind as typeof kind;
  applyFilter();
});
document.querySelectorAll<HTMLButtonElement>("[data-lang-set]").forEach((b) => b.addEventListener("click", () => setLang(b.dataset.langSet as "ru" | "en")));

/* чёлка, как в 3D-версии: текущий раздел — светлая плашка; на первом экране подписи видны, в разделах чёлка сжимается
   до значков и подписи текущего (стили — lite-lab.css, .ll-notch) */
const notch = document.querySelector<HTMLElement>(".ll-notch");
const items = [...document.querySelectorAll<HTMLAnchorElement>(".ll-notch [data-nav]")];
const mark = (section: string) => {
  if (!notch || notch.dataset.section === section) return;
  notch.dataset.section = section;
  document.body.dataset.section = section;
  items.forEach((a) => {
    const on = a.dataset.nav === section;
    a.classList.toggle("is-active", on);
    a.toggleAttribute("aria-current", on);
  });
};
const spy = new IntersectionObserver((es) => es.forEach((e) => {
  if (e.isIntersecting) mark(e.target.classList.contains("hero") ? "home" : e.target.id === "results" ? "work" : e.target.id);
}), { rootMargin: "-45% 0px -50% 0px" });
document.querySelectorAll(".hero, #results, #about, #work, #lab, #contact").forEach((el) => spy.observe(el));
initI18n();
onLang(render);
render();

/* язык и переход в 3D — только у самого верха страницы: ушли вниз дальше 80 px — кнопки прячутся */
const onScroll = () => document.body.classList.toggle("is-scrolled", window.scrollY > 80);
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();
