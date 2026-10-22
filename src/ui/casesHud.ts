/* v116 (прожарка: «один ритм сцен, как у igloo»). В главе «Кейсы» у светового столба те же подписи, что у компьютера в
   «Обо мне» (pcHud.ts): номер и название кейса слева сверху с ломаной выносной линией, год и где — справа снизу с прямой.
   Белые — луг тёмный. Появляются, когда камера подошла к столбу: линия за 0,2 с, буквы перебираются и садятся за
   0,75 с; при смене кейса прячутся и выходят заново. Читается из сцены только прямоугольник столба (caseClientRect). */
import { getCases } from "../data/cases";
import { getLang, onLang } from "../i18n";

type Rect = { x: number; y: number; w: number; h: number; k: number; i: number; settled: boolean };
type Scene = { caseClientRect?(): Rect | null; onStoryFrame?: () => void };

const GLYPHS_EN = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789#/_";
const GLYPHS_RU = "АБВГДЕЖЗИКЛМНПРСТУФХЦЧШЭЯ0123456789#/_";
const rnd = (i: number, k: number) => { const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); };
const pad = (n: number) => String(n).padStart(2, "0");

export function initCasesHud(scene: Scene) {
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const root = document.createElement("div");
  root.className = "pc-dossier pc-dossier--light";
  root.setAttribute("aria-hidden", "true");
  root.innerHTML = `
    <canvas class="pc-dossier__lines"></canvas>
    <div class="pc-dossier__label pc-dossier__label--title"><b data-l="0"></b><b data-l="1"></b></div>
    <div class="pc-dossier__label pc-dossier__label--date"><b data-l="2"></b><b data-l="3"></b></div>`;
  document.body.appendChild(root);
  const canvas = root.querySelector("canvas")!;
  const ctx = canvas.getContext("2d")!;
  const title = root.querySelector<HTMLElement>(".pc-dossier__label--title")!;
  const date = root.querySelector<HTMLElement>(".pc-dossier__label--date")!;
  let dpr = 1;
  const resize = () => { dpr = Math.min(2, devicePixelRatio || 1); canvas.width = Math.round(innerWidth * dpr); canvas.height = Math.round(innerHeight * dpr); };
  resize();
  addEventListener("resize", resize);

  let texts: string[] = ["", "", "", ""];
  const fill = (i: number) => {
    const c = getCases()[i];
    if (!c) return;
    const parts = c.tag.split("·").map((p) => p.trim());
    const year = parts.find((p) => /\d{4}/.test(p)) ?? "";
    texts = [`CASE_${pad(i + 1)}`, c.title.toUpperCase(), `D ${year}`, (parts[0] ?? "").toUpperCase()];
  };
  const scramble = (target: string, k: number, seed: number) => {
    if (k >= 1 || reduced) return target;
    const glyphs = getLang() === "ru" ? GLYPHS_RU : GLYPHS_EN;
    let out = "";
    for (let i = 0; i < target.length; i++) {
      const ch = target[i];
      if (ch === " " || k >= (i / Math.max(1, target.length)) * 0.75 + 0.2) out += ch;
      else out += glyphs[Math.floor(rnd(i + seed, Math.floor(performance.now() / 50)) * glyphs.length)];
    }
    return out;
  };
  const put = (el: HTMLElement, text: string) => { if (el.textContent !== text) el.textContent = text; };

  let caseIdx = -1, on = false, t0 = 0, tOff = 0, visible = false;
  onLang(() => { if (caseIdx >= 0) fill(caseIdx); });
  const setOn = (v: boolean, now: number) => {
    if (on === v) return;
    on = v;
    if (v) t0 = now; else tOff = now;
    title.classList.toggle("is-on", v);
    date.classList.toggle("is-on", v);
  };

  const prev = scene.onStoryFrame;
  scene.onStoryFrame = () => {
    prev?.();
    const now = performance.now();
    const r = scene.caseClientRect?.() ?? null;
    if (!r) {
      setOn(false, now);
      if (visible && now - tOff > 250) { visible = false; root.classList.remove("is-on"); ctx.clearRect(0, 0, canvas.width, canvas.height); }
      return;
    }
    if (r.i !== caseIdx) { setOn(false, now); caseIdx = r.i; fill(r.i); }
    if (!visible) { visible = true; root.classList.add("is-on"); }
    setOn(r.k > 0.95 && r.settled, now);

    /* опорные точки: верх столба слева и низ справа */
    const k = Math.max(24, Math.min(60, r.h * 0.16));
    const tax = r.x + r.w * 0.2, tay = r.y + r.h * 0.12;
    const mx = tax - k, my = tay - k, ex = mx - k * 1.6;
    const dax = r.x + r.w * 0.85, day = r.y + r.h * 0.82, dex = dax + k * 2.2;
    const wT = title.offsetWidth || 160;
    title.style.transform = `translate3d(${Math.max(8, Math.min(ex, innerWidth - wT - 8)).toFixed(1)}px, ${(my - 6).toFixed(1)}px, 0) translateY(-100%)`;
    date.style.transform = `translate3d(${dex.toFixed(1)}px, ${(day - 6).toFixed(1)}px, 0) translate(-100%, -100%)`;
    const kt = on ? Math.min(1, (now - t0) / 750) : 0;
    title.querySelectorAll<HTMLElement>("[data-l]").forEach((el, i) => put(el, scramble(texts[+el.dataset.l!], kt, i * 31)));
    date.querySelectorAll<HTMLElement>("[data-l]").forEach((el, i) => put(el, scramble(texts[+el.dataset.l!], kt, 70 + i * 31)));

    const lt = on ? Math.min(1, (now - t0) / 200) : Math.max(0, 1 - (now - tOff) / 200);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    if (lt <= 0) return;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.7)";
    ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(tax, tay);
    const d1 = Math.min(1, lt * 2), d2 = Math.max(0, lt * 2 - 1);
    ctx.lineTo(tax + (mx - tax) * d1, tay + (my - tay) * d1);
    if (d2 > 0) ctx.lineTo(mx + (ex - mx) * d2, my);
    ctx.moveTo(dax, day);
    ctx.lineTo(dax + (dex - dax) * lt, day);
    ctx.stroke();
    ctx.fillRect(tax - 1.5, tay - 1.5, 3, 3);
    ctx.fillRect(dax - 1.5, day - 1.5, 3, 3);
  };
}
