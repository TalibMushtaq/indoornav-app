import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Determine the backend URL based on environment
  const getBackendUrl = () => {
    if (mode === 'development') {
      // For local development, use localhost
      return 'http://localhost:5000';
    } else {
      // For production, use your deployed backend URL
      return 'https://indoornav-app.onrender.com';
    }
  };

  return {
    server: {
      host: "::",
      port: 8080,
      proxy: {
        // This will forward any request starting with /api to your backend
        '/api': {
          target: getBackendUrl(),
          changeOrigin: true,
          secure: false,
          configure: (proxy, _options) => {
            proxy.on('error', (err, _req, _res) => {
              console.log('proxy error', err);
            });
            proxy.on('proxyReq', (proxyReq, req, _res) => {
              console.log('Sending Request to the Target:', req.method, req.url);
            });
            proxy.on('proxyRes', (proxyRes, req, _res) => {
              console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
            });
          },
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
  };
});