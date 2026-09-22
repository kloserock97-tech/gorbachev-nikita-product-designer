/* v71: устройство кейса в левой половине главы «Кейсы».

   В середине — одно устройство: у веб-кейсов ноутбук, у мобильных смартфон. Когда кейс встаёт активным,
   крышка ноутбука раскрывается (у телефона корпус поднимается из лежачего положения), и на экране виден
   настоящий снимок продукта. Идея раскрытия — из присланного Никитой героя с MacBook (21st.dev,
   frame-sequence на 941 кадр); кадры чужие и тяжёлые, поэтому корпус и петля здесь свои, на CSS-3D.

   Видно всегда одно устройство. Смена кейса — барабан: уходящее поднимается и поворачивается, приходящее
   выезжает снизу; соседних кейсов по бокам нет. Барабан общий с прежним видом главы — его крутит
   casesWheel.ts и доворачивает до целого кейса за ~0,4 с.

   Вокруг устройства парят трое: знак продукта, круглый значок платформы и цифра результата. Больше
   ничего: всё остальное — название, номер, метка, год — уже написано на дуге и под устройством, и
   вторые экземпляры этих же слов спорили с первыми. Спутники не едут вместе с барабаном: на каждом
   новом кейсе они разъезжаются по местам и медленно парят, каждый со своей задержкой. Разлёт и парение
   разведены по разным свойствам (transform и translate): напиши оба в transform — анимация затрёт переход.

   Дуга с названиями, текст под устройством и кнопки шага — в casesWheel.ts. */
import type { CaseItem } from "../data/cases";
import { brandMark, caseThumb, lookVars } from "./caseLook";
import { tidy } from "../lib/typograph";
import "./cases-card.css";

const BASE = import.meta.env.BASE_URL;
const esc = (s: string) => tidy(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
/* платформа кейса в круглом значке: монитор у веба, телефон у мобильного */
const iconScreen = `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4.5" width="18" height="12" rx="2"/><path d="M9 20h6"/></svg>`;
const iconPhone = `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="7" y="2.5" width="10" height="19" rx="2.4"/><path d="M10.6 5.4h2.8"/></svg>`;

export type CardPreview = {
  /** пересчитать размеры: вызывать после изменения окна */
  layout(): void;
  /** положение барабана (дробное, приходит из casesWheel) */
  drum(pos: number): void;
  /** подставить кейс в спутники */
  paint(i: number): void;
  /** заново разогнать спутники */
  live(): void;
  /** собрать спутники и закрыть устройство (глава ушла) */
  calm(): void;
  /** включить снимки экранов: до этого они только утяжеляют старт */
  warm(): void;
  /** устройство берёт фокус только когда глава видна */
  reach(on: boolean): void;
};

export function createCardPreview(stage: HTMLElement, getList: () => CaseItem[]): CardPreview {
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let list = getList();

  /** ноутбук: крышка на петле, под ней клавиатурная панель в перспективе */
  const laptop = (c: CaseItem) => `
    <span class="cc-rig">
      <span class="cc-base"><i class="cc-keys"></i><i class="cc-pad"></i></span>
      <span class="cc-lid">
        <span class="cc-screen"><img class="cc-shot" data-src="${BASE}${caseThumb(c.id)}" alt="" decoding="async" draggable="false"><i class="cc-glare"></i></span>
        <i class="cc-cam"></i>
      </span>
    </span>
    <span class="cc-shadow"></span>`;

  /** смартфон: корпус поднимается из лежачего положения */
  const phone = (c: CaseItem) => `
    <span class="cc-rig">
      <span class="cc-body">
        <span class="cc-screen"><img class="cc-shot" data-src="${BASE}${caseThumb(c.id)}" alt="" decoding="async" draggable="false"><i class="cc-glare"></i></span>
        <i class="cc-notch"></i>
      </span>
    </span>
    <span class="cc-shadow cc-shadow--phone"></span>`;

  const box = document.createElement("div");
  box.className = "cc";
  box.innerHTML = `
    <div class="cc-deck">
      <div class="cc-drum">${list
        .map((c, i) => {
          const isPhone = c.look.screen?.device === "phone";
          return `<a class="cc-dev cc-dev--${isPhone ? "phone" : "laptop"}" data-i="${i}" href="#/work/${c.id}" tabindex="-1" aria-hidden="true" style="${lookVars(c)}">${isPhone ? phone(c) : laptop(c)}</a>`;
        })
        .join("")}</div>
    </div>

    <span class="cc-brand" style="--gx:-6;--gy:4;--fd:0s"></span>

    <span class="cc-thermo" style="--gx:-7;--gy:-2;--fd:.12s"></span>

    <div class="cc-stat" style="--gx:-7;--gy:-3;--fd:.24s"><b></b><span></span></div>`;
  stage.appendChild(box);

  const devs = [...box.querySelectorAll<HTMLElement>(".cc-dev")];
  /* снимка может не быть (кейс только заводят) — тогда экран остаётся тёмным стеклом,
     а не битой картинкой */
  for (const img of box.querySelectorAll<HTMLImageElement>(".cc-shot")) img.addEventListener("error", () => img.remove());
  const q = (sel: string) => box.querySelector<HTMLElement>(sel)!;

  const paint = (i: number) => {
    list = getList();
    const c = list[i];
    /* знака у кейса может не быть — пустая белая плашка на поле выглядит как ошибка */
    const brand = q(".cc-brand");
    brand.innerHTML = brandMark(c, "cc-brand-img");
    brand.hidden = !brand.firstElementChild;
    q(".cc-thermo").innerHTML = c.look.screen?.device === "phone" ? iconPhone : iconScreen;
    q(".cc-stat b").textContent = c.stat.value;
    q(".cc-stat span").innerHTML = esc(c.stat.label);
  };

  /* Разлёт. Класс снимается и ставится заново через кадр — иначе браузер не перезапустит переход,
     и на новом кейсе спутники просто стояли бы на местах. */
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

  const layout = () => { /* размеры устройства заданы в единицах сцены — пересчитывать нечего */ };

  let shown = false;
  let lastDrum = -999;
  /* Барабан: видно одно устройство. Уходящее поднимается и поворачивается, приходящее выезжает снизу —
     соседние кейсы по бокам не стоят и не просвечивают. */
  const drum = (pos: number) => {
    if (Math.abs(pos - lastDrum) < 0.001) return;
    lastDrum = pos;
    devs.forEach((el, i) => {
      const d = i - pos;
      const ad = Math.abs(d);
      el.classList.toggle("is-far", ad > 1);
      if (ad > 1) return;
      el.style.opacity = clamp(1 - ad * 1.9, 0, 1).toFixed(3);
      el.style.transform = reduced ? "none" : `translate3d(${(d * 5).toFixed(2)}%, ${(d * 88).toFixed(2)}%, 0) rotate(${(d * -6).toFixed(2)}deg) scale(${(1 - ad * 0.1).toFixed(3)})`;
      el.tabIndex = shown && ad < 0.5 ? 0 : -1;
      el.setAttribute("aria-hidden", String(ad >= 0.5));
      /* раскрывается только то устройство, на котором барабан остановился */
      el.classList.toggle("is-open", ad < 0.12);
    });
  };

  const reach = (on: boolean) => {
    shown = on;
    lastDrum = -999;
    if (!on) devs.forEach((el) => el.classList.remove("is-open"));
  };

  paint(0);
  return { layout, drum, paint, live, calm, warm, reach };
}
