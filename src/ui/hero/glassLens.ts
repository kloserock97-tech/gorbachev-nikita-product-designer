/* v128: преломление в стеклянных плашках (Никита 01.11: «не видно искажений, слишком непрозрачно»).
   v133 (Никита 02.11 прислал пример GlassSurface из React Bits): та же схема и те же параметры, код свой — у React Bits
   лицензия MIT + Commons Clause, его не копируем. Карта смещения: по всей плашке два градиента (x → красный, y → синий),
   поверх — серая середина (brightness, opacity), отступающая от края на borderWidth и размытая на blur. Где середина,
   сдвига нет; у кромки сцена сильно загибается внутрь (distortionScale −180 — «жидкое стекло», кромка как зеркальный
   изгиб), каналы смещаются на разную величину (0 / 10 / 20 px) — радужный край. После — лёгкое размытие displace.

   CSS-размытие только смягчает сцену под плашкой; настоящее стекло её гнёт. Здесь — SVG-фильтр внутри
   backdrop-filter: карта смещения под размер и скругление каждой плашки (рисуется на canvas), по ней сцена у кромки
   загибается внутрь, как в толще стекла, середина чуть увеличена, как под линзой. Красный, зелёный и синий смещаются
   на разную величину — у кромки тонкая радужная кайма. Код свой; приём — feDisplacementMap над фоном.

   Работает только в Chromium (Chrome, Edge): Safari и Firefox не рисуют url() в backdrop-filter, у них остаётся
   CSS-стекло из clear-glass.css. На сенсорных экранах стекло и так без размытия (дорого над живым холстом) —
   там тоже не включаем. Карта пересчитывается, когда плашка меняет размер (раскрытие карточки), с задержкой:
   на ходу растягивается прежняя */

/* v136 (Никита: «раскрытие меню и карточек с задержкой»). SVG-фильтр в backdrop-filter Chrome считает на процессоре и
   пересчитывает, как только под плашкой или в ней что-то меняется. Цена растёт с площадью и числом карт смещения:
   меню «Кейсы» (~1040×500 при DPR 2, три карты + размытие) раскрывалось на 27–33 к/с, карточка с радужной каймой
   листалась на 55. Поэтому:
   — большие поверхности (меню «Кейсы», бургер) — без преломления, CSS-стекло (размытие считает видеокарта; под
     размытием, нужным для чтения текста, изгиб кромки всё равно почти не виден);
   — карточка — преломление одной картой, без радужной каймы (листается на 165 к/с);
   — маленькие пилюли (подсказки, «Сменить») — с каймой: они маленькие и появляются редко.
   ?lensel=card,work-menu — выбрать плашки; ?lenschroma=0|1 — кайма везде выкл./вкл. */
const TARGETS = [".card--stove", ".weather-change", ".hint-label", ".pc-hint__pill"];
const ALL_TARGETS = [...TARGETS, ".work-menu", ".m-menu__in"];
const CHROMA_OFF = ".card--stove";
const SVG_NS = "http://www.w3.org/2000/svg";
const CHROMA_Q = new URLSearchParams(location.search).get("lenschroma");
const ONLY = new URLSearchParams(location.search).get("lensel");

type Lens = { el: HTMLElement; filter: SVGFilterElement; image: SVGFEImageElement; soft: SVGFEGaussianBlurElement; out: SVGFEGaussianBlurElement; dim: SVGElement[]; w: number; h: number; timer: number; maps: SVGFEDisplacementMapElement[] };

/* параметры стекла — как в примере Никиты; ?glass=distortionScale,borderWidth,brightness,opacity,blur,displace */
const G = ((p) => {
  const v = (p ?? "").split(",").map(Number);
  const pick = (i: number, d: number) => (Number.isFinite(v[i]) && p ? v[i] : d);
  return { distortionScale: pick(0, -180), borderWidth: pick(1, 0.07), brightness: pick(2, 50), opacity: pick(3, 0.93), blur: pick(4, 11), displace: pick(5, 0.5), offsets: [0, 10, 20] };
})(new URLSearchParams(location.search).get("glass"));

