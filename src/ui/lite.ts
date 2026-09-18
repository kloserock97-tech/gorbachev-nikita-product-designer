/* Лёгкая версия без 3D (v24, нагрузочный прогон docs/prompts/v24.md).
   Кому: браузер без WebGL2 (корпоративные ноутбуки и VDI с выключенным ускорением), программный рендер
   (SwiftShader, llvmpipe — там холм шёл 0,2 кадра в секунду), устройства, где сцена не укладывается даже
   в нижнюю ступень качества, и потеря WebGL-контекста без восстановления.
   Что видит человек: та же страница обычной прокруткой — первый экран на постере холма, About, сетка
   кейсов, футер с контактами; внизу тихая плашка «Lite version» со ссылкой «Try 3D anyway».
   v27: плашка и подписи переключаются вместе с языком страницы. */
import { onLang, t, type Key } from "../i18n";

const KEY = "hill-lite";
const TTL = 14 * 24 * 3600 * 1000;

/** причина открыть лёгкую версию сразу, или null — пробуем 3D */
export function liteReason(params: URLSearchParams): string | null {
  const q = params.get("lite");
  if (q === "1") return "param";
  if (q === "0") {
    try { localStorage.removeItem(KEY); } catch { /* приватный режим */ }
    return null;
  }
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? "null") as { at: number } | null;
    if (saved && Date.now() - saved.at < TTL) return "saved";
  } catch { /* ничего */ }
  /* failIfMajorPerformanceCaveat: браузер не отдаёт контекст, если рисовать будет процессор */
  const probe = document.createElement("canvas");
  const gl = probe.getContext("webgl2", { failIfMajorPerformanceCaveat: true });
  if (!gl) {
    const any = document.createElement("canvas").getContext("webgl2");
    if (!any) return "webgl";
    any.getExtension("WEBGL_lose_context")?.loseContext();
    return "software";
  }
  const info = gl.getExtension("WEBGL_debug_renderer_info");
  const renderer = info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : "";
  gl.getExtension("WEBGL_lose_context")?.loseContext();
  if (/swiftshader|llvmpipe|softpipe|software|basic render/i.test(renderer)) return "software";
  return null;
}

export function rememberLite() {
  try { localStorage.setItem(KEY, JSON.stringify({ at: Date.now() })); } catch { /* ничего */ }
}

const WHY = ["webgl", "software", "slow", "saved", "context", "stall", "error", "param"] as const;
const note = (reason: string) => (WHY.includes(reason as (typeof WHY)[number]) ? t(`lite.why.${reason}` as Key) : "");

export function enterLite(reason: string) {
  const body = document.body;
  if (body.classList.contains("lite")) return;
  body.classList.add("lite", "scene-ready");
  body.classList.remove("story-active", "story-away", "story-on", "story-settled", "pc-focus", "pc-hover");
  document.documentElement.dataset.lite = reason;

  /* всё, что в 3D-версии прячет и показывает скролл-история, — видимо и доступно */
  for (const el of document.querySelectorAll<HTMLElement>(".story-hero, .cases, .shelf, .site-footer")) {
    el.setAttribute("aria-hidden", "false");
    el.style.removeProperty("visibility");
    el.style.removeProperty("--lift");
    el.querySelectorAll<HTMLElement>("a, button, [tabindex]").forEach((a) => (a.tabIndex = 0));
  }
  document.querySelector<HTMLElement>(".story-hi")?.style.removeProperty("opacity");
  document.querySelector<HTMLElement>(".story-intro")?.style.setProperty("--r", "1");
  document.querySelectorAll<HTMLElement>(".case").forEach((c) => { c.style.transform = ""; c.style.opacity = ""; });
  /* в DOM футер стоит раньше ленты (в 3D они наложены) — в обычной прокрутке кейсы идут перед контактами */
  const cases = document.querySelector(".cases"), footer = document.querySelector(".site-footer");
  if (cases && footer && footer.compareDocumentPosition(cases) & Node.DOCUMENT_POSITION_FOLLOWING) footer.before(cases);
  /* v32: заметки — после кейсов, перед контактами; ролики в сетке не нужны — остаются постеры */
  const shelf = document.querySelector<HTMLElement>(".shelf");
  if (shelf && footer) footer.before(shelf);
  shelf?.querySelectorAll("video").forEach((v) => v.remove());
  shelf?.querySelectorAll<HTMLElement>(".shelf-card").forEach((c) => { c.style.transform = ""; c.style.opacity = ""; });
  /* в лёгкой версии компьютера нет — лид обещает кейсы, а не рассказ компьютера */
  const lede = document.querySelector<HTMLElement>(".lede");
  const liteLink = document.querySelector<HTMLAnchorElement>(".sf-lite");
  if (liteLink) liteLink.href = "?lite=0";
  const swap = () => {
    if (lede) lede.textContent = t("hero.lede.lite");
    if (liteLink) liteLink.textContent = t("footer.nav.3d");
  };
  swap();
  onLang(swap);
  const stage = document.getElementById("stage");
  stage?.style.removeProperty("--so");
  scrollTo(0, 0);

  const bar = document.createElement("p");
  bar.className = "lite-bar";
  bar.setAttribute("role", "status");
  const fill = () => {
    const why = note(reason);
    bar.innerHTML = `<span>${t("lite.bar")}${why ? ` · ${why}` : ""}</span> <a href="?lite=0">${t("lite.try")}</a>`;
  };
  fill();
  onLang(fill);
  body.appendChild(bar);
}
