<?php

namespace App\Http\Controllers\CustomerPortal;

use App\Http\Controllers\Controller;
use App\Models\CustomerReview;
use App\Models\Order;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class CustomerReviewController extends Controller
{
    /**
     * Get customer's reviews
     */
    public function index(Request $request): JsonResponse
    {
        $customer = Auth::guard('sanctum')->user();
        
        if (!$customer) {
            return response()->json([
                'message' => 'Unauthorized'
            ], 401);
        }

        $perPage = (int) $request->input('per_page', 20);
        
        $reviews = CustomerReview::where('customer_id', $customer->id)
            ->where('tenant_id', $customer->tenant_id)
            ->with(['product', 'order'])
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $reviews->items(),
            'meta' => [
                'current_page' => $reviews->currentPage(),
                'last_page' => $reviews->lastPage(),
                'per_page' => $reviews->perPage(),
                'total' => $reviews->total(),
            ]
        ]);
    }

    /**
     * Get products eligible for review
     */
    public function eligibleProducts(): JsonResponse
    {
        $customer = Auth::guard('sanctum')->user();
        
        if (!$customer) {
            return response()->json([
                'message' => 'Unauthorized'
            ], 401);
        }

        // Get completed orders without reviews
        $eligibleProducts = DB::table('orders')
            ->join('products', function($join) {
                $join->on(DB::raw("(orders.items::jsonb->0->>'product_id')::uuid"), '=', 'products.uuid');
            })
            ->leftJoin('customer_reviews', function($join) use ($customer) {
                $join->on('products.id', '=', 'customer_reviews.product_id')
                     ->where('customer_reviews.customer_id', '=', $customer->id);
            })
            ->where('orders.customer_id', $customer->id)
            ->where('orders.tenant_id', $customer->tenant_id)
            ->where('orders.status', 'completed')
            ->whereNull('customer_reviews.id')
            ->select([
                'products.id',
                'products.uuid',
                'products.name',
                'products.slug',
                'orders.id as order_id',
                'orders.uuid as order_uuid',
                'orders.order_number',
                'orders.completed_at'
            ])
            ->distinct()
            ->get();

        return response()->json([
            'success' => true,
            'data' => $eligibleProducts
        ]);
    }

    /**
     * Submit a review
     */
    public function store(Request $request): JsonResponse
    {
        $customer = Auth::guard('sanctum')->user();
        
        if (!$customer) {
            return response()->json([
                'message' => 'Unauthorized'
            ], 401);
        }

        $validated = $request->validate([
            'product_id' => 'required|integer',
            'order_id' => 'nullable|integer',
            'rating' => 'required|integer|min:1|max:5',
            'title' => 'required|string|max:100',
            'content' => 'required|string|min:50|max:1000',
            'images' => 'nullable|array|max:5',
            'images.*' => 'string', // URLs to uploaded photos
        ]);

        // Find product
        $product = Product::where('id', $validated['product_id'])
            ->where('tenant_id', $customer->tenant_id)
            ->firstOrFail();

        $order = null;
        if (isset($validated['order_id'])) {
            $order = Order::where('id', $validated['order_id'])
                ->where('customer_id', $customer->id)
                ->where('tenant_id', $customer->tenant_id)
                ->first();
        }

        // Check if review already exists
        $existingReview = CustomerReview::where('customer_id', $customer->id)
            ->where('product_id', $product->id)
            ->when($order, function($query) use ($order) {
                return $query->where('order_id', $order->id);
            })
            ->first();

        if ($existingReview) {
            return response()->json([
                'message' => 'You have already reviewed this product for this order'
            ], 422);
        }

        // Create review
        $review = CustomerReview::create([
            'tenant_id' => $customer->tenant_id,
            'customer_id' => $customer->id,
            'product_id' => $product->id,
            'order_id' => $order ? $order->id : null,
            'rating' => $validated['rating'],
            'title' => $validated['title'],
            'content' => $validated['content'],
            'images' => $validated['images'] ?? null,
            'is_verified_purchase' => $order ? true : false,
            'is_approved' => false, // Requires moderation
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Review submitted successfully',
            'data' => [
                'uuid' => $review->uuid,
                'status' => 'pending',
                'message' => 'Your review is pending moderation'
            ]
        ], 201);
    }

    /**
     * Update a review
     */
    public function update(Request $request, string $uuid): JsonResponse
    {
        $customer = Auth::guard('sanctum')->user();
        
        if (!$customer) {
            return response()->json([
                'message' => 'Unauthorized'
            ], 401);
        }

        $validated = $request->validate([
            'rating' => 'sometimes|integer|min:1|max:5',
            'title' => 'sometimes|string|max:100',
            'content' => 'sometimes|string|min:50|max:1000',
            'images' => 'nullable|array|max:5',
            'images.*' => 'string',
        ]);

        $review = CustomerReview::where('uuid', $uuid)
            ->where('customer_id', $customer->id)
            ->where('tenant_id', $customer->tenant_id)
            ->firstOrFail();

        // Only allow updates if not yet approved
        if ($review->is_approved) {
            return response()->json([
                'message' => 'Cannot update an approved review'
            ], 422);
        }

        // Update review
        $updateData = [];
        if (isset($validated['rating'])) {
            $updateData['rating'] = $validated['rating'];
        }
        if (isset($validated['title'])) {
            $updateData['title'] = $validated['title'];
        }
        if (isset($validated['content'])) {
            $updateData['content'] = $validated['content'];
        }
        if (isset($validated['images'])) {
            $updateData['images'] = $validated['images'];
        }

        $review->update($updateData);

        return response()->json([
            'success' => true,
            'message' => 'Review updated successfully',
            'data' => $review
        ]);
    }

    /**
     * Delete a review
     */
    public function destroy(string $uuid): JsonResponse
    {
        $customer = Auth::guard('sanctum')->user();
        
        if (!$customer) {
            return response()->json([
                'message' => 'Unauthorized'
            ], 401);
        }

        $review = CustomerReview::where('uuid', $uuid)
            ->where('customer_id', $customer->id)
            ->where('tenant_id', $customer->tenant_id)
            ->firstOrFail();

        $review->delete();

        return response()->json([
            'success' => true,
            'message' => 'Review deleted successfully'
        ]);
    }
}
