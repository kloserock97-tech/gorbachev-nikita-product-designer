import * as THREE from "three";
import type { HillScene } from "../scene/HillScene";
import "./intro.css";

/* Интро перед входом интерфейса — см. docs/prompts/intro.md.
   1) SYS_CAM: кадр холма как фид камеры наблюдения, поверх печатается терминал
      (повтор кадра с тарелкой из IMG_2181, тарелка заменена нашим креслом);
   2) глитч и провал в темноту;
   3) LOADING LOCATION: холм собирается из голографической сетки, по нему
      проходит лёгкая волна;
   4) сетка растворяется → onDone (вход интерфейса).
   Всё состояние — чистая функция времени t, поэтому ?t=&pause=1 даёт стоп-кадр. */

const T = {
  glitchIn: 2.2,
  cut: 2.62,
  blackEnd: 2.95,
  loadIn: 3.0,
  waveFrom: 3.5,
  waveTo: 5.1,
  holoOut: 5.0,
  end: 5.9,
};

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const ramp = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));
const easeInOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const easeOut = (x: number) => 1 - Math.pow(1 - x, 3);
const mix = (a: number, b: number, k: number) => a + (b - a) * k;

/* детерминированный шум для «данных»: одинаковый на каждом кадре и перезагрузке */
const rnd = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
const hex = (n: number) => "0x" + Math.floor(rnd(n) * 0xffff).toString(16).toUpperCase().padStart(4, "0");
const GLYPHS = "▓▒░#%&@$*+=/\\<>{}[]01";

/* строка печатается со скоростью cps начиная с start; в фазе слома символы гниют */
function typed(text: string, t: number, start: number, cps: number, rot: number, seed: number) {
  if (t < start) return "";
  let s = text.slice(0, Math.floor((t - start) * cps));
  if (rot > 0) {
    const frame = Math.floor(t * 24);
    s = s.replace(/[^\s]/g, (ch, i: number) => (rnd(seed * 31 + i * 7 + frame) < rot ? GLYPHS[Math.floor(rnd(i + frame * 3 + seed) * GLYPHS.length)] : ch));
  }
  return s;
}

type Line = { text: string; at: number; cps: number };

export type Intro = { play: () => void; skip: () => void };

