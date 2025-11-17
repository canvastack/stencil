<?php

namespace App\Infrastructure\Presentation\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Infrastructure\Persistence\Eloquent\ProductEloquentModel;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

class ProductCategoryController extends Controller
{
    public function __construct()
    {
        // TODO: Add dependency injection when domain layer is fully implemented
    }

    /**
     * List all product categories
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'parent_id' => 'nullable|integer|exists:product_categories,id',
                'active_only' => 'boolean',
                'with_products' => 'boolean',
                'sort_by' => 'in:name,order,created_at',
                'sort_order' => 'in:asc,desc'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $parentId = $request->parent_id;
            $activeOnly = $request->boolean('active_only', true);
            $withProducts = $request->boolean('with_products', false);
            $sortBy = $request->get('sort_by', 'order');
            $sortOrder = $request->get('sort_order', 'asc');

            // TODO: Replace with proper repository when domain layer is complete
            return response()->json([
                'message' => 'Product categories listing not yet fully implemented',
                'data' => []
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to retrieve categories',
                'error' => 'An unexpected error occurred'
            ], 500);
        }
    }

    /**
     * Show a specific category
     */
    public function show(Request $request, int $id): JsonResponse
    {
        try {
            // TODO: Replace with proper repository when domain layer is complete
            return response()->json([
                'message' => 'Product category show not yet fully implemented',
                'data' => null
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to retrieve category',
                'error' => 'An unexpected error occurred'
            ], 500);
        }
    }

    /**
     * Create a new product category
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255',
                'description' => 'nullable|string',
                'parent_id' => 'nullable|integer|exists:product_categories,id',
                'image' => 'nullable|string|url',
                'order' => 'integer|min:0',
                'is_active' => 'boolean'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // TODO: Replace with proper use case when domain layer is complete
            return response()->json([
                'message' => 'Product category creation not yet fully implemented',
                'data' => null
            ], 201);

        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to create category',
                'error' => 'An unexpected error occurred'
            ], 500);
        }
    }

    /**
     * Update an existing category
     */
    public function update(Request $request, int $id): JsonResponse
    {
        try {
            $category = ProductCategoryEloquentModel::findOrFail($id);

            $validator = Validator::make($request->all(), [
                'name' => 'string|max:255',
                'description' => 'nullable|string',
                'parent_id' => 'nullable|integer|exists:product_categories,id',
                'image' => 'nullable|string|url',
                'order' => 'integer|min:0',
                'is_active' => 'boolean'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Validate parent relationship to prevent circular references
            if ($request->filled('parent_id') && $request->parent_id !== null) {
                $parentId = $request->parent_id;
                
                // Check if trying to set self as parent
                if ($parentId == $id) {
                    return response()->json([
                        'message' => 'Cannot set category as its own parent',
                        'errors' => ['parent_id' => ['Invalid parent category']]
                    ], 422);
                }

                // Check if parent is a descendant (would create circular reference)
                $descendants = $this->categoryRepository->getDescendants($id);
                if (in_array($parentId, $descendants)) {
                    return response()->json([
                        'message' => 'Cannot set descendant as parent',
                        'errors' => ['parent_id' => ['Invalid parent category']]
                    ], 422);
                }
            }

            $category->update($validator->validated());

            return response()->json([
                'message' => 'Category updated successfully',
                'data' => $category->toArray()
            ]);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'message' => 'Category not found'
            ], 404);
        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to update category',
                'error' => 'An unexpected error occurred'
            ], 500);
        }
    }

    /**
     * Delete a category
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        try {
            $category = ProductCategoryEloquentModel::findOrFail($id);
            
            // Check if category has products
            $productsCount = $this->categoryRepository->getProductsCount($id);
            if ($productsCount > 0) {
                return response()->json([
                    'message' => 'Cannot delete category with existing products',
                    'error' => 'Category contains products'
                ], 409);
            }

            // Check if category has children
            $children = $this->categoryRepository->findByParent($id, false);
            if (!empty($children)) {
                return response()->json([
                    'message' => 'Cannot delete category with subcategories',
                    'error' => 'Category has subcategories'
                ], 409);
            }

            $category->delete();

            return response()->json([
                'message' => 'Category deleted successfully'
            ]);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'message' => 'Category not found'
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to delete category',
                'error' => 'An unexpected error occurred'
            ], 500);
        }
    }

    /**
     * Get category hierarchy (tree structure)
     */
    public function tree(Request $request): JsonResponse
    {
        try {
            $activeOnly = $request->boolean('active_only', true);
            $withProducts = $request->boolean('with_products', false);
            
            $tree = $this->categoryRepository->getHierarchy($activeOnly);

            if ($withProducts) {
                $this->addProductsCount($tree);
            }

            return response()->json([
                'data' => $tree
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to retrieve category tree',
                'error' => 'An unexpected error occurred'
            ], 500);
        }
    }

    /**
     * Get products for a specific category
     */
    public function products(Request $request, int $categoryId): JsonResponse
    {
        try {
            $category = $this->categoryRepository->findById($categoryId);
            
            if (!$category) {
                return response()->json([
                    'message' => 'Category not found'
                ], 404);
            }

            $validator = Validator::make($request->all(), [
                'page' => 'integer|min:1',
                'per_page' => 'integer|min:1|max:100',
                'include_subcategories' => 'boolean',
                'status' => 'in:draft,published,archived',
                'sort_by' => 'in:name,price,created_at',
                'sort_order' => 'in:asc,desc'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $includeSubcategories = $request->boolean('include_subcategories', false);
            $status = $request->get('status', 'published');
            $sortBy = $request->get('sort_by', 'name');
            $sortOrder = $request->get('sort_order', 'asc');
            $perPage = $request->get('per_page', 20);

            $products = $this->categoryRepository->getProducts(
                $categoryId,
                $includeSubcategories,
                $status,
                $sortBy,
                $sortOrder,
                $perPage
            );

            return response()->json([
                'data' => $products->items(),
                'category' => $category->toArray(),
                'pagination' => [
                    'current_page' => $products->currentPage(),
                    'per_page' => $products->perPage(),
                    'total' => $products->total(),
                    'last_page' => $products->lastPage(),
                    'has_more_pages' => $products->hasMorePages(),
                ]
            ]);

        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to retrieve category products',
                'error' => 'An unexpected error occurred'
            ], 500);
        }
    }

    /**
     * Reorder categories
     */
    public function reorder(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'categories' => 'required|array',
                'categories.*.id' => 'required|integer|exists:product_categories,id',
                'categories.*.order' => 'required|integer|min:0'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $categories = $request->categories;
            
            foreach ($categories as $categoryData) {
                ProductCategoryEloquentModel::where('id', $categoryData['id'])
                    ->update(['order' => $categoryData['order']]);
            }

            return response()->json([
                'message' => 'Categories reordered successfully'
            ]);

        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to reorder categories',
                'error' => 'An unexpected error occurred'
            ], 500);
        }
    }

    /**
     * Add products count to category tree recursively
     */
    private function addProductsCount(array &$categories): void
    {
        foreach ($categories as &$category) {
            $category['products_count'] = $this->categoryRepository->getProductsCount($category['id']);
            
            if (!empty($category['children'])) {
                $this->addProductsCount($category['children']);
            }
        }
    }
}