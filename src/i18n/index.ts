/* Два языка страницы (v27). Английский — исходный, русский — второй; переключатель стоит в доке.

   Как это устроено. Все надписи живут в словарях `en.ts` и `ru.ts` под одинаковыми ключами —
   TypeScript не даст забыть строку в русском словаре. Разметка в index.html помечена атрибутами
   `data-i18n` (текст), `data-i18n-html` (текст с тегами внутри), `data-i18n-label` (aria-label),
   `data-i18n-alt`, `data-i18n-title`; applyStatic проходит по ним и подставляет строки.
   Всё, что собирается кодом (лента кейсов, меню Work, страница кейса, лёгкая версия, экран
   компьютера), берёт строки через `t()` и подписывается на `onLang` — язык переключается без
   перезагрузки, а холм не собирается заново.

   Выбор языка: `?lang=ru` в адресе, потом сохранённый выбор, потом язык браузера. Выбранный
   язык остаётся в адресе — ссылку можно переслать, и она откроется на том же языке. */
import en from "./en";
import ru from "./ru";

export type Lang = "en" | "ru";
export type Key = keyof typeof en;

const DICTS: Record<Lang, Record<Key, string>> = { en, ru };
const KEY = "hill-lang";

function saved(): Lang | null {
  try {
    const v = localStorage.getItem(KEY);
    return v === "ru" || v === "en" ? v : null;
  } catch {
    return null; // приватный режим
  }
}

function pick(): Lang {
  const q = new URLSearchParams(location.search).get("lang");
  if (q === "ru" || q === "en") return q;
  const s = saved();
  if (s) return s;
  return (navigator.languages ?? [navigator.language]).some((l) => /^ru\b/i.test(l ?? "")) ? "ru" : "en";
}

let lang: Lang = pick();
const listeners = new Set<(l: Lang) => void>();

export const getLang = () => lang;

/** строка по ключу; {n} и прочие подстановки — вторым аргументом */
export function t(key: Key, vars?: Record<string, string | number>): string {
  const s = DICTS[lang][key] ?? DICTS.en[key] ?? String(key);
  return vars ? s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m)) : s;
}

/** подписаться на смену языка; вызывается и сразу, если нужно, — это решает сам модуль */
export function onLang(cb: (l: Lang) => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

/** подставить строки в готовую разметку */
export function applyStatic(root: ParentNode = document) {
  const put = (attr: string, fn: (el: HTMLElement, s: string) => void) => {
    root.querySelectorAll<HTMLElement>(`[${attr}]`).forEach((el) => {
      const key = el.getAttribute(attr) as Key;
      if (key) fn(el, t(key));
    });
  };
  put("data-i18n", (el, s) => (el.textContent = s));
  put("data-i18n-html", (el, s) => (el.innerHTML = s));
  put("data-i18n-label", (el, s) => el.setAttribute("aria-label", s));
  put("data-i18n-alt", (el, s) => el.setAttribute("alt", s));
  put("data-i18n-title", (el, s) => el.setAttribute("title", s));
}

function meta(name: string, attr: "name" | "property", value: string) {
  document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${name}"]`)?.setAttribute("content", value);
}

function paint() {
  document.documentElement.lang = lang;
  document.body.classList.toggle("lang-ru", lang === "ru");
  document.title = t("doc.title");
  meta("description", "name", t("doc.desc"));
  meta("og:title", "property", t("doc.title"));
  meta("og:description", "property", t("doc.og"));
  applyStatic();
}

export function setLang(next: Lang) {
  if (next === lang) return;
  lang = next;
  try { localStorage.setItem(KEY, next); } catch { /* приватный режим */ }
  /* язык — часть ссылки: пересланный адрес откроется тем же */
  const url = new URL(location.href);
  url.searchParams.set("lang", next);
  history.replaceState(history.state, "", url);
  paint();
  listeners.forEach((cb) => cb(next));
}

export const otherLang = (): Lang => (lang === "en" ? "ru" : "en");

/** первый проход: до того, как модули начнут собирать свою разметку */
export function initI18n() {
  paint();
}
