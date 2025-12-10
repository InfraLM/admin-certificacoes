import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  // Base path para deploy em /admin-certificacoes/
  base: '/admin-certificacoes/',
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    {
      name: 'redirect-base-middleware',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url === '/admin-certificacoes') {
            res.writeHead(301, { Location: '/admin-certificacoes/' });
            res.end();
          } else {
            next();
          }
        });
      }
    }
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
