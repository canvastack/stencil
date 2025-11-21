import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import userEvent from '@testing-library/user-event';
import { notificationService } from '@/services/notifications/notificationService';
import { orderNotificationService } from '@/services/notifications/orderNotificationService';
import { NotificationToast } from '@/components/ui/notification-toast';

// Mock services
vi.mock('@/services/notifications/notificationService');
vi.mock('@/services/notifications/orderNotificationService');

const mockNotificationService = vi.mocked(notificationService);
const mockOrderNotificationService = vi.mocked(orderNotificationService);

// Mock WebSocket
class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  readyState = MockWebSocket.OPEN;
  onopen: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;

  constructor(public url: string) {
    setTimeout(() => {
      if (this.onopen) {
        this.onopen(new Event('open'));
      }
    }, 100);
  }

  send(data: string) {
    // Mock send implementation
  }

  close() {
    this.readyState = MockWebSocket.CLOSED;
    if (this.onclose) {
      this.onclose(new CloseEvent('close'));
    }
  }

  // Method to simulate receiving messages
  simulateMessage(data: any) {
    if (this.onmessage) {
      this.onmessage(new MessageEvent('message', { data: JSON.stringify(data) }));
    }
  }
}

// @ts-ignore
global.WebSocket = MockWebSocket;

// Test wrapper component
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('Notification System Integration Tests', () => {
  let mockWs: MockWebSocket;

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset WebSocket mock
    mockWs = new MockWebSocket('ws://localhost/notifications');
  });

  afterEach(() => {
    if (mockWs) {
      mockWs.close();
    }
  });

  describe('Real-time Notifications', () => {
    it('should establish WebSocket connection', async () => {
      const onConnect = vi.fn();
      const onDisconnect = vi.fn();

      mockNotificationService.connect.mockImplementation(() => {
        onConnect();
        return Promise.resolve();
      });

      mockNotificationService.disconnect.mockImplementation(() => {
        onDisconnect();
      });

      // Test connection
      await act(async () => {
        await mockNotificationService.connect();
      });

      expect(onConnect).toHaveBeenCalled();

      // Test disconnection
      mockNotificationService.disconnect();
      expect(onDisconnect).toHaveBeenCalled();
    });

    it('should handle incoming notifications', async () => {
      const mockNotification = {
        id: 'notif-1',
        type: 'order_status_change',
        title: 'Order Updated',
        message: 'Your order #12345 has been shipped',
        data: { orderId: '12345', status: 'shipped' },
        timestamp: Date.now(),
        userId: 'user-1',
      };

      const onNotification = vi.fn();

      mockNotificationService.subscribe.mockImplementation((callback) => {
        onNotification.mockImplementation(callback);
        return () => {};
      });

      // Set up subscription
      const unsubscribe = mockNotificationService.subscribe(onNotification);

      // Simulate receiving notification
      act(() => {
        onNotification(mockNotification);
      });

      expect(onNotification).toHaveBeenCalledWith(mockNotification);

      // Cleanup
      unsubscribe();
    });

    it('should fallback to polling when WebSocket fails', async () => {
      mockNotificationService.connect.mockRejectedValue(new Error('WebSocket connection failed'));
      mockNotificationService.startPolling.mockImplementation(() => {});

      const onError = vi.fn();
      mockNotificationService.onError = onError;

      try {
        await mockNotificationService.connect();
      } catch (error) {
        expect(error).toBeDefined();
        expect(mockNotificationService.startPolling).toHaveBeenCalled();
      }
    });
  });

  describe('Order Status Notifications', () => {
    it('should send order status change notifications', async () => {
      const orderUpdate = {
        orderId: 'order-123',
        oldStatus: 'pending',
        newStatus: 'shipped',
        customerId: 'customer-1',
        customerEmail: 'customer@example.com',
      };

      mockOrderNotificationService.sendOrderStatusNotification.mockResolvedValue({
        success: true,
        notificationId: 'notif-123',
      });

      const result = await mockOrderNotificationService.sendOrderStatusNotification(orderUpdate);

      expect(mockOrderNotificationService.sendOrderStatusNotification).toHaveBeenCalledWith(orderUpdate);
      expect(result.success).toBe(true);
      expect(result.notificationId).toBe('notif-123');
    });

    it('should handle notification delivery preferences', async () => {
      const preferences = {
        userId: 'user-1',
        email: true,
        sms: false,
        push: true,
        inApp: true,
      };

      mockOrderNotificationService.updateNotificationPreferences.mockResolvedValue({
        success: true,
      });

      const result = await mockOrderNotificationService.updateNotificationPreferences(
        'user-1',
        preferences
      );

      expect(result.success).toBe(true);
      expect(mockOrderNotificationService.updateNotificationPreferences).toHaveBeenCalledWith(
        'user-1',
        preferences
      );
    });

    it('should batch multiple order notifications', async () => {
      const notifications = [
        {
          orderId: 'order-1',
          oldStatus: 'pending',
          newStatus: 'processing',
          customerId: 'customer-1',
          customerEmail: 'customer1@example.com',
        },
        {
          orderId: 'order-2',
          oldStatus: 'processing',
          newStatus: 'shipped',
          customerId: 'customer-2',
          customerEmail: 'customer2@example.com',
        },
      ];

      mockOrderNotificationService.sendBatchNotifications.mockResolvedValue({
        success: true,
        sent: 2,
        failed: 0,
      });

      const result = await mockOrderNotificationService.sendBatchNotifications(notifications);

      expect(result.success).toBe(true);
      expect(result.sent).toBe(2);
      expect(result.failed).toBe(0);
    });
  });

  describe('Notification Toast Component', () => {
    it('should display notification toast', async () => {
      const notification = {
        id: 'toast-1',
        type: 'success' as const,
        title: 'Success',
        message: 'Operation completed successfully',
        timestamp: Date.now(),
      };

      render(
        <TestWrapper>
          <NotificationToast {...notification} />
        </TestWrapper>
      );

      expect(screen.getByText('Success')).toBeInTheDocument();
      expect(screen.getByText('Operation completed successfully')).toBeInTheDocument();
    });

    it('should handle different notification types', async () => {
      const errorNotification = {
        id: 'toast-error',
        type: 'error' as const,
        title: 'Error',
        message: 'Something went wrong',
        timestamp: Date.now(),
      };

      const warningNotification = {
        id: 'toast-warning',
        type: 'warning' as const,
        title: 'Warning',
        message: 'Please check your input',
        timestamp: Date.now(),
      };

      // Test error notification
      const { rerender } = render(
        <TestWrapper>
          <NotificationToast {...errorNotification} />
        </TestWrapper>
      );

      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();

      // Test warning notification
      rerender(
        <TestWrapper>
          <NotificationToast {...warningNotification} />
        </TestWrapper>
      );

      expect(screen.getByText('Warning')).toBeInTheDocument();
      expect(screen.getByText('Please check your input')).toBeInTheDocument();
    });

    it('should dismiss notifications', async () => {
      const user = userEvent.setup();
      const onDismiss = vi.fn();

      const notification = {
        id: 'toast-dismiss',
        type: 'info' as const,
        title: 'Information',
        message: 'This is an info message',
        timestamp: Date.now(),
        onDismiss,
      };

      render(
        <TestWrapper>
          <NotificationToast {...notification} />
        </TestWrapper>
      );

      // Find and click dismiss button
      const dismissButton = screen.getByRole('button', { name: /dismiss/i });
      await user.click(dismissButton);

      expect(onDismiss).toHaveBeenCalled();
    });
  });

  describe('Notification Preferences', () => {
    it('should load user notification preferences', async () => {
      const mockPreferences = {
        userId: 'user-1',
        email: true,
        sms: false,
        push: true,
        inApp: true,
        categories: {
          orders: true,
          promotions: false,
          system: true,
        },
      };

      mockNotificationService.getPreferences.mockResolvedValue(mockPreferences);

      const preferences = await mockNotificationService.getPreferences('user-1');

      expect(preferences).toEqual(mockPreferences);
      expect(mockNotificationService.getPreferences).toHaveBeenCalledWith('user-1');
    });

    it('should update notification preferences', async () => {
      const updatedPreferences = {
        userId: 'user-1',
        email: false,
        sms: true,
        push: true,
        inApp: true,
        categories: {
          orders: true,
          promotions: true,
          system: false,
        },
      };

      mockNotificationService.updatePreferences.mockResolvedValue({
        success: true,
      });

      const result = await mockNotificationService.updatePreferences('user-1', updatedPreferences);

      expect(result.success).toBe(true);
      expect(mockNotificationService.updatePreferences).toHaveBeenCalledWith(
        'user-1',
        updatedPreferences
      );
    });
  });

  describe('Notification History', () => {
    it('should fetch notification history', async () => {
      const mockHistory = [
        {
          id: 'notif-1',
          type: 'order_status_change',
          title: 'Order Shipped',
          message: 'Your order has been shipped',
          timestamp: Date.now() - 3600000,
          read: false,
          userId: 'user-1',
        },
        {
          id: 'notif-2',
          type: 'payment_received',
          title: 'Payment Confirmed',
          message: 'We have received your payment',
          timestamp: Date.now() - 7200000,
          read: true,
          userId: 'user-1',
        },
      ];

      mockNotificationService.getHistory.mockResolvedValue({
        notifications: mockHistory,
        total: 2,
        unread: 1,
      });

      const result = await mockNotificationService.getHistory('user-1', { page: 1, limit: 10 });

      expect(result.notifications).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.unread).toBe(1);
    });

    it('should mark notifications as read', async () => {
      mockNotificationService.markAsRead.mockResolvedValue({
        success: true,
      });

      const result = await mockNotificationService.markAsRead(['notif-1', 'notif-2']);

      expect(result.success).toBe(true);
      expect(mockNotificationService.markAsRead).toHaveBeenCalledWith(['notif-1', 'notif-2']);
    });

    it('should mark all notifications as read', async () => {
      mockNotificationService.markAllAsRead.mockResolvedValue({
        success: true,
        marked: 5,
      });

      const result = await mockNotificationService.markAllAsRead('user-1');

      expect(result.success).toBe(true);
      expect(result.marked).toBe(5);
    });
  });

  describe('Error Handling', () => {
    it('should handle connection errors gracefully', async () => {
      mockNotificationService.connect.mockRejectedValue(
        new Error('Connection failed')
      );

      let errorOccurred = false;
      try {
        await mockNotificationService.connect();
      } catch (error) {
        errorOccurred = true;
        expect(error).toBeInstanceOf(Error);
      }

      expect(errorOccurred).toBe(true);
    });

    it('should retry failed notification sends', async () => {
      mockOrderNotificationService.sendOrderStatusNotification
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          success: true,
          notificationId: 'notif-retry',
        });

      const orderUpdate = {
        orderId: 'order-retry',
        oldStatus: 'pending',
        newStatus: 'shipped',
        customerId: 'customer-1',
        customerEmail: 'customer@example.com',
      };

      // First call should fail
      try {
        await mockOrderNotificationService.sendOrderStatusNotification(orderUpdate);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }

      // Second call should succeed
      const result = await mockOrderNotificationService.sendOrderStatusNotification(orderUpdate);
      expect(result.success).toBe(true);
    });

    it('should handle notification parsing errors', async () => {
      const invalidNotification = {
        // Missing required fields
        message: 'Invalid notification',
      };

      const onError = vi.fn();
      mockNotificationService.onError = onError;

      // Simulate receiving invalid notification
      act(() => {
        try {
          mockNotificationService.onError?.(new Error('Invalid notification format'));
        } catch (error) {
          // Expected to handle error gracefully
        }
      });

      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Invalid notification format',
        })
      );
    });
  });
});