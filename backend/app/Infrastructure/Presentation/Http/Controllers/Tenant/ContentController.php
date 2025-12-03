<?php

namespace App\Infrastructure\Presentation\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Http\Resources\Tenant\PageResource;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Http\Requests\Tenant\CreatePageRequest;
use App\Http\Requests\Tenant\UpdatePageRequest;
use App\Domain\Content\Repositories\PageRepositoryInterface;
use Illuminate\Support\Str;

// TRACK A3 Integration: Use Cases
use App\Application\Content\UseCases\CreatePageUseCase;
use App\Application\Content\UseCases\UpdatePageUseCase;
use App\Application\Content\UseCases\PublishPageUseCase;
use App\Application\Content\UseCases\UnpublishPageUseCase;
use App\Application\Content\UseCases\ArchivePageUseCase;
use App\Application\Content\UseCases\DeletePageUseCase;

// TRACK A3 Integration: Commands & Queries
use App\Application\Content\Commands\CreatePageCommand;
use App\Application\Content\Commands\UpdatePageCommand;
use App\Application\Content\Queries\GetPagesQuery;
use App\Application\Content\Queries\GetPageByUuidQuery;
use App\Application\Content\Queries\GetPageBySlugQuery;
use App\Application\Content\Queries\SearchPagesQuery;
use App\Application\Content\Queries\GetPageHierarchyQuery;

// TRACK A3 Integration: Query Handlers
use App\Application\Content\Handlers\Queries\GetPagesHandler;
use App\Application\Content\Handlers\Queries\GetPageByUuidHandler;
use App\Application\Content\Handlers\Queries\GetPageBySlugHandler;
use App\Application\Content\Handlers\Queries\SearchPagesHandler;
use App\Application\Content\Handlers\Queries\GetPageHierarchyHandler;

/**
 * Tenant Content Controller (TRACK A2.2)
 * 
 * Handles tenant-level content management (tenant-specific pages).
 * Only accessible by Tenant users within their own tenant context.
 * All operations are automatically scoped to the current tenant.
 * 
 * Implements Hexagonal Architecture patterns:
 * - Repository Pattern: Data access abstraction
 * - Value Objects: Domain model encapsulation
 * - Dependency Injection: PageRepositoryInterface
 * 
 * Note: Use cases will be added in TRACK A3 (Domain & Application Layer)
 */
class ContentController extends Controller
{
    public function __construct(
        private readonly PageRepositoryInterface $pageRepository
    ) {}

    /**
     * List tenant pages with filtering and pagination
     * 
     * Query Parameters:
     * - status: draft|published|archived
     * - language: language code (default: id)
     * - search: search in title/slug/description
     * - parent_id: filter by parent page
     * - is_homepage: boolean filter for homepage
     * - template: filter by template
     * - page: pagination page (default: 1)
     * - per_page: items per page (default: 15)
     * - sort_by: sort field (default: created_at)
     * - sort_order: asc|desc (default: desc)
     * 
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        $filters = array_filter([
            'status' => $request->input('status'),
            'language' => $request->input('language', 'id'),
            'parent_id' => $request->input('parent_id'),
            'search' => $request->input('search'),
            'is_homepage' => $request->boolean('is_homepage', null) ? true : null,
            'template' => $request->input('template'),
        ]);

        $pages = $this->pageRepository->findAll($filters, $request->integer('per_page', 15));

        return response()->json([
            'data' => PageResource::collection($pages->items()),
            'meta' => [
                'current_page' => $pages->currentPage(),
                'per_page' => $pages->perPage(),
                'total' => $pages->total(),
                'last_page' => $pages->lastPage(),
            ]
        ]);
    }

    /**
     * Get specific tenant page by UUID
     * 
     * @param string $uuid Page UUID
     * @return JsonResponse
     */
    public function show(string $uuid): JsonResponse
    {
        $page = $this->pageRepository->findByUuid($uuid);

        if (!$page) {
            return response()->json(['message' => 'Page not found'], 404);
        }

        return response()->json([
            'data' => new PageResource($page)
        ]);
    }

