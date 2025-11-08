import { useState, useEffect } from 'react';

interface Review {
  id: string;
  productId: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
  verified: boolean;
}

export const useProductReviews = (productId: string) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoading(true);
        // TODO: Replace with actual API call
        // Mock data for now
        const mockReviews = [
          {
            id: '1',
            productId: productId,
            userName: 'John Smith',
            rating: 5,
            comment: 'Kualitas produk sangat bagus, sesuai ekspektasi!',
            date: '2024-02-01',
            verified: true,
          },
          {
            id: '2',
            productId: productId,
            userName: 'Bob Wilson',
            rating: 4,
            comment: 'Good quality but delivery took longer than expected.',
            date: '2024-01-14',
            verified: true,
          }
        ];

        setReviews(mockReviews);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch reviews'));
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      fetchReviews();
    }
  }, [productId]);

  return { reviews, loading, error };
};