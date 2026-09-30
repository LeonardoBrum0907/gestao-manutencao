import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const apiProxy = process.env.API_PROXY ?? "http://127.0.0.1:3000";
const here = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@manutencao/shared": path.resolve(here, "../../packages/shared/src/index.ts"),
    },
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
    proxy: {
      "/api": apiProxy,
      "/health": apiProxy,
    },
  },
});
