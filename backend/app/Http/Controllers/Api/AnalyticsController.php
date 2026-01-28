<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Domain\Analytics\Services\BusinessAnalyticsService;
use App\Domain\Shared\ValueObjects\UuidValueObject;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use DatePeriod;
use DateTime;
use DateInterval;

/**
 * Analytics API Controller
 * 
 * Provides comprehensive business analytics endpoints for executive dashboards,
 * performance metrics, trend analysis, and forecasting capabilities.
 * 
 * All endpoints are tenant-scoped and require proper authentication.
 */
class AnalyticsController extends Controller
{
    public function __construct(
        private BusinessAnalyticsService $analyticsService
    ) {}

    /**
     * Get executive dashboard data
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function getExecutiveDashboard(Request $request): JsonResponse
    {
        $request->validate([
            'start_date' => 'required|date',
            'end_date' => 'required|date|after:start_date',
        ]);

        try {
            $tenantId = new UuidValueObject($request->user()->tenant_id);
            $period = new DatePeriod(
                new DateTime($request->start_date),
                new DateInterval('P1D'),
                new DateTime($request->end_date)
            );

            $dashboard = $this->analyticsService->generateExecutiveDashboard($tenantId, $period);

            return response()->json([
                'success' => true,
                'data' => [
                    'period' => [
                        'start' => $period->getStartDate()->format('Y-m-d'),
                        'end' => $period->getEndDate()->format('Y-m-d')
                    ],
                    'order_metrics' => [
                        'total_orders' => $dashboard->getOrderMetrics()->getTotalOrders(),
                        'completed_orders' => $dashboard->getOrderMetrics()->getCompletedOrders(),
                        'cancelled_orders' => $dashboard->getOrderMetrics()->getCancelledOrders(),
                        'in_progress_orders' => $dashboard->getOrderMetrics()->getInProgressOrders(),
                        'average_order_value' => [
                            'amount' => $dashboard->getOrderMetrics()->getAverageOrderValue()->getAmount(),
                            'currency' => $dashboard->getOrderMetrics()->getAverageOrderValue()->getCurrency()
                        ],
                        'completion_rate' => $dashboard->getOrderMetrics()->getOrderCompletionRate(),
                        'average_processing_time_days' => $dashboard->getOrderMetrics()->getAverageProcessingTimeDays(),
                        'orders_by_status' => $dashboard->getOrderMetrics()->getOrdersByStatus(),
                        'orders_by_complexity' => $dashboard->getOrderMetrics()->getOrdersByComplexity(),
                        'order_trend' => $dashboard->getOrderMetrics()->getOrderTrend()
                    ],
                    'revenue_metrics' => [
                        'total_revenue' => [
                            'amount' => $dashboard->getRevenueMetrics()->getTotalRevenue()->getAmount(),
                            'currency' => $dashboard->getRevenueMetrics()->getTotalRevenue()->getCurrency()
                        ],
                        'monthly_revenue' => $dashboard->getRevenueMetrics()->getMonthlyRevenue(),
                        'revenue_by_customer' => $dashboard->getRevenueMetrics()->getRevenueByCustomer(),
                        'revenue_growth_rate' => $dashboard->getRevenueMetrics()->getRevenueGrowthRate(),
                        'average_revenue_per_order' => [
                            'amount' => $dashboard->getRevenueMetrics()->getAverageRevenuePerOrder()->getAmount(),
                            'currency' => $dashboard->getRevenueMetrics()->getAverageRevenuePerOrder()->getCurrency()
                        ],
                        'recurring_revenue' => $dashboard->getRevenueMetrics()->getRecurringRevenue(),
                        'revenue_forecast' => $dashboard->getRevenueMetrics()->getRevenueForecast()
                    ],
                    'profitability_metrics' => [
                        'total_revenue' => [
                            'amount' => $dashboard->getProfitabilityMetrics()->getTotalRevenue()->getAmount(),
                            'currency' => $dashboard->getProfitabilityMetrics()->getTotalRevenue()->getCurrency()
                        ],
                        'total_costs' => [
                            'amount' => $dashboard->getProfitabilityMetrics()->getTotalCosts()->getAmount(),
                            'currency' => $dashboard->getProfitabilityMetrics()->getTotalCosts()->getCurrency()
                        ],
                        'gross_profit' => [
                            'amount' => $dashboard->getProfitabilityMetrics()->getGrossProfit()->getAmount(),
                            'currency' => $dashboard->getProfitabilityMetrics()->getGrossProfit()->getCurrency()
                        ],
                        'gross_profit_margin' => $dashboard->getProfitabilityMetrics()->getGrossProfitMargin(),
                        'profit_by_customer' => $dashboard->getProfitabilityMetrics()->getProfitByCustomer(),
                        'profit_by_vendor' => $dashboard->getProfitabilityMetrics()->getProfitByVendor(),
                        'profit_by_product' => $dashboard->getProfitabilityMetrics()->getProfitByProduct(),
                        'profit_trend' => $dashboard->getProfitabilityMetrics()->getProfitTrend(),
                        'break_even_analysis' => $dashboard->getProfitabilityMetrics()->getBreakEvenAnalysis()
                    ],
                    'vendor_metrics' => [
                        'total_vendors' => $dashboard->getVendorMetrics()->getTotalVendors(),
                        'active_vendors' => $dashboard->getVendorMetrics()->getActiveVendors(),
                        'vendor_performance' => $dashboard->getVendorMetrics()->getVendorPerformance(),
                        'average_on_time_delivery' => $dashboard->getVendorMetrics()->getAverageOnTimeDelivery(),
                        'top_performing_vendors' => $dashboard->getVendorMetrics()->getTopPerformingVendors(),
                        'vendor_quality_scores' => $dashboard->getVendorMetrics()->getVendorQualityScores(),
                        'vendor_cost_analysis' => $dashboard->getVendorMetrics()->getVendorCostAnalysis()
                    ],
                    'customer_metrics' => [
                        'total_customers' => $dashboard->getCustomerMetrics()->getTotalCustomers(),
                        'active_customers' => $dashboard->getCustomerMetrics()->getActiveCustomers(),
                        'new_customers' => $dashboard->getCustomerMetrics()->getNewCustomers(),
                        'customer_analysis' => $dashboard->getCustomerMetrics()->getCustomerAnalysis(),
                        'top_customers' => $dashboard->getCustomerMetrics()->getTopCustomers(),
                        'customer_retention_rate' => $dashboard->getCustomerMetrics()->getCustomerRetentionRate(),
                        'average_customer_lifetime_value' => $dashboard->getCustomerMetrics()->getAverageCustomerLifetimeValue()
                    ],
                    'operational_metrics' => [
                        'total_orders' => $dashboard->getOperationalMetrics()->getTotalOrders(),
                        'average_processing_time' => $dashboard->getOperationalMetrics()->getAverageProcessingTime(),
                        'production_efficiency' => $dashboard->getOperationalMetrics()->getProductionEfficiency(),
                        'resource_utilization' => $dashboard->getOperationalMetrics()->getResourceUtilization(),
                        'capacity_utilization' => $dashboard->getOperationalMetrics()->getCapacityUtilization(),
                        'bottleneck_analysis' => $dashboard->getOperationalMetrics()->getBottleneckAnalysis(),
                        'performance_indicators' => $dashboard->getOperationalMetrics()->getPerformanceIndicators()
                    ],
                    'quality_metrics' => [
                        'quality_score' => $dashboard->getQualityMetrics()->getQualityScore(),
                        'defect_rate' => $dashboard->getQualityMetrics()->getDefectRate(),
                        'rework_rate' => $dashboard->getQualityMetrics()->getReworkRate(),
                        'customer_satisfaction_score' => $dashboard->getQualityMetrics()->getCustomerSatisfactionScore(),
                        'quality_trends' => $dashboard->getQualityMetrics()->getQualityTrends(),
                        'improvement_opportunities' => $dashboard->getQualityMetrics()->getImprovementOpportunities()
                    ],
                    'trends' => [
                        'order_trends' => $dashboard->getTrends()->getOrderTrends(),
                        'revenue_trends' => $dashboard->getTrends()->getRevenueTrends(),
                        'customer_trends' => $dashboard->getTrends()->getCustomerTrends(),
                        'seasonal_patterns' => $dashboard->getTrends()->getSeasonalPatterns(),
                        'growth_indicators' => $dashboard->getTrends()->getGrowthIndicators(),
                        'market_insights' => $dashboard->getTrends()->getMarketInsights()
                    ],
                    'forecasts' => [
                        'revenue_forecast' => $dashboard->getForecasts()->getRevenueForecast(),
                        'order_forecast' => $dashboard->getForecasts()->getOrderForecast(),
                        'customer_growth_forecast' => $dashboard->getForecasts()->getCustomerGrowthForecast(),
                        'capacity_forecast' => $dashboard->getForecasts()->getCapacityForecast(),
                        'confidence_intervals' => $dashboard->getForecasts()->getConfidenceIntervals(),
                        'assumptions' => $dashboard->getForecasts()->getAssumptions()
                    ],
                    'generated_at' => $dashboard->getGeneratedAt()->format('Y-m-d H:i:s')
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to generate executive dashboard',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get order analytics
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function getOrderAnalytics(Request $request): JsonResponse
    {
        $request->validate([
            'start_date' => 'required|date',
            'end_date' => 'required|date|after:start_date',
        ]);

        try {
            $tenantId = new UuidValueObject($request->user()->tenant_id);
            $period = new DatePeriod(
                new DateTime($request->start_date),
                new DateInterval('P1D'),
                new DateTime($request->end_date)
            );

            $dashboard = $this->analyticsService->generateExecutiveDashboard($tenantId, $period);
            $orderMetrics = $dashboard->getOrderMetrics();

            return response()->json([
                'success' => true,
                'data' => [
                    'total_orders' => $orderMetrics->getTotalOrders(),
                    'completed_orders' => $orderMetrics->getCompletedOrders(),
                    'cancelled_orders' => $orderMetrics->getCancelledOrders(),
                    'in_progress_orders' => $orderMetrics->getInProgressOrders(),
                    'average_order_value' => [
                        'amount' => $orderMetrics->getAverageOrderValue()->getAmount(),
                        'currency' => $orderMetrics->getAverageOrderValue()->getCurrency()
                    ],
                    'completion_rate' => $orderMetrics->getOrderCompletionRate(),
                    'average_processing_time_days' => $orderMetrics->getAverageProcessingTimeDays(),
                    'orders_by_status' => $orderMetrics->getOrdersByStatus(),
                    'orders_by_complexity' => $orderMetrics->getOrdersByComplexity(),
                    'order_trend' => $orderMetrics->getOrderTrend()
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to get order analytics',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get revenue analytics
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function getRevenueAnalytics(Request $request): JsonResponse
    {
        $request->validate([
            'start_date' => 'required|date',
            'end_date' => 'required|date|after:start_date',
        ]);

        try {
            $tenantId = new UuidValueObject($request->user()->tenant_id);
            $period = new DatePeriod(
                new DateTime($request->start_date),
                new DateInterval('P1D'),
                new DateTime($request->end_date)
            );

            $dashboard = $this->analyticsService->generateExecutiveDashboard($tenantId, $period);
            $revenueMetrics = $dashboard->getRevenueMetrics();

            return response()->json([
                'success' => true,
                'data' => [
                    'total_revenue' => [
                        'amount' => $revenueMetrics->getTotalRevenue()->getAmount(),
                        'currency' => $revenueMetrics->getTotalRevenue()->getCurrency()
                    ],
                    'monthly_revenue' => $revenueMetrics->getMonthlyRevenue(),
                    'revenue_by_customer' => $revenueMetrics->getRevenueByCustomer(),
                    'revenue_growth_rate' => $revenueMetrics->getRevenueGrowthRate(),
                    'average_revenue_per_order' => [
                        'amount' => $revenueMetrics->getAverageRevenuePerOrder()->getAmount(),
                        'currency' => $revenueMetrics->getAverageRevenuePerOrder()->getCurrency()
                    ],
                    'recurring_revenue' => $revenueMetrics->getRecurringRevenue(),
                    'revenue_forecast' => $revenueMetrics->getRevenueForecast()
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to get revenue analytics',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get vendor performance analytics
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function getVendorAnalytics(Request $request): JsonResponse
    {
        $request->validate([
            'start_date' => 'required|date',
            'end_date' => 'required|date|after:start_date',
        ]);

        try {
            $tenantId = new UuidValueObject($request->user()->tenant_id);
            $period = new DatePeriod(
                new DateTime($request->start_date),
                new DateInterval('P1D'),
                new DateTime($request->end_date)
            );

            $dashboard = $this->analyticsService->generateExecutiveDashboard($tenantId, $period);
            $vendorMetrics = $dashboard->getVendorMetrics();

            return response()->json([
                'success' => true,
                'data' => [
                    'total_vendors' => $vendorMetrics->getTotalVendors(),
                    'active_vendors' => $vendorMetrics->getActiveVendors(),
                    'vendor_performance' => $vendorMetrics->getVendorPerformance(),
                    'average_on_time_delivery' => $vendorMetrics->getAverageOnTimeDelivery(),
                    'top_performing_vendors' => $vendorMetrics->getTopPerformingVendors(),
                    'vendor_quality_scores' => $vendorMetrics->getVendorQualityScores(),
                    'vendor_cost_analysis' => $vendorMetrics->getVendorCostAnalysis()
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to get vendor analytics',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get customer analytics
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function getCustomerAnalytics(Request $request): JsonResponse
    {
        $request->validate([
            'start_date' => 'required|date',
            'end_date' => 'required|date|after:start_date',
        ]);

        try {
            $tenantId = new UuidValueObject($request->user()->tenant_id);
            $period = new DatePeriod(
                new DateTime($request->start_date),
                new DateInterval('P1D'),
                new DateTime($request->end_date)
            );

            $dashboard = $this->analyticsService->generateExecutiveDashboard($tenantId, $period);
            $customerMetrics = $dashboard->getCustomerMetrics();

            return response()->json([
                'success' => true,
                'data' => [
                    'total_customers' => $customerMetrics->getTotalCustomers(),
                    'active_customers' => $customerMetrics->getActiveCustomers(),
                    'new_customers' => $customerMetrics->getNewCustomers(),
                    'customer_analysis' => $customerMetrics->getCustomerAnalysis(),
                    'top_customers' => $customerMetrics->getTopCustomers(),
                    'customer_retention_rate' => $customerMetrics->getCustomerRetentionRate(),
                    'average_customer_lifetime_value' => $customerMetrics->getAverageCustomerLifetimeValue()
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to get customer analytics',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get production analytics
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function getProductionAnalytics(Request $request): JsonResponse
    {
        $request->validate([
            'start_date' => 'required|date',
            'end_date' => 'required|date|after:start_date',
        ]);

        try {
            $tenantId = new UuidValueObject($request->user()->tenant_id);
            $period = new DatePeriod(
                new DateTime($request->start_date),
                new DateInterval('P1D'),
                new DateTime($request->end_date)
            );

            $dashboard = $this->analyticsService->generateExecutiveDashboard($tenantId, $period);
            $operationalMetrics = $dashboard->getOperationalMetrics();
            $qualityMetrics = $dashboard->getQualityMetrics();

            return response()->json([
                'success' => true,
                'data' => [
                    'operational_metrics' => [
                        'total_orders' => $operationalMetrics->getTotalOrders(),
                        'average_processing_time' => $operationalMetrics->getAverageProcessingTime(),
                        'production_efficiency' => $operationalMetrics->getProductionEfficiency(),
                        'resource_utilization' => $operationalMetrics->getResourceUtilization(),
                        'capacity_utilization' => $operationalMetrics->getCapacityUtilization(),
                        'bottleneck_analysis' => $operationalMetrics->getBottleneckAnalysis(),
                        'performance_indicators' => $operationalMetrics->getPerformanceIndicators()
                    ],
                    'quality_metrics' => [
                        'quality_score' => $qualityMetrics->getQualityScore(),
                        'defect_rate' => $qualityMetrics->getDefectRate(),
                        'rework_rate' => $qualityMetrics->getReworkRate(),
                        'customer_satisfaction_score' => $qualityMetrics->getCustomerSatisfactionScore(),
                        'quality_trends' => $qualityMetrics->getQualityTrends(),
                        'improvement_opportunities' => $qualityMetrics->getImprovementOpportunities()
                    ]
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to get production analytics',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}