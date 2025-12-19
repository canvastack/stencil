<?php

namespace App\Infrastructure\Presentation\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Infrastructure\Persistence\Eloquent\Models\Vendor;
use App\Infrastructure\Persistence\Eloquent\Models\VendorOrder;
use App\Infrastructure\Persistence\Eloquent\Models\OrderVendorNegotiation;
use App\Domain\Vendor\Services\VendorAnalyticsService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Carbon\Carbon;

class VendorAnalyticsController extends Controller
{
    public function __construct(
        private VendorAnalyticsService $analyticsService
    ) {}

    /**
     * Get comprehensive vendor analytics dashboard
     */
    public function getDashboard(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'date_from' => 'nullable|date',
                'date_to' => 'nullable|date|after_or_equal:date_from',
                'vendor_ids' => 'nullable|array',
                'vendor_ids.*' => 'integer|exists:vendors,id',
                'include_trends' => 'nullable|boolean',
                'include_predictions' => 'nullable|boolean',
            ]);

            $dateFrom = isset($validated['date_from']) && $validated['date_from'] ? Carbon::parse($validated['date_from']) : now()->subMonths(6);
            $dateTo = isset($validated['date_to']) && $validated['date_to'] ? Carbon::parse($validated['date_to']) : now();
            $vendorIds = $validated['vendor_ids'] ?? null;
            $includeTrends = $validated['include_trends'] ?? true;
            $includePredictions = $validated['include_predictions'] ?? false;

            $dashboard = $this->analyticsService->getDashboardData(
                $dateFrom, 
                $dateTo, 
                $vendorIds, 
                $includeTrends, 
                $includePredictions
            );

            return response()->json([
                'success' => true,
                'message' => 'Vendor analytics dashboard retrieved successfully',
                'data' => $dashboard,
                'meta' => [
                    'date_from' => $dateFrom->toDateString(),
                    'date_to' => $dateTo->toDateString(),
                    'vendor_count' => $vendorIds ? count($vendorIds) : 'all',
                    'generated_at' => now()->toIso8601String(),
                ],
            ], 200);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->validator->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve vendor analytics dashboard',
                'error' => config('app.debug') ? $e->getMessage() : 'An unexpected error occurred',
            ], 500);
        }
    }

    /**
     * Get vendor performance heatmap data
     */
    public function getPerformanceHeatmap(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'period' => 'nullable|string|in:daily,weekly,monthly',
                'metrics' => 'nullable|array',
                'metrics.*' => 'string|in:on_time_delivery,quality_rating,response_time,completion_rate,cost_efficiency',
                'vendor_ids' => 'nullable|array',
                'vendor_ids.*' => 'integer|exists:vendors,id',
            ]);

            $period = $validated['period'] ?? 'monthly';
            $metrics = $validated['metrics'] ?? ['on_time_delivery', 'quality_rating', 'completion_rate'];
            $vendorIds = $validated['vendor_ids'] ?? null;

            $heatmapData = $this->analyticsService->getPerformanceHeatmap(
                $period, 
                $metrics, 
                $vendorIds
            );

            return response()->json([
                'success' => true,
                'message' => 'Performance heatmap data retrieved successfully',
                'data' => $heatmapData,
                'meta' => [
                    'period' => $period,
                    'metrics' => $metrics,
                    'vendor_count' => count($heatmapData),
                ],
            ], 200);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->validator->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve performance heatmap',
                'error' => config('app.debug') ? $e->getMessage() : 'An unexpected error occurred',
            ], 500);
        }
    }

    /**
     * Get vendor risk analysis
     */
    public function getRiskAnalysis(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'risk_level' => 'nullable|string|in:low,medium,high,critical',
                'sort_by' => 'nullable|string|in:risk_score,performance_score,last_order_date',
                'sort_order' => 'nullable|string|in:asc,desc',
                'limit' => 'nullable|integer|min:1|max:100',
            ]);

            $riskLevel = $validated['risk_level'] ?? null;
            $sortBy = $validated['sort_by'] ?? 'risk_score';
            $sortOrder = $validated['sort_order'] ?? 'desc';
            $limit = $validated['limit'] ?? 50;

            $riskAnalysis = $this->analyticsService->getRiskAnalysis(
                $riskLevel, 
                $sortBy, 
                $sortOrder, 
                $limit
            );

            return response()->json([
                'success' => true,
                'message' => 'Vendor risk analysis retrieved successfully',
                'data' => $riskAnalysis,
                'meta' => [
                    'risk_level_filter' => $riskLevel,
                    'sort_by' => $sortBy,
                    'sort_order' => $sortOrder,
                    'vendor_count' => count($riskAnalysis['vendors']),
                ],
            ], 200);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->validator->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve risk analysis',
                'error' => config('app.debug') ? $e->getMessage() : 'An unexpected error occurred',
            ], 500);
        }
    }

    /**
     * Get vendor recommendations for order
     */
    public function getRecommendations(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'order_requirements' => 'required|array',
                'order_requirements.material' => 'required|string',
                'order_requirements.process' => 'required|string',
                'order_requirements.quantity' => 'required|integer|min:1',
                'order_requirements.budget_min' => 'nullable|numeric|min:0',
                'order_requirements.budget_max' => 'nullable|numeric|min:0',
                'order_requirements.deadline_days' => 'nullable|integer|min:1',
                'order_requirements.quality_tier' => 'nullable|string|in:standard,premium,exclusive',
                'limit' => 'nullable|integer|min:1|max:20',
                'include_risk_assessment' => 'nullable|boolean',
            ]);

            $orderRequirements = $validated['order_requirements'];
            $limit = $validated['limit'] ?? 10;
            $includeRiskAssessment = $validated['include_risk_assessment'] ?? true;

            $recommendations = $this->analyticsService->getVendorRecommendations(
                $orderRequirements, 
                $limit, 
                $includeRiskAssessment
            );

            return response()->json([
                'success' => true,
                'message' => 'Vendor recommendations retrieved successfully',
                'data' => $recommendations,
                'meta' => [
                    'order_requirements' => $orderRequirements,
                    'recommendation_count' => count($recommendations['vendors']),
                    'algorithm_version' => $recommendations['algorithm_version'],
                ],
            ], 200);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->validator->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve vendor recommendations',
                'error' => config('app.debug') ? $e->getMessage() : 'An unexpected error occurred',
            ], 500);
        }
    }

    /**
     * Get vendor performance trends
     */
    public function getPerformanceTrends(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'vendor_id' => 'nullable|integer|exists:vendors,id',
                'date_from' => 'nullable|date',
                'date_to' => 'nullable|date|after_or_equal:date_from',
                'period' => 'nullable|string|in:weekly,monthly,quarterly',
                'metrics' => 'nullable|array',
                'metrics.*' => 'string|in:on_time_delivery,quality_rating,response_time,completion_rate,cost_efficiency,overall_score',
            ]);

            $vendorId = $validated['vendor_id'] ?? null;
            $dateFrom = $validated['date_from'] ? Carbon::parse($validated['date_from']) : now()->subYear();
            $dateTo = $validated['date_to'] ? Carbon::parse($validated['date_to']) : now();
            $period = $validated['period'] ?? 'monthly';
            $metrics = $validated['metrics'] ?? ['overall_score', 'on_time_delivery', 'quality_rating'];

            $trends = $this->analyticsService->getPerformanceTrends(
                $vendorId, 
                $dateFrom, 
                $dateTo, 
                $period, 
                $metrics
            );

            return response()->json([
                'success' => true,
                'message' => 'Performance trends retrieved successfully',
                'data' => $trends,
                'meta' => [
                    'vendor_id' => $vendorId,
                    'date_from' => $dateFrom->toDateString(),
                    'date_to' => $dateTo->toDateString(),
                    'period' => $period,
                    'metrics' => $metrics,
                ],
            ], 200);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->validator->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve performance trends',
                'error' => config('app.debug') ? $e->getMessage() : 'An unexpected error occurred',
            ], 500);
        }
    }

    /**
     * Get vendor comparison analysis
     */
    public function getVendorComparison(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'vendor_ids' => 'required|array|min:2|max:5',
                'vendor_ids.*' => 'integer|exists:vendors,id',
                'metrics' => 'nullable|array',
                'metrics.*' => 'string|in:on_time_delivery,quality_rating,response_time,completion_rate,cost_efficiency,overall_score',
                'period' => 'nullable|string|in:1m,3m,6m,1y',
            ]);

            $vendorIds = $validated['vendor_ids'];
            $metrics = $validated['metrics'] ?? ['overall_score', 'on_time_delivery', 'quality_rating', 'cost_efficiency'];
            $period = $validated['period'] ?? '6m';

            $comparison = $this->analyticsService->compareVendors(
                $vendorIds, 
                $metrics, 
                $period
            );

            return response()->json([
                'success' => true,
                'message' => 'Vendor comparison retrieved successfully',
                'data' => $comparison,
                'meta' => [
                    'vendor_ids' => $vendorIds,
                    'metrics' => $metrics,
                    'period' => $period,
                    'comparison_count' => count($vendorIds),
                ],
            ], 200);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->validator->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve vendor comparison',
                'error' => config('app.debug') ? $e->getMessage() : 'An unexpected error occurred',
            ], 500);
        }
    }

    /**
     * Get real-time vendor KPIs
     */
    public function getRealTimeKPIs(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'refresh_interval' => 'nullable|integer|min:30|max:3600', // seconds
                'include_alerts' => 'nullable|boolean',
            ]);

            $refreshInterval = $validated['refresh_interval'] ?? 300; // 5 minutes default
            $includeAlerts = $validated['include_alerts'] ?? true;

            $kpis = $this->analyticsService->getRealTimeKPIs($includeAlerts);

            return response()->json([
                'success' => true,
                'message' => 'Real-time KPIs retrieved successfully',
                'data' => $kpis,
                'meta' => [
                    'refresh_interval' => $refreshInterval,
                    'include_alerts' => $includeAlerts,
                    'last_updated' => now()->toIso8601String(),
                    'next_refresh' => now()->addSeconds($refreshInterval)->toIso8601String(),
                ],
            ], 200);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->validator->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve real-time KPIs',
                'error' => config('app.debug') ? $e->getMessage() : 'An unexpected error occurred',
            ], 500);
        }
    }
}