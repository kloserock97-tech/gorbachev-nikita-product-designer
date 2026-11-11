/* v140: разовые тяжёлые дела загрузки, которым не место посреди анимации.

   Текстура фоновых слов для About (0,1–0,15 с на ноутбуке, до 0,8 с на телефоне) и создание AudioContext (на Windows
   ~0,23 с — синхронная инициализация звукового устройства) раньше уходили в requestIdleCallback: «когда браузер
   свободен». Свободен он оказывался ровно тогда, когда сцена готова и вуаль заставки начинает таять, — и проявление
   холма замирало на четверть секунды. Теперь такие дела встают в очередь, очередь запускается, когда модели приехали
   и видеокарта собирает их шейдеры (главный поток в это время всё равно ждёт), а заставка начинает таять только
   после того, как очередь опустела. Каждое дело — отдельной задачей, чтобы между ними успевали кадры. */

const queue: (() => void)[] = [];
const waiting: (() => void)[] = [];
let open = false;
let running = false;
let safety = 0;

function pump() {
  if (running) return;
  running = true;
  const step = () => {
    const job = queue.shift();
    if (!job) {
      running = false;
      waiting.splice(0).forEach((done) => done());
      return;
    }
    try { job(); } catch (error) { console.warn("отложенное дело загрузки не выполнилось", error); }
    setTimeout(step, 0);
  };
  setTimeout(step, 0);
}

/** поставить дело в очередь; если очередь так никто и не запустил (сцена без заставки, стенд) — через 3 с она пойдёт сама */
export function chore(job: () => void) {
  queue.push(job);
  if (open) pump();
  else safety ||= window.setTimeout(runChores, 3000);
}

/** запустить очередь; обещание выполняется, когда она пуста */
export function runChores(): Promise<void> {
  open = true;
  clearTimeout(safety);
  return new Promise((done) => {
    waiting.push(done);
    pump();
  });
}
