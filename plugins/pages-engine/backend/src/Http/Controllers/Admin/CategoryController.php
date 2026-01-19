<?php

namespace Plugins\PagesEngine\Http\Controllers\Admin;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Plugins\PagesEngine\Application\UseCases\Category\CreateCategoryUseCase;
use Plugins\PagesEngine\Application\UseCases\Category\UpdateCategoryUseCase;
use Plugins\PagesEngine\Application\UseCases\Category\DeleteCategoryUseCase;
use Plugins\PagesEngine\Application\UseCases\Category\GetCategoryUseCase;
use Plugins\PagesEngine\Application\UseCases\Category\ListCategoriesUseCase;
use Plugins\PagesEngine\Application\UseCases\Category\GetCategoryTreeUseCase;
use Plugins\PagesEngine\Application\UseCases\Category\MoveCategoryUseCase;
use Plugins\PagesEngine\Application\UseCases\Category\ReorderCategoryUseCase;
use Plugins\PagesEngine\Http\Requests\CreateCategoryRequest;
use Plugins\PagesEngine\Http\Requests\UpdateCategoryRequest;
use Plugins\PagesEngine\Http\Resources\CategoryResource;
use Plugins\PagesEngine\Application\Commands\CreateCategoryCommand;
use Plugins\PagesEngine\Application\Commands\UpdateCategoryCommand;
use Plugins\PagesEngine\Application\Commands\DeleteCategoryCommand;
use Plugins\PagesEngine\Application\Commands\MoveCategoryCommand;
use Plugins\PagesEngine\Application\Commands\ReorderCategoryCommand;
use Plugins\PagesEngine\Domain\ValueObjects\Uuid;

class CategoryController extends Controller
{
    public function __construct(
        private readonly CreateCategoryUseCase $createUseCase,
        private readonly UpdateCategoryUseCase $updateUseCase,
        private readonly DeleteCategoryUseCase $deleteUseCase,
        private readonly GetCategoryUseCase $getUseCase,
        private readonly ListCategoriesUseCase $listUseCase,
        private readonly GetCategoryTreeUseCase $getTreeUseCase,
        private readonly MoveCategoryUseCase $moveUseCase,
        private readonly ReorderCategoryUseCase $reorderUseCase
    ) {
        $this->middleware(['auth:sanctum', 'tenant.context']);
    }

    public function index(Request $request): JsonResponse
    {
        $this->authorize('pages:categories:view');
        
        $filters = [
            'tenant_id' => auth()->user()->tenant_id,
            'content_type_uuid' => $request->input('content_type'),
            'parent_uuid' => $request->input('parent'),
            'search' => $request->input('search'),
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

    public function tree(Request $request, ?string $contentTypeUuid = null): JsonResponse
    {
        $this->authorize('pages:categories:view');
        
        $tree = $this->getTreeUseCase->execute(auth()->user()->tenant_id, $contentTypeUuid);
        
        return response()->json([
            'success' => true,
            'data' => CategoryResource::collection($tree),
        ]);
    }

    public function show(string $uuid): JsonResponse
    {
        $this->authorize('pages:categories:view');
        
        $category = $this->getUseCase->execute($uuid, auth()->user()->tenant_id);
        
        if (!$category) {
            return response()->json([
                'success' => false,
                'error' => ['code' => 'CATEGORY_NOT_FOUND', 'message' => 'Category not found'],
            ], 404);
        }
        
        return response()->json([
            'success' => true,
            'data' => new CategoryResource($category),
        ]);
    }

    public function store(CreateCategoryRequest $request): JsonResponse
    {
        $this->authorize('pages:categories:create');
        
        $parentId = $request->input('parent_uuid') 
            ? new Uuid($request->input('parent_uuid')) 
            : null;
        
        $command = new CreateCategoryCommand(
            tenantId: auth()->user()->tenant_id,
            contentTypeId: new Uuid($request->input('content_type_uuid')),
            name: $request->input('name'),
            slug: $request->input('slug'),
            parentId: $parentId,
            description: $request->input('description'),
            seoTitle: $request->input('seo_title'),
            seoDescription: $request->input('seo_description'),
            metadata: $request->input('metadata', [])
        );
        
        $category = $this->createUseCase->execute($command);
        
        return response()->json([
            'success' => true,
            'data' => new CategoryResource($category),
            'message' => 'Category created successfully',
        ], 201);
    }

    public function update(UpdateCategoryRequest $request, string $uuid): JsonResponse
    {
        $this->authorize('pages:categories:update');
        
        $command = new UpdateCategoryCommand(
            categoryId: new Uuid($uuid),
            tenantId: auth()->user()->tenant_id,
            name: $request->input('name'),
            slug: $request->input('slug'),
            description: $request->input('description'),
            seoTitle: $request->input('seo_title'),
            seoDescription: $request->input('seo_description'),
            metadata: $request->input('metadata')
        );
        
        $category = $this->updateUseCase->execute($command);
        
        return response()->json([
            'success' => true,
            'data' => new CategoryResource($category),
            'message' => 'Category updated successfully',
        ]);
    }

    public function destroy(string $uuid): JsonResponse
    {
        $this->authorize('pages:categories:delete');
        
        $command = new DeleteCategoryCommand(
            categoryId: new Uuid($uuid),
            tenantId: auth()->user()->tenant_id
        );
        
        $this->deleteUseCase->execute($command);
        
        return response()->json([
            'success' => true,
            'message' => 'Category deleted successfully',
        ], 204);
    }

    public function move(Request $request, string $uuid): JsonResponse
    {
        $this->authorize('pages:categories:update');
        
        $request->validate(['parent_uuid' => 'nullable|uuid']);
        
        $newParentId = $request->input('parent_uuid') 
            ? new Uuid($request->input('parent_uuid')) 
            : null;
        
        $command = new MoveCategoryCommand(
            categoryId: new Uuid($uuid),
            tenantId: auth()->user()->tenant_id,
            newParentId: $newParentId
        );
        
        $category = $this->moveUseCase->execute($command);
        
        return response()->json([
            'success' => true,
            'data' => new CategoryResource($category),
            'message' => 'Category moved successfully',
        ]);
    }

    public function reorder(Request $request): JsonResponse
    {
        $this->authorize('pages:categories:reorder');
        
        $request->validate([
            'order' => 'required|array',
            'order.*.uuid' => 'required|uuid',
            'order.*.sort_order' => 'required|integer|min:0'
        ]);
        
        $command = new ReorderCategoryCommand(
            tenantId: auth()->user()->tenant_id,
            categoryOrders: $request->input('order')
        );
        
        $this->reorderUseCase->execute($command);
        
        return response()->json([
            'success' => true,
            'message' => 'Categories reordered successfully',
        ]);
    }
}
