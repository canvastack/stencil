import { useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { notificationService, type Notification } from '@/services/notificationService';

export interface RealTimeNotificationData {
  order: {
    id: number;
    uuid: string;
    order_number: string;
    status: string;
    payment_status: string;
    total_amount: number;
    customer_id?: number;
    vendor_id?: number;
  };
  status_change: {
    old_status: string;
    new_status: string;
    changed_by?: string;
    reason?: string;
    changed_at: string;
  };
  notification: {
    title: string;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
    is_critical: boolean;
  };
  metadata: {
    tenant_id: string;
    timestamp: number;
    event_type: string;
  };
}

interface UseRealTimeNotificationsOptions {
  onOrderStatusChanged?: (data: RealTimeNotificationData) => void;
  onNotificationReceived?: (notification: Notification) => void;
  enableToasts?: boolean;
  enableSound?: boolean;
}

export function useRealTimeNotifications(options: UseRealTimeNotificationsOptions = {}) {
  const {
    onOrderStatusChanged,
    onNotificationReceived,
    enableToasts = true,
    enableSound = false
  } = options;

  const connectionRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const playNotificationSound = useCallback(() => {
    if (!enableSound) return;
    
    try {
      // Create a simple notification sound
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
      console.warn('Could not play notification sound:', error);
    }
  }, [enableSound]);

  const showToastNotification = useCallback((data: RealTimeNotificationData) => {
    if (!enableToasts) return;

    const { notification, order } = data;
    
    toast[notification.type](notification.message, {
      description: `Pesanan ${order.order_number}`,
      duration: notification.is_critical ? 8000 : 4000,
      action: notification.is_critical ? {
        label: 'Lihat Detail',
        onClick: () => {
          // Navigate to order detail page
          window.location.href = `/admin/orders/${order.uuid}`;
        }
      } : undefined,
    });
  }, [enableToasts]);

  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data);
      
      // Handle different event types
      if (data.event === 'order.status.changed') {
        const notificationData = data.data as RealTimeNotificationData;
        
        // Play sound for critical notifications
        if (notificationData.notification.is_critical) {
          playNotificationSound();
        }
        
        // Show toast notification
        showToastNotification(notificationData);
        
        // Call custom handlers
        onOrderStatusChanged?.(notificationData);
        
        // Create notification object for the callback
        const notification: Notification = {
          id: `realtime-${Date.now()}`,
          type: 'App\\Domain\\Order\\Notifications\\OrderStatusChangedNotification',
          data: {
            order_id: notificationData.order.id,
            order_uuid: notificationData.order.uuid,
            order_number: notificationData.order.order_number,
            old_status: notificationData.status_change.old_status,
            new_status: notificationData.status_change.new_status,
            message: notificationData.notification.message,
            is_critical: notificationData.notification.is_critical,
            changed_by: notificationData.status_change.changed_by,
            reason: notificationData.status_change.reason,
          },
          read_at: null,
          created_at: notificationData.status_change.changed_at,
          updated_at: notificationData.status_change.changed_at,
        };
        
        onNotificationReceived?.(notification);
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  }, [onOrderStatusChanged, onNotificationReceived, playNotificationSound, showToastNotification]);

  const connect = useCallback(() => {
    // For now, we'll use a polling mechanism since WebSocket setup requires more infrastructure
    // In a real implementation, you would connect to Laravel Echo/Pusher/Reverb here
    
    console.log('Real-time notifications: Using polling fallback');
    
    // Simulate real-time updates by polling for new notifications
    const pollForNotifications = async () => {
      try {
        const response = await notificationService.getNotifications({ 
          per_page: 5, 
          unread_only: true 
        });
        
        // This is a simplified implementation
        // In a real scenario, you'd track which notifications are new
        // and only trigger callbacks for truly new ones
        
      } catch (error) {
        console.error('Error polling for notifications:', error);
      }
    };
    
    // Poll every 30 seconds for new notifications
    const pollInterval = setInterval(pollForNotifications, 30000);
    
    return () => {
      clearInterval(pollInterval);
    };
  }, []);

  const disconnect = useCallback(() => {
    if (connectionRef.current) {
      connectionRef.current.close();
      connectionRef.current = null;
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  // Connect on mount, disconnect on unmount
  useEffect(() => {
    const cleanup = connect();
    
    return () => {
      disconnect();
      cleanup?.();
    };
  }, [connect, disconnect]);

  return {
    isConnected: true, // For polling fallback, always consider connected
    reconnectAttempts: reconnectAttempts.current,
    disconnect,
    connect,
  };
}

// Hook for order-specific real-time updates
export function useOrderRealTimeNotifications(orderUuid: string, options: UseRealTimeNotificationsOptions = {}) {
  return useRealTimeNotifications({
    ...options,
    onOrderStatusChanged: (data) => {
      // Only handle notifications for this specific order
      if (data.order.uuid === orderUuid) {
        options.onOrderStatusChanged?.(data);
      }
    },
  });
}