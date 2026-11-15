/// <reference types="vitest/config" />
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// En desarrollo, /api se reenvía al backend local (uvicorn en :8080).
const proxy = { "/api": process.env.VITE_API_TARGET ?? "http://localhost:8080" };

/**
 * Precarga la fuente de texto (subconjunto latino) desde el HTML: así llega antes del primer pintado y el
 * titular del inicio no se vuelve a partir al cambiar la fuente de respaldo por la definitiva (CLS).
 */
const precargarFuentes = (patrones: RegExp[]): Plugin => ({
  name: "precargar-fuentes",
  apply: "build",
  transformIndexHtml: {
    order: "post",
    handler: (_html, ctx) =>
      Object.keys(ctx.bundle ?? {})
        .filter((archivo) => patrones.some((p) => p.test(archivo)))
        .map((archivo) => ({
          tag: "link",
          attrs: { rel: "preload", as: "font", type: "font/woff2", href: `/${archivo}`, crossorigin: "" },
          injectTo: "head-prepend" as const,
        })),
  },
});

export default defineConfig({
  plugins: [react(), tailwindcss(), precargarFuentes([/archivo-latin-wdth-normal-.*\.woff2$/])],
  server: { proxy },
  preview: { proxy },
  build: {
    rollupOptions: {
      output: {
        // d3 compartido por las rutas con gráficos, fuera del JS inicial.
        manualChunks: (id) => (/node_modules\/(d3-|internmap)/.test(id) ? "graficos" : undefined),
      },
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["src/test/setup.ts"],
    css: false,
    coverage: { include: ["src/lib/**"] },
  },
});
