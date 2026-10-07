/* v93: переход из сайта в кейс — три варианта на выбор Никиты, без «картинки в полёте».
   v92 перекидывал в шапку кейса старую картинку-диораму: в главе стоит живая 3D-сцена, в шапке — мокап, и между
   ними на полсекунды появлялась третья, чужая обоим картинка. Теперь двигается только то, что уже на экране.

   Общее для всех: сцена расступается (список влево, факты вниз, название гаснет — body.cv-leaving), закрытие —
   обратный ход в ту же точку. Источник — центр карточки (или точка клика), его запоминает noteSource.

   Варианты (?cvx=dive|ink|tiles, выбор запоминается в браузере):
   - dive  — «нырок»: сцена приближается к карточке и уходит в размытие, кейс проявляется из того же центра,
             из лёгкого увеличения в резкость. По умолчанию.
   - ink   — «чернила»: светлая страница растекается из карточки неровным живым краем (шейдер на шуме fbm).
   - tiles — «плитки»: экран закрывается светлыми квадратами волной от карточки, из них собирается страница
             (приём Codrops «Pixel Transition»).
   При «уменьшить движение» — прежнее мягкое проявление. */

type Variant = "dive" | "ink" | "tiles";
const VARIANTS: Variant[] = ["dive", "ink", "tiles"];
const KEY = "cvx";
const PAPER: [number, number, number] = [0.961, 0.961, 0.969]; // #f5f5f7 — бумага страницы кейса

const variant = (): Variant => {
  const q = new URLSearchParams(location.search).get(KEY) as Variant | null;
  try {
    if (q && VARIANTS.includes(q)) { localStorage.setItem(KEY, q); return q; }
    const saved = localStorage.getItem(KEY) as Variant | null;
    if (saved && VARIANTS.includes(saved)) return saved;
  } catch { /* приватный режим */ }
  return "dive";
};

type Source = { x: number; y: number; id: string; at: number };
let source: Source | null = null;
/** как и откуда раскрывался открытый кейс — так же он и закроется */
let opened: { v: Variant; x: number; y: number } | null = null;
let overlay: HTMLElement | null = null;

const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
const fine = () => matchMedia("(hover: hover) and (pointer: fine)").matches;
const visible = (r: DOMRect) => r.width > 8 && r.height > 8 && r.bottom > 0 && r.top < innerHeight;
/** слои сцены, которые «ныряют»: холм с доком и глава «Кейсы» */
const layers = () => [...document.querySelectorAll<HTMLElement>("main.hero, section.cases")];

/* переходы списка, фактов и названия включены только на время хода: в остальное время у главы свои анимации */
let animTimer = 0;
const animate = (ms: number) => {
  document.body.classList.add("cv-anim");
  clearTimeout(animTimer);
  animTimer = window.setTimeout(() => document.body.classList.remove("cv-anim"), ms);
};

