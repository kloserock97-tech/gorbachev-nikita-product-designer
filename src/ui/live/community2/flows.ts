/* 26.10: живой прототип «Сообщества» на финальных экранах из Figma (файл LdUrYy9cNus6q7005xnmXo, страница
   Pilot Layouts, серия 21061: лента 89858, история 90076, форма 91710, профиль 91430), перенесённых конвертером
   tools/f2h один в один. Устроен как прототип GRIF: сценарии вкладками, кольцо-подсказка на настоящем слое,
   экраны живые.
   · Прочитать историю: лента → «Загадочная Дангауэровка» → лайк → комментарий → комментарий в обсуждении.
   · Рассказать историю: кнопка в шапке → форма (заголовок и текст печатаются) → «Отправить» → активность профиля.
   Экраны выше окна (лента 3058 px, история 4010 px) прокручиваются внутри сцены; к нужному слою сцена доезжает сама. */
import data from "./screens.json";
import "./fonts.css";
import { createRenderer, type Bundle } from "../grif2/render";
import { hint, make, stagger, type Flow } from "../grif2/kit";
import type { Stage } from "../grif2/stage";

const r = createRenderer(data as Bundle, "cm", (n, base) => `${base}cases/community/live2/${n}.webp`);

/** верх слоя внутри экрана — сумма offsetTop до корня экрана */
function topOf(s: Stage, el: HTMLElement) {
  let y = 0;
  for (let n: HTMLElement | null = el; n && n !== s.el; n = n.offsetParent as HTMLElement | null) y += n.offsetTop;
  return y;
}
/** сцена доезжает до слоя: он встаёт на треть окна сверху */
function reach(s: Stage, el: HTMLElement | null, calm: boolean) {
  const root = s.el?.parentElement;
  if (!el || !root) return;
  root.scrollTo({ top: Math.max(0, topOf(s, el) - root.clientHeight * 0.3), behavior: calm ? "auto" : "smooth" });
}
/** слой el вырос на dy: растут он и все предки до экрана, соседи ниже него на каждом уровне съезжают вниз */
function grow(s: Stage, el: HTMLElement, dy: number) {
  for (let n: HTMLElement | null = el; n && n !== s.el; n = n.parentElement) {
    const bottom = n.offsetTop + n.offsetHeight;
    [...(n.parentElement?.children ?? [])].forEach((c) => {
      const e = c as HTMLElement;
      if (e !== n && e.offsetTop >= bottom - 1) e.style.top = `${e.offsetTop + dy}px`;
    });
    n.style.height = `${n.offsetHeight + dy}px`;
  }
  s.el.style.height = `${s.el.offsetHeight + dy}px`;
}
/** слой-предок текстового слоя с именем name */
const up = (el: HTMLElement | null, name: string) => (el?.closest<HTMLElement>(`[data-n="${name}"]`) ?? null);

/* лента и история оживают: карточки входят лесенкой, «Прослушать» и реакции выскакивают */
function liven(el: HTMLElement, key: string) {
  if (key === "feed") stagger(el, '[data-n="Publication Card"], [data-n="Question Card"], [data-n="News"] [data-n="card_content"]', 50, 120);
  if (key === "story") stagger(el, '[data-n="Head"] > *', 60, 120, "g2-pop");
  if (key === "profile") stagger(el, '[data-n="Activity Case"]', 70, 160);
}