    /**
     * Create new tenant page
     * 
     * Request body:
     * - title: string (required)
     * - slug: string (required, unique within tenant)
     * - description: string (optional)
     * - content: array|object (optional)
     * - template: string (optional, default: default)
     * - meta_data: array (optional)
     * - status: draft|published (optional, default: draft)
     * - is_homepage: boolean (optional, default: false)
     * - sort_order: integer (optional, default: 0)
     * - language: language code (optional, default: id)
     * - parent_id: integer (optional)
     * 
     * @param CreatePageRequest $request
     * @return JsonResponse
     */
    public function store(CreatePageRequest $request): JsonResponse
    {
        try {
            $page = $this->pageRepository->create([
                'uuid' => Str::uuid(),
                'title' => $request->input('title'),
                'slug' => $request->input('slug'),
                'description' => $request->input('description'),
                'content' => $request->input('content', []),
                'template' => $request->input('template', 'default'),
                'meta_data' => $request->input('meta_data', []),
                'status' => $request->input('status', 'draft'),
                'is_homepage' => $request->boolean('is_homepage', false),
                'sort_order' => $request->integer('sort_order', 0),
                'language' => $request->input('language', 'id'),
                'parent_id' => $request->input('parent_id'),
            ]);

            return response()->json([
                'data' => new PageResource($page),
                'message' => 'Tenant page created successfully'
            ], 201);

        } catch (\InvalidArgumentException $e) {
            return response()->json([
                'message' => $e->getMessage()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to create page: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update tenant page
     * 
     * @param UpdatePageRequest $request
     * @param string $uuid Page UUID
     * @return JsonResponse
     */
    public function update(UpdatePageRequest $request, string $uuid): JsonResponse
    {
        $page = $this->pageRepository->findByUuid($uuid);

        if (!$page) {
            return response()->json(['message' => 'Page not found'], 404);
        }

        try {
            $updateData = array_filter([
                'title' => $request->input('title'),
                'slug' => $request->input('slug'),
                'description' => $request->input('description'),
                'content' => $request->input('content'),
                'template' => $request->input('template'),
                'meta_data' => $request->input('meta_data'),
                'status' => $request->input('status'),
                'is_homepage' => $request->has('is_homepage') ? $request->boolean('is_homepage') : null,
                'sort_order' => $request->input('sort_order'),
                'language' => $request->input('language'),
                'parent_id' => $request->input('parent_id'),
            ], fn($value) => $value !== null);

            $page = $this->pageRepository->update($page, $updateData);

            return response()->json([
                'data' => new PageResource($page),
                'message' => 'Tenant page updated successfully'
            ]);

        } catch (\InvalidArgumentException $e) {
            return response()->json([
                'message' => $e->getMessage()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to update page: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete tenant page
     * 
     * @param string $uuid Page UUID
     * @return JsonResponse
     */
    public function destroy(string $uuid): JsonResponse
    {
        $page = $this->pageRepository->findByUuid($uuid);

        if (!$page) {
            return response()->json(['message' => 'Page not found'], 404);
        }

        $this->pageRepository->delete($page);

        return response()->json([
            'message' => 'Tenant page deleted successfully'
        ]);
    }

    /**
     * Publish tenant page
     * 
     * Makes page visible to public/specific audiences
     * 
     * @param string $uuid Page UUID
     * @return JsonResponse
     */
    public function publish(string $uuid): JsonResponse
    {
        $page = $this->pageRepository->findByUuid($uuid);

        if (!$page) {
            return response()->json(['message' => 'Page not found'], 404);
        }

        try {
            $page->status = 'published';
            $page->published_at = now();
            $this->pageRepository->update($page, [
                'status' => 'published',
                'published_at' => now()
            ]);

            return response()->json([
                'data' => new PageResource($page->fresh()),
                'message' => 'Tenant page published successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to publish page: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Unpublish tenant page
     * 
     * Hides page from public/specific audiences
     * 
     * @param string $uuid Page UUID
     * @return JsonResponse
     */
    public function unpublish(string $uuid): JsonResponse
    {
        $page = $this->pageRepository->findByUuid($uuid);

        if (!$page) {
            return response()->json(['message' => 'Page not found'], 404);
        }

        try {
            $page->status = 'draft';
            $this->pageRepository->update($page, [
                'status' => 'draft',
                'published_at' => null
            ]);

            return response()->json([
                'data' => new PageResource($page->fresh()),
                'message' => 'Tenant page unpublished successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to unpublish page: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Set page as homepage
     * 
     * Only one page can be homepage per language per tenant
     * 
     * @param string $uuid Page UUID
     * @return JsonResponse
     */
    public function setHomepage(string $uuid): JsonResponse
    {
        $page = $this->pageRepository->findByUuid($uuid);

        if (!$page) {
            return response()->json(['message' => 'Page not found'], 404);
        }

        try {
            $this->pageRepository->update($page, [
                'is_homepage' => true
            ]);

            return response()->json([
                'data' => new PageResource($page->fresh()),
                'message' => 'Page set as homepage successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to set homepage: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Search pages
     * 
     * Full-text search in title, slug, and description
     * 
     * Query Parameters:
     * - q: search query (required)
     * - language: language code (optional, default: id)
     * - status: filter by status (optional)
     * - limit: result limit (optional, default: 10)
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function search(Request $request): JsonResponse
    {
        $query = $request->input('q');
        
        if (!$query || strlen($query) < 2) {
            return response()->json([
                'message' => 'Search query must be at least 2 characters',
                'data' => []
            ], 422);
        }

        $language = $request->input('language', 'id');
        $status = $request->input('status');
        $limit = $request->integer('limit', 10);

        $filters = [
            'search' => $query,
            'language' => $language,
            'status' => $status
        ];

        $results = $this->pageRepository->findAll($filters, $limit);

        return response()->json([
            'data' => PageResource::collection($results->items())
        ]);
    }

    /**
     * Get page statistics
     * 
     * Returns aggregated statistics about tenant pages:
     * - total pages
     * - published count
     * - draft count
     * - archived count
     * - by language
     * - by template
     * 
     * @return JsonResponse
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
     * 
     * Returns hierarchical tree of pages for navigation
     * 
     * Query Parameters:
     * - language: language code (optional, default: id)
     * - status: filter by status (optional)
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function tree(Request $request): JsonResponse
    {
        $language = $request->input('language', 'id');
        $status = $request->input('status');

        $filters = [];
        if ($status) {
            $filters['status'] = $status;
        }

        $pages = $this->pageRepository->getPageTree($language, $filters);

        return response()->json([
            'data' => PageResource::collection($pages)
        ]);
    }

    /**
     * Get page versions
     * 
     * Retrieve version history for a page
     * 
     * Query Parameters:
     * - page: pagination page (optional, default: 1)
     * - per_page: items per page (optional, default: 10)
     * 
     * @param string $uuid Page UUID
     * @param Request $request
     * @return JsonResponse
     */
    public function versions(string $uuid, Request $request): JsonResponse
    {
        $page = $this->pageRepository->findByUuid($uuid);

        if (!$page) {
            return response()->json(['message' => 'Page not found'], 404);
        }

        try {
            // Note: Implement getVersions in PageRepositoryInterface (TRACK A3)
            return response()->json([
                'message' => 'Version history retrieval will be implemented in TRACK A3',
                'data' => []
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to retrieve versions: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create page version
     * 
     * Creates a new version from current page content
     * 
     * @param string $uuid Page UUID
     * @return JsonResponse
     */
    public function createVersion(string $uuid): JsonResponse
    {
        $page = $this->pageRepository->findByUuid($uuid);

        if (!$page) {
            return response()->json(['message' => 'Page not found'], 404);
        }

        try {
            // Note: Implement createVersion in PageRepositoryInterface (TRACK A3)
            return response()->json([
                'message' => 'Page version creation will be implemented in TRACK A3',
                'data' => null
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to create version: ' . $e->getMessage()
            ], 422);
        }
    }

    /**
     * Restore page from version
     * 
     * Restores page to a specific version state
     * 
     * @param string $uuid Page UUID
     * @param int $version Version number
     * @return JsonResponse
     */
    public function restoreVersion(string $uuid, int $version): JsonResponse
    {
        $page = $this->pageRepository->findByUuid($uuid);

        if (!$page) {
            return response()->json(['message' => 'Page not found'], 404);
        }

        try {
            // Note: Implement restoreVersion in PageRepositoryInterface (TRACK A3)
            return response()->json([
                'message' => 'Page version restoration will be implemented in TRACK A3',
                'data' => null
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to restore version: ' . $e->getMessage()
            ], 422);
        }
    }
}
