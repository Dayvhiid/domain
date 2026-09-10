import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  publicDir: false,
  
  server: {
    port: 3001,
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3002',
        changeOrigin: true,
        secure: false,
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('Proxy error:', err);
          });
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('Proxying:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('Proxied response:', proxyRes.statusCode, req.url);
          });
        },
      },
    },
  },
  
  build: {
    outDir: '../domain-reseller-backend/public',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: 'index.html',
      },
    },
  },
  
  resolve: {
    alias: {
      '/js': '/js',
    },
  },
});