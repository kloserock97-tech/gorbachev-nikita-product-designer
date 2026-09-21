import { defineConfig } from "vite";

export default defineConfig(({ command }) => ({
  /* сборка с относительными путями: сайт открывается и из корня домена, и с адреса GitHub Pages /<repo>/ */
  base: command === "build" ? "./" : "/",
  build: {
    rolldownOptions: {
      output: {
        /* three.js — половина основного скрипта и меняется раз в несколько месяцев, а код сайта выкатывается
           по нескольку раз в день. В отдельном файле он остаётся в кеше браузера между выкатками: вернувшийся
           посетитель докачивает только код сайта. */
        advancedChunks: { groups: [{ name: "three", test: /node_modules[\/]three[\/]/ }] },
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
