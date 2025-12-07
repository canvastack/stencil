<?php

namespace App\Http\Controllers;

use App\Domain\Payment\Services\RefundAnalyticsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * RefundAnalyticsController
 * 
 * Provides comprehensive analytics and reporting for refund management
 * Supports dashboard views and business intelligence
 */
class RefundAnalyticsController extends Controller
{
    public function __construct(
        private RefundAnalyticsService $analyticsService
    ) {}

    /**
     * Get comprehensive dashboard data
     */
    public function dashboard(Request $request): JsonResponse
    {
        $tenantId = auth()->user()->tenant_id;
        $days = $request->get('days', 30);

        $dashboardData = $this->analyticsService->getDashboardData($tenantId, $days);

        return response()->json([
            'success' => true,
            'data' => $dashboardData,
            'meta' => [
                'period_days' => $days,
                'generated_at' => now(),
                'tenant_id' => $tenantId,
            ],
        ]);
    }

    /**
     * Get refund overview statistics
     */
    public function overview(Request $request): JsonResponse
    {
        $tenantId = auth()->user()->tenant_id;
        $days = $request->get('days', 30);

        $overview = $this->analyticsService->getRefundOverview($tenantId, $days);

        return response()->json([
            'success' => true,
            'data' => $overview,
        ]);
    }

    /**
     * Get refund trends analysis
     */
    public function trends(Request $request): JsonResponse
    {
        $tenantId = auth()->user()->tenant_id;
        $days = $request->get('days', 30);

        $trends = $this->analyticsService->getRefundTrends($tenantId, $days);

        return response()->json([
            'success' => true,
            'data' => $trends,
        ]);
    }

    /**
     * Get financial impact analysis
     */
    public function financialImpact(Request $request): JsonResponse
    {
        $tenantId = auth()->user()->tenant_id;
        $days = $request->get('days', 30);

        $financialImpact = $this->analyticsService->getFinancialImpact($tenantId, $days);

        return response()->json([
            'success' => true,
            'data' => $financialImpact,
        ]);
    }

    /**
     * Get vendor analysis
     */
    public function vendorAnalysis(Request $request): JsonResponse
    {
        $tenantId = auth()->user()->tenant_id;
        $days = $request->get('days', 30);

        $vendorAnalysis = $this->analyticsService->getVendorAnalysis($tenantId, $days);

        return response()->json([
            'success' => true,
            'data' => $vendorAnalysis,
        ]);
    }

    /**
     * Get dispute summary
     */
    public function disputeSummary(Request $request): JsonResponse
    {
        $tenantId = auth()->user()->tenant_id;
        $days = $request->get('days', 30);

        $disputeSummary = $this->analyticsService->getDisputeSummary($tenantId, $days);

        return response()->json([
            'success' => true,
            'data' => $disputeSummary,
        ]);
    }

    /**
     * Get insurance fund status
     */
    public function insuranceFund(Request $request): JsonResponse
    {
        $tenantId = auth()->user()->tenant_id;

        $insuranceFund = $this->analyticsService->getInsuranceFundStatus($tenantId);

        return response()->json([
            'success' => true,
            'data' => $insuranceFund,
        ]);
    }

    /**
     * Get performance metrics
     */
    public function performanceMetrics(Request $request): JsonResponse
    {
        $tenantId = auth()->user()->tenant_id;
        $days = $request->get('days', 30);

        $metrics = $this->analyticsService->getPerformanceMetrics($tenantId, $days);

        return response()->json([
            'success' => true,
            'data' => $metrics,
        ]);
    }

    /**
     * Get predictive insights and recommendations
     */
    public function insights(Request $request): JsonResponse
    {
        $tenantId = auth()->user()->tenant_id;

        $insights = $this->analyticsService->getPredictiveInsights($tenantId);

        return response()->json([
            'success' => true,
            'data' => $insights,
        ]);
    }

    /**
     * Export analytics data for external analysis
     */
    public function export(Request $request): JsonResponse
    {
        $tenantId = auth()->user()->tenant_id;
        $format = $request->get('format', 'json');
        $days = $request->get('days', 30);

        if (!in_array($format, ['json', 'csv'])) {
            return response()->json([
                'success' => false,
                'message' => 'Unsupported export format. Use json or csv.',
            ], 400);
        }

        $dashboardData = $this->analyticsService->getDashboardData($tenantId, $days);
        
        if ($format === 'csv') {
            return $this->exportToCsv($dashboardData);
        }

        return response()->json([
            'success' => true,
            'data' => $dashboardData,
            'export_format' => $format,
            'exported_at' => now(),
        ]);
    }

    /**
     * Generate scheduled analytics report
     */
    public function generateReport(Request $request): JsonResponse
    {
        $tenantId = auth()->user()->tenant_id;
        $reportType = $request->get('type', 'weekly');
        
        $validTypes = ['daily', 'weekly', 'monthly'];
        if (!in_array($reportType, $validTypes)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid report type. Use: ' . implode(', ', $validTypes),
            ], 400);
        }

        $days = match ($reportType) {
            'daily' => 1,
            'weekly' => 7,
            'monthly' => 30,
        };

        $reportData = [
            'report_type' => $reportType,
            'generated_at' => now(),
            'tenant_id' => $tenantId,
            'period_days' => $days,
            'data' => $this->analyticsService->getDashboardData($tenantId, $days),
        ];

        // In a real implementation, this would be saved to storage
        // and possibly sent via email or notification

        return response()->json([
            'success' => true,
            'message' => "Analytics report generated successfully",
            'data' => $reportData,
        ]);
    }

    /**
     * Get real-time metrics for dashboard
     */
    public function realTimeMetrics(Request $request): JsonResponse
    {
        $tenantId = auth()->user()->tenant_id;

        // Get current day metrics
        $todayOverview = $this->analyticsService->getRefundOverview($tenantId, 1);
        $insuranceFund = $this->analyticsService->getInsuranceFundStatus($tenantId);
        
        // Quick alerts
        $alerts = [];
        
        // Check for pending approvals
        if ($todayOverview['pending_refunds'] > 10) {
            $alerts[] = [
                'type' => 'pending_refunds',
                'severity' => 'warning',
                'message' => "High number of pending refunds: {$todayOverview['pending_refunds']}",
            ];
        }

        // Check insurance fund balance
        if ($insuranceFund['current_balance'] < 5000000) { // 5M threshold
            $alerts[] = [
                'type' => 'low_insurance_fund',
                'severity' => 'warning',
                'message' => "Insurance fund balance is low: " . number_format($insuranceFund['current_balance']),
            ];
        }

        return response()->json([
            'success' => true,
            'data' => [
                'today_overview' => $todayOverview,
                'insurance_fund_balance' => $insuranceFund['current_balance'],
                'alerts' => $alerts,
                'last_updated' => now(),
            ],
        ]);
    }

    /**
     * Export data to CSV format
     */
    private function exportToCsv(array $data): JsonResponse
    {
        // Simplified CSV export - in production this would generate actual CSV file
        $csvData = [];
        
        // Overview data
        if (isset($data['overview'])) {
            $csvData['overview'] = $data['overview'];
        }

        // Financial impact
        if (isset($data['financial_impact'])) {
            $csvData['financial_impact'] = $data['financial_impact'];
        }

        return response()->json([
            'success' => true,
            'message' => 'CSV export prepared',
            'data' => $csvData,
            'format' => 'csv',
            'note' => 'In production, this would return a downloadable CSV file',
        ]);
    }
}