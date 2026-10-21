import "../ui/fonts.css";
import "./focusLoader.css";

export type FocusLoader = {
  progress: (value: number) => void;
  ready: () => void;
  dispose: () => void;
  /** the scene's defocus, 0…1; until bound the loader only drives its own layers */
  bind: (setBlur: (value: number) => void) => void;
};

/** v95, «Расфокус»: the loading screen is the portfolio itself, out of focus. While the hill prepares, the page sits
    behind an opaque veil; once it is ready, the veil melts into the blurred hill and «Enter» shows up. Pressing it
    blurs the title away and brings the hill into focus, and the interface comes in on the way.
    The blur is the scene's own (postfx: params.intro), so the hill is alive behind the title: the grass sways as
    soft light. Before readiness nothing is blurred: quality calibration measures the honest sharp frame under the veil.
    v95.1 (owner): no heavy fog and no breathing focus — the hill is only slightly blurred and tinted green, the tint
    and the blur leave together after «Enter».
    v95.2 (owner): the copy is English in both languages, no footer line, the name in the accent face (Ugol).
    The look is soft focus: the blurred frame is laid over the sharp one by half, so the hill keeps its detail
    under a glow.
    v95.4 (owner): graphite. The hill waits in black and white; «Enter» brings back sharpness and the sunset colour. */
