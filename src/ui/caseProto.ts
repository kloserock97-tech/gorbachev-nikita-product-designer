/* v114: прототип, который можно прокликать, на странице кейса (глава «Готовый интерфейс»). Идея — блок
   «Try the prototype» с портфолио klinaeva: слева шаги «1 из 3 · Нажмите…» и пометка, почему экран такой,
   справа телефон. Код и вёрстка свои.

   Два режима.
   · Из макетов: экраны — картинки из Figma. Точка нажатия — кнопка поверх экрана с пульсирующим кольцом. Нажали её —
     следующий экран въезжает справа, как переход в приложении. Нажали мимо — точка вспыхивает. Длинный экран
     прокручивается внутри рамки (у каждого экрана своя прокрутка), к точке он доезжает сам. Экран-загрузка (wait)
     проходит сам; плашка-итог (toast) встаёт поверх последнего экрана, если отдельного нет.
   · v115, живой (prototype.live): в рамке настоящий интерфейс в HTML (src/ui/live/, контракт — live/types.ts),
     собранный в Claude Code. Шаги переключаются от действий в самом интерфейсе; модуль грузится своим чанком,
     когда блок подъехал к экрану. Метка «Прототип собран в Claude Code» — текстом и своим значком.

   Шаги слева — кнопки: можно перейти к любому. Рамка — телефон или окно браузера 16:10 (device).
   «Меньше движения» — экраны сменяются без въезда, кольцо не пульсирует. */
import type { CasePrototype } from "../data/caseStory";
import { getLang } from "../i18n";
import { tidy } from "../lib/typograph";
import { LIVE } from "./live";
import type { LiveInstance } from "./live/types";
import "./case-proto.css";

