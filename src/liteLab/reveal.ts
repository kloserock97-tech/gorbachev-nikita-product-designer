/* v114: появление при прокрутке — заголовки разделов поднимаются из-под маски (.ll-rise), плитки кейсов и строки
   пэт-проектов приходят по очереди (.ll-in, задержка --d по месту в ряду). Карточки опыта не трогаем: у них свой
   подъём на наведении. Приём с портфолио klinaeva, код свой.
   Без JS и при «меньше движения» всё видно сразу: прячет только класс is-armed на <html>. */
const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
const io = calm ? null : new IntersectionObserver((es) => es.forEach((e) => {
  if (!e.isIntersecting) return;
  e.target.classList.add("is-in");
  io!.unobserve(e.target);
}), { rootMargin: "0px 0px -12% 0px" });

if (io) document.documentElement.classList.add("is-armed");

/** следить за новыми элементами: после каждой перерисовки списков */
export function watchReveal() {
  if (!io) return;
  document.querySelectorAll<HTMLElement>(".ll-rise:not(.is-in)").forEach((el) => io.observe(el));
  document.querySelectorAll<HTMLElement>("[data-cases], [data-notes]").forEach((list) => {
    const cols = list.matches("[data-cases]") ? 2 : 1;
    [...list.children].forEach((li, i) => {
      li.classList.add("ll-in");
      (li as HTMLElement).style.setProperty("--d", `${(i % cols) * 90}ms`);
      io.observe(li);
    });
  });
}
