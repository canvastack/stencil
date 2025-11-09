import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from 'fs-extra';

// https://vitejs.dev/config/
export default defineConfig({
  base: '/stencil/',
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    {
      name: 'copy-assets',
      writeBundle() {
        const productsSrcDir = path.resolve(__dirname, 'src/assets/products');
        const productsDestDir = path.resolve(__dirname, 'public/images/products');
        const heroSrcDir = path.resolve(__dirname, 'src/assets/hero');
        const heroDestDir = path.resolve(__dirname, 'public/images/hero');
        [productsDestDir, heroDestDir].forEach(dir => {
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
  ],
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
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-select', '@radix-ui/react-accordion'],
          'three-vendor': ['three', '@react-three/fiber', '@react-three/drei'],
        },
      },
    },
  },
});
