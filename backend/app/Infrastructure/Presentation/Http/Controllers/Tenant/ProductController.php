<?php

namespace App\Infrastructure\Presentation\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Infrastructure\Persistence\Eloquent\ProductEloquentModel;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

class ProductController extends Controller
{
    public function __construct()
    {
        // TODO: Add dependency injection when domain layer is fully implemented
    }

    /**
     * List all products
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'page' => 'integer|min:1',
                'per_page' => 'integer|min:1|max:100',
                'search' => 'string|max:255',
                'category_id' => 'integer|exists:product_categories,id',
                'status' => 'in:draft,published,archived',
                'featured' => 'boolean',
                'in_stock' => 'boolean',
                'material' => 'string|max:100',
                'price_min' => 'numeric|min:0',
                'price_max' => 'numeric|min:0',
                'sort_by' => 'in:name,price,created_at,updated_at',
                'sort_order' => 'in:asc,desc'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Build query filters
            $filters = [];
            if ($request->filled('search')) {
                $filters['search'] = $request->search;
            }
            if ($request->filled('category_id')) {
                $filters['category_id'] = $request->category_id;
            }
            if ($request->filled('status')) {
                $filters['status'] = $request->status;
            }
            if ($request->filled('featured')) {
                $filters['featured'] = $request->boolean('featured');
            }
            if ($request->filled('in_stock')) {
                $filters['in_stock'] = $request->boolean('in_stock');
            }
            if ($request->filled('material')) {
                $filters['material'] = $request->material;
            }
            if ($request->filled('price_min')) {
                $filters['price_min'] = $request->price_min;
            }
            if ($request->filled('price_max')) {
                $filters['price_max'] = $request->price_max;
            }

            $sortBy = $request->get('sort_by', 'created_at');
            $sortOrder = $request->get('sort_order', 'desc');
            $perPage = $request->get('per_page', 20);

            // TODO: Replace with proper repository when domain layer is complete
            $query = ProductEloquentModel::query();

            if (!empty($filters['search'])) {
                $query->where('name', 'LIKE', '%' . $filters['search'] . '%');
            }

            if (!empty($filters['category_id'])) {
                $query->where('category_id', $filters['category_id']);
            }

            if (!empty($filters['status'])) {
                $query->where('status', $filters['status']);
            }

            if (isset($filters['featured'])) {
                $query->where('featured', $filters['featured']);
            }

            if (isset($filters['in_stock'])) {
                $query->where('in_stock', $filters['in_stock']);
            }

            if (!empty($filters['material'])) {
                $query->where('material', $filters['material']);
            }

            if (!empty($filters['price_min'])) {
                $query->where('price', '>=', $filters['price_min']);
            }

            if (!empty($filters['price_max'])) {
                $query->where('price', '<=', $filters['price_max']);
            }

            $products = $query->orderBy($sortBy, $sortOrder)->paginate($perPage);

            return response()->json([
                'data' => $products->items(),
                'pagination' => [
                    'current_page' => $products->currentPage(),
                    'per_page' => $products->perPage(),
                    'total' => $products->total(),
                    'last_page' => $products->lastPage(),
                    'has_more_pages' => $products->hasMorePages(),
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to retrieve products',
                'error' => 'An unexpected error occurred'
            ], 500);
        }
    }

    /**
     * Show a specific product
     */
    public function show(Request $request, int $id): JsonResponse
    {
        try {
            $product = ProductEloquentModel::find($id);
            
            if (!$product) {
                return response()->json([
                    'message' => 'Product not found'
                ], 404);
            }

            return response()->json([
                'data' => $product->toArray()
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to retrieve product',
                'error' => 'An unexpected error occurred'
            ], 500);
        }
    }

