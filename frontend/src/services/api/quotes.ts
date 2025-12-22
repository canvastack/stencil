import { apiClient } from './client';
import type {
  OrderQuote,
  CreateQuoteRequest,
  UpdateQuoteRequest,
  QuoteResponse,
  QuoteFilters,
  QuoteStatistics,
  QuoteRevision,
  QuoteComment,
  QuoteNegotiation,
  NegotiationStep
} from '@/types/quote';

class QuoteService {
  private baseUrl = '/quotes';

  // Get all quotes with filtering and pagination
  async getQuotes(filters: QuoteFilters = {}): Promise<QuoteResponse> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    try {
      const response = await apiClient.get<QuoteResponse>(`${this.baseUrl}?${params}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching quotes:', error);
      throw error;
    }
  }

  // Get quote by ID
  async getQuote(id: string): Promise<OrderQuote> {
    try {
      const response = await apiClient.get<{ data: OrderQuote }>(`${this.baseUrl}/${id}`);
      return response.data.data;
    } catch (error) {
      console.error(`Error fetching quote ${id}:`, error);
      throw error;
    }
  }

  // Get quotes for a specific order
  async getQuotesByOrder(orderId: string): Promise<OrderQuote[]> {
    try {
      const response = await apiClient.get<{ data: OrderQuote[] }>(`/orders/${orderId}/quotes`);
      return response.data.data;
    } catch (error) {
      console.error(`Error fetching quotes for order ${orderId}:`, error);
      throw error;
    }
  }

  // Get quotes for a specific vendor
  async getQuotesByVendor(vendorId: string, filters: QuoteFilters = {}): Promise<QuoteResponse> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    try {
      const response = await apiClient.get<QuoteResponse>(`/vendors/${vendorId}/quotes?${params}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching quotes for vendor ${vendorId}:`, error);
      throw error;
    }
  }

  // Create new quote
  async createQuote(data: CreateQuoteRequest): Promise<OrderQuote> {
    try {
      const response = await apiClient.post<{ data: OrderQuote }>(`${this.baseUrl}`, data);
      return response.data.data;
    } catch (error) {
      console.error('Error creating quote:', error);
      throw error;
    }
  }

  // Update quote
  async updateQuote(id: string, data: UpdateQuoteRequest): Promise<OrderQuote> {
    try {
      const response = await apiClient.put<{ data: OrderQuote }>(`${this.baseUrl}/${id}`, data);
      return response.data.data;
    } catch (error) {
      console.error(`Error updating quote ${id}:`, error);
      throw error;
    }
  }

  // Accept quote
  async acceptQuote(id: string, notes?: string): Promise<OrderQuote> {
    try {
      const response = await apiClient.post<{ data: OrderQuote }>(`${this.baseUrl}/${id}/accept`, {
        notes
      });
      return response.data.data;
    } catch (error) {
      console.error(`Error accepting quote ${id}:`, error);
      throw error;
    }
  }

  // Reject quote
  async rejectQuote(id: string, reason: string): Promise<OrderQuote> {
    try {
      const response = await apiClient.post<{ data: OrderQuote }>(`${this.baseUrl}/${id}/reject`, {
        reason
      });
      return response.data.data;
    } catch (error) {
      console.error(`Error rejecting quote ${id}:`, error);
      throw error;
    }
  }

  // Create counter quote (for negotiations)
  async createCounterQuote(id: string, price: number, notes?: string): Promise<OrderQuote> {
    try {
      const response = await apiClient.post<{ data: OrderQuote }>(`${this.baseUrl}/${id}/counter`, {
        quoted_price: price,
        notes
      });
      return response.data.data;
    } catch (error) {
      console.error(`Error creating counter quote for ${id}:`, error);
      throw error;
    }
  }

  // Delete quote
  async deleteQuote(id: string): Promise<void> {
    try {
      await apiClient.delete(`${this.baseUrl}/${id}`);
    } catch (error) {
      console.error(`Error deleting quote ${id}:`, error);
      throw error;
    }
  }

  // Get quote statistics
  async getQuoteStatistics(filters: Partial<QuoteFilters> = {}): Promise<QuoteStatistics> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    try {
      const response = await apiClient.get<{ data: QuoteStatistics }>(`${this.baseUrl}/statistics?${params}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching quote statistics:', error);
      throw error;
    }
  }

