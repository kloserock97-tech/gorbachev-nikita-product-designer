/* Счётчики для сквозного замера (tools/cdp-journey.mjs). Вставляется до загрузки страницы.
   window.__j.frames — отметки кадров (время, прокрутка); __j.loaf — долгие кадры (Long Animation Frames) с виновными
   скриптами; __j.gl.take() — вызовы отрисовки, экземпляры и время видеокарты по каждому WebGL-холсту с прошлого вызова.

   Время видеокарты: на каждом тике rAF запрос TIME_ELAPSED закрывается и открывается заново, так что он охватывает
   всю работу, отправленную между тиками. Свой регулятор качества страницы пользуется тем же расширением, а два
   активных запроса в одном контексте нельзя — поэтому с --gpu мерить только вместе с ?governor=0. */
(() => {
  const GPU = /[?&]jgpu=1/.test(location.search);
  const j = (window.__j = { frames: [], loaf: [], marks: {} });

  /* кадры: свой rAF, зарегистрированный первым, — интервалы, которые видит человек */
  const raf = window.requestAnimationFrame.bind(window);
  const tick = (t) => { j.frames.push(t, scrollY); gpuTick(); raf(tick); };

  /* долгие кадры с атрибуцией скриптов */
  try {
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) {
        j.loaf.push({
          start: e.startTime, dur: e.duration, block: e.blockingDuration, render: e.renderStart ? e.startTime + e.duration - e.renderStart : 0,
          style: e.styleAndLayoutStart ? e.startTime + e.duration - e.styleAndLayoutStart : 0,
          scripts: (e.scripts || []).map((s) => ({ dur: s.duration, inv: s.invoker, fn: s.sourceFunctionName, url: (s.sourceURL || "").replace(/^.*\//, ""), at: s.sourceCharPosition, type: s.invokerType, layout: s.forcedStyleAndLayoutDuration })),
        });
      }
    }).observe({ type: "long-animation-frame", buffered: true });
  } catch { /* старый браузер */ }

  /* WebGL: контексты, вызовы, экземпляры, время видеокарты */
  const list = [];
  const orig = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (type, opts) {
    const ctx = orig.call(this, type, opts);
    if (ctx && /webgl/.test(type) && !list.some((e) => e.ctx === ctx)) {
      const ext = GPU && type === "webgl2" ? ctx.getExtension("EXT_disjoint_timer_query_webgl2") : null;
      list.push({ ctx, canvas: this, draws: 0, instances: 0, name: this.id || this.className || "canvas", ext, q: null, pending: [], gpu: 0, gpuN: 0 });
    }
    return ctx;
  };
  const find = (ctx) => list.find((e) => e.ctx === ctx);
  for (const proto of [WebGL2RenderingContext.prototype, WebGLRenderingContext.prototype]) {
    for (const fn of ["drawArrays", "drawElements", "drawArraysInstanced", "drawElementsInstanced"]) {
      const f = proto[fn];
      if (!f) continue;
      proto[fn] = function (...a) {
        const e = find(this);
        if (e) { e.draws++; e.instances += fn.endsWith("Instanced") ? a[fn === "drawArraysInstanced" ? 3 : 4] : 1; }
        return f.apply(this, a);
      };
    }
  }
  function gpuTick() {
    for (const e of list) {
      if (!e.ext || e.ctx.isContextLost()) continue;
      const gl = e.ctx;
      if (e.q) { gl.endQuery(e.ext.TIME_ELAPSED_EXT); e.pending.push(e.q); e.q = null; }
      while (e.pending.length && gl.getQueryParameter(e.pending[0], gl.QUERY_RESULT_AVAILABLE)) {
        const q = e.pending.shift();
        if (!gl.getParameter(e.ext.GPU_DISJOINT_EXT)) { e.gpu += gl.getQueryParameter(q, gl.QUERY_RESULT) / 1e6; e.gpuN++; }
        gl.deleteQuery(q);
      }
      if (e.pending.length < 8) { e.q = gl.createQuery(); gl.beginQuery(e.ext.TIME_ELAPSED_EXT, e.q); }
    }
  }
  j.gl = {
    take() {
      return list.map((e) => {
        const c = e.canvas, cs = c.isConnected ? getComputedStyle(c) : null;
        const o = { name: e.name, draws: e.draws, instances: e.instances, px: `${c.width}x${c.height}`, gpu: e.gpuN ? e.gpu / e.gpuN : null,
          shown: !!cs && cs.display !== "none" && cs.visibility !== "hidden" && +cs.opacity > 0, lost: e.ctx.isContextLost() };
        e.draws = 0; e.instances = 0; e.gpu = 0; e.gpuN = 0;
        return o;
      });
    },
  };
  raf(tick);
})();
