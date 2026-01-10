<?php

namespace App\Http\Controllers\Api\V1\Public;

use App\Http\Controllers\Controller;
use App\Domain\Content\Entities\PlatformPage;
use App\Domain\Content\Services\TenantContentService;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class ContentController extends Controller
{
    public function __construct(
        private TenantContentService $tenantContentService
    ) {}

    /**
     * Get platform page content for anonymous users
     * 
     * @param string $slug
     * @return JsonResponse
     */
    public function getPage(string $slug): JsonResponse
    {
        try {
            // Get published platform page by slug from database
            $page = PlatformPage::where('slug', $slug)
                ->where('status', 'published')
                ->first();

            if (!$page) {
                \Log::warning('Platform page not found', [
                    'slug' => $slug,
                    'context' => 'public_api'
                ]);

                return response()->json([
                    'error' => 'Page not found',
                    'message' => "The requested page is not available. Please ensure the content has been published.",
                    'slug' => $slug
                ], 404);
            }

            // Format database response to match the expected structure
            $response = [
                'id' => $page->uuid,
                'pageSlug' => $slug,
                'content' => $page->content,
                'status' => $page->status,
                'publishedAt' => $page->published_at?->toISOString(),
                'version' => 1,
                'previousVersion' => null,
                'createdAt' => $page->created_at->toISOString(),
                'updatedAt' => $page->updated_at->toISOString(),
                'updatedBy' => null
            ];

            return response()->json($response);

        } catch (\Exception $e) {
            \Log::error('Failed to retrieve platform page', [
                'slug' => $slug,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'error' => 'Internal server error',
                'message' => 'Failed to retrieve page content. Please try again later.'
            ], 500);
        }
    }

    /**
     * Get tenant-specific page content for anonymous users
     * 
     * @param string $tenantSlug
     * @param string $page
     * @return JsonResponse
     */
    public function getTenantPage(string $tenantSlug, string $page): JsonResponse
    {
        try {
            // Find tenant by slug
            $tenant = TenantEloquentModel::where('slug', $tenantSlug)->first();
            
            if (!$tenant) {
                \Log::warning('Tenant not found', [
                    'tenant_slug' => $tenantSlug,
                    'context' => 'public_api'
                ]);

                return response()->json([
                    'error' => 'Tenant not found',
                    'message' => "The requested tenant is not available."
                ], 404);
            }

            // Query tenant pages from database with tenant_id filter
            $tenantPage = DB::table('tenant_pages')
                ->where('tenant_id', $tenant->id)
                ->where('slug', $page)
                ->where('status', 'published')
                ->first();
            
            if (!$tenantPage) {
                \Log::warning('Tenant page not found', [
                    'tenant_slug' => $tenantSlug,
                    'tenant_id' => $tenant->id,
                    'page_slug' => $page,
                    'context' => 'public_api'
                ]);

                return response()->json([
                    'error' => 'Page not found',
                    'message' => "The requested page is not available. Please ensure the content has been published.",
                    'tenant' => $tenantSlug,
                    'page' => $page
                ], 404);
            }

            // Return real tenant data from database
            return response()->json([
                'id' => $tenantPage->uuid,
                'tenantSlug' => $tenantSlug,
                'pageSlug' => $page,
                'content' => json_decode($tenantPage->content, true),
                'status' => $tenantPage->status,
                'publishedAt' => $tenantPage->published_at,
                'version' => 1,
                'previousVersion' => null,
                'createdAt' => $tenantPage->created_at,
                'updatedAt' => $tenantPage->updated_at,
                'updatedBy' => null
            ]);

        } catch (\Exception $e) {
            \Log::error('Failed to retrieve tenant page', [
                'tenant_slug' => $tenantSlug,
                'page_slug' => $page,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'error' => 'Internal server error',
                'message' => 'Failed to retrieve page content. Please try again later.'
            ], 500);
        }
    }
}