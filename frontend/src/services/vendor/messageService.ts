/**
 * Vendor Message Service
 * 
 * Service for managing quote messages from vendor perspective.
 * Handles fetching and sending messages in quote threads.
 */

import { vendorApiClient } from '../api/vendorClient';

export interface VendorMessageSender {
  sender_name: string;
  sender_email: string;
  sender_type: 'admin' | 'vendor';
}

export interface VendorMessageAttachment {
  filename: string;
  path: string;
  url: string;
  size: number;
  mime_type: string;
}

export interface VendorQuoteMessage {
  id: number;
  uuid: string;
  quote_id: number;
  sender_id: number;
  sender_type: 'admin' | 'vendor';
  sender_name: string;
  sender_email: string;
  message: string;
  attachments: VendorMessageAttachment[];
  is_read: boolean;
  read_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface GetVendorMessagesResponse {
  message: string;
  data: VendorQuoteMessage[];
  pagination: {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
    from: number;
    to: number;
  };
}

export interface SendVendorMessageRequest {
  message: string;
  attachments?: File[];
}

export interface SendVendorMessageResponse {
  message: string;
  data: VendorQuoteMessage;
}

class VendorMessageService {
  /**
   * Get messages for a quote
   */
  async getMessages(
    quoteUuid: string,
    page: number = 1,
    perPage: number = 20
  ): Promise<GetVendorMessagesResponse> {
    const response = await vendorApiClient.get<GetVendorMessagesResponse>(
      `/quotes/${quoteUuid}/messages`,
      {
        params: { page, per_page: perPage },
      }
    );
    return response as GetVendorMessagesResponse;
  }

  /**
   * Send a message in a quote thread
   */
  async sendMessage(
    quoteUuid: string,
    data: SendVendorMessageRequest
  ): Promise<SendVendorMessageResponse> {
    // If attachments are present, use FormData
    if (data.attachments && data.attachments.length > 0) {
      const formData = new FormData();
      formData.append('message', data.message);
      
      data.attachments.forEach((file, index) => {
        formData.append(`attachments[${index}]`, file);
      });

      const response = await vendorApiClient.post<SendVendorMessageResponse>(
        `/quotes/${quoteUuid}/messages`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response as SendVendorMessageResponse;
    } else {
      // No attachments, send as JSON
      const response = await vendorApiClient.post<SendVendorMessageResponse>(
        `/quotes/${quoteUuid}/messages`,
        { message: data.message }
      );
      return response as SendVendorMessageResponse;
    }
  }
}

export const vendorMessageService = new VendorMessageService();
