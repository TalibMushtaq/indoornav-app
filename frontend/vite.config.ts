import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
// THIS CONFIGURATION IS CORRECT FOR LOCAL DEVELOPMENT
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      // This will forward any request starting with /api to your backend
      '/api': {
        target: 'https://indoornav-app.onrender.com', // The URL of your backend server
        changeOrigin: true,
        secure: false,
      },
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    target: 'esnext'
  }
}));