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
      fs: {
        // Allow serving files from parent directory (for plugins)
        // Using absolute path to project root for better compatibility
        allow: [
          path.resolve(__dirname, '..'),  // Project root
          path.resolve(__dirname, '../plugins'),  // Plugins directory
        ],
      },
    },
    
    plugins: [
      react({
        // Process files from plugins directory
        include: ['**/*.tsx', '**/*.ts', '**/*.jsx', '**/*.js'],
      }),
      
      // Zustand v4->v5 compatibility - rewrite default imports to named imports
      {
        name: 'zustand-v5-compat',
        enforce: 'pre',
        transform(code, id) {
          // Only transform @react-three files that import zustand with default import
          if ((id.includes('@react-three/fiber') || id.includes('@react-three/drei') || id.includes('tunnel-rat')) 
              && code.includes("import create from 'zustand'")) {
            console.log(`[zustand-v5-compat] Transforming default import to named import in: ${id}`);
            // Rewrite: import create from 'zustand' -> import { create } from 'zustand'
            const transformed = code.replace(
              /import\s+create\s+from\s+['"]zustand['"]/g,
              "import { create } from 'zustand'"
            );
            return { code: transformed, map: null };
          }
          return null;
        },
      },
      
      // Custom plugin to resolve node_modules for plugin files outside Vite root
      {
        name: 'resolve-plugin-deps',
        enforce: 'pre',
        async resolveId(source, importer, options) {
          // Only handle bare imports (not relative/absolute paths) from plugin files
          const isFromPlugin = importer && (
            importer.includes('/plugins/') || 
            importer.includes('\\plugins\\')
          );
          const isBareImport = !source.startsWith('.') && !source.startsWith('/') && !path.isAbsolute(source);
          
          if (isFromPlugin && isBareImport) {
            // Try to resolve from frontend's node_modules
            try {
              const resolved = await this.resolve(source, path.resolve(__dirname, 'src/index.tsx'), {
                ...options,
                skipSelf: true
              });
              if (resolved && resolved.id) {
                console.log(`[resolve-plugin-deps] Resolved ${source} from plugin to ${resolved.id}`);
              }
              return resolved;
            } catch (e) {
              console.warn(`[resolve-plugin-deps] Failed to resolve ${source} from plugin:`, e);
              return null;
            }
          }
          return null;
        },
      },
      
      
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
        "@plugins": path.resolve(__dirname, "../plugins"),
        // Force axios to use browser version
        'axios': path.resolve(__dirname, '../node_modules/.pnpm/axios@1.13.2/node_modules/axios/dist/esm/axios.js'),
      },
      dedupe: ["react", "react-dom", "three", "lucide-react", "react-hook-form", "date-fns", "zustand", "axios"],
      // Ensure plugin imports can resolve to frontend's node_modules
      preserveSymlinks: false,
      // Prioritize browser-compatible entry points
      mainFields: ['module', 'browser', 'jsnext:main', 'jsnext'],
    },
    
    optimizeDeps: {
      exclude: [],
      include: [
        "react", 
        "react-dom", 
        "three", 
        "@react-three/fiber", 
        "@react-three/drei",
        "@monaco-editor/react",
        "date-fns",
        "lucide-react",
        "zustand"
      ],
      esbuildOptions: {
        // Ignore source map errors from corrupted .map files in dependencies
        // Issue: @sentry/core and three-stdlib have malformed source maps
        // Solution: Delete map files or upgrade packages
        sourcemap: false,
        // Force platform to browser to avoid Node.js modules
        platform: 'browser',
        plugins: [
          {
            name: 'zustand-v5-compat-esbuild',
            setup(build) {
              // Transform zustand default imports to named imports for @react-three packages
              build.onLoad({ filter: /(@react-three|tunnel-rat).*\.(js|mjs)$/ }, async (args) => {
                const fs = await import('fs');
                const contents = await fs.promises.readFile(args.path, 'utf8');
                
                if (contents.includes("import create from 'zustand'")) {
                  const transformed = contents.replace(
                    /import\s+create\s+from\s+['"]zustand['"]/g,
                    "import { create } from 'zustand'"
                  );
                  return { contents: transformed, loader: 'js' };
                }
                return null;
              });
            },
          },
        ],
      },
    },
    
    build: {
      // Optimize build for production
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: false, // Disable source maps to avoid errors
      minify: 'esbuild', // Use esbuild instead of terser - faster and handles circular deps better
      target: 'es2020',
      
      // Common chunks for plugin system
      commonjsOptions: {
        include: [/node_modules/,  /plugins/],
      },
      
      // Rollup options for advanced bundling
      rollupOptions: {
        // Don't bundle these - plugins will use versions from host app
        external: (id) => {
          // Allow axios to be bundled from node_modules but use browser version
          return false;
        },
        output: {
          // Manual chunks DISABLED: modulepreload race condition causes "Cannot read properties of undefined"
          // All React-dependent libraries must be in the main vendor bundle to guarantee load order
          manualChunks: (id) => {
            // CRITICAL FIX: Module preload race condition causes "can't access property 'createContext' of undefined"
            // Solution: Keep ALL node_modules in single vendor bundle to guarantee load order
            // Previous attempt to split lodash/date-fns/axios into 'utils-vendor' caused React context errors
            // because those utilities might be imported alongside React-dependent code
            if (id.includes('node_modules')) {
              // Everything goes to main vendor bundle (React, React-DOM, all UI libs, recharts, lodash, date-fns, axios)
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
