<?php

namespace App\Infrastructure\Presentation\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Traits\ProductSearch;
use App\Infrastructure\Persistence\Eloquent\Models\Product;
use App\Infrastructure\Persistence\Eloquent\Models\ProductCategory;
use App\Infrastructure\Persistence\Eloquent\Models\ProductVariant;
use App\Infrastructure\Presentation\Http\Requests\Product\StoreProductRequest;
use App\Infrastructure\Presentation\Http\Requests\Product\UpdateProductRequest;
use App\Infrastructure\Presentation\Http\Resources\Product\ProductResource;
use App\Infrastructure\Presentation\Http\Resources\Product\ProductCategoryResource;
use App\Http\Resources\Product\ProductVariantResource;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;
use App\Events\ProductCreated;
use App\Events\ProductUpdated;
use App\Events\ProductDeleted;
use App\Events\ProductBulkUpdated;

class ProductController extends Controller
{
    use ProductSearch;
    public function __construct()
    {
    }

    /**
     * Resolve tenant from multiple sources with fallback
     */
    private function resolveTenant(Request $request)
    {
        // Try from request attributes (set by middleware)
        $tenant = $request->attributes->get('tenant');
        if ($tenant) {
            return $tenant;
        }
        
        // Try from request merge
        $tenant = $request->get('current_tenant');
        if ($tenant) {
            return $tenant;
        }
        
        // Try from app container
        if (app()->bound('current_tenant')) {
            $tenant = app('current_tenant');
            if ($tenant) {
                return $tenant;
            }
        }
        
        // Try from config
        $tenant = config('multitenancy.current_tenant');
        if ($tenant) {
            return $tenant;
        }
        
        // FALLBACK: Try from authenticated user
        $user = auth('sanctum')->user() ?? auth()->user();
        if ($user && isset($user->tenant_id)) {
            $tenant = $user->tenant ?? \App\Infrastructure\Persistence\Eloquent\TenantEloquentModel::find($user->tenant_id);
            if ($tenant) {
                // Cache tenant in request for subsequent calls
                $request->attributes->set('tenant', $tenant);
                $request->merge(['current_tenant' => $tenant]);
                return $tenant;
            }
        }
        
        return null;
    }

    /**
     * Validate UUID format
     */
    private function validateUuid(string $id): ?JsonResponse
    {
        if (!Str::isUuid($id)) {
            return response()->json([
                'message' => 'Format ID tidak valid. Gunakan UUID produk.',
                'received' => $id
            ], 400);
        }
        return null;
    }

    /**
     * List all products
     */
    public function index(Request $request): JsonResponse
    {
        try {
            // CRITICAL: Explicit tenant filtering (defense in depth)
            $tenant = $this->resolveTenant($request);
            
            if (!$tenant) {
                \Log::error('[RBAC] Tenant context not found in ProductController::index', [
                    'user_id' => auth()->id(),
                    'request_path' => $request->path(),
                    'headers' => $request->headers->all(),
                ]);
                
                return response()->json([
                    'message' => 'Tenant context not available',
                    'error' => 'TENANT_CONTEXT_MISSING'
                ], 500);
            }
            
            $perPage = $request->get('per_page', 20);
            
            // CRITICAL: Explicit tenant_id filtering as safety net
            $query = Product::where('tenant_id', $tenant->id)
                ->with('category');

            if ($request->filled('search')) {
                $this->applyProductSearch($query, $request->search);
            }

            if ($request->filled('category_id')) {
                $query->where('category_id', $request->category_id);
            }

            if ($request->filled('status')) {
                $query->where('status', $request->status);
            }

            if ($request->filled('featured')) {
                $query->where('featured', $request->boolean('featured'));
            }

            if ($request->filled('customizable')) {
                $query->where('customizable', $request->boolean('customizable'));
            }

            if ($request->filled('material')) {
                $query->where('material', $request->material);
            }

            if ($request->filled('price_min')) {
                $query->where('price', '>=', $request->price_min);
            }

            if ($request->filled('price_max')) {
                $query->where('price', '<=', $request->price_max);
            }

            if ($request->filled('in_stock')) {
                if ($request->boolean('in_stock')) {
                    $query->where('stock_quantity', '>', 0);
                }
            }

            $sortBy = $request->get('sort_by', 'created_at');
            $sortOrder = $request->get('sort_order', 'desc');
            $query->orderBy($sortBy, $sortOrder);

            $products = $query->paginate($perPage);

            return response()->json([
                'data' => ProductResource::collection($products->items()),
                'current_page' => $products->currentPage(),
                'last_page' => $products->lastPage(),
                'per_page' => $products->perPage(),
                'total' => $products->total(),
                'from' => $products->firstItem(),
                'to' => $products->lastItem(),
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Gagal mengambil daftar produk',
                'error' => config('app.debug') ? $e->getMessage() : 'Terjadi kesalahan tidak terduga'
            ], 500);
        }
    }

