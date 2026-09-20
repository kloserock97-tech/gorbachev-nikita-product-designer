/* Заметки на первом экране.
   v28: стопка страниц в одной карточке — свои графические проекты Никиты. Переключатель «‹ 01/04 ›», свайп
   пальцем по карточке, стрелки на клавиатуре, пока фокус внутри.
   v29: вместо картинки — зацикленное превью из самой демки (webm/mp4, 5,8 с, сотни килобайт). Пока ролик не
   пошёл, видна картинка-постер — первый кадр того же ролика. При «меньше движения» и экономии трафика остаётся постер.

   v58: новый вид карточки (референс Никиты — карточки маршрутов). Картинка сверху; на ней название, подпись и
   стеклянная кнопка «Открыть демо» — демо доступно сразу, без раскрытия. Под картинкой шеврон: раскрывает
   описание (заголовок, стек, три цифры, значок, абзацы, ссылка на код). Оборота больше нет, картинка остаётся
   на месте и продолжает играть. Карточка растёт вниз; если низ не помещается в окно, она поднимается (--note-lift),
   а в совсем низком окне описание прокручивается внутри (is-tight). На телефоне карточка просто растёт, высоту
   кадра под неё считает CSS из --m-open, которую меряем здесь. Стили — hero/note-card.css. */
import "./hero/note-card.css";
import notes from "../data/notes";
import { cue } from "../audio/bus";
import { onLang, t, type Key } from "../i18n";

const BASE = import.meta.env.BASE_URL;
const pad = (n: number) => String(n).padStart(2, "0");
const key = (id: string, part: string) => `notes.${id}.${part}` as Key;

