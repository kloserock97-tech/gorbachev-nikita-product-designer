/* 26.10: «Плати частями» — прототип на экранах из Figma один в один, как у GRIF (конвейер tools/f2h, файл
   BzIehGAJZ6BPyHDEFYffyA, страница «📱 Screens»: 89:3864 главный, 89:3865 хаб, 89:3866 шторка переноса,
   89:3867 перенос применён, 289:2780 «Откуда цифры»). Два сценария — две вкладки:
   · Перенос к зарплате: главный экран банка → хаб → «Перенести на 6 сен» → шторка «Проверьте новый график» →
     «Перенести платёж» → платёж 6 сентября, график пересчитан.
   · Откуда цифры: главный → хаб → «Откуда цифры» → шторка с расчётом.
   Точки нажатия — настоящие слои кадров по их именам; кольцо рисует stage.mark. */
import data from "./screens.json";
import { createRenderer, type Bundle } from "../grif2/render";
import { hint, make, type Flow } from "../grif2/kit";
import type { Stage } from "../grif2/stage";

const r = createRenderer(data as Bundle, "pc", (n, base) => `${base}cases/plati-chastyami/live2/${n}.png`);
const OUT = "cubic-bezier(0.23, 1, 0.32, 1)";
const DRAWER = "cubic-bezier(0.32, 0.72, 0, 1)";

/* сумма «103 913 ₽» дорастает от нуля, как будто считается; разделитель тысяч — тот же, что в макете */
function countUp(s: Stage, el: HTMLElement | null, ms = 700) {
  const m = el?.textContent?.match(/^(\D*?)(\d[\d   ]*\d|\d)(.*)$/s);
  if (!el || !m) return;
  const sep = m[2].match(/[   ]/)?.[0] ?? " ";
  const to = +m[2].replace(/\D/g, "");
  const fmt = (v: number) => String(v).replace(/\B(?=(\d{3})+(?!\d))/g, sep);
  const n = 18;
  for (let i = 0; i <= n; i++) {
    const k = 1 - Math.pow(1 - i / n, 3);
    s.later((ms * i) / n, () => { el.textContent = `${m[1]}${fmt(Math.round(to * k))}${m[3]}`; });
  }
}
const leaf = (root: ParentNode | null, re: RegExp) => [...(root?.querySelectorAll<HTMLElement>("div") ?? [])].find((n) => !n.children.length && re.test(n.textContent ?? "")) ?? null;
const kids = (el: HTMLElement | null) => [...(el?.children ?? [])] as HTMLElement[];

/* экраны продукта живые: что в макете «приезжает» снизу — шторка, что считается — сумма, что растёт — шкалы */
function liven(el: HTMLElement, key: string, instant: boolean) {
  const $ = (n: string) => el.querySelector<HTMLElement>(`[data-n="${n}"]`);
  const lead = (list: (HTMLElement | null | undefined)[], step = 50, from = 60, cls = "g2-rise") =>
    list.filter(Boolean).forEach((n, i) => { n!.style.animationDelay = `${from + i * step}ms`; n!.classList.add(cls); });
  $("3D · Знак «частями»")?.classList.add("g2-float");
  el.querySelectorAll<HTMLElement>('[data-n="бейдж · новое"]').forEach((n) => n.classList.add("g2-pulse"));
  if (instant) return;
  if (key === "home") lead([...kids($("Действия")), $("Виджет / Плати частями")], 60, 80);
  if (key === "hub" || key === "moved") {
    lead([...kids($("Быстрые действия")), ...kids($("Content")).slice(0, 4)], 45, 80);
    el.querySelectorAll<HTMLElement>('[data-n="Сегменты"] > *').forEach((n) => n.classList.add("g2-grow"));
  }
  /* шторка выезжает снизу по кривой iOS-шторки, затемнение под ней проявляется */
  const sheet = el.querySelector<HTMLElement>('[data-n^="Sheet /"]');
  if (sheet) {
    $("Scrim")?.classList.add("g2-fade");
    sheet.animate([{ transform: "translateY(100%)" }, { transform: "translateY(0)" }], { duration: 480, easing: DRAWER, fill: "backwards" });
    lead(kids(sheet).filter((k) => k.dataset.n !== "space"), 40, 220);
  }
  if (key === "confirm") {
    /* листки календаря: «было» и «станет» выскакивают по очереди */
    el.querySelectorAll<HTMLElement>('[data-n^="листок ·"]').forEach((n, i) => { n.style.animationDelay = `${420 + i * 220}ms`; n.classList.add("g2-pop"); });
  }
  if (key === "moved") {
    const sheetLeaf = $("осевший листок");
    if (sheetLeaf) { sheetLeaf.style.animationDelay = "260ms"; sheetLeaf.classList.add("g2-drop"); }
  }
  if (key === "why") {
    /* шкала бюджета: сегменты дорастают по очереди; столбики динамики растут снизу */
    el.querySelectorAll<HTMLElement>('[data-n^="сегмент ·"]').forEach((n, i) => { n.style.animationDelay = `${380 + i * 160}ms`; n.classList.add("g2-grow"); });
    el.querySelectorAll<HTMLElement>('[data-n="График"] [data-n="месяц"] > div:not([data-n*="подпись"])').forEach((n, i) => {
      if (n.children.length || n.offsetHeight < 8) return;
      n.animate([{ transform: "scaleY(0.1)", transformOrigin: "50% 100%" }, { transform: "scaleY(1)", transformOrigin: "50% 100%" }], { duration: 620, delay: 500 + i * 60, easing: OUT, fill: "backwards" });
    });
  }
}

/* вход в хаб с главного: шапка виджета «Плати частями · 3 покупки ›» */
const widgetTop = (s: Stage) => s.find("Виджет / Плати частями")?.querySelector<HTMLElement>('[data-n="Top"]') ?? s.find("Виджет / Плати частями");

const move: Flow = (s, ctx, step) => {
  const go = (k: number) => { ctx.go(k); move(s, ctx, k); };
  if (step === 0) {
    s.show("home");
    countUp(s, leaf(s.find("Ближайший"), /₽/), 600);
    s.later(500, () => hint(s, widgetTop(s), () => go(1)));
    return;
  }
  if (step === 1) {
    s.show("hub");
    countUp(s, leaf(s.find("Баланс"), /₽/), 700);
    s.later(650, () => hint(s, s.hot("Перенести на 6 сен", 1), () => go(2)));
    return;
  }
  if (step === 2) {
    s.show("confirm");
    s.later(900, () => hint(s, s.hot("Перенести платёж", 1), () => go(3)));
    return;
  }
  s.show("moved");
  s.stream(leaf(s.find("Суть"), /^Готово/), 320, 50);
};

const why: Flow = (s, ctx, step) => {
  const go = (k: number) => { ctx.go(k); why(s, ctx, k); };
  if (step === 0) {
    s.show("home");
    s.later(500, () => hint(s, widgetTop(s), () => go(1)));
    return;
  }
  if (step === 1) {
    s.show("hub");
    s.later(650, () => hint(s, s.find("Кнопка / Откуда цифры"), () => go(2)));
    return;
  }
  s.show("why");
  countUp(s, leaf(s.find("Сумма"), /₽/), 800);
};

export const flows = {
  move: make({ w: 393 }, move, r, liven),
  why: make({ w: 393 }, why, r, liven),
};
