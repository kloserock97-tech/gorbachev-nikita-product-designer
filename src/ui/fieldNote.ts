/* Заметки на первом экране (v28).
   Раньше здесь была одна карточка «How the hill was grown»: кнопка-стрелка раскрывала оборот с короткой
   технической историей травы. Теперь это стопка из трёх страниц — холм и два своих графических проекта
   Никиты (Driftfield, Nightsail), — но на экране по-прежнему одна карточка: первый экран и так плотный,
   ещё две рядом его бы задавили. Переключатель «‹ 01/03 ›» в углу, свайп пальцем по карточке, стрелки
   на клавиатуре, пока фокус внутри.

   У каждой страницы тот же жест, что был: стрелка раскрывает оборот кругом из угла кнопки. У проектов
   на обороте, кроме трёх пунктов, — ссылки на живое демо с панелью настроек и на код. Esc и клик мимо
   закрывают оборот; переключение страницы тоже его закрывает.

   v29: у проектов вместо картинки — зацикленное превью из самой демки (webm/mp4, 5,8 с, сотни килобайт).
   Пока ролик не пошёл, видна картинка-постер — первый кадр того же ролика, поэтому смена незаметна.
   Играет, только когда карточка на экране, вкладка открыта и оборот закрыт; при «меньше движения»
   и экономии трафика остаётся постер. */
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
  if (!card || !knob || !note) return;

  const labels = [...card.querySelectorAll<HTMLElement>("[data-note-label]")];
  const titles = [...card.querySelectorAll<HTMLElement>("[data-note-title]")];
  const img = card.querySelector<HTMLImageElement>("[data-note-img]");
  const video = card.querySelector<HTMLVideoElement>("[data-note-video]");
  const calm = matchMedia("(prefers-reduced-motion: reduce)").matches
    || !!(navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
  const points = card.querySelector<HTMLElement>("[data-note-points]");
  const links = card.querySelector<HTMLElement>("[data-note-links]");
  const deck = card.querySelector<HTMLElement>(".note-deck");
  const count = card.querySelector<HTMLElement>(".note-deck__count");
  const steps = [...card.querySelectorAll<HTMLButtonElement>(".note-deck__btn")];

  let index = 0;
  let swapTimer = 0;
  let fitOpenRef: () => void = () => {};
  let inView = true;
  const isOpen = () => card.classList.contains("is-open");

  /* превью играет, только когда его действительно видно: карточка в кадре, вкладка активна, интерфейс
     холма не уехал в скролл-историю и оборот не закрывает картинку */
  const syncVideo = () => {
    if (!video?.dataset.note) return;
    const want = inView && !document.hidden && !isOpen() && !document.body.classList.contains("story-away");
    if (want && video.paused) void video.play().catch(() => {});
    else if (!want && !video.paused) video.pause();
  };

  const set = (open: boolean) => {
    if (open && !isOpen()) fitOpenRef();
    if (open !== isOpen()) cue(open ? "expand" : "collapse");
    card.classList.toggle("is-open", open);
    knob.setAttribute("aria-expanded", String(open));
    knob.setAttribute("aria-label", open ? t("notes.close") : t("notes.open", { title: t(key(notes[index].id, "title")) }));
    note.setAttribute("aria-hidden", String(!open));
    syncVideo();
    /* ссылки на обороте доступны с клавиатуры только когда оборот открыт */
    links?.querySelectorAll("a").forEach((a) => (a.tabIndex = open ? 0 : -1));
  };

  /* Тексты — из словаря текущего языка, картинка — из данных. Раскладка карточки не меняется,
     поэтому ничего не мерится и не прыгает. */
  const paint = () => {
    const current = notes[index];
    const id = current.id;
    card.dataset.note = id;
    /* v46: на лицевой стороне номер из подписи убран — его уже показывает листалка «01/04», а подпись с номером
       не помещалась в одну строку с ней и залезала под кнопки. На обороте места хватает, там подпись полная */
    const full = t(key(id, "label"));
    labels.forEach((el) => (el.textContent = el.parentElement === card ? full.replace(/ +[0-9]+$/, "") : full));
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
    if (points) {
      points.innerHTML = "";
      for (let i = 1; i <= current.points; i++) {
        const li = document.createElement("li");
        li.textContent = t(key(id, `p${i}`));
        points.appendChild(li);
      }
    }
    if (links) {
      links.hidden = !current.links;
      links.innerHTML = current.links
        ? `<a href="${current.links.demo}" target="_blank" rel="noopener">${t("notes.demo")}</a><a href="${current.links.repo}" target="_blank" rel="noopener">${t("notes.repo")}</a>`
        : "";
      links.querySelectorAll("a").forEach((a) => (a.tabIndex = isOpen() ? 0 : -1));
    }
    if (count) count.innerHTML = `<b>${pad(index + 1)}</b>/${pad(notes.length)}`;
    deck?.setAttribute("aria-label", t("notes.deck"));
    steps[0]?.setAttribute("aria-label", t("notes.prev"));
    steps[1]?.setAttribute("aria-label", t("notes.next"));
    knob.setAttribute("aria-label", isOpen() ? t("notes.close") : t("notes.open", { title: t(key(id, "title")) }));
  };

  /* Смена страницы: лицевая сторона гаснет, пока меняются текст и картинка, и проявляется обратно.
     Направление подсказывает сдвиг — вперёд уезжает влево, назад вправо. */
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
     горизонталь приходит сюда. Раньше браузер забирал жест себе (pointercancel), и свайп срабатывал через раз.
     Лицевая сторона едет за пальцем (--drag): видно, что карточка листается, ещё до того как палец отпущен. */
  let startX = 0, startY = 0, tracking = false, dragging = false;
  const drop = () => {
    tracking = dragging = false;
    card.classList.remove("is-dragging");
    card.style.removeProperty("--drag");
  };
  card.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "mouse" || isOpen() || (e.target as Element).closest("a, button")) return;
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

  /* Оборот на телефоне раскрывается на всю высоту своего текста (v48). Раньше высота была фиксированной, а лишнее
     прокручивалось внутри карточки с overscroll-behavior: contain — палец застревал в карточке, страница не ехала.
     Вложенная прокрутка на телефоне — известная ловушка; карточка просто растёт, страница прокручивается как обычно. */
  const narrow = matchMedia("(max-width: 900px)");
  let closedH = 0;
  const fitOpen = () => {
    const root = document.documentElement;
    if (!narrow.matches) { root.style.removeProperty("--m-open"); return; }
    /* высота закрытой карточки меряется, только пока она закрыта и не едет; высота текста — всегда */
    if (!isOpen()) closedH = card.offsetHeight;
    if (closedH) root.style.setProperty("--m-open", `${Math.max(0, Math.ceil(note.scrollHeight - closedH))}px`);
  };

  addEventListener("keydown", (e) => { if (e.key === "Escape") set(false); });
  addEventListener("click", (e) => { if (!card.contains(e.target as Node)) set(false); });
  video?.addEventListener("playing", () => { if (video.dataset.note === notes[index].id) card.classList.add("is-playing"); });
  new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; syncVideo(); }).observe(card);
  document.addEventListener("visibilitychange", syncVideo);
  let scrollRaf = 0;
  addEventListener("scroll", () => { if (!scrollRaf) scrollRaf = requestAnimationFrame(() => { scrollRaf = 0; syncVideo(); }); }, { passive: true });

  fitOpenRef = fitOpen;
  addEventListener("resize", () => { if (!isOpen()) fitOpen(); });
  onLang(paint);
  paint();
}
