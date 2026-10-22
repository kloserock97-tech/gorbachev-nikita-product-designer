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
import { bodyHas, onBodyState } from "../lib/bodyState";
import { pad2 as pad } from "../lib/format";
import notes, { type Note } from "../data/notes";
import { getCases, type CaseItem } from "../data/cases";
import { caseCard } from "../data/caseCards";
import { cue } from "../audio/bus";
import { onLang, t, type Key } from "../i18n";
import { noteLogo } from "./noteLogo";

const BASE = import.meta.env.BASE_URL;
const key = (id: string, part: string) => `notes.${id}.${part}` as Key;

/* v97: колода карточки — сначала три кейса (как в ленте), потом пэт-проекты. Кейс показывает экран продукта, строку
   «о проекте», тег, главную цифру и ссылку на страницу кейса; пэт-проект — как раньше */
type Item = { kind: "case"; c: CaseItem } | { kind: "note"; n: Note };
const deckItems = (): Item[] => [...getCases().map((c) => ({ kind: "case" as const, c })), ...notes.map((n) => ({ kind: "note" as const, n }))];
const itemId = (it: Item) => (it.kind === "case" ? `case-${it.c.id}` : it.n.id);
const itemTitle = (it: Item) => (it.kind === "case" ? it.c.title : t(key(it.n.id, "title")));
/* v98 по просьбе Никиты: у кейса с роликом интерфейса в карточке играет ролик, а не картинка. Это лёгкие копии
   cases/<id>/film.mp4 (640 px, без звука, webm + mp4); постер — уменьшенный film-poster.webp, чтобы картинка до старта
   совпадала с первым кадром. У остальных кейсов роликов нет — у них по-прежнему экран продукта */
const CASE_CLIP: Record<string, { image: string; video: NonNullable<Note["video"]> }> = {
  "grif-ai": { image: "ui/card-grif-ai.webp", video: { webm: "ui/card-grif-ai.webm", mp4: "ui/card-grif-ai.mp4" } },
  community: { image: "ui/card-community.webp", video: { webm: "ui/card-community.webm", mp4: "ui/card-community.mp4" } },
};
/* v111 (Никита): у кейсов без ролика — обложка из лёгкой версии (экран продукта на цветах кейса, public/lite/cards),
   во всю карточку; диорамы мобильных концептов (v100) больше не показываются */
const itemFit = (_it: Item): string | undefined => undefined;
const itemImage = (it: Item) => (it.kind === "case" ? CASE_CLIP[it.c.id]?.image ?? `lite/cards/${it.c.id}.webp` : it.n.image);
const itemVideo = (it: Item) => (it.kind === "case" ? CASE_CLIP[it.c.id]?.video : it.n.video);

