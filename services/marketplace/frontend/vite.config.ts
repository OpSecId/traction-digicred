import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';
import fs from 'fs';
import { VitePWA } from 'vite-plugin-pwa';

function getAllowedHosts(): string[] | true {
  // Prefer CORS_ORIGIN env (same as backend) - comma-separated origins
  const origins = process.env.CORS_ORIGIN?.split(',').map((o) => o.trim()).filter(Boolean);
  if (origins?.length) {
    const hosts = origins
      .map((origin) => {
        try {
          return new URL(origin).hostname;
        } catch {
          return null;
        }
      })
      .filter((h): h is string => !!h);
    if (hosts.length) {
      const wildcards = [...new Set(hosts.map((h) => `.${h.split('.').slice(-2).join('.')}`))];
      return [...hosts, ...wildcards];
    }
  }
  // Fallback: config.json app.domain
  try {
    const configPath = path.resolve(__dirname, 'public/config.json');
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      const domain = config?.app?.domain;
      if (domain) {
        const host = new URL(domain).hostname;
        return [host, `.${host.split('.').slice(-2).join('.')}`];
      }
    }
  } catch {
    // ignore
  }
  return true;
}

export default defineConfig({
  envDir: path.resolve(__dirname, '..'),
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['img/digicred/*.png', 'img/digicred/*.svg', 'config.json'],
      manifest: {
        name: 'Apply Utopia',
        short_name: 'Apply Utopia',
        description: 'Discover jobs and manage your career with Apply Utopia',
        theme_color: '#003366',
        background_color: '#F5F5F5',
        display: 'standalone',
        orientation: 'portrait-primary',
        start_url: '/',
        scope: '/',
        id: '/',
        categories: ['business', 'productivity', 'education'],
        icons: [
          {
            src: '/img/digicred/digicred.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/img/digicred/digicred.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: '/img/digicred/digicred.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
        ],
        screenshots: [],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,json}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\./i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24, // 24 hours
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /^https:\/\/images\.unsplash\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'image-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
            },
          },
        ],
      },
      devOptions: {
        enabled: false,
        type: 'module',
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@use "@/assets/variables.scss" as *;`,
        api: 'modern-compiler',
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx,vue}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'src/test/', '**/*.d.ts', '**/*.spec.ts', '**/*.test.ts'],
    },
  },
  server: {
    port: 5175,
    host: '0.0.0.0',
    allowedHosts: getAllowedHosts(),
    proxy: {
      '/api/config/demo': {
        target: process.env.VITE_API_TARGET || 'http://127.0.0.1:5174',
        changeOrigin: true,
        bypass: () => '/demo.json', // serve demo.json when backend not running
      },
      '/api': {
        target: process.env.VITE_API_TARGET || 'http://127.0.0.1:5174',
        changeOrigin: true,
        secure: false,
        configure: (proxy) => {
          proxy.on('proxyRes', (proxyRes) => {
            if (proxyRes.statusCode && proxyRes.statusCode >= 400) {
              console.warn('[vite proxy] API error:', proxyRes.statusCode, proxyRes.url);
            }
          });
          proxy.on('error', (err, req, res) => {
            console.error('[vite proxy] API proxy error:', err.message);
          });
        },
      },
    },
  },
});
