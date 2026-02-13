/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

/**
 * Vitest Configuration for Vendor Portal Testing
 * 
 * This configuration extends the base Vite config with test-specific settings
 * optimized for vendor portal unit and integration tests.
 */
export default defineConfig({
  plugins: [react()],
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@plugins': path.resolve(__dirname, '../plugins'),
    },
  },
  
  test: {
    // Use jsdom environment for React component testing
    environment: 'jsdom',
    
    // Enable global test APIs (describe, it, expect, etc.)
    globals: true,
    
    // Setup files to run before each test file
    setupFiles: ['./src/__tests__/setup.ts'],
    
    // Coverage configuration
    coverage: {
      // Coverage providers
      provider: 'v8',
      
      // Output formats
      reporter: ['text', 'json', 'html', 'lcov'],
      
      // Coverage output directory
      reportsDirectory: './coverage',
      
      // Files to exclude from coverage
      exclude: [
        'node_modules/',
        'src/__tests__/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/coverage/**',
        '**/dist/**',
        '**/.{idea,git,cache,output,temp}/**',
        '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*',
        '**/mockServiceWorker.js',
      ],
      
      // Include source files
      include: [
        'src/**/*.{ts,tsx}',
      ],
      
      // Coverage thresholds (optional - can be enabled later)
      // thresholds: {
      //   lines: 75,
      //   functions: 75,
      //   branches: 75,
      //   statements: 75,
      // },
      
      // Clean coverage results before running tests
      clean: true,
      
      // All files should be included in coverage report
      all: true,
    },
    
    // Test file patterns
    include: [
      'src/__tests__/**/*.{test,spec}.{ts,tsx}',
      'src/**/__tests__/**/*.{test,spec}.{ts,tsx}',
    ],
    
    // Files to exclude from test discovery
    exclude: [
      'node_modules',
      'dist',
      '.idea',
      '.git',
      '.cache',
      '**/e2e/**', // E2E tests run with Playwright
    ],
    
    // Test timeout (30 seconds for integration tests)
    testTimeout: 30000,
    
    // Hook timeout
    hookTimeout: 30000,
    
    // Teardown timeout
    teardownTimeout: 10000,
    
    // Retry failed tests (useful for flaky tests)
    retry: 0,
    
    // Run tests in parallel
    threads: true,
    
    // Maximum number of threads
    maxThreads: 4,
    
    // Minimum number of threads
    minThreads: 1,
    
    // Isolate test environment for each test file
    isolate: true,
    
    // Watch mode configuration
    watch: false,
    
    // Reporter configuration
    reporters: ['default', 'verbose'],
    
    // Output options
    outputFile: {
      json: './test-results/results.json',
      html: './test-results/results.html',
    },
    
    // Mock configuration
    mockReset: true,
    restoreMocks: true,
    clearMocks: true,
    
    // CSS handling
    css: {
      modules: {
        classNameStrategy: 'non-scoped',
      },
    },
    
    // Environment options
    environmentOptions: {
      jsdom: {
        resources: 'usable',
      },
    },
    
    // Benchmark configuration (for performance tests)
    benchmark: {
      include: ['**/*.bench.{ts,tsx}'],
      exclude: ['node_modules', 'dist'],
    },
    
    // Pool options for test execution
    pool: 'threads',
    
    // Sequence configuration
    sequence: {
      shuffle: false,
      concurrent: false,
    },
    
    // Type checking
    typecheck: {
      enabled: false, // Can be enabled for type-level testing
    },
    
    // Snapshot configuration
    resolveSnapshotPath: (testPath, snapExtension) => {
      return testPath.replace(/\.test\.([tj]sx?)/, `${snapExtension}.$1`);
    },
    
    // Update snapshots
    update: false,
    
    // Bail on first failure (useful for CI)
    bail: 0,
    
    // Silent mode
    silent: false,
    
    // Hide skipped tests
    hideSkippedTests: false,
    
    // API configuration for UI mode
    api: {
      port: 51204,
      strictPort: false,
      host: '0.0.0.0',
    },
    
    // Inline configuration
    deps: {
      inline: [
        // Inline dependencies that need to be transformed
        '@radix-ui/react-select',
        '@radix-ui/react-dialog',
        '@radix-ui/react-dropdown-menu',
        '@radix-ui/react-popover',
        '@radix-ui/react-tooltip',
      ],
    },
    
    // Server configuration
    server: {
      deps: {
        inline: ['@testing-library/react', '@testing-library/user-event'],
      },
    },
  },
});
