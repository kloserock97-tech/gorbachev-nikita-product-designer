/* v114: лента итогов (lite.html, #results). Идея — шоурил с портфолио klinaeva: после первого экрана кейсы идут
   крупными цифрами результата, экран раскрывается во всю ширину, а остальная страница листом наезжает сверху.
   Ролика у нас нет и он не нужен: кадры — обычная вёрстка, а листает их прокрутка.

   Как устроено: секция выше окна на «шаг» за каждый кейс плюс два окна; сцена внутри прилипает к верху.
   Пока сцена прилипла, прокрутка двигает позицию p от 0 до n−1; у каждого кадра своя дистанция до неё o = i − p
   (o > 0 — кадр ещё впереди, справа; o < 0 — уже ушёл влево). Из o считаются сдвиги и наклоны (--o в CSS).
   На каждом кейсе позиция ненадолго задерживается, чтобы цифру успели прочитать. Последнее окно — лист страницы
   (.ll-sheet, margin-top: −100svh) наезжает на последний кадр, сцена при этом чуть уходит вглубь (--x).
   Вход: пока секция поднимается к верху окна, сцена раскрывается из скруглённой рамки во весь экран (--e). */
import { getCases } from "../data/cases";

const BASE = import.meta.env.BASE_URL;
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
const pad = (n: number) => String(n).padStart(2, "0");
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
/* доля шага, на которой кадр стоит на месте: 0,3 — по 15 % в начале и конце каждого перехода */
const HOLD = 0.3;
const ease = (t: number) => t * t * (3 - 2 * t);

export function mountReel(root: HTMLElement, label: (k: string) => string) {
  const stage = root.querySelector<HTMLElement>(".ll-reel__stage")!;
  const box = root.querySelector<HTMLElement>("[data-reel-slides]")!;
  const track = root.querySelector<HTMLElement>("[data-reel-track]")!;
  const count = root.querySelector<HTMLElement>("[data-reel-count]")!;
  const calm = matchMedia("(prefers-reduced-motion: reduce)");

  let slides: HTMLElement[] = [];
  let dots: HTMLElement[] = [];
  let target = 0;
  let shown = -1;
  let raf = 0;
  let active = -1;

  function build() {
    const cases = getCases();
    root.style.setProperty("--n", String(cases.length));
    box.innerHTML = cases.map((c, i) => {
      const year = c.tag.split(" · ").at(-1) ?? "";
      return `<article class="ll-reel__slide" style="--i:${i};--bg:${c.look.ink};--ac:${c.look.accent}" data-i="${i}">
        <div class="ll-reel__copy">
          <p class="ll-reel__case">${esc(c.title)} <span>· ${esc(year)}</span></p>
          <p class="ll-reel__num"><span>${esc(c.stat.value)}</span></p>
          <p class="ll-reel__what">${esc(c.stat.label)}</p>
          <a class="ll-reel__open" href="./?lite=1#/work/${c.id}">${esc(label("case.open"))}<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></a>
        </div>
        <a class="ll-reel__shot" href="./?lite=1#/work/${c.id}" tabindex="-1" aria-hidden="true" data-cursor="view" data-tone="${c.look.accent}">
          <img src="${BASE}lite/cards/${c.id}.webp" alt="" width="960" height="600" loading="${i < 2 ? "eager" : "lazy"}" decoding="async">
        </a>
      </article>`;
    }).join("");
    track.innerHTML = cases.map(() => "<li><i></i></li>").join("");
    slides = [...box.querySelectorAll<HTMLElement>(".ll-reel__slide")];
    dots = [...track.querySelectorAll<HTMLElement>("i")];
    shown = -1;
    active = -1;
    measure();
    paint(target);
    shown = target;
  }

  /* где сейчас прокрутка: вход (e), позиция по кейсам (p), наезд листа (x) */
  function measure() {
    const n = slides.length;
    const r = root.getBoundingClientRect();
    const vh = stage.offsetHeight || innerHeight;
    root.style.setProperty("--e", clamp(1 - r.top / vh).toFixed(4));
    if (calm.matches || n < 2) { target = 0; return; }
    const run = r.height - 2 * vh;
    const y = -r.top;
    const raw = clamp(y / run) * (n - 1);
    const k = Math.min(n - 2, Math.floor(raw));
    const f = clamp((raw - k - HOLD / 2) / (1 - HOLD));
    target = raw >= n - 1 ? n - 1 : k + ease(f);
    root.style.setProperty("--x", clamp((y - run) / vh).toFixed(4));
  }

  function paint(p: number) {
    slides.forEach((s, i) => {
      const o = i - p;
      const far = Math.abs(o) >= 1;
      s.style.setProperty("--o", o.toFixed(4));
      /* фон кадра проступает, пока кадр подходит, и остаётся под следующим */
      s.style.setProperty("--bgo", clamp(1 - o).toFixed(4));
      /* текст старого кадра гаснет к середине перехода, новый проступает после неё — двух подписей сразу не бывает */
      s.style.setProperty("--fo", clamp(1 - Math.abs(o) * 2.4).toFixed(4));
      /* экран виден дольше: его подлёт и уход и есть движение перехода */
      s.style.setProperty("--so", clamp(1 - Math.abs(o) * 1.25).toFixed(4));
      /* цифра катится барабаном, но гаснет раньше экрана: край соседней не торчит из-под текущей */
      s.style.setProperty("--no", clamp(1 - Math.abs(o) * 1.6).toFixed(4));
      s.classList.toggle("is-far", far && o > 0);
    });
    dots.forEach((d, i) => d.style.setProperty("--f", clamp(p - i + 1).toFixed(3)));
    const now = Math.round(p);
    if (now !== active) {
      active = now;
      count.innerHTML = `<b>${pad(now + 1)}</b> / ${pad(slides.length)}`;
      /* с клавиатуры доступна только ссылка текущего кадра */
      slides.forEach((s, i) => { s.inert = !calm.matches && i !== now; });
    }
  }

  /* позиция догоняет прокрутку плавно: рывок колесом не перескакивает кадр */
  function tick() {
    raf = 0;
    measure();
    const d = target - shown;
    shown = Math.abs(d) < 0.002 || calm.matches ? target : shown + d * 0.2;
    paint(shown);
    if (shown !== target) raf = requestAnimationFrame(tick);
  }
  const kick = () => { if (!raf) raf = requestAnimationFrame(tick); };

  /* считаем, только пока секция рядом с окном */
  let near = false;
  new IntersectionObserver(([e]) => { near = e.isIntersecting; if (near) kick(); }, { rootMargin: "50% 0px" }).observe(root);
  addEventListener("scroll", () => { if (near) kick(); }, { passive: true });
  addEventListener("resize", kick);
  calm.addEventListener("change", build);

  build();
  return build;
}
