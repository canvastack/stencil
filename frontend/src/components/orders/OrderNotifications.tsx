import React, { useState, useEffect } from 'react';
import { Bell, Clock, User, MessageSquare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { notificationService, type Notification } from '@/services/notificationService';
import { useOrderRealTimeNotifications } from '@/hooks/useRealTimeNotifications';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import { toast } from 'sonner';

interface OrderNotificationsProps {
  orderUuid: string;
  className?: string;
}

export function OrderNotifications({ orderUuid, className }: OrderNotificationsProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Set up real-time notifications for this order
  useOrderRealTimeNotifications(orderUuid, {
    onNotificationReceived: (notification) => {
      setNotifications(prev => [notification, ...prev]);
      toast.success('Status pesanan diperbarui', {
        description: notification.data.message,
      });
    },
    enableToasts: false, // We'll handle toasts manually here
  });

  // Load order notifications
  useEffect(() => {
    const loadNotifications = async () => {
      try {
        setIsLoading(true);
        const response = await notificationService.getOrderNotifications(orderUuid);
        
        // Add defensive check for response structure
        if (response && response.notifications) {
          setNotifications(response.notifications);
        } else {
          console.warn('Invalid response structure:', response);
          setNotifications([]);
        }
      } catch (error) {
        console.error('Failed to load order notifications:', error);
        setNotifications([]);
        toast.error('Gagal memuat riwayat notifikasi', {
          description: 'Silakan coba lagi nanti',
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (orderUuid) {
      loadNotifications();
    }
  }, [orderUuid]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'shipped':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
      case 'refunded':
        return 'bg-red-100 text-red-800';
      case 'in_production':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'pending': 'Menunggu Konfirmasi',
      'confirmed': 'Dikonfirmasi',
      'in_production': 'Dalam Produksi',
      'quality_check': 'Pemeriksaan Kualitas',
      'ready_for_pickup': 'Siap Diambil',
      'shipped': 'Dikirim',
      'delivered': 'Diterima',
      'completed': 'Selesai',
      'cancelled': 'Dibatalkan',
      'refunded': 'Dikembalikan'
    };
    
    return labels[status] || status;
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Riwayat Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-4">
            Memuat riwayat status...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Riwayat Status
          {notifications.length > 0 && (
            <Badge variant="secondary" className="ml-auto">
              {notifications.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-0">
        {notifications.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground">
            <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Belum ada riwayat perubahan status</p>
          </div>
        ) : (
          <ScrollArea className="h-96">
            <div className="p-6 space-y-4">
              {notifications.map((notification, index) => (
                <div key={notification.id}>
                  <div className="flex items-start gap-4">
                    {/* Timeline indicator */}
                    <div className="relative">
                      <div className={`w-3 h-3 rounded-full ${
                        notification.data.is_critical 
                          ? 'bg-red-500' 
                          : index === 0 
                            ? 'bg-blue-500' 
                            : 'bg-gray-300'
                      }`} />
                      {index < notifications.length - 1 && (
                        <div className="absolute top-3 left-1.5 w-0.5 h-8 bg-gray-200" />
                      )}
                    </div>
                    
                    {/* Notification content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        {notification.data.new_status && (
                          <Badge 
                            variant="secondary" 
                            className={getStatusColor(notification.data.new_status)}
                          >
                            {getStatusLabel(notification.data.new_status)}
                          </Badge>
                        )}
                        
                        {notification.data.is_critical && (
                          <Badge variant="destructive" className="text-xs">
                            Penting
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-sm text-gray-900 mb-2">
                        {notification.data.message}
                      </p>
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(notification.created_at), {
                            addSuffix: true,
                            locale: id
                          })}
                        </div>
                        
                        {notification.data.changed_by && (
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            Oleh: {notification.data.changed_by}
                          </div>
                        )}
                      </div>
                      
                      {notification.data.reason && (
                        <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                          <div className="flex items-center gap-1 mb-1">
                            <MessageSquare className="h-3 w-3" />
                            <span className="font-medium">Catatan:</span>
                          </div>
                          <p className="text-gray-600">{notification.data.reason}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {index < notifications.length - 1 && (
                    <Separator className="my-4" />
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}