export function initFieldNote() {
  const card = document.querySelector<HTMLElement>(".card--stove");
  const knob = card?.querySelector<HTMLButtonElement>(".knob--note");
  const note = card?.querySelector<HTMLElement>(".card-note");
  const inner = card?.querySelector<HTMLElement>(".card-note__in");
  if (!card || !knob || !note || !inner) return;

  const labels = [...card.querySelectorAll<HTMLElement>("[data-note-label]")];
  const titles = [...card.querySelectorAll<HTMLElement>("[data-note-title]")];
  const img = card.querySelector<HTMLImageElement>("[data-note-img]");
  const video = card.querySelector<HTMLVideoElement>("[data-note-video]");
  const calm = matchMedia("(prefers-reduced-motion: reduce)").matches
    || !!(navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
  const kind = card.querySelector<HTMLElement>("[data-note-kind]");
  const meta = card.querySelector<HTMLElement>("[data-note-meta]");
  const stats = card.querySelector<HTMLElement>("[data-note-stats]");
  const glyph = card.querySelector<HTMLElement>("[data-note-glyph]");
  const points = card.querySelector<HTMLElement>("[data-note-points]");
  const links = card.querySelector<HTMLElement>("[data-note-links]");
  const demo = card.querySelector<HTMLAnchorElement>("[data-note-demo]");
  const deck = card.querySelector<HTMLElement>(".note-deck");
  const count = card.querySelector<HTMLElement>(".note-deck__count");
  const steps = [...card.querySelectorAll<HTMLButtonElement>(".note-deck__btn")];

  let index = 0;
  let swapTimer = 0;
  let inView = true;
  const isOpen = () => card.classList.contains("is-open");
  const narrow = matchMedia("(max-width: 900px)");

  /* превью играет, только когда его действительно видно: карточка в кадре, вкладка активна, интерфейс
     холма не уехал в скролл-историю. Раскрытое описание картинку не закрывает — ролик идёт дальше */
  const syncVideo = () => {
    if (!video?.dataset.note) return;
    const want = inView && !document.hidden && !document.body.classList.contains("story-away");
    if (want && video.paused) void video.play().catch(() => {});
    else if (!want && !video.paused) video.pause();
  };

  /* Куда растёт открытая карточка.
     Телефон: вниз, страница прокручивается как обычно (вложенная прокрутка — ловушка для пальца, v48);
     кадру нужна высота описания — --m-open.
     Широкий экран: вниз, а если низ уходит за окно — карточка поднимается, но не выше звуковой кнопки и дока.
     Не хватило и этого — описание получает потолок и прокручивается внутри. */
  const fit = () => {
    const root = document.documentElement;
    const full = inner.scrollHeight;
    if (narrow.matches) {
      root.style.setProperty("--m-open", `${Math.ceil(full)}px`);
      card.style.removeProperty("--note-lift");
      card.style.removeProperty("--note-max");
      card.style.removeProperty("--note-shrink");
      card.classList.remove("is-tight");
      return;
    }
    root.style.removeProperty("--m-open");
    if (!isOpen()) { card.style.setProperty("--note-lift", "0"); card.style.setProperty("--note-shrink", "0px"); card.classList.remove("is-tight"); return; }
    /* место карточки без подъёма: offsetTop уже включает отрицательный margin (в том числе посреди перехода) —
       вычитаем его. По раскладке, а не по getBoundingClientRect: параллакс двигает карточку за курсором */
    const parent = (card.offsetParent as HTMLElement | null)?.getBoundingClientRect().top ?? 0;
    const restTop = parent + card.offsetTop - (parseFloat(getComputedStyle(card).marginTop) || 0);
    /* высота закрытой карточки и картинки — из ширины (note-card.css: поля 12, картинка 246, шеврон 46 при ширине 352):
       посреди перехода offsetHeight врёт */
    const unit = card.offsetWidth / 352;
    const figure = 246 * unit;
    const closed = (12 + 246 + 46) * unit;
    const gap = 14;
    const fab = document.querySelector<HTMLElement>(".sound-fab")?.getBoundingClientRect();
    const dock = document.querySelector<HTMLElement>(".dock")?.getBoundingClientRect();
    const ceiling = Math.max(fab?.bottom ?? 0, dock?.bottom ?? 0, 64) + gap;
    const overflow = restTop + closed + full + gap - innerHeight;
    const room = Math.max(0, restTop - ceiling);
    const next = Math.max(0, Math.min(overflow, room));
    card.style.setProperty("--note-lift", next.toFixed(1));
    /* подъёма не хватило — картинка отдаёт до 38 % своей высоты; не хватило и этого — описание прокручивается внутри */
    const shrink = Math.max(0, Math.min(overflow - room, figure * 0.38));
    card.style.setProperty("--note-shrink", `${shrink.toFixed(1)}px`);
    const tight = overflow - room - shrink > 1;
    card.classList.toggle("is-tight", tight);
    if (tight) card.style.setProperty("--note-max", `${Math.max(120, Math.floor(innerHeight - gap - ceiling - closed + shrink))}px`);
    else card.style.removeProperty("--note-max");
  };

  const set = (open: boolean) => {
    if (open !== isOpen()) cue(open ? "expand" : "collapse");
    card.classList.toggle("is-open", open);
    knob.setAttribute("aria-expanded", String(open));
    knob.setAttribute("aria-label", open ? t("notes.close") : t("notes.open", { title: t(key(notes[index].id, "title")) }));
    note.setAttribute("aria-hidden", String(!open));
    fit();
    /* ссылка в описании доступна с клавиатуры только когда оно раскрыто; кнопка демо на картинке — всегда */
    links?.querySelectorAll("a").forEach((a) => (a.tabIndex = open ? 0 : -1));
  };

  /* Тексты — из словаря текущего языка, картинка, стек и значок — из данных */
  const paint = () => {
    const current = notes[index];
    const id = current.id;
    card.dataset.note = id;
    labels.forEach((el) => (el.textContent = t(key(id, "label"))));
    titles.forEach((el) => (el.textContent = t(key(id, "title"))));
    if (img) {
      const src = `${BASE}${current.image}`;
      if (!img.src.endsWith(current.image)) img.src = src;
      img.alt = t(key(id, "alt"));
    }
    if (video) {
      const clip = calm ? undefined : current.video;
      if (clip && video.dataset.note !== id) {
        card.classList.remove("is-playing");
        video.dataset.note = id;
        video.poster = `${BASE}${current.image}`;
        video.innerHTML = `<source src="${BASE}${clip.webm}" type="video/webm"><source src="${BASE}${clip.mp4}" type="video/mp4">`;
        video.load();
      } else if (!clip && video.dataset.note) {
        card.classList.remove("is-playing");
        video.pause();
        delete video.dataset.note;
        video.removeAttribute("poster");
        video.innerHTML = "";
        video.load();
      }
      syncVideo();
    }
    if (kind) kind.textContent = t(key(id, "kind"));
    if (meta) meta.textContent = current.meta;
    if (stats) {
      stats.innerHTML = "";
      for (let i = 1; i <= 3; i++) {
        const cell = document.createElement("div");
        const dd = document.createElement("dd");
        const dt = document.createElement("dt");
        dd.textContent = t(key(id, `s${i}v`));
        dt.textContent = t(key(id, `s${i}l`));
        cell.append(dd, dt);
        stats.appendChild(cell);
      }
    }
    if (glyph) glyph.innerHTML = `<svg viewBox="0 0 64 64" aria-hidden="true">${current.glyph}</svg>`;
    if (points) {
      points.innerHTML = "";
      for (let i = 1; i <= current.points; i++) {
        const p = document.createElement("p");
        p.textContent = t(key(id, `p${i}`));
        points.appendChild(p);
      }
    }
    if (demo) {
      demo.hidden = !current.links;
      if (current.links) demo.href = current.links.demo;
      demo.setAttribute("aria-label", `${t("notes.go")}: ${t(key(id, "title"))}`);
    }
    if (links) {
      links.hidden = !current.links;
      links.innerHTML = current.links ? `<a href="${current.links.repo}" target="_blank" rel="noopener">${t("notes.repo")}</a>` : "";
      links.querySelectorAll("a").forEach((a) => (a.tabIndex = isOpen() ? 0 : -1));
    }
    if (count) count.innerHTML = `<b>${pad(index + 1)}</b>/${pad(notes.length)}`;
    deck?.setAttribute("aria-label", t("notes.deck"));
    steps[0]?.setAttribute("aria-label", t("notes.prev"));
    steps[1]?.setAttribute("aria-label", t("notes.next"));
    knob.setAttribute("aria-label", isOpen() ? t("notes.close") : t("notes.open", { title: t(key(id, "title")) }));
    fit();
  };

  /* Смена страницы: картинка с подписью гаснут, пока меняются текст и картинка, и проявляются обратно.
     Направление подсказывает сдвиг — вперёд уезжает влево, назад вправо. Раскрытое описание сворачивается:
     у страниц оно разной высоты, и менять текст под открытой карточкой — значит дёргать её размер. */
  const go = (step: number) => {
    const next = (index + step + notes.length) % notes.length;
    if (next === index) return;
    set(false);
    cue("progress-step", 0.6);
    card.style.setProperty("--swap-dir", String(Math.sign(step)));
    card.classList.add("is-swapping");
    clearTimeout(swapTimer);
    swapTimer = window.setTimeout(() => {
      index = next;
      paint();
      /* новая картинка должна успеть декодироваться, иначе проявится пустая рамка. Но ждём не вечно:
         не загрузилась (сеть, 404) — карточка всё равно возвращается, с текстом и пустой рамкой */
      let shown = false;
      const reveal = () => {
        if (shown) return;
        shown = true;
        requestAnimationFrame(() => card.classList.remove("is-swapping"));
      };
      if (img && !(img.complete && img.naturalWidth)) {
        img.addEventListener("load", reveal, { once: true });
        img.addEventListener("error", reveal, { once: true });
        window.setTimeout(reveal, 900);
      } else reveal();
    }, 200);
  };

  /* соседние картинки грузим заранее, в простое, — переключение не ждёт сети */
  const idle = (window as Window & { requestIdleCallback?: (cb: () => void) => number }).requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 1500));
  idle(() => notes.slice(1).forEach((n) => { const pre = new Image(); pre.src = `${BASE}${n.image}`; }));

  steps.forEach((btn) => btn.addEventListener("click", (e) => {
    e.stopPropagation();
    go(Number(btn.dataset.step));
  }));
  knob.addEventListener("click", (e) => {
    e.stopPropagation();
    set(!isOpen());
  });
  card.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") { e.preventDefault(); go(1); }
    if (e.key === "ArrowLeft") { e.preventDefault(); go(-1); }
  });

  /* Свайп пальцем по карточке (v48). У карточки touch-action: pan-y — вертикаль остаётся прокрутке страницы,
     горизонталь приходит сюда. Картинка с подписью едут за пальцем (--drag): видно, что карточка листается,
     ещё до того как палец отпущен. */
  let startX = 0, startY = 0, tracking = false, dragging = false;
  const drop = () => {
    tracking = dragging = false;
    card.classList.remove("is-dragging");
    card.style.removeProperty("--drag");
  };
  card.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "mouse" || (e.target as Element).closest("a, button")) return;
    tracking = true; startX = e.clientX; startY = e.clientY;
  });
  card.addEventListener("pointermove", (e) => {
    if (!tracking) return;
    const dx = e.clientX - startX, dy = e.clientY - startY;
    if (!dragging) {
      if (Math.abs(dx) < 10 || Math.abs(dx) < Math.abs(dy) * 1.2) return;
      dragging = true;
      card.classList.add("is-dragging");
    }
    /* за пальцем, но с сопротивлением: карточка не уезжает, а намекает направление */
    card.style.setProperty("--drag", (Math.sign(dx) * Math.min(56, Math.abs(dx) * 0.45)).toFixed(1));
  });
  card.addEventListener("pointerup", (e) => {
    if (!tracking) return;
    const dx = e.clientX - startX, dy = e.clientY - startY;
    drop();
    if (Math.abs(dx) > 44 && Math.abs(dx) > Math.abs(dy) * 1.4) go(dx < 0 ? 1 : -1);
  });
  card.addEventListener("pointercancel", drop);

  addEventListener("keydown", (e) => { if (e.key === "Escape") set(false); });
  addEventListener("click", (e) => { if (!card.contains(e.target as Node)) set(false); });
  video?.addEventListener("playing", () => { if (video.dataset.note === notes[index].id) card.classList.add("is-playing"); });
  new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; syncVideo(); }).observe(card);
  document.addEventListener("visibilitychange", syncVideo);
  let scrollRaf = 0;
  addEventListener("scroll", () => { if (!scrollRaf) scrollRaf = requestAnimationFrame(() => { scrollRaf = 0; syncVideo(); }); }, { passive: true });

  addEventListener("resize", fit);
  narrow.addEventListener("change", fit);
  /* шрифт приехал позже текста — высота описания другая */
  document.fonts?.ready.then(fit).catch(() => {});
  onLang(paint);
  paint();
}
