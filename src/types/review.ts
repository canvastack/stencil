export interface Review {
  id: string;
  productId: string;
  userName: string;
  userImage?: string;
  rating: number;
  date: string;
  comment: string;
  verified: boolean;
}

export interface ReviewFilters {
  productId?: string;
  rating?: number;
  verified?: boolean;
  limit?: number;
  offset?: number;
}

export interface CreateReviewInput {
  productId: string;
  userName: string;
  userImage?: string;
  rating: number;
  comment: string;
  verified?: boolean;
}

export interface UpdateReviewInput {
  userName?: string;
  userImage?: string;
  rating?: number;
  comment?: string;
  verified?: boolean;
}

export interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}
