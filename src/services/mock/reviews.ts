import { Review, ReviewFilters, CreateReviewInput, UpdateReviewInput, ReviewStats } from '@/types/review';
import reviewsData from './data/reviews.json';

let reviews: Review[] = [...reviewsData];

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const reviewService = {
  async getReviews(filters?: ReviewFilters): Promise<Review[]> {
    await delay(300);

    let filteredReviews = [...reviews];

    if (filters?.productId) {
      filteredReviews = filteredReviews.filter(r => r.productId === filters.productId);
    }

    if (filters?.rating !== undefined) {
      filteredReviews = filteredReviews.filter(r => r.rating === filters.rating);
    }

    if (filters?.verified !== undefined) {
      filteredReviews = filteredReviews.filter(r => r.verified === filters.verified);
    }

    filteredReviews.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    if (filters?.offset !== undefined && filters?.limit !== undefined) {
      filteredReviews = filteredReviews.slice(filters.offset, filters.offset + filters.limit);
    } else if (filters?.limit !== undefined) {
      filteredReviews = filteredReviews.slice(0, filters.limit);
    }

    return filteredReviews;
  },

  async getReviewById(id: string): Promise<Review | null> {
    await delay(200);
    return reviews.find(r => r.id === id) || null;
  },

  async getReviewsByProductId(productId: string): Promise<Review[]> {
    await delay(300);
    return reviews
      .filter(r => r.productId === productId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  async createReview(input: CreateReviewInput): Promise<Review> {
    await delay(500);

    const newReview: Review = {
      id: String(Date.now()),
      productId: input.productId,
      userName: input.userName,
      userImage: input.userImage,
      rating: input.rating,
      date: new Date().toISOString().split('T')[0],
      comment: input.comment,
      verified: input.verified || false,
    };

    reviews.push(newReview);
    return newReview;
  },

  async updateReview(id: string, input: UpdateReviewInput): Promise<Review> {
    await delay(500);

    const index = reviews.findIndex(r => r.id === id);
    if (index === -1) {
      throw new Error(`Review with id ${id} not found`);
    }

    reviews[index] = {
      ...reviews[index],
      ...input,
    };

    return reviews[index];
  },

  async deleteReview(id: string): Promise<boolean> {
    await delay(500);

    const index = reviews.findIndex(r => r.id === id);
    if (index === -1) {
      return false;
    }

    reviews.splice(index, 1);
    return true;
  },

  async getAverageRating(productId: string): Promise<number> {
    await delay(200);

    const productReviews = reviews.filter(r => r.productId === productId);
    if (productReviews.length === 0) {
      return 0;
    }

    const sum = productReviews.reduce((acc, review) => acc + review.rating, 0);
    return parseFloat((sum / productReviews.length).toFixed(1));
  },

  async getReviewStats(productId: string): Promise<ReviewStats> {
    await delay(300);

    const productReviews = reviews.filter(r => r.productId === productId);
    
    const ratingDistribution = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };

    productReviews.forEach(review => {
      if (review.rating >= 1 && review.rating <= 5) {
        ratingDistribution[review.rating as keyof typeof ratingDistribution]++;
      }
    });

    const averageRating = productReviews.length > 0
      ? parseFloat((productReviews.reduce((acc, r) => acc + r.rating, 0) / productReviews.length).toFixed(1))
      : 0;

    return {
      averageRating,
      totalReviews: productReviews.length,
      ratingDistribution,
    };
  },
};
