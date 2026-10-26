// use_figma: прогоняет конвертер по кадрам IDS, ужимает (классы, svg currentColor) и кладёт base64 в имена фреймов
// на временной странице «zz-tmp-export (удалить)». Дальше: get_metadata(holder) → файл → 3-decode.cjs
let code = figma.root.getSharedPluginData("f2h", "conv");
const run = new Function("figma", "FRAME", "return (async()=>{" + code + "})()");
const ids = IDS; /* ← подставить id кадров, например ["12:34", "12:56"] */
const cls = new Map(); let cn = 0; const C = (s) => { if (!s) return ""; if (!cls.has(s)) cls.set(s, "oc" + (cn++).toString(36)); return cls.get(s); };
const svgKey = new Map(); const svgs = {}; let sn = 0; const imgs = {};
const frames = [];
for (const id of ids) {
  await run(figma, id);
  const n = +figma.root.getSharedPluginData("f2h", id + ":n");
  let s = ""; for (let i = 0; i < n; i++) s += figma.root.getSharedPluginData("f2h", id + ":" + i);
  const p = JSON.parse(s);
  Object.assign(imgs, p.imgs);
  const html = p.html.replace(/<(div|i) data-n="([^"]*)"( class="(ft|fv)")? style="left:([-\d.]+)px;top:([-\d.]+)px;width:([\d.]+)px;height:([\d.]+)px;([^"]*)">(SVG:(s\d+)<\/i>)?/g, (m, tag, name, _c, kind, l, t, w, h, rest, svgPart, sk) => {
    let extra = rest, sref = "";
    if (sk) {
      let svg = p.svgs[sk].replace(/_\d+_\d+(?=["')])/g, "").replace(/\n/g, "");
      const cols = new Set((svg.match(/(?:fill|stroke)="(#[0-9A-Fa-f]{6})"/g) || []).map((x) => x.split('"')[1].toLowerCase()));
      if (cols.size === 1 && !/<filter|<mask|clipPath|Gradient/.test(svg)) { const col = [...cols][0]; svg = svg.replace(/(fill|stroke)="#[0-9A-Fa-f]{6}"/g, '$1="currentColor"'); extra += "color:" + col + ";"; }
      if (!svgKey.has(svg)) { svgKey.set(svg, "ov" + (sn++).toString(36)); svgs[svgKey.get(svg)] = svg; }
      sref = svgKey.get(svg);
    }
    const c = C((kind === "ft" ? "T;" : "") + extra);
    return `<${tag} n="${name}" p="${l},${t},${w},${h}"${c ? ` c="${c}"` : ""}${sref ? ` s="${sref}"></i>` : ">"}`;
  });
  frames.push({ id, name: p.name, w: p.w, h: p.h, html });
}
const bundle = JSON.stringify({ frames, cls: Object.fromEntries([...cls].map(([k, v]) => [v, k])), svgs, imgs });
const b64 = figma.base64Encode(new Uint8Array([...unescape(encodeURIComponent(bundle))].map((c) => c.charCodeAt(0))));
const page = figma.createPage(); page.name = "zz-tmp-export (удалить)";
await figma.setCurrentPageAsync(page);
const holder = figma.createFrame(); holder.name = "export"; page.appendChild(holder);
const CH = 20000; const parts = Math.ceil(b64.length / CH);
for (let i = 0; i < parts; i++) { const fr = figma.createFrame(); fr.name = "D" + String(i).padStart(3, "0") + ":" + b64.slice(i * CH, (i + 1) * CH); fr.resize(10, 10); holder.appendChild(fr); }
return { page: page.id, holder: holder.id, bytes: bundle.length, parts, svgs: sn, classes: cn, imgs };