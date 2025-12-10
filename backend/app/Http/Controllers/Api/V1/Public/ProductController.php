<?php

namespace App\Http\Controllers\Api\V1\Public;

use App\Http\Controllers\Controller;
use App\Infrastructure\Persistence\Eloquent\Models\Product;
use App\Infrastructure\Persistence\Eloquent\Models\Tenant;
use App\Infrastructure\Presentation\Http\Resources\Product\ProductResource;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ProductController extends Controller
{
    /**
     * Get public products (global or tenant-specific)
     */
    public function index(Request $request, ?string $tenantSlug = null): JsonResponse
    {
        try {
            $perPage = $request->get('per_page', 20);
            $query = Product::with('category')->published();
            
            // If tenant slug is provided, filter by tenant
            if ($tenantSlug) {
                $tenant = Tenant::where('slug', $tenantSlug)->first();
                if (!$tenant) {
                    return response()->json(['error' => 'Tenant not found'], 404);
                }
                $query->where('tenant_id', $tenant->id);
            }

            // Apply filters
            if ($request->filled('search')) {
                $query->where(function ($q) use ($request) {
                    $q->where('name', 'ILIKE', '%' . $request->search . '%')
                      ->orWhere('description', 'ILIKE', '%' . $request->search . '%')
                      ->orWhere('sku', 'ILIKE', '%' . $request->search . '%');
                });
            }

            if ($request->filled('category')) {
                $query->whereHas('category', function ($q) use ($request) {
                    $q->where('slug', $request->category);
                });
            }

            if ($request->filled('subcategory')) {
                $query->where('subcategory', $request->subcategory);
            }

            if ($request->filled('featured')) {
                $query->where('featured', $request->boolean('featured'));
            }

            if ($request->filled('in_stock')) {
                if ($request->boolean('in_stock')) {
                    $query->where('stock_quantity', '>', 0);
                }
            }

            if ($request->filled('price_min')) {
                $query->where('price', '>=', $request->price_min * 100); // Convert to cents
            }

            if ($request->filled('price_max')) {
                $query->where('price', '<=', $request->price_max * 100); // Convert to cents
            }

            if ($request->filled('material')) {
                $query->where('material', $request->material);
            }

            if ($request->filled('customizable')) {
                $query->where('customizable', $request->boolean('customizable'));
            }

            // Sorting
            $sortBy = $request->get('sort', 'created_at');
            $sortOrder = $request->get('order', 'desc');

            // Map frontend sort options to database columns
            $sortMapping = [
                'name-asc' => ['name', 'asc'],
                'name-desc' => ['name', 'desc'], 
                'price-asc' => ['price', 'asc'],
                'price-desc' => ['price', 'desc'],
                'created-asc' => ['created_at', 'asc'],
                'created-desc' => ['created_at', 'desc'],
                'featured' => ['featured', 'desc'],
                'popular' => ['view_count', 'desc'],
                'rating' => ['average_rating', 'desc'],
            ];

            if (isset($sortMapping[$sortBy])) {
                [$column, $direction] = $sortMapping[$sortBy];
                $query->orderBy($column, $direction);
            } else {
                // Legacy support for individual sort/order params
                $query->orderBy($sortBy, $sortOrder);
            }

            $products = $query->paginate($perPage);

            return ProductResource::collection($products)
                ->response()
                ->setStatusCode(200);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch products',
                'error' => config('app.debug') ? $e->getMessage() : 'An unexpected error occurred'
            ], 500);
        }
    }

    /**
     * Get featured products
     */
    public function featured(Request $request, ?string $tenantSlug = null): JsonResponse
    {
        try {
            $limit = $request->get('limit', 10);
            $query = Product::with('category')->published()->featured();
            
            // If tenant slug is provided, filter by tenant
            if ($tenantSlug) {
                $tenant = Tenant::where('slug', $tenantSlug)->first();
                if (!$tenant) {
                    return response()->json(['error' => 'Tenant not found'], 404);
                }
                $query->where('tenant_id', $tenant->id);
            }

            $products = $query->orderBy('view_count', 'desc')
                            ->limit($limit)
                            ->get();

            return response()->json([
                'data' => ProductResource::collection($products)
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch featured products',
                'error' => config('app.debug') ? $e->getMessage() : 'An unexpected error occurred'
            ], 500);
        }
    }

    /**
     * Get products by category
     */
    public function byCategory(Request $request, string $category, ?string $tenantSlug = null): JsonResponse
    {
        try {
            $limit = $request->get('limit', 20);
            $query = Product::with('category')->published();
            
            // If tenant slug is provided, filter by tenant
            if ($tenantSlug) {
                $tenant = Tenant::where('slug', $tenantSlug)->first();
                if (!$tenant) {
                    return response()->json(['error' => 'Tenant not found'], 404);
                }
                $query->where('tenant_id', $tenant->id);
            }

            $query->whereHas('category', function ($q) use ($category) {
                $q->where('slug', $category);
            });

            $products = $query->orderBy('created_at', 'desc')
                            ->limit($limit)
                            ->get();

            return response()->json([
                'data' => ProductResource::collection($products)
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch products by category',
                'error' => config('app.debug') ? $e->getMessage() : 'An unexpected error occurred'
            ], 500);
        }
    }

    /**
     * Search products
     */
    public function search(Request $request, ?string $tenantSlug = null): JsonResponse
    {
        try {
            $query = $request->get('q', '');
            $limit = $request->get('limit', 20);
            
            $productQuery = Product::with('category')->published();
            
            // If tenant slug is provided, filter by tenant
            if ($tenantSlug) {
                $tenant = Tenant::where('slug', $tenantSlug)->first();
                if (!$tenant) {
                    return response()->json(['error' => 'Tenant not found'], 404);
                }
                $productQuery->where('tenant_id', $tenant->id);
            }

            if ($query) {
                $productQuery->where(function ($q) use ($query) {
                    $q->where('name', 'ILIKE', '%' . $query . '%')
                      ->orWhere('description', 'ILIKE', '%' . $query . '%')
                      ->orWhere('sku', 'ILIKE', '%' . $query . '%');
                });
            }

            $products = $productQuery->orderBy('name', 'asc')
                                   ->limit($limit)
                                   ->get();

            return response()->json([
                'data' => ProductResource::collection($products)
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to search products',
                'error' => config('app.debug') ? $e->getMessage() : 'An unexpected error occurred'
            ], 500);
        }
    }

    /**
     * Get single product by ID
     */
    public function show(Request $request, int $id): JsonResponse
    {
        try {
            $product = Product::with('category', 'variants')
                             ->published()
                             ->findOrFail($id);
            
            // Increment view count
            $product->increment('view_count');
            $product->last_viewed_at = now();
            $product->save();

            return (new ProductResource($product))
                ->response()
                ->setStatusCode(200);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'message' => 'Product not found'
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch product details',
                'error' => config('app.debug') ? $e->getMessage() : 'An unexpected error occurred'
            ], 500);
        }
    }

    /**
     * Get single product by slug
     */
    public function showBySlug(Request $request, string $tenantSlug, string $slug): JsonResponse
    {
        try {
            \Log::info("ProductController::showBySlug called", [
                'slug' => $slug,
                'tenantSlug' => $tenantSlug
            ]);
            
            $query = Product::with('category', 'variants')->published()->where('slug', $slug);
            
            // Filter by tenant since tenantSlug is always provided in this route
            $tenant = Tenant::where('slug', $tenantSlug)->first();
            \Log::info("Tenant lookup result", ['tenant' => $tenant]);
            
            if (!$tenant) {
                return response()->json(['error' => 'Tenant not found'], 404);
            }
            $query->where('tenant_id', $tenant->id);

            $product = $query->first();
            
            if (!$product) {
                return response()->json(['error' => 'Product not found'], 404);
            }
            
            // Increment view count
            $product->increment('view_count');
            $product->last_viewed_at = now();
            $product->save();

            return (new ProductResource($product))
                ->response()
                ->setStatusCode(200);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'message' => 'Product not found'
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch product details',
                'error' => config('app.debug') ? $e->getMessage() : 'An unexpected error occurred'
            ], 500);
        }
    }

    /**
     * Get product by slug (global route - no tenant filter)
     */
    public function showBySlugGlobal(Request $request, string $slug): JsonResponse
    {
        try {
            \Log::info("ProductController::showBySlugGlobal called", [
                'slug' => $slug
            ]);
            
            $product = Product::with('category', 'variants')
                ->published()
                ->where('slug', $slug)
                ->first();
            
            if (!$product) {
                return response()->json(['error' => 'Product not found'], 404);
            }

            return response()->json(new ProductResource($product), 200);

        } catch (\Exception $e) {
            \Log::error("ProductController::showBySlugGlobal error", [
                'slug' => $slug,
                'error' => $e->getMessage()
            ]);
            
            return response()->json([
                'message' => 'Failed to fetch product details',
                'error' => config('app.debug') ? $e->getMessage() : 'An unexpected error occurred'
            ], 500);
        }
    }
}