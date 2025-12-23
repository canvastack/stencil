import { envConfig } from '@/config/env.config';
import { logger } from '@/lib/logger';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

(window as any).Pusher = Pusher;

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
  private echo: Echo | null = null;
  private channel: any = null;
  private listeners: Map<ProductEventType, Set<ProductEventCallback>> = new Map();
  private isIntentionallyClosed = false;
  private config: WebSocketServiceConfig;
  private currentTenantId: string | null = null;

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
    if (!envConfig.features.enableWebSocket) {
      logger.debug('WebSocket disabled by feature flag', { tenantId });
      return;
    }

    if (this.echo && this.currentTenantId === tenantId) {
      logger.debug('WebSocket already connected to tenant', { tenantId });
      return;
    }

    this.isIntentionallyClosed = false;
    this.currentTenantId = tenantId;
    
    try {
      // Parse WebSocket URL to get host and port
      const wsUrl = new URL(this.config.url);
      const host = wsUrl.hostname;
      const port = parseInt(wsUrl.port || '8081');

      // Initialize Laravel Echo with Reverb (Pusher protocol)
      this.echo = new Echo({
        broadcaster: 'reverb',
        key: import.meta.env.VITE_REVERB_APP_KEY || 'pambesuv4iy0f2mma1rf',
        wsHost: host,
        wsPort: port,
        wssPort: port,
        forceTLS: false,
        enabledTransports: ['ws', 'wss'],
        disableStats: true,
      });

      // Subscribe to tenant-specific product channel
      const channelName = `products.${tenantId}`;
      this.channel = this.echo.channel(channelName);

      logger.info('WebSocket connected via Echo', { tenantId, userId, channelName });

      // Listen to all product events
      const eventTypes: ProductEventType[] = [
        'product.created',
        'product.updated',
        'product.deleted',
        'product.bulk_updated',
      ];

      eventTypes.forEach(eventType => {
        this.channel.listen(`.${eventType}`, (data: any) => {
          const event: ProductWebSocketEvent = {
            type: eventType,
            data: {
              ...data,
              tenantId,
              timestamp: data.timestamp || new Date().toISOString(),
            },
          };
          this.handleEvent(event);
        });
      });

      // Handle connection state changes
      if (this.echo.connector?.pusher) {
        this.echo.connector.pusher.connection.bind('connected', () => {
          logger.info('Pusher connected');
        });

        this.echo.connector.pusher.connection.bind('disconnected', () => {
          logger.debug('Pusher disconnected');
        });

        this.echo.connector.pusher.connection.bind('unavailable', () => {
          logger.debug('Pusher unavailable - WebSocket server not running');
          this.disconnect();
        });

        this.echo.connector.pusher.connection.bind('failed', () => {
          logger.debug('Pusher connection failed - WebSocket server not reachable');
          this.disconnect();
        });

        this.echo.connector.pusher.connection.bind('error', (error: any) => {
          logger.debug('Pusher error', { error: error?.message || 'Connection error' });
        });
      }

    } catch (error) {
      logger.debug('Failed to create WebSocket connection', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        hint: 'WebSocket server may not be running. Application will continue without real-time updates.'
      });
    }
  }

  disconnect(): void {
    this.isIntentionallyClosed = true;

    if (this.channel) {
      this.echo?.leaveChannel(this.channel.name);
      this.channel = null;
    }

    if (this.echo) {
      this.echo.disconnect();
      this.echo = null;
    }

    this.currentTenantId = null;
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

  isConnected(): boolean {
    return this.echo?.connector?.pusher?.connection?.state === 'connected';
  }

  getConnectionState(): string | null {
    return this.echo?.connector?.pusher?.connection?.state ?? null;
  }
}

export const productWebSocketService = new ProductWebSocketService();
