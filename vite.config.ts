import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;

          if (/[\\/]node_modules[\\/](react|react-dom|react-router-dom)[\\/]/.test(id)) {
            return "react-vendor";
          }
          if (id.includes("@tauri-apps")) {
            return "tauri-vendor";
          }
          if (id.includes("exceljs") || id.includes("xlsx")) {
            return "preview-excel";
          }
          if (id.includes("pdfjs-dist")) {
            return "preview-pdf";
          }
          if (id.includes("@dnd-kit")) {
            return "dnd-vendor";
          }
          if (id.includes("framer-motion") || id.includes("lucide-react")) {
            return "ui-vendor";
          }
        },
      },
    },
  },
});
