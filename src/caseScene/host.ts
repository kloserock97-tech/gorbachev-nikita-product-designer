/* v79: общий хост сцен кейсов — один холст, один WebGL-контекст и один цикл кадров на все восемь сцен.
   Цикл крутится, только пока хоть одна сцена на экране или доигрывает вход; в кадре рисуются лишь видимые
   (при смене кейса — две: уходящая и приходящая). Когда рисовать нечего, холст прячется: пустой прозрачный
   слой во всё окно браузер всё равно смешивал бы с кадром. */
import * as THREE from "three";
import { createHost } from "./engine";
import type { Driven, SceneHost } from "./kit";

export type CaseHost = SceneHost & {
  resize(): void;
  /** глава ушла с экрана — цикл встаёт, даже если у сцены осталось присутствие */
  pause(): void;
  resume(): void;
};

export function createCaseHost(canvas: HTMLCanvasElement): CaseHost {
  const gl = createHost(canvas);
  const list: Driven[] = [];
  const res = new THREE.Vector2();
  let raf = 0, last = 0, paused = false, drawn = false;

  const frame = (now: number) => {
    raf = 0;
    const dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016);
    last = now;
    const live = list.filter((d) => d.active());
    if (live.length) {
      for (const d of live) d.update(now, dt);
      gl.renderer.getDrawingBufferSize(res);
      gl.renderer.clear();
      for (const d of live) d.draw(res);
      drawn = true;
      canvas.style.visibility = "";
      if (!paused) kick();
    } else if (drawn) {
      gl.renderer.clear();
      drawn = false;
      canvas.style.visibility = "hidden";
    }
  };
  const kick = () => { if (!raf && !paused) raf = requestAnimationFrame(frame); };

  return {
    gl,
    add(d) { list.push(d); },
    kick,
    resize() { gl.resize(); kick(); },
    pause() { paused = true; cancelAnimationFrame(raf); raf = 0; last = 0; },
    resume() { paused = false; kick(); },
  };
}
