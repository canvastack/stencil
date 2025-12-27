<?php

namespace App\Http\Controllers\Api\V1\Public;

use App\Http\Controllers\Controller;
use App\Domain\Review\Repositories\ReviewRepositoryInterface;
use App\Domain\Shared\ValueObjects\UuidValueObject;
use App\Infrastructure\Persistence\Eloquent\Models\Tenant as TenantModel;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ReviewController extends Controller
{
    public function __construct(
        private ReviewRepositoryInterface $reviewRepository
    ) {}

    /**
     * Get public reviews
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $tenantId = $request->get('tenant_id');
            $productId = $request->get('product_id');
            $limit = $request->get('limit', 20);

            if ($productId) {
                $reviews = $this->reviewRepository->findByProductId(new UuidValueObject($productId));
            } elseif ($tenantId) {
                $reviews = $this->reviewRepository->findApproved(new UuidValueObject($tenantId));
            } else {
                return response()->json([
                    'message' => 'tenant_id or product_id is required',
                ], 400);
            }

            $reviews = array_slice($reviews, 0, $limit);
            $reviewsData = array_map(fn($review) => $review->toArray(), $reviews);

            return response()->json([
                'data' => $reviewsData,
                'meta' => [
                    'count' => count($reviewsData),
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
            $limit = $request->get('limit', 10);
            
            $reviews = $this->reviewRepository->findByProductId(new UuidValueObject($productId));
            $reviews = array_slice($reviews, 0, $limit);
            $reviewsData = array_map(fn($review) => $review->toArray(), $reviews);

            $averageRating = $this->reviewRepository->getAverageRating(new UuidValueObject($productId));
            $totalReviews = $this->reviewRepository->countByProductId(new UuidValueObject($productId));

            return response()->json([
                'data' => $reviewsData,
                'meta' => [
                    'product_id' => $productId,
                    'count' => count($reviewsData),
                    'average_rating' => $averageRating,
                    'total_reviews' => $totalReviews
                ]
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch product reviews',
                'error' => config('app.debug') ? $e->getMessage() : 'An unexpected error occurred'
            ], 500);
        }
    }

    /**
     * Get reviews for a specific product by UUID (tenant-specific)
     */
    public function byProductUuid(Request $request, string $tenantSlug, string $productUuid): JsonResponse
    {
        try {
            $tenant = TenantModel::where('slug', $tenantSlug)->first();
            
            if (!$tenant) {
                return response()->json([
                    'message' => 'Tenant not found',
                ], 404);
            }

            $limit = $request->get('limit', 10);
            
            $reviews = $this->reviewRepository->findByTenantAndProductUuid(
                new UuidValueObject($tenant->uuid),
                $productUuid
            );
            
            $reviews = array_slice($reviews, 0, $limit);
            $reviewsData = array_map(fn($review) => $review->toArray(), $reviews);

            $totalReviews = count($reviews);
            $averageRating = $totalReviews > 0 
                ? array_sum(array_column($reviewsData, 'rating')) / $totalReviews 
                : 0.0;

            return response()->json([
                'data' => $reviewsData,
                'meta' => [
                    'tenant_slug' => $tenantSlug,
                    'product_uuid' => $productUuid,
                    'count' => count($reviewsData),
                    'average_rating' => round($averageRating, 1),
                    'total_reviews' => $totalReviews
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