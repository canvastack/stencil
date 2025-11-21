import '@testing-library/jest-dom';
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers);

// Cleanup after each test case
afterEach(() => {
  cleanup();
});

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  disconnect: vi.fn(),
  observe: vi.fn(),
  unobserve: vi.fn(),
}));

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  disconnect: vi.fn(),
  observe: vi.fn(),
  unobserve: vi.fn(),
}));

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock scrollTo
global.scrollTo = vi.fn();

// Mock HTMLDialogElement methods
global.HTMLDialogElement = class MockHTMLDialogElement extends HTMLElement {
  showModal = vi.fn();
  close = vi.fn();
  show = vi.fn();
};

// Mock fetch if not available
if (!global.fetch) {
  global.fetch = vi.fn();
}

// Mock performance API
if (!global.performance) {
  global.performance = {
    now: vi.fn(() => Date.now()),
    mark: vi.fn(),
    measure: vi.fn(),
    getEntriesByType: vi.fn(() => []),
    getEntriesByName: vi.fn(() => []),
    clearMarks: vi.fn(),
    clearMeasures: vi.fn(),
    clearResourceTimings: vi.fn(),
    setResourceTimingBufferSize: vi.fn(),
    timing: {} as PerformanceTiming,
    navigation: {} as PerformanceNavigation,
    memory: {
      jsHeapSizeLimit: 1073741824,
      totalJSHeapSize: 10000000,
      usedJSHeapSize: 10000000,
    },
    onresourcetimingbufferfull: null,
    timeOrigin: Date.now(),
    toJSON: vi.fn(() => ({})),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  } as any;
}

// Mock crypto
if (!global.crypto) {
  global.crypto = {
    getRandomValues: vi.fn((arr) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    }),
    randomUUID: vi.fn(() => 'mock-uuid'),
    subtle: {} as SubtleCrypto,
  } as any;
}