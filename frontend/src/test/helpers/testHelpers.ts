/**
 * Test Helper Utilities
 * Reusable functions untuk integration dan E2E testing
 */

import { authService } from '@/services/api/auth';

/**
 * Test Credentials untuk berbagai roles
 */
export const TEST_CREDENTIALS = {
  platform: {
    admin: {
      email: 'admin@canvastencil.com',
      password: 'Admin@2024',
      accountType: 'platform' as const,
    },
  },
  tenant: {
    admin: {
      email: 'admin@etchinx.com',
      password: 'DemoAdmin2024!',
      tenantSlug: 'demo-etching',
    },
    manager: {
      email: 'manager@etchinx.com',
      password: 'DemoManager2024!',
      tenantSlug: 'demo-etching',
    },
    sales: {
      email: 'sales@etchinx.com',
      password: 'DemoSales2024!',
      tenantSlug: 'demo-etching',
    },
  },
};

/**
 * Check if backend is available
 */
export async function isBackendAvailable(): Promise<boolean> {
  try {
    const response = await fetch('http://localhost:8000/api/health', {
      method: 'GET',
      signal: AbortSignal.timeout(3000),
    });
    return response.ok;
  } catch (error) {
    return false;
  }
}

/**
 * Wait for backend to be ready
 */
export async function waitForBackend(
  maxWaitMs: number = 30000,
  checkIntervalMs: number = 1000
): Promise<boolean> {
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitMs) {
    if (await isBackendAvailable()) {
      return true;
    }
    await new Promise(resolve => setTimeout(resolve, checkIntervalMs));
  }

  return false;
}

/**
 * Login helper untuk integration tests
 */
export async function loginAsUser(
  role: 'admin' | 'manager' | 'sales',
  accountType: 'platform' | 'tenant' = 'tenant'
): Promise<{
  token: string;
  user: any;
  tenant?: any;
}> {
  let credentials;

  if (accountType === 'platform') {
    credentials = TEST_CREDENTIALS.platform.admin;
  } else {
    credentials = TEST_CREDENTIALS.tenant[role];
  }

  try {
    const response = await authService.login({
      email: credentials.email,
      password: credentials.password,
      tenant_slug: 'tenantSlug' in credentials ? credentials.tenantSlug : undefined,
      account_type: accountType,
    });

    return {
      token: response.access_token,
      user: response.user,
      tenant: response.tenant,
    };
  } catch (error) {
    if (error.message?.includes('ECONNREFUSED')) {
      throw new Error('Backend server not running. Please start the backend.');
    }
    throw error;
  }
}

/**
 * Setup authentication context untuk tests
 */
export async function setupAuthContext(
  role: 'admin' | 'manager' | 'sales' = 'admin',
  accountType: 'platform' | 'tenant' = 'tenant'
): Promise<{
  token: string;
  user: any;
  tenant?: any;
  cleanup: () => void;
}> {
  const auth = await loginAsUser(role, accountType);

  // Store in localStorage for API clients
  localStorage.setItem('access_token', auth.token);
  localStorage.setItem('user', JSON.stringify(auth.user));
  if (auth.tenant) {
    localStorage.setItem('tenant', JSON.stringify(auth.tenant));
    localStorage.setItem('tenant_id', auth.tenant.uuid);
  }

  const cleanup = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    localStorage.removeItem('tenant');
    localStorage.removeItem('tenant_id');
  };

  return {
    ...auth,
    cleanup,
  };
}

/**
 * Generate random test data
 */
