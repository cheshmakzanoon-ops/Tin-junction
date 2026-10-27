import { defineConfig } from "vite";

export default defineConfig({
  root: "web",
  base: "./",
  server: { strictPort: true },
  build: { outDir: "../dist/web", emptyOutDir: false },
  preview: { host: "127.0.0.1", port: 4173, strictPort: true },
});
