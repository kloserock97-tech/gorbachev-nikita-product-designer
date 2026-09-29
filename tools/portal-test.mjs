import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { tmpdir } from "node:os";
import assert from "node:assert/strict";
import { launch, sleep } from "./lib/chrome.mjs";

const mobile = process.argv.includes("--mobile");
const reduced = process.argv.includes("--reduced");
const noWalk = process.argv.includes("--no-walk");
const live = process.argv.includes("--live");
const motion = process.argv.includes("--motion");
const name = live ? "live" : noWalk ? "no-walk" : reduced ? "reduced" : mobile ? "mobile" : "desktop";
const out = resolve("shots/portal", name);
mkdirSync(out, { recursive: true });
const errors = [];
const port = 9373;
const { send, close } = await launch(port, [
  `--remote-debugging-port=${port}`, `--user-data-dir=${resolve(tmpdir(), "portfolio-portal-test")}`,
  "--headless=new", "--use-angle=d3d11", "--enable-gpu", "--ignore-gpu-blocklist",
  "--no-first-run", "--no-default-browser-check", "--remote-allow-origins=*",
  "--disable-background-timer-throttling", "--disable-renderer-backgrounding", "about:blank",
], { onEvent(m) {
  if (m.method === "Runtime.exceptionThrown") errors.push(m.params.exceptionDetails);
  if (m.method === "Log.entryAdded" && m.params.entry.level === "error") errors.push(m.params.entry);
  if (m.method === "Runtime.consoleAPICalled" && m.params.type === "error") errors.push(m.params.args);
} });
const evaluate = async (expression) => {
  const r = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  if (r.result?.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails));
  return r.result?.result?.value;
};
try {
  await send("Page.enable"); await send("Runtime.enable"); await send("Log.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: mobile ? 390 : 1440, height: mobile ? 844 : 900, deviceScaleFactor: 1, mobile });
  if (reduced) await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
  await send("Page.navigate", { url: `${live ? "https://kloserock97-tech.github.io/gorbachev-nikita-product-designer/" : (process.env.PORTAL_TEST_URL || "http://127.0.0.1:5191/")}?intro=0&lite=0&lang=en${noWalk ? "&walk=0" : ""}` });
  for (let i = 0; i < 80; i++) {
    if (await evaluate("!!window.__hill && window.__hill.renderedFrames > 20")) break;
    await sleep(500);
  }
  assert(await evaluate("!!window.__hill && window.__hill.renderedFrames > 20"), "3D scene did not start");
  // Drive the actual document scroll; the existing damping and chapter layout remain active.
  const scroll = async (f) => {
    await evaluate(`(() => { const [a,b] = __story.chapter(); const p = ${f} < 0 ? b - 0.01 : b + (1-b)*${f};
      window.scrollTo(0, __story.topFor(p)); })()`);
    await sleep(1700);
    // The slower portal damping takes longer to settle than the other chapters.
    for (let i = 0; i < 30; i++) {
      if (await evaluate("Math.abs(__hill.storyProgress - __hill.storyTarget) < 1e-5")) break;
      await sleep(100);
    }
  };
  await scroll(-1);
  if (!noWalk) {
    for (let i = 0; i < 60; i++) {
      if (await evaluate("__hill.walkReady")) break;
      await sleep(500);
    }
    assert(await evaluate("__hill.walkReady"), "Meadow shaders did not become ready");
  }
  const frames = [];
  for (const f of [0.08, 0.16, 0.26, 0.38, 0.5, 0.60, 0.72, 1, 0.38, 0.12, -1]) {
    await scroll(f);
    const state = await evaluate(`(() => { const s = __hill; const footer = document.querySelector('.site-footer');
      return { f: s.storyCh3, portal: s.fx.params.portal, clip: s.footerPortalClip, pos: s.walk?.camera.position.toArray(),
        portalPos: s.walk?.portal?.group.position.toArray(), footer: footer.className, inert: footer.inert,
        gl: s.renderer.getContext().getError(), rendered: s.renderedFrames }; })()`);
    frames.push(state);
    assert.equal(state.gl, 0, `WebGL error at ${f}`);
    // v84: footer ends at the threshold, so the doorway preview sits mid-chapter (portal ≈0.28 desktop, ≈0.23 phone)
    if (!live && f === 0.5 && !reduced && !noWalk) assert(state.clip?.startsWith("polygon"), "Missing world-space portal");
    if (reduced || noWalk) assert.equal(state.portal, 0, "Fallback unexpectedly enables portal motion");
    if (state.clip === "inset(0)") assert(!state.inert, "Contacts stay inert after entering the portal");
    if (f === 1) assert(!state.inert && state.footer.includes("is-on"), "Footer is not interactive");
    if (f === -1) assert(state.inert && !state.footer.includes("is-portal-preview"), "Reverse scroll left footer exposed");
    const shot = await send("Page.captureScreenshot", { format: "jpeg", quality: 85 });
    writeFileSync(resolve(out, `${frames.length}-${f}.jpg`), Buffer.from(shot.result.data, "base64"));
    console.log(JSON.stringify({ ...state, clip: state.clip?.startsWith("polygon") ? "polygon(...)" : state.clip }));
  }
  if (!live && !reduced && !noWalk) {
    assert.deepEqual(frames[3].portalPos, frames[8].portalPos, "Doorway drifted while scrolling");
    assert.deepEqual(frames[3].pos, frames[8].pos, "Reverse scroll did not retrace the camera route");
  }
  writeFileSync(resolve(out, "results.json"), JSON.stringify({ frames, errors }, null, 2));
  assert.equal(errors.length, 0, JSON.stringify(errors));
  if (motion && !reduced && !noWalk && !live) {
    await scroll(0);
    // Continuous document scrolling, with a frame-by-frame camera trace.
    await evaluate(`(() => {
      const b = __story.chapter()[1], started = performance.now();
      window.__portalMotion = [];
      const tick = (now) => {
        const u = Math.min(1, (now - started) / 8000);
        scrollTo(0, __story.topFor(b + (1-b) * u * 0.82));
        __portalMotion.push({ ms: now - started, f: __hill.storyCh3, pos: __hill.walk.camera.position.toArray() });
        if (u < 1) requestAnimationFrame(tick);
      }; requestAnimationFrame(tick);
    })()`);
    for (let i = 0; i < 12; i++) {
      await sleep(700);
      const shot = await send("Page.captureScreenshot", { format: "jpeg", quality: 85 });
      writeFileSync(resolve(out, `motion-${String(i).padStart(2, "0")}.jpg`), Buffer.from(shot.result.data, "base64"));
    }
    const trace = await evaluate("__portalMotion");
    assert(trace.length > 40, "Continuous scroll did not render enough frames");
    assert(trace.every((frame, i) => i === 0 || frame.f >= trace[i - 1].f - 1e-5), "Camera progress reversed during forward scroll");
    assert(trace.every((frame) => frame.pos.every(Number.isFinite)), "Invalid camera pose during continuous scroll");
    assert.equal(errors.length, 0, JSON.stringify(errors));
    writeFileSync(resolve(out, "motion.json"), JSON.stringify(trace));
    console.log(`PASS continuous scroll: ${trace.length} frames, monotonic progress, finite camera poses`);
  }
  console.log(`PASS ${name}: forward/reverse scroll, footer interaction, WebGL and browser errors`);
} finally { close(); }