export function createIntro(scene: HillScene, onDone: () => void): Intro {
  const q = new URLSearchParams(location.search);
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const pauseAt = q.get("pause") === "1" && q.has("t") ? Number(q.get("t")) : null;
  /* при reduced motion всё то же, но вдвое быстрее, без глитча, волны и печати */
  const speed = reduced ? 2.2 : 1;

  const post = scene.post;
  const base = { exposure: post.exposure, vignette: post.vignette, vibrance: post.vibrance, contrast: post.contrast };

  /* ---------- разметка ---------- */
  const root = document.createElement("div");
  root.className = "intro";
  root.setAttribute("aria-hidden", "true");
  root.innerHTML = `
    <div class="intro-scan"></div>
    <section class="intro-term">
      <header class="intro-head"><i class="intro-mark"></i><b>SYS_CAM_01</b></header>
      <p class="intro-sub">TERMINAL_LOG</p>
      <pre class="intro-log"></pre>
      <pre class="intro-col"></pre>
    </section>
    <svg class="intro-lead"><polyline /></svg>
    <div class="intro-bracket"><i></i><i></i><i></i><i></i></div>
    <pre class="intro-table"></pre>
    <div class="intro-mosaic"></div>
    <div class="intro-leds"></div>
    <section class="intro-load">
      <header class="intro-head"><i class="intro-mark"></i><b>LOADING LOCATION</b></header>
      <p class="intro-sub">HILL_01 · SUNSET · 52.37N 4.89E</p>
      <div class="intro-bar"><i></i></div>
      <p class="intro-pct"></p>
      <pre class="intro-assets"></pre>
    </section>`;
  document.body.appendChild(root);
  const $ = <E extends Element>(s: string) => root.querySelector(s) as E;
  const term = $<HTMLElement>(".intro-term"), log = $<HTMLElement>(".intro-log"), col = $<HTMLElement>(".intro-col");
  const table = $<HTMLElement>(".intro-table"), lead = $<SVGPolylineElement>(".intro-lead polyline"), bracket = $<HTMLElement>(".intro-bracket");
  const mosaic = $<HTMLElement>(".intro-mosaic"), leds = $<HTMLElement>(".intro-leds"), scan = $<HTMLElement>(".intro-scan");
  const load = $<HTMLElement>(".intro-load"), bar = $<HTMLElement>(".intro-bar i"), pct = $<HTMLElement>(".intro-pct"), assets = $<HTMLElement>(".intro-assets");

  /* мозаика снизу слева — тёмные квадраты, как пиксельный блок на тарелке */
  const tiles: HTMLElement[] = [];
  for (let i = 0; i < 7 * 12; i++) {
    const el = document.createElement("i");
    el.style.setProperty("--a", (rnd(i + 5) > 0.45 ? 0.15 + rnd(i) * 0.55 : 0).toFixed(2));
    mosaic.appendChild(el);
    tiles.push(el);
  }
  const ledEls: HTMLElement[] = [];
  for (let i = 0; i < 8; i++) {
    const el = document.createElement("i");
    leds.appendChild(el);
    ledEls.push(el);
  }

  /* ---------- содержимое ---------- */
  const narrow = () => window.innerWidth < 700;
  const logLines: Line[] = [
    { text: "CONNECTION ESTABLISHED...", at: 0.12, cps: 90 },
    { text: "SRC  HILL_01 / CAM_NORTH     FEED  LIVE", at: 0.42, cps: 120 },
    { text: "LINK 5190/TCP  52.3702N  4.8952E", at: 0.62, cps: 120 },
  ];
  const colLines: Line[] = Array.from({ length: 18 }, (_, i) => ({
    text: `T+${(0.412 + i * 0.137).toFixed(3).padStart(6, "0")}  ${hex(i)}  ${(52.37 + rnd(i + 40) * 0.01).toFixed(4)}  ${(4.89 + rnd(i + 80) * 0.01).toFixed(4)}  -${Math.floor(58 + rnd(i + 9) * 14)}dB`,
    at: 0.78 + i * 0.075,
    cps: 170,
  }));
  const blades = Math.round(scene.blades / 1000);
  const rows = () => {
    const wide = !narrow();
    return [
      wide ? "OBJ        DIST     YAW     SIG    STATUS" : "OBJ        DIST   SIG",
      wide ? `CHAIR_01   10.9m   -24°    [▮▮▮▮]  [LOCKED]` : "CHAIR_01   10.9m  [▮▮▮▮]",
      wide ? `TABLE_02   11.2m   -24°    [▮▮▮▯]  [TRACK]` : "TABLE_02   11.2m  [▮▮▮▯]",
      wide ? `PC_03      11.1m   +16°    [▮▮▯▯]  [PING ${hex(3)}]` : "PC_03      11.1m  [▮▮▯▯]",
    ];
  };
  const assetLines: [string, number][] = [
    ["terrain.heightfield   44×44 m", 0.08],
    [`grass.instances       ${blades}k`, 0.24],
    ["flora.drifts          38", 0.38],
    ["props.glb  draco      637 KB", 0.55],
    ["hdri  qwantani_sunset 1k", 0.7],
    ["wind.field            sync", 0.84],
    ["wave.pulse            emit", 0.3],
  ];

  /* ---------- проекция таблицы на кресло ---------- */
  const corner = new THREE.Vector3();
  const placeTracking = (visible: boolean) => {
    if (!visible) return;
    const b = scene.propBounds;
    let minX = 1e9, minY = 1e9, maxX = -1e9, maxY = -1e9;
    for (let i = 0; i < 8; i++) {
      corner.set(i & 1 ? b.max.x : b.min.x, i & 2 ? b.max.y : b.min.y, i & 4 ? b.max.z : b.min.z);
      const p = scene.worldToClient(corner);
      minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x);
      minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y);
    }
    const pad = 6;
    Object.assign(bracket.style, { left: `${minX - pad}px`, top: `${minY - pad}px`, width: `${maxX - minX + pad * 2}px`, height: `${maxY - minY + pad * 2}px` });
    /* таблица вправо-вверх от кресла, выноска ломаной — как строки вдоль штанги тарелки */
    const ax = maxX + pad, ay = minY + (maxY - minY) * 0.3;
    const tx = Math.min(ax + Math.max(40, window.innerWidth * 0.06), window.innerWidth - table.offsetWidth - 16);
    const ty = Math.max(16, ay - window.innerHeight * 0.12);
    table.style.left = `${tx}px`;
    table.style.top = `${ty}px`;
    lead.setAttribute("points", `${ax},${ay} ${tx - 14},${ty + 8} ${tx - 4},${ty + 8}`);
  };

  /* ---------- кадр ---------- */
  const setText = (el: HTMLElement, s: string) => {
    if (el.textContent !== s) el.textContent = s;
  };

  const render = (t: number) => {
    /* 1) SYS_CAM: холодный приглушённый грейд, к загрузке возвращается тёплый */
    const cold = 1 - ramp(t, T.blackEnd, T.blackEnd + 0.5);
    post.exposure = mix(base.exposure, base.exposure * 0.52, cold);
    post.vignette = mix(base.vignette, 1.15, cold);
    post.vibrance = mix(base.vibrance, -0.45, cold);
    post.contrast = mix(base.contrast, base.contrast * 1.08, cold);
    post.whiteBalance.set(mix(1, 0.84, cold), mix(1, 0.95, cold), mix(1, 1.14, cold));

    /* 2) глитч: нарастает на сломе текста, пик на склейке; провал в темноту */
    const g = reduced ? 0 : (t < T.cut ? ramp(t, T.glitchIn, T.cut) ** 2 * 0.45 : 1 - ramp(t, T.cut, T.blackEnd + 0.1));
    post.glitch = g;
    post.glitchSeed = Math.floor(t * 18);
    const black = t < T.cut ? ramp(t, T.cut - 0.06, T.cut) * 0.5 : 1 - ramp(t, T.cut + 0.12, T.blackEnd + 0.15);
    post.black = reduced ? 0 : clamp01(black) * 0.78;

    /* 3) голограмма */
    const holoIn = ramp(t, T.cut + 0.05, T.cut + 0.2);
    const holo = holoIn * (1 - easeInOut(ramp(t, T.holoOut, T.end)));
    const b = scene.propBounds;
    const cutT = easeInOut(ramp(t, 3.7, 4.7));
    const waveU = ramp(t, T.waveFrom, T.waveTo);
    scene.setIntro({
      holo,
      reveal: mix(-0.3, 24, easeInOut(ramp(t, T.loadIn + 0.15, 5.7))),
      net: 1 - easeInOut(ramp(t, 3.1, 3.9)),
      walls: easeOut(ramp(t, T.cut + 0.1, 4.0)),
      /* до голограммы реквизит настоящий целиком (срез выше всего) */
      cut: holo > 0.001 ? mix(b.min.y - 0.02, b.max.y + 0.02, cutT) : 1e3,
      wave: [mix(0.2, 19, waveU), Math.sin(Math.PI * waveU) ** 0.6 * (waveU > 0 && waveU < 1 ? 1 : 0), mix(0.55, 1.6, waveU)],
      ghost: ramp(t, T.holoOut, T.end + 0.4),
    });

    /* HTML: терминал фазы SYS_CAM */
    const sysOn = t < T.cut ? 1 : 0;
    const rot = reduced ? 0 : ramp(t, T.glitchIn, T.cut) * 0.9;
    const cps = reduced ? 1e4 : 1;
    root.classList.toggle("is-sys", sysOn > 0);
    root.classList.toggle("is-glitch", g > 0.3 && t < T.cut);
    term.style.opacity = String(sysOn);
    setText(log, logLines.map((l, i) => typed(l.text, t, l.at, l.cps * cps, rot, i)).filter(Boolean).join("\n"));
    const shownCol = colLines.filter((l) => t >= l.at);
    /* колонка ползёт вверх, когда строк больше окна */
    const maxRows = narrow() ? 8 : 14;
    setText(col, shownCol.slice(-maxRows).map((l, i) => typed(l.text, t, l.at, l.cps * cps, rot, 100 + i)).join("\n"));
    const r = rows();
    const tableOn = sysOn && t > 0.9;
    setText(table, r.map((row, i) => typed(row, t, 0.9 + i * 0.28, 140 * cps, rot, 300 + i)).join("\n"));
    table.style.opacity = bracket.style.opacity = tableOn ? "1" : "0";
    (lead.ownerSVGElement as SVGSVGElement).style.opacity = tableOn ? "1" : "0";
    placeTracking(!!tableOn);
    mosaic.style.opacity = sysOn ? String(ramp(t, 0.2, 0.5)) : "0";
    const fr = Math.floor(t * 8);
    tiles.forEach((el, i) => el.classList.toggle("on", rnd(i * 13 + fr) > 0.93));
    leds.style.opacity = sysOn ? String(ramp(t, 0.3, 0.6)) : "0";
    ledEls.forEach((el, i) => el.classList.toggle("on", rnd(i * 7 + Math.floor(t * 5)) > 0.5));
    scan.style.opacity = String(sysOn * 0.5);

    /* HTML: прогрузка локации */
    const loadOn = ramp(t, T.loadIn, T.loadIn + 0.25) * (1 - ramp(t, 5.3, T.end));
    load.style.opacity = loadOn.toFixed(3);
    const p = 1 - (1 - ramp(t, T.loadIn + 0.05, 5.1)) ** 1.6;
    bar.style.transform = `scaleX(${p.toFixed(4)})`;
    setText(pct, `${String(Math.floor(p * 100)).padStart(3, "0")}%  ${p < 1 ? "STREAMING" : "READY"}`);
    setText(
      assets,
      assetLines
        .filter(([, at]) => p >= at * 0.6)
        .map(([name, at]) => `${name.padEnd(30, " ")}${p >= at ? "OK" : "··"}`)
        .join("\n"),
    );
  };

  /* ---------- цикл ---------- */
  let t = 0, last = 0, raf = 0, playing = false, finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    cancelAnimationFrame(raf);
    Object.assign(post, { ...base, glitch: 0, black: 0 });
    post.whiteBalance.set(1, 1, 1);
    scene.setIntro({ holo: 0, reveal: 99, net: 0, walls: 0, cut: 1e3, wave: [0, 0, 1], ghost: 1 });
    root.remove();
    removeEventListener("keydown", skip);
    removeEventListener("pointerdown", skip);
    onDone();
  };
  const tick = (now: number) => {
    raf = requestAnimationFrame(tick);
    if (pauseAt !== null) { render(pauseAt); return; }
    t += (Math.min(now - last, 50) / 1000) * speed;
    last = now;
    render(t);
    if (t >= T.end) finish();
  };
  /* пропуск: перематываем к растворению голограммы — сцена не прыгает */
  const skip = () => {
    if (!playing || finished || pauseAt !== null || t < 0.3) return;
    t = Math.max(t, T.holoOut + 0.2);
  };
  addEventListener("keydown", skip);
  addEventListener("pointerdown", skip);

  /* до старта — уже холодный кадр без надписей, текста ещё нет */
  render(0);

  return {
    play() {
      if (playing || finished) return;
      playing = true;
      root.classList.add("is-armed");
      last = performance.now();
      raf = requestAnimationFrame(tick);
    },
    skip,
  };
}
