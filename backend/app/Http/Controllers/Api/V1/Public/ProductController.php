<?php

namespace App\Http\Controllers\Api\V1\Public;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Traits\ProductSearch;
use App\Infrastructure\Persistence\Eloquent\Models\Product;
use App\Infrastructure\Persistence\Eloquent\Models\ProductCategory;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;
use App\Infrastructure\Presentation\Http\Resources\Product\ProductResource;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ProductController extends Controller
{
    use ProductSearch;
    /**
     * Get public products (global or tenant-specific)
     * Enhanced with comprehensive server-side filtering, search, sorting, and pagination
     */
    public function index(Request $request, ?string $tenantSlug = null): JsonResponse
    {
        try {
            // Validate request parameters
            $validated = $request->validate([
                'page' => 'integer|min:1',
                'per_page' => 'integer|min:1|max:100',
                'search' => 'string|nullable|max:255',
                'category' => 'string|nullable',
                'subcategory' => 'string|nullable',
                'type' => 'string|nullable',
                'size' => 'string|nullable',
                'material' => 'string|nullable',
                'min_rating' => 'numeric|nullable|min:0|max:5',
                'sort' => 'string|nullable',
                'order' => 'string|nullable|in:asc,desc',
                'status' => 'string|nullable|in:published,draft,archived',
                'featured' => 'boolean|nullable',
                'in_stock' => 'boolean|nullable',
                'customizable' => 'boolean|nullable',
                'price_min' => 'numeric|nullable|min:0',
                'price_max' => 'numeric|nullable|min:0',
            ]);

            $perPage = $validated['per_page'] ?? 20;
            
            // Build query with review aggregation
            $query = Product::query()
                ->select([
                    'products.*',
                    \DB::raw('COALESCE(AVG(customer_reviews.rating), 0) as average_rating'),
                    \DB::raw('COUNT(DISTINCT customer_reviews.id) as review_count'),
                ])
                ->leftJoin('customer_reviews', function($join) {
                    $join->on('customer_reviews.product_id', '=', 'products.id')
                         ->where('customer_reviews.is_approved', '=', true);
                })
                ->with('category')
                ->where('products.status', 'published')
                ->groupBy('products.id');
            
            // If tenant slug is provided, filter by tenant
            if ($tenantSlug) {
                $tenant = TenantEloquentModel::where('slug', $tenantSlug)->first();
                if (!$tenant) {
                    return response()->json(['error' => 'Tenant not found'], 404);
                }
                $query->where('products.tenant_id', $tenant->id);
            }

            // Server-side search with ILIKE (case-insensitive)
            if (!empty($validated['search'])) {
                $this->applyProductSearch($query, $validated['search']);
            }

            // Category filter
            if (!empty($validated['category'])) {
                $query->whereHas('category', function ($q) use ($validated) {
                    $q->where('slug', $validated['category'])
                      ->orWhere('name', 'ILIKE', "%{$validated['category']}%");
                });
            }

            // Subcategory filter
            if (!empty($validated['subcategory'])) {
                $query->where('subcategory', 'ILIKE', "%{$validated['subcategory']}%");
            }

            // Type filter - supports both technical type and business type
            // Priority: business_type > type (for backward compatibility)
            if (!empty($validated['type'])) {
                $query->where(function($q) use ($validated) {
                    $q->where('business_type', $validated['type'])
                      ->orWhere('type', $validated['type']);
                });
            }

            // Size filter - supports exact size match or available_sizes array
            if (!empty($validated['size'])) {
                $query->where(function ($q) use ($validated) {
                    $q->where('size', $validated['size'])
                      ->orWhereJsonContains('available_sizes', $validated['size'])
                      ->orWhereJsonContains('specifications->size', $validated['size']);
                });
            }

            // Material filter - supports exact material match or available_materials array
            if (!empty($validated['material'])) {
                $query->where(function ($q) use ($validated) {
                    $q->where('material', 'ILIKE', "%{$validated['material']}%")
                      ->orWhereJsonContains('available_materials', $validated['material'])
                      ->orWhereJsonContains('specifications->material', $validated['material']);
                });
            }

            // Rating filter - using HAVING since avg_rating is aggregated
            // PostgreSQL requires full expression in HAVING, not alias
            if (isset($validated['min_rating']) && $validated['min_rating'] > 0) {
                $query->havingRaw('COALESCE(AVG(customer_reviews.rating), 0) >= ?', [$validated['min_rating']]);
            }

            // Featured filter
            if (isset($validated['featured'])) {
                $query->where('featured', $validated['featured']);
            }

            // Stock filter
            if (isset($validated['in_stock'])) {
                if ($validated['in_stock']) {
                    $query->where('stock_quantity', '>', 0);
                } else {
                    $query->where('stock_quantity', '<=', 0);
                }
            }

            // Customizable filter
            if (isset($validated['customizable'])) {
                $query->where('customizable', $validated['customizable']);
            }

            // Price range filter (convert from rupiah to cents for database)
            if (isset($validated['price_min'])) {
                $query->where('price', '>=', $validated['price_min'] * 100);
            }

            if (isset($validated['price_max'])) {
                $query->where('price', '<=', $validated['price_max'] * 100);
            }

            // Server-side sorting
            $sortBy = $validated['sort'] ?? 'created_at';
            $sortOrder = $validated['order'] ?? 'desc';

            // Map frontend sort options to database columns
            $sortMapping = [
                'name' => 'name',
                'name-asc' => ['name', 'asc'],
                'name-desc' => ['name', 'desc'],
                'price' => 'price',
                'price-asc' => ['price', 'asc'],
                'price-desc' => ['price', 'desc'],
                'rating' => 'average_rating',
                'rating-high' => ['average_rating', 'desc'],
                'rating-low' => ['average_rating', 'asc'],
                'created_at' => 'created_at',
                'created-asc' => ['created_at', 'asc'],
                'created-desc' => ['created_at', 'desc'],
                'featured' => ['featured', 'desc'],
                'popular' => ['view_count', 'desc'],
            ];

            if (isset($sortMapping[$sortBy])) {
                $mapping = $sortMapping[$sortBy];
                if (is_array($mapping)) {
                    [$column, $direction] = $mapping;
                    $query->orderBy($column, $direction);
                } else {
                    $query->orderBy($mapping, $sortOrder);
                }
            } else {
                // Fallback to created_at if invalid sort column
                $query->orderBy('created_at', 'desc');
            }

            // Add secondary sort for consistency
            $query->orderBy('id', 'asc');

            // Paginate results
            $products = $query->paginate($perPage);

            return ProductResource::collection($products)
                ->response()
                ->setStatusCode(200);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Failed to fetch products', [
                'error' => $e->getMessage(),
                'trace' => config('app.debug') ? $e->getTraceAsString() : null
            ]);
            
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
            
            // Build query with review aggregation
            $query = Product::query()
                ->select([
                    'products.*',
                    \DB::raw('COALESCE(AVG(customer_reviews.rating), 0) as average_rating'),
                    \DB::raw('COUNT(DISTINCT customer_reviews.id) as review_count'),
                ])
                ->leftJoin('customer_reviews', function($join) {
                    $join->on('customer_reviews.product_id', '=', 'products.id')
                         ->where('customer_reviews.is_approved', '=', true);
                })
                ->with('category')
                ->where('products.status', 'published')
                ->where('products.featured', true)
                ->groupBy('products.id');
            
            // If tenant slug is provided, filter by tenant
            if ($tenantSlug) {
                $tenant = TenantEloquentModel::where('slug', $tenantSlug)->first();
                if (!$tenant) {
                    return response()->json(['error' => 'Tenant not found'], 404);
                }
                $query->where('products.tenant_id', $tenant->id);
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
            
            // Build query with review aggregation
            $query = Product::query()
                ->select([
                    'products.*',
                    \DB::raw('COALESCE(AVG(customer_reviews.rating), 0) as average_rating'),
                    \DB::raw('COUNT(DISTINCT customer_reviews.id) as review_count'),
                ])
                ->leftJoin('customer_reviews', function($join) {
                    $join->on('customer_reviews.product_id', '=', 'products.id')
                         ->where('customer_reviews.is_approved', '=', true);
                })
                ->with('category')
                ->where('products.status', 'published')
                ->groupBy('products.id');
            
            // If tenant slug is provided, filter by tenant
            if ($tenantSlug) {
                $tenant = TenantEloquentModel::where('slug', $tenantSlug)->first();
                if (!$tenant) {
                    return response()->json(['error' => 'Tenant not found'], 404);
                }
                $query->where('products.tenant_id', $tenant->id);
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
            
            // Build query with review aggregation
            $productQuery = Product::query()
                ->select([
                    'products.*',
                    \DB::raw('COALESCE(AVG(customer_reviews.rating), 0) as average_rating'),
                    \DB::raw('COUNT(DISTINCT customer_reviews.id) as review_count'),
                ])
                ->leftJoin('customer_reviews', function($join) {
                    $join->on('customer_reviews.product_id', '=', 'products.id')
                         ->where('customer_reviews.is_approved', '=', true);
                })
                ->with('category')
                ->where('products.status', 'published')
                ->groupBy('products.id');
            
            // If tenant slug is provided, filter by tenant
            if ($tenantSlug) {
                $tenant = TenantEloquentModel::where('slug', $tenantSlug)->first();
                if (!$tenant) {
                    return response()->json(['error' => 'Tenant not found'], 404);
                }
                $productQuery->where('products.tenant_id', $tenant->id);
            }

            if ($query) {
                $productQuery->where(function ($q) use ($query) {
                    $q->where('products.name', 'ILIKE', '%' . $query . '%')
                      ->orWhere('products.description', 'ILIKE', '%' . $query . '%')
                      ->orWhere('products.long_description', 'ILIKE', '%' . $query . '%')
                      ->orWhere('products.sku', 'ILIKE', '%' . $query . '%')
                      ->orWhereJsonContains('products.tags', $query);
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
            $tenant = TenantEloquentModel::where('slug', $tenantSlug)->first();
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

    /**
     * Get product categories (public API)
     * Phase 1.4: Dynamic category list for frontend filters
     */
    public function getCategories(Request $request, ?string $tenantSlug = null): JsonResponse
    {
        try {
            $query = \App\Infrastructure\Persistence\Eloquent\Models\ProductCategory::query()
                ->where('is_active', true)
                ->where('show_in_menu', true)
                ->orderBy('sort_order', 'asc')
                ->orderBy('name', 'asc');
            
            // If tenant slug is provided, filter by tenant
            if ($tenantSlug) {
                $tenant = \App\Infrastructure\Persistence\Eloquent\TenantEloquentModel::where('slug', $tenantSlug)->first();
                if (!$tenant) {
                    return response()->json(['error' => 'Tenant not found'], 404);
                }
                $query->where('tenant_id', $tenant->id);
            }
            
            $categories = $query->get(['id', 'uuid', 'name', 'slug', 'description', 'image', 'icon']);
            
            // Transform to use UUID instead of integer ID
            $categories = $categories->map(function ($category) {
                return [
                    'id' => $category->uuid,
                    'uuid' => $category->uuid,
                    'name' => $category->name,
                    'slug' => $category->slug,
                    'description' => $category->description,
                    'image' => $category->image,
                    'icon' => $category->icon,
                ];
            });
            
            return response()->json([
                'data' => $categories
            ], 200);

        } catch (\Exception $e) {
            \Log::error('Failed to fetch product categories', [
                'error' => $e->getMessage(),
                'trace' => config('app.debug') ? $e->getTraceAsString() : null
            ]);
            
            return response()->json([
                'message' => 'Failed to fetch product categories',
                'error' => config('app.debug') ? $e->getMessage() : 'An unexpected error occurred'
            ], 500);
        }
    }

    /**
     * Get product options for customization
     * Phase 1.6: Remove hardcoded data from frontend
     * 
     * @param Request $request
     * @param string $tenantSlug
     * @param string $uuid Product UUID
     * @return JsonResponse
     */
    public function options(Request $request, string $tenantSlug, string $uuid): JsonResponse
    {
        try {
            // Find tenant
            $tenant = TenantEloquentModel::where('slug', $tenantSlug)->first();
            if (!$tenant) {
                return response()->json(['error' => 'Tenant not found'], 404);
            }
            
            // Find product by UUID and tenant
            $product = Product::where('uuid', $uuid)
                ->where('tenant_id', $tenant->id)
                ->where('status', 'published')
                ->first();
            
            if (!$product) {
                return response()->json(['error' => 'Product not found'], 404);
            }
            
            return response()->json([
                'data' => $product->getProductOptions()
            ], 200);

        } catch (\Exception $e) {
            \Log::error('Failed to fetch product options', [
                'uuid' => $uuid,
                'tenantSlug' => $tenantSlug,
                'error' => $e->getMessage(),
                'trace' => config('app.debug') ? $e->getTraceAsString() : null
            ]);
            
            return response()->json([
                'message' => 'Failed to fetch product options',
                'error' => config('app.debug') ? $e->getMessage() : 'An unexpected error occurred'
            ], 500);
        }
    }

    /**
     * Get filter options (business types, sizes, materials) from database
     * Phase 1.4.1: Dynamic filter options to remove frontend hardcoded data
     * Updated: Query business_types from product_categories table (category-based architecture)
     * 
     * @param Request $request
     * @param string|null $tenantSlug
     * @return JsonResponse
     */
    public function getFilterOptions(Request $request, ?string $tenantSlug = null): JsonResponse
    {
        try {
            $query = Product::where('status', 'published');
            $categoryQuery = ProductCategory::where('is_active', true);
            
            // If tenant slug is provided, filter by tenant
            if ($tenantSlug) {
                $tenant = TenantEloquentModel::where('slug', $tenantSlug)->first();
                if (!$tenant) {
                    return response()->json(['error' => 'Tenant not found'], 404);
                }
                $query->where('tenant_id', $tenant->id);
                $categoryQuery->where('tenant_id', $tenant->id);
            }
            
            // Get distinct business_types from product_categories table
            $businessTypes = $categoryQuery->clone()
                ->whereNotNull('business_type')
                ->distinct()
                ->pluck('business_type')
                ->filter()
                ->map(function ($type) {
                    return [
                        'value' => $type,
                        'label' => $this->formatBusinessTypeLabel($type)
                    ];
                })
                ->values();
            
            // Get distinct sizes
            $sizes = $query->clone()
                ->whereNotNull('size')
                ->distinct()
                ->pluck('size')
                ->filter()
                ->map(function ($size) {
                    return [
                        'value' => $size,
                        'label' => $size
                    ];
                })
                ->values();
            
            // Get distinct materials
            $materials = $query->clone()
                ->whereNotNull('material')
                ->distinct()
                ->pluck('material')
                ->filter()
                ->map(function ($material) {
                    return [
                        'value' => $material,
                        'label' => $material
                    ];
                })
                ->values();
            
            return response()->json([
                'data' => [
                    'business_types' => $businessTypes,
                    'sizes' => $sizes,
                    'materials' => $materials
                ]
            ], 200);

        } catch (\Exception $e) {
            \Log::error('Failed to fetch filter options', [
                'tenantSlug' => $tenantSlug,
                'error' => $e->getMessage(),
                'trace' => config('app.debug') ? $e->getTraceAsString() : null
            ]);
            
            return response()->json([
                'message' => 'Failed to fetch filter options',
                'error' => config('app.debug') ? $e->getMessage() : 'An unexpected error occurred'
            ], 500);
        }
    }

    /**
     * Format business_type to user-friendly label
     */
    private function formatBusinessTypeLabel(string $type): string
    {
        $labels = [
            'metal_etching' => 'Metal Etching',
            'glass_etching' => 'Glass Etching',
            'award_plaque' => 'Awards & Plaques',
            'signage' => 'Signage Solutions',
            'industrial_etching' => 'Industrial Etching',
            'custom_etching' => 'Custom Etching',
            'trophy_medal' => 'Trophy & Medal',
        ];
        
        return $labels[$type] ?? ucwords(str_replace('_', ' ', $type));
    }
}