<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Domain\Intelligence\Services\SmartSearchService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

/**
 * Smart Search Controller
 * 
 * Handles intelligent search functionality with AI-powered relevance ranking,
 * auto-completion, and cross-entity search capabilities.
 */
class SmartSearchController extends Controller
{
    public function __construct(
        private SmartSearchService $smartSearchService
    ) {}

    /**
     * Perform smart search across all entities
     */
    public function search(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'q' => 'required|string|min:1|max:500',
            'types' => 'sometimes|string',
            'limit' => 'sometimes|integer|min:1|max:50',
            'include_suggestions' => 'sometimes|boolean'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid search parameters',
                'errors' => $validator->errors()
            ], 400);
        }

        try {
            $query = $request->input('q');
            $types = $request->input('types') ? explode(',', $request->input('types')) : ['all'];
            $limit = $request->input('limit', 10);
            $includeSuggestions = $request->input('include_suggestions', true);

            // Perform smart search
            $searchResult = $this->smartSearchService->search(
                query: $query,
                userId: auth()->id(),
                tenantId: auth()->user()->tenant_id,
                types: $types,
                limit: $limit,
                includeSuggestions: $includeSuggestions
            );

            return response()->json([
                'success' => true,
                'data' => [
                    'results' => $searchResult->getResults(),
                    'suggestions' => $searchResult->getSuggestions(),
                    'total_count' => $searchResult->getTotalCount(),
                    'search_time' => $searchResult->getSearchTime(),
                    'query_analysis' => $searchResult->getQueryAnalysis()
                ]
            ]);
        } catch (\Exception $e) {
            \Log::error('Smart search failed', [
                'query' => $query ?? null,
                'user_id' => auth()->id(),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Search failed',
                'error' => app()->environment('local') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }

    /**
     * Get search suggestions for auto-completion
     */
    public function suggestions(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'q' => 'sometimes|string|max:100',
            'type' => 'sometimes|string|in:recent,trending,completion',
            'limit' => 'sometimes|integer|min:1|max:20'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid suggestion parameters',
                'errors' => $validator->errors()
            ], 400);
        }

        try {
            $query = $request->input('q', '');
            $type = $request->input('type', 'all');
            $limit = $request->input('limit', 10);

            $suggestions = $this->smartSearchService->getSuggestions(
                query: $query,
                userId: auth()->id(),
                tenantId: auth()->user()->tenant_id,
                type: $type,
                limit: $limit
            );

            return response()->json([
                'success' => true,
                'data' => [
                    'suggestions' => $suggestions
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to get suggestions'
            ], 500);
        }
    }

    /**
     * Record search analytics for improving results
     */
    public function recordSearchAnalytics(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'query' => 'required|string|max:500',
            'result_clicked' => 'sometimes|string',
            'result_position' => 'sometimes|integer|min:0',
            'search_session_id' => 'sometimes|string|max:100'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid analytics data',
                'errors' => $validator->errors()
            ], 400);
        }

        try {
            $this->smartSearchService->recordSearchAnalytics(
                query: $request->input('query'),
                userId: auth()->id(),
                tenantId: auth()->user()->tenant_id,
                resultClicked: $request->input('result_clicked'),
                resultPosition: $request->input('result_position'),
                searchSessionId: $request->input('search_session_id')
            );

            return response()->json([
                'success' => true,
                'message' => 'Analytics recorded successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to record analytics'
            ], 500);
        }
    }

    /**
     * Get search analytics and insights
     */
    public function getSearchAnalytics(Request $request): JsonResponse
    {
        try {
            $analytics = $this->smartSearchService->getSearchAnalytics(
                userId: auth()->id(),
                tenantId: auth()->user()->tenant_id,
                days: $request->input('days', 30)
            );

            return response()->json([
                'success' => true,
                'data' => $analytics
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to get search analytics'
            ], 500);
        }
    }
}