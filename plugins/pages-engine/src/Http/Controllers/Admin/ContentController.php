<?php

namespace Plugins\PagesEngine\Http\Controllers\Admin;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Plugins\PagesEngine\Application\UseCases\Content\CreateContentUseCase;
use Plugins\PagesEngine\Application\UseCases\Content\UpdateContentUseCase;
use Plugins\PagesEngine\Application\UseCases\Content\DeleteContentUseCase;
use Plugins\PagesEngine\Application\UseCases\Content\GetContentUseCase;
use Plugins\PagesEngine\Application\UseCases\Content\ListContentsUseCase;
use Plugins\PagesEngine\Application\UseCases\Content\PublishContentUseCase;
use Plugins\PagesEngine\Application\UseCases\Content\UnpublishContentUseCase;
use Plugins\PagesEngine\Application\UseCases\Content\ScheduleContentUseCase;
use Plugins\PagesEngine\Application\UseCases\Content\ArchiveContentUseCase;
use Plugins\PagesEngine\Http\Requests\CreateContentRequest;
use Plugins\PagesEngine\Application\Commands\CreateContentCommand;
use Plugins\PagesEngine\Application\Commands\UpdateContentCommand;
use Plugins\PagesEngine\Application\Commands\PublishContentCommand;
use Plugins\PagesEngine\Application\Commands\UnpublishContentCommand;
use Plugins\PagesEngine\Application\Commands\ScheduleContentCommand;
use Plugins\PagesEngine\Application\Commands\ArchiveContentCommand;
use Plugins\PagesEngine\Http\Resources\ContentResource;
use Plugins\PagesEngine\Http\Resources\ContentListResource;

class ContentController extends Controller
{
    public function __construct(
        private readonly CreateContentUseCase $createUseCase,
        private readonly UpdateContentUseCase $updateUseCase,
        private readonly DeleteContentUseCase $deleteUseCase,
        private readonly GetContentUseCase $getUseCase,
        private readonly ListContentsUseCase $listUseCase,
        private readonly PublishContentUseCase $publishUseCase,
        private readonly UnpublishContentUseCase $unpublishUseCase,
        private readonly ScheduleContentUseCase $scheduleUseCase,
        private readonly ArchiveContentUseCase $archiveUseCase
    ) {
        $this->middleware(['auth:sanctum', 'tenant.context']);
    }

    public function index(Request $request): JsonResponse
    {
        $this->authorize('pages:contents:view');
        
        $filters = [
            'tenant_id' => auth()->user()->tenant->uuid,
            'content_type_uuid' => $request->input('content_type'),
            'category_uuid' => $request->input('category'),
            'status' => $request->input('status'),
            'author_id' => $request->input('author'),
            'search' => $request->input('search'),
            'date_from' => $request->input('date_from'),
            'date_to' => $request->input('date_to'),
            'sort_by' => $request->input('sort_by', 'created_at'),
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

    public function show(string $uuid): JsonResponse
    {
        $this->authorize('pages:contents:view');
        
        $content = \Plugins\PagesEngine\Infrastructure\Persistence\Eloquent\ContentEloquentModel::with(['contentType', 'author', 'categories', 'tags'])
            ->where('uuid', $uuid)
            ->where('tenant_id', auth()->user()->tenant->uuid)
            ->first();
        
        if (!$content) {
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'CONTENT_NOT_FOUND',
                    'message' => 'Content not found',
                    'details' => ['uuid' => $uuid],
                ],
            ], 404);
        }
        
