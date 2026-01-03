/// <reference types="vitest" />
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
// import { VitePWA } from 'vite-plugin-pwa'; // Disabled - not needed for production
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
    
    // Configure environment variable prefix
    envPrefix: ['VITE_', 'NODE_'],
  
    server: {
      host: "::",
      port: 5173,
    },
    
    plugins: [
      react(),
      
      // PWA Plugin completely disabled for production
      // ...(mode === 'production' ? [VitePWA({
      //   registerType: 'autoUpdate',
      //   workbox: {
      //     globPatterns: ['**/*.{js,css,html,ico,png,jpg,jpeg,gif,svg,woff,woff2}']
      //   },
      //   manifest: {
      //     name: 'CanvaStack Stencil CMS',
      //     short_name: 'Stencil CMS',
      //     description: 'Multi-tenant CMS platform for custom engraving and personalization businesses',
      //     theme_color: '#1f2937',
      //     background_color: '#ffffff',
      //     display: 'standalone',
      //     orientation: 'portrait',
      //     scope: '/',
      //     start_url: '/',
      //     icons: [
      //       {
      //         src: 'icons/icon-192x192.png',
      //         sizes: '192x192',
      //         type: 'image/png',
      //       },
      //       {
      //         src: 'icons/icon-512x512.png',
      //         sizes: '512x512',
      //         type: 'image/png',
      //       },
      //     ],
      //   }
      // })] : []),
      
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
      sourcemap: false, // Disable source maps to avoid errors
      minify: 'esbuild', // Use esbuild instead of terser - faster and handles circular deps better
      target: 'es2020',
      
      // Rollup options for advanced bundling
      rollupOptions: {
        output: {
          // Manual chunks DISABLED: modulepreload race condition causes "Cannot read properties of undefined"
          // All React-dependent libraries must be in the main vendor bundle to guarantee load order
          manualChunks: (id) => {
            // Only split truly standalone utilities that don't depend on React
            if (id.includes('node_modules')) {
              // CRITICAL FIX: Recharts has circular dependencies that break when isolated in separate chunk
              // Solution: Keep recharts in main vendor bundle to prevent variable hoisting errors
              // Removed: recharts → 'chart-vendor' (caused "can't access lexical declaration 'F' before initialization")
              
              if (id.includes('lodash') || id.includes('date-fns') || id.includes('axios')) {
                return 'utils-vendor';
              }
              // Everything else goes to main vendor (React, React-DOM, all UI libs, recharts, all React-dependent libs)
              return 'vendor';
            }
            // No app-level chunking - everything stays in main bundle
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
