export interface Notification {
  id: string;
  uuid: string;
  userId: string;
  type: 'comment' | 'approval_request' | 'approval_response' | 'product_update' | 'mention' | 'system';
  title: string;
  message: string;
  data?: Record<string, any>;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
  actionUrl?: string;
  actionLabel?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  icon?: string;
  category: 'products' | 'approvals' | 'comments' | 'system' | 'general';
}

export interface NotificationPreference {
  id: string;
  uuid: string;
  userId: string;
  type: string;
  channel: 'email' | 'push' | 'in_app';
  isEnabled: boolean;
  frequency?: 'instant' | 'daily' | 'weekly';
  createdAt: string;
  updatedAt?: string;
}

export interface NotificationListResponse {
  notifications: Notification[];
  unreadCount: number;
  total: number;
  page: number;
  perPage: number;
}

export interface NotificationPreferencesResponse {
  preferences: NotificationPreference[];
  categories: string[];
}

export interface NotificationStatsResponse {
  totalNotifications: number;
  unreadNotifications: number;
  byCategory: Record<string, number>;
  recentNotifications: Notification[];
}

export interface UpdatePreferenceRequest {
  type: string;
  channel: 'email' | 'push' | 'in_app';
  isEnabled: boolean;
  frequency?: 'instant' | 'daily' | 'weekly';
}

export interface NotificationFilterOptions {
  type?: string[];
  category?: string[];
  isRead?: boolean;
  priority?: string[];
  dateFrom?: string;
  dateTo?: string;
}
