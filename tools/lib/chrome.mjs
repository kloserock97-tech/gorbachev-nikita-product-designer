/* Общий запуск Chrome для инструментов проверки (v63).
   До этого у каждого инструмента была своя копия: запустить Chrome с отладочным портом, дождаться вкладки, открыть
   WebSocket, сделать send(). Ни одна копия не гасила браузер, если инструмент падал или его обрывал внешний таймаут,
   и зависший Chrome держал порт: следующий запуск подключался к нему и тоже зависал. Здесь это закрыто с двух
   сторон: перед стартом порт освобождается от остатков прошлого прогона, а при любом выходе процесса браузер гасится. */
import { spawn, execFileSync } from "node:child_process";

export const CHROME = process.env.CHROME ?? "C:/Program Files/Google/Chrome/Application/chrome.exe";
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** убить Chrome, оставшийся на этом отладочном порту от прошлого запуска */
export function freePort(port) {
  try {
    if (process.platform === "win32") {
      execFileSync("powershell", ["-NoProfile", "-Command",
        `Get-CimInstance Win32_Process -Filter "Name='chrome.exe'" | Where-Object { $_.CommandLine -match 'remote-debugging-port=${port}( |$)' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }`,
      ], { stdio: "ignore", timeout: 20000 });
    } else execFileSync("pkill", ["-f", `remote-debugging-port=${port}`], { stdio: "ignore" });
  } catch { /* некого убивать — это нормальный случай */ }
}

/** Запустить Chrome и подключиться к первой вкладке.
    args — все флаги Chrome, включая --remote-debugging-port и --user-data-dir: они у инструментов разные.
    onEvent(m) получает сообщения протокола, которые не являются ответами на send(). */
export async function launch(port, args, { onEvent } = {}) {
  freePort(port);
  const chrome = spawn(CHROME, args, { stdio: "ignore" });
  const stop = () => { try { chrome.kill(); } catch { /* уже закрыт */ } };
  process.once("exit", stop);
  for (const signal of ["SIGINT", "SIGTERM", "SIGHUP"]) process.once(signal, () => { stop(); process.exit(130); });
  process.once("uncaughtException", (error) => { console.error(error); stop(); process.exit(1); });
  process.once("unhandledRejection", (error) => { console.error(error); stop(); process.exit(1); });

  let target;
  for (let i = 0; i < 60 && !target; i++) {
    await sleep(250);
    try { target = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find((t) => t.type === "page"); } catch { /* ещё поднимается */ }
  }
  if (!target) { stop(); throw new Error(`Chrome не поднялся на порту ${port}`); }
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { ws.addEventListener("open", resolve, { once: true }); ws.addEventListener("error", reject, { once: true }); });
  let id = 0;
  const pending = new Map();
  ws.addEventListener("message", (e) => {
    const m = JSON.parse(e.data);
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
    else onEvent?.(m);
  });
  const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  return { chrome, ws, send, close() { try { ws.close(); } catch { /* уже закрыт */ } stop(); } };
}
