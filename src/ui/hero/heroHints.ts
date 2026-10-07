/* v94: подсказки первого экрана — что погоду можно сменить, что ветер можно позвать, что компьютер открывается.
   Тихо по умолчанию: в покое видны только тонкое кольцо ветра и маленькая точка на мониторе. Подсказки проявляются,
   когда мышь подходит к своему месту (класс is-near): у погоды — стеклянная плашка и «Сменить →» на месте подписи,
   у кольца — «Ветер», у монитора — линия и «Заглянуть внутрь →». Без мыши (телефон) они видны сразу, приглушённо.
   Точка монитора стоит по проекции угла экрана из сцены (HillScene.pcClientPoint) и пишется только когда сдвинулась.
   Стили — hero-hints.css. Выбрано Никитой из двух вариантов на стенде 07.10.2026. */
import "./hero-hints.css";
import { bodyHas } from "../../lib/bodyState";

type Scene = { pcClientPoint(): { x: number; y: number } | null };

export function initHeroHints(scene: Scene, openPc: () => void) {
  const body = document.body;
  const pc = document.querySelector<HTMLElement>(".pc-hint");
  const weather = document.querySelector<HTMLElement>(".stat--b");
  const wind = document.querySelector<HTMLElement>(".wind");

  const fine = matchMedia("(hover: hover) and (pointer: fine)");
  const touch = () => body.classList.toggle("hint-touch", !fine.matches);
  touch();
  fine.addEventListener("change", touch);

  /* ── точка на мониторе ── */
  if (pc) {
    pc.addEventListener("click", (e) => { e.stopPropagation(); openPc(); });
    let last = "";
    const frame = () => {
      requestAnimationFrame(frame);
      const away = document.hidden || !bodyHas("is-ready") || bodyHas("story-away") || bodyHas("story-active") || bodyHas("pc-focus") || bodyHas("case-open") || bodyHas("lite");
      const p = away ? null : scene.pcClientPoint();
      const key = p ? `${p.x.toFixed(1)},${p.y.toFixed(1)}` : "";
      if (key === last) return;
      last = key;
      pc.classList.toggle("is-off", !p);
      if (p) pc.style.transform = `translate(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px)`;
    };
    requestAnimationFrame(frame);
  }

  /* ── близость курсора: у каждой подсказки свой радиус; выход чуть дальше входа, чтобы на границе не мигало ── */
  const targets: [HTMLElement, number][] = [];
  if (weather) targets.push([weather, 130]);
  if (wind) targets.push([wind, 150]);
  if (pc) targets.push([pc, 230]);
  addEventListener("pointermove", (e) => {
    if (e.pointerType === "touch") return;
    for (const [el, reach] of targets) {
      const r = el.getBoundingClientRect();
      const dx = Math.max(r.left - e.clientX, 0, e.clientX - r.right);
      const dy = Math.max(r.top - e.clientY, 0, e.clientY - r.bottom);
      const d = Math.hypot(dx, dy);
      el.classList.toggle("is-near", el.classList.contains("is-near") ? d < reach * 1.15 : d < reach);
    }
  }, { passive: true });
}
