/* v113 (Никита, по мотивам сцены проектов igloo.inc; код и тексты свои): пока компьютер летит к зрителю, вокруг него —
   «досье» объекта. Заменяет прежнюю рамку видоискателя (finder в storyHero.ts, ?hud=0 — вернуть её).

   · Три подписи привязаны к долям прямоугольника компьютера на экране (pcClientRect): название слева сверху с
     ломаной выносной линией, температура справа сверху, дата и подсказка справа снизу с прямой линией. Появляются
     по очереди, когда компьютер подлетает: линия дорисовывается за 0,2 с, текст проявляется за 0,4 с, буквы
     «перебираются» и садятся на место за 0,75 с; на каждое появление — короткий сигнал.
   · Температура — одна величина, медленно плавающая, в двух шкалах: °F и °C со знаком (36,6 °C ≈ 97,9 °F — живой
     человек за компьютером).
   · Вокруг — созвездие: точки-крестики на невидимом цилиндре вокруг компьютера медленно обходят его, соседние
     соединяются пунктиром, линия прорастает за 0,35 с и так же убирается.
   · v115: размытые слова в глубине убраны (прожарка) — эту роль играет бегущая строка «Привет! Я Никита…», на ходу
     она серая и стоит за компьютером, как фоновые слова igloo.
   Всё рисуется в DOM и одном 2D-холсте поверх сцены; читается из сцены только прямоугольник компьютера. */
import { STORY, chapters, trap } from "../scene/story";
import { cue } from "../audio/bus";
import { getLang, onLang, t } from "../i18n";

type Scene = {
  storyProgress: number;
  storyFlight: number;
  pcClientRect?(): { x: number; y: number; w: number; h: number } | null;
  onStoryFrame?: () => void;
};

/* окно показа по прогрессу главы About: появляется, когда бумага с туманом закрыла холм, уходит перед текстами */
const SHOW: [number, number, number, number] = [0.3, 0.42, 0.84, 0.89];
/* очередь подписей по полёту компьютера (scene.storyFlight 0…1) */
const AT = { title: 0.42, temp: 0.56, date: 0.7 };
const GLYPHS_EN = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789#/_";
const GLYPHS_RU = "АБВГДЕЖЗИКЛМНПРСТУФХЦЧШЭЯ0123456789#/_";


