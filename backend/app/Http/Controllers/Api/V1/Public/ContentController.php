<?php

namespace App\Http\Controllers\Api\V1\Public;

use App\Http\Controllers\Controller;
use App\Domain\Content\Entities\PlatformPage;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ContentController extends Controller
{
    /**
     * Get platform page content for anonymous users
     * 
     * @param string $slug
     * @return JsonResponse
     */
    public function getPage(string $slug): JsonResponse
    {
        try {
            // Get published platform page by slug
            $page = PlatformPage::where('slug', $slug)
                ->where('status', 'published')
                ->first();

            if (!$page) {
                return response()->json([
                    'error' => 'Page not found',
                    'message' => "Platform page '{$slug}' not found or not published"
                ], 404);
            }

            // Format response to match the expected structure
            $response = [
                'id' => 'page-' . $slug . '-1',
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
            return response()->json([
                'error' => 'Internal server error',
                'message' => 'Failed to retrieve platform page content'
            ], 500);
        }
    }
}