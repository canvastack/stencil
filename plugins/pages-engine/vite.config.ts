import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  
  build: {
    outDir: '../../public/plugins/pages-engine',
    emptyOutDir: true,
    
    lib: {
      entry: path.resolve(__dirname, 'frontend/index.tsx'),
      name: 'PagesEngine',
      formats: ['es'],
      fileName: 'pages-engine'
    },
    
    rollupOptions: {
      external: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        'react-router-dom',
        '@tanstack/react-query',
        'react-hook-form',
        'zustand',
        'zustand/middleware',
        'lucide-react',
        'date-fns',
        'sonner',
        'next-themes',
        '@monaco-editor/react',
        '@hookform/resolvers/zod',
        'zod',
        '@sentry/react',
        '@sentry/browser',
        '@radix-ui/react-slot',
        '@radix-ui/react-label',
        '@canvastencil/ui-components',
        '@canvastencil/types',
        '@canvastencil/api-client'
      ],
      
      output: {
        globals: {
          'react': 'React',
          'react-dom': 'ReactDOM',
          'react/jsx-runtime': 'jsxRuntime',
          'react-router-dom': 'ReactRouterDOM',
          '@tanstack/react-query': 'ReactQuery',
          'react-hook-form': 'ReactHookForm',
          'zustand': 'Zustand',
          '@canvastencil/ui-components': 'CanvaStencilUI',
          '@canvastencil/types': 'CanvaStencilTypes',
          '@canvastencil/api-client': 'CanvaStencilAPI'
        },
        
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith('.css')) {
            return 'pages-engine.css';
          }
          return '[name][extname]';
        }
      }
    },
    
    minify: 'esbuild',
    target: 'es2020',
    sourcemap: false,
    
    chunkSizeWarningLimit: 200
  },
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'frontend')
    }
  }
});
