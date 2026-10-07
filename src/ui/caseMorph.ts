/* Переход из сайта в кейс — «чернила» (v94, выбран Никитой из трёх вариантов v93).
   Светлая бумага страницы кейса медленно растекается из выбранной карточки пятном с живым неровным краем
   (шейдер на fbm-шуме), а сцена под ней в это же время плавно наезжает на карточку и чуть уходит в расфокус —
   будто проникаешь внутрь кейса. Когда бумага закрыла экран, страница уже стоит под ней, и бумага тает.
   Закрытие — обратный ход: бумага ложится поверх страницы, стекает обратно в карточку, сцена отъезжает назад.

   Перед этим глава расступается: список влево, факты вниз, название гаснет (body.cv-leaving, cases-card.css).
   v92 перекидывал в шапку кейса старую картинку-диораму — третью, чужую и сцене, и мокапу; Никите не понравилось,
   поэтому отдельных картинок в полёте нет. При «уменьшить движение» или без WebGL — прежнее мягкое проявление. */

const PAPER: [number, number, number] = [0.961, 0.961, 0.969]; // #f5f5f7 — бумага страницы кейса
/* медленно, по просьбе Никиты: «как будто проникали внутрь кейса» */
const IN_MS = 2200;
const OUT_MS = 1300;
const MELT_MS = 650; // бумага тает над готовой страницей
const MELT_AT = 0.9; // с какой доли разлива начинает таять
const COVER_MS = 240; // на закрытии бумага сначала ложится поверх страницы
const ZOOM = 1.22; // насколько сцена наезжает на карточку

type Source = { x: number; y: number; id: string; at: number };
let source: Source | null = null;
/** откуда раскрывался открытый кейс — туда же он и закроется */
let opened: { x: number; y: number } | null = null;
let overlay: HTMLElement | null = null;

const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
const fine = () => matchMedia("(hover: hover) and (pointer: fine)").matches;
const visible = (r: DOMRect) => r.width > 8 && r.height > 8 && r.bottom > 0 && r.top < innerHeight;
/** слои сцены, которые наезжают на карточку: холм с доком и глава «Кейсы» */
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

