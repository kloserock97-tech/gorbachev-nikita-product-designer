/* Подсчёт работы видеокарты по холстам (v79): сколько WebGL-контекстов живо, сколько вызовов отрисовки и
   экземпляров (instances) уходит за кадр в каждом. Вставляется до загрузки страницы:
   node tools/cdp-chapter-perf.mjs (сам подключает этот файл).
   window.__gl.contexts — список контекстов; window.__gl.take() — счётчики с прошлого вызова и сброс. */
(() => {
  const list = [];
  const orig = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (type, opts) {
    const ctx = orig.call(this, type, opts);
    if (ctx && /webgl/.test(type) && !list.some((e) => e.ctx === ctx)) {
      list.push({ ctx, canvas: this, draws: 0, instances: 0, name: this.className || this.id || "canvas" });
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
  window.__gl = {
    contexts: list,
    take() {
      const r = list.map((e) => {
        const c = e.canvas;
        const o = { name: e.name, draws: e.draws, instances: e.instances, px: `${c.width}x${c.height}`, shown: !!c.isConnected && getComputedStyle(c).display !== "none" && getComputedStyle(c).visibility !== "hidden" && +getComputedStyle(c).opacity > 0, lost: e.ctx.isContextLost() };
        e.draws = 0; e.instances = 0;
        return o;
      });
      return r;
    },
  };
})();
