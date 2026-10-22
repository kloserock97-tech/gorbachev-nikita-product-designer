import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import type { CaseItem } from "../../data/cases";
import { getLang } from "../../i18n";

/* v103: световой столб-указатель кейса — модель и лицевая панель. Референс — фото навигационного столба у
   «Суздаль ГТК»: высокий узкий короб из молочного акрила светится изнутри; по углам тёмные металлические стойки,
   спереди сбоку глубокий тёмный паз; тёмная крышка и цоколь в траве. На лице крупная стрелка «>», ниже много
   воздуха, «направления» заглавными узким гротеском с мелкой подписью, внизу знак — слово и чёрные плашки.

   У нас на лице: стрелка, кейс как направление (название и метка), цифра результата с подписью, «КЕЙС» и плашки
   с номером. Светится только акрил — печать остаётся чёрной и чёткой (faceMaterial). Где и как столб стоит на лугу —
   signpost3d.ts. */

export const PILLAR = { w: 0.74, h: 2.6, d: 0.42, base: 0.12 };
/* логический размер панели: вёрстка в этих пикселях, холст может быть крупнее для чёткости */
const TEX_W = 768;
const TEX_H = Math.round((TEX_W * PILLAR.h) / PILLAR.w);

export const fontsReady = () =>
  Promise.all([document.fonts.load('700 120px "Ugol"', "АБВ ABC"), document.fonts.load('600 40px "Onest"', "АБВ ABC")]).catch(() => []);

/* длинная строка — по словам, каждая не шире панели */
function wrap(ctx: CanvasRenderingContext2D, text: string, maxW: number) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const next = line ? `${line} ${w}` : w;
    if (ctx.measureText(next).width > maxW && line) { lines.push(line); line = w; } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

type Spaced = CanvasRenderingContext2D & { letterSpacing: string };

export function paintFace(canvas: HTMLCanvasElement, c: CaseItem, i: number) {
  const ctx = canvas.getContext("2d") as Spaced;
  const k = canvas.width / TEX_W;
  ctx.setTransform(k, 0, 0, k, 0, 0);
  const W = TEX_W, H = TEX_H;
  const ru = getLang() === "ru";
  /* акрил: светодиоды по периметру за рассеивателем — к краям чуть темнее и холоднее, в середине ровный белый */
  const g = ctx.createLinearGradient(0, 0, W, 0);
  g.addColorStop(0, "#eef2f5");
  g.addColorStop(0.18, "#ffffff");
  g.addColorStop(0.82, "#ffffff");
  g.addColorStop(1, "#eef2f5");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  const ink = "#0b0c0e";
  const left = W * 0.16;
  const maxW = W * 0.7;

  /* стрелка — толстый уголок, как на фото. v123 (Никита): концы и вершина слегка скруглены */
  ctx.strokeStyle = ink;
  ctx.lineWidth = W * 0.075;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.miterLimit = 10;
  ctx.beginPath();
  const ax = W * 0.4, ay = H * 0.052, aw = W * 0.24, ah = H * 0.098;
  ctx.moveTo(ax, ay);
  ctx.lineTo(ax + aw, ay + ah / 2);
  ctx.lineTo(ax, ay + ah);
  ctx.stroke();

  /* «направления», как «РЕСТОРАН / RESTAURANT»: крупно заглавными узким гротеском, вплотную ниже — мелкая строка */
  let y = H * 0.585;
  /* v123 (Никита): надписи столба — Ugol, жирнее (было Oswald 600), чтобы читались издалека */
  const big = (px: number) => `700 ${px}px "Ugol", "Onest", sans-serif`;
  const small = (px: number) => `600 ${px}px "Onest", sans-serif`;
  ctx.fillStyle = ink;
  ctx.textBaseline = "alphabetic";
  /* жирнее, чем даёт самое плотное начертание: обводка тем же цветом поверх заливки */
  const heavy = (text: string, x: number, yy: number, px: number) => {
    ctx.fillText(text, x, yy);
    ctx.lineWidth = px * 0.045; ctx.lineJoin = "round"; ctx.strokeStyle = ctx.fillStyle as string;
    ctx.strokeText(text, x, yy);
  };
  const entry = (head: string, sub: string, maxPx: number) => {
    /* не больше двух строк: длинное название мельчает, а не теряет слово */
    let px = maxPx, lines: string[] = [];
    ctx.letterSpacing = "0.5px";
    for (; px >= 64; px -= 4) {
      ctx.font = big(px);
      lines = wrap(ctx, head.toUpperCase(), maxW);
      if (lines.length <= 2 && lines.every((l) => ctx.measureText(l).width <= maxW)) break;
    }
    for (const l of lines) { heavy(l, left, y, px); y += px * 0.98; }
    ctx.letterSpacing = "2px";
    ctx.font = small(40);
    const subs = wrap(ctx, sub.toUpperCase(), maxW).slice(0, 2);
    y -= px * 0.44;
    for (const l of subs) { heavy(l, left + 3, y, 26); y += 46; }
    y += px * 0.92;
  };
  entry(c.title, c.tag, 122);
  entry(c.stat.value, c.stat.label, 112);

  /* знак внизу, как «СУЗДАЛЬ ГТК»: слово и чёрные плашки со скруглением, в них белые цифры номера */
  ctx.letterSpacing = "1px";
  const word = ru ? "КЕЙС" : "CASE";
  ctx.font = big(96);
  const by = H * 0.875;
  const tile = W * 0.18, gap = W * 0.026;
  const digits = String(i + 1).padStart(2, "0").split("");
  const tilesW = digits.length * tile + (digits.length - 1) * gap;
  const wordW = ctx.measureText(word).width;
  const blockW = Math.max(wordW, tilesW);
  const bx = left + (maxW - blockW) * 0.5;
  heavy(word, bx + (blockW - wordW) / 2, by - tile * 0.2, 96);
  digits.forEach((d, n) => {
    const tx = bx + (blockW - tilesW) / 2 + n * (tile + gap);
    ctx.fillStyle = ink;
    ctx.beginPath();
    ctx.roundRect(tx, by, tile, tile * 1.05, tile * 0.22);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.font = big(Math.round(tile * 0.84));
    const dw = ctx.measureText(d).width;
    heavy(d, tx + (tile - dw) / 2, by + tile * 0.87, tile * 0.84);
  });
}