export function createFocusLoader(onDone: () => void, onLite: () => void): FocusLoader {
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const root = document.createElement("section");
  root.className = "focus-loader";
  root.tabIndex = -1;
  root.setAttribute("role", "dialog");
  root.setAttribute("aria-modal", "true");
  root.setAttribute("aria-labelledby", "focus-title");
  root.innerHTML = `
    <div class="focus-loader__veil" aria-hidden="true"></div>
    <div class="focus-loader__vignette" aria-hidden="true"></div>
    <div class="focus-loader__center">
      <p class="focus-loader__kicker">Product designer’s portfolio</p>
      <div class="focus-loader__rule" role="progressbar" aria-label="Preparing portfolio" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><i></i></div>
      <h1 class="focus-loader__title" id="focus-title">Nikita Gorbachev</h1>
      <div class="focus-loader__action">
        <span class="focus-loader__status" role="status" aria-live="polite">Adjusting focus</span>
        <button class="focus-loader__enter" type="button">Enter</button>
      </div>
    </div>
    <button class="focus-loader__fallback" type="button"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16v10H4zM9 20h6M12 16v4"/></svg>Lightweight version, no 3D</button>`;
  document.body.appendChild(root);
  document.body.classList.add("intro-loading");
  document.body.classList.add("focus-loading");
  document.body.classList.add("focus-tint");
  const previousFocus = document.activeElement as HTMLElement | null;
  const inert = [...document.body.children].filter((e): e is HTMLElement => e instanceof HTMLElement && e !== root && !["SCRIPT", "STYLE", "LINK"].includes(e.tagName)).map(e => ({ e, was: e.inert }));
  inert.forEach(({ e }) => { e.inert = true; });
  const enter = root.querySelector<HTMLButtonElement>(".focus-loader__enter")!;
  const fallback = root.querySelector<HTMLButtonElement>(".focus-loader__fallback")!;
  const rule = root.querySelector<HTMLElement>(".focus-loader__rule")!;
  root.focus({ preventScroll: true });

  let setBlur: ((value: number) => void) | null = null;
  let target = .04, shown = 0, last = performance.now();
  let ready = false, entering = false, disposed = false, raf = 0, doneCalled = false;
  /* seconds since the veil started to melt / since «Enter» */
  let revealAt = -1, enterAt = -1, clock = 0;
  const slowTimer = window.setTimeout(() => { if (!ready) root.classList.add("is-slow"); }, 10000);

  const dispose = () => {
    if (disposed) return; disposed = true;
    cancelAnimationFrame(raf); clearTimeout(slowTimer);
    setBlur?.(0);
    inert.forEach(({ e, was }) => { e.inert = was; });
    root.remove(); document.body.classList.remove("intro-loading", "focus-loading", "focus-tint", "focus-entering");
    if (previousFocus?.isConnected && previousFocus !== document.body) previousFocus.focus({ preventScroll: true });
  };
  const done = () => {
    if (doneCalled) return; doneCalled = true;
    /* the interface stops being inert before it fades in, otherwise the first Tab lands nowhere */
    inert.forEach(({ e, was }) => { e.inert = was; });
    document.body.classList.remove("focus-loading");
    onDone();
  };
  const go = () => {
    if (!ready || entering || disposed || revealAt < 0) return;
    entering = true; enterAt = clock;
    root.classList.add("is-entering");
    document.body.classList.add("focus-entering");
    enter.blur();
  };
  enter.addEventListener("click", go);
  fallback.addEventListener("click", () => { dispose(); onLite(); });
  root.addEventListener("keydown", e => {
    if (e.key === "Tab") {
      e.preventDefault();
      /* v104: лёгкая версия доступна всегда — Tab переключает между «Enter» и ней */
      const to = document.activeElement === fallback && root.classList.contains("is-ready") ? enter : fallback;
      to.focus({ preventScroll: true });
    }
  });
  root.addEventListener("pointerdown", e => e.stopPropagation());
  root.addEventListener("click", e => e.stopPropagation());

  /* durations, seconds — from the reference recording: the scene emerges over ~2.5 s, «Explore» joins after ~1 s,
     the hill comes into focus over ~2.3 s after the press */
  const VEIL = reduced ? .3 : 2.4, ENTER_AFTER = reduced ? 0 : .9, FOCUS = reduced ? .35 : 2.3, UI_AT = reduced ? 0 : .5;
  /* how much of the scene defocus the waiting screen uses: a light blur, the hill stays readable */
  const BLUR = .3;
  const easeOut = (x: number) => 1 - (1 - x) ** 3;
  const easeInOut = (x: number) => (x < .5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2);

  let lastProgress = "", lastVeil = "";
  const frame = (now: number) => {
    if (disposed) return;
    raf = requestAnimationFrame(frame);
    const dt = Math.min(.1, (now - last) / 1000); last = now;
    clock += dt;
    /* progress line: real readiness, eased so a jump between phases does not snap */
    shown += (target - shown) * (1 - Math.exp(-dt * 5));
    if (ready && shown > .995) shown = 1;
    /* v103: only when the value moved — the screen waits for Enter with the line full, and the per-frame writes kept
       recalculating the loader's styles */
    const p = shown.toFixed(4);
    if (p !== lastProgress) {
      lastProgress = p;
      root.style.setProperty("--fl-progress", p);
      rule.setAttribute("aria-valuenow", String(Math.floor(shown * 100)));
    }

    if (ready && revealAt < 0 && shown === 1) {
      revealAt = clock;
      root.classList.add("is-revealing");
    }
    let blur = BLUR;
    if (revealAt >= 0) {
      const v = Math.min(1, (clock - revealAt) / VEIL);
      const veil = (1 - easeOut(v)).toFixed(4);
      if (veil !== lastVeil) { lastVeil = veil; root.style.setProperty("--fl-veil", veil); }
      if (clock - revealAt >= ENTER_AFTER && !root.classList.contains("is-ready")) {
        root.classList.add("is-ready");
        enter.focus({ preventScroll: true, focusVisible: false } as FocusOptions);
      }
    }
    if (enterAt >= 0) {
      const f = Math.min(1, (clock - enterAt) / FOCUS);
      blur *= 1 - easeInOut(f);
      if (clock - enterAt >= UI_AT) done();
      if (f >= 1) { done(); setBlur?.(0); dispose(); return; }
    }
    /* sharp under the opaque veil: calibration must see the real frame */
    setBlur?.(revealAt >= 0 ? blur : 0);
  };
  raf = requestAnimationFrame(frame);

  return {
    progress(value) { target = Math.max(target, Math.min(.94, value)); },
    ready() {
      if (disposed) return;
      ready = true; target = 1;
      clearTimeout(slowTimer); root.classList.remove("is-slow");
    },
    dispose,
    bind(fn) { setBlur = fn; },
  };
}
