/* v78: стенд сцены кейса (только для разработки, в сборку не входит): сцена поверх кадра луга, референс
   накладывается сверху для сверки. R — референс 0/50/100 %, B — фон, I — проиграть вход заново.
   ?case=<id из registry.ts>, ?still=1 — сразу готовый кадр (для снимков), ?ref=0.5 — референс сразу поверх.
   Кадры для стенда: assets-src/stand/bg-<id>.webp (луг без карточки) и ref-<id>.png (референс). */
import { SCENES, type SceneId } from "./registry";

const bgs = import.meta.glob("../../assets-src/stand/bg-*.webp", { query: "?url", import: "default", eager: true }) as Record<string, string>;
const refs = import.meta.glob("../../assets-src/stand/ref-*.png", { query: "?url", import: "default", eager: true }) as Record<string, string>;

const canvas = document.querySelector<HTMLCanvasElement>("#scene")!;
const ref = document.querySelector<HTMLImageElement>(".ref")!;
const bg = document.querySelector<HTMLImageElement>(".bg")!;
const q = new URLSearchParams(location.search);
const id = (q.get("case") ?? "community") as SceneId;
bg.src = bgs[`../../assets-src/stand/bg-${id}.webp`] ?? "";
ref.src = refs[`../../assets-src/stand/ref-${id}.png`] ?? "";
const levels = [0, 0.5, 1];
let li = Math.max(0, levels.indexOf(+(q.get("ref") ?? 0)));
ref.style.opacity = String(levels[li]);
const s = (await (SCENES[id] ?? SCENES.community)())(canvas);
addEventListener("keydown", (e) => {
  if (e.key === "r" || e.key === "к") { li = (li + 1) % levels.length; ref.style.opacity = String(levels[li]); }
  if (e.key === "b" || e.key === "и") bg.hidden = !bg.hidden;
  if (e.key === "i" || e.key === "ш") { s.setPresence(0); requestAnimationFrame(() => requestAnimationFrame(() => s.setPresence(1))); }
});
addEventListener("resize", () => s.stage.resize());
if (q.get("still") !== "1") addEventListener("pointermove", (e) => s.setPointer((e.clientX / innerWidth) * 2 - 1, (e.clientY / innerHeight) * 2 - 1));
void s.ready.then(() => {
  if (q.get("still") === "1") s.still(); else s.setPresence(1);
  (window as unknown as { sceneReady: boolean }).sceneReady = true;
});
