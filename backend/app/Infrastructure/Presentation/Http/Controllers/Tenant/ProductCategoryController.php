<?php

namespace App\Infrastructure\Presentation\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Infrastructure\Persistence\Eloquent\Models\ProductCategory;
use App\Infrastructure\Presentation\Http\Requests\Product\StoreProductCategoryRequest;
use App\Infrastructure\Presentation\Http\Requests\Product\UpdateProductCategoryRequest;
use App\Infrastructure\Presentation\Http\Resources\Product\ProductCategoryResource;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;

class ProductCategoryController extends Controller
{
    public function __construct()
    {
    }

    /**
     * List all product categories
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = ProductCategory::with('children');

            if ($request->filled('parent_id')) {
                $query->where('parent_id', $request->parent_id);
            }

            if ($request->boolean('active_only', false)) {
                $query->where('is_active', true);
            }

            if ($request->boolean('root_only', false)) {
                $query->whereNull('parent_id');
            }

            if ($request->filled('is_featured')) {
                $query->where('is_featured', $request->boolean('is_featured'));
            }

            $sortBy = $request->get('sort_by', 'sort_order');
            $sortOrder = $request->get('sort_order', 'asc');
            $query->orderBy($sortBy, $sortOrder);

            if ($request->has('per_page')) {
                $categories = $query->paginate($request->get('per_page', 20));
                return ProductCategoryResource::collection($categories)
                    ->response()
                    ->setStatusCode(200);
            }

            $categories = $query->get();
            return ProductCategoryResource::collection($categories)
                ->response()
                ->setStatusCode(200);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Gagal mengambil daftar kategori produk',
                'error' => config('app.debug') ? $e->getMessage() : 'Terjadi kesalahan tidak terduga'
            ], 500);
        }
    }

    /**
     * Show a specific category
     */
    public function show(Request $request, int $id): JsonResponse
    {
        try {
            $category = ProductCategory::with(['children', 'parent'])->findOrFail($id);

            return (new ProductCategoryResource($category))
                ->response()
                ->setStatusCode(200);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'message' => 'Kategori produk tidak ditemukan'
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Gagal mengambil detail kategori produk',
                'error' => config('app.debug') ? $e->getMessage() : 'Terjadi kesalahan tidak terduga'
            ], 500);
        }
    }

    /**
     * Create a new product category
     */
    public function store(StoreProductCategoryRequest $request): JsonResponse
    {
        try {
            $categoryData = $request->validated();
            
            if (empty($categoryData['slug']) && !empty($categoryData['name'])) {
                $categoryData['slug'] = Str::slug($categoryData['name']);
                
                $originalSlug = $categoryData['slug'];
                $counter = 1;
                while (ProductCategory::where('slug', $categoryData['slug'])->exists()) {
                    $categoryData['slug'] = $originalSlug . '-' . $counter;
                    $counter++;
                }
            }

            $category = ProductCategory::create($categoryData);
            $category->load(['children', 'parent']);

            return (new ProductCategoryResource($category))
                ->response()
                ->setStatusCode(201);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Gagal membuat kategori produk',
                'error' => config('app.debug') ? $e->getMessage() : 'Terjadi kesalahan tidak terduga'
            ], 500);
        }
    }

    /**
     * Update an existing category
     */
    public function update(UpdateProductCategoryRequest $request, int $id): JsonResponse
    {
        try {
            $category = ProductCategory::findOrFail($id);
            $categoryData = $request->validated();
            
            if ($request->filled('parent_id') && $request->parent_id !== null) {
                if ($request->parent_id == $id) {
                    return response()->json([
                        'message' => 'Kategori tidak dapat menjadi induk dari dirinya sendiri',
                        'errors' => ['parent_id' => ['ID induk tidak valid']]
                    ], 422);
                }

                $descendants = $this->getDescendantIds($category);
                if (in_array($request->parent_id, $descendants)) {
                    return response()->json([
                        'message' => 'Kategori turunan tidak dapat menjadi induk',
                        'errors' => ['parent_id' => ['ID induk tidak valid - referensi melingkar']]
                    ], 422);
                }
            }

            if ($request->has('name') && $categoryData['name'] !== $category->name) {
                $slug = Str::slug($categoryData['name']);
                $originalSlug = $slug;
                $counter = 1;
                while (ProductCategory::where('slug', $slug)->where('id', '!=', $id)->exists()) {
                    $slug = $originalSlug . '-' . $counter;
                    $counter++;
                }
                $categoryData['slug'] = $slug;
            }

            $category->update($categoryData);
            $category->load(['children', 'parent']);

            return (new ProductCategoryResource($category))
                ->response()
                ->setStatusCode(200);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'message' => 'Kategori produk tidak ditemukan'
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Gagal memperbarui kategori produk',
                'error' => config('app.debug') ? $e->getMessage() : 'Terjadi kesalahan tidak terduga'
            ], 500);
        }
    }

    /**
     * Delete a category
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        try {
            $category = ProductCategory::findOrFail($id);
            
            if ($category->hasProducts()) {
                return response()->json([
                    'message' => 'Tidak dapat menghapus kategori yang memiliki produk',
                    'error' => 'Kategori memiliki produk'
                ], 409);
            }

            if ($category->hasChildren()) {
                return response()->json([
                    'message' => 'Tidak dapat menghapus kategori yang memiliki sub-kategori',
                    'error' => 'Kategori memiliki sub-kategori'
                ], 409);
            }

            $category->delete();

            return response()->json([
                'message' => 'Kategori produk berhasil dihapus'
            ], 200);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'message' => 'Kategori produk tidak ditemukan'
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Gagal menghapus kategori produk',
                'error' => config('app.debug') ? $e->getMessage() : 'Terjadi kesalahan tidak terduga'
            ], 500);
        }
    }

    private function getDescendantIds(ProductCategory $category): array
    {
        $ids = [];
        $children = $category->children;
        
        foreach ($children as $child) {
            $ids[] = $child->id;
            $ids = array_merge($ids, $this->getDescendantIds($child));
        }
        
        return $ids;
    }

    /**
     * Get category hierarchy (tree structure)
     */
    public function tree(Request $request): JsonResponse
    {
        try {
            $query = ProductCategory::with('descendants');

            if ($request->boolean('active_only', false)) {
                $query->where('is_active', true);
            }

            $query->whereNull('parent_id')->ordered();
            $tree = $query->get();

            return ProductCategoryResource::collection($tree)
                ->response()
                ->setStatusCode(200);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Gagal mengambil hierarki kategori produk',
                'error' => config('app.debug') ? $e->getMessage() : 'Terjadi kesalahan tidak terduga'
            ], 500);
        }
    }

    /**
     * Reorder categories
     */
    public function reorder(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'categories' => 'required|array',
                'categories.*.id' => 'required|integer|exists:product_categories,id',
                'categories.*.sort_order' => 'required|integer|min:0'
            ]);

            foreach ($request->categories as $categoryData) {
                ProductCategory::where('id', $categoryData['id'])
                    ->update(['sort_order' => $categoryData['sort_order']]);
            }

            return response()->json([
                'message' => 'Urutan kategori berhasil diperbarui'
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Gagal memperbarui urutan kategori',
                'error' => config('app.debug') ? $e->getMessage() : 'Terjadi kesalahan tidak terduga'
            ], 500);
        }
    }
}