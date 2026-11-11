import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { GLTFLoader, type GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";

/* v140: модели холма (кресло со столиком, компьютер, собака) начинают распаковываться раньше, чем собирается сцена.

   Что было: загрузчик жил внутри HillScene, а её конструктор — один сплошной кусок работы (посадка травы, сетки,
   материалы: 1,6 с на ноутбуке, 5–10 с на телефоне). Файлы к этому времени уже скачаны (preload в index.html), но
   разобрать их и отдать в распаковку Draco может только главный поток, а он занят конструктором. Распаковка
   начиналась после него, компьютер — ещё и только после кресла: реквизит приходил последним и держал заставку
   (на телефоне — на 7 с после конца конструктора).

   Теперь файлы берутся и разбираются здесь, до конструктора. Разбор glTF — цепочка обещаний без ожиданий: как только
   файл и декодер на месте, геометрия уходит в воркеры Draco в той же задаче. Дальше воркеры распаковывают её
   параллельно с посадкой травы, и к концу конструктора модели готовы. main.ts ждёт начала распаковки не дольше
   KICK_MS: на медленной сети файлы ещё едут, и стоять ради них незачем — тогда всё идёт по-старому, после сцены. */

const BASE = import.meta.env.BASE_URL;
const KICK_MS = 150;

export type Models = {
  draco: DRACOLoader;
  props: Promise<GLTF>;
  computer: Promise<GLTF | null>;
  /** null — собака выключена (?dog=0) */
  dog: Promise<GLTF | null> | null;
  /** файлы и декодер приехали, распаковка ушла в воркеры — или вышло время ожидания */
  kicked: Promise<void>;
};

let models: Models | null = null;

export function startModels(): Models {
  if (models) return models;
  const draco = new DRACOLoader().setDecoderPath(`${BASE}draco/`).setDecoderConfig({ type: "wasm" }).preload();
  const loader = new GLTFLoader().setDRACOLoader(draco);
  const file = (name: string) => {
    const url = `${BASE}models/${name}`;
    const data = fetch(url).then((r) => {
      if (!r.ok) throw new Error(`${name}: ${r.status}`);
      return r.arrayBuffer();
    });
    return { data, gltf: data.then((buffer) => loader.parseAsync(buffer, `${BASE}models/`)) };
  };
  const props = file("props.glb");
  const computer = file("computer.glb");
  const dog = /[?&]dog=0/.test(location.search) ? null : file("dog.glb");
  /* ошибку кресла сцена обрабатывает сама (холм без реквизита); здесь — только чтобы обещание без слушателя
     не считалось необработанным, пока сцена ещё не подписалась */
  props.gltf.catch(() => {});
  /* декодер готов, когда DRACOLoader скачал обёртку и wasm; поле внутреннее — нет его, просто не ждём */
  const decoder = (draco as unknown as { decoderPending?: Promise<unknown> | null }).decoderPending ?? Promise.resolve();
  const arrived = Promise.all([decoder, props.data, computer.data, dog?.data]).then(() => {}, () => {});
  const kicked = Promise.race([arrived, new Promise<void>((r) => setTimeout(r, KICK_MS))])
    /* задачу вперёд: продолжения разбора (они стоят в очереди микрозадач) успевают отдать геометрию воркерам */
    .then(() => new Promise<void>((r) => setTimeout(r, 0)));
  models = {
    draco,
    props: props.gltf,
    computer: computer.gltf.catch(() => null),
    dog: dog ? dog.gltf.catch(() => null) : null,
    kicked,
  };
  return models;
}

export function disposeModels() {
  models?.draco.dispose();
  models = null;
}
