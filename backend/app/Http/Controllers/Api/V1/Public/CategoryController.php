<?php

namespace App\Http\Controllers\Api\V1\Public;

use App\Http\Controllers\Controller;
use App\Infrastructure\Persistence\Eloquent\Models\ProductCategory;
use App\Infrastructure\Presentation\Http\Resources\Product\ProductCategoryResource;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class CategoryController extends Controller
{
    /**
     * List all public product categories
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = ProductCategory::with('children')
                ->where('is_active', true);

            if ($request->filled('parent_id')) {
                $query->where('parent_id', $request->parent_id);
            }

            if ($request->boolean('root_only', false)) {
                $query->whereNull('parent_id');
            }

            if ($request->filled('is_featured')) {
                $query->where('is_featured', $request->boolean('is_featured'));
            }

            if ($request->filled('search')) {
                $search = $request->get('search');
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('description', 'like', "%{$search}%");
                });
            }

            $sortBy = $request->get('sort', 'sort_order');
            $sortOrder = $request->get('order', 'asc');
            
            // Map frontend sort keys to database columns
            $sortMap = [
                'name' => 'name',
                'created_at' => 'created_at',
                'sort_order' => 'sort_order'
            ];
            
            $dbSortBy = $sortMap[$sortBy] ?? 'sort_order';
            $query->orderBy($dbSortBy, $sortOrder);

            if ($request->has('per_page')) {
                $categories = $query->paginate($request->get('per_page', 20));
                
                return response()->json([
                    'data' => ProductCategoryResource::collection($categories->items()),
                    'current_page' => $categories->currentPage(),
                    'per_page' => $categories->perPage(),
                    'total' => $categories->total(),
                    'last_page' => $categories->lastPage(),
                ]);
            }

            $categories = $query->get();
            
            return response()->json([
                'data' => ProductCategoryResource::collection($categories),
                'current_page' => 1,
                'per_page' => $categories->count(),
                'total' => $categories->count(),
                'last_page' => 1,
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch categories',
                'error' => config('app.debug') ? $e->getMessage() : 'An unexpected error occurred'
            ], 500);
        }
    }

    /**
     * Show a specific category by ID
     */
    public function show(Request $request, int $id): JsonResponse
    {
        try {
            $category = ProductCategory::with(['children', 'parent'])
                ->where('is_active', true)
                ->findOrFail($id);

            return (new ProductCategoryResource($category))
                ->response()
                ->setStatusCode(200);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'message' => 'Category not found'
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch category',
                'error' => config('app.debug') ? $e->getMessage() : 'An unexpected error occurred'
            ], 500);
        }
    }

    /**
     * Show a specific category by slug
     */
    public function showBySlug(Request $request, string $slug): JsonResponse
    {
        try {
            $category = ProductCategory::with(['children', 'parent'])
                ->where('slug', $slug)
                ->where('is_active', true)
                ->firstOrFail();

            return (new ProductCategoryResource($category))
                ->response()
                ->setStatusCode(200);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'message' => 'Category not found'
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch category',
                'error' => config('app.debug') ? $e->getMessage() : 'An unexpected error occurred'
            ], 500);
        }
    }

    /**
     * Get category hierarchy (tree structure)
     */
    public function tree(Request $request): JsonResponse
    {
        try {
            $query = ProductCategory::with('descendants')
                ->where('is_active', true)
                ->whereNull('parent_id')
                ->orderBy('sort_order', 'asc');
                
            $tree = $query->get();

            return response()->json([
                'data' => ProductCategoryResource::collection($tree),
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch category tree',
                'error' => config('app.debug') ? $e->getMessage() : 'An unexpected error occurred'
            ], 500);
        }
    }

    /**
     * Get products in a specific category
     */
    public function products(Request $request, int $categoryId): JsonResponse
    {
        try {
            $category = ProductCategory::where('is_active', true)->findOrFail($categoryId);
            
            $products = $category->products()
                ->where('is_active', true)
                ->where('status', 'published')
                ->with(['images', 'categories'])
                ->paginate($request->get('per_page', 20));

            return response()->json([
                'data' => $products->items(),
                'current_page' => $products->currentPage(),
                'per_page' => $products->perPage(),
                'total' => $products->total(),
                'last_page' => $products->lastPage(),
                'category' => new ProductCategoryResource($category),
            ]);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'message' => 'Category not found'
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch category products',
                'error' => config('app.debug') ? $e->getMessage() : 'An unexpected error occurred'
            ], 500);
        }
    }
}