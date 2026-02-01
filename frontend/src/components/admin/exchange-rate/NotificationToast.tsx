import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { X, AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react';

export interface ToastNotification {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
  duration?: number; // in milliseconds, default 5000
  persistent?: boolean; // if true, won't auto-dismiss
}

interface NotificationToastProps {
  notifications: ToastNotification[];
  onDismiss: (id: string) => void;
  maxVisible?: number;
}

export function NotificationToast({ 
  notifications, 
  onDismiss, 
  maxVisible = 5 
}: NotificationToastProps) {
  const [visibleNotifications, setVisibleNotifications] = useState<ToastNotification[]>([]);

  useEffect(() => {
    // Show only the most recent notifications
    const recent = notifications.slice(-maxVisible);
    setVisibleNotifications(recent);

    // Set up auto-dismiss timers
    const timers: NodeJS.Timeout[] = [];
    
    recent.forEach((notification) => {
      if (!notification.persistent) {
        const duration = notification.duration || 5000;
        const timer = setTimeout(() => {
          onDismiss(notification.id);
        }, duration);
        timers.push(timer);
      }
    });

    // Cleanup timers
    return () => {
      timers.forEach(timer => clearTimeout(timer));
    };
  }, [notifications, maxVisible, onDismiss]);

  const getIcon = (type: ToastNotification['type']) => {
    switch (type) {
      case 'success':
        return CheckCircle;
      case 'warning':
        return AlertTriangle;
      case 'error':
        return XCircle;
      case 'info':
      default:
        return Info;
    }
  };

  const getVariant = (type: ToastNotification['type']) => {
    switch (type) {
      case 'error':
        return 'destructive';
      default:
        return 'default';
    }
  };

  const getColorClasses = (type: ToastNotification['type']) => {
    switch (type) {
      case 'success':
        return 'border-green-200 bg-green-50 text-green-800';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50 text-yellow-800';
      case 'error':
        return 'border-red-200 bg-red-50 text-red-800';
      case 'info':
      default:
        return 'border-blue-200 bg-blue-50 text-blue-800';
    }
  };

  if (visibleNotifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {visibleNotifications.map((notification) => {
        const Icon = getIcon(notification.type);
        
        return (
          <div
            key={notification.id}
            className={`
              relative rounded-lg border p-4 shadow-lg transition-all duration-300 ease-in-out
              ${getColorClasses(notification.type)}
              animate-in slide-in-from-right-full
            `}
          >
            <div className="flex items-start gap-3">
              <Icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
              
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm">
                  {notification.title}
                </div>
                <div className="text-sm mt-1 opacity-90">
                  {notification.message}
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 hover:bg-black/10"
                onClick={() => onDismiss(notification.id)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Progress bar for auto-dismiss */}
            {!notification.persistent && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/10 rounded-b-lg overflow-hidden">
                <div 
                  className="h-full bg-current opacity-30 animate-shrink-width"
                  style={{
                    animationDuration: `${notification.duration || 5000}ms`,
                    animationTimingFunction: 'linear'
                  }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// Hook for managing notifications
export function useNotifications() {
  const [notifications, setNotifications] = useState<ToastNotification[]>([]);

  const addNotification = (notification: Omit<ToastNotification, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newNotification: ToastNotification = {
      ...notification,
      id,
    };

    setNotifications(prev => [...prev, newNotification]);
    return id;
  };

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  // Convenience methods
  const success = (title: string, message: string, options?: Partial<ToastNotification>) => {
    return addNotification({ type: 'success', title, message, ...options });
  };

  const warning = (title: string, message: string, options?: Partial<ToastNotification>) => {
    return addNotification({ type: 'warning', title, message, ...options });
  };

  const error = (title: string, message: string, options?: Partial<ToastNotification>) => {
    return addNotification({ type: 'error', title, message, ...options });
  };

  const info = (title: string, message: string, options?: Partial<ToastNotification>) => {
    return addNotification({ type: 'info', title, message, ...options });
  };

  return {
    notifications,
    addNotification,
    dismissNotification,
    clearAll,
    success,
    warning,
    error,
    info,
  };
}