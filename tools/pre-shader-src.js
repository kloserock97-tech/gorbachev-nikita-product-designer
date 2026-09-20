/* До загрузки: сохранить тексты шейдеров заданной длины — сравнить «одинаковые» программы, собранные дважды. */
(() => {
  const P = WebGL2RenderingContext.prototype, src = P.shaderSource;
  window.__src = {};
  P.shaderSource = function (sh, code) { if ([14880, 12598, 17724, 13437, 4502, 8577].includes(code.length)) (window.__src[code.length] ??= code); return src.call(this, sh, code); };
})();
