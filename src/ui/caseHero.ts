/* v64: герой страницы кейса — сцена в цвет кейса, на ней настоящий экран продукта в устройстве и предмет кейса.
   Приём взят у Apple (docs/prompts/v64-research-apple.md): устройство крупное и срезано краем сцены, рядом ничего
   лишнего. От себя — лёгкий разворот устройства в перспективе: он выпрямляется, пока героя прокручивают (--hs пишет
   caseStoryView.ts), а предмет и устройство чуть расходятся за курсором (--px, --py). Получается «камера» без WebGL.
   Раньше здесь были шесть нарисованных в CSS сценок со своими словами и палитрами (v40): они спорили друг с другом
   и с экранами ниже. Теперь вид один на все кейсы, меняются только экран, предмет и цвет. */
import type { CaseItem } from "../data/cases";
import { objectPicture } from "./caseLook";
import "./caseHero.css";

const BASE = import.meta.env.BASE_URL;
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function heroStage(card: CaseItem, label: string) {
  const s = card.look.screen;
  const kind = s ? s.device : "solo";
  const device = s
    ? `<div class="ch-device">${s.device === "browser" ? `<div class="ch-bar" aria-hidden="true"><i></i><i></i><i></i></div>` : ""}<img class="ch-screen" src="${BASE}${s.src}" width="${s.w}" height="${s.h}" alt="${esc(label)}" decoding="async" fetchpriority="high" draggable="false"></div>`
    : "";
  return `<figure class="ch ch--${kind}">${device}${objectPicture(card, "ch-obj", true)}</figure>`;
}

/** курсор разводит слои героя; вне экрана и при скрытой вкладке парение предмета стоит */
export function mountHero(root: HTMLElement, scroller: HTMLElement) {
  const figures = [...root.querySelectorAll<HTMLElement>(".ch")];
  const media = matchMedia("(prefers-reduced-motion: reduce)");
  const sync = () => figures.forEach((el) => el.classList.toggle("is-paused", media.matches || document.hidden || el.dataset.visible !== "true"));
  const io = new IntersectionObserver((entries) => { entries.forEach((e) => ((e.target as HTMLElement).dataset.visible = String(e.isIntersecting))); sync(); }, { root: scroller });
  figures.forEach((el) => io.observe(el));
  const stage = root.querySelector<HTMLElement>(".cs-hero-stage");
  const move = (e: PointerEvent) => {
    if (e.pointerType !== "mouse" || media.matches || !stage) return;
    const r = stage.getBoundingClientRect();
    stage.style.setProperty("--px", (((e.clientX - r.left) / r.width) * 2 - 1).toFixed(3));
    stage.style.setProperty("--py", (((e.clientY - r.top) / r.height) * 2 - 1).toFixed(3));
  };
  const leave = () => { stage?.style.setProperty("--px", "0"); stage?.style.setProperty("--py", "0"); };
  stage?.addEventListener("pointermove", move);
  stage?.addEventListener("pointerleave", leave);
  document.addEventListener("visibilitychange", sync);
  media.addEventListener("change", sync);
  sync();
  return () => {
    io.disconnect();
    stage?.removeEventListener("pointermove", move);
    stage?.removeEventListener("pointerleave", leave);
    document.removeEventListener("visibilitychange", sync);
    media.removeEventListener("change", sync);
  };
}
