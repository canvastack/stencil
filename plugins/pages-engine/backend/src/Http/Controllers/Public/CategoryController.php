<?php

namespace Plugins\PagesEngine\Http\Controllers\Public;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Plugins\PagesEngine\Application\UseCases\Category\ListCategoriesUseCase;
use Plugins\PagesEngine\Application\UseCases\Category\GetCategoryUseCase;
use Plugins\PagesEngine\Application\UseCases\Category\GetCategoryTreeUseCase;
use Plugins\PagesEngine\Http\Resources\CategoryResource;

class CategoryController extends Controller
{
    public function __construct(
        private readonly ListCategoriesUseCase $listUseCase,
        private readonly GetCategoryUseCase $getUseCase,
        private readonly GetCategoryTreeUseCase $getTreeUseCase
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        $filters = [
            'content_type_uuid' => $request->input('content_type'),
            'is_active' => true,
            'page' => $request->input('page', 1),
            'per_page' => min($request->input('per_page', 50), 100),
        ];
        
        $result = $this->listUseCase->execute($filters);
        
        return response()->json([
            'success' => true,
            'data' => CategoryResource::collection($result['data']),
            'meta' => $result['meta'],
        ]);
    }

    public function tree(Request $request): JsonResponse
    {
        $contentTypeUuid = $request->input('content_type');
        $tree = $this->getTreeUseCase->execute($contentTypeUuid);
        
        return response()->json([
            'success' => true,
            'data' => CategoryResource::collection($tree),
        ]);
    }

    public function show(string $slug): JsonResponse
    {
        $category = $this->getUseCase->executeBySlug($slug);
        
        if (!$category) {
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'CATEGORY_NOT_FOUND',
                    'message' => 'Category not found',
                ],
            ], 404);
        }
        
        return response()->json([
            'success' => true,
            'data' => new CategoryResource($category),
        ]);
    }
}
