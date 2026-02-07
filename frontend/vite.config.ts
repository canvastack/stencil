/// <reference types="vitest" />
import { defineConfig, loadEnv, type ConfigEnv, type UserConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import { VitePWA } from 'vite-plugin-pwa';
import path from "path";
import fs from 'fs-extra';

// https://vitejs.dev/config/
export default defineConfig(({ mode }: ConfigEnv): UserConfig => {
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
      watch: {
        // Exclude test-plugin directory with permission issues
        ignored: [
          '**/node_modules/**',
          '**/.git/**',
          '**/src/plugins/test-plugin/**',
          '**/src/plugins/bad-migration-plugin/**',
        ],
      },
    },
    
    plugins: [
      react(),
      
      // Zustand v4->v5 compatibility - rewrite default imports to named imports
      {
        name: 'zustand-v5-compat',
        enforce: 'pre' as const,
        transform(code: string, id: string) {
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
      } as Plugin,
      
      // DISABLED: Custom plugin to resolve node_modules for plugin files outside Vite root
      // This plugin was causing circular dependency issues and runtime errors
      // Commenting out until a better solution is found
      /*
      {
        name: 'resolve-plugin-deps',
        enforce: 'pre' as const,
        async resolveId(source: string, importer: string | undefined, options: any): Promise<any> {
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
      } as Plugin,
      */
      
      
      // PWA Plugin for Progressive Web App features
      ...(mode === 'production' ? [VitePWA({
        registerType: 'autoUpdate',
        workbox: {
          // Increase the maximum file size limit to handle large assets
          maximumFileSizeToCacheInBytes: 10 * 1024 * 1024, // 10MB limit
          globPatterns: ['**/*.{js,css,html,ico,svg,woff,woff2}'], // Exclude large images from precaching
          globIgnores: [
            '**/images/products/**', // Don't precache large product images
            '**/assets/js/*-vendor-*.js', // Don't precache large vendor bundles
          ],
          // Fix: Ensure runtimeCaching is properly configured
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/api\./,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'api-cache',
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 60 * 60 * 24 // 24 hours
                }
              }
            },
            {
              // Cache small images and icons only
              urlPattern: /\.(?:png|jpg|jpeg|svg|gif)$/,
              handler: 'CacheFirst',
              options: {
                cacheName: 'images-cache',
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 60 * 60 * 24 * 7 // 7 days
                }
              }
            }
          ]
        },
        manifest: {
          name: 'CanvaStencil - Multi-Tenant CMS Platform',
          short_name: 'CanvaStencil',
          description: 'Enterprise-grade multi-tenant CMS platform for custom engraving and personalization businesses',
          theme_color: '#1f2937',
          background_color: '#ffffff',
          display: 'standalone',
          orientation: 'portrait-primary',
          scope: '/',
          start_url: '/',
          categories: ['business', 'productivity', 'utilities'],
          lang: 'en',
          icons: [
            {
              src: '/icons/icon-72x72.png',
              sizes: '72x72',
              type: 'image/png',
              purpose: 'maskable any'
            },
            {
              src: '/icons/icon-96x96.png',
              sizes: '96x96',
              type: 'image/png',
              purpose: 'maskable any'
            },
            {
              src: '/icons/icon-128x128.png',
              sizes: '128x128',
              type: 'image/png',
              purpose: 'maskable any'
            },
            {
              src: '/icons/icon-144x144.png',
              sizes: '144x144',
              type: 'image/png',
              purpose: 'maskable any'
            },
            {
              src: '/icons/icon-152x152.png',
              sizes: '152x152',
              type: 'image/png',
              purpose: 'maskable any'
            },
            {
              src: '/icons/icon-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'maskable any'
            },
            {
              src: '/icons/icon-384x384.png',
              sizes: '384x384',
              type: 'image/png',
              purpose: 'maskable any'
            },
            {
              src: '/icons/icon-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable any'
            }
          ],
          shortcuts: [
            {
              name: 'Admin Dashboard',
              short_name: 'Dashboard',
              description: 'Access the admin dashboard',
              url: '/admin',
              icons: [{ src: '/icons/shortcut-dashboard.png', sizes: '96x96' }]
            },
            {
              name: 'Orders',
              short_name: 'Orders',
              description: 'Manage orders',
              url: '/admin/orders',
              icons: [{ src: '/icons/shortcut-orders.png', sizes: '96x96' }]
            },
            {
              name: 'Products',
              short_name: 'Products',
              description: 'Manage products',
              url: '/admin/products',
              icons: [{ src: '/icons/shortcut-products.png', sizes: '96x96' }]
            }
          ]
        },
        devOptions: {
          enabled: false // Disable in development for faster builds
        }
      })] : []),
      
      // Asset copy plugin with optimization
      {
        name: 'copy-assets',
        writeBundle() {
          // Copy product images (but warn about large sizes)
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
          
          // Copy all assets with size warnings
          if (fs.existsSync(productsSrcDir)) {
            fs.copySync(productsSrcDir, productsDestDir, { overwrite: true });
            console.log('⚠️  Large product images copied but excluded from PWA cache');
          }
          if (fs.existsSync(heroSrcDir)) {
            fs.copySync(heroSrcDir, heroDestDir, { overwrite: true });
          }
        }
      } as Plugin
    ].filter(Boolean),
    
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
        "@plugins": path.resolve(__dirname, "../plugins"),
        // Force axios to use browser version
        'axios': path.resolve(__dirname, '../node_modules/.pnpm/axios@1.13.2/node_modules/axios/dist/esm/axios.js'),
      },
      dedupe: ["react", "react-dom", "three", "lucide-react", "react-hook-form", "date-fns", "zustand", "axios", "@hookform/resolvers", "zod"],
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
        // Fix variable hoisting issues
        keepNames: true,
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
          // Allow plugin dependencies to be resolved from frontend node_modules
          if (id.includes('/plugins/') && (
            id.includes('@hookform/resolvers') ||
            id.includes('react-hook-form') ||
            id.includes('zod') ||
            id.includes('lucide-react') ||
            id.includes('date-fns')
          )) {
            return false; // Bundle these dependencies for plugins
          }
          return false;
        },
        output: {
          // CRITICAL FIX: Disable manual chunks to prevent circular dependency issues
          // The runtime error "can't access lexical declaration '$_' before initialization"
          // is caused by circular dependencies in manual chunk splitting
          manualChunks: undefined,
          
          // Ensure proper module format and interop
          format: 'es',
          entryFileNames: 'assets/js/[name]-[hash].js',
          
          // Asset naming for better caching
          chunkFileNames: 'assets/js/[name]-[hash].js',
          assetFileNames: (assetInfo) => {
            const fileName = assetInfo.name || '';
            const info = fileName.split('.');
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
          
          // Ensure proper variable names and avoid conflicts
          globals: {
            'react': 'React',
            'react-dom': 'ReactDOM'
          }
        },
      },
      
      // Chunk size limits and warnings - increased for vendor chunks
      chunkSizeWarningLimit: 2000, // Increased from 1000 to 2000kb
      
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
      setupFiles: ['./src/__tests__/setup.ts'],
      coverage: {
        reporter: ['text', 'json', 'html'],
        exclude: [
          'node_modules/',
          'src/test/',
          '**/*.d.ts',
          '**/*.config.*',
          '**/coverage/**',
        ],
        // Remove threshold configuration as it's not compatible with current vitest version
        // threshold: {
        //   global: {
        //     branches: 80,
        //     functions: 80,
        //     lines: 80,
        //     statements: 80,
        //   },
        // },
      },
    },
  }
});
