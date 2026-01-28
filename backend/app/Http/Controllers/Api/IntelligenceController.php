<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Domain\Intelligence\Services\RecommendationEngine;
use App\Domain\Intelligence\Services\PredictiveAnalyticsService;
use App\Domain\Intelligence\Services\DataAnalysisService;
use App\Domain\Customer\Repositories\CustomerRepositoryInterface;
use App\Domain\Order\Repositories\OrderRepositoryInterface;
use App\Domain\Shared\ValueObjects\UuidValueObject;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

/**
 * Intelligence Controller
 * 
 * Handles AI-powered intelligence features including recommendations,
 * predictive analytics, and data insights.
 */
class IntelligenceController extends Controller
{
    public function __construct(
        private RecommendationEngine $recommendationEngine,
        private PredictiveAnalyticsService $predictiveAnalytics,
        private DataAnalysisService $dataAnalysisService,
        private CustomerRepositoryInterface $customerRepository,
        private OrderRepositoryInterface $orderRepository
    ) {}

    /**
     * Generate order recommendations for a customer
     */
    public function generateOrderRecommendations(Request $request, string $customerId): JsonResponse
    {
        try {
            $customerUuid = new UuidValueObject($customerId);
            $customer = $this->customerRepository->findById($customerUuid);
            
            if (!$customer) {
                return response()->json([
                    'error' => 'Customer not found'
                ], 404);
            }
            
            // Verify customer belongs to current tenant
            $tenantId = Auth::user()->tenant_id;
            if ($customer->getTenantId()->getValue() !== $tenantId) {
                return response()->json([
                    'error' => 'Unauthorized access to customer'
                ], 403);
            }
            
            $recommendations = $this->recommendationEngine->generateOrderRecommendations($customer);
            
            return response()->json([
                'success' => true,
                'data' => $recommendations->toArray()
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to generate recommendations',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Predict order success probability
     */
    public function predictOrderSuccess(Request $request, string $orderId): JsonResponse
    {
        try {
            $orderUuid = new UuidValueObject($orderId);
            $order = $this->orderRepository->findById($orderUuid);
            
            if (!$order) {
                return response()->json([
                    'error' => 'Order not found'
                ], 404);
            }
            
            // Verify order belongs to current tenant
            $tenantId = Auth::user()->tenant_id;
            if ($order->getTenantId()->getValue() !== $tenantId) {
                return response()->json([
                    'error' => 'Unauthorized access to order'
                ], 403);
            }
            
            $prediction = $this->recommendationEngine->predictOrderSuccess($order);
            
            return response()->json([
                'success' => true,
                'data' => $prediction->toArray()
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to predict order success',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get market trend predictions
     */
    public function getMarketTrends(Request $request): JsonResponse
    {
        try {
            $tenantId = new UuidValueObject(Auth::user()->tenant_id);
            $monthsAhead = $request->input('months', 6);
            
            $trends = $this->predictiveAnalytics->predictMarketTrends($tenantId, $monthsAhead);
            
            return response()->json([
                'success' => true,
                'data' => $trends->toArray()
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to generate market trends',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get inventory optimization recommendations
     */
    public function getInventoryOptimization(Request $request): JsonResponse
    {
        try {
            $tenantId = new UuidValueObject(Auth::user()->tenant_id);
            $forecastMonths = $request->input('forecast_months', 3);
            
            $optimization = $this->predictiveAnalytics->optimizeInventory($tenantId, $forecastMonths);
            
            return response()->json([
                'success' => true,
                'data' => $optimization->toArray()
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to optimize inventory',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get demand forecast
     */
    public function getDemandForecast(Request $request): JsonResponse
    {
        try {
            $tenantId = new UuidValueObject(Auth::user()->tenant_id);
            $months = $request->input('months', 3);
            
            $forecast = $this->predictiveAnalytics->forecastDemand($tenantId, $months);
            
            return response()->json([
                'success' => true,
                'data' => $forecast->toArray()
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to generate demand forecast',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get customer churn predictions
     */
    public function getCustomerChurnPredictions(Request $request): JsonResponse
    {
        try {
            $tenantId = new UuidValueObject(Auth::user()->tenant_id);
            
            $churnPrediction = $this->predictiveAnalytics->predictCustomerChurn($tenantId);
            
            return response()->json([
                'success' => true,
                'data' => $churnPrediction->toArray()
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to predict customer churn',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get revenue predictions
     */
    public function getRevenuePredictions(Request $request): JsonResponse
    {
        try {
            $tenantId = new UuidValueObject(Auth::user()->tenant_id);
            $months = $request->input('months', 6);
            
            $predictions = $this->predictiveAnalytics->predictRevenue($tenantId, $months);
            
            return response()->json([
                'success' => true,
                'data' => $predictions
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to predict revenue',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Generate data insights from business data
     */
    public function generateDataInsights(Request $request): JsonResponse
    {
        try {
            $tenantId = new UuidValueObject(Auth::user()->tenant_id);
            
            // Get business data for analysis
            $orders = $this->orderRepository->findByTenant($tenantId);
            $orderData = array_map(fn($order) => [
                'total_amount' => $order->getTotalAmount()->getAmount(),
                'created_at' => $order->getCreatedAt()->format('Y-m-d'),
                'customer_id' => $order->getCustomerId()->getValue(),
                'vendor_id' => $order->getVendorId()?->getValue(),
                'status' => $order->getStatus()->value,
                'items' => $order->getItems()
            ], $orders);
            
            $insights = $this->dataAnalysisService->generateInsights($orderData);
            
            return response()->json([
                'success' => true,
                'data' => $insights->toArray()
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to generate data insights',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get AI dashboard summary
     */
    public function getAIDashboard(Request $request): JsonResponse
    {
        try {
            $tenantId = new UuidValueObject(Auth::user()->tenant_id);
            
            // Get key AI metrics and insights
            $marketTrends = $this->predictiveAnalytics->predictMarketTrends($tenantId, 3);
            $inventoryOptimization = $this->predictiveAnalytics->optimizeInventory($tenantId, 3);
            $churnPrediction = $this->predictiveAnalytics->predictCustomerChurn($tenantId);
            
            // Get recent recommendations count
            $customers = $this->customerRepository->findByTenant($tenantId);
            $recentRecommendations = 0;
            
            if (!empty($customers)) {
                $sampleCustomer = $customers[0];
                $recommendations = $this->recommendationEngine->generateOrderRecommendations($sampleCustomer);
                $recentRecommendations = count($recommendations->getProductRecommendations());
            }
            
            $dashboard = [
                'market_outlook' => $marketTrends->getMarketOutlook(),
                'market_confidence' => $marketTrends->getConfidence(),
                'inventory_savings' => $inventoryOptimization->getCostSavings(),
                'service_level' => $inventoryOptimization->getServiceLevel(),
                'high_risk_customers' => count($churnPrediction->getHighRiskCustomers()),
                'average_churn_rate' => $churnPrediction->getAverageChurnRate(),
                'recent_recommendations' => $recentRecommendations,
                'ai_features_active' => [
                    'recommendations' => true,
                    'market_trends' => true,
                    'inventory_optimization' => true,
                    'churn_prediction' => true,
                    'demand_forecasting' => true
                ],
                'last_updated' => now()->toISOString()
            ];
            
            return response()->json([
                'success' => true,
                'data' => $dashboard
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to load AI dashboard',
                'message' => $e->getMessage()
            ], 500);
        }
    }
}