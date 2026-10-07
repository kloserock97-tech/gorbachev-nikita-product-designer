/* v92: переход из сайта в кейс. Раньше страница кейса просто проявлялась поверх сцены — между «посмотрел карточку»
   и «читаю кейс» не было связи. Теперь переход собран из того, что уже на экране (идея по подборке Codrops/Chrome
   View Transitions/21st.dev — «карточка растёт в страницу», код свой):

   1. Сцена расступается: список кейсов уезжает влево, таблица фактов опускается, огромное название гаснет.
   2. Светлая страница раскрывается кругом из центра выбранной карточки — тёмный холм уходит «в неё».
   3. Сама карточка (диорама из главы «Кейсы» или обложка из меню) перелетает на место мокапа в шапке кейса
      и растворяется в нём: тот же предмет, только ближе.
   Закрытие — обратный ход: круг сжимается в ту же точку, сцена возвращается на место.

   Всё на Web Animations API: clip-path у окна кейса и left/top/width/height у одной картинки в полёте.
   Сцена на это время стоит на паузе (её ставит caseView через onToggle), поэтому кадр ровный и на телефоне.
   При «уменьшить движение» перехода нет — остаётся прежнее мягкое проявление. */
import { getCases } from "../data/cases";

const BASE = import.meta.env.BASE_URL;
const EASE = "cubic-bezier(0.7, 0, 0.2, 1)";
const OPEN_MS = 820;
const CLOSE_MS = 560;

type Source = { rect: DOMRect | null; x: number; y: number; id: string; img: string | null; at: number };
let source: Source | null = null;
/** откуда раскрывался последний кейс — туда же он и сожмётся */
let origin: { x: number; y: number } | null = null;

/* переходы списка, фактов и названия включены только на время хода: в остальное время у главы свои анимации */
let animTimer = 0;
const animate = (ms: number) => {
  document.body.classList.add("cv-anim");
  clearTimeout(animTimer);
  animTimer = window.setTimeout(() => document.body.classList.remove("cv-anim"), ms);
};

const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
const visible = (r: DOMRect) => r.width > 8 && r.height > 8 && r.bottom > 0 && r.top < innerHeight;

/** запомнить, откуда кликнули: зовётся из общего обработчика ссылок #/work/<id> (caseView.ts) */
export function noteSource(a: HTMLAnchorElement, e: MouseEvent) {
  const id = a.getAttribute("href")!.replace(/^#\/work\//, "").split("/")[0];
  const c = getCases().find((x) => x.id === id);
  let el: Element | null = null;
  let img: string | null = null;
  if (a.closest(".cx")) {
    /* глава «Кейсы»: летит текущая карточка, даже если кликнули по названию в списке */
    el = document.querySelector(".cx-card.is-cur") ?? a;
    img = c?.look.diorama?.src ?? c?.look.screen?.src ?? null;
  } else if (a.closest(".work-menu")) {
    el = a.querySelector(".work-menu__thumb");
    img = c?.look.screen?.src ?? c?.look.diorama?.src ?? null;
  }
  const rect = el?.getBoundingClientRect() ?? null;
  const ok = rect && visible(rect) ? rect : null;
  /* клавиатура даёт клик без координат — тогда центр ссылки */
  const ar = a.getBoundingClientRect();
  const x = ok ? ok.left + ok.width / 2 : e.clientX || ar.left + ar.width / 2;
  const y = ok ? ok.top + ok.height / 2 : e.clientY || ar.top + ar.height / 2;
  source = { rect: ok, x, y, id, img: ok ? img : null, at: performance.now() };
}

/** радиус круга, который из точки (x, y) закрывает весь экран */
const cover = (x: number, y: number) => Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y)) + 2;

/** раскрыть только что отрисованное окно кейса; false — перехода не будет, работает обычное проявление */
export function morphIn(root: HTMLElement, id: string): boolean {
  const s = source;
  source = null;
  if (!s || s.id !== id || performance.now() - s.at > 4000 || reduced() || !("animate" in root)) { origin = null; return false; }
  origin = { x: s.x, y: s.y };
  root.classList.add("cv-morph");
  animate(OPEN_MS + 200);
  document.body.classList.add("cv-leaving");
  const from = `circle(0px at ${s.x}px ${s.y}px)`;
  const to = `circle(${cover(s.x, s.y)}px at ${s.x}px ${s.y}px)`;
  root.animate([{ clipPath: from }, { clipPath: to }], { duration: OPEN_MS, easing: EASE });

  /* картинка в полёте: из карточки — на место мокапа в шапке кейса */
  const hero = root.querySelector<HTMLElement>(".cs-hero .ya, .cs-hero-stage");
  const r1 = hero?.getBoundingClientRect();
  if (s.rect && s.img && r1 && visible(r1)) {
    const fly = document.createElement("div");
    fly.className = "cm-fly";
    fly.innerHTML = `<img src="${BASE}${s.img}" alt="" decoding="async" draggable="false">`;
    document.body.appendChild(fly);
    const box = (r: DOMRect) => ({ left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px` });
    const a = fly.animate(
      [
        { ...box(s.rect), opacity: 1, offset: 0 },
        /* гаснет раньше конца: к тому времени, как проявится заголовок кейса, картинка его уже не перекрывает */
        { opacity: 1, offset: 0.4 },
        { opacity: 0, offset: 0.82 },
        { ...box(r1), opacity: 0, offset: 1 },
      ],
      { duration: OPEN_MS + 120, easing: EASE, fill: "forwards" },
    );
    a.onfinish = a.oncancel = () => fly.remove();
  }
  return true;
}

/** закрыть обратным ходом; возвращает, сколько ждать до конца, или null — переход не нужен */
export function morphOut(root: HTMLElement): number | null {
  if (document.body.classList.contains("cv-leaving")) animate(CLOSE_MS + 400);
  document.body.classList.remove("cv-leaving");
  if (!origin || reduced() || !root.classList.contains("cv-morph")) { root.classList.remove("cv-morph"); origin = null; return null; }
  const { x, y } = origin;
  origin = null;
  root.animate(
    [{ clipPath: `circle(${cover(x, y)}px at ${x}px ${y}px)` }, { clipPath: `circle(0px at ${x}px ${y}px)` }],
    { duration: CLOSE_MS, easing: "cubic-bezier(0.5, 0, 0.75, 0)", fill: "forwards" },
  );
  return CLOSE_MS;
}

/** окно уже спрятано: снять застывший круг, иначе следующий кейс откроется сжатым в точку */
export function morphReset(root: HTMLElement) {
  root.getAnimations().forEach((a) => a.cancel());
  root.classList.remove("cv-morph");
}
