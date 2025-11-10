import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: process.env.VITE_HOST || "0.0.0.0", // Permite acceso desde red local
    port: parseInt(process.env.VITE_PORT || "5173", 10),
    strictPort: false, // Permitir usar otro puerto si el configurado está ocupado
  },
  build: {
    outDir: "dist",
    sourcemap: mode === "development",
    minify: mode === "production",
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"],
          ui: ["@radix-ui/react-select", "lucide-react"],
        },
      },
    },
  },
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
  },
}));
