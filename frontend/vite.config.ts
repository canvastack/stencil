/// <reference types="vitest" />
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import { VitePWA } from 'vite-plugin-pwa';
import path from "path";
import fs from 'fs-extra';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on mode
  const env = loadEnv(mode, process.cwd(), '');
  
  // Determine base URL based on deployment platform and environment
  const getBaseUrl = () => {
    const platform = env.VITE_APP_DEPLOY_PLATFORM || 'local';
    const isGithubPages = env.VITE_APP_IS_GITHUB_PAGES === 'true';
    
    if (platform === 'github' || isGithubPages) {
      return '/stencil/';
    }
    
    // Use env variable or fallback to root
    return env.VITE_APP_BASE_URL || (mode === 'production' ? '/' : '/');
    //return env.VITE_APP_BASE_URL || (mode === 'production' ? '/stencil/' : '/');
  };
  
  return {
    base: getBaseUrl(),
  
    server: {
      host: "::",
      port: 5173,
    },
    
    plugins: [
      react(),
      
      // PWA Plugin disabled to avoid workbox errors
      ...(mode === 'production' ? [VitePWA({
        registerType: 'autoUpdate',
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,jpg,jpeg,gif,svg,woff,woff2}']
        },
        manifest: {
          name: 'CanvaStack Stencil CMS',
          short_name: 'Stencil CMS',
          description: 'Multi-tenant CMS platform for custom engraving and personalization businesses',
          theme_color: '#1f2937',
          background_color: '#ffffff',
          display: 'standalone',
          orientation: 'portrait',
          scope: '/',
          start_url: '/',
          icons: [
            {
              src: 'icons/icon-192x192.png',
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: 'icons/icon-512x512.png',
              sizes: '512x512',
              type: 'image/png',
            },
          ],
        }
      })] : []),
      
      // Asset copy plugin
      {
        name: 'copy-assets',
        writeBundle() {
          // Copy product images
          const productsSrcDir = path.resolve(__dirname, 'src/assets/products');
          const productsDestDir = path.resolve(__dirname, 'public/images/products');
          
          // Copy hero images
          const heroSrcDir = path.resolve(__dirname, 'src/assets/hero');
          const heroDestDir = path.resolve(__dirname, 'public/images/hero');
          
          // Ensure destination directories exist
          [productsDestDir, heroDestDir].forEach(dir => {
            if (!fs.existsSync(dir)) {
              fs.mkdirSync(dir, { recursive: true });
            }
          });
          
          // Copy all assets
          if (fs.existsSync(productsSrcDir)) {
            fs.copySync(productsSrcDir, productsDestDir, { overwrite: true });
          }
          if (fs.existsSync(heroSrcDir)) {
            fs.copySync(heroSrcDir, heroDestDir, { overwrite: true });
          }
        }
      }
    ].filter(Boolean),
    
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
      dedupe: ["react", "react-dom", "three"],
    },
    
    optimizeDeps: {
      exclude: [],
      include: ["react", "react-dom", "three", "@react-three/fiber", "@react-three/drei"],
    },
    
    build: {
      // Optimize build for production
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: mode === 'development',
      minify: 'terser',
      target: 'es2020',
      
      // Terser options for better minification
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
          pure_funcs: ['console.log', 'console.info', 'console.debug'],
        },
        mangle: {
          safari10: true,
        },
      },
      
      // Rollup options for advanced bundling
      rollupOptions: {
        output: {
          // Manual chunks for better caching and loading performance
          manualChunks: (id) => {
            // Vendor chunks
            if (id.includes('node_modules')) {
              // React ecosystem
              if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
                return 'react-vendor';
              }
              
              // UI library chunks
              if (id.includes('@radix-ui') || id.includes('@headlessui')) {
                return 'ui-vendor';
              }
              
              // Query and state management
              if (id.includes('@tanstack/react-query') || id.includes('zustand')) {
                return 'query-vendor';
              }
              
              // Form handling
              if (id.includes('react-hook-form') || id.includes('zod')) {
                return 'form-vendor';
              }
              
              // Charting and visualization
              if (id.includes('recharts') || id.includes('three') || id.includes('@react-three')) {
                return 'chart-vendor';
              }
              
              // Utilities
              if (id.includes('lodash') || id.includes('date-fns') || id.includes('axios')) {
                return 'utils-vendor';
              }
              
              // Default vendor chunk for other node_modules
              return 'vendor';
            }
            
            // App chunks based on routes/features
            if (id.includes('/pages/admin/')) {
              if (id.includes('Product') || id.includes('Inventory')) {
                return 'admin-products';
              }
              if (id.includes('Order') || id.includes('Quote') || id.includes('Payment')) {
                return 'admin-orders';
              }
              if (id.includes('Customer') || id.includes('Vendor')) {
                return 'admin-customers';
              }
              if (id.includes('Theme') || id.includes('Media')) {
                return 'admin-content';
              }
              if (id.includes('Performance') || id.includes('Activity') || id.includes('Settings')) {
                return 'admin-system';
              }
              return 'admin-core';
            }
            
            if (id.includes('/pages/public/') || id.includes('/pages/home/')) {
              return 'public-pages';
            }
            
            if (id.includes('/components/')) {
              if (id.includes('/ui/')) {
                return 'ui-components';
              }
              if (id.includes('/admin/')) {
                return 'admin-components';
              }
              return 'shared-components';
            }
            
            if (id.includes('/services/')) {
              return 'services';
            }
          },
          
          // Asset naming for better caching
          chunkFileNames: (chunkInfo) => {
            const facadeModuleId = chunkInfo.facadeModuleId
              ? chunkInfo.facadeModuleId.split('/').pop()
              : 'chunk';
            return `assets/js/[name]-[hash].js`;
          },
          assetFileNames: (assetInfo) => {
            const info = assetInfo.name!.split('.');
            const ext = info[info.length - 1];
            
            if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
              return `assets/images/[name]-[hash][extname]`;
            }
            if (/woff|woff2|eot|ttf|otf/i.test(ext)) {
              return `assets/fonts/[name]-[hash][extname]`;
            }
            if (/css/i.test(ext)) {
              return `assets/css/[name]-[hash][extname]`;
            }
            return `assets/[name]-[hash][extname]`;
          },
        },
        
        // External dependencies (if any should be loaded from CDN)
        external: [],
        
        // Rollup plugins for additional optimizations
        plugins: [],
      },
      
      // Chunk size limits and warnings
      chunkSizeWarningLimit: 1000,
      
      // CSS code splitting
      cssCodeSplit: true,
      
      // Generate manifest for asset tracking
      manifest: true,
      
      // Disable CSS inlining for better caching
      assetsInlineLimit: 4096,
    },
    
    // Test configuration
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      coverage: {
        reporter: ['text', 'json', 'html'],
        exclude: [
          'node_modules/',
          'src/test/',
          '**/*.d.ts',
          '**/*.config.*',
          '**/coverage/**',
        ],
        threshold: {
          global: {
            branches: 80,
            functions: 80,
            lines: 80,
            statements: 80,
          },
        },
      },
    },
  }
});
