/* v114: круглый курсор «Смотреть» над кейсами (плитки и экраны в ленте итогов) — приём с портфолио klinaeva, код свой.
   Кружок цвета кейса (data-tone) догоняет указатель с запаздыванием; обычный курсор над такими местами скрыт.
   Только мышь или тачпад: на касании и при «меньше движения» кружка нет, остаются обычные ссылки. */
export function mountCursor(label: () => string) {
  if (!matchMedia("(hover: hover) and (pointer: fine)").matches || matchMedia("(prefers-reduced-motion: reduce)").matches) return () => {};
  const dot = document.createElement("div");
  dot.className = "ll-cursor";
  dot.setAttribute("aria-hidden", "true");
  dot.innerHTML = "<span></span>";
  const text = dot.firstElementChild as HTMLElement;
  document.body.append(dot);
  document.documentElement.classList.add("has-ll-cursor");

  let x = 0, y = 0, cx = 0, cy = 0, raf = 0, on = false;
  const tick = () => {
    cx += (x - cx) * 0.22;
    cy += (y - cy) * 0.22;
    dot.style.translate = `${cx}px ${cy}px`;
    raf = on || Math.abs(x - cx) + Math.abs(y - cy) > 0.5 ? requestAnimationFrame(tick) : 0;
  };
  addEventListener("pointermove", (e) => {
    x = e.clientX; y = e.clientY;
    const hit = (e.target as Element | null)?.closest?.<HTMLElement>("[data-cursor]");
    if (!!hit !== on) {
      on = !!hit;
      if (on && !dot.classList.contains("is-on")) { cx = x; cy = y; }
      dot.classList.toggle("is-on", on);
    }
    if (hit) dot.style.setProperty("--tone", hit.dataset.tone ?? "#141512");
    if (!raf) raf = requestAnimationFrame(tick);
  }, { passive: true });
  document.addEventListener("pointerleave", () => { on = false; dot.classList.remove("is-on"); });

  const refresh = () => { text.textContent = label(); };
  refresh();
  return refresh;
}