export const TestDataGenerator = {
  /**
   * Generate random email
   */
  email: (prefix: string = 'test'): string => {
    const timestamp = Date.now();
    return `${prefix}-${timestamp}@test.com`;
  },

  /**
   * Generate random SKU
   */
  sku: (prefix: string = 'TST'): string => {
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}-${random}`;
  },

  /**
   * Generate random phone number
   */
  phone: (): string => {
    const areaCode = Math.floor(Math.random() * 900) + 100;
    const firstPart = Math.floor(Math.random() * 900) + 100;
    const secondPart = Math.floor(Math.random() * 9000) + 1000;
    return `+62${areaCode}${firstPart}${secondPart}`;
  },

  /**
   * Generate random price
   */
  price: (min: number = 10000, max: number = 1000000): number => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },

  /**
   * Generate random quantity
   */
  quantity: (min: number = 1, max: number = 100): number => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },

  /**
   * Generate product data
   */
  product: (overrides: Partial<any> = {}) => ({
    name: `Test Product ${Date.now()}`,
    sku: TestDataGenerator.sku(),
    description: 'Test product description',
    price: TestDataGenerator.price(),
    currency: 'IDR',
    stock_quantity: TestDataGenerator.quantity(),
    status: 'published',
    ...overrides,
  }),

  /**
   * Generate customer data
   */
  customer: (overrides: Partial<any> = {}) => ({
    name: `Test Customer ${Date.now()}`,
    email: TestDataGenerator.email('customer'),
    phone: TestDataGenerator.phone(),
    address: 'Jl. Test No. 123',
    city: 'Jakarta',
    postal_code: '12345',
    country: 'Indonesia',
    ...overrides,
  }),

  /**
   * Generate order data
   */
  order: (overrides: Partial<any> = {}) => ({
    customer_name: `Test Customer ${Date.now()}`,
    customer_email: TestDataGenerator.email('customer'),
    customer_phone: TestDataGenerator.phone(),
    status: 'pending',
    total_amount: TestDataGenerator.price(),
    currency: 'IDR',
    ...overrides,
  }),
};

/**
 * Test assertions helpers
 */
export const TestAssertions = {
  /**
   * Assert UUID format
   */
  isUUID: (value: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value);
  },

  /**
   * Assert timestamp format (ISO 8601)
   */
  isISOTimestamp: (value: string): boolean => {
    const date = new Date(value);
    return !isNaN(date.getTime()) && date.toISOString() === value;
  },

  /**
   * Assert email format
   */
  isEmail: (value: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  },

  /**
   * Assert tenant isolation
   */
  belongsToTenant: (item: any, tenantId: string): boolean => {
    return item.tenant_id === tenantId;
  },

  /**
   * Assert all items belong to tenant
   */
  allBelongToTenant: (items: any[], tenantId: string): boolean => {
    return items.every(item => TestAssertions.belongsToTenant(item, tenantId));
  },
};

/**
 * Performance measurement helpers
 */
export const PerformanceHelpers = {
  /**
   * Measure execution time
   */
  measureTime: async <T>(fn: () => Promise<T>): Promise<{ result: T; duration: number }> => {
    const startTime = performance.now();
    const result = await fn();
    const duration = performance.now() - startTime;

    return { result, duration };
  },

  /**
   * Assert execution time is below threshold
   */
  assertTimingBelow: async <T>(
    fn: () => Promise<T>,
    maxDurationMs: number
  ): Promise<T> => {
    const { result, duration } = await PerformanceHelpers.measureTime(fn);

    if (duration > maxDurationMs) {
      throw new Error(
        `Execution took ${duration.toFixed(2)}ms, expected < ${maxDurationMs}ms`
      );
    }

    return result;
  },

  /**
   * Run multiple iterations and get average time
   */
  benchmark: async (
    fn: () => Promise<any>,
    iterations: number = 10
  ): Promise<{
    avgDuration: number;
    minDuration: number;
    maxDuration: number;
    stdDev: number;
  }> => {
    const durations: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const { duration } = await PerformanceHelpers.measureTime(fn);
      durations.push(duration);
    }

    const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
    const minDuration = Math.min(...durations);
    const maxDuration = Math.max(...durations);

    // Calculate standard deviation
    const variance =
      durations.reduce((acc, val) => acc + Math.pow(val - avgDuration, 2), 0) /
      durations.length;
    const stdDev = Math.sqrt(variance);

    return {
      avgDuration,
      minDuration,
      maxDuration,
      stdDev,
    };
  },
};

/**
 * Mock helpers untuk testing
 */
export const MockHelpers = {
  /**
   * Create mock AbortSignal
   */
  createAbortSignal: (): AbortSignal => {
    const controller = new AbortController();
    return controller.signal;
  },

  /**
   * Create timeout signal
   */
  createTimeoutSignal: (ms: number): AbortSignal => {
    return AbortSignal.timeout(ms);
  },
};

/**
 * Wait for condition to be true
 */
export async function waitFor(
  condition: () => boolean | Promise<boolean>,
  options: {
    timeout?: number;
    interval?: number;
    errorMessage?: string;
  } = {}
): Promise<void> {
  const {
    timeout = 5000,
    interval = 100,
    errorMessage = 'Timeout waiting for condition',
  } = options;

  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const result = await Promise.resolve(condition());
    if (result) {
      return;
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }

  throw new Error(errorMessage);
}

/**
 * Retry function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    initialDelay?: number;
    maxDelay?: number;
    backoffFactor?: number;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffFactor = 2,
  } = options;

  let lastError: Error;
  let delay = initialDelay;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delay));
        delay = Math.min(delay * backoffFactor, maxDelay);
      }
    }
  }

  throw new Error(
    `Failed after ${maxRetries} retries. Last error: ${lastError!.message}`
  );
}

/**
 * Skip test if backend is not available
 */
export async function skipIfBackendUnavailable(): Promise<void> {
  const available = await isBackendAvailable();
  if (!available) {
    console.warn('⏭️  Backend not available, skipping test');
    return;
  }
}
