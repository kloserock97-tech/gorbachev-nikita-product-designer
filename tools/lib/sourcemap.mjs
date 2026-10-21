/* Минимальный разбор source map (v3) для инструментов: позиция в собранном файле → файл исходника, строка и имя.
   Сборка с картами: vite build --sourcemap. Без зависимостей: VLQ разбирается здесь. */
const B64 = Object.fromEntries([..."ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"].map((c, i) => [c, i]));

function decode(mappings) {
  const lines = [];
  let src = 0, sl = 0, sc = 0, nm = 0;
  for (const line of mappings.split(";")) {
    const segs = [];
    let col = 0;
    for (const seg of line.split(",")) {
      if (!seg) continue;
      const v = [];
      let shift = 0, val = 0;
      for (const ch of seg) {
        const d = B64[ch];
        val += (d & 31) << shift;
        if (d & 32) shift += 5;
        else { v.push(val & 1 ? -(val >> 1) : val >> 1); val = 0; shift = 0; }
      }
      col += v[0];
      if (v.length >= 4) { src += v[1]; sl += v[2]; sc += v[3]; if (v.length >= 5) nm += v[4]; segs.push([col, src, sl, sc, v.length >= 5 ? nm : -1]); }
    }
    lines.push(segs);
  }
  return lines;
}

/** map — объект source map; возвращает lookup(line0, col0) → { source, line (с 1), name } | null */
export function createLookup(map) {
  const lines = decode(map.mappings);
  return (line, col) => {
    const segs = lines[line];
    if (!segs?.length) return null;
    let lo = 0, hi = segs.length - 1, best = -1;
    while (lo <= hi) { const mid = (lo + hi) >> 1; if (segs[mid][0] <= col) { best = mid; lo = mid + 1; } else hi = mid - 1; }
    if (best < 0) return null;
    const [, s, l, , n] = segs[best];
    return { source: (map.sources[s] ?? "?").replace(/^(\.\.\/)+/, ""), line: l + 1, name: n >= 0 ? map.names[n] : null };
  };
}