/* ───────────── чернила: шейдер ───────────── */
const VERT = "attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}";
/* край — расстояние от карточки плюс fbm-шум, который ещё и медленно течёт: пятно растекается, а не растёт кругом */
const FRAG = `precision mediump float;
uniform vec2 uRes;uniform vec2 uO;uniform float uT;uniform vec3 uC;uniform float uMax;
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.-2.*f);
return mix(mix(h(i),h(i+vec2(1.,0.)),u.x),mix(h(i+vec2(0.,1.)),h(i+vec2(1.,1.)),u.x),u.y);}
float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*n(p);p*=2.03;a*=.5;}return v;}
void main(){
  vec2 q=gl_FragCoord.xy/uRes.y;
  float d=length(gl_FragCoord.xy-uO)/length(uRes);
  float w=fbm(q*3.2+vec2(uT*1.1,-uT*.6));
  float edge=uT*(uMax+.14)-.04;
  float m=smoothstep(edge+.02,edge-.02,d+(w-.5)*.34);
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
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, "p");
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  gl.uniform2f(gl.getUniformLocation(prog, "uRes"), canvas.width, canvas.height);
  /* у gl_FragCoord ось y снизу вверх */
  gl.uniform2f(gl.getUniformLocation(prog, "uO"), x * dpr, canvas.height - y * dpr);
  gl.uniform3f(gl.getUniformLocation(prog, "uC"), ...PAPER);
  /* самый дальний угол экрана от карточки, в долях диагонали: до него пятно и дорастает к концу хода, без пустой паузы */
  const far = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y)) / Math.hypot(innerWidth, innerHeight);
  gl.uniform1f(gl.getUniformLocation(prog, "uMax"), far);
  const uT = gl.getUniformLocation(prog, "uT");
  gl.viewport(0, 0, canvas.width, canvas.height);
  return {
    canvas,
    draw: (t) => { gl.uniform1f(uT, t); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); gl.drawArrays(gl.TRIANGLES, 0, 3); },
    stop: () => { gl.getExtension("WEBGL_lose_context")?.loseContext(); canvas.remove(); },
  };
}

/** прогнать t от a до b за ms (мягкий разгон и мягкая остановка); по концу — done */
function run(ms: number, a: number, b: number, draw: (t: number) => void, done: () => void) {
  const t0 = performance.now();
  const ease = (k: number) => 0.5 - Math.cos(Math.PI * k) / 2;
  const step = (now: number) => {
    const k = Math.min(1, (now - t0) / ms);
    draw(a + (b - a) * ease(k));
    if (k < 1) requestAnimationFrame(step); else done();
  };
  requestAnimationFrame(step);
}

/** наезд сцены на карточку; на телефоне без расфокуса — размытие во весь экран ему дорого */
function zoom(x: number, y: number, inward: boolean, ms: number, delay = 0) {
  const blur = fine() ? 6 : 0;
  const near = { transform: `scale(${ZOOM})`, filter: `blur(${blur}px)` };
  const far = { transform: "scale(1)", filter: "blur(0px)" };
  for (const el of layers()) {
    el.getAnimations().forEach((a) => a.cancel());
    el.style.transformOrigin = `${x}px ${y}px`;
    el.animate(inward ? [far, near] : [near, far], { duration: ms, delay, easing: "cubic-bezier(0.45, 0, 0.55, 1)", fill: inward ? "forwards" : "backwards" });
  }
}

/* ───────────── вход и выход ───────────── */

/** раскрыть только что отрисованное окно кейса; false — перехода не будет, работает обычное проявление */
export function morphIn(root: HTMLElement, id: string): boolean {
  const s = source;
  source = null;
  if (!s || s.id !== id || performance.now() - s.at > 4000 || reduced() || !("animate" in root)) { opened = null; return false; }
  const ink = makeInk(s.x, s.y);
  if (!ink) { opened = null; return false; }
  root.classList.add("cv-morph");
  root.style.opacity = "0";
  animate(1100);
  document.body.classList.add("cv-leaving");
  document.body.appendChild(ink.canvas);
  overlay = ink.canvas;
  ink.draw(0);
  zoom(s.x, s.y, true, IN_MS + MELT_MS);
  /* бумага почти легла (последние углы пятно доползает медленно) — страница уже под ней, а бумага тает, пока
     край ещё растекается: без остановки на пустом светлом экране и без рывка */
  let melting = false;
  run(IN_MS, 0, 1, (t) => {
    ink.draw(t);
    if (melting || t < MELT_AT) return;
    melting = true;
    root.style.opacity = "";
    const a = ink.canvas.animate([{ opacity: 1 }, { opacity: 0 }], { duration: MELT_MS, easing: "ease-in-out", fill: "forwards" });
    a.onfinish = () => { ink.stop(); if (overlay === ink.canvas) overlay = null; };
  }, () => {});
  opened = { x: s.x, y: s.y };
  return true;
}

/** закрыть обратным ходом; возвращает, сколько ждать до конца, или null — переход не нужен */
export function morphOut(root: HTMLElement): number | null {
  const o = opened;
  opened = null;
  if (document.body.classList.contains("cv-leaving")) animate(COVER_MS + OUT_MS + 300);
  if (!o || reduced() || !root.classList.contains("cv-morph")) { document.body.classList.remove("cv-leaving"); morphReset(root); return null; }
  const ink = makeInk(o.x, o.y);
  if (!ink) { document.body.classList.remove("cv-leaving"); morphReset(root); return null; }
  document.body.appendChild(ink.canvas);
  overlay = ink.canvas;
  ink.draw(1);
  /* бумага сначала ложится поверх страницы, и только потом страница прячется и бумага стекает в карточку */
  const a = ink.canvas.animate([{ opacity: 0 }, { opacity: 1 }], { duration: COVER_MS, easing: "ease-in", fill: "backwards" });
  a.onfinish = () => {
    root.style.opacity = "0";
    document.body.classList.remove("cv-leaving");
    zoom(o.x, o.y, false, OUT_MS);
    run(OUT_MS, 1, 0, ink.draw, () => { ink.stop(); if (overlay === ink.canvas) overlay = null; });
  };
  return COVER_MS + OUT_MS;
}

/** окно уже спрятано: снять всё, что осталось от перехода */
export function morphReset(root: HTMLElement) {
  root.getAnimations().forEach((a) => a.cancel());
  root.classList.remove("cv-morph");
  root.style.opacity = "";
  for (const el of layers()) { el.getAnimations().forEach((a) => a.cancel()); el.style.transformOrigin = ""; }
  overlay?.remove();
  overlay = null;
}
