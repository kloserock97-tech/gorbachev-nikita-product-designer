import { defineConfig, type Plugin } from "vite";

/* v96: GLSL в шаблонных строках уходил в прод с комментариями (~27 КБ, минификатор строки не трогает).
   На сборке режем блочные комментарии в файлах с шейдерами; строчных `//` в GLSL проекта нет */
const stripGlslComments = (): Plugin => ({
  name: "strip-glsl-comments",
  apply: "build",
  enforce: "pre", // до перевода TypeScript: иначе маркер-комментарий glsl уже вырезан, и файл не узнать
  transform(code, id) {
    if (!/\.ts$/.test(id) || !code.includes("/* glsl */")) return null;
    return { code: code.replace(/\/\*(?!\s*glsl\s*\*\/)[\s\S]*?\*\//g, ""), map: null };
  },
});

export default defineConfig(({ command }) => ({
  plugins: [stripGlslComments()],
  /* сборка с относительными путями: сайт открывается и из корня домена, и с адреса GitHub Pages /<repo>/ */
  base: command === "build" ? "./" : "/",
  build: {
    rolldownOptions: {
      output: {
        /* three.js — половина основного скрипта и меняется раз в несколько месяцев, а код сайта выкатывается
           по нескольку раз в день. В отдельном файле он остаётся в кеше браузера между выкатками: вернувшийся
           посетитель докачивает только код сайта. */
        /* v96: только ядро three; дополнения (загрузчики, линии для сцен кейсов) идут с теми чанками, которым нужны */
        advancedChunks: { groups: [{ name: "three", test: /node_modules[\/]three[\/]build[\/]/ }] },
      },
    },
    /* three один весит больше порога предупреждения, и делить его дальше незачем */
    chunkSizeWarningLimit: 700,
  },
  server: {
    host: "127.0.0.1",
    port: 5190,
    strictPort: true,
    /* большие .blend и скриншоты не нужны dev-серверу, а их копирование
       роняет watcher с EBUSY на Windows */
    watch: {
      ignored: ["**/assets-src/**", "**/reference/**", "**/shots/**", "**/public/**", "**/*.{hdr,glb,blend,jpg,png,webp,woff2,wasm}"],
    },
  },
}));
