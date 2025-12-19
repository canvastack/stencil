// vite.config.ts
import { defineConfig, loadEnv } from "file:///d:/worksites/canvastack/projects/stencil/node_modules/vite/dist/node/index.js";
import react from "file:///d:/worksites/canvastack/projects/stencil/node_modules/@vitejs/plugin-react-swc/index.js";
import { VitePWA } from "file:///d:/worksites/canvastack/projects/stencil/node_modules/vite-plugin-pwa/dist/index.js";
import path from "path";
import fs from "file:///d:/worksites/canvastack/projects/stencil/node_modules/fs-extra/lib/index.js";
var __vite_injected_original_dirname = "d:\\worksites\\canvastack\\projects\\stencil";
var vite_config_default = defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const getBaseUrl = () => {
    const platform = env.VITE_APP_DEPLOY_PLATFORM || "local";
    const isGithubPages = env.VITE_APP_IS_GITHUB_PAGES === "true";
    if (platform === "github" || isGithubPages) {
      return "/stencil/";
    }
    return env.VITE_APP_BASE_URL || (mode === "production" ? "/stencil/" : "/");
  };
  return {
    base: getBaseUrl(),
    server: {
      host: "::",
      port: 5173
    },
    plugins: [
      react(),
      // PWA Plugin disabled to avoid workbox errors
      ...mode === "production" ? [VitePWA({
        registerType: "autoUpdate",
        workbox: {
          globPatterns: ["**/*.{js,css,html,ico,png,jpg,jpeg,gif,svg,woff,woff2}"]
        },
        manifest: {
          name: "CanvaStack Stencil CMS",
          short_name: "Stencil CMS",
          description: "Multi-tenant CMS platform for custom engraving and personalization businesses",
          theme_color: "#1f2937",
          background_color: "#ffffff",
          display: "standalone",
          orientation: "portrait",
          scope: "/",
          start_url: "/",
          icons: [
            {
              src: "icons/icon-192x192.png",
              sizes: "192x192",
              type: "image/png"
            },
            {
              src: "icons/icon-512x512.png",
              sizes: "512x512",
              type: "image/png"
            }
          ]
        }
      })] : [],
      // Asset copy plugin
      {
        name: "copy-assets",
        writeBundle() {
          const productsSrcDir = path.resolve(__vite_injected_original_dirname, "src/assets/products");
          const productsDestDir = path.resolve(__vite_injected_original_dirname, "public/images/products");
          const heroSrcDir = path.resolve(__vite_injected_original_dirname, "src/assets/hero");
          const heroDestDir = path.resolve(__vite_injected_original_dirname, "public/images/hero");
          [productsDestDir, heroDestDir].forEach((dir) => {
            if (!fs.existsSync(dir)) {
              fs.mkdirSync(dir, { recursive: true });
            }
          });
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
        "@": path.resolve(__vite_injected_original_dirname, "./src")
      },
      dedupe: ["react", "react-dom", "three"]
    },
    optimizeDeps: {
      exclude: [],
      include: ["react", "react-dom", "three", "@react-three/fiber", "@react-three/drei"]
    },
    build: {
      // Optimize build for production
      outDir: "dist",
      assetsDir: "assets",
      sourcemap: mode === "development",
      minify: "terser",
      target: "es2020",
      // Terser options for better minification
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
          pure_funcs: ["console.log", "console.info", "console.debug"]
        },
        mangle: {
          safari10: true
        }
      },
      // Rollup options for advanced bundling
      rollupOptions: {
        output: {
          // Manual chunks for better caching and loading performance
          manualChunks: (id) => {
            if (id.includes("node_modules")) {
              if (id.includes("react") || id.includes("react-dom") || id.includes("react-router")) {
                return "react-vendor";
              }
              if (id.includes("@radix-ui") || id.includes("@headlessui")) {
                return "ui-vendor";
              }
              if (id.includes("@tanstack/react-query") || id.includes("zustand")) {
                return "query-vendor";
              }
              if (id.includes("react-hook-form") || id.includes("zod")) {
                return "form-vendor";
              }
              if (id.includes("recharts") || id.includes("three") || id.includes("@react-three")) {
                return "chart-vendor";
              }
              if (id.includes("lodash") || id.includes("date-fns") || id.includes("axios")) {
                return "utils-vendor";
              }
              return "vendor";
            }
            if (id.includes("/pages/admin/")) {
              if (id.includes("Product") || id.includes("Inventory")) {
                return "admin-products";
              }
              if (id.includes("Order") || id.includes("Quote") || id.includes("Payment")) {
                return "admin-orders";
              }
              if (id.includes("Customer") || id.includes("Vendor")) {
                return "admin-customers";
              }
              if (id.includes("Theme") || id.includes("Media")) {
                return "admin-content";
              }
              if (id.includes("Performance") || id.includes("Activity") || id.includes("Settings")) {
                return "admin-system";
              }
              return "admin-core";
            }
            if (id.includes("/pages/public/") || id.includes("/pages/home/")) {
              return "public-pages";
            }
            if (id.includes("/components/")) {
              if (id.includes("/ui/")) {
                return "ui-components";
              }
              if (id.includes("/admin/")) {
                return "admin-components";
              }
              return "shared-components";
            }
            if (id.includes("/services/")) {
              return "services";
            }
          },
          // Asset naming for better caching
          chunkFileNames: (chunkInfo) => {
            const facadeModuleId = chunkInfo.facadeModuleId ? chunkInfo.facadeModuleId.split("/").pop() : "chunk";
            return `assets/js/[name]-[hash].js`;
          },
          assetFileNames: (assetInfo) => {
            const info = assetInfo.name.split(".");
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
          }
        },
        // External dependencies (if any should be loaded from CDN)
        external: [],
        // Rollup plugins for additional optimizations
        plugins: []
      },
      // Chunk size limits and warnings
      chunkSizeWarningLimit: 1e3,
      // CSS code splitting
      cssCodeSplit: true,
      // Generate manifest for asset tracking
      manifest: true,
      // Disable CSS inlining for better caching
      assetsInlineLimit: 4096
    },
    // Test configuration
    test: {
      globals: true,
      environment: "jsdom",
      setupFiles: ["./src/test/setup.ts"],
      coverage: {
        reporter: ["text", "json", "html"],
        exclude: [
          "node_modules/",
          "src/test/",
          "**/*.d.ts",
          "**/*.config.*",
          "**/coverage/**"
        ],
        threshold: {
          global: {
            branches: 80,
            functions: 80,
            lines: 80,
            statements: 80
          }
        }
      }
    }
  };
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJkOlxcXFx3b3Jrc2l0ZXNcXFxcY2FudmFzdGFja1xcXFxwcm9qZWN0c1xcXFxzdGVuY2lsXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJkOlxcXFx3b3Jrc2l0ZXNcXFxcY2FudmFzdGFja1xcXFxwcm9qZWN0c1xcXFxzdGVuY2lsXFxcXHZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9kOi93b3Jrc2l0ZXMvY2FudmFzdGFjay9wcm9qZWN0cy9zdGVuY2lsL3ZpdGUuY29uZmlnLnRzXCI7Ly8vIDxyZWZlcmVuY2UgdHlwZXM9XCJ2aXRlc3RcIiAvPlxuaW1wb3J0IHsgZGVmaW5lQ29uZmlnLCBsb2FkRW52IH0gZnJvbSBcInZpdGVcIjtcbmltcG9ydCByZWFjdCBmcm9tIFwiQHZpdGVqcy9wbHVnaW4tcmVhY3Qtc3djXCI7XG5pbXBvcnQgeyBWaXRlUFdBIH0gZnJvbSAndml0ZS1wbHVnaW4tcHdhJztcbmltcG9ydCBwYXRoIGZyb20gXCJwYXRoXCI7XG5pbXBvcnQgZnMgZnJvbSAnZnMtZXh0cmEnO1xuXG4vLyBodHRwczovL3ZpdGVqcy5kZXYvY29uZmlnL1xuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKCh7IG1vZGUgfSkgPT4ge1xuICAvLyBMb2FkIGVudiBmaWxlIGJhc2VkIG9uIG1vZGVcbiAgY29uc3QgZW52ID0gbG9hZEVudihtb2RlLCBwcm9jZXNzLmN3ZCgpLCAnJyk7XG4gIFxuICAvLyBEZXRlcm1pbmUgYmFzZSBVUkwgYmFzZWQgb24gZGVwbG95bWVudCBwbGF0Zm9ybSBhbmQgZW52aXJvbm1lbnRcbiAgY29uc3QgZ2V0QmFzZVVybCA9ICgpID0+IHtcbiAgICBjb25zdCBwbGF0Zm9ybSA9IGVudi5WSVRFX0FQUF9ERVBMT1lfUExBVEZPUk0gfHwgJ2xvY2FsJztcbiAgICBjb25zdCBpc0dpdGh1YlBhZ2VzID0gZW52LlZJVEVfQVBQX0lTX0dJVEhVQl9QQUdFUyA9PT0gJ3RydWUnO1xuICAgIFxuICAgIGlmIChwbGF0Zm9ybSA9PT0gJ2dpdGh1YicgfHwgaXNHaXRodWJQYWdlcykge1xuICAgICAgcmV0dXJuICcvc3RlbmNpbC8nO1xuICAgIH1cbiAgICBcbiAgICAvLyBVc2UgZW52IHZhcmlhYmxlIG9yIGZhbGxiYWNrIHRvIHJvb3RcbiAgICByZXR1cm4gZW52LlZJVEVfQVBQX0JBU0VfVVJMIHx8IChtb2RlID09PSAncHJvZHVjdGlvbicgPyAnL3N0ZW5jaWwvJyA6ICcvJyk7XG4gIH07XG4gIFxuICByZXR1cm4ge1xuICAgIGJhc2U6IGdldEJhc2VVcmwoKSxcbiAgXG4gICAgc2VydmVyOiB7XG4gICAgICBob3N0OiBcIjo6XCIsXG4gICAgICBwb3J0OiA1MTczLFxuICAgIH0sXG4gICAgXG4gICAgcGx1Z2luczogW1xuICAgICAgcmVhY3QoKSxcbiAgICAgIFxuICAgICAgLy8gUFdBIFBsdWdpbiBkaXNhYmxlZCB0byBhdm9pZCB3b3JrYm94IGVycm9yc1xuICAgICAgLi4uKG1vZGUgPT09ICdwcm9kdWN0aW9uJyA/IFtWaXRlUFdBKHtcbiAgICAgICAgcmVnaXN0ZXJUeXBlOiAnYXV0b1VwZGF0ZScsXG4gICAgICAgIHdvcmtib3g6IHtcbiAgICAgICAgICBnbG9iUGF0dGVybnM6IFsnKiovKi57anMsY3NzLGh0bWwsaWNvLHBuZyxqcGcsanBlZyxnaWYsc3ZnLHdvZmYsd29mZjJ9J11cbiAgICAgICAgfSxcbiAgICAgICAgbWFuaWZlc3Q6IHtcbiAgICAgICAgICBuYW1lOiAnQ2FudmFTdGFjayBTdGVuY2lsIENNUycsXG4gICAgICAgICAgc2hvcnRfbmFtZTogJ1N0ZW5jaWwgQ01TJyxcbiAgICAgICAgICBkZXNjcmlwdGlvbjogJ011bHRpLXRlbmFudCBDTVMgcGxhdGZvcm0gZm9yIGN1c3RvbSBlbmdyYXZpbmcgYW5kIHBlcnNvbmFsaXphdGlvbiBidXNpbmVzc2VzJyxcbiAgICAgICAgICB0aGVtZV9jb2xvcjogJyMxZjI5MzcnLFxuICAgICAgICAgIGJhY2tncm91bmRfY29sb3I6ICcjZmZmZmZmJyxcbiAgICAgICAgICBkaXNwbGF5OiAnc3RhbmRhbG9uZScsXG4gICAgICAgICAgb3JpZW50YXRpb246ICdwb3J0cmFpdCcsXG4gICAgICAgICAgc2NvcGU6ICcvJyxcbiAgICAgICAgICBzdGFydF91cmw6ICcvJyxcbiAgICAgICAgICBpY29uczogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBzcmM6ICdpY29ucy9pY29uLTE5MngxOTIucG5nJyxcbiAgICAgICAgICAgICAgc2l6ZXM6ICcxOTJ4MTkyJyxcbiAgICAgICAgICAgICAgdHlwZTogJ2ltYWdlL3BuZycsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBzcmM6ICdpY29ucy9pY29uLTUxMng1MTIucG5nJyxcbiAgICAgICAgICAgICAgc2l6ZXM6ICc1MTJ4NTEyJyxcbiAgICAgICAgICAgICAgdHlwZTogJ2ltYWdlL3BuZycsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIF0sXG4gICAgICAgIH1cbiAgICAgIH0pXSA6IFtdKSxcbiAgICAgIFxuICAgICAgLy8gQXNzZXQgY29weSBwbHVnaW5cbiAgICAgIHtcbiAgICAgICAgbmFtZTogJ2NvcHktYXNzZXRzJyxcbiAgICAgICAgd3JpdGVCdW5kbGUoKSB7XG4gICAgICAgICAgLy8gQ29weSBwcm9kdWN0IGltYWdlc1xuICAgICAgICAgIGNvbnN0IHByb2R1Y3RzU3JjRGlyID0gcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJ3NyYy9hc3NldHMvcHJvZHVjdHMnKTtcbiAgICAgICAgICBjb25zdCBwcm9kdWN0c0Rlc3REaXIgPSBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAncHVibGljL2ltYWdlcy9wcm9kdWN0cycpO1xuICAgICAgICAgIFxuICAgICAgICAgIC8vIENvcHkgaGVybyBpbWFnZXNcbiAgICAgICAgICBjb25zdCBoZXJvU3JjRGlyID0gcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJ3NyYy9hc3NldHMvaGVybycpO1xuICAgICAgICAgIGNvbnN0IGhlcm9EZXN0RGlyID0gcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJ3B1YmxpYy9pbWFnZXMvaGVybycpO1xuICAgICAgICAgIFxuICAgICAgICAgIC8vIEVuc3VyZSBkZXN0aW5hdGlvbiBkaXJlY3RvcmllcyBleGlzdFxuICAgICAgICAgIFtwcm9kdWN0c0Rlc3REaXIsIGhlcm9EZXN0RGlyXS5mb3JFYWNoKGRpciA9PiB7XG4gICAgICAgICAgICBpZiAoIWZzLmV4aXN0c1N5bmMoZGlyKSkge1xuICAgICAgICAgICAgICBmcy5ta2RpclN5bmMoZGlyLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgICAgICBcbiAgICAgICAgICAvLyBDb3B5IGFsbCBhc3NldHNcbiAgICAgICAgICBpZiAoZnMuZXhpc3RzU3luYyhwcm9kdWN0c1NyY0RpcikpIHtcbiAgICAgICAgICAgIGZzLmNvcHlTeW5jKHByb2R1Y3RzU3JjRGlyLCBwcm9kdWN0c0Rlc3REaXIsIHsgb3ZlcndyaXRlOiB0cnVlIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoZnMuZXhpc3RzU3luYyhoZXJvU3JjRGlyKSkge1xuICAgICAgICAgICAgZnMuY29weVN5bmMoaGVyb1NyY0RpciwgaGVyb0Rlc3REaXIsIHsgb3ZlcndyaXRlOiB0cnVlIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIF0uZmlsdGVyKEJvb2xlYW4pLFxuICAgIFxuICAgIHJlc29sdmU6IHtcbiAgICAgIGFsaWFzOiB7XG4gICAgICAgIFwiQFwiOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCBcIi4vc3JjXCIpLFxuICAgICAgfSxcbiAgICAgIGRlZHVwZTogW1wicmVhY3RcIiwgXCJyZWFjdC1kb21cIiwgXCJ0aHJlZVwiXSxcbiAgICB9LFxuICAgIFxuICAgIG9wdGltaXplRGVwczoge1xuICAgICAgZXhjbHVkZTogW10sXG4gICAgICBpbmNsdWRlOiBbXCJyZWFjdFwiLCBcInJlYWN0LWRvbVwiLCBcInRocmVlXCIsIFwiQHJlYWN0LXRocmVlL2ZpYmVyXCIsIFwiQHJlYWN0LXRocmVlL2RyZWlcIl0sXG4gICAgfSxcbiAgICBcbiAgICBidWlsZDoge1xuICAgICAgLy8gT3B0aW1pemUgYnVpbGQgZm9yIHByb2R1Y3Rpb25cbiAgICAgIG91dERpcjogJ2Rpc3QnLFxuICAgICAgYXNzZXRzRGlyOiAnYXNzZXRzJyxcbiAgICAgIHNvdXJjZW1hcDogbW9kZSA9PT0gJ2RldmVsb3BtZW50JyxcbiAgICAgIG1pbmlmeTogJ3RlcnNlcicsXG4gICAgICB0YXJnZXQ6ICdlczIwMjAnLFxuICAgICAgXG4gICAgICAvLyBUZXJzZXIgb3B0aW9ucyBmb3IgYmV0dGVyIG1pbmlmaWNhdGlvblxuICAgICAgdGVyc2VyT3B0aW9uczoge1xuICAgICAgICBjb21wcmVzczoge1xuICAgICAgICAgIGRyb3BfY29uc29sZTogdHJ1ZSxcbiAgICAgICAgICBkcm9wX2RlYnVnZ2VyOiB0cnVlLFxuICAgICAgICAgIHB1cmVfZnVuY3M6IFsnY29uc29sZS5sb2cnLCAnY29uc29sZS5pbmZvJywgJ2NvbnNvbGUuZGVidWcnXSxcbiAgICAgICAgfSxcbiAgICAgICAgbWFuZ2xlOiB7XG4gICAgICAgICAgc2FmYXJpMTA6IHRydWUsXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgICAgXG4gICAgICAvLyBSb2xsdXAgb3B0aW9ucyBmb3IgYWR2YW5jZWQgYnVuZGxpbmdcbiAgICAgIHJvbGx1cE9wdGlvbnM6IHtcbiAgICAgICAgb3V0cHV0OiB7XG4gICAgICAgICAgLy8gTWFudWFsIGNodW5rcyBmb3IgYmV0dGVyIGNhY2hpbmcgYW5kIGxvYWRpbmcgcGVyZm9ybWFuY2VcbiAgICAgICAgICBtYW51YWxDaHVua3M6IChpZCkgPT4ge1xuICAgICAgICAgICAgLy8gVmVuZG9yIGNodW5rc1xuICAgICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCdub2RlX21vZHVsZXMnKSkge1xuICAgICAgICAgICAgICAvLyBSZWFjdCBlY29zeXN0ZW1cbiAgICAgICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCdyZWFjdCcpIHx8IGlkLmluY2x1ZGVzKCdyZWFjdC1kb20nKSB8fCBpZC5pbmNsdWRlcygncmVhY3Qtcm91dGVyJykpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJ3JlYWN0LXZlbmRvcic7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgIC8vIFVJIGxpYnJhcnkgY2h1bmtzXG4gICAgICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygnQHJhZGl4LXVpJykgfHwgaWQuaW5jbHVkZXMoJ0BoZWFkbGVzc3VpJykpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJ3VpLXZlbmRvcic7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgIC8vIFF1ZXJ5IGFuZCBzdGF0ZSBtYW5hZ2VtZW50XG4gICAgICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygnQHRhbnN0YWNrL3JlYWN0LXF1ZXJ5JykgfHwgaWQuaW5jbHVkZXMoJ3p1c3RhbmQnKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiAncXVlcnktdmVuZG9yJztcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgLy8gRm9ybSBoYW5kbGluZ1xuICAgICAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoJ3JlYWN0LWhvb2stZm9ybScpIHx8IGlkLmluY2x1ZGVzKCd6b2QnKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiAnZm9ybS12ZW5kb3InO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAvLyBDaGFydGluZyBhbmQgdmlzdWFsaXphdGlvblxuICAgICAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoJ3JlY2hhcnRzJykgfHwgaWQuaW5jbHVkZXMoJ3RocmVlJykgfHwgaWQuaW5jbHVkZXMoJ0ByZWFjdC10aHJlZScpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICdjaGFydC12ZW5kb3InO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAvLyBVdGlsaXRpZXNcbiAgICAgICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCdsb2Rhc2gnKSB8fCBpZC5pbmNsdWRlcygnZGF0ZS1mbnMnKSB8fCBpZC5pbmNsdWRlcygnYXhpb3MnKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiAndXRpbHMtdmVuZG9yJztcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgLy8gRGVmYXVsdCB2ZW5kb3IgY2h1bmsgZm9yIG90aGVyIG5vZGVfbW9kdWxlc1xuICAgICAgICAgICAgICByZXR1cm4gJ3ZlbmRvcic7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIEFwcCBjaHVua3MgYmFzZWQgb24gcm91dGVzL2ZlYXR1cmVzXG4gICAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoJy9wYWdlcy9hZG1pbi8nKSkge1xuICAgICAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoJ1Byb2R1Y3QnKSB8fCBpZC5pbmNsdWRlcygnSW52ZW50b3J5JykpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJ2FkbWluLXByb2R1Y3RzJztcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoJ09yZGVyJykgfHwgaWQuaW5jbHVkZXMoJ1F1b3RlJykgfHwgaWQuaW5jbHVkZXMoJ1BheW1lbnQnKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiAnYWRtaW4tb3JkZXJzJztcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoJ0N1c3RvbWVyJykgfHwgaWQuaW5jbHVkZXMoJ1ZlbmRvcicpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICdhZG1pbi1jdXN0b21lcnMnO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygnVGhlbWUnKSB8fCBpZC5pbmNsdWRlcygnTWVkaWEnKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiAnYWRtaW4tY29udGVudCc7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCdQZXJmb3JtYW5jZScpIHx8IGlkLmluY2x1ZGVzKCdBY3Rpdml0eScpIHx8IGlkLmluY2x1ZGVzKCdTZXR0aW5ncycpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICdhZG1pbi1zeXN0ZW0nO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIHJldHVybiAnYWRtaW4tY29yZSc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygnL3BhZ2VzL3B1YmxpYy8nKSB8fCBpZC5pbmNsdWRlcygnL3BhZ2VzL2hvbWUvJykpIHtcbiAgICAgICAgICAgICAgcmV0dXJuICdwdWJsaWMtcGFnZXMnO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoJy9jb21wb25lbnRzLycpKSB7XG4gICAgICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygnL3VpLycpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICd1aS1jb21wb25lbnRzJztcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoJy9hZG1pbi8nKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiAnYWRtaW4tY29tcG9uZW50cyc7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgcmV0dXJuICdzaGFyZWQtY29tcG9uZW50cyc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygnL3NlcnZpY2VzLycpKSB7XG4gICAgICAgICAgICAgIHJldHVybiAnc2VydmljZXMnO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0sXG4gICAgICAgICAgXG4gICAgICAgICAgLy8gQXNzZXQgbmFtaW5nIGZvciBiZXR0ZXIgY2FjaGluZ1xuICAgICAgICAgIGNodW5rRmlsZU5hbWVzOiAoY2h1bmtJbmZvKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBmYWNhZGVNb2R1bGVJZCA9IGNodW5rSW5mby5mYWNhZGVNb2R1bGVJZFxuICAgICAgICAgICAgICA/IGNodW5rSW5mby5mYWNhZGVNb2R1bGVJZC5zcGxpdCgnLycpLnBvcCgpXG4gICAgICAgICAgICAgIDogJ2NodW5rJztcbiAgICAgICAgICAgIHJldHVybiBgYXNzZXRzL2pzL1tuYW1lXS1baGFzaF0uanNgO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgYXNzZXRGaWxlTmFtZXM6IChhc3NldEluZm8pID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGluZm8gPSBhc3NldEluZm8ubmFtZSEuc3BsaXQoJy4nKTtcbiAgICAgICAgICAgIGNvbnN0IGV4dCA9IGluZm9baW5mby5sZW5ndGggLSAxXTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgKC9wbmd8anBlP2d8c3ZnfGdpZnx0aWZmfGJtcHxpY28vaS50ZXN0KGV4dCkpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIGBhc3NldHMvaW1hZ2VzL1tuYW1lXS1baGFzaF1bZXh0bmFtZV1gO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKC93b2ZmfHdvZmYyfGVvdHx0dGZ8b3RmL2kudGVzdChleHQpKSB7XG4gICAgICAgICAgICAgIHJldHVybiBgYXNzZXRzL2ZvbnRzL1tuYW1lXS1baGFzaF1bZXh0bmFtZV1gO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKC9jc3MvaS50ZXN0KGV4dCkpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIGBhc3NldHMvY3NzL1tuYW1lXS1baGFzaF1bZXh0bmFtZV1gO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGBhc3NldHMvW25hbWVdLVtoYXNoXVtleHRuYW1lXWA7XG4gICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgXG4gICAgICAgIC8vIEV4dGVybmFsIGRlcGVuZGVuY2llcyAoaWYgYW55IHNob3VsZCBiZSBsb2FkZWQgZnJvbSBDRE4pXG4gICAgICAgIGV4dGVybmFsOiBbXSxcbiAgICAgICAgXG4gICAgICAgIC8vIFJvbGx1cCBwbHVnaW5zIGZvciBhZGRpdGlvbmFsIG9wdGltaXphdGlvbnNcbiAgICAgICAgcGx1Z2luczogW10sXG4gICAgICB9LFxuICAgICAgXG4gICAgICAvLyBDaHVuayBzaXplIGxpbWl0cyBhbmQgd2FybmluZ3NcbiAgICAgIGNodW5rU2l6ZVdhcm5pbmdMaW1pdDogMTAwMCxcbiAgICAgIFxuICAgICAgLy8gQ1NTIGNvZGUgc3BsaXR0aW5nXG4gICAgICBjc3NDb2RlU3BsaXQ6IHRydWUsXG4gICAgICBcbiAgICAgIC8vIEdlbmVyYXRlIG1hbmlmZXN0IGZvciBhc3NldCB0cmFja2luZ1xuICAgICAgbWFuaWZlc3Q6IHRydWUsXG4gICAgICBcbiAgICAgIC8vIERpc2FibGUgQ1NTIGlubGluaW5nIGZvciBiZXR0ZXIgY2FjaGluZ1xuICAgICAgYXNzZXRzSW5saW5lTGltaXQ6IDQwOTYsXG4gICAgfSxcbiAgICBcbiAgICAvLyBUZXN0IGNvbmZpZ3VyYXRpb25cbiAgICB0ZXN0OiB7XG4gICAgICBnbG9iYWxzOiB0cnVlLFxuICAgICAgZW52aXJvbm1lbnQ6ICdqc2RvbScsXG4gICAgICBzZXR1cEZpbGVzOiBbJy4vc3JjL3Rlc3Qvc2V0dXAudHMnXSxcbiAgICAgIGNvdmVyYWdlOiB7XG4gICAgICAgIHJlcG9ydGVyOiBbJ3RleHQnLCAnanNvbicsICdodG1sJ10sXG4gICAgICAgIGV4Y2x1ZGU6IFtcbiAgICAgICAgICAnbm9kZV9tb2R1bGVzLycsXG4gICAgICAgICAgJ3NyYy90ZXN0LycsXG4gICAgICAgICAgJyoqLyouZC50cycsXG4gICAgICAgICAgJyoqLyouY29uZmlnLionLFxuICAgICAgICAgICcqKi9jb3ZlcmFnZS8qKicsXG4gICAgICAgIF0sXG4gICAgICAgIHRocmVzaG9sZDoge1xuICAgICAgICAgIGdsb2JhbDoge1xuICAgICAgICAgICAgYnJhbmNoZXM6IDgwLFxuICAgICAgICAgICAgZnVuY3Rpb25zOiA4MCxcbiAgICAgICAgICAgIGxpbmVzOiA4MCxcbiAgICAgICAgICAgIHN0YXRlbWVudHM6IDgwLFxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgIH0sXG4gIH1cbn0pO1xuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUNBLFNBQVMsY0FBYyxlQUFlO0FBQ3RDLE9BQU8sV0FBVztBQUNsQixTQUFTLGVBQWU7QUFDeEIsT0FBTyxVQUFVO0FBQ2pCLE9BQU8sUUFBUTtBQUxmLElBQU0sbUNBQW1DO0FBUXpDLElBQU8sc0JBQVEsYUFBYSxDQUFDLEVBQUUsS0FBSyxNQUFNO0FBRXhDLFFBQU0sTUFBTSxRQUFRLE1BQU0sUUFBUSxJQUFJLEdBQUcsRUFBRTtBQUczQyxRQUFNLGFBQWEsTUFBTTtBQUN2QixVQUFNLFdBQVcsSUFBSSw0QkFBNEI7QUFDakQsVUFBTSxnQkFBZ0IsSUFBSSw2QkFBNkI7QUFFdkQsUUFBSSxhQUFhLFlBQVksZUFBZTtBQUMxQyxhQUFPO0FBQUEsSUFDVDtBQUdBLFdBQU8sSUFBSSxzQkFBc0IsU0FBUyxlQUFlLGNBQWM7QUFBQSxFQUN6RTtBQUVBLFNBQU87QUFBQSxJQUNMLE1BQU0sV0FBVztBQUFBLElBRWpCLFFBQVE7QUFBQSxNQUNOLE1BQU07QUFBQSxNQUNOLE1BQU07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