export function initPcHud(scene: Scene) {
  const root = document.createElement("div");
  root.className = "pc-dossier";
  root.setAttribute("aria-hidden", "true");
  root.innerHTML = `
    <canvas class="pc-dossier__lines"></canvas>
    <div class="pc-dossier__label pc-dossier__label--title"><b data-l="0"></b><b data-l="1"></b></div>
    <div class="pc-dossier__label pc-dossier__label--temp"><b><i>TEMP</i><span data-l="f"></span></b><b><i></i><span data-l="c"></span></b></div>
    <div class="pc-dossier__label pc-dossier__label--date"><b data-l="d"></b><b data-l="hint"></b></div>`;
  document.body.appendChild(root);
  document.body.classList.add("pc-dossier-on");

  const canvas = root.querySelector<HTMLCanvasElement>(".pc-dossier__lines")!;
  const ctx = canvas.getContext("2d")!;
  const labels = {
    title: root.querySelector<HTMLElement>(".pc-dossier__label--title")!,
    temp: root.querySelector<HTMLElement>(".pc-dossier__label--temp")!,
    date: root.querySelector<HTMLElement>(".pc-dossier__label--date")!,
  };
  let dpr = 1;
  const resize = () => {
    dpr = Math.min(2, devicePixelRatio || 1);
    canvas.width = Math.round(innerWidth * dpr);
    canvas.height = Math.round(innerHeight * dpr);
  };
  resize();
  addEventListener("resize", resize);

  const rnd = (i: number, k: number) => { const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); };

  /* тексты подписей: строка → перебор букв до места */
  const today = () => { const d = new Date(); const p = (n: number) => String(n).padStart(2, "0"); return `D ${p(d.getDate())}.${p(d.getMonth() + 1)}.${d.getFullYear()}`; };
  const texts = () => ({ "0": "PORTFOLIO_NG_01", "1": t("hud.role"), d: today(), hint: t("hud.hint") } as Record<string, string>);
  let source = texts();
  onLang(() => { source = texts(); });
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const scramble = (target: string, k: number, seed: number) => {
    /* при «меньше движения» буквы не перебираются — подпись просто проявляется */
    if (k >= 1 || reduced) return target;
    const glyphs = getLang() === "ru" ? GLYPHS_RU : GLYPHS_EN;
    let out = "";
    for (let i = 0; i < target.length; i++) {
      const ch = target[i];
      /* буква садится, когда волна дошла до её места; до этого — случайные знаки, меняются 20 раз в секунду */
      const settle = (i / Math.max(1, target.length)) * 0.75 + 0.2;
      if (ch === " " || k >= settle) out += ch;
      else out += glyphs[Math.floor(rnd(i + seed, Math.floor(performance.now() / 50)) * glyphs.length)];
    }
    return out;
  };

  /* текст пишется, только когда изменился: иначе браузер перекладывал бы подписи каждый кадр */
  const put = (el: HTMLElement, text: string) => { if (el.textContent !== text) el.textContent = text; };
  type L = { shown: boolean; t0: number; tOff: number };
  const st: Record<keyof typeof labels, L> = { title: { shown: false, t0: 0, tOff: 0 }, temp: { shown: false, t0: 0, tOff: 0 }, date: { shown: false, t0: 0, tOff: 0 } };
  let lastBeep = 0;
  const setShown = (key: keyof typeof labels, on: boolean, now: number) => {
    const s = st[key];
    if (s.shown === on) return;
    s.shown = on;
    if (on) { s.t0 = now; if (now - lastBeep > 400) { lastBeep = now; cue("hover", 0.35); } }
    else s.tOff = now;
    labels[key].classList.toggle("is-on", on);
  };

  /* созвездие: точки на цилиндре вокруг компьютера */
  const N = innerWidth < 700 ? 10 : 16;
  const pts = Array.from({ length: N }, (_, i) => ({ th: rnd(i, 5) * 6.283, hy: rnd(i, 6) * 1.4 - 0.7, rr: 0.85 + rnd(i, 7) * 0.2, w: (rnd(i, 8) - 0.5) * 0.5 }));
  const links = new Map<number, number>(); // ключ i*64+j → прорастание 0…1

  let shown = false;
  let wasArrived = false, lastSettle = 0;
  let lastT = performance.now();

  /* v118: рябь под курсором теперь на самом компьютере — в шейдере корпуса (HillScene.pcRippleLook) */
  const prev = scene.onStoryFrame;
  scene.onStoryFrame = () => {
    prev?.();
    const now = performance.now();
    const dt = Math.min(0.05, (now - lastT) / 1000);
    lastT = now;
    const { s, c } = chapters(scene.storyProgress);
    const a = c > 0 ? 0 : trap(s, ...SHOW);
    const r = a > 0.001 ? scene.pcClientRect?.() : null;
    if (!r) {
      if (shown) {
        shown = false;
        root.classList.remove("is-on");
        (Object.keys(labels) as (keyof typeof labels)[]).forEach((k) => setShown(k, false, now));
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      return;
    }
    if (!shown) { shown = true; root.classList.add("is-on"); }
    root.style.setProperty("--a", a.toFixed(3));
    const u = scene.storyFlight;
    /* v115: компьютер снова встал на место (после доводки или прокрутки туда-обратно) — подписи расшифровываются заново */
    const arrived = u > 0.985;
    if (arrived && !wasArrived && now - lastSettle > 1200) { lastSettle = now; (Object.keys(st) as (keyof typeof labels)[]).forEach((k) => { if (st[k].shown) st[k].t0 = now; }); }
    wasArrived = arrived;
    const live = a > 0.5 && s < STORY.textOff;
    setShown("title", live && u > AT.title, now);
    setShown("temp", live && u > AT.temp, now);
    setShown("date", live && u > AT.date, now);

    /* опорные точки — доли прямоугольника компьютера */
    const k = Math.max(26, Math.min(70, r.h * 0.22));
    const P = (fx: number, fy: number) => [r.x + r.w * fx, r.y + r.h * fy] as const;
    const [tax, tay] = P(0.3, 0.12);
    const [mx, my] = [tax - k, tay - k];
    const [ex, ey] = [mx - k * 1.7, my];
    const [pax, pay] = P(0.74, 0.1);
    const [dax, day] = P(0.72, 0.8);
    const [dex, dey] = [dax + k * 2.4, day];
    /* подписи не выходят за край экрана (на телефоне температура упиралась в правую кромку); ширина меряется раз */
    const wTemp = labels.temp.offsetWidth || 120, wTitle = labels.title.offsetWidth || 160;
    const tx = Math.max(8, Math.min(ex, innerWidth - wTitle - 8));
    labels.title.style.transform = `translate3d(${tx.toFixed(1)}px, ${(ey - 6).toFixed(1)}px, 0) translateY(-100%)`;
    labels.temp.style.transform = `translate3d(${Math.min(pax + k * 0.9, innerWidth - wTemp - 8).toFixed(1)}px, ${(pay - 4).toFixed(1)}px, 0)`;
    labels.date.style.transform = `translate3d(${dex.toFixed(1)}px, ${(dey - 6).toFixed(1)}px, 0) translate(-100%, -100%)`;

    /* тексты: перебор букв 0,75 с после появления */
    const prog = (key: keyof typeof labels) => (st[key].shown ? Math.min(1, (now - st[key].t0) / 750) : 0);
    const kt = prog("title"), kd = prog("date"), kp = prog("temp");
    labels.title.querySelectorAll<HTMLElement>("[data-l]").forEach((el, i) => put(el, scramble(source[el.dataset.l!], kt, i * 31)));
    labels.date.querySelectorAll<HTMLElement>("[data-l]").forEach((el, i) => put(el, scramble(source[el.dataset.l!], kd, 70 + i * 31)));
    const tc = 36.6 + Math.sin(now * 0.00005 + 1.3) * 1.4;
    const tf = tc * 1.8 + 32;
    const fmt = (v: number) => (v < 0 ? "-" : "+") + Math.abs(v).toFixed(2).padStart(5, "0");
    put(labels.temp.querySelector<HTMLElement>("[data-l='f']")!, scramble(tf.toFixed(2), kp, 140));
    put(labels.temp.querySelector<HTMLElement>("[data-l='c']")!, scramble(fmt(tc), kp, 170));

    /* линии и созвездие */
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    ctx.globalAlpha = a;
    ctx.strokeStyle = "rgba(28, 32, 40, 0.62)";
    ctx.lineWidth = 1;
    ctx.setLineDash([]);
    const draw = (key: keyof typeof labels) => {
      const l = st[key];
      return l.shown ? Math.min(1, (now - l.t0) / 200) : Math.max(0, 1 - (now - l.tOff) / 200);
    };
    const lt = draw("title");
    if (lt > 0) {
      ctx.beginPath();
      ctx.moveTo(tax, tay);
      const d1 = Math.min(1, lt * 2), d2 = Math.max(0, lt * 2 - 1);
      ctx.lineTo(tax + (mx - tax) * d1, tay + (my - tay) * d1);
      if (d2 > 0) ctx.lineTo(mx + (ex - mx) * d2, my);
      ctx.stroke();
      ctx.fillStyle = "rgba(28, 32, 40, 0.8)";
      ctx.fillRect(tax - 1.5, tay - 1.5, 3, 3);
    }
    const ld = draw("date");
    if (ld > 0) {
      ctx.beginPath();
      ctx.moveTo(dax, day);
      ctx.lineTo(dax + (dex - dax) * ld, day);
      ctx.stroke();
      ctx.fillStyle = "rgba(28, 32, 40, 0.8)";
      ctx.fillRect(dax - 1.5, day - 1.5, 3, 3);
    }

    const cx = r.x + r.w / 2, cy = r.y + r.h / 2;
    const R = Math.max(r.w, r.h) * 0.72;
    /* к центру созвездие гаснет — поверх компьютера ни пунктира, ни крестиков, они видны только вокруг */
    const edgeK = (x: number, y: number) => { const d = Math.hypot((x - cx) / (r.w * 0.5), (y - cy) / (r.h * 0.5)); return Math.min(1, Math.max(0, (d - 0.85) / 0.45)); };
    const xy: [number, number, number][] = pts.map((p) => {
      if (!reduced) p.th += p.w * dt;
      const z = Math.sin(p.th);
      return [cx + Math.cos(p.th) * R * p.rr, cy + p.hy * r.h * 0.62 + z * R * 0.06, z];
    });
    /* связи: только между точками перед компьютером (z > −0.2), ближе 0,7 R, не больше трёх на точку */
    const deg = new Array(N).fill(0);
    ctx.setLineDash([4, 5]);
    ctx.strokeStyle = "rgba(28, 32, 40, 0.38)";
    for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) {
      const key = i * 64 + j;
      const [x1, y1, z1] = xy[i], [x2, y2, z2] = xy[j];
      const want = u > 0.5 && z1 > -0.2 && z2 > -0.2 && Math.hypot(x2 - x1, y2 - y1) < R * 0.7 && deg[i] < 3 && deg[j] < 3;
      let g = links.get(key) ?? 0;
      g = Math.min(1, Math.max(0, g + (want ? dt : -dt) / 0.35));
      if (g > 0) { links.set(key, g); deg[i]++; deg[j]++; } else links.delete(key);
      if (g <= 0) continue;
      /* отрезок рисуется кусками: каждый со своей прозрачностью по удалению от центра */
      const steps = 8;
      for (let q = 0; q < steps; q++) {
        const t0 = (q / steps) * g, t1 = ((q + 1) / steps) * g;
        const px = x1 + (x2 - x1) * (t0 + t1) / 2, py = y1 + (y2 - y1) * (t0 + t1) / 2;
        ctx.globalAlpha = a * edgeK(px, py);
        if (ctx.globalAlpha < 0.02) continue;
        ctx.beginPath();
        ctx.moveTo(x1 + (x2 - x1) * t0, y1 + (y2 - y1) * t0);
        ctx.lineTo(x1 + (x2 - x1) * t1, y1 + (y2 - y1) * t1);
        ctx.stroke();
      }
    }
    ctx.setLineDash([]);
    ctx.strokeStyle = "rgba(28, 32, 40, 0.7)";
    for (const [x, y, z] of xy) {
      const sz = 3 + 1.5 * z;
      ctx.globalAlpha = a * (0.45 + 0.55 * (z * 0.5 + 0.5)) * Math.min(1, Math.max(0, (u - 0.3) * 4)) * edgeK(x, y);
      ctx.beginPath();
      ctx.moveTo(x - sz, y); ctx.lineTo(x + sz, y);
      ctx.moveTo(x, y - sz); ctx.lineTo(x, y + sz);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  };
}
