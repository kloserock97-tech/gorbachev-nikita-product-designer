/* Диагностика: поймать первые ошибки WebGL с местом вызова.
   node tools/cdp-eval.mjs "JSON.stringify(window.__glerr)" --pre tools/pre-gl-errors.js --cpu 4 --headless

   Оборачивает вызовы отрисовки и спрашивает gl.getError() сразу после каждого: так ошибка привязывается
   к конкретному проходу, а не всплывает в консоли без адреса. getError() синхронный и тормозит — поэтому
   проверка живёт только первые LIMIT ошибок и первые FRAMES кадров. Инструмент отладочный, в сборку не идёт. */
(() => {
  const LIMIT = 12;
  const out = (window.__glerr = { errors: [], draws: 0, frames: 0 });
  const NAMES = { 1280: "INVALID_ENUM", 1281: "INVALID_VALUE", 1282: "INVALID_OPERATION", 1285: "OUT_OF_MEMORY", 1286: "INVALID_FRAMEBUFFER_OPERATION" };

  let frame = 0;
  const bump = () => { frame++; out.frames = frame; requestAnimationFrame(bump); };
  requestAnimationFrame(bump);

  const wrap = (proto, name) => {
    const orig = proto[name];
    if (!orig) return;
    proto[name] = function (...args) {
      const r = orig.apply(this, args);
      out.draws++;
      if (out.errors.length < LIMIT) {
        const e = this.getError();
        if (e) {
          /* что сейчас привязано: программа, её сэмплеры и по какому шейдеру её узнать */
          const samplers = [];
          let marks = [];
          try {
            const p = this.getParameter(this.CURRENT_PROGRAM);
            const n = p ? this.getProgramParameter(p, this.ACTIVE_UNIFORMS) : 0;
            for (let i = 0; i < n; i++) {
              const u = this.getActiveUniform(p, i);
              /* коды типов сэмплеров: 0x8B5E sampler2D, 0x8B62 sampler2DShadow, 0x8DCA isampler2D,
                 0x8DD2 usampler2D, 0x8B60 samplerCube, 0x8DC5 sampler2DArrayShadow, 0x8DC1 sampler2DArray */
              if (u && [0x8b5e, 0x8b62, 0x8dca, 0x8dd2, 0x8b60, 0x8dc5, 0x8dc1, 0x8dc4, 0x8dc2, 0x8b5f].includes(u.type)) {
                samplers.push(`${u.name}:${u.type.toString(16)}`);
              }
            }
            /* по каким строкам узнать материал: три шейдера подряд не держим, берём приметы из исходника */
            const src = (this.getAttachedShaders(p) || []).map((s) => this.getShaderSource(s) || "").join("\n");
            const words = ["blade", "grass", "GRASS", "godray", "rays", "sky", "dome", "water", "fog", "dust", "dog", "fur", "screen", "crt", "moss", "ice", "glass", "shadowMap", "depthTex", "tDepth", "envMap", "lightMap", "aoMap", "sheen", "transmission"];
            marks = words.filter((w) => src.includes(w));
          } catch { /* программы уже нет */ }
          out.errors.push({
            call: name,
            code: NAMES[e] || e,
            frame,
            draw: out.draws,
            fb: !!this.getParameter(this.FRAMEBUFFER_BINDING),
            samplers: samplers.slice(0, 16),
            marks: marks.slice(0, 14),
          });
        }
      }
      return r;
    };
  };

  for (const proto of [WebGL2RenderingContext.prototype, WebGLRenderingContext.prototype]) {
    for (const name of ["drawElements", "drawArrays", "drawElementsInstanced", "drawArraysInstanced"]) wrap(proto, name);
  }
})();