export function initFieldNote() {
  const card = document.querySelector<HTMLElement>(".card--stove");
  const knob = card?.querySelector<HTMLButtonElement>(".knob--note");
  const note = card?.querySelector<HTMLElement>(".card-note");
  const inner = card?.querySelector<HTMLElement>(".card-note__in");
  if (!card || !knob || !note || !inner) return;

  /* v92: под названием проекта — что это (раньше «Свой проект 01»: номер стоит в листалке, «свой проект» — над карточкой) */
  const labels = [...card.querySelectorAll<HTMLElement>("[data-note-sub]")];
  const titles = [...card.querySelectorAll<HTMLElement>("[data-note-title]")];
  const img = card.querySelector<HTMLImageElement>("[data-note-img]");
  const video = card.querySelector<HTMLVideoElement>("[data-note-video]");
  /* v88: живой знак вместо ролика (ui/noteLogo.ts) — слой поверх картинки, пересобирается только при смене знака */
  const logoSlot = img?.parentElement ? document.createElement("span") : null;
  if (logoSlot && img?.parentElement) { logoSlot.className = "nlogo-slot"; logoSlot.hidden = true; img.parentElement.append(logoSlot); }
  const calm = matchMedia("(prefers-reduced-motion: reduce)").matches
    || !!(navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
  const kind = card.querySelector<HTMLElement>("[data-note-kind]");
  const meta = card.querySelector<HTMLElement>("[data-note-meta]");
  const stats = card.querySelector<HTMLElement>("[data-note-stats]");
  const glyph = card.querySelector<HTMLElement>("[data-note-glyph]");
  const points = card.querySelector<HTMLElement>("[data-note-points]");
  const links = card.querySelector<HTMLElement>("[data-note-links]");
  const deck = card.querySelector<HTMLElement>(".note-deck");
  const count = card.querySelector<HTMLElement>(".note-deck__count");
  const steps = [...card.querySelectorAll<HTMLButtonElement>(".note-deck__btn")];
  const pick = card.querySelector<HTMLElement>(".note-pick");

  let items = deckItems();
  let index = 0;
  let swapTimer = 0;
  let inView = true;
  const isOpen = () => card.classList.contains("is-open");
  const narrow = matchMedia("(max-width: 900px)");

  /* превью играет, только когда его действительно видно: карточка в кадре, вкладка активна, интерфейс
     холма не уехал в скролл-историю. Раскрытое описание картинку не закрывает — ролик идёт дальше */
  /* v72: на телефоне ролик сам не играет — стоит кадр-превью. Цикл видео поверх WebGL-холста на iPhone 11
     был частью тех ~12 мс, что интерфейс добавлял к кадру холма. Демо по-прежнему открывается нажатием */
  const phone = matchMedia("(hover: none) and (pointer: coarse)").matches;
  const syncVideo = () => {
    if (!video?.dataset.note) return;
    /* v79: и не во время загрузки (карточка ещё скрыта, а ролик качался и декодировался), и не под открытым
       компьютером или страницей кейса */
    const want = !phone && inView && !document.hidden && bodyHas("is-ready") && !bodyHas("story-away") && !bodyHas("pc-focus") && !bodyHas("case-open");
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
    /* высота закрытой карточки и шапки — из ширины (note-card.css, v93: поля 12, шапка 96, снизу поле 12 при ширине 456;
       шеврон стоит в шапке): посреди перехода offsetHeight врёт */
    const unit = card.offsetWidth / 456;
    const figure = 96 * unit;
    const closed = (12 + 96 + 12) * unit;
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
    knob.setAttribute("aria-label", open ? t("notes.close") : t("notes.open", { title: itemTitle(items[index]) }));
    note.setAttribute("aria-hidden", String(!open));
    fit();
    /* v96: на телефоне карточка растёт вниз, и всё описание уходило под сгиб экрана — человек видел только
       перевернувшийся шеврон. Подводим страницу к карточке, когда она раскрылась */
    if (open && narrow.matches) window.setTimeout(() => card.scrollIntoView({ block: "start", behavior: calm ? "auto" : "smooth" }), 80);
    /* ссылка в описании доступна с клавиатуры только когда оно раскрыто; кнопка демо на картинке — всегда */
    links?.querySelectorAll("a").forEach((a) => (a.tabIndex = open ? 0 : -1));
  };

  /* Тексты — из словаря текущего языка, картинка, стек и значок — из данных */
  const paint = () => {
    items = deckItems();
    const it = items[index];
    const id = itemId(it);
    const isCase = it.kind === "case";
    card.dataset.note = id;
    const fitImg = itemFit(it);
    card.toggleAttribute("data-fit", !!fitImg);
    if (fitImg && it.kind === "case") card.style.setProperty("--fit-bg", `linear-gradient(150deg, ${it.c.look.stage[0]}, ${it.c.look.stage[1]})`);
    else card.style.removeProperty("--fit-bg");
    if (pick) pick.textContent = t(isCase ? "notes.pick.case" : "notes.pick");
    const sub = isCase ? it.c.about ?? it.c.subtitle : t(key(it.n.id, "kind"));
    labels.forEach((el) => (el.textContent = sub));
    titles.forEach((el) => (el.textContent = itemTitle(it)));
    const image = itemImage(it);
    if (img) {
      if (!img.src.endsWith(image)) img.src = `${BASE}${image}`;
      img.alt = isCase ? it.c.title : t(key(it.n.id, "alt"));
    }
    if (logoSlot) {
      const kind = isCase ? undefined : it.n.logo;
      if (kind && logoSlot.dataset.kind !== kind) { logoSlot.innerHTML = noteLogo(kind); logoSlot.dataset.kind = kind; }
      else if (!kind && logoSlot.dataset.kind) { logoSlot.innerHTML = ""; delete logoSlot.dataset.kind; }
      logoSlot.hidden = !kind;
    }
    if (video) {
      const clip = calm ? undefined : itemVideo(it);
      if (clip && video.dataset.note !== id) {
        card.classList.remove("is-playing");
        video.dataset.note = id;
        video.poster = `${BASE}${image}`;
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
    if (kind) kind.textContent = sub;
    if (meta) meta.textContent = isCase ? it.c.tag : it.n.meta;
    if (stats) {
      stats.innerHTML = "";
      const cells: [string, string][] = isCase ? (caseCard(it.c.id)?.stats ?? [it.c.stat]).map((s): [string, string] => [s.value, s.label]) : [1, 2, 3].map((i) => [t(key(it.n.id, `s${i}v`)), t(key(it.n.id, `s${i}l`))]);
      for (const [v, l] of cells) {
        const cell = document.createElement("div");
        const dd = document.createElement("dd");
        const dt = document.createElement("dt");
        dd.textContent = v;
        dt.textContent = l;
        cell.append(dd, dt);
        stats.appendChild(cell);
      }
    }
    const caseGlyph = isCase ? caseCard(it.c.id)?.glyph : undefined;
    if (glyph) glyph.innerHTML = isCase ? (caseGlyph ? `<svg viewBox="0 0 64 64" aria-hidden="true">${caseGlyph}</svg>` : "") : `<svg viewBox="0 0 64 64" aria-hidden="true">${it.n.glyph}</svg>`;
    if (points) {
      points.innerHTML = "";
      const texts = isCase ? caseCard(it.c.id)?.points ?? [it.c.subtitle] : Array.from({ length: it.n.points }, (_, i) => t(key(it.n.id, `p${i + 1}`)));
      for (const text of texts) {
        const p = document.createElement("p");
        p.textContent = text;
        points.appendChild(p);
      }
    }
    /* v93: демо и код — ссылками в раскрытом описании; нажатие на саму карточку её раскрывает. У кейса — ссылка на его страницу */
    if (links) {
      const html = isCase
        ? `<a href="#/work/${it.c.id}">${t("notes.case.open")}</a>`
        : it.n.links ? `<a href="${it.n.links.demo}" target="_blank" rel="noopener">${t("notes.demo")}</a><a href="${it.n.links.repo}" target="_blank" rel="noopener">${t("notes.repo")}</a>` : "";
      links.hidden = !html;
      links.innerHTML = html;
      links.querySelectorAll("a").forEach((a) => (a.tabIndex = isOpen() ? 0 : -1));
    }
    if (count) count.innerHTML = `<b>${pad(index + 1)}</b>/${pad(items.length)}`;
    deck?.setAttribute("aria-label", t("notes.deck"));
    steps[0]?.setAttribute("aria-label", t("notes.prev"));
    steps[1]?.setAttribute("aria-label", t("notes.next"));
    knob.setAttribute("aria-label", isOpen() ? t("notes.close") : t("notes.open", { title: itemTitle(it) }));
    fit();
  };

  /* Смена страницы: картинка с подписью гаснут, пока меняются текст и картинка, и проявляются обратно.
     Направление подсказывает сдвиг — вперёд уезжает влево, назад вправо. v78: раскрытая карточка остаётся
     раскрытой (так попросил Никита): листают, чтобы читать соседний проект, а не чтобы закрыть описание.
     Высота под новое описание пересчитывается в paint → fit, пока карточка погашена. */
  const go = (step: number) => {
    const next = (index + step + items.length) % items.length;
    if (next === index) return;
    const wasOpen = isOpen();
    cue("progress-step", 0.6);
    card.style.setProperty("--swap-dir", String(Math.sign(step)));
    card.classList.add("is-swapping");
    clearTimeout(swapTimer);
    swapTimer = window.setTimeout(() => {
      index = next;
      paint();
      if (wasOpen) set(true);
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

  /* соседние картинки грузим заранее, в простое, — переключение не ждёт сети. v103: только когда интерфейс вошёл
     (is-ready): первый простой случался посреди загрузки, и ~0,5 МБ картинок делили канал с моделями и шейдерами */
  const idle = (window as Window & { requestIdleCallback?: (cb: () => void) => number }).requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 1500));
  let prefetched = false;
  onBodyState(() => {
    if (prefetched || !bodyHas("is-ready")) return;
    prefetched = true;
    idle(() => items.slice(1).forEach((it) => { const pre = new Image(); pre.src = `${BASE}${itemImage(it)}`; }));
  });

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
  /* когда палец отпущен после листания — click всё равно придёт; по этой отметке его и отличаем от нажатия */
  let swipedAt = 0;
  card.addEventListener("pointerup", (e) => {
    if (!tracking) return;
    const dx = e.clientX - startX, dy = e.clientY - startY;
    if (dragging) swipedAt = performance.now();
    drop();
    if (Math.abs(dx) > 44 && Math.abs(dx) > Math.abs(dy) * 1.4) go(dx < 0 ? 1 : -1);
  });
  card.addEventListener("pointercancel", drop);

  /* v93: главное действие карточки — раскрыть описание (просьба Никиты): нажатие на шапку делает то же, что шеврон.
     Свайп при этом не ломается: если палец проехал вбок, это было листание. Листалку и шеврон пропускаем —
     у них своё дело. Демо и код открываются ссылками внутри описания */
  const hero = card.querySelector<HTMLElement>(".note-hero");
  hero?.addEventListener("click", (e) => {
    if (dragging || performance.now() - swipedAt < 400) return;
    if ((e.target as Element).closest("a, button")) return;
    set(!isOpen());
  });

  addEventListener("keydown", (e) => { if (e.key === "Escape") set(false); });
  addEventListener("click", (e) => { if (!card.contains(e.target as Node)) set(false); });
  video?.addEventListener("playing", () => { if (video.dataset.note === itemId(items[index])) card.classList.add("is-playing"); });
  new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; syncVideo(); }).observe(card);
  document.addEventListener("visibilitychange", syncVideo);
  onBodyState(syncVideo);
  let scrollRaf = 0;
  addEventListener("scroll", () => { if (!scrollRaf) scrollRaf = requestAnimationFrame(() => { scrollRaf = 0; syncVideo(); }); }, { passive: true });

  addEventListener("resize", fit);
  narrow.addEventListener("change", fit);
  /* шрифт приехал позже текста — высота описания другая */
  document.fonts?.ready.then(fit).catch(() => {});
  onLang(paint);
  paint();
}
