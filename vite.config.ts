/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// En desarrollo, /api se reenvía al backend local (uvicorn en :8080).
const proxy = { "/api": process.env.VITE_API_TARGET ?? "http://localhost:8080" };

export default defineConfig({
  plugins: [react(), tailwindcss()],
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
