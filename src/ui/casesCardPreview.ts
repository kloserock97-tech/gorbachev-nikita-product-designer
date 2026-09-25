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
import { onLang, t } from "../i18n";
import { pad2 } from "../lib/format";
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

  /* v74.1: рамка главы — матовое стекло вокруг прозрачного окна. Всё, что снаружи окна, размыто и
     высветлено (.cc-mat, вырез — clip-path с правилом evenodd), само окно, где живут кейс, дуга и текст, —
     чистое. Кромка окна — .cc-frame. При входе в главу окно сужается от краёв экрана до своего места:
     прогресс появления главы (--e) пишет casesWheel.ts в style корня, здесь за ним следит MutationObserver.
     Верх окна считается от нижнего края дока — рамка не наезжает на навигацию */
  const root = stage.closest<HTMLElement>(".cases");
  if (root && !root.querySelector(".cc-frame")) {
    const mat = document.createElement("div");
    mat.className = "cc-mat";
    const frame = document.createElement("div");
    frame.className = "cc-frame";
    for (const el of [mat, frame]) { el.setAttribute("aria-hidden", "true"); }
    root.prepend(mat, frame);
    const ease = (x: number) => 1 - Math.pow(1 - clamp(x, 0, 1), 3);
    let lastKey = "";
    const fit = () => {
      const e = parseFloat(root.style.getPropertyValue("--e")) || 0;
      const W = root.clientWidth, H = root.clientHeight;
      const narrowNow = root.classList.contains("is-narrow");
      const dock = document.querySelector<HTMLElement>(".dock")?.getBoundingClientRect();
      const gap = narrowNow ? 10 : clamp(W * 0.012, 12, 20);
      const top0 = Math.max(dock && dock.bottom > 0 && dock.bottom < H * 0.3 ? dock.bottom + gap : 0, narrowNow ? 64 : 92);
      const side0 = narrowNow ? 8 : clamp(W * 0.022, 18, 40);
      const bottom0 = narrowNow ? 10 : clamp(H * 0.024, 14, 28);
      const r0 = narrowNow ? 22 : clamp(W * 0.02, 22, 36);
      /* окно сужается к месту вместе с появлением главы: в начале оно во весь экран и рамки не видно */
      const k = reduced ? (e > 0 ? 1 : 0) : ease(e * 1.25);
      const top = top0 * k, side = side0 * k, bottom = bottom0 * k, r = r0 * k;
      const key = [W, H, top, side, bottom].map((v) => v.toFixed(1)).join("|");
      if (key === lastKey) return;
      lastKey = key;
      root.style.setProperty("--frame-top", `${top0.toFixed(1)}px`);
      const x0 = side, y0 = top, x1 = W - side, y1 = H - bottom;
      frame.style.cssText = `left:${x0}px;top:${y0}px;width:${x1 - x0}px;height:${y1 - y0}px;border-radius:${r}px;opacity:${k.toFixed(3)}`;
      /* весь экран минус скруглённое окно: evenodd оставляет только поле вокруг */
      const hole = `M${x0 + r} ${y0}H${x1 - r}A${r} ${r} 0 0 1 ${x1} ${y0 + r}V${y1 - r}A${r} ${r} 0 0 1 ${x1 - r} ${y1}H${x0 + r}A${r} ${r} 0 0 1 ${x0} ${y1 - r}V${y0 + r}A${r} ${r} 0 0 1 ${x0 + r} ${y0}Z`;
      /* док и кнопка звука лежат слоем ниже главы — стекло размыло бы и их. Вырезаем под ними окна */
      const holes = [".dock", ".sound-fab"].map((sel) => document.querySelector<HTMLElement>(sel)?.getBoundingClientRect()).filter((b): b is DOMRect => !!b && b.width > 0 && b.bottom > 0 && b.top < H)
        .map((b) => { const p = 3, q = Math.min(b.height / 2 + p, 22); const X0 = b.left - p, Y0 = b.top - p, X1 = b.right + p, Y1 = b.bottom + p;
          return `M${X0 + q} ${Y0}H${X1 - q}A${q} ${q} 0 0 1 ${X1} ${Y0 + q}V${Y1 - q}A${q} ${q} 0 0 1 ${X1 - q} ${Y1}H${X0 + q}A${q} ${q} 0 0 1 ${X0} ${Y1 - q}V${Y0 + q}A${q} ${q} 0 0 1 ${X0 + q} ${Y0}Z`; }).join(" ");
      mat.style.clipPath = `path(evenodd, "M0 0H${W}V${H}H0Z ${hole} ${holes}")`;
      mat.style.opacity = k.toFixed(3);
    };
    new MutationObserver(fit).observe(root, { attributes: true, attributeFilter: ["style", "class"] });
    addEventListener("resize", () => { lastKey = ""; fit(); });
    fit();
  }

  /* v74.1: оглавление кейсов вместо дуги-барабана. Справа в окне рамки — список «01 GRIF AI … 08» со стеклянной
     подсветкой, которая едет к текущему кейсу вместе с прокруткой. Щелчок по кейсу передаётся спрятанному пункту
     дуги: у него уже есть вся логика (не текущий — прокрутить к нему, текущий — открыть). Дуга осталась в
     разметке casesWheel.ts, но не видна (cases-card.css) */
  const index = document.createElement("nav");
  index.className = "cc-index";
  index.innerHTML = `<i class="cc-ix-glow" aria-hidden="true"></i>${list
    .map((c, i) => `<a class="cc-ix" href="#/work/${c.id}" data-i="${i}"><span class="cc-ix-n">${pad2(i + 1)}</span><span class="cc-ix-t"></span></a>`)
    .join("")}<p class="cc-ix-now" aria-hidden="true"></p>`;
  root?.appendChild(index);
  const ixs = [...index.querySelectorAll<HTMLAnchorElement>(".cc-ix")];

  const ixNow = index.querySelector<HTMLElement>(".cc-ix-now")!;
  const paintIndex = () => {
    list = getList();
    index.setAttribute("aria-label", t("work.title"));
    ixs.forEach((a, i) => { a.querySelector(".cc-ix-t")!.textContent = list[i].title; });
  };
  paintIndex();
  onLang(paintIndex);
  ixs.forEach((a, i) => a.addEventListener("click", (e) => {
    const twin = root?.querySelector<HTMLAnchorElement>(`.cw-item[data-i="${i}"]`);
    if (!twin) return;
    e.preventDefault();
    twin.click();
  }));

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
  /* v74.1: смена кейса — слоистый сдвиг вместо барабана. --d у каждого мокапа — насколько он от текущего
     (−1…1); слои мокапа читают её в caseArt.css и едут с разной скоростью: фигура медленнее, экран быстрее,
     стрелка быстрее всех — как слои с глубиной. Уходящий уезжает влево и гаснет, следующий приходит справа */
  const drum = (pos: number) => {
    if (Math.abs(pos - lastDrum) < 0.001) return;
    lastDrum = pos;
    wins.forEach((el, i) => {
      const d = i - pos;
      const ad = Math.abs(d);
      el.classList.toggle("is-far", ad > 1);
      el.classList.toggle("is-cur", ad < 0.5);
      if (ad > 1) return;
      el.style.opacity = clamp(1 - ad * 2.2, 0, 1).toFixed(3);
      el.style.setProperty("--d", reduced ? "0" : d.toFixed(3));
      el.tabIndex = shown && ad < 0.5 ? 0 : -1;
      el.setAttribute("aria-hidden", String(ad >= 0.5));
    });
    /* подсветка в оглавлении едет за дробным положением: смена кейса видна и справа */
    const cur = clamp(Math.round(pos), 0, ixs.length - 1);
    ixs.forEach((a, i) => { a.classList.toggle("is-on", i === cur); a.setAttribute("aria-current", i === cur ? "true" : "false"); });
    index.style.setProperty("--pos", pos.toFixed(3));
    index.style.setProperty("--n", String(ixs.length));
    ixNow.textContent = `${pad2(cur + 1)} / ${pad2(ixs.length)} · ${list[cur]?.title ?? ""}`;
  };

  const reach = (on: boolean) => {
    shown = on;
    lastDrum = -999;
  };

  paint(0);
  return { layout, drum, paint, live, calm, warm, reach };
}
