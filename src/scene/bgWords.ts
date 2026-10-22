import * as THREE from "three";

/* v121 (Никита: «как у igloo — размытые слова в глубине вместо бегущей строки»; приём igloo, слова, раскладка и код
   свои): за компьютером в тумане About плавают заранее размытые моноширинные слова. Три слоя глубины лежат в одной
   текстуре — по слою в канале R, G, B; шейдер фона (shaders.ts, uWords) читает каждый со своим параллаксом: дальний
   мельче и размытее и почти стоит, ближний крупнее и едет быстрее. Буквы рисуются один раз, когда шрифт загрузился. */

const W = 1024, H = 512;
const WORDS = [
  "PORTFOLIO_NG", "DESIGN_SYSTEM", "RESEARCH_01", "USER_FLOW", "B2B / B2C / AI", "PROTOTYPE_04", "METRICS +27",
  "2019—2026", "SBER_RISK", "MOS.RU", "OZON", "NG_ARCHIVE", "CRT·2000", "KELLY_01", "HELLO_WORLD", "SPRINT_12",
  "JOURNEY_MAP", "A/B 0.42", "ROADMAP_Q3", "INTERVIEW_08",
];
/* слой: сколько слов, кегль, размытие */
const LAYERS: [number, number, number][] = [[11, 20, 2.5], [8, 30, 5], [5, 46, 9]];

function rng(seed: number) {
  let s = seed >>> 0;
  return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; };
}

function paint(texture: THREE.CanvasTexture) {
  const out = texture.image as HTMLCanvasElement;
  const octx = out.getContext("2d")!;
  const img = octx.createImageData(W, H);
  const layer = document.createElement("canvas");
  layer.width = W; layer.height = H;
  const ctx = layer.getContext("2d", { willReadFrequently: true })!;
  const random = rng(7741);
  LAYERS.forEach(([count, size, blur], ch) => {
    ctx.clearRect(0, 0, W, H);
    ctx.filter = `blur(${blur}px)`;
    ctx.fillStyle = "#fff";
    ctx.font = `500 ${size}px "Plex Mono", ui-monospace, monospace`;
    ctx.textBaseline = "middle";
    for (let i = 0; i < count; i++) {
      const word = WORDS[Math.floor(random() * WORDS.length)];
      const w = ctx.measureText(word).width;
      /* поля по краям, чтобы слово целиком лежало в текстуре: она повторяется, и обрезанное слово читалось бы швом */
      const x = blur * 2 + random() * Math.max(1, W - w - blur * 4);
      const y = size + random() * (H - size * 2);
      ctx.globalAlpha = 0.55 + random() * 0.45;
      ctx.fillText(word, x, y);
    }
    const a = ctx.getImageData(0, 0, W, H).data;
    for (let p = 0; p < W * H; p++) img.data[p * 4 + ch] = a[p * 4 + 3];
  });
  for (let p = 0; p < W * H; p++) img.data[p * 4 + 3] = 255;
  octx.putImageData(img, 0, 0);
  texture.needsUpdate = true;
}

let shared: THREE.CanvasTexture | null = null;
export function wordsTexture() {
  if (shared) return shared;
  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  shared = new THREE.CanvasTexture(canvas);
  shared.wrapS = shared.wrapT = THREE.RepeatWrapping;
  shared.generateMipmaps = false;
  shared.minFilter = shared.magFilter = THREE.LinearFilter;
  shared.colorSpace = THREE.NoColorSpace;
  const tex = shared;
  /* рисуется один раз, когда загрузился Plex Mono и браузер свободен (~20 мс), — до About ещё далеко; пока пусто — слов нет */
  const idle = (fn: () => void) => ("requestIdleCallback" in window ? requestIdleCallback(fn, { timeout: 3000 }) : setTimeout(fn, 500));
  const run = () => idle(() => paint(tex));
  (document.fonts?.load('500 30px "Plex Mono"') ?? Promise.resolve()).then(run, run);
  return tex;
}
