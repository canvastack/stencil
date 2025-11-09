import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

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
    return env.VITE_APP_BASE_URL || '/';
  };
  
  return {
    base: getBaseUrl(),
  
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
  }
});
