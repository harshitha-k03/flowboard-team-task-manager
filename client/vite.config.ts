import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src")
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (
              id.includes("/node_modules/react/") ||
              id.includes("/node_modules/react-dom/") ||
              id.includes("/node_modules/react-router-dom/") ||
              id.includes("/node_modules/scheduler/")
            ) {
              return "react-vendor";
            }

            if (id.includes("recharts")) {
              return "charts-vendor";
            }

            if (id.includes("@dnd-kit")) {
              return "dnd-vendor";
            }

            if (id.includes("@radix-ui")) {
              return "radix-vendor";
            }
          }

          return undefined;
        }
      }
    }
  }
});
