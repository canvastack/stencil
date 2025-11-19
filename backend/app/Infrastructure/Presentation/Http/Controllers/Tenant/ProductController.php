<?php

namespace App\Infrastructure\Presentation\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Infrastructure\Persistence\Eloquent\Models\Product;
use App\Infrastructure\Persistence\Eloquent\Models\ProductCategory;
use App\Infrastructure\Presentation\Http\Requests\Product\StoreProductRequest;
use App\Infrastructure\Presentation\Http\Requests\Product\UpdateProductRequest;
use App\Infrastructure\Presentation\Http\Resources\Product\ProductResource;
use App\Infrastructure\Presentation\Http\Resources\Product\ProductCategoryResource;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;

class ProductController extends Controller
{
    public function __construct()
    {
    }

    /**
     * List all products
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $perPage = $request->get('per_page', 20);
            $query = Product::with('category');

            if ($request->filled('search')) {
                $query->where(function ($q) use ($request) {
                    $q->where('name', 'ILIKE', '%' . $request->search . '%')
                      ->orWhere('description', 'ILIKE', '%' . $request->search . '%')
                      ->orWhere('sku', 'ILIKE', '%' . $request->search . '%');
                });
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

            return ProductResource::collection($products)
                ->response()
                ->setStatusCode(200);

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

            $builder = Product::with('category');

            if ($queryTerm) {
                $builder->where(function ($q) use ($queryTerm) {
                    $q->where('name', 'ILIKE', '%' . $queryTerm . '%')
                      ->orWhere('description', 'ILIKE', '%' . $queryTerm . '%')
                      ->orWhere('sku', 'ILIKE', '%' . $queryTerm . '%');
                });
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
    public function show(Request $request, int $id): JsonResponse
    {
        try {
            $product = Product::with('category', 'variants')->findOrFail($id);
            
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
    public function update(UpdateProductRequest $request, int $id): JsonResponse
    {
        try {
            $product = Product::findOrFail($id);
            $productData = $request->validated();
            
            if ($request->has('name') && $productData['name'] !== $product->name) {
                $slug = Str::slug($productData['name']);
                $originalSlug = $slug;
                $counter = 1;
                while (Product::where('slug', $slug)->where('id', '!=', $id)->exists()) {
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
    public function destroy(Request $request, int $id): JsonResponse
    {
        try {
            $product = Product::findOrFail($id);
            $product->delete();

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
    public function publish(Request $request, int $id): JsonResponse
    {
        try {
            $product = Product::findOrFail($id);
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
    public function unpublish(Request $request, int $id): JsonResponse
    {
        try {
            $product = Product::findOrFail($id);
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
    public function updateStock(Request $request, int $id): JsonResponse
    {
        try {
            $request->validate([
                'stock_quantity' => 'required|integer|min:0',
                'low_stock_threshold' => 'nullable|integer|min:0'
            ]);

            $product = Product::findOrFail($id);
            
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
}