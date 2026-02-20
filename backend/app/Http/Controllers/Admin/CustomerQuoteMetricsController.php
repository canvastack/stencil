<?php

namespace App\Http\Controllers\Admin;

use App\Application\CustomerQuote\Services\CustomerQuoteMonitoringService;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Customer Quote Metrics Controller
 * 
 * Provides monitoring and analytics endpoints for customer quotes
 */
class CustomerQuoteMetricsController extends Controller
{
    public function __construct(
        private CustomerQuoteMonitoringService $monitoringService
    ) {}

    /**
     * Get comprehensive metrics dashboard
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function dashboard(Request $request): JsonResponse
    {
        $tenantId = $request->user()->tenant_id;
        $days = $request->input('days', 30);

        $metrics = $this->monitoringService->getMetricsDashboard($tenantId, $days);

        return response()->json([
            'success' => true,
            'data' => $metrics,
            'period' => [
                'days' => $days,
                'from' => now()->subDays($days)->toDateString(),
                'to' => now()->toDateString(),
            ],
        ]);
    }

    /**
     * Get quote acceptance rate
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function acceptanceRate(Request $request): JsonResponse
    {
        $tenantId = $request->user()->tenant_id;
        $days = $request->input('days', 30);

        $rate = $this->monitoringService->getQuoteAcceptanceRate($tenantId, $days);

        return response()->json([
            'success' => true,
            'data' => [
                'acceptance_rate' => $rate,
                'period_days' => $days,
            ],
        ]);
    }

    /**
     * Get negotiation metrics
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function negotiationMetrics(Request $request): JsonResponse
    {
        $tenantId = $request->user()->tenant_id;
        $days = $request->input('days', 30);

        $metrics = [
            'counter_offer_rate' => $this->monitoringService->getCounterOfferRate($tenantId, $days),
            'avg_negotiation_rounds' => $this->monitoringService->getAverageNegotiationRounds($tenantId, $days),
        ];

        return response()->json([
            'success' => true,
            'data' => $metrics,
        ]);
    }

    /**
     * Get approval metrics
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function approvalMetrics(Request $request): JsonResponse
    {
        $tenantId = $request->user()->tenant_id;
        $days = $request->input('days', 30);

        $metrics = [
            'auto_approval_rate' => $this->monitoringService->getAutoApprovalRate($tenantId, $days),
            'avg_time_to_acceptance' => $this->monitoringService->getAverageTimeToAcceptance($tenantId, $days),
            'approval_reasons' => $this->monitoringService->getApprovalReasonsBreakdown($tenantId, $days),
        ];

        return response()->json([
            'success' => true,
            'data' => $metrics,
        ]);
    }

    /**
     * Get rejection metrics
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function rejectionMetrics(Request $request): JsonResponse
    {
        $tenantId = $request->user()->tenant_id;
        $days = $request->input('days', 30);

        $metrics = [
            'rejection_rate' => $this->monitoringService->getQuoteRejectionRate($tenantId, $days),
            'rejection_reasons' => $this->monitoringService->getRejectionReasonsBreakdown($tenantId, $days),
        ];

        return response()->json([
            'success' => true,
            'data' => $metrics,
        ]);
    }

    /**
     * Get error metrics
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function errorMetrics(Request $request): JsonResponse
    {
        $days = $request->input('days', 7);

        $metrics = [
            'pdf_generation_errors' => $this->monitoringService->getPDFGenerationErrorCount($days),
            'email_delivery_errors' => $this->monitoringService->getEmailDeliveryErrorCount($days),
        ];

        return response()->json([
            'success' => true,
            'data' => $metrics,
        ]);
    }

    /**
     * Get expiry metrics
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function expiryMetrics(Request $request): JsonResponse
    {
        $tenantId = $request->user()->tenant_id;
        $days = $request->input('days', 30);

        $rate = $this->monitoringService->getQuoteExpiryRate($tenantId, $days);

        return response()->json([
            'success' => true,
            'data' => [
                'expiry_rate' => $rate,
                'period_days' => $days,
            ],
        ]);
    }

    /**
     * Trigger manual alert check
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function triggerAlertCheck(Request $request): JsonResponse
    {
        $tenantId = $request->user()->tenant_id;

        $alertingService = app(\App\Application\CustomerQuote\Services\CustomerQuoteAlertingService::class);
        $result = $alertingService->triggerManualCheck($tenantId);

        return response()->json([
            'success' => true,
            'message' => 'Alert check completed',
            'data' => $result,
        ]);
    }
}
