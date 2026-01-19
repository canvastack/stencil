<?php

namespace Plugins\PagesEngine\Http\Controllers\Public;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Plugins\PagesEngine\Application\UseCases\Content\GetContentUseCase;
use Plugins\PagesEngine\Application\UseCases\Content\ListContentsUseCase;
use Plugins\PagesEngine\Application\UseCases\Content\SearchContentsUseCase;
use Plugins\PagesEngine\Http\Resources\ContentResource;
use Plugins\PagesEngine\Http\Resources\ContentListResource;

class ContentController extends Controller
{
    public function __construct(
        private readonly GetContentUseCase $getUseCase,
        private readonly ListContentsUseCase $listUseCase,
        private readonly SearchContentsUseCase $searchUseCase
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        $filters = [
            'status' => 'published',
            'content_type_uuid' => $request->input('content_type'),
            'category_uuid' => $request->input('category'),
            'tag_uuid' => $request->input('tag'),
            'sort_by' => $request->input('sort_by', 'published_at'),
            'sort_order' => $request->input('sort_order', 'desc'),
            'page' => $request->input('page', 1),
            'per_page' => min($request->input('per_page', 15), 100),
        ];
        
        $result = $this->listUseCase->execute($filters);
        
        return response()->json([
            'success' => true,
            'data' => ContentListResource::collection($result['data']),
            'meta' => $result['meta'],
        ]);
    }

    public function show(string $slug): JsonResponse
    {
        $content = $this->getUseCase->executeBySlug($slug);
        
        if (!$content || $content->status !== 'published') {
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'CONTENT_NOT_FOUND',
                    'message' => 'Content not found',
                ],
            ], 404);
        }
        
        return response()->json([
            'success' => true,
            'data' => new ContentResource($content),
        ]);
    }

    public function search(Request $request): JsonResponse
    {
        $request->validate([
            'q' => 'required|string|min:2',
        ]);
        
        $filters = [
            'query' => $request->input('q'),
            'content_type_uuid' => $request->input('content_type'),
            'category_uuid' => $request->input('category'),
            'page' => $request->input('page', 1),
            'per_page' => min($request->input('per_page', 15), 100),
        ];
        
        $result = $this->searchUseCase->execute($filters);
        
        return response()->json([
            'success' => true,
            'data' => ContentListResource::collection($result['data']),
            'meta' => array_merge($result['meta'], [
                'query' => $request->input('q'),
            ]),
        ]);
    }

    public function byCategory(Request $request, string $categorySlug): JsonResponse
    {
        $filters = [
            'status' => 'published',
            'category_slug' => $categorySlug,
            'content_type_uuid' => $request->input('content_type'),
            'sort_by' => $request->input('sort_by', 'published_at'),
            'sort_order' => $request->input('sort_order', 'desc'),
            'page' => $request->input('page', 1),
            'per_page' => min($request->input('per_page', 15), 100),
        ];
        
        $result = $this->listUseCase->execute($filters);
        
        return response()->json([
            'success' => true,
            'data' => ContentListResource::collection($result['data']),
            'meta' => $result['meta'],
        ]);
    }

    public function byTag(Request $request, string $tagSlug): JsonResponse
    {
        $filters = [
            'status' => 'published',
            'tag_slug' => $tagSlug,
            'content_type_uuid' => $request->input('content_type'),
            'sort_by' => $request->input('sort_by', 'published_at'),
            'sort_order' => $request->input('sort_order', 'desc'),
            'page' => $request->input('page', 1),
            'per_page' => min($request->input('per_page', 15), 100),
        ];
        
        $result = $this->listUseCase->execute($filters);
        
        return response()->json([
            'success' => true,
            'data' => ContentListResource::collection($result['data']),
            'meta' => $result['meta'],
        ]);
    }

    public function byType(Request $request, string $contentTypeSlug): JsonResponse
    {
        $filters = [
            'status' => 'published',
            'content_type_slug' => $contentTypeSlug,
            'category_uuid' => $request->input('category'),
            'sort_by' => $request->input('sort_by', 'published_at'),
            'sort_order' => $request->input('sort_order', 'desc'),
            'page' => $request->input('page', 1),
            'per_page' => min($request->input('per_page', 15), 100),
        ];
        
        $result = $this->listUseCase->execute($filters);
        
        return response()->json([
            'success' => true,
            'data' => ContentListResource::collection($result['data']),
            'meta' => $result['meta'],
        ]);
    }
}
