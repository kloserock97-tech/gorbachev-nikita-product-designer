import "./liquid-button.css";

/* v138: кнопка «Смотреть кейсы» по образу кнопки «Explore the work» со страницы Sylva на threeui.com (Никита 02.11).
   Код Sylva не брали — его слой мы уже убирали из проекта (v30); разобрали кадры живой кнопки и сделали своё:
   — в покое: тёмная дымчатая капсула, тонкая кромка «жидкого металла» с едва заметным переливом — тёплым внизу слева,
     холодным справа; значок из трёх линий слева, белая надпись;
   — наведение: у нижнего края под курсором вспыхивает лужица света — белое ядро, по краям спектр расходится (синий
     с одной стороны, оранжевый с другой), свет растекается вдоль нижней кромки, медленно дышит и плывёт за мышью;
     кромка ярче;
   — нажатие: вспышка ярче и короткое сжатие (CSS).
   Свой WebGL2-холст во всю кнопку, один шейдер. В покое кадр рисуется один раз и стоит: цикл идёт, только пока
   свет разгорается, гаснет или курсор над кнопкой. Без WebGL2 — прежняя металлическая кнопка; ?liquid=0 — она же */

const FRAG = /* glsl */ `#version 300 es
precision highp float;
uniform vec2 uSize;     /* размер кнопки, px */
uniform vec2 uCanvas;   /* размер холста, px — шире кнопки на поля под свечение */
uniform float uTime;
uniform float uHover;   /* 0..1 — сила света */
uniform float uHotX;    /* где лужица света по горизонтали, доля ширины 0..1 */
uniform float uPress;   /* 0..1 — вспышка нажатия */
uniform float uDpr;
out vec4 outColor;
uniform float BODY;     /* плотность тела, ?liquidbody=0.8 — подбор */

/* интенсивность лужицы света в точке p (пиксели от центра кнопки) */
float pool(vec2 p, vec2 hot, float R, float t){
  vec2 d = p - hot;
  /* жидкое дыхание: форма лужицы плывёт двумя медленными синусами */
  float wob = 1.0 + 0.12 * sin(t * 1.7 + d.x / R * 2.3) + 0.08 * sin(t * 2.9 - d.x / R * 4.1);
  vec2 e = d / vec2(R * 1.25 * wob, R * 0.58);
  float core = exp(-dot(e, e));
  /* свет, растекающийся вдоль нижней кромки — длинный хвост в обе стороны */
  float spread = exp(-pow(d.x / (R * 3.4), 2.0)) * exp(-pow((p.y + R * 0.92) / (R * 0.24), 2.0));
  return core * 1.15 + spread * 0.8;
}

void main(){
  /* v138.2: холст шире кнопки (uCanvas) — свет переливается за нижнюю кромку */
  vec2 p = gl_FragCoord.xy - uCanvas * 0.5;
  vec2 hb = uSize * 0.5;
  float R = hb.y;
  float aa = uDpr;
  /* SDF капсулы */
  vec2 qd = abs(p) - vec2(hb.x - R, 0.0);
  float dist = length(max(qd, 0.0)) + min(max(qd.x, qd.y), 0.0) - R;
  float inside = clamp(0.5 - dist / aa, 0.0, 1.0);
  float y = p.y / R;

  /* свет: лужица у нижнего края под курсором, каналы чуть врозь — спектр по краям */
  vec2 hot = vec2((uHotX - 0.5) * uSize.x, -R * 0.7);
  float k = uHover * (1.0 + 0.9 * uPress);
  vec3 light = vec3(0.0);
  float m = 0.0;
  if (k > 0.001) {
    float sh = R * 0.16;
    float iR = pool(p + vec2(sh, 0.0), hot, R, uTime);
    float iG = pool(p, hot, R, uTime);
    float iB = pool(p - vec2(sh * 1.4, 0.0), hot, R, uTime);
    light = vec3(iR, iG, iB);
    m = (iR + iG + iB) / 3.0;
    /* белое ядро, по краям синий и тёплый: разность каналов чуть усилена, яркое сходится к белому */
    light = mix(vec3(m), light, 1.5);
    light = mix(light, vec3(m), smoothstep(0.35, 0.9, m));
    light = max(light, 0.0) * vec3(0.98, 0.98, 1.05);
  }

  /* снаружи: только свечение, перелившееся через нижнюю кромку */
  if (inside <= 0.0) {
    float out_ = k * m * smoothstep(R * 0.55, 0.0, dist) * smoothstep(0.0, -1.0, y) * 0.55;
    outColor = vec4(light * out_, out_ * 0.85);
    return;
  }

  /* тело: тёплая дымка, к верху на тон светлее; плотность ровная (перепад от края к середине давал вторую рамку).
     v138.1 (Никита: «прозрачнее, менее серой») — сквозь тело видна размытая сцена */
  vec3 col = mix(vec3(0.120, 0.112, 0.085), vec3(0.185, 0.172, 0.135), smoothstep(-1.0, 0.9, y));
  float a = 0.62 * BODY;

  /* кромка полированного металла: светлые полоски сверху и снизу, по углу — лёгкий тёплый и холодный перелив */
  vec2 cp = p - vec2(clamp(p.x, -(hb.x - R), hb.x - R), 0.0);
  float ang = atan(cp.y, cp.x);
  float along = p.x / hb.x;                       /* −1 слева … 1 справа */
  vec3 rimC = vec3(0.80, 0.79, 0.76);
  rimC = mix(rimC, vec3(1.0, 0.70, 0.46), smoothstep(0.2, -0.9, sin(ang)) * smoothstep(0.4, -0.8, along) * 0.7);
  rimC = mix(rimC, vec3(0.58, 0.72, 1.0), smoothstep(0.1, 0.9, along) * 0.55);
  float shine = 0.55 + 0.45 * pow(abs(sin(ang)), 3.0);     /* верх и низ ярче, бока — темнее, как у металла */
  float rim = smoothstep(-2.2 * aa, -0.6 * aa, dist) * (1.0 - smoothstep(-0.6 * aa, 0.4 * aa, dist) * 0.4);
  float rimA = 0.7 * shine;
  /* внутренний отблеск под верхней кромкой — толщина металла */
  col += vec3(1.0) * smoothstep(0.55, 0.95, y) * smoothstep(-7.0 * aa, -2.5 * aa, dist) * 0.10;

  if (k > 0.001) {
    /* свет внутри толщи: ярче у низа, поднимается до надписи */
    float depth = smoothstep(0.95, -0.95, y);
    col += light * depth * k * 1.35;
    a = max(a, min(1.0, a + m * depth * k * 0.55));
    /* кромка горит рядом с лужицей и вся чуть ярче */
    float near = exp(-pow((p.x - hot.x) / (R * 2.2), 2.0));
    rimC = mix(rimC, vec3(1.0), (0.3 + 0.7 * near * smoothstep(0.3, -0.9, y)) * min(k, 1.0));
    rimA = mix(rimA, 1.0, min(k, 1.0));
  }
  col = mix(col, rimC, rim * rimA);
  a = max(a, rim * rimA);
  outColor = vec4(col * a * inside, a * inside);
}`;