const BASE = import.meta.env.BASE_URL;
const esc = (s: string) => tidy(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const T = {
  step: { ru: "Шаг", en: "Step" },
  of: { ru: "из", en: "of" },
  why: { ru: "Почему так", en: "Why it looks like this" },
  done: { ru: "Готово", en: "Done" },
  again: { ru: "Пройти ещё раз", en: "Start over" },
  back: { ru: "Шаг назад", en: "Back" },
  mock: { ru: "Прототип из макетов", en: "Prototype from the mock-ups" },
  claude: { ru: "Прототип собран в Claude Code", en: "Prototype built in Claude Code" },
  demo: { ru: "Демо: данные выдуманы, ничего не отправляется", en: "Demo: the data is made up and nothing is sent" },
  loading: { ru: "Загружаю прототип…", en: "Loading the prototype…" },
  pan: { ru: "Окно шире экрана — листайте его вбок", en: "The window is wider than the screen: swipe it sideways" },
};
const tr = (x: { ru: string; en: string }) => (getLang() === "ru" ? x.ru : x.en);
const ICON = {
  back: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M12 5 7 10l5 5"/></svg>',
  check: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="m5 10.5 3.2 3L15 6.5"/></svg>',
  again: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10a6 6 0 1 0 2-4.5"/><path d="M4 3.5V7h3.5"/></svg>',
  /* своя искра: восемь лучей разной длины — не знак Anthropic */
  spark: '<svg class="pt-spark" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5v6M12 15.5v6M2.5 12h6M15.5 12h6M5.3 5.3l3.9 3.9M14.8 14.8l3.9 3.9M18.7 5.3l-3.9 3.9M9.2 14.8l-3.9 3.9"/></svg>',
};

export function protoBlock(p: CasePrototype) {
  const n = p.steps.length;
  const web = p.device === "browser";
  const live = !!p.live && !!LIVE[p.live];
  const screen = live
    ? `<div class="pt-live-root" data-live="${esc(p.live!)}"><p class="pt-loading">${tr(T.loading)}</p></div>`
    : p.steps.map((s, k) => `<div class="pt-page" data-page="${k}"${k ? " hidden" : ""}>
          <div class="pt-canvas"><img src="${BASE}${s.image.src}" alt="${esc(s.image.caption)}" width="${s.image.w}" height="${s.image.h}" loading="lazy" decoding="async">
          ${s.spot ? `<button type="button" class="pt-spot" style="left:${(s.spot[0] * 100).toFixed(2)}%;top:${(s.spot[1] * 100).toFixed(2)}%" aria-label="${esc(s.action)}"><i></i></button>` : ""}
          ${s.toast ? `<p class="pt-toast">${ICON.check}${esc(s.toast)}</p>` : ""}</div>
        </div>`).join("");
  return `<div class="pt${web ? " pt--browser" : ""}${live ? " pt--live" : ""}" data-proto>
    <div class="pt-side">
      ${live ? `<p class="pt-badge">${ICON.spark}${tr(T.claude)}</p>` : `<p class="pt-mode"><i></i>${tr(T.mock)}</p>`}
      <h3 class="pt-title">${esc(p.title)}</h3>
      ${p.lead ? `<p class="pt-lead">${esc(p.lead)}</p>` : ""}
      <ol class="pt-steps">${p.steps.map((s, k) => `<li><button type="button" data-go="${k}" data-why="${esc(s.why ?? "")}"${s.wait ? ` data-wait="${s.wait}"` : ""}>
        <span class="pt-k">${k + 1 < n ? k + 1 : "✓"}</span><span class="pt-act">${esc(s.action)}</span></button></li>`).join("")}</ol>
      <div class="pt-now" aria-live="polite">
        <p class="pt-count" data-pt-count></p>
        <div class="pt-why" data-why-box><p class="pt-mini">${tr(T.why)}</p><p data-why-text></p></div>
      </div>
      <p class="pt-tools">
        <button type="button" class="pt-btn" data-back>${ICON.back}${tr(T.back)}</button>
        <button type="button" class="pt-btn" data-again>${ICON.again}${tr(T.again)}</button>
      </p>
    </div>
    <div class="pt-device">
      <div class="pt-phone${web ? " pt-window" : ""}">
        ${web ? '<p class="pt-bar" aria-hidden="true"><i></i><i></i><i></i></p>' : ""}
        <div class="pt-screen" data-screen>${screen}</div>
      </div>
      ${live ? `<p class="pt-pan">${tr(T.pan)}</p><p class="pt-demo">${tr(T.demo)}</p>` : ""}
    </div>
  </div>`;
}

/** оживляет все прототипы на странице; возвращает функцию остановки */
export function mountProto(root: HTMLElement) {
  const offs: (() => void)[] = [];
  const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
  root.querySelectorAll<HTMLElement>("[data-proto]").forEach((box) => {
    const pages = [...box.querySelectorAll<HTMLElement>(".pt-page")];
    const steps = [...box.querySelectorAll<HTMLButtonElement>("[data-go]")];
    const count = box.querySelector<HTMLElement>("[data-pt-count]")!;
    const why = box.querySelector<HTMLElement>("[data-why-text]")!;
    const whyBox = box.querySelector<HTMLElement>("[data-why-box]")!;
    const back = box.querySelector<HTMLButtonElement>("[data-back]")!;
    const liveRoot = box.querySelector<HTMLElement>("[data-live]");
    const n = steps.length;
    let at = 0;
    let timer = 0;
    let inst: LiveInstance | null = null;

    /* панель слева: текущий шаг, «почему так», кнопка «назад» */
    function mark(k: number) {
      at = k;
      steps.forEach((b, i) => {
        b.classList.toggle("is-now", i === k);
        b.classList.toggle("is-past", i < k);
        b.toggleAttribute("aria-current", i === k);
      });
      const last = k === n - 1;
      count.textContent = last ? tr(T.done) : `${tr(T.step)} ${k + 1} ${tr(T.of)} ${n - 1}`;
      why.textContent = steps[k].dataset.why ?? "";
      whyBox.hidden = !why.textContent;
      back.disabled = k === 0;
      box.classList.toggle("is-done", last);
    }

    /* точка ниже края экрана — экран сам доезжает до неё. offsetTop — от .pt-canvas, она начинается с верха экрана */
    function reach(page: HTMLElement) {
      const spot = page.querySelector<HTMLElement>(".pt-spot");
      if (!spot || !page.clientHeight || spot.offsetTop <= page.clientHeight * 0.8) return;
      page.scrollTo({ top: spot.offsetTop - page.clientHeight * 0.55, behavior: calm ? "auto" : "smooth" });
    }

    function show(k: number, dir = 1) {
      if (k < 0 || k >= n) return;
      clearTimeout(timer);
      if (liveRoot) { inst?.show(k); mark(k); return; }
      const from = pages[at];
      const to = pages[k];
      if (from !== to) {
        to.hidden = false;
        if (calm) from.hidden = true;
        else {
          to.classList.add(dir > 0 ? "is-in" : "is-in-back");
          from.classList.add(dir > 0 ? "is-out" : "is-out-back");
          to.addEventListener("animationend", () => {
            from.hidden = true;
            from.classList.remove("is-out", "is-out-back");
            to.classList.remove("is-in", "is-in-back");
          }, { once: true });
        }
      }
      to.scrollTop = 0;
      mark(k);
      setTimeout(() => reach(to), calm ? 0 : 420);
      /* экран-загрузка проходит сам */
      const wait = Number(steps[k].dataset.wait);
      if (wait && k < n - 1) timer = window.setTimeout(() => show(k + 1, 1), wait);
    }

    /* живой модуль: грузится, когда блок близко; экран в его дизайн-ширине ужимается под рамку через zoom */
    let fit: ResizeObserver | null = null;
    async function boot() {
      const load = LIVE[liveRoot!.dataset.live!];
      const mod = (await load()).default;
      const screen = liveRoot!.parentElement!;
      /* на узком экране окно браузера не ужимаем мельче 0,5: текст в 1100 px читался бы в 4 px. Лишнее по ширине
         прокручивается пальцем внутри окна (.pt-screen.is-pan) */
      const size = () => {
        const fitZ = screen.clientWidth / mod.design.w;
        const z = mod.design.w > 600 ? Math.max(fitZ, 0.5) : fitZ;
        screen.classList.toggle("is-pan", z > fitZ + 0.001);
        liveRoot!.style.zoom = String(z);
        liveRoot!.style.width = `${mod.design.w}px`;
        liveRoot!.style.height = `${screen.clientHeight / z}px`;
      };
      size();
      fit = new ResizeObserver(size);
      fit.observe(screen);
      liveRoot!.textContent = "";
      inst = mod.mount(liveRoot!, { lang: getLang() === "ru" ? "ru" : "en", calm, base: BASE, go: (k) => { if (k >= 0 && k < n) mark(k); } });
      if (at) inst.show(at);
    }

    const onClick = (e: MouseEvent) => {
      const el = e.target as HTMLElement;
      if (!liveRoot) {
        if (el.closest(".pt-spot")) return show(at + 1, 1);
        if (el.closest("[data-screen]")) {
          /* нажали мимо — точка вспыхивает */
          const spot = pages[at].querySelector<HTMLElement>(".pt-spot");
          if (spot) { spot.classList.remove("is-hint"); void spot.offsetWidth; spot.classList.add("is-hint"); }
          return;
        }
      }
      const go = el.closest<HTMLButtonElement>("[data-go]");
      if (go) { const k = Number(go.dataset.go); return show(k, k >= at ? 1 : -1); }
      if (el.closest("[data-back]")) return show(at - 1, -1);
      if (el.closest("[data-again]")) show(0, -1);
    };
    box.addEventListener("click", onClick);
    /* блок собирается, пока страница кейса ещё скрыта: доехать до точки первого экрана — когда он показался;
       живой модуль начинаем грузить чуть раньше, чем блок въедет в кадр */
    const seen = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      seen.disconnect();
      if (liveRoot) boot().catch(() => { liveRoot.textContent = ""; });
      else reach(pages[at]);
    }, { rootMargin: liveRoot ? "600px 0px" : "0px", threshold: liveRoot ? 0 : 0.3 });
    seen.observe(box);
    offs.push(() => { box.removeEventListener("click", onClick); clearTimeout(timer); seen.disconnect(); fit?.disconnect(); inst?.destroy(); });
    if (liveRoot) mark(0); else show(0);
  });
  return () => offs.forEach((f) => f());
}
