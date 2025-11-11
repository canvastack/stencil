import { Review, ReviewFilters, CreateReviewInput, UpdateReviewInput, ReviewStats } from '@/types/review';
import apiClient from './client';
import { reviewService as mockReviews } from '@/services/mock/reviews';

const USE_MOCK = import.meta.env.VITE_USE_MOCK_DATA !== 'false';

export const reviewService = {
  async getReviews(filters?: ReviewFilters): Promise<Review[]> {
    if (USE_MOCK) {
      return mockReviews.getReviews(filters);
    }
    
    try {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, String(value));
          }
        });
      }
      
      const response = await apiClient.get<Review[]>(`/admin/reviews?${params.toString()}`);
      return response as unknown as Review[];
    } catch (error) {
      console.error('API call failed, falling back to mock data:', error);
      return mockReviews.getReviews(filters);
    }
  },

  async getReviewById(id: string): Promise<Review | null> {
    if (USE_MOCK) {
      return mockReviews.getReviewById(id);
    }
    
    try {
      const response = await apiClient.get<Review>(`/admin/reviews/${id}`);
      return response as unknown as Review;
    } catch (error) {
      console.error('API call failed, falling back to mock data:', error);
      return mockReviews.getReviewById(id);
    }
  },

  async getReviewsByProductId(productId: string): Promise<Review[]> {
    if (USE_MOCK) {
      return mockReviews.getReviewsByProductId(productId);
    }
    
    try {
      const response = await apiClient.get<Review[]>(`/admin/reviews/product/${productId}`);
      return response as unknown as Review[];
    } catch (error) {
      console.error('API call failed, falling back to mock data:', error);
      return mockReviews.getReviewsByProductId(productId);
    }
  },

  async createReview(input: CreateReviewInput): Promise<Review> {
    if (USE_MOCK) {
      return mockReviews.createReview(input);
    }
    
    try {
      const response = await apiClient.post<Review>('/admin/reviews', input);
      return response as unknown as Review;
    } catch (error) {
      console.error('API call failed, falling back to mock data:', error);
      return mockReviews.createReview(input);
    }
  },

  async updateReview(id: string, input: UpdateReviewInput): Promise<Review> {
    if (USE_MOCK) {
      return mockReviews.updateReview(id, input);
    }
    
    try {
      const response = await apiClient.put<Review>(`/admin/reviews/${id}`, input);
      return response as unknown as Review;
    } catch (error) {
      console.error('API call failed, falling back to mock data:', error);
      return mockReviews.updateReview(id, input);
    }
  },

  async deleteReview(id: string): Promise<boolean> {
    if (USE_MOCK) {
      return mockReviews.deleteReview(id);
    }
    
    try {
      await apiClient.delete(`/admin/reviews/${id}`);
      return true;
    } catch (error) {
      console.error('API call failed, falling back to mock data:', error);
      return mockReviews.deleteReview(id);
    }
  },

  async getAverageRating(productId: string): Promise<number> {
    if (USE_MOCK) {
      return mockReviews.getAverageRating(productId);
    }
    
    try {
      const response = await apiClient.get<{ averageRating: number }>(`/admin/reviews/product/${productId}/average`);
      return (response as unknown as { averageRating: number }).averageRating;
    } catch (error) {
      console.error('API call failed, falling back to mock data:', error);
      return mockReviews.getAverageRating(productId);
    }
  },

  async getReviewStats(productId: string): Promise<ReviewStats> {
    if (USE_MOCK) {
      return mockReviews.getReviewStats(productId);
    }
    
    try {
      const response = await apiClient.get<ReviewStats>(`/admin/reviews/product/${productId}/stats`);
      return response as unknown as ReviewStats;
    } catch (error) {
      console.error('API call failed, falling back to mock data:', error);
      return mockReviews.getReviewStats(productId);
    }
  },

  resetReviews(): void {
    if (USE_MOCK) {
      mockReviews.resetReviews();
    }
  }
};

export const getReviews = reviewService.getReviews;
export const getReviewById = reviewService.getReviewById;
export const getReviewsByProductId = reviewService.getReviewsByProductId;
export const createReview = reviewService.createReview;
export const updateReview = reviewService.updateReview;
export const deleteReview = reviewService.deleteReview;
export const getAverageRating = reviewService.getAverageRating;
export const getReviewStats = reviewService.getReviewStats;
export const resetReviews = reviewService.resetReviews;
