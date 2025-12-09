<?php

namespace App\Http\Controllers\Api\V1\Public;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ReviewController extends Controller
{
    /**
     * Get public reviews
     */
    public function index(Request $request): JsonResponse
    {
        try {
            // For now, return mock data since we don't have a Review model yet
            // This can be extended when the Review model is implemented
            
            $mockReviews = [
                [
                    'id' => 1,
                    'product_id' => 1,
                    'customer_name' => 'John Doe',
                    'rating' => 5,
                    'comment' => 'Excellent quality etching work. Very satisfied with the result.',
                    'created_at' => now()->subDays(2),
                ],
                [
                    'id' => 2,
                    'product_id' => 1,
                    'customer_name' => 'Jane Smith',
                    'rating' => 4,
                    'comment' => 'Good quality, fast delivery. Would recommend.',
                    'created_at' => now()->subDays(5),
                ],
                [
                    'id' => 3,
                    'product_id' => 2,
                    'customer_name' => 'Mike Johnson',
                    'rating' => 5,
                    'comment' => 'Perfect glass etching! Exactly what we needed for our office.',
                    'created_at' => now()->subWeek(),
                ]
            ];

            // Apply filters
            $productId = $request->get('product_id');
            if ($productId) {
                $mockReviews = array_filter($mockReviews, function ($review) use ($productId) {
                    return $review['product_id'] == $productId;
                });
            }

            $limit = $request->get('limit', 20);
            $mockReviews = array_slice($mockReviews, 0, $limit);

            return response()->json([
                'data' => array_values($mockReviews),
                'meta' => [
                    'count' => count($mockReviews),
                    'limit' => $limit
                ]
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch reviews',
                'error' => config('app.debug') ? $e->getMessage() : 'An unexpected error occurred'
            ], 500);
        }
    }

    /**
     * Get reviews for a specific product
     */
    public function byProduct(Request $request, int $productId): JsonResponse
    {
        try {
            // Mock data for product-specific reviews
            $mockReviews = [
                [
                    'id' => 1,
                    'product_id' => $productId,
                    'customer_name' => 'John Doe',
                    'rating' => 5,
                    'comment' => 'Excellent quality etching work. Very satisfied with the result.',
                    'created_at' => now()->subDays(2),
                ],
                [
                    'id' => 2,
                    'product_id' => $productId,
                    'customer_name' => 'Jane Smith',
                    'rating' => 4,
                    'comment' => 'Good quality, fast delivery. Would recommend.',
                    'created_at' => now()->subDays(5),
                ]
            ];

            $limit = $request->get('limit', 10);
            $mockReviews = array_slice($mockReviews, 0, $limit);

            return response()->json([
                'data' => array_values($mockReviews),
                'meta' => [
                    'product_id' => $productId,
                    'count' => count($mockReviews),
                    'average_rating' => 4.5,
                    'total_reviews' => 25
                ]
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch product reviews',
                'error' => config('app.debug') ? $e->getMessage() : 'An unexpected error occurred'
            ], 500);
        }
    }
}