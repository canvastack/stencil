import { envConfig } from '@/config/env.config';
import { logger } from '@/lib/logger';

export type ProductEventType = 
  | 'product.created'
  | 'product.updated'
  | 'product.deleted'
  | 'product.bulk_updated';

export interface ProductWebSocketEvent {
  type: ProductEventType;
  data: {
    productId?: string;
    productIds?: string[];
    tenantId: string;
    userId?: string;
    userName?: string;
    timestamp: string;
    [key: string]: any;
  };
}

export type ProductEventCallback = (event: ProductWebSocketEvent) => void;

interface WebSocketServiceConfig {
  url: string;
  reconnectInterval: number;
  maxReconnectAttempts: number;
  heartbeatInterval: number;
}

export class ProductWebSocketService {
  private ws: WebSocket | null = null;
  private listeners: Map<ProductEventType, Set<ProductEventCallback>> = new Map();
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private isIntentionallyClosed = false;
  private config: WebSocketServiceConfig;

  constructor(config?: Partial<WebSocketServiceConfig>) {
    this.config = {
      url: envConfig.api.websocketUrl,
      reconnectInterval: 3000,
      maxReconnectAttempts: 10,
      heartbeatInterval: 30000,
      ...config,
    };
  }

  connect(tenantId: string, userId?: string): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      logger.debug('WebSocket already connected');
      return;
    }

    this.isIntentionallyClosed = false;
    
    try {
      const wsUrl = new URL(this.config.url);
      wsUrl.searchParams.set('tenant_id', tenantId);
      if (userId) {
        wsUrl.searchParams.set('user_id', userId);
      }

      this.ws = new WebSocket(wsUrl.toString());

      this.ws.onopen = () => {
        logger.info('WebSocket connected', { tenantId, userId });
        this.reconnectAttempts = 0;
        this.startHeartbeat();
        
        this.send({
          type: 'subscribe',
          channel: `products.${tenantId}`,
        });
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          if (message.type === 'pong') {
            return;
          }

          if (message.type && message.data) {
            this.handleEvent(message as ProductWebSocketEvent);
          }
        } catch (error) {
          logger.error('Failed to parse WebSocket message', { error, data: event.data });
        }
      };

      this.ws.onerror = (error) => {
        logger.error('WebSocket error', { error });
      };

      this.ws.onclose = (event) => {
        logger.info('WebSocket closed', { code: event.code, reason: event.reason });
        this.stopHeartbeat();

        if (!this.isIntentionallyClosed && this.reconnectAttempts < this.config.maxReconnectAttempts) {
          this.scheduleReconnect(tenantId, userId);
        }
      };
    } catch (error) {
      logger.error('Failed to create WebSocket connection', { error });
      this.scheduleReconnect(tenantId, userId);
    }
  }

  disconnect(): void {
    this.isIntentionallyClosed = true;
    this.stopHeartbeat();
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }

    logger.info('WebSocket disconnected');
  }

  on(eventType: ProductEventType, callback: ProductEventCallback): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    
    this.listeners.get(eventType)!.add(callback);

    return () => {
      const callbacks = this.listeners.get(eventType);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.listeners.delete(eventType);
        }
      }
    };
  }

  off(eventType: ProductEventType, callback?: ProductEventCallback): void {
    if (!callback) {
      this.listeners.delete(eventType);
      return;
    }

    const callbacks = this.listeners.get(eventType);
    if (callbacks) {
      callbacks.delete(callback);
      if (callbacks.size === 0) {
        this.listeners.delete(eventType);
      }
    }
  }

  private handleEvent(event: ProductWebSocketEvent): void {
    logger.debug('WebSocket event received', { type: event.type, data: event.data });

    const callbacks = this.listeners.get(event.type);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(event);
        } catch (error) {
          logger.error('Error in WebSocket event callback', { error, eventType: event.type });
        }
      });
    }
  }

  private send(message: any): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    
    this.heartbeatTimer = setInterval(() => {
      this.send({ type: 'ping' });
    }, this.config.heartbeatInterval);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private scheduleReconnect(tenantId: string, userId?: string): void {
    if (this.reconnectTimer) {
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(
      this.config.reconnectInterval * Math.pow(1.5, this.reconnectAttempts - 1),
      30000
    );

    logger.info('Scheduling WebSocket reconnect', { 
      attempt: this.reconnectAttempts, 
      delay,
      maxAttempts: this.config.maxReconnectAttempts 
    });

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect(tenantId, userId);
    }, delay);
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  getConnectionState(): number | null {
    return this.ws?.readyState ?? null;
  }
}

export const productWebSocketService = new ProductWebSocketService();