/* ── прочитать историю ── */
let typed = "";
const read: Flow = (s, ctx, step) => {
  const go = (k: number) => { ctx.go(k); read(s, ctx, k); };
  if (step === 0) {
    s.show("feed");
    const card = up(s.text("Загадочная Дангауэровка") ?? s.find("Загадочная Дангауэровка", true), "Publication Card");
    s.later(700, () => { reach(s, card, ctx.calm); s.later(450, () => hint(s, card, () => go(1))); });
    return;
  }
  const like = () => {
    /* реакция: первый счётчик в строке иконок под заголовком истории (Article → Icons → like+share) */
    const btn = s.find("Article")?.querySelector<HTMLElement>('[data-n="Icons"] [data-n="like+share"] > [data-n="Icon+txt"]');
    return [...(btn?.querySelectorAll<HTMLElement>("div") ?? [])].find((n) => !n.children.length && /^\d+$/.test(n.textContent?.trim() ?? "")) ?? null;
  };
  if (step === 1) {
    s.show("story");
    const count = like();
    hint(s, count?.parentElement ?? count, () => go(2));
    return;
  }
  if (step === 2) {
    s.show("story", true);
    const count = like();
    if (count) { count.textContent = String(+(count.textContent ?? "0") + 1); count.parentElement?.classList.add("g2-pop"); }
    const box = s.find("My comment");
    const field = [...(box?.querySelectorAll<HTMLElement>("div") ?? [])].find((n) => !n.children.length && /комментари/i.test(n.textContent ?? "")) ?? null;
    typed = "Жил рядом и не знал, что у квартала такая история. Спасибо!";
    s.later(500, () => {
      reach(s, box, ctx.calm);
      s.later(500, () => {
        field?.style.setProperty("color", "#1d1d1f");
        void s.type(field, typed, 28).then(() => hint(s, box?.querySelector<HTMLElement>('[data-n="Button Main"]') ?? null, () => go(3)));
      });
    });
    return;
  }
  /* итог: счётчик обсуждения +1, ваш комментарий встаёт первым в ветке */
  s.show("story", true);
  const count = like();
  if (count) count.textContent = String(+(count.textContent ?? "0") + 1);
  /* «Комментарии 5» — заголовок из кусков текста, число — последний */
  const title = s.find("Number comments");
  const num = [...(title?.querySelectorAll<HTMLElement>("span, div") ?? [])].filter((n) => !n.children.length && /^\s*\d+\s*$/.test(n.textContent ?? "")).pop();
  if (num) { num.textContent = num.textContent!.replace(/\d+/, (m) => String(+m + 1)); num.classList.add("g2-pop"); }
  /* слои стоят абсолютно, как в Figma: новый комментарий встаёт первым, а всё ниже по цепочке родителей
     сдвигается на его высоту с отступом */
  const first = s.find("Comments")?.querySelector<HTMLElement>('[data-n="comment2"]') ?? null;
  if (first && first.parentElement) {
    const next = first.nextElementSibling as HTMLElement | null;
    const gap = next ? next.offsetTop - first.offsetTop - first.offsetHeight : 24;
    const dy = first.offsetHeight + gap;
    grow(s, first.parentElement, dy);
    [...first.parentElement.children].forEach((c) => { const e = c as HTMLElement; e.style.top = `${e.offsetTop + dy}px`; });
    const mine = first.cloneNode(true) as HTMLElement;
    mine.style.top = `${first.offsetTop - dy}px`;
    const name = [...mine.querySelectorAll<HTMLElement>("div")].find((n) => !n.children.length && /Венди/.test(n.textContent ?? ""));
    if (name) name.textContent = "Юлия Некрасова";
    /* аватар — тот же, что у пользователя в шапке; чужие рейтинг, статус и значок у комментария не оставляем */
    const own = [...(s.find("Header Full")?.querySelectorAll<HTMLElement>("div") ?? [])].find((n) => /url\(/.test(getComputedStyle(n).backgroundImage));
    const ava = mine.querySelector<HTMLElement>('[data-n="avatar"] > div');
    if (own && ava) ava.className = own.className;
    [...mine.querySelectorAll<HTMLElement>("div")].forEach((n) => { if (!n.children.length && /^(\d+|Экстраверт|Мастер пера)$/.test(n.textContent?.trim() ?? "")) (n.parentElement ?? n).style.visibility = "hidden"; });
    mine.querySelectorAll<HTMLElement>('[data-n="Nickname"]').forEach((n) => (n.style.visibility = "hidden"));
    const body = [...mine.querySelectorAll<HTMLElement>("div")].filter((n) => !n.children.length).sort((a, b) => (b.textContent?.length ?? 0) - (a.textContent?.length ?? 0))[0];
    if (body) body.textContent = typed || "Спасибо за историю!";
    mine.classList.add("g2-rise");
    first.parentElement.insertBefore(mine, first);
  }
  s.later(300, () => reach(s, title ?? first, ctx.calm));
};

/* ── рассказать историю ── */
const write: Flow = (s, ctx, step) => {
  const go = (k: number) => { ctx.go(k); write(s, ctx, k); };
  if (step === 0) {
    s.show("feed");
    hint(s, s.find("Header Full")?.querySelector<HTMLElement>('[data-n="Button Main"]') ?? null, () => go(1));
    return;
  }
  if (step === 1) {
    s.show("write");
    /* поле заголовка в макете пустое (без текстового слоя) — ставим в него слой по образцу заполненного поля
       почты; в поле текста печатаем поверх подсказки «О чем вы хотите рассказать» */
    const field = (i: number) => s.find("inputs")?.querySelectorAll<HTMLElement>('[data-n="input"]')[i]?.querySelector<HTMLElement>('[data-n^="input / "]') ?? null;
    const filled = s.find("input / filled / false")?.querySelector<HTMLElement>('[data-n="Text"]') ?? null;
    let title = field(0)?.querySelector<HTMLElement>('[data-n="Text"]') ?? null;
    if (!title && field(0) && filled) { title = filled.cloneNode(false) as HTMLElement; field(0)!.append(title); }
    const body = field(1)?.querySelector<HTMLElement>('[data-n="Text"]') ?? null;
    const send = s.find("Frame 1321316932")?.querySelector<HTMLElement>('[data-n="Button Main"]') ?? null;
    s.later(500, async () => {
      title?.style.setProperty("color", "#1d1d1f");
      await s.type(title, "Двор, который соседи сделали сами", 30);
      body?.style.setProperty("color", "#1d1d1f");
      await s.type(body, "Три года назад здесь была парковка. Рассказываю, как мы договорились и что посадили.", 18);
      hint(s, send, () => go(2));
    });
    return;
  }
  s.show("profile");
  const done = up(s.text("Публикация истории"), "Activity Case");
  done?.querySelector<HTMLElement>('[data-n="Bubble"]')?.classList.add("g2-pop");
  done?.classList.add("g2-await");
  s.later(600, () => reach(s, done, ctx.calm));
};

export const flows = {
  read: make({ w: 1440 }, read, r, liven),
  write: make({ w: 1440 }, write, r, liven),
};
