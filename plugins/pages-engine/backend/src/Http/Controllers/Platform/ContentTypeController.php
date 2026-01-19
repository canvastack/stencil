<?php

namespace Plugins\PagesEngine\Http\Controllers\Platform;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Plugins\PagesEngine\Application\UseCases\ContentType\CreateContentTypeUseCase;
use Plugins\PagesEngine\Application\UseCases\ContentType\ListContentTypesUseCase;
use Plugins\PagesEngine\Http\Requests\CreateContentTypeRequest;
use Plugins\PagesEngine\Http\Resources\ContentTypeResource;
use Plugins\PagesEngine\Application\Commands\CreateContentTypeCommand;

class ContentTypeController extends Controller
{
    public function __construct(
        private readonly CreateContentTypeUseCase $createUseCase,
        private readonly ListContentTypesUseCase $listUseCase
    ) {
        $this->middleware('auth:sanctum');
    }

    public function index(Request $request): JsonResponse
    {
        $this->authorize('platform.content-types.view');
        
        $scope = 'platform';
        $isActive = $request->has('is_active') ? $request->boolean('is_active') : null;
        
        $result = $this->listUseCase->execute(null, $scope, $isActive);
        
        return response()->json([
            'success' => true,
            'data' => ContentTypeResource::collection($result),
        ]);
    }

    public function store(CreateContentTypeRequest $request): JsonResponse
    {
        $this->authorize('platform.content-types.create');
        
        $command = new CreateContentTypeCommand(
            tenantId: null,
            name: $request->input('name'),
            slug: $request->input('slug'),
            description: $request->input('description'),
            icon: $request->input('icon'),
            defaultUrlPattern: $request->input('default_url_pattern'),
            isCommentable: $request->boolean('is_commentable', false),
            isCategorizable: $request->boolean('is_categorizable', true),
            isTaggable: $request->boolean('is_taggable', true),
            isRevisioned: $request->boolean('is_revisioned', true),
            metadata: $request->input('metadata', [])
        );
        
        $contentType = $this->createUseCase->execute($command);
        
        return response()->json([
            'success' => true,
            'data' => new ContentTypeResource($contentType),
            'message' => 'Platform content type created successfully',
        ], 201);
    }
}
