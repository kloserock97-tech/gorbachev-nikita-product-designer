/* 26.10: живой прототип «Риски ИИ-агентов» на финальных экранах из Figma (Sber-AI-Agent, XomA0T1zFMATidI4Qq5nEw,
   страницы 01–03), перенесённых конвертером tools/f2h один в один — как у GRIF. Три сценария — вкладки прототипа:
   · Оценка агента: реестр → карточка агента → «Загрузить архив» → модель разбирает архив → черновик из 13 рисков →
     карточка риска → «Редактировать» (уровень и обоснование риск-менеджера).
   · Поиск оценки: реестр оценок → фильтр → значения выбраны → фильтр применён.
   · Риск не применим: карточка риска → «Не применим» → причина → «Принять» → «Восстановить риск» → риск снова в оценке.
   Точка нажатия — настоящий слой экрана по имени из Figma, кольцо рисует stage.mark. */
import data from "./screens.json";
import { createRenderer, type Bundle } from "../grif2/render";
import { hint, make, type Flow } from "../grif2/kit";
import type { Stage } from "../grif2/stage";
import "./agents2.css";

/* экраны кейса — общие для прототипа и демо решений (demos.ts) */
export const r = createRenderer(data as Bundle, "ag", (n, base) => `${base}cases/ai-agents/live2/${n}.png`);

const q = (s: Stage, sel: string) => s.el.querySelector<HTMLElement>(sel);
const qa = (el: ParentNode, sel: string) => [...el.querySelectorAll<HTMLElement>(sel)];
const leaf = (el: ParentNode | null, re: RegExp) => (el ? qa(el, "div").find((n) => !n.children.length && re.test(n.textContent ?? "")) ?? null : null);