const VERT = /* glsl */ `#version 300 es
in vec2 aPos;
void main(){ gl_Position = vec4(aPos, 0.0, 1.0); }`;

/* значок из трёх линий, как у образца (свой путь) */
const ICON = `<svg class="cta-lines" viewBox="0 0 20 20" aria-hidden="true"><path d="M4 6.5h12M4 10h12M4 13.5h7"/></svg>`;

const BODY_K = Number(new URLSearchParams(location.search).get("liquidbody") ?? 1);

export function initLiquidButton() {
  if (new URLSearchParams(location.search).get("liquid") === "0") return;
  const btn = document.querySelector<HTMLButtonElement>(".cta[data-action='explore']");
  if (!btn) return;
  const canvas = document.createElement("canvas");
  canvas.className = "cta-liquid";
  canvas.setAttribute("aria-hidden", "true");
  const ctx = canvas.getContext("webgl2", { premultipliedAlpha: true, alpha: true, antialias: false, powerPreference: "low-power" });
  if (!ctx) return;
  const gl: WebGL2RenderingContext = ctx;

  const sh = (type: number, src: string) => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? "shader");
    return s;
  };
  let prog: WebGLProgram;
  try {
    prog = gl.createProgram()!;
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog) ?? "link");
  } catch (e) {
    console.warn("кнопка «жидкий металл»: шейдер не собрался", e);
    return;
  }
  gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, "aPos");
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const u = (n: string) => gl.getUniformLocation(prog, n);
  const U = { canvas: u("uCanvas"), body: u("BODY"), size: u("uSize"), time: u("uTime"), hover: u("uHover"), hot: u("uHotX"), press: u("uPress"), dpr: u("uDpr") };

  /* значок слева, стрелку справа убираем — как у образца */
  btn.querySelector(":scope > svg")?.remove();
  btn.querySelector(".lbl")?.insertAdjacentHTML("beforebegin", ICON);
  btn.prepend(canvas);
  btn.classList.add("cta--liquid");

  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let w = 0, h = 0, cw = 0, ch = 0, dpr = 1;
  const fit = () => {
    dpr = Math.min(2, devicePixelRatio || 1);
    const bw = btn.offsetWidth, bh = btn.offsetHeight;
    /* поля под свечение за кромкой */
    const m = Math.round(bh * 0.6);
    btn.style.setProperty("--lq-m", `${m}px`);
    w = bw * dpr; h = bh * dpr;
    cw = Math.round((bw + m * 2) * dpr); ch = Math.round((bh + m * 2) * dpr);
    if (canvas.width !== cw || canvas.height !== ch) { canvas.width = cw; canvas.height = ch; }
    gl.viewport(0, 0, cw, ch);
    draw();
  };

  let hover = 0, hoverT = 0, hotX = 0.3, hotT = 0.3, press = 0, pressT = 0;
  let last = performance.now(), raf = 0;
  const t0 = last;

  function draw() {
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform2f(U.size, w, h);
    gl.uniform2f(U.canvas, cw, ch);
    gl.uniform1f(U.body, BODY_K);
    gl.uniform1f(U.time, (performance.now() - t0) / 1000);
    gl.uniform1f(U.hover, hover);
    gl.uniform1f(U.hot, hotX);
    gl.uniform1f(U.press, press);
    gl.uniform1f(U.dpr, dpr);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
  const frame = (now: number) => {
    raf = 0;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const k = reduced ? 1 : 1 - Math.exp(-dt * 7);
    hover += (hoverT - hover) * k;
    hotX += (hotT - hotX) * (reduced ? 1 : 1 - Math.exp(-dt * 6));
    press += (pressT - press) * (reduced ? 1 : 1 - Math.exp(-dt * (pressT > 0 ? 22 : 5)));
    if (pressT > 0 && press > 0.92) pressT = 0;
    draw();
    /* цикл живёт, пока свет есть или ещё меняется; погасло — кадр стоит */
    const settled = hoverT === 0 && hover < 0.002 && press < 0.002;
    if (settled) { hover = 0; press = 0; draw(); return; }
    if (!document.hidden && !reduced) raf = requestAnimationFrame(frame);
    else if (reduced && (Math.abs(hoverT - hover) > 0.001 || press > 0.002)) raf = requestAnimationFrame(frame);
  };
  const wake = () => { if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } };

  const setHot = (e: PointerEvent) => {
    const r = btn.getBoundingClientRect();
    hotT = Math.min(0.95, Math.max(0.05, (e.clientX - r.left) / r.width));
  };
  btn.addEventListener("pointerenter", (e) => { if (e.pointerType !== "mouse") return; setHot(e); hotX = hotT; hoverT = 1; wake(); });
  btn.addEventListener("pointermove", (e) => { if (e.pointerType === "mouse") { setHot(e); wake(); } });
  btn.addEventListener("pointerleave", (e) => { if (e.pointerType === "mouse") { hoverT = 0; wake(); } });
  btn.addEventListener("pointerdown", (e) => {
    setHot(e);
    /* палец: короткая вспышка без наведения — разгорается и гаснет сама */
    if (e.pointerType !== "mouse") { hotX = hotT; hoverT = 1; window.setTimeout(() => { hoverT = 0; wake(); }, 260); }
    pressT = 1;
    wake();
  });
  btn.addEventListener("focus", () => { if (btn.matches(":focus-visible")) { hotT = 0.5; hoverT = 0.6; wake(); } });
  btn.addEventListener("blur", () => { hoverT = 0; wake(); });

  new ResizeObserver(fit).observe(btn);
  canvas.addEventListener("webglcontextlost", (e) => { e.preventDefault(); btn.classList.remove("cta--liquid"); canvas.remove(); });
  fit();
}