  // Get quote revision history
  async getQuoteRevisions(id: string): Promise<QuoteRevision[]> {
    try {
      const response = await apiClient.get<{ data: QuoteRevision[] }>(`${this.baseUrl}/${id}/revisions`);
      return response.data.data;
    } catch (error) {
      console.error(`Error fetching revisions for quote ${id}:`, error);
      throw error;
    }
  }

  // Get quote comments
  async getQuoteComments(id: string): Promise<QuoteComment[]> {
    try {
      const response = await apiClient.get<{ data: QuoteComment[] }>(`${this.baseUrl}/${id}/comments`);
      return response.data.data;
    } catch (error) {
      console.error(`Error fetching comments for quote ${id}:`, error);
      throw error;
    }
  }

  // Add comment to quote
  async addQuoteComment(id: string, comment: string, isInternal: boolean = false): Promise<QuoteComment> {
    try {
      const response = await apiClient.post<{ data: QuoteComment }>(`${this.baseUrl}/${id}/comments`, {
        comment,
        is_internal: isInternal
      });
      return response.data.data;
    } catch (error) {
      console.error(`Error adding comment to quote ${id}:`, error);
      throw error;
    }
  }

  // Get negotiation history for a quote
  async getQuoteNegotiation(id: string): Promise<QuoteNegotiation> {
    try {
      const response = await apiClient.get<{ data: QuoteNegotiation }>(`${this.baseUrl}/${id}/negotiation`);
      return response.data.data;
    } catch (error) {
      console.error(`Error fetching negotiation for quote ${id}:`, error);
      throw error;
    }
  }

  // Start negotiation process
  async startNegotiation(id: string, targetPrice?: number): Promise<QuoteNegotiation> {
    try {
      const response = await apiClient.post<{ data: QuoteNegotiation }>(`${this.baseUrl}/${id}/negotiation/start`, {
        target_price: targetPrice
      });
      return response.data.data;
    } catch (error) {
      console.error(`Error starting negotiation for quote ${id}:`, error);
      throw error;
    }
  }

  // Add negotiation step
  async addNegotiationStep(
    quoteId: string,
    stepType: NegotiationStep['step_type'],
    proposedPrice: number,
    message?: string
  ): Promise<NegotiationStep> {
    try {
      const response = await apiClient.post<{ data: NegotiationStep }>(
        `${this.baseUrl}/${quoteId}/negotiation/steps`,
        {
          step_type: stepType,
          proposed_price: proposedPrice,
          message
        }
      );
      return response.data.data;
    } catch (error) {
      console.error(`Error adding negotiation step for quote ${quoteId}:`, error);
      throw error;
    }
  }

  // Send quote to vendor/customer
  async sendQuote(id: string, recipientEmail?: string, customMessage?: string): Promise<void> {
    try {
      await apiClient.post(`${this.baseUrl}/${id}/send`, {
        recipient_email: recipientEmail,
        custom_message: customMessage
      });
    } catch (error) {
      console.error(`Error sending quote ${id}:`, error);
      throw error;
    }
  }

  // Mark quote as viewed
  async markAsViewed(id: string): Promise<void> {
    try {
      await apiClient.post(`${this.baseUrl}/${id}/viewed`);
    } catch (error) {
      console.error(`Error marking quote ${id} as viewed:`, error);
      throw error;
    }
  }

  // Export quotes to CSV
  async exportQuotes(filters: QuoteFilters = {}): Promise<Blob> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    try {
      const response = await apiClient.get(`${this.baseUrl}/export?${params}`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Error exporting quotes:', error);
      throw error;
    }
  }

  // Generate quote PDF
  async generateQuotePDF(id: string): Promise<Blob> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/${id}/pdf`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error(`Error generating PDF for quote ${id}:`, error);
      throw error;
    }
  }
}

// Export singleton instance
export const quotesService = new QuoteService();
export default quotesService;