        return response()->json([
            'success' => true,
            'data' => new ContentResource($content),
        ]);
    }

    public function store(CreateContentRequest $request): JsonResponse
    {
        $this->authorize('pages:contents:create');
        
        $command = new CreateContentCommand(
            tenantId: new \Plugins\PagesEngine\Domain\ValueObjects\Uuid(auth()->user()->tenant->uuid),
            contentTypeId: new \Plugins\PagesEngine\Domain\ValueObjects\Uuid($request->input('content_type_uuid')),
            authorId: new \Plugins\PagesEngine\Domain\ValueObjects\Uuid(auth()->id()),
            title: $request->input('title'),
            slug: $request->input('slug'),
            content: $request->input('content'),
            contentFormat: $request->input('editor_format', 'wysiwyg'),
            excerpt: $request->input('excerpt'),
            featuredImageId: $request->input('featured_image') 
                ? new \Plugins\PagesEngine\Domain\ValueObjects\Uuid($request->input('featured_image')) 
                : null,
            customUrl: $request->input('custom_url'),
            isCommentable: $request->input('is_commentable'),
            seoTitle: $request->input('seo_title'),
            seoDescription: $request->input('seo_description'),
            seoKeywords: $request->input('seo_keywords', []),
            metadata: $request->input('metadata', [])
        );
        
        $content = $this->createUseCase->execute($command);
        
        $contentModel = \Plugins\PagesEngine\Infrastructure\Persistence\Eloquent\ContentEloquentModel::where('uuid', $content->uuid)->first();
        if ($contentModel) {
            if ($request->has('categories')) {
                $contentModel->categories()->sync($request->input('categories', []));
            }
            if ($request->has('tags')) {
                $contentModel->tags()->sync($request->input('tags', []));
            }
        }
        
        return response()->json([
            'success' => true,
            'data' => new ContentResource($contentModel),
            'message' => 'Content created successfully',
        ], 201);
    }

    public function update(CreateContentRequest $request, string $uuid): JsonResponse
    {
        $this->authorize('pages:contents:update');
        
        $command = new UpdateContentCommand(
            contentId: new \Plugins\PagesEngine\Domain\ValueObjects\Uuid($uuid),
            tenantId: new \Plugins\PagesEngine\Domain\ValueObjects\Uuid(auth()->user()->tenant->uuid),
            title: $request->input('title'),
            slug: $request->input('slug'),
            content: $request->input('content'),
            contentFormat: $request->input('editor_format'),
            excerpt: $request->input('excerpt'),
            featuredImageId: $request->input('featured_image') 
                ? new \Plugins\PagesEngine\Domain\ValueObjects\Uuid($request->input('featured_image')) 
                : null,
            customUrl: $request->input('custom_url'),
            isCommentable: $request->input('is_commentable'),
            seoTitle: $request->input('seo_title'),
            seoDescription: $request->input('seo_description'),
            seoKeywords: $request->input('seo_keywords'),
            metadata: $request->input('metadata')
        );
        
        $content = $this->updateUseCase->execute($command);
        
        $contentModel = \Plugins\PagesEngine\Infrastructure\Persistence\Eloquent\ContentEloquentModel::where('uuid', $uuid)->first();
        if ($contentModel) {
            if ($request->has('categories')) {
                $contentModel->categories()->sync($request->input('categories', []));
            }
            if ($request->has('tags')) {
                $contentModel->tags()->sync($request->input('tags', []));
            }
        }
        
        return response()->json([
            'success' => true,
            'data' => new ContentResource($contentModel),
            'message' => 'Content updated successfully',
        ]);
    }

    public function destroy(string $uuid): JsonResponse
    {
        $this->authorize('pages:contents:delete');
        
        $this->deleteUseCase->execute($uuid, auth()->user()->tenant->uuid);
        
        return response()->json([
            'success' => true,
            'message' => 'Content deleted successfully',
        ]);
    }

    public function publish(string $uuid): JsonResponse
    {
        $this->authorize('pages:contents:publish');
        
        $command = new PublishContentCommand(
            uuid: $uuid,
            tenantId: auth()->user()->tenant->uuid
        );
        
        $this->publishUseCase->execute($command);
        
        return response()->json([
            'success' => true,
            'message' => 'Content published successfully',
        ]);
    }

    public function unpublish(string $uuid): JsonResponse
    {
        $this->authorize('pages:contents:publish');
        
        $command = new UnpublishContentCommand(
            uuid: $uuid,
            tenantId: auth()->user()->tenant->uuid
        );
        
        $this->unpublishUseCase->execute($command);
        
        return response()->json([
            'success' => true,
            'message' => 'Content unpublished successfully',
        ]);
    }

    public function schedule(Request $request, string $uuid): JsonResponse
    {
        $this->authorize('pages:contents:schedule');
        
        $request->validate([
            'scheduled_at' => 'required|date|after:now',
        ]);
        
        $command = new ScheduleContentCommand(
            uuid: $uuid,
            tenantId: auth()->user()->tenant->uuid,
            scheduledAt: new \DateTimeImmutable($request->input('scheduled_at'))
        );
        
        $this->scheduleUseCase->execute($command);
        
        return response()->json([
            'success' => true,
            'message' => 'Content scheduled successfully',
            'data' => [
                'scheduled_at' => $request->input('scheduled_at'),
            ],
        ]);
    }

    public function archive(string $uuid): JsonResponse
    {
        $this->authorize('pages:contents:update');
        
        $command = new ArchiveContentCommand(
            uuid: $uuid,
            tenantId: auth()->user()->tenant->uuid
        );
        
        $this->archiveUseCase->execute($command);
        
        return response()->json([
            'success' => true,
            'message' => 'Content archived successfully',
        ]);
    }

    public function byType(Request $request, string $contentTypeUuid): JsonResponse
    {
        $this->authorize('pages:contents:view');
        
        $filters = [
            'content_type_uuid' => $contentTypeUuid,
            'status' => $request->input('status'),
            'category_uuid' => $request->input('category'),
            'search' => $request->input('search'),
            'sort_by' => $request->input('sort_by', 'created_at'),
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

    public function byCategory(Request $request, string $categoryUuid): JsonResponse
    {
        $this->authorize('pages:contents:view');
        
        $filters = [
            'category_uuid' => $categoryUuid,
            'content_type_uuid' => $request->input('content_type'),
            'status' => $request->input('status'),
            'search' => $request->input('search'),
            'sort_by' => $request->input('sort_by', 'created_at'),
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

    public function byStatus(Request $request, string $status): JsonResponse
    {
        $this->authorize('pages:contents:view');
        
        $filters = [
            'status' => $status,
            'content_type_uuid' => $request->input('content_type'),
            'category_uuid' => $request->input('category'),
            'search' => $request->input('search'),
            'sort_by' => $request->input('sort_by', 'created_at'),
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

    public function byAuthor(Request $request, string $authorId): JsonResponse
    {
        $this->authorize('pages:contents:view');
        
        $filters = [
            'author_id' => $authorId,
            'content_type_uuid' => $request->input('content_type'),
            'status' => $request->input('status'),
            'search' => $request->input('search'),
            'sort_by' => $request->input('sort_by', 'created_at'),
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
