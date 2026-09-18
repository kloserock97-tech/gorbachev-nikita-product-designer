import { defineConfig } from "vite";

export default defineConfig(({ command }) => ({
  /* сборка с относительными путями: сайт открывается и из корня домена, и с адреса GitHub Pages /<repo>/ */
  base: command === "build" ? "./" : "/",
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
