import { describe, test, expect, vi, beforeEach } from 'vitest';
import { toast } from '@/lib/toast-config';
import { toast as sonnerToast } from 'sonner';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
    loading: vi.fn(),
    promise: vi.fn(),
  },
}));

describe('Toast Configuration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('toast.success', () => {
    test('should call sonner success with default icon and duration', () => {
      toast.success('Operation successful');

      expect(sonnerToast.success).toHaveBeenCalledWith('Operation successful', {
        icon: '✅',
        duration: 3000,
      });
    });

    test('should allow custom options override', () => {
      toast.success('Custom success', { duration: 5000, description: 'Details here' });

      expect(sonnerToast.success).toHaveBeenCalledWith('Custom success', {
        icon: '✅',
        duration: 5000,
        description: 'Details here',
      });
    });
  });

  describe('toast.error', () => {
    test('should call sonner error with default icon and duration', () => {
      toast.error('Operation failed');

      expect(sonnerToast.error).toHaveBeenCalledWith('Operation failed', {
        icon: '❌',
        duration: 5000,
      });
    });

    test('should allow custom options override', () => {
      toast.error('Custom error', { duration: 10000, description: 'Error details' });

      expect(sonnerToast.error).toHaveBeenCalledWith('Custom error', {
        icon: '❌',
        duration: 10000,
        description: 'Error details',
      });
    });
  });

  describe('toast.info', () => {
    test('should call sonner info with default icon and duration', () => {
      toast.info('Information message');

      expect(sonnerToast.info).toHaveBeenCalledWith('Information message', {
        icon: 'ℹ️',
        duration: 3000,
      });
    });

    test('should allow custom options override', () => {
      toast.info('Custom info', { duration: 4000 });

      expect(sonnerToast.info).toHaveBeenCalledWith('Custom info', {
        icon: 'ℹ️',
        duration: 4000,
      });
    });
  });

  describe('toast.warning', () => {
    test('should call sonner warning with default icon and duration', () => {
      toast.warning('Warning message');

      expect(sonnerToast.warning).toHaveBeenCalledWith('Warning message', {
        icon: '⚠️',
        duration: 4000,
      });
    });

    test('should allow custom options override', () => {
      toast.warning('Custom warning', { duration: 6000, description: 'Be careful' });

      expect(sonnerToast.warning).toHaveBeenCalledWith('Custom warning', {
        icon: '⚠️',
        duration: 6000,
        description: 'Be careful',
      });
    });
  });

  describe('toast.loading', () => {
    test('should call sonner loading without default options', () => {
      toast.loading('Loading...');

      expect(sonnerToast.loading).toHaveBeenCalledWith('Loading...', undefined);
    });

    test('should pass custom options', () => {
      toast.loading('Processing...', { description: 'Please wait' });

      expect(sonnerToast.loading).toHaveBeenCalledWith('Processing...', { description: 'Please wait' });
    });
  });

  describe('toast.promise', () => {
    test('should call sonner promise with all message types', async () => {
      const mockPromise = Promise.resolve({ id: '123', name: 'Test' });
      const messages = {
        loading: 'Creating vendor...',
        success: 'Vendor created successfully!',
        error: 'Failed to create vendor',
      };

      toast.promise(mockPromise, messages);

      expect(sonnerToast.promise).toHaveBeenCalledWith(mockPromise, messages, undefined);
    });

    test('should support function-based messages', async () => {
      const mockPromise = Promise.resolve({ id: '123', name: 'Test Vendor' });
      const messages = {
        loading: 'Creating vendor...',
        success: (data: any) => `Vendor ${data.name} created successfully!`,
        error: (err: any) => `Failed: ${err.message}`,
      };

      toast.promise(mockPromise, messages);

      expect(sonnerToast.promise).toHaveBeenCalledWith(mockPromise, messages, undefined);
    });

    test('should pass custom options', async () => {
      const mockPromise = Promise.resolve('done');
      const messages = {
        loading: 'Loading...',
        success: 'Done!',
        error: 'Error!',
      };
      const options = { duration: 5000 };

      toast.promise(mockPromise, messages, options);

      expect(sonnerToast.promise).toHaveBeenCalledWith(mockPromise, messages, options);
    });
  });

  describe('Return values', () => {
    test('toast.success should return the result from sonner', () => {
      const mockReturn = 'toast-id-123';
      vi.mocked(sonnerToast.success).mockReturnValue(mockReturn as any);

      const result = toast.success('Test');

      expect(result).toBe(mockReturn);
    });

    test('toast.error should return the result from sonner', () => {
      const mockReturn = 'toast-id-456';
      vi.mocked(sonnerToast.error).mockReturnValue(mockReturn as any);

      const result = toast.error('Test');

      expect(result).toBe(mockReturn);
    });

    test('toast.loading should return the result from sonner', () => {
      const mockReturn = 'toast-id-789';
      vi.mocked(sonnerToast.loading).mockReturnValue(mockReturn as any);

      const result = toast.loading('Test');

      expect(result).toBe(mockReturn);
    });
  });
});
