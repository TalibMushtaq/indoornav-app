import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    // --- ADD THIS PROXY CONFIG ---
    proxy: {
      // This will forward any request starting with /api to your backend
      '/api': {
        target: 'https://indoornav-app.onrender.com/api/', // ❗️ IMPORTANT: The URL of your backend server
        changeOrigin: true, // Recommended for this setup
        secure: false,      // Can be false for local http development
      },
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    target: 'esnext'
  }
}));