/** запомнить, откуда кликнули: зовётся из общего обработчика ссылок #/work/<id> (caseView.ts) */
export function noteSource(a: HTMLAnchorElement, e: MouseEvent) {
  const id = a.getAttribute("href")!.replace(/^#\/work\//, "").split("/")[0];
  let el: Element | null = null;
  if (a.closest(".cx")) el = document.querySelector(".cx-card.is-cur") ?? a; // глава: центр текущей карточки
  else if (a.closest(".work-menu")) el = a.querySelector(".work-menu__thumb");
  const r = el?.getBoundingClientRect();
  const ar = a.getBoundingClientRect();
  const ok = r && visible(r);
  /* клавиатура даёт клик без координат — тогда центр ссылки */
  const x = ok ? r.left + r.width / 2 : e.clientX || ar.left + ar.width / 2;
  const y = ok ? r.top + r.height / 2 : e.clientY || ar.top + ar.height / 2;
  source = { x, y, id, at: performance.now() };
}

/* ───────────── dive: нырок в карточку ───────────── */
const DIVE_IN = 760, DIVE_OUT = 560;
const EASE_IN = "cubic-bezier(0.65, 0, 0.25, 1)";
function diveIn(root: HTMLElement, x: number, y: number) {
  const blur = fine() ? 14 : 0; // размытие во весь экран телефону дорого — там только приближение
  for (const el of layers()) {
    el.style.transformOrigin = `${x}px ${y}px`;
    el.animate(
      [{ transform: "scale(1)", filter: "blur(0px)" }, { transform: "scale(1.45)", filter: `blur(${blur}px)` }],
      { duration: DIVE_IN, easing: EASE_IN, fill: "forwards" },
    );
  }
  root.style.transformOrigin = `${x}px ${y}px`;
  root.animate(
    [
      { opacity: 0, transform: "scale(0.86)", filter: `blur(${blur * 0.7}px)` },
      { opacity: 1, transform: "scale(1)", filter: "blur(0px)" },
    ],
    { duration: DIVE_IN - 140, delay: 160, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)", fill: "backwards" },
  );
}
function diveOut(root: HTMLElement) {
  root.animate(
    [{ opacity: 1, transform: "scale(1)" }, { opacity: 0, transform: "scale(0.9)" }],
    { duration: DIVE_OUT * 0.7, easing: "cubic-bezier(0.4, 0, 1, 1)", fill: "forwards" },
  );
  for (const el of layers()) {
    const blur = fine() ? 14 : 0;
    el.getAnimations().forEach((a) => a.cancel());
    el.animate(
      [{ transform: "scale(1.45)", filter: `blur(${blur}px)` }, { transform: "scale(1)", filter: "blur(0px)" }],
      { duration: DIVE_OUT, delay: 80, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)", fill: "backwards" },
    );
  }
  return DIVE_OUT + 80;
}

/* ───────────── ink: чернила из карточки ───────────── */
const INK_IN = 900, INK_OUT = 700;
const VERT = "attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}";
/* край — дистанция от карточки плюс fbm-шум, который ещё и медленно течёт: пятно растекается, а не растёт кругом */
const FRAG = `precision mediump float;
uniform vec2 uRes;uniform vec2 uO;uniform float uT;uniform vec3 uC;
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.-2.*f);
return mix(mix(h(i),h(i+vec2(1.,0.)),u.x),mix(h(i+vec2(0.,1.)),h(i+vec2(1.,1.)),u.x),u.y);}
float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*n(p);p*=2.03;a*=.5;}return v;}
void main(){
  vec2 q=gl_FragCoord.xy/uRes.y;
  float d=length(gl_FragCoord.xy-uO)/length(uRes);
  float w=fbm(q*3.2+vec2(uT*.7,-uT*.4));
  float edge=uT*1.35-.08;
  float m=smoothstep(edge+.015,edge-.015,d+(w-.5)*.32);
  gl_FragColor=vec4(uC*m,m);
}`;
type Ink = { canvas: HTMLCanvasElement; draw: (t: number) => void; stop: () => void };
function makeInk(x: number, y: number): Ink | null {
  const canvas = document.createElement("canvas");
  canvas.className = "cm-ink";
  const dpr = Math.min(1.5, devicePixelRatio || 1);
  canvas.width = Math.round(innerWidth * dpr);
  canvas.height = Math.round(innerHeight * dpr);
  const gl = canvas.getContext("webgl", { premultipliedAlpha: true, alpha: true, antialias: false });
  if (!gl) return null;
  const sh = (type: number, src: string) => { const s = gl.createShader(type)!; gl.shaderSource(s, src); gl.compileShader(s); return s; };
  const prog = gl.createProgram()!;
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
  gl.useProgram(prog);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, "p");
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  gl.uniform2f(gl.getUniformLocation(prog, "uRes"), canvas.width, canvas.height);
  /* у gl_FragCoord ось y снизу вверх */
  gl.uniform2f(gl.getUniformLocation(prog, "uO"), x * dpr, canvas.height - y * dpr);
  gl.uniform3f(gl.getUniformLocation(prog, "uC"), ...PAPER);
  const uT = gl.getUniformLocation(prog, "uT");
  gl.viewport(0, 0, canvas.width, canvas.height);
  return {
    canvas,
    draw: (t) => { gl.uniform1f(uT, t); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); gl.drawArrays(gl.TRIANGLES, 0, 3); },
    stop: () => { gl.getExtension("WEBGL_lose_context")?.loseContext(); canvas.remove(); },
  };
}
/** заливка легла: страница уже стоит под ней, а сама заливка тает — без пустого кадра и без рывка */
function handOff(root: HTMLElement, layer: HTMLElement, done: () => void) {
  root.style.opacity = "";
  const a = layer.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 220, easing: "ease-out", fill: "forwards" });
  a.onfinish = done;
}
/** обратная передача на закрытии: заливка проявляется поверх страницы, и только потом страница прячется */
const COVER = 160;
function takeOver(root: HTMLElement, layer: HTMLElement, then: () => void) {
  const a = layer.animate([{ opacity: 0 }, { opacity: 1 }], { duration: COVER, easing: "ease-in", fill: "backwards" });
  a.onfinish = () => { root.style.opacity = "0"; then(); };
}
/** прогнать t от a до b за ms; по концу — done */
function run(ms: number, a: number, b: number, draw: (t: number) => void, done: () => void) {
  const t0 = performance.now();
  const ease = (k: number) => (k < 0.5 ? 4 * k * k * k : 1 - (-2 * k + 2) ** 3 / 2);
  const step = (now: number) => {
    const k = Math.min(1, (now - t0) / ms);
    draw(a + (b - a) * ease(k));
    if (k < 1) requestAnimationFrame(step); else done();
  };
  requestAnimationFrame(step);
}
function inkIn(root: HTMLElement, x: number, y: number): boolean {
  const ink = makeInk(x, y);
  if (!ink) return false;
  document.body.appendChild(ink.canvas);
  overlay = ink.canvas;
  root.style.opacity = "0";
  ink.draw(0);
  run(INK_IN, 0, 1, ink.draw, () => handOff(root, ink.canvas, () => { ink.stop(); overlay = null; }));
  return true;
}
function inkOut(root: HTMLElement, x: number, y: number) {
  const ink = makeInk(x, y);
  if (!ink) return null;
  document.body.appendChild(ink.canvas);
  overlay = ink.canvas;
  ink.draw(1);
  takeOver(root, ink.canvas, () => run(INK_OUT, 1, 0, ink.draw, () => { ink.stop(); overlay = null; }));
  return INK_OUT + COVER;
}

