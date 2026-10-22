/* заглушка живого прототипа: экран-плашка с кнопкой «дальше» — заменяется настоящим интерфейсом */
import type { LiveProto } from "./types";

const proto: LiveProto = {
  design: { w: 1100 },
  mount(root, ctx) {
    let at = 0;
    root.innerHTML = '<div style="display:grid;place-items:center;height:100%;font:600 28px Onest,sans-serif;background:#eef">'
      + '<button type="button" class="pt-hint" style="font:inherit;padding:16px 28px;border-radius:16px;border:0;background:#2478ff;color:#fff">agents · <span></span></button></div>';
    const btn = root.querySelector("button")!;
    const paint = () => { btn.querySelector("span")!.textContent = String(at + 1); };
    btn.addEventListener("click", () => { at += 1; paint(); ctx.go(at); });
    paint();
    return { show(k) { at = k; paint(); }, destroy() { root.innerHTML = ""; } };
  },
};
export default proto;
