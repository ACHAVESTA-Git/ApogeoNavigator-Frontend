import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// En desarrollo, /api se reenvía al backend local (uvicorn en :8080).
export default defineConfig({
  plugins: [react()],
  server: { proxy: { "/api": process.env.VITE_API_TARGET ?? "http://localhost:8080" } },
});
