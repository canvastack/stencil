/**
 * Message Service - Tenant/Admin
 * 
 * Service for managing quote messages from tenant/admin perspective.
 * Handles fetching, sending, and marking messages as read.
 */

import apiClient from '../api/client';

export interface MessageSender {
  uuid: string;
  name: string;
  email: string;
  role: string | null;
}

export interface MessageAttachment {
  name: string;
  path: string;
  size: number;
  mime_type: string;
  url?: string;
}

export interface QuoteMessage {
  uuid: string;
  quote_id: number;
  sender_id: number;
  sender_type?: 'admin' | 'vendor'; // ← NEW
  sender: MessageSender | null;
  message: string;
  attachments: MessageAttachment[];
  read_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface GetMessagesResponse {
  success: boolean;
  data: QuoteMessage[];
  meta: {
    total: number;
    unread_count: number;
  };
}

export interface SendMessageRequest {
  message: string;
  attachments?: File[];
}

export interface SendMessageResponse {
  success: boolean;
  data: QuoteMessage;
  message: string;
}

export interface MarkAsReadResponse {
  success: boolean;
  message: string;
}

export interface MarkAllAsReadResponse {
  success: boolean;
  message: string;
  data: {
    count: number;
  };
}

class MessageService {
  /**
   * Get messages for a quote
   */
  async getMessages(quoteUuid: string): Promise<GetMessagesResponse> {
    const response = await apiClient.get<GetMessagesResponse>(
      `/tenant/quotes/${quoteUuid}/messages`
    );
    return response as GetMessagesResponse;
  }

  /**
   * Send a message in a quote thread
   */
  async sendMessage(
    quoteUuid: string,
    data: SendMessageRequest
  ): Promise<SendMessageResponse> {
    // If attachments are present, use FormData
    if (data.attachments && data.attachments.length > 0) {
      const formData = new FormData();
      formData.append('message', data.message);
      
      data.attachments.forEach((file, index) => {
        formData.append(`attachments[${index}]`, file);
      });

      const response = await apiClient.post<SendMessageResponse>(
        `/tenant/quotes/${quoteUuid}/messages`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response as SendMessageResponse;
    } else {
      // No attachments, send as JSON
      const response = await apiClient.post<SendMessageResponse>(
        `/tenant/quotes/${quoteUuid}/messages`,
        { message: data.message }
      );
      return response as SendMessageResponse;
    }
  }

  /**
   * Mark a message as read
   */
  async markAsRead(
    quoteUuid: string,
    messageUuid: string
  ): Promise<MarkAsReadResponse> {
    const response = await apiClient.post<MarkAsReadResponse>(
      `/tenant/quotes/${quoteUuid}/messages/${messageUuid}/read`
    );
    return response as MarkAsReadResponse;
  }

  /**
   * Mark all messages in a quote as read
   */
  async markAllAsRead(quoteUuid: string): Promise<MarkAllAsReadResponse> {
    const response = await apiClient.post<MarkAllAsReadResponse>(
      `/tenant/quotes/${quoteUuid}/messages/read-all`
    );
    return response as MarkAllAsReadResponse;
  }
}

export const messageService = new MessageService();
