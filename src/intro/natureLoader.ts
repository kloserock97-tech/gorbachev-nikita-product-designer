import { getLang } from "../i18n";
import { NatureScene } from "./NatureScene";
import "./natureLoader.css";

export type NatureLoader = { progress: (value: number) => void; ready: () => void; dispose: () => void };

/** The garden grows while the real scene prepares, not as a second intro after loading. */
export function createNatureLoader(onDone: () => void, onLite: () => void): NatureLoader {
  const ru = getLang() === "ru";
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const query = new URLSearchParams(location.search);
  const frozenValue = query.has("garden") ? Number(query.get("garden")) : NaN;
  const frozen = Number.isFinite(frozenValue) ? Math.min(1, Math.max(0, frozenValue)) : null;
  const root = document.createElement("section");
  root.className = "nature-loader";
  root.setAttribute("role", "dialog");
  root.setAttribute("aria-modal", "true");
  root.setAttribute("aria-labelledby", "garden-title");
  root.innerHTML = `
    <header class="nature-loader__top">
      <div class="nature-loader__identity"><b>NIKITA GORBACHEV</b><span>PRODUCT DESIGNER</span></div>
      <span class="nature-loader__edition">${ru ? "ЦИФРОВАЯ ПРИРОДА" : "DIGITAL NATURE"} · 01</span>
    </header>
    <div class="nature-loader__stage" aria-hidden="true"><canvas></canvas></div>
    <div class="nature-loader__bottom">
      <h1 class="nature-loader__title" id="garden-title">${ru ? "Всё начинается с малого." : "Every idea starts small."}</h1>
      <div class="nature-loader__line"><span class="nature-loader__status" role="status" aria-live="polite"></span><span aria-hidden="true">01 — 03</span></div>
      <div class="nature-loader__track" role="progressbar" aria-label="${ru ? "Подготовка портфолио" : "Preparing portfolio"}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><i></i></div>
      <button class="nature-loader__skip" type="button">${ru ? "Пропустить анимацию" : "Skip animation"}</button>
      <button class="nature-loader__fallback" type="button">${ru ? "Открыть лёгкую версию" : "Open lightweight version"}</button>
    </div>`;
  document.body.appendChild(root);
  document.body.classList.add("garden-loading");
  const previousFocus = document.activeElement as HTMLElement | null;
  const inert = [...document.body.children].filter((e): e is HTMLElement => e instanceof HTMLElement && e !== root && !["SCRIPT", "STYLE", "LINK"].includes(e.tagName)).map(e => ({ e, was: e.inert }));
  inert.forEach(({ e }) => { e.inert = true; });
  const button = root.querySelector<HTMLButtonElement>(".nature-loader__skip")!;
  const fallback = root.querySelector<HTMLButtonElement>(".nature-loader__fallback")!;
  const label = root.querySelector<HTMLElement>(".nature-loader__status")!;
  const track = root.querySelector<HTMLElement>(".nature-loader__track")!;
  const stage = root.querySelector<HTMLElement>(".nature-loader__stage")!;
  const canvas = root.querySelector("canvas")!;
  button.focus({ preventScroll: true });
  let view: NatureScene | null = null;
  let target = .04, growth = 0, elapsed = 0, last = performance.now(), lastDraw = 0;
  let ready = false, skipped = false, leaving = false, disposed = false, raf = 0, exitTimer = 0;
  let statusIndex = -1, completedAt = -1, renderedGrowth = -1;
  const resize = () => { const { width, height } = stage.getBoundingClientRect(); view?.resize(width, height); };
  const buildStart = performance.now();
  try { view = new NatureScene(canvas, reduced); resize(); root.dataset.buildMs = (performance.now() - buildStart).toFixed(0); root.dataset.build = JSON.stringify(view.timings); }
  catch (error) { console.warn("Garden renderer unavailable; using static loader", error); }
  const observer = new ResizeObserver(resize); observer.observe(stage);
  canvas.addEventListener("webglcontextlost", () => {
    if (disposed) return;
    view?.dispose(); view = null; stage.classList.remove("has-render");
  });
  const slowTimer = window.setTimeout(() => root.classList.add("is-slow"), 10000);
  const dispose = () => {
    if (disposed) return; disposed = true;
    cancelAnimationFrame(raf); clearTimeout(slowTimer); clearTimeout(exitTimer); observer.disconnect();
    view?.dispose(); view = null;
    inert.forEach(({ e, was }) => { e.inert = was; });
    root.remove(); document.body.classList.remove("garden-loading");
    if (previousFocus?.isConnected && previousFocus !== document.body) previousFocus.focus({ preventScroll: true });
  };
  const finish = () => {
    if (leaving || disposed || frozen !== null) return;
    leaving = true; root.classList.add("is-leaving");
    // Reveal the underlying scene while opacity fades. No extra fixed-duration intro.
    onDone();
    exitTimer = window.setTimeout(dispose, reduced ? 0 : 680);
  };
  const skip = () => {
    if (skipped) return;
    skipped = true; button.setAttribute("aria-disabled", "true");
    button.textContent = ru ? "Открываю портфолио…" : "Opening portfolio…";
  };
  button.addEventListener("click", skip);
  fallback.addEventListener("click", () => { dispose(); onLite(); });
  /* the slab leans a little towards the cursor; a finger on a phone does not steer it */
  root.addEventListener("pointermove", e => {
    if (e.pointerType !== "mouse" || reduced) return;
    view?.setPointer(e.clientX / innerWidth * 2 - 1, e.clientY / innerHeight * 2 - 1);
  });
  root.addEventListener("pointerdown", e => e.stopPropagation());
  root.addEventListener("click", e => e.stopPropagation());
  root.addEventListener("keydown", e => {
    if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); skip(); }
    if (e.key === "Tab") {
      const buttons = [button, ...(root.classList.contains("is-slow") ? [fallback] : [])].filter(b => !b.disabled);
      if (!buttons.length) { e.preventDefault(); return; }
      const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
      e.preventDefault(); buttons[(index + (e.shiftKey ? -1 : 1) + buttons.length) % buttons.length].focus();
    }
  });
  const frame = (now: number) => {
    if (disposed) return;
    raf = requestAnimationFrame(frame);
    const dt = Math.min(.05, (now - last) / 1000); last = now;
    if (document.hidden) return;
    elapsed += dt;
    // Loading phases gate growth; elapsed time is only choreography, never a fake byte count.
    const desired = frozen ?? (reduced || skipped ? target : Math.min(target, elapsed / 4.3));
    growth += (desired - growth) * (1 - Math.exp(-dt * 4.5));
    if (frozen !== null) growth = frozen;
    else if (reduced || skipped || (ready && desired === 1 && growth > .995)) growth = desired;
    root.dataset.growth = growth.toFixed(3);
    if (now - lastDraw >= (reduced ? 220 : 1000 / 60) || (growth === 1 && renderedGrowth !== 1)) {
      view?.render(growth, elapsed);
      if (view?.isReady) { stage.classList.add("has-render"); renderedGrowth = growth; }
      lastDraw = now;
    }
    // 100 means both a ready portfolio AND a rendered, fully overgrown solid: no ice, no bare glass, walls included.
    const complete = ready && growth === 1 && (!view || renderedGrowth === 1);
    const progress = complete ? 1 : Math.min(.99, growth, target);
    root.style.setProperty("--garden-progress", String(progress));
    track.setAttribute("aria-valuenow", String(Math.floor(progress * 100)));
    if (complete && completedAt < 0) completedAt = elapsed;
    const index = complete ? 3 : progress < .36 ? 0 : progress < .72 ? 1 : 2;
    if (index !== statusIndex) {
      statusIndex = index;
      label.textContent = (ru ? ["Подготавливаю свет и материалы", "Собираю пространство", "Последние детали", "Можно исследовать"] : ["Preparing light and materials", "Building the scene", "Finishing touches", "Ready to explore"])[index];
    }
    // Let the completed edge-to-edge garden read before the dissolve begins.
    if (complete && (reduced || skipped || elapsed - completedAt >= .32)) finish();
  };
  raf = requestAnimationFrame(frame);
  return {
    progress(value) {
      target = Math.max(target, Math.min(.94, value));
    },
    ready() {
      if (disposed) return;
      ready = true; target = 1;
    },
    dispose,
  };
}