    /**
     * Create a new product
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255',
                'description' => 'required|string',
                'long_description' => 'nullable|string',
                'images' => 'nullable|array',
                'images.*' => 'string|url',
                'features' => 'nullable|array',
                'features.*' => 'string|max:255',
                'category_id' => 'required|integer|exists:product_categories,id',
                'subcategory' => 'nullable|string|max:255',
                'tags' => 'nullable|array',
                'tags.*' => 'string|max:100',
                'material' => 'required|string|max:255',
                'price' => 'required|numeric|min:0',
                'currency' => 'string|size:3',
                'price_unit' => 'required|string|max:50',
                'min_order' => 'required|integer|min:1',
                'specifications' => 'nullable|array',
                'customizable' => 'boolean',
                'custom_options' => 'nullable|array',
                'in_stock' => 'boolean',
                'stock_quantity' => 'nullable|integer|min:0',
                'lead_time' => 'required|string|max:100',
                'seo_title' => 'nullable|string|max:255',
                'seo_description' => 'nullable|string|max:500',
                'seo_keywords' => 'nullable|array',
                'seo_keywords.*' => 'string|max:100',
                'status' => 'in:draft,published,archived',
                'featured' => 'boolean',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // For now, create using Eloquent directly until we have the CreateProductUseCase
            $productData = $validator->validated();
            $productData['currency'] = $productData['currency'] ?? 'IDR';
            $productData['status'] = $productData['status'] ?? 'draft';
            $productData['customizable'] = $productData['customizable'] ?? false;
            $productData['in_stock'] = $productData['in_stock'] ?? true;
            $productData['featured'] = $productData['featured'] ?? false;

            $product = ProductEloquentModel::create($productData);

            return response()->json([
                'message' => 'Product created successfully',
                'data' => $product->toArray()
            ], 201);

        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to create product',
                'error' => 'An unexpected error occurred'
            ], 500);
        }
    }

    /**
     * Update an existing product
     */
    public function update(Request $request, int $id): JsonResponse
    {
        try {
            $product = ProductEloquentModel::findOrFail($id);

            $validator = Validator::make($request->all(), [
                'name' => 'string|max:255',
                'description' => 'string',
                'long_description' => 'nullable|string',
                'images' => 'nullable|array',
                'images.*' => 'string|url',
                'features' => 'nullable|array',
                'features.*' => 'string|max:255',
                'category_id' => 'integer|exists:product_categories,id',
                'subcategory' => 'nullable|string|max:255',
                'tags' => 'nullable|array',
                'tags.*' => 'string|max:100',
                'material' => 'string|max:255',
                'price' => 'numeric|min:0',
                'currency' => 'string|size:3',
                'price_unit' => 'string|max:50',
                'min_order' => 'integer|min:1',
                'specifications' => 'nullable|array',
                'customizable' => 'boolean',
                'custom_options' => 'nullable|array',
                'in_stock' => 'boolean',
                'stock_quantity' => 'nullable|integer|min:0',
                'lead_time' => 'string|max:100',
                'seo_title' => 'nullable|string|max:255',
                'seo_description' => 'nullable|string|max:500',
                'seo_keywords' => 'nullable|array',
                'seo_keywords.*' => 'string|max:100',
                'status' => 'in:draft,published,archived',
                'featured' => 'boolean',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $product->update($validator->validated());

            return response()->json([
                'message' => 'Product updated successfully',
                'data' => $product->toArray()
            ]);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'message' => 'Product not found'
            ], 404);
        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to update product',
                'error' => 'An unexpected error occurred'
            ], 500);
        }
    }

    /**
     * Delete a product
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        try {
            $product = ProductEloquentModel::findOrFail($id);
            $product->delete();

            return response()->json([
                'message' => 'Product deleted successfully'
            ]);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'message' => 'Product not found'
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to delete product',
                'error' => 'An unexpected error occurred'
            ], 500);
        }
    }

    /**
     * Publish a product
     */
    public function publish(Request $request, int $id): JsonResponse
    {
        try {
            $product = ProductEloquentModel::findOrFail($id);
            $product->update(['status' => 'published']);

            return response()->json([
                'message' => 'Product published successfully',
                'data' => $product->toArray()
            ]);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'message' => 'Product not found'
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to publish product',
                'error' => 'An unexpected error occurred'
            ], 500);
        }
    }

    /**
     * Unpublish a product
     */
    public function unpublish(Request $request, int $id): JsonResponse
    {
        try {
            $product = ProductEloquentModel::findOrFail($id);
            $product->update(['status' => 'draft']);

            return response()->json([
                'message' => 'Product unpublished successfully',
                'data' => $product->toArray()
            ]);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'message' => 'Product not found'
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to unpublish product',
                'error' => 'An unexpected error occurred'
            ], 500);
        }
    }

    /**
     * Update product stock
     */
    public function updateStock(Request $request, int $id): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'stock_quantity' => 'required|integer|min:0',
                'in_stock' => 'boolean'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $product = ProductEloquentModel::findOrFail($id);
            
            $updateData = $validator->validated();
            if (!isset($updateData['in_stock'])) {
                $updateData['in_stock'] = $updateData['stock_quantity'] > 0;
            }

            $product->update($updateData);

            return response()->json([
                'message' => 'Product stock updated successfully',
                'data' => $product->toArray()
            ]);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'message' => 'Product not found'
            ], 404);
        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to update product stock',
                'error' => 'An unexpected error occurred'
            ], 500);
        }
    }

    /**
     * Get product categories
     */
    public function categories(Request $request): JsonResponse
    {
        try {
            // TODO: Replace with proper repository when domain layer is complete
            return response()->json([
                'message' => 'Categories endpoint not yet fully implemented',
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
     * Get low stock products
     */
    public function lowStock(Request $request): JsonResponse
    {
        try {
            $threshold = $request->get('threshold', 10);
            
            $products = ProductEloquentModel::where('in_stock', true)
                ->where('stock_quantity', '<=', $threshold)
                ->where('stock_quantity', '>', 0)
                ->get();
            
            return response()->json([
                'data' => $products
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to retrieve low stock products',
                'error' => 'An unexpected error occurred'
            ], 500);
        }
    }

    /**
     * Get out of stock products
     */
    public function outOfStock(Request $request): JsonResponse
    {
        try {
            $products = ProductEloquentModel::where('in_stock', false)
                ->orWhere('stock_quantity', '<=', 0)
                ->get();
            
            return response()->json([
                'data' => $products
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to retrieve out of stock products',
                'error' => 'An unexpected error occurred'
            ], 500);
        }
    }

    /**
     * Search products
     */
    public function search(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'q' => 'required|string|min:1|max:255',
                'category_id' => 'integer|exists:product_categories,id',
                'limit' => 'integer|min:1|max:50'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $query = $request->q;
            $categoryId = $request->category_id;
            $limit = $request->get('limit', 20);

            $queryBuilder = ProductEloquentModel::where('name', 'LIKE', "%{$query}%")
                ->orWhere('description', 'LIKE', "%{$query}%");

            if ($categoryId) {
                $queryBuilder->where('category_id', $categoryId);
            }

            $products = $queryBuilder->limit($limit)->get();
            
            return response()->json([
                'data' => $products,
                'query' => $query
            ]);

        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to search products',
                'error' => 'An unexpected error occurred'
            ], 500);
        }
    }
}