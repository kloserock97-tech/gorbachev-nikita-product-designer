/* До загрузки страницы: засечь, какие шейдерные программы блокируют главный поток.
   three собирает программу и при первом использовании спрашивает статус линковки — если видеодрайвер ещё
   не закончил, вызов ждёт. Пишем в window.__stalls: сколько ждали и имя материала (#define SHADER_NAME). */
(() => {
  const P = WebGL2RenderingContext.prototype;
  const names = new WeakMap(), progs = new WeakMap();
  window.__stalls = []; window.__links = [];
  const src = P.shaderSource;
  P.shaderSource = function (sh, code) { const m = /#define SHADER_NAME (\S+)/.exec(code); names.set(sh, (m ? m[1] : "?") + " " + code.length); return src.call(this, sh, code); };
  const attach = P.attachShader;
  P.attachShader = function (p, sh) { progs.set(p, (progs.get(p) ? progs.get(p) + " | " : "") + (names.get(sh) ?? "?")); return attach.call(this, p, sh); };
  const link = P.linkProgram;
  P.linkProgram = function (p) { window.__links.push([Math.round(performance.now()), progs.get(p)]); return link.call(this, p); };
  for (const fn of ["getProgramParameter", "getProgramInfoLog", "getUniformLocation", "getActiveUniform", "useProgram"]) {
    const orig = P[fn];
    P[fn] = function (p, ...rest) {
      if (fn === "getProgramParameter" && rest[0] === 0x91b1) return orig.call(this, p, ...rest); // COMPLETION_STATUS_KHR не блокирует
      const t0 = performance.now(); const r = orig.call(this, p, ...rest); const dt = performance.now() - t0;
      if (dt > 4) window.__stalls.push([Math.round(t0), Math.round(dt), fn, progs.get(p)]);
      return r;
    };
  }
})();
