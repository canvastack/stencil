/**
 * Test Setup and Polyfills
 * 
 * This file provides polyfills and setup for JSDOM compatibility
 * with modern browser APIs used by UI libraries like Radix UI.
 */

import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers);

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// ============================================================================
// JSDOM Polyfills for Radix UI and Modern Browser APIs
// ============================================================================

/**
 * Polyfill for hasPointerCapture
 * Required by Radix UI Select and other pointer-based components
 */
if (!Element.prototype.hasPointerCapture) {
  Element.prototype.hasPointerCapture = function (pointerId: number): boolean {
    return false;
  };
}

/**
 * Polyfill for setPointerCapture
 * Required by Radix UI for pointer event handling
 */
if (!Element.prototype.setPointerCapture) {
  Element.prototype.setPointerCapture = function (pointerId: number): void {
    // No-op in test environment
  };
}

/**
 * Polyfill for releasePointerCapture
 * Required by Radix UI for pointer event handling
 */
if (!Element.prototype.releasePointerCapture) {
  Element.prototype.releasePointerCapture = function (pointerId: number): void {
    // No-op in test environment
  };
}

/**
 * Polyfill for scrollIntoView
 * Required by many UI components for scroll behavior
 */
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = function (arg?: boolean | ScrollIntoViewOptions): void {
    // No-op in test environment
  };
}

/**
 * Polyfill for ResizeObserver
 * Required by components that observe element size changes
 */
if (typeof global.ResizeObserver === 'undefined') {
  global.ResizeObserver = class ResizeObserver {
    observe() {
      // No-op
    }
    unobserve() {
      // No-op
    }
    disconnect() {
      // No-op
    }
  } as any;
}

/**
 * Polyfill for IntersectionObserver
 * Required by lazy loading and visibility detection
 */
if (typeof global.IntersectionObserver === 'undefined') {
  global.IntersectionObserver = class IntersectionObserver {
    constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
      // No-op
    }
    observe() {
      // No-op
    }
    unobserve() {
      // No-op
    }
    disconnect() {
      // No-op
    }
    takeRecords(): IntersectionObserverEntry[] {
      return [];
    }
    readonly root: Element | Document | null = null;
    readonly rootMargin: string = '';
    readonly thresholds: ReadonlyArray<number> = [];
  } as any;
}

/**
 * Polyfill for matchMedia
 * Required by responsive components and media queries
 */
if (typeof window.matchMedia === 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(), // Deprecated
      removeListener: vi.fn(), // Deprecated
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

/**
 * Polyfill for getComputedStyle
 * Required by components that read computed CSS values
 */
if (typeof window.getComputedStyle === 'undefined') {
  window.getComputedStyle = (element: Element) => {
    return {
      getPropertyValue: () => '',
    } as CSSStyleDeclaration;
  };
}

/**
 * Mock for localStorage
 * Provides a working localStorage implementation in tests
 */
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (index: number) => {
      const keys = Object.keys(store);
      return keys[index] || null;
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

/**
 * Mock for sessionStorage
 * Provides a working sessionStorage implementation in tests
 */
const sessionStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (index: number) => {
      const keys = Object.keys(store);
      return keys[index] || null;
    },
  };
})();

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
});

/**
 * Suppress console errors in tests
 * Uncomment if you want to suppress expected errors
 */
// const originalError = console.error;
// beforeAll(() => {
//   console.error = (...args: any[]) => {
//     if (
//       typeof args[0] === 'string' &&
//       (args[0].includes('Warning: ReactDOM.render') ||
//        args[0].includes('Not implemented: HTMLFormElement.prototype.submit'))
//     ) {
//       return;
//     }
//     originalError.call(console, ...args);
//   };
// });
// 
// afterAll(() => {
//   console.error = originalError;
// });

/**
 * Global test utilities
 */
export const testUtils = {
  /**
   * Wait for a condition to be true
   */
  waitFor: async (condition: () => boolean, timeout = 5000): Promise<void> => {
    const startTime = Date.now();
    while (!condition()) {
      if (Date.now() - startTime > timeout) {
        throw new Error('Timeout waiting for condition');
      }
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  },

  /**
   * Flush all pending promises
   */
  flushPromises: (): Promise<void> => {
    return new Promise(resolve => setImmediate(resolve));
  },
};
