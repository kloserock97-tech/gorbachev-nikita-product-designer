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
    "facts.cases": "Кейсов на сайте",
    "facts.teams": "Размер команд",
    "work.title": "Кейсы",
    "work.filter": "Показать кейсы",
    "filter.all": "Все",
    "filter.web": "Веб",
    "filter.mobile": "Мобайл",
    "lab.note": "Графика в браузере и продукты, которые я сделал для себя",
    "lab.closed": "Закрытый проект",
    "lab.demo": "Открыть демо",
    "case.open": "Открыть кейс",
    "contact.title": "Давайте сделаем сложное понятным",
    "foot.nav": "Разделы",
    "foot.social": "Где ещё найти",
    "foot.word": "Designer",
    "deck.label": "Кейсы и пэт-проекты",
    "deck.case": "Кейс",
    "deck.note": "Пэт-проект",
    "deck.prev": "Предыдущий проект",
    "deck.next": "Следующий проект",
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
    "facts.cases": "Case studies here",
    "facts.teams": "Team size",
    "work.title": "Work",
    "work.filter": "Filter the work",
    "filter.all": "All",
    "filter.web": "Web",
    "filter.mobile": "Mobile",
    "lab.note": "Graphics in the browser and products I made for myself",
    "lab.closed": "Private project",
    "lab.demo": "Open the demo",
    "case.open": "Open the case",
    "contact.title": "Let's make the complex clear",
    "foot.nav": "Sections",
    "foot.social": "Elsewhere",
    "foot.word": "Designer",
    "deck.label": "Case studies and pet projects",
    "deck.case": "Case study",
    "deck.note": "Pet project",
    "deck.prev": "Previous project",
    "deck.next": "Next project",
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

/* плитка кейса: его диорама на фоне цветов кейса; ссылка ведёт на страницу кейса в облегчённой версии сайта */
function caseTile(c: CaseItem) {
  const art = c.look.diorama?.src ?? c.look.screen?.src ?? "";
  return `<li class="ll-tile" data-kind="${c.kind.join(" ")}" style="--st0:${c.look.stage[0]};--st1:${c.look.stage[1]}">
    <a href="./?lite=1#/work/${c.id}" aria-label="${esc(`${L("case.open")}: ${c.title}`)}">
      <span class="ll-tile__art"><img src="${BASE}${art}" alt="" loading="lazy" decoding="async"></span>
      <span class="ll-tile__body">
        <span class="ll-tile__title">${esc(c.title)}</span>
        <span class="ll-tile__about">${esc(c.about ?? c.subtitle)}</span>
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
   попросил не писать — она выпадает; если остаётся мало, добавляется «что лучше всего умею» */
function statement() {
  const parts = t("about.intro").match(/[^.!?]+[.!?]+/g) ?? [t("about.intro")];
  const kept = parts.map((s) => s.trim()).filter((s) => !/Head of|Последняя роль|Most recently/i.test(s));
  const lead = kept.shift() ?? "";
  let rest = kept.join(" ");
  if (rest.length < 120) rest = `${rest} ${t("about.p1")}`.trim();
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
  const count = document.querySelector("[data-facts-cases]");
  if (count) count.textContent = String(cases.length);
  const grid = document.querySelector("[data-cases]");
  if (grid) grid.innerHTML = cases.map(caseTile).join("");
  const list = document.querySelector("[data-notes]");
  if (list) list.innerHTML = notes.map(noteRow).join("");
  applyFilter();
  wireRows();
  refreshDeck?.();
  refreshAscii?.();
}

function applyFilter() {
  document.querySelectorAll<HTMLButtonElement>(".ll-chip").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.kind === kind)));
  document.querySelectorAll<HTMLElement>(".ll-tile").forEach((li) => (li.hidden = kind !== "all" && !li.dataset.kind!.split(" ").includes(kind)));
}

/* превью пэт-проекта играет, пока на строку наведён курсор или она в фокусе; на телефоне — пока строка на экране */
function wireRows() {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const touch = matchMedia("(hover: none)").matches;
  const io = touch ? new IntersectionObserver((es) => es.forEach((e) => {
    const v = e.target.querySelector("video");
    if (v) (e.isIntersecting ? v.play().catch(() => {}) : v.pause());
  }), { threshold: 0.6 }) : null;
  document.querySelectorAll<HTMLElement>(".ll-row").forEach((row) => {
    const v = row.querySelector("video");
    if (!v) return;
    if (io) return io.observe(row);
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
  items.forEach((a) => {
    const on = a.dataset.nav === section;
    a.classList.toggle("is-active", on);
    a.toggleAttribute("aria-current", on);
  });
};
const spy = new IntersectionObserver((es) => es.forEach((e) => {
  if (e.isIntersecting) mark(e.target.classList.contains("hero") ? "home" : e.target.id);
}), { rootMargin: "-45% 0px -50% 0px" });
document.querySelectorAll(".hero, #about, #work, #lab, #contact").forEach((el) => spy.observe(el));
initI18n();
onLang(render);
render();