/* ───────────── tiles: плитки волной ───────────── */
const TILES_IN = 680, TILES_OUT = 560, WAVE = 0.6; // доля хода на волну задержек
function tilesLayer(x: number, y: number) {
  const size = innerWidth > 900 ? 72 : 52;
  const cols = Math.ceil(innerWidth / size), rows = Math.ceil(innerHeight / size);
  const grid = document.createElement("div");
  grid.className = "cm-tiles";
  grid.style.gridTemplateColumns = `repeat(${cols}, ${size}px)`;
  const cells: { el: HTMLElement; k: number }[] = [];
  let max = 1;
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const el = document.createElement("i");
    const d = Math.hypot(c * size + size / 2 - x, r * size + size / 2 - y);
    max = Math.max(max, d);
    cells.push({ el, k: d });
    grid.appendChild(el);
  }
  cells.forEach((c) => (c.k /= max));
  document.body.appendChild(grid);
  return { grid, cells };
}
function tilesIn(root: HTMLElement, x: number, y: number) {
  const { grid, cells } = tilesLayer(x, y);
  overlay = grid;
  root.style.opacity = "0";
  const one = TILES_IN * (1 - WAVE);
  for (const c of cells) {
    /* 1.08, а не 1: при дробной ширине клетки иначе между плитками светятся швы сцены */
    c.el.animate([{ transform: "scale(0)", borderRadius: "40%" }, { transform: "scale(1.08)", borderRadius: "0%" }],
      { duration: one, delay: c.k * TILES_IN * WAVE, easing: "cubic-bezier(0.3, 0.7, 0.2, 1)", fill: "both" });
  }
  window.setTimeout(() => handOff(root, grid, () => { grid.remove(); overlay = null; }), TILES_IN + 20);
}
function tilesOut(root: HTMLElement, x: number, y: number) {
  const { grid, cells } = tilesLayer(x, y);
  overlay = grid;
  const one = TILES_OUT * (1 - WAVE);
  /* сворачиваются от краёв к карточке; до этого плитки целиком ложатся поверх страницы (takeOver) */
  for (const c of cells) {
    c.el.animate([{ transform: "scale(1.08)", borderRadius: "0%" }, { transform: "scale(0)", borderRadius: "40%" }],
      { duration: one, delay: COVER + (1 - c.k) * TILES_OUT * WAVE, easing: "cubic-bezier(0.5, 0, 0.75, 0)", fill: "both" });
  }
  takeOver(root, grid, () => {});
  window.setTimeout(() => { grid.remove(); if (overlay === grid) overlay = null; }, COVER + TILES_OUT + 40);
  return COVER + TILES_OUT;
}

/* ───────────── вход и выход ───────────── */

/** раскрыть только что отрисованное окно кейса; false — перехода не будет, работает обычное проявление */
export function morphIn(root: HTMLElement, id: string): boolean {
  const s = source;
  source = null;
  if (!s || s.id !== id || performance.now() - s.at > 4000 || reduced() || !("animate" in root)) { opened = null; return false; }
  const v = variant();
  root.classList.add("cv-morph");
  animate(1100);
  document.body.classList.add("cv-leaving");
  if (v === "ink" && !inkIn(root, s.x, s.y)) { tilesIn(root, s.x, s.y); opened = { v: "tiles", x: s.x, y: s.y }; return true; }
  if (v === "dive") diveIn(root, s.x, s.y);
  if (v === "tiles") tilesIn(root, s.x, s.y);
  opened = { v, x: s.x, y: s.y };
  return true;
}

/** закрыть обратным ходом; возвращает, сколько ждать до конца, или null — переход не нужен */
export function morphOut(root: HTMLElement): number | null {
  const o = opened;
  opened = null;
  if (document.body.classList.contains("cv-leaving")) animate(900);
  document.body.classList.remove("cv-leaving");
  if (!o || reduced() || !root.classList.contains("cv-morph")) { morphReset(root); return null; }
  if (o.v === "dive") return diveOut(root);
  if (o.v === "ink") return inkOut(root, o.x, o.y) ?? tilesOut(root, o.x, o.y);
  return tilesOut(root, o.x, o.y);
}

/** окно уже спрятано: снять всё, что осталось от перехода */
export function morphReset(root: HTMLElement) {
  root.getAnimations().forEach((a) => a.cancel());
  root.classList.remove("cv-morph");
  root.style.opacity = "";
  root.style.transformOrigin = "";
  for (const el of layers()) { el.getAnimations().forEach((a) => a.cancel()); el.style.transformOrigin = ""; }
  overlay?.remove();
  overlay = null;
}
