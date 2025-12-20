import { useEffect, useRef, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/react-query';
import { 
  productWebSocketService, 
  type ProductEventType, 
  type ProductWebSocketEvent 
} from '@/services/websocket/productWebSocketService';
import { useTenantAuth } from '@/contexts/TenantAuthContext';
import { logger } from '@/lib/logger';
import { toast } from 'sonner';

export interface UseProductWebSocketOptions {
  enabled?: boolean;
  showToasts?: boolean;
  onEvent?: (event: ProductWebSocketEvent) => void;
}

export const useProductWebSocket = (options: UseProductWebSocketOptions = {}) => {
  const { 
    enabled = true, 
    showToasts = true,
    onEvent 
  } = options;

  const { tenant, user } = useTenantAuth();
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<ProductWebSocketEvent | null>(null);
  const unsubscribeRefs = useRef<Array<() => void>>([]);

  const handleProductEvent = useCallback((event: ProductWebSocketEvent) => {
    logger.debug('Product event received', { event });
    setLastEvent(event);

    if (onEvent) {
      onEvent(event);
    }

    queryClient.invalidateQueries({ queryKey: queryKeys.products.lists() });

    if (showToasts) {
      const isCurrentUser = event.data.userId === user?.id;
      if (isCurrentUser) {
        return;
      }

      const userName = event.data.userName || 'Another user';
      
      switch (event.type) {
        case 'product.created':
          toast.info(`${userName} created a new product`, {
            description: 'Product list updated',
            duration: 3000,
          });
          break;
        
        case 'product.updated':
          toast.info(`${userName} updated a product`, {
            description: 'Product list refreshed',
            duration: 3000,
          });
          break;
        
        case 'product.deleted':
          toast.warning(`${userName} deleted a product`, {
            description: 'Product list updated',
            duration: 3000,
          });
          break;
        
        case 'product.bulk_updated':
          toast.info(`${userName} updated multiple products`, {
            description: `${event.data.productIds?.length || 0} products updated`,
            duration: 3000,
          });
          break;
      }
    }
  }, [queryClient, onEvent, showToasts, user?.id]);

  useEffect(() => {
    if (!enabled || !tenant?.uuid) {
      return;
    }

    productWebSocketService.connect(tenant.uuid, user?.id);

    const checkConnection = () => {
      setIsConnected(productWebSocketService.isConnected());
    };

    const connectionTimer = setInterval(checkConnection, 1000);
    checkConnection();

    const eventTypes: ProductEventType[] = [
      'product.created',
      'product.updated',
      'product.deleted',
      'product.bulk_updated',
    ];

    eventTypes.forEach(eventType => {
      const unsubscribe = productWebSocketService.on(eventType, handleProductEvent);
      unsubscribeRefs.current.push(unsubscribe);
    });

    return () => {
      clearInterval(connectionTimer);
      unsubscribeRefs.current.forEach(unsubscribe => unsubscribe());
      unsubscribeRefs.current = [];
      productWebSocketService.disconnect();
    };
  }, [enabled, tenant?.uuid, user?.id, handleProductEvent]);

  const reconnect = useCallback(() => {
    if (tenant?.uuid) {
      productWebSocketService.disconnect();
      productWebSocketService.connect(tenant.uuid, user?.id);
    }
  }, [tenant?.uuid, user?.id]);

  return {
    isConnected,
    lastEvent,
    reconnect,
  };
};
