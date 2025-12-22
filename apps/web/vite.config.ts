import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";
import { defineConfig } from "vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@composer/shared": path.resolve(
        __dirname,
        "../../packages/shared/src/index.ts"
      ),
    },
    preserveSymlinks: false,
  },
  optimizeDeps: {
    exclude: ["@composer/shared"],
  },
  server: {
    port: 5173,
  },
});
