import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { handleIotApiRequest } from './src/server/iotBackend.ts'

function iotBackendPlugin(): Plugin {
  return {
    name: 'iot-backend-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url && req.url.startsWith('/api/devices')) {
          const handled = await handleIotApiRequest(req, res);
          if (handled) return;
        }
        next();
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url && req.url.startsWith('/api/devices')) {
          const handled = await handleIotApiRequest(req, res);
          if (handled) return;
        }
        next();
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    iotBackendPlugin(),
  ],
  server: {
    host: true,
    port: 5173,
  },
})