/** карта смещения (R — сдвиг по x, B — по y; 0,5 — на месте): градиенты по всей плашке, серая середина поверх */
function drawMap(w: number, h: number, radius: number) {
  const c = document.createElement("canvas");
  c.width = Math.max(2, Math.round(w)); c.height = Math.max(2, Math.round(h));
  const ctx = c.getContext("2d")!;
  const img = ctx.createImageData(c.width, c.height);
  const d = img.data;
  for (let j = 0; j < c.height; j++) {
    for (let i = 0; i < c.width; i++) {
      const p = (j * c.width + i) * 4;
      d[p] = Math.round((i / (c.width - 1)) * 255);
      d[p + 1] = 0;
      d[p + 2] = Math.round((j / (c.height - 1)) * 255);
      d[p + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  /* середина: нейтральный серый — сдвига нет; край размыт, переход от изгиба к ровному стеклу плавный */
  const edge = Math.min(w, h) * (G.borderWidth * 0.5);
  const g = Math.round((G.brightness / 100) * 255);
  ctx.filter = `blur(${G.blur}px)`;
  ctx.fillStyle = `rgba(${g},${g},${g},${G.opacity})`;
  ctx.beginPath();
  ctx.roundRect(edge, edge, w - edge * 2, h - edge * 2, Math.max(0, radius - edge));
  ctx.fill();
  return c.toDataURL();
}

export function initGlassLens() {
  const ua = navigator.userAgent;
  if (!/Chrome\/\d+/.test(ua) || matchMedia("(hover: none) and (pointer: coarse)").matches) return;
  if (new URLSearchParams(location.search).get("lens") === "0") return;
  document.documentElement.classList.add("cg-lens");

  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("width", "0");
  svg.setAttribute("height", "0");
  svg.style.cssText = "position:absolute;width:0;height:0;overflow:hidden;pointer-events:none";
  document.body.append(svg);

  const lenses = new Map<HTMLElement, Lens>();
  let n = 0;
  /* ?lensk= множитель силы изгиба */
  const strength = Number(new URLSearchParams(location.search).get("lensk") ?? 1);

  const node = <K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number>) => {
    const e = document.createElementNS(SVG_NS, tag);
    for (const [a, v] of Object.entries(attrs)) e.setAttribute(a, String(v));
    return e;
  };

  const build = (el: HTMLElement): Lens => {
    const id = `cg-lens-${++n}`;
    const MONO = CHROMA_Q === "0" || (CHROMA_Q !== "1" && el.matches(CHROMA_OFF));
    const filter = node("filter", { id, x: 0, y: 0, width: 1, height: 1, filterUnits: "userSpaceOnUse", primitiveUnits: "userSpaceOnUse", "color-interpolation-filters": "sRGB" });
    const image = node("feImage", { x: 0, y: 0, width: 1, height: 1, preserveAspectRatio: "none", result: "map" });
    /* под длинным текстом сцена мягче (fit); у маленьких плашек — без размытия, как в примере */
    const soft = node("feGaussianBlur", { in: "SourceGraphic", stdDeviation: 0, result: "src" });
    const maps: SVGFEDisplacementMapElement[] = [];
    const parts: SVGElement[] = [image, soft];
    if (MONO) {
      const m = node("feDisplacementMap", { in: "src", in2: "map", scale: G.distortionScale, xChannelSelector: "R", yChannelSelector: "B", result: "rgb0" });
      maps.push(m);
      parts.push(m);
    } else ["r", "g", "b"].forEach((ch, i) => {
      const m = node("feDisplacementMap", { in: "src", in2: "map", scale: G.distortionScale, xChannelSelector: "R", yChannelSelector: "B", result: `d${ch}` });
      maps.push(m);
      const keep = ["1 0 0 0 0", "0 1 0 0 0", "0 0 1 0 0"].map((row, k) => (k === i ? row : "0 0 0 0 0")).join(" ") + " 0 0 0 1 0";
      parts.push(m, node("feColorMatrix", { in: `d${ch}`, type: "matrix", values: keep, result: ch }));
    });
    parts.push(
      ...(MONO ? [] : [node("feBlend", { in: "r", in2: "g", mode: "screen", result: "rg" }), node("feBlend", { in: "rg", in2: "b", mode: "screen", result: "rgb0" })]),
      /* displace: лёгкое размытие результата — швы между каналами мягче */
      node("feGaussianBlur", { in: "rgb0", stdDeviation: G.displace, result: "rgb" }),
      /* сцена под стеклом чуть насыщеннее и темнее — белый текст читается без матовой заливки */
      node("feColorMatrix", { in: "rgb", type: "saturate", values: 1.2, result: "sat" }),
      node("feComponentTransfer", { in: "sat" }),
    );
    const tr = parts[parts.length - 1];
    const dim = (["feFuncR", "feFuncG", "feFuncB"] as const).map((f) => node(f, { type: "linear", slope: 0.9 }));
    tr.append(...dim);
    filter.append(...parts);
    svg.append(filter);
    const out = parts.find((p) => p.getAttribute("result") === "rgb") as SVGFEGaussianBlurElement;
    const lens: Lens = { el, filter, image, soft, out, dim, w: 0, h: 0, timer: 0, maps };
    el.style.setProperty("backdrop-filter", `url(#${id})`);
    el.style.setProperty("-webkit-backdrop-filter", `url(#${id})`);
    return lens;
  };

  const fit = (lens: Lens, redraw: boolean) => {
    const w = lens.el.offsetWidth, h = lens.el.offsetHeight;
    if (!w || !h) return;
    for (const e of [lens.filter, lens.image]) { e.setAttribute("width", String(w)); e.setAttribute("height", String(h)); }
    /* сила изгиба — как в примере, но не больше половины короткой стороны: у пилюль высотой 30 px сдвиг на 90 px
       выворачивал бы надпись наизнанку */
    const k = Math.min(1, (Math.min(w, h) * 0.5) / Math.abs(G.distortionScale * 0.5)) * strength;
    lens.maps.forEach((m, i) => m.setAttribute("scale", String((G.distortionScale + G.offsets[i]) * k)));
    /* под длинным текстом (меню, раскрытая карточка) сцена чуть мягче — без матовой заливки, но буквы фона не спорят
       с буквами плашки; маленькие плашки почти не размыты */
    const big = lens.el.matches(".work-menu, .m-menu__in, .card--stove.is-open");
    lens.soft.setAttribute("stdDeviation", big ? "6" : "0");
    /* там же сцена темнее: белый текст на светлом небе иначе тонет */
    lens.dim.forEach((f) => f.setAttribute("slope", big ? "0.74" : "0.9"));
    if (!redraw && lens.w) return;
    lens.w = w; lens.h = h;
    const radius = parseFloat(getComputedStyle(lens.el).borderTopLeftRadius) || 0;
    lens.image.setAttribute("href", drawMap(w, h, radius));
  };

  const ro = new ResizeObserver((entries) => {
    for (const e of entries) {
      const lens = lenses.get(e.target as HTMLElement);
      if (!lens) continue;
      fit(lens, false);
      clearTimeout(lens.timer);
      lens.timer = window.setTimeout(() => fit(lens, true), 140);
    }
  });

  const scan = () => {
    for (const sel of ONLY ? ALL_TARGETS.filter((t) => ONLY.split(",").some((o) => t.includes(o))) : TARGETS) {
      document.querySelectorAll<HTMLElement>(sel).forEach((el) => {
        if (lenses.has(el)) return;
        const lens = build(el);
        lenses.set(el, lens);
        fit(lens, true);
        ro.observe(el);
      });
    }
  };
  scan();
  /* меню и карточка появляются позже (ленивые чанки) — досканировать, когда в DOM что-то добавили */
  let pending = 0;
  new MutationObserver((list) => {
    if (pending || !list.some((m) => m.addedNodes.length)) return;
    pending = requestAnimationFrame(() => { pending = 0; scan(); });
  }).observe(document.body, { childList: true, subtree: true });
}
