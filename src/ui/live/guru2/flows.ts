/* 26.10: живой прототип Restaurant Guru на финальных экранах из Figma (файл fHFPiy79mJmlrdEeVGeWY3, страница
   «📱 Screens», секция 41:1015 «Гид — 9 экранов»), перенесённых конвейером tools/f2h один в один. Как у GRIF: два
   сценария вкладками, кольцо-подсказка на настоящем слое экрана, экраны живые.
   · Гид подбирает вечер: главный → «Гид» → «тихо и на двоих» → подбор (предмет и повторённый запрос, крутилки
     нет) → ответ одной карточкой → карточка места.
   · Знакомство с гидом: три касания из макета — анонс → баннер в ленте → подсказка у таб-бара → приглашение гида.
   Шрифт макета SF Pro в вебе не раздаётся: в screens.json к нему дописан запасной ряд -apple-system → Inter. */
import data from "./screens.json";
import { createRenderer, type Bundle } from "../grif2/render";
import { hint, make, stagger, type Flow } from "../grif2/kit";
import "./guru.css";

const r = createRenderer(data as Bundle, "rg", (n, base) => `${base}cases/restaurant-guru/live2/${n}.webp`);

/* экраны живут сами: лента входит лесенкой, у гида дышит знак и кольца, частицы плавают, статус подбора с бликом */
function liven(el: HTMLElement, key: string, instant: boolean) {
  const all = (sel: string) => [...el.querySelectorAll<HTMLElement>(sel)];
  all('[data-n="Guide Mark"]').forEach((n) => n.classList.add("rg-breathe"));
  all('[data-n^="ring "], [data-n="field-glow"]').forEach((n, i) => { n.style.animationDelay = `${-i * 0.7}s`; n.classList.add("rg-ring"); });
  all('[data-n="particle"]').forEach((n, i) => { n.style.animationDelay = `${-(i * 0.37) % 4}s`; n.style.animationDuration = `${3.6 + (i % 5) * 0.5}s`; n.classList.add("rg-float"); });
  all('[data-n="orb-halo"]').forEach((n) => n.classList.add("rg-halo"));
  all('[data-n="Tab/ai"] [data-n="knob"]').forEach((n) => n.classList.add("rg-knob"));
  if (instant) return;
  if (key === "home" || key === "homeScrolled") {
    stagger(el, '[data-n="Categories"] > [data-n="Chip / Category"]', 40, 120, "g2-pop");
    stagger(el, '[data-n="Shelf"] > [data-n="Place Card"]', 60, 220);
    stagger(el, '[data-n="Nearby"] > [data-n="Place Row"]', 50, 320);
  }
  if (key === "invite") {
    stagger(el, '[data-n="Headline"], [data-n="Ask Input"]', 80, 120);
    stagger(el, '[data-n="Suggestions"] > *', 50, 300, "g2-pop");
  }
  if (key === "answer") {
    all('[data-n="Result Card"]').forEach((n) => n.classList.add("rg-card-in"));
    stagger(el, '[data-n="Evidence"] > [data-n="Token"]', 70, 520, "g2-pop");
    all('[data-n="sparkle"]').forEach((n, i) => { n.style.animationDelay = `${300 + i * 90}ms`; n.classList.add("g2-pop"); });
    all('[data-n="Retry"]').forEach((n) => { n.style.animationDelay = "700ms"; n.classList.add("g2-rise"); });
  }
  if (key === "place") {
    stagger(el, '[data-n="Facts"] > [data-n="Fact"]', 50, 120);
    stagger(el, '[data-n="Hero"], [data-n="Options"] > [data-n="Option"], [data-n="Amenities"]', 60, 260);
    all('[data-n="CTA"]').forEach((n) => { n.style.animationDelay = "520ms"; n.classList.add("rg-sheet"); });
  }
  if (key === "promoSheet") {
    all('[data-n="Scrim"]').forEach((n) => n.classList.add("g2-fade"));
    all('[data-n="Guide Announce Card"]').forEach((n) => n.classList.add("rg-sheet"));
  }
  if (key === "promoBanner") all('[data-n="Guide Promo"]').forEach((n) => n.classList.add("rg-card-in"));
  if (key === "promoHint") all('[data-n="Tooltip"]').forEach((n) => n.classList.add("g2-drop"));
}

/* ── гид подбирает вечер ── */
const guide: Flow = (s, ctx, step) => {
  const go = (k: number) => { ctx.go(k); guide(s, ctx, k); };
  if (step === 0) {
    s.show("home");
    s.later(500, () => hint(s, s.find("Tab/ai"), () => go(1)));
    return;
  }
  if (step === 1) {
    s.show("invite");
    s.later(650, () => hint(s, s.hot("тихо и на двоих", 1, s.find("Suggestions")), () => go(2)));
    return;
  }
  if (step === 2) {
    /* подбор: запрос повторяется печатью, статус переливается, через пару секунд — ответ */
    s.show("thinking");
    const echo = s.find("Query echo");
    const status = s.find("Status");
    status?.classList.add("g2-sheen");
    s.type(echo, echo?.textContent?.trim() ?? "", 45);
    s.later(2600, () => go(3));
    return;
  }
  if (step === 3) {
    s.show("answer");
    const card = s.find("Result Card");
    s.later(900, () => hint(s, card?.querySelector<HTMLElement>('[data-n="Media"]') ?? card, () => go(4)));
    return;
  }
  /* итог: карточка места, бронь — главная кнопка */
  s.show("place");
  s.later(900, () => s.find("CTA")?.classList.add("rg-cta-glow"));
};

/* ── знакомство с гидом: три касания ── */
const launch: Flow = (s, ctx, step) => {
  const go = (k: number) => { ctx.go(k); launch(s, ctx, k); };
  if (step === 0) {
    s.show("promoSheet");
    s.later(700, () => hint(s, s.find("Guide Announce Card")?.querySelector<HTMLElement>('[data-n="Dismiss"]') ?? null, () => go(1)));
    return;
  }
  if (step === 1) {
    s.show("promoBanner");
    const promo = s.find("Guide Promo");
    s.later(600, () => hint(s, promo?.querySelector<HTMLElement>('[data-n="Dismiss"]') ?? null, () => go(2)));
    return;
  }
  if (step === 2) {
    s.show("promoHint");
    s.later(700, () => hint(s, s.find("Bubble"), () => go(3)));
    return;
  }
  s.show("invite");
};

export const flows = {
  guide: make({ w: 393 }, guide, r, liven),
  launch: make({ w: 393 }, launch, r, liven),
};
