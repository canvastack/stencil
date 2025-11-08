import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  // GitHub Pages deployment: Set base to '/' for custom domain, or '/repo-name/' for github.io
  base: '/stencil/',
  
  server: {
    host: "::",
    port: 8080,
  },
  
  plugins: [
    react(), 
    mode === "development" && componentTagger()
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
}));
