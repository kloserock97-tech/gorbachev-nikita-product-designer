/* v74: кейс в главе «Кейсы» — окно браузера macOS в стеклянной рамке.

   Раньше здесь были ноутбук и смартфон на CSS-3D (v71). По референсу Никиты (карточка продукта над размытым
   полем: крупная стеклянная рамка, внутри вещь и мелкие стеклянные подписи вокруг) глава собрана заново:
   - вся глава обнята большой стеклянной рамкой — кейсы появляются внутри неё;
   - интерфейс продукта стоит в окне браузера macOS: три кнопки, заголовок вкладки, настоящий снимок экрана.
     У мобильных кейсов в окне — экран приложения по центру, на поле цвета кейса, как превью адаптива;
   - дополнительные тексты — в маленьких стеклянных плашках у краёв окна: знак продукта, платформа и цифра
     результата.

   Стекло без backdrop-filter у большой рамки: размытие поверх живого WebGL-холста пересчитывается каждый кадр
   и на всю главу стоило бы кадра. Плашки маленькие — у них размытие есть, но только там, где есть мышь.

   Смена кейса — барабан, как и был: уходящее окно поднимается и гаснет, приходящее выезжает снизу. Барабан
   крутит casesWheel.ts. Дуга с названиями, текст под окном и кнопки шага — тоже там. */
import type { CaseItem } from "../data/cases";
import { t } from "../i18n";
import { brandMark } from "./caseLook";
import { caseArt } from "./caseArt";
import "./cases-card.css";

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
/* платформа в плашке: монитор у веба, телефон у мобильного */
const iconScreen = `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4.5" width="18" height="12" rx="2"/><path d="M9 20h6"/></svg>`;
const iconPhone = `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="7" y="2.5" width="10" height="19" rx="2.4"/><path d="M10.6 5.4h2.8"/></svg>`;

export type CardPreview = {
  /** пересчитать размеры: вызывать после изменения окна */
  layout(): void;
  /** положение барабана (дробное, приходит из casesWheel) */
  drum(pos: number): void;
  /** подставить кейс в плашки */
  paint(i: number): void;
  /** заново разогнать плашки */
  live(): void;
  /** собрать плашки (глава ушла) */
  calm(): void;
  /** включить снимки экранов: до этого они только утяжеляют старт */
  warm(): void;
  /** окно берёт фокус только когда глава видна */
  reach(on: boolean): void;
};

export function createCardPreview(stage: HTMLElement, getList: () => CaseItem[]): CardPreview {
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let list = getList();

  const box = document.createElement("div");
  box.className = "cc";
  box.innerHTML = `
    <div class="cc-deck">
      <div class="cc-drum">${list
        .map((c, i) => `<a class="cc-win" data-i="${i}" href="#/work/${c.id}" tabindex="-1" aria-hidden="true" aria-label="${esc(c.title)}">${caseArt(c, { mode: "fit" })}</a>`)
        .join("")}</div>
      <span class="cc-chip cc-brand" style="--gx:3;--gy:-3;--fd:0s"></span>
      <span class="cc-chip cc-kind" style="--gx:-4;--gy:2;--fd:.1s"></span>
      <span class="cc-chip cc-stat" style="--gx:4;--gy:3;--fd:.2s"><b></b><span></span></span>
    </div>`;
  stage.appendChild(box);

  /* большая стеклянная рамка — у всей главы, а не у зоны окна: кейс, дуга и текст живут внутри неё */
  const root = stage.closest<HTMLElement>(".cases");
  if (root && !root.querySelector(".cc-frame")) {
    const frame = document.createElement("div");
    frame.className = "cc-frame";
    frame.setAttribute("aria-hidden", "true");
    root.prepend(frame);
  }

  const wins = [...box.querySelectorAll<HTMLElement>(".cc-win")];
  /* снимка может не быть (кейс только заводят) — тогда в окне остаётся поле цвета кейса, а не битая картинка */
  for (const img of box.querySelectorAll<HTMLImageElement>(".ya-shot")) img.addEventListener("error", () => img.remove());
  const q = (sel: string) => box.querySelector<HTMLElement>(sel)!;

  const paint = (i: number) => {
    list = getList();
    const c = list[i];
    /* знака у кейса может не быть — пустая плашка выглядит как ошибка */
    const brand = q(".cc-brand");
    brand.innerHTML = brandMark(c, "cc-brand-img");
    brand.hidden = !brand.firstElementChild;
    const phone = c.look.screen?.device === "phone";
    q(".cc-kind").innerHTML = `${phone ? iconPhone : iconScreen}<span>${esc(t(phone ? "work.mobile" : "work.web"))}</span>`;
    q(".cc-stat b").textContent = c.stat.value;
    q(".cc-stat span").textContent = c.stat.label;
  };

  /* Разлёт. Класс снимается и ставится заново через кадр — иначе браузер не перезапустит переход,
     и на новом кейсе плашки просто стояли бы на местах. */
  let liveTimer = 0;
  const live = () => {
    if (reduced) { box.classList.add("is-live"); return; }
    box.classList.remove("is-live");
    clearTimeout(liveTimer);
    liveTimer = window.setTimeout(() => requestAnimationFrame(() => box.classList.add("is-live")), 20);
  };
  const calm = () => { clearTimeout(liveTimer); box.classList.remove("is-live"); };

  let warmed = false;
  const warm = () => {
    if (warmed) return;
    warmed = true;
    for (const img of box.querySelectorAll<HTMLImageElement>("img[data-src]")) {
      img.src = img.dataset.src!;
      delete img.dataset.src;
    }
  };

  const layout = () => { /* размеры окна заданы в единицах сцены — пересчитывать нечего */ };

  let shown = false;
  let lastDrum = -999;
  /* Барабан: видно одно окно. Уходящее поднимается и гаснет, приходящее выезжает снизу */
  const drum = (pos: number) => {
    if (Math.abs(pos - lastDrum) < 0.001) return;
    lastDrum = pos;
    wins.forEach((el, i) => {
      const d = i - pos;
      const ad = Math.abs(d);
      el.classList.toggle("is-far", ad > 1);
      if (ad > 1) return;
      el.style.opacity = clamp(1 - ad * 1.9, 0, 1).toFixed(3);
      el.style.transform = reduced ? "none" : `translate3d(0, ${(d * 70).toFixed(2)}%, 0) rotateX(${(d * -14).toFixed(2)}deg) scale(${(1 - ad * 0.08).toFixed(3)})`;
      el.tabIndex = shown && ad < 0.5 ? 0 : -1;
      el.setAttribute("aria-hidden", String(ad >= 0.5));
    });
  };

  const reach = (on: boolean) => {
    shown = on;
    lastDrum = -999;
  };

  paint(0);
  return { layout, drum, paint, live, calm, warm, reach };
}
