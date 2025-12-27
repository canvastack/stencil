import { useState, useEffect, useCallback } from 'react';
import { Review, ReviewFilters, CreateReviewInput, UpdateReviewInput, ReviewStats } from '@/types/review';
import { reviewService } from '@/services/api/reviews';

export const useReviews = (filters?: ReviewFilters, userType?: 'anonymous' | 'tenant' | 'platform') => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadReviews = useCallback(async () => {
    try {
      setLoading(true);
      const data = await reviewService.getReviews(filters, userType);
      setReviews(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load reviews'));
    } finally {
      setLoading(false);
    }
  }, [filters?.productId, filters?.rating, filters?.verified, filters?.limit, filters?.offset, userType]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  return { reviews, loading, error, refresh: loadReviews };
};

export const useReview = (id: string) => {
  const [review, setReview] = useState<Review | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const loadReview = async () => {
      try {
        setLoading(true);
        const data = await reviewService.getReviewById(id);
        setReview(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to load review'));
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadReview();
    }
  }, [id]);

  return { review, loading, error };
};

export const useProductReviews = (productId: string, tenantSlug?: string) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadProductReviews = useCallback(async () => {
    try {
      setLoading(true);
      const data = await reviewService.getReviewsByProductId(productId, tenantSlug);
      setReviews(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load product reviews'));
    } finally {
      setLoading(false);
    }
  }, [productId, tenantSlug]);

  useEffect(() => {
    if (productId) {
      loadProductReviews();
    }
  }, [loadProductReviews, productId]);

  return { reviews, loading, error, refresh: loadProductReviews };
};

export const useReviewStats = (productId: string) => {
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const loadReviewStats = async () => {
      try {
        setLoading(true);
        const data = await reviewService.getReviewStats(productId);
        setStats(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to load review stats'));
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      loadReviewStats();
    }
  }, [productId]);

  return { stats, loading, error };
};

export const useCreateReview = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const createReview = async (input: CreateReviewInput): Promise<Review | null> => {
    try {
      setLoading(true);
      setError(null);
      const review = await reviewService.createReview(input);
      return review;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to create review'));
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { createReview, loading, error };
};

export const useUpdateReview = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const updateReview = async (id: string, input: UpdateReviewInput): Promise<Review | null> => {
    try {
      setLoading(true);
      setError(null);
      const review = await reviewService.updateReview(id, input);
      return review;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update review'));
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { updateReview, loading, error };
};

export const useDeleteReview = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const deleteReview = async (id: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      const success = await reviewService.deleteReview(id);
      return success;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to delete review'));
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { deleteReview, loading, error };
};