/* ── материалы ────────────────────────────────────────────────────────────── */

/* светящиеся грани пишут 1 в трафарет: блум луга обходит их (bloom.ts) */
function markGlow<T extends THREE.Material>(m: T) {
  m.stencilWrite = true;
  m.stencilRef = 1;
  m.stencilFunc = THREE.AlwaysStencilFunc;
  m.stencilZPass = THREE.ReplaceStencilOp;
  return m;
}

const metal = new THREE.MeshStandardMaterial({ color: "#1a1c20", roughness: 0.38, metalness: 0.7 });
/* грани без печати: тот же акрил, чуть темнее лица — свет из короба выходит в основном вперёд */
const sideMaterial = (glow: number) => markGlow(new THREE.MeshBasicMaterial({ color: new THREE.Color(glow * 0.8, glow * 0.83, glow * 0.86) }));

/* Светится только белый акрил: яркость умножается по светлоте пикселя. Если умножить всю панель, края букв (серые
   от сглаживания) становятся ярче белого и съедают краску — буквы тончают, мелкая подпись исчезает */
function faceMaterial(map: THREE.Texture, glow: number) {
  const m = new THREE.MeshBasicMaterial({ map });
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uGlow = { value: glow };
    sh.fragmentShader = sh.fragmentShader
      .replace("#include <common>", "#include <common>\nuniform float uGlow;")
      .replace("#include <map_fragment>", /* glsl */ `#include <map_fragment>
  float paper = smoothstep(0.62, 0.93, dot(diffuseColor.rgb, vec3(0.2126, 0.7152, 0.0722)));
  diffuseColor.rgb *= mix(1.1, uGlow, paper);`);
  };
  m.customProgramCacheKey = () => `pillar-face-${glow}`;
  return markGlow(m);
}

/* ── столб ────────────────────────────────────────────────────────────────── */

export type Pillar = { group: THREE.Group; face: THREE.CanvasTexture; canvas: HTMLCanvasElement };

/** glow — яркость акрила в линейных единицах (кадр тонмаппится в финальном проходе); res — чёткость панели */
export function buildPillar(shadows: boolean, glow: number, res = 1): Pillar {
  const { w, h, d, base } = PILLAR;
  const sideGlow = sideMaterial(glow);
  const group = new THREE.Group();
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(TEX_W * res);
  canvas.height = Math.min(4096, Math.round(TEX_H * res));
  const face = new THREE.CanvasTexture(canvas);
  face.colorSpace = THREE.SRGBColorSpace;
  face.anisotropy = 16;

  /* короб: лицо (+z) с панелью, остальные грани — ровный акрил; верх и низ — металл */
  /* v123 (Никита): углы короба, стоек, крышки и цоколя слегка скруглены. RoundedBoxGeometry сохраняет шесть групп
     граней BoxGeometry — материалы по граням те же */
  const box = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 3, 0.06), [sideGlow, sideGlow, metal, metal, faceMaterial(face, glow), sideGlow]);
  box.position.y = base + h / 2;
  group.add(box);

  /* стойки: спереди — паз между лицом и боковой гранью (на фото тёмная полоса у края лица), сзади тонкие */
  const post = (pw: number, pd: number, x: number, z: number) => {
    const m = new THREE.Mesh(new RoundedBoxGeometry(pw, h + 0.012, pd, 2, Math.min(pw, pd) * 0.45), metal);
    m.position.set(x, base + h / 2, z);
    group.add(m);
  };
  const fw = 0.04, fd = 0.1;
  post(fw, fd, -w / 2 + fw / 2 - 0.004, d / 2 - fd / 2 + 0.004);
  post(fw, fd, w / 2 - fw / 2 + 0.004, d / 2 - fd / 2 + 0.004);
  post(0.026, 0.026, -w / 2 + 0.009, -d / 2 + 0.009);
  post(0.026, 0.026, w / 2 - 0.009, -d / 2 + 0.009);
  /* крышка и цоколь; цоколь уходит в землю — на склоне не видно щели */
  const cap = new THREE.Mesh(new RoundedBoxGeometry(w + 0.012, 0.028, d + 0.012, 2, 0.013), metal);
  cap.position.y = base + h + 0.011;
  group.add(cap);
  const plinth = new THREE.Mesh(new RoundedBoxGeometry(w - 0.04, base + 0.45, d - 0.04, 2, 0.03), metal);
  plinth.position.y = (base - 0.45) / 2;
  group.add(plinth);

  group.traverse((o) => { if ((o as THREE.Mesh).isMesh) o.castShadow = shadows; });
  return { group, face, canvas };
}
