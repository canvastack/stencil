<?php

declare(strict_types=1);

namespace App\Http\Controllers\Tenant;

use App\Domain\Content\Services\TenantContentService;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class ContentController extends Controller
{
    public function __construct(
        private TenantContentService $contentService
    ) {}

    /**
     * Get all tenant pages
     */
    public function index(): JsonResponse
    {
        try {
            $pages = $this->contentService->getAllPages();
            
            return response()->json([
                'success' => true,
                'data' => $pages->map(fn($page) => [
                    'id' => $page->uuid,
                    'title' => $page->title,
                    'slug' => $page->slug,
                    'description' => $page->description,
                    'status' => $page->status,
                    'page_type' => $page->page_type,
                    'is_homepage' => $page->is_homepage,
                    'published_at' => $page->published_at?->toISOString(),
                    'created_at' => $page->created_at->toISOString(),
                    'updated_at' => $page->updated_at->toISOString()
                ])
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve tenant pages',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get published tenant pages
     */
    public function published(): JsonResponse
    {
        try {
            $pages = $this->contentService->getPublishedPages();
            
            return response()->json([
                'success' => true,
                'data' => $pages->map(fn($page) => [
                    'id' => $page->uuid,
                    'title' => $page->title,
                    'slug' => $page->slug,
                    'content' => $page->content,
                    'meta_data' => $page->meta_data,
                    'published_at' => $page->published_at?->toISOString()
                ])
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve published tenant pages',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get tenant page by slug
     */
    public function show(string $slug): JsonResponse
    {
        try {
            $page = $this->contentService->getPageBySlug($slug);
            
            if (!$page) {
                return response()->json([
                    'success' => false,
                    'message' => 'Tenant page not found'
                ], 404);
            }
            
            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $page->uuid,
                    'title' => $page->title,
                    'slug' => $page->slug,
                    'description' => $page->description,
                    'content' => $page->content,
                    'template' => $page->template,
                    'meta_data' => $page->meta_data,
                    'status' => $page->status,
                    'page_type' => $page->page_type,
                    'is_homepage' => $page->is_homepage,
                    'sort_order' => $page->sort_order,
                    'language' => $page->language,
                    'published_at' => $page->published_at?->toISOString(),
                    'created_at' => $page->created_at->toISOString(),
                    'updated_at' => $page->updated_at->toISOString()
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve tenant page',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create new tenant page
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'title' => 'required|string|max:255',
                'slug' => 'nullable|string|max:255',
                'description' => 'nullable|string',
                'content' => 'required|array',
                'template' => 'nullable|string|max:255',
                'meta_data' => 'nullable|array',
                'status' => 'nullable|in:draft,published,archived',
                'page_type' => 'nullable|in:home,about,contact,faq,services,pricing',
                'is_homepage' => 'boolean',
                'sort_order' => 'nullable|integer',
                'language' => 'nullable|string|max:5'
            ]);

            $page = $this->contentService->createPage($validated);
            
            return response()->json([
                'success' => true,
                'message' => 'Tenant page created successfully',
                'data' => [
                    'id' => $page->uuid,
                    'title' => $page->title,
                    'slug' => $page->slug,
                    'status' => $page->status
                ]
            ], 201);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create tenant page',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update tenant page
     */
    public function update(Request $request, string $slug): JsonResponse
    {
        try {
            $validated = $request->validate([
                'title' => 'nullable|string|max:255',
                'description' => 'nullable|string',
                'content' => 'nullable|array',
                'template' => 'nullable|string|max:255',
                'meta_data' => 'nullable|array',
                'status' => 'nullable|in:draft,published,archived',
                'page_type' => 'nullable|in:home,about,contact,faq,services,pricing',
                'is_homepage' => 'boolean',
                'sort_order' => 'nullable|integer',
                'language' => 'nullable|string|max:5'
            ]);

            $page = $this->contentService->updatePage($slug, $validated);
            
            if (!$page) {
                return response()->json([
                    'success' => false,
                    'message' => 'Tenant page not found'
                ], 404);
            }
            
            return response()->json([
                'success' => true,
                'message' => 'Tenant page updated successfully',
                'data' => [
                    'id' => $page->uuid,
                    'title' => $page->title,
                    'slug' => $page->slug,
                    'status' => $page->status,
                    'updated_at' => $page->updated_at->toISOString()
                ]
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update tenant page',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete tenant page
     */
    public function destroy(string $slug): JsonResponse
    {
        try {
            $success = $this->contentService->deletePage($slug);
            
            if (!$success) {
                return response()->json([
                    'success' => false,
                    'message' => 'Tenant page not found'
                ], 404);
            }
            
            return response()->json([
                'success' => true,
                'message' => 'Tenant page deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete tenant page',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Publish tenant page
     */
    public function publish(string $slug): JsonResponse
    {
        try {
            $page = $this->contentService->publishPage($slug);
            
            if (!$page) {
                return response()->json([
                    'success' => false,
                    'message' => 'Tenant page not found'
                ], 404);
            }
            
            return response()->json([
                'success' => true,
                'message' => 'Tenant page published successfully',
                'data' => [
                    'id' => $page->uuid,
                    'title' => $page->title,
                    'slug' => $page->slug,
                    'status' => $page->status,
                    'published_at' => $page->published_at?->toISOString()
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to publish tenant page',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Archive tenant page
     */
    public function archive(string $slug): JsonResponse
    {
        try {
            $page = $this->contentService->archivePage($slug);
            
            if (!$page) {
                return response()->json([
                    'success' => false,
                    'message' => 'Tenant page not found'
                ], 404);
            }
            
            return response()->json([
                'success' => true,
                'message' => 'Tenant page archived successfully',
                'data' => [
                    'id' => $page->uuid,
                    'title' => $page->title,
                    'slug' => $page->slug,
                    'status' => $page->status
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to archive tenant page',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update page content only
     */
    public function updateContent(Request $request, string $slug): JsonResponse
    {
        try {
            $validated = $request->validate([
                'content' => 'required|array'
            ]);

            $page = $this->contentService->updatePageContent($slug, $validated['content']);
            
            if (!$page) {
                return response()->json([
                    'success' => false,
                    'message' => 'Tenant page not found'
                ], 404);
            }
            
            return response()->json([
                'success' => true,
                'message' => 'Tenant page content updated successfully',
                'data' => [
                    'id' => $page->uuid,
                    'title' => $page->title,
                    'slug' => $page->slug,
                    'content' => $page->content,
                    'updated_at' => $page->updated_at->toISOString()
                ]
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update tenant page content',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}