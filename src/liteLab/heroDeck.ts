/* Карточка в кадре первого экрана — колода, как в 3D-версии (ui/fieldNote.ts): сначала кейсы в порядке ленты, потом
   пэт-проекты. Листается стрелками «‹ 01/12 ›», стрелками клавиатуры, пока фокус в карточке, и свайпом пальцем.
   При смене содержимое гаснет и уезжает в сторону листания, новое приходит с другой стороны. */
import { getCases, type CaseItem } from "../data/cases";
import notes, { type Note } from "../data/notes";
import { t, type Key } from "../i18n";

type Item = { kind: "case"; c: CaseItem } | { kind: "note"; n: Note };

/* обложки как в 3D-карточке: у кейсов с роликом — его кадр, у мобильных концептов — диорама на цветах кейса */
const CARD: Record<string, string> = { "grif-ai": "ui/card-grif-ai.webp", community: "ui/card-community.webp" };
const FIT: Record<string, string> = { "plati-chastyami": "ui/card-plati-chastyami.webp", "restaurant-guru": "ui/card-restaurant-guru.webp" };
const BASE = import.meta.env.BASE_URL;
const pad = (n: number) => String(n).padStart(2, "0");

export function mountHeroDeck(root: HTMLElement, label: (k: string) => string) {
  const link = root.querySelector<HTMLAnchorElement>("[data-deck-link]")!;
  const img = root.querySelector<HTMLImageElement>("[data-deck-img]")!;
  const title = root.querySelector<HTMLElement>("[data-deck-title]")!;
  const meta = root.querySelector<HTMLElement>("[data-deck-meta]")!;
  const kind = root.querySelector<HTMLElement>("[data-deck-kind]")!;
  const count = root.querySelector<HTMLElement>("[data-deck-count]")!;
  const [prev, next] = [...root.querySelectorAll<HTMLButtonElement>("[data-deck-step]")];
  const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;

  let items: Item[] = [];
  let index = 0;
  let timer = 0;

  function paint() {
    const it = items[index];
    if (!it) return;
    const isCase = it.kind === "case";
    root.dataset.kind = it.kind;
    kind.textContent = label(isCase ? "deck.case" : "deck.note");
    count.innerHTML = `<b>${pad(index + 1)}</b>/${pad(items.length)}`;
    if (isCase) {
      const c = it.c;
      const fit = FIT[c.id];
      img.src = `${BASE}${CARD[c.id] ?? fit ?? c.look.screen?.src ?? ""}`;
      img.classList.toggle("is-fit", !!fit);
      img.style.background = fit ? `linear-gradient(150deg, ${c.look.stage[0]}, ${c.look.stage[1]})` : "";
      title.textContent = c.title;
      meta.textContent = c.tag;
      link.href = `./?lite=1#/work/${c.id}`;
      link.removeAttribute("target");
      link.removeAttribute("rel");
      link.setAttribute("aria-label", `${label("case.open")}: ${c.title}`);
    } else {
      const n = it.n;
      const name = t(`notes.${n.id}.title` as Key);
      img.src = `${BASE}${n.image}`;
      img.classList.remove("is-fit");
      img.style.background = "";
      title.textContent = name;
      meta.textContent = t(`notes.${n.id}.kind` as Key);
      if (n.links) {
        link.href = n.links.demo;
        link.target = "_blank";
        link.rel = "noopener";
        link.setAttribute("aria-label", `${label("lab.demo")}: ${name}`);
      } else {
        /* закрытый проект — ведём к списку пэт-проектов на этой странице */
        link.href = "#lab";
        link.removeAttribute("target");
        link.removeAttribute("rel");
        link.setAttribute("aria-label", `${name}: ${label("lab.closed")}`);
      }
    }
    prev?.setAttribute("aria-label", label("deck.prev"));
    next?.setAttribute("aria-label", label("deck.next"));
  }

  function go(step: number) {
    if (items.length < 2) return;
    index = (index + step + items.length) % items.length;
    if (calm) return paint();
    root.style.setProperty("--dir", String(Math.sign(step)));
    root.classList.add("is-swapping");
    clearTimeout(timer);
    timer = window.setTimeout(() => {
      paint();
      /* новая картинка должна успеть раскодироваться, иначе проявится пустая рамка; но не ждём вечно */
      const show = () => root.classList.remove("is-swapping");
      Promise.race([img.decode().catch(() => {}), new Promise((r) => setTimeout(r, 400))]).then(show);
    }, 180);
  }

  prev?.addEventListener("click", () => go(-1));
  next?.addEventListener("click", () => go(1));
  root.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") { e.preventDefault(); go(1); }
    if (e.key === "ArrowLeft") { e.preventDefault(); go(-1); }
  });

  /* свайп: горизонтальное движение пальцем больше 40 px листает; вертикальное отдаём прокрутке страницы */
  let x0 = 0, y0 = 0, tracking = false, swiped = 0;
  root.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "mouse") return;
    tracking = true; x0 = e.clientX; y0 = e.clientY;
  });
  root.addEventListener("pointerup", (e) => {
    if (!tracking) return;
    tracking = false;
    const dx = e.clientX - x0, dy = e.clientY - y0;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.4) { swiped = performance.now(); go(dx < 0 ? 1 : -1); }
  });
  root.addEventListener("pointercancel", () => (tracking = false));
  /* после свайпа палец отпускается над ссылкой — этот клик не должен открывать проект */
  link.addEventListener("click", (e) => { if (performance.now() - swiped < 400) e.preventDefault(); });

  /* при смене языка — та же позиция в колоде с новыми подписями */
  return () => {
    items = [...getCases().map((c) => ({ kind: "case" as const, c })), ...notes.map((n) => ({ kind: "note" as const, n }))];
    index = Math.min(index, items.length - 1);
    paint();
  };
}
