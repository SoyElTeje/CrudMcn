import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: "dist",
    sourcemap: false,
    minify: "terser",
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"],
          router: ["react-router-dom"],
          ui: ["lucide-react", "class-variance-authority"],
        },
      },
    },
  },
  preview: {
    port: parseInt(process.env.VITE_PREVIEW_PORT || "4173", 10),
    host: process.env.VITE_HOST || "0.0.0.0",
    strictPort: false, // Permitir usar otro puerto si el configurado está ocupado
  },
  server: {
    port: parseInt(process.env.VITE_PREVIEW_PORT || "4173", 10),
    host: process.env.VITE_HOST || "0.0.0.0",
    strictPort: false, // Permitir usar otro puerto si el configurado está ocupado
  },
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version || "1.0.0"),
  },
});



























