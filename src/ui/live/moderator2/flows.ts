/* 26.10: живой прототип «Кабинета модератора» на финальных экранах из Figma (файл TsqIZDg5rUgbxPNV5ghDZB, страница
   «• Кабинет модератора»), перенесённых конвейером tools/f2h один в один — как у GRIF. Три сценария — вкладки:
   · Пользователи (раздел «Взять в работу и одобрить»): очередь → профиль → «Взять в работу» → «Взять» → «Одобрить» →
     «Профиль одобрен»;
   · Комментарии (раздел «Взять в работу и одобрить»): реестр → «Ещё» раскрывает комментарий в строке → статус
     показывает историю → страница комментария → «Взять в работу»;
   · Спорный случай (раздел «Работа с вкладками страницы комментария»): вкладки «Ветка ответов», «История», «Жалобы».
   Точка нажатия — настоящий слой экрана по имени или тексту из Figma. После конвейера: шрифты макета «Golos» и
   «YS Text» сведены к «Golos Text» (их нет на сайте), глифы Font Awesome Pro в меню заменены своими SVG. */
import data from "./screens.json";
import { createRenderer, type Bundle } from "../grif2/render";
import { hint, make, stagger, type Flow } from "../grif2/kit";
import type { Stage } from "../grif2/stage";

const r = createRenderer(data as Bundle, "md", (n, base) => `${base}cases/moderator-dashboard/live2/${n}.png`);

/* оживление экранов кабинета: строки таблиц встают лесенкой, модалка выходит на затемнении, кнопки решения
   выскакивают по очереди, счётчики во вкладках подпрыгивают, всплывающая история статусов падает сверху */
function liven(el: HTMLElement, key: string, instant: boolean) {
  if (instant) return;
  const all = (sel: string) => [...el.querySelectorAll<HTMLElement>(sel)];
  all('[data-n="table"]').forEach((t) => [...t.children].slice(1).forEach((row, i) => {
    (row as HTMLElement).style.animationDelay = `${80 + i * 35}ms`;
    row.classList.add("g2-rise");
  }));
  all('[data-n="Rectangle 1440"]').forEach((n) => n.classList.add("g2-fade"));
  all('[data-n="modal Login"]').forEach((n) => { n.style.animationDelay = "120ms"; n.classList.add("g2-dialog"); });
  stagger(el, '[data-n="control"] > *', 60, 120, "g2-pop");
  all('[data-n="badge"]').forEach((n, i) => { n.style.animationDelay = `${300 + i * 60}ms`; n.classList.add("g2-pop"); });
  if (key === "cStatus") {
    /* всплывающая «История статусов»: поднимаемся от заголовка до самой плашки */
    let p = [...el.querySelectorAll<HTMLElement>("div")].find((n) => !n.children.length && /История/.test(n.textContent ?? ""));
    while (p && p.offsetWidth < 150 && p.parentElement) p = p.parentElement;
    p?.classList.add("g2-drop");
  }
  if (key.startsWith("d")) {
    /* вкладки страницы комментария: содержимое вкладки проявляется под навигацией */
    const branch = el.querySelector<HTMLElement>('[data-n="Ветки"]');
    [...(branch?.children ?? [])].slice(1).forEach((n, i) => { (n as HTMLElement).style.animationDelay = `${60 + i * 50}ms`; n.classList.add("g2-rise"); });
  }
}

/** слой вкладки страницы комментария по её названию (в таблице ниже есть столбцы с теми же словами) */
const tab = (s: Stage, text: string) => s.hot(text, 1, s.find("Ветки"));

/* ── Пользователи: взять в работу и одобрить ── */
const users: Flow = (s, ctx, step) => {
  const go = (k: number) => { ctx.go(k); users(s, ctx, k); };
  const key = (["uQueue", "uProfile", "uConfirm", "uWork", "uDone"] as const)[Math.min(step, 4)];
  s.show(key);
  if (step === 0) hint(s, s.hot("Андреев Алексей", 2), () => go(1));
  if (step === 1) hint(s, s.hot("Взять в работу", 1), () => go(2));
  if (step === 2) hint(s, s.hot("Взять", 1), () => go(3));
  if (step === 3) hint(s, s.hot("Одобрить", 1), () => go(4));
};

/* ── Комментарии: прочитать в строке, посмотреть статус, открыть страницу и взять в работу ── */
const comments: Flow = (s, ctx, step) => {
  const go = (k: number) => { ctx.go(k); comments(s, ctx, k); };
  const key = (["cList", "cRow", "cStatus", "cData", "cWork"] as const)[Math.min(step, 4)];
  s.show(key);
  if (step === 0) hint(s, s.hot("Ещё", 1), () => go(1));
  if (step === 1) hint(s, s.hot("Новый", 1), () => go(2));
  if (step === 2) hint(s, s.hot("Гусь отличный", 1), () => go(3));
  if (step === 3) hint(s, s.hot("Взять в работу", 1), () => go(4));
};

/* ── Спорный случай: весь контекст на вкладках одной страницы ── */
const disputed: Flow = (s, ctx, step) => {
  const go = (k: number) => { ctx.go(k); disputed(s, ctx, k); };
  const key = (["dComment", "dThread", "dHistory", "dComplaints"] as const)[Math.min(step, 3)];
  s.show(key);
  if (step === 0) hint(s, tab(s, "Ветка ответов"), () => go(1));
  if (step === 1) hint(s, tab(s, "История"), () => go(2));
  if (step === 2) hint(s, tab(s, "Жалобы"), () => go(3));
};

export const flows = {
  users: make({ w: 1440 }, users, r, liven),
  comments: make({ w: 1440 }, comments, r, liven),
  disputed: make({ w: 1440 }, disputed, r, liven),
};
