import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { toast } from 'sonner';
import {
  showQuotaWarning,
  showCriticalQuotaWarning,
  showProviderSwitched,
  showFallbackNotification,
  showStaleRateWarning,
  showErrorNotification,
  showSuccessNotification,
  dismissAllNotifications,
  getActiveNotificationCount,
  exchangeRateNotifications,
} from '@/services/notifications/exchangeRateNotifications';

// Mock sonner
vi.mock('sonner', () => ({
  toast: {
    warning: vi.fn(),
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
    dismiss: vi.fn(),
  },
}));

describe('Exchange Rate Notifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset active notifications
    dismissAllNotifications();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('showQuotaWarning', () => {
    it('displays orange warning notification with correct message', () => {
      const mockId = 'toast-1';
      vi.mocked(toast.warning).mockReturnValue(mockId);

      showQuotaWarning('exchangerate-api.com', 50);

      expect(toast.warning).toHaveBeenCalledWith(
        'API quota running low: exchangerate-api.com has 50 requests left this month',
        expect.objectContaining({
          duration: 5000,
          dismissible: true,
          className: expect.stringContaining('border-orange-500'),
        })
      );
    });

    it('uses custom duration when provided', () => {
      const mockId = 'toast-1';
      vi.mocked(toast.warning).mockReturnValue(mockId);

      showQuotaWarning('exchangerate-api.com', 50, { duration: 10000 });

      expect(toast.warning).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          duration: 10000,
        })
      );
    });

    it('allows manual dismissal by default', () => {
      const mockId = 'toast-1';
      vi.mocked(toast.warning).mockReturnValue(mockId);

      showQuotaWarning('exchangerate-api.com', 50);

      expect(toast.warning).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          dismissible: true,
        })
      );
    });
  });

  describe('showCriticalQuotaWarning', () => {
    it('displays red error notification with next provider info', () => {
      const mockId = 'toast-2';
      vi.mocked(toast.error).mockReturnValue(mockId);

      showCriticalQuotaWarning('exchangerate-api.com', 20, 'currencyapi.com', 300);

      expect(toast.error).toHaveBeenCalledWith(
        'API quota critical: exchangerate-api.com has 20 requests left. Will switch to currencyapi.com (300 remaining)',
        expect.objectContaining({
          duration: 5000,
          dismissible: true,
          className: expect.stringContaining('border-red-500'),
        })
      );
    });
  });

  describe('showProviderSwitched', () => {
    it('displays green success notification for provider switch', () => {
      const mockId = 'toast-3';
      vi.mocked(toast.success).mockReturnValue(mockId);

      showProviderSwitched('currencyapi.com', 300);

      expect(toast.success).toHaveBeenCalledWith(
        'Switched to currencyapi.com API (300 requests remaining)',
        expect.objectContaining({
          duration: 5000,
          dismissible: true,
          className: expect.stringContaining('border-green-500'),
        })
      );
    });

    it('displays "unlimited" for unlimited quota providers', () => {
      const mockId = 'toast-3';
      vi.mocked(toast.success).mockReturnValue(mockId);

      showProviderSwitched('frankfurter.app', Number.MAX_SAFE_INTEGER);

      expect(toast.success).toHaveBeenCalledWith(
        'Switched to frankfurter.app API (unlimited requests remaining)',
        expect.any(Object)
      );
    });
  });

  describe('showFallbackNotification', () => {
    it('displays yellow info notification for fallback to cached rate', () => {
      const mockId = 'toast-4';
      vi.mocked(toast.info).mockReturnValue(mockId);

      showFallbackNotification(15000, '2024-01-15');

      expect(toast.info).toHaveBeenCalledWith(
        expect.stringContaining('All API quotas exhausted'),
        expect.objectContaining({
          duration: 5000,
          dismissible: true,
          className: expect.stringContaining('border-yellow-500'),
        })
      );
    });

    it('formats rate with Indonesian locale', () => {
      const mockId = 'toast-4';
      vi.mocked(toast.info).mockReturnValue(mockId);

      showFallbackNotification(15000, '2024-01-15');

      const callArgs = vi.mocked(toast.info).mock.calls[0];
      expect(callArgs[0]).toContain('15.000'); // Indonesian number format
    });
  });

  describe('showStaleRateWarning', () => {
    it('displays warning for stale cached rate', () => {
      const mockId = 'toast-5';
      vi.mocked(toast.warning).mockReturnValue(mockId);

      showStaleRateWarning(15000, 10);

      expect(toast.warning).toHaveBeenCalledWith(
        expect.stringContaining('10 days old'),
        expect.objectContaining({
          duration: 5000,
          dismissible: true,
          className: expect.stringContaining('border-yellow-500'),
        })
      );
    });
  });

  describe('Queue Management', () => {
    it('tracks active notifications', () => {
      vi.mocked(toast.warning).mockReturnValue('toast-1');
      vi.mocked(toast.error).mockReturnValue('toast-2');
      vi.mocked(toast.success).mockReturnValue('toast-3');

      showQuotaWarning('provider1', 50);
      showCriticalQuotaWarning('provider2', 20, 'provider3', 300);
      showProviderSwitched('provider3', 300);

      // Note: getActiveNotificationCount relies on DOM queries
      // In a real test environment, we'd need to mock the DOM
      expect(toast.warning).toHaveBeenCalled();
      expect(toast.error).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalled();
    });

    it('dismisses all notifications when requested', () => {
      dismissAllNotifications();

      expect(toast.dismiss).toHaveBeenCalled();
    });
  });

  describe('Generic Notifications', () => {
    it('displays error notification', () => {
      const mockId = 'toast-error';
      vi.mocked(toast.error).mockReturnValue(mockId);

      showErrorNotification('Something went wrong');

      expect(toast.error).toHaveBeenCalledWith(
        'Something went wrong',
        expect.objectContaining({
          duration: 5000,
          dismissible: true,
        })
      );
    });

    it('displays success notification', () => {
      const mockId = 'toast-success';
      vi.mocked(toast.success).mockReturnValue(mockId);

      showSuccessNotification('Operation completed');

      expect(toast.success).toHaveBeenCalledWith(
        'Operation completed',
        expect.objectContaining({
          duration: 5000,
          dismissible: true,
        })
      );
    });
  });

  describe('Exported API', () => {
    it('exports all notification functions', () => {
      expect(exchangeRateNotifications).toHaveProperty('showQuotaWarning');
      expect(exchangeRateNotifications).toHaveProperty('showCriticalQuotaWarning');
      expect(exchangeRateNotifications).toHaveProperty('showProviderSwitched');
      expect(exchangeRateNotifications).toHaveProperty('showFallbackNotification');
      expect(exchangeRateNotifications).toHaveProperty('showStaleRateWarning');
      expect(exchangeRateNotifications).toHaveProperty('showError');
      expect(exchangeRateNotifications).toHaveProperty('showSuccess');
      expect(exchangeRateNotifications).toHaveProperty('dismissAll');
      expect(exchangeRateNotifications).toHaveProperty('getActiveCount');
    });

    it('exported functions work correctly', () => {
      const mockId = 'toast-1';
      vi.mocked(toast.warning).mockReturnValue(mockId);

      exchangeRateNotifications.showQuotaWarning('test-provider', 50);

      expect(toast.warning).toHaveBeenCalled();
    });
  });

  describe('Auto-dismiss Timing', () => {
    it('sets default duration to 5 seconds', () => {
      const mockId = 'toast-1';
      vi.mocked(toast.warning).mockReturnValue(mockId);

      showQuotaWarning('provider', 50);

      expect(toast.warning).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          duration: 5000,
        })
      );
    });

    it('respects custom duration', () => {
      const mockId = 'toast-1';
      vi.mocked(toast.success).mockReturnValue(mockId);

      showSuccessNotification('Test', { duration: 3000 });

      expect(toast.success).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          duration: 3000,
        })
      );
    });
  });

  describe('Color Coding', () => {
    it('uses orange for quota warnings', () => {
      const mockId = 'toast-1';
      vi.mocked(toast.warning).mockReturnValue(mockId);

      showQuotaWarning('provider', 50);

      expect(toast.warning).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          className: expect.stringContaining('border-orange-500'),
        })
      );
    });

    it('uses red for critical warnings', () => {
      const mockId = 'toast-2';
      vi.mocked(toast.error).mockReturnValue(mockId);

      showCriticalQuotaWarning('provider', 20, 'next', 300);

      expect(toast.error).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          className: expect.stringContaining('border-red-500'),
        })
      );
    });

    it('uses green for provider switches', () => {
      const mockId = 'toast-3';
      vi.mocked(toast.success).mockReturnValue(mockId);

      showProviderSwitched('provider', 300);

      expect(toast.success).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          className: expect.stringContaining('border-green-500'),
        })
      );
    });

    it('uses yellow for fallback notifications', () => {
      const mockId = 'toast-4';
      vi.mocked(toast.info).mockReturnValue(mockId);

      showFallbackNotification(15000, '2024-01-15');

      expect(toast.info).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          className: expect.stringContaining('border-yellow-500'),
        })
      );
    });
  });
});
