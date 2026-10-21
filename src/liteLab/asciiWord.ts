/* Слово в подвале, набранное символами ASCII. Слово рисуется шрифтом страницы на скрытом холсте, холст делится на
   клетки, каждая клетка становится символом по плотности заливки: пусто — пробел, край буквы — точка и двоеточие,
   тело — «#» и «@». Всё считается заново под ширину блока, поэтому надпись всегда во всю ширину и в той же сетке.
   Под курсором символы ненадолго перемешиваются (при «меньше движения» — нет). */
const RAMP = " .:-=+*#%@";
const NOISE = "@#%*+=-:.";

export function mountAsciiWord(pre: HTMLElement, getWord: () => string) {
  const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let base: string[][] = [];
  let lines: string[][] = [];
  let cell = { w: 0, h: 0 };
  let raf = 0;

  let lastKey = "";
  function build(force = false) {
    const word = getWord();
    const width = pre.clientWidth;
    if (!width || (!force && `${word}|${width}` === lastKey)) return;
    lastKey = `${word}|${width}`;
    /* символ моноширинного шрифта ~0,6 кегля в ширину; кегль подбираем, чтобы на букву приходилось ~16 колонок */
    /* на узком экране не меньше 12 колонок на букву — иначе слово превращается в кашу */
    const cols = Math.min(240, Math.round(word.length * Math.max(12, 16 * Math.min(1, width / 1100)) + 16));
    const fs = width / cols / 0.6;
    pre.style.fontSize = `${fs.toFixed(2)}px`;
    pre.style.lineHeight = `${(fs * 1.0).toFixed(2)}px`;
    cell = { w: width / cols, h: fs };
    /* слово на холсте: кегль подгоняется по ширине, высота строки — по высоте букв */
    const c = document.createElement("canvas");
    const g = c.getContext("2d", { willReadFrequently: true })!;
    const font = (px: number) => `600 ${px}px Onest, "Segoe UI", sans-serif`;
    g.font = font(100);
    const k = (cols * 0.96) / g.measureText(word).width;
    const px = 100 * k;
    const rows = Math.ceil(px * 0.86);
    /* рисуем вчетверо крупнее и уменьшаем — плотность клетки усредняется, край буквы выходит ступенькой символов, а не рваным */
    const S = 4;
    c.width = cols * S; c.height = rows * S;
    g.fillStyle = "#000"; g.fillRect(0, 0, c.width, c.height);
    g.fillStyle = "#fff"; g.font = font(px * S); g.textBaseline = "alphabetic";
    g.fillText(word, cols * 0.02 * S, rows * 0.82 * S);
    /* клетка символа выше, чем шире: сжимаем по вертикали, чтобы буквы не вытянулись */
    const tall = Math.round(rows * cell.w / cell.h);
    const c2 = document.createElement("canvas");
    c2.width = cols; c2.height = Math.max(4, tall);
    const g2 = c2.getContext("2d", { willReadFrequently: true })!;
    g2.imageSmoothingQuality = "high";
    g2.drawImage(c, 0, 0, cols, c2.height);
    const data = g2.getImageData(0, 0, cols, c2.height).data;
    base = [];
    for (let y = 0; y < c2.height; y++) {
      const row: string[] = [];
      for (let x = 0; x < cols; x++) {
        const v = data[(y * cols + x) * 4] / 255;
        row.push(RAMP[Math.min(RAMP.length - 1, Math.floor(v * RAMP.length))]);
      }
      base.push(row);
    }
    /* пустые строки сверху и снизу не нужны */
    while (base.length && base[0].every((ch) => ch === " ")) base.shift();
    while (base.length && base[base.length - 1].every((ch) => ch === " ")) base.pop();
    lines = base.map((r) => r.slice());
    draw();
  }

  function draw() {
    pre.textContent = lines.map((r) => r.join("")).join("\n");
  }

  /* курсор: в радиусе нескольких клеток заполненные символы на мгновение заменяются случайными, потом возвращаются */
  function stir(e: PointerEvent) {
    const r = pre.getBoundingClientRect();
    const cx = (e.clientX - r.left) / cell.w, cy = (e.clientY - r.top) / cell.h;
    const R = 5;
    for (let y = Math.max(0, Math.floor(cy - R)); y < Math.min(lines.length, cy + R); y++) {
      for (let x = Math.max(0, Math.floor(cx - R * 1.6)); x < Math.min(lines[y].length, cx + R * 1.6); x++) {
        if (base[y][x] === " ") continue;
        if (Math.random() < 0.5) lines[y][x] = NOISE[(Math.random() * NOISE.length) | 0];
      }
    }
    if (!raf) raf = requestAnimationFrame(settle);
  }
  /* символы возвращаются к своему виду постепенно — надпись «успокаивается» за полсекунды */
  function settle() {
    raf = 0;
    let busy = false;
    for (let y = 0; y < lines.length; y++) for (let x = 0; x < lines[y].length; x++) {
      if (lines[y][x] !== base[y][x]) { if (Math.random() < 0.18) lines[y][x] = base[y][x]; else busy = true; }
    }
    draw();
    if (busy) raf = requestAnimationFrame(settle);
  }

  if (!calm) pre.addEventListener("pointermove", stir);
  new ResizeObserver(() => build()).observe(pre);
  document.fonts?.ready.then(() => build(true));
  return () => build(true);
}
