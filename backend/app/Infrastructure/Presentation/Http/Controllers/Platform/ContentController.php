<?php

namespace App\Infrastructure\Presentation\Http\Controllers\Platform;

use App\Http\Controllers\Controller;
use App\Application\Content\Commands\CreatePlatformPageCommand;
use App\Application\Content\Commands\UpdatePlatformPageCommand;
use App\Application\Content\Queries\GetPlatformPagesQuery;
use App\Application\Content\UseCases\CreatePlatformPageUseCase;
use App\Application\Content\UseCases\UpdatePlatformPageUseCase;
use App\Application\Content\Handlers\GetPlatformPagesHandler;
use App\Domain\Content\Repositories\PlatformPageRepositoryInterface;
use App\Http\Resources\Platform\PlatformPageResource;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Http\Requests\Platform\CreatePlatformPageRequest;
use App\Http\Requests\Platform\UpdatePlatformPageRequest;

/**
 * Platform Content Controller
 * 
 * Handles platform-level content management (global pages).
 * Only accessible by Platform Administrators.
 */
class ContentController extends Controller
{
    public function __construct(
        private readonly CreatePlatformPageUseCase $createPageUseCase,
        private readonly UpdatePlatformPageUseCase $updatePageUseCase,
        private readonly GetPlatformPagesHandler $getPagesHandler,
        private readonly PlatformPageRepositoryInterface $pageRepository
    ) {}

    /**
     * List platform pages with filtering and pagination
     */
    public function index(Request $request): JsonResponse
    {
        $query = new GetPlatformPagesQuery(
            status: $request->input('status'),
            language: $request->input('language', 'en'),
            parent_id: $request->input('parent_id'),
            search: $request->input('search'),
            is_homepage: $request->boolean('is_homepage', null),
            template: $request->input('template'),
            page: $request->integer('page', 1),
            per_page: $request->integer('per_page', 15),
            sort_by: $request->input('sort_by', 'created_at'),
            sort_order: $request->input('sort_order', 'desc')
        );

        $pages = $this->getPagesHandler->handle($query);

        return response()->json([
            'data' => PlatformPageResource::collection($pages->items()),
            'meta' => [
                'current_page' => $pages->currentPage(),
                'per_page' => $pages->perPage(),
                'total' => $pages->total(),
                'last_page' => $pages->lastPage(),
            ]
        ]);
    }

    /**
     * Get specific platform page by UUID
     */
    public function show(string $uuid): JsonResponse
    {
        $page = $this->pageRepository->findByUuid($uuid);

        if (!$page) {
            return response()->json(['message' => 'Page not found'], 404);
        }

        return response()->json([
            'data' => new PlatformPageResource($page)
        ]);
    }

    /**
     * Create new platform page
     */
    public function store(CreatePlatformPageRequest $request): JsonResponse
    {
        $command = new CreatePlatformPageCommand(
            title: $request->input('title'),
            slug: $request->input('slug'),
            description: $request->input('description'),
            content: $request->input('content', []),
            template: $request->input('template', 'default'),
            meta_data: $request->input('meta_data', []),
            status: $request->input('status', 'draft'),
            is_homepage: $request->boolean('is_homepage', false),
            sort_order: $request->integer('sort_order', 0),
            language: $request->input('language', 'en'),
            parent_id: $request->input('parent_id'),
            created_by: auth()->id()
        );

        try {
            $page = $this->createPageUseCase->execute($command);

            return response()->json([
                'data' => new PlatformPageResource($page),
                'message' => 'Platform page created successfully'
            ], 201);

        } catch (\InvalidArgumentException $e) {
            return response()->json([
                'message' => $e->getMessage()
            ], 422);
        }
    }

    /**
     * Update platform page
     */
    public function update(UpdatePlatformPageRequest $request, string $uuid): JsonResponse
    {
        $page = $this->pageRepository->findByUuid($uuid);

        if (!$page) {
            return response()->json(['message' => 'Page not found'], 404);
        }

        $command = new UpdatePlatformPageCommand(
            uuid: $uuid,
            title: $request->input('title'),
            slug: $request->input('slug'),
            description: $request->input('description'),
            content: $request->input('content'),
            template: $request->input('template'),
            meta_data: $request->input('meta_data'),
            status: $request->input('status'),
            is_homepage: $request->boolean('is_homepage'),
            sort_order: $request->integer('sort_order'),
            language: $request->input('language'),
            parent_id: $request->input('parent_id'),
            change_description: $request->input('change_description')
        );

        try {
            $page = $this->updatePageUseCase->execute($command);

            return response()->json([
                'data' => new PlatformPageResource($page),
                'message' => 'Platform page updated successfully'
            ]);

        } catch (\InvalidArgumentException $e) {
            return response()->json([
                'message' => $e->getMessage()
            ], 422);
        }
    }

    /**
     * Delete platform page
     */
    public function destroy(string $uuid): JsonResponse
    {
        $page = $this->pageRepository->findByUuid($uuid);

        if (!$page) {
            return response()->json(['message' => 'Page not found'], 404);
        }

        $this->pageRepository->delete($page);

        return response()->json([
            'message' => 'Platform page deleted successfully'
        ]);
    }

    /**
     * Publish platform page
     */
    public function publish(string $uuid): JsonResponse
    {
        $page = $this->pageRepository->findByUuid($uuid);

        if (!$page) {
            return response()->json(['message' => 'Page not found'], 404);
        }

        $page->publish();

        return response()->json([
            'data' => new PlatformPageResource($page->fresh()),
            'message' => 'Platform page published successfully'
        ]);
    }

    /**
     * Unpublish platform page
     */
    public function unpublish(string $uuid): JsonResponse
    {
        $page = $this->pageRepository->findByUuid($uuid);

        if (!$page) {
            return response()->json(['message' => 'Page not found'], 404);
        }

        $page->unpublish();

        return response()->json([
            'data' => new PlatformPageResource($page->fresh()),
            'message' => 'Platform page unpublished successfully'
        ]);
    }

    /**
     * Set as homepage
     */
    public function setHomepage(string $uuid): JsonResponse
    {
        $page = $this->pageRepository->findByUuid($uuid);

        if (!$page) {
            return response()->json(['message' => 'Page not found'], 404);
        }

        $page->setAsHomepage();

        return response()->json([
            'data' => new PlatformPageResource($page->fresh()),
            'message' => 'Page set as homepage successfully'
        ]);
    }

    /**
     * Get page statistics
     */
    public function statistics(): JsonResponse
    {
        $stats = $this->pageRepository->getStatistics();

        return response()->json([
            'data' => $stats
        ]);
    }

    /**
     * Get page tree structure
     */
    public function tree(Request $request): JsonResponse
    {
        $language = $request->input('language', 'en');
        $pages = $this->pageRepository->getPageTree($language);

        return response()->json([
            'data' => PlatformPageResource::collection($pages)
        ]);
    }
}