import { api } from './customerPortalApi';

export interface ReviewSubmission {
  product_id: number;
  order_id?: number;
  rating: number;
  title: string;
  content: string;
  images?: string[];
}

export interface ReviewUpdate {
  rating?: number;
  title?: string;
  content?: string;
  images?: string[];
}

export const customerReviewApi = {
  /**
   * Get customer's reviews
   */
  async getMyReviews() {
    const response = await api.get('/public/customers/reviews');
    return response.data;
  },

  /**
   * Get products eligible for review
   */
  async getEligibleProducts() {
    const response = await api.get('/public/customers/reviews/eligible-products');
    return response.data;
  },

  /**
   * Submit a new review
   */
  async submitReview(data: ReviewSubmission) {
    const response = await api.post('/public/customers/reviews', data);
    return response.data;
  },

  /**
   * Update an existing review
   */
  async updateReview(uuid: string, data: ReviewUpdate) {
    const response = await api.put(`/public/customers/reviews/${uuid}`, data);
    return response.data;
  },

  /**
   * Delete a review
   */
  async deleteReview(uuid: string) {
    const response = await api.delete(`/public/customers/reviews/${uuid}`);
    return response.data;
  },

  /**
   * Get public reviews for a product
   */
  async getProductReviews(productUuid: string, limit: number = 10) {
    const response = await api.get(`/public/products/${productUuid}/reviews`, {
      params: { limit },
    });
    return response.data;
  },

  /**
   * Mark review as helpful
   */
  async markHelpful(reviewUuid: string) {
    const response = await api.post(`/public/reviews/${reviewUuid}/helpful`);
    return response.data;
  },
};
