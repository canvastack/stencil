import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
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
    return env.VITE_APP_BASE_URL || (mode === 'production' ? '/stencil/' : '/');
  };
  
  return {
    base: getBaseUrl(),
  
    server: {
      host: "::",
      port: 8080,
    },
    
    plugins: [
      react(), 
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