/* число в плитке досчитывает до своего значения — сводка реестра «оживает», как после загрузки данных */
function countUp(n: HTMLElement, ms = 700) {
  const to = Number((n.textContent ?? "").replace(/\s/g, ""));
  if (!Number.isFinite(to) || to < 2) return;
  const t0 = performance.now();
  const step = (now: number) => {
    if (!n.isConnected) return;
    const k = Math.min(1, (now - t0) / ms);
    n.textContent = String(Math.round(to * (1 - Math.pow(1 - k, 3))));
    if (k < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

/* в макетах подписи кнопок и бейджей обрезаны по высоте прописных (leading trim): слой ниже кегля, а конвертер этого не
   знает — текст садится на 3–4 px ниже. Строка высотой ровно в слой возвращает подпись в центр */
/* 26.10: прогресс в продукте сплошной, а не сегментами (Никита). В кадре «Формирование» полоса нарисована 13 сегментами —
   прячем их и кладём одну заливку той же высоты и цвета на серую дорожку. Доля — из подписи «готово N рисков из M».
   Работает всегда (хук fix), рост заливки — в liven */
export function solidProgress(el: HTMLElement) {
  for (const track of qa(el, '[data-n="AI Progress"] [data-n="Track"]')) {
    const segs = [...track.children].filter((n) => (n as HTMLElement).dataset.n?.startsWith("Segment")) as HTMLElement[];
    if (!segs.length || track.querySelector(".ag-fill")) continue;
    const title = track.closest('[data-n="AI Progress"]')?.querySelector<HTMLElement>('[data-n="Title"]')?.textContent ?? "";
    const m = title.match(/(\d+)\D+(\d+)/);
    const share = m ? Math.min(1, +m[1] / +m[2]) : 0.6;
    segs.forEach((n) => (n.style.display = "none"));
    track.style.background = "#e2e6ec";
    const fill = document.createElement("i");
    fill.className = "ag-fill";
    fill.style.cssText = `left:0;top:0;height:100%;width:${(share * 100).toFixed(2)}%;border-radius:999px;background:linear-gradient(90deg,#2563eb,#584bec)`;
    track.append(fill);
  }
}
export function fix(el: HTMLElement) { trimCaps(el); solidProgress(el); }

export function trimCaps(el: HTMLElement) {
  for (const n of qa(el, "div")) {
    if (n.children.length || !n.textContent?.trim()) continue;
    const h = n.offsetHeight, fs = parseFloat(getComputedStyle(n).fontSize);
    if (h && fs && h < fs) n.style.lineHeight = `${h}px`;
  }
}

/* оживление экранов продукта: имена слоёв — из Figma */
export function liven(el: HTMLElement, key: string, instant: boolean) {
  /* разбор архива идёт: сегменты прогресса загораются по очереди, заготовки рисков переливаются */
  qa(el, '[data-n="Skeleton / Risk Item"] div').forEach((n) => { if (!n.children.length) n.classList.add("g2-shimmer"); });
  /* реестр грузится: заготовки цифр сводки переливаются (кадр 01.2) */
  qa(el, '[data-n="Skeleton bar"]').forEach((n) => n.classList.add("g2-shimmer"));
  if (instant) return;
  const stag = (sel: string, step = 45, from = 60, cls = "g2-rise") => qa(el, sel).forEach((n, i) => { n.style.animationDelay = `${from + i * step}ms`; n.classList.add(cls); });
  stag('[data-n="Totals"] > [data-n="Stat Tile"], [data-n="By risk"] > [data-n="Risk Summary Tile"]', 40, 60);
  stag('[data-n="List"] > [data-n="Agent Card"], [data-n="List"] > [data-n="Assessment Card"]', 55, 160);
  stag('[data-n="Risk Item"]', 50, 120);
  stag('[data-n="Applied filters slot"] > *', 60, 80, "g2-pop");
  if (key === "reg") qa(el, '[data-n="Stat Tile"] div, [data-n="Risk Summary Tile"] div').filter((n) => !n.children.length && /^\d[\d\s]*$/.test(n.textContent?.trim() ?? "")).forEach((n) => countUp(n));
  if (key === "forming") {
    el.querySelector<HTMLElement>('[data-n="AI Progress"] .ag-fill')?.classList.add("ag-fill-grow");
    el.querySelector<HTMLElement>('[data-n="AI mark"]')?.classList.add("g2-breathe");
  }
  el.querySelector<HTMLElement>('[data-n="AI Banner"]')?.classList.add("g2-drop");
  /* меню сортировки (кадр 01.8) раскрывается, пункты встают по очереди */
  if (key === "sort") { el.querySelector<HTMLElement>('[data-n="Sort Menu"]')?.classList.add("g2-drop"); stag('[data-n="Sort Menu"] [data-n="Menu Item"]', 45, 90); }
  el.querySelector<HTMLElement>('[data-n="Version Stepper"]')?.classList.add("g2-rise");
}

/* шторка справа выезжает, фон под ней темнеет; окно-вопрос — по центру над шторкой */
export function drawer(s: Stage, instant = false) {
  if (instant) return;
  q(s, ':scope > div > [data-n="Scrim"]')?.classList.add("g2-fade");
  q(s, ':scope > div > [data-n="Drawer"]')?.classList.add("ag-drawer");
}
export function dialog(s: Stage) {
  q(s, ':scope > div > [data-n="Scrim 2"]')?.classList.add("g2-fade");
  q(s, ':scope > div > [data-n="Dialog"]')?.classList.add("g2-dialog");
}

/* ── оценка агента ── */
const assess: Flow = (s, ctx, step) => {
  const go = (k: number) => { ctx.go(k); assess(s, ctx, k); };
  if (step === 0) { s.show("reg"); hint(s, q(s, '[data-n="List"] > [data-n="Agent Card"]'), () => go(1)); return; }
  if (step === 1) { s.show("card"); hint(s, q(s, '[data-n="Empty State"] [data-n="Button"]'), () => go(2)); return; }
  if (step === 2) { s.show("forming"); s.later(2900, () => go(3)); return; }
  if (step === 3) { s.show("draft"); hint(s, q(s, '[data-n="Risk Item"]'), () => go(4)); return; }
  if (step === 4) { s.show("risk"); drawer(s); hint(s, q(s, '[data-n="Footer"] > [data-n="Edit"]'), () => go(5)); return; }
  /* правка: уровень «Средний» и обоснование риск-менеджера набираются на глазах, «Сохранить» ждёт решения */
  s.show("edit", true);
  const value = q(s, '[data-n="Textarea"] > [data-n="Value"]');
  const text = value?.textContent ?? "";
  qa(s.el, '[data-n="Chips"] > [data-n="Chip"]').forEach((c) => { if (/Средний/.test(c.textContent ?? "")) c.classList.add("g2-pop"); });
  void s.type(value, text, 22);
  s.later(text.length * 22 + 80, () => q(s, '[data-n="Сохранить"]')?.classList.add("g2-await"));
};

/* ── поиск оценки фильтром ── */
const filter: Flow = (s, ctx, step) => {
  const go = (k: number) => { ctx.go(k); filter(s, ctx, k); };
  if (step === 0) { s.show("assess"); hint(s, q(s, '[data-n="Search row"] > [data-n="Filter"]'), () => go(1)); return; }
  if (step === 1) { s.show("fsheet"); drawer(s); hint(s, q(s, '[data-n="Chip / Высокий"]'), () => go(2)); return; }
  if (step === 2) {
    s.show("fpicked", true);
    qa(s.el, '[data-n="Chip / Продукт"], [data-n="Chip / Высокий"], [data-n="Chip / Оценка"]').forEach((c, i) => { c.style.animationDelay = `${i * 90}ms`; c.classList.add("g2-pop"); });
    leaf(q(s, '[data-n="Drawer"]'), /^Найдено/)?.classList.add("g2-sheen");
    hint(s, q(s, '[data-n="Drawer"] [data-n="Head"] > [data-n="Close"]'), () => go(3));
    return;
  }
  s.show("fapplied");
};

/* ── риск не применим и обратно ── */
const na: Flow = (s, ctx, step) => {
  const go = (k: number) => { ctx.go(k); na(s, ctx, k); };
  if (step === 0) { s.show("risk"); drawer(s); hint(s, q(s, '[data-n="Footer"] > [data-n="Not applicable"]'), () => go(1)); return; }
  if (step === 1) { s.show("naEmpty", true); dialog(s); hint(s, q(s, '[data-n="Reason field"]'), () => go(2)); return; }
  if (step === 2) {
    /* причина набирается, счётчик растёт, «Принять» становится доступна */
    s.show("naFilled", true);
    const value = q(s, '[data-n="Reason field"] > [data-n="Value"]');
    const counter = q(s, '[data-n="Reason field"] > [data-n="Counter"]');
    const text = value?.textContent ?? "";
    const total = counter?.textContent ?? "";
    const confirm = q(s, '[data-n="Actions"] > [data-n="Confirm"]');
    confirm?.classList.add("ag-dim");
    /* всё на таймерах сцены: ушли со шага — печать и счётчик останавливаются вместе с ней */
    void s.type(value, text, 18);
    for (let i = 1; i <= text.length; i += 4) s.later(i * 18, () => { if (counter) counter.textContent = total.replace(/^\d+/, String(i)); });
    s.later(text.length * 18 + 80, () => { if (counter) counter.textContent = total; confirm?.classList.remove("ag-dim"); hint(s, confirm, () => go(3)); });
    return;
  }
  if (step === 3) {
    s.show("naDone", true);
    qa(s.el, '[data-n="Badges"] > [data-n="Risk Badge"]').slice(1).forEach((b) => b.classList.add("g2-pop"));
    hint(s, q(s, '[data-n="Footer"] > [data-n="Edit"]'), () => go(4));
    return;
  }
  if (step === 4) { s.show("restoreQ", true); dialog(s); hint(s, q(s, '[data-n="Dialog"] [data-n="Actions"] > [data-n="Button"]'), () => go(5)); return; }
  s.show("restored", true);
  q(s, '[data-n="History"]')?.classList.add("g2-rise");
  q(s, '[data-n="Toast"]')?.classList.add("ag-toast");
};

export const flows = {
  assess: make({ w: 1440 }, assess, r, liven, fix),
  filter: make({ w: 1440 }, filter, r, liven, fix),
  na: make({ w: 1440 }, na, r, liven, fix),
};
