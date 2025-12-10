import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'Mermaid PNG Exporter',
        short_name: 'MermaidPNG',
        description: 'Exportador de diagramas Mermaid a PNG de alta calidad',
        theme_color: '#6366f1',
        background_color: '#0f172a',
        display: 'standalone',
        orientation: 'any',
        start_url: '/',
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },
      workbox: {
        // Only precache core assets, not large diagram chunks
        globPatterns: [
          '**/*.{css,html,ico,png,svg,woff,woff2}',
          'assets/index-*.js',
          'assets/vendor-*.js'
        ],
        // Exclude large Mermaid diagram-specific chunks from precache
        globIgnores: [
          '**/node_modules/**',
          'assets/*Diagram*.js',
          'assets/*definition*.js',
          'assets/katex*.js',
          'assets/flowDb*.js',
          'assets/createText*.js'
        ],
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [/^\/api/],
        runtimeCaching: [
          // Cache Mermaid diagram chunks on-demand (lazy load)
          {
            urlPattern: /\/assets\/.*(?:Diagram|definition|katex|flowDb|createText).*\.js$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'mermaid-diagrams',
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          // Cache other JS assets
          {
            urlPattern: /\/assets\/.*\.js$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'js-assets',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          // Google Fonts
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          // Google Fonts files
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-files',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ],

  // Development server config
  server: {
    port: 3000,
    open: true
  },

  // Dependency optimization
  optimizeDeps: {
    include: ['react', 'react-dom', 'mermaid']
  },

  // Build optimization
  build: {
    outDir: 'dist',
    target: 'es2020',
    cssTarget: 'chrome80',
    sourcemap: false,
    minify: 'terser',

    // Acknowledge Mermaid's large chunks (inherent to the library)
    chunkSizeWarningLimit: 600,

    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug']
      },
      mangle: {
        safari10: true
      },
      format: {
        comments: false
      }
    },

    rollupOptions: {
      output: {
        // Manual chunks for better code splitting
        manualChunks: {
          // React core - small, loads first
          'vendor-react': ['react', 'react-dom'],
          // Mermaid core - separate from app code
          'vendor-mermaid': ['mermaid']
        },
        // Optimize chunk filenames
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    }
  }
})
