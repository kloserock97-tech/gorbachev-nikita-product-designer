/* v65: переключатель вариантов главы «Кейсы». Виден только когда в адресе есть ?cases=… — это инструмент сравнения,
   а не часть сайта. Вариант — это параметр адреса, поэтому переключение перезагружает страницу; чтобы после
   перезагрузки не искать главу заново, перед переходом ставится пометка, и новая страница сама доезжает до кейсов. */
import { getLang } from "../i18n";
import "./cases-review.css";

const JUMP = "cases-review-jump";
const VARIANTS: [string, string, string][] = [
  /* v70: основной вид — дуга с названиями справа и карточка кейса слева; «Предмет» — та же дуга, но слева вырезанный 3D-предмет */
  ["card", "Карточка", "Card"],
  ["wheel", "Предмет", "3D object"],
  ["wheel2d", "Предмет без WebGL", "Object, no WebGL"],
  ["ribbon", "Лента", "Ribbon"],
  ["deck", "Стопка", "Deck"],
];

/** была ли пометка «доехать до кейсов»; читается один раз */
export function consumeReviewJump() {
  try {
    const v = sessionStorage.getItem(JUMP) === "1";
    sessionStorage.removeItem(JUMP);
    return v;
  } catch {
    return false;
  }
}

export function mountReviewBar(current: string | null) {
  if (current === null || document.querySelector(".cases-review")) return;
  const ru = getLang() === "ru";
  const bar = document.createElement("nav");
  bar.className = "cases-review";
  bar.setAttribute("aria-label", ru ? "Варианты главы «Кейсы»" : "Variants of the Work chapter");
  const known = current === "wheel3d" ? "wheel" : VARIANTS.some(([id]) => id === current) ? current : "card";
  bar.innerHTML = `<span class="cases-review__l">${ru ? "Вариант" : "Variant"}</span>` + VARIANTS.map(([id, r, e]) => {
    const url = new URL(location.href);
    url.searchParams.set("cases", id);
    url.hash = "";
    return `<a href="${url.pathname}${url.search}" data-v="${id}"${id === known ? ' aria-current="true"' : ""}>${ru ? r : e}</a>`;
  }).join("");
  bar.addEventListener("click", (e) => {
    if ((e.target as HTMLElement).closest("a")) { try { sessionStorage.setItem(JUMP, "1"); } catch { /* приватный режим */ } }
  });
  document.body.appendChild(bar);
  document.body.classList.add("has-review");
}