    public function search(Request $request): JsonResponse
    {
        try {
            // CRITICAL: Explicit tenant filtering
            $tenant = $this->resolveTenant($request);
            
            if (!$tenant) {
                return response()->json([
                    'success' => false,
                    'message' => 'Tenant context not available',
                    'error' => 'TENANT_CONTEXT_MISSING'
                ], 500);
            }
            
            $validated = $request->validate([
                'query' => 'nullable|string|max:255',
                'category_id' => 'nullable|integer',
                'status' => 'nullable|string|max:50',
                'tag' => 'nullable|string|max:50',
                'limit' => 'nullable|integer|min:1|max:100',
                'include_inventory' => 'nullable|boolean',
            ]);

            $queryTerm = $validated['query'] ?? $request->get('search');
            $limit = $validated['limit'] ?? 25;
            $includeInventory = (bool) ($validated['include_inventory'] ?? false);

            // CRITICAL: Explicit tenant_id filtering
            $builder = Product::where('tenant_id', $tenant->id)
                ->with('category');

            if ($queryTerm) {
                $this->applyProductSearch($builder, $queryTerm);
            }

            if (!empty($validated['category_id'])) {
                $builder->where('category_id', $validated['category_id']);
            }

            if (!empty($validated['status'])) {
                $builder->where('status', $validated['status']);
            }

            if (!empty($validated['tag'])) {
                $builder->whereJsonContains('tags', $validated['tag']);
            }

            $products = $builder
                ->orderBy('name')
                ->limit($limit)
                ->get();

            $results = $products->map(function (Product $product) use ($request, $includeInventory) {
                $payload = (new ProductResource($product))->toArray($request);

                if ($includeInventory) {
                    $payload['inventory'] = [
                        'stockQuantity' => $product->stock_quantity,
                        'lowStockThreshold' => $product->low_stock_threshold,
                        'isLowStock' => $product->isLowStock(),
                    ];
                }

                return $payload;
            });

            return response()->json([
                'success' => true,
                'message' => 'Pencarian produk berhasil',
                'data' => $results,
                'meta' => [
                    'limit' => $limit,
                    'count' => $results->count(),
                    'filters' => $validated,
                    'generatedAt' => now()->toIso8601String(),
                ],
            ], 200);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi pencarian produk gagal',
                'error' => $e->validator->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal melakukan pencarian produk',
                'error' => config('app.debug') ? $e->getMessage() : 'Terjadi kesalahan tidak terduga',
            ], 500);
        }
    }

    /**
     * Show a specific product
     */
    public function show(Request $request, string $id): JsonResponse
    {
        if ($error = $this->validateUuid($id)) {
            return $error;
        }

        try {
            // CRITICAL: Explicit tenant filtering
            $tenant = $this->resolveTenant($request);
            
            if (!$tenant) {
                return response()->json([
                    'message' => 'Tenant context not available'
                ], 500);
            }
            
            // CRITICAL: Explicit tenant_id filtering
            $product = Product::where('tenant_id', $tenant->id)
                ->with('category', 'variants')
                ->where('uuid', $id)
                ->firstOrFail();
            
            $product->increment('view_count');
            $product->last_viewed_at = now();
            $product->save();

            return (new ProductResource($product))
                ->response()
                ->setStatusCode(200);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'message' => 'Produk tidak ditemukan'
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Gagal mengambil detail produk',
                'error' => config('app.debug') ? $e->getMessage() : 'Terjadi kesalahan tidak terduga'
            ], 500);
        }
    }

    /**
     * Show a specific product by slug
     */
    public function showBySlug(Request $request, string $slug): JsonResponse
    {
        try {
            // CRITICAL: Explicit tenant filtering
            $tenant = $this->resolveTenant($request);
            
            if (!$tenant) {
                return response()->json([
                    'message' => 'Tenant context not available'
                ], 500);
            }
            
            // CRITICAL: Explicit tenant_id filtering
            $product = Product::where('tenant_id', $tenant->id)
                ->with('category', 'variants')
                ->where('slug', $slug)
                ->firstOrFail();
            
            $product->increment('view_count');
            $product->last_viewed_at = now();
            $product->save();

            return (new ProductResource($product))
                ->response()
                ->setStatusCode(200);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'message' => 'Produk tidak ditemukan'
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Gagal mengambil detail produk',
                'error' => config('app.debug') ? $e->getMessage() : 'Terjadi kesalahan tidak terduga'
            ], 500);
        }
    }

    /**
     * Create a new product
     */
    public function store(StoreProductRequest $request): JsonResponse
    {
        try {
            $productData = $request->validated();
            
            if (empty($productData['slug']) && !empty($productData['name'])) {
                $productData['slug'] = Str::slug($productData['name']);
                
                $originalSlug = $productData['slug'];
                $counter = 1;
                while (Product::where('slug', $productData['slug'])->exists()) {
                    $productData['slug'] = $originalSlug . '-' . $counter;
                    $counter++;
                }
            }

            if ($request->has('published') && $request->boolean('published')) {
                $productData['status'] = 'published';
                $productData['published_at'] = now();
            }

            $product = Product::create($productData);
            $product->load('category');

            // Broadcast product created event
            event(new ProductCreated(
                $product->uuid,
                auth()->user()->tenant_id ?? null,
                auth()->id(),
                auth()->user()->name ?? null
            ));

            return (new ProductResource($product))
                ->response()
                ->setStatusCode(201);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Gagal membuat produk',
                'error' => config('app.debug') ? $e->getMessage() : 'Terjadi kesalahan tidak terduga'
            ], 500);
        }
    }

    /**
     * Update an existing product
     */
    public function update(UpdateProductRequest $request, string $id): JsonResponse
    {
        if ($error = $this->validateUuid($id)) {
            return $error;
        }

        try {
            // CRITICAL: Explicit tenant filtering
            $tenant = $this->resolveTenant($request);
            
            if (!$tenant) {
                return response()->json([
                    'message' => 'Tenant context not available'
                ], 500);
            }
            
            // CRITICAL: Explicit tenant_id filtering
            $product = Product::where('tenant_id', $tenant->id)
                ->where('uuid', $id)
                ->firstOrFail();
            $productData = $request->validated();
            
            if ($request->has('name') && $productData['name'] !== $product->name) {
                $slug = Str::slug($productData['name']);
                $originalSlug = $slug;
                $counter = 1;
                while (Product::where('slug', $slug)->where('uuid', '!=', $id)->whereNull('deleted_at')->exists()) {
                    $slug = $originalSlug . '-' . $counter;
                    $counter++;
                }
                $productData['slug'] = $slug;
            }

            if ($request->has('status') && $productData['status'] === 'published' && $product->status !== 'published') {
                $productData['published_at'] = now();
            }

            $product->update($productData);
            $product->load('category');

            // Broadcast product updated event
            event(new ProductUpdated(
                $product->uuid,
                auth()->user()->tenant_id ?? null,
                auth()->id(),
                auth()->user()->name ?? null
            ));

            return (new ProductResource($product))
                ->response()
                ->setStatusCode(200);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'message' => 'Produk tidak ditemukan'
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Gagal memperbarui produk',
                'error' => config('app.debug') ? $e->getMessage() : 'Terjadi kesalahan tidak terduga'
            ], 500);
        }
    }

    /**
     * Delete a product
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        if ($error = $this->validateUuid($id)) {
            return $error;
        }

        try {
            // CRITICAL: Explicit tenant filtering
            $tenant = $this->resolveTenant($request);
            
            if (!$tenant) {
                return response()->json([
                    'message' => 'Tenant context not available'
                ], 500);
            }
            
            // CRITICAL: Explicit tenant_id filtering
            $product = Product::where('tenant_id', $tenant->id)
                ->where('uuid', $id)
                ->firstOrFail();
            $productUuid = $product->uuid;
            $product->delete();

            // Broadcast product deleted event
            event(new ProductDeleted(
                $productUuid,
                auth()->user()->tenant_id ?? null,
                auth()->id(),
                auth()->user()->name ?? null
            ));

            return response()->json([
                'message' => 'Produk berhasil dihapus'
            ], 200);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'message' => 'Produk tidak ditemukan'
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Gagal menghapus produk',
                'error' => config('app.debug') ? $e->getMessage() : 'Terjadi kesalahan tidak terduga'
            ], 500);
        }
    }

    /**
     * Publish a product
     */
    public function publish(Request $request, string $id): JsonResponse
    {
        if ($error = $this->validateUuid($id)) {
            return $error;
        }

        try {
            $product = Product::where('uuid', $id)->firstOrFail();
            $product->update([
                'status' => 'published',
                'published_at' => now()
            ]);
            $product->load('category');

            return (new ProductResource($product))
                ->response()
                ->setStatusCode(200);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'message' => 'Produk tidak ditemukan'
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Gagal mempublikasikan produk',
                'error' => config('app.debug') ? $e->getMessage() : 'Terjadi kesalahan tidak terduga'
            ], 500);
        }
    }

    /**
     * Unpublish a product
     */
    public function unpublish(Request $request, string $id): JsonResponse
    {
        if ($error = $this->validateUuid($id)) {
            return $error;
        }

        try {
            $product = Product::where('uuid', $id)->firstOrFail();
            $product->update(['status' => 'draft']);
            $product->load('category');

            return (new ProductResource($product))
                ->response()
                ->setStatusCode(200);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'message' => 'Produk tidak ditemukan'
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Gagal membatalkan publikasi produk',
                'error' => config('app.debug') ? $e->getMessage() : 'Terjadi kesalahan tidak terduga'
            ], 500);
        }
    }

    /**
     * Update product stock
     */
    public function updateStock(Request $request, string $id): JsonResponse
    {
        if ($error = $this->validateUuid($id)) {
            return $error;
        }

        try {
            $request->validate([
                'stock_quantity' => 'required|integer|min:0',
                'low_stock_threshold' => 'nullable|integer|min:0'
            ]);

            $product = Product::where('uuid', $id)->firstOrFail();
            
            $product->update([
                'stock_quantity' => $request->stock_quantity,
                'low_stock_threshold' => $request->low_stock_threshold ?? $product->low_stock_threshold,
            ]);
            $product->load('category');

            return (new ProductResource($product))
                ->response()
                ->setStatusCode(200);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'message' => 'Produk tidak ditemukan'
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Gagal memperbarui stok produk',
                'error' => config('app.debug') ? $e->getMessage() : 'Terjadi kesalahan tidak terduga'
            ], 500);
        }
    }

    public function categories(Request $request): JsonResponse
    {
        try {
            $query = ProductCategory::query();

            if ($request->boolean('active_only')) {
                $query->where('is_active', true);
            }

            if ($request->boolean('featured_only')) {
                $query->where('is_featured', true);
            }

            if ($request->filled('parent_id')) {
                $query->where('parent_id', $request->get('parent_id'));
            } elseif ($request->boolean('root_only')) {
                $query->whereNull('parent_id');
            }

            if ($request->boolean('with_counts', true)) {
                $query->withCount('products');
            }

            if ($request->boolean('include_children')) {
                $query->with(['children' => function ($childQuery) {
                    $childQuery->withCount('products')
                        ->orderBy('sort_order')
                        ->orderBy('name');
                }]);
            }

            $categories = $query
                ->orderBy('sort_order')
                ->orderBy('name')
                ->get();

            $stats = [
                'totalCategories' => ProductCategory::count(),
                'activeCategories' => ProductCategory::where('is_active', true)->count(),
                'featuredCategories' => ProductCategory::where('is_featured', true)->count(),
                'categoriesWithProducts' => ProductCategory::has('products')->count(),
            ];

            return ProductCategoryResource::collection($categories)
                ->additional([
                    'message' => 'Taxonomi kategori produk berhasil diambil',
                    'meta' => [
                        'filters' => $request->all(),
                        'stats' => $stats,
                        'generatedAt' => now()->toIso8601String(),
                    ],
                ])
                ->response()
                ->setStatusCode(200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Gagal mengambil kategori produk',
                'error' => config('app.debug') ? $e->getMessage() : 'Terjadi kesalahan tidak terduga'
            ], 500);
        }
    }

    public function tags(Request $request): JsonResponse
    {
        try {
            $tagSource = Product::query()
                ->select('tags')
                ->whereNotNull('tags')
                ->get()
                ->flatMap(function ($product) {
                    return collect($product->tags ?? [])
                        ->map(fn ($tag) => trim((string) $tag))
                        ->filter();
                });

            $tagBuckets = $tagSource
                ->groupBy(fn ($tag) => mb_strtolower($tag))
                ->map(function ($bucket) {
                    $label = $bucket->first();
                    return [
                        'tag' => $label,
                        'count' => $bucket->count(),
                    ];
                })
                ->values()
                ->sortByDesc('count')
                ->values();

            $totalUniqueTags = $tagBuckets->count();
            $totalUsage = $tagBuckets->sum('count');

            if ($request->filled('query')) {
                $needle = mb_strtolower($request->get('query'));
                $tagBuckets = $tagBuckets
                    ->filter(fn ($entry) => mb_strpos(mb_strtolower($entry['tag']), $needle) !== false)
                    ->values();
            }

            if ($request->filled('limit')) {
                $tagBuckets = $tagBuckets->take((int) $request->get('limit'))->values();
            }

            return response()->json([
                'success' => true,
                'message' => 'Daftar tag produk berhasil diambil',
                'data' => $tagBuckets,
                'meta' => [
                    'totalUniqueTags' => $totalUniqueTags,
                    'totalUsage' => $totalUsage,
                    'returned' => $tagBuckets->count(),
                    'generatedAt' => now()->toIso8601String(),
                ],
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil daftar tag produk',
                'error' => config('app.debug') ? $e->getMessage() : 'Terjadi kesalahan tidak terduga',
            ], 500);
        }
    }

    /**
     * Get low stock products
     */
    public function lowStock(Request $request): JsonResponse
    {
        try {
            $products = Product::with('category')
                ->where(function ($query) {
                    $query->whereColumn('stock_quantity', '<=', 'low_stock_threshold')
                          ->where('stock_quantity', '>', 0);
                })
                ->orWhere(function ($query) use ($request) {
                    $threshold = $request->get('threshold', 10);
                    $query->whereNull('low_stock_threshold')
                          ->where('stock_quantity', '<=', $threshold)
                          ->where('stock_quantity', '>', 0);
                })
                ->get();
            
            return ProductResource::collection($products)
                ->response()
                ->setStatusCode(200);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Gagal mengambil daftar produk stok rendah',
                'error' => config('app.debug') ? $e->getMessage() : 'Terjadi kesalahan tidak terduga'
            ], 500);
        }
    }

    /**
     * Get out of stock products
     */
    public function outOfStock(Request $request): JsonResponse
    {
        try {
            $products = Product::with('category')
                ->where('stock_quantity', '<=', 0)
                ->get();
            
            return ProductResource::collection($products)
                ->response()
                ->setStatusCode(200);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Gagal mengambil daftar produk habis stok',
                'error' => config('app.debug') ? $e->getMessage() : 'Terjadi kesalahan tidak terduga'
            ], 500);
        }
    }

    /**
     * Get all variants for a product
     */
    public function getVariants(string $productId): JsonResponse
    {
        if ($error = $this->validateUuid($productId)) {
            return $error;
        }

        try {
            $product = Product::where('uuid', $productId)->firstOrFail();
            
            $variants = ProductVariant::where('product_id', $product->id)
                ->orderBy('sort_order')
                ->orderBy('name')
                ->get();

            return response()->json(
                ProductVariantResource::collection($variants)
            );

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'message' => 'Produk tidak ditemukan'
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Gagal mengambil varian produk',
                'error' => config('app.debug') ? $e->getMessage() : 'Terjadi kesalahan tidak terduga'
            ], 500);
        }
    }

    /**
     * Get a specific variant
     */
    public function getVariant(string $productId, string $variantId): JsonResponse
    {
        if ($error = $this->validateUuid($productId)) {
            return $error;
        }

        try {
            $product = Product::where('uuid', $productId)->firstOrFail();
            
            $variant = ProductVariant::where('product_id', $product->id)
                ->where(function($query) use ($variantId) {
                    $query->where('id', $variantId)
                          ->orWhere('uuid', $variantId);
                })
                ->firstOrFail();

            return (new ProductVariantResource($variant))
                ->response()
                ->setStatusCode(200);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'message' => 'Varian produk tidak ditemukan'
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Gagal mengambil detail varian',
                'error' => config('app.debug') ? $e->getMessage() : 'Terjadi kesalahan tidak terduga'
            ], 500);
        }
    }

    /**
     * Create a new variant
     */
    public function createVariant(Request $request, string $productId): JsonResponse
    {
        if ($error = $this->validateUuid($productId)) {
            return $error;
        }

        $request->validate([
            'name' => 'required|string|max:255',
            'sku' => 'nullable|string|max:255',
            'material' => 'nullable|in:Akrilik,Kuningan,Tembaga,Stainless Steel,Aluminum',
            'quality' => 'nullable|in:Standard,Tinggi,Premium',
            'thickness' => 'nullable|numeric',
            'color' => 'nullable|string|max:255',
            'color_hex' => 'nullable|string|max:7',
            'base_price' => 'nullable|numeric',
            'selling_price' => 'nullable|numeric',
            'stock_quantity' => 'nullable|integer|min:0',
            'is_active' => 'nullable|boolean',
            'is_default' => 'nullable|boolean'
        ]);

        try {
            $product = Product::where('uuid', $productId)->firstOrFail();
            
            $variant = ProductVariant::create(array_merge(
                $request->all(),
                [
                    'tenant_id' => $product->tenant_id,
                    'product_id' => $product->id,
                    'category_id' => $product->category_id
                ]
            ));

            return (new ProductVariantResource($variant))
                ->response()
                ->setStatusCode(201);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'message' => 'Produk tidak ditemukan'
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Gagal membuat varian produk',
                'error' => config('app.debug') ? $e->getMessage() : 'Terjadi kesalahan tidak terduga'
            ], 500);
        }
    }

    /**
     * Update a variant
     */
    public function updateVariant(Request $request, string $productId, string $variantId): JsonResponse
    {
        if ($error = $this->validateUuid($productId)) {
            return $error;
        }

        $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'sku' => 'nullable|string|max:255',
            'material' => 'nullable|in:Akrilik,Kuningan,Tembaga,Stainless Steel,Aluminum',
            'quality' => 'nullable|in:Standard,Tinggi,Premium',
            'thickness' => 'nullable|numeric',
            'color' => 'nullable|string|max:255',
            'color_hex' => 'nullable|string|max:7',
            'base_price' => 'nullable|numeric',
            'selling_price' => 'nullable|numeric',
            'stock_quantity' => 'nullable|integer|min:0',
            'is_active' => 'nullable|boolean',
            'is_default' => 'nullable|boolean'
        ]);

        try {
            $product = Product::where('uuid', $productId)->firstOrFail();
            
            $variant = ProductVariant::where('product_id', $product->id)
                ->where(function($query) use ($variantId) {
                    $query->where('id', $variantId)
                          ->orWhere('uuid', $variantId);
                })
                ->firstOrFail();

            $variant->update($request->all());

            return (new ProductVariantResource($variant))
                ->response()
                ->setStatusCode(200);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'message' => 'Varian produk tidak ditemukan'
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Gagal mengupdate varian produk',
                'error' => config('app.debug') ? $e->getMessage() : 'Terjadi kesalahan tidak terduga'
            ], 500);
        }
    }

    /**
     * Delete a variant
     */
    public function deleteVariant(string $productId, string $variantId): JsonResponse
    {
        if ($error = $this->validateUuid($productId)) {
            return $error;
        }

        try {
            $product = Product::where('uuid', $productId)->firstOrFail();
            
            $variant = ProductVariant::where('product_id', $product->id)
                ->where(function($query) use ($variantId) {
                    $query->where('id', $variantId)
                          ->orWhere('uuid', $variantId);
                })
                ->firstOrFail();

            $variant->delete();

            return response()->json([
                'message' => 'Varian produk berhasil dihapus'
            ], 200);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'message' => 'Varian produk tidak ditemukan'
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Gagal menghapus varian produk',
                'error' => config('app.debug') ? $e->getMessage() : 'Terjadi kesalahan tidak terduga'
            ], 500);
        }
    }

    /**
     * Duplicate a product
     */
    public function duplicate(string $productId): JsonResponse
    {
        if ($error = $this->validateUuid($productId)) {
            return $error;
        }

        try {
            $originalProduct = Product::where('uuid', $productId)->firstOrFail();
            
            // Create duplicate with modified name
            $duplicateData = $originalProduct->toArray();
            unset($duplicateData['id']);
            unset($duplicateData['uuid']);
            unset($duplicateData['created_at']);
            unset($duplicateData['updated_at']);
            unset($duplicateData['deleted_at']);
            
            // Generate unique name and slug with timestamp to avoid collisions
            $timestamp = time();
            $baseName = $originalProduct->name;
            $duplicateName = $baseName . ' (Copy)';
            $duplicateSku = $originalProduct->sku ? $originalProduct->sku . '-COPY-' . $timestamp : null;
            
            // Check if name already exists (excluding soft-deleted) and increment
            $nameCounter = 1;
            while (Product::where('tenant_id', $originalProduct->tenant_id)
                ->where('name', $duplicateName)
                ->whereNull('deleted_at')
                ->exists()) {
                $duplicateName = $baseName . ' (Copy ' . $nameCounter . ')';
                $nameCounter++;
            }
            
            $duplicateData['name'] = $duplicateName;
            $duplicateData['sku'] = $duplicateSku;
            $duplicateData['status'] = 'draft'; // Set to draft by default
            
            // Generate unique slug based on the final name
            $baseSlug = \Illuminate\Support\Str::slug($duplicateName);
            $slug = $baseSlug;
            $slugCounter = 1;
            
            // Check if slug exists (excluding soft-deleted) and increment until unique
            while (Product::where('tenant_id', $originalProduct->tenant_id)
                ->where('slug', $slug)
                ->whereNull('deleted_at')
                ->exists()) {
                $slug = $baseSlug . '-' . $slugCounter;
                $slugCounter++;
            }
            
            $duplicateData['slug'] = $slug;
            
            $newProduct = Product::create($duplicateData);
            $newProduct->load('category');

            return (new ProductResource($newProduct))
                ->response()
                ->setStatusCode(201);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'message' => 'Produk tidak ditemukan'
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Gagal menduplikasi produk',
                'error' => config('app.debug') ? $e->getMessage() : 'Terjadi kesalahan tidak terduga'
            ], 500);
        }
    }

    /**
     * Bulk update products
     */
    public function bulkUpdate(Request $request): JsonResponse
    {
        $request->validate([
            'product_ids' => 'required|array',
            'product_ids.*' => 'required|uuid'
        ]);

        try {
            $productIds = $request->product_ids;
            $updateData = [];

            // Build update data based on provided fields
            if ($request->has('priceUpdate')) {
                $priceUpdate = $request->priceUpdate;
                $updateData['price_mode'] = $priceUpdate['mode'];
                $updateData['price_value'] = $priceUpdate['value'];
            }

            if ($request->has('stockUpdate')) {
                $stockUpdate = $request->stockUpdate;
                $updateData['stock_mode'] = $stockUpdate['mode'];
                $updateData['stock_value'] = $stockUpdate['value'];
            }

            if ($request->has('status')) {
                $updateData['status'] = $request->status;
            }

            if ($request->has('featured')) {
                $updateData['featured'] = $request->boolean('featured');
            }

            if ($request->has('category')) {
                $updateData['category_id'] = $request->category;
            }

            $updated = 0;
            $failed = 0;
            $errors = [];
            $updatedProductIds = [];

            foreach ($productIds as $productId) {
                try {
                    $product = Product::where('uuid', $productId)->firstOrFail();
                    
                    // Apply price updates
                    if (isset($updateData['price_mode']) && isset($updateData['price_value'])) {
                        switch ($updateData['price_mode']) {
                            case 'add':
                                $product->price += $updateData['price_value'];
                                break;
                            case 'subtract':
                                $product->price -= $updateData['price_value'];
                                break;
                            case 'multiply':
                                $product->price *= $updateData['price_value'];
                                break;
                            case 'set':
                                $product->price = $updateData['price_value'];
                                break;
                        }
                    }

                    // Apply stock updates
                    if (isset($updateData['stock_mode']) && isset($updateData['stock_value'])) {
                        switch ($updateData['stock_mode']) {
                            case 'add':
                                $product->stock_quantity += $updateData['stock_value'];
                                break;
                            case 'subtract':
                                $product->stock_quantity -= $updateData['stock_value'];
                                break;
                            case 'set':
                                $product->stock_quantity = $updateData['stock_value'];
                                break;
                        }
                    }

                    // Apply other updates
                    if (isset($updateData['status'])) {
                        $product->status = $updateData['status'];
                    }

                    if (isset($updateData['featured'])) {
                        $product->featured = $updateData['featured'];
                    }

                    if (isset($updateData['category_id'])) {
                        $product->category_id = $updateData['category_id'];
                    }

                    $product->save();
                    $updated++;
                    $updatedProductIds[] = $productId;

                } catch (\Exception $e) {
                    $failed++;
                    $errors[] = [
                        'product_id' => $productId,
                        'error' => $e->getMessage()
                    ];
                }
            }

            // Broadcast bulk update event if any products were updated
            if (!empty($updatedProductIds)) {
                event(new ProductBulkUpdated(
                    $updatedProductIds,
                    auth()->user()->tenant_id ?? null,
                    auth()->id(),
                    auth()->user()->name ?? null
                ));
            }

            return response()->json([
                'updated' => $updated,
                'failed' => $failed,
                'errors' => $errors
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Gagal melakukan bulk update',
                'error' => config('app.debug') ? $e->getMessage() : 'Terjadi kesalahan tidak terduga'
            ], 500);
        }
    }

    /**
     * Reorder products
     */
    public function reorder(Request $request): JsonResponse
    {
        $request->validate([
            'order' => 'required|array',
            'order.*.id' => 'required|uuid',
            'order.*.position' => 'required|integer|min:0'
        ]);

        try {
            $orderData = $request->order;
            
            foreach ($orderData as $item) {
                Product::where('uuid', $item['id'])
                    ->update(['sort_order' => $item['position']]);
            }

            return response()->json([
                'message' => 'Urutan produk berhasil diperbarui',
                'updated' => count($orderData)
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Gagal mengubah urutan produk',
                'error' => config('app.debug') ? $e->getMessage() : 'Terjadi kesalahan tidak terduga'
            ], 500);
        }
    }
}